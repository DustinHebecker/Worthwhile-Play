import { describe, expect, it } from 'vitest';
import { CHALLENGES } from '../src/challenges';
import { CLDS, CLD_H, CLD_W, LOOP_KEYS, POOL_NODES, chainEdges, cldOf, edgeOf, layoutCld, loopHasDelay, loopKind, loopSign, type Cld } from '../src/cld';
import { GOALS } from '../src/goals';
import { habitatDef } from '../src/habitats';

const all = Object.entries(CLDS as Record<string, Cld>);

describe('causal loop diagrams (§ 12.2)', () => {
  it('every challenge and goal has a diagram of its habitat', () => {
    for (const c of CHALLENGES) expect(cldOf(c.id)?.habitat, c.id).toBe(c.habitat);
    for (const g of GOALS) expect(cldOf(g.id)?.habitat, g.id).toBe(g.habitat);
    expect(cldOf('nope')).toBeUndefined();
  });

  it('nodes are known stocks of the habitat or pools; at most 7, no duplicates', () => {
    for (const [id, c] of all) {
      const species = habitatDef(c.habitat).species.map((s) => s.id);
      expect(c.nodes.length, id).toBeLessThanOrEqual(7);
      expect(new Set(c.nodes).size, id).toBe(c.nodes.length);
      for (const n of c.nodes) expect(species.includes(n) || (POOL_NODES as readonly string[]).includes(n), `${id}: ${n}`).toBe(true);
      for (const e of c.edges) {
        expect(c.nodes, `${id}: ${e.from}`).toContain(e.from);
        expect(c.nodes, `${id}: ${e.to}`).toContain(e.to);
        expect(e.from).not.toBe(e.to);
      }
    }
  });

  it('every loop is a cycle of existing edges, and its type equals the product of its signs', () => {
    for (const [id, c] of all) {
      for (const loop of c.loops) {
        const sign = loopSign(c, loop);
        expect(sign, `${id} ${loop.id}`).not.toBe(0);
        expect(loopKind(loop), `${id} ${loop.id}`).toBe(sign === 1 ? 'reinforcing' : 'balancing');
        expect(new Set(loop.path).size).toBe(loop.path.length);
      }
      expect(new Set(c.loops.map((l) => l.id)).size, id).toBe(c.loops.length);
      if (c.highlight !== null) expect(c.loops.map((l) => l.id), id).toContain(c.highlight);
      if (c.chain) expect(chainEdges(c, c.chain).length, `${id} chain`).toBe(c.chain.length - 1);
      expect(c.highlight !== null || c.chain !== undefined, `${id} explains something`).toBe(true);
    }
  });

  it('loopSign: two minus signs make a reinforcing loop; a missing edge gives 0', () => {
    const c = CLDS['slow-runoff'];
    expect(loopSign(c, { id: 'R1', path: ['algae', 'pondweed'], key: 'x' })).toBe(1);
    expect(loopSign(c, { id: 'B1', path: ['algae', 'fleas'], key: 'x' })).toBe(-1);
    expect(loopSign(c, { id: 'X', path: ['runoff', 'algae'], key: 'x' })).toBe(0);
    expect(edgeOf(c, 'algae', 'pondweed')?.sign).toBe(-1);
    expect(loopHasDelay(CLDS['pike-return'], CLDS['pike-return'].loops[2]!)).toBe(true);
    expect(loopHasDelay(c, c.loops[0]!)).toBe(false);
    expect(LOOP_KEYS).toContain('clearWater');
  });

  it('layout: nodes inside the box, distinct; edges start and end outside the node boxes', () => {
    for (const [id, c] of all) {
      const L = layoutCld(c);
      expect(L.width).toBe(CLD_W);
      expect(L.height).toBe(CLD_H);
      const keys = new Set(L.nodes.map((n) => `${Math.round(n.at.x)},${Math.round(n.at.y)}`));
      expect(keys.size, id).toBe(c.nodes.length);
      for (const n of L.nodes) {
        expect(n.at.x).toBeGreaterThan(40);
        expect(n.at.x).toBeLessThan(CLD_W - 40);
        expect(n.at.y).toBeGreaterThan(10);
        expect(n.at.y).toBeLessThan(CLD_H - 10);
      }
      expect(L.edges.length).toBe(c.edges.length);
      for (const e of L.edges) {
        const from = L.nodes.find((n) => n.id === e.edge.from)!.at;
        const to = L.nodes.find((n) => n.id === e.edge.to)!.at;
        expect(Math.abs(e.a.x - from.x) > 40 || Math.abs(e.a.y - from.y) > 12, `${id} start`).toBe(true);
        expect(Math.abs(e.b.x - to.x) > 40 || Math.abs(e.b.y - to.y) > 12, `${id} end`).toBe(true);
        expect(Number.isFinite(e.angle)).toBe(true);
      }
      // A→B and B→A bend to opposite sides.
      for (const e of L.edges) {
        const back = L.edges.find((x) => x.edge.from === e.edge.to && x.edge.to === e.edge.from);
        if (back) expect(Math.hypot(back.c.x - e.c.x, back.c.y - e.c.y), id).toBeGreaterThan(10);
      }
      expect(L.loops.length).toBe(c.loops.length);
    }
  });
});
