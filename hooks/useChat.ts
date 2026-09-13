"use client";

import { useCallback, useRef, useState } from "react";
import type { AppError, Attachment, ChatMessage } from "@/types";

const ERROR_SENTINEL = "\u0000ERROR\u0000";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export interface UseChatOptions {
  model: string;
  initialMessages?: ChatMessage[];
  onFirstMessage?: (text: string) => void;
  onComplete?: (messages: ChatMessage[]) => void;
}

export function useChat({ model, initialMessages = [], onFirstMessage, onComplete }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.pending ? { ...m, pending: false } : m))
    );
  }, []);

  const runStream = useCallback(
    async (history: ChatMessage[], assistantId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model,
            messages: history.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let appErr: AppError = { code: "unknown", message: "Gagal terhubung ke AI." };
          try {
            const j = await res.json();
            if (j?.error) appErr = j.error;
          } catch {}
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, pending: false, error: appErr.message, content: "" }
                : m
            )
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const errIdx = buffer.indexOf(ERROR_SENTINEL);
          if (errIdx !== -1) {
            const before = buffer.slice(0, errIdx);
            const errJson = buffer.slice(errIdx + ERROR_SENTINEL.length);
            let appErr: AppError = { code: "unknown", message: "Terjadi kesalahan." };
            try {
              appErr = JSON.parse(errJson);
            } catch {}
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: before, pending: false, error: appErr.message }
                  : m
              )
            );
            buffer = "";
            break;
          }

          const current = buffer;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: current } : m
            )
          );
        }

        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === assistantId ? { ...m, pending: false } : m
          );
          onComplete?.(next);
          return next;
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m))
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, pending: false, error: "Terjadi masalah jaringan. Coba lagi." }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [model, onComplete]
  );

  const send = useCallback(
    async (text: string, attachments?: Attachment[]) => {
      const trimmed = text.trim();
      if (!trimmed && !(attachments && attachments.length)) return;
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        attachments,
        createdAt: new Date().toISOString(),
      };
      const assistantMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: "",
        model,
        pending: true,
        createdAt: new Date().toISOString(),
      };

      const isFirst = messages.length === 0;
      const history = [...messages, userMsg];
      setMessages([...history, assistantMsg]);
      if (isFirst) onFirstMessage?.(trimmed);

      await runStream(history, assistantMsg.id);
    },
    [isStreaming, messages, model, onFirstMessage, runStream]
  );

  const regenerate = useCallback(async () => {
    if (isStreaming) return;
    // Drop the last assistant message and re-run from the prior user turn.
    let idx = messages.length - 1;
    while (idx >= 0 && messages[idx].role !== "assistant") idx--;
    if (idx < 0) return;
    const history = messages.slice(0, idx);
    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      model,
      pending: true,
      createdAt: new Date().toISOString(),
    };
    setMessages([...history, assistantMsg]);
    await runStream(history, assistantMsg.id);
  }, [isStreaming, messages, model, runStream]);

  const editUserMessage = useCallback(
    async (id: string, newText: string) => {
      const idx = messages.findIndex((m) => m.id === id);
      if (idx < 0) return;
      const history = messages.slice(0, idx);
      const editedUser: ChatMessage = { ...messages[idx], content: newText };
      const assistantMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: "",
        model,
        pending: true,
        createdAt: new Date().toISOString(),
      };
      const nextHistory = [...history, editedUser];
      setMessages([...nextHistory, assistantMsg]);
      await runStream(nextHistory, assistantMsg.id);
    },
    [messages, model, runStream]
  );

  const reset = useCallback((msgs: ChatMessage[] = []) => {
    stop();
    setMessages(msgs);
  }, [stop]);

  return {
    messages,
    isStreaming,
    send,
    stop,
    regenerate,
    editUserMessage,
    reset,
    setMessages,
  };
}
