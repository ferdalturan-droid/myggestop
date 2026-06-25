"use client";
import { useEffect, useState } from "react";

export default function ContentManager() {
  const [home, setHome] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/content").then((r) => r.json()).then((d) => setHome(d.home));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ home }) });
    setSaving(false);
    if (res.ok) { setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2500); }
  }

  if (!home) return <p className="text-brand-ink2/60">Indlaeser...</p>;
  const T = (k: string, label: string, area = false) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{label}</span>
      {area ? (
        <textarea className="input min-h-[80px]" value={home[k] || ""} onChange={(e) => setHome({ ...home, [k]: e.target.value })} />
      ) : (
        <input className="input" value={home[k] || ""} onChange={(e) => setHome({ ...home, [k]: e.target.value })} />
      )}
    </label>
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Forside-indhold</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Rediger teksterne pa forsiden.</p>

      <div className="space-y-6">
        <section className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
          <h2 className="mb-4 font-bold text-brand-ink">Hero</h2>
          <div className="space-y-3">
            {T("heroEyebrow", "Lille overskrift")}
            {T("heroTitle", "Hovedoverskrift", true)}
            {T("heroSubtitle", "Underrubrik", true)}
            <div className="grid grid-cols-2 gap-3">
              {T("heroCtaPrimary", "Primær knap")}
              {T("heroCtaSecondary", "Sekundær knap")}
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-brand-ink2">USP-punkter (en pr. linje)</span>
              <textarea className="input min-h-[80px]" value={(home.uspBar || []).join("\n")} onChange={(e) => setHome({ ...home, uspBar: e.target.value.split("\n").filter(Boolean) })} />
            </label>
          </div>
        </section>

        <section className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
          <h2 className="mb-4 font-bold text-brand-ink">Intro-sektion</h2>
          <div className="space-y-3">{T("introTitle", "Overskrift")}{T("introText", "Tekst", true)}</div>
        </section>

        <section className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
          <h2 className="mb-4 font-bold text-brand-ink">Call-to-action</h2>
          <div className="space-y-3">{T("ctaTitle", "Overskrift")}{T("ctaText", "Tekst", true)}{T("ctaButton", "Knaptekst")}</div>
        </section>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem indhold"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}
