import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllSettings } from "@/lib/settings";
import { generateOrderPdf, PdfOrder, PdfBranding } from "@/lib/pdf";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 5: PDF-download er en READ-only eksport af data rollen allerede
// maa se paa selve ordre-siden (GET /api/orders/[id] er aabent for alle
// tre roller) - der var ingen god grund til at begraense selve PDF'en til
// KUN Coordinator. Bygger (ORDER_DETAIL_ONLY) og Installer havde begge
// side-adgang til knappen, men fik et 403 naar de trykkede paa den.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER", "BUILDER"]);
  if (!auth.ok) return auth.response;
  // RUNDE 10 (§K - "eksportere ikke alle detaljer... skal eksportere alle
  // byggedetaljer og samlet skæreliste"): henter nu ogsaa Lead->Measurement-
  // raekkerne (samme kilde som OrderBuildDetails.tsx paa selve siden), saa
  // PDF'en kan indeholde de fulde byggedetaljer, ikke kun højtniveau-info.
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, lead: { include: { measurements: { orderBy: [{ itemNumber: "asc" }, { createdAt: "asc" }] } } } }
  });
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
  // RUNDE 10 (§I): Bygger må aldrig se priser, heller ikke i eksporten.
  const hidePrices = auth.session?.role === "BUILDER";
  const bytes = await generateOrderPdf(order as unknown as PdfOrder, branding, {
    hidePrices,
    measurements: order.lead?.measurements || []
  });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Nordica-${order.orderNumber}.pdf"`
    }
  });
}
