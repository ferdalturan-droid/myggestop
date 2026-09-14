import MineOpgaver from "@/components/admin/MineOpgaver";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// RUNDE 8 (delta §1): omdøbt fra /admin/produktion-installation - én
// fanebladsside for Installatør (I dag/Opmålinger/Installationer/
// Produktion) og Bygger (I dag/Produktion). Se MineOpgaver.tsx.
export default async function Page() {
  const session = await getSession();
  return <MineOpgaver role={session?.role} />;
}
