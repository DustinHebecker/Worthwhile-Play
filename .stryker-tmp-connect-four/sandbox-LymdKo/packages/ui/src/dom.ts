// @ts-nocheck
type Child = Node | string | number | false | null | undefined;
type Attrs = Record<string, string | number | boolean | EventListener | undefined | null>;

/**
 * Minimal, dependency-free element factory. Text children are always inserted as
 * text nodes (never parsed as HTML), so translated or user-provided strings cannot
 * inject markup.
 *
 *   h('button', { class: 'primary', onclick: start, 'aria-label': t('start') }, t('start'))
 */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (name.startsWith('on') && typeof value === 'function') el.addEventListener(name.slice(2), value);
    else if (value === true) el.setAttribute(name, '');
    else el.setAttribute(name, String(value));
  }
  append(el, ...children);
  return el;
}

export function append(parent: Node, ...children: Child[]): void {
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue;
    parent.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** Polite live-region announcement for screen readers. */
export function announce(region: HTMLElement, message: string): void {
  region.textContent = '';
  // A separate task ensures repeated identical messages are announced again.
  setTimeout(() => {
    region.textContent = message;
  }, 30);
}

/**
 * Roving-tabindex keyboard navigation for a rectangular grid of focusable cells
 * (arrow keys move focus, Home/End jump to row ends). Returns a disposer.
 */
export function gridKeyboard(container: HTMLElement, columns: number, selector = '[data-cell]'): () => void {
  const onKey = (event: KeyboardEvent) => {
    const cells = [...container.querySelectorAll<HTMLElement>(selector)];
    const index = cells.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    const rtl = getComputedStyle(container).direction === 'rtl';
    const deltas: Record<string, number> = {
      ArrowUp: -columns,
      ArrowDown: columns,
      ArrowLeft: rtl ? 1 : -1,
      ArrowRight: rtl ? -1 : 1,
      Home: -(index % columns),
      End: columns - 1 - (index % columns)
    };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    const target = cells[index + delta];
    if (!target) return;
    event.preventDefault();
    for (const cell of cells) cell.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  };
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}
