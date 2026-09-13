"use client";

import { useState } from "react";
import type { ChatMessage } from "@/types";
import { Markdown } from "./Markdown";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { useTextToSpeech } from "@/hooks/useSpeech";
import { cn } from "@/utils/cn";

function ActionButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-ink",
        active && "text-accent"
      )}
    >
      {children}
    </button>
  );
}

export function Message({
  message,
  isLast,
  onRegenerate,
  onEdit,
  onShare,
}: {
  message: ChatMessage;
  isLast: boolean;
  onRegenerate?: () => void;
  onEdit?: (id: string, text: string) => void;
  onShare?: () => void;
}) {
  const { push } = useToast();
  const tts = useTextToSpeech();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content).catch(() => {});
    push("Tersalin ke clipboard", "success");
  };

  if (message.role === "user") {
    return (
      <div className="group animate-fade-in py-5">
        <div className="mx-auto flex max-w-conversation flex-col items-end px-4">
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {message.attachments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-muted"
                >
                  <Icon.Paperclip width={13} height={13} />
                  {a.name}
                </span>
              ))}
            </div>
          )}
          {editing ? (
            <div className="w-full">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-surface p-3 text-[15px] text-ink outline-none focus:border-accent"
                rows={3}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.content);
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-elevated"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    onEdit?.(message.id, draft);
                  }}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Kirim
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="max-w-full whitespace-pre-wrap break-words rounded-2xl bg-elevated px-4 py-2.5 text-[15px] leading-relaxed text-ink">
                {message.content}
              </div>
              <div className="mt-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <ActionButton label="Edit" onClick={() => setEditing(true)}>
                  <Icon.Edit width={15} height={15} />
                </ActionButton>
                <ActionButton label="Copy" onClick={copy}>
                  <Icon.Copy width={15} height={15} />
                </ActionButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="group animate-fade-in py-5">
      <div className="mx-auto max-w-conversation px-4">
        {message.content ? (
          <Markdown content={message.content} />
        ) : message.pending ? (
          <div className="flex items-center gap-1.5 text-faint">
            <span className="inline-block h-2 w-2 animate-blink rounded-full bg-faint" />
            <span className="inline-block h-2 w-2 animate-blink rounded-full bg-faint [animation-delay:0.2s]" />
            <span className="inline-block h-2 w-2 animate-blink rounded-full bg-faint [animation-delay:0.4s]" />
          </div>
        ) : null}

        {message.error && (
          <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
            {message.error}
          </div>
        )}

        {!message.pending && (message.content || message.error) && (
          <div className="mt-2 flex items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
            <ActionButton label="Copy" onClick={copy}>
              <Icon.Copy width={15} height={15} />
            </ActionButton>
            {isLast && onRegenerate && (
              <ActionButton label="Regenerate" onClick={onRegenerate}>
                <Icon.Refresh width={15} height={15} />
              </ActionButton>
            )}
            <ActionButton
              label="Suka"
              active={vote === "up"}
              onClick={() => setVote(vote === "up" ? null : "up")}
            >
              <Icon.ThumbUp width={15} height={15} />
            </ActionButton>
            <ActionButton
              label="Tidak suka"
              active={vote === "down"}
              onClick={() => setVote(vote === "down" ? null : "down")}
            >
              <Icon.ThumbDown width={15} height={15} />
            </ActionButton>
            {onShare && (
              <ActionButton label="Bagikan" onClick={onShare}>
                <Icon.Share width={15} height={15} />
              </ActionButton>
            )}
            <ActionButton
              label={tts.speaking ? "Stop" : "Listen"}
              active={tts.speaking}
              onClick={() =>
                tts.speaking ? tts.stop() : tts.speak(message.content)
              }
            >
              {tts.speaking ? (
                <Icon.Stop width={15} height={15} />
              ) : (
                <Icon.Speaker width={15} height={15} />
              )}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
