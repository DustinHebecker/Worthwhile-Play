#!/usr/bin/env node
// Decides what Stryker mutates in CI (see .github/workflows/mutation.yml and ADR 0021).
//
//   node scripts/mutation-targets.mjs [files…]          files (args or stdin, one per line) that
//                                                       stryker.config.json covers, comma-separated
//   … --json                                            the same as a JSON array (one file per entry)
//   … --json --groups N                                 N round-robin groups, each comma-separated
//   … --sample W [--every K]                            only the files whose index in the sorted list
//                                                       is W mod K (K defaults to 8): a rotating sample
//                                                       that covers every file once in K weeks
//   git diff -U0 … | … --lines [--json]                 changed lines only: per covered file the
//                                                       Stryker mutation ranges (`file:12-30`) of its
//                                                       added or changed lines; `--json` gives one
//                                                       matrix entry per file
//
// Pull requests use `--lines`, so mutation testing covers the changed logic instead of whole files.
import { readFileSync } from 'node:fs';
import { matchesGlob } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Changed lines closer than this are mutated as one range. */
export const MERGE_GAP = 5;
/** Lines of context added on each side of a range (a changed line inside a multi-line expression). */
export const CONTEXT = 2;

const config = JSON.parse(readFileSync(new URL('../stryker.config.json', import.meta.url), 'utf8'));
const include = config.mutate.filter((p) => !p.startsWith('!'));
const exclude = config.mutate.filter((p) => p.startsWith('!')).map((p) => p.slice(1));

/** Whether stryker.config.json mutates this repository-relative path. */
export function isCovered(file) {
  return include.some((p) => matchesGlob(file, p)) && !exclude.some((p) => matchesGlob(file, p));
}

/** Covered files of a list, de-duplicated and sorted. */
export function coveredFiles(files) {
  return [...new Set(files.map((f) => f.trim()).filter((f) => f && isCovered(f)))].sort();
}

/** Splits files into at most `groups` round-robin groups, each a comma-separated string. */
export function roundRobin(files, groups) {
  const buckets = Array.from({ length: Math.min(groups, files.length) }, () => []);
  files.forEach((file, i) => buckets[i % buckets.length].push(file));
  return buckets.map((b) => b.join(','));
}

/** The files whose index in the sorted list is `week` mod `every`. */
export function sample(files, week, every) {
  const slot = ((week % every) + every) % every;
  return [...files].sort().filter((_, i) => i % every === slot);
}

/**
 * Parses `git diff -U0` output into the new-side line ranges of added or changed lines, per file.
 * Pure deletions (`+c,0`) add no range. Hunk bodies are skipped by count, so content lines that
 * happen to start with `+++ ` or `@@` cannot be mistaken for headers.
 * @returns {Map<string, Array<[number, number]>>}
 */
export function parseUnifiedDiff(text) {
  const ranges = new Map();
  const lines = text.split('\n');
  let file = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('diff --git ')) {
      file = null;
    } else if (line.startsWith('+++ ')) {
      const target = line.slice(4).replace(/\t.*$/, '');
      file = target.startsWith('b/') ? target.slice(2) : null; // /dev/null: deleted file
    } else if (line.startsWith('@@ ') && file) {
      const m = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (!m) continue;
      const removed = m[1] === undefined ? 1 : Number(m[1]);
      const start = Number(m[2]);
      const added = m[3] === undefined ? 1 : Number(m[3]);
      if (added > 0) {
        if (!ranges.has(file)) ranges.set(file, []);
        ranges.get(file).push([start, start + added - 1]);
      }
      // Skip the hunk body (and "\ No newline at end of file" markers).
      let body = removed + added;
      while (body > 0 && i + 1 < lines.length) {
        i++;
        if (!lines[i].startsWith('\\')) body--;
      }
    }
  }
  return ranges;
}

/** Sorts, merges ranges at most `gap` lines apart and widens them by `context` lines (clamped). */
export function mergeRanges(ranges, { gap = MERGE_GAP, context = CONTEXT, lineCount = Infinity } = {}) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of sorted) {
    const last = merged.at(-1);
    if (last && s - last[1] - 1 <= gap) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged.map(([s, e]) => {
    const start = Math.max(1, s - context);
    return [start, Math.max(start, Math.min(lineCount, e + context))];
  });
}

function lineCountOf(file) {
  try {
    return readFileSync(file, 'utf8').split('\n').length;
  } catch {
    return Infinity;
  }
}

/**
 * Stryker mutate specs (`file:start-end`, comma-joined) per covered file of a `git diff -U0`.
 * @returns {string[]} one entry per file, sorted by file
 */
export function lineTargets(diffText, { lineCount = lineCountOf } = {}) {
  const perFile = parseUnifiedDiff(diffText);
  return [...perFile.keys()]
    .filter(isCovered)
    .sort()
    .map((file) =>
      mergeRanges(perFile.get(file), { lineCount: lineCount(file) })
        .map(([s, e]) => `${file}:${s}-${e}`)
        .join(',')
    );
}

function main(argv) {
  const flags = new Set(['--json', '--lines']);
  const valued = new Set(['--groups', '--sample', '--every']);
  const values = {};
  const args = [];
  for (let i = 0; i < argv.length; i++) {
    if (valued.has(argv[i])) values[argv[i]] = Number.parseInt(argv[++i] ?? '', 10);
    else if (flags.has(argv[i])) values[argv[i]] = true;
    else args.push(argv[i]);
  }
  const json = values['--json'] === true;
  const stdin = () => readFileSync(0, 'utf8');

  let entries;
  if (values['--lines']) {
    entries = lineTargets(stdin());
  } else {
    let files = coveredFiles(args.length > 0 ? args : stdin().split('\n'));
    if (values['--sample'] !== undefined) {
      if (!Number.isInteger(values['--sample'])) throw new Error('--sample needs an integer (e.g. the ISO week)');
      files = sample(files, values['--sample'], Math.max(1, values['--every'] || 8));
    }
    const groups = values['--groups'] === undefined ? 0 : Math.max(1, values['--groups'] || 1);
    entries = groups > 0 ? roundRobin(files, groups) : files;
  }
  process.stdout.write(json ? JSON.stringify(entries) : entries.join(','));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
