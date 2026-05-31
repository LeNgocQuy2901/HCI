import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { PremiumPageHeader } from "@/components/PremiumPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/hooks/use-auth";
import { useLearningStore } from "@/hooks/use-learning-store";
import { courses, lessons, type Lesson } from "@shared/curriculum";
import {
  categories,
  categoryLabels,
  difficulties,
  difficultyLabels,
  type SRSProgress,
  type VocabularyCard as VocabType,
  vocabularyCards,
} from "@shared/vocabulary";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Flame,
  GraduationCap,
  ListChecks,
  PlayCircle,
  Target,
  X,
} from "lucide-react";

const formatDate = (date?: string) => {
  if (!date) return "No review scheduled";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getAccuracy = (progress: SRSProgress[]) => {
  const attempts = progress.reduce((total, item) => total + item.attempts, 0);
  const correct = progress.reduce(
    (total, item) => total + item.correctAttempts,
    0,
  );
  return attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
};

const getProgressStatusLabel = (status: SRSProgress["status"]) =>
  status === "mastered" ? "learned" : status;

type LearnerAnalytics = {
  studyTimeThisWeekMs: number;
  accuracyTrend: Array<{
    date: string;
    attempts: number;
    averageScore: number;
  }>;
  weakestTopics: Array<{
    category: string;
    attempts: number;
    correct: number;
    averageScore?: number;
  }>;
  reviewConsistency: {
    activeDaysThisWeek: number;
    percent: number;
  };
};

const formatMinutes = (durationMs: number) =>
  `${Math.round(durationMs / 60000)} min`;

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const learningStore = useLearningStore();
  const [analytics, setAnalytics] = useState<LearnerAnalytics | null>(null);
  const [dashboardCards, setDashboardCards] =
    useState<VocabType[]>(vocabularyCards);
  const [dashboardLessons, setDashboardLessons] = useState<Lesson[]>(lessons);
  const userId = user?.id || "guest";

  const [selectedVideoCard, setSelectedVideoCard] = useState<VocabType | null>(
    null,
  );

  const stats = learningStore.getProgressStats(userId);
  const allProgress = Array.from(learningStore.progress.values()).filter(
    (item) => item.userId === userId,
  );
  const understoodCards = learningStore.getUnderstoodCards(userId);
  const understoodIds = new Set(understoodCards.map((card) => card.id));

  const masteredIds = new Set(
    allProgress
      .filter((item) => item.status === "mastered")
      .map((item) => item.cardId),
  );
  understoodIds.forEach((id) => masteredIds.add(id));

  const learningCount = allProgress.filter(
    (item) => item.status === "learning",
  ).length;
  const reviewedCount = allProgress.filter((item) => item.attempts > 0).length;
  const totalWords = dashboardCards.length || stats.totalWords;
  const masteryPercentage =
    totalWords > 0 ? Math.round((masteredIds.size / totalWords) * 100) : 0;
  const accuracy = getAccuracy(allProgress);
  const publishedCardIds = new Set(dashboardCards.map((card) => card.id));

  const now = new Date();
  const dueCards = learningStore.getDueCards(userId, 50).filter((card) => {
    if (!publishedCardIds.has(card.id)) return false;
    const progress = Array.from(learningStore.progress.values()).find(
      (p) => p.userId === userId && p.cardId === card.id,
    );
    if (
      !progress ||
      progress.status === "new" ||
      progress.status === "mastered"
    )
      return false;
    return new Date(progress.nextReviewDate) <= now;
  });

  // Also include cards that are past due (overdue) — same as dueCards since getDueCards returns all due
  // Separate into: due today vs overdue (more than 1 day late)
  const reviewQueueCards = (() => {
    const allProgressArr = Array.from(learningStore.progress.values()).filter(
      (p) =>
        p.userId === userId && p.status !== "new" && p.status !== "mastered",
    );
    return allProgressArr
      .filter((p) => publishedCardIds.has(p.cardId))
      .map((p) => {
        const card = vocabularyCards.find((c) => c.id === p.cardId) as
          | VocabType
          | undefined;
        if (!card) return null;
        const dueDate = new Date(p.nextReviewDate);
        const msOverdue = now.getTime() - dueDate.getTime();
        const daysOverdue = Math.floor(msOverdue / (1000 * 60 * 60 * 24));
        return { card, progress: p, dueDate, daysOverdue };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  })();

  const weakCards = learningStore
    .getWeakCards(userId, 6)
    .filter((card) => publishedCardIds.has(card.id));
  const completedLessons = dashboardLessons.filter(
    (lesson) =>
      learningStore.getLessonProgress(lesson.id, userId)?.status ===
      "completed",
  );
  const inProgressLesson =
    dashboardLessons.find(
      (lesson) =>
        learningStore.getLessonProgress(lesson.id, userId)?.status ===
        "in-progress",
    ) ||
    dashboardLessons.find(
      (lesson) =>
        learningStore.getLessonProgress(lesson.id, userId)?.status !==
        "completed",
    );
  const lessonCompletionPercentage =
    dashboardLessons.length > 0
      ? Math.round((completedLessons.length / dashboardLessons.length) * 100)
      : 0;

  const getDashboardLessonMastery = (lesson: Lesson) => {
    const mastered = lesson.cardIds.filter((cardId) =>
      learningStore.understoodCards.has(`${userId}:${cardId}`),
    ).length;
    return {
      mastered,
      total: lesson.cardIds.length,
      percent:
        lesson.cardIds.length > 0
          ? Math.round((mastered / lesson.cardIds.length) * 100)
          : 0,
    };
  };

  const dashboardCourses = courses.map((course) => ({
    ...course,
    lessons: dashboardLessons.filter((lesson) => lesson.level === course.id),
  }));

  const progressByCard = new Map(
    allProgress.map((item) => [item.cardId, item] as const),
  );

  const categoryRows = categories
    .map((category) => {
      const cards = dashboardCards.filter((card) => card.category === category);
      const mastered = cards.filter((card) => masteredIds.has(card.id)).length;
      const learning = cards.filter(
        (card) => progressByCard.get(card.id)?.status === "learning",
      ).length;
      const percent =
        cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0;

      return {
        category,
        label: categoryLabels[category],
        total: cards.length,
        mastered,
        learning,
        percent,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.percent - a.percent || b.mastered - a.mastered);

  const difficultyRows = difficulties.map((difficulty) => {
    const cards = dashboardCards.filter(
      (card) => card.difficulty === difficulty,
    );
    const mastered = cards.filter((card) => masteredIds.has(card.id)).length;
    const percent =
      cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0;

    return {
      difficulty,
      label: difficultyLabels[difficulty],
      total: cards.length,
      mastered,
      percent,
    };
  });

  const recentReviews = allProgress
    .filter((item) => item.lastReviewedDate)
    .sort(
      (a, b) =>
        new Date(b.lastReviewedDate || 0).getTime() -
        new Date(a.lastReviewedDate || 0).getTime(),
    )
    .slice(0, 8);

  const upcomingReviews = allProgress
    .filter((item) => item.status !== "mastered")
    .sort(
      (a, b) =>
        new Date(a.nextReviewDate).getTime() -
        new Date(b.nextReviewDate).getTime(),
    )
    .slice(0, 8);

  const learnedCards = dashboardCards
    .filter((card) => masteredIds.has(card.id))
    .sort((a, b) => a.word.localeCompare(b.word));

  const findCard = (cardId: string) =>
    dashboardCards.find((card) => card.id === cardId);

  useEffect(() => {
    let cancelled = false;

    async function loadPublishedContent() {
      try {
        const response = await fetch("/api/learning/published-content");
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled && Array.isArray(data.signs)) {
          setDashboardCards(data.signs);
        }
        if (!cancelled && Array.isArray(data.lessons)) {
          setDashboardLessons(data.lessons);
        }
      } catch (error) {
        console.error("Failed to load dashboard content:", error);
      }
    }

    void loadPublishedContent();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!isAuthenticated || !token) return;

    let cancelled = false;
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/learning/analytics/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load learning analytics:", error);
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <Layout>
      <div className="ssl-app-page">
        <div className="container max-w-7xl mx-auto px-4 py-7 space-y-8">
          <PremiumPageHeader
            eyebrow="Learning intelligence"
            title="Learning Dashboard"
            description="Track your strengths, review priorities, lesson progress, and the signals that help you improve faster."
            icon={<BarChart3 className="h-6 w-6" />}
            aside={
              <Button
                variant="outline"
                asChild
                className="rounded-full bg-white/60 backdrop-blur dark:bg-white/5"
              >
                <Link to="/learn">Continue learning</Link>
              </Button>
            }
          />
          <div>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                You are viewing local guest progress. Sign in to keep a named
                profile.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Learned</p>
                  <p className="text-3xl font-bold">{masteredIds.size}</p>
                </div>
                <Award className="h-9 w-9 text-emerald-600" />
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Learning</p>
                  <p className="text-3xl font-bold">{learningCount}</p>
                </div>
                <GraduationCap className="h-9 w-9 text-blue-600" />
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-3xl font-bold">{accuracy}%</p>
                </div>
                <Target className="h-9 w-9 text-amber-600" />
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Lessons</p>
                  <p className="text-3xl font-bold">
                    {completedLessons.length}/{dashboardLessons.length}
                  </p>
                </div>
                <ListChecks className="h-9 w-9 text-red-500" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                Study time this week
              </p>
              <p className="text-2xl font-bold">
                {formatMinutes(analytics?.studyTimeThisWeekMs || 0)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Accuracy trend</p>
              <p className="text-2xl font-bold">
                {analytics?.accuracyTrend?.[analytics.accuracyTrend.length - 1]
                  ?.averageScore != null
                  ? `${Math.round(analytics.accuracyTrend[analytics.accuracyTrend.length - 1].averageScore)}%`
                  : "—"}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Weakest topics</p>
              <p className="text-2xl font-bold">
                {analytics?.weakestTopics?.filter(
                  (t) =>
                    t.attempts > 0 &&
                    Math.round((Number(t.correct || 0) / t.attempts) * 100) <
                      100,
                ).length || 0}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                Review consistency
              </p>
              <p className="text-2xl font-bold">
                {analytics?.reviewConsistency.percent || 0}%
              </p>
            </Card>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Weakest Topics</h2>
                {analytics.weakestTopics.filter(
                  (t) =>
                    t.attempts > 0 &&
                    Math.round((Number(t.correct || 0) / t.attempts) * 100) <
                      100,
                ).length > 0 ? (
                  <div className="space-y-3">
                    {[...analytics.weakestTopics]
                      .map((topic) => ({
                        ...topic,
                        accuracyValue:
                          topic.attempts > 0
                            ? Math.round(
                                (Number(topic.correct || 0) / topic.attempts) *
                                  100,
                              )
                            : 0,
                      }))
                      .filter(
                        (topic) =>
                          topic.attempts > 0 && topic.accuracyValue < 100,
                      )
                      .sort((a, b) => a.accuracyValue - b.accuracyValue)
                      .map((topic) => {
                        const { accuracyValue } = topic;
                        return (
                          <div key={topic.category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {categoryLabels[topic.category] ||
                                  topic.category}
                              </span>
                              <span className="text-muted-foreground">
                                {accuracyValue}%
                              </span>
                            </div>
                            <Progress value={accuracyValue} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete more quizzes to reveal weak topics.
                  </p>
                )}
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Review Consistency</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      Active days this week
                    </p>
                    <p className="text-lg font-semibold">
                      {analytics.reviewConsistency.activeDaysThisWeek}/7
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Consistency</p>
                    <p className="text-lg font-semibold">
                      {analytics.reviewConsistency.percent}%
                    </p>
                  </div>
                </div>
                <Progress
                  value={analytics.reviewConsistency.percent}
                  className="h-2"
                />
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <h2 className="text-xl font-semibold">What To Study Today</h2>
              </div>
              {inProgressLesson ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Next lesson</p>
                    <p className="text-2xl font-bold">
                      {inProgressLesson.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabels[inProgressLesson.category]}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/learn">Continue lesson</Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <p className="font-medium">All lessons are complete</p>
                  <p className="text-sm text-muted-foreground">
                    Keep reviewing weak words to maintain accuracy.
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Learning Health</h2>
                </div>
                <Badge variant="outline">
                  {lessonCompletionPercentage}% lessons
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Due for review</p>
                  <p className="text-lg font-semibold">{dueCards.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weak words</p>
                  <p className="text-lg font-semibold">{weakCards.length}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Sync</p>
                  <p className="text-lg font-semibold">
                    {learningStore.lastSyncedAt ? "Synced" : "Local"}
                  </p>
                </div>
              </div>
              <Progress value={lessonCompletionPercentage} className="h-2" />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <Card className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Overall Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    {masteredIds.size} of {totalWords} vocabulary items learned
                  </p>
                </div>
                <Badge variant="outline">{masteryPercentage}% learned</Badge>
              </div>
              <Progress value={masteryPercentage} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reviewed</p>
                  <p className="text-lg font-semibold">{reviewedCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due today</p>
                  <p className="text-lg font-semibold">{dueCards.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Longest streak</p>
                  <p className="text-lg font-semibold">
                    {stats.longestStreak} days
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next review</p>
                  <p className="text-lg font-semibold">
                    {formatDate(stats.nextReviewDate)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                <h2 className="text-xl font-semibold">By Difficulty</h2>
              </div>
              <div className="space-y-4">
                {difficultyRows.map((row) => (
                  <div key={row.difficulty} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-muted-foreground">
                        {row.mastered}/{row.total}
                      </span>
                    </div>
                    <Progress value={row.percent} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Lesson Completion</h2>
              </div>
              <div className="space-y-5">
                {dashboardCourses.map((course) => {
                  const completed = course.lessons.filter(
                    (lesson) =>
                      learningStore.getLessonProgress(lesson.id, userId)
                        ?.status === "completed",
                  ).length;
                  const percent = Math.round(
                    (completed / course.lessons.length) * 100,
                  );

                  const mastery = course.lessons.reduce(
                    (acc, lesson) => {
                      const m = getDashboardLessonMastery(lesson);
                      return {
                        mastered: acc.mastered + m.mastered,
                        total: acc.total + m.total,
                      };
                    },
                    { mastered: 0, total: 0 },
                  );
                  const masteryPercent =
                    mastery.total > 0
                      ? Math.round((mastery.mastered / mastery.total) * 100)
                      : 0;
                  return (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{course.title}</span>
                        <span className="text-muted-foreground">
                          {mastery.mastered}/{mastery.total} words · {completed}
                          /{course.lessons.length} lessons
                        </span>
                      </div>
                      <Progress value={masteryPercent} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Weak Words</h2>
              </div>
              {weakCards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {weakCards.map((card) => {
                    const progress = progressByCard.get(card.id);
                    const accuracyValue =
                      progress && progress.attempts > 0
                        ? Math.round(
                            (progress.correctAttempts / progress.attempts) *
                              100,
                          )
                        : 0;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedVideoCard(card)}
                        className="rounded-md border p-3 text-left hover:bg-muted/50 transition-colors group cursor-pointer w-full"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{card.word}</p>
                          <PlayCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabels[card.category]}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {accuracyValue}% accuracy
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Weak words will appear after you complete reviews or quizzes.
                </p>
              )}
            </Card>
          </div>

          {reviewQueueCards.length > 0 && (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Review Queue</h2>
                </div>
                <div className="flex items-center gap-2">
                  {reviewQueueCards.filter((i) => i.daysOverdue > 0).length >
                    0 && (
                    <Badge variant="destructive">
                      {reviewQueueCards.filter((i) => i.daysOverdue > 0).length}{" "}
                      overdue
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {reviewQueueCards.filter((i) => i.daysOverdue >= 0).length}{" "}
                    due
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reviewQueueCards
                  .slice(0, 8)
                  .map(({ card, progress: prog, dueDate, daysOverdue }) => {
                    const accuracyPct =
                      prog.attempts > 0
                        ? Math.round(
                            (prog.correctAttempts / prog.attempts) * 100,
                          )
                        : 0;
                    const isOverdue = daysOverdue > 0;
                    const isDueToday =
                      daysOverdue === 0 ||
                      (daysOverdue < 0 && dueDate.getTime() <= now.getTime());
                    const isFuture = dueDate.getTime() > now.getTime();

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedVideoCard(card)}
                        className={`flex items-center justify-between gap-4 rounded-md border p-3 text-left hover:bg-muted/50 transition-colors group cursor-pointer w-full ${
                          isOverdue
                            ? "border-destructive/40 bg-destructive/5"
                            : ""
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{card.word}</p>
                            <PlayCircle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[card.category]}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            variant={
                              accuracyPct >= 70 ? "outline" : "secondary"
                            }
                          >
                            {accuracyPct}%
                          </Badge>
                          <p
                            className={`text-xs mt-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                          >
                            {isOverdue
                              ? `${daysOverdue}d overdue`
                              : isFuture
                                ? `Due ${formatDate(prog.nextReviewDate)}`
                                : "Due today"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {recentReviews.length > 0 ? (
                  recentReviews.map((item) => {
                    const card = findCard(item.cardId);
                    if (!card) return null;

                    return (
                      <div
                        key={`${item.cardId}-${item.lastReviewedDate}`}
                        className="flex items-center justify-between gap-4 rounded-md border p-3"
                      >
                        <div>
                          <p className="font-medium">{card.word}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.correctAttempts}/{item.attempts} correct
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {getProgressStatusLabel(item.status)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(item.lastReviewedDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No review history yet.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Learned Vocabulary</h2>
                </div>
                <Badge variant="outline">{learnedCards.length} items</Badge>
              </div>
              {learnedCards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {learnedCards.map((card) => (
                    <div key={card.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{card.word}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[card.category]}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {difficultyLabels[card.difficulty]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">No learned vocabulary yet</p>
                  <p className="text-sm text-muted-foreground">
                    Mark cards as correct in Learn to fill this list.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Video modal */}
      {selectedVideoCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedVideoCard(null)}
        >
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="font-semibold text-lg">
                  {selectedVideoCard.word}
                </p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[selectedVideoCard.category]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoCard(null)}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedVideoCard.videoUrl ? (
                <video
                  key={selectedVideoCard.id}
                  src={selectedVideoCard.videoUrl}
                  autoPlay
                  loop
                  controls
                  className="w-full rounded-lg aspect-video bg-black"
                />
              ) : (
                <div className="flex flex-col items-center justify-center aspect-video rounded-lg bg-muted text-muted-foreground gap-2">
                  <PlayCircle className="h-10 w-10" />
                  <p className="text-sm">No video available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
