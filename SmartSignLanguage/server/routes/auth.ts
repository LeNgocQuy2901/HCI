import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  UserService,
  registerSchema,
  loginSchema,
  User,
} from "../models/user";
import { generateToken } from "../auth";

const router = Router();
const userService = new UserService();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const user = await userService.createUser(
      data.email,
      data.username,
      data.password,
      data.fullName
    );

    const token = generateToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }

    if (error.message === "Email or username already exists") {
      return res.status(409).json({ error: error.message });
    }

    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await userService.getUserByEmail(data.email);

    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    const passwordMatch = await userService.verifyPassword(
      data.password,
      user.password
    );

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    const userResponse: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }

    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.user!.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT /api/auth/me
router.put("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fullName } = req.body;

    const updatedUser = await userService.updateUser(req.user!.userId, {
      fullName,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  // JWT logout is just client-side: remove token from storage
  return res.status(200).json({ message: "Logout successful" });
});

export default router;
