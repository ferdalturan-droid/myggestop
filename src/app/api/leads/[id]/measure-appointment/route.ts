import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 5 (§3.5/§6.2): booker en MAALING-aftale til installatøren, koblet
// til leadet. Saetter samtidig lead.stage -> OPMAALING_BOOKET hvis den
// ikke allerede er der, saa hele skridtet sker i EEN handling for
// coordinator (bestil opmaaling = book aftalen).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const day = String(b.day || "").trim();
  const time = String(b.time || "").trim();
  if (!day || !time) return NextResponse.json({ error: "Vælg dato og klokkeslæt." }, { status: 400 });

  // Samme globale day+time-konflikt-tjek som det eksisterende system -
  // i praksis peger al booking paa den samme installatoer (§3.5: MAALING
  // og INSTALLATION er ALTID resource=INSTALLER i denne model).
  const clash = await prisma.appointment.findFirst({ where: { day, time } });
  if (clash) return NextResponse.json({ error: "Tidspunktet er allerede booket.", conflict: { customer: clash.customer } }, { status: 409 });

  const [appointment] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        day, time,
        customer: `${lead.firstName} ${lead.lastName}`,
        phone: lead.phone,
        address: `${lead.address}, ${lead.postalCode} ${lead.city}`,
        type: "MAALING",
        resource: "INSTALLER",
        status: "TENTATIVE",
        leadId: lead.id
      }
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: lead.stage === "NYT_LEAD" || lead.stage === "KONTAKTET" ? { stage: "OPMAALING_BOOKET" } : {}
    })
  ]);

  return NextResponse.json({ appointment });
}
