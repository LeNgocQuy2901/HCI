import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./db";
import authRoutes from "./routes/auth";

export function createServer() {
  const app = express();

  // Initialize database
  initializeDatabase();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.use("/api/auth", authRoutes);

  return app;
}
