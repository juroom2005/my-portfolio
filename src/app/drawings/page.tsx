// src/app/drawings/page.tsx
// 그림 갤러리 진입 — 서버에서 gallery_posts 조회 후 Drawing 형태로 변환해 전달.

import DrawingsPage from "@/components/drawings/DrawingsPage";
import { postToDrawing, type GalleryPostRow } from "@/components/drawings/galleryAdapter";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "01 · DRAWINGS · 그림",
};

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_posts")
    .select("id, title, medium, cover_url, dominant_color, aspect, created_at")
    .order("created_at", { ascending: false });

  const posts = (data as GalleryPostRow[] | null ?? []).map(postToDrawing);

  return <DrawingsPage posts={posts} />;
}