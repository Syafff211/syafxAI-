import { NextRequest } from "next/server";
import { getProvider } from "@/providers";
import { isImageGenerationConfigured } from "@/lib/config";
import { toAppError, errorResponse } from "@/lib/errors";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/image — image generation.
 * If no image model is configured, returns a clear not_configured error rather
 * than faking the feature. The UI stays architecture-ready.
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "image"), { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return errorResponse(
      { code: "rate_limit", message: "Terlalu banyak permintaan gambar. Coba lagi nanti." },
      429
    );
  }

  if (!isImageGenerationConfigured()) {
    return errorResponse(
      {
        code: "not_configured",
        message:
          "Image generation belum dikonfigurasi. Set GEMINI_IMAGE_MODEL pada environment server untuk mengaktifkannya.",
      },
      503
    );
  }

  let prompt = "";
  try {
    const body = await req.json();
    prompt = String(body?.prompt ?? "").slice(0, 2000);
  } catch {
    return errorResponse({ code: "validation", message: "Permintaan tidak valid." }, 400);
  }
  if (!prompt.trim()) {
    return errorResponse({ code: "validation", message: "Prompt gambar kosong." }, 400);
  }

  try {
    const provider = getProvider();
    if (!provider.generateImage) throw new Error("unavailable");
    const { base64, mimeType } = await provider.generateImage(prompt);
    return Response.json({ image: `data:${mimeType};base64,${base64}` });
  } catch (err) {
    const appErr = toAppError(err);
    return errorResponse(appErr, 502);
  }
}
