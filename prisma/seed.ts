import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultSettings } from "../src/data/defaults";

const prisma = new PrismaClient();

async function main() {
  // -------- Admin bruger --------
  const email = (process.env.ADMIN_EMAIL || "ferdalturan@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "MyggeStop2026!";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "Myggestop Admin" }
  });
  console.log(`Admin oprettet: ${email}`);

  // -------- Indstillinger / priser / indhold / SEO --------
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as any }
    });
  }
  console.log("Indstillinger seedet.");

  // -------- Produkter --------
  const products = [
    {
      slug: "standard-myggenet",
      name: "Standard Myggenet",
      shortText: "Specialfremstillet rammenet til vinduer og dore.",
      description:
        "Vores klassiske myggenet i en solid aluminiumsramme med finmasket fiberglasnet. Specialfremstilles efter dine mal og holder insekter ude, mens luft og lys slipper frit ind.",
      pricePerSqm: 500,
      maxWidthMm: 2500,
      maxHeightMm: 2500,
      doubleDoorThresholdMm: 1200,
      sortOrder: 1,
      features: [
        "Robust aluminiumsramme",
        "Finmasket fiberglasnet",
        "Specialmal op til 2500 mm bredde",
        "Nem montering uden vaerktoj"
      ]
    },
    {
      slug: "plissegardin",
      name: "Plissegardin",
      shortText: "Elegant foldedor / plisse til dore og store partier.",
      description:
        "Plisségardin med foldenet der trækkes elegant til side. Perfekt til terrassedore og altandore hvor du onsker fri passage. Specialfremstilles efter mal.",
      pricePerSqm: 400,
      maxWidthMm: 1200,
      maxHeightMm: 2600,
      doubleDoorThresholdMm: 1200,
      sortOrder: 2,
      features: [
        "Elegant foldemekanisme",
        "Trin-frit bundprofil",
        "Specialmal op til 1200 mm pr. del",
        "Ideel til dore og store partier"
      ]
    }
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, features: p.features as any }
    });
  }
  console.log("Produkter seedet.");

  // -------- Farver --------
  const colors = [
    { name: "Hvid", hex: "#f4f5f7", surchargePerSqm: 0, isStandard: true, sortOrder: 1 },
    { name: "Sort", hex: "#1c1c1e", surchargePerSqm: 0, isStandard: true, sortOrder: 2 },
    { name: "Antracitgra (RAL 7016)", hex: "#383e42", surchargePerSqm: 20, isStandard: false, sortOrder: 3 },
    { name: "Brun", hex: "#5a3a22", surchargePerSqm: 20, isStandard: false, sortOrder: 4 },
    { name: "Solvgra", hex: "#9aa0a6", surchargePerSqm: 20, isStandard: false, sortOrder: 5 }
  ];
  const colorCount = await prisma.color.count();
  if (colorCount === 0) {
    for (const c of colors) await prisma.color.create({ data: c });
    console.log("Farver seedet.");
  }

  // -------- Ordretaeller --------
  const year = new Date().getFullYear();
  await prisma.orderCounter.upsert({
    where: { year },
    update: {},
    create: { year, count: 0 }
  });

  console.log("Seed fuldfort.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
