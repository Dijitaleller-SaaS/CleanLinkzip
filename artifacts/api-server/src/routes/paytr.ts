import { Router } from "express";
import crypto from "crypto";
import { db, usersTable, vendorProfilesTable, paytrTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/authMiddleware";
import { logAudit } from "../lib/auditLog";
import { sendMail, buildPaytrPendingHtml } from "../lib/mailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "serkan@dijitaleller.com";

const router = Router();

const PAYTR_MERCHANT_ID   = process.env.PAYTR_MERCHANT_ID   ?? "";
const PAYTR_MERCHANT_KEY  = process.env.PAYTR_MERCHANT_KEY  ?? "";
const PAYTR_MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT ?? "";
const PAYTR_TEST_MODE     = process.env.PAYTR_TEST_MODE === "1" ? "1" : "0";
const PAYTR_API           = "https://www.paytr.com/odeme/api/get-token";

const PAKET_FIYATLARI: Record<string, number> = { standart: 999, elite: 5000 };

function isConfigured(): boolean {
  return !!(PAYTR_MERCHANT_ID && PAYTR_MERCHANT_KEY && PAYTR_MERCHANT_SALT);
}

/* ── GET /api/paytr/status — frontend gateway hazır mı kontrol etsin ── */
router.get("/paytr/status", (_req, res) => {
  res.json({ enabled: isConfigured(), testMode: PAYTR_TEST_MODE === "1" });
});

/* ── POST /api/paytr/init — firma abonelik için ödeme token'ı al ── */
router.post("/paytr/init", requireAuth, async (req: AuthRequest, res) => {
  if (!isConfigured()) {
    res.status(503).json({
      error: "PayTR henüz yapılandırılmamış. Lütfen Havale/EFT yöntemini kullanın.",
      hint:  "PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT secret olarak eklenmelidir.",
    });
    return;
  }
  const { paket } = req.body as { paket?: string };
  if (paket !== "standart" && paket !== "elite") {
    res.status(400).json({ error: "Geçersiz paket" });
    return;
  }
  const { userId, role } = req.jwtUser!;
  if (role !== "firma") { res.status(403).json({ error: "Sadece firma" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Kullanıcı yok" }); return; }

  const amountTL = PAKET_FIYATLARI[paket];
  const payment_amount = amountTL * 100; // kuruş
  const merchant_oid = `CL${userId}T${Date.now()}`;
  const ip =
    (req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()) ||
    req.socket.remoteAddress || "127.0.0.1";

  const baseUrl = (process.env.REPLIT_DOMAINS?.split(",")[0]) ?? req.headers.host ?? "";
  const merchant_ok_url   = `https://${baseUrl}/firma-dashboard?paytr=success`;
  const merchant_fail_url = `https://${baseUrl}/firma-dashboard?paytr=fail`;

  const user_basket = Buffer.from(JSON.stringify([
    [`CleanLink ${paket === "elite" ? "Elite" : "Standart"} Aylık Abonelik`, String(amountTL), 1],
  ])).toString("base64");

  const hashStr =
    `${PAYTR_MERCHANT_ID}${ip}${merchant_oid}${user.email}${payment_amount}${user_basket}` +
    `0` /* no_installment */ + `0` /* max_installment */ + `TL` + PAYTR_TEST_MODE + PAYTR_MERCHANT_SALT;
  const paytr_token = crypto.createHmac("sha256", PAYTR_MERCHANT_KEY).update(hashStr).digest("base64");

  const params = new URLSearchParams({
    merchant_id:   PAYTR_MERCHANT_ID,
    user_ip:       ip,
    merchant_oid,
    email:         user.email,
    payment_amount: String(payment_amount),
    paytr_token,
    user_basket,
    debug_on:      "1",
    no_installment: "0",
    max_installment: "0",
    user_name:     user.name,
    user_address:  "Türkiye",
    user_phone:    "05000000000",
    merchant_ok_url,
    merchant_fail_url,
    timeout_limit: "30",
    currency:      "TL",
    test_mode:     PAYTR_TEST_MODE,
  });

  try {
    const r = await fetch(PAYTR_API, { method: "POST", body: params });
    const data = (await r.json()) as { status?: string; token?: string; reason?: string };
    if (data.status !== "success" || !data.token) {
      req.log.warn({ data }, "paytr init failed");
      res.status(502).json({ error: data.reason ?? "PayTR token alınamadı" });
      return;
    }
    await db.insert(paytrTransactionsTable).values({
      merchantOid: merchant_oid,
      userId,
      amount:      payment_amount,
      paket,
      status:      "pending",
      paytrToken:  data.token,
    });
    await logAudit(req, "paytr.init", merchant_oid, { paket, amount: amountTL });
    res.json({ token: data.token, merchantOid: merchant_oid, iframeUrl: `https://www.paytr.com/odeme/guvenli/${data.token}` });
  } catch (err) {
    req.log.warn({ err }, "paytr init exception");
    res.status(502).json({ error: "PayTR'ye ulaşılamadı" });
  }
});

/* ── POST /api/paytr/callback — PayTR sunucusu çağırır ── */
router.post("/paytr/callback", async (req, res) => {
  const b = req.body as Record<string, string>;
  const { merchant_oid, status, total_amount, hash } = b;
  if (!merchant_oid) { res.status(400).send("missing"); return; }

  if (isConfigured()) {
    const calc = crypto.createHmac("sha256", PAYTR_MERCHANT_KEY)
      .update(`${merchant_oid}${PAYTR_MERCHANT_SALT}${status}${total_amount}`)
      .digest("base64");
    if (calc !== hash) { res.status(400).send("PAYTR notification failed: bad hash"); return; }
  }

  const [tx] = await db.select().from(paytrTransactionsTable).where(eq(paytrTransactionsTable.merchantOid, merchant_oid)).limit(1);
  if (!tx) { res.send("OK"); return; } // PayTR yine OK bekler

  if (tx.status !== "pending") { res.send("OK"); return; } // idempotent

  if (status === "success") {
    await db.update(paytrTransactionsTable)
      .set({ status: "success", completedAt: new Date(), rawCallback: b as Record<string, unknown> })
      .where(eq(paytrTransactionsTable.id, tx.id));
    if (tx.userId) {
      /* Pilot mod: ödeme alındı ama admin onayı bekleniyor — otomatik aktive etme */
      await db.update(vendorProfilesTable)
        .set({
          subscriptionPending: true,
          paket:               tx.paket as "standart" | "elite",
          updatedAt:           new Date(),
        })
        .where(eq(vendorProfilesTable.userId, tx.userId));

      /* Admin'e bildirim gönder */
      const [vendorUser] = await db
        .select({ name: usersTable.name, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, tx.userId))
        .limit(1);
      if (vendorUser) {
        await sendMail({
          to: ADMIN_EMAIL,
          subject: `CleanLink — PayTR Ödeme Alındı: ${vendorUser.name}`,
          html: buildPaytrPendingHtml({
            firmaName: vendorUser.name,
            firmaEmail: vendorUser.email ?? "",
            paket: tx.paket ?? "standart",
            merchantOid: merchant_oid,
          }),
        }).catch(() => {});
      }
    }
  } else {
    await db.update(paytrTransactionsTable)
      .set({ status: "failed", completedAt: new Date(), rawCallback: b as Record<string, unknown> })
      .where(eq(paytrTransactionsTable.id, tx.id));
  }
  res.send("OK"); // PayTR bunu bekler
});

export default router;
