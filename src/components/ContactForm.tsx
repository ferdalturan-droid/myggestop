"use client";
import { useState } from "react";
import { IconCheck } from "./Icons";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Noget gik galt");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent)
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-green/15 text-brand-green">
          <IconCheck className="h-8 w-8" />
        </span>
        <h3 className="mt-4 text-xl font-bold text-brand-cream">Tak for din besked!</h3>
        <p className="mt-2 text-brand-cream2/75">Vi vender tilbage hurtigst muligt.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      <div>
        <label className="label text-brand-cream2">Navn *</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label text-brand-cream2">E-mail *</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label text-brand-cream2">Telefon</label>
          <input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label text-brand-cream2">Besked *</label>
        <textarea className="input min-h-[130px]" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      {error && <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? "Sender..." : "Send besked"}
      </button>
    </form>
  );
}
