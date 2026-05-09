import { Router } from "express";
import { db, usersTable, vendorProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";
import { sendMail, buildHavaleNotificationHtml, buildPublishRequestHtml } from "../lib/mailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "serkan@dijitaleller.com";

const router = Router();

/* GET /api/vendors — list all published vendors */
router.get("/vendors", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: vendorProfilesTable.id,
        userId: vendorProfilesTable.userId,
        name: usersTable.name,
        bio: vendorProfilesTable.bio,
        phone: vendorProfilesTable.phone,
        whatsappPhone: vendorProfilesTable.whatsappPhone,
        regions: vendorProfilesTable.regions,
        isSubscribed: vendorProfilesTable.isSubscribed,
        isSponsor: vendorProfilesTable.isSponsor,
        isPublished: vendorProfilesTable.isPublished,
        yayinaGirisTarihi: vendorProfilesTable.yayinaGirisTarihi,
        prices: vendorProfilesTable.prices,
        serviceScopes: vendorProfilesTable.serviceScopes,
        galleryUrls: vendorProfilesTable.galleryUrls,
        certUrls:    vendorProfilesTable.certUrls,
        city:            vendorProfilesTable.city,
        district:        vendorProfilesTable.district,
        hasPati:         vendorProfilesTable.hasPati,
        isNatureFriendly: vendorProfilesTable.isNatureFriendly,
      })
      .from(vendorProfilesTable)
      .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
      .where(
        and(
          eq(vendorProfilesTable.isPublished, true),
          eq(vendorProfilesTable.isAdminHidden, false),
        )
      );

    res.json({
      vendors: rows.map(r => ({
        ...r,
        yayinaGirisTarihi: r.yayinaGirisTarihi instanceof Date
          ? r.yayinaGirisTarihi.getTime()
          : (r.yayinaGirisTarihi ?? null),
      })),
    });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* GET /api/vendors/me — current vendor profile */
router.get("/vendors/me", requireAuth, async (req: AuthRequest, res) => {
  const { userId, role } = req.jwtUser!;
  if (role !== "firma") {
    res.status(403).json({ error: "Sadece firma hesapları erişebilir" });
    return;
  }
  try {
    const [profile] = await db
      .select()
      .from(vendorProfilesTable)
      .where(eq(vendorProfilesTable.userId, userId))
      .limit(1);

    const toMs = (v: unknown) =>
      v instanceof Date ? v.getTime() : (typeof v === "string" ? new Date(v).getTime() : v ?? null);

    if (!profile) {
      const [newProfile] = await db
        .insert(vendorProfilesTable)
        .values({ userId })
        .returning();
      res.json({ profile: { ...newProfile, yayinaGirisTarihi: toMs(newProfile.yayinaGirisTarihi), updatedAt: toMs(newProfile.updatedAt) } });
      return;
    }
    res.json({ profile: { ...profile, yayinaGirisTarihi: toMs(profile.yayinaGirisTarihi), updatedAt: toMs(profile.updatedAt) } });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* PUT /api/vendors/me — update vendor profile */
router.put("/vendors/me", requireAuth, async (req: AuthRequest, res) => {
  const { userId, role } = req.jwtUser!;
  if (role !== "firma") {
    res.status(403).json({ error: "Sadece firma hesapları güncelleyebilir" });
    return;
  }

  /* isSubscribed and isSponsor are billing-state fields managed exclusively by
     admin actions or verified payment callbacks. Vendors must never be able to
     self-assign these via their own profile update endpoint. */
  const { bio, phone, whatsappPhone, regions, isPublished, prices, serviceScopes, galleryUrls, certUrls, city, district } = req.body;

  /* RBAC: phone/whatsapp düzenleme yalnızca abone/sponsor için izinli */
  if (phone !== undefined || whatsappPhone !== undefined) {
    const [current] = await db.select({
      isSubscribed: vendorProfilesTable.isSubscribed,
      isSponsor: vendorProfilesTable.isSponsor,
    }).from(vendorProfilesTable).where(eq(vendorProfilesTable.userId, userId)).limit(1);
    const isPaid = current ? (current.isSubscribed || current.isSponsor) : false;
    if (!isPaid) {
      res.status(403).json({ error: "Telefon ve WhatsApp düzenleme yalnızca Standart/Elite üyelere açıktır." });
      return;
    }
  }

  try {
    /* isPublished: true is always intercepted — vendors can never directly publish
       themselves regardless of subscription state. Publication requires admin approval.
       Vendors may still set isPublished: false to unpublish their own listing. */
    const interceptPublish = isPublished === true;

    const [user] = interceptPublish
      ? await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1)
      : [null as null];

    const [updated] = await db
      .update(vendorProfilesTable)
      .set({
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
        ...(whatsappPhone !== undefined && { whatsappPhone }),
        ...(regions !== undefined && { regions }),
        /* isSubscribed and isSponsor are intentionally omitted — not settable by vendors */
        /* isPublished: true always routes through admin-approval flow;
           isPublished: false (unpublish) is allowed directly */
        ...(interceptPublish
          ? { subscriptionPending: true }
          : isPublished === false ? { isPublished: false } : {}),
        ...(prices !== undefined && { prices }),
        ...(serviceScopes !== undefined && { serviceScopes }),
        ...(galleryUrls !== undefined && { galleryUrls }),
        ...(certUrls !== undefined && { certUrls }),
        ...(city !== undefined && { city }),
        ...(district !== undefined && { district }),
        updatedAt: new Date(),
      })
      .where(eq(vendorProfilesTable.userId, userId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Profil bulunamadı" });
      return;
    }

    /* Admin bildir — yayın talebi gönderildi */
    if (interceptPublish && user) {
      sendMail({
        to:      ADMIN_EMAIL,
        subject: `[CleanLink] Firma Yayın Talebi: ${user.name}`,
        html:    buildPublishRequestHtml({ firmaName: user.name, firmaEmail: user.email }),
      }).catch(() => {});
    }

    res.json({ profile: updated });
  } catch {
    res.status(500).json({ error: "Güncelleme sırasında hata oluştu" });
  }
});

/* POST /api/vendors/havale — firma declares bank transfer, DB updated + admin notified */
router.post("/vendors/havale", requireAuth, async (req: AuthRequest, res) => {
  const { userId, role } = req.jwtUser!;
  if (role !== "firma") {
    res.status(403).json({ error: "Sadece firma hesapları havale kaydı oluşturabilir" });
    return;
  }

  const { refCode, paket } = req.body as { refCode?: string; paket?: string };
  if (!refCode || !paket) {
    res.status(400).json({ error: "refCode ve paket zorunludur" });
    return;
  }
  if (paket !== "standart" && paket !== "elite") {
    res.status(400).json({ error: "Geçersiz paket değeri" });
    return;
  }

  try {
    /* Fetch firma name for the notification */
    const [user] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const firmaName = user?.name ?? `Firma #${userId}`;

    /* Update vendor profile: mark payment as pending */
    const [updated] = await db
      .update(vendorProfilesTable)
      .set({
        subscriptionPending: true,
        havaleRefCode:       refCode,
        havalePkg:           paket as "standart" | "elite",
        updatedAt:           new Date(),
      })
      .where(eq(vendorProfilesTable.userId, userId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Firma profili bulunamadı" });
      return;
    }

    /* Send admin notification — best-effort, don't fail the request if email fails */
    sendMail({
      to:      ADMIN_EMAIL,
      subject: `[CleanLink] Yeni Havale: ${firmaName} — ${paket === "elite" ? "Elite" : "Standart"} paket`,
      html:    buildHavaleNotificationHtml({ firmaName, refCode, paket }),
    }).catch(err => req.log.warn({ err }, "Havale e-posta bildirimi gönderilemedi"));

    res.json({ ok: true, profile: updated });
  } catch {
    res.status(500).json({ error: "Havale kaydı sırasında hata oluştu" });
  }
});

/* ── POST /api/vendors/notify-dekont — send dekont details to admin via SMTP ── */
router.post("/vendors/notify-dekont", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).jwtUser!;
  if (!userId) { res.status(401).json({ error: "Yetkisiz" }); return; }

  const { firmaAdi, paket, refCode, tarih, banka, dosyaAdi, dosyaBase64 } =
    req.body as { firmaAdi: string; paket: string; refCode: string; tarih: string; banka: string; dosyaAdi?: string; dosyaBase64?: string };

  const paketLabel = paket === "elite" ? "Elite (5.000 TL/Ay)" : "Standart (999 TL/Ay)";
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6d28d9">CleanLink — Dekont Bildirimi</h2>
      <p>Bir firma dekont bilgilerini iletti ve admin onayı bekliyor.</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
        ${[
          ["Firma Adı",    firmaAdi],
          ["Paket",        paketLabel],
          ["Referans Kodu", refCode],
          ["İşlem Tarihi", tarih || "(belirtilmedi)"],
          ["Gönderilen Banka", banka || "(belirtilmedi)"],
          ...(dosyaAdi ? [["Dekont Dosyası", dosyaAdi + " (ek dosya olarak gönderildi)"]] : []),
          ["Bildirim Zamanı", now],
        ].map(([label, val]) => `
          <tr>
            <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:40%;border:1px solid #e5e7eb">${label}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${val}</td>
          </tr>`).join("")}
      </table>
      <p>Onaylamak için <a href="https://cleanlinktr.com/admin-dashboard" style="color:#6d28d9">Admin Paneli</a>'ni ziyaret edin.</p>
    </div>`;

  /* Build attachment if base64 data provided */
  const attachments = [];
  if (dosyaBase64 && dosyaAdi) {
    const matches = dosyaBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      attachments.push({
        filename: dosyaAdi,
        content:  Buffer.from(matches[2], "base64"),
      });
    }
  }

  /* E-posta gönderimi başarısız olsa bile 200 dön — havale zaten DB'ye kaydedildi */
  sendMail({
    to:          ADMIN_EMAIL,
    subject:     `[Dekont Bildirimi] ${firmaAdi} — ${paket === "elite" ? "Elite" : "Standart"} Paket · ${refCode}`,
    html,
    attachments: attachments.length ? attachments : undefined,
  })
    .then(() => req.log.info({ firmaAdi, refCode }, "Dekont notification sent to admin"))
    .catch(err  => req.log.warn({ err, firmaAdi, refCode }, "Dekont e-posta gönderilemedi (non-fatal)"));

  res.json({ ok: true });
});

export default router;
