Supabase + Google OAuth setup
================================

This app uses Supabase Auth (Google provider) and Postgres tables to store chat sessions and messages.

1) Create a Supabase project
- Go to https://supabase.com/ and create a new project.
- In Project Settings → API, copy:
  - Project URL → use as `VITE_SUPABASE_URL`
  - anon public key → use as `VITE_SUPABASE_ANON_KEY`

2) Configure allowed URLs
- Project Settings → Authentication → URL Configuration
  - Site URL: `http://localhost:8080` (for local dev)
  - Additional Redirect URLs: add your production URL when you have one

3) Enable Google provider in Supabase
- Project Settings → Authentication → Providers → Google → Enable
- In Google Cloud Console:
  - Create an OAuth consent screen (External or Internal) and publish it.
  - Create OAuth client credentials (type: Web application).
  - Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
    - Find `<PROJECT_REF>` in your Supabase project URL.
  - Copy the client ID and client secret.
- Back in Supabase Google provider settings, paste the Client ID/Secret and save.

4) Add environment variables
- Copy `.env.example` to `.env.local` and set:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
  - `VITE_APP_URL=http://localhost:8080`

5) Create database tables and RLS policies
- Open Supabase → SQL Editor → New query, and run the SQL below.

```sql
-- Extensions (uuid + trigger helpers)
create extension if not exists pgcrypto;

-- Chat sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Update session.updated_at whenever a message is inserted
create or replace function public.touch_chat_session()
returns trigger language plpgsql as $$
begin
  update public.chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end; $$;

drop trigger if exists trg_touch_chat_session on public.messages;
create trigger trg_touch_chat_session
after insert on public.messages
for each row execute function public.touch_chat_session();

-- Enable RLS
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;

-- Policies: each user can CRUD their own sessions
create policy if not exists "own sessions read" on public.chat_sessions
  for select using (user_id = auth.uid());
create policy if not exists "own sessions insert" on public.chat_sessions
  for insert with check (user_id = auth.uid());
create policy if not exists "own sessions update" on public.chat_sessions
  for update using (user_id = auth.uid());
create policy if not exists "own sessions delete" on public.chat_sessions
  for delete using (user_id = auth.uid());

-- Policies: messages only within own sessions
create policy if not exists "own messages read" on public.messages
  for select using (user_id = auth.uid());
create policy if not exists "own messages insert" on public.messages
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
create policy if not exists "own messages delete" on public.messages
  for delete using (user_id = auth.uid());
```

6) Install deps and run locally
```bash
npm i
npm run dev
```

7) Login flow
- Click "Continue with Google" on the landing page.
- After login, you’ll be redirected to `/chat`.
- New chats and messages are persisted in Supabase.

