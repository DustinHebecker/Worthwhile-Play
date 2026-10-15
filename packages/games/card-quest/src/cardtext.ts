import type { Translator } from '@wp/game-core';
import type { CardDef, Cond, Mod, Penalty } from './cards';
import { baseId } from './cards';
import { contentFor } from './content';
import { allSets, defOf } from './worlds';

/** Rules text of a card, generated from its structure (design § 6.2): consistent and never mistranslated. */

const signed = (n: number) => ({ sign: n < 0 ? '−' : '+', n: Math.abs(n) });

export const cardName = (t: Translator, card: string): string => contentFor(t.locale)[baseId(card)]?.name ?? baseId(card);
export const cardFlavour = (t: Translator, card: string): string => contentFor(t.locale)[baseId(card)]?.flavour ?? '';

export function condText(t: Translator, mod: Mod): string {
  const when: Cond | undefined = mod.when;
  const s = signed(mod.bonus);
  if (!when) return t('r.bonus', { n: mod.bonus });
  if (when.kind) return t('r.vsKind', { ...s, kind: t(`kind.${when.kind}`) });
  if (when.trait) return t('r.vsTrait', { ...s, trait: t(`trait.${when.trait}`) });
  if (when.family) return t('r.vsFamily', { ...s, family: t(`family.${when.family}`) });
  if (when.lacks) return t('r.vsLacks', { ...s, trait: t(`trait.${when.lacks}`) });
  return t('r.bonus', { n: mod.bonus });
}

export function penaltyText(t: Translator, p: Penalty): string {
  switch (p.t) {
    case 'level':
      return t('p.level', { n: p.n });
    case 'slot':
      return t('p.slot', { slot: t(p.slot === 'hand' ? 'slot.hand1' : `slot.${p.slot}`) });
    case 'best':
      return t('p.best');
    case 'cards':
      return t('p.cards', { n: p.n });
    case 'malus':
      return t('p.malus', { n: p.n });
    case 'origin':
      return t('p.origin');
    case 'profession':
      return t('p.profession');
  }
}

const list = (t: Translator, items: string[]) => items.join(t('r.separator'));

/** The type line and the rules lines of a card. */
export function cardRules(t: Translator, card: string): { type: string; lines: string[] } {
  const def: CardDef = defOf(card);
  const lines: string[] = [];
  const traits = (ts: readonly string[] | undefined) => (ts && ts.length > 0 ? list(t, ts.map((x) => t(`trait.${x}`))) : '');
  switch (def.type) {
    case 'monster': {
      lines.push(t('r.level', { n: def.level }));
      const tr = traits(def.traits);
      lines.push(tr ? t('r.kindTraits', { kind: t(`kind.${def.kind}`), traits: tr }) : t(`kind.${def.kind}`));
      for (const m of def.mods ?? []) lines.push(condText(t, m));
      if (def.noFlee) lines.push(t('r.noFlee'));
      else if (def.flee) lines.push(t('r.flee', signed(def.flee)));
      lines.push(t('r.reward', { levels: def.levels, loot: def.loot }));
      lines.push(t('r.blunder', { list: list(t, def.blunder.map((p) => penaltyText(t, p))) }));
      break;
    }
    case 'booster': {
      const l = signed(def.level);
      const o = signed(def.loot);
      lines.push(t('r.booster', { level: `${l.sign}${l.n}`, loot: `${o.sign}${o.n}` }));
      const tr = traits(def.traits);
      if (tr) lines.push(t('r.traits', { list: tr }));
      break;
    }
    case 'reinforcement':
      lines.push(t('r.reinforcement'));
      break;
    case 'windfall':
      lines.push(t('r.windfall', { n: def.loot }));
      break;
    case 'curse':
      lines.push(t('r.curse', { effect: penaltyText(t, def.effect) }));
      break;
    case 'origin': {
      lines.push(t('r.origin', { kind: t(`kind.${def.kind}`) }));
      const tr = traits(def.traits);
      if (tr) lines.push(t('r.traits', { list: tr }));
      for (const m of def.mods ?? []) lines.push(condText(t, m));
      if (def.flee) lines.push(t('r.flee', signed(def.flee)));
      break;
    }
    case 'profession':
      for (const m of def.mods ?? []) lines.push(condText(t, m));
      if (def.perClass) lines.push(t('r.perClass', { n: def.perClass.bonus, cls: t(`class.${def.perClass.cls}`) }));
      if (def.flee) lines.push(t('r.flee', signed(def.flee)));
      if (def.sell) lines.push(t('r.sell', { n: def.sell }));
      break;
    case 'item': {
      const slot = def.slot === 'hand' ? t(def.hands === 2 ? 'slot.hand2' : 'slot.hand1') : t(`slot.${def.slot}`);
      lines.push(`${slot}${def.big ? ` (${t('slot.big')})` : ''} · ${t('r.bonus', { n: def.bonus })} · ${t(`class.${def.cls}`)}`);
      for (const m of def.mods ?? []) lines.push(condText(t, m));
      for (const m of def.self ?? []) if (m.when?.family) lines.push(t('r.selfFamily', { n: m.bonus, family: t(`family.${m.when.family}`) }));
      if (def.flee) lines.push(t('r.flee', signed(def.flee)));
      const tr = traits(def.traits);
      if (tr) lines.push(t('r.traits', { list: tr }));
      if (def.set) {
        const set = allSets().find((s) => s.id === def.set);
        if (set) lines.push(t('r.set', { name: t(`set.${set.id}`), count: set.items.length, n: set.bonus }));
      }
      lines.push(t('r.value', { n: def.value }));
      break;
    }
    case 'upgrade': {
      lines.push(t('r.upgrade', { n: def.bonus }));
      const tr = traits(def.traits);
      if (tr) lines.push(t('r.traits', { list: tr }));
      break;
    }
    case 'oneshot':
      if (def.escape) lines.push(t('r.escape'));
      if (def.bonus > 0) lines.push(t('r.oneshot', { n: def.bonus }));
      if (def.flee) lines.push(t('r.oneshotFlee', { n: def.flee }));
      lines.push(t('r.value', { n: def.value }));
      break;
    case 'levelup':
      lines.push(t('r.levelup'));
      break;
    case 'double':
      lines.push(t(`r.double.${def.of}`));
      break;
  }
  return { type: t(`type.${def.type}`), lines };
}

/** The most important number of a card for compact display (level, bonus …), or ''. */
export function keyNumber(card: string): string {
  const def = defOf(card);
  switch (def.type) {
    case 'monster':
      return String(def.level);
    case 'item':
    case 'upgrade':
      return `+${def.bonus}`;
    case 'oneshot':
      return def.bonus > 0 ? `+${def.bonus}` : '';
    case 'booster':
      return def.level >= 0 ? `+${def.level}` : `−${-def.level}`;
    default:
      return '';
  }
}
