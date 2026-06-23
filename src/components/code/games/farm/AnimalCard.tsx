"use client";

// src/components/code/games/farm/AnimalCard.tsx
//
// 재사용 가능한 동물 카드. 보육실/방 안/상세 미리보기 어디서나 같은 컴포넌트.
// variant:
//   "compact"  — 보육실 사이드 패널용 (작고 가로형)
//   "room"     — 방 안 표시용 (정사각형, 동물 한 마리당 1칸)

import { useMemo } from "react";
import type { AnimalRow } from "./dbTypes";
import {
  describeAnimal,
  gradeColor,
  type AnimalDisplay,
  type PhenotypePair,
  type RareGeneInfo,
  type ActiveTraitInfo,
} from "./phenotype";

const FARM = {
  cardBg: "#FFF8E0",
  cardEdge: "#E8DBC0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  inkFaint: "#8B7E66",
  line: "rgba(61,47,31,0.18)",
  neonDeep: "#8FE600",
  warn: "#E8714D",
  rareGold: "#C99A2E",
} as const;

type Props = {
  animal: AnimalRow;
  currentDay: number;
  variant?: "compact" | "room";
  onClick?: () => void;
};

export default function AnimalCard({ animal, currentDay, variant = "compact", onClick }: Props) {
  const d = useMemo(() => describeAnimal(animal), [animal]);
  const grade = gradeColor(animal.grade);

  if (variant === "room") return <RoomCard animal={animal} d={d} currentDay={currentDay} grade={grade} onClick={onClick} />;
  return <CompactCard animal={animal} d={d} currentDay={currentDay} grade={grade} onClick={onClick} />;
}

// ── compact: 보육실 사이드 패널 ─────────────────────────────────────────
function CompactCard({
  animal,
  d,
  currentDay,
  grade,
  onClick,
}: {
  animal: AnimalRow;
  d: AnimalDisplay;
  currentDay: number;
  grade: ReturnType<typeof gradeColor>;
  onClick?: () => void;
}) {
  const age = d.ageInDays(currentDay);
  const toAdult = d.daysToAdult(currentDay);

  return (
    <div
      onClick={onClick}
      style={{
        background: FARM.cardBg,
        border: `1px solid ${FARM.line}`,
        padding: "10px 12px",
        cursor: onClick ? "pointer" : "default",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 10,
        alignItems: "center",
        transition: "transform .15s, border-color .15s",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "rgba(61,47,31,0.45)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = FARM.line;
      }}
    >
      {/* 아이콘 */}
      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(61,47,31,0.05)",
          borderRadius: 6,
        }}
        aria-hidden
      >
        {d.icon}
      </div>

      {/* 본문 */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: FARM.ink,
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span>{animal.name?.trim() || <em style={{ color: FARM.inkFaint, fontStyle: "normal" }}>이름 없음</em>}</span>
          <span
            style={{
              fontSize: 11,
              color: animal.sex === "F" ? "#D14D8A" : "#3D7BD1",
              fontWeight: 700,
            }}
          >
            {d.sexSymbol}
          </span>
        </div>
        <div className="font-mono" style={{ fontSize: 10, color: FARM.inkSoft, marginTop: 2 }}>
          {d.speciesLabel} · {d.isAdult ? `성체 D${age}` : `아기 D${age} → 성체까지 ${toAdult}일`}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          {d.genePhenotype.slice(0, 2).map((p: PhenotypePair) => (
            <Chip key={p.label} text={p.value} />
          ))}
          {d.rareGenes
            .filter((r: RareGeneInfo) => r.status === "expressed")
            .map((r: RareGeneInfo) => (
              <Chip key={r.id} text={r.label} tone="rare" />
            ))}
          {d.activeTraits.slice(0, 2).map((t: ActiveTraitInfo) => (
            <Chip key={t.id} text={t.label} tone={t.tone} />
          ))}
        </div>
      </div>

      {/* 등급 */}
      <GradeBadge grade={animal.grade} colors={grade} />
    </div>
  );
}

// ── room: 방 안 카드 ────────────────────────────────────────────────────
function RoomCard({
  animal,
  d,
  currentDay,
  grade,
  onClick,
}: {
  animal: AnimalRow;
  d: AnimalDisplay;
  currentDay: number;
  grade: ReturnType<typeof gradeColor>;
  onClick?: () => void;
}) {
  const age = d.ageInDays(currentDay);
  return (
    <div
      onClick={onClick}
      style={{
        background: FARM.cardBg,
        border: `1px solid ${FARM.line}`,
        padding: 10,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        minWidth: 96,
        position: "relative",
        transition: "transform .15s, border-color .15s, box-shadow .15s",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "rgba(34,72,137,0.55)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(34,72,137,0.15)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = FARM.line;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <GradeBadge grade={animal.grade} colors={grade} corner />
      <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden>
        {d.icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: FARM.ink, textAlign: "center" }}>
        {animal.name?.trim() || <em style={{ color: FARM.inkFaint, fontStyle: "normal" }}>이름 없음</em>}
        <span style={{ color: animal.sex === "F" ? "#D14D8A" : "#3D7BD1", marginLeft: 4 }}>
          {d.sexSymbol}
        </span>
      </div>
      <div className="font-mono" style={{ fontSize: 9, color: FARM.inkSoft }}>
        D{age}
      </div>
    </div>
  );
}

// ── Chip ────────────────────────────────────────────────────────────────
function Chip({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "good" | "penalty" | "rare" }) {
  const palette = {
    neutral: { bg: "rgba(61,47,31,0.06)", fg: FARM.ink, border: "transparent" },
    good: { bg: "rgba(143,230,0,0.18)", fg: "#3D5500", border: "rgba(143,230,0,0.5)" },
    penalty: { bg: "rgba(232,113,77,0.14)", fg: FARM.warn, border: "rgba(232,113,77,0.45)" },
    rare: { bg: "rgba(201,154,46,0.16)", fg: FARM.rareGold, border: "rgba(201,154,46,0.5)" },
  }[tone];
  return (
    <span
      style={{
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        padding: "1px 6px",
        fontSize: 10,
        borderRadius: 3,
        letterSpacing: "0.02em",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

// ── GradeBadge ──────────────────────────────────────────────────────────
function GradeBadge({
  grade,
  colors,
  corner,
}: {
  grade: string | null;
  colors: { bg: string; fg: string; border: string };
  corner?: boolean;
}) {
  if (!grade) return null;
  return (
    <div
      className="font-mono"
      style={{
        position: corner ? "absolute" : "relative",
        top: corner ? 4 : undefined,
        right: corner ? 4 : undefined,
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        padding: "2px 6px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        minWidth: 22,
        textAlign: "center",
        borderRadius: 3,
      }}
    >
      {grade}
    </div>
  );
}