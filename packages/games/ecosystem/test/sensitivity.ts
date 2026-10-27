/**
 * The model's answer to a causal-loop edge (design § 12.2 (b)): at a start state, raise the source by 10 % (a
 * condition one level towards "more"; a species by at least 1,000 u) and see which way the target moves — over one
 * day, or over the target's maturation delay + 2 weeks for a delay edge (4 weeks when the target has none). Test
 * helper, not game code.
 */
import type { Edge } from '../src/cld';
import { habitatDef, speciesIndex, type Habitat } from '../src/habitats';
import { applyAction, cloneSim, envOf, idiv, pop, stepDay, stepWeek, type Sim } from '../src/model';

const CONDITIONS: Readonly<Record<string, string>> = { light: 'light', runoff: 'runoff', flow: 'flow', rain: 'rain', fertiliser: 'fertiliser' };

function measure(s: Sim, habitat: Habitat, node: string): number {
  const hab = habitatDef(habitat);
  if (node === 'nutrients') return s.n;
  if (node === 'dead') return s.d;
  if (node === 'water') return s.w;
  return pop(s, speciesIndex(hab, node));
}

/** +1, −1 or 0: the direction the target moves when the source is raised. */
export function edgeEffect(start: Sim, habitat: Habitat, edge: Edge): number {
  const hab = habitatDef(habitat);
  const base = cloneSim(start);
  // Absent species cannot show an effect: give both runs the species' usual starting amount.
  for (const node of [edge.from, edge.to]) {
    const i = speciesIndex(hab, node);
    if (i >= 0 && pop(base, i) === 0) applyAction(base, hab, { week: 0, kind: 'add', species: node });
  }
  let lo = cloneSim(base);
  let hi = cloneSim(base);
  const cond = CONDITIONS[edge.from];
  if (cond !== undefined) {
    const c = hab.conditions.findIndex((x) => x.id === cond);
    const values = hab.conditions[c]!.values;
    const now = base.cond[c]!;
    const up = values.map((v, k) => ({ v, k })).filter((x) => x.v > values[now]!).sort((a, b) => a.v - b.v)[0];
    if (up) hi.cond[c] = up.k;
    else {
      const down = values.map((v, k) => ({ v, k })).filter((x) => x.v < values[now]!).sort((a, b) => b.v - a.v)[0]!;
      lo = cloneSim(base);
      lo.cond[c] = down.k;
      hi = cloneSim(base);
    }
  } else if (edge.from === 'nutrients') hi.n += idiv(hi.n, 10) + 1;
  else if (edge.from === 'dead') hi.d += idiv(hi.d, 10) + 1;
  else if (edge.from === 'water') hi.w += idiv(hi.w, 10) + 1;
  else {
    const i = speciesIndex(hab, edge.from);
    // At least one display unit (1,000 u): the steep light and water responses work in thousands (`q`), so a nudge of
    // a tiny population (e.g. 826 u of duckweed in the clear pond) would sit below their resolution.
    hi.b[i] = hi.b[i]! + Math.max(idiv(pop(hi, i), 10) + 1, 1000);
  }
  const t = speciesIndex(hab, edge.to);
  const run = (s: Sim) => {
    if (edge.delay) {
      const D = t >= 0 ? hab.species[t]!.delay : 0;
      const weeks = D ? D + 2 : 4;
      for (let w = 0; w < weeks; w++) stepWeek(s, hab);
    } else stepDay(s, hab, envOf(hab, s));
    return measure(s, habitat, edge.to);
  };
  return Math.sign(run(hi) - run(lo));
}
