"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deriveOrderStageLabel } from "@/lib/orderStage";

// RUNDE 4 (§G6): Koordinatorens ENE samlede sted til at vedligeholde
// ordre-status, i stedet for at skulle besøge samme sider som Bygger/
// Installatør for at gøre det. Handlingerne her er en delmængde af de
// samme API-kald som OrderStageControl.tsx/ProduktionList.tsx bruger -
// samme sandhedskilde, blot samlet ét sted til overblik + rettelser.
const TABS = [
  { key: "I_PRODUKTION", label: "I produktion" },
  { key: "BETALT", label: "Betalt" },
  { key: "ANMELDT", label: "Anmeldt" },
  { key: "ALLE", label: "Alle (ekskl. kø)" }
];

export default function OrdrestatusList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("I_PRODUKTION");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const d = await res.json();
      setOrders((d.orders || []).filter((o: any) => o.stage !== "KOE"));
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const viste = useMemo(() => (tab === "ALLE" ? orders : orders.filter((o) => o.stage === tab)), [orders, tab]);

  function melding(t: string | null) { if (t) { setMsg(t); setTimeout(() => setMsg(null), 2500); } }

  async function saetStage(id: string, stage: string, tekst: string) {
    if (!confirm(`${tekst}?`)) return;
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
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

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-brand-ink">Ordrestatus</h1>
      <p className="mt-1 text-sm text-brand-ink2/65">Kun Koordinator. Markér betalt/anmeldt, og fortryd i-gang/klar/installeret ved fejlregistreringer.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>{t.label}</button>
        ))}
      </div>

      {msg && <p className="mt-3 text-sm font-medium text-brand-greendark">{msg}</p>}
      {loading && <p className="mt-4 text-brand-ink2/60">Indlæser...</p>}
      {!loading && viste.length === 0 && <div className="mt-4 rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen ordrer i denne visning.</div>}

      <div className="mt-4 space-y-2">
        {viste.map((o) => (
          <div key={o.id} className="rounded-xl border border-brand-line bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/admin/ordrer/${o.id}`} className="font-semibold text-brand-ink hover:text-brand-blue">{o.orderNumber}</Link>
                <span className="ml-2 text-brand-ink2/60">{o.firstName} {o.lastName} · {o.city}</span>
              </div>
              <span className="rounded-full bg-brand-mist px-2.5 py-1 text-xs font-semibold text-brand-ink2">
                {deriveOrderStageLabel({ stage: o.stage, readyAt: o.readyAt, installedAt: o.installedAt })}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-line pt-3">
              {o.productionStartedAt && (
                <button onClick={() => fortryd(o.id, "start", "'i gang'")} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Fortryd i gang</button>
              )}
              {o.readyAt && (
                <button onClick={() => fortryd(o.id, "klar", "'klar'")} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Fortryd klar</button>
              )}
              {o.installedAt && (
                <button onClick={() => fortryd(o.id, "installeret", "'installeret'")} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Fortryd installeret</button>
              )}
              {o.stage === "I_PRODUKTION" && o.installedAt && (
                <button onClick={() => saetStage(o.id, "BETALT", "Markér ordren som betalt")} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Markér betalt</button>
              )}
              {o.stage === "BETALT" && (
                <button onClick={() => saetStage(o.id, "ANMELDT", "Markér ordren som anmeldt")} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Markér anmeldt</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
