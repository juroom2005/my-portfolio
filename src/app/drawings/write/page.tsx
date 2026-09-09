// src/app/drawings/write/page.tsx
// 그림 게시판 작성 화면 — 서버 컴포넌트, 인증 체크 후 폼 렌더.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WritePageClient from "@/components/drawings/editor/WritePageClient";

export const metadata = {
  title: "새 글 — 그림",
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/drawings/write");

  return <WritePageClient />;
}
