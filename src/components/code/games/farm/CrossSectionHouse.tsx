"use client";

// src/components/code/games/farm/CrossSectionHouse.tsx
//
// 단면도 농장 집.
// CodePen "Responsive House" 의 외곽선·지붕·굴뚝 미감은 유지.
// 본체는 통으로 트여서 방 그리드가 그대로 보임 (인형의 집 단면).
//
// 입력:
//   level         — 농장 레벨 (제목 / 발달 단계 표시용)
//   rooms         — DB 방 row
//   roomAnimals   — status='room' 인 동물들 (room_id 로 묶어 렌더)
//   phase         — 시간대 (낮/밤 배경 전환)
//   currentDay    — AnimalCard 가 나이 계산할 때 사용

import { useMemo } from "react";
import type { RoomRow, AnimalRow } from "./dbTypes";
import AnimalCard from "./AnimalCard";
import type { ActiveVisit } from "./visitorSystem";
import { describeVisitor } from "./visitorSystem";
import "./crossSection.css";

const COLS_PER_FLOOR_DEFAULT = 2;

export type CrossSectionHouseProps = {
  level: number;
  rooms: RoomRow[];
  roomAnimals: AnimalRow[];
  phase: "night" | "morning" | "open" | "evening";
  currentDay: number;
  onAnimalClick?: (animal: AnimalRow) => void;
  /** 손님이 들어가 있는 방들 (room_id → ActiveVisit) — 방이 흔들리고 핀 표시 */
  activeVisits?: Map<string, ActiveVisit>;
};

export default function CrossSectionHouse({
  level,
  rooms,
  roomAnimals,
  phase,
  currentDay,
  onAnimalClick,
  activeVisits,
}: CrossSectionHouseProps) {
  // 방을 층별로 그룹핑
  const { floorsDesc, cols } = useMemo(() => {
    const byFloor = new Map<number, RoomRow[]>();
    let maxPos = COLS_PER_FLOOR_DEFAULT - 1;
    for (const r of rooms) {
      const arr = byFloor.get(r.floor);
      if (arr) arr.push(r);
      else byFloor.set(r.floor, [r]);
      if (r.position > maxPos) maxPos = r.position;
    }

    // 데이터에 방이 하나도 없으면 1층을 빈 층으로 한 줄 표시
    if (byFloor.size === 0) byFloor.set(1, []);

    // 층별 position 정렬
    for (const arr of byFloor.values()) {
      arr.sort((a: RoomRow, b: RoomRow) => a.position - b.position);
    }

    // 높은 층이 위로 가도록 desc
    const sortedFloors = [...byFloor.entries()].sort(
      (a: [number, RoomRow[]], b: [number, RoomRow[]]) => b[0] - a[0],
    );

    return {
      floorsDesc: sortedFloors,
      cols: maxPos + 1, // 모든 층 같은 칸 수
    };
  }, [rooms]);

  const animalsByRoom = useMemo(() => {
    const m = new Map<string, AnimalRow[]>();
    for (const a of roomAnimals) {
      if (!a.room_id) continue;
      const arr = m.get(a.room_id);
      if (arr) arr.push(a);
      else m.set(a.room_id, [a]);
    }
    return m;
  }, [roomAnimals]);

  return (
    <div className="cs-stage" data-phase={phase}>
      <div className="cs-celestial" aria-hidden />

      <div className="cs-house" data-phase={phase}>
        <div className="cs-chimney" aria-hidden />
        <div className="cs-roof" aria-hidden />
        <div className="cs-ledge" aria-hidden />

        <div className="cs-body">
          {floorsDesc.map(([floorNum, floorRooms]: [number, RoomRow[]]) => (
            <FloorRow
              key={floorNum}
              floorNum={floorNum}
              floorRooms={floorRooms}
              cols={cols}
              animalsByRoom={animalsByRoom}
              currentDay={currentDay}
              isGround={floorNum === Math.min(...floorsDesc.map((f: [number, RoomRow[]]) => f[0]))}
              onAnimalClick={onAnimalClick}
              activeVisits={activeVisits}
            />
          ))}
        </div>

        <div className="cs-ground" aria-hidden />
        <div className="cs-grass" aria-hidden />
      </div>

      {/* 레벨 / 안내 */}
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "rgba(34,72,137,0.55)",
          fontFamily: "monospace",
          letterSpacing: "0.18em",
          margin: "14px 0 6px",
        }}
      >
        LVL {String(level).padStart(2, "0")} · {rooms.length}개 방
      </p>
    </div>
  );
}

// ── 한 층 ──────────────────────────────────────────────────────────────
function FloorRow({
  floorNum,
  floorRooms,
  cols,
  animalsByRoom,
  currentDay,
  isGround,
  onAnimalClick,
  activeVisits,
}: {
  floorNum: number;
  floorRooms: RoomRow[];
  cols: number;
  animalsByRoom: Map<string, AnimalRow[]>;
  currentDay: number;
  isGround: boolean;
  onAnimalClick?: (animal: AnimalRow) => void;
  activeVisits?: Map<string, ActiveVisit>;
}) {
  // 칸 수만큼 채우기 — 빈 슬롯은 "잠긴 방" 표시
  const slots: (RoomRow | null)[] = [];
  for (let i = 0; i < cols; i++) {
    slots.push(floorRooms.find((r: RoomRow) => r.position === i) ?? null);
  }

  return (
    <div
      className="cs-floor"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      <span className="cs-floor-label">{floorNum}F</span>
      {slots.map((room: RoomRow | null, idx: number) => (
        <RoomCell
          key={room?.id ?? `lock-${floorNum}-${idx}`}
          room={room}
          animals={room ? animalsByRoom.get(room.id) ?? [] : []}
          currentDay={currentDay}
          onAnimalClick={onAnimalClick}
          visit={room ? activeVisits?.get(room.id) ?? null : null}
        />
      ))}
      {isGround && <div className="cs-door-indicator" aria-hidden />}
    </div>
  );
}

// ── 방 한 칸 ───────────────────────────────────────────────────────────
function RoomCell({
  room,
  animals,
  currentDay,
  onAnimalClick,
  visit,
}: {
  room: RoomRow | null;
  animals: AnimalRow[];
  currentDay: number;
  onAnimalClick?: (animal: AnimalRow) => void;
  visit?: ActiveVisit | null;
}) {
  if (!room) {
    return (
      <div className="cs-room cs-room--locked" title="잠긴 방 — 레벨업으로 해금">
        <span className="cs-room-locked-label">잠긴 방</span>
      </div>
    );
  }
  if (animals.length === 0) {
    return (
      <div className="cs-room cs-room--empty" title={`${room.floor}F · ${room.position} — 비어있음`}>
        <span className="cs-room-empty-label">비어있음</span>
      </div>
    );
  }
  const visiting = !!visit;
  const visitorMeta = visit ? describeVisitor(visit.visitor) : null;
  return (
    <div
      className={`cs-room${visiting ? " cs-room--visited" : ""}`}
      data-room-id={room.id}
      title={visiting ? `${visit!.visitor.name} 방문 중` : `${room.floor}F · ${room.position}`}
    >
      {visiting && visitorMeta && (
        <>
          <div
            className={`cs-visitor-pin${visit!.visitor.type === "buck" ? " cs-visitor-pin--buck" : ""}`}
          >
            <span className="cs-visitor-pin-icon">{visitorMeta.icon}</span>
            <span>{visit!.visitor.name}</span>
          </div>
          <Hearts buck={visit!.visitor.type === "buck"} seed={visit!.visitor.id} />
        </>
      )}
      {animals.map((a: AnimalRow) => (
        <AnimalCard
          key={a.id}
          animal={a}
          currentDay={currentDay}
          variant="room"
          onClick={onAnimalClick ? () => onAnimalClick(a) : undefined}
        />
      ))}
    </div>
  );
}

// ── 하트 파티클 레이어 ─────────────────────────────────────────────────
function Hearts({ buck, seed }: { buck: boolean; seed: string }) {
  // 시드로 위치/딜레이 살짝 흩뿌림 — 매 렌더 같은 배치 유지
  const hearts = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const rand = () => {
      h = (h * 1664525 + 1013904223) >>> 0;
      return h / 4294967296;
    };
    const glyphs = buck ? ["❤️", "💛", "💕"] : ["💗", "✨", "💕"];
    return Array.from({ length: 5 }, (_, i) => ({
      key: i,
      left: 18 + rand() * 64, // %
      delay: rand() * 2.4, // s
      duration: 2.2 + rand() * 1.0, // s
      glyph: glyphs[Math.floor(rand() * glyphs.length)],
      scale: 0.8 + rand() * 0.5,
    }));
  }, [buck, seed]);

  return (
    <div className="cs-hearts" aria-hidden>
      {hearts.map((ht) => (
        <span
          key={ht.key}
          className="cs-heart"
          style={{
            left: `${ht.left}%`,
            animationDelay: `${ht.delay}s`,
            animationDuration: `${ht.duration}s`,
            fontSize: `${14 * ht.scale}px`,
          }}
        >
          {ht.glyph}
        </span>
      ))}
    </div>
  );
}