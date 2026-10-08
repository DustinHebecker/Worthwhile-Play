import { createRngFromState, type Rng } from '@wp/game-core';
import {
  cloneState,
  isActive,
  mapOf,
  MAX_LEVEL,
  maxPaths,
  refusal,
  stepMut,
  toggleMut,
  UNIT_POWER,
  type Difficulty,
  type GameMap,
  type NcState,
  type StepEvents
} from './rules';

/**
 * Opponent heuristics. Every opponent decides on its own schedule (staggered by faction),
 * reads only the public state and draws tie-breaks from the persisted PRNG, so the whole match
 * is reproducible from seed + player commands. All opponents treat every other faction
 * (player and other opponents alike) as hostile.
 */

export interface AiProfile {
  /** Ticks between two decisions of one opponent. */
  period: number;
  /** Most path changes per decision. */
  actions: number;
  /** Chance to skip a planned change (makes easier opponents slower to react). */
  hesitation: number;
  /** Hostile nodes above this level are attacked only when nothing better is in reach. */
  attackLevel: number;
  /** Answers a hostile path into one of its nodes with a counter path. */
  counter: boolean;
  /** Sends reinforcements to nodes under attack. */
  defend: boolean;
}

export const PROFILES: Record<Difficulty, AiProfile> = {
  easy: { period: 40, actions: 1, hesitation: 0.4, attackLevel: 5, counter: false, defend: false },
  medium: { period: 25, actions: 2, hesitation: 0.15, attackLevel: 10, counter: true, defend: true },
  hard: { period: 15, actions: 3, hesitation: 0, attackLevel: 18, counter: true, defend: true }
};

export interface Command {
  from: number;
  to: number;
}

export const isDecisionTick = (tick: number, faction: number, profile: AiProfile): boolean =>
  faction > 0 && tick % profile.period === (faction * 7) % profile.period;

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

const TYPE_BONUS = { standard: 0, shipyard: 6, station: 3 } as const;

/**
 * Plans up to `profile.actions` legal path changes for `faction`. Does not modify `s`;
 * the commands are valid when applied in order to `s`.
 */
export function decide(s: NcState, map: GameMap, faction: number, profile: AiProfile, rng: Rng): Command[] {
  const work: NcState = { ...s, out: s.out.map((o) => [...o]) };
  const commands: Command[] = [];
  const own = s.owner.flatMap((o, v) => (o === faction ? [v] : []));
  if (own.length === 0 || s.result !== 'playing') return commands;
  const full = () => commands.length >= profile.actions;
  // Platforms only relay (at full level), so they are worth a path only then.
  const free = (v: number) =>
    (map.nodes[v]!.type !== 'station' || work.level[v] === MAX_LEVEL) && work.out[v]!.length < maxPaths(work.level[v]!);
  const tryCommand = (from: number, to: number, activate: boolean): boolean => {
    if (full() || isActive(work, from, to) === activate) return false;
    if (activate && refusal(work, map, faction, from, to)) return false;
    if (rng.next() < profile.hesitation) return false;
    toggleMut(work, map, faction, from, to);
    commands.push({ from, to });
    return true;
  };

  // 1. Stop feeding own nodes that are full and pass nothing on (those units would be absorbed).
  for (const v of own) {
    for (const t of [...work.out[v]!]) {
      if (work.owner[t] === faction && work.level[t] === MAX_LEVEL && work.out[t]!.length === 0) tryCommand(v, t, false);
    }
  }

  // 2. Reinforce nodes that are about to fall.
  if (profile.defend) {
    const threat = incomingThreat(s, faction);
    const endangered = own.filter((v) => threat[v]! >= s.level[v]!).sort((x, y) => threat[y]! - s.level[y]! - (threat[x]! - s.level[x]!) || x - y);
    for (const v of endangered) {
      const helpers = map.adjacent[v]!.filter((w) => work.owner[w] === faction && free(w));
      if (helpers.length > 0) tryCommand(rng.pick(helpers), v, true);
    }
  }

  // 3. Answer a hostile path head-on, so its units are met on the lane.
  if (profile.counter) {
    for (const v of own) {
      if (!free(v)) continue;
      const attackers = map.adjacent[v]!.filter((w) => work.owner[w] !== faction && work.owner[w]! >= 0 && work.out[w]!.includes(v));
      if (attackers.length > 0) tryCommand(v, attackers.reduce((a, b) => (work.level[b]! < work.level[a]! ? b : a)), true);
    }
  }

  // 4. Expand to weak neutrals and attack weak hostile nodes; otherwise supply the frontier.
  const frontier = frontierDistance(work, map, faction);
  const order = rng.shuffle(own);
  for (const v of order) {
    if (full()) break;
    if (!free(v)) continue;
    let best = -1;
    let bestScore = -Infinity;
    for (const w of map.adjacent[v]!) {
      const o = work.owner[w]!;
      if (o === faction || isActive(work, v, w)) continue;
      const length = map.lanes[map.laneOf[v]![w]!]![2];
      // Concentrate: prefer targets other own nodes already send to.
      const focus = map.adjacent[w]!.some((x) => x !== v && work.owner[x] === faction && work.out[x]!.includes(w)) ? 15 : 0;
      const score = 100 - 6 * work.level[w]! - Math.floor(length / 20) + TYPE_BONUS[map.nodes[w]!.type] - (o >= 0 ? (work.level[w]! > profile.attackLevel ? 60 : 8) : 0) + focus + rng.int(0, 3);
      if (score > bestScore) [best, bestScore] = [w, score];
    }
    if (best >= 0) {
      tryCommand(v, best, true);
      continue;
    }
    if (work.out[v]!.length > 0) continue;
    const towards = map.adjacent[v]!.filter(
      (w) => work.owner[w] === faction && frontier[w]! < frontier[v]! && !(work.level[w] === MAX_LEVEL && work.out[w]!.length === 0)
    );
    if (towards.length > 0) tryCommand(v, rng.pick(towards), true);
  }
  return commands;
}

/** Hook used by tests to observe every command the opponents issue. */
export type CommandObserver = (faction: number, command: Command, outcome: string) => void;

/** Controller for `stepMut`: lets every due opponent decide and apply its commands. */
export function opponents(observer?: CommandObserver) {
  return (s: NcState, map: GameMap): void => {
    const profile = PROFILES[s.difficulty];
    let rng: Rng | null = null;
    for (let f = 1; f < map.factions; f++) {
      if (!isDecisionTick(s.tick, f, profile) || !s.owner.includes(f)) continue;
      rng ??= createRngFromState(s.rng);
      for (const command of decide(s, map, f, profile, rng)) {
        const { outcome } = toggleMut(s, map, f, command.from, command.to);
        observer?.(f, command, outcome);
      }
    }
    if (rng) s.rng = rng.state();
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
