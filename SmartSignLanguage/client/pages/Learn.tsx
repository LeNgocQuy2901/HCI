import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { PremiumPageHeader } from "@/components/PremiumPage";
import VocabularyCardFlip from "@/components/VocabularyCardFlip";
import ProgressTracker from "@/components/ProgressTracker";
import QuizComponent from "@/components/QuizComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  vocabularyCards,
  categoryLabels,
  Category,
  QuizQuestion,
  type VocabularyCard as VocabType,
} from "@shared/vocabulary";
import {
  courses,
  getLessonCards,
  lessons,
  type Lesson,
} from "@shared/curriculum";
import { getSignMetadata } from "@shared/sign-metadata";
import { useLearningStore } from "@/hooks/use-learning-store";
import { trackLearningEvent } from "@/hooks/use-learning-store";
import { useAuthStore } from "@/hooks/use-auth";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Gift,
  Hand,
  HelpCircle,
  Home,
  Map,
  Palette,
  PawPrint,
  PlayCircle,
  Smile,
  Sparkles,
  Target,
  Utensils,
  XCircle,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "path" | "learn" | "review" | "quiz" | "stats";
type QuizContext = { type: "lesson"; lessonId: string } | { type: "free" };

const buildQuiz = (
  cards: VocabType[],
  questionPrefix = "What does this sign mean?",
) => {
  const source = cards.length >= 4 ? cards : vocabularyCards.slice(0, 12);

  return cards.map((card, index): QuizQuestion => {
    const options = source
      .filter((item) => item.id !== card.id)
      .map((item) => item.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    options.push(card.word);
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    return {
      id: `quiz-${card.id}-${index}`,
      type:
        index % 3 === 0
          ? "video-to-text"
          : index % 3 === 1
            ? "text-to-video"
            : "multiple-choice",
      cardId: card.id,
      question: questionPrefix,
      options: shuffledOptions,
      correctAnswerIndex: shuffledOptions.indexOf(card.word),
      difficulty: card.difficulty,
    };
  });
};

const uniqueQuestionsByCard = (
  questions: QuizQuestion[],
  maxQuestions: number,
) => {
  const seen = new Set<string>();
  const unique: QuizQuestion[] = [];

  for (const question of questions) {
    if (seen.has(question.cardId)) continue;
    seen.add(question.cardId);
    unique.push(question);
    if (unique.length >= maxQuestions) break;
  }

  return unique;
};

export default function Learn() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const learningStore = useLearningStore();
  const userId = user?.id || "guest";

  const [activeTab, setActiveTab] = useState<Tab>("path");
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessons[0]?.id || "",
  );
  const [selectedQuizCategory, setSelectedQuizCategory] =
    useState<Category>("greeting");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizContext, setQuizContext] = useState<QuizContext>({ type: "free" });
  const [publishedLessons, setPublishedLessons] = useState<Lesson[]>(lessons);
  const [publishedCards, setPublishedCards] =
    useState<VocabType[]>(vocabularyCards);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localQuizScores, setLocalQuizScores] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const loadPublishedContent = async () => {
      try {
        const response = await fetch("/api/learning/published-content");
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.lessons) && Array.isArray(data.signs)) {
          const localCardsById = new globalThis.Map(
            vocabularyCards.map((card) => [card.id, card]),
          );
          const normalizedSigns = (data.signs as VocabType[]).map((sign) => {
            const localCard = localCardsById.get(sign.id);
            return localCard
              ? {
                  ...sign,
                  videoUrl: localCard.videoUrl,
                }
              : sign;
          });
          const mergedLessons = (data.lessons as Lesson[]).map((lesson) => {
            const localLesson = lessons.find((item) => item.id === lesson.id);
            if (
              !localLesson ||
              localLesson.cardIds.length <= lesson.cardIds.length
            ) {
              return lesson;
            }

            return {
              ...lesson,
              targetCardCount: Math.max(
                lesson.targetCardCount,
                localLesson.targetCardCount,
              ),
              cardIds: localLesson.cardIds,
            };
          });

          setPublishedLessons(mergedLessons);
          setPublishedCards(normalizedSigns);
          if (
            mergedLessons.length > 0 &&
            !mergedLessons.some((lesson) => lesson.id === selectedLessonId)
          ) {
            setSelectedLessonId(mergedLessons[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load published learning content:", error);
      }
    };

    void loadPublishedContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || userId === "guest") return;

    let lastStartedAt = Date.now();

    const flushStudyTime = () => {
      const now = Date.now();
      const durationMs = now - lastStartedAt;
      lastStartedAt = now;

      if (durationMs < 15000) return;

      void trackLearningEvent({
        eventType: "study_session",
        lessonId: selectedLessonId || undefined,
        durationMs,
        metadata: {
          tab: activeTab,
          source: "learn_page",
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushStudyTime();
      } else {
        lastStartedAt = Date.now();
      }
    };

    const interval = window.setInterval(flushStudyTime, 60000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushStudyTime();
    };
  }, [activeTab, selectedLessonId, user, userId]);

  const getPublishedLessonCards = (lessonId: string): VocabType[] => {
    const lesson = publishedLessons.find((item) => item.id === lessonId);
    if (!lesson) return getLessonCards(lessonId);
    const cardSet = new Set(lesson.cardIds);
    return publishedCards.filter((card) => cardSet.has(card.id));
  };

  const displayCourses = useMemo(
    () =>
      courses.map((course) => ({
        ...course,
        lessons: publishedLessons.filter(
          (lesson) => lesson.level === course.id,
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [publishedLessons, refreshKey],
  );

  const selectedLesson = publishedLessons.find(
    (lesson) => lesson.id === selectedLessonId,
  );
  const lessonCards = useMemo(
    () => (selectedLesson ? getPublishedLessonCards(selectedLesson.id) : []),
    [selectedLesson, publishedCards, publishedLessons],
  );
  const currentCard = lessonCards[currentCardIndex];
  const stats = learningStore.getProgressStats(userId);
  const publishedCardIds = useMemo(
    () => new Set(publishedCards.map((card) => card.id)),
    [publishedCards],
  );
  const dueCards = learningStore
    .getDueCards(userId, 8)
    .filter((card) => publishedCardIds.has(card.id));
  const weakCards = learningStore
    .getWeakCards(userId, 8)
    .filter((card) => publishedCardIds.has(card.id));

  const getLessonProgress = (lessonId: string) =>
    learningStore.getLessonProgress(lessonId, userId);

  const getLessonIcon = (category: Category) => {
    switch (category) {
      case "greeting":
        return Hand;
      case "family":
        return Home;
      case "colors":
        return Palette;
      case "animals":
        return PawPrint;
      case "food-drink":
        return Utensils;
      case "time-calendar":
        return Clock;
      case "emotions-feelings":
        return Smile;
      case "sports-activities":
        return Gift;
      default:
        return Sparkles;
    }
  };

  const categoryCardStyles: Record<Category, string> = {
    greeting:
      "from-sky-100/90 to-sky-50/80 dark:from-slate-900 dark:to-slate-800 border-sky-200/70 dark:border-slate-700",
    "action-verbs":
      "from-violet-100/90 to-violet-50/80 dark:from-slate-900 dark:to-slate-800 border-violet-200/70 dark:border-slate-700",
    family:
      "from-rose-100/90 to-rose-50/80 dark:from-slate-900 dark:to-slate-800 border-rose-200/70 dark:border-slate-700",
    animals:
      "from-lime-100/90 to-lime-50/80 dark:from-slate-900 dark:to-slate-800 border-lime-200/70 dark:border-slate-700",
    colors:
      "from-amber-100/90 to-amber-50/80 dark:from-slate-900 dark:to-slate-800 border-amber-200/70 dark:border-slate-700",
    "body-health":
      "from-red-100/90 to-red-50/80 dark:from-slate-900 dark:to-slate-800 border-red-200/70 dark:border-slate-700",
    "deaf-community-asl":
      "from-cyan-100/90 to-cyan-50/80 dark:from-slate-900 dark:to-slate-800 border-cyan-200/70 dark:border-slate-700",
    "nature-weather":
      "from-emerald-100/90 to-emerald-50/80 dark:from-slate-900 dark:to-slate-800 border-emerald-200/70 dark:border-slate-700",
    "time-calendar":
      "from-indigo-100/90 to-indigo-50/80 dark:from-slate-900 dark:to-slate-800 border-indigo-200/70 dark:border-slate-700",
    "sports-activities":
      "from-lime-100/90 to-lime-50/80 dark:from-slate-900 dark:to-slate-800 border-lime-200/70 dark:border-slate-700",
    "education-school":
      "from-blue-100/90 to-blue-50/80 dark:from-slate-900 dark:to-slate-800 border-blue-200/70 dark:border-slate-700",
    "emotions-feelings":
      "from-pink-100/90 to-pink-50/80 dark:from-slate-900 dark:to-slate-800 border-pink-200/70 dark:border-slate-700",
    "food-drink":
      "from-orange-100/90 to-orange-50/80 dark:from-slate-900 dark:to-slate-800 border-orange-200/70 dark:border-slate-700",
    "places-buildings":
      "from-stone-100/90 to-stone-50/80 dark:from-slate-900 dark:to-slate-800 border-stone-200/70 dark:border-slate-700",
    "travel-transportation":
      "from-teal-100/90 to-teal-50/80 dark:from-slate-900 dark:to-slate-800 border-teal-200/70 dark:border-slate-700",
    "technology-computer":
      "from-slate-100/90 to-slate-50/80 dark:from-slate-900 dark:to-slate-800 border-slate-200/70 dark:border-slate-700",
  };

  const getLessonMastery = (lesson: Lesson) => {
    const cardSet = new Set(lesson.cardIds);
    const mastered = lesson.cardIds.filter((cardId) =>
      learningStore.understoodCards.has(`${userId}:${cardId}`),
    ).length;

    return {
      mastered,
      total: cardSet.size,
      percent:
        cardSet.size > 0 ? Math.round((mastered / cardSet.size) * 100) : 0,
    };
  };

  const getLessonCompletionPercent = (
    lesson: Lesson,
    mastery: ReturnType<typeof getLessonMastery>,
    progress?: ReturnType<typeof getLessonProgress>,
  ) => {
    if (progress?.status === "completed") {
      return 100;
    }

    const learnedContribution = mastery.percent * 0.7;
    const quizContribution = progress?.quizPassed
      ? 30
      : Math.min((progress?.quizScore ?? 0) * 0.3, 30);

    return Math.round(Math.min(99, learnedContribution + quizContribution));
  };

  const startLesson = (lesson: Lesson) => {
    learningStore.startLesson(lesson.id, userId);
    setSelectedLessonId(lesson.id);
    setCurrentCardIndex(0);
    setActiveTab("learn");
  };

  const handleMarkCorrect = () => {
    if (!currentCard || !selectedLesson) return;
    const progressKey = `${userId}:${currentCard.id}`;
    if (!learningStore.progress.has(progressKey)) {
      learningStore.addProgress(currentCard.id, userId);
    }
    learningStore.markCardUnderstood(currentCard.id, userId);
    learningStore.updateProgress(currentCard.id, userId, 4);
    handleNextCard();
  };

  const handleMarkWrong = () => {
    if (!currentCard || !selectedLesson) return;
    const progressKey = `${userId}:${currentCard.id}`;
    if (!learningStore.progress.has(progressKey)) {
      learningStore.addProgress(currentCard.id, userId);
    }
    learningStore.unmarkCardUnderstood(currentCard.id, userId);
    learningStore.updateProgress(currentCard.id, userId, 2);
    handleNextCard();
  };

  const handleNextCard = () => {
    if (!selectedLesson) return;
    if (currentCardIndex < lessonCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      return;
    }

    learningStore.setLessonStep(selectedLesson.id, userId, "quiz");
    toast({
      description: "Lesson cards complete. Take the quiz to pass this lesson.",
    });
    void startLessonQuiz(selectedLesson);
  };

  const startLessonQuiz = async (lesson: Lesson) => {
    const cards = getLessonCards(lesson.id);
    const lessonPublishedCards = getPublishedLessonCards(lesson.id);
    const lessonQuizCards = lessonPublishedCards.length
      ? lessonPublishedCards
      : cards;
    const targetQuestionCount = lessonQuizCards.length;
    try {
      const response = await fetch(`/api/learning/lessons/${lesson.id}/quiz`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          const uniqueQuestions = uniqueQuestionsByCard(
            data.questions as QuizQuestion[],
            targetQuestionCount,
          );
          setQuizQuestions(
            uniqueQuestions.length >= targetQuestionCount
              ? uniqueQuestions
              : buildQuiz(lessonQuizCards),
          );
        } else {
          setQuizQuestions(buildQuiz(lessonQuizCards));
        }
      } else {
        setQuizQuestions(buildQuiz(lessonQuizCards));
      }
    } catch (error) {
      console.error("Failed to load lesson quiz:", error);
      setQuizQuestions(buildQuiz(lessonQuizCards));
    }
    setQuizContext({ type: "lesson", lessonId: lesson.id });
    setQuizMode(true);
  };

  const startFreeQuiz = () => {
    const topicLesson = publishedLessons.find(
      (lesson) => lesson.category === selectedQuizCategory,
    );
    const topicCards = topicLesson
      ? getPublishedLessonCards(topicLesson.id)
      : publishedCards
          .filter((card) => card.category === selectedQuizCategory)
          .slice(0, 10);
    setQuizQuestions(buildQuiz(topicCards));
    // If there's a matching lesson, treat it as a lesson quiz so score is recorded
    if (topicLesson) {
      setQuizContext({ type: "lesson", lessonId: topicLesson.id });
    } else {
      setQuizContext({ type: "free" });
    }
    setQuizMode(true);
  };

  const handleQuizComplete = (results: {
    score: number;
    totalQuestions: number;
    answers: number[];
    incorrectCardIds: string[];
  }) => {
    const percentage = Math.round(
      (results.score / results.totalQuestions) * 100,
    );

    const wrongSet = new Set(results.incorrectCardIds);

    quizQuestions.forEach((question) => {
      const cardId = question.cardId;

      if (!learningStore.getProgressByCard(cardId)) {
        learningStore.addProgress(cardId, userId);
      }

      if (wrongSet.has(cardId)) {
        learningStore.unmarkCardUnderstood(cardId, userId);
        learningStore.updateProgress(cardId, userId, 2);
      } else {
        learningStore.markCardUnderstood(cardId, userId);
        learningStore.updateProgress(cardId, userId, 4);
      }
    });

    if (quizContext.type === "lesson") {
      const lesson = publishedLessons.find(
        (item) => item.id === quizContext.lessonId,
      );
      if (lesson) {
        learningStore.recordLessonQuiz(
          lesson.id,
          userId,
          percentage,
          lesson.requiredQuizScore,
        );
        if (percentage >= lesson.requiredQuizScore) {
          learningStore.completeLesson(lesson.id, userId);
        }
        // Update local state immediately so UI reflects new score/completion
        setLocalQuizScores((prev) => ({ ...prev, [lesson.id]: percentage }));
        toast({
          title:
            percentage >= lesson.requiredQuizScore
              ? "Lesson completed! 🎉"
              : "Quiz needs retry",
          description:
            percentage >= lesson.requiredQuizScore
              ? `You scored ${percentage}%. Lesson marked as complete!`
              : `You scored ${percentage}%. Need ${lesson.requiredQuizScore}% to pass. Review the missed signs and retry.`,
          duration: 5000,
        });
        setSelectedLessonId(lesson.id);
        setQuizMode(false);
        setQuizQuestions([]);
        // Force re-render so progress/quiz score display updates immediately
        setRefreshKey((k) => k + 1);
        setActiveTab("learn");
        return;
      }
    } else {
      toast({
        title: "Quiz complete",
        description: `You scored ${results.score}/${results.totalQuestions} (${percentage}%).`,
      });
    }

    setQuizMode(false);
    setQuizQuestions([]);
    setRefreshKey((k) => k + 1);
  };

  if (quizMode) {
    const handleBackToLearning = () => {
      // If there are answered questions, save partial progress before leaving
      if (quizContext.type === "lesson" && quizQuestions.length > 0) {
        const lesson = publishedLessons.find(
          (item) => item.id === quizContext.lessonId,
        );
        if (lesson) {
          // Calculate score from questions answered so far in QuizComponent
          // We don't have partial answers here, so just close without recording
          // The user should finish the quiz to record score
        }
      }
      setQuizMode(false);
      setQuizQuestions([]);
      setRefreshKey((k) => k + 1);
    };

    return (
      <Layout>
        <div className="ssl-app-page container max-w-4xl mx-auto py-12 px-4 font-kids">
          <Button
            variant="ghost"
            onClick={handleBackToLearning}
            className="mb-6"
          >
            Back to Learning
          </Button>
          <QuizComponent
            questions={quizQuestions}
            onComplete={handleQuizComplete}
          />
        </div>
      </Layout>
    );
  }

  const selectedLessonProgress = selectedLesson
    ? // eslint-disable-next-line react-hooks/exhaustive-deps
      getLessonProgress(selectedLesson.id)
    : undefined;
  const currentMetadata = currentCard ? getSignMetadata(currentCard) : null;
  const selectedLessonMastery = selectedLesson
    ? getLessonMastery(selectedLesson)
    : { mastered: 0, total: 0, percent: 0 };

  return (
    <Layout>
      <div className="ssl-app-page">
        <div className="container max-w-7xl mx-auto py-7 px-4 space-y-8">
          <PremiumPageHeader
            eyebrow="Personalized learning path"
            title="Learn Sign Language"
            description="Follow structured visual lessons, practice at your own pace, and build confidence one milestone at a time."
            icon={<BookOpen className="h-6 w-6" />}
          />

          <ProgressTracker stats={stats} compact={true} />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as Tab)}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="path" className="gap-2">
                <Target className="h-4 w-4" />
                Path
              </TabsTrigger>
              <TabsTrigger value="learn" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Lesson
              </TabsTrigger>
              <TabsTrigger value="review" className="gap-2">
                <Zap className="h-4 w-4" />
                Review
              </TabsTrigger>
              <TabsTrigger value="quiz" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="path" className="space-y-8">
              <Card className="p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Map className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Adventure Path</h2>
                    <p className="text-sm text-muted-foreground">
                      Tap a station to play.
                    </p>
                  </div>
                </div>
              </Card>

              {displayCourses.map((course) => (
                <section key={course.id} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-slate-800 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute left-3 top-2 bottom-2 w-[4px] rounded-full bg-gradient-to-b from-sky-200 via-emerald-200 to-amber-200 dark:from-slate-700 dark:via-slate-700 dark:to-slate-800" />

                    <div className="space-y-6">
                      {course.lessons.map((lesson) => {
                        const progress = getLessonProgress(lesson.id);
                        const mastery = getLessonMastery(lesson);
                        // Merge localQuizScores so path updates immediately after quiz
                        const mergedProgress = progress
                          ? {
                              ...progress,
                              quizScore:
                                localQuizScores[lesson.id] ??
                                progress.quizScore,
                              quizPassed:
                                (localQuizScores[lesson.id] ??
                                  progress.quizScore ??
                                  0) >= lesson.requiredQuizScore
                                  ? true
                                  : progress.quizPassed,
                              status:
                                (localQuizScores[lesson.id] ??
                                  progress.quizScore ??
                                  0) >= lesson.requiredQuizScore
                                  ? ("completed" as const)
                                  : progress.status,
                            }
                          : progress;
                        const completionPercent = getLessonCompletionPercent(
                          lesson,
                          mastery,
                          mergedProgress,
                        );
                        const quizScore =
                          localQuizScores[lesson.id] ?? progress?.quizScore;
                        const completed =
                          mergedProgress?.status === "completed";
                        const isNext = !completed;
                        const LessonIcon = getLessonIcon(lesson.category);

                        const badgeClasses = completed
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200";

                        const cardClasses = completed
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20"
                          : "border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20";

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => startLesson(lesson)}
                            className={`group w-full text-left rounded-3xl border p-5 transition-transform hover:-translate-y-1 hover:shadow-lg ${cardClasses}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <div
                                  className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-slate-900 shadow-sm border border-white/70 dark:border-slate-800 ${
                                    isNext ? "animate-pulse" : ""
                                  }`}
                                >
                                  <LessonIcon className="h-6 w-6 text-sky-600" />
                                </div>
                                <div className="absolute -right-2 -bottom-2">
                                  {completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4 text-amber-500" />
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-lg font-semibold">
                                    {lesson.title}
                                  </h4>
                                  <span
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badgeClasses}`}
                                  >
                                    {categoryLabels[lesson.category]}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"
                                      style={{ width: `${completionPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {completionPercent}%
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="inline-flex items-center gap-1">
                                    <Gift className="h-3 w-3" />
                                    {mastery.mastered}/{mastery.total} learned
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <HelpCircle className="h-3 w-3" />
                                    {quizScore == null
                                      ? "Quiz --"
                                      : `${quizScore}% quiz`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </TabsContent>

            <TabsContent value="learn" className="space-y-6">
              <Card className="p-6 space-y-5 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
                <div className="grid md:grid-cols-[1fr_260px] gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {selectedLesson?.title || "Select a lesson"}
                    </h2>
                    <p className="text-muted-foreground">
                      {selectedLesson?.description ||
                        "Choose a lesson from the learning path."}
                    </p>
                  </div>
                  <Select
                    value={selectedLessonId}
                    onValueChange={(value) => {
                      setSelectedLessonId(value);
                      setCurrentCardIndex(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedLessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-4">
                  <div className="h-14 w-14 rounded-2xl bg-sky-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <div className="relative h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700">
                      <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-800 dark:bg-slate-200" />
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-800 dark:bg-slate-200" />
                      <span className="absolute left-2 right-2 bottom-2 h-1 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Guide Bot</p>
                    <p className="text-base font-semibold">
                      Watch, copy, then tap the big buttons.
                    </p>
                  </div>
                </div>

                {selectedLesson && (
                  <div className="grid md:grid-cols-4 gap-3">
                    <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                      <p className="text-sm text-muted-foreground">Cards</p>
                      <p className="text-2xl font-bold">{lessonCards.length}</p>
                    </Card>
                    <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                      <p className="text-sm text-muted-foreground">Learned</p>
                      <p className="text-2xl font-bold">
                        {selectedLessonMastery.percent}%
                      </p>
                    </Card>
                    <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                      <p className="text-sm text-muted-foreground">Quiz</p>
                      <p className="text-2xl font-bold">
                        {selectedLesson &&
                        localQuizScores[selectedLesson.id] != null
                          ? `${localQuizScores[selectedLesson.id]}%`
                          : selectedLessonProgress?.quizScore != null
                            ? `${selectedLessonProgress.quizScore}%`
                            : "--"}
                      </p>
                    </Card>
                    <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                      <p className="text-sm text-muted-foreground">Step</p>
                      <p className="text-2xl font-bold capitalize">
                        {selectedLessonProgress?.currentStep || "learn"}
                      </p>
                    </Card>
                  </div>
                )}

                {currentCard ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="outline">
                        {currentCardIndex + 1} / {lessonCards.length}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Watch the sign, copy it, then tap.
                      </p>
                    </div>
                    <VocabularyCardFlip
                      key={currentCard.id}
                      card={currentCard}
                      onMarkCorrect={handleMarkCorrect}
                      onMarkWrong={handleMarkWrong}
                      onVideoWatched={() =>
                        void trackLearningEvent({
                          eventType: "video_watched",
                          lessonId: selectedLesson.id,
                          cardId: currentCard.id,
                          signId: currentCard.id,
                          metadata: { word: currentCard.word },
                        })
                      }
                    />

                    {currentMetadata && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-900/20">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <h3 className="font-semibold">Do this</h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {currentMetadata.instruction.split(".")[0]}.
                          </p>
                        </Card>
                        <Card className="p-4 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-900/20">
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="h-5 w-5 text-rose-500" />
                            <h3 className="font-semibold">Avoid this</h3>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {currentMetadata.commonMistakes[0] ||
                              "Slow down and keep hands visible."}
                          </p>
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    This lesson has no vocabulary cards yet.
                  </p>
                )}
              </Card>

              {selectedLesson && (
                <Card className="p-6 space-y-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70">
                  <h3 className="text-xl font-semibold">
                    Complete This Lesson
                  </h3>
                  <div className="grid md:grid-cols-1 gap-4 max-w-sm">
                    <Button
                      variant="outline"
                      className="gap-2 h-14 rounded-2xl text-base font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
                      onClick={() => void startLessonQuiz(selectedLesson)}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Lesson Quiz
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Passing quiz score: {selectedLesson.requiredQuizScore}%.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-6 font-kids">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-7 space-y-5 rounded-3xl border border-slate-200/70 dark:border-slate-800">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Recommended Practice ({dueCards.length})
                  </h3>
                  {dueCards.length > 0 ? (
                    <div className="space-y-4">
                      {dueCards.map((card) => (
                        <button
                          key={card.id}
                          className={`w-full text-left p-5 rounded-3xl border bg-gradient-to-br ${categoryCardStyles[card.category]} transition-transform hover:-translate-y-0.5 hover:shadow-md`}
                          onClick={() => {
                            const lesson = publishedLessons.find((item) =>
                              item.cardIds.includes(card.id),
                            );
                            if (lesson) {
                              startLesson(lesson);
                              const index = getPublishedLessonCards(
                                lesson.id,
                              ).findIndex((item) => item.id === card.id);
                              setCurrentCardIndex(Math.max(index, 0));
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold">
                                {card.word}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {categoryLabels[card.category]}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No cards due today.</p>
                  )}
                </Card>

                <Card className="p-7 space-y-5 rounded-3xl border border-slate-200/70 dark:border-slate-800">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" />
                    Weak Words ({weakCards.length})
                  </h3>
                  {weakCards.length > 0 ? (
                    <div className="space-y-4">
                      {weakCards.map((card) => (
                        <button
                          key={card.id}
                          className={`w-full text-left p-5 rounded-3xl border bg-gradient-to-br ${categoryCardStyles[card.category]} transition-transform hover:-translate-y-0.5 hover:shadow-md`}
                          onClick={() => {
                            const lesson = publishedLessons.find((item) =>
                              item.cardIds.includes(card.id),
                            );
                            if (lesson) {
                              startLesson(lesson);
                              const index = getPublishedLessonCards(
                                lesson.id,
                              ).findIndex((item) => item.id === card.id);
                              setCurrentCardIndex(Math.max(index, 0));
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold">
                                {card.word}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {categoryLabels[card.category]}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Weak words will appear after you review cards.
                    </p>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-6 font-kids">
              <Card className="p-7 text-center space-y-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
                <PlayCircle className="h-16 w-16 mx-auto text-sky-500" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Practice Quiz</h3>
                  <p className="text-muted-foreground mb-6">
                    Use free quizzes for extra practice, or take required
                    quizzes inside each lesson.
                  </p>
                </div>

                <div className="max-w-sm mx-auto text-left space-y-2">
                  <label className="text-sm font-semibold block">
                    Choose a quiz topic
                  </label>
                  <Select
                    value={selectedQuizCategory}
                    onValueChange={(value) =>
                      setSelectedQuizCategory(value as Category)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={startFreeQuiz}
                  size="lg"
                  className="gap-2 rounded-2xl"
                >
                  <HelpCircle className="h-5 w-5" />
                  Start practice quiz
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <ProgressTracker stats={stats} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
