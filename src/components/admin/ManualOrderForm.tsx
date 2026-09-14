"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_SOURCE_MANUAL_OPTIONS } from "@/lib/leadSource";
import { TUR_OPTIONS, SYS_OPTIONS, TIP_OPTIONS, felterRelevanteForTur } from "@/lib/calcOptions";
import { priceOfRow, DEFAULT_IMALAT_RATES, DEFAULT_GARDIN_RATE, ImalatRates } from "@/lib/imalatPricing";

// RUNDE 9 (fuld genskrivning):
// - "Man skal kunne indtaste alle information omkring ordren (per produkt)
//   inkl. mål, type... så prisen automatisk udregnes her" -> hver linje
//   har nu de samme felter som Produktionsberegneren, og prisen regnes
//   automatisk (samme formel, se src/lib/imalatPricing.ts). Den endelige,
//   autoritative pris beregnes ALTID server-side i /api/orders/manual -
//   tallet der vises her undervejs er kun en live-forhåndsvisning.
// - "Når man opretter en manuel ordre, oprettes der et lead - det giver
//   ikke mening" -> denne formular poster nu til /api/orders/manual, som
//   opretter en Order direkte UDEN noget Lead (se den routes kommentarer).
// - Monterings-/leveringsvalget er samme UI-mønster som OrderEditForm, så
//   det opfører sig ens uanset hvor i systemet man sætter det.

interface RowForm {
  uid: number;
  roomName: string;
  tur: string;
  sys: string;
  tip: string;
  layout: string;
  kanat: string;
  adet: string;
  widthMm: string;
  heightMm: string;
  colorName: string;
  comment: string;
}

let uidc = 1;
const blankRow = (): RowForm => ({
  uid: uidc++, roomName: "", tur: "SINEKLIK", sys: "1,9", tip: "TEK", layout: "YANA", kanat: "HAREKETLI",
  adet: "1", widthMm: "", heightMm: "", colorName: "", comment: ""
});

export default function ManualOrderForm({ backHref = "/admin/ordrer" }: { backHref?: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [source, setSource] = useState("PERSONLIG_KONTAKT");
  const [note, setNote] = useState("");

  const [wantsInstallation, setWantsInstallation] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("AFHENTER_SELV");
  const [shippingCost, setShippingCost] = useState("");

  const [rows, setRows] = useState<RowForm[]>([blankRow()]);
  const [rates, setRates] = useState<ImalatRates>(DEFAULT_IMALAT_RATES);
  const [gardinRate, setGardinRate] = useState(DEFAULT_GARDIN_RATE);
  const [colors, setColors] = useState<{ name: string; surchargePerSqm: number; isStandard: boolean }[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/imalat-rates", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (d.sineklik) setRates({ ...DEFAULT_IMALAT_RATES, ...d.sineklik });
      if (typeof d.perde === "number") setGardinRate(d.perde);
    }).catch(() => {});
    fetch("/api/colors", { cache: "no-store" }).then((r) => r.json()).then((d) => setColors(d.colors || [])).catch(() => {});
  }, []);

  function updRow(uid: number, p: Partial<RowForm>) {
    setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  }
  function addRow() { setRows((rs) => [...rs, blankRow()]); }
  function delRow(uid: number) { setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : rs)); }

  function priceFor(r: RowForm) {
    const col = colors.find((c) => c.name === r.colorName);
    const colorSurchargePerSqm = col && !col.isStandard ? col.surchargePerSqm : 0;
    return priceOfRow(
      { tur: r.tur, sys: r.sys, tip: r.tip, widthCm: (parseFloat(r.widthMm) || 0) / 10, heightCm: (parseFloat(r.heightMm) || 0) / 10, adet: parseFloat(r.adet) || 1, colorSurchargePerSqm },
      rates, gardinRate
    );
  }

  const validRows = rows.filter((r) => (parseFloat(r.widthMm) || 0) > 0 && (parseFloat(r.heightMm) || 0) > 0);
  const productsTotal = validRows.reduce((s, r) => s + (priceFor(r)?.price || 0), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("Angiv for- og efternavn."); return; }
    if (validRows.length === 0) { setError("Tilføj mindst ét produkt med bredde og højde."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri: `${firstName.trim()} ${lastName.trim()}`,
          tel: phone,
          adres: address,
          postalCode,
          city,
          note,
          source,
          wantsInstallation,
          deliveryMethod,
          shippingCost: parseFloat(shippingCost.replace(",", ".")) || 0,
          rows: validRows.map((r) => ({
            roomName: r.roomName,
            tur: r.tur, sys: r.sys, tip: r.tip, layout: r.layout, kanat: r.kanat,
            adet: parseFloat(r.adet) || 1,
            widthMm: parseFloat(r.widthMm) || 0,
            heightMm: parseFloat(r.heightMm) || 0,
            colorName: r.colorName,
            comment: r.comment
          }))
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Kunne ikke oprette ordren.");
      router.push(`/admin/ordrer/${d.orderId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="rounded-xl border border-dashed border-brand-line bg-brand-mist/30 p-4 text-sm text-brand-ink2/70">
        Til en kunde der ikke skal igennem den normale lead-proces (fx en ven der ringer direkte). Opretter ordren med det samme, uden noget lead — den følger derefter den almindelige produktions-/leveringsproces.
      </p>

      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Kunde</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Fornavn *</span><input className="input" required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
          <label className="block"><span className="label">Efternavn *</span><input className="input" required value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
          <label className="block"><span className="label">Telefon *</span><input className="input" required value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="block">
            <span className="label">Kilde</span>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              {LEAD_SOURCE_MANUAL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2"><span className="label">Adresse</span><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <label className="block"><span className="label">Postnummer</span><input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></label>
          <label className="block"><span className="label">By</span><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></label>
        </div>
        <label className="mt-3 block"><span className="label">Bemærkning</span><textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      </div>

      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-1 font-bold text-brand-ink">Produkter</h2>
        <p className="mb-4 text-sm text-brand-ink2/60">Samme felter som Produktionsberegneren — prisen udregnes automatisk ud fra mål, type og farve.</p>
        <div className="space-y-3">
          {rows.map((r, i) => {
            const rel = felterRelevanteForTur(r.tur);
            const priced = priceFor(r);
            return (
              <div key={r.uid} className="rounded-xl border border-brand-line p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-greendark">Produkt {i + 1}</span>
                  <div className="flex items-center gap-3">
                    {priced && <span className="text-sm font-semibold text-brand-bluedark">{priced.price.toLocaleString("da-DK")} kr</span>}
                    <button type="button" onClick={() => delRow(r.uid)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Rum</span><input className="input py-2 text-sm" value={r.roomName} onChange={(e) => updRow(r.uid, { roomName: e.target.value })} placeholder="F.eks. Stue" /></label>
                  <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Type</span>
                    <select className="input py-2 text-sm" value={r.tur} onChange={(e) => updRow(r.uid, { tur: e.target.value })}>
                      {TUR_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  {rel.sys && <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">System</span>
                    <select className="input py-2 text-sm" value={r.sys} onChange={(e) => updRow(r.uid, { sys: e.target.value })}>
                      {SYS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>}
                  {rel.tip && <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Udførelse</span>
                    <select className="input py-2 text-sm" value={r.tip} onChange={(e) => updRow(r.uid, { tip: e.target.value })}>
                      {TIP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>}
                  <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Antal</span><input className="input py-2 text-sm" inputMode="numeric" value={r.adet} onChange={(e) => updRow(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                  <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Bredde (mm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.widthMm} onChange={(e) => updRow(r.uid, { widthMm: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                  <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Højde (mm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.heightMm} onChange={(e) => updRow(r.uid, { heightMm: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                  <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Farve</span>
                    <input className="input py-2 text-sm" list={`farver-${r.uid}`} value={r.colorName} onChange={(e) => updRow(r.uid, { colorName: e.target.value })} placeholder="Standard" />
                    <datalist id={`farver-${r.uid}`}>{colors.map((c) => <option key={c.name} value={c.name} />)}</datalist>
                  </label>
                  <label className="block sm:col-span-2"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Kommentar</span><input className="input py-2 text-sm" value={r.comment} onChange={(e) => updRow(r.uid, { comment: e.target.value })} /></label>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addRow} className="btn-secondary mt-3 w-full border-dashed py-2 text-sm">+ Tilføj produkt</button>
        <div className="mt-4 flex justify-between border-t border-brand-line pt-3 text-sm font-semibold text-brand-ink">
          <span>Produkter i alt (foreløbig)</span><span>{productsTotal.toLocaleString("da-DK")} kr</span>
        </div>
      </div>

      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-1 font-bold text-brand-ink">Montering & levering</h2>
        <p className="mb-4 text-sm text-brand-ink2/60">Monteringstillægget beregnes automatisk ud fra Priser & gebyrer, når ordren oprettes.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setWantsInstallation(true)} className={`rounded-xl border-2 p-4 text-left transition ${wantsInstallation ? "border-brand-greendark bg-brand-greendark/5" : "border-brand-line hover:bg-brand-mist"}`}>
            <span className="block font-semibold text-brand-ink">Ja — montering</span>
            <span className="block text-xs text-brand-ink2/60">Tillæg lægges automatisk til prisen.</span>
          </button>
          <button type="button" onClick={() => setWantsInstallation(false)} className={`rounded-xl border-2 p-4 text-left transition ${!wantsInstallation ? "border-brand-greendark bg-brand-greendark/5" : "border-brand-line hover:bg-brand-mist"}`}>
            <span className="block font-semibold text-brand-ink">Nej — kun levering</span>
            <span className="block text-xs text-brand-ink2/60">Kunden afhenter selv, eller ordren fragtes.</span>
          </button>
        </div>
        {!wantsInstallation && (
          <div className="mt-4 border-t border-brand-line pt-4">
            <span className="label mb-2 block">Hvordan får kunden ordren?</span>
            <div className="flex flex-wrap gap-3">
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${deliveryMethod === "AFHENTER_SELV" ? "border-brand-greendark bg-brand-greendark/5 text-brand-ink" : "border-brand-line text-brand-ink2"}`}>
                <input type="radio" className="accent-brand-greendark" checked={deliveryMethod === "AFHENTER_SELV"} onChange={() => setDeliveryMethod("AFHENTER_SELV")} />
                Afhenter selv
              </label>
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${deliveryMethod === "FRAGTES" ? "border-brand-greendark bg-brand-greendark/5 text-brand-ink" : "border-brand-line text-brand-ink2"}`}>
                <input type="radio" className="accent-brand-greendark" checked={deliveryMethod === "FRAGTES"} onChange={() => setDeliveryMethod("FRAGTES")} />
                Fragtes
              </label>
            </div>
            {deliveryMethod === "FRAGTES" && (
              <label className="mt-3 block max-w-[220px]">
                <span className="label">Fragtpris (kr) — indtastes manuelt</span>
                <input className="input" inputMode="decimal" value={shippingCost} onChange={(e) => setShippingCost(e.target.value.replace(/[^0-9.,]/g, ""))} />
              </label>
            )}
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={saving} className="btn-primary py-2.5 text-sm disabled:opacity-60">{saving ? "Opretter..." : "Opret ordre"}</button>
        <button type="button" onClick={() => router.push(backHref)} className="btn-secondary py-2.5 text-sm">Annuller</button>
      </div>
    </form>
  );
}
