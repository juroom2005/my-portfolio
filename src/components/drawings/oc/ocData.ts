// src/components/drawings/oc/ocData.ts
// OC roster for the 전광판(broadcast) select screen at /drawings/oc.
// Same shape-first convention as drawingsData.ts — swap to a Supabase fetch later.

export type OC = {
  id: string;
  no: string;          // channel number, e.g. "01"
  kor: string;         // 한글 이름
  en: string;          // latin caption
  rarity: "SSR" | "SS" | "SR" | "R";
  role: string;        // EN role
  roleKo: string;      // 한글 역할
  affil: string;       // 소속
  ability: string;
  tag: string;         // one-line voice
  accent: string;      // per-character neon-ish accent
  tone: string;        // dark panel base
  locked?: boolean;    // 미공개 슬롯
};

export const ROSTER: OC[] = [
  {
    id: "shan", no: "01", kor: "샨", en: "SHAN", rarity: "SSR",
    role: "OBSERVER", roleKo: "관측자", affil: "천문대 · 校時者",
    ability: "Liminal Sight", tag: "넌 사람을 볼 줄 안다고 했지",
    accent: "#B6E84A", tone: "#1a2014",
  },
  {
    id: "ari", no: "02", kor: "아리", en: "ARI", rarity: "SS",
    role: "ARCHIVIST", roleKo: "기록자", affil: "6번 자료실",
    ability: "Paper Parser", tag: "종이 한 장에도 색이 있어요",
    accent: "#E0926E", tone: "#231711",
  },
  {
    id: "kei", no: "03", kor: "케이", en: "KEI", rarity: "SR",
    role: "RUNNER", roleKo: "주자", affil: "거리 무선 채널",
    ability: "Wire Whisper", tag: "전선이 흥얼거리는 걸 들었어",
    accent: "#7FA8D6", tone: "#121b24",
  },
  {
    id: "mystery", no: "04", kor: "미지", en: "???", rarity: "R",
    role: "CLASSIFIED", roleKo: "기밀", affil: "— — —",
    ability: "Access Denied", tag: "파일 손상 · 접근 거부됨",
    accent: "#9AA09A", tone: "#15171a", locked: true,
  },
];

export const RARITY_N: Record<OC["rarity"], number> = {
  SSR: 4, SS: 3, SR: 2, R: 1,
};
