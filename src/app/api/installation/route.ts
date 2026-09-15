import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 4 (§4): installationsliste - Orders hvor readyAt != null og
// installedAt == null.
// RUNDE 6 (§"listen ordre klar til at blive installeret skal vises i den
// rigtige sekvens"): "rigtig sekvens" er den dag Koordinator faktisk har
// booket installationen til i kalenderen ("de følger deres kalender som
// koordinator planlægger") - IKKE bare hvornår den blev klar i produktion.
// Ordrer der endnu ikke er booket vises til sidst (aeldste-klar foerst),
// saa Installatøren tydeligt ser hvad der mangler at blive booket.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  // RUNDE 10 (§L - "hele 'installering'-processen skal kun være en del af
  // processen hvis montering er bestilt"): en ordre uden montering følger
  // Koordinators "afhentet/fragtet"-spor (§9), ikke Installatørens liste -
  // uden dette filter kunne en ikke-monteret, men "klar"-markeret ordre
  // fejlagtigt dukke op her, som om Installatøren skulle tage sig af den.
  const orders = await prisma.order.findMany({
    where: { readyAt: { not: null }, installedAt: null, wantsInstallation: true },
    include: {
      items: true,
      appointments: { where: { type: "INSTALLATION" }, orderBy: { day: "asc" }, take: 1, include: { assignedUser: { select: { name: true } } } }
    },
    orderBy: { readyAt: "asc" }
  });
  const sorted = [...orders].sort((a: any, b: any) => {
    const da = a.appointments[0]?.day, db = b.appointments[0]?.day;
    if (da && db) return da < db ? -1 : da > db ? 1 : 0;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime();
  });
  return NextResponse.json({ orders: sorted });
}
