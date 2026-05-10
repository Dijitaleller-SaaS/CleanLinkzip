import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db, usersTable, vendorProfilesTable, passwordResetTokensTable } from "@workspace/db";
import { eq, lt, sql } from "drizzle-orm";
import { signToken } from "../lib/jwt";
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";
import { sendMail, buildNewFirmaHtml } from "../lib/mailer";

const APP_URL = process.env.APP_URL ?? "https://cleanlinktr.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "serkan@dijitaleller.com";
const ADMIN_EMAILS = [ADMIN_EMAIL.toLowerCase(), "serkcel@gmail.com"];
function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

const router = Router();

/* Rate limiters: prevent brute-force and spam */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla şifre sıfırlama talebi. 1 saat sonra tekrar deneyin." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin." },
});

/* POST /api/auth/register */
router.post("/auth/register", registerLimiter, async (req, res) => {
  const { email, name, password, role } = req.body as {
    email?: string;
    name?: string;
    password?: string;
    role?: string;
  };

  if (!email || !name || !password) {
    res.status(400).json({ error: "E-posta, isim ve şifre zorunludur" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır" });
    return;
  }

  /* Admin e-postalar otomatik admin rolü alır */
  const userRole = isAdminEmail(email) ? "admin" : (role === "firma" ? "firma" : "musteri");

  /* Trim inputs */
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName  = name.trim();

  try {
    /* Duplicate e-posta kontrolü */
    const existingEmail = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, trimmedEmail))
      .limit(1);

    if (existingEmail.length > 0) {
      res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı" });
      return;
    }

    /* Duplicate isim kontrolü (sadece firma hesapları için — marka ismi benzersiz olmalı) */
    if (userRole === "firma") {
      const existingName = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.name, trimmedName))
        .limit(1);

      if (existingName.length > 0) {
        res.status(409).json({ error: "Bu firma adı zaten kayıtlı. Lütfen farklı bir isim kullanın." });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(usersTable)
      .values({ email: trimmedEmail, name: trimmedName, passwordHash, role: userRole })
      .returning();

    if (userRole === "firma") {
      /* Yeni firma kayıtları pilot süreçte admin onayına gönderilir (subscriptionPending=true) */
      await db.insert(vendorProfilesTable).values({
        userId:              user.id,
        subscriptionPending: true,
        isPublished:         false,
      });
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, tokenVersion: user.tokenVersion });

    /* Admin bildirimi — yeni firma kaydı */
    if (userRole === "firma") {
      sendMail({
        to:      ADMIN_EMAIL,
        subject: `[CleanLink] Yeni Firma Kaydı: ${user.name}`,
        html:    buildNewFirmaHtml({ firmaName: user.name, firmaEmail: user.email }),
      }).catch(() => {});
    }

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    res.status(500).json({ error: "Kayıt sırasında hata oluştu" });
  }
});

/* POST /api/auth/login */
router.post("/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "E-posta ve şifre zorunludur" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "E-posta veya şifre hatalı" });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: "Bu hesap Google ile oluşturulmuştur. Lütfen Google ile giriş yapın." });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "E-posta veya şifre hatalı" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, tokenVersion: user.tokenVersion });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    res.status(500).json({ error: "Giriş sırasında hata oluştu" });
  }
});

/* POST /api/auth/forgot-password */
router.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "E-posta zorunludur" }); return; }

  try {
    const [user] = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Bu e-posta adresiyle kayıtlı hesap bulunamadı" });
      return;
    }

    /* Generate a one-time token (64 hex chars, valid 30 min) — persisted in DB */
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await db.insert(passwordResetTokensTable).values({ token, userId: user.id, expiresAt });
    /* Cleanup expired tokens lazily */
    db.delete(passwordResetTokensTable).where(lt(passwordResetTokensTable.expiresAt, new Date())).catch(() => {});

    const resetLink = `${APP_URL}/sifre-sifirla?token=${token}`;

    await sendMail({
      to:      email.toLowerCase(),
      subject: "CleanLink — Şifre Sıfırlama",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#6d28d9">Şifre Sıfırlama</h2>
          <p>Merhaba <strong>${user.name}</strong>,</p>
          <p>CleanLink hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p style="margin:24px 0">
            <a href="${resetLink}"
               style="background:#6d28d9;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">
              Şifremi Sıfırla
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px">
            Bu bağlantı <strong>30 dakika</strong> geçerlidir.<br>
            Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>`,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Bir hata oluştu" });
  }
});

/* POST /api/auth/reset-password */
router.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) { res.status(400).json({ error: "Token ve şifre zorunludur" }); return; }
  if (password.length < 6) { res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır" }); return; }

  try {
    const [entry] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.token, token))
      .limit(1);

    if (!entry || entry.expiresAt < new Date()) {
      res.status(400).json({ error: "Geçersiz veya süresi dolmuş bağlantı" }); return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    /* Update password and increment tokenVersion atomically to invalidate all existing JWT sessions */
    await db.update(usersTable)
      .set({ passwordHash, tokenVersion: sql`token_version + 1` })
      .where(eq(usersTable.id, entry.userId));
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.token, token));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Şifre güncellenirken hata oluştu" });
  }
});

/* GET /api/auth/me */
router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.jwtUser!;
  try {
    const [user] = await db
      .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Kullanıcı bulunamadı" });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
