// src/components/code/games/farm/pricing.ts
//
// 보육실 졸업 액션 (판매 / 친부 송환) 의 보상 계산.
// 가격 공식은 보수적으로 잡음 — 후기 마일스톤에서 마켓/경매 시스템이 들어오면 재조정.
//
// 클라이언트가 계산 후 server action 에 금액/명성을 명시적으로 전달.
// 게임 룰은 개인 세이브 단위라 신뢰 OK (RLS 가 owner 매칭은 강제).

import type { AnimalRow } from "./dbTypes";
import { GRADE_MULT, type Grade } from "./dbTypes";
import { getSpecies } from "./species";
import { getOrInferAncestry, getBreedTier } from "./ancestry";

// ── 판매가 ──────────────────────────────────────────────────────────────
//
//   base = 60 × species.rarity_tier × GRADE_MULT[grade]
//        × (1 + 발현된 희귀유전자 수 × 0.3)
//        × (1 + 사생아 ? 0.3 : 0)
//        × 혼혈 보너스 (순종 1.0 / 에이스 1.05 / 쿼터 1.15 / 하프 1.30)
//
// 예시:
//   토끼 D 순종 = 60 × 1 × 1.0 = 60₵
//   양 C 순종 = 60 × 2 × 1.3 = 156₵
//   양 A 사생아 = 60 × 2 × 2.2 × 1.3 ≈ 343₵
//   양 S+ 공작 사생아 = 60 × 2 × 4.5 × 1.3 ≈ 702₵

const BREED_BONUS: Record<string, number> = {
  pure: 1.0,
  ace: 1.05,
  quarter: 1.15,
  half: 1.3,
};

export function calcSellPrice(animal: AnimalRow): number {
  const speciesObj = safeGetSpecies(animal.species);
  if (!speciesObj) return 50; // 알 수 없는 종 폴백

  const base = 60 * speciesObj.rarity_tier;
  const gradeMult = GRADE_MULT[(animal.grade ?? "D") as Grade] ?? GRADE_MULT.D;

  // 발현된 희귀 유전자 수
  let rareCount = 0;
  for (const rare of speciesObj.rare_genes) {
    const geno = animal.rare_genes[rare.id];
    if (!geno) continue;
    if (rare.expression(geno) === "expressed") rareCount += 1;
  }
  const rareMult = 1 + rareCount * 0.3;

  // 사생아 (활성 특성에 noble_bastard)
  const bastardMult = animal.active_traits.includes("noble_bastard") ? 1.3 : 1.0;

  // 혼혈 보너스
  const anc = getOrInferAncestry(animal);
  const tier = getBreedTier(anc, animal.species);
  const breedMult = BREED_BONUS[tier] ?? 1.0;

  return Math.max(20, Math.round(base * gradeMult * rareMult * bastardMult * breedMult));
}

// ── 친부 송환 명성 ──────────────────────────────────────────────────────
//
// 보수적 — 외부에 자식 보낸 작은 호의. 등급별 매핑.
// 사생아도 동일 — 양육비 같은 풍부한 보상은 추후 네임드 NPC 시스템에서.

const FAME_BY_GRADE: Record<Grade, number> = {
  F: 1, E: 1, D: 2, C: 3, B: 4, A: 5, S: 7, "S+": 10,
};

export function calcSireSendFame(animal: AnimalRow): number {
  const g = (animal.grade ?? "D") as Grade;
  return FAME_BY_GRADE[g] ?? 2;
}

// ── 액션 가능 여부 ──────────────────────────────────────────────────────

/**
 * 보육실 동물이 졸업 가능한 상태인지.
 * - 보육실에 있고 (status === 'nursery')
 * - 성체 일자에 도달했고 (currentDay >= adult_on_day)
 *
 * `is_adult` 컬럼은 캐시라서 신뢰하지 않고 currentDay 기반 derived.
 */
export function isReadyToGraduate(animal: AnimalRow, currentDay: number): boolean {
  if (animal.status !== "nursery") return false;
  if (animal.adult_on_day == null) return false;
  return currentDay >= animal.adult_on_day;
}

/** 친부 송환은 metadata.sire_info 가 있어야만 가능 (방문 기록이 있어야 보낼 데가 있음). */
export function canSendToSire(animal: AnimalRow): boolean {
  const meta = animal.metadata as Record<string, unknown> | null;
  const sire = meta?.sire_info;
  return !!(sire && typeof sire === "object" && (sire as Record<string, unknown>).name);
}

// ── 헬퍼 ────────────────────────────────────────────────────────────────

function safeGetSpecies(speciesId: string) {
  try {
    return getSpecies(speciesId);
  } catch {
    return null;
  }
}