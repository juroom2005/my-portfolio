// src/components/code/games/farm/visitorConfig.ts
//
// 손님 시스템 튜닝 상수. 게임 밸런스 잡을 때 여기 한 곳만 손대면 됨.

// ── 도착 ────────────────────────────────────────────────────────────────
/** 영업시간 매 틱당 손님 도착 시도 확률 */
export const ARRIVAL_BASE_CHANCE = 0.08;

/** 명성 1당 도착 확률 증가량 (선형). fame=100 이면 +0.02 (즉 2% 추가) */
export const FAME_ARRIVAL_BONUS = 0.0002;

// ── 종류 비율 (devlog 정의) ─────────────────────────────────────────────
/** 일반 게스트 비율 (나머지는 buck) */
export const GUEST_RATIO = 0.6;

// ── 하루 상한 ───────────────────────────────────────────────────────────
/** 명성 0 일 때 하루 최대 손님 수 */
export const DAILY_LIMIT_BASE = 5;

/** 명성 이만큼 마다 하루 상한 +1 */
export const DAILY_LIMIT_FAME_STEP = 30;

export function dailyLimit(fame: number): number {
  return DAILY_LIMIT_BASE + Math.floor(Math.max(0, fame) / DAILY_LIMIT_FAME_STEP);
}

// ── 사용시간 ────────────────────────────────────────────────────────────
/** 손님 기본 사용시간 (틱) — 1틱 10분, 6틱 = 1시간 */
export const VISIT_TICKS_DEFAULT = 6;

// ── 추가비용 (다음 iteration 에서 사용 예정) ────────────────────────────
/** 추가비용 제안 확률 — 등급 평균 + 명성 보정. 다음 iteration. */
export const EXTRA_FEE_BASE_CHANCE = 0.25;
/** 추가비용 시 늘어나는 시간 (틱) */
export const VISIT_TICKS_EXTRA = 3;
/** 추가비용 = 기본 방문료의 이 배율 */
export const EXTRA_FEE_MULT = 0.5;