import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GUIDE_STORAGE_PREFIX = "smart-sign-language:page-tour:v1:";
const OPEN_GUIDE_EVENT = "smart-sign-language:open-guide";

type TourStep = {
  selector: string;
  title: string;
  description: string;
};

const pageTours: Record<string, TourStep[]> = {
  home: [
    {
      selector: '[data-tour="home-auth"]',
      title: "Sign in or create an account",
      description:
        "Use these buttons to sign in or register. An account lets you keep your learning progress across sessions.",
    },
    {
      selector: '[data-tour="home-start-learning"]',
      title: "Start your learning path",
      description:
        "Open Learn to choose a lesson, watch sign videos, review cards, and complete quizzes.",
    },
    {
      selector: '[data-tour="nav-recognition"]',
      title: "Practice with AI",
      description:
        "Open Recognition when you want to practice signs using your camera or an uploaded file.",
    },
  ],
  learn: [
    {
      selector: '[data-tour="learn-tabs"]',
      title: "Learning workspace",
      description:
        "Move between your learning path, lesson cards, review queue, quizzes, and progress statistics.",
    },
    {
      selector: '[data-tour="learn-topic-path"]',
      title: "Choose a lesson",
      description:
        "Lessons are grouped by level and topic. Select any topic card to begin learning its vocabulary.",
    },
  ],
  lookup: [
    {
      selector: '[data-tour="lookup-search"]',
      title: "Search vocabulary",
      description:
        "Enter a complete word or part of a word to quickly find a sign in the vocabulary library.",
    },
    {
      selector: '[data-tour="lookup-results"]',
      title: "Choose a vocabulary card",
      description:
        "Select a matching card from this list to open its sign details.",
    },
    {
      selector: '[data-tour="lookup-video"]',
      title: "Watch the sign video",
      description:
        "Replay this video as often as needed to observe the hand shape and movement.",
    },
  ],
  translate: [
    {
      selector: '[data-tour="translate-input"]',
      title: "Enter a sentence",
      description:
        "Type a short sentence or choose an example. Supported words are converted into a visual sign sequence.",
    },
    {
      selector: '[data-tour="translate-action"]',
      title: "Translate and play",
      description:
        "Press this button to generate the sign sequence and start its animation.",
    },
    {
      selector: '[data-tour="translate-preview"]',
      title: "View the animation",
      description:
        "The generated landmark animation appears here. Missing words are reported so you can try simpler text.",
    },
  ],
  recognition: [
    {
      selector: '[data-tour="recognition-source"]',
      title: "Choose camera or upload",
      description:
        "Use your live camera for practice, or upload an image or video for recognition.",
    },
    {
      selector: '[data-tour="recognition-mode"]',
      title: "Select a recognition mode",
      description:
        "Choose Words, Alphabet, or Numbers depending on the sign you want to practice.",
    },
    {
      selector: '[data-tour="recognition-start"]',
      title: "Start recognition",
      description:
        "Press Start Recognition when ready. Camera access is requested only after you start.",
    },
  ],
  dashboard: [
    {
      selector: '[data-tour="dashboard-next-step"]',
      title: "Continue from your next step",
      description:
        "This card shows the lesson or review activity that should receive your attention next.",
    },
    {
      selector: '[data-tour="dashboard-snapshot"]',
      title: "Review your progress",
      description:
        "Track completed lessons, quiz accuracy, study streak, and recognition practice results.",
    },
    {
      selector: '[data-tour="dashboard-focus"]',
      title: "Find weak areas",
      description:
        "Use these charts and review suggestions to decide what to practice next.",
    },
  ],
};

function getTourId(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/learn")) return "learn";
  if (pathname === "/lookup") return "lookup";
  if (pathname === "/translate") return "translate";
  if (pathname === "/recognition") return "recognition";
  if (pathname === "/dashboard") return "dashboard";
  return null;
}

function hasSeenTour(tourId: string) {
  try {
    return window.localStorage.getItem(`${GUIDE_STORAGE_PREFIX}${tourId}`) === "true";
  } catch {
    return false;
  }
}

function markTourSeen(tourId: string) {
  try {
    window.localStorage.setItem(`${GUIDE_STORAGE_PREFIX}${tourId}`, "true");
  } catch {
    // The tour still works when local storage is unavailable.
  }
}

export function openFirstVisitGuide() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_GUIDE_EVENT));
  }
}

export default function FirstVisitGuide() {
  const location = useLocation();
  const tourId = getTourId(location.pathname);
  const configuredSteps = useMemo(
    () => (tourId ? pageTours[tourId] ?? [] : []),
    [tourId],
  );
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const refreshTarget = useCallback(() => {
    const step = activeSteps[stepIndex];
    if (!step) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector<HTMLElement>(step.selector);
    if (!element) {
      setTargetRect(null);
      return;
    }

    setTargetRect(element.getBoundingClientRect());
  }, [activeSteps, stepIndex]);

  const startTour = useCallback(
    (force = false) => {
      if (!tourId || configuredSteps.length === 0) return;
      if (!force && hasSeenTour(tourId)) return;

      const availableSteps = configuredSteps.filter((step) => {
        const element = document.querySelector<HTMLElement>(step.selector);
        return element && element.getBoundingClientRect().width > 0;
      });
      if (availableSteps.length === 0) return;

      setActiveSteps(availableSteps);
      setStepIndex(0);
      setIsOpen(true);
    },
    [configuredSteps, tourId],
  );

  useEffect(() => {
    setIsOpen(false);
    setActiveSteps([]);
    setStepIndex(0);
    const timeout = window.setTimeout(() => startTour(), 450);
    return () => window.clearTimeout(timeout);
  }, [startTour]);

  useEffect(() => {
    const handleOpenGuide = () => startTour(true);
    window.addEventListener(OPEN_GUIDE_EVENT, handleOpenGuide);
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, handleOpenGuide);
  }, [startTour]);

  useEffect(() => {
    if (!isOpen) return;
    const step = activeSteps[stepIndex];
    const element = step
      ? document.querySelector<HTMLElement>(step.selector)
      : null;

    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    refreshTarget();
    const timeout = window.setTimeout(refreshTarget, 350);
    window.addEventListener("resize", refreshTarget);
    window.addEventListener("scroll", refreshTarget, true);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", refreshTarget);
      window.removeEventListener("scroll", refreshTarget, true);
    };
  }, [activeSteps, isOpen, refreshTarget, stepIndex]);

  const closeTour = () => {
    if (tourId) markTourSeen(tourId);
    setIsOpen(false);
  };

  if (!isOpen || !targetRect || activeSteps.length === 0) return null;

  const step = activeSteps[stepIndex];
  const padding = 8;
  const tooltipWidth = Math.min(360, window.innerWidth - 24);
  const showBelow = targetRect.bottom + 230 < window.innerHeight;
  const tooltipTop = showBelow
    ? targetRect.bottom + 20
    : Math.max(12, targetRect.top - 220);
  const tooltipLeft = Math.min(
    Math.max(12, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
    window.innerWidth - tooltipWidth - 12,
  );
  const isLastStep = stepIndex === activeSteps.length - 1;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[81] rounded-xl border-2 border-cyan-300 bg-transparent transition-all duration-200"
        style={{
          left: targetRect.left - padding,
          top: targetRect.top - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          boxShadow:
            "0 0 0 9999px rgba(2, 6, 23, 0.65), 0 0 0 4px rgba(103, 232, 249, 0.25)",
        }}
      />
      <section
        className="fixed z-[82] rounded-2xl border border-cyan-100 bg-white p-5 text-slate-900 shadow-2xl dark:border-cyan-900 dark:bg-slate-950 dark:text-white"
        style={{ left: tooltipLeft, top: tooltipTop, width: tooltipWidth }}
        role="dialog"
        aria-live="polite"
        aria-label="Page usage guide"
      >
        <span
          className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-x-transparent ${
            showBelow
              ? "-top-[10px] border-b-[10px] border-b-white dark:border-b-slate-950"
              : "-bottom-[10px] border-t-[10px] border-t-white dark:border-t-slate-950"
          }`}
        />
        <button
          type="button"
          onClick={closeTour}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white"
          aria-label="Close guide"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
          Guide {stepIndex + 1}/{activeSteps.length}
        </p>
        <h2 className="mt-2 pr-6 text-lg font-bold">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {step.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={closeTour}>
            Skip
          </Button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (isLastStep) {
                  closeTour();
                  return;
                }
                setStepIndex((current) => current + 1);
              }}
            >
              {isLastStep ? "Done" : "Next"}
              {!isLastStep && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
