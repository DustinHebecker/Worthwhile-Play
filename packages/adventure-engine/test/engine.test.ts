import { describe, expect, it } from 'vitest';
import { available, compile, holds, initialState, step, textKeys, type Action, type Adventure, type AdventureState } from '../src';
import { C, WALKTHROUGH, WATCHTOWER } from './fixture';

const play = (actions: readonly Action[], s?: AdventureState): AdventureState =>
  actions.reduce((st, a) => {
    const r = step(C(), st, a);
    if (!r.out.ok) throw new Error(`refused ${JSON.stringify(a)}: ${r.out.reason}`);
    return r.state;
  }, s ?? initialState(C(), 1));

describe('initial state', () => {
  it('starts in the start scene, runs its onEnter rule and logs its text', () => {
    const s = initialState(C(), 7);
    expect(s).toMatchObject({ scene: 'yard', visited: ['yard'], items: [], seed: 7, chapter: 0, ended: null, actions: 0 });
    expect(s.log).toEqual(['scene.yard.enter.0']);
  });

  it('applies start items and non-zero start flags', () => {
    const c = compile({ ...WATCHTOWER, start: { scene: 'cellar', items: ['rope'], flags: { 'keeper-mood': 2, 'grapnel-hooked': 0 } } });
    const s = initialState(c, 1);
    expect(s.items).toEqual(['rope']);
    expect(s.flags).toEqual({ 'keeper-mood': 2 });
    expect(s.log).toEqual([]);
  });
});

describe('conditions', () => {
  const s = (): AdventureState => ({ ...initialState(C(), 1), flags: { 'keeper-mood': 2 }, items: ['rope'], used: ['hook'], clues: ['shifts'], goalsDone: ['reach-window'] });
  it.each([
    [{ flag: 'keeper-mood' }, true],
    [{ flag: 'grapnel-hooked' }, false],
    [{ flag: 'keeper-mood', eq: 2 }, true],
    [{ flag: 'keeper-mood', eq: 1 }, false],
    [{ flag: 'keeper-mood', gte: 2 }, true],
    [{ flag: 'keeper-mood', gte: 3 }, false],
    [{ flag: 'keeper-mood', lte: 2 }, true],
    [{ flag: 'keeper-mood', lte: 1 }, false],
    [{ flag: 'grapnel-hooked', eq: 0 }, true],
    [{ has: 'rope' }, true],
    [{ has: 'hook' }, false],
    [{ used: 'hook' }, true],
    [{ used: 'rope' }, false],
    [{ knows: 'shifts' }, true],
    [{ knows: 'ledger-dates' }, false],
    [{ visited: 'yard' }, true],
    [{ visited: 'tower' }, false],
    [{ in: 'yard' }, true],
    [{ in: 'cellar' }, false],
    [{ goal: 'reach-window' }, true],
    [{ goal: 'open-chest' }, false],
    [{ all: [{ has: 'rope' }, { knows: 'shifts' }] }, true],
    [{ all: [{ has: 'rope' }, { has: 'hook' }] }, false],
    [{ all: [] }, true],
    [{ any: [{ has: 'hook' }, { knows: 'shifts' }] }, true],
    [{ any: [{ has: 'hook' }, { has: 'map' }] }, false],
    [{ any: [] }, false],
    [{ not: { has: 'rope' } }, false],
    [{ not: { has: 'hook' } }, true]
  ] as const)('%j → %s', (cond, expected) => {
    expect(holds(cond, s())).toBe(expected);
  });
});

describe('step', () => {
  it('take gives the item once and hides the taken hotspot', () => {
    const r = step(C(), initialState(C(), 1), { a: 'take', hs: 'rope' });
    expect(r.out).toEqual({ ok: true, text: ['hs.yard.rope.take.0'], events: [{ type: 'gained', item: 'rope' }] });
    expect(r.state.items).toEqual(['rope']);
    expect(r.state.actions).toBe(1);
    expect(step(C(), r.state, { a: 'take', hs: 'rope' }).out).toEqual({ ok: false, reason: 'not-here' });
  });

  it('examine without rules shows the description; with rules runs them', () => {
    expect(step(C(), initialState(C(), 1), { a: 'examine', hs: 'keeper' }).out).toMatchObject({ ok: true, text: ['hs.yard.keeper.desc'] });
    const cellar = play([{ a: 'use', hs: 'stair' }]);
    const r = step(C(), cellar, { a: 'examine', hs: 'ledger' });
    expect(r.out).toMatchObject({ ok: true, text: ['hs.cellar.ledger.examine.0'], events: [{ type: 'learned', clue: 'ledger-dates' }] });
    expect(step(C(), r.state, { a: 'examine', hs: 'ledger' }).out).toMatchObject({ ok: true, events: [] });
  });

  it('refuses verbs without interaction and rules that do not match, leaving the state unchanged', () => {
    const s = initialState(C(), 1);
    expect(step(C(), s, { a: 'take', hs: 'keeper' })).toEqual({ state: s, out: { ok: false, reason: 'nothing-happens' } });
    const tower = compile({ ...WATCHTOWER, scenes: WATCHTOWER.scenes.map((sc) => (sc.id === 'yard' ? { ...sc, hotspots: sc.hotspots.map((h) => (h.id === 'window' ? { ...h, on: { use: [{ when: { flag: 'grapnel-hooked' } }] } } : h)) } : sc)) });
    expect(step(tower, initialState(tower, 1), { a: 'use', hs: 'window' }).out).toEqual({ ok: false, reason: 'nothing-happens' });
  });

  it('the first matching rule wins (explanation rule as fallback)', () => {
    const r = step(C(), initialState(C(), 1), { a: 'use', hs: 'window' });
    expect(r.out).toMatchObject({ ok: true, text: ['hs.yard.window.use.1'], events: [] });
    expect(r.state.scene).toBe('yard');
  });

  it('refuses unknown or invisible hotspots and items not held', () => {
    const s = initialState(C(), 1);
    expect(step(C(), s, { a: 'examine', hs: 'ledger' }).out).toEqual({ ok: false, reason: 'not-here' });
    expect(step(C(), s, { a: 'useItem', item: 'grapnel', hs: 'window' }).out).toEqual({ ok: false, reason: 'not-held' });
    const withRope = play([{ a: 'take', hs: 'rope' }]);
    expect(step(C(), withRope, { a: 'useItem', item: 'rope', hs: 'nowhere' }).out).toEqual({ ok: false, reason: 'not-here' });
    expect(step(C(), withRope, { a: 'useItem', item: 'rope', hs: 'keeper' }).out).toEqual({ ok: false, reason: 'nothing-happens' });
  });

  it('dialogue: starts at the first node, options follow conditions, ends with null', () => {
    const r1 = step(C(), initialState(C(), 1), { a: 'talk', hs: 'keeper' });
    expect(r1.out).toMatchObject({ ok: true, text: ['hs.yard.keeper.talk.0', 'dlg.keeper.hello'] });
    expect(r1.state.dialogue).toEqual({ id: 'keeper', node: 'hello' });
    expect(available(C(), r1.state)).toEqual([{ a: 'choose', option: 'shifts' }, { a: 'choose', option: 'bye' }, { a: 'hint', goal: 'explore' }]);
    expect(step(C(), r1.state, { a: 'choose', option: 'tower' }).out).toEqual({ ok: false, reason: 'invalid' });
    expect(step(C(), r1.state, { a: 'take', hs: 'rope' }).out).toEqual({ ok: false, reason: 'in-dialogue' });
    const r2 = step(C(), r1.state, { a: 'choose', option: 'shifts' });
    expect(r2.out).toMatchObject({ ok: true, text: ['dlg.keeper.hello.shifts', 'dlg.keeper.shifts'] });
    expect(r2.state.clues).toEqual(['shifts']);
    expect(r2.state.flags['keeper-mood']).toBe(1);
    const r3 = step(C(), r2.state, { a: 'choose', option: 'thanks' });
    expect(r3.state.dialogue).toBeNull();
    expect(r3.out).toMatchObject({ ok: true, events: [{ type: 'dialogue', id: 'keeper', node: null }] });
    expect(step(C(), r3.state, { a: 'choose', option: 'bye' }).out).toEqual({ ok: false, reason: 'invalid' });
  });

  it('combine is order-independent and uses items up; unknown pairs are refused', () => {
    const s = play([{ a: 'take', hs: 'rope' }, { a: 'use', hs: 'stair' }, { a: 'take', hs: 'hook' }]);
    const a = step(C(), s, { a: 'combine', x: 'rope', y: 'hook' });
    const b = step(C(), s, { a: 'combine', x: 'hook', y: 'rope' });
    expect(a.state).toEqual(b.state);
    expect(a.state.items).toEqual(['grapnel']);
    expect(a.state.used).toEqual(['rope', 'hook']);
    expect(a.out).toMatchObject({ ok: true, text: ['combo.hook.rope.0', 'chapter.below'] });
    expect(step(C(), s, { a: 'combine', x: 'rope', y: 'rope' }).out).toEqual({ ok: false, reason: 'invalid' });
    expect(step(C(), s, { a: 'combine', x: 'rope', y: 'map' }).out).toEqual({ ok: false, reason: 'not-held' });
    const c = compile({ ...WATCHTOWER, combinations: [] });
    expect(step(c, s, { a: 'combine', x: 'rope', y: 'hook' }).out).toEqual({ ok: false, reason: 'no-combination' });
  });

  it('a used-up item is never given again; giving a held item is a no-op', () => {
    const c = compile({
      ...WATCHTOWER,
      scenes: WATCHTOWER.scenes.map((sc) => (sc.id === 'yard' ? { ...sc, hotspots: sc.hotspots.map((h) => (h.id === 'keeper' ? { ...h, on: { ...h.on, use: [{ then: [{ give: 'rope' }, { give: 'hook' }] }] } } : h)) } : sc))
    });
    const s = play(WALKTHROUGH.slice(0, 10));
    expect(s.used).toEqual(['rope', 'hook']);
    const r = step(c, s, { a: 'use', hs: 'keeper' });
    expect(r.out).toMatchObject({ ok: true, events: [] });
    expect(r.state.items).toEqual(['grapnel']);
    const fresh = step(c, play([{ a: 'take', hs: 'rope' }]), { a: 'use', hs: 'keeper' });
    expect(fresh.state.items).toEqual(['rope', 'hook']);
    expect(fresh.out).toMatchObject({ events: [{ type: 'gained', item: 'hook' }] });
  });

  it('deduce connects two known clues; unrelated or unknown clues are refused', () => {
    const s = play(WALKTHROUGH.slice(0, 7));
    expect(s.clues).toEqual(['shifts', 'ledger-dates']);
    const r = step(C(), s, { a: 'deduce', x: 'ledger-dates', y: 'shifts' });
    expect(r.out).toMatchObject({ ok: true, text: ['deduce.ledger-dates.shifts.0'], events: [{ type: 'learned', clue: 'gate-unwatched' }] });
    expect(step(C(), s, { a: 'deduce', x: 'shifts', y: 'gate-unwatched' }).out).toEqual({ ok: false, reason: 'not-known' });
    expect(step(C(), r.state, { a: 'deduce', x: 'shifts', y: 'gate-unwatched' }).out).toEqual({ ok: false, reason: 'no-connection' });
    expect(step(C(), s, { a: 'deduce', x: 'shifts', y: 'shifts' }).out).toEqual({ ok: false, reason: 'invalid' });
  });

  it('present a clue to a person', () => {
    const s = play(WALKTHROUGH.slice(0, 10));
    expect(step(C(), s, { a: 'present', clue: 'ledger-dates', hs: 'keeper' }).out).toEqual({ ok: false, reason: 'nothing-happens' });
    expect(step(C(), s, { a: 'present', clue: 'map', hs: 'keeper' }).out).toEqual({ ok: false, reason: 'not-known' });
    const r = step(C(), s, { a: 'present', clue: 'gate-unwatched', hs: 'keeper' });
    expect(r.state.items).toEqual(['grapnel', 'chest-key']);
    expect(r.state.goalsDone).toContain('keeper-secret');
    expect(step(C(), r.state, { a: 'present', clue: 'gate-unwatched', hs: 'keeper' }).out).toMatchObject({ ok: true, text: ['hs.yard.keeper.clue.gate-unwatched.1'], events: [] });
  });

  it('travel only to visited map scenes other than the current one', () => {
    const s = initialState(C(), 1);
    expect(step(C(), s, { a: 'travel', scene: 'cellar' }).out).toEqual({ ok: false, reason: 'not-reachable' });
    expect(step(C(), s, { a: 'travel', scene: 'yard' }).out).toEqual({ ok: false, reason: 'not-reachable' });
    const inCellar = play([{ a: 'use', hs: 'stair' }]);
    const back = step(C(), inCellar, { a: 'travel', scene: 'yard' });
    expect(back.state.scene).toBe('yard');
    expect(back.out).toMatchObject({ ok: true, text: ['scene.yard.enter.1'] });
    const inTower = play(WALKTHROUGH.slice(0, 13));
    expect(inTower.scene).toBe('tower');
    expect(step(C(), inTower, { a: 'travel', scene: 'yard' }).out).toEqual({ ok: false, reason: 'not-reachable' });
  });

  it('select an inventory item or nothing', () => {
    const s = play([{ a: 'take', hs: 'rope' }]);
    expect(step(C(), s, { a: 'select', item: 'rope' }).state.selected).toBe('rope');
    expect(step(C(), s, { a: 'select', item: 'hook' }).out).toEqual({ ok: false, reason: 'not-held' });
    const sel = play([{ a: 'select', item: 'rope' }], s);
    expect(step(C(), sel, { a: 'select', item: null }).state.selected).toBeNull();
  });

  it('using up the selected item clears the selection', () => {
    const s = play([...WALKTHROUGH.slice(0, 11), { a: 'select', item: 'grapnel' }, { a: 'useItem', item: 'grapnel', hs: 'window' }]);
    expect(s.selected).toBeNull();
  });

  it('hints: three tiers per active goal, then refused; inactive goals refused', () => {
    const s = play([{ a: 'use', hs: 'stair' }]);
    expect(step(C(), s, { a: 'hint', goal: 'open-chest' }).out).toEqual({ ok: false, reason: 'no-hint' });
    const h3 = play([{ a: 'hint', goal: 'reach-window' }, { a: 'hint', goal: 'reach-window' }, { a: 'hint', goal: 'reach-window' }], s);
    expect(h3.hints).toEqual({ 'reach-window': 3 });
    expect(h3.log.slice(-3)).toEqual(['goal.reach-window.hint.1', 'goal.reach-window.hint.2', 'goal.reach-window.hint.3']);
    expect(step(C(), h3, { a: 'hint', goal: 'reach-window' }).out).toEqual({ ok: false, reason: 'no-hint' });
    expect(available(C(), h3).some((a) => a.a === 'hint')).toBe(false);
  });

  it('hints are available during a dialogue', () => {
    const s = play([{ a: 'use', hs: 'stair' }, { a: 'travel', scene: 'yard' }, { a: 'talk', hs: 'keeper' }]);
    expect(step(C(), s, { a: 'hint', goal: 'reach-window' }).out.ok).toBe(true);
  });

  it('walkthrough reaches the ending; chapters and goals fire in order; afterwards everything is refused', () => {
    const events: string[] = [];
    let s = initialState(C(), 1);
    for (const a of WALKTHROUGH) {
      const r = step(C(), s, a);
      expect(r.out.ok, JSON.stringify(a)).toBe(true);
      if (r.out.ok) for (const e of r.out.events) if (e.type === 'chapter' || e.type === 'goal' || e.type === 'ended') events.push(`${e.type}:${'chapter' in e ? e.chapter : 'goal' in e ? e.goal : e.ending}`);
      s = r.state;
    }
    expect(events).toEqual(['goal:explore', 'chapter:below', 'goal:keeper-secret', 'goal:reach-window', 'goal:open-chest', 'chapter:above', 'ended:map-found']);
    expect(s.ended).toBe('map-found');
    expect(s.chapter).toBe(2);
    expect(s.actions).toBe(WALKTHROUGH.length);
    expect(available(C(), s)).toEqual([]);
    expect(step(C(), s, { a: 'examine', hs: 'chest' }).out).toEqual({ ok: false, reason: 'ended' });
  });

  it('keeps only the last LOG_MAX log entries', () => {
    let s = initialState(C(), 1);
    for (let i = 0; i < 60; i++) s = step(C(), s, { a: 'examine', hs: 'keeper' }).state;
    expect(s.log).toHaveLength(50);
  });

  it('refuses malformed actions', () => {
    const s = initialState(C(), 1);
    for (const junk of [null, {}, { a: 'fly' }, { a: 'take' }, { a: 'take', hs: 3 }, { a: 'take', hs: 'rope', extra: 1 }, { a: 'select' }, { a: 'combine', x: 'a' }, { a: 'take', hs: '' }])
      expect(step(C(), s, junk as unknown as Action).out).toEqual({ ok: false, reason: 'invalid' });
  });

  it('onEnter rules may move on, bounded against loops', () => {
    const loop: Adventure = {
      ...WATCHTOWER,
      scenes: WATCHTOWER.scenes.map((sc) => (sc.id === 'cellar' ? { ...sc, onEnter: [{ then: [{ go: 'yard' }] }] } : sc.id === 'yard' ? { ...sc, onEnter: [{ when: { visited: 'cellar' }, then: [{ go: 'cellar' }] }] } : sc))
    };
    const c = compile(loop);
    const r = step(c, initialState(c, 1), { a: 'use', hs: 'stair' });
    expect(r.out.ok).toBe(true);
    expect(['yard', 'cellar']).toContain(r.state.scene);
  });
});

describe('available', () => {
  it('lists hotspot verbs, item uses, combinations, travel, selection and hints without duplicates', () => {
    const s = play(WALKTHROUGH.slice(0, 7));
    const acts = available(C(), s).map((a) => JSON.stringify(a));
    expect(new Set(acts).size).toBe(acts.length);
    expect(acts).toContain(JSON.stringify({ a: 'examine', hs: 'ledger' }));
    expect(acts).toContain(JSON.stringify({ a: 'combine', x: 'rope', y: 'hook' }));
    expect(acts).toContain(JSON.stringify({ a: 'deduce', x: 'shifts', y: 'ledger-dates' }));
    expect(acts).toContain(JSON.stringify({ a: 'travel', scene: 'yard' }));
    expect(acts).toContain(JSON.stringify({ a: 'useItem', item: 'hook', hs: 'ledger' }));
    expect(acts).toContain(JSON.stringify({ a: 'hint', goal: 'reach-window' }));
    expect(acts).not.toContain(JSON.stringify({ a: 'take', hs: 'hook' }));
    expect(acts).not.toContain(JSON.stringify({ a: 'talk', hs: 'ledger' }));
  });

  it('every available action is accepted structurally (never "invalid")', () => {
    let s = initialState(C(), 1);
    for (const a of WALKTHROUGH) {
      for (const b of available(C(), s)) expect(step(C(), s, b).out).not.toEqual({ ok: false, reason: 'invalid' });
      s = step(C(), s, a).state;
    }
  });
});

describe('textKeys', () => {
  it('lists every key the walkthrough shows, without duplicates', () => {
    const keys = textKeys(WATCHTOWER);
    expect(new Set(keys).size).toBe(keys.length);
    let s = initialState(C(), 1);
    const shown = new Set(s.log);
    for (const a of WALKTHROUGH) {
      const r = step(C(), s, a);
      if (r.out.ok) r.out.text.forEach((k) => shown.add(k));
      s = r.state;
    }
    for (const k of shown) expect(keys).toContain(k);
    expect(keys).toContain('goal.open-chest.hint.3');
    expect(keys).toContain('item.map.desc');
  });
});
