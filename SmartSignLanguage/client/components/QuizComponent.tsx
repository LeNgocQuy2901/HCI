import { useEffect, useState } from "react";
import {
  QuizQuestion,
  VocabularyCard,
  vocabularyCards,
} from "@shared/vocabulary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2, XCircle } from "lucide-react";
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
  }) => void;
}

export default function QuizComponent({
  questions,
  onComplete,
}: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSubmitted(false);
    } else {
      // Calculate score
      const correctAnswers = questions.filter(
        (q, i) => q.correctAnswerIndex === selectedAnswers[i],
      ).length;
      onComplete({
        score: correctAnswers,
        totalQuestions: questions.length,
        answers: selectedAnswers,
      });
    }
  };

  const isAnswerCorrect =
    selectedAnswers[currentIndex] === current.correctAnswerIndex;

  useEffect(() => {
    if (submitted && isAnswerCorrect) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [submitted, isAnswerCorrect, currentIndex]);

  const fireworkBursts = [
    { left: "15%", top: "15%", delay: "0ms" },
    { left: "45%", top: "12%", delay: "90ms" },
    { left: "75%", top: "18%", delay: "160ms" },
    { left: "22%", top: "52%", delay: "120ms" },
    { left: "60%", top: "48%", delay: "40ms" },
    { left: "82%", top: "62%", delay: "190ms" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 font-kids">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Question {currentIndex + 1} / {questions.length}
          </h3>
          <Badge>{Math.round(progress)}% complete</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="relative p-8 space-y-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        {showCelebration && (
          <div className="quiz-fireworks" aria-hidden="true">
            {fireworkBursts.map((burst, index) => (
              <span
                key={index}
                className="quiz-firework"
                style={{ left: burst.left, top: burst.top, animationDelay: burst.delay }}
              />
            ))}
          </div>
        )}
        {/* Question Type Badge */}
        <div className="flex gap-2">
          <Badge variant="secondary">
            {quizTypeLabels[current.type] || "Quiz"}
          </Badge>
          <Badge variant="outline">
            {difficultyLabels[current.difficulty]}
          </Badge>
        </div>

        {/* Video Preview */}
        {currentCard && (
          <div className="space-y-4">
            <div className="w-full max-w-xl mx-auto rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <video
                key={currentCard.id}
                className="w-full h-auto max-h-72 bg-black"
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

            <div className="text-center space-y-2">
              <Badge variant="outline">
                {categoryLabels[currentCard.category]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {currentCard.description}
              </p>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {current.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {current.options.map((option, index) => {
            const isSelected = selectedAnswers[currentIndex] === index;
            const isCorrect = index === current.correctAnswerIndex;
            const showResult = submitted && (isSelected || isCorrect);

            return (
              <Button
                key={index}
                variant={isSelected ? "default" : "outline"}
                className={`justify-start text-left h-auto py-4 px-4 ${
                  showResult && isCorrect
                    ? "bg-green-500 hover:bg-green-600 border-green-500"
                    : showResult && isSelected && !isCorrect
                      ? "bg-red-500 hover:bg-red-600 border-red-500"
                      : ""
                }`}
                onClick={() => handleSelectAnswer(index)}
                disabled={submitted}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    {showResult && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-white" />
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
              </Button>
            );
          })}
        </div>

        {/* Feedback */}
        {submitted && (
          <div
            className={`p-4 rounded-lg ${
              isAnswerCorrect
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <p className="font-semibold mb-1">
              {isAnswerCorrect ? "Correct" : "Incorrect"}
            </p>
            <p className="text-sm">
              {isAnswerCorrect
                ? current.explanation || "Great job! Your answer is correct."
                : `The correct answer is: ${current.options[current.correctAnswerIndex]}`}
            </p>
            {!isAnswerCorrect && current.explanation && (
              <p className="text-sm mt-2">{current.explanation}</p>
            )}
          </div>
        )}
      </Card>

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
