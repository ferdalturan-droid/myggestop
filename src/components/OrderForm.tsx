"use client";
import { useMemo, useState } from "react";
import { calcLine, calcOrderTotals, formatDKK, PricingConfig } from "@/lib/pricing";
import { IconCheck } from "./Icons";

interface Product {
  id: string; name: string; pricePerSqm: number;
  maxWidthMm: number; maxHeightMm: number; minWidthMm: number; minHeightMm: number;
  doubleDoorThresholdMm: number | null;
}
interface Color { id: string; name: string; hex: string; surchargePerSqm: number; isStandard: boolean; }

interface Item {
  uid: number; roomName: string; productId: string;
  widthMm: number; heightMm: number; colorId: string; comment: string;
}

const ROOM_SUGGESTIONS = ["Køkken", "Stue", "Soveværelse", "Kontor", "Badeværelse", "Børneværelse", "Entré", "Altan", "Terrasse"];
let counter = 1;

export default function OrderForm({
  products, colors, config, shippingText
}: { products: Product[]; colors: Color[]; config: PricingConfig; shippingText: string; }) {
  const [customer, setCustomer] = useState({ firstName: "", lastName: "", phone: "", email: "", address: "", postalCode: "", city: "" });
  const [wantsInstallation, setWantsInstallation] = useState(false);
  const [note, setNote] = useState("");

  const defColor = colors.find((c) => c.isStandard)?.id || colors[0]?.id || "";
  const blank = () => ({ roomName: "", productId: products[0]?.id || "", widthMm: "", heightMm: "", colorId: defColor, comment: "" });
  const [draft, setDraft] = useState<{ roomName: string; productId: string; widthMm: string; heightMm: string; colorId: string; comment: string }>(blank());
  const [items, setItems] = useState<Item[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lineOf = (it: { productId: string; widthMm: number; heightMm: number; colorId: string }) => {
    const product = products.find((p) => p.id === it.productId);
    const color = colors.find((c) => c.id === it.colorId) || null;
    if (!product) return null;
    return calcLine(
      { widthMm: it.widthMm, heightMm: it.heightMm,
        product: { pricePerSqm: product.pricePerSqm, doubleDoorThresholdMm: product.doubleDoorThresholdMm },
        color: color ? { surchargePerSqm: color.surchargePerSqm, isStandard: color.isStandard } : null },
      config
    );
  };

  // live beregning for udkast
  const draftCalc = useMemo(() => {
    const w = parseInt(draft.widthMm) || 0, h = parseInt(draft.heightMm) || 0;
    const product = products.find((p) => p.id === draft.productId);
    if (!product || w <= 0 || h <= 0) return null;
    const res = lineOf({ productId: draft.productId, widthMm: w, heightMm: h, colorId: draft.colorId });
    const tooWide = w > product.maxWidthMm || h > product.maxHeightMm;
    return { res, tooWide, product };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, products, colors, config]);

  const computedItems = useMemo(() => items.map((it) => ({ it, res: lineOf(it)! })), [items]);
  const totals = useMemo(
    () => calcOrderTotals(computedItems.map((x) => x.res), wantsInstallation, config),
    [computedItems, wantsInstallation, config]
  );

  function addDraft() {
    setFormError(null);
    const w = parseInt(draft.widthMm) || 0, h = parseInt(draft.heightMm) || 0;
    if (!draft.productId) { setFormError("Vælg en produkttype."); return; }
    if (w <= 0 || h <= 0) { setFormError("Udfyld bredde og højde i mm."); return; }
    if (draftCalc?.tooWide) { setFormError("Målene overstiger produktets maksimum. Ret venligst."); return; }
    setItems((arr) => [...arr, { uid: counter++, roomName: draft.roomName, productId: draft.productId, widthMm: w, heightMm: h, colorId: draft.colorId, comment: draft.comment }]);
    setDraft(blank());
  }
  function removeItem(uid: number) { setItems((arr) => arr.filter((x) => x.uid !== uid)); }
  function editItem(uid: number) {
    const it = items.find((x) => x.uid === uid);
    if (!it) return;
    setDraft({ roomName: it.roomName, productId: it.productId, widthMm: String(it.widthMm), heightMm: String(it.heightMm), colorId: it.colorId, comment: it.comment });
    setItems((arr) => arr.filter((x) => x.uid !== uid));
    window.scrollTo({ top: document.getElementById("tilføj")?.offsetTop ?? 0 - 80, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) { setError("Tilføj mindst ét produkt til ordren."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer, wantsInstallation, note,
          items: items.map((l) => ({ productId: l.productId, roomName: l.roomName, widthMm: l.widthMm, heightMm: l.heightMm, colorId: l.colorId, comment: l.comment }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Noget gik galt");
      setResult({ orderNumber: data.orderNumber });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  }

  const colorName = (id: string) => colors.find((c) => c.id === id)?.name || "";
  const productName = (id: string) => products.find((p) => p.id === id)?.name || "";

  if (result) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-green/15 text-brand-greendark"><IconCheck className="h-9 w-9" /></span>
        <h2 className="h-title mt-6 text-3xl">Tak for din bestilling!</h2>
        <p className="mt-3 text-brand-ink2/80">Dit ordrenummer er <strong className="text-brand-bluedark">{result.orderNumber}</strong>.</p>
        <p className="mx-auto mt-3 max-w-md text-brand-ink2/75">Vi har sendt en bekræftelse med PDF til din e-mail. Dette er en uforpligtende anmodning — vi kontakter dig hurtigst muligt vedrørende endelig pris, levering og evt. montering.</p>
        <a href="/" className="btn-primary mt-8">Tilbage til forsiden</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* 1. Kunde */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-ink">1. Dine oplysninger</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Fornavn *</label><input className="input" required value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} /></div>
          <div><label className="label">Efternavn *</label><input className="input" required value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} /></div>
          <div><label className="label">Telefonnummer *</label><input className="input" required type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
          <div><label className="label">E-mail *</label><input className="input" required type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Adresse *</label><input className="input" required value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></div>
          <div><label className="label">Postnummer *</label><input className="input" required value={customer.postalCode} onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })} /></div>
          <div><label className="label">By *</label><input className="input" required value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} /></div>
        </div>
      </section>

      {/* 2. Tilføj produkt (fast boks) */}
      <section id="tilføj" className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-ink">2. Tilføj produkt</h2>
        <p className="mt-1 text-sm text-brand-ink2/65">Udfyld ét produkt og tryk “Tilføj til ordren”. Gentag for hvert rum.</p>

        <div className="mt-5 rounded-xl2 border border-brand-line bg-brand-mist/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Rum navn</label>
              <input className="input" list="rooms" placeholder="F.eks. Køkken" value={draft.roomName} onChange={(e) => setDraft({ ...draft, roomName: e.target.value })} />
              <datalist id="rooms">{ROOM_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            <div>
              <label className="label">Produkttype</label>
              <select className="input" value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value })}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatDKK(p.pricePerSqm)}/m²</option>)}
              </select>
            </div>
            <div><label className="label">Bredde (mm)</label><input className="input" inputMode="numeric" placeholder="f.eks. 800" value={draft.widthMm} onChange={(e) => setDraft({ ...draft, widthMm: e.target.value.replace(/[^0-9]/g, "") })} /></div>
            <div><label className="label">Højde (mm)</label><input className="input" inputMode="numeric" placeholder="f.eks. 1200" value={draft.heightMm} onChange={(e) => setDraft({ ...draft, heightMm: e.target.value.replace(/[^0-9]/g, "") })} /></div>
            <div>
              <label className="label">Farve</label>
              <select className="input" value={draft.colorId} onChange={(e) => setDraft({ ...draft, colorId: e.target.value })}>
                {colors.map((c) => <option key={c.id} value={c.id}>{c.name}{!c.isStandard ? " (+tillæg)" : ""}</option>)}
              </select>
            </div>
            <div><label className="label">Kommentar</label><input className="input" placeholder="Valgfri" value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} /></div>
          </div>

          {draftCalc?.res && !draftCalc.tooWide && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-white px-4 py-3 text-sm shadow-card">
              <span className="text-brand-ink2/70">Areal: <strong className="text-brand-ink">{draftCalc.res.areaSqm.toString().replace(".", ",")} m²</strong></span>
              {draftCalc.res.isDoubleDoor && <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-bluedark">Dobbeltdør +{formatDKK(draftCalc.res.doubleDoorSurcharge)}</span>}
              {draftCalc.res.colorSurcharge > 0 && <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-semibold text-brand-greendark">Farve +{formatDKK(draftCalc.res.colorSurcharge)}</span>}
              <span className="ml-auto font-bold text-brand-bluedark">{formatDKK(draftCalc.res.lineTotal)}</span>
            </div>
          )}
          {draftCalc?.tooWide && <p className="mt-2 text-sm font-medium text-red-500">Målene overstiger maksimum for {draftCalc.product.name} (max {draftCalc.product.maxWidthMm}×{draftCalc.product.maxHeightMm} mm).</p>}
          {formError && <p className="mt-2 text-sm font-medium text-red-500">{formError}</p>}

          <button type="button" onClick={addDraft} className="btn-green mt-4 w-full">+ Tilføj til ordren</button>
        </div>
      </section>

      {/* 3. Tilføjede produkter (kompakt liste) */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-ink">3. Dine produkter</h2>
          <span className="rounded-full bg-brand-mist px-3 py-1 text-xs font-semibold text-brand-ink2">{items.length} stk.</span>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-brand-line bg-brand-mist/40 p-6 text-center text-sm text-brand-ink2/60">
            Ingen produkter endnu. Tilføj dit første produkt ovenfor.
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {computedItems.map(({ it, res }, i) => (
              <li key={it.uid} className="flex items-center gap-3 rounded-xl border border-brand-line bg-white px-4 py-3">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-ink">
                    {it.roomName ? it.roomName + " · " : ""}{productName(it.productId)}{res.isDoubleDoor ? " (Dobbeltdør)" : ""}
                  </p>
                  <p className="truncate text-xs text-brand-ink2/65">
                    {it.widthMm}×{it.heightMm} mm · {res.areaSqm.toString().replace(".", ",")} m² · {colorName(it.colorId)}{it.comment ? " · " + it.comment : ""}
                  </p>
                </div>
                <span className="flex-none text-sm font-bold text-brand-bluedark">{formatDKK(res.lineTotal)}</span>
                <button type="button" onClick={() => editItem(it.uid)} className="flex-none text-xs font-medium text-brand-blue hover:underline">Rediger</button>
                <button type="button" onClick={() => removeItem(it.uid)} aria-label="Fjern" className="flex-none text-lg leading-none text-red-400 hover:text-red-600">×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Montering & oversigt */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-ink">4. Montering & oversigt</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${wantsInstallation ? "border-brand-blue bg-brand-blue/5" : "border-brand-line"}`}>
            <input type="radio" name="install" className="mt-1" checked={wantsInstallation} onChange={() => setWantsInstallation(true)} />
            <span><span className="block font-semibold text-brand-ink">Jeg ønsker montering</span><span className="block text-sm text-brand-ink2/70">Kun København og omegn. Grundgebyr + pris pr. produkt tilføjes.</span></span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${!wantsInstallation ? "border-brand-blue bg-brand-blue/5" : "border-brand-line"}`}>
            <input type="radio" name="install" className="mt-1" checked={!wantsInstallation} onChange={() => setWantsInstallation(false)} />
            <span><span className="block font-semibold text-brand-ink">Kun levering</span><span className="block text-sm text-brand-ink2/70">Vi sender dine net direkte til døren i hele Danmark.</span></span>
          </label>
        </div>

        <div className="mt-5"><label className="label">Bemærkning til ordren (valgfri)</label><textarea className="input min-h-[90px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Særlige ønsker, leveringsinfo m.m." /></div>

        <div className="mt-6 rounded-xl2 bg-brand-ink p-6 text-white">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-300">Produkter i alt ({items.length})</span><span>{formatDKK(totals.productsTotal)}</span></div>
            {wantsInstallation && <div className="flex justify-between"><span className="text-slate-300">Montering</span><span>{formatDKK(totals.installationTotal)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-300">Fragt</span><span className="text-slate-300">Efter aftale</span></div>
            <div className="mt-3 flex justify-between border-t border-white/15 pt-3 text-lg font-bold"><span>Estimeret total</span><span className="text-brand-green">{formatDKK(totals.estimatedTotal)}</span></div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">Prisen er et uforpligtende estimat. Arealet afrundes kommercielt op til nærmeste 0,5 m². {shippingText}</p>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full text-base disabled:opacity-60">{submitting ? "Sender..." : "Send bestilling / anmod om tilbud"}</button>
        <p className="mt-3 text-center text-xs text-brand-ink2/60">Ingen online betaling — vi kontakter dig med endelig pris.</p>
      </section>
    </form>
  );
}
