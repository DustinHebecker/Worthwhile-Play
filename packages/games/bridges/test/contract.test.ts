// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import { edgesOf, type BridgesState } from '../src/rules';

const click = (root: HTMLElement, testId: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  el.click();
};

runGameContract<BridgesState>(game, {
  // Build a bridge on the first edge (tap one island, then its neighbour), then use Check.
  interact: (root, instance) => {
    const state = instance.serialize();
    const edge = edgesOf(state.size, state.islands)[0];
    if (!edge) throw new Error('puzzle without edges');
    const [r1, c1] = state.islands[edge.a] as number[];
    const [r2, c2] = state.islands[edge.b] as number[];
    click(root, `island-${r1}-${c1}`);
    click(root, `island-${r2}-${c2}`);
    click(root, 'br-check');
  }
});
