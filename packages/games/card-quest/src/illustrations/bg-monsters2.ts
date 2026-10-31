/* Creepy Crawlies illustrations: monsters2. */
export const BG_MONSTERS2: Readonly<Record<string, string>> = {
  // A shiny green rubber bath frog on a lily pad, bib on, knife and fork raised, croaking hungrily (squeak lines, toy
  // seam, little plug on its leg) — while a terrified ant clings to the very top of a blade of grass.
  'bg.rubber-frog': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow" cx="20" cy="18" r="9" opacity="0.8"/>
    <path class="il-water" d="M0 82h160v38H0z"/>
    <path class="il-light il-thin" opacity="0.6" d="M4 90h12M22 114h18M98 114h12M106 90h8"/>
    <path class="il-grass il-ink" d="M112 120c4-24 20-38 50-40v40z"/>
    <path class="il-grass il-ink il-thin" d="M146 120c0-12 2-22 8-30-1 10-1 20 0 30zM116 120c-2-8-6-14-12-18 8 2 14 8 16 18z"/>
    <path class="il-green il-ink il-thin" d="M122 120c0-34 6-66 22-98-3 34-7 68-12 98z"/>
    <path class="il-green il-ink" d="M14 100c0-8 22-12 50-12s50 4 50 12-22 12-50 12-50-4-50-12z"/>
    <path class="il-line il-thin" opacity="0.5" d="M64 104l-34-2M64 104l36-1M64 104l-8 7"/>
    <ellipse class="il-slime il-ink" cx="38" cy="94" rx="14" ry="7"/>
    <ellipse class="il-slime il-ink" cx="90" cy="94" rx="14" ry="7"/>
    <circle class="il-yellow il-ink il-thin" cx="27" cy="95" r="2.2"/>
    <ellipse class="il-slime il-ink" cx="64" cy="76" rx="28" ry="20"/>
    <ellipse class="il-yellow il-ink il-thin" cx="64" cy="81" rx="17" ry="13"/>
    <path class="il-line il-thin il-dash" opacity="0.45" d="M38 64q-3 12 3 22M90 64q3 12-3 22"/>
    <ellipse class="il-white" opacity="0.6" cx="84" cy="72" rx="2.5" ry="5"/>
    <ellipse class="il-slime il-ink" cx="64" cy="53" rx="30" ry="16"/>
    <circle class="il-slime il-ink" cx="50" cy="38" r="10"/>
    <circle class="il-slime il-ink" cx="78" cy="38" r="10"/>
    <circle class="il-white il-ink" cx="51" cy="37" r="6"/><circle class="il-dark" cx="53.5" cy="35.5" r="3"/><circle class="il-white" cx="54.5" cy="34.4" r="1"/>
    <circle class="il-white il-ink" cx="79" cy="37" r="6"/><circle class="il-dark" cx="81.5" cy="35.5" r="3"/><circle class="il-white" cx="82.5" cy="34.4" r="1"/>
    <path class="il-line" d="M42 27l11 4M87 27l-11 4"/>
    <path class="il-white" opacity="0.7" d="M40 50q4-6 12-8-6 3-9 9z"/>
    <circle class="il-dark" cx="60" cy="47" r="1.2"/><circle class="il-dark" cx="68" cy="47" r="1.2"/>
    <ellipse class="il-pink" opacity="0.6" cx="41" cy="55" rx="4" ry="2.4"/><ellipse class="il-pink" opacity="0.6" cx="87" cy="55" rx="4" ry="2.4"/>
    <path class="il-dark il-ink" d="M46 54q18 18 36 0q-18 5-36 0z"/>
    <path class="il-pink" d="M57 61q7 4 14 0q-7-3-14 0z"/>
    <path class="il-white il-ink" d="M52 66h24l-12 12z"/>
    <g class="il-red"><circle cx="58" cy="68.5" r="1.3"/><circle cx="70" cy="68.5" r="1.3"/><circle cx="64" cy="73" r="1.3"/></g>
    <path class="il-metal il-ink il-thin" d="M31 80V58q7 3 6 22z"/>
    <rect class="il-wood-dark il-ink il-thin" x="30" y="80" width="7" height="10" rx="2"/>
    <path class="il-line" d="M97 90V64M93 64v-9M97 64v-9M101 64v-9M93 64h8"/>
    <circle class="il-slime il-ink" cx="34" cy="90" r="4.5"/><circle class="il-slime il-ink" cx="97" cy="90" r="4.5"/>
    <path class="il-line il-thin" d="M106 52l8-3M107 58l8 2M104 46l6-6M20 50l-8-2M21 56l-8 3"/>
    <g transform="translate(139 46) scale(1.3)">
      <ellipse class="il-dark il-ink il-thin" cx="2.5" cy="10" rx="4.5" ry="6"/>
      <ellipse class="il-dark il-ink il-thin" cx="1" cy="1" rx="2.6" ry="3.4"/>
      <path class="il-line il-thin" d="M-1 -1l-5-2M-1 1.5l-5 2M0 4l-4 4M3 -1l5-3M3 1.5l5 0M3 4l4 4"/>
      <circle class="il-dark il-ink il-thin" cx="0" cy="-7" r="4.5"/>
      <path class="il-line il-thin" d="M-2 -11l-3-6M2 -11l3-6"/>
      <circle class="il-white" cx="-1.8" cy="-6.6" r="1.9"/><circle class="il-white" cx="2" cy="-6.6" r="1.9"/>
      <circle class="il-dark" cx="-2.6" cy="-5.6" r="0.9"/><circle class="il-dark" cx="1.2" cy="-5.6" r="0.9"/>
      <path class="il-light il-thin" d="M-1.5 -3.2q1.5-1 3 0"/>
    </g>
    <ellipse class="il-water il-ink il-thin" cx="150" cy="34" rx="1.6" ry="2.4"/><ellipse class="il-water il-ink il-thin" cx="129" cy="32" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" d="M152 44l3 1M126 42l-3 1"/>`,

  // A lost robot mower, love hearts on its little screen, nose-first in the compost heap and dreaming of a full
  // battery; behind it a zigzag mowing track and a knocked-over garden gnome seeing stars. A worm peeks out, puzzled.
  'bg.robot-mower': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 40h160v80H0z"/>
    <path class="il-wood il-ink il-thin" d="M0 26h56v4H0z"/>
    <path class="il-wood il-ink il-thin" d="M4 40V22l3-4 3 4v18zM20 40V22l3-4 3 4v18zM36 40V22l3-4 3 4v18zM52 40V22l3-4 3 4v18z"/>
    <polyline class="il-light il-thick" opacity="0.35" points="2 46 52 54 6 64 50 72 10 82 40 90"/>
    <polyline class="il-light il-thick" opacity="0.35" points="2 52 44 58 0 70 42 76 4 88"/>
    <path class="il-earth-dark il-ink" d="M116 96c0-26 12-44 24-44s20 18 20 44z"/>
    <path class="il-line il-thin" opacity="0.4" d="M124 84q8-4 14 0M132 70q6-4 12 0M140 90q6-3 12 0"/>
    <path class="il-white il-ink il-thin" d="M130 62l3-4 3 4 3-4 3 4c0 4-12 4-12 0z"/>
    <circle class="il-red il-ink il-thin" cx="150" cy="70" r="4"/><path class="il-line il-thin" d="M150 66l1-3"/>
    <path class="il-green il-ink il-thin" d="M138 52c4-6 10-6 12-2-4 2-8 3-12 2zM146 82c2-5 8-6 10-2-4 2-7 3-10 2z"/>
    <path class="il-line il-thin" opacity="0.6" d="M134 46q-3-5 0-10M142 44q-3-5 0-10"/>
    <path class="il-pink il-ink" d="M150 96c-2-6 0-12 4-12"/>
    <circle class="il-pink il-ink" cx="154" cy="82" r="4.5"/>
    <circle class="il-dark" cx="153" cy="81" r="1"/><circle class="il-dark" cx="156" cy="81" r="1"/>
    <path class="il-line il-thin" d="M152 78q2-2 4-1"/>
    <path class="il-line il-thin" d="M146 72h2M144 76l1-1"/>
    <rect class="il-dark il-ink" x="38" y="84" width="86" height="8" rx="4"/>
    <path class="il-orange il-ink" d="M38 86c0-18 18-30 43-30s43 12 43 30z"/>
    <path class="il-white" opacity="0.5" d="M50 76c4-8 12-12 22-13-8 3-14 7-18 14z"/>
    <path class="il-line il-thin" opacity="0.5" d="M44 80h74"/>
    <rect class="il-dark il-ink" x="68" y="62" width="32" height="14" rx="4"/>
    <path class="il-red" d="M78 67c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z"/>
    <path class="il-red" d="M92 67c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z"/>
    <path class="il-paper il-ink il-thin" d="M54 64l10 6-2 3-10-6z"/><path class="il-paper il-ink il-thin" d="M53 72l10-6 2 3-10 6z"/>
    <path class="il-line" d="M66 58l-4-9"/><circle class="il-red il-ink il-thin" cx="61" cy="47" r="2.5"/>
    <circle class="il-dark il-ink" cx="50" cy="93" r="6"/><circle class="il-metal" cx="50" cy="93" r="2"/>
    <circle class="il-dark il-ink" cx="112" cy="93" r="6"/><circle class="il-metal" cx="112" cy="93" r="2"/>
    <path class="il-green il-ink il-thin" d="M30 92l-5-2 1 3zM34 98l-6 1 3 2zM28 86l-4-4 0 3z"/>
    <circle class="il-white il-ink il-thin" cx="104" cy="50" r="2.4"/><circle class="il-white il-ink il-thin" cx="109" cy="42" r="3.2"/>
    <ellipse class="il-white il-ink" cx="118" cy="24" rx="24" ry="14"/>
    <rect class="il-white il-ink il-thin" x="104" y="18" width="22" height="12" rx="2"/><rect class="il-dark" x="126" y="21" width="3" height="6"/>
    <rect class="il-green" x="106" y="20" width="5" height="8"/><rect class="il-green" x="112" y="20" width="5" height="8"/><rect class="il-green" x="118" y="20" width="5" height="8"/>
    <path class="il-yellow il-ink il-thin" d="M117 15l-6 9h5l-3 8 8-11h-5l3-6z"/>
    <path class="il-line il-thin" d="M36 96l-4 3M38 101l-5 1"/>
    <path class="il-red il-ink" d="M20 100 2 108l18 8z"/>
    <path class="il-light il-dash il-thin" d="M18 102v12"/>
    <rect class="il-blue il-ink" x="36" y="102" width="15" height="12" rx="3"/>
    <path class="il-dark il-ink il-thin" d="M51 102h7v5h-7zM51 109h7v5h-7z"/>
    <circle class="il-skin il-ink" cx="26" cy="108" r="7"/>
    <path class="il-beard il-ink" d="M29 101c6 1 11 4 11 7s-5 6-11 7c3-4 3-10 0-14z"/>
    <path class="il-line il-thin" d="M22 104l3 3M25 104l-3 3M22 110l3 3M25 110l-3 3"/>
    <polygon class="il-yellow il-ink il-thin" transform="translate(30 94)" points="0 -4 1.2 -1.3 3.8 -1.2 1.9 0.6 2.4 3.2 0 1.7 -2.4 3.2 -1.9 0.6 -3.8 -1.2 -1.2 -1.3"/>
    <polygon class="il-yellow il-ink il-thin" transform="translate(14 94) scale(0.8)" points="0 -4 1.2 -1.3 3.8 -1.2 1.9 0.6 2.4 3.2 0 1.7 -2.4 3.2 -1.9 0.6 -3.8 -1.2 -1.2 -1.3"/>`,

  // The cellar caretaker (cap, moustache, round glasses, key ring) reads out his endless rules scroll, which runs down
  // to the floor and across the cellar — a little beetle at the far end has fallen asleep. "No crawling" sign on the wall.
  'bg.cellar-caretaker': `
    <rect class="il-stone" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 18h160M0 36h160M0 54h160M0 72h160M0 90h160M20 0v18M60 0v18M100 0v18M140 0v18M40 18v18M80 18v18M120 18v18M20 36v18M60 36v18M100 36v18M140 36v18M40 54v18M80 54v18M120 54v18M20 72v18M60 72v18M100 72v18M140 72v18"/>
    <path class="il-grey" d="M0 98h160v22H0z"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 98h160"/>
    <rect class="il-wood il-ink" x="4" y="38" width="64" height="5"/>
    <rect class="il-water il-ink il-thin" x="8" y="22" width="14" height="16" rx="3" opacity="0.8"/><rect class="il-red" x="10" y="27" width="10" height="9" rx="2"/><rect class="il-red il-ink il-thin" x="7" y="19" width="16" height="4" rx="1"/>
    <rect class="il-water il-ink il-thin" x="27" y="18" width="14" height="20" rx="3" opacity="0.8"/><circle class="il-green" cx="32" cy="27" r="3"/><circle class="il-green" cx="36" cy="32" r="3"/><circle class="il-green" cx="31" cy="34" r="2.5"/><rect class="il-metal il-ink il-thin" x="26" y="15" width="16" height="4" rx="1"/>
    <rect class="il-water il-ink il-thin" x="46" y="24" width="16" height="14" rx="3" opacity="0.8"/><rect class="il-yellow" x="48" y="28" width="12" height="8" rx="2"/><rect class="il-orange il-ink il-thin" x="45" y="21" width="18" height="4" rx="1"/>
    <circle class="il-red il-ink" cx="32" cy="70" r="13"/>
    <circle class="il-white" cx="32" cy="70" r="9.5"/>
    <ellipse class="il-dark" cx="33" cy="71" rx="4.5" ry="3.2"/><circle class="il-dark" cx="28" cy="70" r="2.2"/>
    <path class="il-line il-thin" d="M30 68l-2-3M34 68l1-3M36 68l2-3M30 74l-2 3M34 74l1 3M36 74l2 3M27 68l-3-3"/>
    <rect class="il-red" x="20" y="68.5" width="24" height="3" transform="rotate(45 32 70)"/>
    <path class="il-paper il-ink" d="M98 66h32v48H24v-8h74z"/>
    <ellipse class="il-paper il-ink" cx="24" cy="110" rx="4" ry="4.5"/>
    <path class="il-line il-thin" d="M102 72h24M102 77h18M102 82h24M102 87h20M102 92h24M102 97h16M104 102h22"/>
    <path class="il-line il-thin" d="M34 108v4M42 108v4M50 108v4M58 108v4M66 108v4M74 108v4M82 108v4M90 108v4"/>
    <path class="il-blue il-ink" d="M98 112c0-30 2-54 16-62 14 8 18 32 18 62z"/>
    <path class="il-blue il-ink" d="M98 112v-48h-4zM132 112V64h4z"/>
    <path class="il-white il-ink il-thin" d="M108 52l6 8 6-8"/>
    <rect class="il-paper il-ink" x="94" y="60" width="40" height="8" rx="4"/>
    <circle class="il-skin il-ink" cx="96" cy="63" r="4.5"/><circle class="il-skin il-ink" cx="132" cy="63" r="4.5"/>
    <circle class="il-metal il-ink il-thin" cx="133" cy="100" r="4"/>
    <path class="il-metal il-ink il-thin" d="M133 104l-2 8 3-1 1-7zM135 103l4 7 2-2-4-6z"/>
    <circle class="il-skin il-ink" cx="101" cy="36" r="3"/><circle class="il-skin il-ink" cx="127" cy="36" r="3"/>
    <circle class="il-skin il-ink" cx="114" cy="36" r="13"/>
    <path class="il-blue il-ink" d="M101 30c0-10 6-15 13-15s13 5 13 15z"/>
    <path class="il-blue il-ink" d="M96 30h20v4H96z"/>
    <circle class="il-white il-ink il-thin" cx="109" cy="36" r="4.2" opacity="0.9"/><circle class="il-white il-ink il-thin" cx="120" cy="36" r="4.2" opacity="0.9"/>
    <path class="il-line il-thin" d="M113 36h2"/>
    <circle class="il-dark" cx="109" cy="37" r="1.7"/><circle class="il-dark" cx="120" cy="37" r="1.7"/>
    <path class="il-line" d="M104 29l8 2M125 29l-8 2"/>
    <ellipse class="il-dark" cx="115" cy="46.5" rx="3.2" ry="2.4"/>
    <path class="il-grey il-ink il-thin" d="M106 43c4-3 14-3 18 0-4 3-14 3-18 0z"/>
    <path class="il-line il-thin" d="M86 34l-6-2M86 40h-7M88 28l-5-5"/>
    <ellipse class="il-green il-ink" cx="52" cy="101" rx="9" ry="6.5"/>
    <path class="il-line il-thin" d="M52 95v12"/>
    <circle class="il-dark il-ink il-thin" cx="42" cy="102" r="4.5"/>
    <path class="il-light il-thin" d="M40 102q1.4 1 2.8 0"/>
    <path class="il-line il-thin" d="M46 107l-2 2M52 107v3M58 106l2 3M40 98l-4-4"/>
    <path class="il-line il-thin" d="M48 80h7l-7 7h7M58 70h5l-5 5h5M64 62h4l-4 4h4"/>`,

  // A see-through ghost hen floats out through the henhouse wall at night, comb up and wing raised: "boo!". In the empty
  // nest below sits only a little beetle covered in goosebumps, antennae standing on end.
  'bg.ghost-hen': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-paper" cx="140" cy="18" r="9"/><circle class="il-stone" cx="137" cy="16" r="2" opacity="0.5"/><circle class="il-stone" cx="143" cy="21" r="1.4" opacity="0.5"/>
    <g class="il-white"><circle cx="96" cy="8" r="0.9"/><circle cx="120" cy="34" r="0.9"/><circle cx="154" cy="40" r="0.9"/><circle cx="76" cy="6" r="0.8"/></g>
    <path class="il-wood-dark il-ink" d="M-2 120V22l30-16 30 16v98z"/>
    <path class="il-line il-thin" opacity="0.5" d="M10 28v92M22 22v98M34 22v98M46 28v92"/>
    <path class="il-red il-ink" d="M-4 24 28 4l34 20-3 4-31-18L-1 28z"/>
    <path class="il-dark il-ink" d="M18 78c0-7 4-10 10-10s10 3 10 10v12H18z"/>
    <path class="il-wood il-ink il-thin" d="M18 90l-14 22h8l12-22z"/>
    <path class="il-earth-dark" d="M56 104h104v16H56z"/>
    <ellipse class="il-glow" opacity="0.15" cx="90" cy="52" rx="48" ry="40"/>
    <g transform="translate(168 0) scale(-1 1)" opacity="0.88">
      <path class="il-white il-ink" d="M56 44C56 30 62 20 74 20c10 0 16 8 16 16 8 0 14-6 18-16l6-8 4 12 6-6c4 14 2 30-6 40l2 26-8-6-6 8-8-8-8 8-8-8-8 8-6-10-8 4c-2-12-4-24-4-36z"/>
      <path class="il-line il-thin" opacity="0.4" d="M100 50q6 4 10 0M96 62q6 4 12 0M108 28l4 8M116 26l-2 10"/>
      <path class="il-white il-ink" d="M84 58c4-14 20-20 30-12-6 2-8 6-8 10-6-2-10 0-12 6-4-4-6-4-10-4z"/>
      <path class="il-red il-ink" d="M64 22c-2-6 2-9 5-6 0-6 6-7 7-2 2-5 8-4 7 2 4-2 6 2 3 6z"/>
      <path class="il-yellow il-ink" d="M58 30 44 34l14 6z"/>
      <path class="il-line il-thin" d="M46 34h10"/>
      <path class="il-red il-ink" d="M58 40c-4 2-4 8 0 10 3-2 3-7 0-10z"/>
      <ellipse class="il-dark" cx="68" cy="31" rx="3.4" ry="4.4"/><circle class="il-white" cx="67" cy="29.5" r="1.1"/>
      <path class="il-line" d="M62 24l10 3"/>
    </g>
    <path class="il-light il-dash il-thin" opacity="0.6" d="M60 96h-10M58 88h-8M62 104h-12"/>
    <path class="il-light il-thin" d="M132 46q4-4 8 0M134 54q5-4 10 0"/>
    <ellipse class="il-gold il-ink" cx="128" cy="106" rx="24" ry="8"/>
    <path class="il-line il-thin" d="M108 104l8 4M114 110l6-6M130 112l8-6M140 104l8 5M122 101l4 4"/>
    <path class="il-light il-dash il-thin" d="M140 98c-6 0-8-6-8-10s3-8 8-8 8 4 8 8-2 10-8 10z"/>
    <ellipse class="il-blue il-ink" cx="120" cy="99" rx="9" ry="7"/>
    <path class="il-line il-thin" d="M120 92v14"/>
    <g class="il-white"><circle cx="116" cy="97" r="0.8"/><circle cx="117" cy="102" r="0.8"/><circle cx="124" cy="96" r="0.8"/><circle cx="123" cy="101" r="0.8"/><circle cx="114" cy="100" r="0.7"/><circle cx="126" cy="99" r="0.7"/></g>
    <circle class="il-blue il-ink" cx="110" cy="96" r="5"/>
    <circle class="il-white il-ink il-thin" cx="108.4" cy="95" r="2.2"/><circle class="il-white il-ink il-thin" cx="112.6" cy="95" r="2.2"/>
    <circle class="il-dark" cx="108" cy="94.4" r="0.8"/><circle class="il-dark" cx="112.2" cy="94.4" r="0.8"/>
    <ellipse class="il-dark" cx="110.4" cy="99" rx="1.2" ry="1"/>
    <path class="il-line il-thin" d="M108 91l-2-4 2-2-2-3M112 91l2-4-2-2 2-3"/>
    <path class="il-line il-thin" d="M103 92l-3-1M103 97h-4M104 101l-3 2"/>`,

  // A relaxed purple cellar spider lounges in a web hammock between the shelf posts, cup of tea in one leg and a tiny
  // laptop (wave on screen) on her tummy — surfing. A fly that dropped in sits stuck in the web corner with its own tea.
  'bg.hammock-spider': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="2" y="-2" width="8" height="102"/>
    <rect class="il-wood il-ink" x="150" y="-2" width="8" height="102"/>
    <rect class="il-wood il-ink" x="0" y="96" width="160" height="7"/>
    <path class="il-wood-dark" d="M0 103h160v17H0z"/>
    <path class="il-light il-thin" opacity="0.7" d="M10 22l10 6M150 22l-10 6"/>
    <path class="il-white" opacity="0.18" d="M20 28Q80 116 140 28Q80 64 20 28z"/>
    <path class="il-light il-thin" d="M20 28Q80 116 140 28M20 28Q80 64 20 28M20 28Q80 92 140 28M140 28Q80 64 20 28"/>
    <path class="il-light il-thin" opacity="0.7" d="M38 40l2 18M56 46l2 24M80 47l0 26M104 46l-2 24M122 40l-2 18"/>
    <rect class="il-white il-ink il-thin" x="24" y="80" width="18" height="14" rx="5"/><path class="il-white il-ink il-thin" d="M42 84c6 0 6 8 0 8"/><path class="il-white il-ink il-thin" d="M24 86l-6-4"/><rect class="il-red il-ink il-thin" x="30" y="76" width="6" height="4" rx="2"/>
    <rect class="il-water il-ink il-thin" x="112" y="76" width="16" height="20" rx="3" opacity="0.8"/><rect class="il-orange" x="114" y="82" width="12" height="12" rx="2"/><rect class="il-red il-ink il-thin" x="111" y="73" width="18" height="4" rx="1"/>
    <path class="il-line" d="M60 58c-8-6-12-14-12-22M58 62c-10-2-18 2-24 8M100 64c8 4 14 10 16 18l6 2M104 58c10 0 18 4 22 10l6-2M94 70l-2 12-6 4M86 70l-4 10 4 6"/>
    <ellipse class="il-purple il-ink" cx="88" cy="58" rx="20" ry="13"/>
    <path class="il-purple-dark" opacity="0.7" d="M80 48q2 10 0 20M90 46q2 12 0 24M100 48q2 10 0 18"/>
    <path class="il-line il-thin" opacity="0.6" d="M80 48q2 10 0 20M90 46q2 12 0 24M100 48q2 10 0 18"/>
    <circle class="il-purple il-ink" cx="64" cy="50" r="11"/>
    <path class="il-dark il-ink il-thin" d="M55 42h8l2 2h2l2-2h8v3c0 3-2 4-5 4s-4-2-5-4h-2c-1 2-2 4-5 4s-5-1-5-4z"/>
    <path class="il-line il-thin" d="M58 52q2 2 4 0M66 52q2 2 4 0"/>
    <path class="il-line il-thin" d="M60 56q4 4 8 0"/>
    <ellipse class="il-pink" opacity="0.6" cx="57" cy="56" rx="3" ry="1.8"/>
    <path class="il-metal il-ink il-thin" d="M80 50h24l4 5H76z"/>
    <rect class="il-dark il-ink il-thin" x="82" y="34" width="22" height="16" rx="2"/>
    <rect class="il-blue" x="84" y="36" width="18" height="12"/>
    <path class="il-light il-thin" d="M85 45q4-7 8-2t8-2"/>
    <circle class="il-yellow" cx="99" cy="39" r="1.6"/>
    <path class="il-line" d="M58 44c-6-6-8-14-6-20"/>
    <path class="il-white il-ink il-thin" d="M44 20h12l-2 8h-8z"/><path class="il-white il-ink il-thin" d="M56 22c4 0 4 4 0 4"/>
    <path class="il-light il-thin" d="M48 16q-2-3 0-6M52 16q-2-3 0-6"/>
    <path class="il-line" d="M76 46c-2-8 2-14 8-16"/>
    <path class="il-white" opacity="0.6" d="M74 52q6-6 14-6-8 2-12 8z"/>
    <path class="il-light il-thin" d="M24 34Q80 104 136 34"/>
    <path class="il-light il-thin" opacity="0.8" d="M70 62l1 10M80 64v10M92 64l-1 10M102 62l-1 8"/>
    <ellipse class="il-white il-ink il-thin" cx="132" cy="38" rx="6" ry="3.4" transform="rotate(-30 132 38)" opacity="0.8"/>
    <ellipse class="il-white il-ink il-thin" cx="143" cy="38" rx="6" ry="3.4" transform="rotate(30 143 38)" opacity="0.8"/>
    <ellipse class="il-grey il-ink" cx="138" cy="48" rx="6" ry="7"/>
    <circle class="il-grey il-ink" cx="138" cy="40" r="5"/>
    <circle class="il-red il-ink il-thin" cx="135" cy="39" r="2.6"/><circle class="il-red il-ink il-thin" cx="141" cy="39" r="2.6"/>
    <circle class="il-white" cx="134.4" cy="38.2" r="0.8"/><circle class="il-white" cx="140.4" cy="38.2" r="0.8"/>
    <path class="il-line il-thin" d="M136 43.5q2 1 4 0"/>
    <path class="il-white il-ink il-thin" d="M126 46h6l-1 5h-4z"/>
    <path class="il-line il-thin" d="M132 48l2 0M134 52l-4 4M142 52l4 4M140 55v4M136 55v4"/>
    <ellipse class="il-water il-ink il-thin" cx="146" cy="33" rx="1.4" ry="2.2"/>`,

  // A glossy starling on a branch, beak wide open, "ringing" like a mobile phone (phone with vibration lines in its
  // song bubble, a gold star above its head). Its nest is built from shiny loot; a snail below searches its own shell.
  'bg.ringtone-starling': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink il-thin" d="M0 78h160v5H0zM0 94h160v5H0z"/>
    <path class="il-wood il-ink il-thin" d="M6 108V72l5-5 5 5v36zM30 108V72l5-5 5 5v36zM54 108V72l5-5 5 5v36zM78 108V72l5-5 5 5v36zM102 108V72l5-5 5 5v36zM126 108V72l5-5 5 5v36zM150 108V72l5-5 5 5v36z"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-grass il-ink il-thin" d="M14 106l2-6 2 6M70 106l2-7 2 7M118 106l2-6 2 6"/>
    <path class="il-wood-dark il-ink" d="M0 52c30 4 64 4 96-2l8-8 2 7c16-2 34-2 54 0v8c-46-2-90 6-160 4z"/>
    <path class="il-green il-ink il-thin" d="M104 42c-4-6-2-12 4-12 0 6-1 9-4 12zM20 55c2-6 8-8 12-5-3 4-7 5-12 5z"/>
    <path class="il-wood il-ink" d="M110 48c0-6 6-10 18-10s18 4 18 10c0 4-8 6-18 6s-18-2-18-6z"/>
    <path class="il-line il-thin" d="M112 46l8 4M120 44l6 6M132 44l8 4M138 42l2 8"/>
    <path class="il-metal il-ink il-thin" d="M114 40l12-10c2-2 6 0 4 3-2 2-4 3-6 2l-8 7z"/>
    <circle class="il-gold il-ink il-thin" cx="136" cy="38" r="4"/><circle class="il-white" cx="136" cy="38" r="2"/>
    <path class="il-gold il-ink il-thin" d="M142 34h6v4h-2v4h-2v-4h-2z"/><circle class="il-gold il-ink il-thin" cx="145" cy="32" r="2.6"/>
    <circle class="il-metal il-ink il-thin" cx="126" cy="40" r="3"/>
    <path class="il-line" d="M58 50v6M66 50v6M56 56h4M64 56h4"/>
    <path class="il-dark il-ink" d="M44 44 20 50l6-6-8-2 8-2-6-6z"/>
    <ellipse class="il-dark il-ink" cx="60" cy="38" rx="22" ry="14" transform="rotate(-12 60 38)"/>
    <path class="il-purple" opacity="0.8" d="M50 32q8-6 18-4-6 4-8 10-6-4-10-6z"/>
    <path class="il-teal" opacity="0.8" d="M48 44q8 2 18-2-4 6-10 8-6-2-8-6z"/>
    <path class="il-dark il-ink il-thin" d="M44 34q10-4 22 2-8 2-12 8-4-6-10-10z"/>
    <g class="il-white"><circle cx="58" cy="44" r="1"/><circle cx="64" cy="46" r="1"/><circle cx="70" cy="42" r="1"/><circle cx="54" cy="48" r="0.9"/><circle cx="74" cy="36" r="1"/><circle cx="62" cy="32" r="0.9"/><circle cx="68" cy="28" r="0.9"/></g>
    <circle class="il-dark il-ink" cx="80" cy="22" r="11"/>
    <g class="il-white"><circle cx="76" cy="15" r="0.9"/><circle cx="82" cy="14" r="0.9"/><circle cx="74" cy="22" r="0.9"/></g>
    <path class="il-yellow il-ink" d="M88 18 108 10 90 24z"/>
    <path class="il-yellow il-ink" d="M89 26 106 34 88 30z"/>
    <path class="il-red" d="M92 24l8 2-8 0z"/>
    <path class="il-line il-thin" d="M80 15q3-3 6 0"/>
    <circle class="il-white il-ink il-thin" cx="83" cy="20" r="3"/><circle class="il-dark" cx="84" cy="20" r="1.4"/>
    <polygon class="il-gold il-ink il-thin" transform="translate(76 4) scale(1.1)" points="0 -4 1.2 -1.3 3.8 -1.2 1.9 0.6 2.4 3.2 0 1.7 -2.4 3.2 -1.9 0.6 -3.8 -1.2 -1.2 -1.3"/>
    <path class="il-white il-ink" d="M116 6h36c4 0 6 2 6 6v14c0 4-2 6-6 6h-24l-10 6 2-6h-4c-4 0-6-2-6-6V12c0-4 2-6 6-6z"/>
    <rect class="il-dark il-ink il-thin" x="127" y="9" width="12" height="20" rx="2"/>
    <rect class="il-blue" x="129" y="12" width="8" height="13"/>
    <circle class="il-white" cx="133" cy="27" r="0.9"/>
    <path class="il-line il-thin" d="M123 13l-3 3 3 3-3 3 3 3M143 13l3 3-3 3 3 3-3 3"/>
    <path class="il-line il-thin" d="M98 4l4 2M100 40l5-2"/>
    <path class="il-stone il-ink" d="M106 116c0-4 4-6 8-6h26c4 0 6 6 2 6z"/>
    <path class="il-line" d="M114 110l-4-8M118 110l2-8"/>
    <circle class="il-white il-ink il-thin" cx="110" cy="101" r="2.4"/><circle class="il-dark" cx="111" cy="101" r="1"/>
    <circle class="il-white il-ink il-thin" cx="120" cy="101" r="2.4"/><circle class="il-dark" cx="121" cy="101" r="1"/>
    <circle class="il-orange il-ink" cx="138" cy="104" r="10"/>
    <path class="il-dark" d="M130 108a9 9 0 0 1 4-12l4 8z" opacity="0.6"/>
    <path class="il-line il-thin" d="M138 104c2 0 3-2 2-4-2-2-6-1-6 2 0 4 4 6 8 4"/>
    <path class="il-dark il-ink il-thin" d="M148 86c0-4 6-4 6 0 0 3-3 3-3 6M151 96v0.5"/>`,
  // Cross-section under the old oak: a sleeping, moss-bearded face in the trunk and a giant tangle of roots below. In
  // the middle a little mole holds a big map upside down — question mark, sweat drop, completely lost.
  'bg.oak-roots': `
    <rect class="il-earth" x="0" y="0" width="160" height="120"/>
    <path class="il-sky" d="M0 0h160v12H0z"/>
    <path class="il-earth-dark" d="M0 76c40-8 90 6 160-4v48H0z"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="22" cy="34" rx="4" ry="3"/><ellipse cx="140" cy="88" rx="5" ry="3.4"/><ellipse cx="118" cy="30" rx="3" ry="2.4"/><ellipse cx="100" cy="112" rx="4" ry="2.6"/><ellipse cx="8" cy="80" rx="3" ry="2.2"/></g>
    <path class="il-line il-thin" opacity="0.5" d="M30 38c-4 6-10 8-18 8M20 62c-6 0-10 4-14 10M126 54c4 8 2 14 8 20M136 40c2 6 8 8 16 6M100 82c8 4 10 10 18 12M120 108c6-4 12-4 18 0M24 100c6 2 8 8 14 10"/>
    <path class="il-wood-dark il-ink" d="M50 24C34 30 20 42 2 44v8c20-2 34-14 52-22z"/>
    <path class="il-wood-dark il-ink" d="M58 26C46 48 34 72 12 98c28-18 42-44 52-68z"/>
    <path class="il-wood-dark il-ink" d="M74 28c-8 14 8 24-2 38-8 12-20 16-14 34-2-16 10-22 18-34 10-14-4-26 6-38z"/>
    <path class="il-wood-dark il-ink" d="M120 58c-10 10-6 24-18 34-6 6-16 6-22 14 8-4 16-6 22-10 12-10 10-24 22-36z"/>
    <path class="il-wood-dark il-ink il-thin" d="M18 50c6 14-4 26 4 40-1-14 8-26 0-40zM140 46c-4 8 0 16-4 24 4-6 8-14 8-24z"/>
    <path class="il-wood-dark il-ink" d="M102 24c14 10 30 14 58 14v8c-28 2-46-6-62-16z"/>
    <path class="il-wood-dark il-ink" d="M96 28c8 26 30 44 52 76-6-36-28-56-46-80z"/>
    <path class="il-wood-dark il-ink il-thin" d="M30 38c4 8 2 16-6 22 8-2 12-10 10-22zM120 40c-4 10 0 18 8 22-4-8-4-14-4-22zM82 66c8-4 18-2 22 6-6-2-14-2-22-2zM40 64c-8 2-14 8-16 16 6-6 12-10 18-12z"/>
    <path class="il-light il-thin" opacity="0.35" d="M20 44q14-4 26-14M70 50q2 16 8 30M108 30q20 8 40 8"/>
    <path class="il-wood-dark il-ink" d="M54-2h52v8c0 10 8 14 18 20H36c10-6 18-10 18-20z"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 4v10M100 4v10M66 18l-6 6M96 18l6 6"/>
    <path class="il-grass il-ink" d="M-2 10h56l-4 6H-2zM106 10h56v6h-52z"/>
    <path class="il-grass il-ink il-thin" d="M8 10l2-6 2 6M140 10l2-6 2 6M28 10l2-5 2 5M122 10l2-5 2 5"/>
    <path class="il-stone il-ink il-thin" d="M62 4q6-4 13 0-6 0-13 2zM85 4q7-4 13 0-7 2-13 0z"/>
    <path class="il-line" d="M64 9q4 3 8 0M88 9q4 3 8 0"/>
    <path class="il-wood il-ink il-thin" d="M80 8c-3 3-3 7 0 9 3 0 4-2 3-4"/>
    <path class="il-line" d="M74 19q6 2 12 0"/>
    <path class="il-green il-ink il-thin" d="M70 21q10 8 20 0-2 5-10 6-8-1-10-6z"/>
    <path class="il-light il-thin" d="M106 2l4 0-4 4h4M114 0h3l-3 3h3"/>
    <circle class="il-dark il-ink" cx="46" cy="94" r="13"/>
    <ellipse class="il-dark il-ink" cx="46" cy="106" rx="15" ry="6"/>
    <path class="il-light il-thin" d="M39 90q2-1.5 4 0M49 90q2-1.5 4 0"/>
    <ellipse class="il-pink il-ink il-thin" cx="46" cy="95" rx="4" ry="3"/>
    <path class="il-light il-thin" opacity="0.7" d="M40 96l-7-1M40 98l-7 2M52 96l7-1M52 98l7 2"/>
    <path class="il-line il-thin" d="M43 101q3-2 6 0"/>
    <g transform="rotate(-8 64 100)">
      <rect class="il-paper il-ink" x="52" y="90" width="30" height="20" rx="1"/>
      <path class="il-line il-thin" opacity="0.5" d="M62 90v20M72 90v20"/>
      <path class="il-line il-thin il-dash" d="M55 106c6-10 10 4 16-6s8 4 8-6"/>
      <circle class="il-red" cx="79" cy="94" r="1.6"/>
      <path class="il-green il-ink il-thin" d="M56 94l3-3 3 3zM68 104l3-3 3 3z"/>
    </g>
    <ellipse class="il-pink il-ink" cx="53" cy="104" rx="4.5" ry="3.5"/><ellipse class="il-pink il-ink" cx="80" cy="99" rx="4.5" ry="3.5"/>
    <path class="il-light il-thick" d="M40 72c0-5 8-5 8 0 0 3-4 4-4 7M44 83v0.5"/>
    <ellipse class="il-water il-ink il-thin" cx="32" cy="86" rx="1.8" ry="2.6"/>`,

  // A green garden shredder with a toothy hopper gobbles a straw hat, leaves and twigs flying, wood chips spraying
  // out of the chute. A snail sits safe in its shell, unbothered — while a bee makes a perfectly straight "beeline".
  'bg.garden-shredder': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-green" opacity="0.7" d="M0 96c4-12 16-14 24-6 6-8 16-8 22 0 4-4 8-4 10 0v6z"/>
    <path class="il-line il-thick" d="M62 92l-4 10M98 92l4 10"/>
    <path class="il-green il-ink" d="M48 26h64l-10 28H58z"/>
    <ellipse class="il-dark il-ink" cx="80" cy="26" rx="32" ry="7"/>
    <g transform="rotate(-24 90 18)">
      <ellipse class="il-yellow il-ink" cx="90" cy="22" rx="17" ry="5"/>
      <path class="il-yellow il-ink" d="M81 21c0-8 4-12 9-12s9 4 9 12z"/>
      <path class="il-red il-ink il-thin" d="M81 18h18v3H81z"/>
      <path class="il-line il-thin" opacity="0.5" d="M84 13l2 5M90 11v6M95 13l-2 5"/>
    </g>
    <path class="il-green il-ink" d="M48 26c2 5 16 8 32 8s30-3 32-8v5c-2 5-16 8-32 8s-30-3-32-8z"/>
    <path class="il-white il-ink il-thin" d="M52 30l3-6 3 7 3-6 3 7 3-6 3 7 3-6 3 7 3-6 3 7 3-6 3 7 3-6 3 7 3-6 3 7 3-6 3 6"/>
    <rect class="il-metal il-ink" x="40" y="58" width="16" height="24" rx="3"/>
    <path class="il-line il-thin" d="M44 64h8M44 68h8M44 72h8M44 76h8"/>
    <rect class="il-green il-ink" x="56" y="52" width="48" height="42" rx="6"/>
    <path class="il-white" opacity="0.4" d="M60 58q2-3 8-3v4q-5 0-8 3z"/>
    <circle class="il-white il-ink" cx="70" cy="64" r="6"/><circle class="il-dark" cx="71" cy="62" r="3"/><circle class="il-white" cx="72" cy="61" r="1"/>
    <circle class="il-white il-ink" cx="90" cy="64" r="6"/><circle class="il-dark" cx="91" cy="62" r="3"/><circle class="il-white" cx="92" cy="61" r="1"/>
    <path class="il-line il-thick" d="M62 55l12 4M98 55l-12 4"/>
    <path class="il-dark il-ink" d="M64 76q16 14 32 0z"/>
    <path class="il-white" d="M67 76.5l3 4 3-4zM75 77l3 4 3-4zM83 77l3 4 3-4zM91 76.5l-2 3.5-2-3.5z"/>
    <path class="il-pink" d="M74 84q6 3 12 0q-6-3-12 0z"/>
    <path class="il-metal il-ink" d="M104 72h12l12 14h-14z"/>
    <g class="il-wood il-ink il-thin"><rect x="132" y="86" width="5" height="3" rx="1" transform="rotate(20 134 87)"/><rect x="140" y="80" width="5" height="3" rx="1" transform="rotate(-30 142 81)"/><rect x="146" y="92" width="5" height="3" rx="1"/><rect x="136" y="98" width="5" height="3" rx="1" transform="rotate(40 138 99)"/><rect x="152" y="84" width="5" height="3" rx="1" transform="rotate(10 154 85)"/></g>
    <path class="il-green il-ink il-thin" d="M30 12c4-6 10-6 12-2-4 2-8 3-12 2zM118 6c4-6 10-5 12-1-4 2-8 2-12 1zM50 6c-2-5 2-9 6-8 0 4-2 7-6 8zM104 30c4-4 10-2 10 2-4 1-7 0-10-2z"/>
    <path class="il-wood-dark il-ink il-thin" d="M66 6l8 4-1 2-8-4zM34 24l6-6 2 1-6 6z"/>
    <path class="il-line il-thin" d="M60 14l-4-4M100 12l3-5M70 2l1 4"/>
    <path class="il-line il-thick" d="M42 80c-10 2-12 12-20 12s-10-6-16-4"/>
    <rect class="il-dark il-ink il-thin" x="0" y="84" width="8" height="8" rx="1"/>
    <path class="il-yellow il-ink il-thin" d="M14 76l-4 5h3l-2 5 5-6h-3l2-4z"/>
    <path class="il-stone il-ink" d="M10 114c0-4 4-6 8-6h4l2-8 4 0-1 8h12c6 0 8 6 4 6z"/>
    <circle class="il-orange il-ink" cx="32" cy="104" r="9"/>
    <path class="il-line il-thin" d="M32 104c2 0 3-2 2-4-2-2-6-1-6 2 0 4 4 6 8 4"/>
    <circle class="il-white il-ink il-thin" cx="21.4" cy="98" r="2.2"/><circle class="il-white il-ink il-thin" cx="26.4" cy="98.4" r="2.2"/>
    <path class="il-stone il-ink il-thin" d="M19.4 97.6a2.2 2.2 0 0 1 4.2 0zM24.4 98a2.2 2.2 0 0 1 4.2 0z"/>
    <path class="il-line il-thin" d="M18 110q3 2 6 0"/>
    <path class="il-line il-thin il-dash" d="M112 46 142 20"/>
    <ellipse class="il-white il-ink il-thin" cx="144" cy="9" rx="5" ry="3" transform="rotate(-30 144 9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="152" cy="11" rx="5" ry="3" transform="rotate(30 152 11)" opacity="0.85"/>
    <ellipse class="il-yellow il-ink" cx="148" cy="18" rx="8" ry="6" transform="rotate(-40 148 18)"/>
    <path class="il-line il-thick" d="M146 13l-4 6M151 15l-4 6"/>
    <circle class="il-dark il-ink il-thin" cx="153.5" cy="12" r="3.5"/>
    <circle class="il-white" cx="154" cy="11" r="1.2"/>
    <ellipse class="il-water il-ink il-thin" cx="140" cy="28" rx="1.4" ry="2.2"/>`,

  // Summer camp: three children of different skin tones lean in, each holding a magnifier over one eye (giant
  // magnified eyes), one pointing — at a sweating little red ant in a pool of light, already wearing a label tag.
  'bg.holiday-camp': `
    <rect class="il-grass" x="0" y="0" width="160" height="120"/>
    <path class="il-green" opacity="0.5" d="M0 20h160v4H0zM0 46h160v4H0z"/>
    <path class="il-grass il-ink il-thin" d="M8 118l2-7 2 7M150 118l2-7 2 7M30 112l2-6 2 6M128 112l2-6 2 6"/>
    <ellipse class="il-glow" opacity="0.3" cx="82" cy="96" rx="40" ry="16"/>
    <path class="il-blue il-ink" d="M0 66c2-12 10-18 24-18s22 6 24 18z"/>
    <path class="il-yellow il-ink" d="M58 58c2-12 10-18 22-18s20 6 22 18z"/>
    <path class="il-green il-ink" d="M112 66c2-12 10-18 24-18s22 6 24 18z"/>
    <circle class="il-skin il-ink" cx="24" cy="32" r="15"/>
    <path class="il-red il-ink" d="M9 30c0-12 7-18 15-18s15 6 15 18z"/>
    <path class="il-red il-ink" d="M22 28h22v4H22z"/>
    <circle class="il-dark" cx="18" cy="35" r="2"/>
    <path class="il-line il-thin" d="M14 30l6 1"/>
    <ellipse class="il-dark" cx="23" cy="42" rx="2.4" ry="3"/>
    <path class="il-line il-thick" d="M36 44l10 14"/>
    <circle class="il-skin il-ink" cx="47" cy="59" r="4"/>
    <circle class="il-metal il-ink" cx="31" cy="35" r="10"/><circle class="il-white" opacity="0.9" cx="31" cy="35" r="7.6"/>
    <circle class="il-white il-ink il-thin" cx="31" cy="35" r="6.6"/><circle class="il-dark" cx="31" cy="38" r="3.6"/><circle class="il-white" cx="32.4" cy="36.6" r="1.2"/>
    <path class="il-light il-thin" d="M24 30a8 8 0 0 1 4-3"/>
    <circle class="il-dark" cx="72" cy="12" r="8"/><circle class="il-dark" cx="80" cy="8" r="8"/><circle class="il-dark" cx="88" cy="12" r="8"/>
    <circle class="il-wood-dark il-ink" cx="80" cy="24" r="15"/>
    <path class="il-dark" d="M66 18c2-8 8-12 14-12s12 4 14 12c-6-3-22-3-28 0z"/>
    <circle class="il-dark" cx="87" cy="26" r="2"/><circle class="il-white" cx="87.6" cy="25.4" r="0.7"/>
    <path class="il-dark il-ink il-thin" d="M73 32q7 8 14 0z"/>
    <path class="il-white" d="M75 32.4h10v1.6H75z"/>
    <path class="il-line il-thick" d="M66 36l-6 10"/>
    <circle class="il-wood-dark il-ink" cx="59" cy="47" r="4"/>
    <circle class="il-metal il-ink" cx="73" cy="26" r="10"/><circle class="il-white" opacity="0.9" cx="73" cy="26" r="7.6"/>
    <circle class="il-white il-ink il-thin" cx="73" cy="26" r="6.6"/><circle class="il-dark" cx="74" cy="29" r="3.6"/><circle class="il-white" cx="75.4" cy="27.6" r="1.2"/>
    <path class="il-wood-dark il-ink" d="M94 50c6 8 8 16 6 24l-4 1c0-8-2-14-6-20z"/>
    <circle class="il-wood-dark il-ink" cx="98" cy="77" r="3.6"/>
    <path class="il-wood-dark il-ink il-thin" d="M97 80l-3 6 2 1 3-6z"/>
    <ellipse class="il-orange il-ink" cx="118" cy="30" rx="5" ry="8" transform="rotate(20 118 30)"/>
    <ellipse class="il-orange il-ink" cx="152" cy="30" rx="5" ry="8" transform="rotate(-20 152 30)"/>
    <circle class="il-wood il-ink" cx="136" cy="32" r="15"/>
    <path class="il-orange il-ink" d="M121 30c0-12 7-18 15-18s15 6 15 18c-4-6-10-8-15-8s-11 2-15 8z"/>
    <g class="il-orange"><circle cx="130" cy="38" r="0.8"/><circle cx="127" cy="40" r="0.8"/><circle cx="145" cy="38" r="0.8"/></g>
    <circle class="il-dark" cx="129" cy="34" r="2"/><circle class="il-white" cx="129.6" cy="33.4" r="0.7"/>
    <path class="il-dark il-ink il-thin" d="M130 42q6 5 10 0z"/>
    <path class="il-line il-thick" d="M146 46l-6 14"/>
    <circle class="il-wood il-ink" cx="139" cy="62" r="4"/>
    <circle class="il-metal il-ink" cx="142" cy="34" r="10"/><circle class="il-white" opacity="0.9" cx="142" cy="34" r="7.6"/>
    <circle class="il-white il-ink il-thin" cx="142" cy="34" r="6.6"/><circle class="il-dark" cx="140" cy="37" r="3.6"/><circle class="il-white" cx="141.4" cy="35.6" r="1.2"/>
    <path class="il-line" d="M70 99l-6 10M76 100l-1 11M80 100l4 10M68 96l-10 0M88 97l8 10M90 95l8 4"/>
    <ellipse class="il-red il-ink" cx="98" cy="94" rx="13" ry="10"/>
    <path class="il-white" opacity="0.5" d="M92 88q6-4 12-1-6 0-10 4z"/>
    <ellipse class="il-red il-ink" cx="80" cy="94" rx="7" ry="5.4"/>
    <circle class="il-red il-ink" cx="64" cy="90" r="9"/>
    <path class="il-line il-thin" d="M60 82l-4-8-4 0M66 81l2-8 4-1"/>
    <circle class="il-white il-ink il-thin" cx="60" cy="88" r="3.6"/><circle class="il-white il-ink il-thin" cx="67.4" cy="88" r="3.6"/>
    <circle class="il-dark" cx="60.4" cy="87" r="1.1"/><circle class="il-dark" cx="67" cy="87" r="1.1"/>
    <path class="il-white il-ink il-thin" d="M58 95q6 3 12 0v2q-6 3-12 0z"/>
    <path class="il-line il-thin" d="M61 96v2M64 96.5v2M67 96v2"/>
    <ellipse class="il-water il-ink il-thin" cx="53" cy="84" rx="1.6" ry="2.4"/><ellipse class="il-water il-ink il-thin" cx="74" cy="80" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" d="M108 100l6 4"/>
    <path class="il-paper il-ink il-thin" d="M113 101l9-1 1 7-9 1z"/><path class="il-line il-thin" d="M115 104l5-.6"/>`,

  // A friendly-spooky potato-sack ghost with potato "eyes" spread over it opens its arms wide in the dark cellar
  // between the potato crates — and a beetle fumbling blindly through the dark walks straight into the hug.
  'bg.potato-cellar-spook': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 24h50M0 48h30M130 30h30M140 54h20M24 0v24M12 24v24M146 30v24"/>
    <rect class="il-night il-ink" x="58" y="4" width="26" height="12" rx="2"/>
    <path class="il-line il-thin" d="M66 4v12M75 4v12"/>
    <path class="il-light il-thin" opacity="0.5" d="M150 0l-10 10M150 0v12M150 0h-12M144 4q2 4 6 4M146 2q-4 2-4 6"/>
    <path class="il-line il-thin" d="M120 0v14"/>
    <rect class="il-metal il-ink il-thin" x="117" y="13" width="6" height="4" rx="1"/>
    <circle class="il-stone il-ink il-thin" cx="120" cy="21" r="5"/>
    <path class="il-earth-dark" d="M0 100h160v20H0z"/>
    <ellipse class="il-glow" opacity="0.12" cx="84" cy="56" rx="44" ry="42"/>
    <g class="il-gold il-ink il-thin"><ellipse cx="12" cy="70" rx="8" ry="5.4"/><ellipse cx="26" cy="68" rx="8" ry="6"/><ellipse cx="40" cy="70" rx="7.4" ry="5.4"/><ellipse cx="19" cy="64" rx="7" ry="5"/></g>
    <path class="il-line il-thin" d="M23 66q3 2 6 0M9 69q2 1.4 4 0"/>
    <g class="il-wood-dark"><circle cx="36" cy="69" r="0.8"/><circle cx="16" cy="62" r="0.8"/><circle cx="43" cy="71" r="0.8"/></g>
    <rect class="il-wood il-ink" x="2" y="72" width="46" height="30" rx="2"/>
    <path class="il-line il-thin" d="M2 82h46M2 92h46M14 72v30M36 72v30"/>
    <g class="il-gold il-ink il-thin"><ellipse cx="126" cy="64" rx="8" ry="5.4"/><ellipse cx="140" cy="62" rx="8" ry="6"/><ellipse cx="152" cy="65" rx="7" ry="5"/></g>
    <path class="il-line il-thin" d="M136 61q2 2 4 0M144 61q2 2 4 0M138 66q2 1 4 0"/>
    <rect class="il-wood il-ink" x="116" y="66" width="44" height="36" rx="2"/>
    <path class="il-line il-thin" d="M116 78h44M116 90h44M128 66v36M148 66v36"/>
    <path class="il-paper il-ink" d="M62 54c-8-8-18-10-28-8 4 6 12 10 22 14z"/>
    <path class="il-paper il-ink" d="M106 54c8-8 18-10 28-8-4 6-12 10-22 14z"/>
    <path class="il-paper il-ink" d="M58 96c-2-12 0-26 2-38 2-20 12-32 26-32 14 0 24 12 24 30 0 14 2 26 0 40l-6-6-6 8-6-8-6 8-6-8-6 8-6-8z"/>
    <path class="il-white" opacity="0.6" d="M66 48q2-14 14-18-8 6-10 18z"/>
    <g class="il-wood il-ink il-thin"><ellipse cx="68" cy="72" rx="2.6" ry="1.6"/><ellipse cx="100" cy="80" rx="2.6" ry="1.6"/><ellipse cx="92" cy="32" rx="2.4" ry="1.4"/><ellipse cx="76" cy="88" rx="2.4" ry="1.4"/><ellipse cx="104" cy="62" rx="2.2" ry="1.4"/><ellipse cx="86" cy="76" rx="2.2" ry="1.4"/><ellipse cx="72" cy="34" rx="2" ry="1.2"/></g>
    <path class="il-line il-thin" opacity="0.5" d="M40 50l4 2M126 50l-4 2"/>
    <ellipse class="il-dark" cx="76" cy="46" rx="5" ry="6.4"/><ellipse class="il-dark" cx="96" cy="46" rx="5" ry="6.4"/>
    <circle class="il-white" cx="77.6" cy="44" r="1.6"/><circle class="il-white" cx="97.6" cy="44" r="1.6"/>
    <path class="il-dark il-ink" d="M76 58q10 12 20 0z"/>
    <path class="il-pink" d="M81 62q5 3 10 0q-5-2-10 0z"/>
    <ellipse class="il-pink" opacity="0.6" cx="70" cy="56" rx="3.4" ry="2"/><ellipse class="il-pink" opacity="0.6" cx="102" cy="56" rx="3.4" ry="2"/>
    <g class="il-white"><circle cx="20" cy="104" r="1"/><circle cx="28" cy="106" r="1"/><circle cx="36" cy="104" r="1"/></g>
    <ellipse class="il-teal il-ink" cx="48" cy="104" rx="9" ry="6"/>
    <path class="il-line il-thin" d="M48 98v12"/>
    <path class="il-line il-thin" d="M44 109l-3 4M49 110v4M53 109l3 4"/>
    <path class="il-line" d="M60 98l8-4M61 104l8-1"/>
    <circle class="il-teal il-ink" cx="58" cy="100" r="5"/>
    <path class="il-line il-thin" d="M55 99q1.4 1.4 2.8 0M59 99q1.4 1.4 2.8 0M57 103h3"/>
    <path class="il-line il-thin" d="M56 95l-1-5M60 95l2-5"/>
    <path class="il-light il-thick" d="M38 80c0-5 8-5 8 0 0 3-4 4-4 7M42 91v0.5"/>`,

  // A proud stag beetle with huge antler-like pincers stands on a log, chin up, eyes half-closed, dreaming of himself
  // as a majestic stag (thought bubble). A ladybird on the log end holds in a giggle.
  'bg.stag-beetle': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-green" opacity="0.7" d="M0 74c16-10 34-8 46-2 12-8 30-8 42 0 14-8 32-8 44 0 10-4 20-4 28 0v48H0z"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-grass il-ink il-thin" d="M8 118l2-7 2 7M150 118l2-7 2 7M20 112l2-6 2 6"/>
    <rect class="il-wood il-ink" x="14" y="84" width="128" height="22" rx="11"/>
    <path class="il-line il-thin" opacity="0.5" d="M30 92h22M60 98h26M96 90h20M40 100h10"/>
    <ellipse class="il-paper il-ink" cx="140" cy="95" rx="8" ry="11"/>
    <path class="il-line il-thin" opacity="0.6" d="M140 89c-3 0-4 3-4 6s2 6 4 6 4-3 4-6"/>
    <path class="il-line" d="M66 66l-8 18M76 72l-4 13M92 74l0 11M104 74l4 11M114 72l8 12M120 68l12 10"/>
    <ellipse class="il-wood-dark il-ink" cx="102" cy="62" rx="26" ry="14"/>
    <path class="il-line il-thin" d="M78 60q24-6 50 0"/>
    <path class="il-light il-thin" d="M90 54q10-4 22-2M86 66q6 4 14 4"/>
    <ellipse class="il-wood-dark il-ink" cx="74" cy="58" rx="10" ry="10"/>
    <path class="il-light il-thin" d="M70 52q3-2 6-1"/>
    <path class="il-earth-dark il-ink" d="M50 46C42 32 30 26 14 28c8 3 14 7 18 13l-5-1 5 6c5 1 10 3 14 7z"/>
    <path class="il-earth-dark il-ink" d="M48 58C40 70 28 76 12 74c8-3 14-7 18-13l-5 2 5-6c5-1 10-3 14-6z"/>
    <ellipse class="il-earth-dark il-ink" cx="58" cy="52" rx="11" ry="9"/>
    <path class="il-line il-thin" d="M60 44l-2-8-6-2M64 45l3-8 6-2"/>
    <circle class="il-white il-ink il-thin" cx="62" cy="50" r="3.6"/><circle class="il-dark" cx="63" cy="51.4" r="1.6"/>
    <path class="il-earth-dark il-ink il-thin" d="M58.4 50a3.6 3.6 0 0 1 7.2 0z"/>
    <path class="il-line" d="M57 44l9 1"/>
    <path class="il-line il-thin" d="M54 57q4 2 8-1"/>
    <circle class="il-white il-ink il-thin" cx="66" cy="38" r="2"/><circle class="il-white il-ink il-thin" cx="73" cy="30" r="3"/>
    <ellipse class="il-white il-ink" cx="108" cy="22" rx="30" ry="19"/>
    <ellipse class="il-wood il-ink" cx="99" cy="21" rx="5" ry="2.4" transform="rotate(25 99 21)"/>
    <ellipse class="il-wood il-ink" cx="117" cy="21" rx="5" ry="2.4" transform="rotate(-25 117 21)"/>
    <path class="il-line il-thick" d="M104 17c-4-4-6-8-6-12M99 10l-5-2M98 6l-4-3M112 17c4-4 6-8 6-12M117 10l5-2M118 6l4-3"/>
    <ellipse class="il-wood il-ink" cx="108" cy="26" rx="6" ry="9.6"/>
    <path class="il-paper" d="M105 30q3 4 6 0v4q-3 3-6 0z"/>
    <ellipse class="il-dark" cx="108" cy="34" rx="2.4" ry="1.8"/>
    <circle class="il-dark" cx="105.4" cy="23" r="1.1"/><circle class="il-dark" cx="110.6" cy="23" r="1.1"/>
    <path class="il-gold il-ink il-thin" d="M84 14l2-4 2 4 4 1-4 1-2 4-2-4-4-1zM128 30l1.5-3 1.5 3 3 1-3 1-1.5 3-1.5-3-3-1z"/>
    <path class="il-line" d="M131 85l-2 5M137 86l0 5"/>
    <ellipse class="il-red il-ink" cx="138" cy="80" rx="9" ry="7"/>
    <path class="il-line il-thin" d="M138 73v14"/>
    <g class="il-dark"><circle cx="134" cy="77" r="1.6"/><circle cx="142" cy="78" r="1.6"/><circle cx="135" cy="83" r="1.4"/><circle cx="142" cy="83" r="1.4"/></g>
    <circle class="il-dark il-ink il-thin" cx="128" cy="78" r="4.4"/>
    <path class="il-light il-thin" d="M125.4 76.6q1.2-1.2 2.4 0M128.6 76.6q1.2-1.2 2.4 0"/>
    <path class="il-dark il-ink il-thin" d="M124 82l6-2 2 2-6 2z"/>
    <ellipse class="il-water il-ink il-thin" cx="122" cy="76" rx="1.2" ry="1.8"/>
    <path class="il-line il-thin" d="M120 70l-2-3M124 68l-1-3M146 70l2-3"/>`,
  // A potted Venus flytrap on the windowsill grins with its big trap wide open, lured fly drifting in along a
  // nectar-scent trail; a ringing alarm clock beside it (snaps on schedule). A closed trap holds a sulking fly.
  'bg.flytrap': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="96" y="6" width="58" height="64" rx="2"/>
    <path class="il-white" opacity="0.8" d="M108 22c0-4 6-6 8-2 2-3 8-2 8 2 3 0 3 4 0 4h-16c-3 0-3-4 0-4z"/>
    <path class="il-white il-ink il-thin" d="M124 6h4v64h-4zM96 36h58v4H96z"/>
    <rect class="il-wood il-ink" x="0" y="96" width="160" height="8"/>
    <path class="il-wood-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.4" d="M10 100h20M60 100h30M120 100h24"/>
    <path class="il-green il-ink" d="M70 74c-6-10-16-16-26-18 2 8 10 16 22 20z"/>
    <path class="il-green il-ink" d="M78 74c-6-10 0-22 2-32 6 10 2 22 2 32z"/>
    <path class="il-green il-ink" d="M86 74c6-6 16-8 24-6-4 6-12 8-22 8z"/>
    <path class="il-green il-ink" d="M30 54c4-10 20-12 28-2-8 10-24 10-28 2z"/>
    <path class="il-white il-ink il-thin" d="M31 53l3-3 3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4 2 2"/>
    <ellipse class="il-white il-ink il-thin" cx="40" cy="44" rx="5" ry="3" transform="rotate(-30 40 44)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="48" cy="43" rx="5" ry="3" transform="rotate(30 48 43)" opacity="0.85"/>
    <circle class="il-red il-ink il-thin" cx="40" cy="56.6" r="1.8"/><circle class="il-red il-ink il-thin" cx="45" cy="56.6" r="1.8"/>
    <path class="il-green" d="M37.6 56h4.8v-1.6h-4.8zM42.6 56h4.8v-1.6h-4.8z"/>
    <g transform="rotate(-24 82 44)">
      <path class="il-green il-ink" d="M80 44c4-16 34-18 40 0z"/>
      <path class="il-red" d="M85 44c4-8 26-9 31 0z"/>
      <path class="il-white il-ink il-thin" d="M86 44l2 5 2-5M94 44l2 5 2-5M102 44l2 5 2-5M110 44l2 5 2-5"/>
      <circle class="il-white il-ink" cx="96" cy="30" r="4.6"/><circle class="il-dark" cx="98" cy="31" r="2.2"/>
      <circle class="il-white il-ink" cx="106" cy="31" r="4.2"/><circle class="il-dark" cx="108" cy="32" r="2"/>
      <path class="il-line" d="M90 25l8 1M103 25l7 2"/>
    </g>
    <g transform="rotate(18 82 46)">
      <path class="il-green il-ink" d="M80 46c4 16 34 18 40 0z"/>
      <path class="il-red" d="M85 46c4 8 26 9 31 0z"/>
      <path class="il-white il-ink il-thin" d="M88 46l2-5 2 5M96 46l2-5 2 5M104 46l2-5 2 5M112 46l2-5 2 5"/>
      <path class="il-pink" d="M94 50q8 4 14 0q-6-2-14 0z"/>
    </g>
    <circle class="il-yellow il-ink il-thin" cx="108" cy="66" r="1.8"/><circle class="il-yellow il-ink il-thin" cx="104" cy="72" r="1.4"/>
    <path class="il-earth il-ink" d="M54 80h48l-5 16H59z"/>
    <rect class="il-earth il-ink" x="50" y="74" width="56" height="8" rx="2"/>
    <path class="il-earth-dark" d="M52 75h52v2H52z"/>
    <path class="il-white" opacity="0.4" d="M58 84h4l-1 8h-3z"/>
    <path class="il-line il-thin il-dash" d="M118 40q6-6 10 0t10 0t8-4"/>
    <ellipse class="il-white il-ink il-thin" cx="146" cy="46" rx="5" ry="3" transform="rotate(-40 146 46)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="153" cy="46" rx="5" ry="3" transform="rotate(40 153 46)" opacity="0.85"/>
    <ellipse class="il-grey il-ink" cx="150" cy="56" rx="5" ry="6"/>
    <circle class="il-grey il-ink" cx="144" cy="52" r="4.4"/>
    <circle class="il-red il-ink il-thin" cx="141.6" cy="51" r="2.2"/><circle class="il-red il-ink il-thin" cx="146" cy="50.6" r="2.2"/>
    <path class="il-line il-thin" d="M140.6 49.6q1 1.4 2 0M145 49.2q1 1.4 2 0"/>
    <path class="il-red" d="M146 60c-2-3-5-1-3 1l3 3 3-3c2-2-1-4-3-1z"/>
    <path class="il-line il-thin" d="M146 61l-2 4M151 62l1 4M154 60l3 3"/>
    <path class="il-line" d="M14 96l-2 0M30 96l2 0"/>
    <path class="il-metal il-ink il-thin" d="M10 78a6 6 0 0 1 8-6zM34 78a6 6 0 0 0-8-6z"/>
    <circle class="il-red il-ink" cx="22" cy="84" r="11"/>
    <circle class="il-white il-ink il-thin" cx="22" cy="84" r="7.6"/>
    <path class="il-line il-thin" d="M22 84v-5M22 84l4 2"/>
    <path class="il-dark il-ink il-thin" d="M14 94l-3 3M30 94l3 3"/>
    <path class="il-line il-thin" d="M6 74l-4-3M38 74l4-3M4 84H0M40 84h4"/>`,

  // A grinning kettle barbecue with a face on its bowl sizzles sausages and a burger, flames licking between them; a
  // big smoke cloud rises, and three wasps in little bibs fly in with knives and forks.
  'bg.barbecue': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-green" opacity="0.7" d="M0 84c10-10 24-10 30-2 10-8 24-6 30 2v14H0zM110 84c8-10 22-10 30-2 8-6 16-6 20-2v18h-50z"/>
    <path class="il-grass" d="M0 98h160v22H0z"/>
    <path class="il-line il-thick" d="M62 84 50 108M98 84l12 24M80 88v20"/>
    <circle class="il-dark il-ink" cx="50" cy="109" r="4"/><circle class="il-dark il-ink" cx="110" cy="109" r="4"/>
    <path class="il-smoke il-ink il-thin" d="M66 30c-8 0-10-10-2-12 0-8 10-10 14-4 4-8 16-8 18 0 6-6 18-2 16 6 8 0 10 10 2 12 4 6-4 12-10 8-4 6-14 6-18 0-6 4-16 2-14-6-6 2-10-2-6-4z"/>
    <path class="il-smoke" opacity="0.7" d="M74 46c-4 0-5-5-1-6 0-4 6-5 8-2 2-3 8-3 9 1 4 0 4 6 0 7z"/>
    <path class="il-orange il-ink il-thin" d="M58 52l2-6 2 3 2-5 2 8zM80 52l2-6 2 3 2-5 2 8zM102 52l2-6 2 3 2-5 2 8z"/>
    <rect class="il-earth il-ink" x="38" y="44" width="18" height="8" rx="4"/>
    <path class="il-line il-thin" d="M43 45l-2 6M48 45l-2 6M53 45l-2 6"/>
    <rect class="il-earth il-ink" x="62" y="43" width="18" height="8" rx="4" transform="rotate(-6 71 47)"/>
    <path class="il-line il-thin" d="M67 44l-2 6M72 43.6l-2 6M77 43l-2 6"/>
    <ellipse class="il-wood-dark il-ink" cx="96" cy="48" rx="10" ry="4.4"/>
    <path class="il-line il-thin" d="M90 47l3-3M95 48l3-3M100 49l3-3"/>
    <rect class="il-earth il-ink" x="108" y="44" width="18" height="8" rx="4"/>
    <path class="il-line il-thin" d="M113 45l-2 6M118 45l-2 6M123 45l-2 6"/>
    <path class="il-line il-thin" d="M46 38q-2-4 0-6M72 36q-2-4 0-6M116 38q-2-4 0-6"/>
    <path class="il-dark il-ink" d="M34 56h92c0 22-20 34-46 34S34 78 34 56z"/>
    <rect class="il-metal il-ink" x="30" y="52" width="100" height="5" rx="2.5"/>
    <path class="il-light il-thin" opacity="0.5" d="M42 62q4 12 16 18"/>
    <circle class="il-white il-ink" cx="66" cy="66" r="6"/><circle class="il-dark" cx="67" cy="67" r="3"/><circle class="il-white" cx="68" cy="66" r="1"/>
    <circle class="il-white il-ink" cx="94" cy="66" r="6"/><circle class="il-dark" cx="93" cy="67" r="3"/><circle class="il-white" cx="94" cy="66" r="1"/>
    <path class="il-light" d="M58 58l10 4M102 58l-10 4"/>
    <path class="il-red il-ink" d="M66 76q14 10 28 0z"/>
    <path class="il-white" d="M70 76.6l2 3 2-3zM78 77l2 3 2-3zM86 76.6l2 3 2-3z"/>
    <g transform="translate(22 30)">
      <ellipse class="il-white il-ink il-thin" cx="-2" cy="-7" rx="5" ry="3" transform="rotate(-30 -2 -7)" opacity="0.85"/>
      <ellipse class="il-white il-ink il-thin" cx="5" cy="-7" rx="5" ry="3" transform="rotate(30 5 -7)" opacity="0.85"/>
      <ellipse class="il-yellow il-ink" cx="-2" cy="0" rx="8" ry="5"/>
      <path class="il-line il-thick" d="M-4 -4v8M1 -4v8"/>
      <circle class="il-yellow il-ink" cx="9" cy="-1" r="4.4"/>
      <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="1.8"/><circle class="il-dark" cx="10.6" cy="-1.6" r="0.8"/>
      <path class="il-white il-ink il-thin" d="M6 3h7l-3 4z"/>
      <path class="il-line il-thin" d="M13 3l7 3M20 6l4-2.4M20 6h4.6M20 6l4 2.4"/>
    </g>
    <g transform="translate(140 44) scale(-1 1)">
      <ellipse class="il-white il-ink il-thin" cx="-2" cy="-7" rx="5" ry="3" transform="rotate(-30 -2 -7)" opacity="0.85"/>
      <ellipse class="il-white il-ink il-thin" cx="5" cy="-7" rx="5" ry="3" transform="rotate(30 5 -7)" opacity="0.85"/>
      <ellipse class="il-yellow il-ink" cx="-2" cy="0" rx="8" ry="5"/>
      <path class="il-line il-thick" d="M-4 -4v8M1 -4v8"/>
      <circle class="il-yellow il-ink" cx="9" cy="-1" r="4.4"/>
      <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="1.8"/><circle class="il-dark" cx="10.6" cy="-1.6" r="0.8"/>
      <path class="il-white il-ink il-thin" d="M6 3h7l-3 4z"/>
      <path class="il-metal il-ink il-thin" d="M14 2l6 3-1 1z"/>
    </g>
    <g transform="translate(134 14) scale(-0.8 0.8)">
      <ellipse class="il-white il-ink il-thin" cx="-2" cy="-7" rx="5" ry="3" transform="rotate(-30 -2 -7)" opacity="0.85"/>
      <ellipse class="il-white il-ink il-thin" cx="5" cy="-7" rx="5" ry="3" transform="rotate(30 5 -7)" opacity="0.85"/>
      <ellipse class="il-yellow il-ink" cx="-2" cy="0" rx="8" ry="5"/>
      <path class="il-line il-thick" d="M-4 -4v8M1 -4v8"/>
      <circle class="il-yellow il-ink" cx="9" cy="-1" r="4.4"/>
      <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="1.8"/><circle class="il-dark" cx="10.6" cy="-1.6" r="0.8"/>
      <path class="il-white il-ink il-thin" d="M6 3h7l-3 4z"/>
    </g>
    <path class="il-line il-thin il-dash" d="M30 36q10 6 18 2M126 46q-6 0-12-4"/>`,

  // A giant green wellington boot (muddy tread) hovers just above the vegetable patch, its shadow right next to a
  // little worm in a hard hat who stares up in shock. Up top, the giant whistles away, noticing nothing.
  'bg.gardener-giant': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 84h160v36H0z"/>
    <path class="il-earth-dark" d="M0 96c40-4 120-4 160 0v4c-40-4-120-4-160 0zM0 110c40-4 120-4 160 0v4c-40-4-120-4-160 0z"/>
    <circle class="il-green il-ink" cx="12" cy="84" r="9"/><path class="il-line il-thin" d="M12 78v12M7 82q5 4 10 0"/>
    <circle class="il-green il-ink" cx="148" cy="84" r="9"/><path class="il-line il-thin" d="M148 78v12M143 82q5 4 10 0"/>
    <path class="il-green il-ink il-thin" d="M132 104l-3-8 3 3 1-6 2 6 3-3-3 8zM140 116l-3-8 3 3 1-6 2 6 3-3-3 8z"/>
    <ellipse class="il-dark" opacity="0.35" cx="88" cy="104" rx="40" ry="6"/>
    <path class="il-line il-thin" d="M40 8v18M36 30v10M136 34v16M140 52v8"/>
    <path class="il-green il-ink" d="M52-4h40v48c18 0 34 8 36 22v4H48c-4-20-2-50 4-74z"/>
    <path class="il-white" opacity="0.35" d="M58 0h6v40h-6z"/>
    <path class="il-line il-thin" opacity="0.5" d="M92 44c-6 4-8 10-8 18"/>
    <path class="il-dark il-ink" d="M46 68h84v6c0 3-2 5-5 5H50c-3 0-4-2-4-5z"/>
    <path class="il-light il-thin" d="M52 76l3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3"/>
    <g class="il-earth-dark il-ink il-thin"><ellipse cx="62" cy="86" rx="3" ry="2.4"/><ellipse cx="96" cy="90" rx="2.4" ry="2"/><ellipse cx="114" cy="85" rx="2" ry="1.6"/></g>
    <ellipse class="il-dark" cx="132" cy="16" rx="3.4" ry="2.4" transform="rotate(-20 132 16)"/>
    <path class="il-line" d="M135 15V4l6 2"/>
    <ellipse class="il-dark" cx="146" cy="24" rx="3.4" ry="2.4" transform="rotate(-20 146 24)"/>
    <ellipse class="il-dark" cx="156" cy="20" rx="3.4" ry="2.4" transform="rotate(-20 156 20)"/>
    <path class="il-line" d="M149 23v-11l10-3v10"/>
    <path class="il-line il-thin" d="M120 8q4-4 8 0M118 2q6-4 12 0"/>
    <path class="il-pink il-ink" d="M4 100c-2 14 10 18 20 18s18-6 18-16h-9c0 6-4 8-9 8s-11-2-11-10z"/>
    <path class="il-line il-thin" opacity="0.6" d="M8 104l5 0M10 110l4-3M17 112l1-4M24 113v-4M30 111l-2-4M35 106h-5"/>
    <path class="il-pink il-ink" d="M33 102c0-4 0-8 2-10h9c2 4 2 8 0 10z"/>
    <circle class="il-pink il-ink" cx="38" cy="88" r="9"/>
    <path class="il-yellow il-ink" d="M28 85c0-8 4-12 10-12s10 4 10 12z"/>
    <path class="il-yellow il-ink il-thin" d="M26 84h24v3H26z"/>
    <circle class="il-white il-ink il-thin" cx="34.4" cy="89" r="3.4"/><circle class="il-white il-ink il-thin" cx="41.6" cy="89" r="3.4"/>
    <circle class="il-dark" cx="35.4" cy="87.8" r="1.2"/><circle class="il-dark" cx="42.6" cy="87.8" r="1.2"/>
    <ellipse class="il-dark" cx="38.4" cy="94.6" rx="1.8" ry="2.2"/>
    <path class="il-line il-thin" d="M22 80l-4-4M24 74l-2-5M52 80l4-4M50 74l2-5"/>
    <ellipse class="il-water il-ink il-thin" cx="48" cy="90" rx="1.6" ry="2.4"/>`,

  // A brown food-waste bin in the summer heat, lid perched askew on a mountain of peelings, flies buzzing, stink lines
  // rising — it has grown so settled that it has its own little flag and a letterbox (with post) in front.
  'bg.organic-bin': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow il-ink" cx="18" cy="16" r="9"/>
    <path class="il-line il-thin" d="M18 2V0M30 6l2-2M32 16h3M30 26l2 2M6 26l-2 2M4 16H1M6 6 4 4"/>
    <path class="il-grey" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 100h160M40 100l-6 20M100 100l4 20"/>
    <ellipse class="il-slime" opacity="0.7" cx="72" cy="110" rx="34" ry="5"/>
    <circle class="il-dark il-ink" cx="52" cy="104" r="6"/><circle class="il-dark il-ink" cx="94" cy="104" r="6"/>
    <rect class="il-wood-dark il-ink" x="42" y="8" width="64" height="8" rx="3" transform="rotate(-8 74 12)"/>
    <path class="il-line il-thin" d="M50 18l2 18M96 12l2 24"/>
    <path class="il-earth-dark il-ink" d="M42 34c0-8 6-14 14-12 4-8 16-10 22-2 8-6 22-2 22 8 6 2 8 6 6 10H42z"/>
    <path class="il-green il-ink il-thin" d="M44 32c2-8 10-10 14-6-4 2-8 4-14 6zM86 22c6-4 12-2 12 2-4 2-8 1-12-2z"/>
    <path class="il-white il-ink il-thin" d="M60 28l3-4 3 4 3-4 3 4c0 4-12 4-12 0z"/>
    <path class="il-red il-ink il-thin" d="M74 26c-3-6 1-10 4-8 3-2 7 2 4 8-1 3-7 3-8 0z"/>
    <path class="il-paper il-ink il-thin" d="M88 30h8v7h-8z"/><path class="il-line il-thin" d="M92 30l2-8"/>
    <path class="il-white il-ink il-thin" d="M50 18l-6-6M46 16l2-4M48 18l-4-2M50 18l4 2"/>
    <path class="il-line" d="M70 4v16"/>
    <path class="il-red il-ink il-thin" d="M70 4h14l-3 4 3 4H70z"/>
    <circle class="il-white" cx="76" cy="8" r="1.6"/>
    <path class="il-wood-dark il-ink" d="M40 40h64l-5 62H45z"/>
    <path class="il-line il-thin" opacity="0.4" d="M52 46l2 52M92 46l-2 52"/>
    <rect class="il-earth-dark il-ink il-thin" x="38" y="38" width="68" height="6" rx="2"/>
    <path class="il-slime il-ink il-thin" d="M48 44v8c0 3 4 3 4 0v-8zM84 44v12c0 3 4 3 4 0V44z"/>
    <path class="il-line" d="M58 58q5-4 10 0M78 58q5-4 10 0"/>
    <path class="il-line il-thin" d="M58 54l9 1M88 54l-9 1"/>
    <path class="il-dark il-ink" d="M58 70q15 14 30 0q-15 4-30 0z"/>
    <path class="il-pink" d="M66 76q7 4 14 0q-7-2-14 0z"/>
    <path class="il-white" opacity="0.4" d="M46 50h4l-2 44h-3z"/>
    <path class="il-line il-thin" d="M60 18q-4-6 0-10t0-8M76 14q-4-6 0-10M30 44q-4-6 0-10t0-8M116 44q-4-6 0-10t0-8"/>
    <g class="il-dark"><circle cx="36" cy="30" r="1.6"/><circle cx="124" cy="24" r="1.6"/><circle cx="66" cy="4" r="1.6"/></g>
    <path class="il-white il-ink il-thin" opacity="0.8" d="M34 28l-2-3 3 1zM38 28l2-3-3 1zM122 22l-2-3 3 1zM126 22l2-3-3 1zM64 2l-2-2 3 0zM68 2l2-2-3 0z"/>
    <path class="il-line il-thin il-dash" d="M38 32q4 6 8 2M126 26q4 6-2 8"/>
    <rect class="il-wood-dark il-ink" x="132" y="72" width="5" height="30"/>
    <path class="il-blue il-ink" d="M122 74V62c0-6 4-8 8-8h6c4 0 8 2 8 8v12z"/>
    <path class="il-line il-thin" d="M126 66h12"/>
    <path class="il-line" d="M144 66v-12"/><path class="il-red il-ink il-thin" d="M144 54h7v5h-7z"/>
    <path class="il-white il-ink il-thin" d="M126 62l-4-6 10-2 2 6z"/><path class="il-line il-thin" d="M122 56l6 3 4-5"/>`,

  // Underground general assembly of the ants: rows of ants seen from behind (two fast asleep, one holding up a voting
  // card), the chair-ant at the lectern rings the bell beside a towering paper stack and an endless agenda — while a
  // bumblebee peeks in from the entrance tunnel, raising a leg to speak.
  'bg.ant-assembly': `
    <rect class="il-earth-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-earth il-ink" d="M4 120c-4-44 12-96 76-100 60 2 80 52 76 100z"/>
    <path class="il-earth il-ink" d="M-2 8h26l16 18-10 6-12-14H-2z"/>
    <path class="il-earth" d="M20 18l14 12 6-4-12-14z"/>
    <path class="il-line il-thin" opacity="0.5" d="M80 20v8M70 21l-2 6M96 22l2 6M120 30l-3 5"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="14" cy="60" rx="3" ry="2.2"/><ellipse cx="150" cy="94" rx="3" ry="2.2"/><ellipse cx="148" cy="12" rx="3.4" ry="2.4"/></g>
    <rect class="il-paper il-ink" x="98" y="26" width="34" height="42" rx="1"/>
    <path class="il-line il-thin" d="M102 32h18M102 37h22M102 42h16M102 47h22M102 52h20M102 57h18M102 62h22"/>
    <path class="il-green il-ink il-thin" d="M124 31l2 2 4-4M126 36l2 2 4-4"/>
    <circle class="il-red il-ink il-thin" cx="115" cy="27" r="1.6"/>
    <path class="il-paper il-ink il-thin" d="M126 70h16v-4h-16zM127 66h15v-4h-15zM125 62h16v-4h-16zM127 58h15v-4h-15zM126 54h16v-4h-16zM127 50h14v-4h-14z"/>
    <circle class="il-red il-ink" cx="114" cy="58" r="9"/>
    <path class="il-line il-thin" d="M110 50l-3-7-4-1M117 49l2-7 4-1"/>
    <circle class="il-white il-ink il-thin" cx="110.6" cy="57" r="3"/><circle class="il-white il-ink il-thin" cx="117.6" cy="57" r="3"/>
    <path class="il-line il-thin" d="M113.6 57h1"/>
    <circle class="il-dark" cx="110.6" cy="57.6" r="1.2"/><circle class="il-dark" cx="117.6" cy="57.6" r="1.2"/>
    <ellipse class="il-dark" cx="114" cy="63" rx="2.4" ry="1.6"/>
    <path class="il-line" d="M106 62l-8-12"/>
    <path class="il-gold il-ink il-thin" d="M92 46c0-4 3-6 6-6s6 2 6 6l1 2H91z"/><path class="il-line il-thin" d="M98 40v-4"/>
    <path class="il-line il-thin" d="M88 42l-3-2M88 48h-4M106 40l3-3"/>
    <path class="il-wood il-ink" d="M100 112l4-38h28l4 38z"/>
    <rect class="il-wood-dark il-ink" x="98" y="70" width="40" height="6" rx="2"/>
    <path class="il-line il-thin" opacity="0.5" d="M108 82h20M107 92h22"/>
    <rect class="il-wood il-ink" x="8" y="82" width="84" height="5" rx="2"/>
    <rect class="il-wood il-ink" x="2" y="106" width="94" height="5" rx="2"/>
    <g class="il-dark il-ink"><ellipse cx="22" cy="80" rx="8" ry="6"/><ellipse cx="58" cy="80" rx="8" ry="6"/></g>
    <g class="il-red il-ink"><ellipse cx="40" cy="80" rx="8" ry="6"/><ellipse cx="76" cy="80" rx="8" ry="6"/></g>
    <g class="il-dark il-ink"><circle cx="22" cy="70" r="6.4"/><circle cx="58" cy="70" r="6.4"/></g>
    <g class="il-red il-ink"><circle cx="40" cy="70" r="6.4"/><circle cx="76" cy="70" r="6.4"/></g>
    <path class="il-line il-thin" d="M19 65l-3-7M25 65l3-7M37 65l-3-7M43 65l3-7M55 65l-3-7M61 65l3-7M73 65l-3-7M79 65l3-7"/>
    <g class="il-red il-ink"><ellipse cx="14" cy="104" rx="8" ry="6"/><ellipse cx="50" cy="104" rx="8" ry="6"/><ellipse cx="86" cy="104" rx="8" ry="6"/></g>
    <g class="il-dark il-ink"><ellipse cx="32" cy="104" rx="8" ry="6"/><ellipse cx="68" cy="104" rx="8" ry="6"/></g>
    <g class="il-red il-ink"><circle cx="14" cy="94" r="6.4"/><circle cx="50" cy="94" r="6.4"/><circle cx="86" cy="94" r="6.4"/></g>
    <g class="il-dark il-ink"><circle cx="32" cy="94" r="6.4"/><circle cx="68" cy="94" r="6.4"/></g>
    <path class="il-line il-thin" d="M11 89l-3-7M17 89l3-7M29 89l-3-7M35 89l3-7M47 89l-3-7M53 89l3-7M65 89l-3-7M71 89l3-7M83 89l-3-7M89 89l3-7"/>
    <path class="il-line" d="M64 98l-6-16"/>
    <rect class="il-white il-ink il-thin" x="51" y="72" width="12" height="10" rx="1"/>
    <path class="il-line il-thin" d="M44 54h6l-6 6h6M50 46h4l-4 4h4"/>
    <path class="il-light il-thin" d="M86 78l5 0-5 5h5M90 72h4l-4 4h4"/>
    <path class="il-line il-thin" d="M22 60l4 0-4 4h4"/>
    <ellipse class="il-white il-ink il-thin" cx="26" cy="12" rx="6" ry="3.4" transform="rotate(-30 26 12)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="34" cy="13" rx="6" ry="3.4" transform="rotate(30 34 13)" opacity="0.85"/>
    <circle class="il-yellow il-ink" cx="28" cy="24" r="10"/>
    <path class="il-dark" d="M20 18q8 4 16 0l1 3q-9 5-18 0zM19 26q9 5 18 0l-1 3q-8 4-16 0z"/>
    <circle class="il-dark il-ink il-thin" cx="38" cy="26" r="5"/>
    <circle class="il-white il-ink il-thin" cx="39.6" cy="25" r="2"/><circle class="il-dark" cx="40.4" cy="25.6" r="0.9"/>
    <path class="il-light il-thin" d="M38 29.6q2 1 3.4-0.4"/>
    <path class="il-line" d="M34 32l4 6 2-8"/>`,

  // The big old badger at the forest edge at night, napkin tied round his neck, licks his lips and digs at a burrow;
  // down below, the worm with glasses sits in its chamber with a book, looking up nervously. Stink lines, one fly.
  'bg.old-badger': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-paper" cx="22" cy="14" r="8"/>
    <g class="il-white"><circle cx="54" cy="8" r="0.9"/><circle cx="90" cy="14" r="0.9"/><circle cx="112" cy="6" r="0.8"/></g>
    <path class="il-dark" opacity="0.8" d="M122 62V48h-14l14-14h-8l12-14h-6l12-16 12 16h-6l12 14h-8l14 14h-14v14zM148 62V52h-8l8-10h-5l7-10h-3l8-12 8 12v30z"/>
    <path class="il-earth" d="M0 62h160v58H0z"/>
    <path class="il-earth-dark" d="M0 98c40-6 100 4 160-2v24H0z"/>
    <path class="il-grass il-ink" d="M-2 58h98v6H-2zM112 58h50v6h-50z"/>
    <path class="il-grass il-ink il-thin" d="M10 58l2-6 2 6M40 58l2-5 2 5M130 58l2-6 2 6"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="20" cy="84" rx="4" ry="3"/><ellipse cx="60" cy="108" rx="3" ry="2.2"/><ellipse cx="148" cy="78" rx="3.4" ry="2.4"/></g>
    <path class="il-earth-dark il-ink" d="M94 60h20c0 10 4 16 12 22l-14 10c-10-8-16-18-18-32z"/>
    <ellipse class="il-earth-dark il-ink" cx="118" cy="98" rx="26" ry="12"/>
    <path class="il-earth-dark" d="M104 84l14-2 6 8-12 3z"/>
    <path class="il-pink il-ink" d="M100 102c-2 8 6 10 14 10s14-4 14-10h-6c0 4-4 5-8 5s-8-1-8-6z"/>
    <path class="il-line il-thin" opacity="0.6" d="M104 104h4M108 108l1-3M114 109v-3M120 108l-1-3"/>
    <rect class="il-paper il-ink il-thin" x="124" y="92" width="10" height="8" rx="1" transform="rotate(-10 129 96)"/>
    <path class="il-line il-thin" d="M129 92v8"/>
    <path class="il-pink il-ink" d="M122 104c2-4 2-8 0-10h-8c-2 2-2 6 0 10z"/>
    <circle class="il-pink il-ink" cx="118" cy="88" r="7.4"/>
    <circle class="il-white il-ink il-thin" cx="115" cy="87" r="2.8"/><circle class="il-white il-ink il-thin" cx="121.4" cy="87" r="2.8"/>
    <path class="il-line il-thin" d="M117.8 87h0.8M112 86l-2-1M124 86l2-1"/>
    <circle class="il-dark" cx="115.4" cy="86" r="1.1"/><circle class="il-dark" cx="121.8" cy="86" r="1.1"/>
    <path class="il-line il-thin" d="M116 92q2-1.4 4 0"/>
    <ellipse class="il-water il-ink il-thin" cx="128" cy="82" rx="1.4" ry="2.2"/>
    <path class="il-light il-thick" d="M138 82v-8M138 87v0.5"/>
    <path class="il-line il-thick" d="M30 58l-2 6M44 60l0 5M64 60l0 5"/>
    <ellipse class="il-grey il-ink" cx="52" cy="44" rx="38" ry="18"/>
    <path class="il-line il-thin" opacity="0.5" d="M24 36l4 3M34 32l3 4M46 30l2 4M58 30l1 4M70 32l0 4M30 48l4 2M44 50l3 2"/>
    <path class="il-dark" opacity="0.6" d="M20 40q30-14 64-6-30-2-64 6z"/>
    <path class="il-grey il-ink" d="M78 60l8 4 4-4zM94 56c4 2 6 4 8 4l-2 4-8-2z"/>
    <path class="il-white il-ink" d="M76 34c10-6 22-2 28 14l4 8c-2 2-6 2-8 0-12-2-22-8-24-22z"/>
    <path class="il-dark" d="M80 32c6-2 12 2 16 10l8 10c-4 0-6-2-8-4-6-6-12-10-16-16z"/>
    <path class="il-line il-thin" d="M80 32c6-2 12 2 16 10l8 10"/>
    <circle class="il-grey il-ink il-thin" cx="80" cy="30" r="4"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="42" r="2.6"/><circle class="il-dark" cx="91" cy="43.4" r="1.2"/>
    <ellipse class="il-dark il-ink il-thin" cx="106" cy="56" rx="3" ry="2.4"/>
    <path class="il-pink il-ink il-thin" d="M98 58q2 4 5 2"/>
    <path class="il-white il-ink" d="M78 48l14 6-12 8z"/>
    <g class="il-red"><circle cx="82" cy="52" r="1.1"/><circle cx="86" cy="54" r="1.1"/><circle cx="82" cy="57" r="1.1"/></g>
    <g class="il-earth-dark il-ink il-thin"><ellipse cx="112" cy="50" rx="2.4" ry="1.8"/><ellipse cx="118" cy="44" rx="2" ry="1.6"/><ellipse cx="108" cy="42" rx="1.8" ry="1.4"/></g>
    <path class="il-line il-thin" d="M114 54l4-2M110 46l2-3"/>
    <path class="il-light il-thin" opacity="0.6" d="M10 30q-4-4 0-8t0-8M6 46q-4-4 0-8"/>
    <circle class="il-dark" cx="14" cy="22" r="1.4"/><path class="il-white il-thin" opacity="0.8" d="M12 20l-2-2 3 0zM16 20l2-2-3 0z"/>`,

  // The mole king rises from the biggest molehill in a ruined lawn — gold crown, red ermine cape, pink paw waving
  // royally, little spade as a sceptre. Molehills everywhere: a garden gnome is stranded on one, a flowerpot toppled.
  'bg.great-mole': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink il-thin" d="M0 34h160v3H0zM0 42h160v3H0z"/>
    <path class="il-wood il-ink il-thin" d="M6 50V32l3-3 3 3v18zM26 50V32l3-3 3 3v18zM46 50V32l3-3 3 3v18zM66 50V32l3-3 3 3v18zM86 50V32l3-3 3 3v18zM106 50V32l3-3 3 3v18zM126 50V32l3-3 3 3v18zM146 50V32l3-3 3 3v18z"/>
    <path class="il-grass" d="M0 48h160v72H0z"/>
    <g class="il-earth-dark il-ink il-thin"><path d="M8 56c1-5 4-7 7-7s6 2 7 7z"/><path d="M40 54c1-4 3-6 6-6s5 2 6 6z"/><path d="M112 54c1-4 3-6 6-6s5 2 6 6z"/><path d="M142 58c1-5 4-7 7-7s6 2 7 7z"/><path d="M4 76c2-7 5-10 10-10s8 3 10 10z"/><path d="M146 70c1-5 3-7 6-7s6 2 7 7z"/></g>
    <path class="il-earth-dark il-ink" d="M110 88c2-12 8-18 18-18s16 6 18 18z"/>
    <path class="il-line il-thin" d="M126 72l-2-8M132 72l2-8"/>
    <path class="il-blue il-ink" d="M122 72c0-6 2-10 7-10s7 4 7 10z"/>
    <path class="il-red il-ink" d="M121 56l8-16 8 16z"/>
    <circle class="il-skin il-ink il-thin" cx="129" cy="58" r="4.4"/>
    <path class="il-beard il-ink il-thin" d="M124 59c1 8 9 8 10 0-3 2-7 2-10 0z"/>
    <circle class="il-dark" cx="127.4" cy="57.4" r="0.9"/><circle class="il-dark" cx="130.6" cy="57.4" r="0.9"/>
    <path class="il-blue il-ink il-thin" d="M136 64l6-6"/><circle class="il-skin il-ink il-thin" cx="143" cy="57" r="2"/>
    <ellipse class="il-water il-ink il-thin" cx="138" cy="50" rx="1.4" ry="2"/>
    <path class="il-earth il-ink" d="M10 104l14-10 10 12-12 8z"/>
    <path class="il-earth il-ink" d="M8 102l16-12 3 4-16 12z"/>
    <ellipse class="il-earth-dark" cx="34" cy="112" rx="10" ry="3"/>
    <path class="il-green il-ink il-thin" d="M30 106c6 0 10 2 14 6"/>
    <circle class="il-yellow il-ink il-thin" cx="46" cy="113" r="3"/>
    <path class="il-earth-dark il-ink" d="M28 122c4-24 22-38 50-38s46 14 50 38z"/>
    <g class="il-earth il-ink il-thin"><ellipse cx="46" cy="104" rx="3" ry="2"/><ellipse cx="104" cy="100" rx="3" ry="2"/><ellipse cx="70" cy="112" rx="2.4" ry="1.6"/><ellipse cx="96" cy="114" rx="2.6" ry="1.8"/></g>
    <path class="il-red il-ink" d="M52 96c2-16 8-24 14-28h24c6 4 12 12 14 28z"/>
    <path class="il-dark il-ink" d="M62 94c0-18 6-28 16-28s16 10 16 28z"/>
    <path class="il-white il-ink" d="M60 70h36c0 6-8 9-18 9s-18-3-18-9z"/>
    <g class="il-dark"><circle cx="66" cy="73" r="1"/><circle cx="74" cy="75" r="1"/><circle cx="82" cy="75" r="1"/><circle cx="90" cy="73" r="1"/></g>
    <ellipse class="il-dark il-ink" cx="78" cy="56" rx="16" ry="14"/>
    <path class="il-white" opacity="0.3" d="M68 48q4-6 12-6-6 2-10 8z"/>
    <path class="il-light il-thin" d="M70 54q3-2 6 0M80 54q3-2 6 0"/>
    <ellipse class="il-pink il-ink" cx="78" cy="62" rx="5" ry="3.6"/>
    <path class="il-light il-thin" opacity="0.7" d="M72 62l-8-1M72 64l-8 2M84 62l8-1M84 64l8 2"/>
    <path class="il-light il-thin" d="M75 67q3 2 6 0"/>
    <path class="il-gold il-ink" d="M64 46l2-14 6 6 6-9 6 9 6-6 2 14z"/>
    <circle class="il-red il-ink il-thin" cx="78" cy="40" r="2"/><circle class="il-blue il-ink il-thin" cx="69" cy="42" r="1.6"/><circle class="il-blue il-ink il-thin" cx="87" cy="42" r="1.6"/>
    <path class="il-line il-thin" d="M58 96 52 66"/>
    <path class="il-metal il-ink il-thin" d="M48 66c0-6 2-10 4-12 2 2 4 6 4 12z"/>
    <ellipse class="il-pink il-ink" cx="57" cy="86" rx="6" ry="5"/>
    <path class="il-line il-thin" d="M53 82l-2-3M56 81l-1-3M59 81v-3"/>
    <path class="il-dark il-ink" d="M92 80c4-4 8-10 10-16l4 2c-2 8-6 14-10 18z"/>
    <ellipse class="il-pink il-ink" cx="106" cy="60" rx="5.4" ry="6.4" transform="rotate(20 106 60)"/>
    <path class="il-line il-thin" d="M104 54l-1-4M107 54v-4M110 56l2-3"/>
    <path class="il-line il-thin" d="M114 54l4-2M114 62h4M100 48l-1-3"/>`,
};
