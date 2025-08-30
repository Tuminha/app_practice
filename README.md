# Login Practice Playground — OAuth + Chat + Billing

This app is a learning playground for modern SaaS concepts:

- Google OAuth via Supabase Auth
- GPT assistant with streaming replies (local server)
- Saved chat sessions/messages in Supabase
- Stripe checkout, billing portal, and plan status
- Pricing page, Profile, Settings, and Admin (dev) views

Stack: Vite + React + TypeScript, Tailwind + shadcn/ui, Supabase, Stripe, Express, Vitest.

## Quick start

1) Install deps

```bash
npm i
```

2) Configure env files (do NOT commit secrets)

- Copy `.env.example` to `.env` and fill values (see Env Vars below)
- Ensure `.env` and `.env.*` are ignored by Git (already configured)

3) Run the assistant/billing server (uses server-side secrets)

```bash
npm run assistant
```

4) Run the frontend

```bash
npm run dev
```

Open http://localhost:8080

## Features

- Google login via Supabase (redirects to `/chat`)
- Chat UI with saved sessions and messages
- Streaming assistant replies using OpenAI Chat Completions (SSE)
- Pricing section with “Upgrade to Pro” via Stripe Checkout
- Manage Billing via Stripe Billing Portal
- Settings page with plan display and customer ID storage
- Profile shows subscription plan
- Admin (dev-only) lists billing_status rows

## Env Vars

Client (Vite — safe to expose in browser):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL` (default `http://localhost:8080`)
- `VITE_ASSISTANT_BASE_URL` (default `http://localhost:8787`)
- `VITE_STRIPE_CUSTOMER_ID` (optional, convenience for portal)
- `VITE_ADMIN_TOKEN` (dev-only; toggles Admin link)

Server (assistant-server — never expose to client):

- `OPENAI_API_KEY` (e.g., GPT model key)
- `OPENAI_MODEL` (default `gpt-4o`)
- `SUPABASE_URL` (or reuse `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (or `STRIPE_PRICE_PRO`)
- `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`
- `STRIPE_WEBHOOK_SECRET` (verifies incoming webhooks)
- `STRIPE_DEFAULT_CUSTOMER_ID` (optional)
- `ADMIN_TOKEN` (or `VITE_ADMIN_TOKEN`) for dev admin list endpoint

See:
- `docs/SUPABASE_SETUP.md` for Google OAuth + chat tables + RLS
- `docs/BILLING_SETUP.md` for `billing_status` table + policies + webhook

## Security and Git hygiene

- Secrets are loaded from `.env` at runtime and are ignored by Git:
  - `.env`, `.env.*` are in `.gitignore`; `.env.example` is allowed
- If you previously committed a secret file, rotate the key in the provider console and remove from history:

```bash
git rm --cached .env
git commit -m "Remove .env from repo"
# Optional but recommended: rotate keys in OpenAI, Supabase, Stripe
```

- Server-only keys used in `scripts/assistant-server.mjs`/`scripts/assistant-app.mjs` never appear in client bundles.
- Avoid placing secrets under `src/` (client code) — use `VITE_*` only for non-sensitive config.

## Routing and pages

- `/` Landing (Hero, Features, CodeExample, Pricing)
- `/chat` Protected chat
- `/profile` Profile (name/email/avatar + plan)
- `/settings` Billing actions and preferences
- `/admin` Dev-only billing table view (requires `VITE_ADMIN_TOKEN`)

## Development

- Assistant server: `npm run assistant` (Express server at `http://localhost:8787`)
  - Endpoints: `/api/assistant`, `/api/assistant/stream`, `/api/billing/*`
  - Uses OpenAI and Stripe with server-side env vars
- Frontend: `npm run dev` (Vite dev server at `http://localhost:8080`)
  - Vite proxy forwards `/api/*` to assistant server in dev

## Testing

Run all tests:

```bash
npm test
```

Tests cover assistant logic, retry/streaming, billing client, assistant server endpoints (via supertest), pricing button behavior, and basic Supabase connectivity.

## Stripe setup (summary)

- Create a Product and a recurring Price in the Stripe Dashboard
- Set `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` in `.env`
- Set success/cancel URLs
- Configure webhook to `http://localhost:8787/api/billing/webhook` in dev

## Supabase setup (summary)

- Create project; enable Google provider
- Create tables and RLS:
  - `chat_sessions`, `messages` (see `docs/SUPABASE_SETUP.md`)
  - `billing_status` (see `docs/BILLING_SETUP.md`)
- Set keys in `.env`

## Notes

- This is a learning project; hardening (authn for admin endpoints, rate limiting, error boundaries, etc.) is left as next steps.
