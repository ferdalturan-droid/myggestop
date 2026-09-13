"use client";
import { useEffect, useState } from "react";
import { TUR_OPTIONS, SYS_OPTIONS, TIP_OPTIONS, LAYOUT_OPTIONS, KANAT_OPTIONS, felterRelevanteForTur } from "@/lib/calcOptions";

const BLANK_M = { roomName: "", tur: "SINEKLIK", sys: "1,9", tip: "TEK", model: "YANA", kanat: "HAREKETLI", adet: "1", colorName: "", comment: "" };
const BLANK_QUICK = { firstName: "", lastName: "", phone: "", address: "", postalCode: "", city: "", productSummary: "", quotePriceDkk: "" };

// RUNDE 2 (§11.3): denne liste er Installatørens EGEN, selvstændige
// arbejdsflade til opmåling - han har (bevidst) ikke adgang til den fulde
// Lead-detaljeside (roles.ts giver ham kun /admin/opmaaling, ikke
// /admin/leads), saa al måletagning - inkl. de samme beregner-felter som
// Produktionsberegneren bruger (tur/sys/tip/layout/kanat/adet), tilføjelse
// af nye linjer og den afsluttende "Markér opmåling færdig" - skal kunne
// klares direkte herfra, uden at skulle igennem en side han ikke maa se.
export default function OpmaalingList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [newMByLead, setNewMByLead] = useState<Record<string, any>>({});
  const [showQuick, setShowQuick] = useState(false);
  const [quick, setQuick] = useState({ ...BLANK_QUICK });
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

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

  function newMFor(leadId: string) {
    return newMByLead[leadId] || BLANK_M;
  }
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
  async function markerOpmaalingFaerdig(leadId: string) {
    await fetch(`/api/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ measuredAt: true }) });
    setMsg("Markeret opmålt ✓"); setTimeout(() => setMsg(null), 2000);
    load();
  }

  // RUNDE 2 (§11.5): Installatøren har (bevidst) ikke adgang til
  // /admin/leads, saa hans egen genvej til "kend allerede prisen, bekræft
  // med det samme" - fx en aftale indgået paa staedet hos kunden - skal
  // ligge her, paa hans egen forside. bekraeftNu:true opretter leadet
  // direkte som Bekræftet, hvilket forfremmer det til en ordre i samme
  // kald (§11.6) - den nye ordre dukker op i Ordrer/Produktionskø, ikke
  // her (denne liste viser kun OPMAALING_BOOKET).
  async function quickSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuickError(null);
    if (!quick.quotePriceDkk) { setQuickError("Angiv en pris for at bekræfte leadet med det samme."); return; }
    setQuickSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quick, source: "Installatør", bekraeftNu: true })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke oprette lead.");
      setQuick({ ...BLANK_QUICK });
      setShowQuick(false);
      setMsg(`Lead ${d.lead.leadNumber} oprettet og bekræftet ✓`); setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setQuickError(err.message);
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Opmålingsliste</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Leads der venter på opmåling. Udfyld felterne og mål når du er hos kunden, og markér opmåling færdig til sidst.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQuick((v) => !v)} className="btn-primary py-2 text-sm">{showQuick ? "Luk" : "+ Nyt bekræftet lead"}</button>
          <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
        </div>
      </div>

      {showQuick && (
        <form onSubmit={quickSubmit} className="mb-6 grid gap-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs text-brand-ink2/55">Til brug når aftale og pris allerede er på plads (fx hos kunden) - opretter og bekræfter leadet med det samme, som automatisk bliver til en ordre (§11.5/§11.6).</p>
          <div><label className="label">Fornavn *</label><input className="input" required value={quick.firstName} onChange={(e) => setQuick({ ...quick, firstName: e.target.value })} /></div>
          <div><label className="label">Efternavn *</label><input className="input" required value={quick.lastName} onChange={(e) => setQuick({ ...quick, lastName: e.target.value })} /></div>
          <div><label className="label">Telefon *</label><input className="input" required value={quick.phone} onChange={(e) => setQuick({ ...quick, phone: e.target.value })} /></div>
          <div><label className="label">Pris i kr. *</label><input className="input" type="number" required value={quick.quotePriceDkk} onChange={(e) => setQuick({ ...quick, quotePriceDkk: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Adresse</label><input className="input" value={quick.address} onChange={(e) => setQuick({ ...quick, address: e.target.value })} /></div>
          <div><label className="label">Postnummer</label><input className="input" value={quick.postalCode} onChange={(e) => setQuick({ ...quick, postalCode: e.target.value })} /></div>
          <div><label className="label">By</label><input className="input" value={quick.city} onChange={(e) => setQuick({ ...quick, city: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Hvad ønsker kunden?</label><input className="input" value={quick.productSummary} onChange={(e) => setQuick({ ...quick, productSummary: e.target.value })} placeholder="F.eks. 3 myggenet, 1 plisségardin" /></div>
          {quickError && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{quickError}</p>}
          <button disabled={quickSaving} className="btn-primary sm:col-span-2 disabled:opacity-60">{quickSaving ? "Opretter..." : "Opret og bekræft lead"}</button>
        </form>
      )}

      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}
      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && leads.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen opmålinger at udføre lige nu.</div>}
      <div className="space-y-4">
        {leads.map((l) => {
          const done = !!l.measuredAt; // RUNDE 2 (§11.2): eksplicit signering, ikke udfyldte tal
          const nm = newMFor(l.id);
          return (
            <div key={l.id} className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-brand-ink">{l.leadNumber} · {l.firstName} {l.lastName}</span>
                  <span className="ml-2 text-sm text-brand-ink2/55">{l.phone} · {l.address}, {l.postalCode} {l.city}</span>
                </div>
                {done ? (
                  <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-greendark">Opmålt {new Date(l.measuredAt).toLocaleDateString("da-DK")}</span>
                ) : (
                  <button onClick={() => markerOpmaalingFaerdig(l.id)} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">
                    Markér opmåling færdig
                  </button>
                )}
              </div>
              {l.note && <p className="mb-3 text-sm italic text-brand-ink2/60">"{l.note}"</p>}
              {l.expectedMeasuringWeekLabel && !l.measuredAt && (
                <p className="mb-3 text-xs text-brand-ink2/55">Uge-estimat givet til kunden: <b>{l.expectedMeasuringWeekLabel}</b></p>
              )}

              <div className="space-y-2">
                {(l.measurements || []).map((m: any) => {
                  const rel = felterRelevanteForTur(m.tur || "SINEKLIK");
                  return (
                    <div key={m.id} className="grid grid-cols-2 gap-2 rounded-lg bg-brand-mist/50 p-3 text-sm sm:grid-cols-9 sm:items-center">
                      <span className="font-semibold text-brand-ink">#{m.itemNumber} {m.roomName || "—"}</span>
                      <select className="input py-1" defaultValue={m.tur || "SINEKLIK"} onChange={(e) => opdaterMaal(l.id, m.id, { tur: e.target.value })}>
                        {TUR_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
                      </select>
                      {rel.sys && <select className="input py-1" defaultValue={m.sys || "1,9"} onChange={(e) => opdaterMaal(l.id, m.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>}
                      {rel.tip && <select className="input py-1" defaultValue={m.tip || "TEK"} onChange={(e) => opdaterMaal(l.id, m.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                      {rel.layout && <select className="input py-1" defaultValue={m.layout || "YANA"} onChange={(e) => opdaterMaal(l.id, m.id, { layout: e.target.value })}>{LAYOUT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                      {rel.kanat && <select className="input py-1" defaultValue={m.kanat || "HAREKETLI"} onChange={(e) => opdaterMaal(l.id, m.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                      <input className="input py-1" placeholder="Antal" defaultValue={m.adet ?? 1} onBlur={(e) => opdaterMaal(l.id, m.id, { adet: Number(e.target.value) || 1 })} />
                      <input className="input py-1" placeholder="Bredde mm" defaultValue={m.widthMm ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { widthMm: e.target.value })} />
                      <input className="input py-1" placeholder="Højde mm" defaultValue={m.heightMm ?? ""} onBlur={(e) => opdaterMaal(l.id, m.id, { heightMm: e.target.value })} />
                      <button onClick={() => sletMaal(l.id, m.id)} className="text-right text-red-400 hover:text-red-600">Slet</button>
                    </div>
                  );
                })}
                {(!l.measurements || l.measurements.length === 0) && <p className="text-sm text-brand-ink2/55">Ingen forventede linjer oprettet endnu.</p>}
              </div>

              <form onSubmit={(e) => tilfoejMaal(l.id, e)} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-9">
                <input className="input" placeholder="Rum" value={nm.roomName} onChange={(e) => setNewMFor(l.id, { roomName: e.target.value })} />
                <select className="input" value={nm.tur} onChange={(e) => setNewMFor(l.id, { tur: e.target.value })}>
                  {TUR_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
                </select>
                {felterRelevanteForTur(nm.tur).sys && <select className="input" value={nm.sys} onChange={(e) => setNewMFor(l.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>}
                {felterRelevanteForTur(nm.tur).tip && <select className="input" value={nm.tip} onChange={(e) => setNewMFor(l.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                {felterRelevanteForTur(nm.tur).layout && <select className="input" value={nm.model} onChange={(e) => setNewMFor(l.id, { model: e.target.value })}>{LAYOUT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                {felterRelevanteForTur(nm.tur).kanat && <select className="input" value={nm.kanat} onChange={(e) => setNewMFor(l.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}</select>}
                <input className="input" placeholder="Antal" value={nm.adet} onChange={(e) => setNewMFor(l.id, { adet: e.target.value.replace(/[^0-9]/g, "") })} />
                <input className="input" placeholder="Farve" value={nm.colorName} onChange={(e) => setNewMFor(l.id, { colorName: e.target.value })} />
                <input className="input" placeholder="Kommentar" value={nm.comment} onChange={(e) => setNewMFor(l.id, { comment: e.target.value })} />
                <button className="btn-secondary text-sm">+ Tilføj linje</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
