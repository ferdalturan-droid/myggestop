"use client";
import { useEffect, useState } from "react";

export default function ProduktionList({ role }: { role?: string } = {}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/produktion", { cache: "no-store" });
      const d = await res.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markerKlar(id: string) {
    await fetch(`/api/produktion/${id}/klar`, { method: "POST" });
    setMsg("Markeret Klar ✓"); setTimeout(() => setMsg(null), 2000);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Produktionskø</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Ordrer der er forfremmet til produktion, i den rækkefølge de er booket.</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>
      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}
      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && orders.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen ordrer i produktion lige nu.</div>}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-3 text-sm">
            <div>
              <span className="font-semibold text-brand-ink">{o.orderNumber} · {o.firstName} {o.lastName}</span>
              <span className="ml-2 text-brand-ink2/55">{o.items?.length || 0} produkt(er) · {o.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/admin/ordrer/${o.id}`} className="text-brand-blue hover:underline">Åbn</a>
              {/* RUNDE 2 (§11.1): Builder maa se ordren, men ikke redigere
                  maal/pris i den ordre-koblede beregner - kun
                  Coordinator/Installer faar dette link. */}
              {role !== "BUILDER" && <a href={`/admin/imalat?orderId=${o.id}`} className="text-brand-greendark hover:underline">Til beregner</a>}
              <button onClick={() => markerKlar(o.id)} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Marker Klar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
