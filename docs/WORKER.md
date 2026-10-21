# KiThumbs worker manual

## Status at this revision (important)

After the repository rollback to the last commit **without YouTube channel sync**, the worker is **not an application**.

Tracked contents of `worker/`:

| Path | Purpose |
|------|---------|
| `worker/.gitignore` | Ignore `node_modules` and local `.env*` |
| `worker/.env.example` | Documented placeholder for a future worker |

There is **no**:

- `package.json` / Bun entrypoint
- HTTP server (Hono or otherwise)
- BullMQ / Redis consumers
- Cron schedulers
- Dockerfile
- Calls from the Nuxt app (`NUXT_WORKER_URL` is unused in this revision)

Therefore: **there is nothing to run, deploy, or monitor as a worker today.**

If you find local leftover files under `worker/` (old `.env.*`, empty `src/` dirs), treat them as stale untracked debris from later history. They are not part of `main` and must not be used as documentation of current behaviour.

---

## Why the folder still exists

The directory is kept so:

1. Historical layout / future reintroduction of async jobs has a clear home
2. `.env.example` and this manual set expectations
3. Deploy tooling does not accidentally assume a second service exists

---

## Historical context (not present in code)

In later (rolled-back) history, a Bun + Hono worker existed to:

- Sync YouTube channel / video metrics on a schedule (BullMQ + Redis/Valkey)
- Refresh OAuth tokens
- Call back into Nuxt internal APIs with a shared token
- Optionally publish scheduled YouTube videos

That design is **out of scope** for the current tree. Do not configure Redis, YouTube OAuth, or `WORKER_SHARED_TOKEN` for this revision — the frontend will not use them.

---

## If / when a worker is reintroduced

Recommended contract (aligned with project conventions, not implemented here):

```text
worker/
  package.json          # bun scripts: dev, start
  src/
    index.ts            # HTTP health + admin triggers
    jobs/               # queue processors
    cron.ts             # schedulers
  Dockerfile
  .env.example
```

Typical future env surface (placeholder only — see `worker/.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Shared Postgres with the app |
| `REDIS_URL` | Queue backend |
| `FRONTEND_API_URL` | Base URL of Nuxt for internal callbacks |
| `WORKER_SHARED_TOKEN` | Shared secret header for app ↔ worker |

Rules that should apply again when code returns:

- App → worker and worker → app authenticate with a shared secret
- Job payloads carry **ids**, not secrets or raw PII
- All DB access scoped by `userId` (and workspace if multi-tenant)
- Docker-first: Compose service + production Dockerfile
- Never import worker/DB code from Vue client bundles

---

## Local / deploy checklist (current revision)

| Task | Required? |
|------|-----------|
| Install worker deps | No |
| Run worker process | No |
| Redis / Valkey | No |
| Worker env in Dokploy | No |
| Health checks for worker | No |

Operate **only** the Nuxt app + Postgres (+ S3, Stripe, AI providers). See [APP.md](./APP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Related docs

- [APP.md](./APP.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [`worker/.env.example`](../worker/.env.example)
