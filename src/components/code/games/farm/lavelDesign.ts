// src/components/code/games/farm/levelDesign.ts
//
// 레벨 임계치 곡선 + 레벨별 해금 정의. pure 함수.

export const MAX_LEVEL = 20;

const BASE = 18;
const EXP = 1.85;
const STEP = 6;

/** 레벨 L 에 도달하기 위한 누적 명성. L=1 은 0. */
export function fameToReach(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  return Math.round(BASE * Math.pow(n, EXP) + STEP * n);
}

/** 누적(또는 최고) 명성으로 현재 레벨을 산출. 1..MAX_LEVEL */
export function levelForFame(fame: number): number {
  let lv = 1;
  for (let L = 2; L <= MAX_LEVEL; L++) {
    if (fame >= fameToReach(L)) lv = L;
    else break;
  }
  return lv;
}

/** 다음 레벨까지의 진행도 (0~1). 만렙이면 1. */
export function levelProgress(fame: number): {
  level: number;
  next: number | null;
  curFloor: number;
  nextFloor: number | null;
  ratio: number;
} {
  const level = levelForFame(fame);
  if (level >= MAX_LEVEL) {
    return { level, next: null, curFloor: fameToReach(MAX_LEVEL), nextFloor: null, ratio: 1 };
  }
  const curFloor = fameToReach(level);
  const nextFloor = fameToReach(level + 1);
  const ratio = (fame - curFloor) / (nextFloor - curFloor);
  return { level, next: level + 1, curFloor, nextFloor, ratio: Math.min(1, Math.max(0, ratio)) };
}