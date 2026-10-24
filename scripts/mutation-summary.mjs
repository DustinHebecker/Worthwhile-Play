#!/usr/bin/env node
// Prints a Markdown table of per-file mutation scores from Stryker's JSON report
// (default reports/mutation/mutation.json) for $GITHUB_STEP_SUMMARY. Score as Stryker computes it:
// detected (killed + timeout) / valid (detected + survived + no coverage); compile and runtime
// errors and ignored mutants do not count. Prints a note instead when there is no report.
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function scores(report) {
  return Object.entries(report.files ?? {})
    .map(([file, { mutants = [] }]) => {
      const count = (...statuses) => mutants.filter((m) => statuses.includes(m.status)).length;
      const detected = count('Killed', 'Timeout');
      const undetected = count('Survived', 'NoCoverage');
      const valid = detected + undetected;
      return { file, mutants: valid, killed: detected, survived: count('Survived'), noCoverage: count('NoCoverage'), score: valid === 0 ? null : (100 * detected) / valid };
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

export function table(rows, title) {
  const fmt = (s) => (s === null ? 'n/a' : `${s.toFixed(1)} %`);
  const total = rows.reduce((t, r) => ({ mutants: t.mutants + r.mutants, killed: t.killed + r.killed, survived: t.survived + r.survived, noCoverage: t.noCoverage + r.noCoverage }), { mutants: 0, killed: 0, survived: 0, noCoverage: 0 });
  const totalScore = total.mutants === 0 ? null : (100 * total.killed) / total.mutants;
  return [
    `### ${title}`,
    '',
    '| File | Score | Mutants | Killed | Survived | No coverage |',
    '|---|---:|---:|---:|---:|---:|',
    ...rows.map((r) => `| \`${r.file}\` | ${fmt(r.score)} | ${r.mutants} | ${r.killed} | ${r.survived} | ${r.noCoverage} |`),
    `| **All** | **${fmt(totalScore)}** | ${total.mutants} | ${total.killed} | ${total.survived} | ${total.noCoverage} |`,
    ''
  ].join('\n');
}

function main([file = 'reports/mutation/mutation.json', title = 'Mutation score'] = []) {
  if (!existsSync(file)) {
    process.stdout.write(`### ${title}\n\nNo mutation report (${file}); see the job log.\n`);
    return;
  }
  process.stdout.write(table(scores(JSON.parse(readFileSync(file, 'utf8'))), title));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
