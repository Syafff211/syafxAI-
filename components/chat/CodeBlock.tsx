"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/icons";

const PREVIEWABLE = new Set(["html", "svg"]);

/**
 * Code block with language label, copy button, and a sandboxed live preview
 * for HTML/SVG. User code is NEVER executed on the server — only inside a
 * sandboxed iframe in the browser.
 */
export function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const lang = (language || "").toLowerCase();
  const canPreview = PREVIEWABLE.has(lang);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-elevated/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
          {lang || "code"}
        </span>
        <div className="flex items-center gap-1">
          {canPreview && (
            <button
              onClick={() => setPreview((p) => !p)}
              className="rounded-md px-2 py-1 text-[11px] text-muted transition-colors hover:bg-border/50 hover:text-ink"
            >
              {preview ? "Code" : "Preview"}
            </button>
          )}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted transition-colors hover:bg-border/50 hover:text-ink"
          >
            {copied ? <Icon.Check width={13} height={13} /> : <Icon.Copy width={13} height={13} />}
            {copied ? "Tersalin" : "Copy"}
          </button>
        </div>
      </div>

      {preview && canPreview ? (
        <iframe
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts"
          className="h-72 w-full bg-white"
          srcDoc={lang === "svg" ? code : code}
        />
      ) : (
        <pre className="thin-scroll overflow-x-auto p-4">
          <code className={`hljs language-${lang}`}>{code}</code>
        </pre>
      )}
    </div>
  );
}
