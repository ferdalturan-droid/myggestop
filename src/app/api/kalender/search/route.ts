import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RUNDE 2 (Q5): søge-picker til kalenderens "+ Ny aftale"-formular - man
// skal kunne finde et Lead eller en Order ved navn/lead-nummer/ordre-
// nummer i stedet for at skulle kende og indtaste en rå database-ID (§Q5:
// "og der skal vel være en id reference jeg kan vælge"). Bevidst en
// SMAL, minimal visning (kun det der skal bruges til at booke en aftale),
// tilgængelig for begge roller der maa bruge kalenderen.
export async function GET(req: NextRequest) {
  const auth = await requireRole(["COORDINATOR", "INSTALLER"]);
  if (!auth.ok) return auth.response;
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [leads, orders] = await Promise.all([
    prisma.lead.findMany({
      where: {
        OR: [
          { leadNumber: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } }
        ]
      },
      select: { id: true, leadNumber: true, firstName: true, lastName: true, phone: true, address: true, postalCode: true, city: true },
      take: 8
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } }
        ]
      },
      select: { id: true, orderNumber: true, firstName: true, lastName: true, phone: true, address: true, postalCode: true, city: true },
      take: 8
    })
  ]);

  const results = [
    ...leads.map((l: any) => ({
      kind: "lead" as const,
      id: l.id,
      label: `${l.leadNumber} · ${l.firstName} ${l.lastName}`,
      customer: `${l.firstName} ${l.lastName}`,
      phone: l.phone,
      address: [l.address, l.postalCode, l.city].filter(Boolean).join(", ")
    })),
    ...orders.map((o: any) => ({
      kind: "order" as const,
      id: o.id,
      label: `${o.orderNumber} · ${o.firstName} ${o.lastName}`,
      customer: `${o.firstName} ${o.lastName}`,
      phone: o.phone,
      address: [o.address, o.postalCode, o.city].filter(Boolean).join(", ")
    }))
  ];
  return NextResponse.json({ results });
}
