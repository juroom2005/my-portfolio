// src/components/code/games/farm/dbTypes.ts
// DB row 타입 미러. 나중에 supabase gen types 로 자동생성한 걸로 교체 가능.

export type Genotype = [string, string];

export type FarmSaveRow = {
  id: string;
  owner_id: string;
  character_name: string;
  character_metadata: Record<string, unknown>;
  farm_name: string;
  level: number;
  money: number;
  fame: number;
  current_day: number;
  tick_of_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AnimalStatus =
  | "nursery"
  | "room"
  | "visitor_buck"
  | "sent_to_owner"
  | "sold"
  | "archived";

export type AnimalRow = {
  id: string;
  save_id: string;
  name: string | null;
  species: string;
  sex: "F" | "M";
  generation: number;
  mother_id: string | null;
  father_id: string | null;
  born_on_day: number;
  is_adult: boolean;
  adult_on_day: number | null;
  status: AnimalStatus;
  room_id: string | null;
  nursery_slot: number | null;
  genes: Record<string, Genotype>;
  rare_genes: Record<string, Genotype>;
  traits: Record<string, Genotype>;
  active_traits: string[];           // ← 신규: 등급 슬롯에 따라 활성화된 특성 ID
  is_sterile: boolean;
  beauty: number;
  stamina: number;
  temperament: number;
  health: number;
  fertility: number;
  grade: string | null;
  inbreeding_f: number;
  birth_visit_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RoomRow = {
  id: string;
  save_id: string;
  floor: number;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type VisitStatus = "pending" | "awaiting_pick" | "completed" | "no_pregnancy";

export type VisitRow = {
  id: string;
  save_id: string;
  visit_day: number;
  visit_tick: number;
  visitor_buck_id: string;
  visitor_name: string | null;
  visitor_metadata: Record<string, unknown>;
  doe_id: string | null;
  room_id: string | null;
  fee_paid: number;
  fee_in_lieu: number | null;
  resulted_in_pregnancy: boolean;
  status: VisitStatus;
  resolved_on_day: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

// ── 시간 상수 ───────────────────────────────────────────────────────────
export const TICKS_PER_DAY = 144;
export const TICK_OPEN = 48;
export const TICK_CLOSE = 108;
export const TICK_WAKE = 36;
export const TICK_FORCE_SLEEP = 16;
export const TICK_MS_REAL = 7000;

// ── 등급 ────────────────────────────────────────────────────────────────
export const GRADES = ["F", "E", "D", "C", "B", "A", "S", "S+"] as const;
export type Grade = (typeof GRADES)[number];

export const GRADE_MULT: Record<Grade, number> = {
  F: 0.5, E: 0.8, D: 1.0, C: 1.3, B: 1.7, A: 2.2, S: 3.0, "S+": 4.5,
};

// ── 보육실 용량 ─────────────────────────────────────────────────────────
export function nurseryCapacity(level: number): number {
  return 4 + level * 2;
}