// src/components/code/games/farm/species/types.ts
//
// 종(species) 매니페스트 타입.
// 새 종 추가 = 이 타입에 맞춰 객체 하나 만들고 ./index.ts 의 SPECIES_REGISTRY 에 등록.
// DB는 이 키('rabbit', 'sheep', …)만 문자열로 저장.

// ── 유전자 기본 단위 ───────────────────────────────────────────────────
export type Allele = string; // 'B', 'b' 같은 단문자 코드
export type Genotype = [Allele, Allele]; // 항상 2개 (이배체)

export type AlleleSpec = {
  code: Allele;
  label_ko: string; // '검정'
  dominant: boolean; // 단순 우/열. 공우성/불완전우성은 trait.expression에서 처리.
};

// ── 외형 유전 형질 (계층 1) ────────────────────────────────────────────
export type GeneTrait = {
  id: string; // 'color'
  label_ko: string; // '모색'
  label_en: string;
  alleles: AlleleSpec[];

  // 유전자형 → 표현형 라벨. 공우성/불완전우성은 여기서 구현.
  expression: (genotype: Genotype) => string;

  // 캐릭터 생성기에서 플레이어가 시작 동물의 이 형질을 직접 고를 수 있나
  player_selectable?: boolean;
};

// ── 희귀 유전자 (계층 3) ────────────────────────────────────────────────
//
// GeneTrait 와 대칭으로 alleles 를 포함한다.
// 컨벤션:
//   dominant=true 인 알렐이 "정상" (희귀 형질 없음)
//   dominant=false 인 알렐이 "희귀 형질" (동형접합 시 발현)
// genetics.ts 가 이 컨벤션으로 정상/희귀 알렐을 찾아 변이 풀과 보인자 생성에 사용.
export type RareGeneSpec = {
  id: string; // 'shadow'
  label_ko: string; // '섀도우'
  label_en: string;
  rarity_label: string; // 'LEGENDARY' | 'MYTHIC' — UI 표기
  grade_bonus: number; // 발현 시 등급 점수 가산

  alleles: AlleleSpec[]; // 정확히 2개: 정상(dominant) + 희귀(recessive)

  expression: (genotype: Genotype) => "expressed" | "carrier" | "none";

  // 시작 동물에 보인자로 부여될 확률 (0~1). 시드 다양성 확보용.
  starter_carrier_chance?: number;
};

// ── 스프라이트 (우선순위 폴백) ──────────────────────────────────────────
// 렌더 컴포넌트는 image_* → icon → text_* 순서로 시도.
// 스프라이트 들어오면 image_* 채워넣기만 하면 됨, 코드 수정 불필요.
export type SpriteSet = {
  icon?: string;
  text_baby?: string;
  text_adult_f?: string;
  text_adult_m?: string;
  image_baby?: string;
  image_adult_f?: string;
  image_adult_m?: string;
  // 모색별 변형 슬롯 — "color:B/_" 같은 키로 등록 (나중에)
  image_variants?: Record<string, string>;
};

// ── Species 본체 ────────────────────────────────────────────────────────
export type Species = {
  id: string; // 'rabbit'
  label_ko: string; // '토끼수인'
  label_en: string;

  rarity_tier: number; // 1(흔함) ~ 10(전설). 가격 공식 기본 계수.

  // 시간 (인게임 일수)
  maturity_days: number; // 출생 → 성체
  gestation_days: number; // 교배 → 출생
  lifespan_days: number; // 자연 수명 (현재는 정보용)

  // 번식
  base_fertility: number; // 0~1, 임신 성공 기준 확률
  litter_min: number;
  litter_max: number;

  // 유전 정의
  genes: GeneTrait[];
  rare_genes: RareGeneSpec[];

  // 스타팅 동물 능력치 기준 범위
  starter_stat_range: { min: number; max: number };

  // 시각
  sprites: SpriteSet;
};
