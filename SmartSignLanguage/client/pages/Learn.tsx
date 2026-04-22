import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import VocabularyCardFlip from "@/components/VocabularyCardFlip";
import ProgressTracker from "@/components/ProgressTracker";
import QuizComponent from "@/components/QuizComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  difficultyLabels,
  Category,
  Difficulty,
  QuizQuestion,
  type VocabularyCard as VocabType,
} from "@shared/vocabulary";
import { useLearningStore } from "@/hooks/use-learning-store";
import { useAuthStore } from "@/hooks/use-auth";
import { BookOpen, BarChart3, HelpCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "learn" | "review" | "quiz" | "stats";

export default function Learn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const learningStore = useLearningStore();

  const [activeTab, setActiveTab] = useState<Tab>("learn");
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    "greetings"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(
    "beginner"
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cards, setCards] = useState<VocabType[]>([]);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const userId = user?.id || "guest";

  // Initialize or get learning data
  useEffect(() => {
    if (selectedCategory) {
      const categoryCards = learningStore.getCardsByCategory(
        selectedCategory,
        userId
      );
      setCards(categoryCards);
      setCurrentCardIndex(0);
    }
  }, [selectedCategory, userId]);

  // Initialize cards in learning store on first load
  useEffect(() => {
    if (user?.id) {
      vocabularyCards.forEach((card) => {
        const key = `${user.id}:${card.id}`;
        if (!learningStore.progress.has(key)) {
          learningStore.addProgress(card.id, user.id);
        }
      });
    }
  }, [user?.id]);

  const currentCard = cards[currentCardIndex];
  const stats = learningStore.getProgressStats(userId);
  const dueCards = learningStore.getDueCards(userId, 5);
  const newCards = learningStore.getNewCards(userId, 5);

  const handleMarkCorrect = () => {
    if (!currentCard) return;
    learningStore.updateProgress(currentCard.id, userId, 4); // 4/5 quality
    toast({ description: "Tuyệt! Bạn làm đúng rồi!" });
    handleNextCard();
  };

  const handleMarkWrong = () => {
    if (!currentCard) return;
    learningStore.updateProgress(currentCard.id, userId, 2); // 2/5 quality
    toast({ description: "Không sao, lần sau bạn sẽ làm được!" });
    handleNextCard();
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      toast({ description: "Bạn đã hoàn thành chủ đề này!" });
      setCurrentCardIndex(0);
    }
  };

  const generateQuiz = () => {
    const quizCards = cards.slice(0, 10);
    const questions: QuizQuestion[] = quizCards.map((card, index) => {
      const questionType = index % 3 === 0 ? "video-to-text" : index % 3 === 1 ? "text-to-video" : "multiple-choice";
      
      const wrongAnswers = vocabularyCards
        .filter((c) => c.id !== card.id)
        .slice(0, 3)
        .map((c) => c.word);
      
      const options = [card.word, ...wrongAnswers].sort(() => Math.random() - 0.5);
      const correctAnswerIndex = options.indexOf(card.word);

      return {
        id: `quiz-${index}`,
        type: questionType as "video-to-text" | "text-to-video" | "multiple-choice",
        cardId: card.id,
        question: "Kí hiệu trên là gì?",
        options,
        correctAnswerIndex,
        difficulty: card.difficulty,
      };
    });

    setQuizQuestions(questions);
    setQuizMode(true);
  };

  const handleQuizComplete = (results: {
    score: number;
    totalQuestions: number;
    answers: number[];
  }) => {
    const percentage = (results.score / results.totalQuestions) * 100;
    toast({
      title: "Hoàn thành bài kiểm tra!",
      description: `Bạn đạt ${results.score}/${results.totalQuestions} (${Math.round(percentage)}%)`,
    });
    setQuizMode(false);
    setQuizQuestions([]);
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
            ← Quay lại học
          </Button>
          <QuizComponent
            questions={quizQuestions}
            onComplete={handleQuizComplete}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Học ngôn ngữ ký hiệu</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Làm chủ ngôn ngữ ký hiệu với thẻ học tương tác, bài kiểm tra và ôn
            tập lặp lại ngắt quãng
          </p>
        </div>

        {/* Quick Stats */}
        <ProgressTracker stats={stats} compact={true} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="learn" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Học
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2">
              <Zap className="h-4 w-4" />
              Ôn tập
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Kiểm tra
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Thống kê
            </TabsTrigger>
          </TabsList>

          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-6">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Chủ đề
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(v) =>
                      setSelectedCategory(v as Category)
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
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Độ khó
                  </label>
                  <Select
                    value={selectedDifficulty}
                    onValueChange={(v) =>
                      setSelectedDifficulty(v as Difficulty)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(difficultyLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {cards.length > 0 && currentCard && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {currentCardIndex + 1} / {cards.length}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Lật thẻ để xem ký hiệu
                    </p>
                  </div>

                  <VocabularyCardFlip
                    card={currentCard}
                    onMarkCorrect={handleMarkCorrect}
                    onMarkWrong={handleMarkWrong}
                  />
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Due for Review */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Cần ôn tập ({dueCards.length})
                </h3>
                <div className="space-y-2">
                  {dueCards.length > 0 ? (
                    dueCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                        onClick={() => {
                          const idx = cards.findIndex((c) => c.id === card.id);
                          if (idx !== -1) {
                            setCurrentCardIndex(idx);
                            setActiveTab("learn");
                          }
                        }}
                      >
                        <p className="font-medium">{card.word}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabels[card.category]}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Bạn đã theo kịp hết rồi!</p>
                  )}
                </div>
              </Card>

              {/* New Cards */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Thẻ mới ({newCards.length})
                </h3>
                <div className="space-y-2">
                  {newCards.length > 0 ? (
                    newCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                        onClick={() => {
                          setSelectedCategory(card.category as Category);
                          const idx = vocabularyCards.findIndex(
                            (c) => c.id === card.id
                          );
                          if (idx !== -1) {
                            setCurrentCardIndex(idx);
                            setActiveTab("learn");
                          }
                        }}
                      >
                        <p className="font-medium">{card.word}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabels[card.category]}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Không có thẻ mới
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">
            <Card className="p-6 text-center space-y-4">
              <HelpCircle className="h-16 w-16 mx-auto text-blue-500" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Kiểm tra kiến thức của bạn</h3>
                <p className="text-muted-foreground mb-6">
                  Làm bài kiểm tra để đánh giá những gì bạn đã học và củng cố
                  trí nhớ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-muted">
                  <p className="text-3xl font-bold text-blue-500">
                    {cards.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Có sẵn trong {categoryLabels[selectedCategory]}
                  </p>
                </Card>
                <Card className="p-4 bg-muted">
                  <p className="text-3xl font-bold text-green-500">10</p>
                  <p className="text-sm text-muted-foreground">
                    Câu hỏi mỗi bài
                  </p>
                </Card>
                <Card className="p-4 bg-muted">
                  <p className="text-3xl font-bold text-purple-500">
                    {stats.totalReviewsToday}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Đã luyện tập hôm nay
                  </p>
                </Card>
              </div>

              <Button onClick={generateQuiz} size="lg" className="gap-2">
                <HelpCircle className="h-5 w-5" />
                Bắt đầu kiểm tra chủ đề {categoryLabels[selectedCategory]}
              </Button>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <ProgressTracker stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
