import { prisma } from "./prisma";

/** Genererer fortlobende ordrenummer pr. aar, f.eks. MYG-2026-0001. */
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.orderCounter.upsert({
    where: { year },
    update: { count: { increment: 1 } },
    create: { year, count: 1 }
  });
  const seq = String(counter.count).padStart(4, "0");
  return `MYG-${year}-${seq}`;
}
