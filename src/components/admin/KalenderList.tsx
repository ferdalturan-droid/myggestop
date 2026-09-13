"use client";
import { useEffect, useMemo, useState } from "react";
import { APPT_TYPE_LABEL, APPT_TYPE_OPTIONS, APPT_TYPE_RESOURCE, RESOURCE_LABEL } from "@/lib/appointmentOptions";

const BLANK = {
  day: "", time: "", customer: "", phone: "", address: "", note: "",
  type: "", status: "", leadId: "", orderId: "", linkLabel: ""
};

function iso(d: Date) { return d.toISOString().slice(0, 10); }

// RUNDE 3: delt formular til baade "+ Ny aftale" og "Rediger" - KUN
// Coordinator naar nogensinde denne komponent (§"Kun koordinator kan
// oprette" - haandhaevet baade her, i navigationen og paa API'et).
// Ressourcen (Bygger/Installatør) udledes automatisk af opgavetypen -
// intet separat valg, saa en Opmåling aldrig ved en fejl kan havne paa
// Byggerens kalender.
function AppointmentForm({ initial, onSubmit, onCancel, submitLabel }: { initial: any; onSubmit: (data: any) => Promise<void>; onCancel: () => void; submitLabel: string }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kalender/search?q=${encodeURIComponent(q)}`);
        const d = await res.json();
        setResults(d.results || []);
      } catch {}
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function vaelgResultat(r: any) {
    setForm((f: any) => ({
      ...f,
      leadId: r.kind === "lead" ? r.id : "",
      orderId: r.kind === "order" ? r.id : "",
      linkLabel: r.label,
      customer: f.customer || r.customer,
      phone: f.phone || r.phone,
      address: f.address || r.address
    }));
    setQ(""); setResults([]);
  }
  function fjernKobling() {
    setForm((f: any) => ({ ...f, leadId: "", orderId: "", linkLabel: "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Ressourcen udledes af typen her ved gem - se APPT_TYPE_RESOURCE.
      await onSubmit({ ...form, resource: form.type ? APPT_TYPE_RESOURCE[form.type] : null });
    } catch (err: any) {
      setError(err.message || "Kunne ikke gemme.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card sm:grid-cols-2">
      <div>
        <label className="label">Opgave</label>
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="">— Fri aftale (ingen opgavetype) —</option>
          {APPT_TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {form.type && APPT_TYPE_RESOURCE[form.type] && (
          <p className="mt-1 text-xs text-brand-ink2/50">Lægges automatisk på {RESOURCE_LABEL[APPT_TYPE_RESOURCE[form.type]!]}s kalender.</p>
        )}
      </div>
      <div>
        <label className="label">Kobl til lead/ordre (valgfrit, auto-udfylder kunde/tlf./adresse)</label>
        {form.linkLabel ? (
          <div className="flex items-center gap-2 rounded-lg bg-brand-mist px-3 py-2 text-sm">
            <span className="font-semibold text-brand-ink">{form.linkLabel}</span>
            <button type="button" onClick={fjernKobling} className="ml-auto text-xs text-red-500 hover:text-red-700">Fjern</button>
          </div>
        ) : (
          <div className="relative">
            <input className="input" placeholder="Søg navn, lead-nr. eller ordre-nr..." value={q} onChange={(e) => setQ(e.target.value)} />
            {(searching || results.length > 0) && q.trim().length >= 2 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-brand-line bg-white shadow-card">
                {searching && <p className="px-3 py-2 text-xs text-brand-ink2/50">Søger...</p>}
                {!searching && results.length === 0 && <p className="px-3 py-2 text-xs text-brand-ink2/50">Ingen match.</p>}
                {results.map((r) => (
                  <button type="button" key={`${r.kind}-${r.id}`} onClick={() => vaelgResultat(r)} className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-mist">
                    <span className="font-semibold text-brand-ink">{r.label}</span>
                    <span className="ml-2 text-xs text-brand-ink2/50">{r.kind === "lead" ? "Lead" : "Ordre"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div><label className="label">Titel / kunde *</label><input className="input" required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Navn, eller fx 'Personalemøde'" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Dato *</label><input type="date" className="input" required value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} /></div>
        <div><label className="label">Klokkeslæt</label><input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
      </div>

      <div><label className="label">Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label className="label">Adresse</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>

      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="">— Ingen —</option>
          <option value="TENTATIVE">Foreløbig</option>
          <option value="CONFIRMED">Bekræftet</option>
        </select>
      </div>
      <div className="sm:col-span-2"><label className="label">Note</label><textarea className="input min-h-[60px]" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>

      {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Gemmer..." : submitLabel}</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Annuller</button>
      </div>
    </form>
  );
}

const RANGE_TABS = [
  { key: "today", label: "I dag" },
  { key: "tomorrow", label: "I morgen" },
  { key: "week", label: "Denne uge" },
  { key: "all", label: "Alle" }
];

export default function KalenderList({ role }: { role: string }) {
  const isCoordinator = role === "COORDINATOR";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // RUNDE 3: Outlook-stil dato-/ressourcefiltre. "I dag" er default, saa
  // Bygger/Installatør møder deres AKTUELLE skema foerst, ikke en uendelig
  // fladliste (§"kalender skal vise schedule for i dag").
  const [range, setRange] = useState<"today" | "tomorrow" | "week" | "all">("today");
  const [resourceTab, setResourceTab] = useState<"" | "BUILDER" | "INSTALLER">("");

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

  const { today, tomorrow, weekEnd } = useMemo(() => {
    const now = new Date();
    const t = new Date(now); const m = new Date(now); m.setDate(m.getDate() + 1);
    const w = new Date(now); w.setDate(w.getDate() + 7);
    return { today: iso(t), tomorrow: iso(m), weekEnd: iso(w) };
  }, []);

  const filtered = items
    .filter((a) => !resourceTab || a.resource === resourceTab)
    .filter((a) => {
      if (range === "today") return a.day === today;
      if (range === "tomorrow") return a.day === tomorrow;
      if (range === "week") return a.day >= today && a.day <= weekEnd;
      return true;
    });

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

  async function opret(data: any) {
    const res = await fetch("/api/kalender", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, leadId: data.leadId || undefined, orderId: data.orderId || undefined })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Kunne ikke oprette aftalen.");
    setShowCreate(false);
    setMsg("Aftale oprettet ✓"); setTimeout(() => setMsg(null), 2000);
    load();
  }

  async function gemRedigering(id: string, data: any) {
    const res = await fetch(`/api/kalender/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, leadId: data.leadId || null, orderId: data.orderId || null })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Kunne ikke gemme ændringen.");
    setEditingId(null);
    setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2000);
    load();
  }

  async function slet(id: string) {
    if (!confirm("Slet denne aftale? Kan ikke fortrydes.")) return;
    const res = await fetch(`/api/kalender/${id}`, { method: "DELETE" });
    if (res.ok) { setMsg("Slettet ✓"); setTimeout(() => setMsg(null), 2000); load(); }
  }

  // RUNDE 3: Byggerens eget "i gang"/"faerdig"-tryk direkte i kalenderen.
  async function toggleStart(orderId: string, isOn: boolean) {
    await fetch(`/api/produktion/${orderId}/start`, { method: isOn ? "DELETE" : "POST" });
    load();
  }
  async function toggleKlar(orderId: string, isOn: boolean) {
    await fetch(`/api/produktion/${orderId}/klar`, { method: isOn ? "DELETE" : "POST" });
    load();
  }

  // "Se detaljer" - navigerer til NØJAGTIG den side hvor rollen allerede
  // maa se de samme oplysninger (§"navigere dem til siden hvor de ellers
  // kunne se det samme"). Opmåling har ingen individuel side for
  // Installer (kun listen), saa den peger paa selve Opmålingslisten;
  // Coordinator faar i stedet det fulde Lead.
  function detailHref(a: any): string | null {
    if (a.type === "MAALING") {
      return isCoordinator && a.leadId ? `/admin/leads/${a.leadId}` : "/admin/opmaaling";
    }
    if ((a.type === "INSTALLATION" || a.type === "PRODUKTION" || a.type === "ORDRE") && a.orderId) {
      return `/admin/ordrer/${a.orderId}`;
    }
    return null;
  }

  const byDay = filtered.reduce((m: Record<string, any[]>, a) => {
    (m[a.day] ||= []).push(a);
    return m;
  }, {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Kalender</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">
            {isCoordinator ? "Alle aftaler — opmåling, installation, produktion m.m." : "Dit eget skema."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isCoordinator && <button onClick={() => { setShowCreate((v) => !v); setEditingId(null); }} className="btn-primary py-2 text-sm">{showCreate ? "Luk" : "+ Ny aftale"}</button>}
          <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
          {/* RUNDE 3: "Kør aftenafstemning" er UDELUKKENDE Coordinators - hverken
              synlig eller tilgængelig for Bygger/Installatør (§"afstemning er
              ikke noget andre end koordinator skal kunne gøre eller se"). */}
          {isCoordinator && <button onClick={koerAftenafstemning} disabled={running} className="btn-secondary py-2 text-sm disabled:opacity-60">{running ? "Kører..." : "Kør aftenafstemning"}</button>}
        </div>
      </div>

      {/* Outlook-stil filtre: dato-interval for alle, ressource-faner kun for Coordinator (Bygger/Installatør faar allerede kun deres egen fra serveren). */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full border border-brand-line bg-white p-1">
          {RANGE_TABS.map((t) => (
            <button key={t.key} onClick={() => setRange(t.key as any)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${range === t.key ? "bg-brand-greendark text-white" : "text-brand-ink2 hover:bg-brand-mist"}`}>{t.label}</button>
          ))}
        </div>
        {isCoordinator && (
          <div className="flex gap-1 rounded-full border border-brand-line bg-white p-1">
            {[{ key: "", label: "Alle" }, { key: "BUILDER", label: "Bygger" }, { key: "INSTALLER", label: "Installatør" }].map((t) => (
              <button key={t.key} onClick={() => setResourceTab(t.key as any)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${resourceTab === t.key ? "bg-brand-ink text-white" : "text-brand-ink2 hover:bg-brand-mist"}`}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}

      {isCoordinator && showCreate && (
        <div className="mb-6">
          <AppointmentForm initial={{}} submitLabel="Opret aftale" onCancel={() => setShowCreate(false)} onSubmit={opret} />
        </div>
      )}

      {isCoordinator && result && (
        <div className="mb-4 rounded-xl border border-brand-line bg-white p-4 text-sm shadow-card">
          <p className="font-semibold text-brand-ink">Aftenafstemning for {result.dag}: {result.antalTjekket} tentative aftale(r) tjekket, {result.antalForskudteBagved} forskudt bagved.</p>
          {result.resultat?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.resultat.map((r: any) => (
                <li key={r.id} className={r.udfald === "CONFIRMED" ? "text-brand-greendark" : "text-amber-600"}>
                  {APPT_TYPE_LABEL[r.type] || r.type} · {r.customer} — {r.udfald === "CONFIRMED" ? "Bekræftet ✓" : `Flyttet til ${r.nyDag}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && Object.keys(byDay).length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen aftaler i dette interval.</div>}

      <div className="space-y-5">
        {Object.entries(byDay).map(([day, list]) => (
          <div key={day}>
            <h2 className="mb-2 text-sm font-bold text-brand-ink2">{day === today ? "I dag" : day === tomorrow ? "I morgen" : day} <span className="font-normal text-brand-ink2/40">· {day}</span></h2>
            <div className="space-y-1.5">
              {list.map((a: any) =>
                isCoordinator && editingId === a.id ? (
                  <div key={a.id} className="py-1">
                    <AppointmentForm
                      initial={{
                        day: a.day, time: a.time || "", customer: a.customer, phone: a.phone || "", address: a.address || "", note: a.note || "",
                        type: a.type || "", status: a.status || "",
                        leadId: a.leadId || "", orderId: a.orderId || "",
                        linkLabel: a.lead ? a.lead.leadNumber : a.order ? a.order.orderNumber : ""
                      }}
                      submitLabel="Gem ændring"
                      onCancel={() => setEditingId(null)}
                      onSubmit={(data) => gemRedigering(a.id, data)}
                    />
                  </div>
                ) : (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm">
                    <div>
                      <span className="font-semibold text-brand-ink">{a.time ? `${a.time} · ` : ""}{a.customer}</span>
                      {a.type && <span className="ml-2 rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">{APPT_TYPE_LABEL[a.type] || a.type}</span>}
                      {a.status && <span className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold ${a.status === "CONFIRMED" ? "bg-brand-green/15 text-brand-greendark" : "bg-amber-50 text-amber-700"}`}>{a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}</span>}
                      {a.lead && <span className="ml-2 text-brand-ink2/55">{a.lead.leadNumber}</span>}
                      {a.order && <span className="ml-2 text-brand-ink2/55">{a.order.orderNumber}</span>}
                      {/* §"antal materialer der skal leveres" for opmåling/installering */}
                      {(a.type === "MAALING" || a.type === "INSTALLATION") && (a.lead?._count?.measurements ?? a.order?._count?.items) != null && (
                        <span className="ml-2 text-brand-ink2/55">· {a.lead?._count?.measurements ?? a.order?._count?.items} materiale(r)</span>
                      )}
                      {a.address && <span className="ml-2 text-brand-ink2/55">· {a.address}</span>}
                      {a.phone && <span className="ml-2 text-brand-ink2/55">· {a.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Bygger: Start/Færdig direkte i kalenderen, kun paa sine egne produktionsopgaver. */}
                      {role === "BUILDER" && a.type === "PRODUKTION" && a.orderId && (
                        <>
                          <button onClick={() => toggleStart(a.orderId, !!a.order?.productionStartedAt)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.order?.productionStartedAt ? "bg-amber-100 text-amber-700" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>{a.order?.productionStartedAt ? "I gang ✓" : "Start"}</button>
                          <button onClick={() => toggleKlar(a.orderId, !!a.order?.readyAt)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.order?.readyAt ? "bg-brand-green/15 text-brand-greendark" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>{a.order?.readyAt ? "Færdig ✓" : "Færdiggjort"}</button>
                        </>
                      )}
                      {detailHref(a) && <a href={detailHref(a)!} className="font-semibold text-brand-blue hover:underline">Se detaljer</a>}
                      {isCoordinator && <button onClick={() => { setEditingId(a.id); setShowCreate(false); }} className="font-semibold text-brand-blue hover:underline">Rediger</button>}
                      {isCoordinator && <button onClick={() => slet(a.id)} className="font-semibold text-red-500 hover:text-red-700">Slet</button>}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
