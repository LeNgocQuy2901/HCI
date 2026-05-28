import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
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
import { courses, getLessonCards, lessons, type Lesson } from "@shared/curriculum";
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
  Lock,
  Map,
  Palette,
  PawPrint,
  PlayCircle,
  Smile,
  Sparkles,
  Target,
  Utensils,
  Video,
  XCircle,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "path" | "learn" | "review" | "quiz" | "stats";
type QuizContext = { type: "lesson"; lessonId: string } | { type: "free" };

const buildQuiz = (cards: VocabType[], questionPrefix = "What does this sign mean?") => {
  const source = cards.length >= 4 ? cards : vocabularyCards.slice(0, 12);

  return cards.slice(0, 10).map((card, index): QuizQuestion => {
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

export default function Learn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const learningStore = useLearningStore();
  const userId = user?.id || "guest";

  const [activeTab, setActiveTab] = useState<Tab>("path");
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id || "");
  const [selectedQuizCategory, setSelectedQuizCategory] =
    useState<Category>("greeting");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizContext, setQuizContext] = useState<QuizContext>({ type: "free" });
  const [publishedLessons, setPublishedLessons] = useState<Lesson[]>(lessons);
  const [publishedCards, setPublishedCards] = useState<VocabType[]>(vocabularyCards);

  useEffect(() => {
    const loadPublishedContent = async () => {
      try {
        const response = await fetch("/api/learning/published-content");
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.lessons) && Array.isArray(data.signs)) {
          setPublishedLessons(data.lessons);
          setPublishedCards(data.signs);
          if (data.lessons.length > 0 && !data.lessons.some((lesson: Lesson) => lesson.id === selectedLessonId)) {
            setSelectedLessonId(data.lessons[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load published learning content:", error);
      }
    };

    void loadPublishedContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        lessons: publishedLessons.filter((lesson) => lesson.level === course.id),
      })),
    [publishedLessons],
  );

  const selectedLesson = publishedLessons.find((lesson) => lesson.id === selectedLessonId);
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
      case "numbers":
        return Gift;
      case "animals":
        return PawPrint;
      case "food":
        return Utensils;
      case "time":
        return Clock;
      case "emotions":
        return Smile;
      default:
        return Sparkles;
    }
  };

  const categoryCardStyles: Record<Category, string> = {
    greeting: "from-sky-100/90 to-sky-50/80 dark:from-slate-900 dark:to-slate-800 border-sky-200/70 dark:border-slate-700",
    family: "from-rose-100/90 to-rose-50/80 dark:from-slate-900 dark:to-slate-800 border-rose-200/70 dark:border-slate-700",
    colors: "from-amber-100/90 to-amber-50/80 dark:from-slate-900 dark:to-slate-800 border-amber-200/70 dark:border-slate-700",
    numbers: "from-emerald-100/90 to-emerald-50/80 dark:from-slate-900 dark:to-slate-800 border-emerald-200/70 dark:border-slate-700",
    animals: "from-lime-100/90 to-lime-50/80 dark:from-slate-900 dark:to-slate-800 border-lime-200/70 dark:border-slate-700",
    food: "from-orange-100/90 to-orange-50/80 dark:from-slate-900 dark:to-slate-800 border-orange-200/70 dark:border-slate-700",
    time: "from-indigo-100/90 to-indigo-50/80 dark:from-slate-900 dark:to-slate-800 border-indigo-200/70 dark:border-slate-700",
    emotions: "from-pink-100/90 to-pink-50/80 dark:from-slate-900 dark:to-slate-800 border-pink-200/70 dark:border-slate-700",
  };

  const getLessonMastery = (lesson: Lesson) => {
    const cardSet = new Set(lesson.cardIds);
    const mastered = lesson.cardIds.filter((cardId) => {
      const progress = learningStore.progress.get(`${userId}:${cardId}`);
      return (
        progress?.status === "mastered" ||
        learningStore.understoodCards.has(`${userId}:${cardId}`)
      );
    }).length;

    return {
      mastered,
      total: cardSet.size,
      percent: cardSet.size > 0 ? Math.round((mastered / cardSet.size) * 100) : 0,
    };
  };

  const isLessonLocked = (lesson: Lesson) => {
    if (lesson.order === 1) return false;
    const previous = publishedLessons.find((item) => item.order === lesson.order - 1);
    if (!previous) return false;
    return getLessonProgress(previous.id)?.status !== "completed";
  };

  const startLesson = (lesson: Lesson) => {
    if (isLessonLocked(lesson)) {
      toast({ description: "Complete the previous lesson first." });
      return;
    }

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
    toast({ description: "Lesson cards complete. Take the required quiz next." });
    void startLessonQuiz(selectedLesson);
  };

  const startLessonQuiz = async (lesson: Lesson) => {
    const cards = getLessonCards(lesson.id);
    const lessonPublishedCards = getPublishedLessonCards(lesson.id);
    try {
      const response = await fetch(`/api/learning/lessons/${lesson.id}/quiz`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuizQuestions(data.questions.slice(0, 12));
        } else {
          setQuizQuestions(buildQuiz(lessonPublishedCards.length ? lessonPublishedCards : cards));
        }
      } else {
        setQuizQuestions(buildQuiz(lessonPublishedCards.length ? lessonPublishedCards : cards));
      }
    } catch (error) {
      console.error("Failed to load lesson quiz:", error);
      setQuizQuestions(buildQuiz(lessonPublishedCards.length ? lessonPublishedCards : cards));
    }
    setQuizContext({ type: "lesson", lessonId: lesson.id });
    setQuizMode(true);
  };

  const startFreeQuiz = () => {
    const topicCards = publishedCards
      .filter((card) => card.category === selectedQuizCategory)
      .slice(0, 10);
    setQuizQuestions(buildQuiz(topicCards));
    setQuizContext({ type: "free" });
    setQuizMode(true);
  };

  const handleQuizComplete = (results: {
    score: number;
    totalQuestions: number;
    answers: number[];
  }) => {
    const percentage = Math.round((results.score / results.totalQuestions) * 100);

    if (quizContext.type === "lesson") {
      const lesson = publishedLessons.find((item) => item.id === quizContext.lessonId);
      if (lesson) {
        learningStore.recordLessonQuiz(
          lesson.id,
          userId,
          percentage,
          lesson.requiredQuizScore,
        );
        toast({
          title: percentage >= lesson.requiredQuizScore ? "Quiz passed" : "Quiz needs retry",
          description:
            percentage >= lesson.requiredQuizScore
              ? `You scored ${percentage}%. Complete recognition practice to finish the lesson.`
              : `You scored ${percentage}%. Required score is ${lesson.requiredQuizScore}%.`,
        });
        setSelectedLessonId(lesson.id);
        setActiveTab("learn");
      }
    } else {
      toast({
        title: "Quiz complete",
        description: `You scored ${results.score}/${results.totalQuestions} (${percentage}%).`,
      });
    }

    setQuizMode(false);
    setQuizQuestions([]);
  };

  const markRecognitionPracticeDone = () => {
    if (!selectedLesson) return;
    learningStore.recordLessonRecognition(selectedLesson.id, userId, true);
    void trackLearningEvent({
      eventType: "recognition_attempted",
      lessonId: selectedLesson.id,
      cardId: currentCard?.id,
      signId: currentCard?.id,
      isCorrect: true,
      metadata: { source: "manual_mark_done" },
    });
    const progress = learningStore.getLessonProgress(selectedLesson.id, userId);
    if (progress?.quizPassed) {
      learningStore.completeLesson(selectedLesson.id, userId);
      toast({ description: "Lesson completed." });
      setActiveTab("path");
    } else {
      toast({ description: "Recognition practice saved. Pass the quiz to complete this lesson." });
    }
  };

  const practiceCardWithCamera = (card: VocabType) => {
    if (!selectedLesson) return;
    learningStore.setLessonStep(selectedLesson.id, userId, "recognition");
    navigate("/recognition", {
      state: {
        mode: "lesson-practice",
        lessonId: selectedLesson.id,
        cardId: card.id,
        expectedWord: card.word,
      },
    });
  };

  if (quizMode) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-12 px-4 font-kids">
          <Button
            variant="ghost"
            onClick={() => setQuizMode(false)}
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
    ? getLessonProgress(selectedLesson.id)
    : undefined;
  const currentMetadata = currentCard ? getSignMetadata(currentCard) : null;
  const selectedLessonMastery = selectedLesson
    ? getLessonMastery(selectedLesson)
    : { mastered: 0, total: 0, percent: 0 };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto py-12 px-4 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Learn Sign Language</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Follow structured lessons, pass quizzes, and use recognition practice
            before completing each lesson.
          </p>
        </div>

        <ProgressTracker stats={stats} compact={true} />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
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
                  <p className="text-sm text-muted-foreground">Tap a station to play.</p>
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
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                  </div>
                </div>

                <div className="relative pl-8">
                  <div className="absolute left-3 top-2 bottom-2 w-[4px] rounded-full bg-gradient-to-b from-sky-200 via-emerald-200 to-amber-200 dark:from-slate-700 dark:via-slate-700 dark:to-slate-800" />

                  <div className="space-y-6">
                    {course.lessons.map((lesson) => {
                      const progress = getLessonProgress(lesson.id);
                      const mastery = getLessonMastery(lesson);
                      const locked = isLessonLocked(lesson);
                      const completed = progress?.status === "completed";
                      const isNext = !locked && !completed;
                      const LessonIcon = getLessonIcon(lesson.category);

                      const badgeClasses = completed
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : locked
                          ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200";

                      const cardClasses = completed
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20"
                        : locked
                          ? "border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 opacity-80"
                          : "border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20";

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          disabled={locked}
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
                                {locked ? (
                                  <Lock className="h-4 w-4 text-slate-400" />
                                ) : completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-semibold">{lesson.title}</h4>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badgeClasses}`}>
                                  {categoryLabels[lesson.category]}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"
                                    style={{ width: `${mastery.percent}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                  {mastery.percent}%
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  {lesson.requiredQuizScore}%
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  Camera
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
                  <p className="text-base font-semibold">Watch, copy, then tap the big buttons.</p>
                </div>
              </div>

              {selectedLesson && (
                <div className="grid md:grid-cols-4 gap-3">
                  <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                    <p className="text-sm text-muted-foreground">Cards</p>
                    <p className="text-2xl font-bold">{lessonCards.length}</p>
                  </Card>
                  <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                    <p className="text-sm text-muted-foreground">Mastery</p>
                    <p className="text-2xl font-bold">
                      {selectedLessonMastery.percent}%
                    </p>
                  </Card>
                  <Card className="p-4 bg-white/80 dark:bg-slate-900/70 border border-white/70 dark:border-slate-800">
                    <p className="text-sm text-muted-foreground">Quiz</p>
                    <p className="text-2xl font-bold">
                      {selectedLessonProgress?.quizScore ?? "--"}%
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
                          {currentMetadata.commonMistakes[0] || "Slow down and keep hands visible."}
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
                <h3 className="text-xl font-semibold">Complete This Lesson</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="gap-2 h-14 rounded-2xl text-base font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
                    onClick={() => void startLessonQuiz(selectedLesson)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Required Quiz
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 h-14 rounded-2xl text-base font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
                    disabled={!currentCard}
                    onClick={() => currentCard && practiceCardWithCamera(currentCard)}
                  >
                    <Video className="h-4 w-4" />
                    Practice with Camera
                  </Button>
                  <Button
                    className="gap-2 h-14 rounded-2xl text-base font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
                    onClick={markRecognitionPracticeDone}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Practice Done
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Passing quiz score: {selectedLesson.requiredQuizScore}%.
                  Recognition practice is recorded after you use the camera mode.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-6 font-kids">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-7 space-y-5 rounded-3xl border border-slate-200/70 dark:border-slate-800">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Today's Review ({dueCards.length})
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
                            const index = getPublishedLessonCards(lesson.id).findIndex(
                              (item) => item.id === card.id,
                            );
                            setCurrentCardIndex(Math.max(index, 0));
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold">{card.word}</p>
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
                          if (lesson) startLesson(lesson);
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold">{card.word}</p>
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
                  Use free quizzes for extra practice, or take required quizzes
                  inside each lesson.
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

              <Button onClick={startFreeQuiz} size="lg" className="gap-2 rounded-2xl">
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
    </Layout>
  );
}
