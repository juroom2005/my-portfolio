// src/components/drawings/editor/WritePageClient.tsx
// 작성 페이지 래퍼. 공용 PostForm 에 create 동작을 연결한다.

"use client";

import { useRouter } from "next/navigation";
import PostForm, { type PostFormValues, type PostFormResult } from "./PostForm";
import { createPostAction } from "@/app/drawings/write/actions";

export default function WritePageClient() {
  const router = useRouter();

  const handleSubmit = async (v: PostFormValues): Promise<PostFormResult> => {
    const res = await createPostAction({
      title: v.title,
      contentJson: v.contentJson,
      coverUrl: v.coverUrl,
      dominantColor: v.dominantColor,
      aspect: v.aspect,
      medium: v.medium,
    });
    if (!res.ok) return { ok: false, error: res.error };
    router.push(`/drawings/${res.id}`);
    return { ok: true };
  };

  return (
    <PostForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push("/drawings")}
    />
  );
}