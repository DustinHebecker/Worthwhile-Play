/**
 * Explanations and text descriptions (design §§ 12, 16): plain data from the statics core, turned into sentences
 * with the translator. The same numbers decide the verdict and appear in the sentence.
 */
import type { Translator } from '@wp/game-core';
import type { Outcome } from './check';
import type { Scene } from './generate';
import { mobileHooks } from './rules';
import { barNet, beamMoments, BODY_LENGTH, bodyRight, isBar, mobileBars, mobileMass, sideOf, stackJoints, type BeamScene, type MobileNode, type StackScene } from './statics';

export interface BeamTerms {
  left: { kg: number; d: number; m: number; bar: boolean }[];
  right: { kg: number; d: number; m: number; bar: boolean }[];
  l: number;
  r: number;
}

/** The turning effects of a beam, per side; their sums decide the verdict (l > r → left side down). */
export function beamTerms(scene: BeamScene): BeamTerms {
  const m = beamMoments(scene);
  const out: BeamTerms = { left: [], right: [], l: 0, r: 0 };
  scene.weights.forEach((w, i) => {
    const v = m.weights[i]!;
    if (v < 0) out.left.push({ kg: w.kg, d: -v / w.kg, m: -v, bar: false });
    if (v > 0) out.right.push({ kg: w.kg, d: v / w.kg, m: v, bar: false });
  });
  if (m.bar < 0) out.left.push({ kg: scene.barKg, d: Math.abs(scene.axle), m: -m.bar, bar: true });
  if (m.bar > 0) out.right.push({ kg: scene.barKg, d: Math.abs(scene.axle), m: m.bar, bar: true });
  out.l = out.left.reduce((a, x) => a + x.m, 0);
  out.r = out.right.reduce((a, x) => a + x.m, 0);
  return out;
}

/** Left and right turning effects of each bar of a mobile (with the full mass below each hook). */
export function barTerms(node: MobileNode): { l: number; r: number }[] {
  return mobileBars(node).map((bar) => {
    let l = 0;
    let r = 0;
    for (const h of bar.hooks) {
      const v = mobileMass(h.child) * (h.pos - bar.string);
      if (v < 0) l -= v;
      else r += v;
    }
    return { l, r };
  });
}

/**
 * A centre of mass S/M in cm. Two decimals: with at most 48 kg above a joint (6 bodies, 8 cubes, a bucket), a centre off an edge by
 * at least 1/48 cm never rounds onto that edge, so the shown number always agrees with "holds", "edge" or "tips".
 */
const one = (t: Translator, x: number) => new Intl.NumberFormat(t.locale, { maximumFractionDigits: 2 }).format(x);
const num = (t: Translator, x: number) => new Intl.NumberFormat(t.locale).format(x);

export function explainLines(t: Translator, scene: Scene, outcome: Outcome, overhang?: { best: number; n: number }): string[] {
  if (scene.bench === 'beam') {
    const b = beamTerms(scene.s);
    const term = (x: BeamTerms['left'][number]) => t(x.bar ? 'ex.barTerm' : 'ex.term', { kg: num(t, x.kg), d: num(t, x.d), m: num(t, x.m) });
    return [
      t('ex.left', { terms: b.left.map(term).join(' + ') || '0', sum: num(t, b.l) }),
      t('ex.right', { terms: b.right.map(term).join(' + ') || '0', sum: num(t, b.r) }),
      t(`out.beam.${sideOf(b.r - b.l)}`, { l: num(t, b.l), r: num(t, b.r) })
    ];
  }
  if (scene.bench === 'mobile') {
    const terms = barTerms(scene.s);
    return terms.map((x, i) => t('out.bar', { n: num(t, i + 1), l: num(t, x.l), r: num(t, x.r), verdict: t(`verdict.${sideOf(x.r - x.l)}`) }));
  }
  const lines = stackJoints(scene.s).map((j) =>
    t('out.joint', { k: num(t, j.k + 1), x: one(t, j.S / j.M), lo: num(t, j.lo), hi: num(t, j.hi), state: t(j.holds ? (j.edge ? 'state.edge' : 'state.holds') : 'state.tips') })
  );
  if (outcome.bench === 'stack') {
    if (outcome.stands) lines.push(t(outcome.edge ? 'out.edge' : 'out.stands'));
    else for (const f of outcome.failing) lines.push(t('out.falls', { joint: num(t, f.joint + 1), dir: t(`dir.${f.dir}`) }));
    if (overhang) lines.push(t('out.overhang', { cm: num(t, outcome.overhang), n: num(t, overhang.n), best: num(t, overhang.best) }));
  }
  return lines;
}

/** The one-line result announced after "Let go". */
export function outcomeLine(t: Translator, scene: Scene, outcome: Outcome): string {
  if (scene.bench === 'beam') {
    const b = beamTerms(scene.s);
    return t(`out.beam.${sideOf(b.r - b.l)}`, { l: num(t, b.l), r: num(t, b.r) });
  }
  if (outcome.bench === 'mobile') return outcome.sides.every((s) => s === 'level') ? t('out.mobileLevel') : t('out.mobileTilts');
  if (outcome.bench === 'stack') {
    if (outcome.stands) return t(outcome.edge ? 'out.edge' : 'out.stands');
    const f = outcome.failing[0]!;
    return t('out.falls', { joint: num(t, f.joint + 1), dir: t(`dir.${f.dir}`) });
  }
  return '';
}

/* ---------------- Text descriptions (screen readers, § 16) ---------------- */

export function describe(t: Translator, scene: Scene): string {
  if (scene.bench === 'beam') {
    const s = scene.s;
    const side = (sign: number) =>
      s.weights
        .filter((w) => Math.sign(w.hook - s.axle) === sign)
        .map((w) => t('desc.weight', { kg: num(t, w.kg), d: num(t, Math.abs(w.hook - s.axle)) }))
        .join(', ') || t('desc.nothing');
    const atAxle = s.weights.filter((w) => w.hook === s.axle).map((w) => t('desc.kg', { kg: num(t, w.kg) }));
    const parts = [t(s.axle === 0 ? 'desc.beamMiddle' : 'desc.beamOff', { d: num(t, Math.abs(s.axle)), dir: t(s.axle < 0 ? 'dir.left' : 'dir.right') })];
    if (s.barKg > 0) parts.push(t('desc.barKg', { kg: num(t, s.barKg) }));
    parts.push(t('desc.left', { list: side(-1) }), t('desc.right', { list: side(1) }));
    if (atAxle.length) parts.push(t('desc.atAxle', { list: atAxle.join(', ') }));
    return parts.join(' ');
  }
  if (scene.bench === 'mobile') {
    const out: string[] = [];
    // Bar numbers follow `mobileBars` (depth-first), the numbering of the explanation and the hook chips.
    const all = mobileBars(scene.s);
    const numberOf = (bar: MobileNode) => (isBar(bar) ? all.indexOf(bar.bar) + 1 : 0);
    const walk = (node: MobileNode) => {
      if (!isBar(node)) return;
      const me = numberOf(node);
      const hooks = node.bar.hooks.map((h) => {
        const d = h.pos - node.bar.string;
        const what = h.child === null ? t('desc.empty') : isBar(h.child) ? t('desc.sub', { n: num(t, numberOf(h.child)), kg: num(t, mobileMass(h.child)) }) : t('desc.kg', { kg: num(t, h.child.kg) });
        return t(d < 0 ? 'desc.hookLeft' : 'desc.hookRight', { d: num(t, Math.abs(d)), what });
      });
      out.push(t('desc.bar', { n: num(t, me), hooks: hooks.join('; ') }));
      for (const h of node.bar.hooks) if (h.child) walk(h.child);
    };
    walk(scene.s);
    return out.join(' ');
  }
  const s: StackScene = scene.s;
  const parts = [t('desc.table')];
  s.bodies.forEach((b, k) => parts.push(t('desc.body', { n: num(t, k + 1), kind: t(`kind.${b.kind}`), kg: num(t, b.kind === 'block' ? 1 : 2), from: num(t, b.left), to: num(t, bodyRight(b)) })));
  for (const c of s.cubes) parts.push(t('desc.cube', { kg: num(t, c.kg), x: num(t, c.x), on: num(t, c.on + 1) }));
  if (s.bucket) parts.push(t('desc.bucket', { kg: num(t, s.bucket.kg), x: num(t, s.bucket.x) }));
  return parts.join(' ');
}

/** Label of a mobile hook for chips and the cursor: bar number and side distance. */
export function mobileHookLabel(t: Translator, node: MobileNode, j: number): string {
  const h = mobileHooks(node)[j];
  if (!h) return '';
  const bar = mobileBars(node)[h.bar]!;
  const d = bar.hooks[h.hook]!.pos - bar.string;
  return t('cursor.mobile', { bar: num(t, h.bar + 1), side: t(d < 0 ? 'dir.left' : 'dir.right'), d: num(t, Math.abs(d)) });
}

export const bodyLength = (kind: keyof typeof BODY_LENGTH) => BODY_LENGTH[kind];
export const barNetOf = barNet;
