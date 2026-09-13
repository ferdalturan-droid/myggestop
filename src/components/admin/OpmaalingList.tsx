"use client";
import { useEffect, useState } from "react";
import { harReelMaaling } from "@/lib/leadStatus";

export default function OpmaalingList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function gemMaal(leadId: string, measurementId: string, data: any) {
    await fetch(`/api/leads/${leadId}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Opmålingsliste</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Leads der venter på opmåling. Udfyld bredde/højde når det reelle mål findes.</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>
      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && leads.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen opmålinger at udføre lige nu.</div>}
      <div className="space-y-4">
        {leads.map((l) => {
          const done = harReelMaaling(l.measurements || []);
          return (
            <div key={l.id} className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-brand-ink">{l.leadNumber} · {l.firstName} {l.lastName}</span>
                  <span className="ml-2 text-sm text-brand-ink2/55">{l.phone} · {l.address}, {l.postalCode} {l.city}</span>
                </div>
                {done && <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-greendark">Opmålt</span>}
              </div>
              {l.note && <p className="mb-3 text-sm italic text-brand-ink2/60">"{l.note}"</p>}
              <div className="space-y-2">
                {(l.measurements || []).map((m: any) => (
                  <div key={m.id} className="grid grid-cols-2 gap-2 rounded-lg bg-brand-mist/50 p-3 text-sm sm:grid-cols-4 sm:items-center">
                    <span className="font-semibold text-brand-ink">#{m.itemNumber} {m.roomName || "—"} · {m.productType || "—"}</span>
                    <input className="input py-1" placeholder="Bredde mm" defaultValue={m.widthMm ?? ""} onBlur={(e) => gemMaal(l.id, m.id, { widthMm: e.target.value })} />
                    <input className="input py-1" placeholder="Højde mm" defaultValue={m.heightMm ?? ""} onBlur={(e) => gemMaal(l.id, m.id, { heightMm: e.target.value })} />
                    <span className="text-brand-ink2/60">{m.colorName}{m.comment ? ` · ${m.comment}` : ""}</span>
                  </div>
                ))}
                {(!l.measurements || l.measurements.length === 0) && <p className="text-sm text-brand-ink2/55">Ingen forventede linjer oprettet endnu — bed koordinator om at oprette dem.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
