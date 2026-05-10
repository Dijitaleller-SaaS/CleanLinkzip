import { Router } from "express";
import { db, usersTable, vendorProfilesTable, ordersTable, transactionAuditLogTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/authMiddleware";
import { requireAdmin } from "../lib/adminMiddleware";
import { sendMail, buildApprovalHtml } from "../lib/mailer";

const router = Router();

/* All admin routes require auth + admin role */
router.use("/admin", requireAuth, requireAdmin);

/* Shared select shape for admin vendor projection */
const adminVendorSelect = {
  id:                  vendorProfilesTable.id,
  userId:              vendorProfilesTable.userId,
  name:                usersTable.name,
  email:               usersTable.email,
  bio:                 vendorProfilesTable.bio,
  regions:             vendorProfilesTable.regions,
  isSubscribed:        vendorProfilesTable.isSubscribed,
  isSponsor:           vendorProfilesTable.isSponsor,
  isPublished:         vendorProfilesTable.isPublished,
  isAdminHidden:       vendorProfilesTable.isAdminHidden,
  subscriptionPending: vendorProfilesTable.subscriptionPending,
  havaleRefCode:       vendorProfilesTable.havaleRefCode,
  havalePkg:           vendorProfilesTable.havalePkg,
  paket:               vendorProfilesTable.paket,
  yayinaGirisTarihi:   vendorProfilesTable.yayinaGirisTarihi,
  activatedAt:         vendorProfilesTable.activatedAt,
  userCreatedAt:       usersTable.createdAt,
  updatedAt:           vendorProfilesTable.updatedAt,
  city:                vendorProfilesTable.city,
  district:            vendorProfilesTable.district,
  hasPati:             vendorProfilesTable.hasPati,
  isNatureFriendly:    vendorProfilesTable.isNatureFriendly,
} as const;

function toAdminVendor(row: {
  id: number; userId: number; name: string; email: string; bio: string;
  regions: string[]; isSubscribed: boolean; isSponsor: boolean; isPublished: boolean;
  isAdminHidden: boolean; subscriptionPending: boolean; havaleRefCode: string | null;
  havalePkg: string | null; paket: string | null; yayinaGirisTarihi: Date | null;
  activatedAt: Date | null; userCreatedAt: Date; updatedAt: Date;
  city: string; district: string; hasPati: boolean; isNatureFriendly: boolean;
}) {
  return {
    id:                  row.id,
    userId:              row.userId,
    name:                row.name,
    email:               row.email,
    bio:                 row.bio,
    regions:             row.regions,
    isSubscribed:        row.isSubscribed,
    isSponsor:           row.isSponsor,
    isPublished:         row.isPublished,
    isAdminHidden:       row.isAdminHidden,
    subscriptionPending: row.subscriptionPending,
    havaleRefCode:       row.havaleRefCode,
    havalePkg:           row.havalePkg,
    paket:               row.paket,
    yayinaGirisTarihi:   row.yayinaGirisTarihi?.getTime() ?? null,
    activatedAt:         row.activatedAt?.getTime() ?? null,
    joinedAt:            row.userCreatedAt.getTime(),
    updatedAt:           row.updatedAt.getTime(),
    city:                row.city,
    district:            row.district,
    hasPati:             row.hasPati,
    isNatureFriendly:    row.isNatureFriendly,
  };
}

/* Helper: build the full AdminVendor projection (used by list + approve + extend) */
async function getAdminVendorByUserId(userId: number) {
  const [row] = await db
    .select(adminVendorSelect)
    .from(vendorProfilesTable)
    .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
    .where(eq(vendorProfilesTable.userId, userId))
    .limit(1);
  return row ? toAdminVendor(row) : null;
}

async function getAdminVendorById(profileId: number) {
  const [row] = await db
    .select(adminVendorSelect)
    .from(vendorProfilesTable)
    .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
    .where(eq(vendorProfilesTable.id, profileId))
    .limit(1);
  return row ? toAdminVendor(row) : null;
}

/* ── GET /api/admin/vendors — list all vendors with user info ── */
router.get("/admin/vendors", async (_req, res) => {
  try {
    const rows = await db
      .select(adminVendorSelect)
      .from(vendorProfilesTable)
      .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
      .orderBy(usersTable.createdAt);

    res.json({ vendors: rows.map(toAdminVendor) });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* ── GET /api/admin/financial — revenue summary ── */
router.get("/admin/financial", async (_req, res) => {
  try {
    const profiles = await db
      .select({
        isSubscribed:      vendorProfilesTable.isSubscribed,
        isSponsor:         vendorProfilesTable.isSponsor,
        subscriptionPending: vendorProfilesTable.subscriptionPending,
        yayinaGirisTarihi: vendorProfilesTable.yayinaGirisTarihi,
      })
      .from(vendorProfilesTable);

    const SUB_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let standart = 0;
    let elite = 0;
    let pending = 0;
    let expired = 0;

    for (const p of profiles) {
      const isExpired = p.yayinaGirisTarihi
        ? now - (p.yayinaGirisTarihi instanceof Date ? p.yayinaGirisTarihi.getTime() : Number(p.yayinaGirisTarihi)) > SUB_DURATION_MS
        : false;

      if (p.isSponsor && !isExpired) elite++;
      else if (p.isSubscribed && !p.isSponsor && !isExpired) standart++;
      else if (p.subscriptionPending && !p.isSubscribed) pending++;
      else if (isExpired) expired++;
    }

    const standartRevenue = standart * 999;
    const eliteRevenue = elite * 5000;
    const totalRevenue = standartRevenue + eliteRevenue;
    const reklamHavuzu = Math.round(totalRevenue * 0.6);

    res.json({
      standart,
      elite,
      pending,
      expired,
      standartRevenue,
      eliteRevenue,
      totalRevenue,
      reklamHavuzu,
    });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* ── PATCH /api/admin/vendors/by-name/:name/approve — approve by user name ── */
router.patch("/admin/vendors/by-name/:name/approve", async (req, res) => {
  const name = String(req.params.name);
  try {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.name, name))
      .limit(1);
    if (!user) { res.status(404).json({ error: "Kullanıcı bulunamadı" }); return; }

    const [profile] = await db
      .select()
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, user.id))
      .limit(1);
    if (!profile) { res.status(404).json({ error: "Firma profili bulunamadı" }); return; }

    const paket = (profile.havalePkg ?? "standart") as "standart" | "elite";
    const now = new Date();
    await db
      .update(vendorProfilesTable)
      .set({
        isSubscribed:        true,
        subscriptionPending: false,
        isSponsor:           paket === "elite",
        paket,
        yayinaGirisTarihi:   now,
        activatedAt:         now,
        isPublished:         true,
        updatedAt:           now,
      })
      .where(eq(vendorProfilesTable.userId, user.id));

    const vendor = await getAdminVendorByUserId(user.id);
    if (!vendor) { res.status(404).json({ error: "Firma profili bulunamadı" }); return; }

    /* Notify vendor by email — best-effort */
    const paketLabel = paket === "elite" ? "Elite (5.000 TL/Ay)" : "Standart (999 TL/Ay)";
    const bitisStr = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR");
    const basStr   = now.toLocaleDateString("tr-TR");
    sendMail({
      to:      vendor.email,
      subject: `CleanLink — ${paketLabel} üyeliğiniz aktif!`,
      html:    buildApprovalHtml({ firmaName: vendor.name, paketLabel, basStr, bitisStr }),
    }).catch(() => {});

    res.json({ vendor });
  } catch {
    res.status(500).json({ error: "Onaylama sırasında hata oluştu" });
  }
});

/* ── PATCH /api/admin/vendors/by-name/:name/extend — extend by user name ── */
router.patch("/admin/vendors/by-name/:name/extend", async (req, res) => {
  const name = String(req.params.name);
  try {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.name, name))
      .limit(1);
    if (!user) { res.status(404).json({ error: "Kullanıcı bulunamadı" }); return; }

    const [profile] = await db
      .select()
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, user.id))
      .limit(1);
    if (!profile) { res.status(404).json({ error: "Firma profili bulunamadı" }); return; }

    const paket = (profile.paket ?? profile.havalePkg ?? "standart") as "standart" | "elite";
    await db
      .update(vendorProfilesTable)
      .set({
        isSubscribed:      true,
        isSponsor:         paket === "elite",
        paket,
        yayinaGirisTarihi: new Date(),
        updatedAt:         new Date(),
      })
      .where(eq(vendorProfilesTable.userId, user.id));

    const vendor = await getAdminVendorByUserId(user.id);
    if (!vendor) { res.status(404).json({ error: "Firma profili bulunamadı" }); return; }
    res.json({ vendor });
  } catch {
    res.status(500).json({ error: "Süre uzatma sırasında hata oluştu" });
  }
});

/* ── PATCH /api/admin/vendors/:id/approve — approve havale payment OR pilot publish request ── */
router.patch("/admin/vendors/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  try {
    const [profile] = await db
      .select()
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.id, id))
      .limit(1);

    if (!profile) { res.status(404).json({ error: "Firma bulunamadı" }); return; }

    const now = new Date();

    /* Pilot onayı: havalePkg yoksa sadece yayına al, abonelik verme */
    const isPilotApproval = !profile.havalePkg && !profile.isSubscribed && !profile.isSponsor;

    if (isPilotApproval) {
      await db
        .update(vendorProfilesTable)
        .set({
          subscriptionPending: false,
          isPublished:         true,
          updatedAt:           now,
        })
        .where(eq(vendorProfilesTable.id, id));
    } else {
      const paket = (profile.havalePkg ?? "standart") as "standart" | "elite";
      await db
        .update(vendorProfilesTable)
        .set({
          isSubscribed:        true,
          subscriptionPending: false,
          isSponsor:           paket === "elite",
          paket,
          yayinaGirisTarihi:   now,
          activatedAt:         now,
          isPublished:         true,
          updatedAt:           now,
        })
        .where(eq(vendorProfilesTable.id, id));
    }

    const vendor = await getAdminVendorById(id);
    if (!vendor) { res.status(404).json({ error: "Firma bulunamadı" }); return; }

    /* Firma'ya e-posta bildirimi */
    if (isPilotApproval) {
      sendMail({
        to:      vendor.email,
        subject: "CleanLink — Profiliniz Yayında!",
        html:    `<div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#0f6d75">Profiliniz Yayında! 🎉</h2>
          <p>Merhaba <strong>${vendor.name}</strong>,</p>
          <p>Profiliniz onaylandı ve artık CleanLink'te yayında. Müşteriler artık sizi görebilir!</p>
          <p><a href="https://cleanlinktr.com/firma-dashboard" style="display:inline-block;padding:10px 20px;background:#0f6d75;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Panele Git →</a></p>
        </div>`,
      }).catch(() => {});
    } else {
      const paket = (profile.havalePkg ?? "standart") as "standart" | "elite";
      const paketLabelId = paket === "elite" ? "Elite (5.000 TL/Ay)" : "Standart (999 TL/Ay)";
      const bitisStrId = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR");
      const basStrId   = now.toLocaleDateString("tr-TR");
      sendMail({
        to:      vendor.email,
        subject: `CleanLink — ${paketLabelId} üyeliğiniz aktif!`,
        html:    buildApprovalHtml({ firmaName: vendor.name, paketLabel: paketLabelId, basStr: basStrId, bitisStr: bitisStrId }),
      }).catch(() => {});
    }

    res.json({ vendor });
  } catch {
    res.status(500).json({ error: "Onaylama sırasında hata oluştu" });
  }
});

/* ── PATCH /api/admin/vendors/:id/extend — extend subscription +30 days ── */
router.patch("/admin/vendors/:id/extend", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  try {
    const [profile] = await db
      .select()
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.id, id))
      .limit(1);

    if (!profile) { res.status(404).json({ error: "Firma bulunamadı" }); return; }

    const paket = (profile.paket ?? profile.havalePkg ?? "standart") as "standart" | "elite";

    await db
      .update(vendorProfilesTable)
      .set({
        isSubscribed:      true,
        isSponsor:         paket === "elite",
        paket,
        yayinaGirisTarihi: new Date(),
        updatedAt:         new Date(),
      })
      .where(eq(vendorProfilesTable.id, id));

    const vendor = await getAdminVendorById(id);
    if (!vendor) { res.status(404).json({ error: "Firma bulunamadı" }); return; }
    res.json({ vendor });
  } catch {
    res.status(500).json({ error: "Süre uzatma sırasında hata oluştu" });
  }
});

/* ── PATCH /api/admin/vendors/:id/set-package — granular CRM/Elite toggle (test paneli) ── */
router.patch("/admin/vendors/:id/set-package", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  const { isSubscribed, isSponsor } = req.body as { isSubscribed?: boolean; isSponsor?: boolean };
  try {
    const now = new Date();
    const update: Record<string, unknown> = { updatedAt: now };

    if (isSponsor === true) {
      update.isSponsor          = true;
      update.isSubscribed       = true;
      update.isPublished        = true;
      update.paket              = "elite";
      update.yayinaGirisTarihi  = now;
      update.activatedAt        = now;
      update.subscriptionPending = false;
    } else if (isSponsor === false) {
      update.isSponsor = false;
      update.paket     = "standart";
    }
    if (isSubscribed === true && isSponsor !== true) {
      update.isSubscribed       = true;
      update.isSponsor          = false;
      update.isPublished        = true;
      update.paket              = "standart";
      update.yayinaGirisTarihi  = now;
      update.activatedAt        = now;
      update.subscriptionPending = false;
    } else if (isSubscribed === false) {
      update.isSubscribed = false;
      update.isSponsor    = false;
      update.paket        = null;
    }

    await db
      .update(vendorProfilesTable)
      .set(update)
      .where(eq(vendorProfilesTable.id, id));

    const vendor = await getAdminVendorById(id);
    if (!vendor) { res.status(404).json({ error: "Firma bulunamadı" }); return; }
    res.json({ vendor });
  } catch {
    res.status(500).json({ error: "Paket güncelleme sırasında hata oluştu" });
  }
});

/* ── PATCH /api/admin/vendors/by-name/:name/visibility — toggle by name ── */
router.patch("/admin/vendors/by-name/:name/visibility", async (req, res) => {
  const name = String(req.params.name);
  const { hidden } = req.body as { hidden: boolean };
  try {
    const user = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.name, name))
      .limit(1);
    if (!user[0]) { res.status(404).json({ error: "Kullanıcı bulunamadı" }); return; }

    const [updated] = await db
      .update(vendorProfilesTable)
      .set({ isAdminHidden: hidden, updatedAt: new Date() })
      .where(eq(vendorProfilesTable.userId, user[0].id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Firma profili bulunamadı" }); return; }
    res.json({ vendor: updated });
  } catch {
    res.status(500).json({ error: "Görünürlük güncellenirken hata oluştu" });
  }
});

/* ── PATCH /api/admin/vendors/:id/visibility — toggle admin hidden ── */
router.patch("/admin/vendors/:id/visibility", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { hidden } = req.body as { hidden: boolean };
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  try {
    const [updated] = await db
      .update(vendorProfilesTable)
      .set({ isAdminHidden: hidden, updatedAt: new Date() })
      .where(eq(vendorProfilesTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Firma bulunamadı" }); return; }
    res.json({ vendor: updated });
  } catch {
    res.status(500).json({ error: "Görünürlük güncellenirken hata oluştu" });
  }
});

/* ── DELETE /api/admin/vendors/:id/subscription — remove sponsor/CRM membership ── */
router.delete("/admin/vendors/:id/subscription", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  try {
    const [updated] = await db
      .update(vendorProfilesTable)
      .set({
        isSubscribed:        false,
        isSponsor:           false,
        subscriptionPending: false,
        havaleRefCode:       null,
        havalePkg:           null,
        paket:               null,
        yayinaGirisTarihi:   null,
        updatedAt:           new Date(),
      })
      .where(eq(vendorProfilesTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Firma bulunamadı" }); return; }
    res.json({ vendor: updated });
  } catch {
    res.status(500).json({ error: "Üyelik kaldırılırken hata oluştu" });
  }
});

/* ── GET /api/admin/notifications — new firms + pending + expired ── */
router.get("/admin/notifications", async (_req, res) => {
  try {
    const profiles = await db
      .select({
        id:                  vendorProfilesTable.id,
        name:                usersTable.name,
        isSubscribed:        vendorProfilesTable.isSubscribed,
        isSponsor:           vendorProfilesTable.isSponsor,
        subscriptionPending: vendorProfilesTable.subscriptionPending,
        yayinaGirisTarihi:   vendorProfilesTable.yayinaGirisTarihi,
        joinedAt:            usersTable.createdAt,
      })
      .from(vendorProfilesTable)
      .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id));

    const SUB_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const newFirms = profiles.filter(p => now - p.joinedAt.getTime() < DAY_MS);
    const pendingFirms = profiles.filter(p => p.subscriptionPending && !p.isSubscribed);
    const expiredFirms = profiles.filter(p => {
      if (!p.yayinaGirisTarihi) return false;
      const startMs = p.yayinaGirisTarihi instanceof Date ? p.yayinaGirisTarihi.getTime() : Number(p.yayinaGirisTarihi);
      const expired = now - startMs > SUB_DURATION_MS;
      return expired && !p.isSponsor && !p.subscriptionPending;
    });

    res.json({
      newFirms: newFirms.map(p => ({ id: p.id, name: p.name, joinedAt: p.joinedAt })),
      pendingFirms: pendingFirms.map(p => ({ id: p.id, name: p.name, joinedAt: p.joinedAt })),
      expiredFirms: expiredFirms.map(p => ({ id: p.id, name: p.name, joinedAt: p.joinedAt })),
    });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* ── GET /api/admin/orders — all orders with vendor info (admin only) ── */
router.get("/admin/orders", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id:                ordersTable.id,
        customerName:      ordersTable.customerName,
        customerPhone:     ordersTable.customerPhone,
        vendorName:        ordersTable.vendorName,
        service:           ordersTable.service,
        total:             ordersTable.total,
        status:            ordersTable.status,
        ilce:              ordersTable.ilce,
        mahalle:           ordersTable.mahalle,
        adres:             ordersTable.adres,
        requestedDate:     ordersTable.requestedDate,
        requestedTimeSlot: ordersTable.requestedTimeSlot,
        ecoOption:         ordersTable.ecoOption,
        unlockedAt:        ordersTable.unlockedAt,
        createdAt:         ordersTable.createdAt,
      })
      .from(ordersTable)
      .orderBy(ordersTable.createdAt);
    res.json({ orders: rows });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* ── GET /api/admin/transaction-audit-log — Güvenlik Kanıtı ── */
router.get("/admin/transaction-audit-log", async (_req, res) => {
  try {
    const logs = await db
      .select({
        id:              transactionAuditLogTable.id,
        transactionId:   transactionAuditLogTable.transactionId,
        userId:          transactionAuditLogTable.userId,
        ipAddress:       transactionAuditLogTable.ipAddress,
        actionType:      transactionAuditLogTable.actionType,
        documentVersion: transactionAuditLogTable.documentVersion,
        meta:            transactionAuditLogTable.meta,
        timestamp:       transactionAuditLogTable.timestamp,
      })
      .from(transactionAuditLogTable)
      .orderBy(desc(transactionAuditLogTable.timestamp))
      .limit(500);
    res.json({ logs });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* ── PATCH /api/admin/orders/:id/status — update order status ── */
router.patch("/admin/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };
  const VALID = ["beklemede", "onaylandi", "tamamlandi", "iptal"];
  if (!VALID.includes(status)) {
    res.status(400).json({ error: "Geçersiz durum" }); return;
  }
  try {
    const [updated] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Sipariş bulunamadı" }); return; }
    res.json({ order: updated });
  } catch {
    res.status(500).json({ error: "Durum güncellenirken hata oluştu" });
  }
});

export default router;
