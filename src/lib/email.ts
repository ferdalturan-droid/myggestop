import nodemailer from "nodemailer";

let cached: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null; // ikke konfigureret endnu
  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });
  return cached;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@myggestop.dk";
  if (!transport) {
    console.warn("[email] SMTP ikke konfigureret - springer afsendelse over:", opts.subject);
    return { ok: false, error: "SMTP ikke konfigureret" };
  }
  try {
    await transport.sendMail({ from, ...opts });
    return { ok: true };
  } catch (e: any) {
    console.error("[email] fejl:", e?.message);
    return { ok: false, error: e?.message };
  }
}
