// src/components/code/games/farm/species/human.ts
//
// 인간 — 농장에서 키우는 종이 아니라 "손님(게스트)" 으로만 방문.
// 하지만 종 시스템에 정식 등록 → 나중에 인간×수인 혼혈을 breed 로 바로 구현 가능.
//
// 유전 형질: 머리색 / 눈색 / 피부색(공통) / 키(공통)
// 비유전 속성(나이·지위)은 Visitor 생성 시 따로 부여 (humanProfile.ts).

import type { Species } from "./types";
import { SKIN_TONE_GENE, HEIGHT_GENE } from "./sharedGenes";

export const HUMAN: Species = {
  id: "human",
  label_ko: "인간",
  label_en: "human",
  rarity_tier: 1,

  // 인간은 농장에서 안 키우지만, 혼혈 임신 계산에 쓰일 수 있어 값은 채워둠.
  maturity_days: 7,
  gestation_days: 4,
  lifespan_days: 120,

  base_fertility: 0.6,
  litter_min: 1,
  litter_max: 1,

  genes: [
    {
      id: "hair",
      label_ko: "머리색",
      label_en: "hair",
      alleles: [
        { code: "K", label_ko: "검정", dominant: true },
        { code: "n", label_ko: "갈색", dominant: false },
        { code: "d", label_ko: "금발", dominant: false },
        { code: "r", label_ko: "적발", dominant: false },
      ],
      // K 우성, 나머지는 동형/조합
      expression: ([a, b]) => {
        if (a === "K" || b === "K") return "검정 머리";
        if (a === "n" || b === "n") return "갈색 머리";
        if (a === "d" && b === "d") return "금발";
        if (a === "r" && b === "r") return "적발";
        if ((a === "d" && b === "r") || (a === "r" && b === "d")) return "딸기금발";
        return "갈색 머리";
      },
      player_selectable: true,
    },
    {
      id: "eye",
      label_ko: "눈색",
      label_en: "eye",
      alleles: [
        { code: "N", label_ko: "갈색", dominant: true },
        { code: "u", label_ko: "푸른", dominant: false },
        { code: "g", label_ko: "녹색", dominant: false },
      ],
      expression: ([a, b]) => {
        if (a === "N" || b === "N") return "갈색 눈";
        if (a === "g" || b === "g") return "녹색 눈";
        return "푸른 눈";
      },
      player_selectable: true,
    },
    SKIN_TONE_GENE,
    HEIGHT_GENE,
  ],

  rare_genes: [
    {
      id: "heterochromia",
      label_ko: "오드아이",
      label_en: "heterochromia",
      rarity_label: "LEGENDARY",
      grade_bonus: 18,
      alleles: [
        { code: "H", label_ko: "정상", dominant: true },
        { code: "h", label_ko: "오드아이 발현", dominant: false },
      ],
      expression: ([a, b]) => {
        if (a === "h" && b === "h") return "expressed";
        if (a === "h" || b === "h") return "carrier";
        return "none";
      },
      starter_carrier_chance: 0.06,
    },
    {
      id: "silverblood",
      label_ko: "은빛 혈통",
      label_en: "silverblood",
      rarity_label: "MYTHIC",
      grade_bonus: 28,
      alleles: [
        { code: "S", label_ko: "정상", dominant: true },
        { code: "s", label_ko: "은빛 발현", dominant: false },
      ],
      // 귀족 혈통에서 드물게 나타나는 은발/은안 — 혼혈에서 발현되면 강력
      expression: ([a, b]) => {
        if (a === "s" && b === "s") return "expressed";
        if (a === "s" || b === "s") return "carrier";
        return "none";
      },
      starter_carrier_chance: 0.03,
    },
  ],

  starter_stat_range: { min: 45, max: 75 },

  sprites: {
    icon: "🧑",
    text_baby: "아기",
    text_adult_f: "여성",
    text_adult_m: "남성",
  },
};