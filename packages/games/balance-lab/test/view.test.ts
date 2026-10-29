// @vitest-environment jsdom
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { toClient } from '../src/fit';
import { layoutBeam, layoutStack } from '../src/layout';
import game from '../src/index';
import type { BalanceState, FreeState, RoundState } from '../src/rules';
import { mobileBars, stackVerdict, type MobileNode } from '../src/statics';
import { mobileHooks } from '../src/rules';

// The host awaits `preload` for the UI locale before creating the game (ADR 0011).
beforeAll(async () => {
  for (const locale of ['en', 'ar']) await game.preload!(locale);
});

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(settings: Record<string, string>, difficulty = 'easy', locale: 'en' | 'ar' = 'en', seed = 4) {
  const ctx = createTestContext(game as GameModule<unknown>, locale);
  const instance = game.create(ctx.context);
  instance.newGame({ seed, difficulty, settings });
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const state = () => instance.serialize() as BalanceState;
  return { ctx, instance, root, q, state };
}

const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('view', () => {
  it('announces the cursor position after an arrow key in the scene', async () => {
    const m = mount({ mode: 'free', freeBench: 'beam' });
    const wrap = m.q('bl-scene-wrap')!;
    wrap.focus();
    key(wrap, 'ArrowRight');
    await new Promise((r) => setTimeout(r, 60));
    const where = m.q('bl-where')!.textContent!;
    expect(where).not.toBe('');
    expect(m.q('bl-announcer')!.textContent).toBe(where);
  });

  it('renders every bench and kind without missing keys', () => {
    for (const bench of ['beam', 'mobile', 'stack'])
      for (const tasks of ['predict', 'build'])
        for (const d of ['easy', 'medium', 'hard']) {
          const m = mount({ bench, tasks }, d);
          expect(m.q('bl-scene')).not.toBeNull();
          expect(m.ctx.missingKeys).toEqual([]);
          m.instance.dispose();
        }
    for (const freeBench of ['beam', 'mobile', 'stack']) {
      const m = mount({ mode: 'free', freeBench });
      expect(m.q('bl-letgo')).not.toBeNull();
      expect(m.ctx.missingKeys).toEqual([]);
    }
  });

  it('a predict task leaks no answer before "Let go", then explains', () => {
    const m = mount({ bench: 'beam', tasks: 'predict' });
    expect(m.q('bl-outcome')).toBeNull();
    expect(m.root.querySelector('.bl-explain')).toBeNull();
    expect(m.root.querySelector('.bl-tipping, [style*="rotate"]')).toBeNull();
    const s = m.state() as RoundState;
    const opt = m.q(`bl-opt-${s.items[0]!.answer}`) as HTMLInputElement;
    opt.checked = true;
    opt.dispatchEvent(new Event('change', { bubbles: true }));
    m.q('bl-letgo')!.click();
    expect(m.q('bl-outcome')!.dataset.matched).toBe('true');
    expect(m.q('bl-why')!.hasAttribute('open')).toBe(true);
    // Reduced motion: the final pose, never the animation class.
    expect(m.root.querySelector('.bl-tipping')).toBeNull();
  });

  it('builds a lever with the keyboard only and finishes a round once', () => {
    const m = mount({ bench: 'beam', tasks: 'build' });
    for (let i = 0; i < 6; i++) {
      const s = m.state() as RoundState;
      const it = s.items[s.index]!;
      if (it.id === 'beam-hook' || it.id === 'beam-weights') {
        const w = it.witness!;
        const hook = w.bench === 'beam' ? w.s.weights.find((x) => x.free)!.hook : 0;
        const scene = m.q('bl-scene-wrap')!;
        for (let k = 0; k < Math.abs(hook); k++) key(m.q('bl-scene-wrap')!, hook < 0 ? 'ArrowLeft' : 'ArrowRight');
        key(m.q('bl-scene-wrap') ?? scene, 'Enter');
        m.q('bl-letgo')!.click();
        expect(m.q('bl-outcome')!.dataset.status).toBe('solved');
      } else {
        m.q('bl-solution')!.click();
      }
      m.q('bl-next')!.click();
    }
    expect(m.q('bl-summary')).not.toBeNull();
    expect(m.ctx.results).toHaveLength(1);
    m.instance.restore(m.instance.serialize());
    expect(m.ctx.results).toHaveLength(1);
  });

  it('beam-choose: one weight on the marked hook; a new choice replaces it', () => {
    for (let seed = 1; seed < 40; seed++) {
      const m = mount({ bench: 'beam', tasks: 'build' }, 'medium', 'en', seed);
      const s = m.state() as RoundState;
      const it = s.items[0]!;
      if (it.goal?.kind !== 'choose') {
        m.instance.dispose();
        continue;
      }
      const right = it.witness!.s as { weights: { kg: number; free?: boolean }[] };
      const kg = right.weights.find((w) => w.free)!.kg;
      const wrong = it.tray.findIndex((x) => x !== kg);
      m.q(`bl-tray-${wrong}`)!.click();
      m.q('bl-place')!.click();
      const left = (m.state() as RoundState).items[0]!;
      const i = left.tray.filter((x) => x !== it.tray[wrong]).indexOf(kg);
      m.q(`bl-tray-${i}`)!.click();
      m.q('bl-place')!.click();
      const draft = (m.state() as RoundState).items[0]!.draft.s as { weights: { free?: boolean; hook: number }[] };
      expect(draft.weights.filter((w) => w.free)).toHaveLength(1);
      m.q('bl-letgo')!.click();
      expect(m.q('bl-outcome')!.dataset.status).toBe('solved');
      return;
    }
    throw new Error('no beam-choose task found');
  });

  it('mobile-string: move each string with the step buttons until every bar hangs level', () => {
    for (let seed = 1; seed < 60; seed++) {
      const m = mount({ bench: 'mobile', tasks: 'build' }, 'medium', 'en', seed);
      const it = (m.state() as RoundState).items[0]!;
      if (it.id !== 'mobile-string') {
        m.instance.dispose();
        continue;
      }
      const target = mobileBars(it.witness!.s as MobileNode).map((b) => b.string);
      target.forEach((goal, k) => {
        m.q(`bl-bar-${k}`)!.click();
        for (let n = 0; n < 10; n++) {
          const now = mobileBars((m.state() as RoundState).items[0]!.draft.s as MobileNode)[k]!.string;
          if (now === goal) break;
          m.q(now < goal ? 'bl-step-right' : 'bl-step-left')!.click();
        }
      });
      m.q('bl-letgo')!.click();
      expect(m.q('bl-outcome')!.dataset.status).toBe('solved');
      return;
    }
    throw new Error('no mobile-string task found');
  });

  it('refuses "Let go" with parts in the tray and says so', () => {
    const m = mount({ bench: 'mobile', tasks: 'build' });
    m.q('bl-letgo')!.click();
    expect(m.q('bl-notice')).not.toBeNull();
    expect((m.state() as RoundState).items[0]!.outcome).toBeNull();
  });

  it('the free mobile hangs the chosen weight on every tapped hook, from the first tap', () => {
    const m = mount({ mode: 'free', freeBench: 'mobile' });
    const freeWeights = () => mobileHooks((m.state() as FreeState).scene.s as MobileNode).filter((hk) => hk.child && !('bar' in hk.child) && hk.child.free).length;
    m.q('bl-hook-0')!.click();
    expect(freeWeights()).toBe(1);
    m.q('bl-hook-1')!.click();
    expect(freeWeights()).toBe(2);
  });

  it('the free bench: place, let go, hold again, undo', () => {
    const m = mount({ mode: 'free', freeBench: 'beam' });
    m.q('bl-step-right')!.click();
    m.q('bl-place')!.click();
    m.q('bl-letgo')!.click();
    expect((m.state() as FreeState).outcome).toEqual({ bench: 'beam', sides: ['right-down'] });
    m.q('bl-hold')!.click();
    m.q('bl-undo')!.click();
    expect((m.state() as FreeState).scene).toEqual({ bench: 'beam', s: { half: 6, axle: 0, barKg: 0, weights: [] } });
  });

  it('stack-counter: a cube stacks on another or the step buttons jump past it, never half over it', () => {
    for (let seed = 1; seed < 60; seed++) {
      const m = mount({ mode: 'round', bench: 'stack', tasks: 'build' }, 'medium', 'en', seed);
      const item = () => (m.state() as RoundState).items[0]!;
      if (item().id !== 'stack-counter' || item().tray.length < 2) {
        m.instance.dispose();
        continue;
      }
      const xs = () => {
        const d = item().draft;
        return d.bench === 'stack' ? d.s.cubes.map((c) => c.x) : [];
      };
      m.q('bl-tray-0')!.click();
      m.q('bl-place')!.click();
      const [x] = xs() as [number];
      // The second cube goes where the cursor rests, on the first one: they stack.
      m.q('bl-tray-0')!.click();
      m.q('bl-place')!.click();
      expect(xs()).toEqual([x, x]);
      // One step to the right jumps a whole cube width; back onto the first, then past it to the left.
      m.q('bl-step-right')!.click();
      expect(xs()).toEqual([x, x + 6]);
      m.q('bl-step-left')!.click();
      expect(xs()).toEqual([x, x]);
      m.q('bl-step-left')!.click();
      expect(xs()).toEqual([x, x - 6]);
      // A 4 cm step that would end half over the other cube goes on to the next clear spot (here: onto it).
      m.q('bl-step-right4')!.click();
      expect(xs()).toEqual([x, x]);
      expect(m.ctx.missingKeys).toEqual([]);
      return;
    }
    throw new Error('no medium stack-counter task found');
  });

  it('keeps the scene left-to-right on an RTL page', () => {
    const m = mount({ bench: 'stack' }, 'easy', 'ar');
    expect(m.q('bl-root')!.getAttribute('dir')).toBe('rtl');
    expect(m.q('bl-scene-wrap')!.getAttribute('dir')).toBe('ltr');
    expect(m.ctx.missingKeys).toEqual([]);
  });
});

describe('hard stacks (owner decision 2026-10-29)', () => {
  const pick = (m: ReturnType<typeof mount>, id: string) => {
    const opt = m.q(id) as HTMLInputElement;
    opt.checked = true;
    opt.dispatchEvent(new Event('change', { bubbles: true }));
  };

  it('stack-predict asks which joint gives way once a fall is chosen; "Let go" waits for it', () => {
    for (let seed = 1; seed < 80; seed++) {
      const m = mount({ bench: 'stack', tasks: 'predict' }, 'hard', 'en', seed);
      const it = (m.state() as RoundState).items[0]!;
      if (it.answer === 0) {
        m.instance.dispose();
        continue;
      }
      expect(m.q('bl-joints')).toBeNull();
      pick(m, 'bl-opt-0');
      expect(m.q('bl-joints')).toBeNull();
      // Any fall shows every joint (nothing about the answer is given away).
      const other = it.answer === 1 ? 2 : 1;
      pick(m, `bl-opt-${other}`);
      const bodies = (it.scene.s as { bodies: unknown[] }).bodies.length;
      expect(m.root.querySelectorAll('[data-testid^="bl-joint-"]')).toHaveLength(bodies);
      expect(m.q('bl-joints')!.textContent).toContain('Which joint gives way?');
      expect(m.q('bl-joints')!.textContent).toContain('Joint 1: part 1 on the table');
      expect(m.q('bl-joints')!.textContent).toContain('Joint 2: part 2 on part 1');
      pick(m, `bl-opt-${it.answer}`);
      expect((m.q('bl-letgo') as HTMLButtonElement).disabled).toBe(true);
      const joint = stackVerdict(it.scene.s as never).failing[0]!.joint;
      pick(m, `bl-joint-${joint}`);
      expect((m.q('bl-letgo') as HTMLButtonElement).disabled).toBe(false);
      m.q('bl-letgo')!.click();
      expect(m.q('bl-outcome')!.dataset.matched).toBe('true');
      expect(m.q('bl-joint-yours')!.textContent).toBe(`You said joint ${joint + 1}.`);
      expect(m.ctx.missingKeys).toEqual([]);
      return;
    }
    throw new Error('no falling hard stack');
  });

  it('stack-counter: the plank chip slides the plank with the step buttons; the task says so', () => {
    for (let seed = 1; seed < 60; seed++) {
      const m = mount({ bench: 'stack', tasks: 'build' }, 'hard', 'en', seed);
      const item = () => (m.state() as RoundState).items[0]!;
      if (item().id !== 'stack-counter') {
        m.instance.dispose();
        continue;
      }
      expect(m.q('bl-task')!.textContent).toContain('Slide the plank');
      const left = () => (item().draft.s as { bodies: { left: number }[] }).bodies[0]!.left;
      const start = left();
      m.q('bl-body-0')!.click();
      expect(m.q('bl-body-0')!.getAttribute('aria-pressed')).toBe('true');
      expect(m.q('bl-place')).toBeNull();
      m.q('bl-step-left4')!.click();
      m.q('bl-step-left')!.click();
      expect(left()).toBe(start - 5);
      expect(m.q('bl-where')!.textContent).toBe(`Part 1: left end at ${start - 5} cm`);
      // The arrow keys slide it too; Escape lets go of the plank.
      key(m.q('bl-scene-wrap')!, 'ArrowRight');
      expect(left()).toBe(start - 4);
      key(m.q('bl-scene-wrap')!, 'Escape');
      expect(m.q('bl-body-0')!.getAttribute('aria-pressed')).toBe('false');
      // "Show me a solution" slides it back and places the cubes.
      m.q('bl-solution')!.click();
      expect(item().draft).toEqual(item().witness);
      expect(m.ctx.missingKeys).toEqual([]);
      return;
    }
    throw new Error('no hard stack-counter task');
  });

  it('medium stack-counter offers no plank chip', () => {
    for (let seed = 1; seed < 60; seed++) {
      const m = mount({ bench: 'stack', tasks: 'build' }, 'medium', 'en', seed);
      if ((m.state() as RoundState).items[0]!.id !== 'stack-counter') {
        m.instance.dispose();
        continue;
      }
      expect(m.q('bl-body-0')).toBeNull();
      expect(m.root.querySelector('[data-drag^="body:"]')).toBeNull();
      return;
    }
    throw new Error('no medium stack-counter task');
  });
});

describe('dragging with a pointer or a finger (owner decision 2026-10-29)', () => {
  const RECT = { left: 0, top: 0, width: 640, height: 460 };
  const CHIP = { left: 20, top: 600, width: 80, height: 44 };
  const asRect = (r: typeof RECT) => ({ ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r }) as DOMRect;
  let restore: () => void = () => undefined;
  beforeAll(() => {
    // jsdom has no layout: the scene gets a 640 × 460 box, every other element a chip-sized one below it.
    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return asRect(this.getAttribute('data-testid') === 'bl-scene' ? RECT : CHIP);
    });
    restore = () => spy.mockRestore();
  });
  afterAll(() => restore());

  // `buttons`: the primary button (or a finger) is down from pointerdown until pointerup/pointercancel.
  const pointer = (el: EventTarget, type: string, at: { x: number; y: number }, pointerType = 'mouse', buttons = type === 'pointerup' || type === 'pointercancel' ? 0 : 1) =>
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, clientX: at.x, clientY: at.y, button: 0, buttons, pointerType }));
  const chipPoint = { x: 60, y: 622 };
  /** The client point of a picture point of the current (fitted) scene. */
  const client = (m: ReturnType<typeof mount>, x: number, y: number) => toClient(m.q('bl-scene')!.getAttribute('viewBox'), RECT, x, y);
  const hookPoint = (m: ReturnType<typeof mount>, half: number, hook: number) => client(m, layoutBeam(half).x(hook), layoutBeam(half).barY + 30);
  const beamDraft = (m: ReturnType<typeof mount>) => {
    const s = m.state();
    const sc = s.mode === 'free' ? s.scene : s.items[s.index]!.draft;
    return sc.bench === 'beam' ? sc.s : null;
  };

  for (const pointerType of ['mouse', 'touch'])
    it(`drags a tray weight onto the hook under the pointer, previews the snap target and saves (${pointerType})`, () => {
      const m = mount({ bench: 'beam', tasks: 'build' });
      const it0 = (m.state() as RoundState).items[0]!;
      const hook = (it0.witness!.s as { weights: { hook: number; free?: boolean }[] }).weights.find((w) => w.free)!.hook;
      const saves = m.ctx.saveRequests();
      const chip = m.q('bl-tray-0')!;
      pointer(chip, 'pointerdown', chipPoint, pointerType);
      pointer(chip, 'pointermove', hookPoint(m, 4, hook), pointerType);
      expect(m.q('bl-drag-ghost')).not.toBeNull();
      expect(m.q('bl-where')!.textContent).toBe(hook === 0 ? 'Hook: 0 steps at the axle' : `Hook: ${Math.abs(hook)} steps ${hook < 0 ? 'left' : 'right'}`);
      expect(m.root.querySelector('.wp-balance')!.classList.contains('bl-is-dragging')).toBe(true);
      pointer(chip, 'pointerup', hookPoint(m, 4, hook), pointerType);
      expect(m.q('bl-drag-ghost')).toBeNull();
      expect(beamDraft(m)!.weights.filter((w) => w.free).map((w) => w.hook)).toEqual([hook]);
      expect(m.ctx.saveRequests()).toBeGreaterThan(saves);
      m.q('bl-letgo')!.click();
      expect(m.q('bl-outcome')!.dataset.status).toBe('solved');
    });

  it('a press that hardly moves stays a tap: the chip is chosen, nothing is placed', () => {
    const m = mount({ bench: 'beam', tasks: 'build' });
    const chip = m.q('bl-tray-0')!;
    pointer(chip, 'pointerdown', chipPoint);
    pointer(chip, 'pointermove', { x: chipPoint.x + 3, y: chipPoint.y + 2 });
    expect(m.q('bl-drag-ghost')).toBeNull();
    pointer(chip, 'pointerup', { x: chipPoint.x + 3, y: chipPoint.y + 2 });
    chip.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(m.q('bl-tray-0')!.getAttribute('aria-pressed')).toBe('true');
    expect(beamDraft(m)!.weights.some((w) => w.free)).toBe(false);
  });

  it('dropping outside the scene or pressing Escape cancels the drag', () => {
    const m = mount({ bench: 'beam', tasks: 'build' });
    const before = JSON.stringify(m.state());
    let chip = m.q('bl-tray-0')!;
    pointer(chip, 'pointerdown', chipPoint);
    pointer(chip, 'pointermove', hookPoint(m, 4, 2));
    expect(m.q('bl-drag-ghost')).not.toBeNull();
    pointer(chip, 'pointermove', { x: 300, y: 700 });
    expect(m.q('bl-drag-ghost')).toBeNull();
    pointer(chip, 'pointerup', { x: 300, y: 700 });
    expect(JSON.stringify(m.state())).toBe(before);
    chip = m.q('bl-tray-0')!;
    pointer(chip, 'pointerdown', chipPoint);
    pointer(chip, 'pointermove', hookPoint(m, 4, 2));
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    chip.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    expect(m.q('bl-drag-ghost')).toBeNull();
    pointer(chip, 'pointerup', hookPoint(m, 4, 2));
    expect(JSON.stringify(m.state())).toBe(before);
    // The keyboard and tap paths still work afterwards.
    m.q('bl-tray-0')!.click();
    m.q('bl-place')!.click();
    expect(beamDraft(m)!.weights.some((w) => w.free)).toBe(true);
  });

  it('pointercancel, the window losing focus and a missed pointerup each end the drag without a drop (review)', () => {
    const m = mount({ bench: 'beam', tasks: 'build' });
    const before = JSON.stringify(m.state());
    const wp = m.root.querySelector('.wp-balance')!;
    const ends: ((chip: Element) => void)[] = [
      (chip) => pointer(chip, 'pointercancel', hookPoint(m, 4, 2), 'touch'),
      () => window.dispatchEvent(new FocusEvent('blur')),
      (chip) => pointer(chip, 'pointermove', hookPoint(m, 4, 3), 'mouse', 0)
    ];
    for (const end of ends) {
      const chip = m.q('bl-tray-0')!;
      pointer(chip, 'pointerdown', chipPoint);
      pointer(chip, 'pointermove', hookPoint(m, 4, 2));
      expect(wp.classList.contains('bl-is-dragging')).toBe(true);
      end(chip);
      expect(wp.classList.contains('bl-is-dragging')).toBe(false);
      expect(m.q('bl-drag-ghost')).toBeNull();
      // A later pointerup over a hook drops nothing, and a new drag starts afresh.
      pointer(document, 'pointerup', hookPoint(m, 4, 2));
      expect(JSON.stringify(m.state())).toBe(before);
    }
    const chip = m.q('bl-tray-0')!;
    pointer(chip, 'pointerdown', chipPoint);
    pointer(chip, 'pointermove', hookPoint(m, 4, 2));
    pointer(chip, 'pointerup', hookPoint(m, 4, 2));
    expect(beamDraft(m)!.weights.filter((w) => w.free).map((w) => w.hook)).toEqual([2]);
  });

  it('keys and clicks do not edit the scene under a held part; dispose removes the document listeners (review)', () => {
    const m = mount({ mode: 'free', freeBench: 'beam' });
    m.q('bl-place')!.click();
    const before = JSON.stringify(m.state());
    const part = m.root.querySelector('[data-drag="weight:0"]')!;
    pointer(part, 'pointerdown', hookPoint(m, 6, 0));
    pointer(part, 'pointermove', hookPoint(m, 6, 3));
    key(m.q('bl-scene-wrap')!, 'ArrowRight');
    key(m.q('bl-scene-wrap')!, 'Delete');
    m.q('bl-place')!.click();
    expect(JSON.stringify(m.state())).toBe(before);
    expect(m.q('bl-drag-ghost')).not.toBeNull();
    pointer(part, 'pointerup', hookPoint(m, 6, 3));
    expect(beamDraft(m)!.weights).toEqual([{ kg: 2, hook: 3, free: true }]);
    // A drag still held when the game is disposed leaves no listener behind.
    const added = vi.spyOn(document, 'addEventListener');
    const removed = vi.spyOn(document, 'removeEventListener');
    const again = m.root.querySelector('[data-drag="weight:0"]')!;
    pointer(again, 'pointerdown', hookPoint(m, 6, 3));
    pointer(again, 'pointermove', hookPoint(m, 6, 0));
    m.instance.dispose();
    const names = (spy: typeof added) => spy.mock.calls.map((c) => String(c[0])).sort();
    expect(names(removed)).toEqual(names(added));
    expect(names(added)).toEqual(['keydown', 'pointercancel', 'pointermove', 'pointerup']);
    added.mockRestore();
    removed.mockRestore();
  });

  it('drags a hung weight to another hook; the click that ends the drag is not a tap', () => {
    const m = mount({ mode: 'free', freeBench: 'beam' });
    m.q('bl-place')!.click();
    expect(beamDraft(m)!.weights).toEqual([{ kg: 2, hook: 0, free: true }]);
    const part = m.root.querySelector('[data-drag="weight:0"]')!;
    pointer(part, 'pointerdown', hookPoint(m, 6, 0));
    pointer(part, 'pointermove', hookPoint(m, 6, 3));
    pointer(part, 'pointerup', hookPoint(m, 6, 3));
    expect(beamDraft(m)!.weights).toEqual([{ kg: 2, hook: 3, free: true }]);
    const svg = m.q('bl-scene')!;
    const at = hookPoint(m, 6, -5);
    svg.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: at.x, clientY: at.y }));
    expect(beamDraft(m)!.weights).toHaveLength(1);
    // The next real tap acts again.
    svg.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: at.x, clientY: at.y }));
    expect(beamDraft(m)!.weights.map((w) => w.hook)).toEqual([3, -5]);
  });

  it('slides a block of the overhang task sideways by the pointer movement', () => {
    const m = mount({ bench: 'stack', tasks: 'build' });
    for (let i = 0; i < 6 && (m.state() as RoundState).items[(m.state() as RoundState).index]!.id !== 'stack-overhang'; i++) {
      m.q('bl-solution')!.click();
      m.q('bl-next')!.click();
    }
    const s = m.state() as RoundState;
    const draft = s.items[s.index]!.draft.s as { bodies: { left: number }[] };
    const L = layoutStack(draft as never);
    const left = draft.bodies[1]!.left;
    const part = m.root.querySelector('[data-drag="body:1"]')!;
    const from = client(m, L.px(left + 12), L.bodyY(1) + 10);
    const to = client(m, L.px(left + 22), L.bodyY(1) + 10);
    pointer(part, 'pointerdown', from);
    pointer(part, 'pointermove', to);
    expect(m.q('bl-where')!.textContent).toBe(`Part 2: left end at ${left + 10} cm`);
    pointer(part, 'pointerup', to);
    const after = m.state() as RoundState;
    expect((after.items[after.index]!.draft.s as { bodies: { left: number }[] }).bodies[1]!.left).toBe(left + 10);
  });

  it('drags the plank of a hard stack-counter, with its bucket', () => {
    for (let seed = 1; seed < 60; seed++) {
      const m = mount({ bench: 'stack', tasks: 'build' }, 'hard', 'en', seed);
      const item = () => (m.state() as RoundState).items[0]!;
      if (item().id !== 'stack-counter') {
        m.instance.dispose();
        continue;
      }
      const sc = item().draft.s as { bodies: { left: number }[]; bucket: { x: number } };
      const L = layoutStack(sc as never);
      const left = sc.bodies[0]!.left;
      const part = m.root.querySelector('[data-drag="body:0"]')!;
      const from = client(m, L.px(left + 20), L.bodyY(0) + 10);
      const to = client(m, L.px(left + 12), L.bodyY(0) + 10);
      pointer(part, 'pointerdown', from);
      pointer(part, 'pointermove', to);
      pointer(part, 'pointerup', to);
      const after = item().draft.s as typeof sc;
      expect(after.bodies[0]!.left).toBe(left - 8);
      expect(after.bucket.x).toBe(sc.bucket.x - 8);
      expect(m.q('bl-body-0')!.getAttribute('aria-pressed')).toBe('true');
      return;
    }
    throw new Error('no hard stack-counter task');
  });
});
