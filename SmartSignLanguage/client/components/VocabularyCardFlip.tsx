import { useState } from "react";
import { VocabularyCard as VocabType } from "@shared/vocabulary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCw, Check, X, Play } from "lucide-react";

interface VocabularyCardProps {
  card: VocabType;
  onMarkCorrect?: () => void;
  onMarkWrong?: () => void;
  showActions?: boolean;
}

export default function VocabularyCardComponent({
  card,
  onMarkCorrect,
  onMarkWrong,
  showActions = true,
}: VocabularyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full perspective">
      <Card
        className="min-h-96 cursor-pointer flex flex-col justify-between p-8 transition-all duration-500 transform"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front Side - Word */}
        {!isFlipped && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fadeIn">
            <div className="text-center">
              <Badge className="mb-4">{card.category}</Badge>
              <h2 className="text-5xl font-bold text-foreground mb-2">
                {card.word}
              </h2>
              {card.example && (
                <p className="text-lg text-muted-foreground mt-4">
                  "{card.example}"
                </p>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground mt-8">
              <p>Click to reveal sign demonstration</p>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">
                {card.difficulty.charAt(0).toUpperCase() +
                  card.difficulty.slice(1)}
              </Badge>
            </div>
          </div>
        )}

        {/* Back Side - Video & Description */}
        {isFlipped && (
          <div className="flex flex-col items-center justify-between h-full space-y-4 animate-fadeIn">
            {/* Video Player */}
            <div className="w-full max-w-sm rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <video
                className="w-full h-auto max-h-64 bg-black"
                controls
                autoPlay
                loop
                muted
              >
                <source src={card.videoUrl} type="video/mp4" />
                <div className="flex items-center justify-center h-64 bg-muted text-muted-foreground">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Video not available</p>
                  </div>
                </div>
              </video>
            </div>

            {/* Description */}
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">How to Sign:</h3>
              <p className="text-foreground leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Click to hide</p>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-4 mt-6 justify-center">
          <Button
            variant="default"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onMarkCorrect?.();
            }}
          >
            <Check className="h-4 w-4" />
            Got it!
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onMarkWrong?.();
            }}
          >
            <X className="h-4 w-4" />
            Review Again
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
