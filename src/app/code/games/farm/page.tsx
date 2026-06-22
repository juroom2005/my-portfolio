// src/app/code/games/farm/page.tsx
//
// 농장 진입 화면 — 서버 컴포넌트.
// 인증 안 된 사용자는 /login 으로 리다이렉트.
// 인증된 사용자에겐 세이브 목록을 fetch 해서 클라이언트 컴포넌트로 전달.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMySavesWithStats } from "@/lib/farm/saves";
import FarmEntryPage from "@/components/code/games/farm/FarmEntryPage";

export const metadata = {
  title: "농장 — INDEX·404",
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/code/games/farm");
  }

  const saves = await getMySavesWithStats();

  return <FarmEntryPage saves={saves} />;
}