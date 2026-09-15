import { prisma } from "@/lib/prisma";
import { TUR_LABEL } from "@/lib/calcOptions";
import { getSetting } from "@/lib/settings";
import { calcInstallation } from "@/lib/pricing";

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
// RUNDE 10 (§H - "det er forkert, beregningsmekanismen er allerede i
// systemet du skal bruge det"): den tidligere ligelig-andel-udregning
// (totalpris / antal linjer) er erstattet af hver linjes EGEN allerede
// beregnede pris (calculatedLineTotal, sat af measurementPricing.ts hver
// gang en linje oprettes/redigeres) - to linjer med vidt forskellige mål
// fik tidligere samme pris, hvilket var den konkrete fejl brugeren
// rapporterede ("3000 kr / 2 produkter = 1500 kr hver"). En eventuel
// rabat (lead.discountDkk, indtastet af Koordinator på Lead-siden) bliver
// nu sin egen synlige "Rabat"-linje, fremfor at blive skjult inde i en
// omregnet total - samme mønster som Montering/Rabat-linjer andre steder.
export async function promoteLeadToOrder(tx: Tx, leadId: string) {
  const lead = await tx.lead.findUnique({
    where: { id: leadId },
    include: { order: true, measurements: { orderBy: [{ itemNumber: "asc" }, { createdAt: "asc" }] } }
  });
  if (!lead) throw new Error("Lead ikke fundet");
  if (lead.order) return lead.order; // allerede forfremmet - idempotent
  if (lead.stage !== "BEKRAEFTET") throw new Error("Lead skal vaere bekraeftet foer det kan forfremmes.");

  const linjer = lead.measurements;
  // RUNDE 4 (§G1 - "bullet proof"): et OrderItem maa KUN oprettes for en
  // maalingsraekke der reelt har maal - ellers dukker spoegelses-
  // produktlinjer op paa Ordre-siden (fx "SINEKLIK 0×0 mm - 18 kr", set i
  // produktionen). "items" er kun et DISPLAY-snapshot (sandhedskilden er
  // og bliver `order.lead.measurements`), saa det er trygt at udelade
  // ugyldige raekker helt.
  const gyldigeLinjer = linjer.filter((m: any) => m.widthMm != null && m.heightMm != null && m.widthMm > 0 && m.heightMm > 0);
  // RUNDE 10 (§H): brug lead.calculatedPriceDkk hvis den allerede er sat
  // (den normale vej - beregnet naar Installatør markerede opmåling
  // færdig), ellers en sikkerheds-fallback der summerer linjerne igen her
  // og nu (dækker det usandsynlige tilfælde at et lead skulle blive
  // bekræftet uden nogensinde at have haft measuredAt sat).
  const sumAfLinjer = gyldigeLinjer.reduce((s: number, m: any) => s + (m.calculatedLineTotal || 0), 0);
  const totalPrisFoerRabat = typeof lead.calculatedPriceDkk === "number" ? lead.calculatedPriceDkk : sumAfLinjer;
  const rabat = Math.min(lead.discountDkk || 0, totalPrisFoerRabat);
  const totalPris = totalPrisFoerRabat - rabat;

  // RUNDE 9 ("det skal være muligt at vælge om montering skal laves eller
  // ikke på ordre niveau"): webformularen (den hyppigste kilde til leads)
  // lagde tidligere kun "[Ønsker montering]" i lead.note som fri tekst -
  // her laeses den markering ind som ordrens rigtige wantsInstallation, saa
  // Koordinator ikke skal huske at slaa den til manuelt for hver eneste
  // almindelig ordre. Kan altid rettes bagefter via "Rediger ordre".
  const onskerMontering = /\[Ønsker montering\]/.test(lead.note || "");
  const pricing = onskerMontering ? await getSetting("pricing") : null;
  const installationTotal = pricing ? calcInstallation(gyldigeLinjer.length, true, pricing) : 0;

  const order = await tx.order.create({
    data: {
      orderNumber: lead.leadNumber, // samme loebenummer genbruges, §3.6
      leadId: lead.id,
      stage: "KOE",
      productsTotal: totalPris,
      installationTotal,
      estimatedTotal: totalPris + installationTotal,
      wantsInstallation: onskerMontering,
      // RUNDE 9: kilde-rapportering skal ogsaa gaelde almindelige (lead-
      // baserede) ordrer, ikke kun manuelle bypass-ordrer - se
      // Order.source-kommentaren i schema.prisma.
      source: lead.source || "",
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
        create: [
          ...gyldigeLinjer.map((m: any) => ({
            roomName: m.roomName,
            // RUNDE 10 (§J - "jeg ser 'myggenet & plisser' to gange, og jeg
            // ser ikke 'gardin'"): slaar navnet op via den kanoniske
            // tur-KODE (m.tur: SINEKLIK/PERDE/KOMBI), ikke det tidligere
            // gemte productType-visningsnavn - et productType der historisk
            // var forkert/inkonsistent kunne ellers "fastfryse" en forkert
            // eller manglende visning permanent på selve ordren.
            productName: TUR_LABEL[m.tur] || m.productType || "Myggenet",
            widthMm: m.widthMm,
            heightMm: m.heightMm,
            colorName: m.colorName,
            comment: m.comment,
            areaSqm: Math.round((m.widthMm / 1000) * (m.heightMm / 1000) * 100) / 100,
            // RUNDE 10 (§H): hver linjes EGEN beregnede pris, ikke en
            // ligelig andel af totalen.
            lineTotal: m.calculatedLineTotal || 0
          })),
          // RUNDE 10 (§H): en eventuel rabat er nu sin egen synlige linje,
          // fremfor skjult inde i en omregnet total.
          ...(rabat > 0 ? [{ roomName: "", productName: "Rabat", widthMm: 0, heightMm: 0, colorName: "", comment: "", areaSqm: 0, lineTotal: -rabat }] : [])
        ]
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
