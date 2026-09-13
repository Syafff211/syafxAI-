import { NextRequest } from "next/server";
import { getProvider } from "@/providers";
import { isGeminiConfigured } from "@/lib/config";
import { getDefaultModelId } from "@/lib/models";
import { deriveTitle } from "@/utils/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/title — generate a short conversation title from the first message.
 * Falls back to a heuristic title if Gemini is unavailable.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const firstMessage = String(body?.message ?? "").slice(0, 2000);

  if (!firstMessage.trim()) {
    return Response.json({ title: "Percakapan baru" });
  }

  if (!isGeminiConfigured()) {
    return Response.json({ title: deriveTitle(firstMessage) });
  }

  try {
    const provider = getProvider();
    const text = await provider.generateChat({
      model: getDefaultModelId(),
      system:
        "Buat judul singkat (maksimal 6 kata) untuk percakapan berikut. Jawab hanya judulnya, tanpa tanda kutip.",
      messages: [{ id: "t", role: "user", content: firstMessage }],
      temperature: 0.3,
    });
    const title = text.replace(/["\n]/g, "").trim().slice(0, 60);
    return Response.json({ title: title || deriveTitle(firstMessage) });
  } catch {
    return Response.json({ title: deriveTitle(firstMessage) });
  }
}
