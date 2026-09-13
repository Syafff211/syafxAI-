"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAppUrlClient } from "@/lib/client-config";
import { AuthShell, Field, SubmitButton, AuthError, AuthNotice } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Autentikasi belum dikonfigurasi.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrlClient()}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Gagal mengirim email. Pastikan Custom SMTP Supabase sudah dikonfigurasi.");
      return;
    }
    setNotice("Jika email terdaftar, tautan reset telah dikirim.");
  };

  return (
    <AuthShell
      title="Lupa kata sandi"
      subtitle="Kami akan mengirim tautan untuk mengatur ulang kata sandi."
      footer={<Link href="/login" className="font-medium text-accent hover:underline">Kembali ke Masuk</Link>}
    >
      <form onSubmit={onSubmit}>
        <AuthError message={error} />
        <AuthNotice message={notice} />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
        <SubmitButton loading={loading}>Kirim tautan reset</SubmitButton>
      </form>
    </AuthShell>
  );
}
