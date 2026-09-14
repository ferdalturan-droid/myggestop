import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { nextOrderNumber } from "@/lib/orderNumber";
import { promoteLeadToOrder } from "@/lib/promoteLead";
import { LEAD_SOURCE_ALL } from "@/lib/leadSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3 (§3.2/§6): Lead-liste + oprettelse (telefon-lead, §10.9).
export async function GET(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const stage = req.nextUrl.searchParams.get("stage");
  const where: any = {};
  if (stage) where.stage = stage;
  const leads = await prisma.lead.findMany({
    where,
    include: { measurements: true, order: { select: { id: true, orderNumber: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ leads });
}

// RUNDE 2 (§11.5): et "Nyt lead (hurtig)" flow (COORDINATOR + INSTALLER)
// kan nu i samme kald saette leadet direkte til BEKRAEFTET + confirmedAt
// (b.bekraeftNu=true) med en pris (b.quotePriceDkk), hvilket automatisk
// forfremmer det til en ordre i samme transaktion (§11.6) - uden nogen
// kodevej der opretter en Order uden et Lead (§3.3's invariant, §11.5).
// Den almindelige trin-for-trin oprettelse (uden disse felter) er
// UÆNDRET og forbliver COORDINATOR-only.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const bekraeftNu = b.bekraeftNu === true;
  const auth = await requireRole(bekraeftNu ? ["COORDINATOR", "INSTALLER"] : ["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const required = ["firstName", "lastName", "phone"];
  for (const f of required) {
    if (!b[f] || String(b[f]).trim() === "") return NextResponse.json({ error: `Felt mangler: ${f}` }, { status: 400 });
  }
  const leadNumber = await nextOrderNumber();
  const quotePriceDkk = typeof b.quotePriceDkk === "number" ? b.quotePriceDkk : (b.quotePriceDkk ? Number(b.quotePriceDkk) || null : null);
  // RUNDE 8 ("ikke frit tekstfelt men en liste rapporteringsmulighed"):
  // source er nu et fast enum - et lead oprettet HER er altid manuelt
  // indtastet (aldrig HJEMMESIDE, som kun webformularen maa saette), saa
  // en ugyldig/manglende vaerdi falder tilbage til ANDET fremfor at fejle.
  const source = LEAD_SOURCE_ALL.includes(b.source) && b.source !== "HJEMMESIDE" ? b.source : "ANDET";

  const lead = await prisma.$transaction(async (tx: any) => {
    const created = await tx.lead.create({
      data: {
        leadNumber,
        firstName: String(b.firstName).trim(),
        lastName: String(b.lastName).trim(),
        phone: String(b.phone).trim(),
        email: String(b.email || "").trim(),
        address: String(b.address || "").trim(),
        postalCode: String(b.postalCode || "").trim(),
        city: String(b.city || "").trim(),
        source: source as any,
        productSummary: String(b.productSummary || "").trim(),
        note: String(b.note || "").trim(),
        quotePriceDkk: quotePriceDkk ?? undefined,
        ...(bekraeftNu ? { stage: "BEKRAEFTET" as const, confirmedAt: new Date() } : {})
      }
    });
    if (bekraeftNu) await promoteLeadToOrder(tx as any, created.id);
    return created;
  });
  return NextResponse.json({ lead });
}
