import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 7 (engangs-oprydning, bedt om af brugeren: "fjern alt data så den
// er clean (udover koordinator dogan)", bekræftet scope: "Dogan + din egen
// konto"): fjerner AL forretningsdata (Leads/Orders/Measurements/
// OrderItems/Appointments) og alle AdminUser-konti UNDTAGEN Dogan og
// brugerens egen konto. Rører IKKE Product/Color/Setting (priser og
// katalog-konfiguration er eksplicit uden for scope, jf. brugerens svar på
// afklaringsspørgsmålet) og heller ikke OrderCounter (kosmetisk, ufarligt
// at lade stå).
//
// Engangs-rute - fjernes fra git-sporing (git rm --cached) umiddelbart
// efter brug denne runde, samme mønster som projektets øvrige
// engangs-admin-scripts (fase1-migrate, emergency-reset, osv., som allerede
// permanent udelukkes fra hver deploy).
const BEVAR_EMAILS = ["doganmiketuran@gmail.com", "ferdalturan@gmail.com"];

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  if (b.confirm !== "WIPE") {
    return NextResponse.json({ error: "Mangler bekræftelse ({ confirm: 'WIPE' }) - intet er slettet." }, { status: 400 });
  }

  // Rækkefølgen er vigtig: Appointment kan pege på Lead/Order/AdminUser,
  // OrderItem cascader allerede med Order men slettes eksplicit for en
  // klar optælling, Order SKAL slettes før Lead (Order.leadId -> Lead),
  // Measurement cascader med Lead men slettes eksplicit af samme grund.
  const antalAftaler = await prisma.appointment.deleteMany({});
  const antalOrderItems = await prisma.orderItem.deleteMany({});
  const antalOrdrer = await prisma.order.deleteMany({});
  const antalMaalinger = await prisma.measurement.deleteMany({});
  const antalLeads = await prisma.lead.deleteMany({});
  const slettedeBrugere = await prisma.adminUser.deleteMany({ where: { email: { notIn: BEVAR_EMAILS } } });
  const beholdteBrugere = await prisma.adminUser.findMany({ select: { id: true, email: true, name: true, role: true } });

  return NextResponse.json({
    ok: true,
    slettet: {
      aftaler: antalAftaler.count,
      orderItems: antalOrderItems.count,
      ordrer: antalOrdrer.count,
      maalinger: antalMaalinger.count,
      leads: antalLeads.count,
      brugere: slettedeBrugere.count
    },
    beholdteBrugere
  });
}
