import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { formatDKK } from "./pricing";
import { ORDER_STATUS_LABELS } from "./types";

export interface PdfOrder {
  orderNumber: string;
  status: string;
  createdAt: Date;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  wantsInstallation: boolean;
  note: string;
  productsTotal: number;
  installationTotal: number;
  estimatedTotal: number;
  items: {
    roomName: string;
    productName: string;
    widthMm: number;
    heightMm: number;
    colorName: string;
    comment: string;
    isDoubleDoor: boolean;
    areaSqm: number;
    lineTotal: number;
  }[];
}

export interface PdfBranding {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  shippingText: string;
}

const BLUE = rgb(0.105, 0.553, 0.878);
const GREEN = rgb(0.361, 0.773, 0.141);
const INK = rgb(0.05, 0.105, 0.165);
const GREY = rgb(0.45, 0.5, 0.55);
const LINE = rgb(0.89, 0.92, 0.95);

function da(d: Date): string {
  return new Intl.DateTimeFormat("da-DK", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export async function generateOrderPdf(order: PdfOrder, b: PdfBranding): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Ordre ${order.orderNumber} - Myggestop`);
  doc.setProducer("Myggestop");
  let page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = page.getWidth();
  const M = 48;
  let y = page.getHeight() - 56;

  const text = (
    p: PDFPage,
    s: string,
    x: number,
    yy: number,
    size = 10,
    f: PDFFont = font,
    color = INK
  ) => p.drawText(s ?? "", { x, y: yy, size, font: f, color });

  // ---- Header band ----
  page.drawRectangle({ x: 0, y: page.getHeight() - 110, width: W, height: 110, color: rgb(0.051, 0.106, 0.165) });
  // logo-mark (forenklet)
  page.drawCircle({ x: M + 16, y: page.getHeight() - 55, size: 18, color: BLUE });
  page.drawCircle({ x: M + 30, y: page.getHeight() - 48, size: 7, color: GREEN });
  text(page, "MYGGE", M + 44, page.getHeight() - 52, 22, bold, rgb(1, 1, 1));
  const mwidth = bold.widthOfTextAtSize("MYGGE", 22);
  text(page, "STOP", M + 44 + mwidth, page.getHeight() - 52, 22, bold, GREEN);
  text(page, "Specialfremstillede myggenet - hele Danmark", M + 44, page.getHeight() - 70, 9, font, rgb(0.8, 0.86, 0.92));

  text(page, "ORDREBEKRAEFTELSE", W - M - bold.widthOfTextAtSize("ORDREBEKRAEFTELSE", 11), page.getHeight() - 48, 11, bold, rgb(1, 1, 1));
  text(page, order.orderNumber, W - M - font.widthOfTextAtSize(order.orderNumber, 12), page.getHeight() - 66, 12, font, GREEN);
  text(page, da(order.createdAt), W - M - font.widthOfTextAtSize(da(order.createdAt), 9), page.getHeight() - 82, 9, font, rgb(0.8, 0.86, 0.92));

  y = page.getHeight() - 140;

  // ---- Status pill ----
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
  text(page, "Status:", M, y, 10, bold);
  text(page, statusLabel, M + 44, y, 10, font, BLUE);
  y -= 26;

  // ---- Kundeoplysninger ----
  text(page, "KUNDEOPLYSNINGER", M, y, 11, bold, BLUE);
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
  y -= 18;
  const col2 = M + 270;
  text(page, "Navn", M, y, 8, bold, GREY);
  text(page, `${order.firstName} ${order.lastName}`, M, y - 13, 10);
  text(page, "Telefon", col2, y, 8, bold, GREY);
  text(page, order.phone, col2, y - 13, 10);
  y -= 34;
  text(page, "E-mail", M, y, 8, bold, GREY);
  text(page, order.email, M, y - 13, 10);
  text(page, "Adresse", col2, y, 8, bold, GREY);
  text(page, order.address, col2, y - 13, 10);
  y -= 34;
  text(page, "Postnr. og by", M, y, 8, bold, GREY);
  text(page, `${order.postalCode} ${order.city}`, M, y - 13, 10);
  text(page, "Montering", col2, y, 8, bold, GREY);
  text(page, order.wantsInstallation ? "Ja - montering onskes" : "Nej - kun levering", col2, y - 13, 10);
  y -= 40;

  // ---- Produktlinjer ----
  text(page, "PRODUKTER", M, y, 11, bold, BLUE);
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
  y -= 4;

  // tabelhoved
  const cols = { rum: M, type: M + 95, mal: M + 235, farve: M + 330, areal: M + 415, pris: W - M - 70 };
  y -= 14;
  text(page, "Rum", cols.rum, y, 8, bold, GREY);
  text(page, "Produkt", cols.type, y, 8, bold, GREY);
  text(page, "Mal (BxH)", cols.mal, y, 8, bold, GREY);
  text(page, "Farve", cols.farve, y, 8, bold, GREY);
  text(page, "m2", cols.areal, y, 8, bold, GREY);
  text(page, "Pris", cols.pris, y, 8, bold, GREY);
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
  y -= 16;

  const ensure = () => {
    if (y < 140) {
      page = doc.addPage([595.28, 841.89]);
      y = page.getHeight() - 60;
    }
  };

  for (const it of order.items) {
    ensure();
    const typeLabel = it.productName + (it.isDoubleDoor ? " (Dobbeltdor)" : "");
    text(page, it.roomName || "-", cols.rum, y, 9, bold);
    text(page, clip(typeLabel, 24), cols.type, y, 9);
    text(page, `${it.widthMm} x ${it.heightMm} mm`, cols.mal, y, 9);
    text(page, clip(it.colorName || "-", 14), cols.farve, y, 9);
    text(page, it.areaSqm.toString().replace(".", ","), cols.areal, y, 9);
    text(page, formatDKK(it.lineTotal), cols.pris - 6, y, 9);
    y -= 14;
    if (it.comment) {
      text(page, `Kommentar: ${clip(it.comment, 90)}`, cols.rum + 6, y, 8, font, GREY);
      y -= 12;
    }
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.5, color: LINE });
    y -= 8;
  }

  // ---- Totaler ----
  ensure();
  y -= 10;
  const tx = W - M - 220;
  const tv = W - M;
  const totLine = (label: string, val: string, b = false) => {
    text(page, label, tx, y, b ? 11 : 10, b ? bold : font, b ? INK : GREY);
    text(page, val, tv - (b ? bold : font).widthOfTextAtSize(val, b ? 11 : 10), y, b ? 11 : 10, b ? bold : font, b ? BLUE : INK);
    y -= b ? 20 : 16;
  };
  totLine("Produkter i alt", formatDKK(order.productsTotal));
  if (order.wantsInstallation) totLine("Montering", formatDKK(order.installationTotal));
  totLine("Fragt", "Efter aftale");
  page.drawLine({ start: { x: tx, y: y + 6 }, end: { x: tv, y: y + 6 }, thickness: 1, color: LINE });
  y -= 4;
  totLine("Estimeret total", formatDKK(order.estimatedTotal), true);

  // ---- Noter / disclaimer ----
  ensure();
  y -= 6;
  if (order.note) {
    text(page, "Bemaerkning fra kunde:", M, y, 9, bold, GREY);
    y -= 13;
    for (const line of wrap(order.note, font, 9, W - 2 * M)) {
      text(page, line, M, y, 9);
      y -= 12;
    }
    y -= 6;
  }
  const disc = [
    "Bemaerk: Dette er en uforpligtende anmodning - ikke en endelig faktura. Prisen er estimeret ud fra",
    "dine indtastede mal og er afrundet kommercielt op til naermeste 0,5 m2. " + b.shippingText,
    "Myggestop kontakter dig vedr. endelig pris, levering og evt. montering."
  ];
  for (const d of disc) {
    text(page, d, M, y, 8, font, GREY);
    y -= 11;
  }

  // ---- Footer ----
  const fY = 40;
  page.drawLine({ start: { x: M, y: fY + 16 }, end: { x: W - M, y: fY + 16 }, thickness: 0.5, color: LINE });
  text(page, `${b.companyName}  -  ${b.address}, ${b.postalCode} ${b.city}`, M, fY, 8, font, GREY);
  const contact = `${b.phone}  -  ${b.email}`;
  text(page, contact, W - M - font.widthOfTextAtSize(contact, 8), fY, 8, font, GREY);

  return await doc.save();
}

function clip(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "..." : s;
}
function wrap(s: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(t, size) > maxW) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 6);
}
