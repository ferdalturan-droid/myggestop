import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 5 (§3.5/§6.7): booker en INSTALLATION-aftale koblet til ordren.
// §6.7: book aldrig mere end ca. 2 uger frem, og saet
// Order.promisedInstallDate KUN naar en konkret dag rent faktisk er
// givet til kunden - det er netop hvad denne handling er.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(["COORDINATOR"]);
  if (!auth.ok) return auth.response;
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Ordre ikke fundet" }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const day = String(b.day || "").trim();
  const time = String(b.time || "").trim();
  if (!day || !time) return NextResponse.json({ error: "Vælg dato og klokkeslæt." }, { status: 400 });

  const dayDate = new Date(day);
  const twoWeeksOut = new Date(); twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
  const advarsel = dayDate > twoWeeksOut ? "Datoen er mere end ~2 uger frem - overvej at vente med at love en konkret dag til kunden (§6.7)." : null;

  // RUNDE 5: samme begrundelse som ved opmåling - book paa en navngiven
  // installatoer, ikke en generisk "INSTALLER"-bunke.
  const assignedUserId = b.assignedUserId ? String(b.assignedUserId) : null;
  if (!assignedUserId) return NextResponse.json({ error: "Vælg hvilken installatør installationen skal ligge hos." }, { status: 400 });
  const installatoer = await prisma.adminUser.findUnique({ where: { id: assignedUserId } });
  if (!installatoer || installatoer.role !== "INSTALLER") {
    return NextResponse.json({ error: "Den valgte person er ikke en gyldig installatør." }, { status: 400 });
  }

  const clash = await prisma.appointment.findFirst({ where: { day, time, assignedUserId } });
  if (clash) return NextResponse.json({ error: "Tidspunktet er allerede booket hos denne installatør.", conflict: { customer: clash.customer } }, { status: 409 });

  const [appointment] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        day, time,
        customer: `${order.firstName} ${order.lastName}`,
        phone: order.phone,
        address: `${order.address}, ${order.postalCode} ${order.city}`,
        type: "INSTALLATION",
        resource: "INSTALLER",
        status: "TENTATIVE",
        orderId: order.id,
        assignedUserId
      },
      include: { assignedUser: { select: { id: true, name: true } } }
    }),
    prisma.order.update({ where: { id: order.id }, data: { promisedInstallDate: dayDate } })
  ]);

  return NextResponse.json({ appointment, advarsel });
}
