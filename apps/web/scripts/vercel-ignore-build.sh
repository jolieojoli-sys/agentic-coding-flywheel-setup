#!/bin/bash
# Vercel Ignored Build Step
# https://vercel.com/docs/project-configuration/vercel-json#ignorecommand
#
# Exit 0 = SKIP build (no relevant changes)
# Exit 1 = PROCEED with build (relevant changes detected)
#
# This script reduces Vercel credit consumption by skipping builds
# when only non-web files change (e.g., installer scripts, bash libs).

set -e

echo "🔍 Checking if web app files changed..."

# Get the commit range (VERCEL_GIT_PREVIOUS_SHA may be empty on first deploy)
PREV_SHA="${VERCEL_GIT_PREVIOUS_SHA:-HEAD~1}"
CURR_SHA="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

echo "   Previous: $PREV_SHA"
echo "   Current:  $CURR_SHA"

# If we can't determine the git diff (shallow clones / missing SHAs), fail open
# and proceed with the build to avoid stale deployments.
CHANGED_FILES="$(git diff --name-only "$PREV_SHA" "$CURR_SHA" 2>/dev/null || true)"
if [[ -z "$CHANGED_FILES" ]]; then
  if ! git rev-parse --verify "$PREV_SHA^{commit}" >/dev/null 2>&1 || \
    ! git rev-parse --verify "$CURR_SHA^{commit}" >/dev/null 2>&1; then
    echo "⚠️  Unable to determine changes (missing commit range); proceeding with build"
    exit 1
  fi
fi

# Paths that should trigger a rebuild
# Note: paths are relative to repo root, not apps/web
TRIGGER_PATHS=(
    "apps/web/"
    "package.json"
    "bun.lock"
)

# Check if any trigger paths have changes
matched_trigger=""
if [[ -n "$CHANGED_FILES" ]]; then
  while IFS= read -r changed_file; do
    for trigger in "${TRIGGER_PATHS[@]}"; do
      if [[ "$changed_file" == "$trigger"* ]]; then
        matched_trigger="$trigger"
        break 2
      fi
    done
  done <<< "$CHANGED_FILES"
fi

if [[ -n "$matched_trigger" ]]; then
  echo "✅ Changes detected in: $matched_trigger"
  echo "   → Proceeding with build"
  exit 1  # Build
fi

# Also check if this is a production branch (always build production)
if [[ "$VERCEL_GIT_COMMIT_REF" == "main" || "$VERCEL_GIT_COMMIT_REF" == "production" ]]; then
    # For main/production, check if we should still skip
    # Only skip if truly no web changes
    if echo "$CHANGED_FILES" | grep -q "^apps/web/"; then
        echo "✅ Web app changes on $VERCEL_GIT_COMMIT_REF branch"
        exit 1  # Build
    fi
fi

echo "⏭️  No web app changes detected"
echo "   → Skipping build to save Vercel credits"
echo ""
echo "   Changed files:"
if [[ -n "$CHANGED_FILES" ]]; then
  echo "$CHANGED_FILES" | head -20
else
  echo "   (none)"
fi

exit 0  # Skip build
