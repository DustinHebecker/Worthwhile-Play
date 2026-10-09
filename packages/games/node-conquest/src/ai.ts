import { createRngFromState, type Rng } from '@wp/game-core';
import {
  cloneState,
  INTRO_MAP,
  isActive,
  mapOf,
  MAX_LEVEL,
  maxPaths,
  PRODUCTION_INTERVAL,
  refusal,
  stepMut,
  toggleMut,
  UNIT_POWER,
  type Difficulty,
  type GameMap,
  type Controller,
  type NcState,
  type StepEvents
} from './rules';

/**
 * Opponents. Every level plays by exactly the same rules as the player and reads only the public
 * state (owners, levels, paths, units in flight). Decisions happen at fixed ticks (staggered by
 * faction), tie-breaks come from the persisted PRNG, so a match is reproducible from seed + player
 * commands. All opponents treat every other faction (player and other opponents alike) as hostile.
 *
 * - beginner: slow; only its frontier nodes act; often simply takes the nearest target; ignores
 *   threats; does not see that bastions are armoured.
 * - advanced: weighs targets by value and cost (level, type, armour, lane length), defends when
 *   incoming hostile strength outweighs a node's level (or would push it below 10/20), grows
 *   nodes towards 10/20 and supplies the front from the interior.
 * - strong: advanced, plus a short forward simulation (lookahead) of its best candidate path
 *   changes, assuming everyone keeps their current paths. Possible because the simulation is
 *   deterministic. Joint attacks, head-on fights and platform cover show up in the outcome.
 * - master: longer lookahead, evaluates pairs of changes (plans two steps at once) and in
 *   free-for-all prefers attacking whichever rival is weakest.
 *
 * Cost is bounded by a fixed simulation budget (units + nodes summed over simulated ticks), never
 * by wall-clock time, so results do not depend on the device.
 */

export interface Lookahead {
  /** Candidate changes simulated per decision (best by heuristic score first). */
  candidates: number;
  /** Simulated ticks per candidate. */
  horizon: number;
  /** Master: combinations of the best change with this many runners-up. */
  pairs: number;
  /** Upper bound on simulated work per decision: Σ (units + nodes) over all simulated ticks. */
  budget: number;
  /**
   * Master: inside the simulation every faction (itself included) keeps playing with the
   * advanced heuristics, instead of freezing all paths — plans that hold up against replies.
   */
  policy: boolean;
}

export interface AiProfile {
  /** Ticks between two decisions of one opponent. */
  period: number;
  /** Most path changes per decision. */
  actions: number;
  /** Chance to skip a planned change (slower reactions). */
  hesitation: number;
  /** Hostile nodes above this (effective) level are attacked only when nothing better is in reach. */
  attackLevel: number;
  /** Answers a hostile path into one of its nodes with a counter path. */
  counter: boolean;
  /** Sends reinforcements to nodes under attack. */
  defend: boolean;
  /** Only nodes that border non-own nodes act (no supply lines from the interior). */
  frontierOnly: boolean;
  /** Chance to simply take the nearest non-own neighbour, however poor a choice. */
  impulsive: number;
  /** Knows the path thresholds 10/20 and the bastion armour. */
  aware: boolean;
  lookahead: Lookahead | null;
  /** Free-for-all: prefers targets of the weakest rival. */
  weakest: boolean;
  /** Introduction opponent: only reinforces its own nodes when attacked. */
  passive: boolean;
}

const BASE: AiProfile = {
  period: 25,
  actions: 2,
  hesitation: 0,
  attackLevel: 10,
  counter: false,
  defend: false,
  frontierOnly: false,
  impulsive: 0,
  aware: false,
  lookahead: null,
  weakest: false,
  passive: false
};

export const PROFILES: Record<Difficulty, AiProfile> = {
  beginner: { ...BASE, period: 40, actions: 1, hesitation: 0.25, attackLevel: 6, frontierOnly: true, impulsive: 0.45 },
  advanced: { ...BASE, period: 35, actions: 2, hesitation: 0.2, attackLevel: 12, counter: true, defend: true, aware: true },
  strong: {
    ...BASE,
    period: 25,
    actions: 2,
    attackLevel: 14,
    counter: true,
    defend: true,
    aware: true,
    lookahead: { candidates: 3, horizon: 120, pairs: 0, budget: 90_000, policy: false }
  },
  master: {
    ...BASE,
    period: 10,
    actions: 3,
    attackLevel: 16,
    counter: true,
    defend: true,
    aware: true,
    weakest: true,
    lookahead: { candidates: 6, horizon: 120, pairs: 2, budget: 160_000, policy: false }
  }
};

/** The introduction map's opponent: never attacks, only reinforces a node under attack. */
export const PASSIVE: AiProfile = { ...BASE, period: 30, actions: 1, defend: true, passive: true };

export const profileFor = (s: Pick<NcState, 'difficulty' | 'map'>): AiProfile => (s.map === INTRO_MAP ? PASSIVE : PROFILES[s.difficulty]);

export interface Command {
  from: number;
  to: number;
}

export const isDecisionTick = (tick: number, faction: number, profile: AiProfile): boolean => tick % profile.period === (faction * 7) % profile.period;

/** Hostile strength already travelling towards each node of `faction`. */
export function incomingThreat(s: NcState, faction: number): number[] {
  const threat = s.owner.map(() => 0);
  for (const u of s.units) if (u.f !== faction && s.owner[u.b] === faction) threat[u.b]! += UNIT_POWER[u.k];
  return threat;
}

/** Graph distance of every node to the nearest node not owned by `faction` (0 for those). */
export function frontierDistance(s: NcState, map: GameMap, faction: number): number[] {
  const dist = s.owner.map((o): number => (o === faction ? -1 : 0));
  const queue = dist.flatMap((d, v) => (d === 0 ? [v] : []));
  for (let q = 0; q < queue.length; q++) {
    const v = queue[q]!;
    for (const w of map.adjacent[v]!) {
      if (dist[w] === -1) {
        dist[w] = dist[v]! + 1;
        queue.push(w);
      }
    }
  }
  return dist;
}

const TYPE_BONUS = { standard: 0, shipyard: 6, station: 3, bastion: 4 } as const;

/** Level points needed to take node `w` (bastions need twice as many). */
export const effectiveLevel = (map: GameMap, s: NcState, w: number): number =>
  map.nodes[w]!.type === 'bastion' ? 2 * s.level[w]! - s.half[w]! : s.level[w]!;

/** Strength (level points) hostile paths into `v` deliver within `ticks`, plus units already on the way. */
function pressure(s: NcState, map: GameMap, faction: number, v: number, inFlight: number, ticks: number): number {
  let total = inFlight;
  for (const w of map.adjacent[v]!) {
    const o = s.owner[w]!;
    if (o < 0 || o === faction || !s.out[w]!.includes(v)) continue;
    const type = map.nodes[w]!.type;
    if (type === 'station') continue;
    total += Math.floor(ticks / PRODUCTION_INTERVAL[type]) * UNIT_POWER[type === 'shipyard' ? 1 : 0];
  }
  return map.nodes[v]!.type === 'bastion' ? Math.floor(total / 2) : total;
}

/** Node count per faction. */
function counts(s: NcState, factions: number): number[] {
  const c = new Array<number>(factions).fill(0);
  for (const o of s.owner) if (o >= 0) c[o]!++;
  return c;
}

export interface Option {
  cmds: Command[];
  score: number;
  /** Housekeeping, defence and counters may share a source; expansion uses each source once per decision. */
  urgent: boolean;
}

/**
 * Heuristic options for `faction`, best first. Each option is one path change (or a switch: stop
 * one path, start another). Used directly by the heuristic levels and as the candidate list for the
 * lookahead. Does not modify `s`.
 */
export function options(s: NcState, map: GameMap, faction: number, profile: AiProfile, rng: Rng): Option[] {
  const result: Option[] = [];
  const own = s.owner.flatMap((o, v) => (o === faction ? [v] : []));
  if (own.length === 0 || s.result !== 'playing') return result;
  const free = (v: number) => (map.nodes[v]!.type !== 'station' || s.level[v] === MAX_LEVEL) && s.out[v]!.length < maxPaths(s.level[v]!);
  const canSend = (v: number) => map.nodes[v]!.type !== 'station' || s.level[v] === MAX_LEVEL;
  const add = (cmds: Command[], score: number) => result.push({ cmds, score, urgent: score >= 150 });

  // 1. Stop feeding own nodes that are full and pass nothing on (those units would be absorbed).
  for (const v of own) {
    for (const t of s.out[v]!) if (s.owner[t] === faction && s.level[t] === MAX_LEVEL && s.out[t]!.length === 0) add([{ from: v, to: t }], 300);
  }

  // 2. Reinforce nodes that are about to fall (aware: also before they drop below 10 or 20).
  if (profile.defend) {
    const inFlight = incomingThreat(s, faction);
    for (const v of own) {
      const danger = profile.aware ? pressure(s, map, faction, v, inFlight[v]!, 60) : inFlight[v]!;
      if (danger === 0) continue;
      const level = s.level[v]!;
      const floor = level >= 20 ? 20 : level >= 10 ? 10 : 1;
      const losesPaths = profile.aware && floor > 1 && s.out[v]!.length > maxPaths(floor - 1) && level - danger < floor;
      if (danger < level && !losesPaths) continue;
      for (const w of map.adjacent[v]!) {
        if (s.owner[w] === faction && free(w) && !isActive(s, w, v) && !refusal(s, map, faction, w, v)) add([{ from: w, to: v }], 200 + Math.max(0, danger - level));
      }
    }
  }
  if (profile.passive) return sortOptions(result);

  // 3. Answer a hostile path head-on, so its units are met on the lane.
  if (profile.counter) {
    for (const v of own) {
      if (!free(v)) continue;
      let weakest = -1;
      for (const w of map.adjacent[v]!) {
        if (s.owner[w] === faction || s.owner[w]! < 0 || !s.out[w]!.includes(v) || isActive(s, v, w)) continue;
        if (weakest < 0 || s.level[w]! < s.level[weakest]!) weakest = w;
      }
      if (weakest >= 0) add([{ from: v, to: weakest }], 150);
    }
  }

  // 4. Expand to good neutrals, attack weak hostile nodes, grow nodes towards 10/20, supply the front.
  const frontier = frontierDistance(s, map, faction);
  const nodeCounts = counts(s, map.factions);
  let weakestRival = -1;
  for (let g = 0; g < map.factions; g++) {
    if (g !== faction && nodeCounts[g]! > 0 && (weakestRival < 0 || nodeCounts[g]! < nodeCounts[weakestRival]!)) weakestRival = g;
  }
  for (const v of rng.shuffle(own)) {
    if (!canSend(v)) continue;
    if (profile.frontierOnly && frontier[v] !== 1) continue;
    const saturated = !free(v);
    let impulsiveTarget = -1;
    if (!saturated && profile.impulsive > 0 && rng.next() < profile.impulsive) {
      let shortest = Infinity;
      for (const w of map.adjacent[v]!) {
        const length = map.lanes[map.laneOf[v]![w]!]![2];
        if (s.owner[w] !== faction && !isActive(s, v, w) && length < shortest) [impulsiveTarget, shortest] = [w, length];
      }
    }
    for (const w of map.adjacent[v]!) {
      const o = s.owner[w]!;
      if (isActive(s, v, w)) continue;
      const length = map.lanes[map.laneOf[v]![w]!]![2];
      let score: number;
      if (o === faction) {
        // Growth: lift a front node to the next path threshold.
        const lw = s.level[w]!;
        const nearThreshold = (lw >= 6 && lw < 10) || (lw >= 16 && lw < 20);
        if (!profile.aware || !nearThreshold || frontier[w] !== 1 || frontier[v] === 1 || refusal(s, map, faction, v, w)) continue;
        score = 70 - (lw % 10) - Math.floor(length / 30);
      } else {
        const level = profile.aware ? effectiveLevel(map, s, w) : s.level[w]!;
        const focus = map.adjacent[w]!.some((x) => x !== v && s.owner[x] === faction && s.out[x]!.includes(w)) ? 15 : 0;
        const hostile = o >= 0 ? (level > profile.attackLevel ? 60 : 8) : 0;
        const rivalBonus = profile.weakest && o >= 0 && o === weakestRival && map.factions > 2 ? 12 : 0;
        score = 100 - 6 * level - Math.floor(length / 20) + TYPE_BONUS[map.nodes[w]!.type] - hostile + focus + rivalBonus + rng.int(0, 3);
        if (w === impulsiveTarget) score += 200;
      }
      if (!saturated) {
        if (o === faction || !refusal(s, map, faction, v, w)) add([{ from: v, to: w }], score);
        continue;
      }
      // Saturated source (lookahead levels): switch its least useful path to this target.
      if (!profile.lookahead || o === faction) continue;
      let worst = -1;
      for (const t of s.out[v]!) if (s.owner[t] !== faction && (worst < 0 || s.level[t]! > s.level[worst]!)) worst = t;
      if (worst >= 0 && s.level[worst]! > s.level[w]! + 4) add([{ from: v, to: worst }, { from: v, to: w }], score - 20);
    }
    // Interior nodes without paths supply the front.
    if (!profile.frontierOnly && !saturated && s.out[v]!.length === 0 && frontier[v]! > 1) {
      const towards = map.adjacent[v]!.filter(
        (w) => s.owner[w] === faction && frontier[w]! < frontier[v]! && !(s.level[w] === MAX_LEVEL && s.out[w]!.length === 0) && !refusal(s, map, faction, v, w)
      );
      if (towards.length > 0) add([{ from: v, to: rng.pick(towards) }], 20);
    }
  }
  return sortOptions(result);
}

const sortOptions = (list: Option[]): Option[] => list.map((o, i) => [o, i] as const).sort((a, b) => b[0].score - a[0].score || a[1] - b[1]).map(([o]) => o);

/** Applies the commands of an option to `work` (all or nothing); true when every change applied. */
function applyOption(work: NcState, map: GameMap, faction: number, cmds: readonly Command[]): boolean {
  const backup = work.out.map((o) => [...o]);
  for (const c of cmds) {
    const { outcome } = toggleMut(work, map, faction, c.from, c.to);
    if (outcome !== 'on' && outcome !== 'off') {
      work.out = backup;
      return false;
    }
  }
  return true;
}

/* ---------- Lookahead ---------- */

const NODE_VALUE = 20;
const TYPE_VALUE = { standard: 0, shipyard: 10, station: 4, bastion: 6 } as const;

/** Material of every faction: owned nodes (value, level, path capacity) plus half the strength in flight. */
export function material(s: NcState, map: GameMap): number[] {
  const m = new Array<number>(map.factions).fill(0);
  s.owner.forEach((o, v) => {
    if (o >= 0) m[o]! += NODE_VALUE + TYPE_VALUE[map.nodes[v]!.type] + s.level[v]! + 6 * maxPaths(s.level[v]!);
  });
  for (const u of s.units) m[u.f]! += UNIT_POWER[u.k] / 2;
  return m;
}

/**
 * Weights of the rivals of `faction` in the evaluation (sum 1). Normally equal; with `weakest`
 * in free-for-all the rival with the least material counts double. Fixed per decision.
 */
export function rivalWeights(s: NcState, map: GameMap, faction: number, weakest: boolean): number[] {
  const m = material(s, map);
  const w = m.map((_, g): number => (g === faction ? 0 : 1));
  if (weakest && map.factions > 2) {
    let target = -1;
    for (let g = 0; g < map.factions; g++) if (g !== faction && m[g]! > 0 && (target < 0 || m[g]! < m[target]!)) target = g;
    if (target >= 0) w[target] = 2;
  }
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}

/** Position value for `faction`: own material minus weighted rival material, plus progress on neutrals next to it. */
export function evaluate(s: NcState, map: GameMap, faction: number, weights: readonly number[]): number {
  const m = material(s, map);
  if (m[faction] === 0) return -100_000;
  let value = m[faction]!;
  for (let g = 0; g < map.factions; g++) value -= weights[g]! * m[g]!;
  s.owner.forEach((o, v) => {
    if (o < 0 && map.adjacent[v]!.some((w) => s.owner[w] === faction)) value -= 0.6 * effectiveLevel(map, s, v);
  });
  return value;
}

export interface PlanStats {
  /** Simulated ticks during the last decision. */
  ticks: number;
  /** Simulated work (Σ units + nodes per tick). */
  work: number;
}

/** Last decision's lookahead cost (diagnostics for tests and measurements). */
export const lastPlan: PlanStats = { ticks: 0, work: 0 };

function rollout(start: NcState, map: GameMap, horizon: number, stats: PlanStats, policy: Controller | undefined): NcState {
  const s = cloneState(start);
  for (let i = 0; i < horizon && s.result === 'playing'; i++) {
    stats.work += s.units.length + map.nodes.length;
    stats.ticks++;
    stepMut(s, map, policy);
  }
  return s;
}

const policies = new Map<number, Controller>();
/** All factions playing the advanced heuristics (used inside master's simulations). */
function policyFor(factions: number): Controller {
  let control = policies.get(factions);
  if (!control) {
    control = controllerFor(new Array<AiProfile>(factions).fill({ ...PROFILES.advanced, hesitation: 0 }));
    policies.set(factions, control);
  }
  return control;
}

/**
 * Plans up to `profile.actions` legal path changes for `faction`. Does not modify `s`;
 * the commands are valid when applied in order to `s`.
 */
export function decide(s: NcState, map: GameMap, faction: number, profile: AiProfile, rng: Rng): Command[] {
  lastPlan.ticks = 0;
  lastPlan.work = 0;
  const list = options(s, map, faction, profile, rng);
  if (list.length === 0) return [];
  const work: NcState = { ...s, out: s.out.map((o) => [...o]) };
  const commands: Command[] = [];
  const take = (cmds: readonly Command[]): boolean => {
    if (commands.length + cmds.length > profile.actions) return false;
    if (rng.next() < profile.hesitation) return false;
    if (!applyOption(work, map, faction, cmds)) return false;
    commands.push(...cmds);
    return true;
  };
  const used = new Set<number>();
  const changed = new Set<string>();
  const takeOnce = (option: Option) => {
    const from = option.cmds[option.cmds.length - 1]!.from;
    // A lane changed once in this decision is not toggled back by a later option.
    if (option.cmds.some((c) => changed.has(`${c.from}-${c.to}`))) return;
    // One new path per source and decision for expansion (keeps changes spread over the map).
    if (!option.urgent && used.has(from)) return;
    if (!take(option.cmds)) return;
    used.add(from);
    for (const c of option.cmds) changed.add(`${c.from}-${c.to}`);
  };

  const look = profile.lookahead;
  if (!look) {
    for (const option of list) {
      if (commands.length >= profile.actions) break;
      takeOnce(option);
    }
    return commands;
  }

  // Urgent housekeeping (useless feeding) is applied without simulation.
  for (const option of list) if (option.score >= 300) takeOnce(option);
  const candidates = list.filter((o) => o.score < 300).slice(0, look.candidates);
  if (candidates.length === 0 || commands.length >= profile.actions) return commands;

  const stats: PlanStats = { ticks: 0, work: 0 };
  const policy = look.policy ? policyFor(map.factions) : undefined;
  const weights = rivalWeights(s, map, faction, profile.weakest);
  const baseline = rollout(work, map, look.horizon, stats, policy);
  const baseValue = evaluate(baseline, map, faction, weights);
  const perRollout = stats.work;
  const scored: { option: Option; value: number }[] = [];
  for (const option of candidates) {
    if (stats.work + perRollout > look.budget) break;
    const trial = { ...work, out: work.out.map((o) => [...o]) };
    if (!applyOption(trial, map, faction, option.cmds)) continue;
    scored.push({ option, value: evaluate(rollout(trial, map, look.horizon, stats, policy), map, faction, weights) });
  }
  scored.sort((a, b) => b.value - a.value);
  const best = scored[0];
  let chosen: Option[] = [];
  if (best && best.value > baseValue) {
    chosen = [best.option];
    let bestValue = best.value;
    // Master: try the best change together with the runners-up (two-step plans).
    for (let i = 1; i <= look.pairs && i < scored.length; i++) {
      if (stats.work + perRollout > look.budget) break;
      const trial = { ...work, out: work.out.map((o) => [...o]) };
      if (!applyOption(trial, map, faction, best.option.cmds) || !applyOption(trial, map, faction, scored[i]!.option.cmds)) continue;
      const value = evaluate(rollout(trial, map, look.horizon, stats, policy), map, faction, weights);
      if (value > bestValue) [chosen, bestValue] = [[best.option, scored[i]!.option], value];
    }
    // Further independent improvements, if the budget of actions allows.
    for (const entry of scored.slice(1)) if (entry.value > baseValue && !chosen.includes(entry.option) && chosen.length < profile.actions) chosen.push(entry.option);
  }
  for (const option of chosen) takeOnce(option);
  lastPlan.ticks = stats.ticks;
  lastPlan.work = stats.work;
  return commands;
}

/** Hook used by tests to observe every command the opponents issue. */
export type CommandObserver = (faction: number, command: Command, outcome: string) => void;

/**
 * Controller for `stepMut`: lets every due faction with a profile decide and apply its commands.
 * `profiles[f]` (null for the human player) defaults to the opponents of the match.
 */
export function controllerFor(profiles: readonly (AiProfile | null)[], observer?: CommandObserver) {
  return (s: NcState, map: GameMap): void => {
    let rng: Rng | null = null;
    for (let f = 0; f < map.factions; f++) {
      const profile = profiles[f];
      if (!profile || !isDecisionTick(s.tick, f, profile) || !s.owner.includes(f)) continue;
      rng ??= createRngFromState(s.rng);
      for (const command of decide(s, map, f, profile, rng)) {
        const { outcome } = toggleMut(s, map, f, command.from, command.to);
        observer?.(f, command, outcome);
      }
    }
    if (rng) s.rng = rng.state();
  };
}

/** Controller for the match's opponents (the player, faction 0, is human). */
export function opponents(observer?: CommandObserver) {
  const cache = new Map<string, ReturnType<typeof controllerFor>>();
  return (s: NcState, map: GameMap): void => {
    const profile = profileFor(s);
    const key = `${s.map === INTRO_MAP ? 'intro' : s.difficulty}:${map.factions}`;
    let control = cache.get(key);
    if (!control) {
      control = controllerFor([null, profile, profile, profile].slice(0, map.factions), observer);
      cache.set(key, control);
    }
    control(s, map);
  };
}

/** Pure: advances a full match (with opponents) by up to `ticks` ticks; stops at the end. */
export function simulate(s: NcState, ticks: number, onEvents?: (events: StepEvents) => void, observer?: CommandObserver): NcState {
  const next = cloneState(s);
  const map = mapOf(next);
  const controller = opponents(observer);
  for (let i = 0; i < ticks && next.result === 'playing'; i++) {
    const events = stepMut(next, map, controller);
    onEvents?.(events);
  }
  return next;
}
