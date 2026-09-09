// src/components/drawings/editor/PostActions.tsx
// 상세 페이지의 수정/삭제 버튼. 관리자 또는 작성자에게만 렌더된다(서버에서 판단).
// 삭제는 확인 후 실행, 성공 시 갤러리로 이동.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "@/app/drawings/[id]/edit/actions";

export default function PostActions({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    setErr(null);
    startTransition(async () => {
      const res = await deletePostAction(id);
      if (!res.ok) {
        setErr(res.error);
        setConfirming(false);
        return;
      }
      router.push("/drawings");
    });
  };

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <button
        onClick={() => router.push(`/drawings/${id}/edit`)}
        className="border-2 border-ink bg-paper px-3 py-1 transition-colors hover:bg-neon-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        수정
      </button>

      {confirming ? (
        <>
          <button
            onClick={remove}
            disabled={pending}
            className="border-2 border-ink bg-ink px-3 py-1 text-paper transition-opacity hover:opacity-80 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {pending ? "삭제 중…" : "정말 삭제"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="border-2 border-ink bg-paper px-3 py-1 transition-colors hover:bg-neon-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            취소
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="border-2 border-ink bg-paper px-3 py-1 transition-colors hover:bg-neon-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          삭제
        </button>
      )}

      {err && (
        <span role="alert" className="text-ink/70">
          {err}
        </span>
      )}
    </div>
  );
}
