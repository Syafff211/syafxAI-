"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Attachment, ChatMode, ModelInfo } from "@/types";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { useSpeechToText } from "@/hooks/useSpeech";
import { ModelSelector } from "./ModelSelector";
import { isAllowedFile, MAX_ATTACHMENTS } from "@/lib/validation";
import { fileToBase64, formatBytes } from "@/utils/format";
import { cn } from "@/utils/cn";

export function Composer({
  onSend,
  onGenerateImage,
  isStreaming,
  onStop,
  models,
  model,
  onModelChange,
  mode,
  onModeChange,
  imageEnabled,
  disabled,
}: {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onGenerateImage: (prompt: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  models: ModelInfo[];
  model: string;
  onModelChange: (id: string) => void;
  mode: ChatMode;
  onModeChange: (m: ChatMode) => void;
  imageEnabled: boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const stt = useSpeechToText((t) => setText((prev) => (prev ? prev + " " : "") + t));

  // Auto-resize textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [text]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const next: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (attachments.length + next.length >= MAX_ATTACHMENTS) {
          push("Maksimal 6 lampiran.", "error");
          break;
        }
        const check = isAllowedFile(file);
        if (!check.ok) {
          push(check.reason || "File tidak didukung.", "error");
          continue;
        }
        const data = await fileToBase64(file);
        next.push({
          id: Math.random().toString(36).slice(2),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data,
        });
      }
      setAttachments((a) => [...a, ...next]);
    },
    [attachments.length, push]
  );

  const submit = () => {
    if (disabled || isStreaming) return;
    if (mode === "image") {
      if (!text.trim()) return;
      onGenerateImage(text.trim());
      setText("");
      return;
    }
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments.length ? attachments : undefined);
    setText("");
    setAttachments([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-conversation px-3 pb-4 sm:px-4">
      <div
        className="rounded-2xl border border-border bg-surface shadow-sm transition-shadow focus-within:border-faint focus-within:shadow-md"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1 text-xs text-muted"
              >
                <Icon.Paperclip width={13} height={13} />
                <span className="max-w-[140px] truncate">{a.name}</span>
                <span className="text-faint">{formatBytes(a.size)}</span>
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                  }
                  className="text-faint hover:text-ink"
                >
                  <Icon.Close width={12} height={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
          placeholder={
            mode === "image"
              ? "Deskripsikan gambar yang ingin dibuat…"
              : "Kirim pesan ke SyafxAI…"
          }
          className="max-h-[220px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            <ModelSelector models={models} value={model} onChange={onModelChange} />

            {imageEnabled && (
              <div className="ml-1 flex rounded-lg border border-border p-0.5">
                <button
                  onClick={() => onModeChange("chat")}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    mode === "chat" ? "bg-elevated text-ink" : "text-faint hover:text-ink"
                  )}
                >
                  Chat
                </button>
                <button
                  onClick={() => onModeChange("image")}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    mode === "image" ? "bg-elevated text-ink" : "text-faint hover:text-ink"
                  )}
                >
                  Image
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {mode === "chat" && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  title="Lampirkan file"
                  className="rounded-lg p-2 text-faint transition-colors hover:bg-elevated hover:text-ink"
                >
                  <Icon.Paperclip width={18} height={18} />
                </button>
                <button
                  onClick={() => (stt.state === "recording" ? stt.stop() : stt.start())}
                  disabled={!stt.supported}
                  title={
                    !stt.supported
                      ? "Voice input tidak didukung browser ini"
                      : stt.state === "recording"
                      ? "Berhenti merekam"
                      : "Voice input"
                  }
                  className={cn(
                    "rounded-lg p-2 transition-colors hover:bg-elevated disabled:opacity-40",
                    stt.state === "recording"
                      ? "text-red-500"
                      : "text-faint hover:text-ink"
                  )}
                >
                  <Icon.Mic width={18} height={18} />
                </button>
              </>
            )}

            {isStreaming ? (
              <button
                onClick={onStop}
                title="Stop"
                className="ml-1 rounded-lg bg-ink p-2 text-canvas transition-opacity hover:opacity-90"
              >
                <Icon.Stop width={18} height={18} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={disabled || (mode === "chat" && !text.trim() && attachments.length === 0) || (mode === "image" && !text.trim())}
                title="Kirim"
                className="ml-1 rounded-lg bg-accent p-2 text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon.Send width={18} height={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-faint">
        SyafxAI dapat membuat kesalahan. Periksa informasi penting.
      </p>
    </div>
  );
}
