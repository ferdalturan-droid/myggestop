"use client";
import { useEffect, useState } from "react";
import { TUR_OPTIONS, SYS_OPTIONS, TIP_OPTIONS, LAYOUT_OPTIONS, KANAT_OPTIONS, felterRelevanteForTur } from "@/lib/calcOptions";

const BLANK_M = { roomName: "", tur: "SINEKLIK", sys: "1,9", tip: "TEK", model: "YANA", kanat: "HAREKETLI", adet: "1", colorName: "", comment: "" };

// RUNDE 3: redesignet til et rigtigt tabellayout med kolonneoverskrifter
// (den tidligere version var en umaerket grid af felter - svaer at
// gennemskue). "+ Nyt bekræftet lead" er FJERNET herfra (leads hoerer
// udelukkende til Coordinator, og "opret kunde manuelt" bor nu ét sted:
// Ordre-siden, jf. Gruppe C). Installatøren har (bevidst) ikke adgang til
// den fulde Lead-detaljeside, saa al måletagning sker direkte her.
export default function OpmaalingList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newMByLead, setNewMByLead] = useState<Record<string, any>>({});
  const [savingDone, setSavingDone] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/opmaaling", { cache: "no-store" });
      const d = await res.json();
      setLeads(d.leads || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function newMFor(leadId: string) { return newMByLead[leadId] || BLANK_M; }
  function setNewMFor(leadId: string, patch: any) {
    setNewMByLead((prev) => ({ ...prev, [leadId]: { ...(prev[leadId] || BLANK_M), ...patch } }));
  }

  async function opdaterMaal(leadId: string, measurementId: string, data: any) {
    await fetch(`/api/leads/${leadId}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }
  async function sletMaal(leadId: string, measurementId: string) {
    await fetch(`/api/leads/${leadId}/measurements/${measurementId}`, { method: "DELETE" });
    load();
  }
  async function tilfoejMaal(leadId: string, e: React.FormEvent) {
    e.preventDefault();
    const m = newMFor(leadId);
    const res = await fetch(`/api/leads/${leadId}/measurements`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, productType: m.tur, adet: Number(m.adet) || 1 })
    });
    if (res.ok) { setNewMByLead((prev) => ({ ...prev, [leadId]: BLANK_M })); load(); }
  }

  // RUNDE 3: rettet reel bug - knappen kaldte foer et endpoint der stille
  // afviste Installer (403), uden nogen synlig fejl ("der sker intet").
  // Roden er rettet i API'et; her tilfoejes desuden en synlig fejlmelding
  // hvis noget alligevel skulle fejle igen, i stedet for tavshed.
  async function markerOpmaalingFaerdig(leadId: string) {
    setSavingDone(leadId);
    setErr(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ measuredAt: true }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Kunne ikke markere opmålingen som færdig.");
      }
      setMsg("Opmåling markeret færdig ✓ — flyttet videre til Koordinator"); setTimeout(() => setMsg(null), 3000);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSavingDone(null);
    }
  }

  const COLS = ["Type", "System", "Fløjtype", "Retning", "Fløj", "Antal", "Bredde (mm)", "Højde (mm)", "Farve", ""];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Opmålingsliste</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Dine aktive opmålinger. Udfyld mål hos kunden, og markér færdig når du er klar — den forsvinder så herfra.</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-brand-green/10 px-3 py-2 text-sm font-medium text-brand-greendark">{msg}</p>}
      {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{err}</p>}

      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && leads.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-10 text-center text-brand-ink2/60">Ingen opmålinger at udføre lige nu. 🎉</div>}

      <div className="space-y-4">
        {leads.map((l) => {
          const nm = newMFor(l.id);
          return (
            <div key={l.id} className="overflow-hidden rounded-xl2 border border-brand-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line bg-brand-mist/40 px-5 py-3.5">
                <div>
                  <p className="font-bold text-brand-ink">{l.leadNumber} · {l.firstName} {l.lastName}</p>
                  <p className="mt-0.5 text-sm text-brand-ink2/60">{l.phone} · {l.address}, {l.postalCode} {l.city}</p>
                </div>
                <button
                  onClick={() => markerOpmaalingFaerdig(l.id)}
                  disabled={savingDone === l.id}
                  className="btn-primary py-2 text-sm disabled:opacity-60"
                >
                  {savingDone === l.id ? "Gemmer..." : "✓ Markér opmåling færdig"}
                </button>
              </div>

              {(l.note || l.expectedMeasuringWeekLabel) && (
                <div className="border-b border-brand-line px-5 py-2.5 text-sm text-brand-ink2/70">
                  {l.expectedMeasuringWeekLabel && <span className="mr-3">Uge-estimat: <b>{l.expectedMeasuringWeekLabel}</b></span>}
                  {l.note && <span className="italic">"{l.note}"</span>}
                </div>
              )}

              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-brand-ink2/45">
                      {COLS.map((c) => <th key={c} className="pb-1.5 pr-2 font-semibold">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(l.measurements || []).map((m: any) => {
                      const rel = felterRelevanteForTur(m.tur || "SINEKLIK");
                      return (
                        <tr key={m.id} className="border-t border-brand-line/60">
                          <td className="py-1.5 pr-2"><select className="input py-1 text-sm" defaultValue={m.tur || "SINEKLIK"} onChange={(e) => opdaterMaal(l.id, m.id, { tur: e.target.value })}>{TUR_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select></td>
                          <td className="py-1.5 pr-2">{rel.sys ? <select className="input py-1 text-sm" defaultValue={m.sys || "1,9"} onChange={(e) => opdaterMaal(l.id, m.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select> : <span className="text-brand-ink2/30">—</span>}</td>
                          <td className="py-1.5 pr-2">{rel.tip ? <select className="input py-1 text-sm" defaultValue={m.tip || "TEK"} onChange={(e) => opdaterMaal(l.id, m.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select> : <span className="text-brand-ink2/30">—</span>}</td>
                          <td className="py-1.5 pr-2">{rel.layout ? <select className="input py-1 text-sm" defaultValue={m.layout || "YANA"} onChange={(e) => opdaterMaal(l.id, m.id, { layout: e.target.value })}>{LAYOUT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select> : <span className="text-brand-ink2/30">—</span>}</td>
                          <td className="py-1.5 pr-2">{rel.kanat ? <select className="input py-1 text-sm" defaultValue={m.kanat || "HAREKETLI"} onChange={(e) => opdaterMaal(l.id, m.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select> : <span className="text-brand-ink2/30">—</span>}</td>
                          <td className="py-1.5 pr-2 w-16"><input className="input py-1 text-sm" defaultValue={m.adet ?? 1} onBlur={(e) => opdaterMaal(l.id, m.id, { adet: Number(e.target.value) || 1 })} /></td>
                          <td className="py-1.5 pr-2 w-24"><input className="input py-1 text-sm" placeholder="mm" defaultValue={m.widthMm ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { widthMm: e.target.value })} /></td>
                          <td className="py-1.5 pr-2 w-24"><input className="input py-1 text-sm" placeholder="mm" defaultValue={m.heightMm ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { heightMm: e.target.value })} /></td>
                          <td className="py-1.5 pr-2 w-28"><input className="input py-1 text-sm" placeholder="Farve" defaultValue={m.colorName ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { colorName: e.target.value })} /></td>
                          <td className="py-1.5 text-right"><button onClick={() => sletMaal(l.id, m.id)} className="text-red-400 hover:text-red-600">✕</button></td>
                        </tr>
                      );
                    })}
                    {(!l.measurements || l.measurements.length === 0) && (
                      <tr><td colSpan={COLS.length} className="py-3 text-sm text-brand-ink2/50">Ingen linjer endnu — tilføj den første nedenfor.</td></tr>
                    )}
                  </tbody>
                </table>

                <form onSubmit={(e) => tilfoejMaal(l.id, e)} className="mt-3 flex flex-wrap items-end gap-2 border-t border-dashed border-brand-line pt-3">
                  <input className="input w-32" placeholder="Rum" value={nm.roomName} onChange={(e) => setNewMFor(l.id, { roomName: e.target.value })} />
                  <select className="input w-36" value={nm.tur} onChange={(e) => setNewMFor(l.id, { tur: e.target.value })}>{TUR_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                  {felterRelevanteForTur(nm.tur).sys && <select className="input w-24" value={nm.sys} onChange={(e) => setNewMFor(l.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>}
                  {felterRelevanteForTur(nm.tur).tip && <select className="input w-28" value={nm.tip} onChange={(e) => setNewMFor(l.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                  {felterRelevanteForTur(nm.tur).layout && <select className="input w-24" value={nm.model} onChange={(e) => setNewMFor(l.id, { model: e.target.value })}>{LAYOUT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                  {felterRelevanteForTur(nm.tur).kanat && <select className="input w-28" value={nm.kanat} onChange={(e) => setNewMFor(l.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                  <input className="input w-16" placeholder="Antal" value={nm.adet} onChange={(e) => setNewMFor(l.id, { adet: e.target.value.replace(/[^0-9]/g, "") })} />
                  <input className="input w-28" placeholder="Farve" value={nm.colorName} onChange={(e) => setNewMFor(l.id, { colorName: e.target.value })} />
                  <input className="input w-36" placeholder="Kommentar" value={nm.comment} onChange={(e) => setNewMFor(l.id, { comment: e.target.value })} />
                  <button className="btn-secondary text-sm">+ Tilføj linje</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
