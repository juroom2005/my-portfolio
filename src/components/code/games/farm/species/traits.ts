// src/components/code/games/farm/species/traits.ts
//
// 특성(Trait) — 5번째 유전 계층. 외형/능력치가 아닌 "행동·게임 룰"을 결정.
// 예: 다산, 불임, 빠른 회복, 장수, 사교적 등.
//
// 새 특성 추가 = 이 파일에 TraitSpec 하나 추가 + TRAIT_REGISTRY 등록.
// 게임 코드는 동물의 traits 안에서 활성 특성을 읽고 effects 를 적용.

import type { Allele, Genotype, AlleleSpec } from "./types";

// ── 카테고리 ────────────────────────────────────────────────────────────
export const TRAIT_CATEGORIES = {
  reproductive: "생식",
  physical: "신체",
  behavioral: "기질",
  rare: "특수",
} as const;

export type TraitCategory = keyof typeof TRAIT_CATEGORIES;

// ── 유전 모델 ───────────────────────────────────────────────────────────
//
// 'dominant'   — 우성 알렐 하나만 있어도 발현 (예: 다산)
// 'recessive'  — 동형 열성일 때만 발현 (예: 알비노형 약점)
// 'codominant' — 두 알렐 모두 발현 (혼합 효과)
// 'fixed'      — 종 자체가 강제로 부여 (예: hybrid 의 sterile). 유전 무관.
export type TraitInheritance =
  | { kind: "dominant"; alleles: AlleleSpec[] }
  | { kind: "recessive"; alleles: AlleleSpec[] }
  | { kind: "codominant"; alleles: AlleleSpec[] }
  | { kind: "fixed" };

// ── 게임 룰 효과 ────────────────────────────────────────────────────────
//
// 게임 코드(breed, 손님 방문 로직 등)가 동물의 활성 특성을 읽고
// 여기 정의된 effect 들을 적용. 새 효과 종류 추가는 union 에 한 줄 + 게임 로직.
export type TraitEffect =
  | { type: "fertility_mult"; value: number }   // 임신 확률 × N
  | { type: "litter_bonus"; value: number }     // 산자수 ±N
  | { type: "sterile" }                          // 임신 불가 (단일 효과)
  | { type: "gestation_mult"; value: number }   // 임신 기간 × N
  | { type: "maturity_mult"; value: number }    // 성장 기간 × N
  | { type: "lifespan_mult"; value: number }
  | { type: "stat_bonus"; stat: "beauty" | "stamina" | "temperament" | "health" | "fertility"; value: number };

// ── TraitSpec ───────────────────────────────────────────────────────────
export type TraitSpec = {
  id: string;
  label_ko: string;
  label_en: string;
  category: TraitCategory;

  inheritance: TraitInheritance;

  effects: TraitEffect[];

  // 같이 가질 수 없는 특성 ID 목록 (예: 다산 ↔ 약한생식 상호배제)
  conflict_with?: string[];

  // UI 표기 보조
  rarity_label?: string;  // 'COMMON' | 'RARE' | 'UNIQUE'
  description?: string;

  // 변이로 등장할 확률 (0~1). 부모에게 없을 때 새끼에게 생길 확률.
  mutation_chance?: number;
};

// ── 동물이 들고 있는 특성 데이터 형태 ───────────────────────────────────
// DB animals.traits 컬럼에 이 모양으로 저장.
//   { "prolific": ["P", "p"], "sterile": ["S", "S"] }
export type TraitGenotypes = Record<string, Genotype>;

// 'fixed' 특성은 알렐 없이 발현 상태만 표현 — 빈 배열로 통일하거나
// 따로 키 형식을 두어도 됨. 단순화를 위해 빈 배열 [['', '']] 로 표현하고
// 코드 측에서 inheritance kind 로 분기.

// ── 표현형 판정 ─────────────────────────────────────────────────────────
//
// 동물이 이 특성을 "발현" 하고 있는가? (보인자는 false, 발현만 true)
export function isTraitExpressed(spec: TraitSpec, genotype: Genotype | undefined): boolean {
  if (spec.inheritance.kind === "fixed") {
    // fixed 특성은 traits 객체에 키가 존재하면 발현된 걸로 간주
    return genotype !== undefined;
  }
  if (!genotype) return false;
  const [a, b] = genotype;

  switch (spec.inheritance.kind) {
    case "dominant": {
      // 우성 알렐(dominant: true) 하나라도 있으면 발현
      const dom = spec.inheritance.alleles.find((al) => al.dominant)?.code;
      return a === dom || b === dom;
    }
    case "recessive": {
      // 열성 알렐(dominant: false) 가 동형접합일 때만 발현
      const rec = spec.inheritance.alleles.find((al) => !al.dominant)?.code;
      return a === rec && b === rec;
    }
    case "codominant": {
      // 두 알렐이 모두 dominant=true 컬렉션 내에 있고, 서로 다르면 혼합 발현으로 간주
      return spec.inheritance.alleles.some((al) => al.code === a)
        && spec.inheritance.alleles.some((al) => al.code === b)
        && a !== b;
    }
  }
}

// 보인자(carrier) 여부 — 열성 특성에만 의미 있음
export function isTraitCarrier(spec: TraitSpec, genotype: Genotype | undefined): boolean {
  if (spec.inheritance.kind !== "recessive") return false;
  if (!genotype) return false;
  const rec = spec.inheritance.alleles.find((al) => !al.dominant)?.code;
  const [a, b] = genotype;
  return (a === rec) !== (b === rec); // XOR — 하나만 열성
}

// ── 활성 효과 수집 ──────────────────────────────────────────────────────
//
// 동물의 traits 데이터에서 "현재 발현 중인" 특성들의 effects 를 모아서 반환.
// breed/visit 로직이 이 결과를 가지고 룰 적용.
export function collectActiveEffects(
  traits: TraitGenotypes,
  registry: Record<string, TraitSpec>,
): TraitEffect[] {
  const effects: TraitEffect[] = [];
  for (const [traitId, genotype] of Object.entries(traits)) {
    const spec = registry[traitId];
    if (!spec) continue;
    if (isTraitExpressed(spec, genotype)) {
      effects.push(...spec.effects);
    }
  }
  return effects;
}

// 발현된 sterile 효과가 하나라도 있으면 true — is_sterile 컬럼 캐시용
export function computeIsSterile(effects: TraitEffect[]): boolean {
  return effects.some((e) => e.type === "sterile");
}

// ── 글로벌 레지스트리 ───────────────────────────────────────────────────
//
// 모든 특성은 여기 등록. 종에 종속되지 않은 공용 레지스트리.
// 종마다 "이 특성 사용 가능" 화이트리스트를 species 매니페스트에서 가질 수도 있음.
// 지금은 비어 있고, 다음 단계에서 reproductive 카테고리부터 채울 예정.
export const TRAIT_REGISTRY: Record<string, TraitSpec> = {};

// 헬퍼 — 특성 등록
export function registerTrait(spec: TraitSpec): void {
  TRAIT_REGISTRY[spec.id] = spec;
}
