import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumPageHeaderProps {
  title: string;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function PremiumPageHeader({
  title,
  description,
  eyebrow,
  icon,
  aside,
  className,
}: PremiumPageHeaderProps) {
  return (
    <header className={cn("ssl-page-hero", className)}>
      <div className="ssl-page-orb ssl-page-orb-violet" />
      <div className="ssl-page-orb ssl-page-orb-cyan" />
      <div className="ssl-page-grid" />
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-violet-200">
            <Sparkles size={13} />
            {eyebrow}
          </div>
          <div className="flex items-start gap-4">
            <div className="ssl-page-icon">{icon}</div>
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 dark:text-white md:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>
        {aside && <div className="relative z-10">{aside}</div>}
      </div>
    </header>
  );
}

export function PremiumAuthVisual({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="ssl-auth-visual">
      <div className="ssl-page-grid" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
          <Sparkles size={13} />
          SmartSignLanguage
        </div>
        <img
          src="/img/logo2.png"
          alt="SmartSignLanguage logo"
          className="mx-auto mt-9 h-52 w-52 rounded-[34px] object-cover shadow-2xl shadow-violet-950/30"
        />
        <h2 className="mt-8 text-3xl font-bold tracking-[-0.05em] text-white">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
}
