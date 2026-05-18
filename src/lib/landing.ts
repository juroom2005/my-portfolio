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

  // 1) 활성 카테고리 가져오기
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, slug, name_ko, name_en, display_no, sort_order, cell_variant")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (catErr) {
    console.error("[getLandingData] categories error:", catErr);
    return [];
  }
  if (!categories) return [];

  // 2) 각 카테고리별 count를 병렬로 가져오기
  //    Supabase의 head:true + count:'exact' 패턴 → 데이터는 안 받고 카운트만
  const counts = await Promise.all(
    categories.map(async (cat) => {
      const { count, error } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id);

      if (error) {
        console.error(`[getLandingData] count error for ${cat.slug}:`, error);
        return 0;
      }
      return count ?? 0;
    }),
  );

  return categories.map((cat, i) => ({
    ...cat,
    cell_variant: cat.cell_variant as CellVariant | null,
    count: counts[i],
  }));
}