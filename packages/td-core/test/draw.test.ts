import { describe, expect, it } from "vitest";
import { PROFILE, TOP } from "@wp/strategy-art";
import {
  archetypeOf,
  createWorld,
  spawn,
  type World,
} from "@wp/strategy-engine";
import {
  drawFrame,
  ENEMY_ICON,
  TOWER_ICON,
  type Frame,
  type Palette,
} from "../src/draw";
import { ENEMY_KINDS, FAMILIES, TD_RULESET } from "../src/ruleset";

/** A canvas context that records the calls (no Path2D in tests: pictures fall back to shapes). */
function recorder(): { g: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];
  const g = new Proxy({} as Record<string, unknown>, {
    get:
      (_t, key: string) =>
      (...args: unknown[]) => {
        calls.push(
          `${key}(${args.map((a) => (typeof a === "number" ? Math.round(a * 10) / 10 : String(a))).join(",")})`,
        );
        return key.startsWith("create")
          ? { addColorStop: () => undefined }
          : undefined;
      },
    set: (_t, key: string, value: unknown) => {
      calls.push(`${key}=${String(value)}`);
      return true;
    },
  });
  return { g: g as unknown as CanvasRenderingContext2D, calls };
}
const PALETTE: Palette = {
  surface: "#fff",
  ink: "#000",
  muted: "#888",
  own: "#00f",
  enemy: "#f00",
  focus: "#0f0",
  grid: "#ccc",
  terrain: { key: "k", base: () => "#eee", dark: false },
};
function frameOf(world: World): Frame {
  return {
    world,
    beams: [],
    blasts: [],
    selected: null,
    entries: [],
    goals: [],
    hpMax: (k) => archetypeOf(TD_RULESET, k)?.hp ?? 1,
    splashOf: () => 0,
  };
}
function draw(build: (w: World) => void, extra: Partial<Frame> = {}): string[] {
  const w = createWorld(
    {
      map: { w: 5, h: 5, terrain: "=".repeat(25) },
      sides: 2,
      entities: [],
      seed: 1,
    },
    TD_RULESET,
  );
  build(w);
  const { g, calls } = recorder();
  drawFrame(g, 220, PALETTE, { ...frameOf(w), ...extra }, null);
  return calls;
}
const put = (w: World, kind: string, side = 1) => {
  const e = spawn(w.nextId++, side, archetypeOf(TD_RULESET, kind)!, 2, 2);
  w.entities.push(e);
  return e;
};

describe("pictures in the strategy look", () => {
  it("every tower family has a strategy picture in both views, and the families look different", () => {
    for (const family of FAMILIES) {
      expect(PROFILE[TOWER_ICON[family]], family).toBeDefined();
      expect(TOP[TOWER_ICON[family]], family).toBeDefined();
    }
    expect(new Set(Object.values(TOWER_ICON)).size).toBe(FAMILIES.length);
  });

  it("every wave unit has a picture; units sharing one differ in size", () => {
    const seen = new Map<string, number[]>();
    for (const kind of ENEMY_KINDS) {
      const [icon, size] = ENEMY_ICON[kind]!;
      expect(PROFILE[icon], kind).toBeDefined();
      const sizes = seen.get(icon) ?? [];
      expect(sizes, `${kind} needs its own size`).not.toContain(size);
      seen.set(icon, [...sizes, size]);
    }
  });
});

describe("state marks (never colour alone)", () => {
  const lineTos = (calls: string[]) =>
    calls.filter((c) => c.startsWith("lineTo")).length;

  it("a shielded unit gets a hexagon while its shield lasts", () => {
    const plain = draw((w) => put(w, "walker"));
    const shielded = draw((w) => put(w, "shielder"));
    expect(lineTos(shielded) - lineTos(plain)).toBe(6);
    const broken = draw((w) => {
      put(w, "shielder").shield = 0;
    });
    expect(lineTos(broken)).toBe(lineTos(plain));
  });

  it("a marked unit gets a diamond; an expired mark none", () => {
    const plain = draw((w) => put(w, "walker"));
    const marked = draw((w) => {
      put(w, "walker").status = [{ kind: "marked", ticks: 5, amount: 25 }];
    });
    expect(lineTos(marked) - lineTos(plain)).toBe(3);
    expect(marked.filter((c) => c === "closePath()").length).toBe(
      plain.filter((c) => c === "closePath()").length + 1,
    );
    const expired = draw((w) => {
      put(w, "walker").status = [{ kind: "marked", ticks: 0, amount: 25 }];
    });
    expect(lineTos(expired)).toBe(lineTos(plain));
  });

  it("level pips: dots for branches A and B (filled, hollow), squares for C, each on a halo", () => {
    const rects = (calls: string[]) =>
      calls.filter((c) => c.startsWith("rect(")).length;
    const arcs = (calls: string[]) =>
      calls.filter((c) => c.startsWith("arc(")).length;
    const a = draw((w) => put(w, "focus-2", 0));
    const b = draw((w) => put(w, "pulse-2", 0));
    const c = draw((w) => put(w, "prism-2", 0));
    // The fallback tower shape is one rect; level 3 adds three pips, each a halo and a pip.
    expect(rects(a)).toBe(1);
    expect(rects(c)).toBe(7);
    expect(arcs(a) - arcs(c)).toBe(6);
    expect(
      b.filter((x) => x === "stroke()").length -
        a.filter((x) => x === "stroke()").length,
    ).toBe(3);
    expect(
      a.filter((x) => x === "fill()").length -
        b.filter((x) => x === "fill()").length,
    ).toBe(3);
    // Pips are at least 0.15 of a cell wide (6.6 px on a 44 px cell).
    const pip = c.filter((x) => x.startsWith("rect("))[2]!;
    expect(Number(pip.slice(5, -1).split(",")[2])).toBeGreaterThanOrEqual(
      (220 / 5) * 0.15 - 0.1,
    );
  });
});

describe("outside force (hybrid External modes)", () => {
  it("draws the wave units of both sides alike, in ink", () => {
    const unitFills = (neutral: boolean) => {
      const calls = draw(
        (w) => {
          put(w, "walker", 0);
          w.entities.push(
            spawn(w.nextId++, 1, archetypeOf(TD_RULESET, "walker")!, 3, 3),
          );
        },
        { neutralUnits: neutral },
      );
      return calls
        .filter(
          (c, i) => c.startsWith("fillStyle=") && calls[i + 1] === "fill()",
        )
        .map((c) => c.slice(10));
    };
    // Each side's units in its own colour; as an outside force none of them in a side colour.
    expect(unitFills(false)).toContain(PALETTE.own);
    expect(unitFills(false)).toContain(PALETTE.enemy);
    expect(unitFills(true)).toContain(PALETTE.ink);
    expect(unitFills(true)).not.toContain(PALETTE.own);
    expect(unitFills(true)).not.toContain(PALETTE.enemy);
  });
});

describe("unit pictures", () => {
  it("every wave unit and defender has a strategy picture; defenders carry a pennant, the force none", async () => {
    const { DEFENDER_KINDS } = await import("../src/ruleset");
    for (const kind of [...ENEMY_KINDS, ...DEFENDER_KINDS])
      expect(PROFILE[ENEMY_ICON[kind]![0]], kind).toBeDefined();
    const withPath = <T>(f: () => T): T => {
      const had = Object.hasOwn(globalThis, "Path2D");
      (globalThis as Record<string, unknown>).Path2D ??= class {};
      try {
        return f();
      } finally {
        if (!had) delete (globalThis as Record<string, unknown>).Path2D;
      }
    };
    const strokes = (kind: string) =>
      withPath(
        () =>
          draw((w) => put(w, kind, 0)).filter((c) => c === "stroke()").length,
      );
    // The pennant: pole and flag, two more strokes than the same picture without it.
    expect(strokes("picket") - strokes("walker")).toBeGreaterThanOrEqual(2);
  });

  it("gaits: soldiers walk, wheels roll, tracks rumble, flyers float; standing is the plain picture", async () => {
    const { gaitOf, poseOf, STANDING } = await import("../src/units");
    expect(gaitOf("rifles")).toBe("legs");
    expect(gaitOf("outrider")).toBe("wheels");
    expect(gaitOf("warden")).toBe("tracks");
    expect(gaitOf("kite")).toBe("air");
    expect(gaitOf("no-such-picture")).toBe("legs");
    for (const gait of ["legs", "wheels", "tracks", "air"] as const) {
      expect(poseOf(gait, null)).toEqual(STANDING);
      const poses = [0.1, 0.2, 0.3, 0.4].map((p) =>
        JSON.stringify(poseOf(gait, p)),
      );
      // Moving, it changes over the step.
      expect(new Set(poses).size, gait).toBeGreaterThan(1);
      // Small: never more than a tenth of its size off, never more than about 6 degrees of tilt.
      for (let p = 0; p <= 1; p += 0.05) {
        const pose = poseOf(gait, p);
        expect(Math.abs(pose.dx) + Math.abs(pose.dy), gait).toBeLessThanOrEqual(
          0.1,
        );
        expect(Math.abs(pose.tilt), gait).toBeLessThanOrEqual(0.11);
        expect(pose.squash, gait).toBeGreaterThanOrEqual(0.94);
      }
    }
  });

  it("a posed picture faces the way it goes: turned round only against its natural facing", async () => {
    const { drawPosed, STANDING } = await import("../src/units");
    (globalThis as Record<string, unknown>).Path2D ??= class {};
    try {
      const calls = (own: boolean, facing: 1 | -1) => {
        const { g, calls: c } = recorder();
        expect(
          drawPosed(
            g,
            "rifles",
            20,
            20,
            40,
            { own, colour: "#00f", surface: "#fff" },
            facing,
            STANDING,
          ),
        ).toBe(true);
        return c;
      };
      expect(calls(true, 1)).not.toContain("scale(-1,1)");
      expect(calls(true, -1)).toContain("scale(-1,1)");
      // Not own: drawIcon itself faces it left, so walking left needs no extra turn (one turn only, its own).
      expect(calls(false, -1).filter((c) => c === "scale(-1,1)")).toHaveLength(
        1,
      );
      expect(calls(false, 1).filter((c) => c === "scale(-1,1)")).toHaveLength(
        2,
      );
      const { g } = recorder();
      expect(
        drawPosed(
          g,
          "no-such-picture",
          0,
          0,
          10,
          { own: true, colour: "#00f", surface: "#fff" },
          1,
          STANDING,
        ),
      ).toBe(false);
    } finally {
      delete (globalThis as Record<string, unknown>).Path2D;
    }
  });

  it("a holding defender stands on a bar (the hold line); a moving one does not", () => {
    const holding = draw((w) => (put(w, "picket", 0).order = { type: "hold" }));
    const moving = draw(
      (w) => (put(w, "picket", 0).order = { type: "move", x: 2, y: 0 }),
    );
    expect(holding.length).toBe(moving.length + 6);
    expect(holding.filter((c) => c === "stroke()").length).toBe(
      moving.filter((c) => c === "stroke()").length + 1,
    );
  });

  it("production buildings each have their own picture (design § 18.2); other kinds have none", async () => {
    const { drawBuilding, BUILDING_KINDS } = await import("../src/buildings");
    const { STRUCTURES } = await import("../src/ruleset");
    const shapes = new Set<string>();
    for (const kind of BUILDING_KINDS) {
      expect(STRUCTURES as readonly string[]).toContain(kind);
      const { g, calls } = recorder();
      expect(
        drawBuilding(g, kind, 20, 20, 40, {
          colour: "#00f",
          ink: "#000",
          surface: "#fff",
        }),
        kind,
      ).toBe(true);
      expect(calls).toContain("fillStyle=#00f");
      shapes.add(calls.filter((c) => !c.includes("=")).join("|"));
    }
    expect(shapes.size).toBe(BUILDING_KINDS.length);
    const { g } = recorder();
    expect(
      drawBuilding(g, "extractor", 0, 0, 10, {
        colour: "#00f",
        ink: "#000",
        surface: "#fff",
      }),
    ).toBe(false);
  });
});
