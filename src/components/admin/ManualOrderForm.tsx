"use client";
import { useState } from "react";
import { LEAD_SOURCE_MANUAL_OPTIONS } from "@/lib/leadSource";

const BLANK = { firstName: "", lastName: "", phone: "", address: "", postalCode: "", city: "", productSummary: "", quotePriceDkk: "", source: "PERSONLIG_KONTAKT" };

// RUNDE 3 (§"det skal bare være muligt at oprette en kunde... hvor man kan
// oprette en kunde manuelt og bypasse den proces"), justeret RUNDE 8 (bruger:
// "in case customer is a friend or someone off-cycle, it should be possible
// to add a order manually, and it should eventually feed into the same
// process, only coordinator and installer can add this by-pass manual
// entry"): udtrukket til en delt komponent, saa BÅDE Koordinators
// Ordre-side og Installatørens "Mine opgaver"-side kan bruge nøjagtig
// samme formular/logik - ingen dubleret kode, ingen risiko for at de to
// steder stille kommer til at gøre det forskelligt.
// Genbruger under motorhjelmen det allerede byggede bekraeftNu-flow
// (/api/leads, COORDINATOR+INSTALLER naar bekraeftNu=true) - der findes
// stadig aldrig en Order uden et Lead bagved (§3.3's invariant).
export default function ManualOrderForm({ onCreated }: { onCreated?: (leadNumber: string) => void }) {
  const [manual, setManual] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!manual.quotePriceDkk) { setError("Angiv en pris."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...manual, bekraeftNu: true })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke oprette ordren.");
      setManual({ ...BLANK });
      setMsg(`Ordre ${d.lead.leadNumber} oprettet ✓`);
      onCreated?.(d.lead.leadNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card sm:grid-cols-2">
      <p className="sm:col-span-2 text-xs text-brand-ink2/55">Til en kunde der ikke skal igennem den normale lead-proces (fx en ven der ringer direkte) — opretter en bekræftet ordre med det samme, som derefter følger den almindelige produktion/installation-proces.</p>
      <div><label className="label">Fornavn *</label><input className="input" required value={manual.firstName} onChange={(e) => setManual({ ...manual, firstName: e.target.value })} /></div>
      <div><label className="label">Efternavn *</label><input className="input" required value={manual.lastName} onChange={(e) => setManual({ ...manual, lastName: e.target.value })} /></div>
      <div><label className="label">Telefon *</label><input className="input" required value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} /></div>
      <div><label className="label">Pris i kr. *</label><input className="input" type="number" required value={manual.quotePriceDkk} onChange={(e) => setManual({ ...manual, quotePriceDkk: e.target.value })} /></div>
      <div className="sm:col-span-2"><label className="label">Adresse</label><input className="input" value={manual.address} onChange={(e) => setManual({ ...manual, address: e.target.value })} /></div>
      <div><label className="label">Postnummer</label><input className="input" value={manual.postalCode} onChange={(e) => setManual({ ...manual, postalCode: e.target.value })} /></div>
      <div><label className="label">By</label><input className="input" value={manual.city} onChange={(e) => setManual({ ...manual, city: e.target.value })} /></div>
      <div>
        <label className="label">Kilde</label>
        <select className="input" value={manual.source} onChange={(e) => setManual({ ...manual, source: e.target.value })}>
          {LEAD_SOURCE_MANUAL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2"><label className="label">Hvad ønsker kunden?</label><input className="input" value={manual.productSummary} onChange={(e) => setManual({ ...manual, productSummary: e.target.value })} placeholder="F.eks. 3 myggenet, 1 plisségardin" /></div>
      {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {msg && <p className="sm:col-span-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-brand-greendark">{msg}</p>}
      <button disabled={saving} className="btn-primary sm:col-span-2 disabled:opacity-60">{saving ? "Opretter..." : "Opret ordre"}</button>
    </form>
  );
}
