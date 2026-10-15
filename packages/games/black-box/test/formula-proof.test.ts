import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { MAX_FORMULA_LENGTH, evaluateFormula, parseFormula } from '../src/formula';
import {
  DIFFICULTIES,
  FAMILIES,
  FAMILY_IDS,
  GATES,
  cancelTest,
  checkFormula,
  createInitialState,
  enumerateDomain,
  evaluate,
  experimentCount,
  familyParams,
  formulaDialect,
  formulaOf,
  formulaSupported,
  isBlackBoxState,
  isProofMode,
  lastFormulaOf,
  otherBits,
  phaseOf,
  proofModeOf,
  ruleOf,
  runExperiment,
  sameNumbers,
  setDraftValue,
  setFormula,
  setPrediction,
  setProofMode,
  startTest,
  submitFormula,
  submitTest,
  type BlackBoxState,
  type FamilyId,
  type Rule
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** A formula in the player syntax, written directly from each family's definition. */
function familyFormula(rule: Rule): string {
  const p = (i: number) => rule.params[i]!;
  const gate = (i: number) => GATES[p(i)]!.toLowerCase();
  switch (rule.family) {
    case 'linear':
      return `${p(0)}*x + ${p(1)}`;
    case 'square':
      return `x^2 + ${p(0)}`;
    case 'mod':
      return `x mod ${p(0)}`;
    case 'step':
      return `x >= ${p(0)} ? ${p(2)} : ${p(1)}`;
    case 'parity':
      return `x mod 2 == 0 ? x / 2 : ${p(0)}*x + ${p(1)}`;
    case 'digitsum':
      return `${p(0)}*S(x) + ${p(1)}`;
    case 'affinemod':
      return `(${p(0)}*x + ${p(1)}) % ${p(2)}`;
    case 'pairselect':
      return `${['max(x, y)', 'min(x, y)', 'abs(x - y)'][p(0)]} + ${p(1)}`;
    case 'pairproduct':
      return `x*y + ${p(0)}*x + ${p(1)}*y + ${p(2)}`;
    case 'gate':
      return `b${p(1) + 1} ${gate(0)} b${p(2) + 1}`;
    case 'gates2': {
      const [i, j] = otherBits(p(2));
      return `(b${i + 1} ${gate(0)} b${j + 1}) ${gate(1)} b${p(2) + 1}`;
    }
    case 'majority': {
      const bits = [0, 1, 2, 3].filter((i) => i !== p(0)).map((i) => `b${i + 1}`);
      return `${p(1) === 1 ? 'not ' : ''}maj(${bits.join(', ')})`;
    }
    default:
      return '';
  }
}

const FORMULA_FAMILIES = (): FamilyId[] => FAMILY_IDS.filter((id) => FAMILIES[id].input.kind !== 'list');

/** A formula that is wrong on every input. */
const perturbed = (rule: Rule) => (FAMILIES[rule.family].output === 'bool' ? `not (${familyFormula(rule)})` : `(${familyFormula(rule)}) + 1`);

function stateWith(family: FamilyId, seed = 1): BlackBoxState {
  for (let s = seed; s < seed + 5000; s++) {
    for (const d of DIFFICULTIES) {
      const state = createInitialState(s, d);
      if (state.family === family) return state;
    }
  }
  throw new Error(`no seed for ${family}`);
}

const testing = (family: FamilyId, seed = 1) => setProofMode(startTest(stateWith(family, seed)), 'formula');
const withFormula = (s: BlackBoxState, text: string) => setFormula(s, text);

describe('formula dialects', () => {
  it('match the input domains; list rules have none', () => {
    expect(formulaDialect({ kind: 'int', min: 0, max: 20 })).toEqual({ logic: false, vars: ['x'] });
    expect(formulaDialect({ kind: 'pair', min: 0, max: 9 })).toEqual({ logic: false, vars: ['x', 'y'] });
    expect(formulaDialect({ kind: 'bits', count: 3 })).toEqual({ logic: true, vars: ['b1', 'b2', 'b3'] });
    expect(formulaDialect({ kind: 'list', length: 5, min: 0, max: 9 })).toBeNull();
    expect(FAMILY_IDS.filter((id) => !formulaSupported({ family: id }))).toEqual(['filterref', 'filterconst', 'sorttake']);
  });
});

describe('checkFormula', () => {
  it('accepts the defining formula of every parameterization of every formula family', () => {
    for (const family of FORMULA_FAMILIES()) {
      for (const params of familyParams(family)) {
        const rule = { family, params };
        expect(checkFormula(rule, familyFormula(rule)), `${family} ${params.join(',')}`).toEqual({ kind: 'correct' });
      }
    }
  }, 120_000);

  it('rejects a perturbed formula with a real counterexample', () => {
    for (const family of FORMULA_FAMILIES()) {
      for (const params of familyParams(family)) {
        const rule = { family, params };
        const check = checkFormula(rule, perturbed(rule));
        if (check.kind !== 'wrong') throw new Error(`${family} ${params.join(',')}: ${check.kind}`);
        const truth = evaluate(rule, check.input) as number;
        // No logged inputs: the counterexample is the first input of the domain.
        expect(check.input).toEqual(enumerateDomain(FAMILIES[family].input)[0]);
        expect(check.got).toBe(FAMILIES[family].output === 'bool' ? 1 - truth : truth + 1);
      }
    }
  }, 120_000);

  it('accepts another parameterization exactly when it is equivalent on the whole domain', () => {
    fc.assert(
      fc.property(fc.constantFrom(...FORMULA_FAMILIES()), fc.nat(), fc.nat(), (family, i, j) => {
        const all = familyParams(family);
        const rule = { family, params: all[i % all.length]! };
        const alt = { family, params: all[j % all.length]! };
        const domain = enumerateDomain(FAMILIES[family].input);
        const equivalent = domain.every((input) => evaluate(rule, input) === evaluate(alt, input));
        const logged = domain.filter((_, k) => k % 3 === 0);
        const check = checkFormula(rule, familyFormula(alt), logged);
        if (equivalent) {
          expect(check).toEqual({ kind: 'correct' });
        } else {
          if (check.kind !== 'wrong') throw new Error('expected wrong');
          expect(evaluate(alt, check.input)).toBe(check.got);
          expect(evaluate(rule, check.input)).not.toBe(check.got);
          // An unlogged counterexample is preferred whenever one exists.
          const unlogged = domain.filter((input, k) => k % 3 !== 0 && evaluate(rule, input) !== evaluate(alt, input));
          expect(unlogged.length === 0 || unlogged.some((input) => sameNumbers(input, check.input))).toBe(true);
          if (unlogged.length > 0) expect(check.input).toEqual(unlogged[0]);
        }
      }),
      { numRuns: 400 }
    );
  });

  it('accepts any equivalent formula, not just the canonical one', () => {
    const rule: Rule = { family: 'linear', params: [3, -2] };
    for (const text of ['3x - 2', 'x + x + x - 2', '-(2 - 3*x)', 'x * 3 + -2', '(6*x - 4) / 2', 'x >= 0 ? 3x - 2 : 99']) {
      expect(checkFormula(rule, text), text).toEqual({ kind: 'correct' });
    }
    expect(checkFormula({ family: 'gate', params: [0, 0, 1] }, 'not (not b1 or not b2)')).toEqual({ kind: 'correct' });
    expect(checkFormula({ family: 'gate', params: [2, 1, 3] }, '(b2 or b4) and not (b2 and b4)')).toEqual({ kind: 'correct' });
    expect(checkFormula({ family: 'square', params: [0] }, 'x²')).toEqual({ kind: 'correct' });
    // Only the domain matters: x is never above 20 in this family.
    expect(checkFormula({ family: 'step', params: [5, 1, 7] }, 'x > 4 and x < 100 ? 7 : 1')).toEqual({ kind: 'correct' });
  });

  it('prefers a counterexample that is not logged yet', () => {
    const rule: Rule = { family: 'square', params: [1] };
    const text = 'x == 3 or x == 5 ? 0 : x^2 + 1';
    expect(checkFormula(rule, text)).toEqual({ kind: 'wrong', input: [3], got: 0 });
    expect(checkFormula(rule, text, [[3]])).toEqual({ kind: 'wrong', input: [5], got: 0 });
    expect(checkFormula(rule, text, [[3], [5]])).toEqual({ kind: 'wrong', input: [3], got: 0 });
    expect(checkFormula(rule, text, [[5], [3]])).toEqual({ kind: 'wrong', input: [3], got: 0 });
  });

  it('treats an undefined value as a counterexample', () => {
    const rule: Rule = { family: 'linear', params: [2, 1] };
    expect(checkFormula(rule, '2x + 1 + 0 / (x - 4)')).toEqual({ kind: 'wrong', input: [4], got: null });
    expect(checkFormula({ family: 'pairproduct', params: [0, 0, 0] }, 'x*y + 0 * (100 mod (x - y))')).toEqual({ kind: 'wrong', input: [0, 0], got: null });
  });

  it('reports parse errors and unsupported domains without evaluating', () => {
    expect(checkFormula({ family: 'linear', params: [2, 1] }, '2x +')).toEqual({ kind: 'error', error: { code: 'end', pos: 5, text: '', n: 0 } });
    expect(checkFormula({ family: 'linear', params: [2, 1] }, '2y')).toEqual({ kind: 'error', error: { code: 'name', pos: 2, text: 'y', n: 0 } });
    expect(checkFormula({ family: 'gate', params: [0, 0, 1] }, 'x')).toMatchObject({ kind: 'error' });
    expect(checkFormula({ family: 'sorttake', params: [0, 2] }, 'x')).toEqual({ kind: 'unsupported' });
  });
});

describe('formula proofs in the game state', () => {
  it('starts with predictions, an empty formula and no result', () => {
    const s = createInitialState(3);
    expect(s.proofMode).toBe('predict');
    expect(s.formula).toBe('');
    expect(s.lastFormula).toBeNull();
    expect(isProofMode('formula')).toBe(true);
    expect(isProofMode('guess')).toBe(false);
  });

  it('chooses the proof mode only on the test step and only where formulas exist', () => {
    const s = stateWith('linear');
    expect(setProofMode(s, 'formula')).toBe(s);
    const open = startTest(s);
    const f = setProofMode(open, 'formula');
    expect(proofModeOf(f)).toBe('formula');
    expect(setProofMode(f, 'formula')).toBe(f);
    expect(proofModeOf(setProofMode(f, 'predict'))).toBe('predict');
    expect(setProofMode(open, 'guess' as never)).toBe(open);
    const list = startTest(stateWith('sorttake'));
    expect(setProofMode(list, 'formula')).toBe(list);
    expect(proofModeOf({ ...list, proofMode: 'formula' })).toBe('predict');
    // The choice persists across tests.
    expect(proofModeOf(startTest(cancelTest(f)))).toBe('formula');
  });

  it('stores the typed text up to the length limit', () => {
    const s = testing('linear');
    const a = setFormula(s, '2x + 1');
    expect(formulaOf(a)).toBe('2x + 1');
    expect(setFormula(a, '2x + 1')).toBe(a);
    expect(setFormula(a, 'x'.repeat(MAX_FORMULA_LENGTH)).formula).toHaveLength(MAX_FORMULA_LENGTH);
    expect(setFormula(a, 'x'.repeat(MAX_FORMULA_LENGTH + 1))).toBe(a);
    expect(setFormula(a, 5 as never)).toBe(a);
    // Typing is allowed while experimenting (the text is kept), but not after solving.
    const exp = stateWith('linear');
    expect(formulaOf(setFormula(exp, 'x'))).toBe('x');
    expect(setFormula({ ...exp, solved: true }, 'x').formula).toBe('');
  });

  it('solves with a correct formula and counts it as a hypothesis test', () => {
    const s = withFormula(testing('linear'), '');
    const text = familyFormula(ruleOf(s));
    const done = submitFormula(withFormula(s, text));
    expect(done.solved).toBe(true);
    expect(phaseOf(done)).toBe('solved');
    expect(done.attempts).toBe(1);
    expect(done.challenge).toBeNull();
    expect(done.lastAttempt).toBeNull();
    expect(done.lastFormula).toEqual({ text, correct: true, input: null });
    expect(done.log).toEqual(s.log);
    expect(isBlackBoxState(clone(done))).toBe(true);
    expect(submitFormula(done)).toBe(done);
    expect(setFormula(done, 'x')).toBe(done);
  });

  it('ignores parse errors, an unchosen mode and other phases', () => {
    const s = testing('linear');
    expect(submitFormula(withFormula(s, '2x +'))).toEqual(withFormula(s, '2x +'));
    expect(submitFormula(withFormula(s, ''))).toEqual(withFormula(s, ''));
    const predict = setFormula(startTest(stateWith('linear')), familyFormula(ruleOf(s)));
    expect(submitFormula(predict)).toBe(predict);
    const experimenting = setFormula(stateWith('linear'), familyFormula(ruleOf(s)));
    expect(submitFormula(experimenting)).toBe(experimenting);
  });

  it('reveals one counterexample for a wrong formula and keeps the test open', () => {
    let s = runExperiment(stateWith('linear'));
    s = setProofMode(startTest(s), 'formula');
    const wrong = perturbed(ruleOf(s));
    const next = submitFormula(withFormula(s, wrong));
    expect(next.attempts).toBe(1);
    expect(next.solved).toBe(false);
    expect(phaseOf(next)).toBe('testing');
    const result = lastFormulaOf(next)!;
    expect(result.correct).toBe(false);
    expect(result.text).toBe(wrong);
    // [0] is logged already, so the first unlogged input of the domain is revealed.
    expect(s.log.map((e) => e.input)).toEqual([[0]]);
    expect(result.input).toEqual([1]);
    expect(next.log).toEqual([...s.log, { input: [1], source: 'test' }]);
    expect(experimentCount(next)).toBe(1);
    expect(isBlackBoxState(clone(next))).toBe(true);
    // Checking the very same formula again is not counted.
    expect(submitFormula(next)).toBe(next);
    // A changed formula is checked again.
    const again = submitFormula(withFormula(next, `${wrong} + 0`));
    expect(again.attempts).toBe(2);
    expect(again.lastFormula!.input).toEqual([2]);
    // A correct formula afterwards solves it.
    const solved = submitFormula(withFormula(again, familyFormula(ruleOf(s))));
    expect(solved.solved).toBe(true);
    expect(solved.attempts).toBe(3);
    expect(isBlackBoxState(clone(solved))).toBe(true);
  });

  it('keeps the open challenge unless the counterexample is one of its inputs', () => {
    const s = testing('linear', 4);
    const challenge = s.challenge!;
    const rule = ruleOf(s);
    const outside = enumerateDomain(FAMILIES.linear.input).find((input) => !challenge.inputs.some((c) => sameNumbers(c, input)))!;
    const missOutside = `x == ${outside[0]} ? ${(evaluate(rule, outside) as number) + 1} : ${familyFormula(rule)}`;
    const a = submitFormula(withFormula(s, missOutside));
    expect(a.challenge).toBe(challenge);
    expect(a.rng).toBe(s.rng);
    expect(a.lastFormula!.input).toEqual(outside);

    const inside = challenge.inputs[0]!;
    const missInside = `x == ${inside[0]} ? ${(evaluate(rule, inside) as number) + 1} : ${familyFormula(rule)}`;
    const b = submitFormula(withFormula(setPrediction(s, 1, 5), missInside));
    expect(b.lastFormula!.input).toEqual(inside);
    expect(b.rng).not.toBe(s.rng);
    expect(b.challenge!.inputs.some((c) => sameNumbers(c, inside))).toBe(false);
    expect(b.challenge!.predictions.every((p) => p === null)).toBe(true);
    expect(isBlackBoxState(clone(b))).toBe(true);
  });

  it('does not log a counterexample twice', () => {
    const base = stateWith('square');
    const rule = ruleOf(base);
    const s = setProofMode(startTest(runExperiment(setDraftValue(base, 0, 3))), 'formula');
    const text = `x == 3 ? 0 : ${familyFormula(rule)}`;
    const next = submitFormula(withFormula(s, text));
    expect(next.lastFormula!.input).toEqual([3]);
    expect(next.log).toBe(s.log);
    expect(next.attempts).toBe(1);
  });

  it('clears the formula result when a new test starts or predictions are submitted', () => {
    const s = testing('linear');
    const wrong = submitFormula(withFormula(s, perturbed(ruleOf(s))));
    expect(lastFormulaOf(cancelTest(wrong))).not.toBeNull();
    expect(isBlackBoxState(clone(cancelTest(wrong)))).toBe(true);
    expect(lastFormulaOf(startTest(cancelTest(wrong)))).toBeNull();
    let p = setProofMode(wrong, 'predict');
    p.challenge!.inputs.forEach((input, i) => (p = setPrediction(p, i, evaluate(ruleOf(p), input) as number)));
    const done = submitTest(p);
    expect(done.solved).toBe(true);
    expect(done.lastFormula).toBeNull();
    expect(done.attempts).toBe(2);
    expect(isBlackBoxState(clone(done))).toBe(true);
  });

  it('works for logic rules', () => {
    const s = testing('gates2');
    const wrong = submitFormula(withFormula(s, perturbed(ruleOf(s))));
    expect(wrong.lastFormula!.input).toEqual([0, 0, 0]);
    expect(isBlackBoxState(clone(wrong))).toBe(true);
    const done = submitFormula(withFormula(wrong, familyFormula(ruleOf(s))));
    expect(done.solved).toBe(true);
  });

  it('solves every formula family from seeded games via its defining formula', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        const s0 = createInitialState(seed, difficulty);
        const s = setProofMode(startTest(s0), 'formula');
        if (!formulaSupported(s0)) {
          expect(proofModeOf(s)).toBe('predict');
          return;
        }
        const wrong = submitFormula(withFormula(s, perturbed(ruleOf(s))));
        const input = wrong.lastFormula!.input!;
        const dialect = formulaDialect(FAMILIES[s.family].input)!;
        const parsed = parseFormula(wrong.lastFormula!.text, dialect);
        expect(parsed.ok && evaluateFormula(parsed.expr, input)).not.toBe(evaluate(ruleOf(s), input));
        expect(wrong.log.some((e) => sameNumbers(e.input, input) && e.source === 'test')).toBe(true);
        const done = submitFormula(withFormula(wrong, familyFormula(ruleOf(s))));
        expect(done.solved).toBe(true);
        expect(isBlackBoxState(clone(done))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });
});

describe('validation of formula fields', () => {
  const solvedByFormula = () => {
    const s = testing('linear');
    return submitFormula(withFormula(s, familyFormula(ruleOf(s))));
  };
  const wrongByFormula = () => {
    const s = testing('linear');
    return submitFormula(withFormula(s, perturbed(ruleOf(s))));
  };

  it('loads saves from before formula proofs unchanged', () => {
    const old: Record<string, unknown> = { ...clone(startTest(runExperiment(stateWith('linear')))) };
    delete old.proofMode;
    delete old.formula;
    delete old.lastFormula;
    expect(isBlackBoxState(old)).toBe(true);
    const s = old as unknown as BlackBoxState;
    expect(proofModeOf(s)).toBe('predict');
    expect(formulaOf(s)).toBe('');
    expect(lastFormulaOf(s)).toBeNull();
    const done = submitFormula(setFormula(setProofMode(s, 'formula'), familyFormula(ruleOf(s))));
    expect(done.solved).toBe(true);
    expect(isBlackBoxState(clone(done))).toBe(true);
  });

  it('accepts real formula states', () => {
    for (const s of [solvedByFormula(), wrongByFormula(), cancelTest(wrongByFormula()), setFormula(testing('gate'), 'b1 ∧ ¬b2')]) {
      expect(isBlackBoxState(clone(s))).toBe(true);
    }
  });

  const mutations: [string, () => unknown][] = [
    ['unknown proof mode', () => ({ ...clone(testing('linear')), proofMode: 'guess' })],
    ['formula not a string', () => ({ ...clone(testing('linear')), formula: 12 })],
    ['formula too long', () => ({ ...clone(testing('linear')), formula: 'x'.repeat(MAX_FORMULA_LENGTH + 1) })],
    ['result not a record', () => ({ ...clone(wrongByFormula()), lastFormula: 'x' })],
    ['result text not a string', () => ({ ...clone(wrongByFormula()), lastFormula: { ...wrongByFormula().lastFormula, text: 1 } })],
    ['result text too long', () => ({ ...clone(wrongByFormula()), lastFormula: { ...wrongByFormula().lastFormula, text: ' '.repeat(MAX_FORMULA_LENGTH + 1) } })],
    ['result text unparsable', () => ({ ...clone(wrongByFormula()), lastFormula: { ...wrongByFormula().lastFormula, text: '2x +' } })],
    ['correct flag not boolean', () => ({ ...clone(wrongByFormula()), lastFormula: { ...wrongByFormula().lastFormula, correct: 'no' } })],
    ['wrong formula marked correct', () => ({ ...clone(wrongByFormula()), solved: true, challenge: null, lastFormula: { ...wrongByFormula().lastFormula, correct: true, input: null } })],
    ['correct formula marked wrong', () => ({ ...clone(solvedByFormula()), solved: false, lastFormula: { ...solvedByFormula().lastFormula, correct: false, input: [0] }, log: [{ input: [0], source: 'test' }] })],
    ['correct result with an input', () => ({ ...clone(solvedByFormula()), lastFormula: { ...solvedByFormula().lastFormula, input: [0] } })],
    ['counterexample not in the log', () => ({ ...clone(wrongByFormula()), log: [] })],
    ['counterexample out of domain', () => ({ ...clone(wrongByFormula()), lastFormula: { ...wrongByFormula().lastFormula, input: [99] } })],
    ['counterexample missing', () => ({ ...clone(wrongByFormula()), lastFormula: { ...wrongByFormula().lastFormula, input: null } })],
    ['not a counterexample', () => {
      const s = clone(wrongByFormula());
      const right = familyFormula(ruleOf(s));
      return { ...s, lastFormula: { ...s.lastFormula, text: `${right} + 0 * x` } };
    }],
    ['solved flag mismatch', () => ({ ...clone(wrongByFormula()), solved: true, challenge: null })],
    ['solved but challenge open', () => ({ ...clone(solvedByFormula()), challenge: { inputs: [[1]], predictions: [null] } })],
    ['no test counted', () => ({ ...clone(wrongByFormula()), attempts: 0 })],
    ['formula and prediction results together', () => ({ ...clone(cancelTest(wrongByFormula())), lastAttempt: { inputs: [[1]], predictions: [0] }, attempts: 2 })],
    ['formula result for a list rule', () => {
      const s = clone(stateWith('sorttake'));
      return { ...s, attempts: 1, lastFormula: { text: 'x', correct: false, input: s.draft }, log: [{ input: s.draft, source: 'test' }] };
    }]
  ];

  for (const [name, make] of mutations) {
    it(`rejects: ${name}`, () => {
      expect(isBlackBoxState(make())).toBe(false);
    });
  }

  it('survives random play with formulas', () => {
    const texts = ['', 'x', '2x + 1', 'x +', 'b1 and b2', 'not b3', 'max(x, y)', 'x*y', 'x mod 3', '1 / 0', 'maj(b1, b2, b3)', 'x > 3 ? 1 : 0'];
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom(...DIFFICULTIES),
        fc.array(fc.tuple(fc.integer({ min: 0, max: 7 }), fc.nat()), { maxLength: 30 }),
        (seed, difficulty, actions) => {
          let s = createInitialState(seed, difficulty);
          for (const [kind, n] of actions) {
            if (kind === 0) s = runExperiment(setDraftValue(s, n % s.draft.length, n % 10));
            else if (kind === 1) s = startTest(s);
            else if (kind === 2) s = cancelTest(s);
            else if (kind === 3) s = setProofMode(s, n % 2 === 0 ? 'formula' : 'predict');
            else if (kind === 4) s = setFormula(s, texts[n % texts.length]!);
            else if (kind === 5) s = setFormula(s, n % 3 === 0 ? familyFormula(ruleOf(s)) : perturbed(ruleOf(s)));
            else s = submitFormula(s);
            expect(isBlackBoxState(clone(s))).toBe(true);
          }
        }
      ),
      { numRuns: 150 }
    );
  }, 60_000);
});
