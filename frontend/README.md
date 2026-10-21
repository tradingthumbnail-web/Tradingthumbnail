# KiThumbs frontend

Nuxt 4 application (SPA + Nitro/Bun API). This directory **is** the product.

## Documentation

- [Application manual](../docs/APP.md)
- [Deployment manual](../docs/DEPLOYMENT.md)
- [Worker status](../docs/WORKER.md)
- [Environment template](./.env.example)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with `.env.dev` |
| `bun run build` | Production build (`.output`) |
| `bun run preview` | Preview production build |
| `bun run test` | Vitest |

## Docker

Build from this directory as context:

```bash
docker build -f Dockerfile -t kithumbs-frontend .
```
