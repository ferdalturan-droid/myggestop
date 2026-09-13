import ProduktionList from "@/components/admin/ProduktionList";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await getSession();
  return <ProduktionList role={session?.role} />;
}
