// src/lib/farm/saves.ts
//
// 농장 세이브 CRUD 헬퍼 — 서버 사이드 전용 (RLS로 보호).
// 클라이언트에서 호출 필요 시 server action 으로 wrap 해서 사용.

import { createClient } from "@/lib/supabase/server";
import { calcGrade } from "@/components/code/games/farm/grading";
import type { FarmSaveRow } from "@/components/code/games/farm/dbTypes";
import type { NewAnimalData } from "@/components/code/games/farm/genetics";

// ── 입력 타입 ───────────────────────────────────────────────────────────
export type CreateSaveInput = {
  character_name: string;
  character_metadata: Record<string, unknown>;
  farm_name: string;
  animals: NewAnimalData[];
  animal_names?: (string | null)[];
};

// ── 진입 화면용: 세이브 + 동물 수 ───────────────────────────────────────
export type FarmSaveWithStats = FarmSaveRow & {
  animal_count: number;
};

// ── 조회 ────────────────────────────────────────────────────────────────

export async function getMySaves(): Promise<FarmSaveRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_saves")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getMySaves] error:", {
      message: error.message, code: error.code, details: error.details,
    });
    return [];
  }
  return data ?? [];
}

/**
 * 진입 화면용 — 세이브 목록 + 각 세이브의 현재 동물 수.
 * 동물 수는 status='room' 또는 'nursery' 인 것만 카운트 (활성 동물).
 * N+1 회피: animals 한 번에 가져와서 클라이언트에서 매핑.
 */
export async function getMySavesWithStats(): Promise<FarmSaveWithStats[]> {
  const supabase = await createClient();

  const [savesRes, animalsRes] = await Promise.all([
    supabase
      .from("farm_saves")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("animals")
      .select("save_id")
      .in("status", ["room", "nursery"]),
  ]);

  if (savesRes.error) {
    console.error("[getMySavesWithStats] saves error:", savesRes.error);
    return [];
  }

  const counts = new Map<string, number>();
  for (const a of animalsRes.data ?? []) {
    counts.set(a.save_id, (counts.get(a.save_id) ?? 0) + 1);
  }

  return (savesRes.data ?? []).map((s) => ({
    ...s,
    animal_count: counts.get(s.id) ?? 0,
  }));
}

export async function getSave(saveId: string): Promise<FarmSaveRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_saves")
    .select("*")
    .eq("id", saveId)
    .maybeSingle();

  if (error) {
    console.error("[getSave] error:", { message: error.message, code: error.code });
    return null;
  }
  return data;
}

// ── 생성 ────────────────────────────────────────────────────────────────

export async function createSave(input: CreateSaveInput): Promise<string> {
  const supabase = await createClient();

  const animalsWithGrade = input.animals.map((a, i) => ({
    ...a,
    grade: calcGrade(a),
    name: input.animal_names?.[i] ?? null,
  }));

  const payload = {
    character_name: input.character_name,
    character_metadata: input.character_metadata,
    farm_name: input.farm_name,
    animals: animalsWithGrade,
  };

  const { data, error } = await supabase.rpc("create_farm_save", {
    payload: payload as unknown as Record<string, unknown>,
  });

  if (error) {
    console.error("[createSave] RPC error:", {
      message: error.message, code: error.code, details: error.details,
    });
    throw new Error(`createSave failed: ${error.message}`);
  }
  if (!data) throw new Error("createSave returned no id");
  return data as string;
}

// ── soft delete ────────────────────────────────────────────────────────

export async function deactivateSave(saveId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("farm_saves")
    .update({ is_active: false })
    .eq("id", saveId);

  if (error) {
    console.error("[deactivateSave] error:", error);
    throw new Error(`deactivateSave failed: ${error.message}`);
  }
}