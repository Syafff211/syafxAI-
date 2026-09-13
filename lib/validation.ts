import type { Attachment, ChatMessage } from "@/types";

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
export const MAX_ATTACHMENTS = 6;
export const MAX_MESSAGE_CHARS = 32_000;

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
};

export function isAllowedFile(file: { type: string; size: number }): {
  ok: boolean;
  reason?: string;
} {
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return { ok: false, reason: "Tipe file tidak didukung." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, reason: "Ukuran file melebihi 15 MB." };
  }
  return { ok: true };
}

/** Server-side validation of an incoming chat payload. Returns cleaned data or throws. */
export function validateChatPayload(body: unknown): {
  model: string;
  messages: ChatMessage[];
} {
  if (!body || typeof body !== "object") throw new Error("validation: body");
  const b = body as Record<string, unknown>;
  const model = typeof b.model === "string" ? b.model : "";
  const rawMessages = Array.isArray(b.messages) ? b.messages : null;
  if (!model) throw new Error("validation: model required");
  if (!rawMessages || rawMessages.length === 0)
    throw new Error("validation: messages required");

  const messages: ChatMessage[] = rawMessages.slice(-40).map((m: unknown) => {
    const mm = m as Record<string, unknown>;
    const role = mm.role === "assistant" ? "assistant" : "user";
    const content = String(mm.content ?? "").slice(0, MAX_MESSAGE_CHARS);
    const attachments = Array.isArray(mm.attachments)
      ? (mm.attachments as Attachment[])
          .slice(0, MAX_ATTACHMENTS)
          .filter((a) => a && ALLOWED_MIME_TYPES[a.mimeType])
      : undefined;
    return {
      id: String(mm.id ?? crypto.randomUUID()),
      role,
      content,
      attachments,
    };
  });

  return { model, messages };
}
