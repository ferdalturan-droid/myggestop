"use client";
import { useEffect, useState } from "react";
import { formatDKK } from "@/lib/pricing";

interface P {
  id: string; name: string; shortText: string; description: string;
  pricePerSqm: number; maxWidthMm: number; maxHeightMm: number;
  minWidthMm: number; minHeightMm: number; doubleDoorThresholdMm: number | null;
  isActive: boolean; sortOrder: number; features: string[];
}

const empty = (): Partial<P> => ({
  name: "", shortText: "", description: "", pricePerSqm: 500,
  maxWidthMm: 2500, maxHeightMm: 2500, minWidthMm: 150, minHeightMm: 150,
  doubleDoorThresholdMm: 1200, isActive: true, sortOrder: 99, features: []
});

export default function ProductsManager() {
  const [products, setProducts] = useState<P[]>([]);
  const [edit, setEdit] = useState<Partial<P> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const d = await (await fetch("/api/products")).json();
    setProducts((d.products || []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!edit) return;
    const body = { ...edit, features: (edit.features || []).filter(Boolean) };
    const res = edit.id
      ? await fetch(`/api/products/${edit.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setEdit(null); setMsg("Gemt ✓"); load(); setTimeout(() => setMsg(null), 2000); }
  }
  async function remove(id: string) {
    if (!confirm("Slet dette produkt?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-ink">Produkter</h1>
        <button className="btn-primary py-2.5 text-sm" onClick={() => setEdit(empty())}>+ Nyt produkt</button>
      </div>
      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}

      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-brand-ink">{p.name} {!p.isActive && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">Skjult</span>}</h3>
                <p className="text-sm text-brand-ink2/65">{p.shortText}</p>
                <p className="mt-1 text-sm text-brand-ink2/80">
                  {formatDKK(p.pricePerSqm)}/m² · max {p.maxWidthMm}×{p.maxHeightMm} mm
                  {p.doubleDoorThresholdMm ? ` · Dobbeltdør > ${p.doubleDoorThresholdMm} mm` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost py-2 text-sm" onClick={() => setEdit(p)}>Rediger</button>
                <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50" onClick={() => remove(p.id)}>Slet</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEdit(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-brand-ink">{edit.id ? "Rediger produkt" : "Nyt produkt"}</h2>
            <div className="space-y-3">
              <Inp label="Navn" v={edit.name} on={(v) => setEdit({ ...edit, name: v })} />
              <Inp label="Kort tekst" v={edit.shortText} on={(v) => setEdit({ ...edit, shortText: v })} />
              <div>
                <span className="mb-1 block text-sm font-medium text-brand-ink2">Beskrivelse</span>
                <textarea className="input min-h-[80px]" value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInp label="Pris pr. m² (DKK)" v={edit.pricePerSqm} on={(v) => setEdit({ ...edit, pricePerSqm: v })} />
                <NumInp label="Sortering" v={edit.sortOrder} on={(v) => setEdit({ ...edit, sortOrder: v })} />
                <NumInp label="Max bredde (mm)" v={edit.maxWidthMm} on={(v) => setEdit({ ...edit, maxWidthMm: v })} />
                <NumInp label="Max højde (mm)" v={edit.maxHeightMm} on={(v) => setEdit({ ...edit, maxHeightMm: v })} />
                <NumInp label="Min bredde (mm)" v={edit.minWidthMm} on={(v) => setEdit({ ...edit, minWidthMm: v })} />
                <NumInp label="Min højde (mm)" v={edit.minHeightMm} on={(v) => setEdit({ ...edit, minHeightMm: v })} />
              </div>
              <NumInp label="Dobbeltdør-grænse (mm, tom = fra)" v={edit.doubleDoorThresholdMm ?? ("" as any)} on={(v) => setEdit({ ...edit, doubleDoorThresholdMm: v })} allowEmpty />
              <div>
                <span className="mb-1 block text-sm font-medium text-brand-ink2">Egenskaber (en pr. linje)</span>
                <textarea className="input min-h-[80px]" value={(edit.features || []).join("\n")} onChange={(e) => setEdit({ ...edit, features: e.target.value.split("\n") })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={edit.isActive !== false} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} /> Aktiv (vises pa sitet)
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="btn-primary flex-1" onClick={save}>Gem</button>
              <button className="btn-ghost flex-1" onClick={() => setEdit(null)}>Annuller</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, v, on }: { label: string; v: any; on: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{label}</span>
      <input className="input" value={v ?? ""} onChange={(e) => on(e.target.value)} />
    </label>
  );
}
function NumInp({ label, v, on, allowEmpty }: { label: string; v: any; on: (v: any) => void; allowEmpty?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{label}</span>
      <input className="input" inputMode="numeric" value={v ?? ""} onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        on(raw === "" ? (allowEmpty ? null : 0) : parseInt(raw));
      }} />
    </label>
  );
}
