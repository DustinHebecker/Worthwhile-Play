/**
 * Production — "Plan the workshop": choose how many of each product to make from limited stock so that the total
 * value (minus one-off setup costs on hard) is as high as possible. Pure logic: generator, score, solver.
 */
import { isArrayOf, isInt, isOneOf, isRecord, type Rng } from '@wp/game-core';
import { MAX_ATTEMPTS, type Difficulty } from './common';

export const RESOURCE_IDS = ['wood', 'fittings', 'hours'] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];
export const PRODUCT_IDS = ['stool', 'chair', 'table', 'shelf', 'crate'] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export interface Resource {
  id: ResourceId;
  stock: number;
}
export interface Product {
  id: ProductId;
  value: number;
  /** Use of each resource per piece (same order as `resources`). */
  use: number[];
  max: number;
  setup: number;
}
export interface ProductionProblem {
  kind: 'production';
  resources: Resource[];
  products: Product[];
}
export interface ProductionPlan {
  qty: number[];
}

const isResource = (v: unknown): v is Resource => isRecord(v) && isOneOf(v.id, RESOURCE_IDS) && isInt(v.stock, 1, 30);

export function isProductionProblem(v: unknown): v is ProductionProblem {
  if (!isRecord(v) || v.kind !== 'production') return false;
  if (!isArrayOf(v.resources, isResource) || v.resources.length < 1 || v.resources.length > 3) return false;
  const r = v.resources.length;
  const isProduct = (x: unknown): x is Product =>
    isRecord(x) && isOneOf(x.id, PRODUCT_IDS) && isInt(x.value, 1, 40) && isArrayOf(x.use, (u): u is number => isInt(u, 0, 9), r) && isInt(x.max, 1, 5) && isInt(x.setup, 0, 9);
  if (!isArrayOf(v.products, isProduct) || v.products.length < 1 || v.products.length > 4) return false;
  return new Set(v.resources.map((x) => x.id)).size === r && new Set(v.products.map((x) => x.id)).size === v.products.length;
}

export const isProductionPlan = (v: unknown, p: ProductionProblem): v is ProductionPlan =>
  isRecord(v) && isArrayOf(v.qty, (q): q is number => Number.isInteger(q), p.products.length) && v.qty.every((q, i) => q >= 0 && q <= p.products[i]!.max);

export const emptyProductionPlan = (p: ProductionProblem): ProductionPlan => ({ qty: p.products.map(() => 0) });

/* ---------- Score and constraints ---------- */

/** Total use of each resource. */
export const resourceUse = (p: ProductionProblem, qty: readonly number[]): number[] =>
  p.resources.map((_, r) => p.products.reduce((sum, product, i) => sum + product.use[r]! * (qty[i] ?? 0), 0));

/** Setup costs of the products that are made at all. */
export const setupCost = (p: ProductionProblem, qty: readonly number[]): number => p.products.reduce((sum, product, i) => sum + ((qty[i] ?? 0) > 0 ? product.setup : 0), 0);

export const productionValue = (p: ProductionProblem, plan: ProductionPlan): number =>
  p.products.reduce((sum, product, i) => sum + product.value * plan.qty[i]!, 0) - setupCost(p, plan.qty);

/** Resources used beyond their stock (indices). */
export const overStock = (p: ProductionProblem, plan: ProductionPlan): number[] => {
  const use = resourceUse(p, plan.qty);
  return p.resources.flatMap((res, r) => (use[r]! > res.stock ? [r] : []));
};
export const productionFeasible = (p: ProductionProblem, plan: ProductionPlan): boolean => overStock(p, plan).length === 0;

export function setQty(p: ProductionProblem, plan: ProductionPlan, product: number, q: number): ProductionPlan {
  const max = p.products[product]?.max;
  if (max === undefined || !Number.isInteger(q)) return plan;
  const value = Math.max(0, Math.min(max, q));
  if (plan.qty[product] === value) return plan;
  return { qty: plan.qty.map((x, i) => (i === product ? value : x)) };
}

/* ---------- Exact solver ---------- */

/** Full enumeration of all quantity vectors (≤ 6⁴ = 1 296); ties keep the first found (lexicographically smallest). */
export function solveProduction(p: ProductionProblem): { score: number; plan: ProductionPlan } {
  const qty = p.products.map(() => 0);
  let best = { score: 0, plan: { qty: qty.slice() } };
  const visit = (i: number) => {
    if (i === p.products.length) {
      const plan = { qty: qty.slice() };
      if (productionFeasible(p, plan)) {
        const score = productionValue(p, plan);
        if (score > best.score) best = { score, plan };
      }
      return;
    }
    for (let q = 0; q <= p.products[i]!.max; q++) {
      qty[i] = q;
      visit(i + 1);
    }
    qty[i] = 0;
  };
  visit(0);
  return best;
}

/** How many pieces of one product fit (alone), up to its maximum. */
const fitAlone = (p: ProductionProblem, i: number) => {
  const product = p.products[i]!;
  let q = product.max;
  p.resources.forEach((res, r) => {
    if (product.use[r]! > 0) q = Math.min(q, Math.floor(res.stock / product.use[r]!));
  });
  return q;
};

/** "Only the most valuable product, as many as fit." */
export function singleProductPlan(p: ProductionProblem): ProductionPlan {
  let top = 0;
  p.products.forEach((product, i) => {
    if (product.value > p.products[top]!.value) top = i;
  });
  return { qty: p.products.map((_, i) => (i === top ? fitAlone(p, i) : 0)) };
}

/**
 * The greedy habit: add one piece of the product with the best value per unit of the currently scarcest resource
 * (smallest share of its stock left), while anything fits.
 */
export function greedyPlan(p: ProductionProblem): ProductionPlan {
  const qty = p.products.map(() => 0);
  for (;;) {
    const use = resourceUse(p, qty);
    const left = p.resources.map((res, r) => res.stock - use[r]!);
    let scarce = 0;
    left.forEach((l, r) => {
      if (l / p.resources[r]!.stock < left[scarce]! / p.resources[scarce]!.stock) scarce = r;
    });
    let pick = -1;
    let rate = -1;
    p.products.forEach((product, i) => {
      if (qty[i]! >= product.max || product.use.some((u, r) => u > left[r]!)) return;
      const u = product.use[scarce]!;
      const r = u === 0 ? Number.POSITIVE_INFINITY : product.value / u;
      if (r > rate) [pick, rate] = [i, r];
    });
    if (pick < 0) return { qty };
    qty[pick] = qty[pick]! + 1;
  }
}

/* ---------- Generator ---------- */

interface ProdLevel {
  products: number;
  resources: ResourceId[];
  use: [number, number];
  setup: [number, number];
}
const LEVELS: Record<Difficulty, ProdLevel> = {
  easy: { products: 3, resources: ['wood'], use: [1, 4], setup: [0, 0] },
  medium: { products: 3, resources: ['wood', 'hours'], use: [1, 4], setup: [0, 0] },
  hard: { products: 4, resources: ['wood', 'fittings', 'hours'], use: [0, 4], setup: [2, 5] }
};

function attemptProduction(rng: Rng, difficulty: Difficulty): ProductionProblem {
  const level = LEVELS[difficulty];
  const ids = rng.shuffle(PRODUCT_IDS).slice(0, level.products);
  // Products in the fixed list order, so a stool always comes before a table.
  ids.sort((a, b) => PRODUCT_IDS.indexOf(a) - PRODUCT_IDS.indexOf(b));
  const products: Product[] = ids.map((id) => {
    let use: number[];
    do use = level.resources.map(() => rng.int(level.use[0], level.use[1]));
    while (use.filter((u) => u > 0).length < Math.min(2, level.resources.length) || use.every((u) => u === 0));
    const effort = use.reduce((a, b) => a + b, 0);
    const value = Math.min(40, Math.max(2, Math.round(effort * (1.6 + 1.6 * rng.next()))));
    return { id, value, use, max: rng.int(3, 5), setup: rng.int(level.setup[0], level.setup[1]) };
  });
  const resources: Resource[] = level.resources.map((id, r) => {
    const demand = products.reduce((sum, product) => sum + product.use[r]! * product.max, 0);
    const largest = Math.max(1, ...products.map((product) => product.use[r]!));
    const stock = Math.round((0.4 + 0.3 * rng.next()) * demand);
    return { id, stock: Math.min(30, Math.max(largest, stock)) };
  });
  return { kind: 'production', resources, products };
}

/**
 * Interest filters (§ 5.3): the optimum is positive and beats "only the most valuable product"; on medium/hard it
 * also beats the scarcest-resource greedy and makes at least two different products.
 */
export function productionIsInteresting(p: ProductionProblem, difficulty: Difficulty): boolean {
  const best = solveProduction(p);
  if (best.score <= 0 || productionValue(p, singleProductPlan(p)) >= best.score) return false;
  if (difficulty === 'easy') return true;
  return productionValue(p, greedyPlan(p)) < best.score && best.plan.qty.filter((q) => q > 0).length >= 2;
}

/** Fixed instances (frozen generator output, seed 2026) for the rare case that 200 attempts find nothing; tests check them. */
export const PRODUCTION_FALLBACK: Record<Difficulty, ProductionProblem> = {
  easy: {
    kind: 'production',
    resources: [
      { id: 'wood', stock: 9 }
    ],
    products: [
      { id: 'stool', value: 2, use: [1], max: 5, setup: 0 },
      { id: 'shelf', value: 3, use: [2], max: 3, setup: 0 },
      { id: 'crate', value: 4, use: [2], max: 3, setup: 0 }
    ]
  },
  medium: {
    kind: 'production',
    resources: [
      { id: 'wood', stock: 13 },
      { id: 'hours', stock: 25 }
    ],
    products: [
      { id: 'stool', value: 15, use: [1, 4], max: 3, setup: 0 },
      { id: 'table', value: 13, use: [1, 4], max: 5, setup: 0 },
      { id: 'crate', value: 12, use: [3, 2], max: 5, setup: 0 }
    ]
  },
  hard: {
    kind: 'production',
    resources: [
      { id: 'wood', stock: 8 },
      { id: 'fittings', stock: 17 },
      { id: 'hours', stock: 18 }
    ],
    products: [
      { id: 'stool', value: 12, use: [0, 1, 3], max: 3, setup: 2 },
      { id: 'chair', value: 7, use: [0, 3, 1], max: 3, setup: 3 },
      { id: 'shelf', value: 13, use: [2, 4, 2], max: 3, setup: 3 },
      { id: 'crate', value: 31, use: [3, 4, 4], max: 3, setup: 3 }
    ]
  }
};

export function generateProduction(rng: Rng, difficulty: Difficulty): { problem: ProductionProblem; fallback: boolean } {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const problem = attemptProduction(rng, difficulty);
    if (isProductionProblem(problem) && productionIsInteresting(problem, difficulty)) return { problem, fallback: false };
  }
  return { problem: structuredClone(PRODUCTION_FALLBACK[difficulty]), fallback: true };
}
