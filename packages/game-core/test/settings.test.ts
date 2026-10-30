import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { hostSettings, ownsDifficulty, resolveSettings, validateSettings, type GameMetadata, type GameModule, type SettingSpec } from '../src';

const messages = {
  title: 'Demo',
  tagline: 'A demo',
  rules: 'Rules',
  'difficulty.easy': 'Easy',
  'difficulty.hard': 'Hard',
  'setting.mode': 'Opponent',
  'mode.computer': 'Computer',
  'mode.person': 'Person',
  'setting.size': 'Size',
  'size.4': '4×4',
  'size.6': '6×6',
  'setting.hints': 'Hints',
  'setting.rounds': 'Rounds',
  'group.people': 'People'
};
const metadata: GameMetadata = {
  id: 'demo-game',
  stateVersion: 1,
  skills: ['planning'],
  typicalMinutes: [1, 5],
  inputMethods: ['pointer'],
  capabilities: { offline: true, audio: 'none', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
  messages: { en: messages, de: messages },
  difficulties: ['easy', 'hard']
};
const specs: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer' },
  { kind: 'difficulty', when: { mode: ['computer'] } },
  { kind: 'choice', id: 'size', labelKey: 'setting.size', values: [4, 6], valueKey: 'size', default: 4 },
  { kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true },
  { kind: 'number', id: 'rounds', labelKey: 'setting.rounds', min: 1, max: 9, step: 2, default: 3, when: { hints: [true] } }
];
const mod = (settings: GameModule['settings'] | undefined, extra: { [K in keyof GameMetadata]?: GameMetadata[K] | undefined } = {}): Pick<GameModule, 'metadata' | 'settings'> => ({ metadata: { ...metadata, ...extra } as GameMetadata, ...(settings !== undefined ? { settings } : {}) });

describe('validateSettings', () => {
  it('accepts a valid declaration and modules without settings', () => {
    expect(validateSettings(mod(specs), ['en', 'de'])).toEqual([]);
    expect(validateSettings(mod(undefined), ['en'])).toEqual([]);
    expect(validateSettings(mod(() => specs), ['en'])).toEqual([]);
  });

  it.each<[SettingSpec[], string]>([
    [[{ kind: 'toggle', id: 'a', labelKey: 'setting.hints', default: true }, { kind: 'toggle', id: 'a', labelKey: 'setting.hints', default: false }], 'duplicate setting id "a"'],
    [[{ kind: 'difficulty' }, { kind: 'difficulty' }], 'at most one difficulty'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: [], valueKey: 'mode', default: 'x' }], 'no values'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer'], valueKey: 'mode', default: 'person' }], 'is not one of its values'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'computer'], valueKey: 'mode', default: 'computer' }], 'duplicate values'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer'], default: 'computer' }], 'exactly one of valueKey and valueLabels'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'robot'], valueKey: 'mode', default: 'computer' }], 'lacks setting key "mode.robot"'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['a'], valueLabels: {}, default: 'a' }], 'no label for value "a"'],
    [[{ kind: 'toggle', id: 'Bad id', labelKey: 'setting.hints', default: true }], 'must match'],
    [[{ kind: 'toggle', id: 'difficulty', labelKey: 'setting.hints', default: true }], 'must match'],
    [[{ kind: 'toggle', id: 'hints', labelKey: 'setting.missing', default: true }], 'lacks setting key "setting.missing"'],
    [[{ kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, hintKey: 'hint.missing' }], 'lacks setting key "hint.missing"'],
    [[{ kind: 'number', id: 'rounds', labelKey: 'setting.rounds', min: 1, max: 9, step: 2, default: 4 }], 'outside min/max/step'],
    [[{ kind: 'number', id: 'rounds', labelKey: 'setting.rounds', min: 9, max: 1, default: 4 }], 'min <= max'],
    [[{ kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, when: { nope: [1] } }], 'unknown setting "nope"'],
    [[{ kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, when: { hints: [true] } }], 'refers to itself'],
    [[{ kind: 'difficulty' }, { kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, when: { difficulty: ['brutal'] } }], 'not a value of "difficulty"'],
    [[{ kind: 'difficulty' }, { kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, when: { difficulty: [] } }], 'lists no values'],
    [[{ kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, remember: 'no' as unknown as boolean }], 'remember must be a boolean'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer', groups: [{ labelKey: 'group.missing', values: ['person'] }] }], 'lacks setting key "group.missing"'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer', groups: [{ labelKey: 'group.people', values: ['robot'] }] }], 'lists "robot", not one of its values'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer', groups: [{ labelKey: 'group.people', values: [] }] }], 'lists no values'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer', groups: [{ labelKey: 'group.people', values: ['person'] }, { labelKey: 'group.people', values: ['person'] }] }], 'in more than one group'],
    [[{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer'], valueKey: 'mode', default: 'computer', groups: 'x' as never }], 'groups must be an array']
  ])('reports %j', (declared, fragment) => {
    expect(validateSettings(mod(declared), ['en']).join('\n')).toContain(fragment);
  });

  it('accepts remember: false and true on choices, toggles and numbers', () => {
    const remembering: SettingSpec[] = [
      { kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer'], valueKey: 'mode', default: 'computer', remember: false },
      { kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: true, remember: true },
      { kind: 'number', id: 'rounds', labelKey: 'setting.rounds', min: 1, max: 9, default: 3, remember: false }
    ];
    expect(validateSettings(mod(remembering), ['en'])).toEqual([]);
  });

  it('accepts groups of a choice (an <optgroup> per group in the host select)', () => {
    const grouped: SettingSpec[] = [{ kind: 'choice', id: 'mode', labelKey: 'setting.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer', display: 'select', groups: [{ labelKey: 'group.people', values: ['person'] }] }];
    expect(validateSettings(mod(grouped), ['en', 'de'])).toEqual([]);
  });

  it('needs metadata.difficulties for a difficulty entry and checks its labels', () => {
    expect(validateSettings(mod([{ kind: 'difficulty' }], { difficulties: undefined }), ['en']).join('\n')).toContain('needs metadata.difficulties');
    expect(validateSettings(mod([{ kind: 'difficulty' }], { difficulties: ['easy', 'brutal'] }), ['en']).join('\n')).toContain('"difficulty.brutal"');
  });

  it('checks the default of a difficulty entry', () => {
    expect(validateSettings(mod([{ kind: 'difficulty', default: 'hard' }]), ['en'])).toEqual([]);
    expect(validateSettings(mod([{ kind: 'difficulty', default: 'brutal' }]), ['en']).join('\n')).toContain('difficulty default "brutal"');
  });

  it('reports a throwing or non-array declaration instead of throwing', () => {
    expect(validateSettings(mod(() => { throw new Error('x'); }), ['en'])[0]).toContain('threw');
    expect(validateSettings(mod('nope' as never), ['en'])[0]).toContain('must be an array');
  });
});

describe('hostSettings', () => {
  const env = { t: Object.assign((k: string) => k, { locale: 'en', direction: 'ltr' as const }) };
  it('puts the difficulty first when the game has difficulties but declares no entry', () => {
    expect(hostSettings(mod(undefined), env)).toEqual([{ kind: 'difficulty' }]);
    expect(hostSettings(mod([specs[3]!]), env)).toEqual([{ kind: 'difficulty' }, specs[3]]);
    expect(hostSettings(mod(specs), env)).toEqual(specs);
    expect(hostSettings(mod(undefined, { difficulties: undefined }), env)).toEqual([]);
  });

  it('puts the difficulty first for setupInGame games that declare nothing (their own setup follows Start)', () => {
    expect(hostSettings(mod(undefined, { setupInGame: true }), env)).toEqual([{ kind: 'difficulty' }]);
    expect(hostSettings(mod(undefined, { setupInGame: true, difficulties: undefined }), env)).toEqual([]);
    expect(ownsDifficulty(mod(undefined, { setupInGame: true }))).toBe(false);
  });

  it('shows exactly what a setupInGame game declares, without a difficulty (chosen in its own setup)', () => {
    expect(hostSettings(mod([], { setupInGame: true }), env)).toEqual([]);
    expect(hostSettings(mod([specs[3]!], { setupInGame: true }), env)).toEqual([specs[3]]);
    expect(hostSettings(mod(() => [], { setupInGame: true }), env)).toEqual([]);
    expect(hostSettings(mod(() => [specs[3]!], { setupInGame: true }), env)).toEqual([specs[3]]);
    expect(ownsDifficulty(mod([], { setupInGame: true }))).toBe(true);
  });

  it('non-setupInGame games always get the difficulty, also when they declare []', () => {
    expect(hostSettings(mod([]), env)).toEqual([{ kind: 'difficulty' }]);
    expect(hostSettings(mod(() => []), env)).toEqual([{ kind: 'difficulty' }]);
    expect(hostSettings(mod([], { setupInGame: false }), env)).toEqual([{ kind: 'difficulty' }]);
    expect(ownsDifficulty(mod([]))).toBe(false);
  });

  it('treats a throwing declaration as none', () => {
    const error = console.error;
    console.error = () => undefined;
    try {
      expect(hostSettings(mod(() => { throw new Error('x'); }, { difficulties: undefined }), env)).toEqual([]);
    } finally {
      console.error = error;
    }
  });
});

describe('resolveSettings', () => {
  it('preselects the default of the difficulty entry, else the first difficulty', () => {
    expect(resolveSettings([{ kind: 'difficulty', default: 'hard' }], metadata).difficulty).toBe('hard');
    expect(resolveSettings([{ kind: 'difficulty', default: 'brutal' }], metadata).difficulty).toBe('easy');
    expect(resolveSettings([{ kind: 'difficulty' }], metadata).difficulty).toBe('easy');
    expect(resolveSettings([{ kind: 'difficulty', default: 'hard' }], metadata, { difficulty: 'easy' }).difficulty).toBe('easy');
  });

  it('fills defaults and hides settings whose condition does not hold', () => {
    expect(resolveSettings(specs, metadata)).toEqual({ difficulty: 'easy', settings: { mode: 'computer', size: 4, hints: true, rounds: 3 }, visible: new Set(['mode', 'difficulty', 'size', 'hints', 'rounds']) });
    const person = resolveSettings(specs, metadata, { mode: 'person', difficulty: 'hard', hints: false, rounds: 5 });
    expect(person.difficulty).toBeUndefined();
    expect(person.settings).toEqual({ mode: 'person', size: 4, hints: false });
  });

  it('accepts string forms from forms and URLs, drops invalid values and unknown ids', () => {
    expect(resolveSettings(specs, metadata, { size: '6', hints: 'false', rounds: '7', difficulty: 'hard', extra: 1 })).toMatchObject({ difficulty: 'hard', settings: { mode: 'computer', size: 6, hints: false } });
    expect(resolveSettings(specs, metadata, { size: 5, rounds: 4, difficulty: 'brutal', mode: 'robot' }).settings).toEqual({ mode: 'computer', size: 4, hints: true, rounds: 3 });
    expect(resolveSettings(specs, metadata, { rounds: 11 }).settings.rounds).toBe(3);
    expect(resolveSettings(specs, metadata, { rounds: 9 }).settings.rounds).toBe(9);
  });

  it('hides chains: a setting depending on a hidden one is hidden too', () => {
    const chain: SettingSpec[] = [
      { kind: 'toggle', id: 'hints', labelKey: 'setting.hints', default: false },
      { kind: 'choice', id: 'size', labelKey: 'setting.size', values: [4, 6], valueKey: 'size', default: 4, when: { hints: [true] } },
      { kind: 'number', id: 'rounds', labelKey: 'setting.rounds', min: 1, max: 9, default: 3, when: { size: [4] } }
    ];
    expect(resolveSettings(chain, metadata).settings).toEqual({ hints: false });
    expect(resolveSettings(chain, metadata, { hints: true }).settings).toEqual({ hints: true, size: 4, rounds: 3 });
  });

  it('never throws and always yields allowed values', () => {
    fc.assert(
      fc.property(fc.dictionary(fc.constantFrom('mode', 'difficulty', 'size', 'hints', 'rounds', 'x', '__proto__'), fc.anything()), (chosen) => {
        const { difficulty, settings } = resolveSettings(specs, metadata, chosen);
        if (difficulty !== undefined) expect(metadata.difficulties).toContain(difficulty);
        expect(['computer', 'person']).toContain(settings.mode);
        expect([4, 6]).toContain(settings.size);
        if ('rounds' in settings) expect([1, 3, 5, 7, 9]).toContain(settings.rounds);
      })
    );
  });
});
