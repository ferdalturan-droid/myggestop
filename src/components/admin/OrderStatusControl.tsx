"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "@/lib/types";

export default function OrderStatusControl({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function update(next: string) {
    setSaving(true);
    setMsg(null);
    setStatus(next);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Status opdateret ✓");
      router.refresh();
      setTimeout(() => setMsg(null), 2000);
    } else setMsg("Fejl ved opdatering");
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-ink2">Skift status</label>
      <select className="input" value={status} disabled={saving} onChange={(e) => update(e.target.value)}>
        {ORDER_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
        ))}
      </select>
      {msg && <p className="mt-2 text-sm font-medium text-brand-green">{msg}</p>}
    </div>
  );
}
