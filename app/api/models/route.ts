import { getModelRegistry, getDefaultModelId } from "@/lib/models";
import { getPublicCapabilities } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/models — safe model metadata + capability flags for the client. */
export async function GET() {
  return Response.json({
    models: getModelRegistry(),
    defaultModel: getDefaultModelId(),
    capabilities: getPublicCapabilities(),
  });
}
