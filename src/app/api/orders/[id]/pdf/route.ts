import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { generateOrderPdf, PdfOrder, PdfBranding } from "@/lib/pdf";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
  const s = await getAllSettings();
  const branding: PdfBranding = {
    companyName: s.contact.companyName,
    phone: s.contact.phone,
    email: s.contact.email,
    address: s.contact.address,
    postalCode: s.contact.postalCode,
    city: s.contact.city,
    shippingText: s.shipping.text
  };
  const bytes = await generateOrderPdf(order as unknown as PdfOrder, branding);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Myggestop-${order.orderNumber}.pdf"`
    }
  });
}
