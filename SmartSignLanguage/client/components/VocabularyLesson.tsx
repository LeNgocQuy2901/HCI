import { useState, useMemo } from "react";
import {
  vocabularyCards,
  VocabularyCard as IVocabularyCard,
  categoryLabels,
  categories,
} from "@shared/vocabulary";
import VocabularyCard from "./VocabularyCard";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Progress } from "./ui/progress";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function VocabularyLesson() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [progress, setProgress] = useState<
    Record<string, "new" | "learning" | "mastered">
  >({});

  // Filter cards based on selected filters
  const filteredCards = useMemo(() => {
    return vocabularyCards.filter((card) => {
      if (selectedCategory && card.category !== selectedCategory) return false;
      if (selectedDifficulty && card.difficulty !== selectedDifficulty)
        return false;
      return true;
    });
  }, [selectedCategory, selectedDifficulty]);

  const currentCard = filteredCards[currentIndex];

  const handleRemember = (cardId: string) => {
    setProgress((prev) => ({
      ...prev,
      [cardId]: "mastered",
    }));
    nextCard();
  };

  const handleForgot = (cardId: string) => {
    setProgress((prev) => ({
      ...prev,
      [cardId]: "learning",
    }));
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Calculate stats
  const masteredCount = Object.values(progress).filter(
    (s) => s === "mastered"
  ).length;
  const learningCount = Object.values(progress).filter(
    (s) => s === "learning"
  ).length;
  const progressPercentage =
    filteredCards.length > 0
      ? ((masteredCount + learningCount) / filteredCards.length) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <BookOpen size={32} />
          Vocabulary Learning
        </h1>
        <p className="text-muted-foreground">
          Master sign language with interactive flashcards
        </p>
      </div>

      {/* Filters */}
      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Category</label>
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Difficulty</label>
            <ToggleGroup
              type="single"
              value={selectedDifficulty || ""}
              onValueChange={(value) =>
                setSelectedDifficulty(value || null)
              }
            >
              <ToggleGroupItem value="">All</ToggleGroupItem>
              <ToggleGroupItem value="beginner">Beginner</ToggleGroupItem>
              <ToggleGroupItem value="intermediate">
                Intermediate
              </ToggleGroupItem>
              <ToggleGroupItem value="advanced">Advanced</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Learning Progress</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50">
              New: {filteredCards.length - masteredCount - learningCount}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50">
              Learning: {learningCount}
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              Mastered: {masteredCount}
            </Badge>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {Math.round(progressPercentage)}% completed
        </p>
      </div>

      {/* No cards message */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No vocabulary cards found with the selected filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedDifficulty(null);
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Card Display */}
          <div className="py-8">
            {currentCard && (
              <VocabularyCard
                card={currentCard}
                onRemember={handleRemember}
                onForgot={handleForgot}
                status={progress[currentCard.id] || "new"}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft size={18} />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm font-semibold">
                Card {currentIndex + 1} of {filteredCards.length}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={nextCard}
              disabled={currentIndex === filteredCards.length - 1}
              className="gap-2"
            >
              Next
              <ChevronRight size={18} />
            </Button>
          </div>

          {/* Reset Progress Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProgress({});
                setCurrentIndex(0);
              }}
            >
              Reset Progress
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
