"use client";
import { useEffect, useState } from "react";

interface C { id?: string; name: string; hex: string; surchargePerSqm: number; isStandard: boolean; isActive: boolean; sortOrder: number; category: string; }

// RUNDE 10 (§E - "alle farver (gardin farve, gardin stang farve, myggenet
// farve) skal kunne oprettes under 'farve'-sektionen så de kan
// vedligeholdes"): tre kategorier i stedet for én flad liste, så hver
// dropdown i systemet (Myggenet Farve/Gardin Farve/Gardin Stang Farve) kan
// tilbyde netop sine egne farver.
const CATEGORIES: { key: string; label: string; hint: string }[] = [
  { key: "MYGGENET", label: "Myggenet Farve", hint: "Bruges til myggenetlinjer og myggenet-delen af Myggenet & Plisser." },
  { key: "GARDIN_STOF", label: "Gardin Farve", hint: "Selve gardinstoffet - bruges til Gardin og Myggenet & Plisser." },
  { key: "GARDIN_STANG", label: "Gardin Stang Farve", hint: "Farven på selve gardinstangen/profilet - bruges kun til Gardin." }
];

export default function ColorsManager() {
  const [colors, setColors] = useState<C[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(CATEGORIES[0].key);

  useEffect(() => {
    fetch("/api/colors", { cache: "no-store" }).then((r) => r.json()).then((d) => setColors(d.colors || []));
  }, []);

  function update(id: string | undefined, idx: number, patch: Partial<C>) {
    setColors((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }
  function add(category: string) {
    setColors((cs) => [...cs, { name: "Ny farve", hex: "#cccccc", surchargePerSqm: 20, isStandard: false, isActive: true, sortOrder: cs.filter((c) => c.category === category).length, category }]);
  }
  function remove(idx: number) {
    setColors((cs) => cs.filter((_, i) => i !== idx));
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

  const cat = CATEGORIES.find((c) => c.key === tab)!;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-brand-ink">Farver</h1>
        <p className="text-sm text-brand-ink2/65">Standardfarver har intet tillæg. Øvrige farver bruger deres eget tillæg pr. m². Tre adskilte biblioteker, ét pr. farvetype.</p>
      </div>

      <div className="mb-4 flex gap-1 rounded-full border border-brand-line bg-white p-1 w-fit">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setTab(c.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === c.key ? "bg-brand-greendark text-white" : "text-brand-ink2 hover:bg-brand-mist"}`}>{c.label}</button>
        ))}
      </div>
      <p className="mb-4 text-sm text-brand-ink2/60">{cat.hint}</p>

      <div className="mb-3 flex justify-end">
        <button className="btn-ghost py-2.5 text-sm" onClick={() => add(cat.key)}>+ Tilføj {cat.label.toLowerCase()}</button>
      </div>

      <div className="space-y-3">
        {colors.map((c, i) => {
          if (c.category !== cat.key) return null;
          return (
            <div key={c.id || `new-${i}`} className="flex flex-wrap items-center gap-3 rounded-xl2 border border-brand-line bg-white p-4 shadow-card">
              <input type="color" value={c.hex} onChange={(e) => update(c.id, i, { hex: e.target.value })} className="h-10 w-12 rounded border border-brand-line" />
              <input className="input max-w-[200px]" value={c.name} onChange={(e) => update(c.id, i, { name: e.target.value })} placeholder="Farvenavn" />
              <label className="flex items-center gap-1 text-sm">
                Tillæg/m²
                <input className="input w-24" inputMode="numeric" value={c.surchargePerSqm} onChange={(e) => update(c.id, i, { surchargePerSqm: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.isStandard} onChange={(e) => update(c.id, i, { isStandard: e.target.checked })} /> Standard</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.isActive !== false} onChange={(e) => update(c.id, i, { isActive: e.target.checked })} /> Aktiv</label>
              <button className="ml-auto text-sm font-semibold text-red-500 hover:text-red-600" onClick={() => remove(i)}>Fjern</button>
            </div>
          );
        })}
        {colors.filter((c) => c.category === cat.key).length === 0 && (
          <p className="rounded-xl border border-dashed border-brand-line bg-brand-mist/30 p-4 text-sm text-brand-ink2/55">Ingen farver i denne kategori endnu.</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem farver"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}
