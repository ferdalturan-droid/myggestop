import { prisma } from "@/lib/prisma";

// Prisma's transaction-client type er svaer at navngive praecist paa tvaers
// af Prisma-versioner - "any" her paavirker ikke kald-stedernes egen typning.
type Tx = any;

// RUNDE 2 (§11.6/§11.7): Lead -> Order sker nu AUTOMATISK naar stage
// bliver BEKRAEFTET (erstatter det tidligere bevidste "Forfrem"-klik).
// Denne funktion er selve opret-handlingen - kaldes fra SAMME transaktion
// som saetter lead.stage = BEKRAEFTET (§11.6: "et lead maa aldrig staa i
// tilstanden Bekraeftet uden ordre i mere end et oejeblik"), saa et lead
// aldrig kan ende i den forkerte mellemtilstand.
//
// §11.7: udfylder OGSAA Order.productsTotal/estimatedTotal fra
// lead.quotePriceDkk, og opretter et OrderItem pr. Measurement-linje som
// et DISPLAY-SNAPSHOT (lineTotal = ligelig andel af totalprisen - valgt
// fremfor 0 kr/linje, da det giver mindst forvirring i "Produkter"-
// visningen; se §11.7). Sandhedskilden for selve produktionen/skæreliste
// er og bliver `order.lead.measurements` - ALDRIG `order.items`.
export async function promoteLeadToOrder(tx: Tx, leadId: string) {
  const lead = await tx.lead.findUnique({
    where: { id: leadId },
    include: { order: true, measurements: { orderBy: { itemNumber: "asc" } } }
  });
  if (!lead) throw new Error("Lead ikke fundet");
  if (lead.order) return lead.order; // allerede forfremmet - idempotent
  if (lead.stage !== "BEKRAEFTET") throw new Error("Lead skal vaere bekraeftet foer det kan forfremmes.");

  const totalPris = lead.quotePriceDkk || 0;
  const linjer = lead.measurements;
  const perLinje = linjer.length > 0 ? Math.round((totalPris / linjer.length) * 100) / 100 : 0;

  const order = await tx.order.create({
    data: {
      orderNumber: lead.leadNumber, // samme loebenummer genbruges, §3.6
      leadId: lead.id,
      stage: "KOE",
      productsTotal: totalPris,
      estimatedTotal: totalPris,
      // Q1 (besluttet): kundefelterne paa Order beholdes urørt i databasen
      // som et additivt snapshot ved forfremmelse - al NY kode laeser dog
      // kundedata via order.lead.* som den levende sandhed, jf. §2.
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      postalCode: lead.postalCode,
      city: lead.city,
      items: {
        create: linjer.map((m: any) => ({
          roomName: m.roomName,
          productName: m.productType || "Standard Myggenet",
          widthMm: m.widthMm || 0,
          heightMm: m.heightMm || 0,
          colorName: m.colorName,
          comment: m.comment,
          areaSqm: m.widthMm && m.heightMm ? Math.round((m.widthMm / 1000) * (m.heightMm / 1000) * 100) / 100 : 0,
          lineTotal: perLinje
        }))
      }
    }
  });
  return order;
}

// Bruges udenfor en eksisterende transaktion (fx den interne, ikke
// bruger-trykbare /api/leads/[id]/promote-rute, bevaret som sikkerheds-
// net jf. §11.6's "API-endpointet maa gerne bevares som en intern
// funktion, blot ikke som en bruger-trykbar handling laengere").
export async function promoteLeadToOrderStandalone(leadId: string) {
  return prisma.$transaction((tx: any) => promoteLeadToOrder(tx, leadId));
}
