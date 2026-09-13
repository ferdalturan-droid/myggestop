"use client";
import { useEffect, useState } from "react";

const DEF_PROD_RATES = { tek19: 400, tek28: 450, dub19: 500, dub28: 550 };
const DEF_GARDIN_RATE = 400;

export default function PricesManager() {
  const [pricing, setPricing] = useState<any>(null);
  const [shipping, setShipping] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // RUNDE 3 (§"vedrørende pris skal administreres et sted"): produktions-
  // beregnerens priser (kr/m² for myggenet/gardin) er flyttet hertil fra
  // ImalatCalc, saa Coordinator er det ENESTE sted disse priser kan
  // aendres. /api/imalat-rates er stadig samme kilde - kun UI'en flyttes.
  const [prodRates, setProdRates] = useState(DEF_PROD_RATES);
  const [gardinRate, setGardinRate] = useState(DEF_GARDIN_RATE);
  const [prodSaving, setProdSaving] = useState(false);
  const [prodMsg, setProdMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setPricing(d.settings.pricing);
      setShipping(d.settings.shipping);
    });
    fetch("/api/imalat-rates", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (d.sineklik) setProdRates({ ...DEF_PROD_RATES, ...d.sineklik });
      if (typeof d.perde === "number") setGardinRate(d.perde);
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricing, shipping })
    });
    setSaving(false);
    if (res.ok) { setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2500); }
  }

  async function saveProdRates() {
    setProdSaving(true);
    await Promise.all([
      fetch("/api/imalat-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "SINEKLIK", value: prodRates }) }),
      fetch("/api/imalat-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "PERDE", value: gardinRate }) })
    ]);
    setProdSaving(false);
    setProdMsg("Gemt ✓"); setTimeout(() => setProdMsg(null), 2500);
  }

  if (!pricing) return <p className="text-brand-ink2/60">Indlaeser...</p>;

  const num = (k: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink2">{LABELS[k]}</span>
      <input className="input" inputMode="numeric" value={pricing[k]} onChange={(e) => setPricing({ ...pricing, [k]: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
    </label>
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-brand-ink">Priser & gebyrer</h1>
      <p className="mb-6 text-sm text-brand-ink2/65">Alle priser bruges i prisberegneren og pa nye ordrer.</p>

      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Tillæg & montering</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {num("coloredFrameSurchargePerSqm")}
          {num("doubleDoorSurcharge")}
          {num("installationBaseFee")}
          {num("installationPerProduct")}
        </div>
        <p className="mt-4 rounded-xl bg-brand-mist p-4 text-sm text-brand-ink2/70">
          Produktpriser pr. m² og dobbeltdør-grænser saettes pr. produkt under <strong>Produkter</strong>.
          Farvetillæg kan ogsa saettes individuelt pr. farve under <strong>Farver</strong>.
        </p>
      </div>

      <div className="mt-6 rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Produktionsberegner — priser (kr/m²)</h2>
        <p className="mb-4 text-sm text-brand-ink2/65">Bruges i Produktionsberegneren til at beregne linjepriser. Kun Koordinator kan ændre disse.</p>
        <p className="mb-2 text-sm font-semibold text-brand-ink">Myggenet</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block"><span className="mb-1 block text-sm font-medium text-brand-ink2">Enkelt 1,9</span><input className="input" inputMode="numeric" value={prodRates.tek19} onChange={(e) => setProdRates({ ...prodRates, tek19: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-brand-ink2">Enkelt 2,8</span><input className="input" inputMode="numeric" value={prodRates.tek28} onChange={(e) => setProdRates({ ...prodRates, tek28: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-brand-ink2">Dobbelt 1,9</span><input className="input" inputMode="numeric" value={prodRates.dub19} onChange={(e) => setProdRates({ ...prodRates, dub19: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium text-brand-ink2">Dobbelt 2,8</span><input className="input" inputMode="numeric" value={prodRates.dub28} onChange={(e) => setProdRates({ ...prodRates, dub28: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} /></label>
        </div>
        <p className="mb-2 mt-4 text-sm font-semibold text-brand-ink">Gardin</p>
        <div className="max-w-[200px]"><label className="block"><span className="mb-1 block text-sm font-medium text-brand-ink2">Gardinpris</span><input className="input" inputMode="numeric" value={gardinRate} onChange={(e) => setGardinRate(parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)} /></label></div>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary disabled:opacity-60" disabled={prodSaving} onClick={saveProdRates}>{prodSaving ? "Gemmer..." : "Gem priser"}</button>
          {prodMsg && <span className="text-sm font-medium text-brand-green">{prodMsg}</span>}
        </div>
      </div>

      <div className="mt-6 rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Fragttekst</h2>
        <textarea className="input min-h-[90px]" value={shipping.text} onChange={(e) => setShipping({ ...shipping, text: e.target.value })} />
        <p className="mt-2 text-xs text-brand-ink2/50">Vises pa bestillingssiden og i bekraeftelser. Fragt beregnes ikke automatisk.</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-primary disabled:opacity-60" disabled={saving} onClick={save}>{saving ? "Gemmer..." : "Gem ændringer"}</button>
        {msg && <span className="text-sm font-medium text-brand-green">{msg}</span>}
      </div>
    </div>
  );
}

const LABELS: Record<string, string> = {
  coloredFrameSurchargePerSqm: "Farvet ramme — tillæg pr. m² (DKK)",
  doubleDoorSurcharge: "Dobbeltdør — fast tillæg (DKK)",
  installationBaseFee: "Montering — grundgebyr (DKK)",
  installationPerProduct: "Montering — pr. produkt (DKK)"
};
