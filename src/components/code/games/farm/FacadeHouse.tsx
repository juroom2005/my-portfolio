"use client";

// src/components/code/games/farm/FacadeHouse.tsx
//
// CodePen "CSS Responsive House" 를 그대로 가져옴 (구조 1:1).
// 원본은 슬라이더로 rooms 3-6 을 바꾸지만, 여기선 farm.level 로 자동 결정.
// 창문에 동물 이모지를 작게 띄워서 "여기 누가 살고 있어요" 표시.
//
// 창문 매핑 (data-rooms=6 기준 가시 창 5개):
//   left wing: 2개  (top→bottom)
//   right wing: 2개 (top→bottom)
//   front (gable): 1개
// data-rooms 가 줄면 wing 의 첫 번째 창문이 사라짐 (원본 CSS 규칙).
// data-rooms=3 이면 wing 창 전부 사라짐 → front 만 남음.

import { useMemo } from "react";
import type { RoomRow, AnimalRow } from "./dbTypes";
import { describeAnimal } from "./phenotype";
import "./farmHouse.css";

// ── level → data-rooms ──────────────────────────────────────────────────
// LVL1 → 3 (가장 작음), LVL2 → 4, LVL3 → 5, LVL4+ → 6 (가장 큼)
export function houseSizeForLevel(level: number): 3 | 4 | 5 | 6 {
  const v = Math.max(3, Math.min(6, level + 2));
  return v as 3 | 4 | 5 | 6;
}

// 한 창문에 들어갈 동물 (없으면 null)
type WindowAssignment = {
  room: RoomRow | null;
  animal: AnimalRow | null;
};

export type FacadeHouseProps = {
  level: number;
  rooms: RoomRow[];
  roomAnimals: AnimalRow[];
  phase: "night" | "morning" | "open" | "evening";
};

export default function FacadeHouse({ level, rooms, roomAnimals, phase }: FacadeHouseProps) {
  const dataRooms = houseSizeForLevel(level);

  // room_id → animal 매핑 (room 당 1마리 가정 — 여러 마리면 첫 마리만 창문에 노출)
  const animalsByRoom = useMemo(() => {
    const m = new Map<string, AnimalRow>();
    for (const a of roomAnimals) {
      if (a.room_id && !m.has(a.room_id)) m.set(a.room_id, a);
    }
    return m;
  }, [roomAnimals]);

  // 가시 창 5개에 매핑할 방을 결정.
  // 단순화: rooms 배열을 (floor desc, position asc) 정렬 후 앞에서 5개.
  const orderedRooms = useMemo(
    () =>
      [...rooms].sort((a: RoomRow, b: RoomRow) =>
        a.floor !== b.floor ? b.floor - a.floor : a.position - b.position,
      ),
    [rooms],
  );

  // window 슬롯 5개에 방 할당 (방이 적으면 null)
  const slots: WindowAssignment[] = [
    slotOf(orderedRooms, 0, animalsByRoom),
    slotOf(orderedRooms, 1, animalsByRoom),
    slotOf(orderedRooms, 2, animalsByRoom),
    slotOf(orderedRooms, 3, animalsByRoom),
    slotOf(orderedRooms, 4, animalsByRoom),
  ];

  const isNight = phase === "night";

  return (
    <div
      className="farm-house-stage"
      style={{
        position: "relative",
        width: "100%",
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px 80px",
        background: isNight
          ? "linear-gradient(180deg, #1a2440 0%, #2a3050 60%, #3d2f1f 100%)"
          : "linear-gradient(180deg, #FAF3E0 0%, #F5EBC4 70%, #E4D6A8 100%)",
        transition: "background .9s ease",
        overflow: "hidden",
        borderRadius: 6,
        border: "1px solid rgba(61,47,31,0.18)",
      }}
    >
      {/* 해/달 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 30,
          right: 40,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: isNight ? "#F5EBC4" : "#FFE49B",
          boxShadow: isNight
            ? "0 0 24px rgba(245,235,196,0.6)"
            : "0 0 32px rgba(255,228,155,0.7)",
          transition: "background .9s ease, box-shadow .9s ease",
        }}
      />

      {/* House (원본 구조 1:1) */}
      <div className="house" data-rooms={dataRooms}>
        <div className="house-wings" data-flip-key="wings">
          <div className="house-left-wing">
            {/* 좌측 첫 창 (data-rooms=6 일 때만 보임) */}
            <WindowSlot assignment={slots[0]} />
            <WindowSlot assignment={slots[1]} />
            <div className="house-sparkle">
              <div className="house-sparkle-dots" />
            </div>
          </div>
          <div className="house-right-wing">
            <WindowSlot assignment={slots[2]} />
            <WindowSlot assignment={slots[3]} />
            <div className="house-sparkle">
              <div className="house-sparkle-dots" />
            </div>
          </div>
          <div className="house-roof">
            <div className="house-ledge" />
          </div>
        </div>
        <div className="house-front" data-flip-key="front">
          <div className="house-chimney" />
          <div className="house-facade" />
          <WindowSlot assignment={slots[4]} front />
          <div className="house-doorway">
            <div className="house-stairs" />
            <div className="house-door" />
          </div>
          <div className="house-gable">
            <div className="house-roof">
              <div className="house-ledge" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 창문 한 칸: 원본 .house-window 구조 유지 + 동물 peek 오버레이 ──────
function WindowSlot({
  assignment,
  front,
}: {
  assignment: WindowAssignment;
  front?: boolean;
}) {
  // 원본 구조 그대로
  return (
    <div className="house-window" title={windowTooltip(assignment)}>
      {/* front window 는 원본에 sparkle 내장 */}
      {front && (
        <div className="house-sparkle">
          <div className="house-sparkle-dots" />
        </div>
      )}
      {/* 동물 peek 오버레이 — 절대 위치, 창문 안에 둥실 */}
      {assignment.animal && <AnimalPeek animal={assignment.animal} />}
    </div>
  );
}

function AnimalPeek({ animal }: { animal: AnimalRow }) {
  const d = describeAnimal(animal);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        lineHeight: 1,
        zIndex: 2,
        pointerEvents: "none",
        // 창문 안에서 약간 떠 있는 듯한 부드러운 sway
        animation: "houseAnimalSway 3.2s ease-in-out infinite",
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
      }}
    >
      {d.icon}
    </div>
  );
}

// ── 헬퍼 ───────────────────────────────────────────────────────────────
function slotOf(
  ordered: RoomRow[],
  idx: number,
  animalsByRoom: Map<string, AnimalRow>,
): WindowAssignment {
  const room = ordered[idx] ?? null;
  const animal = room ? animalsByRoom.get(room.id) ?? null : null;
  return { room, animal };
}

function windowTooltip(a: WindowAssignment): string {
  if (!a.room) return "잠긴 방";
  if (!a.animal) return `${a.room.floor}F-${a.room.position} · 비어있음`;
  return `${a.room.floor}F-${a.room.position} · ${a.animal.name?.trim() || "이름 없음"}`;
}