import type { GameMetadata, GameModule, SettingSpec, SettingValue, SettingsEnv } from './types';

/** Id of the difficulty entry in settings records and `when` conditions. */
export const DIFFICULTY_SETTING = 'difficulty';

/** The id a setting is stored under (`difficulty` for the difficulty entry). */
export const settingId = (spec: SettingSpec): string => (spec.kind === 'difficulty' ? DIFFICULTY_SETTING : spec.id);

/** A choice/difficulty entry's values (the difficulty's are `metadata.difficulties`); undefined for toggles and numbers. */
export function settingChoices(spec: SettingSpec, metadata: GameMetadata): readonly (string | number)[] | undefined {
  if (spec.kind === 'difficulty') return metadata.difficulties ?? [];
  if (spec.kind === 'choice') return spec.values;
  return undefined;
}

/** The value a setting starts with (difficulty: its `default` when that is one of `metadata.difficulties`, else the first). */
export function settingDefault(spec: SettingSpec, metadata: GameMetadata): SettingValue | undefined {
  if (spec.kind === 'difficulty') return spec.default !== undefined && metadata.difficulties?.includes(spec.default) ? spec.default : metadata.difficulties?.[0];
  return spec.default;
}

/**
 * Normalizes an untrusted value for a setting: the matching declared value (a choice also accepts the value's
 * string form, as forms and URLs deliver it), or undefined when it is not allowed.
 */
export function coerceSetting(spec: SettingSpec, metadata: GameMetadata, value: unknown): SettingValue | undefined {
  const choices = settingChoices(spec, metadata);
  if (choices) {
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;
    return choices.find((choice) => choice === value || String(choice) === String(value));
  }
  if (spec.kind === 'toggle') {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 'on') return true;
    if (value === 'false') return false;
    return undefined;
  }
  if (spec.kind === 'number') {
    const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
    if (!Number.isFinite(n) || n < spec.min || n > spec.max) return undefined;
    const step = spec.step ?? 1;
    const steps = (n - spec.min) / step;
    return Math.abs(steps - Math.round(steps)) < 1e-9 ? n : undefined;
  }
  return undefined;
}

/**
 * The declared settings of a module (calling `settings(env)` when it is a function). Never throws: a failing
 * declaration counts as none, so a game can still be started.
 */
export function declaredSettings(module: Pick<GameModule, 'settings'>, env: SettingsEnv): readonly SettingSpec[] {
  try {
    const declared = typeof module.settings === 'function' ? module.settings(env) : module.settings;
    return Array.isArray(declared) ? declared : [];
  } catch (error) {
    console.error('settings declaration failed', error);
    return [];
  }
}

/**
 * What the host draws on the start screen (ADR 0017): the declared settings, with the difficulty first when the
 * game has `metadata.difficulties` but lists no difficulty entry — also for games whose own setup follows
 * (`setupInGame`, ADR 0015): the difficulty is chosen on the start screen, the game's setup holds the rest.
 */
export function hostSettings(module: Pick<GameModule, 'settings' | 'metadata'>, env: SettingsEnv): readonly SettingSpec[] {
  const declared = declaredSettings(module, env);
  const hasDifficulty = declared.some((spec) => spec.kind === 'difficulty');
  return module.metadata.difficulties?.length && !hasDifficulty ? [{ kind: 'difficulty' }, ...declared] : declared;
}

/** Sanitized settings, ready for `newGame` and the save. */
export interface ResolvedSettings {
  /** The difficulty, when a visible difficulty entry exists. */
  readonly difficulty?: string;
  /** Values of the other visible settings, by id (every visible setting has a value). */
  readonly settings: Readonly<Record<string, SettingValue>>;
  /** Ids of the settings whose `when` condition holds (difficulty as `difficulty`). */
  readonly visible: ReadonlySet<string>;
}

/**
 * Resolves untrusted chosen values (remembered, from a form, from a URL, from a save) against the settings:
 * unknown ids and invalid values are dropped and replaced by the default, and settings whose `when` condition
 * does not hold are left out. A condition holds when every referenced setting is visible and has one of the
 * listed values. Pure; never throws.
 */
export function resolveSettings(specs: readonly SettingSpec[], metadata: GameMetadata, chosen: Readonly<Record<string, unknown>> = {}): ResolvedSettings {
  const values = new Map<string, SettingValue>();
  for (const spec of specs) {
    const id = settingId(spec);
    if (values.has(id)) continue;
    const own = Object.prototype.hasOwnProperty.call(chosen, id) ? coerceSetting(spec, metadata, chosen[id]) : undefined;
    const value = own ?? settingDefault(spec, metadata);
    if (value !== undefined) values.set(id, value);
  }
  // Visibility can chain (a setting shown only while another visible one has a value): iterate to a fixed point.
  let visible = new Set(values.keys());
  for (let round = 0; round <= specs.length; round++) {
    const next = new Set<string>();
    for (const spec of specs) {
      const id = settingId(spec);
      if (!values.has(id)) continue;
      const holds = Object.entries(spec.when ?? {}).every(([ref, allowed]) => {
        const current = values.get(ref);
        return visible.has(ref) && current !== undefined && allowed.some((a) => a === current);
      });
      if (holds) next.add(id);
    }
    const stable = next.size === visible.size && [...next].every((id) => visible.has(id));
    visible = next;
    if (stable) break;
  }
  const settings: Record<string, SettingValue> = {};
  let difficulty: string | undefined;
  for (const id of visible) {
    const value = values.get(id)!;
    if (id === DIFFICULTY_SETTING && specs.some((s) => s.kind === 'difficulty')) difficulty = String(value);
    else settings[id] = value;
  }
  return { ...(difficulty !== undefined ? { difficulty } : {}), settings, visible };
}
