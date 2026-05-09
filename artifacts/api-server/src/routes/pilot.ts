import { Router } from "express";
import { db, pilotApplicationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/authMiddleware";
import { requireAdmin } from "../lib/adminMiddleware";
import type { AuthRequest } from "../lib/authMiddleware";
import { sendMail } from "../lib/mailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "serkan@dijitaleller.com";

const router = Router();

/* POST /api/pilot-applications — public submission (sartlariOkudum must be true) */
router.post("/pilot-applications", async (req, res) => {
  const { firmaAdi, yetkiliAdi, telefon, email, deneyim, hizmetler, ekipman, googleLink, notlar, sartlariOkudum } = req.body as {
    firmaAdi?: string; yetkiliAdi?: string; telefon?: string; email?: string;
    deneyim?: string; hizmetler?: string[]; ekipman?: string;
    googleLink?: string; notlar?: string; sartlariOkudum?: boolean;
  };

  if (!sartlariOkudum) {
    res.status(400).json({ error: "Pilot şartlarını kabul etmek zorunludur" });
    return;
  }
  if (!firmaAdi?.trim() || !yetkiliAdi?.trim() || !telefon?.trim() || !email?.trim()) {
    res.status(400).json({ error: "Zorunlu alanlar eksik" });
    return;
  }
  if (!deneyim || !hizmetler?.length || !ekipman) {
    res.status(400).json({ error: "Hizmet detayları eksik" });
    return;
  }

  const PILOT_SARTLAR_VERSIYON = "v1.0-20260501";
  const clientIp =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.ip ??
    "";

  try {
    const [row] = await db.insert(pilotApplicationsTable).values({
      firmaAdi:          firmaAdi.trim(),
      yetkiliAdi:        yetkiliAdi.trim(),
      telefon:           telefon.trim(),
      email:             email.trim(),
      deneyim,
      hizmetler,
      ekipman,
      googleLink:        googleLink?.trim() ?? "",
      notlar:            notlar?.trim() ?? "",
      sartlariOkudum:    true,
      onaylananVersiyon: PILOT_SARTLAR_VERSIYON,
      onayIp:            clientIp,
      onayTarihi:        new Date(),
    }).returning();

    res.status(201).json({ application: row });

    /* ── Admin bildirim e-postası (best-effort, response'u beklemez) ── */
    const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
    const hizmetlerStr = (hizmetler ?? []).join(", ");
    const adminHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#0d9488">CleanLink — Yeni Pilot Başvurusu</h2>
        <p>Pilot programa yeni bir başvuru geldi. Admin panelinden inceleyebilirsiniz.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600;width:35%">Firma Adı</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.firmaAdi}</td></tr>
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Yetkili</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.yetkiliAdi}</td></tr>
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Telefon</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.telefon}</td></tr>
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">E-posta</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.email}</td></tr>
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Deneyim</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.deneyim}</td></tr>
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Hizmetler</td><td style="padding:8px 12px;border:1px solid #d1fae5">${hizmetlerStr}</td></tr>
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Ekipman</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.ekipman}</td></tr>
          ${row.googleLink ? `<tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Google Link</td><td style="padding:8px 12px;border:1px solid #d1fae5"><a href="${row.googleLink}">${row.googleLink}</a></td></tr>` : ""}
          ${row.notlar ? `<tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Notlar</td><td style="padding:8px 12px;border:1px solid #d1fae5">${row.notlar}</td></tr>` : ""}
          <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Tarih</td><td style="padding:8px 12px;border:1px solid #d1fae5">${now}</td></tr>
        </table>
        <p style="margin-top:20px">
          <a href="https://cleanlinktr.com/admin-dashboard" style="background:#0d9488;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            Admin Panelini Aç
          </a>
        </p>
      </div>
    `;

    /* ── Başvuru sahibine otomatik yanıt ── */
    const applicantHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#0d9488">CleanLink Pilot Başvurunuz Alındı</h2>
        <p>Sayın <strong>${row.yetkiliAdi}</strong>,</p>
        <p><strong>${row.firmaAdi}</strong> adına yaptığınız pilot program başvurusu başarıyla alındı. Ekibimiz başvurunuzu inceleyecek ve en kısa sürede sizinle iletişime geçecektir.</p>
        <p style="color:#6b7280;font-size:13px">Bu e-posta otomatik olarak gönderilmiştir. Sorularınız için <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a> adresine yazabilirsiniz.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
        <p style="font-size:12px;color:#9ca3af">CleanLink Teknoloji — cleanlinktr.com</p>
      </div>
    `;

    Promise.allSettled([
      sendMail({ to: ADMIN_EMAIL, subject: `[Pilot Başvurusu] ${row.firmaAdi} — ${row.yetkiliAdi}`, html: adminHtml }),
      sendMail({ to: row.email,   subject: "CleanLink Pilot Başvurunuz Alındı", html: applicantHtml }),
    ]).catch(() => void 0);

  } catch {
    res.status(500).json({ error: "Başvuru kaydedilemedi" });
  }
});

/* GET /api/admin/pilot-applications — list all */
router.get("/admin/pilot-applications", requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(pilotApplicationsTable)
      .orderBy(desc(pilotApplicationsTable.createdAt));
    res.json({ applications: rows });
  } catch {
    res.status(500).json({ error: "Başvurular listelenemedi" });
  }
});

/* DELETE /api/admin/pilot-applications/:id — delete one */
router.delete("/admin/pilot-applications/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  try {
    await db.delete(pilotApplicationsTable).where(eq(pilotApplicationsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Başvuru silinemedi" });
  }
});

export default router;
