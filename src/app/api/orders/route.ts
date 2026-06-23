import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { calcLine, calcOrderTotals, PricingConfig } from "@/lib/pricing";
import { nextOrderNumber } from "@/lib/orderNumber";
import { generateOrderPdf, PdfOrder, PdfBranding } from "@/lib/pdf";
import { sendMail } from "@/lib/email";
import { customerEmailHtml, adminEmailHtml } from "@/lib/emailTemplates";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

interface ItemPayload {
  productId: string;
  roomName: string;
  widthMm: number;
  heightMm: number;
  colorId?: string;
  comment?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const c = body.customer || {};
    const required = ["firstName", "lastName", "phone", "email", "address", "postalCode", "city"];
    for (const f of required) {
      if (!c[f] || String(c[f]).trim() === "") {
        return NextResponse.json({ error: `Felt mangler: ${f}` }, { status: 400 });
      }
    }
    const items: ItemPayload[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) return NextResponse.json({ error: "Tilfoj mindst et produkt." }, { status: 400 });

    const settings = await getAllSettings();
    const config: PricingConfig = {
      coloredFrameSurchargePerSqm: settings.pricing.coloredFrameSurchargePerSqm,
      doubleDoorSurcharge: settings.pricing.doubleDoorSurcharge,
      installationBaseFee: settings.pricing.installationBaseFee,
      installationPerProduct: settings.pricing.installationPerProduct
    };

    const products = await prisma.product.findMany({ where: { isActive: true } });
    const colors = await prisma.color.findMany({ where: { isActive: true } });

    const computed = items.map((it) => {
      const product = products.find((p) => p.id === it.productId);
      if (!product) throw new Error("Ukendt produkt");
      const color = colors.find((cl) => cl.id === it.colorId) || null;
      const width = Math.max(0, Math.round(Number(it.widthMm) || 0));
      const height = Math.max(0, Math.round(Number(it.heightMm) || 0));
      const line = calcLine(
        {
          widthMm: width,
          heightMm: height,
          product: { pricePerSqm: product.pricePerSqm, doubleDoorThresholdMm: product.doubleDoorThresholdMm },
          color: color ? { surchargePerSqm: color.surchargePerSqm, isStandard: color.isStandard } : null
        },
        config
      );
      return { it, product, color, width, height, line };
    });

    const wantsInstallation = !!body.wantsInstallation;
    const totals = calcOrderTotals(computed.map((x) => x.line), wantsInstallation, config);
    const orderNumber = await nextOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        address: c.address,
        postalCode: c.postalCode,
        city: c.city,
        wantsInstallation,
        note: body.note || "",
        productsTotal: totals.productsTotal,
        installationTotal: totals.installationTotal,
        estimatedTotal: totals.estimatedTotal,
        items: {
          create: computed.map((x) => ({
            productId: x.product.id,
            roomName: x.it.roomName || "",
            productName: x.product.name,
            widthMm: x.width,
            heightMm: x.height,
            colorName: x.color?.name || "",
            comment: x.it.comment || "",
            isDoubleDoor: x.line.isDoubleDoor,
            areaSqm: x.line.areaSqm,
            lineTotal: x.line.lineTotal
          }))
        }
      },
      include: { items: true }
    });

    // Generer PDF + send emails (best-effort)
    const pdfOrder: PdfOrder = { ...order, status: order.status } as any;
    const branding: PdfBranding = {
      companyName: settings.contact.companyName,
      phone: settings.contact.phone,
      email: settings.contact.email,
      address: settings.contact.address,
      postalCode: settings.contact.postalCode,
      city: settings.contact.city,
      shippingText: settings.shipping.text
    };

    let pdfBuffer: Buffer | null = null;
    try {
      const bytes = await generateOrderPdf(pdfOrder, branding);
      pdfBuffer = Buffer.from(bytes);
    } catch (e) {
      console.error("PDF-generering fejlede:", e);
    }

    const attachments = pdfBuffer
      ? [{ filename: `Myggestop-${orderNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
      : undefined;

    // Kunde
    sendMail({
      to: order.email,
      subject: `Tak for din bestilling – ${orderNumber} | Myggestop`,
      html: customerEmailHtml(pdfOrder, branding),
      attachments
    }).catch(() => {});
    // Admin
    sendMail({
      to: settings.contact.adminEmail,
      subject: `Ny ordre ${orderNumber} – ${order.firstName} ${order.lastName}`,
      html: adminEmailHtml(pdfOrder),
      attachments
    }).catch(() => {});

    return NextResponse.json({ ok: true, orderNumber, orderId: order.id, totals });
  } catch (e: any) {
    console.error("Order POST fejl:", e);
    return NextResponse.json({ error: e?.message || "Serverfejl" }, { status: 500 });
  }
}

// GET (admin): liste med sogning/filter
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } }
    ];
  }
  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ orders });
}
