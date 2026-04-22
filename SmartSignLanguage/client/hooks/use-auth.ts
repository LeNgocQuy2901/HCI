import { create } from "zustand";
import { User } from "@shared/api";

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });

      get().saveToStorage();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, username, password, fullName) => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, fullName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });

      get().saveToStorage();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  },

  getCurrentUser: async () => {
    const state = get();
    if (!state.token) return;

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });

      if (!response.ok) {
        state.logout();
        return;
      }

      const data = await response.json();
      set({ user: data.user });
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  },

  saveToStorage: () => {
    const state = get();
    if (state.token) {
      localStorage.setItem("auth_token", state.token);
    }
    if (state.user) {
      localStorage.setItem("auth_user", JSON.stringify(state.user));
    }
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Failed to load auth from storage:", error);
      }
    }
  },
}));
