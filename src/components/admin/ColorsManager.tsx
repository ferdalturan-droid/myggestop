"use client";
import { useEffect, useState } from "react";

interface C { id?: string; name: string; hex: string; surchargePerSqm: number; isStandard: boolean; isActive: boolean; sortOrder: number; }

export default function ColorsManager() {
  const [colors, setColors] = useState<C[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/colors", { cache: "no-store" }).then((r) => r.json()).then((d) => setColors(d.colors || []));
  }, []);

  function update(i: number, patch: Partial<C>) {
    setColors((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function add() {
    setColors((cs) => [...cs, { name: "Ny farve", hex: "#cccccc", surchargePerSqm: 20, isStandard: false, isActive: true, sortOrder: cs.length }]);
  }
  function remove(i: number) {
    setColors((cs) => cs.filter((_, idx) => idx !== i));
  }
  async function save() {
    setSaving(true);
    const res = await fetch("/api/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colors })
    });
    setSaving(false);
    if (res.ok) { const d = await res.json(); setColors(d.colors); setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2500); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Farver</h1>
          <p className="text-sm text-brand-ink2/65">Standardfarver har intet tillæg. Ovrige farver bruger deres eget tillæg pr. m².</p>
        </div>
        <button className="btn-ghost py-2.5 text-sm" onClick={add}>+ Tilføj farve</button>
      </div>

      <div className="space-y-3">
        {colors.map((c, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl2 border border-brand-line bg-white p-4 shadow-card">
            <input type="color" value={c.hex} onChange={(e) => update(i, { hex: e.target.value })} className="h-10 w-12 rounded border border-brand-line" />
            <input className="input max-w-[200px]" value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Farvenavn" />
            <label className="flex items-center gap-1 text-sm">
              Tillæg/m²
              <input className="input w-24" inputMode="numeric" value={c.surchargePerSqm} onChange={(e) => update(i, { surchargePerSqm: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.isStandard} onChange={(e) => update(i, { isStandard: e.target.checked })} /> Standard</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.isActive !== false} onChange={(e) => update(i, { isActive: e.target.checked })} /> Aktiv</label>
            <button className="ml-auto text-sm font-semibold text-red-500 hover:text-red-600" onClick={() => remove(i)}>Fjern</button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem farver"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}
