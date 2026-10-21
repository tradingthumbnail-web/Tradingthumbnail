# KiThumbs application manual

This document describes how the **KiThumbs web application** works at the current repository revision (`main` @ rollback point before YouTube channel sync).

The product is a **Nuxt 4 SPA** (SSR disabled) that generates AI thumbnails and images, manages avatars/assets, and bills users through **Stripe** credits and subscriptions.

---

## 1. What the product is

KiThumbs helps creators generate and edit YouTube-oriented visuals (and general images) with AI:

- **Quick generation** — text-to-image / image-to-image with multiple models
- **Quick thumb** — thumbnail-oriented generation (OpenAI path)
- **Sketch** — sketch-to-image workflow (OpenRouter Image API)
- **Photoshoot / face swap / fine edit / inpainting / outpainting / image-to-image**
- **Pipelines** — multi-step generation graphs
- **Avatars** — train personal LoRA models via FAL, then use them in generation
- **Assets library** — upload/reuse reference media; optional client-side background removal
- **Billing** — Polar for new checkouts; Stripe webhooks remain for existing Stripe subscribers until cutover
- **Admin** — obfuscated admin page for user management / impersonation / avatar credits

There is **no YouTube channel OAuth sync, metrics dashboard, or background worker integration** in this revision.

---

## 2. Repository layout (this revision)

```text
kithumbs-app/
├── docker-compose.yml          # Local Postgres only
├── config/                     # gitignored secrets + postgres volume (see *.example)
├── docs/                       # This manual and siblings
├── frontend/                   # THE application (Nuxt 4 + Nitro/Bun)
│   ├── app/                    # Vue UI (pages, components, stores, middleware)
│   ├── server/                 # HTTP API, services, DB, storage, webhooks
│   ├── shared/                 # Types safe for client + server
│   ├── drizzle.config.ts
│   ├── nuxt.config.ts
│   └── .env.example
├── worker/                     # Placeholder only (see docs/WORKER.md)
├── package.json                # Empty stub (not a Bun workspace root)
└── MIGRATIONS.md               # Env / migration status table
```

Almost all runtime code lives under **`frontend/`**.

---

## 3. Runtime stack

| Layer | Choice |
|-------|--------|
| UI | Vue 3 + Nuxt 4, Pinia, Tailwind, DaisyUI, i18n (`en` / `es` / `ca`) |
| Rendering | `ssr: false` (client SPA) |
| Server | Nitro with `preset: 'bun'` |
| Package manager / runtime | **Bun** |
| Database | PostgreSQL 16 + **Drizzle ORM** (schemas inside the app) |
| Auth | Custom session cookies (not Better Auth) |
| Passwords | Argon2 (`@node-rs/argon2`) |
| Sessions | Cookie `auth_session` + hashed session id in `session` table (Oslo crypto) |
| Billing | **Polar** Checkout + webhooks for new purchases; **Stripe** webhooks retained for existing subscribers |
| Object storage | AWS S3 SDK (S3 / R2 / compatible) |
| Image AI | FAL.ai (primary), OpenAI (quick-thumb), OpenRouter (LLM helpers + Sketch) |
| Email | Resend |
| Analytics | PostHog (optional) |
| Security module | `nuxt-security` rate limiter |

---

## 4. Boot sequence

1. Bun/Nuxt loads env (`bun run dev` uses `--dotenv .env.dev`).
2. `server/database/index.ts` imports → calls `validateEnvironmentVariables()`.
3. Missing **required** env vars abort startup (see §11 / `frontend/.env.example`).
4. A `pg` `Pool` + Drizzle client is created with co-located schemas.
5. Nitro serves the SPA + `/api/**` on port **3000**.
6. Health check: `GET /api/health` runs `SELECT 1` against Postgres.

---

## 5. Authentication & session model

### 5.1 Mechanisms

- **Email + password** signup/login (`/api/v1/auth/signup`, `/login`)
- **Google Sign-In** (`/api/v1/auth/google/validate-token`) using `NUXT_GOOGLE_CLIENT_ID` / `SECRET`
- **Email verification** via Resend + token flow (`/validate-email`)
- **Password reset** token flow (`/reset-password`)

Signup can be disabled by setting `NUXT_PUBLIC_ENABLE_SIGN_IN=false`.

### 5.2 Session cookie

- Cookie name: `auth_session`
- Token is a random Base32 string; DB stores **SHA-256 hex** of the token as session id
- TTL ≈ 30 days (`createSession` in `server/utils/auth.ts`)
- `secure` cookie flag when `NODE_ENV === "production"`

### 5.3 Middleware

**Server** (`server/middleware/auth.ts`):

- Reads cookie → loads `session`, `user`, latest `subscription`, `tier`
- Attaches to `event.context` (`user`, `session`, `tier`, `subscription`)
- Does **not** hard-block unauthenticated API calls by itself; handlers check `event.context.user`

**Client** (`app/middleware/auth.global.ts`):

- Calls `GET /api/v1/auth/user`
- Public routes only: `/login`, `/signup`, `/reset-password`, `/validate-email`
- Authenticated users hitting those → redirect `/`
- Unauthenticated users elsewhere → redirect `/login`

### 5.4 Roles

`user.role`: `USER` | `ADMIN`. Admin UI lives under an obfuscated route:

`/(admin)/2a87e77e-19a8-4448-9eeb-fa72c1e6e4a7`

Admin APIs under `/api/v1/admin/*` (list users, impersonate, grant avatar credits).

---

## 6. Credits, tiers, and billing

### 6.1 Two credit wallets

On `user`:

| Column | Purpose |
|--------|---------|
| `credit` | Generation credits (images / edits) |
| `avatar_credit` | LoRA avatar training slots / credits |

Spending generations typically goes through `POST /api/v1/user/pay-for-generation` (atomic decrement if balance ≥ amount).

Model credit costs are defined in `server/constants/models-db.ts` (`FAL_MODEL_COSTS`), including resolution multipliers and optional web-search add-ons.

### 6.2 Tiers (subscriptions)

Table `tier` holds plan metadata + Stripe IDs **and Polar IDs** (Polar columns added in `0004_polar_billing`, Stripe columns retained):

- `stripe_price_id`, `stripe_product_id`
- `polar_product_id` (monthly), `polar_yearly_product_id` (yearly), `polar_price_id`
- `avatar_slots`
- `features` JSON (`maxCredits`, localized feature lists, feature flags like `INPAINTING`, `CHARACTERS`, …)

Seed SQL: `server/database/tier-seed.sql`. Polar product IDs are not seeded until Polar catalog is created in the dashboard.

Checkout (new purchases):

1. UI → `POST /api/v1/polar/checkout-session` with `tierId` / `interval`
2. Polar Checkout (`polar.checkouts.create`)
3. Redirect success → `/settings/plans/success`
4. Webhook `order.paid` (`billing_reason=subscription_create`) grants `credit += maxCredits` and `avatar_credit += 1`

Renewal: Polar `order.paid` with `billing_reason=subscription_cycle` sets `credit = maxCredits` and does **not** add avatar credits.

One-time KiThumbs Avatar: `POST /api/v1/polar/product-checkout-session`. Entitlement is `product.metadata.avatarCredits` mapped by **Polar product ID**, not product name.

Stripe Checkout routes and Stripe webhooks remain in place for existing Stripe subscribers:

| Route | Role |
|-------|------|
| `/api/webhook/polar` | Polar `order.paid`, subscription status, cancel/revoke, past_due |
| `/api/webhook/stripe/checkout-session-completed` | Legacy Stripe activate / grant |
| `/api/webhook/stripe/subscription-billing-cycle` | Legacy Stripe renew |
| `/api/webhook/stripe/subsciption-payment-failed` | Legacy Stripe payment failure |
| `/api/webhook/stripe/cancel-subscription` | Legacy Stripe cancelled subscription |

Cancel: `POST /api/v1/billing/unsubscribe` (Polar revoke or Stripe cancel by stored IDs). Invoices: `GET /api/v1/billing/invoices` (Polar orders + Stripe invoices).

A subscription is Polar if `subscription.polar_subscription_id` is set; Stripe if `subscription.stripe_subscription_id` is set.

---

## 7. Generation architecture

### 7.1 Request flow (typical)

```text
Vue page / composable
  → POST /api/v1/generation/<tool>
    → auth check (event.context.user)
    → validate body
    → (optional) optimize prompt via OpenRouter/LLM helpers
    → call FAL / OpenAI / OpenRouter image service
    → download/upload result bytes to S3
    → persist image/asset rows in Postgres
    → save activity
    → return URLs / ids to client
```

Endpoints live under `server/api/v1/generation/`:

| Endpoint | Purpose |
|----------|---------|
| `quick-generation.post` | Main multi-model T2I / I2I |
| `quick-thumb.post` | Thumbnail flow (OpenAI service) |
| `sketch.post` | Sketch generation (OpenRouter `openai/gpt-image-2`) |
| `photoshoot.post` | Photoshoot modes |
| `image-to-image.post` | I2I |
| `inpainting.post` / `outpainting.post` | Mask / expand edits |
| `fine-edit.post` | Fine edit / Kontext-style |
| `face-swap.post` / `change-face.post` | Face operations |
| `pipeline.post` | Execute a saved pipeline |

Business logic for providers is under:

- `server/services/fal/*`
- `server/services/openai/*`
- `server/services/prompt/*`
- thin clients in `server/inference/{fal,openai,openrouter}.ts`

### 7.2 Storage

`server/storage/index.ts` wraps AWS SDK S3:

- `put` / `get` / `delete` / presigned URLs
- Key helpers in `server/storage/keys.ts` (images, assets, avatars, weights)

Generated media is **not** kept only in provider URLs long-term; the app persists to S3 and serves via app routes (`/api/v1/image/.../view`, asset blob routes, etc.).

### 7.3 Avatars (LoRA)

1. Client requests presigned upload URLs → `POST /api/v1/avatar/train/presigned-urls`
2. Uploads training images to S3
3. Starts training → `POST /api/v1/avatar/train/lora-avatar` (FAL)
4. FAL calls back → `POST /api/webhook/fal/avatar-training-finish`
5. App stores weights, updates avatar row, emails user, adjusts avatar credits

### 7.4 Pipelines & graph

- CRUD under `/api/v1/pipeline`
- UI pages: `/pipeline`, `/pipeline/create`, `/pipeline/:id/edit`
- `/graph` visualizes generation lineage / network graph (higher rate-limit allowance in `nuxt.config`)

---

## 8. UI map (pages)

| Route group | Paths | Notes |
|-------------|-------|-------|
| Auth | `/login`, `/signup`, `/reset-password`, `/validate-email` | Public |
| Home | `/` | Dashboard / entry |
| Gallery | `/images`, `/images/:imageId`, `/thumbnails` | Generated media |
| Tools | `/quick-generation`, `/quick-thumb`, `/sketch`, `/photoshoot`, `/image-to-image`, `/chat`, `/pipeline/*` | Generation tools |
| Library | `/archive`, `/assets`, `/avatars` | User library |
| Settings | `/settings`, `/settings/activity`, `/settings/plans/*`, `/settings/products/*` | Account + Stripe |
| Misc | `/changelog`, `/graph` | Product notes / lineage |
| Admin | obfuscated UUID under `(admin)/` | ADMIN role |

i18n: `strategy: 'no_prefix'`, cookie `kithumbs-locale`.

---

## 9. API surface (versioned)

Public product APIs are under **`/api/v1/...`**.

Major domains:

- `auth`, `user`, `tier`, `product`, `payment`, `stripe`
- `generation`, `image`, `asset`, `avatar`, `style`, `pipeline`
- `activity`, `admin`

Unversioned / webhooks:

- `GET /api/health`
- `POST /api/webhook/stripe/*`
- `POST /api/webhook/fal/avatar-training-finish`

Convention in this revision: handlers often contain orchestration directly (services exist for FAL/OpenAI/email/storage). Prefer keeping new logic in `server/services/` when extending.

---

## 10. Data model (Drizzle)

Schemas: `frontend/server/database/schemas/*.schema.ts`  
Migrations: `frontend/server/database/migrations/`  
Current tracked migration tip (see `MIGRATIONS.md`): **`0003_narrow_polaris`**.

Core tables:

| Table | Role |
|-------|------|
| `user` | Identity, credits, Stripe customer, role, locale |
| `session` | Auth sessions |
| `reset_token` | Password reset |
| `tier` / `subscription` / `payment` / `product` | Billing |
| `image` / `project` / `canvas` / `branch` | Generations & editing state |
| `asset` / favourites | Reusable media |
| `avatar` | LoRA characters |
| `style` | Style presets |
| `pipeline` / `task` | Multi-step flows |
| `activity` | User activity feed |
| `tool` / `usage` | Supporting enums / usage (schema files present) |

Generate migrations from `frontend/`:

```bash
bunx drizzle-kit generate
# apply with your preferred migrate path / drizzle-kit migrate
```

---

## 11. Environment variables

See **`frontend/.env.example`** for the full annotated list.

**Required at boot** (`server/utils/env-validation.ts`):

- `NUXT_DATABASE_CONNECTION_STRING`
- `NUXT_GOOGLE_CLIENT_ID`, `NUXT_GOOGLE_SECRET_ID`
- All Stripe publishable/secret + **four** webhook secrets
- All `NUXT_S3_*` (R2: access key, secret, `auto` region, `kithumbs` bucket, `NUXT_S3_ENDPOINT`)
- `NUXT_RESEND_API_KEY`

**Needed for features but not in the hard required list:**

- `NUXT_FAL_API_KEY`, `NUXT_OPENAI_API_KEY` (quick-thumb), `NUXT_OPEN_ROUTER_API_KEY` (LLM helpers + Sketch)
- Public PostHog keys, `NUXT_PUBLIC_APP_URL`, `NUXT_PUBLIC_ENABLE_SIGN_IN`

---

## 12. Local development

Prerequisites: **Docker** (Postgres), **Bun**, Stripe test keys, S3 bucket (or compatible), Google OAuth client, Resend, FAL/OpenAI keys.

```bash
# 1) Infra
mkdir -p config
cp config/db.env.example config/db.env
docker compose up -d db

# 2) App env
cd frontend
cp .env.example .env.dev
# edit .env.dev — set DATABASE_URL-style connection string + secrets

# 3) Install & DB
bun install
# apply migrations / seed tiers & products as needed
#   bunx drizzle-kit migrate   # if configured
#   psql $NUXT_DATABASE_CONNECTION_STRING -f server/database/tier-seed.sql
#   psql ... -f server/database/product-seed.sql
#   psql ... -f server/database/style-seed.sql

# 4) Run
bun run dev   # nuxt dev --dotenv .env.dev → http://localhost:3000
```

Tests: `bun run test` (Vitest under `frontend/tests`).

---

## 13. Observability & security notes

- Structured logging via `server/utils/logger.ts` (`LOG_LEVEL`)
- PostHog client gated by `NUXT_AUTHORIZE_POSTHOG`
- Rate limiting via `nuxt-security` (global + `/graph` override)
- Never log raw passwords, Stripe secrets, or full PII; prefer user ids
- Webhooks must verify Stripe / FAL signatures before mutating state

---

## 14. What this revision deliberately does **not** include

After the YouTube sync rollback, the app does **not** contain:

- YouTube channel connection / OAuth for Data API sync
- Channel / video metrics tables or dashboard
- Creem billing
- Better Auth
- Shared `packages/db` workspace package
- A runnable `worker/` process or Redis/BullMQ queues

Those belong to later history and must not be assumed when operating this tree.

---

## 15. Related docs

- [WORKER.md](./WORKER.md) — worker placeholder status
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker / Dokploy / env wiring
- [`frontend/.env.example`](../frontend/.env.example)
- [`MIGRATIONS.md`](../MIGRATIONS.md)
