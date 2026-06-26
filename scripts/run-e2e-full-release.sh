#!/usr/bin/env bash
# L4 release harness — snapshot → unit → DB audit → Playwright full → restore
set -euo pipefail
cd "$(dirname "$0")/.."
LOG="output/playwright/e2e-full-release-$(date +%Y%m%d-%H%M%S).log"
mkdir -p output/playwright
RESTORE_DONE=0

restore_on_exit() {
  local code=$?
  if [[ "$RESTORE_DONE" -eq 0 ]]; then
    echo "--- [trap] Restore trip 52 + E2E marker cleanup (exit=$code) ---"
    node scripts/e2e-prod-snapshot-restore.mjs restore || true
    node scripts/reconcile-fixture-trip.mjs || true
  fi
  exit "$code"
}
trap restore_on_exit EXIT

exec > >(tee -a "$LOG") 2>&1

echo "=== E2E FULL RELEASE $(date -Iseconds) ==="
echo "Log: $LOG"
echo "Doc: .agents/5fedu/14-production-e2e-harness.md"

echo "--- [0/9] Coverage matrix (static debt register) ---"
node scripts/e2e-coverage-matrix.mjs

echo "--- [1/9] Reconcile fixture trip 52 totals ---"
node scripts/reconcile-fixture-trip.mjs

echo "--- [2/9] Snapshot trip 52 ---"
node scripts/e2e-prod-snapshot-restore.mjs snapshot

echo "--- [3/9] Unit sync + stats row tests ---"
npm test -- features/quan-ly-van-tai/shared/__tests__/trip-execution-sync.test.ts features/quan-ly-van-tai/shared/__tests__/trip-approval-sync.test.ts features/quan-ly-van-tai/shared/__tests__/transport-report-rows.test.ts

echo "--- [4/9] DB audit 10-gate ---"
node scripts/e2e-db-audit.mjs

echo "--- [5/9] Auth setup ---"
npx playwright test --project=auth-setup --reporter=line

echo "--- [6/9] Production smoke + deep E2E ---"
npx playwright test --project=production-smoke --project=production-e2e --reporter=line

echo "--- [7/9] Live permission propagation (reverts in-spec) ---"
npx playwright test --project=live-permission --reporter=line

echo "--- [8/9] Permissions unit (row lock bypass) ---"
npm test -- lib/__tests__/permissions.test.ts

echo "--- [9/9] Restore trip 52 + reconcile totals + E2E marker cleanup ---"
node scripts/e2e-prod-snapshot-restore.mjs restore
node scripts/reconcile-fixture-trip.mjs
RESTORE_DONE=1

echo "=== DONE $(date -Iseconds) ==="