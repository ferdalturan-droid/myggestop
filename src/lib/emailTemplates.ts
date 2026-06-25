import { formatDKK } from "./pricing";
import { PdfOrder, PdfBranding } from "./pdf";

function rows(order: PdfOrder): string {
  return order.items
    .map(
      (it) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e4ebf2;font-weight:600;color:#0d1b2a">${esc(it.roomName)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4ebf2;color:#16263a">${esc(it.productName)}${it.isDoubleDoor ? " <span style='color:#1b8de0'>(Dobbeltdør)</span>" : ""}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4ebf2;color:#16263a">${it.widthMm} × ${it.heightMm} mm</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4ebf2;color:#16263a">${esc(it.colorName || "-")}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4ebf2;color:#16263a">${String(it.areaSqm).replace(".", ",")} m²</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e4ebf2;text-align:right;color:#0d1b2a">${formatDKK(it.lineTotal)}</td>
    </tr>${it.comment ? `<tr><td colspan="6" style="padding:0 10px 8px;color:#6b7785;font-size:12px">↳ ${esc(it.comment)}</td></tr>` : ""}`
    )
    .join("");
}

function shell(title: string, inner: string): string {
  return `<!doctype html><html lang="da"><body style="margin:0;background:#f5f8fb;font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:#0d1b2a;border-radius:16px 16px 0 0;padding:24px 28px">
      <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:.5px">MYGGE<span style="color:#5cc524">STOP</span></span>
      <div style="color:#9fb3c8;font-size:12px;margin-top:4px">Specialfremstillede myggenet · hele Danmark</div>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px;box-shadow:0 8px 30px -12px rgba(13,27,42,.2)">
      <h1 style="margin:0 0 6px;font-size:20px;color:#0d1b2a">${title}</h1>
      ${inner}
    </div>
    <p style="text-align:center;color:#9fb3c8;font-size:12px;margin-top:18px">© ${new Date().getFullYear()} Myggestop · Dette er en automatisk besked.</p>
  </div></body></html>`;
}

function summary(order: PdfOrder): string {
  return `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
    <thead><tr>
      <th style="text-align:left;padding:8px 10px;background:#f5f8fb;color:#6b7785;font-size:11px;text-transform:uppercase">Rum</th>
      <th style="text-align:left;padding:8px 10px;background:#f5f8fb;color:#6b7785;font-size:11px;text-transform:uppercase">Produkt</th>
      <th style="text-align:left;padding:8px 10px;background:#f5f8fb;color:#6b7785;font-size:11px;text-transform:uppercase">Mål</th>
      <th style="text-align:left;padding:8px 10px;background:#f5f8fb;color:#6b7785;font-size:11px;text-transform:uppercase">Farve</th>
      <th style="text-align:left;padding:8px 10px;background:#f5f8fb;color:#6b7785;font-size:11px;text-transform:uppercase">Areal</th>
      <th style="text-align:right;padding:8px 10px;background:#f5f8fb;color:#6b7785;font-size:11px;text-transform:uppercase">Pris</th>
    </tr></thead>
    <tbody>${rows(order)}</tbody>
  </table>
  <table style="width:100%;font-size:14px;margin-top:8px">
    <tr><td style="padding:4px 0;color:#6b7785">Produkter i alt</td><td style="text-align:right;color:#0d1b2a">${formatDKK(order.productsTotal)}</td></tr>
    ${order.wantsInstallation ? `<tr><td style="padding:4px 0;color:#6b7785">Montering</td><td style="text-align:right;color:#0d1b2a">${formatDKK(order.installationTotal)}</td></tr>` : ""}
    <tr><td style="padding:4px 0;color:#6b7785">Fragt</td><td style="text-align:right;color:#0d1b2a">Efter aftale</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;color:#0d1b2a;border-top:1px solid #e4ebf2">Estimeret total</td><td style="text-align:right;font-weight:700;color:#1b8de0;border-top:1px solid #e4ebf2">${formatDKK(order.estimatedTotal)}</td></tr>
  </table>`;
}

export function customerEmailHtml(order: PdfOrder, b: PdfBranding): string {
  return shell(
    `Tak for din bestilling, ${esc(order.firstName)}!`,
    `<p style="color:#16263a;line-height:1.6">Vi har modtaget din anmodning med ordrenummer <strong style="color:#1b8de0">${order.orderNumber}</strong>.
    Dette er en <strong>uforpligtende anmodning</strong> — vi kontakter dig hurtigst muligt vedrørende endelig pris, levering og evt. montering.</p>
    ${summary(order)}
    <p style="color:#16263a;line-height:1.6"><strong>Fragt:</strong> ${esc(b.shippingText)}</p>
    <p style="color:#16263a;line-height:1.6">Du finder en PDF med hele din ordre vedhæftet denne mail.</p>
    <div style="margin-top:20px;padding:16px;background:#f5f8fb;border-radius:12px;color:#16263a;font-size:13px">
      <strong>Myggestop</strong><br>${esc(b.phone)} · ${esc(b.email)}<br>${esc(b.address)}, ${esc(b.postalCode)} ${esc(b.city)}
    </div>`
  );
}

export function adminEmailHtml(order: PdfOrder): string {
  return shell(
    `Ny ordre: ${order.orderNumber}`,
    `<p style="color:#16263a;line-height:1.6">Der er kommet en ny bestilling via hjemmesiden.</p>
    <div style="margin:12px 0;padding:16px;background:#f5f8fb;border-radius:12px;color:#16263a;font-size:13px;line-height:1.7">
      <strong>${esc(order.firstName)} ${esc(order.lastName)}</strong><br>
      Tlf: ${esc(order.phone)} · ${esc(order.email)}<br>
      ${esc(order.address)}, ${esc(order.postalCode)} ${esc(order.city)}<br>
      Montering: <strong>${order.wantsInstallation ? "Ja" : "Nej (kun levering)"}</strong>
    </div>
    ${summary(order)}
    ${order.note ? `<p style="color:#16263a"><strong>Bemærkning:</strong> ${esc(order.note)}</p>` : ""}
    <p style="color:#6b7785;font-size:13px">Se ordren i admin-panelet for at sende tilbud og opdatere status.</p>`
  );
}

function esc(s: string): string {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
