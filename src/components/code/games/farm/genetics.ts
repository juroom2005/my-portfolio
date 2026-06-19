// src/components/code/games/farm/genetics.ts
//
// 유전 시스템 코어 — pure 함수들. DB 접근 없음. 시드만 주면 결정성.
//
// 공개 API:
//   makeStarter      — 1세대 시작 동물 (parents 없음)
//   makeVisitorBuck  — 손님이 데려오는 방문 수컷
//   breed            — 부모 둘 → BreedResult (임신 실패 or 새끼 N마리)
//
// 게임 디자인 상수는 파일 상단에 모아둠. 밸런싱 시 여기만 만지면 됨.

import { Rng } from "./rng";
import {
  getSpecies,
  type Species,
  type Allele,
  type Genotype,
  type GeneTrait,
  type RareGeneSpec,
} from "./species";

// ── 게임 디자인 상수 ────────────────────────────────────────────────────
/** 변이율 — 한 대립유전자가 다른 무작위 대립유전자로 바뀔 확률 */
const MUTATION_RATE = 0.03;
/** 능력치 노이즈 표준편차 (가우시안). 잭팟·바닥 빈도에 직접 영향. */
const STAT_NOISE = 8;
/** 근친 페널티 — 능력치에서 빼는 양: F × 이 값 */
const INBREEDING_STAT_PENALTY = 15;
/** 근친 페널티 — 임신 확률에 곱: 1 - F × 이 값 */
const INBREEDING_FERTILITY_PENALTY = 0.6;

// ── 데이터 타입 ─────────────────────────────────────────────────────────

/**
 * 새로 만들어지는 동물 데이터. DB insert 직전의 모양.
 * id, save_id, born_on_day, status 등은 호출 측에서 채움.
 */
export type NewAnimalData = {
  species: string;
  sex: "F" | "M";
  generation: number;
  mother_id: string | null;
  father_id: string | null;
  genes: Record<string, Genotype>;
  rare_genes: Record<string, Genotype>;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
};

/**
 * 교배 입력으로 필요한 부모 정보. AnimalRow 의 부분집합.
 * 게임 로직에서 부모를 들고 다닐 때 이 타입으로 캐스팅.
 */
export type ParentAnimal = {
  id: string;
  species: string;
  sex: "F" | "M";
  generation: number;
  mother_id: string | null;
  father_id: string | null;
  genes: Record<string, Genotype>;
  rare_genes: Record<string, Genotype>;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
};

export type BreedInput = {
  mother: ParentAnimal;
  father: ParentAnimal;
  /** pedigree.ts 의 inbreedingCoefficient() 결과 (0~1). */
  inbreedingF: number;
  /** 결정성 시드. deriveSeed("breed", motherId, fatherId, visitId) 권장. */
  seed: number | string;
};

export type BreedResult =
  | { pregnancy: false }
  | { pregnancy: true; offspring: NewAnimalData[] };

export type StarterChoices = {
  /** 형질 ID → 원하는 표현형 라벨. 예: { color: "검정", eye: "회색" } */
  phenotypes?: Record<string, string>;
};

// ── 1세대 시작 동물 ─────────────────────────────────────────────────────

/**
 * 시작 동물 생성. parents 없음, generation=1.
 * choices.phenotypes 로 형질을 지정하면 그 표현형이 발현되는 동형접합으로 만듦.
 * 안 지정한 형질은 무작위 알렐 두 개.
 * 희귀 유전자는 starter_carrier_chance 에 따라 보인자 부여.
 */
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
    beauty: statRoll(),
    stamina: statRoll(),
    temperament: statRoll(),
    health: statRoll(),
    fertility: statRoll(),
  };
}

/**
 * 방문 수컷 — makeStarter 의 얇은 래퍼.
 * 농장 명성(fame)이 높으면 평균 능력치가 살짝 올라가도록 보정.
 */
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
  // 호환성
  if (input.mother.species !== species.id || input.father.species !== species.id) {
    return { pregnancy: false };
  }
  if (input.mother.sex !== "F" || input.father.sex !== "M") {
    return { pregnancy: false };
  }

  const rng = new Rng(input.seed);

  // 임신 성공 판정
  const fertilityFactor = (input.mother.fertility + input.father.fertility) / 200;
  const inbreedingFactor = 1 - input.inbreedingF * INBREEDING_FERTILITY_PENALTY;
  const pSuccess = species.base_fertility * fertilityFactor * inbreedingFactor;

  if (!rng.roll(pSuccess)) {
    return { pregnancy: false };
  }

  // 산자수
  const litterCount = rng.intRange(species.litter_min, species.litter_max);

  // 새끼 생성
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

  // 희귀 유전자 (부모가 안 가진 경우 [normal, normal] 가정)
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

  // 능력치 (mid-parent + 가우시안 - 근친 페널티)
  const penalty = input.inbreedingF * INBREEDING_STAT_PENALTY;
  const stat = (mv: number, fv: number) => {
    const raw = (mv + fv) / 2 + rng.gauss(0, STAT_NOISE) - penalty;
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
    beauty: stat(input.mother.beauty, input.father.beauty),
    stamina: stat(input.mother.stamina, input.father.stamina),
    temperament: stat(input.mother.temperament, input.father.temperament),
    health: stat(input.mother.health, input.father.health),
    fertility: stat(input.mother.fertility, input.father.fertility),
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
  // 동형접합을 시도해 표현형이 일치하는 첫 알렐 반환
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

// 종 추가 시 import 안 깨지게 default export 한 번 더
export { getSpecies };
