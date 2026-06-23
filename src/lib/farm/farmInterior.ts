// src/lib/farm/farmInterior.ts
//
// 농장 본 화면용 데이터 fetch — 서버 사이드 전용.
// save + rooms + animals (nursery / room) 를 한 번의 round-trip 으로 가져온다.
// (Promise.all 로 동시 요청)

import { createClient } from "@/lib/supabase/server";
import type {
  FarmSaveRow,
  RoomRow,
  AnimalRow,
} from "@/components/code/games/farm/dbTypes";

export type FarmInteriorData = {
  save: FarmSaveRow;
  rooms: RoomRow[];
  /** status='room' 인 동물들 — room_id 별로 그룹핑하여 사용 */
  roomAnimals: AnimalRow[];
  /** status='nursery' 인 동물들 — 보육실 패널에 노출 */
  nurseryAnimals: AnimalRow[];
};

export async function getFarmInterior(saveId: string): Promise<FarmInteriorData | null> {
  const supabase = await createClient();

  const [saveRes, roomsRes, animalsRes] = await Promise.all([
    supabase.from("farm_saves").select("*").eq("id", saveId).maybeSingle(),
    supabase
      .from("rooms")
      .select("*")
      .eq("save_id", saveId)
      .order("floor", { ascending: true })
      .order("position", { ascending: true }),
    supabase
      .from("animals")
      .select("*")
      .eq("save_id", saveId)
      .in("status", ["room", "nursery"])
      .order("created_at", { ascending: true }),
  ]);

  if (saveRes.error) {
    console.error("[getFarmInterior] save error:", saveRes.error);
    return null;
  }
  if (!saveRes.data) return null;

  if (roomsRes.error) console.error("[getFarmInterior] rooms error:", roomsRes.error);
  if (animalsRes.error) console.error("[getFarmInterior] animals error:", animalsRes.error);

  const allAnimals = (animalsRes.data ?? []) as AnimalRow[];
  return {
    save: saveRes.data as FarmSaveRow,
    rooms: (roomsRes.data ?? []) as RoomRow[],
    roomAnimals: allAnimals.filter((a: AnimalRow) => a.status === "room"),
    nurseryAnimals: allAnimals.filter((a: AnimalRow) => a.status === "nursery"),
  };
}

// ── 시계 갱신 ───────────────────────────────────────────────────────────
//
// 클라이언트가 7초마다 틱을 올리지만 매 틱마다 DB 호출은 과함.
// 12틱(약 84초)에 한 번 + 페이지 hidden 시 호출.
//
// RLS 가 owner_id 매칭을 강제하므로 잘못된 saveId 로는 0행 업데이트.
export async function persistClock(
  saveId: string,
  currentDay: number,
  tickOfDay: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("farm_saves")
    .update({ current_day: currentDay, tick_of_day: tickOfDay })
    .eq("id", saveId);
  if (error) {
    console.error("[persistClock] error:", error);
  }
}