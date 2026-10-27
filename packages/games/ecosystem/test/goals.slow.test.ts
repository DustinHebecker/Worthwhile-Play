import { describe, expect, it } from 'vitest';
import { BUDGET, goalOf, holdsAfter, planOutcome, type GoalStatus } from '../src/goals';
import type { Action } from '../src/model';

const at = (week: number, a: Omit<Action, 'week'>): Action => ({ week, ...a });
const g = (id: string) => goalOf(id)!;
const reached = (s: GoalStatus) => s.kind === 'reached';

describe('goals against the model (Appendix B.2)', () => {
  it('save-pondweed: the buffer strip or closing the ditch early keeps the pondweed; late fixes and doing nothing do not', () => {
    const goal = g('save-pondweed');
    const low = (w: number) => at(w, { kind: 'set', cond: 1, level: 1 });
    const none = (w: number) => at(w, { kind: 'set', cond: 1, level: 0 });
    for (const p of goal.plans) expect(planOutcome(goal, p.actions).kind, p.key).toBe('reached');
    expect(planOutcome(goal, [low(10)]).kind).toBe('reached');
    expect(planOutcome(goal, [none(10)]).kind).toBe('reached');
    // Measured too: netting the algae every 10 weeks keeps it (9 changes, more than the hard budget).
    expect(planOutcome(goal, [10, 20, 30, 40, 50, 60, 70, 80, 90].map((w) => at(w, { kind: 'net-algae' }))).kind).toBe('reached');
    expect(planOutcome(goal, [])).toEqual({ kind: 'failed', week: 51 });
    // In week 20 the pondweed still looks fine, but the buffer strip is too late.
    expect(planOutcome(goal, [low(20)]).kind).toBe('failed');
    expect(planOutcome(goal, [none(20)]).kind).toBe('failed');
    expect(planOutcome(goal, [at(10, { kind: 'set', cond: 2, level: 2 }), at(20, { kind: 'set', cond: 2, level: 0 })]).kind).toBe('failed');
    expect(planOutcome(goal, [at(10, { kind: 'remove', species: 'minnows', share: 90 })]).kind).toBe('failed');
  });

  it('clear-pond: the four-step restoration holds; a short flush slips back; symptom fixes never reach the goal', () => {
    const goal = g('clear-pond');
    const none = at(0, { kind: 'set', cond: 1, level: 0 });
    const plant = (w = 0) => at(w, { kind: 'add', species: 'pondweed' });
    const fish = (w = 0) => at(w, { kind: 'remove', species: 'minnows', share: 90 });
    const dredge = at(0, { kind: 'dredge' });
    const stream = (w: number) => at(w, { kind: 'set', cond: 2, level: 2 });
    const still = (w: number) => at(w, { kind: 'set', cond: 2, level: 0 });
    const restore = goal.plans[0]!.actions;
    expect(planOutcome(goal, restore)).toEqual({ kind: 'reached', week: 53 });
    expect(holdsAfter(goal, restore, 53)).toBe(-1);
    const flush20 = goal.plans[1]!.actions;
    expect(planOutcome(goal, flush20)).toEqual({ kind: 'reached', week: 43 });
    expect(holdsAfter(goal, flush20, 43)).toBe(-1);
    // "Does it hold?": flushing for only 10 weeks clears the water, which slips back 79 weeks later.
    const flush10 = [none, stream(0), still(10), plant(10)];
    expect(planOutcome(goal, flush10)).toEqual({ kind: 'reached', week: 40 });
    expect(holdsAfter(goal, flush10, 40) - 40).toBe(79);
    // Flushing with the runoff still on: the cause was still there (72 weeks later).
    const flushOn = [stream(0), still(20), plant(20)];
    expect(planOutcome(goal, flushOn)).toEqual({ kind: 'reached', week: 42 });
    expect(holdsAfter(goal, flushOn, 42) - 42).toBe(72);
    for (const [name, plan] of [
      ['nothing', []],
      ['treat algae 3 ×', [0, 20, 40].map((w) => at(w, { kind: 'treat-algae' }))],
      ['plant only', [plant()]],
      ['fish out + plant with the runoff on', [fish(), plant()]],
      ['runoff none alone', [none]],
      ['runoff none + plant', [none, plant()]],
      ['runoff none + dredge + plant', [none, dredge, plant()]],
      ['runoff none, wait a year, fish out + plant', [none, fish(52), plant(52)]]
    ] as const) expect(planOutcome(goal, plan).kind, name).toBe('failed');
  });

  it('protect-flowers: ladybirds released in weeks 8–14 save the flowers; too early they starve, too late is too late', () => {
    const goal = g('protect-flowers');
    const lady = (w: number) => [at(w, { kind: 'add', species: 'ladybirds' })];
    for (const w of [8, 10, 12, 14]) expect(reached(planOutcome(goal, lady(w))), `week ${w}`).toBe(true);
    for (const w of [0, 2, 4, 6, 16, 18]) expect(reached(planOutcome(goal, lady(w))), `week ${w}`).toBe(false);
    expect(reached(planOutcome(goal, []))).toBe(false);
    expect(reached(planOutcome(goal, [at(12, { kind: 'spray' })]))).toBe(false);
  });

  it('bring-back-clover: only plans with foxes bring the clover back by week 208; their result holds', () => {
    const goal = g('bring-back-clover');
    const weeks = goal.plans.map((p) => planOutcome(goal, p.actions));
    expect(weeks).toEqual([
      { kind: 'reached', week: 154 },
      { kind: 'reached', week: 135 },
      { kind: 'reached', week: 106 }
    ]);
    goal.plans.forEach((p, k) => expect(holdsAfter(goal, p.actions, (weeks[k] as { week: number }).week), p.key).toBe(-1));
    const r50 = at(0, { kind: 'remove', species: 'rabbits', share: 50 });
    const r90 = at(0, { kind: 'remove', species: 'rabbits', share: 90 });
    for (const plan of [[], [r50], [r90], [r90, at(0, { kind: 'add', species: 'clover' })]]) expect(planOutcome(goal, plan).kind).toBe('failed');
  });

  it('every reference plan fits the hard budget', () => {
    for (const id of ['save-pondweed', 'clear-pond', 'protect-flowers', 'bring-back-clover']) for (const p of g(id).plans) expect(p.actions.length).toBeLessThanOrEqual(BUDGET.hard);
  });
});
