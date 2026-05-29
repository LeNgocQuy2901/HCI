import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { useCamera } from "@/hooks/use-camera";
import { useHandDetection } from "@/hooks/use-hand-detection";
import { useAuthStore } from "@/hooks/use-auth";
import { useLearningStore } from "@/hooks/use-learning-store";
import { vocabularyCards } from "@shared/vocabulary";
import { buildRecognitionSuggestion } from "@shared/sign-metadata";
import {
  clearCanvas,
  drawBoundingBoxes,
  drawHandLandmarks,
} from "@/lib/hand-visualization";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Camera,
  Clock,
  Eye,
  Image as ImageIcon,
  Play,
  RotateCcw,
  Square,
  TrendingUp,
  Zap,
} from "lucide-react";

interface RecognitionResult {
  timestamp: number;
  gesture: string;
  confidence: number;
  handedness: string;
}

interface Stats {
  totalRecognitions: number;
  averageConfidence: number;
  uniqueGestures: number;
  sessionDuration: number;
}

interface HandPoint {
  x: number;
  y: number;
  z: number;
}

interface InferencePrediction {
  status: string;
  gesture: string;
  confidence: number;
  raw_confidence?: number;
  confidence_temperature?: number;
  landmarks: HandPoint[][];
  handedness: string[];
  confidence_scores?: number[];
  bbox?: number[] | null;
  model?: string;
  training_metadata?: {
    frames_ready?: number;
    frames_per_video?: number;
  };
}

interface HandDetectionOverlay {
  landmarks: HandPoint[][];
  handedness: string[];
  confidence: number[];
}

type RecognitionMode = "words" | "alnum" | "numbers";
type RecognitionSource = "camera" | "upload";
type UploadedMediaType = "image" | "video";
type LessonPracticeState = {
  mode?: "lesson-practice";
  lessonId?: string;
  cardId?: string;
  expectedWord?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const PREDICTION_INTERVAL_MS = 120;
const MIN_ACCEPTED_CONFIDENCE = 0.45;
const ALNUM_MIN_ACCEPTED_CONFIDENCE = 0.55;
const NUMBER_MIN_ACCEPTED_CONFIDENCE = 0.25;
const LESSON_PRACTICE_CONFIDENCE = 0.75;
const PRACTICE_REQUIRED_CORRECT = 2;
const PRACTICE_MAX_ATTEMPTS = 3;
const STABILITY_WINDOW_SIZE = 5;
const STABILITY_MIN_VOTES = 2;
const DUPLICATE_RESULT_COOLDOWN_MS = 1200;
const LIVE_RESULT_TTL_MS = 2500;
const HAND_LOST_GRACE_MS = 3000;
const HAND_LOST_MISSES = 10;
const SERVER_SEQUENCE_RESET_COOLDOWN_MS = 1200;
const WORD_VIDEO_SAMPLE_COUNT = 240;
const VIDEO_LOAD_TIMEOUT_MS = 10000;
const VIDEO_SEEK_TIMEOUT_MS = 2500;

const RECOGNITION_MODES: Array<{
  value: RecognitionMode;
  label: string;
  description: string;
}> = [
  {
    value: "words",
    label: "Words",
    description: "10 words + full 46-class model",
  },
  {
    value: "alnum",
    label: "Alphabet",
    description: "Dedicated A-Z alphabet model",
  },
  {
    value: "numbers",
    label: "Numbers",
    description: "Dedicated 0-9 number model",
  },
];

async function resetServerSequence(mode: RecognitionMode) {
  try {
    await fetch(`${API_BASE_URL}/api/reset-sequence?mode=${mode}`, {
      method: "POST",
    });
  } catch (err) {
    console.warn("Could not reset inference sequence:", err);
  }
}

function videoToJpegBlob(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });
}

function getUsableVideoDuration(video: HTMLVideoElement) {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }

  if (video.seekable.length > 0) {
    const end = video.seekable.end(video.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }

  return 0;
}

function isVideoReadable(video: HTMLVideoElement) {
  return (
    video.readyState >= video.HAVE_METADATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

function getVideoLoadError(video: HTMLVideoElement) {
  if (!video.error) {
    return "Unable to load this video. Try another file.";
  }

  if (video.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return "This video codec is not supported by the browser. Try an H.264 MP4 or WebM file.";
  }

  return "Unable to decode this video. Try another MP4/WebM file.";
}

function waitForVideoMetadata(video: HTMLVideoElement): Promise<boolean> {
  if (isVideoReadable(video)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("canplay", handleLoaded);
      video.removeEventListener("error", handleError);
      if (timeoutId) clearTimeout(timeoutId);
    };
    const handleLoaded = () => {
      if (!isVideoReadable(video)) return;
      cleanup();
      resolve(true);
    };
    const handleError = () => {
      cleanup();
      resolve(false);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve(isVideoReadable(video));
    }, VIDEO_LOAD_TIMEOUT_MS);

    video.addEventListener("loadedmetadata", handleLoaded, { once: true });
    video.addEventListener("loadeddata", handleLoaded, { once: true });
    video.addEventListener("canplay", handleLoaded, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.load();
  });
}

function seekUploadedVideo(
  video: HTMLVideoElement,
  targetTime: number,
): Promise<boolean> {
  const duration = getUsableVideoDuration(video);
  const safeTime =
    duration > 0
      ? Math.min(Math.max(targetTime, 0), Math.max(duration - 0.02, 0))
      : 0;

  if (
    Math.abs(video.currentTime - safeTime) < 0.03 &&
    video.readyState >= video.HAVE_CURRENT_DATA
  ) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      if (timeoutId) clearTimeout(timeoutId);
    };
    const handleSeeked = () => {
      cleanup();
      resolve(video.readyState >= video.HAVE_CURRENT_DATA);
    };
    const handleError = () => {
      cleanup();
      resolve(false);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      resolve(video.readyState >= video.HAVE_CURRENT_DATA);
    }, VIDEO_SEEK_TIMEOUT_MS);

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.currentTime = safeTime;
  });
}

function drawVideoFrameToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
) {
  const context = canvas.getContext("2d");
  if (!context) return false;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return true;
}

function getVideoSampleTimes(duration: number, count: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return Array.from({ length: count }, () => 0);
  }

  if (count <= 1) return [duration / 2];

  const edgePadding = Math.min(0.08, duration * 0.05);
  const start = edgePadding;
  const end = Math.max(start, duration - edgePadding);

  return Array.from(
    { length: count },
    (_, index) => start + ((end - start) * index) / (count - 1),
  );
}

function normalizeGestureLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\bthankyou\b/i, "thank you");
}

function comparableGestureLabel(value: string) {
  return normalizeGestureLabel(value).toLowerCase().trim();
}

function formatDetectedHands(
  handedness: string[],
  landmarkCount = handedness.length,
) {
  if (landmarkCount >= 2) {
    const uniqueHands = Array.from(new Set(handedness.filter(Boolean)));
    return uniqueHands.length > 0 ? uniqueHands.join(" + ") : "Two hands";
  }

  return handedness[0] || "Unknown";
}

function mirrorOverlayLandmarks(
  detection: HandDetectionOverlay,
): HandDetectionOverlay {
  return {
    ...detection,
    landmarks: detection.landmarks.map((hand) =>
      hand.map((point) => ({
        ...point,
        x: 1 - point.x,
      })),
    ),
  };
}

function mostVotedGesture(
  predictions: RecognitionResult[],
): RecognitionResult | null {
  const votes = new Map<string, { count: number; best: RecognitionResult }>();

  predictions.forEach((prediction) => {
    const current = votes.get(prediction.gesture);
    if (!current) {
      votes.set(prediction.gesture, { count: 1, best: prediction });
      return;
    }

    votes.set(prediction.gesture, {
      count: current.count + 1,
      best:
        prediction.confidence > current.best.confidence
          ? prediction
          : current.best,
    });
  });

  let winner: { count: number; best: RecognitionResult } | null = null;
  votes.forEach((entry) => {
    if (!winner || entry.count > winner.count) {
      winner = entry;
    }
  });

  return winner && winner.count >= STABILITY_MIN_VOTES ? winner.best : null;
}

function calculateStability(predictions: RecognitionResult[], gesture: string) {
  if (predictions.length === 0) return 0;
  const comparableGesture = comparableGestureLabel(gesture);
  const matching = predictions.filter(
    (prediction) =>
      comparableGestureLabel(prediction.gesture) === comparableGesture,
  ).length;
  return Math.round((matching / predictions.length) * 100) / 100;
}

export default function Recognition() {
  const location = useLocation();
  const practiceState = (location.state || {}) as LessonPracticeState;
  const isLessonPractice =
    practiceState.mode === "lesson-practice" &&
    Boolean(
      practiceState.lessonId &&
      practiceState.cardId &&
      practiceState.expectedWord,
    );
  const { user } = useAuthStore();
  const userId = user?.id || "guest";
  const learningStore = useLearningStore();
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera } =
    useCamera({
      width: 640,
      height: 480,
    });
  const {
    isReady: handDetectionReady,
    error: handDetectionError,
    detectHands,
  } = useHandDetection();

  const animationFrameRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const isProcessingRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const latestDetectionRef = useRef<HandDetectionOverlay | null>(null);
  const lastHandSeenAtRef = useRef(0);
  const lastPredictionRequestedAtRef = useRef(0);
  const missedHandFramesRef = useRef(0);
  const predictionWindowRef = useRef<RecognitionResult[]>([]);
  const lastAcceptedRef = useRef<RecognitionResult | null>(null);
  const lastServerResetAtRef = useRef(0);
  const practiceSavedRef = useRef(false);
  const practiceStartedAtRef = useRef(Date.now());
  const uploadedVideoUrlRef = useRef<string | null>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const uploadedFileRef = useRef<File | null>(null);
  const uploadPredictionRunRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [recognitionSource, setRecognitionSource] =
    useState<RecognitionSource>("camera");
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(
    null,
  );
  const [uploadedMediaType, setUploadedMediaType] =
    useState<UploadedMediaType | null>(null);
  const [uploadedVideoError, setUploadedVideoError] = useState<string | null>(
    null,
  );
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [liveResult, setLiveResult] = useState<RecognitionResult | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [stats, setStats] = useState<Stats>({
    totalRecognitions: 0,
    averageConfidence: 0,
    uniqueGestures: 0,
    sessionDuration: 0,
  });
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [recognitionMode, setRecognitionMode] =
    useState<RecognitionMode>("words");
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [practiceAttempts, setPracticeAttempts] = useState<
    Array<{
      predictedWord: string;
      isCorrect: boolean;
      confidence: number;
      stabilityScore: number;
      suggestion: string;
    }>
  >([]);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          setServerConnected(true);
          setServerError(null);
          return;
        }

        setServerConnected(false);
        setServerError("Inference server returned an unhealthy status");
        setLiveResult(null);
        latestDetectionRef.current = null;
        missedHandFramesRef.current = 0;
      } catch (err) {
        setServerConnected(false);
        setServerError("Cannot connect to inference server");
        setLiveResult(null);
        latestDetectionRef.current = null;
        missedHandFramesRef.current = 0;
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedVideoUrlRef.current) {
        URL.revokeObjectURL(uploadedVideoUrlRef.current);
      }
    };
  }, []);

  const predictFrame = useCallback(
    async (video: HTMLVideoElement): Promise<InferencePrediction | null> => {
      if (!serverConnected || isProcessingRef.current) return null;

      isProcessingRef.current = true;

      try {
        const blob = await videoToJpegBlob(video);
        if (!blob) return null;

        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const response = await fetch(
          `${API_BASE_URL}/api/predict?mode=${recognitionMode}`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Prediction failed: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Prediction error:", err);
        return null;
      } finally {
        isProcessingRef.current = false;
      }
    },
    [recognitionMode, serverConnected],
  );

  const predictCanvasFrame = useCallback(
    async (
      canvas: HTMLCanvasElement,
      mode: RecognitionMode = recognitionMode,
    ): Promise<InferencePrediction | null> => {
      if (!serverConnected || isProcessingRef.current) return null;

      isProcessingRef.current = true;

      try {
        const blob = await canvasToJpegBlob(canvas);
        if (!blob) return null;

        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const response = await fetch(
          `${API_BASE_URL}/api/predict?mode=${mode}`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Prediction failed: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Image prediction error:", err);
        return null;
      } finally {
        isProcessingRef.current = false;
      }
    },
    [recognitionMode, serverConnected],
  );

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState < video.HAVE_CURRENT_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    if (recognitionSource === "camera") {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const clientDetection = detectHands(video);
    if (clientDetection && clientDetection.landmarks.length > 0) {
      latestDetectionRef.current = clientDetection;
      lastHandSeenAtRef.current = Date.now();
      missedHandFramesRef.current = 0;
    }

    const detectionResults =
      clientDetection && clientDetection.landmarks.length > 0
        ? clientDetection
        : latestDetectionRef.current &&
            Date.now() - lastHandSeenAtRef.current < HAND_LOST_GRACE_MS
          ? latestDetectionRef.current
          : null;

    if (detectionResults && detectionResults.landmarks.length > 0) {
      const displayDetection =
        recognitionSource === "camera"
          ? mirrorOverlayLandmarks(detectionResults)
          : detectionResults;

      if (showBoundingBox) {
        drawBoundingBoxes(
          canvas,
          displayDetection.landmarks,
          displayDetection.handedness,
          {
            lineColor: "#00FF00",
            lineWidth: 2,
          },
        );
      }

      if (showLandmarks) {
        drawHandLandmarks(
          canvas,
          displayDetection.landmarks,
          displayDetection.handedness,
          {
            lineColor: "#00FF00",
            pointColor: "#FF0000",
            lineWidth: 2,
            pointRadius: 4,
          },
        );
      }
    }

    currentFrameRef.current += 1;
    if (currentFrameRef.current % 10 === 0) {
      setCurrentFrame(currentFrameRef.current);
    }

    const now = Date.now();
    if (
      serverConnected &&
      now - lastPredictionRequestedAtRef.current >= PREDICTION_INTERVAL_MS
    ) {
      lastPredictionRequestedAtRef.current = now;
      predictFrame(video).then((prediction) => {
        if (!prediction) {
          missedHandFramesRef.current += 1;

          if (
            missedHandFramesRef.current >= HAND_LOST_MISSES &&
            Date.now() - lastHandSeenAtRef.current >= HAND_LOST_GRACE_MS
          ) {
            latestDetectionRef.current = null;
            setLiveResult(null);
            predictionWindowRef.current = [];
            const now = Date.now();
            if (
              now - lastServerResetAtRef.current >=
              SERVER_SEQUENCE_RESET_COOLDOWN_MS
            ) {
              lastServerResetAtRef.current = now;
              resetServerSequence(recognitionMode);
            }
          }
          return;
        }

        if (
          prediction.status === "warming_up" &&
          prediction.landmarks.length > 0
        ) {
          missedHandFramesRef.current = 0;
          lastHandSeenAtRef.current = Date.now();
          latestDetectionRef.current = {
            landmarks: prediction.landmarks,
            handedness: prediction.handedness,
            confidence: prediction.confidence_scores ?? [],
          };

          const framesReady = prediction.training_metadata?.frames_ready ?? 0;
          const framesRequired =
            prediction.training_metadata?.frames_per_video ?? 20;

          setLiveResult({
            timestamp: Date.now(),
            gesture: `Collecting frames ${framesReady}/${framesRequired}`,
            confidence: 0,
            handedness: formatDetectedHands(
              prediction.handedness,
              prediction.landmarks.length,
            ),
          });
          return;
        }

        if (prediction.status !== "success") {
          missedHandFramesRef.current += 1;

          if (
            missedHandFramesRef.current >= HAND_LOST_MISSES &&
            Date.now() - lastHandSeenAtRef.current >= HAND_LOST_GRACE_MS
          ) {
            latestDetectionRef.current = null;
            setLiveResult(null);
            predictionWindowRef.current = [];
            const now = Date.now();
            if (
              now - lastServerResetAtRef.current >=
              SERVER_SEQUENCE_RESET_COOLDOWN_MS
            ) {
              lastServerResetAtRef.current = now;
              resetServerSequence(recognitionMode);
            }
          }
          return;
        }

        missedHandFramesRef.current = 0;
        lastHandSeenAtRef.current = Date.now();
        latestDetectionRef.current = {
          landmarks: prediction.landmarks,
          handedness: prediction.handedness,
          confidence: prediction.confidence_scores ?? [],
        };

        const newResult: RecognitionResult = {
          timestamp: Date.now(),
          gesture: normalizeGestureLabel(prediction.gesture),
          confidence: prediction.confidence,
          handedness: formatDetectedHands(
            prediction.handedness,
            prediction.landmarks.length,
          ),
        };

        setLiveResult(newResult);

        const minAcceptedConfidence =
          recognitionMode === "numbers"
            ? NUMBER_MIN_ACCEPTED_CONFIDENCE
            : recognitionMode === "alnum"
              ? ALNUM_MIN_ACCEPTED_CONFIDENCE
              : MIN_ACCEPTED_CONFIDENCE;

        if (
          isLessonPractice &&
          practiceState.lessonId &&
          practiceState.cardId &&
          practiceState.expectedWord &&
          !practiceSavedRef.current
        ) {
          const expected = comparableGestureLabel(practiceState.expectedWord);
          const predicted = comparableGestureLabel(newResult.gesture);
          const stabilityScore = calculateStability(
            predictionWindowRef.current,
            newResult.gesture,
          );
          const passedThreshold =
            prediction.confidence >= LESSON_PRACTICE_CONFIDENCE &&
            stabilityScore >= 0.6;
          const isCorrect = expected === predicted && passedThreshold;

          if (isCorrect || prediction.confidence >= minAcceptedConfidence) {
            const targetCard = vocabularyCards.find(
              (card) => card.id === practiceState.cardId,
            );
            let issue: "confused" | "low-confidence" | "unstable" | "correct" =
              "correct";
            if (expected !== predicted) {
              issue = "confused";
            } else if (prediction.confidence < LESSON_PRACTICE_CONFIDENCE) {
              issue = "low-confidence";
            } else if (stabilityScore < 0.6) {
              issue = "unstable";
            }
            const suggestion = buildRecognitionSuggestion(
              targetCard,
              issue,
              newResult.gesture,
            );

            setPracticeFeedback(suggestion);

            const nextAttempts = [
              ...practiceAttempts,
              {
                predictedWord: newResult.gesture,
                isCorrect,
                confidence: prediction.confidence,
                stabilityScore,
                suggestion,
              },
            ].slice(-PRACTICE_MAX_ATTEMPTS);
            setPracticeAttempts(nextAttempts);

            const correctCount = nextAttempts.filter(
              (attempt) => attempt.isCorrect,
            ).length;
            const practicePassed = correctCount >= PRACTICE_REQUIRED_CORRECT;

            if (
              practicePassed ||
              nextAttempts.length >= PRACTICE_MAX_ATTEMPTS
            ) {
              practiceSavedRef.current = true;
            }

            void learningStore.saveRecognitionPracticeResult(userId, {
              lessonId: practiceState.lessonId,
              cardId: practiceState.cardId,
              expectedWord: practiceState.expectedWord,
              predictedWord: newResult.gesture,
              isCorrect: practicePassed,
              confidence: prediction.confidence,
              confusedWith: isCorrect ? undefined : newResult.gesture,
              suggestion,
              attemptCount: nextAttempts.length,
              durationMs: Date.now() - practiceStartedAtRef.current,
              stabilityScore,
              passedThreshold,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (prediction.confidence < minAcceptedConfidence) {
          predictionWindowRef.current = [];
          return;
        }

        predictionWindowRef.current = [
          ...predictionWindowRef.current,
          newResult,
        ].slice(-STABILITY_WINDOW_SIZE);

        const stableResult = mostVotedGesture(predictionWindowRef.current);
        if (!stableResult) return;

        const lastAccepted = lastAcceptedRef.current;
        const isDuplicate =
          lastAccepted?.gesture === stableResult.gesture &&
          stableResult.timestamp - lastAccepted.timestamp <
            DUPLICATE_RESULT_COOLDOWN_MS;

        if (isDuplicate) return;

        lastAcceptedRef.current = stableResult;
        setResults((prev) => [stableResult, ...prev].slice(0, 50));
      });
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [
    canvasRef,
    detectHands,
    isLessonPractice,
    learningStore,
    predictFrame,
    practiceState.cardId,
    practiceState.expectedWord,
    practiceState.lessonId,
    recognitionMode,
    recognitionSource,
    serverConnected,
    showBoundingBox,
    showLandmarks,
    videoRef,
    userId,
  ]);

  useEffect(() => {
    if (!isRunning) return;
    if (recognitionSource === "upload") {
      return;
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isProcessingRef.current = false;
    };
  }, [isRunning, processFrame, recognitionSource]);

  useEffect(() => {
    if (!liveResult) return;

    const timeout = setTimeout(() => {
      setLiveResult((current) =>
        current && Date.now() - current.timestamp >= LIVE_RESULT_TTL_MS
          ? null
          : current,
      );
    }, LIVE_RESULT_TTL_MS);

    return () => clearTimeout(timeout);
  }, [liveResult]);

  useEffect(() => {
    const updateStats = () => {
      const uniqueGestures = new Set(results.map((r) => r.gesture)).size;
      const averageConfidence =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
          : 0;

      setStats({
        totalRecognitions: results.length,
        averageConfidence,
        uniqueGestures,
        sessionDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      });
    };

    updateStats();

    if (!isRunning) return;
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [isRunning, results]);

  const prepareUploadedImage = async () => {
    const image = uploadedImageRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas) {
      setUploadedVideoError("Please choose an image file before starting.");
      return false;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setUploadedVideoError("Unable to prepare the uploaded image.");
      return false;
    }

    const width = image.naturalWidth || 640;
    const height = image.naturalHeight || 480;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  };

  const prepareUploadedVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !uploadedVideoUrlRef.current) {
      setUploadedVideoError("Please choose a video file before starting.");
      return false;
    }

    video.pause();
    video.muted = true;
    video.playsInline = true;

    const hasMetadata = await waitForVideoMetadata(video);
    if (!hasMetadata) {
      setUploadedVideoError(getVideoLoadError(video));
      return false;
    }

    const duration = getUsableVideoDuration(video);
    const isSeekReady = await seekUploadedVideo(
      video,
      duration > 0 ? Math.min(duration / 2, 0.25) : 0,
    );

    if (!isSeekReady || !drawVideoFrameToCanvas(video, canvas)) {
      setUploadedVideoError("Unable to read frames from this video.");
      return false;
    }

    return true;
  };

  const predictUploadedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxAttempts = 24;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (!uploadedImageRef.current) return;

      const prediction = await predictCanvasFrame(canvas);
      if (!prediction) {
        setLiveResult({
          timestamp: Date.now(),
          gesture: "No hand detected",
          confidence: 0,
          handedness: "Unknown",
        });
        continue;
      }

      if (prediction.landmarks.length > 0) {
        latestDetectionRef.current = {
          landmarks: prediction.landmarks,
          handedness: prediction.handedness,
          confidence: prediction.confidence_scores ?? [],
        };
        lastHandSeenAtRef.current = Date.now();
        missedHandFramesRef.current = 0;
      }

      if (prediction.status === "warming_up") {
        const framesReady =
          prediction.training_metadata?.frames_ready ?? attempt;
        const framesRequired =
          prediction.training_metadata?.frames_per_video ?? 20;

        setLiveResult({
          timestamp: Date.now(),
          gesture: `Collecting frames ${framesReady}/${framesRequired}`,
          confidence: 0,
          handedness: formatDetectedHands(
            prediction.handedness,
            prediction.landmarks.length,
          ),
        });
        continue;
      }

      if (prediction.status !== "success") {
        setLiveResult({
          timestamp: Date.now(),
          gesture: "No hand detected",
          confidence: 0,
          handedness: "Unknown",
        });
        continue;
      }

      const newResult: RecognitionResult = {
        timestamp: Date.now(),
        gesture: normalizeGestureLabel(prediction.gesture),
        confidence: prediction.confidence,
        handedness: formatDetectedHands(
          prediction.handedness,
          prediction.landmarks.length,
        ),
      };

      setLiveResult(newResult);

      const minAcceptedConfidence =
        recognitionMode === "numbers"
          ? NUMBER_MIN_ACCEPTED_CONFIDENCE
          : recognitionMode === "alnum"
            ? ALNUM_MIN_ACCEPTED_CONFIDENCE
            : MIN_ACCEPTED_CONFIDENCE;

      if (prediction.confidence >= minAcceptedConfidence) {
        lastAcceptedRef.current = newResult;
        setResults((prev) => [newResult, ...prev].slice(0, 50));
      }

      setIsRunning(false);
      return;
    }

    setIsRunning(false);
  };

  const predictUploadedVideo = async (runId: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setIsRunning(false);
      return;
    }

    const sampleTimes = getVideoSampleTimes(
      getUsableVideoDuration(video),
      WORD_VIDEO_SAMPLE_COUNT,
    );

    for (let index = 0; index < sampleTimes.length; index += 1) {
      if (uploadPredictionRunRef.current !== runId) return;

      const isSeekReady = await seekUploadedVideo(video, sampleTimes[index]);
      if (uploadPredictionRunRef.current !== runId) return;
      if (!isSeekReady || !drawVideoFrameToCanvas(video, canvas)) {
        continue;
      }

      currentFrameRef.current = index + 1;
      setCurrentFrame(index + 1);

      const prediction = await predictCanvasFrame(canvas, "words");
      if (uploadPredictionRunRef.current !== runId) return;

      if (!prediction) {
        setLiveResult({
          timestamp: Date.now(),
          gesture: `Sampling video frame ${index + 1}/${sampleTimes.length}`,
          confidence: 0,
          handedness: "Unknown",
        });
        continue;
      }

      if (prediction.landmarks.length > 0) {
        latestDetectionRef.current = {
          landmarks: prediction.landmarks,
          handedness: prediction.handedness,
          confidence: prediction.confidence_scores ?? [],
        };
        lastHandSeenAtRef.current = Date.now();
        missedHandFramesRef.current = 0;
      }

      if (prediction.status === "warming_up") {
        const framesReady =
          prediction.training_metadata?.frames_ready ?? index + 1;
        const framesRequired =
          prediction.training_metadata?.frames_per_video ?? 20;

        setLiveResult({
          timestamp: Date.now(),
          gesture: `Collecting frames ${framesReady}/${framesRequired}`,
          confidence: 0,
          handedness: formatDetectedHands(
            prediction.handedness,
            prediction.landmarks.length,
          ),
        });
        continue;
      }

      if (prediction.status !== "success") {
        setLiveResult({
          timestamp: Date.now(),
          gesture:
            prediction.status === "no_hand"
              ? `No hand in frame ${index + 1}/${sampleTimes.length}`
              : "Unable to recognize this frame",
          confidence: 0,
          handedness: "Unknown",
        });
        continue;
      }

      const newResult: RecognitionResult = {
        timestamp: Date.now(),
        gesture: normalizeGestureLabel(prediction.gesture),
        confidence: prediction.confidence,
        handedness: formatDetectedHands(
          prediction.handedness,
          prediction.landmarks.length,
        ),
      };

      setLiveResult(newResult);

      if (prediction.confidence >= MIN_ACCEPTED_CONFIDENCE) {
        lastAcceptedRef.current = newResult;
        setResults((prev) => [newResult, ...prev].slice(0, 50));
      }

      setIsRunning(false);
      return;
    }

    if (uploadPredictionRunRef.current === runId) {
      setLiveResult({
        timestamp: Date.now(),
        gesture: "Not enough hand frames detected",
        confidence: 0,
        handedness: "Unknown",
      });
      setUploadedVideoError(
        "The video did not provide enough detectable hand frames for Words recognition.",
      );
      setIsRunning(false);
    }
  };

  const predictUploadedVideoFile = async (runId: number) => {
    const file = uploadedFileRef.current;
    if (!file) {
      setUploadedVideoError("Please choose a video file before starting.");
      setIsRunning(false);
      return;
    }

    try {
      setLiveResult({
        timestamp: Date.now(),
        gesture: "Uploading video for Words recognition",
        confidence: 0,
        handedness: "Unknown",
      });

      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch(
        `${API_BASE_URL}/api/predict-video?mode=words&sample_count=${WORD_VIDEO_SAMPLE_COUNT}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (uploadPredictionRunRef.current !== runId) return;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Video prediction failed");
      }

      const prediction = (await response.json()) as InferencePrediction & {
        frames_processed?: number;
        frames_with_hands?: number;
      };

      if (prediction.landmarks.length > 0) {
        latestDetectionRef.current = {
          landmarks: prediction.landmarks,
          handedness: prediction.handedness,
          confidence: prediction.confidence_scores ?? [],
        };
        lastHandSeenAtRef.current = Date.now();
        missedHandFramesRef.current = 0;
      }

      const framesReady =
        prediction.training_metadata?.frames_ready ??
        prediction.frames_with_hands ??
        prediction.frames_processed ??
        0;
      const framesRequired =
        prediction.training_metadata?.frames_per_video ?? 20;
      currentFrameRef.current = framesReady;
      setCurrentFrame(framesReady);

      if (prediction.status === "success") {
        const newResult: RecognitionResult = {
          timestamp: Date.now(),
          gesture: normalizeGestureLabel(prediction.gesture),
          confidence: prediction.confidence,
          handedness: formatDetectedHands(
            prediction.handedness,
            prediction.landmarks.length,
          ),
        };

        setLiveResult(newResult);
        if (prediction.confidence >= MIN_ACCEPTED_CONFIDENCE) {
          lastAcceptedRef.current = newResult;
          setResults((prev) => [newResult, ...prev].slice(0, 50));
        }
        setUploadedVideoError(null);
        return;
      }

      setLiveResult({
        timestamp: Date.now(),
        gesture:
          prediction.status === "warming_up"
            ? `Collecting frames ${framesReady}/${framesRequired}`
            : prediction.gesture || "Unable to recognize this video",
        confidence: 0,
        handedness: formatDetectedHands(
          prediction.handedness,
          prediction.landmarks.length,
        ),
      });
      setUploadedVideoError(
        prediction.status === "error"
          ? prediction.gesture
          : `The video provided ${framesReady}/${framesRequired} detectable hand frames for Words recognition.`,
      );
    } catch (err) {
      console.error("Video upload prediction error:", err);
      setUploadedVideoError(
        "Unable to recognize this video. Restart the FastAPI server so /api/predict-video is available.",
      );
      setLiveResult(null);
    } finally {
      if (uploadPredictionRunRef.current === runId) {
        setIsRunning(false);
      }
    }
  };

  const handleMediaUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setUploadedVideoError("Please select a valid image or video file.");
      event.target.value = "";
      return;
    }

    uploadPredictionRunRef.current += 1;

    if (uploadedVideoUrlRef.current) {
      URL.revokeObjectURL(uploadedVideoUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    uploadedVideoUrlRef.current = nextUrl;
    uploadedFileRef.current = file;
    setUploadedVideoName(file.name);
    setUploadedMediaType(isVideo ? "video" : "image");
    setUploadedVideoError(null);
    setRecognitionSource("upload");
    const nextMode = isVideo
      ? "words"
      : recognitionMode === "words"
        ? "alnum"
        : recognitionMode;
    if (recognitionMode !== nextMode) {
      setRecognitionMode(nextMode);
    }
    setIsRunning(false);
    stopCamera();
    resetServerSequence(nextMode);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.removeAttribute("src");
      if (isVideo) {
        video.src = nextUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
      }
      video.load();
    }

    uploadedImageRef.current = null;

    if (isImage) {
      const image = new Image();
      image.onload = () => {
        uploadedImageRef.current = image;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        canvas.width = image.naturalWidth || 640;
        canvas.height = image.naturalHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.onerror = () => {
        setUploadedVideoError("Unable to load this image. Try another file.");
        URL.revokeObjectURL(nextUrl);
        if (uploadedVideoUrlRef.current === nextUrl) {
          uploadedVideoUrlRef.current = null;
        }
        uploadedImageRef.current = null;
        setUploadedVideoName(null);
      };
      image.src = nextUrl;
    }

    if (isVideo && video) {
      void waitForVideoMetadata(video).then(async (hasMetadata) => {
        if (!hasMetadata || uploadedVideoUrlRef.current !== nextUrl) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const duration = getUsableVideoDuration(video);
        const isSeekReady = await seekUploadedVideo(
          video,
          duration > 0 ? Math.min(duration / 2, 0.25) : 0,
        );

        if (isSeekReady && uploadedVideoUrlRef.current === nextUrl) {
          drawVideoFrameToCanvas(video, canvas);
        }
      });
    }

    latestDetectionRef.current = null;
    setLiveResult(null);
    predictionWindowRef.current = [];
    currentFrameRef.current = 0;
    setCurrentFrame(0);
    if (canvasRef.current) {
      clearCanvas(canvasRef.current);
    }
  };

  const handleSourceChange = (source: RecognitionSource) => {
    if (source === recognitionSource) return;

    setIsRunning(false);
    resetServerSequence(recognitionMode);
    latestDetectionRef.current = null;
    setLiveResult(null);
    predictionWindowRef.current = [];
    currentFrameRef.current = 0;
    setCurrentFrame(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const video = videoRef.current;
    if (source === "camera") {
      stopCamera();
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    } else {
      stopCamera();
      if (video && uploadedVideoUrlRef.current) {
        video.pause();
        video.srcObject = null;
        video.src = uploadedVideoUrlRef.current;
        video.load();
      }
    }

    setRecognitionSource(source);
  };

  const handleStart = async () => {
    try {
      if (recognitionSource === "camera" && !isActive) {
        await startCamera();
      }

      if (recognitionSource === "upload") {
        if (uploadedMediaType === "video" && recognitionMode !== "words") {
          setUploadedVideoError(
            "Video upload is available in Words mode only.",
          );
          return;
        }

        if (uploadedMediaType === "image" && recognitionMode === "words") {
          setUploadedVideoError(
            "Words mode requires a video upload. Choose an MP4/WebM file.",
          );
          return;
        }

        if (uploadedMediaType === "image") {
          const isMediaReady = await prepareUploadedImage();
          if (!isMediaReady) return;
        }
      }

      await resetServerSequence(recognitionMode);
      const uploadRunId =
        recognitionSource === "upload" ? uploadPredictionRunRef.current + 1 : 0;
      if (recognitionSource === "upload") {
        uploadPredictionRunRef.current = uploadRunId;
      }
      startTimeRef.current = Date.now();
      practiceStartedAtRef.current = Date.now();
      setIsRunning(true);

      if (recognitionSource === "upload") {
        if (uploadedMediaType === "video") {
          void predictUploadedVideoFile(uploadRunId);
        } else {
          void predictUploadedImage();
        }
      }
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    uploadPredictionRunRef.current += 1;
    setIsRunning(false);
    resetServerSequence(recognitionMode);
    if (recognitionSource === "camera") {
      stopCamera();
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
    latestDetectionRef.current = null;
    lastHandSeenAtRef.current = 0;
    lastPredictionRequestedAtRef.current = 0;
    missedHandFramesRef.current = 0;
    setLiveResult(null);
    predictionWindowRef.current = [];
    lastAcceptedRef.current = null;
    lastServerResetAtRef.current = Date.now();
    practiceSavedRef.current = false;
    practiceStartedAtRef.current = Date.now();
    setPracticeFeedback(null);
    setPracticeAttempts([]);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (canvasRef.current) {
      clearCanvas(canvasRef.current);
    }
  };

  const handleReset = () => {
    uploadPredictionRunRef.current += 1;
    resetServerSequence(recognitionMode);
    setResults([]);
    latestDetectionRef.current = null;
    lastHandSeenAtRef.current = 0;
    lastPredictionRequestedAtRef.current = 0;
    missedHandFramesRef.current = 0;
    setLiveResult(null);
    predictionWindowRef.current = [];
    lastAcceptedRef.current = null;
    lastServerResetAtRef.current = Date.now();
    practiceSavedRef.current = false;
    practiceStartedAtRef.current = Date.now();
    setPracticeFeedback(null);
    setPracticeAttempts([]);
    currentFrameRef.current = 0;
    setCurrentFrame(0);
    if (recognitionSource === "upload" && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setStats({
      totalRecognitions: 0,
      averageConfidence: 0,
      uniqueGestures: 0,
      sessionDuration: 0,
    });
  };

  const handleModeChange = (mode: RecognitionMode) => {
    if (mode === recognitionMode) return;
    if (
      recognitionSource === "upload" &&
      mode === "words" &&
      uploadedMediaType === "image"
    ) {
      setUploadedVideoError(
        "Words mode requires a video upload. Choose an MP4/WebM file.",
      );
      return;
    }
    if (
      recognitionSource === "upload" &&
      mode !== "words" &&
      uploadedMediaType === "video"
    ) {
      setUploadedVideoError(
        "Alphabet and Numbers upload uses an image. Choose a JPG/PNG file.",
      );
      return;
    }
    uploadPredictionRunRef.current += 1;
    setRecognitionMode(mode);
    setUploadedVideoError(null);
    resetServerSequence(mode);
    setResults([]);
    latestDetectionRef.current = null;
    lastHandSeenAtRef.current = 0;
    lastPredictionRequestedAtRef.current = 0;
    missedHandFramesRef.current = 0;
    setLiveResult(null);
    predictionWindowRef.current = [];
    lastAcceptedRef.current = null;
    lastServerResetAtRef.current = Date.now();
    practiceSavedRef.current = false;
    practiceStartedAtRef.current = Date.now();
    setPracticeFeedback(null);
    setPracticeAttempts([]);
    currentFrameRef.current = 0;
    setCurrentFrame(0);
  };

  const latestResult =
    liveResult && Date.now() - liveResult.timestamp < LIVE_RESULT_TTL_MS
      ? liveResult
      : null;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Realtime Sign Recognition</h1>
          <p className="text-lg text-muted-foreground">
            Recognize signs from your camera or upload an image/video for
            recognition.
          </p>
        </div>

        {isLessonPractice && practiceState.expectedWord && (
          <Card className="mb-6 p-5 border-primary/30 bg-primary/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  Practice Lesson Sign
                </Badge>
                <h2 className="text-2xl font-bold">
                  Target sign: {practiceState.expectedWord}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Result is saved when the AI detects the target with at least{" "}
                  {Math.round(LESSON_PRACTICE_CONFIDENCE * 100)}% confidence.
                </p>
                {practiceFeedback && (
                  <p className="mt-3 text-sm font-medium">{practiceFeedback}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">
                    Attempts: {practiceAttempts.length}/{PRACTICE_MAX_ATTEMPTS}
                  </Badge>
                  <Badge variant="secondary">
                    Correct:{" "}
                    {
                      practiceAttempts.filter((attempt) => attempt.isCorrect)
                        .length
                    }
                    /{PRACTICE_REQUIRED_CORRECT}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to="/learn">Watch Demo Again</Link>
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Retry
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (practiceState.lessonId) {
                      learningStore.recordLessonRecognition(
                        practiceState.lessonId,
                        userId,
                        false,
                      );
                      setPracticeFeedback(
                        "Marked for review. This sign will stay in your practice queue.",
                      );
                    }
                  }}
                >
                  Mark for Review
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
          <section className="space-y-4">
            <Card className="overflow-hidden bg-black">
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[560px]"
                  style={{ aspectRatio: "640/480" }}
                />

                <div className="absolute top-4 left-4">
                  <Badge
                    variant={
                      isRunning
                        ? "default"
                        : isActive || uploadedVideoName
                          ? "outline"
                          : "secondary"
                    }
                    className={
                      isRunning
                        ? "bg-green-500 text-white"
                        : isActive || uploadedVideoName
                          ? "bg-yellow-500 text-white"
                          : ""
                    }
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {isRunning
                      ? "Recognizing"
                      : isActive || uploadedVideoName
                        ? "Ready"
                        : "Standby"}
                  </Badge>
                </div>

                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">Frame: {currentFrame}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={
                    recognitionSource === "camera" ? "default" : "outline"
                  }
                  onClick={() => handleSourceChange("camera")}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </Button>
                <Button
                  type="button"
                  variant={
                    recognitionSource === "upload" ? "default" : "outline"
                  }
                  onClick={() => {
                    if (recognitionSource !== "upload") {
                      handleSourceChange("upload");
                    }
                    fileInputRef.current?.click();
                  }}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Upload file
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaUpload}
              />

              {recognitionSource === "upload" && (
                <div className="mb-4 rounded-md border border-dashed p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {uploadedVideoName ||
                        (recognitionMode === "words"
                          ? "No video selected"
                          : "No image selected")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use a video for Words, or a JPG/PNG image for Alphabet and
                      Numbers.
                    </p>
                    {uploadedVideoError && (
                      <p className="mt-1 text-sm text-red-600">
                        {uploadedVideoError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {RECOGNITION_MODES.map((mode) => {
                  const isSelected = recognitionMode === mode.value;
                  return (
                    <Button
                      key={mode.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleModeChange(mode.value)}
                      className="flex-1 min-w-[180px]"
                    >
                      {mode.label}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {
                  RECOGNITION_MODES.find(
                    (mode) => mode.value === recognitionMode,
                  )?.description
                }
              </p>
            </Card>

            <div className="flex flex-wrap gap-3">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={
                    !serverConnected ||
                    (recognitionSource === "upload" && !uploadedVideoName)
                  }
                  className="gap-2"
                  size="lg"
                >
                  <Play className="h-4 w-4" />
                  Start Recognition
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="gap-2"
                  size="lg"
                >
                  <Square className="h-4 w-4" />
                  Stop Recognition
                </Button>
              )}

              <Button
                onClick={handleReset}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Session
              </Button>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-start gap-3 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900 text-sm">
                      Camera Error
                    </p>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {!serverConnected && serverError && (
              <Card className="border-yellow-200 bg-yellow-50">
                <div className="flex items-start gap-3 p-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900 text-sm">
                      WLASL Recognition Server
                    </p>
                    <p className="text-yellow-800 text-sm">
                      {serverError}. Make sure the FastAPI server is running.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {handDetectionError && (
              <Card className="border-yellow-200 bg-yellow-50">
                <div className="flex items-start gap-3 p-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900 text-sm">
                      Hand Overlay
                    </p>
                    <p className="text-yellow-800 text-sm">
                      Client-side hand overlay is unavailable, so landmarks may
                      update less smoothly from server responses.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </section>

          <aside className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Latest Result</h2>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>

              {latestResult ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Gesture</p>
                    <p className="text-4xl font-bold tracking-tight">
                      {latestResult.gesture}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-semibold">
                        {(latestResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${latestResult.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hands</span>
                    <Badge variant="outline">{latestResult.handedness}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(latestResult.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Camera className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No result yet. Start recognition and show your hand.</p>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3">Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge
                    variant={
                      isActive || uploadedVideoName ? "default" : "secondary"
                    }
                    className={
                      isActive || uploadedVideoName ? "bg-green-500" : ""
                    }
                  >
                    {recognitionSource === "camera"
                      ? isActive
                        ? "Camera"
                        : "Camera idle"
                      : uploadedVideoName
                        ? "Uploaded image"
                        : "No file"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hand Overlay</span>
                  <Badge
                    variant={handDetectionReady ? "default" : "secondary"}
                    className={handDetectionReady ? "bg-green-500" : ""}
                  >
                    {handDetectionReady ? "Client-side" : "Loading"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Landmark Model</span>
                  <Badge
                    variant={serverConnected ? "default" : "secondary"}
                    className={serverConnected ? "bg-green-500" : ""}
                  >
                    Server-side
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <Badge variant="outline">
                    {
                      RECOGNITION_MODES.find(
                        (mode) => mode.value === recognitionMode,
                      )?.label
                    }
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recognition</span>
                  <Badge
                    variant={isRunning ? "default" : "secondary"}
                    className={isRunning ? "bg-green-500" : ""}
                  >
                    {isRunning ? "Active" : "Idle"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WLASL Server</span>
                  <Badge
                    variant={serverConnected ? "default" : "secondary"}
                    className={
                      serverConnected ? "bg-green-500" : "bg-orange-500"
                    }
                  >
                    {serverConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3">Display Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBoundingBox}
                    onChange={(e) => setShowBoundingBox(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">
                    Show Bounding Boxes
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLandmarks}
                    onChange={(e) => setShowLandmarks(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Show Landmarks</span>
                </label>
              </div>
            </Card>
          </aside>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 mt-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Recognition History</h2>
            {results.length === 0 ? (
              <p className="text-muted-foreground">
                Recognition results will appear here during the session.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={`${result.timestamp}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{result.gesture}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.handedness}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {(result.confidence * 100).toFixed(1)}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Session Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Recognitions
                </p>
                <p className="text-3xl font-bold">{stats.totalRecognitions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Average Confidence
                </p>
                <p className="text-3xl font-bold">
                  {(stats.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Gestures</p>
                <p className="text-3xl font-bold">{stats.uniqueGestures}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Session Duration
                </p>
                <p className="text-3xl font-bold">
                  {Math.floor(stats.sessionDuration / 60)}m{" "}
                  {stats.sessionDuration % 60}s
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Results update automatically while recognition is running.
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
