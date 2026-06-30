"use client";
import { useState } from "react";

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

interface Row { uid: number; model: "YANA" | "AŞAĞI"; adet: string; en: string; boy: string; }
let c = 1;
const blank = (): Row => ({ uid: c++, model: "YANA", adet: "1", en: "", boy: "" });

export default function ImalatCalc() {
  const [tip, setTip] = useState<Tip>("TEK");
  const [sys, setSys] = useState<Sys>("1,9");
  const [rows, setRows] = useState<Row[]>([blank()]);

  function calc(r: Row) {
    const en = parseFloat(r.en.replace(",", ".")) || 0;
    const boy = parseFloat(r.boy.replace(",", ".")) || 0;
    const adet = Math.max(1, parseInt(r.adet) || 1);
    if (en <= 0 || boy <= 0) return null;
    const parts: { label: string; qty: number; len?: number }[] = [];

    if (tip === "TEK") {
      const s = TEK[sys];
      let kasaEn, kasaBoy, kanat, tul, kat, ipBoy, ipAdet;
      if (r.model === "YANA") {
        kasaEn = en - s.y5; kasaBoy = boy - s.y6; kanat = boy - s.y7; tul = boy - s.y8;
        kat = en / s.y9; ipBoy = en + boy + s.y12; ipAdet = ceil((tul - 7) / 25) * adet;
      } else {
        kasaEn = en - s.y6; kasaBoy = boy - s.y5; kanat = en - s.y7; tul = en - s.y8;
        kat = boy / s.y9; ipBoy = en + boy + s.y13; ipAdet = ceil((tul - 7) / 26) * adet;
      }
      parts.push({ label: "KASA EN", qty: 2 * adet, len: kasaEn });
      parts.push({ label: "KASA BOY", qty: 2 * adet, len: kasaBoy });
      parts.push({ label: "KANAT", qty: adet, len: kanat });
      parts.push({ label: "TÜL BOY", qty: adet, len: tul });
      parts.push({ label: "KAT (pile)", qty: 0, len: kat });
      parts.push({ label: "İP", qty: ipAdet, len: ipBoy });
      parts.push({ label: "PLS TAKIM", qty: adet });
      parts.push({ label: "BANT", qty: 2 * adet, len: tul });
      parts.push({ label: "PLS ŞERİT", qty: 2 * adet, len: tul });
    } else {
      const s = DUB[sys];
      const kasaEn = en - s.y5, kasaBoy = boy - s.y6, kanat = boy - s.y7, tul = boy - s.y8;
      const kat = (en / 2) / s.y9, ipBoy = en / 2 + boy + s.y12;
      const ipAdet = ceil(((tul - 7) / (tul < 190 ? 28 : 25)) * 2) * adet;
      const mik = boy - s.y13;
      parts.push({ label: "KASA EN", qty: 2 * adet, len: kasaEn });
      parts.push({ label: "KASA BOY", qty: 2 * adet, len: kasaBoy });
      parts.push({ label: "KANAT", qty: 2 * adet, len: kanat });
      parts.push({ label: "TÜL BOY", qty: 2 * adet, len: tul });
      parts.push({ label: "KAT (pile)", qty: 0, len: kat });
      parts.push({ label: "İP", qty: ipAdet, len: ipBoy });
      parts.push({ label: "PLS TAKIM", qty: 2 * adet });
      parts.push({ label: "BANT", qty: 4 * adet, len: tul });
      parts.push({ label: "PLS ŞERİT", qty: 4 * adet, len: tul });
      parts.push({ label: "MIKNATIS", qty: adet, len: mik });
    }
    return parts;
  }

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : rs));

  const Toggle = ({ val, set, opts, pre }: any) => (
    <div className="flex items-center gap-1 rounded-full border border-brand-line bg-white p-1">
      {opts.map((o: string) => (
        <button key={o} onClick={() => set(o)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${val === o ? "bg-brand-greendark text-white" : "text-brand-ink2"}`}>{pre}{o}</button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-brand-ink">İmalat — Kesim ölçüleri</h1>
        <p className="mt-1 text-sm text-brand-ink2/65">Plisé kesim hesabı (cm). Excel ile birebir doğrulanmış (tüm parçalar).</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Toggle val={tip} set={setTip} opts={["TEK", "DUBLE"]} pre="" />
        <Toggle val={sys} set={setSys} opts={["1,9", "2,8"]} pre="Sistem " />
      </div>

      <div className="space-y-5">
        {rows.map((r, i) => {
          const res = calc(r);
          return (
            <div key={r.uid} className="rounded-2xl border border-brand-line bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span> {tip === "DUBLE" ? "Duble plisé" : "Tek plisé"} — pencere/kapı</span>
                {rows.length > 1 && <button onClick={() => del(r.uid)} className="text-sm font-medium text-red-500">Sil</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {tip === "TEK" && (
                  <label className="block"><span className="label">Model</span>
                    <select className="input" value={r.model} onChange={(e) => upd(r.uid, { model: e.target.value as any })}>
                      <option value="YANA">Yana (yükseklik)</option>
                      <option value="AŞAĞI">Aşağı (en)</option>
                    </select>
                  </label>
                )}
                <label className="block"><span className="label">Adet</span><input className="input" inputMode="numeric" value={r.adet} onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                <label className="block"><span className="label">EN (cm)</span><input className="input" inputMode="decimal" value={r.en} onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="label">BOY (cm)</span><input className="input" inputMode="decimal" value={r.boy} onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
              </div>

              {res && (
                <div className="mt-4 overflow-hidden rounded-xl border border-brand-line">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60"><th className="px-4 py-2">Parça</th><th className="px-4 py-2">Adet</th><th className="px-4 py-2">Ölçü (cm)</th></tr></thead>
                    <tbody className="divide-y divide-brand-line">
                      {res.map((p) => (
                        <tr key={p.label}>
                          <td className="px-4 py-2 font-medium text-brand-ink">{p.label}</td>
                          <td className="px-4 py-2 text-brand-ink2">{p.qty > 0 ? p.qty : "—"}</td>
                          <td className="px-4 py-2 font-semibold text-brand-ink">{p.len !== undefined ? f(p.len) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
