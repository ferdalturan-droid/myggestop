"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// RUNDE 9 ("når man trykker 'rediger ordre' kan man tilføje nogle mål og
// forskelligt, ser ikke hvad formålet er her, da det ikke driver noget? så
// vurder dette også"): den tidligere per-produkt-editor herinde var helt
// afkoblet fra de rigtige mål (Measurement-rækker) som produktionen reelt
// bygger efter - at redigere "pris" og "mål" her ændrede ALDRIG noget i
// Produktionsberegneren, saa den drev intet og var bare forvirrende. Den
// er derfor fjernet helt herfra. De rigtige produkt-/måldata redigeres nu
// udelukkende ét sted: Produktionsberegneren (link vises paa ordre-siden
// naar ordren har et lead). Denne side er nu KUN til det der reelt hoerer
// til ordre-niveau: kundeoplysninger, bemærkning, og RUNDE 9's nye
// montering/leverings-valg (som styrer selve post-produktions-processen).
export default function OrderEditForm({ order }: { order: any }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(order.firstName || "");
  const [lastName, setLastName] = useState(order.lastName || "");
  const [phone, setPhone] = useState(order.phone || "");
  const [email, setEmail] = useState(order.email || "");
  const [address, setAddress] = useState(order.address || "");
  const [postalCode, setPostalCode] = useState(order.postalCode || "");
  const [city, setCity] = useState(order.city || "");
  const [note, setNote] = useState(order.note || "");

  // RUNDE 9: reelt ordre-niveau-valg, se schema-kommentarer paa
  // Order.wantsInstallation/deliveryMethod/shippingCost.
  const [wantsInstallation, setWantsInstallation] = useState<boolean>(!!order.wantsInstallation);
  const [deliveryMethod, setDeliveryMethod] = useState<string>(order.deliveryMethod || "AFHENTER_SELV");
  const [shippingCost, setShippingCost] = useState(order.shippingCost != null ? String(order.shippingCost) : "");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const backHref = `/admin/ordrer/${order.id}`;

  async function gem() {
    if (!firstName.trim() || !lastName.trim()) { setErr("Angiv for- og efternavn."); return; }
    setSaving(true);
    setErr(null);
    const payload: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      email,
      address,
      postalCode,
      city,
      note,
      wantsInstallation,
      deliveryMethod
    };
    if (!wantsInstallation && deliveryMethod === "FRAGTES") {
      payload.shippingCost = parseFloat(shippingCost.replace(",", ".")) || 0;
    }
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) {
      // RUNDE 9 ("nogle gange kan man ikke navigere tilbage"): en fast,
      // kendt destination i stedet for router.back() (som intet gør, hvis
      // der ikke er browserhistorik at gaa tilbage til - f.eks. hvis
      // siden er aabnet i en ny fane eller via et direkte link).
      router.push(backHref);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Kunne ikke gemme ændringerne.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Kunde</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Fornavn</span><input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
          <label className="block"><span className="label">Efternavn</span><input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
          <label className="block"><span className="label">Telefon</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="block"><span className="label">E-mail</span><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="label">Adresse</span><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <label className="block"><span className="label">Postnummer</span><input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></label>
          <label className="block"><span className="label">By</span><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></label>
        </div>
        <label className="mt-3 block"><span className="label">Bemærkning</span><textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      </div>

      {/* RUNDE 9 ("Det skal være muligt at vælge om montering skal laves
          eller ikke på ordre niveau... det skal også være muligt at vælge
          'afhenter selv' eller 'fragtet'"): kortet der reelt styrer
          post-produktions-forgreningen. */}
      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-1 font-bold text-brand-ink">Montering & levering</h2>
        <p className="mb-4 text-sm text-brand-ink2/60">Styrer hvad der sker, når ordren er færdigbygget. Monteringstillægget beregnes automatisk ud fra Priser & gebyrer.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setWantsInstallation(true)}
            className={`rounded-xl border-2 p-4 text-left transition ${wantsInstallation ? "border-brand-greendark bg-brand-greendark/5" : "border-brand-line hover:bg-brand-mist"}`}
          >
            <span className="block font-semibold text-brand-ink">Ja — montering</span>
            <span className="block text-xs text-brand-ink2/60">Installatør monterer hos kunden. Tillæg lægges automatisk til prisen.</span>
          </button>
          <button
            type="button"
            onClick={() => setWantsInstallation(false)}
            className={`rounded-xl border-2 p-4 text-left transition ${!wantsInstallation ? "border-brand-greendark bg-brand-greendark/5" : "border-brand-line hover:bg-brand-mist"}`}
          >
            <span className="block font-semibold text-brand-ink">Nej — kun levering</span>
            <span className="block text-xs text-brand-ink2/60">Ingen installatør involveret. Du markerer selv afhentet/fragtet.</span>
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

      {order.leadId && (
        <div className="rounded-xl border border-dashed border-brand-line bg-brand-mist/30 p-4 text-sm text-brand-ink2/70">
          Mål, produkter og priser pr. linje redigeres i Produktionsberegneren, ikke her.{" "}
          <a href={`/admin/imalat?orderId=${order.id}`} className="font-semibold text-brand-greendark hover:underline">Åbn beregner →</a>
        </div>
      )}

      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button onClick={gem} disabled={saving} className="btn-primary py-2.5 text-sm disabled:opacity-50">{saving ? "Gemmer..." : "Gem ændringer"}</button>
        <button type="button" onClick={() => router.push(backHref)} className="btn-secondary py-2.5 text-sm">← Tilbage til ordre</button>
      </div>
    </div>
  );
}
