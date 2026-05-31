import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import { vocabularyCards } from "../shared/vocabulary";
import { lessons } from "../shared/curriculum";
import { curatedSignMetadata } from "../shared/sign-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "app.db");

// Ensure data directory exists
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  console.error("Failed to create data directory:", error);
}

export function initializeDatabase() {
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT,
      avatarUrl TEXT NOT NULL DEFAULT '/img/avatar/1.jfif',
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{
    name: string;
  }>;
  const existingUserColumns = new Set(userColumns.map((column) => column.name));
  if (!existingUserColumns.has("role")) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
  if (!existingUserColumns.has("avatarUrl")) {
    db.exec(
      "ALTER TABLE users ADD COLUMN avatarUrl TEXT NOT NULL DEFAULT '/img/avatar/1.jfif'",
    );
  }

  // Create learning progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      cardId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      interval INTEGER NOT NULL DEFAULT 0,
      difficulty INTEGER NOT NULL DEFAULT 1,
      easeFactor REAL NOT NULL DEFAULT 2.5,
      nextReviewDate TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      correctAttempts INTEGER NOT NULL DEFAULT 0,
      understood INTEGER NOT NULL DEFAULT 0,
      lastReviewed TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, cardId)
    )
  `);

  const columns = db
    .prepare("PRAGMA table_info(learning_progress)")
    .all() as Array<{ name: string }>;
  const existingColumns = new Set(columns.map((column) => column.name));
  const migrations = [
    [
      "interval",
      "ALTER TABLE learning_progress ADD COLUMN interval INTEGER NOT NULL DEFAULT 0",
    ],
    [
      "difficulty",
      "ALTER TABLE learning_progress ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 1",
    ],
    [
      "easeFactor",
      "ALTER TABLE learning_progress ADD COLUMN easeFactor REAL NOT NULL DEFAULT 2.5",
    ],
    [
      "nextReviewDate",
      "ALTER TABLE learning_progress ADD COLUMN nextReviewDate TEXT",
    ],
    [
      "correctAttempts",
      "ALTER TABLE learning_progress ADD COLUMN correctAttempts INTEGER NOT NULL DEFAULT 0",
    ],
    [
      "understood",
      "ALTER TABLE learning_progress ADD COLUMN understood INTEGER NOT NULL DEFAULT 0",
    ],
  ] as const;

  migrations.forEach(([column, sql]) => {
    if (!existingColumns.has(column)) {
      db.exec(sql);
    }
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_lesson_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not-started',
      currentStep TEXT NOT NULL DEFAULT 'not-started',
      quizScore INTEGER,
      quizPassed INTEGER NOT NULL DEFAULT 0,
      recognitionAttempts INTEGER NOT NULL DEFAULT 0,
      recognitionCorrect INTEGER NOT NULL DEFAULT 0,
      startedAt TEXT,
      completedAt TEXT,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, lessonId)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_recognition_practice (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      cardId TEXT NOT NULL,
      expectedWord TEXT NOT NULL,
      predictedWord TEXT NOT NULL,
      isCorrect INTEGER NOT NULL DEFAULT 0,
      confidence REAL NOT NULL DEFAULT 0,
      confusedWith TEXT,
      suggestion TEXT,
      attemptCount INTEGER NOT NULL DEFAULT 1,
      durationMs INTEGER NOT NULL DEFAULT 0,
      stabilityScore REAL NOT NULL DEFAULT 0,
      passedThreshold INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_learning_events (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      eventType TEXT NOT NULL,
      lessonId TEXT,
      cardId TEXT,
      signId TEXT,
      quizQuestionId TEXT,
      durationMs INTEGER NOT NULL DEFAULT 0,
      isCorrect INTEGER,
      score REAL,
      metadataJson TEXT NOT NULL DEFAULT '{}',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const recognitionColumns = db
    .prepare("PRAGMA table_info(user_recognition_practice)")
    .all() as Array<{ name: string }>;
  const existingRecognitionColumns = new Set(
    recognitionColumns.map((column) => column.name),
  );
  const recognitionMigrations = [
    [
      "attemptCount",
      "ALTER TABLE user_recognition_practice ADD COLUMN attemptCount INTEGER NOT NULL DEFAULT 1",
    ],
    [
      "durationMs",
      "ALTER TABLE user_recognition_practice ADD COLUMN durationMs INTEGER NOT NULL DEFAULT 0",
    ],
    [
      "stabilityScore",
      "ALTER TABLE user_recognition_practice ADD COLUMN stabilityScore REAL NOT NULL DEFAULT 0",
    ],
    [
      "passedThreshold",
      "ALTER TABLE user_recognition_practice ADD COLUMN passedThreshold INTEGER NOT NULL DEFAULT 0",
    ],
  ] as const;

  recognitionMigrations.forEach(([column, sql]) => {
    if (!existingRecognitionColumns.has(column)) {
      db.exec(sql);
    }
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS signs (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      example TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sign_metadata (
      signId TEXT PRIMARY KEY,
      instruction TEXT NOT NULL DEFAULT '',
      commonMistakes TEXT NOT NULL DEFAULT '[]',
      practiceTips TEXT NOT NULL DEFAULT '[]',
      exampleSentences TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (signId) REFERENCES signs(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sign_media (
      id TEXT PRIMARY KEY,
      signId TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'video',
      url TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'drive',
      isPrimary INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (signId) REFERENCES signs(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      orderIndex INTEGER NOT NULL,
      targetCardCount INTEGER NOT NULL,
      requiredQuizScore INTEGER NOT NULL,
      recognitionRequired INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'published',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_signs (
      lessonId TEXT NOT NULL,
      signId TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (lessonId, signId),
      FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (signId) REFERENCES signs(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      signId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      optionsJson TEXT NOT NULL DEFAULT '[]',
      correctAnswer TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT 'beginner',
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (signId) REFERENCES signs(id) ON DELETE CASCADE,
      FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  addColumnIfMissing(
    db,
    "signs",
    "status",
    "ALTER TABLE signs ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
  );
  addColumnIfMissing(
    db,
    "lessons",
    "status",
    "ALTER TABLE lessons ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
  );
  addColumnIfMissing(
    db,
    "quiz_questions",
    "status",
    "ALTER TABLE quiz_questions ADD COLUMN status TEXT NOT NULL DEFAULT 'active'",
  );

  seedContentDatabase(db);

  console.log("✅ Database initialized successfully at", dbPath);
  return db;
}

function seedContentDatabase(db: Database.Database) {
  const now = new Date().toISOString();

  const insertSign = db.prepare(`
    INSERT OR IGNORE INTO signs (
      id, word, category, difficulty, description, example, status, createdAt, updatedAt
    )
    VALUES (
      @id, @word, @category, @difficulty, @description, @example, @status, @createdAt, @updatedAt
    )
  `);

  const insertMedia = db.prepare(`
    INSERT INTO sign_media (
      id, signId, type, url, source, isPrimary, createdAt, updatedAt
    )
    VALUES (
      @id, @signId, 'video', @url, @source, 1, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      url = excluded.url,
      source = excluded.source,
      isPrimary = excluded.isPrimary,
      updatedAt = excluded.updatedAt
  `);

  const insertLesson = db.prepare(`
    INSERT INTO lessons (
      id, title, level, category, description, orderIndex, targetCardCount,
      requiredQuizScore, recognitionRequired, status, createdAt, updatedAt
    )
    VALUES (
      @id, @title, @level, @category, @description, @orderIndex, @targetCardCount,
      @requiredQuizScore, @recognitionRequired, @status, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      level = excluded.level,
      category = excluded.category,
      description = excluded.description,
      orderIndex = excluded.orderIndex,
      targetCardCount = excluded.targetCardCount,
      requiredQuizScore = excluded.requiredQuizScore,
      recognitionRequired = excluded.recognitionRequired,
      status = excluded.status,
      updatedAt = excluded.updatedAt
  `);

  const insertLessonSign = db.prepare(`
    INSERT OR IGNORE INTO lesson_signs (lessonId, signId, sortOrder)
    VALUES (@lessonId, @signId, @sortOrder)
  `);

  const insertMetadata = db.prepare(`
    INSERT OR IGNORE INTO sign_metadata (
      signId, instruction, commonMistakes, practiceTips, exampleSentences, updatedAt
    )
    VALUES (
      @signId, @instruction, @commonMistakes, @practiceTips, @exampleSentences, @updatedAt
    )
  `);

  const insertQuizQuestion = db.prepare(`
    INSERT OR IGNORE INTO quiz_questions (
      id, signId, lessonId, type, question, optionsJson, correctAnswer,
      explanation, difficulty, status, createdAt, updatedAt
    )
    VALUES (
      @id, @signId, @lessonId, @type, @question, @optionsJson, @correctAnswer,
      @explanation, @difficulty, @status, @createdAt, @updatedAt
    )
  `);

  const buildOptions = (
    card: (typeof vocabularyCards)[number],
    lessonCardIds: string[],
  ) => {
    const lessonOptions = vocabularyCards
      .filter((item) => lessonCardIds.includes(item.id) && item.id !== card.id)
      .map((item) => item.word);
    const fallbackOptions = vocabularyCards
      .filter((item) => item.category === card.category && item.id !== card.id)
      .map((item) => item.word);
    const options = Array.from(
      new Set([...lessonOptions, ...fallbackOptions]),
    ).slice(0, 3);

    while (options.length < 3) {
      const filler = vocabularyCards.find(
        (item) => item.id !== card.id && !options.includes(item.word),
      );
      if (!filler) break;
      options.push(filler.word);
    }

    return [...options.slice(0, 3), card.word].sort();
  };

  const transaction = db.transaction(() => {
    vocabularyCards.forEach((card) => {
      insertSign.run({
        id: card.id,
        word: card.word,
        category: card.category,
        difficulty: card.difficulty,
        description: card.description || "",
        example: card.example || null,
        status: "published",
        createdAt: now,
        updatedAt: now,
      });

      if (card.videoUrl) {
        insertMedia.run({
          id: `${card.id}:primary-video`,
          signId: card.id,
          url: card.videoUrl,
          source: card.videoUrl.startsWith("/api/video-stream/")
            ? "drive"
            : card.videoUrl.startsWith("/")
              ? "local"
              : "external",
          createdAt: now,
          updatedAt: now,
        });
      }

      const metadata = curatedSignMetadata[card.word.toLowerCase()];
      if (metadata) {
        insertMetadata.run({
          signId: card.id,
          instruction: metadata.instruction || "",
          commonMistakes: JSON.stringify(metadata.commonMistakes || []),
          practiceTips: JSON.stringify(metadata.practiceTips || []),
          exampleSentences: JSON.stringify(metadata.exampleSentences || []),
          updatedAt: now,
        });
      }
    });

    lessons.forEach((lesson) => {
      insertLesson.run({
        id: lesson.id,
        title: lesson.title,
        level: lesson.level,
        category: lesson.category,
        description: lesson.description,
        orderIndex: lesson.order,
        targetCardCount: lesson.targetCardCount,
        requiredQuizScore: lesson.requiredQuizScore,
        recognitionRequired: lesson.recognitionRequired ? 1 : 0,
        status: "published",
        createdAt: now,
        updatedAt: now,
      });

      lesson.cardIds.forEach((signId, index) => {
        insertLessonSign.run({
          lessonId: lesson.id,
          signId,
          sortOrder: index,
        });

        const card = vocabularyCards.find((item) => item.id === signId);
        if (!card) return;

        const options = buildOptions(card, lesson.cardIds);
        insertQuizQuestion.run({
          id: `${lesson.id}:${card.id}:meaning`,
          signId: card.id,
          lessonId: lesson.id,
          type: "meaning_quiz",
          question: "What word does this sign represent?",
          optionsJson: JSON.stringify(options),
          correctAnswer: card.word,
          explanation: card.description || `This sign means "${card.word}".`,
          difficulty: card.difficulty,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });

        insertQuizQuestion.run({
          id: `${lesson.id}:${card.id}:video-to-word`,
          signId: card.id,
          lessonId: lesson.id,
          type: "video_to_word",
          question: "What word is shown in this video?",
          optionsJson: JSON.stringify(options),
          correctAnswer: card.word,
          explanation: card.example || `The correct word is "${card.word}".`,
          difficulty: card.difficulty,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      });
    });
  });

  transaction();
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  sql: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(sql);
  }
}

export function getDatabase() {
  return new Database(dbPath);
}
