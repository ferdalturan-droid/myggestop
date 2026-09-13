// FASE 1 - data-migreringsscript, jf. Myggestop - Arkitektur-specifikation.md
// §7 punkt 5 og §10.3-10.5.
//
// Formaal: for hver eksisterende Order (fra foer arkitektur-ombygningen)
// oprettes et tilsvarende Lead (allerede BEKRAEFTET, siden de reelt er
// rigtige, bekraeftede ordrer), og Order.leadId peger paa den.
// Order.stage saettes ud fra en fornuftig mapping af den gamle
// OrderStatus - se STATUS_TO_STAGE herunder for den dokumenterede
// beslutning.
//
// Scriptet er IDEMPOTENT: en Order der allerede har en leadId springes
// over, saa det er trygt at koere flere gange (fx efter fejl midtvejs).
//
// Koer ALTID foerst med --dry-run mod en KOPI af produktionsdatabasen
// (se §10.1/§10.10), aldrig direkte mod den live database foerst.
//
// Brug:
//   DATABASE_URL="<connection-string-til-DB-kopi>" npx tsx scripts/migrate-orders-to-leads.ts --dry-run
//   DATABASE_URL="<connection-string-til-DB-kopi>" npx tsx scripts/migrate-orders-to-leads.ts
//
import { PrismaClient, OrderStatus, OrderStage, LeadStage } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

// Dokumenteret mapping fra den gamle OrderStatus til den nye
// OrderStage, jf. §7 punkt 5 ("brug dit skoen her, men dokumentér
// valget i kodekommentarer"):
//
// - AFSLUTTET      -> BETALT        (en afsluttet ordre er reelt betalt/faerdig)
// - ANNULLERET     -> KOE + cancelledAt saettes, saa den historiske
//                     kendsgerning "annulleret" ikke gaar tabt, selvom
//                     OrderStage ikke har et direkte ANNULLERET-trin.
//                     (note faar en praefiks-markering, se byggNote)
// - NY / UNDER_BEHANDLING / TILBUD_SENDT / AFVENTER_KUNDE
//                  -> KOE           (vi kender ikke den reelle
//                     produktionsstatus fra den gamle enum alene, saa
//                     den sikreste antagelse er "staar i koe", ikke
//                     "i produktion" eller "betalt")
const STATUS_TO_STAGE: Record<OrderStatus, OrderStage> = {
  NY: OrderStage.KOE,
  UNDER_BEHANDLING: OrderStage.KOE,
  TILBUD_SENDT: OrderStage.KOE,
  AFVENTER_KUNDE: OrderStage.KOE,
  AFSLUTTET: OrderStage.BETALT,
  ANNULLERET: OrderStage.KOE
};

function byggProductSummary(items: { productName: string }[]): string {
  if (items.length === 0) return "";
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.productName, (counts.get(it.productName) || 0) + 1);
  return Array.from(counts.entries())
    .map(([navn, antal]) => (antal > 1 ? `${navn} x${antal}` : navn))
    .join(", ");
}

function byggNote(existingNote: string, wasAnnulleret: boolean): string {
  if (!wasAnnulleret) return existingNote;
  const tag = "[ANNULLERET - migreret fra gammel OrderStatus, ikke et OrderStage-trin]";
  return existingNote ? `${existingNote}\n${tag}` : tag;
}

async function main() {
  console.log(`--- migrate-orders-to-leads.ts ${DRY_RUN ? "(DRY RUN - der skrives INTET)" : "(SKRIVER TIL DATABASEN)"} ---`);

  const totalOrders = await prisma.order.count();
  const alleredeMigreret = await prisma.order.count({ where: { NOT: { leadId: null } } });
  const skalMigreres = await prisma.order.findMany({
    where: { leadId: null },
    include: { items: { select: { productName: true } } },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Order-raekker i alt: ${totalOrders}`);
  console.log(`Allerede migreret (har leadId): ${alleredeMigreret}`);
  console.log(`Skal migreres nu: ${skalMigreres.length}`);
  console.log("");

  const stageCounts: Record<string, number> = {};
  let fejl = 0;

  for (const order of skalMigreres) {
    const stage = STATUS_TO_STAGE[order.status];
    const wasAnnulleret = order.status === "ANNULLERET";
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;

    const leadData = {
      leadNumber: order.orderNumber, // samme loebenummer genbruges, jf. §3.6
      stage: LeadStage.BEKRAEFTET,
      firstName: order.firstName,
      lastName: order.lastName,
      phone: order.phone,
      email: order.email,
      address: order.address,
      postalCode: order.postalCode,
      city: order.city,
      source: "Migreret (eksisterende ordre)",
      productSummary: byggProductSummary(order.items),
      confirmedAt: order.createdAt
    };

    console.log(
      `${DRY_RUN ? "[DRY RUN] Ville migrere" : "Migrerer"}: ${order.orderNumber} (${order.firstName} ${order.lastName}) ` +
      `status=${order.status} -> stage=${stage}${wasAnnulleret ? " (+ cancelledAt)" : ""}`
    );

    if (DRY_RUN) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const lead = await tx.lead.create({ data: leadData });
        await tx.order.update({
          where: { id: order.id },
          data: {
            leadId: lead.id,
            stage,
            cancelledAt: wasAnnulleret ? order.updatedAt : null,
            note: byggNote(order.note, wasAnnulleret)
          }
        });
      });
    } catch (e) {
      fejl++;
      console.error(`  FEJL ved migrering af ${order.orderNumber}:`, e);
    }
  }

  console.log("");
  console.log("--- Opsummering ---");
  console.log("Stage-fordeling for migrerede ordrer:", stageCounts);
  if (fejl > 0) console.log(`FEJL: ${fejl} ordre(r) kunne ikke migreres - se ovenfor.`);
  if (DRY_RUN) console.log("Dette var en dry-run. Intet er skrevet til databasen. Koer uden --dry-run for at udfoere migreringen.");
  else console.log("Migrering faerdig.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
