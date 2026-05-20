import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  ctaText?: string;
  features?: string[];
}

export default function PlaceholderPage({
  title,
  description,
  icon,
  ctaText = "Continue",
  features = [],
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-2xl text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">{icon}</div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Features List */}
        {features.length > 0 && (
          <div className="bg-muted/30 rounded-2xl p-8 space-y-3 text-left">
            <p className="text-sm font-semibold text-foreground mb-4">
              Coming Soon:
            </p>
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-foreground">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-start gap-4">
          <Lightbulb size={24} className="text-primary flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground mb-1">Hint</p>
            <p className="text-sm text-muted-foreground">
              This is a placeholder page. Ask AI to build this page with the
              exact features and design you need.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div>
          <Button size="lg" className="gap-2" asChild>
            <Link to="/">
              {ctaText}
              <ArrowRight size={20} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
