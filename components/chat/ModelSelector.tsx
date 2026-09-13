"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelInfo } from "@/types";
import { Icon } from "@/components/ui/icons";

export function ModelSelector({
  models,
  value,
  onChange,
}: {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = models.find((m) => m.id === value) ?? models[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-elevated hover:text-ink"
      >
        <Icon.Sparkle width={13} height={13} />
        {current.label}
        <Icon.ChevronDown width={13} height={13} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-64 animate-fade-in-fast overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-elevated"
            >
              <div className="mt-0.5 text-accent">
                <Icon.Sparkle width={14} height={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  {m.label}
                  {m.id === value && <Icon.Check width={13} height={13} className="text-accent" />}
                </div>
                <div className="text-xs text-faint">{m.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
