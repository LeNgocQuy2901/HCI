import { VocabularyCard } from "./vocabulary";

export interface SignLearningMetadata {
  instruction: string;
  commonMistakes: string[];
  practiceTips: string[];
  exampleSentences: string[];
}

const categoryInstructions: Record<string, string> = {
  greeting:
    "Keep your upper body facing the camera, make the handshape clearly, and complete the motion at a steady pace.",
  family:
    "Keep the hand close to the correct face or upper-body location and avoid hiding fingers from the camera.",
  colors:
    "Hold the color handshape clearly for a moment before moving so the model can read the fingers.",
  "food-drink":
    "Start from the correct mouth or body location and keep the wrist orientation visible.",
  "action-verbs":
    "Make the action motion slower than normal at first, with a clear start and end position.",
  "emotions-feelings":
    "Use a stable handshape and keep facial/upper-body area centered in the camera.",
  "education-school":
    "Keep both hands visible when the sign uses two hands, and separate the start and end positions.",
  "travel-transportation":
    "Use smooth movement and keep the sign inside the camera frame from start to finish.",
  "body-health":
    "Point or move near the body area clearly without moving too close to the camera.",
  "places-buildings":
    "Keep the sign centered and avoid fast, small motions that make the handshape unclear.",
  "technology-computer":
    "Show the handshape from the front and pause briefly after completing the motion.",
};

export const curatedSignMetadata: Record<string, Partial<SignLearningMetadata>> = {
  hello: {
    instruction:
      "Raise your open hand near the side of your forehead, palm facing out, then move it outward in a small greeting motion.",
    commonMistakes: [
      "Hand starts too low below the face.",
      "Palm turns sideways instead of facing outward.",
      "Motion is too fast for the camera to capture.",
    ],
    practiceTips: [
      "Pause at the starting hand position before moving.",
      "Keep your face and hand in the same camera frame.",
    ],
  },
  "thank you": {
    instruction:
      "Place the fingertips near the chin, palm facing up or outward, then move the hand forward smoothly.",
    commonMistakes: [
      "Starting too far from the chin.",
      "Moving the hand downward instead of forward.",
      "Hand leaves the camera frame at the end.",
    ],
    practiceTips: [
      "Keep the elbow relaxed and move from the wrist/forearm.",
      "End with the palm still visible to the camera.",
    ],
  },
  good: {
    instruction:
      "Start with the dominant hand near the mouth or chin and move it down toward the other hand or open space.",
    commonMistakes: [
      "Handshape is loose or fingers are hidden.",
      "Motion starts too low.",
    ],
  },
};

function fallbackMistakes(card: VocabularyCard) {
  return [
    "The handshape is not held clearly long enough.",
    "The hand moves too quickly for recognition.",
    "The sign moves partly outside the camera frame.",
    `The motion may be confused with another ${card.category.replace(/-/g, " ")} sign.`,
  ];
}

function fallbackTips() {
  return [
    "Practice slowly first, then increase speed after the sign is stable.",
    "Keep your hand and upper body centered in the camera.",
    "Hold the final position for a short moment before stopping.",
  ];
}

export function getSignMetadata(card: VocabularyCard): SignLearningMetadata {
  const key = card.word.toLowerCase();
  const specific = curatedSignMetadata[key] || {};

  return {
    instruction:
      specific.instruction ||
      card.description ||
      categoryInstructions[card.category] ||
      "Watch the demo video, copy the handshape, and keep the motion clear and stable.",
    commonMistakes: specific.commonMistakes || fallbackMistakes(card),
    practiceTips: specific.practiceTips || fallbackTips(),
    exampleSentences: specific.exampleSentences ||
      [card.example || `Practice the sign for "${card.word}" in a short sentence.`],
  };
}

export function buildRecognitionSuggestion(
  card: VocabularyCard | undefined,
  issue: "confused" | "low-confidence" | "unstable" | "correct",
  predictedWord?: string,
) {
  if (!card) {
    return issue === "correct"
      ? "Good job! You signed this correctly."
      : "Try again and keep your hand more stable.";
  }

  const metadata = getSignMetadata(card);
  const firstMistake = metadata.commonMistakes[0];
  const firstTip = metadata.practiceTips[0];

  if (issue === "correct") {
    return `Good job! You signed "${card.word}" correctly. Tip: ${firstTip}`;
  }

  if (issue === "confused") {
    return `You may be confusing "${card.word}" with "${predictedWord}". Common issue: ${firstMistake}`;
  }

  if (issue === "low-confidence") {
    return `Your "${card.word}" sign was detected weakly. ${firstTip}`;
  }

  return `Your "${card.word}" movement seems unstable. Common issue: ${firstMistake}`;
}
