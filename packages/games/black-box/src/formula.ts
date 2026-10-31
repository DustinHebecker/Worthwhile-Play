/**
 * A tiny, safe formula language for stating a Black Box rule (no `eval`, no `Function`).
 *
 * Two dialects share one tokenizer, AST and evaluator:
 *
 * **Arithmetic** (inputs x or x, y; integer values only), lowest to highest precedence:
 *   - `c ? a : b` (right associative) — also `if(c, a, b)`
 *   - `or` `||` `|` · `and` `&&` `&` · prefix `not` `!` (Python-like: binds looser than comparisons)
 *   - comparisons `<` `<=` `>` `>=` `==` (`=`) `!=` (`<>`) — true is 1, false is 0
 *   - `+` `-` · `*` (`×` `·`) `/` (`÷`, rounds down) `mod` (`%`, remainder with the divisor's sign)
 *   - prefix `-` `+` · `^` power (right associative, binds tighter than prefix minus) · postfix `²`
 *   - numbers, `x`, `y`, `(…)`, `abs(a)`, `min(a, b)`, `max(a, b)`, `S(a)`/`digitsum(a)`
 *     (digit sum), `even(a)`, `odd(a)`; a number directly followed by a name or `(` multiplies
 *     (`2x`, `3(x + 1)`).
 *   Conditions are numbers: 0 is false, everything else is true. `and`/`or`/`?:` only evaluate
 *   what they need (so `x > 0 and 10 / x > 2` is defined for x = 0).
 *
 * **Logic** (inputs b1…bn, values 0 and 1), lowest to highest precedence:
 *   - `or` `|` `||` `∨` `nor` · `xor` `^` `⊕` `xnor` · `and` `&` `&&` `∧` `nand`
 *   - prefix `not` `!` `¬` `~` · `0`, `1`, `b1`…, `(…)`, `maj(a, b, c)`
 *
 * Names and keywords are case-insensitive. Unicode minus, ×, ÷, ≤, ≥, ≠ and the usual
 * non-ASCII digit blocks are accepted, so the syntax works with every keyboard.
 *
 * Every public function is total: it never throws. Undefined values (division by zero,
 * a negative exponent, a magnitude beyond {@link VALUE_LIMIT}) evaluate to `null`.
 */

export const MAX_FORMULA_LENGTH = 200;
/** Maximum nesting of parentheses, function calls and prefix operators. */
export const MAX_FORMULA_DEPTH = 24;
/** Largest number literal. */
export const NUMBER_LIMIT = 1_000_000_000;
/** Intermediate results beyond this magnitude make the formula undefined for that input. */
export const VALUE_LIMIT = 1_000_000_000_000;

export interface Dialect {
  readonly logic: boolean;
  /** Lower-case variable names, in input order. */
  readonly vars: readonly string[];
}

export type BinOp = '+' | '-' | '*' | '/' | 'mod' | '^' | '<' | '<=' | '>' | '>=' | '==' | '!=' | 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor';
export type FnName = 'abs' | 'min' | 'max' | 's' | 'even' | 'odd' | 'maj';

export type Expr =
  | { readonly t: 'num'; readonly v: number }
  | { readonly t: 'var'; readonly i: number }
  | { readonly t: 'neg' | 'not'; readonly a: Expr }
  | { readonly t: 'bin'; readonly op: BinOp; readonly a: Expr; readonly b: Expr }
  | { readonly t: 'if'; readonly c: Expr; readonly a: Expr; readonly b: Expr }
  | { readonly t: 'call'; readonly f: FnName; readonly args: readonly Expr[] };

export type FormulaErrorCode = 'empty' | 'tooLong' | 'char' | 'name' | 'unexpected' | 'end' | 'args' | 'deep' | 'number';

export interface FormulaError {
  readonly code: FormulaErrorCode;
  /** 1-based character position (code points), 0 when not applicable. */
  readonly pos: number;
  /** The offending text (character, name or token). */
  readonly text: string;
  /** Expected argument count for `args`. */
  readonly n: number;
}

export type ParseResult = { readonly ok: true; readonly expr: Expr } | { readonly ok: false; readonly error: FormulaError };

// --- Digits --------------------------------------------------------------------------------

/** Digit blocks that users may type with their locale's keyboard (Arabic-Indic, Persian, Devanagari, full-width). */
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x0966, 0xff10];

/** Value 0–9 of a digit character of any supported block, or -1. */
export function digitValue(ch: string): number {
  const code = ch.codePointAt(0) ?? -1;
  if (code >= 48 && code <= 57) return code - 48;
  const zero = DIGIT_ZEROS.find((z) => code >= z && code <= z + 9);
  return zero === undefined ? -1 : code - zero;
}

export function normalizeDigits(text: string): string {
  let result = '';
  for (const ch of text) {
    const d = digitValue(ch);
    result += d < 0 || (ch >= '0' && ch <= '9') ? ch : String(d);
  }
  return result;
}

// --- Tokenizer -----------------------------------------------------------------------------

type Token =
  | { readonly k: 'num'; readonly v: number; readonly pos: number; readonly text: string }
  | { readonly k: 'name'; readonly s: string; readonly pos: number; readonly text: string }
  | { readonly k: 'op'; readonly s: string; readonly pos: number; readonly text: string }
  | { readonly k: 'end'; readonly pos: number; readonly text: string };

/** Multi-character symbols first (longest match wins). Maps to canonical operator names. */
const SYMBOLS: readonly (readonly [string, string])[] = [
  ['<=', '<='], ['>=', '>='], ['==', '=='], ['!=', '!='], ['<>', '!='], ['&&', 'and'], ['||', 'or'],
  ['+', '+'], ['-', '-'], ['−', '-'], ['–', '-'], ['﹣', '-'], ['－', '-'], ['*', '*'], ['×', '*'], ['·', '*'], ['⋅', '*'], ['∙', '*'],
  ['/', '/'], ['÷', '/'], ['%', 'mod'], ['^', '^'], ['²', '²'], ['<', '<'], ['>', '>'], ['=', '=='], ['≤', '<='], ['≥', '>='], ['≠', '!='],
  ['&', 'and'], ['∧', 'and'], ['|', 'or'], ['∨', 'or'], ['!', 'not'], ['¬', 'not'], ['~', 'not'], ['⊕', 'xor'],
  ['?', '?'], [':', ':'], [',', ','], ['(', '('], [')', ')']
];
const KEYWORDS = new Set(['and', 'or', 'not', 'xor', 'nand', 'nor', 'xnor', 'mod']);

const isSpace = (ch: string) => /\s/u.test(ch);
const isLetter = (ch: string) => /^[A-Za-z_]$/.test(ch);

class FormulaFailure {
  constructor(readonly error: FormulaError) {}
}

const fail = (code: FormulaErrorCode, pos: number, text = '', n = 0): never => {
  throw new FormulaFailure({ code, pos, text, n });
};

function tokenize(text: string): Token[] {
  const chars = [...text];
  const tokens: Token[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i] as string;
    const pos = i + 1;
    if (isSpace(ch)) {
      i++;
    } else if (digitValue(ch) >= 0) {
      let value = 0;
      let raw = '';
      while (i < chars.length && digitValue(chars[i] as string) >= 0) {
        value = Math.min(value * 10 + digitValue(chars[i] as string), NUMBER_LIMIT + 1);
        raw += chars[i++] as string;
      }
      if (value > NUMBER_LIMIT) fail('number', pos, raw);
      tokens.push({ k: 'num', v: value, pos, text: raw });
    } else if (isLetter(ch)) {
      let raw = '';
      while (i < chars.length && (isLetter(chars[i] as string) || /^[0-9]$/.test(chars[i] as string))) raw += chars[i++] as string;
      const lower = raw.toLowerCase();
      tokens.push(KEYWORDS.has(lower) ? { k: 'op', s: lower, pos, text: raw } : { k: 'name', s: lower, pos, text: raw });
    } else {
      const rest = chars.slice(i, i + 2).join('');
      const match = SYMBOLS.find(([symbol]) => rest.startsWith(symbol));
      if (!match) fail('char', pos, ch);
      const [symbol, canonical] = match as readonly [string, string];
      tokens.push({ k: 'op', s: canonical, pos, text: symbol });
      i += [...symbol].length;
    }
  }
  tokens.push({ k: 'end', pos: chars.length + 1, text: '' });
  return tokens;
}

// --- Parser --------------------------------------------------------------------------------

const ARITH_FUNCTIONS: Readonly<Record<string, readonly [FnName | 'if', number]>> = {
  abs: ['abs', 1],
  min: ['min', 2],
  max: ['max', 2],
  s: ['s', 1],
  digitsum: ['s', 1],
  even: ['even', 1],
  odd: ['odd', 1],
  if: ['if', 3]
};
const LOGIC_FUNCTIONS: Readonly<Record<string, readonly [FnName | 'if', number]>> = { maj: ['maj', 3] };
const COMPARISONS = new Set(['<', '<=', '>', '>=', '==', '!=']);

class Parser {
  private index = 0;
  private depth = 0;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly dialect: Dialect
  ) {}

  parse(): Expr {
    const expr = this.dialect.logic ? this.logicOr() : this.ternary();
    const next = this.peek();
    if (next.k !== 'end') this.unexpected(next);
    return expr;
  }

  private peek(): Token {
    return this.tokens[this.index] as Token;
  }

  private next(): Token {
    const token = this.peek();
    if (token.k !== 'end') this.index++;
    return token;
  }

  private isOp(...ops: string[]): boolean {
    const token = this.peek();
    return token.k === 'op' && ops.includes(token.s);
  }

  private unexpected(token: Token): never {
    return token.k === 'end' ? fail('end', token.pos) : fail('unexpected', token.pos, token.text);
  }

  private expect(op: string): void {
    if (!this.isOp(op)) this.unexpected(this.peek());
    this.index++;
  }

  private nest<T>(pos: number, inner: () => T): T {
    if (++this.depth > MAX_FORMULA_DEPTH) fail('deep', pos);
    const result = inner();
    this.depth--;
    return result;
  }

  // Arithmetic --------------------------------------------------------------------------------

  private ternary(): Expr {
    const c = this.or();
    if (!this.isOp('?')) return c;
    const pos = this.next().pos;
    return this.nest(pos, () => {
      const a = this.ternary();
      this.expect(':');
      const b = this.ternary();
      return { t: 'if', c, a, b } as Expr;
    });
  }

  private or(): Expr {
    let a = this.and();
    while (this.isOp('or')) {
      this.next();
      a = { t: 'bin', op: 'or', a, b: this.and() };
    }
    return a;
  }

  private and(): Expr {
    let a = this.not();
    while (this.isOp('and')) {
      this.next();
      a = { t: 'bin', op: 'and', a, b: this.not() };
    }
    return a;
  }

  private not(): Expr {
    if (!this.isOp('not')) return this.comparison();
    const pos = this.next().pos;
    return this.nest(pos, () => ({ t: 'not', a: this.not() }) as Expr);
  }

  private comparison(): Expr {
    let a = this.additive();
    for (let token = this.peek(); token.k === 'op' && COMPARISONS.has(token.s); token = this.peek()) {
      this.next();
      a = { t: 'bin', op: token.s as BinOp, a, b: this.additive() };
    }
    return a;
  }

  private additive(): Expr {
    let a = this.multiplicative();
    for (let token = this.peek(); token.k === 'op' && (token.s === '+' || token.s === '-'); token = this.peek()) {
      this.next();
      a = { t: 'bin', op: token.s as BinOp, a, b: this.multiplicative() };
    }
    return a;
  }

  private multiplicative(): Expr {
    let a = this.unary();
    for (;;) {
      const token = this.peek();
      if (token.k === 'op' && (token.s === '*' || token.s === '/' || token.s === 'mod')) {
        this.next();
        a = { t: 'bin', op: token.s as BinOp, a, b: this.unary() };
      } else if (this.tokens[this.index - 1]?.k === 'num' && (token.k === 'name' || (token.k === 'op' && token.s === '('))) {
        // Implicit multiplication after a number literal: 2x, 3(x + 1).
        a = { t: 'bin', op: '*', a, b: this.unary() };
      } else {
        return a;
      }
    }
  }

  private unary(): Expr {
    if (!this.isOp('-', '+')) return this.power();
    const token = this.next();
    return this.nest(token.pos, () => {
      const a = this.unary();
      return token.k === 'op' && token.s === '-' ? ({ t: 'neg', a } as Expr) : a;
    });
  }

  private power(): Expr {
    const base = this.postfix();
    if (!this.isOp('^')) return base;
    const pos = this.next().pos;
    return this.nest(pos, () => ({ t: 'bin', op: '^', a: base, b: this.unary() }) as Expr);
  }

  private postfix(): Expr {
    let a = this.primary();
    while (this.isOp('²')) {
      this.next();
      a = { t: 'bin', op: '^', a, b: { t: 'num', v: 2 } };
    }
    return a;
  }

  private primary(): Expr {
    const token = this.next();
    if (token.k === 'num') return { t: 'num', v: token.v };
    if (token.k === 'op' && token.s === '(') {
      return this.nest(token.pos, () => {
        const inner = this.ternary();
        this.expect(')');
        return inner;
      });
    }
    if (token.k === 'name') return this.named(token, ARITH_FUNCTIONS, () => this.ternary());
    return this.unexpected(token);
  }

  // Logic -------------------------------------------------------------------------------------

  private logicOr(): Expr {
    let a = this.logicXor();
    while (this.isOp('or', 'nor')) {
      const op = this.next() as { s: BinOp };
      a = { t: 'bin', op: op.s, a, b: this.logicXor() };
    }
    return a;
  }

  private logicXor(): Expr {
    let a = this.logicAnd();
    while (this.isOp('xor', '^', 'xnor')) {
      const op = this.next() as { s: string };
      a = { t: 'bin', op: op.s === 'xnor' ? 'xnor' : 'xor', a, b: this.logicAnd() };
    }
    return a;
  }

  private logicAnd(): Expr {
    let a = this.logicNot();
    while (this.isOp('and', 'nand')) {
      const op = this.next() as { s: BinOp };
      a = { t: 'bin', op: op.s, a, b: this.logicNot() };
    }
    return a;
  }

  private logicNot(): Expr {
    if (!this.isOp('not')) return this.logicPrimary();
    const pos = this.next().pos;
    return this.nest(pos, () => ({ t: 'not', a: this.logicNot() }) as Expr);
  }

  private logicPrimary(): Expr {
    const token = this.next();
    if (token.k === 'num') return token.v <= 1 ? { t: 'num', v: token.v } : fail('unexpected', token.pos, token.text);
    if (token.k === 'op' && token.s === '(') {
      return this.nest(token.pos, () => {
        const inner = this.logicOr();
        this.expect(')');
        return inner;
      });
    }
    if (token.k === 'name') return this.named(token, LOGIC_FUNCTIONS, () => this.logicOr());
    return this.unexpected(token);
  }

  // Shared ------------------------------------------------------------------------------------

  private named(token: Token & { k: 'name' }, functions: Readonly<Record<string, readonly [FnName | 'if', number]>>, argument: () => Expr): Expr {
    const variable = this.dialect.vars.indexOf(token.s);
    if (variable >= 0) return { t: 'var', i: variable };
    const fn = Object.hasOwn(functions, token.s) ? functions[token.s] : undefined;
    if (!fn) return fail('name', token.pos, token.text);
    const [name, count] = fn;
    if (!this.isOp('(')) return fail('args', token.pos, token.text, count);
    this.next();
    return this.nest(token.pos, () => {
      const args: Expr[] = [];
      if (!this.isOp(')')) {
        args.push(argument());
        while (this.isOp(',')) {
          this.next();
          args.push(argument());
        }
      }
      if (args.length !== count && (this.isOp(')') || this.peek().k === 'end')) fail('args', token.pos, token.text, count);
      this.expect(')');
      if (name === 'if') return { t: 'if', c: args[0] as Expr, a: args[1] as Expr, b: args[2] as Expr } as Expr;
      return { t: 'call', f: name, args } as Expr;
    });
  }
}

/** Parses a formula. Never throws. */
export function parseFormula(text: string, dialect: Dialect): ParseResult {
  try {
    if (typeof text !== 'string') return { ok: false, error: { code: 'empty', pos: 0, text: '', n: 0 } };
    if (text.length > MAX_FORMULA_LENGTH) return { ok: false, error: { code: 'tooLong', pos: 0, text: '', n: MAX_FORMULA_LENGTH } };
    if (text.trim() === '') return { ok: false, error: { code: 'empty', pos: 0, text: '', n: 0 } };
    return { ok: true, expr: new Parser(tokenize(text), dialect).parse() };
  } catch (failure) {
    if (failure instanceof FormulaFailure) return { ok: false, error: failure.error };
    return { ok: false, error: { code: 'deep', pos: 0, text: '', n: 0 } };
  }
}

// --- Evaluation ----------------------------------------------------------------------------

const bounded = (value: number): number | null => (Math.abs(value) <= VALUE_LIMIT ? value + 0 : null);
const truth = (value: boolean): number => (value ? 1 : 0);

function digitSum(value: number): number {
  let sum = 0;
  for (let rest = Math.abs(value); rest > 0; rest = Math.floor(rest / 10)) sum += rest % 10;
  return sum;
}

function power(base: number, exponent: number): number | null {
  if (exponent < 0) return null;
  if (base === 0 || base === 1) return exponent === 0 ? 1 : base;
  if (base === -1) return exponent % 2 === 0 ? 1 : -1;
  let result = 1;
  for (let i = 0; i < exponent; i++) {
    result *= base;
    if (Math.abs(result) > VALUE_LIMIT) return null;
  }
  return result;
}

function binary(op: BinOp, a: number, b: number): number | null {
  switch (op) {
    case '+':
      return bounded(a + b);
    case '-':
      return bounded(a - b);
    case '*':
      return bounded(a * b);
    case '/':
      return b === 0 ? null : bounded(Math.floor(a / b));
    case 'mod':
      return b === 0 ? null : bounded(a - b * Math.floor(a / b));
    case '^':
      return power(a, b);
    case '<':
      return truth(a < b);
    case '<=':
      return truth(a <= b);
    case '>':
      return truth(a > b);
    case '>=':
      return truth(a >= b);
    case '==':
      return truth(a === b);
    case '!=':
      return truth(a !== b);
    case 'xor':
      return truth((a !== 0) !== (b !== 0));
    case 'nand':
      return truth(!(a !== 0 && b !== 0));
    case 'nor':
      return truth(!(a !== 0 || b !== 0));
    case 'xnor':
      return truth((a !== 0) === (b !== 0));
    default:
      // 'and' / 'or' are short-circuited in evaluateFormula.
      return null;
  }
}

function call(f: FnName, args: readonly number[]): number | null {
  const [a = 0, b = 0, c = 0] = args;
  switch (f) {
    case 'abs':
      return Math.abs(a);
    case 'min':
      return Math.min(a, b);
    case 'max':
      return Math.max(a, b);
    case 's':
      return digitSum(a);
    case 'even':
      return truth(a % 2 === 0);
    case 'odd':
      return truth(a % 2 !== 0);
    case 'maj':
      return truth(truth(a !== 0) + truth(b !== 0) + truth(c !== 0) >= 2);
  }
}

/** Evaluates a parsed formula for the given variable values. `null` = undefined there. Never throws. */
export function evaluateFormula(expr: Expr, values: readonly number[]): number | null {
  switch (expr.t) {
    case 'num':
      return expr.v;
    case 'var':
      return values[expr.i] ?? null;
    case 'neg': {
      const a = evaluateFormula(expr.a, values);
      return a === null ? null : 0 - a;
    }
    case 'not': {
      const a = evaluateFormula(expr.a, values);
      return a === null ? null : truth(a === 0);
    }
    case 'if': {
      const c = evaluateFormula(expr.c, values);
      return c === null ? null : evaluateFormula(c !== 0 ? expr.a : expr.b, values);
    }
    case 'call': {
      const args: number[] = [];
      for (const arg of expr.args) {
        const value = evaluateFormula(arg, values);
        if (value === null) return null;
        args.push(value);
      }
      return call(expr.f, args);
    }
    case 'bin': {
      const a = evaluateFormula(expr.a, values);
      if (a === null) return null;
      if (expr.op === 'and' && a === 0) return 0;
      if (expr.op === 'or' && a !== 0) return 1;
      const b = evaluateFormula(expr.b, values);
      if (b === null) return null;
      if (expr.op === 'and' || expr.op === 'or') return truth(b !== 0);
      return binary(expr.op, a, b);
    }
  }
}

// --- Printing ------------------------------------------------------------------------------

const isAtom = (expr: Expr) => expr.t === 'num' || expr.t === 'var' || expr.t === 'call';

/** Prints a formula in canonical ASCII syntax with explicit parentheses; parses back to the same AST. */
export function printFormula(expr: Expr, dialect: Dialect): string {
  const wrap = (e: Expr) => (isAtom(e) ? printFormula(e, dialect) : `(${printFormula(e, dialect)})`);
  switch (expr.t) {
    case 'num':
      return String(expr.v);
    case 'var':
      return dialect.vars[expr.i] ?? '?';
    case 'neg':
      return `-${wrap(expr.a)}`;
    case 'not':
      return `not ${wrap(expr.a)}`;
    case 'if':
      return `${wrap(expr.c)} ? ${wrap(expr.a)} : ${wrap(expr.b)}`;
    case 'call':
      return `${expr.f}(${expr.args.map((arg) => printFormula(arg, dialect)).join(', ')})`;
    case 'bin':
      return `${wrap(expr.a)} ${expr.op} ${wrap(expr.b)}`;
  }
}
