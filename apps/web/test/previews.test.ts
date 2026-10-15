// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIRRORED, gamePreview, hasPreview, previewIds, previewMarkup } from '../src/previews';
import { GAMES } from '../src/registry';

const ids = GAMES.map((g) => g.metadata.id);
const parse = (markup: string) => new DOMParser().parseFromString(markup, 'image/svg+xml');

describe('game previews on the home page', () => {
  it('every registered game has its own preview (a new game needs one in src/previews.ts)', () => {
    expect(ids.filter((id) => !hasPreview(id))).toEqual([]);
    // No stale previews for games that are no longer registered.
    expect(previewIds().filter((id) => !ids.includes(id))).toEqual([]);
    // Each preview is its own drawing.
    const bodies = ids.map(previewMarkup);
    expect(new Set(bodies).size).toBe(ids.length);
    expect(bodies).not.toContain(previewMarkup('no-such-game'));
  });

  it('the well-formedness check below does catch broken markup', () => {
    expect(parse('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>').querySelector('parsererror')).not.toBeNull();
  });

  it.each(ids)('%s: well-formed, decorative, self-contained SVG', (id) => {
    const markup = previewMarkup(id);
    const doc = parse(markup);
    expect(doc.querySelector('parsererror')).toBeNull();
    const svg = doc.documentElement;
    expect(svg.nodeName).toBe('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 96 64');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.querySelectorAll('*').length).toBeGreaterThan(3);
    // No scripts, embedded documents, external or internal references, or inline styles/handlers.
    for (const el of [svg, ...svg.querySelectorAll('*')]) {
      expect(['script', 'foreignObject', 'image', 'use', 'a', 'style', 'iframe']).not.toContain(el.localName);
      for (const attr of el.attributes) {
        expect(attr.name).not.toMatch(/^on|href$|^style$|^src$/i);
        if (attr.name !== 'xmlns') expect(attr.value).not.toMatch(/https?:|url\(|javascript:|data:/i);
      }
    }
    expect(markup.match(/https?:/g)).toEqual(['http:']); // only the SVG namespace
    // Text inside a preview is a short digit, letter or symbol, never a translatable word.
    for (const t of svg.querySelectorAll('text')) expect(t.textContent).toMatch(/^[A-Za-z0-9?!]{1,2}$/);
  });

  it('only pictures without any glyphs follow the reading direction', () => {
    for (const id of MIRRORED) {
      expect(ids).toContain(id);
      expect(previewMarkup(id)).toContain('game-preview--flow');
      expect(parse(previewMarkup(id)).querySelectorAll('text')).toHaveLength(0);
    }
    expect(previewMarkup('chess')).not.toContain('game-preview--flow');
  });

  it('unknown games get the neutral glyph, and every preview becomes a hidden SVG element', () => {
    expect(hasPreview('a-future-game')).toBe(false);
    const generic = gamePreview('a-future-game');
    expect(generic.getAttribute('class')).toContain('game-preview--generic');
    for (const id of ids) {
      const el = gamePreview(id);
      expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.getAttribute('class')).not.toContain('generic');
    }
  });

  it('cards show the preview as a band above the title, and the saved badge never breaks inside', () => {
    const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
    const rule = (selector: string) => css.match(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`, 'm'))?.[1] ?? '';
    const card = rule('.game-card');
    expect(card).toContain("grid-template-areas: 'preview' 'title' 'tagline' 'badges'");
    expect(card).toContain('grid-template-columns: minmax(0, 1fr)');
    const preview = rule('.game-card .game-preview');
    // Full width, height reserved from the aspect ratio (no layout shift), capped so the band stays modest.
    expect(preview).toContain('inline-size: 100%');
    expect(preview).toContain('aspect-ratio: 96 / 64');
    expect(preview).toMatch(/max-block-size: \d/);
    const saved = rule('.badge.saved');
    expect(saved).toContain('white-space: nowrap');
    expect(saved).toContain('display: inline-flex');
  });

  it('every class a preview uses is styled (a typo would draw an invisible or default-black shape)', () => {
    const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
    const used = new Set(ids.flatMap((id) => [...previewMarkup(id).matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(' '))));
    const missing = [...used].filter((c) => !c.startsWith('game-preview') && !new RegExp(`\\.game-preview \\.${c}[ ,{.:)]`).test(css) && !new RegExp(`[(, ]\\.${c}[,)]`).test(css));
    expect(missing).toEqual([]);
  });
});
