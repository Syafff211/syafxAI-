"use client";

import { BRAND } from "@/lib/branding";
import { LogoMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/icons";

export function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-5 animate-fade-in">
        <LogoMark className="h-10 w-10" />
      </div>
      <h1 className="animate-fade-in text-2xl font-semibold tracking-tight text-ink">
        {BRAND.landing.heading}
      </h1>
      <p className="mt-2 animate-fade-in text-xl font-medium text-ink [animation-delay:0.05s]">
        {BRAND.landing.prompt}
      </p>
      <p className="mt-2 max-w-md animate-fade-in text-center text-sm text-muted [animation-delay:0.1s]">
        {BRAND.landing.subtitle}
      </p>

      <div className="mt-8 grid w-full max-w-lg animate-fade-in grid-cols-1 gap-2 sm:grid-cols-2 [animation-delay:0.15s]">
        {BRAND.landing.suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-left text-sm text-muted transition-colors hover:border-faint hover:text-ink"
          >
            <Icon.Sparkle
              width={15}
              height={15}
              className="text-faint transition-colors group-hover:text-accent"
            />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
