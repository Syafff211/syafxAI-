"use client";

import { useEffect, useState } from "react";
import type { ModelInfo } from "@/types";

interface ModelsResponse {
  models: ModelInfo[];
  defaultModel: string;
  capabilities: { gemini: boolean; supabase: boolean; imageGeneration: boolean };
}

/** Loads model registry + capability flags from the server once. */
export function useCapabilities() {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: ModelsResponse) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading };
}
