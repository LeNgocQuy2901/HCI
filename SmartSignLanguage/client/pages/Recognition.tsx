import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { useCamera } from "@/hooks/use-camera";
import { useHandDetection } from "@/hooks/use-hand-detection";
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
  landmarks: HandPoint[][];
  handedness: string[];
  confidence_scores?: number[];
}

interface HandDetectionOverlay {
  landmarks: HandPoint[][];
  handedness: string[];
  confidence: number[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Recognition() {
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

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RecognitionResult[]>([]);
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
      } catch (err) {
        setServerConnected(false);
        setServerError("Cannot connect to inference server");
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  const predictGesture = useCallback(
    async (
      detection: HandDetectionOverlay,
    ): Promise<InferencePrediction | null> => {
      if (!serverConnected || isProcessingRef.current) return null;

      isProcessingRef.current = true;

      try {
        const response = await fetch(`${API_BASE_URL}/api/predict-landmarks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            landmarks: detection.landmarks,
            handedness: detection.handedness,
            confidence: detection.confidence,
          }),
        });

        if (!response.ok) {
          throw new Error("Prediction failed");
        }

        const data = await response.json();
        return data.status === "success" ? data : null;
      } catch (err) {
        console.error("Prediction error:", err);
        return null;
      } finally {
        isProcessingRef.current = false;
      }
    },
    [serverConnected],
  );

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !handDetectionReady) {
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

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const detectionResults = detectHands(video) ?? latestDetectionRef.current;
    if (detectionResults && detectionResults.landmarks.length > 0) {
      latestDetectionRef.current = detectionResults;

      if (showBoundingBox) {
        drawBoundingBoxes(
          canvas,
          detectionResults.landmarks,
          detectionResults.handedness,
          {
            lineColor: "#00FF00",
            lineWidth: 2,
          },
        );
      }

      if (showLandmarks) {
        drawHandLandmarks(
          canvas,
          detectionResults.landmarks,
          detectionResults.handedness,
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
    setCurrentFrame(currentFrameRef.current);

    if (
      currentFrameRef.current % 15 === 0 &&
      detectionResults &&
      detectionResults.landmarks.length > 0
    ) {
      predictGesture({
        landmarks: detectionResults.landmarks,
        handedness: detectionResults.handedness,
        confidence: detectionResults.confidence,
      }).then((prediction) => {
        if (!prediction) return;

        latestDetectionRef.current = {
          landmarks: prediction.landmarks,
          handedness: prediction.handedness,
          confidence: prediction.confidence_scores ?? [],
        };

        const newResult: RecognitionResult = {
          timestamp: Date.now(),
          gesture: prediction.gesture,
          confidence: prediction.confidence,
          handedness: detectionResults?.handedness[0] || "Unknown",
        };

        setResults((prev) => [newResult, ...prev].slice(0, 50));
      });
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [
    canvasRef,
    detectHands,
    handDetectionReady,
    predictGesture,
    showBoundingBox,
    showLandmarks,
    videoRef,
  ]);

  useEffect(() => {
    if (!isRunning) return;

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isProcessingRef.current = false;
    };
  }, [isRunning, processFrame]);

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

  const handleStart = async () => {
    try {
      if (!isActive) {
        await startCamera();
      }

      startTimeRef.current = Date.now();
      setIsRunning(true);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    stopCamera();
    latestDetectionRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (canvasRef.current) {
      clearCanvas(canvasRef.current);
    }
  };

  const handleReset = () => {
    setResults([]);
    latestDetectionRef.current = null;
    currentFrameRef.current = 0;
    setCurrentFrame(0);
    setStats({
      totalRecognitions: 0,
      averageConfidence: 0,
      uniqueGestures: 0,
      sessionDuration: 0,
    });
  };

  const latestResult = results[0];

  if (handDetectionError) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4">
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-start gap-4 p-6">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Hand Detection Error
                </h3>
                <p className="text-red-800">{handDetectionError}</p>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Realtime Sign Recognition</h1>
          <p className="text-lg text-muted-foreground">
            Use your camera to recognize sign language with AI-powered landmark
            detection and server inference.
          </p>
        </div>

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
                      isRunning ? "default" : isActive ? "outline" : "secondary"
                    }
                    className={
                      isRunning
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-yellow-500 text-white"
                          : ""
                    }
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {isRunning ? "Recognizing" : isActive ? "Ready" : "Standby"}
                  </Badge>
                </div>

                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">Frame: {currentFrame}</Badge>
                </div>
              </div>
            </Card>

            <div className="flex flex-wrap gap-3">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={!serverConnected || !handDetectionReady}
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
                      Inference Server
                    </p>
                    <p className="text-yellow-800 text-sm">
                      {serverError}. Make sure the FastAPI server is running.
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
                    <span className="text-muted-foreground">Hand</span>
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
                  <span className="text-muted-foreground">Camera</span>
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-green-500" : ""}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hand Detection</span>
                  <Badge
                    variant={handDetectionReady ? "default" : "secondary"}
                    className={handDetectionReady ? "bg-green-500" : ""}
                  >
                    {handDetectionReady ? "Ready" : "Loading"}
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
                  <span className="text-muted-foreground">
                    Inference Server
                  </span>
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
                        {result.handedness} Hand
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
