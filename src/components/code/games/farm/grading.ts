// src/components/code/games/farm/grading.ts
//
// 등급 / 가격 공식. pure 함수.
//
// 등급: 5스탯 기하평균 × (1 + 발현된 희귀유전자 보너스).
//       곱셈식이라 한 스탯이라도 낮으면 전체가 끌어내려짐.
//
// 가격: 50 × species.rarity_tier × grade_mult × (1 + farmLevel × 0.1).
//       최소 50c 보장.

import { GRADE_MULT, GRADES, type Grade } from "./dbTypes";
import { getSpecies, type Genotype } from "./species";

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
  // 0이 들어가면 기하평균이 0이라 등급 F 강제됨. clamp 1 이상으로 안전장치.
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

/**
 * 손님(수컷)의 방문료. 종 희소성 · 등급 · 농장 명성의 곱.
 * 등급이 null/잘못된 값이면 D로 폴백.
 */
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
