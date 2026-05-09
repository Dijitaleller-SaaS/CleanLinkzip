import { db, vendorProfilesTable, usersTable } from "@workspace/db";
import { eq, and, isNotNull } from "drizzle-orm";
import { sendMail } from "../lib/mailer";
import { logger } from "../lib/logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "serkan@dijitaleller.com";

const SUB_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const REMINDER_DAYS = [15, 5];

const APP_BASE_URL =
  process.env.APP_BASE_URL ??
  (process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "https://cleanlinktr.com");

function buildReminderHtml(opts: {
  vendorName: string;
  expiryDate: string;
  daysLeft: number;
  renewalUrl: string;
}): string {
  const { vendorName, expiryDate, daysLeft, renewalUrl } = opts;
  const urgencyColor = daysLeft <= 5 ? "#dc2626" : "#d97706";
  const urgencyLabel =
    daysLeft <= 5
      ? "Son 5 gün — aboneliğiniz çok yakında sona eriyor!"
      : "Aboneliğiniz 15 gün içinde sona eriyor.";

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="color:#6d28d9;font-size:24px;margin:0">CleanLink</h1>
        <p style="color:#6b7280;margin:4px 0 0">Abonelik Hatırlatması</p>
      </div>

      <div style="background:#fef3c7;border-left:4px solid ${urgencyColor};padding:16px;border-radius:4px;margin-bottom:24px">
        <p style="margin:0;color:${urgencyColor};font-weight:600">${urgencyLabel}</p>
      </div>

      <p style="color:#374151">Merhaba <strong>${vendorName}</strong>,</p>

      <p style="color:#374151;line-height:1.6">
        CleanLink aboneliğinizin <strong>${expiryDate}</strong> tarihinde sona ereceğini
        hatırlatmak isteriz. Aboneliğiniz sona erdiğinde profiliniz yayından kalkacak
        ve yeni müşterilerden iş alamayacaksınız.
      </p>

      <p style="color:#374151;line-height:1.6">
        Kesintisiz hizmet sunmaya devam etmek için aboneliğinizi şimdiden yenileyebilirsiniz.
      </p>

      <div style="text-align:center;margin:32px 0">
        <a
          href="${renewalUrl}"
          style="background:#6d28d9;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block"
        >
          Aboneliği Yenile
        </a>
      </div>

      <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
        <tr>
          <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;width:45%;border:1px solid #e5e7eb">Abonelik Bitiş Tarihi</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb">${expiryDate}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb">Kalan Gün</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:${urgencyColor};font-weight:600">${daysLeft} gün</td>
        </tr>
      </table>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin-top:32px">
        Bu e-posta CleanLink tarafından otomatik olarak gönderilmiştir.<br>
        Sorularınız için bize ulaşabilirsiniz.
      </p>
    </div>
  `;
}

async function checkAndSendReminders(): Promise<void> {
  const now = Date.now();

  const rows = await db
    .select({
      profileId:         vendorProfilesTable.id,
      email:             usersTable.email,
      name:              usersTable.name,
      yayinaGirisTarihi: vendorProfilesTable.yayinaGirisTarihi,
    })
    .from(vendorProfilesTable)
    .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
    .where(
      and(
        eq(vendorProfilesTable.isSubscribed, true),
        isNotNull(vendorProfilesTable.yayinaGirisTarihi),
      ),
    );

  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const startMs = row.yayinaGirisTarihi instanceof Date
      ? row.yayinaGirisTarihi.getTime()
      : Number(row.yayinaGirisTarihi);
    const expiryMs = startMs + SUB_DURATION_MS;
    const msUntilExpiry = expiryMs - now;

    if (msUntilExpiry <= 0) {
      skipped++;
      continue;
    }

    const daysUntilExpiry = msUntilExpiry / DAY_MS;

    const matchedDay = REMINDER_DAYS.find(
      (d) => daysUntilExpiry >= d - 0.5 && daysUntilExpiry < d + 0.5,
    );

    if (matchedDay === undefined) {
      continue;
    }

    const expiryDate = new Date(expiryMs).toLocaleDateString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const renewalUrl = `${APP_BASE_URL}/vendor-dashboard`;

    const reminderHtml = buildReminderHtml({ vendorName: row.name, expiryDate, daysLeft: matchedDay, renewalUrl });

    try {
      await sendMail({
        to:      row.email,
        subject: `CleanLink — Aboneliğiniz ${matchedDay} gün içinde sona eriyor`,
        html:    reminderHtml,
      });
      sent++;
      logger.info({ email: row.email, profileId: row.profileId, daysLeft: matchedDay }, "Subscription reminder sent");
    } catch (err) {
      logger.error({ err, email: row.email, profileId: row.profileId }, "Failed to send subscription reminder");
    }

    /* Also notify admin when only 5 days remain */
    if (matchedDay === 5) {
      const adminHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto">
          <h2 style="color:#dc2626">CleanLink — Abonelik Bitiş Uyarısı (5 Gün)</h2>
          <p>Aşağıdaki firmanın aboneliği <strong>5 gün</strong> içinde sona eriyor.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%;border:1px solid #e5e7eb">Firma</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${row.name}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb">E-posta</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${row.email}</td></tr>
            <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb">Bitiş Tarihi</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#dc2626;font-weight:600">${expiryDate}</td></tr>
          </table>
        </div>`;
      sendMail({
        to:      ADMIN_EMAIL,
        subject: `[Admin Uyarı] ${row.name} — abonelik 5 gün içinde bitiyor`,
        html:    adminHtml,
      }).catch(err => logger.warn({ err, profileId: row.profileId }, "Admin 5-day reminder failed"));
    }
  }

  logger.info(
    { total: rows.length, sent, skipped },
    "Subscription reminder job completed",
  );
}

export function startSubscriptionReminderJob(): void {
  const RUN_INTERVAL_MS = DAY_MS;

  logger.info("Subscription reminder job scheduled (runs every 24 hours)");

  checkAndSendReminders().catch((err) => {
    logger.error({ err }, "Subscription reminder job failed on startup run");
  });

  setInterval(() => {
    checkAndSendReminders().catch((err) => {
      logger.error({ err }, "Subscription reminder job failed");
    });
  }, RUN_INTERVAL_MS);
}
