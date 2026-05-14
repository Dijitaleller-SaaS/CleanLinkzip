import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

/* Replit (and most cloud providers) sit behind a reverse proxy.
   Trust the first proxy so Express sees correct protocol/IP/host. */
app.set("trust proxy", 1);

/* www → non-www canonical redirect */
app.use((req, res, next) => {
  const host = req.hostname;
  if (host && host.startsWith("www.")) {
    const bare = host.slice(4);
    return res.redirect(301, `https://${bare}${req.originalUrl}`);
  }
  next();
});

/* ── Social-media bot detection ────────────────────────────────────────────
   Known social-media crawler user-agent substrings.  When one of these
   hits the server we:
     1. Set Vary: User-Agent so any CDN layer knows responses differ by UA.
     2. Set Cache-Control: no-store so Cloudflare/CDN does NOT serve a cached
        JS-challenge page instead of real HTML.
     3. Set X-Robots-Tag to signal indexability.
     4. Log the event for the audit trail.
   NOTE: Cloudflare's challenge page is applied BEFORE the request reaches
   Express in some configurations.  These headers cannot bypass that layer,
   but they do ensure that once a bot request reaches Express it gets the
   correct, uncached response.                                              */
const SOCIAL_BOT_AGENTS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "slurp",          // Yahoo
  "duckduckbot",
  "applebot",
  "discordbot",
  "telegrambot",
  "skypeuri",
  "pinterest",
  "vkshare",
  "w3c_validator",
  "baiduspider",
  "yandexbot",
  "msnbot",
];

app.use((req, res, next) => {
  res.setHeader("Vary", "User-Agent");

  const ua = (req.headers["user-agent"] ?? "").toLowerCase();
  const isBot = SOCIAL_BOT_AGENTS.some((bot) => ua.includes(bot));

  if (isBot) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("X-Robots-Tag", "index, follow");
    res.setHeader("X-Content-Type-Options", "nosniff");

    logger.info(
      { ua: req.headers["user-agent"], url: req.url, ip: req.ip },
      "Social media bot detected",
    );
  }

  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
/* Dekont upload: base64-encoded file can be several MB */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

/* Serve frontend static files in production */
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../../cleanlink/dist/public",
  );

  if (existsSync(frontendDist)) {
    /* Service worker must never be cached */
    app.get("/sw.js", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Content-Type", "application/javascript");
      res.sendFile(path.join(frontendDist, "sw.js"));
    });

    /* manifest and icons: short cache */
    app.get("/manifest.webmanifest", (_req, res) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.sendFile(path.join(frontendDist, "manifest.webmanifest"));
    });

    /* Hashed JS/CSS assets: long-lived immutable cache */
    app.use(
      "/assets",
      express.static(path.join(frontendDist, "assets"), {
        maxAge: "1y",
        immutable: true,
      }),
    );

    /* OG images: short cache so refreshes pick up new versions quickly */
    app.use(
      "/opengraph",
      (_req, res, next) => {
        res.setHeader("Cache-Control", "public, max-age=3600, must-revalidate");
        next();
      },
      express.static(frontendDist),
    );

    /* Everything else (images, fonts, etc.) — short cache */
    app.use(express.static(frontendDist, { maxAge: "1h" }));

    /* SPA fallback: always return index.html without caching.
       For social-media bots the bot-detection middleware above already set
       Cache-Control: no-store, so this header is a safe default for humans. */
    app.get(/.*/, (req, res) => {
      const ua = (req.headers["user-agent"] ?? "").toLowerCase();
      const isBot = SOCIAL_BOT_AGENTS.some((bot) => ua.includes(bot));

      res.setHeader(
        "Cache-Control",
        isBot ? "no-store, no-cache, must-revalidate" : "no-store, no-cache, must-revalidate",
      );
      res.sendFile(path.join(frontendDist, "index.html"));
    });

    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found, skipping static serving");
  }
}

export default app;
