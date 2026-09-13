"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useCapabilities } from "@/hooks/useCapabilities";
import { PageShell, SettingsRow } from "@/components/PageShell";
import { cn } from "@/utils/cn";

type Tab = "account" | "appearance" | "models" | "chat" | "voice" | "privacy" | "shortcuts";

const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "models", label: "Models" },
  { id: "chat", label: "Chat" },
  { id: "voice", label: "Voice" },
  { id: "privacy", label: "Privacy" },
  { id: "shortcuts", label: "Keyboard Shortcuts" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: caps } = useCapabilities();
  const [tab, setTab] = useState<Tab>("account");

  const [defaultModel, setDefaultModel] = useState<string>("");

  const logout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <PageShell title="Settings" wide>
      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                tab === t.id ? "bg-elevated font-medium text-ink" : "text-muted hover:bg-elevated/60 hover:text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 rounded-xl border border-border bg-surface p-5">
          {tab === "account" && (
            <div>
              <SettingsRow label="Profil" description="Kelola nama & avatar">
                <a href="/profile" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-elevated">Buka profil</a>
              </SettingsRow>
              <SettingsRow label="Keluar" description="Akhiri sesi di perangkat ini">
                <button onClick={logout} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40">Logout</button>
              </SettingsRow>
            </div>
          )}

          {tab === "appearance" && (
            <SettingsRow label="Tema" description="Sesuaikan tampilan SyafxAI">
              <div className="flex rounded-lg border border-border p-0.5">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                      theme === t ? "bg-elevated text-ink" : "text-muted hover:text-ink"
                    )}
                  >
                    {t === "light" ? "Light" : t === "dark" ? "Dark" : "System"}
                  </button>
                ))}
              </div>
            </SettingsRow>
          )}

          {tab === "models" && (
            <SettingsRow label="Model Gemini default" description="Model yang dipakai untuk percakapan baru">
              <select
                value={defaultModel || caps?.defaultModel || ""}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent"
              >
                {caps?.models.map((m) => (
                  <option key={m.id} value={m.id}>{m.label} — {m.id}</option>
                ))}
              </select>
            </SettingsRow>
          )}

          {tab === "chat" && (
            <>
              <SettingsRow label="Auto-scroll" description="Ikuti respons AI saat streaming"><Toggle defaultOn /></SettingsRow>
              <SettingsRow label="Kirim dengan Enter" description="Enter mengirim, Shift+Enter baris baru"><Toggle defaultOn /></SettingsRow>
            </>
          )}

          {tab === "voice" && (
            <>
              <SettingsRow label="Text-to-Speech" description="Baca respons AI dengan suara">
                <Toggle defaultOn />
              </SettingsRow>
              <SettingsRow label="Bahasa suara" description="Bahasa untuk STT & TTS">
                <select className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm outline-none">
                  <option>Bahasa Indonesia</option>
                  <option>English</option>
                </select>
              </SettingsRow>
            </>
          )}

          {tab === "privacy" && (
            <>
              <SettingsRow label="Simpan riwayat" description="Percakapan disimpan untuk akses nanti"><Toggle defaultOn /></SettingsRow>
              <SettingsRow label="Hapus semua percakapan lokal" description="Menghapus data di browser ini">
                <button
                  onClick={() => { Object.keys(localStorage).filter((k) => k.startsWith("syafxai:")).forEach((k) => localStorage.removeItem(k)); location.reload(); }}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40"
                >
                  Hapus
                </button>
              </SettingsRow>
            </>
          )}

          {tab === "shortcuts" && (
            <div className="space-y-2 text-sm">
              {[
                ["Enter", "Kirim pesan"],
                ["Shift + Enter", "Baris baru"],
                ["Esc", "Tutup dialog"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span className="text-muted">{v}</span>
                  <kbd className="rounded-md border border-border bg-elevated px-2 py-0.5 font-mono text-xs">{k}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Toggle({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(Boolean(defaultOn));
  return (
    <button
      onClick={() => setOn((o) => !o)}
      className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-accent" : "bg-border")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", on ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}
