"use client";
import { useEffect, useState } from "react";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, deriveLeadStatusLabel } from "@/lib/leadStatus";
import { TUR_OPTIONS, TUR_LABEL, SYS_OPTIONS, TIP_OPTIONS, LAYOUT_OPTIONS, KANAT_OPTIONS, felterRelevanteForTur } from "@/lib/calcOptions";
import { LEAD_SOURCE_LABEL } from "@/lib/leadSource";

const BLANK_M = { roomName: "", tur: "SINEKLIK", sys: "1,9", tip: "TEK", model: "YANA", kanat: "HAREKETLI", adet: "1", colorName: "", comment: "" };

export default function LeadDetail({ id }: { id: string }) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [newM, setNewM] = useState<any>(BLANK_M);
  const [uge, setUge] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (res.ok) {
        setLead(d.lead);
        setQuote(d.lead.quotePriceDkk != null ? String(d.lead.quotePriceDkk) : "");
        setUge(d.lead.expectedMeasuringWeekLabel || "");
      }
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function patch(data: any) {
    setError(null);
    const res = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const d = await res.json();
    if (!res.ok) { setError(d.error || "Kunne ikke gemme."); return; }
    // RUNDE 2 (§11.6): et stadieskifte til BEKRAEFTET kan have forfremmet
    // leadet i samme kald - genindlaes altid fuldt, saa order-relationen
    // (og evt. fejl) altid afspejles med det samme.
    await load();
    setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 1800);
  }

  async function saetStage(stage: string) { await patch({ stage }); }
  async function gemTilbud() { await patch({ quotePriceDkk: Number(quote) || 0 }); }
  async function markerOpmaalingFaerdig() { await patch({ measuredAt: true }); }
  async function gemUgeEstimat() { await patch({ expectedMeasuringWeekLabel: uge }); }

  async function tilfoejMaal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/leads/${id}/measurements`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      // RUNDE 4 (§G3): productType er et VISNINGSNAVN ("Myggenet"), ikke den
      // interne "tur"-kode ("SINEKLIK") - ellers lækker den tyrkiske
      // interne værdi ud som produktnavn på ordren, når leadet forfremmes
      // (promoteLead.ts læser netop dette felt).
      body: JSON.stringify({ ...newM, productType: TUR_LABEL[newM.tur] || newM.tur, adet: Number(newM.adet) || 1 })
    });
    if (res.ok) { setNewM(BLANK_M); load(); }
  }

  async function opdaterMaal(measurementId: string, data: any) {
    await fetch(`/api/leads/${id}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }
  async function sletMaal(measurementId: string) {
    await fetch(`/api/leads/${id}/measurements/${measurementId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-brand-ink2/60">Indlæser...</p>;
  if (!lead) return <p className="text-red-600">Lead ikke fundet.</p>;

  const stageIdx = LEAD_STAGE_ORDER.indexOf(lead.stage);
  const maalingAppt = (lead.appointments || []).find((a: any) => a.type === "MAALING");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">{lead.leadNumber} · {lead.firstName} {lead.lastName}</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">{deriveLeadStatusLabel(lead.stage, lead.measuredAt)} · Kilde: {LEAD_SOURCE_LABEL[lead.source] || lead.source || "-"}</p>
        </div>
        {lead.order && <a href={`/admin/ordrer/${lead.order.id}`} className="btn-secondary py-2 text-sm">Se ordre {lead.order.orderNumber} →</a>}
      </div>

      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Stadie-progression */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl2 border border-brand-line bg-white p-4 shadow-card">
        {LEAD_STAGE_ORDER.map((s, i) => (
          <button
            key={s}
            onClick={() => saetStage(s)}
            disabled={!!lead.order}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              i <= stageIdx ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"
            }`}
          >
            {LEAD_STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kundeoplysninger */}
        <div className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-brand-ink">Kundeoplysninger</h2>
          <div className="mt-3 space-y-1 text-sm text-brand-ink2/80">
            <p>{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</p>
            <p>{lead.address}{lead.address ? ", " : ""}{lead.postalCode} {lead.city}</p>
            {lead.productSummary && <p className="mt-2"><span className="font-semibold text-brand-ink">Ønsker:</span> {lead.productSummary}</p>}
            {lead.note && <p className="mt-2 whitespace-pre-wrap"><span className="font-semibold text-brand-ink">Note:</span> {lead.note}</p>}
          </div>
        </div>

        {/* Tilbud - forfremmelse sker nu automatisk (§11.6) */}
        <div className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-brand-ink">Tilbud</h2>
          <div className="mt-3 flex items-center gap-2">
            <input className="input" type="number" placeholder="Pris i kr." value={quote} onChange={(e) => setQuote(e.target.value)} disabled={!!lead.order} />
            <button onClick={gemTilbud} disabled={!!lead.order} className="btn-secondary py-2 text-sm disabled:opacity-40">Gem pris</button>
          </div>
          <div className="mt-5 border-t border-brand-line pt-4">
            {lead.order ? (
              <p className="text-sm text-brand-ink2/70">Forfremmet automatisk til ordre <strong>{lead.order.orderNumber}</strong> da leadet blev bekræftet.</p>
            ) : (
              <p className="text-xs text-brand-ink2/55">Når leadet markeres <b>Bekræftet</b> ovenfor, oprettes ordren automatisk med det samme — intet ekstra klik nødvendigt.</p>
            )}
          </div>
        </div>
      </div>

      {/* Opmålingsaftale - to-trins flow, §6.2 */}
      <div className="mb-6 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-brand-ink">Opmåling</h2>
          {lead.stage === "OPMAALING_BOOKET" && !lead.measuredAt && (
            <button onClick={markerOpmaalingFaerdig} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">
              Markér opmåling færdig
            </button>
          )}
          {lead.measuredAt && <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-greendark">Opmålt {new Date(lead.measuredAt).toLocaleDateString("da-DK")}</span>}
        </div>

        {/* RUNDE 8 ("Calendar... can only be created directly from
            calendar, i dont want any ui possiblity to auto-create as it
            confuses"): denne side viser nu KUN den eksisterende aftale
            (hvis en findes) - opret/rediger den fra Kalender-siden, søg på
            leadnummeret der for at koble den til dette lead. */}
        {maalingAppt ? (
          <p className="mt-2 text-sm text-brand-ink2/80">{maalingAppt.day}{maalingAppt.time ? ` kl. ${maalingAppt.time}` : ""} — {maalingAppt.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}{maalingAppt.assignedUser ? ` · ${maalingAppt.assignedUser.name}` : ""}</p>
        ) : lead.expectedMeasuringWeekLabel ? (
          <p className="mt-2 text-sm text-brand-ink2/70">Uge-estimat givet til kunden: <b>{lead.expectedMeasuringWeekLabel}</b> — ingen konkret tid booket endnu. Book den fra Kalender-siden, når den er fundet.</p>
        ) : (
          <p className="mt-2 text-sm text-brand-ink2/55">Ingen aftale eller uge-estimat endnu. Book den fra Kalender-siden (søg på {lead.leadNumber}).</p>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block flex-1"><span className="label">Uge-estimat til kunden (valgfrit, hvis kalenderen er presset)</span><input className="input py-2 text-sm" placeholder="fx Uge 39" value={uge} onChange={(e) => setUge(e.target.value)} /></label>
          <button onClick={gemUgeEstimat} className="btn-secondary py-2.5 text-sm">Gem estimat</button>
          <a href="/admin/kalender" className="btn-primary py-2.5 text-sm">Gå til Kalender for at booke →</a>
        </div>
      </div>

      {/* Måletagning - fulde beregner-felter, §11.3 */}
      <div className="mt-6 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
        <h2 className="font-bold text-brand-ink">Mål (forventede / reelle)</h2>
        <p className="mt-1 text-xs text-brand-ink2/55">Opret forventede linjer uden mål når opmåling bookes — udfyld bredde/højde når det reelle mål findes. Kun en eksplicit "Markér opmåling færdig" ovenfor gør leadet Opmålt.</p>

        <div className="mt-4 space-y-2">
          {(lead.measurements || []).map((m: any) => {
            const rel = felterRelevanteForTur(m.tur || "SINEKLIK");
            return (
              <div key={m.id} className="grid grid-cols-2 gap-2 rounded-lg bg-brand-mist/50 p-3 text-sm sm:grid-cols-9 sm:items-center">
                <span className="font-semibold text-brand-ink">#{m.itemNumber} {m.roomName}</span>
                <select className="input py-1" defaultValue={m.tur || "SINEKLIK"} onChange={(e) => opdaterMaal(m.id, { tur: e.target.value })}>
                  {TUR_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {rel.sys && <select className="input py-1" defaultValue={m.sys || "1,9"} onChange={(e) => opdaterMaal(m.id, { sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>}
                {rel.tip && <select className="input py-1" defaultValue={m.tip || "TEK"} onChange={(e) => opdaterMaal(m.id, { tip: e.target.value })}>{TIP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
                {rel.layout && <select className="input py-1" defaultValue={m.layout || "YANA"} onChange={(e) => opdaterMaal(m.id, { layout: e.target.value })}>{LAYOUT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
                {rel.kanat && <select className="input py-1" defaultValue={m.kanat || "HAREKETLI"} onChange={(e) => opdaterMaal(m.id, { kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
                <input className="input py-1" placeholder="Antal" defaultValue={m.adet ?? 1} onBlur={(e) => opdaterMaal(m.id, { adet: Number(e.target.value) || 1 })} />
                <input className="input py-1" placeholder="Bredde mm" defaultValue={m.widthMm ?? ""} onBlur={(e) => opdaterMaal(m.id, { widthMm: e.target.value })} />
                <input className="input py-1" placeholder="Højde mm" defaultValue={m.heightMm ?? ""} onBlur={(e) => opdaterMaal(m.id, { heightMm: e.target.value })} />
                <button onClick={() => sletMaal(m.id)} className="text-right text-red-400 hover:text-red-600">Slet</button>
              </div>
            );
          })}
          {(!lead.measurements || lead.measurements.length === 0) && <p className="text-sm text-brand-ink2/55">Ingen linjer endnu.</p>}
        </div>

        <form onSubmit={tilfoejMaal} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-9">
          <input className="input" placeholder="Rum" value={newM.roomName} onChange={(e) => setNewM({ ...newM, roomName: e.target.value })} />
          <select className="input" value={newM.tur} onChange={(e) => setNewM({ ...newM, tur: e.target.value })}>
            {TUR_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {felterRelevanteForTur(newM.tur).sys && <select className="input" value={newM.sys} onChange={(e) => setNewM({ ...newM, sys: e.target.value })}>{SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select>}
          {felterRelevanteForTur(newM.tur).tip && <select className="input" value={newM.tip} onChange={(e) => setNewM({ ...newM, tip: e.target.value })}>{TIP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
          {felterRelevanteForTur(newM.tur).layout && <select className="input" value={newM.model} onChange={(e) => setNewM({ ...newM, model: e.target.value })}>{LAYOUT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
          {felterRelevanteForTur(newM.tur).kanat && <select className="input" value={newM.kanat} onChange={(e) => setNewM({ ...newM, kanat: e.target.value })}>{KANAT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
          <input className="input" placeholder="Antal" value={newM.adet} onChange={(e) => setNewM({ ...newM, adet: e.target.value.replace(/[^0-9]/g, "") })} />
          <input className="input" placeholder="Farve" value={newM.colorName} onChange={(e) => setNewM({ ...newM, colorName: e.target.value })} />
          <input className="input" placeholder="Kommentar" value={newM.comment} onChange={(e) => setNewM({ ...newM, comment: e.target.value })} />
          <button className="btn-secondary text-sm">+ Tilføj linje</button>
        </form>
      </div>
    </div>
  );
}
