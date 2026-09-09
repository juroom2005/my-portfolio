// src/app/drawings/[id]/edit/page.tsx
// 글 수정 화면 — 서버 컴포넌트. 관리자 또는 작성자만 진입, 아니면 상세로 돌려보냄.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditPageClient from "@/components/drawings/editor/EditPageClient";
import type { JSONContent } from "@tiptap/react";

type PostRow = {
  id: string;
  title: string;
  content: JSONContent;
  medium: string | null;
  author_id: string;
};

export const metadata = {
  title: "글 수정 — 그림",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/drawings/${id}/edit`);

  const { data, error } = await supabase
    .from("gallery_posts")
    .select("id, title, content, medium, author_id")
    .eq("id", id)
    .single<PostRow>();

  if (error || !data) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const canEdit = !!profile?.is_admin || data.author_id === user.id;
  if (!canEdit) redirect(`/drawings/${id}`);

  return (
    <EditPageClient
      id={data.id}
      title={data.title}
      medium={data.medium ?? "illust"}
      content={data.content}
    />
  );
}
