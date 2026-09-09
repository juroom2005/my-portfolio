// src/app/drawings/write/actions.ts
// 그림 게시판 글 저장 Server Action. 인증 확인 + gallery_posts insert.
// content(Tiptap JSON)는 클라이언트에서 문자열로 직렬화해 넘겨받는다.
// (Next.js RSC 경계에서 중첩 객체가 참조로 처리되며 attrs 가 유실되는 문제 방지)

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreatePostInput = {
  title: string;
  contentJson: string; // JSON.stringify 된 Tiptap 문서
  coverUrl: string | null;
  dominantColor: string | null;
  aspect: number | null;
  medium?: string | null;
};

export type CreatePostResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPostAction(
  input: CreatePostInput
): Promise<CreatePostResult> {
  const title = input.title.trim();
  if (title.length < 1 || title.length > 200) {
    return { ok: false, error: "제목은 1~200자여야 합니다." };
  }

  let content: unknown;
  try {
    content = JSON.parse(input.contentJson);
  } catch {
    return { ok: false, error: "본문 형식이 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("gallery_posts")
    .insert({
      author_id: user.id,
      title,
      content,
      cover_url: input.coverUrl,
      dominant_color: input.dominantColor,
      aspect: input.aspect,
      medium: input.medium ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/drawings");
  return { ok: true, id: data.id };
}