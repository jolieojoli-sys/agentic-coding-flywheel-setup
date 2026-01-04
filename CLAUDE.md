# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ACFS (Agentic Coding Flywheel Setup) is a complete bootstrapping system that transforms a fresh Ubuntu VPS into a professional AI-powered development environment. It consists of:

1. **One-liner installer** (`install.sh`) - Bash script that installs 30+ tools
2. **Wizard website** (`apps/web/`) - Next.js 16 step-by-step guide for beginners
3. **Manifest system** (`acfs.manifest.yaml`) - Single source of truth for all tools
4. **Code generator** (`packages/manifest/`) - TypeScript that generates installer scripts from the manifest

## Development Commands

### Website (apps/web)

```bash
bun run dev          # Dev server with turbopack
bun run build        # Production build
bun run lint         # ESLint
bun run type-check   # TypeScript check
bun run test         # Playwright E2E tests
bun run test:ui      # Playwright UI mode
```

### Manifest Generator (packages/manifest)

```bash
bun run generate        # Generate scripts from manifest (writes to scripts/generated/)
bun run generate:dry    # Preview without writing
bun run generate:validate  # Validate manifest only
bun run test            # Run unit tests
```

### Root Monorepo

```bash
bun install              # Install all workspace dependencies
bun run build            # Build everything
bun run lint             # Lint all packages
bun run type-check       # Type-check all packages
```

### Installer Testing

```bash
# Lint bash scripts
shellcheck install.sh scripts/lib/*.sh

# Full integration test (Docker, same as CI)
./tests/vm/test_install_ubuntu.sh

# Test acfs-update
./tests/vm/test_acfs_update.sh
```

## Architecture

### The Manifest-Driven Pipeline

The core architecture is a **single source of truth** pattern:

```
acfs.manifest.yaml (YAML)
    ↓
packages/manifest/src/generate.ts (TypeScript/Zod)
    ↓
scripts/generated/* (Bash scripts)
    ↓
install.sh sources generated scripts (feature-flagged)
```

**Key invariant:** `acfs.manifest.yaml` is the only place tool definitions live. All installer behavior derives from this file. When adding or modifying tools, edit the manifest first, then regenerate.

### Module Categories

Each module in the manifest has a `category` and `phase`:

- **base** (phase 1): System packages via apt
- **users** (phase 2): User normalization (ubuntu user, passwordless sudo)
- **filesystem** (phase 3): Workspace directories (`/data/projects`, `~/.acfs`)
- **shell** (phase 4): zsh, oh-my-zsh, powerlevel10k
- **cli** (phase 5): ripgrep, tmux, fzf, lazygit, etc.
- **lang** (phase 6): bun, uv, rust, go, nvm
- **agents** (phase 7): claude, codex, gemini
- **db/cloud** (phase 8): PostgreSQL, Vault, Wrangler, Supabase, Vercel
- **stack** (phase 9): ntm, mcp_agent_mail, ubs, bv, cass, cm, caam, slb
- **acfs** (phase 10): Workspace setup, onboard, doctor, update scripts

### Module Dependencies

Modules declare `dependencies` as a list of module IDs (e.g., `["base.system", "shell.zsh"]`). The generator topologically sorts modules before generating scripts. The `run_as` field specifies execution context:

- `root`: Run as root via sudo
- `target_user`: Run as ubuntu (or `$TARGET_USER`)
- `current`: Run as whoever invoked install.sh

### Security: Checksum Verification

`checksums.yaml` contains SHA256 hashes for all upstream installer scripts (bun.sh, rustup, etc.). The `scripts/lib/security.sh` library enforces:

1. HTTPS-only URLs
2. SHA256 verification before executing any downloaded script
3. Fails closed on mismatch

To update checksums after verifying a legitimate upstream change:

```bash
./scripts/lib/security.sh --update-checksums > checksums.yaml
git diff checksums.yaml  # Review changes
```

### Generated Files (Never Edit Manually)

Everything in `scripts/generated/` is auto-generated:

- `install_<category>.sh` - Category installer scripts (one per category)
- `doctor_checks.sh` - Verification commands from manifest `verify` fields
- `install_all.sh` - Master installer that sources category scripts

To modify behavior: edit `packages/manifest/src/generate.ts` or `acfs.manifest.yaml`, then run `bun run generate`.

### Installer Library Functions

`scripts/lib/*.sh` contains modular utilities:

- `logging.sh` - Colored console output (log_step, log_success, log_error, etc.)
- `security.sh` - HTTPS enforcement and checksum verification
- `os_detect.sh` - OS detection and validation
- `user.sh` - User account normalization
- `install_helpers.sh` - run_as_root_shell, run_as_target_user_shell wrappers
- `doctor.sh` - Health check implementation
- `update.sh` - acfs-update logic
- `state.sh` - Checkpoint state management (~/.acfs/state.json)
- `gum_ui.sh` - Enhanced terminal UI (falls back if gum not installed)

### Website State Management

The wizard is **serverless** - no backend required. State lives in:

1. URL query params (step, provider selections)
2. localStorage (`agent-flywheel-*` keys)

The website is deployed to Vercel with Cloudflare as CDN for cost optimization.

## Important Rules

1. **Bun only** - Use `bun` for all JS/TS tooling. Never npm/yarn/pnpm.
2. **Never edit generated files** - Edit the generator or manifest instead.
3. **Checksum verification** - Always update `checksums.yaml` after changing upstream URLs.
4. **Idempotent installs** - All install functions must check if already installed before proceeding.
5. **Test in Docker** - Use `./tests/vm/test_install_ubuntu.sh` before committing installer changes.
6. **Use `--yes --mode vibe`** - Standard one-liner flags for non-interactive testing.

## File Deletion Policy

**ABSOLUTE RULE:** You may NOT delete any file or directory unless explicitly given the exact command in the current session. This includes files you just created. Always ask before deleting.

## Issue Tracking

All TODO tracking uses **bd (beads)** via `.beads/` directory. The `.beads/` state must be committed with code changes. Never use markdown TODO lists.

## Agent Coordination

ACFS installs tools for multi-agent workflows:
- **ntm** - Named tmux manager for agent sessions
- **mcp_agent_mail** - Agent coordination via mail-like messaging
- **bv** - Task management TUI (use `--robot` flags only)
- **cass** - Unified agent session search
- **cm** - Procedural memory for agents

When working with these tools, use their `--robot` or `--json` flags, never interactive TUI mode.
