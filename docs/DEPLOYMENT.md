# KiThumbs deployment manual

This guide covers deploying the **current** KiThumbs revision: a single Nuxt/Bun application plus PostgreSQL and external SaaS (Stripe, S3, FAL, Resend, Google OAuth).

There is **no worker service** and **no Redis** requirement at this revision. See [WORKER.md](./WORKER.md).

---

## 1. Architecture to deploy

```text
                    ┌─────────────────────┐
   Browser ────────►│  Nuxt app (Bun)     │
                    │  :3000              │
                    │  SPA + /api/v1/*    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        PostgreSQL          S3/R2         Stripe / FAL /
        (Compose or         (images,      OpenAI / Resend /
         managed)            assets,       Google / PostHog
                             LoRA)
```

Inbound webhooks that must reach the public app URL:

| Source | Path |
|--------|------|
| Stripe | `/api/webhook/stripe/checkout-session-completed` |
| Stripe | `/api/webhook/stripe/subscription-billing-cycle` |
| Stripe | `/api/webhook/stripe/subsciption-payment-failed` |
| Stripe | `/api/webhook/stripe/cancel-subscription` |
| Polar | `/api/webhook/polar` |
| FAL | `/api/webhook/fal/avatar-training-finish` |

Health probe: `GET /api/health` (checks DB).

---

## 2. Artifacts

### 2.1 Application image

Dockerfile: **`frontend/Dockerfile`**

Multi-stage:

1. `oven/bun:1` build — `bun install --frozen-lockfile --ignore-scripts` → `bun --bun run build`
2. Production stage copies **only** `.output` and runs:

```text
bun --bun run /app/server/index.mjs
```

Exposes **3000**.

**Build context must be the `frontend/` directory** (not the monorepo root) for this revision — the Dockerfile copies `package.json` + `bun.lock` from the build context root.

```bash
# from repository root
docker build -f frontend/Dockerfile -t kithumbs-frontend ./frontend
```

### 2.2 Database

Local / compose: `docker-compose.yml` service `db` (`postgres:16.3-alpine3.20`).

Production: managed Postgres (RDS, Neon, Dokploy Postgres, etc.) reachable from the app container.

Schema is owned by Drizzle migrations under:

`frontend/server/database/migrations/`

Track env status in `MIGRATIONS.md` (currently documents tag `0003_narrow_polaris`).

### 2.3 Object storage

Cloudflare R2 via the AWS SDK (`NUXT_S3_*` plus `NUXT_S3_ENDPOINT`). Object keys stored in Postgres are unchanged; the client reads/writes the same keys on the R2 `kithumbs` bucket. No MinIO service is defined in Compose at this revision.

---

## 3. Environment configuration

### 3.1 Files

| File | Use |
|------|-----|
| `frontend/.env.example` | Template for all Nuxt/runtime vars |
| `config/db.env.example` | Local Compose Postgres credentials |
| `worker/.env.example` | Placeholder only — **do not deploy a worker** |

For Dokploy / containers, inject the same keys as environment variables (no need to bake `.env` into the image).

### 3.2 Minimum production set

Copy from `frontend/.env.example` and fill:

1. `NODE_ENV=production`
2. `NUXT_PUBLIC_APP_URL=https://app.kithumbs.com` (no trailing slash; must match the public HTTPS origin)
3. `NUXT_DATABASE_CONNECTION_STRING`
4. Google OAuth client id/secret
5. Stripe keys + **four** webhook secrets (keep until Stripe cutover)
5b. Polar `NUXT_POLAR_ACCESS_TOKEN`, `NUXT_POLAR_WEBHOOK_SECRET`, `NUXT_POLAR_SERVER`
6. R2 access key / secret / `auto` region / `kithumbs` bucket / `NUXT_S3_ENDPOINT`
7. Resend API key
8. FAL / OpenAI / OpenRouter keys (generation will fail without them)
9. Optional PostHog public key/host
10. `NUXT_PUBLIC_ENABLE_SIGN_IN=true|false`

### 3.3 Stripe webhooks (production)

In Stripe Dashboard, create **four** endpoints against the public origin, each with the matching event set used by the handlers, and store each signing secret in the corresponding `NUXT_STRIPE_WEBHOOK_SECRET_*` variable.

Local tip: use Stripe CLI to forward to localhost during development.

Keep these enabled until existing Stripe subscribers are fully cut over.

### 3.3b Polar webhooks (new checkouts)

Create one Polar webhook endpoint at `{NUXT_PUBLIC_APP_URL}/api/webhook/polar` for:

- `order.paid`
- `subscription.created`
- `subscription.active`
- `subscription.updated`
- `subscription.cycled`
- `subscription.past_due`
- `subscription.canceled`
- `subscription.revoked`
- `subscription.uncanceled`

Store the signing secret in `NUXT_POLAR_WEBHOOK_SECRET`. Map Polar product IDs onto `tier.polar_product_id` / `tier.polar_yearly_product_id` and `product.polar_product_id` after creating the Polar catalog. Do not create Polar products from this repository.

### 3.4 Google OAuth

Authorized JavaScript origins / redirect URIs must include `NUXT_PUBLIC_APP_URL`.

### 3.5 FAL webhooks

Avatar training registers a callback derived from `NUXT_PUBLIC_APP_URL`. That URL must be publicly reachable from FAL’s servers (not `localhost` unless tunneled).

---

## 4. Database migration & seed procedure

Order of operations for a new environment:

```bash
# 1) Provision empty Postgres
# 2) Apply Drizzle SQL migrations in order from
#    frontend/server/database/migrations/
#    (0000 → 0001 → 0003_narrow_polaris → 0004_polar_billing; journal may skip 0002)

# 3) Seed reference data
psql "$NUXT_DATABASE_CONNECTION_STRING" -f frontend/server/database/tier-seed.sql
psql "$NUXT_DATABASE_CONNECTION_STRING" -f frontend/server/database/product-seed.sql
# use product-seed.prod.sql for production catalog if that is your process
psql "$NUXT_DATABASE_CONNECTION_STRING" -f frontend/server/database/style-seed.sql

# 4) Align Stripe Price/Product IDs in `tier` / `product` rows with the Stripe account
# 4b) After creating Polar products in the dashboard, set polar_product_id /
#     polar_yearly_product_id / polar_price_id on those same rows
```

Update `MIGRATIONS.md` when an environment’s applied migration or app version changes.

**Never** apply schema changes by hand in production without a committed Drizzle migration.

---

## 5. Local stack (developer machine)

```bash
# Postgres
cp config/db.env.example config/db.env
docker compose up -d db

# App
cd frontend
cp .env.example .env.dev
# edit secrets — point NUXT_DATABASE_CONNECTION_STRING at localhost:5432
bun install
# migrate + seed (see §4)
bun run dev
```

Compose does **not** start the Nuxt app or Redis. Only Postgres.

Data directory: `./config/postgres-data` (under gitignored `config/`).

---

## 6. Docker run (single container)

```bash
docker build -f frontend/Dockerfile -t kithumbs-frontend ./frontend

docker run --rm -p 3000:3000 \
  --env-file frontend/.env.prod \
  kithumbs-frontend
```

Prefer passing env via the orchestrator (Dokploy) rather than committing env files.

Verify:

```bash
curl -sS https://your.domain/api/health
# {"status":"healthy","checks":{"database":true},...}
```

---

## 7. Dokploy deployment

Project convention: Docker-first, deploy via **Dokploy**.

### 7.1 Application service

| Setting | Value |
|---------|-------|
| Type | Application / Docker |
| Dockerfile path | `frontend/Dockerfile` |
| Build context | **`frontend/`** (this revision) |
| Port | `3000` |
| Health check | `GET /api/health` |

Set every required `NUXT_*` variable in the Dokploy environment UI (see §3).

### 7.2 Database service

- Deploy Postgres 16 as a Dokploy database/service, **or** point `NUXT_DATABASE_CONNECTION_STRING` at an external managed instance
- Restrict network so only the app service can connect
- Take backups before migrations

### 7.3 Domains & TLS

- Attach the production hostname to the app service
- Ensure `NUXT_PUBLIC_APP_URL` matches the public HTTPS origin exactly
- Configure Stripe + Google + FAL against that same origin

### 7.4 What not to deploy

- No worker container
- No Valkey/Redis service for this app revision
- No Creem / Better Auth / YouTube sync sidecars

---

## 8. Release checklist

1. [ ] Migrations applied; `MIGRATIONS.md` updated
2. [ ] Tier/product rows match Stripe catalog (test vs live keys)
3. [ ] All four Stripe webhooks verified (dashboard delivery logs)
4. [ ] S3 read/write smoke test (upload asset, view image)
5. [ ] Signup / Google login / email verification
6. [ ] One paid checkout in test mode (subscription + credit pack)
7. [ ] One generation path (e.g. quick-generation) succeeds end-to-end
8. [ ] Avatar training webhook completes on a staging URL
9. [ ] `/api/health` green from outside the cluster
10. [ ] `NUXT_PUBLIC_ENABLE_SIGN_IN` set intentionally for the environment

---

## 9. Operations

### 9.1 Logs

App logs go to container stdout (Pino). Set `LOG_LEVEL` if needed. Do not log secrets, raw emails in bulk, or provider payloads containing PII.

### 9.2 Scaling

- SPA + Nitro on Bun: horizontal scale behind a load balancer is possible if sessions stay DB-backed (they are) and sticky sessions are **not** required
- Postgres and S3 remain shared dependencies
- Rate limiter uses in-process LRU (`nuxt-security`) — per-instance, not global

### 9.3 Backups

- Postgres: automated snapshots / `pg_dump`
- S3: bucket versioning / lifecycle policies
- Stripe remains source of truth for payment objects; local `payment` / `subscription` tables must stay consistent via webhooks

### 9.4 Incident pointers

| Symptom | Check |
|---------|-------|
| 503 on `/api/health` | DB URL, network, Postgres up |
| Boot crash “Missing required environment variables” | Compare with `env-validation.ts` / `.env.example` |
| Checkout works but no credits | Stripe webhook secrets / endpoint URLs / signature failures |
| Generations fail | FAL/OpenAI keys, provider status, S3 credentials |
| Emails missing | Resend key/domain DNS |
| Google login fails | Client ID/secret + authorized origins |

---

## 10. Related docs

- [APP.md](./APP.md) — product & code architecture
- [WORKER.md](./WORKER.md) — why no worker is deployed
- [`frontend/.env.example`](../frontend/.env.example)
- [`frontend/Dockerfile`](../frontend/Dockerfile)
- [`docker-compose.yml`](../docker-compose.yml)
- [`MIGRATIONS.md`](../MIGRATIONS.md)
