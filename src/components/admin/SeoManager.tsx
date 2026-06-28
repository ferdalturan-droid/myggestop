"use client";
import { useEffect, useState } from "react";

export default function SeoManager() {
  const [seo, setSeo] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/seo", { cache: "no-store" }).then((r) => r.json()).then((d) => setSeo(d.seo));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/seo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seo }) });
    setSaving(false);
    if (res.ok) { setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2500); }
  }
  if (!seo) return <p className="text-brand-ink2/60">Indlaeser...</p>;
  const T = (k: string, label: string, area = false) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{label}</span>
      {area ? <textarea className="input min-h-[80px]" value={seo[k] || ""} onChange={(e) => setSeo({ ...seo, [k]: e.target.value })} /> : <input className="input" value={seo[k] || ""} onChange={(e) => setSeo({ ...seo, [k]: e.target.value })} />}
    </label>
  );
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">SEO-indstillinger</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Titler, beskrivelser og nogleord til sogemaskiner og deling.</p>
      <div className="space-y-4 rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        {T("siteName", "Sitenavn")}
        {T("defaultTitle", "Standard sidetitel", true)}
        {T("defaultDescription", "Standard meta-beskrivelse", true)}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-brand-ink2">Nogleord (komma-adskilt)</span>
          <textarea className="input min-h-[70px]" value={(seo.keywords || []).join(", ")} onChange={(e) => setSeo({ ...seo, keywords: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
        </label>
        {T("ogImage", "Open Graph billede (URL)")}
        {T("locale", "Sprog/locale (f.eks. da_DK)")}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem SEO"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}
