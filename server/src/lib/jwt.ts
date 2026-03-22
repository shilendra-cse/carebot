import jwt from "jsonwebtoken";
import { config } from "@/config/index.js";

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

const JWT_SECRET = config.security.jwt.secret;
const JWT_EXPIRES_IN = "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
