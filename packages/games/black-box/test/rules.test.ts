// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  CHALLENGE_SIZE,
  COMPARATORS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  ENUMERABLE_LIMIT,
  FAMILIES,
  FAMILY_IDS,
  GATES,
  LIST_POOL_SIZE,
  MAX_CHALLENGE_SIZE,
  PREDICTION_LIMIT,
  arity,
  attemptResults,
  buildChallenge,
  canSubmit,
  cancelTest,
  candidatePool,
  compare,
  createInitialState,
  digitSum,
  domainSize,
  enumerateDomain,
  evaluate,
  experimentCount,
  familiesFor,
  familyParams,
  findLogIndex,
  gate,
  generateRule,
  inputKey,
  isBlackBoxState,
  isDifficulty,
  isFamilyId,
  isValidInput,
  isValidParams,
  isValidPrediction,
  modulo,
  otherBits,
  phaseOf,
  randomInput,
  ruleOf,
  runExperiment,
  sameNumbers,
  sameOutput,
  setDraftValue,
  setPrediction,
  startTest,
  submitTest,
  toDifficulty,
  useHint,
  valueBounds,
  type BlackBoxState,
  type FamilyId,
  type Input,
  type InputSpec,
  type Output,
  type Prediction,
  type Rule
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// --- Independent reference implementations -------------------------------------------------

/** Truth tables written out explicitly: index = a * 2 + b. */
const TRUTH: Record<string, readonly number[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  XOR: [0, 1, 1, 0],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
  XNOR: [1, 0, 0, 1]
};
const refGate = (name: string, a: number, b: number) => TRUTH[name]![a * 2 + b]!;
const refCompare = (symbol: string, a: number, b: number) =>
  symbol === '>' ? b - a < 0 : symbol === '<' ? a - b < 0 : symbol === '≥' ? !(a < b) : !(a > b);

function reference(family: FamilyId, p: readonly number[], input: Input): Output {
  const [x = 0, y = 0] = input;
  const q = (i: number) => p[i]!;
  switch (family) {
    case 'linear': {
      let total = q(1);
      for (let i = 0; i < x; i++) total += q(0);
      return total;
    }
    case 'square':
      return x ** 2 + q(0);
    case 'mod': {
      let r = x;
      while (r >= q(0)) r -= q(0);
      return r;
    }
    case 'step':
      return x < q(0) ? q(1) : q(2);
    case 'parity':
      return x % 2 === 1 ? q(0) * x + q(1) : x >> 1;
    case 'digitsum':
      return q(0) * [...String(x)].reduce((s, d) => s + Number(d), 0) + q(1);
    case 'affinemod': {
      let r = q(0) * x + q(1);
      while (r >= q(2)) r -= q(2);
      return r;
    }
    case 'pairselect':
      return [x > y ? x : y, x < y ? x : y, x > y ? x - y : y - x][q(0)]! + q(1);
    case 'pairproduct':
      return (x + q(1)) * (y + q(0)) - q(0) * q(1) + q(2);
    case 'gate':
      return refGate(GATES[q(0)]!, input[q(1)]!, input[q(2)]!);
    case 'gates2': {
      const k = q(2);
      const others = [0, 1, 2].filter((i) => i !== k);
      return refGate(GATES[q(1)]!, refGate(GATES[q(0)]!, input[others[0]!]!, input[others[1]!]!), input[k]!);
    }
    case 'majority': {
      const votes = input.filter((_, i) => i !== q(0));
      const maj = votes.filter((b) => b === 1).length > votes.length / 2 ? 1 : 0;
      return q(1) ? 1 - maj : maj;
    }
    case 'filterref': {
      const ref = q(1) === 0 ? input[0]! : input[input.length - 1]!;
      const out: number[] = [];
      for (const e of input) if (refCompare(COMPARATORS[q(0)]!, e, ref)) out.push(e);
      return out;
    }
    case 'filterconst': {
      const out: number[] = [];
      for (const e of input) if (refCompare(COMPARATORS[q(0)]!, e, q(1))) out.push(e);
      return out;
    }
    case 'sorttake': {
      // Counting sort: an independent way to sort small digits.
      const counts = new Array<number>(10).fill(0);
      for (const e of input) counts[e]!++;
      const asc: number[] = [];
      counts.forEach((c, d) => {
        for (let i = 0; i < c; i++) asc.push(d);
      });
      return (q(0) === 0 ? asc : asc.reverse()).slice(0, q(1));
    }
  }
}

const inputArb = (spec: InputSpec) => {
  const [min, max] = valueBounds(spec);
  return fc.array(fc.integer({ min, max }), { minLength: arity(spec), maxLength: arity(spec) });
};

const ruleArb = (family: FamilyId) => fc.integer({ min: 0, max: familyParams(family).length - 1 }).map((i): Rule => ({ family, params: [...familyParams(family)[i]!] }));

const anyRuleArb = fc.constantFrom(...FAMILY_IDS).chain(ruleArb);

function stateWith(family: FamilyId, seed = 1): BlackBoxState {
  for (let s = seed; s < seed + 5000; s++) {
    for (const d of DIFFICULTIES) {
      const state = createInitialState(s, d);
      if (state.family === family) return state;
    }
  }
  throw new Error(`no seed for ${family}`);
}

const correctPredictions = (state: BlackBoxState): Prediction[] =>
  (state.challenge?.inputs ?? []).map((input) => {
    const out = evaluate(ruleOf(state), input);
    return typeof out === 'number' ? out : [...out];
  });

const wrongPrediction = (state: BlackBoxState, input: Input): Prediction => {
  const out = evaluate(ruleOf(state), input);
  if (typeof out !== 'number') return out.length === 0 ? [0] : [];
  return FAMILIES[state.family].output === 'bool' ? 1 - out : out + 1;
};

// --- Primitive helpers ---------------------------------------------------------------------

describe('primitives', () => {
  it('logic gates match their truth tables', () => {
    GATES.forEach((name, op) => {
      for (const a of [0, 1]) for (const b of [0, 1]) expect(gate(op, a, b), `${name}(${a},${b})`).toBe(refGate(name, a, b));
    });
  });

  it('comparators match their symbols', () => {
    for (let a = 0; a <= 3; a++) {
      for (let b = 0; b <= 3; b++) {
        COMPARATORS.forEach((symbol, op) => expect(compare(op, a, b), `${a}${symbol}${b}`).toBe(refCompare(symbol, a, b)));
      }
    }
  });

  it('digitSum and modulo', () => {
    expect([0, 7, 10, 19, 99, 305].map(digitSum)).toEqual([0, 7, 1, 10, 18, 8]);
    expect(digitSum(-46)).toBe(10);
    expect(modulo(7, 3)).toBe(1);
    expect(modulo(-1, 3)).toBe(2);
    expect(modulo(-6, 3)).toBe(0);
    expect(modulo(0, 5)).toBe(0);
  });

  it('otherBits lists the two remaining bit indices in order', () => {
    expect(otherBits(0)).toEqual([1, 2]);
    expect(otherBits(1)).toEqual([0, 2]);
    expect(otherBits(2)).toEqual([0, 1]);
  });

  it('sameNumbers and sameOutput', () => {
    expect(sameNumbers([1, 2], [1, 2])).toBe(true);
    expect(sameNumbers([1, 2], [2, 1])).toBe(false);
    expect(sameNumbers([1], [1, 1])).toBe(false);
    expect(sameNumbers([], [])).toBe(true);
    expect(sameOutput(3, 3)).toBe(true);
    expect(sameOutput(3, 4)).toBe(false);
    expect(sameOutput([], [])).toBe(true);
    expect(sameOutput([1], [1])).toBe(true);
    expect(sameOutput([1], [1, 2])).toBe(false);
    expect(sameOutput(0, [])).toBe(false);
    expect(sameOutput([], 0)).toBe(false);
    expect(sameOutput(null, null)).toBe(true);
    expect(sameOutput(null, 0)).toBe(false);
    expect(sameOutput([0], null)).toBe(false);
  });

  it('difficulty helpers', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(isDifficulty('easy')).toBe(true);
    expect(isDifficulty('Easy')).toBe(false);
    expect(isFamilyId('linear')).toBe(true);
    expect(isFamilyId('quadratic')).toBe(false);
  });
});

// --- Domains -------------------------------------------------------------------------------

describe('input domains', () => {
  const INT: InputSpec = { kind: 'int', min: 0, max: 20 };
  const PAIR: InputSpec = { kind: 'pair', min: 0, max: 9 };
  const BITS: InputSpec = { kind: 'bits', count: 3 };
  const LIST: InputSpec = { kind: 'list', length: 5, min: 0, max: 9 };

  it('arity, bounds and size', () => {
    expect([INT, PAIR, BITS, LIST].map(arity)).toEqual([1, 2, 3, 5]);
    expect([INT, PAIR, BITS, LIST].map(valueBounds)).toEqual([[0, 20], [0, 9], [0, 1], [0, 9]]);
    expect([INT, PAIR, BITS, LIST].map(domainSize)).toEqual([21, 100, 8, 100000]);
  });

  it('enumerates small domains in lexicographic order', () => {
    expect(enumerateDomain(BITS)).toEqual([
      [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1]
    ]);
    const ints = enumerateDomain({ kind: 'int', min: -2, max: 2 });
    expect(ints).toEqual([[-2], [-1], [0], [1], [2]]);
    const pairs = enumerateDomain(PAIR);
    expect(pairs).toHaveLength(100);
    expect(pairs[0]).toEqual([0, 0]);
    expect(pairs[13]).toEqual([1, 3]);
    expect(pairs[99]).toEqual([9, 9]);
  });

  it('validates inputs against their domain', () => {
    expect(isValidInput(INT, [0])).toBe(true);
    expect(isValidInput(INT, [20])).toBe(true);
    expect(isValidInput(INT, [21])).toBe(false);
    expect(isValidInput(INT, [-1])).toBe(false);
    expect(isValidInput(INT, [1.5])).toBe(false);
    expect(isValidInput(INT, [1, 2])).toBe(false);
    expect(isValidInput(INT, [])).toBe(false);
    expect(isValidInput(INT, '1')).toBe(false);
    expect(isValidInput(BITS, [1, 0, 1])).toBe(true);
    expect(isValidInput(BITS, [1, 2, 1])).toBe(false);
    expect(isValidInput(LIST, [0, 9, 9, 0, 5])).toBe(true);
    expect(isValidInput(LIST, [0, 9, 10, 0, 5])).toBe(false);
  });

  it('draws random inputs inside the domain', () => {
    fc.assert(
      fc.property(fc.integer(), fc.constantFrom(INT, PAIR, BITS, LIST), (seed, spec) => {
        expect(isValidInput(spec, randomInput(spec, createRng(seed)))).toBe(true);
      })
    );
  });

  it('inputKey is a stable join', () => {
    expect(inputKey([1, 0, 12])).toBe('1,0,12');
    expect(inputKey([])).toBe('');
  });
});

// --- Families ------------------------------------------------------------------------------

describe('rule families', () => {
  it('declares families per difficulty, easy → hard', () => {
    expect(familiesFor('easy')).toEqual(['linear', 'square', 'mod', 'step']);
    expect(familiesFor('medium')).toEqual(['parity', 'digitsum', 'affinemod', 'pairselect', 'pairproduct']);
    expect(familiesFor('hard')).toEqual(['gate', 'gates2', 'majority', 'filterref', 'filterconst', 'sorttake']);
    for (const id of FAMILY_IDS) expect(FAMILIES[id].id).toBe(id);
  });

  it('has the expected, explicit input domains and output kinds', () => {
    const summary = Object.fromEntries(FAMILY_IDS.map((id) => [id, [FAMILIES[id].input, FAMILIES[id].output]]));
    expect(summary).toEqual({
      linear: [{ kind: 'int', min: 0, max: 20 }, 'int'],
      square: [{ kind: 'int', min: 0, max: 20 }, 'int'],
      mod: [{ kind: 'int', min: 0, max: 20 }, 'int'],
      step: [{ kind: 'int', min: 0, max: 20 }, 'int'],
      parity: [{ kind: 'int', min: 0, max: 30 }, 'int'],
      digitsum: [{ kind: 'int', min: 0, max: 99 }, 'int'],
      affinemod: [{ kind: 'int', min: 0, max: 30 }, 'int'],
      pairselect: [{ kind: 'pair', min: 0, max: 9 }, 'int'],
      pairproduct: [{ kind: 'pair', min: 0, max: 9 }, 'int'],
      gate: [{ kind: 'bits', count: 4 }, 'bool'],
      gates2: [{ kind: 'bits', count: 3 }, 'bool'],
      majority: [{ kind: 'bits', count: 4 }, 'bool'],
      filterref: [{ kind: 'list', length: 5, min: 0, max: 9 }, 'list'],
      filterconst: [{ kind: 'list', length: 5, min: 0, max: 9 }, 'list'],
      sorttake: [{ kind: 'list', length: 5, min: 0, max: 9 }, 'list']
    });
  });

  it('enumerates the allowed parameterizations', () => {
    const counts = Object.fromEntries(FAMILY_IDS.map((id) => [id, familyParams(id).length]));
    expect(counts).toEqual({
      linear: 96,
      square: 16,
      mod: 8,
      step: 1530,
      parity: 36,
      digitsum: 18,
      affinemod: 238,
      pairselect: 18,
      pairproduct: 100,
      gate: 36,
      gates2: 27,
      majority: 8,
      filterref: 8,
      filterconst: 16,
      sorttake: 10
    });
    expect(familyParams('linear')[0]).toEqual([-3, -5]);
    expect(familyParams('linear').at(-1)).toEqual([5, 10]);
    expect(familyParams('mod').map((p) => p[0])).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(familyParams('step').every(([, lo, hi]) => lo !== hi)).toBe(true);
    expect(familyParams('step')[0]).toEqual([2, 0, 1]);
    expect(familyParams('affinemod').every(([a, b, m]) => a! >= 1 && a! < m! && b! >= 0 && b! < m!)).toBe(true);
    expect(familyParams('affinemod')[0]).toEqual([1, 0, 3]);
    expect(familyParams('gate').every(([, i, j]) => i! < j!)).toBe(true);
    expect(familyParams('gate')[0]).toEqual([0, 0, 1]);
    expect(familyParams('square').map((p) => p[0])).toEqual(Array.from({ length: 16 }, (_, i) => i - 5));
    for (const id of FAMILY_IDS) {
      const keys = familyParams(id).map((p) => p.join(','));
      expect(new Set(keys).size, id).toBe(keys.length);
      for (const p of familyParams(id)) {
        expect(p).toHaveLength(FAMILIES[id].ranges.length);
        p.forEach((v, i) => expect(FAMILIES[id].ranges[i]).toContain(v));
      }
    }
  });

  for (const id of FAMILY_IDS) {
    it(`evaluates ${id} like an independent reference implementation`, () => {
      const def = FAMILIES[id];
      fc.assert(
        fc.property(ruleArb(id), inputArb(def.input), (rule, input) => {
          expect(evaluate(rule, input)).toEqual(reference(id, rule.params, input));
        }),
        { numRuns: 300 }
      );
    });
  }

  it('evaluates hand-picked examples', () => {
    const ev = (family: FamilyId, params: number[], input: number[]) => evaluate({ family, params }, input);
    expect(ev('linear', [2, 1], [4])).toBe(9);
    expect(ev('linear', [-3, 10], [5])).toBe(-5);
    expect(ev('square', [-5], [3])).toBe(4);
    expect(ev('mod', [4], [11])).toBe(3);
    expect(ev('step', [5, 2, 8], [4])).toBe(2);
    expect(ev('step', [5, 2, 8], [5])).toBe(8);
    expect(ev('parity', [3, 1], [6])).toBe(3);
    expect(ev('parity', [3, 1], [7])).toBe(22);
    expect(ev('digitsum', [2, 3], [47])).toBe(25);
    expect(ev('affinemod', [3, 2, 7], [5])).toBe(3);
    expect(ev('pairselect', [0, 1], [3, 8])).toBe(9);
    expect(ev('pairselect', [1, 0], [3, 8])).toBe(3);
    expect(ev('pairselect', [2, 2], [3, 8])).toBe(7);
    expect(ev('pairselect', [2, 0], [8, 3])).toBe(5);
    expect(ev('pairproduct', [0, -1, 0], [4, 3])).toBe(9);
    expect(ev('pairproduct', [2, 1, 3], [1, 2])).toBe(9);
    expect(ev('gate', [2, 0, 3], [1, 0, 0, 1])).toBe(0);
    expect(ev('gate', [2, 1, 3], [1, 0, 0, 1])).toBe(1);
    expect(ev('gate', [3, 0, 1], [1, 1, 0, 0])).toBe(0);
    expect(ev('gates2', [0, 2, 2], [1, 1, 1])).toBe(0);
    expect(ev('gates2', [0, 2, 0], [0, 1, 1])).toBe(1);
    expect(ev('gates2', [0, 2, 0], [1, 1, 0])).toBe(1);
    expect(ev('gates2', [0, 1, 1], [1, 0, 1])).toBe(1);
    expect(ev('majority', [0, 0], [0, 1, 1, 0])).toBe(1);
    expect(ev('majority', [1, 0], [0, 1, 1, 0])).toBe(0);
    expect(ev('majority', [3, 1], [1, 1, 0, 0])).toBe(0);
    expect(ev('majority', [3, 1], [1, 0, 0, 1])).toBe(1);
    expect(ev('filterref', [0, 0], [4, 7, 1, 4, 9])).toEqual([7, 9]);
    expect(ev('filterref', [2, 0], [4, 7, 1, 4, 9])).toEqual([4, 7, 4, 9]);
    expect(ev('filterref', [1, 1], [4, 7, 1, 4, 9])).toEqual([4, 7, 1, 4]);
    expect(ev('filterref', [3, 1], [4, 7, 1, 4, 2])).toEqual([1, 2]);
    expect(ev('filterconst', [0, 5], [4, 7, 1, 6, 5])).toEqual([7, 6]);
    expect(ev('filterconst', [1, 5], [4, 7, 1, 6, 5])).toEqual([4, 1]);
    expect(ev('sorttake', [0, 2], [4, 7, 1, 6, 5])).toEqual([1, 4]);
    expect(ev('sorttake', [1, 3], [4, 7, 1, 6, 5])).toEqual([7, 6, 5]);
    expect(ev('sorttake', [0, 5], [3, 3, 0, 9, 0])).toEqual([0, 0, 3, 3, 9]);
  });

  it('does not mutate its input', () => {
    const list = [5, 1, 4, 2, 3];
    evaluate({ family: 'sorttake', params: [0, 5] }, list);
    expect(list).toEqual([5, 1, 4, 2, 3]);
  });

  it('validates parameters by membership', () => {
    expect(isValidParams('linear', [2, 1])).toBe(true);
    expect(isValidParams('linear', [1, 1])).toBe(false);
    expect(isValidParams('linear', [2])).toBe(false);
    expect(isValidParams('linear', [2, 1, 0])).toBe(false);
    expect(isValidParams('linear', ['2', 1])).toBe(false);
    expect(isValidParams('linear', null)).toBe(false);
    expect(isValidParams('step', [5, 3, 3])).toBe(false);
    expect(isValidParams('affinemod', [5, 0, 5])).toBe(false);
    expect(isValidParams('affinemod', [4, 0, 5])).toBe(true);
    expect(isValidParams('gate', [0, 2, 1])).toBe(false);
  });

  it('generates rules deterministically from the difficulty’s families', () => {
    fc.assert(
      fc.property(fc.integer(), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        const a = generateRule(createRng(seed), difficulty);
        expect(generateRule(createRng(seed), difficulty)).toEqual(a);
        expect(FAMILIES[a.family].difficulty).toBe(difficulty);
        expect(isValidParams(a.family, a.params)).toBe(true);
      })
    );
  });

  it('eventually generates every family', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 400; seed++) for (const d of DIFFICULTIES) seen.add(generateRule(createRng(seed), d).family);
    expect([...seen].sort()).toEqual([...FAMILY_IDS].sort());
  });
});

// --- Predictions ---------------------------------------------------------------------------

describe('isValidPrediction', () => {
  it('checks the output shape of the family', () => {
    expect(isValidPrediction('linear', -40)).toBe(true);
    expect(isValidPrediction('linear', PREDICTION_LIMIT)).toBe(true);
    expect(isValidPrediction('linear', PREDICTION_LIMIT + 1)).toBe(false);
    expect(isValidPrediction('linear', -PREDICTION_LIMIT - 1)).toBe(false);
    expect(isValidPrediction('linear', 1.5)).toBe(false);
    expect(isValidPrediction('linear', [1])).toBe(false);
    expect(isValidPrediction('gate', 1)).toBe(true);
    expect(isValidPrediction('gate', 0)).toBe(true);
    expect(isValidPrediction('gate', 2)).toBe(false);
    expect(isValidPrediction('gate', -1)).toBe(false);
    expect(isValidPrediction('sorttake', [])).toBe(true);
    expect(isValidPrediction('sorttake', [0, 9, 9, 9, 9])).toBe(true);
    expect(isValidPrediction('sorttake', [0, 9, 9, 9, 9, 9])).toBe(false);
    expect(isValidPrediction('sorttake', [10])).toBe(false);
    expect(isValidPrediction('sorttake', [-1])).toBe(false);
    expect(isValidPrediction('sorttake', 3)).toBe(false);
  });
});

// --- Challenge construction ----------------------------------------------------------------

describe('candidatePool', () => {
  it('enumerates small domains and samples large ones deterministically', () => {
    expect(candidatePool(FAMILIES.linear.input, createRng(1))).toEqual(enumerateDomain(FAMILIES.linear.input));
    expect(domainSize(FAMILIES.sorttake.input)).toBeGreaterThan(ENUMERABLE_LIMIT);
    const a = candidatePool(FAMILIES.sorttake.input, createRng(9));
    expect(candidatePool(FAMILIES.sorttake.input, createRng(9))).toEqual(a);
    expect(a.length).toBeGreaterThan(LIST_POOL_SIZE - 5);
    expect(a.length).toBeLessThanOrEqual(LIST_POOL_SIZE);
    expect(new Set(a.map(inputKey)).size).toBe(a.length);
    expect(a.every((input) => isValidInput(FAMILIES.sorttake.input, input))).toBe(true);
  });
});

describe('buildChallenge', () => {
  const scenario = fc.record({
    rule: anyRuleArb,
    seed: fc.integer(),
    logSeed: fc.integer(),
    logSize: fc.integer({ min: 0, max: 12 })
  });

  const logFor = (rule: Rule, logSeed: number, logSize: number): number[][] => {
    const rng = createRng(logSeed);
    const spec = FAMILIES[rule.family].input;
    const seen = new Set<string>();
    const log: number[][] = [];
    for (let i = 0; i < logSize; i++) {
      const input = randomInput(spec, rng);
      if (!seen.has(inputKey(input))) {
        seen.add(inputKey(input));
        log.push(input);
      }
    }
    return log;
  };

  const extensionallyEqual = (a: Rule, b: Rule) => {
    const spec = FAMILIES[a.family].input;
    const domain = enumerateDomain(spec);
    return domain.every((input) => sameOutput(evaluate(a, input), evaluate(b, input)));
  };

  it('rules out every alternative of the family that is consistent with the log', () => {
    fc.assert(
      fc.property(scenario, ({ rule, seed, logSeed, logSize }) => {
        const log = logFor(rule, logSeed, logSize);
        const challenge = buildChallenge(rule, log, createRng(seed));
        for (const params of familyParams(rule.family)) {
          if (sameNumbers(params, rule.params)) continue;
          const alt: Rule = { family: rule.family, params };
          if (!log.every((input) => sameOutput(evaluate(alt, input), evaluate(rule, input)))) continue;
          if (challenge.some((input) => !sameOutput(evaluate(alt, input), evaluate(rule, input)))) continue;
          // Not distinguished: then it must be the same function on the whole domain.
          expect(extensionallyEqual(rule, alt), `${rule.family} ${rule.params} vs ${params}`).toBe(true);
        }
      }),
      { numRuns: 250 }
    );
  });

  it('has a bounded size, distinct valid inputs and prefers untried inputs', () => {
    fc.assert(
      fc.property(scenario, ({ rule, seed, logSeed, logSize }) => {
        const log = logFor(rule, logSeed, logSize);
        const spec = FAMILIES[rule.family].input;
        const challenge = buildChallenge(rule, log, createRng(seed));
        expect(challenge.length).toBeGreaterThanOrEqual(Math.min(CHALLENGE_SIZE, domainSize(spec)));
        expect(challenge.length).toBeLessThanOrEqual(MAX_CHALLENGE_SIZE);
        expect(new Set(challenge.map(inputKey)).size).toBe(challenge.length);
        expect(challenge.every((input) => isValidInput(spec, input))).toBe(true);
        const tried = new Set(log.map(inputKey));
        const untriedCount = domainSize(spec) - tried.size;
        const triedInChallenge = challenge.filter((input) => tried.has(inputKey(input))).length;
        if (untriedCount >= challenge.length) expect(triedInChallenge).toBe(0);
        else expect(challenge.length - triedInChallenge).toBe(untriedCount);
      }),
      { numRuns: 250 }
    );
  });

  it('is deterministic for a PRNG state', () => {
    fc.assert(
      fc.property(scenario, ({ rule, seed, logSeed, logSize }) => {
        const log = logFor(rule, logSeed, logSize);
        expect(buildChallenge(rule, log, createRng(seed))).toEqual(buildChallenge(rule, log, createRng(seed)));
      }),
      { numRuns: 60 }
    );
  });

  it('reuses logged inputs only when the domain is exhausted', () => {
    const rule: Rule = { family: 'gates2', params: [0, 2, 2] };
    const all = enumerateDomain(FAMILIES.gates2.input);
    const challenge = buildChallenge(rule, all.slice(0, 6), createRng(3));
    expect(challenge).toHaveLength(CHALLENGE_SIZE);
    const keys = challenge.map(inputKey);
    expect(keys).toContain(inputKey(all[6]!));
    expect(keys).toContain(inputKey(all[7]!));
    const full = buildChallenge(rule, all, createRng(3));
    expect(full).toHaveLength(CHALLENGE_SIZE);
  });

  it('pins a step function at its threshold', () => {
    const rule: Rule = { family: 'step', params: [9, 2, 6] };
    const keys = buildChallenge(rule, [], createRng(5)).map(inputKey);
    expect(keys).toContain('8');
    expect(keys).toContain('9');
  });

  it('distinguishes a linear rule from all lines through a single logged point', () => {
    const rule: Rule = { family: 'linear', params: [2, 1] };
    const challenge = buildChallenge(rule, [[0]], createRng(11));
    expect(challenge).toHaveLength(CHALLENGE_SIZE);
    expect(challenge.map(inputKey)).not.toContain('0');
  });
});

// --- State and transitions -----------------------------------------------------------------

describe('createInitialState', () => {
  it('is deterministic, valid and stores seed & difficulty', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        const s = createInitialState(seed, difficulty);
        expect(createInitialState(seed, difficulty)).toEqual(s);
        expect(s.seed).toBe(seed);
        expect(s.difficulty).toBe(difficulty);
        expect(FAMILIES[s.family].difficulty).toBe(difficulty);
        expect(isBlackBoxState(clone(s))).toBe(true);
        expect(s.log).toEqual([]);
        expect(s.challenge).toBeNull();
        expect(s.lastAttempt).toBeNull();
        expect(s.attempts).toBe(0);
        expect(s.hintUsed).toBe(false);
        expect(s.solved).toBe(false);
        expect(phaseOf(s)).toBe('experimenting');
        const spec = FAMILIES[s.family].input;
        if (spec.kind !== 'list') expect(s.draft).toEqual(new Array(arity(spec)).fill(valueBounds(spec)[0]));
        expect(isValidInput(spec, s.draft)).toBe(true);
      })
    );
  });

  it('seeds the list draft from the PRNG right after the rule', () => {
    const s = stateWith('sorttake');
    const rng = createRng(s.seed);
    generateRule(rng, 'hard');
    expect(s.draft).toEqual(randomInput(FAMILIES.sorttake.input, rng));
    expect(s.rng).toBe(rng.state());
  });

  it('defaults to easy and normalizes the seed', () => {
    expect(createInitialState(5).difficulty).toBe('easy');
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(2.7).seed).toBe(2);
  });

  it('matches generateRule for the seed', () => {
    const rule = generateRule(createRng(77), 'medium');
    const s = createInitialState(77, 'medium');
    expect({ family: s.family, params: s.params }).toEqual(rule);
  });
});

describe('experiments', () => {
  it('edits the draft within the domain only', () => {
    const s = stateWith('linear');
    const a = setDraftValue(s, 0, 7);
    expect(a.draft).toEqual([7]);
    expect(s.draft).toEqual([0]);
    expect(setDraftValue(a, 0, 7)).toBe(a);
    expect(setDraftValue(a, 0, 21)).toBe(a);
    expect(setDraftValue(a, 0, -1)).toBe(a);
    expect(setDraftValue(a, 0, 20).draft).toEqual([20]);
    expect(setDraftValue(a, 1, 3)).toBe(a);
    expect(setDraftValue(a, 2, 3)).toBe(a);
    expect(setDraftValue(a, -1, 3)).toBe(a);
    expect(setDraftValue(startTest(a), 0, 3).draft).toEqual([7]);
  });

  it('runs an experiment once per input', () => {
    const s = stateWith('pairproduct');
    const a = runExperiment(setDraftValue(s, 1, 4));
    expect(a.log).toEqual([{ input: [0, 4], source: 'experiment' }]);
    expect(runExperiment(a)).toBe(a);
    expect(findLogIndex(a, [0, 4])).toBe(0);
    expect(findLogIndex(a, [4, 0])).toBe(-1);
    const b = runExperiment(setDraftValue(a, 0, 4));
    expect(b.log.map((e) => e.input)).toEqual([[0, 4], [4, 4]]);
    expect(experimentCount(b)).toBe(2);
    // the log keeps its own copy of the draft
    b.draft[0] = 9;
    expect(b.log[1]!.input).toEqual([4, 4]);
  });

  it('does not run experiments during a test or after solving', () => {
    const s = startTest(stateWith('mod'));
    expect(runExperiment(s)).toBe(s);
  });

  it('records a hint once', () => {
    const s = stateWith('square');
    const a = useHint(s);
    expect(a.hintUsed).toBe(true);
    expect(useHint(a)).toBe(a);
  });
});

describe('hypothesis tests', () => {
  it('opens a seeded challenge and advances the PRNG', () => {
    const s = runExperiment(stateWith('digitsum'));
    const a = startTest(s);
    expect(phaseOf(a)).toBe('testing');
    expect(a.rng).not.toBe(s.rng);
    expect(a.challenge!.inputs).toEqual(buildChallenge(ruleOf(s), [s.draft], createRng(s.rng)));
    expect(a.challenge!.predictions).toEqual(a.challenge!.inputs.map(() => null));
    expect(startTest(a)).toBe(a);
    expect(canSubmit(a)).toBe(false);
  });

  it('cancels without counting', () => {
    const a = startTest(stateWith('mod'));
    const b = cancelTest(a);
    expect(b.challenge).toBeNull();
    expect(b.attempts).toBe(0);
    expect(b.rng).toBe(a.rng);
    expect(cancelTest(b)).toBe(b);
    // a new test uses the advanced PRNG
    expect(startTest(b).rng).not.toBe(a.rng);
  });

  it('accepts only valid predictions at valid indices', () => {
    const a = startTest(stateWith('linear'));
    const b = setPrediction(a, 0, 12);
    expect(b.challenge!.predictions[0]).toBe(12);
    expect(setPrediction(b, 0, 12)).toBe(b);
    expect(setPrediction(b, 0, 1.5)).toBe(b);
    expect(setPrediction(b, 0, [1])).toBe(b);
    expect(setPrediction(b, -1, 3)).toBe(b);
    expect(setPrediction(b, a.challenge!.inputs.length, 3)).toBe(b);
    expect(setPrediction(b, 0, null).challenge!.predictions[0]).toBeNull();
    expect(setPrediction(stateWith('linear'), 0, 3).challenge).toBeNull();
    const list = startTest(stateWith('sorttake'));
    const value = [1, 2];
    const c = setPrediction(list, 1, value);
    value.push(3);
    expect(c.challenge!.predictions[1]).toEqual([1, 2]);
    expect(setPrediction(c, 1, [1, 2])).toBe(c);
  });

  it('solves with all-correct predictions', () => {
    for (const family of FAMILY_IDS) {
      let s = startTest(runExperiment(stateWith(family)));
      correctPredictions(s).forEach((p, i) => (s = setPrediction(s, i, p)));
      expect(canSubmit(s)).toBe(true);
      const done = submitTest(s);
      expect(done.solved, family).toBe(true);
      expect(phaseOf(done)).toBe('solved');
      expect(done.attempts).toBe(1);
      expect(done.challenge).toBeNull();
      expect(done.log).toEqual(s.log);
      expect(attemptResults(done, done.lastAttempt!).every(Boolean)).toBe(true);
      expect(isBlackBoxState(clone(done))).toBe(true);
      expect(submitTest(done)).toBe(done);
      expect(startTest(done)).toBe(done);
      expect(useHint(done)).toBe(done);
    }
  });

  it('reveals the true outputs of a failed test in the log', () => {
    let s = startTest(stateWith('affinemod'));
    const preds = correctPredictions(s);
    preds[0] = wrongPrediction(s, s.challenge!.inputs[0]!);
    preds.forEach((p, i) => (s = setPrediction(s, i, p)));
    const done = submitTest(s);
    expect(done.solved).toBe(false);
    expect(phaseOf(done)).toBe('experimenting');
    expect(done.attempts).toBe(1);
    expect(done.lastAttempt).toEqual({ inputs: s.challenge!.inputs, predictions: preds });
    expect(attemptResults(done, done.lastAttempt!)).toEqual(preds.map((_, i) => i !== 0));
    expect(done.log.map((e) => e.input)).toEqual(s.challenge!.inputs);
    expect(done.log.every((e) => e.source === 'test')).toBe(true);
    expect(experimentCount(done)).toBe(0);
    expect(isBlackBoxState(clone(done))).toBe(true);
    // the next test starts fresh and clears the shown attempt
    const next = startTest(done);
    expect(next.lastAttempt).toBeNull();
    expect(next.attempts).toBe(1);
    expect(next.challenge!.inputs.some((input) => findLogIndex(done, input) >= 0)).toBe(false);
  });

  it('does not duplicate logged inputs when a test reuses them', () => {
    let s = stateWith('gates2');
    for (const input of enumerateDomain(FAMILIES.gates2.input)) {
      s = runExperiment({ ...s, draft: input });
    }
    expect(s.log).toHaveLength(8);
    s = startTest(s);
    s.challenge!.inputs.forEach((input, i) => (s = setPrediction(s, i, wrongPrediction(s, input) as number)));
    const done = submitTest(s);
    expect(done.solved).toBe(false);
    expect(done.log).toHaveLength(8);
    expect(isBlackBoxState(clone(done))).toBe(true);
  });

  it('refuses to submit incomplete predictions', () => {
    let s = startTest(stateWith('mod'));
    expect(submitTest(s)).toBe(s);
    const n = s.challenge!.inputs.length;
    for (let i = 0; i < n - 1; i++) s = setPrediction(s, i, 0);
    expect(canSubmit(s)).toBe(false);
    expect(submitTest(s)).toBe(s);
    s = setPrediction(s, n - 1, 0);
    expect(canSubmit(s)).toBe(true);
  });
});

// --- Random play ---------------------------------------------------------------------------

type Action =
  | { kind: 'draft'; index: number; value: number }
  | { kind: 'run' }
  | { kind: 'test' }
  | { kind: 'cancel' }
  | { kind: 'predict'; index: number; truth: boolean }
  | { kind: 'submit' }
  | { kind: 'hint' };

const actionArb: fc.Arbitrary<Action> = fc.oneof(
  fc.record({ kind: fc.constant('draft' as const), index: fc.integer({ min: 0, max: 5 }), value: fc.integer({ min: -1, max: 100 }) }),
  fc.constant({ kind: 'run' as const }),
  fc.constant({ kind: 'test' as const }),
  fc.constant({ kind: 'cancel' as const }),
  fc.record({ kind: fc.constant('predict' as const), index: fc.integer({ min: 0, max: 9 }), truth: fc.boolean() }),
  fc.constant({ kind: 'submit' as const }),
  fc.constant({ kind: 'hint' as const })
);

function apply(s: BlackBoxState, a: Action): BlackBoxState {
  switch (a.kind) {
    case 'draft':
      return setDraftValue(s, a.index, a.value);
    case 'run':
      return runExperiment(s);
    case 'test':
      return startTest(s);
    case 'cancel':
      return cancelTest(s);
    case 'predict': {
      const input = s.challenge?.inputs[a.index];
      if (!input) return s;
      const out = evaluate(ruleOf(s), input);
      return setPrediction(s, a.index, a.truth ? (typeof out === 'number' ? out : [...out]) : wrongPrediction(s, input));
    }
    case 'submit':
      return submitTest(s);
    case 'hint':
      return useHint(s);
  }
}

describe('random play', () => {
  it('keeps every reachable state valid, JSON-safe and monotone', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.array(actionArb, { maxLength: 40 }), (seed, difficulty, actions) => {
        let s = createInitialState(seed, difficulty);
        for (const action of actions) {
          const before = s;
          s = apply(s, action);
          expect(isBlackBoxState(clone(s))).toBe(true);
          expect(s.log.length).toBeGreaterThanOrEqual(before.log.length);
          expect(s.attempts).toBeGreaterThanOrEqual(before.attempts);
          expect(s.family).toBe(before.family);
          expect(s.params).toEqual(before.params);
          if (before.solved) expect(s).toBe(before);
        }
      }),
      { numRuns: 150 }
    );
  });
});

// --- Validation ----------------------------------------------------------------------------

describe('isBlackBoxState', () => {
  const solvedState = () => {
    let s = startTest(runExperiment(stateWith('linear')));
    correctPredictions(s).forEach((p, i) => (s = setPrediction(s, i, p)));
    return submitTest(s);
  };
  const failedState = () => {
    let s = startTest(stateWith('filterconst'));
    s.challenge!.inputs.forEach((input, i) => (s = setPrediction(s, i, wrongPrediction(s, input))));
    return submitTest(s);
  };
  const testingState = () => setPrediction(startTest(runExperiment(stateWith('gate'))), 0, 1);

  it('accepts states from real play', () => {
    for (const s of [stateWith('linear'), solvedState(), failedState(), testingState()]) expect(isBlackBoxState(clone(s))).toBe(true);
  });

  const mutations: [string, (s: BlackBoxState) => unknown][] = [
    ['missing key', (s) => { const c: Record<string, unknown> = { ...s }; delete c.hintUsed; return c; }],
    ['bad seed', (s) => ({ ...s, seed: -1 })],
    ['bad rng', (s) => ({ ...s, rng: 2 ** 32 })],
    ['unknown difficulty', (s) => ({ ...s, difficulty: 'extreme' })],
    ['family of other difficulty', (s) => ({ ...s, difficulty: 'hard' })],
    ['unknown family', (s) => ({ ...s, family: 'cubic' })],
    ['invalid params', (s) => ({ ...s, params: [1, 0] })],
    ['params wrong length', (s) => ({ ...s, params: [...s.params, 0] })],
    ['negative attempts', (s) => ({ ...s, attempts: -1 })],
    ['fractional attempts', (s) => ({ ...s, attempts: 0.5 })],
    ['hintUsed not boolean', (s) => ({ ...s, hintUsed: 1 })],
    ['solved not boolean', (s) => ({ ...s, solved: 'no' })],
    ['draft out of domain', (s) => ({ ...s, draft: [21] })],
    ['draft wrong length', (s) => ({ ...s, draft: [1, 2] })],
    ['log not array', (s) => ({ ...s, log: {} })],
    ['log entry bad input', (s) => ({ ...s, log: [{ input: [99], source: 'experiment' }] })],
    ['log entry bad source', (s) => ({ ...s, log: [{ input: [1], source: 'guess' }] })],
    ['log entry not record', (s) => ({ ...s, log: [[1]] })],
    ['duplicate log inputs', (s) => ({ ...s, log: [{ input: [1], source: 'experiment' }, { input: [1], source: 'test' }] })],
    ['log longer than domain', (s) => ({ ...s, log: Array.from({ length: 22 }, (_, i) => ({ input: [i], source: 'experiment' })) })],
    ['solved without attempt', (s) => ({ ...s, solved: true })],
    ['challenge not record', (s) => ({ ...s, challenge: [] })],
    ['empty challenge', (s) => ({ ...s, challenge: { inputs: [], predictions: [] } })],
    ['challenge too long', (s) => ({ ...s, challenge: { inputs: Array.from({ length: 11 }, (_, i) => [i]), predictions: new Array(11).fill(null) } })],
    ['challenge duplicate inputs', (s) => ({ ...s, challenge: { inputs: [[1], [1]], predictions: [null, null] } })],
    ['challenge input out of domain', (s) => ({ ...s, challenge: { inputs: [[1], [30]], predictions: [null, null] } })],
    ['prediction count mismatch', (s) => ({ ...s, challenge: { inputs: [[1], [2]], predictions: [null] } })],
    ['prediction wrong type', (s) => ({ ...s, challenge: { inputs: [[1], [2]], predictions: [null, [3]] } })],
    ['predictions not array', (s) => ({ ...s, challenge: { inputs: [[1]], predictions: 'x' } })]
  ];

  for (const [name, mutate] of mutations) {
    it(`rejects: ${name}`, () => {
      const base = stateWith('linear');
      expect(isBlackBoxState(clone(base))).toBe(true);
      expect(isBlackBoxState(mutate(clone(base)))).toBe(false);
    });
  }

  it('accepts challenges of 1 to MAX_CHALLENGE_SIZE inputs', () => {
    const base = clone(stateWith('linear'));
    const make = (n: number) => ({ ...base, challenge: { inputs: Array.from({ length: n }, (_, i) => [i]), predictions: new Array(n).fill(null) } });
    expect(isBlackBoxState(make(1))).toBe(true);
    expect(isBlackBoxState(make(MAX_CHALLENGE_SIZE))).toBe(true);
    expect(isBlackBoxState(make(MAX_CHALLENGE_SIZE + 1))).toBe(false);
    expect(isBlackBoxState({ ...make(2), solved: true })).toBe(false);
  });

  it('requires a valid integer attempt counter and boolean hint flag', () => {
    const base = clone(stateWith('linear'));
    expect(isBlackBoxState({ ...base, attempts: 1_000_001 })).toBe(false);
    expect(isBlackBoxState({ ...base, attempts: 3 })).toBe(true);
    expect(isBlackBoxState({ ...base, hintUsed: true })).toBe(true);
  });

  it('rejects inconsistent attempts', () => {
    const solved = solvedState();
    expect(isBlackBoxState({ ...clone(solved), solved: false })).toBe(false);
    expect(isBlackBoxState({ ...clone(solved), attempts: 0 })).toBe(false);
    expect(isBlackBoxState({ ...clone(solved), challenge: { inputs: [[3]], predictions: [null] } })).toBe(false);
    const wrongPreds = clone(solved);
    wrongPreds.lastAttempt!.predictions[0] = (wrongPreds.lastAttempt!.predictions[0] as number) + 1;
    expect(isBlackBoxState(wrongPreds)).toBe(false);
    const short = clone(solved);
    short.lastAttempt!.predictions.pop();
    expect(isBlackBoxState(short)).toBe(false);
    const badPred = clone(solved);
    (badPred.lastAttempt!.predictions as unknown[])[0] = null;
    expect(isBlackBoxState(badPred)).toBe(false);
    expect(isBlackBoxState({ ...clone(solved), lastAttempt: 'x' })).toBe(false);
    expect(isBlackBoxState({ ...clone(solved), lastAttempt: { inputs: [[1]] } })).toBe(false);

    const failed = failedState();
    expect(isBlackBoxState({ ...clone(failed), solved: true })).toBe(false);
    expect(isBlackBoxState({ ...clone(failed), log: [] })).toBe(false);
    expect(isBlackBoxState({ ...clone(failed), log: failed.log.slice(1) })).toBe(false);
  });

  it('never throws on junk', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isBlackBoxState(value)).not.toThrow();
      }),
      { numRuns: 500 }
    );
    const throwing = new Proxy({}, { has: () => { throw new Error('boom'); } });
    expect(isBlackBoxState(throwing)).toBe(false);
  });
});
