// src/components/code/games/farm/species/index.ts
// 종 + 특성 레지스트리. 새 종/특성 추가는 여기에 한 줄.

import { RABBIT } from "./rabbit";
import { SHEEP } from "./sheep";
import type { Species } from "./types";

export const SPECIES_REGISTRY: Record<string, Species> = {
  rabbit: RABBIT,
  sheep: SHEEP,
};

// 캐릭터 생성기에서 플레이어가 시작 동물로 받을 수 있는 종
export const STARTER_SPECIES: string[] = ["rabbit", "sheep"];

export function getSpecies(id: string): Species {
  const s = SPECIES_REGISTRY[id];
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}

export * from "./types";
export * from "./traits";
