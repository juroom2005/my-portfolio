// src/components/code/games/farm/species/traits.ts
//
// 5번째 유전 계층 — 특성(Trait).
// 등급별 슬롯이 있어 발현된 특성이 다 활성화되진 않음.
// 슬롯 초과분은 잠재 상태로 traits 데이터에만 보존, 등급 오르면 깨어남.

import type { Allele, Genotype, AlleleSpec } from "./types";
import { Rng } from "../rng";
import type { Grade } from "../dbTypes";

// ── 카테고리 ────────────────────────────────────────────────────────────
export const TRAIT_CATEGORIES = {
  reproductive: "생식",
  economic: "경제",
  physical: "신체",
  behavioral: "기질",
  rare: "특수",
} as const;

export type TraitCategory = keyof typeof TRAIT_CATEGORIES;

// ── 유전 모델 ───────────────────────────────────────────────────────────
export type TraitInheritance =
  | { kind: "dominant"; alleles: AlleleSpec[] }
  | { kind: "recessive"; alleles: AlleleSpec[] }
  | { kind: "codominant"; alleles: AlleleSpec[] }
  | { kind: "fixed" };

// ── 게임 룰 효과 ────────────────────────────────────────────────────────
export type TraitEffect =
  | { type: "fertility_mult"; value: number }
  | { type: "litter_bonus"; value: number }
  | { type: "sterile" }
  | { type: "gestation_mult"; value: number }
  | { type: "maturity_mult"; value: number }
  | { type: "lifespan_mult"; value: number }
  | { type: "stat_bonus"; stat: "beauty" | "stamina" | "temperament" | "health" | "fertility"; value: number }
  | { type: "daily_income"; value: number }
  | { type: "visit_freq_mult"; value: number }
  | { type: "tip_chance"; value: number }
  | { type: "gift_chance"; value: number }
  | { type: "sick_chance"; value: number };

// ── TraitSpec ───────────────────────────────────────────────────────────
export type TraitSpec = {
  id: string;
  label_ko: string;
  label_en: string;
  category: TraitCategory;
  inheritance: TraitInheritance;
  effects: TraitEffect[];
  conflict_with?: string[];
  rarity_label?: "COMMON" | "UNCOMMON" | "RARE" | "LEGENDARY" | "PENALTY";
  description?: string;

  /** 시작 동물에 이형접합으로 부여될 확률 (우성은 발현, 열성은 보인자) */
  starter_carrier_chance?: number;
  /** 부모에게 없을 때 새끼에 새로 등장할 확률 (변이) */
  mutation_chance?: number;
};

export type TraitGenotypes = Record<string, Genotype>;

// ── 표현형 판정 ─────────────────────────────────────────────────────────
export function isTraitExpressed(spec: TraitSpec, genotype: Genotype | undefined): boolean {
  if (spec.inheritance.kind === "fixed") return genotype !== undefined;
  if (!genotype) return false;
  const [a, b] = genotype;

  switch (spec.inheritance.kind) {
    case "dominant": {
      const dom = spec.inheritance.alleles.find((al) => al.dominant)?.code;
      return a === dom || b === dom;
    }
    case "recessive": {
      const rec = spec.inheritance.alleles.find((al) => !al.dominant)?.code;
      return a === rec && b === rec;
    }
    case "codominant": {
      return spec.inheritance.alleles.some((al) => al.code === a)
        && spec.inheritance.alleles.some((al) => al.code === b)
        && a !== b;
    }
  }
}

export function isTraitCarrier(spec: TraitSpec, genotype: Genotype | undefined): boolean {
  if (spec.inheritance.kind !== "recessive") return false;
  if (!genotype) return false;
  const rec = spec.inheritance.alleles.find((al) => !al.dominant)?.code;
  const [a, b] = genotype;
  return (a === rec) !== (b === rec);
}

// ── 활성 효과 수집 ──────────────────────────────────────────────────────
// 이제 active_traits 배열만 봄. 잠재(슬롯 초과로 비활성)는 효과 없음.
export function collectActiveEffects(
  activeTraitIds: string[],
  registry: Record<string, TraitSpec>,
): TraitEffect[] {
  const effects: TraitEffect[] = [];
  for (const id of activeTraitIds) {
    const spec = registry[id];
    if (!spec) continue;
    effects.push(...spec.effects);
  }
  return effects;
}

export function computeIsSterile(activeTraitIds: string[]): boolean {
  return activeTraitIds.includes("sterile");
}

// ── 등급별 슬롯 ─────────────────────────────────────────────────────────
const GRADE_SLOTS: Record<Grade, number> = {
  F: 0, E: 0, D: 0,
  C: 1, B: 1,
  A: 2, S: 2,
  "S+": 3,
};

export function traitSlots(grade: Grade): number {
  return GRADE_SLOTS[grade] ?? 0;
}

/** 시작 동물 슬롯 캡 — 등급과 무관 */
export const STARTER_TRAIT_CAP = 2;

// ── 활성 특성 결정 ──────────────────────────────────────────────────────
// 발현된 특성 중 슬롯 수만큼 무작위 활성. 슬롯 초과분은 잠재.
// rng 그대로 사용 — 호출 측 시드에 의존.
export function computeActiveTraits(
  traits: TraitGenotypes,
  grade: Grade,
  rng: Rng,
  options: { isStarter?: boolean } = {},
): string[] {
  const expressed: string[] = [];
  for (const [id, geno] of Object.entries(traits)) {
    const spec = TRAIT_REGISTRY[id];
    if (!spec) continue;
    if (isTraitExpressed(spec, geno)) expressed.push(id);
  }

  let maxSlots = traitSlots(grade);
  if (options.isStarter) maxSlots = Math.min(STARTER_TRAIT_CAP, maxSlots);

  if (expressed.length <= maxSlots) return expressed.sort();

  // Fisher-Yates 셔플 후 슬롯만큼 선택
  const shuffled = [...expressed];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, maxSlots).sort();
}

// ── 글로벌 레지스트리 ───────────────────────────────────────────────────
export const TRAIT_REGISTRY: Record<string, TraitSpec> = {};

export function registerTrait(spec: TraitSpec): void {
  TRAIT_REGISTRY[spec.id] = spec;
}

// ═══════════════════════════════════════════════════════════════════════
// 특성 풀 (11개)
// ═══════════════════════════════════════════════════════════════════════

// ── 생식 ────────────────────────────────────────────────────────────────
registerTrait({
  id: "prolific",
  label_ko: "다산",
  label_en: "Prolific",
  category: "reproductive",
  inheritance: {
    kind: "dominant",
    alleles: [
      { code: "P", label_ko: "다산", dominant: true },
      { code: "p", label_ko: "보통", dominant: false },
    ],
  },
  effects: [{ type: "litter_bonus", value: 1 }],
  rarity_label: "COMMON",
  description: "산자수 +1",
  starter_carrier_chance: 0.15,
  mutation_chance: 0.01,
});

registerTrait({
  id: "subfertile",
  label_ko: "약한 생식",
  label_en: "Subfertile",
  category: "reproductive",
  inheritance: {
    kind: "recessive",
    alleles: [
      { code: "F", label_ko: "정상", dominant: true },
      { code: "f", label_ko: "약한 생식", dominant: false },
    ],
  },
  effects: [{ type: "fertility_mult", value: 0.6 }],
  rarity_label: "COMMON",
  description: "임신 확률 ×0.6",
  starter_carrier_chance: 0.15,
  mutation_chance: 0.005,
});

registerTrait({
  id: "sterile",
  label_ko: "불임",
  label_en: "Sterile",
  category: "reproductive",
  inheritance: {
    kind: "dominant",
    alleles: [
      { code: "X", label_ko: "불임", dominant: true },
      { code: "x", label_ko: "정상", dominant: false },
    ],
  },
  effects: [{ type: "sterile" }],
  rarity_label: "PENALTY",
  description: "임신 불가",
  starter_carrier_chance: 0,
  mutation_chance: 0.001,
});

registerTrait({
  id: "quick_recovery",
  label_ko: "빠른 회복",
  label_en: "Quick Recovery",
  category: "reproductive",
  inheritance: {
    kind: "recessive",
    alleles: [
      { code: "Q", label_ko: "정상", dominant: true },
      { code: "q", label_ko: "빠른 회복", dominant: false },
    ],
  },
  effects: [{ type: "gestation_mult", value: 0.5 }],
  rarity_label: "UNCOMMON",
  description: "임신 기간 ×0.5",
  starter_carrier_chance: 0.1,
  mutation_chance: 0.005,
});

// ── 경제 ────────────────────────────────────────────────────────────────
registerTrait({
  id: "productive",
  label_ko: "소득",
  label_en: "Productive",
  category: "economic",
  inheritance: {
    kind: "dominant",
    alleles: [
      { code: "D", label_ko: "소득", dominant: true },
      { code: "d", label_ko: "보통", dominant: false },
    ],
  },
  effects: [{ type: "daily_income", value: 5 }],
  rarity_label: "COMMON",
  description: "매일 자동 수입 +5c",
  starter_carrier_chance: 0.15,
  mutation_chance: 0.01,
});

registerTrait({
  id: "lucky",
  label_ko: "행운",
  label_en: "Lucky",
  category: "economic",
  inheritance: {
    kind: "recessive",
    alleles: [
      { code: "K", label_ko: "정상", dominant: true },
      { code: "k", label_ko: "행운", dominant: false },
    ],
  },
  effects: [{ type: "tip_chance", value: 0.15 }],
  rarity_label: "RARE",
  description: "손님 팁 확률 15%",
  starter_carrier_chance: 0.05,
  mutation_chance: 0.002,
});

registerTrait({
  id: "charming",
  label_ko: "매력",
  label_en: "Charming",
  category: "economic",
  inheritance: {
    kind: "dominant",
    alleles: [
      { code: "M", label_ko: "매력", dominant: true },
      { code: "m", label_ko: "보통", dominant: false },
    ],
  },
  effects: [{ type: "visit_freq_mult", value: 1.2 }],
  rarity_label: "UNCOMMON",
  description: "같은 종 방문 빈도 +20%",
  starter_carrier_chance: 0.1,
  mutation_chance: 0.005,
});

registerTrait({
  id: "collector",
  label_ko: "수집가",
  label_en: "Collector",
  category: "economic",
  inheritance: {
    kind: "recessive",
    alleles: [
      { code: "T", label_ko: "정상", dominant: true },
      { code: "t", label_ko: "수집가", dominant: false },
    ],
  },
  effects: [{ type: "gift_chance", value: 0.1 }],
  rarity_label: "RARE",
  description: "손님이 떠날 때 가끔 선물",
  starter_carrier_chance: 0.05,
  mutation_chance: 0.002,
});

// ── 신체 ────────────────────────────────────────────────────────────────
registerTrait({
  id: "long_lived",
  label_ko: "장수",
  label_en: "Long-lived",
  category: "physical",
  inheritance: {
    kind: "recessive",
    alleles: [
      { code: "G", label_ko: "정상", dominant: true },
      { code: "g", label_ko: "장수", dominant: false },
    ],
  },
  effects: [{ type: "lifespan_mult", value: 1.5 }],
  rarity_label: "UNCOMMON",
  description: "수명 ×1.5",
  starter_carrier_chance: 0.1,
  mutation_chance: 0.005,
});

registerTrait({
  id: "frail",
  label_ko: "병약",
  label_en: "Frail",
  category: "physical",
  inheritance: {
    kind: "dominant",
    alleles: [
      { code: "Y", label_ko: "병약", dominant: true },
      { code: "y", label_ko: "정상", dominant: false },
    ],
  },
  effects: [{ type: "sick_chance", value: 0.1 }],
  rarity_label: "PENALTY",
  description: "가끔 아픔 (영업 불가)",
  starter_carrier_chance: 0,
  mutation_chance: 0.003,
});

registerTrait({
  id: "robust",
  label_ko: "강건",
  label_en: "Robust",
  category: "physical",
  inheritance: {
    kind: "dominant",
    alleles: [
      { code: "R", label_ko: "강건", dominant: true },
      { code: "r", label_ko: "보통", dominant: false },
    ],
  },
  effects: [{ type: "stat_bonus", stat: "health", value: 10 }],
  rarity_label: "COMMON",
  description: "health +10",
  starter_carrier_chance: 0.15,
  mutation_chance: 0.01,
});