"use client";
import { useEffect, useMemo, useState } from "react";

type Kanat = "HAREKETLI" | "SABIT";
const ceilHalf = (x: number) => (x <= 0 ? 0 : Math.ceil((x - 1e-9) * 2) / 2);
const f = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));
const kr = (n: number) => (Math.round(n * 100) / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";

interface Row { uid: number; kanat: Kanat; en: string; boy: string; adet: string; }
let c = 1;
const blank = (): Row => ({ uid: c++, kanat: "HAREKETLI", en: "", boy: "", adet: "1" });

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

  useEffect(() => {
    try {
      const rt = parseFloat(localStorage.getItem("perde_rate") || ""); if (rt > 0) setRate(rt);
      const cur = JSON.parse(localStorage.getItem("perde_current") || "null");
      if (cur && cur.rows?.length) { setMusteri(cur.musteri || ""); setTel(cur.tel || ""); setAdres(cur.adres || ""); setRows(cur.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); }
      setSaved(JSON.parse(localStorage.getItem("perde_saved") || "[]"));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("perde_current", JSON.stringify({ musteri, tel, adres, rows })); }, [musteri, tel, adres, rows]);
  useEffect(() => { localStorage.setItem("perde_rate", String(rate)); }, [rate]);

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => { if (confirm("Bu perde silinsin mi?")) setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : [blank()])); };
  const totals = useMemo(() => { const ara = rows.reduce((s, r) => { const x = calc(r, rate); return s + (x ? x.price : 0); }, 0); return { ara, moms: ara * 0.25, dahil: ara * 1.25 }; }, [rows, rate]);

  function kaydet() { if (!musteri.trim()) { setMsg("Müşteri adı girin."); setTimeout(() => setMsg(null), 2000); return; } const rec = { id: Date.now(), musteri: musteri.trim(), tel, adres, date: new Date().toLocaleString("tr-TR"), rows }; const n = [rec, ...saved].slice(0, 50); setSaved(n); localStorage.setItem("perde_saved", JSON.stringify(n)); setMsg("Kaydedildi ✓"); setTimeout(() => setMsg(null), 2000); }
  function yukle(rec: any) { setMusteri(rec.musteri || ""); setTel(rec.tel || ""); setAdres(rec.adres || ""); setRows(rec.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function sil(id: number) { const n = saved.filter((s) => s.id !== id); setSaved(n); localStorage.setItem("perde_saved", JSON.stringify(n)); }
  function yeni() { if (confirm("Yeni boş sayfa?")) { setMusteri(""); setTel(""); setAdres(""); setRows([blank()]); } }

  function yazdir() {
    const win = window.open("", "_blank", "width=900,height=1000"); if (!win) return;
    const wr = rows.map((r, i) => { const x = calc(r, rate); if (!x) return ""; return `<tr><td>${i + 1}</td><td>${r.kanat === "HAREKETLI" ? "Hareketli" : "Sabit"}</td><td>${r.en}×${r.boy}</td><td>${x.adet}</td><td>${f(x.perdeEn)}</td><td>${f(x.pile)}</td><td>${f(x.alumProfil)} (${x.alumAdet})</td><td>${f(x.serit)} (${x.seritAdet})</td><td>${f(x.ipBoy)}</td><td>${f(x.m2)} m²</td><td>${kr(x.price)}</td></tr>`; }).join("");
    win.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Perde İş Emri - ${musteri}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:24px}h2{color:#3f9c12;font-size:15px}.brand{font-weight:800;font-size:22px}.brand span{color:#5cc524}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left}th{background:#f1f5f3;font-size:10px}.tot td{border:none;padding:2px 8px}@media print{button{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;border-bottom:3px solid #11241c;padding-bottom:10px"><div class="brand">MYGGE<span>STOP</span> <span style="font-size:13px;color:#555">— Plise Perde</span></div><div style="text-align:right;font-size:12px"><b>${musteri || "-"}</b><br>${tel}<br>${adres}<br>${new Date().toLocaleString("tr-TR")}</div></div>
    <h2>Perdeler — kesim & fiyat</h2><table><thead><tr><th>#</th><th>Kanat</th><th>Cam</th><th>Adet</th><th>Perde En</th><th>Pile</th><th>Alüminyum (ad)</th><th>Şerit (ad)</th><th>İp Boyu</th><th>m²</th><th>Fiyat</th></tr></thead><tbody>${wr}</tbody></table>
    <table class="tot" style="width:auto;float:right;margin-top:12px"><tr><td>Ara toplam:</td><td style="text-align:right"><b>${kr(totals.ara)}</b></td></tr><tr><td>Moms %25:</td><td style="text-align:right">${kr(totals.moms)}</td></tr><tr><td><b>Genel toplam:</b></td><td style="text-align:right"><b>${kr(totals.dahil)}</b></td></tr></table><div style="clear:both"></div>
    <p><button onclick="window.print()" style="padding:10px 20px;background:#3f9c12;color:#fff;border:none;border-radius:8px;cursor:pointer">Yazdır / PDF</button></p></body></html>`);
    win.document.close();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-brand-ink">Perde — Kesim & fiyat</h1><p className="text-sm text-brand-ink2/60">Fiyat m² üzerinden (0,5'e yukarı) · Otomatik kaydedilir.</p></div>
        <div className="flex items-center gap-2"><button onClick={() => setShowP((s) => !s)} className="btn-secondary py-2 text-sm">Fiyat</button><button onClick={yeni} className="btn-secondary py-2 text-sm">Yeni</button><button onClick={yazdir} className="btn-secondary py-2 text-sm">Yazdır / PDF</button><button onClick={kaydet} className="btn-primary py-2 text-sm">Kaydet</button></div>
      </div>

      {showP && (
        <div className="mb-4 rounded-xl border border-brand-line bg-brand-mist/50 p-4">
          <label className="block max-w-[200px]"><span className="label">Perde fiyatı (kr/m²)</span><input className="input py-2 text-sm" inputMode="decimal" value={rate} onChange={(e) => setRate(parseFloat(e.target.value.replace(",", ".").replace(/[^0-9.]/g, "")) || 0)} /></label>
          <p className="mt-2 text-xs text-brand-ink2/55">m² = gerçek EN×BOY, 0,5 m²'ye yukarı yuvarlanır → × kr/m² × adet. Moms %25 eklenir.</p>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="label">Müşteri</span><input className="input" value={musteri} onChange={(e) => setMusteri(e.target.value)} placeholder="Müşteri adı" /></label>
        <label className="block"><span className="label">Telefon</span><input className="input" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Telefon" /></label>
        <label className="block"><span className="label">Adres</span><input className="input" value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Adres" /></label>
      </div>
      {msg && <div className="mb-3 text-sm font-medium text-brand-greendark">{msg}</div>}

      <div className="space-y-3">
        {rows.map((r, i) => {
          const x = calc(r, rate); const open = openUid === r.uid;
          return (
            <div key={r.uid} className="rounded-xl border border-brand-line bg-white">
              <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                <button onClick={() => setOpenUid(open ? null : r.uid)} className="flex items-center gap-1.5 text-sm font-bold text-brand-greendark"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span> detay {open ? "▲" : "▼"}</button>
                <div className="flex items-center gap-3"><span className="text-sm font-bold text-brand-ink">{x ? kr(x.price) : ""}</span><button onClick={() => del(r.uid)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button></div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5 sm:grid-cols-4">
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Kanat</span><select className="input py-2 text-sm" value={r.kanat} onChange={(e) => upd(r.uid, { kanat: e.target.value as Kanat })}><option value="HAREKETLI">Hareketli</option><option value="SABIT">Sabit</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Adet</span><input className="input py-2 text-sm" inputMode="numeric" value={r.adet} onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Cam En (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.en} onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Cam Boy (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.boy} onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
              </div>
              {open && x && (
                <div className="border-t border-brand-line bg-brand-mist/40 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink2/60">Kesim ölçüleri · {f(x.area)} m² → {f(x.m2)} m² · {kr(x.price)}</p>
                  <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">PERDE EN</span><span className="font-semibold">{x.adet} adet × {f(x.perdeEn)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">PİLE SAYISI</span><span className="font-semibold">{f(x.pile)}</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">ALÜMİNYUM PROFİL</span><span className="font-semibold">{x.alumAdet} adet × {f(x.alumProfil)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">YAPIŞKANLI ŞERİT</span><span className="font-semibold">{x.seritAdet} adet × {f(x.serit)} cm</span></div>
                    <div className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">İP BOYU</span><span className="font-semibold">{f(x.ipBoy)} cm</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={add} className="btn-secondary mt-3 w-full border-dashed py-2 text-sm">+ Perde ekle</button>

      {totals.ara > 0 && (
        <div className="mt-6 ml-auto max-w-xs rounded-xl border border-brand-line bg-white p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Ara toplam</span><span className="font-semibold text-brand-ink">{kr(totals.ara)}</span></div>
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Moms %25</span><span className="text-brand-ink">{kr(totals.moms)}</span></div>
          <div className="mt-1 flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Genel toplam</span><span className="text-brand-greendark">{kr(totals.dahil)}</span></div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-8"><h2 className="mb-3 text-lg font-bold text-brand-ink">Kayıtlı perdeler</h2>
          <div className="space-y-2">{saved.map((s) => (<div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm"><div><span className="font-semibold text-brand-ink">{s.musteri}</span> <span className="text-brand-ink2/55">· {s.rows.length} perde · {s.date}</span></div><div className="flex gap-3"><button onClick={() => yukle(s)} className="font-medium text-brand-greendark hover:underline">Aç</button><button onClick={() => sil(s.id)} className="text-red-400 hover:text-red-600">Sil</button></div></div>))}</div>
        </div>
      )}
    </div>
  );
}
