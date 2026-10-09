import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseRoute, routeHref } from '../src/router';

describe('parseRoute', () => {
  it.each([
    ['/', { name: 'home' }],
    ['/index.html', { name: 'home' }],
    ['/about/', { name: 'about' }],
    ['/settings', { name: 'settings' }],
    ['/legal', { name: 'legal' }],
    ['/impressum', { name: 'legal' }],
    ['/games/tic-tac-toe', { name: 'game', id: 'tic-tac-toe' }],
    ['/decks', { name: 'decks' }],
    ['/decks/', { name: 'decks' }],
    ['/decks/import', { name: 'deck-import' }],
    ['/decks/first-words', { name: 'deck', id: 'first-words' }],
    ['/decks/user-spanish-a1b2', { name: 'deck', id: 'user-spanish-a1b2' }],
    ['/decks/Bad_Id', { name: 'not-found' }],
    [`/decks/${'a'.repeat(65)}`, { name: 'not-found' }],
    ['/games/Bad_Id', { name: 'not-found' }],
    ['/games/', { name: 'not-found' }],
    ['/nope', { name: 'not-found' }]
  ])('%s', (path, route) => {
    expect(parseRoute(path)).toEqual(route);
  });

  it('reads reproducible seed and difficulty from the query string', () => {
    expect(parseRoute('/games/memory', '?seed=123&difficulty=large')).toEqual({ name: 'game', id: 'memory', seed: 123, difficulty: 'large' });
    expect(parseRoute('/games/memory', '?seed=-1&difficulty=<script>')).toEqual({ name: 'game', id: 'memory' });
    expect(parseRoute('/games/memory', '?seed=4294967296')).toEqual({ name: 'game', id: 'memory' });
    expect(parseRoute('/games/memory', '?seed=4294967295')).toEqual({ name: 'game', id: 'memory', seed: 4294967295 });
  });

  it('reads ?deck=<id> as "start a fresh game with this deck"', () => {
    expect(parseRoute('/games/review', '?deck=flags')).toEqual({ name: 'game', id: 'review', fresh: true, deck: 'flags' });
    expect(parseRoute('/games/review', '?deck=user-pets-0a1b2c3d&seed=4')).toEqual({ name: 'game', id: 'review', seed: 4, deck: 'user-pets-0a1b2c3d' });
    expect(parseRoute('/games/review', '?deck=Bad%20Id')).toEqual({ name: 'game', id: 'review' });
    expect(parseRoute('/games/review', `?deck=${'a'.repeat(65)}`)).toEqual({ name: 'game', id: 'review' });
  });

  it('reads ?new=1 as "start a fresh game" (ignored together with a seed)', () => {
    expect(parseRoute('/games/memory', '?new=1')).toEqual({ name: 'game', id: 'memory', fresh: true });
    expect(parseRoute('/games/memory', '?new=yes')).toEqual({ name: 'game', id: 'memory' });
    expect(parseRoute('/games/memory', '?new=1&seed=5')).toEqual({ name: 'game', id: 'memory', seed: 5 });
  });

  it('round-trips hrefs', () => {
    for (const route of [{ name: 'home' }, { name: 'about' }, { name: 'settings' }, { name: 'legal' }, { name: 'game', id: 'memory' }, { name: 'decks' }, { name: 'deck-import' }, { name: 'deck', id: 'flags' }] as const) {
      expect(parseRoute(routeHref(route))).toEqual(route);
    }
    expect(routeHref({ name: 'not-found' })).toBe('/');
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.string(), fc.string(), (p, q) => void parseRoute(p, q)));
  });
});
