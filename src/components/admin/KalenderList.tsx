"use client";
import { useEffect, useState } from "react";

const TYPE_LABEL: Record<string, string> = { MAALING: "Opmåling", INSTALLATION: "Installation" };
const BLANK = {
  day: "", time: "", customer: "", phone: "", address: "", note: "",
  type: "", status: "", resource: "", leadId: "", orderId: "", linkLabel: ""
};

// RUNDE 2 (Q5/Q6): delt formular til baade "+ Ny aftale" og "Rediger" -
// samme felter, samme søge-picker til at koble et Lead/en Order (i stedet
// for at skulle indtaste en rå ID, jf. brugerens eget spørgsmål "der skal
// vel være en id reference jeg kan vælge"). En aftale kan ogsaa gemmes
// helt uden kobling (§Q6 - fri aftale, deltager bare ikke i
// aftenafstemningens cutoff-logik, som allerede kun kigger paa type != null).
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
      await onSubmit(form);
    } catch (err: any) {
      setError(err.message || "Kunne ikke gemme.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card sm:grid-cols-2">
      <div>
        <label className="label">Kobl til lead/ordre (valgfrit)</label>
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

      <div><label className="label">Dato *</label><input type="date" className="input" required value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} /></div>
      <div><label className="label">Klokkeslæt</label><input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>

      <div><label className="label">Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label className="label">Adresse</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>

      <div>
        <label className="label">Type</label>
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="">— Ingen (fri aftale) —</option>
          <option value="MAALING">Opmåling</option>
          <option value="INSTALLATION">Installation</option>
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="">— Ingen —</option>
          <option value="TENTATIVE">Foreløbig</option>
          <option value="CONFIRMED">Bekræftet</option>
        </select>
      </div>
      <div>
        <label className="label">Ressource</label>
        <select className="input" value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })}>
          <option value="">— Ingen —</option>
          <option value="BUILDER">Bygger</option>
          <option value="INSTALLER">Installatør</option>
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

export default function KalenderList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
          <button onClick={() => { setShowCreate((v) => !v); setEditingId(null); }} className="btn-primary py-2 text-sm">{showCreate ? "Luk" : "+ Ny aftale"}</button>
          <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
          <button onClick={koerAftenafstemning} disabled={running} className="btn-secondary py-2 text-sm disabled:opacity-60">{running ? "Kører..." : "Kør aftenafstemning"}</button>
        </div>
      </div>

      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}

      {showCreate && (
        <div className="mb-6">
          <AppointmentForm initial={{}} submitLabel="Opret aftale" onCancel={() => setShowCreate(false)} onSubmit={opret} />
        </div>
      )}

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
              {list.map((a: any) =>
                editingId === a.id ? (
                  <div key={a.id} className="py-1">
                    <AppointmentForm
                      initial={{
                        day: a.day, time: a.time || "", customer: a.customer, phone: a.phone || "", address: a.address || "", note: a.note || "",
                        type: a.type || "", status: a.status || "", resource: a.resource || "",
                        leadId: a.leadId || "", orderId: a.orderId || "",
                        linkLabel: a.lead ? a.lead.leadNumber : a.order ? a.order.orderNumber : ""
                      }}
                      submitLabel="Gem ændring"
                      onCancel={() => setEditingId(null)}
                      onSubmit={(data) => gemRedigering(a.id, data)}
                    />
                  </div>
                ) : (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-line bg-white px-3 py-2 text-sm">
                    <div>
                      <span className="font-semibold text-brand-ink">{a.time ? `${a.time} · ` : ""}{a.customer}</span>
                      {a.type && <span className="ml-2 rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">{TYPE_LABEL[a.type] || a.type}</span>}
                      {a.status && <span className={`ml-2 rounded px-2 py-0.5 text-xs font-semibold ${a.status === "CONFIRMED" ? "bg-brand-green/15 text-brand-greendark" : "bg-amber-50 text-amber-700"}`}>{a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}</span>}
                      {a.lead && <span className="ml-2 text-brand-ink2/55">{a.lead.leadNumber}</span>}
                      {a.order && <span className="ml-2 text-brand-ink2/55">{a.order.orderNumber}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-brand-ink2/55">{a.phone}{a.address ? ` · ${a.address}` : ""}</span>
                      <button onClick={() => { setEditingId(a.id); setShowCreate(false); }} className="font-semibold text-brand-blue hover:underline">Rediger</button>
                      <button onClick={() => slet(a.id)} className="font-semibold text-red-500 hover:text-red-700">Slet</button>
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
