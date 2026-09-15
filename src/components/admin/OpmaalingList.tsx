"use client";
import { useEffect, useState } from "react";
import { TUR_LABEL } from "@/lib/calcOptions";
import { MeasurementRowFields, BLANK_ROW, RowValue } from "./MeasurementRowFields";

// RUNDE 10 (§C/§F - "opmålingsliste ser ikke elegant ud... gør det bedre og
// flottere", "rum og farve skal være dropdown", "+ Ny Linje virker ikke",
// "slet virker ikke", "linjerne skifter plads", "fjern +ny ordre-knappen"):
// fuldt genskrevet. Alle kategoriske felter er nu dropdowns via den delte
// MeasurementRowFields (samme komponent som Leads' "Mål"-sektion - garanti
// for at de to steder altid ser og opfører sig ens). "Slet" virkede reelt
// ikke for Installatøren fordi DELETE-endpointet var Koordinator-only -
// rettet i /api/leads/[id]/measurements/[measurementId]/route.ts.
let draftKeySeq = 1;

export default function OpmaalingList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newMByLead, setNewMByLead] = useState<Record<string, RowValue>>({});
  const [draftKeyByLead, setDraftKeyByLead] = useState<Record<string, number>>({});
  const [savingDone, setSavingDone] = useState<string | null>(null);
  const [colors, setColors] = useState<any[]>([]);
  const [profileSizes, setProfileSizes] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/opmaaling", { cache: "no-store" });
      const d = await res.json();
      setLeads(d.leads || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => {
    load();
    fetch("/api/colors", { cache: "no-store" }).then((r) => r.json()).then((d) => setColors(d.colors || [])).catch(() => {});
    fetch("/api/profile-sizes", { cache: "no-store" }).then((r) => r.json()).then((d) => setProfileSizes(d.sizes || [])).catch(() => {});
  }, []);

  function newMFor(leadId: string) { return newMByLead[leadId] || BLANK_ROW; }
  function setNewMFor(leadId: string, patch: Partial<RowValue>) {
    setNewMByLead((prev) => ({ ...prev, [leadId]: { ...(prev[leadId] || BLANK_ROW), ...patch } }));
  }

  async function opdaterMaal(leadId: string, measurementId: string, data: any) {
    await fetch(`/api/leads/${leadId}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }
  async function sletMaal(leadId: string, measurementId: string) {
    setErr(null);
    const res = await fetch(`/api/leads/${leadId}/measurements/${measurementId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Kunne ikke slette linjen.");
      setTimeout(() => setErr(null), 3000);
      return;
    }
    load();
  }
  async function tilfoejMaal(leadId: string) {
    setErr(null);
    const m = newMFor(leadId);
    if (!(Number(m.widthMm) >= 0)) { /* tillader tomme forventede linjer */ }
    const res = await fetch(`/api/leads/${leadId}/measurements`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, productType: TUR_LABEL[m.tur] || m.tur, adet: Number(m.adet) || 1 })
    });
    if (res.ok) {
      setNewMByLead((prev) => ({ ...prev, [leadId]: BLANK_ROW }));
      setDraftKeyByLead((prev) => ({ ...prev, [leadId]: draftKeySeq++ }));
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Kunne ikke tilføje linjen.");
      setTimeout(() => setErr(null), 3000);
    }
  }

  async function markerOpmaalingFaerdig(leadId: string) {
    setSavingDone(leadId);
    setErr(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ measuredAt: true }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Kunne ikke markere opmålingen som færdig.");
      }
      setMsg("Opmåling markeret færdig ✓ — pris beregnet og flyttet videre til Koordinator"); setTimeout(() => setMsg(null), 3500);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSavingDone(null);
    }
  }

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
        {leads.map((l) => (
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
              {(l.measurements || []).map((m: any, i: number) => (
                <div key={m.id} className="rounded-xl border border-brand-line p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-brand-greendark">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-greendark text-[11px] text-white">{i + 1}</span>
                      {m.roomName || "Linje"}
                    </span>
                    <button onClick={() => sletMaal(l.id, m.id)} title="Slet linje" className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none text-red-400 hover:bg-red-50 hover:text-red-600">×</button>
                  </div>
                  <MeasurementRowFields
                    value={{ roomName: m.roomName || "", tur: m.tur || "SINEKLIK", tip: m.tip || "TEK", sys: m.sys || "1,9", layout: m.layout || "YANA", kanat: m.kanat || "HAREKETLI", subType: m.subType || "NORMAL", adet: m.adet ?? 1, widthMm: m.widthMm, heightMm: m.heightMm, colorName: m.colorName || "", fabricColorName: m.fabricColorName || "", rodColorName: m.rodColorName || "", comment: m.comment || "" }}
                    onField={(patch) => opdaterMaal(l.id, m.id, patch)}
                    colors={colors}
                    profileSizes={profileSizes}
                  />
                </div>
              ))}

              <div key={`draft-${draftKeyByLead[l.id] || 0}`} className="rounded-xl border border-dashed border-brand-line p-3.5">
                <p className="mb-2 text-sm font-bold text-brand-greendark">+ Ny linje</p>
                <MeasurementRowFields
                  value={newMFor(l.id)}
                  onField={(patch) => setNewMFor(l.id, patch)}
                  colors={colors}
                  profileSizes={profileSizes}
                />
                <button type="button" onClick={() => tilfoejMaal(l.id)} className="btn-secondary mt-3 w-full py-2 text-sm">+ Tilføj linje</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
