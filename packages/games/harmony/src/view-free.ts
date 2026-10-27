/**
 * The free keyboard (design § 7.7): play, or hold keys to build chords; the game names what is held (note, interval
 * with ratio and cents, chord quality and inversion, or "no common chord name"), shows it on a grand staff and as a
 * wave picture, with an optional scale overlay and a pure-ratio tuning for listening to the difference.
 */
import { h } from '@wp/ui';
import { heldEvents, keyEvents } from './audio/schedule';
import type { Env } from './env';
import { renderPiano, type KeyMark } from './keyboard-view';
import { BASE_MAX, BASE_MIN, FREE_HIGH, FREE_LOW } from './levels';
import { listOf, ratioLine, wavePicture } from './pictures';
import { clearHeld, setBase, setMode, setOverlay, setTuning, toggleHeld, type KeyboardState } from './rules';
import { renderStaff } from './staff-view';
import { ROOT_POOL, defaultSpelling, midiOf, spellChord, type Spelled } from './spelling';
import { SCALES, SCALE_TONES, midiToFreq, pitchClass, pureRatio, recognise, type ScaleId } from './theory';
import type { Host } from './view-host';

/** Spelling of held notes: chord tones relative to a recognised root, else the usual spelling. */
function spellHeld(held: readonly number[]): Spelled[] {
  const r = recognise(held);
  if (r.kind === 'chord') {
    const tones = spellChord({ ...ROOT_POOL[r.rootPc]!, o: 4 }, r.q);
    if (tones) {
      const byPc = new Map(tones.map((s) => [pitchClass(midiOf(s)), s] as const));
      return held.map((m) => {
        const s = byPc.get(pitchClass(m));
        return s ? { ...s, o: s.o + Math.round((m - midiOf(s)) / 12) } : defaultSpelling(m);
      });
    }
  }
  return held.map(defaultSpelling);
}

/** Frequencies of held notes: equal temperament, or pure ratios above the lowest held note. */
export function heldFreqs(held: readonly number[], tuning: 'equal' | 'just'): number[] {
  if (!held.length) return [];
  const low = held[0]!;
  return held.map((m) => {
    if (tuning === 'equal') return midiToFreq(m);
    const [p, q] = pureRatio(m - low);
    return (midiToFreq(low) * p) / q;
  });
}

function namePanel(env: Env, state: KeyboardState): HTMLElement {
  const t = env.t;
  const held = state.held;
  const panel = h('section', { class: 'hm-panel hm-free-panel', 'aria-live': 'polite', 'data-testid': 'hm-free-panel' });
  const r = recognise(held);
  const spelled = spellHeld(held);
  let text: string;
  switch (r.kind) {
    case 'empty':
      text = t('free.empty');
      break;
    case 'note':
      text = env.noteOct(spelled[0]!);
      break;
    case 'interval': {
      const size = env.semitones(r.semitones);
      text = !r.ivl ? size : r.semitones > 12 ? t('free.compound', { name: env.ivl(r.ivl), size }) : t('free.interval', { name: env.ivl(r.ivl), size });
      break;
    }
    case 'chord':
      text = t('free.chord', { root: env.note(ROOT_POOL[r.rootPc]!), name: env.chord(r.q), inversion: t(`free.inv${r.inversion}`) });
      break;
    case 'unnamed':
      text = t('free.noName', { list: listOf(r.above.map((s) => env.semitones(s))) });
      break;
  }
  panel.append(h('p', { class: 'hm-free-name', 'data-testid': 'hm-free-name' }, text));
  if (held.length) {
    panel.append(h('p', {}, t('review.notes', { notes: spelled.map(env.noteOct).join(' – ') })));
    panel.append(renderStaff([{ notes: spelled }], { grand: true, name: t('staff.together', { notes: spelled.map(env.spoken).join(', ') }), testid: 'hm-free-staff' }));
  }
  if (r.kind === 'interval' && r.ivl && r.semitones <= 12) panel.append(ratioLine(env, r.ivl));
  if (held.length >= 2) panel.append(wavePicture(env, heldFreqs(held, state.tuning), held.map((m) => m - held[0]!).slice(1)));
  return panel;
}

const radios = (name: string, legend: string, values: readonly [string, string][], current: string, onPick: (v: string) => void, testid: string) =>
  h(
    'fieldset',
    { class: 'hm-radios', 'data-testid': testid },
    h('legend', {}, legend),
    ...values.map(([v, label]) => {
      const input = h('input', { type: 'radio', name, value: v, 'data-testid': `${testid}-${v}`, ...(v === current ? { checked: true } : {}) });
      input.addEventListener('change', () => onPick(v));
      return h('label', { class: 'hm-radio' }, input, ' ', label);
    })
  );

export function freeScreen(host: Host, state: KeyboardState): HTMLElement[] {
  const { env } = host;
  const t = env.t;
  const go = (next: KeyboardState, focus?: string | number) => !host.paused() && host.commit(next, focus);
  const header = h('header', { class: 'hm-head' }, h('h2', { id: 'hm-q-heading', tabindex: '-1' }, t('free.heading')), h('p', { class: 'hm-muted' }, t('free.intro')));

  const playHeld = host.playButton(t('sound.held'), 'hm-play-held', () => heldEvents(heldFreqs(state.held, state.tuning)), true);
  const card = h('section', { class: 'hm-card' }, host.soundBar(state.held.length ? [playHeld] : []));
  const controls = h('div', { class: 'hm-free-controls' });
  controls.append(radios('hm-mode', t('free.mode'), [['play', t('free.play')], ['hold', t('free.hold')]], state.mode, (v) => go(setMode(state, v as 'play' | 'hold'), `hm-mode-${v}`), 'hm-mode'));
  controls.append(radios('hm-tuning', t('free.tuning'), [['equal', t('free.equal')], ['just', t('free.just')]], state.tuning, (v) => go(setTuning(state, v as 'equal' | 'just'), `hm-tuning-${v}`), 'hm-tuning'));
  const clearBtn = h('button', { type: 'button', class: 'hm-secondary', 'data-testid': 'hm-clear', ...(state.held.length ? {} : { disabled: true }) }, t('action.clear'));
  clearBtn.addEventListener('click', () => go(clearHeld(state), 'hm-q-heading'));
  controls.append(clearBtn);

  /* Scale overlay: tonic and scale (not colour-only: • and the degree on the keys) */
  const tonic = h('select', { 'data-testid': 'hm-overlay-tonic', 'aria-label': t('free.tonic') }, ...ROOT_POOL.map((s, pc) => h('option', { value: String(pc), ...(state.overlay?.tonic === pc ? { selected: true } : {}) }, env.note(s))));
  const scale = h('select', { 'data-testid': 'hm-overlay-scale', 'aria-label': t('free.scale') }, h('option', { value: '' }, t('free.none')), ...SCALES.map((s) => h('option', { value: s, ...(state.overlay?.s === s ? { selected: true } : {}) }, env.scale(s))));
  const applyOverlay = () => go(setOverlay(state, scale.value ? { tonic: Number(tonic.value), s: scale.value as ScaleId } : null), 'hm-overlay-scale');
  tonic.addEventListener('change', applyOverlay);
  scale.addEventListener('change', applyOverlay);
  controls.append(h('fieldset', { class: 'hm-overlay' }, h('legend', {}, t('free.overlay')), h('label', {}, t('free.tonic'), ' ', tonic), h('label', {}, t('free.scale'), ' ', scale)));
  card.append(controls);

  /* Keyboard */
  const marks = new Map<number, KeyMark[]>();
  for (const m of state.held) marks.set(m, ['selected']);
  if (state.overlay) {
    const tones = SCALE_TONES[state.overlay.s];
    for (let m = FREE_LOW; m <= FREE_HIGH; m++) {
      const degree = tones.indexOf(pitchClass(m - state.overlay.tonic));
      if (degree >= 0) marks.set(m, [...(marks.get(m) ?? []), `scale${degree + 1}`]);
    }
  }
  const octaves = host.narrow() ? 1 : 2;
  const start = Math.min(12 * (state.base + 1), FREE_HIGH + 1 - 12 * octaves);
  const piano = renderPiano({
    env,
    low: FREE_LOW,
    high: FREE_HIGH,
    start,
    octaves,
    layout: host.prefs().keys,
    marks,
    toggle: state.mode === 'hold',
    spell: (m) => spellHeld([m])[0]!,
    onPress: (m) => {
      if (host.paused()) return;
      if (state.mode === 'play') {
        host.play(keyEvents(midiToFreq(m)));
        host.announce(env.spokenMidi(m));
        host.setKeysStart(start, m);
      } else {
        const next = toggleHeld(state, m);
        if (next.held.includes(m)) host.play(heldEvents(heldFreqs(next.held, next.tuning)));
        host.commit(next, m);
      }
    },
    onShift: (s, f) => {
      const base = Math.max(BASE_MIN, Math.min(BASE_MAX, s / 12 - 1));
      host.commit(setBase(state, base), f ?? 'hm-keys-higher');
    },
    focusMidi: host.focusKey(),
    focusNow: host.focusKey() !== undefined,
    testid: 'hm-keys'
  });
  return [header, h('div', { class: 'hm-layout' }, card, namePanel(env, state)), h('div', { class: 'hm-keys-box' }, piano)];
}
