import type { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";

/**
 * Provider factory. Today: Gemini. Tomorrow: add more and select by env/config.
 * Keeping this indirection means the rest of the app stays provider-agnostic.
 */
let cached: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (cached) return cached;
  cached = new GeminiProvider();
  return cached;
}

export type { AIProvider } from "./types";
