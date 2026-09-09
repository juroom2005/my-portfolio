// src/components/drawings/editor/RichEditor.tsx
// Tiptap 리치 에디터. 볼드/이탤릭/헤딩/리스트/링크/이미지 툴바 제공.
// onChange 로 상위에 Tiptap JSON 을 전달한다.

"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { editorExtensions, emptyDoc } from "./editorConfig";
import { uploadGalleryImage } from "./uploadImage";

type Props = {
  initialContent?: JSONContent;
  onChange: (json: JSONContent) => void;
};

export default function RichEditor({ initialContent, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent ?? emptyDoc,
    immediatelyRender: false, // SSR 하이드레이션 불일치 방지 (Next.js)
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[320px] px-4 py-3 focus:outline-none font-sans text-ink",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "본문",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  const pickImage = useCallback(() => fileInput.current?.click(), []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // 같은 파일 재선택 가능하게 초기화
      if (!file || !editor) return;
      setErr(null);
      setUploading(true);
      try {
        const { url } = await uploadGalleryImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL", prev ?? "https://");
    if (url === null) return; // 취소
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border-2 border-ink bg-paper">
      <div
        role="toolbar"
        aria-label="서식 도구"
        className="flex flex-wrap items-center gap-1 border-b-2 border-ink px-2 py-2 font-mono text-xs"
      >
        <Btn label="굵게" on={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </Btn>
        <Btn label="기울임" on={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </Btn>
        <Sep />
        <Btn label="제목 2" on={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn label="제목 3" on={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Sep />
        <Btn label="글머리 목록" on={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </Btn>
        <Btn label="번호 목록" on={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </Btn>
        <Sep />
        <Btn label="링크" on={editor.isActive("link")} onClick={setLink}>
          Link
        </Btn>
        <Btn label="이미지 삽입" on={false} onClick={pickImage} disabled={uploading}>
          {uploading ? "올리는 중…" : "Image"}
        </Btn>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFile}
        tabIndex={-1}
        aria-hidden="true"
      />

      {err && (
        <div
          role="alert"
          className="border-t-2 border-ink bg-neon-soft px-4 py-2 font-mono text-xs text-ink"
        >
          {err}
        </div>
      )}
    </div>
  );
}

function Btn({
  children,
  onClick,
  on,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  on: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={on}
      className={`px-2 py-1 border-2 border-ink transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
        on ? "bg-neon" : "bg-paper hover:bg-neon-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px bg-ink/30" />;
}
