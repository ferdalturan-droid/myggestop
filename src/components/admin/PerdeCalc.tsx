"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Kanat = "HAREKETLI" | "SABIT";
const ceilHalf = (x: number) => (x <= 0 ? 0 : Math.ceil((x - 1e-9) * 2) / 2);
const f = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));
const kr = (n: number) => (Math.round(n * 100) / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";

interface Row { uid: number; kanat: Kanat; en: string; boy: string; adet: string; farve: string; }
let c = 1;
const blank = (): Row => ({ uid: c++, kanat: "HAREKETLI", en: "", boy: "", adet: "1", farve: "" });

function calc(r: Row, rate: number) {
  const en = parseFloat(r.en.replace(",", ".")) || 0, boy = parseFloat(r.boy.replace(",", ".")) || 0, adet = Math.max(1, parseInt(r.adet) || 1);
  if (en <= 0 || boy <= 0) return null;
  const off = r.kanat === "HAREKETLI" ? 0.4 : 2;
  const perdeEn = en - off, alumProfil = en - off, serit = en - off;
  const pile = boy / 2.2, alumAdet = 2 * adet, seritAdet = adet * 2, ipBoy = en + boy + 35;
  const area = (en / 100) * (boy / 100), m2 = ceilHalf(area), price = m2 * rate * adet;
  return { adet, perdeEn, pile, alumProfil, alumAdet, serit, seritAdet, ipBoy, area, m2, price };
}

export default function PerdeCalc() {
  const [musteri, setMusteri] = useState(""); const [tel, setTel] = useState(""); const [adres, setAdres] = useState("");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [rate, setRate] = useState(400); const [showP, setShowP] = useState(false);
  const [openUid, setOpenUid] = useState<number | null>(null);
  const [saved, setSaved] = useState<any[]>([]); const [msg, setMsg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sourceOrderId, setSourceOrderId] = useState<string | null>(null);
  const [orderMsg, setOrderMsg] = useState<string | null>(null);
  const rateLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const rt = parseFloat(localStorage.getItem("perde_rate") || ""); if (rt > 0) setRate(rt);
      const imp = JSON.parse(localStorage.getItem("perde_import") || "null");
      if (imp && imp.rows?.length) { setMusteri(imp.musteri || ""); setTel(imp.tel || ""); setAdres(imp.adres || ""); setRows(imp.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setSourceOrderId(imp.sourceOrderId || null); setOrderId(null); localStorage.removeItem("perde_import"); }
      else { const cur = JSON.parse(localStorage.getItem("perde_current") || "null"); if (cur && cur.rows?.length) { setMusteri(cur.musteri || ""); setTel(cur.tel || ""); setAdres(cur.adres || ""); setRows(cur.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setOrderId(cur.orderId || null); setSourceOrderId(cur.sourceOrderId || null); } }
    } catch {}
    fetch("/api/imalat-records?type=PERDE").then((r) => r.json()).then((d) => setSaved(d.items || [])).catch(() => {
      try { setSaved(JSON.parse(localStorage.getItem("perde_saved") || "[]")); } catch {}
    });
    fetch("/api/imalat-rates").then((r) => r.json()).then((d) => { if (typeof d.perde === "number") setRate(d.perde); }).finally(() => { rateLoadedRef.current = true; });
  }, []);
  useEffect(() => { localStorage.setItem("perde_current", JSON.stringify({ musteri, tel, adres, rows, orderId, sourceOrderId })); }, [musteri, tel, adres, rows, orderId, sourceOrderId]);
  useEffect(() => {
    localStorage.setItem("perde_rate", String(rate));
    if (rateLoadedRef.current) fetch("/api/imalat-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "PERDE", value: rate }) }).catch(() => {});
  }, [rate]);

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => { if (confirm("Skal dette gardin slettes?")) setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : [blank()])); };
  const totals = useMemo(() => { const ara = rows.reduce((s, r) => { const x = calc(r, rate); return s + (x ? x.price : 0); }, 0); return { ara, moms: ara * 0.25, dahil: ara * 1.25 }; }, [rows, rate]);

  function gemPaaServer(n: any[]) { fetch("/api/imalat-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "PERDE", items: n }) }).catch(() => {}); localStorage.setItem("perde_saved", JSON.stringify(n)); }

  function buildOrderItems() {
    const out: any[] = [];
    for (const r of rows) {
      const x = calc(r, rate); if (!x) continue;
      const widthMm = Math.round((parseFloat(r.en.replace(",", ".")) || 0) * 10);
      const heightMm = Math.round((parseFloat(r.boy.replace(",", ".")) || 0) * 10);
      const perUnit = x.price / x.adet;
      const comment = `Fløj: ${r.kanat === "HAREKETLI" ? "Bevægelig" : "Fast"}`;
      for (let n = 0; n < x.adet; n++) out.push({ productName: "Plissegardin", widthMm, heightMm, colorName: r.farve || "", comment, lineTotal: perUnit });
    }
    return out;
  }

  async function gemSomOrdre() {
    if (sourceOrderId) return; // allerede en rigtig ordre — opret ikke en ny
    const items = buildOrderItems();
    if (items.length === 0) return;
    try {
      const res = await fetch("/api/orders/manual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musteri: musteri.trim(), tel, adres, items, orderId: orderId || undefined })
      });
      const d = await res.json();
      if (res.ok && d.orderId) { setOrderId(d.orderId); setOrderMsg(`Gemt i Ordrer ✓ (${d.orderNumber})`); setTimeout(() => setOrderMsg(null), 4000); }
    } catch {}
  }

  function kaydet() {
    if (!musteri.trim()) { setMsg("Angiv kundens navn."); setTimeout(() => setMsg(null), 2000); return; }
    const rec = { id: Date.now(), musteri: musteri.trim(), tel, adres, date: new Date().toLocaleString("da-DK"), rows, orderId, sourceOrderId };
    const n = [rec, ...saved].slice(0, 50); setSaved(n); gemPaaServer(n);
    gemSomOrdre();
    setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2000);
  }
  function yukle(rec: any) { setMusteri(rec.musteri || ""); setTel(rec.tel || ""); setAdres(rec.adres || ""); setRows(rec.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setOrderId(rec.orderId || null); setSourceOrderId(rec.sourceOrderId || null); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function sil(id: number) { const n = saved.filter((s) => s.id !== id); setSaved(n); gemPaaServer(n); }
  function yeni() { if (confirm("Skal en ny tom side åbnes?")) { setMusteri(""); setTel(""); setAdres(""); setRows([blank()]); setOrderId(null); setSourceOrderId(null); setOrderMsg(null); } }

  function yazdir() {
    const win = window.open("", "_blank", "width=900,height=1000"); if (!win) return;
    const wr = rows.map((r, i) => { const x = calc(r, rate); if (!x) return ""; return `<tr><td>${i + 1}</td><td>${r.kanat === "HAREKETLI" ? "Bevægelig" : "Fast"}</td><td>${r.en}×${r.boy}</td><td>${r.farve || "-"}</td><td>${x.adet}</td><td>${f(x.perdeEn)}</td><td>${f(x.pile)}</td><td>${f(x.alumProfil)} (${x.alumAdet})</td><td>${f(x.serit)} (${x.seritAdet})</td><td>${f(x.ipBoy)}</td><td>${f(x.m2)} m²</td><td>${kr(x.price)}</td></tr>`; }).join("");
    win.document.write(`<!doctype html><html lang="da"><head><meta charset="utf-8"><title>Gardin Arbejdsseddel - ${musteri}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:24px}h2{color:#3f9c12;font-size:15px}.brand{font-weight:800;font-size:22px}.brand span{color:#5cc524}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left}th{background:#f1f5f3;font-size:10px}.tot td{border:none;padding:2px 8px}@media print{button{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;border-bottom:3px solid #11241c;padding-bottom:10px"><div class="brand">MYGGE<span>STOP</span> <span style="font-size:13px;color:#555">— Plissegardin</span></div><div style="text-align:right;font-size:12px"><b>${musteri || "-"}</b><br>${tel}<br>${adres}<br>${new Date().toLocaleString("da-DK")}</div></div>
    <h2>Gardiner — tilskæring & pris</h2><table><thead><tr><th>#</th><th>Fløj</th><th>Glas</th><th>Farve</th><th>Antal</th><th>Gardin bredde</th><th>Pileantal</th><th>Aluminium (stk.)</th><th>Strimmel (stk.)</th><th>Snorlængde</th><th>m²</th><th>Pris</th></tr></thead><tbody>${wr}</tbody></table>
    <table class="tot" style="width:auto;float:right;margin-top:12px"><tr><td>Subtotal:</td><td style="text-align:right"><b>${kr(totals.ara)}</b></td></tr><tr><td>Moms 25%:</td><td style="text-align:right">${kr(totals.moms)}</td></tr><tr><td><b>Total i alt:</b></td><td style="text-align:right"><b>${kr(totals.dahil)}</b></td></tr></table><div style="clear:both"></div>
    <p><button onclick="window.print()" style="padding:10px 20px;background:#3f9c12;color:#fff;border:none;border-radius:8px;cursor:pointer">Udskriv / PDF</button></p></body></html>`);
    win.document.close();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-brand-ink">Gardin — Tilskæring & pris</h1><p className="text-sm text-brand-ink2/60">Pris pr. m² (rundes op til 0,5) · Gemmes automatisk.</p></div>
        <div className="flex items-center gap-2"><button onClick={() => setShowP((s) => !s)} className="btn-secondary py-2 text-sm">Pris</button><button onClick={yeni} className="btn-secondary py-2 text-sm">Ny</button><button onClick={yazdir} className="btn-secondary py-2 text-sm">Udskriv / PDF</button><button onClick={kaydet} className="btn-primary py-2 text-sm">Gem</button></div>
      </div>

      {showP && (
        <div className="mb-4 rounded-xl border border-brand-line bg-brand-mist/50 p-4">
          <label className="block max-w-[200px]"><span className="label">Gardinpris (kr/m²)</span><input className="input py-2 text-sm" inputMode="decimal" value={rate} onChange={(e) => setRate(parseFloat(e.target.value.replace(",", ".").replace(/[^0-9.]/g, "")) || 0)} /></label>
          <p className="mt-2 text-xs text-brand-ink2/55">m² = faktisk bredde×højde, rundes op til 0,5 m² → × kr/m² × antal. Moms 25% tillægges.</p>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="label">Kunde</span><input className="input" value={musteri} onChange={(e) => setMusteri(e.target.value)} placeholder="Kundens navn" /></label>
        <label className="block"><span className="label">Telefon</span><input className="input" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Telefon" /></label>
        <label className="block"><span className="label">Adresse</span><input className="input" value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Adresse" /></label>
      </div>
      {msg && <div className="mb-1 text-sm font-medium text-brand-greendark">{msg}</div>}
      {orderMsg && <div className="mb-3 text-sm font-medium text-brand-bluedark">{orderMsg}</div>}
      {sourceOrderId && <div className="mb-3 text-xs text-brand-ink2/55">Denne beregning er hentet fra en eksisterende ordre — opdaterer ikke Ordrer-siden.</div>}

      <div className="space-y-3">
        {rows.map((r, i) => {
          const x = calc(r, rate); const open = openUid === r.uid;
          return (
            <div key={r.uid} className="rounded-xl border border-brand-line bg-white">
              <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                <button onClick={() => setOpenUid(open ? null : r.uid)} className="flex items-center gap-1.5 text-sm font-bold text-brand-greendark"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span> detaljer {open ? "▲" : "▼"}</button>
                <div className="flex items-center gap-3"><span className="text-sm font-bold text-brand-ink">{x ? kr(x.price) : ""}</span><button onClick={() => del(r.uid)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button></div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5 sm:grid-cols-5">
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Fløj</span><select className="input py-2 text-sm" value={r.kanat} onChange={(e) => upd(r.uid, { kanat: e.target.value as Kanat })}><option value="HAREKETLI">Bevægelig</option><option value="SABIT">Fast</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Antal</span><input className="input py-2 text-sm" inputMode="numeric" value={r.adet} onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Glas bredde (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.en} onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Glas højde (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.boy} onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Farve</span><input className="input py-2 text-sm" value={r.farve} onChange={(e) => upd(r.uid, { farve: e.target.value })} placeholder="f.eks. Hvid" /></label>
              </div>
              {open && x && (
                <div className="border-t border-brand-line bg-brand-mist/40 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink2/60">Tilskæringsmål · {f(x.area)} m² → {f(x.m2)} m² · {kr(x.price)}</p>
                  <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">GARDIN BREDDE</span><span className="font-semibold">{x.adet} stk. × {f(x.perdeEn)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">PILEANTAL</span><span className="font-semibold">{f(x.pile)}</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">ALUMINIUM PROFIL</span><span className="font-semibold">{x.alumAdet} stk. × {f(x.alumProfil)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">SELVKLÆBENDE STRIMMEL</span><span className="font-semibold">{x.seritAdet} stk. × {f(x.serit)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">SNORLÆNGDE</span><span className="font-semibold">{f(x.ipBoy)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">FARVE</span><span className="font-semibold">{r.farve || "—"}</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={add} className="btn-secondary mt-3 w-full border-dashed py-2 text-sm">+ Tilføj gardin</button>

      {totals.ara > 0 && (
        <div className="mt-6 ml-auto max-w-xs rounded-xl border border-brand-line bg-white p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Subtotal</span><span className="font-semibold text-brand-ink">{kr(totals.ara)}</span></div>
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Moms 25%</span><span className="text-brand-ink">{kr(totals.moms)}</span></div>
          <div className="mt-1 flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Total i alt</span><span className="text-brand-greendark">{kr(totals.dahil)}</span></div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-8"><h2 className="mb-3 text-lg font-bold text-brand-ink">Gemte gardiner</h2>
          <div className="space-y-2">{saved.map((s) => (<div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm"><div><span className="font-semibold text-brand-ink">{s.musteri}</span> <span className="text-brand-ink2/55">· {s.rows.length} gardiner · {s.date}</span></div><div className="flex gap-3"><button onClick={() => yukle(s)} className="font-medium text-brand-greendark hover:underline">Åbn</button><button onClick={() => sil(s.id)} className="text-red-400 hover:text-red-600">Slet</button></div></div>))}</div>
        </div>
      )}
    </div>
  );
}
