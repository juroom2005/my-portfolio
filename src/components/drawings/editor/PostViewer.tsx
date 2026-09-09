// src/components/drawings/editor/PostViewer.tsx
// 저장된 Tiptap JSON 을 읽기전용으로 렌더. Tiptap v3 — useEditor(editable:false).

"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { editorExtensions } from "./editorConfig";

export default function PostViewer({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: editorExtensions,
    content,
    editable: false,
    immediatelyRender: false, // SSR 하이드레이션 불일치 방지
    editorProps: {
      attributes: { class: "prose-viewer font-sans text-ink" },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}