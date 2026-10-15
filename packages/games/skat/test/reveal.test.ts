// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameModule } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { newDeal, newGame, type DealState, type SkatState } from '../src/rules';

/**
 * The person (Vorhand, dealer 2) plays a Hand Grand and leads the first trick; the computers follow.
 * Hand game: the Skat stays hidden. Built directly so the test controls whose turn it is.
 */
function leadState(): SkatState {
  const { deal } = newDeal(2, 555);
  deal.bids = ['pass', 'pass', 18];
  deal.skatChoice = 'hand';
  deal.contract = { kind: 'grand', hand: true, schneider: false, schwarz: false, ouvert: false };
  return { ...newGame(42), stage: 'play', deal: deal as DealState };
}

function setup(options: { reducedMotion?: boolean; speed?: string; locale?: 'en' | 'de' } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  if (options.speed) ctx.preferences.set('speed', options.speed);
  const instance = game.create({ ...ctx.context, reducedMotion: options.reducedMotion ?? false });
  const root = ctx.context.root;
  const q = (testid: string) => root.querySelector<HTMLElement>(`[data-testid="${testid}"]`);
  const trick = () => Array.from(root.querySelectorAll('[data-testid="trick"] [data-card]')).map((e) => e.getAttribute('data-card'));
  const lastTrick = () => Array.from(root.querySelectorAll('[data-testid="last-trick"] [data-card]')).map((e) => e.getAttribute('data-card'));
  const playFirst = () => root.querySelector<HTMLElement>('[data-testid="my-hand"] button:not([aria-disabled="true"])')?.click();
  return { ctx, instance, root, q, trick, lastTrick, playFirst };
}

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  // jsdom has no Web Animations API: record what the view asks for.
  animate = vi.fn(() => ({ cancel() {}, finish() {} }));
  (HTMLElement.prototype as unknown as { animate: unknown }).animate = animate;
});
afterEach(() => {
  vi.useRealTimers();
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
  document.body.replaceChildren();
});

describe('Skat reveal queue (computer moves one by one)', () => {
  it('saves at once, then shows each computer card after a calm pause; the full trick stays, then is collected', () => {
    const { ctx, instance, q, trick, lastTrick, playFirst } = setup();
    instance.restore(leadState());
    const saves = ctx.saveRequests();
    playFirst();
    // The decided state is saved immediately (the reveal is presentation only).
    expect(ctx.saveRequests()).toBe(saves + 1);
    const final = instance.serialize() as SkatState;
    const firstTrick = final.deal?.tricks[0] as string[];
    expect(firstTrick).toHaveLength(3);
    // Only the person's own card is shown at once; nothing can be played meanwhile; a skip control is offered.
    expect(trick()).toEqual(firstTrick.slice(0, 1));
    expect(q('reveal-skip')).not.toBeNull();
    expect(document.querySelectorAll('[data-testid="my-hand"] button:not([aria-disabled="true"])')).toHaveLength(0);
    vi.advanceTimersByTime(699);
    expect(trick()).toEqual(firstTrick.slice(0, 1));
    vi.advanceTimersByTime(1);
    expect(trick()).toEqual(firstTrick.slice(0, 2));
    vi.advanceTimersByTime(700);
    // Complete trick: still in the middle with its winner marked; not yet the "last trick".
    expect(trick()).toEqual(firstTrick);
    expect(lastTrick()).toEqual([]);
    expect(document.querySelector('[data-testid="trick"] .sk-trick-card--winner')).not.toBeNull();
    vi.advanceTimersByTime(1000); // hold over: collection slide starts (same picture)
    expect(trick()).toEqual(firstTrick);
    vi.advanceTimersByTime(450);
    expect(lastTrick()).toEqual(firstTrick);
    // The state never changed during the reveal.
    expect(instance.serialize()).toEqual(final);
    vi.runAllTimers();
    expect(q('reveal-skip')).toBeNull();
    expect(trick()).toEqual(final.deal?.trick);
    instance.dispose();
  });

  it('animates cards from where they come from (own hand, computer seat) and the trick toward its winner', () => {
    const { instance, root, playFirst } = setup();
    instance.restore(leadState());
    const mine = root.querySelector('[data-testid="my-hand"] button:not([aria-disabled="true"])')?.getAttribute('data-card');
    playFirst();
    const target = root.querySelector(`[data-testid="trick"] [data-card="${mine}"]`);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.contexts[0]).toBe(target);
    const [frames, opts] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(String(frames[0]?.transform)).toMatch(/^translate\(/);
    expect(frames[1]?.transform).toBe('none');
    expect(opts.duration).toBe(380);
    vi.advanceTimersByTime(700);
    expect(animate).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(700);
    expect(animate).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(1000);
    // Collection: the three cards of the trick slide toward the winner (and stay there until the next picture).
    expect(animate).toHaveBeenCalledTimes(6);
    expect((animate.mock.calls[5] as [Keyframe[], KeyframeAnimationOptions])[1]).toMatchObject({ duration: 450, fill: 'forwards' });
    instance.dispose();
  });

  it('skip: the control, a click on the table or Space/Enter shows the real state at once', () => {
    const { instance, root, q, trick, playFirst } = setup();
    for (const how of ['button', 'table', 'space', 'enter'] as const) {
      instance.restore(leadState());
      playFirst();
      const final = instance.serialize() as SkatState;
      expect(q('reveal-skip')).not.toBeNull();
      if (how === 'button') q('reveal-skip')?.click();
      else if (how === 'table') (root.querySelector('[data-testid="status"]') as HTMLElement).click();
      else {
        const key = how === 'space' ? ' ' : 'Enter';
        const target = root.querySelector('[data-testid="my-hand"] button') as HTMLElement;
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      }
      expect(q('reveal-skip'), how).toBeNull();
      expect(trick(), how).toEqual(final.deal?.trick);
      vi.advanceTimersByTime(100); // the live region's short re-announce
      expect(vi.getTimerCount(), how).toBe(0);
    }
    instance.dispose();
  });

  it('announces each play in order with the same pacing; skipping says the rest at once', () => {
    const { instance, q, playFirst } = setup();
    instance.restore(leadState());
    playFirst();
    const said: string[] = [];
    const listen = () => said.push(q('announcer')?.textContent ?? '');
    vi.advanceTimersByTime(50);
    listen();
    vi.advanceTimersByTime(700);
    listen();
    vi.advanceTimersByTime(700);
    listen();
    expect(said[0]).toMatch(/^You: .+\.$/);
    expect(said[1]).toMatch(/^Computer 1: .+\.$/);
    expect(said[2]).toMatch(/^Computer 2: .+\. (You take|Computer \d takes) the trick \(\d+ points\)\.$/);
    q('reveal-skip')?.click();
    vi.advanceTimersByTime(50);
    const rest = q('announcer')?.textContent ?? '';
    expect(rest).not.toContain(said[2]);
    expect(rest).toMatch(/Your turn: play a card\.$/);
    instance.dispose();
  });

  it('reduced motion: no movement at all, but the same calm order and pauses', () => {
    const { instance, trick, playFirst } = setup({ reducedMotion: true });
    instance.restore(leadState());
    playFirst();
    const first = (instance.serialize() as SkatState).deal?.tricks[0] as string[];
    expect(trick()).toEqual(first.slice(0, 1));
    vi.advanceTimersByTime(700);
    expect(trick()).toEqual(first.slice(0, 2));
    vi.runAllTimers();
    expect(animate).not.toHaveBeenCalled();
    instance.dispose();
  });

  it('speed preference: Instant shows everything at once and is remembered; Fast is quicker', () => {
    const { ctx, instance, q, trick, playFirst } = setup();
    instance.newGame({ seed: 1 });
    q('start')?.click();
    const select = q('option-speed') as HTMLSelectElement;
    expect(select.value).toBe('normal');
    select.value = 'instant';
    select.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get('speed')).toBe('instant');
    expect(q('reveal-skip')).toBeNull(); // switching to Instant also finishes a running reveal
    instance.restore(leadState());
    playFirst();
    expect(q('reveal-skip')).toBeNull();
    expect(trick()).toEqual((instance.serialize() as SkatState).deal?.trick);
    instance.dispose();

    const fast = setup({ speed: 'fast' });
    fast.instance.restore(leadState());
    fast.playFirst();
    const first = (fast.instance.serialize() as SkatState).deal?.tricks[0] as string[];
    vi.advanceTimersByTime(300);
    expect(fast.trick()).toEqual(first.slice(0, 2));
    fast.instance.dispose();
  });

  it('a junk speed preference falls back to Normal', () => {
    const { instance, q } = setup({ speed: 'warp' });
    instance.newGame({ seed: 1 });
    expect((q('option-speed') as HTMLSelectElement).value).toBe('normal');
    instance.dispose();
  });

  it('closing mid-reveal loses nothing: the restored game shows the real state at once', () => {
    const { instance, playFirst } = setup();
    instance.restore(leadState());
    playFirst();
    vi.advanceTimersByTime(700);
    const saved = instance.serialize() as SkatState;
    instance.dispose();
    vi.advanceTimersByTime(100);
    expect(vi.getTimerCount()).toBe(0);
    const again = setup();
    again.instance.restore(saved);
    expect(again.q('reveal-skip')).toBeNull();
    expect(again.trick()).toEqual(saved.deal?.trick);
    expect(again.lastTrick()).toEqual(saved.deal?.tricks[saved.deal.tricks.length - 1]);
    expect(again.instance.serialize()).toEqual(saved);
    again.instance.dispose();
  });

  it('pause finishes the reveal (nothing waits in the background)', () => {
    const { instance, q, playFirst } = setup();
    instance.restore(leadState());
    playFirst();
    instance.pause();
    expect(q('reveal-skip')).toBeNull();
    instance.dispose();
  });

  it('the opening bids of a new deal are revealed one by one too', () => {
    // Find a seed where the computers speak before the person.
    for (let seed = 1; seed < 40; seed++) {
      const s = setup();
      s.instance.newGame({ seed });
      s.q('start')?.click();
      const final = s.instance.serialize() as SkatState;
      const bids = final.deal?.bids.length ?? 0;
      if (bids < 2) {
        s.instance.dispose();
        continue;
      }
      expect(s.root.querySelectorAll('[data-testid="bidding-log"] li')).toHaveLength(0);
      vi.advanceTimersByTime(700);
      expect(s.root.querySelectorAll('[data-testid="bidding-log"] li')).toHaveLength(1);
      vi.runAllTimers();
      expect(s.root.querySelectorAll('[data-testid="bidding-log"] li')).toHaveLength(bids);
      s.instance.dispose();
      return;
    }
    throw new Error('no seed with two computer bids first');
  });
});

describe('the person is addressed in the second person', () => {
  const BAD = /\bDu (gewinnt|verliert|spielt|sagt|nimmt|bekommt|hat|gibt|drückt)\b|\ban Du\b|\bYou (wins|loses|plays|says|passes|takes|picks|puts|deals|won the|lost the)\b/;

  it('declaring and playing a whole game in German and English never produces "Du gewinnt" / "You plays"', () => {
    for (const locale of ['de', 'en'] as const) {
      const { instance, root, q } = setup({ locale, speed: 'instant' });
      const texts: string[] = [];
      const collect = () => {
        vi.advanceTimersByTime(50);
        texts.push(root.textContent ?? '', q('announcer')?.textContent ?? '');
      };
      const { deal } = newDeal(2, 555);
      deal.bids = ['pass', 'pass'];
      instance.restore({ ...newGame(42), stage: 'play', deal: deal as DealState });
      q('bid-play')?.click();
      collect();
      q('skat-hand')?.click();
      collect();
      q('declare-confirm')?.click();
      collect();
      for (let i = 0; i < 12 && !q('result'); i++) {
        root.querySelector<HTMLElement>('[data-testid="my-hand"] button:not([aria-disabled="true"])')?.click();
        collect();
      }
      expect(q('result')).not.toBeNull();
      const all = texts.join('\n');
      expect(all, locale).not.toMatch(BAD);
      expect(all).toMatch(locale === 'de' ? /Du spielst Grand/ : /You play Grand/);
      expect(all).toMatch(locale === 'de' ? /Du (gewinnst|verlierst) mit \d+ Augen/ : /You (won|lost) with \d+ card points/);
      instance.dispose();
    }
  });
});
