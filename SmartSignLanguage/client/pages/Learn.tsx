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
  HelpCircle,
  Lock,
  PlayCircle,
  Target,
  Video,
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
        <div className="container max-w-4xl mx-auto py-12 px-4">
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

          <TabsContent value="path" className="space-y-6">
            {displayCourses.map((course) => (
              <section key={course.id} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold">{course.title}</h2>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {course.lessons.map((lesson) => {
                    const progress = getLessonProgress(lesson.id);
                    const mastery = getLessonMastery(lesson);
                    const locked = isLessonLocked(lesson);
                    const completed = progress?.status === "completed";

                    return (
                      <Card key={lesson.id} className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {categoryLabels[lesson.category]}
                            </p>
                          </div>
                          {locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Badge variant="outline">Lesson {lesson.order}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lesson.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Mastery</span>
                            <span>
                              {mastery.mastered}/{mastery.total}
                            </span>
                          </div>
                          <Progress value={mastery.percent} className="h-2" />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">
                            Quiz {lesson.requiredQuizScore}%+
                          </Badge>
                          <Badge variant="secondary">Recognition required</Badge>
                        </div>
                        <Button
                          className="w-full"
                          variant={completed ? "outline" : "default"}
                          disabled={locked}
                          onClick={() => startLesson(lesson)}
                        >
                          {completed ? "Review Lesson" : "Start Lesson"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="learn" className="space-y-6">
            <Card className="p-6 space-y-5">
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

              {selectedLesson && (
                <div className="grid md:grid-cols-4 gap-3">
                  <Card className="p-4 bg-muted">
                    <p className="text-sm text-muted-foreground">Cards</p>
                    <p className="text-2xl font-bold">{lessonCards.length}</p>
                  </Card>
                  <Card className="p-4 bg-muted">
                    <p className="text-sm text-muted-foreground">Mastery</p>
                    <p className="text-2xl font-bold">
                      {selectedLessonMastery.percent}%
                    </p>
                  </Card>
                  <Card className="p-4 bg-muted">
                    <p className="text-sm text-muted-foreground">Quiz</p>
                    <p className="text-2xl font-bold">
                      {selectedLessonProgress?.quizScore ?? "--"}%
                    </p>
                  </Card>
                  <Card className="p-4 bg-muted">
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
                      Watch the sign, read the context, then mark your result.
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
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">
                          How to Sign
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentMetadata.instruction}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">
                          Common Mistakes
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {currentMetadata.commonMistakes.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="p-4">
                        <h3 className="font-semibold mb-2">Practice Tips</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {currentMetadata.practiceTips.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
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
              <Card className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Complete This Lesson</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => void startLessonQuiz(selectedLesson)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Required Quiz
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={!currentCard}
                    onClick={() => currentCard && practiceCardWithCamera(currentCard)}
                  >
                    <Video className="h-4 w-4" />
                    Practice with Camera
                  </Button>
                  <Button
                    className="gap-2"
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

          <TabsContent value="review" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Today's Review ({dueCards.length})
                </h3>
                {dueCards.length > 0 ? (
                  dueCards.map((card) => (
                    <button
                      key={card.id}
                      className="w-full text-left p-3 bg-muted rounded-md hover:bg-muted/80"
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
                      <p className="font-medium">{card.word}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabels[card.category]}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground">No cards due today.</p>
                )}
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-500" />
                  Weak Words ({weakCards.length})
                </h3>
                {weakCards.length > 0 ? (
                  weakCards.map((card) => (
                    <button
                      key={card.id}
                      className="w-full text-left p-3 bg-muted rounded-md hover:bg-muted/80"
                      onClick={() => {
                        const lesson = publishedLessons.find((item) =>
                          item.cardIds.includes(card.id),
                        );
                        if (lesson) startLesson(lesson);
                      }}
                    >
                      <p className="font-medium">{card.word}</p>
                      <p className="text-xs text-muted-foreground">
                        Needs more practice in {categoryLabels[card.category]}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    Weak words will appear after you review cards.
                  </p>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            <Card className="p-6 text-center space-y-4">
              <PlayCircle className="h-16 w-16 mx-auto text-blue-500" />
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

              <Button onClick={startFreeQuiz} size="lg" className="gap-2">
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
