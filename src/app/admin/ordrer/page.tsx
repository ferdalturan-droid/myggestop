import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import OrdersTable from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

// RUNDE 6 (§"1. Koordinator overview - koordinator kan se alle ordre og
// deres states, og kan filtrere. Dem de selv skal tage action på kan de
// se meget tydeligt"): denne side ER nu Koordinatorens samlede
// ordre-overblik - den tidligere separate "Ordrestatus"-side (Runde 4
// §G6) er foldet ind her, saa der kun findes ÉT sted at se alle ordrer,
// filtrere, og handle. "Kræver din handling" er en pinned sektion
// øverst, samme forespørgsler som dashboardets (admin/page.tsx) - bevidst
// duplikeret data, ikke duplikeret sandhed: dashboardet er et hurtigt
// snapshot ved login, denne side er det egentlige arbejdsredskab.
export default async function AdminOrders() {
  const session = await getSession();
  const [opmaalteLeads, klarTilInstallation] = await Promise.all([
    prisma.lead.findMany({ where: { stage: "OPMAALING_BOOKET", measuredAt: { not: null } }, orderBy: { measuredAt: "desc" }, take: 10 }),
    prisma.order.findMany({ where: { stage: "I_PRODUKTION", readyAt: { not: null }, installedAt: null }, orderBy: { readyAt: "asc" }, take: 10 })
  ]);
  const harHandling = opmaalteLeads.length > 0 || klarTilInstallation.length > 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Ordre-overblik</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Alle ordrer og deres status. Søg, filtrer, eksporter og administrer.</p>

      {harHandling && (
        <div className="mb-8 rounded-xl2 border border-amber-300 bg-amber-50 shadow-card">
          <div className="border-b border-amber-200 px-6 py-4">
            <h2 className="font-bold text-amber-900">Kræver din handling</h2>
            <p className="mt-0.5 text-sm text-amber-800/70">Installatør/Bygger har gjort noget - tag stilling til næste skridt.</p>
          </div>
          <div className="divide-y divide-amber-200">
            {opmaalteLeads.map((l: any) => (
              <Link key={l.id} href={`/admin/leads/${l.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/50">
                <div>
                  <p className="font-semibold text-brand-ink">{l.leadNumber} · {l.firstName} {l.lastName}</p>
                  <p className="text-sm text-brand-ink2/60">Opmålt {l.measuredAt ? new Date(l.measuredAt).toLocaleDateString("da-DK") : ""} · afventer at du opretter en ordre</p>
                </div>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">Opmålt</span>
              </Link>
            ))}
            {klarTilInstallation.map((o: any) => (
              <Link key={o.id} href={`/admin/ordrer/${o.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/50">
                <div>
                  <p className="font-semibold text-brand-ink">{o.orderNumber} · {o.firstName} {o.lastName}</p>
                  <p className="text-sm text-brand-ink2/60">Klar i produktion {o.readyAt ? new Date(o.readyAt).toLocaleDateString("da-DK") : ""} · afventer booking af installation</p>
                </div>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">Klar</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <OrdersTable role={session?.role} />
    </div>
  );
}
