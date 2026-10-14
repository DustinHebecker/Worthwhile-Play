import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { describeRule, formatInput, formatList, formatNumber, formatOutput, formatPolynomial, inputHeader, normalizeDigits, parseDigitList, parseInteger, MINUS } from '../src/format';
import { FAMILIES, FAMILY_IDS, familyParams, type FamilyId } from '../src/rules';
import { messages } from '../src/messages';

describe('number and value formatting', () => {
  it('uses a real minus sign', () => {
    expect(formatNumber(5)).toBe('5');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-12)).toBe(`${MINUS}12`);
  });

  it('formats inputs per domain kind', () => {
    expect(formatInput(FAMILIES.linear.input, [7])).toBe('7');
    expect(formatInput(FAMILIES.pairproduct.input, [3, 0])).toBe('(3, 0)');
    expect(formatInput(FAMILIES.gate.input, [1, 0, 0, 1])).toBe('1 0 0 1');
    expect(formatInput(FAMILIES.sorttake.input, [4, 0, 9, 1, 1])).toBe('[4, 0, 9, 1, 1]');
    expect(inputHeader(FAMILIES.linear.input)).toBe('x');
    expect(inputHeader(FAMILIES.pairselect.input)).toBe('(x, y)');
    expect(inputHeader(FAMILIES.gates2.input)).toBe('b1 b2 b3');
    expect(inputHeader(FAMILIES.filterref.input)).toBe('[…]');
  });

  it('formats outputs per output kind', () => {
    expect(formatOutput('int', -3)).toBe(`${MINUS}3`);
    expect(formatOutput('bool', 1)).toBe('1');
    expect(formatOutput('list', [])).toBe('[ ]');
    expect(formatOutput('list', [2, 5])).toBe('[2, 5]');
    expect(formatList([0])).toBe('[0]');
  });
});

describe('formatPolynomial', () => {
  it('follows usual sign and coefficient conventions', () => {
    expect(formatPolynomial([[3, 'x']], 2)).toBe('3·x + 2');
    expect(formatPolynomial([[3, 'x']], -2)).toBe(`3·x ${MINUS} 2`);
    expect(formatPolynomial([[-3, 'x']], 4)).toBe(`${MINUS}3·x + 4`);
    expect(formatPolynomial([[1, 'x']], 0)).toBe('x');
    expect(formatPolynomial([[-1, 'x']], 0)).toBe(`${MINUS}x`);
    expect(formatPolynomial([[1, 'x·y'], [0, 'x'], [-1, 'y']], 0)).toBe(`x·y ${MINUS} y`);
    expect(formatPolynomial([[1, 'x·y'], [2, 'x'], [1, 'y']], 3)).toBe('x·y + 2·x + y + 3');
    expect(formatPolynomial([[0, 'x']], 0)).toBe('0');
    expect(formatPolynomial([[0, 'x']], -4)).toBe(`${MINUS}4`);
  });
});

describe('describeRule', () => {
  const formula = (family: FamilyId, params: number[]) => {
    const d = describeRule({ family, params });
    return 'formula' in d ? d.formula : null;
  };

  it('writes formulas for mathematical rules', () => {
    expect(formula('linear', [2, 1])).toBe('f(x) = 2·x + 1');
    expect(formula('square', [-3])).toBe(`f(x) = x² ${MINUS} 3`);
    expect(formula('square', [0])).toBe('f(x) = x²');
    expect(formula('mod', [4])).toBe('f(x) = x mod 4');
    expect(formula('step', [9, 2, 6])).toBe('x < 9: f(x) = 2;  x ≥ 9: f(x) = 6');
    expect(formula('digitsum', [1, 0])).toBe('f(x) = S(x)');
    expect(formula('digitsum', [3, 2])).toBe('f(x) = 3·S(x) + 2');
    expect(formula('affinemod', [3, 0, 7])).toBe('f(x) = (3·x) mod 7');
    expect(formula('affinemod', [1, 2, 5])).toBe('f(x) = (x + 2) mod 5');
    expect(formula('pairselect', [0, 0])).toBe('f(x, y) = max(x, y)');
    expect(formula('pairselect', [1, 2])).toBe('f(x, y) = min(x, y) + 2');
    expect(formula('pairselect', [2, 1])).toBe(`f(x, y) = |x ${MINUS} y| + 1`);
    expect(formula('pairproduct', [0, -1, 0])).toBe(`f(x, y) = x·y ${MINUS} y`);
    expect(formula('gate', [2, 0, 3])).toBe('f = b1 XOR b4');
    expect(formula('gate', [5, 1, 2])).toBe('f = b2 XNOR b3');
    expect(formula('gates2', [0, 2, 1])).toBe('f = (b1 AND b3) XOR b2');
    expect(formula('majority', [2, 0])).toBe('f = MAJ(b1, b2, b4)');
    expect(formula('majority', [0, 1])).toBe('f = NOT MAJ(b2, b3, b4)');
  });

  it('uses message keys for rules that need words', () => {
    expect(describeRule({ family: 'parity', params: [3, 1] })).toEqual({ key: 'rule.parity', params: { odd: '3·x + 1' } });
    expect(describeRule({ family: 'filterref', params: [0, 0] })).toEqual({ key: 'rule.filterref.first', params: { op: '>' } });
    expect(describeRule({ family: 'filterref', params: [3, 1] })).toEqual({ key: 'rule.filterref.last', params: { op: '≤' } });
    expect(describeRule({ family: 'filterconst', params: [1, 4] })).toEqual({ key: 'rule.filterconst', params: { op: '<', t: 4 } });
    expect(describeRule({ family: 'sorttake', params: [0, 2] })).toEqual({ key: 'rule.sorttake.asc', params: { m: 2 } });
    expect(describeRule({ family: 'sorttake', params: [1, 5] })).toEqual({ key: 'rule.sorttake.desc', params: { m: 5 } });
  });

  it('describes every parameterization, with existing message keys', () => {
    for (const family of FAMILY_IDS) {
      for (const params of familyParams(family)) {
        const d = describeRule({ family, params });
        if ('formula' in d) expect(d.formula).not.toMatch(/undefined|NaN/);
        else expect(messages.en?.[d.key], d.key).toBeTruthy();
      }
      expect(messages.en?.[`family.${family}`], family).toBeTruthy();
    }
  });
});

describe('parsing typed predictions', () => {
  it('normalizes locale digits', () => {
    expect(normalizeDigits('٣٤')).toBe('34');
    expect(normalizeDigits('۷')).toBe('7');
    expect(normalizeDigits('१२')).toBe('12');
    expect(normalizeDigits('１０')).toBe('10');
    expect(normalizeDigits('a9')).toBe('a9');
  });

  it('parses whole numbers', () => {
    expect(parseInteger('12')).toBe(12);
    expect(parseInteger(' -7 ')).toBe(-7);
    expect(parseInteger(`${MINUS}7`)).toBe(-7);
    expect(parseInteger('-0')).toBe(0);
    expect(Object.is(parseInteger('-0'), -0)).toBe(false);
    expect(parseInteger('٤٢')).toBe(42);
    expect(parseInteger('')).toBeNull();
    expect(parseInteger('-')).toBeNull();
    expect(parseInteger('1.5')).toBeNull();
    expect(parseInteger('1e3')).toBeNull();
    expect(parseInteger('12a')).toBeNull();
    expect(parseInteger('1000000000')).toBe(1_000_000_000);
    expect(parseInteger('1000000001')).toBeNull();
    expect(parseInteger('99999999999')).toBeNull();
  });

  it('round-trips integers', () => {
    fc.assert(fc.property(fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }), (n) => {
      expect(parseInteger(String(n))).toBe(n);
    }));
  });

  it('parses digit lists with common separators', () => {
    expect(parseDigitList('3 5 7', 5)).toEqual([3, 5, 7]);
    expect(parseDigitList('357', 5)).toEqual([3, 5, 7]);
    expect(parseDigitList('[3, 5, 7]', 5)).toEqual([3, 5, 7]);
    expect(parseDigitList('3،5', 5)).toEqual([3, 5]);
    expect(parseDigitList('३ ५', 5)).toEqual([3, 5]);
    expect(parseDigitList('', 5)).toEqual([]);
    expect(parseDigitList('  ', 5)).toEqual([]);
    expect(parseDigitList('123456', 5)).toBeNull();
    expect(parseDigitList('1 x', 5)).toBeNull();
    expect(parseDigitList('-1', 5)).toBeNull();
  });
});
