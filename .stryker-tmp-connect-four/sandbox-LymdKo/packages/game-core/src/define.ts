// @ts-nocheck
import type { GameMetadata, GameModule } from './types';
import { SKILLS } from './types';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED_MESSAGE_KEYS = ['title', 'tagline', 'rules'] as const;

/** Returns human-readable problems with a metadata object (empty array when valid). */
export function validateMetadata(metadata: GameMetadata, requiredLocales: readonly string[] = []): string[] {
  const problems: string[] = [];
  if (!ID_PATTERN.test(metadata.id)) problems.push(`id "${metadata.id}" must be kebab-case`);
  if (!Number.isInteger(metadata.stateVersion) || metadata.stateVersion < 1) problems.push('stateVersion must be a positive integer');
  if (metadata.skills.length === 0) problems.push('at least one skill is required');
  for (const skill of metadata.skills) if (!(SKILLS as readonly string[]).includes(skill)) problems.push(`unknown skill "${skill}"`);
  const [min, max] = metadata.typicalMinutes;
  if (!(min > 0 && max >= min)) problems.push('typicalMinutes must satisfy 0 < min <= max');
  if (metadata.inputMethods.length === 0) problems.push('at least one input method is required');
  for (const locale of requiredLocales) {
    const catalogue = metadata.messages[locale];
    if (!catalogue) {
      problems.push(`missing messages for locale "${locale}"`);
      continue;
    }
    for (const key of REQUIRED_MESSAGE_KEYS) if (!catalogue[key]?.trim()) problems.push(`locale "${locale}" lacks "${key}"`);
  }
  return problems;
}

/** Identity helper that gives game authors full type inference for their module. */
export function defineGame<S>(module: GameModule<S>): GameModule<S> {
  return module;
}
