"use client";

// src/components/code/games/farm/useVisitorSystem.ts
//
// 손님 시스템 메인 훅. 매 틱 호출되며:
//   1) 영업시간 + 한도 + 빈 방 체크 → 도착 확률 굴림 → 큐에 추가
//   2) 활성 방문 만료 체크 → 떠나는 손님 정리 + 방문료 지급
//   3) 일자 변경 시 visitsToday 리셋
//
// 메모리 상태만 (DB 영속은 다음 iteration). 새로고침 시 진행중 손님 사라짐.

import { useEffect, useRef, useState } from "react";
import type { RoomRow, AnimalRow } from "./dbTypes";
import { TICKS_PER_DAY } from "./dbTypes";
import type { FarmClock } from "./useFarmClock";
import {
  ARRIVAL_BASE_CHANCE,
  FAME_ARRIVAL_BONUS,
  dailyLimit,
  VISIT_TICKS_DEFAULT,
} from "./visitorConfig";
import {
  spawnVisitor,
  calcVisitorFee,
  defaultVisitDuration,
  deriveSeed,
  type Visitor,
  type ActiveVisit,
} from "./visitorSystem";

export type VisitorSystem = {
  /** 도착했지만 플레이어가 아직 처리 안 한 손님 (FIFO) */
  pendingArrivals: Visitor[];
  /** 방 id → 현재 그 방에 있는 손님 */
  activeVisits: Map<string, ActiveVisit>;
  /** 오늘 받은 손님 수 (수락된 것만 카운트) */
  visitsToday: number;
  /** 현재 명성 기준 하루 상한 */
  todayLimit: number;
  /** 영업시간 외에는 false — UI 가 알랏 표시 여부 결정 */
  isOpen: boolean;

  /** 큐 첫 번째 손님을 받아 지정한 방에 배정 */
  acceptToRoom: (visitorId: string, roomId: string) => void;
  /** 큐에서 그 손님을 거절 (제거만, 카운트 안 함) */
  decline: (visitorId: string) => void;
};

export function useVisitorSystem(args: {
  saveId: string;
  clock: FarmClock;
  rooms: RoomRow[];
  roomAnimals: AnimalRow[];
  fame: number;
  farmLevel: number;
  /** 손님이 떠나며 농장에 돈을 낼 때 호출 */
  onFeeReceived: (amount: number) => void;
  /** 방문이 끝났을 때 — 임신 판별 등 후처리. roomId 로 방 식별. */
  onVisitEnded?: (visit: ActiveVisit) => void;
}): VisitorSystem {
  const { clock, saveId, rooms, roomAnimals, fame, farmLevel, onFeeReceived, onVisitEnded } = args;

  const [pendingArrivals, setPendingArrivals] = useState<Visitor[]>([]);
  const [activeVisits, setActiveVisits] = useState<Map<string, ActiveVisit>>(new Map());
  const [visitsToday, setVisitsToday] = useState(0);

  // 같은 (day,tick) 으로 effect 중복 처리 방지
  const lastProcessed = useRef<{ day: number; tick: number } | null>(null);
  // onFeeReceived / onVisitEnded 가 매 렌더 새 함수여도 stale 안 되게
  const onFeeRef = useRef(onFeeReceived);
  const onVisitEndedRef = useRef(onVisitEnded);
  useEffect(() => {
    onFeeRef.current = onFeeReceived;
    onVisitEndedRef.current = onVisitEnded;
  }, [onFeeReceived, onVisitEnded]);
  // tick effect 가 deps 에 state 를 안 넣고도 최신 값 읽도록 ref 동기화
  const stateRef = useRef({ pendingArrivals, activeVisits, visitsToday });
  useEffect(() => {
    stateRef.current = { pendingArrivals, activeVisits, visitsToday };
  }, [pendingArrivals, activeVisits, visitsToday]);
  // rooms / roomAnimals / fame / level 등 prop 도 같은 이유로 ref 화
  const propsRef = useRef({ rooms, roomAnimals, fame, farmLevel });
  useEffect(() => {
    propsRef.current = { rooms, roomAnimals, fame, farmLevel };
  }, [rooms, roomAnimals, fame, farmLevel]);

  // 매 틱 처리
  useEffect(() => {
    const last = lastProcessed.current;
    if (last && last.day === clock.day && last.tick === clock.tick) return;
    const prevDay = last?.day ?? clock.day;
    lastProcessed.current = { day: clock.day, tick: clock.tick };

    // 일자 롤오버 → 카운터 리셋
    if (clock.day !== prevDay) {
      setVisitsToday(0);
    }


    const absTick = clock.day * TICKS_PER_DAY + clock.tick;
    const cur = stateRef.current;
    const p = propsRef.current;

      // 폐점 도달 시 대기실에 남은 손님은 돌려보냄. 진행 중 방문은 그대로 유지.
    if (clock.phase !== "open" && cur.pendingArrivals.length > 0) {
      setPendingArrivals([]);
    }

    // 1) 만료된 방문 정리 → 방문료 지급 + 종료 콜백
    let totalFee = 0;
    let mutated = false;
    const nextActive = new Map(cur.activeVisits);
    const endedVisits: ActiveVisit[] = [];
    for (const [roomId, visit] of cur.activeVisits) {
      const endAt = visit.started_at_absolute_tick + visit.duration_ticks;
      if (absTick >= endAt) {
        totalFee += visit.fee;
        nextActive.delete(roomId);
        endedVisits.push(visit);
        mutated = true;
      }
    }
    if (mutated) {
      setActiveVisits(nextActive);
      if (totalFee > 0) onFeeRef.current(totalFee);
      for (const v of endedVisits) onVisitEndedRef.current?.(v);
    }

    // 2) 새 손님 도착 시도
    //    조건: 영업시간 + 상한 미달 + 빈 방 있음 + 이미 큐에 처리 대기 없음
    if (clock.phase !== "open") return;
    if (cur.visitsToday >= dailyLimit(p.fame)) return;
    if (cur.pendingArrivals.length > 0) return;

    const availableRoomCount = p.rooms.filter((r) => !nextActive.has(r.id)).length;
    if (availableRoomCount === 0) return;

    const chance = ARRIVAL_BASE_CHANCE + p.fame * FAME_ARRIVAL_BONUS;
    if (Math.random() >= chance) return;

    // 도착! 시드 결정적 → 같은 (save, day, tick) 면 같은 손님
    const seed = deriveSeed("visit", saveId, String(clock.day), String(clock.tick));
    const visitor = spawnVisitor({
      roomAnimals: p.roomAnimals,
      seed,
      arrivedDay: clock.day,
      arrivedTick: clock.tick,
      fame: p.fame,
      farmLevel: p.farmLevel,
    });
    if (!visitor) return;

    setPendingArrivals((prev) => [...prev, visitor]);
  }, [clock.day, clock.tick, clock.phase, saveId]);

  // ── 액션 ─────────────────────────────────────────────────────────────
  const acceptToRoom = (visitorId: string, roomId: string) => {
    const visitor = pendingArrivals.find((v) => v.id === visitorId);
    if (!visitor) return;
    if (activeVisits.has(roomId)) return; // 방이 이미 차있음
    if (!rooms.some((r) => r.id === roomId)) return; // 모르는 방

    const room = rooms.find((r) => r.id === roomId)!;
    const inRoomAnimals = roomAnimals.filter((a) => a.room_id === roomId);
    const fee = calcVisitorFee({
      visitor,
      roomAnimals: inRoomAnimals,
      farmLevel,
      fame,
    });

    const absTick = clock.day * TICKS_PER_DAY + clock.tick;
    const visit: ActiveVisit = {
      visitor,
      roomId: room.id,
      started_at_absolute_tick: absTick,
      duration_ticks: defaultVisitDuration() || VISIT_TICKS_DEFAULT,
      fee,
    };

    setActiveVisits((prev) => {
      const next = new Map(prev);
      next.set(room.id, visit);
      return next;
    });
    setPendingArrivals((prev) => prev.filter((v) => v.id !== visitorId));
    setVisitsToday((n) => n + 1);
  };

  const decline = (visitorId: string) => {
    setPendingArrivals((prev) => prev.filter((v) => v.id !== visitorId));
  };

  return {
    pendingArrivals,
    activeVisits,
    visitsToday,
    todayLimit: dailyLimit(fame),
    isOpen: clock.phase === "open",
    acceptToRoom,
    decline,
  };
}