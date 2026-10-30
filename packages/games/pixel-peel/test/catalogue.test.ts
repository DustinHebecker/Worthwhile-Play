import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '@wp/game-core';
import { ANY, anyOf, CATALOGUE, CHOICES, drawMotif, GROUPS_SHOWN, loadAllArt, motifFor, toChoice } from '../src/catalogue';
import { createInitial } from '../src/generate';
import { settings } from '../src/index';
import { settingsOf } from '../src/rules';

describe('motif catalogue and choices (docs/design/pixel-peel-motifs.md § 4)', () => {
  it('offers "Any picture", "Any <group>" for every group with pictures, then every picture; groups list each once', async () => {
    await loadAllArt();
    expect(CHOICES).toEqual([ANY, ...GROUPS_SHOWN.map(anyOf), ...CATALOGUE.map((c) => c.id)]);
    const spec = settings.find((s) => s.kind === 'choice' && s.id === 'motif');
    expect(spec?.kind === 'choice' && spec.values).toEqual(CHOICES);
    const groups = spec?.kind === 'choice' ? (spec.groups ?? []) : [];
    expect(groups.map((g) => g.labelKey)).toEqual(GROUPS_SHOWN.map((g) => `group.${g}`));
    // Only "Any picture" is outside the groups; each group starts with its "Any …" and keeps the catalogue order.
    expect(groups.flatMap((g) => g.values)).toEqual(GROUPS_SHOWN.flatMap((g) => [anyOf(g), ...CATALOGUE.filter((c) => c.group === g).map((c) => c.id)]));
  });

  it('toChoice keeps known choices and turns anything else into "Any picture"', () => {
    for (const choice of CHOICES) expect(toChoice(choice)).toBe(choice);
    for (const junk of [undefined, null, 3, '', 'unicorn', 'any-unicorn', '__proto__', 'ANY']) expect(toChoice(junk)).toBe(ANY);
  });

  it('an explicit picture draws no random number; "Any <group>" draws once, always from its group, covering it', () => {
    const rng = createRng(5);
    const before = rng.state();
    expect(drawMotif(rng, CATALOGUE[3]!.id)).toBe(CATALOGUE[3]);
    expect(rng.state()).toEqual(before);
    for (const group of GROUPS_SHOWN) {
      const members = new Set(CATALOGUE.filter((c) => c.group === group).map((c) => c.id));
      const seen = new Set<string>();
      for (let seed = 0; seed < 200; seed++) {
        const card = motifFor(seed, anyOf(group));
        expect(card.group).toBe(group);
        seen.add(card.id);
      }
      expect(seen).toEqual(members);
    }
  });

  it('a game started with "Any <group>" plays a picture of that group and keeps the choice for "Another round"', async () => {
    await loadAllArt();
    for (const group of GROUPS_SHOWN) {
      const state = createInitial(11, 'easy', anyOf(group));
      expect(CATALOGUE.find((c) => c.id === state.motif)!.group).toBe(group);
      expect(state.motif).toBe(motifFor(11, anyOf(group)).id);
      expect(settingsOf(state).motif).toBe(anyOf(group));
      expect(createInitial(11, 'easy', anyOf(group))).toEqual(state);
    }
  });
});

describe('art on demand (prepare)', () => {
  it('a fresh game module has no art; prepare loads exactly the picture the seed draws, after which newGame can start it', async () => {
    vi.resetModules();
    const catalogue = await import('../src/catalogue');
    const generate = await import('../src/generate');
    expect(catalogue.CATALOGUE.filter((c) => catalogue.artOf(c.id))).toEqual([]);
    const options = { seed: 1234, difficulty: 'medium', settings: { motif: 'any' } };
    const card = catalogue.motifFor(options.seed, 'any');
    await catalogue.prepare(options);
    expect(catalogue.CATALOGUE.filter((c) => catalogue.artOf(c.id)).map((c) => c.id)).toEqual([card.id]);
    expect(generate.createInitial(1234, 'medium', 'any').motif).toBe(card.id);
    // Another picture's art is not there: a start without prepare is a programming error, reported clearly.
    const other = catalogue.CATALOGUE.find((c) => c.id !== card.id)!;
    expect(() => generate.createInitial(1, 'easy', other.id)).toThrow(/not loaded/);
    // Repeating is free; an unknown id rejects.
    await catalogue.prepare(options);
    await expect(catalogue.loadArt('unicorn')).rejects.toThrow(/unknown motif/);
  });
});

describe('the game chunk holds no vector motif and no rasteriser', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const readdirTs = (path: string) => readdirSync(path).filter((f) => f.endsWith('.ts')).sort();
  /** Static imports reachable from src/index.ts (type-only imports excluded), plus the glob of the catalogue. */
  function reachable(): { files: Set<string>; dynamic: Set<string> } {
    const files = new Set<string>();
    const dynamic = new Set<string>();
    const visit = (file: string) => {
      if (files.has(file)) return;
      files.add(file);
      if (!file.endsWith('.ts')) return;
      const text = readFileSync(src + file, 'utf8');
      const dir = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
      const norm = (spec: string) => {
        const parts = (dir + spec).split('/');
        const out: string[] = [];
        for (const p of parts) if (p === '..') out.pop(); else if (p !== '.') out.push(p);
        const path = out.join('/');
        return /\.[a-z]+$/.test(path) ? path : `${path}.ts`;
      };
      for (const m of text.matchAll(/^import (?!type )[^;]*?from '(\.[^']+)';|^import '(\.[^']+)';/gms)) visit(norm((m[1] ?? m[2])!));
      for (const m of text.matchAll(/import\('(\.[^']+)'\)/g)) dynamic.add(norm(m[1]!));
      for (const m of text.matchAll(/import\.meta\.glob[^(]*\('(\.[^']+)\/\*\.ts'/g)) {
        const globDir = norm(m[1]! + '/x').slice(0, -'x.ts'.length);
        for (const f of readdirTs(src + globDir)) visit(globDir + f);
      }
    };
    visit('index.ts');
    return { files, dynamic };
  }

  it('reaches the cards and loads each baked art lazily, never src/motifs/<id>.ts, the batches or src/art/raster.ts', () => {
    const { files, dynamic } = reachable();
    expect([...files].filter((f) => f.startsWith('motifs/')).every((f) => f.startsWith('motifs/cards/') || f === 'motifs/order.ts'), [...files].join(' ')).toBe(true);
    expect(files.has('art/raster.ts')).toBe(false);
    expect(files.has('art/trig.ts')).toBe(false);
    expect([...files].some((f) => f.startsWith('motifs/cards/'))).toBe(true);
    expect([...dynamic].sort()).toEqual(CATALOGUE.map((c) => `motifs/baked/${c.id}.ts`).sort());
  });
});
