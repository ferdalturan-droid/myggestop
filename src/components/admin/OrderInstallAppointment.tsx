"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// RUNDE 5 (§"Koordinator indsætter dette i Installators (specifik person)
// kalender"): installation skal ligge hos en NAVNGIVEN installatør, ikke
// en generisk "INSTALLER"-bunke - samme princip som opmåling i
// LeadDetail.tsx.
export default function OrderInstallAppointment({ orderId, existing, canBook = true }: { orderId: string; existing: { day: string; time: string; status: string; assignedUserName: string | null }[]; canBook?: boolean }) {
  const router = useRouter();
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [installatorer, setInstallatorer] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!canBook) return;
    fetch("/api/admin-users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const liste = (d.users || []).filter((u: any) => u.role === "INSTALLER");
        setInstallatorer(liste);
        setAssignedUserId((v) => v || liste[0]?.id || "");
      })
      .catch(() => {});
  }, [canBook]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/install-appointment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day, time, assignedUserId }) });
    const d = await res.json();
    if (!res.ok) { setMsg(`⚠ ${d.error}`); return; }
    setMsg(d.advarsel ? `Booket ✓ ${d.advarsel}` : "Installation booket ✓");
    setDay(""); setTime("");
    router.refresh();
  }

  return (
    <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <h2 className="mb-1 font-bold text-brand-ink">Installationsaftale</h2>
      {canBook && existing.length === 0 && (
        <p className="mb-3 text-xs text-brand-ink2/50">Vælg installatør, dato og tid herunder — det opretter automatisk aftalen i kalenderen, du behøver ikke gøre det manuelt bagefter.</p>
      )}
      {existing.map((a, i) => (
        <p key={i} className="mb-1 text-sm text-brand-ink2/80">{a.day} kl. {a.time} — {a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}{a.assignedUserName ? ` · ${a.assignedUserName}` : ""}</p>
      ))}
      {canBook && (
        <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-3">
          <label className="block"><span className="label">Installatør *</span>
            <select className="input py-2 text-sm" required value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
              <option value="">— Vælg —</option>
              {installatorer.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Dato</span><input type="date" className="input py-2 text-sm" required value={day} onChange={(e) => setDay(e.target.value)} /></label>
          <label className="block"><span className="label">Klokkeslæt</span><input type="time" className="input py-2 text-sm" required value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <button className="btn-primary py-2.5 text-sm">Book installation</button>
        </form>
      )}
      {msg && <p className="mt-2 text-sm font-medium text-brand-ink2/80">{msg}</p>}
    </div>
  );
}
