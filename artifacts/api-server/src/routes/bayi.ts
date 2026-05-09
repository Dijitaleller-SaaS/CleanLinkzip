import { Router } from "express";
import {
  db, bayiProfilesTable, bayiVendorAssignmentsTable,
  vendorProfilesTable, usersTable, ordersTable,
} from "@workspace/db";
import { eq, and, gte, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";
import { requireAdmin } from "../lib/adminMiddleware";
import { logAudit } from "../lib/auditLog";

const router = Router();

function genBayiKodu(): string {
  return "BY" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/* ── GET /api/bayi/me — bayi kendi panelini görür ── */
router.get("/bayi/me", requireAuth, async (req: AuthRequest, res) => {
  const { userId, role } = req.jwtUser!;
  if (role !== "bayi") { res.status(403).json({ error: "Sadece bayi" }); return; }

  const [bayi] = await db.select().from(bayiProfilesTable).where(eq(bayiProfilesTable.userId, userId)).limit(1);
  if (!bayi) { res.status(404).json({ error: "Bayi profili bulunamadı" }); return; }

  /* Atanan firmaları çek */
  const assignments = await db.select({
    vendorId:   vendorProfilesTable.id,
    name:       usersTable.name,
    email:      usersTable.email,
    isSubscribed: vendorProfilesTable.isSubscribed,
    paket:      vendorProfilesTable.paket,
    activatedAt: vendorProfilesTable.activatedAt,
  })
  .from(bayiVendorAssignmentsTable)
  .innerJoin(vendorProfilesTable, eq(vendorProfilesTable.id, bayiVendorAssignmentsTable.vendorId))
  .innerJoin(usersTable, eq(usersTable.id, vendorProfilesTable.userId))
  .where(eq(bayiVendorAssignmentsTable.bayiId, bayi.id));

  /* Bu ayki sipariş hacmi */
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const vendorNames = assignments.map(a => a.name);
  let monthlyOrders: { total: number; count: number } = { total: 0, count: 0 };
  if (vendorNames.length > 0) {
    const orders = await db.select({ total: ordersTable.total })
      .from(ordersTable)
      .where(and(
        inArray(ordersTable.vendorName, vendorNames),
        gte(ordersTable.createdAt, monthStart),
      ));
    monthlyOrders = { total: orders.reduce((s, o) => s + o.total, 0), count: orders.length };
  }

  /* Aylık komisyon hesabı */
  const monthlyCommission = Math.round(monthlyOrders.total * bayi.komisyonOrani / 100);

  res.json({
    bayi,
    assignments,
    monthlyOrders,
    monthlyCommission,
    referralLink: `/firma-kayit?bayi=${bayi.bayiKodu}`,
  });
});

/* ── ADMIN: list bayiler ── */
router.get("/admin/bayiler", requireAuth, requireAdmin, async (_req, res) => {
  const rows = await db.select({
    id:         bayiProfilesTable.id,
    userId:     bayiProfilesTable.userId,
    name:       usersTable.name,
    email:      usersTable.email,
    bayiKodu:   bayiProfilesTable.bayiKodu,
    bolge:      bayiProfilesTable.bolge,
    komisyonOrani: bayiProfilesTable.komisyonOrani,
    girisUcreti: bayiProfilesTable.girisUcreti,
    iban:       bayiProfilesTable.iban,
    isActive:   bayiProfilesTable.isActive,
    createdAt:  bayiProfilesTable.createdAt,
  })
  .from(bayiProfilesTable)
  .innerJoin(usersTable, eq(usersTable.id, bayiProfilesTable.userId))
  .orderBy(bayiProfilesTable.id);
  res.json({ bayiler: rows });
});

/* ── ADMIN: create bayi (mevcut user'ı bayiye dönüştür) ── */
router.post("/admin/bayiler", requireAuth, requireAdmin, async (req, res) => {
  const { email, bolge, komisyonOrani, girisUcreti, iban } = req.body as {
    email?: string; bolge?: string; komisyonOrani?: number; girisUcreti?: number; iban?: string;
  };
  if (!email) { res.status(400).json({ error: "email zorunludur" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) { res.status(404).json({ error: "Bu e-postayla kayıtlı kullanıcı yok" }); return; }

  await db.update(usersTable).set({ role: "bayi" }).where(eq(usersTable.id, user.id));
  try {
    const [bayi] = await db.insert(bayiProfilesTable).values({
      userId:        user.id,
      bayiKodu:      genBayiKodu(),
      bolge:         bolge ?? "",
      komisyonOrani: komisyonOrani ?? 15,
      girisUcreti:   girisUcreti ?? 0,
      iban:          iban ?? "",
    }).returning();
    await logAudit(req, "bayi.create", user.email, { bayiId: bayi.id, bolge });
    res.json({ bayi });
  } catch (err) {
    req.log.warn({ err }, "bayi create failed");
    res.status(400).json({ error: "Bu kullanıcı zaten bayi olabilir" });
  }
});

/* ── ADMIN: assign vendor to bayi ── */
router.post("/admin/bayiler/:id/assign", requireAuth, requireAdmin, async (req, res) => {
  const bayiId = Number(req.params.id);
  const { vendorId } = req.body as { vendorId?: number };
  if (!vendorId) { res.status(400).json({ error: "vendorId zorunludur" }); return; }
  try {
    await db.insert(bayiVendorAssignmentsTable).values({ bayiId, vendorId });
    await logAudit(req, "bayi.assign", `bayi#${bayiId}`, { vendorId });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Bu firma zaten bu bayiye atanmış" });
  }
});

/* ── ADMIN: delete bayi ── */
router.delete("/admin/bayiler/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [bayi] = await db.select().from(bayiProfilesTable).where(eq(bayiProfilesTable.id, id)).limit(1);
  if (!bayi) { res.status(404).json({ error: "Bulunamadı" }); return; }
  await db.delete(bayiProfilesTable).where(eq(bayiProfilesTable.id, id));
  await db.update(usersTable).set({ role: "musteri" }).where(eq(usersTable.id, bayi.userId));
  await logAudit(req, "bayi.delete", `bayi#${id}`, {});
  res.json({ ok: true });
});

export default router;
