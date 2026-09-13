-- ════════════════════════════════════════════════════════════════
--  SyafxAI — Supabase schema + Row Level Security
--  Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- ════════════════════════════════════════════════════════════════

-- Extensions ------------------------------------------------------
create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text,
  avatar      text,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

-- ── folders ─────────────────────────────────────────────────────
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── conversations ───────────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Percakapan baru',
  model       text,
  pinned      boolean not null default false,
  favorite    boolean not null default false,
  folder_id   uuid references public.folders(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists conversations_user_idx on public.conversations(user_id, updated_at desc);

-- ── messages ────────────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant','system')),
  content          text not null default '',
  model            text,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
-- Full-text-ish search helper
create index if not exists messages_content_trgm on public.messages using gin (to_tsvector('simple', content));

-- ── shared_conversations ────────────────────────────────────────
create table if not exists public.shared_conversations (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  share_token      text not null unique,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz
);
create index if not exists shared_token_idx on public.shared_conversations(share_token);

-- ── app_config (admin-managed settings; optional) ───────────────
create table if not exists public.app_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════
--  Auto-create a profile on signup
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep conversations.updated_at fresh
create or replace function public.touch_conversation()
returns trigger language plpgsql as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════
alter table public.profiles              enable row level security;
alter table public.folders               enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.shared_conversations  enable row level security;
alter table public.app_config            enable row level security;

-- profiles: owner-only
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- folders: owner-only
drop policy if exists "folders_owner" on public.folders;
create policy "folders_owner" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- conversations: owner-only
drop policy if exists "conversations_owner" on public.conversations;
create policy "conversations_owner" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- messages: accessible only if the parent conversation belongs to the user
drop policy if exists "messages_owner" on public.messages;
create policy "messages_owner" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- shared_conversations: owner can manage shares for their own conversations
drop policy if exists "shares_owner" on public.shared_conversations;
create policy "shares_owner" on public.shared_conversations
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = shared_conversations.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = shared_conversations.conversation_id and c.user_id = auth.uid()
    )
  );

-- Public READ of shared conversations is handled server-side via the service
-- role (see app/share/[token]). We intentionally do NOT expose a broad anon
-- SELECT policy on messages/conversations to avoid leaking private data.

-- app_config: no client access (managed via service role in server/admin only)
drop policy if exists "app_config_none" on public.app_config;
create policy "app_config_none" on public.app_config
  for select using (false);

-- ════════════════════════════════════════════════════════════════
--  DONE. Next steps:
--   1) Dashboard → Authentication → Providers → enable Email.
--   2) Dashboard → Authentication → SMTP Settings → configure Custom SMTP
--      for production email delivery (verification / reset).
--   3) Dashboard → Authentication → Email Templates → paste SyafxAI template
--      (see supabase/email-templates/verify-email.html).
-- ════════════════════════════════════════════════════════════════
