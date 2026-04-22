// Vocabulary types
export type Category = "greetings" | "numbers" | "emotions" | "actions" | "family" | "animals" | "colors";
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
    description: "Wave your hand and move it forward with a friendly smile",
    example: "Say hello to your friend",
  },
  {
    id: "greet-thank-you",
    word: getDriveVideoName("greet-thank-you"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-thank-you",
    description: "Place hand on chest and move it forward in an arc",
    example: "Thank you for helping me",
  },
  {
    id: "num-zero",
    word: getDriveVideoName("num-0"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-0",
    description: "Hold up both hands with fingers curled, making a circle shape",
    example: "Zero is the starting number",
  },
  {
    id: "num-one",
    word: getDriveVideoName("num-1"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-1",
    description: "Hold up your index finger",
    example: "I have one apple",
  },
  {
    id: "num-two",
    word: getDriveVideoName("num-2"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-2",
    description: "Hold up your index and middle finger",
    example: "Two birds are flying",
  },
  {
    id: "num-three",
    word: getDriveVideoName("num-3"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-3",
    description: "Hold up your index, middle, and ring finger",
    example: "Three cats are playing",
  },
  {
    id: "num-four",
    word: getDriveVideoName("num-4"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-4",
    description: "Hold up four fingers (all except thumb)",
    example: "The cat has four legs",
  },
  {
    id: "num-five",
    word: getDriveVideoName("num-5"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-5",
    description: "Hold up all five fingers with your hand open",
    example: "Five is half of ten",
  },
  {
    id: "num-six",
    word: getDriveVideoName("num-6"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-6",
    description: "Hold up six fingers (special hand position)",
    example: "There are six eggs in the basket",
  },
  {
    id: "emotion-happy",
    word: getDriveVideoName("emotion-happy"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-happy",
    description: "Biểu hiện cảm xúc vui",
    example: "Tôi rất vui hôm nay",
  },
  {
    id: "emotion-sad",
    word: getDriveVideoName("emotion-sad"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-sad",
    description: "Biểu hiện cảm xúc buồn",
    example: "Tôi cảm thấy buồn",
  },
  {
    id: "emotion-angry",
    word: getDriveVideoName("emotion-angry"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-angry",
    description: "Biểu hiện cảm xúc tức giận",
    example: "Bạn ấy đang tức giận",
  },
  {
    id: "emotion-disappointed",
    word: getDriveVideoName("emotion-disappointed"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-disappointed",
    description: "Biểu hiện cảm xúc thất vọng",
    example: "Tôi hơi thất vọng một chút",
  },
  {
    id: "emotion-tired",
    word: getDriveVideoName("emotion-tired"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-tired",
    description: "Biểu hiện cảm xúc hơi mệt thôi",
    example: "Không, tôi hơi mệt thôi",
  },
  {
    id: "family-anh",
    word: getDriveVideoName("family-anh"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-anh",
    description: "Biểu hiện từ chỉ anh",
    example: "Anh tôi đang đi học",
  },
  {
    id: "family-ong-ngoai",
    word: getDriveVideoName("family-ong-ngoai"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-ong-ngoai",
    description: "Biểu hiện từ chỉ ông ngoại",
    example: "Ông ngoại tôi rất thương tôi",
  },
  {
    id: "family-me",
    word: getDriveVideoName("family-me"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-me",
    description: "Biểu hiện từ chỉ mẹ",
    example: "Mẹ tôi nấu ăn rất ngon",
  },
  {
    id: "family-ba",
    word: getDriveVideoName("family-ba"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-ba",
    description: "Biểu hiện từ chỉ ba",
    example: "Ba tôi rất nghiêm khắc",
  },
  {
    id: "family-chi",
    word: getDriveVideoName("family-chi"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-chi",
    description: "Biểu hiện từ chỉ chị",
    example: "Chị tôi rất vui tính",
  },
  {
    id: "animal-cat",
    word: getDriveVideoName("animal-cat"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-cat",
    description: "Biểu hiện từ chỉ con mèo",
    example: "Con mèo đang ngủ",
  },
  {
    id: "animal-bird",
    word: getDriveVideoName("animal-bird"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-bird",
    description: "Biểu hiện từ chỉ con chim",
    example: "Con chim đang bay",
  },
  {
    id: "animal-fish",
    word: getDriveVideoName("animal-fish"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-fish",
    description: "Biểu hiện từ chỉ con cá",
    example: "Con cá đang bơi",
  },
  {
    id: "animal-mosquito",
    word: getDriveVideoName("animal-mosquito"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-mosquito",
    description: "Biểu hiện từ chỉ con muỗi",
    example: "Con muỗi bay quanh đèn",
  },
  {
    id: "animal-monkey",
    word: getDriveVideoName("animal-monkey"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-monkey",
    description: "Biểu hiện từ chỉ con khỉ",
    example: "Con khỉ leo cây",
  },
  {
    id: "color-black",
    word: getDriveVideoName("color-black"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-black",
    description: "Biểu hiện màu đen",
    example: "Áo màu đen",
  },
  {
    id: "color-red",
    word: getDriveVideoName("color-red"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-red",
    description: "Biểu hiện màu đỏ",
    example: "Quả táo màu đỏ",
  },
  {
    id: "color-blue",
    word: getDriveVideoName("color-blue"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-blue",
    description: "Biểu hiện màu xanh dương",
    example: "Bầu trời màu xanh dương",
  },
  {
    id: "color-yellow",
    word: getDriveVideoName("color-yellow"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-yellow",
    description: "Biểu hiện màu vàng",
    example: "Hoa màu vàng",
  },
  {
    id: "color-pink",
    word: getDriveVideoName("color-pink"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-pink",
    description: "Biểu hiện màu hồng",
    example: "Bông hoa màu hồng",
  },
  {
    id: "viet-cau-don-ban-khoe-khong",
    word: getDriveVideoName("greet-how-are-you"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-how-are-you",
    description: "Hỏi người khác về sức khỏe - một cách chào hỏi phổ biến trong giao tiếp hàng ngày",
    example: "Khi gặp bạn, bạn hỏi: Bạn khỏe không?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap",
    word: getDriveVideoName("greet-long-time-no-see"),
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/api/video-stream/greet-long-time-no-see",
    description: "Câu chào hỏi khi gặp lại ai sau thời gian dài không liên lạc",
    example: "Gặp một người bạn cũ, bạn nói: Lâu quá không gặp, bạn khỏe không?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap-2",
    word: getDriveVideoName("greet-long-time-no-see"),
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/api/video-stream/greet-long-time-no-see",
    description: "Biến thể của câu chào hỏi - luyện tập phát âm chính xác",
    example: "Thực hành cách nói chào khi gặp lại bạn bè hoặc người quen",
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
  greetings: "Chào hỏi",
  numbers: "Số đếm",
  emotions: "Cảm xúc",
  actions: "Hành động",
  family: "Gia đình",
  animals: "Động vật",
  colors: "Màu sắc",
};

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
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