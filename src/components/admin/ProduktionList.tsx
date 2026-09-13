"use client";
import { useEffect, useState } from "react";

// RUNDE 4 (§G5): "i gang" og "klar" er nu tydelige, envejs-handlinger med
// en kort bekræftelse ("soft validation") - når en handling er udført,
// låses den (vises som en færdig-tilstand) i stedet for en knap man kan
// trykke på igen. Kun Koordinator kan fortryde en fejlagtig markering
// (se OrderStageControl.tsx på selve ordre-siden).
export default function ProduktionList({ role }: { role?: string } = {}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const erKoordinator = role === "COORDINATOR";

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

  async function markerIGang(id: string) {
    if (!confirm("Markér ordren som i gang? Koordinator kan se dette med det samme.")) return;
    const res = await fetch(`/api/produktion/${id}/start`, { method: "POST" });
    if (res.ok) { setMsg("Markeret I gang ✓"); setTimeout(() => setMsg(null), 2000); load(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Kunne ikke markere i gang."); setTimeout(() => setMsg(null), 3000); }
  }

  async function markerKlar(id: string) {
    if (!confirm("Markér ordren som klar i produktion? Den bliver herefter synlig for installation, og kan ikke ændres af dig igen.")) return;
    const res = await fetch(`/api/produktion/${id}/klar`, { method: "POST" });
    if (res.ok) { setMsg("Markeret Klar ✓"); setTimeout(() => setMsg(null), 2000); load(); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Kunne ikke markere klar."); setTimeout(() => setMsg(null), 3000); }
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
              {o.productionStartedAt && !o.readyAt && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">I gang</span>}
              {o.readyAt && <span className="ml-2 rounded-full bg-brand-greendark/15 px-2 py-0.5 text-xs font-semibold text-brand-greendark">Klar ✓</span>}
            </div>
            <div className="flex items-center gap-2">
              {/* RUNDE 4 (§G4): ingen separat "skub til beregner"-knap
                  laengere - at aabne en produktionsopgave ER at gaa i gang
                  med at bygge den, saa "Åbn" foerer direkte til
                  beregneren (ordre-koblet ?orderId=). Ren visning af
                  kunde-/ordredetaljer findes fortsat paa /admin/ordrer/[id]
                  hvis nogen har brug for det - se linket i beregneren. */}
              <a href={`/admin/imalat?orderId=${o.id}`} className="text-brand-greendark hover:underline">Åbn</a>
              <a href={`/admin/ordrer/${o.id}`} className="text-brand-blue hover:underline">Ordredetaljer</a>
              {!o.readyAt && !o.productionStartedAt && (
                <button onClick={() => markerIGang(o.id)} className="rounded-full border border-brand-line px-3 py-1 text-xs font-semibold text-brand-ink2 hover:bg-brand-mist">I gang</button>
              )}
              {!o.readyAt && (
                <button onClick={() => markerKlar(o.id)} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Marker Klar</button>
              )}
              {o.readyAt && erKoordinator && (
                <span className="text-xs text-brand-ink2/40">Fortryd på ordresiden ved fejl</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
