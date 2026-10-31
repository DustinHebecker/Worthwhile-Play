import { describe, expect, it } from 'vitest';
import { cellOf, computeNetwork, createWorld, initialIntel, muzzleFlashes, observe, STRATEGY_RULESET as R, validateCommand, type World } from '../src';
import { open } from './helpers';

/**
 * Teams (owner decisions 2026-10-24): allies share their radio network (an order reaches a unit
 * through an ally's relay; order slots stay the side's own) and their sight and reports. Without
 * teams nothing is shared (free-for-all), which every other suite pins down byte for byte.
 *
 * A 30×5 map: side 0's post at (0, 2) covers x ≤ 5; its squad stands at (12, 2), out of its own
 * cover but inside the cover of side 1's relay mast at (14, 2) (linked to side 1's post at (19, 2));
 * side 2, the enemy, holds (29, 2) with a squad at (24, 2) that only side 1's post sees; side 1's
 * squad at (8, 4) is out of every cover and every sight.
 */
function world(teams: number[] | undefined, extra: { side: number; kind: string; x: number; y: number }[] = []): World {
  const w = createWorld(
    {
      map: open(30, 5),
      sides: 3,
      ...(teams && { teams }),
      entities: [
        { side: 0, kind: 'command-post', x: 0, y: 2 },
        { side: 1, kind: 'command-post', x: 19, y: 2 },
        { side: 2, kind: 'command-post', x: 29, y: 2 },
        { side: 0, kind: 'rifles', x: 12, y: 2 },
        { side: 1, kind: 'relay-mast', x: 14, y: 2 },
        { side: 2, kind: 'rifles', x: 24, y: 2 },
        { side: 1, kind: 'rifles', x: 8, y: 4 },
        ...extra
      ],
      seed: 1
    },
    R
  );
  w.intel = initialIntel(w, R);
  return w;
}
const ALLIES = [0, 0, 1];
const at = (w: World, x: number, y: number) => w.entities.find((e) => e.x === x && e.y === y)!;

describe('teams share a radio network and sight (owner decisions 2026-10-24)', () => {
  it('an order reaches a unit through an ally\'s relay; without a team it does not', () => {
    for (const [teams, reached] of [[ALLIES, true], [undefined, false]] as const) {
      const w = world(teams);
      const squad = at(w, 12, 2);
      expect(computeNetwork(w, R, 0).coverage[cellOf(w.map, 12, 2)], String(teams)).toBe(reached ? 1 : 0);
      expect(validateCommand(w, R, { side: 0, unit: squad.id, order: { type: 'move', x: 11, y: 2 } }).ok, String(teams)).toBe(reached);
    }
  });

  it('order slots stay the side\'s own: an ally\'s post adds none', () => {
    expect(computeNetwork(world(ALLIES), R, 0).slots).toBe(computeNetwork(world(undefined), R, 0).slots);
    expect(computeNetwork(world(ALLIES), R, 0).slots).toBe(R.archetypes['command-post']!.comms!.orderSlots);
  });

  it('a side sees what its ally sees: an enemy only the ally observes is a live report; without a team it is not', () => {
    for (const [teams, seen] of [[ALLIES, true], [undefined, false]] as const) {
      const w = world(teams);
      const enemy = at(w, 24, 2);
      expect(w.intel![0]!.some((r) => r.id === enemy.id && r.live), String(teams)).toBe(seen);
      expect(observe(w, R, 0).world.entities.some((e) => e.id === enemy.id), String(teams)).toBe(seen);
    }
  });

  it('allies know each other\'s starting positions, also a unit nobody sees', () => {
    for (const [teams, known] of [[ALLIES, true], [undefined, false]] as const) {
      const w = world(teams);
      expect(w.intel![0]!.some((r) => r.id === at(w, 8, 4).id), String(teams)).toBe(known);
    }
  });

  it('an ally\'s Tracer burns through enemy jamming for the whole team', () => {
    // A set-up enemy jammer at (10, 0) jams (12, 2) but not the mast; side 1's Tracer at (11, 2) burns (12, 2) free.
    const jammed = (withTracer: boolean) => {
      const w = world(ALLIES, [{ side: 2, kind: 'jammer', x: 10, y: 0 }, ...(withTracer ? [{ side: 1, kind: 'tracer', x: 11, y: 2 }] : [])]);
      at(w, 10, 0).deploy = R.ticksPerTurn;
      return computeNetwork(w, R, 0).coverage[cellOf(w.map, 12, 2)];
    };
    expect(jammed(false)).toBe(0);
    expect(jammed(true)).toBe(1);
  });

  it('a shot at an ally\'s unit tells the side where the shooter stands (muzzle flash); without a team it does not', () => {
    for (const [teams, told] of [[ALLIES, true], [undefined, false]] as const) {
      const w = world(teams);
      const shooter = at(w, 24, 2);
      const fire = { t: 'fire' as const, tick: 0, id: shooter.id, target: at(w, 19, 2).id };
      expect(muzzleFlashes(w, R, 0, [], [fire]).has(shooter.id), String(teams)).toBe(told);
    }
  });
});
