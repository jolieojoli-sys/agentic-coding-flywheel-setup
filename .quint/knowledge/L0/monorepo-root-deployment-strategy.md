---
scope: Monorepo-wide Vercel deployment from root
kind: system
content_hash: 4ed105690313a10d3d034d8a2be7c3a8
---

# Hypothesis: Monorepo Root Deployment Strategy

Deploy from repository root instead of apps/web subdirectory. Modify vercel.json to be at root level with workspace configuration. This enables: (1) single Vercel project for entire monorepo, (2) shared environment variables, (3) potential future deployment of other apps (packages/manifest API, etc.).

## Rationale
{"anomaly": "Subdirectory deployment isolates the web app from potential future monorepo deployments", "approach": "Treat entire repo as one deployable unit with root-level vercel.json", "alternatives_rejected": ["Multiple Vercel projects (costs more, fragmented management)"]}