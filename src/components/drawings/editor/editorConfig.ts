// src/components/drawings/editor/editorConfig.ts
// 에디터(작성)와 뷰어(상세)가 공유하는 Tiptap extension 목록.
// 작성과 렌더가 같은 확장을 써야 저장된 JSON이 동일하게 그려진다.

import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import type { Extensions } from "@tiptap/react";

export const editorExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false, // 아래 커스텀 Link 로 대체 (v3 StarterKit 내장 Link 와 중복 방지)
  }),
  Image.configure({
    inline: false,
    allowBase64: false, // 이미지는 Storage 업로드 URL만 허용 (base64 본문 방지)
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    },
  }),
];

// 빈 문서 (작성 초기값)
export const emptyDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};