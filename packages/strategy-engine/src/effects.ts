import { isInt, isRecord } from '@wp/game-core';
import type { Archetype, AuraSpec, Entity, Ruleset, ShieldSpec } from './types';

/**
 * Tower Defense extensions E1–E3 (ADR 0009 amendment): pure integer helpers used by the
 * simulation. Nothing here is used unless an archetype opts in (`pierce`, `aura`, `shield`,
 * `marked` effects), so rulesets without these fields behave exactly as before.
 */

/** `round(a / b)` with halves rounded away from zero (b > 0): symmetric under negation. */
const roundDiv = (a: number, b: number): number => Math.sign(a) * Math.floor((2 * Math.abs(a) + b) / (2 * b));

/**
 * Cells of the integer line from (x0, y0) through (x1, y1) and beyond, while `keep(x, y)` holds
 * (it is asked in order and the walk stops at the first refusal); the start cell is left out. Each
 * step advances the major axis by one cell; the minor offset is rounded half away from zero, so
 * the line is the exact mirror or rotation of itself under every symmetry of the grid (P4).
 */
export function lineCells(x0: number, y0: number, x1: number, y1: number, keep: (x: number, y: number) => boolean): [number, number][] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const major = Math.max(Math.abs(dx), Math.abs(dy));
  const cells: [number, number][] = [];
  if (major === 0) return cells;
  for (let i = 1; ; i++) {
    const x = x0 + roundDiv(i * dx, major);
    const y = y0 + roundDiv(i * dy, major);
    if (!keep(x, y)) return cells;
    cells.push([x, y]);
  }
}

/**
 * How incoming damage splits between shield and health. `beam` and `other` are the summed damage
 * of the tick by delivery (after `marked`). Beam damage meets the shield first and counts ×3/2
 * against it (rounded down); what is left of the shield then absorbs the other damage. Depends
 * only on the sums, so the order of the hits never matters.
 */
export function absorb(shield: number, beam: number, other: number): { shield: number; hp: number } {
  const beamShield = Math.floor((beam * 3) / 2);
  if (beamShield >= shield) {
    // Beam points needed to strip the shield: the smallest k with floor(3k / 2) >= shield.
    const used = Math.ceil((2 * shield) / 3);
    return { shield: 0, hp: beam - used + other };
  }
  const left = shield - beamShield;
  return other >= left ? { shield: 0, hp: other - left } : { shield: left - other, hp: 0 };
}

/** Extra damage taken in percent from a `marked` status (0 when not marked). */
export const markOf = (e: Entity): number => e.status.reduce((max, s) => (s.kind === 'marked' && s.ticks > 0 ? Math.max(max, s.amount ?? 0) : max), 0);

/** Damage raised by `pct` percent, rounded down. */
export const marked = (damage: number, pct: number): number => (pct > 0 ? Math.floor((damage * (100 + pct)) / 100) : damage);

/** Strongest aura effects reaching each entity id (only ids that receive any). */
export interface AuraEffect {
  cooldownPct: number;
  heal?: { hp: number; every: number; by: number };
}

/** Whether heal aura `a` is stronger than `b`: more health per tick, then more per pulse, then the lower source id. */
const strongerHeal = (a: { hp: number; every: number; by: number }, b: { hp: number; every: number; by: number }): boolean =>
  a.hp * b.every - b.hp * a.every > 0 || (a.hp * b.every === b.hp * a.every && (a.hp > b.hp || (a.hp === b.hp && a.by < b.by)));

/**
 * The strongest aura effects on every entity, judged on the entities as they stand (`working`
 * tells which sources work). A source never helps itself; only entities of its own side.
 */
export function auraEffects(entities: readonly Entity[], archOf: (e: Entity) => Archetype, working: (e: Entity) => boolean): Map<number, AuraEffect> {
  const out = new Map<number, AuraEffect>();
  for (const source of entities) {
    const aura = archOf(source).aura;
    if (!aura || !working(source)) continue;
    const r2 = aura.radius * aura.radius;
    for (const e of entities) {
      if (e === source || e.side !== source.side || (e.x - source.x) ** 2 + (e.y - source.y) ** 2 > r2) continue;
      const current = out.get(e.id) ?? { cooldownPct: 0 };
      current.cooldownPct = Math.max(current.cooldownPct, aura.cooldownPct ?? 0);
      if (aura.heal) {
        const heal = { hp: aura.heal.hp, every: aura.heal.every, by: source.id };
        if (!current.heal || strongerHeal(heal, current.heal)) current.heal = heal;
      }
      out.set(e.id, current);
    }
  }
  return out;
}

/**
 * Counts a weapon cooldown down by one tick, plus the extra steps a cooldown aura of `pct` percent
 * earns: each tick adds 100 + `pct` progress to the accumulator `haste`, every full 100 is one step
 * down. Progress beyond what the cooldown needed is carried into the next cycle (the weapon fires
 * at once when ready, so a 4-tick cooldown at 25 % fires every 3.2 ticks on average), capped at
 * `pct` + 99; it is dropped while the weapon is ready and outside every aura (no stored bursts).
 */
export function coolDown(e: Entity, pct: number): void {
  if (e.cooldown <= 0 || pct <= 0) {
    if (e.cooldown > 0) e.cooldown -= 1;
    delete e.haste;
    return;
  }
  const total = (e.haste ?? 0) + 100 + pct;
  const steps = Math.min(e.cooldown, Math.floor(total / 100));
  e.cooldown -= steps;
  e.haste = Math.min(total - steps * 100, pct + 99);
}

/** Largest value of the accumulator `haste` (cooldownPct at most 1000). */
export const MAX_HASTE = 1099;

const isAura = (v: unknown): v is AuraSpec =>
  isRecord(v) &&
  isInt(v.radius, 0, 128) &&
  (v.cooldownPct === undefined || isInt(v.cooldownPct, 1, 1000)) &&
  (v.heal === undefined || (isRecord(v.heal) && isInt(v.heal.hp, 1, 1_000_000) && isInt(v.heal.every, 1, 10_000))) &&
  (v.cooldownPct !== undefined || v.heal !== undefined);

const isShield = (v: unknown): v is ShieldSpec => isRecord(v) && isInt(v.hp, 1, 1_000_000) && isInt(v.regenDelay, 1, 10_000);

/**
 * Whether an archetype's extension fields (E1–E3) are well formed; absent fields are fine. Never
 * throws. `pierce` only on beams; a `marked` effect needs an integer `amount` (1–1000), other
 * effects carry none.
 */
export function validExtensions(a: Archetype): boolean {
  const w = a.weapon as unknown;
  if (isRecord(w)) {
    if (w.pierce !== undefined && (typeof w.pierce !== 'boolean' || (w.pierce && w.delivery !== 'beam'))) return false;
    const effect = w.effect;
    if (isRecord(effect) && (effect.kind === 'marked' ? !isInt(effect.amount, 1, 1000) : effect.amount !== undefined)) return false;
  }
  return (a.aura === undefined || isAura(a.aura)) && (a.shield === undefined || isShield(a.shield));
}

/** Archetypes of a ruleset whose extension fields are malformed (empty for every valid ruleset). */
export const invalidExtensions = (ruleset: Ruleset): string[] => Object.values(ruleset.archetypes).filter((a) => !validExtensions(a)).map((a) => a.id);
