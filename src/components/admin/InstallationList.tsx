"use client";
import { useEffect, useState } from "react";

export default function InstallationList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/installation", { cache: "no-store" });
      const d = await res.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // RUNDE 4 (§G5): soft validation (bekræft foer markering) + faktisk
  // fejlvisning i stedet for at antage succes.
  async function markerInstalleret(id: string) {
    if (!confirm("Markér ordren som installeret hos kunden? Dette kan herefter kun fortrydes af Koordinator.")) return;
    const res = await fetch(`/api/installation/${id}/installeret`, { method: "POST" });
    if (res.ok) { setMsg("Markeret Installeret ✓"); setTimeout(() => setMsg(null), 2000); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error || "Kunne ikke markere installeret."); setTimeout(() => setMsg(null), 3000); }
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Installationsliste</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Ordrer der er klar til installation, men endnu ikke installeret.</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>
      {msg && <p className="mb-3 text-sm font-medium text-brand-greendark">{msg}</p>}
      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && orders.length === 0 && <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen ordrer venter på installation.</div>}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-3 text-sm">
            <div>
              <span className="font-semibold text-brand-ink">{o.orderNumber} · {o.firstName} {o.lastName}</span>
              <span className="ml-2 text-brand-ink2/55">{o.phone} · {o.address}, {o.postalCode} {o.city}</span>
              <span className="ml-2 text-brand-ink2/55">· Klar {new Date(o.readyAt).toLocaleDateString("da-DK")}</span>
            </div>
            <button onClick={() => markerInstalleret(o.id)} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Marker Installeret</button>
          </div>
        ))}
      </div>
    </div>
  );
}
