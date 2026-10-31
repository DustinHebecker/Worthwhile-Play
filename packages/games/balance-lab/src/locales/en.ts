/** English catalogue and start-screen texts of Weight & Balance (shown before the game loads); every other locale is typed against these keys. The in-game texts are in ../content (ADR 0011). */
export const en = {
  title: 'Weight & Balance',
  tagline: 'Levers, mobiles and stacks: predict whether it tips, build it so it balances, and see why.',
  rules:
    'Three benches, one idea. On the lever, weights hang from hooks on a bar that turns on an axle. On the mobile, bars hang from bars. On the stack, blocks lie over the edge of a table. Predict what happens, or build it so it balances, then press “Let go” and see the reason drawn. A weight twice as far out turns twice as hard: compare kilograms × steps on each side. A stack stands when the centre of mass of everything above each joint lies over what holds it. Strictly, a turning effect (torque) is force × distance; every weight here is pulled by the same gravity, so kilograms × distance gives the same answer. A simplified model: rigid parts, weights hang exactly at the hooks, bars and strings weigh nothing unless a weight is shown, no wind and no bending; friction is never needed, because nothing pushes sideways. A real straight bar would swing down further; here it stops at a slant so you can still see everything. Left and right always mean the left and right of the picture. There is no clock, no score to chase, and you can try as often as you like.',
  'difficulty.easy': 'Easy — small numbers; the turning effects are shown while you build',
  'difficulty.medium': 'Medium — more weights, deeper mobiles; explanations on request',
  'difficulty.hard': 'Hard — bars with their own weight, near-balances, the best possible overhang',
  'mode.label': 'How to play',
  'mode.round': 'Puzzles',
  'mode.free': 'Free bench',
  'bench.label': 'Bench',
  'bench.mixed': 'All three benches',
  'bench.beam': 'Lever',
  'bench.mobile': 'Mobile',
  'bench.stack': 'Stack',
  'tasks.label': 'Tasks',
  'tasks.hint': 'Predict: say what will happen. Build: make it balance.',
  'tasks.mixed': 'Mixed',
  'tasks.predict': 'Predict',
  'tasks.build': 'Build',
  'freeBench.label': 'Which bench'
};

export type BalanceMessages = Record<keyof typeof en, string>;
