"use client";

// src/components/code/games/farm/VisitorMatchDialog.tsx
//
// 손님 매칭 카드. 대기실에서 손님을 클릭하면 열림 (자동 도착 팝업 아님).
//   - 게스트: 방문객 정보 → 방 선택
//   - Buck:   수컷 정보 (등급/능력) → 같은 종 암컷 있는 방 선택
//
// 닫기 = 매칭 안 하고 대기실로 돌려보냄 (거절 아님, 손님은 계속 대기).
// 명시적 "돌려보내기" 버튼으로만 큐에서 제거.

import { useEffect, useMemo } from "react";
import type { RoomRow, AnimalRow } from "./dbTypes";
import {
  describeVisitor,
  calcVisitorFee,
  defaultVisitDuration,
  type Visitor,
} from "./visitorSystem";
import { describeGenes } from "./phenotype";
import { tickToHHMM } from "./useFarmClock";
import {
  formatBreedLabel,
  getBreedTier,
  getOrInferAncestry,
  TIER_COLOR,
} from "./ancestry";

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
  onAccept: (roomId: string) => void;
  /** 매칭 안 하고 카드만 닫음 — 손님은 대기실에 남음 */
  onClose: () => void;
  /** 손님을 완전히 돌려보냄 — 큐에서 제거 */
  onDecline: () => void;
};

export default function VisitorMatchDialog({
  visitor,
  rooms,
  roomAnimals,
  occupiedRoomIds,
  fame,
  farmLevel,
  currentTick,
  onAccept,
  onClose,
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

  // ESC 로 닫기 (돌려보내기 아님 — 대기실에 남음)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        onClick={onClose}
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
              {visitor.type === "guest" && meta.rankLabel && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    padding: "1px 7px",
                    background: rankIsNoble(visitor.socialRankId)
                      ? "rgba(150,90,200,0.18)"
                      : "rgba(34,72,137,0.12)",
                    border: `1px solid ${
                      rankIsNoble(visitor.socialRankId)
                        ? "rgba(150,90,200,0.5)"
                        : "rgba(34,72,137,0.3)"
                    }`,
                    color: rankIsNoble(visitor.socialRankId) ? "#6A3D9A" : "#224889",
                    borderRadius: 3,
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                  }}
                >
                  {meta.rankLabel}
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
              {meta.speciesLabel}
              {meta.age != null && ` · ${meta.age}세`}
              {visitor.type === "buck" && ` · ${meta.typeLabel}`}
            </div>
          </div>
        </header>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "16px 22px 14px" }}>
          {/* 안내 */}
          <p style={{ fontSize: 12, color: PANEL.inkSoft, margin: "0 0 12px", lineHeight: 1.5 }}>
            {visitor.type === "buck"
              ? "이 수컷이 농장의 암컷에게 교배를 의뢰합니다. 받아들일 방을 선택하세요."
              : rankIsNoble(visitor.socialRankId)
                ? "귀한 손님이 농장을 찾았습니다. 어느 방으로 안내할까요?"
                : "방문객이 방의 수인을 보러 왔습니다. 안내할 방을 선택하세요."}
            <br />
            <span style={{ fontSize: 11, color: PANEL.inkFaint }}>
              예상 머무는 시간: {defaultVisitDuration()}틱 (≈
              {(defaultVisitDuration() * 10) / 60}시간)
            </span>
          </p>

          {/* 표현형 — buck 과 인간 게스트 모두. 겉모습만, 보인자는 숨김 */}
          {visitor.animalData && <BuckPhenotype visitor={visitor} />}

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
            title="이 손님을 돌려보냅니다 (대기실에서 사라짐)"
          >
            돌려보내기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-mono"
            style={{
              background: "transparent",
              border: `1px solid ${PANEL.line}`,
              color: PANEL.inkSoft,
              fontSize: 10,
              letterSpacing: "0.2em",
              fontWeight: 700,
              padding: "6px 14px",
              cursor: "pointer",
              borderRadius: 3,
            }}
            title="대기실로 돌아가기 (손님은 계속 대기)"
          >
            닫기
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

// ── buck 표현형 (겉모습 + 능력치, 유전자형 숨김) ───────────────────────
function BuckPhenotype({ visitor }: { visitor: Visitor }) {
  const data = visitor.animalData!;

  // 혼혈 가드: ancestry 가 있고 혼혈이면 배지로 알림.
  // describeGenes 는 data.species 기준 형질만 보여주므로, minor 종 형질은
  // 카드에서 보이지 않을 수 있다는 점을 사용자에게 시그널.
  // (현재 방문객은 다 순종이라 이 분기는 평소 false. 미래 확장 대비 안전 가드.)
  const anc = useMemo(
    () => getOrInferAncestry({ species: data.species, ancestry: data.ancestry }),
    [data.species, data.ancestry],
  );
  const tier = getBreedTier(anc, data.species);
  const breedLabel = tier === "pure" ? null : formatBreedLabel(anc, data.species);

  // describeGenes 는 species 기준 단일 형질만 — 혼혈이면 누락 형질 있을 수 있음.
  // 안전하게 try/catch 로 감싸서 알 수 없는 종이 와도 죽지 않게.
  const phenotype = useMemo(() => {
    try {
      return describeGenes({ genes: data.genes, species: data.species });
    } catch {
      return [];
    }
  }, [data.genes, data.species]);

  const stats: { label: string; value: number }[] = [
    { label: "외모", value: data.beauty },
    { label: "체력", value: data.stamina },
    { label: "기질", value: data.temperament },
    { label: "건강", value: data.health },
    { label: "번식력", value: data.fertility },
  ];

  return (
    <div
      style={{
        background: "rgba(201,154,46,0.07)",
        border: "1px solid rgba(201,154,46,0.3)",
        borderRadius: 6,
        padding: "12px 14px",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px dashed rgba(201,154,46,0.3)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#7a5b00" }}>겉모습</span>
        <span
          className="font-mono"
          style={{ fontSize: 9, color: PANEL.inkFaint, letterSpacing: "0.18em", fontWeight: 700 }}
        >
          APPEARANCE
        </span>
        {breedLabel && (
          <span
            className="font-mono"
            style={{
              marginLeft: "auto",
              fontSize: 10,
              padding: "1px 7px",
              background: TIER_COLOR[tier].bg,
              color: TIER_COLOR[tier].fg,
              border: `1px solid ${TIER_COLOR[tier].border}`,
              borderRadius: 3,
              letterSpacing: "0.04em",
              fontWeight: 700,
            }}
            title="혼혈 방문객"
          >
            {breedLabel}
          </span>
        )}
      </div>

      {/* 외형 표현형 (genotype 없음) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 16px",
          fontSize: 12,
          marginBottom: 10,
        }}
      >
        {phenotype.map((p) => (
          <div key={p.label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: PANEL.inkSoft }}>{p.label}</span>
            <span style={{ color: PANEL.ink, fontWeight: 600 }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* 능력치 막대 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 30px",
              gap: 8,
              alignItems: "center",
              fontSize: 11,
            }}
          >
            <span style={{ color: PANEL.inkSoft }}>{s.label}</span>
            <div
              style={{
                height: 7,
                background: "rgba(61,47,31,0.08)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(0, Math.min(100, s.value))}%`,
                  background: s.value >= 70 ? "#8FE600" : s.value >= 40 ? "#C9D96A" : "#D9B86A",
                }}
              />
            </div>
            <span
              className="font-mono"
              style={{ textAlign: "right", fontWeight: 700, color: PANEL.ink }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: 10,
          color: PANEL.inkFaint,
          fontStyle: "italic",
          lineHeight: 1.4,
        }}
      >
        겉으로 드러난 특징만 보입니다. 숨은 유전자는 새끼가 태어나야 알 수 있어요.
      </p>
    </div>
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

// 귀족 지위 여부 (baron 이상)
function rankIsNoble(rankId?: string): boolean {
  return ["baron", "count", "marquis", "duke"].includes(rankId ?? "");
}