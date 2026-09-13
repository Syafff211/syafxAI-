import { createAdminSupabase } from "@/lib/supabase/server";
import { SharedView } from "@/components/SharedView";
import { LogoMark } from "@/components/brand/Logo";
import { BRAND } from "@/lib/branding";
import type { ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Public, READ-ONLY shared conversation view.
 *
 * Visitors do not need to log in. When Supabase is configured, the page reads
 * the shared_conversations row by token (respecting expiry) using a trusted
 * server client. Otherwise it renders a demo notice — the local-only share
 * (browser sessionStorage) is resolved client-side by SharedView.
 */
export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
  let title = "Percakapan";
  let messages: Pick<ChatMessage, "role" | "content">[] = [];
  let found = false;
  let expired = false;

  const supabase = createAdminSupabase();
  if (supabase) {
    const { data: share } = await supabase
      .from("shared_conversations")
      .select("conversation_id, expires_at")
      .eq("share_token", params.token)
      .maybeSingle();

    if (share) {
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        expired = true;
      } else {
        const { data: conv } = await supabase
          .from("conversations")
          .select("title")
          .eq("id", share.conversation_id)
          .maybeSingle();
        const { data: msgs } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", share.conversation_id)
          .order("created_at", { ascending: true });
        if (conv) title = conv.title;
        if (msgs) {
          messages = msgs as any;
          found = true;
        }
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="flex h-12 items-center justify-between border-b border-border px-4">
        <a href="/" className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span className="text-sm font-semibold">Syafx<span className="text-accent">AI</span></span>
        </a>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">Read-only</span>
      </header>
      <SharedView
        token={params.token}
        serverTitle={title}
        serverMessages={messages}
        serverFound={found}
        serverExpired={expired}
        supabaseConfigured={Boolean(supabase)}
      />
      <footer className="border-t border-border py-6 text-center text-xs text-faint">
        {BRAND.name} — {BRAND.tagline}
      </footer>
    </div>
  );
}
