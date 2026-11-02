// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { CROSSING } from '../src/maps';
import { applyPlan, externalWave, levyOf, lockRound, MAX_ROUNDS, newGame, WEAR_FROM, type HoldState } from '../src/rules';

/** The view of the outside force and of the endless game (review of PR #104, L7; PR #107). */
function show(state: HoldState) {
  const ctx = createTestContext(game as never);
  const instance = game.create(ctx.context);
  instance.restore(state);
  const root = ctx.context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  return { ctx, instance, root, el };
}
const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })) });

describe('Hold the Line view: the outside force', () => {
  it('shows this round’s force instead of the shop, and no pressure before the first battle', () => {
    const s = newGame(1, 'normal', CROSSING.id);
    const { el, instance } = show(s);
    expect(el('outside')!.hidden).toBe(false);
    expect(el('shop')!.hidden).toBe(true);
    expect(el('outside-wave')!.textContent).toContain('each side faces');
    expect(el('outside-wave')!.textContent).toContain(`${externalWave(s).length} × Walker`);
    expect(el('outside-pressure')).toBeNull();
    expect(el('core-foe')!.hidden).toBe(false);
    instance.dispose();
  });

  it('after a battle: the round summary, the pressure, and a save that restores the same view', () => {
    const locked = lockRound(newGame(1, 'normal', CROSSING.id), () => []);
    const { el, instance, ctx } = show(locked);
    el('instant')!.click();
    const after = instance.serialize() as HoldState;
    expect(after.phase).toBe('plan');
    expect(after.round).toBe(1);
    expect(el('status')!.textContent).toContain('You stopped 0 units');
    expect(el('outside-pressure')!.textContent).toContain(`${after.pressure}`);
    expect(el('outside-pressure')!.textContent).toContain('× Walker');
    expect(ctx.saveRequests()).toBeGreaterThan(0);
    const shown = el('outside-pressure')!.textContent;
    instance.dispose();
    const again = show(after);
    expect(again.el('outside-pressure')!.textContent).toBe(shown);
    again.instance.dispose();
  });

  it('alone: speaks of you only, hides the other core, and reads the other half as unused', () => {
    const s = newGame(1, 'normal', CROSSING.id, { solo: true });
    const { el, root, instance } = show(s);
    expect(el('outside-wave')!.textContent).toContain('you face');
    expect(el('outside-wave')!.textContent).not.toContain('each side');
    expect(el('core-foe')!.hidden).toBe(true);
    const labels = [...root.querySelectorAll('[data-testid^="cell-"]')].map((c) => c.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => l.includes('unused while you play alone'))).toBe(true);
    expect(labels.some((l) => l.includes('nobody attacks'))).toBe(true);
    expect(labels.some((l) => l.includes("the other side's"))).toBe(false);
    instance.dispose();
  });

  it('alone, when the core falls: the result is “completed”, without an opponent', () => {
    const s = { ...newGame(1, 'normal', CROSSING.id, { solo: true }) };
    s.sides[0].core = 1;
    s.roundStart.sides[0].core = 1;
    const { el, instance, ctx } = show(lockRound(s, () => []));
    el('instant')!.click();
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]!.outcome).toBe('completed');
    expect(ctx.results[0]!.stats).not.toHaveProperty('opponent');
    expect(el('status')!.textContent).toContain('Your core fell in round 1');
    instance.dispose();
  });
});

describe('Hold the Line view: the endless Duel', () => {
  it('counts rounds against the bound, announces the wear-down ahead and shows it while it applies', () => {
    const base = newGame(1, 'normal');
    const early = show(atRound(base, 10));
    expect(early.el('round')!.textContent).toBe(`Round 11 of at most ${MAX_ROUNDS}`);
    expect(early.el('wear')!.hidden).toBe(true);
    early.instance.dispose();
    const soon = show(atRound(base, WEAR_FROM - 5));
    expect(soon.el('wear')!.hidden).toBe(false);
    expect(soon.el('wear')!.textContent).toContain(`from round ${WEAR_FROM + 1}`);
    soon.instance.dispose();
    const now = show(atRound(base, WEAR_FROM + 2));
    expect(now.el('wear')!.textContent).toContain('loses 3');
    now.instance.dispose();
  });

  it('shows the levy apart from what was bought, before and after the lock', () => {
    const s = applyPlan(atRound(newGame(1, 'normal'), 12), 0, { t: 'buy', kind: 'runner' });
    const plan = show(s);
    expect(plan.el('capacity')!.textContent).toBe('Units: 1 of 8');
    expect(plan.el('levy')!.textContent).toContain(`${levyOf(s).filter((k) => k === 'walker').length} × Walker`);
    plan.instance.dispose();
    const battle = show(lockRound(s, () => []));
    expect(battle.el('capacity')!.textContent).toBe('Units: 1 of 8');
    expect(battle.el('levy')).not.toBeNull();
    battle.instance.dispose();
  });
});
