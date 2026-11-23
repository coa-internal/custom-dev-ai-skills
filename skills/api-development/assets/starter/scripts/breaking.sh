#!/bin/sh
# Fails if openapi.yaml has breaking changes compared with the base branch.
# Usage: npm run breaking            (compares with origin/main)
#        BASE_REF=origin/develop npm run breaking
# Needs oasdiff (https://github.com/oasdiff/oasdiff), e.g. `brew install oasdiff`. CI uses the
# oasdiff GitHub Action instead.
set -eu
cd "$(dirname "$0")/.."

BASE_REF="${BASE_REF:-origin/main}"
SPEC_PATH="$(git rev-parse --show-prefix)openapi.yaml"
BASE_SPEC="$(mktemp)"
trap 'rm -f "$BASE_SPEC"' EXIT

if ! git show "${BASE_REF}:${SPEC_PATH}" > "$BASE_SPEC" 2>/dev/null; then
  echo "No openapi.yaml on ${BASE_REF}; nothing to compare (new API)."
  exit 0
fi
oasdiff breaking "$BASE_SPEC" openapi.yaml --fail-on ERR
