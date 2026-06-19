// src/components/code/gamesData.ts
// '코드' 섹션 — 내가 만든 웹게임 창고. drawingsData.ts 와 같은 shape-first 컨벤션.
// 나중에 Supabase fetch로 교체해도 Game 타입만 유지하면 화면은 그대로 동작.

export type Game = {
  id: string;
  no: string;        // channel/index number
  name: string;      // EN title
  kor: string;       // 한글 제목
  file: string;      // 실행 파일명 (ls 표시 + ./run)
  genre: string;     // EN genre
  kind: GameKind;    // mini-screen 데모 종류
  stack: string;     // 기술 스택
  year: string;
  status: "PLAYABLE" | "WIP" | "ARCHIVED";
  size: string;
  plays: number;
  ctrl: string;      // 조작키
  accent: string;    // per-game accent
  desc: string;
};

export type GameKind = "snake" | "block" | "ship" | "word" | "pong" | "maze";

export const GAMES: Game[] = [
  { id: "snake", no: "01", name: "NEON SNAKE", kor: "네온 스네이크", file: "neon-snake.run", genre: "ARCADE", kind: "snake", stack: "Canvas · JS", year: "2023", status: "PLAYABLE", size: "48K", plays: 1284, ctrl: "↑ ↓ ← →", accent: "#B4FF3A", desc: "벽 없는 토러스 맵에서 자기 꼬리를 피해 먹이를 먹는 클래식." },
  { id: "block", no: "02", name: "BLOCK FALL", kor: "블록폴", file: "block-fall.run", genre: "PUZZLE", kind: "block", stack: "TS · Canvas", year: "2024", status: "PLAYABLE", size: "72K", plays: 2210, ctrl: "← → ↓  Z X", accent: "#7FD0FF", desc: "떨어지는 테트로미노를 쌓아 줄을 지운다. 7-bag 랜덤." },
  { id: "astro", no: "03", name: "ASTRO DRIFT", kor: "아스트로 드리프트", file: "astro-drift.run", genre: "SHOOTER", kind: "ship", stack: "WebGL", year: "2024", status: "WIP", size: "196K", plays: 642, ctrl: "A D  SPACE", accent: "#FF6B5B", desc: "관성으로 표류하는 우주선, 부서지는 소행성. 물리 기반 슈팅." },
  { id: "word", no: "04", name: "WORD WELL", kor: "낱말우물", file: "word-well.run", genre: "WORD", kind: "word", stack: "React", year: "2025", status: "PLAYABLE", size: "88K", plays: 903, ctrl: "TYPE · ENTER", accent: "#E7B84B", desc: "우물에서 길어 올린 자모로 단어를 완성하는 한글 퍼즐." },
  { id: "pong", no: "05", name: "PONG.404", kor: "퐁", file: "pong-404.run", genre: "ARCADE", kind: "pong", stack: "Vanilla JS", year: "2022", status: "ARCHIVED", size: "12K", plays: 3567, ctrl: "W S  ↑ ↓", accent: "#C9C9C2", desc: "가장 처음 만든 것. 1인/2인, AI 반사 각도 약간 비틀어둠." },
  { id: "maze", no: "06", name: "MIRROR MAZE", kor: "거울미로", file: "mirror-maze.run", genre: "PUZZLE", kind: "maze", stack: "Canvas", year: "2025", status: "WIP", size: "120K", plays: 418, ctrl: "↑ ↓ ← →", accent: "#B98BFF", desc: "빛을 거울로 반사시켜 출구를 여는 그리드 미로." },
];

export const STATUS_COLOR: Record<Game["status"], string> = {
  PLAYABLE: "#B4FF3A",
  WIP: "#E7B84B",
  ARCHIVED: "#8A8A82",
};
