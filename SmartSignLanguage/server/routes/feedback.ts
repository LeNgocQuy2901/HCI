import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDatabase } from "../db";
import { optionalAuthMiddleware } from "../middleware/auth";

const router = Router();

const feedbackSchema = z.object({
  name: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  type: z
    .enum(["general", "bug", "content", "recognition", "feature"])
    .default("general"),
  rating: z.coerce.number().int().min(0).max(5).default(0),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(10).max(2000),
});

router.post("/", optionalAuthMiddleware, (req: Request, res: Response) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }

  const db = getDatabase();
  const now = new Date().toISOString();
  const id = `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    db.prepare(
      `
        INSERT INTO feedback (
          id, userId, name, email, type, rating, subject, message, status,
          adminNote, createdAt, updatedAt
        )
        VALUES (
          @id, @userId, @name, @email, @type, @rating, @subject, @message,
          'new', '', @createdAt, @updatedAt
        )
      `,
    ).run({
      id,
      userId: req.user?.userId || null,
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ message: "Feedback submitted", id });
  } finally {
    db.close();
  }
});

export default router;
