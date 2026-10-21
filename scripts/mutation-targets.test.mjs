// node --test scripts/mutation-targets.test.mjs (run by the mutation workflow's plan job)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { coveredFiles, isCovered, lineTargets, mergeRanges, parseUnifiedDiff, roundRobin, sample } from './mutation-targets.mjs';

const script = fileURLToPath(new URL('./mutation-targets.mjs', import.meta.url));
const run = (args, input) => execFileSync(process.execPath, [script, ...args], { input, encoding: 'utf8' });

const diff = [
  'diff --git a/packages/games/chess/src/rules.ts b/packages/games/chess/src/rules.ts',
  'index 1111111..2222222 100644',
  '--- a/packages/games/chess/src/rules.ts',
  '+++ b/packages/games/chess/src/rules.ts',
  '@@ -10 +10 @@ export function a() {',
  '-  return 1;',
  '+  return 2;',
  '@@ -20,0 +21,2 @@ export function b() {',
  '+++ looks like a header but is content',
  '+@@ -1 +1 @@ also content',
  '@@ -40,3 +42,0 @@ export function c() {',
  '-  gone();',
  '-  gone();',
  '-  gone();',
  '@@ -60 +60 @@',
  '-  old',
  '+  new',
  '\\ No newline at end of file',
  'diff --git a/packages/games/chess/src/view.ts b/packages/games/chess/src/view.ts',
  '--- a/packages/games/chess/src/view.ts',
  '+++ b/packages/games/chess/src/view.ts',
  '@@ -1 +1 @@',
  '-a',
  '+b',
  'diff --git a/packages/game-core/src/new.ts b/packages/game-core/src/new.ts',
  'new file mode 100644',
  '--- /dev/null',
  '+++ b/packages/game-core/src/new.ts',
  '@@ -0,0 +1,3 @@',
  '+x',
  '+y',
  '+z',
  'diff --git a/packages/game-core/src/old.ts b/packages/game-core/src/old.ts',
  'deleted file mode 100644',
  '--- a/packages/game-core/src/old.ts',
  '+++ /dev/null',
  '@@ -1,2 +0,0 @@',
  '-x',
  '-y',
  ''
].join('\n');

test('covered files follow stryker.config.json', () => {
  assert.equal(isCovered('packages/games/chess/src/rules.ts'), true);
  assert.equal(isCovered('packages/games/chess/src/view.ts'), false);
  assert.equal(isCovered('packages/strategy-engine/src/types.ts'), false);
  assert.deepEqual(coveredFiles(['b/x.ts', ' packages/game-core/src/rng.ts ', 'packages/game-core/src/rng.ts']), ['packages/game-core/src/rng.ts']);
});

test('parses added and changed lines, skipping pure deletions and deleted files', () => {
  const ranges = parseUnifiedDiff(diff);
  assert.deepEqual([...ranges.keys()], ['packages/games/chess/src/rules.ts', 'packages/games/chess/src/view.ts', 'packages/game-core/src/new.ts']);
  assert.deepEqual(ranges.get('packages/games/chess/src/rules.ts'), [[10, 10], [21, 22], [60, 60]]);
  assert.deepEqual(ranges.get('packages/game-core/src/new.ts'), [[1, 3]]);
});

test('merges nearby ranges and widens them by the context, clamped to the file', () => {
  assert.deepEqual(mergeRanges([[30, 31], [10, 12], [18, 20]], { gap: 5, context: 2 }), [[8, 22], [28, 33]]);
  assert.deepEqual(mergeRanges([[1, 1], [7, 7]], { gap: 5, context: 2, lineCount: 8 }), [[1, 8]]);
  assert.deepEqual(mergeRanges([[1, 1], [8, 8]], { gap: 5, context: 2, lineCount: 9 }), [[1, 3], [6, 9]]);
  assert.deepEqual(mergeRanges([]), []);
});

test('one Stryker mutate entry per covered file', () => {
  assert.deepEqual(lineTargets(diff, { lineCount: () => 61 }), [
    'packages/game-core/src/new.ts:1-5',
    'packages/games/chess/src/rules.ts:8-12,packages/games/chess/src/rules.ts:19-24,packages/games/chess/src/rules.ts:58-61'
  ]);
});

test('rotating sample covers every file exactly once per cycle', () => {
  const files = Array.from({ length: 19 }, (_, i) => `f${String(i).padStart(2, '0')}`);
  const seen = Array.from({ length: 8 }, (_, w) => sample(files, w + 40, 8)).flat();
  assert.deepEqual([...seen].sort(), files);
  assert.deepEqual(sample(files, 9, 8), ['f01', 'f09', 'f17']);
});

test('round-robin groups', () => {
  assert.deepEqual(roundRobin(['a', 'b', 'c', 'd', 'e'], 3), ['a,d', 'b,e', 'c']);
  assert.deepEqual(roundRobin(['a'], 3), ['a']);
});

test('command line', () => {
  assert.equal(run(['packages/game-core/src/rng.ts', 'README.md']), 'packages/game-core/src/rng.ts');
  assert.deepEqual(JSON.parse(run(['--json', '--groups', '2'], 'packages/game-core/src/a.ts\npackages/game-core/src/b.ts\npackages/game-core/src/c.ts\n')), [
    'packages/game-core/src/a.ts,packages/game-core/src/c.ts',
    'packages/game-core/src/b.ts'
  ]);
  assert.deepEqual(JSON.parse(run(['--json', '--sample', '1', '--every', '2'], 'packages/game-core/src/a.ts\npackages/game-core/src/b.ts\npackages/game-core/src/c.ts\n')), ['packages/game-core/src/b.ts']);
  const lines = JSON.parse(run(['--lines', '--json'], diff));
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^packages\/games\/chess\/src\/rules\.ts:8-12,packages\/games\/chess\/src\/rules\.ts:19-24,packages\/games\/chess\/src\/rules\.ts:58-62$/);
  assert.deepEqual(JSON.parse(run(['--lines', '--json'], '')), []);
});
