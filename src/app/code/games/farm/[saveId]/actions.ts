// src/app/code/games/farm/[saveId]/actions.ts
//
// 농장 본 화면용 server actions.
// 지금은 시계 동기화만. 손님/교배 액션은 다음 iteration 에 추가.

"use server";

import { persistClock } from "@/lib/farm/farmInterior";
import { createClient } from "@/lib/supabase/server";
import type { Pregnancy } from "@/components/code/games/farm/pregnancySystem";
import { revalidatePath } from "next/cache";
import type { NewAnimalData } from "@/components/code/games/farm/genetics";

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

// ── 임신 영속 ───────────────────────────────────────────────────────────
//
// 임신은 암컷(animal) row 의 metadata.pregnancy 에 저장.
// 암컷 한 마리당 임신 하나라서 별도 테이블 불필요.
// RLS 가 owner_id 매칭 강제 → 남의 동물은 못 건드림.

export async function savePregnancyAction(
  motherId: string,
  pregnancy: Pregnancy,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  // 기존 metadata 보존하며 pregnancy 만 병합
  const { data: existing, error: readErr } = await supabase
    .from("animals")
    .select("metadata")
    .eq("id", motherId)
    .maybeSingle();

  if (readErr) {
    console.error("[savePregnancy] read error:", readErr);
    return { ok: false, error: readErr.message };
  }

  const metadata = {
    ...(existing?.metadata ?? {}),
    pregnancy,
  };

  const { error } = await supabase
    .from("animals")
    .update({ metadata })
    .eq("id", motherId);

  if (error) {
    console.error("[savePregnancy] write error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// 출산/유산 등으로 임신 레코드 제거
export async function clearPregnancyAction(
  motherId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: existing, error: readErr } = await supabase
    .from("animals")
    .select("metadata")
    .eq("id", motherId)
    .maybeSingle();

  if (readErr) {
    console.error("[clearPregnancy] read error:", readErr);
    return { ok: false, error: readErr.message };
  }

  const metadata = { ...(existing?.metadata ?? {}) };
  delete (metadata as Record<string, unknown>).pregnancy;

  const { error } = await supabase
    .from("animals")
    .update({ metadata })
    .eq("id", motherId);

  if (error) {
    console.error("[clearPregnancy] write error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };

}

type BirthChildPayload = NewAnimalData & {
  /** 자식 종 기준 maturity_days — 성체일자 계산용 (서버는 종 매니페스트를 모름) */
  maturity_days: number;
};
 
export type BirthInput = {
  saveId: string;
  motherId: string;
  offspring: BirthChildPayload[];
  bornOnDay: number;
  sireInfo?: {
    name: string;
    grade?: string;
    species?: string;
    socialRankId?: string | null;
  } | null;
  /** socialRankId. "commoner" 거나 null 이면 사생아 라벨 없음 → null 로. */
  bastardOf?: string | null;
};
 
export type BirthResult = {
  inserted_count: number;
  inserted_ids: string[];
  skipped: number;
  capacity: number;
  used_after: number;
};
 
export async function birthAction(input: BirthInput): Promise<BirthResult> {
  const supabase = await createClient();
 
  const { data, error } = await supabase.rpc("give_birth", {
    p_save_id: input.saveId,
    p_mother_id: input.motherId,
    p_offspring: input.offspring as unknown as Record<string, unknown>[],
    p_born_on_day: input.bornOnDay,
    p_sire_info: input.sireInfo ?? null,
    p_bastard_of: input.bastardOf ?? null,
  });
 
  if (error) {
    console.error("[birthAction] RPC error:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw new Error(`birthAction failed: ${error.message}`);
  }
 
  // 보육실/임신 패널 갱신
  revalidatePath(`/code/games/farm/${input.saveId}`);
 
  return data as BirthResult;
}

// ── 보육실 동물 → 방으로 이동 (암컷만) ─────────────────────────────────
export type RelocateInput = {
  saveId: string;
  animalId: string;
  roomId: string;
  day: number;
};
 
export async function relocateAnimalAction(input: RelocateInput) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("relocate_animal_to_room", {
    p_animal_id: input.animalId,
    p_room_id: input.roomId,
    p_day: input.day,
  });
  if (error) {
    console.error("[relocateAnimalAction] error:", error);
    throw new Error(`relocateAnimal failed: ${error.message}`);
  }
  revalidatePath(`/code/games/farm/${input.saveId}`);
}
 
// ── 보육실 동물 판매 ───────────────────────────────────────────────────
export type SellInput = {
  saveId: string;
  animalId: string;
  /** 클라이언트가 calcSellPrice 로 미리 계산해서 전달 */
  price: number;
  day: number;
};
 
export async function sellAnimalAction(input: SellInput) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sell_animal", {
    p_animal_id: input.animalId,
    p_price: input.price,
    p_day: input.day,
  });
  if (error) {
    console.error("[sellAnimalAction] error:", error);
    throw new Error(`sellAnimal failed: ${error.message}`);
  }
  revalidatePath(`/code/games/farm/${input.saveId}`);
}
 
// ── 보육실 동물 친부 송환 ──────────────────────────────────────────────
export type SendToSireInput = {
  saveId: string;
  animalId: string;
  /** 클라이언트가 calcSireSendFame 로 미리 계산해서 전달 */
  fameGain: number;
  day: number;
};
 
export async function sendAnimalToSireAction(input: SendToSireInput) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_animal_to_sire", {
    p_animal_id: input.animalId,
    p_fame_gain: input.fameGain,
    p_day: input.day,
  });
  if (error) {
    console.error("[sendAnimalToSireAction] error:", error);
    throw new Error(`sendAnimalToSire failed: ${error.message}`);
  }
  revalidatePath(`/code/games/farm/${input.saveId}`);
}

// ── 하루 정산 ───────────────────────────────────────────────────────────
//
// 잠들 때 호출. 누적 방문료를 farm_saves.money 에 commit + 다음 날 06:00 으로.
// 판매 수익/송환 명성은 각각의 RPC 에서 이미 즉시 반영됐으므로 여기선 안 더함.
export type SettlementSummary = {
  visits: number;
  births: number;
  sellsTotal: number;
  sireFame: number;
};
 
export type SettlementInput = {
  saveId: string;
  settlementDay: number;
  /** 정산할 누적 방문료 (메모리에만 있던 값) */
  moneyDelta: number;
  summary: SettlementSummary;
};
 
export type SettlementResult = {
  committed: boolean;
  money_after: number;
  fame_after: number;
  next_day: number;
};
 
export async function commitSettlementAction(
  input: SettlementInput,
): Promise<SettlementResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("commit_settlement", {
    p_save_id: input.saveId,
    p_settlement_day: input.settlementDay,
    p_money_delta: input.moneyDelta,
    p_summary: input.summary as unknown as Record<string, unknown>,
  });
  if (error) {
    console.error("[commitSettlementAction] error:", error);
    throw new Error(`commitSettlement failed: ${error.message}`);
  }
  revalidatePath(`/code/games/farm/${input.saveId}`);
  return data as SettlementResult;
}

// ── 동물 이름 변경 ─────────────────────────────────────────────────────
export async function renameAnimalAction(input: {
  saveId: string;
  animalId: string;
  name: string;
}): Promise<{ name: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rename_animal", {
    p_animal_id: input.animalId,
    p_name: input.name,
  });
  if (error) {
    console.error("[renameAnimalAction] error:", error);
    throw new Error(`renameAnimal failed: ${error.message}`);
  }
  revalidatePath(`/code/games/farm/${input.saveId}`);
  return { name: (data as { name: string | null }).name };
}

// actions.ts — 파일 맨 끝(renameAnimalAction 아래)에 추가

// ── 방 구매(농장 확장) ─────────────────────────────────────────────────
//
// 화면의 "내 돈" 은 save.money + moneyDelta 합산이지만, 실제 차감은 DB 의
// save.money 에서 이뤄진다. 클라이언트가 canBuyRoom 으로 미리 검증한 cost 와
// 배치 좌표(floor/position)를 넘기고, 서버는 방 개수/잔액을 재검증한다.
export type BuyRoomInput = {
  saveId: string;
  cost: number;
  floor: number;
  position: number;
};

export type BuyRoomResult = {
  ok: boolean;
  reason: string | null;
  money_after: number;
  new_room_id: string | null;
  room_count: number;
};

export async function buyRoomAction(input: BuyRoomInput): Promise<BuyRoomResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("buy_room", {
    p_save_id: input.saveId,
    p_cost: input.cost,
    p_floor: input.floor,
    p_position: input.position,
  });
  if (error) {
    console.error("[buyRoomAction] error:", error);
    throw new Error(`buyRoom failed: ${error.message}`);
  }
  // RPC 가 returns table → 배열로 옴. 첫 행 사용.
  const row = (Array.isArray(data) ? data[0] : data) as BuyRoomResult;
  revalidatePath(`/code/games/farm/${input.saveId}`);
  return row;
}

// ── 레벨 갱신 ───────────────────────────────────────────────────────────
// 정산 직후 호출. 명성으로 산출한 레벨이 현재보다 높으면 farm_saves.level 갱신.
export async function updateLevelAction(input: {
  saveId: string;
  level: number;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("farm_saves")
    .update({ level: input.level, updated_at: new Date().toISOString() })
    .eq("id", input.saveId);
  if (error) {
    console.error("[updateLevelAction] error:", error);
    throw new Error(`updateLevel failed: ${error.message}`);
  }
  revalidatePath(`/code/games/farm/${input.saveId}`);
  return { ok: true };
}