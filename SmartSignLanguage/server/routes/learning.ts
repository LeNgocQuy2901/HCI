import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { getDatabase } from "../db";
import { vocabularyCards } from "../../shared/vocabulary";

const router = Router();

const progressSchema = z.object({
  cardId: z.string().min(1),
  status: z.enum(["new", "learning", "mastered"]),
  interval: z.number().int().nonnegative(),
  difficulty: z.number(),
  easeFactor: z.number(),
  nextReviewDate: z.string(),
  attempts: z.number().int().nonnegative(),
  correctAttempts: z.number().int().nonnegative(),
  lastReviewedDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const syncSchema = z.object({
  progress: z.array(progressSchema),
  understoodCardIds: z.array(z.string()).default([]),
  lessonProgress: z
    .array(
      z.object({
        lessonId: z.string().min(1),
        userId: z.string().optional(),
        status: z.enum(["not-started", "in-progress", "completed"]),
        currentStep: z.enum([
          "not-started",
          "learn",
          "quiz",
          "recognition",
          "completed",
        ]),
        quizScore: z.number().int().nullable().optional(),
        quizPassed: z.boolean(),
        recognitionAttempts: z.number().int().nonnegative(),
        recognitionCorrect: z.number().int().nonnegative(),
        startedAt: z.string().nullable().optional(),
        completedAt: z.string().nullable().optional(),
        updatedAt: z.string(),
      }),
    )
    .default([]),
});

const recognitionPracticeSchema = z.object({
  lessonId: z.string().min(1),
  cardId: z.string().min(1),
  expectedWord: z.string().min(1),
  predictedWord: z.string().min(1),
  isCorrect: z.boolean(),
  confidence: z.number().min(0).max(1),
  confusedWith: z.string().optional(),
  suggestion: z.string().optional(),
  attemptCount: z.number().int().positive().default(1),
  durationMs: z.number().int().nonnegative().default(0),
  stabilityScore: z.number().min(0).max(1).default(0),
  passedThreshold: z.boolean().default(false),
  createdAt: z.string().optional(),
});

const learningEventSchema = z.object({
  eventType: z.enum([
    "lesson_started",
    "lesson_completed",
    "quiz_submitted",
    "recognition_attempted",
    "card_reviewed",
    "video_watched",
    "study_session",
  ]),
  lessonId: z.string().optional(),
  cardId: z.string().optional(),
  signId: z.string().optional(),
  quizQuestionId: z.string().optional(),
  durationMs: z.number().int().nonnegative().default(0),
  isCorrect: z.boolean().optional(),
  score: z.number().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().optional(),
});

const jsonArray = (value: unknown): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const jsonObject = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

function saveLearningEvent(
  db: ReturnType<typeof getDatabase>,
  userId: string,
  event: z.infer<typeof learningEventSchema>,
) {
  const createdAt = event.createdAt || new Date().toISOString();
  const id = `${userId}:${event.eventType}:${createdAt}:${Math.random().toString(36).slice(2, 9)}`;

  db.prepare(
    `
      INSERT INTO user_learning_events (
        id, userId, eventType, lessonId, cardId, signId, quizQuestionId,
        durationMs, isCorrect, score, metadataJson, createdAt
      )
      VALUES (
        @id, @userId, @eventType, @lessonId, @cardId, @signId, @quizQuestionId,
        @durationMs, @isCorrect, @score, @metadataJson, @createdAt
      )
    `,
  ).run({
    id,
    userId,
    eventType: event.eventType,
    lessonId: event.lessonId || null,
    cardId: event.cardId || null,
    signId: event.signId || event.cardId || null,
    quizQuestionId: event.quizQuestionId || null,
    durationMs: event.durationMs || 0,
    isCorrect: event.isCorrect === undefined ? null : event.isCorrect ? 1 : 0,
    score: event.score ?? null,
    metadataJson: JSON.stringify(event.metadata || {}),
    createdAt,
  });

  return id;
}

const getSafeQuizQuestionText = (type: string, question: string) => {
  if (type === "meaning_quiz") {
    return "What word does this sign represent?";
  }

  if (type === "video_to_word") {
    return "What word is shown in this video?";
  }

  if (type === "word_to_sign") {
    return "Which sign matches this word?";
  }

  if (type === "common_mistake") {
    return "Which option describes the common mistake?";
  }

  return question;
};

router.post("/events", authMiddleware, (req: Request, res: Response) => {
  const parsed = learningEventSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  try {
    const id = saveLearningEvent(db, req.user!.userId, parsed.data);
    return res.status(201).json({ id });
  } catch (error) {
    console.error("Save learning event error:", error);
    return res.status(500).json({ error: "Failed to save learning event" });
  } finally {
    db.close();
  }
});

router.get("/analytics/me", authMiddleware, (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const userId = req.user!.userId;
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const monthAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const eventCounts = db
      .prepare(
        `
          SELECT eventType, COUNT(*) AS count
          FROM user_learning_events
          WHERE userId = ?
          GROUP BY eventType
        `,
      )
      .all(userId) as Array<{ eventType: string; count: number }>;

    const studyTimeWeek = db
      .prepare(
        `
          SELECT COALESCE(SUM(durationMs), 0) AS durationMs
          FROM user_learning_events
          WHERE userId = ? AND createdAt >= ?
        `,
      )
      .get(userId, weekAgo) as { durationMs: number };

    const quizTrend = db
      .prepare(
        `
          SELECT substr(createdAt, 1, 10) AS date,
                 COUNT(*) AS attempts,
                 AVG(score) AS averageScore
          FROM user_learning_events
          WHERE userId = ? AND eventType = 'quiz_submitted' AND createdAt >= ?
          GROUP BY substr(createdAt, 1, 10)
          ORDER BY date
        `,
      )
      .all(userId, monthAgo);

    const weakestTopics = db
      .prepare(
        `
          SELECT s.category,
                 COUNT(*) AS attempts,
                 SUM(CASE WHEN e.isCorrect = 1 THEN 1 ELSE 0 END) AS correct,
                 AVG(CASE WHEN e.score IS NOT NULL THEN e.score ELSE NULL END) AS averageScore
          FROM user_learning_events e
          LEFT JOIN signs s ON s.id = COALESCE(e.signId, e.cardId)
          WHERE e.userId = ?
            AND e.eventType IN ('card_reviewed', 'recognition_attempted', 'quiz_submitted')
            AND s.category IS NOT NULL
          GROUP BY s.category
          HAVING attempts > 0
          ORDER BY (CAST(correct AS REAL) / attempts) ASC, averageScore ASC
          LIMIT 6
        `,
      )
      .all(userId);

    const recognitionRows = db
      .prepare(
        `
          SELECT createdAt, isCorrect, confidence, stabilityScore
          FROM user_recognition_practice
          WHERE userId = ?
          ORDER BY createdAt
        `,
      )
      .all(userId) as Array<Record<string, unknown>>;

    const firstRecognition = recognitionRows.slice(0, 10);
    const recentRecognition = recognitionRows.slice(-10);
    const avg = (rows: Array<Record<string, unknown>>, field: string) =>
      rows.length > 0
        ? rows.reduce((sum, row) => sum + Number(row[field] || 0), 0) /
          rows.length
        : 0;

    const reviewDays = db
      .prepare(
        `
          SELECT COUNT(DISTINCT substr(createdAt, 1, 10)) AS days
          FROM user_learning_events
          WHERE userId = ?
            AND eventType IN ('card_reviewed', 'quiz_submitted', 'recognition_attempted', 'study_session')
            AND createdAt >= ?
        `,
      )
      .get(userId, weekAgo) as { days: number };

    const dueCards = db
      .prepare(
        `
          SELECT cardId, status, nextReviewDate, attempts, correctAttempts
          FROM learning_progress
          WHERE userId = ? AND status != 'mastered'
          ORDER BY nextReviewDate ASC
          LIMIT 8
        `,
      )
      .all(userId);

    return res.json({
      eventCounts,
      studyTimeThisWeekMs: Number(studyTimeWeek.durationMs || 0),
      accuracyTrend: quizTrend,
      weakestTopics,
      recognitionImprovement: {
        attempts: recognitionRows.length,
        firstAccuracy:
          firstRecognition.length > 0
            ? Math.round(
                (firstRecognition.filter((row) => Number(row.isCorrect) === 1)
                  .length /
                  firstRecognition.length) *
                  100,
              )
            : 0,
        recentAccuracy:
          recentRecognition.length > 0
            ? Math.round(
                (recentRecognition.filter((row) => Number(row.isCorrect) === 1)
                  .length /
                  recentRecognition.length) *
                  100,
              )
            : 0,
        confidenceDelta: Math.round(
          (avg(recentRecognition, "confidence") -
            avg(firstRecognition, "confidence")) *
            100,
        ),
        stabilityDelta: Math.round(
          (avg(recentRecognition, "stabilityScore") -
            avg(firstRecognition, "stabilityScore")) *
            100,
        ),
      },
      reviewConsistency: {
        activeDaysThisWeek: Number(reviewDays.days || 0),
        percent: Math.round((Number(reviewDays.days || 0) / 7) * 100),
      },
      recommendedReview: dueCards,
    });
  } catch (error) {
    console.error("Get learner analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  } finally {
    db.close();
  }
});

router.get("/lessons/:lessonId/quiz", (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const publishedWords = new Set(
      (
        db
          .prepare("SELECT word FROM signs WHERE status = 'published'")
          .all() as Array<{ word: string }>
      ).map((row) => row.word),
    );
    const rows = db
      .prepare(
        `
          SELECT id, signId, lessonId, type, question, optionsJson,
                 correctAnswer, explanation, difficulty
          FROM quiz_questions
          WHERE lessonId = ?
            AND status IN ('active', 'published')
            AND signId IN (SELECT id FROM signs WHERE status = 'published')
            AND lessonId IN (SELECT id FROM lessons WHERE status = 'published')
          ORDER BY signId, type, question
        `,
      )
      .all(req.params.lessonId) as Array<Record<string, unknown>>;

    return res.status(200).json({
      questions: rows.map((row) => {
        const correctAnswer = String(row.correctAnswer);
        const type = String(row.type);
        const options = jsonArray(row.optionsJson).filter(
          (option) => option === correctAnswer || publishedWords.has(option),
        );
        const correctAnswerIndex = Math.max(options.indexOf(correctAnswer), 0);

        return {
          id: String(row.id),
          type,
          cardId: String(row.signId),
          question: getSafeQuizQuestionText(type, String(row.question)),
          options,
          correctAnswerIndex,
          difficulty: String(row.difficulty),
          explanation: String(row.explanation || ""),
        };
      }),
    });
  } catch (error) {
    console.error("Get lesson quiz error:", error);
    return res.status(500).json({ error: "Failed to fetch lesson quiz" });
  } finally {
    db.close();
  }
});

router.get("/published-content", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const signRows = db
      .prepare(
        `
          SELECT s.*, m.url AS videoUrl
          FROM signs s
          LEFT JOIN sign_media m ON m.signId = s.id AND m.isPrimary = 1
          WHERE s.status = 'published'
          ORDER BY s.category, s.word
        `,
      )
      .all() as Array<Record<string, unknown>>;

    const lessonRows = db
      .prepare(
        `
          SELECT *
          FROM lessons
          WHERE status = 'published'
          ORDER BY orderIndex
        `,
      )
      .all() as Array<Record<string, unknown>>;

    const lessonSignRows = db
      .prepare(
        `
          SELECT ls.lessonId, ls.signId
          FROM lesson_signs ls
          JOIN signs s ON s.id = ls.signId AND s.status = 'published'
          JOIN lessons l ON l.id = ls.lessonId AND l.status = 'published'
          ORDER BY ls.sortOrder
        `,
      )
      .all() as Array<{ lessonId: string; signId: string }>;

    const localVideoBySignId = new Map(
      vocabularyCards.map((card) => [card.id, card.videoUrl]),
    );

    const signs = signRows.map((row) => {
      const id = String(row.id);
      return {
        id,
        word: String(row.word),
        category: String(row.category),
        difficulty: String(row.difficulty),
        videoUrl: localVideoBySignId.get(id) || String(row.videoUrl || ""),
        description: String(row.description || ""),
        example: row.example ? String(row.example) : undefined,
      };
    });

    const lessons = lessonRows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      level: String(row.level),
      category: String(row.category),
      description: String(row.description || ""),
      order: Number(row.orderIndex),
      targetCardCount: Number(row.targetCardCount),
      requiredQuizScore: Number(row.requiredQuizScore),
      recognitionRequired: Number(row.recognitionRequired) === 1,
      cardIds: lessonSignRows
        .filter((item) => item.lessonId === row.id)
        .map((item) => item.signId),
    }));

    return res.json({ signs, lessons });
  } catch (error) {
    console.error("Get published content error:", error);
    return res.status(500).json({ error: "Failed to fetch published content" });
  } finally {
    db.close();
  }
});

router.get("/progress", authMiddleware, (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT cardId, status, interval, difficulty, easeFactor,
                 COALESCE(nextReviewDate, updatedAt) AS nextReviewDate,
                 attempts, correctAttempts, understood,
                 lastReviewed AS lastReviewedDate, createdAt, updatedAt
          FROM learning_progress
          WHERE userId = ?
          ORDER BY updatedAt DESC
        `,
      )
      .all(req.user!.userId) as Array<Record<string, unknown>>;

    const understoodCardIds = rows
      .filter((row) => Number(row.understood) === 1)
      .map((row) => String(row.cardId));

    const lessonRows = db
      .prepare(
        `
          SELECT lessonId, status, currentStep, quizScore, quizPassed,
                 recognitionAttempts, recognitionCorrect, startedAt,
                 completedAt, updatedAt
          FROM user_lesson_progress
          WHERE userId = ?
          ORDER BY updatedAt DESC
        `,
      )
      .all(req.user!.userId) as Array<Record<string, unknown>>;

    return res.status(200).json({
      progress: rows.map(({ understood, ...row }) => row),
      understoodCardIds,
      lessonProgress: lessonRows.map((row) => ({
        ...row,
        quizPassed: Number(row.quizPassed) === 1,
      })),
    });
  } catch (error) {
    console.error("Get learning progress error:", error);
    return res.status(500).json({ error: "Failed to fetch learning progress" });
  } finally {
    db.close();
  }
});

router.put("/progress", authMiddleware, (req: Request, res: Response) => {
  const parsed = syncSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }

  const db = getDatabase();
  const understood = new Set(parsed.data.understoodCardIds);

  try {
    const upsert = db.prepare(`
      INSERT INTO learning_progress (
        id, userId, cardId, status, interval, difficulty, easeFactor,
        nextReviewDate, attempts, correctAttempts, understood,
        lastReviewed, createdAt, updatedAt
      )
      VALUES (
        @id, @userId, @cardId, @status, @interval, @difficulty, @easeFactor,
        @nextReviewDate, @attempts, @correctAttempts, @understood,
        @lastReviewed, @createdAt, @updatedAt
      )
      ON CONFLICT(userId, cardId) DO UPDATE SET
        status = excluded.status,
        interval = excluded.interval,
        difficulty = excluded.difficulty,
        easeFactor = excluded.easeFactor,
        nextReviewDate = excluded.nextReviewDate,
        attempts = excluded.attempts,
        correctAttempts = excluded.correctAttempts,
        understood = excluded.understood,
        lastReviewed = excluded.lastReviewed,
        updatedAt = excluded.updatedAt
    `);

    const upsertLesson = db.prepare(`
      INSERT INTO user_lesson_progress (
        id, userId, lessonId, status, currentStep, quizScore, quizPassed,
        recognitionAttempts, recognitionCorrect, startedAt, completedAt,
        updatedAt
      )
      VALUES (
        @id, @userId, @lessonId, @status, @currentStep, @quizScore, @quizPassed,
        @recognitionAttempts, @recognitionCorrect, @startedAt, @completedAt,
        @updatedAt
      )
      ON CONFLICT(userId, lessonId) DO UPDATE SET
        status = excluded.status,
        currentStep = excluded.currentStep,
        quizScore = excluded.quizScore,
        quizPassed = excluded.quizPassed,
        recognitionAttempts = excluded.recognitionAttempts,
        recognitionCorrect = excluded.recognitionCorrect,
        startedAt = excluded.startedAt,
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `);

    const transaction = db.transaction(() => {
      parsed.data.progress.forEach((item) => {
        upsert.run({
          id: `${req.user!.userId}:${item.cardId}`,
          userId: req.user!.userId,
          cardId: item.cardId,
          status: item.status,
          interval: item.interval,
          difficulty: item.difficulty,
          easeFactor: item.easeFactor,
          nextReviewDate: item.nextReviewDate,
          attempts: item.attempts,
          correctAttempts: item.correctAttempts,
          understood: understood.has(item.cardId) ? 1 : 0,
          lastReviewed: item.lastReviewedDate || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      });

      understood.forEach((cardId) => {
        if (parsed.data.progress.some((item) => item.cardId === cardId)) {
          return;
        }

        const now = new Date().toISOString();
        upsert.run({
          id: `${req.user!.userId}:${cardId}`,
          userId: req.user!.userId,
          cardId,
          status: "mastered",
          interval: 0,
          difficulty: 5,
          easeFactor: 2.5,
          nextReviewDate: now,
          attempts: 0,
          correctAttempts: 0,
          understood: 1,
          lastReviewed: null,
          createdAt: now,
          updatedAt: now,
        });
      });

      parsed.data.lessonProgress.forEach((item) => {
        upsertLesson.run({
          id: `${req.user!.userId}:${item.lessonId}`,
          userId: req.user!.userId,
          lessonId: item.lessonId,
          status: item.status,
          currentStep: item.currentStep,
          quizScore: item.quizScore ?? null,
          quizPassed: item.quizPassed ? 1 : 0,
          recognitionAttempts: item.recognitionAttempts,
          recognitionCorrect: item.recognitionCorrect,
          startedAt: item.startedAt ?? null,
          completedAt: item.completedAt ?? null,
          updatedAt: item.updatedAt,
        });
      });
    });

    transaction();

    return res.status(200).json({ message: "Learning progress synced" });
  } catch (error) {
    console.error("Sync learning progress error:", error);
    return res.status(500).json({ error: "Failed to sync learning progress" });
  } finally {
    db.close();
  }
});

router.post(
  "/recognition-practice",
  authMiddleware,
  (req: Request, res: Response) => {
    const parsed = recognitionPracticeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const db = getDatabase();
    const createdAt = parsed.data.createdAt || new Date().toISOString();
    const id = `${req.user!.userId}:${parsed.data.lessonId}:${parsed.data.cardId}:${Date.now()}`;

    try {
      db.prepare(
        `
          INSERT INTO user_recognition_practice (
            id, userId, lessonId, cardId, expectedWord, predictedWord,
            isCorrect, confidence, confusedWith, suggestion, attemptCount,
            durationMs, stabilityScore, passedThreshold, createdAt
          )
          VALUES (
            @id, @userId, @lessonId, @cardId, @expectedWord, @predictedWord,
            @isCorrect, @confidence, @confusedWith, @suggestion, @attemptCount,
            @durationMs, @stabilityScore, @passedThreshold, @createdAt
          )
        `,
      ).run({
        id,
        userId: req.user!.userId,
        lessonId: parsed.data.lessonId,
        cardId: parsed.data.cardId,
        expectedWord: parsed.data.expectedWord,
        predictedWord: parsed.data.predictedWord,
        isCorrect: parsed.data.isCorrect ? 1 : 0,
        confidence: parsed.data.confidence,
        confusedWith: parsed.data.confusedWith || null,
        suggestion: parsed.data.suggestion || null,
        attemptCount: parsed.data.attemptCount,
        durationMs: parsed.data.durationMs,
        stabilityScore: parsed.data.stabilityScore,
        passedThreshold: parsed.data.passedThreshold ? 1 : 0,
        createdAt,
      });

      return res.status(201).json({
        result: {
          id,
          userId: req.user!.userId,
          ...parsed.data,
          createdAt,
        },
      });
    } catch (error) {
      console.error("Save recognition practice error:", error);
      return res
        .status(500)
        .json({ error: "Failed to save recognition practice" });
    } finally {
      db.close();
    }
  },
);

router.get(
  "/recognition-practice/history",
  authMiddleware,
  (req: Request, res: Response) => {
    const db = getDatabase();
    const limit = Math.min(Number(req.query.limit || 50), 200);

    try {
      const rows = db
        .prepare(
          `
            SELECT id, userId, lessonId, cardId, expectedWord, predictedWord,
                   isCorrect, confidence, confusedWith, suggestion,
                   attemptCount, durationMs, stabilityScore, passedThreshold,
                   createdAt
            FROM user_recognition_practice
            WHERE userId = ?
            ORDER BY createdAt DESC
            LIMIT ?
          `,
        )
        .all(req.user!.userId, limit) as Array<Record<string, unknown>>;

      return res.status(200).json({
        results: rows.map((row) => ({
          ...row,
          isCorrect: Number(row.isCorrect) === 1,
          passedThreshold: Number(row.passedThreshold) === 1,
        })),
      });
    } catch (error) {
      console.error("Get recognition practice history error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch recognition practice history" });
    } finally {
      db.close();
    }
  },
);

export default router;
