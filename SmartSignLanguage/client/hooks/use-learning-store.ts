import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  VocabularyCard,
  SRSProgress,
  vocabularyCards,
  Difficulty,
} from "@shared/vocabulary";
import { LessonStep } from "@shared/curriculum";

export interface UserLessonProgress {
  lessonId: string;
  userId: string;
  status: "not-started" | "in-progress" | "completed";
  currentStep: LessonStep;
  quizScore?: number | null;
  quizPassed: boolean;
  recognitionAttempts: number;
  recognitionCorrect: number;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
}

export interface RecognitionPracticeResult {
  lessonId: string;
  cardId: string;
  expectedWord: string;
  predictedWord: string;
  isCorrect: boolean;
  confidence: number;
  confusedWith?: string;
  suggestion?: string;
  attemptCount: number;
  durationMs: number;
  stabilityScore: number;
  passedThreshold: boolean;
  createdAt: string;
}

// SM-2 Algorithm for SRS
const calculateSM2 = (
  quality: number, // 0-5 rating
  easeFactor: number,
  interval: number,
): { easeFactor: number; interval: number } => {
  let newEF = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  if (quality < 3) {
    newInterval = 1;
  } else if (interval === 0) {
    newInterval = 1;
  } else if (interval === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(interval * newEF);
  }

  return { easeFactor: newEF, interval: newInterval };
};

interface LearningStore {
  // Progress tracking
  progress: Map<string, SRSProgress>;
  understoodCards: Map<string, boolean>;
  lessonProgress: Map<string, UserLessonProgress>;
  addProgress: (cardId: string, userId: string) => void;
  updateProgress: (
    cardId: string,
    userId: string,
    quality: number, // 0-5
  ) => void;
  markCardUnderstood: (cardId: string, userId: string) => void;
  unmarkCardUnderstood: (cardId: string, userId: string) => void;
  getUnderstoodCards: (userId: string) => VocabularyCard[];
  getProgressByCard: (cardId: string) => SRSProgress | undefined;
  getProgressStats: (userId: string) => {
    totalWords: number;
    masteredWords: number;
    currentStreak: number;
    longestStreak: number;
    totalReviewsToday: number;
    nextReviewDate?: string;
  };

  // Review scheduling
  getDueCards: (userId: string, limit?: number) => VocabularyCard[];
  getNewCards: (userId: string, limit?: number) => VocabularyCard[];
  getCardsByCategory: (category: string, userId?: string) => VocabularyCard[];
  getCardsByDifficulty: (
    difficulty: Difficulty,
    userId?: string,
  ) => VocabularyCard[];
  getWeakCards: (userId: string, limit?: number) => VocabularyCard[];

  // Lesson tracking
  startLesson: (lessonId: string, userId: string) => void;
  setLessonStep: (lessonId: string, userId: string, step: LessonStep) => void;
  recordLessonQuiz: (
    lessonId: string,
    userId: string,
    score: number,
    requiredScore: number,
  ) => void;
  recordLessonRecognition: (
    lessonId: string,
    userId: string,
    isCorrect?: boolean,
  ) => void;
  saveRecognitionPracticeResult: (
    userId: string,
    result: RecognitionPracticeResult,
  ) => Promise<void>;
  completeLesson: (lessonId: string, userId: string) => void;
  getLessonProgress: (
    lessonId: string,
    userId: string,
  ) => UserLessonProgress | undefined;

  // Streak tracking
  streaks: Map<
    string,
    { current: number; longest: number; lastReviewDate: string }
  >;
  updateStreak: (userId: string) => void;
  getStreak: (userId: string) => { current: number; longest: number };

  // Server synchronization for authenticated users
  isSyncing: boolean;
  lastSyncedAt?: string;
  syncFromServer: (userId: string) => Promise<void>;
  syncToServer: (userId: string) => Promise<void>;
}

const getAuthToken = () => localStorage.getItem("auth_token");

type LearningEventPayload = {
  eventType:
    | "lesson_started"
    | "lesson_completed"
    | "quiz_submitted"
    | "recognition_attempted"
    | "card_reviewed"
    | "video_watched"
    | "study_session";
  lessonId?: string;
  cardId?: string;
  signId?: string;
  quizQuestionId?: string;
  durationMs?: number;
  isCorrect?: boolean;
  score?: number;
  metadata?: Record<string, unknown>;
};

export async function trackLearningEvent(payload: LearningEventPayload) {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch("/api/learning/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        durationMs: payload.durationMs || 0,
        metadata: payload.metadata || {},
        createdAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to track learning event:", error);
  }
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      progress: new Map(),
      understoodCards: new Map(),
      lessonProgress: new Map(),
      streaks: new Map(),
      isSyncing: false,
      lastSyncedAt: undefined,

      addProgress: (cardId, userId) => {
        const store = get();
        const key = `${userId}:${cardId}`;

        if (!store.progress.has(key)) {
          const now = new Date().toISOString();
          store.progress.set(key, {
            cardId,
            userId,
            status: "new",
            interval: 0,
            difficulty: 1,
            easeFactor: 2.5,
            nextReviewDate: now,
            attempts: 0,
            correctAttempts: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      },

      updateProgress: (cardId, userId, quality) => {
        const store = get();
        const key = `${userId}:${cardId}`;
        const current = store.progress.get(key);

        if (current) {
          const { easeFactor, interval } = calculateSM2(
            quality,
            current.easeFactor,
            current.interval,
          );

          const nextReviewDate = new Date();
          if (quality >= 3) {
            nextReviewDate.setDate(nextReviewDate.getDate() + interval);
          }

          const updated: SRSProgress = {
            ...current,
            interval,
            easeFactor,
            difficulty: quality,
            nextReviewDate: nextReviewDate.toISOString(),
            attempts: current.attempts + 1,
            correctAttempts:
              quality >= 3
                ? current.correctAttempts + 1
                : current.correctAttempts,
            status:
              quality >= 4 ? "mastered" : quality >= 3 ? "learning" : "new",
            lastReviewedDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          store.progress.set(key, updated);
          store.updateStreak(userId);
          void trackLearningEvent({
            eventType: "card_reviewed",
            cardId,
            signId: cardId,
            isCorrect: quality >= 3,
            score: quality,
            metadata: {
              quality,
              status: updated.status,
              attempts: updated.attempts,
            },
          });
          void get().syncToServer(userId);
        }
      },

      markCardUnderstood: (cardId, userId) => {
        const store = get();
        store.understoodCards.set(`${userId}:${cardId}`, true);
        void get().syncToServer(userId);
      },

      unmarkCardUnderstood: (cardId, userId) => {
        const store = get();
        store.understoodCards.delete(`${userId}:${cardId}`);
        void get().syncToServer(userId);
      },

      getUnderstoodCards: (userId) => {
        const store = get();
        return vocabularyCards.filter((card) =>
          store.understoodCards.has(`${userId}:${card.id}`),
        );
      },

      getProgressByCard: (cardId) => {
        const store = get();
        for (const [, progress] of store.progress) {
          if (progress.cardId === cardId) {
            return progress;
          }
        }
        return undefined;
      },

      getProgressStats: (userId) => {
        const store = get();
        const userProgress = Array.from(store.progress.values()).filter(
          (p) => p.userId === userId,
        );

        const masteredProgressCount = userProgress.filter(
          (p) => p.status === "mastered",
        ).length;
        const understoodCount = Array.from(store.understoodCards.keys()).filter(
          (key) => key.startsWith(`${userId}:`),
        ).length;
        const masteredCount = Math.max(masteredProgressCount, understoodCount);
        const streak = store.getStreak(userId);

        const today = new Date().toDateString();
        const todayReviews = userProgress.filter(
          (p) =>
            p.lastReviewedDate &&
            new Date(p.lastReviewedDate).toDateString() === today,
        ).length;

        const nextReview = userProgress
          .filter((p) => p.status !== "mastered")
          .sort(
            (a, b) =>
              new Date(a.nextReviewDate).getTime() -
              new Date(b.nextReviewDate).getTime(),
          )[0];

        return {
          totalWords: vocabularyCards.length,
          masteredWords: masteredCount,
          currentStreak: streak.current,
          longestStreak: streak.longest,
          totalReviewsToday: todayReviews,
          nextReviewDate: nextReview?.nextReviewDate,
        };
      },

      getDueCards: (userId, limit = 10) => {
        const store = get();
        const now = new Date();
        const userProgress = Array.from(store.progress.values())
          .filter((p) => p.userId === userId && p.status !== "mastered")
          .filter((p) => new Date(p.nextReviewDate) <= now || p.difficulty < 3)
          .sort(
            (a, b) =>
              new Date(a.nextReviewDate).getTime() -
              new Date(b.nextReviewDate).getTime(),
          )
          .slice(0, limit);

        return userProgress
          .map((p) => vocabularyCards.find((c) => c.id === p.cardId))
          .filter((c) => c !== undefined) as VocabularyCard[];
      },

      getNewCards: (userId, limit = 10) => {
        const store = get();
        const userProgress = Array.from(store.progress.values()).filter(
          (p) => p.userId === userId,
        );
        const knownCardIds = new Set(userProgress.map((p) => p.cardId));

        return vocabularyCards
          .filter((c) => !knownCardIds.has(c.id))
          .slice(0, limit);
      },

      getCardsByCategory: (category, userId) => {
        const store = get();
        const filtered = vocabularyCards.filter((c) => c.category === category);

        if (!userId) return filtered;

        return filtered.filter((c) => {
          const key = `${userId}:${c.id}`;
          const progress = store.progress.get(key);
          return !progress || progress.status !== "mastered";
        });
      },

      getCardsByDifficulty: (difficulty, userId) => {
        const store = get();
        const filtered = vocabularyCards.filter(
          (c) => c.difficulty === difficulty,
        );

        if (!userId) return filtered;

        return filtered.filter((c) => {
          const key = `${userId}:${c.id}`;
          const progress = store.progress.get(key);
          return !progress || progress.status !== "mastered";
        });
      },

      getWeakCards: (userId, limit = 8) => {
        const store = get();
        return Array.from(store.progress.values())
          .filter(
            (item) =>
              item.userId === userId &&
              item.attempts > 0 &&
              item.status !== "mastered" &&
              !store.understoodCards.has(`${userId}:${item.cardId}`),
          )
          .map((item) => {
            const card = vocabularyCards.find((c) => c.id === item.cardId);
            const accuracy =
              item.attempts > 0 ? item.correctAttempts / item.attempts : 1;
            return {
              card,
              accuracy,
              attempts: item.attempts,
              lastQuality: item.difficulty,
            };
          })
          .filter(
            (
              item,
            ): item is {
              card: VocabularyCard;
              accuracy: number;
              attempts: number;
              lastQuality: number;
            } => Boolean(item.card),
          )
          .filter((item) => item.accuracy < 0.7 || item.lastQuality < 3)
          .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
          .slice(0, limit)
          .map((item) => item.card);
      },

      startLesson: (lessonId, userId) => {
        const store = get();
        const key = `${userId}:${lessonId}`;
        const now = new Date().toISOString();
        const current = store.lessonProgress.get(key);
        store.lessonProgress.set(key, {
          lessonId,
          userId,
          status: current?.status === "completed" ? "completed" : "in-progress",
          currentStep:
            current?.status === "completed"
              ? "completed"
              : current?.currentStep === "not-started"
                ? "learn"
                : current?.currentStep || "learn",
          quizScore: current?.quizScore ?? null,
          quizPassed: current?.quizPassed ?? false,
          recognitionAttempts: current?.recognitionAttempts ?? 0,
          recognitionCorrect: current?.recognitionCorrect ?? 0,
          startedAt: current?.startedAt || now,
          completedAt: current?.completedAt ?? null,
          updatedAt: now,
        });
        if (!current || current.currentStep === "not-started") {
          void trackLearningEvent({
            eventType: "lesson_started",
            lessonId,
          });
        }
        void get().syncToServer(userId);
      },

      setLessonStep: (lessonId, userId, step) => {
        const store = get();
        const key = `${userId}:${lessonId}`;
        const current = store.lessonProgress.get(key);
        const now = new Date().toISOString();
        store.lessonProgress.set(key, {
          lessonId,
          userId,
          status: step === "completed" ? "completed" : "in-progress",
          currentStep: step,
          quizScore: current?.quizScore ?? null,
          quizPassed: current?.quizPassed ?? false,
          recognitionAttempts: current?.recognitionAttempts ?? 0,
          recognitionCorrect: current?.recognitionCorrect ?? 0,
          startedAt: current?.startedAt || now,
          completedAt:
            step === "completed" ? now : (current?.completedAt ?? null),
          updatedAt: now,
        });
        void get().syncToServer(userId);
      },

      recordLessonQuiz: (lessonId, userId, score, requiredScore) => {
        const store = get();
        const key = `${userId}:${lessonId}`;
        const current = store.lessonProgress.get(key);
        const now = new Date().toISOString();
        const passed = score >= requiredScore;
        store.lessonProgress.set(key, {
          lessonId,
          userId,
          status: passed ? "completed" : "in-progress",
          currentStep: passed ? "completed" : "quiz",
          quizScore: score,
          quizPassed: passed,
          recognitionAttempts: current?.recognitionAttempts ?? 0,
          recognitionCorrect: current?.recognitionCorrect ?? 0,
          startedAt: current?.startedAt || now,
          completedAt: passed ? now : (current?.completedAt ?? null),
          updatedAt: now,
        });
        void trackLearningEvent({
          eventType: "quiz_submitted",
          lessonId,
          score,
          isCorrect: passed,
          metadata: {
            requiredScore,
            passed,
          },
        });
        void get().syncToServer(userId);
      },

      recordLessonRecognition: (lessonId, userId, isCorrect = true) => {
        const store = get();
        const key = `${userId}:${lessonId}`;
        const current = store.lessonProgress.get(key);
        const now = new Date().toISOString();
        store.lessonProgress.set(key, {
          lessonId,
          userId,
          status: "in-progress",
          currentStep: "recognition",
          quizScore: current?.quizScore ?? null,
          quizPassed: current?.quizPassed ?? false,
          recognitionAttempts: (current?.recognitionAttempts ?? 0) + 1,
          recognitionCorrect:
            (current?.recognitionCorrect ?? 0) + (isCorrect ? 1 : 0),
          startedAt: current?.startedAt || now,
          completedAt: current?.completedAt ?? null,
          updatedAt: now,
        });
        void get().syncToServer(userId);
      },

      saveRecognitionPracticeResult: async (userId, result) => {
        get().recordLessonRecognition(
          result.lessonId,
          userId,
          result.isCorrect,
        );
        const progress = get().getLessonProgress(result.lessonId, userId);
        if (result.isCorrect && progress?.quizPassed) {
          get().completeLesson(result.lessonId, userId);
        }

        const token = getAuthToken();
        if (!token || userId === "guest") return;

        try {
          const response = await fetch("/api/learning/recognition-practice", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(result),
          });

          if (!response.ok) {
            throw new Error("Unable to save recognition practice");
          }
          void trackLearningEvent({
            eventType: "recognition_attempted",
            lessonId: result.lessonId,
            cardId: result.cardId,
            signId: result.cardId,
            isCorrect: result.isCorrect,
            durationMs: result.durationMs,
            score: Math.round(result.confidence * 100),
            metadata: {
              expectedWord: result.expectedWord,
              predictedWord: result.predictedWord,
              confidence: result.confidence,
              stabilityScore: result.stabilityScore,
              passedThreshold: result.passedThreshold,
            },
          });
        } catch (error) {
          console.error("Failed to save recognition practice:", error);
        }
      },

      completeLesson: (lessonId, userId) => {
        get().setLessonStep(lessonId, userId, "completed");
        void trackLearningEvent({
          eventType: "lesson_completed",
          lessonId,
        });
      },

      getLessonProgress: (lessonId, userId) => {
        return get().lessonProgress.get(`${userId}:${lessonId}`);
      },

      updateStreak: (userId) => {
        const store = get();
        const streak = store.streaks.get(userId) || {
          current: 0,
          longest: 0,
          lastReviewDate: "",
        };

        const today = new Date().toDateString();
        const lastReview = new Date(streak.lastReviewDate).toDateString();

        let newCurrent = streak.current;
        if (lastReview === today) {
          // Already reviewed today
          newCurrent = streak.current;
        } else if (
          new Date(lastReview).getTime() ===
          new Date().getTime() - 86400000
        ) {
          // Reviewed yesterday
          newCurrent = streak.current + 1;
        } else {
          // Break in streak
          newCurrent = 1;
        }

        const newLongest = Math.max(newCurrent, streak.longest);
        store.streaks.set(userId, {
          current: newCurrent,
          longest: newLongest,
          lastReviewDate: new Date().toISOString(),
        });
      },

      getStreak: (userId) => {
        const store = get();
        const streak = store.streaks.get(userId) || {
          current: 0,
          longest: 0,
          lastReviewDate: new Date(Date.now() - 86400000).toISOString(),
        };
        return {
          current: streak.current,
          longest: streak.longest,
        };
      },

      syncFromServer: async (userId) => {
        const token = getAuthToken();
        if (!token || userId === "guest") return;

        set({ isSyncing: true });
        try {
          const response = await fetch("/api/learning/progress", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Unable to fetch learning progress");
          }

          const data = await response.json();
          const store = get();
          const nextProgress = new Map(store.progress);
          const nextUnderstoodCards = new Map(store.understoodCards);
          const nextLessonProgress = new Map(store.lessonProgress);

          for (const item of data.progress || []) {
            const key = `${userId}:${item.cardId}`;
            const local = nextProgress.get(key);
            const localUpdated = local
              ? new Date(local.updatedAt).getTime()
              : 0;
            const remoteUpdated = new Date(item.updatedAt).getTime();

            if (!local || remoteUpdated >= localUpdated) {
              nextProgress.set(key, {
                cardId: item.cardId,
                userId,
                status: item.status,
                interval: item.interval,
                difficulty: item.difficulty,
                easeFactor: item.easeFactor,
                nextReviewDate: item.nextReviewDate,
                attempts: item.attempts,
                correctAttempts: item.correctAttempts,
                lastReviewedDate: item.lastReviewedDate || undefined,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              });
            }
          }

          for (const cardId of data.understoodCardIds || []) {
            nextUnderstoodCards.set(`${userId}:${cardId}`, true);
          }

          for (const item of data.lessonProgress || []) {
            const key = `${userId}:${item.lessonId}`;
            const local = nextLessonProgress.get(key);
            const localUpdated = local
              ? new Date(local.updatedAt).getTime()
              : 0;
            const remoteUpdated = new Date(item.updatedAt).getTime();

            if (!local || remoteUpdated >= localUpdated) {
              nextLessonProgress.set(key, {
                lessonId: item.lessonId,
                userId,
                status: item.status,
                currentStep: item.currentStep,
                quizScore: item.quizScore,
                quizPassed: Boolean(item.quizPassed),
                recognitionAttempts: item.recognitionAttempts,
                recognitionCorrect: item.recognitionCorrect,
                startedAt: item.startedAt,
                completedAt: item.completedAt,
                updatedAt: item.updatedAt,
              });
            }
          }

          set({
            progress: nextProgress,
            understoodCards: nextUnderstoodCards,
            lessonProgress: nextLessonProgress,
            lastSyncedAt: new Date().toISOString(),
          });

          await get().syncToServer(userId);
        } catch (error) {
          console.error("Failed to sync learning progress from server:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncToServer: async (userId) => {
        const token = getAuthToken();
        if (!token || userId === "guest") return;

        const store = get();
        const userProgress = Array.from(store.progress.values()).filter(
          (item) => item.userId === userId,
        );
        const understoodCardIds = Array.from(store.understoodCards.keys())
          .filter((key) => key.startsWith(`${userId}:`))
          .map((key) => key.slice(userId.length + 1));
        const lessonProgress = Array.from(store.lessonProgress.values()).filter(
          (item) => item.userId === userId,
        );

        try {
          const response = await fetch("/api/learning/progress", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              progress: userProgress,
              understoodCardIds,
              lessonProgress,
            }),
          });

          if (!response.ok) {
            throw new Error("Unable to sync learning progress");
          }

          set({ lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          console.error("Failed to sync learning progress to server:", error);
        }
      },
    }),
    {
      name: "learning-store",
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          if (!item) return null;
          const data = JSON.parse(item);
          return {
            state: {
              ...data.state,
              progress: new Map(Object.entries(data.state.progress || {})),
              understoodCards: new Map(
                Object.entries(data.state.understoodCards || {}),
              ),
              lessonProgress: new Map(
                Object.entries(data.state.lessonProgress || {}),
              ),
              streaks: new Map(Object.entries(data.state.streaks || {})),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              progress: Object.fromEntries(value.state.progress),
              understoodCards: Object.fromEntries(value.state.understoodCards),
              lessonProgress: Object.fromEntries(value.state.lessonProgress),
              streaks: Object.fromEntries(value.state.streaks),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
