import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Units are drawn in the side colours on every terrain, veiled ("not observed") or not, in both
 * themes; last-known positions use the same colours at full opacity. WCAG 1.4.11 asks for 3:1
 * against the adjacent colour. The colours are read from the stylesheets the game ships.
 */
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const gameCss = read('../src/styles.css');
const uiCss = read('../../../ui/src/styles.css');

/** Custom properties of the first block (light) and of the prefers-color-scheme: dark block. */
function tokens(css: string): { light: Map<string, string>; dark: Map<string, string> } {
  const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
  const collect = (text: string) => new Map([...text.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
  const dark = darkStart >= 0 ? css.slice(darkStart, css.indexOf('}\n}', darkStart)) : '';
  return { light: collect(darkStart >= 0 ? css.slice(0, darkStart) : css), dark: collect(dark) };
}

type Rgba = [number, number, number, number];
function parse(colour: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(colour);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16)).concat(1) as Rgba;
  const rgba = /^rgba?\(([^)]+)\)$/.exec(colour);
  if (rgba) {
    const [r, g, b, a = 1] = rgba[1]!.split(',').map(Number);
    return [r!, g!, b!, a];
  }
  throw new Error(`unparsed colour ${colour}`);
}
const over = (base: Rgba, top: Rgba): Rgba => [0, 1, 2].map((i) => base[i]! * (1 - top[3]) + top[i]! * top[3]).concat(1) as Rgba;
function luminance([r, g, b]: Rgba): number {
  const f = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a: Rgba, b: Rgba) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const TERRAINS = ['plain', 'road', 'forest', 'hill', 'urban', 'swamp', 'water', 'ridge'];

describe('map contrast', () => {
  const game = tokens(gameCss);
  const ui = tokens(uiCss);
  for (const theme of ['light', 'dark'] as const) {
    it(`side colours keep 3:1 on every terrain, veiled or not (${theme})`, () => {
      const pick = (map: 'game' | 'ui', name: string) => {
        const t = map === 'game' ? game : ui;
        const value = (theme === 'dark' ? t.dark.get(name) : undefined) ?? t.light.get(name);
        expect(value, `${theme} ${name}`).toBeDefined();
        return parse(value!);
      };
      const fog = pick('game', '--rc-fog');
      for (const terrain of TERRAINS) {
        const ground = pick('game', `--rc-${terrain}`);
        for (const [veil, bg] of [['open', ground], ['veiled', over(ground, fog)]] as const) {
          for (const side of ['--wp-p1', '--wp-p2']) {
            const ratio = contrast(pick('ui', side), bg);
            expect(ratio, `${theme} ${terrain} ${veil} ${side}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
          }
        }
      }
    });
  }
});
