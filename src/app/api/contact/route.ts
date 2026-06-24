import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.name || !b.email || !b.message) {
    return NextResponse.json({ error: "Udfyld navn, e-mail og besked." }, { status: 400 });
  }
  await prisma.contactMessage.create({
    data: { name: b.name, email: b.email, phone: b.phone || "", message: b.message }
  });
  const contact = await getSetting("contact");
  sendMail({
    to: contact.adminEmail,
    subject: `Ny kontaktbesked fra ${b.name}`,
    html: `<p><strong>${b.name}</strong> (${b.email}${b.phone ? ", " + b.phone : ""}) skriver:</p><p>${String(b.message).replace(/</g, "&lt;")}</p>`
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
