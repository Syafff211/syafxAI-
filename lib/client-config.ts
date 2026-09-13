/** Client-safe config helpers (no secrets). */
export function getAppUrlClient(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
