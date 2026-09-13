"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "@/types";
import { Markdown } from "@/components/chat/Markdown";

type Msg = Pick<ChatMessage, "role" | "content">;

export function SharedView({
  token,
  serverTitle,
  serverMessages,
  serverFound,
  serverExpired,
  supabaseConfigured,
}: {
  token: string;
  serverTitle: string;
  serverMessages: Msg[];
  serverFound: boolean;
  serverExpired: boolean;
  supabaseConfigured: boolean;
}) {
  const [title, setTitle] = useState(serverTitle);
  const [messages, setMessages] = useState<Msg[]>(serverMessages);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "expired">(
    serverExpired ? "expired" : serverFound ? "ready" : "loading"
  );

  useEffect(() => {
    if (serverFound || serverExpired) return;
    // Fallback to local demo share stored in sessionStorage.
    try {
      const raw = sessionStorage.getItem(`syafxai:share:${token}`);
      if (raw) {
        const data = JSON.parse(raw);
        setTitle(data.title || "Percakapan");
        setMessages(data.messages || []);
        setState("ready");
        return;
      }
    } catch {}
    setState("missing");
  }, [token, serverFound, serverExpired]);

  if (state === "expired") {
    return <Centered text="Tautan berbagi sudah kedaluwarsa." />;
  }
  if (state === "missing") {
    return <Centered text="Percakapan tidak ditemukan atau sudah dihapus." />;
  }
  if (state === "loading") {
    return <Centered text="Memuat…" />;
  }

  return (
    <main className="mx-auto max-w-conversation px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-col">
        {messages.map((m, i) => (
          <div key={i} className="py-4">
            {m.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-full whitespace-pre-wrap rounded-2xl bg-elevated px-4 py-2.5 text-[15px] text-ink">
                  {m.content}
                </div>
              </div>
            ) : (
              <Markdown content={m.content} />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm text-muted">
      {text}
    </div>
  );
}
