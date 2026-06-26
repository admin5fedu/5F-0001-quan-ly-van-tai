#!/usr/bin/env bash
# Deploy demo mock lên Vercel: set VITE_DATA_SOURCE=mock và redeploy.
# Yêu cầu: npx vercel login && npx vercel link (một lần).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "Chưa đăng nhập Vercel. Chạy: npx vercel login"
  exit 1
fi

set_env() {
  local scope="$1"
  echo "Setting VITE_DATA_SOURCE=mock (${scope})..."
  npx vercel env rm VITE_DATA_SOURCE "$scope" --yes 2>/dev/null || true
  npx vercel env add VITE_DATA_SOURCE "$scope" --value mock --yes
}

for scope in production preview development; do
  set_env "$scope"
done

echo "Redeploying production..."
npx vercel --prod --yes

echo "Done. Mở trang login — form sẽ có sẵn admin / 5fedu.com."
