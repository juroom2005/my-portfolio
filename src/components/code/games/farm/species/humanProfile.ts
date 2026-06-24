// src/components/code/games/farm/species/humanProfile.ts
//
// 인간 게스트의 비유전 속성 — 지위(귀족 등급) + 나이.
// 명성이 높을수록 높은 지위의 인간이 방문할 확률 ↑.
//
// 지위는 사생아 뱃지(사회적 특성)에 연결됨:
//   귀족 인간 × 농장 동물 → 새끼에게 "○○의 사생아" 특성 부여 (사회적 특성).

import type { Rng } from "../rng";

// ── 지위 등급 ───────────────────────────────────────────────────────────
// 낮음 → 높음. weight 는 기본 출현 가중치 (명성 0, 레벨 1 기준).
//
// 가중치 = max(0.05, baseWeight + fame * fameScale + level * levelScale)
//   - 단 farmLevel < minLevel 인 rank 는 가중치 0 (절대 등장 안 함).
//
// 레벨 5 미만에서는 백작/후작/공작이 안 옴 (minLevel=5).
// 그 이상에서는 levelScale 로 작위별 세분화 (높을수록 드물게):
//   count   levelScale 0.5
//   marquis levelScale 0.3
//   duke    levelScale 0.15
export type SocialRank = {
  id: string;
  label_ko: string;
  /** 사생아 특성 라벨 — "○○의 사생아" */
  bastardLabel: string;
  /** 방문료 / 명성 보너스 배율 */
  prestige: number;
  /** 기본 가중치 */
  baseWeight: number;
  /** 명성 1당 가중치 증가 */
  fameScale: number;
  /** 레벨 1당 가중치 증가 (음수면 레벨 높아질수록 줄어듦) */
  levelScale: number;
  /** 이 레벨 미만이면 절대 등장 안 함 */
  minLevel: number;
};

export const SOCIAL_RANKS: SocialRank[] = [
  // 하급 — 레벨 게이트 없음. commoner 는 레벨 오르면 자연 감소.
  { id: "commoner", label_ko: "평민", bastardLabel: "평민의 사생아", prestige: 1.0, baseWeight: 100, fameScale: -0.6, levelScale: -3,  minLevel: 0 },
  { id: "merchant", label_ko: "상인", bastardLabel: "상인의 사생아", prestige: 1.3, baseWeight: 40,  fameScale: 0.1,  levelScale: 0.1, minLevel: 0 },
  { id: "knight",   label_ko: "기사", bastardLabel: "기사의 사생아", prestige: 1.6, baseWeight: 22,  fameScale: 0.25, levelScale: 0.2, minLevel: 0 },
  { id: "baron",    label_ko: "남작", bastardLabel: "남작의 사생아", prestige: 2.0, baseWeight: 10,  fameScale: 0.35, levelScale: 0.3, minLevel: 0 },
  // 상급 — 레벨 5 부터. 작위 높을수록 levelScale 작아짐 (가중치 천천히 증가 = 드물게).
  { id: "count",    label_ko: "백작", bastardLabel: "백작의 사생아", prestige: 2.6, baseWeight: 4,   fameScale: 0.4,  levelScale: 0.5,  minLevel: 5 },
  { id: "marquis",  label_ko: "후작", bastardLabel: "후작의 사생아", prestige: 3.4, baseWeight: 1.5, fameScale: 0.45, levelScale: 0.3,  minLevel: 5 },
  { id: "duke",     label_ko: "공작", bastardLabel: "공작의 사생아", prestige: 4.5, baseWeight: 0.4, fameScale: 0.5,  levelScale: 0.15, minLevel: 5 },
];

const RANK_BY_ID: Record<string, SocialRank> = Object.fromEntries(
  SOCIAL_RANKS.map((r) => [r.id, r]),
);

export function getSocialRank(id: string): SocialRank {
  return RANK_BY_ID[id] ?? SOCIAL_RANKS[0];
}

// ── 명성/레벨 가중 지위 추첨 ────────────────────────────────────────────
//
// 가중치 = max(0.05, baseWeight + fame * fameScale + level * levelScale)
//   - 단 level < minLevel 인 rank 는 가중치 0 (선택 불가).
//
// 효과:
//   - 레벨 5 미만: 백작/후작/공작 등장 0% → 하급 귀족(평민/상인/기사/남작) 만.
//   - 레벨 5 부터: 상급 귀족도 등장. 작위 높을수록 levelScale 작아 천천히 증가.
//   - 명성 + 레벨 둘 다 영향 — 명성은 EXP 역할로 함께 오를 예정.
export function rollSocialRank(fame: number, level: number, rng: Rng): SocialRank {
  const weighted = SOCIAL_RANKS.map((r) => {
    if (level < r.minLevel) return { rank: r, w: 0 };
    const w = Math.max(0.05, r.baseWeight + fame * r.fameScale + level * r.levelScale);
    return { rank: r, w };
  });
  const total = weighted.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return SOCIAL_RANKS[0]; // 만약 모두 0 이면 평민 폴백
  let roll = rng.next() * total;
  for (const x of weighted) {
    roll -= x.w;
    if (roll <= 0) return x.rank;
  }
  return SOCIAL_RANKS[0];
}

// ── 나이 ────────────────────────────────────────────────────────────────
// 성인 범위에서 가우시안에 가깝게. (게임 톤상 18~45 정도)
export function rollAge(rng: Rng): number {
  const base = 18 + Math.floor(rng.next() * rng.next() * 28); // 18~45, 젊은 쪽 살짝 편중
  return Math.min(45, Math.max(18, base));
}