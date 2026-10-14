import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  MAX_FORMULA_DEPTH,
  MAX_FORMULA_LENGTH,
  NUMBER_LIMIT,
  VALUE_LIMIT,
  digitValue,
  evaluateFormula,
  normalizeDigits,
  parseFormula,
  printFormula,
  type BinOp,
  type Dialect,
  type Expr,
  type FnName
} from '../src/formula';

const X: Dialect = { logic: false, vars: ['x'] };
const XY: Dialect = { logic: false, vars: ['x', 'y'] };
const BITS: Dialect = { logic: true, vars: ['b1', 'b2', 'b3', 'b4'] };

/** Parses (must succeed) and evaluates. */
function val(text: string, values: readonly number[], dialect: Dialect = XY): number | null {
  const parsed = parseFormula(text, dialect);
  if (!parsed.ok) throw new Error(`parse failed for ${text}: ${JSON.stringify(parsed.error)}`);
  return evaluateFormula(parsed.expr, values);
}

function err(text: string, dialect: Dialect = XY) {
  const parsed = parseFormula(text, dialect);
  if (parsed.ok) throw new Error(`expected a parse error for ${text}`);
  return parsed.error;
}

// --- Independent reference evaluator (BigInt, exact) ---------------------------------------

const LIMIT = BigInt(VALUE_LIMIT);
const ok = (v: bigint): bigint | null => (v > LIMIT || v < -LIMIT ? null : v);
const b = (cond: boolean): bigint => (cond ? 1n : 0n);

function floorDiv(a: bigint, d: bigint): bigint {
  const q = a / d;
  return a % d !== 0n && a < 0n !== d < 0n ? q - 1n : q;
}

function ref(e: Expr, values: readonly number[]): bigint | null {
  switch (e.t) {
    case 'num':
      return BigInt(e.v);
    case 'var':
      return BigInt(values[e.i]!);
    case 'neg': {
      const a = ref(e.a, values);
      return a === null ? null : -a;
    }
    case 'not': {
      const a = ref(e.a, values);
      return a === null ? null : b(a === 0n);
    }
    case 'if': {
      const c = ref(e.c, values);
      if (c === null) return null;
      return c !== 0n ? ref(e.a, values) : ref(e.b, values);
    }
    case 'call': {
      const args = e.args.map((arg) => ref(arg, values));
      if (args.some((a) => a === null)) return null;
      const [p = 0n, q = 0n, r = 0n] = args as bigint[];
      switch (e.f) {
        case 'abs':
          return p < 0n ? -p : p;
        case 'min':
          return p < q ? p : q;
        case 'max':
          return p > q ? p : q;
        case 's':
          return [...(p < 0n ? -p : p).toString()].reduce((sum, d) => sum + BigInt(d), 0n);
        case 'even':
          return b(p % 2n === 0n);
        case 'odd':
          return b(p % 2n !== 0n);
        case 'maj':
          return b(b(p !== 0n) + b(q !== 0n) + b(r !== 0n) >= 2n);
      }
      return null;
    }
    case 'bin': {
      const l = ref(e.a, values);
      if (l === null) return null;
      if (e.op === 'and' && l === 0n) return 0n;
      if (e.op === 'or' && l !== 0n) return 1n;
      const r = ref(e.b, values);
      if (r === null) return null;
      switch (e.op) {
        case 'and':
        case 'or':
          return b(r !== 0n);
        case '+':
          return ok(l + r);
        case '-':
          return ok(l - r);
        case '*':
          return ok(l * r);
        case '/':
          return r === 0n ? null : ok(floorDiv(l, r));
        case 'mod':
          return r === 0n ? null : ok(l - r * floorDiv(l, r));
        case '^':
          if (r < 0n) return null;
          if (l === 0n) return r === 0n ? 1n : 0n;
          if (l === 1n) return 1n;
          if (l === -1n) return r % 2n === 0n ? 1n : -1n;
          return r > 64n ? null : ok(l ** r);
        case '<':
          return b(l < r);
        case '<=':
          return b(l <= r);
        case '>':
          return b(l > r);
        case '>=':
          return b(l >= r);
        case '==':
          return b(l === r);
        case '!=':
          return b(l !== r);
        case 'xor':
          return b((l !== 0n) !== (r !== 0n));
        case 'nand':
          return b(!(l !== 0n && r !== 0n));
        case 'nor':
          return b(!(l !== 0n || r !== 0n));
        case 'xnor':
          return b((l !== 0n) === (r !== 0n));
      }
    }
  }
}

// --- Random ASTs ---------------------------------------------------------------------------

const ARITH_OPS: BinOp[] = ['+', '-', '*', '/', 'mod', '^', '<', '<=', '>', '>=', '==', '!=', 'and', 'or'];
const LOGIC_OPS: BinOp[] = ['and', 'or', 'xor', 'nand', 'nor', 'xnor'];
const ARITY: [FnName, number][] = [['abs', 1], ['min', 2], ['max', 2], ['s', 1], ['even', 1], ['odd', 1]];

function arithArb(vars: number, depth: number): fc.Arbitrary<Expr> {
  const leaf = fc.oneof(
    fc.integer({ min: 0, max: 1000 }).map((v): Expr => ({ t: 'num', v })),
    fc.integer({ min: 0, max: vars - 1 }).map((i): Expr => ({ t: 'var', i }))
  );
  if (depth <= 0) return leaf;
  const sub = arithArb(vars, depth - 1);
  return fc.oneof(
    { weight: 2, arbitrary: leaf },
    { weight: 1, arbitrary: fc.tuple(fc.constantFrom<'neg' | 'not'>('neg', 'not'), sub).map(([t, a]): Expr => ({ t, a })) },
    { weight: 3, arbitrary: fc.tuple(fc.constantFrom(...ARITH_OPS), sub, sub).map(([op, a, b2]): Expr => ({ t: 'bin', op, a, b: b2 })) },
    { weight: 1, arbitrary: fc.tuple(sub, sub, sub).map(([c, a, b2]): Expr => ({ t: 'if', c, a, b: b2 })) },
    {
      weight: 1,
      arbitrary: fc
        .tuple(fc.constantFrom(...ARITY), sub, sub)
        .map(([[f, n], a, b2]): Expr => ({ t: 'call', f, args: [a, b2].slice(0, n) }))
    }
  );
}

function logicArb(depth: number): fc.Arbitrary<Expr> {
  const leaf = fc.oneof(
    fc.integer({ min: 0, max: 1 }).map((v): Expr => ({ t: 'num', v })),
    fc.integer({ min: 0, max: 3 }).map((i): Expr => ({ t: 'var', i }))
  );
  if (depth <= 0) return leaf;
  const sub = logicArb(depth - 1);
  return fc.oneof(
    { weight: 2, arbitrary: leaf },
    { weight: 1, arbitrary: sub.map((a): Expr => ({ t: 'not', a })) },
    { weight: 3, arbitrary: fc.tuple(fc.constantFrom(...LOGIC_OPS), sub, sub).map(([op, a, b2]): Expr => ({ t: 'bin', op, a, b: b2 })) },
    { weight: 1, arbitrary: fc.tuple(sub, sub, sub).map(([p, q, r]): Expr => ({ t: 'call', f: 'maj', args: [p, q, r] })) }
  );
}

// --- Tests ---------------------------------------------------------------------------------

describe('digits', () => {
  it('reads ASCII and locale digit blocks', () => {
    expect(digitValue('7')).toBe(7);
    expect(digitValue('٣')).toBe(3);
    expect(digitValue('۵')).toBe(5);
    expect(digitValue('९')).toBe(9);
    expect(digitValue('０')).toBe(0);
    expect(digitValue('a')).toBe(-1);
    expect(normalizeDigits('x ٣ + ۵१')).toBe('x 3 + 51');
  });
});

describe('arithmetic formulas', () => {
  it('follows the usual precedence and associativity', () => {
    expect(val('2 + 3 * 4', [0, 0])).toBe(14);
    expect(val('(2 + 3) * 4', [0, 0])).toBe(20);
    expect(val('10 - 3 - 2', [0, 0])).toBe(5);
    expect(val('100 / 10 / 5', [0, 0])).toBe(2);
    expect(val('2 ^ 3 ^ 2', [0, 0])).toBe(512);
    expect(val('-x^2', [3, 0])).toBe(-9);
    expect(val('(-x)^2', [3, 0])).toBe(9);
    expect(val('2^-1', [0, 0])).toBeNull();
    expect(val('--x', [4, 0])).toBe(4);
    expect(val('+x', [4, 0])).toBe(4);
    expect(val('x + y * 2', [1, 5])).toBe(11);
  });

  it('divides rounding down and takes the remainder with the sign of the divisor', () => {
    expect(val('7 / 2', [0, 0])).toBe(3);
    expect(val('-7 / 2', [0, 0])).toBe(-4);
    expect(val('7 / -2', [0, 0])).toBe(-4);
    expect(val('-7 / -2', [0, 0])).toBe(3);
    expect(val('7 mod 3', [0, 0])).toBe(1);
    expect(val('-7 mod 3', [0, 0])).toBe(2);
    expect(val('7 % -3', [0, 0])).toBe(-2);
    expect(val('6 mod 3', [0, 0])).toBe(0);
    expect(val('x / y', [5, 0])).toBeNull();
    expect(val('x mod y', [5, 0])).toBeNull();
    expect(val('x ÷ 2', [9, 0])).toBe(4);
  });

  it('accepts implicit multiplication after a number, × · and the square sign', () => {
    expect(val('2x + 1', [5, 0])).toBe(11);
    expect(val('3(x + 1)', [2, 0])).toBe(9);
    expect(val('2x^2', [3, 0])).toBe(18);
    expect(val('-2x', [3, 0])).toBe(-6);
    expect(val('3×x − 1', [4, 0])).toBe(11);
    expect(val('3·x', [4, 0])).toBe(12);
    expect(val('x²', [7, 0])).toBe(49);
    expect(val('x²²', [2, 0])).toBe(16);
    expect(err('x y').code).toBe('unexpected');
    expect(err('(x)2')).toEqual({ code: 'unexpected', pos: 4, text: '2', n: 0 });
  });

  it('evaluates functions', () => {
    expect(val('abs(x - y)', [2, 9])).toBe(7);
    expect(val('min(x, y)', [2, 9])).toBe(2);
    expect(val('max(x, y)', [2, 9])).toBe(9);
    expect(val('S(x)', [97, 0])).toBe(16);
    expect(val('digitsum(x)', [-45, 0])).toBe(9);
    expect(val('s(0)', [0, 0])).toBe(0);
    expect(val('even(x)', [4, 0])).toBe(1);
    expect(val('even(x)', [-3, 0])).toBe(0);
    expect(val('odd(x)', [-3, 0])).toBe(1);
    expect(val('odd(x)', [8, 0])).toBe(0);
    expect(val('MAX(X, Y)', [3, 4])).toBe(4);
  });

  it('compares and combines conditions as 1 and 0', () => {
    const cases: [string, number][] = [
      ['x < 3', 1], ['x <= 2', 1], ['x > 2', 0], ['x >= 2', 1], ['x == 2', 1], ['x = 2', 1], ['x != 2', 0], ['x <> 3', 1],
      ['x ≤ 1', 0], ['x ≥ 2', 1], ['x ≠ 2', 0], ['x > 1 and x < 3', 1], ['x > 1 && x > 3', 0], ['x > 5 or x == 2', 1],
      ['x > 5 || x < 0', 0], ['x > 5 | 1', 1], ['x == 2 & 7', 1], ['not x > 3', 1], ['!x', 0], ['not 0', 1]
    ];
    for (const [text, expected] of cases) expect(val(text, [2, 0]), text).toBe(expected);
    // `not` binds looser than comparisons, and `and` tighter than `or`.
    expect(val('not x == 2', [2, 0])).toBe(0);
    expect(val('1 or 0 and 0', [0, 0])).toBe(1);
    expect(val('(1 or 0) and 0', [0, 0])).toBe(0);
  });

  it('short-circuits and, or and the choice', () => {
    expect(val('x > 0 and 10 / x > 2', [0, 0])).toBe(0);
    expect(val('x == 0 or 10 / x > 2', [0, 0])).toBe(1);
    expect(val('x == 0 ? 7 : 10 / x', [0, 0])).toBe(7);
    expect(val('x != 0 ? 10 / x : 7', [0, 0])).toBe(7);
    expect(val('x > 0 and 10 / x > 2', [1, 0])).toBe(1);
    expect(val('10 / x > 2 and x > 0', [0, 0])).toBeNull();
    expect(val('10 / x ? 1 : 2', [0, 0])).toBeNull();
    expect(val('max(10 / x, 1)', [0, 0])).toBeNull();
    expect(val('-(10 / x)', [0, 0])).toBeNull();
    expect(val('not (10 / x)', [0, 0])).toBeNull();
  });

  it('supports nested choices (right-associative) and if()', () => {
    const f = 'x < 3 ? 0 : x < 6 ? 1 : 2';
    expect([1, 4, 9].map((x) => val(f, [x, 0]))).toEqual([0, 1, 2]);
    expect(val('if(x mod 2 == 0, x / 2, 3*x + 1)', [6, 0])).toBe(3);
    expect(val('IF(x mod 2 == 0, x / 2, 3*x + 1)', [7, 0])).toBe(22);
    expect(val('x > 2 ? x : -x', [-4, 0])).toBe(4);
  });

  it('treats too large values, negative exponents and division by zero as undefined', () => {
    expect(val("x^39", [2, 0])).toBe(2 ** 39);
    expect(val('x^40', [3, 0])).toBeNull();
    expect(val('x^1000000000', [1, 0])).toBe(1);
    expect(val('x^1000000000', [-1, 0])).toBe(1);
    expect(val('x^999999999', [-1, 0])).toBe(-1);
    expect(val('x^1000000000', [0, 0])).toBe(0);
    expect(val('0^0', [0, 0])).toBe(1);
    expect(val('x^0', [9, 0])).toBe(1);
    expect(val('x^1000000000', [2, 0])).toBeNull();
    expect(val('1000000000 * 1000', [0, 0])).toBe(VALUE_LIMIT);
    expect(val('1000000000 * 1001', [0, 0])).toBeNull();
    expect(val('-1000000000 * 1001', [0, 0])).toBeNull();
    expect(val('1000000000 * 1000 + 1', [0, 0])).toBeNull();
    expect(val('-1000000000 * 1000 - 1', [0, 0])).toBeNull();
    expect(val('x - 1', [0, 0])).toBe(-1);
    expect(Object.is(val('-x', [0, 0]), 0)).toBe(true);
    expect(Object.is(val('-x * 1', [0, 0]), 0)).toBe(true);
  });

  it('accepts locale digits and whitespace', () => {
    expect(val('٣ x  +\t۱', [2, 0])).toBe(7);
    expect(val(`${NUMBER_LIMIT}`, [0, 0])).toBe(NUMBER_LIMIT);
  });
});

describe('logic formulas', () => {
  const all = (text: string) => {
    const out: number[] = [];
    for (let i = 0; i < 16; i++) out.push(val(text, [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1], BITS) as number);
    return out.join('');
  };
  const table = (f: (b1: number, b2: number, b3: number, b4: number) => boolean) => {
    const out: number[] = [];
    for (let i = 0; i < 16; i++) out.push(f((i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1) ? 1 : 0);
    return out.join('');
  };

  it('evaluates the gates with words and symbols', () => {
    expect(all('b1 and b2')).toBe(table((a, b2) => a === 1 && b2 === 1));
    expect(all('b1 & b2')).toBe(all('b1 and b2'));
    expect(all('b1 && b2')).toBe(all('b1 and b2'));
    expect(all('b1 ∧ b2')).toBe(all('b1 and b2'));
    expect(all('b1 or b3')).toBe(table((a, _b, c) => a === 1 || c === 1));
    expect(all('b1 | b3')).toBe(all('b1 or b3'));
    expect(all('b1 ∨ b3')).toBe(all('b1 or b3'));
    expect(all('b1 || b3')).toBe(all('b1 or b3'));
    expect(all('b2 xor b4')).toBe(table((_a, b2, _c, d) => b2 !== d));
    expect(all('b2 ^ b4')).toBe(all('b2 xor b4'));
    expect(all('b2 ⊕ b4')).toBe(all('b2 xor b4'));
    expect(all('b1 nand b2')).toBe(table((a, b2) => !(a === 1 && b2 === 1)));
    expect(all('b1 nor b2')).toBe(table((a, b2) => !(a === 1 || b2 === 1)));
    expect(all('b1 xnor b2')).toBe(table((a, b2) => a === b2));
    expect(all('not b3')).toBe(table((_a, _b, c) => c === 0));
    for (const neg of ['!b3', '¬b3', '~b3', 'NOT B3']) expect(all(neg)).toBe(all('not b3'));
    expect(all('maj(b1, b2, b4)')).toBe(table((a, b2, _c, d) => a + b2 + d >= 2));
    expect(all('1')).toBe('1'.repeat(16));
    expect(all('0')).toBe('0'.repeat(16));
  });

  it('binds not, then and, then xor, then or', () => {
    expect(all('b1 or b2 and b3')).toBe(all('b1 or (b2 and b3)'));
    expect(all('b1 xor b2 and b3')).toBe(all('b1 xor (b2 and b3)'));
    expect(all('b1 or b2 xor b3')).toBe(all('b1 or (b2 xor b3)'));
    expect(all('not b1 and b2')).toBe(all('(not b1) and b2'));
    expect(all('b1 nand b2 and b3')).toBe(all('(b1 nand b2) and b3'));
    expect(all('b1 xnor b2 xor b3')).toBe(all('(b1 xnor b2) xor b3'));
    expect(all('b1 nor b2 or b3')).toBe(all('(b1 nor b2) or b3'));
    expect(all('not not b1')).toBe(all('b1'));
  });

  it('rejects arithmetic, other numbers and unknown bits', () => {
    expect(err('b1 + b2', BITS)).toEqual({ code: 'unexpected', pos: 4, text: '+', n: 0 });
    expect(err('2', BITS)).toEqual({ code: 'unexpected', pos: 1, text: '2', n: 0 });
    expect(err('b5', BITS)).toEqual({ code: 'name', pos: 1, text: 'b5', n: 0 });
    expect(err('x', BITS).code).toBe('name');
    expect(err('maj(b1, b2)', BITS)).toEqual({ code: 'args', pos: 1, text: 'maj', n: 3 });
    expect(err('abs(b1)', BITS).code).toBe('name');
    expect(err('b1 ? b2 : b3', BITS).code).toBe('unexpected');
    expect(err('b1 and', BITS).code).toBe('end');
  });
});

describe('parse errors', () => {
  it('reports the kind, position and text', () => {
    expect(err('')).toEqual({ code: 'empty', pos: 0, text: '', n: 0 });
    expect(err('   ').code).toBe('empty');
    expect(err('x'.repeat(MAX_FORMULA_LENGTH + 1))).toEqual({ code: 'tooLong', pos: 0, text: '', n: MAX_FORMULA_LENGTH });
    expect(parseFormula(`x${' '.repeat(MAX_FORMULA_LENGTH - 1)}`, X).ok).toBe(true);
    expect(err('x $ 2')).toEqual({ code: 'char', pos: 3, text: '$', n: 0 });
    expect(err('x² + é')).toEqual({ code: 'char', pos: 6, text: 'é', n: 0 });
    expect(err('😀 + x')).toEqual({ code: 'char', pos: 1, text: '😀', n: 0 });
    expect(err('😀😀', X).pos).toBe(1);
    expect(err('x + 😀', X).pos).toBe(5);
    expect(err('foo(x)')).toEqual({ code: 'name', pos: 1, text: 'foo', n: 0 });
    expect(err('2 * z')).toEqual({ code: 'name', pos: 5, text: 'z', n: 0 });
    expect(err('y', X)).toEqual({ code: 'name', pos: 1, text: 'y', n: 0 });
    expect(err('x2')).toEqual({ code: 'name', pos: 1, text: 'x2', n: 0 });
    expect(err('x +')).toEqual({ code: 'end', pos: 4, text: '', n: 0 });
    expect(err('(x + 1')).toEqual({ code: 'end', pos: 7, text: '', n: 0 });
    expect(err('x ? 1').code).toBe('end');
    expect(err('x mod').code).toBe('end');
    expect(err(')')).toEqual({ code: 'unexpected', pos: 1, text: ')', n: 0 });
    expect(err('x + * 2')).toEqual({ code: 'unexpected', pos: 5, text: '*', n: 0 });
    expect(err('x xor 1')).toEqual({ code: 'unexpected', pos: 3, text: 'xor', n: 0 });
    expect(err('x ⊕ 1').code).toBe('unexpected');
    expect(err('x ? 1 , 2')).toEqual({ code: 'unexpected', pos: 7, text: ',', n: 0 });
    expect(err('max(x)')).toEqual({ code: 'args', pos: 1, text: 'max', n: 2 });
    expect(err('abs(x, y)')).toEqual({ code: 'args', pos: 1, text: 'abs', n: 1 });
    expect(err('abs()')).toEqual({ code: 'args', pos: 1, text: 'abs', n: 1 });
    expect(err('x + abs')).toEqual({ code: 'args', pos: 5, text: 'abs', n: 1 });
    expect(err('if(x, 1)')).toEqual({ code: 'args', pos: 1, text: 'if', n: 3 });
    expect(err('max(x, y')).toEqual({ code: 'end', pos: 9, text: '', n: 0 });
    expect(err('max(x y)')).toEqual({ code: 'unexpected', pos: 7, text: 'y', n: 0 });
    expect(err('12345678901')).toEqual({ code: 'number', pos: 1, text: '12345678901', n: 0 });
    expect(err(`x + ${NUMBER_LIMIT + 1}`)).toEqual({ code: 'number', pos: 5, text: String(NUMBER_LIMIT + 1), n: 0 });
  });

  it('limits the nesting depth', () => {
    const nested = (n: number) => `${'('.repeat(n)}x${')'.repeat(n)}`;
    expect(parseFormula(nested(MAX_FORMULA_DEPTH), X).ok).toBe(true);
    expect(err(nested(MAX_FORMULA_DEPTH + 1), X)).toEqual({ code: 'deep', pos: MAX_FORMULA_DEPTH + 1, text: '', n: 0 });
    expect(err('-'.repeat(MAX_FORMULA_DEPTH + 1) + 'x', X).code).toBe('deep');
    expect(parseFormula('-'.repeat(MAX_FORMULA_DEPTH) + 'x', X).ok).toBe(true);
    expect(err('not '.repeat(MAX_FORMULA_DEPTH + 1) + 'b1', BITS).code).toBe('deep');
    expect(err(`${'abs('.repeat(MAX_FORMULA_DEPTH + 1)}x${')'.repeat(MAX_FORMULA_DEPTH + 1)}`, X).code).toBe('deep');
    expect(err('2^'.repeat(MAX_FORMULA_DEPTH + 1) + '2', X).code).toBe('deep');
    expect(err('x?'.repeat(MAX_FORMULA_DEPTH + 1) + '1' + ':1'.repeat(MAX_FORMULA_DEPTH + 1), X).code).toBe('deep');
    // Long flat chains are fine.
    expect(val(Array.from({ length: 99 }, () => '1').join('+'), [0, 0])).toBe(99);
  });

  it('never throws, on any string or non-string', () => {
    const pieces = ['x', 'y', 'b1', 'b4', '(', ')', ',', '?', ':', '+', '-', '*', '/', '^', '²', 'mod', '%', 'and', 'or', 'not', 'xor', 'nand',
      '<', '<=', '==', '!=', '=', '!', '&', '|', '0', '1', '7', '999999999999', 'abs', 'min', 'max', 'S', 'even', 'maj', 'if', ' ', '$', '٣', '😀'];
    fc.assert(
      fc.property(fc.oneof(fc.string({ maxLength: 260 }), fc.string({ unit: 'binary', maxLength: 260 }), fc.array(fc.constantFrom(...pieces), { maxLength: 80 }).map((p) => p.join(''))), fc.constantFrom(X, XY, BITS), (text, dialect) => {
        const parsed = parseFormula(text, dialect);
        if (parsed.ok) {
          for (const values of [[0, 0, 0, 0], [1, 1, 1, 1], [20, 9, 0, 1]]) {
            const value = evaluateFormula(parsed.expr, values);
            expect(value === null || (Number.isInteger(value) && Math.abs(value) <= VALUE_LIMIT)).toBe(true);
          }
        } else {
          expect(parsed.error.pos).toBeGreaterThanOrEqual(0);
          expect(parsed.error.pos).toBeLessThanOrEqual([...text].length + 1);
        }
      }),
      { numRuns: 1500 }
    );
    expect(parseFormula(42 as unknown as string, X).ok).toBe(false);
    expect(parseFormula(null as unknown as string, X).ok).toBe(false);
  });
});

describe('printing and reference evaluation', () => {
  it('pretty-printed random ASTs parse back to the same AST', () => {
    fc.assert(
      fc.property(arithArb(2, 4), (expr) => {
        const text = printFormula(expr, XY);
        fc.pre(text.length <= MAX_FORMULA_LENGTH);
        const parsed = parseFormula(text, XY);
        expect(parsed).toEqual({ ok: true, expr });
      }),
      { numRuns: 600 }
    );
    fc.assert(
      fc.property(logicArb(3), (expr) => {
        const text = printFormula(expr, BITS);
        fc.pre(text.length <= MAX_FORMULA_LENGTH);
        const parsed = parseFormula(text, BITS);
        expect(parsed).toEqual({ ok: true, expr });
      }),
      { numRuns: 400 }
    );
  });

  it('prints the canonical syntax', () => {
    const parsed = parseFormula('2x² - -(y) mod 3 >= 1 ? max(x, y) : not S(x)', XY);
    expect(parsed.ok && printFormula(parsed.expr, XY)).toBe('(((2 * (x ^ 2)) - ((-y) mod 3)) >= 1) ? max(x, y) : (not s(x))');
    const logic = parseFormula('!b1 & b2 | b3 ^ maj(b1, b2, 1)', BITS);
    expect(logic.ok && printFormula(logic.expr, BITS)).toBe('((not b1) and b2) or (b3 xor maj(b1, b2, 1))');
  });

  it('evaluates like an exact BigInt reference implementation', () => {
    fc.assert(
      fc.property(arithArb(2, 5), fc.integer({ min: -30, max: 120 }), fc.integer({ min: -30, max: 120 }), (expr, x, y) => {
        const expected = ref(expr, [x, y]);
        expect(evaluateFormula(expr, [x, y])).toBe(expected === null ? null : Number(expected));
      }),
      { numRuns: 3000 }
    );
    fc.assert(
      fc.property(logicArb(5), fc.array(fc.integer({ min: 0, max: 1 }), { minLength: 4, maxLength: 4 }), (expr, bits) => {
        const expected = ref(expr, bits);
        expect(evaluateFormula(expr, bits)).toBe(expected === null ? null : Number(expected));
      }),
      { numRuns: 1000 }
    );
  });
});
