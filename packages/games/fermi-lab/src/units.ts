/**
 * Units as data (design § 6.3): a small table of physical units over the base dimensions m, kg, s, K, mol, a parser
 * for compound unit strings such as `L/(person·day)` or `kWh/(m²·year)`, and the algebra the model builder needs.
 *
 * Count words (`person`, `grain`, `piano`…) are labels only: dimensionless for the algebra, kept for display.
 * Pure and DOM-free.
 */

/** Exponents of m, kg, s, K, mol. */
export type Dims = readonly [number, number, number, number, number];

export const NO_DIMS: Dims = [0, 0, 0, 0, 0];

interface UnitDef {
  readonly scale: number;
  readonly dims: Dims;
}

const ENERGY: Dims = [2, 1, -2, 0, 0];
const POWER: Dims = [2, 1, -3, 0, 0];

/** Physical units: factor to SI and dimensions. `year` is 365 days. */
export const PHYSICAL_UNITS: Readonly<Record<string, UnitDef>> = {
  '1': { scale: 1, dims: NO_DIMS },
  '%': { scale: 0.01, dims: NO_DIMS },
  mm: { scale: 1e-3, dims: [1, 0, 0, 0, 0] },
  cm: { scale: 1e-2, dims: [1, 0, 0, 0, 0] },
  m: { scale: 1, dims: [1, 0, 0, 0, 0] },
  km: { scale: 1e3, dims: [1, 0, 0, 0, 0] },
  ha: { scale: 1e4, dims: [2, 0, 0, 0, 0] },
  L: { scale: 1e-3, dims: [3, 0, 0, 0, 0] },
  mL: { scale: 1e-6, dims: [3, 0, 0, 0, 0] },
  µL: { scale: 1e-9, dims: [3, 0, 0, 0, 0] },
  g: { scale: 1e-3, dims: [0, 1, 0, 0, 0] },
  kg: { scale: 1, dims: [0, 1, 0, 0, 0] },
  t: { scale: 1e3, dims: [0, 1, 0, 0, 0] },
  s: { scale: 1, dims: [0, 0, 1, 0, 0] },
  min: { scale: 60, dims: [0, 0, 1, 0, 0] },
  h: { scale: 3600, dims: [0, 0, 1, 0, 0] },
  day: { scale: 86_400, dims: [0, 0, 1, 0, 0] },
  year: { scale: 31_536_000, dims: [0, 0, 1, 0, 0] },
  J: { scale: 1, dims: ENERGY },
  kJ: { scale: 1e3, dims: ENERGY },
  MJ: { scale: 1e6, dims: ENERGY },
  Wh: { scale: 3600, dims: ENERGY },
  kWh: { scale: 3.6e6, dims: ENERGY },
  kcal: { scale: 4184, dims: ENERGY },
  W: { scale: 1, dims: POWER },
  kW: { scale: 1e3, dims: POWER },
  Pa: { scale: 1, dims: [-1, 1, -2, 0, 0] },
  K: { scale: 1, dims: [0, 0, 0, 1, 0] },
  mol: { scale: 1, dims: [0, 0, 0, 0, 1] }
};

/**
 * Count words (labels only, dimensionless). Each has a `u.<word>` message key (per-unit form, "g/grain") and plural
 * forms in the content (`counts`, shown after a number).
 */
export const COUNT_WORDS = [
  'ant',
  'battery',
  'beat',
  'bee',
  'birth',
  'breath',
  'cell',
  'charge',
  'earth',
  'egg',
  'grain',
  'hair',
  'household',
  'molecule',
  'orbit',
  'passenger',
  'person',
  'phone',
  'piano',
  'pupil',
  'sheet',
  'step',
  'teacher',
  'tree',
  'trip',
  'tuner',
  'tuning',
  'vehicle',
  'word'
] as const;
export type CountWord = (typeof COUNT_WORDS)[number];

const COUNTS: ReadonlySet<string> = new Set(COUNT_WORDS);

/** Word units that also have a count form after a number ("160 days", "25 years"). */
export const COUNTED_UNITS = ['day', 'year'] as const;

/** Every word with plural forms after a number (`ContentText.counts`). */
export type CountedWord = CountWord | (typeof COUNTED_UNITS)[number];
export const COUNTED_WORDS: readonly CountedWord[] = [...COUNTED_UNITS, ...COUNT_WORDS];

/** Physical unit tokens whose label is translated (`u.<token>`); all other symbols are SI and shown as they are. */
export const WORD_UNITS = ['L', 'mL', 'µL', 't', 's', 'min', 'h', 'day', 'year', 'ha'] as const;

export interface UnitToken {
  readonly name: string;
  /** 1, 2 or 3 (² and ³ in the unit string). */
  readonly pow: number;
}

export interface ParsedUnit {
  readonly scale: number;
  readonly dims: Dims;
  readonly num: readonly UnitToken[];
  readonly den: readonly UnitToken[];
}

const SUPER: Readonly<Record<string, number>> = { '²': 2, '³': 3 };

function parseTokens(text: string): UnitToken[] | null {
  const parts = text.split('·');
  const tokens: UnitToken[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) return null;
    const last = part.at(-1)!;
    const pow = SUPER[last] ?? 1;
    const name = pow === 1 ? part : part.slice(0, -1);
    if (!name || !(Object.hasOwn(PHYSICAL_UNITS, name) || COUNTS.has(name))) return null;
    tokens.push({ name, pow });
  }
  return tokens;
}

const cache = new Map<string, ParsedUnit | null>();

/**
 * Parses `a·b²/(c·d)`: tokens separated by `·`, at most one `/`, the denominator optionally in parentheses, `²`/`³`
 * after a token. Returns null for anything else (unknown token, empty part, nested parentheses). Never throws.
 */
export function parseUnit(unit: string): ParsedUnit | null {
  if (typeof unit !== 'string') return null;
  const hit = cache.get(unit);
  if (hit !== undefined) return hit;
  const result = parseUncached(unit);
  if (cache.size < 500) cache.set(unit, result);
  return result;
}

function parseUncached(unit: string): ParsedUnit | null {
  if (unit.length === 0 || unit.length > 40) return null;
  const slash = unit.split('/');
  if (slash.length > 2) return null;
  const numText = slash[0]!;
  let denText = slash[1];
  if (numText.includes('(') || numText.includes(')')) return null;
  if (denText !== undefined) {
    if (denText.startsWith('(') && denText.endsWith(')')) denText = denText.slice(1, -1);
    if (denText.includes('(') || denText.includes(')')) return null;
  }
  const num = parseTokens(numText);
  const den = denText === undefined ? [] : parseTokens(denText);
  if (!num || !den) return null;
  let scale = 1;
  const dims = [0, 0, 0, 0, 0];
  const apply = (tokens: readonly UnitToken[], sign: number) => {
    for (const { name, pow } of tokens) {
      const def = PHYSICAL_UNITS[name];
      if (!def) continue; // count word
      scale *= def.scale ** (sign * pow);
      def.dims.forEach((d, i) => (dims[i]! += sign * pow * d));
    }
  };
  apply(num, 1);
  apply(den, -1);
  return { scale, dims: dims as unknown as Dims, num: num.filter((t) => t.name !== '1'), den };
}

export const sameDims = (a: Dims, b: Dims): boolean => a.every((d, i) => Math.abs(d - b[i]!) < 1e-9);

export const isCountWord = (name: string): name is CountWord => COUNTS.has(name);

/** One factor of a product: a value in `unit`, raised to `power`. */
export interface ProductTerm {
  readonly value: number;
  readonly unit: string;
  readonly power: number;
}

export interface Product {
  /** The product in SI (count words ignored). */
  readonly si: number;
  readonly dims: Dims;
}

/** Π (value · scale)^power with the summed dimensions; null when a unit does not parse or a value is not positive. */
export function multiply(terms: readonly ProductTerm[]): Product | null {
  let si = 1;
  const dims = [0, 0, 0, 0, 0];
  for (const { value, unit, power } of terms) {
    const parsed = parseUnit(unit);
    if (!parsed || !Number.isFinite(value) || value <= 0) return null;
    si *= (value * parsed.scale) ** power;
    parsed.dims.forEach((d, i) => (dims[i]! += power * d));
  }
  return Number.isFinite(si) && si > 0 ? { si, dims: dims as unknown as Dims } : null;
}

/** A product expressed in `unit` (null when the dimensions differ). */
export function convertTo(product: Product, unit: string): number | null {
  const target = parseUnit(unit);
  if (!target || !sameDims(product.dims, target.dims)) return null;
  return product.si / target.scale;
}

/** Leftover dimensions of `product` relative to `unit` (product ÷ unit). */
export function leftover(product: Product, unit: string): Dims {
  const target = parseUnit(unit);
  const base = target?.dims ?? NO_DIMS;
  return product.dims.map((d, i) => Math.round((d - base[i]!) * 1000) / 1000) as unknown as Dims;
}

const BASE_SYMBOLS = ['m', 'kg', 's', 'K', 'mol'] as const;
const SUP_DIGITS: Readonly<Record<string, string>> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
export const superscript = (n: number): string =>
  String(n)
    .split('')
    .map((c) => SUP_DIGITS[c] ?? c)
    .join('');

/** SI notation of dimensions, e.g. `m²` or `kg·s⁻¹` (language-neutral symbols). */
export function dimsText(dims: Dims): string {
  return dims
    .flatMap((d, i) => (d === 0 ? [] : [`${BASE_SYMBOLS[i]}${d === 1 ? '' : superscript(d)}`]))
    .join('·');
}

/** All tokens of a unit string (for translation checks). */
export function unitTokens(unit: string): string[] {
  const parsed = parseUnit(unit);
  return parsed ? [...parsed.num, ...parsed.den].map((t) => t.name) : [];
}

/**
 * Display of a unit with translated words: `label(name, countForm)` gives a token's label. Count words in the
 * numerator use their count form ("grains"), elsewhere the per-unit form ("g/grain"). A denominator of more than
 * one token is put in parentheses. Dimensionless `1` shows as nothing (or `1/…` when only a denominator exists).
 */
export function unitText(unit: string, label: (name: string, countForm: boolean) => string): string {
  const parsed = parseUnit(unit);
  if (!parsed) return unit;
  const tok = (t: UnitToken, countForm: boolean) => `${label(t.name, countForm)}${t.pow === 1 ? '' : superscript(t.pow)}`;
  const num = parsed.num.map((t) => tok(t, true)).join('·');
  if (parsed.den.length === 0) return num;
  const den = parsed.den.map((t) => tok(t, false)).join('·');
  return `${num || '1'}/${parsed.den.length > 1 ? `(${den})` : den}`;
}
