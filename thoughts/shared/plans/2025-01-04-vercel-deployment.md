# ACFS Vercel Deployment Plan

## Overview

Deploy the ACFS (Agentic Coding Flywheel Setup) web application to Vercel. This is a Next.js 16 application running in a Bun monorepo workspace.

**Deployment Context**:
- **Account**: New Vercel account (Hobby / Free tier)
- **Domain**: Default `.vercel.app` URL (no custom domain)
- **Analytics**: Deferred - GA4 credentials not yet available
- **Scope**: Get the site live and functional, add analytics later

**Current State**: The web app has Vercel configuration but may not be deployed yet.
**Desired End State**: Fully functional production deployment on Vercel with CI/CD. Analytics can be added later when credentials are available.

---

## Current State Analysis

### Existing Infrastructure
- **Framework**: Next.js 16.1.0 with React 19.2.3
- **Runtime**: Bun (not Node.js - this is critical for Vercel)
- **Package Manager**: Bun with workspaces
- **Build Tool**: Turbopack
- **Location**: `apps/web/` within monorepo root

### Existing Vercel Configuration (`apps/web/vercel.json`)
```json
{
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "ignoreCommand": "bash scripts/vercel-ignore-build.sh"
}
```

### Known Considerations
1. **Bun Runtime on Vercel**: Vercel's default Node.js runtime may not be compatible with all Bun-specific features
2. **Monorepo Structure**: The `next.config.ts` references `workspaceRoot` which must resolve correctly on Vercel
3. **No Analytics Yet**: GA4 credentials not available - analytics will be added in a follow-up
4. **Bun Lockfile**: `bun.lock` at root must be accessible during deployment
5. **Free Tier Limits**: Hobby plan has 100GB bandwidth/month, 6,000 minutes of execution time

---

## Desired End State

A production Vercel deployment that:

1. **Builds Successfully**: All dependencies install and Next.js builds without errors
2. **Serves Static Content**: All pages, assets, and API routes function correctly
3. **CI/CD Configured**: Git commits to `main` trigger automatic deployments
4. **Preview Deployments**: Pull requests generate preview URLs
5. **Default URL**: Site accessible at `https://<project-name>.vercel.app`
6. **Analytics Deferred**: Will add GA4 and other tracking when credentials are available

### Verification Commands
```bash
# Post-deployment verification
curl -I https://<your-deployment-url>.vercel.app
curl https://<your-deployment-url>.vercel.app/api/track
```

---

## What We're NOT Doing (Now)

- [ ] **Analytics Configuration**: GA4, GTM, Clarity - deferred until credentials available
- [ ] Custom Domain Setup: Using default `.vercel.app` URL
- [ ] Vercel Pro Features: Speed Insights, advanced logging (Pro plan only)
- [ ] Edge Functions: Not currently needed
- [ ] Vercel KV or other Vercel-specific services

---

## Implementation Approach

**Strategy**: Use Vercel's GitHub integration for automated deployments on a new free-tier account.

**Deployment Phases**:
1. Project setup via Vercel CLI
2. ~~Environment Variables~~ → **SKIPPED**: No GA4 credentials yet
3. Production deployment and verification
4. GitHub integration for CI/CD
5. ~~Analytics Verification~~ → **SKIPPED**: Deferred to follow-up
6. Post-deployment cleanup

**Key Considerations**:
- Vercel supports Bun as a build tool but runs on Node.js at runtime (Next.js handles this)
- The monorepo structure requires root directory configuration
- The `vercel-ignore-build.sh` script prevents unnecessary builds
- Analytics can be added later by setting `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `GA_API_SECRET`

---

## Phase 1: Initial Project Setup

### Overview
Connect the GitHub repository to Vercel and configure basic project settings.

### 1.1 Install Vercel CLI (if not installed)
```bash
bun install -g vercel
```

### 1.2 Login to Vercel
```bash
vercel login
```

### 1.3 Link Project to Vercel
From the project root:
```bash
cd "/Users/abdulaziz/Downloads/Projects/Agentic Coding Flywheel "
vercel link
```

**Interactive prompts will ask for**:
- Project name: `acfs-web` (or your preferred name)
- Link to existing project: No (create new)
- Directory: `apps/web` (critical - this is the Next.js app root)

**Expected outcome**: Creates `.vercel/` directory with project configuration.

### 1.4 Verify `vercel.json` Configuration

Ensure `apps/web/vercel.json` has correct settings. Current config is mostly correct, but verify:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "outputDirectory": ".next",
  "ignoreCommand": "bash scripts/vercel-ignore-build.sh",
  "devCommand": "bun run dev"
}
```

**Note**: The `installCommand` uses `bun install` which Vercel supports, but ensure the Bun version is compatible.

### 1.5 Check Next.js Config for Vercel Compatibility

The `next.config.ts` contains:
```typescript
turbopack: {
  root: workspaceRoot,
}
```

**Verification needed**: Ensure `workspaceRoot` resolves correctly in Vercel's build environment. The path resolution should work as Vercel installs from the monorepo root.

### Success Criteria

#### Automated Verification:
- [ ] `.vercel/project.json` exists and contains project ID
- [ ] `vercel ls --scope <your-team>` shows the new project
- [ ] `vercel env ls` shows empty or existing env vars

#### Manual Verification:
- [ ] Project appears in Vercel dashboard at https://vercel.com/dashboard
- [ ] GitHub repository is connected in project settings
- [ ] Project directory points to `apps/web`

---

## Phase 2: Environment Variables (DEFERRED)

### Overview
**SKIPPED - No GA4 credentials available yet.**

The app will work without analytics. The `/api/track` endpoint will return `{"configured":false}` but this is expected.

### When Analytics Are Available

Add these environment variables in Vercel dashboard (Settings > Environment Variables):

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | GA4 Measurement ID (e.g., `G-XXXXXXXXXX`) |
| `GA_API_SECRET` | Secret | GA4 Measurement Protocol secret |

### Adding Later via Dashboard

1. Go to Vercel project > Settings > Environment Variables
2. Click "Add New"
3. Add each variable with appropriate environments (Production, Preview, Development)
4. Redeploy to apply

### Success Criteria

#### When Adding Later:
- [ ] Variables added to all relevant environments
- [ ] Redeploy triggered via dashboard or new commit
- [ ] `/api/track` returns `{"configured":true}`

---

## Phase 3: Production Deployment

### Overview
Trigger and verify the first production deployment.

### 3.1 Deploy to Production

```bash
vercel --prod
```

This will:
1. Push code to Vercel
2. Trigger build with `bun install && bun run build`
3. Deploy the `.next` output to Vercel's Edge Network

### 3.2 Monitor Build Process

Watch the build output for:
- Dependency installation success
- Next.js build completion
- No TypeScript errors
- No ESLint failures (if configured to block)
- Asset optimization completion

### 3.3 Verify Deployment

After build completes:

```bash
# Get production URL
vercel ls

# Or check the output from deploy command
```

### 3.4 Test Core Functionality

```bash
# Test homepage
curl -I https://<your-deployment-url>.vercel.app

# Test API route health check
curl https://<your-deployment-url>.vercel.app/api/track

# Should return: {"configured":false,"measurementId":null}
# (This is expected since analytics not configured yet)
```

### Success Criteria

#### Automated Verification:
- [ ] Build completes with exit code 0
- [ ] `curl -I <deployment-url>.vercel.app` returns HTTP 200
- [ ] `curl <deployment-url>/api/track` returns JSON (configured:false is OK)
- [ ] No 404, 500, or 502 errors in initial crawl

#### Manual Verification:
- [ ] Homepage loads in browser with correct styling
- [ ] All navigation links work
- [ ] Wizard pages render correctly
- [ ] Images load (GitHub raw content)
- [ ] No console errors in browser DevTools
- [ ] App functions normally without analytics

---

## Phase 4: GitHub Integration Setup

### Overview
Configure automatic deployments on Git push.

### 4.1 Verify GitHub App Installation

1. Go to Vercel dashboard > Project > Settings > Git
2. Confirm GitHub repository is linked
3. Branch should be `main` (or your production branch)

### 4.2 Configure Deploy Hooks

Vercel automatically creates:
- **Production**: Push to `main` branch
- **Preview**: Pull requests to any branch
- **Development**: Push to non-main branches

### 4.3 Test Automatic Deployment

```bash
# Make a trivial change
echo "# Test deployment" >> "/Users/abdulaziz/Downloads/Projects/Agentic Coding Flywheel /README.md"

# Commit and push
git add README.md
git commit -m "test: verify automatic deployment"
git push origin main
```

Watch for deployment notification in Vercel dashboard.

### 4.4 Verify Build Ignore Script

The `vercel-ignore-build.sh` should skip builds when only non-web files change:

```bash
# Trigger a build that should be ignored
# (modify install.sh or other non-web files)
git add install.sh
git commit -m "chore: update installer"
git push
```

**Expected**: Vercel shows "Build canceled - no relevant changes"

### Success Criteria

#### Automated Verification:
- [ ] Push to `main` triggers deployment (visible in dashboard)
- [ ] Non-web changes skip build (check build logs)
- [ ] Preview deployments work for PRs

#### Manual Verification:
- [ ] New commits to main auto-deploy within ~2-3 minutes
- [ ] Preview URLs work for pull requests
- [ ] Build status checks appear in GitHub PRs

---

## Phase 5: Analytics Setup (DEFERRED)

### Overview
**SKIPPED - Analytics configuration deferred until GA4 credentials are available.**

### When Ready to Add Analytics

After obtaining GA4 credentials:
1. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `GA_API_SECRET` via Vercel dashboard
2. Redeploy (or push a new commit)
3. Verify `/api/track` returns `{"configured":true}`

### Quick Verification

```bash
# Check if analytics configured
curl https://<your-deployment-url>.vercel.app/api/track
```

Expected responses:
- `{"configured":false}` - Analytics not configured (current state)
- `{"configured":true,"measurementId":"G-..."}` - Analytics working

---

## Phase 6: Post-Deployment Configuration

### Overview
Optional enhancements for production readiness.

### 6.1 Add Analytics (When Available)

See Phase 5 for instructions when GA4 credentials are obtained.

### 6.2 Configure Custom Domain (Optional - Future)

1. Vercel dashboard > Settings > Domains
2. Add domain (e.g., `acfs.example.com`)
3. Configure DNS per Vercel's instructions
4. Wait for SSL certificate provisioning (automatic on free tier)

### Success Criteria

#### Manual Verification:
- [ ] Site loads correctly at default `.vercel.app` URL
- [ ] No console errors in browser DevTools
- [ ] All pages navigate properly

## Testing Strategy

### Pre-Deployment Checklist

```bash
# Run local checks first
cd "/Users/abdulaziz/Downloads/Projects/Agentic Coding Flywheel /apps/web"

# 1. Type check
bun run type-check

# 2. Lint
bun run lint

# 3. Build locally (catches errors before Vercel)
bun run build

# 4. Production build preview
bun run start
# Visit http://localhost:3000 to verify
```

### Deployment Testing

1. **Smoke Test**: After each deployment, visit:
   - Homepage (`/`)
   - Wizard step 1 (`/wizard`)
   - Learning hub (`/learn`)
   - Any page with dynamic content

2. **API Test**: Verify API routes:
   ```bash
   curl https://<deployment-url>/api/track
   ```

3. **Console Check**: Open browser DevTools and verify:
   - No console errors
   - All pages load without issues

### Monitoring

After production deployment, monitor via Vercel Dashboard:
- **Deployments tab**: Build logs, deployment status
- **Analytics tab** (basic): Page views, bandwidth usage
- **Logs**: Real-time log streaming (free tier has some limits)

---

## Troubleshooting

### Common Issues

#### Issue: Build fails with "Cannot find module"
**Cause**: Workspace dependency resolution issue
**Fix**: Ensure `bun.lock` is committed and `installCommand` is `bun install`

#### Issue: `workspaceRoot` resolution fails
**Cause**: Vercel's build context differs from local
**Fix**: The Next.js config should handle this, but if needed, add to `vercel.json`:
```json
{
  "installCommand": "cd ../.. && bun install && cd apps/web && bun run build"
}
```

#### Issue: Analytics not configured
**Expected**: This is normal for initial deployment without GA4 credentials
**Fix**: When ready, add `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `GA_API_SECRET` via Vercel dashboard
**Note**: App functions normally without analytics

#### Issue: Images not loading
**Cause**: GitHub raw content blocked by CSP
**Fix**: Verify `next.config.ts` `images.remotePatterns` includes GitHub hostname

#### Issue: Bun version mismatch
**Cause**: Vercel uses different Bun version
**Fix**: Add `package.json` `engines` field or specify in `vercel.json`:
```json
{
  "buildCommand": "bun --version && bun run build"
}
```

---

## Rollback Procedure

If deployment fails or introduces issues:

1. **Immediate Rollback**:
   ```bash
   vercel rollback <deployment-url>
   ```

2. **Or via Dashboard**:
   - Go to Deployments
   - Find last successful deployment
   - Click "Promote to Production"

3. **Rollback Git** (if needed):
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Security Checklist

### Initial Deployment
- [ ] API rate limiting is enabled (`/api/track` has 60 req/min limit)
- [ ] Input validation on all API endpoints
- [ ] CSP headers configured (Vercel applies default Next.js headers)
- [ ] No sensitive data in public environment variables

### When Adding Analytics (Later)
- [ ] `GA_API_SECRET` is server-side only (never in `NEXT_PUBLIC_*`)
- [ ] No other secrets exposed to client

---

## References

- Vercel Next.js Deployment Guide: https://vercel.com/docs/frameworks/nextjs
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
- Vercel CLI Commands: https://vercel.com/docs/cli
- GA4 Measurement Protocol: https://developers.google.com/analytics/devguides/collection/protocol/ga4
- Next.js Deployment: https://nextjs.org/docs/app/building-your-application/deploying

---

## File Reference Summary

| File | Purpose | Key Settings |
|------|---------|--------------|
| `apps/web/vercel.json` | Vercel configuration | buildCommand, installCommand |
| `apps/web/next.config.ts` | Next.js config | turbopack.root, images.remotePatterns |
| `apps/web/package.json` | Dependencies | build scripts, workspace config |
| `apps/web/scripts/vercel-ignore-build.sh` | Build optimization | skip non-web changes |
| `apps/web/lib/analytics.ts` | GA4 integration | GA_MEASUREMENT_ID |
| `apps/web/app/api/track/route.ts` | Server-side tracking | GA_API_SECRET |
