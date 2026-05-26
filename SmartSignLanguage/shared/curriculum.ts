import {
  Category,
  VocabularyCard,
  categoryLabels,
  vocabularyCards,
} from "./vocabulary";

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonStep =
  | "not-started"
  | "learn"
  | "quiz"
  | "recognition"
  | "completed";
export type LessonStatus = "locked" | "available" | "in-progress" | "completed";

export interface Lesson {
  id: string;
  title: string;
  level: CourseLevel;
  category: Category;
  description: string;
  order: number;
  targetCardCount: number;
  requiredQuizScore: number;
  recognitionRequired: boolean;
  cardIds: string[];
}

export interface Course {
  id: CourseLevel;
  title: string;
  description: string;
  lessons: Lesson[];
}

const takeCategoryCards = (category: Category, count: number) =>
  vocabularyCards
    .filter((card) => card.category === category)
    .slice(0, count)
    .map((card) => card.id);

const createLesson = (
  id: string,
  title: string,
  level: CourseLevel,
  category: Category,
  order: number,
  targetCardCount = 8,
): Lesson => ({
  id,
  title,
  level,
  category,
  order,
  targetCardCount,
  requiredQuizScore: 70,
  recognitionRequired: true,
  description: `Learn core ${categoryLabels[category].toLowerCase()} signs, then pass the quiz and recognition practice.`,
  cardIds: takeCategoryCards(category, targetCardCount),
});

export const courses: Course[] = [
  {
    id: "beginner",
    title: "Beginner",
    description: "Build basic recognition and everyday vocabulary.",
    lessons: [
      createLesson("beginner-greetings", "Greetings", "beginner", "greeting", 1, 6),
      createLesson("beginner-family", "Family", "beginner", "family", 2, 8),
      createLesson("beginner-colors", "Colors", "beginner", "colors", 3, 8),
      createLesson("beginner-food", "Food & Drink", "beginner", "food-drink", 4, 8),
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Move into actions, questions, emotions, and daily use.",
    lessons: [
      createLesson("intermediate-actions", "Common Verbs", "intermediate", "action-verbs", 5, 10),
      createLesson("intermediate-emotions", "Emotions", "intermediate", "emotions-feelings", 6, 10),
      createLesson("intermediate-school", "School", "intermediate", "education-school", 7, 8),
      createLesson("intermediate-travel", "Travel", "intermediate", "travel-transportation", 8, 8),
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Practice specialized topics and conversation building blocks.",
    lessons: [
      createLesson("advanced-health", "Body & Health", "advanced", "body-health", 9, 10),
      createLesson("advanced-places", "Places", "advanced", "places-buildings", 10, 10),
      createLesson("advanced-technology", "Technology", "advanced", "technology-computer", 11, 8),
      createLesson("advanced-community", "Deaf Community", "advanced", "deaf-community-asl", 12, 8),
    ],
  },
];

export const lessons = courses.flatMap((course) => course.lessons);

export const getLessonById = (lessonId: string) =>
  lessons.find((lesson) => lesson.id === lessonId);

export const getLessonCards = (lessonId: string): VocabularyCard[] => {
  const lesson = getLessonById(lessonId);
  if (!lesson) return [];
  const cardSet = new Set(lesson.cardIds);
  return vocabularyCards.filter((card) => cardSet.has(card.id));
};
