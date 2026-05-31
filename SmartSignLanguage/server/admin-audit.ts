import type Database from "better-sqlite3";
import type { Request } from "express";

export function writeAdminAudit(
  db: Database.Database,
  req: Request,
  action: string,
  targetType: string,
  targetId: string,
  detail = "",
) {
  db.prepare(
    `
      INSERT INTO admin_audit_logs (
        id, adminUserId, action, targetType, targetId, detail, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    req.user?.userId || null,
    action,
    targetType,
    targetId,
    detail,
    new Date().toISOString(),
  );
}
