"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ItemForm {
  uid: number;
  roomName: string;
  productName: string;
  widthMm: string;
  heightMm: string;
  colorName: string;
  comment: string;
  lineTotal: string;
}

let uidc = 1;
const toItemForm = (it: any): ItemForm => ({
  uid: uidc++,
  roomName: it.roomName || "",
  productName: it.productName || "",
  widthMm: String(it.widthMm ?? ""),
  heightMm: String(it.heightMm ?? ""),
  colorName: it.colorName || "",
  comment: it.comment || "",
  lineTotal: String(it.lineTotal ?? "")
});

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
  const [wantsInstallation, setWantsInstallation] = useState(!!order.wantsInstallation);
  const [installationTotal, setInstallationTotal] = useState(String(order.installationTotal ?? "0"));
  const [items, setItems] = useState<ItemForm[]>(
    (order.items || []).length ? order.items.map(toItemForm) : [toItemForm({})]
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function upd(uid: number, p: Partial<ItemForm>) {
    setItems((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  }
  function add() {
    setItems((rs) => [...rs, toItemForm({})]);
  }
  function del(uid: number) {
    setItems((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : rs));
  }

  const productsTotal = items.reduce((s, it) => s + (parseFloat(it.lineTotal.replace(",", ".")) || 0), 0);
  const estimatedTotal = productsTotal + (parseFloat(installationTotal.replace(",", ".")) || 0);

  async function gem() {
    if (!firstName.trim() || !lastName.trim()) { setErr("Angiv for- og efternavn."); return; }
    setSaving(true);
    setErr(null);
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      email,
      address,
      postalCode,
      city,
      note,
      wantsInstallation,
      installationTotal: parseFloat(installationTotal.replace(",", ".")) || 0,
      items: items
        .filter((it) => it.productName.trim())
        .map((it) => ({
          roomName: it.roomName,
          productName: it.productName,
          widthMm: parseFloat(it.widthMm.replace(",", ".")) || 0,
          heightMm: parseFloat(it.heightMm.replace(",", ".")) || 0,
          colorName: it.colorName,
          comment: it.comment,
          lineTotal: parseFloat(it.lineTotal.replace(",", ".")) || 0
        }))
    };
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) {
      router.push(`/admin/ordrer/${order.id}`);
      router.refresh();
    } else {
      setErr("Kunne ikke gemme ændringerne.");
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
        <label className="mt-3 flex items-center gap-2 text-sm text-brand-ink2/80">
          <input type="checkbox" checked={wantsInstallation} onChange={(e) => setWantsInstallation(e.target.checked)} /> Ønsker montering
        </label>
        <label className="mt-3 block max-w-[220px]"><span className="label">Montering (kr)</span><input className="input" inputMode="decimal" value={installationTotal} onChange={(e) => setInstallationTotal(e.target.value.replace(/[^0-9.,]/g, ""))} /></label>
        <label className="mt-3 block"><span className="label">Bemærkning</span><textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      </div>

      <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-bold text-brand-ink">Produkter</h2>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={it.uid} className="rounded-xl border border-brand-line p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-brand-greendark">Produkt {i + 1}</span>
                <button onClick={() => del(it.uid)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Rum</span><input className="input py-2 text-sm" value={it.roomName} onChange={(e) => upd(it.uid, { roomName: e.target.value })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Produkt</span><input className="input py-2 text-sm" value={it.productName} onChange={(e) => upd(it.uid, { productName: e.target.value })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Bredde (mm)</span><input className="input py-2 text-sm" inputMode="decimal" value={it.widthMm} onChange={(e) => upd(it.uid, { widthMm: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Højde (mm)</span><input className="input py-2 text-sm" inputMode="decimal" value={it.heightMm} onChange={(e) => upd(it.uid, { heightMm: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Farve</span><input className="input py-2 text-sm" value={it.colorName} onChange={(e) => upd(it.uid, { colorName: e.target.value })} /></label>
                <label className="block sm:col-span-2"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Kommentar</span><input className="input py-2 text-sm" value={it.comment} onChange={(e) => upd(it.uid, { comment: e.target.value })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Pris (kr)</span><input className="input py-2 text-sm" inputMode="decimal" value={it.lineTotal} onChange={(e) => upd(it.uid, { lineTotal: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
              </div>
            </div>
          ))}
        </div>
        <button onClick={add} className="btn-secondary mt-3 w-full border-dashed py-2 text-sm">+ Tilføj produkt</button>
      </div>

      <div className="rounded-xl2 border border-brand-line bg-white p-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Produkter i alt</span><span className="font-semibold text-brand-ink">{productsTotal.toLocaleString("da-DK")} kr</span></div>
        <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Montering</span><span className="text-brand-ink">{(parseFloat(installationTotal.replace(",", ".")) || 0).toLocaleString("da-DK")} kr</span></div>
        <div className="mt-1 flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Estimeret total</span><span className="text-brand-bluedark">{estimatedTotal.toLocaleString("da-DK")} kr</span></div>
      </div>

      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button onClick={gem} disabled={saving} className="btn-primary py-2.5 text-sm disabled:opacity-50">{saving ? "Gemmer..." : "Gem ændringer"}</button>
        <button onClick={() => router.push(`/admin/ordrer/${order.id}`)} className="btn-secondary py-2.5 text-sm">Annuller</button>
      </div>
    </div>
  );
}
