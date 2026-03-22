import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/types/base.types";
import { verifyToken } from "@/lib/jwt.js";

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ status: 401, message: "Unauthorized", type: "error" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (error) {
    res.status(401).json({ status: 401, message: "Invalid or expired token", type: "error" });
  }
};

export const protect = requireAuth;
