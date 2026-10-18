// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { illustratedCards, illustration, loadIllustrations } from '../src/illustrations';
import { WORLD_IDS, WORLDS } from '../src/worlds';

const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
const known = new Set([...css.matchAll(/\.cq-il \.(il-[a-z-]+)/g)].map((m) => m[1]));
const ELEMENTS = new Set(['svg', 'g', 'rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line']);
const ATTRIBUTES = new Set(['d', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2', 'transform', 'opacity', 'class', 'viewBox', 'aria-hidden', 'focusable', 'xmlns']);

/** Checks one picture: static, well-formed SVG with allowed elements, attributes and palette classes only, no text. */
function checkMarkup(id: string, svg: string): void {
  const markup = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  expect(doc.querySelector('parsererror'), id).toBeNull();
  for (const el of [doc.documentElement, ...doc.documentElement.querySelectorAll('*')]) {
    expect(ELEMENTS.has(el.tagName), `${id} <${el.tagName}>`).toBe(true);
    for (const a of el.getAttributeNames()) expect(ATTRIBUTES.has(a), `${id} ${a}=`).toBe(true);
    for (const c of (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)) if (el !== doc.documentElement) expect(known.has(c), `${id} .${c}`).toBe(true);
  }
  expect(doc.documentElement.getAttribute('aria-hidden'), id).toBe('true');
  expect(svg, id).not.toMatch(/<text|<tspan/);
}

describe('card illustrations (B2)', () => {
  it('load per world on demand: one world leaves the others unloaded; repeatable; unknown worlds are ignored', async () => {
    vi.resetModules();
    const fresh = await import('../src/illustrations');
    expect(fresh.illustratedCards()).toEqual([]);
    await fresh.loadIllustrations(['sl']);
    expect(fresh.illustrationsLoaded(['sl'])).toBe(true);
    for (const other of WORLD_IDS.filter((w) => w !== 'sl')) expect(fresh.illustrationsLoaded([other]), other).toBe(false);
    expect(fresh.illustratedCards().every((id) => id.startsWith('sl.'))).toBe(true);
    await expect(fresh.loadIllustrations(['sl', 'sl', 'xx', '__proto__'])).resolves.toBeUndefined();
    expect(fresh.illustrationsLoaded(['xx'])).toBe(true);
  });

  it('a world whose chunk fails to load keeps the pictograms and does not count as loaded', async () => {
    vi.resetModules();
    vi.doMock('../src/illustrations/of', () => {
      throw new Error('offline');
    });
    try {
      const fresh = await import('../src/illustrations');
      await expect(fresh.loadIllustrations(['of'])).resolves.toBeUndefined();
      expect(fresh.illustrationsLoaded(['of'])).toBe(false);
      expect(fresh.illustration('of.stress-ball')).toBeUndefined();
    } finally {
      vi.doUnmock('../src/illustrations/of');
      vi.resetModules();
    }
  });

  it.each(WORLD_IDS)('%s: every card has one, each is well-formed static SVG without text', async (world) => {
    await loadIllustrations([world]);
    const ids = WORLDS[world]!.cards.map((c) => c.id);
    expect(ids.filter((id) => illustration(id) === undefined)).toEqual([]);
    for (const id of ids) checkMarkup(id, illustration(id)!);
  });

  it('every loaded illustration belongs to a card', async () => {
    await loadIllustrations(WORLD_IDS);
    const cards = new Set(Object.values(WORLDS).flatMap((w) => w.cards.map((c) => c.id)));
    expect(illustratedCards().filter((id) => !cards.has(id))).toEqual([]);
  });

  it('unknown or prototype ids have none', () => {
    for (const id of ['constructor', '__proto__', 'toString', 'kz.nope']) expect(illustration(id), id).toBeUndefined();
  });
});
