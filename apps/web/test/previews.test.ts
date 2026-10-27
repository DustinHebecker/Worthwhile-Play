// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIRRORED, PHOTOS, gamePreview, hasPreview, photoUrl, previewIds, previewMarkup } from '../src/previews';
import { GAMES } from '../src/registry';

const ids = GAMES.map((g) => g.metadata.id);
/** Games with a drawn (inline SVG) preview; the others show a photo rendered by the game itself. */
const drawn = ids.filter((id) => !PHOTOS.has(id));
const PUBLIC = join(__dirname, '../public');

/** Canvas size of a WebP file from its RIFF header (lossy VP8, lossless VP8L and extended VP8X), or undefined. */
const webpSize = (b: Buffer): { width: number; height: number } | undefined => {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return undefined;
  if (b.readUInt32LE(4) + 8 !== b.length) return undefined;
  const u24 = (o: number) => b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16);
  switch (b.toString('ascii', 12, 16)) {
    case 'VP8X': return { width: u24(24) + 1, height: u24(27) + 1 };
    case 'VP8 ': return b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a ? { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff } : undefined;
    case 'VP8L': {
      if (b[20] !== 0x2f) return undefined;
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    default: return undefined;
  }
};
const parse = (markup: string) => new DOMParser().parseFromString(markup, 'image/svg+xml');

describe('game previews on the home page', () => {
  it('every registered game has its own preview (a new game needs one in src/previews.ts)', () => {
    expect(ids.filter((id) => !hasPreview(id))).toEqual([]);
    // No stale previews for games that are no longer registered.
    expect(previewIds().filter((id) => !ids.includes(id))).toEqual([]);
    // Each preview is its own drawing.
    const bodies = ids.map(previewMarkup);
    expect(ids.filter((id) => previewMarkup(id).startsWith('<picture'))).toEqual([...PHOTOS]);
    expect(new Set(bodies).size).toBe(ids.length);
    expect(bodies).not.toContain(previewMarkup('no-such-game'));
  });

  it('the well-formedness check below does catch broken markup', () => {
    expect(parse('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>').querySelector('parsererror')).not.toBeNull();
  });

  it.each(drawn)('%s: well-formed, decorative, self-contained SVG', (id) => {
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
    for (const id of drawn) {
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
    const used = new Set(drawn.flatMap((id) => [...previewMarkup(id).matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(' '))));
    const missing = [...used].filter((c) => !c.startsWith('game-preview') && !new RegExp(`\\.game-preview \\.${c}[ ,{.:)]`).test(css) && !new RegExp(`[(, ]\\.${c}[,)]`).test(css));
    expect(missing).toEqual([]);
  });

  describe('photo previews (a picture rendered by the game itself)', () => {
    it('the WebP size check does catch a wrong or broken file', () => {
      const ok = readFileSync(join(PUBLIC, 'previews/relay-command-light.webp'));
      expect(webpSize(ok)).toEqual({ width: 288, height: 192 });
      expect(webpSize(ok.subarray(0, 100))).toBeUndefined();
      expect(webpSize(readFileSync(join(PUBLIC, 'logo.png')))).toBeUndefined();
    });

    it.each([...PHOTOS])('%s: a registered game, without a drawing of its own', (id) => {
      expect(ids).toContain(id);
      expect(previewMarkup(id)).not.toContain('<svg');
    });

    it.each([...PHOTOS])('%s: a decorative <picture> with a dark source and a light <img>, same origin', (id) => {
      for (const el of [gamePreview(id), new DOMParser().parseFromString(previewMarkup(id), 'text/html').body.firstElementChild!]) {
        expect(el.localName).toBe('picture');
        expect(el.getAttribute('class')).toBe('game-preview-picture');
        expect([...el.children].map((c) => c.localName)).toEqual(['source', 'img']);
        const [source, img] = [el.children[0]!, el.children[1]!];
        expect(source.getAttribute('media')).toBe('(prefers-color-scheme: dark)');
        expect(source.getAttribute('srcset')).toBe(`/previews/${id}-dark.webp`);
        expect(img.getAttribute('src')).toBe(`/previews/${id}-light.webp`);
        expect(img.getAttribute('alt')).toBe('');
        expect(img.getAttribute('aria-hidden')).toBe('true');
        expect(img.getAttribute('class')).toBe('game-preview game-preview--photo');
        expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['96', '64']);
        expect([img.getAttribute('loading'), img.getAttribute('decoding')]).toEqual(['lazy', 'async']);
        // Root-relative under the base URL: no scheme, host, data: URL or protocol-relative path.
        for (const url of [source.getAttribute('srcset')!, img.getAttribute('src')!]) {
          expect(url).toMatch(/^\/previews\/[a-z0-9-]+-(light|dark)\.webp$/);
          expect(new URL(url, 'https://worthwhile-play.example/').origin).toBe('https://worthwhile-play.example');
        }
        for (const node of [el, ...el.querySelectorAll('*')]) for (const attr of node.attributes) expect(attr.name).not.toMatch(/^on|^style$/i);
      }
    });

    it.each([...PHOTOS])('%s: both photos exist in public/ as 288×192 WebP (3× the 96×64 card)', (id) => {
      for (const scheme of ['light', 'dark'] as const) {
        const url = photoUrl(id, scheme);
        expect(webpSize(readFileSync(join(PUBLIC, url)))).toEqual({ width: 288, height: 192 });
      }
    });

    it('photos fill the band like a drawing, and the service worker precaches them', () => {
      const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8');
      expect(css).toMatch(/^\.game-preview-picture \{ display: contents; \}/m);
      expect(css).toMatch(/^\.game-preview--photo \{ object-fit: cover; \}/m);
      const vite = readFileSync(join(__dirname, '../vite.config.ts'), 'utf8');
      expect(vite.match(/globPatterns: \[([^\]]*)\]/)?.[1]).toMatch(/[{,]webp[,}]/);
    });
  });
});
