import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "./jwt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  jwtUser?: JwtPayload;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Yetkisiz erişim" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));

    /* Validate tokenVersion against DB to ensure password-reset invalidates sessions */
    const [user] = await db
      .select({ tokenVersion: usersTable.tokenVersion })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ error: "Oturum geçersiz. Lütfen tekrar giriş yapın." });
      return;
    }

    req.jwtUser = payload;
    next();
  } catch {
    res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
}
