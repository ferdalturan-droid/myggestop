"use client";
import { useRouter } from "next/navigation";
import ManualOrderForm from "@/components/admin/ManualOrderForm";

// RUNDE 8: smal, dedikeret side til den manuelle "bypass"-ordre - adskilt
// fra selve ordrelisten, så Installatøren kan nå netop denne handling uden
// at få adgang til Koordinators fulde ordreoverblik (delta §1 + brugerens
// justering: "only coordinator and installer can add this by-pass manual
// entry"). "Tilbage" bruger router.back() i stedet for et fast link, da
// Koordinator kommer fra Ordrer og Installatør fra Mine opgaver.
export default function Page() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-brand-blue hover:underline">← Tilbage</button>
      <h1 className="mt-3 mb-4 text-2xl font-extrabold text-brand-ink">Ny ordre (manuel)</h1>
      <ManualOrderForm onCreated={() => setTimeout(() => router.back(), 1200)} />
    </div>
  );
}
