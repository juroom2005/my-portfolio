// src/app/drawings/[id]/edit/actions.ts
// 글 수정/삭제 Server Action. 관리자(is_admin) 또는 본인만 허용.
// DB RLS 에서도 동일 규칙이 강제되며, 여기서는 명확한 에러 메시지 목적의 선검사를 둔다.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdatePostInput = {
  id: string;
  title: string;
  contentJson: string;
  coverUrl: string | null;
  dominantColor: string | null;
  aspect: number | null;
  medium?: string | null;
};

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

// 요청자가 관리자 또는 해당 글 작성자인지 확인
async function assertCanEdit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) return { ok: true };

  const { data: post } = await supabase
    .from("gallery_posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (post?.author_id === user.id) return { ok: true };
  return { ok: false, error: "권한이 없습니다." };
}

export async function updatePostAction(
  input: UpdatePostInput
): Promise<ActionResult> {
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
  const perm = await assertCanEdit(supabase, input.id);
  if (!perm.ok) return perm;

  const { error } = await supabase
    .from("gallery_posts")
    .update({
      title,
      content,
      cover_url: input.coverUrl,
      dominant_color: input.dominantColor,
      aspect: input.aspect,
      medium: input.medium ?? null,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/drawings");
  revalidatePath(`/drawings/${input.id}`);
  return { ok: true };
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const perm = await assertCanEdit(supabase, id);
  if (!perm.ok) return perm;

  const { error } = await supabase.from("gallery_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/drawings");
  return { ok: true };
}