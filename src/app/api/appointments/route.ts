import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const items = await prisma.appointment.findMany({ orderBy: [{ day: "asc" }, { time: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json();
  const day = String(b.day || "").trim();
  const time = String(b.time || "").trim();
  if (!day || !time) return NextResponse.json({ error: "Tarih ve saat gerekli." }, { status: 400 });
  if (!b.customer || !String(b.customer).trim()) return NextResponse.json({ error: "Müşteri adı gerekli." }, { status: 400 });

  const clash = await prisma.appointment.findFirst({ where: { day, time } });
  if (clash) return NextResponse.json({ error: "Bu tarih ve saat dolu.", conflict: { customer: clash.customer, phone: clash.phone } }, { status: 409 });

  const item = await prisma.appointment.create({
    data: { day, time, customer: String(b.customer).trim(), phone: b.phone || "", address: b.address || "", note: b.note || "" }
  });
  return NextResponse.json({ ok: true, item });
}
