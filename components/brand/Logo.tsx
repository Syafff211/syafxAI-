import { cn } from "@/utils/cn";

/**
 * SyafxAI mark — an original geometric glyph: two offset arcs forming an "S"
 * spark. Intentionally simple, calm, and small. No third-party assets.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path
        d="M21.5 11.2c-1-1.3-2.7-2.1-4.9-2.1-3 0-5 1.5-5 3.7 0 2 1.4 2.9 4.3 3.5 3.1.7 3.9 1.2 3.9 2.4 0 1.3-1.3 2.1-3.4 2.1-2 0-3.5-.8-4.5-2.2"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  showMark = true,
}: {
  className?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showMark && <LogoMark />}
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        Syafx<span className="text-accent">AI</span>
      </span>
    </span>
  );
}
