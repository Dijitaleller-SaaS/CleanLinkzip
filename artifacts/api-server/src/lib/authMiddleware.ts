import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "./jwt";

export interface AuthRequest extends Request {
  jwtUser?: JwtPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Yetkisiz erişim" });
    return;
  }
  try {
    req.jwtUser = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
}
