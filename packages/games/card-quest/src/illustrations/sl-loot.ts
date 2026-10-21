/* Spaceloot illustrations: loot. */
export const SL_LOOT: Readonly<Record<string, string>> = {
  // A grinning android whose wobbly head and loose arm are held on with grey space tape; even the porthole and a
  // grumpy cockroach on the wall have been taped up.
  'sl.space-taped': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 12h160M50 12v90M112 12v90"/>
    <g class="il-dark"><circle cx="54" cy="18" r="1.3"/><circle cx="108" cy="18" r="1.3"/><circle cx="54" cy="96" r="1.3"/><circle cx="116" cy="96" r="1.3"/><circle cx="20" cy="6" r="1.3"/><circle cx="80" cy="6" r="1.3"/><circle cx="140" cy="6" r="1.3"/></g>
    <circle class="il-metal il-ink" cx="26" cy="38" r="15"/>
    <circle class="il-night il-ink il-thin" cx="26" cy="38" r="10.5"/>
    <circle class="il-white" cx="22" cy="34" r="1.2"/><circle class="il-white" cx="30" cy="42" r="1"/><circle class="il-yellow" cx="29" cy="32" r="1.2"/>
    <path class="il-line il-thin" d="M20 32l6 6-3 4 6 5"/>
    <path class="il-stone il-ink il-thin" d="M14 30l26 14-2 4-26-14z"/>
    <path class="il-stone il-ink il-thin" d="M14 47l25-15 2 4-25 15z"/>
    <path class="il-line il-thin" d="M12 66l6 6-4 4 6 6 2 8"/>
    <path class="il-stone il-ink il-thin" d="M6 70h20v5H6zM8 82h18v5H8z"/>
    <rect class="il-dark" x="0" y="102" width="160" height="18"/>
    <path class="il-light il-thin" d="M0 104h160" opacity="0.4"/>
    <rect class="il-metal il-ink" x="66" y="86" width="10" height="14"/>
    <rect class="il-metal il-ink" x="84" y="86" width="10" height="14"/>
    <rect class="il-grey il-ink" x="61" y="98" width="17" height="7" rx="3"/>
    <rect class="il-grey il-ink" x="82" y="98" width="17" height="7" rx="3"/>
    <path class="il-metal il-ink" d="M44 64l10-4 4 26-10 3z"/>
    <circle class="il-grey il-ink" cx="50" cy="92" r="5"/>
    <rect class="il-teal il-ink" x="58" y="56" width="44" height="34" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="70" y="62" width="20" height="13" rx="2"/>
    <circle class="il-red" cx="75" cy="68.5" r="2"/><circle class="il-glow" cx="80" cy="68.5" r="2"/><circle class="il-yellow" cx="85" cy="68.5" r="2"/>
    <path class="il-line il-thin" d="M64 82h8M88 82h8"/>
    <path class="il-stone il-ink il-thin" d="M42 56l20 6-1 5-20-6zM42 70l20-10 2 4-20 10z"/>
    <path class="il-metal il-ink" d="M100 62l14-22 8 5-14 22z"/>
    <circle class="il-grey il-ink" cx="119" cy="40" r="5.5"/>
    <circle class="il-stone il-ink" cx="128" cy="30" r="10"/>
    <circle class="il-sky il-ink il-thin" cx="128" cy="30" r="4.5"/>
    <path class="il-stone il-ink il-thin" d="M136 36c6 6 0 12 6 20l-4 2c-6-8 0-14-6-19z"/>
    <g transform="rotate(14 80 54)">
      <rect class="il-grey il-ink" x="74" y="48" width="12" height="10"/>
      <rect class="il-metal il-ink" x="61" y="22" width="38" height="30" rx="7"/>
      <rect class="il-dark il-ink il-thin" x="65" y="26" width="30" height="20" rx="3"/>
      <path class="il-glow" d="M69 36q4-6 8 0q-4-2.5-8 0zM83 36q4-6 8 0q-4-2.5-8 0z"/>
      <path class="il-glow" d="M71 39h18q-9 8-18 0z"/>
      <path class="il-line" d="M80 22v-7"/>
      <circle class="il-red il-ink il-thin" cx="80" cy="13" r="3"/>
      <circle class="il-grey il-ink" cx="60" cy="37" r="3"/><circle class="il-grey il-ink" cx="100" cy="37" r="3"/>
      <path class="il-line il-thin" d="M98 26l4-3"/>
    </g>
    <path class="il-stone il-ink il-thin" d="M66 48l28 10-2 5-28-10z"/>
    <path class="il-stone il-ink il-thin" d="M64 60l28-12 2 5-28 12z"/>
    <ellipse class="il-wood-dark il-ink" cx="140" cy="80" rx="10" ry="7"/>
    <circle class="il-wood-dark il-ink" cx="140" cy="69" r="5"/>
    <path class="il-line il-thin" d="M137 65c-3-5-6-6-9-5M143 65c3-5 6-6 9-5M131 76l-5-2M131 84l-5 2M149 76l5-2M149 84l5 2"/>
    <circle class="il-white" cx="138" cy="69" r="1.5"/><circle class="il-white" cx="142.5" cy="69" r="1.5"/>
    <path class="il-line il-thin" d="M136 66l3 1M144.5 66l-3 1"/>
    <path class="il-stone il-ink il-thin" d="M126 76h28v6h-28z"/>`,

  // A mirror-shiny chrome android shows a squashed reflection of the purple slime monster in its belly; the monster
  // stares at itself, scratching its head with a tentacle under a big question mark.
  'sl.chrome-plated': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="12" cy="10" r="1"/><circle class="il-white" cx="96" cy="8" r="1.2"/><circle class="il-yellow" cx="148" cy="14" r="1.3"/>
    <circle class="il-white" cx="80" cy="30" r="0.9"/><circle class="il-white" cx="150" cy="40" r="1"/><circle class="il-white" cx="6" cy="50" r="0.9"/>
    <circle class="il-orange il-ink il-thin" cx="104" cy="16" r="6"/><path class="il-line il-thin" d="M99 14q5 3 10 0"/>
    <path class="il-stone" d="M0 100c30-4 60-4 90-2s50 0 70-2v24H0z"/>
    <ellipse class="il-grey il-ink il-thin" cx="20" cy="110" rx="8" ry="3"/><ellipse class="il-grey il-ink il-thin" cx="132" cy="112" rx="10" ry="3"/>
    <rect class="il-metal il-ink" x="36" y="92" width="10" height="12"/><rect class="il-metal il-ink" x="54" y="92" width="10" height="12"/>
    <rect class="il-metal il-ink" x="32" y="102" width="16" height="6" rx="3"/><rect class="il-metal il-ink" x="52" y="102" width="16" height="6" rx="3"/>
    <path class="il-metal il-ink" d="M22 66l-8 16 6 3 8-15z"/>
    <circle class="il-metal il-ink" cx="16" cy="86" r="4.5"/>
    <path class="il-metal il-ink" d="M78 66l8 14-6 3-7-13z"/>
    <circle class="il-metal il-ink" cx="85" cy="84" r="4.5"/>
    <ellipse class="il-metal il-ink" cx="50" cy="74" rx="28" ry="24"/>
    <ellipse class="il-white" cx="40" cy="62" rx="10" ry="5" transform="rotate(-25 40 62)" opacity="0.7"/>
    <path class="il-light" d="M28 76q2 10 10 16"/>
    <ellipse class="il-purple il-ink il-thin" cx="56" cy="80" rx="14" ry="8"/>
    <circle class="il-white" cx="52" cy="78" r="2.4"/><circle class="il-white" cx="60" cy="78" r="2.4"/>
    <circle class="il-dark" cx="51.4" cy="78" r="1.1"/><circle class="il-dark" cx="59.4" cy="78" r="1.1"/>
    <path class="il-line il-thin" d="M51 83q5 2 10 0"/>
    <rect class="il-metal il-ink" x="44" y="46" width="12" height="6"/>
    <rect class="il-metal il-ink" x="31" y="18" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="35" y="22" width="30" height="20" rx="3"/>
    <path class="il-glow" d="M41 30h7v3h-7zM54 30h7v3h-7z"/>
    <path class="il-glow" d="M44 37q8 4 14-1v2q-7 5-14 0z"/>
    <path class="il-white" d="M34 21l6 0-6 6z" opacity="0.8"/>
    <path class="il-line" d="M50 18v-7"/><circle class="il-metal il-ink il-thin" cx="50" cy="9" r="3"/>
    <path class="il-white" d="M24 50l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z"/>
    <path class="il-white" d="M74 20l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    <path class="il-white" d="M68 90l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    <path class="il-purple il-ink" d="M96 104c-6-20 0-50 26-52 26 2 34 30 30 52z"/>
    <path class="il-purple il-ink il-thin" d="M100 104c0 5 6 5 6 0M140 104c0 6 7 6 7 0"/>
    <path class="il-purple il-ink" d="M150 80c8-10 6-26-2-32-6-4-12 0-10 4 6 0 8 8 4 14z"/>
    <path class="il-line il-thin" d="M108 68c-3-2-5-1-6 1"/>
    <circle class="il-white il-ink" cx="114" cy="72" r="7"/><circle class="il-white il-ink" cx="131" cy="72" r="6"/>
    <circle class="il-dark" cx="110" cy="73" r="3"/><circle class="il-dark" cx="127.5" cy="73" r="2.6"/>
    <path class="il-line" d="M106 62l10 3M126 64l9-4"/>
    <path class="il-line" d="M114 88q4-4 8 0t8 0"/>
    <ellipse class="il-white" cx="132" cy="60" rx="4" ry="2" opacity="0.5"/>
    <path class="il-line il-thick" d="M116 30c0-9 13-9 13 0 0 6-7 6-7 13"/>
    <circle class="il-dark" cx="122" cy="49" r="2.2"/>`,

  // A chunky green reactor core with a radiation sign hums and glows contentedly; a cockroach in sunglasses reads
  // a book by its light.
  'sl.nuclear-powered': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 14h160" opacity="0.6"/>
    <rect class="il-grey il-ink" x="-2" y="18" width="164" height="7"/>
    <g class="il-dark"><circle cx="10" cy="21.5" r="1.2"/><circle cx="50" cy="21.5" r="1.2"/><circle cx="90" cy="21.5" r="1.2"/><circle cx="130" cy="21.5" r="1.2"/></g>
    <rect class="il-grey" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" d="M0 100h160M40 100l-6 20M100 100l4 20"/>
    <circle class="il-glow" cx="70" cy="66" r="52" opacity="0.12"/>
    <circle class="il-glow" cx="70" cy="66" r="40" opacity="0.2"/>
    <rect class="il-slime il-ink" x="40" y="40" width="60" height="54" rx="6"/>
    <path class="il-glow" d="M46 46h6v40h-6z" opacity="0.7"/>
    <rect class="il-metal il-ink" x="34" y="34" width="72" height="10" rx="3"/>
    <rect class="il-metal il-ink" x="34" y="90" width="72" height="10" rx="3"/>
    <g class="il-dark"><circle cx="40" cy="39" r="1.4"/><circle cx="100" cy="39" r="1.4"/><circle cx="40" cy="95" r="1.4"/><circle cx="100" cy="95" r="1.4"/></g>
    <rect class="il-yellow il-ink il-thin" x="57" y="47" width="26" height="22" rx="2"/>
    <g class="il-dark">
      <circle cx="70" cy="58" r="2.2"/>
      <path d="M68 54.5 64.5 48.4A9 9 0 0 1 75.5 48.4L72 54.5A4 4 0 0 0 68 54.5z"/>
      <path d="M68 54.5 64.5 48.4A9 9 0 0 1 75.5 48.4L72 54.5A4 4 0 0 0 68 54.5z" transform="rotate(120 70 58)"/>
      <path d="M68 54.5 64.5 48.4A9 9 0 0 1 75.5 48.4L72 54.5A4 4 0 0 0 68 54.5z" transform="rotate(240 70 58)"/>
    </g>
    <path class="il-line" d="M56 77q4-4 8 0M76 77q4-4 8 0"/>
    <path class="il-line" d="M62 83q8 6 16 0"/>
    <ellipse class="il-pink" cx="55" cy="83" rx="3" ry="2" opacity="0.7"/><ellipse class="il-pink" cx="85" cy="83" rx="3" ry="2" opacity="0.7"/>
    <path class="il-line il-thin" d="M28 52l-5 3 5 3-5 3 5 3M112 52l5 3-5 3 5 3-5 3M20 46l-4 3 4 3M120 46l4 3-4 3"/>
    <path class="il-glow" d="M70 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    <path class="il-metal il-ink il-thin" d="M106 92c10 0 10 8 20 8"/>
    <ellipse class="il-wood-dark il-ink" cx="136" cy="94" rx="11" ry="7"/>
    <circle class="il-wood-dark il-ink" cx="136" cy="80" r="6"/>
    <path class="il-line il-thin" d="M133 75c-2-6-6-8-10-7M139 75c2-6 6-8 10-6M127 98l-5 4M145 98l5 4M128 92l-6-1"/>
    <path class="il-dark il-ink il-thin" d="M130 79h5v3h-5zM137 79h5v3h-5z"/>
    <path class="il-line il-thin" d="M135 80.5h2"/>
    <path class="il-line il-thin" d="M134 85q2 1.5 4 0"/>
    <path class="il-paper il-ink il-thin" d="M124 92l12 3 12-3-2-10-10 3-10-3z"/>
    <path class="il-line il-thin" d="M136 85v10M127 85l7 2M127 88l7 2M138 87l7-2M138 90l7-2"/>
    <path class="il-wood-dark il-ink il-thin" d="M125 88l-3 4M147 88l3 4"/>`,

  // A wise old green alien with white eyebrows and a long beard lays three tentacles on a kneeling android's head
  // and mumbles a squiggly formula; the android glows with blissful sparkles.
  'sl.ancient-blessing': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="8" cy="12" r="1"/><circle class="il-white" cx="60" cy="6" r="1.1"/><circle class="il-white" cx="96" cy="28" r="0.9"/>
    <circle class="il-yellow" cx="150" cy="70" r="1.2"/><circle class="il-white" cx="110" cy="10" r="1"/>
    <circle class="il-orange il-ink" cx="138" cy="24" r="13"/>
    <path class="il-line il-thin" d="M128 18q10 4 20 0M127 26q10 4 22 1"/>
    <ellipse class="il-gold il-ink il-thin" cx="138" cy="25" rx="22" ry="5" transform="rotate(-12 138 25)"/>
    <path class="il-orange" d="M125 22a13 13 0 0 1 26 0z" transform="rotate(-12 138 25)"/>
    <path class="il-purple-dark" d="M0 104c40-8 100-8 160-2v18H0z"/>
    <path class="il-purple il-ink" d="M14 106c2-30 14-44 36-44s34 14 36 44z"/>
    <path class="il-line il-thin" d="M50 66v40M30 86q4 4 8 0M62 90q4 4 8 0"/>
    <path class="il-gold il-ink il-thin" d="M40 64l10 8 10-8"/>
    <ellipse class="il-green il-ink" cx="50" cy="40" rx="25" ry="23"/>
    <path class="il-line il-thin" d="M36 24q6-3 12 0M52 21q6-3 12 0M40 30q10-3 20 0"/>
    <circle class="il-white il-ink il-thin" cx="38" cy="42" r="4"/><circle class="il-white il-ink il-thin" cx="50" cy="40" r="4.4"/><circle class="il-white il-ink il-thin" cx="62" cy="42" r="4"/>
    <circle class="il-dark" cx="39" cy="43.5" r="1.6"/><circle class="il-dark" cx="51" cy="41.5" r="1.7"/><circle class="il-dark" cx="63" cy="43.5" r="1.6"/>
    <path class="il-green il-ink il-thin" d="M33.8 41a4.3 4.3 0 0 1 8.4 0zM45.5 39a4.6 4.6 0 0 1 9 0zM57.8 41a4.3 4.3 0 0 1 8.4 0z"/>
    <path class="il-beard il-ink il-thin" d="M32 36c2-4 8-4 11-1M44 33c2-4 10-4 12 0M57 35c3-3 9-3 11 1"/>
    <path class="il-beard il-ink" d="M40 52c4 4 16 4 20 0 2 12-2 26-10 40-6-12-12-26-10-40z"/>
    <path class="il-line il-thin" d="M46 58l2 16M54 58l-1 18M50 60v22"/>
    <path class="il-line il-thin" d="M45 52q5-3 10 0"/>
    <ellipse class="il-white il-ink il-thin" cx="24" cy="14" rx="16" ry="9"/>
    <path class="il-white" d="M30 21l6 8-1-8z"/><path class="il-line il-thin" d="M30 22.5l5 6.5-.6-7"/>
    <path class="il-line il-thin" d="M12 14l3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3"/>

    <rect class="il-orange il-ink" x="104" y="94" width="34" height="14" rx="4"/>
    <rect class="il-grey il-ink" x="100" y="104" width="44" height="7" rx="3"/>
    <rect class="il-metal il-ink" x="104" y="64" width="34" height="28" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="108" y="70" width="26" height="17" rx="3"/>
    <path class="il-glow" d="M112 78q3-4 6 0q-3-1.5-6 0zM124 78q3-4 6 0q-3-1.5-6 0z"/>
    <path class="il-glow" d="M117 82h8q-4 4-8 0z"/>

    <circle class="il-grey il-ink il-thin" cx="103" cy="78" r="2.5"/><circle class="il-grey il-ink il-thin" cx="139" cy="78" r="2.5"/>
    <path class="il-green il-ink" d="M84 72Q94 40 114 60q2 4-2 5Q98 50 92 76z"/>
    <path class="il-green il-ink" d="M86 80Q102 40 124 60q2 4-2 5Q106 50 94 84z"/>
    <path class="il-green il-ink" d="M88 88Q110 40 134 60q2 4-2 5Q114 50 96 92z"/>
    <g class="il-pink il-ink il-thin"><circle cx="99" cy="60" r="1.4"/><circle cx="94" cy="68" r="1.4"/><circle cx="106" cy="61" r="1.4"/><circle cx="99" cy="71" r="1.4"/><circle cx="118" cy="59" r="1.4"/><circle cx="110" cy="62" r="1.4"/></g>
    <ellipse class="il-purple il-ink" cx="84" cy="82" rx="7" ry="12"/>
    <path class="il-yellow" d="M148 56l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z"/>
    <path class="il-yellow" d="M96 50l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    <path class="il-yellow" d="M150 88l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    <path class="il-glow" d="M122 50l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`,

  // A gravity popper bursts on the deck floor: an upside-down android, a coffee mug (coffee and all) and a flailing
  // cockroach all "fall" up towards the ceiling.
  'sl.gravity-popper': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-grey il-ink" x="-2" y="-2" width="164" height="12"/>
    <g class="il-dark"><circle cx="10" cy="5" r="1.2"/><circle cx="40" cy="5" r="1.2"/><circle cx="70" cy="5" r="1.2"/><circle cx="100" cy="5" r="1.2"/><circle cx="130" cy="5" r="1.2"/></g>
    <path class="il-line il-thin" d="M0 30h20M140 30h20M0 60h12M148 60h12" opacity="0.6"/>
    <rect class="il-dark" x="0" y="106" width="160" height="14"/>
    <path class="il-light il-thin" d="M0 108h160" opacity="0.4"/>
    <path class="il-yellow il-ink" d="M80 84l5 10 11-4-5 10 11 4-11 4 3 6H66l3-6-11-4 11-4-5-10 11 4z"/>
    <path class="il-red il-ink" d="M62 104a7 7 0 0 1 12 -6z"/>
    <path class="il-red il-ink" d="M98 104a7 7 0 0 0 -12 -6z"/>
    <path class="il-line il-thin" d="M58 92l-6-5M102 92l6-5M80 80v-6"/>
    <path class="il-light il-thin il-dash" d="M70 72v-8M80 70v-10M90 72v-8"/>
    <g transform="rotate(180 80 38)">
      <rect class="il-metal il-ink" x="70" y="56" width="8" height="10"/><rect class="il-metal il-ink" x="82" y="56" width="8" height="10"/>
      <rect class="il-grey il-ink" x="66" y="64" width="14" height="6" rx="3"/><rect class="il-grey il-ink" x="80" y="64" width="14" height="6" rx="3"/>
      <rect class="il-orange il-ink" x="64" y="34" width="32" height="24" rx="5"/>
      <rect class="il-metal il-ink" x="64" y="10" width="32" height="24" rx="6"/>
      <rect class="il-dark il-ink il-thin" x="67.5" y="13.5" width="25" height="16" rx="3"/>
      <circle class="il-glow" cx="74" cy="19" r="3"/><circle class="il-glow" cx="86" cy="19" r="3"/>
      <circle class="il-dark" cx="74" cy="19" r="1.2"/><circle class="il-dark" cx="86" cy="19" r="1.2"/>
      <ellipse class="il-glow" cx="80" cy="26" rx="2.5" ry="2"/>
      <path class="il-line" d="M80 10v-5"/><circle class="il-red il-ink il-thin" cx="80" cy="4" r="2.4"/>
      <path class="il-metal il-ink" d="M64 38l-12 8 3 4 11-6z"/><path class="il-metal il-ink" d="M96 38l12 8-3 4-11-6z"/>
      <circle class="il-grey il-ink" cx="52" cy="49" r="4"/><circle class="il-grey il-ink" cx="108" cy="49" r="4"/>
    </g>
    <path class="il-light il-thin il-dash" d="M30 72v12M134 70v12"/>
    <g transform="rotate(-20 30 52)">
      <rect class="il-white il-ink" x="22" y="48" width="16" height="16" rx="2"/>
      <path class="il-line" d="M38 52c6 0 6 9 0 9"/>
      <path class="il-line il-thin" d="M25 54h10"/>
    </g>
    <path class="il-wood-dark il-ink il-thin" d="M26 42c-2-6 4-8 2-14 4 2 8 6 6 12z"/>
    <circle class="il-wood-dark il-ink il-thin" cx="24" cy="24" r="2.5"/><circle class="il-wood-dark il-ink il-thin" cx="34" cy="20" r="2"/>
    <ellipse class="il-wood-dark il-ink" cx="134" cy="56" rx="7" ry="10"/>
    <circle class="il-wood-dark il-ink" cx="134" cy="44" r="5"/>
    <circle class="il-white" cx="132" cy="43" r="1.6"/><circle class="il-white" cx="136.5" cy="43" r="1.6"/>
    <circle class="il-dark" cx="132" cy="43" r="0.7"/><circle class="il-dark" cx="136.5" cy="43" r="0.7"/>
    <ellipse class="il-dark" cx="134" cy="47" rx="1.3" ry="1.6"/>
    <path class="il-line il-thin" d="M131 39c-2-5-5-6-8-6M137 39c2-5 5-6 8-6M127 52l-8-6M141 52l8-6M128 60l-6 4M140 60l6 4M131 65l-2 6M137 65l2 6"/>
    <path class="il-line il-thin" d="M120 22l-3-3M146 20l3-4M14 70l-4 2"/>`,

  // An android blasts a can of expanding foam: the leaking pipe is sealed, and so is the slime monster, which glares
  // out of a huge foam lump and waves a tiny white flag.
  'sl.expanding-foam': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-dark" x="0" y="106" width="160" height="14"/>
    <rect class="il-metal il-ink" x="-2" y="12" width="164" height="9"/>
    <path class="il-line il-thin" d="M30 12v9M90 12v9M140 12v9"/>
    <circle class="il-paper il-ink" cx="62" cy="14" r="6"/><circle class="il-paper il-ink" cx="69" cy="12" r="5"/><circle class="il-paper il-ink" cx="66" cy="20" r="4"/>
    <path class="il-water il-ink il-thin" d="M118 22c-1 4-3 6-1 8 2 1 3-1 2-3z"/>
    <path class="il-line il-thin" d="M20 40h12M14 70h8" opacity="0.5"/>
    <g class="il-paper il-ink">
      <circle cx="74" cy="92" r="14"/><circle cx="98" cy="96" r="14"/><circle cx="124" cy="94" r="15"/><circle cx="146" cy="96" r="12"/>
      <circle cx="84" cy="70" r="16"/><circle cx="110" cy="62" r="20"/><circle cx="136" cy="72" r="16"/>
      <circle cx="96" cy="44" r="12"/><circle cx="122" cy="42" r="13"/>
    </g>
    <path class="il-paper" d="M74 80h76v24H74zM88 52h44v30H88z"/>
    <path class="il-line il-thin" d="M80 78q4-2 8 0M130 86q4-2 8 0M104 98q4-2 8 0M116 52q4-2 8 0"/>
    <ellipse class="il-slime il-ink il-thin" cx="110" cy="66" rx="20" ry="10"/>
    <circle class="il-white il-ink il-thin" cx="102" cy="66" r="5.5"/><circle class="il-white il-ink il-thin" cx="118" cy="66" r="5.5"/>
    <circle class="il-dark" cx="100" cy="67" r="2.4"/><circle class="il-dark" cx="116" cy="67" r="2.4"/>
    <path class="il-line il-thick" d="M95 58l11 4M125 58l-11 4"/>
    <path class="il-slime il-ink" d="M136 40c4-8 6-16 2-22l5-2c4 8 2 16-2 25z"/>
    <path class="il-line il-thin" d="M140 18l1-12"/>
    <path class="il-white il-ink il-thin" d="M141 6l14 3-13 5z"/>
    <circle class="il-paper il-ink il-thin" cx="52" cy="68" r="5"/><circle class="il-paper il-ink il-thin" cx="58" cy="60" r="3.6"/><circle class="il-paper il-ink il-thin" cx="44" cy="74" r="4"/>
    <path class="il-line il-thin" d="M46 62l-4-2M52 56l-2-4"/>
    <rect class="il-orange il-ink" x="16" y="74" width="24" height="32" rx="4"/>
    <path class="il-yellow il-ink il-thin" d="M16 84h24v8H16z"/>
    <path class="il-metal il-ink" d="M18 74c0-6 4-8 10-8s10 2 10 8z"/>
    <rect class="il-metal il-ink" x="24" y="60" width="8" height="7" rx="1"/>
    <path class="il-dark il-ink il-thin" d="M32 61h8v4h-8z"/>
    <rect class="il-teal il-ink" x="0" y="72" width="14" height="14" rx="3"/>
    <circle class="il-grey il-ink" cx="16" cy="79" r="6"/>
    <path class="il-grey il-ink il-thin" d="M22 60c3-2 6 0 4 3z"/>`,

  // The big red button under its flipped-open glass cover: a star-eyed android reaches for it, beaming, while the
  // alarm lamps flash and every gauge is already in the red.
  'sl.reactor-overload': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <rect class="il-grey il-ink" x="6" y="18" width="70" height="30" rx="3"/>
    <circle class="il-white il-ink il-thin" cx="24" cy="34" r="10"/><circle class="il-white il-ink il-thin" cx="56" cy="34" r="10"/>
    <path class="il-red" d="M24 34l7-7a10 10 0 0 1 3 7zM56 34l7-7a10 10 0 0 1 3 7z"/>
    <path class="il-line" d="M24 34l9-4M56 34l9-3"/>
    <circle class="il-dark" cx="24" cy="34" r="1.6"/><circle class="il-dark" cx="56" cy="34" r="1.6"/>
    <path class="il-red" d="M14 6l-14 -6h28z" opacity="0.4"/>
    <path class="il-red il-ink" d="M2 10a10 10 0 0 1 20 0z"/><rect class="il-grey il-ink il-thin" x="0" y="10" width="24" height="4"/>
    <path class="il-red" d="M138 10l-30 30 6 4zM150 10l10 34h-8z" opacity="0.35"/>
    <path class="il-red il-ink" d="M134 10a10 10 0 0 1 20 0z"/><rect class="il-grey il-ink il-thin" x="132" y="10" width="24" height="4"/>
    <path class="il-line il-thin" d="M30 6l6-3M30 12h7M126 6l-6-3M126 12h-7"/>
    <path class="il-metal il-ink" d="M0 82h104l10 38H0z"/>
    <path class="il-yellow il-ink il-thin" d="M0 90h106l2 8H0z"/>
    <path class="il-dark" d="M6 90h6l-4 8H2zM22 90h6l-4 8h-6zM38 90h6l-4 8h-6zM54 90h6l-4 8h-6zM70 90h6l-4 8h-6zM86 90h6l-4 8h-6zM102 90h4l-1 8h-7z"/>
    <circle class="il-green il-ink il-thin" cx="12" cy="108" r="3"/><circle class="il-yellow il-ink il-thin" cx="22" cy="108" r="3"/>
    <rect class="il-dark il-ink il-thin" x="84" y="104" width="16" height="7" rx="1"/>
    <rect class="il-dark il-ink" x="32" y="74" width="46" height="10" rx="2"/>
    <path class="il-red il-ink" d="M36 74c0-16 8-22 19-22s19 6 19 22z"/>
    <path class="il-light" d="M44 66q2-7 9-9"/>
    <path class="il-water il-ink il-thin" d="M30 72l-6-22 22-8 6 4z" opacity="0.55"/>
    <path class="il-light il-thin" d="M30 64l-3-10"/>
    <path class="il-line il-thin" d="M30 50l-4-4M55 46v-6M80 50l4-4"/>
    <rect class="il-orange il-ink" x="104" y="62" width="40" height="40" rx="6"/>
    <rect class="il-metal il-ink" x="110" y="98" width="10" height="22"/><rect class="il-metal il-ink" x="128" y="98" width="10" height="22"/>
    <path class="il-metal il-ink" d="M106 70l-22-6-2 7 22 6z"/>
    <path class="il-grey il-ink" d="M84 62c-4 0-6 3-6 6s2 5 6 5h2v-11z"/>
    <path class="il-grey il-ink il-thin" d="M78 64l-6-1v4l6 1z"/>
    <rect class="il-metal il-ink" x="104" y="28" width="40" height="32" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="108" y="32" width="32" height="22" rx="3"/>
    <path class="il-glow" d="M116 35l1.6 3.4 3.4.4-2.6 2.4.8 3.6-3.2-1.8-3.2 1.8.8-3.6-2.6-2.4 3.4-.4zM132 35l1.6 3.4 3.4.4-2.6 2.4.8 3.6-3.2-1.8-3.2 1.8.8-3.6-2.6-2.4 3.4-.4z"/>
    <path class="il-glow" d="M114 47h20q-10 8-20 0z"/>
    <path class="il-line" d="M124 28v-6"/><circle class="il-yellow il-ink il-thin" cx="124" cy="19" r="3"/>
    <path class="il-water il-ink il-thin" d="M146 30c-2 3-3 5-1 6s3-1 1-6z"/>
    <path class="il-metal il-ink" d="M144 68l8 12-4 4-7-10z"/><circle class="il-grey il-ink" cx="151" cy="85" r="4"/>`,

  // An android fires a striped, trumpet-mouthed confetti cannon straight into the face of a briefcase-carrying alien,
  // who squeezes his eyes shut under a shower of confetti and a draped streamer.
  'sl.confetti-cannon': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 16h160M0 98h160" opacity="0.5"/>
    <g class="il-dark"><circle cx="20" cy="10" r="1.2"/><circle cx="60" cy="10" r="1.2"/><circle cx="100" cy="10" r="1.2"/><circle cx="140" cy="10" r="1.2"/></g>
    <rect class="il-dark" x="0" y="104" width="160" height="16"/>
    <rect class="il-metal il-ink" x="16" y="94" width="8" height="12"/><rect class="il-metal il-ink" x="30" y="94" width="8" height="12"/>
    <rect class="il-grey il-ink" x="12" y="104" width="14" height="6" rx="3"/><rect class="il-grey il-ink" x="28" y="104" width="14" height="6" rx="3"/>
    <rect class="il-teal il-ink" x="10" y="64" width="34" height="32" rx="6"/>
    <rect class="il-metal il-ink" x="10" y="36" width="34" height="27" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="14" y="40" width="26" height="18" rx="3"/>
    <path class="il-glow" d="M19 48l4-3 1 2-3 2zM35 48l-4-3-1 2 3 2z"/>
    <path class="il-glow" d="M22 52h12q-6 6-12 0z"/>
    <path class="il-line" d="M27 36v-6"/><path class="il-red il-ink il-thin" d="M21 30l6-12 6 12z"/>
    <circle class="il-yellow il-ink il-thin" cx="27" cy="17" r="2"/>
    <path class="il-red il-ink" d="M36 70h22l18-14v32l-18-12H36z"/>
    <path class="il-yellow il-ink il-thin" d="M44 70h6v6h-6zM58 70l8-6v18l-8-6z"/>
    <ellipse class="il-dark il-ink il-thin" cx="76" cy="72" rx="3" ry="16"/>
    <circle class="il-grey il-ink" cx="40" cy="78" r="5"/><circle class="il-grey il-ink" cx="52" cy="80" r="5"/>
    <g class="il-ink il-thin">
      <rect class="il-yellow" x="84" y="58" width="5" height="3" transform="rotate(30 86 59)"/>
      <rect class="il-pink" x="90" y="70" width="5" height="3" transform="rotate(-20 92 71)"/>
      <rect class="il-blue" x="86" y="82" width="5" height="3" transform="rotate(50 88 83)"/>
      <rect class="il-green" x="96" y="62" width="5" height="3" transform="rotate(-40 98 63)"/>
      <rect class="il-orange" x="98" y="78" width="5" height="3" transform="rotate(15 100 79)"/>
      <rect class="il-white" x="92" y="50" width="5" height="3" transform="rotate(70 94 51)"/>
      <rect class="il-red" x="104" y="88" width="5" height="3" transform="rotate(-60 106 89)"/>
      <rect class="il-yellow" x="104" y="46" width="5" height="3" transform="rotate(10 106 47)"/>
      <rect class="il-pink" x="108" y="70" width="5" height="3" transform="rotate(45 110 71)"/>
      <rect class="il-blue" x="112" y="38" width="5" height="3" transform="rotate(-25 114 39)"/>
    </g>
    <path class="il-light il-thin" d="M80 64l6-4M82 80l6 4"/>
    <path class="il-dark il-ink" d="M118 100h30l-2-38h-26z"/>
    <path class="il-white il-ink il-thin" d="M126 62h10l-5 10z"/>
    <path class="il-red il-ink il-thin" d="M131 64l-2 4 2 12 2-12z"/>
    <path class="il-wood-dark il-ink" d="M100 92h18v14h-18z"/><path class="il-line il-thin" d="M105 92v-3h8v3M100 98h18"/>
    <path class="il-dark il-ink" d="M120 72l-10 18 4 3 10-15z"/>
    <path class="il-green il-ink" d="M131 62c-14 0-22-10-22-24s10-24 22-24 22 10 22 24-8 24-22 24z"/>
    <path class="il-green il-ink il-thin" d="M122 16c-4-6-6-8-10-8M140 16c4-6 6-8 10-8"/>
    <circle class="il-green il-ink il-thin" cx="112" cy="8" r="2.5"/><circle class="il-green il-ink il-thin" cx="150" cy="8" r="2.5"/>
    <path class="il-line" d="M116 34l7 3-7 3M146 34l-7 3 7 3"/>
    <ellipse class="il-dark" cx="131" cy="50" rx="5" ry="3.5"/>
    <path class="il-pink il-ink il-thin" d="M116 20c6 6 14 4 18 0 6 6 2 14 8 20l-2 2c-6-6-2-14-6-18-4 4-12 4-18-2z"/>
    <g class="il-ink il-thin">
      <rect class="il-yellow" x="118" y="40" width="4" height="3" transform="rotate(30 120 41)"/>
      <rect class="il-blue" x="140" y="46" width="4" height="3" transform="rotate(-30 142 47)"/>
      <rect class="il-orange" x="126" y="26" width="4" height="3" transform="rotate(60 128 27)"/>
      <rect class="il-white" x="134" y="54" width="4" height="3" transform="rotate(20 136 55)"/>
    </g>`,

  // A brick of freeze-dried Neapolitan ice cream, still half in its foil, bonks off a slime monster's head with a
  // star-shaped clonk; the monster sees stars and grows a lump.
  'sl.freeze-dried-ice-cream': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="10" cy="14" r="1"/><circle class="il-white" cx="64" cy="10" r="1.1"/><circle class="il-yellow" cx="150" cy="8" r="1.3"/>
    <circle class="il-white" cx="30" cy="100" r="1"/><circle class="il-white" cx="90" cy="112" r="0.9"/>
    <circle class="il-blue il-ink" cx="20" cy="104" r="16"/><path class="il-green il-ink il-thin" d="M10 96c6-2 8 4 14 2s4 8 10 6c-2 8-12 10-20 6-6-4-8-10-4-14z"/>
    <path class="il-light il-thin" d="M6 44h14M4 54h20M8 64h12" opacity="0.7"/>
    <g transform="rotate(-14 56 48)">
      <path class="il-metal il-ink" d="M22 34h12v30H22l-4-5 3-5-3-5 3-5-3-5z"/>
      <path class="il-pink il-ink" d="M34 34h54v10H34z"/>
      <path class="il-white il-ink" d="M34 44h54v10H34z"/>
      <path class="il-wood-dark il-ink" d="M34 54h54v10H34z"/>
      <path class="il-light il-thin" d="M40 38h4M60 38h8" opacity="0.8"/>
      <g class="il-dark"><circle cx="48" cy="58" r="1"/><circle cx="66" cy="60" r="1"/><circle cx="78" cy="57" r="1"/></g>
      <circle class="il-pink" cx="44" cy="40" r="1"/><circle class="il-pink" cx="72" cy="39" r="1"/>
      <path class="il-line il-thin" d="M30 36l-4 26"/>
      <path class="il-line" d="M58 46q3-3 6 0M70 46q3-3 6 0M62 50q4 4 8 0" opacity="0.8"/>
    </g>
    <path class="il-yellow il-ink" d="M100 26l4 8 8-4-2 9 9 2-8 5 5 7-9-1-1 9-6-7-6 6v-9l-9 1 5-7-8-5 9-2-2-9 8 4z"/>
    <path class="il-white il-ink il-thin" d="M92 66l5-2 1 4z"/><path class="il-white il-ink il-thin" d="M86 74l4 1-2 3z"/>
    <path class="il-slime il-ink" d="M100 106c-6-24 4-50 26-50s32 26 28 50z"/>
    <path class="il-slime il-ink il-thin" d="M106 106c0 5 6 5 6 0M144 106c0 4 5 4 5 0"/>
    <path class="il-pink il-ink" d="M108 62c-2-8 6-12 10-6z"/>
    <circle class="il-white il-ink" cx="118" cy="76" r="7"/><circle class="il-white il-ink" cx="136" cy="76" r="7"/>
    <path class="il-line il-thin" d="M118 76m-4 0a4 4 0 1 1 4 4 2 2 0 1 1 -2 -2M136 76m-4 0a4 4 0 1 1 4 4 2 2 0 1 1 -2 -2"/>
    <path class="il-line" d="M118 92q4-4 8 0t8 0"/>
    <path class="il-white il-ink il-thin" d="M124 94h4v3h-4z"/>
    <ellipse class="il-line il-thin il-dash" cx="128" cy="52" rx="20" ry="5"/>
    <path class="il-yellow" d="M112 50l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM144 52l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`,

  // A metal hand offers a glittering handful of stardust; the sparkles fly straight into a one-eyed purple alien's
  // huge, teary, red-rimmed eye while it rubs it with a tentacle.
  'sl.stardust': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="20" cy="12" r="1"/><circle class="il-white" cx="70" cy="20" r="1.1"/><circle class="il-white" cx="40" cy="50" r="0.9"/>
    <circle class="il-white" cx="150" cy="10" r="1"/><circle class="il-white" cx="10" cy="64" r="1"/>
    <path class="il-purple-dark" d="M0 108c50-6 110-6 160 0v12H0z"/>
    <rect class="il-orange il-ink" x="-4" y="84" width="20" height="18" rx="3"/>
    <path class="il-metal il-ink" d="M14 86c4-4 10-4 14-2l16-2c4 0 6 2 6 5s-4 4-8 4l-4 1c4 2 4 7-2 8H18c-4 0-6-6-4-14z"/>
    <path class="il-line il-thin" d="M30 92h10M28 98h8"/>
    <path class="il-gold il-ink il-thin" d="M20 86c2-8 10-12 18-8 4 2 6 6 6 8z"/>
    <path class="il-white" d="M28 78l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1zM38 80l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>
    <g class="il-yellow">
      <path d="M50 70l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z"/>
      <path d="M64 60l1.2 3.4 3.4 1.2-3.4 1.2-1.2 3.4-1.2-3.4-3.4-1.2 3.4-1.2z"/>
      <path d="M78 48l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z"/>
      <path d="M92 44l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    </g>
    <g class="il-white"><circle cx="58" cy="72" r="1.2"/><circle cx="70" cy="66" r="1"/><circle cx="72" cy="56" r="1.3"/><circle cx="86" cy="58" r="1"/><circle cx="84" cy="42" r="1.1"/><circle cx="56" cy="62" r="0.9"/></g>
    <path class="il-light il-thin il-dash" d="M46 78q20-20 50-32"/>
    <path class="il-purple il-ink" d="M98 108c-8-30 0-70 30-72 26 2 34 42 28 72z"/>
    <path class="il-purple il-ink il-thin" d="M120 37c-2-10-8-14-12-14M136 37c2-10 8-14 12-14"/>
    <circle class="il-purple il-ink il-thin" cx="107" cy="23" r="3"/><circle class="il-purple il-ink il-thin" cx="149" cy="23" r="3"/>
    <circle class="il-white il-ink" cx="126" cy="62" r="16"/>
    <path class="il-line il-thin" d="M111 58l5 1M112 67l5-2M141 56l-5 2M140 70l-5-3"/>
    <circle class="il-red" cx="126" cy="62" r="16" opacity="0.25"/>
    <circle class="il-dark" cx="124" cy="64" r="4"/><circle class="il-white" cx="122.6" cy="62.6" r="1.2"/>
    <path class="il-purple il-ink" d="M108 52c4-6 14-8 22-6-8 0-16 4-20 10z"/>
    <path class="il-purple il-ink" d="M108 50q18-12 36 0-2-4-18-8-14 2-18 8z"/>
    <path class="il-yellow" d="M118 56l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM132 70l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>
    <path class="il-water il-ink il-thin" d="M112 76c-2 4-3 6-1 7s3-2 1-7zM142 76c-2 4-3 6-1 7s3-2 1-7z"/>
    <path class="il-line" d="M118 90q8-4 16 0"/>
    <path class="il-purple il-ink" d="M154 90c6-10 6-24-2-30-4-4-10-2-12 4 4-2 8 0 8 4 2 8-2 14-2 20z"/>
    <path class="il-line il-thin" d="M146 56l2-3M152 54l1-4"/>`,

  // The crew belts out the ship's anthem: two androids and a cockroach sing with eyes shut, the music notes come out
  // crooked and broken, and a slime alien covers its ears in agony.
  'sl.off-key-anthem': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 10h160" opacity="0.6"/>
    <path class="il-blue il-ink" d="M54 10h40v12l-20 8-20-8z"/>
    <path class="il-yellow" d="M74 13l1.5 3.5 3.5.4-2.6 2.4.8 3.6-3.2-1.8-3.2 1.8.8-3.6-2.6-2.4 3.5-.4z"/>
    <rect class="il-dark" x="0" y="106" width="160" height="14"/>
    <rect class="il-orange il-ink" x="8" y="70" width="30" height="34" rx="5"/>
    <rect class="il-metal il-ink" x="12" y="102" width="9" height="8" rx="2"/><rect class="il-metal il-ink" x="25" y="102" width="9" height="8" rx="2"/>
    <rect class="il-metal il-ink" x="6" y="40" width="34" height="28" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="10" y="44" width="26" height="19" rx="3"/>
    <path class="il-glow" d="M14 51q3-3 6 0q-3-1-6 0zM26 51q3-3 6 0q-3-1-6 0z"/>
    <ellipse class="il-glow" cx="23" cy="58" rx="4" ry="3"/>
    <path class="il-line" d="M23 40v-6"/><circle class="il-red il-ink il-thin" cx="23" cy="32" r="2.6"/>
    <path class="il-metal il-ink" d="M38 78l8-8 3 3-8 8z"/><circle class="il-grey il-ink il-thin" cx="48" cy="70" r="3.4"/>
    <rect class="il-teal il-ink" x="50" y="82" width="24" height="24" rx="4"/>
    <rect class="il-metal il-ink" x="48" y="58" width="28" height="23" rx="6"/>
    <rect class="il-dark il-ink il-thin" x="51.5" y="61.5" width="21" height="15" rx="3"/>
    <path class="il-glow" d="M55 67q2.5-2.5 5 0q-2.5-1-5 0zM64 67q2.5-2.5 5 0q-2.5-1-5 0z"/>
    <ellipse class="il-glow" cx="62" cy="72.5" rx="3.4" ry="2.6"/>
    <path class="il-line" d="M62 58v-5"/><circle class="il-yellow il-ink il-thin" cx="62" cy="51" r="2.4"/>
    <ellipse class="il-wood-dark il-ink" cx="90" cy="92" rx="8" ry="13"/>
    <circle class="il-wood-dark il-ink" cx="90" cy="74" r="7"/>
    <path class="il-line il-thin" d="M86 68c-2-6-5-8-8-8M94 68c2-6 5-8 8-8M82 90l-6-6M98 90l6-6M86 104l-2 4M94 104l2 4"/>
    <path class="il-line il-thin" d="M85 72q2-2 4 0M91 72q2-2 4 0"/>
    <ellipse class="il-dark" cx="90" cy="78" rx="2.4" ry="2"/>
    <g transform="rotate(-18 32 20)"><ellipse class="il-dark" cx="28" cy="26" rx="4" ry="3"/><path class="il-line" d="M31.5 25V12l6 4"/></g>
    <g transform="rotate(24 50 30)"><ellipse class="il-dark" cx="46" cy="38" rx="4" ry="3"/><path class="il-line" d="M49.5 37V26"/></g>
    <g transform="rotate(-30 100 40)"><ellipse class="il-dark" cx="96" cy="48" rx="4" ry="3"/><path class="il-line" d="M99.5 47V34l7 4"/></g>
    <path class="il-line" d="M102 30l2-6 3 1"/>
    <path class="il-line il-thin" d="M6 22l4-3 3 3 4-3 3 3M88 22l3-3 4 3 3-3 4 3M104 56l4-2 1 4 4-2"/>
    <path class="il-slime il-ink" d="M112 106c-4-26 4-50 22-50s28 24 24 50z"/>
    <path class="il-slime il-ink" d="M116 62l-6-10 10 4zM152 62l6-10-10 4z"/>
    <path class="il-slime il-ink" d="M118 86c-8-6-10-16-6-24l5 1c-3 7-1 14 4 18z"/>
    <path class="il-slime il-ink" d="M150 86c8-6 10-16 6-24l-5 1c3 7 1 14-4 18z"/>
    <path class="il-line" d="M124 70l6 2-6 2M144 70l-6 2 6 2"/>
    <path class="il-white il-ink il-thin" d="M126 84h16v6h-16z"/>
    <path class="il-line il-thin" d="M130 84v6M134 84v6M138 84v6"/>
    <path class="il-water il-ink il-thin" d="M148 52c-2 3-3 5-1 6s3-1 1-6z"/>
    <path class="il-line il-thin" d="M108 66l-4-2M106 74h-4M160 76l-2-2"/>`,

  // A real android hides behind a crate and whistles innocently while the slime monster lunges, jaws wide, straight
  // through a flickering blue hologram of it.
  'sl.hologram-decoy': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 14h160M40 14v84M120 14v84" opacity="0.5"/>
    <rect class="il-dark" x="0" y="100" width="160" height="20"/>
    <path class="il-light il-thin" d="M0 102h160" opacity="0.4"/>
    <rect class="il-metal il-ink" x="12" y="40" width="26" height="22" rx="6"/>
    <rect class="il-dark il-ink il-thin" x="15" y="43" width="20" height="14" rx="2"/>
    <circle class="il-glow" cx="27" cy="48" r="2"/><circle class="il-glow" cx="32" cy="48" r="2"/>
    <circle class="il-glow" cx="29" cy="53" r="1.5"/>
    <path class="il-line" d="M25 40v-5"/><circle class="il-red il-ink il-thin" cx="25" cy="33" r="2.4"/>
    <ellipse class="il-dark" cx="44" cy="40" rx="2.6" ry="2"/><path class="il-line il-thin" d="M46.5 39.5v-8l4 2"/>
    <rect class="il-wood il-ink" x="4" y="58" width="44" height="44" rx="2"/>
    <path class="il-line il-thin" d="M4 72h44M4 88h44M10 58l32 44M42 58l-32 44"/>
    <path class="il-slime il-ink" d="M100 102c-6-20-2-42 16-50 12-6 30-4 38 4 8 10 6 30 0 46z"/>
    <path class="il-dark il-ink" d="M106 70c4 8 14 12 26 10-4-10-14-14-26-10z"/>
    <path class="il-pink il-ink il-thin" d="M108 72c-12 2-22-2-26 4 8 2 16 2 26 0z"/>
    <path class="il-white il-ink il-thin" d="M110 70l2 4 3-4 3 4 3-4M114 80l2-3 3 3 3-3"/>
    <circle class="il-white il-ink" cx="120" cy="58" r="6"/><circle class="il-white il-ink" cx="134" cy="56" r="6"/>
    <circle class="il-dark" cx="117" cy="59" r="2.5"/><circle class="il-dark" cx="131" cy="57" r="2.5"/>
    <path class="il-line" d="M114 50l8 3M128 49l8 1"/>
    <path class="il-line il-thin" d="M150 66l8-2M152 74l8 0"/>
    <ellipse class="il-metal il-ink" cx="72" cy="102" rx="14" ry="4"/>
    <circle class="il-glow" cx="72" cy="101" r="2"/>
    <path class="il-glow" d="M60 100L52 36h40l-8 64z" opacity="0.18"/>
    <g opacity="0.65">
      <rect class="il-water il-ink il-thin" x="58" y="66" width="28" height="26" rx="5"/>
      <rect class="il-water il-ink il-thin" x="62" y="92" width="7" height="8"/><rect class="il-water il-ink il-thin" x="75" y="92" width="7" height="8"/>
      <rect class="il-water il-ink il-thin" x="58" y="42" width="28" height="23" rx="6"/>
      <path class="il-light" d="M64 51q3-3 6 0M74 51q3-3 6 0M66 57q6 4 12 0"/>
      <path class="il-water il-ink il-thin" d="M86 70l10-12 3 3-10 11z"/><circle class="il-water il-ink il-thin" cx="99" cy="56" r="3.5"/>
      <path class="il-water il-ink il-thin" d="M58 70l-6 12 3 1 6-11z"/>
    </g>
    <path class="il-light il-thin" d="M56 48h32M56 60h32M56 74h32M56 86h32" opacity="0.6"/>
    <path class="il-line il-thin" d="M92 30c0-5 7-5 7 0 0 3-3.5 3-3.5 7"/><circle class="il-dark" cx="95.5" cy="41" r="1.3"/>`,

  // A round one-seat escape pod zooms off with a happily waving android in the porthole; left behind at the
  // mothership's hatch floats a sad little suitcase.
  'sl.escape-pod': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="70" cy="10" r="1"/><circle class="il-white" cx="150" cy="96" r="1.1"/><circle class="il-yellow" cx="140" cy="16" r="1.3"/>
    <circle class="il-white" cx="90" cy="106" r="0.9"/><circle class="il-white" cx="56" cy="40" r="1"/><circle class="il-white" cx="152" cy="54" r="1"/>
    <path class="il-grey il-ink" d="M-2 -2h34c-6 30-6 80 0 124H-2z"/>
    <path class="il-line il-thin" d="M0 30h28M0 74h26"/>
    <g class="il-dark"><circle cx="6" cy="10" r="1.2"/><circle cx="20" cy="10" r="1.2"/><circle cx="6" cy="90" r="1.2"/><circle cx="20" cy="104" r="1.2"/></g>
    <rect class="il-dark il-ink" x="10" y="38" width="18" height="30" rx="4"/>
    <path class="il-yellow il-ink il-thin" d="M10 38h18v4H10z"/>
    <g transform="rotate(-14 44 88)">
      <rect class="il-wood il-ink" x="32" y="80" width="26" height="18" rx="3"/>
      <path class="il-line" d="M40 80v-4h10v4"/>
      <path class="il-line il-thin" d="M32 86h26"/>
      <circle class="il-dark" cx="40" cy="91" r="1.3"/><circle class="il-dark" cx="50" cy="91" r="1.3"/>
      <path class="il-line il-thin" d="M41 96q4-3 8 0"/>
      <path class="il-water il-ink il-thin" d="M38 93c-1 2-2 4-1 5s2-1 1-5z"/>
      <path class="il-paper il-ink il-thin" d="M58 84l6 2-2 5-6-2z"/>
    </g>
    <path class="il-light il-thin" d="M70 92l-12 10M78 98l-10 10M64 80l-12 6" opacity="0.6"/>
    <circle class="il-smoke il-ink il-thin" cx="72" cy="86" r="6"/><circle class="il-smoke il-ink il-thin" cx="62" cy="94" r="4.5"/><circle class="il-smoke il-ink il-thin" cx="56" cy="100" r="3"/>
    <circle class="il-orange il-ink il-thin" cx="78" cy="80" r="5"/><circle class="il-yellow" cx="78" cy="80" r="2.4"/>
    <path class="il-red il-ink" d="M84 64l-12-2 6 12zM104 88l2 12 10-8z"/>
    <circle class="il-white il-ink" cx="106" cy="58" r="28"/>
    <path class="il-orange il-ink" d="M82 70a28 28 0 0 0 46 6z"/>
    <path class="il-line il-thin" d="M80 54q26 -8 52 4"/>
    <g class="il-dark"><circle cx="86" cy="50" r="1.2"/><circle cx="126" cy="54" r="1.2"/><circle cx="104" cy="34" r="1.2"/></g>
    <circle class="il-metal il-ink" cx="108" cy="58" r="15"/>
    <circle class="il-water il-ink il-thin" cx="108" cy="58" r="12"/>
    <rect class="il-metal il-ink il-thin" x="100" y="52" width="16" height="13" rx="3"/>
    <rect class="il-dark" x="102" y="54" width="12" height="8" rx="1.5"/>
    <path class="il-glow" d="M104 58q1.5-2 3 0M109 58q1.5-2 3 0M105 60h6q-3 2-6 0z"/>
    <path class="il-metal il-ink il-thin" d="M116 54l4-7 2.5 1.5-4 7z"/><circle class="il-metal il-ink il-thin" cx="122" cy="46" r="2.6"/>
    <path class="il-line il-thin" d="M125 42l3-2M126 47l3 0"/>
    <path class="il-white" d="M96 40a14 14 0 0 1 8-4" opacity="0.8"/>
    <path class="il-light" d="M92 44a18 18 0 0 1 10-6"/>`,

  // Ceiling sprinklers spray foam into a disco-lit party: two androids dance chest-deep in bubbles while the red
  // fire-alarm lamp keeps flashing in the corner.
  'sl.foam-party': `
    <rect class="il-purple-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-red" d="M146 16l-40 20 4 6zM146 16l10 40h-8z" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-2" y="6" width="164" height="7"/>
    <path class="il-metal il-ink il-thin" d="M30 13v4h-4l2 3h8l2-3h-4v-4zM100 13v4h-4l2 3h8l2-3h-4v-4z"/>
    <path class="il-water" d="M32 20l-8 18h20zM102 20l-8 18h20z" opacity="0.4"/>
    <g class="il-white il-ink il-thin"><circle cx="26" cy="30" r="2.5"/><circle cx="36" cy="34" r="2"/><circle cx="31" cy="40" r="3"/><circle cx="98" cy="32" r="2.5"/><circle cx="106" cy="38" r="3"/><circle cx="96" cy="44" r="2"/></g>
    <path class="il-line il-thin" d="M66 13v8"/>
    <circle class="il-metal il-ink" cx="66" cy="28" r="7"/>
    <path class="il-line il-thin" d="M59 28h14M66 21v14M61 23q5 5 0 10M71 23q-5 5 0 10"/>
    <path class="il-glow" d="M52 26l-6-2M80 30l7 1M60 40l-4 5M74 40l4 5" opacity="0.8"/>
    <path class="il-red il-ink" d="M138 18a8 8 0 0 1 16 0z"/><rect class="il-grey il-ink il-thin" x="136" y="13" width="20" height="5"/>
    <path class="il-line il-thin" d="M130 22l-4 2M158 24l2 2"/>
    <g transform="rotate(-8 44 72)">
      <rect class="il-orange il-ink" x="30" y="70" width="28" height="30" rx="5"/>
      <rect class="il-metal il-ink" x="30" y="46" width="28" height="23" rx="6"/>
      <rect class="il-dark il-ink il-thin" x="33.5" y="49.5" width="21" height="15" rx="3"/>
      <path class="il-glow" d="M37 57q3-4 6 0q-3-2-6 0zM46 57q3-4 6 0q-3-2-6 0z"/>
      <path class="il-glow" d="M39 60h10q-5 5-10 0z"/>
      <path class="il-yellow il-ink il-thin" d="M36 46l8-14 8 14z"/><circle class="il-pink il-ink il-thin" cx="44" cy="31" r="2.4"/>
      <path class="il-metal il-ink" d="M30 74l-12-18 4-3 12 17z"/><circle class="il-grey il-ink il-thin" cx="19" cy="53" r="3.6"/>
      <path class="il-metal il-ink" d="M58 74l10-20 4 2-10 20z"/><circle class="il-grey il-ink il-thin" cx="71" cy="53" r="3.6"/>
    </g>
    <g transform="rotate(10 116 74)">
      <rect class="il-teal il-ink" x="102" y="74" width="28" height="28" rx="5"/>
      <rect class="il-metal il-ink" x="102" y="50" width="28" height="23" rx="6"/>
      <rect class="il-dark il-ink il-thin" x="105.5" y="53.5" width="21" height="15" rx="3"/>
      <path class="il-glow" d="M109 59h5v2h-5zM118 59h5v2h-5z"/>
      <ellipse class="il-glow" cx="116" cy="65" rx="3" ry="2"/>
      <path class="il-line" d="M116 50v-5"/><circle class="il-glow il-ink il-thin" cx="116" cy="43" r="2.4"/>
      <path class="il-metal il-ink" d="M102 78l-10-16 4-2 10 15z"/><circle class="il-grey il-ink il-thin" cx="93" cy="59" r="3.6"/>
      <path class="il-metal il-ink" d="M130 78l12-12 3 3-12 12z"/><circle class="il-grey il-ink il-thin" cx="145" cy="65" r="3.6"/>
    </g>
    <path class="il-white" d="M0 92c10-6 20-6 30-2 10-6 22-6 32 0 10-6 20-6 30-2 10-6 22-6 32 0 12-6 24-6 36-2v34H0z"/>
    <g class="il-white il-ink il-thin">
      <circle cx="10" cy="92" r="8"/><circle cx="30" cy="88" r="9"/><circle cx="52" cy="90" r="8"/><circle cx="72" cy="88" r="9"/>
      <circle cx="94" cy="90" r="8"/><circle cx="116" cy="88" r="9"/><circle cx="138" cy="90" r="8"/><circle cx="156" cy="88" r="7"/>
      <circle cx="80" cy="74" r="4"/><circle cx="88" cy="66" r="3"/><circle cx="14" cy="74" r="3.5"/><circle cx="146" cy="76" r="4"/>
    </g>
    <path class="il-white" d="M2 94h156v26H2z"/>
    <path class="il-line il-thin" d="M20 104q4-2 8 0M60 108q4-2 8 0M100 102q4-2 8 0M136 110q4-2 8 0"/>
    <circle class="il-white il-ink il-thin" cx="82" cy="50" r="7"/>
    <path class="il-light il-thin" d="M78 47q2-2 4-2"/>
    <ellipse class="il-wood-dark il-ink il-thin" cx="82" cy="42" rx="4" ry="3"/>
    <path class="il-line il-thin" d="M80 40l-2-4M84 40l2-4M79 44l-3 2M85 44l3 2"/>`,

  // An android on the dashed border line salutes its own ship's flag with one hand while the other hand, behind its
  // back, grabs a bag of gold coins from a grinning alien; its screen eyes slide towards the money.
  'sl.defector-protocol': `
    <rect class="il-sky" x="0" y="0" width="80" height="120"/>
    <rect class="il-purple-dark" x="80" y="0" width="80" height="120"/>
    <rect class="il-dark" x="0" y="104" width="160" height="16"/>
    <path class="il-light il-dash" d="M80 0v120"/>
    <path class="il-line" d="M12 104V20"/>
    <path class="il-blue il-ink" d="M12 20h28l-6 9 6 9H12z"/>
    <path class="il-yellow" d="M22 24l1.4 3 3.2.4-2.4 2.2.7 3.2-2.9-1.6-2.9 1.6.7-3.2-2.4-2.2 3.2-.4z"/>
    <path class="il-line" d="M150 104V20"/>
    <path class="il-slime il-ink" d="M150 20h-28l6 9-6 9h28z"/>
    <circle class="il-purple il-ink il-thin" cx="138" cy="29" r="4"/>
    <rect class="il-metal il-ink" x="62" y="88" width="8" height="12"/><rect class="il-metal il-ink" x="76" y="88" width="8" height="12"/>
    <rect class="il-grey il-ink" x="58" y="98" width="14" height="6" rx="3"/><rect class="il-grey il-ink" x="74" y="98" width="14" height="6" rx="3"/>
    <rect class="il-orange il-ink" x="56" y="58" width="34" height="32" rx="6"/>
    <rect class="il-blue il-ink il-thin" x="60" y="64" width="8" height="8" rx="1"/>
    <path class="il-metal il-ink" d="M90 70l16 2v6l-16-1z"/>
    <path class="il-metal il-ink" d="M56 62l-10-8 4-5 10 8z"/>
    <circle class="il-grey il-ink" cx="48" cy="44" r="4.5"/>
    <path class="il-grey il-ink il-thin" d="M44 40l-2-6 4-1 2 6zM49 39l0-6 4 0 0 6z"/>
    <rect class="il-metal il-ink" x="54" y="30" width="36" height="28" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="58" y="34" width="28" height="19" rx="3"/>
    <rect class="il-glow" x="66" y="40" width="6" height="5" rx="1"/><rect class="il-glow" x="78" y="40" width="6" height="5" rx="1"/>
    <rect class="il-dark" x="69.5" y="41" width="2.5" height="3"/><rect class="il-dark" x="81.5" y="41" width="2.5" height="3"/>
    <path class="il-glow" d="M66 48q8 4 16-2v2q-8 6-16 2z"/>
    <path class="il-line" d="M72 30v-6"/><circle class="il-red il-ink il-thin" cx="72" cy="22" r="2.6"/>
    <path class="il-water il-ink il-thin" d="M92 34c-2 3-3 5-1 6s3-1 1-6z"/>
    <path class="il-wood il-ink" d="M100 92c-9 0-12-6-10-13 2-6 7-9 12-10l-4-6h16l-4 6c5 1 10 4 12 10 2 7-1 13-10 13z"/>
    <path class="il-line" d="M101 69h14"/>
    <circle class="il-gold il-ink il-thin" cx="104" cy="62" r="3"/><circle class="il-gold il-ink il-thin" cx="111" cy="61" r="3"/>
    <circle class="il-gold il-ink il-thin" cx="108" cy="81" r="5"/><circle class="il-yellow" cx="108" cy="81" r="2"/>
    <circle class="il-gold il-ink il-thin" cx="112" cy="98" r="3"/><circle class="il-gold il-ink il-thin" cx="104" cy="100" r="2.6"/>
    <path class="il-yellow" d="M96 56l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>
    <circle class="il-grey il-ink" cx="104" cy="74" r="4"/>
    <path class="il-slime il-ink" d="M126 104c-6-24 0-50 14-50s20 26 16 50z"/>
    <path class="il-slime il-ink" d="M128 74c-6-2-10 0-12 4 3 1 6 0 8-2 2 2 4 2 6 0z"/>
    <circle class="il-white il-ink il-thin" cx="136" cy="66" r="4"/><circle class="il-white il-ink il-thin" cx="147" cy="66" r="4"/>
    <circle class="il-dark" cx="134.6" cy="67" r="1.8"/><circle class="il-dark" cx="145.6" cy="67" r="1.8"/>
    <path class="il-line" d="M131 60l7 3M152 60l-7 3"/>
    <path class="il-line" d="M134 78q8 6 16 0"/>`,

  // A proud android on the bridge with an absurdly oversized gold star badge and a captain's cap that keeps slipping
  // over one screen eye, happily pressing one of a hundred buttons; same old patched jumpsuit.
  'sl.promotion': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <rect class="il-night il-ink" x="6" y="6" width="148" height="50" rx="8"/>
    <circle class="il-white" cx="20" cy="16" r="1"/><circle class="il-white" cx="60" cy="44" r="1"/><circle class="il-yellow" cx="140" cy="16" r="1.3"/><circle class="il-white" cx="100" cy="12" r="1"/>
    <circle class="il-teal il-ink il-thin" cx="126" cy="36" r="11"/><path class="il-green" d="M120 30c4 2 6 6 4 10-4 0-6-4-4-10zM130 32c2 2 4 6 2 8l-4-2z"/>
    <path class="il-metal il-ink" d="M0 82h160v38H0z"/>
    <path class="il-dark il-ink" d="M0 82h160l-6 10H6z"/>
    <g class="il-ink il-thin">
      <circle class="il-red" cx="8" cy="98" r="3"/><circle class="il-green" cx="18" cy="98" r="3"/><circle class="il-yellow" cx="28" cy="98" r="3"/>
      <rect class="il-blue" x="6" y="105" width="8" height="5" rx="1"/><rect class="il-orange" x="18" y="105" width="8" height="5" rx="1"/>
      <circle class="il-yellow" cx="116" cy="98" r="3"/><circle class="il-red" cx="126" cy="98" r="3"/><circle class="il-blue" cx="136" cy="98" r="3"/><circle class="il-green" cx="146" cy="98" r="3"/>
      <rect class="il-green" x="114" y="105" width="8" height="5" rx="1"/><rect class="il-white" x="126" y="105" width="8" height="5" rx="1"/><rect class="il-red" x="138" y="105" width="8" height="5" rx="1"/>
      <circle class="il-orange" cx="152" cy="112" r="2.5"/><circle class="il-glow" cx="34" cy="112" r="2.5"/>
    </g>
    <rect class="il-orange il-ink" x="46" y="60" width="44" height="40" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="78" y="86" width="9" height="9"/>
    <path class="il-line il-thin il-dash" d="M78 86h9v9h-9z"/>
    <path class="il-line il-thin" d="M68 60v40"/>
    <path class="il-gold il-ink" d="M66 60l5 10.5 11.5 1.5-8.5 8 2 11.5-10-5.5-10 5.5 2-11.5-8.5-8 11.5-1.5z"/>
    <circle class="il-yellow il-ink il-thin" cx="66" cy="76" r="4"/>
    <path class="il-white" d="M60 70l2-4" opacity="0.8"/>
    <path class="il-metal il-ink" d="M90 66l14 14-4 4-14-13z"/>
    <path class="il-grey il-ink" d="M98 84l8-6 4 4-4 6z"/>
    <path class="il-grey il-ink il-thin" d="M108 80l6 4-2 3-6-4z"/>
    <circle class="il-red il-ink il-thin" cx="114" cy="89" r="3"/>
    <path class="il-line il-thin" d="M118 84l4-2M118 92l4 1"/>
    <path class="il-metal il-ink" d="M46 66l-10 12 4 3 10-11z"/><circle class="il-grey il-ink" cx="37" cy="81" r="4"/>
    <rect class="il-metal il-ink" x="50" y="32" width="36" height="28" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="54" y="36" width="28" height="19" rx="3"/>
    <path class="il-glow" d="M70 44q3-4 6 0q-3-1.6-6 0z"/>
    <path class="il-glow" d="M60 48h18q-9 8-18 0z"/>
    <g transform="rotate(-16 68 32)">
      <path class="il-white il-ink" d="M44 34c0-12 10-18 24-18s24 6 24 18z"/>
      <path class="il-dark il-ink" d="M40 32h56c2 0 2 6 0 6H40c-2 0-2-6 0-6z"/>
      <path class="il-gold il-ink il-thin" d="M62 22h12l-2 6h-8z"/>
      <path class="il-gold il-ink il-thin" d="M40 38q28 8 56 0"/>
    </g>
    <ellipse class="il-wood-dark il-ink il-thin" cx="140" cy="76" rx="6" ry="4"/><circle class="il-wood-dark il-ink il-thin" cx="140" cy="70" r="3.4"/>
    <path class="il-line il-thin" d="M138 67l-2-4M142 67l2-4M143 70l4-5M136 79l-2 3M144 79l2 3"/>`,

  // Zero-G birthday: a pink cake drifts tilted through the cabin, its round-flamed candles floating off it, while an
  // upside-down android in a party hat and a tumbling cockroach float along with a balloon and crumbs.
  'sl.orbit-birthday': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-metal il-ink" cx="128" cy="34" r="24"/>
    <circle class="il-night il-ink il-thin" cx="128" cy="34" r="18"/>
    <path class="il-blue" d="M114 44a18 18 0 0 0 28 2c-6-8-20-10-28-2z"/>
    <path class="il-green" d="M122 44c2-3 6-3 8 0z"/>
    <circle class="il-white" cx="122" cy="26" r="1"/><circle class="il-white" cx="134" cy="22" r="1"/><circle class="il-yellow" cx="138" cy="32" r="1.2"/>
    <g class="il-dark"><circle cx="128" cy="12.5" r="1.2"/><circle cx="128" cy="55.5" r="1.2"/><circle cx="106.5" cy="34" r="1.2"/><circle cx="149.5" cy="34" r="1.2"/></g>
    <g transform="rotate(-12 62 72)">
      <path class="il-pink il-ink" d="M34 70h56v26H34z"/>
      <path class="il-white il-ink" d="M44 52h36v18H44z"/>
      <path class="il-paper il-ink il-thin" d="M34 70h56v4c-4 4-6 0-8 4-2-4-6 0-8 4-2-4-6 0-8 2-2-4-6 0-8 2-2-4-6-2-8 0-2-4-6 0-8-2-2-4-4 0-6-2z"/>
      <path class="il-pink il-ink il-thin" d="M44 52h36v3c-4 3-6 0-8 3-2-3-6 0-8 3-2-3-6 0-8 2-2-3-6 0-6-2-2-3-4 0-6-2z"/>
      <circle class="il-red il-ink il-thin" cx="50" cy="82" r="3"/><circle class="il-red il-ink il-thin" cx="62" cy="86" r="3"/><circle class="il-red il-ink il-thin" cx="74" cy="82" r="3"/>
      <rect class="il-paper il-ink il-thin" x="32" y="96" width="60" height="4" rx="2"/>
    </g>
    <g transform="rotate(20 48 34)">
      <rect class="il-blue il-ink il-thin" x="45" y="32" width="6" height="12" rx="1"/>
      <path class="il-white" d="M45 36l6-2v2l-6 2zM45 40l6-2v2l-6 2z"/>
      <path class="il-line il-thin" d="M48 32v-3"/>
      <circle class="il-orange il-ink il-thin" cx="48" cy="25" r="3.4"/><circle class="il-yellow" cx="48" cy="25.5" r="1.6"/>
    </g>
    <g transform="rotate(-30 74 30)">
      <rect class="il-yellow il-ink il-thin" x="71" y="28" width="6" height="12" rx="1"/>
      <path class="il-white" d="M71 32l6-2v2l-6 2zM71 36l6-2v2l-6 2z"/>
      <path class="il-line il-thin" d="M74 28v-3"/>
      <circle class="il-orange il-ink il-thin" cx="74" cy="21" r="3.4"/><circle class="il-yellow" cx="74" cy="21.5" r="1.6"/>
    </g>
    <g transform="translate(0 -14) rotate(160 120 84)">
      <rect class="il-metal il-ink" x="108" y="90" width="7" height="9"/><rect class="il-metal il-ink" x="125" y="90" width="7" height="9"/>
      <rect class="il-teal il-ink" x="106" y="72" width="28" height="20" rx="4"/>
      <rect class="il-metal il-ink" x="106" y="50" width="28" height="22" rx="6"/>
      <rect class="il-dark il-ink il-thin" x="109.5" y="53.5" width="21" height="14" rx="3"/>
      <path class="il-glow" d="M113 60q2.5-3 5 0q-2.5-1.4-5 0zM122 60q2.5-3 5 0q-2.5-1.4-5 0z"/>
      <path class="il-glow" d="M115 63h10q-5 4-10 0z"/>
      <path class="il-purple il-ink il-thin" d="M112 50l8-14 8 14z"/><circle class="il-yellow il-ink il-thin" cx="120" cy="35" r="2.2"/>
      <path class="il-metal il-ink" d="M106 76l-10-6 2-4 10 6z"/><path class="il-metal il-ink" d="M134 76l10-6-2-4-10 6z"/>
    </g>
    <path class="il-line il-thin" d="M142 100c4 6 2 10 6 14"/>
    <ellipse class="il-red il-ink" cx="146" cy="88" rx="8" ry="10"/>
    <path class="il-red il-ink il-thin" d="M144 98h4l-2 3z"/>
    <path class="il-light il-thin" d="M142 84q1-4 4-5"/>
    <g transform="rotate(40 18 92)">
      <ellipse class="il-wood-dark il-ink" cx="18" cy="96" rx="7" ry="10"/>
      <circle class="il-wood-dark il-ink" cx="18" cy="84" r="5"/>
      <path class="il-orange il-ink il-thin" d="M13 82l5-10 5 10z"/>
      <circle class="il-white" cx="16" cy="84" r="1.5"/><circle class="il-white" cx="20.5" cy="84" r="1.5"/>
      <path class="il-line il-thin" d="M16 87.5q2 1.5 4 0M11 92l-6-4M25 92l6-4M12 100l-5 3M24 100l5 3"/>
    </g>
    <g class="il-paper il-ink il-thin"><circle cx="96" cy="58" r="1.6"/><circle cx="30" cy="40" r="1.4"/><circle cx="92" cy="104" r="1.8"/><circle cx="100" cy="26" r="1.4"/></g>
    <path class="il-pink il-ink il-thin" d="M88 62c3-2 6 0 4 3-2 2-5 0-4-3z"/>`,

  // In a dusty storeroom an android kneels and lifts a huge, thick ship manual into a beam of light, crying tears
  // of joy; dust puffs out of the pages and a cobweb hangs in the corner.
  'sl.found-manual': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-torch" d="M60 0h40l20 120H40z" opacity="0.5"/>
    <rect class="il-earth-dark" x="0" y="104" width="160" height="16"/>
    <rect class="il-wood-dark il-ink" x="122" y="64" width="34" height="40"/>
    <path class="il-line il-thin" d="M122 84h34M139 64v40"/>
    <rect class="il-grey il-ink" x="128" y="48" width="22" height="16" rx="2"/>
    <rect class="il-wood-dark il-ink" x="4" y="78" width="26" height="26"/>
    <path class="il-line il-thin" d="M4 78l26 26M30 78L4 104"/>
    <path class="il-line il-thin" d="M0 0l22 22M0 12l18 4M12 0l4 18M0 6q6 4 8 0M0 15q10 2 12-6 2 8 6 8M14 0q2 8-4 10"/>
    <path class="il-line il-thin" d="M18 18v10"/><ellipse class="il-dark" cx="18" cy="30" rx="2" ry="2.4"/>
    <path class="il-line il-thin" d="M15 29l-2-1M15 31l-2 1M21 29l2-1M21 31l2 1"/>
    <rect class="il-orange il-ink" x="64" y="82" width="32" height="18" rx="5"/>
    <rect class="il-grey il-ink" x="58" y="98" width="44" height="7" rx="3"/>
    <path class="il-metal il-ink" d="M66 86l-10-26 5-2 10 26z"/>
    <path class="il-metal il-ink" d="M94 86l10-26-5-2-10 26z"/>
    <rect class="il-metal il-ink" x="62" y="58" width="36" height="26" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="66" y="62" width="28" height="17" rx="3"/>
    <path class="il-glow" d="M70 70q3-4 6 0q-3-1.6-6 0zM84 70q3-4 6 0q-3-1.6-6 0z"/>
    <path class="il-glow" d="M74 73h12q-6 6-12 0z"/>
    <path class="il-water il-ink il-thin" d="M60 70c-2 3-3 5-1 6s3-1 1-6zM100 70c-2 3-3 5-1 6s3-1 1-6zM56 80c-2 3-3 5-1 6s3-1 1-6z"/>
    <path class="il-paper il-ink" d="M50 50l6-36h52l-4 36z"/>
    <path class="il-line il-thin" d="M52 46h52M53 42h52M54 38h52"/>
    <path class="il-blue il-ink" d="M50 50l6-36h48l-6 36z"/>
    <path class="il-gold il-ink il-thin" d="M58 18l-4 28"/>
    <path class="il-white il-ink il-thin" d="M70 30c4-6 14-8 22-4-4 6-14 8-22 4z"/>
    <path class="il-white il-ink il-thin" d="M76 30l-4 6 6-3M84 28l2-6-6 4"/>
    <circle class="il-water il-ink il-thin" cx="88" cy="27" r="1.6"/>
    <path class="il-light il-thin" d="M68 40h20M66 44h14"/>
    <circle class="il-grey il-ink" cx="58" cy="56" r="4.5"/><circle class="il-grey il-ink" cx="102" cy="56" r="4.5"/>
    <circle class="il-smoke il-ink il-thin" cx="46" cy="22" r="5"/><circle class="il-smoke il-ink il-thin" cx="40" cy="30" r="3.4"/>
    <circle class="il-smoke il-ink il-thin" cx="114" cy="18" r="5"/><circle class="il-smoke il-ink il-thin" cx="120" cy="26" r="3"/>
    <path class="il-yellow" d="M82 0l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4zM112 36l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM44 40l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`,

  // A creature split down the middle: the left half a boxy android with one glowing screen eye, the right half a
  // dripping green slime blob with one googly eye; each half looks a different way, under two question marks.
  'sl.hybrid-dna': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="70" cy="8" r="1"/><circle class="il-yellow" cx="100" cy="6" r="1.2"/><circle class="il-white" cx="148" cy="60" r="1"/>
    <path class="il-light il-thin" d="M8 0c16 12 16 24 0 36s-16 24 0 36 16 24 0 36" opacity="0.7"/>
    <path class="il-light il-thin" d="M24 0c-16 12-16 24 0 36s16 24 0 36-16 24 0 36" opacity="0.7"/>
    <g class="il-ink il-thin"><rect class="il-red" x="8" y="8" width="16" height="3"/><rect class="il-yellow" x="5" y="26" width="22" height="3"/><rect class="il-blue" x="8" y="44" width="16" height="3"/><rect class="il-green" x="5" y="62" width="22" height="3"/><rect class="il-red" x="8" y="80" width="16" height="3"/><rect class="il-yellow" x="5" y="98" width="22" height="3"/></g>
    <path class="il-light il-thin" d="M138 0c16 12 16 24 0 36s-16 24 0 36 16 24 0 36" opacity="0.7"/>
    <path class="il-light il-thin" d="M154 0c-16 12-16 24 0 36s16 24 0 36-16 24 0 36" opacity="0.7"/>
    <g class="il-ink il-thin"><rect class="il-green" x="138" y="8" width="16" height="3"/><rect class="il-blue" x="135" y="26" width="22" height="3"/><rect class="il-red" x="138" y="44" width="16" height="3"/><rect class="il-yellow" x="135" y="62" width="22" height="3"/><rect class="il-blue" x="138" y="80" width="16" height="3"/><rect class="il-green" x="135" y="98" width="22" height="3"/></g>
    <ellipse class="il-slime" cx="98" cy="110" rx="22" ry="5" opacity="0.6"/>
    <rect class="il-metal il-ink" x="62" y="92" width="10" height="14"/>
    <rect class="il-grey il-ink" x="56" y="102" width="18" height="7" rx="3"/>
    <path class="il-metal il-ink" d="M80 60H58v34h22z"/>
    <path class="il-line il-thin" d="M60 66h20M60 86h20"/>
    <circle class="il-red" cx="70" cy="76" r="2.4"/><circle class="il-glow" cx="76" cy="76" r="2.4"/>
    <path class="il-metal il-ink" d="M58 66l-14 14 4 4 14-12z"/>
    <path class="il-grey il-ink" d="M44 80l-6 2 2 6 4-2 2 4 4-2z"/>
    <path class="il-slime il-ink" d="M80 60h10c10 0 16 10 14 22-1 8-4 14-2 22 1 4-4 6-6 2l-1-4-3 6c-2 3-6 2-6-1v-6l-6 4z"/>
    <path class="il-slime il-ink" d="M102 72c8 0 14 6 16 14-1 3-4 3-5 0-2-4-6-6-11-6z"/>
    <path class="il-metal il-ink" d="M80 22H62c-6 0-8 4-8 8v20c0 6 2 8 8 8h18z"/>
    <path class="il-dark il-ink il-thin" d="M80 28H64c-3 0-4 2-4 4v14c0 3 1 4 4 4h16z"/>
    <path class="il-line" d="M62 22l-4-8"/><circle class="il-red il-ink il-thin" cx="57" cy="12" r="2.6"/>
    <rect class="il-glow" x="66" y="34" width="8" height="6" rx="1"/>
    <rect class="il-dark" x="66" y="34" width="3" height="3"/>
    <path class="il-glow" d="M66 45h14v2H66z"/>
    <path class="il-slime il-ink" d="M80 22c14 0 24 8 24 20 0 10-4 16-14 18h-10z"/>
    <path class="il-slime il-ink il-thin" d="M98 56c2 4 0 8 2 10 2 1 3-2 1-4"/>
    <circle class="il-white il-ink" cx="92" cy="36" r="7"/>
    <circle class="il-dark" cx="95" cy="32" r="3"/>
    <path class="il-line" d="M84 48q4 4 8 0t8 1"/>
    <ellipse class="il-white" cx="98" cy="46" rx="2" ry="1.2" opacity="0.6"/>
    <path class="il-line il-thick" d="M60 4c0-5 7-5 7 0 0 3-3.5 3-3.5 7"/><circle class="il-dark" cx="63.5" cy="15" r="1.6"/>
    <path class="il-line il-thick" d="M100 6c0 -5 7 -5 7 0 0 3-3.5 3-3.5 7" transform="rotate(20 103 10)"/><circle class="il-dark" cx="102" cy="18" r="1.6"/>`,

  // Day half and night half: a yawning, droopy-eyed android with bags under its screen eyes holds a mop and bucket
  // on the sunny side and a pilot's helmet on the starry side; sleepy zigzags drift up.
  'sl.double-shift': `
    <rect class="il-sky" x="0" y="0" width="80" height="120"/>
    <rect class="il-night" x="80" y="0" width="80" height="120"/>
    <circle class="il-yellow il-ink" cx="18" cy="18" r="10"/>
    <path class="il-line il-thin" d="M18 2v-4M32 8l3-3M34 20h4M4 8l-3-3M2 20h-4"/>
    <path class="il-yellow il-ink il-thin" d="M148 8a10 10 0 1 0 6 16 8 8 0 1 1 -6 -16z"/>
    <circle class="il-white" cx="96" cy="10" r="1"/><circle class="il-white" cx="120" cy="30" r="1.1"/><circle class="il-yellow" cx="150" cy="44" r="1.2"/><circle class="il-white" cx="104" cy="44" r="0.9"/>
    <rect class="il-dark" x="0" y="104" width="160" height="16"/>
    <path class="il-light il-thin" d="M0 106h160" opacity="0.4"/>
    <rect class="il-metal il-ink" x="68" y="88" width="9" height="14"/><rect class="il-metal il-ink" x="83" y="88" width="9" height="14"/>
    <rect class="il-grey il-ink" x="64" y="100" width="15" height="6" rx="3"/><rect class="il-grey il-ink" x="81" y="100" width="15" height="6" rx="3"/>
    <rect class="il-blue il-ink" x="60" y="58" width="40" height="32" rx="6"/>
    <path class="il-line il-thin" d="M64 66h12M64 70h12"/>
    <path class="il-metal il-ink" d="M60 64l-14 8 2 4 14-7z"/>
    <path class="il-wood il-ink" d="M42 30h4v74h-4z"/>
    <circle class="il-grey il-ink" cx="46" cy="74" r="4.5"/>
    <path class="il-white il-ink" d="M34 106l4-8h12l4 8z"/>
    <path class="il-line il-thin" d="M36 104l1-3M40 105l1-4M44 105v-4M48 105l-1-4M52 104l-1-3"/>
    <path class="il-metal il-ink" d="M16 88h18l-2 18H18z"/>
    <path class="il-water il-ink il-thin" d="M17 92h16"/>
    <path class="il-line il-thin" d="M18 88q7-8 14 0"/>
    <circle class="il-water il-ink il-thin" cx="22" cy="84" r="2"/><circle class="il-water il-ink il-thin" cx="28" cy="80" r="1.5"/>
    <path class="il-metal il-ink" d="M100 64l14 8-2 4-14-7z"/>
    <circle class="il-grey il-ink" cx="114" cy="76" r="4.5"/>
    <circle class="il-white il-ink" cx="126" cy="82" r="14"/>
    <path class="il-dark il-ink il-thin" d="M116 80q10-10 22 0v6q-10 6-22 0z"/>
    <path class="il-light il-thin" d="M120 80q6-4 12 0"/>
    <path class="il-red il-ink il-thin" d="M114 72q12-8 24 0" />
    <rect class="il-metal il-ink" x="74" y="52" width="12" height="7"/>
    <rect class="il-metal il-ink" x="60" y="24" width="40" height="30" rx="7"/>
    <rect class="il-dark il-ink il-thin" x="64" y="28" width="32" height="21" rx="3"/>
    <path class="il-glow" d="M68 36h8v2a4 2 0 0 1 -8 0zM84 36h8v2a4 2 0 0 1 -8 0z"/>
    <path class="il-line il-thin" d="M68 36h8M84 36h8"/>
    <path class="il-light il-thin" d="M68 42q4 2.5 8 0M84 42q4 2.5 8 0" opacity="0.6"/>
    <ellipse class="il-glow" cx="80" cy="45" rx="3" ry="2.6"/>
    <path class="il-line" d="M80 24v-6"/><circle class="il-red il-ink il-thin" cx="80" cy="16" r="2.4"/>
    <path class="il-light" d="M100 18l6 0-6 6h6M110 8l5 0-5 5h5"/>`,
};
