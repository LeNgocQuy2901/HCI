import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Video } from "lucide-react";
import {
  categoryLabels,
  difficultyLabels,
  vocabularyCards,
} from "@shared/vocabulary";

const stopWords = new Set([
  "a",
  "an",
  "are",
  "find",
  "for",
  "i",
  "is",
  "lookup",
  "me",
  "need",
  "of",
  "please",
  "search",
  "show",
  "the",
  "to",
  "want",
]);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTerms(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  const terms = normalized
    .split(" ")
    .filter((term) => term && !stopWords.has(term));

  return terms.length > 0 ? terms : [normalized];
}

export default function Lookup() {
  const [query, setQuery] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(
    vocabularyCards[0]?.id ?? "",
  );

  const terms = useMemo(() => queryTerms(query), [query]);
  const results = useMemo(() => {
    const cards =
      terms.length === 0
        ? vocabularyCards
        : vocabularyCards.filter((card) => {
            const word = normalizeText(card.word);
            return terms.some((term) => word.includes(term));
          });

    return cards
      .slice()
      .sort((first, second) => first.word.localeCompare(second.word));
  }, [terms]);

  const selectedCard =
    results.find((card) => card.id === selectedCardId) || results[0] || null;

  useEffect(() => {
    if (results.length === 0) return;

    if (!results.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(results[0].id);
    }
  }, [results, selectedCardId]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Sign Video Lookup</h1>
          <p className="text-lg text-muted-foreground">
            Search only the vocabulary words used in Learn and play the matching
            sign video.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] gap-6">
          <Card className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Search Vocabulary</h2>
              <p className="text-sm text-muted-foreground">
                Type a word or part of a word. For example, typing "ch" shows
                Learn words containing "ch".
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Example: ch, school, thank you"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              {results.length} word{results.length === 1 ? "" : "s"} found
            </div>

            <div className="max-h-[520px] overflow-y-auto rounded-md border">
              {results.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No matching Learn vocabulary word.
                </div>
              ) : (
                results.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={`flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                      selectedCard?.id === card.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-semibold">{card.word}</span>
                    <span className="text-xs opacity-80">
                      {categoryLabels[card.category]}
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            {selectedCard ? (
              <div className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{selectedCard.word}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedCard.description}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {categoryLabels[selectedCard.category]}
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-md bg-black">
                  <video
                    key={selectedCard.videoUrl}
                    className="block w-full aspect-video"
                    controls
                    autoPlay
                    muted
                    playsInline
                  >
                    <source src={selectedCard.videoUrl} type="video/mp4" />
                  </video>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {difficultyLabels[selectedCard.difficulty]}
                  </Badge>
                  {selectedCard.example && (
                    <Badge variant="outline">{selectedCard.example}</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-96 items-center justify-center text-muted-foreground">
                <Video className="mr-2 h-5 w-5" />
                Select a word to play its video.
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
