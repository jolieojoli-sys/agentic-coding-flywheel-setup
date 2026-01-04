# Bounded Context

## Vocabulary

- **Manifest**: `acfs.manifest.yaml` - Single source of truth for all tools installed by ACFS
- **Module**: Individual tool definition in the manifest (e.g., `base.system`, `agents.claude`)
- **Category**: Grouping of modules (base, users, filesystem, shell, cli, lang, agents, db, cloud, stack, acfs)
- **Phase**: Installation order (1-10) for modules
- **Generator**: TypeScript code in `packages/manifest/src/generate.ts` that creates bash scripts from manifest
- **Bun**: JavaScript runtime used for all JS/TS tooling (never npm/yarn/pnpm)
- **ACFS**: Agentic Coding Flywheel Setup - the project name
- **Verified Installer**: Upstream installer script whose SHA256 checksum is verified in `checksums.yaml`
- **run_as**: Execution context for module install (root, target_user, current)
- **Dicklesworthstone Stack**: 8 coordination tools (ntm, mcp_agent_mail, ubs, bv, cass, cm, caam, slb)

## Invariants

1. **Single Source of Truth**: `acfs.manifest.yaml` is the only place tool definitions live. All installer behavior derives from this file.
2. **Generated Files**: Never edit `scripts/generated/*` manually - always regenerate from manifest using `bun run generate`
3. **Runtime**: Use bun only for JS/TS - never npm/yarn/pnpm
4. **Idempotency**: All install functions must be idempotent (check before install)
5. **Security**: Checksum verification required for all upstream installer scripts via `checksums.yaml`
6. **Target Platform**: Ubuntu 25.10 (installer auto-upgrades from 22.04+)
7. **Code Quality**: All bash scripts must pass shellcheck
8. **Output Location**: Generated scripts go to `scripts/generated/`
9. **State Tracking**: Installer progress tracked in `~/.acfs/state.json` on target VPS
10. **File Deletion**: No file deletion without explicit user permission
11. **Dependencies**: Modules declare dependencies as module IDs; generator topologically sorts
12. **Wizard State**: Website is serverless - state in URL params + localStorage only
