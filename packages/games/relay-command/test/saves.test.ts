import { readdirSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { isRecord } from '@wp/game-core';
import { isValidState, migrateState, rulesetFor, specOf } from '../src/rules';

/** The current state version (`RcState.v`). */
const STATE_VERSION = 12;

/**
 * Genuine saves of every state version (test/fixtures/saves, made with the code of each version):
 * every one migrates to a valid game, and its world names the ruleset the game plays by
 * (orchestrator question on PR #112, 2026-11-02: `isValidWorld` now checks `world.ruleset`).
 */
const dir = new URL('./fixtures/saves/', import.meta.url);
const sets = readdirSync(dir)
  .filter((f) => f.endsWith('.json.gz'))
  .sort()
  .map((f) => ({ file: f, saves: JSON.parse(gunzipSync(readFileSync(new URL(f, dir))).toString()) as { label: string; state: Record<string, unknown> }[] }));

describe('genuine saves of every state version', () => {
  it('has sets for every version up to the current one, with several sides, capture and teams among them', () => {
    const versions = new Set(sets.flatMap((s) => s.saves.map((x) => x.state.v)));
    expect([...versions].sort((a, b) => Number(a) - Number(b))).toEqual(Array.from({ length: STATE_VERSION }, (_, i) => i + 1));
    const all = sets.flatMap((s) => s.saves);
    expect(all.some((x) => isRecord(x.state.world) && x.state.world.ruleset === 'strategy-3-sides')).toBe(true);
    expect(all.some((x) => isRecord(x.state.world) && Array.isArray(x.state.world.teams))).toBe(true);
    expect(all.some((x) => Array.isArray(x.state.seats) && x.state.seats.filter((s) => s === 'person').length > 1)).toBe(true);
  });

  for (const { file, saves } of sets) {
    it(`${file}: every save migrates to a valid game whose world names its ruleset`, () => {
      for (const { label, state } of saves) {
        const v = state.v as number;
        const game = v === STATE_VERSION ? (isValidState(state) ? state : undefined) : migrateState(structuredClone(state), v);
        expect(game, `${file} ${label}`).toBeDefined();
        expect(isValidState(game), `${file} ${label}`).toBe(true);
        const spec = specOf(game!)!;
        expect(game!.world.ruleset, `${file} ${label}`).toBe(rulesetFor(spec, game!.opponents).id);
      }
    });
  }
});
