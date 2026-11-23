#!/bin/sh
# Builds lambda.zip for deployment: compiled code, the spec, run.sh and production dependencies.
# Needs sh and zip (macOS, Linux, WSL, GitHub Actions runners).
set -eu
cd "$(dirname "$0")/.."

rm -rf .build lambda.zip
npm run build
mkdir .build
cp -R dist openapi.yaml run.sh package.json package-lock.json .build/
(
  cd .build
  npm ci --omit=dev --ignore-scripts --no-audit --no-fund
  chmod +x run.sh
  zip -qr ../lambda.zip .
)
rm -rf .build
echo "Built lambda.zip"
