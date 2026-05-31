import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  UserService,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
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
      data.fullName,
    );

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await userService.verifyPassword(
      data.password,
      user.password,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userResponse: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
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
    const data = updateProfileSchema.parse(req.body);

    const updatedUser = await userService.updateUser(req.user!.userId, {
      email: data.email!,
      fullName: data.fullName!,
      currentPassword: data.currentPassword,
    });
    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
      token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Email already exists") {
      return res.status(409).json({ error: error.message });
    }
    if (
      error.message === "Current password is required to change email" ||
      error.message === "Current password is incorrect"
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Update user error:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// PUT /api/auth/me/password
router.put(
  "/me/password",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const data = changePasswordSchema.parse(req.body);

      await userService.changePassword(
        req.user!.userId,
        data.currentPassword,
        data.newPassword,
      );

      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Current password is incorrect") {
        return res.status(400).json({ error: error.message });
      }

      console.error("Change password error:", error);
      return res.status(500).json({ error: "Failed to change password" });
    }
  },
);

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  // JWT logout is just client-side: remove token from storage
  return res.status(200).json({ message: "Logout successful" });
});

export default router;
