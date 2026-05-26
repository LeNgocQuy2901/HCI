import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/hooks/use-auth";
import { useLearningStore } from "@/hooks/use-learning-store";
import { courses, lessons } from "@shared/curriculum";
import { getSignMetadata } from "@shared/sign-metadata";
import {
  categories,
  categoryLabels,
  difficulties,
  difficultyLabels,
  type SRSProgress,
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
  Target,
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

type RecognitionPracticeHistoryItem = {
  id: string;
  lessonId: string;
  cardId: string;
  expectedWord: string;
  predictedWord: string;
  isCorrect: boolean;
  confidence: number;
  attemptCount: number;
  durationMs: number;
  stabilityScore: number;
  passedThreshold: boolean;
  suggestion?: string;
  createdAt: string;
};

type LearnerAnalytics = {
  studyTimeThisWeekMs: number;
  accuracyTrend: Array<{ date: string; attempts: number; averageScore: number }>;
  weakestTopics: Array<{
    category: string;
    attempts: number;
    correct: number;
    averageScore?: number;
  }>;
  recognitionImprovement: {
    attempts: number;
    firstAccuracy: number;
    recentAccuracy: number;
    confidenceDelta: number;
    stabilityDelta: number;
  };
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
  const [recognitionHistory, setRecognitionHistory] = useState<
    RecognitionPracticeHistoryItem[]
  >([]);
  const [analytics, setAnalytics] = useState<LearnerAnalytics | null>(null);
  const userId = user?.id || "guest";

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
  const masteryPercentage =
    stats.totalWords > 0
      ? Math.round((stats.masteredWords / stats.totalWords) * 100)
      : 0;
  const accuracy = getAccuracy(allProgress);
  const recognitionAccuracy = useMemo(() => {
    if (recognitionHistory.length === 0) return 0;
    const correct = recognitionHistory.filter((item) => item.isCorrect).length;
    return Math.round((correct / recognitionHistory.length) * 100);
  }, [recognitionHistory]);
  const weakRecognitionSigns = useMemo(() => {
    const grouped = new Map<
      string,
      {
        expectedWord: string;
        attempts: number;
        correct: number;
        avgConfidence: number;
        avgStability: number;
      }
    >();

    recognitionHistory.forEach((item) => {
      const current = grouped.get(item.cardId) || {
        expectedWord: item.expectedWord,
        attempts: 0,
        correct: 0,
        avgConfidence: 0,
        avgStability: 0,
      };
      current.attempts += 1;
      current.correct += item.isCorrect ? 1 : 0;
      current.avgConfidence += item.confidence;
      current.avgStability += item.stabilityScore || 0;
      grouped.set(item.cardId, current);
    });

    return Array.from(grouped.entries())
      .map(([cardId, item]) => ({
        cardId,
        ...item,
        accuracy: item.attempts > 0 ? item.correct / item.attempts : 0,
        avgConfidence:
          item.attempts > 0 ? item.avgConfidence / item.attempts : 0,
        avgStability:
          item.attempts > 0 ? item.avgStability / item.attempts : 0,
      }))
      .filter((item) => item.accuracy < 0.7 || item.avgConfidence < 0.75)
      .sort((a, b) => a.accuracy - b.accuracy || a.avgConfidence - b.avgConfidence)
      .slice(0, 6);
  }, [recognitionHistory]);
  const weakCards = learningStore.getWeakCards(userId, 6);
  const completedLessons = lessons.filter(
    (lesson) =>
      learningStore.getLessonProgress(lesson.id, userId)?.status ===
      "completed",
  );
  const inProgressLesson =
    lessons.find(
      (lesson) =>
        learningStore.getLessonProgress(lesson.id, userId)?.status ===
        "in-progress",
    ) ||
    lessons.find(
      (lesson) =>
        learningStore.getLessonProgress(lesson.id, userId)?.status !==
        "completed",
    );
  const lessonCompletionPercentage =
    lessons.length > 0
      ? Math.round((completedLessons.length / lessons.length) * 100)
      : 0;

  const progressByCard = new Map(
    allProgress.map((item) => [item.cardId, item] as const),
  );

  const categoryRows = categories
    .map((category) => {
      const cards = vocabularyCards.filter((card) => card.category === category);
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
    const cards = vocabularyCards.filter(
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

  const learnedCards = vocabularyCards
    .filter((card) => masteredIds.has(card.id))
    .sort((a, b) => a.word.localeCompare(b.word));

  const findCard = (cardId: string) =>
    vocabularyCards.find((card) => card.id === cardId);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!isAuthenticated || !token) {
      setRecognitionHistory([]);
      return;
    }

    let cancelled = false;
    async function loadRecognitionHistory() {
      try {
        const [historyResponse, analyticsResponse] = await Promise.all([
          fetch("/api/learning/recognition-practice/history?limit=20", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("/api/learning/analytics/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (historyResponse.ok) {
          const data = await historyResponse.json();
          if (!cancelled) {
            setRecognitionHistory(data.results || []);
          }
        }

        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          if (!cancelled) {
            setAnalytics(data);
          }
        }
      } catch (error) {
        console.error("Failed to load learning analytics:", error);
      }
    }

    loadRecognitionHistory();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                Learning Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Track what you have learned, what needs review, and which topics
              need more practice.
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                You are viewing local guest progress. Sign in to keep a named
                profile.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/learn">Continue learning</Link>
            </Button>
            <Button asChild>
              <Link to="/recognition">Practice recognition</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Mastered</p>
                <p className="text-3xl font-bold">{stats.masteredWords}</p>
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
                  {completedLessons.length}/{lessons.length}
                </p>
              </div>
              <ListChecks className="h-9 w-9 text-red-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Study time this week</p>
            <p className="text-2xl font-bold">
              {formatMinutes(analytics?.studyTimeThisWeekMs || 0)}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Accuracy trend</p>
            <p className="text-2xl font-bold">
              {analytics?.accuracyTrend?.[analytics.accuracyTrend.length - 1]?.averageScore
                ? `${Math.round(analytics.accuracyTrend[analytics.accuracyTrend.length - 1].averageScore)}%`
                : `${accuracy}%`}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Weakest topics</p>
            <p className="text-2xl font-bold">
              {analytics?.weakestTopics?.length || 0}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Recognition improvement</p>
            <p className="text-2xl font-bold">
              {analytics
                ? `${analytics.recognitionImprovement.recentAccuracy - analytics.recognitionImprovement.firstAccuracy}%`
                : "0%"}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Review consistency</p>
            <p className="text-2xl font-bold">
              {analytics?.reviewConsistency.percent || 0}%
            </p>
          </Card>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Weakest Topics</h2>
              {analytics.weakestTopics.length > 0 ? (
                <div className="space-y-3">
                  {analytics.weakestTopics.map((topic) => {
                    const accuracyValue =
                      topic.attempts > 0
                        ? Math.round((Number(topic.correct || 0) / topic.attempts) * 100)
                        : 0;
                    return (
                      <div key={topic.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {categoryLabels[topic.category] || topic.category}
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
                  More quiz and recognition attempts will reveal weak topics.
                </p>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Recognition Improvement</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">First attempts</p>
                  <p className="text-lg font-semibold">
                    {analytics.recognitionImprovement.firstAccuracy}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recent attempts</p>
                  <p className="text-lg font-semibold">
                    {analytics.recognitionImprovement.recentAccuracy}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence delta</p>
                  <p className="text-lg font-semibold">
                    {analytics.recognitionImprovement.confidenceDelta}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active days</p>
                  <p className="text-lg font-semibold">
                    {analytics.reviewConsistency.activeDaysThisWeek}/7
                  </p>
                </div>
              </div>
              <Progress value={analytics.reviewConsistency.percent} className="h-2" />
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
                  <p className="text-2xl font-bold">{inProgressLesson.title}</p>
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
              <Badge variant="outline">{lessonCompletionPercentage}% lessons</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Today's review</p>
                <p className="text-lg font-semibold">
                  {stats.totalReviewsToday}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Weak words</p>
                <p className="text-lg font-semibold">{weakCards.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recognition</p>
                <p className="text-lg font-semibold">{recognitionAccuracy}%</p>
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
                  {stats.masteredWords} of {stats.totalWords} vocabulary items
                  mastered
                </p>
              </div>
              <Badge variant="outline">{masteryPercentage}% complete</Badge>
            </div>
            <Progress value={masteryPercentage} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Reviewed</p>
                <p className="text-lg font-semibold">{reviewedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Today</p>
                <p className="text-lg font-semibold">
                  {stats.totalReviewsToday}
                </p>
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
              {courses.map((course) => {
                const completed = course.lessons.filter(
                  (lesson) =>
                    learningStore.getLessonProgress(lesson.id, userId)
                      ?.status === "completed",
                ).length;
                const percent = Math.round(
                  (completed / course.lessons.length) * 100,
                );

                return (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-muted-foreground">
                        {completed}/{course.lessons.length}
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
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
                          (progress.correctAttempts / progress.attempts) * 100,
                        )
                      : 0;

                  return (
                    <div key={card.id} className="rounded-md border p-3">
                      <p className="font-medium">{card.word}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabels[card.category]}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {accuracyValue}% accuracy
                      </Badge>
                    </div>
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

        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                Recognition Practice History
              </h2>
            </div>
            <Badge variant="outline">{recognitionAccuracy}% accuracy</Badge>
          </div>
          {recognitionHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recognitionHistory.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        Target: {item.expectedWord}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Detected: {item.predictedWord} ·{" "}
                        {Math.round(item.confidence * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Attempts: {item.attemptCount} · Stability:{" "}
                        {Math.round((item.stabilityScore || 0) * 100)}%
                      </p>
                    </div>
                    <Badge variant={item.isCorrect ? "default" : "secondary"}>
                      {item.isCorrect ? "Correct" : "Retry"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Recognition practice attempts will appear after using lesson
              camera practice.
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Weak Recognition Signs</h2>
          </div>
          {weakRecognitionSigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weakRecognitionSigns.map((item) => (
                <div key={item.cardId} className="rounded-md border p-3">
                  <p className="font-medium">{item.expectedWord}</p>
                  <p className="text-xs text-muted-foreground">
                    Recognition accuracy {Math.round(item.accuracy * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg confidence {Math.round(item.avgConfidence * 100)}% ·
                    stability {Math.round(item.avgStability * 100)}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Weak recognition signs will appear after camera practice attempts.
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Recommended Review</h2>
          </div>
          {weakRecognitionSigns.length > 0 ? (
            <div className="space-y-3">
              {weakRecognitionSigns.slice(0, 3).map((item) => {
                const card = vocabularyCards.find(
                  (vocab) => vocab.id === item.cardId,
                );
                const metadata = card ? getSignMetadata(card) : null;

                return (
                  <div key={item.cardId} className="rounded-md border p-3">
                    <p className="font-medium">
                      Practice again: {item.expectedWord}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {metadata?.commonMistakes[0] ||
                        "This sign needs more camera practice."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip:{" "}
                      {metadata?.practiceTips[0] ||
                        "Slow down and keep the hand centered in frame."}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : weakCards.length > 0 ? (
            <div className="space-y-3">
              {weakCards.slice(0, 3).map((card) => {
                const metadata = getSignMetadata(card);
                return (
                  <div key={card.id} className="rounded-md border p-3">
                    <p className="font-medium">Review: {card.word}</p>
                    <p className="text-sm text-muted-foreground">
                      {metadata.instruction}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete more lessons and camera practice to get targeted review
              recommendations.
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Topics</h2>
            </div>
            <div className="space-y-4">
              {categoryRows.map((row) => (
                <div key={row.category} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.learning} learning, {row.total - row.mastered} left
                      </p>
                    </div>
                    <span className="text-muted-foreground">
                      {row.mastered}/{row.total}
                    </span>
                  </div>
                  <Progress value={row.percent} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Review Queue</h2>
            </div>
            <div className="space-y-3">
              {upcomingReviews.length > 0 ? (
                upcomingReviews.map((item) => {
                  const card = findCard(item.cardId);
                  if (!card) return null;

                  return (
                    <div
                      key={item.cardId}
                      className="flex items-center justify-between gap-4 rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{card.word}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabels[card.category]}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{item.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.nextReviewDate)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <p className="font-medium">No reviews are due right now</p>
                  <p className="text-sm text-muted-foreground">
                    Learn new cards or come back after the next review date.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

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
                        <Badge variant="outline">{item.status}</Badge>
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
    </Layout>
  );
}
