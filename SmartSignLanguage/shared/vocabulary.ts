// Vocabulary types
export type Category =
  | "greetings"
  | "numbers"
  | "emotions"
  | "actions"
  | "family"
  | "animals"
  | "colors";
export type Difficulty = "beginner" | "intermediate" | "advanced";

import { getDriveVideoName } from "./google-drive";

export interface VocabularyCard {
  id: string;
  word: string;
  category: Category;
  difficulty: Difficulty;
  videoUrl: string;
  description: string;
  example?: string;
}

// SRS (Spaced Repetition System) types
export interface SRSProgress {
  cardId: string;
  userId: string;
  status: "new" | "learning" | "mastered";
  interval: number; // days until next review
  difficulty: number; // 1-5, how hard to remember
  easeFactor: number; // SM-2 algorithm ease factor
  nextReviewDate: string; // ISO date
  attempts: number;
  correctAttempts: number;
  lastReviewedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningProgress {
  cardId: string;
  status: "new" | "learning" | "mastered";
  attempts: number;
  lastReviewed?: Date;
}

// Quiz types
export interface QuizQuestion {
  id: string;
  type: "video-to-text" | "text-to-video" | "multiple-choice";
  cardId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  difficulty: Difficulty;
}

export interface QuizResult {
  id: string;
  userId: string;
  cardIds: string[];
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: string;
  difficulty: Difficulty;
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "milestone" | "streak" | "quiz" | "collection";
  requirement: number; // e.g., 10 words learned
  earned: boolean;
  unlockedDate?: string;
}

// Mock vocabulary data
export const vocabularyCards: VocabularyCard[] = [
  {
    id: "greet-hello",
    word: getDriveVideoName("greet-hello"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-hello",
    description: "Wave your hand forward with a friendly expression.",
    example: "Say hello to a friend.",
  },
  {
    id: "greet-thank-you",
    word: getDriveVideoName("greet-thank-you"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-thank-you",
    description: "Move your hand from your chin outward to express thanks.",
    example: "Thank you for helping me.",
  },
  {
    id: "num-zero",
    word: getDriveVideoName("num-0"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-0",
    description: "Form a zero shape with your hand.",
    example: "Zero is the starting number.",
  },
  {
    id: "num-one",
    word: getDriveVideoName("num-1"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-1",
    description: "Raise your index finger.",
    example: "I have one apple.",
  },
  {
    id: "num-two",
    word: getDriveVideoName("num-2"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-2",
    description: "Raise your index and middle fingers.",
    example: "Two birds are flying.",
  },
  {
    id: "num-three",
    word: getDriveVideoName("num-3"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-3",
    description: "Raise three fingers.",
    example: "Three people are playing.",
  },
  {
    id: "num-four",
    word: getDriveVideoName("num-4"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-4",
    description: "Raise four fingers with the thumb folded.",
    example: "A table has four legs.",
  },
  {
    id: "num-five",
    word: getDriveVideoName("num-5"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-5",
    description: "Open your hand with all five fingers visible.",
    example: "Five is half of ten.",
  },
  {
    id: "num-six",
    word: getDriveVideoName("num-6"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-6",
    description: "Use the standard hand shape for six.",
    example: "There are six eggs in the basket.",
  },
  {
    id: "emotion-happy",
    word: getDriveVideoName("emotion-happy"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-happy",
    description: "Show a happy facial expression and hand movement.",
    example: "I feel happy today.",
  },
  {
    id: "emotion-sad",
    word: getDriveVideoName("emotion-sad"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-sad",
    description: "Show sadness through expression and gesture.",
    example: "I feel sad.",
  },
  {
    id: "emotion-angry",
    word: getDriveVideoName("emotion-angry"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-angry",
    description: "Show anger through facial expression and gesture.",
    example: "He is angry.",
  },
  {
    id: "emotion-disappointed",
    word: getDriveVideoName("emotion-disappointed"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-disappointed",
    description: "Express disappointment clearly.",
    example: "I am a little disappointed.",
  },
  {
    id: "emotion-tired",
    word: getDriveVideoName("emotion-tired"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-tired",
    description: "Express that you are tired.",
    example: "No, I am just tired.",
  },
  {
    id: "action-sleep",
    word: getDriveVideoName("action-sleep"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-sleep",
    description: "Show the action of sleeping.",
    example: "The baby is sleeping.",
  },
  {
    id: "action-walk",
    word: getDriveVideoName("action-walk"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-walk",
    description: "Show the action of walking.",
    example: "I walk to school.",
  },
  {
    id: "action-read",
    word: getDriveVideoName("action-read"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-read",
    description: "Show the action of reading a book.",
    example: "I am reading a book.",
  },
  {
    id: "action-listen-to-music",
    word: getDriveVideoName("action-listen-to-music"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-listen-to-music",
    description: "Show the action of listening to music.",
    example: "I like listening to music.",
  },
  {
    id: "action-watch-movie",
    word: getDriveVideoName("action-watch-movie"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-watch-movie",
    description: "Show the action of watching a movie.",
    example: "I will watch a movie tonight.",
  },
  {
    id: "family-anh",
    word: getDriveVideoName("family-anh"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-anh",
    description: "Sign for older brother.",
    example: "My older brother is studying.",
  },
  {
    id: "family-ong-ngoai",
    word: getDriveVideoName("family-ong-ngoai"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-ong-ngoai",
    description: "Sign for grandfather.",
    example: "My grandfather cares about me.",
  },
  {
    id: "family-me",
    word: getDriveVideoName("family-me"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-me",
    description: "Sign for mother.",
    example: "My mother cooks well.",
  },
  {
    id: "family-ba",
    word: getDriveVideoName("family-ba"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-ba",
    description: "Sign for father.",
    example: "My father is strict.",
  },
  {
    id: "family-chi",
    word: getDriveVideoName("family-chi"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-chi",
    description: "Sign for older sister.",
    example: "My older sister is cheerful.",
  },
  {
    id: "animal-cat",
    word: getDriveVideoName("animal-cat"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-cat",
    description: "Sign for cat.",
    example: "The cat is sleeping.",
  },
  {
    id: "animal-bird",
    word: getDriveVideoName("animal-bird"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-bird",
    description: "Sign for bird.",
    example: "The bird is flying.",
  },
  {
    id: "animal-fish",
    word: getDriveVideoName("animal-fish"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-fish",
    description: "Sign for fish.",
    example: "The fish is swimming.",
  },
  {
    id: "animal-mosquito",
    word: getDriveVideoName("animal-mosquito"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-mosquito",
    description: "Sign for mosquito.",
    example: "A mosquito is flying near the light.",
  },
  {
    id: "animal-monkey",
    word: getDriveVideoName("animal-monkey"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-monkey",
    description: "Sign for monkey.",
    example: "The monkey climbs a tree.",
  },
  {
    id: "color-black",
    word: getDriveVideoName("color-black"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-black",
    description: "Sign for black.",
    example: "The shirt is black.",
  },
  {
    id: "color-red",
    word: getDriveVideoName("color-red"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-red",
    description: "Sign for red.",
    example: "The apple is red.",
  },
  {
    id: "color-blue",
    word: getDriveVideoName("color-blue"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-blue",
    description: "Sign for blue.",
    example: "The sky is blue.",
  },
  {
    id: "color-yellow",
    word: getDriveVideoName("color-yellow"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-yellow",
    description: "Sign for yellow.",
    example: "The flower is yellow.",
  },
  {
    id: "color-pink",
    word: getDriveVideoName("color-pink"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-pink",
    description: "Sign for pink.",
    example: "The flower is pink.",
  },
  {
    id: "viet-cau-don-ban-khoe-khong",
    word: getDriveVideoName("greet-how-are-you"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-how-are-you",
    description: "Ask someone how they are.",
    example: "When you meet a friend, ask: How are you?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap",
    word: getDriveVideoName("greet-long-time-no-see"),
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/api/video-stream/greet-long-time-no-see",
    description: "Greet someone you have not seen for a long time.",
    example: "Long time no see. How are you?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap-2",
    word: getDriveVideoName("greet-long-time-no-see"),
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/api/video-stream/greet-long-time-no-see",
    description: "Practice a variation of the long-time-no-see greeting.",
    example: "Practice greeting friends and acquaintances.",
  },
];

export const categories = [
  "greetings",
  "numbers",
  "emotions",
  "actions",
  "family",
  "animals",
  "colors",
] as const;

export const difficulties = ["beginner", "intermediate", "advanced"] as const;

export const categoryLabels: Record<Category, string> = {
  greetings: "Greetings",
  numbers: "Numbers",
  emotions: "Emotions",
  actions: "Actions",
  family: "Family",
  animals: "Animals",
  colors: "Colors",
};

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Helper functions
export function getVocabulariesByCategory(
  category: Category,
): VocabularyCard[] {
  return vocabularyCards.filter((card) => card.category === category);
}

export function getVocabulariesByDifficulty(
  difficulty: Difficulty,
): VocabularyCard[] {
  return vocabularyCards.filter((card) => card.difficulty === difficulty);
}

export function getVocabulariesByCategoryAndDifficulty(
  category: Category,
  difficulty: Difficulty,
): VocabularyCard[] {
  return vocabularyCards.filter(
    (card) => card.category === category && card.difficulty === difficulty,
  );
}

// Achievement presets
export const predefinedAchievements: Achievement[] = [
  {
    id: "first-word",
    name: "First Word",
    description: "Learn your first sign language word",
    icon: "🌟",
    type: "milestone",
    requirement: 1,
    earned: false,
  },
  {
    id: "ten-words",
    name: "Getting Started",
    description: "Learn 10 sign language words",
    icon: "📚",
    type: "milestone",
    requirement: 10,
    earned: false,
  },
  {
    id: "fifty-words",
    name: "Making Progress",
    description: "Learn 50 sign language words",
    icon: "🚀",
    type: "milestone",
    requirement: 50,
    earned: false,
  },
  {
    id: "hundred-words",
    name: "Master",
    description: "Learn 100 sign language words",
    icon: "🎯",
    type: "milestone",
    requirement: 100,
    earned: false,
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "Score 100% on a quiz",
    icon: "👑",
    type: "quiz",
    requirement: 1,
    earned: false,
  },
  {
    id: "seven-day-streak",
    name: "7-Day Streak",
    description: "Study for 7 consecutive days",
    icon: "🔥",
    type: "streak",
    requirement: 7,
    earned: false,
  },
];
