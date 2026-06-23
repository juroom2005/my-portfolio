// src/components/code/games/farm/genetics.ts
//
// 유전 시스템 코어 — pure 함수들. 시드만 주면 결정성.
//
// makeStarter / makeVisitorBuck / breed 모두 등급(grade) 와 활성 특성(active_traits)
// 까지 계산해서 반환. NewAnimalData 는 DB insert 직전의 완성된 모양.

import { Rng, deriveSeed } from "./rng";
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
  computeActiveTraits,
  isTraitExpressed,
} from "./species";
import { calcGrade } from "./grading";
import type { Grade } from "./dbTypes";

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
  active_traits: string[];
  is_sterile: boolean;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
  grade: Grade;
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
  active_traits: string[];
  is_sterile: boolean;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
  grade: Grade | null;
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
  // 외형 유전자
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

  // 희귀 유전자
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

  // 특성 — starter_carrier_chance 기반 보인자/이형 부여
  const traits: Record<string, Genotype> = {};
  for (const spec of Object.values(TRAIT_REGISTRY)) {
    if (spec.inheritance.kind === "fixed") continue;
    const chance = spec.starter_carrier_chance ?? 0;
    if (chance > 0 && rng.roll(chance)) {
      const dom = spec.inheritance.alleles.find((a) => a.dominant)?.code;
      const rec = spec.inheritance.alleles.find((a) => !a.dominant)?.code;
      if (dom && rec) {
        traits[spec.id] = rng.roll(0.5) ? [dom, rec] : [rec, dom];
      }
    }
  }

  // 능력치
  const { min, max } = species.starter_stat_range;
  const beauty = Math.round(rng.range(min, max));
  const stamina = Math.round(rng.range(min, max));
  const temperament = Math.round(rng.range(min, max));
  const health = Math.round(rng.range(min, max));
  const fertility = Math.round(rng.range(min, max));

  // 등급 계산
  const grade = calcGrade({
    beauty, stamina, temperament, health, fertility,
    rare_genes, species: species.id,
  });

  // 활성 특성 결정 (시작 동물 캡 2)
  const active_traits = computeActiveTraits(traits, grade, rng, { isStarter: true });
  const is_sterile = computeIsSterile(active_traits);

  return {
    species: species.id,
    sex,
    generation: 1,
    mother_id: null,
    father_id: null,
    genes,
    rare_genes,
    traits,
    active_traits,
    is_sterile,
    beauty, stamina, temperament, health, fertility,
    grade,
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

  const beauty = bump(base.beauty);
  const stamina = bump(base.stamina);
  const temperament = bump(base.temperament);
  const health = bump(base.health);
  const fertility = bump(base.fertility);

  const grade = calcGrade({
    beauty, stamina, temperament, health, fertility,
    rare_genes: base.rare_genes, species: base.species,
  });

  // 방문 수컷은 starter 캡 적용 안 함 — 정상 등급 슬롯 사용
  const active_traits = computeActiveTraits(base.traits, grade, rng);
  const is_sterile = computeIsSterile(active_traits);

  return {
    ...base,
    beauty, stamina, temperament, health, fertility,
    grade,
    active_traits,
    is_sterile,
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
  if (input.mother.is_sterile || input.father.is_sterile) {
    return { pregnancy: false, reason: "sterile parent" };
  }

  const rng = new Rng(input.seed);

  // 활성 특성 기반 효과 수집
  const motherEffects = collectActiveEffects(input.mother.active_traits, TRAIT_REGISTRY);
  const fatherEffects = collectActiveEffects(input.father.active_traits, TRAIT_REGISTRY);
  const allEffects = [...motherEffects, ...fatherEffects];

  // 임신 성공
  const fertilityFactor = (input.mother.fertility + input.father.fertility) / 200;
  const inbreedingFactor = 1 - input.inbreedingF * INBREEDING_FERTILITY_PENALTY;
  let pSuccess = species.base_fertility * fertilityFactor * inbreedingFactor;

  for (const eff of allEffects) {
    if (eff.type === "fertility_mult") pSuccess *= eff.value;
  }

  if (!rng.roll(Math.min(1, Math.max(0, pSuccess)))) {
    return { pregnancy: false, reason: "roll failed" };
  }

  // 산자수
  let litterCount = rng.intRange(species.litter_min, species.litter_max);
  for (const eff of allEffects) {
    if (eff.type === "litter_bonus") litterCount += eff.value;
  }
  litterCount = Math.max(1, litterCount);

  const offspring: NewAnimalData[] = [];
  for (let i = 0; i < litterCount; i++) {
    offspring.push(makeOffspring(species, input, rng, allEffects));
  }

  return { pregnancy: true, offspring };
}

function makeOffspring(
  species: Species,
  input: BreedInput,
  rng: Rng,
  parentEffects: ReturnType<typeof collectActiveEffects>,
): NewAnimalData {
  // 외형 유전자
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

  // 특성 — 각 부모가 가진 특성마다 독립 멘델 유전
  const traits: Record<string, Genotype> = {};
  const allTraitIds = new Set([
    ...Object.keys(input.mother.traits),
    ...Object.keys(input.father.traits),
  ]);

  for (const traitId of allTraitIds) {
    const spec = TRAIT_REGISTRY[traitId];
    if (!spec) continue;
    if (spec.inheritance.kind === "fixed") continue;

    const pool = spec.inheritance.alleles.map((a) => a.code);
    // 한쪽 부모만 가진 특성도 처리 — 안 가진 쪽은 정상 알렐 가정
    const dom = spec.inheritance.alleles.find((a) => a.dominant)?.code ?? pool[0];
    const motherGeno: Genotype = input.mother.traits[traitId] ?? [dom, dom];
    const fatherGeno: Genotype = input.father.traits[traitId] ?? [dom, dom];

    const m = inheritAllele(motherGeno, rng);
    const f = inheritAllele(fatherGeno, rng);
    const offspring_geno: Genotype = [maybeMutate(m, pool, rng), maybeMutate(f, pool, rng)];

    // 정상×정상이면 traits 에 기록 안 함 (잡음 제거)
    if (offspring_geno[0] !== dom || offspring_geno[1] !== dom) {
      traits[traitId] = offspring_geno;
    }
  }

  // 변이로 새 특성 등장
  for (const spec of Object.values(TRAIT_REGISTRY)) {
    if (spec.inheritance.kind === "fixed") continue;
    if (traits[spec.id]) continue;
    const chance = spec.mutation_chance ?? 0;
    if (chance > 0 && rng.roll(chance)) {
      const pool = spec.inheritance.alleles.map((a) => a.code);
      traits[spec.id] = [rng.pick(pool), rng.pick(pool)];
    }
  }

  // 능력치 — mid-parent + 가우시안 - 근친 페널티 + 부모 stat_bonus
  const penalty = input.inbreedingF * INBREEDING_STAT_PENALTY;
  const statBonus = (statName: string): number => {
    let total = 0;
    for (const eff of parentEffects) {
      if (eff.type === "stat_bonus" && eff.stat === statName) total += eff.value;
    }
    return total;
  };

  const stat = (statName: "beauty" | "stamina" | "temperament" | "health" | "fertility", mv: number, fv: number) => {
    const raw = (mv + fv) / 2 + rng.gauss(0, STAT_NOISE) - penalty + statBonus(statName);
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const beauty = stat("beauty", input.mother.beauty, input.father.beauty);
  const stamina = stat("stamina", input.mother.stamina, input.father.stamina);
  const temperament = stat("temperament", input.mother.temperament, input.father.temperament);
  const health = stat("health", input.mother.health, input.father.health);
  const fertility = stat("fertility", input.mother.fertility, input.father.fertility);

  const grade = calcGrade({
    beauty, stamina, temperament, health, fertility,
    rare_genes, species: species.id,
  });

  // 새끼는 starter 캡 없음 — 등급 슬롯만큼 활성
  const active_traits = computeActiveTraits(traits, grade, rng);
  const is_sterile = computeIsSterile(active_traits);

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
    active_traits,
    is_sterile,
    beauty, stamina, temperament, health, fertility,
    grade,
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