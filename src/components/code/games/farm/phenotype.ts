// src/components/code/games/farm/phenotype.ts
//
// 동물 row 를 UI 가 바로 그릴 수 있는 표시용 데이터로 변환.
// 카드 / 상세 모달 / 보육실 패널 어디서나 같은 헬퍼를 씀.

import {
  getSpecies,
  TRAIT_REGISTRY,
  isTraitExpressed,
  isTraitCarrier,
  type Species,
} from "./species";
import type { AnimalRow } from "./dbTypes";

export type PhenotypePair = { label: string; value: string };

export type RareGeneInfo = {
  id: string;
  label: string;
  rarityLabel: string;
  status: "expressed" | "carrier" | "none";
};

export type ActiveTraitInfo = {
  id: string;
  label: string;
  tone: "good" | "penalty" | "rare";
  category: string;
  description?: string;
};

export type AnimalDisplay = {
  species: Species;
  speciesLabel: string;
  icon: string;
  textLabel: string;
  sexSymbol: "♀" | "♂";
  isAdult: boolean;
  genePhenotype: PhenotypePair[];
  rareGenes: RareGeneInfo[];
  activeTraits: ActiveTraitInfo[];
  ageInDays: (currentDay: number) => number;
  daysToAdult: (currentDay: number) => number;
};

// ── 외형 표현형 ─────────────────────────────────────────────────────────
export function describeGenes(animal: Pick<AnimalRow, "genes" | "species">): PhenotypePair[] {
  const species = getSpecies(animal.species);
  const out: PhenotypePair[] = [];
  for (const trait of species.genes) {
    const geno = animal.genes[trait.id];
    if (!geno) continue;
    out.push({ label: trait.label_ko, value: trait.expression(geno) });
  }
  return out;
}

// ── 희귀 유전자 발현 상태 ───────────────────────────────────────────────
export function describeRareGenes(
  animal: Pick<AnimalRow, "rare_genes" | "species">,
): RareGeneInfo[] {
  const species = getSpecies(animal.species);
  const out: RareGeneInfo[] = [];
  for (const rare of species.rare_genes) {
    const geno = animal.rare_genes[rare.id];
    if (!geno) continue;
    const status = rare.expression(geno);
    if (status === "none") continue;
    out.push({
      id: rare.id,
      label: rare.label_ko,
      rarityLabel: rare.rarity_label,
      status,
    });
  }
  return out;
}

// ── 활성 특성 ───────────────────────────────────────────────────────────
//
// 페널티(불임/약한 생식/병약) → penalty
// 희귀 라벨(LEGENDARY/MYTHIC) → rare
// 나머지 → good
export function describeActiveTraits(activeIds: string[]): ActiveTraitInfo[] {
  return activeIds
    .map((id: string) => {
      const spec = TRAIT_REGISTRY[id];
      if (!spec) return null;
      let tone: ActiveTraitInfo["tone"] = "good";
      if (spec.rarity_label === "PENALTY") tone = "penalty";
      else if (spec.rarity_label === "LEGENDARY" || spec.rarity_label === "RARE") tone = "rare";
      return {
        id,
        label: spec.label_ko,
        tone,
        category: spec.category,
        description: spec.description,
      } as ActiveTraitInfo;
    })
    .filter((t): t is ActiveTraitInfo => t !== null);
}

// ── 종합 ────────────────────────────────────────────────────────────────
export function describeAnimal(animal: AnimalRow): AnimalDisplay {
  const species = getSpecies(animal.species);
  const sprites = species.sprites;

  const baby = !animal.is_adult;
  const icon = sprites.icon ?? "🐾";
  const textLabel = baby
    ? sprites.text_baby ?? `${species.label_ko} (아기)`
    : animal.sex === "F"
      ? sprites.text_adult_f ?? `${species.label_ko} ♀`
      : sprites.text_adult_m ?? `${species.label_ko} ♂`;

  return {
    species,
    speciesLabel: species.label_ko,
    icon,
    textLabel,
    sexSymbol: animal.sex === "F" ? "♀" : "♂",
    isAdult: animal.is_adult,
    genePhenotype: describeGenes(animal),
    rareGenes: describeRareGenes(animal),
    activeTraits: describeActiveTraits(animal.active_traits),
    ageInDays: (currentDay: number) => Math.max(0, currentDay - animal.born_on_day),
    daysToAdult: (currentDay: number) =>
      animal.is_adult
        ? 0
        : Math.max(0, (animal.adult_on_day ?? animal.born_on_day + species.maturity_days) - currentDay),
  };
}

// ── 등급별 색상 (UI 공용) ───────────────────────────────────────────────
export const GRADE_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  "S+": { bg: "#3D2F1F", fg: "#FFE066", border: "#FFE066" },
  S:    { bg: "#3D2F1F", fg: "#FFD133", border: "#FFD133" },
  A:    { bg: "rgba(180,255,58,0.18)", fg: "#5F8400", border: "#8FE600" },
  B:    { bg: "rgba(180,255,58,0.10)", fg: "#5F8400", border: "rgba(143,230,0,0.55)" },
  C:    { bg: "rgba(61,47,31,0.06)", fg: "#3D2F1F", border: "rgba(61,47,31,0.35)" },
  D:    { bg: "transparent", fg: "#6B5942", border: "rgba(61,47,31,0.25)" },
  E:    { bg: "transparent", fg: "#8B7E66", border: "rgba(61,47,31,0.18)" },
  F:    { bg: "transparent", fg: "#A89E84", border: "rgba(61,47,31,0.15)" },
};

export function gradeColor(grade: string | null) {
  if (!grade) return GRADE_COLORS.D;
  return GRADE_COLORS[grade] ?? GRADE_COLORS.D;
}

// ═══════════════════════════════════════════════════════════════════════
// 상세 모달용 헬퍼 — 활성/잠재/보인자 전부 분리해서 노출
// ═══════════════════════════════════════════════════════════════════════

export type DetailedTraitInfo = ActiveTraitInfo & {
  active: boolean;
  /** heterozygous recessive carrier (열성 보인자) */
  carrier: boolean;
};

function toneOf(rarity: string | undefined): ActiveTraitInfo["tone"] {
  if (rarity === "PENALTY") return "penalty";
  if (rarity === "LEGENDARY" || rarity === "RARE") return "rare";
  return "good";
}

/** 표현형으로 발현된 모든 특성 — active 여부도 함께 표시. */
export function describeExpressedTraits(animal: AnimalRow): DetailedTraitInfo[] {
  const activeSet = new Set(animal.active_traits);
  const out: DetailedTraitInfo[] = [];
  for (const [id, geno] of Object.entries(animal.traits)) {
    const spec = TRAIT_REGISTRY[id];
    if (!spec) continue;
    if (!isTraitExpressed(spec, geno)) continue;
    out.push({
      id,
      label: spec.label_ko,
      tone: toneOf(spec.rarity_label),
      category: spec.category,
      description: spec.description,
      active: activeSet.has(id),
      carrier: false,
    });
  }
  return out;
}

/** 열성 보인자 특성 (이형접합으로 보유, 발현은 안 함). */
export function describeCarrierTraits(animal: AnimalRow): DetailedTraitInfo[] {
  const out: DetailedTraitInfo[] = [];
  for (const [id, geno] of Object.entries(animal.traits)) {
    const spec = TRAIT_REGISTRY[id];
    if (!spec) continue;
    if (!isTraitCarrier(spec, geno)) continue;
    out.push({
      id,
      label: spec.label_ko,
      tone: toneOf(spec.rarity_label),
      category: spec.category,
      description: spec.description,
      active: false,
      carrier: true,
    });
  }
  return out;
}

/** 외형 유전자 + 유전자형 코드 함께 (모달용). */
export function describeGenesWithGenotype(animal: Pick<AnimalRow, "genes" | "species">) {
  const species = getSpecies(animal.species);
  return species.genes.map((trait) => {
    const geno = animal.genes[trait.id];
    return {
      id: trait.id,
      label: trait.label_ko,
      phenotype: geno ? trait.expression(geno) : "—",
      genotype: geno ? `${geno[0]}/${geno[1]}` : "—",
    };
  });
}

/** 희귀 유전자 + 유전자형 코드 (모달용, 전부 노출). */
export function describeRareGenesWithGenotype(animal: Pick<AnimalRow, "rare_genes" | "species">) {
  const species = getSpecies(animal.species);
  return species.rare_genes.map((rare) => {
    const geno = animal.rare_genes[rare.id];
    return {
      id: rare.id,
      label: rare.label_ko,
      rarityLabel: rare.rarity_label,
      gradeBonus: rare.grade_bonus,
      status: geno ? rare.expression(geno) : ("none" as const),
      genotype: geno ? `${geno[0]}/${geno[1]}` : "—",
    };
  });
}

// ── 스탯 구간 라벨 ────────────────────────────────────────────────────────
//
// 1–20 / 21–40 / 41–60 / 61–80 / 81–99 + 100(완전체) 별도 등급.
// 기질은 "높을수록 좋음" 이 아니라 순함↔사나움 양극성 → 중립색.
// 그 외 스탯은 빨강→초록 그라데이션 (높을수록 좋음).

export type StatTier = {
  idx: number;          // 0~4, 또는 5(완전체)
  label: string;
  color: string;
  bg: string;
  perfect: boolean;
};

const TIER_COLORS = [
  { color: "#E24B4A", bg: "rgba(226,75,74,0.12)" },  // 1–20
  { color: "#EF9F27", bg: "rgba(239,159,39,0.14)" }, // 21–40
  { color: "#BA7517", bg: "rgba(186,117,23,0.12)" }, // 41–60
  { color: "#639922", bg: "rgba(99,153,34,0.15)" },  // 61–80
  { color: "#3B6D11", bg: "rgba(59,109,17,0.16)" },  // 81–99
];
const GOLD = { color: "#7a5b00", bg: "rgba(201,154,46,0.18)" };

// 기질 전용 중립 팔레트 (가치판단 없음 — 사나움=붉은기, 순함=푸른기)
const TEMPER_COLORS = [
  { color: "#C0563C", bg: "rgba(192,86,60,0.12)" },  // 포악
  { color: "#C99A2E", bg: "rgba(201,154,46,0.12)" }, // 거침
  { color: "#6B5942", bg: "rgba(61,47,31,0.08)" },   // 무던
  { color: "#3D7BA8", bg: "rgba(61,123,168,0.12)" }, // 온순
  { color: "#2E5E8C", bg: "rgba(46,94,140,0.14)" },  // 더없이 순함
];

// 스탯별 라벨 세트 (1–20 → 81–99)
const STAT_WORDS: Record<string, string[]> = {
  beauty:      ["볼품없음", "평범 이하", "평범", "준수함", "빼어남"],
  fertility:   ["불임 기질", "저조함", "보통", "왕성함", "다산형"],
  stamina:     ["허약함", "약함", "보통", "튼튼함", "강건함"],
  health:      ["병약함", "잔병치레", "양호함", "건강함", "강철 체질"],
  temperament: ["포악함", "거침", "무던함", "온순함", "더없이 순함"],
};

// 만점(100) 전용 라벨
const STAT_PERFECT: Record<string, string> = {
  beauty: "절세미모",
  fertility: "무한증식",
  stamina: "불굴",
  health: "무병장수",
  temperament: "천성 순둥이",
};

/**
 * 스탯 값 → 구간 정보.
 * statName: beauty | fertility | stamina | health | temperament
 */
export function statTier(statName: string, value: number): StatTier {
  const words = STAT_WORDS[statName] ?? ["최저", "낮음", "보통", "높음", "최고"];

  // 만점 — 완전체 등급
  if (value >= 100) {
    return {
      idx: 5,
      label: STAT_PERFECT[statName] ?? "완전체",
      color: GOLD.color,
      bg: GOLD.bg,
      perfect: true,
    };
  }

  // 0~99 → 5구간
  const i = value <= 20 ? 0 : value <= 40 ? 1 : value <= 60 ? 2 : value <= 80 ? 3 : 4;
  const palette = statName === "temperament" ? TEMPER_COLORS[i] : TIER_COLORS[i];
  return {
    idx: i,
    label: words[i],
    color: palette.color,
    bg: palette.bg,
    perfect: false,
  };
}