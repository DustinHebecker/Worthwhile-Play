/* First sample set (owner reviewed): Kampfzwerge. */
export const SAMPLE: Readonly<Record<string, string>> = {
  // The mower of doom chases a fleeing garden gnome; it has just sliced his red pointy hat: the stump stays on his
  // head, the tip sails through the air. A mown-off beard tuft lies in the grass behind it.
  'kz.lawnmower': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 92h160v28H0z"/>
    <path class="il-green" d="M0 100h70v10H0z" opacity="0.7"/>
    <path class="il-grass il-ink il-thin" d="M76 92l2-7 2 7M150 92l2-8 2 8M104 92l2-6 2 6"/>
    <path class="il-beard il-ink il-thin" d="M10 106c3-5 9-5 11 0-3 3-8 3-11 0z"/>
    <circle class="il-smoke il-ink il-thin" cx="30" cy="40" r="6"/><circle class="il-smoke il-ink il-thin" cx="22" cy="30" r="4"/>
    <path class="il-line il-thick" d="M38 62 16 24M8 27l15-6"/>
    <rect class="il-metal il-ink" x="36" y="48" width="28" height="16" rx="3"/>
    <path class="il-line il-thin" d="M41 53h18M41 58h18"/>
    <path class="il-red il-ink" d="M16 92c2-18 14-28 36-28h30c12 0 18 10 18 28z"/>
    <path class="il-white il-ink il-thin" d="M62 92l3-6 3 6 3-6 3 6 3-6 3 6 3-6 3 6 3-6 3 6 3-6 3 6"/>
    <circle class="il-white il-ink" cx="72" cy="76" r="6"/><circle class="il-dark" cx="75" cy="77" r="2.6"/>
    <circle class="il-white il-ink" cx="88" cy="76" r="5"/><circle class="il-dark" cx="90" cy="77" r="2.3"/>
    <path class="il-line" d="M64 67l12 5M95 68l-9 4"/>
    <circle class="il-dark il-ink" cx="30" cy="94" r="8"/><circle class="il-metal" cx="30" cy="94" r="3"/>
    <circle class="il-dark il-ink" cx="88" cy="94" r="8"/><circle class="il-metal" cx="88" cy="94" r="3"/>
    <path class="il-green il-ink il-thin" d="M102 84l6-3M104 90l7 0M101 78l5-5"/>
    <g transform="rotate(-28 92 22)">
      <path class="il-red il-ink" d="M84 34 94 6l10 28z"/>
      <path class="il-light il-dash" d="M85 34h18"/>
    </g>
    <path class="il-line il-thin" d="M104 30l8 4M100 40l9 2M108 22l7 6"/>
    <path class="il-light il-thin" d="M124 30a14 14 0 0 1 14-6M118 24a22 22 0 0 1 24-8"/>
    <path class="il-skin il-ink" d="M118 64h-8M148 66l6-10"/>
    <path class="il-blue il-ink" d="M118 70h24l-2 24h-20z"/>
    <path class="il-dark il-ink" d="M120 94l-8 6h8l4-6zM136 94l6 8h-6l-4-8z"/>
    <path class="il-blue il-ink" d="M118 74l-10-10M142 74l8-14"/>
    <circle class="il-skin il-ink" cx="107" cy="62" r="3.4"/><circle class="il-skin il-ink" cx="151" cy="58" r="3.4"/>
    <ellipse class="il-skin il-ink" cx="130" cy="58" rx="11" ry="9"/>
    <path class="il-beard il-ink" d="M119 60c2 18 20 18 22 0-6 4-16 4-22 0z"/>
    <circle class="il-white il-ink il-thin" cx="125" cy="55" r="3.4"/><circle class="il-dark" cx="123.6" cy="55" r="1.5"/>
    <circle class="il-white il-ink il-thin" cx="134" cy="55" r="3.4"/><circle class="il-dark" cx="132.6" cy="55" r="1.5"/>
    <ellipse class="il-dark" cx="129" cy="63" rx="2.4" ry="3"/>
    <path class="il-red il-ink" d="M119 50h22l-3-10h-16z"/>
    <path class="il-light il-dash" d="M123 40h14"/>
    <ellipse class="il-water il-ink il-thin" cx="144" cy="50" rx="2" ry="3"/>`,

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

  // Twenty metres of persuasion: a smug garden gnome with a pistol-grip spray gun; the jet has soaked a dwarf who
  // waves a white flag. The hose runs flat across the lawn in loose loops.
  'kz.garden-hose': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g class="il-wood il-ink il-thin">
      <rect x="4" y="70" width="8" height="30"/><rect x="22" y="70" width="8" height="30"/><rect x="40" y="70" width="8" height="30"/>
      <rect x="96" y="70" width="8" height="30"/><rect x="108" y="70" width="8" height="30"/>
    </g>
    <path class="il-wood-dark" d="M0 78h160v4H0z" opacity="0.8"/>
    <path class="il-grass" d="M0 98h160v22H0z"/>
    <path class="il-hose" d="M87 86c2 10-6 16-18 18-14 2-20-6-34-2s-20 10-31 4"/>
    <path class="il-red il-ink" d="M52 50 64 16l12 34z"/>
    <path class="il-blue il-ink" d="M52 64h24l-1 26H53z"/>
    <path class="il-dark" d="M52 72h24v4H52z"/>
    <path class="il-dark il-ink" d="M54 90h8v6h-10zM66 90h8l2 6H66z"/>
    <path class="il-blue il-ink" d="M72 68h12v6H72z"/>
    <ellipse class="il-skin il-ink" cx="64" cy="55" rx="11" ry="8.5"/>
    <path class="il-beard il-ink" d="M53 57c2 16 20 16 22 0-6 3-16 3-22 0z"/>
    <circle class="il-dark" cx="62" cy="53" r="1.8"/><circle class="il-dark" cx="69" cy="53" r="1.8"/>
    <path class="il-line il-thin" d="M58 49l5 1M72 49l-4 1M60 58q4 3 8 0"/>
    <circle class="il-skin il-ink il-thin" cx="72" cy="56" r="2.6"/>
    <path class="il-metal il-ink" d="M84 66h16v6H92l-1 12h-6z"/>
    <path class="il-line il-thin" d="M88 72q2 4-1 6"/>
    <circle class="il-skin il-ink il-thin" cx="86" cy="73" r="3.4"/>
    <path class="il-water-line" d="M102 68c10-6 18-6 26-2M102 70c10-2 18 0 24 4M102 66c8-8 18-10 26-6"/>
    <path class="il-line il-thin" d="M148 98V20"/>
    <path class="il-paper il-ink il-thin" d="M148 22c-6-4-12 2-20-1v14c8 3 14-3 20 1z"/>
    <path class="il-yellow il-ink" d="M120 56a14 12 0 0 1 28 0z"/>
    <rect class="il-yellow il-ink il-thin" x="117" y="55" width="34" height="4" rx="2"/>
    <circle class="il-glow il-ink il-thin" cx="134" cy="48" r="3"/>
    <ellipse class="il-skin il-ink" cx="134" cy="65" rx="12" ry="8.5"/>
    <path class="il-orange il-ink" d="M122 67c2 20 22 20 24 0-6 4-18 4-24 0z"/>
    <path class="il-line il-thin" d="M127 61l4 2-4 2M141 61l-4 2 4 2M129 70q2-2 4 0t4 0 4 0"/>
    <path class="il-green il-ink" d="M123 78h22l-1 18h-20z"/>
    <path class="il-green il-ink" d="M142 82l6-16"/>
    <circle class="il-skin il-ink il-thin" cx="148" cy="64" r="3.4"/>
    <path class="il-dark il-ink" d="M124 96h8v5h-9zM136 96h8l1 5h-9z"/>
    <ellipse class="il-water il-ink il-thin" cx="134" cy="106" rx="22" ry="3.6"/>
    <g class="il-water il-ink il-thin">
      <ellipse cx="118" cy="62" rx="1.8" ry="2.8"/><ellipse cx="121" cy="76" rx="1.8" ry="2.8"/><ellipse cx="151" cy="74" rx="1.8" ry="2.8"/>
      <ellipse cx="128" cy="88" rx="1.6" ry="2.4"/>
    </g>`,

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
