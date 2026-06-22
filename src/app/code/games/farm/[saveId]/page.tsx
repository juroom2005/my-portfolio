// src/app/code/games/farm/[saveId]/page.tsx
// 농장 본 화면 (단면도) — 3단계에서 구현. 현재는 세이브 정보만 노출하는 스텁.

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSave } from "@/lib/farm/saves";

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

  const save = await getSave(saveId);
  if (!save) notFound();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FAFAF7",
        color: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 32,
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{save.farm_name}</h1>
      <p style={{ opacity: 0.6, fontSize: 14 }}>— {save.character_name}</p>
      <pre
        style={{
          marginTop: 24,
          padding: 18,
          background: "#ECEAE2",
          fontSize: 11,
          maxWidth: 720,
          width: "100%",
          overflow: "auto",
        }}
      >
        {JSON.stringify(save, null, 2)}
      </pre>
      <p style={{ opacity: 0.5, fontSize: 12, marginTop: 12 }}>3단계에서 단면도 + 시간 시스템을 구현합니다.</p>
      <a
        href="/code/games/farm"
        style={{
          marginTop: 16,
          padding: "8px 16px",
          border: "1px solid #0A0A0A",
          fontSize: 12,
          letterSpacing: "0.2em",
          textDecoration: "none",
          color: "#0A0A0A",
        }}
      >
        ← BACK TO SAVES
      </a>
    </div>
  );
}