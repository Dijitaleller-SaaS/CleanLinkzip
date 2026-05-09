import { db, auditLogTable } from "@workspace/db";
import type { Request } from "express";
import type { AuthRequest } from "./authMiddleware";

export async function logAudit(
  req: Request,
  action: string,
  target: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    const auth = (req as AuthRequest).jwtUser;
    const ip =
      (req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()) ||
      req.socket.remoteAddress ||
      "";
    await db.insert(auditLogTable).values({
      actorId:    auth?.userId ?? null,
      actorEmail: auth?.email ?? "",
      action,
      target,
      meta,
      ip,
    });
  } catch (err) {
    (req as AuthRequest).log?.warn?.({ err }, "auditLog insert failed");
  }
}
