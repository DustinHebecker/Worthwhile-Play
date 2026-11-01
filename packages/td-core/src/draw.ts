import type { Entity, World } from '@wp/strategy-engine';
import { drawIcon, drawTerrainMap, type TerrainColours } from '@wp/strategy-art';
import { isStructureKind, TOWERS, type Family } from './ruleset';

/**
 * Canvas painting of the map (view only, floats allowed), in the look of the strategy game
 * (owner, 2026-10-31): its terrain renderer and its unit and structure pictures from
 * @wp/strategy-art. Own towers are filled in the player colour and face right; wave units are a
 * pale tint with an outline in the opponent colour and face the other way. Level and branch are
 * drawn as pips, status effects as rings and crosses: nothing depends on colour alone.
 */

export interface Palette {
  surface: string;
  ink: string;
  muted: string;
  own: string;
  enemy: string;
  focus: string;
  grid: string;
  terrain: TerrainColours & { key: string };
}

const TERRAIN_FALLBACK: Readonly<Record<string, string>> = { plain: '#e7e3d4', road: '#cfc8b4', ridge: '#c4bfb3', water: '#a9c7dd' };
const TERRAIN_FALLBACK_DARK: Readonly<Record<string, string>> = { plain: '#3a3a32', road: '#4a473d', ridge: '#5a5650', water: '#2a4356' };

export function readPalette(el: Element): Palette {
  const css = typeof getComputedStyle === 'function' ? getComputedStyle(el) : undefined;
  const v = (name: string, fallback: string): string => css?.getPropertyValue(name).trim() || fallback;
  const surface = v('--wp-surface', '#ffffff');
  const dark = isDark(surface);
  const fallback = dark ? TERRAIN_FALLBACK_DARK : TERRAIN_FALLBACK;
  const ground = Object.fromEntries(Object.keys(TERRAIN_FALLBACK).map((n) => [n, v(`--td-${n}`, fallback[n]!)]));
  return {
    surface,
    ink: v('--wp-text', '#1d1d1b'),
    muted: v('--wp-muted', '#5c5b55'),
    own: v('--wp-p1', '#24508f'),
    enemy: v('--wp-p2', '#9a3412'),
    focus: v('--wp-focus', '#b4530a'),
    grid: v('--td-grid', dark ? 'rgba(236, 235, 228, 0.14)' : 'rgba(29, 29, 27, 0.14)'),
    terrain: { base: (n) => ground[n] ?? ground.plain!, dark, key: Object.values(ground).join() }
  };
}

function isDark(colour: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(colour);
  if (!m) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1]!.slice(i, i + 2), 16));
  return r! + g! + b! < 3 * 110;
}

/** TD terrain codes → the strategy terrain they look like (a build pad is open ground). */
const LOOKS: Readonly<Record<string, string>> = { b: '.', '=': '=', '^': '^', '~': '~' };

/** The terrain of a map drawn once into `g` (the view caches it per size and theme). */
export function drawTerrain(g: CanvasRenderingContext2D, world: World, cell: number, palette: Palette): void {
  const { map } = world;
  const terrain = [...map.terrain].map((c) => LOOKS[c] ?? '.').join('');
  drawTerrainMap(g, { w: map.w, h: map.h, terrain }, cell, palette.terrain, 'profile', 'fine');
  // Cell grid, so every build pad reads as a cell.
  g.strokeStyle = palette.grid;
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 1; x < map.w; x++) {
    g.moveTo(x * cell + 0.5, 0);
    g.lineTo(x * cell + 0.5, map.h * cell);
  }
  for (let y = 1; y < map.h; y++) {
    g.moveTo(0, y * cell + 0.5);
    g.lineTo(map.w * cell, y * cell + 0.5);
  }
  g.stroke();
}

/** Strategy pictures for the tower families. */
export const TOWER_ICON: Readonly<Record<Family, string>> = {
  gun: 'tower-gun',
  artillery: 'tower-artillery',
  laser: 'tower-laser',
  support: 'tower-support',
  specialist: 'tower-emp'
};

/** Strategy pictures for the wave units, and their size (one cell = 1). */
export const ENEMY_ICON: Readonly<Record<string, readonly [string, number]>> = {
  walker: ['rifles', 0.85],
  runner: ['outrider', 0.8],
  swarm: ['rifles', 0.55],
  brute: ['warden', 0.95],
  glider: ['kite', 0.8],
  raider: ['lancer', 0.85],
  crawler: ['warden', 1.35]
};

export interface Frame {
  world: World;
  /** Positions before the last step (for interpolation), by entity id. */
  prev: ReadonlyMap<number, readonly [number, number]>;
  /** 0..1 between the previous and the current tick. */
  alpha: number;
  /** Beams fired in the last tick: shooter → target cells. */
  beams: readonly (readonly [number, number, number, number])[];
  /** Shells that landed in the last tick. */
  blasts: readonly (readonly [number, number, number])[];
  selected: { x: number; y: number } | null;
  /** Road entries (spawn cells) and the cores at the ends of the roads, with their side. */
  entries: readonly (readonly [number, number])[];
  goals: readonly { readonly x: number; readonly y: number; readonly side: number }[];
  /** The side whose pieces are drawn as own (filled, facing right); default 0. */
  viewer?: number;
  hpMax: (kind: string) => number;
  splashOf: (kind: string) => number;
}

const TAU = Math.PI * 2;
const has = (e: Entity, kind: 'slowed' | 'disabled'): boolean => e.status.some((s) => s.kind === kind && s.ticks > 0);

/** Draws one frame; `terrain` is the cached terrain layer (or null to draw plain cells). */
export function drawFrame(g: CanvasRenderingContext2D, width: number, palette: Palette, f: Frame, terrain: CanvasImageSource | null): void {
  const { map } = f.world;
  const cell = width / map.w;
  g.clearRect(0, 0, width, cell * map.h);
  if (terrain) g.drawImage(terrain, 0, 0, width, cell * map.h);
  const k = cell / 44;
  const own = { own: true, colour: palette.own, surface: palette.surface, view: 'profile' as const };
  const foe = { own: false, colour: palette.enemy, surface: palette.surface, view: 'profile' as const };

  const viewer = f.viewer ?? 0;
  const styleOf = (side: number) => (side === viewer ? own : foe);
  const colourOf = (side: number) => (side === viewer ? palette.own : palette.enemy);
  // Entry: a chevron into the road. Each core: its side's Command Post.
  g.strokeStyle = palette.ink;
  g.lineWidth = Math.max(2, cell * 0.05);
  for (const [x, y] of f.entries) {
    const cx = (x + 0.5) * cell;
    const cy = (y + 0.5) * cell;
    g.beginPath();
    g.moveTo(cx - cell * 0.22, cy - cell * 0.12);
    g.lineTo(cx, cy + cell * 0.1);
    g.lineTo(cx + cell * 0.22, cy - cell * 0.12);
    g.stroke();
  }
  for (const goal of f.goals) {
    if (drawIcon(g, 'command-post', goal.x * cell, goal.y * cell, k, styleOf(goal.side))) continue;
    for (const r of [0.36, 0.22]) {
      g.beginPath();
      g.arc((goal.x + 0.5) * cell, (goal.y + 0.5) * cell, cell * r, 0, TAU);
      g.stroke();
    }
  }

  const pos = (e: Entity): [number, number] => {
    const p = f.prev.get(e.id);
    const [px, py] = p ?? [e.x, e.y];
    return [(px + (e.x - px) * f.alpha + 0.5) * cell, (py + (e.y - py) * f.alpha + 0.5) * cell];
  };

  // Incoming shells: a dashed ring on the landing cell, as large as the blast.
  g.strokeStyle = palette.ink;
  g.lineWidth = 1.5;
  g.setLineDash([3, 3]);
  for (const p of f.world.projectiles) {
    g.beginPath();
    g.arc((p.x + 0.5) * cell, (p.y + 0.5) * cell, Math.max(3, cell * (0.2 + f.splashOf(p.kind))), 0, TAU);
    g.stroke();
  }
  g.setLineDash([]);

  // Towers.
  for (const e of f.world.entities) {
    const def = Object.hasOwn(TOWERS, e.kind) ? TOWERS[e.kind] : undefined;
    if (!def) continue;
    const [cx, cy] = pos(e);
    if (!drawIcon(g, TOWER_ICON[def.family], cx - cell / 2, cy - cell / 2, k, styleOf(e.side))) fallbackShape(g, cx, cy, cell * 0.3, colourOf(e.side), palette.surface);
    // Level pips along the bottom edge: filled for branch A, hollow for branch B.
    g.fillStyle = colourOf(e.side);
    g.strokeStyle = colourOf(e.side);
    g.lineWidth = 1.5;
    for (let i = 0; i < def.level; i++) {
      g.beginPath();
      g.arc(cx - cell * 0.18 + i * cell * 0.18, cy + cell * 0.36, cell * 0.06, 0, TAU);
      if (def.branch === 'b') g.stroke();
      else g.fill();
    }
    const max = f.hpMax(e.kind);
    if (e.hp < max) bar(g, cx, cy - cell * 0.44, cell * 0.6, e.hp / max, colourOf(e.side), palette.muted);
  }

  // Economy structures (hybrid): their strategy picture, no pips.
  for (const e of f.world.entities) {
    if (!isStructureKind(e.kind)) continue;
    const [cx, cy] = pos(e);
    if (!drawIcon(g, e.kind, cx - cell / 2, cy - cell / 2, k, styleOf(e.side))) fallbackShape(g, cx, cy, cell * 0.25, colourOf(e.side), palette.surface);
    const max = f.hpMax(e.kind);
    if (e.hp < max) bar(g, cx, cy - cell * 0.44, cell * 0.6, e.hp / max, colourOf(e.side), palette.muted);
  }

  // Beams.
  g.lineWidth = Math.max(2, cell * 0.05);
  g.strokeStyle = palette.focus;
  for (const [sx, sy, tx, ty] of f.beams) {
    g.beginPath();
    g.moveTo((sx + 0.5) * cell, (sy + 0.5) * cell);
    g.lineTo((tx + 0.5) * cell, (ty + 0.5) * cell);
    g.stroke();
  }

  // Wave units.
  for (const e of f.world.entities) {
    if (Object.hasOwn(TOWERS, e.kind) || isStructureKind(e.kind)) continue;
    const [cx, cy] = pos(e);
    const [icon, size] = ENEMY_ICON[e.kind] ?? ['rifles', 0.8];
    const s = cell * size;
    if (!drawIcon(g, icon, cx - s / 2, cy - s / 2, (k * s) / cell, styleOf(e.side))) {
      g.beginPath();
      g.arc(cx, cy, s * 0.3, 0, TAU);
      g.fillStyle = colourOf(e.side);
      g.fill();
    }
    if (e.kind === 'crawler') {
      g.strokeStyle = colourOf(e.side);
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, s * 0.55, 0, TAU);
      g.stroke();
    }
    if (has(e, 'slowed')) {
      g.setLineDash([2, 3]);
      g.strokeStyle = palette.ink;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(cx, cy, cell * 0.42, 0, TAU);
      g.stroke();
      g.setLineDash([]);
    }
    if (has(e, 'disabled')) {
      g.strokeStyle = palette.ink;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - cell * 0.3, cy - cell * 0.3);
      g.lineTo(cx + cell * 0.3, cy + cell * 0.3);
      g.moveTo(cx + cell * 0.3, cy - cell * 0.3);
      g.lineTo(cx - cell * 0.3, cy + cell * 0.3);
      g.stroke();
    }
    const max = f.hpMax(e.kind);
    if (e.hp < max) bar(g, cx, cy - s * 0.5, cell * 0.5, e.hp / max, colourOf(e.side), palette.muted);
  }

  // Blasts.
  g.strokeStyle = palette.ink;
  g.lineWidth = 2;
  for (const [x, y] of f.blasts) {
    g.beginPath();
    g.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.35, 0, TAU);
    g.stroke();
  }
  if (f.selected) {
    g.strokeStyle = palette.focus;
    g.lineWidth = 3;
    g.strokeRect(f.selected.x * cell + 2, f.selected.y * cell + 2, cell - 4, cell - 4);
  }
}

function fallbackShape(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, edge: string): void {
  g.beginPath();
  g.rect(cx - r, cy - r, 2 * r, 2 * r);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = edge;
  g.stroke();
}

function bar(g: CanvasRenderingContext2D, cx: number, y: number, w: number, share: number, fill: string, frame: string): void {
  g.fillStyle = frame;
  g.fillRect(cx - w / 2, y - 2, w, 4);
  g.fillStyle = fill;
  g.fillRect(cx - w / 2, y - 2, w * Math.max(0, Math.min(1, share)), 4);
}
