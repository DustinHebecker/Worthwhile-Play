// @vitest-environment jsdom
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import { afterEach, describe, expect, it } from 'vitest';
import game from '../src/index';
import type { BalanceState, FreeState, RoundState } from '../src/rules';
import { mobileBars, type MobileNode } from '../src/statics';
import { mobileHooks } from '../src/rules';

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

  it('keeps the scene left-to-right on an RTL page', () => {
    const m = mount({ bench: 'stack' }, 'easy', 'ar');
    expect(m.q('bl-root')!.getAttribute('dir')).toBe('rtl');
    expect(m.q('bl-scene-wrap')!.getAttribute('dir')).toBe('ltr');
    expect(m.ctx.missingKeys).toEqual([]);
  });
});
