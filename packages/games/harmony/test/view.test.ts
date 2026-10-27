// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { GameContext } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import { preloadContent } from '../src/content';
import { LEVELS, QUIZ_TOPICS, SENSES } from '../src/levels';
import { metadata } from '../src/metadata';
import { isHarmonyState, type HarmonyState, type KeyboardState, type QuizState } from '../src/rules';
import { answerIndex, type ChoiceSpec } from '../src/spec';
import { midiOf } from '../src/spelling';
import { SEMITONES } from '../src/theory';
import { createHarmony } from '../src/view';
import { FakeContext } from './fake-audio';

const win = window as unknown as Record<string, unknown>;

beforeAll(async () => {
  for (const l of ['en', 'de', 'ar', 'ja'] as const) await preloadContent(l);
});
beforeEach(() => FakeContext.reset());
afterEach(() => {
  delete win.AudioContext;
  document.body.innerHTML = '';
});

function mount(locale: SupportedLocale = 'en', prefs = new Map<string, unknown>()) {
  const root = document.createElement('div');
  document.body.append(root);
  const saves: number[] = [];
  const finished: unknown[] = [];
  const missing: string[] = [];
  const context = {
    root,
    t: createTranslator({ locale, sources: [metadata.messages, COMMON_MESSAGES], onMissing: (k) => missing.push(k) }),
    reducedMotion: true,
    requestSave: () => saves.push(1),
    finished: (r: unknown) => finished.push(r),
    preferences: { get: (k: string) => prefs.get(k), set: (k: string, v: unknown) => prefs.set(k, v) }
  } as unknown as GameContext;
  const game = createHarmony(context);
  return { root, game, saves, finished, missing, prefs };
}

const q = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const choose = (root: HTMLElement, i: number) => {
  const input = q(root, `hm-opt-${i}`) as HTMLInputElement;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('view (design § 15–16, § 20.3)', () => {
  it('renders every topic × senses × level in en, de, ar and ja without missing texts', () => {
    for (const locale of ['en', 'de', 'ar', 'ja'] as const) {
      for (const topic of [...QUIZ_TOPICS, 'keyboard'] as const)
        for (const senses of SENSES)
          for (const difficulty of LEVELS) {
            const { root, game, missing } = mount(locale);
            game.newGame({ seed: 11, difficulty, settings: { topic, senses } });
            expect(missing, `${locale} ${topic} ${senses} ${difficulty}`).toEqual([]);
            expect(root.querySelector('.wp-harmony')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
            for (const el of root.querySelectorAll('.hm-staff, .hm-piano, .hm-grid, .hm-wave-fig, .hm-piano-wrap')) expect(el.getAttribute('dir'), `${topic}`).toBe('ltr');
            expect(isHarmonyState(game.serialize())).toBe(true);
            game.dispose();
          }
    }
  });

  it('by ear: no notes in the DOM before Check; Play does not name the notes', () => {
    win.AudioContext = FakeContext;
    const { root, game } = mount();
    game.newGame({ seed: 5, difficulty: 'easy', settings: { topic: 'intervals', senses: 'ear' } });
    expect(q(root, 'hm-staff')).toBeNull();
    expect(q(root, 'hm-keys')).toBeNull();
    expect(q(root, 'hm-play')!.textContent).toBe('Play');
    expect(root.textContent).not.toMatch(/[A-G][♯♭]?\d/);
    choose(root, 0);
    expect(q(root, 'hm-staff')).toBeNull();
    q(root, 'hm-check')!.click();
    expect(q(root, 'hm-staff')).not.toBeNull();
    expect(q(root, 'hm-verdict')).not.toBeNull();
    expect(q(root, 'hm-keys')).not.toBeNull();
  });

  it('without Web Audio, a by-ear question shows its picture with a notice and no Play buttons', () => {
    const { root, game } = mount();
    game.newGame({ seed: 5, difficulty: 'medium', settings: { topic: 'chords', senses: 'ear' } });
    expect(q(root, 'hm-no-sound')).not.toBeNull();
    expect(q(root, 'hm-staff')).not.toBeNull();
    expect(q(root, 'hm-play')).toBeNull();
    expect(q(root, 'hm-sound-status')!.textContent).toContain('not available');
    expect((game.serialize() as QuizState).items[0]!.peeked).toBe('no-sound');
  });

  it('constructs no AudioContext on render, newGame or restore; the first Play does, and resumes it', () => {
    win.AudioContext = FakeContext;
    const { root, game } = mount();
    game.newGame({ seed: 3, settings: { topic: 'melody', senses: 'ear' } });
    const saved = game.serialize();
    game.restore(saved);
    expect(FakeContext.instances).toHaveLength(0);
    q(root, 'hm-play')!.click();
    expect(FakeContext.instances).toHaveLength(1);
    expect(FakeContext.instances[0]!.resumes).toBe(1);
    expect(FakeContext.instances[0]!.oscillators().length).toBeGreaterThan(0);
    expect(q(root, 'hm-play')!.textContent).toBe('Stop');
  });

  it('muted: Play buttons are gone and nothing is constructed; mute is remembered per device', () => {
    win.AudioContext = FakeContext;
    const prefs = new Map<string, unknown>();
    const { root, game } = mount('en', prefs);
    game.newGame({ seed: 3, settings: { topic: 'intervals' } });
    q(root, 'hm-mute')!.click();
    expect(prefs.get('muted')).toBe(true);
    expect(q(root, 'hm-play')).toBeNull();
    expect(q(root, 'hm-mute')!.getAttribute('aria-pressed')).toBe('false');
    expect(q(root, 'hm-mute')!.textContent).toBe('Sound off');
    const again = mount('en', prefs);
    again.game.newGame({ seed: 3, settings: { topic: 'build', difficulty: 'easy' } });
    (again.root.querySelector('.hm-key:not([aria-disabled])') as HTMLElement).click();
    expect(FakeContext.instances).toHaveLength(0);
  });

  it('validates preferences (junk → defaults)', () => {
    win.AudioContext = FakeContext;
    const prefs = new Map<string, unknown>([['volume', 'loud'], ['names', 'klingon'], ['keys', 7], ['muted', 'yes']]);
    const { root, game } = mount('en', prefs);
    game.newGame({ seed: 1, settings: { topic: 'build' }, difficulty: 'medium' });
    expect((q(root, 'hm-volume') as HTMLInputElement).value).toBe('50');
    expect((q(root, 'hm-pref-names') as HTMLSelectElement).value).toBe('auto');
    expect(root.querySelector('.hm-piano--piano')).not.toBeNull();
    expect(q(root, 'hm-play-held')).toBeNull();
  });

  it('keys have spoken names; German shows H and B; the note-buttons alternative', () => {
    const { root, game } = mount('de');
    game.newGame({ seed: 2, settings: { topic: 'keyboard' } });
    const b = q(root, 'hm-key-71')!;
    const bes = q(root, 'hm-key-70')!;
    expect(b.textContent).toContain('H');
    expect(b.getAttribute('aria-label')).toBe('H 4');
    expect(bes.getAttribute('aria-label')).toBe('B 4');
    expect(q(root, 'hm-key-61')!.getAttribute('aria-label')).toBe('Des 4');
    const select = q(root, 'hm-pref-keys') as HTMLSelectElement;
    select.value = 'buttons';
    select.dispatchEvent(new Event('change'));
    expect(root.querySelector('.hm-piano--buttons')).not.toBeNull();
    expect(root.querySelectorAll('.hm-piano--buttons .hm-key').length).toBe(24);
  });

  it('builds a chord by keyboard only and marks the review with ✓', () => {
    win.AudioContext = FakeContext;
    const { root, game } = mount();
    game.newGame({ seed: 8, difficulty: 'medium', settings: { topic: 'build' } });
    const state = game.serialize() as QuizState;
    const spec = state.items[0]!.spec as Extract<ChoiceSpec | QuizState['items'][number]['spec'], { k: 'build' }>;
    const root0 = midiOf(spec.root);
    const want = (spec.task === 'chord' ? ({ maj: [4, 7], min: [3, 7], dim: [3, 6], aug: [4, 8] } as Record<string, number[]>)[spec.target]! : []).map((d) => root0 + d);
    for (const m of want) {
      const key = q(root, `hm-key-${m}`)!;
      key.focus();
      key.click(); // Space/Enter on a focused button fires click
    }
    expect((game.serialize() as QuizState).items[0]!.draft).toEqual({ keys: want });
    expect(document.activeElement?.getAttribute('data-midi')).toBe(String(want.at(-1)));
    q(root, 'hm-check')!.click();
    expect(q(root, 'hm-verdict')!.dataset.matched).toBe('true');
    expect(q(root, `hm-key-${want[0]}`)!.getAttribute('aria-label')).toContain('belongs');
  });

  it('arrow keys move along the piano and letter keys play by position', () => {
    win.AudioContext = FakeContext;
    const { root, game } = mount();
    game.newGame({ seed: 8, settings: { topic: 'keyboard' } });
    const c4 = q(root, 'hm-key-60')!;
    c4.focus();
    c4.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement?.getAttribute('data-midi')).toBe('61');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement?.getAttribute('data-midi')).toBe('73');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true }));
    expect((game.serialize() as KeyboardState).held).toEqual([64]);
    expect(FakeContext.instances).toHaveLength(1);
  });

  it('free keyboard names a held C major chord and switches to pure tuning', () => {
    const { root, game } = mount();
    game.newGame({ seed: 1, settings: { topic: 'keyboard' } });
    for (const m of [60, 64, 67]) q(root, `hm-key-${m}`)!.click();
    expect(q(root, 'hm-free-name')!.textContent).toBe('C major chord, root position');
    expect(q(root, 'hm-wave-caption')!.textContent).toContain('4 waves');
    (q(root, 'hm-tuning-just') as HTMLInputElement).click();
    expect((game.serialize() as KeyboardState).tuning).toBe('just');
    for (const m of [64, 67]) q(root, `hm-key-${m}`)!.click();
    q(root, 'hm-key-67')!.click();
    expect(q(root, 'hm-free-name')!.textContent).toBe('perfect fifth (7 semitones)');
  });

  it('a whole round by eye ends in a summary with mix-ups and finishes once', () => {
    const { root, game, finished } = mount();
    game.newGame({ seed: 4, difficulty: 'easy', settings: { topic: 'intervals', senses: 'eye' } });
    for (let i = 0; i < 10; i++) {
      const s = game.serialize() as QuizState;
      const right = answerIndex(s.items[i]!.spec as ChoiceSpec);
      choose(root, i % 2 ? right : (right + 1) % 4);
      q(root, 'hm-check')!.click();
      expect(document.activeElement?.id).toBe('hm-review-heading');
      q(root, i < 9 ? 'hm-next' : 'hm-summary-btn')!.click();
    }
    expect(q(root, 'hm-summary')).not.toBeNull();
    expect(q(root, 'hm-summary-matched')!.textContent).toBe('Matched: 5 of 10');
    expect(q(root, 'hm-mixups')!.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(finished).toEqual([{ outcome: 'completed', stats: { matched: 5, asked: 10 } }]);
    game.restore(game.serialize());
    expect(finished).toHaveLength(1);
  });

  it('a wrong answer shows the tip, the ratio and "Listen: yours / the answer"', () => {
    win.AudioContext = FakeContext;
    const { root, game } = mount();
    game.newGame({ seed: 4, difficulty: 'medium', settings: { topic: 'intervals', senses: 'ear' } });
    const s = game.serialize() as QuizState;
    const spec = s.items[0]!.spec as Extract<ChoiceSpec, { k: 'interval' }>;
    const right = answerIndex(spec);
    choose(root, (right + 1) % 8);
    q(root, 'hm-check')!.click();
    expect(q(root, 'hm-tip')!.textContent).toContain(`${SEMITONES[spec.ivl]}`);
    expect(q(root, 'hm-ratio')).not.toBeNull();
    expect(q(root, 'hm-yours')).not.toBeNull();
    q(root, 'hm-answer')!.click();
    expect(FakeContext.instances).toHaveLength(1);
  });

  it('number keys choose an option and Enter on an option checks', () => {
    const { root, game } = mount();
    game.newGame({ seed: 4, difficulty: 'easy', settings: { topic: 'chords', senses: 'eye' } });
    q(root, 'hm-opt-0')!.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
    expect((game.serialize() as QuizState).items[0]!.draft).toEqual({ choice: 1 });
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect((game.serialize() as QuizState).items[0]!.answer).toEqual({ choice: 1 });
  });

  it('pause blocks input; reset restarts the same round', () => {
    const { root, game } = mount();
    game.newGame({ seed: 9, settings: { topic: 'rhythm', senses: 'eye' }, difficulty: 'hard' });
    const start = game.serialize() as HarmonyState;
    game.pause();
    choose(root, 1);
    expect(game.serialize()).toEqual(start);
    game.resume();
    choose(root, 1);
    expect((game.serialize() as QuizState).items[0]!.draft).toEqual({ choice: 1 });
    game.reset();
    expect(game.serialize()).toEqual(start);
  });
});
