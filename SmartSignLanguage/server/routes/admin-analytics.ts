import { Router, Request, Response } from "express";
import { getDatabase } from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", (_req: Request, res: Response) => {
  const db = getDatabase();
  try {
    const mostDifficultSigns = db
      .prepare(
        `
          SELECT
            COALESCE(e.signId, e.cardId) AS signId,
            s.word,
            s.category,
            COUNT(*) AS attempts,
            SUM(CASE WHEN e.isCorrect = 1 THEN 1 ELSE 0 END) AS correct,
            AVG(e.score) AS averageScore
          FROM user_learning_events e
          LEFT JOIN signs s ON s.id = COALESCE(e.signId, e.cardId)
          WHERE e.eventType IN ('card_reviewed', 'recognition_attempted', 'quiz_submitted')
            AND COALESCE(e.signId, e.cardId) IS NOT NULL
          GROUP BY COALESCE(e.signId, e.cardId)
          HAVING attempts > 0
          ORDER BY (CAST(correct AS REAL) / attempts) ASC, attempts DESC
        `,
      )
      .all();

    const lessonCompletionRate = db
      .prepare(
        `
          SELECT
            l.id AS lessonId,
            l.title,
            COUNT(DISTINCT started.userId) AS started,
            COUNT(DISTINCT completed.userId) AS completed,
            CASE
              WHEN COUNT(DISTINCT started.userId) = 0 THEN 0
              ELSE ROUND((COUNT(DISTINCT completed.userId) * 100.0) / COUNT(DISTINCT started.userId))
            END AS completionRate
          FROM lessons l
          LEFT JOIN user_learning_events started
            ON started.lessonId = l.id AND started.eventType = 'lesson_started'
          LEFT JOIN user_learning_events completed
            ON completed.lessonId = l.id AND completed.eventType = 'lesson_completed'
          GROUP BY l.id
          ORDER BY completionRate ASC, started DESC
        `,
      )
      .all();

    const quizFailRate = db
      .prepare(
        `
          SELECT
            lessonId,
            COUNT(*) AS attempts,
            SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END) AS passed,
            ROUND((SUM(CASE WHEN score < 70 THEN 1 ELSE 0 END) * 100.0) / COUNT(*)) AS failRate
          FROM user_learning_events
          WHERE eventType = 'quiz_submitted' AND lessonId IS NOT NULL
          GROUP BY lessonId
          HAVING attempts > 0
          ORDER BY failRate DESC, attempts DESC
        `,
      )
      .all();

    const recognitionFailRate = db
      .prepare(
        `
          SELECT
            cardId AS signId,
            expectedWord,
            COUNT(*) AS attempts,
            SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) AS correct,
            ROUND((SUM(CASE WHEN isCorrect = 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(*)) AS failRate,
            AVG(confidence) AS averageConfidence
          FROM user_recognition_practice
          GROUP BY cardId
          HAVING attempts > 0
          ORDER BY failRate DESC, attempts DESC
        `,
      )
      .all();

    const contentNeedingImprovement = db
      .prepare(
        `
          SELECT
            s.id AS signId,
            s.word,
            s.category,
            s.status,
            MAX(CASE WHEN sm.id IS NOT NULL THEN 1 ELSE 0 END) AS hasVideo,
            COUNT(DISTINCT CASE WHEN qq.status IN ('active', 'published') THEN qq.id END) AS activeQuizQuestions,
            CASE WHEN md.signId IS NULL OR md.instruction = '' THEN 0 ELSE 1 END AS hasMetadata
          FROM signs s
          LEFT JOIN sign_media sm ON sm.signId = s.id AND sm.isPrimary = 1
          LEFT JOIN sign_metadata md ON md.signId = s.id
          LEFT JOIN quiz_questions qq ON qq.signId = s.id
          GROUP BY s.id
          HAVING hasVideo = 0 OR hasMetadata = 0 OR activeQuizQuestions < 2
          ORDER BY s.status = 'published' DESC, activeQuizQuestions ASC, s.word
        `,
      )
      .all();

    const eventVolume = db
      .prepare(
        `
          SELECT eventType, COUNT(*) AS count
          FROM user_learning_events
          GROUP BY eventType
          ORDER BY count DESC
        `,
      )
      .all();

    return res.json({
      mostDifficultSigns,
      lessonCompletionRate,
      quizFailRate,
      recognitionFailRate,
      contentNeedingImprovement,
      eventVolume,
    });
  } catch (error) {
    console.error("Get admin analytics overview error:", error);
    return res.status(500).json({ error: "Failed to fetch admin analytics" });
  } finally {
    db.close();
  }
});

export default router;
