// Vocabulary types
export type Category = "greetings" | "numbers" | "emotions" | "daily" | "actions" | "family" | "health";
export type Difficulty = "beginner" | "intermediate" | "advanced";

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
    word: "Hello",
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/videos/greet-hello.mp4",
    description: "Wave your hand and move it forward with a friendly smile",
    example: "Say hello to your friend",
  },
  {
    id: "greet-thank-you",
    word: "Thank You",
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/videos/greet-thank-you.mp4",
    description: "Place hand on chest and move it forward in an arc",
    example: "Thank you for helping me",
  },
  {
    id: "num-zero",
    word: "Zero",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/zero.mp4",
    description: "Hold up both hands with fingers curled, making a circle shape",
    example: "Zero is the starting number",
  },
  {
    id: "num-one",
    word: "One",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/one.mp4",
    description: "Hold up your index finger",
    example: "I have one apple",
  },
  {
    id: "num-two",
    word: "Two",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/two.mp4",
    description: "Hold up your index and middle finger",
    example: "Two birds are flying",
  },
  {
    id: "num-three",
    word: "Three",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/three.mp4",
    description: "Hold up your index, middle, and ring finger",
    example: "Three cats are playing",
  },
  {
    id: "num-four",
    word: "Four",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/four.mp4",
    description: "Hold up four fingers (all except thumb)",
    example: "The cat has four legs",
  },
  {
    id: "num-five",
    word: "Five",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/five.mp4",
    description: "Hold up all five fingers with your hand open",
    example: "Five is half of ten",
  },
  {
    id: "num-six",
    word: "Six",
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/videos/Numbers/six.mp4",
    description: "Hold up six fingers (special hand position)",
    example: "There are six eggs in the basket",
  },
  {
    id: "emotion-happy",
    word: "Happy",
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/videos/emotion-happy.mp4",
    description: "Draw a smile with both hands on your face",
    example: "I am very happy today",
  },
  {
    id: "emotion-sad",
    word: "Sad",
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/videos/emotion-sad.mp4",
    description: "Draw a frown with both hands on your face",
    example: "He felt sad yesterday",
  },
  {
    id: "daily-eat",
    word: "Eat",
    category: "daily",
    difficulty: "beginner",
    videoUrl: "/videos/daily-eat.mp4",
    description: "Bring fingertips to your mouth repeatedly",
    example: "Let's eat breakfast",
  },
  {
    id: "daily-drink",
    word: "Drink",
    category: "daily",
    difficulty: "beginner",
    videoUrl: "/videos/daily-drink.mp4",
    description: "Make a 'C' shape with hand and bring to mouth",
    example: "I need to drink water",
  },
  {
    id: "action-walk",
    word: "Walk",
    category: "actions",
    difficulty: "intermediate",
    videoUrl: "/videos/action-walk.mp4",
    description: "Alternate hands moving forward as if walking",
    example: "We walk in the park",
  },
  {
    id: "viet-cau-don-ban-khoe-khong",
    word: "Bạn khỏe không?",
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/videos/CauDon_BanKhoeKhong.mp4",
    description: "Hỏi người khác về sức khỏe - một cách chào hỏi phổ biến trong giao tiếp hàng ngày",
    example: "Khi gặp bạn, bạn hỏi: Bạn khỏe không?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap",
    word: "Lâu quá không gặp, bạn khỏe không?",
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/videos/CauPhuc_LauQuaKhongGap_BanKhoeKhong.mp4",
    description: "Câu chào hỏi khi gặp lại ai sau thời gian dài không liên lạc",
    example: "Gặp một người bạn cũ, bạn nói: Lâu quá không gặp, bạn khỏe không?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap-2",
    word: "Lâu quá không gặp, bạn khỏe không? (Phiên bản 2)",
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/videos/CauPhuc_LauQuaKhongGap_BanKhoeKhong.mp4",
    description: "Biến thể của câu chào hỏi - luyện tập phát âm chính xác",
    example: "Thực hành cách nói chào khi gặp lại bạn bè hoặc người quen",
  },
];

export const categories = [
  "greetings",
  "numbers",
  "emotions",
  "daily",
  "actions",
  "family",
  "health",
] as const;

export const difficulties = ["beginner", "intermediate", "advanced"] as const;

export const categoryLabels: Record<Category, string> = {
  greetings: "Greetings",
  numbers: "Numbers",
  emotions: "Emotions",
  daily: "Daily Life",
  actions: "Actions",
  family: "Family",
  health: "Health",
};

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Helper functions
export function getVocabulariesByCategory(category: Category): VocabularyCard[] {
  return vocabularyCards.filter((card) => card.category === category);
}

export function getVocabulariesByDifficulty(difficulty: Difficulty): VocabularyCard[] {
  return vocabularyCards.filter((card) => card.difficulty === difficulty);
}

export function getVocabulariesByCategoryAndDifficulty(
  category: Category,
  difficulty: Difficulty
): VocabularyCard[] {
  return vocabularyCards.filter(
    (card) => card.category === category && card.difficulty === difficulty
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
    name: "On Your Way",
    description: "Learn 50 sign language words",
    icon: "🚀",
    type: "milestone",
    requirement: 50,
    earned: false,
  },
  {
    id: "hundred-words",
    name: "Century Master",
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
    name: "Week Warrior",
    description: "Learn for 7 consecutive days",
    icon: "🔥",
    type: "streak",
    requirement: 7,
    earned: false,
  },
];
