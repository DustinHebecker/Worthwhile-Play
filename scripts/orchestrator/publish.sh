#!/usr/bin/env bash
# Orchestrator tool: publish the current working-branch HEAD to main after the full gate.
#
# Usage: scripts/orchestrator/publish.sh "<commit message>" [exclude-game-id ...]
#   - builds a clean worktree from HEAD (minus the listed unfinished games' src/test/e2e),
#   - runs the full gate (licenses, lint, typecheck, all tests, build, all e2e),
#   - commits that tree on top of origin/main, pushes main (= deploy), merges main back into the
#     working branch and waits for the CI/deploy run of exactly that commit.
# Never commit on the working branch while it runs (the merge-back would conflict).
# Env: SCRATCH (default /tmp/wp-orch) for the worktree and logs; E2E_PORT (default 4793).
set -euo pipefail
MSG="$1"; shift
REPO=$(git rev-parse --show-toplevel)
SCRATCH=${SCRATCH:-/tmp/wp-orch}
W=$SCRATCH/publish-wt
mkdir -p "$SCRATCH"
cd "$REPO"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git fetch -q origin main
rm -rf "$W"; git worktree prune
git worktree add -q --detach "$W" HEAD
cd "$W"
if git grep -l "@ts-nocheck" -- . ":!node_modules" >/dev/null; then echo "ABORT: committed files contain @ts-nocheck (in-place Stryker leftovers)"; exit 1; fi
for g in "$@"; do
  find "packages/games/$g" -mindepth 1 -maxdepth 1 ! -name package.json -exec rm -rf {} +; rm -f "e2e/games/$g.spec.ts"
  git checkout -q origin/main -- "packages/games/$g" 2>/dev/null || true
  git checkout -q origin/main -- "e2e/games/$g.spec.ts" 2>/dev/null || true
done
pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1
pnpm check:licenses | tail -1
pnpm lint >/dev/null && echo "lint ok"
pnpm typecheck >/dev/null && echo "types ok"
pnpm test > "$SCRATCH/last-test.log" 2>&1 || true
grep -E 'Tests ' "$SCRATCH/last-test.log" | tee /dev/stderr | grep -qv failed || { grep -E 'FAIL|AssertionError|Error:' "$SCRATCH/last-test.log" | head -20; exit 1; }
pnpm build >/dev/null 2>&1 && echo "build ok"
E2E_PORT=${E2E_PORT:-4793} pnpm exec playwright test --reporter=line > "$SCRATCH/last-e2e.log" 2>&1 || true
sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$SCRATCH/last-e2e.log" | grep -E '^\s+[0-9]+\) \[|Error:|passed|failed|flaky' | head -12 | tee /dev/stderr | grep -q ' failed' && exit 1 || true
git add -A
tree=$(git write-tree)
c=$(git commit-tree "$tree" -p origin/main -m "$MSG")
echo "--- diff vs main:"; git diff --stat origin/main "$c" | tail -30
git push -q origin "$c:main"
cd "$REPO"; git worktree remove --force "$W"
git fetch -q origin main
git merge -q --no-edit origin/main -m "Merge main into $BRANCH after publishing"
git push -q origin "$BRANCH"
set +o pipefail
# Wait for the CI run of exactly this commit.
id=""
for _ in $(seq 1 30); do
  id=$(gh run list --repo DustinHebecker/Worthwhile-Play --commit "$c" --workflow CI --json databaseId -q '.[0].databaseId' 2>/dev/null || true)
  [ -n "$id" ] && break
  sleep 10
done
if [ -z "$id" ]; then echo "NO CI RUN for $c after 5 min"; exit 2; fi
until [ "$(gh run view "$id" --repo DustinHebecker/Worthwhile-Play --json status -q .status)" = completed ]; do sleep 20; done
echo "CI/deploy (run $id): $(gh run view "$id" --repo DustinHebecker/Worthwhile-Play --json conclusion -q .conclusion)"
