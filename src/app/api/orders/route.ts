import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { calcLine, calcOrderTotals, PricingConfig } from "@/lib/pricing";
import { nextOrderNumber } from "@/lib/orderNumber";
import { generateOrderPdf, PdfOrder, PdfBranding } from "@/lib/pdf";
import { sendMail } from "@/lib/email";
import { customerEmailHtml, adminEmailHtml } from "@/lib/emailTemplates";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ItemPayload {
  productId: string;
  roomName: string;
  widthMm: number;
  heightMm: number;
  colorId?: string;
  comment?: string;
}

// FASE 3 (§7.4/§10.6): hjemmesidens bestillingsformular opretter nu et
// Lead (stage NYT_LEAD) + forventede Measurement-raekker MED kundens egne
// mål udfyldt - IKKE en Order direkte. Ordren opstaar foerst naar
// koordinatoren har koert leadet igennem pipelinen og forfremmer det
// (§6.1). Prisberegningen (pricing.ts) er uaendret - den bruges her kun
// til at vise kunden et estimat i PDF/e-mail, ikke til at oprette en
// rigtig ordre-total.
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
    if (items.length === 0) return NextResponse.json({ error: "Tilføj mindst et produkt." }, { status: 400 });

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
    const leadNumber = await nextOrderNumber();

    const productSummary = Array.from(
      computed.reduce((m, x) => m.set(x.product.name, (m.get(x.product.name) || 0) + 1), new Map<string, number>())
    )
      .map(([navn, antal]) => (antal > 1 ? `${navn} x${antal}` : navn))
      .join(", ");

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        stage: "NYT_LEAD",
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        address: c.address,
        postalCode: c.postalCode,
        city: c.city,
        source: "HJEMMESIDE",
        productSummary,
        note: (body.note || "") + (wantsInstallation ? "\n[Ønsker montering]" : ""),
        measurements: {
          create: computed.map((x, i) => ({
            itemNumber: i + 1,
            roomName: x.it.roomName || "",
            productType: x.product.name,
            widthMm: x.width,
            heightMm: x.height,
            colorName: x.color?.name || "",
            comment: x.it.comment || ""
          }))
        }
      }
    });

    // Byg et PDF/e-mail-venligt objekt (samme form som en Order) af det
    // kunden lige har indtastet - der oprettes ingen rigtig Order endnu.
    const pdfOrder: PdfOrder = {
      orderNumber: leadNumber,
      status: "NY",
      createdAt: lead.createdAt,
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
      items: computed.map((x) => ({
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
    };
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
      ? [{ filename: `Nordica-${leadNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
      : undefined;

    // Send e-mails (await, saa serverless-funktionen naar at sende foer den afsluttes)
    await Promise.allSettled([
      sendMail({
        to: lead.email,
        subject: `Vi har modtaget din forespørgsel – ${leadNumber} | Nordica`,
        html: customerEmailHtml(pdfOrder, branding),
        attachments
      }),
      sendMail({
        to: settings.contact.adminEmail,
        subject: `Nyt lead ${leadNumber} – ${lead.firstName} ${lead.lastName}`,
        html: adminEmailHtml(pdfOrder),
        attachments
      })
    ]);

    return NextResponse.json({ ok: true, leadNumber, leadId: lead.id, totals });
  } catch (e: any) {
    console.error("Lead POST fejl:", e);
    return NextResponse.json({ error: e?.message || "Serverfejl" }, { status: 500 });
  }
}

// GET (admin): liste med sogning/filter
// RUNDE 3: rettet - Installer har adgang til /admin/ordrer-SIDEN (roles.ts),
// men denne rute var stadig COORDINATOR-only, saa listen reelt aldrig
// kunne indlaeses for ham. Samme rettighed som /api/orders/[id] (Gruppe 2).
export async function GET(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  // RUNDE 2 (§12.1): filtreres nu paa den reelle produktionspipeline
  // (OrderStage), ikke den gamle frie OrderStatus.
  const stage = searchParams.get("stage")?.trim();
  const where: any = {};
  if (stage) where.stage = stage;
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
