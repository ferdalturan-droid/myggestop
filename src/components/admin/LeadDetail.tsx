"use client";
import { useEffect, useState } from "react";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, deriveLeadStatusLabel } from "@/lib/leadStatus";
import { TUR_LABEL } from "@/lib/calcOptions";
import { LEAD_SOURCE_LABEL } from "@/lib/leadSource";
import { MeasurementRowFields, BLANK_ROW, RowValue } from "./MeasurementRowFields";
import { formatDKK } from "@/lib/pricing";

let draftKeySeq = 1;

export default function LeadDetail({ id }: { id: string }) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState("");
  const [newM, setNewM] = useState<RowValue>(BLANK_ROW);
  const [draftKey, setDraftKey] = useState(0);
  const [uge, setUge] = useState("");
  const [colors, setColors] = useState<any[]>([]);
  const [profileSizes, setProfileSizes] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (res.ok) {
        setLead(d.lead);
        // RUNDE 10 (§H): prisen er nu serverberegnet (calculatedPriceDkk) -
        // det ENESTE Koordinator selv indtaster er en eventuel rabat.
        setDiscount(d.lead.discountDkk != null ? String(d.lead.discountDkk) : "0");
        setUge(d.lead.expectedMeasuringWeekLabel || "");
      }
    } catch {}
    setLoading(false);
  }
  useEffect(() => {
    load();
    fetch("/api/colors", { cache: "no-store" }).then((r) => r.json()).then((d) => setColors(d.colors || [])).catch(() => {});
    fetch("/api/profile-sizes", { cache: "no-store" }).then((r) => r.json()).then((d) => setProfileSizes(d.sizes || [])).catch(() => {});
  }, [id]);

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
  // RUNDE 10 (§H - "beregningsmekanismen er allerede i systemet du skal
  // bruge det"): Koordinator indtaster IKKE længere selve prisen - den
  // beregnes automatisk fra målelinjerne (calculatedPriceDkk, sat af
  // serveren når Installatør markerer opmåling færdig). Koordinator kan
  // kun indtaste en rabat, som trækkes fra ved fremvisning og ved
  // forfremmelse til ordre.
  async function gemRabat() { await patch({ discountDkk: Number(discount) || 0 }); }
  async function markerOpmaalingFaerdig() { await patch({ measuredAt: true }); }
  async function gemUgeEstimat() { await patch({ expectedMeasuringWeekLabel: uge }); }

  async function tilfoejMaal() {
    setError(null);
    const res = await fetch(`/api/leads/${id}/measurements`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      // RUNDE 4 (§G3): productType er et VISNINGSNAVN ("Myggenet"), ikke den
      // interne "tur"-kode ("SINEKLIK") - ellers lækker den tyrkiske
      // interne værdi ud som produktnavn på ordren, når leadet forfremmes
      // (promoteLead.ts læser netop dette felt).
      body: JSON.stringify({ ...newM, productType: TUR_LABEL[newM.tur] || newM.tur, adet: Number(newM.adet) || 1 })
    });
    if (res.ok) {
      setNewM(BLANK_ROW);
      setDraftKey(draftKeySeq++);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Kunne ikke tilføje linjen.");
    }
  }

  async function opdaterMaal(measurementId: string, data: any) {
    await fetch(`/api/leads/${id}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }
  async function sletMaal(measurementId: string) {
    setError(null);
    const res = await fetch(`/api/leads/${id}/measurements/${measurementId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Kunne ikke slette linjen.");
      return;
    }
    load();
  }

  if (loading) return <p className="text-brand-ink2/60">Indlæser...</p>;
  if (!lead) return <p className="text-red-600">Lead ikke fundet.</p>;

  const stageIdx = LEAD_STAGE_ORDER.indexOf(lead.stage);
  const maalingAppt = (lead.appointments || []).find((a: any) => a.type === "MAALING");
  const beregnetPris = typeof lead.calculatedPriceDkk === "number" ? lead.calculatedPriceDkk : null;
  const rabat = Number(discount) || 0;
  const endeligPris = beregnetPris != null ? Math.max(0, beregnetPris - rabat) : null;

  // RUNDE 10 (§B - "GPS-ikon på adressen"): samme Google Maps-søgelink som
  // bruges på Kalender-siden, genbrugt her på Lead-detaljen.
  const mapsHref = lead.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.address}, ${lead.postalCode || ""} ${lead.city || ""}`)}`
    : null;

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
            <p className="flex flex-wrap items-center gap-1.5">
              <span>{lead.address}{lead.address ? ", " : ""}{lead.postalCode} {lead.city}</span>
              {mapsHref && (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" title="Åbn i Google Maps" className="inline-flex items-center text-brand-greendark hover:text-brand-green" onClick={(e) => e.stopPropagation()}>
                  📍
                </a>
              )}
            </p>
            {lead.productSummary && <p className="mt-2"><span className="font-semibold text-brand-ink">Ønsker:</span> {lead.productSummary}</p>}
            {lead.note && <p className="mt-2 whitespace-pre-wrap"><span className="font-semibold text-brand-ink">Note:</span> {lead.note}</p>}
          </div>
        </div>

        {/* Tilbud - RUNDE 10 (§H): pris beregnes automatisk fra målelinjerne
            når opmåling markeres færdig. Koordinator indtaster kun en
            eventuel rabat - forfremmelse til ordre bruger den ægte
            per-linje-pris (ikke ligedeling), se promoteLead.ts. */}
        <div className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-brand-ink">Tilbud</h2>
          {beregnetPris == null ? (
            <p className="mt-3 text-sm text-brand-ink2/55">Prisen beregnes automatisk, når Installatør markerer opmålingen som færdig (kræver udfyldte mål på linjerne nedenfor).</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-brand-ink2/70">Beregnet pris</span>
                <span className="font-semibold text-brand-ink">{formatDKK(beregnetPris)}</span>
              </div>
              <label className="flex items-center justify-between gap-3">
                <span className="text-brand-ink2/70">Rabat (kr.)</span>
                <input className="input w-32 py-1.5 text-right" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={!!lead.order} />
              </label>
              <div className="flex items-center justify-between border-t border-brand-line pt-2">
                <span className="font-semibold text-brand-ink">Endelig pris til kunde</span>
                <span className="text-lg font-extrabold text-brand-greendark">{formatDKK(endeligPris ?? beregnetPris)}</span>
              </div>
              <button onClick={gemRabat} disabled={!!lead.order} className="btn-secondary mt-1 w-full py-2 text-sm disabled:opacity-40">Gem rabat</button>
            </div>
          )}
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
      <div className="mb-6 mt-6 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
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

      {/* Måletagning - RUNDE 10 (§A - "grim... store felter... knapperne er
          for store"): genskrevet til samme elegante kort-per-linje-layout
          som Installatørens Opmålingsliste, via den delte
          MeasurementRowFields-komponent - garanti for at de to sider aldrig
          kan komme ud af trit med hinanden igen. */}
      <div className="mt-6 rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
        <h2 className="font-bold text-brand-ink">Mål (forventede / reelle)</h2>
        <p className="mt-1 text-xs text-brand-ink2/55">Opret forventede linjer uden mål når opmåling bookes — Installatør udfylder bredde/højde når det reelle mål findes. Kun en eksplicit "Markér opmåling færdig" ovenfor gør leadet Opmålt og beregner prisen.</p>

        <div className="mt-4 space-y-3">
          {(lead.measurements || []).length === 0 && (
            <p className="rounded-lg bg-brand-mist/30 px-4 py-3 text-sm text-brand-ink2/50">Ingen linjer endnu — tilføj den første nedenfor.</p>
          )}
          {(lead.measurements || []).map((m: any, i: number) => (
            <div key={m.id} className="rounded-xl border border-brand-line p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-brand-greendark">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-greendark text-[11px] text-white">{i + 1}</span>
                  {m.roomName || "Linje"}
                  {typeof m.calculatedLineTotal === "number" && <span className="ml-2 rounded-full bg-brand-mist px-2 py-0.5 text-[11px] font-semibold text-brand-ink2/70">{formatDKK(m.calculatedLineTotal)}</span>}
                </span>
                <button onClick={() => sletMaal(m.id)} title="Slet linje" className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none text-red-400 hover:bg-red-50 hover:text-red-600">×</button>
              </div>
              <MeasurementRowFields
                value={{ roomName: m.roomName || "", tur: m.tur || "SINEKLIK", tip: m.tip || "TEK", sys: m.sys || "1,9", layout: m.layout || "YANA", kanat: m.kanat || "HAREKETLI", subType: m.subType || "NORMAL", adet: m.adet ?? 1, widthMm: m.widthMm, heightMm: m.heightMm, colorName: m.colorName || "", fabricColorName: m.fabricColorName || "", rodColorName: m.rodColorName || "", comment: m.comment || "" }}
                onField={(patch) => opdaterMaal(m.id, patch)}
                colors={colors}
                profileSizes={profileSizes}
              />
            </div>
          ))}

          <div key={`draft-${draftKey}`} className="rounded-xl border border-dashed border-brand-line p-3.5">
            <p className="mb-2 text-sm font-bold text-brand-greendark">+ Ny linje</p>
            <MeasurementRowFields
              value={newM}
              onField={(patch) => setNewM((prev) => ({ ...prev, ...patch }))}
              colors={colors}
              profileSizes={profileSizes}
            />
            <button type="button" onClick={tilfoejMaal} className="btn-secondary mt-3 w-full py-2 text-sm">+ Tilføj linje</button>
          </div>
        </div>
      </div>
    </div>
  );
}
