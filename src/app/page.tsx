import IndexLanding from "@/components/landing/IndexLanding";
import { getLandingData } from "@/lib/landing";

export default async function Home() {
  const categories = await getLandingData();
  return <IndexLanding categories={categories} />;
}