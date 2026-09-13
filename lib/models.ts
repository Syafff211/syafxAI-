import type { ModelInfo, ModelTier } from "@/types";

/**
 * Model registry — configurable via environment variables so the app is never
 * locked to a single Gemini model. UI shows tiers: Fast / Balanced / Powerful.
 *
 * These values are read on the SERVER (via config.ts). The public model list
 * shown in the selector is exposed through /api/models (safe metadata only).
 */

export const DEFAULT_MODEL_IDS = {
  fast: process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash-lite",
  balanced: process.env.GEMINI_MODEL_BALANCED || "gemini-2.5-flash",
  powerful: process.env.GEMINI_MODEL_POWERFUL || "gemini-2.5-pro",
} as const;

export function getModelRegistry(): ModelInfo[] {
  return [
    {
      id: DEFAULT_MODEL_IDS.fast,
      label: "Fast",
      tier: "fast",
      description: "Cepat & ringan untuk tanya jawab sehari-hari.",
      multimodal: true,
    },
    {
      id: DEFAULT_MODEL_IDS.balanced,
      label: "Balanced",
      tier: "balanced",
      description: "Keseimbangan kecepatan dan kualitas jawaban.",
      multimodal: true,
    },
    {
      id: DEFAULT_MODEL_IDS.powerful,
      label: "Powerful",
      tier: "powerful",
      description: "Penalaran mendalam untuk tugas kompleks.",
      multimodal: true,
    },
  ];
}

export function getDefaultModelId(): string {
  return (
    process.env.GEMINI_DEFAULT_MODEL ||
    DEFAULT_MODEL_IDS.balanced ||
    "gemini-2.5-flash"
  );
}

export function resolveModel(id: string | undefined): ModelInfo {
  const registry = getModelRegistry();
  const found = registry.find((m) => m.id === id);
  return found ?? registry[1] ?? registry[0];
}

export function tierForModel(id: string): ModelTier {
  return resolveModel(id).tier;
}
