// src/components/code/games/farm/species/mutationColors.ts
//
// 자연에 없는 특이 변이색 — 모색/눈색에 극저확률로 발현.
// 멘델 유전과 별개의 "변이 게이트" 로 출생 시 덮어쓰기 (genetics.ts).
//
// 알렐 코드에 "✦" prefix 를 붙여 일반 알렐과 구분.
// 각 종의 모색/눈색 expression 첫 줄에서 detectMutationColor 로 가로채
// 변이색 라벨을 그대로 반환 → 멘델 규칙보다 우선.
//
// 동형( [✦x, ✦x] )으로만 박으므로 한쪽만 변이인 경우는 없음.

import type { Allele } from "./types";

export const MUT_PREFIX = "✦";

// ── 모색 변이 풀 ──────────────────────────────────────────────────────────
// 차분한 비현실색. 너무 쨍하지 않게.
export const MUT_COAT: { code: Allele; label_ko: string }[] = [
  { code: "✦lavender", label_ko: "연보라" },
  { code: "✦silverblue", label_ko: "청은색" },
  { code: "✦midnight", label_ko: "밤하늘색" },
  { code: "✦amethyst", label_ko: "자수정" },
  { code: "✦rosegold", label_ko: "로즈골드" },
  { code: "✦jade", label_ko: "옥색" },
];

// ── 눈색 변이 풀 ──────────────────────────────────────────────────────────
// 특이눈 ~ 보석빛.
export const MUT_EYE: { code: Allele; label_ko: string }[] = [
  { code: "✦odd", label_ko: "오드아이" },
  { code: "✦gold", label_ko: "황금빛" },
  { code: "✦sapphire", label_ko: "사파이어" },
  { code: "✦ruby", label_ko: "루비" },
  { code: "✦emerald", label_ko: "에메랄드" },
  { code: "✦amethyst_eye", label_ko: "자수정" },
  { code: "✦pie", label_ko: "파이아이" },
];

// 코드 → 라벨 역인덱스 (모색·눈색 통합)
const LABEL_BY_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const c of MUT_COAT) m[c.code] = c.label_ko;
  for (const c of MUT_EYE) m[c.code] = c.label_ko;
  return m;
})();

/** 알렐이 변이 마커인지 */
export function isMutationAllele(code: Allele): boolean {
  return typeof code === "string" && code.startsWith(MUT_PREFIX);
}

/**
 * 유전자형 [a, b] 에서 변이색 라벨을 감지. 없으면 null.
 * 한쪽이라도 변이 마커면 그 라벨 반환 (동형으로만 박지만 안전하게 OR).
 */
export function detectMutationColor([a, b]: [Allele, Allele]): string | null {
  if (isMutationAllele(a)) return LABEL_BY_CODE[a] ?? null;
  if (isMutationAllele(b)) return LABEL_BY_CODE[b] ?? null;
  return null;
}