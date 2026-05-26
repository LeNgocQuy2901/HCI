import type { Category, Difficulty } from "./vocabulary";
import type { CourseLevel } from "./curriculum";

export type ContentPublishStatus = "draft" | "ready" | "published" | "archived";
export type QuizPublishStatus = ContentPublishStatus | "active";

export interface ContentSign {
  id: string;
  word: string;
  category: Category;
  difficulty: Difficulty;
  description: string;
  example?: string;
  videoUrl?: string;
  status: ContentPublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContentSignMetadata {
  signId: string;
  instruction: string;
  commonMistakes: string[];
  practiceTips: string[];
  exampleSentences: string[];
  updatedAt: string;
}

export interface ContentSignMedia {
  id: string;
  signId: string;
  type: "video" | "image" | "other";
  url: string;
  source: "drive" | "local" | "external";
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentLesson {
  id: string;
  title: string;
  level: CourseLevel;
  category: Category;
  description: string;
  order: number;
  targetCardCount: number;
  requiredQuizScore: number;
  recognitionRequired: boolean;
  signIds: string[];
  status: ContentPublishStatus;
  createdAt: string;
  updatedAt: string;
}

export type ContentQuizType =
  | "meaning_quiz"
  | "video_to_word"
  | "word_to_sign"
  | "common_mistake";

export interface ContentQuizQuestion {
  id: string;
  signId: string;
  lessonId: string;
  type: ContentQuizType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: QuizPublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SignCompleteness {
  signId: string;
  word: string;
  category: Category;
  lessonCount: number;
  hasVideo: boolean;
  hasMetadata: boolean;
  hasInstruction: boolean;
  hasCommonMistakes: boolean;
  hasPracticeTips: boolean;
  hasExampleSentences: boolean;
  hasQuizCoverage: boolean;
  quizQuestionCount: number;
  status: ContentPublishStatus;
  readyToPublish: boolean;
  publishBlockers: string[];
  missing: string[];
  score: number;
}
