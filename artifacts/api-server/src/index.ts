import app from "./app";
import { logger } from "./lib/logger";
import { startSubscriptionReminderJob } from "./jobs/subscriptionReminder";
import { db, vendorProfilesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* ── Startup: ensure plain_password column exists (migration) ──────────────
   Added after initial schema creation — safe to run multiple times.         */
async function ensurePlainPasswordColumn(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password TEXT
    `);
    logger.info("plain_password column ensured.");
  } catch (err) {
    logger.error({ err }, "Failed to ensure plain_password column — continuing.");
  }
}

/* ── Startup: seed vendor #1 gallery/cert URLs if empty ────────────────────
   Gün Temizlik Hizmetleri (vendor_profiles.id = 1) stores its gallery image
   and certificate PDF as static files under /firmalar/gun-temizlik/.
   In production the DB may be empty if the row was created before the files
   were added.  This idempotent seed runs once at startup and only writes if
   both arrays are currently empty.                                           */
async function seedVendorOneMedia(): Promise<void> {
  try {
    const [profile] = await db
      .select({ id: vendorProfilesTable.id, galleryUrls: vendorProfilesTable.galleryUrls, certUrls: vendorProfilesTable.certUrls })
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.id, 1))
      .limit(1);

    if (!profile) return;

    const galleryEmpty = !profile.galleryUrls || profile.galleryUrls.length === 0;
    const certEmpty    = !profile.certUrls    || profile.certUrls.length    === 0;

    if (!galleryEmpty && !certEmpty) {
      logger.info("Vendor #1 media already seeded, skipping.");
      return;
    }

    const galleryUrls = galleryEmpty
      ? ["/firmalar/gun-temizlik/galeri-1.jpg"]
      : profile.galleryUrls;

    const certUrls = certEmpty
      ? [JSON.stringify({ name: "GÜN HALI YIKAMA & TEMİZLİK .pdf", fileType: "pdf", url: "/firmalar/gun-temizlik/gun-hali-yikama-temizlik.pdf" })]
      : profile.certUrls;

    await db
      .update(vendorProfilesTable)
      .set({ galleryUrls, certUrls, updatedAt: new Date() })
      .where(eq(vendorProfilesTable.id, 1));

    logger.info({ galleryCount: galleryUrls.length, certCount: certUrls.length }, "Vendor #1 media seeded.");
  } catch (err) {
    logger.error({ err }, "Failed to seed vendor #1 media — continuing startup.");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await ensurePlainPasswordColumn();
  await seedVendorOneMedia();
  startSubscriptionReminderJob();
});
