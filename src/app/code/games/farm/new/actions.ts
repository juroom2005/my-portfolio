// src/app/code/games/farm/new/actions.ts
//
// Server Action — 클라이언트가 보낸 입력으로 새 세이브 생성.
// 클라이언트에서 본 미리보기와 같은 시드를 받아서 동일 동물 생성 보장.

"use server";

import { createSave } from "@/lib/farm/saves";
import { generateStarterPack } from "@/lib/farm/starterPack";

export type CreateNewFarmInput = {
  sex: "F" | "M";
  character_name: string;
  farm_name: string;
  seed: string;
  rabbitChoices: Record<string, string>;
  sheepChoices: Record<string, string>;
  rabbitName: string | null;
  sheepName: string | null;
};

export async function createNewFarmAction(input: CreateNewFarmInput): Promise<string> {
  const animals = generateStarterPack({
    seed: input.seed,
    rabbitChoices: input.rabbitChoices,
    sheepChoices: input.sheepChoices,
  });

  const saveId = await createSave({
    character_name: input.character_name,
    farm_name: input.farm_name,
    character_metadata: { sex: input.sex },
    animals,
    animal_names: [input.rabbitName, input.sheepName],
  });

  return saveId;
}