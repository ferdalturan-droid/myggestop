"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderInstallAppointment({ orderId, existing }: { orderId: string; existing: { day: string; time: string; status: string }[] }) {
  const router = useRouter();
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/orders/${orderId}/install-appointment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day, time }) });
    const d = await res.json();
    if (!res.ok) { setMsg(`⚠ ${d.error}`); return; }
    setMsg(d.advarsel ? `Booket ✓ ${d.advarsel}` : "Installation booket ✓");
    setDay(""); setTime("");
    router.refresh();
  }

  return (
    <div className="rounded-xl2 border border-brand-line bg-white p-6 shadow-card">
      <h2 className="mb-3 font-bold text-brand-ink">Installationsaftale</h2>
      {existing.map((a, i) => (
        <p key={i} className="mb-1 text-sm text-brand-ink2/80">{a.day} kl. {a.time} — {a.status === "CONFIRMED" ? "Bekræftet" : "Foreløbig"}</p>
      ))}
      <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-3">
        <label className="block"><span className="label">Dato</span><input type="date" className="input py-2 text-sm" required value={day} onChange={(e) => setDay(e.target.value)} /></label>
        <label className="block"><span className="label">Klokkeslæt</span><input type="time" className="input py-2 text-sm" required value={time} onChange={(e) => setTime(e.target.value)} /></label>
        <button className="btn-primary py-2.5 text-sm">Book installation</button>
      </form>
      {msg && <p className="mt-2 text-sm font-medium text-brand-ink2/80">{msg}</p>}
    </div>
  );
}
