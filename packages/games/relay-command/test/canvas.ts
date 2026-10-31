import { afterEach, beforeEach } from 'vitest';

/** A 2D context that records the calls made on it (enough of the API for icons and terrain). */
export function recorder(): { g: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];
  const gradient = { addColorStop: (o: number, c: string) => calls.push(`stop ${o} ${c}`) };
  const target: Record<string, unknown> = { canvas: { width: 44, height: 44 } };
  const g = new Proxy(target, {
    get(t, prop: string) {
      if (prop in t) return t[prop];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
      return (...args: unknown[]) => {
        calls.push(`${prop}(${args.map((a) => (typeof a === 'number' ? Math.round(a * 100) / 100 : typeof a === 'object' ? 'obj' : String(a))).join(',')})`);
      };
    },
    set(t, prop: string, value: unknown) {
      t[prop] = value;
      calls.push(`${prop}=${typeof value === 'object' ? 'obj' : String(value)}`);
      return true;
    }
  }) as unknown as CanvasRenderingContext2D;
  return { g, calls };
}

/** Path2D is missing in Node: a stand-in that keeps its SVG path string. */
class FakePath {
  constructor(readonly d = '') {}
  addPath(): void {}
  rect(): void {}
}
/** Installs the stand-in for each test of the calling file (and restores what was there). */
export function withPath2D(): void {
  const real = (globalThis as { Path2D?: unknown }).Path2D;
  beforeEach(() => {
    (globalThis as { Path2D?: unknown }).Path2D = FakePath;
  });
  afterEach(() => {
    (globalThis as { Path2D?: unknown }).Path2D = real;
  });
}
