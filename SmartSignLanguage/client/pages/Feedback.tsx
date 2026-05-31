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

  const submitFeedback = async () => {
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
        toast({
          title: "Could not send feedback",
          description: "Please check the subject and message.",
        });
        return;
      }

      toast({ description: "Feedback sent. Thank you for helping improve the app." });
      setForm((current) => ({ ...current, subject: "", message: "" }));
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
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
              />
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
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              placeholder="Short summary"
            />
          </Field>
          <Field label="Message">
            <Textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              rows={7}
              placeholder="Describe what happened, where you saw it, and what you expected."
            />
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
