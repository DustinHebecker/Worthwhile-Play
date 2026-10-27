import { describe, expect, it } from 'vitest';
import { BUDGET, GOALS, GOAL_IDS, HOLD_WEEKS, goalActions, goalOf, goalStatus, meets, toolAction, toolOf, type Goal } from '../src/goals';
import { MEADOW, POND } from '../src/habitats';
import { HABITAT_ACTIONS } from '../src/model';
import { messages } from '../src/messages';
import { PRESETS } from '../src/presets';

const g = (id: string) => goalOf(id)!;
const sampleWith = (goal: Goal, values: Record<string, number>): number[] => {
  const hab = goal.habitat === 'pond' ? POND : MEADOW;
  return [...hab.species.map((s) => values[s.id] ?? 0), 0, 0, 0];
};

describe('goal data', () => {
  it('four goals with known presets, tools valid for their habitat, and plans that use only those tools', () => {
    expect(GOALS.map((x) => x.id)).toEqual([...GOAL_IDS]);
    for (const goal of GOALS) {
      expect(PRESETS[goal.preset].habitat).toBe(goal.habitat);
      expect(new Set(goal.tools.map((t) => t.id)).size).toBe(goal.tools.length);
      for (const t of goal.tools) {
        expect(HABITAT_ACTIONS[goal.habitat]).toContain(t.kind);
        expect(toolOf(goal, toolAction(t, 3))?.id).toBe(t.id);
      }
      expect(goal.plans.length).toBeGreaterThan(0);
      for (const p of goal.plans) {
        for (const a of p.actions) expect(toolOf(goal, a), `${goal.id} ${p.key}`).toBeDefined();
        expect(p.actions.length).toBeLessThanOrEqual(BUDGET.hard);
      }
    }
    expect(toolOf(g('save-pondweed'), { week: 0, kind: 'spray' })).toBeUndefined();
    expect(toolOf(g('save-pondweed'), { week: 0, kind: 'remove', species: 'minnows', share: 50 })).toBeUndefined();
    expect(goalOf('nope')).toBeUndefined();
  });

  it('budgets: unlimited, 6, 4', () => {
    expect(BUDGET.easy).toBe(Number.POSITIVE_INFINITY);
    expect(BUDGET.medium).toBe(6);
    expect(BUDGET.hard).toBe(4);
  });

  it('the script comes before the player log in the same week', () => {
    const goal = g('save-pondweed');
    const acts = goalActions(goal, [{ week: 0, kind: 'set', cond: 1, level: 1 }]);
    expect(acts.map((a) => a.level)).toEqual([3, 1]);
  });
});

describe('meets and goalStatus', () => {
  it('terms sum species and compare inclusively', () => {
    const cp = g('clear-pond');
    expect(meets(cp, sampleWith(cp, { algae: 40_000, bluegreen: 40_000, pondweed: 50_000 }))).toBe(true);
    expect(meets(cp, sampleWith(cp, { algae: 40_000, bluegreen: 40_001, pondweed: 50_000 }))).toBe(false);
    expect(meets(cp, sampleWith(cp, { algae: 0, pondweed: 49_999 }))).toBe(false);
  });

  it('every-week goals fail at the first week below the line and are reached at the deadline', () => {
    const goal = g('protect-flowers');
    const ok = sampleWith(goal, { flowers: 60_000 });
    const low = sampleWith(goal, { flowers: 59_999 });
    expect(goalStatus(goal, [low, ok, ok])).toEqual({ kind: 'running' }); // week 0 (the start) does not count
    expect(goalStatus(goal, [ok, ok, low, ok])).toEqual({ kind: 'failed', week: 2 });
    const full = new Array(53).fill(ok) as number[][];
    expect(goalStatus(goal, full)).toEqual({ kind: 'reached', week: 52 });
    expect(goalStatus(goal, full.slice(0, 52))).toEqual({ kind: 'running' });
  });

  it('streak goals are reached at the week that completes the streak and fail after the deadline', () => {
    const goal = g('bring-back-clover');
    const ok = sampleWith(goal, { clover: 20_000 });
    const low = sampleWith(goal, { clover: 1_000 });
    const s = [low, ...new Array(7).fill(ok), low, ...new Array(8).fill(ok)] as number[][];
    expect(goalStatus(goal, s)).toEqual({ kind: 'reached', week: 16 });
    expect(goalStatus(goal, s.slice(0, 16))).toEqual({ kind: 'running' });
    expect(goalStatus(goal, new Array(209).fill(low) as number[][])).toEqual({ kind: 'failed', week: 208 });
    // A streak completed after the deadline does not count.
    const late = [...new Array(205).fill(low), ...new Array(10).fill(ok)] as number[][];
    expect(goalStatus(goal, late)).toEqual({ kind: 'failed', week: 208 });
  });

  it('"It held" names the length of the check in every locale', () => {
    for (const [locale, m] of Object.entries(messages)) expect((m as Record<string, string>)['goalui.held'], locale).toContain(String(HOLD_WEEKS));
  });
});
