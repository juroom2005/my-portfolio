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
import {
  formatBreedLabel,
  getBreedTier,
  getOrInferAncestry,
  TIER_COLOR,
  type BreedTier,
} from "./ancestry";
import { getSocialRank } from "./species/humanProfile";
import { isReadyToGraduate } from "./pricing";

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

  // 혈통 정보 (순종이면 null → 배지 안 그림)
  const breed = useMemo(() => {
    const anc = getOrInferAncestry(animal);
    const tier = getBreedTier(anc, animal.species);
    if (tier === "pure") return null;
    return { tier, label: formatBreedLabel(anc, animal.species) };
  }, [animal]);

  // 사생아 구체 라벨 (metadata.bastard_of 가 있으면 "후작의 사생아" 등으로 override)
  const bastardOverride = useMemo(() => getBastardOverride(animal), [animal]);

  const isPregnant = useMemo(() => {
    const preg = (animal.metadata as Record<string, unknown> | null)?.pregnancy;
    return !!(preg && typeof preg === "object");
  }, [animal.metadata]);

  // active_traits 표시용 — noble_bastard 라벨을 구체 라벨로 교체
  const displayTraits = useMemo(() => {
    if (!bastardOverride) return d.activeTraits;
    return d.activeTraits.map((t) =>
      t.id === "noble_bastard" ? { ...t, label: bastardOverride } : t,
    );
  }, [d.activeTraits, bastardOverride]);

  if (variant === "room") {
    return (
      <RoomCard
        animal={animal}
        d={d}
        currentDay={currentDay}
        grade={grade}
        breed={breed}
        isPregnant={isPregnant}
        onClick={onClick}
      />
    );
  }
  return (
    <CompactCard
      animal={animal}
      d={d}
      currentDay={currentDay}
      grade={grade}
      breed={breed}
      displayTraits={displayTraits}
      isPregnant={isPregnant}
      onClick={onClick}
    />
  );
}

// ── compact: 보육실 사이드 패널 ─────────────────────────────────────────
function CompactCard({
  animal,
  d,
  currentDay,
  grade,
  breed,
  displayTraits,
  isPregnant,
  onClick,
}: {
  animal: AnimalRow;
  d: AnimalDisplay;
  currentDay: number;
  grade: ReturnType<typeof gradeColor>;
  breed: { tier: BreedTier; label: string } | null;
  displayTraits: ActiveTraitInfo[];
  isPregnant: boolean;
  onClick?: () => void;
}) {
  const age = d.ageInDays(currentDay);
  const toAdult = d.daysToAdult(currentDay);

  // 보육실에서 성체 도달 — 깜빡이는 LED 로 알림
  const ready = isReadyToGraduate(animal, currentDay);

  return (
    <div
      onClick={onClick}
      style={{
        background: FARM.cardBg,
        border: `1px solid ${ready ? "rgba(143,230,0,0.65)" : FARM.line}`,
        boxShadow: ready ? "0 0 0 1px rgba(143,230,0,0.25)" : "none",
        padding: "10px 12px",
        cursor: onClick ? "pointer" : "default",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 10,
        alignItems: "center",
        position: "relative",
        transition: "transform .15s, border-color .15s, box-shadow .25s",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = ready
          ? "rgba(143,230,0,0.9)"
          : "rgba(61,47,31,0.45)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = ready
          ? "rgba(143,230,0,0.65)"
          : FARM.line;
      }}
    >
      {ready && <GraduateBlinker />}
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
          {breed && <BreedBadge tier={breed.tier} label={breed.label} size="sm" />}
          {isPregnant && <PregnantBadge />}
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
          {displayTraits.slice(0, 2).map((t: ActiveTraitInfo) => (
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
  breed,
  isPregnant,
  onClick,
}: {
  animal: AnimalRow;
  d: AnimalDisplay;
  currentDay: number;
  grade: ReturnType<typeof gradeColor>;
  breed: { tier: BreedTier; label: string } | null;
  isPregnant: boolean;
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
      {breed && (
        <div style={{ position: "absolute", top: 4, left: 4 }}>
          <BreedBadge tier={breed.tier} label={breed.tier === "ace" ? "에" : breed.tier === "quarter" ? "쿼" : "하"} size="xs" />
        </div>
      )}
      <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden>
        {d.icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: FARM.ink, textAlign: "center" }}>
        {animal.name?.trim() || <em style={{ color: FARM.inkFaint, fontStyle: "normal" }}>이름 없음</em>}
        <span style={{ color: animal.sex === "F" ? "#D14D8A" : "#3D7BD1", marginLeft: 4 }}>
          {d.sexSymbol}
        </span>
         {isPregnant && (
          <span style={{ marginLeft: 4, fontSize: 11 }} title="임신 중">💖</span>
        )}
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

// ── 성체 도달 알림 (깜빡깜빡) ──────────────────────────────────────────
//
// 보육실 카드 우상단의 작은 LED + "성체!" 라벨.
// 클릭은 카드 전체가 받아서 모달이 열리고 거기서 액션 선택.
function GraduateBlinker() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 6px",
          background: "rgba(143,230,0,0.18)",
          border: "1px solid rgba(143,230,0,0.55)",
          borderRadius: 3,
          fontSize: 9,
          letterSpacing: "0.1em",
          fontWeight: 700,
          color: "#3D5500",
          animation: "graduateBlink 1.4s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 2,
        }}
        className="font-mono"
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#8FE600",
            boxShadow: "0 0 6px rgba(143,230,0,0.85)",
          }}
        />
        성체
      </div>
      <style>{`
        @keyframes graduateBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
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

// ── 임신 배지 ───────────────────────────────────────────────────────────
function PregnantBadge() {
  return (
    <span
      title="임신 중"
      className="font-mono"
      style={{
        background: "rgba(255,143,168,0.18)",
        color: "#9C4368",
        border: "1px solid rgba(255,143,168,0.55)",
        padding: "1px 6px",
        fontSize: 10,
        borderRadius: 3,
        letterSpacing: "0.02em",
        fontWeight: 700,
        whiteSpace: "nowrap",
        lineHeight: 1.3,
      }}
    >
      💖 임신
    </span>
  );
}

// ── BreedBadge (혈통 배지) ──────────────────────────────────────────────
//
// 작고 절제된 칩. 순종은 호출 측에서 안 그리도록 거름 (여기는 항상 렌더).
// size:
//   "sm" — compact 카드 본문 inline 용
//   "xs" — room 카드 좌상단 코너 용 (한글자만)
function BreedBadge({ tier, label, size = "sm" }: { tier: BreedTier; label: string; size?: "sm" | "xs" }) {
  const palette = TIER_COLOR[tier];
  const compact = size === "xs";
  return (
    <span
      title={label}
      className="font-mono"
      style={{
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        padding: compact ? "1px 4px" : "1px 6px",
        fontSize: compact ? 9 : 10,
        borderRadius: 3,
        letterSpacing: "0.04em",
        fontWeight: 700,
        whiteSpace: "nowrap",
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
  );
}


// ── 사생아 라벨 구체화 헬퍼 ─────────────────────────────────────────────
//
// 동물 metadata.bastard_of = "marquis" 같은 socialRankId 가 있으면
// SOCIAL_RANKS 의 bastardLabel ("후작의 사생아") 으로 매핑.
// 없으면 null → 기본 라벨("귀족의 사생아") 유지.
function getBastardOverride(animal: AnimalRow): string | null {
  if (!animal.active_traits.includes("noble_bastard")) return null;
  const meta = animal.metadata as Record<string, unknown> | null;
  const rankId = meta?.bastard_of;
  if (typeof rankId !== "string") return null;
  try {
    const rank = getSocialRank(rankId);
    return rank.bastardLabel;
  } catch {
    return null;
  }
}