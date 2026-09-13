"use client";
import { useEffect, useState } from "react";

const TYPE_LABEL: Record<string, string> = { MAALING: "Opmåling", INSTALLATION: "Installation" };

export default function KalenderList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/kalender", { cache: "no-store" });
      const d = await res.json();
      setItems(d.items || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function koerAftenafstemning() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/kalender/aftenafstemning", { method: "POST" });
      const d = await res.json();
      setResult(d);
      load();
    } catch {}
    setRunning(false);
  }

  const byDay = items.reduce((m: Record<string, any[]>, a) => {
    (m[a.day] ||= []).push(a);
    return m;
  }, {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Kalender</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Dagsgrupperet liste over alle aftaler (opmåling, installation, m.m.).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
          <button onClick={koerAftenafstemning} disabled={running} className="btn-primary py-2 text-sm disabled:opacity-60">{running ? "Kører..." : "Kør aftenafstemning"}</button>
        </div>
      </div>

      {result && (
        <div className="mb-4 rounded-xl border border-brand-line bg-white p-4 text-sm shadow-card">
          <p className="font-semibold text-brand-ink">Aftenafstemning for {result.dag}: {result.antalTjekket} tentative aftale(r) tjekket, {result.antalForskudteBagved} forskudt bagved.</p>
          {result.resultat?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.resultat.map((r: any) => (
                <li key={r.id} className={r.udfald === "CONFIRMED" ? "text-brand-greendark" : "text-amber-600"}>
                  {TYPE_LABEL[r.type] || r.type} · {r.customer} — {r.udfald === "CONFIRMED" ? "Bekræftet ✓" : `Flyttet til ${r.nyDag}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && Object.keys(byDay).length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen aftaler booket.</div>}

      <div className="space-y-5">
        {Object.entries(byDay).map(([day, list]) => (
          <div key={day}>
            <h2 className="mb-2 text-sm font-bold text-brand-ink2">{day}</h2>
            <div className="space-y-1.5">
              {list.map((a: any) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-line bg-white px-3 py-2 text-sm">
                  <div>
                    <span className="font-semibold text-brand-ink">{a.time} · {a.customer}</span>
                    {a.type && <span className="ml-2 rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">{TYPE_LABEL[a.type] || a.type}</span>}
                    {a.status && <span className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold ${a.status === "CONFIRMED" ? "bg-brand-green/15 text-brand-greendark" : "bg-amber-50 text-amber-700"}`}>{a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}</span>}
                    {a.lead && <span className="ml-2 text-brand-ink2/55">{a.lead.leadNumber}</span>}
                    {a.order && <span className="ml-2 text-brand-ink2/55">{a.order.orderNumber}</span>}
                  </div>
                  <span className="text-brand-ink2/55">{a.phone}{a.address ? ` · ${a.address}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
