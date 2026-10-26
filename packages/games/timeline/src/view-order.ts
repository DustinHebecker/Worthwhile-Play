/**
 * "Put in order" (design § 8): a vertical list from "Oldest" to "Most recent" with move buttons on every card, a
 * drag handle (pointer capture, insertion line, auto-scroll) and a keyboard pick-up pattern on the handle; then a
 * review with the right order, each card's place, the gaps and the numbered events on the timeline.
 */
import { h } from '@wp/ui';
import { fitYears } from './axis';
import type { AxisMark } from './axis-view';
import { checkOrder, correctOrder, move, type OrderItem } from './rules';
import { BAND_MARKS, orderMark, pairsTotal } from './score';
import type { Host, Screen } from './view-host';

export function orderVerdict(host: Host, item: OrderItem): string {
  const { t } = host;
  if (item.answer === 'skip' || item.pairs === null) return t('when.skipped');
  const total = pairsTotal(item.events.length);
  const mark = BAND_MARKS[orderMark(item.pairs, total)];
  return item.pairs === total ? `${mark} ${t('order.allRight')}` : `${mark} ${t('order.result', { pairs: host.ui.int(item.pairs), total: host.ui.int(total) })}`;
}

interface Pick {
  id: string;
  from: number;
}

export function orderScreen(host: Host, item: OrderItem): Screen {
  const { t, ui } = host;
  const card: HTMLElement[] = [host.header(item, t('order.prompt'))];
  const n = item.events.length;
  const order = correctOrder(item.events);

  if (item.answer === null) {
    const picked = host.scratch.picked as Pick | undefined;
    const list = h('ol', { class: 'tl-order', 'data-testid': 'tl-order' });
    const commitMove = (from: number, to: number, focus: string | null, message: string) => {
      host.commit(move(host.state(), from, to), focus, message);
    };
    item.draft.forEach((id, i) => {
      const title = ui.title(id);
      const handle = h(
        'button',
        { type: 'button', id: `tl-handle-${i}`, class: 'tl-handle', 'data-testid': `tl-handle-${i}`, 'aria-label': t('order.handle', { title }), 'aria-pressed': picked?.id === id ? 'true' : 'false' },
        h('span', { 'aria-hidden': 'true' }, '≡')
      );
      const up = h('button', { type: 'button', id: `tl-up-${i}`, class: 'tl-move', 'data-testid': `tl-up-${i}`, 'aria-label': t('order.up', { title }), disabled: i === 0 }, h('span', { 'aria-hidden': 'true' }, '▲'));
      const down = h('button', { type: 'button', id: `tl-down-${i}`, class: 'tl-move', 'data-testid': `tl-down-${i}`, 'aria-label': t('order.down', { title }), disabled: i === n - 1 }, h('span', { 'aria-hidden': 'true' }, '▼'));
      up.addEventListener('click', () => !host.paused() && commitMove(i, i - 1, i - 1 === 0 ? `tl-down-${i - 1}` : `tl-up-${i - 1}`, t('order.moved', { title, n: ui.int(i), total: ui.int(n) })));
      down.addEventListener('click', () => !host.paused() && commitMove(i, i + 1, i + 1 === n - 1 ? `tl-up-${i + 1}` : `tl-down-${i + 1}`, t('order.moved', { title, n: ui.int(i + 2), total: ui.int(n) })));
      // Keyboard pick-up: Space picks up and places, arrows move, Escape returns the card.
      handle.addEventListener('keydown', (e) => {
        if (host.paused()) return;
        const cur = host.scratch.picked as Pick | undefined;
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (cur) {
            delete host.scratch.picked;
            host.refresh(`tl-handle-${i}`);
            host.announce(t('order.dropped', { title, n: ui.int(i + 1), total: ui.int(n) }));
          } else {
            host.scratch.picked = { id, from: i };
            host.refresh(`tl-handle-${i}`);
            host.announce(t('order.picked', { title, n: ui.int(i + 1), total: ui.int(n) }));
          }
          return;
        }
        if (!cur || cur.id !== id) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const to = e.key === 'ArrowUp' ? i - 1 : i + 1;
          if (to < 0 || to >= n) return;
          commitMove(i, to, `tl-handle-${to}`, t('order.moved', { title, n: ui.int(to + 1), total: ui.int(n) }));
        } else if (e.key === 'Escape') {
          e.preventDefault();
          delete host.scratch.picked;
          if (cur.from !== i) commitMove(i, cur.from, `tl-handle-${cur.from}`, t('order.cancelled', { title, n: ui.int(cur.from + 1), total: ui.int(n) }));
          else host.refresh(`tl-handle-${i}`);
        }
      });
      // Pointer drag by the handle; a tap without movement does nothing.
      handle.addEventListener('pointerdown', (e) => {
        if (host.paused()) return;
        e.preventDefault();
        handle.setPointerCapture?.(e.pointerId);
        const startY = e.clientY;
        let target = i;
        let moved = false;
        const li = handle.closest('li');
        const rows = [...list.children] as HTMLElement[];
        const onMove = (ev: PointerEvent) => {
          if (Math.abs(ev.clientY - startY) > 6) moved = true;
          if (!moved) return;
          li?.classList.add('tl-dragging');
          if (li) li.style.transform = `translateY(${ev.clientY - startY}px)`;
          target = i;
          rows.forEach((row, j) => {
            const r = row.getBoundingClientRect();
            const mid = r.top + r.height / 2;
            if (j < i && ev.clientY < mid) target = Math.min(target, j);
            if (j > i && ev.clientY > mid) target = Math.max(target, j);
          });
          rows.forEach((row, j) => row.classList.toggle('tl-insert-before', j === target && target < i));
          rows.forEach((row, j) => row.classList.toggle('tl-insert-after', j === target && target > i));
          // Auto-scroll near the edges of the viewport.
          if (ev.clientY < 60) window.scrollBy(0, -12);
          else if (ev.clientY > window.innerHeight - 90) window.scrollBy(0, 12);
        };
        const onUp = () => {
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
          if (li) li.style.transform = '';
          li?.classList.remove('tl-dragging');
          rows.forEach((row) => row.classList.remove('tl-insert-before', 'tl-insert-after'));
          if (moved && target !== i && !host.paused()) commitMove(i, target, `tl-handle-${target}`, t('order.dropped', { title, n: ui.int(target + 1), total: ui.int(n) }));
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      });
      list.append(
        h(
          'li',
          { class: `tl-order-card${picked?.id === id ? ' tl-picked' : ''}`, 'data-testid': `tl-card-${i}` },
          handle,
          h('span', { class: 'tl-pos', 'aria-hidden': 'true' }, ui.int(i + 1)),
          h('span', { class: 'tl-order-title' }, ui.title(id)),
          h('span', { class: 'tl-moves' }, up, down)
        )
      );
    });
    card.push(h('p', { class: 'tl-end-label' }, h('span', { 'aria-hidden': 'true' }, '▲ '), t('order.oldest')), list, h('p', { class: 'tl-end-label' }, h('span', { 'aria-hidden': 'true' }, '▼ '), t('order.newest')));
    const check = h('button', { type: 'button', class: 'tl-primary', 'data-testid': 'tl-check' }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      delete host.scratch.picked;
      const next = checkOrder(host.state());
      host.commit(next, 'tl-review-heading', orderVerdict(host, next.items[next.index] as OrderItem));
    });
    card.push(h('div', { class: 'tl-actions tl-sticky' }, check, host.skipButton()));
    return { card, scene: { mode: 'explore', ariaLabel: t('axis.label') }, fit: null };
  }

  // Review.
  card.push(ui.heading('h3', 'tl-review-heading', t('review.heading')), h('p', { class: 'tl-verdict', 'data-testid': 'tl-verdict' }, orderVerdict(host, item)));
  if (Array.isArray(item.answer)) {
    card.push(
      h(
        'ol',
        { class: 'tl-order-review', 'data-testid': 'tl-order-answer' },
        ...item.answer.map((id, i) => {
          const at = order.indexOf(id);
          return h('li', {}, h('strong', {}, ui.title(id)), ' · ', ui.bdi(ui.when(id)), ' — ', at === i ? t('order.inPlace') : t('order.belongs', { n: ui.int(at + 1) }));
        })
      )
    );
  }
  card.push(h('h4', { class: 'tl-sub' }, t('order.correct')), h('ol', { class: 'tl-order-review', 'data-testid': 'tl-order-correct' }, ...order.map((id) => h('li', {}, ui.title(id), ' · ', ui.bdi(ui.when(id))))));
  // The largest and the smallest gap between neighbours in time.
  const gaps = order.slice(1).map((id, i) => ({ a: order[i]!, b: id, g: ui.ev(id).y - ui.ev(order[i]!).y }));
  const big = gaps.reduce((p, q) => (q.g > p.g ? q : p));
  const small = gaps.reduce((p, q) => (q.g < p.g ? q : p));
  card.push(h('p', { 'data-testid': 'tl-gap-large' }, ui.rich('order.gapLarge', { a: ui.title(big.a), b: ui.title(big.b), duration: ui.duration(big.g) })));
  if (small !== big) card.push(h('p', { 'data-testid': 'tl-gap-small' }, ui.rich('order.gapSmall', { a: ui.title(small.a), b: ui.title(small.b), duration: ui.duration(small.g) })));
  card.push(ui.about(order, 'review.aboutAll'), h('div', { class: 'tl-actions tl-sticky' }, host.nextButton()));
  const marks: AxisMark[] = order.map((id, i) => ({ y: ui.ev(id).y, symbol: ui.int(i + 1), label: ui.title(id), style: 'number' }));
  const evs = order.map((id) => ui.ev(id));
  return {
    card,
    scene: { mode: 'explore', marks, ariaLabel: `${t('axis.label')}. ${t('order.correct')}: ${order.map((id) => ui.title(id)).join(', ')}` },
    fit: fitYears(Math.min(...evs.map((e) => e.lo)), Math.max(...evs.map((e) => e.hi)), 0.1)
  };
}
