/**
 * Peeling (design v3 § 3, § 12.9): the timeline of one launch and the queue of launches, as pure, DOM-free code. The
 * game state is committed before anything here runs; this module only decides when the view draws a committed hit as
 * peeled. Time comes in through `advance(dt)` (the view feeds it from requestAnimationFrame; tests from a fake clock),
 * so nothing here needs a timer, and `finishAll()` ends everything at once.
 */

/** A hit of a launch: the cell and the track station that reached it (as the engine reports them, in order). */
export interface PeelHit {
  cell: number;
  station: number;
}

/**
 * Quick (design v3 § 3.3, the first "Slow" of v3): the token walks the track and peels pixel by pixel. Timing in ms.
 */
export const TIMING = {
  /** Walking time per station. */
  station: 3,
  /** At most this long per walk between two hits (long empty stretches and empty laps are walked quickly). */
  segment: 250,
  /** Pause at each hit (Slow: the shot). */
  hit: 40,
  /** The peel effect of a cell (overlaps the walk on). */
  peel: 150,
  /** A launch without hits walks one lap in at most this long. */
  park: 700,
  /** One launch takes at most this long. */
  launch: 3500,
  /** Everything queued finishes within this long: the running token speeds up. */
  backlog: 6000,
  /** 1: hits the shooter makes at one station in a row (lap after lap) go in one shot (Slow); 0: one by one. */
  group: 0,
  /** 1: a launch that is too long first walks faster (down to a quarter of the walking time), then shoots faster. */
  squeeze: 0
} as const;

/**
 * Slow (owner feedback 2026-10-30, design v3 § 12.9): the shooter walks station by station; where it hits, it stops
 * and fires a straight shot along that row or column, and that station's pixels go together. *(calibrated)*
 */
export const SLOW_TIMING: Timing = { station: 35, segment: 600, hit: 300, peel: 250, park: 1200, launch: 7000, backlog: 10000, group: 1, squeeze: 1 };

export type Timing = { readonly [K in keyof typeof TIMING]: number };

/** A walk of the token along the track, in track distance (stations; 0 is the first station, −0.5 the start corner). */
export interface Segment {
  from: number;
  to: number;
  t0: number;
  t1: number;
}

export interface Timeline {
  segments: Segment[];
  /** Per hit (in hit order): when the token reaches it and the cell starts to peel (equal within one shot). */
  hitAt: number[];
  /** Total duration of the launch. */
  total: number;
  /** The pause at each shot (after scaling). */
  pause: number;
}

/**
 * The shots of a launch: runs of consecutive hits at the same station (with `group`), else one hit each. Every hit is
 * in exactly one shot, in hit order (the rules' order).
 */
export function shotsOf(hits: readonly PeelHit[], group: boolean): PeelHit[][] {
  const shots: PeelHit[][] = [];
  for (const hit of hits) {
    const last = shots[shots.length - 1];
    if (group && last && (last[0] as PeelHit).station === hit.station) last.push(hit);
    else shots.push([hit]);
  }
  return shots;
}

/**
 * The timeline of one launch: from the start corner to the first shot, between consecutive shots (forward along the
 * track, wrapping into the next lap) and, for a shooter with shots left, on to the corner again. A used-up token stops
 * at its last shot. Every duration is ≥ 0, the shot times strictly increase (hits of one shot share theirs), and the
 * total is at most `timing.launch`: with `squeeze` the walks are shortened first, then everything is scaled.
 */
export function peelTimeline(hits: readonly PeelHit[], stations: number, usedUp: boolean, timing: Timing = TIMING): Timeline {
  const s = Math.max(1, stations);
  if (hits.length === 0) {
    const d = Math.min(timing.park, timing.station * s);
    return { segments: [{ from: -0.5, to: s - 0.5, t0: 0, t1: d }], hitAt: [], total: d, pause: 0 };
  }
  const shots = shotsOf(hits, timing.group === 1);
  const build = (walkScale: number): Omit<Timeline, 'pause'> & { walking: number } => {
    const segments: Segment[] = [];
    const hitAt: number[] = [];
    let t = 0;
    let walking = 0;
    const walk = (from: number, to: number) => {
      const d = Math.min(timing.segment, timing.station * Math.max(0, to - from)) * walkScale;
      segments.push({ from, to, t0: t, t1: t + d });
      t += d;
      walking += d;
    };
    let at = -0.5;
    shots.forEach((shot) => {
      const station = (((shot[0] as PeelHit).station % s) + s) % s;
      // Forward only: the first place of this station at or after the token; a second shot at the same station is a
      // lap later (a station reaches one cell per pass).
      let next = station + s * Math.ceil((at - station) / s);
      if (next <= at) next += s;
      walk(at, next);
      for (let k = 0; k < shot.length; k++) hitAt.push(t);
      t += timing.hit;
      at = next;
    });
    // A shooter with shots left walks on to the start corner (and into its waiting place).
    if (!usedUp) walk(at, (Math.floor((at + 0.5) / s) + 1) * s - 0.5);
    return { segments, hitAt, total: Math.max(t, (hitAt[hitAt.length - 1] as number) + timing.peel), walking };
  };
  let line = build(1);
  if (line.total > timing.launch && timing.squeeze === 1 && line.walking > 0) {
    const scale = Math.max(0.25, Math.min(1, (timing.launch - (line.total - line.walking)) / line.walking));
    line = build(scale);
  }
  const { segments, hitAt } = line;
  let total = line.total;
  let pause = timing.hit;
  if (total > timing.launch) {
    const f = timing.launch / total;
    pause *= f;
    for (const seg of segments) {
      seg.t0 *= f;
      seg.t1 *= f;
    }
    for (let k = 0; k < hitAt.length; k++) hitAt[k] = (hitAt[k] as number) * f;
    total = timing.launch;
  }
  return { segments, hitAt, total, pause };
}

/** Where the token is at time `t` of a timeline (track distance), or the end of the last segment. */
export function tokenAt(timeline: Timeline, t: number): number {
  for (const seg of timeline.segments) {
    if (t < seg.t0) return seg.from;
    if (t <= seg.t1) return seg.t1 > seg.t0 ? seg.from + ((seg.to - seg.from) * (t - seg.t0)) / (seg.t1 - seg.t0) : seg.to;
  }
  const last = timeline.segments[timeline.segments.length - 1];
  return last ? last.to : -0.5;
}

/** One launch to draw: its hits (committed already), the token's colour key and its shots at launch. */
export interface PeelLaunch {
  hits: readonly PeelHit[];
  colour: string;
  shots: number;
  usedUp: boolean;
}

interface Running {
  launch: PeelLaunch;
  timeline: Timeline;
  time: number;
  /** Index of the next hit to peel. */
  next: number;
}

/**
 * The launches waiting to be drawn, strictly one at a time in launch order (a launch's hits were computed after the
 * previous launch, so its nooks may only open when the one ahead is done). `advance` returns the cells that start to
 * peel in that time; `finishAll` returns every cell still to peel and empties the queue.
 */
export class PeelQueue {
  private running: Running | null = null;
  private readonly waiting: PeelLaunch[] = [];
  /** Launch time per wall time; set when a launch is queued so that everything queued ends within `backlog`. */
  private speed = 1;

  private readonly stations: number;
  private readonly timing: Timing;

  constructor(stations: number, timing: Timing = TIMING) {
    this.stations = stations;
    this.timing = timing;
  }

  /** Queues a launch (it starts at once when nothing runs). */
  enqueue(launch: PeelLaunch): void {
    this.waiting.push(launch);
    if (!this.running) this.start();
    this.speed = Math.max(1, this.remaining() / this.timing.backlog);
  }

  /** Advances by `dt` ms of wall time; returns the cells that start peeling, in order. */
  advance(dt: number): number[] {
    const popped: number[] = [];
    let left = Math.max(0, dt) * this.speed;
    while (this.running && left >= 0) {
      const r = this.running;
      const step = Math.min(left, r.timeline.total - r.time);
      r.time += step;
      left -= step;
      while (r.next < r.launch.hits.length && (r.timeline.hitAt[r.next] as number) <= r.time) popped.push((r.launch.hits[r.next++] as PeelHit).cell);
      if (r.time < r.timeline.total) break;
      this.start();
      if (left <= 0) break;
    }
    if (!this.running) this.speed = 1;
    return popped;
  }

  /** Ends everything at once: the cells still to peel, in order. */
  finishAll(): number[] {
    const popped: number[] = [];
    if (this.running) for (let k = this.running.next; k < this.running.launch.hits.length; k++) popped.push((this.running.launch.hits[k] as PeelHit).cell);
    for (const l of this.waiting) for (const h of l.hits) popped.push(h.cell);
    this.running = null;
    this.waiting.length = 0;
    this.speed = 1;
    return popped;
  }

  private start(): void {
    const launch = this.waiting.shift();
    this.running = launch ? { launch, timeline: peelTimeline(launch.hits, this.stations, launch.usedUp, this.timing), time: 0, next: 0 } : null;
  }

  /** Whether anything is running or queued. */
  get busy(): boolean {
    return this.running !== null;
  }

  /** Launches running or queued. */
  get launches(): number {
    return (this.running ? 1 : 0) + this.waiting.length;
  }

  /** Cells still to peel. */
  get pending(): number {
    let n = this.running ? this.running.launch.hits.length - this.running.next : 0;
    for (const l of this.waiting) n += l.hits.length;
    return n;
  }

  /** Launch time (speed 1) still to run. */
  remaining(): number {
    let ms = this.running ? this.running.timeline.total - this.running.time : 0;
    for (const l of this.waiting) ms += peelTimeline(l.hits, this.stations, l.usedUp, this.timing).total;
    return ms;
  }

  /** Wall time still to run at the current speed. */
  remainingWall(): number {
    return this.remaining() / this.speed;
  }

  /**
   * The running token for drawing, or null. During the pause at a shot: the shot's cells (`targets`, in hit order),
   * its station and how far the pause is (`beam`, 0 … 1; −1 otherwise).
   */
  token(): { colour: string; shots: number; distance: number; target: number | null; targets: number[]; station: number | null; beam: number; fade: number } | null {
    const r = this.running;
    if (!r) return null;
    const { timeline, time, launch } = r;
    const k = r.next - 1;
    const targets: number[] = [];
    let station: number | null = null;
    let beam = -1;
    if (k >= 0) {
      const at = timeline.hitAt[k] as number;
      if (time - at < timeline.pause) {
        for (let j = k; j >= 0 && timeline.hitAt[j] === at; j--) targets.unshift((launch.hits[j] as PeelHit).cell);
        station = (launch.hits[k] as PeelHit).station;
        beam = Math.max(0, (time - at) / Math.max(1, timeline.pause));
      }
    }
    const lastHit = timeline.hitAt.length ? (timeline.hitAt[timeline.hitAt.length - 1] as number) + timeline.pause : 0;
    const end = Math.max(timeline.segments[timeline.segments.length - 1]?.t1 ?? 0, launch.usedUp ? lastHit : 0);
    const fade = launch.usedUp && time > end ? Math.min(1, (time - end) / Math.max(1, timeline.total - end)) : 0;
    return { colour: launch.colour, shots: launch.shots - r.next, distance: tokenAt(timeline, time), target: targets[targets.length - 1] ?? null, targets, station, beam, fade };
  }

  /** Cells of the running launch in their peel effect: progress 0 … 1. */
  effects(): { cell: number; progress: number }[] {
    const r = this.running;
    if (!r) return [];
    const out: { cell: number; progress: number }[] = [];
    const span = Math.min(this.timing.peel, r.timeline.total);
    for (let k = 0; k < r.next; k++) {
      const p = (r.time - (r.timeline.hitAt[k] as number)) / Math.max(1, span);
      if (p < 1) out.push({ cell: (r.launch.hits[k] as PeelHit).cell, progress: Math.max(0, p) });
    }
    return out;
  }

  /** Colour keys of the launches waiting behind the running one, in order. */
  queued(): string[] {
    return this.waiting.map((l) => l.colour);
  }
}
