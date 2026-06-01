import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken, TokenPayload } from "../auth";
import { getDatabase } from "../db";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const db = getDatabase();
  try {
    const user = db
      .prepare("SELECT status FROM users WHERE id = ?")
      .get(payload.userId) as { status?: string } | undefined;
    if (user?.status === "suspended") {
      return res.status(403).json({ error: "Account has been suspended" });
    }
  } finally {
    db.close();
  }

  req.user = payload;
  next();
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return authMiddleware(req, res, next);
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const db = getDatabase();
  try {
    const user = db
      .prepare("SELECT role FROM users WHERE id = ?")
      .get(req.user.userId) as { role?: string } | undefined;

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user.role = "admin";
    next();
  } finally {
    db.close();
  }
}
