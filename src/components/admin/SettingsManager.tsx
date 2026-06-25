"use client";
import { useEffect, useRef, useState } from "react";

export default function SettingsManager() {
  const [contact, setContact] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setContact(d.settings.contact);
      setBranding(d.settings.branding);
    });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact, branding }) });
    setSaving(false);
    if (res.ok) { setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2500); }
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await up.json();
    if (up.ok) setBranding({ ...branding, logoUrl: d.url });
  }

  if (!contact || !branding) return <p className="text-brand-ink2/60">Indlaeser...</p>;
  const C = (k: string, label: string, area = false) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{label}</span>
      {area ? <textarea className="input min-h-[70px]" value={contact[k] || ""} onChange={(e) => setContact({ ...contact, [k]: e.target.value })} /> : <input className="input" value={contact[k] || ""} onChange={(e) => setContact({ ...contact, [k]: e.target.value })} />}
    </label>
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Kontakt & logo</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Virksomhedsoplysninger, e-mail til ordrer og logo.</p>

      <section className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Logo</h2>
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-40 place-items-center rounded-xl border border-brand-line bg-brand-ink p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.logoUrl} alt="Logo" className="max-h-full max-w-full brightness-0 invert" />
          </div>
          <div>
            <input ref={logoRef} type="file" accept="image/*" onChange={uploadLogo} className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-white" />
            <p className="mt-1 text-xs text-brand-ink2/50">PNG eller SVG anbefales. Erstatter logoet i hele sitet.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Virksomhed & kontakt</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {C("companyName", "Virksomhedsnavn")}
          {C("cvr", "CVR-nummer")}
          {C("phone", "Telefonnummer")}
          {C("email", "Offentlig e-mail")}
          {C("address", "Adresse")}
          <div className="grid grid-cols-2 gap-3">
            {C("postalCode", "Postnummer")}
            {C("city", "By")}
          </div>
          {C("openingHours", "Abningstider")}
          <div className="sm:col-span-2">{C("serviceAreaText", "Serviceområde-tekst", true)}</div>
        </div>
      </section>

      <section className="mt-6 rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Ordre-email</h2>
        <label className="block max-w-md">
          <span className="mb-1 block text-sm font-medium text-brand-ink2">Admin-email (modtager nye ordrer)</span>
          <input className="input" value={contact.adminEmail || ""} onChange={(e) => setContact({ ...contact, adminEmail: e.target.value })} />
        </label>
        <p className="mt-2 text-xs text-brand-ink2/50">Alle nye ordrer og kontaktbeskeder sendes hertil. SMTP konfigureres i .env-filen.</p>
      </section>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem indstillinger"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}
