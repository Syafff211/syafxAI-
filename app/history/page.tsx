import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { PageShell } from "@/components/PageShell";
import { relativeTime } from "@/utils/format";
import { Icon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Riwayat">
        <p className="text-sm text-muted">
          Riwayat tersinkron memerlukan Supabase. Percakapan tamu tersimpan lokal di browser dan
          muncul di sidebar chat.
        </p>
      </PageShell>
    );
  }

  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");

  const { data } = await supabase!
    .from("conversations")
    .select("id, title, updated_at, pinned, favorite")
    .order("updated_at", { ascending: false });

  const conversations = data ?? [];

  return (
    <PageShell title="Riwayat percakapan">
      {conversations.length === 0 ? (
        <p className="text-sm text-muted">Belum ada percakapan.</p>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/?c=${c.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-elevated"
            >
              <span className="flex items-center gap-2 text-sm text-ink">
                {c.pinned && <Icon.Pin width={13} height={13} className="text-faint" />}
                {c.favorite && <Icon.Star width={13} height={13} className="text-faint" />}
                {c.title}
              </span>
              <span className="text-xs text-faint">{relativeTime(c.updated_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
