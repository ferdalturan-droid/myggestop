"use client";
import { useEffect, useMemo, useState } from "react";

type Sys = "1,9" | "2,8";
type Tip = "TEK" | "DUBLE";
const TEK: Record<Sys, any> = { "1,9": { y5: 3.5, y6: 5.5, y7: 5.8, y8: 4, y9: 2.2, y12: 20, y13: 15 }, "2,8": { y5: 4, y6: 7.2, y7: 7.7, y8: 4.6, y9: 1.6, y12: 20, y13: 15 } };
const DUB: Record<Sys, any> = { "1,9": { y5: 3.7, y6: 5.7, y7: 5.8, y8: 4, y9: 2.2, y12: 54, y13: 5 }, "2,8": { y5: 4, y6: 7.2, y7: 7.5, y8: 4, y9: 2, y12: 52.5, y13: 5 } };
const ceil = (x: number) => Math.ceil(Math.round(x * 1e9) / 1e9);
const f = (n: number) => (!isFinite(n) ? "-" : (Math.round(n * 100) / 100).toString().replace(".", ","));
const ceilHalf = (x: number) => (x <= 0 ? 0 : Math.ceil((x - 1e-9) * 2) / 2);
const kr = (n: number) => (Math.round(n * 100) / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr";

interface Row { uid: number; sys: Sys; tip: Tip; model: "YANA" | "AŞAĞI"; adet: string; en: string; boy: string; farve: string; done?: boolean; }
let c = 1;
const blank = (): Row => ({ uid: c++, sys: "1,9", tip: "TEK", model: "YANA", adet: "1", en: "", boy: "", farve: "", done: false });
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
    P("RAMME BREDDE", 2 * adet, kasaEn, "cut"); P("RAMME HØJDE", 2 * adet, kasaBoy, "cut"); P("FLØJ", adet, kanat, "cut"); P("NET HØJDE", adet, tul, "cut");
    P("SNOR", ipAdet, ipBoy, "cut"); P("BÅND", 2 * adet, tul, "cut"); P("PLISSE STRIMMEL", 2 * adet, tul, "cut"); P("PLISSE SÆT", adet, undefined, "count"); P("NET LAG", adet, kat, "pile");
  } else {
    const s = DUB[r.sys]; const kasaEn = en - s.y5, kasaBoy = boy - s.y6, kanat = boy - s.y7, tul = boy - s.y8, kat = (en / 2) / s.y9, ipBoy = en / 2 + boy + s.y12, ipAdet = ceil(((tul - 7) / (tul < 190 ? 28 : 25)) * 2) * adet, mik = boy - s.y13;
    P("RAMME BREDDE", 2 * adet, kasaEn, "cut"); P("RAMME HØJDE", 2 * adet, kasaBoy, "cut"); P("FLØJ", 2 * adet, kanat, "cut"); P("NET HØJDE", 2 * adet, tul, "cut");
    P("SNOR", ipAdet, ipBoy, "cut"); P("BÅND", 4 * adet, tul, "cut"); P("PLISSE STRIMMEL", 4 * adet, tul, "cut"); P("MAGNET", adet, mik, "cut"); P("PLISSE SÆT", 2 * adet, undefined, "count"); P("NET LAG", 2 * adet, kat, "pile");
  }
  return out;
}
const ORDER = ["RAMME BREDDE", "RAMME HØJDE", "FLØJ", "NET HØJDE", "BÅND", "PLISSE STRIMMEL", "MAGNET", "SNOR", "PLISSE SÆT"];

export default function ImalatCalc() {
  const [musteri, setMusteri] = useState(""); const [tel, setTel] = useState(""); const [adres, setAdres] = useState("");
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [openUid, setOpenUid] = useState<number | null>(null);
  const [rates, setRates] = useState(DEF_RATES);
  const [showRates, setShowRates] = useState(false);
  const [saved, setSaved] = useState<any[]>([]); const [msg, setMsg] = useState<string | null>(null);
  const [tarih, setTarih] = useState(""); const [saat, setSaat] = useState("");
  const [appts, setAppts] = useState<any[]>([]); const [apptMsg, setApptMsg] = useState<{ t: string; ok: boolean } | null>(null);

  useEffect(() => {
    try {
      const rt = JSON.parse(localStorage.getItem("imalat_rates") || "null"); if (rt) setRates({ ...DEF_RATES, ...rt });
      const imp = JSON.parse(localStorage.getItem("imalat_import") || "null");
      if (imp && imp.rows?.length) { setMusteri(imp.musteri || ""); setTel(imp.tel || ""); setAdres(imp.adres || ""); setRows(imp.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); localStorage.removeItem("imalat_import"); }
      else { const cur = JSON.parse(localStorage.getItem("imalat_current") || "null"); if (cur && cur.rows?.length) { setMusteri(cur.musteri || ""); setTel(cur.tel || ""); setAdres(cur.adres || ""); setRows(cur.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setDoneKeys(cur.doneKeys || []); setTarih(cur.tarih || ""); setSaat(cur.saat || ""); } }
      setSaved(JSON.parse(localStorage.getItem("imalat_saved") || "[]"));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("imalat_current", JSON.stringify({ musteri, tel, adres, rows, doneKeys, tarih, saat })); }, [musteri, tel, adres, rows, doneKeys, tarih, saat]);
  useEffect(() => { fetch("/api/appointments", { cache: "no-store" }).then((r) => r.json()).then((d) => setAppts(d.items || [])).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem("imalat_rates", JSON.stringify(rates)); }, [rates]);

  const rateOf = (r: Row) => r.tip === "TEK" ? (r.sys === "1,9" ? rates.tek19 : rates.tek28) : (r.sys === "1,9" ? rates.dub19 : rates.dub28);
  function priceOf(r: Row) { const { en, boy, adet } = dims(r); if (en <= 0 || boy <= 0) return null; const area = (en / 100) * (boy / 100); const m2 = ceilHalf(area); return { area, m2, price: m2 * rateOf(r) * adet }; }

  const upd = (uid: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...p } : r)));
  const add = () => setRows((rs) => [...rs, blank()]);
  const del = (uid: number) => { if (confirm("Skal dette vindue slettes?")) setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.uid !== uid) : [blank()])); };
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
    if (!musteri.trim()) { setMsg("Angiv kundens navn."); setTimeout(() => setMsg(null), 2000); return; }
    const rec = { id: Date.now(), musteri: musteri.trim(), tel, adres, date: new Date().toLocaleString("da-DK"), rows, doneKeys };
    const next = [rec, ...saved].slice(0, 50); setSaved(next); localStorage.setItem("imalat_saved", JSON.stringify(next));
    setMsg("Gemt ✓"); setTimeout(() => setMsg(null), 2000);
  }
  function yukle(rec: any) { setMusteri(rec.musteri || ""); setTel(rec.tel || ""); setAdres(rec.adres || ""); setRows(rec.rows.map((r: any) => ({ ...blank(), ...r, uid: c++ }))); setDoneKeys(rec.doneKeys || []); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function sil(id: number) { const n = saved.filter((s) => s.id !== id); setSaved(n); localStorage.setItem("imalat_saved", JSON.stringify(n)); }
  function yeni() { if (confirm("Skal en ny tom side åbnes?")) { setMusteri(""); setTel(""); setAdres(""); setRows([blank()]); setDoneKeys([]); } }

  async function loadAppts() { try { const r = await fetch("/api/appointments", { cache: "no-store" }); const d = await r.json(); setAppts(d.items || []); } catch {} }
  async function randevuAl() {
    if (!musteri.trim()) { setApptMsg({ t: "Angiv kundens navn først.", ok: false }); return; }
    if (!tarih || !saat) { setApptMsg({ t: "Vælg dato og klokkeslæt.", ok: false }); return; }
    const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day: tarih, time: saat, customer: musteri, phone: tel, address: adres }) });
    const d = await res.json().catch(() => ({}));
    if (res.status === 409) { setApptMsg({ t: `⚠ ${tarih} ${saat} OPTAGET — ${d.conflict?.customer || ""}`, ok: false }); return; }
    if (!res.ok) { setApptMsg({ t: d.error || "Fejl", ok: false }); return; }
    setApptMsg({ t: "Aftale booket ✓", ok: true }); await loadAppts(); setTimeout(() => setApptMsg(null), 4000);
  }
  async function randevuSil(id: string) { if (!confirm("Skal aftalen slettes?")) return; await fetch(`/api/appointments/${id}`, { method: "DELETE" }); await loadAppts(); }

  function yazdir() {
    const win = window.open("", "_blank", "width=900,height=1000"); if (!win) return;
    const wr = rows.map((r, i) => { const pr = priceOf(r); return `<tr><td>${i + 1}</td><td>${r.sys}</td><td>${r.tip === "DUBLE" ? "Dobbelt" : "Enkelt"}</td><td>${r.adet}</td><td>${r.en}×${r.boy}</td><td>${r.farve || "-"}</td><td>${pr ? f(pr.m2) + " m²" : "-"}</td><td>${pr ? kr(pr.price) : "-"}</td></tr>`; }).join("");
    const kl = liste.arr.map((p) => `<tr><td>${p.sys}</td><td>${p.label}</td><td>${f(p.len)}</td><td>${p.qty} stk.</td></tr>`).join("") + liste.counts.map((p) => `<tr><td>${p.sys}</td><td>${p.label}</td><td>-</td><td>${p.qty} stk.</td></tr>`).join("");
    win.document.write(`<!doctype html><html lang="da"><head><meta charset="utf-8"><title>Arbejdsseddel - ${musteri || ""}</title>
    <style>body{font-family:Arial,sans-serif;color:#111;padding:28px;max-width:800px;margin:0 auto}h2{font-size:15px;margin:22px 0 8px;text-transform:uppercase;color:#3f9c12}.head{display:flex;justify-content:space-between;border-bottom:3px solid #11241c;padding-bottom:12px}.brand{font-weight:800;font-size:24px}.brand span{color:#5cc524}table{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f1f5f3;font-size:11px;color:#555}.tot{margin-top:14px;width:auto;float:right}.tot td{border:none;padding:3px 10px}@media print{button{display:none}}</style></head><body>
    <div class="head"><div><div class="brand">MYGGE<span>STOP</span></div><div style="font-size:13px;color:#555">ARBEJDSSEDDEL</div></div>
    <div style="text-align:right;font-size:13px"><b>${musteri || "-"}</b><br>${tel || ""}<br>${adres || ""}<br>${new Date().toLocaleString("da-DK")}</div></div>
    <h2>Vinduer & pris</h2><table><thead><tr><th>#</th><th>System</th><th>Type</th><th>Antal</th><th>Mål cm</th><th>Farve</th><th>m²</th><th>Pris</th></tr></thead><tbody>${wr}</tbody></table>
    <table class="tot"><tr><td>Subtotal:</td><td style="text-align:right"><b>${kr(totals.ara)}</b></td></tr><tr><td>Moms 25%:</td><td style="text-align:right">${kr(totals.moms)}</td></tr><tr><td><b>Total i alt:</b></td><td style="text-align:right"><b>${kr(totals.dahil)}</b></td></tr></table>
    <div style="clear:both"></div><h2>Skæreliste (i alt)</h2><table><thead><tr><th>System</th><th>Del</th><th>Mål (cm)</th><th>Antal</th></tr></thead><tbody>${kl}</tbody></table>
    <p style="margin-top:24px"><button onclick="window.print()" style="padding:10px 20px;background:#3f9c12;color:#fff;border:none;border-radius:8px;cursor:pointer">Udskriv / Gem som PDF</button></p></body></html>`);
    win.document.close();
  }

  const RateInp = ({ k, lbl }: { k: keyof typeof rates; lbl: string }) => (
    <label className="block"><span className="label">{lbl}</span><input className="input py-1.5 text-sm" inputMode="numeric" value={rates[k]} onChange={(e) => setRates({ ...rates, [k]: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} /></label>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-brand-ink">Produktion — Tilskæring & pris</h1><p className="text-sm text-brand-ink2/60">Gemmes automatisk.</p></div>
        <div className="flex items-center gap-2"><button onClick={() => setShowRates((s) => !s)} className="btn-secondary py-2 text-sm">Priser</button><button onClick={yeni} className="btn-secondary py-2 text-sm">Ny</button><button onClick={yazdir} className="btn-secondary py-2 text-sm">Udskriv / PDF</button><button onClick={kaydet} className="btn-primary py-2 text-sm">Gem</button></div>
      </div>

      {showRates && (
        <div className="mb-4 rounded-xl border border-brand-line bg-brand-mist/50 p-4">
          <p className="mb-2 text-sm font-semibold text-brand-ink">Priser (kr/m²)</p>
          <div className="grid gap-3 sm:grid-cols-4"><RateInp k="tek19" lbl="Enkelt 1,9" /><RateInp k="tek28" lbl="Enkelt 2,8" /><RateInp k="dub19" lbl="Dobbelt 1,9" /><RateInp k="dub28" lbl="Dobbelt 2,8" /></div>
          <p className="mt-2 text-xs text-brand-ink2/55">m² = (bredde og højde rundes op til 50 cm) → m² × kr/m² × antal. Moms 25% tillægges.</p>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="label">Kunde</span><input className="input" value={musteri} onChange={(e) => setMusteri(e.target.value)} placeholder="Kundens navn" /></label>
        <label className="block"><span className="label">Telefon</span><input className="input" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Telefon" /></label>
        <label className="block"><span className="label">Adresse</span><input className="input" value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Adresse" /></label>
      </div>

      <div className="mb-4 rounded-xl border border-brand-line bg-brand-mist/40 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block"><span className="label">Monteringsdato</span><input type="date" className="input py-2 text-sm" value={tarih} onChange={(e) => setTarih(e.target.value)} /></label>
          <label className="block"><span className="label">Klokkeslæt</span><input type="time" className="input py-2 text-sm" value={saat} onChange={(e) => setSaat(e.target.value)} /></label>
          <button onClick={randevuAl} className="btn-primary py-2.5 text-sm">Book aftale</button>
          {apptMsg && <span className={`pb-2 text-sm font-semibold ${apptMsg.ok ? "text-brand-greendark" : "text-red-600"}`}>{apptMsg.t}</span>}
        </div>
        {appts.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink2/55">Aftaler ({appts.length})</p>
            {appts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-sm">
                <span><b className="text-brand-ink">{a.day} · {a.time}</b> <span className="text-brand-ink2/70">— {a.customer}{a.phone ? " · " + a.phone : ""}</span></span>
                <button onClick={() => randevuSil(a.id)} className="text-red-400 hover:text-red-600">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {msg && <div className="mb-3 text-sm font-medium text-brand-greendark">{msg}</div>}

      <div className="space-y-3">
        {rows.map((r, i) => {
          const ps = parts(r); const open = openUid === r.uid; const pr = priceOf(r);
          return (
            <div key={r.uid} className={`rounded-xl border border-brand-line ${r.done ? "bg-green-50/60" : "bg-white"}`}>
              <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                <button onClick={() => setOpenUid(open ? null : r.uid)} className="flex items-center gap-1.5 text-sm font-bold text-brand-greendark"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-greendark text-xs text-white">{i + 1}</span> detaljer {open ? "▲" : "▼"}</button>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-ink">{pr ? kr(pr.price) : ""}</span>
                  <label className="flex items-center gap-1 text-xs text-brand-ink2/70"><input type="checkbox" checked={!!r.done} onChange={(e) => upd(r.uid, { done: e.target.checked })} /> Færdig</label>
                  <button onClick={() => del(r.uid)} className="text-xl leading-none text-red-400 hover:text-red-600">×</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-3 py-2.5 sm:grid-cols-7">
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">System</span><select className="input py-2 text-sm" value={r.sys} onChange={(e) => upd(r.uid, { sys: e.target.value as Sys })}><option>1,9</option><option>2,8</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Type</span><select className="input py-2 text-sm" value={r.tip} onChange={(e) => upd(r.uid, { tip: e.target.value as Tip })}><option value="TEK">Enkelt</option><option value="DUBLE">Dobbelt</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Model</span><select className="input py-2 text-sm" value={r.model} disabled={r.tip === "DUBLE"} onChange={(e) => upd(r.uid, { model: e.target.value as any })}><option value="YANA">Side</option><option value="AŞAĞI">Ned</option></select></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Antal</span><input className="input py-2 text-sm" inputMode="numeric" value={r.adet} onChange={(e) => upd(r.uid, { adet: e.target.value.replace(/[^0-9]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Bredde (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.en} onChange={(e) => upd(r.uid, { en: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Højde (cm)</span><input className="input py-2 text-sm" inputMode="decimal" value={r.boy} onChange={(e) => upd(r.uid, { boy: e.target.value.replace(/[^0-9.,]/g, "") })} /></label>
                <label className="block"><span className="mb-0.5 block text-[11px] font-medium text-brand-ink2/60">Farve</span><input className="input py-2 text-sm" value={r.farve} onChange={(e) => upd(r.uid, { farve: e.target.value })} placeholder="f.eks. Hvid" /></label>
              </div>
              {open && ps && (
                <div className="border-t border-brand-line bg-brand-mist/40 px-4 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink2/60">Vindue {i + 1} — {r.tip === "DUBLE" ? "Dobbelt" : "Enkelt"} {r.sys} · {r.en}×{r.boy} cm {r.farve ? `· ${r.farve}` : ""} {pr ? `· ${f(pr.area)} m² → ${f(pr.m2)} m² · ${kr(pr.price)}` : ""}</p>
                  <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                    {ps.map((p) => (<div key={p.label} className="flex justify-between rounded bg-white px-3 py-1.5"><span className="text-brand-ink2/70">{p.label}</span><span className="font-semibold text-brand-ink">{p.kind === "pile" ? `${f(p.len!)} lag` : p.kind === "count" ? `${p.qty} stk.` : `${p.qty} stk. × ${f(p.len!)} cm`}</span></div>))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={add} className="btn-secondary flex-1 border-dashed py-2 text-sm">+ Tilføj vindue</button>
      </div>

      {totals.ara > 0 && (
        <div className="mt-6 ml-auto max-w-xs rounded-xl border border-brand-line bg-white p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Subtotal</span><span className="font-semibold text-brand-ink">{kr(totals.ara)}</span></div>
          <div className="flex justify-between py-1"><span className="text-brand-ink2/70">Moms 25%</span><span className="text-brand-ink">{kr(totals.moms)}</span></div>
          <div className="mt-1 flex justify-between border-t border-brand-line pt-2 text-base font-bold"><span>Total i alt</span><span className="text-brand-greendark">{kr(totals.dahil)}</span></div>
        </div>
      )}

      {liste.arr.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-bold text-brand-ink">Skæreliste (i alt)</h2>
          <p className="mb-3 text-sm text-brand-ink2/60">Ens mål er samlet. Marker det der er skåret.</p>
          <div className="overflow-x-auto rounded-xl border border-brand-line">
            <table className="w-full min-w-[460px] text-sm"><thead><tr className="bg-brand-mist text-left text-xs uppercase tracking-wide text-brand-ink2/60"><th className="px-3 py-2">✓</th><th className="px-3 py-2">System</th><th className="px-3 py-2">Del</th><th className="px-3 py-2">Mål</th><th className="px-3 py-2">Antal</th></tr></thead>
              <tbody className="divide-y divide-brand-line">
                {liste.arr.map((p, idx) => { const k = `${p.sys}|${p.label}|${p.len.toFixed(2)}`; const d = doneKeys.includes(k); return (
                  <tr key={idx} className={d ? "bg-green-50/60" : ""}><td className="px-3 py-2"><input type="checkbox" checked={d} onChange={() => toggleKey(k)} /></td><td className="px-3 py-2 text-brand-ink2/70">{p.sys}</td><td className={`px-3 py-2 font-medium ${d ? "text-brand-ink2/40 line-through" : "text-brand-ink"}`}>{p.label}</td><td className={`px-3 py-2 font-semibold ${d ? "text-brand-ink2/40 line-through" : "text-brand-ink"}`}>{f(p.len)} cm</td><td className="px-3 py-2 text-brand-ink">{p.qty} stk.</td></tr>); })}
                {liste.counts.map((p, idx) => (<tr key={"c" + idx} className="bg-brand-mist/40"><td className="px-3 py-2"></td><td className="px-3 py-2 text-brand-ink2/70">{p.sys}</td><td className="px-3 py-2 font-medium text-brand-ink">{p.label}</td><td className="px-3 py-2 text-brand-ink2/50">—</td><td className="px-3 py-2 text-brand-ink">{p.qty} stk.</td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-8"><h2 className="mb-3 text-lg font-bold text-brand-ink">Gemte ordrer</h2>
          <div className="space-y-2">{saved.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm">
              <div><span className="font-semibold text-brand-ink">{s.musteri}</span> <span className="text-brand-ink2/55">· {s.rows.length} vinduer · {s.date}</span></div>
              <div className="flex gap-3"><button onClick={() => yukle(s)} className="font-medium text-brand-greendark hover:underline">Åbn</button><button onClick={() => sil(s.id)} className="text-red-400 hover:text-red-600">Slet</button></div>
            </div>))}
          </div>
        </div>
      )}
    </div>
  );
}
