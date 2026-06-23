// src/app/code/games/farm/new/page.tsx
// 새 농장 생성 화면 — 서버 컴포넌트, 인증 체크 후 UI 렌더.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewFarmPage from "@/components/code/games/farm/NewFarmPage";

export const metadata = {
  title: "새 농장 — INDEX·404",
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/code/games/farm/new");

  return <NewFarmPage />;
}