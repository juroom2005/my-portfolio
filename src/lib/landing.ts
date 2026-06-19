import { createClient } from "@/lib/supabase/server";

export type CellVariant =
  | "draw" | "photo" | "journal" | "notes"
  | "sound" | "bookmarks" | "code" | "inbox";

export type CategoryWithCount = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  display_no: string | null;
  sort_order: number;
  cell_variant: CellVariant | null;
  count: number;
};

/**
 * 활성 카테고리 목록 + 각 카테고리의 공개 아이템 개수를 한 번에 가져온다.
 * 비공개(is_published=false) 글도 보고 싶으면 RLS가 알아서 본인 글까지 포함시켜줌.
 */
export async function getLandingData(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();

  // 카테고리 목록과 count를 한 번에 가져오기 (Postgres 함수로 묶음)
  const [catRes, countRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name_ko, name_en, display_no, sort_order, cell_variant")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.rpc("category_counts"),
  ]);

  if (catRes.error) {
    console.error("[getLandingData] categories error:", catRes.error);
    return [];
  }
  if (countRes.error) {
    console.error("[getLandingData] counts rpc error:", countRes.error);
    // count 못 받아오면 0으로라도 카테고리는 보여주기
  }

  const categories = catRes.data ?? [];
  const countMap = new Map<string, number>(
    (countRes.data ?? []).map((row: { id: string; count: number }) => [row.id, Number(row.count)])
  );

  return categories.map((cat) => ({
    ...cat,
    cell_variant: cat.cell_variant as CellVariant | null,
    count: countMap.get(cat.id) ?? 0,
  }));
}