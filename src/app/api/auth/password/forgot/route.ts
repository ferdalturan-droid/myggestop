import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FASE 3: selvbetjent "glemt adgangskode"-flow, saa man aldrig behoever
// en manuel database-nulstilling for at komme ind paa sin egen konto
// igen (se episoden under Fase 2-testen).
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const cleanEmail = String(email || "").trim().toLowerCase();
  // Samme svar uanset om brugeren findes, for ikke at afsloere hvilke
  // e-mails der har en konto.
  const generic = NextResponse.json({ ok: true });
  if (!cleanEmail) return generic;

  const user = await prisma.adminUser.findUnique({ where: { email: cleanEmail } });
  if (!user) return generic;

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 time
  await prisma.adminUser.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiry: expiry } });

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://myggestop.vercel.app";
  const link = `${site}/admin/nulstil-adgangskode?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Nulstil din adgangskode – Nordica admin",
    html: `<p>Hej ${user.name},</p><p>Klik på linket for at vælge en ny adgangskode. Linket udløber om 1 time.</p><p><a href="${link}">${link}</a></p><p>Har du ikke bedt om dette, kan du ignorere denne mail.</p>`
  });

  return generic;
}
