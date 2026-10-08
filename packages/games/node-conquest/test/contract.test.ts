// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { NcState } from '../src/rules';

const clickNode = (root: HTMLElement, id: number) =>
  root.querySelector(`[data-testid="node-${id}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

/** Activates a path from the player's start node to its first neighbour by tapping both nodes. */
function activatePath(root: HTMLElement, instance: GameInstance<NcState>) {
  const state = instance.serialize();
  const start = state.owner.indexOf(0);
  const lanes = [...root.querySelectorAll('[data-testid^="lane-"]')].map((el) => el.getAttribute('data-testid')!.split('-').slice(1).map(Number));
  const [a, b] = lanes.find((pair) => pair.includes(start))!;
  clickNode(root, start);
  clickNode(root, a === start ? b! : a!);
  if (instance.serialize().out[start]!.length !== 1) throw new Error('path was not activated');
}

runGameContract(game, { interact: activatePath });
