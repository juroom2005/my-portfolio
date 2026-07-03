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


// ── 방 확장(구매) ────────────────────────────────────────────────────────
export const BASE_ROOMS = 3;        // L1 시작 방 수 = 구매 상한
export const ROOMS_PER_LEVEL = 3;
export const COST_BASE = 300;         // 첫 추가 방 기준값
export const ROOM_STEP = 1.45;        // 방 하나 늘 때마다 +45%
export const LEVEL_COST_SCALE = 0.12; // 레벨 1당 +12%

/** 레벨에서 허용되는 최대 방 수(구매 상한 포함). L1=2 … L20=40 */
export function roomCap(level: number): number {
  return BASE_ROOMS + (level - 1) * ROOMS_PER_LEVEL;
}

/** 다음 방 1칸의 비용. currentRooms = 현재 보유 방 수. */
export function nextRoomCost(level: number, currentRooms: number): number {
  const extra = Math.max(0, currentRooms - BASE_ROOMS);
  return Math.round(
    COST_BASE * Math.pow(ROOM_STEP, extra) * (1 + level * LEVEL_COST_SCALE),
  );
}

/** 지금 방을 살 수 있는지 + 못 사면 사유. */
export function canBuyRoom(
  level: number,
  currentRooms: number,
  money: number,
): { ok: boolean; cost: number; reason?: "cap_reached" | "not_enough_money" } {
  const cost = nextRoomCost(level, currentRooms);
  if (currentRooms >= roomCap(level)) return { ok: false, cost, reason: "cap_reached" };
  if (money < cost) return { ok: false, cost, reason: "not_enough_money" };
  return { ok: true, cost };
}

export function roomSlotFor(idx: number): { floor: number; position: number } {
  return { floor: Math.floor(idx / 3) + 1, position: idx % 3 };
}