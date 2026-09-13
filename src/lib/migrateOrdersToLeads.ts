// FASE 1 - delt migreringslogik, jf. Myggestop - Arkitektur-specifikation.md
// §7 punkt 5 og §10.3-10.5. Bruges baade af scripts/migrate-orders-to-leads.ts
// (lokal koersel) og af den midlertidige admin-API-rute
// src/app/api/admin/fase1-migrate/route.ts (koerer mod den database appen
// selv er koblet til - se rutens egen kommentar for kontekst om hvorfor).
//
// Idempotent: en Order der allerede har leadId springes over.
import { prisma } from "@/lib/prisma";
import { OrderStatus, OrderStage, LeadStage } from "@prisma/client";

// Dokumenteret mapping fra den gamle OrderStatus til den nye OrderStage,
// jf. §7 punkt 5 ("brug dit skoen her, men dokumentér valget"):
// - AFSLUTTET -> BETALT (en afsluttet ordre er reelt betalt/faerdig)
// - ANNULLERET -> KOE + cancelledAt saettes (historikken bevares selvom
//   OrderStage ikke har et eget ANNULLERET-trin)
// - NY/UNDER_BEHANDLING/TILBUD_SENDT/AFVENTER_KUNDE -> KOE (den reelle
//   produktionsstatus kendes ikke fra den gamle enum alene, saa den
//   sikreste antagelse er "staar i koe")
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

export interface MigrationRowResult {
  orderNumber: string;
  navn: string;
  fraStatus: OrderStatus;
  tilStage: OrderStage;
  annulleret: boolean;
  fejl?: string;
}

export interface MigrationSummary {
  dryRun: boolean;
  ordreITalt: number;
  allredeMigreret: number;
  skalMigreres: number;
  migreret: number;
  fejlAntal: number;
  stageFordeling: Record<string, number>;
  raekker: MigrationRowResult[];
}

export async function runOrdersToLeadsMigration(opts: { dryRun: boolean }): Promise<MigrationSummary> {
  const { dryRun } = opts;

  const ordreITalt = await prisma.order.count();
  const allredeMigreret = await prisma.order.count({ where: { NOT: { leadId: null } } });
  const skalMigreres = await prisma.order.findMany({
    where: { leadId: null },
    include: { items: { select: { productName: true } } },
    orderBy: { createdAt: "asc" }
  });

  const stageFordeling: Record<string, number> = {};
  const raekker: MigrationRowResult[] = [];
  let migreret = 0;
  let fejlAntal = 0;

  for (const order of skalMigreres) {
    const stage = STATUS_TO_STAGE[order.status];
    const wasAnnulleret = order.status === "ANNULLERET";
    stageFordeling[stage] = (stageFordeling[stage] || 0) + 1;

    const row: MigrationRowResult = {
      orderNumber: order.orderNumber,
      navn: `${order.firstName} ${order.lastName}`,
      fraStatus: order.status,
      tilStage: stage,
      annulleret: wasAnnulleret
    };

    if (!dryRun) {
      const leadData = {
        leadNumber: order.orderNumber,
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
        migreret++;
      } catch (e: any) {
        fejlAntal++;
        row.fejl = String(e?.message || e);
      }
    }

    raekker.push(row);
  }

  return {
    dryRun,
    ordreITalt,
    allredeMigreret,
    skalMigreres: skalMigreres.length,
    migreret,
    fejlAntal,
    stageFordeling,
    raekker
  };
}
