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
    app.use(express.static(frontendDist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found, skipping static serving");
  }
}

export default app;
