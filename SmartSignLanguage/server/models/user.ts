import { z } from "zod";
import bcryptjs from "bcryptjs";
import { getDatabase } from "../db";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be at most 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  password: string;
}

export class UserService {
  private db = getDatabase();

  private getConfiguredAdminEmails(): Set<string> {
    return new Set(
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  private resolveInitialRole(email: string): "user" | "admin" {
    return this.getConfiguredAdminEmails().has(email.toLowerCase())
      ? "admin"
      : "user";
  }

  generateId(): string {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }

  async createUser(
    email: string,
    username: string,
    password: string,
    fullName: string
  ): Promise<User> {
    // Check if user already exists
    const existing = this.db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .get(email, username);

    if (existing) {
      throw new Error("Email or username already exists");
    }

    const id = this.generateId();
    const hashedPassword = await this.hashPassword(password);
    const now = new Date().toISOString();

    const role = this.resolveInitialRole(email);

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, username, password, fullName, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, username, hashedPassword, fullName, role, now, now);

    return {
      id,
      email,
      username,
      fullName,
      role,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    const user = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as UserWithPassword | undefined;

    if (user && this.getConfiguredAdminEmails().has(user.email.toLowerCase()) && user.role !== "admin") {
      this.db
        .prepare("UPDATE users SET role = 'admin', updatedAt = ? WHERE id = ?")
        .run(new Date().toISOString(), user.id);
      user.role = "admin";
    }

    return user || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.db
      .prepare(
        "SELECT id, email, username, fullName, role, createdAt, updatedAt FROM users WHERE id = ?"
      )
      .get(id) as User | undefined;

    return user || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.fullName) {
      updates.push("fullName = ?");
      values.push(data.fullName);
    }

    if (updates.length === 0) {
      return (await this.getUserById(id)) as User;
    }

    updates.push("updatedAt = ?");
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    );

    stmt.run(...values);

    return (await this.getUserById(id)) as User;
  }

  async deleteUser(id: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM users WHERE id = ?");
    stmt.run(id);
  }
}
