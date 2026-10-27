/**
 * The playable keyboard (design § 11.2): buttons in pitch order, always left to right (`dir="ltr"`, also in Arabic).
 * White keys ≥ 44 px wide, black keys 62 % as wide and ≥ 88 px tall; the "Note buttons" preference shows equal
 * 44 × 44 px buttons instead. Marks are symbols with words in each key's accessible name. Roving tabindex: ← → by
 * semitone, ↑ ↓ by octave, Home/End, Space/Enter presses; while the keyboard has focus, the letter keys A W S E D F T
 * G Y H U J K play by physical position (`KeyboardEvent.code`, the same on QWERTY, QWERTZ and AZERTY).
 */
import { h } from '@wp/ui';
import type { Env } from './env';
import { defaultSpelling, type Spelled } from './spelling';
import { pitchClass } from './theory';

export type KeyMark = 'given' | 'selected' | 'first' | 'second' | 'belongs' | 'notIn' | 'missing' | `scale${number}`;

export interface PianoOptions {
  readonly env: Env;
  /** Lowest and highest key that exist (C … B). */
  readonly low: number;
  readonly high: number;
  /** First visible key (a C) and the number of visible octaves. */
  readonly start: number;
  readonly octaves: number;
  readonly layout: 'piano' | 'buttons';
  readonly marks?: ReadonlyMap<number, readonly KeyMark[]>;
  /** Keys toggle (`aria-pressed`), as in build tasks and hold mode. */
  readonly toggle?: boolean;
  readonly disabled?: ReadonlySet<number>;
  /** Spelling of key labels (default: the usual spelling). */
  readonly spell?: (midi: number) => Spelled;
  readonly onPress: (midi: number) => void;
  /** Shows another range (the ◀ ▶ buttons, or arrow keys beyond the visible keys); `focus` is the key to focus. */
  readonly onShift?: (start: number, focus?: number) => void;
  /** The key that holds the roving tab stop (the view focuses it after a key press). */
  readonly focusMidi?: number | undefined;
  readonly testid?: string;
}

const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = (midi: number): boolean => BLACK.has(pitchClass(midi));

/** Physical key codes → semitones above the visible C (design § 11.2). */
export const KEY_CODES: Readonly<Record<string, number>> = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12
};

const MARK_GLYPH: Readonly<Record<string, string>> = { given: '●', selected: '●', first: '1', second: '2', belongs: '✓', notIn: '✗', missing: '○' };

function markWord(env: Env, m: KeyMark): string {
  if (m.startsWith('scale')) return env.t('mark.scale', { n: env.int(Number(m.slice(5))) });
  return env.t(`mark.${m}`);
}
const markGlyph = (env: Env, m: KeyMark) => (m.startsWith('scale') ? `•${env.int(Number(m.slice(5)))}` : MARK_GLYPH[m]!);

export function renderPiano(o: PianoOptions): HTMLElement {
  const { env } = o;
  const end = Math.min(o.high, o.start + 12 * o.octaves - 1);
  const keys: number[] = [];
  for (let m = o.start; m <= end; m++) keys.push(m);
  const spell = o.spell ?? defaultSpelling;
  const focusMidi = o.focusMidi !== undefined && o.focusMidi >= o.start && o.focusMidi <= end ? o.focusMidi : (keys.find((k) => o.marks?.get(k)?.length) ?? o.start);
  let pointerKey: number | null = null;

  const group = h('div', { class: `hm-piano hm-piano--${o.layout}`, role: 'group', 'aria-label': env.t('keys.name'), dir: 'ltr', ...(o.testid ? { 'data-testid': o.testid } : {}) });
  const whites = keys.filter((k) => !isBlack(k));
  const whiteW = 100 / whites.length;

  for (const midi of keys) {
    const marks = o.marks?.get(midi) ?? [];
    const s = spell(midi);
    const label = isBlack(midi) ? env.note(s) : pitchClass(midi) === 0 ? env.noteOct(s) : env.note(s);
    const words = marks.map((m) => markWord(env, m));
    const disabled = o.disabled?.has(midi) === true;
    const key = h(
      'button',
      {
        type: 'button',
        class: `hm-key ${isBlack(midi) ? 'hm-black' : 'hm-white'}${marks.length ? ' hm-marked' : ''}`,
        'data-midi': midi,
        'data-testid': `hm-key-${midi}`,
        tabindex: midi === focusMidi ? 0 : -1,
        'aria-label': [env.spoken(s), ...words].join(', '),
        ...(o.toggle ? { 'aria-pressed': marks.includes('selected') || marks.includes('given') ? 'true' : 'false' } : {}),
        ...(disabled ? { 'aria-disabled': 'true' } : {})
      },
      h('span', { class: 'hm-key-marks', 'aria-hidden': 'true' }, marks.map((m) => markGlyph(env, m)).join(' ')),
      h('bdi', { class: 'hm-key-name', 'aria-hidden': 'true' }, label)
    );
    if (o.layout === 'piano' && isBlack(midi)) {
      const before = whites.filter((w) => w < midi).length;
      key.style.left = `${before * whiteW - whiteW * 0.31}%`;
      key.style.width = `${whiteW * 0.62}%`;
    }
    const press = () => {
      if (!disabled) o.onPress(midi);
    };
    key.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      pointerKey = midi;
      press();
    });
    key.addEventListener('click', () => {
      // A pointer press already sounded on pointerdown; a click from Space/Enter or assistive technology presses now.
      if (pointerKey === midi) pointerKey = null;
      else press();
    });
    group.appendChild(key);
  }

  const focusKey = (midi: number) => {
    if (midi < o.low || midi > o.high) return;
    if (midi < o.start || midi > end) {
      o.onShift?.(Math.max(o.low, Math.min(o.high - 12 * o.octaves + 1, 12 * Math.floor(midi / 12))), midi);
      return;
    }
    for (const b of group.querySelectorAll<HTMLElement>('.hm-key')) b.tabIndex = -1;
    const target = group.querySelector<HTMLElement>(`[data-midi="${midi}"]`);
    if (target) {
      target.tabIndex = 0;
      target.focus();
    }
  };

  group.addEventListener('keydown', (e) => {
    const current = Number((document.activeElement as HTMLElement | null)?.dataset.midi);
    if (!Number.isFinite(current)) return;
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -12, ArrowUp: 12 };
    if (e.key in step) {
      e.preventDefault();
      focusKey(current + step[e.key]!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusKey(o.start);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusKey(end);
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.code in KEY_CODES) {
      const midi = o.start + KEY_CODES[e.code]!;
      if (midi <= o.high) {
        e.preventDefault();
        if (!o.disabled?.has(midi)) o.onPress(midi);
      }
    }
  });

  const wrap = h('div', { class: 'hm-piano-wrap', dir: 'ltr' });
  const canLower = o.start > o.low;
  const canHigher = end < o.high;
  if (o.onShift && (canLower || canHigher)) {
    const lower = h('button', { type: 'button', class: 'hm-shift', 'aria-label': env.t('keys.lower'), 'data-testid': 'hm-keys-lower', ...(canLower ? {} : { disabled: true }) }, '◀');
    const higher = h('button', { type: 'button', class: 'hm-shift', 'aria-label': env.t('keys.higher'), 'data-testid': 'hm-keys-higher', ...(canHigher ? {} : { disabled: true }) }, '▶');
    lower.addEventListener('click', () => o.onShift?.(o.start - 12));
    higher.addEventListener('click', () => o.onShift?.(o.start + 12));
    wrap.append(h('div', { class: 'hm-shift-row' }, lower, higher), group);
  } else wrap.append(group);
  return wrap;
}
