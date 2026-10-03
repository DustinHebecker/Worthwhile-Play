import type { GameMetadata, Translator } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import { h } from '@wp/ui';
import type { UiTranslator } from '../app';

export function gameTranslator(metadata: GameMetadata, locale: SupportedLocale): Translator {
  return createTranslator({
    locale,
    sources: [metadata.messages, COMMON_MESSAGES],
    onMissing: import.meta.env.DEV ? (key) => console.warn(`[i18n] ${metadata.id}: missing "${key}" in ${locale}`) : undefined
  });
}

/** Duration, skills and requirement badges. Text, not icons only. */
export function gameBadges(metadata: GameMetadata, t: UiTranslator): HTMLElement {
  const [min, max] = metadata.typicalMinutes;
  const { capabilities: caps } = metadata;
  return h('span', { class: 'badges' },
    h('span', { class: 'badge' }, t('game.duration', { min, max })),
    ...metadata.skills.map((skill) => h('span', { class: 'badge skill' }, t(`skill.${skill}` as never))),
    caps.offline && caps.network !== 'required' ? h('span', { class: 'badge' }, t('game.offline')) : h('span', { class: 'badge warn' }, t('game.network')),
    caps.aiOptional ? h('span', { class: 'badge' }, t('game.aiOptional')) : null
  );
}
