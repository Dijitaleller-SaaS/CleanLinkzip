import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "serkan@dijitaleller.com";
const ADMIN_EMAILS = [ADMIN_EMAIL.toLowerCase(), "serkcel@gmail.com"];

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.jwtUser) {
    res.status(401).json({ error: "Yetkisiz erişim" });
    return;
  }
  if (!ADMIN_EMAILS.includes(req.jwtUser.email.toLowerCase())) {
    res.status(403).json({ error: "Bu işlem için admin yetkisi gereklidir" });
    return;
  }
  next();
}
