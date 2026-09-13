import KalenderList from "@/components/admin/KalenderList";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  const session = await getSession();
  return <KalenderList role={session?.role || "INSTALLER"} />;
}
