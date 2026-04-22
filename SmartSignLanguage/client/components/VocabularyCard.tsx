import { useState } from "react";
import { VocabularyCard as IVocabularyCard } from "@shared/vocabulary";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface VocabularyCardProps {
  card: IVocabularyCard;
  onRemember: (cardId: string) => void;
  onForgot: (cardId: string) => void;
  status?: "new" | "learning" | "mastered";
}

export default function VocabularyCard({
  card,
  onRemember,
  onForgot,
  status = "new",
}: VocabularyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div
        className={cn(
          "relative w-full h-96 cursor-pointer perspective",
          "transition-transform duration-500 transform",
          isFlipped && "rotate-y-180"
        )}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Side */}
        <div
          className={cn(
            "absolute w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8",
            "flex flex-col items-center justify-center shadow-lg",
            isFlipped && "invisible"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="space-y-4 text-center">
            <div className="flex justify-center gap-2">
              <Badge variant={status === "mastered" ? "default" : "secondary"}>
                {status}
              </Badge>
            </div>
            <h2 className="text-5xl font-bold text-white">{card.word}</h2>
            <p className="text-blue-100">{card.category}</p>
            <p className="text-sm text-blue-50">Click to reveal sign</p>
          </div>
        </div>

        {/* Back Side */}
        <div
          className={cn(
            "absolute w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8",
            "flex flex-col items-center justify-center shadow-lg",
            !isFlipped && "invisible"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="space-y-6 w-full">
            {/* Video Preview */}
            <div className="bg-black/30 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {showVideo ? (
                <video
                  src={card.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                  variant="secondary"
                  className="gap-2"
                >
                  <RotateCw size={18} />
                  Play Video
                </Button>
              )}
            </div>

            {/* Description */}
            <div className="text-center">
              <p className="text-white font-semibold mb-2">How to sign:</p>
              <p className="text-green-50">{card.description}</p>
            </div>

            {/* Example */}
            {card.example && (
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-green-100 font-semibold mb-1">
                  Example:
                </p>
                <p className="text-white text-sm">{card.example}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => setIsFlipped(!isFlipped)}
          className="gap-2"
        >
          <RotateCw size={18} />
          Flip Card
        </Button>

        <Button
          onClick={() => onForgot(card.id)}
          variant="destructive"
          className="gap-2"
        >
          <X size={18} />
          Forgot
        </Button>

        <Button
          onClick={() => onRemember(card.id)}
          variant="default"
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Check size={18} />
          Remember
        </Button>
      </div>

      {/* Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Difficulty: <span className="font-semibold">{card.difficulty}</span></p>
      </div>
    </div>
  );
}
