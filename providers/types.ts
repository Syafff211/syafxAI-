import type { ChatMessage } from "@/types";

/**
 * Provider abstraction. SyafxAI talks to this interface, never directly to a
 * vendor SDK from the UI. Add new providers by implementing AIProvider.
 *
 *   AIProvider
 *   └── GeminiProvider
 */

export interface GenerateOptions {
  model: string;
  messages: ChatMessage[];
  /** optional system prompt (kept server-side, never exposed to client) */
  system?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export interface ProviderStreamChunk {
  /** incremental text delta */
  delta: string;
}

export interface AIProvider {
  readonly id: string;
  /** whether the provider has required credentials configured */
  isConfigured(): boolean;
  /** list model ids the provider can serve (best-effort) */
  listModels(): string[];
  /**
   * Streaming generation. Implementations MUST fall back to a single-chunk
   * emit if the underlying API can't stream, so callers can rely on it.
   */
  streamChat(opts: GenerateOptions): AsyncIterable<ProviderStreamChunk>;
  /** Non-streaming generation (fallback path). */
  generateChat(opts: GenerateOptions): Promise<string>;
  /** Image generation (optional capability). */
  supportsImages(): boolean;
  generateImage?(prompt: string, model?: string): Promise<{ base64: string; mimeType: string }>;
}
