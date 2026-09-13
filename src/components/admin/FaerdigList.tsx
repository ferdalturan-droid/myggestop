"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TUR_LABEL: Record<string, string> = { SINEKLIK: "Myggenet", PERDE: "Gardin", KOMBI: "Myggenet & Plisser" };

function hasDims(r: any) {
  const en = parseFloat(String(r.en || "").replace(",", ".")) || 0;
  const boy = parseFloat(String(r.boy || "").replace(",", ".")) || 0;
  return en > 0 && boy > 0;
}

function rowDetail(r: any) {
  const model = r.model === "AŞAĞI" ? "Ned" : "Side";
  const tip = r.tip === "DUBLE" ? "Dobbelt" : "Enkelt";
  const kanat = r.kanat === "HAREKETLI" ? "Bevægelig" : "Fast";
  if (r.tur === "PERDE") return `Fløj: ${kanat}`;
  if (r.tur === "KOMBI") return `${r.sys} · ${tip} · ${model} + Fløj: ${kanat}`;
  return `${r.sys} · ${tip} · ${model}`;
}

export default function FaerdigList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/imalat-records?type=UNIFIED", { cache: "no-store" });
      const d = await res.json();
      setJobs(d.items || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveJobs(next: any[]) {
    setJobs(next);
    await fetch("/api/imalat-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "UNIFIED", items: next }) }).catch(() => {});
  }

  function markDone(jobId: number, uid: number) {
    const next = jobs.map((j) => (j.id !== jobId ? j : { ...j, rows: j.rows.map((r: any) => (r.uid === uid ? { ...r, done: true } : r)) }));
    saveJobs(next);
    setMsg("Markeret som færdig ✓"); setTimeout(() => setMsg(null), 2000);
  }

  function openInCalc(job: any) {
    localStorage.setItem("imalat_open_record", JSON.stringify(job));
    router.push("/admin/imalat");
  }

  const pendingJobs = jobs
    .map((j) => ({ ...j, pendingRows: (j.rows || []).filter((r: any) => hasDims(r) && !r.done) }))
    .filter((j) => j.pendingRows.length > 0)
    .sort((a, b) => (a.id || 0) - (b.id || 0));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Opgaver — ikke færdige</h1>
          <p className="text-sm text-brand-ink2/60">Kun vinduer/gardiner der endnu ikke er markeret Færdig i Produktionsberegneren.</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>

      {msg && <div className="mb-3 text-sm font-medium text-brand-greendark">{msg}</div>}

      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && pendingJobs.length === 0 && (
        <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">
          Alt er færdigt lige nu 🎉
        </div>
      )}

      <div className="space-y-4">
        {pendingJobs.map((job) => (
          <div key={job.id} className="rounded-xl2 border border-brand-line bg-white p-5 shadow-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-brand-ink">{job.musteri}</span>
                {job.orderNumber && <span className="ml-2 rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">Ordre #{job.orderNumber}</span>}
                <span className="ml-2 text-sm text-brand-ink2/55">{job.tel} {job.adres ? `· ${job.adres}` : ""}</span>
              </div>
              <button onClick={() => openInCalc(job)} className="btn-ghost py-1.5 text-sm">Åbn i beregner</button>
            </div>
            <div className="space-y-1.5">
              {job.pendingRows.map((r: any, idx: number) => (
                <div key={r.uid ?? idx} className="flex items-center justify-between rounded-lg bg-brand-mist/50 px-3 py-2 text-sm">
                  <div>
                    <span className="font-semibold text-brand-ink">{TUR_LABEL[r.tur] || "Myggenet"}</span>
                    <span className="ml-2 text-brand-ink2/70">{r.en}×{r.boy} cm · {r.adet} stk. · {rowDetail(r)}{r.farve ? ` · ${r.farve}` : ""}</span>
                  </div>
                  <button onClick={() => markDone(job.id, r.uid)} className="rounded-full border border-brand-greendark px-3 py-1 text-xs font-semibold text-brand-greendark hover:bg-green-50">Marker færdig</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
