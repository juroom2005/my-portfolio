// src/lib/farm/starterPack.ts
//
// 시작 동물 생성기. 매니페스트(SPECIES_REGISTRY)와 makeStarter 를 결합해서
// 게임 시작 시 받을 동물 2마리 (토끼 ♀ + 양 ♀) 를 만든다.
//
// 시드는 deriveSeed("starter", characterName, species, sex) 로 만들어
// 같은 캐릭터 이름에 대해 항상 같은 시작 동물이 나오게(결정성). 디버깅·복원에 유용.
//
// 사용 예:
//   const animals = generateStarterPack({
//     characterName: "Alex",
//     rabbitChoices: { color: "검정", eye: "회색" },
//     sheepChoices:  { color: "흰",   eye: "호박색" },
//   });
//   await createSave({ character_name, character_metadata, farm_name, animals });

import { makeStarter, type NewAnimalData } from "@/components/code/games/farm/genetics";
import { getSpecies } from "@/components/code/games/farm/species";
import { Rng, deriveSeed } from "@/components/code/games/farm/rng";

export type StarterPackInput = {
  /** 시드 derivation 에 사용. 같은 이름이면 같은 시작 동물. */
  characterName: string;
  /** 토끼 ♀ 의 표현형 선택. 기본: 검정 모색, 회색 눈. */
  rabbitChoices?: Record<string, string>;
  /** 양 ♀ 의 표현형 선택. 기본: 흰 모색, 호박색 눈. */
  sheepChoices?: Record<string, string>;
};

const DEFAULT_RABBIT = { color: "검정", eye: "회색" };
const DEFAULT_SHEEP  = { color: "흰",   eye: "호박색" };

/**
 * 시작 패키지 — 토끼 ♀ + 양 ♀.
 * 반환 순서가 createSave 의 방 배치 순서와 일치 (1번방=토끼, 2번방=양).
 */
export function generateStarterPack(input: StarterPackInput): NewAnimalData[] {
  const rabbit = getSpecies("rabbit");
  const sheep = getSpecies("sheep");

  const rabbitDoe = makeStarter(
    rabbit,
    "F",
    new Rng(deriveSeed("starter", input.characterName, "rabbit", "F")),
    { phenotypes: input.rabbitChoices ?? DEFAULT_RABBIT },
  );

  const sheepDoe = makeStarter(
    sheep,
    "F",
    new Rng(deriveSeed("starter", input.characterName, "sheep", "F")),
    { phenotypes: input.sheepChoices ?? DEFAULT_SHEEP },
  );

  return [rabbitDoe, sheepDoe];
}
