"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, Field, SubmitButton, AuthError } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Autentikasi belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL & ANON_KEY.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("not confirmed")) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("Email atau kata sandi salah.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <AuthShell
      title="Masuk"
      subtitle="Selamat datang kembali di SyafxAI."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">Daftar</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <AuthError message={error} />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
        <Field label="Kata sandi" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <div className="mb-3 text-right">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-accent">Lupa kata sandi?</Link>
        </div>
        <SubmitButton loading={loading}>Masuk</SubmitButton>
      </form>
    </AuthShell>
  );
}
