import type { GameMetadata, GameModule, SettingSpec, SettingsEnv, Translator } from './types';
import { SKILLS } from './types';
import { DIFFICULTY_SETTING, coerceSetting, settingId } from './settings';

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
  if (metadata.setupInGame !== undefined && typeof metadata.setupInGame !== 'boolean') problems.push('setupInGame must be a boolean');
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

const SETTING_ID = /^[a-z][a-zA-Z0-9-]{0,31}$/;

/** A translator that only returns keys; enough to call `settings(env)` for validation. */
const keyTranslator = (locale: string): Translator => Object.assign((key: string) => key, { locale, direction: 'ltr' as const });

/**
 * Returns human-readable problems with a module's declared settings (ADR 0017), empty when valid or when there
 * are none: unique, well-formed ids; non-empty, unique values; defaults that are allowed values; `when` conditions
 * that refer to known settings and their values; at most one difficulty entry (which needs `metadata.difficulties`);
 * every label, hint and value key present in each of `requiredLocales`. A `settings(env)` function is called
 * with `env` (default: a key-returning translator and no device data).
 */
export function validateSettings(module: Pick<GameModule, 'metadata' | 'settings'>, requiredLocales: readonly string[] = [], env?: SettingsEnv): string[] {
  if (module.settings === undefined) return [];
  const { metadata } = module;
  const problems: string[] = [];
  let specs: readonly SettingSpec[];
  try {
    const declared = typeof module.settings === 'function' ? module.settings(env ?? { t: keyTranslator('en') }) : module.settings;
    if (!Array.isArray(declared)) return ['settings must be an array (or a function returning one)'];
    specs = declared;
  } catch (error) {
    return [`settings(env) threw: ${String(error)}`];
  }
  const ids = new Map<string, SettingSpec>();
  const keys: string[] = [];
  for (const spec of specs) {
    const id = settingId(spec);
    if (ids.has(id)) problems.push(spec.kind === 'difficulty' ? 'at most one difficulty entry is allowed' : `duplicate setting id "${id}"`);
    ids.set(id, spec);
    if (spec.kind === 'difficulty') {
      if (!metadata.difficulties?.length) problems.push('a difficulty entry needs metadata.difficulties');
      for (const d of metadata.difficulties ?? []) keys.push(`difficulty.${d}`);
      if (spec.labelKey) keys.push(spec.labelKey);
      if (spec.default !== undefined && !metadata.difficulties?.includes(spec.default)) problems.push(`difficulty default ${JSON.stringify(spec.default)} is not one of metadata.difficulties`);
    } else {
      if (!SETTING_ID.test(spec.id) || spec.id === DIFFICULTY_SETTING) problems.push(`setting id "${spec.id}" must match ${SETTING_ID.source} and not be "${DIFFICULTY_SETTING}"`);
      keys.push(spec.labelKey);
    }
    if (spec.hintKey) keys.push(spec.hintKey);
    if (spec.kind === 'choice') {
      if (spec.values.length === 0) problems.push(`setting "${spec.id}" has no values`);
      if (new Set(spec.values.map(String)).size !== spec.values.length) problems.push(`setting "${spec.id}" has duplicate values`);
      if (!spec.values.includes(spec.default)) problems.push(`setting "${spec.id}": default ${JSON.stringify(spec.default)} is not one of its values`);
      if ((spec.valueKey === undefined) === (spec.valueLabels === undefined)) problems.push(`setting "${spec.id}" needs exactly one of valueKey and valueLabels`);
      if (spec.valueKey !== undefined) for (const v of spec.values) keys.push(`${spec.valueKey}.${v}`);
      if (spec.valueLabels) for (const v of spec.values) if (!spec.valueLabels[String(v)]?.trim()) problems.push(`setting "${spec.id}" has no label for value ${JSON.stringify(v)}`);
      if (spec.display !== undefined && !['auto', 'radio', 'select'].includes(spec.display)) problems.push(`setting "${spec.id}": unknown display "${String(spec.display)}"`);
    }
    if (spec.kind !== 'difficulty' && spec.remember !== undefined && typeof (spec.remember as unknown) !== 'boolean') problems.push(`setting "${spec.id}": remember must be a boolean`);
    if (spec.kind === 'toggle' && typeof (spec.default as unknown) !== 'boolean') problems.push(`setting "${spec.id}": default must be a boolean`);
    if (spec.kind === 'number') {
      const step = spec.step ?? 1;
      if (!(Number.isFinite(spec.min) && Number.isFinite(spec.max) && spec.min <= spec.max)) problems.push(`setting "${spec.id}": needs finite min <= max`);
      if (!(Number.isFinite(step) && step > 0)) problems.push(`setting "${spec.id}": step must be positive`);
      else if (coerceSetting(spec, metadata, spec.default) === undefined) problems.push(`setting "${spec.id}": default ${spec.default} is outside min/max/step`);
    }
    if (!['difficulty', 'choice', 'toggle', 'number'].includes((spec as { kind: string }).kind)) problems.push(`unknown setting kind "${String((spec as { kind: unknown }).kind)}"`);
  }
  for (const spec of specs) {
    for (const [ref, allowed] of Object.entries(spec.when ?? {})) {
      const target = ids.get(ref);
      if (!target) {
        problems.push(`setting "${settingId(spec)}": when refers to unknown setting "${ref}"`);
        continue;
      }
      if (target === spec) problems.push(`setting "${settingId(spec)}": when refers to itself`);
      if (!Array.isArray(allowed) || allowed.length === 0) problems.push(`setting "${settingId(spec)}": when.${ref} lists no values`);
      else for (const value of allowed) if (coerceSetting(target, metadata, value) !== value) problems.push(`setting "${settingId(spec)}": when.${ref} lists ${JSON.stringify(value)}, not a value of "${ref}"`);
    }
  }
  for (const locale of requiredLocales) {
    const catalogue = metadata.messages[locale];
    if (!catalogue) continue; // reported by validateMetadata
    for (const key of new Set(keys)) if (!catalogue[key]?.trim()) problems.push(`locale "${locale}" lacks setting key "${key}"`);
  }
  return problems;
}

/** Identity helper that gives game authors full type inference for their module. */
export function defineGame<S>(module: GameModule<S>): GameModule<S> {
  return module;
}
