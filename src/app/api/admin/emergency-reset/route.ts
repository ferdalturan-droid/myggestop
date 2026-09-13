import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MIDLERTIDIG NOEDRUTE - fjernes igen straks efter brug. Bruges KUN til
// at gendanne adgang til en konto naar man er logget ude, uden nogen
// gyldig session at authorisere sig med. Beskyttet af AUTH_SECRET (kendt
// kun server-side), IKKE af en session.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.secret || b.secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }
  const email = String(b.email || "").trim().toLowerCase();
  const newPassword = String(b.newPassword || "");
  if (!email || newPassword.length < 6) {
    return NextResponse.json({ error: "Ugyldigt input" }, { status: 400 });
  }
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Bruger ikke fundet" }, { status: 404 });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
