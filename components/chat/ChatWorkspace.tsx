"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatMode, Conversation, Folder, Attachment } from "@/types";
import { useChat } from "@/hooks/useChat";
import { useCapabilities } from "@/hooks/useCapabilities";
import { localStore } from "@/services/localStore";
import { deriveTitle } from "@/utils/format";
import { Sidebar } from "./Sidebar";
import { Message } from "./Message";
import { Composer } from "./Composer";
import { Welcome } from "./Welcome";
import { SearchModal } from "./SearchModal";
import { Modal } from "@/components/ui/Modal";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/icons";
import { Wordmark } from "@/components/brand/Logo";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/utils/cn";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function Inner({ user }: { user: { email?: string; name?: string } | null }) {
  const { data: caps } = useCapabilities();
  const { push } = useToast();
  const { resolved, setTheme } = useTheme();

  const models = caps?.models ?? [];
  const [model, setModel] = useState<string>("");
  const [mode, setMode] = useState<ChatMode>("chat");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [renameFor, setRenameFor] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  // initialize model from default
  useEffect(() => {
    if (caps?.defaultModel && !model) setModel(caps.defaultModel);
  }, [caps, model]);

  // load conversations
  useEffect(() => {
    setConversations(localStore.listConversations());
    setFolders(localStore.listFolders());
  }, []);

  const persist = useCallback(
    (id: string, msgs: ChatMessage[]) => {
      localStore.setMessages(id, msgs);
      const conv = localStore.getConversation(id);
      if (conv) {
        conv.updatedAt = new Date().toISOString();
        localStore.upsertConversation(conv);
        setConversations(localStore.listConversations());
      }
    },
    []
  );

  const chat = useChat({
    model,
    onComplete: (msgs) => {
      if (activeId) persist(activeId, msgs);
    },
  });

  // Auto-scroll on new content.
  useEffect(() => {
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const ensureConversation = useCallback(
    (firstText: string): string => {
      if (activeId) return activeId;
      const id = newId();
      const conv: Conversation = {
        id,
        userId: null,
        title: deriveTitle(firstText),
        model,
        pinned: false,
        favorite: false,
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStore.upsertConversation(conv);
      setConversations(localStore.listConversations());
      setActiveId(id);
      // Try to generate a better title asynchronously.
      fetch("/api/title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: firstText }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.title) {
            const c = localStore.getConversation(id);
            if (c) {
              c.title = d.title;
              localStore.upsertConversation(c);
              setConversations(localStore.listConversations());
            }
          }
        })
        .catch(() => {});
      return id;
    },
    [activeId, model]
  );

  const handleSend = useCallback(
    (text: string, attachments?: Attachment[]) => {
      autoScroll.current = true;
      if (!activeId) ensureConversation(text);
      chat.send(text, attachments);
    },
    [activeId, chat, ensureConversation]
  );

  const handleGenerateImage = useCallback(
    async (prompt: string) => {
      const id = activeId || ensureConversation(prompt);
      const userMsg: ChatMessage = { id: newId(), role: "user", content: prompt };
      const pending: ChatMessage = { id: newId(), role: "assistant", content: "", pending: true };
      chat.setMessages((prev) => [...prev, userMsg, pending]);
      try {
        const res = await fetch("/api/image", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (!res.ok) {
          chat.setMessages((prev) =>
            prev.map((m) => (m.id === pending.id ? { ...m, pending: false, error: data?.error?.message || "Gagal membuat gambar." } : m))
          );
          return;
        }
        chat.setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === pending.id
              ? { ...m, pending: false, content: `![gambar](${data.image})` }
              : m
          );
          persist(id, next);
          return next;
        });
      } catch {
        chat.setMessages((prev) =>
          prev.map((m) => (m.id === pending.id ? { ...m, pending: false, error: "Gagal membuat gambar." } : m))
        );
      }
    },
    [activeId, chat, ensureConversation, persist]
  );

  const openConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      chat.reset(localStore.getMessages(id));
      setMobileDrawer(false);
      autoScroll.current = true;
    },
    [chat]
  );

  const newChat = useCallback(() => {
    setActiveId(null);
    chat.reset([]);
    setMode("chat");
    setMobileDrawer(false);
  }, [chat]);

  const mutateConv = (id: string, fn: (c: Conversation) => void) => {
    const c = localStore.getConversation(id);
    if (!c) return;
    fn(c);
    localStore.upsertConversation(c);
    setConversations(localStore.listConversations());
  };

  const deleteConv = (id: string) => {
    localStore.deleteConversation(id);
    setConversations(localStore.listConversations());
    if (activeId === id) newChat();
  };

  const doRename = () => {
    if (renameFor && renameValue.trim()) {
      mutateConv(renameFor, (c) => (c.title = renameValue.trim()));
    }
    setRenameFor(null);
  };

  const createShare = async () => {
    if (!activeId) return;
    const token = newId();
    const payload = {
      title: localStore.getConversation(activeId)?.title || "Percakapan",
      messages: localStore.getMessages(activeId).map((m) => ({ role: m.role, content: m.content })),
    };
    try {
      sessionStorage.setItem(`syafxai:share:${token}`, JSON.stringify(payload));
    } catch {}
    const url = `${window.location.origin}/share/${token}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      push("Link berbagi disalin (demo lokal).", "success");
    } catch {}
  };

  const activeConv = activeId ? conversations.find((c) => c.id === activeId) : null;
  const hasMessages = chat.messages.length > 0;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-canvas text-ink">
      {/* Desktop sidebar */}
      <div className={cn("hidden md:block transition-[width] duration-200", sidebarOpen ? "w-64" : "w-0 overflow-hidden")}>
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          folders={folders}
          user={user}
          onNewChat={newChat}
          onSelect={openConversation}
          onSearch={() => setSearchOpen(true)}
          onPin={(id) => mutateConv(id, (c) => (c.pinned = !c.pinned))}
          onFavorite={(id) => mutateConv(id, (c) => (c.favorite = !c.favorite))}
          onRename={(id) => { setRenameFor(id); setRenameValue(localStore.getConversation(id)?.title || ""); }}
          onDelete={deleteConv}
          onNewFolder={() => {
            const name = prompt("Nama folder:");
            if (name?.trim()) {
              localStore.upsertFolder({ id: newId(), userId: "local", name: name.trim(), createdAt: new Date().toISOString() });
              setFolders(localStore.listFolders());
            }
          }}
          onCollapse={() => setSidebarOpen(false)}
        />
      </div>

      {/* Mobile drawer */}
      {mobileDrawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={() => setMobileDrawer(false)} />
          <div className="absolute left-0 top-0 h-full animate-fade-in">
            <Sidebar
              conversations={conversations}
              activeId={activeId}
              folders={folders}
              user={user}
              onNewChat={newChat}
              onSelect={openConversation}
              onSearch={() => { setMobileDrawer(false); setSearchOpen(true); }}
              onPin={(id) => mutateConv(id, (c) => (c.pinned = !c.pinned))}
              onFavorite={(id) => mutateConv(id, (c) => (c.favorite = !c.favorite))}
              onRename={(id) => { setRenameFor(id); setRenameValue(localStore.getConversation(id)?.title || ""); }}
              onDelete={deleteConv}
              onNewFolder={() => {}}
              onCollapse={() => setMobileDrawer(false)}
            />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setMobileDrawer(true)} className="rounded-md p-1.5 text-muted hover:bg-elevated md:hidden">
              <Icon.Menu width={18} height={18} />
            </button>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="hidden rounded-md p-1.5 text-muted hover:bg-elevated md:block">
                <Icon.Sidebar width={17} height={17} />
              </button>
            )}
            <span className="truncate text-sm font-medium text-ink">
              {activeConv?.title || "Percakapan baru"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
              title="Ganti tema"
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              {resolved === "dark" ? <Icon.Sun width={17} height={17} /> : <Icon.Moon width={17} height={17} />}
            </button>
            {activeId && hasMessages && (
              <button onClick={createShare} title="Bagikan" className="rounded-md p-1.5 text-muted transition-colors hover:bg-elevated hover:text-ink">
                <Icon.Share width={17} height={17} />
              </button>
            )}
          </div>
        </header>

        {caps && !caps.capabilities.gemini && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            Gemini API belum dikonfigurasi. Tambahkan <code className="font-mono">GEMINI_API_KEY</code> di server untuk mengaktifkan chat.
          </div>
        )}

        <div ref={scrollRef} onScroll={onScroll} className="flex flex-1 flex-col overflow-y-auto">
          {!hasMessages ? (
            <Welcome onPick={(t) => handleSend(t)} />
          ) : (
            <div className="flex-1 py-4">
              {chat.messages.map((m, i) => (
                <Message
                  key={m.id}
                  message={m}
                  isLast={i === chat.messages.length - 1}
                  onRegenerate={chat.regenerate}
                  onEdit={chat.editUserMessage}
                  onShare={createShare}
                />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Composer
            models={models}
            model={model}
            onModelChange={setModel}
            mode={mode}
            onModeChange={setMode}
            imageEnabled={Boolean(caps?.capabilities.imageGeneration)}
            isStreaming={chat.isStreaming}
            onStop={chat.stop}
            onSend={handleSend}
            onGenerateImage={handleGenerateImage}
            disabled={!caps?.capabilities.gemini && mode === "chat"}
          />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={openConversation} />

      <Modal open={Boolean(renameFor)} onClose={() => setRenameFor(null)} title="Ubah nama percakapan">
        <input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doRename()}
          autoFocus
          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setRenameFor(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-elevated">Batal</button>
          <button onClick={doRename} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Simpan</button>
        </div>
      </Modal>

      <Modal open={Boolean(shareUrl)} onClose={() => setShareUrl(null)} title="Bagikan percakapan">
        <p className="text-sm text-muted">Link read-only untuk percakapan ini:</p>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2">
          <input readOnly value={shareUrl ?? ""} className="w-full bg-transparent text-xs text-ink outline-none" />
          <button
            onClick={() => { if (shareUrl) navigator.clipboard.writeText(shareUrl); push("Tersalin", "success"); }}
            className="shrink-0 text-faint hover:text-ink"
          >
            <Icon.Copy width={15} height={15} />
          </button>
        </div>
        <p className="mt-3 text-xs text-faint">
          Catatan: pada versi produksi, share disimpan aman di Supabase dengan token public. Demo ini menyimpan sementara di browser.
        </p>
      </Modal>
    </div>
  );
}

export function ChatWorkspace({ user }: { user: { email?: string; name?: string } | null }) {
  return (
    <ToastProvider>
      <Inner user={user} />
    </ToastProvider>
  );
}
