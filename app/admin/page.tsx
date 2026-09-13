import { redirect } from "next/navigation";
import { getSessionUser, createAdminSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured, isAdminEmail, getPublicCapabilities } from "@/lib/config";
import { getModelRegistry, getDefaultModelId } from "@/lib/models";
import { PageShell } from "@/components/PageShell";

export const dynamic = "force-dynamic";

async function getStats() {
  const admin = createAdminSupabase();
  if (!admin) return null;
  const [users, convs, msgs] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin.from("messages").select("id", { count: "exact", head: true }),
  ]);
  return {
    users: users.count ?? 0,
    conversations: convs.count ?? 0,
    messages: msgs.count ?? 0,
  };
}

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Admin" wide>
        <p className="text-sm text-muted">Supabase belum dikonfigurasi.</p>
      </PageShell>
    );
  }

  const { user } = await getSessionUser();
  if (!user) redirect("/login");
  // Server-side admin gate. Never trust a client-provided role.
  if (!isAdminEmail(user.email)) redirect("/");

  const stats = await getStats();
  const caps = getPublicCapabilities();
  const models = getModelRegistry();

  return (
    <PageShell title="Admin Dashboard" wide>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total pengguna" value={stats?.users ?? "—"} />
        <StatCard label="Total percakapan" value={stats?.conversations ?? "—"} />
        <StatCard label="Total pesan (AI usage)" value={stats?.messages ?? "—"} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">Konfigurasi AI</h2>
        <div className="rounded-xl border border-border bg-surface p-5">
          <Row label="Provider AI" value="Google Gemini" />
          <Row label="Model default" value={getDefaultModelId()} />
          <Row label="Gemini terkonfigurasi" value={caps.gemini ? "Ya" : "Tidak"} good={caps.gemini} />
          <Row label="Image generation" value={caps.imageGeneration ? "Aktif" : "Belum dikonfigurasi"} good={caps.imageGeneration} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">Model tersedia</h2>
        <div className="rounded-xl border border-border bg-surface p-5">
          {models.map((m) => (
            <Row key={m.id} label={`${m.label} (${m.tier})`} value={m.id} />
          ))}
        </div>
      </section>

      <p className="mt-6 text-xs text-faint">
        Statistik agregat dibaca melalui service-role di server. Konfigurasi model & limit dikelola
        via environment variables dan Supabase (RLS aktif). Pengelolaan lanjutan (usage limit,
        feature flags, kelola user) siap dikembangkan pada tabel <code className="font-mono">app_config</code>.
      </p>
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-2xl font-semibold tracking-tight text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className={good === undefined ? "font-medium text-ink" : good ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>
        {value}
      </span>
    </div>
  );
}
