import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDatabase } from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { writeAdminAudit } from "../admin-audit";

const router = Router();

router.use(requireAuth, requireAdmin);

const userUpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

const feedbackUpdateSchema = z.object({
  status: z.enum(["new", "reviewing", "resolved", "archived"]),
  adminNote: z.string().max(1000).optional().default(""),
});

router.get("/users", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT
            u.id, u.email, u.username, u.fullName, u.avatarUrl, u.role,
            u.status, u.createdAt, u.updatedAt,
            COUNT(DISTINCT ulp.lessonId) AS lessonsStarted,
            COUNT(DISTINCT CASE WHEN ulp.status = 'completed' THEN ulp.lessonId END) AS lessonsCompleted,
            COUNT(urp.id) AS recognitionAttempts
          FROM users u
          LEFT JOIN user_lesson_progress ulp ON ulp.userId = u.id
          LEFT JOIN user_recognition_practice urp ON urp.userId = u.id
          GROUP BY u.id
          ORDER BY u.createdAt DESC
        `,
      )
      .all();

    return res.json({ users: rows });
  } finally {
    db.close();
  }
});

router.patch("/users/:id", (req: Request, res: Response) => {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  if (req.params.id === req.user?.userId && parsed.data.status === "suspended") {
    return res.status(400).json({ error: "You cannot suspend your own account" });
  }

  const db = getDatabase();
  try {
    const current = db
      .prepare("SELECT role, status FROM users WHERE id = ?")
      .get(req.params.id) as { role: string; status: string } | undefined;
    if (!current) return res.status(404).json({ error: "User not found" });

    const nextRole = parsed.data.role || current.role;
    const nextStatus = parsed.data.status || current.status || "active";
    db.prepare("UPDATE users SET role = ?, status = ?, updatedAt = ? WHERE id = ?").run(
      nextRole,
      nextStatus,
      new Date().toISOString(),
      req.params.id,
    );
    writeAdminAudit(
      db,
      req,
      "user.updated",
      "user",
      req.params.id,
      `role=${nextRole}; status=${nextStatus}`,
    );
    return res.json({ message: "User updated" });
  } finally {
    db.close();
  }
});

router.get("/feedback", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT f.*, u.username, u.fullName AS userFullName
          FROM feedback f
          LEFT JOIN users u ON u.id = f.userId
          ORDER BY f.createdAt DESC
        `,
      )
      .all();
    return res.json({ feedback: rows });
  } finally {
    db.close();
  }
});

router.patch("/feedback/:id", (req: Request, res: Response) => {
  const parsed = feedbackUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  try {
    const result = db
      .prepare(
        "UPDATE feedback SET status = ?, adminNote = ?, updatedAt = ? WHERE id = ?",
      )
      .run(
        parsed.data.status,
        parsed.data.adminNote,
        new Date().toISOString(),
        req.params.id,
      );
    if (result.changes === 0) return res.status(404).json({ error: "Feedback not found" });
    writeAdminAudit(
      db,
      req,
      "feedback.updated",
      "feedback",
      req.params.id,
      `status=${parsed.data.status}`,
    );
    return res.json({ message: "Feedback updated" });
  } finally {
    db.close();
  }
});

router.get("/audit-logs", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT l.*, u.email AS adminEmail, u.fullName AS adminName
          FROM admin_audit_logs l
          LEFT JOIN users u ON u.id = l.adminUserId
          ORDER BY l.createdAt DESC
          LIMIT 200
        `,
      )
      .all();
    return res.json({ logs: rows });
  } finally {
    db.close();
  }
});

export default router;
