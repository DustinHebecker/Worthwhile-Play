// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { COMMON_MESSAGES, SUPPORTED_LOCALES, createTranslator } from '@wp/localization';
import { CONTENT_LOADERS } from '../src/content';
import { ALL } from '../src/data';
import { CURATED } from '../src/events';
import { messages } from '../src/messages';
import { createUi } from '../src/ui';

/**
 * Every event × every locale through the review texts (design § 20.3): title, date, accepted range, note, Earth-day
 * clock and sources, as the review shows them. No missing keys, no leftover placeholders, no NaN, and the date of a
 * span or an approximate point always shows both ends.
 */
describe('review texts of every event in all 16 locales', () => {
  it('render completely', async () => {
    for (const locale of SUPPORTED_LOCALES) {
      const missing: string[] = [];
      const t = createTranslator({ locale, sources: [messages, COMMON_MESSAGES], onMissing: (k) => missing.push(k) });
      const content = await CONTENT_LOADERS[locale]();
      const ui = createUi(t, () => content);
      // (A source may contain the word "Infinity": a book title.)
      const bad = /\{\w+\}|undefined|\bNaN\b|\u0001/;
      for (const e of ALL) {
        const when = ui.when(e.id);
        const range = ui.range(e.lo, e.hi);
        const texts = [
          ui.title(e.id),
          ui.note(e.id),
          when,
          range,
          ui.clock(e.y),
          ui.rich('when.exact', { date: when }).textContent!,
          ui.rich(e.data.kind === 'span' ? 'when.span' : 'when.range', { range }).textContent!,
          ui.about([e.id], 'review.about').textContent!
        ];
        for (const s of texts) {
          expect(s.trim().length, `${locale}/${e.id}`).toBeGreaterThan(0);
          expect(bad.test(s), `${locale}/${e.id}: ${s}`).toBe(false);
        }
        expect(ui.title(e.id), `${locale}/${e.id}`).not.toBe(e.id);
        for (const s of [when, range, ui.clock(e.y)]) expect(s, `${locale}/${e.id}`).not.toMatch(/Infinity|∞/);
        if (e.lo !== e.hi) expect(range, `${locale}/${e.id}`).toMatch(/–/);
        if (e.data.kind === 'span') expect(when, `${locale}/${e.id}`).toBe(range);
      }
      for (const p of CURATED) expect(ui.insight(p.id), `${locale}/${p.id}`).toBeTruthy();
      expect(missing, locale).toEqual([]);
    }
  }, 120_000);
});
