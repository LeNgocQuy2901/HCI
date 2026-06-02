import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { PremiumPageHeader } from "@/components/PremiumPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/hooks/use-auth";
import { useLearningStore } from "@/hooks/use-learning-store";
import { lessons, type Lesson } from "@shared/curriculum";
import {
  categoryLabels,
  type Category,
  type SRSProgress,
  type VocabularyCard as VocabType,
  vocabularyCards,
} from "@shared/vocabulary";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Flame,
  Hand,
  ListChecks,
  PlayCircle,
  Trophy,
  X,
} from "lucide-react";

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
  recognitionImprovement: {
    attempts: number;
    firstAccuracy: number;
    recentAccuracy: number;
    confidenceDelta: number;
    stabilityDelta: number;
  };
};

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

const cardStyle =
  "rounded-3xl border border-white/75 bg-white/75 shadow-[0_18px_45px_rgba(76,29,149,.08),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70";
const importantCardStyle = `${cardStyle} transition-all duration-300 hover:[transform:perspective(1000px)_rotateX(1.5deg)_rotateY(-1.5deg)_translateY(-4px)] hover:shadow-[0_24px_55px_rgba(76,29,149,.14)]`;
const topicImages: Record<Category, string> = {
  greeting: "/img/topic/greeting.png",
  "action-verbs": "/img/topic/Common Verbs.png",
  family: "/img/topic/Family.png",
  animals: "/img/topic/Animals.png",
  colors: "/img/topic/Colors.png",
  "body-health": "/img/topic/Body & Health.png",
  "deaf-community-asl": "/img/topic/Deaf Community & ASL.png",
  "nature-weather": "/img/topic/Nature & Weather.png",
  "time-calendar": "/img/topic/Time & Calendar.png",
  "sports-activities": "/img/topic/Sports & Activities.png",
  "education-school": "/img/topic/School.png",
  "emotions-feelings": "/img/topic/Emotions.png",
  "food-drink": "/img/topic/Food & Drink.png",
  "places-buildings": "/img/topic/Places.png",
  "travel-transportation": "/img/topic/Travel.png",
  "technology-computer": "/img/topic/Technology.png",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const learningStore = useLearningStore();
  const userId = user?.id || "guest";
  const [analytics, setAnalytics] = useState<LearnerAnalytics | null>(null);
  const [dashboardCards, setDashboardCards] =
    useState<VocabType[]>(vocabularyCards);
  const [dashboardLessons, setDashboardLessons] = useState<Lesson[]>(lessons);
  const [selectedVideoCard, setSelectedVideoCard] = useState<VocabType | null>(
    null,
  );

  const stats = learningStore.getProgressStats(userId);
  const allProgress = Array.from(learningStore.progress.values()).filter(
    (item) => item.userId === userId,
  );
  const understoodIds = new Set(
    learningStore.getUnderstoodCards(userId).map((card) => card.id),
  );
  const masteredIds = new Set(
    allProgress
      .filter((item) => item.status === "mastered")
      .map((item) => item.cardId),
  );
  understoodIds.forEach((id) => masteredIds.add(id));

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
  const lessonCompletion =
    dashboardLessons.length > 0
      ? Math.round((completedLessons.length / dashboardLessons.length) * 100)
      : 0;
  const getLessonMastery = (lesson: Lesson) => {
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

  const currentLessonMastery = inProgressLesson
    ? getLessonMastery(inProgressLesson)
    : null;
  const localAccuracy = getAccuracy(allProgress);
  const latestQuizTrend =
    analytics?.accuracyTrend?.[analytics.accuracyTrend.length - 1];
  const quizAccuracy =
    latestQuizTrend?.averageScore != null
      ? Math.round(latestQuizTrend.averageScore)
      : localAccuracy;

  const localRecognition = dashboardLessons.reduce(
    (result, lesson) => {
      const progress = learningStore.getLessonProgress(lesson.id, userId);
      return {
        attempts: result.attempts + (progress?.recognitionAttempts || 0),
        correct: result.correct + (progress?.recognitionCorrect || 0),
      };
    },
    { attempts: 0, correct: 0 },
  );
  const recognitionAttempts =
    analytics?.recognitionImprovement.attempts || localRecognition.attempts;
  const recognitionAccuracy =
    analytics?.recognitionImprovement.attempts != null &&
    analytics.recognitionImprovement.attempts > 0
      ? analytics.recognitionImprovement.recentAccuracy
      : localRecognition.attempts > 0
        ? Math.round(
            (localRecognition.correct / localRecognition.attempts) * 100,
          )
        : null;
  const publishedCardIds = new Set(dashboardCards.map((card) => card.id));
  const weakCards = learningStore
    .getWeakCards(userId, 6)
    .filter((card) => publishedCardIds.has(card.id));
  const weakTopics = (analytics?.weakestTopics || [])
    .map((topic) => ({
      ...topic,
      accuracy:
        topic.attempts > 0
          ? Math.round((Number(topic.correct || 0) / topic.attempts) * 100)
          : 0,
    }))
    .filter((topic) => topic.attempts > 0 && topic.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
  const weakAreas = [
    ...weakCards.slice(0, 3).map((card) => ({
      id: `sign-${card.id}`,
      label: card.word,
      detail: categoryLabels[card.category],
      kind: "Weak sign",
      card,
    })),
    ...weakTopics.map((topic) => ({
      id: `topic-${topic.category}`,
      label:
        categoryLabels[topic.category as keyof typeof categoryLabels] ||
        topic.category,
      detail: `${topic.accuracy}% accuracy`,
      kind: "Low-score topic",
      card: null,
    })),
  ].slice(0, 3);
  const recentReviews = allProgress
    .filter((item) => item.lastReviewedDate)
    .sort(
      (a, b) =>
        new Date(b.lastReviewedDate || 0).getTime() -
        new Date(a.lastReviewedDate || 0).getTime(),
    )
    .slice(0, 8);
  const lessonChartData = ["beginner", "intermediate", "advanced"].map(
    (level) => {
      const levelLessons = dashboardLessons.filter(
        (lesson) => lesson.level === level,
      );
      const completed = levelLessons.filter(
        (lesson) =>
          learningStore.getLessonProgress(lesson.id, userId)?.status ===
          "completed",
      ).length;
      return {
        level: level[0].toUpperCase() + level.slice(1),
        completed,
        total: levelLessons.length,
      };
    },
  );

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

  const findCard = (cardId: string) =>
    dashboardCards.find((card) => card.id === cardId);

  return (
    <Layout>
      <div className="ssl-app-page px-4">
        <div className="ssl-page-shell space-y-8 py-7">
          <PremiumPageHeader
            eyebrow="Learning intelligence"
            title="Learning Dashboard"
            description="See your next step, celebrate progress, and focus on the signs that need a little more practice."
            icon={<BarChart3 className="h-6 w-6" />}
            aside={
              <Button
                variant="outline"
                asChild
                className="rounded-full bg-white/60 backdrop-blur dark:bg-white/5"
              >
                <Link to="/learn/lesson">Continue learning</Link>
              </Button>
            }
          />

          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground">
              You are viewing local guest progress. Sign in to save your
              learning journey.
            </p>
          )}

          <section data-tour="dashboard-next-step">
            <Card
              className={`${importantCardStyle} relative overflow-hidden p-6 sm:p-7`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-cyan-200/35 blur-2xl" />
              <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full bg-violet-200/35 blur-2xl" />
              <div className="relative z-10 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-violet-600">
                    Welcome back, {user?.fullName || "learner"}
                  </p>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Continue learning
                  </Badge>
                  {inProgressLesson ? (
                    <>
                      <h2 className="mt-4 text-3xl font-bold tracking-tight">
                        {inProgressLesson.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {categoryLabels[inProgressLesson.category]}
                      </p>
                      <div className="mt-5 max-w-xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Lesson progress</span>
                          <span className="font-semibold">
                            {currentLessonMastery?.percent || 0}%
                          </span>
                        </div>
                        <Progress
                          value={currentLessonMastery?.percent || 0}
                          className="h-3"
                        />
                      </div>
                      <Button asChild className="mt-6 gap-2 rounded-xl">
                        <Link to="/learn/lesson">
                          Continue lesson
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-4 text-3xl font-bold">
                        All lessons complete
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Review weak signs to keep your skills fresh.
                      </p>
                      <Button asChild className="mt-6 rounded-xl">
                        <Link to="/learn/review">Review signs</Link>
                      </Button>
                    </>
                  )}
                </div>
                <div className="mx-auto h-32 w-44 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-[inset_0_5px_10px_rgba(255,255,255,.9),0_24px_35px_rgba(76,29,149,.16)]">
                  <img
                    src={
                      inProgressLesson
                        ? topicImages[inProgressLesson.category]
                        : "/img/logo2.png"
                    }
                    alt={
                      inProgressLesson
                        ? `${inProgressLesson.title} topic`
                        : "SmartSignLanguage"
                    }
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </Card>
          </section>

          <section
            className="grid gap-6 lg:grid-cols-2"
            data-tour="dashboard-snapshot"
          >
            <div className="space-y-4">
              <SectionTitle
                eyebrow="At a glance"
                title="Your learning snapshot"
              />
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Lessons completed"
                  value={`${completedLessons.length}/${dashboardLessons.length}`}
                  hint={`${lessonCompletion}% of your path`}
                  icon={ListChecks}
                  color="bg-violet-100 text-violet-600"
                />
                <StatCard
                  label="Quiz accuracy"
                  value={`${quizAccuracy}%`}
                  hint="Latest learning score"
                  icon={Trophy}
                  color="bg-amber-100 text-amber-600"
                />
                <StatCard
                  label="Study streak"
                  value={`${stats.currentStreak} days`}
                  hint={`Best: ${stats.longestStreak} days`}
                  icon={Flame}
                  color="bg-rose-100 text-rose-500"
                />
                <Card className={`${cardStyle} p-4 sm:p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-600">
                      <Hand className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                        AI recognition
                      </p>
                      <p className="mt-1 text-xl font-bold">
                        {recognitionAccuracy == null
                          ? "No data"
                          : `${recognitionAccuracy}%`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {recognitionAttempts} practice attempts
                  </p>
                </Card>
              </div>
            </div>

            <RecentActivityCard
              recentReviews={recentReviews}
              findCard={findCard}
            />
          </section>

          <section className="space-y-4" data-tour="dashboard-focus">
            <SectionTitle eyebrow="Focus" title="Progress and weak areas" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className={`${cardStyle} p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Lessons completed by level</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Real completion data from your learning path
                    </p>
                  </div>
                  <Badge variant="outline">
                    {completedLessons.length}/{dashboardLessons.length}
                  </Badge>
                </div>
                {dashboardLessons.length > 0 ? (
                  <LessonBarChart data={lessonChartData} />
                ) : (
                  <EmptyChart text="No lesson data yet." />
                )}
              </Card>

              <Card className={`${cardStyle} p-5`}>
                <h3 className="font-bold">Weak areas to review</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Practice the signs or topics that need the most attention.
                </p>
                {weakAreas.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    {weakAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                      >
                        <div>
                          <Badge variant="secondary">{area.kind}</Badge>
                          <p className="mt-1 text-sm font-bold">{area.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {area.detail}
                          </p>
                        </div>
                        {area.card ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setSelectedVideoCard(area.card)}
                          >
                            Practice
                          </Button>
                        ) : (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                          >
                            <Link to="/learn/review">Practice</Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">
                    No weak areas yet. Complete a quiz or recognition practice
                    to see recommendations.
                  </p>
                )}
              </Card>
            </div>
          </section>
        </div>
      </div>

      {selectedVideoCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedVideoCard(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-lg font-semibold">
                  {selectedVideoCard.word}
                </p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[selectedVideoCard.category]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoCard(null)}
                className="rounded-md p-1 transition-colors hover:bg-muted"
                aria-label="Close video"
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
                  className="aspect-video w-full rounded-lg bg-black"
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground">
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

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof ListChecks;
  color: string;
}) {
  return (
    <Card className={`${importantCardStyle} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={`rounded-2xl p-2.5 shadow-sm ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function RecentActivityCard({
  recentReviews,
  findCard,
}: {
  recentReviews: SRSProgress[];
  findCard: (cardId: string) => VocabType | undefined;
}) {
  return (
    <Card className={`${cardStyle} h-full p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-violet-600" />
          <h2 className="text-xl font-bold">Recent activity</h2>
        </div>
        <Badge variant="outline">Latest 3</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {recentReviews.length > 0 ? (
          recentReviews.slice(0, 3).map((item) => {
            const card = findCard(item.cardId);
            if (!card) return null;
            return (
              <div
                key={`${item.cardId}-${item.lastReviewedDate}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/80 bg-white/60 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <p className="text-sm font-semibold">{card.word}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.correctAttempts}/{item.attempts} correct
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {getProgressStatusLabel(item.status)}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
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
      {recentReviews.length > 3 && (
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="activity">
            <AccordionTrigger>View more activity</AccordionTrigger>
            <AccordionContent className="space-y-2">
              {recentReviews.slice(3).map((item) => {
                const card = findCard(item.cardId);
                if (!card) return null;
                return (
                  <div
                    key={`${item.cardId}-${item.lastReviewedDate}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/80 bg-white/60 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-semibold">{card.word}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.correctAttempts}/{item.attempts} correct
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.lastReviewedDate)}
                    </p>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </Card>
  );
}

function LessonBarChart({
  data,
}: {
  data: Array<{ level: string; completed: number; total: number }>;
}) {
  const maxTotal = Math.max(1, ...data.map((item) => item.total));

  return (
    <div className="mt-5 grid h-56 grid-cols-3 items-end gap-5 rounded-2xl bg-white/45 px-6 pb-4 pt-6 dark:bg-white/5">
      {data.map((item) => {
        const height = Math.max(8, (item.completed / maxTotal) * 145);
        return (
          <div
            key={item.level}
            className="flex h-full flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              {item.completed}/{item.total}
            </span>
            <div
              className="w-full max-w-16 rounded-t-xl bg-gradient-to-t from-violet-500 to-cyan-300 shadow-md shadow-violet-500/15 transition-[height] duration-500"
              style={{ height }}
              title={`${item.level}: ${item.completed}/${item.total} completed`}
            />
            <span className="text-xs text-muted-foreground">{item.level}</span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="mt-5 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/45 text-sm text-muted-foreground dark:border-slate-700 dark:bg-white/5">
      {text}
    </div>
  );
}
