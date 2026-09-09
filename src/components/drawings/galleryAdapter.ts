// src/components/drawings/galleryAdapter.ts
// DB gallery_posts 행을 기존 갤러리의 Drawing 모양으로 변환.
// DrawingsPage 의 렌더 로직을 건드리지 않으려는 어댑터 계층.

import type { Drawing, Medium } from "./drawingsData";

export type GalleryPostRow = {
  id: string;
  title: string;
  medium: string | null;
  cover_url: string | null;
  dominant_color: string | null;
  aspect: number | null;
  created_at: string;
};

const MEDIUMS: Medium[] = ["illust", "sketch", "standing", "etc"];
const DEFAULT_BG = "#E8E5DA"; // 색 추출 실패/텍스트 글용 기본 배경

function toMedium(v: string | null): Medium {
  return MEDIUMS.includes(v as Medium) ? (v as Medium) : "etc";
}

export function postToDrawing(row: GalleryPostRow, idx: number): Drawing {
  const bg = row.dominant_color ?? DEFAULT_BG;
  return {
    id: row.id,
    title: row.title,
    medium: toMedium(row.medium),
    date: row.created_at.slice(0, 10),
    bg,
    accent: bg,
    aspect: row.aspect && row.aspect > 0 ? row.aspect : 1,
    idx: idx + 1,
    coverUrl: row.cover_url ?? undefined,
  };
}