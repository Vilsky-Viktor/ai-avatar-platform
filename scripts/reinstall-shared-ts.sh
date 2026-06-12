#!/usr/bin/env bash
# Usage: ./scripts/reinstall-shared-ts.sh <version>
# Example: ./scripts/reinstall-shared-ts.sh 0.0.1
set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
    echo "Usage: $0 <version>  (e.g. $0 0.0.9)"
    exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Refreshing Google Artifact Registry tokens"
find "$REPO_ROOT" -maxdepth 2 -name ".npmrc" -not -path "*/node_modules/*" | while read -r rc; do
    npx google-artifactregistry-auth --repo-config "$rc"
done

JS_SERVICES=(
    ai-model-gateway
    api-gateway
    avatar
    head-direction-checker
    job-manager
    ui-app
    user
    voice
    workflow-manager
    thumbnail-maker
    image-resizer
    prompt-gateway
    video-trimmer
)

FAILED=()

for SERVICE in "${JS_SERVICES[@]}"; do
    DIR="$REPO_ROOT/$SERVICE"
    echo "==> $SERVICE"
    if ! npm install "@loom24/shared@$VERSION" --prefix "$DIR"; then
        echo "[ERROR] Failed to install in $SERVICE"
        FAILED+=("$SERVICE")
    fi
done

echo ""
if [[ ${#FAILED[@]} -gt 0 ]]; then
    echo "FAILED services: ${FAILED[*]}"
    exit 1
fi
echo "Done. @loom24/shared@$VERSION installed in all JS services."
