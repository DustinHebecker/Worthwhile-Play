// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { illustratedCards, illustration } from '../src/illustrations';
import { WORLDS } from '../src/worlds';

const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
const known = new Set([...css.matchAll(/\.cq-il \.(il-[a-z-]+)/g)].map((m) => m[1]));
const ELEMENTS = new Set(['svg', 'g', 'rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line']);
const ATTRIBUTES = new Set(['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2', 'transform', 'opacity', 'class', 'viewBox', 'aria-hidden', 'focusable', 'xmlns']);

describe('card illustrations (B2)', () => {
  const cards = WORLDS.kz!.cards.map((c) => c.id);

  it('every Kampfzwerge card has one, and every illustration belongs to a card', () => {
    expect(cards.filter((id) => illustration(id) === undefined)).toEqual([]);
    expect(illustratedCards().filter((id) => !cards.includes(id))).toEqual([]);
  });

  it('is well-formed static SVG: allowed elements and attributes only, colours only from the palette classes', () => {
    for (const id of illustratedCards()) {
      const markup = illustration(id)!.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
      expect(doc.querySelector('parsererror'), id).toBeNull();
      for (const el of [doc.documentElement, ...doc.documentElement.querySelectorAll('*')]) {
        expect(ELEMENTS.has(el.tagName), `${id} <${el.tagName}>`).toBe(true);
        for (const a of el.getAttributeNames()) expect(ATTRIBUTES.has(a), `${id} ${a}=`).toBe(true);
        for (const c of (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)) if (el !== doc.documentElement) expect(known.has(c), `${id} .${c}`).toBe(true);
      }
      expect(doc.documentElement.getAttribute('aria-hidden'), id).toBe('true');
    }
  });

  it('pictures carry no text (16 languages)', () => {
    for (const id of illustratedCards()) expect(illustration(id), id).not.toMatch(/<text|<tspan/);
  });
});
