/* Relay Command icon-set previews. Hand-written SVG only (no third-party assets).
   All geometry lives in a 44 x 44 box = one map cell at 1x (CELL = 44 in view.ts). */
"use strict";

const TH = {
  light: {
    name: "light",
    bg: "#f6f4ef",
    surface: "#ffffff",
    surface2: "#ecebe5",
    text: "#1d1d1b",
    muted: "#5c5b55",
    border: "#cfcdc4",
    focus: "#b4530a",
    danger: "#a1271b",
    p1: "#24508f",
    p2: "#9a3412",
    accent: "#2f5d50",
    terrain: {
      plain: "#e7e3d4",
      road: "#cfc8b4",
      forest: "#b9d0ae",
      hill: "#ddcfa8",
      urban: "#d3d1cc",
      swamp: "#c4d3c2",
      water: "#a9c7dd",
      ridge: "#a9a49a",
    },
    mark: "rgba(29,29,27,0.45)",
    grid: "rgba(29,29,27,0.12)",
    nocover: "rgba(29,29,27,0.3)",
    fog: "rgba(29,29,27,0.16)",
    gem: "rgba(29,29,27,0.8)",
  },
  dark: {
    name: "dark",
    bg: "#171816",
    surface: "#22231f",
    surface2: "#2c2d28",
    text: "#ecebe4",
    muted: "#a9a79d",
    border: "#45463f",
    focus: "#f0a35e",
    danger: "#f08a7e",
    p1: "#8db4f0",
    p2: "#f2a07a",
    accent: "#8fc1ad",
    terrain: {
      plain: "#3a3a32",
      road: "#4a473d",
      forest: "#2f4a33",
      hill: "#514832",
      urban: "#44443f",
      swamp: "#344238",
      water: "#2a4356",
      ridge: "#5a5650",
    },
    mark: "rgba(236,235,228,0.45)",
    grid: "rgba(236,235,228,0.12)",
    nocover: "rgba(236,235,228,0.3)",
    fog: "rgba(0,0,0,0.32)",
    gem: "rgba(236,235,228,0.85)",
  },
};

/* ---------- Ruleset (copied from packages/strategy-engine/src/content.ts, strategy-3) ---------- */
const KINDS = {
  rifles: { name: "Rifle Squad", cat: "inf", hp: 40, vision: 4 },
  lancer: { name: "Lancer Team", cat: "inf", hp: 35, vision: 4 },
  outrider: { name: "Outrider", cat: "veh", hp: 45, vision: 6 },
  warden: { name: "Warden", cat: "veh", hp: 140, vision: 4 },
  howitzer: { name: "Field Gun", cat: "veh", hp: 50, vision: 3 },
  kite: { name: "Kite Drone", cat: "air", hp: 20, vision: 6, relay: 3 },
  "mast-truck": {
    name: "Mast Truck",
    cat: "veh",
    hp: 60,
    vision: 4,
    relay: 5,
    deploys: true,
  },
  "field-post": {
    name: "Field Post",
    cat: "veh",
    hp: 90,
    vision: 4,
    source: 4,
    deploys: true,
  },
  jammer: {
    name: "Static Jammer",
    cat: "veh",
    hp: 50,
    vision: 3,
    deploys: true,
  },
  tracer: { name: "Tracer", cat: "veh", hp: 45, vision: 4 },
  "command-post": {
    name: "Command Post",
    cat: "str",
    hp: 400,
    vision: 5,
    source: 5,
  },
  "relay-mast": {
    name: "Relay Mast",
    cat: "str",
    hp: 100,
    vision: 4,
    relay: 6,
  },
  muster: { name: "Muster Yard", cat: "str", hp: 200, vision: 3 },
  "motor-pool": { name: "Motor Pool", cat: "str", hp: 250, vision: 3 },
  extractor: { name: "Extractor", cat: "str", hp: 120, vision: 3 },
  "tower-gun": { name: "Gun Tower", cat: "def", hp: 150, vision: 5 },
  "tower-artillery": {
    name: "Artillery Tower",
    cat: "def",
    hp: 150,
    vision: 5,
  },
  "tower-laser": { name: "Laser Tower", cat: "def", hp: 120, vision: 5 },
  "tower-emp": { name: "EMP Tower", cat: "def", hp: 120, vision: 5 },
};
const UNIT_KINDS = [
  "rifles",
  "lancer",
  "outrider",
  "warden",
  "howitzer",
  "kite",
  "mast-truck",
  "field-post",
  "jammer",
  "tracer",
];
const STRUCT_KINDS = [
  "command-post",
  "relay-mast",
  "muster",
  "motor-pool",
  "extractor",
  "tower-gun",
  "tower-artillery",
  "tower-laser",
  "tower-emp",
];

/* ---------- SVG helpers ---------- */
let uidN = 0;
const uid = (p) => `${p}${++uidN}`;
const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
const path = (d, o = {}) => `<path d="${d}" ${attrs(o)}/>`;
const circle = (cx, cy, r, o = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs(o)}/>`;
const rect = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs(o)}/>`;
const line = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs(o)}/>`;
const text = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" ${attrs(o)}>${s}</text>`;
const g = (inner, o = {}) => `<g ${attrs(o)}>${inner}</g>`;
const rectD = (x, y, w, h, r = 0) =>
  r === 0
    ? `M${x},${y} H${x + w} V${y + h} H${x} Z`
    : `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
const circleD = (cx, cy, r) =>
  `M${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} Z`;
const polyD = (pts) => "M" + pts.map((p) => p.join(",")).join(" L") + " Z";
const octD = (x, y, w, h, c) =>
  polyD([
    [x + c, y],
    [x + w - c, y],
    [x + w, y + c],
    [x + w, y + h - c],
    [x + w - c, y + h],
    [x + c, y + h],
    [x, y + h - c],
    [x, y + c],
  ]);

const FRAME_W = 2.5; // frame stroke at 1x
const MARK_W = 2; // role-mark stroke at 1x (consistent weight across all sets)

function colours(th, side, ghost) {
  const own = side === "own";
  const c = own ? th.p1 : th.p2;
  return {
    c,
    own,
    fill: own && !ghost ? c : th.surface,
    ink: own && !ghost ? th.surface : c,
    halo: th.surface,
  };
}

/* ======================= SET A: frames + role marks ======================= */
// Frame = category and side (own: plain rectangle / square; enemy: pointed / cut corners).
// Mark inside = function. Wheels = vehicle, arched top = air, foundation bar = structure,
// battlements = defence tower. Same mark for the same function (flag = command source, mast = relay).
const A = {
  name: "A",
  title: "Set A: frames + role marks",
  frame(cat, side) {
    const own = side === "own";
    if (cat === "inf" || cat === "veh")
      return own
        ? rectD(7, 8, 30, 20, 3)
        : polyD([
            [3, 18],
            [10, 8],
            [34, 8],
            [41, 18],
            [34, 28],
            [10, 28],
          ]);
    if (cat === "air")
      return own
        ? "M7,28 L7,17 Q22,1 37,17 L37,28 Z"
        : "M3,22 L8,15 Q22,0 36,15 L41,22 L36,28 L8,28 Z";
    return own ? rectD(9, 5, 26, 26, 1.5) : octD(9, 5, 26, 26, 6);
  },
  legsY: 28,
  extras(cat, side, col, st) {
    let s = "";
    if (cat === "veh" && !st.deployed) {
      for (const x of [14, 30])
        s += circle(x, 32, 2.6, {
          fill: col.own && !st.ghost ? col.c : col.halo,
          stroke: col.c,
          "stroke-width": 1.6,
        });
    }
    if (cat === "str" || cat === "def")
      s += line(7, 34.5, 37, 34.5, {
        stroke: col.c,
        "stroke-width": 3,
        "stroke-linecap": "butt",
        "stroke-dasharray": st.site ? "3 2" : undefined,
      });
    if (cat === "def") {
      const xs = side === "own" ? [11.5, 20, 28.5] : [15, 20, 25];
      for (const x of xs) s += rect(x, 1, 4, 4, { fill: col.c });
    }
    return s;
  },
  mark(kind, ink) {
    const st = {
      fill: "none",
      stroke: ink,
      "stroke-width": MARK_W,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    };
    const fl = { fill: ink, stroke: "none" };
    const arcs = (cx, cy) =>
      path(
        `M${cx - 2.8},${cy - 2.8} A4,4 0 0 0 ${cx - 2.8},${cy + 2.8} M${cx + 2.8},${cy - 2.8} A4,4 0 0 1 ${cx + 2.8},${cy + 2.8} M${cx - 4.9},${cy - 4.9} A7,7 0 0 0 ${cx - 4.9},${cy + 4.9} M${cx + 4.9},${cy - 4.9} A7,7 0 0 1 ${cx + 4.9},${cy + 4.9}`,
        st,
      );
    switch (kind) {
      case "rifles":
        return path("M16,13 V23 M22,13 V23 M28,13 V23", st);
      case "lancer":
        return (
          path("M12,18 H25 M21,14 L25,18 L21,22", st) +
          path("M29.5,12 V24", { ...st, "stroke-width": 3 })
        );
      case "outrider":
        return (
          path("M12,18 Q22,9 32,18 Q22,27 12,18 Z", st) +
          circle(22, 18, 2.6, fl)
        );
      case "warden":
        return (
          path(rectD(12, 13, 20, 10, 5), { ...st, "stroke-width": 2.5 }) +
          path("M17,18 H27", st)
        );
      case "howitzer":
      case "tower-artillery":
        return path("M11,25 Q17,6 28.5,20", st) + circle(29.5, 22, 2.6, fl);
      case "kite":
        return (
          path("M22,10 L28,17 L22,24 L16,17 Z M16,17 H28", st) +
          path("M22,24 Q19.5,25.5 22,27", st)
        );
      case "mast-truck":
        return path("M22,25 V14", st) + arcs(22, 14);
      case "field-post":
      case "command-post":
        return path("M17,26 V10", st) + path("M17,10 L29,14 L17,18 Z", fl);
      case "jammer":
        return path("M11,18 L15,12 L19,24 L23,12 L27,24 L31,12 L33,15", st);
      case "tracer":
        return circle(22, 15, 5, st) + path("M22,20 V25 M19,15 H25", st);
      case "relay-mast":
        return (
          path("M16.5,28 L22,13 L27.5,28 M18.4,23 H25.6", st) + arcs(22, 13)
        );
      case "muster":
        return path(
          "M13,15 L22,9 L31,15 M17,18.5 V27 M22,18.5 V27 M27,18.5 V27",
          st,
        );
      case "motor-pool":
        return (
          path("M13,15 L22,9 L31,15", st) +
          circle(17, 23, 3.5, st) +
          circle(27, 23, 3.5, st)
        );
      case "extractor":
        return (
          path("M22,17 L28,23 L22,29 L16,23 Z", st) +
          path("M22,23 V9 M18.5,12.5 L22,9 L25.5,12.5", st)
        );
      case "tower-gun":
        return (
          circle(22, 22, 5, st) +
          path("M22,17 V9", { ...st, "stroke-width": 3 })
        );
      case "tower-laser":
        return path(
          "M13,27 L26.5,13.5 M29,11 L31.5,8.5 M30,14.5 H33.5 M25.5,10 V6.5",
          st,
        );
      case "tower-emp":
        return (
          circle(22, 19, 3, st) +
          circle(22, 19, 8, { ...st, "stroke-dasharray": "3 2.6" })
        );
      default:
        return "";
    }
  },
};

/* ======================= SET B: silhouette pictograms on tokens ======================= */
// Keeps today's token convention (own = filled circle, enemy = outlined diamond, structure = square;
// enemy structure = cut corners) and replaces the glyphs with small silhouettes. Enemy pictograms face left.
const B = {
  name: "B",
  title: "Set B: silhouette pictograms on tokens",
  frame(cat, side) {
    const own = side === "own";
    if (cat === "str" || cat === "def")
      return own ? rectD(8, 4, 28, 28, 2) : octD(8, 4, 28, 28, 7);
    return own
      ? circleD(22, 18, 14)
      : polyD([
          [22, 1.5],
          [38.5, 18],
          [22, 34.5],
          [5.5, 18],
        ]);
  },
  legsY: 30,
  extras(cat, side, col) {
    let s = "";
    if (cat === "def") {
      const xs = side === "own" ? [10.5, 20, 29.5] : [15, 20, 25];
      for (const x of xs) s += rect(x, 0, 4, 4, { fill: col.c });
    }
    return s;
  },
  mirrorEnemy: true,
  mark(kind, ink, bgc) {
    const f = { fill: ink };
    const st = {
      fill: "none",
      stroke: ink,
      "stroke-width": MARK_W,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    };
    const cut = { fill: bgc };
    const truck = () =>
      path("M11,20 H26 V26 H11 Z M26,22 H30 L33,24.5 V26 H26 Z", f) +
      circle(15, 26.5, 2.4, { fill: ink, stroke: bgc, "stroke-width": 1.2 }) +
      circle(29, 26.5, 2.4, { fill: ink, stroke: bgc, "stroke-width": 1.2 });
    switch (kind) {
      case "rifles":
        return (
          circle(18, 11.5, 2.5, f) +
          circle(26, 11.5, 2.5, f) +
          path(rectD(15.7, 14.6, 4.6, 12, 1.6), f) +
          path(rectD(23.7, 14.6, 4.6, 12, 1.6), f)
        );
      case "lancer":
        return (
          circle(19, 11.5, 2.5, f) +
          path(rectD(16.7, 14.6, 4.6, 12, 1.6), f) +
          path("M12.5,19.5 L31.5,13", {
            ...st,
            "stroke-width": 3.4,
            "stroke-linecap": "butt",
          })
        );
      case "outrider":
        return (
          path("M11,23.5 V19 H15 L18.5,14.5 H26 L29.5,19 H33 V23.5 Z", f) +
          circle(16, 24.5, 2.9, {
            fill: ink,
            stroke: bgc,
            "stroke-width": 1.3,
          }) +
          circle(28, 24.5, 2.9, { fill: ink, stroke: bgc, "stroke-width": 1.3 })
        );
      case "warden":
        return (
          path("M10,21 H34 L31,26.5 H13 Z", f) +
          path(rectD(15.5, 15.5, 11, 5, 2), f) +
          path(rectD(26, 17.2, 9, 2, 0), f) +
          path("M14,24 H30", {
            stroke: bgc,
            "stroke-width": 1,
            "stroke-dasharray": "2 2",
          })
        );
      case "howitzer":
        return (
          path("M18,22 L32,10", { ...st, "stroke-width": 3.4 }) +
          path("M18,24 L10,27.5", { ...st, "stroke-width": 2.4 }) +
          circle(19, 23.5, 4.2, { fill: ink, stroke: bgc, "stroke-width": 1.2 })
        );
      case "kite":
        return (
          path("M16,12 L28,24 M28,12 L16,24", { ...st, "stroke-width": 2.2 }) +
          [
            [16, 12],
            [28, 12],
            [16, 24],
            [28, 24],
          ]
            .map(([x, y]) =>
              circle(x, y, 3, { fill: bgc, stroke: ink, "stroke-width": 1.8 }),
            )
            .join("") +
          path(rectD(19.5, 15.5, 5, 5, 1), f)
        );
      case "mast-truck":
        return (
          truck() +
          path("M16,20 V10", st) +
          path(
            "M18.5,7.5 A3.5,3.5 0 0 1 18.5,12.5 M20.6,5.4 A6.5,6.5 0 0 1 20.6,14.6",
            st,
          )
        );
      case "field-post":
        return (
          truck() +
          path("M16,20 V7.5", st) +
          path("M16,7.5 L25.5,10.5 L16,13.5 Z", f)
        );
      case "jammer":
        return (
          truck() +
          path(
            "M11.5,16 L14.5,10.5 L17.5,16 L20.5,10.5 L23.5,16 L26.5,10.5",
            st,
          )
        );
      case "tracer":
        return truck() + circle(17, 12, 3.8, st) + path("M17,15.8 V20", st);
      case "command-post":
        return (
          path(rectD(13, 18.5, 18, 10, 0), f) +
          path(rectD(19.5, 22.5, 5, 6, 0), cut) +
          path("M22,18.5 V7", st) +
          path("M22,7 L30.5,10 L22,13 Z", f)
        );
      case "relay-mast":
        return (
          path(
            "M16,28 L22,9 L28,28 M17.7,23 L26.3,23 M19.3,18 L24.7,18 M17.7,23 L24.7,18 M26.3,23 L19.3,18",
            st,
          ) +
          path(
            "M24.8,6.2 A3.8,3.8 0 0 1 24.8,11.8 M27,4.4 A6.5,6.5 0 0 1 27,13.6",
            st,
          )
        );
      case "muster":
        return (
          path("M10.5,28.5 L22,10 L33.5,28.5 Z", f) +
          path("M18.5,28.5 L22,21 L25.5,28.5 Z", cut)
        );
      case "motor-pool":
        return (
          path("M11,28.5 V16.5 L22,9.5 L33,16.5 V28.5 Z", f) +
          path(rectD(15, 18.5, 14, 10, 0), cut) +
          path("M15,21.5 H29 M15,25 H29", { stroke: ink, "stroke-width": 1.5 })
        );
      case "extractor":
        return (
          path("M9.5,28.5 H34.5", { ...st }) +
          path("M17.5,28.5 L21.5,17 L25.5,28.5 Z", f) +
          path("M12,16.5 L31.5,13", { ...st, "stroke-width": 3 }) +
          path(rectD(9.5, 14.5, 4, 7, 1), f) +
          path("M11.5,21 V28", { ...st, "stroke-width": 1.5 })
        );
      case "tower-gun":
        return (
          path("M11,28.5 V22 Q22,10 33,22 V28.5 Z", f) +
          path(rectD(15, 21.5, 11, 2.4, 0), cut) +
          path(rectD(26, 21.5, 9, 2.4, 0), f)
        );
      case "tower-artillery":
        return (
          path("M12,28.5 V24 Q22,14 32,24 V28.5 Z", f) +
          path("M21,20 L31.5,9", {
            ...st,
            "stroke-width": 3.4,
            "stroke-linecap": "butt",
          })
        );
      case "tower-laser":
        return (
          path(rectD(19, 14, 6, 14.5, 1), f) +
          circle(22, 11.5, 3.6, f) +
          path("M24.5,9.5 L31,5.5 M31.5,8.5 H34.5 M29,3.5 L30,2", st)
        );
      case "tower-emp":
        return (
          path(rectD(19.5, 15, 5, 13.5, 1), f) +
          circle(22, 12, 2.8, f) +
          path(
            "M18.3,8.3 A5.2,5.2 0 0 0 18.3,15.7 M25.7,8.3 A5.2,5.2 0 0 1 25.7,15.7 M15.6,5.6 A9,9 0 0 0 15.6,18.4 M28.4,5.6 A9,9 0 0 1 28.4,18.4",
            st,
          )
        );
      default:
        return "";
    }
  },
};

/* ======================= SET C: category shape + letter code ======================= */
// Shape = category (circle infantry, rounded box vehicle, triangle air, house structure, shield tower);
// side = solid fill (own) vs double outline (enemy); letter = kind (would need a short code per locale).
const C = {
  name: "C",
  title: "Set C: category shape + letter code",
  frame(cat) {
    if (cat === "inf") return circleD(22, 18, 13.5);
    if (cat === "veh") return rectD(6, 7, 32, 22, 7);
    if (cat === "air")
      return polyD([
        [22, 2],
        [39.5, 31],
        [4.5, 31],
      ]);
    if (cat === "str")
      return polyD([
        [22, 2],
        [37, 12],
        [37, 32],
        [7, 32],
        [7, 12],
      ]);
    return polyD([
      [7, 4],
      [37, 4],
      [37, 19],
      [22, 33],
      [7, 19],
    ]);
  },
  legsY: 29,
  doubleEnemy: true,
  centre: { inf: 18, veh: 18, air: 23.5, str: 22.5, def: 15.5 },
  codes: {
    rifles: "R",
    lancer: "L",
    outrider: "O",
    warden: "W",
    howitzer: "G",
    kite: "K",
    "mast-truck": "M",
    "field-post": "P",
    jammer: "J",
    tracer: "T",
    "command-post": "HQ",
    "relay-mast": "M",
    muster: "MY",
    "motor-pool": "MP",
    extractor: "E",
    "tower-gun": "G",
    "tower-artillery": "A",
    "tower-laser": "L",
    "tower-emp": "E",
  },
  extras() {
    return "";
  },
  mark(kind, ink) {
    const cat = KINDS[kind].cat;
    const code = this.codes[kind];
    const size = code.length > 1 ? 11.5 : 15;
    return text(22, this.centre[cat] + size * 0.36, code, {
      "text-anchor": "middle",
      "font-size": size,
      "font-weight": 800,
      fill: ink,
      "font-family": "system-ui, Segoe UI, Roboto, Noto Sans, sans-serif",
    });
  },
};

const SETS = { A, B, C };

/* ---------- Shared state overlays ---------- */
function hpPips(th, col, frac) {
  const n = Math.max(0, Math.min(5, Math.ceil(frac * 5 - 1e-9)));
  let s = rect(5.5, 36.2, 33, 6, { fill: th.surface, rx: 1.5, opacity: 0.92 });
  for (let i = 0; i < 5; i++)
    s += rect(7 + i * 6.1, 37.4, 5.1, 3.6, {
      fill: i < n ? col.c : th.surface,
      stroke: col.c,
      "stroke-width": 1,
    });
  return s;
}
function legs(y, col) {
  // Set-up vehicle: wheels replaced by outrigger legs on a ground line ("stands like a structure").
  return path(
    `M13,${y} L8.5,${y + 6} M31,${y} L35.5,${y + 6} M5,${y + 6} H39`,
    {
      fill: "none",
      stroke: col.c,
      "stroke-width": 2.4,
      "stroke-linecap": "round",
    },
  );
}
function badgeGhost(th, col) {
  return (
    circle(6.5, 6.5, 6, {
      fill: th.surface,
      stroke: col.c,
      "stroke-width": 1.5,
    }) +
    text(6.5, 10, "?", {
      "text-anchor": "middle",
      "font-size": 10,
      "font-weight": 800,
      fill: col.c,
      "font-family": "system-ui, sans-serif",
    })
  );
}
function badgeNoContact(th) {
  return (
    circle(37.5, 6.5, 6, {
      fill: th.surface,
      stroke: th.danger,
      "stroke-width": 1.5,
    }) +
    path(
      "M34.6,6.2 A4,4 0 0 1 40.4,6.2 M36,8 A2,2 0 0 1 39,8 M33.8,10.2 L41.2,2.8",
      {
        fill: "none",
        stroke: th.danger,
        "stroke-width": 1.4,
        "stroke-linecap": "round",
      },
    )
  );
}
function badgeJammed(th) {
  return (
    circle(37.5, 6.5, 6, {
      fill: th.surface,
      stroke: th.danger,
      "stroke-width": 1.5,
    }) +
    path("M33.5,6.5 L35.3,4 L37.1,9 L38.9,4 L40.7,9 L41.5,7.5", {
      fill: "none",
      stroke: th.danger,
      "stroke-width": 1.4,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    })
  );
}
function hatchClip(d, colr, id) {
  let s = `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
  let lines = "";
  for (let k = -44; k < 88; k += 5) lines += `M${k},44 L${k + 44},0 `;
  s += path(lines, {
    stroke: colr,
    "stroke-width": 1.3,
    "clip-path": `url(#${id})`,
    fill: "none",
  });
  return s;
}

/**
 * One map icon in a 44 box. st: { side, ghost, deployed, noContact, jammed, hp (0..1), site (turns), selected }.
 */
function icon(setName, kind, th, st = {}) {
  const set = SETS[setName];
  const side = st.side ?? "own";
  const cat = KINDS[kind].cat;
  const col = colours(th, side, st.ghost || st.site);
  const d = set.frame(cat, side);
  const dash = st.ghost || st.site ? "4 3" : undefined;
  let body = "";
  // Halo: a surface-coloured outline so the icon separates from any terrain, hatching or fog (contrast).
  body += path(d, {
    fill: "none",
    stroke: col.halo,
    "stroke-width": FRAME_W + 3.5,
    "stroke-linejoin": "round",
  });
  body += path(d, {
    fill: col.fill,
    stroke: col.c,
    "stroke-width": FRAME_W,
    "stroke-linejoin": "round",
    "stroke-dasharray": dash,
  });
  if (set.doubleEnemy && side === "enemy") {
    const cy =
      cat === "air" ? 22 : cat === "str" ? 19 : cat === "def" ? 16 : 18;
    body += path(d, {
      fill: "none",
      stroke: col.c,
      "stroke-width": 1.3,
      transform: `translate(22 ${cy}) scale(0.74) translate(-22 ${-cy})`,
      "vector-effect": "non-scaling-stroke",
      "stroke-dasharray": dash,
    });
  }
  body += set.extras(cat, side, col, st);
  if (st.site !== undefined) {
    body += hatchClip(d, col.c, uid("h"));
    body += text(22, 23.5, String(st.site), {
      "text-anchor": "middle",
      "font-size": 14,
      "font-weight": 800,
      fill: col.c,
      stroke: th.surface,
      "stroke-width": 3,
      "paint-order": "stroke",
      "font-family": "system-ui, sans-serif",
    });
  } else {
    let m = set.mark(kind, col.ink, col.fill);
    // Enemy pictograms face left and shrink to fit inside the diamond.
    if (set.mirrorEnemy && side === "enemy")
      m = g(m, {
        transform:
          cat === "str" || cat === "def"
            ? "matrix(-1 0 0 1 44 0)"
            : "matrix(-0.8 0 0 0.8 39.6 3.6)",
      });
    body += m;
  }
  if (st.deployed) body += legs(set.legsY, col);
  let s = g(body, { opacity: st.ghost ? 0.6 : undefined });
  if (st.hp !== undefined && st.hp < 1) s += hpPips(th, col, st.hp);
  if (st.ghost) s += badgeGhost(th, col);
  if (st.jammed) s += badgeJammed(th);
  else if (st.noContact) s += badgeNoContact(th);
  if (st.selected)
    s += rect(1.5, 1.5, 41, 41, {
      fill: "none",
      stroke: th.focus,
      "stroke-width": 3,
    });
  return s;
}

/* ---------- Terrain (ported from view.ts drawTerrainMark, as SVG) ---------- */
function terrainCell(th, name, opts = {}) {
  const c = 44;
  let s = rect(0, 0, c, c, { fill: th.terrain[name] });
  const st = { fill: "none", stroke: th.mark, "stroke-width": 1.5 };
  switch (name) {
    case "road":
      s += path("M0,22 H44", { ...st, "stroke-dasharray": "4 4" });
      break;
    case "forest":
      for (const [dx, dy] of [
        [0.25, 0.3],
        [0.7, 0.25],
        [0.45, 0.7],
      ])
        s += circle(dx * c, dy * c, 4, { fill: th.mark });
      break;
    case "hill":
      s += path(
        `M${c * 0.2},${c * 0.75} L${c * 0.5},${c * 0.3} L${c * 0.8},${c * 0.75}`,
        st,
      );
      break;
    case "urban":
      s +=
        rect(c * 0.2, c * 0.2, c * 0.22, c * 0.22, st) +
        rect(c * 0.55, c * 0.5, c * 0.22, c * 0.22, st);
      break;
    case "swamp":
      for (const dy of [0.35, 0.65])
        s += path(
          `M${c * 0.2},${dy * c} H${c * 0.45} M${c * 0.55},${dy * c} H${c * 0.8}`,
          st,
        );
      break;
    case "water":
      for (const dy of [0.35, 0.65])
        s += path(
          `M${c * 0.15},${dy * c} Q${c * 0.32},${dy * c - 6} ${c * 0.5},${dy * c} Q${c * 0.68},${dy * c + 6} ${c * 0.85},${dy * c}`,
          st,
        );
      break;
    case "ridge": {
      let d = "";
      for (let i = 0; i < 4; i++)
        d += `M${(i * c) / 4},${c} L${((i + 1) * c) / 4},0 `;
      s += path(d, st);
      break;
    }
    default:
      break;
  }
  if (opts.fog)
    s +=
      rect(0, 0, c, c, { fill: th.fog }) +
      circle(c - 7, c - 7, 2, { fill: th.fog });
  if (opts.nocover) {
    let d = "";
    for (let k = 0; k < c; k += 11)
      d += `M${k},0 L0,${k} M${c},${k} L${k},${c} `;
    s += path(d, { stroke: th.nocover, "stroke-width": 1, fill: "none" });
  }
  if (opts.jammed) {
    let d = "M4,22";
    for (let k = 1; k <= 4; k++)
      d += ` L${4 + (k * (c - 8)) / 4},${22 + (k % 2 === 1 ? -5 : 5)}`;
    s += path(d, { stroke: th.danger, "stroke-width": 1.5, fill: "none" });
  }
  s += rect(0.5, 0.5, c - 1, c - 1, {
    fill: "none",
    stroke: th.grid,
    "stroke-width": 1,
  });
  return s;
}

/** Deposit mark (proposal, shared by all sets): a cut-gem outline, large when the cell is empty. */
function deposit(th, { depleted = false, mini = false } = {}) {
  if (mini)
    return path("M39,34.5 L42.5,38 L39,41.5 L35.5,38 Z", {
      fill: th.surface,
      stroke: th.gem,
      "stroke-width": 1.4,
    });
  const st = {
    fill: "none",
    stroke: th.gem,
    "stroke-width": 1.8,
    "stroke-linejoin": "round",
    "stroke-dasharray": depleted ? "2.5 2" : undefined,
  };
  let s = path("M15,13 H29 L33,18.5 L22,31 L11,18.5 Z", st);
  s += depleted
    ? path("M12,30 L32,12", { stroke: th.gem, "stroke-width": 1.8 })
    : path("M11,18.5 H33 M18,13 L22,18.5 L26,13", {
        ...st,
        "stroke-width": 1.4,
      });
  return s;
}

/** Wraps 44-box content into an <svg> of the given pixel size. */
function svg(size, inner, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 44 44" ${extra} style="display:block;stroke-linecap:round">${inner}</svg>`;
}

if (typeof module !== "undefined")
  module.exports = {
    TH,
    KINDS,
    UNIT_KINDS,
    STRUCT_KINDS,
    SETS,
    icon,
    terrainCell,
    deposit,
    svg,
  };
