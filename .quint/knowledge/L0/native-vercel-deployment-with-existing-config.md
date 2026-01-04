---
scope: Production Vercel deployment of ACFS wizard website
kind: system
content_hash: e2477199d2a2ed52a1a57f183dbc1478
---

# Hypothesis: Native Vercel Deployment with Existing Config

Use the existing vercel.json configuration in apps/web/. The project already has: (1) buildCommand: bun run build, (2) installCommand: bun install, (3) ignoreCommand for credit optimization. Simply connect the GitHub repo to Vercel via the dashboard, set the root directory to apps/web, and deploy.

## Rationale
{"anomaly": "User wants to deploy to Vercel but does not know existing config exists", "approach": "Leverage the battle-tested vercel.json that already specifies Bun runtime and build optimization", "alternatives_rejected": ["Rewriting deployment config (unnecessary - existing config is production-ready)"]}