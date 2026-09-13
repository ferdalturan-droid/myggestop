"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, deriveLeadStatusLabel } from "@/lib/leadStatus";

const TABS = [{ key: "", label: "Alle" }, ...LEAD_STAGE_ORDER.map((s) => ({ key: s, label: LEAD_STAGE_LABELS[s] }))];

const blank = { firstName: "", lastName: "", phone: "", email: "", address: "", postalCode: "", city: "", source: "Telefon", productSummary: "", note: "", quotePriceDkk: "", bekraeftNu: false };

export default function LeadsList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(stage: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads${stage ? `?stage=${stage}` : ""}`, { cache: "no-store" });
      const d = await res.json();
      setLeads(d.leads || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(tab); }, [tab]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // RUNDE 2 (§11.5): "bekræft med det samme" opretter leadet direkte som
    // BEKRAEFTET + en pris, hvilket forfremmer det til en ordre i samme
    // kald (§11.6) - giv en tydelig fejl fremfor en ordre til 0 kr., hvis
    // prisen mangler.
    if (form.bekraeftNu && !form.quotePriceDkk) {
      setError("Angiv en pris for at bekræfte leadet med det samme.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke oprette lead.");
      setForm({ ...blank });
      setShowForm(false);
      load(tab);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Leads</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Kunde-henvendelser før de er bekræftet og forfremmet til en ordre.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary py-2 text-sm">{showForm ? "Luk" : "+ Nyt lead"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 grid gap-3 rounded-xl2 border border-brand-line bg-white p-5 shadow-card sm:grid-cols-2">
          <div><label className="label">Fornavn *</label><input className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
          <div><label className="label">Efternavn *</label><input className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          <div><label className="label">Telefon *</label><input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Adresse</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">Postnummer</label><input className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
          <div><label className="label">By</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div>
            <label className="label">Kilde</label>
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option>Telefon</option><option>Hjemmeside</option><option>Henvisning</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Hvad efterspørger kunden?</label><input className="input" value={form.productSummary} onChange={(e) => setForm({ ...form, productSummary: e.target.value })} placeholder="F.eks. 3 myggenet, 1 plisségardin" /></div>
          <div className="sm:col-span-2"><label className="label">Note</label><textarea className="input min-h-[70px]" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>

          {/* RUNDE 2 (§11.5): kend allerede prisen og vil bekræfte med det
              samme (fx et gennemarbejdet telefonsalg)? Så oprettes leadet
              direkte som Bekræftet, hvilket forfremmer det til en ordre i
              samme kald (§11.6) - springer hele den almindelige pipeline
              over med vilje, kun til brug når det reelt er aftalt. */}
          <div className="sm:col-span-2 rounded-lg border border-dashed border-brand-line bg-brand-mist/30 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
              <input type="checkbox" checked={form.bekraeftNu} onChange={(e) => setForm({ ...form, bekraeftNu: e.target.checked })} />
              Bekræft med det samme (aftale + pris kendt allerede)
            </label>
            {form.bekraeftNu && (
              <label className="mt-2 block max-w-xs"><span className="label">Pris i kr.</span>
                <input className="input" type="number" required value={form.quotePriceDkk} onChange={(e) => setForm({ ...form, quotePriceDkk: e.target.value })} />
              </label>
            )}
          </div>

          {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button disabled={saving} className="btn-primary sm:col-span-2 disabled:opacity-60">{saving ? "Opretter..." : form.bekraeftNu ? "Opret og bekræft lead" : "Opret lead"}</button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? "bg-brand-greendark text-white" : "border border-brand-line text-brand-ink2 hover:bg-brand-mist"}`}>{t.label}</button>
        ))}
      </div>

      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && leads.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen leads her endnu.</div>}

      <div className="space-y-2">
        {leads.map((l) => (
          <Link key={l.id} href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-3 text-sm hover:bg-brand-mist">
            <div>
              <span className="font-semibold text-brand-ink">{l.leadNumber} · {l.firstName} {l.lastName}</span>
              <span className="ml-2 text-brand-ink2/55">{l.phone}{l.city ? ` · ${l.city}` : ""}{l.productSummary ? ` · ${l.productSummary}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              {l.order && <span className="rounded bg-brand-green/15 px-2 py-0.5 text-xs font-semibold text-brand-greendark">Forfremmet: {l.order.orderNumber}</span>}
              <span className="rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">{deriveLeadStatusLabel(l.stage, l.measuredAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
