"use client";

import { useRef } from "react";

/**
 * 6-digit OTP input with auto-focus, auto-next, backspace, paste, numeric-only.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const setDigit = (i: number, d: string) => {
    const arr = value.padEnd(6, " ").slice(0, 6).split("");
    arr[i] = d;
    const next = arr.join("").replace(/\s/g, "");
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  };

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    if (!d) return;
    setDigit(i, d);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.padEnd(6, " ").slice(0, 6).split("");
      if (arr[i] && arr[i] !== " ") {
        arr[i] = " ";
        onChange(arr.join("").replace(/\s/g, ""));
      } else if (i > 0) {
        arr[i - 1] = " ";
        onChange(arr.join("").replace(/\s/g, ""));
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    if (pasted.length === 6) {
      onComplete?.(pasted);
      refs.current[5]?.focus();
    } else {
      refs.current[pasted.length]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={d === " " ? "" : d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-11 rounded-lg border border-border bg-elevated text-center text-lg font-semibold text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
        />
      ))}
    </div>
  );
}
