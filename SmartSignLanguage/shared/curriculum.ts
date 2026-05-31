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

const takeCategoryCards = (category: Category) =>
  vocabularyCards
    .filter((card) => card.category === category)
    .map((card) => card.id);

const createLesson = (
  id: string,
  title: string,
  level: CourseLevel,
  category: Category,
  order: number,
): Lesson => {
  const cardIds = takeCategoryCards(category);

  return {
    id,
    title,
    level,
    category,
    order,
    targetCardCount: cardIds.length,
    requiredQuizScore: 70,
    recognitionRequired: false,
    description: `Learn core ${categoryLabels[category].toLowerCase()} signs, then pass the quiz.`,
    cardIds,
  };
};

export const courses: Course[] = [
  {
    id: "beginner",
    title: "Beginner",
    description: "Build everyday vocabulary with guided sign lessons.",
    lessons: [
      createLesson(
        "beginner-greetings",
        "Greetings",
        "beginner",
        "greeting",
        1,
      ),
      createLesson("beginner-family", "Family", "beginner", "family", 2),
      createLesson("beginner-colors", "Colors", "beginner", "colors", 3),
      createLesson("beginner-animals", "Animals", "beginner", "animals", 4),
      createLesson(
        "beginner-food",
        "Food & Drink",
        "beginner",
        "food-drink",
        5,
      ),
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Move into actions, questions, emotions, and daily use.",
    lessons: [
      createLesson(
        "intermediate-actions",
        "Common Verbs",
        "intermediate",
        "action-verbs",
        6,
      ),
      createLesson(
        "intermediate-emotions",
        "Emotions",
        "intermediate",
        "emotions-feelings",
        7,
      ),
      createLesson(
        "intermediate-time",
        "Time & Calendar",
        "intermediate",
        "time-calendar",
        8,
      ),
      createLesson(
        "intermediate-school",
        "School",
        "intermediate",
        "education-school",
        9,
      ),
      createLesson(
        "intermediate-travel",
        "Travel",
        "intermediate",
        "travel-transportation",
        10,
      ),
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    description:
      "Practice specialized topics and conversation building blocks.",
    lessons: [
      createLesson(
        "advanced-nature",
        "Nature & Weather",
        "advanced",
        "nature-weather",
        11,
      ),
      createLesson(
        "advanced-sports",
        "Sports & Activities",
        "advanced",
        "sports-activities",
        12,
      ),
      createLesson(
        "advanced-health",
        "Body & Health",
        "advanced",
        "body-health",
        13,
      ),
      createLesson(
        "advanced-places",
        "Places",
        "advanced",
        "places-buildings",
        14,
      ),
      createLesson(
        "advanced-technology",
        "Technology",
        "advanced",
        "technology-computer",
        15,
      ),
      createLesson(
        "advanced-community",
        "Deaf Community",
        "advanced",
        "deaf-community-asl",
        16,
      ),
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