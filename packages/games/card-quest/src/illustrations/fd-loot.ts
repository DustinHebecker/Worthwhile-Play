/* Fridge illustrations: loot. */
export const FD_LOOT: Readonly<Record<string, string>> = {
  // A fresh, smug tomato mummified in three layers of cling film (bow on top, pinned arms); a cobweb with a spider
  // has grown over it, the fuzzy old yoghurt next to it stares in disbelief.
  'fd.cling-wrapped': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-line il-thin" d="M6 8h28M6 8l22 20M6 8v28M14 8q2 6-8 8M23 8q1 11-17 16M32 8q-2 19-26 26" opacity="0.5"/>
    <path class="il-line il-thin" d="M22 22v12"/><circle class="il-dark" cx="22" cy="36" r="2.6"/><path class="il-line il-thin" d="M18 33l8 5M18 38l8-5"/><circle class="il-white" cx="21" cy="35.4" r="0.7"/><circle class="il-white" cx="23" cy="35.4" r="0.7"/>
    <path class="il-red il-ink" d="M80 34c20 0 32 14 32 32s-14 30-32 30-32-12-32-30 12-32 32-32z"/>
    <path class="il-light il-thick" d="M58 54q4-10 14-13" opacity="0.8"/>
    <path class="il-green il-ink il-thin" d="M80 38l-11-5 7-1-4-6 7 4 1-8 3 8 6-5-2 7 8-1-10 6z"/>
    <path class="il-line il-thin" d="M64 55l11 2M96 55l-11 2"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="63" r="5"/><circle class="il-dark" cx="72" cy="63.8" r="2.3"/>
    <circle class="il-white il-ink il-thin" cx="89" cy="63" r="5"/><circle class="il-dark" cx="90" cy="63.8" r="2.3"/>
    <path class="il-line il-thin" d="M66 63h10M84 63h10" opacity="0.6"/>
    <path class="il-dark il-ink il-thin" d="M71 75q9 8 18 0z"/>
    <circle class="il-pink" cx="62" cy="72" r="3.4" opacity="0.8"/><circle class="il-pink" cx="98" cy="72" r="3.4" opacity="0.8"/>
    <path class="il-line" d="M50 70q-3 9 3 16M110 70q3 9-3 16"/>
    <path class="il-white il-ink il-thin" d="M80 26c27 0 39 18 39 40s-16 37-39 37-39-15-39-37 12-40 39-40z" opacity="0.38"/>
    <path class="il-white il-ink il-thin" d="M80 27l-13-11 3 13zM80 27l13-11-3 13z" opacity="0.7"/>
    <path class="il-line il-thin" d="M43 54q37 16 74-6M42 72q38 14 76-6M46 89q34 12 68-6" opacity="0.45"/>
    <path class="il-light" d="M47 60q30 11 62-2M50 80q28 10 58-2M60 98q14 4 30 0" opacity="0.9"/>
    <path class="il-light il-thick" d="M104 40q8 8 10 18" opacity="0.9"/>
    <rect class="il-blue il-ink" x="122" y="84" width="30" height="14" rx="2"/><path class="il-white il-ink il-thin" d="M122 84l4-7h26l-2 7z"/>
    <path class="il-line il-thin" d="M126 91h20" opacity="0.5"/>
    <path class="il-white il-ink il-thin" d="M126 80q-4-8-10-12l-2 9q5 2 7 7z" opacity="0.5"/>
    <path class="il-yellow il-ink il-thin" d="M136 17l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-white il-ink il-thin" d="M124 33l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-white il-ink" d="M16 80h26l-3 18H19z"/>
    <circle class="il-green" cx="22" cy="93" r="2.2" opacity="0.8"/><circle class="il-green" cx="36" cy="95" r="1.8" opacity="0.8"/><circle class="il-green" cx="33" cy="88" r="1.3" opacity="0.8"/>
    <path class="il-metal il-ink il-thin" d="M13 77l28-7 1 4-28 7z"/>
    <path class="il-slime il-ink il-thin" d="M18 76q2-5 4 0M26 74q2-5 4 0M34 72q2-5 4 0"/>
    <circle class="il-white il-ink il-thin" cx="24" cy="85" r="3"/><circle class="il-dark" cx="24.8" cy="85" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="34" cy="85" r="3"/><circle class="il-dark" cx="34.8" cy="85" r="1.4"/>
    <ellipse class="il-dark" cx="29" cy="92" rx="1.7" ry="2.2"/>
    <path class="il-line il-thin" d="M12 66q-2-4 0-7t0-7M44 62q2-4 0-7" opacity="0.6"/>`,

  // A bread bun dipped in shiny pink glaze with sprinkles, wearing sunglasses against its own shine; a dull green
  // leftover blob glowers at it in jealousy.
  'fd.glazed': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-wood il-ink" d="M42 92c0-26 16-40 38-40s38 14 38 40c0 4-4 6-8 6H50c-4 0-8-2-8-6z"/>
    <path class="il-wood-dark" d="M48 94h64" opacity="0.5"/>
    <path class="il-pink il-ink" d="M45 80C47 62 62 52 80 52S113 62 115 80q-3 3-6 0v4q-3 4-6 0v-3q-4 2-8 0v7q-3 4-6 0v-6q-4 2-8 0v3q-3 4-6 0v-4q-4 2-8 0v6q-3 4-6 0v-6q-3 2-6 0q-4 2-6-1z"/>
    <g opacity="0.95"><rect class="il-yellow" x="58" y="58" width="5" height="2" rx="1" transform="rotate(30 60 59)"/><rect class="il-blue" x="70" y="55" width="5" height="2" rx="1" transform="rotate(-20 72 56)"/><rect class="il-white" x="86" y="56" width="5" height="2" rx="1" transform="rotate(50 88 57)"/><rect class="il-green" x="98" y="60" width="5" height="2" rx="1" transform="rotate(-40 100 61)"/><rect class="il-yellow" x="104" y="70" width="5" height="2" rx="1" transform="rotate(20 106 71)"/><rect class="il-blue" x="52" y="70" width="5" height="2" rx="1" transform="rotate(70 54 71)"/><rect class="il-white" x="78" y="76" width="5" height="2" rx="1" transform="rotate(-10 80 77)"/><rect class="il-green" x="64" y="75" width="5" height="2" rx="1" transform="rotate(35 66 76)"/></g>
    <path class="il-dark il-ink il-thin" d="M61 64h15l-2 8h-11zM84 64h15l-2 8h-11z"/><path class="il-line il-thin" d="M76 65h8M61 65l-6-3M99 65l6-3"/>
    <path class="il-light il-thin" d="M64 66l4 4M87 66l4 4"/>
    <path class="il-dark il-ink il-thin" d="M69 88q11 7 22 0z"/><path class="il-white" d="M72 88.6h16l-1.5 2h-13z"/>
    <path class="il-light il-thick" d="M56 62q6-8 15-10"/><path class="il-light" d="M104 66q2 4 2 8"/>
    <path class="il-line" d="M43 88q-8-2-8 6M117 88q6 0 6-8"/>
    <path class="il-yellow il-ink il-thin" d="M36 34l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/>
    <path class="il-white il-ink il-thin" d="M122 41l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M54 26l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M104 26l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-light il-thin" d="M30 54l-6-2M32 62l-7 2M128 58l6-1"/>
    <path class="il-slime il-ink" d="M127 98c-1.6-15 1.6-30 13-30s14.6 15 13 30q-3.3 -2.4-6.5 0t-6.5 0-6.5 0-6.5 0z"/>
    <circle class="il-green" cx="134" cy="90" r="2.2" opacity="0.8"/><circle class="il-green" cx="146" cy="84" r="1.6" opacity="0.8"/><circle class="il-green" cx="143" cy="93" r="1.4" opacity="0.8"/>
    <path class="il-line il-thin" d="M132 76l6 2M148 76l-6 2"/>
    <circle class="il-white il-ink il-thin" cx="135" cy="81" r="2.8"/><circle class="il-dark" cx="133.7" cy="81.3" r="1.3"/>
    <circle class="il-white il-ink il-thin" cx="145" cy="81" r="2.8"/><circle class="il-dark" cx="143.7" cy="81.3" r="1.3"/>
    <path class="il-line il-thin" d="M134 91q6-4 12 0"/>
    <path class="il-line il-thin" d="M128 88q4 4 10 2M152 88q-4 4-10 2"/>
    <path class="il-line il-thin" d="M132 62l3-4 3 4 3-4 3 4 3-4 3 4"/>`,

  // A chubby, grinning bell pepper in flames; the cheese cube that poked it wails with a smoking fingertip, and the
  // monster it hit cries too, scorch mark and all.
  'fd.extra-hot': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-orange il-ink" d="M52 66c-8-12-4-26 4-32 0 8 4 10 6 6 0-10 6-18 14-26 0 10 4 14 8 10 2-6 2-10 0-14 10 6 16 16 14 26 4-2 6-6 6-12 8 8 10 24 4 42z"/>
    <path class="il-yellow" d="M62 60c-2-8 2-14 6-18 0 6 4 8 6 4 2-8 6-12 10-16 0 8 4 10 6 6 6 6 8 14 6 24z"/>
    <path class="il-red il-ink" d="M80 46c-6-6-30-6-32 16-2 18 6 32 14 36 6 3 11-2 18-2s12 5 18 2c8-4 16-18 14-36-2-22-26-22-32-16z"/>
    <path class="il-line il-thin" d="M60 52q-6 20 2 42M100 52q6 20-2 42" opacity="0.5"/>
    <path class="il-light il-thick" d="M55 62q2-8 8-11" opacity="0.8"/>
    <path class="il-green il-ink il-thin" d="M68 49q12-7 24 0q-12 4-24 0z"/>
    <path class="il-green il-ink" d="M77 48c0-6 2-9 7-10l1.5 3.5c-3 1-4 3-4 6.5z"/>
    <path class="il-line il-thick" d="M63 60l12 5M97 60l-12 5"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="69" r="4.6"/><circle class="il-dark" cx="71" cy="69.8" r="2.1"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="69" r="4.6"/><circle class="il-dark" cx="89" cy="69.8" r="2.1"/>
    <path class="il-dark il-ink il-thin" d="M66 79q14 12 28 0z"/><path class="il-white" d="M69 80h22l-2 2.6H71z"/>
    <path class="il-line il-thin" d="M40 46q-3-4 0-8t0-8M122 46q3-4 0-8t0-8M30 58q-3-4 0-8" opacity="0.7"/>
    <path class="il-gold il-ink il-thin" d="M12 80l6-6h22l-6 6z"/><rect class="il-yellow il-ink il-thin" x="12" y="80" width="22" height="18"/><path class="il-gold il-ink il-thin" d="M34 80l6-6v18l-6 6z"/>
    <circle class="il-gold" cx="16" cy="95" r="1.5"/><circle class="il-gold" cx="30" cy="94" r="1.8"/><circle class="il-gold" cx="37" cy="84" r="1.2"/>
    <path class="il-line il-thin" d="M15 84l3 2-3 2M31 84l-3 2 3 2"/><path class="il-line il-thin" d="M15 81l4 1M31 81l-4 1"/>
    <ellipse class="il-dark" cx="23" cy="91" rx="3" ry="2.6"/>
    <path class="il-water il-ink il-thin" d="M9 74q3 4 0 6q-3-2 0-6z"/>
    <path class="il-water il-ink il-thin" d="M5 82q2.7 3.6 0 5.4q-2.7-1.8 0-5.4z"/>
    <path class="il-water il-ink il-thin" d="M14 68q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M3 92q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-line" d="M38 87q6-3 11-8"/><circle class="il-red il-ink il-thin" cx="49.5" cy="78.5" r="1.8"/>
    <circle class="il-smoke il-ink il-thin" cx="47" cy="72" r="2.6"/><circle class="il-smoke il-ink il-thin" cx="44" cy="66" r="1.8"/>
    <path class="il-slime il-ink" d="M120 98c-1.9-15 1.9-30 16-30s17.9 15 16 30q-4 -2.4-8 0t-8 0-8 0-8 0z"/>
    <circle class="il-green" cx="128" cy="92" r="2" opacity="0.8"/><circle class="il-green" cx="146" cy="90" r="1.6" opacity="0.8"/>
    <ellipse class="il-dark" cx="141" cy="74" rx="6" ry="3.5" opacity="0.7"/>
    <path class="il-orange il-ink il-thin" d="M140 72c-2-4 0-8 2-10 0 3 2 4 3 2 2 3 2 6 0 8z"/>
    <path class="il-line il-thin" d="M126 80q3-3 6 0M140 80q3-3 6 0"/>
    <path class="il-line il-thin" d="M129 90q3-3 6 0t6 0"/>
    <path class="il-water il-ink il-thin" d="M126 82q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M148 82q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M124 90q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>`,

  // A granny jam jar (grey bun, round glasses, gingham cloth cap) clutches a yellowed recipe scroll and holds a
  // finger to her lips: secret! A prize rosette says unbeatable, cobwebs say ancient, a curious lemon wants a peek.
  'fd.grandmas-recipe': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-line il-thin" d="M154 8h-26M154 8l-20 18M154 8v26M146 8q-2 6 8 8M137 8q-1 10 17 15" opacity="0.5"/>
    <circle class="il-smoke" cx="40" cy="30" r="1.2"/><circle class="il-smoke" cx="48" cy="22" r="0.9"/><circle class="il-smoke" cx="118" cy="34" r="1"/>
    <circle class="il-smoke il-ink" cx="80" cy="31" r="7"/><path class="il-line il-thin" d="M76 28q4 2 8 0M86 25l4-3"/>
    <rect class="il-white il-ink" x="52" y="46" width="56" height="52" rx="9" opacity="0.9"/>
    <rect class="il-red" x="56" y="55" width="48" height="39" rx="6"/>
    <circle class="il-dark" cx="62" cy="88" r="1" opacity="0.5"/><circle class="il-dark" cx="99" cy="60" r="1" opacity="0.5"/>
    <path class="il-light il-thick" d="M58 60v22" opacity="0.7"/>
    <rect class="il-metal il-ink" x="56" y="40" width="48" height="8" rx="2"/>
    <path class="il-white il-ink" d="M50 44C52 34 108 34 110 44L107 54L103 50L99 55L94 50L90 55L85 50L81 55L76 50L72 55L67 50L63 55L58 50L54 55Z"/>
    <g class="il-red" opacity="0.85"><rect x="56" y="39" width="5" height="4"/><rect x="66" y="37" width="5" height="5"/><rect x="76" y="36" width="5" height="5"/><rect x="86" y="36" width="5" height="5"/><rect x="96" y="37" width="5" height="5"/><rect x="61" y="45" width="5" height="4"/><rect x="71" y="45" width="5" height="4"/><rect x="81" y="45" width="5" height="4"/><rect x="91" y="45" width="5" height="4"/><rect x="101" y="44" width="4" height="4"/></g>
    <path class="il-line" d="M53 50q27 4 54 0"/><path class="il-line il-thin" d="M107 50q9-7 9 2q-6 2-9-2zM107 50q5 8-1 9"/>
    <path class="il-smoke il-ink il-thin" d="M64 60q6-3 11 0M85 60q6-3 11 0"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="67" r="6" opacity="0.45"/><circle class="il-white il-ink il-thin" cx="90" cy="67" r="6" opacity="0.45"/><path class="il-line il-thin" d="M76 67h8"/>
    <path class="il-line il-thin" d="M67 68q3-3 6 0"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="67" r="2.8"/><circle class="il-dark" cx="90.8" cy="67.5" r="1.3"/>
    <path class="il-line il-thin" d="M62 72l-2 2M98 72l2 2"/>
    <path class="il-line" d="M73 79q7 4 14 0"/>
    <path class="il-line" d="M53 84q-6 4-4 10"/>
    <path class="il-smoke il-ink il-thin" d="M52 50q-6 2-4 8 4 0 5-4zM108 50q6 2 4 8-4 0-5-4z"/>
    <path class="il-blue il-ink il-thin" d="M93 85l-3 9 4-2 2 3 1-8zM101 85l3 9-4-2-2 3-1-8z"/>
    <circle class="il-gold il-ink il-thin" cx="97" cy="82" r="6"/>
    <path class="il-yellow il-ink il-thin" d="M97 78.6l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/>
    <path class="il-line" d="M108 72q3 0 5-3"/>
    <g transform="rotate(6 128 70)"><rect class="il-paper il-ink" x="112" y="50" width="34" height="40"/>
    <ellipse class="il-gold" cx="141" cy="64" rx="3.4" ry="2.6" opacity="0.5"/>
    <path class="il-line il-thin" d="M116 59q4-3 8 0t8 0 8 0M116 65h22M116 71q4-3 8 0t8 0M116 77h14"/>
    <path class="il-red il-ink il-thin" d="M137 81c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z"/>
    <rect class="il-paper il-ink" x="109" y="46" width="40" height="7" rx="3.5"/><rect class="il-paper il-ink" x="109" y="88" width="40" height="7" rx="3.5"/>
    <path class="il-red il-ink il-thin" d="M126 46h4v49h-4z"/>
    <path class="il-line il-thick" d="M124 64a4 4 0 0 1 8 0v4"/><rect class="il-gold il-ink il-thin" x="121" y="66" width="14" height="11" rx="2"/><circle class="il-dark" cx="128" cy="70.5" r="1.4"/><path class="il-dark" d="M127.3 71h1.4l.5 3.4h-2.4z"/></g>
    <ellipse class="il-yellow il-ink" cx="27" cy="86" rx="13" ry="11"/><path class="il-yellow il-ink il-thin" d="M14 86l-3 0M40 86l3 0"/>
    <path class="il-light il-thin" d="M19 80q3-3 7-3"/>
    <circle class="il-white il-ink il-thin" cx="23" cy="85" r="3"/><circle class="il-dark" cx="24.2" cy="84.4" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="32" cy="85" r="3"/><circle class="il-dark" cx="33.2" cy="84.4" r="1.4"/>
    <ellipse class="il-dark" cx="28" cy="92" rx="1.4" ry="1.7"/>
    <path class="il-line" d="M30 66q0-5 4-5t4 4-4 4v3"/><circle class="il-dark" cx="34" cy="75" r="1.2"/>`,

  // A shaken soda can with a shocked face pops its tab: a wide fan of fizz bubbles bursts everywhere, a lettuce under
  // a tiny umbrella grumbles, a soaked monster spits out foam.
  'fd.fizz-explosion': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-light il-thin" d="M70 46l-8-8M90 46l8-8M80 44v-8M64 52l-12-4M96 52l12-4"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="40" r="4.5"/>
    <circle class="il-white il-ink il-thin" cx="72" cy="30" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="91" cy="26" r="5"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="16" r="3.4"/>
    <circle class="il-white il-ink il-thin" cx="66" cy="18" r="4"/>
    <circle class="il-white il-ink il-thin" cx="101" cy="12" r="3"/>
    <circle class="il-white il-ink il-thin" cx="57" cy="32" r="3.4"/>
    <circle class="il-white il-ink il-thin" cx="108" cy="34" r="4.2"/>
    <circle class="il-white il-ink il-thin" cx="46" cy="22" r="3"/>
    <circle class="il-white il-ink il-thin" cx="118" cy="20" r="4"/>
    <circle class="il-white il-ink il-thin" cx="37" cy="38" r="2.6"/>
    <circle class="il-white il-ink il-thin" cx="128" cy="38" r="3"/>
    <circle class="il-white il-ink il-thin" cx="30" cy="14" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="137" cy="10" r="2.6"/>
    <circle class="il-white il-ink il-thin" cx="52" cy="7" r="2.4"/>
    <circle class="il-white il-ink il-thin" cx="86" cy="6" r="2.6"/>
    <circle class="il-white il-ink il-thin" cx="116" cy="6" r="2"/>
    <circle class="il-white il-ink il-thin" cx="62" cy="4" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="24" cy="28" r="2"/>
    <circle class="il-white il-ink il-thin" cx="142" cy="26" r="2.2"/>
    <path class="il-water il-ink il-thin" d="M60 18q3 4 0 6q-3-2 0-6z"/>
    <path class="il-water il-ink il-thin" d="M100 22q2.7 3.6 0 5.4q-2.7-1.8 0-5.4z"/>
    <path class="il-water il-ink il-thin" d="M44 40q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M118 44q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M76 26q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <path class="il-water il-ink il-thin" d="M130 14q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <rect class="il-teal il-ink" x="56" y="58" width="48" height="40" rx="6"/>
    <path class="il-white il-ink il-thin" d="M56 74q12-6 24 0t24 0v8q-12-6-24 0t-24 0z"/>
    <path class="il-light il-thick" d="M61 62v8M61 86v6" opacity="0.7"/>
    <path class="il-line il-thin" d="M58 94q22 5 44 0"/>
    <path class="il-line il-thin" d="M64 62l9 2M96 62l-9 2"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="68" r="4.4"/><circle class="il-dark" cx="71" cy="68" r="2"/>
    <circle class="il-white il-ink il-thin" cx="89" cy="68" r="4.4"/><circle class="il-dark" cx="89" cy="68" r="2"/>
    <ellipse class="il-dark il-ink il-thin" cx="80" cy="89" rx="4" ry="3.6"/>
    <path class="il-line il-thin" d="M50 64l-6-2M50 72h-7M50 80l-6 2M110 64l6-2M110 72h7M110 80l6 2"/>
    <ellipse class="il-metal il-ink" cx="80" cy="58" rx="24" ry="5"/>
    <path class="il-white il-ink" d="M58 58c-6-2-6-10 0-10 0-6 8-8 12-4 2-6 12-6 14-1 4-4 12-2 12 4 6 0 8 8 2 11-10 3-30 3-40 0z"/>
    <ellipse class="il-metal il-ink il-thin" cx="98" cy="45" rx="4.5" ry="2.6" transform="rotate(-40 98 45)"/>
    <path class="il-green il-ink" d="M14 98c-4-10 0-20 6-22-2-6 4-10 8-6 4-4 10-2 10 4 6 2 8 14 4 24z"/>
    <path class="il-line il-thin" d="M28 98v-14M28 88l-6-4M28 92l6-4" opacity="0.6"/>
    <path class="il-line il-thin" d="M19 82l5 1M37 82l-5 1"/>
    <circle class="il-white il-ink il-thin" cx="23" cy="86" r="2.6"/><circle class="il-dark" cx="23.6" cy="86.6" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="33" cy="86" r="2.6"/><circle class="il-dark" cx="32.4" cy="86.6" r="1.2"/>
    <path class="il-line il-thin" d="M24 93q4-2 8 0"/>
    <path class="il-line" d="M38 90q6-4 6-26"/>
    <path class="il-red il-ink" d="M28 64q16-14 32 0q-4-2-8 0-4-2-8 0-4-2-8 0-4-2-8 0z"/>
    <circle class="il-white il-ink il-thin" cx="34" cy="56" r="2.4"/><circle class="il-white il-ink il-thin" cx="50" cy="54" r="2.8"/>
    <path class="il-slime il-ink" d="M121 98c-1.8-15 1.8-30 15-30s16.8 15 15 30q-3.8 -2.4-7.5 0t-7.5 0-7.5 0-7.5 0z"/>
    <circle class="il-green" cx="128" cy="92" r="2" opacity="0.8"/><circle class="il-green" cx="146" cy="90" r="1.6" opacity="0.8"/>
    <path class="il-white il-ink" d="M122 74c0-8 6-8 8-6 2-5 10-5 12 0 3-3 9 0 8 6q-14 4-28 0z"/>
    <path class="il-white il-ink il-thin" d="M128 75v5a1.6 1.6 0 0 0 3.2 0v-4M142 76v4a1.6 1.6 0 0 0 3.2 0v-4"/>
    <path class="il-line il-thin" d="M127 84l3 2-3 2M146 84l-3 2 3 2"/>
    <ellipse class="il-dark" cx="136" cy="92" rx="2.4" ry="1.8"/>
    <circle class="il-white il-ink il-thin" cx="128" cy="96" r="1.6"/><circle class="il-white il-ink il-thin" cx="124" cy="92" r="1.2"/>`,

  // A tipped-over caramel jar grins from the shelf above while gooey caramel drapes down: the monster below is glued
  // into a caramel puddle, sticky strands stretching from its lifted foot and hands.
  'fd.caramel-sauce': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <ellipse class="il-gold il-ink il-thin" cx="96" cy="97" rx="50" ry="5"/>
    <path class="il-light il-thin" d="M60 95q10-2 20 0"/>
    <rect class="il-water il-ink il-thin" x="0" y="30" width="100" height="5" opacity="0.7"/>
    <g transform="rotate(-12 40 20)"><rect class="il-white il-ink" x="16" y="10" width="38" height="20" rx="5" opacity="0.9"/><rect class="il-gold" x="18" y="18" width="34" height="10" rx="3"/><rect class="il-white il-ink il-thin" x="12" y="13" width="5" height="14" rx="1.5"/><ellipse class="il-metal il-ink il-thin" cx="55" cy="20" rx="3" ry="10"/><ellipse class="il-gold" cx="55" cy="22" rx="1.6" ry="6"/></g>
    <path class="il-line il-thin" d="M28 18l4 2M40 16l4 2"/>
    <path class="il-gold il-ink il-thin" d="M50 24c10 0 16 2 22 6l26 0v8q-3 4-6 0v12q-2 4-5 0v-6q-3 4-6 0v-4q-3 4-6 0v16q-2 3-5 0v-12q-3 3-6 0v-6q-3 3-5 0v-4h-6v-6z"/>
    <path class="il-light il-thin" d="M58 30h16"/>
    <path class="il-gold il-ink il-thin" d="M100 54q4 4 0 8q-4-4 0-8z"/>
    <path class="il-gold il-ink il-thin" d="M84 98c0-4 1-7 0-10h2.4c-1 3 0 6 0 10z"/>
    <path class="il-line il-thin" d="M42 22l3 2M30 13l2-3"/>
    <path class="il-dark il-ink il-thin" d="M32 22q4 3 8 0z" transform="rotate(-12 36 22)"/>
    <path class="il-slime il-ink" d="M86 92c-2.6-18 2.6-36 22-36s24.6 18 22 36q-5.5 -2.9-11 0t-11 0-11 0-11 0z"/>
    <circle class="il-green" cx="96" cy="82" r="2.4" opacity="0.8"/><circle class="il-green" cx="118" cy="86" r="1.8" opacity="0.8"/><circle class="il-green" cx="112" cy="66" r="1.6" opacity="0.8"/>
    <path class="il-gold il-ink il-thin" d="M98 58c4-6 16-6 20 0 0 3-2 3-3 2v8a1.6 1.6 0 0 1-3.2 0v-6c-2 1-4 1-6 0v4a1.6 1.6 0 0 1-3.2 0v-6c-2 1-4 0-4.6-2z"/>
    <path class="il-line il-thick" d="M97 68l8 3M120 68l-8 3"/>
    <circle class="il-white il-ink il-thin" cx="102" cy="74" r="3.4"/><circle class="il-dark" cx="102.6" cy="74.8" r="1.5"/>
    <circle class="il-white il-ink il-thin" cx="115" cy="74" r="3.4"/><circle class="il-dark" cx="114.4" cy="74.8" r="1.5"/>
    <rect class="il-white il-ink il-thin" x="101" y="80" width="14" height="5" rx="1.5"/><path class="il-line il-thin" d="M105.5 80v5M110.5 80v5"/>
    <path class="il-line il-thin" d="M92 60l-4-3M124 60l4-3M92 64l-5 0"/>
    <path class="il-water il-ink il-thin" d="M126 66q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <ellipse class="il-slime il-ink" cx="96" cy="88" rx="8" ry="4.5" transform="rotate(-14 96 88)"/>
    <ellipse class="il-slime il-ink" cx="122" cy="96" rx="9" ry="4"/>
    <path class="il-gold il-ink il-thin" d="M91 91q-2 3 0 7h1.6q-1-4 0-7zM97 92q1 3 0 6h1.6q0-3-.2-6zM102 90q2 4 4 8h1.6q-2-4-4-8z"/>
    <path class="il-line" d="M88 74q-12-2-18 8M128 74q12 0 16 12"/>
    <circle class="il-gold il-ink il-thin" cx="69" cy="84" r="4"/><circle class="il-gold il-ink il-thin" cx="145" cy="88" r="4"/>
    <path class="il-gold il-ink il-thin" d="M67 87q-1 5 0 10h1.4q0-5 1-10zM144 91q0 3 1 6h1.4q-1-3 0-6z"/>`,

  // An exhausted mustard tube lies flat, rolled up to the last squeeze, its cap rolled away; the monster is plastered
  // in yellow from its mustard hat to its watering eye, with yellow splats all over the fridge walls.
  'fd.whole-tube-of-mustard': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-yellow il-ink il-thin" d="M28.3 22L26.4 23.8L27.6 27.6L23.8 26.4L22 29.6L20.2 26.4L17 27L17.6 23.8L15.3 22L17.6 20.2L17.5 17.5L20.2 17.6L22 14L23.8 17.6L27.3 16.7L26.4 20.2z"/><circle class="il-yellow il-ink il-thin" cx="32.2" cy="16.6" r="1.8"/><circle class="il-yellow il-ink il-thin" cx="13" cy="28.6" r="1.5"/>
    <path class="il-yellow il-ink il-thin" d="M137.3 18L135.7 19.5L136.7 22.7L133.5 21.7L132 24.3L130.5 21.7L127.8 22.2L128.3 19.5L126.4 18L128.3 16.5L128.3 14.3L130.5 14.3L132 11.4L133.5 14.3L136.5 13.5L135.7 16.5z"/><circle class="il-yellow il-ink il-thin" cx="140.5" cy="13.5" r="1.5"/><circle class="il-yellow il-ink il-thin" cx="124.5" cy="23.5" r="1.3"/>
    <path class="il-yellow il-ink il-thin" d="M150.2 52L149 53.2L149.8 55.8L147.2 55L146 57L144.8 55L142.6 55.4L143 53.2L141.5 52L143 50.8L143 49L144.8 49L146 46.7L147.2 49L149.6 48.4L149 50.8z"/><circle class="il-yellow il-ink il-thin" cx="152.8" cy="48.4" r="1.2"/><circle class="il-yellow il-ink il-thin" cx="140" cy="56.4" r="1"/>
    <path class="il-yellow il-ink il-thin" d="M43.7 50L42.6 51.1L43.3 53.3L41.1 52.6L40 54.4L38.9 52.6L37.1 52.9L37.4 51.1L36.1 50L37.4 48.9L37.4 47.4L38.9 47.4L40 45.3L41.1 47.4L43.1 46.9L42.6 48.9z"/><circle class="il-yellow il-ink il-thin" cx="46" cy="46.9" r="1.1"/><circle class="il-yellow il-ink il-thin" cx="34.8" cy="53.9" r="0.9"/>
    <path class="il-yellow il-ink il-thin" d="M69.2 14L68.2 14.9L68.8 16.8L66.9 16.2L66 17.8L65.1 16.2L63.5 16.5L63.8 14.9L62.6 14L63.8 13.1L63.8 11.8L65.1 11.8L66 10L66.9 11.8L68.7 11.3L68.2 13.1z"/><circle class="il-yellow il-ink il-thin" cx="71.1" cy="11.3" r="0.9"/><circle class="il-yellow il-ink il-thin" cx="61.5" cy="17.3" r="0.8"/>
    <path class="il-slime il-ink" d="M73 98c-4-30 4-60 33-60s37 30 33 60q-8.3 -4.8-16.5 0t-16.5 0-16.5 0-16.5 0z"/>
    <circle class="il-green" cx="86" cy="90" r="2.4" opacity="0.8"/><circle class="il-green" cx="128" cy="88" r="2" opacity="0.8"/><circle class="il-green" cx="124" cy="60" r="1.6" opacity="0.8"/>
    <path class="il-yellow il-ink" d="M84 44c4-10 40-10 44 0 2 4-1 6-4 4v8a3 3 0 0 1-6 0v-6c-3 2-6 2-8 0v12a3 3 0 0 1-6 0v-10c-3 2-6 2-8 0v6a3 3 0 0 1-6 0v-8c-3 1-6-2-6-6z"/>
    <path class="il-light il-thin" d="M92 40q6-3 12-3"/>
    <circle class="il-yellow il-ink il-thin" cx="96" cy="68" r="7"/><path class="il-line il-thin" d="M93 66l3 2-3 2" opacity="0.7"/>
    <circle class="il-white il-ink il-thin" cx="116" cy="68" r="4.6"/><circle class="il-dark" cx="115.2" cy="68.8" r="2.1"/>
    <path class="il-line il-thin" d="M110 60l10 2"/>
    <path class="il-water il-ink il-thin" d="M120 74q2.7 3.6 0 5.4q-2.7-1.8 0-5.4z"/>
    <path class="il-dark il-ink il-thin" d="M96 84q10-6 20 0q-10 4-20 0z"/><path class="il-red il-ink il-thin" d="M104 85q2 6 6 0z"/>
    <path class="il-yellow il-ink il-thin" d="M91.2 76L90.2 76.9L90.8 78.8L88.9 78.2L88 79.8L87.1 78.2L85.5 78.5L85.8 76.9L84.6 76L85.8 75.1L85.8 73.8L87.1 73.8L88 72L88.9 73.8L90.7 73.3L90.2 75.1z"/><circle class="il-yellow il-ink il-thin" cx="93.1" cy="73.3" r="0.9"/><circle class="il-yellow il-ink il-thin" cx="83.5" cy="79.3" r="0.8"/>
    <path class="il-yellow il-ink il-thin" d="M129.6 82L128.5 83L129.2 85.2L127 84.5L126 86.3L125 84.5L123.1 84.9L123.5 83L122.2 82L123.5 81L123.5 79.5L125 79.5L126 77.5L127 79.5L129 79L128.5 81z"/><circle class="il-yellow il-ink il-thin" cx="131.8" cy="78.9" r="1"/><circle class="il-yellow il-ink il-thin" cx="120.9" cy="85.7" r="0.9"/>
    <path class="il-yellow il-ink il-thin" d="M106.7 92L105.9 92.8L106.4 94.4L104.8 93.9L104 95.3L103.2 93.9L101.8 94.2L102.1 92.8L101.1 92L102.1 91.2L102.1 90.1L103.2 90.1L104 88.5L104.8 90.1L106.3 89.7L105.9 91.2z"/><circle class="il-yellow il-ink il-thin" cx="108.4" cy="89.7" r="0.8"/><circle class="il-yellow il-ink il-thin" cx="100.1" cy="94.9" r="0.7"/>
    <path class="il-smoke il-ink il-thin" d="M74 52c-4-2-4-8 0-8 0-4 6-4 6 0"/><path class="il-smoke il-ink il-thin" d="M138 52c4-2 4-8 0-8 0-4-6-4-6 0"/>
    <path class="il-line" d="M74 80q-8 0-10-10M138 80q8 0 10-10"/>
    <path class="il-line il-thin" d="M60 70l4 3M62 64l-1 4M152 70l-4 3M150 64l1 4"/>
    <path class="il-yellow il-ink" d="M30 80h18l6 5h4v6h-4l-6 5H30z"/>
    <path class="il-red" d="M40 81h4v14h-4z"/><path class="il-line il-thin" d="M30 80h18l6 5h4v6h-4l-6 5H30"/>
    <circle class="il-yellow il-ink" cx="24" cy="88" r="9"/><path class="il-line il-thin" d="M24 88m-5 0a5 5 0 1 1 5 5a3 3 0 1 1 2.6-4.4" opacity="0.8"/>
    <path class="il-line il-thin" d="M31 85q2-2 4 0M45 85q2-2 4 0"/><path class="il-line il-thin" d="M35 91q4 2 6 0"/>
    <path class="il-white il-ink il-thin" d="M56 74q2 4 0 6q-2-2 0-6z"/>
    <path class="il-yellow il-ink il-thin" d="M58 88a2 2 0 0 1 4 0v2h-4z"/>
    <rect class="il-red il-ink il-thin" x="64" y="91" width="7" height="7" rx="1.2" transform="rotate(20 67 94)"/>
    <path class="il-line il-thin" d="M74 96h4M76 92h3" opacity="0.6"/>`,

  // A grinning striped popcorn bag erupts with POP lines; popcorn flies across and covers the monster’s face
  // completely, it gropes about blindly under a question mark.
  'fd.popcorn-blast': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-slime il-ink" d="M95 98c-3-26 3-52 25-52s28 26 25 52q-6.3 -4.2-12.5 0t-12.5 0-12.5 0-12.5 0z"/>
    <circle class="il-green" cx="104" cy="88" r="2.4" opacity="0.8"/><circle class="il-green" cx="136" cy="90" r="2" opacity="0.8"/>
    <path class="il-line" d="M96 82q-10-6-12-16M144 82q10-6 12-16"/>
    <circle class="il-slime il-ink il-thin" cx="84" cy="64" r="3.2"/><circle class="il-slime il-ink il-thin" cx="156" cy="64" r="3"/>
    <path class="il-line" d="M140 30q0-6 5-6t5 5-5 5v3"/><circle class="il-dark" cx="145" cy="42" r="1.3"/>
    <ellipse class="il-dark" cx="122" cy="88" rx="3" ry="2.4"/>
    <path class="il-white il-ink" d="M14 60h40l-6 38H20z"/>
    <path class="il-red" d="M20 61h6l-1 36h-4zM31 61h6v36h-6zM42 61h6l-2 36h-4z"/>
    <path class="il-line" d="M14 60h40l-6 38H20z"/>
    <ellipse class="il-white il-ink il-thin" cx="34" cy="80" rx="11" ry="9"/>
    <circle class="il-white il-ink il-thin" cx="30" cy="78" r="2.6"/><circle class="il-dark" cx="30.6" cy="77.4" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="38" cy="78" r="2.6"/><circle class="il-dark" cx="38.6" cy="77.4" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M29 83q5 5 10 0z"/>
    <g class="il-white il-ink il-thin"><circle cx="22" cy="52" r="3.2"/><circle cx="25" cy="50" r="2.7"/><circle cx="23.5" cy="54.8" r="2.5"/></g><circle class="il-yellow" cx="23.3" cy="52.4" r="1.2"/>
    <g class="il-white il-ink il-thin"><circle cx="30" cy="48" r="3.5"/><circle cx="33.3" cy="45.8" r="3"/><circle cx="31.7" cy="51.1" r="2.8"/></g><circle class="il-yellow" cx="31.4" cy="48.4" r="1.3"/>
    <g class="il-white il-ink il-thin"><circle cx="40" cy="50" r="3.2"/><circle cx="43" cy="48" r="2.7"/><circle cx="41.5" cy="52.8" r="2.5"/></g><circle class="il-yellow" cx="41.3" cy="50.4" r="1.2"/>
    <g class="il-white il-ink il-thin"><circle cx="48" cy="54" r="2.9"/><circle cx="50.7" cy="52.2" r="2.4"/><circle cx="49.4" cy="56.5" r="2.3"/></g><circle class="il-yellow" cx="49.2" cy="54.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="34" cy="40" r="2.9"/><circle cx="36.7" cy="38.2" r="2.4"/><circle cx="35.4" cy="42.5" r="2.3"/></g><circle class="il-yellow" cx="35.2" cy="40.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="26" cy="30" r="2.6"/><circle cx="28.4" cy="28.4" r="2.2"/><circle cx="27.2" cy="32.2" r="2"/></g><circle class="il-yellow" cx="27" cy="30.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="46" cy="32" r="2.9"/><circle cx="48.7" cy="30.2" r="2.4"/><circle cx="47.4" cy="34.5" r="2.3"/></g><circle class="il-yellow" cx="47.2" cy="32.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="60" cy="26" r="2.6"/><circle cx="62.4" cy="24.4" r="2.2"/><circle cx="61.2" cy="28.2" r="2"/></g><circle class="il-yellow" cx="61" cy="26.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="70" cy="40" r="2.9"/><circle cx="72.7" cy="38.2" r="2.4"/><circle cx="71.4" cy="42.5" r="2.3"/></g><circle class="il-yellow" cx="71.2" cy="40.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="84" cy="24" r="2.6"/><circle cx="86.4" cy="22.4" r="2.2"/><circle cx="85.2" cy="26.2" r="2"/></g><circle class="il-yellow" cx="85" cy="24.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="96" cy="36" r="2.9"/><circle cx="98.7" cy="34.2" r="2.4"/><circle cx="97.4" cy="38.5" r="2.3"/></g><circle class="il-yellow" cx="97.2" cy="36.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="62" cy="52" r="2.6"/><circle cx="64.4" cy="50.4" r="2.2"/><circle cx="63.2" cy="54.2" r="2"/></g><circle class="il-yellow" cx="63" cy="52.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="80" cy="56" r="2.6"/><circle cx="82.4" cy="54.4" r="2.2"/><circle cx="81.2" cy="58.2" r="2"/></g><circle class="il-yellow" cx="81" cy="56.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="104" cy="52" r="2.9"/><circle cx="106.7" cy="50.2" r="2.4"/><circle cx="105.4" cy="54.5" r="2.3"/></g><circle class="il-yellow" cx="105.2" cy="52.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="110" cy="64" r="2.9"/><circle cx="112.7" cy="62.2" r="2.4"/><circle cx="111.4" cy="66.5" r="2.3"/></g><circle class="il-yellow" cx="111.2" cy="64.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="118" cy="58" r="2.9"/><circle cx="120.7" cy="56.2" r="2.4"/><circle cx="119.4" cy="60.5" r="2.3"/></g><circle class="il-yellow" cx="119.2" cy="58.4" r="1.1"/>
    <g class="il-white il-ink il-thin"><circle cx="126" cy="64" r="2.6"/><circle cx="128.4" cy="62.4" r="2.2"/><circle cx="127.2" cy="66.2" r="2"/></g><circle class="il-yellow" cx="127" cy="64.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="116" cy="74" r="2.6"/><circle cx="118.4" cy="72.4" r="2.2"/><circle cx="117.2" cy="76.2" r="2"/></g><circle class="il-yellow" cx="117" cy="74.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="130" cy="76" r="2.6"/><circle cx="132.4" cy="74.4" r="2.2"/><circle cx="131.2" cy="78.2" r="2"/></g><circle class="il-yellow" cx="131" cy="76.3" r="1"/>
    <g class="il-white il-ink il-thin"><circle cx="108" cy="20" r="2.2"/><circle cx="110.1" cy="18.6" r="1.9"/><circle cx="109.1" cy="22" r="1.8"/></g><circle class="il-yellow" cx="108.9" cy="20.3" r="0.8"/>
    <g class="il-white il-ink il-thin"><circle cx="14" cy="22" r="2.2"/><circle cx="16.1" cy="20.6" r="1.9"/><circle cx="15.1" cy="24" r="1.8"/></g><circle class="il-yellow" cx="14.9" cy="22.3" r="0.8"/>
    <g class="il-white il-ink il-thin"><circle cx="138" cy="30" r="2.2"/><circle cx="140.1" cy="28.6" r="1.9"/><circle cx="139.1" cy="32" r="1.8"/></g><circle class="il-yellow" cx="138.9" cy="30.3" r="0.8"/>
    <g class="il-white il-ink il-thin"><circle cx="72" cy="12" r="2.2"/><circle cx="74.1" cy="10.6" r="1.9"/><circle cx="73.1" cy="14" r="1.8"/></g><circle class="il-yellow" cx="72.9" cy="12.3" r="0.8"/>
    <path class="il-line il-thin" d="M20 42l-6-6M48 42l6-6M34 36v-8" opacity="0.8"/>
    <path class="il-yellow il-ink il-thin" d="M58 36l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M90 42l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M16 37l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-line il-thin" d="M66 34l6 0M76 48l6 2M100 44l5-2" opacity="0.6"/>`,

  // A tomato stomps on a spoon catapult balanced on a sugar cube; screaming peas fly in an arc and bonk the monster,
  // while one stray pea ricochets off the wall – as accurate as at dinner.
  'fd.flying-peas': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-line il-thin il-dash" d="M24 64Q66 -22 124 54"/>
    <path class="il-line il-thin il-dash" d="M20 62q-6-16-10-30"/>
    <circle class="il-green il-ink il-thin" cx="46" cy="31.1" r="4.6"/><path class="il-light il-thin" d="M43 30.1q1-2 3-2.6" opacity="0.8"/><circle class="il-dark" cx="44.6" cy="30.5" r="0.9"/><circle class="il-dark" cx="47.6" cy="30.5" r="0.9"/><ellipse class="il-dark" cx="46.2" cy="33.1" rx="1.1" ry="1.3"/>
    <circle class="il-green il-ink il-thin" cx="68" cy="18.8" r="4.6"/><path class="il-light il-thin" d="M65 17.8q1-2 3-2.6" opacity="0.8"/><circle class="il-dark" cx="66.6" cy="18.2" r="0.9"/><circle class="il-dark" cx="69.6" cy="18.2" r="0.9"/><ellipse class="il-dark" cx="68.2" cy="20.8" rx="1.1" ry="1.3"/>
    <circle class="il-green il-ink il-thin" cx="90.6" cy="23" r="4.6"/><path class="il-light il-thin" d="M87.6 22q1-2 3-2.6" opacity="0.8"/><circle class="il-dark" cx="89.2" cy="22.4" r="0.9"/><circle class="il-dark" cx="92.2" cy="22.4" r="0.9"/><ellipse class="il-dark" cx="90.8" cy="25" rx="1.1" ry="1.3"/>
    <circle class="il-green il-ink il-thin" cx="11" cy="26" r="4.6"/><path class="il-light il-thin" d="M8 25q1-2 3-2.6" opacity="0.8"/><circle class="il-dark" cx="9.6" cy="25.4" r="0.9"/><circle class="il-dark" cx="12.6" cy="25.4" r="0.9"/><ellipse class="il-dark" cx="11.2" cy="28" rx="1.1" ry="1.3"/>
    <path class="il-yellow il-ink il-thin" d="M5 14l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-line il-thin" d="M8 18l-2-4M14 18l2-4"/>
    <rect class="il-white il-ink" x="42" y="86" width="14" height="12" rx="1.5"/><path class="il-line il-thin" d="M45 90h2M50 94h2M51 89h1" opacity="0.6"/>
    <g transform="translate(18 76) rotate(18)"><ellipse class="il-metal il-ink" cx="0" cy="0" rx="11" ry="6.5"/><ellipse class="il-grey" cx="0" cy="-0.6" rx="7" ry="3.6" opacity="0.5"/><path class="il-metal il-ink" d="M10 -1.8h52a3 3 0 0 1 0 7H10z"/><path class="il-light il-thin" d="M16 0h40"/></g>
    <circle class="il-red il-ink" cx="88" cy="80" r="11"/>
    <path class="il-green il-ink il-thin" d="M88 70l-5-3 4 0-1-4 3 3 3-3-1 4 4 0-5 3z"/>
    <path class="il-light il-thin" d="M81 75q2-3 5-4"/>
    <circle class="il-white il-ink il-thin" cx="84" cy="79" r="2.6"/><circle class="il-dark" cx="84.6" cy="79.6" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="92" cy="79" r="2.6"/><circle class="il-dark" cx="92.6" cy="79.6" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M84 84q4 4 8 0z"/>
    <path class="il-line" d="M78 80l-6-8M98 80l6-8"/><path class="il-line" d="M84 90l-1 3M92 90l1 3"/>
    <path class="il-line il-thin" d="M76 94l-4 2M100 94l4 2M98 88l5-1"/>
    <path class="il-slime il-ink" d="M112 98c-2.4-22 2.4-44 20-44s22.4 22 20 44q-5 -3.5-10 0t-10 0-10 0-10 0z"/>
    <circle class="il-green" cx="120" cy="90" r="2.2" opacity="0.8"/><circle class="il-green" cx="144" cy="92" r="1.8" opacity="0.8"/>
    <path class="il-slime il-ink il-thin" d="M124 56q4-8 8 0zM136 54q4-8 8 0z"/>
    <path class="il-yellow il-ink il-thin" d="M140 42l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M118 47l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <circle class="il-white il-ink il-thin" cx="126" cy="70" r="4"/><circle class="il-dark" cx="128" cy="70" r="1.8"/><circle class="il-white il-ink il-thin" cx="138" cy="70" r="4"/><circle class="il-dark" cx="136" cy="70" r="1.8"/>
    <path class="il-line il-thin" d="M126 82q6-4 12 0"/>
    <circle class="il-green il-ink il-thin" cx="146" cy="94" r="4.6"/><path class="il-light il-thin" d="M143 93q1-2 3-2.6" opacity="0.8"/><circle class="il-dark" cx="144.6" cy="93.4" r="0.9"/><circle class="il-dark" cx="147.6" cy="93.4" r="0.9"/><path class="il-line il-thin" d="M144.6 95.6q1.6 1.4 3.2 0"/>
    <circle class="il-green il-ink il-thin" cx="114" cy="95" r="4.6"/><path class="il-light il-thin" d="M111 94q1-2 3-2.6" opacity="0.8"/><circle class="il-dark" cx="112.6" cy="94.4" r="0.9"/><circle class="il-dark" cx="115.6" cy="94.4" r="0.9"/><path class="il-line il-thin" d="M112.6 96.6q1.6 1.4 3.2 0"/>`,

  // A cheeky bread slice, a chunk torn out of its own crust, flings a handful of crumbs; the monster squeezes its
  // eyes shut, crumbs in its eyes, in its ears, everywhere.
  'fd.handful-of-crumbs': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-wood il-ink" d="M14 98V58C6 54 6 38 20 36C24 30 32 28 38 30l2 4 4-2 2 5 4-1C60 40 60 54 54 58V98Z"/>
    <path class="il-paper" d="M18 95V60C12 56 12 43 22 40C26 35 32 33 37 34l3 4 4-2 2 5 3 0C56 44 56 54 50 60V95Z"/>
    <circle class="il-wood" cx="26" cy="76" r="1" opacity="0.6"/><circle class="il-wood" cx="42" cy="86" r="1" opacity="0.6"/><circle class="il-wood" cx="22" cy="88" r="0.9" opacity="0.6"/><circle class="il-wood" cx="45" cy="54" r="0.9" opacity="0.6"/>
    <path class="il-line il-thin" d="M24 58l7 2M42 60l6-3"/>
    <circle class="il-white il-ink il-thin" cx="28" cy="66" r="3.6"/><circle class="il-dark" cx="29.2" cy="66" r="1.6"/>
    <circle class="il-white il-ink il-thin" cx="43" cy="65" r="3.6"/><circle class="il-dark" cx="44.2" cy="65" r="1.6"/>
    <path class="il-dark il-ink il-thin" d="M28 76q8 7 16-1z"/>
    <path class="il-line" d="M54 72q8-2 12-12"/><path class="il-wood il-ink il-thin" d="M64 60l4-5 3 2-1 5z"/>
    <path class="il-line" d="M14 76q-6 4-4 12"/>
    <path class="il-wood il-ink il-thin" d="M108.9 78.3l2.1 -1.3 1.7 2.1-1.9 1.7z"/>
    <path class="il-wood il-ink il-thin" d="M81.1 60.9l1.9 -1.1 1.5 1.9-1.7 1.5z"/>
    <path class="il-paper il-ink il-thin" d="M119 53l2.7 -1.6 2.2 2.7-2.5 2.2z"/>
    <path class="il-wood il-ink il-thin" d="M128.9 64.6l2.1 -1.3 1.7 2.1-1.9 1.7z"/>
    <path class="il-paper il-ink il-thin" d="M95.3 60.3l2 -1.2 1.6 2-1.8 1.6z"/>
    <path class="il-wood il-ink il-thin" d="M73.8 58.5l1.6 -0.9 1.3 1.6-1.4 1.3z"/>
    <path class="il-paper il-ink il-thin" d="M95.1 58.7l2.7 -1.6 2.2 2.7-2.4 2.2z"/>
    <path class="il-wood il-ink il-thin" d="M114.5 54.4l3.2 -1.9 2.5 3.2-2.9 2.5z"/>
    <path class="il-wood il-ink il-thin" d="M70.1 51.3l3.2 -1.9 2.6 3.2-2.9 2.6z"/>
    <path class="il-wood il-ink il-thin" d="M117.5 68.6l3.2 -1.9 2.6 3.2-2.9 2.6z"/>
    <path class="il-paper il-ink il-thin" d="M116.6 76.1l2.7 -1.6 2.2 2.7-2.4 2.2z"/>
    <path class="il-paper il-ink il-thin" d="M86 66.4l3 -1.8 2.4 3-2.7 2.4z"/>
    <path class="il-wood il-ink il-thin" d="M108.2 58.5l3 -1.8 2.4 3-2.7 2.4z"/>
    <path class="il-wood il-ink il-thin" d="M79.5 54.5l1.9 -1.2 1.6 1.9-1.7 1.6z"/>
    <path class="il-wood il-ink il-thin" d="M99.5 72.8l2.3 -1.4 1.9 2.3-2.1 1.9z"/>
    <path class="il-wood il-ink il-thin" d="M111 70.5l3.4 -2 2.7 3.4-3 2.7z"/>
    <path class="il-paper il-ink il-thin" d="M113.4 44.7l2.2 -1.3 1.8 2.2-2 1.8z"/>
    <path class="il-paper il-ink il-thin" d="M88.5 43.2l2.4 -1.5 1.9 2.4-2.2 1.9z"/>
    <path class="il-wood il-ink il-thin" d="M104.1 39.4l1.7 -1 1.3 1.7-1.5 1.3z"/>
    <path class="il-paper il-ink il-thin" d="M130.1 62.6l2.9 -1.7 2.3 2.9-2.6 2.3z"/>
    <path class="il-wood il-ink il-thin" d="M97.1 43.1l2.7 -1.6 2.1 2.7-2.4 2.1z"/>
    <path class="il-paper il-ink il-thin" d="M131.5 38.2l3.2 -1.9 2.6 3.2-2.9 2.6z"/>
    <path class="il-paper il-ink il-thin" d="M107.7 41l3.2 -1.9 2.6 3.2-2.9 2.6z"/>
    <path class="il-paper il-ink il-thin" d="M103.2 65.1l2.4 -1.4 1.9 2.4-2.2 1.9z"/>
    <path class="il-wood il-ink il-thin" d="M105 61.7l3.4 -2 2.7 3.4-3 2.7z"/>
    <path class="il-wood il-ink il-thin" d="M90.2 61.1l2.6 -1.6 2.1 2.6-2.3 2.1z"/>
    <path class="il-wood il-ink il-thin" d="M84.9 52.5l2.9 -1.8 2.4 2.9-2.6 2.4z"/>
    <path class="il-paper il-ink il-thin" d="M68.8 46.9l3.4 -2.1 2.7 3.4-3.1 2.7z"/>
    <path class="il-wood il-ink il-thin" d="M121.6 81.4l2.3 -1.4 1.9 2.3-2.1 1.9z"/>
    <path class="il-paper il-ink il-thin" d="M86.2 69.1l1.6 -1 1.3 1.6-1.5 1.3z"/>
    <path class="il-paper il-ink il-thin" d="M66.8 50.7l2.8 -1.7 2.2 2.8-2.5 2.2z"/>
    <path class="il-paper il-ink il-thin" d="M113.9 52.6l1.8 -1.1 1.4 1.8-1.6 1.4z"/>
    <path class="il-paper il-ink il-thin" d="M85 44.4l1.8 -1.1 1.4 1.8-1.6 1.4z"/>
    <path class="il-paper il-ink il-thin" d="M77 45.2l2.7 -1.6 2.2 2.7-2.4 2.2z"/>
    <path class="il-line il-thin" d="M70 50l8-4M72 72l8 4M66 60l8 0" opacity="0.5"/>
    <path class="il-slime il-ink" d="M112 98c-2.4-23 2.4-46 20-46s22.4 23 20 46q-5 -3.7-10 0t-10 0-10 0-10 0z"/>
    <circle class="il-green" cx="120" cy="90" r="2.2" opacity="0.8"/><circle class="il-green" cx="144" cy="92" r="1.8" opacity="0.8"/>
    <ellipse class="il-slime il-ink" cx="114" cy="60" rx="5" ry="6"/><ellipse class="il-slime il-ink" cx="150" cy="60" rx="5" ry="6"/>
    <ellipse class="il-dark" cx="114" cy="61" rx="2.2" ry="3" opacity="0.5"/><ellipse class="il-dark" cx="150" cy="61" rx="2.2" ry="3" opacity="0.5"/>
    <path class="il-paper il-ink il-thin" d="M113 58l2.9 -1.7 2.3 2.9-2.6 2.3z"/>
    <path class="il-wood il-ink il-thin" d="M149 59l2.3 -1.4 1.8 2.3-2.1 1.8z"/>
    <path class="il-wood il-ink il-thin" d="M128 54l3.3 -2 2.6 3.3-3 2.6z"/>
    <path class="il-wood il-ink il-thin" d="M138 82l2.8 -1.7 2.2 2.8-2.5 2.2z"/>
    <path class="il-line" d="M122 66l5 3-5 3M142 66l-5 3 5 3"/>
    <ellipse class="il-dark" cx="132" cy="84" rx="4" ry="3"/>
    <path class="il-water il-ink il-thin" d="M118 72q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <path class="il-water il-ink il-thin" d="M146 72q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <path class="il-line il-thin" d="M108 80q-6 2-8 8M156 80q2 4 0 10"/>`,

  // Three fridges stand in a row like a choir, eyes blissfully closed and mouths shut, humming “mmm” in waves and
  // notes; the little monster shakes and sweats with nerves.
  'fd.humming-choir': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 20h160M0 40h160M0 60h160M0 80h160M20 0v100M40 0v100M60 0v100M80 0v100M100 0v100M120 0v100M140 0v100" opacity="0.15"/>
    <rect class="il-wood il-ink il-thin" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" d="M0 110h160M30 100v10M90 100v10M60 110v10M130 110v10" opacity="0.4"/>
    <rect class="il-white il-ink" x="6" y="34" width="32" height="66" rx="5"/>
    <path class="il-line il-thin" d="M6 54h32"/>
    <rect class="il-metal il-ink il-thin" x="31" y="39" width="3" height="10" rx="1.5"/><rect class="il-metal il-ink il-thin" x="31" y="59" width="3" height="14" rx="1.5"/>
    <rect class="il-dark" x="9" y="100" width="5" height="2"/><rect class="il-dark" x="30" y="100" width="5" height="2"/>
    <path class="il-light il-thin" d="M10 40v8"/>
    <path class="il-line il-thin" d="M13 68q3 3 6 0M21 68q3 3 6 0"/>
    <circle class="il-pink" cx="14" cy="76" r="2.6" opacity="0.8"/><circle class="il-pink" cx="26" cy="76" r="2.6" opacity="0.8"/>
    <path class="il-line" d="M16 78q6 2.4 12 0"/><path class="il-line il-thin" d="M30 75l2-1M30 81l2 1"/>
    <rect class="il-white il-ink" x="44" y="26" width="34" height="74" rx="5"/>
    <path class="il-line il-thin" d="M44 46h34"/>
    <rect class="il-metal il-ink il-thin" x="71" y="31" width="3" height="10" rx="1.5"/><rect class="il-metal il-ink il-thin" x="71" y="51" width="3" height="14" rx="1.5"/>
    <rect class="il-dark" x="47" y="100" width="5" height="2"/><rect class="il-dark" x="70" y="100" width="5" height="2"/>
    <path class="il-light il-thin" d="M48 32v8"/>
    <path class="il-line il-thin" d="M51 60q3 3 6 0M61 60q3 3 6 0"/>
    <circle class="il-pink" cx="52" cy="68" r="2.6" opacity="0.8"/><circle class="il-pink" cx="66" cy="68" r="2.6" opacity="0.8"/>
    <path class="il-line" d="M55 70q6 2.4 12 0"/><path class="il-line il-thin" d="M69 67l2-1M69 73l2 1"/>
    <rect class="il-white il-ink" x="84" y="36" width="30" height="64" rx="5"/>
    <path class="il-line il-thin" d="M84 56h30"/>
    <rect class="il-metal il-ink il-thin" x="107" y="41" width="3" height="10" rx="1.5"/><rect class="il-metal il-ink il-thin" x="107" y="61" width="3" height="14" rx="1.5"/>
    <rect class="il-dark" x="87" y="100" width="5" height="2"/><rect class="il-dark" x="106" y="100" width="5" height="2"/>
    <path class="il-light il-thin" d="M88 42v8"/>
    <path class="il-line il-thin" d="M91 70q3 3 6 0M97 70q3 3 6 0"/>
    <circle class="il-pink" cx="92" cy="78" r="2.6" opacity="0.8"/><circle class="il-pink" cx="102" cy="78" r="2.6" opacity="0.8"/>
    <path class="il-line" d="M93 80q6 2.4 12 0"/><path class="il-line il-thin" d="M107 77l2-1M107 83l2 1"/>
    <path class="il-paper il-ink il-thin" d="M51 76h20v14H51z"/><path class="il-line il-thin" d="M54 80h14M54 84h14M54 87h8"/><path class="il-line" d="M48 70q0 10 4 12M74 70q0 10-4 12"/>
    <path class="il-line il-thin" d="M8 26q4-4 8 0t8 0 8 0M46 16q4-4 8 0t8 0 8 0 8 0M86 28q4-4 8 0t8 0 8 0"/>
    <path class="il-line il-thin" d="M12 18q4-4 8 0t8 0M90 20q4-4 8 0t8 0" opacity="0.6"/>
    <ellipse class="il-dark" cx="34" cy="12" rx="3" ry="2.2" transform="rotate(-20 34 12)"/><path class="il-line il-thin" d="M36.6 11V3l4 2"/>
    <ellipse class="il-dark" cx="112" cy="14" rx="3" ry="2.2" transform="rotate(-20 112 14)"/><path class="il-line il-thin" d="M114.6 13V5l4 2"/>
    <ellipse class="il-dark" cx="74" cy="8" rx="2.4" ry="1.8" transform="rotate(-20 74 8)"/><path class="il-line il-thin" d="M76 7V1"/>
    <path class="il-line il-thin" d="M4 104l4 2M38 104l-4 2M42 104l4 2M80 104l-4 2M82 104l4 2M116 104l-4 2"/>
    <path class="il-slime il-ink" d="M123 100c-1.8-15 1.8-30 15-30s16.8 15 15 30q-3.8 -2.4-7.5 0t-7.5 0-7.5 0-7.5 0z"/>
    <circle class="il-green" cx="130" cy="94" r="1.8" opacity="0.8"/><circle class="il-green" cx="146" cy="92" r="1.6" opacity="0.8"/>
    <path class="il-line il-thin" d="M130 76l5-2M146 76l-5-2"/>
    <circle class="il-white il-ink il-thin" cx="133" cy="82" r="3"/><circle class="il-dark" cx="131.6" cy="82" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="143" cy="82" r="3"/><circle class="il-dark" cx="141.6" cy="82" r="1.4"/>
    <path class="il-line il-thin" d="M132 92l2-2 2 2 2-2 2 2 2-2 2 2"/>
    <path class="il-water il-ink il-thin" d="M126 74q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M152 76q2.4 3.2 0 4.8q-2.4-1.6 0-4.8z"/>
    <path class="il-water il-ink il-thin" d="M148 66q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <path class="il-line il-thin" d="M120 82l-3 0M120 88l-3 1M156 82l3 0M156 88l3 1"/>
    <path class="il-line" d="M124 88q-6-6-2-14M152 88q6-6 2-14"/>`,

  // A pat of butter with a long skid streak: the monster slipped on it and flies feet-first through the air, dizzy
  // stars around it, while a little radish legs it with speed lines.
  'fd.butter-on-the-floor': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-yellow il-ink il-thin" d="M74 95h58q4 0 4 3H74z" opacity="0.85"/>
    <path class="il-line il-thin" d="M80 96.5h40" opacity="0.4"/>
    <path class="il-yellow il-ink" d="M58 98l2-10h22l-2 10z"/><path class="il-yellow il-ink il-thin" d="M60 88l4-4h20l-2 4z"/><path class="il-light il-thin" d="M64 86h12"/>
    <g transform="rotate(-105 110 56)">
    <path class="il-slime il-ink" d="M91 72c-2.3-17 2.3-34 19-34s21.3 17 19 34q-4.8 -2.7-9.5 0t-9.5 0-9.5 0-9.5 0z"/>
    <circle class="il-green" cx="100" cy="64" r="2" opacity="0.8"/><circle class="il-green" cx="120" cy="66" r="1.6" opacity="0.8"/>
    <ellipse class="il-slime il-ink" cx="101" cy="75" rx="6" ry="3.4"/><ellipse class="il-slime il-ink" cx="119" cy="75" rx="6" ry="3.4"/>
    <circle class="il-white il-ink il-thin" cx="104" cy="50" r="4.2"/><circle class="il-dark" cx="104" cy="48.6" r="1.9"/>
    <circle class="il-white il-ink il-thin" cx="116" cy="50" r="4.2"/><circle class="il-dark" cx="116" cy="48.6" r="1.9"/>
    <path class="il-line il-thin" d="M99 43l7 2M121 43l-7 2"/>
    <ellipse class="il-dark il-ink il-thin" cx="110" cy="62" rx="3.4" ry="4"/>
    <path class="il-line" d="M92 58q-8-4-10-14M128 58q8-4 10-14"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M98 34l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M132 32l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M116 25l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-line il-thin il-dash" d="M84 92q20-30 40-42" opacity="0.5"/>
    <circle class="il-red il-ink" cx="30" cy="80" r="11"/>
    <path class="il-white il-ink il-thin" d="M24 88q6 5 12 0q-6 3-12 0z"/>
    <path class="il-green il-ink il-thin" d="M30 70c-4-6-10-6-12-4 4 0 8 2 12 4zM30 70c0-6 4-10 8-10-2 4-4 8-8 10z"/>
    <path class="il-light il-thin" d="M23 76q2-3 5-4"/>
    <circle class="il-white il-ink il-thin" cx="26" cy="78" r="2.6"/><circle class="il-dark" cx="25" cy="78" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="33" cy="78" r="2.6"/><circle class="il-dark" cx="32" cy="78" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M26 84q3 3 7 0z"/>
    <path class="il-line" d="M26 90l-6 6M34 90l4 7M20 82l-6 4M40 80l6-4"/>
    <path class="il-line il-thin" d="M46 70h8M48 78h10M46 86h8"/>
    <circle class="il-smoke il-ink il-thin" cx="48" cy="96" r="2.4"/><circle class="il-smoke il-ink il-thin" cx="54" cy="94" r="1.6"/>`,

  // A huge round cabbage “hides” behind a skinny ketchup bottle, bulging out on both sides with only its eyes peeking
  // over; the monster searches with a magnifying glass in the wrong direction.
  'fd.behind-the-ketchup': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-green il-ink" d="M120.0 58.0Q122.3 63.3 114.8 67.3Q119.3 74.6 114.6 78.0Q114.0 83.7 105.5 83.5Q105.7 92.0 100.0 92.6Q96.6 97.3 89.3 92.8Q85.3 100.3 80.0 98.0Q74.7 100.3 70.7 92.8Q63.4 97.3 60.0 92.6Q54.3 92.0 54.5 83.5Q46.0 83.7 45.4 78.0Q40.7 74.6 45.2 67.3Q37.7 63.3 40.0 58.0Q37.7 52.7 45.2 48.7Q40.7 41.4 45.4 38.0Q46.0 32.3 54.5 32.5Q54.3 24.0 60.0 23.4Q63.4 18.7 70.7 23.2Q74.7 15.7 80.0 18.0Q85.3 15.7 89.3 23.2Q96.6 18.7 100.0 23.4Q105.7 24.0 105.5 32.5Q114.0 32.3 114.6 38.0Q119.3 41.4 114.8 48.7Q122.3 52.7 120.0 58.0z"/>
    <path class="il-slime il-ink il-thin" d="M50 66c0-22 14-36 30-36s30 14 30 36c-6-8-16-14-30-14s-24 6-30 14z"/>
    <path class="il-green il-ink il-thin" d="M58 44q22-16 44 0q-22-6-44 0z" opacity="0.8"/>
    <path class="il-line il-thin" d="M80 30v22M66 36q4 8 4 18M94 36q-4 8-4 18M48 74q8-4 16 0M112 74q-8-4-16 0M52 88q8-6 14-4M108 88q-8-6-14-4" opacity="0.5"/>
    <path class="il-light il-thin" d="M58 32q8-8 18-10"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="30" r="4.4"/><circle class="il-dark" cx="72" cy="30" r="2"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="30" r="4.4"/><circle class="il-dark" cx="92" cy="30" r="2"/>
    <path class="il-line il-thin" d="M64 23l8 2M96 23l-8 2"/>
    <path class="il-green il-ink il-thin" d="M64 56q-7-2-7 4 0 5 7 4zM96 56q7-2 7 4 0 5-7 4z"/>
    <path class="il-red il-ink" d="M64 46c0-4 2-6 6-6h20c4 0 6 2 6 6v30c0 6-6 10-10 12h-12c-4-2-10-6-10-12z"/>
    <path class="il-light il-thick" d="M69 48v24" opacity="0.6"/>
    <rect class="il-paper il-ink il-thin" x="68" y="52" width="24" height="20" rx="3"/>
    <circle class="il-red il-ink il-thin" cx="80" cy="63" r="5"/><path class="il-green il-ink il-thin" d="M80 58l-3-2h6z"/>
    <path class="il-white il-ink" d="M70 88h20l2 10H68z"/><path class="il-line il-thin" d="M72 93h16"/>
    <path class="il-line il-thin" d="M38 92q-2 4 2 6M122 92q2 4-2 6" opacity="0.5"/>
    <path class="il-slime il-ink" d="M127 98c-1.6-16 1.6-32 13-32s14.6 16 13 32q-3.3 -2.6-6.5 0t-6.5 0-6.5 0-6.5 0z"/>
    <circle class="il-green" cx="134" cy="92" r="1.8" opacity="0.8"/><circle class="il-green" cx="146" cy="88" r="1.4" opacity="0.8"/>
    <circle class="il-white il-ink il-thin" cx="137" cy="78" r="2.8"/><circle class="il-dark" cx="138.4" cy="78" r="1.3"/>
    <circle class="il-white il-ink il-thin" cx="146" cy="78" r="2.8"/><circle class="il-dark" cx="147.4" cy="78" r="1.3"/>
    <path class="il-line il-thin" d="M136 89q4 2 8 0"/>
    <path class="il-line" d="M150 88l3-6"/><circle class="il-white il-ink" cx="152" cy="76" r="5" opacity="0.6"/><path class="il-light il-thin" d="M150 74l2-2"/>
    <path class="il-line" d="M128 86q-4 0-6-6"/>
    <path class="il-line" d="M132 52q0-5 4-5t4 4-4 4v3"/><circle class="il-dark" cx="136" cy="63" r="1.2"/>`,

  // A strawberry dangles from the handle of a frosty freezer drawer it has yanked open; a whole avalanche of grinning
  // ice cubes tumbles out and buries the monster up to its dazed eyes.
  'fd.ice-cube-avalanche': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <rect class="il-smoke il-ink" x="0" y="0" width="92" height="28"/>
    <path class="il-white il-ink il-thin" d="M0 28q8-6 14 0 6-6 12 0 6-6 12 0 6-6 12 0 6-6 12 0 6-6 12 0 6-6 12 0 6-4 6 0"/>
    <path class="il-white" d="M6 30l2 6 2-6M30 30l2 5 2-5M60 30l2 6 2-6" opacity="0.9"/>
    <g transform="rotate(16 20 30)"><rect class="il-white il-ink" x="14" y="30" width="78" height="22" rx="3"/><path class="il-line il-thin" d="M14 36h78" opacity="0.4"/><rect class="il-metal il-ink" x="40" y="44" width="26" height="5" rx="2.5"/><path class="il-white il-ink il-thin" d="M14 30q6-4 10 0 6-4 10 0 6-4 10 0 6-4 10 0 6-4 10 0 6-4 10 0 6-4 10 0"/></g>
    <g transform="rotate(20 84 50)"><rect class="il-water il-ink il-thin" x="79" y="45" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M81 48l2-1"/><circle class="il-dark" cx="82" cy="50" r="0.9"/><circle class="il-dark" cx="86" cy="50" r="0.9"/><path class="il-line il-thin" d="M82 52.4q2 1.6 4 0"/></g>
    <g transform="rotate(-15 96 56)"><rect class="il-water il-ink il-thin" x="91" y="51" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M93 54l2-1"/></g>
    <g transform="rotate(40 90 66)"><rect class="il-water il-ink il-thin" x="85.5" y="61.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M87.5 64.5l2-1"/></g>
    <g transform="rotate(10 104 46)"><rect class="il-water il-ink il-thin" x="99.5" y="41.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M101.5 44.5l2-1"/><circle class="il-dark" cx="102" cy="46" r="0.9"/><circle class="il-dark" cx="106" cy="46" r="0.9"/><path class="il-line il-thin" d="M102 48.4q2 1.6 4 0"/></g>
    <g transform="rotate(30 110 62)"><rect class="il-water il-ink il-thin" x="105" y="57" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M107 60l2-1"/></g>
    <g transform="rotate(-20 100 78)"><rect class="il-water il-ink il-thin" x="95" y="73" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M97 76l2-1"/><circle class="il-dark" cx="98" cy="78" r="0.9"/><circle class="il-dark" cx="102" cy="78" r="0.9"/><path class="il-line il-thin" d="M98 80.4q2 1.6 4 0"/></g>
    <g transform="rotate(12 114 74)"><rect class="il-water il-ink il-thin" x="109.5" y="69.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M111.5 72.5l2-1"/></g>
    <path class="il-line il-thin" d="M80 40l-4-4M96 38l2-5M114 40l4-4" opacity="0.6"/>
    <path class="il-white il-ink il-thin" d="M84 98q4-16 22-22 6-4 12-4 10 0 18 4 14 6 18 22z"/>
    <circle class="il-slime il-ink" cx="126" cy="72" r="13"/>
    <g transform="rotate(-10 126 58)"><rect class="il-water il-ink il-thin" x="121.5" y="53.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M123.5 56.5l2-1"/></g>
    <circle class="il-white il-ink il-thin" cx="121" cy="72" r="3.4"/><circle class="il-dark" cx="121" cy="72" r="1.3"/><circle class="il-white il-ink il-thin" cx="131" cy="72" r="3.4"/><circle class="il-dark" cx="131" cy="72" r="1.3"/>
    <path class="il-line il-thin" d="M118 64q4-2 6 0M128 64q4-2 6 0"/>
    <g transform="rotate(10 94 90)"><rect class="il-water il-ink il-thin" x="89" y="85" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M91 88l2-1"/></g>
    <g transform="rotate(-14 106 86)"><rect class="il-water il-ink il-thin" x="101" y="81" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M103 84l2-1"/><circle class="il-dark" cx="104" cy="86" r="0.9"/><circle class="il-dark" cx="108" cy="86" r="0.9"/><path class="il-line il-thin" d="M104 88.4q2 1.6 4 0"/></g>
    <g transform="rotate(22 118 90)"><rect class="il-water il-ink il-thin" x="113" y="85" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M115 88l2-1"/></g>
    <g transform="rotate(-6 130 86)"><rect class="il-water il-ink il-thin" x="125" y="81" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M127 84l2-1"/></g>
    <g transform="rotate(14 142 90)"><rect class="il-water il-ink il-thin" x="137" y="85" width="10" height="10" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M139 88l2-1"/><circle class="il-dark" cx="140" cy="90" r="0.9"/><circle class="il-dark" cx="144" cy="90" r="0.9"/><path class="il-line il-thin" d="M140 92.4q2 1.6 4 0"/></g>
    <g transform="rotate(30 112 80)"><rect class="il-water il-ink il-thin" x="107.5" y="75.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M109.5 78.5l2-1"/></g>
    <g transform="rotate(-24 138 78)"><rect class="il-water il-ink il-thin" x="133.5" y="73.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M135.5 76.5l2-1"/></g>
    <g transform="rotate(8 150 84)"><rect class="il-water il-ink il-thin" x="146" y="80" width="8" height="8" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M148 83l2-1"/></g>
    <g transform="rotate(0 124 96)"><rect class="il-water il-ink il-thin" x="119.5" y="91.5" width="9" height="9" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M121.5 94.5l2-1"/></g>
    <g transform="rotate(30 100 96)"><rect class="il-water il-ink il-thin" x="96" y="92" width="8" height="8" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M98 95l2-1"/></g>
    <path class="il-white il-ink il-thin" d="M144 56.6l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/>
    <path class="il-white il-ink il-thin" d="M110 53l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-line" d="M53 51q0 6-2 14M60 52q2 6 4 13"/>
    <path class="il-red il-ink" d="M50 64c-4 0-10 4-8 12 2 8 10 16 14 16s12-8 14-16c2-8-4-12-8-12q-6-2-12 0z"/>
    <path class="il-green il-ink il-thin" d="M48 64l-4-4 6 1 6-4 6 4 6-1-4 4q-8 3-16 0z"/>
    <g class="il-yellow"><circle cx="49" cy="74" r="0.9"/><circle cx="57" cy="72" r="0.9"/><circle cx="64" cy="76" r="0.9"/><circle cx="52" cy="84" r="0.9"/><circle cx="61" cy="85" r="0.9"/></g>
    <circle class="il-white il-ink il-thin" cx="52" cy="76" r="2.4"/><circle class="il-dark" cx="53" cy="76" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="60" cy="76" r="2.4"/><circle class="il-dark" cx="61" cy="76" r="1.1"/>
    <ellipse class="il-dark" cx="56" cy="82" rx="1.6" ry="1.9"/>
    <path class="il-line" d="M52 90l-2 6M60 90l2 6"/>
    <path class="il-white il-ink il-thin" d="M140 18l0 8M136 22h8M137 19l6 6M143 19l-6 6"/><path class="il-white il-ink il-thin" d="M120 10v6M117 13h6"/>`,

  // An egg with a bindle hops over the divider from the bright fresh compartment (a lettuce and a tomato wave a teary
  // goodbye) into the leftovers next door, where a mouldy pudding and a lopsided casserole welcome it with open arms.
  'fd.shelf-swap': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <rect class="il-slime" x="82" y="0" width="78" height="98" opacity="0.18"/>
    <path class="il-line il-thin il-dash" d="M80 10v60" opacity="0.4"/>
    <rect class="il-white il-ink" x="70" y="74" width="20" height="24" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="68" y="71" width="24" height="4" rx="1"/>
    <path class="il-line il-thin" d="M70 82h20M70 90h20" opacity="0.35"/>
    <path class="il-line il-thin il-dash" d="M52 60q28-60 56-14"/>
    <g transform="rotate(14 80 26)"><ellipse class="il-white il-ink" cx="80" cy="26" rx="11" ry="14"/>
    <path class="il-light il-thin" d="M73 20q2-5 6-6"/>
    <circle class="il-white il-ink il-thin" cx="76" cy="24" r="2.6"/><circle class="il-dark" cx="77" cy="24" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="84" cy="24" r="2.6"/><circle class="il-dark" cx="85" cy="24" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M76 31q4 3 8 0z"/></g>
    <path class="il-line" d="M90 22l10-10"/><circle class="il-red il-ink il-thin" cx="102" cy="10" r="5"/><path class="il-white" d="M100 9h1.4v1.4H100zM103 11h1.4v1.4H103z"/>
    <path class="il-line" d="M70 28l-6 6M74 38l-3 7M84 40l3 6"/>
    <path class="il-green il-ink" d="M14 98c-4-14 2-26 10-28-2-8 6-12 10-8 4-4 12-2 12 4 8 2 10 18 6 32z"/>
    <path class="il-line il-thin" d="M30 98V80M30 86l-6-4M30 92l7-4" opacity="0.6"/>
    <path class="il-line il-thin" d="M22 76q3-3 6 0M34 76q3-3 6 0"/>
    <path class="il-water il-ink il-thin" d="M22 80q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <path class="il-water il-ink il-thin" d="M40 80q2.1 2.8 0 4.2q-2.1-1.4 0-4.2z"/>
    <path class="il-line il-thin" d="M26 86q4-2 8 0"/>
    <path class="il-line" d="M48 80q6-4 8-12"/><path class="il-white il-ink il-thin" d="M55 68l6-6 4 5-6 4z"/>
    <circle class="il-red il-ink" cx="60" cy="88" r="10"/><path class="il-green il-ink il-thin" d="M60 78l-4-3h8z"/>
    <path class="il-light il-thin" d="M54 84q2-3 5-3"/>
    <path class="il-line il-thin" d="M55 87q2-2 4 0M62 87q2-2 4 0"/><path class="il-line il-thin" d="M57 93q3-2 6 0"/>
    <path class="il-water il-ink il-thin" d="M56 90q1.8 2.4 0 3.6q-1.8-1.2 0-3.6z"/>
    <path class="il-yellow il-ink il-thin" d="M12 46l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M64 43l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-yellow il-ink il-thin" d="M40 37l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-white il-ink" d="M92 98l3-18h22l3 18z"/>
    <path class="il-gold il-ink" d="M94 80c2-10 22-10 24 0q-2 3-4 0-2 4-4 0-2 4-4 0-2 4-4 0-2 4-4 0z"/>
    <circle class="il-green" cx="100" cy="90" r="2" opacity="0.8"/><circle class="il-green" cx="112" cy="94" r="1.6" opacity="0.8"/><circle class="il-green" cx="104" cy="76" r="1.4" opacity="0.8"/>
    <circle class="il-white il-ink il-thin" cx="101" cy="86" r="2.4"/><circle class="il-dark" cx="101" cy="86.4" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="110" cy="86" r="2.4"/><circle class="il-dark" cx="110" cy="86.4" r="1.1"/>
    <path class="il-dark il-ink il-thin" d="M101 92q5 4 10 0z"/>
    <path class="il-line" d="M92 88q-6-4-6-10M120 88q6-4 8-12"/>
    <rect class="il-earth il-ink" x="124" y="80" width="28" height="18" rx="3"/>
    <path class="il-orange il-ink il-thin" d="M126 82h24v4h-24z"/>
    <path class="il-earth-dark il-ink il-thin" d="M120 76l30-12 2 4-30 12z"/>
    <path class="il-slime il-ink il-thin" d="M128 82q2-4 4 0M140 82q2-4 4 0"/>
    <circle class="il-white il-ink il-thin" cx="132" cy="90" r="2.4"/><circle class="il-dark" cx="132" cy="90" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="143" cy="90" r="2.4"/><circle class="il-dark" cx="143" cy="90" r="1.1"/>
    <path class="il-line il-thin" d="M134 95q4 2 8 0"/>
    <path class="il-line" d="M152 88q4-2 4-10"/>
    <path class="il-line il-thin" d="M130 56q-2-4 0-7t0-7M146 56q-2-4 0-7" opacity="0.6"/>`,

  // A caramel pudding wearing a little crown and sash stands proudly at the very front of the top shelf in the lamp’s
  // spotlight; on the shelf below, a pea, an egg and a cheese wedge gaze up in awe.
  'fd.top-shelf': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <path class="il-glow" d="M60 6h40l8 58H52z" opacity="0.35"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <rect class="il-water il-ink il-thin" x="0" y="64" width="160" height="5" opacity="0.7"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 65.5h40M110 65.5h30M4 99.5h40"/>
    <path class="il-gold il-ink" d="M58 64l6-32c2-6 30-6 32 0l6 32z"/>
    <path class="il-earth-dark il-ink" d="M64 32c2-6 30-6 32 0q-2 4-4 1-2 5-5 1-3 5-6 1-3 5-6 1-3 4-5 0-3 3-6-4z"/>
    <path class="il-light il-thick" d="M64 44l-3 14" opacity="0.7"/>
    <path class="il-red il-ink il-thin" d="M62 46l38 10-1 5-38-10z"/>
    <path class="il-yellow il-ink il-thin" d="M70 30l-2-10 6 5 6-8 6 8 6-5-2 10z"/><circle class="il-red" cx="80" cy="25" r="1.5"/>
    <circle class="il-white il-ink il-thin" cx="73" cy="40" r="3.2"/><circle class="il-dark" cx="73" cy="39.4" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="87" cy="40" r="3.2"/><circle class="il-dark" cx="87" cy="39.4" r="1.4"/>
    <path class="il-line il-thin" d="M69 35l6 1M91 35l-6 1"/>
    <path class="il-line" d="M76 48q4 3 8 0"/>
    <path class="il-line" d="M58 52q-8-4-6-12M102 52q8-6 10-14"/>
    <path class="il-yellow il-ink il-thin" d="M40 17l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-white il-ink il-thin" d="M120 14l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M124 41l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-light il-thin" d="M48 30l-6-3M112 30l6-3"/>
    <path class="il-yellow il-ink" d="M14 98l34-10v10z"/><path class="il-gold il-ink il-thin" d="M14 98l34-10" /><circle class="il-gold" cx="30" cy="95" r="1.6"/><circle class="il-gold" cx="40" cy="93" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="28" cy="92" r="2.2"/><circle class="il-dark" cx="28" cy="91" r="1"/>
    <circle class="il-white il-ink il-thin" cx="36" cy="90" r="2.2"/><circle class="il-dark" cx="36" cy="89" r="1"/>
    <ellipse class="il-white il-ink" cx="80" cy="88" rx="8" ry="10"/>
    <circle class="il-white il-ink il-thin" cx="77" cy="85" r="2.4"/><circle class="il-dark" cx="77" cy="83.8" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="84" cy="85" r="2.4"/><circle class="il-dark" cx="84" cy="83.8" r="1.1"/>
    <ellipse class="il-dark" cx="80.5" cy="92" rx="1.3" ry="1.6"/>
    <circle class="il-green il-ink" cx="124" cy="92" r="6"/>
    <circle class="il-white il-ink il-thin" cx="122" cy="90" r="1.8"/><circle class="il-dark" cx="122" cy="89.1" r="0.8"/>
    <circle class="il-white il-ink il-thin" cx="127" cy="90" r="1.8"/><circle class="il-dark" cx="127" cy="89.1" r="0.8"/>
    <path class="il-line il-thin" d="M90 80l2-3M70 80l-2-3M132 84l2-3"/>
    <path class="il-red" d="M142 94c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z"/>`,

  // A bowl of leftover stew steps out of a glowing microwave with two big steam curls, flexing both arms like a
  // bodybuilder; ding lines sparkle around the open door.
  'fd.freshly-reheated': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 20h160M0 40h160M0 60h160M0 80h160M20 0v100M40 0v100M60 0v100M80 0v100M100 0v100M120 0v100M140 0v100" opacity="0.15"/>
    <rect class="il-wood il-ink il-thin" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" d="M0 110h160M30 100v10M90 100v10M60 110v10M130 110v10" opacity="0.4"/>
    <rect class="il-wood-dark il-ink" x="0" y="86" width="160" height="14"/><path class="il-light il-thin" d="M0 88h160" opacity="0.4"/>
    <rect class="il-metal il-ink" x="92" y="30" width="62" height="56" rx="4"/>
    <rect class="il-dark il-ink il-thin" x="97" y="36" width="40" height="44" rx="2"/>
    <rect class="il-glow" x="99" y="38" width="36" height="40" rx="2" opacity="0.6"/>
    <ellipse class="il-white il-ink il-thin" cx="117" cy="72" rx="14" ry="3"/>
    <rect class="il-grey il-ink il-thin" x="141" y="38" width="9" height="40" rx="2"/><circle class="il-dark" cx="145.5" cy="46" r="2"/><circle class="il-dark" cx="145.5" cy="54" r="2"/><path class="il-line il-thin" d="M143 62h5M143 66h5M143 70h5"/>
    <path class="il-metal il-ink" d="M97 36l-22-8v52l22 0z"/><path class="il-dark il-ink il-thin" d="M93 40l-14-5v38l14 2z" opacity="0.6"/>
    <path class="il-line il-thin" d="M120 22l2-6M132 24l5-5M108 24l-3-5"/>
    <path class="il-white il-ink" d="M28 62h52c0 16-10 24-26 24S28 78 28 62z"/>
    <path class="il-blue il-ink il-thin" d="M30 68h48q-1 3-2 5H32q-1-2-2-5z"/>
    <ellipse class="il-earth il-ink" cx="54" cy="62" rx="26" ry="5"/>
    <circle class="il-orange" cx="44" cy="61" r="2"/><circle class="il-green" cx="56" cy="63" r="1.6"/><circle class="il-orange" cx="64" cy="60" r="1.8"/><circle class="il-earth-dark" cx="50" cy="60" r="1.4"/>
    <path class="il-light il-thick" d="M42 58c-6-6 6-10 0-18s4-12 2-18" opacity="0.9"/><path class="il-light il-thick" d="M64 58c-6-6 6-10 0-18s4-12 2-18" opacity="0.9"/>
    <path class="il-line il-thin" d="M42 58c-6-6 6-10 0-18s4-12 2-18M64 58c-6-6 6-10 0-18s4-12 2-18" opacity="0.25"/>
    <circle class="il-white il-ink il-thin" cx="46" cy="77" r="2.6"/><circle class="il-dark" cx="46" cy="77" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="60" cy="77" r="2.6"/><circle class="il-dark" cx="60" cy="77" r="1.2"/>
    <path class="il-line il-thin" d="M42 72l6 2M64 72l-6 2"/>
    <path class="il-dark il-ink il-thin" d="M48 81q5 4 10 0z"/>
    <path class="il-white il-ink" d="M30 68l-12 2c-4-2-6-8-4-14l-2-4 5-3 3 3c2 2 2 6 1 9 4-6 10-5 11-1z"/>
    <path class="il-white il-ink" d="M78 68l12 2c4-2 6-8 4-14l2-4-5-3-3 3c-2 2-2 6-1 9-4-6-10-5-11-1z"/>
    <path class="il-line il-thin" d="M21 62q2-2 4 0M87 62q-2-2-4 0"/>
    <path class="il-line" d="M46 86v4M62 86v4"/>
    <path class="il-yellow il-ink il-thin" d="M18 36l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M88 39l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-yellow il-ink il-thin" d="M30 21l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>`,

  // An open cookbook shows a framed portrait of a dumpling right next to a picture of a cherry cake; the real
  // dumpling stands beside it, blushing and pointing proudly at itself.
  'fd.in-the-cookbook': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 20h160M0 40h160M0 60h160M0 80h160M20 0v100M40 0v100M60 0v100M80 0v100M100 0v100M120 0v100M140 0v100" opacity="0.15"/>
    <rect class="il-wood il-ink il-thin" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" d="M0 110h160M30 100v10M90 100v10M60 110v10M130 110v10" opacity="0.4"/>
    <rect class="il-wood-dark il-ink" x="0" y="90" width="160" height="10"/>
    <path class="il-red il-ink" d="M6 92l4-48h52l4 4 4-4h52l4 48z"/>
    <path class="il-white il-ink" d="M10 88l4-42c16-4 36-2 52 4v42c-16-6-36-8-56-4z"/>
    <path class="il-white il-ink" d="M66 50c16-6 36-8 52-4l4 42c-20-4-40-2-56 4z"/>
    <path class="il-line il-thin" d="M66 50v42"/>
    <path class="il-gold il-ink il-thin" d="M94 46v-6h4v6l-2 2z" transform="translate(0 2)"/>
    <rect class="il-wood il-ink" x="20" y="52" width="38" height="30" rx="2" transform="rotate(4 39 67)"/>
    <rect class="il-sky" x="24" y="56" width="30" height="22" transform="rotate(4 39 67)"/>
    <path class="il-paper il-ink il-thin" d="M30 76c0-8 4-12 10-12s10 4 10 12z"/><path class="il-line il-thin" d="M36 66l2 4M40 64v5M44 66l-2 4"/>
    <circle class="il-dark" cx="37" cy="72" r="0.9"/><circle class="il-dark" cx="43" cy="72" r="0.9"/><path class="il-line il-thin" d="M38 74.4q2 1.4 4 0"/>
    <path class="il-line il-thin" d="M16 84q20-4 44 2" opacity="0.6"/>
    <path class="il-line il-thin" d="M72 56q18-6 38-4M72 62q18-5 38-3M72 68q12-3 20-2" opacity="0.6"/>
    <path class="il-paper il-ink il-thin" d="M82 86l10-12 18 4v8q-14-2-28 0z"/><path class="il-pink il-ink il-thin" d="M82 86v-4l10-12 18 4v4l-18-4z"/>
    <circle class="il-red il-ink il-thin" cx="96" cy="68" r="3"/><path class="il-line il-thin" d="M96 65q2-4 5-4"/>
    <path class="il-line il-thin" d="M84 82h24" opacity="0.4"/>
    <path class="il-paper il-ink" d="M126 90c-4 0-6-4-4-10 2-10 10-16 18-16s16 6 18 16c2 6 0 10-4 10z"/>
    <path class="il-line il-thin" d="M134 66l3 6M140 64v7M146 66l-3 6"/>
    <path class="il-light il-thin" d="M126 78q2-6 6-8"/>
    <circle class="il-white il-ink il-thin" cx="135" cy="78" r="2.8"/><circle class="il-dark" cx="135" cy="78.3" r="1.3"/>
    <circle class="il-white il-ink il-thin" cx="146" cy="78" r="2.8"/><circle class="il-dark" cx="146" cy="78.3" r="1.3"/>
    <circle class="il-pink" cx="130" cy="84" r="3" opacity="0.9"/><circle class="il-pink" cx="151" cy="84" r="3" opacity="0.9"/>
    <path class="il-dark il-ink il-thin" d="M137 84q4 4 8 0z"/>
    <path class="il-line" d="M123 82q-10-4-14-12"/><path class="il-line il-thin" d="M110 70l-4-1M110 70l-1-4"/>
    <path class="il-line il-thin" d="M150 56l3-4M140 54v-5M130 56l-3-4"/>
    <path class="il-yellow il-ink il-thin" d="M14 26l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M70 27l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>`,

  // One round character, left half a red radish with leaves, right half a cheesy pepperoni pizza, cheese dripping
  // over the seam; it licks its lips, and a little tomato taster gives a delighted thumbs-up with hearts.
  'fd.fusion-cuisine': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.22"/>
    <path class="il-glow" d="M56 6h48l24 92H32z" opacity="0.16"/>
    <rect class="il-metal il-ink il-thin" x="58" y="0" width="44" height="6" rx="2"/>
    <rect class="il-glow il-ink il-thin" x="64" y="5" width="32" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M6 0v120M154 0v120" opacity="0.25"/>
    <rect class="il-white il-ink il-thin" x="10" y="106" width="140" height="16" rx="3" opacity="0.8"/>
    <path class="il-line il-thin" d="M66 112h28"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="160" height="5" opacity="0.7"/>
    <path class="il-light il-thin" d="M4 99.5h40M100 99.5h30"/>
    <path class="il-line il-thick" d="M74 28q-6-8-14-12M76 27q0-10 4-18M72 28q-12-2-20 2"/>
    <path class="il-grass il-ink il-thin" d="M60 16c-6-6-4-12 0-14 4 2 8 8 2 14zM80 9c-2-6 2-10 6-8 2 4 0 8-6 8zM52 30c-8 0-12-4-10-8 6-2 10 2 10 8z"/>
    <path class="il-line il-thin" d="M60 15l2-10M80 9l4-6M51 29l-7-6" opacity="0.5"/>
    <path class="il-pink il-ink" d="M80 26C58 26 44 42 44 60s14 34 36 34z"/>
    <path class="il-red" d="M80 28C60 28 47 42 46 58q16-8 34-6z" opacity="0.55"/>
    <path class="il-white il-ink il-thin" d="M80 94C66 94 54 88 49 76q14 8 31 8z"/>
    <path class="il-line il-thin" d="M74 93q-2 4 1 7"/>
    <path class="il-light il-thick" d="M54 48q4-10 14-14" opacity="0.8"/>
    <path class="il-orange il-ink" d="M80 26c22 0 36 16 36 34s-14 34-36 34z"/>
    <path class="il-yellow il-ink il-thin" d="M80 32c18 0 30 12 30 28s-12 28-30 28z"/>
    <circle class="il-red il-ink il-thin" cx="96" cy="42" r="4.4"/><circle class="il-red il-ink il-thin" cx="104" cy="64" r="4"/><circle class="il-red il-ink il-thin" cx="92" cy="80" r="4"/>
    <path class="il-green il-ink il-thin" d="M102 52q4-4 6 0q-3 3-6 0z"/><circle class="il-white" cx="98" cy="72" r="1"/><circle class="il-white" cx="88" cy="38" r="1"/>
    <path class="il-yellow il-ink il-thin" d="M80 44q-6 0-6 6v6a2 2 0 0 0 4 0v-3q2 0 2-3z"/>
    <path class="il-yellow il-ink il-thin" d="M80 76q-4 2-4 6v4a2 2 0 0 0 4 0z"/>
    <circle class="il-white il-ink il-thin" cx="68" cy="56" r="4.4"/><circle class="il-dark" cx="69" cy="56" r="2"/>
    <circle class="il-white il-ink il-thin" cx="92" cy="56" r="4.4"/><circle class="il-dark" cx="91" cy="56" r="2"/>
    <path class="il-line il-thin" d="M62 48l9 2M98 48l-9 2"/>
    <path class="il-dark il-ink il-thin" d="M70 68q10 9 20 0z"/><path class="il-pink il-ink il-thin" d="M84 70q4 0 4 4-3 2-5-2z"/>
    <circle class="il-pink" cx="60" cy="66" r="3" opacity="0.7"/>
    <path class="il-line" d="M44 66q-8 2-10 10M116 66q8 2 10 10"/>
    <circle class="il-red il-ink" cx="138" cy="86" r="10"/><path class="il-green il-ink il-thin" d="M138 76l-4-3h8z"/>
    <circle class="il-white il-ink il-thin" cx="135" cy="84" r="2.2"/><circle class="il-dark" cx="135" cy="84" r="1"/>
    <circle class="il-white il-ink il-thin" cx="142" cy="84" r="2.2"/><circle class="il-dark" cx="142" cy="84" r="1"/>
    <path class="il-dark il-ink il-thin" d="M134 90q4 3 8 0z"/>
    <path class="il-line" d="M128 86q-6-2-6-8"/><path class="il-line il-thick" d="M122 78v-4"/>
    <path class="il-red" d="M128 60c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2zM144 50c-1.5-2-4.5-.7-3 1.5l3 3 3-3c1.5-2.2-1.5-3.5-3-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M30 26l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M130 23l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>`,

  // An egg working two shifts, split day/night: on the bright day side it holds a whisk with a wide-awake eye; on the
  // dark night side it shines a torch into the fridge, its other eye droopy with dark bags.
  'fd.side-dish': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="80" height="120" opacity="0.22"/>
    <rect class="il-night" x="80" y="0" width="80" height="120"/>
    <circle class="il-yellow il-ink il-thin" cx="20" cy="18" r="8"/><path class="il-line il-thin" d="M20 4v3M20 29v3M6 18h3M31 18h3M10 8l2 2M28 26l2 2M30 8l-2 2M10 28l2-2"/>
    <path class="il-white il-ink il-thin" d="M146 10a9 9 0 1 0 6 14 7 7 0 1 1-6-14z"/><circle class="il-white" cx="112" cy="14" r="1"/><circle class="il-white" cx="128" cy="30" r="0.8"/><circle class="il-yellow" cx="100" cy="36" r="1"/><circle class="il-white" cx="150" cy="44" r="0.8"/>
    <rect class="il-water il-ink il-thin" x="0" y="98" width="80" height="5" opacity="0.7"/><rect class="il-grey il-ink il-thin" x="80" y="98" width="80" height="5"/>
    <rect class="il-white il-ink il-thin" x="10" y="107" width="70" height="16" rx="3" opacity="0.8"/><rect class="il-grey il-ink il-thin" x="80" y="107" width="70" height="16" rx="3"/>
    <path class="il-torch" d="M114 60l46-22v44z"/>
    <ellipse class="il-slime il-ink il-thin" cx="146" cy="64" rx="7" ry="6"/><circle class="il-white" cx="144" cy="62" r="1.6"/><circle class="il-white" cx="149" cy="62" r="1.6"/><circle class="il-dark" cx="144" cy="62" r="0.8"/><circle class="il-dark" cx="149" cy="62" r="0.8"/><path class="il-line il-thin" d="M140 54l2 2M152 54l-2 2"/>
    <ellipse class="il-white il-ink" cx="80" cy="62" rx="26" ry="34"/>
    <path class="il-smoke" d="M80 28a26 34 0 0 1 0 68z" opacity="0.55"/>
    <path class="il-line" d="M80 28a26 34 0 0 1 0 68"/>
    <path class="il-light il-thick" d="M62 44q4-10 12-12"/>
    <path class="il-blue il-ink il-thin" d="M58 76h22v20q-14 0-20-12z"/><path class="il-line il-thin" d="M62 76l-4-18"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="56" r="5"/><circle class="il-dark" cx="70.6" cy="56" r="2.3"/>
    <path class="il-line il-thin" d="M64 47l10 2"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="57" r="5"/><path class="il-dark" d="M85 57a5 5 0 0 1 10 0z"/><circle class="il-dark" cx="90" cy="58.4" r="1.6"/>
    <path class="il-purple il-ink il-thin" d="M85 63q5 4 10 0" opacity="0.8"/><path class="il-line il-thin" d="M86 66q4 2 8 0"/>
    <path class="il-line" d="M72 74q8 4 16 0"/>
    <path class="il-line" d="M54 66q-10 2-16-4"/>
    <path class="il-metal il-ink il-thin" d="M37 61l-6-6 3-3 6 6z"/><g class="il-line il-thin"><ellipse cx="25" cy="44" rx="5" ry="10" transform="rotate(-45 25 44)"/><ellipse cx="25" cy="44" rx="2.4" ry="10" transform="rotate(-45 25 44)"/><path d="M33 52 18 37"/></g>
    <path class="il-light" d="M106 66q6 0 8-4"/>
    <rect class="il-grey il-ink il-thin" x="108" y="55" width="10" height="7" rx="1.5" transform="rotate(-20 113 58)"/><path class="il-yellow il-ink il-thin" d="M117 54l3-1 2 6-3 1z"/>
    <path class="il-light il-thin" d="M98 84h6M104 90l3 3M126 100l4 4" opacity="0.6"/>
    <path class="il-line" d="M70 94l-2 4M90 94l2 4"/>`,
};
