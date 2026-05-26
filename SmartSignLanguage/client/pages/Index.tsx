import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import {
  BookOpen,
  Zap,
  Tv,
  BarChart3,
  Video,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: BookOpen,
      title: "Vocabulary Practice",
      description:
        "Practice sign language with a focused vocabulary library and interactive lessons at your own pace.",
      href: "/learn",
    },
    {
      icon: Zap,
      title: "Text to Sign Translation",
      description:
        "Translate between text and sign language for communication and learning.",
      href: "/translate",
    },
    {
      icon: Tv,
      title: "Realtime Recognition",
      description:
        "Use the AI camera to recognize signs in real time and see instant results.",
      href: "/recognition",
    },
    {
      icon: BarChart3,
      title: "Learning Dashboard",
      description:
        "Track progress, weak topics, quiz accuracy, and recognition improvement.",
      href: "/dashboard",
    },
  ];

  const stats = [
    { number: "", label: "Words and Phrases" },
    { number: "", label: "Active Users" },
    { number: "", label: "Accuracy" },
  ];

  const benefits = [
    "Free and accessible to everyone",
    "Works on every device",
    "Offline learning mode",
    "Track progress and achievements",
    "Structured learning analytics",
    "Frequent updates and new content",
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <img
                    src="/img/logo2.png"
                    alt="Smart Sign Language logo"
                    className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-border bg-white"
                  />
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
                    Smart Sign Language
                  </h1>
                </div>
                <p className="text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Learn and communicate with sign language using AI
                </p>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Break communication barriers with an AI-powered sign language
                  platform. Learn vocabulary, translate in real time, and
                  track your progress with clear learning analytics.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
                  asChild
                >
                  <Link to="/learn" className="gap-2 inline-flex items-center">
                    Start Learning
                    <ArrowRight size={20} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8"
                  asChild
                >
                  <Link to="/recognition">Try Realtime Recognition</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      {stat.number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative hidden md:block">
              <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl border border-primary/10 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-10 right-10 w-36 h-36 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-44 h-44 bg-secondary/10 rounded-full blur-3xl"></div>

                {/* Camera preview placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
                  <div className="w-64 h-64 xl:w-72 xl:h-72 bg-white/80 backdrop-blur rounded-3xl border-2 border-primary/20 flex items-center justify-center relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
                    <div className="relative flex flex-col items-center gap-5">
                      <Video size={60} className="text-primary animate-pulse" />
                      <p className="text-base font-semibold text-foreground">
                        Camera Preview
                      </p>
                      <p className="text-sm text-muted-foreground text-center">
                        Ready for AI recognition
                      </p>
                    </div>
                  </div>

                  {/* Recognition indicator */}
                  <div className="mt-10 flex items-center gap-2 bg-white/80 backdrop-blur px-5 py-3 rounded-full border border-primary/20 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">
                      Recognition Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-2">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit that makes learning and communicating with sign
              language simple and engaging.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={i}
                  to={feature.href}
                  className="group p-8 rounded-2xl border border-border hover:border-primary/50 bg-white hover:bg-primary/5 transition-all duration-300 cursor-pointer hover:shadow-lg"
                >
                  <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Benefits List */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Why Choose Smart Sign Language?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2
                      size={24}
                      className="text-primary flex-shrink-0 mt-1"
                    />
                    <p className="text-foreground font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative hidden md:block">
              <div className="bg-gradient-to-br from-secondary/20 to-primary/20 rounded-3xl p-12 border border-border">
                <div className="space-y-6">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-16 bg-white/50 rounded-xl border border-white/50 flex items-center px-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-primary/30 rounded w-2/3"></div>
                        <div className="h-2 bg-primary/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-primary/95 to-secondary/95 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of learners breaking communication barriers and
            connecting through sign language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-semibold"
              asChild
            >
              <Link to="/register">Start for Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 rounded-full px-8"
              asChild
            >
              <Link to="/learn">Start Learning</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap justify-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Star size={18} className="fill-white text-white" />
              <span>Trusted by 50K+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>Free and open access</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <span>AI-powered recognition</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to get started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Sign Up",
                description: "Create a free account in seconds",
              },
              {
                number: "02",
                title: "Choose a Path",
                description: "Choose learning, translation, or recognition",
              },
              {
                number: "03",
                title: "Start Exploring",
                description: "Learn at your own pace with AI support",
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-12 w-12 h-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
