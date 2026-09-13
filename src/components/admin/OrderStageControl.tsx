"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STAGE_LABELS, deriveOrderStageLabel } from "@/lib/orderStage";

const STAGES = ["KOE", "I_PRODUKTION", "BETALT", "ANMELDT"];

export default function OrderStageControl({
  orderId, stage, readyAt, installedAt
}: { orderId: string; stage: string; readyAt: string | null; installedAt: string | null }) {
  const router = useRouter();
  const [s, setS] = useState(stage);
  const [ready, setReady] = useState(readyAt);
  const [installed, setInstalled] = useState(installedAt);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saetStage(next: string) {
    setSaving(true);
    setS(next);
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: next }) });
    setSaving(false);
    setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 1800);
    router.refresh();
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

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-ink2">Produktionsstadie</label>
      <select className="input" value={s} disabled={saving} onChange={(e) => saetStage(e.target.value)}>
        {STAGES.map((st) => <option key={st} value={st}>{ORDER_STAGE_LABELS[st]}</option>)}
      </select>
      <p className="mt-1 text-xs text-brand-ink2/55">Vises som: <strong>{deriveOrderStageLabel({ stage: s, readyAt: ready, installedAt: installed })}</strong></p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={markerKlar} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${ready ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
          {ready ? `Klar ✓ (${new Date(ready).toLocaleDateString("da-DK")})` : "Marker Klar"}
        </button>
        <button onClick={markerInstalleret} disabled={!ready} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${installed ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>
          {installed ? `Installeret ✓ (${new Date(installed).toLocaleDateString("da-DK")})` : "Marker Installeret"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm font-medium text-brand-greendark">{msg}</p>}
    </div>
  );
}
