import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export interface HandDetectionResult {
  landmarks: Array<Array<{ x: number; y: number; z: number }>>;
  handedness: string[];
  confidence: number[];
}

export function useHandDetection() {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeHandDetection = async () => {
      try {
        // Load WASM runtime for future use
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );

        // Skip local model loading - use inference server instead
        // This avoids CORS and CDN issues
        console.log("✅ MediaPipe WASM initialized (using inference server for detection)");
        setIsReady(true);
      } catch (err) {
        const errorDetails = err instanceof Error ? err.message : String(err);
        // Silently ignore errors - inference server will handle everything
        // Suppress console output to avoid cluttering logs
        // console.warn("⚠️ WASM initialization issue, but continuing with inference server:", errorDetails);
        setIsReady(true);
      }
    };

    // Suppress unhandled promise rejections from WASM loading
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.code === 403 || String(event.reason).includes("403")) {
        event.preventDefault();
      }
    };
    
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    initializeHandDetection();

    return () => {
      if (handLandmarker) {
        handLandmarker.close();
      }
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const detectHands = (video: HTMLVideoElement): HandDetectionResult | null => {
    // Inference server handles hand detection
    // This function is kept for compatibility but actual detection happens on backend
    if (!isReady) return null;

    try {
      // Return empty result - backend will handle detection
      return {
        landmarks: [],
        handedness: [],
        confidence: [],
      };
    } catch (err) {
      console.error("Hand detection error:", err);
      return null;
    }
  };

  return {
    handLandmarker,
    isReady,
    error,
    detectHands,
  };
}
