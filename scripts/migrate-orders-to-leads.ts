// FASE 1 - lokal koersel af migreringen, jf. §7 punkt 5 og §10.3-10.5.
// Bruger den delte logik i src/lib/migrateOrdersToLeads.ts (samme kode
// som den midlertidige admin-API-rute koerer).
//
// Koer ALTID foerst med --dry-run.
//
// Brug (mod en database-kopi, se §10.1/§10.10 - anbefales stadig til
// fremtidige faser, selvom Fase 1 blev koert direkte mod produktion
// efter eksplicit ok fra opdragsgiver):
//   DATABASE_URL="<connection-string>" npx tsx scripts/migrate-orders-to-leads.ts --dry-run
//   DATABASE_URL="<connection-string>" npx tsx scripts/migrate-orders-to-leads.ts
import { runOrdersToLeadsMigration } from "../src/lib/migrateOrdersToLeads";
import { prisma } from "../src/lib/prisma";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`--- migrate-orders-to-leads.ts ${DRY_RUN ? "(DRY RUN - der skrives INTET)" : "(SKRIVER TIL DATABASEN)"} ---`);
  const summary = await runOrdersToLeadsMigration({ dryRun: DRY_RUN });
  console.log(JSON.stringify(summary, null, 2));
  console.log("");
  console.log(DRY_RUN ? "Dette var en dry-run. Intet er skrevet." : "Migrering faerdig.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
