"use client";

import type { ChatMessage, Conversation, Folder } from "@/types";
import { localStore } from "./localStore";
import { supabaseStore } from "./supabaseStore";

/**
 * Unified conversation store.
 *
 * - Signed-in + Supabase configured → data persists to Supabase (RLS enforced).
 * - Otherwise (guest / offline / unconfigured) → browser localStorage.
 *
 * The two backends share the same domain shapes, so the UI never branches.
 */
export interface ConversationStore {
  backend: "supabase" | "local";
  listConversations(): Promise<Conversation[]>;
  createConversation(input: { title: string; model: string }): Promise<Conversation>;
  updateConversation(id: string, patch: Partial<Conversation>): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  getMessages(id: string): Promise<ChatMessage[]>;
  saveMessages(id: string, messages: ChatMessage[]): Promise<void>;
  listFolders(): Promise<Folder[]>;
  createShare(conversationId: string): Promise<string | null>;
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function makeStore(userId: string | null, supabaseEnabled: boolean): ConversationStore {
  const useSupabase = Boolean(userId && supabaseEnabled);

  if (useSupabase && userId) {
    return {
      backend: "supabase",
      listConversations: () => supabaseStore.listConversations(),
      async createConversation({ title, model }) {
        const conv = await supabaseStore.createConversation({ userId, title, model });
        return (
          conv ?? {
            id: newId(),
            userId,
            title,
            model,
            pinned: false,
            favorite: false,
            folderId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      },
      updateConversation: (id, patch) => supabaseStore.updateConversation(id, patch),
      deleteConversation: (id) => supabaseStore.deleteConversation(id),
      getMessages: (id) => supabaseStore.getMessages(id),
      async saveMessages(id, messages) {
        // Persist only the last two turns that aren't yet stored is complex;
        // for simplicity + correctness we append new messages. The caller
        // (ChatWorkspace) drives message creation, so we insert the final pair.
        const last = messages[messages.length - 1];
        const prev = messages[messages.length - 2];
        if (prev && prev.role === "user") await supabaseStore.addMessage(id, prev);
        if (last && last.role === "assistant") await supabaseStore.addMessage(id, last);
      },
      listFolders: () => supabaseStore.listFolders(),
      createShare: (id) => supabaseStore.createShare(id),
    };
  }

  // Local fallback
  return {
    backend: "local",
    async listConversations() {
      return localStore.listConversations();
    },
    async createConversation({ title, model }) {
      const conv: Conversation = {
        id: newId(),
        userId: null,
        title,
        model,
        pinned: false,
        favorite: false,
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStore.upsertConversation(conv);
      return conv;
    },
    async updateConversation(id, patch) {
      const c = localStore.getConversation(id);
      if (c) localStore.upsertConversation({ ...c, ...patch, updatedAt: new Date().toISOString() });
    },
    async deleteConversation(id) {
      localStore.deleteConversation(id);
    },
    async getMessages(id) {
      return localStore.getMessages(id);
    },
    async saveMessages(id, messages) {
      localStore.setMessages(id, messages);
      const c = localStore.getConversation(id);
      if (c) localStore.upsertConversation({ ...c, updatedAt: new Date().toISOString() });
    },
    async listFolders() {
      return localStore.listFolders();
    },
    async createShare() {
      return null;
    },
  };
}
