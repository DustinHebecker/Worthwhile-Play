import { bcp47Tag, gameLocale, type GameMetadata, type Translator } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import { h } from '@wp/ui';
import type { UiTranslator } from '../app';

/**
 * Translator of a game's namespace (its messages, then `common.*`) for the UI locale. A game that declares
 * `metadata.locales` and does not ship the UI locale is shown in English (ADR 0003 amendment 2026-10-24): the
 * translator is then an English one (`t.locale === 'en'`, `ltr`), so nothing is reported as missing. Every other
 * game keeps the strict behaviour: a key missing in the UI locale falls back to English and is reported.
 */
export function gameTranslator(metadata: GameMetadata, uiLocale: SupportedLocale): Translator {
  const locale = gameLocale(metadata, uiLocale);
  return createTranslator({
    locale,
    sources: [metadata.messages, COMMON_MESSAGES],
    onMissing: import.meta.env.DEV ? (key) => console.warn(`[i18n] ${metadata.id}: missing "${key}" in ${locale}`) : undefined
  });
}

/**
 * `lang` and `dir` for an element showing a game's texts, when they are in another language than the page (a game
 * shown in English in a UI locale it does not ship); nothing otherwise, so the element inherits the page's.
 */
export function gameTextAttrs(gt: Translator, uiLocale: SupportedLocale): { lang?: string; dir?: 'ltr' | 'rtl' } {
  return gt.locale === uiLocale ? {} : { lang: bcp47Tag(gt.locale), dir: gt.direction };
}

/** Duration, skills and requirement badges. Text, not icons only. */
export function gameBadges(metadata: GameMetadata, t: UiTranslator): HTMLElement {
  const [min, max] = metadata.typicalMinutes;
  const { capabilities: caps } = metadata;
  return h('span', { class: 'badges' },
    // A game released early (owner decision): a text badge, not colour only.
    metadata.status === 'preview' ? h('span', { class: 'badge preview', 'data-testid': 'preview-badge' }, t('game.preview')) : null,
    h('span', { class: 'badge' }, t('game.duration', { min, max })),
    ...metadata.skills.map((skill) => h('span', { class: 'badge skill' }, t(`skill.${skill}` as never))),
    caps.offline && caps.network !== 'required' ? h('span', { class: 'badge' }, t('game.offline')) : h('span', { class: 'badge warn' }, t('game.network')),
    caps.aiOptional ? h('span', { class: 'badge' }, t('game.aiOptional')) : null
  );
}
