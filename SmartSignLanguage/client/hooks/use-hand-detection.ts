import { useCallback, useEffect, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export interface HandDetectionResult {
  landmarks: Array<Array<{ x: number; y: number; z: number }>>;
  handedness: string[];
  confidence: number[];
}

export function useHandDetection(enabled = true) {
  const [handLandmarker, setHandLandmarker] =
    useState<HandLandmarker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let landmarker: HandLandmarker | null = null;
    let cancelled = false;

    if (!enabled) {
      setHandLandmarker(null);
      setIsReady(false);
      setError(null);
      return;
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason);
      const isMediaPipeInternalObject =
        event.reason &&
        typeof event.reason === "object" &&
        !(event.reason instanceof Error);

      if (
        event.reason?.code === 403 ||
        reason.includes("403") ||
        isMediaPipeInternalObject
      ) {
        event.preventDefault();
      }
    };

    const initializeHandDetection = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        setHandLandmarker(landmarker);
        setError(null);
        setIsReady(true);
      } catch (err) {
        const errorDetails = err instanceof Error ? err.message : String(err);
        console.warn(
          "MediaPipe hand detection initialization failed:",
          errorDetails
        );
        setError(errorDetails);
        setIsReady(false);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    initializeHandDetection();

    return () => {
      cancelled = true;
      landmarker?.close();
      setHandLandmarker(null);
      setIsReady(false);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [enabled]);

  const detectHands = useCallback(
    (video: HTMLVideoElement): HandDetectionResult | null => {
      if (!isReady || !handLandmarker) return null;

      try {
        const results = handLandmarker.detectForVideo(video, performance.now());
        const handedness = (results.handednesses ?? []).map(
          (classification) => classification[0]?.displayName || "Unknown"
        );
        const confidence = (results.handednesses ?? []).map(
          (classification) => classification[0]?.score ?? 0
        );

        return {
          landmarks: (results.landmarks ?? []).map((hand) =>
            hand.map((point: NormalizedLandmark) => ({
              x: point.x,
              y: point.y,
              z: point.z,
            }))
          ),
          handedness,
          confidence,
        };
      } catch (err) {
        console.warn("MediaPipe detectForVideo failed:", err);
        return null;
      }
    },
    [handLandmarker, isReady]
  );

  return {
    handLandmarker,
    isReady,
    error,
    detectHands,
  };
}
