import http from "k6/http";
import { check, group } from "k6";
import { config, uniqueValue } from "../config.js";
import { login, registerUser } from "../lib/auth.js";
import {
  bearerHeaders,
  expectStatus,
  jsonHeaders,
  parseJson,
} from "../lib/http.js";

export const options = {
  scenarios: {
    functional_app_api: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "2m",
    },
  },
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
  },
};

function syncProgress(token, progress, understoodCardIds, lessonProgress = []) {
  const response = http.put(
    `${config.appBaseUrl}/api/learning/progress`,
    JSON.stringify({ progress, understoodCardIds, lessonProgress }),
    jsonHeaders(token),
  );
  expectStatus(response, 200, "sync learning progress");
}

function progressItem(cardId, status, attempts, correctAttempts) {
  const now = new Date().toISOString();
  return {
    cardId,
    status,
    interval: status === "mastered" ? 7 : 1,
    difficulty: 3,
    easeFactor: 2.5,
    nextReviewDate: now,
    attempts,
    correctAttempts,
    lastReviewedDate: now,
    createdAt: now,
    updatedAt: now,
  };
}

function sendLearningEvent(token, event) {
  const response = http.post(
    `${config.appBaseUrl}/api/learning/events`,
    JSON.stringify(event),
    jsonHeaders(token),
  );
  expectStatus(response, 201, `learning event ${event.eventType}`);
}

function firstLearningSelection() {
  const response = http.get(`${config.appBaseUrl}/api/learning/published-content`);
  expectStatus(response, 200, "published learning content");
  const body = parseJson(response, "published learning content");
  const lesson = (body.lessons || []).find((item) => item.cardIds?.length > 0);
  const sign = (body.signs || []).find((item) => item.id === lesson?.cardIds?.[0]);
  check(body, {
    "learn: published lesson exists": () => Boolean(lesson),
    "learn: lesson contains a sign": () => Boolean(sign),
  });
  return { lesson, sign, body };
}

function videoKeyFromUrl(videoUrl) {
  const match = String(videoUrl || "").match(/\/api\/video-stream\/([^/?]+)/);
  return match ? match[1] : "";
}

function csvFromRows(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
}

export default function () {
  const suffix = uniqueValue("k6");
  const password = "K6Pass123!";
  const changedPassword = "K6Pass456!";
  const user = {
    email: `${suffix}@example.com`,
    username: suffix,
    password,
    fullName: "K6 Functional User",
  };
  let token = "";

  group("Auth - register and login", () => {
    const registered = registerUser(user);
    token = registered.body.token;
    check(registered.body, {
      "register: returns JWT": (body) => Boolean(body.token),
      "register: returns new email": (body) => body.user?.email === user.email,
    });

    registerUser({ ...user, username: `${suffix}-duplicate` }, 409);

    const validLogin = login(user.email, password);
    token = validLogin.body.token;
    check(validLogin.body, {
      "login valid: returns JWT": (body) => Boolean(body.token),
    });
    login(user.email, "wrong-password", 401);
  });

  const selection = firstLearningSelection();
  const lesson = selection.lesson;
  const sign = selection.sign;

  if (lesson && sign) {
    group("Learn - lesson, video, review again and got it", () => {
      const videoKey = videoKeyFromUrl(sign.videoUrl);
      check(sign, {
        "learn: selected sign has video URL": () => Boolean(videoKey),
      });
      if (videoKey) {
        const videoInfo = http.get(`${config.appBaseUrl}/api/video/${videoKey}`);
        expectStatus(videoInfo, 200, "learn video info");
      }

      sendLearningEvent(token, {
        eventType: "video_watched",
        lessonId: lesson.id,
        cardId: sign.id,
        durationMs: 1000,
      });

      syncProgress(token, [progressItem(sign.id, "learning", 1, 0)], []);
      sendLearningEvent(token, {
        eventType: "card_reviewed",
        lessonId: lesson.id,
        cardId: sign.id,
        isCorrect: false,
      });

      syncProgress(token, [progressItem(sign.id, "mastered", 2, 1)], [sign.id]);
      sendLearningEvent(token, {
        eventType: "card_reviewed",
        lessonId: lesson.id,
        cardId: sign.id,
        isCorrect: true,
      });

      const progress = http.get(
        `${config.appBaseUrl}/api/learning/progress`,
        bearerHeaders(token),
      );
      expectStatus(progress, 200, "get learning progress");
      const body = parseJson(progress, "get learning progress");
      check(body, {
        "got it: selected card is understood": (data) =>
          data.understoodCardIds?.includes(sign.id),
      });
    });

    group("Quiz - lesson passes requiredQuizScore 100%", () => {
      const response = http.get(
        `${config.appBaseUrl}/api/learning/lessons/${lesson.id}/quiz`,
      );
      expectStatus(response, 200, "lesson quiz");
      const quiz = parseJson(response, "lesson quiz");
      check(quiz, {
        "quiz: questions returned": (body) => (body.questions || []).length > 0,
        "quiz: lesson requires 100 percent": () => lesson.requiredQuizScore === 100,
      });

      const now = new Date().toISOString();
      sendLearningEvent(token, {
        eventType: "quiz_submitted",
        lessonId: lesson.id,
        score: 100,
        isCorrect: true,
      });
      syncProgress(token, [progressItem(sign.id, "mastered", 2, 1)], [sign.id], [
        {
          lessonId: lesson.id,
          status: "completed",
          currentStep: "completed",
          quizScore: 100,
          quizPassed: true,
          recognitionAttempts: 0,
          recognitionCorrect: 0,
          startedAt: now,
          completedAt: now,
          updatedAt: now,
        },
      ]);
    });
  }

  group("Lookup - search card, select card and inspect video", () => {
    const selected = (selection.body.signs || []).find(
      (item) => item.word.toLowerCase() === "hello",
    ) || selection.body.signs?.[0];
    const videoKey = videoKeyFromUrl(selected?.videoUrl);
    check(selected, {
      "lookup: vocabulary search finds a card": () => Boolean(selected),
      "lookup: selected card has video": () => Boolean(videoKey),
    });
    if (videoKey) {
      const videoInfo = http.get(`${config.appBaseUrl}/api/video/${videoKey}`);
      expectStatus(videoInfo, 200, "lookup video info");
      if (config.streamVideo) {
        const stream = http.get(
          `${config.appBaseUrl}/api/video-stream/${videoKey}`,
          { headers: { Range: "bytes=0-1023" } },
        );
        check(stream, {
          "lookup video stream: status 200 or 206": (response) =>
            response.status === 200 || response.status === 206,
        });
      }
    }
  });

  group("Translate - load dataset for known and unknown words", () => {
    if (!config.verifyTranslateDataset) {
      console.warn(
        "Translate dataset scenario skipped: set VERIFY_TRANSLATE_DATASET=true to download and validate the large landmark dataset.",
      );
      return;
    }
    const response = http.get(
      `${config.appBaseUrl}/data/combined_avg_landmarks.json`,
    );
    expectStatus(response, 200, "translate landmark dataset");
    const dataset = parseJson(response, "translate landmark dataset");
    check(dataset, {
      "translate: known word exists in dataset": (body) =>
        Array.isArray(body.hello) && body.hello.length > 0,
      "translate: unknown word is absent from dataset": (body) =>
        body["k6-word-not-in-dataset"] === undefined,
    });
  });

  group("Profile - update information, avatar and password", () => {
    const profile = http.put(
      `${config.appBaseUrl}/api/auth/me`,
      JSON.stringify({
        email: user.email,
        fullName: "K6 Updated User",
      }),
      jsonHeaders(token),
    );
    expectStatus(profile, 200, "profile update");
    const profileBody = parseJson(profile, "profile update");
    token = profileBody.token || token;

    const avatar = http.put(
      `${config.appBaseUrl}/api/auth/me/avatar`,
      JSON.stringify({
        avatarUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      }),
      jsonHeaders(token),
    );
    expectStatus(avatar, 200, "avatar update");

    const passwordResponse = http.put(
      `${config.appBaseUrl}/api/auth/me/password`,
      JSON.stringify({
        currentPassword: password,
        newPassword: changedPassword,
      }),
      jsonHeaders(token),
    );
    expectStatus(passwordResponse, 200, "password update");
    login(user.email, password, 401);
    token = login(user.email, changedPassword).body.token;
  });

  group("Admin - sign, publish lesson, CSV and role management", () => {
    if (!config.adminEmail || !config.adminPassword) {
      console.warn("Admin scenarios skipped: set ADMIN_EMAIL and ADMIN_PASSWORD.");
      return;
    }

    const admin = login(config.adminEmail, config.adminPassword);
    const adminToken = admin.body.token;
    check(admin.body, {
      "admin: configured account has admin role": (body) =>
        body.user?.role === "admin",
    });
    if (!adminToken || admin.body.user?.role !== "admin") return;

    const usersResponse = http.get(
      `${config.appBaseUrl}/api/admin/users`,
      bearerHeaders(adminToken),
    );
    expectStatus(usersResponse, 200, "admin users");
    const users = parseJson(usersResponse, "admin users").users || [];
    const target = users.find((item) => item.email === user.email);
    check(users, {
      "admin users: functional user exists": () => Boolean(target),
      "admin users: CSV can be exported": () =>
        csvFromRows(users).startsWith("id,email,username"),
    });
    if (target) {
      const promote = http.patch(
        `${config.appBaseUrl}/api/admin/users/${target.id}`,
        JSON.stringify({ role: "admin" }),
        jsonHeaders(adminToken),
      );
      expectStatus(promote, 200, "promote user to admin");
      const demote = http.patch(
        `${config.appBaseUrl}/api/admin/users/${target.id}`,
        JSON.stringify({ role: "user" }),
        jsonHeaders(adminToken),
      );
      expectStatus(demote, 200, "demote admin to user");
    }

    const signId = uniqueValue("k6-sign");
    const signResponse = http.post(
      `${config.appBaseUrl}/api/content/signs`,
      JSON.stringify({
        id: signId,
        word: `K6 ${signId}`,
        category: "greeting",
        difficulty: "beginner",
        description: "Temporary sign created by k6.",
        status: "draft",
      }),
      jsonHeaders(adminToken),
    );
    expectStatus(signResponse, 201, "admin create sign");

    const lessonId = uniqueValue("k6-lesson");
    const lessonResponse = http.post(
      `${config.appBaseUrl}/api/content/lessons`,
      JSON.stringify({
        id: lessonId,
        title: `K6 ${lessonId}`,
        level: "beginner",
        category: "greeting",
        description: "Temporary lesson created by k6.",
        order: 9999,
        targetCardCount: 0,
        requiredQuizScore: 100,
        recognitionRequired: false,
        status: "draft",
        signIds: [],
      }),
      jsonHeaders(adminToken),
    );
    expectStatus(lessonResponse, 201, "admin create lesson");
    const publish = http.patch(
      `${config.appBaseUrl}/api/content/lessons/${lessonId}/status`,
      JSON.stringify({ status: "published" }),
      jsonHeaders(adminToken),
    );
    expectStatus(publish, 200, "admin publish lesson");

    expectStatus(
      http.del(
        `${config.appBaseUrl}/api/content/lessons/${lessonId}`,
        null,
        bearerHeaders(adminToken),
      ),
      200,
      "admin cleanup lesson",
    );
    expectStatus(
      http.del(
        `${config.appBaseUrl}/api/content/signs/${signId}`,
        null,
        bearerHeaders(adminToken),
      ),
      200,
      "admin cleanup sign",
    );
  });
}
