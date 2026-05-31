import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Clock3,
  Gauge,
  GraduationCap,
  Hand,
  LineChart,
  Play,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Interactive Lessons",
    description:
      "Visual-first lessons designed for natural, confident learning.",
    color: "violet",
    className: "ssl-feature-lessons",
  },
  {
    icon: ScanLine,
    title: "AI Recognition",
    description: "Real-time hand tracking with instant gesture feedback.",
    color: "cyan",
    className: "ssl-feature-recognition",
  },
  {
    icon: LineChart,
    title: "Learning Analytics",
    description: "Clear insights that reveal your strongest next step.",
    color: "mint",
    className: "ssl-feature-analytics",
  },
  {
    icon: Target,
    title: "Progress Tracking",
    description: "Build momentum with goals, streaks, and milestones.",
    color: "violet",
    className: "ssl-feature-progress",
  },
] as const;

const stats = [
  { icon: Users, value: "12K+", label: "Total learners", accent: "violet" },
  {
    icon: GraduationCap,
    value: "84K",
    label: "Lessons completed",
    accent: "mint",
  },
  {
    icon: Gauge,
    value: "96.8%",
    label: "Recognition accuracy",
    accent: "cyan",
  },
  { icon: Clock3, value: "21K", label: "Practice hours", accent: "violet" },
] as const;

const journey = [
  {
    icon: BookOpen,
    step: "01",
    title: "Learn",
    description: "Explore guided visual lessons and essential vocabulary.",
  },
  {
    icon: Hand,
    step: "02",
    title: "Practice",
    description: "Build muscle memory through focused repetition.",
  },
  {
    icon: ScanLine,
    step: "03",
    title: "Recognize",
    description: "Use AI feedback to refine every movement.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Master",
    description: "Track progress and communicate with confidence.",
  },
] as const;

const handLandmarks = [
  [160, 315],
  [126, 272],
  [102, 228],
  [84, 184],
  [70, 142],
  [166, 246],
  [159, 191],
  [156, 140],
  [157, 94],
  [194, 238],
  [198, 176],
  [203, 119],
  [208, 67],
  [223, 246],
  [235, 190],
  [247, 140],
  [257, 97],
  [251, 263],
  [275, 226],
  [294, 193],
  [310, 163],
] as const;

const handConnections = [
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

function FeatureIcon({
  icon: Icon,
  color,
}: {
  icon: typeof BookOpen;
  color: string;
}) {
  return (
    <div className={`ssl-icon ssl-icon-${color}`}>
      <Icon size={18} strokeWidth={2.2} />
    </div>
  );
}

function HandTrackingIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 390 420"
      className={compact ? "h-full w-full" : "ssl-hand-svg"}
      role="img"
      aria-label="AI hand tracking illustration"
    >
      <defs>
        <linearGradient id="hand-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e9ff" />
          <stop offset="48%" stopColor="#e8d4ff" />
          <stop offset="100%" stopColor="#c5f6e9" />
        </linearGradient>
        <linearGradient id="hand-edge" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="hand-shadow" x="-30%" y="-20%" width="170%" height="180%">
          <feDropShadow
            dx="0"
            dy="22"
            stdDeviation="18"
            floodColor="#7c3aed"
            floodOpacity=".2"
          />
        </filter>
        <filter id="node-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity=".42" stroke="#06b6d4" strokeDasharray="5 8">
        <path d="M30 71h92M278 42h68M292 340h71M21 350h82" />
        <circle cx="43" cy="71" r="4" fill="#06b6d4" />
        <circle cx="340" cy="42" r="4" fill="#34d399" />
        <circle cx="354" cy="340" r="4" fill="#8b5cf6" />
      </g>

      <path
        d="M151 367c-18-39-35-67-55-93-17-23-8-48 9-51 12-2 23 9 37 26l-22-102c-4-20 5-34 20-35 13-1 22 8 27 27l12 58-1-114c0-21 11-34 27-33 15 1 23 13 22 34l-2 111 17-91c4-20 15-30 30-27 14 3 19 17 15 36l-16 91 23-56c8-18 20-25 34-19 14 6 16 21 8 40l-35 89c-8 21-20 42-37 61-14 17-21 37-20 60l1 21-104 1z"
        fill="url(#hand-fill)"
        stroke="url(#hand-edge)"
        strokeWidth="3"
        filter="url(#hand-shadow)"
      />
      <path
        d="M149 366c24-17 63-25 105-5M142 250c15 19 22 39 24 61M178 198l15 86M225 195l-5 86M271 204l-25 86"
        fill="none"
        stroke="#a78bfa"
        strokeLinecap="round"
        strokeWidth="2"
        opacity=".32"
      />

      <g stroke="#06b6d4" strokeLinecap="round" strokeWidth="2" opacity=".8">
        {handConnections.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={handLandmarks[from][0]}
            y1={handLandmarks[from][1]}
            x2={handLandmarks[to][0]}
            y2={handLandmarks[to][1]}
          />
        ))}
      </g>
      <g filter="url(#node-glow)">
        {handLandmarks.map(([x, y], index) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={index === 0 ? 6 : 4}
            fill={index % 3 === 0 ? "#34d399" : "#06b6d4"}
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}
      </g>
    </svg>
  );
}

function RecognitionPreview() {
  return (
    <div className="ssl-recognition-shell">
      <div className="ssl-recognition-toolbar">
        <div className="flex items-center gap-2">
          <span className="ssl-live-dot" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Live AI Recognition
          </span>
        </div>
        <span className="rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
          Camera active
        </span>
      </div>
      <div className="ssl-camera-screen">
        <div className="ssl-camera-grid" />
        <div className="ssl-camera-corner ssl-camera-corner-tl" />
        <div className="ssl-camera-corner ssl-camera-corner-tr" />
        <div className="ssl-camera-corner ssl-camera-corner-bl" />
        <div className="ssl-camera-corner ssl-camera-corner-br" />
        <div className="absolute inset-y-4 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent" />
        <div className="absolute inset-x-4 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
        <div className="ssl-preview-hand">
          <HandTrackingIllustration compact />
        </div>
        <div className="ssl-scan-line" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
          <Activity size={13} className="text-emerald-300" />
          21 landmarks tracked
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Gesture translation
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              Hello
            </p>
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Confidence
            </p>
            <span className="text-sm font-bold text-emerald-600">96.8%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full w-[96.8%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();

  const handleNavigate = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      <div className="ssl-landing">
        <style>{`
          @keyframes ssl-float {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -12px, 0); }
          }
          @keyframes ssl-float-soft {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
            50% { transform: translate3d(0, -8px, 0) rotate(1deg); }
          }
          @keyframes ssl-pulse {
            0%, 100% { opacity: .45; transform: scale(.92); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          @keyframes ssl-scan {
            0% { transform: translateY(-150px); opacity: 0; }
            15%, 85% { opacity: 1; }
            100% { transform: translateY(240px); opacity: 0; }
          }
          .ssl-landing {
            overflow: hidden;
            color: #1e293b;
            background: #fbfdff;
          }
          .dark .ssl-landing { color: #e2e8f0; background: #07111f; }
          .ssl-hero {
            position: relative;
            isolation: isolate;
            min-height: 820px;
            overflow: hidden;
            background:
              radial-gradient(circle at 75% 36%, rgba(139, 92, 246, .2), transparent 28%),
              radial-gradient(circle at 87% 13%, rgba(6, 182, 212, .15), transparent 24%),
              radial-gradient(circle at 23% 80%, rgba(52, 211, 153, .12), transparent 30%),
              linear-gradient(145deg, #fbfdff 0%, #f7f5ff 53%, #effcff 100%);
          }
          .dark .ssl-hero {
            background:
              radial-gradient(circle at 75% 36%, rgba(139, 92, 246, .22), transparent 28%),
              radial-gradient(circle at 87% 13%, rgba(6, 182, 212, .14), transparent 24%),
              linear-gradient(145deg, #07111f 0%, #10112b 54%, #061c28 100%);
          }
          .ssl-grid {
            position: absolute;
            inset: 0;
            z-index: -1;
            opacity: .52;
            background-image: linear-gradient(rgba(139, 92, 246, .07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, .07) 1px, transparent 1px);
            background-size: 54px 54px;
            mask-image: linear-gradient(to bottom, black, transparent 88%);
          }
          .ssl-orb { position: absolute; border-radius: 9999px; filter: blur(1px); }
          .ssl-particle { position: absolute; width: 7px; height: 7px; border-radius: 50%; animation: ssl-pulse 3s ease-in-out infinite; }
          .ssl-glass {
            border: 1px solid rgba(255, 255, 255, .74);
            background: rgba(255, 255, 255, .62);
            box-shadow: 0 24px 60px rgba(76, 29, 149, .11), inset 0 1px 0 rgba(255,255,255,.7);
            backdrop-filter: blur(22px);
          }
          .dark .ssl-glass { border-color: rgba(255,255,255,.12); background: rgba(15,23,42,.56); }
          .ssl-visual { min-height: 630px; perspective: 1400px; }
          .ssl-holo-frame {
            position: absolute;
            inset: 62px 62px 56px 76px;
            border: 1px solid rgba(6, 182, 212, .34);
            border-radius: 42% 58% 46% 54% / 42% 45% 55% 58%;
            background: radial-gradient(circle, rgba(255,255,255,.35), rgba(255,255,255,.06) 58%, transparent 70%);
            box-shadow: 0 0 0 14px rgba(139, 92, 246, .04), 0 0 85px rgba(6,182,212,.17);
            transform: rotate(-6deg);
          }
          .ssl-hand-svg { position: absolute; z-index: 10; inset: 70px auto auto 93px; width: 390px; height: 470px; animation: ssl-float 5.5s ease-in-out infinite; }
          .ssl-neural-line { position: absolute; z-index: 4; height: 1px; transform-origin: left; background: linear-gradient(90deg, rgba(6,182,212,.65), rgba(139,92,246,.08)); }
          .ssl-widget { position: absolute; z-index: 30; border-radius: 20px; padding: 14px 16px; animation: ssl-float-soft 5s ease-in-out infinite; }
          .ssl-widget-a { top: 76px; right: 8px; width: 185px; }
          .ssl-widget-b { top: 285px; left: -18px; width: 176px; animation-delay: -1.5s; }
          .ssl-widget-c { right: -8px; bottom: 78px; width: 190px; animation-delay: -2.6s; }
          .ssl-widget-d { left: 84px; bottom: 20px; width: 174px; animation-delay: -3.8s; }
          .ssl-icon { display: flex; height: 40px; width: 40px; align-items: center; justify-content: center; border-radius: 13px; }
          .ssl-icon-violet { color: #7c3aed; background: rgba(139,92,246,.12); }
          .ssl-icon-cyan { color: #0891b2; background: rgba(6,182,212,.12); }
          .ssl-icon-mint { color: #059669; background: rgba(52,211,153,.14); }
          .ssl-stat { transition: transform .35s ease, box-shadow .35s ease; }
          .ssl-stat:hover { transform: translateY(-8px); box-shadow: 0 28px 64px rgba(76, 29, 149, .14); }
          .ssl-recognition-shell {
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.24);
            border-radius: 28px;
            background: rgba(255,255,255,.7);
            box-shadow: 0 32px 90px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.8);
            backdrop-filter: blur(20px);
          }
          .dark .ssl-recognition-shell { border-color: rgba(255,255,255,.1); background: rgba(15,23,42,.72); }
          .ssl-recognition-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; }
          .ssl-live-dot { width: 9px; height: 9px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 5px rgba(52,211,153,.15), 0 0 18px rgba(52,211,153,.8); animation: ssl-pulse 1.8s ease-in-out infinite; }
          .ssl-camera-screen { position: relative; min-height: 360px; overflow: hidden; background: radial-gradient(circle at 50% 48%, #183449, #08151f 70%); }
          .ssl-camera-grid { position: absolute; inset: 0; opacity: .24; background-image: linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px); background-size: 30px 30px; }
          .ssl-camera-corner { position: absolute; width: 32px; height: 32px; border-color: #22d3ee; opacity: .9; }
          .ssl-camera-corner-tl { top: 16px; left: 16px; border-top: 2px solid; border-left: 2px solid; }
          .ssl-camera-corner-tr { top: 16px; right: 16px; border-top: 2px solid; border-right: 2px solid; }
          .ssl-camera-corner-bl { bottom: 16px; left: 16px; border-bottom: 2px solid; border-left: 2px solid; }
          .ssl-camera-corner-br { bottom: 16px; right: 16px; border-bottom: 2px solid; border-right: 2px solid; }
          .ssl-preview-hand { position: absolute; bottom: -118px; left: 50%; height: 480px; width: 440px; transform: translateX(-48%); }
          .ssl-scan-line { position: absolute; left: 8%; right: 8%; top: 45%; height: 1px; background: linear-gradient(90deg, transparent, rgba(34,211,238,.9), transparent); box-shadow: 0 0 20px #22d3ee; animation: ssl-scan 3.4s linear infinite; }
          .ssl-feature-card { position: relative; overflow: hidden; min-height: 230px; transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease; }
          .ssl-feature-card:hover { transform: translateY(-10px); border-color: rgba(139,92,246,.28); box-shadow: 0 28px 70px rgba(76,29,149,.12); }
          .ssl-feature-card:after { content: ""; position: absolute; width: 120px; height: 120px; right: -38px; bottom: -52px; border-radius: 50%; background: rgba(139,92,246,.08); filter: blur(4px); }
          .ssl-path { position: absolute; top: 42px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, #8b5cf6, #06b6d4, #34d399); opacity: .4; }
          @media (max-width: 1023px) {
            .ssl-hero { min-height: auto; }
            .ssl-visual { min-height: 580px; margin: 0 auto; max-width: 590px; }
          }
          @media (max-width: 639px) {
            .ssl-visual { min-height: 475px; transform: scale(.9); transform-origin: top center; margin-bottom: -48px; }
            .ssl-holo-frame { inset: 55px 30px 44px 38px; }
            .ssl-hand-svg { left: 32px; top: 45px; width: 320px; height: 410px; }
            .ssl-widget { padding: 10px 11px; border-radius: 16px; }
            .ssl-widget-a { right: -4px; top: 52px; width: 152px; }
            .ssl-widget-b { left: -6px; top: 245px; width: 145px; }
            .ssl-widget-c { right: -8px; bottom: 58px; width: 154px; }
            .ssl-widget-d { display: none; }
            .ssl-camera-screen { min-height: 300px; }
            .ssl-preview-hand { bottom: -118px; height: 420px; width: 380px; }
          }
        `}</style>

        <section className="ssl-hero">
          <div className="ssl-grid" />
          <div className="ssl-orb left-[7%] top-28 h-40 w-40 bg-violet-300/20 blur-3xl" />
          <div className="ssl-orb bottom-16 right-[8%] h-48 w-48 bg-emerald-300/20 blur-3xl" />
          <span className="ssl-particle left-[9%] top-[31%] bg-violet-400" />
          <span className="ssl-particle left-[48%] top-[17%] bg-cyan-400 [animation-delay:-1s]" />
          <span className="ssl-particle bottom-[18%] left-[41%] bg-emerald-400 [animation-delay:-2s]" />
          <span className="ssl-particle right-[5%] top-[44%] bg-violet-400 [animation-delay:-1.5s]" />

          <div className="relative z-20 mx-auto grid max-w-7xl gap-6 px-6 pb-12 pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:pb-20 lg:pt-24">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-700 shadow-sm backdrop-blur dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-300">
                <BrainCircuit size={15} />
                AI-powered visual learning
              </div>
              <h1 className="text-5xl font-bold leading-[1.04] tracking-[-0.065em] text-slate-950 dark:text-white sm:text-6xl lg:text-[76px]">
                Learn Sign
                <span className="block bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  Language with AI
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                Master sign language through visual lessons, intelligent
                practice, and real-time gesture recognition built to make every
                movement count.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => handleNavigate("/learn")}
                  className="h-14 gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 px-7 text-base font-bold text-white shadow-[0_16px_34px_rgba(124,58,237,.28)] transition-transform hover:scale-[1.03]"
                >
                  Start Learning
                  <ArrowRight size={18} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleNavigate("/recognition")}
                  className="h-14 gap-2 rounded-full border-white/80 bg-white/70 px-7 text-base font-bold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,.06)] backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <ScanLine size={18} className="text-cyan-500" />
                  Try AI Recognition
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-500" />
                  Accessible by design
                </span>
                <span className="flex items-center gap-2">
                  <Zap size={17} className="text-amber-500" />
                  Real-time feedback
                </span>
              </div>
            </div>

            <div className="ssl-visual relative">
              <div className="ssl-holo-frame" />
              <div className="ssl-neural-line left-[5%] top-[27%] w-[180px] rotate-[22deg]" />
              <div className="ssl-neural-line right-[2%] top-[30%] w-[170px] rotate-[158deg]" />
              <div className="ssl-neural-line bottom-[23%] right-[4%] w-[160px] rotate-[202deg]" />
              <HandTrackingIllustration />

              {features.map((feature) => (
                <div
                  key={feature.title}
                  className={`ssl-widget ssl-glass ${feature.className}`}
                >
                  <div className="flex items-center gap-3">
                    <FeatureIcon icon={feature.icon} color={feature.color} />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {feature.title === "AI Recognition"
                          ? "96.8% accuracy"
                          : feature.title === "Progress Tracking"
                            ? "12 day streak"
                            : "Personalized"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-1 border-y border-slate-200/60 bg-white/70 py-8 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {stats.map(({ icon: Icon, value, label, accent }) => (
              <div
                key={label}
                className="ssl-stat ssl-glass flex items-center gap-4 rounded-2xl p-4"
              >
                <FeatureIcon icon={Icon} color={accent} />
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {value}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative bg-gradient-to-b from-white to-violet-50/50 py-24 dark:from-slate-950 dark:to-slate-900">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300">
                Learn smarter
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
                Everything you need to progress
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-slate-500 dark:text-slate-400">
                A focused learning ecosystem that turns complex gestures into a
                clear, encouraging daily practice.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="ssl-feature-card ssl-glass rounded-[26px] p-6"
                >
                  <FeatureIcon icon={feature.icon} color={feature.color} />
                  <h3 className="mt-8 text-lg font-bold text-slate-950 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleNavigate(
                        feature.title === "Interactive Lessons"
                          ? "/learn"
                          : feature.title === "AI Recognition"
                            ? "/recognition"
                            : "/dashboard",
                      )
                    }
                    className="relative z-10 mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-violet-600 transition-colors hover:text-violet-800 dark:text-violet-300"
                  >
                    Explore
                    <ArrowRight size={14} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-slate-200/70 bg-slate-50 py-24 dark:border-white/10 dark:bg-slate-950">
          <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-violet-300/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Camera size={15} />
                Intelligent practice
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
                See your progress
                <span className="block text-cyan-500">in real time.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 dark:text-slate-400">
                Our AI follows your hand position and movement, turning your
                camera into a calm, private practice companion with actionable
                feedback.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Landmark-based gesture detection",
                  "Instant confidence scoring",
                  "Private camera-first learning",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 size={19} className="text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                onClick={() => handleNavigate("/recognition")}
                className="mt-9 h-13 gap-2 rounded-full bg-slate-900 px-6 font-bold text-white shadow-xl hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Open AI Recognition
                <ArrowRight size={17} />
              </Button>
            </div>
            <RecognitionPreview />
          </div>
        </section>

        <section className="relative bg-white py-24 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
                Learning journey
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
                A clear path to confidence
              </h2>
            </div>
            <div className="relative mt-16 grid gap-8 md:grid-cols-4">
              <div className="ssl-path hidden md:block" />
              {journey.map(({ icon: Icon, step, title, description }) => (
                <article key={step} className="relative z-10 text-center">
                  <div className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-[26px] border border-white bg-white text-violet-600 shadow-[0_16px_45px_rgba(76,29,149,.13)] transition-transform duration-300 hover:-translate-y-2 dark:border-white/10 dark:bg-slate-800 dark:text-violet-300">
                    <Icon size={27} />
                  </div>
                  <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-500">
                    Step {step}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                    {title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[240px] text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 dark:bg-slate-900 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 px-7 py-14 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,.28)] sm:px-12">
            <div className="absolute -left-10 -top-20 h-56 w-56 rounded-full border border-white/20" />
            <div className="absolute -right-14 -top-8 h-72 w-72 rounded-full border border-white/15" />
            <Sparkles className="mx-auto h-8 w-8 text-emerald-200" />
            <h2 className="relative mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Start your learning journey today
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-white/80 sm:text-base">
              Practice at your own pace with accessible lessons, AI guidance,
              and progress you can see.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => handleNavigate("/learn")}
                className="h-13 gap-2 rounded-full bg-white px-7 font-bold text-violet-700 shadow-lg hover:bg-violet-50"
              >
                <Play size={17} fill="currentColor" />
                Start Learning
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigate("/translate")}
                className="h-13 rounded-full border-white/35 bg-white/10 px-7 font-bold text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                Explore Translation
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
