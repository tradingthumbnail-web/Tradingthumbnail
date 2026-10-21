# KiThumbs

AI thumbnail / image generation SaaS. This repository revision is the **Nuxt 4 app + Postgres** stack (Stripe billing). There is no YouTube channel sync and no runnable worker.

Production security hardening completed.

## Docs

| Document | Contents |
|----------|----------|
| [docs/APP.md](docs/APP.md) | How the application works (auth, credits, generation, API, data model) |
| [docs/WORKER.md](docs/WORKER.md) | Worker status (placeholder at this revision) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, env, migrations, Dokploy |

## Env templates

| File | Purpose |
|------|---------|
| [frontend/.env.example](frontend/.env.example) | Nuxt / Nitro runtime variables |
| [config/db.env.example](config/db.env.example) | Local Compose Postgres |
| [worker/.env.example](worker/.env.example) | Placeholder only |

## Quick start

```bash
cp config/db.env.example config/db.env
docker compose up -d db

cd frontend
cp .env.example .env.dev
# fill secrets — see frontend/.env.example
bun install
bun run dev
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for migrations, seeds, and production.
