import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminHeader, AdminMetric } from "@/components/AdminChrome";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import { categories, categoryLabels, type Category } from "@shared/vocabulary";
import type { ContentLesson, ContentPublishStatus, ContentSign } from "@shared/content";
import {
  ClipboardList,
  Download,
  History,
  MessageSquare,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
} from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  lessonsStarted: number;
  lessonsCompleted: number;
  recognitionAttempts: number;
  createdAt: string;
};

type FeedbackItem = {
  id: string;
  name: string;
  email: string;
  type: string;
  rating: number;
  subject: string;
  message: string;
  status: "new" | "reviewing" | "resolved" | "archived";
  adminNote: string;
  createdAt: string;
  username?: string;
  userFullName?: string;
};

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  adminEmail?: string;
  adminName?: string;
  createdAt: string;
};

const publishStatuses: ContentPublishStatus[] = [
  "draft",
  "ready",
  "published",
  "archived",
];

const blankLesson = (): ContentLesson => ({
  id: "",
  title: "",
  level: "beginner",
  category: "greeting",
  description: "",
  order: 0,
  targetCardCount: 0,
  requiredQuizScore: 100,
  recognitionRequired: false,
  signIds: [],
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function AdminOperations() {
  const { token, user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [signs, setSigns] = useState<ContentSign[]>([]);
  const [lessonForm, setLessonForm] = useState<ContentLesson>(blankLesson());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const loadOperations = async () => {
    if (!token || user?.role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [usersRes, feedbackRes, logsRes, lessonsRes, signsRes] =
      await Promise.all([
        fetch("/api/admin/users", { headers: authHeaders }),
        fetch("/api/admin/feedback", { headers: authHeaders }),
        fetch("/api/admin/audit-logs", { headers: authHeaders }),
        fetch("/api/content/lessons", { headers: authHeaders }),
        fetch("/api/content/signs", { headers: authHeaders }),
      ]);

    if (usersRes.ok) setUsers((await usersRes.json()).users || []);
    if (feedbackRes.ok) setFeedback((await feedbackRes.json()).feedback || []);
    if (logsRes.ok) setLogs((await logsRes.json()).logs || []);
    if (lessonsRes.ok) setLessons((await lessonsRes.json()).lessons || []);
    if (signsRes.ok) setSigns((await signsRes.json()).signs || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  const filteredUsers = users.filter((item) => {
    const text = `${item.email} ${item.username} ${item.fullName}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const matchingSigns = signs.filter((sign) => sign.category === lessonForm.category);

  const exportCsv = (name: string, rows: Array<Record<string, unknown>>) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateUser = async (
    id: string,
    payload: Partial<Pick<AdminUser, "role" | "status">>,
  ) => {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      toast({ title: "Update failed", description: error.error || "User was not updated." });
      return;
    }
    toast({ description: "User updated." });
    await loadOperations();
  };

  const updateFeedback = async (
    item: FeedbackItem,
    payload: Partial<Pick<FeedbackItem, "status" | "adminNote">>,
  ) => {
    const response = await fetch(`/api/admin/feedback/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        status: payload.status || item.status,
        adminNote: payload.adminNote ?? item.adminNote ?? "",
      }),
    });
    if (!response.ok) {
      toast({ title: "Update failed", description: "Feedback was not updated." });
      return;
    }
    toast({ description: "Feedback updated." });
    await loadOperations();
  };

  const toggleLessonSign = (signId: string, checked: boolean) => {
    setLessonForm((current) => ({
      ...current,
      signIds: checked
        ? Array.from(new Set([...current.signIds, signId]))
        : current.signIds.filter((id) => id !== signId),
    }));
  };

  const saveLesson = async () => {
    const isNew = !lessons.some((lesson) => lesson.id === lessonForm.id);
    const response = await fetch(
      isNew ? "/api/content/lessons" : `/api/content/lessons/${lessonForm.id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          ...lessonForm,
          targetCardCount: lessonForm.signIds.length,
        }),
      },
    );

    if (!response.ok) {
      toast({ title: "Save failed", description: "Check lesson fields." });
      return;
    }
    toast({ description: "Lesson saved." });
    setLessonForm(blankLesson());
    await loadOperations();
  };

  const deleteLesson = async (id: string) => {
    const response = await fetch(`/api/content/lessons/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!response.ok) {
      toast({ title: "Delete failed", description: "Lesson was not deleted." });
      return;
    }
    toast({ description: "Lesson deleted." });
    setLessonForm(blankLesson());
    await loadOperations();
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <Layout>
        <div className="ssl-app-page container max-w-7xl mx-auto py-10 px-4">
          <Card className="p-6 space-y-2">
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-muted-foreground">
              Operations tools are restricted to administrator accounts.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ssl-app-page container max-w-7xl mx-auto py-10 px-4 space-y-6">
        <AdminHeader
          title="Admin Operations"
          description="Manage access, review feedback, maintain lessons, and inspect the audit trail for admin actions."
          icon={<ClipboardList className="h-4 w-4" />}
          action={
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => exportCsv("admin-audit.csv", logs as unknown as Array<Record<string, unknown>>)}
            >
              <Download className="h-4 w-4" />
              Export Audit
            </Button>
          }
        />

        {loading ? (
          <Card className="p-6 text-muted-foreground">Loading admin tools...</Card>
        ) : (
          <Tabs defaultValue="users" className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminMetric label="Users" value={users.length} detail="registered accounts" />
              <AdminMetric
                label="Feedback"
                value={feedback.filter((item) => item.status !== "resolved").length}
                detail="open items"
              />
              <AdminMetric label="Lessons" value={lessons.length} detail="course units" />
              <AdminMetric label="Audit events" value={logs.length} detail="latest actions" />
            </div>

            <TabsList className="grid w-full grid-cols-4 rounded-lg">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative sm:w-80">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search users"
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => exportCsv("admin-users.csv", filteredUsers as unknown as Array<Record<string, unknown>>)}
                >
                  <Download className="h-4 w-4" />
                  Export Users
                </Button>
              </div>

              <div className="grid gap-3">
                {filteredUsers.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_160px_170px_220px] lg:items-center">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Users className="h-4 w-4" />
                          <p className="font-semibold">{item.fullName || item.username}</p>
                          <Badge variant={item.status === "active" ? "secondary" : "outline"}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Lessons {item.lessonsCompleted}/{item.lessonsStarted} - Recognition {item.recognitionAttempts}
                        </p>
                      </div>
                      <Select
                        value={item.role}
                        onValueChange={(role) => updateUser(item.id, { role: role as AdminUser["role"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">user</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={item.status}
                        onValueChange={(status) => updateUser(item.id, { status: status as AdminUser["status"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">active</SelectItem>
                          <SelectItem value="suspended">suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => exportCsv("feedback.csv", feedback as unknown as Array<Record<string, unknown>>)}
                >
                  <Download className="h-4 w-4" />
                  Export Feedback
                </Button>
              </div>
              <div className="grid gap-4">
                {feedback.map((item) => (
                  <Card key={item.id} className="p-4 space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <p className="font-semibold">{item.subject}</p>
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge variant={item.status === "resolved" ? "secondary" : "outline"}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.name || item.userFullName || item.username || "Anonymous"} - {item.email || "no email"} - {item.rating}/5
                        </p>
                      </div>
                      <Select
                        value={item.status}
                        onValueChange={(status) =>
                          updateFeedback(item, { status: status as FeedbackItem["status"] })
                        }
                      >
                        <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">new</SelectItem>
                          <SelectItem value="reviewing">reviewing</SelectItem>
                          <SelectItem value="resolved">resolved</SelectItem>
                          <SelectItem value="archived">archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm">{item.message}</p>
                    <Field label="Admin note">
                      <Textarea
                        defaultValue={item.adminNote}
                        rows={2}
                        onBlur={(event) => updateFeedback(item, { adminNote: event.target.value })}
                      />
                    </Field>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="grid gap-6 xl:grid-cols-[430px_1fr]">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Lesson Editor</h2>
                  <Button variant="outline" size="sm" onClick={() => setLessonForm(blankLesson())}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Field label="Lesson ID">
                  <Input
                    value={lessonForm.id}
                    onChange={(event) => setLessonForm({ ...lessonForm, id: event.target.value })}
                    disabled={lessons.some((lesson) => lesson.id === lessonForm.id)}
                  />
                </Field>
                <Field label="Title">
                  <Input
                    value={lessonForm.title}
                    onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Level">
                    <Select
                      value={lessonForm.level}
                      onValueChange={(level) => setLessonForm({ ...lessonForm, level: level as ContentLesson["level"] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">beginner</SelectItem>
                        <SelectItem value="intermediate">intermediate</SelectItem>
                        <SelectItem value="advanced">advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Category">
                    <Select
                      value={lessonForm.category}
                      onValueChange={(category) =>
                        setLessonForm({
                          ...lessonForm,
                          category: category as Category,
                          signIds: [],
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {categoryLabels[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={lessonForm.description}
                    onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Order">
                    <Input
                      type="number"
                      value={lessonForm.order}
                      onChange={(event) => setLessonForm({ ...lessonForm, order: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Quiz %">
                    <Input
                      type="number"
                      value={lessonForm.requiredQuizScore}
                      onChange={(event) => setLessonForm({ ...lessonForm, requiredQuizScore: Number(event.target.value) })}
                    />
                  </Field>
                </div>
                <Field label="Status">
                  <Select
                    value={lessonForm.status}
                    onValueChange={(status) => setLessonForm({ ...lessonForm, status: status as ContentPublishStatus })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {publishStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={lessonForm.recognitionRequired}
                    onCheckedChange={(checked) =>
                      setLessonForm({ ...lessonForm, recognitionRequired: checked === true })
                    }
                  />
                  Recognition required
                </label>
                <div className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Lesson signs</p>
                    <Badge variant="outline">{lessonForm.signIds.length} selected</Badge>
                  </div>
                  <div className="grid gap-2 max-h-56 overflow-auto pr-1">
                    {matchingSigns.map((sign) => (
                      <label key={sign.id} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={lessonForm.signIds.includes(sign.id)}
                          onCheckedChange={(checked) => toggleLessonSign(sign.id, checked === true)}
                        />
                        <span>
                          <span className="block font-medium">{sign.word}</span>
                          <span className="block text-xs text-muted-foreground">{sign.difficulty}</span>
                        </span>
                      </label>
                    ))}
                    {matchingSigns.length === 0 && (
                      <p className="text-sm text-muted-foreground">No signs in this category.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={!lessons.some((lesson) => lesson.id === lessonForm.id)}
                    onClick={() => deleteLesson(lessonForm.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button className="gap-2" onClick={saveLesson}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </Card>

              <div className="grid gap-3">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{lesson.title}</p>
                          <Badge variant={lesson.status === "published" ? "secondary" : "outline"}>
                            {lesson.status}
                          </Badge>
                          <Badge variant="outline">{lesson.level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {categoryLabels[lesson.category]} - {lesson.signIds.length} signs - quiz {lesson.requiredQuizScore}%
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setLessonForm({ ...lesson })}>
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <div className="grid gap-3">
                {logs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <History className="h-4 w-4" />
                          <p className="font-semibold">{log.action}</p>
                          <Badge variant="outline">{log.targetType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.targetId} - {log.detail || "no detail"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.adminName || log.adminEmail || "Admin"} - {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
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
