import Link from "next/link";
import { getSession } from "@/lib/auth";
import ManualOrderForm from "@/components/admin/ManualOrderForm";

export const dynamic = "force-dynamic";

// RUNDE 8: smal, dedikeret side til den manuelle "bypass"-ordre - adskilt
// fra selve ordrelisten, så Installatøren kan nå netop denne handling uden
// at få adgang til Koordinators fulde ordreoverblik.
// RUNDE 9 ("nogle gange kan man ikke navigere tilbage"): "Tilbage" var
// tidligere router.back(), som intet gør uden browserhistorik (f.eks. hvis
// siden åbnes direkte). Nu et FAST, rolle-afhængigt link i stedet -
// Koordinator kommer fra Ordrer, Installatør fra Mine opgaver.
export default async function Page() {
  const session = await getSession();
  const backHref = session?.role === "INSTALLER" ? "/admin/mine-opgaver" : "/admin/ordrer";
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="text-sm text-brand-blue hover:underline">← Tilbage</Link>
      <h1 className="mt-3 mb-6 text-2xl font-extrabold text-brand-ink">Ny ordre (manuel)</h1>
      <ManualOrderForm backHref={backHref} />
    </div>
  );
}
