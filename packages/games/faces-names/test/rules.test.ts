import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { metadata } from '../src/metadata';
import { messages } from '../src/messages';
import { NAMES, namesFor } from '../src/names';
import {
  answer,
  answerValue,
  CONFIGS,
  CONTEXTS,
  correctOption,
  DEFAULT_DIFFICULTY,
  describeFace,
  DIFFICULTIES,
  faceDistance,
  FEATURE_VALUES,
  FEATURES,
  featurePart,
  generateFaces,
  generateQuestions,
  GREY_FROM_AGE,
  HAIR_COLOURS,
  hairColourVisible,
  hasHint,
  isAnswered,
  isConsistentFace,
  isCorrect,
  isDistinct,
  isName,
  isValidFacesNamesState,
  JOBS,
  makeQuestion,
  MAX_AGE,
  MIN_AGE,
  NAME_MAX,
  nearestPeople,
  newRound,
  nextPerson,
  nextQuestion,
  NOTE_MAX,
  pickNames,
  previousPerson,
  QUESTION_TYPES,
  randomFace,
  resultsByPerson,
  salientDistance,
  sanitizeNote,
  score,
  setNote,
  SHIRTS,
  showHint,
  SKIN_TONES,
  STANDOUT_OPTIONS,
  standoutOptions,
  toDifficulty,
  toggleStandout,
  variantFace,
  type Difficulty,
  type Face,
  type FacesNamesState,
  type Feature,
  type Person,
  type Question
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);
const POOL = NAMES.en as readonly string[];
const round = (seed: number, difficulty: Difficulty = 'easy') => newRound(seed, difficulty, POOL);

const BASE: Face = {
  shape: 'oval',
  skin: 0,
  hair: 'short',
  hairColour: 'brown',
  brows: 'straight',
  eyes: 'small',
  nose: 'small',
  mouth: 'smile',
  glasses: 'none',
  facialHair: 'none',
  earrings: 'none',
  mark: 'none',
  shirt: 0
};

/** Moves past the study phase. */
function toTest(state: FacesNamesState): FacesNamesState {
  let s = state;
  while (s.phase === 'study') s = nextPerson(s);
  return s;
}

/** Plays the whole test; `pick(q, i)` returns the chosen option position. */
function play(state: FacesNamesState, pick: (q: Question, i: number) => number): FacesNamesState {
  let s = toTest(state);
  while (s.phase === 'test') {
    s = answer(s, pick(s.questions[s.index] as Question, s.index));
    s = nextQuestion(s);
  }
  return s;
}

/** Independent oracle for the answer of a question. */
function oracleAnswer(s: FacesNamesState, q: Question): number {
  for (let i = 0; i < q.options.length; i++) {
    const v = q.options[i];
    if (q.type === 'job' ? v === s.people[q.person]?.job : v === q.person) return i;
  }
  return -1;
}

describe('content', () => {
  it('declares the difficulties of the rules in order, easy first', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(metadata.id).toBe('faces-names');
  });

  it('gets longer and closer-looking with difficulty', () => {
    const [easy, medium, hard] = DIFFICULTIES.map((d) => CONFIGS[d]);
    expect(easy).toEqual({ people: 4, options: 4, minDistance: 6, lookalikePairs: 0 });
    expect(medium).toEqual({ people: 6, options: 5, minDistance: 4, lookalikePairs: 2 });
    expect(hard).toEqual({ people: 8, options: 6, minDistance: 3, lookalikePairs: 4 });
    for (const c of [easy, medium, hard]) {
      expect(c?.options).toBeLessThanOrEqual(c?.people as number);
      expect((c?.lookalikePairs as number) * 2).toBeLessThanOrEqual(c?.people as number);
      expect(c?.people).toBeLessThanOrEqual(JOBS.length);
    }
  });

  it('has 30 distinct, valid first names for every UI locale, English as fallback', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const names = NAMES[locale] as readonly string[];
      expect(names, locale).toHaveLength(30);
      expect(new Set(names).size, locale).toBe(30);
      expect(names.every(isName), locale).toBe(true);
      expect(namesFor(locale)).toBe(names);
    }
    expect(namesFor('xx')).toBe(NAMES.en);
  });

  it('has a message for every feature value, colour, job and context', () => {
    const en = messages.en as Record<string, string>;
    for (const f of FEATURES) for (const v of FEATURE_VALUES[f]) if (v !== 'none') expect(en[`f.${f}.${v}`], `${f}.${v}`).toBeTruthy();
    for (const c of HAIR_COLOURS) expect(en[`f.colour.${c}`]).toBeTruthy();
    for (const j of JOBS) expect(en[`job.${j}`]).toBeTruthy();
    for (const c of CONTEXTS) expect(en[`ctx.${c}`]).toBeTruthy();
    for (const q of QUESTION_TYPES) expect(en[`summary.type.${q}`]).toBeTruthy();
  });

  it('maps unknown difficulties to the default', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nightmare')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });
});

describe('faces', () => {
  it('counts differing shape features only (never skin, hair colour or shirt)', () => {
    expect(faceDistance(BASE, BASE)).toBe(0);
    expect(faceDistance(BASE, { ...BASE, skin: 7, hairColour: 'black', shirt: 5 })).toBe(0);
    expect(faceDistance(BASE, { ...BASE, glasses: 'round' })).toBe(1);
    expect(faceDistance(BASE, { ...BASE, glasses: 'round', hair: 'bun', mark: 'mole' })).toBe(3);
    const all = { ...BASE, shape: 'long', hair: 'curly', brows: 'thick', eyes: 'large', nose: 'rounded', mouth: 'broad', glasses: 'square', facialHair: 'beard', earrings: 'hoops', mark: 'freckles' } as Face;
    expect(faceDistance(BASE, all)).toBe(10);
    expect(salientDistance(BASE, all)).toBe(3);
    expect(salientDistance(BASE, { ...BASE, nose: 'rounded', eyes: 'large' })).toBe(0);
    expect(salientDistance(BASE, { ...BASE, facialHair: 'moustache' })).toBe(1);
  });

  it('knows which combinations are consistent', () => {
    expect(isConsistentFace(BASE, 30)).toBe(true);
    expect(isConsistentFace({ ...BASE, hair: 'headscarf' }, 30)).toBe(true);
    expect(isConsistentFace({ ...BASE, hair: 'headscarf', facialHair: 'beard' }, 30)).toBe(false);
    expect(isConsistentFace({ ...BASE, hair: 'headscarf', earrings: 'studs' }, 30)).toBe(false);
    expect(isConsistentFace({ ...BASE, hair: 'cap', earrings: 'studs', facialHair: 'beard' }, 30)).toBe(true);
    expect(isConsistentFace({ ...BASE, hairColour: 'grey' }, GREY_FROM_AGE)).toBe(true);
    expect(isConsistentFace({ ...BASE, hairColour: 'grey' }, GREY_FROM_AGE - 1)).toBe(false);
  });

  it('hides the hair colour for bald heads, headscarves and caps', () => {
    expect(hairColourVisible(BASE)).toBe(true);
    for (const hair of ['bald', 'headscarf', 'cap'] as const) expect(hairColourVisible({ ...BASE, hair })).toBe(false);
    for (const hair of ['buzz', 'curly', 'wavy', 'long', 'bun'] as const) expect(hairColourVisible({ ...BASE, hair })).toBe(true);
  });

  it('describes every present feature with message keys, hair with its colour when visible, never skin', () => {
    const face: Face = { ...BASE, hair: 'curly', hairColour: 'black', glasses: 'round', skin: 5 };
    expect(describeFace(face)).toEqual([
      { key: 'f.shape.oval' },
      { key: 'f.hair.curly', colour: 'f.colour.black' },
      { key: 'f.brows.straight' },
      { key: 'f.eyes.small' },
      { key: 'f.nose.small' },
      { key: 'f.mouth.smile' },
      { key: 'f.glasses.round' }
    ]);
    expect(featurePart({ ...BASE, hair: 'headscarf' }, 'hair')).toEqual({ key: 'f.hair.headscarf' });
    expect(featurePart(BASE, 'glasses')).toBeUndefined();
    expect(featurePart({ ...BASE, mark: 'mole' }, 'mark')).toEqual({ key: 'f.mark.mole' });
  });

  it('generates valid, consistent random faces (grey only from GREY_FROM_AGE)', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: MIN_AGE, max: MAX_AGE }), (seed, age) => {
        const rng = createRng(seed);
        for (let i = 0; i < 20; i++) {
          const f = randomFace(rng, age);
          for (const feature of FEATURES) expect(FEATURE_VALUES[feature]).toContain(f[feature]);
          expect(f.skin).toBeGreaterThanOrEqual(0);
          expect(f.skin).toBeLessThan(SKIN_TONES);
          expect(f.shirt).toBeGreaterThanOrEqual(0);
          expect(f.shirt).toBeLessThan(SHIRTS);
          expect(HAIR_COLOURS).toContain(f.hairColour);
          expect(isConsistentFace(f, age)).toBe(true);
        }
      }),
      { numRuns: 150 }
    );
  });

  it('uses every value of every feature, all skin tones and accessories sometimes absent', () => {
    const rng = createRng(11);
    const seen = new Map<string, Set<unknown>>();
    for (let i = 0; i < 600; i++) {
      const f = randomFace(rng, 70);
      for (const [k, v] of Object.entries(f)) (seen.get(k) ?? seen.set(k, new Set()).get(k))?.add(v);
    }
    for (const feature of FEATURES) expect(seen.get(feature)?.size, feature).toBe(FEATURE_VALUES[feature].length);
    expect(seen.get('skin')?.size).toBe(SKIN_TONES);
    expect(seen.get('shirt')?.size).toBe(SHIRTS);
    expect(seen.get('hairColour')?.size).toBe(HAIR_COLOURS.length);
  });

  it('keeps accessories optional: "none" is the most common glasses, facial hair, earrings and mark value', () => {
    const rng = createRng(5);
    const counts: Record<string, Record<string, number>> = {};
    for (let i = 0; i < 2000; i++) {
      const f = randomFace(rng, 30);
      for (const k of ['glasses', 'facialHair', 'earrings', 'mark'] as const) {
        counts[k] ??= {};
        (counts[k] as Record<string, number>)[f[k]] = ((counts[k] as Record<string, number>)[f[k]] ?? 0) + 1;
      }
    }
    for (const k of ['glasses', 'facialHair', 'earrings', 'mark']) {
      const c = counts[k] as Record<string, number>;
      const none = c.none ?? 0;
      for (const [v, n] of Object.entries(c)) if (v !== 'none') expect(none, `${k}`).toBeGreaterThan(n);
    }
    // Weighted 2:1:1 → about half of the faces wear no glasses.
    expect((counts.glasses?.none ?? 0) / 2000).toBeGreaterThan(0.4);
    expect((counts.glasses?.none ?? 0) / 2000).toBeLessThan(0.6);
  });

  it('makes look-alikes that differ in exactly the requested number of features, at least one salient', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 1, max: 6 }), fc.integer({ min: MIN_AGE, max: MAX_AGE }), (seed, changes, age) => {
        const rng = createRng(seed);
        const base = randomFace(rng, MAX_AGE);
        let made = 0;
        for (let i = 0; i < 30; i++) {
          const v = variantFace(rng, base, changes, age);
          if (!v) continue;
          made++;
          expect(faceDistance(v, base)).toBe(changes);
          expect(salientDistance(v, base)).toBeGreaterThanOrEqual(1);
          expect(v.skin).toBe(base.skin);
          expect(isConsistentFace(v, age)).toBe(true);
          if (base.hairColour !== 'grey' || age >= GREY_FROM_AGE) expect(v.hairColour).toBe(base.hairColour);
          else expect(v.hairColour).not.toBe('grey');
        }
        expect(made).toBeGreaterThan(0);
      }),
      { numRuns: 120 }
    );
  });

  it('checks distinctness against every other face', () => {
    const other = { ...BASE, glasses: 'round' } as Face;
    expect(isDistinct(BASE, [], 5)).toBe(true);
    expect(isDistinct(BASE, [other], 1)).toBe(true);
    expect(isDistinct(BASE, [other], 2)).toBe(false);
    // Far enough, but no salient difference.
    const quiet = { ...BASE, shape: 'long', brows: 'thick', eyes: 'large', nose: 'rounded', mouth: 'broad', earrings: 'studs', mark: 'mole' } as Face;
    expect(faceDistance(BASE, quiet)).toBe(7);
    expect(isDistinct(BASE, [quiet], 3)).toBe(false);
    expect(isDistinct(BASE, [{ ...quiet, hair: 'bun' }], 3)).toBe(true);
    expect(isDistinct(BASE, [{ ...quiet, hair: 'bun' }, other], 3)).toBe(false);
  });

  it(
    'generates faces that are clearly distinguishable, with look-alike pairs on harder levels',
    () => {
      fc.assert(
        fc.property(seedArb, difficultyArb, (seed, difficulty) => {
          const config = CONFIGS[difficulty];
          const rng = createRng(seed);
          const ages = Array.from({ length: config.people }, () => rng.int(MIN_AGE, MAX_AGE));
          const faces = generateFaces(rng, ages, config);
          expect(faces).toHaveLength(config.people);
          for (let i = 0; i < faces.length; i++) {
            expect(isConsistentFace(faces[i] as Face, ages[i] as number)).toBe(true);
            for (let j = i + 1; j < faces.length; j++) {
              expect(faceDistance(faces[i] as Face, faces[j] as Face)).toBeGreaterThanOrEqual(config.minDistance);
              expect(salientDistance(faces[i] as Face, faces[j] as Face)).toBeGreaterThanOrEqual(1);
            }
          }
          for (let k = 0; k < config.lookalikePairs; k++) expect(faceDistance(faces[2 * k] as Face, faces[2 * k + 1] as Face)).toBe(config.minDistance);
        }),
        { numRuns: 150 }
      );
    },
    60_000
  );
});

describe('names', () => {
  it('prefers names with different first letters', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 1, max: 8 }), (seed, count) => {
        const names = pickNames(createRng(seed), POOL, count);
        expect(names).toHaveLength(count);
        expect(new Set(names).size).toBe(count);
        expect(new Set(names.map((n) => n[0])).size).toBe(count);
        for (const n of names) expect(POOL).toContain(n);
      }),
      { numRuns: 150 }
    );
  });

  it('falls back to repeated initials, skips invalid entries and refuses too small pools', () => {
    const names = pickNames(createRng(1), ['Ann', 'Anna', 'Abe', ' bad', '', 'Ann'], 3);
    expect([...names].sort()).toEqual(['Abe', 'Ann', 'Anna']);
    expect(names[0]?.[0]).toBe('A');
    expect(() => pickNames(createRng(1), ['Ann', 'Ann', 'x\n'], 2)).toThrow(RangeError);
  });

  it('accepts only displayable names', () => {
    expect(isName('Sarah')).toBe(true);
    expect(isName('さくら')).toBe(true);
    expect(isName('A'.repeat(NAME_MAX))).toBe(true);
    expect(isName('A'.repeat(NAME_MAX + 1))).toBe(false);
    expect(isName('')).toBe(false);
    expect(isName(' Sarah')).toBe(false);
    expect(isName('Sa\nrah')).toBe(false);
    expect(isName('Sa rah')).toBe(false);
    expect(isName(7)).toBe(false);
  });
});

describe('sanitizeNote', () => {
  it('turns control characters into spaces and cuts at NOTE_MAX characters without splitting', () => {
    expect(sanitizeNote('Sarah → Sahara')).toBe('Sarah → Sahara');
    expect(sanitizeNote('a\tb\nc d\u0085e')).toBe('a b c d e');
    expect(sanitizeNote(42)).toBe('');
    expect(sanitizeNote('x'.repeat(NOTE_MAX + 10))).toHaveLength(NOTE_MAX);
    const emoji = '😀'.repeat(NOTE_MAX + 1);
    expect(Array.from(sanitizeNote(emoji))).toHaveLength(NOTE_MAX);
    expect(sanitizeNote('y'.repeat(NOTE_MAX))).toBe('y'.repeat(NOTE_MAX));
  });

  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (text) => {
        expect(sanitizeNote(sanitizeNote(text))).toBe(sanitizeNote(text));
      })
    );
  });
});

describe('newRound', () => {
  it('is deterministic per seed and differs between seeds', () => {
    expect(round(1, 'hard')).toEqual(round(1, 'hard'));
    expect(round(1)).not.toEqual(round(2));
    expect(round(2 ** 32 + 3).seed).toBe(3);
  });

  it(
    'creates a valid session at the start of study',
    () => {
      fc.assert(
        fc.property(seedArb, difficultyArb, (seed, difficulty) => {
          const s = round(seed, difficulty);
          const config = CONFIGS[difficulty];
          expect(s).toMatchObject({ seed, difficulty, phase: 'study', index: 0, answers: [] });
          expect(s.people).toHaveLength(config.people);
          expect(new Set(s.people.map((p) => p.name)).size).toBe(config.people);
          expect(new Set(s.people.map((p) => p.job)).size).toBe(config.people);
          for (const p of s.people) {
            expect(POOL).toContain(p.name);
            expect(p.age).toBeGreaterThanOrEqual(MIN_AGE);
            expect(p.age).toBeLessThanOrEqual(MAX_AGE);
            expect(CONTEXTS).toContain(p.context);
          }
          // Spoken descriptions differ, so screen-reader users can tell everyone apart.
          expect(new Set(s.people.map((p) => JSON.stringify(describeFace(p.face)))).size).toBe(config.people);
          let lookalikes = 0;
          for (let i = 0; i < s.people.length; i++)
            for (let j = i + 1; j < s.people.length; j++) if (faceDistance((s.people[i] as Person).face, (s.people[j] as Person).face) === config.minDistance) lookalikes++;
          expect(lookalikes).toBeGreaterThanOrEqual(config.lookalikePairs);
          expect(s.standout).toEqual(s.people.map(() => null));
          expect(s.notes).toEqual(s.people.map(() => ''));
          expect(s.hints).toEqual(s.questions.map(() => false));
          expect(isValidFacesNamesState(clone(s))).toBe(true);
        }),
        { numRuns: 120 }
      );
    },
    60_000
  );

  it('uses the given name pool (e.g. another script)', () => {
    const s = newRound(9, 'medium', NAMES.ja as readonly string[]);
    for (const p of s.people) expect(NAMES.ja).toContain(p.name);
  });
});

describe('questions', () => {
  it(
    'asks every person every question type exactly once, in three rounds, never the same person twice in a row',
    () => {
      fc.assert(
        fc.property(seedArb, difficultyArb, (seed, difficulty) => {
          const s = round(seed, difficulty);
          const n = s.people.length;
          expect(s.questions).toHaveLength(n * QUESTION_TYPES.length);
          const pairs = new Set(s.questions.map((q) => `${q.person}:${q.type}`));
          expect(pairs.size).toBe(n * 3);
          for (let r = 0; r < 3; r++) {
            const roundPeople = s.questions.slice(r * n, (r + 1) * n).map((q) => q.person);
            expect(new Set(roundPeople).size).toBe(n);
          }
          for (let i = 1; i < s.questions.length; i++) expect(s.questions[i]?.person).not.toBe(s.questions[i - 1]?.person);
        }),
        { numRuns: 150 }
      );
    },
    60_000
  );

  it(
    'offers distinct options including the answer; look-alike faces first as distractors',
    () => {
      fc.assert(
        fc.property(seedArb, difficultyArb, (seed, difficulty) => {
          const s = round(seed, difficulty);
          const config = CONFIGS[difficulty];
          for (const q of s.questions) {
            expect(q.options).toHaveLength(config.options);
            expect(new Set(q.options as unknown[]).size).toBe(config.options);
            const correct = correctOption(s.people, q);
            expect(correct).toBe(oracleAnswer(s, q));
            expect(correct).toBeGreaterThanOrEqual(0);
            if (q.type === 'job') {
              for (const o of q.options) expect(JOBS).toContain(o);
            } else {
              const face = (s.people[q.person] as Person).face;
              const chosen = (q.options as number[]).filter((o) => o !== q.person);
              const left = s.people.map((_, i) => i).filter((i) => i !== q.person && !chosen.includes(i));
              const worstChosen = Math.max(...chosen.map((o) => faceDistance(face, (s.people[o] as Person).face)));
              for (const i of left) expect(faceDistance(face, (s.people[i] as Person).face)).toBeGreaterThanOrEqual(worstChosen);
            }
          }
        }),
        { numRuns: 120 }
      );
    },
    60_000
  );

  it('fills job options with other people’s jobs first, then unused jobs', () => {
    const s = round(4, 'easy');
    const q = makeQuestion(createRng(1), s.people, 0, 'job', 6);
    const sessionJobs = s.people.map((p) => p.job);
    expect(q.options).toHaveLength(6);
    for (const j of sessionJobs) expect(q.options).toContain(j);
    expect(answerValue(s.people, q)).toBe(s.people[0]?.job);
    const name = makeQuestion(createRng(1), s.people, 2, 'name', 3);
    expect(name.options).toContain(2);
    expect(answerValue(s.people, name)).toBe(2);
  });

  it('sorts other people by face distance', () => {
    const people = [BASE, { ...BASE, glasses: 'round', mark: 'mole', nose: 'rounded' }, { ...BASE, glasses: 'square' }, { ...BASE, hair: 'bun', eyes: 'large' }].map(
      (face, i) => ({ name: `P${i}`, age: 30, job: JOBS[i], context: 'chess', face }) as Person
    );
    expect(nearestPeople(createRng(3), people, 0)).toEqual([2, 3, 1]);
  });

  it('is generated from the rng only (same rng state → same questions)', () => {
    const s = round(8, 'medium');
    expect(generateQuestions(createRng(5), s.people, 5)).toEqual(generateQuestions(createRng(5), s.people, 5));
  });
});

describe('study', () => {
  it('pages through people and then starts the questions', () => {
    let s = round(3);
    expect(previousPerson(s)).toBe(s);
    s = nextPerson(s);
    expect(s.index).toBe(1);
    expect(previousPerson(s).index).toBe(0);
    s = nextPerson(nextPerson(s));
    expect(s).toMatchObject({ phase: 'study', index: 3 });
    s = nextPerson(s);
    expect(s).toMatchObject({ phase: 'test', index: 0 });
    expect(nextPerson(s)).toBe(s);
    expect(previousPerson(s)).toBe(s);
  });

  it('keeps a sanitized note per person, only while studying', () => {
    let s = setNote(round(3), 'Sarah\n→ Sahara');
    expect(s.notes[0]).toBe('Sarah → Sahara');
    expect(setNote(s, 'Sarah\n→ Sahara')).toBe(s);
    s = setNote(nextPerson(s), 'x'.repeat(200));
    expect(s.notes[1]).toHaveLength(NOTE_MAX);
    expect(s.notes[0]).toBe('Sarah → Sahara');
    const test = toTest(s);
    expect(setNote(test, 'late')).toBe(test);
  });

  it('offers present features, rarest in the session first', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const s = round(seed, difficulty);
        s.people.forEach((p, i) => {
          const options = standoutOptions(s.people, i);
          expect(options.length).toBeGreaterThan(0);
          expect(options.length).toBeLessThanOrEqual(STANDOUT_OPTIONS);
          expect(new Set(options).size).toBe(options.length);
          for (const f of options) expect(p.face[f]).not.toBe('none');
          // Oracle: how many people share the value (hair counts with its visible colour).
          const key = (face: Face, f: Feature) => (f === 'hair' && hairColourVisible(face) ? `${face.hair}/${face.hairColour}` : face[f]);
          const shared = (f: Feature) => s.people.filter((o) => key(o.face, f) === key(p.face, f)).length;
          for (let k = 1; k < options.length; k++) expect(shared(options[k] as Feature)).toBeGreaterThanOrEqual(shared(options[k - 1] as Feature));
          const present = FEATURES.filter((f) => p.face[f] !== 'none');
          const rarestLeft = present.filter((f) => !options.includes(f)).map(shared);
          if (rarestLeft.length > 0) expect(Math.min(...rarestLeft)).toBeGreaterThanOrEqual(shared(options[options.length - 1] as Feature));
        });
      }),
      { numRuns: 80 }
    );
  });

  it('prefers the earlier feature on ties and always offers at least four features', () => {
    const people = [BASE, { ...BASE, hair: 'bun', glasses: 'round' }].map((face, i) => ({ name: `P${i}`, age: 30, job: JOBS[i], context: 'chess', face }) as Person);
    // Person 0: hair (short/brown) is unique; the rest is shared → hair first, then FEATURES order.
    expect(standoutOptions(people, 0)).toEqual(['hair', 'shape', 'brows', 'eyes']);
    expect(standoutOptions(people, 1)).toEqual(['hair', 'glasses', 'shape', 'brows']);
  });

  it('toggles the chosen feature for the person shown', () => {
    const s = round(6);
    const [first, second] = standoutOptions(s.people, 0) as [Feature, Feature];
    let t = toggleStandout(s, first);
    expect(t.standout[0]).toBe(first);
    t = toggleStandout(t, second);
    expect(t.standout[0]).toBe(second);
    expect(toggleStandout(t, second).standout[0]).toBeNull();
    const absent = FEATURES.find((f) => !standoutOptions(s.people, 0).includes(f)) as Feature;
    expect(toggleStandout(s, absent)).toBe(s);
    const test = toTest(t);
    expect(toggleStandout(test, first)).toBe(test);
  });
});

describe('test phase', () => {
  it('answers once, then moves on; finishing after the last question', () => {
    let s = toTest(round(12));
    expect(isAnswered(s)).toBe(false);
    expect(nextQuestion(s)).toBe(s);
    expect(answer(s, -1)).toBe(s);
    expect(answer(s, 4)).toBe(s);
    expect(answer(s, 1.5)).toBe(s);
    s = answer(s, 3);
    expect(s.answers).toEqual([3]);
    expect(isAnswered(s)).toBe(true);
    expect(answer(s, 0)).toBe(s);
    s = nextQuestion(s);
    expect(s).toMatchObject({ phase: 'test', index: 1 });
    const end = play(round(12), () => 0);
    expect(end).toMatchObject({ phase: 'finished', index: 12 });
    expect(end.answers).toHaveLength(12);
    expect(isAnswered(end)).toBe(false);
    expect(answer(end, 0)).toBe(end);
    expect(nextQuestion(end)).toBe(end);
    expect(answer(round(12), 0).answers).toEqual([]);
  });

  it('shows a hint only for a person with a note or chosen feature, before answering, once', () => {
    let s = round(21);
    const test0 = toTest(s);
    expect(hasHint(test0)).toBe(false);
    expect(showHint(test0)).toBe(test0);
    const person = (test0.questions[0] as Question).person;
    while (s.index !== person) s = nextPerson(s);
    s = setNote(s, '  ');
    expect(hasHint(toTest(s))).toBe(false);
    s = setNote(s, 'my link');
    let t = toTest(s);
    expect(hasHint(t)).toBe(true);
    expect(hasHint(t, 999)).toBe(false);
    t = showHint(t);
    expect(t.hints[0]).toBe(true);
    expect(showHint(t)).toBe(t);
    const answered = answer(toTest(s), 0);
    expect(showHint(answered)).toBe(answered);
    expect(showHint(s)).toBe(s);
    // A chosen feature alone also counts.
    let u = round(21);
    while (u.index !== person) u = nextPerson(u);
    u = toggleStandout(u, standoutOptions(u.people, person)[0] as Feature);
    expect(hasHint(toTest(u))).toBe(true);
  });

  it('scores against an independent oracle and counts hints', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.nat(), { minLength: 24, maxLength: 24 }), (seed, difficulty, picks) => {
        const end = play(round(seed, difficulty), (q, i) => (picks[i] as number) % q.options.length);
        const r = score(end);
        let expected = 0;
        end.answers.forEach((a, i) => {
          if (a === oracleAnswer(end, end.questions[i] as Question)) expected++;
        });
        expect(r).toEqual({ answered: end.questions.length, correct: expected, total: end.questions.length, hints: 0 });
        end.answers.forEach((_, i) => expect(isCorrect(end, i)).toBe(end.answers[i] === oracleAnswer(end, end.questions[i] as Question)));
      }),
      { numRuns: 80 }
    );
  });

  it('reports results per person and type', () => {
    const allRight = play(round(30, 'medium'), (q) => oracleAnswer(round(30, 'medium'), q));
    expect(score(allRight).correct).toBe(18);
    for (const r of resultsByPerson(allRight)) expect(r).toEqual({ results: { name: true, face: true, job: true }, hints: 0 });
    const s = round(30, 'medium');
    const allWrong = play(s, (q) => (oracleAnswer(s, q) + 1) % q.options.length);
    expect(score(allWrong).correct).toBe(0);
    for (const r of resultsByPerson(allWrong)) expect(r.results).toEqual({ name: false, face: false, job: false });
    const partial = answer(toTest(s), oracleAnswer(s, s.questions[0] as Question));
    const byPerson = resultsByPerson(partial);
    expect(byPerson[(s.questions[0] as Question).person]?.results).toEqual({ [(s.questions[0] as Question).type]: true });
    expect(isCorrect(partial, 1)).toBe(false);
    expect(isCorrect(partial, 99)).toBe(false);
  });

  it('counts hint use per person', () => {
    let s = round(21);
    for (let i = 0; i < s.people.length; i++) {
      s = setNote(s, `note ${i}`);
      s = nextPerson(s);
    }
    let hints = 0;
    while (s.phase === 'test') {
      if (s.index % 2 === 0) {
        s = showHint(s);
        hints++;
      }
      s = nextQuestion(answer(s, 0));
    }
    expect(score(s).hints).toBe(hints);
    expect(resultsByPerson(s).reduce((a, r) => a + r.hints, 0)).toBe(hints);
    expect(isValidFacesNamesState(clone(s))).toBe(true);
  });
});

describe('isValidFacesNamesState', () => {
  /** A mid-test state with notes, a feature, a hint and answers. */
  function midTest(): FacesNamesState {
    let s = toggleStandout(round(77, 'medium'), standoutOptions(round(77, 'medium').people, 0)[0] as Feature);
    for (let i = 0; i < s.people.length; i++) s = nextPerson(setNote(s, `link ${i}`));
    for (let i = 0; i < 4; i++) {
      if (hasHint(s)) s = showHint(s);
      s = nextQuestion(answer(s, i % 3));
    }
    return answer(s, 1);
  }

  it('accepts states reached by any sequence of actions (and their JSON copies)', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.nat()), { maxLength: 80 }), (seed, difficulty, actions) => {
        let s = round(seed, difficulty);
        for (const [kind, n] of actions) {
          if (kind === 0) s = nextPerson(s);
          else if (kind === 1) s = previousPerson(s);
          else if (kind === 2) s = setNote(s, `n${n}`);
          else if (kind === 3) s = s.phase === 'study' ? toggleStandout(s, standoutOptions(s.people, s.index)[n % 2] as Feature) : s;
          else if (kind === 4) s = showHint(s);
          else if (kind === 5) s = answer(s, n % 7);
          else s = nextQuestion(s);
          expect(isValidFacesNamesState(clone(s))).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('accepts mid-study, mid-test (answered and unanswered) and finished states', () => {
    expect(isValidFacesNamesState(clone(nextPerson(round(5))))).toBe(true);
    const m = midTest();
    expect(isAnswered(m)).toBe(true);
    expect(m.hints.some(Boolean)).toBe(true);
    expect(isValidFacesNamesState(clone(m))).toBe(true);
    expect(isValidFacesNamesState(clone(nextQuestion(m)))).toBe(true);
    expect(isValidFacesNamesState(clone(play(round(5, 'hard'), () => 2)))).toBe(true);
  });

  const mutations: [string, (s: FacesNamesState) => void][] = [
    ['negative seed', (s) => void (s.seed = -1)],
    ['unknown difficulty', (s) => void ((s as { difficulty: string }).difficulty = 'extreme')],
    ['unknown phase', (s) => void ((s as { phase: string }).phase = 'recall')],
    ['missing person', (s) => void s.people.pop()],
    ['duplicate name', (s) => void ((s.people[1] as Person).name = (s.people[0] as Person).name)],
    ['name with line break', (s) => void ((s.people[0] as Person).name = 'An\nna')],
    ['empty name', (s) => void ((s.people[0] as Person).name = '')],
    ['duplicate job', (s) => void ((s.people[1] as Person).job = (s.people[0] as Person).job)],
    ['unknown job', (s) => void ((s.people[0] as { job: string }).job = 'astronaut')],
    ['unknown context', (s) => void ((s.people[0] as { context: string }).context = 'moon')],
    ['age too low', (s) => void ((s.people[0] as Person).age = MIN_AGE - 1)],
    ['age not an integer', (s) => void ((s.people[0] as Person).age = 30.5)],
    ['unknown hair', (s) => void ((s.people[0] as Person).face.hair = 'mohawk' as Face['hair'])],
    ['unknown hair colour', (s) => void ((s.people[0] as Person).face.hairColour = 'green' as Face['hairColour'])],
    ['skin out of range', (s) => void ((s.people[0] as Person).face.skin = SKIN_TONES)],
    ['shirt out of range', (s) => void ((s.people[0] as Person).face.shirt = -1)],
    ['missing face', (s) => void delete (s.people[0] as Partial<Person>).face],
    ['headscarf with beard', (s) => void Object.assign((s.people[0] as Person).face, { hair: 'headscarf', facialHair: 'beard' })],
    ['grey hair too young', (s) => {
      (s.people[0] as Person).age = MIN_AGE;
      (s.people[0] as Person).face.hairColour = 'grey';
    }],
    ['faces too similar', (s) => void ((s.people[1] as Person).face = { ...(s.people[0] as Person).face, glasses: (s.people[0] as Person).face.glasses === 'none' ? 'round' : 'none' })],
    ['standout not offered', (s) => void (s.standout[0] = FEATURES.find((f) => !standoutOptions(s.people, 0).includes(f)) as Feature)],
    ['standout unknown', (s) => void ((s.standout as unknown[])[0] = 'aura')],
    ['standout wrong length', (s) => void s.standout.push(null)],
    ['note too long', (s) => void (s.notes[0] = 'x'.repeat(NOTE_MAX + 1))],
    ['note with control char', (s) => void (s.notes[0] = 'a\tb')],
    ['note not a string', (s) => void ((s.notes as unknown[])[0] = 5)],
    ['question missing', (s) => void s.questions.pop()],
    ['question duplicated', (s) => void (s.questions[1] = clone(s.questions[0] as Question))],
    ['question unknown type', (s) => void ((s.questions[0] as { type: string }).type = 'age')],
    ['question person out of range', (s) => void ((s.questions[0] as Question).person = 99)],
    ['options without the answer', (s) => {
      const q = s.questions.find((x) => x.type !== 'job') as Question & { options: number[] };
      q.options = q.options.map((o) => (o === q.person ? (s.people.length - 1 === q.person ? 0 : s.people.length - 1) : o));
    }],
    ['options with duplicates', (s) => {
      const q = s.questions[0] as Question;
      (q.options as unknown[])[1] = q.options[0];
    }],
    ['too few options', (s) => void (s.questions[0] as Question).options.pop()],
    ['unknown job option', (s) => {
      const q = s.questions.find((x) => x.type === 'job') as Question;
      const i = q.options.findIndex((o) => o !== s.people[q.person]?.job);
      (q.options as unknown[])[i] = 'astronaut';
    }],
    ['person option out of range', (s) => {
      const q = s.questions.find((x) => x.type !== 'job') as Question;
      const i = q.options.findIndex((o) => o !== q.person);
      (q.options as unknown[])[i] = 42;
    }],
    ['answer out of range', (s) => void (s.answers[0] = 9)],
    ['answer not an integer', (s) => void (s.answers[0] = 0.5)],
    ['answers ahead of index', (s) => void s.answers.push(0)],
    ['answers behind index', (s) => void (s.index += 2)],
    ['hints wrong length', (s) => void s.hints.pop()],
    ['hint in the future', (s) => void (s.hints[s.index + 3] = true)],
    ['hint not boolean', (s) => void ((s.hints as unknown[])[0] = 1)],
    ['hint without note', (s) => {
      s.notes = s.notes.map(() => '');
      s.standout = s.standout.map(() => null);
    }],
    ['index out of range', (s) => void (s.index = -1)],
    ['finished too early', (s) => void ((s as { phase: string }).phase = 'finished')],
    ['back in study with answers', (s) => void ((s as { phase: string }).phase = 'study')]
  ];

  it.each(mutations)('rejects a save with %s', (_, mutate) => {
    const s = clone(midTest());
    expect(isValidFacesNamesState(s)).toBe(true);
    mutate(s);
    expect(isValidFacesNamesState(s)).toBe(false);
  });

  it('rejects inconsistent study and finished states', () => {
    const study = clone(nextPerson(round(5)));
    study.index = study.people.length;
    expect(isValidFacesNamesState(study)).toBe(false);
    const hinted = clone(setNote(round(5), 'n'));
    hinted.hints[0] = true;
    expect(isValidFacesNamesState(hinted)).toBe(false);
    const done = clone(play(round(5), () => 0));
    expect(isValidFacesNamesState(done)).toBe(true);
    done.index = done.questions.length - 1;
    expect(isValidFacesNamesState(done)).toBe(false);
    const short = clone(play(round(5), () => 0));
    short.answers.pop();
    expect(isValidFacesNamesState(short)).toBe(false);
  });

  it('never throws on junk', () => {
    for (const junk of [null, undefined, 0, 'x', [], {}, { people: 'x' }, { seed: 1, difficulty: 'easy', phase: 'study', people: [null] }]) {
      expect(isValidFacesNamesState(junk)).toBe(false);
    }
    const s = midTest();
    const hostile = clone(s) as unknown as Record<string, unknown>;
    hostile.questions = [{ type: 'job', person: 0, options: { length: 5 } }];
    expect(() => isValidFacesNamesState(hostile)).not.toThrow();
    expect(isValidFacesNamesState(hostile)).toBe(false);
    const getter = clone(s) as unknown as Record<string, unknown>;
    Object.defineProperty(getter, 'answers', {
      get() {
        throw new Error('boom');
      },
      enumerable: true
    });
    expect(isValidFacesNamesState(getter)).toBe(false);
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidFacesNamesState(v)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});
