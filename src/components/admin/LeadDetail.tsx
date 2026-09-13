"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, deriveLeadStatusLabel } from "@/lib/leadStatus";

export default function LeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [newM, setNewM] = useState({ roomName: "", productType: "", colorName: "", comment: "" });
  const [appt, setAppt] = useState({ day: "", time: "" });
  const [apptMsg, setApptMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (res.ok) {
        setLead(d.lead);
        setQuote(d.lead.quotePriceDkk != null ? String(d.lead.quotePriceDkk) : "");
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
    setLead((prev: any) => ({ ...prev, ...d.lead }));
    setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 1800);
  }

  async function saetStage(stage: string) { await patch({ stage }); }
  async function gemTilbud() { await patch({ quotePriceDkk: Number(quote) || 0 }); }

  async function tilfoejMaal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/leads/${id}/measurements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newM) });
    if (res.ok) { setNewM({ roomName: "", productType: "", colorName: "", comment: "" }); load(); }
  }

  async function opdaterMaal(measurementId: string, data: any) {
    await fetch(`/api/leads/${id}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }
  async function sletMaal(measurementId: string) {
    await fetch(`/api/leads/${id}/measurements/${measurementId}`, { method: "DELETE" });
    load();
  }

  async function bookOpmaaling(e: React.FormEvent) {
    e.preventDefault();
    setApptMsg(null);
    const res = await fetch(`/api/leads/${id}/measure-appointment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(appt) });
    const d = await res.json();
    if (!res.ok) { setApptMsg(`⚠ ${d.error}`); return; }
    setApptMsg("Opmåling booket ✓");
    setAppt({ day: "", time: "" });
    load();
  }

  async function forfrem() {
    setError(null);
    const res = await fetch(`/api/leads/${id}/promote`, { method: "POST" });
    const d = await res.json();
    if (!res.ok) { setError(d.error || "Kunne ikke forfremme."); return; }
    router.push(`/admin/ordrer/${d.order.id}`);
  }

  if (loading) return <p className="text-brand-ink2/60">Indlæser...</p>;
  if (!lead) return <p className="text-red-600">Lead ikke fundet.</p>;

  const stageIdx = LEAD_STAGE_ORDER.indexOf(lead.stage);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">{lead.leadNumber} · {lead.firstName} {lead.lastName}</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">{deriveLeadStatusLabel(lead.stage, lead.measurements || [])} · Kilde: {lead.source || "-"}</p>
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

        {/* Tilbud + forfrem */}
        <div className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-brand-ink">Tilbud</h2>
          <div className="mt-3 flex items-center gap-2">
            <input className="input" type="number" placeholder="Pris i kr." value={quote} onChange={(e) => setQuote(e.target.value)} />
            <button onClick={gemTilbud} className="btn-secondary py-2 text-sm">Gem pris</button>
          </div>
          <div className="mt-5 border-t border-brand-line pt-4">
            {lead.order ? (
              <p className="text-sm text-brand-ink2/70">Allerede forfremmet til ordre <strong>{lead.order.orderNumber}</strong>.</p>
            ) : (
              <>
                <button onClick={forfrem} disabled={lead.stage !== "BEKRAEFTET"} className="btn-primary w-full disabled:opacity-40">Forfrem til ordre</button>
                {lead.stage !== "BEKRAEFTET" && <p className="mt-2 text-xs text-brand-ink2/55">Kun muligt når leadet er markeret Bekræftet.</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Opmålingsaftale */}
      <div className="mb-6 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
        <h2 className="font-bold text-brand-ink">Opmålingsaftale</h2>
        {(lead.appointments || []).filter((a: any) => a.type === "MAALING").map((a: any) => (
          <p key={a.id} className="mt-2 text-sm text-brand-ink2/80">{a.day} kl. {a.time} — {a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}</p>
        ))}
        <form onSubmit={bookOpmaaling} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block"><span className="label">Dato</span><input type="date" className="input py-2 text-sm" required value={appt.day} onChange={(e) => setAppt({ ...appt, day: e.target.value })} /></label>
          <label className="block"><span className="label">Klokkeslæt</span><input type="time" className="input py-2 text-sm" required value={appt.time} onChange={(e) => setAppt({ ...appt, time: e.target.value })} /></label>
          <button className="btn-primary py-2.5 text-sm">Book opmåling</button>
        </form>
        {apptMsg && <p className="mt-2 text-sm font-medium text-brand-ink2/80">{apptMsg}</p>}
      </div>

      {/* Måletagning */}
      <div className="mt-6 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
        <h2 className="font-bold text-brand-ink">Mål (forventede / reelle)</h2>
        <p className="mt-1 text-xs text-brand-ink2/55">Opret forventede linjer uden mål når opmåling bookes — udfyld bredde/højde når det reelle mål findes.</p>

        <div className="mt-4 space-y-2">
          {(lead.measurements || []).map((m: any) => (
            <div key={m.id} className="grid grid-cols-2 gap-2 rounded-lg bg-brand-mist/50 p-3 text-sm sm:grid-cols-6 sm:items-center">
              <span className="font-semibold text-brand-ink">#{m.itemNumber} {m.roomName}</span>
              <span className="text-brand-ink2/70">{m.productType}</span>
              <input className="input py-1" placeholder="Bredde mm" defaultValue={m.widthMm ?? ""} onBlur={(e) => opdaterMaal(m.id, { widthMm: e.target.value })} />
              <input className="input py-1" placeholder="Højde mm" defaultValue={m.heightMm ?? ""} onBlur={(e) => opdaterMaal(m.id, { heightMm: e.target.value })} />
              <span className="text-brand-ink2/70">{m.colorName}</span>
              <button onClick={() => sletMaal(m.id)} className="text-right text-red-400 hover:text-red-600">Slet</button>
            </div>
          ))}
          {(!lead.measurements || lead.measurements.length === 0) && <p className="text-sm text-brand-ink2/55">Ingen linjer endnu.</p>}
        </div>

        <form onSubmit={tilfoejMaal} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input className="input" placeholder="Rum" value={newM.roomName} onChange={(e) => setNewM({ ...newM, roomName: e.target.value })} />
          <input className="input" placeholder="Produkttype" value={newM.productType} onChange={(e) => setNewM({ ...newM, productType: e.target.value })} />
          <input className="input" placeholder="Farve" value={newM.colorName} onChange={(e) => setNewM({ ...newM, colorName: e.target.value })} />
          <input className="input" placeholder="Kommentar" value={newM.comment} onChange={(e) => setNewM({ ...newM, comment: e.target.value })} />
          <button className="btn-secondary text-sm">+ Tilføj linje</button>
        </form>
      </div>
    </div>
  );
}
