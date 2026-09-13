"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, Field, SubmitButton, AuthError } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Autentikasi belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL & ANON_KEY.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message.toLowerCase().includes("already")
        ? "Email sudah terdaftar. Silakan masuk."
        : "Gagal mendaftar. Coba lagi.");
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthShell
      title="Buat akun"
      subtitle="Mulai belajar, bekerja, dan berkreasi bersama SyafxAI."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">Masuk</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <AuthError message={error} />
        <Field label="Nama" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
        <Field label="Kata sandi" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
        <SubmitButton loading={loading}>Daftar</SubmitButton>
      </form>
    </AuthShell>
  );
}
