import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 4 (§4/§6.5): byggerens koe - Order hvor stage=I_PRODUKTION, i den
// raekkefoelge de faktisk er booket (createdAt), IKKE en formel-koe.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "BUILDER", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const orders = await prisma.order.findMany({
    where: { stage: "I_PRODUKTION" },
    // RUNDE 7 (§4 i procesdokumentet): Byggeren skal kunne se sin egen
    // fremdrift ("X af Y linjer færdig") direkte i køen, ikke kun ved at
    // åbne hver ordre - og "Klar til installation"-knappen her skal
    // spærres på samme måde som på selve ordresiden.
    include: { items: true, lead: { include: { measurements: { select: { builtAt: true } } } } },
    orderBy: { createdAt: "asc" }
  });
  const medFremdrift = orders.map((o: any) => {
    const linjer = o.lead?.measurements || [];
    const antalLinjerIalt = linjer.length;
    const antalLinjerFaerdig = linjer.filter((m: any) => m.builtAt != null).length;
    const { lead, ...rest } = o;
    return { ...rest, antalLinjerIalt, antalLinjerFaerdig, alleLinjerFaerdig: antalLinjerIalt === 0 || antalLinjerFaerdig === antalLinjerIalt };
  });
  return NextResponse.json({ orders: medFremdrift });
}
