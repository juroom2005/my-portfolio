// src/components/code/games/farm/useFarmClock.ts
//
// 농장 시간 진행 훅.
// 7초마다 1틱, 144틱 = 1일. 자정에 일자 롤오버.
// 매 12틱(약 84초) + 페이지 hidden 시 server action 으로 DB 동기화.
//
// 향후 손님 방문 / 임신 진행 등도 이 훅에서 emit 한 이벤트를 구독하는 식으로 확장 가능.

import { useEffect, useRef, useState } from "react";
import {
  TICKS_PER_DAY,
  TICK_OPEN,
  TICK_CLOSE,
  TICK_WAKE,
  TICK_MS_REAL,
} from "./dbTypes";
import { saveClockAction } from "@/app/code/games/farm/[saveId]/actions";

export type DayPhase = "night" | "morning" | "open" | "evening";

export type FarmClock = {
  day: number;
  tick: number;
  hhmm: string;
  phase: DayPhase;
  phaseLabel: string;
  paused: boolean;
  setPaused: (v: boolean) => void;
  togglePaused: () => void;
  /** 임의 시각으로 점프 (디버그용). 즉시 DB 동기화. */
  setTime: (day: number, tick: number) => void;
  /** 오늘 안에서 그 틱이 더 미래면 그쪽으로, 이미 지났으면 다음날 같은 틱으로 점프. */
  jumpToTick: (targetTick: number) => void;
  /** 일자만 +N (틱 유지). */
  jumpDays: (delta: number) => void;
  /** 틱 +N — 144 넘으면 일자 자동 롤오버. */
  jumpTicks: (delta: number) => void;
};

const SAVE_EVERY = 12; // 12틱 ≈ 84초마다 DB 갱신

export function useFarmClock(args: {
  saveId: string;
  initialDay: number;
  initialTick: number;
}): FarmClock {
  const { saveId } = args;
  const [state, setState] = useState({
    day: args.initialDay,
    tick: args.initialTick,
  });
  const [paused, setPaused] = useState(false);

  // 최신 day/tick 을 unmount/hidden 콜백에서 읽기 위한 ref
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  // 자동 진행 루프
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setState((prev) => {
        const nextTick = prev.tick + 1;
        if (nextTick >= TICKS_PER_DAY) return { day: prev.day + 1, tick: 0 };
        return { day: prev.day, tick: nextTick };
      });
    }, TICK_MS_REAL);
    return () => window.clearInterval(id);
  }, [paused]);

  // 주기적 DB 동기화 (12틱마다 + 일자 롤오버 직후)
  useEffect(() => {
    if (state.tick === 0 || state.tick % SAVE_EVERY === 0) {
      void saveClockAction(saveId, state.day, state.tick);
    }
  }, [state.tick, state.day, saveId]);

  // 페이지 숨김 / 언로드 시 즉시 저장
  useEffect(() => {
    const flush = () => {
      const cur = latest.current;
      void saveClockAction(saveId, cur.day, cur.tick);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", flush);
      flush(); // unmount 시에도 한 번
    };
  }, [saveId]);

  const phase: DayPhase =
    state.tick < TICK_WAKE
      ? "night"
      : state.tick < TICK_OPEN
        ? "morning"
        : state.tick < TICK_CLOSE
          ? "open"
          : "evening";

  const phaseLabel: string = {
    night: "한밤중",
    morning: "이른 아침",
    open: "영업중",
    evening: "저녁 정리",
  }[phase];

  // ── 점프 메서드 (디버그용) ────────────────────────────────────────────
  // 모두 호출 즉시 DB 동기화 — 게임 진행 상태가 항상 일관되게 유지.
  // 주의: setState updater 안에서 server action 호출 금지 (라우터 갱신과
  //       렌더가 충돌). 항상 updater 밖에서 호출.
  const setTime = (day: number, tick: number) => {
    const d = Math.max(1, Math.floor(day));
    const t = ((Math.floor(tick) % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY;
    setState({ day: d, tick: t });
    void saveClockAction(saveId, d, t);
  };

  const jumpToTick = (targetTick: number) => {
    const t = ((Math.floor(targetTick) % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY;
    const nextDay = t > state.tick ? state.day : state.day + 1;
    setState({ day: nextDay, tick: t });
    void saveClockAction(saveId, nextDay, t);
  };

  const jumpDays = (delta: number) => {
    const d = Math.max(1, state.day + Math.floor(delta));
    setState({ day: d, tick: state.tick });
    void saveClockAction(saveId, d, state.tick);
  };

  const jumpTicks = (delta: number) => {
    const total = state.day * TICKS_PER_DAY + state.tick + Math.floor(delta);
    const d = Math.max(1, Math.floor(total / TICKS_PER_DAY));
    const t = ((total % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY;
    setState({ day: d, tick: t });
    void saveClockAction(saveId, d, t);
  };

  return {
    day: state.day,
    tick: state.tick,
    hhmm: tickToHHMM(state.tick),
    phase,
    phaseLabel,
    paused,
    setPaused,
    togglePaused: () => setPaused((p) => !p),
    setTime,
    jumpToTick,
    jumpDays,
    jumpTicks,
  };
}

// ── 시간 변환 ───────────────────────────────────────────────────────────
// 1틱 = 10분, 자정(00:00) 부터 카운트.
export function tickToHHMM(tick: number): string {
  const minutes = tick * 10;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}