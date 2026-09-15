"use client";
import { useEffect, useState } from "react";

interface S { id?: string; value: string; label: string; isActive: boolean; sortOrder: number; }

// RUNDE 10 (§E - "profilstørrelse skal også kunne oprettes i et bibliotek
// (alt skal læse herfra) du skal bare oprette dem vi har markeret by
// default"): samme redigerings-mønster som Farver.
export default function ProfileSizesManager() {
  const [sizes, setSizes] = useState<S[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile-sizes", { cache: "no-store" }).then((r) => r.json()).then((d) => setSizes(d.sizes || []));
  }, []);

  function update(i: number, patch: Partial<S>) {
    setSizes((ss) => ss.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function add() {
    setSizes((ss) => [...ss, { value: "", label: "", isActive: true, sortOrder: ss.length }]);
  }
  function remove(i: number) {
    setSizes((ss) => ss.filter((_, idx) => idx !== i));
  }
  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile-sizes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sizes }) });
    setSaving(false);
    if (res.ok) { const d = await res.json(); setSizes(d.sizes); setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2500); }
  }

  return (
    <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-brand-ink">Profilstørrelser</h2>
          <p className="text-sm text-brand-ink2/60">Bibliotek over profilstørrelser (system). Bemærk: prisberegningen kender i dag kun to satser (1,9/2,8) - en helt ny størrelse prissættes indtil videre som 2,8-satsen.</p>
        </div>
        <button className="btn-ghost py-2 text-sm" onClick={add}>+ Tilføj</button>
      </div>
      <div className="space-y-2">
        {sizes.map((s, i) => (
          <div key={s.id || i} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-line p-3">
            <label className="flex items-center gap-1 text-sm">Værdi <input className="input w-24" value={s.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="1,9" /></label>
            <label className="flex items-center gap-1 text-sm">Label <input className="input w-32" value={s.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="1,9" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.isActive !== false} onChange={(e) => update(i, { isActive: e.target.checked })} /> Aktiv</label>
            <button className="ml-auto text-sm font-semibold text-red-500 hover:text-red-600" onClick={() => remove(i)}>Fjern</button>
          </div>
        ))}
        {sizes.length === 0 && <p className="text-sm text-brand-ink2/55">Indlæser...</p>}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem profilstørrelser"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}
