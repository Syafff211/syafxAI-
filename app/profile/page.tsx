import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, isAdminEmail } from "@/lib/config";
import { PageShell, SettingsRow } from "@/components/PageShell";
import { ProfileActions } from "@/components/ProfileActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Profil">
        <p className="text-sm text-muted">
          Autentikasi belum dikonfigurasi. Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> untuk mengaktifkan akun.
        </p>
      </PageShell>
    );
  }

  const { user } = await getSessionUser();
  if (!user) redirect("/login");

  const admin = isAdminEmail(user.email);

  return (
    <PageShell title="Profil">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
            {(user.user_metadata?.name as string)?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </span>
          <div>
            <div className="font-medium text-ink">{(user.user_metadata?.name as string) || "Pengguna"}</div>
            <div className="text-sm text-muted">{user.email}</div>
          </div>
        </div>
        <SettingsRow label="Email" description="Alamat email akun kamu">
          <span className="text-sm text-muted">{user.email}</span>
        </SettingsRow>
        <SettingsRow label="Status verifikasi">
          <span className={`text-sm ${user.email_confirmed_at ? "text-emerald-600" : "text-amber-600"}`}>
            {user.email_confirmed_at ? "Terverifikasi" : "Belum terverifikasi"}
          </span>
        </SettingsRow>
        {admin && (
          <SettingsRow label="Admin" description="Kamu memiliki akses admin">
            <Link href="/admin" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-elevated">
              Buka Admin
            </Link>
          </SettingsRow>
        )}
        <div className="pt-4">
          <ProfileActions />
        </div>
      </div>
    </PageShell>
  );
}
