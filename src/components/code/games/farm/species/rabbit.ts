// src/components/code/games/farm/species/rabbit.ts
// 토끼수인 — 스타터 종. 가장 흔하고(rarity_tier 1) 번식력 높음.
// 형질: 모색·무늬·눈색·귀모양 (4개) / 희귀: 섀도우·달빛

import type { Species } from "./types";
import { SKIN_TONE_GENE } from "./sharedGenes";
import { detectMutationColor } from "./mutationColors";

export const RABBIT: Species = {
  id: "rabbit",
  label_ko: "토끼수인",
  label_en: "rabbit-folk",
  rarity_tier: 1,

  maturity_days: 9,
  gestation_days: 6,
  lifespan_days: 120,

  base_fertility: 0.85,
  litter_min: 2,
  litter_max: 5,

  genes: [
    SKIN_TONE_GENE,
    {
      id: "color",
      label_ko: "모색",
      label_en: "coat",
      alleles: [
        { code: "B", label_ko: "검정", dominant: true },
        { code: "b", label_ko: "흰", dominant: false },
      ],
      expression: ([a, b]) => {
        const mut = detectMutationColor([a, b]);
        if (mut) return mut;
        return a === "B" || b === "B" ? "검정" : "흰";
      },
      player_selectable: true,
    },
    {
      id: "pattern",
      label_ko: "무늬",
      label_en: "pattern",
      alleles: [
        { code: "S", label_ko: "점박이", dominant: true },
        { code: "s", label_ko: "단색", dominant: false },
      ],
      expression: ([a, b]) => (a === "S" || b === "S" ? "점박이" : "단색"),
    },
    {
      id: "eye",
      label_ko: "눈색",
      label_en: "eye",
      alleles: [
        { code: "R", label_ko: "붉은", dominant: true },
        { code: "g", label_ko: "회색", dominant: false },
        { code: "p", label_ko: "분홍", dominant: false },
      ],
      // 다중 대립유전자 — R 있으면 무조건 붉은, 없으면 동형접합만 발현
      expression: ([a, b]) => {
        const mut = detectMutationColor([a, b]);
        if (mut) return mut;
        if (a === "R" || b === "R") return "붉은";
        if (a === "p" && b === "p") return "분홍";
        return "회색";
      },
      player_selectable: true,
    },
    {
      id: "ear",
      label_ko: "귀모양",
      label_en: "ears",
      alleles: [
        { code: "L", label_ko: "곧추선", dominant: true },
        { code: "l", label_ko: "처진", dominant: false },
      ],
      expression: ([a, b]) => (a === "L" || b === "L" ? "곧추선" : "처진"),
    },
  ],

  rare_genes: [
    {
      id: "shadow",
      label_ko: "섀도우",
      label_en: "shadow",
      rarity_label: "LEGENDARY",
      grade_bonus: 15,
      alleles: [
        { code: "S", label_ko: "정상", dominant: true },
        { code: "s", label_ko: "섀도우 발현", dominant: false },
      ],
      // 동형 열성 → 회보랏빛 모색 + 등급 보너스
      expression: ([a, b]) => {
        if (a === "s" && b === "s") return "expressed";
        if (a === "s" || b === "s") return "carrier";
        return "none";
      },
      starter_carrier_chance: 0.05,
    },
    {
      id: "moonlight",
      label_ko: "달빛",
      label_en: "moonlight",
      rarity_label: "MYTHIC",
      grade_bonus: 25,
      alleles: [
        { code: "M", label_ko: "정상", dominant: true },
        { code: "m", label_ko: "달빛 발현", dominant: false },
      ],
      expression: ([a, b]) => {
        if (a === "m" && b === "m") return "expressed";
        if (a === "m" || b === "m") return "carrier";
        return "none";
      },
      starter_carrier_chance: 0.02,
    },
  ],

  starter_stat_range: { min: 40, max: 70 },

  sprites: {
    icon: "🐰",
    text_baby: "아기 토끼수인",
    text_adult_f: "토끼수인 ♀",
    text_adult_m: "토끼수인 ♂",
  },
};