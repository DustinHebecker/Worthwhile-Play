// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { compile, initialState } from '@wp/adventure-engine';
import { prologueArt } from '../src/art';
import { PROLOGUE } from '../src/structure';

describe('prologue art', () => {
  const c = compile(PROLOGUE);
  it.each(['jetty', 'square', 'hut'])('draws %s, within the node budget', (id) => {
    const el = prologueArt.render(c.scenes.get(id)!, initialState(c, 1));
    expect(el.querySelectorAll('*').length).toBeGreaterThan(10);
    expect(el.querySelectorAll('*').length).toBeLessThan(400);
    expect(el.querySelector('text')).toBeNull();
  });

  it('changes the picture with the state (lamp taken, chain open)', () => {
    const s = initialState(c, 1);
    const before = prologueArt.render(c.scenes.get('jetty')!, s).outerHTML;
    const after = prologueArt.render(c.scenes.get('jetty')!, { ...s, items: ['lamp'], flags: { 'chain-open': 1 } }).outerHTML;
    expect(after).not.toBe(before);
  });
});
