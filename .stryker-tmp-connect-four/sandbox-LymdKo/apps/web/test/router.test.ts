// @ts-nocheck
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

  it('round-trips hrefs', () => {
    for (const route of [{ name: 'home' }, { name: 'about' }, { name: 'settings' }, { name: 'legal' }, { name: 'game', id: 'memory' }] as const) {
      expect(parseRoute(routeHref(route))).toEqual(route);
    }
    expect(routeHref({ name: 'not-found' })).toBe('/');
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.string(), fc.string(), (p, q) => void parseRoute(p, q)));
  });
});
