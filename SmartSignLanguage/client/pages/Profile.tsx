import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import {
  BarChart3,
  BookOpen,
  LogOut,
  Loader2,
  User as UserIcon,
} from "lucide-react";

const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be at most 100 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, getCurrentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadUser = async () => {
      await getCurrentUser();
      setIsLoading(false);
    };

    loadUser();
  }, [isAuthenticated, navigate, getCurrentUser]);

  useEffect(() => {
    if (user) {
      reset({ fullName: user.fullName });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Unable to update profile");
      }

      const result = await response.json();
      useAuthStore.setState({ user: result.user });
      useAuthStore.getState().saveToStorage();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unable to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast({
      title: "Success",
      description: "Signed out successfully",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4 pb-6 border-b">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.fullName}</h1>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Member Since</p>
              <p>
                {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild>
                <Link to="/learn" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learn
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" type="text" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
