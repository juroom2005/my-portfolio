// src/app/code/games/farm/[saveId]/page.tsx
//
// 농장 본 화면 — 서버 컴포넌트.
// 인증 체크 + 데이터 fetch 만 하고, 실제 UI 는 FarmInteriorPage 가 그린다.

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFarmInterior } from "@/lib/farm/farmInterior";
import FarmInteriorPage from "@/components/code/games/farm/FarmInteriorPage";

export const metadata = { title: "농장 — INDEX·404" };

export default async function Page({
  params,
}: {
  params: Promise<{ saveId: string }>;
}) {
  const { saveId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/code/games/farm/${saveId}`);

  const data = await getFarmInterior(saveId);
  if (!data) notFound();
  if (!data.save.is_active) notFound();

  return (
    <FarmInteriorPage
      save={data.save}
      rooms={data.rooms}
      roomAnimals={data.roomAnimals}
      nurseryAnimals={data.nurseryAnimals}
    />
  );
}