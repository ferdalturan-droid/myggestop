"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AfsluttedeList() {
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

  function genaabn(id: number) {
    const next = jobs.map((j) => (j.id === id ? { ...j, finished: false } : j));
    saveJobs(next);
    setMsg("Genåbnet ✓"); setTimeout(() => setMsg(null), 2000);
  }
  function slet(id: number) {
    if (!confirm("Skal denne ordre slettes permanent?")) return;
    saveJobs(jobs.filter((j) => j.id !== id));
  }
  function openInCalc(job: any) {
    localStorage.setItem("imalat_open_record", JSON.stringify(job));
    router.push("/admin/imalat");
  }

  const finished = jobs.filter((j) => j.finished).sort((a, b) => (b.id || 0) - (a.id || 0));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Afsluttede ordrer</h1>
          <p className="text-sm text-brand-ink2/60">Ordrer der er markeret Afslut i Produktionsberegneren — vises ikke i den almindelige liste.</p>
        </div>
        <button onClick={load} className="btn-secondary py-2 text-sm">Opdater</button>
      </div>

      {msg && <div className="mb-3 text-sm font-medium text-brand-greendark">{msg}</div>}
      {loading && <p className="text-brand-ink2/60">Indlæser...</p>}
      {!loading && finished.length === 0 && (
        <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-brand-ink2/60">Ingen afsluttede ordrer endnu.</div>
      )}

      <div className="space-y-2">
        {finished.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm">
            <div>
              <span className="font-semibold text-brand-ink">{s.musteri}</span>
              {s.orderNumber && <span className="ml-2 rounded bg-brand-mist px-2 py-0.5 text-xs font-semibold text-brand-ink2">Ordre #{s.orderNumber}</span>}
              <span className="text-brand-ink2/55"> · {s.rows?.length || 0} linjer · {s.date}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => genaabn(s.id)} className="rounded-full border border-brand-line px-3 py-1 text-xs font-semibold text-brand-ink2 hover:bg-brand-mist">Genåbn</button>
              <button onClick={() => openInCalc(s)} className="font-medium text-brand-greendark hover:underline">Åbn</button>
              <button onClick={() => slet(s.id)} className="text-red-400 hover:text-red-600">Slet</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
