/* Kampfzwerge illustrations: loot. */
export const LOOT: Readonly<Record<string, string>> = {
  // A mine dwarf in a hard hat squints up at the sun, which dangles from a wire and sparks like a faulty bulb.
  'kz.mine-dwarf': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-sky" d="M104 0h56v50c-14 8-38 6-56-8z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-stone il-ink il-thin" d="M8 22l8-5 7 6-7 6zM16 78l7-4 5 5-7 4zM100 96l6-3 4 4-6 3z"/>
    <path class="il-line il-thin" d="M136 0v8"/>
    <rect class="il-metal il-ink il-thin" x="132" y="7" width="8" height="5" rx="1"/>
    <circle class="il-yellow il-ink" cx="136" cy="22" r="10"/>
    <path class="il-line il-thin" d="M122 10l-5-2 3-2-5-3M150 12l5-1-2-3 5-2M124 34l-4 4M148 34l4 4"/>
    <path class="il-wood-dark il-ink" d="M42 104V88c0-10 12-16 28-16s28 6 28 16v16z"/>
    <path class="il-skin il-ink" d="M52 50c0-10 8-16 18-16s18 6 18 16v8c0 10-8 18-18 18s-18-8-18-18z"/>
    <path class="il-beard il-ink" d="M52 58c2 20 10 34 18 40 8-6 16-20 18-40-4 6-10 8-18 8s-14-2-18-8z"/>
    <path class="il-line il-thin" d="M62 74l2 8M70 76v10M78 74l-2 8"/>
    <ellipse class="il-dark" cx="70" cy="69" rx="2.6" ry="3.2"/>
    <circle class="il-white il-ink il-thin" cx="63" cy="52" r="4.2"/><circle class="il-dark" cx="64.8" cy="50.2" r="2"/>
    <circle class="il-white il-ink il-thin" cx="77" cy="52" r="4.2"/><circle class="il-dark" cx="78.8" cy="50.2" r="2"/>
    <ellipse class="il-pink il-ink il-thin" cx="70" cy="60" rx="5" ry="4"/>
    <path class="il-line" d="M58 46l8-3M73 42l8 3"/>
    <path class="il-yellow il-ink" d="M48 44c0-14 10-22 22-22s22 8 22 22z"/>
    <path class="il-yellow il-ink" d="M44 43h52v6H44z"/>
    <path class="il-line il-thin" d="M70 22v6"/>
    <circle class="il-metal il-ink" cx="70" cy="34" r="5"/><circle class="il-glow" cx="70" cy="34" r="2.6"/>
    <path class="il-wood il-ink" d="M93 104l-3-2 22-48 3 2z"/>
    <path class="il-metal il-ink" d="M98 52c8-8 20-8 26-2-8-2-16 0-22 8z"/>
    <circle class="il-skin il-ink" cx="100" cy="84" r="5"/>
    <path class="il-line" d="M100 22c0-6 9-6 9 0 0 4-5 4-5 9"/><circle class="il-dark" cx="104" cy="36" r="1.4"/>`,

  // A forest dwarf with a leafy hood waves at a toadstool, which happily waves back; a little heart between them.
  'kz.forest-dwarf': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="2" y="10" width="14" height="90"/>
    <rect class="il-wood-dark il-ink" x="140" y="0" width="12" height="70"/>
    <circle class="il-green il-ink" cx="10" cy="10" r="16"/><circle class="il-green il-ink" cx="150" cy="4" r="14"/>
    <path class="il-grass" d="M0 98h160v22H0z"/>
    <path class="il-grass il-ink il-thin" d="M6 104l3-8 2 8M30 110l3-8 2 8M98 108l3-8 2 8M150 112l3-8 2 8"/>
    <path class="il-green il-ink" d="M38 104V90c0-8 10-14 24-14s24 6 24 14v14z"/>
    <path class="il-skin il-ink" d="M42 50c0-8 8-12 20-12s20 4 20 12v6c0 10-8 18-20 18s-20-8-20-18z"/>
    <path class="il-wood il-ink" d="M42 56c2 18 10 30 20 38 10-8 18-20 20-38-4 6-10 8-20 8s-16-2-20-8z"/>
    <path class="il-line il-thin" d="M54 72l2 8M62 74v10M70 72l-2 8"/>
    <path class="il-green il-ink il-thin" d="M50 84c4-7 11-7 13-2-4 4-9 5-13 2z"/>
    <path class="il-green il-ink" d="M36 52c0-22 14-36 32-36 10 0 16 6 18 14l10-2-6 10c2 4 2 9 2 14-6-6-12-8-20-8H50c-6 0-10 2-14 8z"/>
    <path class="il-line il-thin" d="M50 30l6 4M64 24l2 7"/>
    <path class="il-line" d="M52 52q3-3 6 0M66 52q3-3 6 0"/>
    <ellipse class="il-pink il-ink il-thin" cx="62" cy="58" rx="4.6" ry="3.8"/>
    <path class="il-line" d="M56 66q6 5 12 0"/>
    <path class="il-green il-ink" d="M80 86l14-22 5 3-12 22z"/>
    <circle class="il-skin il-ink" cx="97" cy="62" r="5.5"/>
    <path class="il-line il-thin" d="M90 54l-3-4M100 52l1-5M106 58l4-2"/>
    <path class="il-white il-ink" d="M114 100c2-8 2-14 0-20h24c-2 6-2 12 0 20z"/>
    <path class="il-red il-ink" d="M98 82c0-16 14-26 28-26s28 10 28 26c-8 3-18 4-28 4s-20-1-28-4z"/>
    <circle class="il-white il-ink il-thin" cx="112" cy="70" r="4"/><circle class="il-white il-ink il-thin" cx="128" cy="63" r="4.6"/>
    <circle class="il-white il-ink il-thin" cx="142" cy="72" r="3.6"/>
    <circle class="il-dark" cx="121" cy="90" r="1.8"/><circle class="il-dark" cx="131" cy="90" r="1.8"/>
    <path class="il-line il-thin" d="M122 95q4 3 8 0"/>
    <path class="il-line" d="M138 92l8-8"/><circle class="il-white il-ink il-thin" cx="148" cy="82" r="3"/>
    <path class="il-red il-ink il-thin" d="M106 36c-3-4-9-1-6 4l6 6 6-6c3-5-3-8-6-4z"/>`,

  // A glossy ceramic garden gnome with a crack across his belly and a sticking plaster on his hat; a chip lies at his feet.
  'kz.ceramic-gnome': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-grass il-ink il-thin" d="M14 110l3-8 2 8M140 112l3-8 2 8M30 108l2-7 3 7"/>
    <path class="il-stone il-ink" d="M48 104h64v8H48z"/>
    <path class="il-blue il-ink" d="M54 104c0-18 10-30 26-30s26 12 26 30z"/>
    <path class="il-dark il-ink il-thin" d="M56 94h48v6H56z"/><rect class="il-gold il-ink il-thin" x="76" y="93" width="8" height="8" rx="1"/>
    <path class="il-light" d="M98 90q-2-7-7-9"/>
    <circle class="il-skin il-ink" cx="54" cy="90" r="6"/><circle class="il-skin il-ink" cx="106" cy="90" r="6"/>
    <path class="il-skin il-ink" d="M58 48h44v16c0 6-10 10-22 10s-22-4-22-10z"/>
    <path class="il-beard il-ink" d="M58 62c2 18 12 28 22 30 10-2 20-12 22-30-6 6-14 8-22 8s-16-2-22-8z"/>
    <path class="il-line il-thin" d="M70 78l2 6M80 80v8M90 78l-2 6"/>
    <path class="il-line il-thin" d="M74 70q2-2 4 0t4 0t4 0"/>
    <circle class="il-dark" cx="71" cy="55" r="2.4"/><circle class="il-dark" cx="89" cy="55" r="2.4"/>
    <circle class="il-white" cx="71.8" cy="54.2" r="0.8"/><circle class="il-white" cx="89.8" cy="54.2" r="0.8"/>
    <path class="il-line il-thin" d="M66 50l6 1M94 50l-6 1"/>
    <circle class="il-pink" cx="64" cy="61" r="3"/><circle class="il-pink" cx="96" cy="61" r="3"/>
    <circle class="il-pink il-ink il-thin" cx="80" cy="60" r="4.4"/>
    <path class="il-red il-ink" d="M54 50 80 4l26 46z"/>
    <path class="il-light" d="M74 18l-7 18"/>
    <path class="il-line il-thick" d="M62 46l5-4-2-5 7-3-1-5 7-2 1-6 6-3 1-5"/>
    <rect class="il-paper il-ink il-thin" x="68" y="26" width="18" height="8" rx="2" transform="rotate(-35 77 30)"/>
    <path class="il-line il-thin" d="M74 30l1 1M78 27l1 1M80 32l1 1"/>
    <path class="il-blue il-ink il-thin" d="M118 106l7-5 4 6z"/>
    <path class="il-white" d="M128 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white" d="M30 46l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // A featherlight plastic gnome tipped over by the wind is sprinting anyway, a seam line down his middle and a leaf flying past.
  'kz.plastic-gnome': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <path class="il-light" d="M4 30c14-6 24 4 36-2M2 52c12-4 20 2 30 0M8 76c10-3 16 2 24 0"/>
    <path class="il-light" d="M30 22c6-2 8 4 4 6"/>
    <path class="il-line il-thin" d="M34 92h18M28 84h16M38 98h14"/>
    <path class="il-smoke il-ink il-thin" d="M40 104c-6-1-6-8 0-8 1-4 8-4 9 0 5 0 5 7 0 8z"/>
    <g transform="rotate(24 86 100)">
      <path class="il-dark il-ink" d="M66 100h14v6H62z"/>
      <path class="il-dark il-ink" d="M86 94l14 2-2 6-14-2z"/>
      <path class="il-teal il-ink" d="M62 98c0-16 10-26 24-26s24 10 24 26z"/>
      <path class="il-line il-dash il-thin" d="M86 74v24"/>
      <path class="il-skin il-ink" d="M64 46h44v16c0 6-10 10-22 10s-22-4-22-10z"/>
      <path class="il-beard il-ink" d="M64 60c2 16 12 24 22 26 10-2 20-10 22-26-6 6-14 8-22 8s-16-2-22-8z"/>
      <path class="il-dark il-ink il-thin" d="M80 68q6 8 12 0z"/>
      <circle class="il-white il-ink il-thin" cx="78" cy="54" r="4"/><circle class="il-dark" cx="80" cy="54" r="2"/>
      <circle class="il-white il-ink il-thin" cx="94" cy="54" r="4"/><circle class="il-dark" cx="96" cy="54" r="2"/>
      <circle class="il-pink il-ink il-thin" cx="86" cy="60" r="3.6"/>
      <path class="il-red il-ink" d="M62 48c-2-16 8-36 26-40l-2 10 22 30z"/>
      <path class="il-light" d="M78 22l-4 14"/>
      <circle class="il-skin il-ink" cx="62" cy="84" r="5"/><circle class="il-skin il-ink" cx="112" cy="80" r="5"/>
    </g>
    <path class="il-green il-ink il-thin" d="M130 28c6-8 16-6 18 0-6 6-12 6-18 0z"/>
    <path class="il-line il-thin" d="M130 28l18 0"/>
    <path class="il-line il-thin" d="M118 24l-4-4M122 18l-1-5"/>`,

  // A sly treasure accountant in a green eyeshade and spectacles works an abacus; one nugget carries three price tags.
  'kz.treasure-accountant': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone il-ink il-thin" d="M10 18l8-4 6 5-7 5zM140 14l7-3 5 5-6 4z"/>
    <path class="il-wood-dark il-ink" d="M48 86V74c0-8 10-14 24-14s24 6 24 14v12z"/>
    <path class="il-skin il-ink" d="M52 40c0-10 8-16 20-16s20 6 20 16v8c0 10-8 18-20 18s-20-8-20-18z"/>
    <path class="il-beard il-ink" d="M52 48c2 18 10 30 20 36 10-6 18-18 20-36-4 6-10 8-20 8s-16-2-20-8z"/>
    <path class="il-line il-thin" d="M64 66l2 8M72 68v10M80 66l-2 8"/>
    <path class="il-line" d="M66 60q8 4 14-2"/>
    <circle class="il-white il-ink il-thin" cx="64" cy="42" r="6"/><circle class="il-white il-ink il-thin" cx="80" cy="42" r="6"/>
    <path class="il-line il-thin" d="M70 42h4"/>
    <circle class="il-dark" cx="66" cy="43" r="2"/><path class="il-line" d="M77 43h6"/>
    <path class="il-line il-thin" d="M58 34l8 1M86 33l-8 2"/>
    <ellipse class="il-pink il-ink il-thin" cx="72" cy="50" rx="4.6" ry="3.6"/>
    <path class="il-green il-ink" d="M48 32c4-6 14-10 24-10s20 4 24 10l-6 4c-4-4-10-6-18-6s-14 2-18 6z"/>
    <path class="il-wood il-ink" d="M0 84h160v36H0z"/>
    <path class="il-line il-thin" d="M0 92h160M20 100h30M100 110h40"/>
    <rect class="il-wood-dark il-ink" x="8" y="60" width="38" height="30" rx="2"/>
    <path class="il-light" d="M12 68h30M12 76h30M12 84h30"/>
    <g class="il-red il-ink il-thin"><circle cx="16" cy="68" r="2.6"/><circle cx="22" cy="68" r="2.6"/><circle cx="36" cy="68" r="2.6"/>
      <circle cx="16" cy="76" r="2.6"/><circle cx="30" cy="76" r="2.6"/><circle cx="36" cy="76" r="2.6"/>
      <circle cx="22" cy="84" r="2.6"/><circle cx="28" cy="84" r="2.6"/></g>
    <circle class="il-skin il-ink" cx="46" cy="78" r="5"/>
    <g class="il-gold il-ink">
      <path d="M102 90l4-10 10-2 6 6-2 6z"/><path d="M118 90l2-8 10-4 8 4 2 8z"/><path d="M138 90l2-8 8-2 6 6v4z"/>
      <path d="M110 78l4-8 10-1 4 7-6 6h-10z"/><path d="M128 78l2-8 10 0 4 8-8 4z"/>
      <path d="M118 66l4-7 8 1 2 7-7 4z"/>
    </g>
    <path class="il-light" d="M108 84l3-3M124 84l3-3M116 74l3-3M134 74l3-3M122 64l2-2"/>
    <path class="il-line il-thin" d="M126 60l-12-14M126 60l2-18M126 60l14-12"/>
    <path class="il-paper il-ink il-thin" d="M106 38l10-4 4 8-10 4z"/><circle class="il-dark" cx="113" cy="41" r="1"/>
    <path class="il-paper il-ink il-thin" d="M122 30h10v9h-10z"/><circle class="il-dark" cx="127" cy="36" r="1"/>
    <path class="il-paper il-ink il-thin" d="M136 42l9-6 5 8-9 5z"/><circle class="il-dark" cx="142" cy="44" r="1"/>`,

  // A garden gnome general with epaulettes and a medal salutes his troops: a row of grass blades with stern little eyes.
  'kz.lawn-sentinel': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-blue il-ink" d="M22 104c0-18 10-30 26-30s26 12 26 30z"/>
    <path class="il-gold il-ink il-thin" d="M18 80c2-6 10-6 12 0zM66 80c2-6 10-6 12 0z"/>
    <path class="il-line il-thin" d="M20 80l-1 4M24 80v4M28 80l1 4M68 80l-1 4M72 80v4M76 80l1 4"/>
    <path class="il-red il-ink il-thin" d="M52 86l4-4 4 4-2 4h-4z"/><circle class="il-gold il-ink il-thin" cx="56" cy="94" r="4"/>
    <path class="il-skin il-ink" d="M26 46h44v16c0 6-10 10-22 10s-22-4-22-10z"/>
    <path class="il-beard il-ink" d="M26 60c2 18 12 26 22 28 10-2 20-10 22-28-6 6-14 8-22 8s-16-2-22-8z"/>
    <path class="il-line il-thin" d="M38 76l2 6M48 78v8M58 76l-2 6"/>
    <path class="il-line" d="M42 68h12"/>
    <circle class="il-dark" cx="40" cy="53" r="2.2"/><circle class="il-dark" cx="56" cy="53" r="2.2"/>
    <path class="il-line" d="M34 48l8 3M62 48l-8 3"/>
    <circle class="il-pink il-ink il-thin" cx="48" cy="59" r="4"/>
    <path class="il-red il-ink" d="M22 48 48 4l26 44z"/>
    <path class="il-light" d="M42 20l-6 16"/>
    <path class="il-blue il-ink" d="M68 84l10-24 6 3-10 24z"/>
    <path class="il-skin il-ink" d="M72 48l10 6-3 5-10-6z"/>
    <path class="il-wood il-ink il-thin" d="M18 100l-6-22 3-1 7 22z"/>
    <g class="il-green il-ink">
      <path d="M96 104l5-30 5 30z"/><path d="M110 104l5-34 5 34z"/><path d="M124 104l5-30 5 30z"/>
      <path d="M138 104l5-34 5 34z"/><path d="M150 104l5-30 5 30z"/>
    </g>
    <g class="il-white il-ink il-thin"><circle cx="99" cy="92" r="1.8"/><circle cx="103" cy="92" r="1.8"/><circle cx="113" cy="90" r="1.8"/>
      <circle cx="117" cy="90" r="1.8"/><circle cx="127" cy="92" r="1.8"/><circle cx="131" cy="92" r="1.8"/>
      <circle cx="141" cy="90" r="1.8"/><circle cx="145" cy="90" r="1.8"/><circle cx="153" cy="92" r="1.8"/><circle cx="157" cy="92" r="1.8"/></g>
    <path class="il-line il-thin" d="M97 88l3 1M105 88l-3 1M111 86l3 1M119 86l-3 1M125 88l3 1M133 88l-3 1M139 86l3 1M147 86l-3 1M151 88l3 1"/>
    <path class="il-grass il-ink il-thin" d="M4 112l2-8 3 8M86 112l2-8 3 8"/>`,

  // A dapper dwarf barber with a bow tie, comb and pomade tin; his own beard is styled into two magnificent spirals.
  'kz.beard-barber': `
    <rect class="il-teal" x="0" y="0" width="160" height="120"/>
    <path class="il-light" d="M0 30h160M0 60h160M0 90h160M40 0v30M100 0v30M70 30v30M130 30v30M20 60v30M90 60v30M50 90v30M120 90v30" opacity="0.25"/>
    <path class="il-white il-ink" d="M50 120V92c0-10 14-16 30-16s30 6 30 16v28z"/>
    <path class="il-skin il-ink" d="M58 36c0-12 10-18 22-18s22 6 22 18v12c0 12-10 20-22 20s-22-8-22-20z"/>
    <path class="il-light" d="M68 24q6-4 14-2"/>
    <path class="il-beard il-ink" d="M62 56c2 10 8 16 18 18 10-2 16-8 18-18z"/>
    <circle class="il-beard il-ink" cx="66" cy="78" r="15"/><circle class="il-beard il-ink" cx="94" cy="78" r="15"/>
    <path class="il-line" d="M66 78c0-3 4-3 4 0s-3 7-8 6-7-7-4-12 11-6 14 0 1 14-6 15"/>
    <path class="il-line" d="M94 78c0-3-4-3-4 0s3 7 8 6 7-7 4-12-11-6-14 0-1 14 6 15"/>
    <path class="il-light" d="M58 70q2-4 6-5M86 70q2-4 6-5"/>
    <path class="il-beard il-ink" d="M80 58c-6-4-14-4-20 0-4 4-8 2-8-2 4 6 12 4 14 0 4-2 10-2 14 2 4-4 10-4 14-2 2 4 10 6 14 0 0 4-4 6-8 2-6-4-14-4-20 0z"/>
    <path class="il-red il-ink" d="M72 98l8 4 8-4v10l-8-4-8 4z"/><circle class="il-red il-ink il-thin" cx="80" cy="103" r="2.4"/>
    <circle class="il-dark" cx="71" cy="42" r="2.4"/><circle class="il-dark" cx="89" cy="42" r="2.4"/>
    <path class="il-line" d="M65 35l9 1M95 35l-9 1"/>
    <ellipse class="il-pink il-ink il-thin" cx="80" cy="50" rx="5" ry="4"/>
    <rect class="il-dark il-ink il-thin" x="14" y="46" width="30" height="8" rx="2" transform="rotate(-20 29 50)"/>
    <path class="il-light" d="M18 55l-1 5M23 53l-1 5M28 51l-1 5M33 49l-1 5M38 48l-1 5" transform="rotate(-20 29 50)"/>
    <circle class="il-skin il-ink" cx="44" cy="62" r="6"/>
    <ellipse class="il-gold il-ink" cx="128" cy="74" rx="16" ry="6"/>
    <path class="il-gold il-ink" d="M112 74v6c0 3 7 6 16 6s16-3 16-6v-6"/>
    <ellipse class="il-pink il-ink il-thin" cx="128" cy="74" rx="11" ry="3.6"/>
    <circle class="il-skin il-ink" cx="116" cy="84" r="6"/>
    <path class="il-white" d="M128 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white" d="M42 84l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // The mine foreman in a white hard hat with whistle and clipboard; behind him a smiling mine cart wears a name tag.
  'kz.mine-foreman': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M96 0v104M150 0v104M92 14h64v8H92z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line" d="M90 108h70M90 114h70"/>
    <path class="il-grey il-ink" d="M102 74h48l-5 26h-38z"/>
    <path class="il-line il-thin" d="M104 82h44M110 74v26M142 74v26"/>
    <circle class="il-dark il-ink" cx="112" cy="104" r="5"/><circle class="il-dark il-ink" cx="140" cy="104" r="5"/>
    <circle class="il-white il-ink il-thin" cx="119" cy="88" r="3"/><circle class="il-dark" cx="119.5" cy="88.5" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="133" cy="88" r="3"/><circle class="il-dark" cx="133.5" cy="88.5" r="1.4"/>
    <path class="il-line il-thin" d="M120 94q6 4 12 0"/>
    <path class="il-stone il-ink il-thin" d="M108 74c2-6 8-8 12-4 4-6 12-4 14 0 4-2 10 0 10 4z"/>
    <rect class="il-paper il-ink il-thin" x="124" y="58" width="16" height="9" rx="2" transform="rotate(10 132 62)"/>
    <path class="il-line il-thin" d="M126 60l-4 14M138 62l4 12"/>
    <path class="il-orange il-ink" d="M14 104V86c0-10 12-16 28-16s28 6 28 16v18z"/>
    <path class="il-yellow il-ink il-thin" d="M18 92h48v5H18z"/>
    <path class="il-skin il-ink" d="M24 46c0-10 8-16 18-16s18 6 18 16v8c0 10-8 18-18 18s-18-8-18-18z"/>
    <path class="il-beard il-ink" d="M24 54c2 18 10 30 18 36 8-6 16-18 18-36-4 6-10 8-18 8s-14-2-18-8z"/>
    <path class="il-line il-thin" d="M34 70l2 8M42 72v10M50 70l-2 8"/>
    <path class="il-line" d="M36 63q6 4 12 0"/>
    <circle class="il-dark" cx="35" cy="48" r="2.2"/><path class="il-line" d="M45 48h6"/>
    <path class="il-line" d="M30 42l8 1M54 41l-8 2"/>
    <ellipse class="il-pink il-ink il-thin" cx="42" cy="55" rx="4.6" ry="3.6"/>
    <path class="il-white il-ink" d="M20 40c0-14 10-22 22-22s22 8 22 22z"/>
    <path class="il-white il-ink" d="M16 39h52v6H16z"/>
    <path class="il-red il-ink il-thin" d="M22 33h40v4H22z"/>
    <circle class="il-metal il-ink il-thin" cx="42" cy="28" r="4"/><circle class="il-glow" cx="42" cy="28" r="2"/>
    <rect class="il-wood il-ink" x="62" y="74" width="20" height="26" rx="2"/>
    <rect class="il-metal il-ink il-thin" x="68" y="72" width="8" height="4" rx="1"/>
    <rect class="il-paper il-ink il-thin" x="65" y="78" width="14" height="19"/>
    <path class="il-line il-thin" d="M67 82h3M67 87h3M67 92h3"/><path class="il-line il-thin" d="M72 83l1 1 3-3M72 88l1 1 3-3"/>
    <circle class="il-skin il-ink" cx="64" cy="92" r="5"/>
    <path class="il-line il-thin" d="M30 74q12 10 24 0"/><rect class="il-metal il-ink il-thin" x="38" y="80" width="10" height="5" rx="2"/>`,

  // A proud gnome with oversized hedge shears next to a hedge trimmed into a perfect swan; clippings fly.
  'kz.hedge-artist': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <path class="il-earth-dark il-ink" d="M84 102h70v8H84z"/>
    <path class="il-green il-ink" d="M86 102c-4-18 6-32 26-32 10 0 18 2 26-4 4 10 10 20 6 30-2 4-6 6-10 6z"/>
    <path class="il-green il-ink" d="M114 78c-8-16-8-36 4-44 10-6 24-2 24 10l-9 3c0-6-6-7-10-3-6 6-6 20 3 34z"/>
    <path class="il-orange il-ink il-thin" d="M141 40l11 4-11 4z"/>
    <circle class="il-dark" cx="134" cy="40" r="2"/>
    <path class="il-line il-thin" d="M100 80c4-6 12-8 20-6M104 88c6-6 14-6 22-4M92 92c-2-4 0-8 4-10"/>
    <path class="il-line il-thin" d="M96 90c6-4 12-4 18 0M100 82c6-4 14-4 20 0M116 94l8-6"/>
    <path class="il-green il-ink il-thin" d="M76 30c3-3 6-1 5 2zM70 46c3-2 6 0 4 3zM84 22c2-3 5-2 4 1z"/>
    <path class="il-blue il-ink" d="M14 104c0-18 8-28 22-28s22 10 22 28z"/>
    <path class="il-skin il-ink" d="M16 48h40v16c0 6-8 10-20 10s-20-4-20-10z"/>
    <path class="il-beard il-ink" d="M16 62c2 16 10 24 20 26 10-2 18-10 20-26-6 6-12 8-20 8s-14-2-20-8z"/>
    <path class="il-line il-thin" d="M28 76l2 6M36 78v8M44 76l-2 6"/>
    <path class="il-line" d="M30 68q6 4 12 0"/>
    <path class="il-line" d="M26 54q3-3 6 0M40 54q3-3 6 0"/>
    <circle class="il-pink il-ink il-thin" cx="36" cy="60" r="4"/>
    <path class="il-red il-ink" d="M12 50 36 8l24 42z"/>
    <path class="il-light" d="M30 22l-5 14"/>
    <path class="il-metal il-ink" d="M58 74l20-34 4 3-16 34z"/>
    <path class="il-metal il-ink" d="M58 82l26-26 3 4-22 26z"/>
    <circle class="il-dark il-ink il-thin" cx="64" cy="78" r="2"/>
    <path class="il-wood il-ink" d="M50 86l10-6 4 4-8 8zM54 92l10-6 3 4-9 7z"/>
    <circle class="il-skin il-ink" cx="52" cy="90" r="5"/>`,

  // The night watchman in the dark tunnel holds up his lantern with a fierce frown; the shadows flee, sweating.
  'kz.night-watch': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-torch" cx="76" cy="58" r="50"/>
    <path class="il-cave" d="M0 104h160v16H0z"/>
    <path class="il-purple-dark il-ink" d="M126 40c0-14 10-22 18-20 10 2 14 14 12 26l4 6-8 4-12-2-6 4z"/>
    <circle class="il-white" cx="136" cy="34" r="3"/><circle class="il-white" cx="146" cy="34" r="3"/>
    <circle class="il-dark" cx="134" cy="34" r="1.4"/><circle class="il-dark" cx="144" cy="34" r="1.4"/>
    <ellipse class="il-water il-ink il-thin" cx="128" cy="30" rx="2" ry="3"/>
    <path class="il-light" d="M154 52l6-2M152 60l6 0"/>
    <path class="il-purple-dark il-ink" d="M2 88c0-10 6-16 12-16s10 6 10 14l4 6-12 2-14-2z"/>
    <circle class="il-white" cx="10" cy="82" r="2.4"/><circle class="il-white" cx="18" cy="82" r="2.4"/>
    <circle class="il-dark" cx="9" cy="82" r="1.2"/><circle class="il-dark" cx="17" cy="82" r="1.2"/>
    <ellipse class="il-water il-ink il-thin" cx="24" cy="76" rx="1.8" ry="2.6"/>
    <path class="il-wood-dark il-ink" d="M44 104V88c0-10 12-16 26-16s26 6 26 16v16z"/>
    <path class="il-skin il-ink" d="M52 46c0-10 8-16 18-16s18 6 18 16v8c0 10-8 18-18 18s-18-8-18-18z"/>
    <path class="il-beard il-ink" d="M52 54c2 20 10 32 18 38 8-6 16-18 18-38-4 6-10 8-18 8s-14-2-18-8z"/>
    <path class="il-line il-thin" d="M62 70l2 8M70 72v10M78 70l-2 8"/>
    <path class="il-line" d="M64 66q6-4 12 0"/>
    <circle class="il-dark" cx="63" cy="49" r="2.4"/><circle class="il-dark" cx="77" cy="49" r="2.4"/>
    <path class="il-dark il-ink il-thin" d="M56 42l12 4-1 2-11-3zM84 42l-12 4 1 2 11-3z"/>
    <ellipse class="il-pink il-ink il-thin" cx="70" cy="56" rx="5" ry="4"/>
    <path class="il-grey il-ink" d="M50 40c0-14 8-22 20-22s20 8 20 22z"/>
    <path class="il-grey il-ink" d="M46 39h48v6H46z"/>
    <path class="il-line il-thin" d="M108 30v10"/>
    <path class="il-dark il-ink il-thin" d="M100 40h16l-2 4h-12z"/>
    <path class="il-yellow il-ink" d="M102 44h12v18h-12z"/>
    <circle class="il-glow" cx="108" cy="53" r="4"/>
    <path class="il-dark il-ink il-thin" d="M100 62h16v4h-16z"/>
    <path class="il-line il-thin" d="M102 26a6 6 0 0 1 12 0"/>
    <path class="il-wood-dark il-ink" d="M92 86l12-26 4 2-10 26z"/>
    <circle class="il-skin il-ink" cx="104" cy="66" r="5"/>`,

  // A grinning dwarf gives a thumbs-up: his cracked hard hat and his pickaxe handle are held together with lots of tape.
  'kz.taped-up': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 104h160v16H0z"/>
    <path class="il-wood-dark il-ink" d="M36 104V90c0-10 12-16 28-16s28 6 28 16v14z"/>
    <path class="il-skin il-ink" d="M44 50c0-10 8-16 20-16s20 6 20 16v8c0 10-8 18-20 18s-20-8-20-18z"/>
    <path class="il-beard il-ink" d="M44 58c2 18 10 30 20 38 10-8 18-20 20-38-4 6-10 8-20 8s-16-2-20-8z"/>
    <path class="il-line il-thin" d="M56 76l2 8M64 78v10M72 76l-2 8"/>
    <path class="il-dark il-ink il-thin" d="M56 66q8 8 16 0z"/>
    <path class="il-white" d="M58 67h12v2H58z"/>
    <circle class="il-dark" cx="57" cy="52" r="2.4"/><path class="il-line" d="M68 52q3-3 6 0"/>
    <path class="il-line" d="M52 46l8-2M68 44l8 2"/>
    <ellipse class="il-pink il-ink il-thin" cx="64" cy="59" rx="5" ry="4"/>
    <path class="il-yellow il-ink" d="M40 44c0-16 10-24 24-24s24 8 24 24z"/>
    <path class="il-yellow il-ink" d="M36 43h56v6H36z"/>
    <path class="il-line" d="M62 20l4 6-4 5 4 6-3 7"/>
    <g class="il-metal il-ink il-thin">
      <rect x="52" y="26" width="26" height="6" transform="rotate(35 65 29)"/>
      <rect x="52" y="26" width="26" height="6" transform="rotate(-35 65 29)"/>
      <rect x="54" y="36" width="22" height="6" transform="rotate(10 65 39)"/>
    </g>
    <path class="il-wood il-ink" d="M98 104l-3-2 12-26 3 2zM110 74l-3-2 12-24 3 2z"/>
    <path class="il-metal il-ink" d="M112 46c8-8 20-8 26-2-8-2-16 0-22 8z"/>
    <g class="il-metal il-ink il-thin">
      <rect x="102" y="70" width="14" height="5" transform="rotate(-62 109 72)"/>
      <rect x="100" y="74" width="16" height="5" transform="rotate(-20 108 76)"/>
      <rect x="102" y="68" width="16" height="5" transform="rotate(30 110 70)"/>
    </g>
    <path class="il-skin il-ink" d="M26 82c0-6 4-8 8-8h6v12h-14zM30 74v-8c0-3 4-3 4 0v8"/>
    <circle class="il-grey il-ink" cx="138" cy="96" r="10"/><circle class="il-sky il-ink il-thin" cx="138" cy="96" r="4"/>
    <path class="il-metal il-ink il-thin" d="M128 98c-6 2-14 2-20 6l2 3c6-3 12-4 18-5z"/>`,

  // A dwarf hand holds up a freshly polished shield that flashes like a star; the small monster opposite squints and hides its eyes.
  'kz.freshly-polished': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <circle class="il-glow" cx="58" cy="56" r="44" opacity="0.18"/>
    <path class="il-light" d="M58 4v10M58 98v8M8 56h10M98 56h8M22 20l7 7M94 20l-7 7M22 92l7-7"/>
    <circle class="il-metal il-ink il-thick" cx="58" cy="58" r="34"/>
    <circle class="il-metal il-ink" cx="58" cy="58" r="24"/>
    <circle class="il-grey il-ink" cx="58" cy="58" r="7"/>
    <path class="il-light" d="M36 44q8-16 24-18M40 52q4-8 10-10M70 84q10-4 14-14"/>
    <path class="il-white" d="M44 34l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>
    <path class="il-white" d="M78 72l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <circle class="il-skin il-ink" cx="30" cy="96" r="7"/>
    <path class="il-purple il-ink" d="M110 104c-2-20 6-36 22-36s24 16 22 36z"/>
    <path class="il-line" d="M120 84l6 3-6 3M144 84l-6 3 6 3"/>
    <path class="il-dark il-ink il-thin" d="M126 96q6-4 12 0z"/>
    <path class="il-purple il-ink" d="M112 84l-4-10c-2-4 4-6 6-2l6 8zM152 84l4-10c2-4-4-6-6-2l-6 8z"/>
    <path class="il-purple il-ink" d="M118 70l-4-8 8 4zM146 70l4-8-8 4z"/>
    <ellipse class="il-water il-ink il-thin" cx="150" cy="92" rx="2" ry="3"/>
    <path class="il-line il-thin" d="M104 66l-4-3M106 58l-2-4M160 66l-4-3"/>`,

  // A gnome clings to a wheelbarrow with a huge fan bolted on, flames behind, warning sign, hat blown back and speed lines.
  'kz.turbo-attachment': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M120 60h30M124 70h34M118 80h28M126 90h24"/>
    <path class="il-orange il-ink" d="M4 70c6-10 14-10 18-4 2-6 8-6 10 0v18c-2 6-8 6-10 0-4 6-12 6-18-4 4-2 4-8 0-10z"/>
    <path class="il-yellow il-ink il-thin" d="M14 72c4-4 8-2 10 2 2-2 4 0 4 2v6c0 2-2 4-4 2-2 4-6 6-10 2 2-2 2-6 0-8z"/>
    <path class="il-smoke il-ink il-thin" d="M6 46c-4-4 0-10 6-8 2-6 10-6 12 0 6 0 6 8 0 10-4 4-14 4-18-2z"/>
    <circle class="il-metal il-ink il-thick" cx="42" cy="66" r="18"/>
    <circle class="il-grey il-ink" cx="42" cy="66" r="13"/>
    <g class="il-metal il-ink il-thin">
      <path d="M42 66l-4-12c2-2 6-2 8 0z"/><path d="M42 66l12-4c2 2 2 6 0 8z"/>
      <path d="M42 66l4 12c-2 2-6 2-8 0z"/><path d="M42 66l-12 4c-2-2-2-6 0-8z"/>
    </g>
    <circle class="il-dark" cx="42" cy="66" r="3"/>
    <path class="il-red il-ink" d="M56 62h62l-10 24H66z"/>
    <path class="il-line il-thin" d="M64 70h48"/>
    <path class="il-dark il-ink" d="M70 86l-6 14M104 86l6 10"/>
    <circle class="il-dark il-ink" cx="112" cy="98" r="9"/><circle class="il-metal" cx="112" cy="98" r="3"/>
    <path class="il-blue il-ink" d="M72 62c0-10 8-14 16-14s16 4 16 14z"/>
    <path class="il-skin il-ink" d="M76 30h28v14c0 4-6 8-14 8s-14-4-14-8z"/>
    <path class="il-beard il-ink" d="M76 40c-10 4-18 6-26 4 8 4 18 8 30 8 10 0 20-2 24-8-6 2-18 0-28-4z"/>
    <circle class="il-white il-ink il-thin" cx="85" cy="36" r="4"/><circle class="il-dark" cx="86" cy="36" r="2"/>
    <circle class="il-white il-ink il-thin" cx="97" cy="36" r="4"/><circle class="il-dark" cx="98" cy="36" r="2"/>
    <ellipse class="il-dark" cx="94" cy="46" rx="4" ry="3"/>
    <path class="il-red il-ink" d="M78 32c-10-2-26 2-36-6 8 0 14-4 18-8 6-2 14 0 18 4z"/>
    <circle class="il-skin il-ink" cx="74" cy="62" r="4"/><circle class="il-skin il-ink" cx="106" cy="62" r="4"/>
    <path class="il-line" d="M112 22l6-4-2 6 6-2"/>
    <path class="il-line" d="M126 28l6-2-4 5 6 0"/>
    <path class="il-yellow il-ink" d="M140 4l14 24h-28z"/>
    <path class="il-dark" d="M139 11h2l-0.5 10h-1z"/><circle class="il-dark" cx="140" cy="24" r="1.4"/>`,

  // A runestone carved with a crossed fork and knife; a dwarf with a napkin tucked in his beard licks his lips; a four-leaf clover grows at its foot.
  'kz.lucky-rune': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-stone il-ink" d="M66 104c-6-30-4-60 8-80 10-14 30-14 38 0 12 20 14 50 8 80z"/>
    <path class="il-line il-thin" d="M74 40l4 3M112 70l-4 4M80 90l5 1"/>
    <path class="il-line il-thick" d="M86 50l22 32"/>
    <path class="il-line" d="M80 50l6-2 4-6M78 44l6 4M82 40l4 8M86 38l2 6"/>
    <path class="il-line il-thick" d="M84 82l10-14"/>
    <path class="il-cave il-ink" d="M93 69l15-26c4 4 4 12-1 20l-10 9z"/>
    <path class="il-glow" d="M96 30l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/>
    <g class="il-green il-ink il-thin">
      <circle cx="122" cy="98" r="4"/><circle cx="130" cy="98" r="4"/><circle cx="122" cy="106" r="4"/><circle cx="130" cy="106" r="4"/>
    </g>
    <path class="il-line il-thin" d="M126 102l6 10"/>
    <path class="il-wood-dark il-ink" d="M6 104V90c0-8 10-14 22-14s22 6 22 14v14z"/>
    <path class="il-skin il-ink" d="M10 52c0-10 8-16 18-16s18 6 18 16v8c0 10-8 18-18 18s-18-8-18-18z"/>
    <path class="il-beard il-ink" d="M10 60c2 18 10 30 18 36 8-6 16-18 18-36-4 6-10 8-18 8s-14-2-18-8z"/>
    <path class="il-red il-ink" d="M16 76l12 6 12-6-4 18H20z"/>
    <path class="il-light il-thin" d="M20 84h16M22 90h12M24 80v12M32 80v12"/>
    <path class="il-dark il-ink il-thin" d="M22 68q6 6 12 0z"/>
    <path class="il-red il-ink il-thin" d="M32 68c3 0 5 4 2 6-2 0-3-2-2-6z"/>
    <path class="il-line" d="M18 54q3-3 6 0M32 54q3-3 6 0"/>
    <ellipse class="il-pink il-ink il-thin" cx="28" cy="60" rx="4.4" ry="3.6"/>
    <path class="il-wood il-ink" d="M8 50c0-14 8-22 20-22s20 8 20 22c-6-4-12-6-20-6s-14 2-20 6z"/>
    <path class="il-light" d="M52 36q4-6 10-6M50 46q6-2 10 0"/>`,

  // A wobbling preserve jar with a tiny thunderstorm inside: dark cloud, rain and a lightning bolt zapping out through the lid.
  'kz.bottled-thunderstorm': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M0 102h160v18H0z"/>
    <path class="il-line il-thin" d="M10 110h40M90 114h50"/>
    <path class="il-line" d="M36 50q-6 16 0 32M28 56q-4 10 0 20M124 50q6 16 0 32M132 56q4 10 0 20"/>
    <rect class="il-white il-ink" x="46" y="34" width="68" height="70" rx="14" opacity="0.55"/>
    <path class="il-grey il-ink" d="M54 62c-4-8 4-14 10-10 2-8 14-10 18-2 4-6 14-4 16 2 8-2 12 8 6 12-2 4-6 4-10 4H62c-4 0-6-2-8-6z"/>
    <path class="il-water-line" d="M64 72l-3 10M78 72l-3 12M92 72l-3 10"/>
    <path class="il-yellow il-ink il-thin" d="M84 68l-8 14h6l-6 14 14-18h-6l6-10z"/>
    <path class="il-light" d="M52 46v20M56 92h10"/>
    <circle class="il-dark" cx="72" cy="58" r="1.8"/><circle class="il-dark" cx="86" cy="58" r="1.8"/>
    <path class="il-line il-thin" d="M68 54l6 2M90 54l-6 2M75 63q4-3 8 0"/>
    <rect class="il-metal il-ink" x="50" y="24" width="60" height="12" rx="3"/>
    <path class="il-line il-thin" d="M56 26v8M64 26v8M72 26v8M80 26v8M88 26v8M96 26v8M104 26v8"/>
    <path class="il-yellow il-ink il-thin" d="M92 24l6-10h-5l6-12-12 14h5l-4 8z"/>
    <path class="il-line il-thin" d="M84 14l-4-4M104 14l4-3M100 22l6 2"/>`,

  // A runaway monster freezes mid-sprint, both feet stuck in a puddle of gnome glue with stringy strands; the glue pot drips beside it.
  'kz.gnome-superglue': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <ellipse class="il-white il-ink" cx="92" cy="104" rx="46" ry="8"/>
    <path class="il-light" d="M70 102h10M104 106h12"/>
    <path class="il-orange il-ink" d="M72 98l-4-14 8-2 4 16zM104 98l4-16 8 2-6 14z"/>
    <path class="il-white il-ink il-thin" d="M66 98h16l-2 6H64zM102 98h16l2 6h-18z"/>
    <path class="il-line il-thin" d="M70 98v6M76 98v6M108 98v6M114 98v6"/>
    <path class="il-orange il-ink" d="M66 86c-6-24 6-46 26-46s30 22 24 46z"/>
    <path class="il-orange il-ink" d="M72 40l-2-12 10 8zM112 40l2-12-10 8z"/>
    <circle class="il-white il-ink" cx="84" cy="56" r="7"/><circle class="il-dark" cx="88" cy="56" r="3"/>
    <circle class="il-white il-ink" cx="102" cy="56" r="7"/><circle class="il-dark" cx="106" cy="56" r="3"/>
    <path class="il-line" d="M78 46l10 4M110 46l-10 4"/>
    <ellipse class="il-dark il-ink" cx="94" cy="74" rx="8" ry="6"/>
    <path class="il-white" d="M88 70l3 3 3-3 3 3 3-3"/>
    <path class="il-orange il-ink" d="M116 66l18-10 3 5-17 10zM68 66l-16-12-3 5 16 12z"/>
    <path class="il-line il-thin" d="M138 52l6-4M140 60h8M46 50l-6-4M44 58h-8"/>
    <ellipse class="il-water il-ink il-thin" cx="72" cy="48" rx="2" ry="3"/>
    <path class="il-white il-ink" d="M10 86h28l-3 16H13z"/>
    <path class="il-white il-ink" d="M14 86c0-4 6-6 10-6s10 2 10 6z"/>
    <rect class="il-yellow il-ink il-thin" x="14" y="90" width="20" height="7"/>
    <path class="il-wood il-ink il-thin" d="M26 80l6-22 3 1-6 22z"/>
    <path class="il-white il-ink il-thin" d="M36 92c2 0 3 4 2 8-2 0-3-4-2-8z"/>`,

  // A smug green cloud of mine gas grins in the tunnel; the canary in its cage has fainted and the dwarf holds his nose.
  'kz.mine-gas': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-stone il-ink il-thin" d="M6 20l8-4 6 5-7 5zM150 10l-6 4 4 5 6-3z"/>
    <path class="il-slime il-ink" d="M20 70c-12-4-10-22 4-20 0-14 18-20 26-10 6-12 26-12 30 2 14-2 20 14 10 22 8 8 0 20-12 16-6 10-24 10-30 2-10 6-26 2-28-12z" opacity="0.9"/>
    <path class="il-line" d="M32 58q4-4 8 0M54 58q4-4 8 0"/>
    <path class="il-line" d="M30 52l10 2M64 52l-10 2"/>
    <path class="il-dark il-ink il-thin" d="M36 68q12 10 24 0q-12 4-24 0z"/>
    <path class="il-line il-thin" d="M24 34c-4-4 2-8-2-12M48 30c-4-4 2-8-2-12M72 34c-4-4 2-8-2-12"/>
    <path class="il-line il-thin" d="M134 0v6"/>
    <path class="il-gold il-ink il-thin" d="M120 32c0-16 6-26 14-26s14 10 14 26z" opacity="0.35"/>
    <path class="il-line il-thin" d="M120 32c0-16 6-26 14-26s14 10 14 26M127 32c0-14 3-22 7-26M141 32c0-14-3-22-7-26M134 6v26"/>
    <path class="il-wood il-ink il-thin" d="M118 32h32v4h-32z"/>
    <ellipse class="il-yellow il-ink il-thin" cx="134" cy="27" rx="9" ry="5"/>
    <path class="il-line il-thin" d="M130 22l-2-6M138 22l2-6M127 16l2 1M141 16l-2 1"/>
    <path class="il-line il-thin" d="M129 25l3 3M132 25l-3 3"/>
    <path class="il-orange il-ink il-thin" d="M125 27l-4 1 4 2z"/>
    <path class="il-line il-thin" d="M150 14l4-3M152 22h5"/>
    <path class="il-wood-dark il-ink" d="M108 104V90c0-8 10-14 22-14s22 6 22 14v14z"/>
    <path class="il-skin il-ink" d="M112 58c0-8 8-14 18-14s18 6 18 14v8c0 10-8 16-18 16s-18-6-18-16z"/>
    <path class="il-beard il-ink" d="M112 66c2 16 10 26 18 32 8-6 16-16 18-32-4 4-10 6-18 6s-14-2-18-6z"/>
    <path class="il-line" d="M118 60l6-2M136 58l6 2"/>
    <path class="il-line" d="M118 62q3 2 6 0M136 62q3 2 6 0"/>
    <ellipse class="il-water il-ink il-thin" cx="119" cy="68" rx="1.8" ry="2.6"/>
    <path class="il-skin il-ink" d="M124 72c0-6 4-8 8-8s6 4 4 8z"/>
    <path class="il-line il-thin" d="M126 66v4M130 66v4"/>
    <path class="il-grey il-ink" d="M110 54c0-12 8-18 20-18s20 6 20 18z"/>
    <path class="il-grey il-ink" d="M106 53h48v5h-48z"/>`,

  // A soot-blackened dwarf with frizzled beard tips and two smoking stubs where his eyebrows were; the burnt-out firecracker lies at his feet.
  'kz.firecracker': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 106h160v14H0z"/>
    <path class="il-wood-dark il-ink" d="M42 106V94c0-10 14-16 30-16s30 6 30 16v12z"/>
    <path class="il-skin il-ink" d="M44 46c0-14 12-22 28-22s28 8 28 22v12c0 14-12 22-28 22s-28-8-28-22z"/>
    <path class="il-dark" d="M50 54c4-6 12-6 14 0 2 6-4 10-10 8-4 0-6-4-4-8zM84 50c6-4 12 0 12 6s-8 8-12 4c-2-2-2-6 0-10zM60 70c4-2 8 0 10 2-4 2-8 2-10-2z" opacity="0.7"/>
    <path class="il-beard il-ink" d="M46 62c2 20 14 34 26 40 12-6 24-20 26-40-6 6-14 10-26 10s-20-4-26-10z"/>
    <path class="il-dark il-ink il-thin" d="M50 84l-4 4 6 0M56 94l-4 4 6 0M94 84l4 4-6 0M88 94l4 4-6 0M70 102l2 6 2-6"/>
    <circle class="il-white il-ink" cx="60" cy="52" r="6"/><circle class="il-dark" cx="60" cy="52" r="2"/>
    <circle class="il-white il-ink" cx="84" cy="52" r="6"/><circle class="il-dark" cx="84" cy="52" r="2"/>
    <rect class="il-dark" x="57" y="41" width="6" height="2" rx="1"/><rect class="il-dark" x="81" y="41" width="6" height="2" rx="1"/>
    <path class="il-smoke" d="M58 38c-3-4 2-6 0-10 4 2 4 6 2 10zM82 38c-3-4 2-6 0-10 4 2 4 6 2 10z"/>
    <ellipse class="il-pink il-ink il-thin" cx="72" cy="62" rx="5" ry="4"/>
    <ellipse class="il-dark il-ink il-thin" cx="72" cy="72" rx="4" ry="5"/>
    <path class="il-dark il-ink" d="M50 30c4-10 14-14 22-14s18 4 22 14c-6-4-14-6-22-6s-16 2-22 6z"/>
    <path class="il-line il-thin" d="M58 18l-2-4M72 14v-4M86 18l2-4"/>
    <path class="il-smoke il-ink il-thin" d="M104 20c-6 0-6-8 0-8 2-6 10-6 12 0 6 0 6 8 0 8z"/>
    <path class="il-red il-ink il-thin" d="M118 104l6-4 4 4 6-4 4 4 6-4"/>
    <path class="il-yellow il-ink il-thin" d="M130 92l2-8 3 6 6-6-1 8 7 0-6 4"/>
    <path class="il-red il-ink il-thin" d="M114 92l4-2 1 3zM150 96l3-3 2 3zM124 82l3-1v3z"/>
    <path class="il-light" d="M30 46l-8-2M30 58l-8 2M114 46l8-2M114 58l8 2"/>`,

  // A gnome after a spoonful of grandma's soup: tongue glowing red, steam out of his ears, one arm flexing a mighty muscle.
  'kz.thermos-soup': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M8 108h40M100 112h50"/>
    <path class="il-blue il-ink" d="M100 98c0-8 12-12 24-12s24 4 24 12c0 0 0 6-24 6s-24-6-24-6z"/>
    <path class="il-white il-ink il-thin" d="M108 92h32"/>
    <ellipse class="il-orange il-ink" cx="124" cy="88" rx="22" ry="5"/>
    <path class="il-red il-ink il-thin" d="M120 96c-2-2-5 0-3 2l3 3 3-3c2-2-1-4-3-2z"/>
    <path class="il-light" d="M112 80c-4-6 4-8 0-14M124 80c-4-6 4-8 0-14M136 80c-4-6 4-8 0-14"/>
    <path class="il-green il-ink" d="M18 104c0-18 10-28 26-28s26 10 26 28z"/>
    <path class="il-skin il-ink" d="M20 46h48v16c0 6-10 10-24 10s-24-4-24-10z"/>
    <path class="il-beard il-ink" d="M20 60c2 18 12 26 24 28 12-2 22-10 24-28-6 6-14 8-24 8s-18-2-24-8z"/>
    <path class="il-line il-thin" d="M34 78l2 6M44 80v8M54 78l-2 6"/>
    <path class="il-dark il-ink il-thin" d="M36 66q8 8 16 0z"/>
    <path class="il-red il-ink il-thin" d="M40 68c0 8 8 8 8 0z"/>
    <path class="il-line" d="M30 54l6-2M58 54l-6-2"/><path class="il-line" d="M30 56l6 2M58 56l-6 2"/>
    <circle class="il-red" cx="27" cy="62" r="3.4" opacity="0.7"/><circle class="il-red" cx="61" cy="62" r="3.4" opacity="0.7"/>
    <circle class="il-pink il-ink il-thin" cx="44" cy="60" r="4.4"/>
    <path class="il-red il-ink" d="M18 48 44 6l26 42z"/>
    <path class="il-light" d="M38 22l-5 14"/>
    <path class="il-smoke il-ink il-thin" d="M12 46c-6-2-6-10 0-10 0-6 8-6 8 0zM76 46c6-2 6-10 0-10 0-6-8-6-8 0z"/>
    <path class="il-green il-ink" d="M68 86c6-2 10-8 12-18l6 2c-2 12-8 20-16 22z"/>
    <path class="il-skin il-ink" d="M78 70c-4-6-2-12 4-12 6 0 8 6 6 12z"/>
    <path class="il-skin il-ink" d="M80 60c0-6 4-8 8-6 2 2 2 6 0 8z"/>
    <path class="il-line il-thin" d="M92 56l6-4M94 64h6M90 48l2-5"/>
    <path class="il-metal il-ink il-thin" d="M94 86l12-12 2 2-12 12z"/><ellipse class="il-metal il-ink il-thin" cx="108" cy="72" rx="4" ry="3" transform="rotate(-45 108 72)"/>`,

  // A dwarf bent double under a giant sack of gravel, knees wobbling, pebbles trickling out of a hole at the bottom.
  'kz.bag-of-gravel': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" d="M30 108l-6 6M38 108l6 6M110 110l8-4"/>
    <path class="il-paper il-ink" d="M50 70c-10-20-4-50 22-58 10-4 18 0 22 6 20 8 34 28 28 54-4 16-22 20-40 18-16-2-26-8-32-20z"/>
    <path class="il-line il-thin" d="M66 28c4 6 4 14 0 20M100 34c4 10 2 20-2 26M80 62c6 4 14 4 20 0"/>
    <path class="il-paper il-ink" d="M82 14c-2-6 0-10 6-10l4 8z"/>
    <path class="il-wood il-ink il-thin" d="M80 16l14-6 2 4-14 6z"/>
    <path class="il-wood-dark il-ink" d="M62 90l-8 8 6 6h6l-4-6 8-6zM86 88l4 8-4 8h6l4-8-4-8z"/>
    <path class="il-dark il-ink" d="M54 104h12v6H52zM86 104h12l2 6H86z"/>
    <path class="il-wood-dark il-ink" d="M48 72c6-8 20-12 32-8 10 4 14 14 12 24-10 4-26 4-34 0-6-4-10-10-10-16z"/>
    <path class="il-line il-thin" d="M54 98l-4-2M100 96l4-2"/>
    <path class="il-skin il-ink" d="M30 70c0-8 6-14 14-14s14 6 14 14v6c0 8-6 14-14 14s-14-6-14-14z"/>
    <path class="il-beard il-ink" d="M30 76c2 14 8 24 14 28 6-4 12-14 14-28-4 4-8 6-14 6s-10-2-14-6z"/>
    <path class="il-dark il-ink il-thin" d="M38 82q6 4 12 0z"/>
    <path class="il-red il-ink il-thin" d="M42 83c0 5 4 5 4 0z"/>
    <path class="il-line" d="M34 70l6 2M54 70l-6 2"/>
    <path class="il-line" d="M35 74h4M49 74h4"/>
    <ellipse class="il-pink il-ink il-thin" cx="44" cy="78" rx="4" ry="3"/>
    <path class="il-wood-dark il-ink" d="M28 64c0-12 8-18 16-18s16 6 16 18c-4-3-10-4-16-4s-12 1-16 4z"/>
    <ellipse class="il-water il-ink il-thin" cx="26" cy="58" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="62" cy="54" rx="2" ry="3"/>
    <circle class="il-skin il-ink" cx="56" cy="44" r="5"/>
    <path class="il-dark" d="M108 84l6 2-4 4z"/>
    <g class="il-stone il-ink il-thin"><circle cx="112" cy="94" r="2.6"/><circle cx="116" cy="100" r="2.4"/><circle cx="120" cy="106" r="2.8"/>
      <circle cx="126" cy="106" r="2.4"/><circle cx="114" cy="106" r="2.2"/></g>`,

  // Seven shovels march in single file, singing with open mouths; music notes float above; a monster flees off the edge holding its ears.
  'kz.seven-shovels-song': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <g class="il-wood il-ink il-thin">
      <rect x="10" y="46" width="4" height="34"/><rect x="28" y="42" width="4" height="34"/><rect x="46" y="46" width="4" height="34"/>
      <rect x="64" y="42" width="4" height="34"/><rect x="82" y="46" width="4" height="34"/><rect x="100" y="42" width="4" height="34"/>
      <rect x="118" y="46" width="4" height="34"/>
    </g>
    <g class="il-wood-dark il-ink il-thin">
      <rect x="6" y="42" width="12" height="5" rx="2"/><rect x="24" y="38" width="12" height="5" rx="2"/><rect x="42" y="42" width="12" height="5" rx="2"/>
      <rect x="60" y="38" width="12" height="5" rx="2"/><rect x="78" y="42" width="12" height="5" rx="2"/><rect x="96" y="38" width="12" height="5" rx="2"/>
      <rect x="114" y="42" width="12" height="5" rx="2"/>
    </g>
    <g class="il-metal il-ink">
      <path d="M4 80h16v12l-8 10-8-10z"/><path d="M22 76h16v12l-8 10-8-10z"/><path d="M40 80h16v12l-8 10-8-10z"/>
      <path d="M58 76h16v12l-8 10-8-10z"/><path d="M76 80h16v12l-8 10-8-10z"/><path d="M94 76h16v12l-8 10-8-10z"/>
      <path d="M112 80h16v12l-8 10-8-10z"/>
    </g>
    <g class="il-dark">
      <circle cx="9" cy="85" r="1.3"/><circle cx="15" cy="85" r="1.3"/><ellipse cx="12" cy="91" rx="2" ry="2.6"/>
      <circle cx="27" cy="81" r="1.3"/><circle cx="33" cy="81" r="1.3"/><ellipse cx="30" cy="87" rx="2" ry="2.6"/>
      <circle cx="45" cy="85" r="1.3"/><circle cx="51" cy="85" r="1.3"/><ellipse cx="48" cy="91" rx="2" ry="2.6"/>
      <circle cx="63" cy="81" r="1.3"/><circle cx="69" cy="81" r="1.3"/><ellipse cx="66" cy="87" rx="2" ry="2.6"/>
      <circle cx="81" cy="85" r="1.3"/><circle cx="87" cy="85" r="1.3"/><ellipse cx="84" cy="91" rx="2" ry="2.6"/>
      <circle cx="99" cy="81" r="1.3"/><circle cx="105" cy="81" r="1.3"/><ellipse cx="102" cy="87" rx="2" ry="2.6"/>
      <circle cx="117" cy="85" r="1.3"/><circle cx="123" cy="85" r="1.3"/><ellipse cx="120" cy="91" rx="2" ry="2.6"/>
    </g>
    <g class="il-dark">
      <ellipse cx="20" cy="22" rx="3.4" ry="2.6"/><ellipse cx="56" cy="16" rx="3.4" ry="2.6"/><ellipse cx="92" cy="24" rx="3.4" ry="2.6"/>
      <ellipse cx="110" cy="14" rx="3.4" ry="2.6"/><ellipse cx="122" cy="12" rx="3.4" ry="2.6"/>
    </g>
    <path class="il-line" d="M23 22V10l4 3M59 16V4l4 3M95 24V12l4 3M113 14V2h12v10"/>
    <path class="il-purple il-ink" d="M140 100c-4-18 2-34 12-36h8v36z"/>
    <circle class="il-white il-ink il-thin" cx="150" cy="74" r="4"/><circle class="il-dark" cx="152" cy="74" r="1.8"/>
    <path class="il-dark il-ink il-thin" d="M146 86q6-4 10 0q-4 4-10 0z"/>
    <path class="il-purple il-ink" d="M142 64l-4-8 8 2z"/>
    <path class="il-purple il-ink il-thin" d="M140 70c-4 0-6 6-2 8l4-2z"/>
    <path class="il-line il-thin" d="M134 62l-4-4M132 74h-4M136 84l-4 2"/>
    <ellipse class="il-water il-ink il-thin" cx="156" cy="64" rx="1.8" ry="2.6"/>`,

  // A crow, a dwarf and a rat all stare spellbound with huge eyes at one sparkling gem floating above them.
  'kz.shiny-distraction': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <circle class="il-glow" cx="80" cy="24" r="20" opacity="0.25"/>
    <path class="il-light" d="M80 0v4M60 24h-6M100 24h6M66 10l-4-4M94 10l4-4M66 38l-4 4M94 38l4 4"/>
    <path class="il-gold il-ink" d="M70 18l6-8h8l6 8-10 16z"/>
    <path class="il-line il-thin" d="M70 18h20M76 10l4 8 4-8M80 18v16"/>
    <path class="il-white" d="M88 8l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>
    <path class="il-dark il-ink" d="M8 104c-4-14 2-26 14-28 10-2 18 6 18 18v10z"/>
    <path class="il-dark il-ink" d="M18 78c-2-10 4-18 14-18 8 0 12 8 10 14z"/>
    <path class="il-dark il-ink" d="M6 92l-6 8 10-2z"/>
    <path class="il-orange il-ink" d="M40 66l12-4-10 10z"/>
    <circle class="il-white il-ink" cx="34" cy="66" r="5"/><circle class="il-dark" cx="36" cy="63" r="2.4"/>
    <path class="il-wood-dark il-ink" d="M56 104V96c0-8 10-12 24-12s24 4 24 12v8z"/>
    <path class="il-skin il-ink" d="M60 66c0-10 8-16 20-16s20 6 20 16v6c0 10-8 16-20 16s-20-6-20-16z"/>
    <path class="il-beard il-ink" d="M60 72c2 14 10 24 20 30 10-6 18-16 20-30-4 4-10 6-20 6s-16-2-20-6z"/>
    <ellipse class="il-dark il-ink il-thin" cx="80" cy="84" rx="4" ry="5"/>
    <circle class="il-white il-ink" cx="72" cy="66" r="5"/><circle class="il-dark" cx="73" cy="63" r="2.4"/>
    <circle class="il-white il-ink" cx="88" cy="66" r="5"/><circle class="il-dark" cx="87" cy="63" r="2.4"/>
    <path class="il-line" d="M66 58l8-4M94 58l-8-4"/>
    <ellipse class="il-pink il-ink il-thin" cx="80" cy="74" rx="4.4" ry="3.4"/>
    <path class="il-yellow il-ink" d="M60 60c0-14 8-20 20-20s20 6 20 20z"/>
    <path class="il-yellow il-ink" d="M56 59h48v5H56z"/>
    <path class="il-line il-thin" d="M150 98c8-2 10 6 4 8"/>
    <path class="il-grey il-ink" d="M118 104c-2-12 6-20 18-20 8 0 14 6 14 14v6z"/>
    <path class="il-grey il-ink" d="M118 88c-6-4-6-12 0-16 6-2 12 2 14 8l-4 10z"/>
    <circle class="il-pink il-ink il-thin" cx="124" cy="70" r="4"/><circle class="il-pink il-ink il-thin" cx="132" cy="74" r="3.4"/>
    <circle class="il-white il-ink il-thin" cx="120" cy="80" r="3.6"/><circle class="il-dark" cx="120" cy="78" r="1.8"/>
    <circle class="il-pink il-ink il-thin" cx="112" cy="86" r="2"/>
    <path class="il-line il-thin" d="M110 86l-6-2M110 88l-6 2"/>`,

  // Only two boots are left sticking out of a narrow side tunnel in a puff of dust; the treasure chest on the left is empty but for a cobweb.
  'kz.side-tunnel': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 100h160v20H0z"/>
    <path class="il-stone il-ink il-thin" d="M8 14l8-4 6 5-7 5zM70 8l6-3 5 4-6 3zM150 100l6-3 4 4-6 3z"/>
    <ellipse class="il-stone il-ink" cx="128" cy="70" rx="28" ry="30"/>
    <path class="il-line il-thin" d="M104 56l6 2M146 46l-4 4M150 84l-6-2M118 98l2-5"/>
    <ellipse class="il-dark il-ink" cx="128" cy="72" rx="18" ry="20"/>
    <path class="il-wood-dark il-ink il-thin" d="M134 86c0-4 4-6 8-6l2 8-8 2z"/>
    <path class="il-smoke il-ink il-thin" d="M104 96c-8 0-8-10 0-10 0-6 10-8 12-2 6-2 10 6 4 10 2 6-8 8-10 4-2 2-6 2-6-2z"/>
    <path class="il-smoke il-ink il-thin" d="M98 80c-4 0-4-6 0-6 0-4 6-4 6 0 4 0 4 6 0 6z"/>
    <path class="il-line il-dash" d="M60 50c0-12 8-18 16-18s16 6 16 18zM56 50h40M62 52v8c0 6 4 10 6 12-6 2-10 8-10 16v12h36V88c0-8-4-14-10-16 2-2 6-6 6-12v-8"/>
    <path class="il-line il-thin" d="M98 56h10M98 64h8M96 72h6"/>
    <path class="il-beard il-ink il-thin" d="M84 40c3-3 6-2 6 1-2 2-4 2-6-1z"/>
    <path class="il-wood-dark il-ink" d="M14 70l-6-24h40l6 24z"/>
    <path class="il-line il-thin" d="M12 50l12 4M12 50l8 10M12 50l3 12M14 54q4-1 3 3M17 58q5-1 4-6"/>
    <path class="il-dark il-ink" d="M6 80l8-10h40l-8 10z"/>
    <path class="il-wood il-ink" d="M6 80h40v20H6z"/><path class="il-wood-dark il-ink" d="M46 80l8-10v20l-8 10z"/>
    <path class="il-gold il-ink il-thin" d="M6 86h40v4H6z"/>
    <rect class="il-gold il-ink il-thin" x="22" y="84" width="8" height="8" rx="1"/>
    <ellipse class="il-grey il-ink il-thin" cx="46" cy="36" rx="3" ry="5" transform="rotate(-30 46 36)"/>
    <ellipse class="il-grey il-ink il-thin" cx="52" cy="34" rx="3" ry="5" transform="rotate(30 52 34)"/>
    <path class="il-line il-thin" d="M40 46l-2 3M44 48l-1 4"/>
    <path class="il-line" d="M22 22c0-5 8-5 8 0 0 4-4 4-4 8"/><circle class="il-dark" cx="26" cy="34" r="1.4"/>`,

  // A gnome peeks over the garden wall and tips a watering can; a cold shower lands on the shocked, shivering monster below.
  'kz.watering-ambush': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-stone il-ink" d="M0 44h50v76H0z"/>
    <path class="il-line il-thin" d="M0 58h50M0 74h50M0 90h50M16 44v14M36 58v16M12 74v16M30 90v14M44 44v14"/>
    <path class="il-red il-ink" d="M8 32 22 4l14 28z"/>
    <path class="il-skin il-ink" d="M10 32h24v10H10z"/>
    <circle class="il-dark" cx="18" cy="37" r="1.6"/><circle class="il-dark" cx="27" cy="37" r="1.6"/>
    <path class="il-line il-thin" d="M15 34l4 1M30 34l-4 1"/>
    <path class="il-beard il-ink il-thin" d="M10 40c2 6 22 6 24 0z"/>
    <path class="il-dark il-ink il-thin" d="M18 41q4 3 8 0z"/>
    <circle class="il-skin il-ink" cx="40" cy="42" r="4.5"/>
    <g transform="rotate(30 60 30)">
      <path class="il-green il-ink" d="M44 22h30v22c0 4-4 6-8 6H52c-4 0-8-2-8-6z"/>
      <path class="il-line" d="M48 22c0-10 22-10 22 0"/>
      <path class="il-green il-ink" d="M74 36l14-8 2 4-14 8z"/>
      <ellipse class="il-metal il-ink" cx="90" cy="29" rx="4" ry="6" transform="rotate(-30 90 29)"/>
      <path class="il-light" d="M50 30v10"/>
    </g>
    <path class="il-water-line" d="M92 46l4 22M98 44l6 24M104 42l8 24M110 42l10 22"/>
    <path class="il-water il-ink il-thin" d="M84 104c-6 0-6-2 0-4h50c6 2 6 4 0 4z"/>
    <path class="il-orange il-ink" d="M86 102c-4-20 6-34 22-34s26 14 22 34z"/>
    <path class="il-water" d="M92 76c2-4 8-6 14-6v6c-4 0-8 2-10 4z" opacity="0.7"/>
    <circle class="il-white il-ink" cx="100" cy="82" r="6"/><circle class="il-dark" cx="100" cy="80" r="2.4"/>
    <circle class="il-white il-ink" cx="116" cy="82" r="6"/><circle class="il-dark" cx="116" cy="80" r="2.4"/>
    <path class="il-dark il-ink il-thin" d="M100 94l3-2 3 2 3-2 3 2 3-2v3h-15z"/>
    <path class="il-line il-thin" d="M80 80l-4 2 4 2-4 2M136 80l4 2-4 2 4 2"/>
    <ellipse class="il-water il-ink il-thin" cx="94" cy="100" rx="1.6" ry="2.4"/>
    <path class="il-white il-ink il-thin" d="M128 92l3 6 3-6z"/>`,

  // A beaming gnome in a brand-new extra-tall hat with a gold band and star, a medal on his chest, next to his pay: a tiny pile of pebbles.
  'kz.senior-gnome': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <g class="il-ink il-thin"><rect class="il-yellow" x="14" y="20" width="4" height="6" transform="rotate(20 16 23)"/>
      <rect class="il-pink" x="130" y="30" width="4" height="6" transform="rotate(-30 132 33)"/><rect class="il-teal" x="24" y="60" width="4" height="6" transform="rotate(40 26 63)"/>
      <rect class="il-orange" x="140" y="10" width="4" height="6" transform="rotate(10 142 13)"/><rect class="il-yellow" x="118" y="56" width="4" height="6" transform="rotate(-50 120 59)"/></g>
    <path class="il-blue il-ink" d="M50 106c0-20 12-30 28-30s28 10 28 30z"/>
    <path class="il-dark il-ink il-thin" d="M52 96h52v6H52z"/><rect class="il-gold il-ink il-thin" x="74" y="95" width="8" height="8" rx="1"/>
    <path class="il-red il-ink il-thin" d="M84 80l4-4 4 4-2 4h-4z"/><circle class="il-gold il-ink il-thin" cx="88" cy="88" r="3.6"/>
    <circle class="il-skin il-ink" cx="50" cy="92" r="6"/><circle class="il-skin il-ink" cx="106" cy="92" r="6"/>
    <path class="il-skin il-ink" d="M56 52h44v14c0 6-10 10-22 10s-22-4-22-10z"/>
    <path class="il-beard il-ink" d="M56 64c2 18 12 26 22 28 10-2 20-10 22-28-6 6-14 8-22 8s-16-2-22-8z"/>
    <path class="il-line il-thin" d="M68 80l2 6M78 82v8M88 80l-2 6"/>
    <path class="il-line" d="M70 70q8 6 16 0"/>
    <path class="il-line" d="M66 58q3-3 6 0M84 58q3-3 6 0"/>
    <circle class="il-pink" cx="63" cy="64" r="3"/><circle class="il-pink" cx="93" cy="64" r="3"/>
    <circle class="il-pink il-ink il-thin" cx="78" cy="63" r="4.4"/>
    <path class="il-red il-ink" d="M54 54 78 0l24 54z"/>
    <path class="il-gold il-ink" d="M56 46h44l3 8H53z"/>
    <path class="il-gold il-ink il-thin" d="M78 22l2.4 5 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8z"/>
    <path class="il-light" d="M72 14l-6 20"/>
    <path class="il-red il-ink il-thin" d="M18 104l8-18 8 18z"/>
    <path class="il-line il-thin" d="M14 100l24-10"/>
    <g class="il-stone il-ink il-thin"><circle cx="126" cy="100" r="4"/><circle cx="134" cy="101" r="3.6"/><circle cx="130" cy="94" r="3.4"/></g>
    <path class="il-white" d="M144 86l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/>`,

  // Birthday in the mine: the candles on a big cake set off a whoosh of flame that startles a bat, while the dwarf in a party hat grins with his fork ready.
  'kz.mine-birthday': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-orange il-ink" d="M78 48c-10-4-12-16-4-22 0-10 10-16 18-10 6-8 18-6 20 4 10 0 14 12 6 18 0 8-8 12-16 10-6 4-18 4-24 0z" opacity="0.85"/>
    <path class="il-yellow" d="M88 42c-4-4-2-10 4-10 2-6 10-6 12 0 6 0 6 8 0 10-4 2-12 2-16 0z"/>
    <g class="il-white il-ink il-thin"><rect x="80" y="50" width="4" height="12"/><rect x="90" y="48" width="4" height="14"/>
      <rect x="100" y="48" width="4" height="14"/><rect x="110" y="50" width="4" height="12"/></g>
    <path class="il-pink il-ink" d="M70 62h54v14H70z"/>
    <path class="il-white il-ink il-thin" d="M70 62h54v4c-4 0-4 5-8 5s-4-5-8-5-4 5-8 5-4-5-8-5-4 5-8 5-4-5-8-5-4 5-6 5z"/>
    <path class="il-wood il-ink" d="M64 76h66v24H64z"/>
    <path class="il-white il-ink il-thin" d="M64 76h66v4c-4 0-4 5-8 5s-4-5-8-5-4 5-8 5-4-5-8-5-4 5-8 5-4-5-8-5-4 5-8 5-4-5-8-5z"/>
    <g class="il-red il-ink il-thin"><circle cx="76" cy="92" r="2.4"/><circle cx="96" cy="94" r="2.4"/><circle cx="116" cy="92" r="2.4"/></g>
    <path class="il-metal il-ink" d="M58 100h78v4H58z"/>
    <path class="il-dark il-ink" d="M132 14c4-6 10-6 14-2 4-4 10-4 14 2-4 0-6 2-8 6-2-2-4-2-6 0-2-4-4-6-8-6z"/>
    <circle class="il-white" cx="144" cy="14" r="1.4"/><circle class="il-white" cx="148" cy="14" r="1.4"/>
    <path class="il-line il-thin" d="M126 10l-4-2M128 18l-4 2"/>
    <path class="il-wood-dark il-ink" d="M4 104V90c0-8 10-14 22-14s22 6 22 14v14z"/>
    <path class="il-skin il-ink" d="M8 52c0-10 8-16 18-16s18 6 18 16v8c0 10-8 18-18 18s-18-8-18-18z"/>
    <path class="il-beard il-ink" d="M8 60c2 18 10 30 18 36 8-6 16-18 18-36-4 6-10 8-18 8s-14-2-18-8z"/>
    <path class="il-dark il-ink il-thin" d="M18 68q8 8 16 0z"/>
    <path class="il-line" d="M16 54q3-3 6 0M30 54q3-3 6 0"/>
    <ellipse class="il-pink il-ink il-thin" cx="26" cy="61" rx="4.4" ry="3.6"/>
    <path class="il-yellow il-ink" d="M8 46c0-12 8-18 18-18s18 6 18 18z"/>
    <path class="il-yellow il-ink" d="M4 45h44v5H4z"/>
    <path class="il-teal il-ink" d="M16 30 26 4l10 26z"/>
    <path class="il-white il-ink il-thin" d="M19 22h14M22 14h8"/>
    <circle class="il-pink il-ink il-thin" cx="26" cy="4" r="3"/>
    <path class="il-metal il-ink il-thin" d="M50 90l4-30 2 0-3 30z"/>
    <path class="il-line il-thin" d="M52 62v-6M55 62v-6"/>
    <circle class="il-skin il-ink" cx="50" cy="90" r="5"/>`,

  // A young dwarf in a nightcap sits up in bed by moonlight; a big magnifying glass reveals the one proud new centimetre of beard; hearts float up.
  'kz.overnight-beard': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="104" y="10" width="40" height="34" rx="2"/>
    <path class="il-line il-thin" d="M124 10v34M104 27h40"/>
    <circle class="il-yellow" cx="134" cy="19" r="5"/><circle class="il-sky" cx="136" cy="17" r="4"/>
    <path class="il-wood-dark il-ink" d="M4 70h12v50H4z"/>
    <path class="il-wood il-ink" d="M10 92h140v28H10z"/>
    <path class="il-blue il-ink" d="M16 88c20-6 50-6 70 0 20 0 50-4 66 4v28H16z"/>
    <path class="il-light" d="M30 100h20M70 106h24M110 100h20" opacity="0.6"/>
    <ellipse class="il-white il-ink" cx="30" cy="82" rx="16" ry="8"/>
    <path class="il-blue il-ink" d="M36 92c0-10 8-16 18-16s18 6 18 16z"/>
    <path class="il-skin il-ink" d="M38 50c0-10 8-16 16-16s16 6 16 16v8c0 10-8 16-16 16s-16-6-16-16z"/>
    <path class="il-line" d="M44 52q3-3 6 0M58 52q3-3 6 0"/>
    <path class="il-line" d="M46 62q8 6 16 0"/>
    <circle class="il-pink" cx="43" cy="60" r="2.6"/><circle class="il-pink" cx="65" cy="60" r="2.6"/>
    <ellipse class="il-pink il-ink il-thin" cx="54" cy="57" rx="4" ry="3.2"/>
    <path class="il-beard il-ink il-thin" d="M51 72l1 4 2-3 2 3 1-4z"/>
    <path class="il-white il-ink" d="M36 46c0-16 10-24 22-22 10 2 14 10 16 18-6-4-14-6-22-4-6 2-12 4-16 8z"/>
    <path class="il-white il-ink" d="M58 24c10-4 24 0 30 12l-6 2c-4-6-12-10-20-8z"/>
    <circle class="il-white il-ink il-thin" cx="88" cy="38" r="4"/>
    <path class="il-wood-dark il-ink" d="M66 86l16 14 4-4-16-14z"/>
    <circle class="il-skin il-ink" cx="86" cy="100" r="5"/>
    <circle class="il-white" cx="56" cy="76" r="12" opacity="0.45"/>
    <path class="il-skin" d="M46 70h20v4c-4 4-16 4-20 0z"/>
    <path class="il-beard il-ink il-thin" d="M50 73c0 4 1 8 3 9 0-3 1-5 3-6 1 2 2 4 2 6 2-2 3-5 3-9z"/>
    <path class="il-line il-thin" d="M53 76v4M57 77v3"/>
    <circle class="il-line il-thick" cx="56" cy="76" r="12"/>
    <path class="il-red il-ink il-thin" d="M90 56c-2-3-7-1-5 3l5 5 5-5c2-4-3-6-5-3z"/>
    <path class="il-pink il-ink il-thin" d="M100 64c-2-2-5 0-3 2l3 3 3-3c2-2-1-4-3-2z"/>
    <path class="il-line il-thin" d="M24 28l4 0-4 4h4M30 18l3 0-3 3h3"/>`,

  // A confused kid wears a red pointy gnome hat with a miner's lamp and carries a pickaxe, between framed portraits of ceramic grandma and digger grandpa.
  'kz.patchwork-ancestry': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M20 0v120M60 0v120M100 0v120M140 0v120" opacity="0.15"/>
    <path class="il-wood il-ink" d="M0 104h160v16H0z"/>
    <rect class="il-gold il-ink" x="6" y="8" width="40" height="46" rx="4"/>
    <rect class="il-sky il-ink il-thin" x="11" y="13" width="30" height="36"/>
    <path class="il-red il-ink il-thin" d="M16 32 26 14l10 18z"/>
    <path class="il-skin il-ink il-thin" d="M17 32h18v6c0 3-4 5-9 5s-9-2-9-5z"/>
    <path class="il-pink il-ink il-thin" d="M14 49c0-6 6-8 12-8s12 2 12 8z"/>
    <circle class="il-dark" cx="22" cy="35" r="1.1"/><circle class="il-dark" cx="30" cy="35" r="1.1"/>
    <path class="il-line il-thin" d="M23 39q3 2 6 0"/>
    <path class="il-light" d="M22 22l-2 6"/>
    <path class="il-line il-thin" d="M32 28l2 3-2 2"/>
    <rect class="il-gold il-ink" x="114" y="8" width="40" height="46" rx="4"/>
    <rect class="il-cave il-ink il-thin" x="119" y="13" width="30" height="36"/>
    <path class="il-skin il-ink il-thin" d="M126 28h16v8c0 4-4 6-8 6s-8-2-8-6z"/>
    <path class="il-beard il-ink il-thin" d="M126 34c1 8 4 12 8 14 4-2 7-6 8-14-2 2-5 3-8 3s-6-1-8-3z"/>
    <path class="il-yellow il-ink il-thin" d="M124 28c0-6 4-10 10-10s10 4 10 10z"/>
    <circle class="il-dark" cx="130" cy="31" r="1.1"/><circle class="il-dark" cx="138" cy="31" r="1.1"/>
    <path class="il-wood il-ink il-thin" d="M144 48l2-14"/><path class="il-metal il-ink il-thin" d="M140 34c4-3 8-3 10 0-4 0-6 1-10 0z"/>
    <path class="il-wood-dark il-ink" d="M56 104V92c0-8 10-14 22-14s22 6 22 14v12z"/>
    <path class="il-skin il-ink" d="M60 58h36v14c0 8-8 14-18 14s-18-6-18-14z"/>
    <path class="il-beard il-ink" d="M60 70c2 16 10 26 18 30 8-4 16-14 18-30-4 4-10 6-18 6s-14-2-18-6z"/>
    <path class="il-line il-thin" d="M72 84l2 6M78 86v8M84 84l-2 6"/>
    <path class="il-line il-thin" d="M72 78q3-2 6 0t6 0"/>
    <circle class="il-dark" cx="70" cy="64" r="2.2"/><circle class="il-dark" cx="86" cy="64" r="2.2"/>
    <path class="il-line il-thin" d="M66 60l6-2M90 58l-6 1"/>
    <circle class="il-pink il-ink il-thin" cx="78" cy="70" r="3.8"/>
    <path class="il-red il-ink" d="M56 60 78 10l22 50z"/>
    <path class="il-light" d="M72 26l-5 14"/>
    <path class="il-dark il-ink il-thin" d="M60 48h36v4H60z"/>
    <circle class="il-metal il-ink" cx="78" cy="44" r="6"/><circle class="il-glow" cx="78" cy="44" r="3"/>
    <path class="il-torch" d="M84 42l26 -10v22z"/>
    <path class="il-wood il-ink il-thin" d="M102 102l-3-1 10-24 3 1z"/>
    <path class="il-metal il-ink" d="M104 76c4-6 12-6 16-2-4 0-10 0-14 4z"/>
    <circle class="il-skin il-ink" cx="102" cy="90" r="4.5"/>
    <ellipse class="il-water il-ink il-thin" cx="98" cy="62" rx="1.8" ry="2.6"/>
    <path class="il-line il-thin" d="M44 78c0-5 7-5 7 0 0 3-3 3-3 7"/><circle class="il-dark" cx="48" cy="89" r="1.2"/>`,

  // Split day and night: one exhausted dwarf with huge eye bags holds a comb and scissors on the sunny side and a lantern on the night side.
  'kz.second-job': `
    <rect class="il-sky" x="0" y="0" width="80" height="120"/>
    <rect class="il-night" x="80" y="0" width="80" height="120"/>
    <circle class="il-yellow il-ink" cx="18" cy="18" r="9"/>
    <path class="il-line il-thin" d="M18 4V0M4 18H0M30 8l3-3M30 28l3 3M6 30l-3 3"/>
    <circle class="il-yellow" cx="142" cy="18" r="8"/><circle class="il-night" cx="146" cy="15" r="7"/>
    <path class="il-white" d="M120 10l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"/>
    <path class="il-grass" d="M0 104h80v16H0z"/><path class="il-cave" d="M80 104h80v16H80z"/>
    <path class="il-white il-ink" d="M50 104V90c0-8 14-14 30-14v28z"/>
    <path class="il-wood-dark il-ink" d="M80 76c16 0 30 6 30 14v14H80z"/>
    <path class="il-skin il-ink" d="M58 46c0-12 10-18 22-18s22 6 22 18v8c0 12-10 18-22 18s-22-6-22-18z"/>
    <path class="il-beard il-ink" d="M58 56c2 18 12 30 22 36 10-6 20-18 22-36-6 6-12 8-22 8s-16-2-22-8z"/>
    <path class="il-line il-thin" d="M70 72l2 8M80 74v10M90 72l-2 8"/>
    <path class="il-line" d="M74 66q6-3 12 0"/>
    <path class="il-white il-ink il-thin" d="M64 48a6 6 0 0 1 12 0zM84 48a6 6 0 0 1 12 0z"/>
    <path class="il-dark" d="M64 48h12v-2H64zM84 48h12v-2H84z"/>
    <circle class="il-dark" cx="70" cy="47" r="1.6"/><circle class="il-dark" cx="90" cy="47" r="1.6"/>
    <path class="il-purple" d="M64 51q6 6 12 0zM84 51q6 6 12 0z" opacity="0.7"/>
    <path class="il-line il-thin" d="M64 52q6 5 12 0M84 52q6 5 12 0"/>
    <ellipse class="il-pink il-ink il-thin" cx="80" cy="57" rx="5" ry="4"/>
    <path class="il-line" d="M64 41l10 2M96 41l-10 2"/>
    <path class="il-grey il-ink" d="M58 40c0-12 10-20 22-20s22 8 22 20z"/>
    <path class="il-grey il-ink" d="M54 39h52v6H54z"/>
    <rect class="il-dark il-ink il-thin" x="56" y="26" width="18" height="5" rx="1.5" transform="rotate(-30 65 28)"/>
    <path class="il-skin il-ink" d="M44 90c-4-4-4-10 2-10 4 0 6 4 4 10z"/>
    <rect class="il-dark il-ink il-thin" x="22" y="66" width="24" height="6" rx="2" transform="rotate(-30 34 69)"/>
    <path class="il-light" d="M26 74l-2 4M31 71l-2 4M36 68l-2 4M41 65l-2 4" transform="rotate(0)"/>
    <path class="il-metal il-ink il-thin" d="M22 92l14-22 3 2-12 22zM34 94l-16-22 3-2 16 22z"/>
    <circle class="il-red il-ink" cx="22" cy="97" r="5"/><circle class="il-red il-ink" cx="35" cy="97" r="5"/>
    <circle class="il-sky" cx="22" cy="97" r="2.2"/><circle class="il-sky" cx="35" cy="97" r="2.2"/>
    <circle class="il-dark" cx="28.5" cy="82" r="1.6"/>
    <path class="il-line il-thin" d="M118 60v10"/>
    <path class="il-dark il-ink il-thin" d="M110 70h16l-2 4h-12z"/>
    <path class="il-yellow il-ink" d="M112 74h12v16h-12z"/><circle class="il-glow" cx="118" cy="82" r="3.6"/>
    <path class="il-dark il-ink il-thin" d="M110 90h16v4h-16z"/>
    <path class="il-line il-thin" d="M112 58a6 6 0 0 1 12 0"/>
    <circle class="il-skin il-ink" cx="118" cy="56" r="5"/>
    <path class="il-light" d="M132 42h8l-8 8h8M140 30h6l-6 6h6"/>`
};
