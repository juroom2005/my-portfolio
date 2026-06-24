// src/components/code/games/farm/ancestry.ts
//
// 혈통(ancestry) 시스템.
//
// ancestry = 종 비율 객체. 합계 1.0.
//   풀토끼:        { rabbit: 1.0 }
//   하프토끼인간:  { rabbit: 0.5, human: 0.5 }
//   쿼터인간토끼:  { rabbit: 0.75, human: 0.25 }
//   에이스인간토끼: { rabbit: 0.875, human: 0.125 }
//
// 자식 ancestry = 부모 두 명 평균.
//   부 { rabbit: 1.0 } × 모 { human: 1.0 }
//     → 자식 { rabbit: 0.5, human: 0.5 }
//
//   부 { rabbit: 0.5, human: 0.5 } × 모 { rabbit: 1.0 }
//     → 자식 { rabbit: 0.75, human: 0.25 }

import { getSpecies } from "./species";

export type Ancestry = Record<string, number>;

// ── 생성 ───────────────────────────────────────────────────────────────

/** 순종 ancestry 생성 — { speciesId: 1.0 } */
export function pureAncestry(speciesId: string): Ancestry {
  return { [speciesId]: 1.0 };
}

/** 부모 두 ancestry 의 평균 = 자식 ancestry */
export function mixAncestry(mother: Ancestry, father: Ancestry): Ancestry {
  const out: Ancestry = {};
  const keys = new Set([...Object.keys(mother), ...Object.keys(father)]);
  for (const k of keys) {
    const v = ((mother[k] ?? 0) + (father[k] ?? 0)) / 2;
    if (v > 0) out[k] = v;
  }
  return normalize(out);
}

/** 합계가 1.0 이 되게 정규화 (부동소수 누적 오차 보정) */
function normalize(a: Ancestry): Ancestry {
  const sum = Object.values(a).reduce((s, v) => s + v, 0);
  if (sum === 0) return a;
  const out: Ancestry = {};
  for (const [k, v] of Object.entries(a)) {
    out[k] = v / sum;
  }
  return out;
}

// ── 주(major) 종 ───────────────────────────────────────────────────────

/**
 * 자식의 종(species 필드)을 결정.
 * 가장 비율 높은 종. 동률이면 mother 의 주 종 우선.
 */
export function decideMajorSpecies(ancestry: Ancestry, motherSpecies: string): string {
  const entries = Object.entries(ancestry).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return motherSpecies;
  const top = entries[0][1];
  const ties = entries.filter(([, v]) => v === top).map(([k]) => k);
  if (ties.includes(motherSpecies)) return motherSpecies;
  return ties[0];
}

// ── 혈통 단계 ──────────────────────────────────────────────────────────
//
// 주 종 비율 기준:
//   풀(Pure):    100%
//   하프(Half):  25% ~ 75%
//   쿼터(Quarter): 12.5% ~ 25%
//   에이스(Trace): 0% 초과 ~ 12.5%
//
// 부동소수 오차 고려해 약간의 여유 둠.

export type BreedTier = "pure" | "half" | "quarter" | "ace";

const EPS = 1e-6;

export function getBreedTier(ancestry: Ancestry, majorSpecies: string): BreedTier {
  const major = ancestry[majorSpecies] ?? 0;
  if (major >= 1.0 - EPS) return "pure";
  // 주 종 외의 누적 비율로 판정
  const minor = 1 - major;
  if (minor > 0.5 - EPS) return "half"; // 주 종이 50% 이하면 하프 (혼혈 정점)
  if (minor > 0.25 - EPS) return "half"; // 주 종 50~75% 도 하프
  if (minor > 0.125 - EPS) return "quarter"; // 12.5~25%
  return "ace"; // 12.5% 미만
}

export const TIER_LABEL: Record<BreedTier, string> = {
  pure: "순종",
  half: "하프",
  quarter: "쿼터",
  ace: "에이스",
};

export const TIER_COLOR: Record<BreedTier, { bg: string; fg: string; border: string }> = {
  pure: { bg: "rgba(107,89,66,0.10)", fg: "#6B5942", border: "rgba(107,89,66,0.35)" },
  half: { bg: "rgba(150,90,200,0.15)", fg: "#6A3D9A", border: "rgba(150,90,200,0.45)" },
  quarter: { bg: "rgba(46,160,160,0.15)", fg: "#1F7A7A", border: "rgba(46,160,160,0.45)" },
  ace: { bg: "rgba(218,165,32,0.18)", fg: "#8a6a08", border: "rgba(218,165,32,0.5)" },
};

// ── 소수(minor) 종 목록 ────────────────────────────────────────────────

/** 주 종 외의 종들을 비율 내림차순으로 반환 (라벨 만들 때 사용) */
export function getMinorAncestries(
  ancestry: Ancestry,
  majorSpecies: string,
): { species: string; ratio: number }[] {
  return Object.entries(ancestry)
    .filter(([k]) => k !== majorSpecies)
    .map(([k, v]) => ({ species: k, ratio: v }))
    .sort((a, b) => b.ratio - a.ratio);
}

// ── 라벨 ───────────────────────────────────────────────────────────────

/**
 * "쿼터인간", "하프토끼", "에이스인간·쿼터양" 같은 라벨 문자열 생성.
 * 순종이면 빈 문자열 (배지 안 띄움).
 */
export function formatBreedLabel(ancestry: Ancestry, majorSpecies: string): string {
  const tier = getBreedTier(ancestry, majorSpecies);
  if (tier === "pure") return "";

  const minors = getMinorAncestries(ancestry, majorSpecies);
  if (minors.length === 0) return TIER_LABEL[tier];

  // 가장 큰 minor 의 종으로 메인 라벨, 그 다음들은 부가 표시
  const parts = minors.map((m) => {
    const minorTier = ratioToTier(m.ratio);
    const name = safeSpeciesName(m.species);
    return `${TIER_LABEL[minorTier]}${name}`;
  });

  return parts.join("·");
}

/** 단일 비율 → tier (라벨용) */
function ratioToTier(ratio: number): BreedTier {
  if (ratio >= 0.5 - EPS) return "half";
  if (ratio >= 0.25 - EPS) return "half";
  if (ratio >= 0.125 - EPS) return "quarter";
  return "ace";
}

function safeSpeciesName(speciesId: string): string {
  try {
    return getSpecies(speciesId).label_ko;
  } catch {
    return speciesId;
  }
}

// ── 부모 ancestry 추출 ─────────────────────────────────────────────────

/**
 * 부모 동물에서 ancestry 가져옴. 없으면 species 기준 순종으로 폴백.
 * (기존 동물 / buck visitor / 인간 게스트 모두 안전하게 처리)
 */
export function getOrInferAncestry(parent: {
  species: string;
  ancestry?: Ancestry | null;
}): Ancestry {
  if (parent.ancestry && Object.keys(parent.ancestry).length > 0) {
    return parent.ancestry;
  }
  return pureAncestry(parent.species);
}