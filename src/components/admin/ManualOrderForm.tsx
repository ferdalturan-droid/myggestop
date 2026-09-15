"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_SOURCE_MANUAL_OPTIONS } from "@/lib/leadSource";
import { priceOfRow, sumColorSurcharge, DEFAULT_IMALAT_RATES, DEFAULT_GARDIN_RATE, ImalatRates } from "@/lib/imalatPricing";
import { MeasurementRowFields, BLANK_ROW, RowValue } from "./MeasurementRowFields";

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
//
// RUNDE 10 (§M - "hvis manuel ordre oprettes skal pris og alle detaljer
// vedrørende ordren kunne editeres og vælges af installatør og
// koordinator"): samme formular genbruges nu ogsaa til REDIGERING af en
// allerede oprettet manuel ordre, via det valgfrie initialOrder-prop -
// /api/orders/manual understøttede allerede en orderId-baseret
// opdateringssti (brugt af Produktionsberegneren), men UI'en herfra havde
// ingen vej ind i den for en almindelig manuel ordre - kun "opret ny" var
// muligt. Fuld fri redigering (mål, farve, pris, kundeoplysninger) er
// bevidst kun tilgængelig her, netop fordi en manuel ordre ALDRIG har et
// lead bagved med en allerede aftalt/fastlaast pris.
//
// RUNDE 10 (§C/§E - kategoriseret dropdown-skema): produktlinjerne bruger
// nu den samme delte MeasurementRowFields-komponent som Leads' "Mål"-
// sektion og Installatørens Opmålingsliste (undertype, profilstørrelse-
// bibliotek, tre farvetyper) - ellers ville en manuel ordre have et helt
// andet, ældre sæt produktfelter end resten af systemet.

let uidc = 1;
const blankRow = (): RowValue & { uid: number } => ({ uid: uidc++, ...BLANK_ROW });

export default function ManualOrderForm({ backHref = "/admin/ordrer", initialOrder }: { backHref?: string; initialOrder?: any }) {
  const router = useRouter();
  const erRedigering = !!initialOrder;
  const [firstName, setFirstName] = useState(initialOrder?.firstName || "");
  const [lastName, setLastName] = useState(initialOrder?.lastName || "");
  const [phone, setPhone] = useState(initialOrder?.phone || "");
  const [address, setAddress] = useState(initialOrder?.address || "");
  const [postalCode, setPostalCode] = useState(initialOrder?.postalCode || "");
  const [city, setCity] = useState(initialOrder?.city || "");
  const [source, setSource] = useState(initialOrder?.source || "PERSONLIG_KONTAKT");
  const [note, setNote] = useState(initialOrder?.note || "");

  const [wantsInstallation, setWantsInstallation] = useState(!!initialOrder?.wantsInstallation);
  const [deliveryMethod, setDeliveryMethod] = useState(initialOrder?.deliveryMethod || "AFHENTER_SELV");
  const [shippingCost, setShippingCost] = useState(initialOrder?.shippingCost != null ? String(initialOrder.shippingCost) : "");

  // RUNDE 10 (§M): en manuel ordres egne Measurement-rækker (koblet via
  // orderId, ikke leadId) er den eneste kilde der har de fulde felter
  // (tur/sys/tip/layout/kanat/subType/fabricColorName/rodColorName) -
  // OrderItem alene har ikke nok til at genopbygge en redigerbar linje.
  // Findes ingen (bagudkompatibel manuel ordre fra før dette fandtes),
  // startes med én tom linje som ved oprettelse.
  const [rows, setRows] = useState<(RowValue & { uid: number })[]>(() => {
    if (initialOrder?.measurements?.length > 0) {
      return initialOrder.measurements.map((m: any) => ({
        uid: uidc++,
        roomName: m.roomName || "",
        tur: m.tur || "SINEKLIK",
        sys: m.sys || "1,9",
        tip: m.tip || "TEK",
        layout: m.layout || "YANA",
        kanat: m.kanat || "HAREKETLI",
        subType: m.subType || "NORMAL",
        adet: m.adet ?? 1,
        widthMm: m.widthMm ?? "",
        heightMm: m.heightMm ?? "",
        colorName: m.colorName || "",
        fabricColorName: m.fabricColorName || "",
        rodColorName: m.rodColorName || "",
        comment: m.comment || ""
      }));
    }
    return [blankRow()];
  });
  const [rates, setRates] = useState<ImalatRates>(DEFAULT_IMALAT_RATES);
  const [gardinRate, setGardinRate] = useState(DEFAULT_GARDIN_RATE);
  const [colors, setColors] = useState<{ name: string; surchargePerSqm: number; isStandard: boolean; category?: string }[]>([]);
  const [profileSizes, setProfileSizes] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/imalat-rates", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (d.sineklik) setRates({ ...DEFAULT_IMALAT_RATES, ...d.sineklik });
      if (typeof d.perde === "number") setGardinRate(d.perde);
    }).catch(() => {});
    fetch("/api/colors", { cache: "no-store" }).then((r) => r.json()).then((d) => setColors(d.colors || [])).catch(() => {});
    fetch("/api/profile-sizes", { cache: "no-store" }).then((r) => r.json()).then((d) => setProfileSizes(d.sizes || [])).catch(() => {});
  }, []);

  function updRow(uid: number, p: Partial<RowValue>) {
    setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  }
  function addRow() { setRows((rs) => [...rs, blankRow()]); }
  function delRow(uid: number) { setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : rs)); }

  function priceFor(r: RowValue) {
    const colorSurchargePerSqm = sumColorSurcharge(colors, { colorName: r.colorName, fabricColorName: r.fabricColorName, rodColorName: r.rodColorName }, r.tur);
    return priceOfRow(
      { tur: r.tur, sys: r.sys, tip: r.tip, widthCm: (parseFloat(String(r.widthMm)) || 0) / 10, heightCm: (parseFloat(String(r.heightMm)) || 0) / 10, adet: Number(r.adet) || 1, colorSurchargePerSqm },
      rates, gardinRate
    );
  }

  const validRows = rows.filter((r) => (parseFloat(String(r.widthMm)) || 0) > 0 && (parseFloat(String(r.heightMm)) || 0) > 0);
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
          ...(erRedigering ? { orderId: initialOrder.id } : {}),
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
            tur: r.tur, sys: r.sys, tip: r.tip, layout: r.layout, kanat: r.kanat, subType: r.subType,
            adet: Number(r.adet) || 1,
            widthMm: parseFloat(String(r.widthMm)) || 0,
            heightMm: parseFloat(String(r.heightMm)) || 0,
            colorName: r.colorName,
            fabricColorName: r.fabricColorName,
            rodColorName: r.rodColorName,
            comment: r.comment
          }))
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || (erRedigering ? "Kunne ikke gemme ændringerne." : "Kunne ikke oprette ordren."));
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
        {erRedigering
          ? "Denne ordre blev oprettet manuelt (uden lead) - alle detaljer, mål og priser kan frit redigeres her, af både Installatør og Koordinator."
          : "Til en kunde der ikke skal igennem den normale lead-proces (fx en ven der ringer direkte). Opretter ordren med det samme, uden noget lead — den følger derefter den almindelige produktions-/leveringsproces."}
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
        <p className="mb-4 text-sm text-brand-ink2/60">Samme felter og dropdowns som resten af systemet — prisen udregnes automatisk ud fra mål, type og farve.</p>
        <div className="space-y-3">
          {rows.map((r, i) => {
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
                <MeasurementRowFields
                  value={r}
                  onField={(patch) => updRow(r.uid, patch)}
                  colors={colors}
                  profileSizes={profileSizes}
                />
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
        <button disabled={saving} className="btn-primary py-2.5 text-sm disabled:opacity-60">{saving ? "Gemmer..." : erRedigering ? "Gem ændringer" : "Opret ordre"}</button>
        <button type="button" onClick={() => router.push(backHref)} className="btn-secondary py-2.5 text-sm">Annuller</button>
      </div>
    </form>
  );
}
