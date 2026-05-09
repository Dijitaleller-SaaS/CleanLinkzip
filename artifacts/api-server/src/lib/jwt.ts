import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "cleanlink-dev-secret-2024";
const JWT_EXPIRES = "30d";

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
