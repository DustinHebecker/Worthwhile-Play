/* Kampfzwerge illustrations: items2. */
export const ITEMS2: Readonly<Record<string, string>> = {
  // A big trusty shovel serving a steaming bowl's worth of soup on its blade; below, a slime squashed flat as a pancake.
  'kz.shovel': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 98h160v22H0z"/>
    <path class="il-grass il-ink il-thin" d="M120 98l3-8 2 8M140 98l2-7 3 7M96 98l2-6 3 6"/>
    <path class="il-slime il-ink" d="M8 106c4-6 14-5 20-6s14-4 22-1 12 2 18 6c-4 5-12 4-20 6s-18 2-26 0-14-1-14-5z"/>
    <path class="il-line il-thin" d="M26 101l4 3M30 101l-4 3M44 101l4 3M48 101l-4 3"/>
    <path class="il-line il-thin" d="M32 106q5 2 10 0"/>
    <circle class="il-slime il-ink il-thin" cx="6" cy="96" r="2"/><circle class="il-slime il-ink il-thin" cx="76" cy="98" r="1.8"/>
    <path class="il-line il-thin" d="M14 92l-3-4M60 92l3-4M37 90v-5"/>
    <g transform="translate(16 36) rotate(16)">
      <path class="il-wood il-ink" d="M-6-11h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H-6a5 5 0 0 1-5-5V-6a5 5 0 0 1 5-5z"/>
      <rect class="il-sky il-ink il-thin" x="-4" y="-5" width="13" height="10" rx="3"/>
      <rect class="il-wood il-ink" x="16" y="-4" width="66" height="8" rx="2"/>
      <path class="il-line il-thin" d="M24 0h18M50-1h16"/>
      <rect class="il-metal il-ink" x="80" y="-7" width="11" height="14" rx="2"/>
      <path class="il-metal il-ink" d="M89-19h34q22 19 0 38H89z"/>
      <path class="il-light il-thin" d="M93-15h28"/>
      <ellipse class="il-orange il-ink il-thin" cx="108" cy="1" rx="15" ry="11"/>
      <circle class="il-yellow il-ink il-thin" cx="103" cy="-2" r="2.4"/>
      <circle class="il-yellow il-ink il-thin" cx="112" cy="5" r="2"/>
      <circle class="il-green" cx="113" cy="-4" r="1.6"/><circle class="il-green" cx="101" cy="5" r="1.4"/>
    </g>
    <path class="il-light" d="M110 54c-4-6 4-8 0-14M118 52c-4-6 4-8 0-14M126 56c-4-6 4-8 0-14"/>`,

  // A gleaming golden hammer with a smug, eyes-closed face has driven a dizzy nail perfectly flush into a plank.
  'kz.golden-hammer': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="6" y="94" width="148" height="18" rx="2"/>
    <path class="il-line il-thin" d="M14 102h30M60 106h40M112 101h34"/>
    <rect class="il-metal il-ink" x="120" y="91" width="18" height="4" rx="1"/>
    <path class="il-line il-thin" d="M116 90l-6-4M142 90l6-4M146 96h6M114 96h-6"/>
    <path class="il-yellow il-ink il-thin" d="M150 76l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4zM118 76l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z"/>
    <g transform="translate(100 60) rotate(40)">
      <rect class="il-wood-dark il-ink" x="-6" y="8" width="12" height="62" rx="5"/>
      <path class="il-line il-thin" d="M0 26v14M-1 48v10"/>
      <rect class="il-gold il-ink il-thin" x="-7.5" y="11" width="15" height="6" rx="2"/>
      <rect class="il-gold il-ink il-thin" x="-7.5" y="60" width="15" height="6" rx="2"/>
      <circle class="il-red il-ink il-thin" cx="0" cy="44" r="3"/>
      <rect class="il-gold il-ink" x="-28" y="-12" width="56" height="22" rx="4"/>
      <rect class="il-gold il-ink" x="-33" y="-15" width="9" height="28" rx="2"/>
      <rect class="il-gold il-ink" x="24" y="-15" width="9" height="28" rx="2"/>
      <path class="il-light il-thin" d="M-20-7h26M-30-11v12"/>
      <path class="il-line il-thin" d="M-14-1q3 3 6 0M2-1q3 3 6 0M-8 5q5 3 10 0M-15-2l-2-2M9-2l2-2"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M140 22l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z"/>
    <path class="il-white il-ink il-thin" d="M56 18l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z"/>
    <path class="il-yellow il-ink il-thin" d="M30 50l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z"/>`,

  // A gnome dangles a glowing lantern from a long stick: a ghost flees in panic while moths in party hats dance around it.
  'kz.lantern-stick': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="20" cy="14" r="1.2"/><circle class="il-white" cx="148" cy="10" r="1.2"/><circle class="il-white" cx="110" cy="20" r="1"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <circle class="il-torch" cx="62" cy="54" r="30"/>
    <path class="il-wood il-ink il-thin" d="M118 94Q100 52 62 30l2-3Q104 48 122 92z"/>
    <path class="il-line il-thin" d="M62 30v10"/>
    <path class="il-metal il-ink il-thin" d="M54 44h16l-3-5H57z"/>
    <rect class="il-glow il-ink" x="55" y="44" width="14" height="19" rx="2"/>
    <path class="il-line il-thin" d="M62 44v19"/>
    <rect class="il-metal il-ink il-thin" x="53" y="62" width="18" height="4" rx="1"/>
    <g>
      <path class="il-red il-ink" d="M122 66 134 32l13 34z"/>
      <rect class="il-skin il-ink" x="123" y="66" width="23" height="12"/>
      <path class="il-beard il-ink" d="M123 74c2 14 21 14 23 0z"/>
      <rect class="il-blue il-ink" x="121" y="84" width="27" height="18"/>
      <circle class="il-dark" cx="130" cy="71" r="1.7"/><circle class="il-dark" cx="139" cy="71" r="1.7"/>
      <path class="il-line il-thin" d="M127 68l5-1M142 68l-5-1"/>
      <circle class="il-skin il-ink il-thin" cx="120" cy="92" r="4"/>
    </g>
    <g class="il-smoke il-ink il-thin">
      <ellipse cx="38" cy="38" rx="4" ry="3" transform="rotate(-30 38 38)"/><ellipse cx="45" cy="38" rx="4" ry="3" transform="rotate(30 45 38)"/>
      <ellipse cx="82" cy="30" rx="4" ry="3" transform="rotate(-30 82 30)"/><ellipse cx="89" cy="30" rx="4" ry="3" transform="rotate(30 89 30)"/>
      <ellipse cx="76" cy="74" rx="4" ry="3" transform="rotate(-30 76 74)"/><ellipse cx="83" cy="74" rx="4" ry="3" transform="rotate(30 83 74)"/>
    </g>
    <path class="il-line" d="M41.5 36v6M85.5 28v6M79.5 72v6"/>
    <path class="il-pink il-ink il-thin" d="M39 35l2.5-7 2.5 7z"/><path class="il-yellow il-ink il-thin" d="M83 27l2.5-7 2.5 7z"/><path class="il-teal il-ink il-thin" d="M77 71l2.5-7 2.5 7z"/>
    <circle class="il-pink" cx="50" cy="28" r="1.3"/><circle class="il-yellow" cx="76" cy="22" r="1.3"/><circle class="il-teal" cx="90" cy="60" r="1.3"/><circle class="il-yellow" cx="44" cy="70" r="1.3"/>
    <path class="il-white il-ink" d="M4 86c0-14 6-22 14-22s14 8 14 20v10l-4-3-3 3-4-3-3 3-4-3-3 3-4-3-3 3z"/>
    <circle class="il-dark" cx="12" cy="76" r="2"/><circle class="il-dark" cx="20" cy="76" r="2"/>
    <ellipse class="il-dark" cx="16" cy="84" rx="2.4" ry="3"/>
    <path class="il-light il-thin" d="M36 72h8M36 78h10M36 84h7"/>
    <ellipse class="il-water il-ink il-thin" cx="28" cy="66" rx="1.8" ry="2.6"/>`,

  // A menacing frosted watering can with angry eyes takes aim: ice cubes rain on a small dwarf inside a crosshair.
  'kz.doom-watering-can': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-smoke il-ink il-thin" d="M98 18c-6 0-8-8-2-10 0-6 10-8 12-2 6-4 14 0 12 6 6 2 4 8-2 8z"/>
    <g transform="rotate(-16 100 80)">
      <path class="il-metal il-ink" d="M114 54C118 26 156 34 136 86l-6-3C146 44 124 36 121 54z"/>
      <polygon class="il-metal il-ink" points="82,90 46,62 50,56 84,78"/>
      <ellipse class="il-metal il-ink" cx="46" cy="58" rx="5" ry="11" transform="rotate(-36 46 58)"/>
      <circle class="il-dark" cx="44" cy="55" r="0.9"/><circle class="il-dark" cx="47" cy="59" r="0.9"/><circle class="il-dark" cx="42" cy="60" r="0.9"/>
      <path class="il-grey il-ink" d="M80 54h52l4 46H76z"/>
      <rect class="il-metal il-ink" x="78" y="50" width="56" height="8" rx="3"/>
      <ellipse class="il-dark il-ink il-thin" cx="96" cy="50" rx="10" ry="3"/>
      <rect class="il-metal il-ink" x="75" y="94" width="62" height="7" rx="3"/>
      <path class="il-light il-thin" d="M84 62l-2 28"/>
      <circle class="il-white il-ink" cx="98" cy="74" r="5"/><circle class="il-white il-ink" cx="114" cy="74" r="5"/>
      <circle class="il-dark" cx="99" cy="75" r="2.2"/><circle class="il-dark" cx="113" cy="75" r="2.2"/>
      <path class="il-line" d="M92 65l10 5M120 65l-10 5"/>
      <path class="il-line" d="M99 88q7-5 14 0"/>
      <path class="il-light il-thin" d="M124 62l4 4M128 62l-4 4M126 61v6M124 82l3 3M127 82l-3 3"/>
    </g>
    <path class="il-water-line" d="M36 62c-8 8-10 16-10 24M40 66c-4 6-6 12-6 18M32 60c-8 6-14 14-16 24"/>
    <rect class="il-white il-ink il-thin" x="26" y="68" width="5" height="5" rx="1" transform="rotate(20 28 70)"/>
    <rect class="il-white il-ink il-thin" x="16" y="74" width="5" height="5" rx="1" transform="rotate(-15 18 76)"/>
    <circle class="il-line il-thin il-dash" cx="24" cy="94" r="15"/>
    <path class="il-line il-thin" d="M24 76v8M24 104v8M6 94h8M34 94h8"/>
    <path class="il-skin il-ink il-thin" d="M17 94h14v6H17z"/>
    <path class="il-yellow il-ink il-thin" d="M15 94c0-7 4-10 9-10s9 3 9 10z"/>
    <path class="il-beard il-ink il-thin" d="M17 99c2 7 12 7 14 0z"/>
    <circle class="il-dark" cx="21" cy="97" r="1.1"/><circle class="il-dark" cx="27" cy="97" r="1.1"/>
    <rect class="il-blue il-ink il-thin" x="17" y="104" width="14" height="5"/>
    <ellipse class="il-water il-ink il-thin" cx="36" cy="90" rx="1.6" ry="2.4"/>`,

  // A wooden slingshot has just fired: the pebble zooms at a show-off bird in sunglasses fanning its fancy tail.
  'kz.slingshot': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-line il-thin il-dash" d="M56 44Q72 26 96 30"/>
    <path class="il-line il-thin" d="M84 34h-8M86 30h-10M84 26h-6"/>
    <circle class="il-stone il-ink" cx="100" cy="30" r="5"/>
    <path class="il-pink il-ink il-thin" d="M140 34c10-14 18-12 18-4-4 4-10 6-18 4z"/>
    <path class="il-yellow il-ink il-thin" d="M140 36c14-6 18 2 14 8-6 0-10-2-14-8z"/>
    <path class="il-teal il-ink il-thin" d="M140 30c6-16 14-18 16-10-2 6-8 8-16 10z"/>
    <ellipse class="il-blue il-ink" cx="130" cy="36" rx="14" ry="11"/>
    <path class="il-blue il-ink" d="M128 30c-6-16 2-24 10-22-2 8-4 14-10 22z"/>
    <path class="il-orange il-ink il-thin" d="M116 34l-8 3 8 3z"/>
    <rect class="il-dark" x="117" y="29" width="7" height="5" rx="1.5"/><rect class="il-dark" x="125" y="29" width="7" height="5" rx="1.5"/>
    <path class="il-line il-thin" d="M124 31h1M120 26l4 1M128 26l4 1"/>
    <path class="il-line il-thin" d="M126 47v6M134 47v6"/>
    <path class="il-white il-ink il-thin" d="M110 10h4l-1 10h-2z"/><circle class="il-white il-ink il-thin" cx="112" cy="24" r="1.6"/>
    <path class="il-wood il-ink" d="M46 88C40 72 28 60 28 42h11c0 12 9 22 13 30 4-8 13-18 13-30h11c0 18-12 30-18 46z"/>
    <path class="il-line il-thin" d="M33 50l2 6M70 50l-2 6"/>
    <rect class="il-wood-dark il-ink" x="45" y="86" width="13" height="24" rx="3"/>
    <rect class="il-red il-ink il-thin" x="44" y="90" width="15" height="4" rx="1"/>
    <rect class="il-red il-ink il-thin" x="44" y="98" width="15" height="4" rx="1"/>
    <path class="il-line" d="M33 44Q52 52 71 44"/>
    <rect class="il-earth-dark il-ink il-thin" x="47" y="46" width="10" height="6" rx="2"/>`,

  // A gnome sprints behind a rock-loaded wheelbarrow with an iron-capped ram beam that bursts through a fence.
  'kz.wheelbarrow-ram': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-wood il-ink" d="M136 34h20v66h-20z"/>
    <path class="il-wood il-ink" d="M144 30l6-4 6 4v4h-12z"/>
    <path class="il-line il-thin" d="M138 60l6 4-4 6 8 2M140 50l4 4M146 78l6-2"/>
    <path class="il-wood il-ink il-thin" d="M130 54l-6-4 2 6zM130 72l-8 2 6 3z"/>
    <path class="il-yellow il-ink il-thin" d="M132 58l3-6 2 6 6-2-4 5 5 4-6 0 1 6-4-5-4 4 0-6-6 0 5-3z"/>
    <path class="il-light il-thin" d="M2 56h10M0 66h14M4 76h10"/>
    <ellipse class="il-stone il-ink" cx="72" cy="56" rx="10" ry="8"/>
    <ellipse class="il-stone il-ink" cx="90" cy="54" rx="11" ry="9"/>
    <ellipse class="il-stone il-ink" cx="104" cy="58" rx="8" ry="6"/>
    <ellipse class="il-stone il-ink" cx="82" cy="46" rx="8" ry="6"/>
    <path class="il-red il-ink" d="M56 58h58l-8 26H64z"/>
    <path class="il-line il-thin" d="M62 64h48M64 72h42"/>
    <rect class="il-wood-dark il-ink" x="112" y="58" width="16" height="10" rx="2"/>
    <rect class="il-metal il-ink" x="125" y="55" width="8" height="16" rx="2"/>
    <path class="il-line" d="M66 84l42 6M70 84l-4 14"/>
    <circle class="il-dark il-ink" cx="108" cy="90" r="10"/><circle class="il-metal" cx="108" cy="90" r="3"/>
    <polygon class="il-wood il-ink" points="58,62 30,70 31,74 58,67"/>
    <g transform="rotate(16 24 74)">
      <path class="il-red il-ink" d="M10 56l12-34 12 34z"/>
      <rect class="il-skin il-ink" x="11" y="56" width="22" height="11"/>
      <path class="il-beard il-ink" d="M11 63c2 13 20 13 22 0z"/>
      <circle class="il-dark" cx="19" cy="60" r="1.6"/><circle class="il-dark" cx="27" cy="60" r="1.6"/>
      <path class="il-line il-thin" d="M16 57l5 1M31 57l-5 1"/>
      <rect class="il-green il-ink" x="9" y="72" width="26" height="18"/>
    </g>
    <circle class="il-skin il-ink il-thin" cx="31" cy="72" r="3.5"/>
    <path class="il-blue il-ink il-thin" d="M10 90l-8 10h7l6-8zM22 92l6 8h7l-7-10z"/>
    <ellipse class="il-water il-ink il-thin" cx="4" cy="44" rx="1.6" ry="2.4"/>`,

  // A fishing rod promoted to a spear: reel still attached, a medal and rank chevrons on it, an old boot on the line;
  // a gnome salutes it.
  'kz.gnome-spear': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <g transform="translate(26 104) rotate(-58)">
      <rect class="il-wood-dark il-ink" x="0" y="-4" width="20" height="8" rx="2"/>
      <path class="il-wood il-ink" d="M20-3L88-1.6v3.2L20 3z"/>
      <circle class="il-metal il-ink il-thin" cx="40" cy="-4" r="1.6"/><circle class="il-metal il-ink il-thin" cx="62" cy="-3" r="1.4"/>
      <path class="il-yellow il-ink il-thin" d="M46-3l4 3-4 3h3l4-3-4-3zM52-3l4 3-4 3h3l4-3-4-3z"/>
      <path class="il-metal il-ink" d="M86-7L114 0 86 7q-4-7 0-14z"/>
      <path class="il-light il-thin" d="M90-3l16 3"/>
      <path class="il-line il-thin" d="M84-3v6"/>
    </g>
    <circle class="il-metal il-ink" cx="30" cy="90" r="6"/><circle class="il-dark" cx="30" cy="90" r="1.6"/>
    <path class="il-line il-thin" d="M34 94l4 4"/>
    <path class="il-line il-thin" d="M88 10Q96 14 96 40"/>
    <path class="il-line il-thin" d="M96 40q0 4-3 4"/>
    <path class="il-wood-dark il-ink il-thin" d="M90 44h8v8h6v5H90z"/>
    <path class="il-red il-ink il-thin" d="M54 58l-4 10h4l2-6z"/><path class="il-blue il-ink il-thin" d="M55 58l4 10h-4l-2-6z"/>
    <circle class="il-gold il-ink il-thin" cx="54.5" cy="72" r="4.5"/>
    <path class="il-yellow" d="M54.5 69l1 2 2.4.4-1.7 1.6.4 2.4-2.1-1.1-2.1 1.1.4-2.4-1.7-1.6 2.4-.4z"/>
    <g>
      <path class="il-red il-ink" d="M114 66l14-36 14 36z"/>
      <rect class="il-skin il-ink" x="116" y="66" width="24" height="12"/>
      <path class="il-beard il-ink" d="M116 74c2 14 22 14 24 0z"/>
      <rect class="il-green il-ink" x="114" y="84" width="28" height="20"/>
      <circle class="il-dark" cx="124" cy="71" r="1.7"/><circle class="il-dark" cx="132" cy="71" r="1.7"/>
      <path class="il-line il-thin" d="M120 68l5 1M136 68l-5 1M125 76h6"/>
      <path class="il-green il-ink il-thin" d="M137 88l5-18 5 1-4 18z"/>
      <circle class="il-skin il-ink il-thin" cx="144" cy="68" r="4"/>
    </g>`,

  // A curved pruning saw bites into a branch; sawdust falls and the beetle on the branch clutches its head, fuming.
  'kz.pruning-saw': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-wood-dark il-ink" d="M0 0h20v106H0z"/>
    <path class="il-line il-thin" d="M6 20v14M12 50v18M6 80v14"/>
    <path class="il-wood il-ink" d="M18 44h104q8 6 0 12H18z"/>
    <path class="il-line il-thin" d="M30 50h16M60 49h12M100 51h12"/>
    <path class="il-green il-ink" d="M118 50c-6-14 10-22 18-12 12-6 22 6 14 14 8 10-6 20-14 12-10 6-22-2-18-14z"/>
    <path class="il-line il-thin" d="M126 50l10 2M134 46l4 6"/>
    <path class="il-dark" d="M86 44l4 6 4-6z"/>
    <path class="il-metal il-ink" d="M74 28Q100 52 120 92l9-5Q108 46 80 22z"/>
    <path class="il-line il-thin" d="M76 31l1-3 2 3 1-3 2 4 1-3 2 4 1-3 2 4 1-3 2 4 1-3 2 5 1-3 2 5 1-3 2 5 1-3 2 5 1-3 2 5 1-3 2 5 1-3 1 5"/>
    <path class="il-light il-thin" d="M84 28q18 18 32 46"/>
    <path class="il-wood-dark il-ink" d="M116 88l14-8 18 18q4 6-2 10l-8 4q-6 2-10-4z"/>
    <ellipse class="il-sky il-ink il-thin" cx="134" cy="96" rx="5" ry="3" transform="rotate(40 134 96)"/>
    <circle class="il-wood" cx="88" cy="62" r="1.5"/><circle class="il-wood" cx="92" cy="70" r="1.3"/><circle class="il-wood" cx="86" cy="78" r="1.5"/><circle class="il-wood" cx="94" cy="88" r="1.2"/><circle class="il-wood" cx="90" cy="98" r="1.4"/>
    <path class="il-line il-thin" d="M40 44l-4 4M48 44l2 5M56 44l4 4"/>
    <ellipse class="il-teal il-ink" cx="48" cy="36" rx="12" ry="9"/>
    <path class="il-line il-thin" d="M48 27v18"/>
    <circle class="il-dark il-ink" cx="60" cy="30" r="6"/>
    <path class="il-line il-thin" d="M62 24l4-6M58 24l-2-7"/>
    <circle class="il-white" cx="59" cy="29" r="1.5"/><circle class="il-white" cx="63" cy="29" r="1.5"/>
    <path class="il-line il-thin" d="M54 24l6 3M66 24l-4 3"/>
    <path class="il-red il-thin il-ink" d="M66 12q2 3 0 4M70 12q-2 3 0 4M67 10q3 2 4 0M67 18q3-2 4 0"/>
    <path class="il-dark il-ink il-thin" d="M52 26l6-8M66 24l2-8"/>
    <ellipse class="il-water il-ink il-thin" cx="36" cy="30" rx="1.6" ry="2.4"/>`,

  // A dwarf with a magnificent, sparkling, perfectly combed beard raises a crowned golden comb like a sceptre;
  // a tiny gnome looks up in awe.
  'kz.beard-comb': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-gold" opacity="0.25" d="M128 26 160 0v20zM128 26 160 50V36zM128 26 100 0h18zM128 26 160 74V60z"/>
    <path class="il-stone il-ink il-thin" d="M0 0h24l-6 10-6-4-4 8zM136 112l8-10 8 4 8-6v20h-24z"/>
    <path class="il-skin il-ink" d="M56 46c0-10 8-16 20-16s20 6 20 16v10c0 12-8 20-20 20s-20-8-20-20z"/>
    <path class="il-yellow il-ink" d="M52 40c0-14 10-22 24-22s24 8 24 22z"/>
    <rect class="il-yellow il-ink" x="48" y="38" width="56" height="6" rx="2"/>
    <circle class="il-glow il-ink il-thin" cx="76" cy="27" r="4"/>
    <path class="il-beard il-ink" d="M54 58c-6 18-2 40 6 54h32c8-14 12-36 6-54-6 8-14 10-22 10s-16-2-22-10z"/>
    <path class="il-line il-thin" d="M64 70q-4 14 2 34M72 72q-2 16 2 32M80 72q2 16-2 32M88 70q4 14-2 34"/>
    <path class="il-line" d="M64 50l8 2M88 50l-8 2"/>
    <circle class="il-dark" cx="68" cy="56" r="2.2"/><circle class="il-dark" cx="84" cy="56" r="2.2"/>
    <ellipse class="il-skin il-ink" cx="76" cy="63" rx="5" ry="4"/>
    <path class="il-skin il-ink" d="M96 72l14-30 7 3-12 30z"/>
    <circle class="il-skin il-ink" cx="114" cy="40" r="5"/>
    <rect class="il-gold il-ink" x="104" y="20" width="44" height="8" rx="3"/>
    <path class="il-gold il-ink il-thin" d="M106 28h4v12h-4zM113 28h4v12h-4zM120 28h4v12h-4zM127 28h4v12h-4zM134 28h4v12h-4zM141 28h4v12h-4z"/>
    <path class="il-yellow il-ink il-thin" d="M118 20l-2-10 6 5 4-7 4 7 6-5-2 10z"/>
    <circle class="il-red" cx="126" cy="15" r="1.4"/>
    <path class="il-white il-ink il-thin" d="M66 86l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4zM90 96l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z"/>
    <g>
      <path class="il-red il-ink" d="M18 92l7-20 7 20z"/>
      <rect class="il-skin il-ink il-thin" x="19" y="92" width="12" height="7"/>
      <path class="il-beard il-ink il-thin" d="M19 97c1 8 11 8 12 0z"/>
      <rect class="il-blue il-ink il-thin" x="17" y="103" width="16" height="12"/>
      <circle class="il-dark" cx="23" cy="94" r="1"/><circle class="il-dark" cx="27" cy="94" r="1"/>
      <path class="il-white il-ink il-thin" d="M36 74h3l-.6 8h-1.8z"/><circle class="il-white" cx="37.5" cy="85" r="1.3"/>
    </g>`,

  // A clean-shaven garden gnome winks while wearing an obviously fake clip-on beard (elastic, clip, price tag);
  // a lawnmower beside him is totally fooled and puzzled.
  'kz.fake-beard': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <path class="il-red il-ink" d="M44 52 66 6l22 46z"/>
    <path class="il-skin il-ink" d="M46 52h40v20c0 8-8 14-20 14s-20-6-20-14z"/>
    <circle class="il-skin il-ink" cx="45" cy="64" r="5"/><circle class="il-skin il-ink" cx="87" cy="64" r="5"/>
    <path class="il-line il-thin" d="M48 74Q40 64 46 56M84 74q8-10 2-18"/>
    <path class="il-line il-thin" d="M54 60q4-3 8 0M70 60l8-1"/>
    <circle class="il-dark" cx="74" cy="62" r="2.2"/>
    <ellipse class="il-skin il-ink il-thin" cx="66" cy="68" rx="4" ry="3"/>
    <g transform="rotate(7 66 80)">
      <path class="il-beard il-ink" d="M46 74c8 4 30 4 40 0 2 14-6 30-20 34-14-4-22-20-20-34z"/>
      <path class="il-line il-thin" d="M56 82q-2 10 4 18M66 84v18M76 82q2 10-4 18"/>
      <rect class="il-metal il-ink il-thin" x="44" y="72" width="6" height="5" rx="1"/>
      <rect class="il-metal il-ink il-thin" x="82" y="72" width="6" height="5" rx="1"/>
    </g>
    <path class="il-line il-thin" d="M62 77q4 3 8 0"/>
    <path class="il-line il-thin" d="M68 108v4"/>
    <path class="il-paper il-ink il-thin" d="M62 112h12l3 4-3 4H62z"/>
    <circle class="il-dark" cx="65" cy="116" r="1"/>
    <rect class="il-red il-ink" x="106" y="80" width="38" height="16" rx="5"/>
    <path class="il-line" d="M110 80 98 58M98 58h-6"/>
    <circle class="il-dark il-ink" cx="114" cy="98" r="5"/><circle class="il-dark il-ink" cx="138" cy="98" r="5"/>
    <circle class="il-white il-ink il-thin" cx="120" cy="87" r="3"/><circle class="il-white il-ink il-thin" cx="130" cy="87" r="3"/>
    <circle class="il-dark" cx="119" cy="86" r="1.3"/><circle class="il-dark" cx="129" cy="86" r="1.3"/>
    <path class="il-line il-thin" d="M116 82l5 1M134 81l-5 2"/>
    <path class="il-line" d="M122 62c0-6 10-6 10 0 0 4-5 4-5 8"/><circle class="il-dark" cx="127" cy="75" r="1.5"/>`,

  // A lucky gnome charm still sealed in its shop blister pack (with clover and a starburst sticker), sweating nervously.
  'kz.lucky-charm': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-metal il-ink il-thin" d="M76 0h8v8h-8z"/>
    <path class="il-line" d="M80 8v8"/>
    <rect class="il-paper il-ink" x="38" y="12" width="84" height="100" rx="6"/>
    <rect class="il-sky il-ink il-thin" x="72" y="18" width="16" height="7" rx="3.5"/>
    <g class="il-green il-ink il-thin">
      <circle cx="50" cy="96" r="4"/><circle cx="58" cy="96" r="4"/><circle cx="50" cy="104" r="4"/><circle cx="58" cy="104" r="4"/>
    </g>
    <path class="il-line il-thin" d="M54 100l-6 8"/>
    <circle class="il-metal il-ink il-thin" cx="80" cy="40" r="5"/>
    <path class="il-line il-thin" d="M80 45v4"/>
    <path class="il-red il-ink" d="M68 66l12-18 12 18z"/>
    <rect class="il-skin il-ink" x="70" y="66" width="20" height="10"/>
    <path class="il-beard il-ink" d="M70 72c2 12 18 12 20 0z"/>
    <rect class="il-gold il-ink" x="68" y="82" width="24" height="12" rx="2"/>
    <circle class="il-dark" cx="76" cy="70" r="1.6"/>
    <path class="il-line il-thin" d="M82 70h5M73 67l4 1"/>
    <ellipse class="il-water il-ink il-thin" cx="93" cy="62" rx="1.6" ry="2.4"/>
    <rect class="il-smoke il-ink il-thin" x="56" y="32" width="48" height="68" rx="14" opacity="0.45"/>
    <path class="il-light" d="M62 40q-2 10 0 18M98 76v12"/>
    <path class="il-yellow il-ink il-thin" d="M108 78l3 5 6-2-2 6 5 3-5 3 2 6-6-2-3 5-3-5-6 2 2-6-5-3 5-3-2-6 6 2z"/>
    <path class="il-red il-thin il-ink" d="M107 84h2l-.4 5h-1.2z"/><circle class="il-red" cx="108" cy="92" r="1"/>`,

  // A smiling but nervous gold nugget on a velvet market cushion waves a tiny white surrender flag; a price tag hangs off it.
  'kz.gold-nugget': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-red il-ink" d="M0 0h20v14q-10 6-20 0zM40 0h20v14q-10 6-20 0zM80 0h20v14q-10 6-20 0zM120 0h20v14q-10 6-20 0z"/>
    <path class="il-white il-ink" d="M20 0h20v14q-10 6-20 0zM60 0h20v14q-10 6-20 0zM100 0h20v14q-10 6-20 0zM140 0h20v14q-10 6-20 0z"/>
    <rect class="il-wood il-ink" x="0" y="100" width="160" height="20"/>
    <path class="il-purple il-ink" d="M28 98c0-12 20-16 52-16s52 4 52 16c0 8-20 10-52 10s-52-2-52-10z"/>
    <path class="il-gold il-ink il-thin" d="M28 98l-6 6 4 2zM132 98l6 6-4 2z"/>
    <path class="il-gold il-ink" d="M50 90 52 72 62 58 78 50 96 52 110 60 116 74 112 90 92 94 70 94z"/>
    <path class="il-line il-thin" d="M62 58l6 12-16 2M78 50l-10 20M96 52l4 14 16 8M100 66l-32 4M70 94l-2-24M100 66l12 24"/>
    <path class="il-yellow" d="M66 56l10-4-6 12zM98 56l8 4-6 4z"/>
    <circle class="il-dark" cx="76" cy="78" r="2.2"/><circle class="il-dark" cx="92" cy="78" r="2.2"/>
    <path class="il-line il-thin" d="M80 85q4 3 8 0M72 72l6 2M96 72l-6 2"/>
    <ellipse class="il-water il-ink il-thin" cx="102" cy="76" rx="1.6" ry="2.4"/>
    <path class="il-line" d="M112 78l10-42"/>
    <path class="il-white il-ink il-thin" d="M122 36q8 4 16 0l-3 12q-8 4-16 0z"/>
    <path class="il-line il-thin" d="M54 84Q44 84 44 90"/>
    <path class="il-paper il-ink il-thin" d="M30 88h14l4 5-4 5H30z"/>
    <circle class="il-gold il-ink il-thin" cx="35" cy="93" r="2.4"/><circle class="il-gold il-ink il-thin" cx="41" cy="93" r="2.4"/>
    <path class="il-yellow il-ink il-thin" d="M56 30l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2zM140 64l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6zM92 32l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z"/>`,

  // A blissful dwarf with green moss tufts stuffed in his ears smiles, puzzled, while a gnome bellows into a megaphone.
  'kz.moss-earplugs': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-skin il-ink" d="M20 50c0-12 10-18 26-18s26 6 26 18v12c0 14-10 24-26 24S20 76 20 62z"/>
    <path class="il-yellow il-ink" d="M16 44c0-16 12-26 30-26s30 10 30 26z"/>
    <rect class="il-yellow il-ink" x="12" y="42" width="68" height="6" rx="2"/>
    <circle class="il-glow il-ink il-thin" cx="46" cy="28" r="4"/>
    <circle class="il-skin il-ink" cx="19" cy="60" r="6"/><circle class="il-skin il-ink" cx="73" cy="60" r="6"/>
    <path class="il-green il-ink il-thin" d="M12 60c-2-6 4-8 6-5 2-4 8-1 6 3 3 3 0 8-4 6-2 4-8 2-8-4z"/>
    <path class="il-green il-ink il-thin" d="M80 60c2-6-4-8-6-5-2-4-8-1-6 3-3 3 0 8 4 6 2 4 8 2 8-4z"/>
    <circle class="il-slime" cx="16" cy="58" r="1.1"/><circle class="il-slime" cx="77" cy="62" r="1.1"/>
    <path class="il-green il-ink il-thin" d="M78 54q0-6 4-8M78 50q4 0 6-4"/>
    <path class="il-beard il-ink" d="M22 64c2 22 12 38 24 42 12-4 22-20 24-42-6 6-14 8-24 8s-18-2-24-8z"/>
    <path class="il-line" d="M32 56q4 3 8 0M52 56q4 3 8 0"/>
    <ellipse class="il-skin il-ink" cx="46" cy="64" rx="5" ry="4"/>
    <path class="il-line il-thin" d="M40 74q6 4 12 0"/>
    <path class="il-line" d="M88 16c0-6 10-6 10 0 0 4-5 4-5 8"/><circle class="il-dark" cx="93" cy="29" r="1.5"/>
    <path class="il-line il-thin" d="M108 52l-6 4 6 4-6 4M100 46l-8 4 8 6-8 6 8 6M114 58l-4 2 4 2"/>
    <path class="il-yellow il-ink" d="M116 52l14 6v8l-14 6z"/>
    <path class="il-red il-ink" d="M126 70l12-32 12 32z"/>
    <rect class="il-skin il-ink" x="128" y="70" width="20" height="10"/>
    <path class="il-beard il-ink" d="M128 77c2 11 18 11 20 0z"/>
    <rect class="il-blue il-ink" x="126" y="86" width="24" height="20"/>
    <path class="il-line il-thin" d="M132 72l5 2M146 72l-5 2"/>
    <circle class="il-dark" cx="135" cy="75" r="1.4"/><circle class="il-dark" cx="142" cy="75" r="1.4"/>
    <circle class="il-skin il-ink il-thin" cx="130" cy="66" r="3.5"/>`,

  // A plaid thermos of mine tea pours a cup so hot that the steam makes a cranky ghost above it melt and drip.
  'kz.mine-tea': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone il-ink il-thin" d="M0 0h160v6l-8 10-6-8-8 14-8-12-10 6-6-6-10 4-8-8-6 6-50-6-6 12-6-10-8 8-10-12-8 10-6-4z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <rect class="il-red il-ink" x="20" y="46" width="38" height="58" rx="8"/>
    <path class="il-dark" opacity="0.35" d="M20 62h38v6H20zM20 82h38v6H20zM30 46h6v58h-6zM44 46h6v58h-6z"/>
    <rect class="il-metal il-ink" x="24" y="34" width="30" height="14" rx="3"/>
    <rect class="il-dark il-ink il-thin" x="32" y="28" width="14" height="7" rx="2"/>
    <path class="il-metal il-ink" d="M58 58h6a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4h-6v-6h4V64h-4z"/>
    <path class="il-light il-thin" d="M26 52v40"/>
    <path class="il-metal il-ink" d="M74 86h26l-3 18H77z"/>
    <ellipse class="il-earth-dark il-ink il-thin" cx="87" cy="86" rx="13" ry="3"/>
    <path class="il-light" d="M80 80c-4-6 4-8 0-14M88 78c-4-6 4-8 0-14M96 80c-4-6 4-8 0-14"/>
    <path class="il-white il-ink" d="M96 50c0-20 10-32 26-32s26 12 26 30c0 6-2 10-4 12l-2 10-4-8-4 12-4-10-4 8-4-12-4 8-4-10z"/>
    <ellipse class="il-white il-ink il-thin" cx="108" cy="76" rx="2" ry="3"/><ellipse class="il-white il-ink il-thin" cx="124" cy="80" rx="2" ry="3"/>
    <ellipse class="il-white il-ink il-thin" cx="138" cy="74" rx="1.6" ry="2.4"/>
    <path class="il-line" d="M108 34l8 3M136 34l-8 3"/>
    <circle class="il-dark" cx="113" cy="41" r="2.4"/><circle class="il-dark" cx="131" cy="41" r="2.4"/>
    <path class="il-line" d="M114 54q8-4 16 0"/>
    <path class="il-red il-ink il-thin" d="M140 22q2 3 0 4M144 22q-2 3 0 4M141 20q3 2 4 0M141 28q3-2 4 0"/>`,

  // A gnome peers over a big unfolded allotment map full of plots, paths and holes, while one leg has already
  // vanished into a real, unmarked hole.
  'kz.allotment-map': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-red il-ink" d="M66 26 80 0l14 26z"/>
    <rect class="il-skin il-ink" x="67" y="26" width="26" height="12"/>
    <circle class="il-white il-ink il-thin" cx="75" cy="32" r="3"/><circle class="il-white il-ink il-thin" cx="85" cy="32" r="3"/>
    <circle class="il-dark" cx="75" cy="33" r="1.4"/><circle class="il-dark" cx="85" cy="33" r="1.4"/>
    <path class="il-line il-thin" d="M71 27l-2-3M89 27l2-3"/>
    <path class="il-paper il-ink" d="M28 36l26 4 26-4 26 4 26-4v50l-26 4-26-4-26 4-26-4z"/>
    <path class="il-line il-thin" d="M54 40v50M80 36v50M106 40v50"/>
    <g class="il-green il-ink il-thin">
      <rect x="33" y="44" width="16" height="12"/><rect x="58" y="44" width="16" height="10"/><rect x="86" y="46" width="14" height="12"/>
      <rect x="112" y="44" width="14" height="14"/><rect x="33" y="68" width="16" height="12"/><rect x="112" y="68" width="14" height="12"/>
    </g>
    <rect class="il-wood il-ink il-thin" x="60" y="66" width="12" height="10"/>
    <path class="il-wood-dark il-ink il-thin" d="M58 66l8-6 8 6z"/>
    <path class="il-line il-thin il-dash" d="M30 62h24q10 0 12 14 2 6 20-2h40"/>
    <path class="il-red il-thin il-ink" d="M88 66l6 6M94 66l-6 6"/>
    <circle class="il-dark" cx="42" cy="62" r="2.5"/><circle class="il-dark" cx="120" cy="62" r="2.5"/><circle class="il-dark" cx="98" cy="80" r="2.5"/>
    <circle class="il-skin il-ink" cx="28" cy="52" r="5"/><circle class="il-skin il-ink" cx="132" cy="52" r="5"/>
    <rect class="il-blue il-ink" x="64" y="88" width="10" height="12"/>
    <path class="il-dark il-ink" d="M58 98h18v6H56z"/>
    <ellipse class="il-dark il-ink" cx="96" cy="106" rx="14" ry="5"/>
    <path class="il-blue il-ink" d="M86 88h10l2 18h-12z"/>
    <path class="il-line il-thin" d="M80 104l-6-2M112 104l6-2M84 110l-4 3M108 110l4 3"/>
    <circle class="il-earth" cx="78" cy="98" r="1.4"/><circle class="il-earth" cx="114" cy="98" r="1.4"/>`,
};
