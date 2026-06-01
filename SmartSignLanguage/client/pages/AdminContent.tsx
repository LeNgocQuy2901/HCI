import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AdminHeader, AdminMetric } from "@/components/AdminChrome";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth";
import {
  categories,
  categoryLabels,
  difficulties,
  difficultyLabels,
  type Category,
  type Difficulty,
} from "@shared/vocabulary";
import type {
  ContentLesson,
  ContentQuizQuestion,
  ContentSign,
  ContentSignMetadata,
  ContentQuizType,
  ContentPublishStatus,
  QuizPublishStatus,
  SignCompleteness,
} from "@shared/content";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  Save,
  Search,
  Trash2,
  Video,
} from "lucide-react";

type SignDetail = {
  sign: ContentSign;
  metadata: ContentSignMetadata;
  lessonIds: string[];
  quizQuestions: ContentQuizQuestion[];
};

const quizTypeLabels: Record<ContentQuizType, string> = {
  meaning_quiz: "Meaning quiz",
  video_to_word: "Video to word",
  word_to_sign: "Word to sign",
  common_mistake: "Common mistake",
};

const publishStatuses: ContentPublishStatus[] = [
  "draft",
  "ready",
  "published",
  "archived",
];

const quizStatuses: QuizPublishStatus[] = [
  "draft",
  "ready",
  "active",
  "published",
  "archived",
];

const blankSign = (): ContentSign => {
  const now = new Date().toISOString();
  return {
    id: "",
    word: "",
    category: "greeting",
    difficulty: "beginner",
    description: "",
    example: "",
    videoUrl: "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
};

const blankMetadata = (signId = ""): ContentSignMetadata => ({
  signId,
  instruction: "",
  commonMistakes: [],
  practiceTips: [],
  exampleSentences: [],
  updatedAt: "",
});

const blankQuizQuestion = (
  signId = "",
  lessonId = "",
  difficulty: ContentQuizQuestion["difficulty"] = "beginner",
): ContentQuizQuestion => {
  const now = new Date().toISOString();
  return {
    id: "",
    signId,
    lessonId,
    type: "meaning_quiz",
    question: "",
    options: [],
    correctAnswer: "",
    explanation: "",
    difficulty,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
};

const linesToArray = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const arrayToLines = (items: string[] = []) => items.join("\n");

export default function AdminContent() {
  const { toast } = useToast();
  const { token, user, isAuthenticated } = useAuthStore();
  const [signs, setSigns] = useState<ContentSign[]>([]);
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [completeness, setCompleteness] = useState<SignCompleteness[]>([]);
  const [summary, setSummary] = useState({
    totalSigns: 0,
    completeSigns: 0,
    missingVideo: 0,
    missingMetadata: 0,
    missingQuizCoverage: 0,
    averageScore: 0,
  });
  const [selectedId, setSelectedId] = useState("");
  const [signForm, setSignForm] = useState<ContentSign>(blankSign());
  const [metadataForm, setMetadataForm] =
    useState<ContentSignMetadata>(blankMetadata());
  const [lessonIds, setLessonIds] = useState<string[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<ContentQuizQuestion[]>([]);
  const [quizForm, setQuizForm] =
    useState<ContentQuizQuestion>(blankQuizQuestion());
  const [previewQuiz, setPreviewQuiz] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [publishStatusFilter, setPublishStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const selectedCompleteness = completeness.find(
    (item) => item.signId === selectedId,
  );

  const lessonIdsBySign = useMemo(() => {
    const map = new Map<string, string[]>();
    lessons.forEach((lesson) => {
      lesson.signIds.forEach((signId) => {
        map.set(signId, [...(map.get(signId) || []), lesson.id]);
      });
    });
    return map;
  }, [lessons]);

  const getImpactRank = (item: SignCompleteness) => {
    const itemLessonIds = lessonIdsBySign.get(item.signId) || [];
    const lessonRank = itemLessonIds.some((id) => id.startsWith("beginner-"))
      ? 0
      : item.lessonCount > 0
        ? 1
        : 2;
    const categoryRank = ["greeting", "family", "colors"].includes(
      item.category,
    )
      ? 0
      : 1;
    const wordRank = [
      "alphabet",
      "letter",
      "number",
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ].some((token) => item.word.toLowerCase().includes(token))
      ? 0
      : 1;

    return lessonRank * 100 + categoryRank * 10 + wordRank;
  };

  const filteredCompleteness = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return completeness
      .filter((item) => {
        const matchesQuery =
          !normalized ||
          item.word.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "complete" && item.missing.length === 0) ||
          (statusFilter === "missing-video" && !item.hasVideo) ||
          (statusFilter === "missing-metadata" && !item.hasMetadata) ||
          (statusFilter === "missing-quiz" && !item.hasQuizCoverage) ||
          (statusFilter === "low-score" && item.score < 50) ||
          (statusFilter === "ready-to-publish" && item.readyToPublish) ||
          (statusFilter === "cannot-publish" && !item.readyToPublish);
        const matchesPublishStatus =
          publishStatusFilter === "all" || item.status === publishStatusFilter;
        const matchesPriority =
          priorityFilter === "all" ||
          (priorityFilter === "high-impact" && getImpactRank(item) < 100) ||
          (priorityFilter === "beginner" &&
            (lessonIdsBySign.get(item.signId) || []).some((id) =>
              id.startsWith("beginner-"),
            )) ||
          (priorityFilter === "foundation" &&
            ["greeting", "family", "colors"].includes(item.category));
        return (
          matchesQuery &&
          matchesStatus &&
          matchesPriority &&
          matchesPublishStatus
        );
      })
      .sort((a, b) => {
        const impactDelta = getImpactRank(a) - getImpactRank(b);
        if (impactDelta !== 0) return impactDelta;
        return a.score - b.score;
      });
  }, [
    completeness,
    lessonIdsBySign,
    priorityFilter,
    publishStatusFilter,
    query,
    statusFilter,
  ]);

  const loadContent = async () => {
    if (!token || user?.role !== "admin") {
      setLoading(false);
      setAccessDenied(true);
      return;
    }

    setLoading(true);
    setAccessDenied(false);
    const [signsResponse, lessonsResponse, completenessResponse] =
      await Promise.all([
        fetch("/api/content/signs", { headers: authHeaders }),
        fetch("/api/content/lessons", { headers: authHeaders }),
        fetch("/api/content/completeness", { headers: authHeaders }),
      ]);

    if (
      signsResponse.status === 401 ||
      signsResponse.status === 403 ||
      lessonsResponse.status === 401 ||
      lessonsResponse.status === 403 ||
      completenessResponse.status === 401 ||
      completenessResponse.status === 403
    ) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const signsData = await signsResponse.json();
    const lessonsData = await lessonsResponse.json();
    const completenessData = await completenessResponse.json();

    setSigns(signsData.signs || []);
    setLessons(lessonsData.lessons || []);
    setCompleteness(completenessData.completeness || []);
    setSummary(completenessData.summary || summary);

    const nextSelectedId =
      selectedId ||
      signsData.signs?.[0]?.id ||
      completenessData.completeness?.[0]?.signId;
    if (nextSelectedId) {
      await loadSignDetail(nextSelectedId);
    }

    setLoading(false);
  };

  const loadSignDetail = async (id: string) => {
    if (!token) return;
    const response = await fetch(`/api/content/signs/${id}`, {
      headers: authHeaders,
    });
    if (!response.ok) return;
    const detail = (await response.json()) as SignDetail;
    setSelectedId(id);
    setSignForm(detail.sign);
    setMetadataForm(detail.metadata || blankMetadata(id));
    setLessonIds(detail.lessonIds || []);
    setQuizQuestions(detail.quizQuestions || []);
    setQuizForm(
      blankQuizQuestion(
        id,
        detail.lessonIds?.[0] || lessons[0]?.id || "",
        detail.sign.difficulty,
      ),
    );
  };

  useEffect(() => {
    void loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  const createNewSign = () => {
    setSelectedId("");
    setSignForm(blankSign());
    setMetadataForm(blankMetadata());
    setLessonIds([]);
    setQuizQuestions([]);
    setQuizForm(blankQuizQuestion());
  };

  const saveSign = async () => {
    const isNew = !selectedId;
    const payload = {
      ...signForm,
      id: signForm.id.trim(),
      word: signForm.word.trim(),
      videoUrl: signForm.videoUrl?.trim() || "",
    };

    const response = await fetch(
      isNew ? "/api/content/signs" : `/api/content/signs/${selectedId}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      toast({ title: "Save failed", description: "Check required fields." });
      return;
    }

    const signId = isNew ? payload.id : selectedId;
    await Promise.all([
      fetch(`/api/content/signs/${signId}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(metadataForm),
      }),
      fetch(`/api/content/signs/${signId}/lessons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ lessonIds }),
      }),
    ]);

    toast({ description: "Content saved." });
    setSelectedId(signId);
    await loadContent();
  };

  const deleteSign = async () => {
    if (!selectedId) return;
    const response = await fetch(`/api/content/signs/${selectedId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!response.ok) {
      toast({ title: "Delete failed", description: "Sign was not deleted." });
      return;
    }
    toast({ description: "Sign deleted." });
    setSelectedId("");
    setSignForm(blankSign());
    setMetadataForm(blankMetadata());
    setLessonIds([]);
    setQuizQuestions([]);
    setQuizForm(blankQuizQuestion());
    await loadContent();
  };

  const toggleLesson = (lessonId: string, checked: boolean) => {
    setLessonIds((current) =>
      checked
        ? Array.from(new Set([...current, lessonId]))
        : current.filter((id) => id !== lessonId),
    );
  };

  const editQuizQuestion = (question: ContentQuizQuestion) => {
    setQuizForm(question);
    setPreviewQuiz(false);
  };

  const startNewQuizQuestion = () => {
    setQuizForm(
      blankQuizQuestion(
        selectedId || signForm.id,
        lessonIds[0] || lessons[0]?.id || "",
        signForm.difficulty,
      ),
    );
    setPreviewQuiz(false);
  };

  const saveQuizQuestion = async () => {
    const signId = selectedId || signForm.id;
    if (!signId) {
      toast({
        title: "Save sign first",
        description: "A quiz question needs a sign ID.",
      });
      return;
    }

    const payload = {
      ...quizForm,
      signId,
      lessonId: quizForm.lessonId || lessonIds[0] || lessons[0]?.id || "",
      options: quizForm.options.filter(Boolean),
    };

    const response = await fetch(
      quizForm.id
        ? `/api/content/quiz-questions/${quizForm.id}`
        : "/api/content/quiz-questions",
      {
        method: quizForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      toast({
        title: "Quiz save failed",
        description: "Check the question, options, and answer.",
      });
      return;
    }

    toast({ description: "Quiz question saved." });
    await loadSignDetail(signId);
    await loadContent();
  };

  const deleteQuizQuestion = async (id: string) => {
    const response = await fetch(`/api/content/quiz-questions/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (!response.ok) {
      toast({
        title: "Delete failed",
        description: "Quiz question was not deleted.",
      });
      return;
    }

    toast({ description: "Quiz question deleted." });
    await loadSignDetail(selectedId);
    await loadContent();
  };

  const updateLessonStatus = async (
    lessonId: string,
    status: ContentPublishStatus,
  ) => {
    const response = await fetch(`/api/content/lessons/${lessonId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      toast({
        title: "Status update failed",
        description: "Lesson status was not changed.",
      });
      return;
    }

    toast({ description: "Lesson status updated." });
    await loadContent();
  };

  return (
    <Layout>
      <div className="ssl-app-page container max-w-7xl mx-auto py-10 px-4 space-y-6">
        {!isAuthenticated || accessDenied || user?.role !== "admin" ? (
          <Card className="p-6 space-y-3">
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-muted-foreground">
              Content management is restricted to administrator accounts.
            </p>
          </Card>
        ) : (
          <>
            <AdminHeader
              title="Content Management"
              description="Edit vocabulary, metadata, media, lesson placement, and quiz coverage before publishing signs to learners."
              icon={<FileText className="h-4 w-4" />}
              action={
                <Button className="gap-2" onClick={createNewSign}>
                  <Plus className="h-4 w-4" />
                  New sign
                </Button>
              }
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <AdminMetric label="Signs" value={summary.totalSigns} detail="total library" />
              <AdminMetric label="Complete" value={summary.completeSigns} detail="ready assets" />
              <AdminMetric label="Missing video" value={summary.missingVideo} detail="needs media" />
              <AdminMetric
                label="Missing metadata"
                value={summary.missingMetadata}
                detail="needs guidance"
              />
              <AdminMetric
                label="Quality score"
                value={`${summary.averageScore}%`}
                detail="content health"
              />
            </div>

            <div className="grid xl:grid-cols-[420px_1fr] gap-6">
              <Card className="p-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_180px] xl:grid-cols-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search signs"
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="missing-video">
                        Missing video
                      </SelectItem>
                      <SelectItem value="missing-metadata">
                        Missing metadata
                      </SelectItem>
                      <SelectItem value="missing-quiz">Missing quiz</SelectItem>
                      <SelectItem value="low-score">
                        Low completeness score
                      </SelectItem>
                      <SelectItem value="ready-to-publish">
                        Ready to publish
                      </SelectItem>
                      <SelectItem value="cannot-publish">
                        Cannot publish
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={publishStatusFilter}
                    onValueChange={setPublishStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All publish states</SelectItem>
                      {publishStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="high-impact">
                        High impact first
                      </SelectItem>
                      <SelectItem value="beginner">Beginner lessons</SelectItem>
                      <SelectItem value="foundation">
                        Greetings, family, colors
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 max-h-[760px] overflow-auto pr-1">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading content...
                    </p>
                  ) : (
                    filteredCompleteness.map((item) => (
                      <div
                        key={item.signId}
                        className={`w-full text-left rounded-md border p-3 transition-colors hover:bg-muted ${
                          item.signId === selectedId
                            ? "border-primary bg-muted"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.word}</p>
                            <p className="text-xs text-muted-foreground">
                              {categoryLabels[item.category] || item.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                item.status === "published"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {item.status}
                            </Badge>
                            {item.readyToPublish ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <Progress value={item.score} className="h-2" />
                          <div className="flex flex-wrap gap-1">
                            {item.missing.length === 0 ? (
                              <Badge variant="secondary">complete</Badge>
                            ) : (
                              item.missing.slice(0, 4).map((missing) => (
                                <Badge key={missing} variant="outline">
                                  {missing}
                                </Badge>
                              ))
                            )}
                            {item.publishBlockers.slice(0, 2).map((blocker) => (
                              <Badge key={blocker} variant="outline">
                                {blocker}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <Badge variant="secondary">
                              {item.score}% score
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadSignDetail(item.signId)}
                            >
                              Edit Content
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <Tabs defaultValue="sign">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="sign">Sign</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="quiz">Quiz</TabsTrigger>
                    <TabsTrigger value="lessons">Lesson Assignment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sign" className="space-y-5 pt-4">
                    {selectedCompleteness && (
                      <div className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Completeness</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedCompleteness.score}% ready
                            </p>
                          </div>
                          <Badge
                            variant={
                              selectedCompleteness.missing.length === 0
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {selectedCompleteness.missing.length === 0
                              ? "complete"
                              : `${selectedCompleteness.missing.length} gaps`}
                          </Badge>
                        </div>
                        <Progress
                          value={selectedCompleteness.score}
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Sign ID">
                        <Input
                          value={signForm.id}
                          disabled={Boolean(selectedId)}
                          onChange={(event) =>
                            setSignForm({ ...signForm, id: event.target.value })
                          }
                          placeholder="greet-hello"
                        />
                      </Field>
                      <Field label="Word">
                        <Input
                          value={signForm.word}
                          onChange={(event) =>
                            setSignForm({
                              ...signForm,
                              word: event.target.value,
                            })
                          }
                          placeholder="Hello"
                        />
                      </Field>
                      <Field label="Category">
                        <Select
                          value={signForm.category}
                          onValueChange={(value) =>
                            setSignForm({
                              ...signForm,
                              category: value as Category,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {categoryLabels[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Difficulty">
                        <Select
                          value={signForm.difficulty}
                          onValueChange={(value) =>
                            setSignForm({
                              ...signForm,
                              difficulty: value as Difficulty,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {difficulties.map((difficulty) => (
                              <SelectItem key={difficulty} value={difficulty}>
                                {difficultyLabels[difficulty]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Publish status">
                        <Select
                          value={signForm.status}
                          onValueChange={(value) =>
                            setSignForm({
                              ...signForm,
                              status: value as ContentPublishStatus,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {publishStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    {selectedCompleteness && (
                      <div className="rounded-md border p-4 space-y-2">
                        <p className="font-semibold">
                          {selectedCompleteness.readyToPublish
                            ? "Ready to publish"
                            : "Cannot publish yet"}
                        </p>
                        {selectedCompleteness.publishBlockers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedCompleteness.publishBlockers.map(
                              (blocker) => (
                                <Badge key={blocker} variant="outline">
                                  {blocker}
                                </Badge>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            This sign has metadata, video, lesson assignment,
                            and at least 2 active quiz questions.
                          </p>
                        )}
                      </div>
                    )}

                    <Field label="Video URL">
                      <div className="flex gap-2">
                        <Input
                          value={signForm.videoUrl || ""}
                          onChange={(event) =>
                            setSignForm({
                              ...signForm,
                              videoUrl: event.target.value,
                            })
                          }
                          placeholder="/api/video-stream/hello"
                        />
                        <Button variant="outline" size="icon" type="button">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </Field>

                    <Field label="Description">
                      <Textarea
                        value={signForm.description}
                        onChange={(event) =>
                          setSignForm({
                            ...signForm,
                            description: event.target.value,
                          })
                        }
                        rows={4}
                      />
                    </Field>

                    <Field label="Example sentence">
                      <Textarea
                        value={signForm.example || ""}
                        onChange={(event) =>
                          setSignForm({
                            ...signForm,
                            example: event.target.value,
                          })
                        }
                        rows={3}
                      />
                    </Field>
                  </TabsContent>

                  <TabsContent value="metadata" className="space-y-5 pt-4">
                    <Field label="Instruction">
                      <Textarea
                        value={metadataForm.instruction}
                        onChange={(event) =>
                          setMetadataForm({
                            ...metadataForm,
                            instruction: event.target.value,
                          })
                        }
                        rows={5}
                      />
                    </Field>
                    <Field label="Common mistakes">
                      <Textarea
                        value={arrayToLines(metadataForm.commonMistakes)}
                        onChange={(event) =>
                          setMetadataForm({
                            ...metadataForm,
                            commonMistakes: linesToArray(event.target.value),
                          })
                        }
                        rows={5}
                        placeholder="One mistake per line"
                      />
                    </Field>
                    <Field label="Practice tips">
                      <Textarea
                        value={arrayToLines(metadataForm.practiceTips)}
                        onChange={(event) =>
                          setMetadataForm({
                            ...metadataForm,
                            practiceTips: linesToArray(event.target.value),
                          })
                        }
                        rows={5}
                        placeholder="One tip per line"
                      />
                    </Field>
                    <Field label="Example sentences">
                      <Textarea
                        value={arrayToLines(metadataForm.exampleSentences)}
                        onChange={(event) =>
                          setMetadataForm({
                            ...metadataForm,
                            exampleSentences: linesToArray(event.target.value),
                          })
                        }
                        rows={5}
                        placeholder="One sentence per line"
                      />
                    </Field>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-5 pt-4">
                    <div className="rounded-md border p-4 space-y-2">
                      <p className="font-semibold">Primary video</p>
                      <p className="text-sm text-muted-foreground">
                        This video is used in learning cards, video-to-word
                        quiz, and quiz previews.
                      </p>
                    </div>
                    <Field label="Video URL">
                      <div className="flex gap-2">
                        <Input
                          value={signForm.videoUrl || ""}
                          onChange={(event) =>
                            setSignForm({
                              ...signForm,
                              videoUrl: event.target.value,
                            })
                          }
                          placeholder="/api/video-stream/hello"
                        />
                        <Button variant="outline" size="icon" type="button">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </Field>
                    {signForm.videoUrl ? (
                      <div className="rounded-md overflow-hidden bg-black">
                        <video
                          key={signForm.videoUrl}
                          className="w-full max-h-80 bg-black"
                          controls
                          preload="metadata"
                          playsInline
                        >
                          <source src={signForm.videoUrl} type="video/mp4" />
                        </video>
                      </div>
                    ) : (
                      <Badge variant="outline">missing video</Badge>
                    )}
                  </TabsContent>

                  <TabsContent value="quiz" className="space-y-5 pt-4">
                    <div className="rounded-md border p-4 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">Quiz Coverage</p>
                          <p className="text-sm text-muted-foreground">
                            {quizQuestions.length > 0
                              ? `${quizQuestions.length} question${quizQuestions.length === 1 ? "" : "s"} attached to this sign.`
                              : "Missing quiz warning: add at least one question for this sign."}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setPreviewQuiz((value) => !value)}
                            disabled={quizQuestions.length === 0}
                          >
                            <Search className="h-4 w-4" />
                            Preview Quiz
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={startNewQuizQuestion}
                          >
                            <Plus className="h-4 w-4" />
                            Add Question
                          </Button>
                        </div>
                      </div>
                      {quizQuestions.length === 0 && (
                        <Badge variant="outline">missing quiz</Badge>
                      )}
                    </div>

                    {previewQuiz && quizQuestions.length > 0 && (
                      <div className="rounded-md border p-4 space-y-3">
                        <p className="font-semibold">Preview</p>
                        {quizQuestions.slice(0, 3).map((question) => (
                          <div
                            key={question.id}
                            className="rounded-md bg-muted p-3 space-y-2"
                          >
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                {quizTypeLabels[question.type]}
                              </Badge>
                              <Badge variant="outline">
                                {question.difficulty}
                              </Badge>
                            </div>
                            <p className="font-medium">{question.question}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {question.options.map((option) => (
                                <span
                                  key={option}
                                  className={`rounded-md border px-3 py-2 text-sm ${
                                    option === question.correctAnswer
                                      ? "border-emerald-500 bg-emerald-50"
                                      : "bg-background"
                                  }`}
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                            {question.explanation && (
                              <p className="text-sm text-muted-foreground">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid gap-3">
                      {quizQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                {quizTypeLabels[question.type]}
                              </Badge>
                              <Badge variant="outline">
                                {lessons.find(
                                  (lesson) => lesson.id === question.lessonId,
                                )?.title || question.lessonId}
                              </Badge>
                              <Badge
                                variant={
                                  question.status === "active"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {question.status}
                              </Badge>
                            </div>
                            <p className="mt-2 font-medium">
                              {question.question}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Answer: {question.correctAnswer}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editQuizQuestion(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteQuizQuestion(question.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-md border p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Question type">
                          <Select
                            value={quizForm.type}
                            onValueChange={(value) =>
                              setQuizForm({
                                ...quizForm,
                                type: value as ContentQuizType,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(quizTypeLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Question status">
                          <Select
                            value={quizForm.status}
                            onValueChange={(value) =>
                              setQuizForm({
                                ...quizForm,
                                status: value as QuizPublishStatus,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {quizStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Lesson">
                          <Select
                            value={
                              quizForm.lessonId ||
                              lessonIds[0] ||
                              lessons[0]?.id ||
                              ""
                            }
                            onValueChange={(value) =>
                              setQuizForm({ ...quizForm, lessonId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lessons.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <Field label="Question">
                        <Textarea
                          value={quizForm.question}
                          onChange={(event) =>
                            setQuizForm({
                              ...quizForm,
                              question: event.target.value,
                            })
                          }
                          rows={3}
                        />
                      </Field>
                      <Field label="Options">
                        <Textarea
                          value={arrayToLines(quizForm.options)}
                          onChange={(event) =>
                            setQuizForm({
                              ...quizForm,
                              options: linesToArray(event.target.value),
                            })
                          }
                          rows={5}
                          placeholder="One option per line"
                        />
                      </Field>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Correct answer">
                          <Input
                            value={quizForm.correctAnswer}
                            onChange={(event) =>
                              setQuizForm({
                                ...quizForm,
                                correctAnswer: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Difficulty">
                          <Select
                            value={quizForm.difficulty}
                            onValueChange={(value) =>
                              setQuizForm({
                                ...quizForm,
                                difficulty:
                                  value as ContentQuizQuestion["difficulty"],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {difficulties.map((difficulty) => (
                                <SelectItem key={difficulty} value={difficulty}>
                                  {difficultyLabels[difficulty]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <Field label="Explanation">
                        <Textarea
                          value={quizForm.explanation}
                          onChange={(event) =>
                            setQuizForm({
                              ...quizForm,
                              explanation: event.target.value,
                            })
                          }
                          rows={3}
                        />
                      </Field>
                      <div className="flex justify-end">
                        <Button className="gap-2" onClick={saveQuizQuestion}>
                          <Save className="h-4 w-4" />
                          Save question
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="lessons" className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Assign this sign to one or more lessons so it appears in
                      lesson flow and quiz coverage.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="rounded-md border p-3 space-y-3"
                        >
                          <label className="flex items-start gap-3">
                            <Checkbox
                              checked={lessonIds.includes(lesson.id)}
                              onCheckedChange={(checked) =>
                                toggleLesson(lesson.id, checked === true)
                              }
                            />
                            <span>
                              <span className="block font-medium">
                                {lesson.title}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {lesson.level} -{" "}
                                {categoryLabels[lesson.category]}
                              </span>
                            </span>
                          </label>
                          <Select
                            value={lesson.status}
                            onValueChange={(value) =>
                              updateLessonStatus(
                                lesson.id,
                                value as ContentPublishStatus,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {publishStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={!selectedId}
                    onClick={deleteSign}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button className="gap-2" onClick={saveSign}>
                    <Save className="h-4 w-4" />
                    Save content
                  </Button>
                </div>
              </Card>
            </div>
          </>
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
