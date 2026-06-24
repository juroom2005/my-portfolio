// src/components/code/games/farm/pregnancySystem.ts
//
// 임신 시스템.
//
// 흐름:
//   방문 종료 (buck 또는 인간 ♂ 게스트) → resolvePregnancy() → breed roll
//     성공: Pregnancy 레코드 (배 부른 암컷 + 출산예정일 + 새끼 데이터)
//     실패: null
//   출산예정일 도달 → 새끼를 보육실로 (다음 단계)
//
// 혼혈: 인간 게스트(♂) × 농장 동물(♀) 도 처리. 자식은 모친 종 우선이지만
// 외형/유전자엔 인간 형질이 섞여 들어감. ancestry 비율이 자동 계산됨.

import { breed, type NewAnimalData, type ParentAnimal } from "./genetics";
import { getSpecies } from "./species";
import type { AnimalRow } from "./dbTypes";
import { bastardInfoFor, type Visitor } from "./visitorSystem";

// ── 임신 레코드 ─────────────────────────────────────────────────────────
export type Pregnancy = {
  /** 임신한 암컷 (농장 동물) id */
  motherId: string;
  motherName: string | null;
  /** 친부 — 방문객 (시스템 허용으로 누구인지 보여줌) */
  sireName: string;
  sireGrade: string;
  /** 친부 종 (혼혈 표기용) */
  sireSpecies: string;
  /** 친부 지위 — 인간 귀족이면 사생아 라벨용 */
  sireSocialRankId?: string;
  /** 모친 종 (출산 일자 계산용) */
  species: string;
  /** 수태된 일자 + 출산 예정 일자 */
  conceivedDay: number;
  dueDay: number;
  /** 미리 계산된 새끼들 (출산일에 보육실로) */
  offspring: NewAnimalData[];
};

// ── 판별 결과 ───────────────────────────────────────────────────────────
export type PregnancyOutcome =
  | { pregnant: true; pregnancy: Pregnancy }
  | { pregnant: false; reason: string };

// ── AnimalRow → ParentAnimal ────────────────────────────────────────────
function toParent(a: AnimalRow): ParentAnimal {
  return {
    id: a.id,
    species: a.species,
    sex: a.sex,
    generation: a.generation,
    mother_id: a.mother_id,
    father_id: a.father_id,
    genes: a.genes,
    rare_genes: a.rare_genes,
    traits: a.traits,
    active_traits: a.active_traits,
    is_sterile: a.is_sterile,
    beauty: a.beauty,
    stamina: a.stamina,
    temperament: a.temperament,
    health: a.health,
    fertility: a.fertility,
    grade: (a.grade as ParentAnimal["grade"]) ?? null,
    ancestry: a.ancestry ?? null,
  };
}

// 방문객 → ParentAnimal (buck 또는 인간 ♂ 게스트)
function visitorToParent(visitor: Visitor): ParentAnimal | null {
  const d = visitor.animalData;
  if (!d) return null;
  return {
    id: visitor.id,
    species: d.species,
    sex: "M",
    generation: d.generation,
    mother_id: null,
    father_id: null,
    genes: d.genes,
    rare_genes: d.rare_genes,
    traits: d.traits,
    active_traits: d.active_traits,
    is_sterile: d.is_sterile,
    beauty: d.beauty,
    stamina: d.stamina,
    temperament: d.temperament,
    health: d.health,
    fertility: d.fertility,
    grade: d.grade,
    ancestry: d.ancestry,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 판별
// ═══════════════════════════════════════════════════════════════════════

/**
 * 방문(buck 또는 인간 ♂ 게스트)이 끝난 시점에 호출.
 *
 * - 수인 buck: 같은 종 성체 암컷과 교배
 * - 인간 ♂ 게스트: 방의 성체 암컷(아무 종)과 교배 → 혼혈
 *
 * 방문객은 외부라서 농장 혈통과 무관 → inbreedingF = 0.
 */
export function resolvePregnancy(args: {
  visitor: Visitor;
  roomAnimals: AnimalRow[];
  currentDay: number;
  /** 결정적 시드 (방문 id 기반) */
  seed: string;
}): PregnancyOutcome {
  // 방문객이 수컷이어야 함 (게스트 ♀ 는 임신 안 옴 — 시스템상 막혀있어야)
  if (args.visitor.sex !== "M") {
    return { pregnant: false, reason: "visitor not male" };
  }

  const father = visitorToParent(args.visitor);
  if (!father) return { pregnant: false, reason: "visitor has no gene data" };

  // 방 안의 성체 암컷 찾기
  // buck (수인 수컷): 같은 종 암컷만
  // 인간 ♂ 게스트: 아무 종이든 (혼혈)
  const doe = args.visitor.type === "buck"
    ? args.roomAnimals.find(
        (a) => a.is_adult && a.sex === "F" && a.species === args.visitor.species,
      )
    : args.roomAnimals.find((a) => a.is_adult && a.sex === "F");

  if (!doe) return { pregnant: false, reason: "no matching female" };

  // 생리 파라미터는 모친 종 기준. breed 의 첫 인자(speciesHint)는 null 로
  // 두고 자식 종 자동 결정.
  const motherSpecies = getSpecies(doe.species);
  const result = breed(null, {
    mother: toParent(doe),
    father,
    inbreedingF: 0,
    seed: args.seed,
  });

  if (!result.pregnancy) {
    return { pregnant: false, reason: result.reason ?? "roll failed" };
  }

  // 사생아 부여 — 인간 귀족 ♂ × 농장 동물 ♀ 자식이면
  const bastard = bastardInfoFor(args.visitor);
  if (bastard) {
    for (const child of result.offspring) {
      if (!child.active_traits.includes(bastard.traitId)) {
        child.active_traits.push(bastard.traitId);
      }
    }
  }

  const dueDay = args.currentDay + motherSpecies.gestation_days;
  return {
    pregnant: true,
    pregnancy: {
      motherId: doe.id,
      motherName: doe.name,
      sireName: args.visitor.name,
      sireGrade: args.visitor.grade,
      sireSpecies: args.visitor.species,
      sireSocialRankId: args.visitor.socialRankId,
      species: doe.species,
      conceivedDay: args.currentDay,
      dueDay,
      offspring: result.offspring,
    },
  };
}