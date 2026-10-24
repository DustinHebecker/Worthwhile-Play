import type { Translator } from '@wp/game-core';
import type { CardQuestState } from '../src/index';

const q = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Plays the person's side through the DOM with the simplest choices until the game ends or `limit` clicks. */
export function clickThrough(root: HTMLElement, instance: { serialize(): CardQuestState }, limit: number): number {
  let clicks = 0;
  for (; clicks < limit; clicks++) {
    const state = instance.serialize();
    if (state.phase === 'over') break;
    const end = q(root, 'end');
    if (end?.disabled) {
      // Give-away mode: select hand cards until the button is enabled.
      for (const tile of root.querySelectorAll<HTMLButtonElement>('[data-testid="hand"] .cq-tile[aria-pressed="false"]')) {
        tile.click();
        if (!q(root, 'end')!.disabled) break;
      }
      q(root, 'end')!.click();
      continue;
    }
    const next = ['reveal-continue', 'open', 'rummage', 'pass', 'accept', 'roll', 'end'].map((id) => q(root, id)).find((b) => b && !b.disabled);
    if (!next) throw new Error(`no action button in phase ${state.phase}`);
    next.click();
  }
  return clicks;
}

/** Deal log lines whose plain form agrees its verbs with {name} and {to}: the person gets `.you` / `.toYou` keys. */
const DEAL_KEYS = [
  'log.offer.help', 'log.offer.free', 'log.offer.stay', 'log.accept', 'log.decline', 'log.switch', 'log.kept.loot', 'log.kept.item',
  'log.kept.favour', 'log.kept.free', 'log.broken.switch', 'log.broken.stay', 'log.broken.favour', 'log.void'
];

/** A translator that records keys filled with the person where only computer players fit (verb agreement, case). */
export function personSpy(real: Translator, npcOnly: readonly string[], misuse: string[]): Translator {
  const you = real('you');
  return Object.assign((key: string, params?: Readonly<Record<string, string | number>>) => {
    if ((npcOnly.includes(key) || DEAL_KEYS.includes(key)) && params?.name === you) misuse.push(`${key} {name}`);
    if (params?.to === you || params?.target === you) misuse.push(`${key} {to}`);
    return real(key, params);
  }, { locale: real.locale, direction: real.direction });
}

