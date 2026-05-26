/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth request types
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Auth response types
 */
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface UserResponse {
  user: User;
}

