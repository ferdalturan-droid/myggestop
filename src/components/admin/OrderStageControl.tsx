"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deriveOrderStageLabel } from "@/lib/orderStage";

// RUNDE 2 (Q4/§6.5/§6.7): KOE -> I_PRODUKTION er en BEVIDST koordinator-
// handling ("Send til produktion"), ikke automatik og ikke et frit
// dropdown-valg - det er en menneskelig kalendervurdering (er der plads?),
// modsat Bekræftet->Order som er et udledeligt faktum (§11.6). Klar/
// Installeret er FORTSAT rene datoer, aldrig et stadie-valg (§6.3,
// uændret). Betalt/Anmeldt er Coordinators afsluttende handlinger.
export default function OrderStageControl({
  orderId, stage, readyAt, installedAt
}: { orderId: string; stage: string; readyAt: string | null; installedAt: string | null }) {
  const router = useRouter();
  const [s, setS] = useState(stage);
  const [ready, setReady] = useState(readyAt);
  const [installed, setInstalled] = useState(installedAt);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [estDato, setEstDato] = useState("");
  const [estUge, setEstUge] = useState("");

  async function saetStage(next: string, extra: any = {}) {
    setSaving(true);
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: next, ...extra }) });
    setSaving(false);
    if (res.ok) { setS(next); setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 1800); router.refresh(); }
  }

  async function markerKlar() {
    const res = await fetch(`/api/produktion/${orderId}/klar`, { method: ready ? "DELETE" : "POST" });
    const d = await res.json();
    if (res.ok) { setReady(ready ? null : d.order.readyAt); router.refresh(); }
  }
  async function markerInstalleret() {
    const res = await fetch(`/api/installation/${orderId}/installeret`, { method: installed ? "DELETE" : "POST" });
    const d = await res.json();
    if (res.ok) { setInstalled(installed ? null : d.order.installedAt); router.refresh(); }
  }

  const visning = deriveOrderStageLabel({ stage: s, readyAt: ready, installedAt: installed });

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-ink2">Produktionsstadie</label>
      <p className="mb-3 text-base font-bold text-brand-ink">{visning}</p>

      {s === "KOE" && (
        <div className="rounded-lg border border-dashed border-brand-line bg-brand-mist/30 p-3">
          <p className="mb-2 text-xs text-brand-ink2/60">Ordren ligger i køen (backlog). Send den til produktion når byggeren har plads (§6.5/§6.7 — book aldrig mere end ca. 2 uger frem).</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block"><span className="label">Forventet klar-dato</span><input type="date" className="input py-1.5 text-sm" value={estDato} onChange={(e) => setEstDato(e.target.value)} /></label>
            <label className="block"><span className="label">— eller uge-estimat</span><input className="input py-1.5 text-sm" placeholder="fx Uge 41" value={estUge} onChange={(e) => setEstUge(e.target.value)} /></label>
            <button
              disabled={saving}
              onClick={() => saetStage("I_PRODUKTION", { estReadyDate: estDato || undefined, estReadyWeekLabel: estDato ? undefined : (estUge || undefined) })}
              className="btn-primary py-2 text-sm disabled:opacity-50"
            >
              Send til produktion
            </button>
          </div>
        </div>
      )}

      {s === "I_PRODUKTION" && (
        <div className="flex flex-wrap gap-2">
          <button onClick={markerKlar} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${ready ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
            {ready ? `Klar ✓ (${new Date(ready).toLocaleDateString("da-DK")})` : "Marker Klar"}
          </button>
          <button onClick={markerInstalleret} disabled={!ready} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${installed ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
            {installed ? `Installeret ✓ (${new Date(installed).toLocaleDateString("da-DK")})` : "Marker Installeret"}
          </button>
        </div>
      )}

      {(s === "I_PRODUKTION" || s === "BETALT" || s === "ANMELDT") && installed && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-line pt-3">
          <button disabled={saving || s !== "I_PRODUKTION"} onClick={() => saetStage("BETALT")} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${s === "BETALT" || s === "ANMELDT" ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
            {s === "BETALT" || s === "ANMELDT" ? "Betalt ✓" : "Markér betalt"}
          </button>
          <button disabled={saving || s !== "BETALT"} onClick={() => saetStage("ANMELDT")} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${s === "ANMELDT" ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
            {s === "ANMELDT" ? "Anmeldt ✓" : "Markér anmeldt"}
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-sm font-medium text-brand-greendark">{msg}</p>}
    </div>
  );
}
