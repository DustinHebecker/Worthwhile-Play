import { defineGame, type GameMetadata, type GameModule, type LocaleContentStore } from '@wp/game-core';
import { compile } from './compile';
import { migrateAdventureState, type ContentMigrations } from './migrate';
import { isValidAdventureState } from './state';
import type { Adventure, AdventureState } from './types';
import type { ArtProvider } from './view/art';
import { browserSpeech, createAdventureView, type Catalogue, type Speech } from './view/view';

export interface AdventureGameOptions {
  /** Game metadata; `messages` must include the shared interface texts (`withAdventureMessages`). */
  readonly metadata: GameMetadata;
  readonly adventure: Adventure;
  readonly art: ArtProvider;
  /** Content texts per UI locale (ADR 0011): `createLocaleContent` over the game's per-locale chunks. */
  readonly content: LocaleContentStore<Catalogue>;
  /** Content migrations from every released content version to the next (§ 5.2); none before the first update. */
  readonly migrations?: ContentMigrations;
  /** Speech for "read aloud" (default: browser speech synthesis when available). */
  readonly speech?: () => Speech | undefined;
}

/**
 * Turns adventure content into a standard `GameModule` (ADR 0002, 0011, 0014): compiled once, saved state
 * validated against the content, texts preloaded per locale, the shared adventure view.
 */
export function defineAdventureGame(options: AdventureGameOptions): GameModule<AdventureState> {
  const compiled = compile(options.adventure);
  if (compiled.adv.contentVersion !== options.metadata.stateVersion) {
    // One number for both keeps saves honest: a content change that breaks saves bumps stateVersion too.
    throw new Error(`adventure "${options.adventure.id}": metadata.stateVersion must equal contentVersion`);
  }
  return defineGame<AdventureState>({
    metadata: options.metadata,
    create: (context) => createAdventureView(context, { compiled, art: options.art, texts: (locale) => options.content.get(locale), speech: (options.speech ?? browserSpeech)() }),
    isValidState: (value): value is AdventureState => isValidAdventureState(compiled, value),
    preload: (locale) => options.content.preload(locale),
    migrateState: (state, fromVersion) => migrateAdventureState(compiled, options.migrations ?? {}, state, fromVersion)
  });
}
