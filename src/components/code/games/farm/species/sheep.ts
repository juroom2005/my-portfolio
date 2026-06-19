// src/components/code/games/farm/species/sheep.ts
// 양수인 — 스타터 종. 번식력은 토끼보다 낮고 산자수도 적지만 안정적.
// 형질: 모색(3대립 공우성)·털질·눈색·뿔 / 희귀: 구름·먹빛

import type { Species } from "./types";

export const SHEEP: Species = {
  id: "sheep",
  label_ko: "양수인",
  label_en: "sheep-folk",
  rarity_tier: 1,

  maturity_days: 5,
  gestation_days: 3,
  lifespan_days: 90,

  base_fertility: 0.7,
  litter_min: 1,
  litter_max: 2,

  genes: [
    {
      id: "color",
      label_ko: "모색",
      label_en: "coat",
      alleles: [
        { code: "B", label_ko: "검정", dominant: true },
        { code: "g", label_ko: "회색", dominant: false },
        { code: "b", label_ko: "흰", dominant: false },
      ],
      // B + g 공우성 (이형접합 시 얼룩)
      expression: ([a, b]) => {
        if (a === "B" && b === "B") return "검정";
        if ((a === "B" && b === "g") || (a === "g" && b === "B")) return "얼룩";
        if (a === "B" || b === "B") return "검정";
        if (a === "g" || b === "g") return "회색";
        return "흰";
      },
      player_selectable: true,
    },
    {
      id: "wool",
      label_ko: "털질",
      label_en: "wool",
      alleles: [
        { code: "C", label_ko: "곱슬", dominant: true },
        { code: "c", label_ko: "직모", dominant: false },
      ],
      expression: ([a, b]) => (a === "C" || b === "C" ? "곱슬" : "직모"),
    },
    {
      id: "eye",
      label_ko: "눈색",
      label_en: "eye",
      alleles: [
        { code: "A", label_ko: "호박", dominant: true },
        { code: "u", label_ko: "파란", dominant: false },
      ],
      expression: ([a, b]) => (a === "A" || b === "A" ? "호박색" : "파란"),
      player_selectable: true,
    },
    {
      id: "horn",
      label_ko: "뿔",
      label_en: "horns",
      alleles: [
        { code: "H", label_ko: "있음", dominant: true },
        { code: "h", label_ko: "없음", dominant: false },
      ],
      expression: ([a, b]) => (a === "H" || b === "H" ? "있음" : "없음"),
    },
  ],

  rare_genes: [
    {
      id: "cloud",
      label_ko: "구름",
      label_en: "cloud",
      rarity_label: "LEGENDARY",
      grade_bonus: 15,
      alleles: [
        { code: "C", label_ko: "정상", dominant: true },
        { code: "c", label_ko: "구름 발현", dominant: false },
      ],
      // 주: rare_genes 와 genes.wool 의 알렐 코드가 같지만, JSONB 다른 키에
      //     저장되므로 충돌 없음. (animal.genes.wool vs animal.rare_genes.cloud)
      expression: ([a, b]) => {
        if (a === "c" && b === "c") return "expressed";
        if (a === "c" || b === "c") return "carrier";
        return "none";
      },
      starter_carrier_chance: 0.05,
    },
    {
      id: "ink",
      label_ko: "먹빛",
      label_en: "ink",
      rarity_label: "MYTHIC",
      grade_bonus: 25,
      alleles: [
        { code: "I", label_ko: "정상", dominant: true },
        { code: "i", label_ko: "먹빛 발현", dominant: false },
      ],
      expression: ([a, b]) => {
        if (a === "i" && b === "i") return "expressed";
        if (a === "i" || b === "i") return "carrier";
        return "none";
      },
      starter_carrier_chance: 0.02,
    },
  ],

  starter_stat_range: { min: 40, max: 70 },

  sprites: {
    icon: "🐑",
    text_baby: "아기 양수인",
    text_adult_f: "양수인 ♀",
    text_adult_m: "양수인 ♂",
  },
};
