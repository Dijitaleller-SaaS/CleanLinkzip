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
    /* Service worker must never be cached — browsers and CDNs (Cloudflare)
       must always fetch the latest version so new deployments take effect. */
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

    /* Everything else (images, fonts, etc.) — short cache */
    app.use(express.static(frontendDist, { maxAge: "1h" }));

    /* SPA fallback: always return index.html without caching so
       Cloudflare never serves a stale shell to navigating clients. */
    app.get(/.*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.sendFile(path.join(frontendDist, "index.html"));
    });

    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found, skipping static serving");
  }
}

export default app;
