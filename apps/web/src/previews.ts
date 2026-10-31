/**
 * Preview graphics for the game cards on the home page (owner request 2026-10-15: "kleine Vorschaubilder"; revised the
 * same day: "an die echten Darstellungen angelehnt").
 *
 * Every preview is a simplified redraw of the game's own screen: the same shapes, layout and colour roles the game
 * shows while it is played (lit lights in yellow, walls and crates in the game's colours, straight lanes between
 * nodes, discs, tiles…). They are original drawings written here as inline SVG (no third-party art). One family: the
 * same 96×64 viewBox, a handful of style classes (see `.game-preview` in styles.css) that map to the `--wp-*` design
 * tokens or to a copy of a game's own palette (`--pv-*`), so they follow light, dark and forced-colours mode. They
 * carry no information: decorative, `aria-hidden`, and the card's title and tagline stay its accessible name.
 * Skyscrapers is the one deliberate exception: it shows 3D towers (owner decision; the game will show towers too).
 *
 * Photos (PHOTOS below) are the other exception (owner decisions 2026-10-27: Relay Command "ein echtes Bild, das
 * entsprechend arrangiert ist", Lootlings "könnte ein thumbnail update gebrauchen"): a real screen of the game, rendered
 * by the game itself and saved as `public/previews/<id>-light.webp` and `<id>-dark.webp` (288×192, 3× the 96×64 card;
 * own work, no third-party art). Both files always exist; they may be identical when the game uses one palette in
 * both themes (Lootlings' card art). The card shows them as a decorative `<picture>` (`alt=""`, `aria-hidden`) whose
 * dark source follows `prefers-color-scheme`, which is the app's only theme switch. They are same-origin files under
 * the app's base URL and precached by the service worker (`webp` in the workbox glob patterns), so they work offline
 * like the drawings.
 *
 * RTL: previews are not mirrored. They show game content with its own direction (boards, letters, digits, arrows,
 * laser paths) and the games do not mirror their boards either. Only the few pictures made of nothing but text
 * cards and lines (MIRRORED below) are flipped in RTL, as their text would be.
 *
 * Class vocabulary (see styles.css for the full list):
 *   c cell  e raised/panel  o outlined object  ob bold outline  d/bd/i/a/w/ok/p1/p2 fills  sh shaded tile  sf contrast fill
 *   k ink line  fn thin ink line  g/mu/gk/ln/tx muted lines  al/ab accent lines  x1/x2 player lines  y2 thin player-2 line
 *   okl ok line  dn danger line  pr focus line  sk contrast line  bl border line  ds dashed  dt dotted
 *   game palettes: sun/sui/sus lights · wl/wll walls · cr/cre/cd crates · wd/fr wood · wh/wn letter tiles · mc covered
 *   cell · m0–m5 code symbols · chl/chd/pw/pb chess · lf/lgd/lgr/lgf/lmr/lbk/ltg/lsel laser · tp/trd/tf/th/tw/tm/tmf
 *   terrain · rl/rw/rwv/bt/bi river · s0–s2/pf stones · fw/fh water · st star · win tower windows · fbg/fsk/fsh/fhr face · hb hole
 *   pcf/pci/pcr/pcb/pcl playing cards (face, black and red suits, back, back line)
 *   text: t  ts contrast  tm2 muted  n1/n2 counts  tz/tli laser labels  tsm small  txs tiny  tl large
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

/** Closed polygon through the given points. */
const poly = (pts: [number, number][], c: string) => P(`${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('')}Z`, c);
/** Regular polygon (k corners, first corner straight up). */
const ngon = (x: number, y: number, r: number, k: number, c: string, a0 = -Math.PI / 2) =>
  poly(Array.from({ length: k }, (_, i) => [x + r * Math.cos(a0 + (i * 2 * Math.PI) / k), y + r * Math.sin(a0 + (i * 2 * Math.PI) / k)] as [number, number]), c);
const tri = (x: number, y: number, r: number, c: string) => poly([[x, y - r], [x + r, y + r * 0.8], [x - r, y + r * 0.8]], c);
const diamond = (x: number, y: number, r: number, c: string) => poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], c);
const star = (x: number, y: number, r: number, c: string) =>
  poly(Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return [x + rr * Math.cos(a), y + rr * Math.sin(a)] as [number, number];
  }), c);
/** Small filled arrowhead with its tip at (x2, y2), pointing away from (x1, y1). */
const head = (x1: number, y1: number, x2: number, y2: number, c = 'i', s = 3.2) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const at = (d: number): [number, number] => [x2 - s * Math.cos(a + d), y2 - s * Math.sin(a + d)];
  return poly([[x2, y2], at(0.55), at(-0.55)], c);
};
const check = (x: number, y: number, c = 'fn', s = 1) => P(`M${n(x - 2.5 * s)} ${n(y)}l${n(1.8 * s)} ${n(1.8 * s)} ${n(3.4 * s)}-${n(4 * s)}`, c);
const cross = (x: number, y: number, c = 'g', s = 2) => P(`M${n(x - s)} ${n(y - s)}l${2 * s} ${2 * s}m0-${2 * s}l-${2 * s} ${2 * s}`, c);
/** A simple standing figure (head + shoulders), centred on x, head at y. */
const figure = (x: number, y: number, s: number, c: string) =>
  C(x, y, n(2.8 * s), c) + P(`M${n(x - 4.5 * s)} ${n(y + 11 * s)}v-2a${n(4.5 * s)} ${n(4.5 * s)} 0 0 1 ${n(9 * s)} 0v2z`, c);
/** Cells of a grid; `cls(col, row)` picks each cell's class ('' skips the cell). */
const grid = (x: number, y: number, cols: number, rows: number, s: number, cls: (col: number, row: number) => string = () => 'c', gap = 0, rx = 0) => {
  let out = '';
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const c = cls(q, r);
    if (c) out += R(x + q * (s + gap), y + r * (s + gap), s, s, c, rx);
  }
  return out;
};
/** Round dots as one path (zero-length segments with round caps). */
const dots = (pts: [number, number][], c: string) => P(pts.map(([x, y]) => `M${n(x)} ${n(y)}h0`).join(''), c);
/** "/" hatching inside a rectangle, as one path. */
const hatch = (x: number, y: number, w: number, h: number, step: number, c: string) => {
  let d = '';
  for (let k = step; k < w + h; k += step) {
    const u0 = Math.max(0, k - h), u1 = Math.min(w, k);
    d += `M${n(x + u0)} ${n(y + k - u0)}L${n(x + u1)} ${n(y + k - u1)}`;
  }
  return P(d, c);
};
/** Text-like lines of the given widths (muted strokes). */
const lines = (x: number, y: number, widths: number[], gap = 5, c = 'mu') => widths.map((w, i) => L(x, y + i * gap, x + w, y + i * gap, c)).join('');
/** A check-box row: box, tick box and a line of text. */
const row = (x: number, y: number, w: number, h: number, text: number) =>
  R(x, y, w, h, 'c', 2) + R(x + 3, y + h / 2 - 2, 4, 4, 'c', 1) + L(x + 10, y + h / 2, x + 10 + text, y + h / 2, 'mu');

/** French card suits as small shapes centred on (x, y), size r (the playing-card games' faces). */
const suit = (k: string, x: number, y: number, r: number, c: string) => {
  const h = r / 2;
  if (k === 'D') return diamond(x, y, r, c);
  if (k === 'H') return P(`M${n(x)} ${n(y + r)}L${n(x - r)} ${n(y - 0.1 * r)}A${n(h)} ${n(h)} 0 0 1 ${n(x)} ${n(y - 0.5 * r)}A${n(h)} ${n(h)} 0 0 1 ${n(x + r)} ${n(y - 0.1 * r)}Z`, c);
  const stem = P(`M${n(x)} ${n(y + 0.1 * r)}L${n(x + 0.45 * r)} ${n(y + r)}H${n(x - 0.45 * r)}Z`, c);
  if (k === 'S') return P(`M${n(x)} ${n(y - r)}L${n(x + r)} ${n(y + 0.15 * r)}A${n(h)} ${n(h)} 0 0 1 ${n(x)} ${n(y + 0.45 * r)}A${n(h)} ${n(h)} 0 0 1 ${n(x - r)} ${n(y + 0.15 * r)}Z`, c) + stem;
  return C(x, y - 0.45 * r, n(0.42 * r), c) + C(x - 0.45 * r, y + 0.15 * r, n(0.42 * r), c) + C(x + 0.45 * r, y + 0.15 * r, n(0.42 * r), c) + stem;
};
/** A face-up card (rank in the corner, suit in the middle; hearts and diamonds red) and a card back. */
const card = (x: number, y: number, w: number, h: number, rank: string, k: string) => {
  const red = k === 'H' || k === 'D';
  return R(x, y, w, h, 'pcf', 1.2) + T(x + 2.3, y + 2.8, rank, `t txs${red ? ' pcr' : ''}`) + suit(k, x + w / 2, y + h / 2 + 0.6, Math.min(w, h) * 0.24, red ? 'pcr' : 'pci');
};
const back = (x: number, y: number, w: number, h: number) => R(x, y, w, h, 'pcb', 0.8) + R(x + 1, y + 1, w - 2, h - 2, 'pcl', 0.5);

const PREVIEWS: Record<string, () => string> = {
  // Orbit Links: nodes on dark-grey space joined by straight lanes; own (blue) and opposing (red) home nodes with
  // their strength, neutral outposts with dashed rims, a shipyard hexagon and a defence platform; a dashed stream.
  'node-conquest': () => {
    const p: [number, number][] = [[18, 47], [22, 14], [48, 31], [77, 14], [77, 47]];
    const lanes = [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4], [0, 4]];
    return R(2, 2, 92, 60, 'e', 4) + lanes.map(([a, b]) => L(...p[a!]!, ...p[b!]!, 'ln')).join('') +
      L(24, 43, 41, 34.5, 'x1 ds') + head(24, 43, 42, 34, 'p1') +
      C(22, 14, 5.5, 'o ds') + T(22, 14.5, 2, 't tsm') +
      C(48, 31, 5.5, 'o ds') + P('M48 23v2.5M48 37v2.5M40 31h2.5M53.5 31h2.5', 'fn') + T(48, 31.5, 13, 't tsm') +
      ngon(77, 47, 7, 6, 'o') + T(77, 47.5, 5, 't tsm') +
      C(18, 47, 7.5, 'p1 fn') + T(18, 47.5, 10, 't tsm ts') + C(24, 41, 2, 'o') +
      C(77, 14, 7.5, 'p2 fn') + T(77, 14.5, 10, 't tsm ts') + tri(83.5, 7.5, 2.4, 'o');
  },
  // Tower Defense (Holdline): a winding road over build pads, towers of different shapes beside it (square gun,
  // diamond laser with its beam, octagonal artillery, round support) and wave units on the road.
  'tower-defense': () => {
    const road = R(6, 9, 64, 8, 'c') + R(62, 9, 8, 26, 'c') + R(22, 27, 48, 8, 'c') + R(22, 27, 8, 28, 'c') + R(22, 47, 70, 8, 'c');
    const pads = R(4, 5, 88, 54, 'e', 3);
    const towers =
      R(36, 19.5, 6, 6, 'a') + P('M52 19l3.5 3.5-3.5 3.5-3.5-3.5z', 'a') + ngon(46, 41, 3.8, 8, 'a') + C(76, 40, 3.2, 'o') +
      L(52, 22.5, 66, 30.5, 'ab');
    const units = C(14, 13, 2.2, 'p2') + C(26, 13, 2.2, 'p2') + C(66, 20, 2.2, 'p2') + C(66, 31, 2.2, 'p2') + C(50, 31, 2.2, 'p2') + C(26, 42, 2.2, 'p2');
    return pads + road + towers + units;
  },
  // Nonogram: the 5×5 grid with stacked number clues above and beside it, most rows filled in, one cell crossed out.
  nonogram: () => {
    const s = 8, x0 = 38, y0 = 21;
    const pic = ['00111', '01101', '00101', '10001', '11111'];
    const cols = [[2], [1, 1], [3, 1], [1, 1], [5]], rowsC = [[3], [2, 1], [1, 1], [1, 1], [5]];
    return grid(x0, y0, 5, 5, s) + R(x0, y0, 5 * s, 5 * s, 'fn') +
      pic.map((line, r) => [...line].map((v, q) => (v === '1' && r !== 3 ? R(x0 + q * s + 1, y0 + r * s + 1, s - 2, s - 2, 'i') : '')).join('')).join('') +
      cross(x0 + 1.5 * s, y0 + 3.5 * s, 'g', 1.6) +
      cols.map((nums, q) => nums.map((v, k) => T(x0 + q * s + s / 2, y0 - 4.5 - (nums.length - 1 - k) * 7, v, 't tsm')).join('')).join('') +
      rowsC.map((nums, r) => nums.map((v, k) => T(x0 - 5 - (nums.length - 1 - k) * 6, y0 + r * s + s / 2, v, 't tsm')).join('')).join('');
  },
  // Chess: a corner of the board in the game's wood colours, black and white pieces (rooks and pawns).
  chess: () => {
    const s = 12, x0 = 12, y0 = 8;
    const pawn = (q: number, r: number, c: string) => {
      const x = x0 + q * s, y = y0 + r * s;
      return C(x + 6, y + 4, 2.3, c) + P(`M${x + 4} ${y + 6.5}L${x + 2.5} ${y + 10.5}H${x + 9.5}L${x + 8} ${y + 6.5}Z`, c);
    };
    const rook = (q: number, r: number, c: string) => {
      const x = x0 + q * s, y = y0 + r * s;
      return P(`M${x + 2} ${y + 10.5}h8v-1.8h-1.4v-4.2h1.4v-3.5h-1.8v1.3h-1.4v-1.3h-1.6v1.3h-1.4v-1.3h-1.8v3.5h1.4v4.2h-1.4z`, c);
    };
    return grid(x0, y0, 6, 4, s, (q, r) => ((q + r) % 2 ? 'chd' : 'chl')) + R(x0, y0, 6 * s, 4 * s, 'fn') +
      rook(0, 0, 'pb') + rook(5, 0, 'pb') + [0, 1, 4, 5].map((q) => pawn(q, 1, 'pb')).join('') + pawn(2, 2, 'pb') +
      pawn(3, 2, 'pw') + [0, 1, 4].map((q) => pawn(q, 3, 'pw')).join('') + rook(5, 3, 'pw');
  },
  // Mine Logic: raised covered cells around an opened area whose counts are coloured like the game's (1 blue, 2 green).
  minesweeper: () => {
    const s = 10, x0 = 8, y0 = 7;
    const map = ['cc1...1c', 'cc1...1c', 'cc2...11', 'cc11212.', 'cccccccc'];
    let out = '';
    map.forEach((line, r) => [...line].forEach((k, q) => {
      const x = x0 + q * s, y = y0 + r * s;
      out += k === 'c' ? R(x + 0.5, y + 0.5, s - 1, s - 1, 'mc', 1.2) : R(x, y, s, s, 'c');
      if (k === '1' || k === '2') out += T(x + s / 2, y + s / 2 + 0.5, k, `t n${k}`);
    }));
    return out + L(x0 + 14, y0 + 22, x0 + 14, y0 + 28, 'fn') + P(`M${x0 + 14} ${y0 + 22}l4 1.8-4 1.8z`, 'i');
  },
  // Letter Logic: a submitted word with the game's tile states (absent grey, elsewhere orange, placed teal), the next
  // word being typed in dashed tiles, the empty rows below.
  'word-guess': () => {
    const s = 14, x0 = 7, gap = 3;
    const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * (s + gap));
    const first = ['e', 'e', 'wn', 'e', 'wh'];
    return xs.map((x, i) => R(x, 5, s, s, first[i]!, 2)).join('') +
      hatch(xs[2]! + 1, 6, s - 2, s - 2, 3.2, 'skf') +
      [...'CRANE'].map((ch, i) => T(xs[i]! + s / 2, 12.5, ch, first[i] === 'e' ? 't tm2' : 't ts')).join('') +
      [0, 1, 3].map((i) => cross(xs[i]! + s - 2.5, 7.5, 'g', 1)).join('') + C(xs[4]! + s - 2.5, 7.5, 1.1, 'sf') +
      xs.map((x, i) => R(x, 23, s, s, i < 3 ? 'o ds' : 'c ds', 2)).join('') + [...'PLO'].map((ch, i) => T(xs[i]! + s / 2, 30.5, ch)).join('') +
      xs.map((x) => R(x, 41, s, s, 'c', 2)).join('');
  },
  // Stack Duel: the dark platform, stones in the game's colours stacked on it, the next stone hovering (dashed) above.
  'stack-duel': () =>
    R(4, 3, 88, 58, 'c', 3) +
    P('M26 47H70V53H62L63 61H33L34 53H26Z', 'pf') + R(35, 39, 22, 8, 's1', 1) + P('M38 39L42 32H53L56 39Z', 's2') +
    P('M41 9H59V14H53V21H47V14H41Z', 's0 ds') + L(50, 23, 50, 30, 'g ds'),
  // Skyscrapers: the 4×4 grid with edge clues; each filled cell shows a flat tower (a solid bar rising from the bottom,
  // height value/4, one window line per storey) and its digit on a chip in the corner; given towers are hatched.
  skyscrapers: () => {
    const s = 13, x0 = 26, y0 = 9;
    const v = ['2.43', '32.4', '1.32', '4.21'];
    const tower = (q: number, r: number, h: number, given: boolean) => {
      const x = x0 + q * s, y = y0 + r * s, w = 0.6 * s, l = x + 0.2 * s, b = y + s - 0.6, H = (h / 4) * 0.82 * s, st = H / h;
      let win = '';
      for (let k = 0; k < h; k++) win += `M${n(l + 0.16 * w)} ${n(b - H + (k + 0.47) * st)}H${n(l + 0.84 * w)}`;
      return (given ? R(l, b - H, w, H, 'c') + hatch(l, b - H, w, H, 2.2, 'fn') + R(l, b - H, w, H, 'fn', 0.6) : R(l, b - H, w, H, 'i', 0.6)) +
        P(win, 'win') + R(x + 0.8, y + 0.8, 4.6, 5, 'c', 1) + T(x + 3.1, y + 3.4, h, 't txs');
    };
    return grid(x0, y0, 4, 4, s, (q, r) => (q === r && r < 2 ? 'e' : 'c')) + R(x0, y0, 4 * s, 4 * s, 'fn') +
      v.map((line, r) => [...line].map((h, q) => (h === '.' ? '' : tower(q, r, Number(h), q === r && r < 2))).join('')).join('') +
      T(x0 + s / 2, y0 - 4.5, 3) + T(x0 + 2.5 * s, y0 - 4.5, 1) + T(x0 - 5, y0 + s / 2, 2) + T(x0 - 5, y0 + 2.5 * s, 2);
  },
  // Lights Out: the 3×3 board of square buttons; lit ones yellow with a sun, the others white with a ring.
  'lights-out': () => {
    const lit = ['110', '010', '001'];
    const s = 17, x0 = 22.5, y0 = 5.5;
    let out = R(x0 - 1.5, y0 - 1.5, 3 * s + 2, 3 * s + 2, 'e', 3);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const x = x0 + q * s, y = y0 + r * s, cx = x + (s - 1) / 2, cy = y + (s - 1) / 2;
      if (lit[r]?.[q] === '1') {
        let rays = '';
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          rays += `M${n(cx + 4.6 * Math.cos(a))} ${n(cy + 4.6 * Math.sin(a))}L${n(cx + 6.4 * Math.cos(a))} ${n(cy + 6.4 * Math.sin(a))}`;
        }
        out += R(x, y, s - 1, s - 1, 'sun', 2) + C(cx, cy, 3.1, 'sui') + P(rays, 'sus');
      } else out += R(x, y, s - 1, s - 1, 'c', 2) + C(cx, cy, 2.8, 'mu');
    }
    return out;
  },
  // Crate Pusher: brick walls, white floor, dashed goal rings, wooden crates (one already on its goal, green), the pusher.
  sokoban: () => {
    const s = 11, x0 = 4, y0 = 4.5;
    const map = ['WWWWWWWW', 'Wg...*WW', 'Wg..W..W', 'W@$.$..W', 'WWWWWWWW'];
    let out = '', bricks = '';
    map.forEach((line, r) => [...line].forEach((k, q) => {
      const x = x0 + q * s, y = y0 + r * s, cx = x + s / 2, cy = y + s / 2;
      if (k === 'W') {
        out += R(x, y, s, s, 'wl');
        bricks += `M${x} ${y + 5.5}h${s}M${x + 5.5} ${y}v5.5M${x} ${y + 5.5}v5.5`;
        return;
      }
      out += R(x, y, s, s, 'c');
      if (k === 'g') out += C(cx, cy, 3.2, 'ab ds');
      if (k === '$') out += R(x + 1.5, y + 1.5, 8, 8, 'cr', 1) + P(`M${x + 1.5} ${y + 1.5}l8 8m0-8l-8 8`, 'cre');
      if (k === '*') out += R(x + 1.5, y + 1.5, 8, 8, 'cd', 1) + check(cx, cy, 'sk', 0.9);
      if (k === '@') out += figure(cx, cy - 2.6, 0.7, 'p1');
    }));
    return out + P(bricks, 'wll');
  },
  // Laser Paths: the dark board with its grid, a green emitter whose dashed beam a mirror turns into the round target,
  // grey blocker tiles.
  'laser-circuit': () => {
    const s = 11, x0 = 20.5, y0 = 4.5;
    let gl = '';
    for (let i = 1; i < 5; i++) gl += `M${x0 + i * s} ${y0}v${5 * s}M${x0} ${y0 + i * s}h${5 * s}`;
    const cx = (q: number) => x0 + q * s + s / 2, cy = (r: number) => y0 + r * s + s / 2;
    return R(x0, y0, 5 * s, 5 * s, 'lf', 2) + R(x0 + s, y0 + s, s, s, 'lsel') + P(gl, 'lgd') +
      R(x0 + 1.5, y0 + 4 * s + 1.5, 8, 8, 'lbk', 1) + R(x0 + 3 * s + 1.5, y0 + 4 * s + 1.5, 8, 8, 'lbk', 1) +
      L(cx(4) - 1, cy(3), cx(2), cy(3), 'lgr') + L(cx(2), cy(3), cx(2), cy(4) - 3.6, 'lgr') +
      L(cx(2) - 3.5, cy(3) + 3.5, cx(2) + 3.5, cy(3) - 3.5, 'lmr') +
      C(cx(2), cy(4), 3.8, 'ltg') + T(cx(2), cy(4) + 0.3, 'G', 't tsm tli') +
      R(cx(4) - 1, cy(3) - 4, 9, 8, 'lgf', 1.5) + T(cx(4) + 3.5, cy(3) + 0.3, 'G', 't tsm tz') + poly([[cx(4) - 1.5, cy(3)], [cx(4) + 1, cy(3) - 1.8], [cx(4) + 1, cy(3) + 1.8]], 'tli');
  },
  // Circuit: square tiles; powered wires thick and solid on shaded tiles from the source to a lit lamp, unpowered
  // wires thin and dotted with red rings at their loose ends, dark lamps as grey rings.
  'circuit-puzzle': () => {
    const s = 17, x0 = 5.5, y0 = 6.5;
    const cx = (q: number) => x0 + q * s + s / 2, cy = (r: number) => y0 + r * s + s / 2;
    const loose = (x: number, y: number) => C(x, y, 1.4, 'c dn');
    return grid(x0, y0, 5, 3, s) + [[1, 1], [2, 1], [3, 1], [3, 0]].map(([q, r]) => R(x0 + q! * s, y0 + r! * s, s, s, 'sh')).join('') +
      R(x0, y0, 5 * s, 3 * s, 'fn', 2) +
      P(`M${cx(1)} ${cy(1)}H${cx(3)}V${cy(0) - 3}`, 'al') + P(`M${cx(3)} ${cy(1) - 8.5}h5`, 'al') + loose(cx(3) + 6.5, cy(1) - 8.5) +
      C(cx(1), cy(1), 4, 'a') + check(cx(1) + 0.4, cy(1) - 0.2, 'sk', 0.8) +
      R(cx(2) - 4, cy(1) - 4, 8, 8, 'i', 1.5) + P(`M${cx(2) - 2.5} ${cy(1)}h5M${cx(2)} ${cy(1) - 2.5}v5`, 'sk') +
      C(cx(0), cy(0), 3.4, 'mu') + L(x0 + 2, cy(0), cx(0) - 3.4, cy(0), 'mu dt') + loose(x0 + 2, cy(0)) +
      C(cx(4), cy(0), 3.4, 'mu') + C(cx(4), cy(1), 3.4, 'mu') + L(cx(4), cy(0) + 3.4, cx(4), cy(1) - 3.4, 'mu dt') +
      P(`M${cx(0)} ${cy(2) + 6}V${cy(2)}H${cx(1) + 3}`, 'mu dt') + loose(cx(0), cy(2) + 6) + loose(cx(1) + 3, cy(2)) +
      P(`M${cx(2) - 7} ${cy(2)}H${cx(4) + 7}M${cx(2)} ${cy(2) - 7}V${cy(2) + 6}`, 'mu dt') + loose(cx(2) - 7, cy(2)) + loose(cx(4) + 7, cy(2)) + loose(cx(2), cy(2) - 7);
  },
  // Memory: a grid of striped face-down cards with a diamond, two cards turned up (accent rim) showing their pictures.
  memory: () => {
    const s = 17, gap = 2.5, x0 = 10.25, y0 = 4;
    let out = '';
    for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
      const x = x0 + q * (s + gap), y = y0 + r * (s + gap);
      if (r === 0 && q < 2) continue;
      out += R(x, y, s, s, 'e', 2.5) + P(`M${x + 2} ${y + 7}l5-5M${x + 2} ${y + 15}l13-13M${x + 10} ${y + 15}l5-5`, 'bl') + diamond(x + s / 2, y + s / 2, 4, 'o');
    }
    const u = x0 + s / 2, b = x0 + s + gap + s / 2, cy = y0 + s / 2;
    return out + R(x0, y0, s, s, 'c ab', 2.5) + R(x0 + s + gap, y0, s, s, 'c ab', 2.5) +
      P(`M${u - 6} ${cy}a6 5.5 0 0 1 12 0z`, 'm4') + P(`M${u} ${cy}v4.5a1.4 1.4 0 0 1-2.8 0`, 'fn') +
      C(b - 3.8, cy + 2, 2.6, 'fn') + C(b + 3.8, cy + 2, 2.6, 'fn') + P(`M${b - 3.8} ${cy + 2}l2.5-5h4l1.3 5M${b - 1.3} ${cy - 3}l2.5 5`, 'ab');
  },
  // Texas Hold'em: the calm table as in the game: seat tiles in a row (yours active, one folded and dashed, the others
  // with two card backs), the community cards (flop out, turn and river slots dashed), the pot, your two hole cards.
  poker: () => {
    const seats = [0, 1, 2, 3].map((i) => {
      const x = 3 + i * 23;
      if (i === 1) return R(x, 2, 21, 15, 'c ds', 2) + L(x + 3, 6.5, x + 13, 6.5, 'g');
      return R(x, 2, 21, 15, i ? 'c' : 'c ab', 2) + L(x + 3, 6.5, x + (i ? 15 : 9), 6.5, i ? 'mu' : 'k') +
        (i ? back(x + 3, 9.5, 4.5, 6) + back(x + 8.5, 9.5, 4.5, 6) : L(x + 3, 11.5, x + 12, 11.5, 'g'));
    }).join('');
    const board = [['Q', 'D'], ['3', 'H'], ['9', 'S']].map(([r, k], i) => card(20 + i * 11.5, 20, 10, 14, r!, k!)).join('') +
      R(20 + 3 * 11.5, 20, 10, 14, 'c ds', 1.2) + R(20 + 4 * 11.5, 20, 10, 14, 'c ds', 1.2);
    return seats + board + C(18.5, 6.5, 2.2, 'o') + card(28, 37.5, 17.5, 24.5, 'J', 'C') + card(49, 37.5, 17.5, 24.5, '2', 'S') +
      L(72, 49, 78, 49, 'mu') + T(83, 49.5, 6, 't tsm');
  },
  // Skat: the two computer players' rows of card backs, the Skat face down beside the current trick, and your hand
  // as an overlapping fan of ten cards (default French faces: the corners show rank and suit, the last card in full).
  skat: () => {
    const backs = (x: number) => Array.from({ length: 7 }, (_, i) => back(x + 3 + i * 3.6, 7.5, 6, 8)).join('');
    const hand: [string, string][] = [['J', 'C'], ['J', 'S'], ['J', 'H'], ['10', 'C'], ['K', 'C'], ['9', 'C'], ['A', 'S'], ['8', 'S'], ['K', 'H'], ['8', 'H']];
    return R(3, 2, 44, 16, 'c', 2) + L(6, 5, 20, 5, 'mu') + backs(3) + R(49, 2, 44, 16, 'c', 2) + L(52, 5, 66, 5, 'mu') + backs(49) +
      back(19, 22.5, 7, 10) + back(27.5, 22.5, 7, 10) + card(46, 21, 9, 13, 'A', 'H') + card(57, 21, 9, 13, 'K', 'H') +
      R(3, 37, 90, 25, 'c ab', 2) +
      hand.map(([r, k], i) => {
        const x = 8 + i * 7.4, red = k === 'H';
        return R(x, 41, 11, 17, 'pcf', 1.2) + T(x + 2.6, 43.8, r, `t txs${red ? ' pcr' : ''}`) + suit(k, x + 2.6, 48.2, 1.6, red ? 'pcr' : 'pci');
      }).join('') + suit('H', 82.5, 50, 3, 'pcr');
  },
  // Code Breaker: earlier guesses as rows of coloured symbols with black/white feedback pegs, the draft row being
  // filled in, and the palette of the six symbols.
  mastermind: () => {
    const sym = (k: number, x: number, y: number, r: number) =>
      [C(x, y, r, 'm0 fn'), tri(x, y + 0.6, r, 'm1 fn'), R(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, 'm2 fn'), diamond(x, y, r * 1.1, 'm3 fn'), star(x, y, r * 1.2, 'm4 fn'), ngon(x, y, r, 6, 'm5 fn', 0)][k]!;
    const guesses = [[0, 1, 2, 3], [3, 2, 4, 0]];
    const pegs = [['o', 'o', 'o', 'd'], ['i', 'o', 'o', 'd']];
    return guesses.map((g, i) => {
      const y = 3 + i * 16;
      return R(4, y, 88, 14, 'c', 3) + T(10, y + 7, i + 1, 't tsm') + g.map((k, j) => R(16 + j * 12, y + 2, 10, 10, 'e', 2) + sym(k, 21 + j * 12, y + 7, 3.3)).join('') +
        pegs[i]!.map((c, j) => C(80 + (j % 2) * 6, y + 4.3 + Math.floor(j / 2) * 5.4, c === 'd' ? 0.7 : 1.7, c)).join('');
    }).join('') +
      [0, 1, 2, 3].map((j) => R(24 + j * 13, 37, 11, 11, j === 0 ? 'e' : j === 1 ? 'c ab' : 'c ds', 2)).join('') + sym(5, 29.5, 42.5, 3.4) +
      [0, 1, 2, 3, 4, 5].map((k) => sym(k, 20.5 + k * 11, 57, 2.8)).join('');
  },
  // Black Box: the "x → ? → f" machine strip, then the experiment log (input and output per row, newest marked).
  'black-box': () =>
    R(24, 3, 11, 11, 'c ds', 2) + T(29.5, 8.5, 'x', 't tsm') + P('M38 8.5h3', 'g') + head(38, 8.5, 42, 8.5, 'd', 2.5) +
    R(43, 1.5, 14, 14, 'i', 2.5) + T(50, 8.7, '?', 't ts') + P('M59 8.5h3', 'g') + head(59, 8.5, 63, 8.5, 'd', 2.5) +
    R(64, 3, 11, 11, 'c ds', 2) + T(69.5, 8.5, 'f', 't tsm') +
    L(12, 22, 16, 22, 'g') + L(36, 22, 46, 22, 'g') + L(66, 22, 78, 22, 'g') +
    [[0, 1], [1, 3], [2, 5]].map(([a, b], i) => R(8, 26 + i * 11, 80, 10, i % 2 ? 'c' : 'e') + T(14, 31.2 + i * 11, i + 1, 't tsm tm2') + T(40, 31.2 + i * 11, a!, 't tsm') + T(71, 31.2 + i * 11, b!, 't tsm')).join('') +
    L(8, 26, 8, 36, 'al'),
  // Rule Hunt: the example triple that fits, the three inputs with the "does it fit?" button, the log of tested triples.
  'rule-discovery': () =>
    R(6, 3, 84, 16, 'ob', 3) + T(36, 11.5, 4) + C(44, 11.5, 0.9, 'i') + T(54, 11.5, 12) + C(64, 11.5, 0.9, 'i') + T(74, 11.5, 18) +
    [4, 12, 5].map((v, i) => R(8 + i * 17, 24, 15, 10, 'c', 2) + T(15.5 + i * 17, 29.3, v, 't tsm')).join('') + R(62, 24, 26, 10, 'a', 2.5) +
    [[4, 12, 18], [4, 12, 5]].map((t, i) => {
      const y = 44 + i * 10;
      return T(10, y, i + 1, 't tsm tm2') + t.map((v, j) => T(22 + j * 10, y, v, 't tsm')).join('') + check(72, y, 'okl', 0.9) + L(6, y + 5, 90, y + 5, 'bl');
    }).join(''),
  // Network Detective: the network on its panel, round nodes and the two square nodes named in the task, grey links.
  'graph-detective': () => {
    const p: Record<string, [number, number]> = { A: [19, 10], B: [48, 9.5], C: [20, 29], D: [77, 32], E: [24.5, 53.5], F: [50.5, 51], G: [76.5, 49.5] };
    return R(4, 1.5, 88, 61, 'e', 5) + ['AB', 'AC', 'BC', 'BG', 'CE', 'CF', 'EF', 'FG', 'DG'].map(([a, b]) => L(...p[a!]!, ...p[b!]!, 'gk')).join('') +
      Object.entries(p).map(([k, [x, y]]) => ('EG'.includes(k) ? R(x - 5.5, y - 5.5, 11, 11, 'ob', 1.5) : C(x, y, 6, 'ob')) + T(x, y + 0.5, k, 't tsm')).join('');
  },
  // Robot Program: the board with a brick wall, the green goal flag and the blue robot; the command buttons beside it.
  'logic-path': () => {
    const s = 12, x0 = 8, y0 = 8;
    let bricks = '';
    for (let r = 0; r < 3; r++) bricks += `M${x0 + s} ${y0 + r * s + 6}h${s}M${x0 + s + 6} ${y0 + r * s + 6}v6`;
    return grid(x0, y0, 4, 4, s) + R(x0, y0, 4 * s, 4 * s, 'fn', 2) + R(x0 + s, y0, s, 3 * s, 'wl') + P(bricks, 'wll') +
      L(x0 + 4, y0 + 2.5, x0 + 4, y0 + 9.5, 'fn') + P(`M${x0 + 4} ${y0 + 2.5}h5l-1.5 1.8 1.5 1.8h-5z`, 'ok') +
      C(x0 + 3.5 * s, y0 + 3.5 * s, 4.6, 'p1') + tri(x0 + 3.5 * s, y0 + 3.5 * s, 2.2, 'sf') +
      [0, 1, 2].map((i) => R(64, 9 + i * 15, 26, 11, 'c', 3)).join('') +
      L(70, 18, 70, 12, 'fn') + head(70, 18, 70, 11.5, 'i', 2.5) + L(75, 14.5, 85, 14.5, 'mu') +
      P('M72 33v-4h-3', 'fn') + head(72, 29, 68.5, 29, 'i', 2.5) + L(75, 29.5, 85, 29.5, 'mu') +
      P('M68 48v-4h3', 'fn') + head(68, 44, 71.5, 44, 'i', 2.5) + L(75, 44.5, 85, 44.5, 'mu');
  },
  // Flow Lab: lettered tanks (A and B full of hatched water), dotted pipes with numbered valves and arrowheads, goal line.
  'systems-puzzle': () => {
    const tank = (x: number, y: number, full: boolean) => (full ? R(x, y, 14, 17, 'fw') + hatch(x, y, 14, 17, 3.5, 'fh') : R(x, y, 14, 17, 'c')) + R(x, y, 14, 17, 'k');
    const valve = (x: number, y: number) => C(x, y, 3.6, 'c ds') + L(x - 1.5, y + 1.5, x + 1.5, y - 1.5, 'fn');
    const pipe = (x1: number, y1: number, x2: number, y2: number) => L(x1, y1, x2, y2, 'k dt') + valve((x1 + x2) / 2, (y1 + y2) / 2) + head(x1, y1, x2, y2);
    return tank(6, 12, true) + tank(41, 12, false) + tank(76, 12, false) + tank(6, 42, true) + tank(41, 42, false) +
      T(13, 6.5, 'A', 't tsm') + T(48, 6.5, 'C', 't tsm') + T(83, 6.5, 'E', 't tsm') + T(13, 36.5, 'B', 't tsm') + T(48, 36.5, 'D', 't tsm') +
      pipe(21, 20.5, 40, 20.5) + pipe(56, 20.5, 75, 20.5) + pipe(21, 50.5, 40, 50.5) + pipe(21, 42, 40, 30) + pipe(56, 42, 75, 30) +
      L(74, 15.5, 90, 15.5, 'fn ds');
  },
  // Fix the Machine: numbered rule cards (the next one marked), the step button, and the test case that fails.
  'debug-system': () =>
    [0, 1, 2].map((i) => R(10, 4 + i * 13, 36, 11, 'c', 3) + C(16, 9.5 + i * 13, 3.3, 'e') + T(16, 9.8 + i * 13, i + 1, 't tsm') + L(22, 9.5 + i * 13, 40 - (i % 2) * 8, 9.5 + i * 13, 'mu')).join('') +
    L(7, 4, 7, 15, 'al') + tri(50.5, 9.5, 2.5, 'a') +
    R(10, 47, 24, 11, 'a', 3) +
    R(54, 4, 38, 40, 'c ab', 3) + L(59, 11, 72, 11, 'k') + cross(85, 11, 'dn', 2) +
    [0, 1, 2].map((i) => L(59, 21 + i * 8, 66, 21 + i * 8, 'g') + L(70, 21 + i * 8, 87, 21 + i * 8, 'mu')).join(''),
  // Logic Grid: three small grids (name × floor, name × drink, floor × drink) with upright column labels, row labels,
  // ticks and crosses; Undo and Check below.
  'constraint-grid': () => {
    const s = 6.5;
    const marks = [['v..', '..x', 'x..'], ['.x.', 'v..', '..v'], ['x.v', '...', '.x.']];
    return [10, 40, 70].map((x0, k) => {
      const y0 = 23;
      return L(x0, 5, x0 + 3 * s, 5, 'k') +
        [0, 1, 2].map((q) => L(x0 + q * s + s / 2, 9, x0 + q * s + s / 2, 19, 'mu')).join('') +
        [0, 1, 2].map((r) => L(x0 - 7, y0 + r * s + s / 2, x0 - 2.5, y0 + r * s + s / 2, 'mu')).join('') +
        grid(x0, y0, 3, 3, s) + R(x0, y0, 3 * s, 3 * s, 'fn') +
        marks[k]!.map((line, r) => [...line].map((m, q) => {
          const cx = x0 + q * s + s / 2, cy = y0 + r * s + s / 2;
          return m === 'v' ? check(cx + 0.3, cy, 'fn', 0.75) : m === 'x' ? cross(cx, cy, 'g', 1.6) : '';
        }).join('')).join('');
    }).join('') + R(28, 50, 18, 10, 'c', 3) + R(50, 50, 18, 10, 'c', 3);
  },
  // Proof Chain: the known statement (shaded, ticked), the goal, and the rules as rows of lettered chips; the rule that
  // can be applied now is marked.
  'minimal-proof': () => {
    const chip = (x: number, y: number, ch: string, cls = 'c') => R(x, y, 17, 8, cls, 2) + T(x + 4, y + 4.2, ch, 't tsm') + L(x + 8, y + 4, x + 14, y + 4, 'g');
    return chip(6, 4, 'B', 'sh ab') + check(26, 8, 'fn', 0.6) + chip(73, 4, 'D') +
      [['A', 'C'], ['B', 'C'], ['E', 'D']].map(([a, b], i) => {
        const y = 19 + i * 15;
        return R(4, y, 88, 12, i === 1 ? 'c ab' : 'c', 3) + (i === 1 ? tri(11, y + 6, 2.4, 'i') : C(11, y + 6, 2, 'o')) +
          chip(19, y + 2, a!, i === 1 ? 'sh ab' : 'c') + L(39, y + 6, 44, y + 6, 'fn') + head(39, y + 6, 46, y + 6, 'i', 2.5) + chip(48, y + 2, b!);
      }).join('');
  },
  // Bridges: a faint dot lattice, numbered round islands, single and double bridges.
  bridges: () => {
    const X = (c: number) => 18 + c * 10, Y = (r: number) => 5 + r * 9;
    const isl: [number, number, number][] = [[0, 1, 2], [4, 1, 3], [6, 1, 1], [4, 3, 1], [0, 4, 3], [6, 4, 3], [0, 6, 3], [2, 6, 4], [4, 6, 2], [6, 6, 2]];
    const pts: [number, number][] = [];
    for (let r = 0; r <= 6; r++) for (let c = 0; c <= 6; c++) if (!isl.some(([a, b]) => a === c && b === r)) pts.push([X(c), Y(r)]);
    return dots(pts, 'bl') +
      L(X(0) - 1.3, Y(4), X(0) - 1.3, Y(6)) + L(X(0) + 1.3, Y(4), X(0) + 1.3, Y(6)) + L(X(0), Y(6), X(2), Y(6)) +
      L(X(4), Y(1), X(6), Y(1)) + L(X(4), Y(1), X(4), Y(3)) + L(X(6) - 1.3, Y(4), X(6) - 1.3, Y(6)) + L(X(6) + 1.3, Y(4), X(6) + 1.3, Y(6)) +
      isl.map(([c, r, v]) => C(X(c), Y(r), 4.3, 'o') + T(X(c), Y(r) + 0.4, v, 't tsm')).join('');
  },
  // Unblock: the brown frame with its exit on the right, wooden blocks, the striped green star block.
  'sliding-blocks': () => {
    const s = 9, x0 = 21, y0 = 5;
    const blocks: [number, number, number, number][] = [[0, 0, 2, 1], [2, 0, 1, 2], [3, 0, 2, 1], [0, 1, 1, 2], [3, 1, 3, 1], [4, 2, 1, 2], [5, 2, 1, 2], [0, 3, 1, 3], [1, 3, 1, 2], [2, 3, 2, 1], [2, 4, 2, 1], [5, 4, 1, 2], [2, 5, 2, 1]];
    const box = (q: number, r: number, w: number, h: number, c: string) => R(x0 + q * s + 0.7, y0 + r * s + 0.7, w * s - 1.4, h * s - 1.4, c, 1.2);
    return R(x0 - 2.5, y0 - 2.5, 6 * s + 5, 6 * s + 5, 'fr', 3) + R(x0, y0, 6 * s, 6 * s, 'c') + R(x0 + 6 * s, y0 + 2 * s + 1, 2.5, s - 2, 'c') +
      blocks.map(([q, r, w, h]) => box(q, r, w, h, 'wd') + (w > h ? L(x0 + q * s + 2.5, y0 + r * s + s / 2, x0 + (q + w) * s - 2.5, y0 + r * s + s / 2, 'cre') : L(x0 + q * s + s / 2, y0 + r * s + 2.5, x0 + q * s + s / 2, y0 + (r + h) * s - 2.5, 'cre'))).join('') +
      box(1, 2, 2, 1, 'a') + star(x0 + 2 * s, y0 + 2.5 * s, 2.8, 'sf') +
      L(x0 + 6 * s + 4.5, y0 + 2.5 * s, x0 + 6 * s + 9, y0 + 2.5 * s, 'fn') + head(x0 + 6 * s + 4.5, y0 + 2.5 * s, x0 + 6 * s + 10, y0 + 2.5 * s, 'i', 2.5);
  },
  // River Crossing: the start bank with its figures (the courier and two parcels as chips), the striped river with the
  // wooden boat at the start bank, the empty goal bank.
  'river-crossing': () =>
    R(2, 4, 32, 56, 'rl', 2) + R(34, 4, 28, 56, 'rw') + hatch(34, 4, 28, 56, 7, 'rwv') + R(62, 4, 32, 56, 'rl', 2) +
    diamond(7, 9.5, 2.2, 'i') + star(67, 9.5, 2.5, 'i') + L(11, 9.5, 24, 9.5, 'k') + L(71, 9.5, 86, 9.5, 'k') +
    R(5, 15, 26, 10, 'c pr', 2) + figure(10, 17.5, 0.5, 'i') + L(14, 20, 24, 20, 'k') + L(26, 22, 29, 18, 'fn') +
    R(5, 28, 26, 10, 'c', 2) + R(8, 31, 5, 4, 'i', 0.5) + L(16, 33, 27, 33, 'k') +
    R(5, 41, 26, 10, 'c', 2) + R(8, 44, 5, 4, 'i', 0.5) + L(16, 46, 27, 46, 'k') +
    R(37, 15, 22, 24, 'bt', 4) + R(38.5, 16, 19, 19, 'bi', 3) + diamond(54, 19.5, 1.8, 'i') + L(41, 20, 48, 20, 'k') + lines(41, 25.5, [12, 8], 4, 'g'),
  // Review: the flash card with the question, a dashed divider and the answer below, then the three rating buttons.
  review: () =>
    R(14, 2, 68, 43, 'o', 3) + L(20, 7, 30, 7, 'g') + L(36, 14, 60, 14, 'k') + L(18, 21, 78, 21, 'g ds') + L(42, 26, 54, 26, 'g') +
    C(48, 32, 3, 'w') + L(38, 39.5, 58, 39.5, 'k') +
    R(16, 50, 20, 11, 'c ds', 3) + P('M24 54a2.6 2.6 0 1 0 3 0', 'fn') + R(38, 50, 20, 11, 'c', 3) + P('M45 54.5q1.5-1.5 3 0t3 0M45 57q1.5-1.5 3 0t3 0', 'fn') +
    R(60, 50, 20, 11, 'c fn', 3) + check(70, 55.5, 'fn', 0.8),
  // Sequence Memory: the 3×3 tiles; the tile lighting up now is dark green with a white dot and a thick rim.
  'sequence-memory': () => grid(20.5, 4.5, 3, 3, 17, (q, r) => (q === 2 && r === 2 ? 'a k' : 'c'), 2, 2.5) + C(20.5 + 2 * 19 + 8.5, 4.5 + 2 * 19 + 8.5, 2.4, 'sf'),
  // Pattern Memory: the 4×4 cells with the highlighted pattern to memorise (dark green, white dot, thick rim).
  'spatial-memory': () => {
    const s = 13.5, g = 1.5, x0 = 18.75, y0 = 2.75, pat = ['0,0', '1,0', '2,2'];
    return grid(x0, y0, 4, 4, s, (q, r) => (pat.includes(`${q},${r}`) ? 'a k' : 'c'), g, 2) +
      pat.map((k) => { const [q, r] = k.split(',').map(Number) as [number, number]; return C(x0 + q * (s + g) + s / 2, y0 + r * (s + g) + s / 2, 1.9, 'sf'); }).join('');
  },
  // Signal Watch: one symbol at a time on the card (here the target, a filled triangle) and the big Respond button.
  'signal-watch': () => R(34, 3, 28, 28, 'c', 3) + tri(48, 16, 7, 'i') + R(12.5, 35.5, 71, 23, 'pr', 5) + R(14, 37, 68, 20, 'a', 4),
  // Stay on Task: the number card, Even and Odd buttons, and a dashed "new message" extra to ignore.
  'distractor-control': () =>
    R(34, 12, 28, 25, 'c', 3) + T(48, 25, 55, 't tl') + R(60, 2, 32, 8, 'c ds', 4) + R(64, 4.3, 5, 3.6, 'fn', 0.5) + P('M64 4.3l2.5 2 2.5-2', 'fn') + L(72, 6, 88, 6, 'g') +
    R(12.5, 41.5, 36, 17, 'pr', 4) + R(14, 43, 33, 14, 'c', 3) + R(49, 43, 33, 14, 'c', 3),
  // Four in a Row: the light board with round holes; filled blue discs and red ring discs, the last move dashed.
  'connect-four': () => {
    const discs: Record<string, string> = { '2,2': 'p2', '2,3': 'p1', '2,4': 'p1', '2,5': 'p2', '3,3': 'p2', '3,4': 'p1', '3,5': 'p1', '4,4': 'p2', '4,5': 'p1', '6,5': 'p2' };
    const cx = (q: number) => 19.25 + q * 9.5, cy = (r: number) => 8 + r * 9.5;
    let out = R(14, 3, 67.5, 58, 'e', 3) + R(cx(2) - 4.6, 3.5, 9.2, 57, 'sh', 2);
    for (let r = 0; r < 6; r++) for (let q = 0; q < 7; q++) {
      const d = discs[`${q},${r}`];
      out += d === 'p1' ? C(cx(q), cy(r), 3.9, 'p1') : d === 'p2' ? C(cx(q), cy(r), 2.75, 'o x2') : C(cx(q), cy(r), 3.9, 'hb');
    }
    return out + C(cx(2), cy(2), 4.6, 'fn ds');
  },
  // Tic-Tac-Toe: the grey frame with white cells, blue crosses and red rings.
  'tic-tac-toe': () => {
    const s = 17, x0 = 20.5, y0 = 4.5;
    const at = (q: number) => x0 + q * (s + 2), mid = (q: number) => at(q) + s / 2;
    const x = (q: number, r: number) => P(`M${mid(q) - 4} ${mid(r) - 4 - x0 + y0}l8 8m0-8l-8 8`, 'x1');
    const o = (q: number, r: number) => C(mid(q), mid(r) - x0 + y0, 4.5, 'x2');
    return R(x0 - 2, y0 - 2, 3 * s + 8, 3 * s + 8, 'bd', 3) + grid(x0, y0, 3, 3, s, () => 'c', 2, 1.5) + x(0, 0) + x(0, 2) + o(2, 0) + o(1, 2);
  },
  // Slitherlink: dots with faint dotted guides, the clue numbers (satisfied ones greyed), part of the loop drawn thick.
  slitherlink: () => {
    const s = 11, x0 = 20.5, y0 = 4.5;
    const X = (a: number) => x0 + a * s, Y = (b: number) => y0 + b * s;
    let guides = '';
    const pts: [number, number][] = [];
    for (let i = 0; i <= 5; i++) {
      guides += `M${X(0)} ${Y(i)}H${X(5)}M${X(i)} ${Y(0)}V${Y(5)}`;
      for (let j = 0; j <= 5; j++) pts.push([X(i), Y(j)]);
    }
    const clues = ['0....', '0.1..', '.213.', '201.0', '2.21.'];
    const loop = [[4, 1], [3, 1], [3, 2], [4, 2], [4, 3], [3, 3], [3, 4]].map(([a, b], i) => `${i ? 'L' : 'M'}${X(a!)} ${Y(b!)}`).join('');
    return P(guides, 'bl dt') + P(loop, 'k') + dots(pts, 'k') +
      clues.map((line, r) => [...line].map((v, q) => (v === '.' ? '' : T(X(q) + s / 2, Y(r) + s / 2 + 0.4, v, v === '0' ? 't tm2' : 't'))).join('')).join('') +
      cross(X(4), Y(0) + s / 2, 'g', 1.3) + cross(X(1) + s / 2, Y(4), 'g', 1.3);
  },
  // N-back: the 3×3 grid with the current item (dark green, white dot) and the Match / No match buttons.
  'n-back': () => {
    const s = 12, g = 1.5, x0 = 28.5, y0 = 2;
    return grid(x0, y0, 3, 3, s, (q, r) => (q === 1 && r === 2 ? 'a k' : 'c'), g, 2) + C(x0 + s + g + s / 2, y0 + 2 * (s + g) + s / 2, 2.2, 'sf') +
      R(12.5, 44.5, 36, 17, 'pr', 4) + R(14, 46, 33, 14, 'a', 3) + R(49, 46, 33, 14, 'c', 3);
  },
  // Visual Search: the board of outlined crosses with the one tilted target among them, the focus frame on a cross.
  'visual-search': () => {
    const plus = (x: number, y: number, rot = 0) =>
      G(`translate(${x} ${y})${rot ? ` rotate(${rot})` : ''}`, P('M-1.6 -4.6H1.6V-1.6H4.6V1.6H1.6V4.6H-1.6V1.6H-4.6V-1.6H-1.6Z', 'o'));
    const at: [number, number][] = [[56, 11], [76, 10], [24, 27], [40, 27], [56, 27], [22, 42], [40, 44], [57, 44], [38, 56], [56, 55], [76, 55]];
    return R(12, 2, 72, 60, 'c', 3) + at.map(([x, y]) => plus(x, y)).join('') + plus(76, 27, 45) + R(49.5, 4.5, 13, 13, 'pr', 2);
  },
  // Keep in Mind: the shape card (a thick square), the Round and Corners buttons and the dashed Note button.
  'prospective-memory': () =>
    R(30, 2, 36, 30, 'c', 3) + R(40, 9, 16, 16, 'k', 1) + R(8.5, 34.5, 40, 15, 'pr', 4) + R(10, 36, 37, 12, 'c', 3) + R(49, 36, 37, 12, 'c', 3) + R(10, 52, 76, 9, 'c ds', 3),
  // Vivid Links: two picture cards (a bird and a glass of milk) with their names, a plus between them, the note field.
  association: () =>
    R(5, 3, 37, 36, 'c', 3) + C(21, 17, 5, 'm1') + C(27, 12.5, 3.2, 'm1') + P('M30 12l3 1-3 1z', 'w') + C(28, 11.8, 0.7, 'i') + P('M14 15l-4-2 1 4z', 'm1') + L(19, 22, 18, 25, 'fn') + L(23, 22, 24, 25, 'fn') +
    L(16, 32, 28, 32, 'k') + P('M48 18v6M45 21h6', 'mu') +
    R(54, 3, 37, 36, 'c', 3) + P('M66 8h12l-1.5 17.5h-9z', 'fbg fn') + L(66.3, 12, 77.7, 12, 'fn') + L(66, 32, 78, 32, 'k') +
    R(5, 45, 86, 12, 'c', 3),
  // Ambiguity Detector: the situation and the message (accent bar), then the check-box options, the first in focus.
  'ambiguity-detector': () =>
    R(4, 2, 88, 31, 'c', 3) + L(9, 7, 22, 7, 'g') + L(9, 12, 74, 12, 'mu') + L(9, 18, 22, 18, 'g') + L(9, 22.5, 9, 29, 'al') + L(13, 25.8, 60, 25.8, 'k') +
    R(3, 36, 45, 13, 'pr', 3) + [[4, 37], [50, 37], [4, 51], [50, 51]].map(([x, y]) => R(x!, y!, 42, 11, 'c', 2.5) + R(x! + 3, y! + 2.5, 5, 5, 'c', 1) + L(x! + 11, y! + 4, x! + 30, y! + 4, 'fn') + L(x! + 11, y! + 8, x! + 36, y! + 8, 'g')).join(''),
  // Audience Switch: the situation card, the audience chips (current one marked), the facts to tick for this audience.
  'audience-switch': () =>
    R(4, 2, 88, 20, 'c', 3) + L(9, 7, 50, 7, 'k') + lines(9, 12.5, [76, 40], 4.5) +
    R(4, 25, 28, 8, 'c ab', 4) + tri(9, 29, 2, 'i') + L(13, 29, 28, 29, 'fn') + R(34, 25, 24, 8, 'c', 4) + L(39, 29, 54, 29, 'fn') +
    [36, 45, 54].map((y, i) => row(4, y, 88, 8, [70, 40, 58][i]!)).join(''),
  // Deep Read: the article title and the text card in paragraphs, the "done reading" button below.
  'deep-read': () =>
    L(5, 5, 42, 5, 'k') + R(4, 10, 88, 42, 'c', 3) +
    [[15, [70, 72, 40]], [32, [72, 70, 56]], [47, [62]]].map(([y, ws]) => L(9, y as number, 10, y as number, 'g') + lines(15, y as number, ws as number[], 5)).join('') +
    R(4, 55, 24, 8, 'a', 3),
  // Faces & Names: the portrait (face on a light ground) beside name, age and job, then the feature chips.
  'faces-names': () =>
    R(5, 3, 86, 44, 'c', 3) + R(8, 6, 26, 38, 'fbg', 2) + P('M10 44v-2.5a11 7 0 0 1 22 0v2.5z', 'fsh') + R(18.5, 29, 5, 7, 'fsk') +
    C(21, 21, 7.5, 'fsk') + P('M14 22q7 13 14 0q-7 4-14 0z', 'fhr') + C(18, 19.5, 1.9, 'fn') + C(24, 19.5, 1.9, 'fn') + L(19.9, 19.5, 22.1, 19.5, 'fn') +
    L(40, 14, 62, 14, 'k') + lines(40, 22, [18, 32, 36], 6) +
    [5, 30, 55].map((x, i) => R(x, 52, [22, 22, 30][i]!, 9, 'c', 4.5)).join(''),
  // Briefing Game: the situation card, the three step chips (Sort current), then the message cards with a section menu.
  'briefing-game': () =>
    R(4, 2, 88, 17, 'c', 3) + L(8, 7, 56, 7, 'k') + lines(8, 12, [80], 4) +
    R(4, 22, 22, 8, 'c ab', 4) + tri(9, 26, 2, 'i') + L(13, 26, 22, 26, 'fn') + R(28, 22, 18, 8, 'c', 4) + R(48, 22, 22, 8, 'c', 4) +
    [34, 49].map((y, i) => R(4, y, 88, 13, 'c', 3) + C(10, y + 4, 2.6, 'e') + L(15, y + 4, [72, 80][i]!, y + 4, 'mu') + R(15, y + 7, 22, 4.5, 'c', 1.5)).join(''),
  // Compression Challenge: the text card's title, the five step chips (first current), the sentences to tick.
  'compression-challenge': () =>
    R(4, 2, 88, 13, 'c', 3) + L(8, 6.5, 38, 6.5, 'k') + L(8, 11, 56, 11, 'g') +
    [0, 1, 2, 3, 4].map((i) => R(4 + i * 18, 18, 16, 7, i ? 'c' : 'c ab', 3.5)).join('') +
    [29, 40, 51].map((y, i) => row(4, y, 88, 9, [72, 50, 64][i]!)).join(''),
  // Best Plan: the road-network problem — lettered villages, one square junction, two built roads (thick, solid,
  // filled cost badges) and three possible roads (dashed, outlined cost badges).
  'mini-optimizer': () => {
    const p: Record<string, [number, number]> = { A: [16, 14], B: [56, 11], C: [84, 34], D: [20, 52], J: [50, 38] };
    const road = (a: string, b: string, built: boolean, cost: number) => {
      const [x1, y1] = p[a]!;
      const [x2, y2] = p[b]!;
      const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
      return L(x1, y1, x2, y2, built ? 'al' : 'mu ds') + R(mx - 4.5, my - 4, 9, 8, built ? 'a' : 'c', 2) + T(mx, my + 0.3, cost, built ? 't tsm ts' : 't tsm');
    };
    return R(4, 1.5, 88, 61, 'e', 5) + road('A', 'J', true, 3) + road('J', 'D', true, 2) + road('A', 'B', false, 4) + road('B', 'C', false, 3) + road('J', 'C', false, 4) +
      Object.entries(p).map(([k, [x, y]]) => (k === 'J' ? R(x - 5, y - 5, 10, 10, 'ob', 1) + T(x, y + 0.5, 1, 't tsm') : C(x, y, 6, 'ob') + T(x, y + 0.5, k, 't tsm'))).join('');
  },
  'pixel-peel': () => {
    // A dense pixel landscape partly peeled from the edge, its track with station ticks, and four lane fronts below.
    const pic = ['..00000003300.', '.000000003300.', '00011000000000', '00111100004400', '01111155044440', '22222255222222', '22442222224422', '.222222222222.'];
    const fill: Record<string, string> = { '0': 'm1', '1': 'm4', '2': 'm2', '3': 'm3', '4': 'm5', '5': 'm0' };
    const s = 4, x0 = 20, y0 = 5, w = 14, h = 8;
    let out = R(x0 - 4, y0 - 4, w * s + 8, h * s + 8, 'e', 3);
    let ticks = '';
    for (let q = 0; q < w; q++) ticks += `M${n(x0 + q * s + s / 2)} ${n(y0 - 3)}v1.6M${n(x0 + q * s + s / 2)} ${n(y0 + h * s + 1.4)}v1.6`;
    for (let r = 0; r < h; r++) ticks += `M${n(x0 - 3)} ${n(y0 + r * s + s / 2)}h1.6M${n(x0 + w * s + 1.4)} ${n(y0 + r * s + s / 2)}h1.6`;
    out += P(ticks, 'g');
    pic.forEach((row, r) => [...row].forEach((ch, q) => {
      out += R(x0 + q * s, y0 + r * s, s - 0.4, s - 0.4, ch === '.' ? 'hb' : (fill[ch] as string), 0.5);
    }));
    const token = (x: number, c: string, num: number, symbol: string) => R(x, 45, 19, 15, 'o', 3) + R(x + 2, 47, 8, 11, c, 1.5) + symbol + T(x + 14.3, 52.9, num, 't tsm');
    out += token(8, 'm2', 9, R(12.3, 50.6, 3.4, 3.8, 'sf'));
    out += token(29, 'm4', 6, poly([[35, 49.4], [37.6, 55.2], [32.4, 55.2]], 'sf'));
    out += token(50, 'm5', 4, C(56, 52.5, 2.1, 'sf'));
    out += token(71, 'm1', 8, poly([[77, 49.6], [79.6, 52.5], [77, 55.4], [74.4, 52.5]], 'sf'));
    return out;
  },
  // Estimation Lab: the question card, the review's log scale (decade ticks, hatched plausible range, the answer ◆ close
  // to the reference line) and the model as three factor boxes joined by ×. No text or digits (language-neutral).
  'fermi-lab': () =>
    R(6, 3, 84, 14, 'e', 3) + L(12, 8.5, 70, 8.5, 'mu') + L(12, 12.5, 50, 12.5, 'mu') +
    R(42, 24, 22, 13, 'o', 1) + [44, 49, 54, 59].map((x) => L(x, 36.5, x + 4, 24.5, 'fn')).join('') +
    L(8, 30.5, 88, 30.5, 'k') + [10, 29, 48, 67, 86].map((x) => L(x, 27, x, 34, 'k')).join('') +
    L(55, 20, 55, 41, 'al') + diamond(49, 30.5, 4.5, 'a') +
    [8, 37, 66].map((x) => R(x, 47, 22, 13, 'o', 2)).join('') + cross(33, 53.5, 'k', 1.8) + cross(62, 53.5, 'k', 1.8),
  'many-lives': () => {
    // The game's scene: a house behind on the left, the person in the centre, a desk on the right; stat meters on top.
    let out = R(4, 4, 88, 10, 'e', 2);
    [[8, 0.7], [30, 0.5], [52, 0.6], [74, 0.4]].forEach(([x, f]) => {
      out += L(x as number, 9, (x as number) + 14, 9, 'g') + L(x as number, 9, (x as number) + 14 * (f as number), 9, 'al');
    });
    out += L(4, 58, 92, 58, 'k');
    out += R(10, 36, 22, 22, 'wd', 1) + poly([[7, 37], [21, 25], [35, 37]], 'i') + R(14, 40, 6, 6, 'e') + R(23, 46, 5, 12, 'd');
    out += R(42, 40, 12, 14, 'a', 4) + C(48, 33, 6, 'fsk') + P('M42 32c0-7 12-7 12 0c-3-3-9-3-12 0z', 'fhr');
    out += R(42, 54, 4, 4, 'd') + R(50, 54, 4, 4, 'd');
    out += R(64, 48, 24, 3, 'wd') + R(70, 36, 12, 10, 'o', 1) + L(76, 46, 76, 48, 'k');
    return out;
  },
  // Probability Detective: the case file (folded corner, story lines), the belief split bar (solid ● share, hatched ■
  // share, the estimate ◆ on the split) and a small counting board: one root box, two hypothesis boxes, each split
  // into a bold box that fits the clue and a dashed one that does not. No text or digits (language-neutral).
  'probability-detective': () =>
    P('M6 3h76l8 6v10H6Z', 'e') + P('M82 3v6h8', 'fn') + L(12, 8.5, 66, 8.5, 'mu') + L(12, 13, 52, 13, 'mu') +
    R(8, 23, 46, 7, 'a', 1) + R(54, 23, 34, 7, 'o', 1) + hatch(54, 23, 34, 7, 3, 'fn') + diamond(54, 26.5, 4.5, 'o') +
    R(38, 35, 20, 7, 'o', 1.5) + L(48, 42, 25, 46, 'fn') + L(48, 42, 71, 46, 'fn') +
    R(15, 46, 20, 6, 'o', 1.5) + R(61, 46, 20, 6, 'o', 1.5) +
    L(25, 52, 15, 55, 'fn') + L(25, 52, 35, 55, 'fn') + L(71, 52, 61, 55, 'fn') + L(71, 52, 81, 55, 'fn') +
    R(6, 55, 18, 6, 'ob', 1.5) + R(27, 55, 17, 6, 'o ds', 1.5) + R(52, 55, 17, 6, 'ob', 1.5) + R(72, 55, 18, 6, 'o ds', 1.5),
  // The atlas page: sea, three abstract land masses (no real shapes), the Equator (solid) and a tropic (dashed),
  // the target striped, the player's ◆ marker and the dashed great-circle line between them.
  'atlas-explorer': () =>
    R(4, 3, 88, 58, 'tw', 6) +
    L(4, 32, 92, 32, 'fn') + L(4, 22.5, 92, 22.5, 'fn ds') +
    P('M12 10c6-4 14-2 16 3c1 4-3 6-6 7c3 4 4 9 1 14c-2 4-5 7-7 9c-2-4 0-9-2-13c-4-3-5-8-4-12c0-3 1-6 2-8z', 'rl') +
    P('M38 12c10-5 26-6 38-1c6 3 6 9 1 12c-5 2-10 1-14 3c-2 5-6 9-9 14c-2 3-5 4-7 1c-2-4-1-9-4-12c-4-2-6-6-4-10c-3-2-3-5-1-7z', 'rl') +
    P('M70 41c5-3 12-2 15 1c2 3 1 7-3 8c-4 1-8 1-11-1c-3-2-3-6-1-8z', 'rl') +
    L(72.5, 48, 75.5, 42.5, 'ab') + L(75.5, 49, 79, 42, 'ab') + L(79, 49, 82.5, 42, 'ab') + L(82.5, 48.5, 85, 44, 'ab') +
    P('M50 52Q60 44 72 45', 'fn ds') + diamond(50, 52, 3.8, 'a'),
  // Sense of Time: three stacked order cards with ▲▼ handles above the timeline: an axis whose ticks close up towards
  // the right (the squeezed scale), the hatched accepted range with a bold outline and the answer ◆ just left of it.
  // No text or digits; not mirrored (the timeline runs left to right in every locale).
  timeline: () =>
    [3, 14, 25].map((y, i) =>
      R(14, y, 68, 9, 'e', 2) + L(20, y + 4.5, 20 + [40, 32, 36][i]!, y + 4.5, 'mu') +
      tri(73, y + 3, 1.8, 'i') + poly([[71.2, y + 5.6], [74.8, y + 5.6], [73, y + 7.6]], 'i')).join('') +
    L(4, 48, 92, 48, 'k') + [8, 36, 58, 74, 86].map((x) => L(x, 44.5, x, 51.5, 'k')).join('') +
    R(44, 43, 11, 10, 'ob', 1) + hatch(44, 43, 11, 10, 3, 'fn') + diamond(39, 48, 4.2, 'a'),
  // Pond & Meadow: on the left a pond cross-section (waterline, muddy bottom, three wavy pondweed stems, two duckweed
  // ovals on the surface, a small fish outline); on the right a tiny chart with a solid and a dashed line that cross
  // once, and a circular loop arrow with the letter R in the corner. Not mirrored (the chart runs left to right).
  ecosystem: () =>
    R(3, 14, 56, 46, 'tw', 3) + P('M3 14q7-3 14 0t14 0t14 0t14 0', 'fn') + P('M3 54q14-5 28-1t28-2V60H3Z', 'th') +
    [12, 24, 47].map((x, i) => P(`M${x} 55q-4-${8 + i * 2} 0-${16 + i * 3}t0-${18 + i * 4}`, 'okl')).join('') +
    `<ellipse cx="20" cy="14" rx="4.5" ry="1.8" class="cd"/><ellipse cx="40" cy="14" rx="4" ry="1.6" class="cd"/>` +
    P('M30 33q6-5 12 0q-6 5-12 0zM30 33l-4-3v6z', 'o') +
    R(63, 4, 30, 26, 'e', 2) + L(66, 26, 90, 26, 'fn') + L(66, 8, 66, 26, 'fn') +
    P('M66 22c6-1 9-12 14-12s6 9 10 10', 'al') + P('M66 12c7 0 10 12 14 11s5-4 10-5', 'k ds') +
    P('M70 47a10 10 0 1 1 7 9.5', 'k') + tri(76, 56, 2.6, 'i') + T(78, 46.5, 'R'),
  // Tones & Chords: a five-line staff fragment with two stacked noteheads a third apart on one stem and three sound-wave
  // arcs to their right; below, one octave of piano keys (7 white, 5 black) with two keys marked by dots. No text and no
  // clef glyph; not mirrored (pitch rises left to right in every locale).
  harmony: () =>
    [5, 10, 15, 20, 25].map((y) => L(6, y, 62, y, 'fn')).join('') +
    `<ellipse cx="30" cy="20" rx="3.1" ry="2.2" transform="rotate(-20 30 20)" class="i"/>` +
    `<ellipse cx="30" cy="15" rx="3.1" ry="2.2" transform="rotate(-20 30 15)" class="i"/>` +
    L(32.9, 19.4, 32.9, 2.5, 'fn') +
    [0, 1, 2].map((i) => P(`M${44 + i * 5} ${11 - i * 2}q${4 + i * 1.5} ${7 + i * 2} 0 ${14 + i * 4}`, 'ab')).join('') +
    [0, 1, 2, 3, 4, 5, 6].map((i) => R(6 + i * 12, 36, 12, 25, 'c', 1)).join('') +
    [0, 1, 3, 4, 5].map((i) => R(6 + (i + 1) * 12 - 3.6, 36, 7.2, 15, 'i', 0.8)).join('') +
    C(12, 55, 2.6, 'a') + C(36, 55, 2.6, 'a'),
  // Weight & Balance: a level bar on a triangular stand with two hanging weights (the taller one nearer the axle, so
  // 2 × 16 = 4 × 8); on the right a table edge with three blocks stacked past it and a dashed plumb line at the edge.
  // No text; not mirrored (left and right are the picture's sides in every locale).
  'balance-lab': () =>
    poly([[30, 22], [23, 44], [37, 44]], 'e') + R(5, 18.5, 50, 3.5, 'o', 1.5) + C(30, 20.2, 1.4, 'i') +
    L(14, 22, 14, 27, 'fn') + R(10, 27, 8, 8, 'a', 1) + L(38, 22, 38, 27, 'fn') + R(34, 27, 8, 16, 'a', 1) +
    R(58, 48, 24, 14, 'wd') + R(71, 41, 13.2, 7, 'o', 1) + R(74.3, 34, 13.2, 7, 'o', 1) + R(80.9, 27, 13.2, 7, 'o', 1) +
    L(82, 18, 82, 48, 'fn ds')
};

/** Pictures made only of text cards and lines: these follow the reading direction (flipped in RTL). */
export const MIRRORED: ReadonlySet<string> = new Set(['ambiguity-detector', 'audience-switch', 'deep-read', 'briefing-game', 'compression-challenge']);

/** Neutral glyph for a game without its own preview yet (circle, square, triangle). */
const FALLBACK = () => C(28, 34, 11, 'a') + R(40, 22, 22, 22, 'o', 3) + tri(74, 36, 11, 'i');

/** Games whose card shows a picture rendered by the game itself instead of a drawing (see the header comment). */
export const PHOTOS: ReadonlySet<string> = new Set(['relay-command', 'card-quest']);

/** Same-origin URL of a game's preview photo, under the app's base URL (works at any deploy path and offline). */
export const photoUrl = (id: string, scheme: 'light' | 'dark'): string => `${import.meta.env.BASE_URL}previews/${id}-${scheme}.webp`;

export const hasPreview = (id: string): boolean => Object.hasOwn(PREVIEWS, id) || PHOTOS.has(id);
export const previewIds = (): string[] => [...Object.keys(PREVIEWS), ...PHOTOS];

const PHOTO_IMG = { alt: '', 'aria-hidden': 'true', width: '96', height: '64', decoding: 'async', loading: 'lazy', class: 'game-preview game-preview--photo' };

/** The markup of a game's preview: a `<picture>` for photo games, SVG for all others (the neutral glyph for unknown ids). */
export const previewMarkup = (id: string): string => {
  if (PHOTOS.has(id)) {
    const img = Object.entries({ src: photoUrl(id, 'light'), ...PHOTO_IMG }).map(([k, v]) => ` ${k}="${v}"`).join('');
    return `<picture class="game-preview-picture"><source media="(prefers-color-scheme: dark)" srcset="${photoUrl(id, 'dark')}"><img${img}></picture>`;
  }
  const body = (PREVIEWS[id] ?? FALLBACK)();
  const cls = `game-preview${MIRRORED.has(id) ? ' game-preview--flow' : ''}${hasPreview(id) ? '' : ' game-preview--generic'}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" class="${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
};

/**
 * The preview as a DOM element: a photo game's `<picture>` built element by element; otherwise the drawing, parsed
 * as SVG XML (a constant from this module, never user text);
 * if it ever failed to parse, the neutral glyph is used instead.
 */
export const gamePreview = (id: string): Element => {
  if (PHOTOS.has(id)) {
    const picture = document.createElement('picture');
    picture.className = 'game-preview-picture';
    const source = document.createElement('source');
    source.media = '(prefers-color-scheme: dark)';
    source.srcset = photoUrl(id, 'dark');
    const img = document.createElement('img');
    for (const [k, v] of Object.entries({ src: photoUrl(id, 'light'), ...PHOTO_IMG })) img.setAttribute(k, v);
    picture.append(source, img);
    return picture;
  }
  const parse = (markup: string) => {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const root = doc.documentElement;
    return root.nodeName === 'svg' && !doc.querySelector('parsererror') ? root : undefined;
  };
  const root = parse(previewMarkup(id)) ?? parse(previewMarkup(''));
  return document.importNode(root!, true);
};
