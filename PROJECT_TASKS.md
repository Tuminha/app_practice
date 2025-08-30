# Project Tasks — SaaS Roadmap

Use this checklist to track progress. Mark items as done by changing `[ ]` → `[x]`.

## 1) Foundation
- [x] Repo scaffold (Vite + React + TS)
- [x] Env management (`.env`, `.env.example`)
- [x] Basic linting (ESLint)
- [ ] Optional: Add Prettier + format scripts
- [ ] Add commit hooks (lint-staged + husky)

## 2) Authentication & Authorization
- [x] Supabase client + Google OAuth login
- [x] Session persistence + auth context
- [x] Profile page (basic display)
- [ ] Email/password login (optional)
- [ ] Password reset flow
- [ ] MFA (TOTP, optional)
- [ ] Role-based access control (RBAC)
- [ ] Organization/Teams model (multi-tenant)

## 3) Database & Models
- [x] Chat sessions table
- [x] Messages table
- [x] RLS policies for user isolation
- [ ] Migrations strategy (SQL files + versioning)
- [ ] Audit logs (user actions)
- [ ] Soft-deletes + retention policy (optional)

## 4) App UX
- [x] Global navigation bar with user menu
- [x] Protected routes (Chat, Profile, Settings)
- [x] Chat interface (send + list messages)
- [x] Streaming assistant responses with fallback
- [x] Retry/timeout for assistant calls
- [ ] Empty/blank states polish
- [ ] Error boundaries + error toasts
- [ ] Loading skeletons/spinners
- [ ] Keyboard shortcuts help (e.g., ? modal)

## 5) Billing (Stripe)
- [ ] Stripe products/prices setup (dashboard)
- [x] Checkout endpoint (server)
- [x] Billing portal endpoint (server)
- [ ] Webhooks handler (subscription changes)
- [ ] Plan gating in UI + server rules
- [ ] Free trial / grace period (optional)

## 6) Emails & Notifications
- [ ] Transactional email provider (Resend/Postmark)
- [ ] Welcome email + email verification
- [ ] Password reset emails (if email auth enabled)
- [x] In-app toasts (shadcn/sonner)
- [ ] In-app notifications center (optional)

## 7) AI/Assistant (optional for MVP)
- [x] Assistant replies in chat (OpenAI with streaming)
- [ ] Usage metering (tokens/time)
- [ ] Prompt templates + versioning
- [ ] Content moderation (optional)

## 8) Observability
- [ ] Centralized logging (client + server)
- [ ] Error reporting (e.g., Sentry)
- [ ] Metrics/analytics (privacy-friendly)
- [ ] Feature flags/experiments (optional)

## 9) Performance & Security
- [ ] Rate limiting (API and actions)
- [ ] Security headers (CSP, etc.)
- [ ] Secrets management and rotation
- [ ] CORS review (if backend present)

## 10) CI/CD & Infrastructure
- [ ] CI: install + lint + typecheck + tests
- [ ] Preview deployments (Vercel/Netlify)
- [ ] Environment promotion strategy (dev → prod)
- [ ] Backups + restore drills (DB)
- [ ] Infra docs (runbooks)

## 11) Docs & Support
- [ ] Update README with setup + run + deploy
- [ ] CHANGELOG (Keep a Changelog)
- [ ] User docs / onboarding guide
- [ ] Support contact + status page link

## 12) Legal & Compliance
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie banner + preferences (if needed)
- [ ] Data export/delete (user rights)
- [ ] Security page (disclosure, scope)

---

## Current Status (auto)
- Auth with Google: [x]
- Protected Chat + storage: [x]
- Navbar + user menu: [x]
- DB schema (chat_sessions, messages): [x]
- Tests and DB inspector scripts: [x]
- Streaming assistant + retry/timeout: [x]
- Stripe minimal endpoints: [x]

## Suggested Next Steps
- [x] Add assistant auto-replies to messages (store as `assistant` rows)
- [x] Add Stripe skeleton (products/prices, checkout link, webhook stub)
- [x] Seed script for demo chat/messages
- [ ] Add basic error boundaries + toasts for failures
- [ ] Add typing indicator + auto-scroll polish
- [ ] Wire Upgrade/Manage Billing buttons in UI using billing client
- [ ] Add Stripe webhook handler and subscription state
- [ ] Add integration tests for assistant-server endpoints (export app for testing)
