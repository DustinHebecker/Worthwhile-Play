// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { RcState } from '../src/rules';

const click = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

/** Selects the player's first mobile unit, orders an attack on the first enemy and locks the turn. */
function playOneTurn(root: HTMLElement, instance: GameInstance<RcState>) {
  const state = instance.serialize();
  const unit = state.world.entities.find((e) => e.side === 0 && e.kind !== 'command-post')!;
  const enemy = state.world.entities.find((e) => e.side === 1)!;
  click(root, `rc-unit-${unit.id}`);
  click(root, `rc-attack-${enemy.id}`);
  if (instance.serialize().draft.length !== 1) throw new Error('order was not planned');
  click(root, 'rc-lock');
}

runGameContract(game, { interact: playOneTurn });
