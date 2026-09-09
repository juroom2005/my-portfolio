// src/components/drawings/editor/uploadImage.ts
// gallery 버킷에 이미지 업로드. 경로 규칙 {userId}/{파일명} 은 Storage RLS 정책과 일치해야 한다.

import { createClient } from "@/lib/supabase/client";

const BUCKET = "gallery";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type UploadResult = { url: string; path: string };

export async function uploadGalleryImage(file: File): Promise<UploadResult> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("지원하지 않는 이미지 형식입니다 (jpeg/png/webp/gif).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("이미지는 5MB 이하만 올릴 수 있습니다.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(`업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
