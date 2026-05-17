import app from "./app";
import { logger } from "./lib/logger";
import { startSubscriptionReminderJob } from "./jobs/subscriptionReminder";
import { db, vendorProfilesTable, usersTable } from "@workspace/db";
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

/* ── Startup: ensure gunkoltukyikama@gmail.com has role="firma" ─────────────
   In production the user was registered as "musteri". Fix it idempotently.  */
async function fixGunTemizlikRole(): Promise<void> {
  try {
    const result = await db
      .update(usersTable)
      .set({ role: "firma" })
      .where(sql`email = 'gunkoltukyikama@gmail.com' AND role != 'firma'`);
    const count = (result as unknown as { rowCount?: number }).rowCount ?? 0;
    if (count > 0) logger.info("Fixed gunkoltukyikama role to firma.");
    else logger.info("gunkoltukyikama role already correct, skipping.");
  } catch (err) {
    logger.error({ err }, "Failed to fix gunkoltukyikama role — continuing.");
  }
}

/* ── Startup: clear wrongly-seeded gallery/cert for Elit Plus+ ──────────────
   Previous startup seed used WHERE id=1 which in production was Elit Plus+.
   Clear any gallery/cert URLs that contain "gun-temizlik" for that vendor.  */
async function fixElitplusWrongGallery(): Promise<void> {
  try {
    const [elitUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "tariktingiroglu37@gmail.com"))
      .limit(1);
    if (!elitUser) return;

    const [elitProfile] = await db
      .select({ id: vendorProfilesTable.id, galleryUrls: vendorProfilesTable.galleryUrls, certUrls: vendorProfilesTable.certUrls })
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, elitUser.id))
      .limit(1);
    if (!elitProfile) return;

    const wrongGallery = (elitProfile.galleryUrls ?? []).some(u => u.includes("gun-temizlik"));
    const wrongCert    = (elitProfile.certUrls    ?? []).some(u => u.includes("gun-temizlik"));

    if (!wrongGallery && !wrongCert) {
      logger.info("Elit Plus+ gallery/cert correct, no fix needed.");
      return;
    }

    await db
      .update(vendorProfilesTable)
      .set({
        galleryUrls: wrongGallery ? [] : elitProfile.galleryUrls,
        certUrls:    wrongCert    ? [] : elitProfile.certUrls,
        updatedAt: new Date(),
      })
      .where(eq(vendorProfilesTable.id, elitProfile.id));

    logger.info({ profileId: elitProfile.id }, "Cleared wrongly-seeded Elit Plus+ gallery/cert.");
  } catch (err) {
    logger.error({ err }, "Failed to fix Elit Plus+ gallery — continuing.");
  }
}

/* ── Startup: seed Gün Temizlik gallery/cert using email lookup ─────────────
   Finds the vendor by user email (not by id) so it works in any environment. */
async function seedGunTemizlikMedia(): Promise<void> {
  try {
    const [gunUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "gunkoltukyikama@gmail.com"))
      .limit(1);
    if (!gunUser) { logger.info("gunkoltukyikama user not found, skipping gallery seed."); return; }

    const [profile] = await db
      .select({ id: vendorProfilesTable.id, galleryUrls: vendorProfilesTable.galleryUrls, certUrls: vendorProfilesTable.certUrls })
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, gunUser.id))
      .limit(1);
    if (!profile) { logger.info("Gün Temizlik vendor profile not found, skipping gallery seed."); return; }

    const galleryEmpty = !profile.galleryUrls || profile.galleryUrls.length === 0;
    const certEmpty    = !profile.certUrls    || profile.certUrls.length    === 0;

    if (!galleryEmpty && !certEmpty) {
      logger.info("Gün Temizlik media already seeded, skipping.");
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
      .where(eq(vendorProfilesTable.id, profile.id));

    logger.info({ profileId: profile.id, galleryCount: galleryUrls.length }, "Gün Temizlik media seeded.");
  } catch (err) {
    logger.error({ err }, "Failed to seed Gün Temizlik media — continuing.");
  }
}

/* ── Startup: ensure mama_birim column exists (migration) ───────────────────
   Added after initial schema creation — safe to run multiple times.          */
async function ensureMamaBirimColumn(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS mama_birim integer NOT NULL DEFAULT 0
    `);
    logger.info("mama_birim column ensured.");
  } catch (err) {
    logger.error({ err }, "Failed to ensure mama_birim column — continuing.");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await ensurePlainPasswordColumn();
  await ensureMamaBirimColumn();
  await fixGunTemizlikRole();
  await fixElitplusWrongGallery();
  await seedGunTemizlikMedia();
  startSubscriptionReminderJob();
});
