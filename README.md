# SyafxAI

**Think. Create. Learn.**

AI assistant modern untuk belajar, mengerjakan tugas, coding, brainstorming, menganalisis file, dan membuat gambar — dibuat oleh **Muhammad Syafiq**.

Dibangun dengan **Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Google Gemini**, siap deploy ke **Vercel**.

---

## ✨ Fitur

- **Percakapan-first UI** — minimalis, premium, calm, typography-first, light & dark mode.
- **Google Gemini** sebagai provider AI (server-side, key tidak pernah bocor ke browser).
- **Streaming response** dengan typing indicator, stop generation, auto-scroll, dan fallback non-streaming.
- **Model selector** kategori Fast / Balanced / Powerful — dikonfigurasi via environment.
- **Rendering kaya** — Markdown, tabel, blockquote, link, inline code, dan **code block** dengan syntax highlighting, label bahasa, tombol copy, serta **live preview HTML/SVG** di iframe sandbox.
- **Aksi pesan** — Copy, Regenerate, Like/Dislike, Share, Listen (TTS); user: Edit, Copy.
- **Riwayat, Search, Folder, Pin, Favorite, Rename, Delete.**
- **Share conversation** read-only via token public yang aman.
- **Supabase Auth** — Register, Login, Logout, Forgot/Reset Password, **verifikasi email OTP 6 digit**, session persistence.
- **File upload** (PDF, DOCX, TXT, PNG, JPG, WEBP) + **multimodal Gemini** (kirim gambar bersama prompt).
- **Voice input** (speech-to-text browser) & **Text-to-Speech**.
- **Image generation mode** (architecture-ready; aktif bila `GEMINI_IMAGE_MODEL` diset).
- **Admin dashboard** dengan authorization server-side.
- **Keamanan** — RLS, server-side authorization, rate limiting, input/file validation, prompt-injection guardrails, secure sessions.

Aplikasi **degrade gracefully**: tanpa `GEMINI_API_KEY` atau Supabase, UI tetap jalan dan menampilkan pesan yang jelas — tidak crash.

---

## 🚀 Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi nilainya
npm run dev
```

Buka http://localhost:3000

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=

# opsional
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_MODEL_FAST=gemini-2.5-flash-lite
GEMINI_MODEL_BALANCED=gemini-2.5-flash
GEMINI_MODEL_POWERFUL=gemini-2.5-pro
GEMINI_DEFAULT_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Dapatkan `GEMINI_API_KEY` dari Google AI Studio. Key ini **hanya** dibaca di server.

---

## 🗄️ Setup Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Salin **Project URL** & **anon key** ke `.env.local`.
3. Jalankan SQL di `supabase/schema.sql` (SQL Editor) → membuat tabel `profiles`, `conversations`, `messages`, `folders`, `shared_conversations`, `app_config` + **Row Level Security**.
4. **Authentication → Providers** → aktifkan **Email**.
5. **Authentication → Email Templates → Confirm signup** → tempel `supabase/email-templates/verify-email.html` (subject: `Verifikasi email kamu — SyafxAI`). Template menampilkan kode OTP `{{ .Token }}`.
6. **Authentication → SMTP Settings** → konfigurasi **Custom SMTP** untuk produksi (verifikasi email & reset password). Kredensial SMTP dikelola di dashboard Supabase — **tidak pernah** di frontend/git.

> Tanpa Custom SMTP, email default Supabase punya rate limit ketat. Untuk produksi, SMTP wajib.

---

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project di Vercel.
3. Tambahkan environment variables (di atas) pada Vercel Project Settings.
4. Deploy. Arsitektur serverless-compatible: tidak ada database filesystem lokal, tidak ada proses long-running; Gemini key server-side; Supabase sebagai persistent DB.

---

## 🧱 Struktur proyek

```
app/            Route (chat, auth, settings, profile, admin, share) + API routes
components/     UI: chat, auth, brand, primitives
providers/      AIProvider abstraction → GeminiProvider
services/       Data store (local + Supabase)
lib/            config, models, errors, validation, rate-limit, supabase, system-prompt
hooks/          useChat, useCapabilities, useSpeech
types/          Tipe domain provider-agnostic
utils/          helper kecil
supabase/       schema.sql + email templates
```

### Menambah provider AI lain
Implement `AIProvider` (lihat `providers/types.ts`), daftarkan di `providers/index.ts`. Seluruh app memakai format pesan provider-agnostic, jadi UI tidak perlu berubah.

---

## 🔐 Catatan keamanan

- `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan kredensial SMTP **tidak pernah** dikirim ke browser.
- Semua request AI melewati API route server-side.
- Row Level Security membatasi akses data hanya ke pemiliknya.
- Admin di-gate via `ADMIN_EMAILS` (server-side), role client tidak dipercaya.
- Rate limiting, validasi input & file, dan guardrail prompt-injection aktif secara default.

---

© SyafxAI — dibuat oleh Muhammad Syafiq.
