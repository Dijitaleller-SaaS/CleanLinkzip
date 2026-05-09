import { Router } from "express";
import { db, reviewsTable, ordersTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";

const router = Router();

/* GET /api/reviews — list approved reviews for a vendor.
 * Accepts ?vendorId=N (preferred, ID-based) or ?vendor=NAME (legacy fallback) */
router.get("/reviews", async (req, res) => {
  try {
    let rows;
    const vendorIdParam = req.query["vendorId"];
    if (vendorIdParam !== undefined) {
      const vendorId = parseInt(String(vendorIdParam), 10);
      if (!Number.isInteger(vendorId) || vendorId <= 0) {
        res.status(400).json({ error: "Geçersiz vendorId" });
        return;
      }
      rows = await db
        .select()
        .from(reviewsTable)
        .where(and(eq(reviewsTable.vendorId, vendorId), eq(reviewsTable.isApproved, true)))
        .orderBy(desc(reviewsTable.createdAt));
    } else {
      const vendor = String(req.query["vendor"] ?? "").trim();
      if (!vendor) { res.status(400).json({ error: "vendor parametresi gerekli" }); return; }
      rows = await db
        .select()
        .from(reviewsTable)
        .where(and(eq(reviewsTable.vendorName, vendor), eq(reviewsTable.isApproved, true)))
        .orderBy(desc(reviewsTable.createdAt));
    }
    const avg = rows.length === 0 ? 0 : rows.reduce((s, r) => s + r.puan, 0) / rows.length;
    res.json({
      reviews: rows,
      stats: { count: rows.length, average: Math.round(avg * 10) / 10 },
    });
  } catch {
    res.status(500).json({ error: "Yorumlar getirilemedi" });
  }
});

/* GET /api/reviews/stats?vendors=A,B,C — bulk averages for cards */
router.get("/reviews/stats", async (req, res) => {
  const list = String(req.query["vendors"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (list.length === 0) { res.json({ stats: {} }); return; }
  try {
    const rows = await db.select().from(reviewsTable).where(eq(reviewsTable.isApproved, true));
    const out: Record<string, { count: number; average: number }> = {};
    for (const v of list) out[v] = { count: 0, average: 0 };
    const buckets: Record<string, number[]> = {};
    for (const r of rows) {
      if (!list.includes(r.vendorName)) continue;
      (buckets[r.vendorName] ??= []).push(r.puan);
    }
    for (const [v, arr] of Object.entries(buckets)) {
      const avg = arr.reduce((s, n) => s + n, 0) / arr.length;
      out[v] = { count: arr.length, average: Math.round(avg * 10) / 10 };
    }
    res.json({ stats: out });
  } catch {
    res.status(500).json({ error: "İstatistikler getirilemedi" });
  }
});

/* POST /api/reviews — submit (musteri only, must have a vendor-confirmed completed order) */
router.post("/reviews", requireAuth, async (req: AuthRequest, res) => {
  const { userId, name, role } = req.jwtUser!;
  if (role !== "musteri") { res.status(403).json({ error: "Yalnızca müşteriler yorum yapabilir" }); return; }

  const vendorIdParam = req.body?.vendorId;
  const puan = Number(req.body?.puan);
  const yorum = String(req.body?.yorum ?? "").trim();
  const hasPhoto = Boolean(req.body?.hasPhoto);
  const orderId = req.body?.orderId ? String(req.body.orderId) : null;

  if (!vendorIdParam) { res.status(400).json({ error: "vendorId gerekli" }); return; }
  const vendorIdNum = parseInt(String(vendorIdParam), 10);
  if (!Number.isInteger(vendorIdNum) || vendorIdNum <= 0) {
    res.status(400).json({ error: "Geçersiz firma kimliği" });
    return;
  }
  if (!Number.isInteger(puan) || puan < 1 || puan > 5) { res.status(400).json({ error: "Puan 1-5 arasında olmalı" }); return; }
  if (yorum.length < 10) { res.status(400).json({ error: "Yorum en az 10 karakter olmalı" }); return; }

  try {
    /* Resolve vendor by immutable ID */
    const [vendorUser] = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(and(eq(usersTable.id, vendorIdNum), eq(usersTable.role, "firma")))
      .limit(1);

    if (!vendorUser) {
      res.status(400).json({ error: "Firma bulunamadı" });
      return;
    }

    /*
     * Ensure the caller has a completed order with this specific vendor,
     * verified entirely by immutable IDs. Only vendor-driven status
     * transitions can produce "tamamlandi", so this cannot be fabricated
     * by a customer alone.
     */
    const [completed] = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(
        eq(ordersTable.customerId, userId),
        eq(ordersTable.vendorId, vendorUser.id),
        eq(ordersTable.status, "tamamlandi"),
      ))
      .limit(1);

    if (!completed) {
      res.status(403).json({ error: "Bu firmadan tamamlanmış bir siparişiniz yok" });
      return;
    }

    /* One review per (customer, vendor) */
    const [existing] = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.vendorId, vendorUser.id), eq(reviewsTable.customerId, userId)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "Bu firma için zaten yorum yapmışsınız" });
      return;
    }

    /* Reviews require admin moderation before appearing publicly */
    const [review] = await db
      .insert(reviewsTable)
      .values({
        vendorId: vendorUser.id,
        vendorName: vendorUser.name,
        customerId: userId,
        customerName: name,
        orderId,
        puan,
        yorum,
        hasPhoto,
        isApproved: false,
      })
      .returning();

    /* Notify vendor */
    await db.insert(notificationsTable).values({
      userId: vendorUser.id,
      type: "review",
      title: "Yeni Yorum",
      body: `${name} ${puan} yıldız puan verdi.`,
      link: "/firma-dashboard",
    });

    res.status(201).json({ review });
  } catch {
    res.status(500).json({ error: "Yorum kaydedilemedi" });
  }
});

export default router;
