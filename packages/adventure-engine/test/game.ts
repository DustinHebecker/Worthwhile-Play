import { createLocaleContent, type GameMessages, type GameMetadata } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { defineAdventureGame, plainArt, textKeys, withAdventureMessages, type Catalogue, type Speech } from '../src';
import { WATCHTOWER } from './fixture';

/** Fixture texts: every derived key, per locale, as "<locale>:<key>" (enough to find them in the DOM). */
export const fixtureTexts = (locale: string): Catalogue => Object.fromEntries(textKeys(WATCHTOWER).map((k) => [k, `${locale}:${k}`]));

const own: GameMessages = Object.fromEntries(
  SUPPORTED_LOCALES.map((l) => [l, { title: `${l}: Watchtower`, tagline: `${l}: a test adventure`, rules: `${l}: explore, combine, deduce.` }])
);

export const FIXTURE_METADATA: GameMetadata = {
  id: 'watchtower',
  stateVersion: 1,
  skills: ['deduction'],
  typicalMinutes: [5, 10],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: { offline: true, audio: 'optional', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
  messages: withAdventureMessages(own)
};

const store = createLocaleContent<Catalogue>(Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, () => Promise.resolve(fixtureTexts(l))])));

export function fixtureGame(speech?: Speech) {
  return defineAdventureGame({ metadata: FIXTURE_METADATA, adventure: WATCHTOWER, art: plainArt, content: store, speech: () => speech });
}
