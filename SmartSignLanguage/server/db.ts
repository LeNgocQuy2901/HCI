import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "app.db");

// Ensure data directory exists
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  console.error("Failed to create data directory:", error);
}

export function initializeDatabase() {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create learning progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      cardId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      attempts INTEGER NOT NULL DEFAULT 0,
      lastReviewed TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, cardId)
    )
  `);

  console.log("✅ Database initialized successfully at", dbPath);
  return db;
}

export function getDatabase() {
  return new Database(dbPath);
}
