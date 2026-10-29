import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CHALLENGES, DIFFICULTIES, challengeOf, drawRound, type Difficulty } from '../src/challenges';
import { GOAL_IDS, goalOf } from '../src/goals';
import { HABITATS } from '../src/habitats';
import { ADD_LIMIT, MAX_ACTIONS, MAX_WEEK, MODEL_ID, balanced, cloneSim, simulate, total, type Action } from '../src/model';
import { PRESETS } from '../src/presets';
import {
  MODES,
  STARTS,
  actionFits,
  answerFits,
  applyTool,
  backTo,
  backToStart,
  budgetLeft,
  choiceOf,
  commit,
  continueFromHere,
  currentItem,
  currentModel,
  exploreApply,
  exploreRefusal,
  exploreRun,
  flatSketch,
  ghostRun,
  isEcoState,
  isSim,
  markReported,
  modelAnswer,
  modelSeries,
  newGameState,
  next,
  notebookRun,
  questionOf,
  restart,
  runGoalWeeks,
  setDraft,
  settingsOf,
  showWay,
  skip,
  summarize,
  undoLast,
  type Answer,
  type EcoState,
  type ExploreState,
  type GoalState,
  type PredictState
} from '../src/rules';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const predict = (seed = 1, difficulty: Difficulty = 'medium') => newGameState(seed, { ...choiceOf(difficulty, {}), mode: 'predict' }) as PredictState;
const goal = (id: string, difficulty: Difficulty = 'easy') => newGameState(3, { ...choiceOf(difficulty, { mode: 'goal', goal: id }) }) as GoalState;
const explore = (habitat = 'pond', start = 'lively', weather = false) => newGameState(5, choiceOf(undefined, { mode: 'explore', habitat, start, weather })) as ExploreState;
const valid = (s: EcoState) => expect(isEcoState(clone(s))).toBe(true);

describe('new games and settings', () => {
  it('untrusted settings fall back to the defaults', () => {
    expect(choiceOf('nope', { mode: 'x', goal: 3, habitat: null, start: 'zzz', weather: 'yes' })).toEqual({ mode: 'predict', difficulty: 'medium', goal: 'save-pondweed', habitat: 'pond', start: 'lively', weather: false });
    expect(choiceOf(undefined, undefined).mode).toBe('predict');
  });

  it('settingsOf round-trips every combination of settings', () => {
    for (const mode of MODES)
      for (const difficulty of DIFFICULTIES)
        for (const g of GOAL_IDS)
          for (const habitat of HABITATS)
            for (const start of STARTS)
              for (const weather of [false, true]) {
                const s = newGameState(9, choiceOf(difficulty, { mode, goal: g, habitat, start, weather }));
                valid(s);
                const back = settingsOf(s);
                const again = newGameState(9, choiceOf(back.difficulty ?? difficulty, back));
                expect(again).toEqual(s);
              }
  });

  it('a predict round: 4 distinct challenges alternating pond and meadow, seeded', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        const r = drawRound(seed, d);
        expect(r).toEqual(drawRound(seed, d));
        expect(new Set(r.map((x) => x.challenge)).size).toBe(4);
        const habs = r.map((x) => challengeOf(x.challenge)!.habitat);
        expect(habs[0]).not.toBe(habs[1]);
        expect(habs[0]).toBe(habs[2]);
        expect(habs[1]).toBe(habs[3]);
        for (const x of r) expect(x.question).toBeLessThan(challengeOf(x.challenge)!.questions[d].length);
      })
    );
    const seen = new Set<string>();
    for (let s = 0; s < 200; s++) for (const x of drawRound(s, 'easy')) seen.add(`${x.challenge}:${x.question}`);
    expect(seen.size).toBe(CHALLENGES.reduce((n, c) => n + c.questions.easy.length, 0));
  });

  it('restart gives the same round, goal or notebook from its start', () => {
    const p = predict(4);
    expect(restart(skip(p))).toEqual(p);
    const g = goal('save-pondweed');
    expect(restart(applyTool(g, 'buffer'))).toEqual(g);
    const e = explore();
    expect(restart(exploreRun(e, 4).state)).toEqual(e);
  });
});

describe('predict', () => {
  const answerFor = (s: PredictState): Answer => {
    const q = questionOf(s, currentItem(s)!);
    if (q.kind === 'level') return { kind: 'level', band: 2 };
    if (q.kind === 'shape') return { kind: 'shape', option: 1 };
    return { kind: 'sketch', points: [0, 1000, 2000, 3000, 4000, 5000] };
  };

  it('draft, commit (marks stored), next … summary; commits are no-ops in review', () => {
    for (const d of DIFFICULTIES) {
      let s = predict(11, d);
      for (let k = 0; k < 4; k++) {
        const a = answerFor(s);
        s = setDraft(s, a);
        expect(currentItem(s)!.draft).toEqual(a);
        valid(s);
        expect(next(s)).toBe(s); // not run yet
        s = commit(s);
        const item = currentItem(s)!;
        expect(item.ran).toBe(true);
        expect(item.answer).toEqual(a);
        expect(item.marks).not.toBeNull();
        expect(commit(s)).toBe(s);
        expect(skip(s)).toBe(s);
        expect(setDraft(s, a)).toBe(s);
        valid(s);
        s = next(s);
        valid(s);
      }
      expect(s.index).toBe(4);
      expect(next(s)).toBe(s);
      s = markReported(s);
      expect(markReported(s)).toBe(s);
      valid(s);
      const sum = summarize(s);
      expect(sum.answered).toBe(4);
      expect(sum.matched + sum.close + sum.partly + sum.other).toBe(4);
    }
  });

  it('the marks of a commit are those of the model answer', () => {
    // A challenge whose level answer is "higher" (fish-stocked, easy) scores ●●● for higher and ○○○ for lower.
    const base = predict(1, 'easy');
    const s: PredictState = { ...base, items: [{ challenge: 'fish-stocked', question: 0, draft: null, answer: null, marks: null, ran: false }, ...base.items.filter((i) => i.challenge !== 'fish-stocked').slice(0, 3)] };
    expect(currentItem(commit(setDraft(s, { kind: 'level', band: 2 })))!.marks).toBe(3);
    expect(currentItem(commit(setDraft(s, { kind: 'level', band: 1 })))!.marks).toBe(1);
    expect(currentItem(commit(setDraft(s, { kind: 'level', band: 0 })))!.marks).toBe(0);
    // A level question cannot be committed without a draft.
    expect(commit(s)).toBe(s);
    const c = challengeOf('fish-stocked')!;
    const q = c.questions.easy[0]!;
    expect(modelAnswer(q, modelSeries(c, q))).toEqual({ band: 2 });
  });

  it('an untouched sketch commits the flat line at the value before the change', () => {
    const base = predict(1, 'hard');
    const s: PredictState = { ...base, items: [{ challenge: 'fleas-arrive', question: 0, draft: null, answer: null, marks: null, ran: false }, ...base.items.filter((i) => i.challenge !== 'fleas-arrive').slice(0, 3)] };
    const c = challengeOf('fleas-arrive')!;
    const after = commit(s);
    expect(currentItem(after)!.answer).toEqual({ kind: 'sketch', points: flatSketch(c, c.questions.hard[0]!) });
    // The algae fall to a quarter: a flat line far above the model scores ○○○ or ●○○.
    expect(currentItem(after)!.marks).toBeLessThanOrEqual(1);
  });

  it('skips are not counted; the summary remark follows the rules', () => {
    let s = predict(2);
    for (let k = 0; k < 4; k++) s = next(skip(s));
    const sum = summarize(s);
    expect(sum).toMatchObject({ skipped: 4, answered: 0, matched: 0 });
    expect(['balancing', 'reinforcing', 'chains']).toContain(sum.remark);
    expect(currentItem(skip(predict(2)))!.marks).toBeNull();
  });

  it('answerFits rejects malformed answers', () => {
    const lvl = { kind: 'level', species: 'algae', week: 3, expect: 2 } as const;
    expect(answerFits(lvl, { kind: 'level', band: 1 })).toBe(true);
    expect(answerFits(lvl, { kind: 'level', band: 3 })).toBe(false);
    expect(answerFits(lvl, { kind: 'level', band: 1, x: 1 })).toBe(false);
    expect(answerFits(lvl, { kind: 'shape', option: 0 })).toBe(false);
    const sk = { kind: 'sketch', species: 'algae', max: 1000, expect: 'rises' } as const;
    expect(answerFits(sk, { kind: 'sketch', points: [0, 0, 0, 0, 0, 1000] })).toBe(true);
    expect(answerFits(sk, { kind: 'sketch', points: [0, 0, 0, 0, 0, 1001] })).toBe(false);
    expect(answerFits(sk, { kind: 'sketch', points: [0, 0, 0, 0, 0] })).toBe(false);
    expect(answerFits(sk, { kind: 'sketch', points: [0, 0, 0, 0, 0, 0.5] })).toBe(false);
    const sh = { kind: 'shape', species: 'algae', options: ['rises', 'falls'], expect: 'rises' } as const;
    expect(answerFits(sh, { kind: 'shape', option: 2 })).toBe(false);
    expect(answerFits(sh, null)).toBe(false);
  });
});

describe('goal', () => {
  it('applying a tool, running, failing in the week the line is crossed, undo refunds and returns to its week', () => {
    let s = goal('save-pondweed', 'hard');
    expect(budgetLeft(s)).toBe(4);
    expect(applyTool(s, 'spray')).toBe(s); // not a tool of this goal
    s = runGoalWeeks(s, 26).state;
    expect(s.notebook.week).toBe(26);
    expect(s.outcome).toBeNull();
    s = applyTool(s, 'buffer'); // too late (week 26)
    expect(budgetLeft(s)).toBe(3);
    valid(s);
    s = runGoalWeeks(s, 104).state;
    expect(s.outcome?.kind).toBe('failed');
    expect(s.notebook.week).toBe(s.outcome!.week);
    valid(s);
    expect(applyTool(s, 'ditch')).toBe(s); // blocked after a failure
    s = undoLast(s);
    expect(s.outcome).toBeNull();
    expect(s.notebook.week).toBe(26);
    expect(budgetLeft(s)).toBe(4);
    s = backToStart(s);
    expect(s.notebook.week).toBe(0);
    s = applyTool(s, 'buffer');
    s = runGoalWeeks(s, 'settle').state;
    for (let k = 0; k < 20 && !s.outcome; k++) s = runGoalWeeks(s, 26).state;
    expect(s.outcome).toEqual({ kind: 'reached', week: 104 });
    s = markReported(s);
    valid(s);
    expect(undoLast(s)).toBe(s);
    expect(runGoalWeeks(s, 4).state).toBe(s);
  });

  it('the budget limits changes on medium and hard (but a save from easy stays valid)', () => {
    let s = goal('protect-flowers', 'hard');
    for (let k = 0; k < 6; k++) s = applyTool(s, 'ladybirds');
    expect(s.notebook.log.length).toBe(4);
    let e = goal('protect-flowers', 'easy');
    for (let k = 0; k < 6; k++) e = applyTool(e, 'ladybirds');
    expect(e.notebook.log.length).toBe(6);
    valid({ ...e, difficulty: 'hard' });
  });

  it('back to a logged change removes it and every later one', () => {
    let s = goal('clear-pond');
    s = applyTool(s, 'ditch');
    s = runGoalWeeks(s, 4).state;
    s = applyTool(s, 'dredge');
    s = runGoalWeeks(s, 4).state;
    s = applyTool(s, 'plant');
    const b = backTo(s, 1);
    expect(b.notebook.log.length).toBe(1);
    expect(b.notebook.week).toBe(4);
    expect(backTo(s, 7)).toBe(s);
    valid(b);
  });

  it('show me a way ends the goal as shown; a streak goal is reached when the streak completes', () => {
    const s = showWay(runGoalWeeks(goal('clear-pond'), 10).state);
    expect(s.outcome).toEqual({ kind: 'shown', week: 10 });
    expect(showWay(s)).toBe(s);
    let r = goal('clear-pond');
    for (const t of ['ditch', 'dredge', 'plant', 'fish-out']) r = applyTool(r, t);
    for (let k = 0; k < 10 && !r.outcome; k++) r = runGoalWeeks(r, 26).state;
    expect(r.outcome).toEqual({ kind: 'reached', week: 53 });
    expect(r.notebook.week).toBe(53);
  });

  it('the cached notebook run equals a fresh replay', () => {
    let s = goal('save-pondweed');
    s = runGoalWeeks(s, 7).state;
    s = applyTool(s, 'net');
    s = runGoalWeeks(s, 9).state;
    const cached = notebookRun(s).samples.slice(0, 17);
    const g = goalOf('save-pondweed')!;
    const fresh = simulate(PRESETS[g.preset].sim, 'pond', [...g.script, ...s.notebook.log], 16);
    expect(cached).toEqual(fresh.samples);
    expect(ghostRun(s, [], 16).samples).toEqual(simulate(PRESETS[g.preset].sim, 'pond', g.script, 16).samples);
  });
});

describe('explore', () => {
  it('applies changes at the current week, runs, settles, and continues from a snapshot with the balance kept', () => {
    let s = explore('meadow', 'lively');
    s = exploreApply(s, { week: 0, kind: 'spray' });
    expect(exploreApply(s, { week: 3, kind: 'spray' })).toBe(s); // not the current week
    expect(exploreApply(s, { week: 0, kind: 'dredge' })).toBe(s); // a pond action
    s = exploreRun(s, 26).state;
    expect(s.notebook.week).toBe(26);
    const settled = exploreRun(s, 'settle');
    expect(settled.state.notebook.week).toBeGreaterThan(26);
    s = settled.state;
    valid(s);
    const before = notebookRun(s).sim;
    const c = continueFromHere(s);
    expect(c.notebook.week).toBe(0);
    expect(c.notebook.log).toEqual([]);
    expect('sim' in c.notebook.start).toBe(true);
    valid(c);
    const snap = (c.notebook.start as { sim: typeof before }).sim;
    expect(total(snap)).toBe(total(before));
    expect(balanced(snap)).toBe(true);
    // Running on from the snapshot equals running on from the old notebook.
    const a = exploreRun(c, 10).state;
    const b = exploreRun(s, 10).state;
    expect(notebookRun(a).sim.b).toEqual(notebookRun(b).sim.b);
  });

  it('stops at week 520 and at 300 changes', () => {
    let s = explore('pond', 'bare');
    s = exploreRun(s, MAX_WEEK + 50).state;
    expect(s.notebook.week).toBe(MAX_WEEK);
    expect(exploreRun(s, 1).state).toBe(s);
    expect(exploreApply(s, { week: MAX_WEEK, kind: 'dredge' })).toBe(s);
    let t = explore('pond', 'simple');
    for (let k = 0; k < MAX_ACTIONS + 5; k++) t = exploreApply(t, { week: 0, kind: 'set', cond: 0, level: k % 3 });
    expect(t.notebook.log.length).toBe(MAX_ACTIONS);
    valid(t);
  });

  it('an "add" that would take the total above ADD_LIMIT is refused; smaller ones still fit', () => {
    const sim = cloneSim(PRESETS['pond.lively'].sim);
    const extra = ADD_LIMIT - 10_000 - total(sim);
    sim.d += extra;
    sim.imp += extra;
    const s: ExploreState = { ...explore(), notebook: { ...explore().notebook, start: { sim } } };
    valid(s);
    expect(exploreApply(s, { week: 0, kind: 'add', species: 'minnows' })).toBe(s); // + 20,000 u
    const t = exploreApply(s, { week: 0, kind: 'add', species: 'algae' }); // + 5,000 u
    expect(t.notebook.log).toHaveLength(1);
    expect(exploreApply(t, { week: 0, kind: 'add', species: 'algae' }).notebook.log).toHaveLength(2); // exactly 10,000,000
    expect(exploreApply(exploreApply(t, { week: 0, kind: 'add', species: 'algae' }), { week: 0, kind: 'add', species: 'algae' }).notebook.log).toHaveLength(2);
    expect(exploreApply(t, { week: 0, kind: 'remove', species: 'algae', share: 50 }).notebook.log).toHaveLength(2); // other changes are not limited
  });

  it('exploreRefusal names why a change is refused, and exploreApply refuses exactly then', () => {
    const sim = cloneSim(PRESETS['pond.lively'].sim);
    const extra = ADD_LIMIT - 10_000 - total(sim);
    sim.d += extra;
    sim.imp += extra;
    const near: ExploreState = { ...explore(), notebook: { ...explore().notebook, start: { sim } } };
    const add = (species: string): Action => ({ week: 0, kind: 'add', species });
    expect(exploreRefusal(near, add('minnows'))).toBe('limit');
    expect(exploreRefusal(near, add('algae'))).toBeNull();
    expect(exploreRefusal(near, { week: 0, kind: 'spray' })).toBe('invalid');
    expect(exploreRefusal(near, { week: 2, kind: 'dredge' })).toBe('invalid');
    let many = explore('pond', 'simple');
    for (let k = 0; k < MAX_ACTIONS; k++) many = exploreApply(many, { week: 0, kind: 'set', cond: 0, level: k % 3 });
    expect(exploreRefusal(many, add('pike'))).toBe('changes');
    const late = exploreRun(explore('pond', 'bare'), MAX_WEEK).state;
    expect(exploreRefusal(late, { week: MAX_WEEK, kind: 'dredge' })).toBe('full');
    for (const s of [near, many, late, explore()]) {
      for (const a of [add('minnows'), add('algae'), { week: s.notebook.week, kind: 'dredge' } as Action]) {
        expect(exploreApply(s, a) === s).toBe(exploreRefusal(s, a) !== null);
      }
    }
  });

  it('undo and back-to work in explore too', () => {
    let s = explore();
    s = exploreApply(s, { week: 0, kind: 'add', species: 'pike' });
    s = exploreRun(s, 5).state;
    s = exploreApply(s, { week: 5, kind: 'remove', species: 'minnows', share: 50 });
    expect(undoLast(s).notebook.log.length).toBe(1);
    expect(backTo(s, 0).notebook).toMatchObject({ log: [], week: 0 });
    expect(undoLast(explore())).toEqual(explore());
  });

  it('random action sequences never throw and keep the state valid', () => {
    const step = fc.oneof(
      fc.record({ t: fc.constant('run'), n: fc.integer({ min: 1, max: 40 }) }),
      fc.record({ t: fc.constant('settle') }),
      fc.record({ t: fc.constant('undo') }),
      fc.record({ t: fc.constant('back'), i: fc.nat(5) }),
      fc.record({ t: fc.constant('continue') }),
      fc.record({ t: fc.constant('act'), a: fc.record({ kind: fc.constantFrom('add', 'remove', 'treat-algae', 'net-algae', 'dredge', 'spray', 'mow', 'set', 'bogus'), species: fc.constantFrom('algae', 'pike', 'foxes', 'worms', 'x'), share: fc.constantFrom(50, 90, 100, 7), cuttings: fc.constantFrom('remove', 'leave'), cond: fc.nat(3), level: fc.nat(5) }) })
    );
    fc.assert(
      fc.property(fc.constantFrom(...HABITATS), fc.constantFrom(...STARTS), fc.boolean(), fc.array(step, { maxLength: 12 }), (habitat, start, weather, steps) => {
        let s = explore(habitat, start, weather);
        for (const st of steps) {
          if (st.t === 'run') s = exploreRun(s, st.n).state;
          else if (st.t === 'settle') s = exploreRun(s, 'settle').state;
          else if (st.t === 'undo') s = undoLast(s);
          else if (st.t === 'back') s = backTo(s, st.i);
          else if (st.t === 'continue') s = continueFromHere(s);
          else {
            const { kind, species, share, cuttings, cond, level } = st.a;
            const a = { week: s.notebook.week, kind, ...(kind === 'add' || kind === 'remove' ? { species } : {}), ...(kind === 'remove' ? { share } : {}), ...(kind === 'mow' ? { cuttings } : {}), ...(kind === 'set' ? { cond, level } : {}) } as Action;
            const t = exploreApply(s, a);
            expect(t !== s).toBe(actionFits(habitat, a, s.notebook.week));
            s = t;
          }
          valid(s);
        }
      }),
      { numRuns: 40 }
    );
  });
});

describe('isEcoState', () => {
  it('never throws on anything', () => {
    fc.assert(fc.property(fc.anything(), (x) => {
      expect(typeof isEcoState(x)).toBe('boolean');
    }), { numRuns: 500 });
  });

  it('rejects tampered states', () => {
    const p = predict();
    const bad: unknown[] = [
      { ...p, v: 2 },
      { ...p, model: 'eco-9' },
      { ...p, seed: -1 },
      { ...p, items: p.items.slice(0, 3) },
      { ...p, items: [p.items[0], p.items[0], p.items[2], p.items[3]] },
      { ...p, items: [{ ...p.items[0], challenge: 'nope' }, ...p.items.slice(1)] },
      { ...p, items: [{ ...p.items[0], marks: 3 }, ...p.items.slice(1)] },
      { ...p, items: [{ ...p.items[0], ran: true }, ...p.items.slice(1)] },
      { ...p, index: 5 },
      { ...p, index: 1 }, // item 0 not run
      { ...p, reported: true },
      { ...p, extra: 1 }
    ];
    const g = runGoalWeeks(applyTool(goal('save-pondweed'), 'buffer'), 4).state;
    const nb = g.notebook;
    bad.push(
      { ...g, goal: 'nope' },
      { ...g, notebook: { ...nb, log: [{ week: 0, kind: 'spray' }] } },
      { ...g, notebook: { ...nb, log: [{ week: 9, kind: 'set', cond: 1, level: 1 }] } }, // after the current week
      { ...g, notebook: { ...nb, start: { preset: 'pond.green' } } },
      { ...g, notebook: { ...nb, week: 999 } },
      { ...g, outcome: { kind: 'won', week: 3 } },
      { ...g, reported: true },
      { ...g, outcome: { kind: 'failed', week: 3 }, reported: true }
    );
    const e = continueFromHere(exploreRun(explore('meadow'), 3).state);
    const sim = (e.notebook.start as unknown as { sim: Record<string, unknown> }).sim;
    const withSim = (patch: Record<string, unknown>) => ({ ...e, notebook: { ...e.notebook, start: { sim: { ...sim, ...patch } } } });
    bad.push(
      withSim({ n: -1 }),
      withSim({ n: (sim.n as number) + 1 }), // broken balance
      withSim({ week: 3 }),
      withSim({ b: (sim.b as number[]).slice(1) }),
      withSim({ j: (sim.j as number[][]).map((r) => [...r, 0]) }),
      withSim({ cond: [0, 9] }),
      withSim({ seen: (sim.seen as number[]).map(() => 2) }),
      withSim({ n: 0.5 }),
      { ...e, habitat: 'pond' },
      { ...e, notebook: { ...e.notebook, log: [{ week: 0, kind: 'dredge' }] } },
      { ...e, notebook: { ...e.notebook, log: [{ week: 2, kind: 'spray' }, { week: 1, kind: 'spray' }], week: 3 } },
      { ...e, notebook: { ...e.notebook, log: new Array(MAX_ACTIONS + 1).fill({ week: 0, kind: 'spray' }) } }
    );
    expect(isEcoState(e)).toBe(true);
    expect(isSim(sim, 'meadow')).toBe(true);
    expect(isSim(sim, 'pond')).toBe(false);
    for (const [k, b] of bad.entries()) expect(isEcoState(b), `case ${k}`).toBe(false);
  });

  it('accepts every state reached by the transitions and its JSON round trip', () => {
    const states: EcoState[] = [predict(), goal('bring-back-clover'), explore('meadow', 'bare', true)];
    for (const s of states) valid(s);
  });

  it('accepts saves of the earlier model eco-1; currentModel moves them to the current one (§ 14)', () => {
    expect(MODEL_ID).toBe('eco-2');
    const p = predict();
    const g = runGoalWeeks(applyTool(goal('bring-back-clover'), 'rabbits-90'), 30).state;
    const e = exploreRun(exploreApply(explore('meadow'), { week: 0, kind: 'remove', species: 'rabbits', share: 90 }), 26).state;
    expect([g.notebook.log.length, g.notebook.week, e.notebook.log.length, e.notebook.week]).toEqual([1, 30, 1, 26]);
    for (const s of [p, g, e]) {
      const old = { ...clone(s), model: 'eco-1' } as EcoState;
      valid(old);
      const up = currentModel(old);
      expect(up.state).toEqual(s);
      // Notebooks are replayed with the current model; predict items keep their stored marks.
      expect(up.recalculated).toBe(s.mode !== 'predict');
      expect(currentModel(s)).toEqual({ state: s, recalculated: false });
      expect(currentModel(s).state).toBe(s);
    }
  });
});
