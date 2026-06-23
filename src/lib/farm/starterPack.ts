// src/lib/farm/starterPack.ts
//
// 시작 동물 생성기. 매니페스트(SPECIES_REGISTRY)와 makeStarter 를 결합해서
// 게임 시작 시 받을 동물 2마리 (토끼 ♀ + 양 ♀) 를 만든다.
//
// 시드는 호출자가 명시. 같은 시드 + 같은 choices → 항상 같은 동물.
// 클라이언트 미리보기와 server action 양쪽에서 같은 시드 쓰면 결과 일치.

import { makeStarter, type NewAnimalData } from "@/components/code/games/farm/genetics";
import { getSpecies } from "@/components/code/games/farm/species";
import { Rng, deriveSeed } from "@/components/code/games/farm/rng";

export type StarterPackInput = {
  /** 결정성 시드. UI "다시 굴리기" 로 변경. */
  seed: string;
  rabbitChoices?: Record<string, string>;
  sheepChoices?: Record<string, string>;
};

const DEFAULT_RABBIT = { color: "검정", eye: "회색" };
const DEFAULT_SHEEP = { color: "흰", eye: "호박색" };

export function generateStarterPack(input: StarterPackInput): NewAnimalData[] {
  const rabbit = getSpecies("rabbit");
  const sheep = getSpecies("sheep");

  const rabbitDoe = makeStarter(
    rabbit,
    "F",
    new Rng(deriveSeed("starter", input.seed, "rabbit", "F")),
    { phenotypes: input.rabbitChoices ?? DEFAULT_RABBIT },
  );

  const sheepDoe = makeStarter(
    sheep,
    "F",
    new Rng(deriveSeed("starter", input.seed, "sheep", "F")),
    { phenotypes: input.sheepChoices ?? DEFAULT_SHEEP },
  );

  return [rabbitDoe, sheepDoe];
}