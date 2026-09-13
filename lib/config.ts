/**
 * Server-side configuration & capability detection.
 *
 * IMPORTANT: This module reads server-only secrets (GEMINI_API_KEY, service
 * role key, etc.). Never import it into client components. The app is designed
 * to *degrade gracefully* when things are not configured rather than crash.
 */

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isImageGenerationConfigured(): boolean {
  return Boolean(process.env.GEMINI_IMAGE_MODEL && process.env.GEMINI_API_KEY);
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

/** Public, non-secret capability flags for the client. */
export interface PublicCapabilities {
  gemini: boolean;
  supabase: boolean;
  imageGeneration: boolean;
}

export function getPublicCapabilities(): PublicCapabilities {
  return {
    gemini: isGeminiConfigured(),
    supabase: isSupabaseConfigured(),
    imageGeneration: isImageGenerationConfigured(),
  };
}
