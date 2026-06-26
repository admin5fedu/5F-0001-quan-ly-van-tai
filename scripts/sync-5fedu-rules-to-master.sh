#!/usr/bin/env bash
# Sync living 5fedu rules (allowlist only) to agent-rules master skill.
# Does NOT sync: 10, 12, 06, questions, raw feedback logs.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_AGENTS="$REPO_ROOT/.agents/5fedu"
SRC_CODEX="$REPO_ROOT/.codex/5fedu"
SRC_SKILL="$REPO_ROOT/.agents/skills/5fedu-project/SKILL.md"

MASTER_ROOT="${AGENT_RULES_MASTER:-$HOME/.grok/skills/5fedu-project}"
DST_AGENTS="$MASTER_ROOT/assets/project-context/.agents/5fedu"
DST_CODEX="$MASTER_ROOT/assets/project-context/.codex/5fedu"
DST_SKILL="$MASTER_ROOT/SKILL.md"

ALLOWLIST=(
  00-index.md
  02-database-and-auth-rules.md
  03-ui-ux-and-delivery-standards.md
  13-trip-execution-vs-approval-spec.md
  14-production-e2e-harness.md
)

if [[ ! -d "$SRC_AGENTS" ]]; then
  echo "Missing $SRC_AGENTS" >&2
  exit 1
fi

mkdir -p "$DST_AGENTS" "$DST_CODEX"

for f in "${ALLOWLIST[@]}"; do
  cp -f "$SRC_AGENTS/$f" "$DST_AGENTS/$f"
  if [[ -f "$SRC_CODEX/$f" ]]; then
    cp -f "$SRC_CODEX/$f" "$DST_CODEX/$f"
  else
    cp -f "$SRC_AGENTS/$f" "$DST_CODEX/$f"
  fi
  echo "synced: $f"
done

if [[ -f "$SRC_SKILL" ]]; then
  cp -f "$SRC_SKILL" "$DST_SKILL"
  echo "synced: SKILL.md"
fi

# Keep master archive stubs minimal (not full raw dumps from projects)
for stub in 10-owner-feedback-lessons.md 12-owner-feedback-transport-ui.md; do
  if [[ -f "$SRC_AGENTS/$stub" ]]; then
    cp -f "$SRC_AGENTS/$stub" "$DST_AGENTS/$stub"
    cp -f "$SRC_AGENTS/$stub" "$DST_CODEX/$stub"
    echo "synced stub: $stub"
  fi
done

echo "Done → $MASTER_ROOT"