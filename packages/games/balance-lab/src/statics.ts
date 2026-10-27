/**
 * Weight & Balance statics (design § 8): exact integer arithmetic only. Every verdict in the game is one of these
 * functions; motion and pictures are derived from their results and never feed back.
 */

export type Side = 'left-down' | 'level' | 'right-down';

/* ---------------- Beam (§ 8.2) ---------------- */

export interface BeamWeight {
  kg: number;
  hook: number;
  /** Placed by the player from the tray (build tasks); fixed parts have no flag. */
  free?: boolean;
}

export interface BeamScene {
  /** Hooks run from −half to +half. */
  half: number;
  /** The hole the axle goes through. */
  axle: number;
  /** The bar's own mass, acting at its middle (position 0). */
  barKg: number;
  weights: BeamWeight[];
}

export const sideOf = (net: number): Side => (net < 0 ? 'left-down' : net > 0 ? 'right-down' : 'level');

/** Moment of every weight about the axle (kg·step, positive = clockwise = right side down), the bar last. */
export function beamMoments(scene: BeamScene): { weights: number[]; bar: number } {
  return { weights: scene.weights.map((w) => w.kg * (w.hook - scene.axle)), bar: scene.barKg * (0 - scene.axle) };
}

export function beamNet(scene: BeamScene): number {
  const m = beamMoments(scene);
  return m.weights.reduce((a, b) => a + b, 0) + m.bar;
}

export const beamVerdict = (scene: BeamScene): Side => sideOf(beamNet(scene));

/** Sum of the left and right turning effects (each ≥ 0). */
export function beamSides(scene: BeamScene): { left: number; right: number } {
  const m = beamMoments(scene);
  let left = 0;
  let right = 0;
  for (const v of [...m.weights, m.bar]) {
    if (v < 0) left -= v;
    else right += v;
  }
  return { left, right };
}

/* ---------------- Mobile (§ 8.3) ---------------- */

export interface MobileWeight {
  kg: number;
  free?: boolean;
}
export interface MobileHook {
  pos: number;
  child: MobileNode | null;
}
export interface MobileBar {
  /** Hooks and the string hole lie in 0…width. */
  width: number;
  /** The hole the bar hangs from. */
  string: number;
  hooks: MobileHook[];
}
export type MobileNode = { kg: number; free?: boolean } | { bar: MobileBar };

export const isBar = (node: MobileNode): node is { bar: MobileBar } => 'bar' in node;

export function mobileMass(node: MobileNode | null): number {
  if (node === null) return 0;
  if (!isBar(node)) return node.kg;
  return node.bar.hooks.reduce((sum, h) => sum + mobileMass(h.child), 0);
}

export function barNet(bar: MobileBar): number {
  return bar.hooks.reduce((sum, h) => sum + mobileMass(h.child) * (h.pos - bar.string), 0);
}

/** All bars, depth-first (the top bar first, then each hook's sub-mobile from left to right). */
export function mobileBars(node: MobileNode): MobileBar[] {
  if (!isBar(node)) return [];
  const out: MobileBar[] = [node.bar];
  for (const h of node.bar.hooks) if (h.child) out.push(...mobileBars(h.child));
  return out;
}

export const mobileVerdicts = (node: MobileNode): Side[] => mobileBars(node).map((b) => sideOf(barNet(b)));

export const mobileLevel = (node: MobileNode): boolean => mobileVerdicts(node).every((s) => s === 'level');

/** Depth of a bar tree (a weight is 0, one bar 1). */
export function mobileDepth(node: MobileNode | null): number {
  if (node === null || !isBar(node)) return 0;
  return 1 + Math.max(0, ...node.bar.hooks.map((h) => mobileDepth(h.child)));
}

/* ---------------- Stack (§ 8.4) ---------------- */

export type BodyKind = 'block' | 'plank' | 'stone';
export interface StackBody {
  kind: BodyKind;
  /** Left end in cm; the table ends at x = 0. */
  left: number;
}
export interface StackCube {
  kg: number;
  /** Index of the body it sits on. */
  on: number;
  /** Centre in cm. */
  x: number;
  free?: boolean;
}
export interface StackScene {
  bodies: StackBody[];
  cubes: StackCube[];
  /** A bucket hanging from body `on` at x (stack-counter). */
  bucket?: { kg: number; on: number; x: number };
}

export const BODY_LENGTH: Readonly<Record<BodyKind, number>> = { block: 24, plank: 48, stone: 24 };
export const BODY_MASS: Readonly<Record<BodyKind, number>> = { block: 1, plank: 2, stone: 2 };
export const CUBE_WIDTH = 6;

export const bodyRight = (b: StackBody): number => b.left + BODY_LENGTH[b.kind];
/** Centre ×2 is always an integer; all lengths are even, so the centre itself is too. */
export const bodyCentre = (b: StackBody): number => b.left + BODY_LENGTH[b.kind] / 2;

export interface Joint {
  /** Joint k: body k on its support (k = 0: the table). */
  k: number;
  /** Σ m·x and Σ m of everything above the joint. */
  S: number;
  M: number;
  lo: number;
  hi: number;
  holds: boolean;
  /** The centre of mass lies exactly over an edge of the contact. */
  edge: boolean;
  /** Direction a failing part tips. */
  dir: 'left' | 'right' | null;
}

/** Contact interval of body k with its support; `null` when there is no contact of at least 1 cm. */
export function contactOf(scene: StackScene, k: number): { lo: number; hi: number } | null {
  const b = scene.bodies[k];
  if (!b) return null;
  const below = k === 0 ? { lo: Number.NEGATIVE_INFINITY, hi: 0 } : { lo: scene.bodies[k - 1]!.left, hi: bodyRight(scene.bodies[k - 1]!) };
  const lo = Math.max(b.left, below.lo);
  const hi = Math.min(bodyRight(b), below.hi);
  return hi - lo >= 1 ? { lo, hi } : null;
}

export function stackJoints(scene: StackScene): Joint[] {
  const n = scene.bodies.length;
  const joints: Joint[] = [];
  for (let k = 0; k < n; k++) {
    let S = 0;
    let M = 0;
    for (let j = k; j < n; j++) {
      const b = scene.bodies[j]!;
      const m = BODY_MASS[b.kind];
      S += m * bodyCentre(b);
      M += m;
    }
    for (const c of scene.cubes) {
      if (c.on >= k) {
        S += c.kg * c.x;
        M += c.kg;
      }
    }
    if (scene.bucket && scene.bucket.on >= k) {
      S += scene.bucket.kg * scene.bucket.x;
      M += scene.bucket.kg;
    }
    const c = contactOf(scene, k) ?? { lo: 0, hi: 0 };
    const tooRight = S > c.hi * M;
    const tooLeft = S < c.lo * M;
    const holds = !tooRight && !tooLeft;
    joints.push({ k, S, M, lo: c.lo, hi: c.hi, holds, edge: holds && (S === c.lo * M || S === c.hi * M), dir: tooRight ? 'right' : tooLeft ? 'left' : null });
  }
  return joints;
}

export interface StackVerdict {
  stands: boolean;
  edge: boolean;
  failing: { joint: number; dir: 'left' | 'right' }[];
  /** How far the top body reaches past the table edge (cm, may be negative). */
  overhang: number;
}

export function stackVerdict(scene: StackScene): StackVerdict {
  const joints = stackJoints(scene);
  const failing = joints.filter((j) => !j.holds).map((j) => ({ joint: j.k, dir: j.dir! }));
  const top = scene.bodies[scene.bodies.length - 1];
  return { stands: failing.length === 0, edge: failing.length === 0 && joints.some((j) => j.edge), failing, overhang: top ? bodyRight(top) : 0 };
}

/** Every body has at least 1 cm of contact with its support (the UI never allows less). */
export const stackContactsOk = (scene: StackScene): boolean => scene.bodies.every((_, k) => contactOf(scene, k) !== null);

/**
 * The best overhang of n blocks (24 cm) on the 1 cm grid, single column (design § 9.3, Appendix C): top-down, each
 * lower block's right edge at the centre of mass of everything above, rounded up to the grid; the table edge likewise.
 * Returns the overhang and the left ends of the blocks, bottom to top, relative to the table edge.
 */
export function bestOverhang(n: number): { overhang: number; lefts: number[] } {
  const L = BODY_LENGTH.block;
  const rel: number[] = [0];
  let S = L / 2;
  let M = 1;
  for (let i = 1; i < n; i++) {
    const right = Math.ceil(S / M);
    const left = right - L;
    rel.push(left);
    S += left + L / 2;
    M += 1;
  }
  const edge = n > 0 ? Math.ceil(S / M) : 0;
  const lefts = rel.map((x) => x - edge).reverse();
  return { overhang: n > 0 ? L - edge : 0, lefts };
}
