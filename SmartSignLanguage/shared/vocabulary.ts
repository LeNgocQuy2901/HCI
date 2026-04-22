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
    description: "Vẫy tay và đưa về phía trước với nụ cười thân thiện",
    example: "Chào bạn của bạn",
  },
  {
    id: "greet-thank-you",
    word: getDriveVideoName("greet-thank-you"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-thank-you",
    description: "Đặt tay lên ngực rồi đưa tay ra phía trước theo đường cong",
    example: "Cảm ơn bạn đã giúp tôi",
  },
  {
    id: "num-zero",
    word: getDriveVideoName("num-0"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-0",
    description: "Giơ hai bàn tay với các ngón tay cong lại thành hình tròn",
    example: "Số không là số bắt đầu",
  },
  {
    id: "num-one",
    word: getDriveVideoName("num-1"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-1",
    description: "Giơ ngón trỏ lên",
    example: "Tôi có một quả táo",
  },
  {
    id: "num-two",
    word: getDriveVideoName("num-2"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-2",
    description: "Giơ ngón trỏ và ngón giữa",
    example: "Hai con chim đang bay",
  },
  {
    id: "num-three",
    word: getDriveVideoName("num-3"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-3",
    description: "Giơ ngón trỏ, ngón giữa và ngón áp út",
    example: "Ba con mèo đang chơi",
  },
  {
    id: "num-four",
    word: getDriveVideoName("num-4"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-4",
    description: "Giơ bốn ngón tay, trừ ngón cái",
    example: "Con mèo có bốn chân",
  },
  {
    id: "num-five",
    word: getDriveVideoName("num-5"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-5",
    description: "Xòe bàn tay và giơ đủ năm ngón",
    example: "Năm là một nửa của mười",
  },
  {
    id: "num-six",
    word: getDriveVideoName("num-6"),
    category: "numbers",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/num-6",
    description: "Giơ sáu ngón tay theo tư thế tay đặc biệt",
    example: "Có sáu quả trứng trong giỏ",
  },
  {
    id: "emotion-happy",
    word: getDriveVideoName("emotion-happy"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-happy",
    description: "Biểu hiện cảm xúc vui",
    example: "Hôm nay tôi rất vui",
  },
  {
    id: "emotion-sad",
    word: getDriveVideoName("emotion-sad"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-sad",
    description: "Biểu hiện cảm xúc buồn",
    example: "Tôi cảm thấy rất buồn",
  },
  {
    id: "emotion-angry",
    word: getDriveVideoName("emotion-angry"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-angry",
    description: "Biểu hiện cảm xúc tức giận",
    example: "Bạn ấy đang rất tức giận",
  },
  {
    id: "emotion-disappointed",
    word: getDriveVideoName("emotion-disappointed"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-disappointed",
    description: "Biểu hiện cảm xúc thất vọng",
    example: "Tôi hơi thất vọng",
  },
  {
    id: "emotion-tired",
    word: getDriveVideoName("emotion-tired"),
    category: "emotions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/emotion-tired",
    description: "Biểu hiện cảm xúc hơi mệt thôi",
    example: "Không, tôi chỉ hơi mệt thôi",
  },
  {
    id: "action-sleep",
    word: getDriveVideoName("action-sleep"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-sleep",
    description: "Biểu hiện hành động ngủ",
    example: "Em bé ngủ",
  },
  {
    id: "action-walk",
    word: getDriveVideoName("action-walk"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-walk",
    description: "Biểu hiện hành động đi",
    example: "Tôi đi học",
  },
  {
    id: "action-read",
    word: getDriveVideoName("action-read"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-read",
    description: "Biểu hiện hành động đọc sách",
    example: "Tôi đang đọc sách",
  },
  {
    id: "action-listen-to-music",
    word: getDriveVideoName("action-listen-to-music"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-listen-to-music",
    description: "Biểu hiện hành động nghe nhạc",
    example: "Tôi thích nghe nhạc lắm",
  },
  {
    id: "action-watch-movie",
    word: getDriveVideoName("action-watch-movie"),
    category: "actions",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/action-watch-movie",
    description: "Biểu hiện hành động xem phim",
    example: "Tối nay tôi xem phim",
  },
  {
    id: "family-anh",
    word: getDriveVideoName("family-anh"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-anh",
    description: "Biểu hiện từ chỉ anh",
    example: "Anh tôi đang học",
  },
  {
    id: "family-ong-ngoai",
    word: getDriveVideoName("family-ong-ngoai"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-ong-ngoai",
    description: "Biểu hiện từ chỉ ông ngoại",
    example: "Ông ngoại rất thương tôi",
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
    example: "Ba tôi rất nghiêm",
  },
  {
    id: "family-chi",
    word: getDriveVideoName("family-chi"),
    category: "family",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/family-chi",
    description: "Biểu hiện từ chỉ chị",
    example: "Chị tôi rất vui",
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
    example: "Con chim đang bay lượn",
  },
  {
    id: "animal-fish",
    word: getDriveVideoName("animal-fish"),
    category: "animals",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/animal-fish",
    description: "Biểu hiện từ chỉ con cá",
    example: "Con cá đang bơi dưới nước",
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
    example: "Con khỉ leo lên cây",
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
    example: "Quả táo đỏ",
  },
  {
    id: "color-blue",
    word: getDriveVideoName("color-blue"),
    category: "colors",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/color-blue",
    description: "Biểu hiện màu xanh dương",
    example: "Bầu trời xanh dương",
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
    example: "Bông hoa hồng",
  },
  {
    id: "viet-cau-don-ban-khoe-khong",
    word: getDriveVideoName("greet-how-are-you"),
    category: "greetings",
    difficulty: "beginner",
    videoUrl: "/api/video-stream/greet-how-are-you",
    description: "Hỏi thăm sức khỏe của người khác - một cách chào hỏi phổ biến trong giao tiếp hàng ngày",
    example: "Khi gặp bạn, bạn có thể hỏi: Bạn khỏe không?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap",
    word: getDriveVideoName("greet-long-time-no-see"),
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/api/video-stream/greet-long-time-no-see",
    description: "Câu chào hỏi khi gặp lại ai đó sau thời gian dài không liên lạc",
    example: "Gặp một người bạn cũ, bạn nói: Lâu quá không gặp, bạn khỏe không?",
  },
  {
    id: "viet-cau-phuc-lau-qua-khong-gap-2",
    word: getDriveVideoName("greet-long-time-no-see"),
    category: "greetings",
    difficulty: "intermediate",
    videoUrl: "/api/video-stream/greet-long-time-no-see",
    description: "Biến thể của câu chào hỏi - luyện tập phát âm và ký hiệu chính xác",
    example: "Thực hành cách chào khi gặp lại bạn bè hoặc người quen",
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
    name: "Từ đầu tiên",
    description: "Học từ ngôn ngữ ký hiệu đầu tiên của bạn",
    icon: "🌟",
    type: "milestone",
    requirement: 1,
    earned: false,
  },
  {
    id: "ten-words",
    name: "Bắt đầu",
    description: "Học 10 từ ngôn ngữ ký hiệu",
    icon: "📚",
    type: "milestone",
    requirement: 10,
    earned: false,
  },
  {
    id: "fifty-words",
    name: "Đang tiến bộ",
    description: "Học 50 từ ngôn ngữ ký hiệu",
    icon: "🚀",
    type: "milestone",
    requirement: 50,
    earned: false,
  },
  {
    id: "hundred-words",
    name: "Bậc thầy",
    description: "Học 100 từ ngôn ngữ ký hiệu",
    icon: "🎯",
    type: "milestone",
    requirement: 100,
    earned: false,
  },
  {
    id: "quiz-master",
    name: "Bậc thầy kiểm tra",
    description: "Đạt 100% trong một bài kiểm tra",
    icon: "👑",
    type: "quiz",
    requirement: 1,
    earned: false,
  },
  {
    id: "seven-day-streak",
    name: "Chuỗi 7 ngày",
    description: "Học liên tục 7 ngày",
    icon: "🔥",
    type: "streak",
    requirement: 7,
    earned: false,
  },
];