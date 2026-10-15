/**
 * Small preview graphics for the game cards on the home page (owner request 2026-10-15: "kleine Vorschaubilder").
 *
 * Every preview is an original, hand-drawn schematic of the game's own board or screen, written here as inline SVG
 * (no third-party art, no copied layouts). They are one family: the same 96×64 viewBox, the same stroke weights and a
 * handful of style classes (see `.game-preview` in styles.css) that map to the `--wp-*` design tokens, so they follow
 * light, dark and forced-colours (high-contrast) mode. They carry no information: decorative, `aria-hidden`, and the
 * card's title and tagline stay its accessible name.
 *
 * RTL: previews are not mirrored. They show game content with its own direction (boards, letters, digits, arrows,
 * laser paths) and the games do not mirror their boards either. Only the few pictures made of nothing but abstract
 * text lines and flow arrows (MIRRORED below) are flipped in RTL so their "reading direction" matches the page.
 *
 * Class vocabulary (fills / strokes):
 *   c cell (surface + muted outline)  e raised tile (surface-2 + muted outline)  o object (surface + ink outline)
 *   d muted fill  i ink fill  a accent fill  w warm (focus) fill  p1/p2 player fills  sf contrast fill on a dark fill
 *   k ink line  g thin muted line  tx text line  al accent line  x1/x2 player lines  sk contrast line  ds dashed
 *   t digit/letter  ts contrast text  tl large text
 */

const n = (v: number) => Math.round(v * 10) / 10;
const R = (x: number, y: number, w: number, h: number, c: string, rx = 0) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${rx}"` : ''} class="${c}"/>`;
const C = (x: number, y: number, r: number, c: string) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" class="${c}"/>`;
const L = (x1: number, y1: number, x2: number, y2: number, c = 'k') =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${c}"/>`;
const P = (d: string, c: string) => `<path d="${d}" class="${c}"/>`;
const T = (x: number, y: number, s: string | number, c = 't') => `<text x="${n(x)}" y="${n(y)}" class="${c}">${s}</text>`;
const G = (x: string, inner: string) => `<g transform="${x}">${inner}</g>`;

/** Line with a small open arrowhead at (x2, y2). */
const arrow = (x1: number, y1: number, x2: number, y2: number, c = 'k') => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (d: number) => n(x2 - 5 * Math.cos(a + d));
  const hy = (d: number) => n(y2 - 5 * Math.sin(a + d));
  return L(x1, y1, x2, y2, c) + P(`M${hx(0.5)} ${hy(0.5)}L${n(x2)} ${n(y2)}L${hx(-0.5)} ${hy(-0.5)}`, c);
};
const tri = (x: number, y: number, r: number, c: string, down = false) => {
  const s = down ? -1 : 1;
  return P(`M${n(x)} ${n(y - s * r)}L${n(x + r)} ${n(y + s * r * 0.8)}H${n(x - r)}Z`, c);
};
const diamond = (x: number, y: number, r: number, c: string) => P(`M${n(x)} ${n(y - r)}L${n(x + r)} ${n(y)}L${n(x)} ${n(y + r)}L${n(x - r)} ${n(y)}Z`, c);
const star = (x: number, y: number, r: number, c: string) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${n(x + rr * Math.cos(a))} ${n(y + rr * Math.sin(a))}`;
  }
  return P(`${d}Z`, c);
};
const check = (x: number, y: number, c = 'al') => P(`M${x - 4} ${y}l3 3 6-7`, c);
const cross = (x: number, y: number, c = 'k') => P(`M${x - 3.5} ${y - 3.5}l7 7m0-7l-7 7`, c);
/** A simple standing figure (head + shoulders), centred on x, head at y. */
const figure = (x: number, y: number, s: number, c: string) =>
  C(x, y, 2.8 * s, c) + P(`M${n(x - 4.5 * s)} ${n(y + 11 * s)}v-2a${n(4.5 * s)} ${n(4.5 * s)} 0 0 1 ${n(9 * s)} 0v2z`, c);
/** Cells of a grid; `cls(col, row)` picks each cell's class. */
const grid = (x: number, y: number, cols: number, rows: number, s: number, cls: (col: number, row: number) => string = () => 'c') => {
  let out = '';
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) out += R(x + q * s, y + r * s, s, s, cls(q, r));
  return out;
};
/** Several text lines (decorative "writing"). */
const lines = (x: number, y: number, widths: number[], gap = 6, c = 'tx') => widths.map((w, i) => L(x, y + i * gap, x + w, y + i * gap, c)).join('');

const PREVIEWS: Record<string, () => string> = {
  // Tactical map: a river with a bridge, a relay mast, own units (accent, chevron) and opposing units (diamonds), planned orders.
  'relay-command': () =>
    tri(10, 12, 4, 'd') + tri(18, 9, 4, 'd') + tri(14, 20, 4, 'd') +
    P('M62 0C56 18 72 38 64 64', 'x1') + R(56, 29, 14, 6, 'o', 1) +
    L(38, 8, 38, 26) + P('M33 11a6 6 0 0 1 10 0M30 8a10 10 0 0 1 16 0', 'g') +
    R(12, 40, 12, 9, 'a', 2) + P('M14 46.5l4-3 4 3', 'sk') + R(26, 50, 12, 9, 'a', 2) + P('M28 56.5l4-3 4 3', 'sk') +
    diamond(82, 16, 6, 'p2') + C(82, 16, 1.6, 'sf') + diamond(86, 40, 6, 'p2') + C(86, 40, 1.6, 'sf') +
    arrow(25, 42, 52, 32, 'al ds') + arrow(78, 22, 70, 30, 'x2 ds'),
  // Nonogram: 4×4 grid with row and column number clues, part of the picture filled in.
  nonogram: () => {
    const pic = ['0110', '1111', '0110', '0100'];
    // The last row is still unsolved.
    return grid(38, 22, 4, 4, 9) +
      pic.slice(0, 3).map((row, r) => [...row].map((v, q) => (v === '1' ? R(39 + q * 9, 23 + r * 9, 7, 7, 'i') : '')).join('')).join('') +
      [1, 4, 3, 1].map((v, q) => T(42.5 + q * 9, 15.5, v)).join('') +
      [2, 4, 2, 1].map((v, r) => T(30, 26.5 + r * 9, v)).join('');
  },
  // Orbit Links: nodes of three factions (circle, triangle, square) joined by orbital lanes, a stream of ships on one lane.
  'node-conquest': () =>
    P('M18 44Q22 22 48 20M48 20Q76 18 78 42M50 52Q68 58 78 42M18 44L50 52', 'g') +
    C(18, 44, 10, 'g ds') + C(18, 44, 7, 'a') + C(50, 52, 5, 'a') +
    R(42, 14, 12, 12, 'o', 1) + tri(78, 41, 8, 'p2') +
    C(21, 35, 1.6, 'a') + C(25, 29, 1.6, 'a') + C(30, 25, 1.6, 'a') + C(36, 22, 1.6, 'a'),
  // Chess: a board corner with a white rook and pawn and a black pawn, and a move hint.
  chess: () => {
    const sq = 13;
    const pawn = (x: number, y: number, c: string) => C(x + 6.5, y + 4, 2.6, c) + P(`M${x + 4.3} ${y + 6.8}L${x + 2.5} ${y + 11.5}H${x + 10.5}L${x + 8.7} ${y + 6.8}Z`, c);
    const rook = (x: number, y: number, c: string) =>
      P(`M${x + 2} ${y + 12}h9v-2h-1.5v-4.5h1.5v-4h-2v1.5h-1.5v-1.5h-2v1.5h-1.5v-1.5h-2v4h1.5v4.5h-1.5z`, c);
    return grid(22, 6, 4, 4, sq, (q, r) => ((q + r) % 2 ? 'd' : 'c')) +
      rook(22, 6 + 3 * sq, 'o') + pawn(22 + 2 * sq, 6 + 2 * sq, 'o') + pawn(22 + sq, 6 + sq, 'i') +
      C(22 + 3 * sq + 6.5, 6 + sq + 6.5, 2, 'a');
  },
  // Mine Logic: revealed cells with counts next to covered cells, one of them flagged.
  minesweeper: () => {
    const nums: Record<string, number> = { '0,0': 1, '1,0': 1, '2,0': 2, '2,1': 3, '1,2': 1, '2,2': 2 };
    return grid(18, 14, 5, 3, 12, (q) => (q > 2 ? 'd' : 'c')) +
      Object.entries(nums).map(([k, v]) => { const [q, r] = k.split(',').map(Number) as [number, number]; return T(24 + q * 12, 20.5 + r * 12, v); }).join('') +
      L(58, 28, 58, 36, 'sk') + P('M58 28l5 2.5-5 2.5z', 'w');
  },
  // Letter Logic: a guessed word with tile states (placed, elsewhere, absent), then the next row being typed.
  'word-guess': () => {
    const xs = [10, 26, 42, 58, 74];
    const states = ['a', 'd', 'c pr', 'd', 'a'];
    return xs.map((x, i) => R(x, 12, 13, 13, states[i] ?? 'c', 2)).join('') +
      [...'PLANT'].map((ch, i) => T(xs[i]! + 6.5, 19, ch, states[i] === 'c pr' ? 't' : 't ts')).join('') +
      xs.map((x) => R(x, 32, 13, 13, 'c', 2)).join('') + T(16.5, 39, 'P') + L(30, 35, 30, 42, 'k');
  },
  // Stack Duel: odd-shaped stones balanced on one tower, the next stone about to be placed.
  'stack-duel': () =>
    R(16, 54, 64, 5, 'd', 1) +
    P('M28 54L31 43L56 41L61 54Z', 'o') + P('M36 41L33 32L52 30L55 41Z', 'a') + P('M38 30L44 21L54 25L50 30Z', 'o') +
    P('M60 6L72 4L74 12L62 14Z', 'a') + arrow(64, 17, 55, 25, 'g ds'),
  // Skyscrapers: 3×3 grid of towers of heights 1–3 with the visibility clues around the edge.
  skyscrapers: () => {
    const v = [[1, 2, 3], [3, 1, 2], [2, 3, 1]];
    return grid(34, 16, 3, 3, 14) +
      v.map((row, r) => row.map((h, q) => R(38 + q * 14, 16 + r * 14 + 13 - (3 + 3 * h), 6, 3 + 3 * h, 'i')).join('')).join('') +
      [2, 2, 1].map((c, q) => T(41 + q * 14, 10, c)).join('') + [3, 1, 2].map((c, r) => T(27, 23 + r * 14, c)).join('');
  },
  // Lights Out: a grid of round buttons, some lit.
  'lights-out': () => {
    const lit = ['1010', '1100', '0101'];
    let out = '';
    for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
      const x = 27 + q * 14, y = 18 + r * 14;
      out += lit[r]?.[q] === '1' ? C(x, y, 6, 'w') + C(x, y, 2, 'sf') : C(x, y, 6, 'c');
    }
    return out;
  },
  // Crate Pusher: walls, the pusher, crates (one already on its goal) and empty goals.
  sokoban: () => {
    const s = 9, x0 = 12, y0 = 10;
    const crate = (q: number, r: number, c: string) => R(x0 + q * s + 1, y0 + r * s + 1, 7, 7, c, 1) + P(`M${x0 + q * s + 1} ${y0 + r * s + 1}l7 7m0-7l-7 7`, 'g');
    const goal = (q: number, r: number) => C(x0 + q * s + 4.5, y0 + r * s + 4.5, 2.5, 'al');
    return grid(x0, y0, 8, 5, s, (q, r) => (q === 0 || r === 0 || q === 7 || r === 4 || (q === 4 && r === 3) ? 'd' : 'c')) +
      goal(5, 2) + goal(6, 3) + crate(2, 2, 'o') + crate(2, 3, 'o') + crate(4, 1, 'a') + C(x0 + 1 * s + 4.5, y0 + 2 * s + 4.5, 3.2, 'i');
  },
  // Laser Paths: an emitter, a beam reflected by two mirrors into a target, a blocking wall and an unlit target.
  'laser-circuit': () =>
    R(5, 12, 11, 8, 'i', 1.5) + L(16, 16, 46, 16, 'al') + L(46, 16, 46, 46, 'al') + L(46, 46, 77, 46, 'al') +
    L(41, 11, 51, 21) + L(41, 51, 51, 41) + R(64, 20, 10, 10, 'd') +
    C(84, 46, 6, 'o') + C(84, 46, 3, 'a') + C(84, 14, 6, 'o') + C(84, 14, 2, 'g'),
  // Circuit: rotatable tiles; the source powers a path of wires (accent) to a lamp, one tile still turned wrong.
  'circuit-puzzle': () =>
    grid(21, 14, 3, 2, 18) +
    L(57, 23, 66, 23, 'tx') + L(66, 23, 66, 32, 'tx') + L(21, 41, 39, 41, 'tx') +
    L(30, 23, 48, 23, 'al') + L(48, 23, 48, 41, 'al') + L(48, 41, 66, 41, 'al') +
    R(25, 19, 10, 8, 'i', 1) + L(28, 23, 32, 23, 'sk') + L(30, 21, 30, 25, 'sk') +
    C(66, 41, 4.5, 'w') + C(66, 41, 4.5, 'k'),
  // Memory: four cards, two face down and a matched pair face up.
  memory: () =>
    [10, 50].map((x) => R(x, 21, 16, 22, 'a', 2) + R(x + 3, 24, 10, 16, 'sk', 1)).join('') +
    [30, 70].map((x) => R(x, 21, 16, 22, 'o', 2) + star(x + 8, 32, 5.5, 'w')).join(''),
  // Code Breaker: rows of code pegs with black/white feedback pins, the last row still empty.
  mastermind: () => {
    const rows = [['p1', 'p2', 'a', 'w'], ['a', 'p1', 'w', 'p2'], ['c', 'c', 'c', 'c']];
    const fb = [['i', 'o', 'g', 'g'], ['i', 'i', 'o', 'g']];
    return rows.map((row, r) => row.map((c, q) => C(20 + q * 12, 14 + r * 18, c === 'c' ? 3 : 4.5, c)).join('') +
      (fb[r] ?? []).map((c, k) => C(72 + (k % 2) * 7, 10.5 + r * 18 + Math.floor(k / 2) * 7, 2, c)).join('')).join('') +
      L(65, 6, 65, 58, 'g');
  },
  // Black Box: a number goes in, a hidden rule acts on it, a number comes out.
  'black-box': () =>
    T(10, 32, 3) + arrow(17, 32, 29, 32) + R(31, 16, 34, 32, 'e k', 3) + T(48, 32.5, '?', 't tl') + arrow(67, 32, 79, 32) + T(87, 32, 7),
  // Rule Hunt: number triples tested against the hidden rule: one fits, one does not, one still open.
  'rule-discovery': () =>
    [[2, 4, 6], [5, 3, 1], [1, 2]].map((nums, r) =>
      [0, 1, 2].map((q) => R(14 + q * 16, 5 + r * 19, 14, 14, nums[q] === undefined ? 'c ds' : 'o', 2) + (nums[q] === undefined ? '' : T(21 + q * 16, 12 + r * 19, nums[q]!))).join('')).join('') +
    check(70, 12) + cross(70, 31) + T(70, 50, '?'),
  // Network Detective: a small network, the shortest route highlighted, a bottleneck node circled.
  'graph-detective': () => {
    const p: [number, number][] = [[12, 32], [32, 14], [34, 50], [56, 32], [80, 14], [84, 50]];
    const e = [[0, 2], [2, 3], [1, 4], [4, 5]];
    const path = [[0, 1], [1, 3], [3, 5]];
    const at = (i: number) => p[i]!;
    return e.map(([a, b]) => L(...at(a!), ...at(b!), 'g')).join('') + path.map(([a, b]) => L(...at(a!), ...at(b!), 'al')).join('') +
      L(...at(3), ...at(4), 'g') + C(56, 32, 8.5, 'k ds') +
      p.map(([x, y], i) => C(x, y, 4.5, [0, 1, 3, 5].includes(i) ? 'a' : 'o')).join('');
  },
  // Robot Program: a robot on a grid, its planned path to the goal, and the command chips that make up the program.
  'logic-path': () =>
    grid(6, 10, 4, 3, 12) + P('M12 40V16H48', 'al ds') + star(48, 16, 4.5, 'w') +
    R(7.5, 35.5, 9, 9, 'a', 2) + C(10.5, 39, 1, 'sf') + C(13.5, 39, 1, 'sf') +
    [10, 26, 42].map((y) => R(64, y, 24, 12, 'e', 3)).join('') +
    arrow(76, 20, 76, 12) + P('M73 37v-3a3 3 0 0 1 3-3h4', 'k') + P('M78 29l2 2-2 2', 'k') + arrow(76, 52, 76, 44),
  // Flow Lab: two tanks joined by a pipe with a valve.
  'systems-puzzle': () =>
    R(8, 24, 18, 24, 'p1') + R(70, 38, 18, 10, 'p1') + R(8, 8, 18, 40, 'k') + R(70, 22, 18, 26, 'k') +
    R(26, 41, 44, 6, 'e') + P('M43 38L53 50V38L43 50Z', 'i') + L(48, 44, 48, 32) + L(44, 32, 52, 32) + arrow(30, 56, 64, 56, 'g'),
  // Fix the Machine: a chain of rule boxes, one marked as faulty, and a wrench.
  'debug-system': () =>
    [4, 37, 70].map((x) => R(x, 12, 22, 18, x === 37 ? 'e k ds' : 'o', 3) + lines(x + 4, 18, [14, 10])).join('') +
    arrow(26, 21, 36, 21) + arrow(59, 21, 69, 21) + C(59, 12, 5, 'w') + T(59, 12.5, '!', 't ts') +
    P('M38 56L49 45', 'k') + P('M47 41a6 6 0 0 0 7 7l2-2-3-1-1-3 2-2a6 6 0 0 0-7 1z', 'i'),
  // Logic Grid: a clue matrix with categories on two edges, filled with checks and crosses.
  'constraint-grid': () => {
    const m = ['vxxx', 'xvx.', 'x..x'];
    return grid(34, 20, 4, 3, 11) +
      [C(39.5, 13, 3.5, 'd'), R(47, 9.5, 7, 7, 'd'), tri(61.5, 13.5, 4, 'd'), diamond(72.5, 13, 4, 'd')].join('') +
      [figure(26, 23, 0.6, 'i'), figure(26, 34, 0.6, 'p1'), figure(26, 45, 0.6, 'p2')].join('') +
      m.map((row, r) => [...row].map((v, q) => (v === 'v' ? check(39.5 + q * 11, 24 + r * 11) : v === 'x' ? cross(39.5 + q * 11, 25.5 + r * 11, 'g') : '')).join('')).join('');
  },
  // Proof Chain: facts combine by rules into new facts until the goal is proved.
  'minimal-proof': () =>
    R(8, 4, 16, 13, 'o', 2) + T(16, 10.5, 'A') + R(34, 4, 16, 13, 'o', 2) + T(42, 10.5, 'B') +
    R(21, 26, 16, 13, 'o', 2) + T(29, 32.5, 'C') + R(62, 26, 16, 13, 'o', 2) + T(70, 32.5, 'D') +
    arrow(16, 17, 26, 25) + arrow(42, 17, 32, 25) + arrow(31, 39, 42, 47) + arrow(68, 39, 56, 47) +
    R(40, 47, 18, 14, 'o k', 3) + star(49, 54, 5, 'w'),
  // Bridges: numbered islands joined by single and double bridges.
  bridges: () =>
    L(21, 12, 43, 12) + L(21, 16, 43, 16) + L(14, 21, 14, 43) + L(48, 21, 48, 43) + L(52, 21, 52, 43) + L(57, 14, 75, 14) + L(21, 50, 43, 50) +
    [[14, 14, 3], [14, 50, 2], [50, 14, 5], [82, 14, 1], [50, 50, 3]].map(([x, y, v]) => C(x!, y!, 7, 'o') + T(x!, y! + 0.5, v!)).join('') +
    C(82, 50, 7, 'o ds') + T(82, 50.5, 1),
  // Unblock: a frame with an exit; blocks in the way of the star block.
  'sliding-blocks': () =>
    P('M72 20V8H12V56H72V32', 'k') +
    R(13.5, 21.5, 21, 9, 'a', 2) + star(24, 26, 3.5, 'sf') +
    R(49.5, 9.5, 9, 21, 'o', 2) + R(13.5, 33.5, 9, 21, 'o', 2) + R(25.5, 45.5, 33, 9, 'o', 2) + R(61.5, 33.5, 9, 21, 'o', 2) +
    arrow(76, 26, 89, 26, 'al'),
  // River Crossing: two banks, a boat carrying a passenger and a box, more passengers waiting.
  'river-crossing': () =>
    R(0, 0, 20, 64, 'e') + R(76, 0, 20, 64, 'e') +
    P('M26 14q4-3 8 0t8 0t8 0t8 0t8 0M26 56q4-3 8 0t8 0t8 0t8 0t8 0', 'g') +
    P('M32 40H64L59 48H37Z', 'o') + figure(42, 29, 1, 'i') + R(50, 32, 7, 7, 'o', 1) +
    figure(10, 16, 1, 'p1') + figure(10, 40, 0.75, 'p2') + R(82, 26, 8, 8, 'w', 1) + arrow(36, 22, 56, 22, 'al ds'),
  // Review: a stack of flash cards, the front one asking a question, and a turn-over arrow.
  review: () =>
    R(32, 8, 44, 30, 'e', 3) + R(22, 18, 44, 32, 'o', 3) + T(44, 34.5, '?', 't tl') +
    P('M78 50a9 9 0 0 0 0-18', 'k') + P('M75 29l3 3-3 3', 'k'),
  // Sequence Memory: tiles that lit up in order 1–2–3, with the order traced.
  'sequence-memory': () => {
    const lit: Record<string, number> = { '0,0': 1, '2,1': 2, '1,2': 3 };
    let out = '';
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const v = lit[`${q},${r}`];
      out += R(26 + q * 16, 6 + r * 18, 14, 14, v ? 'a' : 'c', 2) + (v ? T(33 + q * 16, 13 + r * 18, v, 't ts') : '');
    }
    return out + P('M40 15L57 26M58 38L46 46', 'k ds');
  },
  // Pattern Memory: a pattern of cells to memorise, then the same grid being recalled.
  'spatial-memory': () => {
    const pat = ['0,0', '3,0', '2,1', '1,2', '3,3'];
    const recalled = pat.slice(0, 3);
    return grid(8, 16, 4, 4, 8, (q, r) => (pat.includes(`${q},${r}`) ? 'a' : 'c')) + arrow(43, 32, 53, 32) +
      grid(56, 16, 4, 4, 8, (q, r) => (recalled.includes(`${q},${r}`) ? 'a' : 'c'));
  },
  // Signal Watch: the target symbol, and a calm stream of symbols in which it appears once.
  'signal-watch': () =>
    R(6, 4, 16, 16, 'e', 2) + tri(14, 12.5, 5, 'i') +
    C(12, 38, 5, 'd') + R(23, 33, 10, 10, 'd') + diamond(44, 38, 5.5, 'd') + tri(60, 38.5, 5.5, 'i') + R(52, 30, 16, 16, 'al', 3) +
    star(76, 38, 6, 'd') + tri(90, 37, 5, 'd', true) + arrow(84, 56, 14, 56, 'g'),
  // Stay on Task: a number to sort as even or odd, surrounded by tempting extras (badge, star, message).
  'distractor-control': () =>
    R(34, 8, 28, 26, 'o', 3) + T(48, 21.5, 7, 't tl') + R(22, 42, 24, 14, 'e', 3) + R(50, 42, 24, 14, 'e', 3) +
    C(31, 49, 1.8, 'i') + C(37, 49, 1.8, 'i') + C(62, 49, 1.8, 'i') +
    star(14, 16, 6, 'w') + R(74, 8, 16, 11, 'o', 1) + P('M74 8l8 6 8-6', 'g') + C(84, 36, 5, 'p2') + C(12, 40, 4, 'd'),
  // Four in a Row: a board with discs, the fourth disc of a column dropping in.
  'connect-four': () => {
    const board: Record<string, string> = { '0,3': 'p2', '1,3': 'p1', '1,2': 'p1', '1,1': 'p1', '2,3': 'p2', '2,2': 'p2', '3,3': 'p1', '4,3': 'p2' };
    let out = R(23, 17, 54, 43, 'a', 3);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 5; q++) {
      const c = board[`${q},${r}`] ?? 'c';
      out += C(30 + q * 10, 24 + r * 10, 4, c) + (c === 'p2' ? C(30 + q * 10, 24 + r * 10, 1.8, 'sk') : '');
    }
    return out + C(40, 7, 4, 'p1') + L(46, 4, 46, 11, 'g');
  },
  // Tic-Tac-Toe: a 3×3 grid in mid-game.
  'tic-tac-toe': () => {
    const x = (q: number, r: number) => P(`M${32 + q * 12} ${16 + r * 12}l8 8m0-8l-8 8`, 'x1');
    const o = (q: number, r: number) => C(36 + q * 12, 20 + r * 12, 4, 'x2');
    return L(42, 14, 42, 50) + L(54, 14, 54, 50) + L(30, 26, 66, 26) + L(30, 38, 66, 38) + x(0, 0) + x(2, 0) + x(0, 2) + o(1, 1) + o(1, 0);
  },
  // Slitherlink: a dot lattice with numbers and part of one closed loop that fits them.
  slitherlink: () => {
    const X = (v: number) => 20 + v * 14, Y = (v: number) => 11 + v * 14;
    const loop = [[0, 0], [3, 0], [3, 1], [4, 1], [4, 3], [1, 3], [1, 1], [0, 1]].map(([a, b], i) => `${i ? 'L' : 'M'}${X(a!)} ${Y(b!)}`).join('');
    let dots = '';
    for (let b = 0; b <= 3; b++) for (let a = 0; a <= 4; a++) dots += C(X(a), Y(b), 1.4, 'i');
    const nums = [[0, 0, 3], [1, 0, 1], [3, 0, 2], [0, 1, 2], [3, 2, 2], [2, 2, 1]];
    return P(`${loop}Z`, 'al') + dots + nums.map(([a, b, v]) => T(X(a!) + 7, Y(b!) + 7.5, v!)).join('');
  },
  // N-back: a sequence of shape cards; the newest one matches the one two steps back.
  'n-back': () =>
    R(6, 24, 16, 20, 'e', 2) + R(10, 30, 8, 8, 'd') + R(28, 24, 16, 20, 'e', 2) + tri(36, 34.5, 5, 'i') +
    R(50, 24, 16, 20, 'e', 2) + C(58, 34, 4.5, 'd') + R(72, 24, 16, 20, 'o k', 2) + tri(80, 34.5, 5, 'i') +
    P('M80 20Q58 2 36 20', 'al ds') + P('M37 14l-1 6 6-1', 'al'),
  // Visual Search: one T hidden among rotated Ls, found with the magnifier.
  'visual-search': () => {
    const l = (x: number, y: number, rot: number) => G(`translate(${x} ${y}) rotate(${rot})`, P('M-3 -5V5H4', 'k'));
    return l(14, 14, 0) + l(34, 18, 90) + l(54, 12, 180) + l(76, 14, 270) + l(18, 46, 180) + l(38, 48, 0) + l(86, 30, 90) + l(84, 54, 0) +
      G('translate(62 38)', P('M-5 -5H5M0 -5V6', 'k')) + C(62, 38, 9, 'al') + L(68.5, 44.5, 75, 51, 'al');
  },
  // Keep in Mind: sort the shape into the round or angular bin, while remembering the special star.
  'prospective-memory': () =>
    R(36, 6, 24, 24, 'o', 3) + C(48, 18, 6, 'i') + R(10, 44, 30, 16, 'e', 3) + C(25, 52, 4, 'd') +
    R(56, 44, 30, 16, 'e', 3) + R(63, 48.5, 7, 7, 'd') + tri(77, 52.5, 4, 'd') + arrow(42, 31, 30, 41) +
    star(82, 14, 6, 'w') + C(82, 14, 10, 'k ds'),
  // Vivid Links: two pictures linked together and imagined as one scene.
  association: () =>
    R(8, 6, 26, 26, 'o', 3) + C(21, 19, 5, 'w') + P('M21 9.5v2.5M21 26v2.5M11.5 19h2.5M28 19h2.5', 'g') +
    R(62, 6, 26, 26, 'o', 3) + P('M75 11l-9 8v8h18v-8z', 'i') +
    `<ellipse cx="44" cy="19" rx="6" ry="3.5" class="k"/><ellipse cx="52" cy="19" rx="6" ry="3.5" class="k"/>` +
    P('M30 60a6 6 0 0 1 1-12 8 8 0 0 1 14-5 8 8 0 0 1 16 3 6 6 0 0 1 4 14z', 'o') + C(42, 53, 3, 'w') + P('M55 49l-4 4v4h8v-4z', 'i'),
  // Ambiguity Detector: a request in a speech bubble with an open gap that needs a question.
  'ambiguity-detector': () =>
    P('M8 6h80a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H32l-10 10v-10H8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z', 'o') +
    L(12, 15, 80, 15, 'tx') + L(12, 24, 32, 24, 'tx') + R(36, 19.5, 20, 9, 'al ds', 2) + L(60, 24, 82, 24, 'tx') + L(12, 33, 58, 33, 'tx') +
    C(82, 54, 7, 'w') + T(82, 54.5, '?', 't ts'),
  // Audience Switch: one message, retold for two different listeners.
  'audience-switch': () =>
    R(4, 16, 24, 32, 'o', 2) + lines(8, 23, [16, 12, 16, 9]) + arrow(31, 28, 46, 18, 'g') + arrow(31, 36, 46, 46, 'g') +
    figure(54, 11, 1, 'p1') + R(66, 4, 26, 16, 'e', 3) + lines(70, 10, [18, 12]) +
    figure(54, 43, 0.75, 'p2') + R(66, 38, 26, 12, 'e', 3) + lines(70, 44, [10]),
  // Deep Read: a page of text read closely, one passage marked, a magnifier.
  'deep-read': () =>
    R(10, 4, 46, 56, 'o', 2) + lines(15, 12, [36, 32, 36, 26], 7) + L(15, 40, 51, 40, 'al') + lines(15, 47, [30, 20], 7) +
    C(70, 28, 9, 'k') + L(76.5, 34.5, 86, 44, 'k'),
  // Faces & Names: two face cards with a name and a job line under each.
  'faces-names': () => {
    const face = (x: number, hair: string) =>
      R(x, 6, 32, 50, 'o', 3) + C(x + 16, 21, 8, 'e') + P(hair, 'i') + C(x + 13, 21, 1, 'i') + C(x + 19, 21, 1, 'i') +
      P(`M${x + 12.5} 25q3.5 2.5 7 0`, 'g') + L(x + 5, 40, x + 27, 40, 'tx') + L(x + 8, 47, x + 24, 47, 'g');
    return face(10, 'M18 20a8 8 0 0 1 16 0q-5-5-16 0z') + face(54, 'M62 22a8 8 0 0 1 16-2l2 7-3-2-1-5q-6 3-14 2z');
  },
  // Briefing Game: a messy pile of messages turned into one short, ordered briefing.
  'briefing-game': () =>
    G('rotate(-10 18 20)', R(6, 12, 24, 16, 'o', 1) + P('M6 12l12 8 12-8', 'g')) + G('rotate(8 20 34)', R(8, 26, 24, 16, 'o', 1) + P('M8 26l12 8 12-8', 'g')) +
    G('rotate(-4 18 50)', R(6, 42, 24, 16, 'o', 1) + P('M6 42l12 8 12-8', 'g')) + arrow(38, 32, 52, 32) +
    R(58, 6, 32, 52, 'o', 2) + R(62, 11, 24, 5, 'i', 1) + [24, 34, 44].map((y) => C(64, y, 1.6, 'a') + L(68, y, 84, y, 'tx')).join(''),
  // Compression Challenge: a long text squeezed into a short one, and expanded back.
  'compression-challenge': () =>
    R(4, 6, 38, 52, 'o', 2) + lines(9, 14, [28, 26, 28, 20, 28, 24, 14], 6.5) + arrow(46, 26, 58, 26) + arrow(58, 38, 46, 38) +
    R(62, 18, 30, 28, 'o', 2) + lines(67, 26, [20, 14], 7) + L(67, 40, 73, 40, 'tx')
};

/** Pictures made only of abstract text lines and flow arrows: these follow the reading direction (flipped in RTL). */
export const MIRRORED: ReadonlySet<string> = new Set(['audience-switch', 'deep-read', 'briefing-game', 'compression-challenge']);

/** Neutral glyph for a game without its own preview yet (circle, square, triangle). */
const FALLBACK = () => C(28, 34, 11, 'a') + R(40, 22, 22, 22, 'o', 3) + tri(74, 36, 11, 'i');

export const hasPreview = (id: string): boolean => Object.hasOwn(PREVIEWS, id);
export const previewIds = (): string[] => Object.keys(PREVIEWS);

/** The complete SVG markup of a game's preview (the neutral glyph for unknown ids). */
export const previewMarkup = (id: string): string => {
  const body = (PREVIEWS[id] ?? FALLBACK)();
  const cls = `game-preview${MIRRORED.has(id) ? ' game-preview--flow' : ''}${hasPreview(id) ? '' : ' game-preview--generic'}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" class="${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
};

/**
 * The preview as a DOM element. The markup is parsed as SVG XML (a constant from this module, never user text);
 * if it ever failed to parse, the neutral glyph is used instead.
 */
export const gamePreview = (id: string): Element => {
  const parse = (markup: string) => {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const root = doc.documentElement;
    return root.nodeName === 'svg' && !doc.querySelector('parsererror') ? root : undefined;
  };
  const root = parse(previewMarkup(id)) ?? parse(previewMarkup(''));
  return document.importNode(root!, true);
};
