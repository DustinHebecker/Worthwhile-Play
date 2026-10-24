import { resolveSettings, settingChoices, settingId, type GameMetadata, type ResolvedSettings, type SettingSpec, type SettingValue, type Translator } from '@wp/game-core';
import { h } from '@wp/ui';
import type { UiTranslator } from '../app';

/** Choices with at most this many values are radio buttons (`display: 'auto'`); longer lists are a select. */
const RADIO_LIMIT = 4;

/** Test id of a setting's control: `difficulty` for the difficulty (kept from the old host select), else `setting-<id>`. */
export const settingTestId = (spec: SettingSpec): string => (spec.kind === 'difficulty' ? 'difficulty' : `setting-${spec.id}`);

/** Label of one value of a choice or the difficulty, in the game's namespace. */
export function valueLabel(spec: SettingSpec, value: SettingValue, gt: Translator): string {
  if (spec.kind === 'difficulty') return gt(`difficulty.${String(value)}`);
  if (spec.kind === 'choice') return spec.valueLabels?.[String(value)] ?? gt(`${spec.valueKey ?? ''}.${String(value)}`);
  return String(value);
}

/** Whether a setting's label comes from the game's namespace (else it is the host's "Difficulty"). */
const ownLabel = (spec: SettingSpec): boolean => spec.kind !== 'difficulty' || Boolean(spec.labelKey);

const labelOf = (spec: SettingSpec, gt: Translator, t: UiTranslator): string =>
  ownLabel(spec) ? gt((spec as { labelKey: string }).labelKey) : t('game.difficulty');

/**
 * Short text of the settings a game runs with, for the host toolbar (e.g. "Hard · 6×6 · Hints"): choice labels,
 * toggles that are on by their label, numbers as "label: value".
 */
export function settingsSummary(specs: readonly SettingSpec[], resolved: { readonly difficulty?: string | undefined; readonly settings: Readonly<Record<string, SettingValue>> }, gt: Translator, t: UiTranslator): string {
  const parts: string[] = [];
  for (const spec of specs) {
    const value = spec.kind === 'difficulty' ? resolved.difficulty : resolved.settings[spec.id];
    if (value === undefined) continue;
    if (spec.kind === 'toggle') {
      if (value === true) parts.push(labelOf(spec, gt, t));
    } else if (spec.kind === 'number') parts.push(`${labelOf(spec, gt, t)}: ${new Intl.NumberFormat(t.locale).format(Number(value))}`);
    else parts.push(valueLabel(spec, value, gt));
  }
  return parts.join(' · ');
}

export interface SetupForm {
  /** The settings' fields (append into the start form before the Start button). */
  readonly fields: HTMLElement;
  /** The current choices, resolved against the specs (hidden settings left out). */
  read(): ResolvedSettings;
}

/**
 * The host-drawn settings of the start screen (ADR 0017): one fieldset with a legend per choice (radio buttons
 * that wrap, or a labelled select for long lists), checkboxes for toggles, number inputs; hints via
 * aria-describedby. Settings whose `when` condition does not hold are hidden and disabled (so neither read nor
 * focusable) and reappear as soon as it holds again. `own` (`lang`/`dir`) marks the texts from the game's namespace
 * when they are in another language than the page (a game shown in English, ADR 0003 amendment 2026-10-24).
 */
export function renderSetupForm(
  specs: readonly SettingSpec[],
  metadata: GameMetadata,
  initial: Readonly<Record<string, unknown>>,
  gt: Translator,
  t: UiTranslator,
  own: { lang?: string; dir?: 'ltr' | 'rtl' } = {}
): SetupForm {
  // Every setting, hidden ones included, starts with the given value if it is valid, else its default.
  const all = resolveSettings(specs.map(({ when: _when, ...spec }) => spec as SettingSpec), metadata, initial);
  const startValue = (id: string): SettingValue | undefined => (id === 'difficulty' ? all.difficulty : all.settings[id]);

  const containers = new Map<string, HTMLElement>();
  const readers = new Map<string, () => SettingValue | undefined>();
  const fields = h('div', { class: 'setup-fields wp-stack' });

  for (const spec of specs) {
    const id = settingId(spec);
    if (containers.has(id)) continue;
    const domId = `setting-${id}`;
    const hintId = spec.hintKey ? `${domId}-hint` : undefined;
    const hint = spec.hintKey ? h('p', { class: 'setting-hint wp-muted', id: hintId, ...own }, gt(spec.hintKey)) : null;
    const label = labelOf(spec, gt, t);
    const labelLang = ownLabel(spec) ? own : {};
    // Ready-made value labels (device lists such as deck titles) are not the game's messages.
    const valueLang = spec.kind === 'choice' && spec.valueLabels ? {} : own;
    const value = startValue(id);
    const choices = settingChoices(spec, metadata);
    let container: HTMLElement;
    if (choices) {
      const display = spec.kind === 'choice' ? (spec.display ?? 'auto') : 'auto';
      const radios = display === 'radio' || (display === 'auto' && choices.length <= RADIO_LIMIT);
      if (radios) {
        const inputs = choices.map((choice, index) =>
          h('input', { type: 'radio', name: domId, id: `${domId}-${index}`, value: String(choice), checked: choice === value })
        );
        container = h('fieldset', { class: 'setting setting-choice', 'data-testid': settingTestId(spec), 'aria-describedby': hintId },
          h('legend', labelLang, label),
          h('div', { class: 'setting-options' }, ...choices.map((choice, index) => h('label', { class: 'setting-option', for: `${domId}-${index}` }, inputs[index]!, h('span', valueLang, valueLabel(spec, choice, gt))))),
          hint
        );
        readers.set(id, () => inputs.find((input) => input.checked)?.value);
      } else {
        const select = h('select', { id: domId, name: domId, 'data-testid': settingTestId(spec), 'aria-describedby': hintId },
          ...choices.map((choice) => h('option', { value: String(choice), selected: choice === value, ...valueLang }, valueLabel(spec, choice, gt)))
        );
        container = h('div', { class: 'setting field' }, h('label', { for: domId, ...labelLang }, label), select, hint);
        readers.set(id, () => select.value);
      }
    } else if (spec.kind === 'toggle') {
      const input = h('input', { type: 'checkbox', id: domId, name: domId, 'data-testid': settingTestId(spec), checked: value === true, 'aria-describedby': hintId });
      container = h('div', { class: 'setting setting-toggle' }, h('div', { class: 'field checkbox' }, input, h('label', { for: domId, ...labelLang }, label)), hint);
      readers.set(id, () => input.checked);
    } else {
      const number = spec as Extract<SettingSpec, { kind: 'number' }>;
      const input = h('input', {
        type: 'number', id: domId, name: domId, inputmode: 'numeric', 'data-testid': settingTestId(spec),
        min: number.min, max: number.max, step: number.step ?? 1, value: String(value ?? number.default), required: true, 'aria-describedby': hintId
      });
      container = h('div', { class: 'setting field' }, h('label', { for: domId, ...labelLang }, label), input, hint);
      readers.set(id, () => input.value);
    }
    containers.set(id, container);
    fields.append(container);
  }

  const raw = (): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const [id, read] of readers) values[id] = read();
    return values;
  };
  const update = () => {
    const { visible } = resolveSettings(specs, metadata, raw());
    for (const [id, container] of containers) {
      const shown = visible.has(id);
      container.hidden = !shown;
      for (const control of container.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')) control.disabled = !shown;
    }
  };
  fields.addEventListener('change', update);
  update();
  return { fields, read: () => resolveSettings(specs, metadata, raw()) };
}
