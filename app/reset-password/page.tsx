"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, Field, SubmitButton, AuthError, AuthNotice } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Kata sandi minimal 6 karakter.");
    if (password !== confirm) return setError("Konfirmasi kata sandi tidak cocok.");
    const supabase = createClient();
    if (!supabase) return setError("Autentikasi belum dikonfigurasi.");
    setLoading(true);
    // The reset link establishes a recovery session; updateUser sets the new password.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Gagal memperbarui kata sandi. Tautan mungkin sudah kedaluwarsa.");
      return;
    }
    setNotice("Kata sandi diperbarui. Mengalihkan ke Masuk…");
    setTimeout(() => router.push("/login"), 1000);
  };

  return (
    <AuthShell title="Atur ulang kata sandi" subtitle="Masukkan kata sandi baru kamu.">
      <form onSubmit={onSubmit}>
        <AuthError message={error} />
        <AuthNotice message={notice} />
        <Field label="Kata sandi baru" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <Field label="Konfirmasi kata sandi" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        <SubmitButton loading={loading}>Simpan kata sandi</SubmitButton>
      </form>
    </AuthShell>
  );
}
