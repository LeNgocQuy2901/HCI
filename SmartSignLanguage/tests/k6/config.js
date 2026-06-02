const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const config = {
  appBaseUrl: trimTrailingSlash(__ENV.APP_BASE_URL || "http://localhost:8080"),
  aiBaseUrl: trimTrailingSlash(__ENV.AI_BASE_URL || "http://localhost:8000"),
  adminEmail: __ENV.ADMIN_EMAIL || "",
  adminPassword: __ENV.ADMIN_PASSWORD || "",
  streamVideo: (__ENV.STREAM_VIDEO || "false").toLowerCase() === "true",
  verifyTranslateDataset:
    (__ENV.VERIFY_TRANSLATE_DATASET || "false").toLowerCase() === "true",
};

export function uniqueValue(prefix) {
  return `${prefix}-${Date.now()}-${__VU}-${__ITER}`;
}
