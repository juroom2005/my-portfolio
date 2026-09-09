// src/components/drawings/editor/EditPageClient.tsx
// 수정 페이지 래퍼. 기존 글 값을 초기값으로 PostForm 에 주입하고 update 를 연결한다.

"use client";

import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import PostForm, { type PostFormValues, type PostFormResult } from "./PostForm";
import { updatePostAction } from "@/app/drawings/[id]/edit/actions";

type Props = {
  id: string;
  title: string;
  medium: string;
  content: JSONContent;
};

export default function EditPageClient({ id, title, medium, content }: Props) {
  const router = useRouter();

  const handleSubmit = async (v: PostFormValues): Promise<PostFormResult> => {
    const res = await updatePostAction({
      id,
      title: v.title,
      contentJson: v.contentJson,
      coverUrl: v.coverUrl,
      dominantColor: v.dominantColor,
      aspect: v.aspect,
      medium: v.medium,
    });
    if (!res.ok) return { ok: false, error: res.error };
    router.push(`/drawings/${id}`);
    return { ok: true };
  };

  return (
    <PostForm
      mode="edit"
      initialTitle={title}
      initialMedium={medium}
      initialContent={content}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/drawings/${id}`)}
    />
  );
}