import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  VocabularyCard,
  SRSProgress,
  vocabularyCards,
  Difficulty,
} from "@shared/vocabulary";

// SM-2 Algorithm for SRS
const calculateSM2 = (
  quality: number, // 0-5 rating
  easeFactor: number,
  interval: number
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
  addProgress: (cardId: string, userId: string) => void;
  updateProgress: (
    cardId: string,
    userId: string,
    quality: number // 0-5
  ) => void;
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
  getCardsByCategory: (
    category: string,
    userId?: string
  ) => VocabularyCard[];
  getCardsByDifficulty: (
    difficulty: Difficulty,
    userId?: string
  ) => VocabularyCard[];

  // Streak tracking
  streaks: Map<string, { current: number; longest: number; lastReviewDate: string }>;
  updateStreak: (userId: string) => void;
  getStreak: (userId: string) => { current: number; longest: number };
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      progress: new Map(),
      streaks: new Map(),

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
            current.interval
          );

          const nextReviewDate = new Date();
          nextReviewDate.setDate(nextReviewDate.getDate() + interval);

          const updated: SRSProgress = {
            ...current,
            interval,
            easeFactor,
            difficulty: quality,
            nextReviewDate: nextReviewDate.toISOString(),
            attempts: current.attempts + 1,
            correctAttempts:
              quality >= 3 ? current.correctAttempts + 1 : current.correctAttempts,
            status:
              quality >= 4
                ? "mastered"
                : quality >= 3
                  ? "learning"
                  : "new",
            lastReviewedDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          store.progress.set(key, updated);
          store.updateStreak(userId);
        }
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
          (p) => p.userId === userId
        );

        const masteredCount = userProgress.filter(
          (p) => p.status === "mastered"
        ).length;
        const streak = store.getStreak(userId);

        const today = new Date().toDateString();
        const todayReviews = userProgress.filter(
          (p) =>
            p.lastReviewedDate &&
            new Date(p.lastReviewedDate).toDateString() === today
        ).length;

        const nextReview = userProgress
          .filter((p) => p.status !== "mastered")
          .sort(
            (a, b) =>
              new Date(a.nextReviewDate).getTime() -
              new Date(b.nextReviewDate).getTime()
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
          .filter((p) => new Date(p.nextReviewDate) <= now)
          .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
          .slice(0, limit);

        return userProgress
          .map((p) => vocabularyCards.find((c) => c.id === p.cardId))
          .filter((c) => c !== undefined) as VocabularyCard[];
      },

      getNewCards: (userId, limit = 10) => {
        const store = get();
        const userProgress = Array.from(store.progress.values()).filter(
          (p) => p.userId === userId
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
        const filtered = vocabularyCards.filter((c) => c.difficulty === difficulty);

        if (!userId) return filtered;

        return filtered.filter((c) => {
          const key = `${userId}:${c.id}`;
          const progress = store.progress.get(key);
          return !progress || progress.status !== "mastered";
        });
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
              streaks: new Map(Object.entries(data.state.streaks || {})),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              progress: Object.fromEntries(value.state.progress),
              streaks: Object.fromEntries(value.state.streaks),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
