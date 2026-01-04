---
scope: Production Vercel deployment with CLI-based workflow
kind: system
content_hash: a5653451c2ab9a5ddb235f089ee35255
---

# Hypothesis: Vercel CLI Deployment Workflow

Install Vercel CLI via bun (bun install -g vercel), authenticate (vercel login), then run from apps/web directory: vercel --prod. This provides local control over deployments, preview URLs for PRs, and environment variable management without touching the dashboard.

## Rationale
{"anomaly": "User may want programmatic/developer-focused deployment instead of dashboard clicking", "approach": "Use Vercel CLI for Git-ops style deployment with preview deployments per branch", "alternatives_rejected": ["Dashboard-only deployment (slower, no preview URLs per branch)"]}