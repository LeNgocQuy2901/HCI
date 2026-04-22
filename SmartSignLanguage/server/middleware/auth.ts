import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken, TokenPayload } from "../auth";

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
