import "./global.css";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/hooks/use-auth";
import { useLearningStore } from "@/hooks/use-learning-store";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Learn from "./pages/Learn";
import Lookup from "./pages/Lookup";
import Translate from "./pages/Translate";
import Recognition from "./pages/Recognition";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feedback from "./pages/Feedback";
import AdminContent from "./pages/AdminContent";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminOperations from "./pages/AdminOperations";

const queryClient = new QueryClient();

function AppContent() {
  const { loadFromStorage, getCurrentUser, token, user, isAuthenticated } =
    useAuthStore();
  const { syncFromServer } = useLearningStore();

  useEffect(() => {
    // Load auth state from localStorage on app start (once on mount)
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      void syncFromServer(user.id);
    }
  }, [isAuthenticated, user?.id, syncFromServer]);

  useEffect(() => {
    if (token) {
      void getCurrentUser();
    }
  }, [token, getCurrentUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/learn/*" element={<Learn />} />
              <Route path="/lookup" element={<Lookup />} />
              <Route path="/translate" element={<Translate />} />
              <Route path="/recognition" element={<Recognition />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/operations" element={<AdminOperations />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const App = AppContent;

createRoot(document.getElementById("root")!).render(<App />);
