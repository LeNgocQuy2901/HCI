import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  QuizQuestion,
  VocabularyCard,
  vocabularyCards,
} from "@shared/vocabulary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Hand,
  Star,
} from "lucide-react";
import { categoryLabels, difficultyLabels } from "@shared/vocabulary";

const quizTypeLabels: Record<string, string> = {
  "video-to-text": "Sign to Text",
  "text-to-video": "Text to Sign",
  "multiple-choice": "Multiple Choice",
  meaning_quiz: "Meaning Quiz",
  video_to_word: "Video to Word",
  word_to_sign: "Word to Sign",
  common_mistake: "Common Mistake",
};

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: (results: {
    score: number;
    totalQuestions: number;
    answers: number[];
    incorrectCardIds: string[];
  }) => void;
}

function HandMascot({ isCorrect }: { isCorrect: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute -right-3 -top-8 z-20 hidden sm:block"
      initial={{ opacity: 0, scale: 0.5, rotate: -12, y: 18 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: isCorrect ? [0, -8, 8, 0] : [0, -5, 5, 0],
        y: isCorrect ? [0, -12, 0] : [0, -5, 0],
      }}
      exit={{ opacity: 0, scale: 0.7, y: -10 }}
      transition={{
        duration: isCorrect ? 0.9 : 0.7,
        ease: "easeOut",
      }}
    >
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-[34px] border-4 border-white shadow-[inset_0_5px_10px_rgba(255,255,255,.8),0_18px_30px_rgba(124,58,237,.18)] ${
          isCorrect
            ? "bg-gradient-to-br from-emerald-200 via-cyan-100 to-yellow-100"
            : "bg-gradient-to-br from-pink-200 via-violet-100 to-cyan-100"
        }`}
      >
        <Hand
          className={`h-12 w-12 ${
            isCorrect ? "text-emerald-600" : "text-violet-500"
          }`}
          strokeWidth={2.4}
        />
        <span className="absolute left-7 top-6 h-2 w-2 rounded-full bg-slate-700" />
        <span className="absolute right-7 top-6 h-2 w-2 rounded-full bg-slate-700" />
        <span
          className={`absolute bottom-5 left-1/2 h-2 w-5 -translate-x-1/2 rounded-full border-b-2 ${
            isCorrect ? "border-emerald-700" : "border-violet-700"
          }`}
        />
      </div>
      <motion.div
        className="absolute -left-5 -top-2 text-yellow-400"
        animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.28, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <Star className="h-7 w-7 fill-current" />
      </motion.div>
      <motion.div
        className="absolute -right-2 bottom-2 text-pink-400"
        animate={{ y: [0, -8, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>
    </motion.div>
  );
}

export default function QuizComponent({
  questions,
  onComplete,
}: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const completedRef = useRef(false);

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentCard = vocabularyCards.find((c) => c.id === current.cardId);

  const handleSelectAnswer = (index: number) => {
    if (!submitted) {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentIndex] = index;
      setSelectedAnswers(newAnswers);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswers[currentIndex] !== undefined) {
      setSubmitted(true);
    }
  };

  const callOnComplete = (answers: number[]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const correct = questions.filter(
      (question, index) => question.correctAnswerIndex === answers[index],
    ).length;
    const incorrect = questions.filter(
      (question, index) => question.correctAnswerIndex !== answers[index],
    );
    onComplete({
      score: correct,
      totalQuestions: questions.length,
      answers,
      incorrectCardIds: incorrect.map((q) => q.cardId),
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSubmitted(false);
    } else {
      // Record score immediately when finishing last question
      callOnComplete(selectedAnswers);
      setShowSummary(true);
    }
  };

  const isAnswerCorrect =
    selectedAnswers[currentIndex] === current.correctAnswerIndex;

  const particles = Array.from({ length: 14 }, (_, index) => ({
    angle: (Math.PI * 2 * index) / 14,
    distance: 48 + (index % 4) * 14,
    delay: (index % 5) * 0.025,
  }));

  const correctAnswers = questions.filter(
    (question, index) => question.correctAnswerIndex === selectedAnswers[index],
  ).length;
  const incorrectQuestions = questions.filter(
    (question, index) => question.correctAnswerIndex !== selectedAnswers[index],
  );

  const finishQuiz = () => {
    callOnComplete(selectedAnswers);
  };

  if (showSummary) {
    const scorePercent =
      questions.length > 0
        ? Math.round((correctAnswers / questions.length) * 100)
        : 0;

    return (
      <motion.div
        className="w-full max-w-3xl mx-auto space-y-6 font-kids"
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="p-8 space-y-6 rounded-3xl border border-slate-200/70 dark:border-slate-800">
          <div className="space-y-2 text-center">
            <Badge variant="secondary">Quiz Result</Badge>
            <h2 className="text-3xl font-bold">
              {correctAnswers}/{questions.length} correct
            </h2>
            <Progress value={scorePercent} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {scorePercent}% score
            </p>
          </div>

          {incorrectQuestions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Review these answers</h3>
              {incorrectQuestions.map((question) => {
                const questionIndex = questions.indexOf(question);
                const selectedIndex = selectedAnswers[questionIndex];
                const selectedText =
                  selectedIndex === undefined
                    ? "No answer"
                    : question.options[selectedIndex];
                const correctText =
                  question.options[question.correctAnswerIndex];
                const card = vocabularyCards.find(
                  (item) => item.id === question.cardId,
                );

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <p className="font-semibold">
                        {card?.word || correctText}
                      </p>
                    </div>
                    <p className="mt-2 text-sm">{question.question}</p>
                    <p className="mt-2 text-sm">
                      Your answer:{" "}
                      <span className="font-medium">{selectedText}</span>
                    </p>
                    <p className="text-sm">
                      Correct answer:{" "}
                      <span className="font-medium">{correctText}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-semibold">All answers correct.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={finishQuiz}>Finish Quiz</Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 font-kids">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Question {currentIndex + 1} / {questions.length}
          </h3>
          <Badge>{Math.round(progress)}% complete</Badge>
        </div>
        <div className="relative h-3 overflow-visible rounded-full bg-violet-100/80 shadow-inner dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 via-pink-300 via-yellow-300 to-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.35)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute top-1/2 text-yellow-400 drop-shadow-sm"
            initial={false}
            animate={{ left: `calc(${progress}% - 10px)`, y: "-50%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Star className="h-5 w-5 fill-current" />
          </motion.div>
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 24, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -24, scale: 0.985 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="relative p-4 space-y-4 rounded-[32px] border-2 border-white/80 dark:border-slate-700 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden shadow-[0_22px_55px_rgba(124,58,237,.14),inset_0_2px_0_rgba(255,255,255,.8)]">
            <AnimatePresence>
              {submitted && <HandMascot isCorrect={isAnswerCorrect} />}
            </AnimatePresence>
            {/* Question Type Badge */}
            <div className="flex gap-2">
              <Badge variant="secondary">
                {quizTypeLabels[current.type] || "Quiz"}
              </Badge>
              <Badge variant="outline">
                {difficultyLabels[current.difficulty]}
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
              {/* Video Preview */}
              {currentCard && (
                <div className="space-y-3">
                  <div className="w-full mx-auto rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <video
                      key={currentCard.id}
                      className="w-full h-auto max-h-64 bg-black lg:max-h-[22rem]"
                      controls
                      autoPlay
                      loop
                      muted
                      preload="metadata"
                      playsInline
                    >
                      <source
                        key={currentCard.videoUrl}
                        src={currentCard.videoUrl}
                        type="video/mp4"
                      />
                      <div className="flex items-center justify-center h-64 bg-muted text-muted-foreground">
                        <div className="text-center">
                          <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No video</p>
                        </div>
                      </div>
                    </video>
                  </div>

                  <div className="text-center space-y-1">
                    <Badge variant="outline">
                      {categoryLabels[currentCard.category]}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {currentCard.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Question */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {current.question}
                  </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-2">
                  {current.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentIndex] === index;
                    const isCorrect = index === current.correctAnswerIndex;
                    const showResult = submitted && (isSelected || isCorrect);
                    const showCorrect = submitted && isCorrect;
                    const showWrong = submitted && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        type="button"
                        className={`relative flex h-auto w-full items-center justify-start overflow-visible rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                          showCorrect
                            ? "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[inset_0_3px_5px_rgba(255,255,255,.75),0_0_0_4px_rgba(52,211,153,.12),0_10px_24px_rgba(52,211,153,.24)] dark:bg-emerald-400/15 dark:text-emerald-100"
                            : showWrong
                              ? "border-rose-200 bg-rose-100 text-rose-900 shadow-[inset_0_3px_5px_rgba(255,255,255,.72),0_0_0_4px_rgba(251,113,133,.09),0_10px_22px_rgba(251,113,133,.16)] dark:bg-rose-400/15 dark:text-rose-100"
                              : isSelected
                                ? "border-violet-400 bg-violet-500 text-white shadow-[inset_0_3px_4px_rgba(255,255,255,.24),0_10px_20px_rgba(139,92,246,.2)]"
                                : "border-white bg-white/85 text-slate-800 shadow-[inset_0_2px_3px_rgba(255,255,255,.9),0_8px_18px_rgba(124,58,237,.08)] hover:border-violet-200 hover:bg-violet-50/80 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-violet-400/60 dark:hover:bg-violet-400/10"
                        }`}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={submitted}
                        whileHover={
                          submitted
                            ? undefined
                            : { y: -4, scale: 1.018, rotateX: 3, rotateY: -2 }
                        }
                        whileTap={submitted ? undefined : { scale: 0.985 }}
                        animate={
                          showWrong
                            ? { x: [0, -5, 4, -3, 2, 0] }
                            : showCorrect
                              ? { scale: [1, 1.045, 1] }
                              : { x: 0, scale: 1 }
                        }
                        transition={{ duration: showWrong ? 0.42 : 0.35 }}
                      >
                        {showCorrect && isSelected && (
                          <div className="pointer-events-none absolute inset-0">
                            {particles.map((particle, particleIndex) => (
                              <motion.span
                                key={particleIndex}
                                className={`absolute left-7 top-1/2 h-2 w-2 rounded-full ${
                                  particleIndex % 3 === 0
                                    ? "bg-yellow-300"
                                    : particleIndex % 3 === 1
                                      ? "bg-pink-300"
                                      : "bg-emerald-400"
                                }`}
                                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                                animate={{
                                  opacity: [0, 1, 0],
                                  x:
                                    Math.cos(particle.angle) *
                                    particle.distance,
                                  y:
                                    Math.sin(particle.angle) *
                                    particle.distance,
                                  scale: [0.4, 1, 0.2],
                                }}
                                transition={{
                                  duration: 0.72,
                                  delay: particle.delay,
                                  ease: "easeOut",
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">
                            {showCorrect && (
                              <motion.div
                                initial={{ scale: 0, rotate: -100 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 18,
                                }}
                              >
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                              </motion.div>
                            )}
                            {showWrong && (
                              <motion.div
                                initial={{ scale: 0, rotate: 90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 18,
                                }}
                              >
                                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-300" />
                              </motion.div>
                            )}
                            {!showResult && (
                              <div
                                className={`h-5 w-5 rounded-full border-2 ${
                                  isSelected
                                    ? "border-white bg-white"
                                    : "border-muted-foreground"
                                }`}
                              />
                            )}
                          </div>
                          <span className="text-sm">{option}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`rounded-xl border p-3 ${
                        isAnswerCorrect
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"
                          : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isAnswerCorrect ? (
                          <Sparkles className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-600" />
                        )}
                        <p className="font-semibold">
                          {isAnswerCorrect
                            ? "Great job!"
                            : "Nice try! Let's learn together."}
                        </p>
                      </div>
                      <p className="mt-1 text-sm">
                        {isAnswerCorrect
                          ? current.explanation ||
                            "Great job! Your answer is correct."
                          : `The correct answer is: ${current.options[current.correctAnswerIndex]}`}
                      </p>
                      {!isAnswerCorrect && current.explanation && (
                        <p className="text-sm mt-2">{current.explanation}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswers[currentIndex] === undefined}
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
