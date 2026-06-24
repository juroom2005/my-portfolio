// src/components/code/games/farm/visitorSystem.ts
//
// 손님 시스템의 순수 로직 (타입 + 생성기 + 방문료 공식).
// 상태 관리는 useVisitorSystem 훅에서.

import { Rng, deriveSeed } from "./rng";
import { GRADE_MULT, type Grade } from "./dbTypes";
import { getSpecies } from "./species";
import { makeVisitorBuck, makeStarter, type NewAnimalData } from "./genetics";
import { rollSocialRank, rollAge, getSocialRank } from "./species/humanProfile";
import type { AnimalRow } from "./dbTypes";
import { GUEST_RATIO, VISIT_TICKS_DEFAULT } from "./visitorConfig";

// ═══════════════════════════════════════════════════════════════════════
// 타입
// ═══════════════════════════════════════════════════════════════════════

export type VisitType = "guest" | "buck";

export type Visitor = {
  /** 시드로부터 결정적으로 생성된 ID */
  id: string;
  type: VisitType;
  /** 같은 종 교배만 다루는 단계라서 buck 도 게스트도 농장 동물의 종 */
  species: string;
  /** 게스트는 'F' / 'M' 랜덤, buck 은 항상 'M' */
  sex: "F" | "M";
  /** buck 은 자체 grade 가짐, 게스트는 'C' 로 통일 (의미 없음) */
  grade: Grade;
  /** 표시용 이름 */
  name: string;
  /** 도착 시점 일자 + 틱 (시각화/시드용) */
  arrived_day: number;
  arrived_tick: number;
  /**
   * buck 의 전체 유전 데이터 (genes/rare_genes/traits/능력치).
   * 표현형은 보여주되 유전자형(보인자)은 카드에서 숨김 — 교배 후 역추적 재미.
   * 게스트(인간)도 이제 animalData 를 가짐 — 혼혈 대비.
   */
  animalData?: NewAnimalData;
  /** 인간 게스트의 지위(귀족 등급) id — guest 일 때만 */
  socialRankId?: string;
  /** 인간 게스트의 나이 — guest 일 때만 */
  age?: number;
};

export type ActiveVisit = {
  visitor: Visitor;
  roomId: string;
  /** 도착해서 방에 들어간 절대 틱 (day * 144 + tick) */
  started_at_absolute_tick: number;
  /** 머무는 총 틱 수 */
  duration_ticks: number;
  /** 미리 계산된 방문료 (떠날 때 입금) */
  fee: number;
};

// ═══════════════════════════════════════════════════════════════════════
// 이름 풀 (시드 기반 픽) — 다양한 외국식 이름
// ═══════════════════════════════════════════════════════════════════════

const NAME_POOL = [
  // 영미권
  "올리버", "아멜리아", "헨리", "샬럿", "시어도어", "에블린",
  "세바스찬", "엘리너", "줄리언", "헤이즐", "펠릭스", "코라",
  // 유럽권
  "뤼시앵", "이졸데", "마티아스", "로잘린드", "플로리안", "베아트릭스",
  "안젤름", "리젤", "에밀", "콜레트", "마테오", "루치아",
  "쇠렌", "잉그리드", "카시우스", "세라피나", "드미트리", "아냐",
  // 좀 더 이국적
  "라시드", "레일라", "카이토", "메이", "이드리스", "나디아",
  "비외른", "프레이아", "카스피안", "오톨린", "리산더", "비비안",
];

// 지위가 높으면 성(가문명)을 붙임 — "카스피안 폰 팔켄슈타인" 느낌
const NOBLE_HOUSES = [
  "폰 아들러", "드 로지에", "폰 하비히트", "드 몽포르", "애쉬콤",
  "폰 팔켄슈타인", "드 발루아", "레이븐스크로프트", "폰 아이스발트", "보몽",
];

// ═══════════════════════════════════════════════════════════════════════
// 생성기
// ═══════════════════════════════════════════════════════════════════════

/**
 * 농장 동물(들)의 종 풀에서 손님을 만든다.
 *
 * 게스트 (70%): 농장 동물 종 중 랜덤. 성별 랜덤.
 * Buck   (30%): 농장 동물의 암컷이 있는 종 중 랜덤. 성별 수컷 고정.
 *               (다음 iteration 에서 실제 교배 액션과 연결)
 *
 * 농장에 동물이 없으면 null (손님 없음).
 */
export function spawnVisitor(args: {
  /** 농장 방에 있는 모든 성체 동물 */
  roomAnimals: AnimalRow[];
  /** 손님 시드 (save id + 도착 시점) */
  seed: string;
  arrivedDay: number;
  arrivedTick: number;
  /** buck 능력치 보정 + 인간 지위 가중에 쓰임 */
  fame: number;
  /** 인간 지위 게이트(level 5 미만이면 상급 귀족 등장 X) */
  farmLevel: number;
}): Visitor | null {
  const adults = args.roomAnimals.filter((a) => a.is_adult);
  if (adults.length === 0) return null;

  const rng = new Rng(args.seed);
  const isGuest = rng.next() < GUEST_RATIO;

  if (isGuest) {
    return makeHumanGuest(args, rng);
  }

  // Buck — 농장 암컷이 있는 종 중에서만 (교배 대상 있어야 의미 있음)
  const femaleSpecies = uniqueSpecies(adults.filter((a) => a.sex === "F"));
  if (femaleSpecies.length === 0) {
    // 농장에 암컷이 없으면 buck 도 못 옴 → 인간 게스트로 폴백
    return makeHumanGuest(args, rng);
  }

  const species = femaleSpecies[Math.floor(rng.next() * femaleSpecies.length)];

  // makeVisitorBuck — 외형 유전자 + 능력치 + 등급까지 완전한 buck 생성.
  // 표현형은 카드에서 보여주고, 유전자형(보인자)은 숨김.
  const speciesObj = getSpecies(species);
  const animalData = makeVisitorBuck(speciesObj, rng, args.fame);

  return {
    id: `visit_${args.seed}`,
    type: "buck",
    species,
    sex: "M",
    grade: animalData.grade,
    name: NAME_POOL[Math.floor(rng.next() * NAME_POOL.length)],
    arrived_day: args.arrivedDay,
    arrived_tick: args.arrivedTick,
    animalData,
  };
}

// ── 인간 게스트 생성 (시드 기반) ──────────────────────────────────────
function makeHumanGuest(
  args: { seed: string; arrivedDay: number; arrivedTick: number; fame: number; farmLevel: number },
  rng: Rng,
): Visitor {
  const human = getSpecies("human");
  // 모든 방문자는 ♂ — 농장은 암컷을 키우고 외부 수컷이 방문하는 구조
  const sex: "F" | "M" = "M";
  // makeStarter 가 genes/rare_genes/traits/능력치/grade/active_traits 다 채워줌
  const animalData = makeStarter(human, sex, rng);

  const rank = rollSocialRank(args.fame, args.farmLevel, rng);
  const age = rollAge(rng);

  return {
    id: `visit_${args.seed}`,
    type: "guest",
    species: "human",
    sex,
    grade: animalData.grade,
    name: makeHumanName(rng, rank.id),
    arrived_day: args.arrivedDay,
    arrived_tick: args.arrivedTick,
    animalData,
    socialRankId: rank.id,
    age,
  };
}

// 이름 — 평민은 이름만, 귀족은 경칭 + 가문명
function makeHumanName(rng: Rng, rankId: string): string {
  const first = NAME_POOL[Math.floor(rng.next() * NAME_POOL.length)];
  // baron 이상이면 가문명 붙임
  const nobleRanks = ["baron", "count", "marquis", "duke"];
  if (nobleRanks.includes(rankId)) {
    const house = NOBLE_HOUSES[Math.floor(rng.next() * NOBLE_HOUSES.length)];
    return `${first} ${house}`;
  }
  return first;
}

function uniqueSpecies(animals: AnimalRow[]): string[] {
  const set = new Set<string>();
  for (const a of animals) set.add(a.species);
  return [...set];
}

// ═══════════════════════════════════════════════════════════════════════
// 방문료 공식 (calcVisitFee 와 같은 패턴 — 등급/명성/희귀도 곱)
// ═══════════════════════════════════════════════════════════════════════

/**
 * 방 안의 동물(들) 평균 등급 + 명성 + 종 희귀도 기반.
 * roomAnimals 가 비어있으면 0.
 */
export function calcVisitorFee(args: {
  visitor: Visitor;
  roomAnimals: AnimalRow[];
  farmLevel: number;
  fame: number;
}): number {
  if (args.roomAnimals.length === 0) return 0;

  const species = getSpecies(args.visitor.species);
  const base = 50 * species.rarity_tier;

  // 방 동물 평균 등급 가중
  const gradeMults = args.roomAnimals.map(
    (a) => GRADE_MULT[(a.grade ?? "D") as Grade] ?? GRADE_MULT.D,
  );
  const avgGradeMult = gradeMults.reduce((s, m) => s + m, 0) / gradeMults.length;

  // 명성/레벨 보너스 (작게)
  const fameMult = 1 + args.farmLevel * 0.08 + args.fame * 0.002;

  // buck 은 자체 등급도 어느 정도 영향 (좋은 buck 일수록 농장에 큰 돈을 냄)
  const buckMult =
    args.visitor.type === "buck"
      ? GRADE_MULT[args.visitor.grade] ?? 1
      : 1;

  // 인간 게스트는 지위(prestige) 가 방문료에 반영 — 후작/공작은 후하게 냄
  const prestigeMult =
    args.visitor.type === "guest" && args.visitor.socialRankId
      ? getSocialRank(args.visitor.socialRankId).prestige
      : 1;

  return Math.max(50, Math.round(base * avgGradeMult * fameMult * buckMult * prestigeMult));
}

// ═══════════════════════════════════════════════════════════════════════
// 사용시간 (지금은 고정값)
// ═══════════════════════════════════════════════════════════════════════

export function defaultVisitDuration(): number {
  return VISIT_TICKS_DEFAULT;
}

// ═══════════════════════════════════════════════════════════════════════
// 손님 → 표시용 메타 (아이콘 / 라벨)
// ═══════════════════════════════════════════════════════════════════════

export function describeVisitor(v: Visitor): {
  icon: string;
  speciesLabel: string;
  typeLabel: string;
  sexSymbol: "♀" | "♂";
  rankLabel?: string;
  age?: number;
} {
  const species = getSpecies(v.species);
  const base = {
    icon: species.sprites.icon ?? "🐾",
    speciesLabel: species.label_ko,
    sexSymbol: (v.sex === "F" ? "♀" : "♂") as "♀" | "♂",
  };

  if (v.type === "buck") {
    return { ...base, typeLabel: "수컷 (교배 의뢰)" };
  }

  // 인간 게스트
  const rank = v.socialRankId ? getSocialRank(v.socialRankId) : null;
  return {
    ...base,
    typeLabel: rank ? rank.label_ko : "방문객",
    rankLabel: rank?.label_ko,
    age: v.age,
  };
}

// ── 사생아 부여 ─────────────────────────────────────────────────────────
//
// 인간 게스트(귀족)와 농장 동물 사이 자식에게 사회적 특성 부여.
// 평민(commoner)은 사생아 뱃지 안 붙임 — 귀족만.
export function bastardInfoFor(
  visitor: Visitor,
): { traitId: string; label: string } | null {
  if (visitor.type !== "guest" || !visitor.socialRankId) return null;
  if (visitor.socialRankId === "commoner") return null;
  const rank = getSocialRank(visitor.socialRankId);
  return { traitId: "noble_bastard", label: rank.bastardLabel };
}

// seed 헬퍼 export
export { deriveSeed };