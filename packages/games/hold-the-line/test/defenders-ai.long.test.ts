import { describe, expect, it } from "vitest";
import { planRound } from "../src/ai";
import { CROSSING, ownPad } from "../src/maps";
import {
  applyPlan,
  checkPlan,
  lockRound,
  newGame,
  resolveBattle,
  type HoldState,
} from "../src/rules";

/**
 * The computer and defenders (design § 18.3), the slow part: whole plans in round 6 and nine rounds
 * of a game. Moved out of defenders.test.ts (fourth review of PR #111: they sat near their time
 * limit on CI and timed out under load).
 */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const pads = (side: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < CROSSING.h; y++)
    for (let x = 0; x < CROSSING.w; x++)
      if (ownPad(CROSSING, side, x, y)) out.push([x, y]);
  return out;
};
function built(
  kinds: readonly ("barracks" | "garage" | "hangar" | "lab")[],
  options: { solo?: boolean } = {},
  side = 0,
): HoldState {
  let s = clone(newGame(1, "normal", CROSSING.id, options));
  s.sides[side]!.credits = 20_000;
  const free = pads(side).reverse();
  kinds.forEach(
    (kind, i) =>
      (s = applyPlan(s, side, {
        t: "produce",
        kind,
        x: free[i]![0],
        y: free[i]![1],
      })),
  );
  return s;
}
const atRound = (s: HoldState, round: number): HoldState => ({
  ...s,
  round,
  log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })),
  pressure: 0,
});

describe("defenders: the computer (long)", () => {
  it("considers defender buildings among its candidates; every command it gives is legal", () => {
    for (const level of ["normal", "hard"] as const) {
      const s = atRound(built([], {}, 1), 5);
      s.sides[1].credits = 3000;
      s.roundStart = { ...s.roundStart, sides: clone(s.sides) };
      const plan = planRound(s, 1, level);
      let t = s;
      for (const c of plan) {
        expect(checkPlan(t, 1, c), `${level} ${JSON.stringify(c)}`).toBeNull();
        t = applyPlan(t, 1, c);
      }
    }
  }, 300_000);

  it("Normal builds defender buildings when they are worth it: in its own game against the outside force it does", () => {
    let s = newGame(1, "normal", CROSSING.id);
    const built: string[] = [];
    for (let round = 0; round < 9 && s.phase === "plan"; round++) {
      for (const c of planRound(s, 0, "normal")) s = applyPlan(s, 0, c);
      s = lockRound(s, (v) => {
        const plan = planRound(v, 1, "normal");
        for (const c of plan) if (c.t === "produce") built.push(c.kind);
        return plan;
      });
      s = resolveBattle(s).state;
    }
    expect(
      built.some((k) => k === "barracks" || k === "garage" || k === "hangar"),
    ).toBe(true);
  }, 600_000);
});
