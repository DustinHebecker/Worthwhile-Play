#!/usr/bin/env bash
# Orchestrator tool: full gate on a pull request head, in a throwaway worktree, WITH coverage
# (CI runs `pnpm coverage`, which is 1.3-2x slower than `pnpm test`; timeouts show up only there).
#
# Usage: scripts/orchestrator/gate-pr.sh <pr-number>
# Env: SCRATCH (default /tmp/wp-orch), E2E_PORT (default 4795).
set -uo pipefail
PR=$1
REPO=$(git rev-parse --show-toplevel)
SCRATCH=${SCRATCH:-/tmp/wp-orch}
W=$SCRATCH/gate-pr$PR
mkdir -p "$SCRATCH"
git -C "$REPO" fetch -q origin "pull/$PR/head:pr$PR" -f
H=$(git -C "$REPO" rev-parse "pr$PR"); echo "PR #$PR head $H"
rm -rf "$W"; git -C "$REPO" worktree prune
git -C "$REPO" worktree add -q --detach "$W" "$H"
cd "$W"
git diff --stat origin/main...HEAD | tail -2
FAIL=0
pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 && echo "install ok" || { echo "install FAILED"; FAIL=1; }
pnpm check:licenses | tail -1; [ "${PIPESTATUS[0]}" -eq 0 ] || FAIL=1
pnpm lint >/dev/null && echo "lint ok" || { echo "lint FAILED"; FAIL=1; }
pnpm typecheck >/dev/null && echo "types ok" || { echo "types FAILED"; FAIL=1; }
# Same split as CI (ADR 0021 amendment): coverage without the slow and long suites, then those suites
# on their own without coverage instrumentation (which made their timing-sensitive tests time out).
pnpm coverage --exclude '**/*.long.test.ts' --exclude '**/*.slow.test.ts' > "$SCRATCH/pr$PR-test.log" 2>&1 || FAIL=1
grep -E "Tests |FAIL|Test timed out" "$SCRATCH/pr$PR-test.log" | head
pnpm vitest run $(git ls-files '*.long.test.ts' '*.slow.test.ts') > "$SCRATCH/pr$PR-slow.log" 2>&1 || FAIL=1
grep -E "Tests |FAIL|Test timed out" "$SCRATCH/pr$PR-slow.log" | sed 's/^/slow: /' | head
pnpm build > "$SCRATCH/pr$PR-build.log" 2>&1 || { echo "build FAILED"; FAIL=1; }
grep -E "error|precache" "$SCRATCH/pr$PR-build.log" | head -3
E2E_PORT=${E2E_PORT:-4795} pnpm exec playwright test --reporter=line > "$SCRATCH/pr$PR-e2e.log" 2>&1 || FAIL=1
sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$SCRATCH/pr$PR-e2e.log" | grep -E "^\s+[0-9]+\) \[|Error:|passed|failed|flaky" | head -12
cd /tmp && git -C "$REPO" worktree remove --force "$W"
[ "$FAIL" -eq 0 ] && echo "GATE GREEN" || echo "GATE RED"
exit "$FAIL"
