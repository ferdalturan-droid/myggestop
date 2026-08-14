import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { nextOrderNumber } from "@/lib/orderNumber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ManualItem {
  roomName?: string;
  productName: string;
  widthMm: number;
  heightMm: number;
  colorName?: string;
  comment?: string;
  lineTotal: number;
}

// Opretter (eller opdaterer) en ordre direkte fra Produktionsberegneren,
// saa manuelt indtastede jobs ogsaa vises paa Ordrer-siden.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => ({}));

  const musteri = String(b.musteri || "").trim();
  if (!musteri) return NextResponse.json({ error: "Kundens navn mangler." }, { status: 400 });
  const items: ManualItem[] = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) return NextResponse.json({ error: "Ingen produkter at gemme." }, { status: 400 });

  const spaceIdx = musteri.indexOf(" ");
  const firstName = spaceIdx === -1 ? musteri : musteri.slice(0, spaceIdx);
  const lastName = spaceIdx === -1 ? "" : musteri.slice(spaceIdx + 1);

  const productsTotal = items.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);

  const orderFields = {
    firstName,
    lastName,
    phone: String(b.tel || ""),
    email: String(b.email || ""),
    address: String(b.adres || ""),
    postalCode: String(b.postalCode || ""),
    city: String(b.city || ""),
    note: b.note || "Oprettet manuelt via Produktionsberegner.",
    productsTotal,
    installationTotal: 0,
    estimatedTotal: productsTotal
  };

  const itemsCreate = items.map((it) => ({
    roomName: it.roomName || "",
    productName: it.productName,
    widthMm: Math.max(0, Math.round(Number(it.widthMm) || 0)),
    heightMm: Math.max(0, Math.round(Number(it.heightMm) || 0)),
    colorName: it.colorName || "",
    comment: it.comment || "",
    isDoubleDoor: false,
    areaSqm: Math.round(((Number(it.widthMm) || 0) / 1000) * ((Number(it.heightMm) || 0) / 1000) * 100) / 100,
    lineTotal: Number(it.lineTotal) || 0
  }));

  try {
    if (b.orderId) {
      const existing = await prisma.order.findUnique({ where: { id: b.orderId } });
      if (!existing) return NextResponse.json({ error: "Ordre ikke fundet." }, { status: 404 });
      await prisma.orderItem.deleteMany({ where: { orderId: b.orderId } });
      const order = await prisma.order.update({
        where: { id: b.orderId },
        data: { ...orderFields, items: { create: itemsCreate } },
        include: { items: true }
      });
      return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
    }

    const orderNumber = await nextOrderNumber();
    const order = await prisma.order.create({
      data: { orderNumber, ...orderFields, items: { create: itemsCreate } },
      include: { items: true }
    });
    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e: any) {
    console.error("Manuel ordre fejl:", e);
    return NextResponse.json({ error: e?.message || "Serverfejl" }, { status: 500 });
  }
}
