---
scope: Production CI/CD deployment with Git-Vercel integration
kind: system
content_hash: 762f853cac0ee23ee25083191736e271
---

# Hypothesis: GitHub-Vercel Automatic Integration

Connect the GitHub repository to Vercel for automatic deployments on push. Vercel will: (1) auto-detect apps/web as the Next.js app, (2) use the existing vercel.json config, (3) deploy on every push to main, (4) create preview URLs for PRs. Requires installing Vercel GitHub App and configuring the project.

## Rationale
{"anomaly": "Manual deployment is error-prone and doesn not scale with multiple contributors", "approach": "Git-push-to-deploy workflow with automatic preview environments", "alternatives_rejected": ["Manual CLI deployment each time (slow, forgettable, no history)"]}