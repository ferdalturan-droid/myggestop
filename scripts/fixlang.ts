import { PrismaClient } from "@prisma/client";
import { defaultSettings } from "../src/data/defaults";
const prisma = new PrismaClient();

async function main() {
  // 1) Indstillinger: overskriv med korrekte danske defaults
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({ where: { key }, update: { value: value as any }, create: { key, value: value as any } });
  }
  console.log("Indstillinger opdateret.");

  // 2) Produkter
  await prisma.product.updateMany({
    where: { name: "Standard Myggenet" },
    data: {
      shortText: "Specialfremstillet rammenet til vinduer og døre.",
      description: "Vores klassiske myggenet i en solid aluminiumsramme med finmasket fiberglasnet. Fremstilles efter mål og holder insekter ude, mens luft og lys frit slipper ind.",
      features: ["Robust aluminiumsramme","Finmasket fiberglasnet","Specialmål op til 2500 mm i bredden","Nem montering uden værktøj"] as any
    }
  });
  await prisma.product.updateMany({
    where: { OR: [{ name: "Plise gardin" }, { name: "Plisse gardin" }, { name: "Plisségardin" }] },
    data: {
      name: "Plisségardin",
      shortText: "Elegant plisségardin til solafskærmning — til vinduer og døre.",
      description: "Plisségardin til effektiv solafskærmning. Det foldede stof trækkes nemt for og skaber et behageligt indeklima uden generende sollys og varme. Fremstilles efter mål til både vinduer og døre.",
      features: ["Effektiv solafskærmning","Elegant foldemekanisme","Trinfri bundskinne","Specialmål efter ønske"] as any
    }
  });
  await prisma.product.updateMany({
    where: { name: "Op-Down gardin" },
    data: {
      shortText: "Lodret gardin, der nemt trækkes op og ned efter behov.",
      description: "Op-Down gardin trækkes nemt lodret op og ned. Ideel til vinduer, hvor du ønsker en fleksibel og diskret løsning. Fremstilles efter mål.",
      features: ["Trækkes lodret op og ned","Diskret og pladsbesparende","Specialmål efter ønske","Nem og lydløs betjening"] as any
    }
  });
  console.log("Produkter opdateret.");

  // 3) Farver
  await prisma.color.updateMany({ where: { name: "Antracitgra (RAL 7016)" }, data: { name: "Antracitgrå (RAL 7016)" } });
  await prisma.color.updateMany({ where: { name: "Solvgra" }, data: { name: "Sølvgrå" } });
  console.log("Farver opdateret.");
}
main().catch((e)=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
