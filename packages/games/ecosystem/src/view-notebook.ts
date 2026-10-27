/** Pieces shared by the goal and explore screens: run controls, the change log and its return points. */
import { h } from '@wp/ui';
import type { Habitat } from './habitats';
import type { Action } from './model';
import type { Host } from './view-host';

export const RUN_STEPS = [1, 4, 26] as const;

/** [1 week] [4 weeks] [26 weeks] [Until it settles]. */
export function runBar(host: Host, disabled: boolean, onRun: (weeks: number | 'settle', id: string) => void): HTMLElement {
  const { ui } = host;
  const button = (key: string, id: string, weeks: number | 'settle') => {
    const b = h('button', { type: 'button', class: 'eco-run-btn', id, 'data-testid': id, 'aria-disabled': disabled ? 'true' : 'false' }, ui.t(key));
    b.addEventListener('click', () => {
      if (host.paused() || disabled) return;
      onRun(weeks, id);
    });
    return b;
  };
  return h(
    'div',
    { class: 'eco-runbar', role: 'group', 'aria-label': ui.t('run.label'), 'data-testid': 'eco-runbar' },
    ...RUN_STEPS.map((n) => button(`run.${n}`, `eco-run-${n}`, n)),
    button('run.settle', 'eco-run-settle', 'settle')
  );
}

/** The log of changes; each entry is a return point ("Back to week …"). */
export function changeLog(host: Host, habitat: Habitat, log: readonly Action[], onBack: ((index: number) => void) | null, script: readonly Action[] = []): HTMLElement {
  const { ui } = host;
  const list = h('ol', { class: 'eco-log', 'data-testid': 'eco-log' });
  for (const a of script) list.append(h('li', { class: 'eco-log-script' }, `${ui.t('log.line', { w: ui.int(a.week), what: ui.action(habitat, a) })} · ${ui.t('log.situation')}`));
  log.forEach((a, k) => {
    const li = h('li', {}, h('span', {}, `▼${ui.int(k + 1)} `, ui.t('log.line', { w: ui.int(a.week), what: ui.action(habitat, a) })));
    if (onBack) {
      const b = h('button', { type: 'button', class: 'eco-link', 'data-testid': `eco-back-${k}` }, ui.t('goalui.back', { w: ui.int(a.week) }));
      b.addEventListener('click', () => !host.paused() && onBack(k));
      li.append(' ', b);
    }
    list.append(li);
  });
  if (!log.length && !script.length) list.append(h('li', { class: 'eco-muted' }, ui.t('goalui.noChanges')));
  return list;
}
