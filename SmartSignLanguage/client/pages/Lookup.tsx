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
  "a", "an", "are", "find", "for", "i", "is", "lookup",
  "me", "need", "of", "please", "search", "show", "the", "to", "want",
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
  const terms = normalized.split(" ").filter((term) => term && !stopWords.has(term));
  return terms.length > 0 ? terms : [normalized];
}

export default function Lookup() {
  const [query, setQuery] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(vocabularyCards[0]?.id ?? "");

  const terms = useMemo(() => queryTerms(query), [query]);
  const results = useMemo(() => {
    const cards =
      terms.length === 0
        ? vocabularyCards
        : vocabularyCards.filter((card) => {
            const word = normalizeText(card.word);
            return terms.some((term) => word.includes(term));
          });
    return cards.slice().sort((first, second) => first.word.localeCompare(second.word));
  }, [terms]);

  const selectedCard = results.find((card) => card.id === selectedCardId) || results[0] || null;

  useEffect(() => {
    if (results.length === 0) return;
    if (!results.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(results[0].id);
    }
  }, [results, selectedCardId]);

  return (
    <Layout>
      {/* Hero header (phase 1) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eef5ff] via-[#f4f8ff] to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 py-12 lg:py-16">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md">
              <Video className="h-7 w-7 text-[#0056d2]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Sign Video Lookup
          </h1>
          <p className="text-base md:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#0056d2] to-indigo-600">
            Watch the sign for any vocabulary word
          </p>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto font-medium">
            Search the vocabulary library used in Learn and play the matching sign video instantly.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] gap-6">

          {/* ── PHASE 2: Redesigned search card ── */}
          <Card className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Search Vocabulary</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Type a word or part of a word. Typing "ch" shows all words containing "ch".
              </p>
            </div>

            {/* Search input — thêm focus ring xanh đồng nhất với Index */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9 border-slate-200 dark:border-slate-700 focus-visible:ring-[#0056d2] focus-visible:border-[#0056d2]"
                placeholder="Example: ch, school, thank you"
              />
            </div>

            {/* Count chip */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-3 py-1 text-xs font-semibold text-[#0056d2] dark:text-blue-300">
                <Search className="h-3 w-3" />
                {results.length} word{results.length === 1 ? "" : "s"} found
              </span>
            </div>

            {/* ── Word list: selected = #0056d2 accent, border-left highlight ── */}
            <div className="max-h-[520px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
              {results.length === 0 ? (
                <div className="p-6 text-sm text-slate-400 text-center">
                  No matching vocabulary word found.
                </div>
              ) : (
                results.map((card) => {
                  const isSelected = selectedCard?.id === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-all duration-150 ${
                        isSelected
                          ? "border-l-[3px] border-l-[#0056d2] bg-blue-50 dark:bg-blue-950/30 pl-[13px]"
                          : "border-l-[3px] border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span className={`font-semibold ${isSelected ? "text-[#0056d2] dark:text-blue-300" : "text-slate-800 dark:text-slate-100"}`}>
                        {card.word}
                      </span>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        isSelected
                          ? "bg-[#0056d2] text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                      }`}>
                        {categoryLabels[card.category]}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Detail card (unchanged from phase 1) */}
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