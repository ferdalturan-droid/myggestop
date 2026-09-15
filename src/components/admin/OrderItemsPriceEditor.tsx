"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDKK } from "@/lib/pricing";

// RUNDE 10 (§M - "hvis det er en ordre gennem lead, er prisen defineret
// allerede under lead-fasen... og derfor skal derefter være fast. Det skal
// dog være muligt at fjerne produkter og ændre pris efterfølgende af
// installatør og koordinator i tilfælde af at kunden senere brokker sig og
// vi går på kompromis med kunden ift prisen"): en BEVIDST let editor, kun
// for det scenarie - fjerne en linje, eller justere dens pris, som et
// senere kompromis med kunden. Den rører ALDRIG Lead.measurements
// (sandhedskilden for selve produktionen/skærelisten, jf. promoteLead.ts's
// kommentarer) - kun den her SNAPSHOT-visning (Order.items) som allerede
// var det, "Produkter"-kortet på ordre-siden viser. Vil man rette et
// reelt mål (ikke bare prisen), er det stadig Produktionsberegneren
// (linket ovenfor), som opdaterer den egentlige sandhed.
interface Item {
  id: string;
  roomName: string;
  productName: string;
  widthMm: number;
  heightMm: number;
  colorName: string;
  comment: string;
  areaSqm: number;
  lineTotal: number;
  isDoubleDoor?: boolean;
}

export default function OrderItemsPriceEditor({ orderId, items }: { orderId: string; items: Item[] }) {
  const router = useRouter();
  // Gebyr-/rabatlinjer (Montering, Rabat - 0×0 mm) er bevidst UDENFOR denne
  // editor - de styres andre steder (montering af wantsInstallation-valget,
  // rabat af lead-fasen) og skal ikke kunne slettes ved en fejl her.
  const redigerbare = items.filter((it) => !(it.widthMm === 0 && it.heightMm === 0));
  const [rows, setRows] = useState(redigerbare.map((it) => ({ ...it, fjernet: false })));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const uaendret = rows.every((r) => !r.fjernet) && rows.every((r, i) => r.lineTotal === redigerbare[i]?.lineTotal);
  const nyTotal = rows.filter((r) => !r.fjernet).reduce((s, r) => s + (Number(r.lineTotal) || 0), 0);

  function saetPris(id: string, val: string) {
    const num = parseFloat(val.replace(",", ".")) || 0;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, lineTotal: num } : r)));
  }
  function toggleFjern(id: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, fjernet: !r.fjernet } : r)));
  }

  async function gem() {
    if (!confirm("Gem ændringerne til produkter/pris på denne ordre? Brug kun dette ved et kompromis med kunden.")) return;
    setSaving(true);
    setErr(null);
    // Uændrede gebyr-/rabatlinjer (Montering/Rabat) sendes uændret med,
    // resten er de tilbageværende (ikke-fjernede), evt. prisjusterede linjer.
    const gebyrlinjer = items.filter((it) => it.widthMm === 0 && it.heightMm === 0);
    const nyeItems = [
      ...rows.filter((r) => !r.fjernet).map(({ fjernet, ...it }) => it),
      ...gebyrlinjer
    ];
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: nyeItems })
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2000);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Kunne ikke gemme ændringerne.");
    }
  }

  if (redigerbare.length === 0) return null;

  return (
    <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <h2 className="mb-1 font-bold text-brand-ink">Justér produkter/pris (kompromis)</h2>
      <p className="mb-4 text-sm text-brand-ink2/60">
        Prisen er allerede fastlagt fra lead-fasen. Brug KUN dette til at fjerne en linje eller justere en pris, hvis I senere går på kompromis med kunden — reelle mål/farver rettes stadig i Produktionsberegneren.
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm ${r.fjernet ? "border-red-200 bg-red-50/50 opacity-60" : "border-brand-line"}`}>
            <div>
              <span className="font-semibold text-brand-ink">{r.roomName || "—"} · {r.productName}</span>
              <span className="ml-2 text-xs text-brand-ink2/55">{r.widthMm} × {r.heightMm} mm{r.colorName ? ` · ${r.colorName}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-brand-ink2/60">
                Pris (kr)
                <input
                  className="input w-28 py-1.5 text-sm"
                  inputMode="decimal"
                  disabled={r.fjernet}
                  defaultValue={r.lineTotal}
                  onBlur={(e) => saetPris(r.id, e.target.value)}
                />
              </label>
              <button type="button" onClick={() => toggleFjern(r.id)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${r.fjernet ? "border-brand-greendark text-brand-greendark hover:bg-green-50" : "border-red-300 text-red-500 hover:bg-red-50"}`}>
                {r.fjernet ? "Fortryd" : "Fjern"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-brand-line pt-3 text-sm">
        <span className="font-semibold text-brand-ink">Ny produkttotal</span>
        <span className="font-bold text-brand-bluedark">{formatDKK(nyTotal)}</span>
      </div>
      {err && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      {msg && <p className="mt-2 text-sm font-medium text-brand-greendark">{msg}</p>}
      <button onClick={gem} disabled={saving || uaendret} className="btn-secondary mt-3 py-2 text-sm disabled:opacity-40">
        {saving ? "Gemmer..." : "Gem kompromis-ændring"}
      </button>
    </div>
  );
}
