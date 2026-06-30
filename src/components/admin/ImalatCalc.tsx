"use client";
import { useEffect, useMemo, useState } from "react";

type Sys = "1,9" | "2,8";
type Tip = "TEK" | "DUBLE";

const TEK: Record<Sys, any> = {
  "1,9": { y5: 3.5, y6: 5.5, y7: 5.8, y8: 4, y9: 2.2, y12: 20, y13: 15 },
  "2,8": { y5: 4, y6: 7.2, y7: 7.7, y8: 4.6, y9: 1.6, y12: 20, y13: 15 }
};
const DUB: Record<Sys, any> = {
  "1,9": { y5: 3.7, y6: 5.7, y7: 5.8, y8: 4, y9: 2.2, y12: 54, y13: 5 },
  "2,8": { y5: 4, y6: 7.2, y7: 7.5, y8: 4, y9: 2, y12: 52.5, y13: 5 }
};
const ceil = (x: number) => Math.ceil(Math.round(x * 1e9) / 1e9);
const f = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));

interface Row { uid: number; sys: Sys; tip: Tip; model: "YANA" | "AŞAĞI"; adet: string; en: string; boy: string; }
let c = 1;
const blank = (): Row => ({ uid: c++, sys: "1,9", tip: "TEK", model: "YANA", adet: "1", en: "", boy: "" });

interface Part { label: string; qty: number; len?: number; kind: "cut" | "count" | "pile"; sys: Sys }

function parts(r: Row): Part[] | null {
  const en = parseFloat(r.en.replace(",", ".")) || 0;
  const boy = parseFloat(r.boy.replace(",", ".")) || 0;
  const adet = Math.max(1, parseInt(r.adet) || 1);
  if (en <= 0 || boy <= 0) return null;
  const out: Part[] = [];
  const P = (label: string, qty: number, len: number | undefined, kind: Part["kind"]) => out.push({ label, qty, len, kind, sys: r.sys });
  if (r.tip === "TEK") {
    const s = TEK[r.sys];
    let kasaEn, kasaBoy, kanat, tul, kat, ipBoy, ipAdet;
    if (r.model === "YANA") { kasaEn = en - s.y5; kasaBoy = boy - s.y6; kanat = boy - s.y7; tul = boy - s.y8; kat = en / s.y9; ipBoy = en + boy + s.y12; ipAdet = ceil((tul - 7) / 25) * adet; }
    else { kasaEn = en - s.y6; kasaBoy = boy - s.y5; kanat = en - s.y7; tul = en - s.y8; kat = boy / s.y9; ipBoy = en + boy + s.y13; ipAdet = ceil((tul - 7) / 26) * adet; }
    P("KASA EN", 2 * adet, kasaEn, "cut"); P("KASA BOY", 2 * adet, kasaBoy, "cut"); P("KANAT", adet, kanat, "cut");
    P("TÜL BOY", adet, tul, "cut"); P("İP", ipAdet, ipBoy, "cut"); P("BANT", 2 * adet, tul, "cut"); P("PLS ŞERİT", 2 * adet, tul, "cut");
    P("PLS TAKIM", adet, undefined, "count"); P("KAT (pile)", adet, kat, "pile");
  } else {
    const s = DUB[r.sys];
    const kasaEn = en - s.y5, kasaBoy = boy - s.y6, kanat = boy - s.y7, tul = boy - s.y8;
    const kat = (en / 2) / s.y9, ipBoy = en / 2 + boy + s.y12, ipAdet = ceil(((tul - 7) / (tul < 190 ? 28 : 25)) * 2) * adet, mik = boy - s.y13;
    P("KASA EN", 2 * adet, kasaEn, "cut"); P("KASA BOY", 2 * adet, kasaBoy, "cut"); P("KANAT", 2 * adet, kanat, "cut");
    P("TÜL BOY", 2 * adet, tul, "cut"); P("İP", ipAdet, ipBoy, "cut"); P("BANT", 4 * adet, tul, "cut"); P("PLS ŞERİT", 4 * adet, tul, "cut");
    P("MIKNATIS", adet, mik, "cut"); P("PLS TAKIM", 2 * adet, undefined, "count"); P("KAT (pile)", 2 * adet, kat, "pile");
  }
  return out;
}

const ORDER = ["KASA EN", "KASA BOY", "KANAT", "TÜL BOY", "BANT", "PLS ŞERİT", "MIKNATIS", "İP", "PLS TAKIM"];

export default function ImalatCalc() {
  const [musteri, setMusteri] = useState("");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [saved, setSaved] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // yukle
  useEffect(() => {
    try {
      const cur = JSON.parse(localStorage.getItem("imalat_current") || "null");
      if (cur && cur.rows?.length) { setMusteri(cur.musteri || ""); setRows(cur.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); }
      setSaved(JSON.parse(localStorage.getItem("imalat_saved") || "[]"));
    } catch {}
  }, []);
  // otomatik kaydet
  useEffect(() => { localStorage.setItem("imalat_current", JSON.stringify({ musteri, rows })); }, [musteri, rows]);

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : [blank()]));

  // toplu kesim listesi (ayni olculeri birlestir)
  const liste = useMemo(() => {
    const cut: Record<string, { sys: Sys; label: string; len: number; qty: number }> = {};
    const cnt: Record<string, number> = {};
    for (const r of rows) {
      const ps = parts(r); if (!ps) continue;
      for (const p of ps) {
        if (p.kind === "cut" && p.len !== undefined) {
          const k = `${p.sys}|${p.label}|${p.len.toFixed(2)}`;
          cut[k] = cut[k] || { sys: p.sys, label: p.label, len: p.len, qty: 0 }; cut[k].qty += p.qty;
        } else if (p.kind === "count") { const k = `${p.sys}|${p.label}`; cnt[k] = (cnt[k] || 0) + p.qty; }
      }
    }
    const arr = Object.values(cut).sort((a, b) => a.sys.localeCompare(b.sys) || ORDER.indexOf(a.label) - ORDER.indexOf(b.label) || a.len - b.len);
    const counts = Object.entries(cnt).map(([k, v]) => ({ sys: k.split("|")[0] as Sys, label: k.split("|")[1], qty: v }));
    return { arr, counts };
  }, [rows]);

  function kaydet() {
    if (!musteri.trim()) { setMsg("Müşteri adı girin."); setTimeout(() => setMsg(null), 2000); return; }
    const rec = { id: Date.now(), musteri: musteri.trim(), date: new Date().toLocaleString("tr-TR"), rows };
    const next = [rec, ...saved].slice(0, 50);
    setSaved(next); localStorage.setItem("imalat_saved", JSON.stringify(next));
    setMsg("Kaydedildi ✓"); setTimeout(() => setMsg(null), 2000);
  }
  function yukle(rec: any) { setMusteri(rec.musteri); setRows(rec.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function sil(id: number) { const n = saved.filter((s) => s.id !== id); setSaved(n); localStorage.setItem("imalat_saved", JSON.stringify(n)); }
  function yeni() { setMusteri(""); setRows([blank()]); }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-brand-ink">İmalat — Kesim hesabı</h1><p className="text-sm text-brand-ink2/60">Excel ile birebir. Otomatik kaydedilir.</p></div>
        <div className="flex items-center gap-2">
          <button onClick={yeni} className="btn-secondary py-2 text-sm">Yeni</button>
          <button onClick={kaydet} className="btn-primary py-2 text-sm">Kaydet</button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="label">Müşteri</span><input className="input" value={musteri} onChange={(e) => setMusteri(e.target.value)} placeholder="Müşteri adı" /></label>
        {msg && <div className="flex items-end pb-2 text-sm font-medium text-brand-greendark">{msg}</div>}
      </div>

      {/* kompakt satirlar */}
      <div className="overflow-hidden rounded-xl border border-brand-line">
        <div className="hidden bg-brand-mist px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-ink2/60 sm:grid sm:grid-cols-[28px_84px_84px_110px_70px_80px_80px_36px] sm:gap-2">
          <span>#</span><span>Sistem</span><span>Tip</span><span>Model</span><span>Adet</span><span>EN cm</span><span>BOY cm</span><span></span>
        </div>
        {rows.map((r, i) => (
          <div key={r.uid} className="grid grid-cols-2 gap-2 border-t border-brand-line px-3 py-2 sm:grid-cols-[28px_84px_84px_110px_70px_80px_80px_36px] sm:items-center">
            <span className="text-sm font-bold text-brand-greendark">{i + 1}</span>
            <select className="input py-1.5 text-sm" value={r.sys} onChange={(e) => upd(r.uid, { sys: e.target.value as Sys })}><option>1,9</option><option>2,8</option></select>
            <select className="input py-1.5 text-sm" value={r.tip} onChange={(e) => upd(r.uid, { tip: e.target.value as Tip })}><option value="TEK">Tek</option><option value="DUBLE">Duble</option></select>
            <select className="input py-1.5 text-sm" value={r.model} disabled={r.tip === "DUBLE"} onChange={(e) => upd(r.uid, { model: e.target.value as any })}><option value="YANA">Yana</option><option value="AŞAĞI">Aşağı</option></select>
            <input className="input py-1.5 text-sm" inputMode="numeric" value={r.adet} placeholder="Adet" onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} />
            <input className="input py-1.5 text-sm" inputMode="decimal" value={r.en} placeholder="EN" onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} />
            <input className="input py-1.5 text-sm" inputMode="decimal" value={r.boy} placeholder="BOY" onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} />
            <button onClick={() => del(r.uid)} className="text-lg text-red-400 hover:text-red-600">×</button>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn-secondary mt-3 w-full border-dashed py-2 text-sm">+ Pencere ekle</button>

      {/* toplu kesim listesi */}
      {liste.arr.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-bold text-brand-ink">Kesim listesi (toplam)</h2>
          <p className="mb-3 text-sm text-brand-ink2/60">Aynı ölçüler birleştirildi. Sisteme göre gruplu.</p>
          <div className="overflow-hidden rounded-xl border border-brand-line">
            <table className="w-full text-sm">
              <thead><tr className="bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60"><th className="px-4 py-2">Sistem</th><th className="px-4 py-2">Parça</th><th className="px-4 py-2">Ölçü (cm)</th><th className="px-4 py-2">Adet</th></tr></thead>
              <tbody className="divide-y divide-brand-line">
                {liste.arr.map((p, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-brand-ink2/70">{p.sys}</td>
                    <td className="px-4 py-2 font-medium text-brand-ink">{p.label}</td>
                    <td className="px-4 py-2 font-semibold text-brand-ink">{f(p.len)}</td>
                    <td className="px-4 py-2 text-brand-ink">{p.qty} adet</td>
                  </tr>
                ))}
                {liste.counts.map((p, idx) => (
                  <tr key={"c" + idx} className="bg-brand-mist/40">
                    <td className="px-4 py-2 text-brand-ink2/70">{p.sys}</td>
                    <td className="px-4 py-2 font-medium text-brand-ink">{p.label}</td>
                    <td className="px-4 py-2 text-brand-ink2/50">—</td>
                    <td className="px-4 py-2 text-brand-ink">{p.qty} adet</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* kayitli siparisler */}
      {saved.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-brand-ink">Kayıtlı siparişler</h2>
          <div className="space-y-2">
            {saved.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm">
                <div><span className="font-semibold text-brand-ink">{s.musteri}</span> <span className="text-brand-ink2/55">· {s.rows.length} pencere · {s.date}</span></div>
                <div className="flex gap-3">
                  <button onClick={() => yukle(s)} className="font-medium text-brand-greendark hover:underline">Aç</button>
                  <button onClick={() => sil(s.id)} className="text-red-400 hover:text-red-600">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
