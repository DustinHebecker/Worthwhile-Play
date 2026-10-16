/*
 * Card illustrations (design § 7.3, owner feedback B2): one original, code-drawn picture per card that shows what
 * the name says and carries its own gag. Static SVG markup (no text, no user data), 160 × 120 view box, colours
 * from `.il-*` classes (light, dark and forced colours in styles.css). Cards without an illustration yet fall back
 * to the pictogram kit (art.ts).
 */

const ILLUSTRATIONS: Readonly<Record<string, string>> = {
  // A lawnmower with a toothy grin, a cut pointy hat flying off in two halves, grass and one beard tuft in the air.
  'kz.lawnmower': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-line" d="M98 62 132 22M132 22l10 4"/>
    <rect class="il-red il-ink" x="34" y="56" width="70" height="30" rx="8"/>
    <path class="il-white il-ink" d="M34 74l6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8"/>
    <circle class="il-white il-ink" cx="56" cy="66" r="5"/><circle class="il-dark" cx="57" cy="67" r="2.2"/>
    <circle class="il-white il-ink" cx="74" cy="66" r="5"/><circle class="il-dark" cx="75" cy="67" r="2.2"/>
    <path class="il-line" d="M50 58l10 4M80 58l-10 4"/>
    <circle class="il-dark il-ink" cx="44" cy="90" r="9"/><circle class="il-dark il-ink" cx="94" cy="90" r="9"/>
    <circle class="il-metal" cx="44" cy="90" r="3"/><circle class="il-metal" cx="94" cy="90" r="3"/>
    <path class="il-red il-ink" d="M18 44l8-26 6 22z"/>
    <path class="il-red il-ink" d="M30 46l14-20 2 22z" transform="rotate(18 38 36)"/>
    <path class="il-line il-thin" d="M24 50l4 4M36 52l2 5M14 56l5 2"/>
    <path class="il-grass il-ink il-thin" d="M8 78l4-10 2 10M120 70l3-9 2 9M128 80l5-8 1 8M18 66l2-8 3 7"/>
    <path class="il-beard il-ink il-thin" d="M112 46c4-6 10-4 9 2-3 4-8 3-9-2z"/>`,

  // A small pile of pebbles with big sad eyes, crying pebble-shaped tears into a tissue.
  'kz.pebble-golem': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 100h160v20H0z"/>
    <ellipse class="il-stone il-ink" cx="80" cy="82" rx="34" ry="22"/>
    <ellipse class="il-stone il-ink" cx="80" cy="48" rx="22" ry="17"/>
    <ellipse class="il-stone il-ink" cx="46" cy="74" rx="10" ry="8"/>
    <ellipse class="il-stone il-ink" cx="114" cy="74" rx="10" ry="8"/>
    <path class="il-line" d="M65 44l9-5M95 44l-9-5"/>
    <circle class="il-white il-ink" cx="72" cy="48" r="5"/><circle class="il-dark" cx="72" cy="50" r="2.5"/>
    <circle class="il-white il-ink" cx="88" cy="48" r="5"/><circle class="il-dark" cx="88" cy="50" r="2.5"/>
    <path class="il-line" d="M72 60q8-6 16 0"/>
    <ellipse class="il-water il-ink il-thin" cx="66" cy="62" rx="3" ry="4"/>
    <ellipse class="il-water il-ink il-thin" cx="62" cy="76" rx="2.6" ry="3.4"/>
    <ellipse class="il-stone il-ink il-thin" cx="58" cy="104" rx="4" ry="3"/>
    <path class="il-white il-ink" d="M110 62l14-6 6 12-14 6z"/>
    <path class="il-line il-thin" d="M114 64l8-3M116 68l8-3"/>`,

  // A dwarf wearing an upside-down terracotta flowerpot as a helmet; a daisy grows proudly out of the drain hole.
  'kz.flowerpot-helmet': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g transform="translate(12 14) scale(0.85)">
    
    <path class="il-skin il-ink" d="M56 60c0-12 10-18 24-18s24 6 24 18v8c0 14-10 24-24 24S56 82 56 68z"/>
    <path class="il-beard il-ink" d="M56 70c4 22 14 40 24 46 10-6 20-24 24-46-6 6-14 8-24 8s-18-2-24-8z"/>
    <circle class="il-dark" cx="70" cy="62" r="3"/><circle class="il-dark" cx="90" cy="62" r="3"/>
    <path class="il-skin il-ink" d="M76 66c2 6 6 6 8 0"/>
    <path class="il-earth il-ink" d="M46 50 58 16h44l12 34z"/>
    <path class="il-earth-dark il-ink" d="M44 50h72v8H44z"/>
    <path class="il-line" d="M56 26h48"/>
    <path class="il-green il-ink" d="M80 16V4"/>
    <path class="il-green il-ink il-thin" d="M80 10c-6-2-8 2-10 0 2-4 6-4 10 0z"/>
    <g class="il-white il-ink il-thin">
      <ellipse cx="80" cy="-2" rx="3" ry="6"/><ellipse cx="80" cy="-2" rx="3" ry="6" transform="rotate(60 80 4)"/>
      <ellipse cx="80" cy="-2" rx="3" ry="6" transform="rotate(120 80 4)"/><ellipse cx="80" cy="-2" rx="3" ry="6" transform="rotate(180 80 4)"/>
      <ellipse cx="80" cy="-2" rx="3" ry="6" transform="rotate(240 80 4)"/><ellipse cx="80" cy="-2" rx="3" ry="6" transform="rotate(300 80 4)"/>
    </g>
    <circle class="il-yellow il-ink il-thin" cx="80" cy="4" r="3"/></g>`,

  // A coiled garden hose with a proud face, spraying a long jet that turns a little campfire monster into a puff.
  'kz.garden-hose': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <g class="il-green il-ink">
      <ellipse cx="44" cy="86" rx="30" ry="14"/>
      <ellipse cx="44" cy="78" rx="26" ry="12"/>
      <ellipse cx="44" cy="70" rx="22" ry="10"/>
    </g>
    <path class="il-hose" d="M58 66c10-10 22-16 34-18"/>
    <rect class="il-metal il-ink" x="90" y="42" width="12" height="9" rx="2" transform="rotate(-12 96 46)"/>
    <circle class="il-dark" cx="38" cy="68" r="2.2"/><circle class="il-dark" cx="50" cy="68" r="2.2"/>
    <path class="il-line il-thin" d="M40 74q4 3 8 0"/>
    <path class="il-water-line" d="M104 44c14-4 24 4 30 20M104 46c12 0 20 8 24 22M104 42c16-8 30 0 36 14"/>
    <path class="il-wood il-ink" d="M118 98l28-6M120 92l26 8"/>
    <path class="il-smoke il-ink il-thin" d="M126 82c-6-4-2-12 4-10 2-6 10-6 12 0 6 0 8 8 2 10z"/>
    <circle class="il-dark" cx="132" cy="80" r="1.5"/><circle class="il-dark" cx="138" cy="80" r="1.5"/>
    <path class="il-line il-thin" d="M132 85q3-2 6 0"/>`,

  // A shabby garden shed; the door is ajar, two glowing eyes and a curious tentacle peek out of the dark.
  'kz.shed-thing': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow" cx="132" cy="18" r="9"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-wood il-ink" d="M30 52 80 20l50 32v52H30z"/>
    <path class="il-wood-dark il-ink" d="M24 54 80 16l56 38-6 4-50-34-50 34z"/>
    <path class="il-line il-thin" d="M40 60v44M120 60v44M30 76h100"/>
    <path class="il-dark il-ink" d="M66 104V62h28v42z"/>
    <path class="il-wood il-ink" d="M66 104V62l-14 6v36z"/>
    <circle class="il-glow" cx="76" cy="76" r="3.4"/><circle class="il-glow" cx="86" cy="74" r="3.4"/>
    <path class="il-purple il-ink" d="M90 98c10 0 16-6 22-2 4 3 0 8-4 6-4-2-8 2-18 2z"/>
    <circle class="il-purple-dark" cx="106" cy="99" r="1.2"/><circle class="il-purple-dark" cx="100" cy="100" r="1.2"/>
    <path class="il-metal il-ink il-thin" d="M50 86a4 4 0 1 1 8 0v4h-8z"/>
    <rect class="il-white il-ink il-thin" x="96" y="36" width="20" height="10" rx="1"/>
    <path class="il-line il-thin" d="M99 41h14"/>`,

  // The gnome neighbourhood watch: three ceramic garden gnomes in a row, one with a torch beam, one with a
  // clipboard, all with stern little faces and armbands.
  'kz.gnome-watch': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-torch" d="M118 58 160 30v52z"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <g>
      <path class="il-red il-ink" d="M18 58 32 18l14 40z"/>
      <path class="il-skin il-ink" d="M20 58h24v12H20z"/><path class="il-beard il-ink" d="M20 66c2 14 22 14 24 0z"/>
      <path class="il-blue il-ink" d="M18 76h28v26H18z"/><path class="il-yellow il-ink il-thin" d="M18 82h28v5H18z"/>
      <circle class="il-dark" cx="28" cy="63" r="1.6"/><circle class="il-dark" cx="36" cy="63" r="1.6"/>
      <path class="il-line il-thin" d="M25 60l5 1M39 60l-5 1"/>
    </g>
    <g>
      <path class="il-red il-ink" d="M62 54 78 10l16 44z"/>
      <path class="il-skin il-ink" d="M64 54h28v13H64z"/><path class="il-beard il-ink" d="M64 63c2 16 26 16 28 0z"/>
      <path class="il-green il-ink" d="M62 74h32v28H62z"/><path class="il-yellow il-ink il-thin" d="M62 80h32v5H62z"/>
      <circle class="il-dark" cx="73" cy="59" r="1.8"/><circle class="il-dark" cx="83" cy="59" r="1.8"/>
      <path class="il-line il-thin" d="M69 56l6 1M87 56l-6 1"/>
      <rect class="il-white il-ink il-thin" x="50" y="80" width="14" height="18" rx="1"/>
      <path class="il-line il-thin" d="M53 85h8M53 89h8M53 93h5"/>
    </g>
    <g>
      <path class="il-red il-ink" d="M106 58 120 18l14 40z"/>
      <path class="il-skin il-ink" d="M108 58h24v12h-24z"/><path class="il-beard il-ink" d="M108 66c2 14 22 14 24 0z"/>
      <path class="il-blue il-ink" d="M106 76h28v26h-28z"/><path class="il-yellow il-ink il-thin" d="M106 82h28v5h-28z"/>
      <circle class="il-dark" cx="116" cy="63" r="1.6"/><circle class="il-dark" cx="124" cy="63" r="1.6"/>
      <path class="il-line il-thin" d="M113 60l5 1M127 60l-5 1"/>
      <rect class="il-metal il-ink il-thin" x="130" y="54" width="10" height="7" rx="2" transform="rotate(-20 135 57)"/>
    </g>`
};

/** SVG markup of a card's illustration, or `undefined` if the card has none yet. */
export function illustration(base: string): string | undefined {
  const inner = ILLUSTRATIONS[base];
  return inner === undefined ? undefined : `<svg viewBox="0 0 160 120" aria-hidden="true" focusable="false" class="cq-il">${inner}</svg>`;
}

/** Base ids that have an illustration (for tests). */
export const illustratedCards = (): string[] => Object.keys(ILLUSTRATIONS);
