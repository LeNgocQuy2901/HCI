import Layout from "@/components/Layout";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, Camera, RotateCcw } from "lucide-react";


interface RecognitionResult {
  gesture: string;
  confidence: number;
  timestamp: string;
}

interface Statistics {
  totalRecognitions: number;
  averageConfidence: number;
  uniqueGestures: number;
  duration: number;
}

type RecognitionMode = "letter" | "gesture";

const API_BASE_URL = "http://localhost:8000";

export default function Recognition() {
  const { videoRef, canvasRef, isActive, startCamera, stopCamera } = useCamera();
  const frameCountRef = useRef(0);
  const lastPredictTimeRef = useRef(0);
  const PREDICT_INTERVAL_MS = 1500; // gửi API mỗi 1.5 giây, tránh đơ camera
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>("letter");
  const [letterSequence, setLetterSequence] = useState("");
  const [statistics, setStatistics] = useState<Statistics>({
    totalRecognitions: 0,
    averageConfidence: 0,
    uniqueGestures: 0,
    duration: 0,
  });
  const [serverConnected, setServerConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const lastAcceptedRef = useRef<string>("");

  // Check server health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          setServerConnected(true);
          const data = await response.json();
          const aslReady = data.asl_model_loaded;
          setStatusMessage(aslReady ? "✅ ASL Model Ready" : "⚠️ WLASL Only");
        }
      } catch (err) {
        setServerConnected(false);
        setStatusMessage("❌ Server Offline");
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Canvas to base64
  const canvasToBase64 = (canvas: HTMLCanvasElement): string => {
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1] || "";
  };

  // Start animation loop when recognizing
  useEffect(() => {
    if (!isRecognizing || !videoRef.current || !canvasRef.current) return;

    // Vòng lặp vẽ canvas — chạy mượt 60fps, KHÔNG async
    const drawLoop = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      }
      if (isRecognizing) {
        animationFrameRef.current = requestAnimationFrame(drawLoop);
      }
    };
    animationFrameRef.current = requestAnimationFrame(drawLoop);

    // Vòng lặp predict — chạy riêng bằng setInterval, không block canvas
    const predictLoop = async () => {
      if (!isProcessingRef.current && serverConnected && canvasRef.current) {
        const now = Date.now();
        if (now - lastPredictTimeRef.current < PREDICT_INTERVAL_MS) return;
        lastPredictTimeRef.current = now;

        isProcessingRef.current = true;
        try {
          const base64Image = canvasToBase64(canvasRef.current);
          const endpoint = recognitionMode === "letter" ? "/api/recognize-asl" : "/api/predict-base64";

          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: `data:image/jpeg;base64,${base64Image}` }),
          });

          if (response.ok) {
            const prediction = await response.json();
            console.log("🔍 Prediction:", prediction); // thêm dòng này

            if (prediction.status === "success") {
              const letter = prediction.gesture || "unknown";
              const confidence = prediction.confidence || 0;

              const minConfidence = recognitionMode === "letter" ? 0.15 : 0.15;
              if (confidence >= minConfidence) {
                if (recognitionMode === "letter") {
                  if (letter !== "nothing" && letter !== "unknown") {
                    if (letter === "del") {
                      setLetterSequence((prev) => prev.slice(0, -1));
                    } else if (letter === "space") {
                      setLetterSequence((prev) => prev + " ");
                    } else if (lastAcceptedRef.current !== letter) {
                      lastAcceptedRef.current = letter;
                      setLetterSequence((prev) => prev + letter);
                    }
                  }
                }

                const newResult: RecognitionResult = {
                  gesture: letter,
                  confidence: confidence,
                  timestamp: new Date().toLocaleTimeString(),
                };

                setResults((prev) => {
                  const updated = [newResult, ...prev].slice(0, 50);
                  const totalRecognitions = updated.length;
                  const averageConfidence =
                    updated.reduce((sum, r) => sum + r.confidence, 0) / totalRecognitions;
                  const uniqueGestures = new Set(updated.map((r) => r.gesture)).size;
                  const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
                  setStatistics({
                    totalRecognitions,
                    averageConfidence,
                    uniqueGestures,
                    duration: Math.floor(duration / 1000),
                  });
                  return updated;
                });
              }
            }
          }
        } catch (err) {
          console.error("❌ Prediction error:", err);
        } finally {
          isProcessingRef.current = false;
        }
      }
    };

    const predictIntervalId = setInterval(predictLoop, 500);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(predictIntervalId);
      isProcessingRef.current = false;
    };
  }, [isRecognizing, videoRef, canvasRef, serverConnected, recognitionMode]);

  const handleStartRecognition = async () => {
    try {
      await startCamera();
      startTimeRef.current = Date.now();
      frameCountRef.current = 0;
      setResults([]);
      setLetterSequence("");
      lastAcceptedRef.current = "";
      setIsRecognizing(true);
    } catch (err) {
      setStatusMessage("Failed to access camera");
    }
  };

  const handleStopRecognition = () => {
    setIsRecognizing(false);
    stopCamera();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleReset = () => {
    setResults([]);
    setLetterSequence("");
    lastAcceptedRef.current = "";
    frameCountRef.current = 0;
    startTimeRef.current = Date.now();
    setStatistics({
      totalRecognitions: 0,
      averageConfidence: 0,
      uniqueGestures: 0,
      duration: 0,
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {recognitionMode === "letter" ? "ASL Letter Recognition" : "WLASL Gesture Recognition"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {recognitionMode === "letter"
              ? "Phát hiện chữ cái A-Z realtime sử dụng ASL CNN Model"
              : "Phát hiện cử chỉ tay sử dụng WLASL Model"}
          </p>

          {/* Status Bar */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm text-muted-foreground">Camera: {isActive ? "✅" : "❌"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isRecognizing ? "bg-blue-500" : "bg-gray-400"}`} />
                  <span className="text-sm text-muted-foreground">Status: {isRecognizing ? "🔴" : "⚪"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serverConnected ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm text-muted-foreground">Server: {serverConnected ? "✅" : "❌"}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground truncate">{statusMessage}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Camera className="w-5 h-5" />
                    Camera Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <video ref={videoRef} className="hidden" />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="w-full bg-black rounded-lg border border-border"
                    />
                    <div className="flex gap-2">
                      {!isRecognizing ? (
                        <Button
                          onClick={handleStartRecognition}
                          disabled={!serverConnected}
                          className="flex-1"
                          size="lg"
                        >
                          <Loader2 className="w-4 h-4 mr-2" />
                          Start Recognition
                        </Button>
                      ) : (
                        <Button onClick={handleStopRecognition} variant="destructive" className="flex-1" size="lg">
                          Stop Recognition
                        </Button>
                      )}
                      <Button onClick={handleReset} variant="outline" size="lg">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recognition Mode & Letter Display */}
            <div className="space-y-4">
              {recognitionMode === "letter" && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-foreground text-lg">Detected Letters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white border-2 border-blue-300 rounded-lg p-4 min-h-24 font-mono text-3xl font-bold tracking-wider text-center break-all">
                      {letterSequence || "..."}
                    </div>
                    <Button
                      onClick={() => setLetterSequence(prev => prev.slice(0, -1))}
                      variant="outline"
                      disabled={letterSequence.length === 0}
                      className="w-full"
                    >
                      Delete (del)
                    </Button>
                    <Button
                      onClick={() => setLetterSequence("")}
                      variant="outline"
                      className="w-full"
                    >
                      Clear All
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Latest Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          {recognitionMode === "letter" ? "Letter" : "Gesture"}
                        </p>
                        <p className="text-2xl font-bold text-foreground">{results[0].gesture}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${results[0].confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-foreground font-semibold">
                            {(results[0].confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">{results[0].timestamp}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      <p>No result yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recognition Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => {
                      setRecognitionMode("letter");
                      setResults([]);
                      setLetterSequence("");
                    }}
                    variant={recognitionMode === "letter" ? "default" : "outline"}
                    className="w-full"
                  >
                    ASL Letter (A-Z)
                  </Button>
                  <Button
                    onClick={() => {
                      setRecognitionMode("gesture");
                      setResults([]);
                      setLetterSequence("");
                    }}
                    variant={recognitionMode === "gesture" ? "default" : "outline"}
                    className="w-full"
                  >
                    WLASL Gesture
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs for Results and Statistics */}
          <Tabs defaultValue="results" className="w-full">
            <TabsList>
              <TabsTrigger value="results">Recognition Results</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">History (50 Latest)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                      results.map((result, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded border border-border">
                          <span className="text-foreground font-medium">{result.gesture}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{(result.confidence * 100).toFixed(1)}%</Badge>
                            <span className="text-muted-foreground text-sm">{result.timestamp}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No results yet. Start recognition!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Total Recognitions</p>
                    <p className="text-3xl font-bold text-foreground">{statistics.totalRecognitions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Average Confidence</p>
                    <p className="text-3xl font-bold text-foreground">{(statistics.averageConfidence * 100).toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Unique Items</p>
                    <p className="text-3xl font-bold text-foreground">{statistics.uniqueGestures}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Duration</p>
                    <p className="text-3xl font-bold text-foreground">{statistics.duration}s</p>
                  </CardContent>
                </Card>
              </div>

              {results.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={results.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="timestamp" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="#7c3aed"
                          dot={false}
                          name="Confidence"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}