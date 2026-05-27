import IndexLanding from "@/components/landing/IndexLanding";
import { getLandingData } from "@/lib/landing";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const categories = await getLandingData();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = !!profile?.is_admin;
  }

  return (
    <IndexLanding
      categories={categories}
      user={user ? { email: user.email ?? "" } : null}
      isAdmin={isAdmin}
    />
  );
}