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
  // RUNDE 3: en lead der er markeret "opmåling færdig" skal forsvinde fra
  // Installatørens aktive koe (§"opmålingslisten skal ikke indeholde ordre
  // der er målt") - den kører videre i pipelinen med status "Opmålt",
  // synlig for Coordinator via Leads-listen/dashboardet.
  const leads = await prisma.lead.findMany({
    where: { stage: "OPMAALING_BOOKET", measuredAt: null },
    select: {
      id: true, leadNumber: true, firstName: true, lastName: true, phone: true,
      address: true, postalCode: true, city: true, note: true,
      measuredAt: true, expectedMeasuringDate: true, expectedMeasuringWeekLabel: true,
      measurements: { orderBy: { itemNumber: "asc" } }
    },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ leads });
}
