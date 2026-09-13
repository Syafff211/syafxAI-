import type { AppError } from "@/types";

/**
 * Normalizes arbitrary thrown values into a safe, user-friendly AppError.
 * Never leaks stack traces to clients.
 */
export function toAppError(err: unknown): AppError {
  const raw = String(
    (err as { message?: string })?.message ?? err ?? ""
  ).toLowerCase();

  if (raw.includes("api key") || raw.includes("api_key") || raw.includes("permission") || raw.includes("401") || raw.includes("403")) {
    return {
      code: "invalid_api_key",
      message:
        "API key tidak valid atau tidak memiliki izin. Periksa konfigurasi GEMINI_API_KEY di server.",
    };
  }
  if (raw.includes("not found") || raw.includes("404") || raw.includes("unavailable") || raw.includes("does not exist")) {
    return {
      code: "model_unavailable",
      message:
        "Model yang dipilih sedang tidak tersedia. Coba pilih model lain.",
    };
  }
  if (raw.includes("rate") || raw.includes("quota") || raw.includes("429") || raw.includes("resource_exhausted")) {
    return {
      code: "rate_limit",
      message:
        "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
    };
  }
  if (raw.includes("timeout") || raw.includes("timed out") || raw.includes("deadline")) {
    return {
      code: "timeout",
      message: "Permintaan memakan waktu terlalu lama. Silakan coba lagi.",
    };
  }
  if (raw.includes("network") || raw.includes("fetch failed") || raw.includes("econn") || raw.includes("enotfound")) {
    return {
      code: "network",
      message: "Terjadi masalah jaringan. Periksa koneksi lalu coba lagi.",
    };
  }
  return {
    code: "unknown",
    message: "Terjadi kesalahan tak terduga. Silakan coba lagi.",
  };
}

export const ERROR_NOT_CONFIGURED: AppError = {
  code: "not_configured",
  message:
    "Gemini API belum dikonfigurasi. Tambahkan GEMINI_API_KEY pada environment server untuk mengaktifkan chat.",
};

export function errorResponse(err: AppError, status = 400) {
  return new Response(JSON.stringify({ error: err }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
