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
import {
  type Ancestry,
  pureAncestry,
  mixAncestry,
  decideMajorSpecies,
  getOrInferAncestry,
} from "./ancestry";

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
  /** 혈통 비율 (종 id → 비율, 합 1.0). 풀이면 단일 종 1.0. */
  ancestry: Ancestry;
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
  /** 부모의 혈통. 없으면 species 기준 순종으로 폴백. */
  ancestry?: Ancestry | null;
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
    ancestry: pureAncestry(species.id),
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
//
// 혼혈 지원: 부모 종이 달라도 OK. 자식 ancestry = 부모 두 ancestry 평균.
// 자식의 종(species) = 주(major) 종. 생리적 파라미터(base_fertility, gestation,
// litter)는 모친 종 기준 (자궁이 모친 거라).
//
// species 인자는 "자식이 속할 종" 으로 호출자가 결정해서 넘기지 않아도 됨 —
// 내부에서 자동 결정. 단 하위 호환을 위해 species 가 주어지면 그걸로 강제.

export function breed(speciesHint: Species | null, input: BreedInput): BreedResult {
  if (input.mother.sex !== "F" || input.father.sex !== "M") {
    return { pregnancy: false, reason: "sex mismatch" };
  }
  if (input.mother.is_sterile || input.father.is_sterile) {
    return { pregnancy: false, reason: "sterile parent" };
  }

  // 부모 ancestry 합산 → 자식 ancestry
  const motherAncestry = getOrInferAncestry(input.mother);
  const fatherAncestry = getOrInferAncestry(input.father);
  const childAncestry = mixAncestry(motherAncestry, fatherAncestry);

  // 자식의 주 종 결정 — 동률 시 모친 우선
  const majorSpeciesId = decideMajorSpecies(childAncestry, input.mother.species);

  // speciesHint 가 있으면 검증 (디버그용), 없으면 자동 결정
  const childSpecies = speciesHint ?? getSpecies(majorSpeciesId);

  // 임신/산자수 계산은 모친 종 생리 기준
  const motherSpecies = getSpecies(input.mother.species);

  const rng = new Rng(input.seed);

  // 활성 특성 기반 효과 수집
  const motherEffects = collectActiveEffects(input.mother.active_traits, TRAIT_REGISTRY);
  const fatherEffects = collectActiveEffects(input.father.active_traits, TRAIT_REGISTRY);
  const allEffects = [...motherEffects, ...fatherEffects];

  // 임신 성공 — 모친 종 base_fertility
  const fertilityFactor = (input.mother.fertility + input.father.fertility) / 200;
  const inbreedingFactor = 1 - input.inbreedingF * INBREEDING_FERTILITY_PENALTY;
  let pSuccess = motherSpecies.base_fertility * fertilityFactor * inbreedingFactor;

  for (const eff of allEffects) {
    if (eff.type === "fertility_mult") pSuccess *= eff.value;
  }

  if (!rng.roll(Math.min(1, Math.max(0, pSuccess)))) {
    return { pregnancy: false, reason: "roll failed" };
  }

  // 산자수 — 모친 종 기준
  let litterCount = rng.intRange(motherSpecies.litter_min, motherSpecies.litter_max);
  for (const eff of allEffects) {
    if (eff.type === "litter_bonus") litterCount += eff.value;
  }
  litterCount = Math.max(1, litterCount);

  const offspring: NewAnimalData[] = [];
  for (let i = 0; i < litterCount; i++) {
    offspring.push(makeOffspring(childSpecies, input, rng, allEffects, childAncestry));
  }

  return { pregnancy: true, offspring };
}

function makeOffspring(
  childSpecies: Species,
  input: BreedInput,
  rng: Rng,
  parentEffects: ReturnType<typeof collectActiveEffects>,
  childAncestry: Ancestry,
): NewAnimalData {
  // 부모 두 종의 형질 ID 합집합 — 혼혈 자식은 양쪽 종 형질을 모두 보유
  const motherSpecies = getSpecies(input.mother.species);
  const fatherSpecies = getSpecies(input.father.species);
  const allGeneTraits = mergeGeneTraits(motherSpecies.genes, fatherSpecies.genes);
  const allRareGenes = mergeRareGenes(motherSpecies.rare_genes, fatherSpecies.rare_genes);

  // 외형 유전자 — 양쪽 종 형질 모두 순회
  const genes: Record<string, Genotype> = {};
  for (const trait of allGeneTraits) {
    const pool = trait.alleles.map((a) => a.code);
    const fallback = pool[0];
    const m = inheritAllele(input.mother.genes[trait.id], rng, fallback);
    const f = inheritAllele(input.father.genes[trait.id], rng, fallback);
    genes[trait.id] = [maybeMutate(m, pool, rng), maybeMutate(f, pool, rng)];
  }

  // 희귀 유전자 — 양쪽 종 합집합
  const rare_genes: Record<string, Genotype> = {};
  for (const rare of allRareGenes) {
    const normal = findNormalAllele(rare);
    const recessive = findRareAllele(rare);
    const pool: Allele[] = [normal, recessive];
    const motherGeno: Genotype = input.mother.rare_genes[rare.id] ?? [normal, normal];
    const fatherGeno: Genotype = input.father.rare_genes[rare.id] ?? [normal, normal];
    const m = inheritAllele(motherGeno, rng, normal);
    const f = inheritAllele(fatherGeno, rng, normal);
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

    const m = inheritAllele(motherGeno, rng, dom);
    const f = inheritAllele(fatherGeno, rng, dom);
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
    rare_genes, species: childSpecies.id,
  });

  // 새끼는 starter 캡 없음 — 등급 슬롯만큼 활성
  const active_traits = computeActiveTraits(traits, grade, rng);
  const is_sterile = computeIsSterile(active_traits);

  const sex: "F" | "M" = rng.roll(0.5) ? "F" : "M";
  const generation = Math.max(input.mother.generation, input.father.generation) + 1;

  return {
    species: childSpecies.id,
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
    ancestry: childAncestry,
  };
}

// ── 격세유전 (Throwback) ───────────────────────────────────────────────
//
// TODO(future): 자식의 minor ancestry 비율에 비례한 확률로 그 종의 외형 형질이
// 멘델 유전과 무관하게 발현되는 시스템. 예시:
//   { rabbit: 0.875, human: 0.125 } → 인간 형질이 ~12.5% 확률로 throwback 발현
// 자기 ancestry 의 minor 종 형질이 "조상의 흔적"으로 가끔 튀어나오는 효과.
// 현재는 멘델 유전만 — 부모가 가진 알렐이 표준 우/열성 규칙대로 자식에게.

// ── 종 형질 병합 헬퍼 ──────────────────────────────────────────────────

function mergeGeneTraits(a: readonly GeneTrait[], b: readonly GeneTrait[]): GeneTrait[] {
  const seen = new Set<string>();
  const out: GeneTrait[] = [];
  for (const t of [...a, ...b]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

function mergeRareGenes(a: readonly RareGeneSpec[], b: readonly RareGeneSpec[]): RareGeneSpec[] {
  const seen = new Set<string>();
  const out: RareGeneSpec[] = [];
  for (const r of [...a, ...b]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

// ── 헬퍼 ────────────────────────────────────────────────────────────────

// 부모 한쪽에 그 형질이 없을 수 있음 (예: 형질이 나중에 추가된 경우).
// 그때는 fallback 알렐(보통 그 형질의 첫 알렐 = 우성/정상)로 안전 처리.
function inheritAllele(genotype: Genotype | undefined, rng: Rng, fallback: Allele): Allele {
  if (!genotype || genotype.length < 2) return fallback;
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