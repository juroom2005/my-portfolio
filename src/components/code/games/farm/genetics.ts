// src/components/code/games/farm/genetics.ts
//
// 유전 시스템 코어 — pure 함수들. DB 접근 없음. 시드만 주면 결정성.
//
// 공개 API:
//   makeStarter      — 1세대 시작 동물 (parents 없음)
//   makeVisitorBuck  — 손님이 데려오는 방문 수컷
//   breed            — 부모 둘 → BreedResult (임신 실패 or 새끼 N마리)
//
// traits (5번째 계층) 인프라는 들어왔으나 effects 적용은 아직 비활성.
// TRAIT_REGISTRY 가 비어있어서 collectActiveEffects 는 항상 빈 배열 반환.
// 다음 단계에서 reproductive 카테고리부터 채우고 effects 로직 활성화.

import { Rng } from "./rng";
import {
  getSpecies,
  type Species,
  type Allele,
  type Genotype,
  type GeneTrait,
  type RareGeneSpec,
  TRAIT_REGISTRY,
  collectActiveEffects,
  computeIsSterile,
} from "./species";

// ── 게임 디자인 상수 ────────────────────────────────────────────────────
const MUTATION_RATE = 0.03;
const STAT_NOISE = 8;
const INBREEDING_STAT_PENALTY = 15;
const INBREEDING_FERTILITY_PENALTY = 0.6;

// ── 데이터 타입 ─────────────────────────────────────────────────────────
export type NewAnimalData = {
  species: string;
  sex: "F" | "M";
  generation: number;
  mother_id: string | null;
  father_id: string | null;
  genes: Record<string, Genotype>;
  rare_genes: Record<string, Genotype>;
  traits: Record<string, Genotype>;
  is_sterile: boolean;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
};

export type ParentAnimal = {
  id: string;
  species: string;
  sex: "F" | "M";
  generation: number;
  mother_id: string | null;
  father_id: string | null;
  genes: Record<string, Genotype>;
  rare_genes: Record<string, Genotype>;
  traits: Record<string, Genotype>;
  is_sterile: boolean;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
};

export type BreedInput = {
  mother: ParentAnimal;
  father: ParentAnimal;
  inbreedingF: number;
  seed: number | string;
};

export type BreedResult =
  | { pregnancy: false; reason?: string }
  | { pregnancy: true; offspring: NewAnimalData[] };

export type StarterChoices = {
  phenotypes?: Record<string, string>;
};

// ── 1세대 시작 동물 ─────────────────────────────────────────────────────

export function makeStarter(
  species: Species,
  sex: "F" | "M",
  rng: Rng,
  choices?: StarterChoices,
): NewAnimalData {
  const genes: Record<string, Genotype> = {};
  for (const trait of species.genes) {
    const chosen = choices?.phenotypes?.[trait.id];
    if (chosen) {
      const allele = findAlleleForPhenotype(trait, chosen);
      genes[trait.id] = [allele, allele];
    } else {
      genes[trait.id] = [rng.pick(trait.alleles).code, rng.pick(trait.alleles).code];
    }
  }

  const rare_genes: Record<string, Genotype> = {};
  for (const rare of species.rare_genes) {
    const normal = findNormalAllele(rare);
    const recessive = findRareAllele(rare);
    const isCarrier = rng.roll(rare.starter_carrier_chance ?? 0);
    rare_genes[rare.id] = isCarrier
      ? rng.roll(0.5)
        ? [normal, recessive]
        : [recessive, normal]
      : [normal, normal];
  }

  // traits: 인프라만. 시작 동물엔 기본 특성 없음.
  // 향후 species 매니페스트에 starter_traits 같은 화이트리스트 추가 가능.
  const traits: Record<string, Genotype> = {};
  const is_sterile = computeIsSterile(collectActiveEffects(traits, TRAIT_REGISTRY));

  const { min, max } = species.starter_stat_range;
  const statRoll = () => Math.round(rng.range(min, max));

  return {
    species: species.id,
    sex,
    generation: 1,
    mother_id: null,
    father_id: null,
    genes,
    rare_genes,
    traits,
    is_sterile,
    beauty: statRoll(),
    stamina: statRoll(),
    temperament: statRoll(),
    health: statRoll(),
    fertility: statRoll(),
  };
}

export function makeVisitorBuck(
  species: Species,
  rng: Rng,
  farmFame: number,
): NewAnimalData {
  const base = makeStarter(species, "M", rng);
  const fameBonus = Math.min(20, Math.floor(farmFame / 10));
  const bump = (v: number) => Math.min(100, v + Math.round(rng.gauss(fameBonus, 4)));
  return {
    ...base,
    beauty: bump(base.beauty),
    stamina: bump(base.stamina),
    temperament: bump(base.temperament),
    health: bump(base.health),
    fertility: bump(base.fertility),
  };
}

// ── 교배 ────────────────────────────────────────────────────────────────

export function breed(species: Species, input: BreedInput): BreedResult {
  if (input.mother.species !== species.id || input.father.species !== species.id) {
    return { pregnancy: false, reason: "species mismatch" };
  }
  if (input.mother.sex !== "F" || input.father.sex !== "M") {
    return { pregnancy: false, reason: "sex mismatch" };
  }

  // 특성 — sterile 확인 (캐시된 플래그 우선, 없으면 effects 재계산)
  if (input.mother.is_sterile || input.father.is_sterile) {
    return { pregnancy: false, reason: "sterile parent" };
  }

  const rng = new Rng(input.seed);

  // 특성 효과 수집 (현재 registry 비어있으면 빈 배열)
  const motherEffects = collectActiveEffects(input.mother.traits, TRAIT_REGISTRY);
  const fatherEffects = collectActiveEffects(input.father.traits, TRAIT_REGISTRY);
  const allEffects = [...motherEffects, ...fatherEffects];

  // 임신 성공 판정
  const fertilityFactor = (input.mother.fertility + input.father.fertility) / 200;
  const inbreedingFactor = 1 - input.inbreedingF * INBREEDING_FERTILITY_PENALTY;
  let pSuccess = species.base_fertility * fertilityFactor * inbreedingFactor;

  // 특성 fertility_mult 효과 누적 적용
  for (const eff of allEffects) {
    if (eff.type === "fertility_mult") pSuccess *= eff.value;
  }

  if (!rng.roll(Math.min(1, Math.max(0, pSuccess)))) {
    return { pregnancy: false, reason: "roll failed" };
  }

  // 산자수 — base + 특성 litter_bonus 누적
  let litterCount = rng.intRange(species.litter_min, species.litter_max);
  for (const eff of allEffects) {
    if (eff.type === "litter_bonus") litterCount += eff.value;
  }
  litterCount = Math.max(1, litterCount);

  const offspring: NewAnimalData[] = [];
  for (let i = 0; i < litterCount; i++) {
    offspring.push(makeOffspring(species, input, rng));
  }

  return { pregnancy: true, offspring };
}

function makeOffspring(species: Species, input: BreedInput, rng: Rng): NewAnimalData {
  // 외형 유전자 (멘델 + 변이)
  const genes: Record<string, Genotype> = {};
  for (const trait of species.genes) {
    const pool = trait.alleles.map((a) => a.code);
    const m = inheritAllele(input.mother.genes[trait.id], rng);
    const f = inheritAllele(input.father.genes[trait.id], rng);
    genes[trait.id] = [maybeMutate(m, pool, rng), maybeMutate(f, pool, rng)];
  }

  // 희귀 유전자
  const rare_genes: Record<string, Genotype> = {};
  for (const rare of species.rare_genes) {
    const normal = findNormalAllele(rare);
    const recessive = findRareAllele(rare);
    const pool: Allele[] = [normal, recessive];
    const motherGeno: Genotype = input.mother.rare_genes[rare.id] ?? [normal, normal];
    const fatherGeno: Genotype = input.father.rare_genes[rare.id] ?? [normal, normal];
    const m = inheritAllele(motherGeno, rng);
    const f = inheritAllele(fatherGeno, rng);
    rare_genes[rare.id] = [maybeMutate(m, pool, rng), maybeMutate(f, pool, rng)];
  }

  // 특성 — 부모가 가진 trait들을 각각 멘델 방식으로 상속
  // (TRAIT_REGISTRY에 등록된 것 + 부모 traits 둘 다 순회)
  const traits: Record<string, Genotype> = {};
  const allTraitIds = new Set([
    ...Object.keys(input.mother.traits),
    ...Object.keys(input.father.traits),
  ]);
  for (const traitId of allTraitIds) {
    const spec = TRAIT_REGISTRY[traitId];
    if (!spec) continue;
    if (spec.inheritance.kind === "fixed") continue; // fixed는 종 매니페스트가 처리, 유전 무관

    const motherGeno = input.mother.traits[traitId];
    const fatherGeno = input.father.traits[traitId];
    if (!motherGeno && !fatherGeno) continue;

    // 알렐 풀
    const pool = spec.inheritance.alleles.map((a) => a.code);

    // 부모가 안 가진 trait는 정상 알렐 추정 (현재는 알 수 없으니 skip)
    if (!motherGeno || !fatherGeno) continue;

    const m = inheritAllele(motherGeno, rng);
    const f = inheritAllele(fatherGeno, rng);
    traits[traitId] = [maybeMutate(m, pool, rng), maybeMutate(f, pool, rng)];
  }

  // 변이로 새 trait 등장 — registry 의 모든 trait 에 대해 mutation_chance 검사
  for (const spec of Object.values(TRAIT_REGISTRY)) {
    if (spec.inheritance.kind === "fixed") continue;
    if (traits[spec.id]) continue; // 이미 상속됐으면 skip
    const chance = spec.mutation_chance ?? 0;
    if (chance > 0 && rng.roll(chance)) {
      const pool = spec.inheritance.alleles.map((a) => a.code);
      traits[spec.id] = [rng.pick(pool), rng.pick(pool)];
    }
  }

  // is_sterile 캐시 계산
  const is_sterile = computeIsSterile(collectActiveEffects(traits, TRAIT_REGISTRY));

  // 능력치
  const penalty = input.inbreedingF * INBREEDING_STAT_PENALTY;
  const motherEffects = collectActiveEffects(input.mother.traits, TRAIT_REGISTRY);
  const fatherEffects = collectActiveEffects(input.father.traits, TRAIT_REGISTRY);
  const allEffects = [...motherEffects, ...fatherEffects];
  const statBonus = (statName: string): number => {
    let total = 0;
    for (const eff of allEffects) {
      if (eff.type === "stat_bonus" && eff.stat === statName) total += eff.value;
    }
    return total;
  };

  const stat = (statName: "beauty" | "stamina" | "temperament" | "health" | "fertility", mv: number, fv: number) => {
    const raw = (mv + fv) / 2 + rng.gauss(0, STAT_NOISE) - penalty + statBonus(statName);
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const sex: "F" | "M" = rng.roll(0.5) ? "F" : "M";
  const generation = Math.max(input.mother.generation, input.father.generation) + 1;

  return {
    species: species.id,
    sex,
    generation,
    mother_id: input.mother.id,
    father_id: input.father.id,
    genes,
    rare_genes,
    traits,
    is_sterile,
    beauty: stat("beauty", input.mother.beauty, input.father.beauty),
    stamina: stat("stamina", input.mother.stamina, input.father.stamina),
    temperament: stat("temperament", input.mother.temperament, input.father.temperament),
    health: stat("health", input.mother.health, input.father.health),
    fertility: stat("fertility", input.mother.fertility, input.father.fertility),
  };
}

// ── 헬퍼 ────────────────────────────────────────────────────────────────

function inheritAllele(genotype: Genotype, rng: Rng): Allele {
  return rng.roll(0.5) ? genotype[0] : genotype[1];
}

function maybeMutate(allele: Allele, pool: readonly Allele[], rng: Rng): Allele {
  if (rng.roll(MUTATION_RATE)) return rng.pick(pool);
  return allele;
}

function findAlleleForPhenotype(trait: GeneTrait, phenotype: string): Allele {
  for (const allele of trait.alleles) {
    if (trait.expression([allele.code, allele.code]) === phenotype) {
      return allele.code;
    }
  }
  return trait.alleles[0].code;
}

function findNormalAllele(rare: RareGeneSpec): Allele {
  const dom = rare.alleles.find((a) => a.dominant);
  if (!dom) throw new Error(`Rare gene "${rare.id}" has no dominant (normal) allele`);
  return dom.code;
}

function findRareAllele(rare: RareGeneSpec): Allele {
  const rec = rare.alleles.find((a) => !a.dominant);
  if (!rec) throw new Error(`Rare gene "${rare.id}" has no recessive (rare) allele`);
  return rec.code;
}

export { getSpecies };