import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/og-audit", (req, res) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";

  const ts = new Date().toISOString();
  const { page, title, description, image } = req.body ?? {};

  logger.info(
    {
      type: "og-audit",
      ip,
      ts,
      page: page ?? "unknown",
      title: title ?? "",
      description: typeof description === "string" ? description.slice(0, 100) : "",
      image: image ?? "",
    },
    "OG meta rendered",
  );

  res.status(204).end();
});

export default router;
