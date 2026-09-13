import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";
import { nextOrderNumber } from "@/lib/orderNumber";

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

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));
  const required = ["firstName", "lastName", "phone"];
  for (const f of required) {
    if (!b[f] || String(b[f]).trim() === "") return NextResponse.json({ error: `Felt mangler: ${f}` }, { status: 400 });
  }
  const leadNumber = await nextOrderNumber();
  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      firstName: String(b.firstName).trim(),
      lastName: String(b.lastName).trim(),
      phone: String(b.phone).trim(),
      email: String(b.email || "").trim(),
      address: String(b.address || "").trim(),
      postalCode: String(b.postalCode || "").trim(),
      city: String(b.city || "").trim(),
      source: String(b.source || "Telefon").trim(),
      productSummary: String(b.productSummary || "").trim(),
      note: String(b.note || "").trim()
    }
  });
  return NextResponse.json({ lead });
}
