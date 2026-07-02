"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderDeleteButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm(`Slet ordre ${orderNumber}? Dette kan ikke fortrydes.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/ordrer");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Kunne ikke slette ordren.");
    }
  }

  return (
    <button
      onClick={del}
      disabled={deleting}
      className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {deleting ? "Sletter..." : "Slet ordre"}
    </button>
  );
}
