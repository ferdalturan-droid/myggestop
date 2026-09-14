"use client";
import { useEffect, useState } from "react";
import { TUR_OPTIONS, TUR_LABEL, SYS_OPTIONS, TIP_OPTIONS, LAYOUT_OPTIONS, KANAT_OPTIONS, felterRelevanteForTur } from "@/lib/calcOptions";

const BLANK_M = { roomName: "", tur: "SINEKLIK", sys: "1,9", tip: "TEK", model: "YANA", kanat: "HAREKETLI", adet: "1", colorName: "", comment: "" };

// RUNDE 9 ("de forme vi har... f.eks. oprette mål, tilføje mål... er meget
// grimt og ikke brugervenligt, lav fuldstændig om"): den tidligere tætte
// 9-kolonners tabel med umærkede felter er erstattet af et kort pr.
// måle-linje med tydeligt mærkede felter, samme mønster som de øvrige
// redesignede formularer i systemet (ManualOrderForm/OrderEditForm). Alle
// felter, værdier og API-kald er UÆNDREDE - kun layoutet er nyt.
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
      // RUNDE 4 (§G3): se samme kommentar i LeadDetail.tsx - gem visningsnavn, ikke den interne "tur"-kode.
      body: JSON.stringify({ ...m, productType: TUR_LABEL[m.tur] || m.tur, adet: Number(m.adet) || 1 })
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

  const lbl = "mb-0.5 block text-[11px] font-medium text-brand-ink2/60";

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
          const nmRel = felterRelevanteForTur(nm.tur);
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

              <div className="space-y-3 p-4">
                {(l.measurements || []).length === 0 && (
                  <p className="rounded-lg bg-brand-mist/30 px-4 py-3 text-sm text-brand-ink2/50">Ingen linjer endnu — tilføj den første nedenfor.</p>
                )}
                {(l.measurements || []).map((m: any, i: number) => {
                  const rel = felterRelevanteForTur(m.tur || "SINEKLIK");
                  return (
                    <div key={m.id} className="rounded-xl border border-brand-line p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-greendark">Linje {i + 1}{m.roomName ? ` · ${m.roomName}` : ""}</span>
                        <button onClick={() => sletMaal(l.id, m.id)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                        <label className="block"><span className={lbl}>Type</span>
                          <select className="input py-2 text-sm" defaultValue={m.tur || "SINEKLIK"} onChange={(e) => opdaterMaal(l.id, m.id, { tur: e.target.value })}>{TUR_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                        </label>
                        {rel.sys && <label className="block"><span className={lbl}>System</span>
                          <select className="input py-2 text-sm" defaultValue={m.sys || "1,9"} onChange={(e) => opdaterMaal(l.id, m.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                        </label>}
                        {rel.tip && <label className="block"><span className={lbl}>Fløjtype</span>
                          <select className="input py-2 text-sm" defaultValue={m.tip || "TEK"} onChange={(e) => opdaterMaal(l.id, m.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                        </label>}
                        {rel.layout && <label className="block"><span className={lbl}>Retning</span>
                          <select className="input py-2 text-sm" defaultValue={m.layout || "YANA"} onChange={(e) => opdaterMaal(l.id, m.id, { layout: e.target.value })}>{LAYOUT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                        </label>}
                        {rel.kanat && <label className="block"><span className={lbl}>Fløj</span>
                          <select className="input py-2 text-sm" defaultValue={m.kanat || "HAREKETLI"} onChange={(e) => opdaterMaal(l.id, m.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                        </label>}
                        <label className="block"><span className={lbl}>Antal</span><input className="input py-2 text-sm" defaultValue={m.adet ?? 1} onBlur={(e) => opdaterMaal(l.id, m.id, { adet: Number(e.target.value) || 1 })} /></label>
                        <label className="block"><span className={lbl}>Bredde (mm)</span><input className="input py-2 text-sm" placeholder="mm" defaultValue={m.widthMm ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { widthMm: e.target.value })} /></label>
                        <label className="block"><span className={lbl}>Højde (mm)</span><input className="input py-2 text-sm" placeholder="mm" defaultValue={m.heightMm ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { heightMm: e.target.value })} /></label>
                        <label className="block"><span className={lbl}>Farve</span><input className="input py-2 text-sm" placeholder="Standard" defaultValue={m.colorName ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { colorName: e.target.value })} /></label>
                      </div>
                    </div>
                  );
                })}

                <form onSubmit={(e) => tilfoejMaal(l.id, e)} className="rounded-xl border border-dashed border-brand-line p-3.5">
                  <p className="mb-2 text-sm font-bold text-brand-greendark">+ Ny linje</p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                    <label className="block"><span className={lbl}>Rum</span><input className="input py-2 text-sm" placeholder="F.eks. Stue" value={nm.roomName} onChange={(e) => setNewMFor(l.id, { roomName: e.target.value })} /></label>
                    <label className="block"><span className={lbl}>Type</span>
                      <select className="input py-2 text-sm" value={nm.tur} onChange={(e) => setNewMFor(l.id, { tur: e.target.value })}>{TUR_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                    </label>
                    {nmRel.sys && <label className="block"><span className={lbl}>System</span>
                      <select className="input py-2 text-sm" value={nm.sys} onChange={(e) => setNewMFor(l.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                    </label>}
                    {nmRel.tip && <label className="block"><span className={lbl}>Fløjtype</span>
                      <select className="input py-2 text-sm" value={nm.tip} onChange={(e) => setNewMFor(l.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                    </label>}
                    {nmRel.layout && <label className="block"><span className={lbl}>Retning</span>
                      <select className="input py-2 text-sm" value={nm.model} onChange={(e) => setNewMFor(l.id, { model: e.target.value })}>{LAYOUT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                    </label>}
                    {nmRel.kanat && <label className="block"><span className={lbl}>Fløj</span>
                      <select className="input py-2 text-sm" value={nm.kanat} onChange={(e) => setNewMFor(l.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>
                    </label>}
                    <label className="block"><span className={lbl}>Antal</span><input className="input py-2 text-sm" placeholder="1" value={nm.adet} onChange={(e) => setNewMFor(l.id, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                    <label className="block"><span className={lbl}>Farve</span><input className="input py-2 text-sm" placeholder="Standard" value={nm.colorName} onChange={(e) => setNewMFor(l.id, { colorName: e.target.value })} /></label>
                    <label className="block sm:col-span-2"><span className={lbl}>Kommentar</span><input className="input py-2 text-sm" value={nm.comment} onChange={(e) => setNewMFor(l.id, { comment: e.target.value })} /></label>
                  </div>
                  <button className="btn-secondary mt-3 w-full py-2 text-sm">+ Tilføj linje</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
