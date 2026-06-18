// Mock drawings data. Replace with a Supabase fetch later — shape stays the same.
// Curated palettes so the gallery reads as one body of work, not random colors.

export type Medium = "oil" | "ink" | "digital" | "mixed";

export type Drawing = {
  id: string;
  title: string;
  medium: Medium;
  date: string;     // ISO yyyy-mm-dd
  bg: string;       // dominant color
  accent: string;   // secondary color
  aspect: number;   // width / height
  idx: number;      // 1-based
};

const BG = [
  "#E8E5DA", "#F2EBD8", "#D9D4C5", "#E7E1D0", "#CFC9B8", "#EFE9D7",
  "#1F211D", "#2A2B26", "#34352F", "#3F4036", "#1A1B17", "#222420",
  "#B4FF3A", "#DAFF85", "#8FE600", "#A8E92F", "#C8FF6E", "#9FF03D",
  "#C95F4C", "#A04332", "#822D1F", "#B95644", "#D8745E", "#6A1F12",
  "#3E5C84", "#6C8AB0", "#1F3556", "#48638E", "#1A2A45", "#90A8C7",
];

const TITLES = [
  "잠 못 든 새벽", "오후 4시의 창", "검은 라일락", "테이블 위 사과",
  "여름의 끝", "형광 이끼", "종이 산", "파란 방의 의자",
  "두 마리 새", "거짓말", "코너의 책", "녹은 얼음",
  "비가 오기 전", "자화상 7", "문 너머", "겨울 길",
  "책상 풍경", "블루베리 잼", "오후의 햇볕", "드로잉 #04",
  "익명의 사람", "풀밭", "전화 부스", "노란 우산",
  "망설임", "한 줌의 빛", "어떤 저녁", "연구 #12",
  "도시 단편", "거실의 라디오", "회색 정물", "초록의 침묵",
  "미완성", "정오", "구름 그림자", "강가에서",
];

const MEDIUMS: Medium[] = ["oil", "ink", "digital", "mixed"];

// Asymmetric aspect ratios — gives masonry/river layouts something to chew on.
const ASPECTS = [1, 0.75, 1.33, 1, 1.5, 0.66, 1, 1.25, 0.8, 1.1, 1, 1.4, 0.9];

export const DRAWINGS: Drawing[] = Array.from({ length: 36 }).map((_, i) => {
  const date = new Date(2026, 4 - (i % 6), 28 - ((i * 3) % 28));
  return {
    id: `d${String(i).padStart(2, "0")}`,
    title: TITLES[i % TITLES.length],
    medium: MEDIUMS[i % 4],
    date: date.toISOString().slice(0, 10),
    bg: BG[i % BG.length],
    accent: BG[(i * 7 + 3) % BG.length],
    aspect: ASPECTS[i % ASPECTS.length],
    idx: i + 1,
  };
});
