import encoding from "k6/encoding";
import http from "k6/http";
import { check, group } from "k6";
import { config } from "../config.js";
import { expectStatus, parseJson } from "../lib/http.js";

const onePixelPng = encoding.b64decode(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "std",
);
const numberVideo = open("../../../public/videos/Numbers/zero.mp4", "b");

export const options = {
  scenarios: {
    recognition_api: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "3m",
    },
  },
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
  },
};

function testCameraFrame(mode) {
  const reset = http.post(`${config.aiBaseUrl}/api/reset-sequence?mode=${mode}`);
  expectStatus(reset, 200, `recognition ${mode}: reset`);
  const response = http.post(
    `${config.aiBaseUrl}/api/predict?mode=${mode}`,
    { file: http.file(onePixelPng, "camera-frame.png", "image/png") },
  );
  expectStatus(response, 200, `recognition ${mode}: camera frame`);
  const body = parseJson(response, `recognition ${mode}: camera frame`);
  check(body, {
    [`recognition ${mode}: returns inference status`]: (result) =>
      typeof result.status === "string",
  });
}

export default function () {
  group("Recognition - service health", () => {
    const response = http.get(`${config.aiBaseUrl}/health`);
    expectStatus(response, 200, "recognition health");
    const body = parseJson(response, "recognition health");
    check(body, {
      "recognition health: models loaded": (result) => result.model_loaded === true,
      "recognition health: words available": (result) =>
        result.available_modes?.includes("words"),
      "recognition health: alphabet available": (result) =>
        result.available_modes?.includes("alnum"),
      "recognition health: numbers available": (result) =>
        result.available_modes?.includes("numbers"),
    });
  });

  group("Recognition - simulated camera frames", () => {
    testCameraFrame("words");
    testCameraFrame("alnum");
    testCameraFrame("numbers");
  });

  group("Recognition - upload image", () => {
    const response = http.post(
      `${config.aiBaseUrl}/api/predict?mode=alnum`,
      { file: http.file(onePixelPng, "upload.png", "image/png") },
    );
    expectStatus(response, 200, "recognition image upload");
    check(parseJson(response, "recognition image upload"), {
      "recognition image upload: returns inference status": (body) =>
        typeof body.status === "string",
    });
  });

  group("Recognition - upload video", () => {
    const response = http.post(
      `${config.aiBaseUrl}/api/predict-video?mode=numbers`,
      { file: http.file(numberVideo, "zero.mp4", "video/mp4") },
      { timeout: "120s" },
    );
    expectStatus(response, 200, "recognition video upload");
    check(parseJson(response, "recognition video upload"), {
      "recognition video upload: returns inference status": (body) =>
        typeof body.status === "string",
    });
  });
}
