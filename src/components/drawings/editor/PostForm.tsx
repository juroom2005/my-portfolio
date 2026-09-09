// src/components/drawings/editor/PostForm.tsx
// 작성/수정 공용 폼. 초기값과 저장 핸들러를 주입받아 UI 를 공유한다.
// content 는 문자열로 직렬화, cover/대표색을 추출해 onSubmit 으로 넘긴다.

"use client";

import { useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/react";
import RichEditor from "./RichEditor";
import { emptyDoc } from "./editorConfig";
import { analyzeCover } from "./dominantColor";

const MEDIUMS = ["illust", "sketch", "standing", "etc"] as const;

export type PostFormValues = {
  title: string;
  contentJson: string;
  coverUrl: string | null;
  dominantColor: string | null;
  aspect: number | null;
  medium: string;
};

export type PostFormResult = { ok: true } | { ok: false; error: string };

type Props = {
  mode: "create" | "edit";
  initialTitle?: string;
  initialMedium?: string;
  initialContent?: JSONContent;
  onSubmit: (values: PostFormValues) => Promise<PostFormResult>;
  onCancel: () => void;
};

// Tiptap JSON 트리에서 첫 이미지 src 추출
function firstImageUrl(node: JSONContent): string | null {
  if (node.type === "image" && node.attrs?.src) return node.attrs.src as string;
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const found = firstImageUrl(child);
      if (found) return found;
    }
  }
  return null;
}

export default function PostForm({
  mode,
  initialTitle = "",
  initialMedium = "illust",
  initialContent,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [medium, setMedium] = useState(initialMedium);
  const [content, setContent] = useState<JSONContent>(initialContent ?? emptyDoc);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setErr(null);
    if (!title.trim()) {
      setErr("제목을 입력하세요.");
      return;
    }
    const coverUrl = firstImageUrl(content);
    startTransition(async () => {
      const analysis = coverUrl
        ? await analyzeCover(coverUrl)
        : { dominantColor: null, aspect: null };
      const res = await onSubmit({
        title,
        contentJson: JSON.stringify(content),
        coverUrl,
        dominantColor: analysis.dominantColor,
        aspect: analysis.aspect,
        medium,
      });
      if (!res.ok) setErr(res.error);
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="font-mono text-xs text-ink/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-deep"
        >
          ← 취소
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="border-2 border-ink bg-neon px-4 py-2 font-mono text-xs font-bold text-ink transition-colors hover:bg-neon-deep disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {pending ? "저장 중…" : mode === "create" ? "게시" : "수정"}
        </button>
      </div>

      <label htmlFor="post-title" className="sr-only">
        제목
      </label>
      <input
        id="post-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        maxLength={200}
        className="mb-3 w-full border-2 border-ink bg-paper px-4 py-3 font-display text-xl text-ink placeholder:text-ink/30 focus:bg-neon-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />

      <div
        role="radiogroup"
        aria-label="작품 분류"
        className="mb-4 flex gap-1 font-mono text-xs"
      >
        {MEDIUMS.map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={medium === m}
            onClick={() => setMedium(m)}
            className={`border-2 border-ink px-3 py-1 uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              medium === m ? "bg-neon" : "bg-paper hover:bg-neon-soft"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <RichEditor initialContent={initialContent} onChange={setContent} />

      {err && (
        <div
          role="alert"
          className="mt-3 border-2 border-ink bg-neon-soft px-4 py-2 font-mono text-xs text-ink"
        >
          {err}
        </div>
      )}
    </div>
  );
}