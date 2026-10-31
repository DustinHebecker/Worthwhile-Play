/**
 * Independent brute-force oracles (tests only). Each uses a different method from the game's solver:
 * subset enumeration for networks, permutations × cut points for deliveries, a knapsack DP for production.
 */
import type { DeliveryProblem } from '../src/delivery';
import type { NetworkProblem } from '../src/network';
import type { ProductionProblem } from '../src/production';

/** Cheapest set of links that connects all towns (opening costs of touched junctions included). */
export function networkOracle(p: NetworkProblem): number {
  const m = p.links.length;
  const towns = p.points.flatMap((q, i) => (q.junction ? [] : [i]));
  let best = Number.POSITIVE_INFINITY;
  const parent = new Array<number>(p.points.length);
  const find = (v: number): number => (parent[v] === v ? v : (parent[v] = find(parent[v]!)));
  for (let mask = 1; mask < 1 << m; mask++) {
    let cost = 0;
    let touched = 0;
    for (let v = 0; v < p.points.length; v++) parent[v] = v;
    for (let i = 0; i < m; i++) {
      if (!(mask & (1 << i))) continue;
      const l = p.links[i]!;
      cost += l.cost;
      touched |= (1 << l.a) | (1 << l.b);
      parent[find(l.a)] = find(l.b);
    }
    if (cost >= best) continue;
    p.points.forEach((q, v) => {
      if (q.junction && touched & (1 << v)) cost += q.open;
    });
    const root = find(towns[0]!);
    if (cost < best && towns.every((t) => find(t) === root)) best = cost;
  }
  return best;
}

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]));
}

/** Shortest total distance over every visiting order and every choice of "back to the depot" points. */
export function deliveryOracle(p: DeliveryProblem): number {
  const n = p.stops.length;
  const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  let best = Number.POSITIVE_INFINITY;
  for (const order of permutations(p.stops.map((_, i) => i))) {
    for (let cuts = 0; cuts < 1 << (n - 1); cuts++) {
      let total = 0;
      let load = 0;
      let at = p.depot;
      let ok = true;
      order.forEach((s, k) => {
        if (k > 0 && cuts & (1 << (k - 1))) {
          total += d(at, p.depot);
          at = p.depot;
          load = 0;
        }
        load += p.stops[s]!.parcels;
        if (load > p.capacity) ok = false;
        total += d(at, p.stops[s]!);
        at = p.stops[s]!;
      });
      total += d(at, p.depot);
      if (ok && total < best) best = total;
    }
  }
  return best;
}

/** Best value via a bounded multi-dimensional knapsack DP for each set of products allowed to be made. */
export function productionOracle(p: ProductionProblem): number {
  const dims = p.resources.map((r) => r.stock + 1);
  const size = dims.reduce((a, b) => a * b, 1);
  const stride = dims.map((_, r) => dims.slice(0, r).reduce((a, b) => a * b, 1));
  const coords = (index: number) => dims.map((dim, r) => Math.floor(index / stride[r]!) % dim);
  let best = 0;
  for (let subset = 0; subset < 1 << p.products.length; subset++) {
    const dp = new Array<number>(size).fill(0);
    let setup = 0;
    p.products.forEach((product, i) => {
      if (!(subset & (1 << i))) return;
      setup += product.setup;
      const offset = product.use.reduce((sum, u, r) => sum + u * stride[r]!, 0);
      for (let copy = 0; copy < product.max; copy++) {
        for (let c = size - 1; c >= 0; c--) {
          const at = coords(c);
          if (product.use.every((u, r) => at[r]! >= u)) dp[c] = Math.max(dp[c]!, dp[c - offset]! + product.value);
        }
      }
    });
    best = Math.max(best, dp[size - 1]! - setup);
  }
  return best;
}
