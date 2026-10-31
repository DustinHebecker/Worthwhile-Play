import type { Entity, World } from '@wp/strategy-engine';
import { TOWERS, type Family } from './ruleset';

/**
 * Canvas painting of the map (view only, floats allowed). Every tower family and every enemy kind
 * has its own silhouette, and states (slowed, stopped, damaged, level) are drawn as shapes and
 * marks, so nothing depends on colour alone.
 */

export interface Palette {
  surface: string;
  road: string;
  pad: string;
  rock: string;
  ink: string;
  muted: string;
  tower: string;
  enemy: string;
  accent: string;
  focus: string;
}

const FALLBACK: Palette = {
  surface: '#ffffff',
  road: '#cdbf9c',
  pad: '#f6f4ef',
  rock: '#8d8a80',
  ink: '#1d1d1b',
  muted: '#5c5b55',
  tower: '#2f5d50',
  enemy: '#a1271b',
  accent: '#2f5d50',
  focus: '#b4530a'
};

export function readPalette(el: Element): Palette {
  if (typeof getComputedStyle !== 'function') return FALLBACK;
  const css = getComputedStyle(el);
  const v = (name: string, fallback: string): string => css.getPropertyValue(name).trim() || fallback;
  return {
    surface: v('--wp-surface', FALLBACK.surface),
    road: v('--td-road', FALLBACK.road),
    pad: v('--td-pad', FALLBACK.pad),
    rock: v('--td-rock', FALLBACK.rock),
    ink: v('--wp-text', FALLBACK.ink),
    muted: v('--wp-muted', FALLBACK.muted),
    tower: v('--wp-accent', FALLBACK.tower),
    enemy: v('--wp-danger', FALLBACK.enemy),
    accent: v('--wp-accent', FALLBACK.accent),
    focus: v('--wp-focus', FALLBACK.focus)
  };
}

export interface Frame {
  world: World;
  /** Positions before the last step (for interpolation), by entity id. */
  prev: ReadonlyMap<number, readonly [number, number]>;
  /** 0..1 between the previous and the current tick. */
  alpha: number;
  /** Beams fired in the last tick: shooter → target cells. */
  beams: readonly (readonly [number, number, number, number])[];
  /** Shells that landed in the last tick, with splash radius in cells. */
  blasts: readonly (readonly [number, number, number])[];
  selected: { x: number; y: number } | null;
  /** Road entries (spawn cells) and the end of the road (the core). */
  entries: readonly (readonly [number, number])[];
  goal: readonly [number, number];
  hpMax: (kind: string) => number;
  splashOf: (kind: string) => number;
}

const TAU = Math.PI * 2;

function towerShape(g: CanvasRenderingContext2D, family: Family, cx: number, cy: number, r: number): void {
  g.beginPath();
  switch (family) {
    case 'gun':
      g.rect(cx - r, cy - r, 2 * r, 2 * r);
      break;
    case 'artillery':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + TAU / 16;
        g[i === 0 ? 'moveTo' : 'lineTo'](cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      g.closePath();
      break;
    case 'laser':
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r, cy);
      g.lineTo(cx, cy + r);
      g.lineTo(cx - r, cy);
      g.closePath();
      break;
    case 'support':
      g.arc(cx, cy, r, 0, TAU);
      break;
    case 'specialist':
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r, cy + r * 0.8);
      g.lineTo(cx - r, cy + r * 0.8);
      g.closePath();
      break;
  }
}

function enemyShape(g: CanvasRenderingContext2D, kind: string, cx: number, cy: number, cell: number): void {
  const r = cell * 0.22;
  g.beginPath();
  switch (kind) {
    case 'runner':
      g.moveTo(cx, cy - r * 1.2);
      g.lineTo(cx + r * 0.8, cy + r);
      g.lineTo(cx - r * 0.8, cy + r);
      g.closePath();
      break;
    case 'swarm':
      g.arc(cx, cy, r * 0.55, 0, TAU);
      break;
    case 'brute':
      g.rect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
      break;
    case 'glider':
      g.moveTo(cx - r * 1.4, cy - r * 0.6);
      g.lineTo(cx, cy + r * 0.8);
      g.lineTo(cx + r * 1.4, cy - r * 0.6);
      g.lineTo(cx, cy);
      g.closePath();
      break;
    case 'raider':
      g.arc(cx, cy, r * 1.1, 0, TAU);
      break;
    case 'colossus':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        g[i === 0 ? 'moveTo' : 'lineTo'](cx + r * 1.9 * Math.cos(a), cy + r * 1.9 * Math.sin(a));
      }
      g.closePath();
      break;
    default:
      g.arc(cx, cy, r, 0, TAU);
  }
}

const has = (e: Entity, kind: 'slowed' | 'disabled'): boolean => e.status.some((s) => s.kind === kind && s.ticks > 0);

export function drawFrame(g: CanvasRenderingContext2D, width: number, palette: Palette, f: Frame): void {
  const { map } = f.world;
  const cell = width / map.w;
  g.clearRect(0, 0, width, cell * map.h);
  // Terrain: road plain, pads with a dotted centre, rock hatched.
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const code = map.terrain[y * map.w + x];
      const px = x * cell;
      const py = y * cell;
      g.fillStyle = code === '=' ? palette.road : code === 'b' ? palette.pad : palette.rock;
      g.fillRect(px, py, cell, cell);
      g.strokeStyle = palette.muted;
      g.globalAlpha = 0.25;
      g.lineWidth = 1;
      g.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
      if (code === 'b') {
        g.fillStyle = palette.muted;
        g.beginPath();
        g.arc(px + cell / 2, py + cell / 2, Math.max(1, cell * 0.04), 0, TAU);
        g.fill();
      } else if (code !== '=') {
        g.beginPath();
        for (let k = -cell; k < cell; k += cell / 4) {
          g.moveTo(px + Math.max(0, k), py + Math.max(0, -k));
          g.lineTo(px + Math.min(cell, cell + k), py + Math.min(cell, cell - k));
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  }
  // Entry: a chevron pointing into the road. Core: a double ring.
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
  {
    const cx = (f.goal[0] + 0.5) * cell;
    const cy = (f.goal[1] + 0.5) * cell;
    for (const r of [0.36, 0.22]) {
      g.beginPath();
      g.arc(cx, cy, cell * r, 0, TAU);
      g.stroke();
    }
  }
  const pos = (e: Entity): [number, number] => {
    const p = f.prev.get(e.id);
    const [px, py] = p ?? [e.x, e.y];
    return [(px + (e.x - px) * f.alpha + 0.5) * cell, (py + (e.y - py) * f.alpha + 0.5) * cell];
  };
  // Incoming shells: a shrinking ring on the landing cell.
  for (const p of f.world.projectiles) {
    g.strokeStyle = palette.ink;
    g.setLineDash([3, 3]);
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc((p.x + 0.5) * cell, (p.y + 0.5) * cell, Math.max(2, cell * (0.15 + 0.35 * f.splashOf(p.kind))), 0, TAU);
    g.stroke();
    g.setLineDash([]);
  }
  // Towers.
  for (const e of f.world.entities) {
    if (e.side !== 0) continue;
    const def = TOWERS[e.kind];
    if (!def) continue;
    const [cx, cy] = pos(e);
    const r = cell * 0.3;
    towerShape(g, def.family, cx, cy, r);
    g.fillStyle = palette.surface;
    g.fill();
    g.lineWidth = Math.max(2, cell * 0.06);
    g.strokeStyle = palette.tower;
    g.stroke();
    // Level pips under the shape; branch B pips hollow, A filled.
    for (let i = 0; i < def.level; i++) {
      g.beginPath();
      g.arc(cx - cell * 0.16 + i * cell * 0.16, cy + cell * 0.42, cell * 0.05, 0, TAU);
      g.fillStyle = palette.tower;
      if (def.branch === 'b') {
        g.lineWidth = 1.5;
        g.stroke();
      } else g.fill();
    }
    const max = f.hpMax(e.kind);
    if (e.hp < max) bar(g, cx, cy - cell * 0.44, cell * 0.6, e.hp / max, palette.tower, palette.muted);
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
  // Enemies.
  for (const e of f.world.entities) {
    if (e.side !== 1) continue;
    const [cx, cy] = pos(e);
    enemyShape(g, e.kind, cx, cy, cell);
    g.fillStyle = palette.enemy;
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = palette.surface;
    g.stroke();
    if (e.kind === 'raider' || e.kind === 'colossus') {
      g.beginPath();
      g.moveTo(cx - cell * 0.1, cy);
      g.lineTo(cx + cell * 0.1, cy);
      g.moveTo(cx, cy - cell * 0.1);
      g.lineTo(cx, cy + cell * 0.1);
      g.stroke();
    }
    if (has(e, 'slowed')) {
      g.setLineDash([2, 3]);
      g.strokeStyle = palette.ink;
      g.beginPath();
      g.arc(cx, cy, cell * 0.38, 0, TAU);
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
    if (e.hp < max) bar(g, cx, cy - cell * 0.4, cell * 0.5, e.hp / max, palette.enemy, palette.muted);
  }
  // Blasts.
  g.strokeStyle = palette.ink;
  g.lineWidth = 2;
  for (const [x, y, splash] of f.blasts) {
    g.beginPath();
    g.arc((x + 0.5) * cell, (y + 0.5) * cell, Math.max(cell * 0.3, (splash + 0.5) * cell), 0, TAU);
    g.stroke();
  }
  if (f.selected) {
    g.strokeStyle = palette.focus;
    g.lineWidth = 3;
    g.strokeRect(f.selected.x * cell + 2, f.selected.y * cell + 2, cell - 4, cell - 4);
  }
}

function bar(g: CanvasRenderingContext2D, cx: number, y: number, w: number, share: number, fill: string, frame: string): void {
  g.fillStyle = frame;
  g.fillRect(cx - w / 2, y - 2, w, 4);
  g.fillStyle = fill;
  g.fillRect(cx - w / 2, y - 2, w * Math.max(0, Math.min(1, share)), 4);
}
