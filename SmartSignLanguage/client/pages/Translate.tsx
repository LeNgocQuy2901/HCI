import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Type,
} from "lucide-react";

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
type SequenceItem = {
  word: string;
  status: "available" | "fingerspelled" | "missing";
  letters?: string[];
};

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
  "Hello",
  "Thank you",
  "Good morning",
  "I need help",
  "What is your name?",
];

const fallbackSigns = [
  "hello",
  "thank",
  "thank you",
  "how",
  "you",
  "happy",
  "father",
  "mother",
  "sister",
  "brother",
  "family",
  "book",
  "finish",
  "go",
  "good",
  "help",
  "like",
  "what",
  "who",
  "yes",
  "no",
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
  "seven",
  "eight",
  "nine",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ..."abcdefghijklmnopqrstuvwxyz".split(""),
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

function createFallbackLandmarkData(): LandmarkData {
  return Object.fromEntries(
    fallbackSigns.map((label) => [
      label,
      Array.from({ length: 18 }, (_, index) =>
        makeFrame(label, index / 18),
      ).map((frame) => ({
        pose: frame.pose,
        left_hand: frame.left_hand,
        right_hand: frame.right_hand,
      })),
    ]),
  );
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
  const sequence: SequenceItem[] = [];

  if (!data) {
    return { frames, sequence, unsupported, words };
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
        sequence.push({ word: phrase, status: "available" });
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
    const letters: string[] = [];
    word.split("").forEach((letter) => {
      if (appendLabel(letter)) {
        letters.push(letter);
      }
    });
    sequence.push({
      word,
      status: letters.length > 0 ? "fingerspelled" : "missing",
      letters,
    });
  }

  return { frames, sequence, unsupported, words };
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
  const [draftInput, setDraftInput] = useState("");
  const [generatedInput, setGeneratedInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [landmarkData, setLandmarkData] = useState<LandmarkData | null>(null);
  const [loadError, setLoadError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTickRef = useRef(0);

  const animation = useMemo(
    () => buildAnimation(generatedInput, landmarkData),
    [generatedInput, landmarkData],
  );
  const activeFrame = animation.frames[frameIndex];
  const hasDraftInput = draftInput.trim().length > 0;
  const hasGeneratedInput = generatedInput.trim().length > 0;
  const matchedCount = animation.sequence.filter(
    (item) => item.status === "available",
  ).length;
  const fingerspelledCount = animation.sequence.filter(
    (item) => item.status === "fingerspelled",
  ).length;
  const missingCount = animation.sequence.filter(
    (item) => item.status === "missing",
  ).length;

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
          setLoadError("");
          setLandmarkData(createFallbackLandmarkData());
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
    setHasCompleted(false);
  }, [generatedInput]);

  useEffect(() => {
    if (canvasRef.current) {
      drawFrame(canvasRef.current, activeFrame);
    }
  }, [activeFrame]);

  useEffect(() => {
    if (!isPlaying || animation.frames.length === 0) return;

    const tick = (time: number) => {
      if (time - lastTickRef.current > FRAME_INTERVAL_MS) {
        setFrameIndex((current) => {
          const next = current + 1;
          if (next >= animation.frames.length) {
            setIsPlaying(false);
            setHasCompleted(true);
            return animation.frames.length - 1;
          }
          return next;
        });
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
  const statusLabel = loadError
    ? "Error"
    : isGenerating
      ? "Generating"
      : isPlaying
        ? "Playing"
        : hasCompleted
          ? "Completed"
          : animation.frames.length > 0
            ? "Ready"
            : "Waiting";
  const actionHint = !landmarkData
    ? "Loading signs..."
    : !hasDraftInput
      ? "Enter a sentence to begin."
      : draftInput.length > 120
        ? "Shorter sentences are easier to read as signs."
        : "Press Translate & Play to start.";

  const handleGenerate = () => {
    if (!hasDraftInput || isGenerating) return;
    setIsGenerating(true);
    setIsPlaying(false);
    setHasCompleted(false);

    window.setTimeout(() => {
      setGeneratedInput(draftInput.trim());
      setFrameIndex(0);
      setIsGenerating(false);
      setIsPlaying(true);
    }, 180);
  };

  const handleSample = (sample: string) => {
    setDraftInput(sample);
    setGeneratedInput(sample);
    setFrameIndex(0);
    setIsPlaying(true);
    setHasCompleted(false);
  };

  return (
    <Layout>
      <main className="container mx-auto px-4 py-4 md:py-6">
        <header className="mb-5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-5 text-white shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Text to Sign Translation
              </h1>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Type a sentence, then translate and play it in one step.
              </p>
            </div>
            <Badge
              className="w-fit bg-white/20 text-white hover:bg-white/20"
              role="status"
              aria-live="polite"
            >
              {statusLabel}
            </Badge>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
          <section className="space-y-4">
            <Card className="p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Enter Text</h2>
                  <p className="text-sm text-muted-foreground">
                    Short daily sentences work best.
                  </p>
                </div>
              </div>

              <label htmlFor="translate-input" className="sr-only">
                Enter text to translate into sign language
              </label>
              <Textarea
                id="translate-input"
                value={draftInput}
                onChange={(event) => setDraftInput(event.target.value)}
                maxLength={160}
                className="min-h-32 resize-none text-base focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Example: hello, thank you, good morning"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground" role="status" aria-live="polite">
                  {actionHint}
                </p>
                <span className="shrink-0 text-muted-foreground">
                  {draftInput.length}/160
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!hasDraftInput || isGenerating || !landmarkData}
                  className="gap-2 text-base"
                  aria-label="Translate and play sign language animation"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isGenerating ? "Translating..." : "Translate & Play"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setDraftInput("");
                    setGeneratedInput("");
                    setFrameIndex(0);
                    setIsPlaying(false);
                    setHasCompleted(false);
                  }}
                  disabled={!draftInput && !generatedInput}
                  className="gap-2"
                  aria-label="Clear translated text"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Examples</p>
                <div className="flex flex-wrap gap-2">
                  {samples.map((sample) => (
                    <Button
                      key={sample}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSample(sample)}
                      className="rounded-full focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {sample}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Sign Sequence</h2>
                {animation.sequence.length > 0 && (
                  <Badge variant="secondary">
                    {animation.sequence.length} signs
                  </Badge>
                )}
              </div>
              {animation.sequence.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  The translated signs will appear here.
                </p>
              ) : (
                <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                  {animation.sequence.map((item, index) => (
                    <Badge
                      key={`${item.word}-${index}`}
                      variant={
                        item.status === "available" ? "default" : "secondary"
                      }
                      className={
                        item.status === "fingerspelled"
                          ? "bg-amber-500 text-white"
                          : item.status === "missing"
                            ? "bg-red-600 text-white"
                            : ""
                      }
                    >
                      {item.word}
                      {item.status === "fingerspelled" ? " - spelled" : ""}
                    </Badge>
                  ))}
                </div>
              )}
              {fingerspelledCount > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Some words are spelled letter by letter.
                </p>
              )}
              {missingCount > 0 && (
                <p className="mt-3 text-sm text-destructive">
                  Some signs are unavailable. Try simpler words.
                </p>
              )}
            </Card>
          </section>

          <section className="lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Sign Animation Preview
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    The animation starts after translation.
                  </p>
                </div>
                <Badge
                  variant={loadError ? "destructive" : "secondary"}
                  className={
                    isPlaying
                      ? "bg-indigo-600 text-white"
                      : animation.frames.length > 0
                        ? "bg-green-600 text-white"
                        : ""
                  }
                  role="status"
                  aria-live="polite"
                >
                  {isGenerating
                    ? "Translating"
                    : isPlaying
                      ? "Playing"
                      : hasCompleted
                        ? "Completed"
                        : animation.frames.length > 0
                          ? "Ready"
                          : "Empty"}
                </Badge>
              </div>

              <div className="relative bg-black">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="block w-full aspect-video"
                />
                {!hasGeneratedInput && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 px-6 text-center">
                    <div className="max-w-sm rounded-xl border border-white/10 bg-black/55 p-5 text-white backdrop-blur">
                      <Sparkles className="mx-auto mb-3 h-8 w-8 text-cyan-300" />
                      <p className="font-medium">
                        Enter text and press Translate & Play.
                      </p>
                    </div>
                  </div>
                )}
                {isGenerating && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 px-6 text-center">
                    <div className="rounded-xl border border-white/10 bg-black/70 p-5 text-white backdrop-blur">
                      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-cyan-300" />
                      <p className="font-medium">Translating...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                  onClick={() => {
                    setIsPlaying((current) => !current);
                    setHasCompleted(false);
                  }}
                    disabled={!landmarkData || animation.frames.length === 0}
                    className="gap-2"
                    aria-label={isPlaying ? "Pause animation" : "Play animation"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setFrameIndex(0);
                      setIsPlaying(false);
                      setHasCompleted(false);
                    }}
                    disabled={!landmarkData || animation.frames.length === 0}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Replay
                  </Button>
                  {missingCount > 0 && (
                    <Badge variant="destructive" className="h-10 px-4">
                      Some signs unavailable
                    </Badge>
                  )}
                  {matchedCount > 0 && missingCount === 0 && (
                    <Badge className="h-10 bg-green-600 px-4 text-white">
                      All signs ready
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Playback {progress}%
                    </span>
                    <span className="font-medium">
                      {animation.frames.length > 0
                        ? `${frameIndex + 1} / ${animation.frames.length}`
                        : "No animation"}
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    aria-label="Playback progress"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </Layout>
  );
}
