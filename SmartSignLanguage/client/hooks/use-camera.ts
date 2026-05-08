import { useRef, useState } from "react";

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

export function useCamera(): CameraHook {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      console.log("🎥 Requesting camera access...");
      
      if (videoRef.current && streamRef.current && isActive) {
        console.log("📹 Camera already active");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      console.log("✅ Camera stream obtained:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setError(null);

        console.log("📺 Video element setup...");

        // Wait for video to load and set canvas size
        await new Promise<void>((resolve) => {
          const onLoadedMetadata = () => {
            console.log("✅ Video metadata loaded");
            if (videoRef.current && canvasRef.current) {
              const width = videoRef.current.videoWidth;
              const height = videoRef.current.videoHeight;
              console.log(`🎬 Setting canvas size: ${width}x${height}`);
              canvasRef.current.width = width;
              canvasRef.current.height = height;
              videoRef.current.play().then(() => {
                console.log("▶️ Video playing");
              }).catch(err => console.error("❌ Play error:", err));
              resolve();
            }
          };
          
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = onLoadedMetadata;
            // Timeout fallback
            setTimeout(() => {
              console.log("⏱️ Metadata timeout - forcing play");
              if (videoRef.current) {
                videoRef.current.play().then(() => {
                  console.log("▶️ Video playing (timeout)");
                }).catch(err => console.error("❌ Play error (timeout):", err));
              }
              resolve();
            }, 1000);
          }
        });

        setIsActive(true);
        console.log("✅ Camera ready!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      console.error("❌ Camera error:", errorMessage, err);
      setError(errorMessage);
      setHasPermission(false);
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

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0);
      return canvasRef.current.toDataURL("image/jpeg");
    } catch (err) {
      console.error("Screenshot error:", err);
      return null;
    }
  };

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
