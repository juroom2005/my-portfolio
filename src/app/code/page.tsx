// src/app/code/page.tsx
// '코드' 진입 라우트 (/code). CodeCell 클릭 → 여기로 이동.

import CodeArcadePage from "@/components/code/CodeArcadePage";

export const metadata = {
  title: "코드 · 웹게임",
};

export default function Page() {
  return <CodeArcadePage />;
}
