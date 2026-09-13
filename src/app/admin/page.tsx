import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDKK } from "@/lib/pricing";
import { deriveOrderStageLabel } from "@/lib/orderStage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // RUNDE 2 (§12.1): KPI-kortene talte tidligere efter den gamle, frie
  // OrderStatus (NY/UNDER_BEHANDLING/AFSLUTTET) - et felt der reelt ikke
  // afspejler produktionspipelinen laengere (OrderStage gør). Tael derfor
  // efter stage i stedet, saa tallene stemmer overens med Produktionskø/
  // Installation/Ordrer-siderne.
  const [total, ikoe, iProduktion, afsluttet, recent, sum, nyeLeads, opmaalteLeads, klarTilInstallation, iGangHosBygger] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { stage: "KOE" } }),
    prisma.order.count({ where: { stage: "I_PRODUKTION" } }),
    prisma.order.count({ where: { stage: { in: ["BETALT", "ANMELDT"] } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
    prisma.order.aggregate({ _sum: { estimatedTotal: true } }),
    // FASE 3 (§10.6): siden webformularen nu opretter et Lead i stedet
    // for en Order, skal nye henvendelser vaere synlige et sted -
    // ellers overses de naar de forsvinder fra "Ordrer"-listen.
    prisma.lead.findMany({ where: { stage: "NYT_LEAD" }, orderBy: { createdAt: "desc" }, take: 8 }),
    // RUNDE 4 (§G9/Runde 3 §Gruppe F): "når en action er blevet gjort af
    // installator eller bygger skal det være nemt for koordinator at se
    // at der er sket noget... så han kan tage action på det" - opmålte
    // leads (measuredAt sat) er den ene deliberate beslutning Coordinator
    // aktivt skal tage (opret ordre), den flyttes IKKE automatisk (§Q4).
    prisma.lead.findMany({ where: { stage: "OPMAALING_BOOKET", measuredAt: { not: null } }, orderBy: { measuredAt: "desc" }, take: 8 }),
    // Klar i produktion, men endnu ikke installeret/afsluttet - Coordinator
    // skal aktivt beslutte/booke installation (endnu en deliberate transition).
    prisma.order.findMany({ where: { stage: "I_PRODUKTION", readyAt: { not: null }, installedAt: null }, orderBy: { readyAt: "asc" }, take: 8 }),
    // Rent informativt: Bygger er i gang, men endnu ikke klar - ingen
    // handling kræves endnu, men Coordinator kan se det sker noget.
    prisma.order.count({ where: { stage: "I_PRODUKTION", productionStartedAt: { not: null }, readyAt: null } })
  ]);

  const stats = [
    { label: "Ordrer i alt", value: total },
    { label: "I kø", value: ikoe },
    { label: "I produktion", value: iProduktion },
    { label: "Betalt & anmeldt", value: afsluttet }
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-ink">Oversigt</h1>
      <p className="mt-1 text-sm text-brand-ink2/65">Velkommen tilbage. Her er status pa din forretning.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
            <p className="text-sm text-brand-ink2/60">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-brand-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl2 bg-brand-ink p-5 text-white">
        <p className="text-sm text-slate-300">Samlet estimeret ordreværdi</p>
        <p className="mt-1 text-3xl font-extrabold text-brand-green">{formatDKK(sum._sum.estimatedTotal || 0)}</p>
      </div>

      {/* RUNDE 4 (§G9/Runde 3 §Gruppe F): tydelig synlighed for Coordinator
          naar Installatoer/Bygger har gjort noget der kraever en aktiv
          Coordinator-beslutning ("Kør bare på" er IKKE noget system her -
          det er bevidst deliberate transitions, jf. §Q4). Ligger oevers,
          foer "Nye leads", da disse typisk haster mere (kunden venter). */}
      {(opmaalteLeads.length > 0 || klarTilInstallation.length > 0 || iGangHosBygger > 0) && (
        <div className="mt-8 rounded-xl2 border border-amber-300 bg-amber-50 shadow-card">
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
            {iGangHosBygger > 0 && (
              <div className="flex items-center justify-between px-6 py-4">
                <p className="text-sm text-brand-ink2/70">{iGangHosBygger} ordre(r) er i gang hos byggeren lige nu (ingen handling krævet endnu)</p>
                <Link href="/admin/produktion" className="text-sm font-semibold text-brand-blue hover:underline">Se produktionskø</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {nyeLeads.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-brand-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
            <h2 className="font-bold text-brand-ink">Nye leads der venter ({nyeLeads.length})</h2>
            <Link href="/admin/leads" className="text-sm font-semibold text-brand-blue hover:underline">Se alle</Link>
          </div>
          <div className="divide-y divide-brand-line">
            {nyeLeads.map((l) => (
              <Link key={l.id} href={`/admin/leads/${l.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-brand-mist">
                <div>
                  <p className="font-semibold text-brand-ink">{l.leadNumber} · {l.firstName} {l.lastName}</p>
                  <p className="text-sm text-brand-ink2/60">{l.phone} · {l.source}{l.productSummary ? ` · ${l.productSummary}` : ""}</p>
                </div>
                <span className="rounded-full bg-brand-mist px-3 py-1 text-xs font-semibold text-brand-ink2">Nyt lead</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl2 border border-brand-line bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
          <h2 className="font-bold text-brand-ink">Seneste ordrer</h2>
          <Link href="/admin/ordrer" className="text-sm font-semibold text-brand-blue hover:underline">Se alle</Link>
        </div>
        <div className="divide-y divide-brand-line">
          {recent.length === 0 && <p className="px-6 py-8 text-center text-sm text-brand-ink2/60">Ingen ordrer endnu.</p>}
          {recent.map((o) => (
            <Link key={o.id} href={`/admin/ordrer/${o.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-brand-mist">
              <div>
                <p className="font-semibold text-brand-ink">{o.orderNumber} · {o.firstName} {o.lastName}</p>
                <p className="text-sm text-brand-ink2/60">{o.items.length} produkt(er) · {o.city}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-ink">{formatDKK(o.estimatedTotal)}</p>
                <p className="text-xs text-brand-ink2/60">{deriveOrderStageLabel({ stage: o.stage, readyAt: o.readyAt, installedAt: o.installedAt })}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
