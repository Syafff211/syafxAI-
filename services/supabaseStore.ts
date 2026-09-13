"use client";

import type { ChatMessage, Conversation, Folder } from "@/types";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase-backed conversation store (RLS-enforced). Mirrors localStore so the
 * two are interchangeable. Used when the user is authenticated & Supabase is
 * configured. All access is scoped to the current user by RLS policies.
 */
function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    model: row.model,
    pinned: row.pinned,
    favorite: row.favorite,
    folderId: row.folder_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supabaseStore = {
  async listConversations(): Promise<Conversation[]> {
    const sb = createClient();
    if (!sb) return [];
    const { data } = await sb
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    return (data ?? []).map(mapConversation);
  },

  async createConversation(conv: Partial<Conversation> & { userId: string }): Promise<Conversation | null> {
    const sb = createClient();
    if (!sb) return null;
    const { data } = await sb
      .from("conversations")
      .insert({
        user_id: conv.userId,
        title: conv.title ?? "Percakapan baru",
        model: conv.model,
      })
      .select()
      .single();
    return data ? mapConversation(data) : null;
  },

  async updateConversation(id: string, patch: Partial<Conversation>) {
    const sb = createClient();
    if (!sb) return;
    await sb
      .from("conversations")
      .update({
        title: patch.title,
        pinned: patch.pinned,
        favorite: patch.favorite,
        folder_id: patch.folderId,
        model: patch.model,
      })
      .eq("id", id);
  },

  async deleteConversation(id: string) {
    const sb = createClient();
    if (!sb) return;
    await sb.from("conversations").delete().eq("id", id);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const sb = createClient();
    if (!sb) return [];
    const { data } = await sb
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    return (data ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      model: m.model,
      createdAt: m.created_at,
      metadata: m.metadata,
    }));
  },

  async addMessage(conversationId: string, msg: ChatMessage) {
    const sb = createClient();
    if (!sb) return;
    await sb.from("messages").insert({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      model: msg.model,
      metadata: msg.metadata,
    });
  },

  async listFolders(): Promise<Folder[]> {
    const sb = createClient();
    if (!sb) return [];
    const { data } = await sb.from("folders").select("*").order("created_at");
    return (data ?? []).map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      name: f.name,
      createdAt: f.created_at,
    }));
  },

  async createShare(conversationId: string, expiresAt?: string): Promise<string | null> {
    const sb = createClient();
    if (!sb) return null;
    const token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2);
    const { error } = await sb.from("shared_conversations").insert({
      conversation_id: conversationId,
      share_token: token,
      expires_at: expiresAt ?? null,
    });
    return error ? null : token;
  },
};
