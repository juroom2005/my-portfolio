// src/components/code/games/farm/grading.ts
//
// 등급 / 가격 공식 + active_traits 재계산 헬퍼. pure 함수.

import { Rng, deriveSeed } from "./rng";
import { GRADE_MULT, GRADES, type Grade } from "./dbTypes";
import { getSpecies, computeActiveTraits, type Genotype } from "./species";

type GradeInput = {
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
  rare_genes: Record<string, Genotype>;
  species: string;
};

export function calcGrade(animal: GradeInput): Grade {
  const geom = Math.pow(
    Math.max(1, animal.beauty) *
      Math.max(1, animal.stamina) *
      Math.max(1, animal.temperament) *
      Math.max(1, animal.health) *
      Math.max(1, animal.fertility),
    1 / 5,
  );

  const species = getSpecies(animal.species);
  let bonus = 1;
  for (const rare of species.rare_genes) {
    const geno = animal.rare_genes[rare.id];
    if (!geno) continue;
    if (rare.expression(geno) === "expressed") {
      bonus += rare.grade_bonus / 100;
    }
  }

  const score = geom * bonus;

  if (score >= 92) return "S+";
  if (score >= 82) return "S";
  if (score >= 72) return "A";
  if (score >= 62) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  if (score >= 20) return "E";
  return "F";
}

export function calcVisitFee(
  buck: { species: string; grade: Grade | string | null },
  farmLevel: number,
): number {
  const species = getSpecies(buck.species);
  const grade: Grade =
    buck.grade && (GRADES as readonly string[]).includes(buck.grade) ? (buck.grade as Grade) : "D";
  const base = 50 * species.rarity_tier;
  const gradeMult = GRADE_MULT[grade];
  const fameMult = 1 + farmLevel * 0.1;
  return Math.max(50, Math.round(base * gradeMult * fameMult));
}

/**
 * 동물의 grade 가 바뀐 후 호출. 새 grade 슬롯 수에 맞춰 active_traits 재선택.
 * 시드는 (동물 id + grade) 로 derive → 같은 동물·같은 등급이면 항상 같은 결과.
 *
 * 사용 예: 능력치 변동(아이템·이벤트)으로 새 grade 가 D → C 로 올랐을 때,
 *   1) 새 grade 를 DB 에 업데이트
 *   2) recomputeActiveTraits 호출해서 새 active_traits 결정
 *   3) is_sterile 도 같이 업데이트
 */
export function recomputeActiveTraits(animal: {
  id: string;
  traits: Record<string, Genotype>;
  grade: Grade;
}): string[] {
  const rng = new Rng(deriveSeed("activetraits", animal.id, animal.grade));
  return computeActiveTraits(animal.traits, animal.grade, rng);
}