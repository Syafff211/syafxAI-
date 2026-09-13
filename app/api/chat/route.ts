import { NextRequest } from "next/server";
import { getProvider } from "@/providers";
import { getSystemPrompt } from "@/lib/system-prompt";
import { validateChatPayload } from "@/lib/validation";
import { toAppError, ERROR_NOT_CONFIGURED, errorResponse } from "@/lib/errors";
import { isGeminiConfigured } from "@/lib/config";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat
 * Streams an AI response using the configured provider (Gemini).
 * Server-side only: the API key never reaches the browser.
 */
export async function POST(req: NextRequest) {
  // Rate limit per client IP.
  const rl = rateLimit(clientKey(req, "chat"), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return errorResponse(
      { code: "rate_limit", message: "Terlalu banyak permintaan. Coba lagi sebentar." },
      429
    );
  }

  if (!isGeminiConfigured()) {
    return errorResponse(ERROR_NOT_CONFIGURED, 503);
  }

  let payload;
  try {
    payload = validateChatPayload(await req.json());
  } catch {
    return errorResponse(
      { code: "validation", message: "Permintaan tidak valid." },
      400
    );
  }

  const provider = getProvider();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const iterator = provider.streamChat({
          model: payload.model,
          messages: payload.messages,
          system: getSystemPrompt(),
        });
        for await (const chunk of iterator) {
          controller.enqueue(encoder.encode(chunk.delta));
        }
        controller.close();
      } catch (err) {
        const appErr = toAppError(err);
        // Emit a sentinel error line the client can parse without breaking UI.
        controller.enqueue(
          encoder.encode(`\n\n\u0000ERROR\u0000${JSON.stringify(appErr)}`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
