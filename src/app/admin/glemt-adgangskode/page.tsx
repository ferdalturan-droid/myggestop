"use client";
import { useState } from "react";

export default function GlemtAdgangskode() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/password/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="grain-dark grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <span className="text-2xl font-extrabold text-brand-ink">NORD<span className="text-brand-green">ICA</span></span>
          <p className="mt-1 text-sm text-brand-ink2/60">Glemt adgangskode</p>
        </div>
        {sent ? (
          <p className="text-sm text-brand-ink2/80">Hvis der findes en konto med den e-mail, har vi sendt et link til at nulstille adgangskoden. Tjek din indbakke.</p>
        ) : (
          <form onSubmit={submit}>
            <label className="label">E-mail</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-60">{loading ? "Sender..." : "Send nulstillingslink"}</button>
          </form>
        )}
        <a href="/admin/login" className="mt-4 block text-center text-sm text-brand-ink2/60 hover:underline">← Tilbage til login</a>
      </div>
    </div>
  );
}
