"use client";
import { useEffect, useMemo, useState } from "react";

type Sys = "1,9" | "2,8";
type Tip = "TEK" | "DUBLE";
const TEK: Record<Sys, any> = { "1,9": { y5: 3.5, y6: 5.5, y7: 5.8, y8: 4, y9: 2.2, y12: 20, y13: 15 }, "2,8": { y5: 4, y6: 7.2, y7: 7.7, y8: 4.6, y9: 1.6, y12: 20, y13: 15 } };
const DUB: Record<Sys, any> = { "1,9": { y5: 3.7, y6: 5.7, y7: 5.8, y8: 4, y9: 2.2, y12: 54, y13: 5 }, "2,8": { y5: 4, y6: 7.2, y7: 7.5, y8: 4, y9: 2, y12: 52.5, y13: 5 } };
const ceil = (x: number) => Math.ceil(Math.round(x * 1e9) / 1e9);
const f = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));
const r50 = (cm: number) => Math.ceil(cm / 50) * 50;
const kr = (n: number) => (Math.round(n * 100) / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";

interface Row { uid: number; sys: Sys; tip: Tip; model: "YANA" | "AŞAĞI"; adet: string; en: string; boy: string; done?: boolean; }
let c = 1;
const blank = (): Row => ({ uid: c++, sys: "1,9", tip: "TEK", model: "YANA", adet: "1", en: "", boy: "", done: false });
interface Part { label: string; qty: number; len?: number; kind: "cut" | "count" | "pile"; sys: Sys }
const DEF_RATES = { tek19: 400, tek28: 450, dub19: 500, dub28: 550 };

function dims(r: Row) {
  const en = parseFloat(r.en.replace(",", ".")) || 0, boy = parseFloat(r.boy.replace(",", ".")) || 0, adet = Math.max(1, parseInt(r.adet) || 1);
  return { en, boy, adet };
}
function parts(r: Row): Part[] | null {
  const { en, boy, adet } = dims(r);
  if (en <= 0 || boy <= 0) return null;
  const out: Part[] = [];
  const P = (label: string, qty: number, len: number | undefined, kind: Part["kind"]) => out.push({ label, qty, len, kind, sys: r.sys });
  if (r.tip === "TEK") {
    const s = TEK[r.sys]; let kasaEn, kasaBoy, kanat, tul, kat, ipBoy, ipAdet;
    if (r.model === "YANA") { kasaEn = en - s.y5; kasaBoy = boy - s.y6; kanat = boy - s.y7; tul = boy - s.y8; kat = en / s.y9; ipBoy = en + boy + s.y12; ipAdet = ceil((tul - 7) / 25) * adet; }
    else { kasaEn = en - s.y6; kasaBoy = boy - s.y5; kanat = en - s.y7; tul = en - s.y8; kat = boy / s.y9; ipBoy = en + boy + s.y13; ipAdet = ceil((tul - 7) / 26) * adet; }
    P("KASA EN", 2 * adet, kasaEn, "cut"); P("KASA BOY", 2 * adet, kasaBoy, "cut"); P("KANAT", adet, kanat, "cut"); P("TÜL BOY", adet, tul, "cut");
    P("İP", ipAdet, ipBoy, "cut"); P("BANT", 2 * adet, tul, "cut"); P("PLS ŞERİT", 2 * adet, tul, "cut"); P("PLS TAKIM", adet, undefined, "count"); P("TÜL KAT", adet, kat, "pile");
  } else {
    const s = DUB[r.sys]; const kasaEn = en - s.y5, kasaBoy = boy - s.y6, kanat = boy - s.y7, tul = boy - s.y8, kat = (en / 2) / s.y9, ipBoy = en / 2 + boy + s.y12, ipAdet = ceil(((tul - 7) / (tul < 190 ? 28 : 25)) * 2) * adet, mik = boy - s.y13;
    P("KASA EN", 2 * adet, kasaEn, "cut"); P("KASA BOY", 2 * adet, kasaBoy, "cut"); P("KANAT", 2 * adet, kanat, "cut"); P("TÜL BOY", 2 * adet, tul, "cut");
    P("İP", ipAdet, ipBoy, "cut"); P("BANT", 4 * adet, tul, "cut"); P("PLS ŞERİT", 4 * adet, tul, "cut"); P("MIKNATIS", adet, mik, "cut"); P("PLS TAKIM", 2 * adet, undefined, "count"); P("TÜL KAT", 2 * adet, kat, "pile");
  }
  return out;
}
const ORDER = ["KASA EN", "KASA BOY", "KANAT", "TÜL BOY", "BANT", "PLS ŞERİT", "MIKNATIS", "İP", "PLS TAKIM"];

export default function ImalatCalc() {
  const [musteri, setMusteri] = useState(""); const [tel, setTel] = useState(""); const [adres, setAdres] = useState("");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [openUid, setOpenUid] = useState<number | null>(null);
  const [rates, setRates] = useState(DEF_RATES);
  const [showRates, setShowRates] = useState(false);
  const [saved, setSaved] = useState<any[]>([]); const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rt = JSON.parse(localStorage.getItem("imalat_rates") || "null"); if (rt) setRates({ ...DEF_RATES, ...rt });
      const imp = JSON.parse(localStorage.getItem("imalat_import") || "null");
      if (imp && imp.rows?.length) { setMusteri(imp.musteri || ""); setTel(imp.tel || ""); setAdres(imp.adres || ""); setRows(imp.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); localStorage.removeItem("imalat_import"); }
      else { const cur = JSON.parse(localStorage.getItem("imalat_current") || "null"); if (cur && cur.rows?.length) { setMusteri(cur.musteri || ""); setTel(cur.tel || ""); setAdres(cur.adres || ""); setRows(cur.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setDoneKeys(cur.doneKeys || []); } }
      setSaved(JSON.parse(localStorage.getItem("imalat_saved") || "[]"));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("imalat_current", JSON.stringify({ musteri, tel, adres, rows, doneKeys })); }, [musteri, tel, adres, rows, doneKeys]);
  useEffect(() => { localStorage.setItem("imalat_rates", JSON.stringify(rates)); }, [rates]);

  const rateOf = (r: Row) => r.tip === "TEK" ? (r.sys === "1,9" ? rates.tek19 : rates.tek28) : (r.sys === "1,9" ? rates.dub19 : rates.dub28);
  function priceOf(r: Row) { const { en, boy, adet } = dims(r); if (en <= 0 || boy <= 0) return null; const m2 = (r50(en) / 100) * (r50(boy) / 100); return { m2, enR: r50(en), boyR: r50(boy), price: m2 * rateOf(r) * adet }; }

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => { if (confirm("Bu pencere silinsin mi?")) setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : [blank()])); };
  const toggleKey = (k: string) => setDoneKeys((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  const liste = useMemo(() => {
    const cut: Record<string, { sys: Sys; label: string; len: number; qty: number }> = {}; const cnt: Record<string, number> = {};
    for (const r of rows) { const ps = parts(r); if (!ps) continue; for (const p of ps) {
      if (p.kind === "cut" && p.len !== undefined) { const k = `${p.sys}|${p.label}|${p.len.toFixed(2)}`; cut[k] = cut[k] || { sys: p.sys, label: p.label, len: p.len, qty: 0 }; cut[k].qty += p.qty; }
      else if (p.kind === "count") { const k = `${p.sys}|${p.label}`; cnt[k] = (cnt[k] || 0) + p.qty; } } }
    const arr = Object.values(cut).sort((a, b) => a.sys.localeCompare(b.sys) || ORDER.indexOf(a.label) - ORDER.indexOf(b.label) || a.len - b.len);
    const counts = Object.entries(cnt).map(([k, v]) => ({ sys: k.split("|")[0] as Sys, label: k.split("|")[1], qty: v }));
    return { arr, counts };
  }, [rows]);

  const totals = useMemo(() => { let ara = 0; for (const r of rows) { const p = priceOf(r); if (p) ara += p.price; } return { ara, moms: ara * 0.25, dahil: ara * 1.25 }; }, [rows, rates]);

  function kaydet() {
    if (!musteri.trim()) { setMsg("Müşteri adı girin."); setTimeout(() => setMsg(null), 2000); return; }
    const rec = { id: Date.now(), musteri: musteri.trim(), tel, adres, date: new Date().toLocaleString("tr-TR"), rows, doneKeys };
    const next = [rec, ...saved].slice(0, 50); setSaved(next); localStorage.setItem("imalat_saved", JSON.stringify(next));
    setMsg("Kaydedildi ✓"); setTimeout(() => setMsg(null), 2000);
  }
  function yukle(rec: any) { setMusteri(rec.musteri || ""); setTel(rec.tel || ""); setAdres(rec.adres || ""); setRows(rec.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setDoneKeys(rec.doneKeys || []); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function sil(id: number) { const n = saved.filter((s) => s.id !== id); setSaved(n); localStorage.setItem("imalat_saved", JSON.stringify(n)); }
  function yeni() { if (confirm("Yeni boş sayfa açılsın mı?")) { setMusteri(""); setTel(""); setAdres(""); setRows([blank()]); setDoneKeys([]); } }

  function yazdir() {
    const win = window.open("", "_blank", "width=900,height=1000"); if (!win) return;
    const wr = rows.map((r, i) => { const pr = priceOf(r); return `<tr><td>${i + 1}</td><td>${r.sys}</td><td>${r.tip === "DUBLE" ? "Duble" : "Tek"}</td><td>${r.adet}</td><td>${r.en}×${r.boy}</td><td>${pr ? f(pr.enR) + "×" + f(pr.boyR) : "-"}</td><td>${pr ? kr(pr.price) : "-"}</td></tr>`; }).join("");
    const kl = liste.arr.map((p) => `<tr><td>${p.sys}</td><td>${p.label}</td><td>${f(p.len)}</td><td>${p.qty} adet</td></tr>`).join("") + liste.counts.map((p) => `<tr><td>${p.sys}</td><td>${p.label}</td><td>-</td><td>${p.qty} adet</td></tr>`).join("");
    win.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>İş Emri - ${musteri || ""}</title>
    <style>body{font-family:Arial,sans-serif;color:#111;padding:28px;max-width:800px;margin:0 auto}h2{font-size:15px;margin:22px 0 8px;text-transform:uppercase;color:#3f9c12}.head{display:flex;justify-content:space-between;border-bottom:3px solid #11241c;padding-bottom:12px}.brand{font-weight:800;font-size:24px}.brand span{color:#5cc524}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f1f5f3;font-size:11px;color:#555}.tot{margin-top:14px;width:auto;float:right}.tot td{border:none;padding:3px 10px}@media print{button{display:none}}</style></head><body>
    <div class="head"><div><div class="brand">MYGGE<span>STOP</span></div><div style="font-size:13px;color:#555">İŞ EMRİ</div></div>
    <div style="text-align:right;font-size:13px"><b>${musteri || "-"}</b><br>${tel || ""}<br>${adres || ""}<br>${new Date().toLocaleString("tr-TR")}</div></div>
    <h2>Pencereler & fiyat</h2><table><thead><tr><th>#</th><th>Sistem</th><th>Tip</th><th>Adet</th><th>Ölçü cm</th><th>Hesap (50)</th><th>Fiyat</th></tr></thead><tbody>${wr}</tbody></table>
    <table class="tot"><tr><td>Ara toplam:</td><td style="text-align:right"><b>${kr(totals.ara)}</b></td></tr><tr><td>Moms %25:</td><td style="text-align:right">${kr(totals.moms)}</td></tr><tr><td><b>Genel toplam:</b></td><td style="text-align:right"><b>${kr(totals.dahil)}</b></td></tr></table>
    <div style="clear:both"></div><h2>Kesim listesi (toplam)</h2><table><thead><tr><th>Sistem</th><th>Parça</th><th>Ölçü (cm)</th><th>Adet</th></tr></thead><tbody>${kl}</tbody></table>
    <p style="margin-top:24px"><button onclick="window.print()" style="padding:10px 20px;background:#3f9c12;color:#fff;border:none;border-radius:8px;cursor:pointer">Yazdır / PDF kaydet</button></p></body></html>`);
    win.document.close();
  }

  const RateInp = ({ k, lbl }: { k: keyof typeof rates; lbl: string }) => (
    <label className="block"><span className="label">{lbl}</span><input className="input py-1.5 text-sm" inputMode="numeric" value={rates[k]} onChange={(e) => setRates({ ...rates, [k]: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} /></label>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-brand-ink">İmalat — Kesim & fiyat</h1><p className="text-sm text-brand-ink2/60">Excel ile birebir. Otomatik kaydedilir.</p></div>
        <div className="flex items-center gap-2"><button onClick={() => setShowRates((s) => !s)} className="btn-secondary py-2 text-sm">Fiyatlar</button><button onClick={yeni} className="btn-secondary py-2 text-sm">Yeni</button><button onClick={yazdir} className="btn-secondary py-2 text-sm">Yazdır / PDF</button><button onClick={kaydet} className="btn-primary py-2 text-sm">Kaydet</button></div>
      </div>

      {showRates && (
        <div className="mb-4 rounded-xl border border-brand-line bg-brand-mist/50 p-4">
          <p className="mb-2 text-sm font-semibold text-brand-ink">Fiyatlar (kr/m²)</p>
          <div className="grid gap-3 sm:grid-cols-4"><RateInp k="tek19" lbl="Tek 1,9" /><RateInp k="tek28" lbl="Tek 2,8" /><RateInp k="dub19" lbl="Duble 1,9" /><RateInp k="dub28" lbl="Duble 2,8" /></div>
          <p className="mt-2 text-xs text-brand-ink2/55">m² = (EN ve BOY 50 cm'e yukarı) → m² × kr/m² × adet. Moms %25 eklenir.</p>
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
          const ps = parts(r); const open = openUid === r.uid; const pr = priceOf(r);
          return (
            <div key={r.uid} className={`rounded-xl border border-brand-line ${r.done ? "bg-green-50/60" : "bg-white"}`}>
              <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                <button onClick={() => setOpenUid(open ? null : r.uid)} className="flex items-center gap-1.5 text-sm font-bold text-brand-greendark"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span> detay {open ? "▲" : "▼"}</button>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-ink">{pr ? kr(pr.price) : ""}</span>
                  <label className="flex items-center gap-1 text-xs text-brand-ink2/70"><input type="checkbox" checked={!!r.done} onChange={(e) => upd(r.uid, { done: e.target.checked })} /> Tamam</label>
                  <button onClick={() => del(r.uid)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5 sm:grid-cols-6">
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Sistem</span><select className="input py-2 text-sm" value={r.sys} onChange={(e) => upd(r.uid, { sys: e.target.value as Sys })}><option>1,9</option><option>2,8</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Tip</span><select className="input py-2 text-sm" value={r.tip} onChange={(e) => upd(r.uid, { tip: e.target.value as Tip })}><option value="TEK">Tek</option><option value="DUBLE">Duble</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Model</span><select className="input py-2 text-sm" value={r.model} disabled={r.tip === "DUBLE"} onChange={(e) => upd(r.uid, { model: e.target.value as any })}><option value="YANA">Yana</option><option value="AŞAĞI">Aşağı</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Adet</span><input className="input py-2 text-sm" inputMode="numeric" value={r.adet} onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">EN (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.en} onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">BOY (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.boy} onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
              </div>
              {open && ps && (
                <div className="border-t border-brand-line bg-brand-mist/40 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink2/60">Pencere {i + 1} — {r.tip === "DUBLE" ? "Duble" : "Tek"} {r.sys} · {r.en}×{r.boy} cm {pr ? `· ${f(pr.enR)}×${f(pr.boyR)} hesap · ${kr(pr.price)}` : ""}</p>
                  <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                    {ps.map((p) => (<div key={p.label} className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">{p.label}</span><span className="font-semibold text-brand-ink">{p.kind === "pile" ? `${f(p.len!)} kat` : p.kind === "count" ? `${p.qty} adet` : `${p.qty} adet × ${f(p.len!)} cm`}</span></div>))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={add} className="btn-secondary mt-3 w-full border-dashed py-2 text-sm">+ Pencere ekle</button>

      {totals.ara > 0 && (
        <div className="mt-6 ml-auto max-w-xs rounded-xl border border-brand-line bg-white p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Ara toplam</span><span className="font-semibold text-brand-ink">{kr(totals.ara)}</span></div>
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Moms %25</span><span className="text-brand-ink">{kr(totals.moms)}</span></div>
          <div className="mt-1 flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Genel toplam</span><span className="text-brand-greendark">{kr(totals.dahil)}</span></div>
        </div>
      )}

      {liste.arr.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-bold text-brand-ink">Kesim listesi (toplam)</h2>
          <p className="mb-3 text-sm text-brand-ink2/60">Aynı ölçüler birleştirildi. Kesileni işaretle.</p>
          <div className="overflow-x-auto rounded-xl border border-brand-line">
            <table className="w-full min-w-[460px] text-sm"><thead><tr className="bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60"><th className="px-3 py-2">✓</th><th className="px-3 py-2">Sistem</th><th className="px-3 py-2">Parça</th><th className="px-3 py-2">Ölçü</th><th className="px-3 py-2">Adet</th></tr></thead>
              <tbody className="divide-y divide-brand-line">
                {liste.arr.map((p, idx) => { const k = `${p.sys}|${p.label}|${p.len.toFixed(2)}`; const d = doneKeys.includes(k); return (
                  <tr key={idx} className={d ? "bg-green-50/60" : ""}><td className="px-3 py-2"><input type="checkbox" checked={d} onChange={() => toggleKey(k)} /></td><td className="px-3 py-2 text-brand-ink2/70">{p.sys}</td><td className={`px-3 py-2 font-medium ${d ? "text-brand-ink2/40 line-through" : "text-brand-ink"}`}>{p.label}</td><td className={`px-3 py-2 font-semibold ${d ? "text-brand-ink2/40 line-through" : "text-brand-ink"}`}>{f(p.len)} cm</td><td className="px-3 py-2 text-brand-ink">{p.qty} adet</td></tr>); })}
                {liste.counts.map((p, idx) => (<tr key={"c" + idx} className="bg-brand-mist/40"><td className="px-3 py-2"></td><td className="px-3 py-2 text-brand-ink2/70">{p.sys}</td><td className="px-3 py-2 font-medium text-brand-ink">{p.label}</td><td className="px-3 py-2 text-brand-ink2/50">—</td><td className="px-3 py-2 text-brand-ink">{p.qty} adet</td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-8"><h2 className="mb-3 text-lg font-bold text-brand-ink">Kayıtlı siparişler</h2>
          <div className="space-y-2">{saved.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm">
              <div><span className="font-semibold text-brand-ink">{s.musteri}</span> <span className="text-brand-ink2/55">· {s.rows.length} pencere · {s.date}</span></div>
              <div className="flex gap-3"><button onClick={() => yukle(s)} className="font-medium text-brand-greendark hover:underline">Aç</button><button onClick={() => sil(s.id)} className="text-red-400 hover:text-red-600">Sil</button></div>
            </div>))}
          </div>
        </div>
      )}
    </div>
  );
}
