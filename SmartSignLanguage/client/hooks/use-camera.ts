import { useEffect, useRef, useState } from "react";

export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

interface CameraHook {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  takeScreenshot: () => string | null;
}

export function useCamera(options: CameraOptions = {}): CameraHook {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { width = 640, height = 480, facingMode = "user" } = options;

  const startCamera = async () => {
    try {
      if (videoRef.current && streamRef.current && isActive) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode,
        },
        audio: false,
      });

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);

      await new Promise<void>((resolve) => {
        const video = videoRef.current;
        if (!video) {
          resolve();
          return;
        }

        let resolved = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const setupVideo = () => {
          if (resolved) return;
          resolved = true;

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          const currentVideo = videoRef.current;
          if (
            isMountedRef.current &&
            currentVideo &&
            currentVideo.isConnected &&
            currentVideo.srcObject &&
            canvasRef.current
          ) {
            canvasRef.current.width = currentVideo.videoWidth || width;
            canvasRef.current.height = currentVideo.videoHeight || height;
            currentVideo.play().catch((err) => {
              if (err instanceof DOMException && err.name === "AbortError") {
                return;
              }
              console.error("Video play error:", err);
            });
          }
          resolve();
        };

        video.onloadedmetadata = setupVideo;
        timeoutId = setTimeout(setupVideo, 1000);
      });

      setIsActive(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      setHasPermission(false);
      setIsActive(false);
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const takeScreenshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    try {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return null;

      canvasRef.current.width = videoRef.current.videoWidth || width;
      canvasRef.current.height = videoRef.current.videoHeight || height;

      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      return canvasRef.current.toDataURL("image/jpeg");
    } catch (err) {
      console.error("Screenshot error:", err);
      return null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isActive,
    hasPermission,
    error,
    startCamera,
    stopCamera,
    takeScreenshot,
  };
}
