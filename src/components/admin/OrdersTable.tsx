"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDKK } from "@/lib/pricing";
import { deriveOrderStageLabel } from "@/lib/orderStage";

// RUNDE 2 (§12.1): filter/farver bygger nu paa den reelle produktions-
// pipeline (OrderStage + readyAt/installedAt), ikke den gamle frie
// OrderStatus, som ikke laengere afspejler hvor en ordre reelt er.
const STAGE_COLOR: Record<string, string> = {
  "I kø": "bg-blue-100 text-blue-700",
  "I produktion": "bg-amber-100 text-amber-700",
  Klar: "bg-violet-100 text-violet-700",
  Installeret: "bg-teal-100 text-teal-700",
  Betalt: "bg-green-100 text-green-700",
  Anmeldt: "bg-green-100 text-green-700"
};

const BLANK_MANUAL = { firstName: "", lastName: "", phone: "", address: "", postalCode: "", city: "", productSummary: "", quotePriceDkk: "" };

// RUNDE 6 (§"koordinator kan se alle ordre og deres states, og kan
// filtrere"): "Klar"/"Installeret" er afledte visninger (readyAt/
// installedAt), ikke rigtige OrderStage-værdier i databasen (jf.
// orderStage.ts) - de kan derfor ikke sendes som ?stage= til API'et.
// Løsningen: hent med stage=I_PRODUKTION og filtrer resten client-side,
// præcis som deriveOrderStageLabel allerede definerer dem.
const STAGE_FILTER_OPTIONS: [string, string][] = [
  ["KOE", "I kø"],
  ["I_PRODUKTION", "I produktion"],
  ["KLAR", "Klar"],
  ["INSTALLERET", "Installeret"],
  ["BETALT", "Betalt"],
  ["ANMELDT", "Anmeldt"]
];

export default function OrdersTable({ role }: { role?: string } = {}) {
  const erKoordinator = role === "COORDINATOR";
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ ...BLANK_MANUAL });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualMsg, setManualMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    // KLAR/INSTALLERET er pseudo-stadier (se STAGE_FILTER_OPTIONS) - de
    // findes begge inde i den rigtige I_PRODUKTION-stadie.
    if (stage && stage !== "KLAR" && stage !== "INSTALLERET") params.set("stage", stage);
    else if (stage === "KLAR" || stage === "INSTALLERET") params.set("stage", "I_PRODUKTION");
    const res = await fetch("/api/orders?" + params.toString());
    const d = await res.json();
    let list: any[] = d.orders || [];
    if (stage === "KLAR") list = list.filter((o) => o.readyAt && !o.installedAt);
    else if (stage === "INSTALLERET") list = list.filter((o) => o.installedAt);
    setOrders(list);
    setLoading(false);
  }, [q, stage]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function melding(t: string | null) { if (t) { setActionMsg(t); setTimeout(() => setActionMsg(null), 2500); } }

  // RUNDE 6: samme handlinger som den tidligere separate "Ordrestatus"-
  // side (Runde 4 §G6) - nu foldet ind her, saa Koordinator kun har ÉT
  // sted at holde styr på ordre-status. Kun synligt/virksomt for Koordinator.
  async function saetStage(id: string, next: string, tekst: string) {
    if (!confirm(`${tekst}?`)) return;
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: next }) });
    if (res.ok) melding("Gemt ✓"); else { const d = await res.json().catch(() => ({})); melding(d.error || "Kunne ikke gemme."); }
    load();
  }
  async function fortryd(id: string, felt: "start" | "klar" | "installeret", tekst: string) {
    if (!confirm(`Fortryd ${tekst}? Brug kun dette ved en fejlregistrering.`)) return;
    const path = felt === "installeret" ? `/api/installation/${id}/installeret` : `/api/produktion/${id}/${felt}`;
    const res = await fetch(path, { method: "DELETE" });
    if (res.ok) melding("Fortrudt ✓"); else { const d = await res.json().catch(() => ({})); melding(d.error || "Kunne ikke fortryde."); }
    load();
  }

  async function del(id: string, orderNumber: string) {
    if (!confirm(`Slet ordre ${orderNumber}? Dette kan ikke fortrydes.`)) return;
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Kunne ikke slette ordren.");
  }

  // RUNDE 3: den ENESTE knap i systemet der kan oprette en kunde/ordre
  // uden om hele lead-processen (§"det skal bare være muligt at oprette en
  // kunde... hvor man kan oprette en kunde manuelt og bypasse den proces...
  // knappen skal være på siden hvor ordre oprettes/detaljer angives -
  // kun på 1 side"). Ligger bevidst her og INGEN andre steder (fjernet fra
  // Opmålingslisten). Genbruger under motorhjelmen det allerede byggede
  // bekraeftNu-flow (§11.5/Gruppe 1/3) - der findes stadig aldrig en Order
  // uden et Lead bagved (§3.3's invariant).
  async function opretManuel(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    if (!manual.quotePriceDkk) { setManualError("Angiv en pris."); return; }
    setManualSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...manual, source: "Manuel", bekraeftNu: true })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke oprette ordren.");
      setManual({ ...BLANK_MANUAL });
      setShowManual(false);
      setManualMsg(`Ordre ${d.lead.leadNumber} oprettet ✓`); setTimeout(() => setManualMsg(null), 3000);
      load();
    } catch (err: any) {
      setManualError(err.message);
    } finally {
      setManualSaving(false);
    }
  }

  function exportCsv() {
    const headers = ["Ordrenr", "Dato", "Navn", "Email", "Telefon", "By", "Postnr", "Montering", "Produktionsstadie", "Estimeret total"];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString("da-DK"),
      `${o.firstName} ${o.lastName}`,
      o.email,
      o.phone,
      o.city,
      o.postalCode,
      o.wantsInstallation ? "Ja" : "Nej",
      deriveOrderStageLabel({ stage: o.stage, readyAt: o.readyAt, installedAt: o.installedAt }),
      String(o.estimatedTotal).replace(".", ",")
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myggestop-ordrer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Sog ordrenr, navn, email, by..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input max-w-[200px]" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">Alle stadier</option>
          {STAGE_FILTER_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button onClick={() => setShowManual((v) => !v)} className="btn-primary ml-auto py-2.5 text-sm">{showManual ? "Luk" : "+ Ny ordre (manuel)"}</button>
        <button onClick={exportCsv} className="btn-ghost py-2.5 text-sm">Eksporter CSV</button>
      </div>

      {manualMsg && <p className="mb-4 text-sm font-medium text-brand-greendark">{manualMsg}</p>}
      {actionMsg && <p className="mb-4 text-sm font-medium text-brand-greendark">{actionMsg}</p>}

      {showManual && (
        <form onSubmit={opretManuel} className="mb-6 grid gap-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs text-brand-ink2/55">Til en kunde der ikke skal igennem den normale lead-proces (fx en ven der ringer direkte) - opretter en bekræftet ordre med det samme.</p>
          <div><label className="label">Fornavn *</label><input className="input" required value={manual.firstName} onChange={(e) => setManual({ ...manual, firstName: e.target.value })} /></div>
          <div><label className="label">Efternavn *</label><input className="input" required value={manual.lastName} onChange={(e) => setManual({ ...manual, lastName: e.target.value })} /></div>
          <div><label className="label">Telefon *</label><input className="input" required value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} /></div>
          <div><label className="label">Pris i kr. *</label><input className="input" type="number" required value={manual.quotePriceDkk} onChange={(e) => setManual({ ...manual, quotePriceDkk: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Adresse</label><input className="input" value={manual.address} onChange={(e) => setManual({ ...manual, address: e.target.value })} /></div>
          <div><label className="label">Postnummer</label><input className="input" value={manual.postalCode} onChange={(e) => setManual({ ...manual, postalCode: e.target.value })} /></div>
          <div><label className="label">By</label><input className="input" value={manual.city} onChange={(e) => setManual({ ...manual, city: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Hvad ønsker kunden?</label><input className="input" value={manual.productSummary} onChange={(e) => setManual({ ...manual, productSummary: e.target.value })} placeholder="F.eks. 3 myggenet, 1 plisségardin" /></div>
          {manualError && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{manualError}</p>}
          <button disabled={manualSaving} className="btn-primary sm:col-span-2 disabled:opacity-60">{manualSaving ? "Opretter..." : "Opret ordre"}</button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl2 border border-brand-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60">
                <th className="px-4 py-3">Ordrenr</th>
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Produkter</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Produktionsstadie</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-ink2/50">Indlaeser...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-ink2/50">Ingen ordrer fundet.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-mist/50">
                    <td className="px-4 py-3 font-semibold text-brand-ink">
                      <Link href={`/admin/ordrer/${o.id}`} className="hover:text-brand-blue">{o.orderNumber}</Link>
                      <div className="text-xs font-normal text-brand-ink2/50">{new Date(o.createdAt).toLocaleDateString("da-DK")}</div>
                    </td>
                    <td className="px-4 py-3">{o.firstName} {o.lastName}<div className="text-xs text-brand-ink2/50">{o.email}</div></td>
                    <td className="px-4 py-3">{o.city}</td>
                    <td className="px-4 py-3">{o.items.filter((it: any) => it.productName === "Montering" || it.productName === "Rabat" || !(it.widthMm === 0 && it.heightMm === 0)).length}</td>
                    <td className="px-4 py-3 font-semibold">{formatDKK(o.estimatedTotal)}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const label = deriveOrderStageLabel({ stage: o.stage, readyAt: o.readyAt, installedAt: o.installedAt });
                        return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_COLOR[label] || "bg-brand-mist text-brand-ink2"}`}>{label}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* RUNDE 6 (§G7, tidl. "Ordrestatus"-siden, Runde 4 §G6): kun
                            Koordinator ser/kan bruge disse - fortryd ved fejl, og
                            markér betalt/anmeldt, direkte fra overblikket. */}
                        {erKoordinator && o.productionStartedAt && !o.readyAt && (
                          <button onClick={() => fortryd(o.id, "start", "'i gang'")} className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Fortryd i gang</button>
                        )}
                        {erKoordinator && o.readyAt && !o.installedAt && (
                          <button onClick={() => fortryd(o.id, "klar", "'klar'")} className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Fortryd klar</button>
                        )}
                        {erKoordinator && o.installedAt && o.stage === "I_PRODUKTION" && (
                          <button onClick={() => fortryd(o.id, "installeret", "'installeret'")} className="rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Fortryd installeret</button>
                        )}
                        {erKoordinator && o.stage === "I_PRODUKTION" && o.installedAt && (
                          <button onClick={() => saetStage(o.id, "BETALT", "Markér ordren som betalt")} className="rounded-full border border-brand-greendark px-2.5 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Markér betalt</button>
                        )}
                        {erKoordinator && o.stage === "BETALT" && (
                          <button onClick={() => saetStage(o.id, "ANMELDT", "Markér ordren som anmeldt")} className="rounded-full border border-brand-greendark px-2.5 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Markér anmeldt</button>
                        )}
                        <Link href={`/admin/ordrer/${o.id}`} className="text-sm font-semibold text-brand-blue hover:underline">Åbn</Link>
                        {erKoordinator && <button onClick={() => del(o.id, o.orderNumber)} className="text-sm font-semibold text-red-500 hover:text-red-700">Slet</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
