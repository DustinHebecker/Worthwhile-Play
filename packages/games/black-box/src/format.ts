/**
 * Pure, DOM-free formatting and parsing helpers for the Black Box view.
 * Mathematical notation (formulas, lists, bits) is language-neutral; rules that need
 * words are returned as a message key plus parameters.
 */
import { COMPARATORS, FAMILIES, GATES, PREDICTION_LIMIT, otherBits, type Input, type InputSpec, type Output, type OutputKind, type Rule } from './rules';

export const MINUS = '−';

export function formatNumber(n: number): string {
  return n < 0 ? `${MINUS}${Math.abs(n)}` : String(n);
}

export const bitName = (index: number): string => `b${index + 1}`;

export function formatInput(spec: InputSpec, input: Input): string {
  switch (spec.kind) {
    case 'int':
      return formatNumber(input[0] ?? 0);
    case 'pair':
      return `(${input.map(formatNumber).join(', ')})`;
    case 'bits':
      return input.join(' ');
    case 'list':
      return formatList(input);
  }
}

export function formatList(list: readonly number[]): string {
  return list.length === 0 ? '[ ]' : `[${list.map(formatNumber).join(', ')}]`;
}

export function formatOutput(kind: OutputKind, output: Output): string {
  if (typeof output === 'number') return kind === 'bool' ? String(output) : formatNumber(output);
  return formatList(output);
}

/** Header for the input column, e.g. `x`, `(x, y)`, `b1 b2 b3`, `[list]`. */
export function inputHeader(spec: InputSpec): string {
  switch (spec.kind) {
    case 'int':
      return 'x';
    case 'pair':
      return '(x, y)';
    case 'bits':
      return Array.from({ length: spec.count }, (_, i) => bitName(i)).join(' ');
    case 'list':
      return '[…]';
  }
}

/**
 * Formats Σ coef·symbol + constant with conventional signs: coefficient 1 is omitted,
 * zero terms are skipped and subtraction uses a proper minus sign.
 */
export function formatPolynomial(terms: readonly (readonly [number, string])[], constant: number): string {
  let text = '';
  const add = (coef: number, body: string) => {
    if (coef === 0) return;
    const magnitude = Math.abs(coef);
    const part = body === '' ? String(magnitude) : magnitude === 1 ? body : `${magnitude}·${body}`;
    if (text === '') text = coef < 0 ? `${MINUS}${part}` : part;
    else text += coef < 0 ? ` ${MINUS} ${part}` : ` + ${part}`;
  };
  for (const [coef, symbol] of terms) add(coef, symbol);
  add(constant, '');
  return text === '' ? '0' : text;
}

export type RuleDescription = { readonly formula: string } | { readonly key: string; readonly params: Readonly<Record<string, string | number>> };

const p = (rule: Rule, i: number): number => rule.params[i] as number;

export function describeRule(rule: Rule): RuleDescription {
  switch (rule.family) {
    case 'linear':
      return { formula: `f(x) = ${formatPolynomial([[p(rule, 0), 'x']], p(rule, 1))}` };
    case 'square':
      return { formula: `f(x) = ${formatPolynomial([[1, 'x²']], p(rule, 0))}` };
    case 'mod':
      return { formula: `f(x) = x mod ${p(rule, 0)}` };
    case 'step':
      return { formula: `x < ${p(rule, 0)}: f(x) = ${p(rule, 1)};  x ≥ ${p(rule, 0)}: f(x) = ${p(rule, 2)}` };
    case 'parity':
      return { key: 'rule.parity', params: { odd: formatPolynomial([[p(rule, 0), 'x']], p(rule, 1)) } };
    case 'digitsum':
      return { formula: `f(x) = ${formatPolynomial([[p(rule, 0), 'S(x)']], p(rule, 1))}` };
    case 'affinemod':
      return { formula: `f(x) = (${formatPolynomial([[p(rule, 0), 'x']], p(rule, 1))}) mod ${p(rule, 2)}` };
    case 'pairselect': {
      const base = ['max(x, y)', 'min(x, y)', `|x ${MINUS} y|`][p(rule, 0)] ?? '';
      return { formula: `f(x, y) = ${formatPolynomial([[1, base]], p(rule, 1))}` };
    }
    case 'pairproduct':
      return { formula: `f(x, y) = ${formatPolynomial([[1, 'x·y'], [p(rule, 0), 'x'], [p(rule, 1), 'y']], p(rule, 2))}` };
    case 'gate':
      return { formula: `f = ${bitName(p(rule, 1))} ${GATES[p(rule, 0)] ?? ''} ${bitName(p(rule, 2))}` };
    case 'gates2': {
      const [i, j] = otherBits(p(rule, 2));
      return { formula: `f = (${bitName(i)} ${GATES[p(rule, 0)] ?? ''} ${bitName(j)}) ${GATES[p(rule, 1)] ?? ''} ${bitName(p(rule, 2))}` };
    }
    case 'majority': {
      const bits = [0, 1, 2, 3].filter((i) => i !== p(rule, 0)).map(bitName).join(', ');
      return { formula: `f = ${p(rule, 1) === 1 ? 'NOT ' : ''}MAJ(${bits})` };
    }
    case 'filterref':
      return { key: p(rule, 1) === 0 ? 'rule.filterref.first' : 'rule.filterref.last', params: { op: COMPARATORS[p(rule, 0)] ?? '' } };
    case 'filterconst':
      return { key: 'rule.filterconst', params: { op: COMPARATORS[p(rule, 0)] ?? '', t: p(rule, 1) } };
    case 'sorttake':
      return { key: p(rule, 0) === 0 ? 'rule.sorttake.asc' : 'rule.sorttake.desc', params: { m: p(rule, 1) } };
  }
}

/** Output kind of a rule family (re-exported for the view). */
export const outputKindOf = (rule: Rule): OutputKind => FAMILIES[rule.family].output;

// --- Parsing typed predictions --------------------------------------------------------------

/** Digit blocks that users may type with their locale's keyboard (Arabic-Indic, Persian, Devanagari, full-width). */
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x0966, 0xff10];

export function normalizeDigits(text: string): string {
  let result = '';
  for (const ch of text) {
    const code = ch.codePointAt(0) as number;
    const zero = DIGIT_ZEROS.find((z) => code >= z && code <= z + 9);
    result += zero === undefined ? ch : String(code - zero);
  }
  return result;
}

/** Parses a typed whole number (accepts locale digits and minus signs). Returns `null` if invalid. */
export function parseInteger(text: string): number | null {
  const normalized = normalizeDigits(text.trim()).replace(/^[−﹣－]/, '-');
  if (!/^-?\d{1,10}$/.test(normalized)) return null;
  const value = Number(normalized);
  return Math.abs(value) <= PREDICTION_LIMIT ? (Object.is(value, -0) ? 0 : value) : null;
}

/**
 * Parses a typed list of single digits ("3 5 7", "3,5,7" or "357"). Separators are spaces
 * and common punctuation; anything else makes the text invalid. Empty text is the empty list.
 */
export function parseDigitList(text: string, maxLength: number): number[] | null {
  const cleaned = normalizeDigits(text).replace(/[\s,;.、，،؛[\]()]/g, '');
  if (!/^\d*$/.test(cleaned) || cleaned.length > maxLength) return null;
  return [...cleaned].map(Number);
}
