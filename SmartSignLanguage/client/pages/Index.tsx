import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/hooks/use-auth";
import {
  BookOpen,
  Zap,
  Tv,
  BarChart3,
  Video,
  Star,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  Compass,
  Rocket,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const features = [
    {
      icon: BookOpen,
      title: "Vocabulary Practice",
      label: "Most Popular",
      description:
        "Practice sign language with a focused vocabulary library and interactive lessons at your own pace.",
      href: "/learn",
      bullets: ["Focused vocabulary library", "Interactive lessons", "Self-paced study"],
    },
    {
      icon: Zap,
      title: "Text to Sign Translation",
      label: "Highly Accurate",
      description:
        "Translate between text and sign language for communication and learning.",
      href: "/translate",
      bullets: ["Bi-directional translation", "Instant results", "Easy communication"],
    },
    {
      icon: Tv,
      title: "Realtime Recognition",
      label: "AI-Powered",
      description:
        "Use the AI camera to recognize signs in real time and see instant results.",
      href: "/recognition",
      bullets: ["Smart webcam tracking", "Real-time AI recognition", "Instant grading"],
    },
    {
      icon: BarChart3,
      title: "Learning Dashboard",
      label: "Best Analytics",
      description:
        "Track progress, weak topics, quiz accuracy, and recognition improvement.",
      href: "/dashboard",
      bullets: ["Detailed progress tracking", "Accuracy analytics", "Weak topic analyzer"],
    },
  ];

  const benefits = [
    {
      title: "Free and accessible to everyone",
      desc: "Learn without barriers. Our core educational resources are fully open to all learners.",
      icon: "🎁",
    },
    {
      title: "Works on every device",
      desc: "Seamlessly study on phones, tablets, or desktops with our highly responsive platform.",
      icon: "📱",
    },
    {
      title: "Offline learning mode",
      desc: "Download lessons in advance and keep practicing sign language anywhere, anytime.",
      icon: "🔌",
    },
    {
      title: "Track progress and achievements",
      desc: "Stay motivated with customized daily goals, streaks, and milestone indicators.",
      icon: "🏆",
    },
    {
      title: "Structured learning analytics",
      desc: "Deep dive into accuracy metrics per vocabulary group and improve recognition day by day.",
      icon: "📊",
    },
    {
      title: "Frequent updates and new content",
      desc: "Access brand-new vocabulary packs, seasonal games, and advanced lessons every single week.",
      icon: "🔄",
    },
  ];

  // Hàm hỗ trợ trượt màn hình mượt mà (Smooth Scroll)
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleStartForFree = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExploreModule = (href) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  const handleNavigateToTop = (href) => {
    navigate(href);
    window.scrollTo({ top: 0 });
  };

  return (
    <Layout>
      <div className="bg-background font-sans text-slate-700 dark:text-slate-200 antialiased selection:bg-[#0056d2] selection:text-white">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#eef5ff] via-[#f4f8ff] to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-20 lg:py-28 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-8">
            <div className="space-y-6">
              <div className="flex justify-center">
                <img
                  src="/img/logo2.png"
                  alt="Smart Sign Language logo"
                  className="h-20 w-20 md:h-24 md:w-24 rounded-3xl object-cover shadow-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Smart Sign Language
              </h1>

              <p className="text-lg md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#0056d2] to-indigo-600">
                Learn and communicate with sign language using AI
              </p>

              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
                Break communication barriers with an AI-powered sign language
                platform. Learn vocabulary, translate in real time, and
                track your progress with clear learning analytics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button
                size="lg"
                className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-full px-8 h-12 text-sm font-semibold uppercase tracking-wider shadow-md shadow-blue-200/50 transition-all duration-200"
                onClick={() => handleNavigateToTop("/learn")}
              >
                <span className="gap-2 inline-flex items-center">
                  Start Learning
                  <ArrowRight size={16} />
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-full px-8 h-12 text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                onClick={() => handleNavigateToTop("/recognition")}
              >
                Try Realtime Recognition
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 2 - Khối chứa Camera xem thử */}
        <section className="py-20 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              <div className="flex justify-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-2xl w-full max-w-[380px] shadow-sm">
                  <div className="aspect-video bg-slate-900 dark:bg-slate-950 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-3 left-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <Video size={36} className="text-slate-400 animate-pulse" />
                  </div>
                  <div className="mt-4 p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 rounded-lg">
                      <Star size={16} className="fill-emerald-500 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">AI Recognition Active</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">Improves hand coordination fast</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-base font-bold text-[#0056d2] uppercase tracking-wider">
                  Smart Sign Language
                </h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-300 font-medium text-base leading-relaxed">
                  <p className="text-slate-900 dark:text-white text-xl font-bold leading-snug">
                    State-of-the-art interactive educational software tailored for intuitive visual learning.
                  </p>
                  <p>
                    Equipped with real-time camera tracking and AI validation, children learn fast and organically. Explore our curated sign library packed with many cards, interactive translation engines, and comprehensive tracking dashboards to visualize accuracy.
                  </p>
                </div>

                {/* Các nút hành động chính và phụ có tích hợp hiệu ứng cuộn mượt */}
                <div className="flex flex-col gap-4 pt-4">

                  <button
                    onClick={() => scrollToSection("packages")}
                    className="group inline-flex items-center gap-1.5 text-[#0056d2] hover:text-[#00419e] font-medium hover:font-bold text-base transition-all w-fit text-left hover:underline underline-offset-4"
                  >
                    Explore features
                    <ArrowRight
                      size={16}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out text-[#0056d2]"
                    />
                  </button>

                  <button
                    onClick={() => scrollToSection("why-choose")}
                    className="group inline-flex items-center gap-1.5 text-[#0056d2] hover:text-[#00419e] font-medium hover:font-bold text-base transition-all w-fit text-left hover:underline underline-offset-4"
                  >
                    Why choose Smart Sign Language
                    <ArrowRight
                      size={16}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out text-[#0056d2]"
                    />
                  </button>

                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="group inline-flex items-center gap-1.5 text-[#0056d2] hover:text-[#00419e] font-medium hover:font-bold text-base transition-all w-fit text-left hover:underline underline-offset-4"
                  >
                    See how it works step-by-step
                    <ArrowRight
                      size={16}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out text-[#0056d2]"
                    />
                  </button>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3 - FEATURES GRID SECTION */}
        <section className="py-20 bg-[#f8f9fb] dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" id="packages">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-4xl font-bold text-slate-950 dark:text-white tracking-tight">
                Features & Core Modules
              </h2>
              <p className="text-slate-500 dark:text-slate-300 text-base font-medium">
                Explore the key capabilities of our AI platform and curriculum modules
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="group bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between relative hover:-translate-y-2 hover:shadow-xl hover:border-[#0056d2]/30 transition-all duration-300">

                    <span className="absolute -top-3 left-6 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-3.5 py-1 rounded uppercase tracking-wider shadow-sm transition-all duration-300 group-hover:bg-[#0056d2] group-hover:scale-110">
                      {feature.label}
                    </span>

                    <div className="mt-4 space-y-4 flex-1">
                      <div className="p-3 bg-blue-50 text-[#0056d2] rounded-xl w-fit transition-all duration-300 group-hover:bg-[#0056d2] group-hover:text-white">
                        <Icon size={22} className="stroke-[2]" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300 font-medium leading-relaxed">{feature.description}</p>

                      <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {feature.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                            <CheckCircle2 size={14} className="text-[#0056d2] flex-shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleExploreModule(feature.href)}
                        className="w-full inline-flex items-center justify-center bg-white dark:bg-[#0b1a3a] border border-[#0056d2] text-[#0056d2] dark:text-white hover:bg-[#0056d2] hover:text-white font-semibold text-sm uppercase tracking-wider py-3 rounded-full transition-all duration-200 group-hover:shadow-md dark:shadow-[0_0_0_1px_rgba(0,86,210,0.25)]"
                      >
                        Explore Module
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4 - WHY CHOOSE US SECTION - Thêm ID để liên kết trượt mượt */}
        <section id="why-choose" className="py-20 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl font-bold text-slate-950 dark:text-white tracking-tight">
                Why Choose <span className="text-[#0056d2]">Smart Sign Language?</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-center">

              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white dark:bg-slate-950 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 rounded-xl transition-all duration-200 group cursor-pointer flex gap-4 items-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-[#0056d2] group-hover:border-[#0056d2] transition-colors duration-200">
                      <span className="group-hover:scale-110 transition-transform duration-200">{benefit.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300 font-medium leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-5 hidden lg:flex justify-center">
                <div className="relative p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl w-full max-w-[340px] shadow-sm space-y-4">
                  <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <span className="text-lg">🏆</span>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-blue-100 rounded-full w-4/5"></div>
                      <div className="h-1.5 bg-slate-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <span className="text-lg">⚡</span>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-blue-100 rounded-full w-2/3"></div>
                      <div className="h-1.5 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 5 - HOW IT WORKS SECTION - Thêm ID để liên kết trượt mượt */}
        <section id="how-it-works" className="py-20 bg-[#f8f9fb] dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center text-slate-950 dark:text-white mb-16 tracking-tight">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                {
                  number: "1",
                  title: "Sign Up",
                  description: "Create a free account in seconds.",
                  icon: UserPlus,
                  colorClass: "bg-blue-50 text-[#0056d2] border-blue-100",
                },
                {
                  number: "2",
                  title: "Choose a Path",
                  description: "Choose learning, translation, or recognition.",
                  icon: Compass,
                  colorClass: "bg-purple-50 text-purple-600 border-purple-100",
                },
                {
                  number: "3",
                  title: "Start Exploring",
                  description: "Learn at your own pace with AI support.",
                  icon: Rocket,
                  colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
                },
              ].map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="group flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className={`w-24 h-24 rounded-full border flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${step.colorClass}`}>
                      <StepIcon size={32} className="stroke-[2]" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300 font-medium leading-relaxed max-w-xs">{step.description}</p>

                    {/* Stepper Connector Line */}
                    {i < 2 && (
                      <div className="hidden md:block absolute top-12 -right-6 w-12 h-[1px] bg-slate-200"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="py-20 bg-gradient-to-tr from-[#0c1033] to-[#1a1744] text-white text-center relative overflow-hidden border-t border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0056d2]/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0056d2]/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              Join thousands of learners breaking communication barriers and
              connecting through sign language.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-full px-8 h-12 text-base font-semibold uppercase tracking-wider transition-colors shadow-md shadow-blue-900/30"
                onClick={handleStartForFree}
              >
                Start for Free
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-8 text-sm text-slate-400 font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-400" />
                <span>Free and open access</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-blue-400" />
                <span>AI-powered recognition</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}