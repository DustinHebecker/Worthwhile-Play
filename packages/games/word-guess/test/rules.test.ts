import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CONFIGS,
  DIFFICULTIES,
  answerOf,
  configOf,
  createInitialState,
  deleteLetter,
  historyOf,
  isDifficulty,
  isWordGuessState,
  letterStatus,
  optionsOf,
  pickAnswer,
  restart,
  scoreGuess,
  setLanguage,
  setLayout,
  setStrict,
  statusOf,
  strictViolation,
  submitGuess,
  toDifficulty,
  typeLetter,
  type Mark,
  type WordGuessState
} from '../src/rules';
import { LANGUAGE_INFO, WORD_LANGUAGES, WORD_LENGTHS, defaultLanguage, isLetter, isWordLanguage, wordList } from '../src/words';

const typeWord = (state: WordGuessState, word: string) => [...word].reduce(typeLetter, state);
const play = (state: WordGuessState, word: string) => submitGuess(typeWord(state, word)).state;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** A guess of the right length that is certainly not the answer. */
const wrongWord = (state: WordGuessState, letter = 'q') => {
  const word = letter.repeat(configOf(state).length);
  return word === answerOf(state) ? 'z'.repeat(word.length) : word;
};

/**
 * Independent oracle for letter feedback: position i is a hit if letters match; otherwise it is
 * "near" iff the answer has more unmatched copies of that letter than there are earlier unmatched
 * copies of it in the guess.
 */
function oracle(guess: string, answer: string): Mark[] {
  const g = [...guess];
  const a = [...answer];
  return g.map((letter, i) => {
    if (letter === a[i]) return 'hit';
    const unmatchedInAnswer = a.filter((x, j) => x === letter && g[j] !== x).length;
    const earlierUnmatchedInGuess = g.slice(0, i).filter((x, j) => x === letter && a[j] !== x).length;
    return unmatchedInAnswer > earlierUnmatchedInGuess ? 'near' : 'miss';
  });
}

describe('word lists', () => {
  it('provide enough distinct, lowercase words of the exact length in each language alphabet', () => {
    for (const language of WORD_LANGUAGES) {
      const { alphabet } = LANGUAGE_INFO[language];
      for (const length of WORD_LENGTHS) {
        const list = wordList(language, length);
        expect(list.length, `${language}/${length}`).toBeGreaterThanOrEqual(length === 5 ? 400 : 300);
        expect(new Set(list).size, `duplicates in ${language}/${length}`).toBe(list.length);
        for (const word of list) {
          expect(word, `${language}/${length}`).toHaveLength(length);
          expect(word).toBe(word.toLocaleLowerCase(language));
          expect(word).toBe(word.normalize('NFC'));
          expect([...word].every((c) => alphabet.includes(c)), `${word} uses letters outside the ${language} alphabet`).toBe(true);
        }
      }
    }
  });

  it('exclude ß from German and keep English to a–z', () => {
    for (const length of WORD_LENGTHS) {
      expect(wordList('de', length).some((w) => w.includes('ß'))).toBe(false);
      expect(wordList('en', length).every((w) => /^[a-z]+$/.test(w))).toBe(true);
    }
    // Umlauts are real letters of the German lists.
    expect(wordList('de', 5).some((w) => /[äöü]/.test(w))).toBe(true);
  });

  it('describe consistent keyboards: every alphabet letter appears exactly once in the familiar layout', () => {
    for (const language of WORD_LANGUAGES) {
      const { alphabet, layout } = LANGUAGE_INFO[language];
      expect([...layout.join('')].sort()).toEqual([...alphabet].sort());
    }
    expect(LANGUAGE_INFO.de.layout[0]).toBe('qwertzuiopü');
  });

  it('names each language natively and keeps Latin words left-to-right', () => {
    expect(WORD_LANGUAGES.map((id) => [LANGUAGE_INFO[id].id, LANGUAGE_INFO[id].nativeName, LANGUAGE_INFO[id].direction])).toEqual([
      ['en', 'English', 'ltr'],
      ['de', 'Deutsch', 'ltr']
    ]);
  });

  it('recognises letters per language', () => {
    expect(isLetter('de', 'ä')).toBe(true);
    expect(isLetter('en', 'ä')).toBe(false);
    expect(isLetter('en', 'a')).toBe(true);
    expect(isLetter('en', 'ab')).toBe(false);
    expect(isLetter('en', '')).toBe(false);
    expect(isLetter('en', 'A')).toBe(false);
    expect(isLetter('de', 'ß')).toBe(false);
  });

  it('defaults the word language to the UI language when supported, else English', () => {
    expect(defaultLanguage('de')).toBe('de');
    expect(defaultLanguage('en')).toBe('en');
    expect(defaultLanguage('DE-at')).toBe('de');
    expect(defaultLanguage('fr')).toBe('en');
    expect(defaultLanguage('zh-Hans')).toBe('en');
    expect(isWordLanguage('de')).toBe(true);
    expect(isWordLanguage('fr')).toBe(false);
    expect(isWordLanguage(5)).toBe(false);
  });
});

describe('answer choice', () => {
  it('is deterministic per seed, language and length and stays in range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom(...WORD_LANGUAGES), fc.constantFrom(...WORD_LENGTHS), (seed, language, length) => {
        const index = pickAnswer(seed, language, length);
        expect(pickAnswer(seed, language, length)).toBe(index);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(wordList(language, length).length);
      })
    );
  });

  it('varies across seeds and never leaves the list', () => {
    const indices = new Set<number>();
    for (let seed = 0; seed < 300; seed++) indices.add(pickAnswer(seed, 'en', 5));
    expect(indices.size).toBeGreaterThan(200);
    const size = wordList('de', 6).length;
    for (let seed = 0; seed < 4000; seed++) expect(pickAnswer(seed, 'de', 6)).toBeLessThan(size);
  });

  it('builds the initial state from seed, difficulty and options', () => {
    const state = createInitialState(42, 'hard', { language: 'de', strict: true, layout: 'large' });
    expect(state).toEqual({ seed: 42, difficulty: 'hard', language: 'de', strict: true, layout: 'large', answer: pickAnswer(42, 'de', 6), guesses: [], input: '' });
    expect(answerOf(state)).toHaveLength(6);
    expect(wordList('de', 6)).toContain(answerOf(state));
    expect(createInitialState(-1).seed).toBe(0xffff_ffff);
    expect(createInitialState(5.9).seed).toBe(5);
    expect(createInitialState(1)).toMatchObject({ difficulty: 'easy', language: 'en', strict: false, layout: 'familiar' });
  });

  it('maps difficulties to honest word lengths and try counts', () => {
    expect(CONFIGS).toEqual({ easy: { length: 5, tries: 7 }, medium: { length: 5, tries: 6 }, hard: { length: 6, tries: 6 } });
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(toDifficulty('nightmare')).toBe('easy');
    expect(isDifficulty('easy')).toBe(true);
    expect(isDifficulty('Easy')).toBe(false);
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('scoreGuess', () => {
  it('marks exact matches, misplaced letters and absent letters', () => {
    expect(scoreGuess('crane', 'crane')).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
    expect(scoreGuess('speed', 'abide')).toEqual(['miss', 'miss', 'near', 'miss', 'near']);
    expect(scoreGuess('xxxxx', 'abcde')).toEqual(['miss', 'miss', 'miss', 'miss', 'miss']);
  });

  it('handles repeated letters with the two-pass rule', () => {
    // Exact matches consume copies first, even when they come later in the word.
    expect(scoreGuess('lllll', 'hello')).toEqual(['miss', 'miss', 'hit', 'hit', 'miss']);
    expect(scoreGuess('olleh', 'hello')).toEqual(['near', 'near', 'hit', 'near', 'near']);
    expect(scoreGuess('bobby', 'abbey')).toEqual(['near', 'miss', 'hit', 'miss', 'hit']);
    // Only as many "near" marks as there are unmatched copies, assigned left to right.
    expect(scoreGuess('eexxx', 'abcde')).toEqual(['near', 'miss', 'miss', 'miss', 'miss']);
    expect(scoreGuess('xeexe', 'eabce')).toEqual(['miss', 'near', 'miss', 'miss', 'hit']);
  });

  it('treats umlauts as letters of their own', () => {
    expect(scoreGuess('kuste', 'küste')).toEqual(['hit', 'miss', 'hit', 'hit', 'hit']);
    expect(scoreGuess('übers', 'hütte')).toEqual(['near', 'miss', 'near', 'miss', 'miss']);
  });

  it('rejects guesses of a different length', () => {
    expect(() => scoreGuess('abc', 'abcd')).toThrow(RangeError);
  });

  it('agrees with an independent oracle on random words with many repeats', () => {
    const word = (n: number) => fc.array(fc.constantFrom('a', 'b', 'c', 'ä'), { minLength: n, maxLength: n }).map((l) => l.join(''));
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 7 }).chain((n) => fc.tuple(word(n), word(n))), ([guess, answer]) => {
        expect(scoreGuess(guess, answer)).toEqual(oracle(guess, answer));
      }),
      { numRuns: 2000 }
    );
  });

  it('satisfies counting invariants', () => {
    const word = fc.array(fc.constantFrom('a', 'b', 'c', 'd'), { minLength: 5, maxLength: 5 }).map((l) => l.join(''));
    fc.assert(
      fc.property(word, word, (guess, answer) => {
        const marks = scoreGuess(guess, answer);
        const count = (w: string, c: string) => [...w].filter((x) => x === c).length;
        for (const letter of new Set(guess)) {
          const marked = marks.filter((m, i) => m !== 'miss' && guess[i] === letter).length;
          expect(marked).toBe(Math.min(count(guess, letter), count(answer, letter)));
        }
        // Hits are symmetric; everything is a hit exactly when the words are equal.
        expect(scoreGuess(answer, guess).map((m) => m === 'hit')).toEqual(marks.map((m) => m === 'hit'));
        expect(marks.every((m) => m === 'hit')).toBe(guess === answer);
      }),
      { numRuns: 1000 }
    );
  });
});

describe('typing and submitting', () => {
  it('accepts only alphabet letters up to the word length', () => {
    let state = createInitialState(1);
    state = typeLetter(state, 'A');
    expect(state.input).toBe('a');
    expect(typeLetter(state, '1')).toBe(state);
    expect(typeLetter(state, 'ä')).toBe(state);
    expect(typeLetter(state, 'ab')).toBe(state);
    state = typeWord(state, 'bcdefg');
    expect(state.input).toBe('abcde');
    const de = typeLetter(createInitialState(1, 'easy', { language: 'de', strict: false, layout: 'familiar' }), 'Ä');
    expect(de.input).toBe('ä');
    // Decomposed input (a + combining diaeresis) is normalised.
    expect(typeLetter(createInitialState(1, 'easy', { language: 'de', strict: false, layout: 'familiar' }), 'ä').input).toBe('ä');
  });

  it('deletes the last letter and returns the same state when there is nothing to delete', () => {
    const empty = createInitialState(2);
    expect(deleteLetter(empty)).toBe(empty);
    const state = typeWord(empty, 'abc');
    expect(deleteLetter(state).input).toBe('ab');
    expect(state.input).toBe('abc');
  });

  it('refuses short guesses with the required length', () => {
    const state = typeWord(createInitialState(3, 'hard'), 'abcde');
    expect(submitGuess(state)).toEqual({ state, error: { kind: 'short', needed: 6 } });
  });

  it('accepts any letter string of the right length (no dictionary gate)', () => {
    const state = createInitialState(4);
    const next = play(state, 'qqqqq' === answerOf(state) ? 'zzzzz' : 'qqqqq');
    expect(next.guesses).toHaveLength(1);
    expect(next.input).toBe('');
    expect(statusOf(next)).toBe('playing');
    expect(state.guesses).toEqual([]);
  });

  it('wins when the answer is entered and then ignores further input', () => {
    const state = createInitialState(5, 'medium');
    const won = play(play(state, wrongWord(state)), answerOf(state));
    expect(statusOf(won)).toBe('won');
    expect(won.guesses).toHaveLength(2);
    expect(typeLetter(won, 'a')).toBe(won);
    expect(deleteLetter(won)).toBe(won);
    expect(submitGuess(won)).toEqual({ state: won, error: { kind: 'finished' } });
    expect(isWordGuessState(won)).toBe(true);
  });

  it('is lost after exactly the allowed number of wrong tries', () => {
    for (const difficulty of DIFFICULTIES) {
      let state = createInitialState(6, difficulty);
      const { tries } = configOf(state);
      for (let i = 0; i < tries - 1; i++) state = play(state, wrongWord(state));
      expect(statusOf(state)).toBe('playing');
      state = play(state, wrongWord(state));
      expect(statusOf(state), difficulty).toBe('lost');
      expect(state.guesses).toHaveLength(tries);
      expect(typeLetter(state, 'a')).toBe(state);
      expect(isWordGuessState(state)).toBe(true);
    }
  });

  it('a win on the last try counts as a win', () => {
    let state = createInitialState(8, 'medium');
    for (let i = 0; i < 5; i++) state = play(state, wrongWord(state));
    state = play(state, answerOf(state));
    expect(statusOf(state)).toBe('won');
  });

  it('reports history with marks and the best mark per letter', () => {
    const answer = 'crane';
    const base = { ...createInitialState(0), answer: wordList('en', 5).indexOf(answer) };
    const state = play(play(base, 'eerie'), 'cxxxe');
    expect(historyOf(state)).toEqual([
      { word: 'eerie', marks: ['miss', 'miss', 'near', 'miss', 'hit'] },
      { word: 'cxxxe', marks: ['hit', 'miss', 'miss', 'miss', 'hit'] }
    ]);
    const status = letterStatus(state);
    expect(status.get('e')).toBe('hit');
    expect(status.get('r')).toBe('near');
    expect(status.get('c')).toBe('hit');
    expect(status.get('i')).toBe('miss');
    expect(status.get('x')).toBe('miss');
    expect(status.has('a')).toBe(false);
    // A later near never downgrades a known hit.
    const later = play(play(base, 'cxxxx'), 'xcxxx');
    expect(letterStatus(later).get('c')).toBe('hit');
  });
});

describe('strict mode', () => {
  const crane = () => ({ ...createInitialState(0, 'easy', { language: 'en', strict: true, layout: 'familiar' }), answer: wordList('en', 5).indexOf('crane') });

  it('requires hits to stay in place', () => {
    const state = play(crane(), 'cxxxx');
    const attempt = typeWord(state, 'xcxxx');
    expect(submitGuess(attempt)).toEqual({ state: attempt, error: { kind: 'strict-position', position: 0, letter: 'c' } });
    expect(submitGuess(typeWord(state, 'cyyyy')).error).toBeUndefined();
  });

  it('requires revealed letters to be reused as often as revealed', () => {
    const state = play(crane(), 'rxxxx');
    expect(submitGuess(typeWord(state, 'xxxxx')).error).toEqual({ kind: 'strict-contains', letter: 'r' });
    expect(submitGuess(typeWord(state, 'xxxxr')).error).toBeUndefined();
  });

  it('checks positions before letters and only applies when enabled', () => {
    const history = [{ word: 'cxrxx', marks: ['hit', 'miss', 'near', 'miss', 'miss'] as Mark[] }];
    expect(strictViolation(history, 'xxxxx')).toEqual({ kind: 'strict-position', position: 0, letter: 'c' });
    expect(strictViolation(history, 'cxxxx')).toEqual({ kind: 'strict-contains', letter: 'r' });
    expect(strictViolation(history, 'crxxx')).toBeUndefined();
    expect(strictViolation([{ word: 'aaxxx', marks: ['near', 'near', 'miss', 'miss', 'miss'] }], 'xxxxa')).toEqual({ kind: 'strict-contains', letter: 'a' });
    expect(strictViolation([{ word: 'aaxxx', marks: ['near', 'near', 'miss', 'miss', 'miss'] }], 'xxxaa')).toBeUndefined();
    expect(strictViolation([], 'abcde')).toBeUndefined();
    const relaxed = play({ ...crane(), strict: false }, 'cxxxx');
    expect(submitGuess(typeWord(relaxed, 'xxxxx')).error).toBeUndefined();
  });

  it('never rejects the answer itself', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), fc.array(fc.constantFrom(...'abcdeilnorst'), { minLength: 5, maxLength: 5 }), (seed, letters) => {
        let state = createInitialState(seed, 'easy', { language: 'en', strict: true, layout: 'familiar' });
        const first = letters.join('');
        state = play(state, first === answerOf(state) ? wrongWord(state) : first);
        const result = submitGuess(typeWord(state, answerOf(state)));
        expect(result.error).toBeUndefined();
        expect(statusOf(result.state)).toBe('won');
      }),
      { numRuns: 200 }
    );
  });
});

describe('options', () => {
  it('switching the word language restarts the game number in that language', () => {
    const state = typeWord(play(createInitialState(9), 'qqqqq'), 'ab');
    const de = setLanguage(state, 'de');
    expect(de).toEqual(createInitialState(9, 'easy', { language: 'de', strict: false, layout: 'familiar' }));
    expect(setLanguage(state, 'en')).toBe(state);
  });

  it('strict mode and layout change only their field', () => {
    const state = createInitialState(10);
    expect(setStrict(state, false)).toBe(state);
    expect(setStrict(state, true)).toEqual({ ...state, strict: true });
    expect(setLayout(state, 'familiar')).toBe(state);
    expect(setLayout(state, 'large')).toEqual({ ...state, layout: 'large' });
  });

  it('restart keeps seed, difficulty and options but clears progress', () => {
    const start = createInitialState(11, 'hard', { language: 'de', strict: true, layout: 'large' });
    const played = typeWord(play(start, 'qqqqqq'), 'ab');
    expect(restart(played)).toEqual(start);
    expect(optionsOf(played)).toEqual({ language: 'de', strict: true, layout: 'large' });
  });
});

describe('isWordGuessState', () => {
  it('accepts fresh states for every difficulty and language', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const language of WORD_LANGUAGES) {
        expect(isWordGuessState(createInitialState(123, difficulty, { language, strict: false, layout: 'large' }))).toBe(true);
      }
    }
  });

  it('rejects malformed or inconsistent data', () => {
    const base = typeWord(play(createInitialState(12), 'qqqqq'), 'ab');
    expect(isWordGuessState(base)).toBe(true);
    const bad: unknown[] = [
      null,
      [],
      'state',
      { ...base, seed: -1 },
      { ...base, seed: 1.5 },
      { ...base, seed: '12' },
      { ...base, difficulty: 'expert' },
      { ...base, language: 'fr' },
      { ...base, strict: 'yes' },
      { ...base, layout: 'dvorak' },
      { ...base, answer: base.answer + 1 },
      { ...base, answer: -1 },
      { ...base, answer: 1e9 },
      { ...base, guesses: 'qqqqq' },
      { ...base, guesses: ['qqqq'] },
      { ...base, guesses: ['qqqqqq'] },
      { ...base, guesses: ['QQQQQ'] },
      { ...base, guesses: ['qqqqä'] },
      { ...base, guesses: [12345] },
      { ...base, guesses: Array.from({ length: 8 }, () => 'qqqqq') },
      { ...base, input: 'abcdef' },
      { ...base, input: 'a1' },
      { ...base, input: 7 },
      { ...base, guesses: [answerOf(base), 'qqqqq'], input: '' },
      { ...base, guesses: [answerOf(base)], input: 'a' },
      { ...base, guesses: Array.from({ length: 7 }, () => 'qqqqq'), input: 'a' },
      (({ input: _input, ...rest }) => rest)(base)
    ];
    for (const value of bad) expect(isWordGuessState(value), JSON.stringify(value)).toBe(false);
    expect(isWordGuessState({ ...base, guesses: Array.from({ length: 7 }, () => 'qqqqq'), input: '' })).toBe(answerOf(base) !== 'qqqqq');
  });

  it('accepts German umlauts in German states only', () => {
    const de = typeWord(createInitialState(13, 'easy', { language: 'de', strict: false, layout: 'familiar' }), 'äöü');
    expect(isWordGuessState(de)).toBe(true);
    expect(isWordGuessState({ ...de, language: 'en', answer: pickAnswer(13, 'en', 5) })).toBe(false);
  });

  it('stays valid and JSON-stable through random play', () => {
    const action = fc.oneof(
      fc.constantFrom(...'abcdeilnorstäü').map((l) => ({ kind: 'type' as const, l })),
      fc.constant({ kind: 'delete' as const }),
      fc.constant({ kind: 'submit' as const }),
      fc.constantFrom(...WORD_LANGUAGES).map((l) => ({ kind: 'language' as const, l })),
      fc.boolean().map((b) => ({ kind: 'strict' as const, b }))
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom(...DIFFICULTIES), fc.array(action, { maxLength: 60 }), (seed, difficulty, actions) => {
        let state = createInitialState(seed, difficulty);
        for (const a of actions) {
          if (a.kind === 'type') state = typeLetter(state, a.l);
          else if (a.kind === 'delete') state = deleteLetter(state);
          else if (a.kind === 'submit') state = submitGuess(state).state;
          else if (a.kind === 'language') state = setLanguage(state, a.l);
          else state = setStrict(state, a.b);
          expect(isWordGuessState(state)).toBe(true);
          expect(state.guesses.length).toBeLessThanOrEqual(configOf(state).tries);
        }
        expect(clone(state)).toEqual(state);
      }),
      { numRuns: 150 }
    );
  });
});
