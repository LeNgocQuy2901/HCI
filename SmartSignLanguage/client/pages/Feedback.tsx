import { useState } from "react";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import { MessageSquare, Send } from "lucide-react";

type FeedbackForm = {
  name: string;
  email: string;
  type: string;
  rating: string;
  subject: string;
  message: string;
};

type FeedbackField = keyof Pick<FeedbackForm, "email" | "subject" | "message">;
type FeedbackErrors = Partial<Record<FeedbackField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFeedback(form: FeedbackForm): FeedbackErrors {
  const errors: FeedbackErrors = {};
  const email = form.email.trim();
  const subject = form.subject.trim();
  const message = form.message.trim();

  if (email && !emailPattern.test(email)) {
    errors.email = "Enter a valid email address or leave this field empty.";
  }
  if (subject.length < 3) {
    errors.subject = "Subject must contain at least 3 characters.";
  } else if (subject.length > 140) {
    errors.subject = "Subject must contain at most 140 characters.";
  }
  if (message.length < 10) {
    errors.message = "Message must contain at least 10 characters.";
  } else if (message.length > 2000) {
    errors.message = "Message must contain at most 2000 characters.";
  }

  return errors;
}

function getResponseError(body: unknown) {
  if (!body || typeof body !== "object" || !("error" in body)) {
    return "Unable to send feedback. Please try again.";
  }

  const error = body.error;
  if (typeof error === "string") return error;
  if (!Array.isArray(error)) return "Unable to send feedback. Please try again.";

  return error
    .map((item) => {
      if (!item || typeof item !== "object" || !("message" in item)) return "";
      return String(item.message);
    })
    .filter(Boolean)
    .join(" ");
}

export default function Feedback() {
  const { toast } = useToast();
  const { token, user } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    type: "general",
    rating: "5",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FeedbackErrors>({});

  const submitFeedback = async () => {
    const nextErrors = validateFeedback(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({
        title: "Could not send feedback",
        description: "Please correct the highlighted fields.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast({
          title: "Could not send feedback",
          description: getResponseError(body),
        });
        return;
      }

      toast({ description: "Feedback sent. Thank you for helping improve the app." });
      setErrors({});
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } catch (error) {
      console.error("Failed to send feedback:", error);
      toast({
        title: "Could not send feedback",
        description: "Unable to reach the server. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="ssl-app-page container max-w-3xl mx-auto py-10 px-4 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-7 w-7" />
            <h1 className="text-3xl font-bold">Send Feedback</h1>
          </div>
          <p className="text-muted-foreground">
            Report content issues, recognition problems, bugs, or feature ideas.
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value });
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError message={errors.email} />
            </Field>
            <Field label="Type">
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Bug report</SelectItem>
                  <SelectItem value="content">Content issue</SelectItem>
                  <SelectItem value="recognition">Recognition issue</SelectItem>
                  <SelectItem value="feature">Feature request</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rating">
              <Select value={form.rating} onValueChange={(rating) => setForm({ ...form, rating })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Okay</SelectItem>
                  <SelectItem value="2">2 - Needs work</SelectItem>
                  <SelectItem value="1">1 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Subject">
            <Input
              value={form.subject}
              onChange={(event) => {
                setForm({ ...form, subject: event.target.value });
                setErrors((current) => ({ ...current, subject: undefined }));
              }}
              placeholder="Short summary"
              maxLength={140}
              aria-invalid={Boolean(errors.subject)}
            />
            <FieldError message={errors.subject} />
          </Field>
          <Field label="Message">
            <Textarea
              value={form.message}
              onChange={(event) => {
                setForm({ ...form, message: event.target.value });
                setErrors((current) => ({ ...current, message: undefined }));
              }}
              rows={7}
              placeholder="Describe what happened, where you saw it, and what you expected."
              maxLength={2000}
              aria-invalid={Boolean(errors.message)}
            />
            <div className="flex items-center justify-between gap-3">
              <FieldError message={errors.message} />
              <span className="ml-auto text-xs text-muted-foreground">
                {form.message.trim().length}/2000 characters, minimum 10
              </span>
            </div>
          </Field>
          <div className="flex justify-end">
            <Button className="gap-2" onClick={submitFeedback} disabled={submitting}>
              <Send className="h-4 w-4" />
              Send feedback
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}
