import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/game-core';
import { CONTENT_LOADERS, type ContentText } from '../src/content';
import { ALL, ev } from '../src/data';
import { CONTENT_ID, CURATED, EVENTS } from '../src/events';
import { DIFFICULTIES, FILL, ORDER_SIZE, SPANS, TIERS, spanPool } from '../src/generate';
import { messages } from '../src/messages';
import { ERAS } from '../src/time';

const content: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const l of SUPPORTED_LOCALES) content[l] = await CONTENT_LOADERS[l]();
});

const REGIONS = ['africa', 'americas', 'asia', 'europe', 'oceania', 'world'] as const;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('event data (content § 1)', () => {
  it('has unique kebab-case ids and a content version', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(CONTENT_ID).toBe('events-1');
  });

  it('stores dates as the sources give them: lo older, the point inside, spans longer than zero', () => {
    for (const e of EVENTS) {
      const older = (a: number, b: number) => (e.unit === 'ago' ? a >= b : a <= b);
      expect(older(e.lo, e.hi), e.id).toBe(true);
      if (e.kind === 'point') {
        expect(e.at, e.id).toBeDefined();
        expect(older(e.lo, e.at!) && older(e.at!, e.hi), e.id).toBe(true);
      } else {
        expect(e.at, e.id).toBeUndefined();
        expect(e.lo, e.id).not.toBe(e.hi);
      }
      expect(Number.isInteger(e.lo) && Number.isInteger(e.hi), e.id).toBe(true);
      // "years ago" only for the deep past (older than 10,000 BCE), calendar years otherwise.
      if (e.unit === 'ago') expect(1950 - e.hi, e.id).toBeLessThan(-9999);
      else expect(e.lo, e.id).toBeGreaterThanOrEqual(-9999);
    }
  });

  it('cites at least one source and records the date of the last check', () => {
    for (const e of EVENTS) {
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.trim().length, e.id).toBeGreaterThan(10);
      expect(e.checked, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps the balance of the content plan (regions, eras, Europe, war and politics)', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(120);
    const human = ALL.filter((e) => e.era !== 'deep');
    for (const r of REGIONS) expect(ALL.filter((e) => e.data.region === r).length, r).toBeGreaterThanOrEqual(7);
    expect(human.filter((e) => e.data.region === 'europe').length / human.length).toBeLessThanOrEqual(0.3);
    for (const era of ERAS) expect(ALL.filter((e) => e.era === era).length, era).toBeGreaterThanOrEqual(25);
    // Rulers, wars and politics stay a small share (owner decision 2026-10-26: at most 10 %).
    expect(ALL.filter((e) => e.data.cat === 'history').length / ALL.length).toBeLessThanOrEqual(0.1);
    for (const cat of ['earth', 'science', 'tech', 'culture', 'explore', 'everyday']) expect(ALL.filter((e) => e.data.cat === cat).length, cat).toBeGreaterThanOrEqual(10);
  });

  it('has enough events for every span and difficulty after fill-up', () => {
    for (const span of SPANS)
      for (const d of DIFFICULTIES) {
        const tiers = [...TIERS[d], ...FILL[d]];
        const pool = spanPool(span).filter((e) => tiers.includes(e.tier));
        expect(pool.length, `${span}/${d}`).toBeGreaterThanOrEqual(ORDER_SIZE[d] * 4);
        expect(spanPool(span).filter((e) => TIERS[d].includes(e.tier)).length, `${span}/${d}`).toBeGreaterThan(0);
      }
  });
});

describe('curated pairs (content § 4)', () => {
  const by = (id: string) => ev(id)!;
  it('name existing, current, non-overlapping events (older first)', () => {
    for (const p of CURATED) {
      expect(ev(p.older), p.id).toBeDefined();
      expect(ev(p.newer), p.id).toBeDefined();
      expect(by(p.older).retired || by(p.newer).retired, p.id).toBe(false);
      expect(by(p.older).hi, p.id).toBeLessThan(by(p.newer).lo);
    }
  });

  it('make claims that the data supports', () => {
    const c = by('cleopatra');
    // Closer to the Moon landing than to the building of the Great Pyramid (even comparing her birth with the Moon landing).
    expect(by('moon-landing').y - c.lo).toBeLessThan(c.hi - by('great-pyramid').hi);
    expect(by('great-pyramid').hi).toBeLessThan(by('mammoths').lo);
    const s = by('stegosaurus');
    const t = by('t-rex');
    expect(t.lo - s.hi).toBeGreaterThan(1950 - t.lo);
    const gapSF = [by('oldest-forest').lo - by('first-sharks').hi, by('oldest-forest').hi - by('first-sharks').lo];
    expect(gapSF[0]).toBeGreaterThan(45e6);
    expect(gapSF[1]).toBeLessThan(75e6);
    expect(by('farming').lo - by('bread').hi).toBeGreaterThan(2000);
    expect(by('farming').lo - by('pottery').hi).toBeGreaterThan(2000);
    expect(by('tenochtitlan').lo - by('oxford').hi).toBeGreaterThan(200);
    const bg = [by('gutenberg').lo - by('bi-sheng').hi, by('gutenberg').hi - by('bi-sheng').lo];
    expect(bg[0]).toBeGreaterThanOrEqual(350);
    expect(bg[1]).toBeLessThanOrEqual(450);
    expect(by('fax').hi).toBeLessThan(by('telephone').lo);
    expect(by('stonehenge').lo - by('gobekli').hi).toBeGreaterThan(2026 - by('stonehenge').hi);
    expect(by('sulawesi-art').hi).toBeLessThan(by('chauvet').lo);
    expect(by('anaesthesia').hi).toBeLessThan(by('railway').lo);
  });
});

describe('wording in all 16 locales (design § 17)', () => {
  it('has a title and a note for every event and an insight for every pair, nothing else', () => {
    for (const l of SUPPORTED_LOCALES) {
      const c = content[l]!;
      expect(Object.keys(c.events).sort(), l).toEqual(EVENTS.map((e) => e.id).sort());
      expect(Object.keys(c.pairs).sort(), l).toEqual(CURATED.map((p) => p.id).sort());
      for (const [id, [title, note]] of Object.entries(c.events)) {
        expect(title.trim().length, `${l}/${id}`).toBeGreaterThan(3);
        expect(note.trim().length, `${l}/${id}`).toBeGreaterThan(10);
        expect(title, `${l}/${id}`).not.toMatch(/\{|\}|undefined|TODO/);
        expect(note, `${l}/${id}`).not.toMatch(/\{|\}|undefined|TODO/);
      }
      for (const [id, text] of Object.entries(c.pairs)) expect(text.trim().length, `${l}/${id}`).toBeGreaterThan(10);
    }
  });

  it('never gives a date away in a title (year digits or era words)', () => {
    for (const l of SUPPORTED_LOCALES) {
      const msgs = messages[l]!;
      const markers = [msgs['date.bce']!, msgs['date.ceEarly']!].map((tpl) => tpl.replace('{year}', '').trim());
      for (const e of ALL) {
        const title = content[l]!.events[e.id]![0];
        const years = new Set<number>();
        for (const y of [e.y, e.lo, e.hi]) if (y >= -9999) years.add(y <= 0 ? 1 - y : y);
        for (const y of years) {
          const local = new Intl.NumberFormat(l === 'zh-Hans' ? 'zh' : l, { useGrouping: false }).format(y);
          for (const form of new Set([String(y), local])) expect(new RegExp(`(^|\\D)${form}(\\D|$)`).test(title), `${l}/${e.id}: ${title}`).toBe(false);
        }
        for (const m of markers) expect(new RegExp(`(^|[^\\p{L}\\p{M}])${escape(m)}($|[^\\p{L}\\p{M}])`, 'u').test(title), `${l}/${e.id}: ${title}`).toBe(false);
      }
    }
  });

  it('writes Simplified Chinese (no traditional-only characters)', () => {
    const traditional = /[們這個來時於與國學會說經爲為體後發開關點長門東車書見華歲電語麼對過還讓應當動種現實從無頭聽愛覺]/;
    const all = [...Object.values(content['zh-Hans']!.events).flat(), ...Object.values(content['zh-Hans']!.pairs), ...Object.values(messages['zh-Hans']!)];
    for (const s of all) expect(traditional.test(s), s).toBe(false);
  });
});
