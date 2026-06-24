"use client";

// src/components/code/games/farm/WaitingRoom.tsx
//
// 손님 대기실. 도착한 손님(pendingArrivals)이 이모지로 표시됨.
//   - 새 손님은 왼쪽에서 걸어 들어오는 애니메이션
//   - 클릭하면 선택 상태 → 부모가 VisitorCard 표시
//   - 빈 슬롯엔 점선 placeholder
//
// 대기실 자체에 상한은 없음 (도착 로직이 빈 방 있을 때만 손님 만들어서
// 자연히 제한됨). 넘치면 가로 스크롤.

import { useMemo } from "react";
import type { Visitor } from "./visitorSystem";
import { describeVisitor } from "./visitorSystem";

const WR = {
  bg: "#F3ECD6",
  floor: "#E8DBC0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  inkFaint: "#8B7E66",
  blue: "#224889",
  line: "rgba(61,47,31,0.18)",
  pink: "#D14D8A",
  buck: "#C99A2E",
  selected: "#8FE600",
} as const;

type Props = {
  visitors: Visitor[];
  selectedId: string | null;
  onSelect: (visitor: Visitor) => void;
};

export default function WaitingRoom({ visitors, selectedId, onSelect }: Props) {
  return (
    <div
      style={{
        background: WR.bg,
        border: `1px solid ${WR.line}`,
        borderRadius: 6,
        padding: "12px 14px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: WR.ink }}>대기실</span>
          <span
            className="font-mono"
            style={{ fontSize: 9, color: WR.inkFaint, letterSpacing: "0.2em", fontWeight: 700 }}
          >
            WAITING
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 10, color: WR.inkSoft, letterSpacing: "0.1em" }}>
          {visitors.length > 0 ? `${visitors.length}명 대기 중` : "비어있음"}
        </span>
      </div>

      {/* 대기 바닥 */}
      <div
        style={{
          position: "relative",
          minHeight: 96,
          background: WR.floor,
          borderRadius: 4,
          border: `1px dashed ${WR.line}`,
          padding: "12px 14px",
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          overflowX: "auto",
        }}
      >
        {visitors.length === 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: WR.inkFaint,
              fontSize: 11,
              fontStyle: "italic",
            }}
          >
            영업시간이 되면 손님이 찾아옵니다.
          </div>
        ) : (
          visitors.map((v, i) => (
            <WalkingVisitor
              key={v.id}
              visitor={v}
              index={i}
              selected={v.id === selectedId}
              onClick={() => onSelect(v)}
            />
          ))
        )}
      </div>

      {visitors.length > 0 && (
        <p
          style={{
            margin: "8px 2px 0",
            fontSize: 10,
            color: WR.inkFaint,
            letterSpacing: "0.02em",
          }}
        >
          손님을 클릭하면 정보를 보고 방에 안내할 수 있어요.
        </p>
      )}

      <style>{`
        @keyframes wrWalkIn {
          from { transform: translateX(-60px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes wrIdleBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes wrWiggle {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}

// ── 걸어 들어오는 손님 한 명 ───────────────────────────────────────────
function WalkingVisitor({
  visitor,
  index,
  selected,
  onClick,
}: {
  visitor: Visitor;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = useMemo(() => describeVisitor(visitor), [visitor]);
  const isBuck = visitor.type === "buck";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${visitor.name} · ${meta.typeLabel}`}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
        // 들어오는 애니메이션은 래퍼에, idle bob 은 안쪽 이모지에
        animation: `wrWalkIn .5s cubic-bezier(.3,.7,.4,1) ${index * 0.08}s both`,
      }}
    >
      {/* 선택 링 */}
      <div
        style={{
          position: "relative",
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: selected ? "rgba(143,230,0,0.22)" : "rgba(255,255,255,0.4)",
          border: `2px solid ${selected ? WR.selected : "transparent"}`,
          transition: "background .15s, border-color .15s",
        }}
      >
        <span
          style={{
            fontSize: 30,
            lineHeight: 1,
            animation: `wrIdleBob 2.4s ease-in-out ${index * 0.2}s infinite`,
            display: "inline-block",
          }}
          aria-hidden
        >
          {meta.icon}
        </span>

        {/* 타입 배지 — buck=골드♂ / 귀족=보라 왕관 */}
        {isBuck && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: WR.buck,
              border: "2px solid #FFF8E0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              color: "#FFF",
              fontWeight: 700,
            }}
            title="수컷 (교배 의뢰)"
          >
            ♂
          </span>
        )}
        {!isBuck && isNobleVisitor(visitor) && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              fontSize: 15,
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
            }}
            title={meta.rankLabel}
          >
            👑
          </span>
        )}
      </div>

      {/* 이름표 */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: WR.ink,
          display: "flex",
          alignItems: "center",
          gap: 2,
          maxWidth: 84,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={visitor.name}
      >
        {visitor.name}
        <span style={{ color: visitor.sex === "F" ? WR.pink : "#3D7BD1" }}>{meta.sexSymbol}</span>
      </span>
    </button>
  );
}

// 귀족 여부 (baron 이상)
function isNobleVisitor(visitor: Visitor): boolean {
  return ["baron", "count", "marquis", "duke"].includes(visitor.socialRankId ?? "");
}