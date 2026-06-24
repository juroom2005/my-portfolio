"use client";

// src/components/code/games/farm/VisitorArrivalDialog.tsx
//
// 손님 도착 알랏. pendingArrivals 첫 번째를 표시.
//   - 게스트: "방문객이 도착했어요" → 방 선택 / 거절
//   - Buck:   "수컷이 교배를 의뢰합니다" → 방 선택 (암컷 있는 방만) / 거절
//
// 방 선택: 빈 방 중 한 곳 선택 → acceptToRoom 호출.

import { useEffect, useMemo } from "react";
import type { RoomRow, AnimalRow } from "./dbTypes";
import {
  describeVisitor,
  calcVisitorFee,
  defaultVisitDuration,
  type Visitor,
} from "./visitorSystem";
import { tickToHHMM } from "./useFarmClock";

const PANEL = {
  bg: "#FFF8E0",
  paper: "#FAF3E0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  inkFaint: "#8B7E66",
  blue: "#224889",
  bluePale: "#E1EAFF",
  good: "#8FE600",
  warn: "#E8714D",
  pink: "#D14D8A",
  blueAccent: "#3D7BD1",
  line: "rgba(34,72,137,0.18)",
} as const;

type Props = {
  visitor: Visitor;
  rooms: RoomRow[];
  roomAnimals: AnimalRow[];
  occupiedRoomIds: Set<string>;
  fame: number;
  farmLevel: number;
  currentTick: number;
  queueLength: number;
  onAccept: (roomId: string) => void;
  onDecline: () => void;
};

export default function VisitorArrivalDialog({
  visitor,
  rooms,
  roomAnimals,
  occupiedRoomIds,
  fame,
  farmLevel,
  currentTick,
  queueLength,
  onAccept,
  onDecline,
}: Props) {
  const meta = useMemo(() => describeVisitor(visitor), [visitor]);

  // 후보 방: 비어있지 않으면서 손님 없음, 그리고 buck 이면 암컷 같은 종 있어야
  const candidates = useMemo(() => {
    return rooms
      .filter((r: RoomRow) => !occupiedRoomIds.has(r.id))
      .map((room: RoomRow) => {
        const animals = roomAnimals.filter((a: AnimalRow) => a.room_id === room.id);
        const hasMatchingFemale =
          visitor.type === "buck"
            ? animals.some((a: AnimalRow) => a.sex === "F" && a.species === visitor.species)
            : true;
        const feePreview = calcVisitorFee({
          visitor,
          roomAnimals: animals,
          farmLevel,
          fame,
        });
        return { room, animals, hasMatchingFemale, feePreview };
      })
      .filter((c) => c.animals.length > 0); // 동물 있는 방만
  }, [rooms, roomAnimals, occupiedRoomIds, visitor, farmLevel, fame]);

  // ESC 로 거절
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecline();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDecline]);

  const noValidRoom =
    candidates.length === 0 ||
    (visitor.type === "buck" && !candidates.some((c) => c.hasMatchingFemale));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(34,72,137,0.35)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn .25s ease both",
        }}
      />

      <div
        style={{
          position: "relative",
          background: PANEL.bg,
          border: `2px solid ${PANEL.blue}`,
          borderRadius: 8,
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(34,72,137,0.35)",
          animation: "modalPop .3s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "18px 22px 14px",
            background:
              visitor.type === "buck"
                ? "linear-gradient(180deg, rgba(201,154,46,0.18) 0%, rgba(225,234,255,1) 100%)"
                : PANEL.bluePale,
            borderBottom: `2px solid ${PANEL.blue}`,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 36, lineHeight: 1 }} aria-hidden>
            {meta.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="font-mono"
              style={{
                fontSize: 9,
                color: PANEL.inkFaint,
                letterSpacing: "0.22em",
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {visitor.type === "buck" ? "BUCK 도착" : "방문객 도착"} ·{" "}
              {tickToHHMM(currentTick)}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: PANEL.ink,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {visitor.name}
              <span
                style={{
                  color: visitor.sex === "F" ? PANEL.pink : PANEL.blueAccent,
                  fontSize: 14,
                }}
              >
                {meta.sexSymbol}
              </span>
              {visitor.type === "buck" && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    background: "rgba(201,154,46,0.20)",
                    border: "1px solid rgba(201,154,46,0.45)",
                    color: "#7a5b00",
                    borderRadius: 3,
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                  }}
                >
                  {visitor.grade}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: PANEL.inkSoft,
                marginTop: 2,
              }}
            >
              {meta.speciesLabel} · {meta.typeLabel}
            </div>
          </div>
        </header>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "16px 22px 14px" }}>
          {/* 안내 */}
          <p style={{ fontSize: 12, color: PANEL.inkSoft, margin: "0 0 12px", lineHeight: 1.5 }}>
            {visitor.type === "buck"
              ? "이 수컷이 농장의 암컷에게 교배를 의뢰합니다. 받아들일 방을 선택하세요."
              : "방문객이 방의 수인을 보러 왔습니다. 안내할 방을 선택하세요."}
            <br />
            <span style={{ fontSize: 11, color: PANEL.inkFaint }}>
              예상 머무는 시간: {defaultVisitDuration()}틱 (≈
              {(defaultVisitDuration() * 10) / 60}시간)
            </span>
          </p>

          {/* 방 후보 */}
          {noValidRoom ? (
            <NoRoomNotice visitor={visitor} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {candidates.map((c) => (
                <RoomChoice
                  key={c.room.id}
                  room={c.room}
                  animals={c.animals}
                  fee={c.feePreview}
                  disabled={visitor.type === "buck" && !c.hasMatchingFemale}
                  disabledReason={
                    visitor.type === "buck" && !c.hasMatchingFemale
                      ? "이 방엔 같은 종 암컷이 없어요"
                      : undefined
                  }
                  onPick={() => onAccept(c.room.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: "10px 22px 16px",
            borderTop: `1px dashed ${PANEL.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, color: PANEL.inkFaint, letterSpacing: "0.1em" }}>
            {queueLength > 1 && `대기 손님 ${queueLength - 1}명 · `}ESC 로 거절
          </span>
          <button
            type="button"
            onClick={onDecline}
            className="font-mono"
            style={{
              background: "transparent",
              border: `1px solid rgba(232,113,77,0.55)`,
              color: PANEL.warn,
              fontSize: 10,
              letterSpacing: "0.2em",
              fontWeight: 700,
              padding: "6px 14px",
              cursor: "pointer",
              borderRadius: 3,
            }}
          >
            거절
          </button>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalPop {
          from { transform: scale(.96) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── 방 선택 칩 ─────────────────────────────────────────────────────────
function RoomChoice({
  room,
  animals,
  fee,
  disabled,
  disabledReason,
  onPick,
}: {
  room: RoomRow;
  animals: AnimalRow[];
  fee: number;
  disabled?: boolean;
  disabledReason?: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onPick}
      disabled={disabled}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 12,
        padding: "10px 12px",
        background: disabled ? "rgba(61,47,31,0.04)" : PANEL.paper,
        border: `1px solid ${disabled ? "rgba(61,47,31,0.18)" : "rgba(34,72,137,0.35)"}`,
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        color: PANEL.ink,
        font: "inherit",
        transition: "background .12s, border-color .12s, transform .12s",
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "#FFF8E0";
        e.currentTarget.style.borderColor = PANEL.blue;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = PANEL.paper;
        e.currentTarget.style.borderColor = "rgba(34,72,137,0.35)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: 11,
          color: PANEL.blue,
          letterSpacing: "0.1em",
          fontWeight: 700,
          alignSelf: "center",
        }}
      >
        {room.floor}F · {room.position}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
        {animals.map((a: AnimalRow) => (
          <span key={a.id} title={a.name ?? "이름 없음"}>
            <span style={{ fontSize: 16, marginRight: 2 }}>
              {/* placeholder — 아이콘 안 받아옴, 빠른 표시용 */}
              {a.sex === "F" ? "♀" : "♂"}
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: PANEL.inkSoft }}>
              {a.grade ?? "—"}
            </span>
          </span>
        ))}
        {disabledReason && (
          <span style={{ fontSize: 10, color: PANEL.warn, marginLeft: 6 }}>{disabledReason}</span>
        )}
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: 12,
          color: PANEL.ink,
          fontWeight: 700,
          background: "rgba(143,230,0,0.18)",
          padding: "2px 8px",
          borderRadius: 3,
          alignSelf: "center",
        }}
      >
        ₵{fee}
      </span>
    </button>
  );
}

// ── 방 없음 안내 ───────────────────────────────────────────────────────
function NoRoomNotice({ visitor }: { visitor: Visitor }) {
  return (
    <div
      style={{
        padding: 16,
        background: "rgba(232,113,77,0.08)",
        border: "1px dashed rgba(232,113,77,0.45)",
        borderRadius: 4,
        color: PANEL.warn,
        fontSize: 12,
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      {visitor.type === "buck"
        ? "받을 수 있는 방이 없어요. (같은 종 암컷이 있는 빈 방이 필요해요)"
        : "받을 수 있는 방이 없어요."}
    </div>
  );
}