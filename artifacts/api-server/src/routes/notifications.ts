import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";

const router = Router();

/* GET /api/notifications — current user's notifications */
router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.jwtUser!;
  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    const unreadCount = rows.filter(r => !r.isRead).length;
    res.json({ notifications: rows, unreadCount });
  } catch {
    res.status(500).json({ error: "Bildirimler getirilemedi" });
  }
});

/* PATCH /api/notifications/:id/read */
router.patch("/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.jwtUser!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Geçersiz id" }); return; }
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
});

/* POST /api/notifications/mark-all-read */
router.post("/notifications/mark-all-read", requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.jwtUser!;
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
});

export default router;
