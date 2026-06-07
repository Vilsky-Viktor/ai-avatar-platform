#!/usr/bin/env bash
# Usage: ./scripts/reinstall-shared-py.sh <version>
# Example: ./scripts/reinstall-shared-py.sh 0.0.1
set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
    echo "Usage: $0 <version>  (e.g. $0 0.0.5)"
    exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Refreshing Google Artifact Registry credentials"
TOKEN="$(gcloud auth print-access-token)"
poetry config http-basic.loom24-pypi oauth2accesstoken "$TOKEN"

PYTHON_SERVICES=(
    cropper
    face-matcher
)

FAILED=()

for SERVICE in "${PYTHON_SERVICES[@]}"; do
    DIR="$REPO_ROOT/$SERVICE"
    echo "==> $SERVICE"
    if ! (cd "$DIR" && poetry add "loom24-shared==$VERSION" --source loom24-pypi); then
        echo "[ERROR] Failed to install in $SERVICE"
        FAILED+=("$SERVICE")
    fi
done

echo ""
if [[ ${#FAILED[@]} -gt 0 ]]; then
    echo "FAILED services: ${FAILED[*]}"
    exit 1
fi
echo "Done. loom24-shared==$VERSION installed in all Python services."
