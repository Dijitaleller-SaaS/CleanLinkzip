import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { db, usersTable, vendorProfilesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { signToken } from "../lib/jwt";

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const CALLBACK_URL  = process.env.GOOGLE_CALLBACK_URL ?? "https://cleanlinktr.com/api/auth/google/callback";
const APP_URL       = process.env.APP_URL ?? "https://cleanlinktr.com";

const router = Router();

function buildOAuthClient() {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, CALLBACK_URL);
}

/* GET /api/auth/google — redirect to Google consent screen */
router.get("/auth/google", (_req, res) => {
  const client = buildOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
  res.redirect(url);
});

/* GET /api/auth/google/callback — handle Google response */
router.get("/auth/google/callback", async (req, res) => {
  const { code, error } = req.query as { code?: string; error?: string };

  req.log.info({
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    callbackUrl: CALLBACK_URL,
    hasCode: !!code,
    googleError: error ?? null,
  }, "Google OAuth callback received");

  if (error || !code) {
    req.log.warn({ googleError: error }, "Google OAuth: user denied or no code");
    res.redirect(`${APP_URL}/?google_error=access_denied`);
    return;
  }

  try {
    const client = buildOAuthClient();

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      req.log.warn("Google OAuth: no email in payload");
      res.redirect(`${APP_URL}/?google_error=no_email`);
      return;
    }

    const { sub: googleId, email, name: googleName } = payload;
    const name = googleName ?? email.split("@")[0];
    req.log.info({ email, googleId }, "Google OAuth: user identified");

    /* Find existing user by google_id OR email */
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.googleId, googleId), eq(usersTable.email, email.toLowerCase())))
      .limit(1);

    let user = existing;

    if (user) {
      /* Link google_id if not already linked */
      if (!user.googleId) {
        await db
          .update(usersTable)
          .set({ googleId })
          .where(eq(usersTable.id, user.id));
        user = { ...user, googleId };
      }
    } else {
      /* Create new user — default role: musteri */
      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: email.toLowerCase(),
          name,
          passwordHash: null,
          googleId,
          role: "musteri",
        })
        .returning();
      user = newUser;
    }

    /* If user has a vendor profile but role is not firma, promote to firma.
       This handles cases where a firm registered with email/password,
       then logs in with Google for the first time. */
    if (user.role !== "firma" && user.role !== "admin") {
      const [vp] = await db
        .select({ id: vendorProfilesTable.id })
        .from(vendorProfilesTable)
        .where(eq(vendorProfilesTable.userId, user.id))
        .limit(1);
      if (vp) {
        await db.update(usersTable).set({ role: "firma" }).where(eq(usersTable.id, user.id));
        user = { ...user, role: "firma" };
        req.log.info({ userId: user.id, email: user.email }, "Google OAuth: promoted user to firma (has vendor profile)");
      }
    }

    const token = signToken({
      userId:       user.id,
      email:        user.email,
      name:         user.name,
      role:         user.role,
      tokenVersion: user.tokenVersion,
    });

    /* Redirect to frontend with token in URL fragment — never appears in server logs or Referer headers */
    res.redirect(`${APP_URL}/#google_token=${token}`);
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    res.redirect(`${APP_URL}/?google_error=server_error`);
  }
});

export default router;
