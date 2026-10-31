/**
 * The doom benchmark of design v3 § 6.1 (not run in CI; run by the implementer and the reviewer, results in the
 * implementation notes of docs/design/pixel-peel-v3.md):
 *
 *   node packages/games/pixel-peel/scripts/doom-report.ts [--level easy|medium|hard|all] [--seeds 3] [--jobs 4]
 *                                                         [--motifs id,id] [--out file.jsonl] [--quick]
 *                                                         [--set horizon=12 --set guard=true …]
 *
 * For every motif × seed of a level it plays the four rules-of-thumb players (obvious, tidy, cautious, noisy tidy),
 * finds for each dead end the fatal move and the doom delay with the oracle of `test/doom.ts` (method of § 1.1), and
 * checks every first move other than the stored solution's. It prints the distribution and the owner's targets
 * (2026-10-29): median delay ≤ 6, 90th percentile ≤ 20, no fatal move among the first 5 moves.
 *
 * Node runs this TypeScript file directly (type stripping) with the module hooks of `hooks.ts`. With --jobs > 1 the work is split over child processes of this script.
 */
import './hooks.ts';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';


const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => (args.includes(name) ? (args[args.indexOf(name) + 1] as string) : fallback);
const levelArg = opt('--level', 'hard');
const seeds = Number(opt('--seeds', '3'));
const jobs = Number(opt('--jobs', '4'));
const shard = opt('--shard', '');
const out = opt('--out', '');
const quick = args.includes('--quick');

interface Doom {
  length: number;
  fatal: number;
  delay: number;
  proven: boolean;
}
interface Line {
  level: string;
  motif: string;
  seed: number;
  genMs: number;
  runs: { player: string; result: string; doom?: Doom }[];
  firsts: { move: string; verdict: string }[];
}

const levels = levelArg === 'all' ? ['easy', 'medium', 'hard'] : [levelArg];

async function work(index: number, count: number): Promise<void> {
  const { MOTIFS } = (await import(pathToFileURL(resolve(here, '../src/motifs/index.ts')).href)) as { MOTIFS: readonly { id: string }[] };
  const { createInitial } = (await import(pathToFileURL(resolve(here, '../src/generate.ts')).href)) as { createInitial: (s: number, d: string, m: string) => unknown };
  // A game plays the baked art, loaded on demand (src/catalogue.ts); load it all up front.
  await ((await import(pathToFileURL(resolve(here, '../src/catalogue.ts')).href)) as { loadAllArt: () => Promise<void> }).loadAllArt();
  const doom = (await import(pathToFileURL(resolve(here, '../test/doom.ts')).href)) as {
    measurePuzzle: (s: unknown, o: unknown) => { runs: Line['runs']; firsts: Line['firsts'] };
    ORACLE: unknown;
    QUICK_ORACLE: unknown;
  };
  // Calibration: --set key=value (repeatable) overrides level parameters, e.g. --set horizon=12 --set candidates=5.
  const { LEVELS } = (await import(pathToFileURL(resolve(here, '../src/generate.ts')).href)) as { LEVELS: Record<string, Record<string, unknown>> };
  args.forEach((a, i) => {
    if (a !== '--set') return;
    const [key, value] = (args[i + 1] as string).split('=') as [string, string];
    for (const level of levels) (LEVELS[level] as Record<string, unknown>)[key] = value === 'true' ? true : value === 'false' ? false : Number(value);
  });
  const only = opt('--motifs', '');
  const motifs = MOTIFS.filter((m) => !only || only.split(',').includes(m.id));
  let i = 0;
  for (const level of levels)
    for (const motif of motifs)
      for (let s = 1; s <= seeds; s++, i++) {
        if (i % count !== index) continue;
        const seed = 1000 + s;
        const t0 = performance.now();
        const state = createInitial(seed, level, motif.id);
        const genMs = performance.now() - t0;
        const r = doom.measurePuzzle(state, quick ? doom.QUICK_ORACLE : doom.ORACLE);
        process.stdout.write(`${JSON.stringify({ level, motif: motif.id, seed, genMs: Math.round(genMs), ...r })}\n`);
      }
}

const pct = (xs: number[], p: number) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] as number;
};

function report(lines: Line[]): void {
  for (const level of levels) {
    const ls = lines.filter((l) => l.level === level);
    if (!ls.length) continue;
    const runs = ls.flatMap((l) => l.runs);
    const dooms = runs.flatMap((r) => (r.doom ? [r.doom] : []));
    const delays = dooms.map((d) => d.delay);
    const fatal = dooms.map((d) => d.fatal);
    const firsts = ls.flatMap((l) => l.firsts);
    const badFirsts = firsts.filter((f) => f.verdict !== 'solvable');
    const share = (f: (d: Doom) => boolean) => (dooms.length ? (100 * dooms.filter(f).length) / dooms.length : 0);
    const median = pct(delays, 0.5);
    const p90 = pct(delays, 0.9);
    const early = dooms.filter((d) => d.fatal <= 5).length;
    console.log(`\n== ${level}: ${ls.length} puzzles, ${runs.length} runs (${runs.filter((r) => r.result === 'solved').length} solved, ${dooms.length} stuck)`);
    console.log(`fatal move: median ${pct(fatal, 0.5)}, 10th percentile ${pct(fatal, 0.1)}`);
    console.log(`doom delay: median ${median}, p75 ${pct(delays, 0.75)}, p90 ${p90}, max ${Math.max(0, ...delays)}; ≥ 20: ${share((d) => d.delay >= 20).toFixed(1)} %, ≥ 25: ${share((d) => d.delay >= 25).toFixed(1)} %`);
    console.log(`fatal move among the first 5 / 10 moves: ${early} (${share((d) => d.fatal <= 5).toFixed(1)} %) / ${share((d) => d.fatal <= 10).toFixed(1)} %`);
    console.log(`first moves without a found solution: ${badFirsts.length} of ${firsts.length}; puzzles with one: ${ls.filter((l) => l.firsts.some((f) => f.verdict !== 'solvable')).length} of ${ls.length}`);
    console.log(`generation: median ${pct(ls.map((l) => l.genMs), 0.5)} ms, max ${Math.max(...ls.map((l) => l.genMs))} ms`);
    const ok = (dooms.length === 0 || (median <= 6 && p90 <= 20)) && early === 0;
    console.log(`targets (median ≤ 6, p90 ≤ 20, no fatal move among the first 5): ${ok ? 'met' : 'NOT met'}`);
  }
}

if (shard) {
  const [index, count] = shard.split('/').map(Number) as [number, number];
  await work(index, count);
} else {
  const lines: Line[] = [];
  const self = fileURLToPath(import.meta.url);
  await Promise.all(
    Array.from({ length: jobs }, (_, j) =>
      new Promise<void>((done, fail) => {
        const child = spawn(process.execPath, [self, ...args, '--shard', `${j}/${jobs}`], { stdio: ['ignore', 'pipe', 'inherit'] });
        let buffer = '';
        child.stdout.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          let nl: number;
          while ((nl = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.startsWith('{')) {
              lines.push(JSON.parse(line) as Line);
              process.stderr.write('.');
            }
          }
        });
        child.on('exit', (code) => (code === 0 ? done() : fail(new Error(`shard ${j} exited with ${code}`))));
      })
    )
  );
  process.stderr.write('\n');
  if (out) writeFileSync(out, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  report(lines);
}
