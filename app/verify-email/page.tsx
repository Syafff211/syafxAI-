"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthError, AuthNotice } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value: string) => {
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Autentikasi belum dikonfigurasi.");
      return;
    }
    if (value.length !== 6) return;
    setLoading(true);
    // Uses Supabase's built-in OTP verification (type "email").
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: value,
      type: "email",
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("expired")) {
        setError("Kode sudah kedaluwarsa. Silakan kirim kode baru.");
      } else {
        setError("Kode verifikasi tidak valid.");
      }
      setCode("");
      return;
    }
    setNotice("Email terverifikasi! Mengalihkan…");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 800);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Autentikasi belum dikonfigurasi.");
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setError("Gagal mengirim ulang kode. Coba lagi nanti.");
      return;
    }
    setNotice("Kode baru telah dikirim ke email kamu.");
    setCooldown(60);
  };

  return (
    <AuthShell
      title="Verifikasi Email"
      subtitle={`Masukkan kode yang kami kirim ke ${email || "email kamu"}.`}
      footer={
        <button
          onClick={resend}
          disabled={cooldown > 0}
          className="font-medium text-accent hover:underline disabled:text-faint disabled:no-underline"
        >
          {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim ulang kode"}
        </button>
      }
    >
      <AuthError message={error} />
      <AuthNotice message={notice} />
      <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={loading} />
      <button
        onClick={() => verify(code)}
        disabled={loading || code.length !== 6}
        className="mt-5 w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Memverifikasi…" : "Verifikasi"}
      </button>
      <p className="mt-3 text-center text-xs text-faint">
        Tidak menerima email? Periksa folder spam atau kirim ulang kode.
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
