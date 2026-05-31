import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/Layout";
import { PremiumPageHeader } from "@/components/PremiumPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import {
  BarChart3,
  BookOpen,
  KeyRound,
  LogOut,
  Loader2,
  Mail,
  Upload,
  User as UserIcon,
} from "lucide-react";

const defaultAvatars = Array.from(
  { length: 24 },
  (_, index) => `/img/avatar/${index + 1}.jfif`,
);

const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(100, "New password must be at most 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function getResponseError(response: Response, fallback: string) {
  const result = await response.json();
  if (typeof result.error === "string") return result.error;
  if (Array.isArray(result.error)) {
    return result.error[0]?.message || fallback;
  }
  return fallback;
}

function resizeAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("Unable to read the selected image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("The selected file is not a valid image"));
      image.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process the selected image"));
          return;
        }

        const sourceSize = Math.min(image.width, image.height);
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = (image.height - sourceSize) / 2;
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, getCurrentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || defaultAvatars[0],
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      currentPassword: "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
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
      setAvatarUrl(user.avatarUrl || defaultAvatars[0]);
      resetProfile({
        fullName: user.fullName,
        email: user.email,
        currentPassword: "",
      });
    }
  }, [user, resetProfile]);

  const saveAvatar = async () => {
    setIsSavingAvatar(true);
    try {
      const response = await fetch("/api/auth/me/avatar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Unable to update avatar"),
        );
      }

      const result = await response.json();
      useAuthStore.setState({ user: result.user });
      useAuthStore.getState().saveToStorage();
      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to update avatar"),
        variant: "destructive",
      });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Please select an image smaller than 5 MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setAvatarUrl(await resizeAvatar(file));
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to process avatar"),
        variant: "destructive",
      });
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
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
        throw new Error(
          await getResponseError(response, "Unable to update profile"),
        );
      }

      const result = await response.json();
      useAuthStore.setState({ user: result.user, token: result.token });
      useAuthStore.getState().saveToStorage();
      resetProfile({
        fullName: result.user.fullName,
        email: result.user.email,
        currentPassword: "",
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to update profile"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/auth/me/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Unable to change password"),
        );
      }

      resetPassword();
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to change password"),
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
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
        <div className="ssl-app-page flex min-h-screen items-center justify-center">
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
      <div className="ssl-app-page px-4 py-7">
        <div className="ssl-page-shell space-y-5">
          <PremiumPageHeader
            eyebrow="Personal account"
            title="Your Profile"
            description="Keep your personal details current and manage your account security from one calm, private workspace."
            icon={<UserIcon className="h-6 w-6" />}
          />
          <Card className="mx-auto w-full max-w-2xl rounded-[26px] border-white/70 bg-white/75 p-6 shadow-xl shadow-violet-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/65">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 pb-6 border-b">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-md">
                  <img
                    src={user.avatarUrl || defaultAvatars[0]}
                    alt={`${user.fullName} avatar`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.fullName}</h1>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <section className="space-y-4 border-t pt-6">
                <div>
                  <h2 className="text-lg font-semibold">Choose Your Avatar</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick a default avatar or upload a square photo from your
                    device.
                  </p>
                </div>
                <div className="flex flex-col gap-5 sm:flex-row">
                  <img
                    src={avatarUrl}
                    alt="Selected avatar preview"
                    className="h-28 w-28 rounded-[26px] object-cover shadow-lg shadow-violet-950/10"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
                      {defaultAvatars.map((defaultAvatar) => (
                        <button
                          key={defaultAvatar}
                          type="button"
                          onClick={() => setAvatarUrl(defaultAvatar)}
                          className={`overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5 ${
                            avatarUrl === defaultAvatar
                              ? "border-violet-500 shadow-md shadow-violet-500/20"
                              : "border-transparent"
                          }`}
                          aria-label={`Select avatar ${defaultAvatar}`}
                        >
                          <img
                            src={defaultAvatar}
                            alt=""
                            className="aspect-square w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        Upload From Device
                      </Button>
                      <Button
                        type="button"
                        className="gap-2"
                        disabled={isSavingAvatar}
                        onClick={saveAvatar}
                      >
                        {isSavingAvatar && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Save Avatar
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

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

              <form
                onSubmit={handleProfileSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Personal Information
                  </h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    {...registerProfile("fullName")}
                  />
                  {profileErrors.fullName && (
                    <p className="text-sm text-destructive">
                      {profileErrors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...registerProfile("email")}
                  />
                  {profileErrors.email && (
                    <p className="text-sm text-destructive">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileCurrentPassword">
                    Current Password
                  </Label>
                  <Input
                    id="profileCurrentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...registerProfile("currentPassword")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required only when changing your email address.
                  </p>
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

              <form
                onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                className="space-y-4 border-t pt-6"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Change Password</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...registerPassword("currentPassword")}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...registerPassword("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing password...
                    </>
                  ) : (
                    "Change Password"
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
      </div>
    </Layout>
  );
}
