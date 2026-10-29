/**
 * Slow peeling (design v3 § 3): the timeline of one launch and the queue of launches, as pure, DOM-free code. The
 * game state is committed before anything here runs; this module only decides when the view draws a committed hit as
 * peeled. Time comes in through `advance(dt)` (the view feeds it from requestAnimationFrame; tests from a fake clock),
 * so nothing here needs a timer, and `finishAll()` ends everything at once.
 */

/** A hit of a launch: the cell and the track station that reached it (as the engine reports them, in order). */
export interface PeelHit {
  cell: number;
  station: number;
}

/** Timing in ms *(calibrate, design v3 § 3.3)*. */
export const TIMING = {
  /** Walking time per station. */
  station: 3,
  /** At most this long per walk between two hits (long empty stretches and empty laps are walked quickly). */
  segment: 250,
  /** Pause at each hit. */
  hit: 40,
  /** The peel effect of a cell (overlaps the walk on). */
  peel: 150,
  /** A launch without hits walks one lap in at most this long. */
  park: 700,
  /** One launch takes at most this long (the whole timeline is scaled down to fit). */
  launch: 3500,
  /** Everything queued finishes within this long: the running token speeds up. */
  backlog: 6000
} as const;

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
  /** Per hit (in hit order): when the token reaches it and the cell starts to peel. */
  hitAt: number[];
  /** Total duration of the launch. */
  total: number;
}

/**
 * The timeline of one launch: from the start corner to the first hit, between consecutive hits (forward along the
 * track, wrapping into the next lap) and, for a shooter with shots left, on to the corner again. A used-up token stops
 * at its last hit. Every duration is ≥ 0, the hit times strictly increase, and the total is at most `timing.launch`.
 */
export function peelTimeline(hits: readonly PeelHit[], stations: number, usedUp: boolean, timing: Timing = TIMING): Timeline {
  const s = Math.max(1, stations);
  const segments: Segment[] = [];
  const hitAt: number[] = [];
  let t = 0;
  if (hits.length === 0) {
    const d = Math.min(timing.park, timing.station * s);
    return { segments: [{ from: -0.5, to: s - 0.5, t0: 0, t1: d }], hitAt, total: d };
  }
  const walk = (from: number, to: number) => {
    const d = Math.min(timing.segment, timing.station * Math.max(0, to - from));
    segments.push({ from, to, t0: t, t1: t + d });
    t += d;
  };
  let at = -0.5;
  hits.forEach((hit, k) => {
    const station = ((hit.station % s) + s) % s;
    // Forward only: the first place of this station at or after the token; a second hit at the same station is a lap
    // later (a station reaches one cell per pass).
    let next = station + s * Math.ceil((at - station) / s);
    if (next <= at) next += s;
    walk(at, next);
    hitAt.push(t);
    t += timing.hit;
    at = next;
  });
  // A shooter with shots left walks on to the start corner (and into its waiting place).
  if (!usedUp) walk(at, (Math.floor((at + 0.5) / s) + 1) * s - 0.5);
  let total = Math.max(t, (hitAt[hitAt.length - 1] as number) + timing.peel);
  if (total > timing.launch) {
    const f = timing.launch / total;
    for (const seg of segments) {
      seg.t0 *= f;
      seg.t1 *= f;
    }
    for (let k = 0; k < hitAt.length; k++) hitAt[k] = (hitAt[k] as number) * f;
    total = timing.launch;
  }
  return { segments, hitAt, total };
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

  constructor(
    private readonly stations: number,
    private readonly timing: Timing = TIMING
  ) {}

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

  /** The running token for drawing, or null. */
  token(): { colour: string; shots: number; distance: number; target: number | null; fade: number } | null {
    const r = this.running;
    if (!r) return null;
    const { timeline, time, launch } = r;
    // The line to the cell being peeled during the hit pause.
    const k = r.next - 1;
    const target = k >= 0 && time - (timeline.hitAt[k] as number) < this.timing.hit ? (launch.hits[k] as PeelHit).cell : null;
    const end = timeline.segments[timeline.segments.length - 1]?.t1 ?? 0;
    const fade = launch.usedUp && time > end ? Math.min(1, (time - end) / Math.max(1, timeline.total - end)) : 0;
    return { colour: launch.colour, shots: launch.shots - r.next, distance: tokenAt(timeline, time), target, fade };
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
