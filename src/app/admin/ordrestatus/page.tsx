import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import OrdrestatusList from "@/components/admin/OrdrestatusList";

export const dynamic = "force-dynamic";

// RUNDE 4 (§G6): "koordinator har ikke en nem og god side hvor de kan
// maintain order status... det skal være en separat side" - denne side
// er UDELUKKENDE Koordinator-only (dobbelt-tjekket her, ikke kun i
// middleware/AdminNav), da handlingerne her (betalt/anmeldt, fortryd ved
// fejl) aldrig må være tilgængelige for andre roller.
export default async function OrdrestatusPage() {
  const session = await getSession();
  if (session?.role !== "COORDINATOR") redirect("/admin");
  return <OrdrestatusList />;
}
