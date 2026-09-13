/**
 * Provider-agnostic domain types for SyafxAI.
 *
 * These types are intentionally independent of any AI provider (Gemini, etc.)
 * and any database (Supabase). Adapters translate to/from these shapes so the
 * app can swap providers without touching the UI.
 */

export type Role = "user" | "assistant" | "system";

export type ChatMode = "chat" | "image";

/** UI-facing model categories. */
export type ModelTier = "fast" | "balanced" | "powerful";

export interface ModelInfo {
  /** Provider model id, e.g. "gemini-2.5-flash". */
  id: string;
  /** Human label shown in the selector. */
  label: string;
  tier: ModelTier;
  description: string;
  /** Whether the model accepts image/file inputs. */
  multimodal: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** base64 (no data-url prefix) — only sent to server, never persisted raw. */
  data?: string;
  /** optional remote/storage url once uploaded */
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  model?: string;
  createdAt?: string;
  attachments?: Attachment[];
  /** free-form provider metadata (token counts, finish reason, etc.) */
  metadata?: Record<string, unknown>;
  /** transient UI flag: message is currently streaming */
  pending?: boolean;
  /** transient UI flag: this message errored */
  error?: string;
}

export interface Conversation {
  id: string;
  userId: string | null;
  title: string;
  model: string;
  pinned: boolean;
  favorite: boolean;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface SharedConversation {
  id: string;
  conversationId: string;
  shareToken: string;
  createdAt: string;
  expiresAt: string | null;
}

/** Normalized error surface — never leak stack traces to the client. */
export interface AppError {
  code:
    | "invalid_api_key"
    | "model_unavailable"
    | "rate_limit"
    | "timeout"
    | "network"
    | "not_configured"
    | "unauthorized"
    | "validation"
    | "unknown";
  message: string;
}
