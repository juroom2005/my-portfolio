// src/components/code/games/farm/species/sharedGenes.ts
//
// 전 종 공통 형질. 각 종 매니페스트에서 spread 로 가져다 씀:
//   genes: [ SKIN_TONE_GENE, ...종 고유 형질 ]
//
// 이렇게 하면 피부색 같은 공통 형질을 한 곳에서 관리.

import type { GeneTrait } from "./types";

// ── 피부색 (수인·인간 공통) ─────────────────────────────────────────────
// 3대립 + 불완전우성 느낌으로 다양하게.
export const SKIN_TONE_GENE: GeneTrait = {
  id: "skin",
  label_ko: "피부색",
  label_en: "skin",
  alleles: [
    { code: "D", label_ko: "가무잡잡", dominant: true },
    { code: "m", label_ko: "중간", dominant: false },
    { code: "f", label_ko: "흰", dominant: false },
  ],
  expression: ([a, b]) => {
    // D 우성, m·f 는 동형/조합으로
    if (a === "D" || b === "D") return "가무잡잡";
    if ((a === "m" && b === "f") || (a === "f" && b === "m")) return "중간";
    if (a === "m" && b === "m") return "중간";
    return "흰";
  },
  player_selectable: true,
};

// ── 키 (수인·인간 공통) ─────────────────────────────────────────────────
export const HEIGHT_GENE: GeneTrait = {
  id: "height",
  label_ko: "키",
  label_en: "height",
  alleles: [
    { code: "T", label_ko: "큰", dominant: true },
    { code: "t", label_ko: "작은", dominant: false },
  ],
  expression: ([a, b]) => (a === "T" || b === "T" ? "큰 키" : "작은 키"),
};