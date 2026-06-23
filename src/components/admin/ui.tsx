"use client";
import { useState } from "react";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-brand-ink2/65">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl2 border border-brand-line bg-white p-6 shadow-card ${className}`}>{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-brand-ink2/50">{hint}</span>}
    </label>
  );
}

export function useSaver() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function save(fn: () => Promise<Response>) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Kunne ikke gemme");
      }
      setMsg("Gemt ✓");
      setTimeout(() => setMsg(null), 2500);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }
  return { saving, msg, save };
}
