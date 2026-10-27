/**
 * The quiz screens (design § 5, § 7, § 15): the question card with its sound bar and options, the picture panel
 * (hidden by ear until Check or "Show the picture"), the review with "Listen: yours / the answer", build tasks on
 * the keyboard and the round summary.
 */
import { h } from '@wp/ui';
import { itemEvents, type Variant } from './audio/play';
import type { Env } from './env';
import { fill } from './format';
import { renderPiano, type KeyMark } from './keyboard-view';
import { KEYS_HIGH, KEYS_LOW, SENSE_TOPICS } from './levels';
import { answerName, chordSymbol, itemPicture, optionName, reviewFacts, rhythmGrid, shapeWords, stepPattern } from './pictures';
import {
  commit,
  currentItem,
  isCommitted,
  next,
  peek,
  setDraft,
  skip,
  summarize,
  toggleBuildKey,
  optionValue,
  type Item,
  type MixUp,
  type QuizState
} from './rules';
import { answerIndex, buildAnswerNotes, buildTargetPcs, intervalNotes, optionCount, type BuildSpec, type ChoiceSpec, type Spec } from './spec';
import { renderContour, renderStaff } from './staff-view';
import { defaultSpelling, midiOf, spellChordVoicing, spellScale, type Spelled } from './spelling';
import { RATIOS, SEMITONES, pitchClass, thirdSizes, type CadenceId, type ChordId, type IntervalId, type ScaleId } from './theory';
import type { Host } from './view-host';

const QUESTION: Readonly<Record<Spec['k'], string>> = {
  interval: 'q.interval',
  chord: 'q.chord',
  scale: 'q.scale',
  pair: 'q.pair',
  cadence: 'q.cadence',
  contour: 'q.contour',
  changed: 'q.changed',
  rhythm: 'q.rhythm',
  build: ''
};

/** Easy levels may hear each option before choosing (design § 5.2). */
const hearOptions = (state: QuizState, spec: Spec) => state.difficulty === 'easy' && (spec.k === 'interval' || spec.k === 'chord' || spec.k === 'scale' || spec.k === 'rhythm');

/** The notes an item shows on the keyboard (review, or by eye on easy), with marks. */
function keyMarks(spec: Spec): Map<number, KeyMark[]> {
  const marks = new Map<number, KeyMark[]>();
  const add = (m: number, k: KeyMark) => marks.set(m, [...(marks.get(m) ?? []), k]);
  switch (spec.k) {
    case 'interval': {
      const [a, b] = intervalNotes(spec.root, spec.ivl, spec.dir)!.map(midiOf);
      add(a!, 'first');
      add(b!, 'second');
      break;
    }
    case 'chord':
      for (const n of spellChordVoicing(spec.root, spec.q, spec.inv)!) add(midiOf(n), 'selected');
      break;
    case 'scale':
      for (const n of spellScale(spec.tonic, spec.s)!) add(midiOf(n), 'selected');
      break;
    case 'pair':
      add(midiOf(spec.first.root), 'selected');
      break;
    default:
      break;
  }
  return marks;
}

/** Which items show a keyboard: build always; interval/chord/scale in the review, and by eye on easy (and chords on medium). */
function showsKeyboard(state: QuizState, item: Item, hinted: boolean): boolean {
  const k = item.spec.k;
  if (k === 'build') return true;
  if (k !== 'interval' && k !== 'chord' && k !== 'scale') return false;
  if (isCommitted(item)) return true;
  if (state.senses !== 'eye') return false;
  return state.difficulty === 'easy' || (k !== 'interval' && state.difficulty === 'medium') || hinted;
}

/** Spelling of a build task's keys relative to the task (the answer's spelling for its pitch classes). */
function buildSpeller(spec: BuildSpec): (midi: number) => Spelled {
  const byPc = new Map<number, Spelled>();
  for (const n of buildAnswerNotes(spec) ?? []) byPc.set(pitchClass(midiOf(n)), n);
  return (midi) => {
    const s = byPc.get(pitchClass(midi));
    if (!s) return defaultSpelling(midi);
    return { ...s, o: s.o + Math.round((midi - midiOf(s)) / 12) };
  };
}

/* ---------- Tips and names of option values (review and summary) ---------- */

export function valueName(env: Env, k: Spec['k'], value: string): string {
  switch (k) {
    case 'interval':
    case 'pair':
      return env.ivl(value as IntervalId);
    case 'chord':
      return env.chord(value as ChordId);
    case 'scale':
      return env.scale(value as ScaleId);
    case 'cadence':
      return env.cadence(value as CadenceId);
    case 'contour':
      return shapeWords(env, value);
    case 'changed':
      return env.t('option.position', { n: env.int(Number(value) + 1) });
    default:
      return value;
  }
}

export function tipText(env: Env, m: Pick<MixUp, 'k' | 'answer' | 'choice'>): string {
  const tips = env.c.tips;
  const a = valueName(env, m.k, m.answer);
  const b = valueName(env, m.k, m.choice);
  switch (m.k) {
    case 'interval':
      return fill(tips.interval, { a, b, na: env.semitones(SEMITONES[m.answer as IntervalId]), nb: env.semitones(SEMITONES[m.choice as IntervalId]) });
    case 'chord': {
      const sizes = (q: string) => thirdSizes(q as ChordId).map(env.int).join(' + ');
      return fill(tips.chord, { a, b, ta: sizes(m.answer), tb: sizes(m.choice) });
    }
    case 'scale':
      return fill(tips.scale, { a, b, pa: stepPattern(env, m.answer as ScaleId), pb: stepPattern(env, m.choice as ScaleId) });
    case 'pair': {
      const r = (i: string) => env.ratio(...(RATIOS[i as IntervalId] as [number, number]));
      return fill(tips.pair, { a, b, ra: r(m.answer), rb: r(m.choice) });
    }
    case 'cadence':
      return fill(tips.cadence, { a, b });
    case 'contour':
      return fill(tips.contour, { a, b });
    case 'changed':
      return fill(tips.changed, { a: env.int(Number(m.answer) + 1), b: env.int(Number(m.choice) + 1) });
    default:
      return tips.rhythm;
  }
}

/* ---------- The question screen ---------- */

export function quizScreen(host: Host, state: QuizState): HTMLElement[] {
  const { env } = host;
  const t = env.t;
  const item = currentItem(state)!;
  const spec = item.spec;
  const committed = isCommitted(item);
  const eye = state.senses === 'eye';
  const picture = eye || committed || item.peeked !== false || spec.k === 'build';
  const prefs = host.prefs();
  const opts = { countIn: prefs.countIn };
  const play = (v: Variant, slow = false) => () => itemEvents(spec, v, { ...opts, slow });

  /* Header */
  const parts = [t('progress', { n: env.int(state.index + 1), total: env.int(state.items.length) }), t(`topic.${state.topic}`)];
  if ((SENSE_TOPICS as readonly string[]).includes(state.topic)) parts.push(t(`senses.${state.senses}`));
  const questionText =
    spec.k === 'build'
      ? buildTask(env, spec)
      : t(eye && spec.k === 'changed' ? 'q.changedEye' : eye && spec.k === 'rhythm' ? 'q.rhythmEye' : eye && spec.k === 'pair' ? 'q.pairEye' : QUESTION[spec.k]);
  const header = h('header', { class: 'hm-head' }, h('p', { class: 'hm-progress', 'data-testid': 'hm-progress' }, parts.join(' · ')), h('h2', { id: 'hm-q-heading', tabindex: '-1', 'data-testid': 'hm-question' }, questionText));

  /* Sound bar */
  const buttons: HTMLElement[] = [];
  if (spec.k !== 'build') {
    buttons.push(host.playButton(t('sound.play'), 'hm-play', play({ kind: 'question' }), true));
    buttons.push(host.playButton(t('sound.slower'), 'hm-slower', play({ kind: 'question' }, true)));
    if (spec.k === 'interval' && spec.dir === 'together') buttons.push(host.playButton(t('sound.togetherApart'), 'hm-together', play({ kind: 'together-apart' })));
    if (spec.k === 'changed') buttons.push(host.playButton(t('sound.playA'), 'hm-play-a', play({ kind: 'A' })), host.playButton(t('sound.playB'), 'hm-play-b', play({ kind: 'B' })));
  }
  const card = h('section', { class: 'hm-card', 'aria-labelledby': 'hm-q-heading' }, host.soundBar(buttons));

  /* Options or the build task */
  if (spec.k === 'build') card.append(buildPanel(host, state, item, spec));
  else card.append(optionsGroup(host, state, item, spec, questionText));

  /* Actions */
  if (!committed) {
    const ready = item.draft !== null && !('keys' in item.draft && item.draft.keys.length === 0);
    const check = h('button', { type: 'button', class: 'hm-primary', 'data-testid': 'hm-check', ...(ready ? {} : { disabled: true }) }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      const after = commit(state);
      const done = currentItem(after)!;
      host.commit(after, 'hm-review-heading', verdictText(env, done));
    });
    const skipBtn = h('button', { type: 'button', class: 'hm-secondary', 'data-testid': 'hm-skip' }, t('action.skip'));
    skipBtn.addEventListener('click', () => !host.paused() && host.commit(skip(state), 'hm-review-heading', verdictText(env, currentItem(skip(state))!)));
    card.append(h('div', { class: 'hm-actions' }, check, skipBtn));
  }

  /* Picture panel / review */
  const panel = h('section', { class: 'hm-panel', 'data-testid': 'hm-panel' });
  if (committed) panel.append(...review(host, state, item));
  else if (!picture) {
    const show = h('button', { type: 'button', class: 'hm-secondary', 'data-testid': 'hm-show-picture' }, t('action.showPicture'));
    show.addEventListener('click', () => !host.paused() && host.commit(peek(state, 'hint'), 'hm-picture'));
    panel.append(h('p', { class: 'hm-muted' }, t('picture.after')), show);
  } else if (spec.k !== 'build') {
    if (item.peeked === 'no-sound') panel.append(h('p', { class: 'hm-notice', 'data-testid': 'hm-no-sound' }, t('sound.noSoundPicture')));
    panel.append(itemPicture(env, spec, false));
    if (eye && spec.k === 'interval' && state.difficulty !== 'easy' && item.peeked === false) {
      const show = h('button', { type: 'button', class: 'hm-secondary', 'data-testid': 'hm-show-keys' }, t('action.showKeyboard'));
      show.addEventListener('click', () => !host.paused() && host.commit(peek(state, 'hint'), 'hm-show-keys-anchor'));
      panel.append(show);
    }
  }

  const layout = h('div', { class: 'hm-layout' }, card, panel);
  const out: HTMLElement[] = [header, layout];
  if (spec.k !== 'build' && showsKeyboard(state, item, item.peeked === 'hint')) {
    const marks = keyMarks(spec);
    const first = Math.min(...marks.keys());
    out.push(
      h('div', { id: 'hm-show-keys-anchor', tabindex: '-1', class: 'hm-keys-box' },
        renderPiano({
          env,
          low: KEYS_LOW,
          high: KEYS_HIGH,
          start: host.keysStart(12 * Math.floor(first / 12)),
          octaves: host.narrow() ? 1 : 2,
          layout: prefs.keys,
          marks,
          spell: (m) => spellingFor(spec, m),
          onPress: (m) => host.play([{ freq: 440 * 2 ** ((m - 69) / 12), start: 0, dur: 0.8 }]),
          onShift: (s, f) => host.setKeysStart(s, f),
          focusMidi: host.focusKey(),
          focusNow: host.focusKey() !== undefined,
          testid: 'hm-keys'
        })
      )
    );
  }
  return out;
}

/** The spelling an item uses for a key (its own notes), else the usual one. */
function spellingFor(spec: Spec, midi: number): Spelled {
  let notes: Spelled[] = [];
  if (spec.k === 'interval') notes = intervalNotes(spec.root, spec.ivl, spec.dir) ?? [];
  else if (spec.k === 'chord') notes = spellChordVoicing(spec.root, spec.q, spec.inv) ?? [];
  else if (spec.k === 'scale') notes = spellScale(spec.tonic, spec.s) ?? [];
  return notes.find((n) => midiOf(n) === midi) ?? defaultSpelling(midi);
}

function buildTask(env: Env, spec: BuildSpec): string {
  const note = env.note(spec.root);
  if (spec.task === 'interval') return env.t('build.interval', { note, name: env.ivl(spec.target) });
  if (spec.task === 'chord') return env.t('build.chord', { note, name: env.chord(spec.target) });
  return env.t('build.scale', { note, name: env.scale(spec.target) });
}

function verdictText(env: Env, item: Item): string {
  const name = answerName(env, item.spec);
  if (item.answer === 'skip') return env.t('verdict.skip', { name });
  return item.matched ? env.t('verdict.match', { name }) : env.t('verdict.miss', { name });
}

/* ---------- Options ---------- */

function optionsGroup(host: Host, state: QuizState, item: Item, spec: ChoiceSpec, legend: string): HTMLElement {
  const { env } = host;
  const t = env.t;
  const committed = isCommitted(item);
  const n = optionCount(spec);
  const right = answerIndex(spec);
  const chosen = item.answer && item.answer !== 'skip' && 'choice' in item.answer ? item.answer.choice : item.draft && 'choice' in item.draft ? item.draft.choice : -1;
  const group = h('fieldset', { class: `hm-options hm-options--${spec.k}`, 'data-testid': 'hm-options' }, h('legend', { class: 'sr-only' }, legend));
  for (let i = 0; i < n; i++) {
    const name = optionName(env, spec, i);
    const input = h('input', { type: 'radio', name: 'hm-option', value: String(i), 'data-testid': `hm-opt-${i}`, ...(i === chosen ? { checked: true } : {}), ...(committed ? { disabled: true } : {}) });
    input.addEventListener('change', () => {
      if (host.paused() || committed) return;
      host.commit(setDraft(state, { choice: i }), `hm-opt-${i}`);
    });
    const body = h('span', { class: 'hm-option-body' });
    if (spec.k === 'contour') body.append(renderContour(spec.options[i]!), h('span', { class: 'hm-option-name' }, name));
    else if (spec.k === 'rhythm') body.append(h('span', { class: 'hm-option-name' }, name), rhythmGrid(env, spec.options[i]!));
    else {
      body.append(h('span', { class: 'hm-option-name' }, name));
      if (spec.k === 'interval') body.append(h('span', { class: 'hm-option-size' }, env.semitones(SEMITONES[spec.options[i]!])));
    }
    if (committed) {
      if (i === right) body.append(h('span', { class: 'hm-option-mark', 'data-testid': 'hm-right' }, `● ${t('option.right')}`));
      else if (i === chosen) body.append(h('span', { class: 'hm-option-mark' }, `○ ${t('option.yours')}`));
    }
    const label = h('label', { class: `hm-option${i === chosen ? ' hm-option--chosen' : ''}${committed && i === right ? ' hm-option--right' : ''}` }, input, body);
    const row = h('div', { class: 'hm-option-row' }, label);
    if (!committed && hearOptions(state, spec) && host.soundAvailable()) {
      const hear = host.playButton('▶', `hm-hear-${i}`, () => itemEvents(spec, { kind: 'option', i }, { countIn: host.prefs().countIn }));
      hear.setAttribute('aria-label', t('sound.hearOption', { name }));
      hear.classList.add('hm-hear');
      row.append(hear);
    }
    group.append(row);
  }
  return group;
}

/* ---------- Build tasks ---------- */

function buildPanel(host: Host, state: QuizState, item: Item, spec: BuildSpec): HTMLElement {
  const { env } = host;
  const t = env.t;
  const committed = isCommitted(item);
  const root = midiOf(spec.root);
  const keys = item.draft && 'keys' in item.draft ? item.draft.keys : [];
  const chosenKeys = item.answer && item.answer !== 'skip' && 'keys' in item.answer ? item.answer.keys : keys;
  const speller = buildSpeller(spec);
  const box = h('div', { class: 'hm-build' });
  box.append(h('p', {}, t('build.given', { note: env.note(spec.root) })));
  const selected = [root, ...chosenKeys].sort((a, b) => a - b);
  box.append(h('p', { 'data-testid': 'hm-build-chosen' }, chosenKeys.length ? t('build.chosen', { notes: selected.map((m) => env.note(speller(m))).join(' – ') }) : t('build.none')));
  const staffNotes = selected.map(speller);
  box.append(renderStaff(spec.task === 'scale' ? staffNotes.map((n) => ({ notes: [n] })) : [{ notes: staffNotes }], { name: t('staff.notes', { notes: staffNotes.map(env.spoken).join(', ') }), testid: 'hm-build-staff' }));
  const marks = new Map<number, KeyMark[]>();
  marks.set(root, ['given']);
  if (committed) {
    const target = buildTargetPcs(spec);
    const exact = spec.task === 'interval' ? root + SEMITONES[spec.target] : undefined;
    for (const k of chosenKeys) marks.set(k, [exact !== undefined ? (k === exact ? 'belongs' : 'notIn') : target.includes(pitchClass(k)) ? 'belongs' : 'notIn']);
    const have = new Set([root, ...chosenKeys].map(pitchClass));
    for (const n of buildAnswerNotes(spec) ?? []) {
      const m = midiOf(n);
      const missing = exact !== undefined ? !chosenKeys.includes(m) && m !== root : !have.has(pitchClass(m));
      if (missing) marks.set(m, [...(marks.get(m) ?? []), 'missing']);
    }
  } else for (const k of keys) marks.set(k, ['selected']);
  box.append(
    renderPiano({
      env,
      low: KEYS_LOW,
      high: KEYS_HIGH,
      start: host.keysStart(12 * Math.floor(root / 12)),
      octaves: host.narrow() ? 1 : 2,
      layout: host.prefs().keys,
      marks,
      toggle: !committed,
      disabled: new Set([root]),
      spell: speller,
      onPress: (m) => {
        host.play([{ freq: 440 * 2 ** ((m - 69) / 12), start: 0, dur: 0.8 }]);
        if (!committed && !host.paused()) host.commit(toggleBuildKey(state, m), m);
      },
      onShift: (s, f) => host.setKeysStart(s, f),
      focusMidi: host.focusKey(),
      focusNow: host.focusKey() !== undefined,
      testid: 'hm-keys'
    })
  );
  return box;
}

/* ---------- Review ---------- */

function review(host: Host, state: QuizState, item: Item): HTMLElement[] {
  const { env } = host;
  const t = env.t;
  const spec = item.spec;
  const out: HTMLElement[] = [h('h3', { id: 'hm-review-heading', tabindex: '-1' }, t('review.heading'))];
  const symbol = item.answer === 'skip' ? '' : item.matched ? '● ' : '○ ';
  out.push(h('p', { class: 'hm-verdict', 'data-testid': 'hm-verdict', 'data-matched': String(item.matched) }, `${symbol}${verdictText(env, item)}`));
  if (spec.k === 'build') {
    out.push(h('p', { 'data-testid': 'hm-build-answer' }, t('review.answer', { notes: (buildAnswerNotes(spec) ?? []).map(env.note).join(' – ') })));
    if (spec.task === 'chord') out.push(h('p', {}, t('review.symbol', { symbol: chordSymbol(env, spec.root, spec.target) })));
    if (spec.task === 'scale') out.push(h('p', {}, t('review.steps', { list: stepPattern(env, spec.target) })));
  } else {
    const chosen = item.answer !== 'skip' && item.answer && 'choice' in item.answer ? item.answer.choice : -1;
    if (chosen >= 0 && !item.matched) out.push(h('p', {}, t('review.yourChoice', { name: optionName(env, spec, chosen) })));
    out.push(itemPicture(env, spec, true, chosen));
    out.push(...reviewFacts(env, spec));
    if (chosen >= 0 && !item.matched) {
      const tip = tipText(env, { k: spec.k, answer: optionValue(spec, answerIndex(spec)), choice: optionValue(spec, chosen) });
      out.push(h('p', { class: 'hm-tip', 'data-testid': 'hm-tip' }, h('strong', {}, `${t('review.tip')}: `), tip));
    }
  }
  /* Listen: yours / the answer */
  const listen: HTMLElement[] = [];
  const countIn = host.prefs().countIn;
  if (spec.k === 'build') {
    const keys = item.answer !== 'skip' && item.answer && 'keys' in item.answer ? item.answer.keys : [];
    if (keys.length) listen.push(host.playButton(t('sound.yours'), 'hm-yours', () => itemEvents(spec, { kind: 'keys', keys })));
    listen.push(host.playButton(t('sound.answer'), 'hm-answer', () => itemEvents(spec, { kind: 'target' })));
  } else {
    const chosen = item.answer !== 'skip' && item.answer && 'choice' in item.answer ? item.answer.choice : -1;
    if (chosen >= 0) listen.push(host.playButton(t('sound.yours'), 'hm-yours', () => itemEvents(spec, { kind: 'option', i: chosen }, { countIn })));
    listen.push(host.playButton(t('sound.answer'), 'hm-answer', () => itemEvents(spec, { kind: 'question' }, { countIn })));
  }
  if (host.soundAvailable()) out.push(h('div', { class: 'hm-listen' }, ...listen));
  /* Next */
  const last = state.index === state.items.length - 1;
  const nextBtn = h('button', { type: 'button', class: 'hm-primary', 'data-testid': last ? 'hm-summary-btn' : 'hm-next' }, t(last ? 'action.summary' : 'action.next'));
  nextBtn.addEventListener('click', () => {
    if (host.paused()) return;
    const after = next(state);
    host.commit(after, last ? 'hm-summary-heading' : 'hm-q-heading');
    // "Play each new question when I press Next" (inside this gesture only).
    const nextItem = currentItem(after);
    if (!last && nextItem && host.prefs().autoplay && state.senses === 'ear' && nextItem.spec.k !== 'build') host.play(itemEvents(nextItem.spec, { kind: 'question' }, { countIn }));
  });
  out.push(h('div', { class: 'hm-actions' }, nextBtn));
  return out;
}

/* ---------- Summary (design § 10) ---------- */

export function summaryScreen(host: Host, state: QuizState): HTMLElement[] {
  const { env } = host;
  const t = env.t;
  const sum = summarize(state);
  const out: HTMLElement[] = [h('h2', { id: 'hm-summary-heading', tabindex: '-1', 'data-testid': 'hm-summary' }, t('summary.heading'))];
  out.push(h('p', { 'data-testid': 'hm-summary-matched' }, t('summary.matched', { k: env.int(sum.matched), n: env.int(sum.asked) })));
  if (sum.skipped) out.push(h('p', {}, t('summary.skipped', { n: env.int(sum.skipped) })));
  if (sum.hints) out.push(h('p', {}, t(state.senses === 'eye' ? 'summary.withKeyboard' : 'summary.withPicture', { n: env.int(sum.hints) })));
  if (sum.noSound) out.push(h('p', {}, t('summary.noSound', { n: env.int(sum.noSound) })));
  const box = h('section', { class: 'hm-mixups', 'data-testid': 'hm-mixups' }, h('h3', {}, t('summary.mixups')));
  if (!sum.mixUps.length) box.append(h('p', {}, t('summary.noMixups')));
  else
    box.append(
      h(
        'ul',
        {},
        ...sum.mixUps.map((m) =>
          h('li', {}, h('strong', {}, t('summary.mixup', { a: valueName(env, m.k, m.answer), b: valueName(env, m.k, m.choice), n: env.int(m.count) })), ': ', tipText(env, m))
        )
      )
    );
  out.push(box, h('p', { class: 'hm-closing' }, env.c.closing[state.topic]));
  return out;
}

