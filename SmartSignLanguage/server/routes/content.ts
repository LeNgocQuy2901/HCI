import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDatabase } from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

const jsonArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const signSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().default(""),
  example: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "ready", "published", "archived"]).default("draft"),
});

const metadataSchema = z.object({
  instruction: z.string().default(""),
  commonMistakes: z.array(z.string()).default([]),
  practiceTips: z.array(z.string()).default([]),
  exampleSentences: z.array(z.string()).default([]),
});

const lessonAssignmentSchema = z.object({
  lessonIds: z.array(z.string()).default([]),
});

const statusSchema = z.object({
  status: z.enum(["draft", "ready", "published", "archived"]),
});

const quizQuestionSchema = z.object({
  id: z.string().min(1).optional(),
  signId: z.string().min(1),
  lessonId: z.string().min(1),
  type: z.enum([
    "meaning_quiz",
    "video_to_word",
    "word_to_sign",
    "common_mistake",
  ]),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
  explanation: z.string().default(""),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  status: z.enum(["draft", "ready", "published", "archived", "active"]).default("draft"),
});

const mapSignRow = (row: Record<string, unknown>) => ({
  id: String(row.id),
  word: String(row.word),
  category: String(row.category),
  difficulty: String(row.difficulty),
  description: String(row.description || ""),
  example: row.example ? String(row.example) : "",
  videoUrl: row.videoUrl ? String(row.videoUrl) : "",
  status: String(row.status || "draft"),
  createdAt: String(row.createdAt),
  updatedAt: String(row.updatedAt),
});

const mapMetadataRow = (row?: Record<string, unknown>) => ({
  signId: row?.signId ? String(row.signId) : "",
  instruction: row?.instruction ? String(row.instruction) : "",
  commonMistakes: jsonArray(row?.commonMistakes),
  practiceTips: jsonArray(row?.practiceTips),
  exampleSentences: jsonArray(row?.exampleSentences),
  updatedAt: row?.updatedAt ? String(row.updatedAt) : "",
});

const mapQuizQuestionRow = (row: Record<string, unknown>) => ({
  id: String(row.id),
  signId: String(row.signId),
  lessonId: String(row.lessonId),
  type: String(row.type),
  question: String(row.question),
  options: jsonArray(row.optionsJson),
  correctAnswer: String(row.correctAnswer),
  explanation: String(row.explanation || ""),
  difficulty: String(row.difficulty),
  status: String(row.status || "draft"),
  createdAt: String(row.createdAt),
  updatedAt: String(row.updatedAt),
});

router.get("/signs", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT s.*, m.url AS videoUrl
          FROM signs s
          LEFT JOIN sign_media m ON m.signId = s.id AND m.isPrimary = 1
          ORDER BY s.category, s.word
        `,
      )
      .all() as Array<Record<string, unknown>>;

    res.json({ signs: rows.map(mapSignRow) });
  } finally {
    db.close();
  }
});

router.get("/signs/:id", (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const sign = db
      .prepare(
        `
          SELECT s.*, m.url AS videoUrl
          FROM signs s
          LEFT JOIN sign_media m ON m.signId = s.id AND m.isPrimary = 1
          WHERE s.id = ?
        `,
      )
      .get(req.params.id) as Record<string, unknown> | undefined;

    if (!sign) return res.status(404).json({ error: "Sign not found" });

    const metadata = db
      .prepare("SELECT * FROM sign_metadata WHERE signId = ?")
      .get(req.params.id) as Record<string, unknown> | undefined;

    const lessonIds = (
      db
        .prepare("SELECT lessonId FROM lesson_signs WHERE signId = ? ORDER BY sortOrder")
        .all(req.params.id) as Array<{ lessonId: string }>
    ).map((row) => row.lessonId);

    const quizQuestions = (
      db
        .prepare(
          `
            SELECT *
            FROM quiz_questions
            WHERE signId = ?
            ORDER BY lessonId, type, question
          `,
        )
        .all(req.params.id) as Array<Record<string, unknown>>
    ).map(mapQuizQuestionRow);

    return res.json({
      sign: mapSignRow(sign),
      metadata: { ...mapMetadataRow(metadata), signId: req.params.id },
      lessonIds,
      quizQuestions,
    });
  } finally {
    db.close();
  }
});

router.post("/signs", (req: Request, res: Response) => {
  const parsed = signSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    db.prepare(
      `
        INSERT INTO signs (
          id, word, category, difficulty, description, example, status, createdAt, updatedAt
        )
        VALUES (
          @id, @word, @category, @difficulty, @description, @example, @status, @createdAt, @updatedAt
        )
      `,
    ).run({
      ...parsed.data,
      example: parsed.data.example || null,
      createdAt: now,
      updatedAt: now,
    });

    if (parsed.data.videoUrl) {
      upsertPrimaryVideo(db, parsed.data.id, parsed.data.videoUrl, now);
    }

    return res.status(201).json({ sign: { ...parsed.data, createdAt: now, updatedAt: now } });
  } catch (error) {
    console.error("Create sign error:", error);
    return res.status(500).json({ error: "Failed to create sign" });
  } finally {
    db.close();
  }
});

router.put("/signs/:id", (req: Request, res: Response) => {
  const parsed = signSchema.omit({ id: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  const now = new Date().toISOString();
  const signId = String(req.params.id);
  try {
    const result = db.prepare(
      `
        UPDATE signs
        SET word = @word,
            category = @category,
            difficulty = @difficulty,
            description = @description,
            example = @example,
            status = @status,
            updatedAt = @updatedAt
        WHERE id = @id
      `,
    ).run({
      id: signId,
      ...parsed.data,
      example: parsed.data.example || null,
      updatedAt: now,
    });

    if (result.changes === 0) return res.status(404).json({ error: "Sign not found" });

    if (parsed.data.videoUrl) {
      upsertPrimaryVideo(db, signId, String(parsed.data.videoUrl), now);
    } else {
      db.prepare("DELETE FROM sign_media WHERE signId = ? AND isPrimary = 1").run(signId);
    }

    return res.json({ message: "Sign updated" });
  } catch (error) {
    console.error("Update sign error:", error);
    return res.status(500).json({ error: "Failed to update sign" });
  } finally {
    db.close();
  }
});

router.delete("/signs/:id", (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const result = db.prepare("DELETE FROM signs WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Sign not found" });
    return res.json({ message: "Sign deleted" });
  } finally {
    db.close();
  }
});

router.put("/signs/:id/metadata", (req: Request, res: Response) => {
  const parsed = metadataSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    db.prepare(
      `
        INSERT INTO sign_metadata (
          signId, instruction, commonMistakes, practiceTips, exampleSentences, updatedAt
        )
        VALUES (
          @signId, @instruction, @commonMistakes, @practiceTips, @exampleSentences, @updatedAt
        )
        ON CONFLICT(signId) DO UPDATE SET
          instruction = excluded.instruction,
          commonMistakes = excluded.commonMistakes,
          practiceTips = excluded.practiceTips,
          exampleSentences = excluded.exampleSentences,
          updatedAt = excluded.updatedAt
      `,
    ).run({
      signId: req.params.id,
      instruction: parsed.data.instruction,
      commonMistakes: JSON.stringify(parsed.data.commonMistakes),
      practiceTips: JSON.stringify(parsed.data.practiceTips),
      exampleSentences: JSON.stringify(parsed.data.exampleSentences),
      updatedAt: now,
    });

    return res.json({ message: "Metadata updated" });
  } finally {
    db.close();
  }
});

router.put("/signs/:id/lessons", (req: Request, res: Response) => {
  const parsed = lessonAssignmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  try {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM lesson_signs WHERE signId = ?").run(req.params.id);
      const insert = db.prepare(`
        INSERT INTO lesson_signs (lessonId, signId, sortOrder)
        VALUES (@lessonId, @signId, COALESCE((SELECT MAX(sortOrder) + 1 FROM lesson_signs WHERE lessonId = @lessonId), 0))
      `);
      parsed.data.lessonIds.forEach((lessonId) => insert.run({ lessonId, signId: req.params.id }));
    });

    transaction();
    return res.json({ message: "Lesson assignments updated" });
  } finally {
    db.close();
  }
});

router.get("/signs/:id/quiz", (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT *
          FROM quiz_questions
          WHERE signId = ?
          ORDER BY lessonId, type, question
        `,
      )
      .all(req.params.id) as Array<Record<string, unknown>>;

    return res.json({ quizQuestions: rows.map(mapQuizQuestionRow) });
  } finally {
    db.close();
  }
});

router.post("/quiz-questions", (req: Request, res: Response) => {
  const parsed = quizQuestionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  const now = new Date().toISOString();
  const id =
    parsed.data.id ||
    `${parsed.data.lessonId}:${parsed.data.signId}:${parsed.data.type}:${Date.now()}`;

  try {
    db.prepare(
      `
        INSERT INTO quiz_questions (
          id, signId, lessonId, type, question, optionsJson, correctAnswer,
          explanation, difficulty, status, createdAt, updatedAt
        )
        VALUES (
          @id, @signId, @lessonId, @type, @question, @optionsJson, @correctAnswer,
          @explanation, @difficulty, @status, @createdAt, @updatedAt
        )
      `,
    ).run({
      ...parsed.data,
      id,
      optionsJson: JSON.stringify(parsed.data.options),
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ quizQuestion: { ...parsed.data, id, createdAt: now, updatedAt: now } });
  } catch (error) {
    console.error("Create quiz question error:", error);
    return res.status(500).json({ error: "Failed to create quiz question" });
  } finally {
    db.close();
  }
});

router.put("/quiz-questions/:id", (req: Request, res: Response) => {
  const parsed = quizQuestionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  const now = new Date().toISOString();
  try {
    const result = db.prepare(
      `
        UPDATE quiz_questions
        SET signId = @signId,
            lessonId = @lessonId,
            type = @type,
            question = @question,
            optionsJson = @optionsJson,
            correctAnswer = @correctAnswer,
            explanation = @explanation,
            difficulty = @difficulty,
            status = @status,
            updatedAt = @updatedAt
        WHERE id = @id
      `,
    ).run({
      id: req.params.id,
      ...parsed.data,
      optionsJson: JSON.stringify(parsed.data.options),
      updatedAt: now,
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: "Quiz question not found" });
    }

    return res.json({ message: "Quiz question updated" });
  } finally {
    db.close();
  }
});

router.delete("/quiz-questions/:id", (req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const result = db.prepare("DELETE FROM quiz_questions WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Quiz question not found" });
    }
    return res.json({ message: "Quiz question deleted" });
  } finally {
    db.close();
  }
});

router.get("/lessons", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare("SELECT * FROM lessons ORDER BY orderIndex")
      .all() as Array<Record<string, unknown>>;

    const signRows = db
      .prepare("SELECT lessonId, signId FROM lesson_signs ORDER BY sortOrder")
      .all() as Array<{ lessonId: string; signId: string }>;

    return res.json({
      lessons: rows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        level: String(row.level),
        category: String(row.category),
        description: String(row.description || ""),
        order: Number(row.orderIndex),
        targetCardCount: Number(row.targetCardCount),
        requiredQuizScore: Number(row.requiredQuizScore),
        recognitionRequired: Number(row.recognitionRequired) === 1,
        status: String(row.status || "draft"),
        signIds: signRows
          .filter((item) => item.lessonId === row.id)
          .map((item) => item.signId),
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt),
      })),
    });
  } finally {
    db.close();
  }
});

router.patch("/lessons/:id/status", (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

  const db = getDatabase();
  try {
    const result = db
      .prepare("UPDATE lessons SET status = ?, updatedAt = ? WHERE id = ?")
      .run(parsed.data.status, new Date().toISOString(), req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: "Lesson not found" });
    return res.json({ message: "Lesson status updated" });
  } finally {
    db.close();
  }
});

router.get("/completeness", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT
            s.id AS signId,
            s.word,
            s.category,
            s.status,
            COUNT(DISTINCT ls.lessonId) AS lessonCount,
            MAX(CASE WHEN sm.id IS NOT NULL THEN 1 ELSE 0 END) AS hasVideo,
            COUNT(DISTINCT CASE WHEN qq.status IN ('active', 'published') THEN qq.id END) AS quizQuestionCount,
            md.instruction,
            md.commonMistakes,
            md.practiceTips,
            md.exampleSentences
          FROM signs s
          LEFT JOIN sign_media sm ON sm.signId = s.id AND sm.isPrimary = 1
          LEFT JOIN sign_metadata md ON md.signId = s.id
          LEFT JOIN lesson_signs ls ON ls.signId = s.id
          LEFT JOIN quiz_questions qq ON qq.signId = s.id
          GROUP BY s.id
          ORDER BY s.category, s.word
        `,
      )
      .all() as Array<Record<string, unknown>>;

    const completeness = rows.map((row) => {
      const commonMistakes = jsonArray(row.commonMistakes);
      const practiceTips = jsonArray(row.practiceTips);
      const exampleSentences = jsonArray(row.exampleSentences);
      const checks = {
        hasVideo: Number(row.hasVideo) === 1,
        hasMetadata: Boolean(row.instruction) || commonMistakes.length > 0 || practiceTips.length > 0,
        hasInstruction: Boolean(String(row.instruction || "").trim()),
        hasCommonMistakes: commonMistakes.length > 0,
        hasPracticeTips: practiceTips.length > 0,
        hasExampleSentences: exampleSentences.length > 0,
        hasQuizCoverage: Number(row.quizQuestionCount) > 0,
      };
      const publishBlockers = [
        !checks.hasVideo && "missing video",
        !checks.hasMetadata && "missing metadata",
        Number(row.quizQuestionCount) < 2 && "needs at least 2 active quiz questions",
        Number(row.lessonCount) === 0 && "not assigned to a lesson",
      ].filter(Boolean) as string[];
      const missing = [
        !checks.hasVideo && "video",
        !checks.hasInstruction && "instruction",
        !checks.hasCommonMistakes && "common mistakes",
        !checks.hasPracticeTips && "practice tips",
        !checks.hasExampleSentences && "example sentences",
        !checks.hasQuizCoverage && "quiz coverage",
      ].filter(Boolean) as string[];

      return {
        signId: String(row.signId),
        word: String(row.word),
        category: String(row.category),
        lessonCount: Number(row.lessonCount),
        quizQuestionCount: Number(row.quizQuestionCount),
        status: String(row.status || "draft"),
        ...checks,
        readyToPublish: publishBlockers.length === 0,
        publishBlockers,
        missing,
        score: Math.round(((6 - missing.length) / 6) * 100),
      };
    });

    const total = completeness.length || 1;
    return res.json({
      completeness,
      summary: {
        totalSigns: completeness.length,
        completeSigns: completeness.filter((item) => item.missing.length === 0).length,
        missingVideo: completeness.filter((item) => !item.hasVideo).length,
        missingMetadata: completeness.filter((item) => !item.hasMetadata).length,
        missingQuizCoverage: completeness.filter((item) => !item.hasQuizCoverage).length,
        averageScore: Math.round(
          completeness.reduce((sum, item) => sum + item.score, 0) / total,
        ),
      },
    });
  } finally {
    db.close();
  }
});

function upsertPrimaryVideo(db: ReturnType<typeof getDatabase>, signId: string, url: string, now: string) {
  db.prepare(
    `
      INSERT INTO sign_media (
        id, signId, type, url, source, isPrimary, createdAt, updatedAt
      )
      VALUES (
        @id, @signId, 'video', @url, @source, 1, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        url = excluded.url,
        source = excluded.source,
        updatedAt = excluded.updatedAt
    `,
  ).run({
    id: `${signId}:primary-video`,
    signId,
    url,
    source: url.startsWith("/api/video-stream/")
      ? "drive"
      : url.startsWith("/")
        ? "local"
        : "external",
    createdAt: now,
    updatedAt: now,
  });
}

export default router;
