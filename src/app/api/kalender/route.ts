import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 5 (§10.8): minimal, dagsgrupperet kalendervisning - ikke et fuldt
// visuelt kalender-gitter. Viser BAADE de gamle frie ImalatCalc-aftaler
// (uden type/resource) og de nye Lead/Order-koblede.
export async function GET() {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const items = await prisma.appointment.findMany({
    orderBy: [{ day: "asc" }, { time: "asc" }],
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } } }
  });
  return NextResponse.json({ items });
}

// RUNDE 2 (Q5/Q6): fuld CRUD direkte paa kalendersiden. En aftale kan
// (valgfrit) kobles til et Lead ELLER en Order via search-pickeren
// (/api/kalender/search) - eller oprettes helt fri uden nogen reference
// (Q6: "ja, tilladt - deltager bare ikke i cutoff-logikken", som allerede
// filtrerer paa type: { not: null }, saa en fri post uden type er
// automatisk udenfor den logik uden yderligere kode).
export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  if (!b.day || !String(b.day).trim()) return NextResponse.json({ error: "Dato mangler." }, { status: 400 });
  if (!b.customer || !String(b.customer).trim()) return NextResponse.json({ error: "Angiv en titel/kunde for aftalen." }, { status: 400 });
  if (b.leadId && b.orderId) return NextResponse.json({ error: "Vælg enten et lead eller en ordre, ikke begge." }, { status: 400 });

  const item = await prisma.appointment.create({
    data: {
      day: String(b.day),
      time: b.time ? String(b.time) : null,
      customer: String(b.customer).trim(),
      phone: String(b.phone || ""),
      address: String(b.address || ""),
      note: String(b.note || ""),
      type: b.type || null,
      status: b.status || null,
      resource: b.resource || null,
      leadId: b.leadId || null,
      orderId: b.orderId || null
    },
    include: { lead: { select: { leadNumber: true } }, order: { select: { orderNumber: true } } }
  });
  return NextResponse.json({ item });
}
