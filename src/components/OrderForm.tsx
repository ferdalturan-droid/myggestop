"use client";
import { useMemo, useState } from "react";
import { calcLine, calcOrderTotals, formatDKK, PricingConfig } from "@/lib/pricing";
import { IconCheck } from "./Icons";

interface Product {
  id: string;
  name: string;
  pricePerSqm: number;
  maxWidthMm: number;
  maxHeightMm: number;
  minWidthMm: number;
  minHeightMm: number;
  doubleDoorThresholdMm: number | null;
}
interface Color {
  id: string;
  name: string;
  hex: string;
  surchargePerSqm: number;
  isStandard: boolean;
}

interface LineState {
  uid: number;
  roomName: string;
  productId: string;
  widthMm: string;
  heightMm: string;
  colorId: string;
  comment: string;
}

const ROOM_SUGGESTIONS = ["Kokken", "Stue", "Sovevaerelse", "Kontor", "Badevaerelse", "Bornevaerelse", "Entre", "Altan", "Terrasse"];

let counter = 1;
const newLine = (productId: string, colorId: string): LineState => ({
  uid: counter++,
  roomName: "",
  productId,
  widthMm: "",
  heightMm: "",
  colorId,
  comment: ""
});

export default function OrderForm({
  products,
  colors,
  config,
  shippingText
}: {
  products: Product[];
  colors: Color[];
  config: PricingConfig;
  shippingText: string;
}) {
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    postalCode: "",
    city: ""
  });
  const [wantsInstallation, setWantsInstallation] = useState(false);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineState[]>([newLine(products[0]?.id || "", colors.find((c) => c.isStandard)?.id || colors[0]?.id || "")]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const computed = useMemo(() => {
    const cfg = config;
    const perLine = lines.map((l) => {
      const product = products.find((p) => p.id === l.productId);
      const color = colors.find((c) => c.id === l.colorId) || null;
      const w = parseInt(l.widthMm) || 0;
      const h = parseInt(l.heightMm) || 0;
      if (!product || w <= 0 || h <= 0) {
        return { res: null as any, product, color, w, h, tooWide: false };
      }
      const res = calcLine(
        {
          widthMm: w,
          heightMm: h,
          product: { pricePerSqm: product.pricePerSqm, doubleDoorThresholdMm: product.doubleDoorThresholdMm },
          color: color ? { surchargePerSqm: color.surchargePerSqm, isStandard: color.isStandard } : null
        },
        cfg
      );
      const tooWide = w > product.maxWidthMm || h > product.maxHeightMm;
      return { res, product, color, w, h, tooWide };
    });
    const valid = perLine.filter((x) => x.res).map((x) => x.res);
    const totals = calcOrderTotals(valid, wantsInstallation, cfg);
    return { perLine, totals };
  }, [lines, wantsInstallation, products, colors, config]);

  const update = (uid: number, patch: Partial<LineState>) =>
    setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, newLine(products[0]?.id || "", colors.find((c) => c.isStandard)?.id || colors[0]?.id || "")]);
  const removeLine = (uid: number) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.uid !== uid) : ls));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ready = lines.filter((l) => (parseInt(l.widthMm) || 0) > 0 && (parseInt(l.heightMm) || 0) > 0 && l.productId);
    if (ready.length === 0) {
      setError("Tilfoj mindst et produkt med bredde og hojde.");
      return;
    }
    const tooWide = computed.perLine.some((x) => x.tooWide);
    if (tooWide) {
      setError("Et eller flere mal overstiger produktets maksimum. Ret venligst malene.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          wantsInstallation,
          note,
          items: ready.map((l) => ({
            productId: l.productId,
            roomName: l.roomName,
            widthMm: parseInt(l.widthMm),
            heightMm: parseInt(l.heightMm),
            colorId: l.colorId,
            comment: l.comment
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Noget gik galt");
      setResult({ orderNumber: data.orderNumber });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-green/15 text-brand-greendark">
          <IconCheck className="h-9 w-9" />
        </span>
        <h2 className="h-title mt-6 text-3xl">Tak for din bestilling!</h2>
        <p className="mt-3 text-brand-ink2/80">
          Dit ordrenummer er <strong className="text-brand-bluedark">{result.orderNumber}</strong>.
        </p>
        <p className="mx-auto mt-3 max-w-md text-brand-ink2/75">
          Vi har sendt en bekraeftelse med PDF til din e-mail. Dette er en uforpligtende anmodning — vi kontakter dig
          hurtigst muligt vedrorende endelig pris, levering og evt. montering.
        </p>
        <a href="/" className="btn-primary mt-8">
          Tilbage til forsiden
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Kundeoplysninger */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-ink">1. Dine oplysninger</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Fornavn *</label>
            <input className="input" required value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} />
          </div>
          <div>
            <label className="label">Efternavn *</label>
            <input className="input" required value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} />
          </div>
          <div>
            <label className="label">Telefonnummer *</label>
            <input className="input" required type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input className="input" required type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Adresse *</label>
            <input className="input" required value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Postnummer *</label>
            <input className="input" required value={customer.postalCode} onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })} />
          </div>
          <div>
            <label className="label">By *</label>
            <input className="input" required value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Produkter */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-ink">2. Dine produkter</h2>
          <span className="rounded-full bg-brand-mist px-3 py-1 text-xs font-semibold text-brand-ink2">{lines.length} stk.</span>
        </div>

        <div className="mt-6 space-y-5">
          {lines.map((l, idx) => {
            const c = computed.perLine[idx];
            const product = c?.product;
            return (
              <div key={l.uid} className="rounded-xl2 border border-brand-line bg-brand-mist/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-bluedark shadow-card">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-blue text-[11px] text-white">{idx + 1}</span>
                    {l.roomName ? l.roomName : `Produkt ${idx + 1}`}
                  </span>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(l.uid)} className="text-sm font-medium text-red-500 hover:text-red-600">
                      Fjern
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Rum navn</label>
                    <input className="input" list={`rooms-${l.uid}`} placeholder="F.eks. Kokken" value={l.roomName} onChange={(e) => update(l.uid, { roomName: e.target.value })} />
                    <datalist id={`rooms-${l.uid}`}>
                      {ROOM_SUGGESTIONS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="label">Produkttype</label>
                    <select className="input" value={l.productId} onChange={(e) => update(l.uid, { productId: e.target.value })}>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatDKK(p.pricePerSqm)}/m²
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Bredde (mm)</label>
                    <input className="input" inputMode="numeric" placeholder="f.eks. 800" value={l.widthMm} onChange={(e) => update(l.uid, { widthMm: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div>
                    <label className="label">Hojde (mm)</label>
                    <input className="input" inputMode="numeric" placeholder="f.eks. 1200" value={l.heightMm} onChange={(e) => update(l.uid, { heightMm: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div>
                    <label className="label">Farve</label>
                    <select className="input" value={l.colorId} onChange={(e) => update(l.uid, { colorId: e.target.value })}>
                      {colors.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                          {!col.isStandard ? " (+tillaeg)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Kommentar</label>
                    <input className="input" placeholder="Valgfri" value={l.comment} onChange={(e) => update(l.uid, { comment: e.target.value })} />
                  </div>
                </div>

                {/* live beregning pr. linje */}
                {c?.res && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-white px-4 py-3 text-sm shadow-card">
                    <span className="text-brand-ink2/70">
                      Areal (afrundet): <strong className="text-brand-ink">{c.res.areaSqm.toString().replace(".", ",")} m²</strong>
                    </span>
                    {c.res.isDoubleDoor && (
                      <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-bluedark">Dobbeltdor +{formatDKK(c.res.doubleDoorSurcharge)}</span>
                    )}
                    {c.res.colorSurcharge > 0 && (
                      <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-semibold text-brand-greendark">Farvetillaeg +{formatDKK(c.res.colorSurcharge)}</span>
                    )}
                    <span className="ml-auto font-bold text-brand-bluedark">{formatDKK(c.res.lineTotal)}</span>
                  </div>
                )}
                {c?.tooWide && product && (
                  <p className="mt-2 text-sm font-medium text-red-500">
                    Malene overstiger maksimum for {product.name} (max {product.maxWidthMm}×{product.maxHeightMm} mm). Kontakt os for storre losninger.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addLine} className="btn-ghost mt-5 w-full border-dashed">
          + Tilfoj endnu et produkt
        </button>
      </section>

      {/* Montering + total */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-ink">3. Montering & oversigt</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${wantsInstallation ? "border-brand-blue bg-brand-blue/5" : "border-brand-line"}`}>
            <input type="radio" name="install" className="mt-1" checked={wantsInstallation} onChange={() => setWantsInstallation(true)} />
            <span>
              <span className="block font-semibold text-brand-ink">Jeg onsker montering</span>
              <span className="block text-sm text-brand-ink2/70">Kun Kobenhavn og omegn. Grundgebyr + pris pr. produkt tilfojes.</span>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${!wantsInstallation ? "border-brand-blue bg-brand-blue/5" : "border-brand-line"}`}>
            <input type="radio" name="install" className="mt-1" checked={!wantsInstallation} onChange={() => setWantsInstallation(false)} />
            <span>
              <span className="block font-semibold text-brand-ink">Kun levering</span>
              <span className="block text-sm text-brand-ink2/70">Vi sender dine net direkte til doren i hele Danmark.</span>
            </span>
          </label>
        </div>

        <div className="mt-5">
          <label className="label">Bemaerkning til ordren (valgfri)</label>
          <textarea className="input min-h-[90px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Saerlige onsker, leveringsinfo m.m." />
        </div>

        <div className="mt-6 rounded-xl2 bg-brand-ink p-6 text-white">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Produkter i alt</span>
              <span>{formatDKK(computed.totals.productsTotal)}</span>
            </div>
            {wantsInstallation && (
              <div className="flex justify-between">
                <span className="text-slate-300">Montering</span>
                <span>{formatDKK(computed.totals.installationTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-300">Fragt</span>
              <span className="text-slate-300">Efter aftale</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-white/15 pt-3 text-lg font-bold">
              <span>Estimeret total</span>
              <span className="text-brand-green">{formatDKK(computed.totals.estimatedTotal)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Prisen er et uforpligtende estimat. Arealet afrundes kommercielt op til naermeste 0,5 m². {shippingText}
          </p>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-green mt-6 w-full text-base disabled:opacity-60">
          {submitting ? "Sender..." : "Send bestilling / anmod om tilbud"}
        </button>
        <p className="mt-3 text-center text-xs text-brand-ink2/60">Ingen online betaling — vi kontakter dig med endelig pris.</p>
      </section>
    </form>
  );
}
