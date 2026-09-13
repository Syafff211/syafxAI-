"use client";

import { useEffect } from "react";
import { Icon } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in-fast"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${width} animate-fade-in rounded-xl border border-border bg-surface p-5 shadow-lg`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-faint transition-colors hover:bg-elevated hover:text-ink"
            >
              <Icon.Close width={18} height={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
