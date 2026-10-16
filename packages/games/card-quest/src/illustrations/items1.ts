/* Kampfzwerge illustrations: items1. */
export const ITEMS1: Readonly<Record<string, string>> = {
  // A proud gnome under an enormous red pointy hat whose tip pokes right through a startled little cloud.
  'kz.pointy-hat': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-smoke il-ink" d="M70 26c-8 0-10-10-2-12 0-8 10-10 14-4 4-6 14-6 16 0 8-2 14 6 8 12 4 6-2 10-8 8-4 4-12 4-16 0-4 2-10 2-12-4z"/>
    <circle class="il-dark" cx="100" cy="16" r="1.6"/><circle class="il-dark" cx="106" cy="16" r="1.6"/>
    <ellipse class="il-dark" cx="103" cy="22" rx="1.8" ry="2.4"/>
    <ellipse class="il-water il-ink il-thin" cx="104" cy="36" rx="2" ry="3"/>
    <ellipse class="il-water il-ink il-thin" cx="96" cy="42" rx="2" ry="3"/>
    <path class="il-red il-ink" d="M46 76Q66 44 84 6Q98 42 114 76z"/>
    <path class="il-line il-thin" d="M84 6l-6 2M84 6l5 3M86 2l-1 3"/>
    <path class="il-line il-thin" d="M74 30q6 8 4 22M92 34q-2 10 4 22M66 56q4 6 2 14"/>
    <path class="il-light il-thin" d="M80 20q-6 12-10 24"/>
    <rect class="il-white il-ink" x="42" y="72" width="76" height="11" rx="5.5"/>
    <path class="il-line il-thin" d="M52 74v7M64 74v7M76 74v7M88 74v7M100 74v7M110 74v7"/>
    <ellipse class="il-skin il-ink" cx="80" cy="90" rx="21" ry="9"/>
    <path class="il-beard il-ink" d="M58 90c0 16 12 28 22 30 10-2 22-14 22-30-6 4-14 6-22 6s-16-2-22-6z"/>
    <path class="il-line il-thin" d="M70 102q2 6 0 10M90 102q-2 6 0 10M80 104v10"/>
    <path class="il-line" d="M66 88q4-4 8 0M86 88q4-4 8 0"/>
    <circle class="il-skin il-ink" cx="80" cy="94" r="4.5"/>
    <circle class="il-pink" cx="64" cy="94" r="2.5"/><circle class="il-pink" cx="96" cy="94" r="2.5"/>
    <path class="il-grass il-ink il-thin" d="M10 104l3-8 2 8M24 104l2-7 3 7M136 104l3-9 2 9M150 104l2-6 3 6"/>`,

  // A dwarf with a miner's lamp helmet; the beam hits a ghost that recoils, squinting and shielding its face.
  'kz.lamp-helmet': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 108h160v12H0z"/>
    <path class="il-stone il-ink il-thin" d="M8 0l6 14 6-14zM118 0l5 10 5-10zM140 0l6 16 6-16z"/>
    <path class="il-torch" d="M60 32 160 4v76z"/>
    <path class="il-white il-ink" d="M114 78V46a16 16 0 0 1 32 0v32l-5-5-5 5-6-5-5 5-6-5z"/>
    <path class="il-line" d="M122 42l4 2-4 2M138 42l-4 2 4 2"/>
    <ellipse class="il-dark" cx="130" cy="54" rx="3" ry="4"/>
    <path class="il-white il-ink" d="M116 54c-6-2-8-8-4-10 2 2 4 4 6 4zM144 54c6-2 8-8 4-10-2 2-4 4-6 4z"/>
    <path class="il-line il-thin" d="M110 30l-4-4M118 26l-2-6M144 26l2-6M152 32l4-4"/>
    <path class="il-line" d="M130 16v8"/><circle class="il-dark" cx="130" cy="29" r="1.6"/>
    <path class="il-skin il-ink" d="M32 56c0-10 8-14 20-14s20 4 20 14v8c0 10-8 16-20 16s-20-6-20-16z"/>
    <path class="il-beard il-ink" d="M32 66c2 22 10 40 20 50 10-10 18-28 20-50-6 6-12 8-20 8s-14-2-20-8z"/>
    <path class="il-line il-thin" d="M44 82q2 10 0 18M60 82q-2 10 0 18M52 86v20"/>
    <path class="il-yellow il-ink" d="M26 50a26 22 0 0 1 52 0z"/>
    <rect class="il-gold il-ink" x="22" y="48" width="60" height="7" rx="3.5"/>
    <path class="il-light il-thin" d="M36 40q4-8 12-10"/>
    <rect class="il-metal il-ink" x="50" y="26" width="14" height="14" rx="4"/>
    <circle class="il-glow il-ink il-thin" cx="60" cy="33" r="4.5"/>
    <path class="il-line" d="M40 58l8 2M64 58l-8 2"/>
    <circle class="il-dark" cx="45" cy="63" r="2.4"/><circle class="il-dark" cx="59" cy="63" r="2.4"/>
    <circle class="il-skin il-ink" cx="52" cy="68" r="4"/>
    <path class="il-line il-thin" d="M46 74q6 4 12 0"/>
    <ellipse class="il-stone il-ink il-thin" cx="96" cy="110" rx="8" ry="4"/>
    <ellipse class="il-stone il-ink il-thin" cx="14" cy="110" rx="6" ry="3"/>`,

  // A dented gold crown with a smug face lounging on a purple cushion; a sticking plaster covers the dent.
  'kz.mine-king-crown': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-purple il-ink" d="M22 98q58-14 116 0l-4 16q-54 8-108 0z"/>
    <path class="il-purple-dark" d="M30 108q50 6 100 0v2q-50 6-100 0z"/>
    <circle class="il-gold il-ink il-thin" cx="22" cy="98" r="4"/><circle class="il-gold il-ink il-thin" cx="138" cy="98" r="4"/>
    <circle class="il-gold il-ink il-thin" cx="26" cy="114" r="4"/><circle class="il-gold il-ink il-thin" cx="134" cy="114" r="4"/>
    <path class="il-gold il-ink" d="M38 80 40 40 58 62 70 26 82 58 94 28 104 60 128 46 122 80z"/>
    <circle class="il-gold il-ink" cx="40" cy="38" r="4"/><circle class="il-gold il-ink" cx="70" cy="24" r="4"/>
    <circle class="il-gold il-ink" cx="94" cy="26" r="4"/><circle class="il-gold il-ink" cx="129" cy="45" r="4"/>
    <path class="il-line il-thin" d="M104 60l6-6M108 64l6-2"/>
    <rect class="il-white il-ink il-thin" x="106" y="52" width="16" height="7" rx="3" transform="rotate(-24 114 56)"/>
    <path class="il-line il-thin" d="M112 54l1 3M116 52l1 3"/>
    <rect class="il-gold il-ink" x="34" y="78" width="92" height="16" rx="3"/>
    <circle class="il-red il-ink il-thin" cx="50" cy="86" r="4.5"/>
    <path class="il-blue il-ink il-thin" d="M80 80l6 6-6 6-6-6z"/>
    <circle class="il-green il-ink il-thin" cx="110" cy="86" r="4.5"/>
    <path class="il-light il-thin" d="M44 46l1 18M60 72h14"/>
    <circle class="il-white il-ink il-thin" cx="72" cy="66" r="4.5"/><circle class="il-white il-ink il-thin" cx="90" cy="66" r="4.5"/>
    <path class="il-gold il-ink il-thin" d="M67 66a5 5 0 0 1 10 0zM85 66a5 5 0 0 1 10 0z"/>
    <circle class="il-dark" cx="73" cy="68" r="1.6"/><circle class="il-dark" cx="91" cy="68" r="1.6"/>
    <path class="il-line il-thin" d="M76 74q6 3 12-1"/>
    <path class="il-glow" d="M18 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM144 20l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM148 70l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z"/>`,

  // A cheeky gnome wearing a watering can as a hat, sprinkling a soaked, grumpy little dwarf.
  'kz.watering-hat': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-line il-thick" d="M38 30q18-24 34 0"/>
    <rect class="il-green il-ink" x="28" y="28" width="54" height="36" rx="6"/>
    <path class="il-line il-thin" d="M28 36h54M28 56h54"/>
    <path class="il-light il-thin" d="M34 42v8"/>
    <path class="il-green il-ink" d="M80 44l26 8v8l-26-4z"/>
    <path class="il-metal il-ink" d="M104 48l10-2 2 20-10-2z"/>
    <circle class="il-dark" cx="110" cy="52" r="1"/><circle class="il-dark" cx="111" cy="57" r="1"/><circle class="il-dark" cx="111" cy="62" r="1"/>
    <path class="il-water-line" d="M118 54c8 4 12 12 14 20M117 60c6 4 8 10 8 16M118 50c10 2 16 10 20 18"/>
    <ellipse class="il-skin il-ink" cx="55" cy="72" rx="22" ry="10"/>
    <path class="il-beard il-ink" d="M33 74c0 18 12 32 22 34 10-2 22-16 22-34-6 4-14 6-22 6s-16-2-22-6z"/>
    <path class="il-line il-thin" d="M46 88q2 6 0 12M64 88q-2 6 0 12"/>
    <circle class="il-dark" cx="47" cy="70" r="2.2"/><circle class="il-dark" cx="63" cy="70" r="2.2"/>
    <path class="il-line il-thin" d="M42 66l8-1M68 66l-8-1"/>
    <circle class="il-skin il-ink" cx="55" cy="76" r="4"/>
    <path class="il-dark" d="M47 82q8 6 16 0z"/>
    <path class="il-wood il-ink" d="M122 82a12 12 0 0 1 24 0z"/>
    <circle class="il-skin il-ink" cx="134" cy="88" r="10"/>
    <path class="il-beard il-ink" d="M125 92c0 10 4 16 9 18 5-2 9-8 9-18-4 2-6 3-9 3s-5-1-9-3z"/>
    <path class="il-line il-thin" d="M127 84l5 2M141 84l-5 2"/>
    <circle class="il-dark" cx="130" cy="88" r="1.5"/><circle class="il-dark" cx="138" cy="88" r="1.5"/>
    <path class="il-line il-thin" d="M131 94q3-2 6 0"/>
    <ellipse class="il-water il-ink il-thin" cx="122" cy="96" rx="1.6" ry="2.4"/>
    <ellipse class="il-water il-ink il-thin" cx="148" cy="100" rx="1.6" ry="2.4"/>
    <ellipse class="il-water il-ink il-thin" cx="134" cy="113" rx="16" ry="3"/>`,

  // A sheepish dwarf in a yellow hard hat with a tunnel sticker, in front of a completely collapsed tunnel.
  'kz.hard-hat': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 106h160v14H0z"/>
    <path class="il-dark il-ink" d="M106 108V60q20-16 40 0v48z"/>
    <path class="il-wood il-ink" d="M102 108V58h7v50zM143 108V58h7v50z"/>
    <path class="il-wood il-ink" d="M98 50l56 14-2 7-56-14z"/>
    <g class="il-stone il-ink il-thin">
      <ellipse cx="114" cy="100" rx="9" ry="7"/><ellipse cx="132" cy="102" rx="10" ry="7"/>
      <ellipse cx="124" cy="88" rx="9" ry="7"/><ellipse cx="140" cy="88" rx="7" ry="6"/>
      <ellipse cx="112" cy="84" rx="6" ry="5"/><ellipse cx="128" cy="74" rx="7" ry="6"/>
    </g>
    <path class="il-smoke" d="M100 46c-6-2-4-10 2-8 2-6 10-6 12 0 6-2 8 6 2 8z"/>
    <path class="il-skin il-ink" d="M34 66c0-8 8-12 22-12s22 4 22 12v4c0 12-10 18-22 18s-22-6-22-18z"/>
    <path class="il-beard il-ink" d="M34 72c2 22 12 38 22 46 10-8 20-24 22-46-6 6-14 8-22 8s-16-2-22-8z"/>
    <path class="il-line il-thin" d="M46 88q2 10 0 18M66 88q-2 10 0 18M56 90v22"/>
    <path class="il-yellow il-ink" d="M26 58a30 28 0 0 1 60 0z"/>
    <path class="il-line" d="M56 30v28"/>
    <rect class="il-yellow il-ink" x="18" y="56" width="76" height="7" rx="3.5"/>
    <circle class="il-white il-ink il-thin" cx="40" cy="45" r="8"/>
    <path class="il-dark" d="M35 49v-4a5 5 0 0 1 10 0v4z"/>
    <path class="il-green il-ink il-thin" d="M40 40l2 2 4-5"/>
    <path class="il-light il-thin" d="M64 38q6 2 10 10"/>
    <circle class="il-smoke" cx="70" cy="34" r="2.5"/><circle class="il-smoke" cx="76" cy="40" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="50" cy="69" r="3.5"/><circle class="il-white il-ink il-thin" cx="64" cy="69" r="3.5"/>
    <circle class="il-dark" cx="52" cy="69" r="1.6"/><circle class="il-dark" cx="66" cy="69" r="1.6"/>
    <circle class="il-skin il-ink" cx="57" cy="75" r="4"/>
    <path class="il-white il-ink il-thin" d="M48 80h18q-2 5-9 5t-9-5z"/>
    <ellipse class="il-water il-ink il-thin" cx="80" cy="70" rx="2" ry="3"/>`,

  // A dwarf proudly wearing a leather apron covered in soup stains, a ladle in the pocket and a fly circling.
  'kz.leather-apron': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-red il-ink" d="M44 44q-14 6-16 30l-2 30h12l4-30zM116 44q14 6 16 30l2 30h-12l-4-30z"/>
    <circle class="il-skin il-ink" cx="32" cy="108" r="6"/><circle class="il-skin il-ink" cx="128" cy="108" r="6"/>
    <path class="il-skin il-ink" d="M62 24c0-10 8-16 18-16s18 6 18 16v6c0 8-8 14-18 14s-18-6-18-14z"/>
    <path class="il-wood-dark il-ink" d="M60 18q20-16 40 0z"/>
    <circle class="il-dark" cx="73" cy="24" r="2"/><circle class="il-dark" cx="87" cy="24" r="2"/>
    <circle class="il-skin il-ink" cx="80" cy="29" r="3.5"/>
    <path class="il-beard il-ink" d="M62 32c2 10 8 16 18 18 10-2 16-8 18-18-6 4-12 5-18 5s-12-1-18-5z"/>
    <path class="il-pink il-ink il-thin" d="M84 36q4 4 0 6-4-2 0-6z"/>
    <path class="il-wood il-ink" d="M50 46h60l4 8q8 28 6 62H40q-2-34 6-62z"/>
    <path class="il-line il-thin il-dash" d="M46 58h68M44 112h72"/>
    <path class="il-line" d="M56 46l-6-12M104 46l6-12"/>
    <path class="il-earth-dark" d="M58 64c4-4 12-2 12 4s-6 6-8 4-8 0-4-8z"/>
    <path class="il-orange" d="M92 72c6-2 10 2 8 6s-8 4-10 0 0-6 2-6z"/>
    <circle class="il-orange" cx="104" cy="66" r="2"/><circle class="il-earth-dark" cx="54" cy="84" r="2.5"/>
    <circle class="il-green il-ink il-thin" cx="96" cy="100" r="3"/>
    <circle class="il-orange il-ink il-thin" cx="58" cy="104" r="3"/>
    <rect class="il-wood-dark il-ink" x="66" y="82" width="28" height="18" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M76 82V68h4v14z"/>
    <ellipse class="il-metal il-ink" cx="78" cy="66" rx="7" ry="4"/>
    <path class="il-line il-thin il-dash" d="M30 20q10-12 20 0t20-6"/>
    <circle class="il-dark" cx="26" cy="22" r="2.5"/>
    <ellipse class="il-white il-ink il-thin" cx="24" cy="18" rx="3" ry="2"/><ellipse class="il-white il-ink il-thin" cx="29" cy="18" rx="3" ry="2"/>`,

  // A gnome in a jangling shirt made of rows of bottle caps, burping happily next to a glass of lemonade.
  'kz.bottlecap-mail': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 108h160v12H0z"/>
    <path class="il-grey il-ink" d="M50 48h60l18 22-12 10-8-10v42H52V70l-8 10-12-10z"/>
    <g class="il-gold il-ink il-thin">
      <circle cx="60" cy="58" r="5"/><circle cx="82" cy="58" r="5"/><circle cx="104" cy="58" r="5"/>
      <circle cx="60" cy="80" r="5"/><circle cx="82" cy="80" r="5"/><circle cx="104" cy="80" r="5"/>
      <circle cx="60" cy="102" r="5"/><circle cx="82" cy="102" r="5"/><circle cx="104" cy="102" r="5"/>
      <circle cx="40" cy="72" r="4"/>
    </g>
    <g class="il-red il-ink il-thin">
      <circle cx="71" cy="69" r="5"/><circle cx="93" cy="69" r="5"/>
      <circle cx="71" cy="91" r="5"/><circle cx="93" cy="91" r="5"/><circle cx="120" cy="72" r="4"/>
    </g>
    <g class="il-metal il-ink il-thin">
      <circle cx="71" cy="58" r="4"/><circle cx="93" cy="58" r="4"/><circle cx="60" cy="69" r="4"/>
      <circle cx="82" cy="69" r="4"/><circle cx="104" cy="69" r="4"/><circle cx="82" cy="91" r="4"/>
      <circle cx="60" cy="91" r="4"/><circle cx="104" cy="91" r="4"/><circle cx="71" cy="80" r="4"/><circle cx="93" cy="80" r="4"/>
    </g>
    <g class="il-dark">
      <circle cx="60" cy="58" r="1.4"/><circle cx="82" cy="58" r="1.4"/><circle cx="104" cy="58" r="1.4"/><circle cx="71" cy="69" r="1.4"/>
      <circle cx="93" cy="69" r="1.4"/><circle cx="60" cy="80" r="1.4"/><circle cx="82" cy="80" r="1.4"/><circle cx="104" cy="80" r="1.4"/>
      <circle cx="71" cy="91" r="1.4"/><circle cx="93" cy="91" r="1.4"/><circle cx="60" cy="102" r="1.4"/><circle cx="82" cy="102" r="1.4"/>
      <circle cx="104" cy="102" r="1.4"/>
    </g>
    <path class="il-red il-ink" d="M64 30 80 0l16 30z"/>
    <ellipse class="il-skin il-ink" cx="80" cy="36" rx="16" ry="8"/>
    <path class="il-beard il-ink" d="M64 38c2 10 8 14 16 15 8-1 14-5 16-15-5 3-10 4-16 4s-11-1-16-4z"/>
    <path class="il-line il-thin" d="M72 33q3-3 6 0M82 33q3-3 6 0"/>
    <ellipse class="il-dark" cx="80" cy="43" rx="3" ry="2.5"/>
    <circle class="il-white il-ink il-thin" cx="98" cy="30" r="3"/><circle class="il-white il-ink il-thin" cx="104" cy="22" r="4"/>
    <circle class="il-white il-ink il-thin" cx="112" cy="12" r="5"/>
    <path class="il-white il-ink" d="M132 78h20l-3 30h-14z"/>
    <path class="il-yellow" d="M134 86h16l-2 21h-12z"/>
    <circle class="il-white" cx="140" cy="94" r="1.4"/><circle class="il-white" cx="144" cy="100" r="1.2"/>
    <path class="il-line" d="M146 80l6-14"/>
    <path class="il-yellow il-ink il-thin" d="M128 80a7 7 0 0 1 10-8z"/>`,

  // A ceramic garden gnome whose blue dungarees are still being painted on by a brush; one strap is missing.
  'kz.gnome-overalls': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <ellipse class="il-earth-dark" cx="68" cy="108" rx="30" ry="5"/>
    <path class="il-red il-ink" d="M48 40 66 2l18 38z"/>
    <path class="il-light il-thin" d="M62 14q-4 10-6 20"/>
    <ellipse class="il-skin il-ink" cx="66" cy="44" rx="18" ry="8"/>
    <path class="il-white il-ink" d="M44 58h44v46H44z"/>
    <path class="il-beard il-ink" d="M48 46c2 14 10 20 18 21 8-1 16-7 18-21-6 4-12 5-18 5s-12-1-18-5z"/>
    <path class="il-blue il-ink" d="M50 68h32v18h6v20H70v-12h-8v12H44V86h6z"/>
    <path class="il-blue il-ink" d="M50 70l-4-14h6l4 14z"/>
    <path class="il-white il-ink il-thin il-dash" d="M82 70l4-14h-6l-4 14z"/>
    <circle class="il-gold il-ink il-thin" cx="54" cy="72" r="2"/>
    <circle class="il-gold il-ink il-thin" cx="78" cy="72" r="2"/>
    <rect class="il-blue il-ink il-thin" x="58" y="74" width="16" height="10" rx="1"/>
    <path class="il-blue" d="M46 106v5a2 2 0 0 0 4 0v-5zM82 106v7a2 2 0 0 0 4 0v-7z"/>
    <path class="il-light il-thin" d="M48 92v10"/>
    <circle class="il-white il-ink il-thin" cx="60" cy="42" r="3"/><circle class="il-white il-ink il-thin" cx="72" cy="42" r="3"/>
    <circle class="il-dark" cx="62" cy="42" r="1.4"/><circle class="il-dark" cx="74" cy="42" r="1.4"/>
    <path class="il-line il-thin" d="M62 49q4-2 8 0"/>
    <g transform="rotate(-38 104 64)">
      <rect class="il-wood il-ink" x="100" y="60" width="26" height="8" rx="4"/>
      <circle class="il-wood-dark il-ink il-thin" cx="122" cy="64" r="1.6"/>
      <rect class="il-metal il-ink" x="90" y="56" width="11" height="16" rx="1"/>
      <path class="il-blue il-ink" d="M90 55h-10q-5 9 0 18h10z"/>
      <path class="il-line il-thin" d="M84 59h-4M84 64h-5M84 69h-4"/>
    </g>
    <path class="il-metal il-ink" d="M116 92h28v20h-28z"/>
    <ellipse class="il-blue il-ink" cx="130" cy="92" rx="14" ry="4"/>
    <path class="il-blue" d="M118 94v8a2 2 0 0 0 4 0v-8zM136 94v5a2 2 0 0 0 4 0v-5z"/>
    <path class="il-line il-thin" d="M118 92q12-14 24 0"/>`,

  // A blissful gnome in a compost cloak with peel, apple core and leaves stuck on; stink waves, flies, and a fleeing beetle.
  'kz.compost-cloak': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 108h160v12H0z"/>
    <path class="il-earth-dark il-ink" d="M36 112 58 50h44l22 62z"/>
    <path class="il-line il-thin" d="M60 70q-6 20-10 40M100 70q6 20 10 40M80 76v34"/>
    <path class="il-red il-ink" d="M62 42 80 4l18 38z"/>
    <ellipse class="il-skin il-ink" cx="80" cy="46" rx="18" ry="8"/>
    <path class="il-beard il-ink" d="M62 48c2 14 10 20 18 21 8-1 16-7 18-21-6 4-12 5-18 5s-12-1-18-5z"/>
    <path class="il-line il-thin" d="M70 44q3 2 6 0M84 44q3 2 6 0"/>
    <path class="il-line il-thin" d="M76 52q4 3 8 0"/>
    <path class="il-yellow il-ink il-thin" d="M50 80q6-6 10 2-4-2-6 4-2-2-4-6zM50 80q-4 6-2 12 2-6 4-8"/>
    <path class="il-white il-ink il-thin" d="M98 84h8l-2 6h-4zM100 84q2-4 4 0"/>
    <path class="il-earth il-ink il-thin" d="M104 84v-4"/>
    <path class="il-green il-ink il-thin" d="M66 98q6-8 12 0-6 6-12 0zM90 64q6-6 10 2-6 4-10-2zM48 102q4-8 10-4-4 6-10 4z"/>
    <path class="il-white il-ink il-thin" d="M86 96l6-4 4 6-6 2z"/>
    <path class="il-line il-thin" d="M30 54q-4-6 0-12t0-12M130 50q4-6 0-12t0-12M44 36q-4-6 0-12M118 32q4-6 0-12"/>
    <circle class="il-dark" cx="36" cy="22" r="2"/><ellipse class="il-white il-ink il-thin" cx="35" cy="18" rx="2.5" ry="1.6"/>
    <circle class="il-dark" cx="124" cy="14" r="2"/><ellipse class="il-white il-ink il-thin" cx="125" cy="10" rx="2.5" ry="1.6"/>
    <path class="il-line il-thin il-dash" d="M38 22q10 4 6-6"/>
    <ellipse class="il-dark il-ink il-thin" cx="142" cy="102" rx="8" ry="5"/>
    <circle class="il-dark il-ink il-thin" cx="150" cy="98" r="3.5"/>
    <path class="il-line il-thin" d="M136 106l-3 4M142 107v4M148 106l3 4M142 97v10"/>
    <path class="il-dark il-ink il-thin" d="M152 96l4-6"/>
    <path class="il-line il-thin" d="M126 98h-6M126 102h-8M126 106h-6"/>`,

  // A dwarf in a glowing hi-vis vest sprinting away into the night, beard flying, while two eyes watch from the dark.
  'kz.hi-vis-vest': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-dark il-ink il-thin" d="M0 78c6-14 22-14 28-4 6-8 18-6 18 6v26H0z"/>
    <circle class="il-glow" cx="16" cy="86" r="2.4"/><circle class="il-glow" cx="26" cy="86" r="2.4"/>
    <circle class="il-torch" cx="92" cy="66" r="40"/>
    <path class="il-line il-thin" d="M34 54h18M30 66h20M36 78h16"/>
    <path class="il-dark il-ink" d="M78 90l-14 8 4 6 18-8zM96 90l14-6 4 6-16 10z"/>
    <path class="il-wood-dark il-ink" d="M60 98l10-2 2 8-12 2zM110 82l8-4 4 8-8 4z"/>
    <path class="il-skin il-ink" d="M110 58l14-10 4 4-14 12zM74 60l-14 4 0 6 16-2z"/>
    <path class="il-orange il-ink" d="M72 52h40l4 42H70z"/>
    <path class="il-metal il-ink il-thin" d="M71 66h43v6H71zM70 80h45v6H70z"/>
    <path class="il-line il-thin" d="M92 52v42"/>
    <path class="il-skin il-ink" d="M78 34c0-8 6-14 14-14s14 6 14 14v4c0 8-6 12-14 12s-14-4-14-12z"/>
    <path class="il-yellow il-ink" d="M76 30a16 14 0 0 1 32 0z"/>
    <rect class="il-yellow il-ink" x="74" y="28" width="38" height="5" rx="2.5"/>
    <path class="il-beard il-ink" d="M80 40c-6 4-16 6-24 2 4 8 14 12 24 10 4 0 8-2 10-4z"/>
    <circle class="il-white il-ink il-thin" cx="96" cy="37" r="3.5"/><circle class="il-white il-ink il-thin" cx="104" cy="37" r="3.5"/>
    <circle class="il-dark" cx="98" cy="37" r="1.5"/><circle class="il-dark" cx="106" cy="37" r="1.5"/>
    <path class="il-dark" d="M96 45q6 4 10 0z"/>
    <ellipse class="il-water il-ink il-thin" cx="114" cy="26" rx="2" ry="3"/>
    <path class="il-light il-thin" d="M58 30l-6-6M122 20l6-6M130 58h8M124 98l6 4"/>`,

  // A huge leather boot with a shiny steel toe cap; a dizzy snail bounces off it, seeing stars.
  'kz.steel-toe-boots': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 108h160v12H0z"/>
    <path class="il-wood-dark il-thin" d="M0 112q10-6 20 0t20 0"/>
    <ellipse class="il-stone il-ink" cx="22" cy="104" rx="12" ry="6"/>
    <path class="il-line il-thin" d="M18 100l4 4-2 3"/>
    <path class="il-wood-dark il-ink" d="M44 22h38v50q0 6 8 8l30 6q16 4 16 16v4H44z"/>
    <rect class="il-wood il-ink" x="40" y="16" width="46" height="10" rx="4"/>
    <path class="il-metal il-ink" d="M100 82l20 4q16 4 16 16H100q-6-10 0-20z"/>
    <path class="il-light" d="M108 88q10 0 18 6"/>
    <circle class="il-grey il-ink il-thin" cx="104" cy="96" r="1.6"/><circle class="il-grey il-ink il-thin" cx="110" cy="88" r="1.6"/>
    <rect class="il-dark il-ink" x="40" y="102" width="100" height="8" rx="3"/>
    <path class="il-light il-thin" d="M50 106h6M64 106h6M78 106h6M92 106h6M106 106h6M120 106h6"/>
    <path class="il-line il-thin" d="M58 32l16 8M74 32l-16 8M58 44l16 8M74 44l-16 8M58 56l16 8M74 56l-16 8"/>
    <g class="il-metal il-ink il-thin">
      <circle cx="58" cy="32" r="1.8"/><circle cx="74" cy="32" r="1.8"/><circle cx="58" cy="44" r="1.8"/>
      <circle cx="74" cy="44" r="1.8"/><circle cx="58" cy="56" r="1.8"/><circle cx="74" cy="56" r="1.8"/>
    </g>
    <path class="il-line" d="M66 66q-8 6-4 10M66 66q8 6 4 10"/>
    <path class="il-line il-thin il-dash" d="M134 86q10-20 0-40"/>
    <path class="il-skin il-ink il-thin" d="M118 50q2-10 12-12l12-2q4 2 0 6l-12 4q-4 8-12 4z"/>
    <circle class="il-earth il-ink" cx="128" cy="38" r="9"/>
    <path class="il-line il-thin" d="M128 38a3 3 0 1 1 3 3 6 6 0 1 1-6-6"/>
    <path class="il-line il-thin" d="M144 38l4-6M142 42l6-2"/>
    <circle class="il-dark" cx="148" cy="32" r="1.4"/><circle class="il-dark" cx="149" cy="40" r="1.4"/>
    <path class="il-yellow il-ink il-thin" d="M118 24l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1zM146 18l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5z"/>`,

  // A tiny gnome sprinting in gigantic holey garden clogs, hat blown back, overtaking a stunned snail.
  'kz.garden-clogs': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M6 26h20M2 36h26M8 46h16"/>
    <path class="il-red il-ink il-thin" d="M68 58l-44 6 1 6 45-6zM84 58l10 22 6-2-10-22z"/>
    <path class="il-blue il-ink" d="M64 36h28v26H64z"/>
    <path class="il-line il-thin" d="M70 36v10M86 36v10"/>
    <circle class="il-skin il-ink" cx="80" cy="26" r="10"/>
    <path class="il-beard il-ink" d="M72 30c-2 8-8 12-14 12 4 4 12 4 18 0 4-2 6-6 6-10z"/>
    <path class="il-red il-ink" d="M72 20 42 8l28 2 18 4z"/>
    <circle class="il-dark" cx="84" cy="24" r="1.8"/><circle class="il-dark" cx="90" cy="24" r="1.8"/>
    <path class="il-dark" d="M84 31q4 3 8 0z"/>
    <g transform="translate(12 62) rotate(-14)">
      <path class="il-green il-ink" d="M0 24V12q0-6 6-8h10q8-6 20-6 20 0 24 18l2 8z"/>
      <rect class="il-dark il-ink" x="-2" y="22" width="66" height="6" rx="3"/>
      <circle class="il-dark" cx="34" cy="6" r="2"/><circle class="il-dark" cx="44" cy="5" r="2"/>
      <circle class="il-dark" cx="52" cy="10" r="2"/><circle class="il-dark" cx="40" cy="13" r="2"/><circle class="il-dark" cx="50" cy="17" r="2"/>
      <path class="il-line il-thick" d="M6 6q-10 6-2 16"/>
      <path class="il-light il-thin" d="M22 2q10-4 18-2"/>
    </g>
    <g transform="translate(86 76)">
      <path class="il-green il-ink" d="M0 24V12q0-6 6-8h10q8-6 20-6 20 0 24 18l2 8z"/>
      <rect class="il-dark il-ink" x="-2" y="22" width="66" height="6" rx="3"/>
      <circle class="il-dark" cx="34" cy="6" r="2"/><circle class="il-dark" cx="44" cy="5" r="2"/>
      <circle class="il-dark" cx="52" cy="10" r="2"/><circle class="il-dark" cx="40" cy="13" r="2"/><circle class="il-dark" cx="50" cy="17" r="2"/>
      <path class="il-line il-thick" d="M6 6q-10 6-2 16"/>
      <path class="il-light il-thin" d="M22 2q10-4 18-2"/>
    </g>
    <path class="il-line il-thin" d="M92 108l-4 4 4 4M84 108l-4 4 4 4M14 86l-4 4 4 4"/>
    <path class="il-grass il-ink il-thin" d="M10 90l-4-6 6 2zM4 100l-2-8 5 4z"/>
    <path class="il-skin il-ink il-thin" d="M36 114q0-6 6-6h18q6 0 6 6z"/>
    <circle class="il-earth il-ink il-thin" cx="46" cy="104" r="7"/>
    <path class="il-line il-thin" d="M46 104a2 2 0 1 1 2 2 4 4 0 1 1-4-4"/>
    <path class="il-line il-thin" d="M62 108l4-8M64 110l6-6"/>
    <circle class="il-white il-ink il-thin" cx="66" cy="99" r="2.2"/><circle class="il-white il-ink il-thin" cx="70" cy="103" r="2.2"/>
    <circle class="il-dark" cx="67" cy="99" r="1"/><circle class="il-dark" cx="71" cy="103" r="1"/>
    <path class="il-line il-thin" d="M74 96l4-3M76 101h5"/>`,

  // A gnome in pyjamas doing a gigantic stride in fluffy pink slippers, from the fence straight to Grandma's cottage.
  'kz.league-slippers': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 82h160v38H0z"/>
    <path class="il-wood il-ink il-thin" d="M134 82V70h18v12z"/>
    <path class="il-red il-ink il-thin" d="M131 71l12-9 12 9z"/>
    <path class="il-pink il-ink il-thin" d="M146 56c-2-2-5 0-3 3l3 3 3-3c2-3-1-5-3-3z"/>
    <path class="il-wood il-ink il-thin" d="M8 82V64l4-4 4 4v18zM24 82V64l4-4 4 4v18zM40 82V64l4-4 4 4v18zM4 68h48v5H4zM4 76h48v5H4z"/>
    <path class="il-line il-thin il-dash" d="M30 100q40-60 96-10"/>
    <path class="il-blue il-ink" d="M66 56l-36 38 8 6 36-36zM86 56l38 26 4-8-38-26z"/>
    <path class="il-light il-thin" d="M52 74l6 6M42 84l6 6M104 64l-4 8M114 70l-4 8"/>
    <path class="il-blue il-ink" d="M64 36h24l4 24H60z"/>
    <circle class="il-white il-ink il-thin" cx="76" cy="44" r="1.6"/><circle class="il-white il-ink il-thin" cx="76" cy="52" r="1.6"/>
    <path class="il-red il-ink" d="M64 22 40 4l8 18z"/>
    <circle class="il-white il-ink" cx="40" cy="5" r="4"/>
    <ellipse class="il-skin il-ink" cx="76" cy="24" rx="14" ry="8"/>
    <path class="il-beard il-ink" d="M62 26c2 10 8 14 14 14s12-4 14-14c-4 3-9 4-14 4s-10-1-14-4z"/>
    <circle class="il-dark" cx="72" cy="22" r="1.6"/><circle class="il-dark" cx="82" cy="22" r="1.6"/>
    <path class="il-line il-thin" d="M73 30q4 3 8 0"/>
    <path class="il-pink il-ink" d="M8 104q0-16 20-16h14q14 0 14 16z"/>
    <path class="il-white il-ink il-thin" d="M8 104h48v4H8z"/>
    <path class="il-line il-thin" d="M30 92v6M38 92v6"/>
    <circle class="il-white il-ink" cx="50" cy="92" r="6"/>
    <g transform="rotate(10 132 80)">
      <path class="il-pink il-ink" d="M108 86q0-16 20-16h14q14 0 14 16z"/>
      <path class="il-white il-ink il-thin" d="M108 86h48v4h-48z"/>
      <path class="il-line il-thin" d="M130 74v6M138 74v6"/>
      <circle class="il-white il-ink" cx="150" cy="74" r="6"/>
    </g>
    <path class="il-line il-thin" d="M108 92l-8 2M110 98l-10 4"/>
    <ellipse class="il-earth-dark" cx="30" cy="112" rx="8" ry="2"/><ellipse class="il-earth-dark" cx="62" cy="112" rx="8" ry="2"/>`,

  // A yellow welly stomps down; the terrified puddle below has big eyes and tiny droplets are running away.
  'kz.rubber-boots': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <ellipse class="il-water il-ink" cx="98" cy="106" rx="50" ry="11"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="104" r="4"/><circle class="il-white il-ink il-thin" cx="106" cy="104" r="4"/>
    <circle class="il-dark" cx="90" cy="102" r="1.8"/><circle class="il-dark" cx="106" cy="102" r="1.8"/>
    <path class="il-line il-thin" d="M84 98l4 2M112 98l-4 2"/>
    <ellipse class="il-dark" cx="98" cy="112" rx="4" ry="2.5"/>
    <g transform="translate(16 30) scale(0.85)">
      <path class="il-yellow il-ink" d="M0 0h28v46q0 4 4 5l14 3q10 2 10 12v4H0z"/>
      <rect class="il-yellow il-ink" x="-3" y="-6" width="34" height="9" rx="4"/>
      <rect class="il-dark il-ink" x="-2" y="68" width="60" height="7" rx="3"/>
      <path class="il-light il-thin" d="M6 10v28"/>
    </g>
    <g transform="translate(80 4) rotate(-6) scale(0.85)">
      <path class="il-yellow il-ink" d="M0 0h28v46q0 4 4 5l14 3q10 2 10 12v4H0z"/>
      <rect class="il-yellow il-ink" x="-3" y="-6" width="34" height="9" rx="4"/>
      <rect class="il-dark il-ink" x="-2" y="68" width="60" height="7" rx="3"/>
      <path class="il-light il-thin" d="M6 10v28"/>
    </g>
    <path class="il-line il-thin" d="M80 72v8M96 74v8M126 74v8"/>
    <ellipse class="il-water il-ink il-thin" cx="146" cy="96" rx="3" ry="4"/>
    <ellipse class="il-water il-ink il-thin" cx="154" cy="104" rx="2.5" ry="3.5"/>
    <path class="il-line il-thin" d="M144 100l-2 4M148 100l2 4M153 107l-2 3M156 107l1 3"/>
    <path class="il-line il-thin" d="M140 94h-4M138 98h-4"/>
    <ellipse class="il-water il-ink il-thin" cx="58" cy="100" rx="2" ry="3"/>`,

  // Grandad's pickaxe: a handle of three mismatched taped pieces and a patched, riveted head; Grandad smiles from a frame.
  'kz.pickaxe': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 110h160v10H0z"/>
    <ellipse class="il-gold il-ink" cx="26" cy="52" rx="18" ry="22"/>
    <ellipse class="il-sky il-ink il-thin" cx="26" cy="52" rx="13" ry="17"/>
    <path class="il-line il-thin" d="M26 30V20M20 22h12"/>
    <path class="il-skin il-ink il-thin" d="M18 48a8 8 0 0 1 16 0v4a8 8 0 0 1-16 0z"/>
    <path class="il-yellow il-ink il-thin" d="M17 46a9 8 0 0 1 18 0z"/>
    <path class="il-beard il-ink il-thin" d="M18 52c0 10 4 14 8 16 4-2 8-6 8-16-3 2-5 3-8 3s-5-1-8-3z"/>
    <path class="il-line il-thin" d="M21 50q2-2 3 0M28 50l3 0"/>
    <path class="il-dark" d="M23 56q3 2 6 0z"/>
    <g transform="translate(40 108) rotate(-48.9)">
      <rect class="il-wood-dark il-ink" x="0" y="-5" width="38" height="10" rx="3"/>
      <rect class="il-wood il-ink" x="36" y="-5" width="34" height="10"/>
      <rect class="il-earth il-ink" x="68" y="-5" width="34" height="10"/>
      <rect class="il-white il-ink il-thin" x="33" y="-6" width="7" height="12" rx="1"/>
      <rect class="il-white il-ink il-thin" x="66" y="-6" width="7" height="12" rx="1"/>
      <path class="il-line il-thin" d="M34 -4l5 8M67 -4l5 8M10 -2h16M46 2h14M80 -2h14"/>
      <path class="il-metal il-ink" d="M92 -50Q118 -20 118 0Q118 20 92 50Q106 20 106 0Q106 -20 92 -50z"/>
      <path class="il-grey il-ink il-thin" d="M92 -50Q104 -38 110 -24L106 -20Q100 -36 92 -50z"/>
      <path class="il-stone il-ink il-thin" d="M106 14L112 20Q104 36 92 50Q102 34 106 14z"/>
      <path class="il-line il-thin" d="M107 -22l4 -2M106 10l5 2"/>
      <rect class="il-grey il-ink" x="100" y="-9" width="16" height="18" rx="2"/>
      <circle class="il-dark" cx="104" cy="-5" r="1.4"/><circle class="il-dark" cx="112" cy="-5" r="1.4"/>
      <circle class="il-dark" cx="104" cy="5" r="1.4"/><circle class="il-dark" cx="112" cy="5" r="1.4"/>
      <path class="il-light il-thin" d="M112 -16q2 6 2 10"/>
    </g>
    <path class="il-glow" d="M140 90l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/>
    <ellipse class="il-stone il-ink il-thin" cx="126" cy="110" rx="9" ry="4"/>`,

  // A dwarf steps on a rake and the handle smacks him in the face, stars circling; a gnome giggles behind a bush.
  'kz.rake-of-reckoning': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-green il-ink" d="M126 100c-8 0-10-12-2-14 0-10 12-12 16-6 6-6 16-2 14 6 8 2 6 14-2 14z"/>
    <path class="il-red il-ink il-thin" d="M134 78l6-16 6 16z"/>
    <circle class="il-dark" cx="137" cy="84" r="1.4"/><circle class="il-dark" cx="143" cy="84" r="1.4"/>
    <path class="il-line il-thin" d="M135 88q5 4 10 0"/>
    <path class="il-dark il-ink" d="M44 70l-8 30h10l6-26zM62 72l26 22 6-6-24-20z"/>
    <path class="il-wood-dark il-ink" d="M30 98h18v6H30zM86 92l12 4-2 6-14-4z"/>
    <path class="il-metal il-ink" d="M80 102h44v4H80z"/>
    <path class="il-metal il-ink il-thin" d="M84 102v-6M92 102v-6M100 102v-6M108 102v-6M116 102v-6M122 102v-6"/>
    <path class="il-wood il-ink" d="M98 100 66 42l6-4 32 60z"/>
    <path class="il-red il-ink" d="M38 46h28l4 30H36z"/>
    <path class="il-skin il-ink" d="M38 50l-14-6-2 6 14 8zM66 50l10-6 2 6-10 8z"/>
    <path class="il-skin il-ink" d="M38 28c0-10 8-16 16-16s16 6 16 16v4c0 8-6 14-16 14s-16-6-16-14z"/>
    <path class="il-beard il-ink" d="M38 34c2 14 8 22 16 24 8-2 14-10 16-24-5 4-10 5-16 5s-11-1-16-5z"/>
    <path class="il-wood-dark il-ink" d="M36 20q18-16 36 0z"/>
    <path class="il-line il-thin" d="M44 26l4 4M48 26l-4 4M58 26l4 4M62 26l-4 4"/>
    <circle class="il-red il-ink il-thin" cx="56" cy="35" r="4"/>
    <path class="il-white il-ink il-thin" d="M50 42q6-4 10 0z"/>
    <path class="il-line il-thin" d="M72 32l6-2M74 38l7 1M70 26l5-5"/>
    <path class="il-yellow il-ink il-thin" d="M30 10l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1zM56 0l1.6 3 3.4.6-2.4 2.4.6 3.4-3.2-1.6-3.2 1.6.6-3.4-2.4-2.4 3.4-.6zM80 10l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/>`,

  // Stern garden shears snap at a nervous, sweating hedge; a gnome's hat sticks guiltily out of the hedge top.
  'kz.garden-shears': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <path class="il-red il-ink" d="M136 32l6-16 6 16z"/>
    <path class="il-green il-ink" d="M102 104V44q4-10 10-6 4-10 12-4 6-10 14-2 6-8 12 0 6-2 10 6v66z"/>
    <path class="il-line il-thin" d="M110 52q3 3 6 0M136 46q3 3 6 0M146 84q3 3 6 0M112 92q3 3 6 0M128 96q3 3 6 0M150 60q3 3 6 0"/>
    <circle class="il-white il-ink il-thin" cx="122" cy="62" r="5"/><circle class="il-white il-ink il-thin" cx="140" cy="62" r="5"/>
    <circle class="il-dark" cx="119" cy="63" r="2"/><circle class="il-dark" cx="137" cy="63" r="2"/>
    <path class="il-line il-thin" d="M116 54l8 2M146 54l-8 2"/>
    <rect class="il-white il-ink il-thin" x="120" y="74" width="22" height="8" rx="2"/>
    <path class="il-line il-thin" d="M125 74v8M131 74v8M137 74v8M120 78h22"/>
    <ellipse class="il-water il-ink il-thin" cx="150" cy="50" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="112" cy="70" rx="2" ry="3"/>
    <path class="il-red il-ink" d="M58 56 16 26q-8-2-8 6 0 6 6 8l40 24z"/>
    <path class="il-red il-ink" d="M58 66 16 92q-8 2-8-6 0-6 6-8l40-22z"/>
    <path class="il-wood il-ink il-thin" d="M40 46l-10-8M40 74l-10 8"/>
    <path class="il-metal il-ink" d="M56 56l46-22q8-2 6 6l-46 30z"/>
    <path class="il-metal il-ink" d="M56 68l48 20q6 0 4-6l-46-28z"/>
    <path class="il-light il-thin" d="M66 54l30-14M68 70l30 12"/>
    <circle class="il-metal il-ink" cx="60" cy="61" r="6"/><circle class="il-dark" cx="60" cy="61" r="2"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="50" r="3.5"/><circle class="il-dark" cx="82" cy="51" r="1.5"/>
    <path class="il-line il-thin" d="M75 44l8 2"/>
    <circle class="il-white il-ink il-thin" cx="82" cy="73" r="3.5"/><circle class="il-dark" cx="84" cy="73" r="1.5"/>
    <path class="il-line il-thin" d="M77 66l8 3"/>
    <path class="il-green il-ink il-thin" d="M96 22q4-6 8 0-4 4-8 0zM86 96q4-6 8 0-4 4-8 0zM98 110q4-6 8 0-4 4-8 0z"/>
    <path class="il-line il-thin" d="M104 30l4-4M108 34l6-2M106 92l6 2"/>`
};
