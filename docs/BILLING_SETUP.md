# Billing Setup (Stripe + Supabase)

## 1) Create table for billing status

Run in Supabase SQL Editor:

```
create table if not exists public.billing_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_customer_id text unique,
  plan text not null default 'free', -- 'free' | 'pro'
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.billing_status enable row level security;

-- Users can read their own billing status
create policy if not exists "billing self read" on public.billing_status
  for select using (auth.uid() = user_id);

-- Only service role can insert/update/delete (done by webhook)
create policy if not exists "billing service write" on public.billing_status
  for all to service_role using (true) with check (true);
```

## 2) Configure server environment

Assistant server (`npm run assistant`) requires:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (or `STRIPE_PRICE_PRO`)
- `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`
- `STRIPE_WEBHOOK_SECRET` (if verifying webhooks)
- `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`

## 3) Webhook

- Point your Stripe webhook to `http://localhost:8787/api/billing/webhook` in dev.
- Events used:
  - `checkout.session.completed` → marks user as `pro` using `client_reference_id` or metadata.
  - `customer.subscription.created/updated/deleted` → updates plan by customer id.

## 4) Client

- The app uses `BillingProvider` to fetch plan via `/api/billing/status` with `user_id` and/or `customer_id`.
- Upgrade uses `/api/billing/checkout` with the current `user_id` in metadata.

```
// To surface plan on UI, consume useBilling()
const { plan, upgrade, manage } = useBilling()
```

## 5) Admin (dev-only)

- Use `/api/billing/admin/list?token=...` (not exposed by default; add your own guard in production).

