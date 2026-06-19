// src/app/drawings/oc/[id]/page.tsx
// Character detail route. Deep-linked from the 전광판 select screen
// (router.push(`/drawings/oc/${id}`)). The [id] just sets the initially-active
// character; the codex's own roster handles switching from there.

import OCCodexPage from "@/components/drawings/oc/codex/OCCodexPage";

export const metadata = {
  title: "OC · 설정도감",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OCCodexPage initialId={id} />;
}
