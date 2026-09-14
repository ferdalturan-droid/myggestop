"use client";
import { useEffect, useMemo, useState } from "react";
import { APPT_TYPE_LABEL, APPT_TYPE_COLOR, FRI_AFTALE_COLOR } from "@/lib/appointmentOptions";
import OpmaalingList from "./OpmaalingList";
import InstallationList from "./InstallationList";
import ProduktionList from "./ProduktionList";

// RUNDE 8 (delta §1 - "Installer får ÉN arbejdsside... Faner: I dag ·
// Opmålinger · Installationer · Produktion. Default = I dag. Alle faner
// viser KUN opgaver hvor assignedUserId = mig"): erstatter den tidligere
// stablede /admin/produktion-installation-side med en fanebladsside, delt
// mellem Installatør (alle 4 faner) og Bygger (kun I dag + Produktion).
// "I dag" bruger /api/kalender, som ALLEREDE filtrerer Builder/Installer
// til udelukkende deres egne assignedUserId-koblede aftaler server-side
// (se Runde 5) - ingen ny API nødvendig.
function iso(d: Date) { return d.toISOString().slice(0, 10); }

function IDag() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => iso(new Date()), []);

  useEffect(() => {
    fetch("/api/kalender", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems((d.items || []).filter((a: any) => a.day === today)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const sorted = [...items].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  function detailHref(a: any): string | null {
    if (a.type === "MAALING") return null; // Installer har ingen separat lead-side - opmåling foregår i selve fanen
    if ((a.type === "INSTALLATION" || a.type === "PRODUKTION") && a.orderId) return `/admin/ordrer/${a.orderId}`;
    return null;
  }

  if (loading) return <p className="text-brand-ink2/60">Indlæser...</p>;
  if (sorted.length === 0) return <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen aftaler i dag — de dukker op her, når Koordinator booker en til dig.</div>;

  return (
    <div className="space-y-1.5">
      {sorted.map((a: any) => {
        const farve = a.type ? (APPT_TYPE_COLOR[a.type] || FRI_AFTALE_COLOR) : FRI_AFTALE_COLOR;
        const href = detailHref(a);
        return (
          <div key={a.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-l-4 border-brand-line ${farve.border} bg-white px-3 py-2.5 text-sm`}>
            <div>
              <span className="font-semibold text-brand-ink">{a.time ? `${a.time} · ` : ""}{a.customer}</span>
              {a.type && <span className="ml-2 rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">{APPT_TYPE_LABEL[a.type] || a.type}</span>}
              {a.address && <span className="ml-2 text-brand-ink2/55">· {a.address}</span>}
              {a.phone && <span className="ml-2 text-brand-ink2/55">· <a className="text-brand-blue hover:underline" href={`tel:${a.phone}`}>{a.phone}</a></span>}
            </div>
            {href && <a href={href} className="font-semibold text-brand-blue hover:underline">Åbn</a>}
          </div>
        );
      })}
    </div>
  );
}

export default function MineOpgaver({ role }: { role?: string }) {
  const erInstallator = role === "INSTALLER";
  const tabs = erInstallator
    ? [{ key: "idag", label: "I dag" }, { key: "opmaalinger", label: "Opmålinger" }, { key: "installationer", label: "Installationer" }, { key: "produktion", label: "Produktion" }]
    : [{ key: "idag", label: "I dag" }, { key: "produktion", label: "Produktion" }];
  const [tab, setTab] = useState(tabs[0].key);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Mine opgaver</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Alt der er tildelt dig — dit skema for i dag, og resten af dit arbejde.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* RUNDE 8 ("in case customer is a friend or someone off-cycle,
              it should be possible to add a order manually... only
              coordinator and installer can add this by-pass manual
              entry"): samme smalle side som Koordinator bruger, se
              roles.ts (ORDER_MANUAL_CREATE_ONLY). */}
          {erInstallator && <a href="/admin/ordrer/ny" className="btn-secondary py-1.5 text-xs">+ Ny ordre (manuel)</a>}
          <div className="flex gap-1 rounded-full border border-brand-line bg-white p-1">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? "bg-brand-greendark text-white" : "text-brand-ink2 hover:bg-brand-mist"}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {tab === "idag" && <IDag />}
      {tab === "opmaalinger" && erInstallator && <OpmaalingList />}
      {tab === "installationer" && erInstallator && <InstallationList />}
      {tab === "produktion" && <ProduktionList role={role} readOnly={erInstallator} />}
    </div>
  );
}
