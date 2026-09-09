// src/app/drawings/[id]/page.tsx
// 그림 게시판 글 상세 — 서버 컴포넌트. id 로 조회, 없으면 404.
// 관리자 또는 작성자에게만 수정/삭제 버튼을 노출한다.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostViewer from "@/components/drawings/editor/PostViewer";
import PostActions from "@/components/drawings/editor/PostActions";
import type { JSONContent } from "@tiptap/react";

type PostRow = {
  id: string;
  title: string;
  content: JSONContent;
  medium: string | null;
  created_at: string;
  author_id: string;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_posts")
    .select("id, title, content, medium, created_at, author_id")
    .eq("id", id)
    .single<PostRow>();

  if (error || !data) notFound();

  // 수정/삭제 권한: 관리자 또는 작성자
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canEdit = false;
  if (user) {
    if (user.id === data.author_id) {
      canEdit = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      canEdit = !!profile?.is_admin;
    }
  }

  const date = new Date(data.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/drawings"
          className="font-mono text-xs text-ink/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-deep"
        >
          ← 갤러리
        </Link>
        {canEdit && <PostActions id={data.id} />}
      </div>

      <header className="mt-4 border-b-2 border-ink pb-4">
        <h1 className="font-display text-3xl text-ink">{data.title}</h1>
        <div className="mt-2 flex items-center gap-2 font-mono text-xs text-ink/60">
          {data.medium && (
            <span className="border-2 border-ink px-2 py-0.5 uppercase">
              {data.medium}
            </span>
          )}
          <time>{date}</time>
        </div>
      </header>

      <div className="mt-6">
        <PostViewer content={data.content} />
      </div>
    </article>
  );
}