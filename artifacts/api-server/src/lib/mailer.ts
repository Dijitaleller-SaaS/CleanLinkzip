import nodemailer from "nodemailer";
import { logger } from "./logger";

const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
/* Yandex SMTP requires FROM === authenticated user — ignore SMTP_FROM override */
const SMTP_FROM = SMTP_USER;

function isConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export interface MailAttachment {
  filename: string;
  content:  Buffer | string;
  encoding?: string;
}

export interface MailOptions {
  to:           string;
  subject:      string;
  html:         string;
  attachments?: MailAttachment[];
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!isConfigured()) {
    logger.warn({ to: opts.to, subject: opts.subject },
      "SMTP not configured — skipping email send (set SMTP_USER + SMTP_PASS)");
    return;
  }
  const transport = createTransport();
  await transport.sendMail({ from: `CleanLink <${SMTP_FROM}>`, ...opts });
  logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
}

export function buildHavaleNotificationHtml(opts: {
  firmaName: string;
  refCode:   string;
  paket:     string;
}): string {
  const { firmaName, refCode, paket } = opts;
  const paketLabel = paket === "elite" ? "Elite" : "Standart";
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">CleanLink — Yeni Havale Bildirimi</h2>
      <p>Bir firma havale ödeme kaydı oluşturdu ve onayınızı bekliyor.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%">Firma Adı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaName}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Referans Kodu</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-family:monospace">${refCode}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Paket</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${paketLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Bildirim Zamanı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${now}</td>
        </tr>
      </table>
      <p style="margin-top:20px">
        Onaylamak için
        <a href="https://cleanlinktr.com/admin-dashboard" style="color:#6d28d9">
          Admin Paneli
        </a>'ni ziyaret edin.
      </p>
    </div>
  `;
}

export function buildPaytrPendingHtml(opts: {
  firmaName:   string;
  firmaEmail:  string;
  paket:       string;
  merchantOid: string;
}): string {
  const { firmaName, firmaEmail, paket, merchantOid } = opts;
  const paketLabel = paket === "elite" ? "Elite" : "Standart";
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#0f6d75">CleanLink — PayTR Ödeme Alındı (Admin Onayı Bekliyor)</h2>
      <p>Bir firma PayTR ile ödeme yaptı. <strong>Admin onayı bekleniyor.</strong></p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;width:40%;border:1px solid #d1fae5">Firma Adı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaName}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;border:1px solid #d1fae5">Firma E-posta</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;border:1px solid #d1fae5">Paket</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#0f6d75">${paketLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;border:1px solid #d1fae5">PayTR OID</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-family:monospace;font-size:12px">${merchantOid}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;border:1px solid #d1fae5">Zaman</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${now}</td>
        </tr>
      </table>
      <p>
        <a href="https://cleanlinktr.com/admin-dashboard" style="display:inline-block;padding:10px 20px;background:#0f6d75;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Admin Panelinde Onayla →
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280">Firma aktif edilene kadar sitede görünmeyecektir.</p>
    </div>
  `;
}

export function buildNewFirmaHtml(opts: {
  firmaName: string;
  firmaEmail: string;
}): string {
  const { firmaName, firmaEmail } = opts;
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">CleanLink — Yeni Firma Kaydı 🎉</h2>
      <p>Platforma yeni bir firma üye oldu.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%;border:1px solid #e5e7eb">Firma Adı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaName}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb">E-posta</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb">Kayıt Zamanı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${now}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:13px">Firma henüz pasif. Profili doldurup yayına alma talebi gönderdiğinde yeniden bildirim alacaksınız.</p>
      <p>
        <a href="https://cleanlinktr.com/admin-dashboard" style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Admin Paneline Git →
        </a>
      </p>
    </div>
  `;
}

export function buildPublishRequestHtml(opts: {
  firmaName: string;
  firmaEmail: string;
}): string {
  const { firmaName, firmaEmail } = opts;
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#0f6d75">CleanLink — Firma Yayın Talebi ⏳</h2>
      <p>Bir firma profilini yayına almak için onay talep etti.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;width:40%;border:1px solid #d1fae5">Firma Adı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaName}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;border:1px solid #d1fae5">E-posta</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${firmaEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;border:1px solid #d1fae5">Talep Zamanı</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${now}</td>
        </tr>
      </table>
      <p style="color:#0f6d75;font-weight:600">Admin panelinden "Profil Onayla" butonuna tıklayarak yayına alabilirsiniz.</p>
      <p>
        <a href="https://cleanlinktr.com/admin-dashboard" style="display:inline-block;padding:10px 20px;background:#0f6d75;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Admin Panelinde Onayla →
        </a>
      </p>
    </div>
  `;
}

export function buildApprovalHtml(opts: {
  firmaName:  string;
  paketLabel: string;
  basStr:     string;
  bitisStr:   string;
}): string {
  const { firmaName, paketLabel, basStr, bitisStr } = opts;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">CleanLink — Üyeliğiniz Aktif! 🎉</h2>
      <p>Merhaba <strong>${firmaName}</strong>,</p>
      <p>Havale ödemeniz onaylandı. Üyeliğiniz başarıyla aktif edildi.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0">
        <tr>
          <td style="padding:10px 14px;background:#f5f3ff;font-weight:600;width:40%;border:1px solid #e5e7eb">Paket</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;color:#6d28d9">${paketLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f5f3ff;font-weight:600;border:1px solid #e5e7eb">Başlangıç Tarihi</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb">${basStr}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f5f3ff;font-weight:600;border:1px solid #e5e7eb">Bitiş Tarihi</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb">${bitisStr}</td>
        </tr>
      </table>
      <p>Firma panelinizden tüm özelliklere erişebilirsiniz.</p>
      <p>
        <a href="https://cleanlinktr.com/firma-dashboard" style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Panele Git →
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;margin-top:20px">CleanLink — Türkiye'nin Temizlik Pazaryeri</p>
    </div>
  `;
}
