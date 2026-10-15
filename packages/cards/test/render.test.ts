// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTranslator } from '@wp/localization';
import { CARD_MESSAGES, cardSvgMarkup, deck32, deck52, renderCard } from '../src';

const t = createTranslator({ locale: 'en', sources: [CARD_MESSAGES] });
const tDe = createTranslator({ locale: 'de', sources: [CARD_MESSAGES] });

describe('renderCard', () => {
  it('renders an SVG with role img, a proper label and an aria-hidden drawing', () => {
    const svg = renderCard('QH', { t });
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Queen of Hearts');
    expect(svg.getAttribute('viewBox')).toBe('0 0 250 350');
    const drawing = svg.firstElementChild;
    expect(drawing?.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelectorAll('text')).toHaveLength(2); // two corner indices
    expect(svg.textContent).toBe('QQ');
  });

  it('is decorative with label: false and without translator', () => {
    for (const svg of [renderCard('2C', { t, label: false }), renderCard('2C')]) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.hasAttribute('role')).toBe(false);
    }
  });

  it('escapes custom labels', () => {
    const svg = renderCard('AS', { label: 'A "quoted" <label> & more' });
    expect(svg.getAttribute('aria-label')).toBe('A "quoted" <label> & more');
  });

  it('renders every card of both decks in both styles, sets and colour modes', () => {
    for (const style of ['full', 'index'] as const) {
      for (const colors of ['two', 'four'] as const) {
        for (const card of deck52()) {
          const svg = renderCard(card, { t, style, colors });
          expect(svg.querySelector('.wp-pc-ink')?.children.length).toBeGreaterThan(2);
          expect(svg.classList.contains(`wp-pc-s-${card[1]}`)).toBe(true);
          expect(svg.classList.contains(`wp-pc--${colors}`)).toBe(true);
        }
        for (const card of deck32()) {
          const svg = renderCard(card, { t: tDe, style, colors, suits: 'german' });
          expect(svg.classList.contains('wp-pc--german')).toBe(true);
        }
      }
    }
  });

  it('draws the number of pips the rank says (full style, plus two corner pips)', () => {
    const pipGroups = (markup: string) => (markup.match(/scale\(/g) ?? []).length;
    for (let n = 2; n <= 9; n++) expect(pipGroups(cardSvgMarkup(`${n}S` as never))).toBe(n + 2);
    expect(pipGroups(cardSvgMarkup('TS'))).toBe(12);
    expect(pipGroups(cardSvgMarkup('AS'))).toBe(3);
  });

  it('uses localized corner letters', () => {
    expect(renderCard('JC', { t: tDe }).textContent).toBe('BB');
    expect(renderCard('JC', { t: tDe, suits: 'german' }).textContent).toBe('UU');
    expect(renderCard('TC', { t }).textContent).toBe('1010');
  });

  it('renders a face-down card with the translated label and no face information', () => {
    const svg = renderCard(null, { t });
    expect(svg.getAttribute('aria-label')).toBe('Face-down card');
    expect(svg.classList.contains('wp-pc--back')).toBe(true);
    expect(svg.querySelector('text')).toBeNull();
    expect(svg.outerHTML).not.toMatch(/wp-pc-s-/);
  });

  it('defaults: French two-colour, German four-colour', () => {
    expect(renderCard('AS').classList.contains('wp-pc--two')).toBe(true);
    expect(renderCard('AS', { suits: 'german' }).classList.contains('wp-pc--four')).toBe(true);
  });

  it('shapes differ for every suit in both sets (information never by colour alone)', () => {
    for (const suits of ['french', 'german'] as const) {
      const bodies = (['C', 'S', 'H', 'D'] as const).map((s) => cardSvgMarkup(`A${s}`, { suits, colors: 'two' }).replace(/wp-pc-s-\w/, ''));
      expect(new Set(bodies).size).toBe(4);
    }
  });
});
