import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { harReelMaaling } from "@/lib/leadStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function plusDage(dagStr: string, antal: number): string {
  const d = new Date(dagStr + "T00:00:00");
  d.setDate(d.getDate() + antal);
  return d.toISOString().slice(0, 10);
}

// FASE 5 (§6.4/§6.6/§10.7): "Kør aftenafstemning" - manuel proces,
// starter altid fra installatoerens TENTATIVE-liste for i morgen (aldrig
// fra "hvad blev faerdigt i produktion i dag").
//
// For hver tentativ aftale i morgen: tjek om den bagvedliggende
// kendsgerning er sand. Er den det -> CONFIRMED, tid laases. Er den
// ikke -> flyt aftalen (+1 dag, forbliver TENTATIVE), og alt andet
// tentativt booket paa samme ressource fra og med i morgen rykkes
// tilsvarende (samme mekanisme, parametriseret paa ressource, jf. §6.6).
export async function POST() {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;

  const imorgen = plusDage(new Date().toISOString().slice(0, 10), 1);

  const kandidater = await prisma.appointment.findMany({
    where: { status: "TENTATIVE", day: imorgen, type: { not: null } },
    include: { lead: { include: { measurements: true } }, order: true }
  });

  const resultat: { id: string; type: string; customer: string; udfald: "CONFIRMED" | "FLYTTET"; nyDag?: string }[] = [];
  const beroerteRessourcer = new Set<string>();

  for (const a of kandidater) {
    let faktumSandt = false;
    // §6.4: kendsgerningen for MAALING er at der reelt er taget maal
    // (mindst een linje med baade width/height) - IKKE at aftalen blot er
    // booket, som altid ville vaere sandt (jf. leadStatus.ts §3.2-moenster).
    if (a.type === "INSTALLATION") faktumSandt = !!a.order?.readyAt;
    else if (a.type === "MAALING") faktumSandt = !!a.lead && harReelMaaling(a.lead.measurements);

    if (faktumSandt) {
      await prisma.appointment.update({ where: { id: a.id }, data: { status: "CONFIRMED" } });
      resultat.push({ id: a.id, type: a.type!, customer: a.customer, udfald: "CONFIRMED" });
    } else {
      const nyDag = plusDage(a.day, 1);
      await prisma.appointment.update({ where: { id: a.id }, data: { day: nyDag } });
      resultat.push({ id: a.id, type: a.type!, customer: a.customer, udfald: "FLYTTET", nyDag });
      if (a.resource) beroerteRessourcer.add(a.resource);
    }
  }

  // §6.6: forskyd alt andet tentativt bagved paa samme ressource +1 dag,
  // saa rækkefølgen mellem de resterende aftaler bevares.
  let forskudte = 0;
  for (const resource of beroerteRessourcer) {
    const bagved = await prisma.appointment.findMany({
      where: {
        status: "TENTATIVE",
        resource: resource as any,
        day: { gte: imorgen },
        id: { notIn: kandidater.map((k: any) => k.id) }
      }
    });
    for (const b of bagved) {
      await prisma.appointment.update({ where: { id: b.id }, data: { day: plusDage(b.day, 1) } });
      forskudte++;
    }
  }

  return NextResponse.json({ dag: imorgen, antalTjekket: kandidater.length, resultat, antalForskudteBagved: forskudte });
}
