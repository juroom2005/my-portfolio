// src/app/code/games/farm/[saveId]/actions.ts
//
// 농장 본 화면용 server actions.
// 지금은 시계 동기화만. 손님/교배 액션은 다음 iteration 에 추가.

"use server";

import { persistClock } from "@/lib/farm/farmInterior";

export async function saveClockAction(
  saveId: string,
  currentDay: number,
  tickOfDay: number,
): Promise<void> {
  // 클라이언트가 보낸 값 사니티 체크 — 음수/오버플로 방지
  const day = Math.max(1, Math.floor(currentDay));
  const tick = Math.max(0, Math.min(143, Math.floor(tickOfDay)));
  await persistClock(saveId, day, tick);
}