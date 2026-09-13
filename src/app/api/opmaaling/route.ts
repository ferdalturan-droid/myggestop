import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 4 (§4): opmålingsliste - Leads hvor stage = OPMAALING_BOOKET.
// Bevidst en smal visning (kun det Installer skal bruge for at tage ud
// og måle) - IKKE hele lead-pipelinen eller priser.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const leads = await prisma.lead.findMany({
    where: { stage: "OPMAALING_BOOKET" },
    select: {
      id: true, leadNumber: true, firstName: true, lastName: true, phone: true,
      address: true, postalCode: true, city: true, note: true,
      measurements: { orderBy: { itemNumber: "asc" } }
    },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ leads });
}
