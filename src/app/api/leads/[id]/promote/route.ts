import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3 (§6.1): "Forfrem til ordre" - eet bevidst klik, kun COORDINATOR,
// kun naar lead.stage === BEKRAEFTET. Kopierer IKKE kunde-/maaldata ind i
// Order - de forbliver paa Lead/Measurement og hentes via relationen.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const lead = await prisma.lead.findUnique({ where: { id: params.id }, include: { order: true } });
  if (!lead) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  if (lead.order) return NextResponse.json({ error: "Lead er allerede forfremmet til en ordre." }, { status: 400 });
  if (lead.stage !== "BEKRAEFTET") return NextResponse.json({ error: "Lead skal vaere bekraeftet foer det kan forfremmes." }, { status: 400 });

  const order = await prisma.order.create({
    data: {
      orderNumber: lead.leadNumber, // samme loebenummer genbruges, §3.6
      leadId: lead.id,
      stage: "KOE",
      // Bevaringskrav §7.5: gamle Order-felter (firstName osv.) er stadig
      // NOT NULL i skemaet (fjernes foerst i en senere kontraktions-fase),
      // saa de udfyldes her som et snapshot fra Lead - selve sandheden
      // (§2: "et faktum lever kun eet sted") forbliver dog paa Lead.
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      postalCode: lead.postalCode,
      city: lead.city
    }
  });
  return NextResponse.json({ order });
}
