"use client";
import { useState } from "react";

type Sys = "1,9" | "2,8";
const SYS: Record<Sys, { y5: number; y6: number; y7: number; y8: number; y9: number; y12: number; y13: number }> = {
  "1,9": { y5: 3.5, y6: 5.5, y7: 5.8, y8: 4, y9: 2.2, y12: 20, y13: 15 },
  "2,8": { y5: 4, y6: 7.2, y7: 7.7, y8: 4.6, y9: 1.6, y12: 20, y13: 15 }
};

interface Row { uid: number; model: "YANA" | "AŞAĞI"; adet: string; en: string; boy: string; }
let c = 1;
const blank = (): Row => ({ uid: c++, model: "YANA", adet: "1", en: "", boy: "" });
const f = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));

export default function ImalatCalc() {
  const [sys, setSys] = useState<Sys>("1,9");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const s = SYS[sys];

  const calc = (r: Row) => {
    const en = parseFloat(r.en.replace(",", ".")) || 0;
    const boy = parseFloat(r.boy.replace(",", ".")) || 0;
    const adet = Math.max(1, parseInt(r.adet) || 1);
    if (en <= 0 || boy <= 0) return null;
    let kasaEn, kasaBoy, kanat, tul, kat, ipAdet, ipBoy;
    if (r.model === "YANA") {
      kasaEn = en - s.y5; kasaBoy = boy - s.y6; kanat = boy - s.y7; tul = boy - s.y8;
      kat = en / s.y9; ipAdet = Math.ceil((tul - 7) / 25) * adet; ipBoy = en + boy + s.y12;
    } else {
      kasaEn = en - s.y6; kasaBoy = boy - s.y5; kanat = en - s.y7; tul = en - s.y8;
      kat = boy / s.y9; ipAdet = Math.ceil((tul - 7) / 26) * adet; ipBoy = en + boy + s.y13;
    }
    return { adet, kasaEn, kasaBoy, kanat, tul, kat, ipAdet, ipBoy };
  };

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : rs));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">İmalat — Kesim ölçüleri</h1>
          <p className="mt-1 text-sm text-brand-ink2/65">Plisé kesim hesabı (cm). Excel ile birebir doğrulanmış.</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-brand-line bg-white p-1">
          {(["1,9", "2,8"] as Sys[]).map((x) => (
            <button key={x} onClick={() => setSys(x)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${sys === x ? "bg-brand-greendark text-white" : "text-brand-ink2"}`}>Sistem {x}</button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {rows.map((r, i) => {
          const res = calc(r);
          return (
            <div key={r.uid} className="rounded-2xl border border-brand-line bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span> Pencere / kapı</span>
                {rows.length > 1 && <button onClick={() => del(r.uid)} className="text-sm font-medium text-red-500">Sil</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block"><span className="label">Model</span>
                  <select className="input" value={r.model} onChange={(e) => upd(r.uid, { model: e.target.value as any })}>
                    <option value="YANA">Yana (yükseklik)</option>
                    <option value="AŞAĞI">Aşağı (en)</option>
                  </select>
                </label>
                <label className="block"><span className="label">Adet</span><input className="input" inputMode="numeric" value={r.adet} onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                <label className="block"><span className="label">EN (cm)</span><input className="input" inputMode="decimal" value={r.en} onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="label">BOY (cm)</span><input className="input" inputMode="decimal" value={r.boy} onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
              </div>

              {res && (
                <div className="mt-4 grid gap-2 rounded-xl bg-brand-mist/60 p-4 text-sm sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-brand-ink2/70">KASA EN</span><span className="font-semibold text-brand-ink">{2 * res.adet} adet × {f(res.kasaEn)} cm</span></div>
                  <div className="flex justify-between"><span className="text-brand-ink2/70">KASA BOY</span><span className="font-semibold text-brand-ink">{2 * res.adet} adet × {f(res.kasaBoy)} cm</span></div>
                  <div className="flex justify-between"><span className="text-brand-ink2/70">KANAT</span><span className="font-semibold text-brand-ink">{res.adet} adet × {f(res.kanat)} cm</span></div>
                  <div className="flex justify-between"><span className="text-brand-ink2/70">TÜL (ölçü)</span><span className="font-semibold text-brand-ink">{res.adet} adet × {f(res.tul)} cm</span></div>
                  <div className="flex justify-between"><span className="text-brand-ink2/70">KAT (pile sayısı)</span><span className="font-semibold text-brand-ink">{f(res.kat)}</span></div>
                  <div className="flex justify-between"><span className="text-brand-ink2/70">İP</span><span className="font-semibold text-brand-ink">{res.ipAdet} adet × {f(res.ipBoy)} cm</span></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={add} className="btn-secondary mt-5 w-full border-dashed">+ Satır ekle</button>
    </div>
  );
}
