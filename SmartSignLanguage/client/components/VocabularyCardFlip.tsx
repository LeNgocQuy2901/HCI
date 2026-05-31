import { useState } from "react";
import { VocabularyCard as VocabType } from "@shared/vocabulary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCw, Check, X, Play } from "lucide-react";
import { categoryLabels, difficultyLabels } from "@shared/vocabulary";

interface VocabularyCardProps {
  card: VocabType;
  onMarkCorrect?: () => void;
  onMarkWrong?: () => void;
  onVideoWatched?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function VocabularyCardComponent({
  card,
  onMarkCorrect,
  onMarkWrong,
  onVideoWatched,
  showActions = true,
  compact = false,
}: VocabularyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [trackedVideo, setTrackedVideo] = useState(false);

  const handleVideoPlay = () => {
    if (trackedVideo) return;
    setTrackedVideo(true);
    onVideoWatched?.();
  };

  return (
    <div className="w-full perspective">
      <Card
        className={`cursor-pointer flex flex-col justify-between transition-all duration-500 transform ${
          compact ? "min-h-[18rem] p-4" : "min-h-[32rem] p-6"
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front Side - Word */}
        {!isFlipped && (
          <div
            className={`flex flex-col items-center justify-center h-full animate-fadeIn ${
              compact ? "space-y-3" : "space-y-6"
            }`}
          >
            <div className="text-center">
              <Badge className={compact ? "mb-2" : "mb-4"}>
                {categoryLabels[card.category]}
              </Badge>
              <h2
                className={`font-bold text-foreground mb-2 ${
                  compact ? "text-4xl" : "text-5xl"
                }`}
              >
                {card.word}
              </h2>
              {card.example && (
                <p
                  className={`text-muted-foreground ${
                    compact ? "text-sm mt-2" : "text-lg mt-4"
                  }`}
                >
                  "{card.example}"
                </p>
              )}
            </div>

            <div
              className={`text-center text-sm text-muted-foreground ${
                compact ? "mt-3" : "mt-8"
              }`}
            >
              <p>Click to view the sign demo</p>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">
                {difficultyLabels[card.difficulty]}
              </Badge>
            </div>
          </div>
        )}

        {/* Back Side - Video Only */}
        {isFlipped && (
          <div className="flex flex-col items-center justify-start h-full pt-4 gap-2 animate-fadeIn">
            {/* Video Player */}
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl">
              <video
                className={`w-full h-auto bg-black ${
                  compact ? "max-h-[13rem]" : "max-h-[24rem]"
                }`}
                controls
                autoPlay
                loop
                muted
                onPlay={handleVideoPlay}
              >
                <source src={card.videoUrl} type="video/mp4" />
                <div className="flex items-center justify-center h-64 bg-muted text-muted-foreground">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No video</p>
                  </div>
                </div>
              </video>
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-foreground leading-tight">
                {card.word}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      {showActions && (
        <div
          className={`flex gap-3 justify-center ${compact ? "mt-2" : "mt-3"}`}
        >
          <Button
            variant="default"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onMarkCorrect?.();
            }}
          >
            <Check className="h-4 w-4" />
            Got It
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
