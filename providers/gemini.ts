import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from "@google/generative-ai";
import type { AIProvider, GenerateOptions, ProviderStreamChunk } from "./types";
import type { ChatMessage } from "@/types";

/**
 * GeminiProvider — the concrete AIProvider backed by Google Gemini.
 *
 * All access to the Gemini SDK is contained here. The API key is read from the
 * server-only GEMINI_API_KEY env var and never leaves the server.
 */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  private client: GoogleGenerativeAI | null;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  listModels(): string[] {
    return [
      process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash-lite",
      process.env.GEMINI_MODEL_BALANCED || "gemini-2.5-flash",
      process.env.GEMINI_MODEL_POWERFUL || "gemini-2.5-pro",
    ];
  }

  supportsImages(): boolean {
    return Boolean(process.env.GEMINI_IMAGE_MODEL);
  }

  private toContents(messages: ChatMessage[]): Content[] {
    const contents: Content[] = [];
    for (const m of messages) {
      if (m.role === "system") continue; // handled via systemInstruction
      const parts: Part[] = [];
      if (m.content) parts.push({ text: m.content });
      for (const att of m.attachments ?? []) {
        if (att.data && att.mimeType) {
          parts.push({
            inlineData: { data: att.data, mimeType: att.mimeType },
          });
        }
      }
      if (parts.length === 0) continue;
      contents.push({ role: m.role === "assistant" ? "model" : "user", parts });
    }
    return contents;
  }

  async *streamChat(opts: GenerateOptions): AsyncIterable<ProviderStreamChunk> {
    if (!this.client) throw new Error("Gemini API key not configured");
    const model = this.client.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });

    const contents = this.toContents(opts.messages);

    try {
      const result = await model.generateContentStream({
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
        },
      });
      for await (const chunk of result.stream) {
        if (opts.signal?.aborted) break;
        const text = chunk.text();
        if (text) yield { delta: text };
      }
    } catch (streamErr) {
      // Fallback to non-streaming for this request rather than breaking UX.
      const text = await this.generateChat(opts).catch(() => {
        throw streamErr;
      });
      if (text) yield { delta: text };
    }
  }

  async generateChat(opts: GenerateOptions): Promise<string> {
    if (!this.client) throw new Error("Gemini API key not configured");
    const model = this.client.getGenerativeModel({
      model: opts.model,
      systemInstruction: opts.system,
    });
    const result = await model.generateContent({
      contents: this.toContents(opts.messages),
      generationConfig: { temperature: opts.temperature ?? 0.7 },
    });
    return result.response.text();
  }

  async generateImage(
    prompt: string,
    model = process.env.GEMINI_IMAGE_MODEL
  ): Promise<{ base64: string; mimeType: string }> {
    if (!this.client) throw new Error("Gemini API key not configured");
    if (!model) throw new Error("Image generation model not configured");

    const genModel = this.client.getGenerativeModel({ model });
    const result = await genModel.generateContent(prompt);
    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = (part as { inlineData?: { data: string; mimeType: string } })
        .inlineData;
      if (inline?.data) {
        return { base64: inline.data, mimeType: inline.mimeType || "image/png" };
      }
    }
    throw new Error("No image returned by model");
  }
}
