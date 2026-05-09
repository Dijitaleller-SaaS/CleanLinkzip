# Threat Model

## Project Overview

CleanLink is a marketplace-style web application for matching customers with cleaning vendors. The production system is a React/Vite frontend in `artifacts/cleanlink` backed by an Express API in `artifacts/api-server`, with PostgreSQL accessed through Drizzle in `lib/db`. Users can register and log in with email/password or Google OAuth, place orders, manage vendor profiles and subscriptions, submit pilot applications, and access admin-only operations. The production deployment serves the built frontend from the API process.

## Assets

- **User accounts and sessions** — JWT bearer tokens, password hashes, Google-linked identities, password reset tokens, and admin access. Compromise enables account takeover and privileged actions.
- **Customer and vendor business data** — orders, contact details, addresses, phone numbers, reviews, notifications, vendor subscription state, and public profile data. Exposure or tampering affects privacy, revenue, and trust.
- **Payment and subscription state** — PayTR transaction records, subscription flags, package level, pending payment state, and publication status. Tampering can grant unpaid premium access or alter business workflows.
- **Application secrets and integrations** — JWT signing secret, SMTP credentials, Google OAuth client secret, PayTR merchant secrets, and database credentials. Leakage or weak defaults can collapse trust boundaries across the system.
- **Admin workflows and operational records** — vendor approvals, coupon management, financial summaries, pilot applications, bayi assignments, and audit logs. Unauthorized access impacts all tenants and business operations.

## Trust Boundaries

- **Browser to API** — all client input is untrusted. Every `/api/*` route must enforce authentication, authorization, and input validation server-side.
- **API to PostgreSQL** — API code has broad data access. Authorization mistakes or injection at the API layer expose the full application dataset.
- **API to external providers** — the server calls Google OAuth, SMTP, and PayTR using secrets. Callback/webhook handlers must authenticate the remote party and constrain side effects.
- **Public vs authenticated vs admin surfaces** — public catalog/content routes, authenticated customer/vendor/bayi routes, and admin-only routes have materially different privileges and must be separated with server-side checks.
- **Production vs dev-only artifacts** — `artifacts/mockup-sandbox` is assumed dev-only and should usually be ignored unless a production path reaches it. The production deployment serves `artifacts/cleanlink` and `artifacts/api-server` only.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/index.ts`, `artifacts/cleanlink/src/main.tsx`, `artifacts/cleanlink/src/context/AppContext.tsx`
- **Highest-risk code areas:** auth/session code under `artifacts/api-server/src/lib/` and `src/routes/auth.ts` / `google-auth.ts`; business authorization in `src/routes/vendors.ts`, `orders.ts`, `reviews.ts`, `admin.ts`; payment flow in `src/routes/paytr.ts`
- **Public surfaces:** `/api/vendors`, `/api/cms/*` GET routes, `/api/coupons/validate`, `/api/pilot-applications`, Google OAuth start/callback, frontend public pages
- **Authenticated surfaces:** `/api/orders*`, `/api/vendors/me`, `/api/vendors/havale`, `/api/vendors/notify-dekont`, `/api/reviews` POST, `/api/notifications*`, `/api/paytr/init`, `/api/bayi/me`
- **Admin surfaces:** `/api/admin/*`, coupon management, CMS mutation, pilot application review, vendor approval/subscription workflows
- **Dev-only areas usually out of scope:** `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

The application relies on self-issued JWT bearer tokens for authenticated API access and uses Google OAuth as an alternate identity provider. The system must only mint and accept tokens signed with a strong secret that exists only in production secrets storage, and every privileged route must derive authority from server-trusted identity attributes rather than mutable client-controlled data.

External callbacks also matter here. Google OAuth responses and PayTR callbacks must be validated so attackers cannot impersonate a user or provider and trigger login or payment side effects.

### Tampering

Customers and vendors can submit orders, profile updates, payment declarations, reviews, and CMS/admin mutations. The API must ignore or reject client-supplied fields that represent billing state, publication state, role, or other privileged business state. Order totals, coupon effects, subscription status, and publication flags must be computed or approved server-side.

### Information Disclosure

The system stores customer contact details, addresses, phone numbers, email addresses, pilot applications, and financial/admin views. API responses must be scoped to the authenticated principal using immutable identifiers, not display names or client-controlled labels. Sensitive tokens must not be exposed in URLs, logs, referers, or browser history, and debug/error responses should avoid leaking secrets or internals.

### Denial of Service

Public and auth-sensitive routes such as login, registration, and password reset are reachable from the internet. These routes must remain rate-limited and avoid expensive unbounded work. Public write endpoints such as pilot applications and any large JSON/body handling should remain bounded so unauthenticated users cannot exhaust server resources.

### Elevation of Privilege

The most important privilege boundaries are customer vs vendor vs bayi vs admin, plus unpaid vs paid vendor capabilities. The server must enforce these boundaries using immutable user IDs or role records from the database. Admin-only capabilities, premium vendor capabilities, and order ownership checks must not depend on mutable profile fields, display names, or client-submitted flags. All premium and admin transitions must require explicit server-side authorization or a verified external payment event.
