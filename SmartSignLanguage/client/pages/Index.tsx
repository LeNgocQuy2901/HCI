import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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

function LogoIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/img/logo2.png"
      alt="SmartSignLanguage AI hand tracking logo"
      className={compact ? "ssl-preview-logo" : "ssl-hero-logo"}
    />
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HeroDepthScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 18 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 18 });
  const rotateY = useTransform(smoothX, [-1, 1], [-8, 8]);
  const rotateX = useTransform(smoothY, [-1, 1], [7, -7]);
  const foregroundX = useTransform(smoothX, [-1, 1], [-16, 16]);
  const foregroundY = useTransform(smoothY, [-1, 1], [-12, 12]);
  const backgroundX = useTransform(smoothX, [-1, 1], [8, -8]);
  const backgroundY = useTransform(smoothY, [-1, 1], [6, -6]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = sceneRef.current?.getBoundingClientRect();
    if (!bounds) return;
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={sceneRef}
      className="ssl-visual relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <motion.div className="ssl-scene-plane" style={{ rotateX, rotateY }}>
        <motion.div
          className="ssl-scene-particles"
          style={{ x: backgroundX, y: backgroundY, z: -72 }}
        >
          <span className="ssl-depth-particle ssl-depth-particle-a" />
          <span className="ssl-depth-particle ssl-depth-particle-b" />
          <span className="ssl-depth-particle ssl-depth-particle-c" />
          <span className="ssl-depth-particle ssl-depth-particle-d" />
          <span className="ssl-depth-particle ssl-depth-particle-e" />
        </motion.div>
        <motion.div
          className="ssl-holo-frame"
          style={{ x: backgroundX, y: backgroundY, rotate: -6, z: -36 }}
        />
        <div className="ssl-neural-line ssl-neural-line-a left-[5%] top-[27%] w-[180px] rotate-[22deg]" />
        <div className="ssl-neural-line ssl-neural-line-b right-[2%] top-[30%] w-[170px] rotate-[158deg]" />
        <div className="ssl-neural-line ssl-neural-line-c bottom-[23%] right-[4%] w-[160px] rotate-[202deg]" />
        <motion.div
          className="ssl-hero-logo-plane"
          style={{ x: foregroundX, y: foregroundY, z: 72 }}
        >
          <LogoIllustration />
          <span className="ssl-landmark-ping ssl-landmark-ping-a" />
          <span className="ssl-landmark-ping ssl-landmark-ping-b" />
          <span className="ssl-landmark-ping ssl-landmark-ping-c" />
          <span className="ssl-landmark-ping ssl-landmark-ping-d" />
        </motion.div>

        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className={`ssl-widget ssl-glass ${feature.className}`}
            style={{
              x: index % 2 === 0 ? foregroundX : backgroundX,
              y: index % 2 === 0 ? foregroundY : backgroundY,
              z: 86 + index * 16,
            }}
            whileHover={{ scale: 1.06, rotateY: index % 2 === 0 ? 7 : -7 }}
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
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function RecognitionPreview() {
  return (
    <motion.div
      className="ssl-recognition-shell"
      whileHover={{ rotateX: 2.5, rotateY: -3.5, y: -8 }}
      transition={{ type: "spring", stiffness: 170, damping: 18 }}
    >
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
          <LogoIllustration compact />
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
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <div className="ssl-dashboard-stage">
      <motion.div
        className="ssl-dashboard-preview ssl-glass"
        initial={{ opacity: 0, rotateX: 14, rotateY: -12, y: 36 }}
        whileInView={{ opacity: 1, rotateX: 8, rotateY: -8, y: 0 }}
        whileHover={{ rotateX: 3, rotateY: -3, y: -12 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 p-5 dark:border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              Learning analytics
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
              Weekly progress
            </h3>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
            <BarChart3 size={20} />
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-2xl border border-slate-200/70 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-32 items-end gap-3">
              {[42, 58, 51, 72, 66, 88, 94].map((height, index) => (
                <motion.div
                  key={`${height}-${index}`}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-violet-500 to-cyan-400"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${height}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-bold text-slate-400">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                Mastery
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                86%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                Current streak
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-600">12 days</p>
            </div>
          </div>
        </div>
      </motion.div>
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
          @keyframes ssl-gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes ssl-line-flow {
            0% { background-position: 0% 50%; opacity: .35; }
            50% { opacity: 1; }
            100% { background-position: 180% 50%; opacity: .35; }
          }
          @keyframes ssl-landmark-ping {
            0%, 100% { transform: scale(.72); opacity: .48; }
            50% { transform: scale(1.4); opacity: 1; }
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
            background-size: 130% 130%;
            animation: ssl-gradient-shift 15s ease-in-out infinite;
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
          .ssl-scene-plane { position: absolute; inset: 0; transform-style: preserve-3d; will-change: transform; }
          .ssl-scene-particles { position: absolute; inset: 0; transform-style: preserve-3d; }
          .ssl-depth-particle { position: absolute; height: 8px; width: 8px; border-radius: 50%; background: #06b6d4; box-shadow: 0 0 18px rgba(6,182,212,.9); animation: ssl-pulse 3s ease-in-out infinite; }
          .ssl-depth-particle-a { left: 8%; top: 17%; }
          .ssl-depth-particle-b { right: 12%; top: 20%; height: 11px; width: 11px; background: #8b5cf6; animation-delay: -.8s; }
          .ssl-depth-particle-c { left: 16%; bottom: 20%; background: #34d399; animation-delay: -1.6s; }
          .ssl-depth-particle-d { right: 20%; bottom: 13%; background: #f9a8d4; animation-delay: -2.1s; }
          .ssl-depth-particle-e { right: 44%; top: 9%; height: 6px; width: 6px; background: #34d399; animation-delay: -2.7s; }
          .ssl-holo-frame {
            position: absolute;
            inset: 62px 62px 56px 76px;
            border: 1px solid rgba(6, 182, 212, .34);
            border-radius: 42% 58% 46% 54% / 42% 45% 55% 58%;
            background: radial-gradient(circle, rgba(255,255,255,.35), rgba(255,255,255,.06) 58%, transparent 70%);
            box-shadow: 0 0 0 14px rgba(139, 92, 246, .04), 0 0 85px rgba(6,182,212,.17);
            transform-style: preserve-3d;
          }
          .ssl-hero-logo-plane { position: absolute; z-index: 10; inset: 104px auto auto 78px; width: 430px; height: 430px; transform-style: preserve-3d; will-change: transform; }
          .ssl-hero-logo { height: 100%; width: 100%; border-radius: 42px; object-fit: cover; box-shadow: 0 34px 65px rgba(76,29,149,.2), 0 0 0 1px rgba(255,255,255,.55), 0 0 72px rgba(6,182,212,.16); animation: ssl-float 5.5s ease-in-out infinite; }
          .ssl-landmark-ping { position: absolute; z-index: 12; height: 11px; width: 11px; border: 2px solid white; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 7px rgba(52,211,153,.14), 0 0 18px #34d399; animation: ssl-landmark-ping 2.4s ease-in-out infinite; }
          .ssl-landmark-ping-a { left: 47%; top: 26%; }
          .ssl-landmark-ping-b { left: 63%; top: 42%; animation-delay: -.65s; }
          .ssl-landmark-ping-c { left: 39%; top: 60%; animation-delay: -1.2s; }
          .ssl-landmark-ping-d { left: 54%; top: 70%; animation-delay: -1.8s; }
          .ssl-neural-line { position: absolute; z-index: 4; height: 2px; transform-origin: left; background: linear-gradient(90deg, transparent, rgba(6,182,212,.95), rgba(139,92,246,.2), transparent); background-size: 180% 100%; box-shadow: 0 0 12px rgba(6,182,212,.42); animation: ssl-line-flow 3.8s linear infinite; }
          .ssl-neural-line-b { animation-delay: -1.2s; }
          .ssl-neural-line-c { animation-delay: -2.4s; }
          .ssl-widget { position: absolute; z-index: 30; border-radius: 20px; padding: 14px 16px; transform-style: preserve-3d; will-change: transform; }
          .ssl-widget-a { top: 76px; right: 8px; width: 185px; }
          .ssl-widget-b { top: 285px; left: -18px; width: 176px; animation-delay: -1.5s; }
          .ssl-widget-c { right: -8px; bottom: 78px; width: 190px; animation-delay: -2.6s; }
          .ssl-widget-d { left: 84px; bottom: 20px; width: 174px; animation-delay: -3.8s; }
          .ssl-icon { display: flex; height: 40px; width: 40px; align-items: center; justify-content: center; border-radius: 13px; }
          .ssl-icon-violet { color: #7c3aed; background: rgba(139,92,246,.12); }
          .ssl-icon-cyan { color: #0891b2; background: rgba(6,182,212,.12); }
          .ssl-icon-mint { color: #059669; background: rgba(52,211,153,.14); }
          .ssl-stat { transform-style: preserve-3d; transition: transform .35s ease, box-shadow .35s ease; }
          .ssl-stat:hover { transform: translateY(-8px) rotateX(5deg) rotateY(-4deg); box-shadow: 0 28px 64px rgba(76, 29, 149, .14); }
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
          .ssl-preview-hand { position: absolute; inset: 30px 44px 28px; overflow: hidden; border-radius: 22px; box-shadow: 0 0 44px rgba(6,182,212,.18); }
          .ssl-preview-logo { height: 100%; width: 100%; object-fit: cover; opacity: .9; }
          .ssl-scan-line { position: absolute; left: 8%; right: 8%; top: 45%; height: 1px; background: linear-gradient(90deg, transparent, rgba(34,211,238,.9), transparent); box-shadow: 0 0 20px #22d3ee; animation: ssl-scan 3.4s linear infinite; }
          .ssl-feature-card { position: relative; overflow: hidden; min-height: 230px; transform-style: preserve-3d; transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease; }
          .ssl-feature-card:hover { transform: perspective(900px) translateY(-10px) rotateX(6deg) rotateY(-4deg); border-color: rgba(139,92,246,.28); box-shadow: 0 28px 70px rgba(76,29,149,.12); }
          .ssl-feature-card:after { content: ""; position: absolute; width: 120px; height: 120px; right: -38px; bottom: -52px; border-radius: 50%; background: rgba(139,92,246,.08); filter: blur(4px); }
          .ssl-path { position: absolute; top: 42px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, #8b5cf6, #06b6d4, #34d399); opacity: .4; }
          .ssl-dashboard-stage { perspective: 1400px; }
          .ssl-dashboard-preview { overflow: hidden; border-radius: 28px; transform-style: preserve-3d; box-shadow: 0 34px 80px rgba(76,29,149,.16); }
          .ssl-landing button { transform-style: preserve-3d; transition: transform .3s ease, box-shadow .3s ease, background-color .3s ease; }
          .ssl-landing button:hover { transform: translateY(-3px) translateZ(14px); }
          @media (max-width: 1023px) {
            .ssl-hero { min-height: auto; }
            .ssl-visual { min-height: 580px; margin: 0 auto; max-width: 590px; }
          }
          @media (max-width: 639px) {
            .ssl-visual { min-height: 475px; transform: scale(.9); transform-origin: top center; margin-bottom: -48px; }
            .ssl-holo-frame { inset: 55px 30px 44px 38px; }
            .ssl-hero-logo-plane { left: 34px; top: 76px; width: 330px; height: 330px; }
            .ssl-hero-logo { border-radius: 30px; }
            .ssl-widget { padding: 10px 11px; border-radius: 16px; }
            .ssl-widget-a { right: -4px; top: 52px; width: 152px; }
            .ssl-widget-b { left: -6px; top: 245px; width: 145px; }
            .ssl-widget-c { right: -8px; bottom: 58px; width: 154px; }
            .ssl-widget-d { display: none; }
            .ssl-camera-screen { min-height: 300px; }
            .ssl-preview-hand { inset: 24px 22px 24px; }
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
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, x: -34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, x: 28 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                duration: 1,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <HeroDepthScene />
            </motion.div>
          </div>
        </section>

        <section className="relative z-20 -mt-1 border-y border-slate-200/60 bg-white/70 py-8 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45">
          <Reveal className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
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
          </Reveal>
        </section>

        <section className="relative bg-gradient-to-b from-white to-violet-50/50 py-24 dark:from-slate-950 dark:to-slate-900">
          <Reveal className="mx-auto max-w-7xl px-6 lg:px-8">
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
          </Reveal>
        </section>

        <section className="relative overflow-hidden bg-white py-24 dark:bg-slate-900">
          <div className="absolute left-[12%] top-12 h-64 w-64 rounded-full bg-pink-200/20 blur-3xl dark:bg-pink-500/10" />
          <div className="absolute right-[8%] top-20 h-72 w-72 rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-500/10" />
          <Reveal className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300">
                Progress with clarity
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
                A dashboard that keeps
                <span className="block text-violet-600 dark:text-violet-300">
                  learning in motion.
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 dark:text-slate-400">
                See your weekly rhythm, mastery level, and streak in one calm
                workspace designed to make the next lesson obvious.
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleNavigate("/dashboard")}
                className="mt-8 h-13 gap-2 rounded-full border-violet-200 bg-white/70 px-6 font-bold text-violet-700 shadow-lg shadow-violet-950/5 backdrop-blur hover:bg-violet-50 dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-200 dark:hover:bg-white/10"
              >
                Explore Dashboard
                <ArrowRight size={17} />
              </Button>
            </div>
            <DashboardPreview />
          </Reveal>
        </section>

        <section className="relative overflow-hidden border-y border-slate-200/70 bg-slate-50 py-24 dark:border-white/10 dark:bg-slate-950">
          <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-violet-300/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
          <Reveal className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
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
          </Reveal>
        </section>

        <section className="relative bg-white py-24 dark:bg-slate-900">
          <Reveal className="mx-auto max-w-7xl px-6 lg:px-8">
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
          </Reveal>
        </section>

        <section className="px-6 pb-24 dark:bg-slate-900 lg:px-8">
          <motion.div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 px-7 py-14 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,.28)] sm:px-12"
            initial={{ opacity: 0, y: 34, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -7, scale: 1.008 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
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
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
