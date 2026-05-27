import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";

type Point = { x: number; y: number; z?: number; v?: number };
type SignFrame = {
  label: string;
  pose: Point[];
  left_hand: Point[];
  right_hand: Point[];
};
type RawSignFrame = Partial<
  Record<"pose" | "left_hand" | "right_hand", Point[]>
>;
type LandmarkData = Record<string, RawSignFrame[]>;

const LANDMARK_DATA_URL = "/data/combined_avg_landmarks.json";
const FRAME_INTERVAL_MS = 55;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;
const RIGHT_HAND_ONLY_SIGNS = new Set([
  "hello",
  "thank",
  "thank you",
  "you",
  "father",
  "mother",
  "bird",
  "fish",
  "black",
  "red",
  "blue",
  "yellow",
  "pink",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  ..."abcdefghijklmnopqrstuvwxyz".split(""),
]);

const POSE_CONNECTIONS = [
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 12],
  [23, 24],
  [11, 23],
  [12, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [1, 2],
  [2, 3],
  [3, 7],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
] as const;

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
] as const;

const stopWords = new Set([
  "a",
  "am",
  "an",
  "are",
  "as",
  "be",
  "been",
  "being",
  "do",
  "does",
  "for",
  "had",
  "has",
  "have",
  "i",
  "is",
  "it",
  "its",
  "of",
  "the",
  "then",
  "to",
  "was",
  "were",
]);

const samples = [
  "hello thank you",
  "how are you",
  "i am happy",
  "father mother sister",
  "one two three four five",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashWord(word: string) {
  return Array.from(word).reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function makePose(): Point[] {
  const pose = Array.from({ length: 29 }, () => ({ x: 0.5, y: 0.5 }));
  pose[0] = { x: 0.5, y: 0.18 };
  pose[1] = { x: 0.47, y: 0.16 };
  pose[2] = { x: 0.46, y: 0.14 };
  pose[3] = { x: 0.45, y: 0.12 };
  pose[4] = { x: 0.53, y: 0.16 };
  pose[5] = { x: 0.54, y: 0.14 };
  pose[6] = { x: 0.55, y: 0.12 };
  pose[7] = { x: 0.43, y: 0.17 };
  pose[8] = { x: 0.57, y: 0.17 };
  pose[9] = { x: 0.47, y: 0.24 };
  pose[10] = { x: 0.53, y: 0.24 };
  pose[11] = { x: 0.36, y: 0.34 };
  pose[12] = { x: 0.64, y: 0.34 };
  pose[13] = { x: 0.32, y: 0.52 };
  pose[14] = { x: 0.68, y: 0.52 };
  pose[15] = { x: 0.3, y: 0.7 };
  pose[16] = { x: 0.7, y: 0.7 };
  pose[23] = { x: 0.42, y: 0.78 };
  pose[24] = { x: 0.58, y: 0.78 };
  pose[25] = { x: 0.42, y: 0.95 };
  pose[26] = { x: 0.58, y: 0.95 };
  pose[27] = { x: 0.42, y: 1.1 };
  pose[28] = { x: 0.58, y: 1.1 };
  return pose;
}

function makeHand(
  cx: number,
  cy: number,
  scale: number,
  openness: number,
): Point[] {
  const points: Point[] = [{ x: cx, y: cy }];
  const fingerBases = [-0.08, -0.03, 0.02, 0.07, 0.11];
  const lengths = [0.08, 0.13, 0.15, 0.13, 0.1];

  fingerBases.forEach((base, fingerIndex) => {
    const bend = (1 - openness) * (0.04 + fingerIndex * 0.003);
    for (let joint = 1; joint <= 4; joint += 1) {
      points.push({
        x: cx + (base + bend * joint) * scale,
        y: cy - lengths[fingerIndex] * scale * (joint / 4) * openness,
      });
    }
  });

  return points.slice(0, 21);
}

function makeFrame(label: string, phase: number): SignFrame {
  const hash = hashWord(label);
  const pose = makePose();
  const wave = Math.sin(phase * Math.PI * 2);
  const alternate = Math.cos(phase * Math.PI * 2);
  const baseX = 0.5 + ((hash % 7) - 3) * 0.015;
  const baseY = 0.52 + ((hash % 5) - 2) * 0.015;
  const spread = 0.13 + (hash % 4) * 0.015;
  const openness = 0.45 + (hash % 6) / 10 + wave * 0.08;

  pose[15] = {
    x: baseX - spread + wave * 0.04,
    y: baseY + alternate * 0.04,
  };
  pose[16] = {
    x: baseX + spread - wave * 0.04,
    y: baseY - alternate * 0.04,
  };
  pose[13] = {
    x: (pose[11].x + pose[15].x) / 2,
    y: (pose[11].y + pose[15].y) / 2,
  };
  pose[14] = {
    x: (pose[12].x + pose[16].x) / 2,
    y: (pose[12].y + pose[16].y) / 2,
  };

  return {
    label,
    pose,
    left_hand: makeHand(pose[15].x, pose[15].y, 1, openness),
    right_hand: makeHand(
      pose[16].x,
      pose[16].y,
      1,
      1 - (openness - 0.35) / 1.2,
    ),
  };
}

function maxPhraseLength(data: LandmarkData) {
  return Math.max(
    1,
    ...Object.keys(data).map((key) => key.trim().split(/\s+/).length),
  );
}

function buildAnimation(text: string, data: LandmarkData | null) {
  const tokens = normalizeText(text).split(" ").filter(Boolean);
  const frames: SignFrame[] = [];
  const words: string[] = [];
  const unsupported: string[] = [];

  if (!data) {
    return { frames, unsupported, words };
  }

  const appendLabel = (label: string) => {
    const sequence = data[label];
    if (!Array.isArray(sequence) || sequence.length === 0) {
      return false;
    }

    sequence.forEach((frame) => {
      frames.push({
        label,
        pose: frame.pose ?? [],
        left_hand: frame.left_hand ?? [],
        right_hand: frame.right_hand ?? [],
      });
    });
    words.push(label);
    return true;
  };

  const phraseLimit = maxPhraseLength(data);
  let index = 0;

  while (index < tokens.length) {
    let matched = false;

    for (
      let size = Math.min(phraseLimit, tokens.length - index);
      size > 0;
      size -= 1
    ) {
      const phrase = tokens.slice(index, index + size).join(" ");
      if (appendLabel(phrase)) {
        index += size;
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    const word = tokens[index];
    index += 1;

    if (stopWords.has(word)) {
      continue;
    }

    unsupported.push(word);
    word.split("").forEach((letter) => appendLabel(letter));
  }

  return { frames, unsupported, words };
}

function drawConnections(
  context: CanvasRenderingContext2D,
  points: Point[],
  connections: readonly (readonly [number, number])[],
  width: number,
  height: number,
  color: string,
) {
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  connections.forEach(([from, to]) => {
    if (!points[from] || !points[to]) return;
    context.moveTo(points[from].x * width, points[from].y * height);
    context.lineTo(points[to].x * width, points[to].y * height);
  });
  context.stroke();

  context.fillStyle = color;
  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2);
    context.fill();
  });
}

function drawFrame(canvas: HTMLCanvasElement, frame?: SignFrame) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#070707";
  context.fillRect(0, 0, width, height);

  if (!frame) {
    context.fillStyle = "#a1a1aa";
    context.font = "20px sans-serif";
    context.textAlign = "center";
    context.fillText(
      "Enter text to generate landmark animation",
      width / 2,
      height / 2,
    );
    return;
  }

  const label = frame.label.toLowerCase();
  const drawLeftHand = !RIGHT_HAND_ONLY_SIGNS.has(label);
  const drawRightHand = true;

  drawConnections(
    context,
    frame.pose,
    POSE_CONNECTIONS,
    width,
    height,
    "#22c55e",
  );
  if (drawLeftHand) {
    drawConnections(
      context,
      frame.left_hand,
      HAND_CONNECTIONS,
      width,
      height,
      "#38bdf8",
    );
  }
  if (drawRightHand) {
    drawConnections(
      context,
      frame.right_hand,
      HAND_CONNECTIONS,
      width,
      height,
      "#f97316",
    );
  }

  context.fillStyle = "#ffffff";
  context.font = "26px sans-serif";
  context.textAlign = "left";
  context.fillText(frame.label.toUpperCase(), 24, 42);
}

export default function Translate() {
  const [input, setInput] = useState("hello thank you");
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [landmarkData, setLandmarkData] = useState<LandmarkData | null>(null);
  const [loadError, setLoadError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTickRef = useRef(0);

  const animation = useMemo(
    () => buildAnimation(input, landmarkData),
    [input, landmarkData],
  );
  const activeFrame = animation.frames[frameIndex];

  useEffect(() => {
    let cancelled = false;

    async function loadLandmarks() {
      try {
        setLoadError("");
        const response = await fetch(LANDMARK_DATA_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = (await response.json()) as LandmarkData;
        if (!cancelled) {
          setLandmarkData(json);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            `Unable to load landmark data from ${LANDMARK_DATA_URL}.`,
          );
          setLandmarkData(null);
        }
      }
    }

    loadLandmarks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [input]);

  useEffect(() => {
    if (canvasRef.current) {
      drawFrame(canvasRef.current, activeFrame);
    }
  }, [activeFrame]);

  useEffect(() => {
    if (!isPlaying || animation.frames.length === 0) return;

    const tick = (time: number) => {
      if (time - lastTickRef.current > FRAME_INTERVAL_MS) {
        setFrameIndex((current) => (current + 1) % animation.frames.length);
        lastTickRef.current = time;
      }
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animation.frames.length, isPlaying]);

  const progress =
    animation.frames.length > 0
      ? Math.round(((frameIndex + 1) / animation.frames.length) * 100)
      : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Text to Sign Converter</h1>
          <p className="text-lg text-muted-foreground">
            Generates sign-language landmark animation from text using the
            Text-to-Sign converter pipeline.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <section className="space-y-4">
            <Card className="overflow-hidden bg-black">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block w-full aspect-[3/2]"
              />
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setIsPlaying((current) => !current)}
                disabled={!landmarkData || animation.frames.length === 0}
              >
                {isPlaying ? <Pause /> : <Play />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFrameIndex(0);
                  setIsPlaying(false);
                }}
                disabled={!landmarkData || animation.frames.length === 0}
              >
                <RotateCcw />
                Reset
              </Button>
              <Badge variant="outline" className="h-10 px-4 text-sm">
                {animation.frames.length} frames
              </Badge>
              <Badge variant="secondary" className="h-10 px-4 text-sm">
                {landmarkData
                  ? `${Object.keys(landmarkData).length} signs loaded`
                  : "Loading signs"}
              </Badge>
              <Badge variant="secondary" className="h-10 px-4 text-sm">
                {progress}% played
              </Badge>
            </div>
          </section>

          <aside className="space-y-4">
            <Card className="p-5 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Input Text</h2>
                <p className="text-sm text-muted-foreground">
                  Landmark data is loaded from the Text-to-Sign converter JSON.
                  Unsupported words fall back to fingerspelling when letter
                  signs exist.
                </p>
                {loadError && (
                  <p className="text-sm text-destructive mt-2">{loadError}</p>
                )}
              </div>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-36 resize-none text-base"
                placeholder="Type a sentence..."
              />
              <div className="flex flex-wrap gap-2">
                {samples.map((sample) => (
                  <Button
                    key={sample}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(sample)}
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h2 className="text-xl font-semibold">Generated Sequence</h2>
              <div className="flex flex-wrap gap-2">
                {animation.words.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sign tokens generated.
                  </p>
                ) : (
                  animation.words.map((word, index) => (
                    <Badge
                      key={`${word}-${index}`}
                      variant={
                        animation.unsupported.includes(word)
                          ? "secondary"
                          : "default"
                      }
                    >
                      {word}
                    </Badge>
                  ))
                )}
              </div>
              {animation.unsupported.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Fingerspelled fallback: {animation.unsupported.join(", ")}
                </p>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="text-xl font-semibold">Model Source</h2>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
                <p>
                  Uses the Text-to-Sign converter approach from
                  `Bidirectional-Sign-Language-Converter/Text-to-Sign-Convertor`:
                  text normalization, stopword removal, word fallback, and
                  landmark skeleton rendering. No video playback is used.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
