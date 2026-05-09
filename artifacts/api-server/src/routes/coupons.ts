import { Router } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/authMiddleware";
import { requireAdmin } from "../lib/adminMiddleware";
import { logAudit } from "../lib/auditLog";

const router = Router();

/* ── POST /api/coupons/validate — herkes (login gerek yok) ── */
router.post("/coupons/validate", async (req, res) => {
  const { code, orderTotal } = req.body as { code?: string; orderTotal?: number };
  if (!code || typeof orderTotal !== "number") {
    res.status(400).json({ error: "code ve orderTotal zorunludur" });
    return;
  }
  const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.trim().toUpperCase())).limit(1);
  if (!c || !c.isActive) {
    res.status(404).json({ error: "Geçersiz kupon kodu" });
    return;
  }
  const now = new Date();
  if (c.validFrom && c.validFrom > now) { res.status(400).json({ error: "Bu kupon henüz aktif değil" }); return; }
  if (c.validUntil && c.validUntil < now) { res.status(400).json({ error: "Bu kuponun süresi dolmuş" }); return; }
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) { res.status(400).json({ error: "Kupon kullanım limiti dolmuş" }); return; }
  if (orderTotal < c.minOrderTotal) {
    res.status(400).json({ error: `Bu kupon için minimum sipariş tutarı ${c.minOrderTotal} TL` });
    return;
  }
  const discount = c.discountType === "percent"
    ? Math.round(orderTotal * c.discountValue / 100)
    : Math.min(c.discountValue, orderTotal);
  res.json({
    code:        c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    discountAmount: discount,
  });
});

/* ── ADMIN: list ── */
router.get("/admin/coupons", requireAuth, requireAdmin, async (_req, res) => {
  const rows = await db.select().from(couponsTable).orderBy(couponsTable.id);
  res.json({ coupons: rows });
});

/* ── ADMIN: create ── */
router.post("/admin/coupons", requireAuth, requireAdmin, async (req, res) => {
  const b = req.body as Partial<typeof couponsTable.$inferInsert> & { code?: string };
  if (!b.code || typeof b.discountValue !== "number") {
    res.status(400).json({ error: "code ve discountValue zorunludur" });
    return;
  }
  try {
    const [created] = await db.insert(couponsTable).values({
      code:          b.code.trim().toUpperCase(),
      description:   b.description ?? "",
      discountType:  b.discountType === "fixed" ? "fixed" : "percent",
      discountValue: b.discountValue,
      minOrderTotal: b.minOrderTotal ?? 0,
      maxUses:       b.maxUses ?? 0,
      validFrom:     b.validFrom ? new Date(b.validFrom) : null,
      validUntil:    b.validUntil ? new Date(b.validUntil) : null,
      isActive:      b.isActive ?? true,
    }).returning();
    await logAudit(req, "coupon.create", created.code, { id: created.id });
    res.json({ coupon: created });
  } catch (err) {
    req.log.warn({ err }, "coupon create failed");
    res.status(400).json({ error: "Kupon oluşturulamadı (kod tekrar ediyor olabilir)" });
  }
});

/* ── ADMIN: toggle / delete ── */
router.patch("/admin/coupons/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { isActive } = req.body as { isActive?: boolean };
  const [updated] = await db.update(couponsTable).set({ isActive: !!isActive }).where(eq(couponsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Bulunamadı" }); return; }
  await logAudit(req, "coupon.toggle", updated.code, { isActive: updated.isActive });
  res.json({ coupon: updated });
});

router.delete("/admin/coupons/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(couponsTable).where(eq(couponsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Bulunamadı" }); return; }
  await logAudit(req, "coupon.delete", deleted.code, { id });
  res.json({ ok: true });
});

/* helper for orders.ts: validate + compute discount (server-internal) */
export async function validateAndComputeDiscount(
  rawCode: string,
  orderTotal: number,
): Promise<{ code: string; discountAmount: number }> {
  const code = rawCode.trim().toUpperCase();
  const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, code)).limit(1);
  if (!c || !c.isActive) throw new Error("invalid");
  const now = new Date();
  if (c.validFrom && c.validFrom > now) throw new Error("not_active");
  if (c.validUntil && c.validUntil < now) throw new Error("expired");
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) throw new Error("limit");
  if (orderTotal < c.minOrderTotal) throw new Error("min_total");
  const discount = c.discountType === "percent"
    ? Math.round(orderTotal * c.discountValue / 100)
    : Math.min(c.discountValue, orderTotal);
  return { code, discountAmount: discount };
}

/* helper for orders.ts: bump usedCount */
export async function incrementCouponUsage(code: string): Promise<void> {
  if (!code) return;
  await db.update(couponsTable)
    .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
    .where(eq(couponsTable.code, code.trim().toUpperCase()));
}

export default router;
