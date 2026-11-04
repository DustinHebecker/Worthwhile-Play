// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { newGame, startWave, WEAR_FROM, type TdState } from '../src/rules';

/** The endless game in the view (design § 15.11; review of PR #114). */
const at = (wave: number, core: number, phase: TdState['phase'] = 'build'): TdState => ({ ...newGame(5, 'standard', 'training', 'endless'), wave, core, phase, log: Array.from({ length: wave + 1 }, () => []) });
const text = (root: HTMLElement, id: string) => root.querySelector(`[data-testid="${id}"]`)!.textContent ?? '';
const click = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.click();

function mount(state: TdState) {
  const ctx = createTestContext(game as never);
  const instance = game.create(ctx.context);
  instance.restore(state);
  return { ctx, root: ctx.context.root, instance };
}

describe('endless in the view', () => {
  it('the HUD says endless and announces the wear-down five waves ahead, then each wave’s loss', () => {
    const early = mount(at(WEAR_FROM - 6, 20));
    expect(text(early.root, 'wave')).toContain('endless');
    expect(text(early.root, 'interest')).not.toContain('wears down');
    early.instance.dispose();
    const soon = mount(at(WEAR_FROM - 5, 20));
    expect(text(soon.root, 'interest')).toContain(`From wave ${WEAR_FROM + 1}`);
    soon.instance.dispose();
    const wear = mount(at(WEAR_FROM + 2, 20));
    expect(text(wear.root, 'interest')).toContain('core −3');
    wear.instance.dispose();
  });

  it('worn down: the game finishes once as completed, with how many waves were held', () => {
    const s = startWave(at(WEAR_FROM + 2, 3));
    s.run!.pending = [];
    const { ctx, root, instance } = mount(s);
    click(root, 'instant');
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]).toMatchObject({ outcome: 'completed', stats: { waves: WEAR_FROM + 3 } });
    expect(text(root, 'status')).toContain(`Waves held: ${WEAR_FROM + 3}`);
    instance.dispose();
  });

  it('ending after the core fell: completed in endless, lost otherwise', () => {
    const endless = mount(at(30, 0, 'lost'));
    click(endless.root, 'give-up');
    expect(endless.ctx.results[0]).toMatchObject({ outcome: 'completed', stats: { waves: 30 } });
    expect(text(endless.root, 'status')).toContain('Waves held: 30');
    endless.instance.dispose();
    const plain = mount({ ...newGame(5), wave: 3, core: 0, phase: 'lost', log: [[], [], [], []] });
    click(plain.root, 'give-up');
    expect(plain.ctx.results[0]).toMatchObject({ outcome: 'lost' });
    plain.instance.dispose();
  });
});
