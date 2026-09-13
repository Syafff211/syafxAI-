"use client";

import type { ChatMessage, Conversation, Folder } from "@/types";

/**
 * Local conversation store (browser localStorage).
 *
 * Used for guest / offline sessions and as a fallback when Supabase is not
 * configured. The shape mirrors the Supabase schema so the SupabaseStore can be
 * swapped in transparently (see services/store.ts for the interface intent).
 */

const CONV_KEY = "syafxai:conversations";
const MSG_KEY = (id: string) => `syafxai:messages:${id}`;
const FOLDER_KEY = "syafxai:folders";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const localStore = {
  listConversations(): Conversation[] {
    return read<Conversation[]>(CONV_KEY, []).sort(
      (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
    );
  },
  getConversation(id: string): Conversation | undefined {
    return this.listConversations().find((c) => c.id === id);
  },
  upsertConversation(conv: Conversation) {
    const all = read<Conversation[]>(CONV_KEY, []);
    const idx = all.findIndex((c) => c.id === conv.id);
    if (idx >= 0) all[idx] = conv;
    else all.push(conv);
    write(CONV_KEY, all);
  },
  deleteConversation(id: string) {
    write(
      CONV_KEY,
      read<Conversation[]>(CONV_KEY, []).filter((c) => c.id !== id)
    );
    if (typeof window !== "undefined") localStorage.removeItem(MSG_KEY(id));
  },
  getMessages(id: string): ChatMessage[] {
    return read<ChatMessage[]>(MSG_KEY(id), []);
  },
  setMessages(id: string, messages: ChatMessage[]) {
    write(MSG_KEY(id), messages);
  },
  listFolders(): Folder[] {
    return read<Folder[]>(FOLDER_KEY, []);
  },
  upsertFolder(folder: Folder) {
    const all = read<Folder[]>(FOLDER_KEY, []);
    const idx = all.findIndex((f) => f.id === folder.id);
    if (idx >= 0) all[idx] = folder;
    else all.push(folder);
    write(FOLDER_KEY, all);
  },
  deleteFolder(id: string) {
    write(
      FOLDER_KEY,
      read<Folder[]>(FOLDER_KEY, []).filter((f) => f.id !== id)
    );
  },
  search(query: string): { conversation: Conversation; snippet?: string }[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: { conversation: Conversation; snippet?: string }[] = [];
    for (const conv of this.listConversations()) {
      if (conv.title.toLowerCase().includes(q)) {
        results.push({ conversation: conv });
        continue;
      }
      const msgs = this.getMessages(conv.id);
      const hit = msgs.find((m) => m.content.toLowerCase().includes(q));
      if (hit) {
        const i = hit.content.toLowerCase().indexOf(q);
        results.push({
          conversation: conv,
          snippet: hit.content.slice(Math.max(0, i - 20), i + 40),
        });
      }
    }
    return results;
  },
};
