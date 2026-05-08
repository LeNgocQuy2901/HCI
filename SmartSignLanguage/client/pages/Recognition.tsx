import Layout from "@/components/Layout";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, Camera } from "lucide-react";

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

export default function Recognition() {
  const { videoRef, canvasRef, isActive, startCamera, stopCamera } = useCamera();
  const frameCountRef = useRef(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [results, setResults] = useState<RecognitionResult[]>([]);
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
  const isProcessingRef = useRef(false);  // Throttle flag

  // Check server health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch("http://localhost:8000/health");
        if (response.ok) {
          setServerConnected(true);
          setStatusMessage("Connected to inference server");
        }
      } catch (err) {
        setServerConnected(false);
        setStatusMessage("Inference server not available");
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Start animation loop when recognizing
  useEffect(() => {
    if (!isRecognizing || !videoRef.current || !canvasRef.current) return;

    const animate = async () => {
      frameCountRef.current++;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

        // Send frame for prediction every 30 frames (throttled)
        if (frameCountRef.current % 30 === 0 && serverConnected && canvasRef.current && !isProcessingRef.current) {
          isProcessingRef.current = true;  // Lock throttle
          
          canvasRef.current.toBlob(async (blob) => {
            if (!blob) {
              isProcessingRef.current = false;
              return;
            }

            try {
              const formData = new FormData();
              formData.append("file", blob, "frame.jpg");

              const response = await fetch("http://localhost:8000/api/predict", {
                method: "POST",
                body: formData,
              });

              if (response.ok) {
                const prediction = await response.json();
                const newResult: RecognitionResult = {
                  gesture: prediction.gesture,
                  confidence: prediction.confidence,
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
            } catch (err) {
              console.error("❌ Prediction error:", err);
            } finally {
              isProcessingRef.current = false;  // Unlock throttle
            }
          }, "image/jpeg", 0.8);
        }
      }

      if (isRecognizing) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isProcessingRef.current = false;
    };
  }, [isRecognizing, videoRef, canvasRef, serverConnected]);

  const handleStartRecognition = async () => {
    try {
      await startCamera();
      startTimeRef.current = Date.now();
      frameCountRef.current = 0;
      setResults([]);
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

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Nhận dạng Ngôn ngữ Ký hiệu Thời gian thực</h1>
          <p className="text-muted-foreground mb-6">Phát hiện cử chỉ tay và dịch được cung cấp bởi AI</p>

          {/* Status Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm text-muted-foreground">Camera: {isActive ? "Ready" : "Off"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isRecognizing ? "bg-blue-500" : "bg-gray-400"}`} />
                  <span className="text-sm text-muted-foreground">Nhận dạng: {isRecognizing ? "Active" : "Idle"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serverConnected ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm text-muted-foreground">Server: {serverConnected ? "Connected" : "Offline"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
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
                    Luồng Camera Trực tiếp
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
                        <Button onClick={handleStartRecognition} className="flex-1" size="lg">
                          <Loader2 className="w-4 h-4 mr-2" />
                          Start Recognition
                        </Button>
                      ) : (
                        <Button onClick={handleStopRecognition} variant="destructive" className="flex-1" size="lg">
                          Stop Recognition
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Latest Result */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Kết quả Mới nhất</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Cử chỉ</p>
                        <p className="text-2xl font-bold text-foreground">{results[0].gesture}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Độ tin cậy</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${results[0].confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-foreground font-semibold">{(results[0].confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">{results[0].timestamp}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      <p>Chưa có kết quả</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs for Results and Statistics */}
          <Tabs defaultValue="results" className="w-full">
            <TabsList>
              <TabsTrigger value="results">Kết quả Nhận dạng</TabsTrigger>
              <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Lịch sử Nhận dạng (50 mới nhất)</CardTitle>
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
                      <p className="text-muted-foreground">Chưa có kết quả. Hãy bắt đầu camera để bắt đầu!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Tổng số Nhận dạng</p>
                    <p className="text-3xl font-bold text-foreground">{statistics.totalRecognitions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Độ tin cậy Trung bình</p>
                    <p className="text-3xl font-bold text-foreground">{(statistics.averageConfidence * 100).toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Cử chỉ Duy nhất</p>
                    <p className="text-3xl font-bold text-foreground">{statistics.uniqueGestures}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">Thời lượng</p>
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
                          name="Độ tin cậy"
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
