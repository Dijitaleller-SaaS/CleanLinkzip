import { Router } from "express";
import { db, ordersTable, vendorProfilesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, gte, isNotNull, sql } from "drizzle-orm";

async function notify(userId: number, type: string, title: string, body: string, link = "") {
  try { await db.insert(notificationsTable).values({ userId, type, title, body, link }); } catch { /* swallow */ }
}
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";
import { redeemCoupon, COUPON_ERRORS } from "./coupons";

const router = Router();

/* Free-tier monthly unlock quota */
const FREE_MONTHLY_QUOTA = 1;

/* Return start of current calendar month (UTC) */
function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/* Mask sensitive contact fields for free-tier vendors */
function maskOrder(row: typeof ordersTable.$inferSelect, isUnlocked: boolean) {
  return {
    ...row,
    customerPhone: isUnlocked ? row.customerPhone : "",
    adres:         isUnlocked ? row.adres         : "",
    ilce:          isUnlocked ? row.ilce          : "",
    mahalle:       isUnlocked ? row.mahalle       : "",
    isContactUnlocked: isUnlocked,
  };
}

/* GET /api/orders — orders for current user */
router.get("/orders", requireAuth, async (req: AuthRequest, res) => {
  const { role, userId } = req.jwtUser!;
  try {
    if (role === "firma") {
      /* Fetch vendor profile to determine subscription status */
      const [profile] = await db
        .select({
          isSubscribed: vendorProfilesTable.isSubscribed,
          isSponsor:    vendorProfilesTable.isSponsor,
        })
        .from(vendorProfilesTable)
        .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
        .where(eq(usersTable.id, userId))
        .limit(1);

      const isPaid = profile ? (profile.isSubscribed || profile.isSponsor) : false;

      /* Strict ID-based ownership */
      const rows = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.vendorId, userId))
        .orderBy(ordersTable.createdAt);

      /* For paid vendors, all contact info visible; for free vendors mask selectively */
      const orders = rows.map(row => {
        if (isPaid) return { ...row, isContactUnlocked: true };
        const isUnlocked = row.unlockedAt !== null;
        return maskOrder(row, isUnlocked);
      });

      /* Monthly unlock quota for free vendors */
      const monthStart = startOfMonth();
      const unlockedThisMonth = isPaid ? 0 : rows.filter(
        r => r.unlockedAt !== null && r.unlockedAt >= monthStart
      ).length;

      res.json({
        orders,
        isPaid,
        quotaUsed:  isPaid ? null : unlockedThisMonth,
        quotaTotal: isPaid ? null : FREE_MONTHLY_QUOTA,
      });
    } else {
      /* Strict ID-based ownership */
      const rows = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.customerId, userId))
        .orderBy(ordersTable.createdAt);
      res.json({ orders: rows.map(r => ({ ...r, isContactUnlocked: true })), isPaid: null, quotaUsed: null, quotaTotal: null });
    }
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* POST /api/orders/:id/unlock — free vendor unlocks contact info for one order */
router.post("/orders/:id/unlock", requireAuth, async (req: AuthRequest, res) => {
  const { role, userId } = req.jwtUser!;
  if (role !== "firma") { res.status(403).json({ error: "Yalnızca firma hesapları için" }); return; }

  const orderId = String(req.params.id);

  try {
    /* Strict ID-based ownership check */
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.vendorId, userId)))
      .limit(1);

    if (!order) { res.status(404).json({ error: "Sipariş bulunamadı" }); return; }
    if (order.unlockedAt !== null) {
      res.json({ order: { ...order, isContactUnlocked: true } });
      return;
    }

    /* Check subscription */
    const [profile] = await db
      .select({ isSubscribed: vendorProfilesTable.isSubscribed, isSponsor: vendorProfilesTable.isSponsor })
      .from(vendorProfilesTable)
      .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
      .where(eq(usersTable.id, userId))
      .limit(1);

    const isPaid = profile ? (profile.isSubscribed || profile.isSponsor) : false;

    if (!isPaid) {
      /* Check monthly quota — strict ID-based */
      const monthStart = startOfMonth();
      const [row] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(ordersTable)
        .where(
          and(
            eq(ordersTable.vendorId, userId),
            isNotNull(ordersTable.unlockedAt),
            gte(ordersTable.unlockedAt, monthStart),
          )
        );

      if ((row?.c ?? 0) >= FREE_MONTHLY_QUOTA) {
        res.status(429).json({
          error: `Ücretsiz planda aylık ${FREE_MONTHLY_QUOTA} sipariş iletişim bilgisi görüntüleyebilirsiniz. Kotanız doldu.`,
          quotaExceeded: true,
        });
        return;
      }
    }

    /* Unlock the order — atomic guard: only update if still locked */
    const [updated] = await db
      .update(ordersTable)
      .set({ unlockedAt: new Date() })
      .where(and(eq(ordersTable.id, orderId), sql`${ordersTable.unlockedAt} IS NULL`))
      .returning();

    if (!updated) {
      /* Race: another request unlocked it; fetch fresh row */
      const [fresh] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
      res.json({ order: { ...fresh, isContactUnlocked: true } });
      return;
    }

    res.json({ order: { ...updated, isContactUnlocked: true } });
  } catch {
    res.status(500).json({ error: "Kilit açılırken hata oluştu" });
  }
});

/* POST /api/orders — create a new order */
router.post("/orders", requireAuth, async (req: AuthRequest, res) => {
  const { name, role, userId } = req.jwtUser!;

  /* Only customers can place orders */
  if (role !== "musteri") {
    res.status(403).json({ error: "Yalnızca müşteri hesapları sipariş oluşturabilir" });
    return;
  }

  const body = req.body;

  if (!body.vendorId || !body.service || body.total === undefined) {
    res.status(400).json({ error: "Eksik sipariş bilgisi" });
    return;
  }

  const vendorIdNum = parseInt(String(body.vendorId), 10);
  if (!Number.isInteger(vendorIdNum) || vendorIdNum <= 0) {
    res.status(400).json({ error: "Geçersiz firma kimliği" });
    return;
  }

  /* Verify vendor exists and is published by immutable user ID */
  const [vendorUser] = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .innerJoin(vendorProfilesTable, eq(vendorProfilesTable.userId, usersTable.id))
    .where(
      and(
        eq(usersTable.id, vendorIdNum),
        eq(usersTable.role, "firma"),
        eq(vendorProfilesTable.isPublished, true),
      )
    )
    .limit(1);

  if (!vendorUser) {
    res.status(400).json({ error: "Geçerli bir firma bulunamadı" });
    return;
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  /*
   * Wrap coupon redemption + order INSERT in a single DB transaction.
   * redeemCoupon() performs a conditional UPDATE (used_count < max_uses)
   * using the same transaction object, so:
   *   - concurrent requests cannot both claim the last coupon use, and
   *   - if the INSERT fails the usage increment is rolled back automatically.
   * Only known coupon-domain errors (invalid code, expired, limit reached,
   * etc.) are silenced; unexpected DB faults propagate and return 500.
   */
  try {
    const order = await db.transaction(async (tx) => {
      let couponCode = "";
      let discountAmount = 0;

      if (typeof body.couponCode === "string" && body.couponCode.trim()) {
        try {
          const v = await redeemCoupon(body.couponCode.trim(), body.total, tx);
          couponCode = v.code;
          discountAmount = v.discountAmount;
        } catch (err) {
          /* Swallow only expected coupon-domain errors; re-throw anything else */
          if (!(err instanceof Error && COUPON_ERRORS.has(err.message))) throw err;
        }
      }

      const [inserted] = await tx
        .insert(ordersTable)
        .values({
          id: orderId,
          customerId: userId,
          vendorId: vendorUser.id,
          customerName: name,
          customerPhone: body.customerPhone ?? "",
          vendorName: vendorUser.name,
          service: body.service,
          total: Math.max(0, body.total - discountAmount),
          status: "beklemede",
          ilce: body.ilce ?? "",
          mahalle: body.mahalle ?? "",
          adres: body.adres ?? "",
          requestedDate: body.requestedDate ?? "",
          requestedTimeSlot: body.requestedTimeSlot ?? "",
          visitTime: "",
          ecoOption: body.ecoOption ?? false,
          treesPlanted: 0,
          musteriYeniSaatIstedi: false,
          couponCode,
          discountAmount,
        })
        .returning();

      return inserted;
    });

    /* Notify vendor of new order (outside transaction — non-critical) */
    await notify(vendorUser.id, "new_order", "Yeni Sipariş",
      `${name} - ${body.service}`, "/firma-dashboard");

    res.status(201).json({ order: { ...order, isContactUnlocked: false } });
  } catch {
    res.status(500).json({ error: "Sipariş oluşturulurken hata oluştu" });
  }
});

/* All valid order statuses */
const ALL_VALID_STATUSES = new Set([
  "beklemede", "onayBekliyor", "onaylandi", "kesinlesti",
  "tamamlandi", "iptal", "reddedildi", "zamanAsimi",
]);

/*
 * Statuses that represent service completion or acceptance — only vendors
 * may set these. Blocking customers from setting these closes the fabricated
 * order → review attack: a customer cannot mark their own order complete.
 */
const VENDOR_ONLY_STATUSES = new Set(["tamamlandi", "onaylandi"]);

/* PATCH /api/orders/:id/status — update order status (owner only) */
router.patch("/orders/:id/status", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role, userId } = req.jwtUser!;
  const { status, visitTime, proposedAt, musteriYeniSaatIstedi } = req.body;

  try {
    const [existing] = await db
      .select({
        customerId: ordersTable.customerId,
        vendorId:   ordersTable.vendorId,
        customerName: ordersTable.customerName,
        vendorName:   ordersTable.vendorName,
      })
      .from(ordersTable)
      .where(eq(ordersTable.id, String(id)))
      .limit(1);

    if (!existing) { res.status(404).json({ error: "Sipariş bulunamadı" }); return; }

    /* Strict ID-based authorization */
    const isVendor   = role === "firma"   && existing.vendorId   === userId;
    const isCustomer = role === "musteri" && existing.customerId === userId;

    if (!isVendor && !isCustomer) {
      res.status(403).json({ error: "Bu siparişi güncelleme yetkiniz yok" });
      return;
    }

    const update: Record<string, unknown> = {};
    if (isVendor) {
      /* Vendors may update any valid status and all scheduling fields */
      if (status !== undefined) {
        if (!ALL_VALID_STATUSES.has(status)) {
          res.status(400).json({ error: "Geçersiz durum değeri" });
          return;
        }
        update.status = status;
      }
      if (visitTime !== undefined)             update.visitTime             = visitTime;
      if (proposedAt !== undefined)            update.proposedAt            = proposedAt === null ? null : new Date(proposedAt);
      if (musteriYeniSaatIstedi !== undefined) update.musteriYeniSaatIstedi = musteriYeniSaatIstedi;
    } else {
      /*
       * Customers may update scheduling flags and any non-privileged status.
       * VENDOR_ONLY_STATUSES ("tamamlandi", "onaylandi") are blocked so a
       * customer cannot self-approve a fabricated order to unlock reviews.
       */
      if (musteriYeniSaatIstedi !== undefined) update.musteriYeniSaatIstedi = musteriYeniSaatIstedi;
      if (status !== undefined) {
        if (!ALL_VALID_STATUSES.has(status) || VENDOR_ONLY_STATUSES.has(status)) {
          res.status(400).json({ error: "Geçersiz durum değeri" });
          return;
        }
        update.status = status;
      }
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "Güncellenecek alan yok" });
      return;
    }

    const [updated] = await db
      .update(ordersTable)
      .set(update)
      .where(eq(ordersTable.id, String(id)))
      .returning();

    /* Notify the customer when vendor changes status */
    if (status !== undefined && isVendor && existing.customerId !== null) {
      const labels: Record<string, string> = {
        onaylandi: "onaylandı", iptal: "iptal edildi",
        tamamlandi: "tamamlandı", beklemede: "beklemede",
      };
      await notify(existing.customerId, "order_status",
        `Sipariş ${labels[status] ?? status}`,
        `${updated.service} siparişiniz ${labels[status] ?? status}.`,
        "/");
    }

    res.json({ order: { ...updated, isContactUnlocked: updated.unlockedAt !== null } });
  } catch {
    res.status(500).json({ error: "Sipariş güncellenirken hata oluştu" });
  }
});

export default router;
