/* Creepy Crawlies illustrations: loot. */
export const BG_LOOT: Readonly<Record<string, string>> = {
  // A torn leaf shield gets darned by a proud spider in a thimble hat: neat silk zigzag stitches glitter with
  // dew, and a little ant heaves at the stem with all six legs - it holds.
  'bg.spider-silk-patch': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100q40-8 80-2t80-4v26H0z"/>
    <path class="il-grass il-ink il-thin" d="M120 100l2-6 2 6 2-8 2 8M146 98l2-6 2 6 2-8 2 8M92 102l2-6 2 6 2-8 2 8"/>
    <circle class="il-white" cx="22" cy="16" r="1.2" opacity="0.5"/>
    <circle class="il-white" cx="140" cy="12" r="1" opacity="0.5"/>
    <path class="il-light il-thin" d="M98 0V31" opacity="0.8"/>
    <path class="il-green il-ink" d="M20 88C16 54 50 28 98 22c16-2 30 1 42 6-4 30-28 58-66 66-22 5-42 3-54-6z"/>
    <path class="il-light il-thin" d="M30 60q10-18 30-26" opacity="0.45"/>
    <path class="il-line il-thin" d="M22 86C54 66 98 42 138 29M46 74l-6-20M98 44l-2-18M118 36l-2-12M58 68l14 14M104 42l16 16M122 34l12 8" opacity="0.7"/>
    <path class="il-sky il-ink il-thin" d="M66 93l6-9-6-7 8-7-5-7 7-6 4 1-6 6 5 7-7 7 6 7-6 8z"/>
    <path class="il-light il-thin" d="M63 90l16-3-14-4 16-3-14-4 16-3-14-4 14-3"/>
    <circle class="il-water il-ink il-thin" cx="79" cy="79" r="1.8"/>
    <circle class="il-water il-ink il-thin" cx="64" cy="72" r="1.6"/>
    <circle class="il-water il-ink il-thin" cx="80" cy="63" r="1.5"/>
    <path class="il-white il-ink il-thin" d="M84 70l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-white il-ink il-thin" d="M60 80.6l1.02 2.38 2.38 1.02-2.38 1.02-1.02 2.38-1.02-2.38-2.38-1.02 2.38-1.02z"/>
    <path class="il-line" d="M92 44q-7-9-14-6M91 48q-10-2-14 4M93 52q-6 5-7 11M96 54q-1 7-4 11M104 44q7-9 14-6M105 48q10-2 14 4M103 52q6 5 7 11M100 54q1 7 4 11"/>
    <circle class="il-dark il-ink" cx="111" cy="31" r="8.5"/>
    <circle class="il-white" cx="109" cy="28" r="1.2" opacity="0.7"/>
    <circle class="il-white" cx="113.6" cy="31" r="1.2" opacity="0.7"/>
    <circle class="il-white" cx="110" cy="34.4" r="1.2" opacity="0.7"/>
    <circle class="il-dark il-ink" cx="98" cy="47" r="7"/>
    <circle class="il-white il-ink il-thin" cx="95.3" cy="46.5" r="2.6"/>
    <circle class="il-dark" cx="94.7" cy="47.1" r="1.17"/>
    <circle class="il-white il-ink il-thin" cx="100.7" cy="46.5" r="2.6"/>
    <circle class="il-dark" cx="100.1" cy="47.1" r="1.17"/>
    <circle class="il-white" cx="93.5" cy="43" r="0.8"/>
    <circle class="il-white" cx="102.5" cy="43" r="0.8"/>
    <path class="il-light il-thin" d="M95.5 51q2.5 2 5 0"/>
    <path class="il-metal il-ink il-thin" d="M92 41l1-7c0.5-3 9.5-3 10 0l1 7z"/>
    <circle class="il-dark" cx="95.5" cy="37" r="0.6"/>
    <circle class="il-dark" cx="98" cy="36" r="0.6"/>
    <circle class="il-dark" cx="100.5" cy="37" r="0.6"/>
    <circle class="il-dark" cx="97" cy="39.5" r="0.6"/>
    <circle class="il-dark" cx="99.5" cy="39.5" r="0.6"/>
    <path class="il-metal il-ink il-thin" d="M77 64l9-12 1.2 1-9 12z"/>
    <path class="il-light il-thin" d="M86.5 52.5q-6-2-8 10" opacity="0.8"/>
    <path class="il-line il-thick" d="M18 88l-6 8"/>
    <path class="il-line il-thin" d="M12 96q8 6 18 8"/>
    <g transform="translate(40 104) rotate(-8)">
    <path class="il-line il-thin" d="M-2 2l-7 9M0 3l-1 10M2 2l7 9"/>
    <ellipse class="il-red il-ink" cx="-10" cy="-1" rx="8" ry="6"/>
    <path class="il-light il-thin" d="M-14 -4q3-2 6-2" opacity="0.6"/>
    <ellipse class="il-red il-ink" cx="0" cy="0" rx="4.5" ry="3.5"/>
    <circle class="il-red il-ink" cx="9" cy="-3" r="5.5"/>
    <path class="il-line il-thin" d="M11 -8q2-6 7-6M8 -8q0-6 4-8"/>
    <circle class="il-white il-ink il-thin" cx="11" cy="-4" r="2.3"/>
    <circle class="il-dark" cx="11.8" cy="-4" r="1.03"/>
    <path class="il-line il-thin" d="M9.5 0.5h5"/>
    <path class="il-line il-thin" d="M8 -9l5 2"/>
    </g>
    <path class="il-water il-ink il-thin" d="M56 88q-2 3 0 4.5 2-1.5 0-4.5z"/>
    <path class="il-line il-thin" d="M60 98l4-1M60 102h5" opacity="0.8"/>`,

  // At sunrise a snail shell is buffed to a mirror shine: a smiling dewdrop drips from a grass blade onto it,
  // the snail glows with pride and the ladybird polishing it needs sunglasses against the glare.
  'bg.dew-polish': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow il-ink" cx="132" cy="90" r="20"/>
    <path class="il-line il-thin" d="M132 62v-8M112 70l-6-6M152 70l6-6M104 88h-8M160 88h-4" opacity="0.8"/>
    <path class="il-grass" d="M0 88q40-10 80-4t80 0v36H0z"/>
    <path class="il-green" d="M0 104h160v16H0z" opacity="0.6"/>
    <path class="il-grass il-ink il-thin" d="M6 104l2-6 2 6 2-8 2 8M148 104l2-6 2 6 2-8 2 8M100 106l2-6 2 6 2-8 2 8"/>
    <path class="il-green il-ink" d="M14 110c2-34 16-56 42-66-18 16-28 38-30 66z"/>
    <path class="il-water il-ink il-thin" d="M54 46c-4 5-6 9-3 12 3 2.6 8 0.6 7-4-0.6-3-2-5-4-8z"/>
    <circle class="il-dark" cx="53.3" cy="52.5" r="0.8"/>
    <circle class="il-dark" cx="56.6" cy="52.5" r="0.8"/>
    <path class="il-line il-thin" d="M53.5 55q1.5 1 3 0"/>
    <path class="il-light il-thin" d="M52.5 49.5l1-1.6" opacity="0.9"/>
    <path class="il-water il-ink il-thin" d="M58 62q-2 3 0 4.4 2-1.4 0-4.4z"/>
    <path class="il-skin il-ink" d="M50 100h66c8 0 12-4 14-12l3-16c1-6-8-8-10-2l-4 14c-2 6-6 8-12 8H58c-8 0-12 4-8 8z"/>
    <path class="il-line il-thin" d="M60 99h50" opacity="0.4"/>
    <path class="il-line il-thick" d="M124 68l-4-11M129 69l4-11"/>
    <circle class="il-white il-ink il-thin" cx="119.6" cy="55" r="3.6"/>
    <circle class="il-dark" cx="120.2" cy="54.2" r="1.62"/>
    <circle class="il-white il-ink il-thin" cx="133.4" cy="55" r="3.6"/>
    <circle class="il-dark" cx="132.6" cy="54.2" r="1.62"/>
    <path class="il-line il-thin" d="M122 79q4 4 7 0"/>
    <ellipse class="il-pink" cx="131" cy="79" rx="2.6" ry="1.6" opacity="0.8"/>
    <circle class="il-orange il-ink" cx="82" cy="70" r="25"/>
    <path class="il-line" d="M84 72a3.5 3.5 0 1 0-5 2.6 9 9 0 1 0 13-7.6 15.5 15.5 0 1 0-22 18.2"/>
    <path class="il-light il-thick" d="M64 60q5-11 18-14" opacity="0.9"/>
    <path class="il-light il-thick" d="M68 79l9-15M75 83l6-10" opacity="0.7"/>
    <path class="il-white il-ink il-thin" d="M70 41l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-white il-ink il-thin" d="M104 46l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/>
    <path class="il-white il-ink il-thin" d="M100 84.4l1.08 2.52 2.52 1.08-2.52 1.08-1.08 2.52-1.08-2.52-2.52-1.08 2.52-1.08z"/>
    <path class="il-line il-thin" d="M36 92l-5 8M42 94l1 8M38 84l-7 0"/>
    <ellipse class="il-red il-ink" cx="38" cy="84" rx="10" ry="11"/>
    <path class="il-line il-thin" d="M38 73v22"/>
    <circle class="il-dark" cx="33" cy="80" r="2.2"/>
    <circle class="il-dark" cx="43" cy="82" r="2.2"/>
    <circle class="il-dark" cx="34" cy="90" r="1.8"/>
    <circle class="il-dark" cx="42" cy="91" r="1.6"/>
    <circle class="il-dark il-ink" cx="39" cy="68" r="7"/>
    <path class="il-line il-thin" d="M37 61.5q-2-5-5-5M41 61.5q2-5 5-5"/>
    <rect class="il-teal il-ink il-thin" x="33" y="65" width="5.4" height="4" rx="1.5"/>
    <rect class="il-teal il-ink il-thin" x="40" y="65" width="5.4" height="4" rx="1.5"/>
    <path class="il-line il-thin" d="M38.4 66.5h1.6"/>
    <path class="il-light il-thin" d="M34.5 66.2l1.5-0.6M41.5 66.2l1.5-0.6"/>
    <path class="il-light il-thin" d="M37 72q2 1.4 4 0"/>
    <path class="il-line il-thin" d="M45 78l7-4"/>
    <path class="il-green il-ink il-thin" d="M50 70c4-4 10-2 10 4 0 5-6 7-9 4-2-2-3-5-1-8z"/>
    <path class="il-line il-thin" d="M46 58q-4-4-2-9M50 56q0-5 4-7" opacity="0.8"/>`,

  // An acorn-cap helmet now has a porthole with a bumblebee inside buzzing non-stop, even at night; next to it
  // a hedgehog in a nightcap clamps its paws over its ears, wide awake with baggy eyes.
  'bg.built-in-buzzer': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-paper il-ink il-thin" cx="140" cy="18" r="9"/>
    <circle class="il-night" cx="144.5" cy="15" r="8"/>
    <path class="il-white" d="M20 11.4l0.78 1.82 1.82 0.78-1.82 0.78-0.78 1.82-0.78-1.82-1.82-0.78 1.82-0.78z"/>
    <path class="il-white" d="M108 7.8l0.66 1.54 1.54 0.66-1.54 0.66-0.66 1.54-0.66-1.54-1.54-0.66 1.54-0.66z"/>
    <path class="il-white" d="M72 16l0.6 1.4 1.4 0.6-1.4 0.6-0.6 1.4-0.6-1.4-1.4-0.6 1.4-0.6z"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-grass il-ink il-thin" d="M8 100l2-6 2 6 2-8 2 8M148 100l2-6 2 6 2-8 2 8"/>
    <ellipse class="il-stone il-ink" cx="62" cy="101" rx="36" ry="8"/>
    <path class="il-green" d="M34 98q14-5 28 0" opacity="0.7"/>
    <path class="il-wood il-ink" d="M28 94c0-32 14-48 34-48s34 16 34 48z"/>
    <path class="il-line il-thin" d="M79 72q2 3 4 0M40 78q2 3 4 0M82 78q2 3 4 0M37 84q2 3 4 0M44 84q2 3 4 0M72 84q2 3 4 0M79 84q2 3 4 0" opacity="0.55"/>
    <path class="il-wood-dark il-ink" d="M60 46l-1-8h6l-1 8z"/>
    <rect class="il-wood-dark il-ink" x="24" y="90" width="76" height="8" rx="3"/>
    <path class="il-line il-thin" d="M30 94h64" opacity="0.4"/>
    <circle class="il-metal il-ink" cx="62" cy="70" r="15"/>
    <circle class="il-water il-ink il-thin" cx="62" cy="70" r="11"/>
    <circle class="il-dark" cx="50" cy="70" r="1.1"/>
    <circle class="il-dark" cx="74" cy="70" r="1.1"/>
    <circle class="il-dark" cx="62" cy="58" r="1.1"/>
    <circle class="il-dark" cx="62" cy="82" r="1.1"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="64" rx="3" ry="5" transform="rotate(-30 54 64)" opacity="0.9"/>
    <ellipse class="il-white il-ink il-thin" cx="70" cy="64" rx="3" ry="5" transform="rotate(30 70 64)" opacity="0.9"/>
    <circle class="il-gold il-ink il-thin" cx="62" cy="71" r="8"/>
    <path class="il-line il-thin" d="M59.6 63.4q-2-3-5-3.4M64.4 63.4q2-3 5-3.4"/>
    <circle class="il-white il-ink il-thin" cx="58.8" cy="69.4" r="2.5"/>
    <circle class="il-dark" cx="58.8" cy="69.7" r="1.13"/>
    <circle class="il-white il-ink il-thin" cx="65.2" cy="69.4" r="2.5"/>
    <circle class="il-dark" cx="65.2" cy="69.7" r="1.13"/>
    <ellipse class="il-dark" cx="62" cy="75.4" rx="2.4" ry="1.8"/>
    <path class="il-light il-thin" d="M53 64l4-3.4" opacity="0.8"/>
    <path class="il-yellow il-ink il-thin" d="M24 60l-8-3 6-4-8-3 6-4-8-3M100 56l8-3-6-4 8-3-6-4 8-3M24 80l-10 1 7 4-10 1M100 78l10-2-7-4 10-1"/>
    <path class="il-line il-thin" d="M40 36l-4-6M84 36l4-6" opacity="0.8"/>
    <path class="il-wood-dark il-ink" d="M150 82L155.3 87.26L147.94 89.67L149.96 96.59L142.23 95.58L140.51 102.57L134.17 98.38L129.11 103.84L125.62 97.43L118.37 100.11L118.53 92.94L110.75 92.22L114.52 85.95L108 82L114.52 78.05L110.75 71.78L118.53 71.06L118.37 63.89L125.62 66.57L129.11 60.16L134.17 65.62L140.51 61.43L142.23 68.42L149.96 67.41L147.94 74.33L155.3 76.74L150 82z"/>
    <ellipse class="il-skin il-ink" cx="132" cy="86" rx="14" ry="15"/>
    <ellipse class="il-wood il-ink" cx="112" cy="84" rx="4.5" ry="6" transform="rotate(-20 112 84)"/>
    <ellipse class="il-wood il-ink" cx="152" cy="84" rx="4.5" ry="6" transform="rotate(20 152 84)"/>
    <circle class="il-white il-ink il-thin" cx="126.5" cy="82" r="4.6"/>
    <circle class="il-dark" cx="126.5" cy="82" r="1.01"/>
    <circle class="il-white il-ink il-thin" cx="137.5" cy="82" r="4.6"/>
    <circle class="il-dark" cx="137.5" cy="82" r="1.01"/>
    <path class="il-line il-thin" d="M122 88.6q4.5 2 9 0M133 88.6q4.5 2 9 0"/>
    <ellipse class="il-dark" cx="132" cy="91.5" rx="2.6" ry="2"/>
    <path class="il-line il-thin" d="M128 96q4-2 8 0"/>
    <path class="il-blue il-ink" d="M117 70c2-14 28-16 32-2-8-4-24-4-32 2z"/>
    <path class="il-blue il-ink il-thin" d="M147 66q8 2 10 10"/>
    <circle class="il-white il-ink il-thin" cx="156" cy="78" r="3"/>
    <ellipse class="il-wood il-ink" cx="122" cy="104" rx="5" ry="2.6"/>
    <ellipse class="il-wood il-ink" cx="142" cy="104" rx="5" ry="2.6"/>`,

  // Earth cross-section: deep down in the oldest layer an ant in a hard hat triumphantly holds up a stone axe;
  // beside it a fossil dinosaur skull still wears a sticking plaster on its snout - poked before.
  'bg.prehistoric-find': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-grass" x="0" y="8" width="160" height="8"/>
    <path class="il-grass il-ink il-thin" d="M10 9l2-6 2 6 2-8 2 8M60 9l2-6 2 6 2-8 2 8M140 9l2-6 2 6 2-8 2 8"/>
    <ellipse class="il-white il-ink il-thin" cx="30" cy="1.2" rx="1.68" ry="2.8" transform="rotate(0 30 4)"/>
    <ellipse class="il-white il-ink il-thin" cx="30" cy="1.2" rx="1.68" ry="2.8" transform="rotate(72 30 4)"/>
    <ellipse class="il-white il-ink il-thin" cx="30" cy="1.2" rx="1.68" ry="2.8" transform="rotate(144 30 4)"/>
    <ellipse class="il-white il-ink il-thin" cx="30" cy="1.2" rx="1.68" ry="2.8" transform="rotate(216 30 4)"/>
    <ellipse class="il-white il-ink il-thin" cx="30" cy="1.2" rx="1.68" ry="2.8" transform="rotate(288 30 4)"/>
    <circle class="il-yellow il-ink il-thin" cx="30" cy="4" r="1.68"/>
    <rect class="il-earth" x="0" y="16" width="160" height="30"/>
    <rect class="il-earth-dark" x="0" y="46" width="160" height="34"/>
    <rect class="il-cave" x="0" y="80" width="160" height="40"/>
    <path class="il-line il-thin" d="M0 46q40 4 80 0t80 0M0 80q40-4 80 0t80 0" opacity="0.5"/>
    <path class="il-line il-thin" d="M40 16q-2 8 2 14M90 16q2 6-2 12M120 16q-3 6 1 10" opacity="0.5"/>
    <ellipse class="il-stone il-ink il-thin" cx="16" cy="30" rx="4" ry="3"/>
    <ellipse class="il-stone il-ink il-thin" cx="70" cy="36" rx="3" ry="2.2"/>
    <ellipse class="il-stone il-ink il-thin" cx="146" cy="56" rx="3.4" ry="2.4"/>
    <ellipse class="il-stone il-ink il-thin" cx="64" cy="62" rx="2.6" ry="2"/>
    <ellipse class="il-stone il-ink il-thin" cx="150" cy="108" rx="4" ry="3"/>
    <path class="il-light il-thin il-dash" d="M8 20v58" opacity="0.8"/>
    <path class="il-light il-thin" d="M4 74l4 5 4-5M4 24l4-5 4 5" opacity="0.8"/>
    <path class="il-dark" d="M126 16h10c2 12-8 20-4 34 4 14 6 20-6 30l-10 8-6-8 8-6c8-8 4-14 0-26-4-14 6-20 8-32z" opacity="0.85"/>
    <path class="il-dark" d="M20 120c0-20 10-34 30-36 14-2 24 6 40 4 14-2 22 8 22 32z" opacity="0.55"/>
    <circle class="il-stone il-ink" cx="140" cy="102" r="9"/>
    <path class="il-line il-thin" d="M141 103a1.6 1.6 0 1 0-2.4 1.2 4.6 4.6 0 1 0 7-3.6 7.6 7.6 0 1 0-11.5 8.4"/>
    <path class="il-stone il-ink" d="M150 60c-2-10-12-16-24-14l-22 4c-8 2-12 6-12 12 0 4 4 6 8 6h6l2 4 3-4 3 4 3-4 3 4 3-4h12c10 0 17-4 15-12z"/>
    <ellipse class="il-dark il-ink il-thin" cx="134" cy="55" rx="5" ry="4"/>
    <circle class="il-dark" cx="104" cy="57" r="1.4"/>
    <path class="il-line il-thin" d="M118 62l26-2" opacity="0.6"/>
    <g transform="rotate(-20 104 52)">
    <rect class="il-paper il-ink il-thin" x="98" y="49.5" width="12" height="5" rx="1"/>
    </g>
    <g transform="rotate(30 104 52)">
    <rect class="il-paper il-ink il-thin" x="98" y="49.5" width="12" height="5" rx="1"/>
    </g>
    <path class="il-torch" d="M74 72l48-24 8 22z" opacity="0.5"/>
    <g transform="translate(64 92) scale(1.6)">
    <path class="il-line il-thin" d="M-4 0l-6-9M4 0l6-3M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-1.9" cy="-7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.7" cy="-7" r="0.9"/>
    <path class="il-white il-ink il-thin" d="M-2.6 -3.4q2.6 3.6 5.2 0z"/>
    <path class="il-yellow il-ink il-thin" d="M-6.5 -9c0-6 13-6 13 0z"/>
    <rect class="il-yellow il-ink il-thin" x="-7.5" y="-10" width="15" height="2" rx="1"/>
    <circle class="il-glow il-ink il-thin" cx="5.5" cy="-12" r="2"/>
    </g>
    <path class="il-wood il-ink il-thin" d="M48.6 79l-8-26 2.8-0.8 8 26z"/>
    <path class="il-grey il-ink" d="M33 50c-2-5 2-11 8-11 5 2 7 7 5 11-2 5-11 5-13 0z"/>
    <path class="il-line il-thin" d="M37 55l7-2.4M37 58.4l8-2.6"/>
    <path class="il-light il-thin" d="M37 43.6l3-1" opacity="0.7"/>
    <path class="il-yellow il-ink il-thin" d="M26 33.6l1.32 3.08 3.08 1.32-3.08 1.32-1.32 3.08-1.32-3.08-3.08-1.32 3.08-1.32z"/>
    <path class="il-yellow il-ink il-thin" d="M54 32.4l1.08 2.52 2.52 1.08-2.52 1.08-1.08 2.52-1.08-2.52-2.52-1.08 2.52-1.08z"/>
    <path class="il-yellow il-ink il-thin" d="M24 57.2l0.84 1.96 1.96 0.84-1.96 0.84-0.84 1.96-0.84-1.96-1.96-0.84 1.96-0.84z"/>`,

  // Ten red ants stand on each other's heads in a neat pyramid; the top one launches off and dives with arms
  // out onto the monster's head from above, while the monster stares up open-mouthed.
  'bg.ant-pyramid': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <ellipse class="il-smoke" cx="128" cy="16" rx="16" ry="6" opacity="0.35"/>
    <ellipse class="il-smoke" cx="40" cy="12" rx="12" ry="5" opacity="0.35"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-grass il-ink il-thin" d="M94 106l2-6 2 6 2-8 2 8M150 106l2-6 2 6 2-8 2 8M4 106l2-6 2 6 2-8 2 8"/>
    <g transform="translate(16 94) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(32 94) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(48 94) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(64 94) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(24 74) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(40 74) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(56 74) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(32 54) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(48 54) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6-5M4 0l6-5M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.7" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.7" r="0.9"/>
    <path class="il-line il-thin" d="M-2 -3q2 1.6 4 0"/>
    </g>
    <g transform="translate(40 34) scale(0.9)">
    <path class="il-line il-thin" d="M-4 0l-6 2M4 0l7-8M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-1.7" cy="-7.2" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.9" cy="-7.2" r="0.9"/>
    <path class="il-white il-ink il-thin" d="M-2.6 -3.4q2.6 3.6 5.2 0z"/>
    </g>
    <path class="il-light il-thin il-dash" d="M50 22q20-22 50-10" opacity="0.8"/>
    <path class="il-line il-thin" d="M90 20l-8-4M88 28l-9-1M94 14l-6-6"/>
    <g transform="translate(104 30) rotate(140) scale(1.05)">
    <path class="il-line il-thin" d="M-4 0l-6 8M4 0l6 8M-4 4l-7 3M4 4l7 3M-3 9l-3 6M3 9l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="5" rx="5" ry="7"/>
    <path class="il-light il-thin" d="M-2 1q-1 3 0 6" opacity="0.5"/>
    <circle class="il-red il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-5-6-5M2 -11q2-5 6-5"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.4" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.4" r="0.9"/>
    <path class="il-line il-thin" d="M-4.5 -10.5l3 1.4M4.5 -10.5l-3 1.4"/>
    <path class="il-white il-ink il-thin" d="M-2.6 -3.4q2.6 3.6 5.2 0z"/>
    </g>
    <g transform="translate(126 84) scale(1.1)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="-7" cy="-9" r="2.48"/>
    <circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="7" cy="-9" r="2.48"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="8" rx="4" ry="5"/>
    <path class="il-line il-thin" d="M-12 -14l5 2M12 -14l-5 2"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="6" rx="5" ry="7" transform="rotate(20 -21 6)"/>
    <ellipse class="il-purple il-ink" cx="21" cy="6" rx="5" ry="7" transform="rotate(-20 21 6)"/>
    </g>
    <path class="il-line il-thin" d="M150 52l4-6M154 58l5-2" opacity="0.8"/>`,

  // A huge sunflower whistles innocently while its yellow pollen cloud drifts over; the monster lets rip an
  // enormous sneeze, red-nosed and teary, and the recoil has jammed it into the corner of the garden wall.
  'bg.pollen-cloud': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone il-ink" x="134" y="-2" width="30" height="106"/>
    <path class="il-line il-thin" d="M134 12h28M134 28h28M134 44h28M134 60h28M134 76h28M134 92h28M146 -2v14M152 12v16M146 28v16M152 44v16M146 60v16M152 76v16" opacity="0.6"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M0 100h160" opacity="0.4"/>
    <path class="il-grass il-ink il-thin" d="M12 100l2-6 2 6 2-8 2 8M56 101l2-6 2 6 2-8 2 8"/>
    <path class="il-green il-ink" d="M27 110c-2-20 2-40 0-56h6c2 16-2 36 0 56z"/>
    <path class="il-green il-ink il-thin" d="M30 84c-10-8-20-6-24 0 8 4 16 4 24 0zM31 72c8-8 18-8 22-2-6 4-14 5-22 2z"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(0 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(30 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(60 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(90 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(120 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(150 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(180 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(210 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(240 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(270 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(300 30 40)"/>
    <ellipse class="il-yellow il-ink il-thin" cx="30" cy="28" rx="4" ry="9" transform="rotate(330 30 40)"/>
    <circle class="il-wood-dark il-ink" cx="30" cy="40" r="11"/>
    <circle class="il-dark" cx="26" cy="36" r="0.8" opacity="0.5"/>
    <circle class="il-dark" cx="34" cy="45" r="0.8" opacity="0.5"/>
    <circle class="il-dark" cx="25" cy="45" r="0.8" opacity="0.5"/>
    <circle class="il-white il-ink il-thin" cx="26" cy="38" r="2.6"/>
    <circle class="il-dark" cx="27.2" cy="37.6" r="1.17"/>
    <circle class="il-white il-ink il-thin" cx="34" cy="38" r="2.6"/>
    <circle class="il-dark" cx="35.2" cy="37.6" r="1.17"/>
    <circle class="il-dark il-ink il-thin" cx="33" cy="45" r="1.6"/>
    <g transform="translate(46 22) scale(0.8)">
    <ellipse class="il-white il-ink il-thin" cx="0" cy="0" rx="3.4" ry="2.6" transform="rotate(-20 0 0)"/>
    <path class="il-line" d="M3 -1v-11q3 2 6 5"/>
    </g>
    <circle class="il-yellow" cx="66" cy="52" r="18" opacity="0.35"/>
    <circle class="il-yellow" cx="84" cy="58" r="14" opacity="0.3"/>
    <circle class="il-yellow" cx="56" cy="40" r="10" opacity="0.3"/>
    <circle class="il-yellow il-ink il-thin" cx="52" cy="50" r="2"/>
    <circle class="il-yellow il-ink il-thin" cx="60" cy="42" r="1.6"/>
    <circle class="il-yellow il-ink il-thin" cx="66" cy="56" r="2.2"/>
    <circle class="il-yellow il-ink il-thin" cx="74" cy="46" r="1.6"/>
    <circle class="il-yellow il-ink il-thin" cx="80" cy="60" r="2"/>
    <circle class="il-yellow il-ink il-thin" cx="70" cy="66" r="1.4"/>
    <circle class="il-yellow il-ink il-thin" cx="86" cy="50" r="1.8"/>
    <circle class="il-yellow il-ink il-thin" cx="58" cy="60" r="1.4"/>
    <circle class="il-yellow il-ink il-thin" cx="62" cy="34" r="1.4"/>
    <circle class="il-yellow il-ink il-thin" cx="78" cy="38" r="1.2"/>
    <circle class="il-yellow il-ink il-thin" cx="90" cy="64" r="1.4"/>
    <circle class="il-yellow il-ink il-thin" cx="48" cy="40" r="1.4"/>
    <path class="il-light il-thin" d="M92 72l-8-3M92 78l-9 1M93 84l-7 5" opacity="0.9"/>
    <circle class="il-water il-ink il-thin" cx="84" cy="74" r="1.4"/>
    <circle class="il-water il-ink il-thin" cx="86" cy="84" r="1.2"/>
    <g transform="translate(114 76) scale(0.92 1.05)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <path class="il-line" d="M-11 -9l5 3-5 3M11 -9l-5 3 5 3"/>
    <ellipse class="il-dark il-ink il-thin" cx="-1" cy="9" rx="7" ry="6"/>
    <ellipse class="il-pink" cx="-1" cy="12" rx="4" ry="2"/>
    <circle class="il-red il-ink il-thin" cx="0" cy="0" r="3.6"/>
    <path class="il-water il-ink il-thin" d="M-13 -2q-2 3 0 4.4 2-1.4 0-4.4z"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="2" rx="5" ry="7" transform="rotate(50 -21 2)"/>
    <ellipse class="il-purple il-ink" cx="21" cy="2" rx="5" ry="7" transform="rotate(-50 21 2)"/>
    </g>
    <path class="il-line il-thick" d="M118 46l4-4M124 48l6-2" opacity="0.8"/>
    <path class="il-yellow il-ink il-thin" d="M132 56l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M130 93l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>`,

  // Alarm at the straw beehive: a bee in a nightcap clangs a bell on its roof, cross bees with frowning brows
  // pour out of the entrance and the monster runs off with its arms up.
  'bg.hive-alarm': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-grass il-ink il-thin" d="M120 104l2-6 2 6 2-8 2 8M150 104l2-6 2 6 2-8 2 8M94 104l2-6 2 6 2-8 2 8"/>
    <rect class="il-wood-dark il-ink" x="22" y="88" width="56" height="6" rx="1.5"/>
    <path class="il-wood-dark il-ink" d="M28 94h6v14h-6zM66 94h6v14h-6z"/>
    <path class="il-gold il-ink" d="M24 88c0-34 12-52 26-52s26 18 26 52z"/>
    <path class="il-line il-thin" d="M25 80q25 4 50 0M27 70q23 4 46 0M31 60q19 4 38 0M37 50q13 3 26 0M44 41q6 2 12 0" opacity="0.75"/>
    <path class="il-dark il-ink il-thin" d="M42 88a8 6 0 0 1 16 0z"/>
    <g transform="translate(50 26) scale(0.95)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 3M6 2l7-8M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-6.6" r="2"/>
    <circle class="il-dark" cx="-2.3" cy="-6.6" r="0.6"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-6.6" r="2"/>
    <circle class="il-dark" cx="2.3" cy="-6.6" r="0.6"/>
    <ellipse class="il-dark" cx="0" cy="-2.4" rx="1.6" ry="1.4"/>
    <path class="il-blue il-ink il-thin" d="M-5 -10c0-6 10-7 10 0l7 -4z"/>
    <circle class="il-white il-ink il-thin" cx="12.5" cy="-14.5" r="1.8"/>
    </g>
    <path class="il-gold il-ink il-thin" d="M60 6c-5 0-6 4-6 8l-2 3h16l-2-3c0-4-1-8-6-8z"/>
    <circle class="il-dark" cx="60" cy="18.4" r="1.4"/>
    <path class="il-line il-thin" d="M60 6V3M60 3l-3-1"/>
    <path class="il-line il-thin" d="M70 6l4-3M71 12h5M48 6l-4-3" opacity="0.9"/>
    <g transform="translate(68 80) scale(0.85)">
    <ellipse class="il-white il-ink il-thin" cx="-4" cy="-9" rx="4.5" ry="7.5" transform="rotate(-25 -4 -9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="1" cy="-8" rx="4" ry="6.5" transform="rotate(15 1 -8)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-7 5l-2 4M-3 6v4M1 5l2 4"/>
    <path class="il-dark il-ink il-thin" d="M-13.5 -1l-4 1.5 4 1.5z"/>
    <ellipse class="il-yellow il-ink" cx="-4" cy="0" rx="10" ry="7"/>
    <path class="il-line il-thick" d="M-8 -4.2v8.4M-2 -4.8v9.6"/>
    <circle class="il-gold il-ink" cx="8" cy="-1" r="5.5"/>
    <path class="il-line il-thin" d="M10 -6q1-5 5-6"/>
    <circle class="il-dark" cx="15" cy="-12" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="2.2"/>
    <circle class="il-dark" cx="10.9" cy="-1.7" r="0.99"/>
    <path class="il-line il-thin" d="M7 -5.5l5 2M9 2.6q2-1.4 4 0"/>
    </g>
    <g transform="translate(86 66) scale(0.9)">
    <ellipse class="il-white il-ink il-thin" cx="-4" cy="-9" rx="4.5" ry="7.5" transform="rotate(-25 -4 -9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="1" cy="-8" rx="4" ry="6.5" transform="rotate(15 1 -8)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-7 5l-2 4M-3 6v4M1 5l2 4"/>
    <path class="il-dark il-ink il-thin" d="M-13.5 -1l-4 1.5 4 1.5z"/>
    <ellipse class="il-yellow il-ink" cx="-4" cy="0" rx="10" ry="7"/>
    <path class="il-line il-thick" d="M-8 -4.2v8.4M-2 -4.8v9.6"/>
    <circle class="il-gold il-ink" cx="8" cy="-1" r="5.5"/>
    <path class="il-line il-thin" d="M10 -6q1-5 5-6"/>
    <circle class="il-dark" cx="15" cy="-12" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="2.2"/>
    <circle class="il-dark" cx="10.9" cy="-1.7" r="0.99"/>
    <path class="il-line il-thin" d="M7 -5.5l5 2M9 2.6q2-1.4 4 0"/>
    </g>
    <g transform="translate(96 86) scale(0.8)">
    <ellipse class="il-white il-ink il-thin" cx="-4" cy="-9" rx="4.5" ry="7.5" transform="rotate(-25 -4 -9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="1" cy="-8" rx="4" ry="6.5" transform="rotate(15 1 -8)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-7 5l-2 4M-3 6v4M1 5l2 4"/>
    <path class="il-dark il-ink il-thin" d="M-13.5 -1l-4 1.5 4 1.5z"/>
    <ellipse class="il-yellow il-ink" cx="-4" cy="0" rx="10" ry="7"/>
    <path class="il-line il-thick" d="M-8 -4.2v8.4M-2 -4.8v9.6"/>
    <circle class="il-gold il-ink" cx="8" cy="-1" r="5.5"/>
    <path class="il-line il-thin" d="M10 -6q1-5 5-6"/>
    <circle class="il-dark" cx="15" cy="-12" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="2.2"/>
    <circle class="il-dark" cx="10.9" cy="-1.7" r="0.99"/>
    <path class="il-line il-thin" d="M7 -5.5l5 2M9 2.6q2-1.4 4 0"/>
    </g>
    <g transform="translate(80 46) scale(0.75)">
    <ellipse class="il-white il-ink il-thin" cx="-4" cy="-9" rx="4.5" ry="7.5" transform="rotate(-25 -4 -9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="1" cy="-8" rx="4" ry="6.5" transform="rotate(15 1 -8)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-7 5l-2 4M-3 6v4M1 5l2 4"/>
    <path class="il-dark il-ink il-thin" d="M-13.5 -1l-4 1.5 4 1.5z"/>
    <ellipse class="il-yellow il-ink" cx="-4" cy="0" rx="10" ry="7"/>
    <path class="il-line il-thick" d="M-8 -4.2v8.4M-2 -4.8v9.6"/>
    <circle class="il-gold il-ink" cx="8" cy="-1" r="5.5"/>
    <path class="il-line il-thin" d="M10 -6q1-5 5-6"/>
    <circle class="il-dark" cx="15" cy="-12" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="2.2"/>
    <circle class="il-dark" cx="10.9" cy="-1.7" r="0.99"/>
    <path class="il-line il-thin" d="M7 -5.5l5 2M9 2.6q2-1.4 4 0"/>
    </g>
    <g transform="translate(104 56) scale(0.85)">
    <ellipse class="il-white il-ink il-thin" cx="-4" cy="-9" rx="4.5" ry="7.5" transform="rotate(-25 -4 -9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="1" cy="-8" rx="4" ry="6.5" transform="rotate(15 1 -8)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-7 5l-2 4M-3 6v4M1 5l2 4"/>
    <path class="il-dark il-ink il-thin" d="M-13.5 -1l-4 1.5 4 1.5z"/>
    <ellipse class="il-yellow il-ink" cx="-4" cy="0" rx="10" ry="7"/>
    <path class="il-line il-thick" d="M-8 -4.2v8.4M-2 -4.8v9.6"/>
    <circle class="il-gold il-ink" cx="8" cy="-1" r="5.5"/>
    <path class="il-line il-thin" d="M10 -6q1-5 5-6"/>
    <circle class="il-dark" cx="15" cy="-12" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="2.2"/>
    <circle class="il-dark" cx="10.9" cy="-1.7" r="0.99"/>
    <path class="il-line il-thin" d="M7 -5.5l5 2M9 2.6q2-1.4 4 0"/>
    </g>
    <path class="il-line il-thin il-dash" d="M56 84q8-4 6-10M74 58q6-6 4-12" opacity="0.6"/>
    <g transform="translate(128 78) rotate(10) scale(0.95)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="22" rx="7" ry="4" transform="rotate(-25 -12 22)"/>
    <ellipse class="il-purple-dark il-ink" cx="11" cy="25" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="-9.6" cy="-6" r="2.48"/>
    <circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="4.4" cy="-6" r="2.48"/>
    <path class="il-line il-thin" d="M-11 -14l6-1M11 -14l-6-1"/>
    <ellipse class="il-dark il-ink il-thin" cx="-2" cy="8" rx="4" ry="4.5"/>
    <ellipse class="il-purple il-ink" cx="-20" cy="-10" rx="5" ry="8" transform="rotate(-30 -20 -10)"/>
    <ellipse class="il-purple il-ink" cx="20" cy="-10" rx="5" ry="8" transform="rotate(30 20 -10)"/>
    </g>
    <path class="il-water il-ink il-thin" d="M114 48q-2 3 0 4.4 2-1.4 0-4.4zM150 46q-2 3 0 4.4 2-1.4 0-4.4z"/>
    <path class="il-line il-thin" d="M156 66l4-2M156 80l4 0" opacity="0.8"/>`,

  // A bee choir on a leaf stage, conducted by a bee with a baton, sings one single giant note in perfect
  // unison; sound waves roll toward the monster, which clamps its paws over its ears with eyes squeezed shut.
  'bg.buzz-concert': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-glow" d="M30 0h20l26 96H4z" opacity="0.18"/>
    <path class="il-white" d="M110 9.6l0.72 1.68 1.68 0.72-1.68 0.72-0.72 1.68-0.72-1.68-1.68-0.72 1.68-0.72z"/>
    <path class="il-white" d="M150 24l0.6 1.4 1.4 0.6-1.4 0.6-0.6 1.4-0.6-1.4-1.4-0.6 1.4-0.6z"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-green il-ink" d="M2 100c10-8 50-10 70-4-4 8-60 12-70 4z"/>
    <path class="il-line il-thin" d="M6 100q30-4 62-4M24 98l-4 4M44 97l-4 4" opacity="0.6"/>
    <g transform="translate(12 66) scale(0.85)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 1M6 2l5 1M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="-2.3" cy="-7.4" r="0.76"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="2.3" cy="-7.4" r="0.76"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-2.4" rx="1.8" ry="2.2"/>
    </g>
    <g transform="translate(30 66) scale(0.85)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 1M6 2l5 1M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="-2.3" cy="-7.4" r="0.76"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="2.3" cy="-7.4" r="0.76"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-2.4" rx="1.8" ry="2.2"/>
    </g>
    <g transform="translate(48 66) scale(0.85)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 1M6 2l5 1M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="-2.3" cy="-7.4" r="0.76"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="2.3" cy="-7.4" r="0.76"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-2.4" rx="1.8" ry="2.2"/>
    </g>
    <g transform="translate(16 86) scale(0.95)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 1M6 2l5 1M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="-2.3" cy="-7.4" r="0.76"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="2.3" cy="-7.4" r="0.76"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-2.4" rx="1.8" ry="2.2"/>
    </g>
    <g transform="translate(34 86) scale(0.95)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 1M6 2l5 1M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="-2.3" cy="-7.4" r="0.76"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="2.3" cy="-7.4" r="0.76"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-2.4" rx="1.8" ry="2.2"/>
    </g>
    <g transform="translate(52 86) scale(0.95)">
    <ellipse class="il-white il-ink il-thin" cx="-7" cy="-4" rx="4.5" ry="7" transform="rotate(-35 -7 -4)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="7" cy="-4" rx="4.5" ry="7" transform="rotate(35 7 -4)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 2l-5 1M6 2l5 1M-4 11l-2 4M4 11l2 4"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7" ry="8"/>
    <path class="il-line il-thick" d="M-4.6 3.5h9.2M-4 8.5h8"/>
    <circle class="il-gold il-ink" cx="0" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-2 -11q-2-4-5-5M2 -11q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-16" r="1.2"/>
    <circle class="il-dark" cx="7" cy="-16" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="-2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="-2.3" cy="-7.4" r="0.76"/>
    <circle class="il-white il-ink il-thin" cx="2.3" cy="-7" r="1.9"/>
    <circle class="il-dark" cx="2.3" cy="-7.4" r="0.76"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-2.4" rx="1.8" ry="2.2"/>
    </g>
    <g transform="translate(80 82) scale(-1.05 1.05)">
    <ellipse class="il-white il-ink il-thin" cx="-4" cy="-9" rx="4.5" ry="7.5" transform="rotate(-25 -4 -9)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="1" cy="-8" rx="4" ry="6.5" transform="rotate(15 1 -8)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-7 5l-2 4M-3 6v4M1 5l2 4"/>
    <path class="il-dark il-ink il-thin" d="M-13.5 -1l-4 1.5 4 1.5z"/>
    <ellipse class="il-yellow il-ink" cx="-4" cy="0" rx="10" ry="7"/>
    <path class="il-line il-thick" d="M-8 -4.2v8.4M-2 -4.8v9.6"/>
    <circle class="il-gold il-ink" cx="8" cy="-1" r="5.5"/>
    <path class="il-line il-thin" d="M10 -6q1-5 5-6"/>
    <circle class="il-dark" cx="15" cy="-12" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="10" cy="-2" r="2.2"/>
    <circle class="il-dark" cx="10.8" cy="-2.3" r="0.99"/>
    <path class="il-line il-thin" d="M9 2.4q2 1.4 4 0"/>
    <path class="il-line il-thin" d="M4 2l6 -5"/>
    </g>
    <path class="il-white il-ink il-thin" d="M69.4 77l-6-12 1.4-0.6 6 12z"/>
    <path class="il-line il-thin" d="M58 62q2-4 6-4M70 58q3 0 4 3" opacity="0.7"/>
    <g transform="translate(48 18)">
    <ellipse class="il-yellow il-ink" cx="0" cy="26" rx="9" ry="7" transform="rotate(-20 0 26)"/>
    <path class="il-yellow il-ink" d="M6 24V-6h4v30z"/>
    <path class="il-yellow il-ink" d="M10 -6c6 4 14 6 14 16-2-4-8-6-14-7z"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M36 27l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-yellow il-ink il-thin" d="M80 10.6l1.02 2.38 2.38 1.02-2.38 1.02-1.02 2.38-1.02-2.38-2.38-1.02 2.38-1.02z"/>
    <path class="il-line il-thick" d="M96 58q5 8 0 16M104 50q9 16 0 32M112 44q12 22 0 44" opacity="0.8"/>
    <g transform="translate(135 76) scale(0.92)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <path class="il-line" d="M-11 -8l5 2-5 2M11 -8l-5 2 5 2"/>
    <path class="il-line" d="M-6 10l3-2 3 2 3-2 3 2"/>
    <path class="il-line il-thin" d="M-12 -15l5 2M12 -15l-5 2"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="-4" rx="6" ry="8"/>
    <ellipse class="il-purple il-ink" cx="21" cy="-4" rx="6" ry="8"/>
    </g>
    <path class="il-line il-thin" d="M116 66l-4-2 4-2-4-2M158 60l2-2" opacity="0.8"/>`,

  // A cheeky grinning acorn, dropped from the oak branch above, bonks the monster on the head with a star and
  // spinning stars; up on the branch the squirrel it was pinched from stares at its empty paws.
  'bg.flying-acorn': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood-dark il-ink" d="M-2 120V0h22c-2 30 2 70 6 120z"/>
    <path class="il-line il-thin" d="M8 10q-2 16 2 30M14 60q-2 14 2 26M6 90q2 10 0 20" opacity="0.6"/>
    <path class="il-wood-dark il-ink" d="M18 26c20-4 50-6 76-2l2 6c-26-2-54 0-78 4z"/>
    <ellipse class="il-green il-ink il-thin" cx="36" cy="20" rx="12" ry="7"/>
    <ellipse class="il-green il-ink il-thin" cx="90" cy="22" rx="11" ry="6"/>
    <ellipse class="il-grass il-ink il-thin" cx="22" cy="14" rx="12" ry="8"/>
    <ellipse class="il-grass il-ink il-thin" cx="76" cy="30" rx="8" ry="4"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-grass il-ink il-thin" d="M40 106l2-6 2 6 2-8 2 8M150 106l2-6 2 6 2-8 2 8"/>
    <path class="il-gold il-ink il-thin" d="M50 108c4-4 10-4 12 0-4 3-8 3-12 0zM140 110c3-4 9-4 11 0-4 3-7 3-11 0z"/>
    <path class="il-orange il-ink" d="M48 22c-12 0-16-12-10-18 6-6 16-2 14 8-1 4-6 4-6 0"/>
    <ellipse class="il-orange il-ink" cx="58" cy="18" rx="7" ry="8"/>
    <circle class="il-orange il-ink" cx="64" cy="8" r="6"/>
    <path class="il-orange il-ink il-thin" d="M60 3l1-5 3 4M66 3l2-5 2 5"/>
    <ellipse class="il-skin" cx="59" cy="20" rx="4" ry="5" opacity="0.8"/>
    <circle class="il-white il-ink il-thin" cx="63" cy="7" r="2.4"/>
    <circle class="il-dark" cx="63.6" cy="7.6" r="1.08"/>
    <circle class="il-white il-ink il-thin" cx="68" cy="7" r="2.2"/>
    <circle class="il-dark" cx="68.4" cy="7.6" r="0.99"/>
    <ellipse class="il-dark il-ink il-thin" cx="67" cy="12" rx="1.4" ry="1.8"/>
    <circle class="il-dark" cx="70.4" cy="9.6" r="0.8"/>
    <path class="il-orange il-ink il-thin" d="M60 22c4 2 8 2 10-2M62 24c3 2 6 1 8-2"/>
    <path class="il-line il-thin" d="M74 2l2-2M76 8h3" opacity="0.9"/>
    <path class="il-light il-thin il-dash" d="M72 28q30-2 44 14" opacity="0.8"/>
    <path class="il-line il-thin" d="M108 30l-3-6M116 28l-1-7M100 36l-6-3"/>
    <g transform="translate(120 42) rotate(20)">
    <ellipse class="il-wood il-ink" cx="0" cy="4" rx="7.5" ry="8.5"/>
    <path class="il-wood il-ink il-thin" d="M-1.6 12.2l1.6 2.4 1.6-2.4"/>
    <path class="il-wood-dark il-ink" d="M-9 1c-1-7 4-10 9-10s10 3 9 10z"/>
    <path class="il-line il-thin" d="M-6 -4l3 4M-1 -7l3 6M4 -6l3 5M-7 0l12-6" opacity="0.6"/>
    <path class="il-wood-dark il-ink il-thin" d="M-0.6 -9l0.4-4h1.8l-0.6 4z"/>
    <path class="il-light il-thin" d="M-4 4q0-4 2-6" opacity="0.6"/>
    <circle class="il-dark" cx="-2.6" cy="3.5" r="1"/>
    <circle class="il-dark" cx="2.6" cy="3.5" r="1"/>
    <path class="il-line il-thin" d="M-3 7q3 3 6 0"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M128 50l4-4 0 5 5-1-3 4 4 3-5 1 1 5-4-3-3 4-1-5z"/>
    <g transform="translate(122 84) scale(1.05)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <path class="il-line" d="M-10 -9l6 6M-4 -9l-6 6M4 -9l6 6M10 -9l-6 6"/>
    <path class="il-line" d="M-6 9q6-4 12 0"/>
    <circle class="il-purple il-ink il-thin" cx="6" cy="-21" r="4"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="6" rx="5" ry="7" transform="rotate(20 -21 6)"/>
    <ellipse class="il-purple il-ink" cx="21" cy="6" rx="5" ry="7" transform="rotate(-20 21 6)"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M100 54.6l1.02 2.38 2.38 1.02-2.38 1.02-1.02 2.38-1.02-2.38-2.38-1.02 2.38-1.02z"/>
    <path class="il-yellow il-ink il-thin" d="M146 59l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>`,

  // A proud worm in a flat cap lies curled on the flowerbed next to its pyramid of hand-rolled mud balls; one
  // has just gone splat right in the monster's face, which peers grumpily out of the mud, more blobs stuck all
  // over it.
  'bg.mud-ball': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <ellipse class="il-smoke" cx="110" cy="14" rx="14" ry="5" opacity="0.3"/>
    <path class="il-earth il-ink" d="M-2 96q82-16 164 0v26H-2z"/>
    <path class="il-earth-dark" d="M10 108q8-2 14 0M70 104q8-2 14 0M120 110q8-2 14 0M40 114q8-2 14 0" opacity="0.8"/>
    <path class="il-green il-ink il-thin" d="M138 92v-16h2v16zM152 92v-12h2v12z"/>
    <path class="il-red il-ink il-thin" d="M133 76c0-8 3-10 3-10l3 4 3-4 3 4c1-2 1 8-4 9-4 0-8 0-8-3z"/>
    <path class="il-yellow il-ink il-thin" d="M148 80c0-7 3-8 3-8l2 3 2-3 3 3c1 1 1 7-4 8-3 0-6 0-6-3z"/>
    <circle class="il-earth-dark il-ink" cx="58" cy="94" r="5.4"/>
    <circle class="il-earth" cx="56.11" cy="92.38" r="1.19"/>
    <circle class="il-earth" cx="59.62" cy="95.35" r="0.86"/>
    <circle class="il-earth-dark il-ink" cx="70" cy="94" r="5.4"/>
    <circle class="il-earth" cx="68.11" cy="92.38" r="1.19"/>
    <circle class="il-earth" cx="71.62" cy="95.35" r="0.86"/>
    <circle class="il-earth-dark il-ink" cx="64" cy="85" r="5.4"/>
    <circle class="il-earth" cx="62.11" cy="83.38" r="1.19"/>
    <circle class="il-earth" cx="65.62" cy="86.35" r="0.86"/>
    <circle class="il-pink il-ink" cx="10" cy="98" r="5"/>
    <circle class="il-pink il-ink" cx="12.94" cy="101.93" r="5.13"/>
    <circle class="il-pink il-ink" cx="17" cy="104.72" r="5.25"/>
    <circle class="il-pink il-ink" cx="21.81" cy="106.33" r="5.38"/>
    <circle class="il-pink il-ink" cx="27" cy="106.75" r="5.5"/>
    <circle class="il-pink il-ink" cx="32.19" cy="105.95" r="5.63"/>
    <circle class="il-pink il-ink" cx="37" cy="103.91" r="5.75"/>
    <circle class="il-pink il-ink" cx="41.06" cy="100.6" r="5.88"/>
    <circle class="il-pink il-ink" cx="44" cy="96" r="6"/>
    <path class="il-line il-thin" d="M16 104l3 3M26 108v4M34 106l-2 4" opacity="0.4"/>
    <circle class="il-pink il-ink" cx="46" cy="89" r="8"/>
    <circle class="il-white il-ink il-thin" cx="44" cy="87.5" r="2.6"/>
    <circle class="il-dark" cx="44.8" cy="87.5" r="1.17"/>
    <circle class="il-white il-ink il-thin" cx="50" cy="87.5" r="2.6"/>
    <circle class="il-dark" cx="50.8" cy="87.5" r="1.17"/>
    <path class="il-line il-thin" d="M44 92.5q3 3 6 0"/>
    <ellipse class="il-red" cx="41" cy="92" rx="1.6" ry="1" opacity="0.6"/>
    <path class="il-blue il-ink il-thin" d="M38 84c0-6 14-8 18-2l6 0c0 2-4 3-6 3z"/>
    <path class="il-light il-thin il-dash" d="M70 80q20-30 36-26" opacity="0.8"/>
    <path class="il-line il-thin" d="M96 46l-6-2M94 52l-7 1"/>
    <g transform="translate(124 74) scale(1.05)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="-8" cy="-5.4" r="2.48"/>
    <path class="il-line il-thin" d="M-12 -12l7 3"/>
    <path class="il-earth-dark il-ink il-thin" d="M-2 -16c4-4 12-2 14 2 4 0 8 4 6 8 2 4 0 10-4 10l-2 5-2-4c-4 2-8 0-10-4-4-1-6-6-4-10 0-4 0-6 2-7z"/>
    <circle class="il-earth" cx="6" cy="-6" r="1.6"/>
    <circle class="il-earth" cx="10" cy="0" r="1.2"/>
    <path class="il-line" d="M-8 10q4-3 8 0"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="6" rx="5" ry="7" transform="rotate(20 -21 6)"/>
    <ellipse class="il-purple il-ink" cx="21" cy="6" rx="5" ry="7" transform="rotate(-20 21 6)"/>
    </g>
    <path class="il-earth-dark il-ink il-thin" d="M110 92c2-3 6-2 6 1 2 1 2 4-1 4-2 2-5 1-5-1-2 0-2-3 0-4z"/>
    <path class="il-earth-dark il-ink il-thin" d="M140 74c2-3 5-2 6 1 2 1 1 4-1 4-1 2-4 2-5 0-2 0-2-3 0-5z"/>
    <path class="il-line il-thin" d="M104 44l-4-4M108 38l-1-6M114 40l3-5" opacity="0.9"/>
    <path class="il-earth-dark il-ink il-thin" d="M100 52a2 2 0 1 0 0.1 0zM110 34a1.6 1.6 0 1 0 0.1 0"/>`,

  // Under the moon three crickets chirp at full volume, music zigzags flying; the bewildered monster stands on
  // its head with spiral eyes, no longer knowing which way is up, and the arrow above it just spins.
  'bg.cricket-chorus': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-paper il-ink il-thin" cx="26" cy="18" r="10"/>
    <circle class="il-stone" cx="23" cy="15" r="2" opacity="0.5"/>
    <circle class="il-stone" cx="29" cy="21" r="1.4" opacity="0.5"/>
    <path class="il-white" d="M64 9.6l0.72 1.68 1.68 0.72-1.68 0.72-0.72 1.68-0.72-1.68-1.68-0.72 1.68-0.72z"/>
    <path class="il-white" d="M100 20l0.6 1.4 1.4 0.6-1.4 0.6-0.6 1.4-0.6-1.4-1.4-0.6 1.4-0.6z"/>
    <path class="il-white" d="M150 7.8l0.66 1.54 1.54 0.66-1.54 0.66-0.66 1.54-0.66-1.54-1.54-0.66 1.54-0.66z"/>
    <path class="il-grass" d="M0 94q40-6 80-2t80 0v28H0z"/>
    <g transform="translate(28 82) scale(1.5)">
    <path class="il-line il-thin" d="M4 3l-1 8M8 2l3 8M12 -6q2-10-6-14M10 -6q-1-8-8-11"/>
    <ellipse class="il-green il-ink" cx="-2" cy="0" rx="11" ry="5"/>
    <path class="il-teal il-ink il-thin" d="M-12 -1q8-6 16-3-6 5-16 3z"/>
    <ellipse class="il-green il-ink" cx="-6" cy="-5" rx="8" ry="3" transform="rotate(40 -6 -5)"/>
    <path class="il-line" d="M-12 -10l-5 14"/>
    <circle class="il-green il-ink" cx="10" cy="-2" r="5"/>
    <circle class="il-white il-ink il-thin" cx="11" cy="-3" r="2.3"/>
    <circle class="il-dark" cx="11.8" cy="-3.4" r="1.03"/>
    <ellipse class="il-dark il-ink il-thin" cx="13.6" cy="0.6" rx="1.6" ry="1.4"/>
    </g>
    <g transform="translate(68 102) scale(1.35)">
    <path class="il-line il-thin" d="M4 3l-1 8M8 2l3 8M12 -6q2-10-6-14M10 -6q-1-8-8-11"/>
    <ellipse class="il-green il-ink" cx="-2" cy="0" rx="11" ry="5"/>
    <path class="il-teal il-ink il-thin" d="M-12 -1q8-6 16-3-6 5-16 3z"/>
    <ellipse class="il-green il-ink" cx="-6" cy="-5" rx="8" ry="3" transform="rotate(40 -6 -5)"/>
    <path class="il-line" d="M-12 -10l-5 14"/>
    <circle class="il-green il-ink" cx="10" cy="-2" r="5"/>
    <circle class="il-white il-ink il-thin" cx="11" cy="-3" r="2.3"/>
    <circle class="il-dark" cx="11.8" cy="-3.4" r="1.03"/>
    <ellipse class="il-dark il-ink il-thin" cx="13.6" cy="0.6" rx="1.6" ry="1.4"/>
    </g>
    <path class="il-light il-thin" d="M50 66l3-4 2 4 3-4 2 4 3-4 2 4M88 86l3-4 2 4 3-4 2 4 3-4 2 4M8 64l3-4 2 4 3-4 2 4"/>
    <g transform="translate(66 56) scale(0.9)">
    <ellipse class="il-white il-ink il-thin" cx="0" cy="0" rx="3.4" ry="2.6" transform="rotate(-20 0 0)"/>
    <path class="il-line" d="M3 -1v-11q3 2 6 5"/>
    </g>
    <g transform="translate(92 70) scale(0.8)">
    <ellipse class="il-white il-ink il-thin" cx="0" cy="0" rx="3.4" ry="2.6" transform="rotate(-20 0 0)"/>
    <path class="il-line" d="M3 -1v-11q3 2 6 5"/>
    </g>
    <path class="il-green il-ink il-thin" d="M2 120l4-16 3 16M70 120l4-14 3 14M148 120l3-14 3 14"/>
    <g transform="translate(122 74) rotate(180)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/>
    <circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/>
    <path class="il-line il-thin" d="M-7 -6m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3M7 -6m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3"/>
    <path class="il-line" d="M-6 10q3-3 6 0t6 0"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="14" rx="5" ry="7" transform="rotate(-20 -21 14)"/>
    <ellipse class="il-purple il-ink" cx="21" cy="14" rx="5" ry="7" transform="rotate(20 21 14)"/>
    </g>
    <path class="il-light il-thick" d="M108 30a14 8 0 1 1 22 4" opacity="0.9"/>
    <path class="il-white il-ink il-thin" d="M129 28l3 8-8-1z"/>
    <path class="il-yellow il-ink il-thin" d="M96 57l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-yellow il-ink il-thin" d="M150 60.6l1.02 2.38 2.38 1.02-2.38 1.02-1.02 2.38-1.02-2.38-2.38-1.02 2.38-1.02z"/>
    <path class="il-line il-thick" d="M146 36c0-4 6-4 6 0s-3 3-3 6M149 47v0.5"/>`,

  // In the cellar, from the dark mousehole in the skirting board only two big nervous eyes peek out; the mouse
  // in front holds a finger to its lips, while the monster searches the wrong way with a magnifying glass.
  'bg.into-the-mousehole': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" d="M0 20h160M0 40h160M0 60h160M0 80h160M20 0v20M60 0v20M100 0v20M140 0v20M40 20v20M80 20v20M120 20v20M20 40v20M60 40v20M100 40v20M140 40v20M40 60v20M80 60v20M120 60v20M20 80v10M60 80v10M100 80v10M140 80v10" opacity="0.12"/>
    <rect class="il-wood il-ink" x="-2" y="30" width="92" height="5"/>
    <path class="il-line il-thin" d="M10 35v6M78 35v6"/>
    <rect class="il-water il-ink il-thin" x="6" y="16" width="14" height="14" rx="3" opacity="0.85"/>
    <rect class="il-red" x="8" y="21.6" width="10" height="6.4" rx="2"/>
    <rect class="il-metal il-ink il-thin" x="5" y="12" width="16" height="5" rx="1.5"/>
    <path class="il-light il-thin" d="M9 19v4.2" opacity="0.7"/>
    <rect class="il-water il-ink il-thin" x="26" y="12" width="16" height="18" rx="3" opacity="0.85"/>
    <rect class="il-green" x="28" y="19.2" width="12" height="8.8" rx="2"/>
    <rect class="il-red il-ink il-thin" x="25" y="8" width="18" height="5" rx="1.5"/>
    <path class="il-light il-thin" d="M29 15v5.3999999999999995" opacity="0.7"/>
    <rect class="il-water il-ink il-thin" x="48" y="18" width="12" height="12" rx="3" opacity="0.85"/>
    <rect class="il-gold" x="50" y="22.8" width="8" height="5.2" rx="2"/>
    <rect class="il-metal il-ink il-thin" x="47" y="14" width="14" height="5" rx="1.5"/>
    <path class="il-light il-thin" d="M51 21v3.5999999999999996" opacity="0.7"/>
    <rect class="il-water il-ink il-thin" x="66" y="14" width="14" height="16" rx="3" opacity="0.85"/>
    <rect class="il-orange" x="68" y="20.4" width="10" height="7.6" rx="2"/>
    <rect class="il-green il-ink il-thin" x="65" y="10" width="16" height="5" rx="1.5"/>
    <path class="il-light il-thin" d="M69 17v4.8" opacity="0.7"/>
    <rect class="il-wood-dark" x="0" y="96" width="160" height="24"/>
    <path class="il-line il-thin" d="M0 106h160M30 96v10M90 96v10M60 106v14M130 106v14" opacity="0.5"/>
    <rect class="il-wood il-ink" x="-2" y="88" width="164" height="8"/>
    <path class="il-dark il-ink" d="M26 96V84a15 15 0 0 1 30 0v12z"/>
    <ellipse class="il-white il-ink il-thin" cx="36" cy="84" rx="3.2" ry="4.2"/>
    <ellipse class="il-white il-ink il-thin" cx="44.5" cy="84" rx="3.2" ry="4.2"/>
    <circle class="il-dark" cx="37.4" cy="85" r="1.6"/>
    <circle class="il-dark" cx="45.9" cy="85" r="1.6"/>
    <path class="il-light il-thin" d="M33 78l4 1M48 78l-4 1" opacity="0.8"/>
    <circle class="il-grey il-ink" cx="60" cy="74" r="5"/>
    <circle class="il-pink" cx="60" cy="74" r="2.6"/>
    <circle class="il-grey il-ink" cx="74" cy="74" r="5"/>
    <circle class="il-pink" cx="74" cy="74" r="2.6"/>
    <ellipse class="il-grey il-ink" cx="67" cy="92" rx="8" ry="8"/>
    <circle class="il-grey il-ink" cx="67" cy="80" r="7"/>
    <circle class="il-white il-ink il-thin" cx="64.5" cy="79" r="2"/>
    <circle class="il-dark" cx="64.9" cy="79" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="69.5" cy="79" r="2"/>
    <circle class="il-dark" cx="69.9" cy="79" r="0.9"/>
    <circle class="il-pink il-ink il-thin" cx="67" cy="84" r="1.4"/>
    <path class="il-line il-thin" d="M60 84l-5-1M60 86l-5 1M74 84l5-1M74 86l5 1"/>
    <path class="il-grey il-ink il-thin" d="M70 92l-1-5-3 0"/>
    <ellipse class="il-grey il-ink il-thin" cx="65.6" cy="86.6" rx="1.6" ry="2.6"/>
    <ellipse class="il-pink il-ink il-thin" cx="63" cy="99.6" rx="3" ry="1.6"/>
    <ellipse class="il-pink il-ink il-thin" cx="71" cy="99.6" rx="3" ry="1.6"/>
    <g transform="translate(114 72)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="-4.8" cy="-5.2" r="2.48"/>
    <circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="9.2" cy="-5.2" r="2.48"/>
    <path class="il-line" d="M-2 9q3 2 6 0"/>
    <path class="il-line il-thin" d="M-12 -13l5 1M12 -13l-5 1"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="6" rx="5" ry="7" transform="rotate(20 -21 6)"/>
    <ellipse class="il-purple il-ink" cx="21" cy="2" rx="5" ry="7" transform="rotate(-60 21 2)"/>
    </g>
    <path class="il-wood il-ink il-thin" d="M136 76l6 5-1.4 1.6-6-5z"/>
    <circle class="il-metal il-ink" cx="146" cy="87" r="6.4"/>
    <circle class="il-water" cx="146" cy="87" r="4.4" opacity="0.7"/>
    <path class="il-light il-thin" d="M143 84.4l2-1.4" opacity="0.9"/>
    <path class="il-line il-thick" d="M136 30c0-4 6-4 6 0s-3 3-3 6M139 41v0.5M150 24c0-3 4-3 4 0s-2 2-2 4M152 31.6v0.5"/>`,

  // A beetle plays dead on its back: six legs stiffly in the air, tongue out, a daisy on its tummy - but one
  // eye secretly peeks; the monster shrugs, bored, and wanders off.
  'bg.play-dead': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 90q50-6 100-2t60 0v32H0z"/>
    <ellipse class="il-orange il-ink il-thin" cx="20" cy="108" rx="7" ry="3" transform="rotate(-20 20 108)"/>
    <ellipse class="il-gold il-ink il-thin" cx="96" cy="112" rx="6" ry="2.6" transform="rotate(15 96 112)"/>
    <ellipse class="il-orange il-ink il-thin" cx="150" cy="104" rx="6" ry="2.6" transform="rotate(-10 150 104)"/>
    <path class="il-line il-thin" d="M14 108l12-4M90 113l12-2" opacity="0.5"/>
    <path class="il-line il-thick" d="M30 86l-8-12-4 0M38 84l-4-16-4-1M48 82l0-17-3-2M58 82l2-17 3-2M68 84l5-15 4-1M76 88l9-11 4 1"/>
    <path class="il-blue il-ink" d="M22 90a32 14 0 0 0 64 0z"/>
    <path class="il-light il-thin" d="M30 96q20 6 44 0" opacity="0.6"/>
    <ellipse class="il-wood-dark il-ink" cx="54" cy="88" rx="30" ry="9"/>
    <path class="il-line il-thin" d="M40 82v12M50 80v16M60 80v16M70 82v12" opacity="0.6"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="77.8" rx="2.52" ry="4.2" transform="rotate(0 54 82)"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="77.8" rx="2.52" ry="4.2" transform="rotate(60 54 82)"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="77.8" rx="2.52" ry="4.2" transform="rotate(120 54 82)"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="77.8" rx="2.52" ry="4.2" transform="rotate(180 54 82)"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="77.8" rx="2.52" ry="4.2" transform="rotate(240 54 82)"/>
    <ellipse class="il-white il-ink il-thin" cx="54" cy="77.8" rx="2.52" ry="4.2" transform="rotate(300 54 82)"/>
    <circle class="il-yellow il-ink il-thin" cx="54" cy="82" r="2.52"/>
    <circle class="il-blue il-ink" cx="93" cy="90" r="10"/>
    <path class="il-light il-thin" d="M87 84q3-3 7-3" opacity="0.6"/>
    <path class="il-line il-thin" d="M98 81l5-9M92 80l-1-9"/>
    <circle class="il-dark" cx="103" cy="72" r="1.2"/>
    <circle class="il-dark" cx="91" cy="71" r="1.2"/>
    <path class="il-line il-thin" d="M86 89q2.4 2 4.8 0"/>
    <ellipse class="il-white il-ink il-thin" cx="98" cy="89.4" rx="2.6" ry="1.7"/>
    <circle class="il-dark" cx="99.2" cy="89.6" r="1.1"/>
    <path class="il-line il-thin" d="M95.2 88.4q2.8-1.4 5.6 0M88 95q4 1.6 8 0"/>
    <path class="il-pink il-ink il-thin" d="M90 95.6q0 5 3 5 2 0 1-5z"/>
    <g transform="translate(130 72) scale(0.95)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="12" cy="21" rx="7" ry="4" transform="rotate(-25 12 21)"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <path class="il-white il-ink il-thin" d="M-12 -6a5 5 0 0 1 10 0zM2 -6a5 5 0 0 1 10 0z"/>
    <circle class="il-dark" cx="-5.6" cy="-7.6" r="1.6"/>
    <circle class="il-dark" cx="8.4" cy="-7.6" r="1.6"/>
    <path class="il-line" d="M-12 -6h10M2 -6h10"/>
    <path class="il-line" d="M-4 9h8"/>
    <ellipse class="il-purple il-ink" cx="-24" cy="-8" rx="7" ry="4.5" transform="rotate(-30 -24 -8)"/>
    <ellipse class="il-purple il-ink" cx="24" cy="-8" rx="7" ry="4.5" transform="rotate(30 24 -8)"/>
    </g>
    <path class="il-line il-thin" d="M102 60l-4-2M104 66l-5 0" opacity="0.8"/>
    <path class="il-line il-thin" d="M112 34l-3-4M152 34l3-4" opacity="0.9"/>`,

  // A smug little snail gives one nudge and the monster shoots along the glistening slime trail, flailing
  // through the air, straight toward the giant rhubarb leaves.
  'bg.slime-slide': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <ellipse class="il-smoke" cx="50" cy="14" rx="16" ry="5" opacity="0.3"/>
    <path class="il-grass" d="M0 90q60-4 160 0v30H0z"/>
    <path class="il-slime" d="M18 98c30 6 66 8 92-2l2 6c-26 12-64 10-96 2z" opacity="0.75"/>
    <path class="il-light il-thin" d="M30 100q20 4 40 3M84 102q10-2 18-6" opacity="0.8"/>
    <path class="il-white il-ink il-thin" d="M56 101l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-white il-ink il-thin" d="M96 98.6l0.72 1.68 1.68 0.72-1.68 0.72-0.72 1.68-0.72-1.68-1.68-0.72 1.68-0.72z"/>
    <path class="il-skin il-ink" d="M4 100h26c4 0 6-2 7-6l2-8c1-4-5-5-6-1l-2 6c-1 3-3 4-6 4H8c-4 0-6 2-4 5z"/>
    <path class="il-line il-thick" d="M33 84l-2-6M37 85l2-6"/>
    <circle class="il-white il-ink il-thin" cx="30.6" cy="76" r="2.6"/>
    <circle class="il-dark" cx="31.4" cy="76.4" r="1.17"/>
    <circle class="il-white il-ink il-thin" cx="39.4" cy="76" r="2.6"/>
    <circle class="il-dark" cx="40.2" cy="76.4" r="1.17"/>
    <path class="il-line il-thin" d="M28 74h5M37 74h5"/>
    <path class="il-line il-thin" d="M32 90q3 2 5-1"/>
    <circle class="il-orange il-ink" cx="16" cy="88" r="10"/>
    <path class="il-line il-thin" d="M17 89a2.2 2.2 0 1 0-3 1.6 5.6 5.6 0 1 0 8-4.6 9 9 0 1 0-13 11"/>
    <path class="il-line il-thin" d="M44 86l5-2M44 92l6 0" opacity="0.9"/>
    <path class="il-red il-ink" d="M136 116c-3-12-8-22-16-30l7-5c8 9 13 21 15 34zM144 116c0-14 1-26 4-38l8 1c-3 12-5 24-5 37zM132 116c-6-6-12-9-20-10l1-7c9 1 16 5 23 12z"/>
    <path class="il-light il-thin" d="M127 90q4 6 7 14M150 84q-2 8-2 16" opacity="0.5"/>
    <g transform="translate(122 84) rotate(-30) scale(1.3)">
    <path class="il-green il-ink" d="M0 0c-10-2-18-10-16-20 2-6 8-6 10-10 4-6 12-4 14 0 6-2 12 2 10 8 6 4 4 14-4 16-4 4-10 6-14 6z"/>
    <path class="il-line il-thin" d="M0 0l2-24M1 -10l-8-6M1 -10l9-6M2 -18l-5-6M2 -18l6-5" opacity="0.6"/>
    </g>
    <g transform="translate(150 80) rotate(15) scale(1.25)">
    <path class="il-green il-ink" d="M0 0c-10-2-18-10-16-20 2-6 8-6 10-10 4-6 12-4 14 0 6-2 12 2 10 8 6 4 4 14-4 16-4 4-10 6-14 6z"/>
    <path class="il-line il-thin" d="M0 0l2-24M1 -10l-8-6M1 -10l9-6M2 -18l-5-6M2 -18l6-5" opacity="0.6"/>
    </g>
    <g transform="translate(112 100) rotate(-70) scale(1.05)">
    <path class="il-green il-ink" d="M0 0c-10-2-18-10-16-20 2-6 8-6 10-10 4-6 12-4 14 0 6-2 12 2 10 8 6 4 4 14-4 16-4 4-10 6-14 6z"/>
    <path class="il-line il-thin" d="M0 0l2-24M1 -10l-8-6M1 -10l9-6M2 -18l-5-6M2 -18l6-5" opacity="0.6"/>
    </g>
    <path class="il-line il-thin" d="M58 70l-14 4M62 60l-14 0M64 80l-12 8" opacity="0.9"/>
    <g transform="translate(86 58) rotate(-25) scale(0.95)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="23" rx="7" ry="4" transform="rotate(30 -12 23)"/>
    <ellipse class="il-purple-dark il-ink" cx="8" cy="26" rx="7" ry="4" transform="rotate(-20 8 26)"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="-5.4" cy="-7.6" r="2.48"/>
    <circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/>
    <circle class="il-dark" cx="8.6" cy="-7.6" r="2.48"/>
    <ellipse class="il-dark il-ink il-thin" cx="1" cy="9" rx="4" ry="5"/>
    <path class="il-line il-thin" d="M-12 -14l5 3M12 -14l-5 3"/>
    <ellipse class="il-purple il-ink" cx="-21" cy="-10" rx="5" ry="8" transform="rotate(-35 -21 -10)"/>
    <ellipse class="il-purple il-ink" cx="22" cy="-8" rx="5" ry="8" transform="rotate(40 22 -8)"/>
    </g>
    <path class="il-slime il-ink il-thin" d="M74 84q-2 3 0 4.4 2-1.4 0-4.4zM98 82q-2 3 0 4.4 2-1.4 0-4.4z"/>`,

  // An ant beside a single sad crumb stretches its very long, wavy feelers through a knothole in the garden
  // fence to the other side, where a big cream cake with a cherry waits; it dreams with a drooling grin.
  'bg.feelers-out': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 98h160v22H0z"/>
    <path class="il-grass il-ink il-thin" d="M6 98l2-6 2 6 2-8 2 8M142 98l2-6 2 6 2-8 2 8"/>
    <path class="il-line" d="M88 60C98 56 104 66 112 64S120 64 124 66M88 59C98 50 108 58 114 56S124 60 128 65"/>
    <rect class="il-wood il-ink" x="66" y="14" width="15" height="92"/>
    <rect class="il-wood il-ink" x="81" y="18" width="15" height="88"/>
    <path class="il-wood il-ink" d="M66 14l7.5-8 7.5 8zM81 18l7.5-8 7.5 8z"/>
    <path class="il-line il-thin" d="M70 30v20M76 70v20M86 40v14M92 76v14" opacity="0.5"/>
    <circle class="il-dark" cx="73.5" cy="22" r="1"/>
    <circle class="il-dark" cx="88.5" cy="26" r="1"/>
    <circle class="il-dark" cx="73.5" cy="96" r="1"/>
    <circle class="il-dark" cx="88.5" cy="96" r="1"/>
    <ellipse class="il-dark il-ink il-thin" cx="88" cy="60" rx="4" ry="5"/>
    <ellipse class="il-white il-ink il-thin" cx="22" cy="100" rx="14" ry="3"/>
    <circle class="il-wood il-ink il-thin" cx="24" cy="97" r="1.8"/>
    <g transform="translate(38 90) scale(1.35)">
    <path class="il-line il-thin" d="M-2 2l-7 9M0 3l-1 10M2 2l7 9"/>
    <ellipse class="il-red il-ink" cx="-10" cy="-1" rx="8" ry="6"/>
    <path class="il-light il-thin" d="M-14 -4q3-2 6-2" opacity="0.6"/>
    <ellipse class="il-red il-ink" cx="0" cy="0" rx="4.5" ry="3.5"/>
    <circle class="il-red il-ink" cx="9" cy="-3" r="5.5"/>
    <path class="il-line il-thin" d="M11 -8q2-6 7-6M8 -8q0-6 4-8"/>
    <path class="il-line il-thin" d="M9 -6.5q2.2-1.6 4.4 0"/>
    <circle class="il-dark" cx="11.2" cy="-3.8" r="0.8"/>
    <path class="il-line il-thin" d="M9.6 0q2.4 2 4.6 0"/>
    <path class="il-water il-ink il-thin" d="M13.6 1.4q-1.2 2.4 0 3.4 1.2-1 0-3.4z"/>
    </g>
    <path class="il-line" d="M53 79C58 64 66 56 76 60S84 62 88 60M49 79C50 60 60 50 72 54S82 58 88 59"/>
    <circle class="il-red il-ink il-thin" cx="124" cy="66" r="1.8"/>
    <circle class="il-red il-ink il-thin" cx="128" cy="65" r="1.8"/>
    <ellipse class="il-white il-ink il-thin" cx="132" cy="98" rx="22" ry="4"/>
    <rect class="il-paper il-ink" x="114" y="76" width="36" height="20" rx="2"/>
    <rect class="il-pink" x="114" y="84" width="36" height="3"/>
    <path class="il-white il-ink" d="M112 78c0-8 40-8 40 0 0 4-3 2-5 5-2-3-4-3-6 0-2-3-4-3-6 0-2-3-4-3-6 0-2-3-4-3-6 0-2-3-4-3-6 0-2-3-5-1-5-5z"/>
    <circle class="il-red il-ink" cx="132" cy="68" r="4"/>
    <path class="il-line il-thin" d="M132 64q2-5 5-5"/>
    <path class="il-light il-thin" d="M130.4 66.6l1-1" opacity="0.9"/>
    <path class="il-yellow il-ink il-thin" d="M150 57l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-yellow il-ink il-thin" d="M110 53.4l0.78 1.82 1.82 0.78-1.82 0.78-0.78 1.82-0.78-1.82-1.82-0.78 1.82-0.78z"/>
    <path class="il-line il-thin" d="M24 86q2-3 4 0M20 80q2-3 4 0" opacity="0.6"/>`,

  // A beetle has outgrown its old shell: the empty, cracked see-through husk lies slumped on the left, while
  // the new, much bigger shiny beetle flexes beside a growth stick whose new mark is far above the old one.
  'bg.moulted': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100q80-6 160 0v20H0z"/>
    <path class="il-grass il-ink il-thin" d="M150 100l2-6 2 6 2-8 2 8M4 102l2-6 2 6 2-8 2 8"/>
    <rect class="il-wood il-ink" x="60" y="20" width="10" height="86" rx="2"/>
    <path class="il-line il-thin" d="M60 30h4M60 40h6M60 50h4M60 60h6M60 70h4M60 80h6M60 90h4"/>
    <path class="il-red il-ink il-thin" d="M56 74h18l-2 3h-14z"/>
    <path class="il-red il-ink il-thin" d="M56 26h18l-2 3h-14z"/>
    <path class="il-light il-thick" d="M50 70V36" opacity="0.9"/>
    <path class="il-white il-ink il-thin" d="M46 38l4-7 4 7z"/>
    <g transform="translate(30 84) rotate(-18) scale(1.15)">
    <path class="il-line il-thin" d="M-10 4l-6 4M10 4l6 4M-6 14l-3 7M6 14l3 7M-9 -2l-6-4M9 -2l6-4M-3 -18q-2-6-6-6M3 -18q2-6 6-6" opacity="0.5"/>
    <ellipse class="il-white il-ink" cx="0" cy="4" rx="11" ry="13" opacity="0.45"/>
    <circle class="il-white il-ink" cx="0" cy="-12" r="7" opacity="0.45"/>
    <path class="il-line" d="M0 -16l2 4-3 4 3 4-2 4 2 4"/>
    <path class="il-line il-thin" d="M-7 2q-1 6 2 12" opacity="0.5"/>
    <path class="il-line il-thin" d="M-4.6 -13q1.6-1.6 3.2 0M1.4 -13q1.6-1.6 3.2 0" opacity="0.6"/>
    </g>
    <path class="il-line il-thin" d="M14 64l-3-4M22 60v-5M42 64l3-4" opacity="0.6"/>
    <g transform="translate(112 64) scale(2)">
    <path class="il-line il-thin" d="M-9 -2l-6 2-2-7M9 -2l6 2 2-7M-10 4l-6 4M10 4l6 4M-6 14l-3 7M6 14l3 7"/>
    <ellipse class="il-green il-ink" cx="0" cy="4" rx="11" ry="13"/>
    <path class="il-line il-thin" d="M0 -8v24"/>
    <path class="il-light il-thin" d="M-7 -2q0-5 4-7M5 12q3-2 3-6" opacity="0.8"/>
    <circle class="il-teal il-ink" cx="0" cy="-12" r="7"/>
    <path class="il-line il-thin" d="M-3 -18q-2-6-6-6M3 -18q2-6 6-6"/>
    <circle class="il-white il-ink il-thin" cx="-2.6" cy="-13" r="2"/>
    <circle class="il-dark" cx="-2.6" cy="-13.2" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.6" cy="-13" r="2"/>
    <circle class="il-dark" cx="2.6" cy="-13.2" r="0.9"/>
    <path class="il-white il-ink il-thin" d="M-3 -9q3 3 6 0z"/>
    </g>
    <circle class="il-green il-ink il-thin" cx="82" cy="54" r="3"/>
    <circle class="il-green il-ink il-thin" cx="142" cy="54" r="3"/>
    <path class="il-yellow il-ink il-thin" d="M84 30l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M144 26.6l1.02 2.38 2.38 1.02-2.38 1.02-1.02 2.38-1.02-2.38-2.38-1.02 2.38-1.02z"/>
    <path class="il-yellow il-ink il-thin" d="M150 73l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>`,

  // Ta-da: a big, beaming butterfly bursts out with bright new wings, still wearing its nightcap from the very
  // long nap; the empty cocoon hangs from the twig and the leaves around it are nibbled down to the stalks.
  'bg.butterfly-at-last': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <ellipse class="il-smoke" cx="140" cy="102" rx="18" ry="5" opacity="0.3"/>
    <path class="il-wood-dark il-ink" d="M-2 14c40-4 80 2 112-2l2 5c-34 4-72-2-114 3z"/>
    <path class="il-green il-ink il-thin" d="M60 18c2 6 0 12-4 14-2-2 0-4-2-5-2 0-3 2-4 0 0-4 4-8 10-9zM86 16c4 4 6 10 2 14-1-2-3-1-3-3 1-2-1-3-2-3-1-3 1-6 3-8zM16 18c-4 4-6 10-2 14 1-3 3-2 4-4-1-2 0-3 2-4z"/>
    <path class="il-line il-thin" d="M36 18v5"/>
    <g transform="rotate(-8 36 22)">
    <path class="il-paper il-ink" d="M23 46c-2-14 4-24 13-24s15 10 13 24l-3 3-3-4-3 4-4-4-3 4-3-4-3 4z"/>
    <path class="il-line il-thin" d="M26 30l18 6M24 38l24 7M30 25l12 4" opacity="0.45"/>
    <path class="il-dark" d="M27 45.6l3 3.4 3-4 4 4 3-4 3 4 3-3.4c-4-3-15-3-19 0z" opacity="0.85"/>
    </g>
    <path class="il-paper il-ink il-thin" d="M28 60l5-2 1 5zM42 68l4 1-3 4z"/>
    <path class="il-line il-thin" d="M30 54v-3M44 63v-3" opacity="0.7"/>
    <ellipse class="il-orange il-ink" cx="84" cy="50" rx="20" ry="15" transform="rotate(-30 84 50)"/>
    <ellipse class="il-orange il-ink" cx="124" cy="50" rx="20" ry="15" transform="rotate(30 124 50)"/>
    <ellipse class="il-gold il-ink" cx="90" cy="74" rx="13" ry="10" transform="rotate(25 90 74)"/>
    <ellipse class="il-gold il-ink" cx="118" cy="74" rx="13" ry="10" transform="rotate(-25 118 74)"/>
    <circle class="il-yellow il-ink il-thin" cx="82" cy="48" r="6"/>
    <circle class="il-yellow il-ink il-thin" cx="126" cy="48" r="6"/>
    <circle class="il-dark" cx="76" cy="56" r="2.4"/>
    <circle class="il-dark" cx="132" cy="56" r="2.4"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="76" r="3"/>
    <circle class="il-white il-ink il-thin" cx="118" cy="76" r="3"/>
    <ellipse class="il-dark il-ink" cx="104" cy="67" rx="6.5" ry="10"/>
    <path class="il-light il-thin" d="M99.5 63h9M99 68h10M100 73h8" opacity="0.4"/>
    <circle class="il-dark il-ink" cx="104" cy="50" r="9"/>
    <path class="il-line il-thin" d="M101 42q-4-12-10-12M107 42q4-12 10-12"/>
    <circle class="il-dark" cx="91" cy="30" r="1.8"/>
    <circle class="il-dark" cx="117" cy="30" r="1.8"/>
    <path class="il-light" d="M98 50q2.4-2.6 4.8 0M105.2 50q2.4-2.6 4.8 0"/>
    <path class="il-white il-ink il-thin" d="M99 54q5 6 10 0z"/>
    <ellipse class="il-pink" cx="97" cy="55" rx="1.8" ry="1.2" opacity="0.8"/>
    <ellipse class="il-pink" cx="111" cy="55" rx="1.8" ry="1.2" opacity="0.8"/>
    <path class="il-blue il-ink il-thin" d="M95 44c0-10 18-10 18 0-4-2-14-2-18 0zM110 40q8-2 12 6"/>
    <circle class="il-white il-ink il-thin" cx="122" cy="47" r="2.4"/>
    <path class="il-yellow il-ink il-thin" d="M66 24l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M144 22l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <path class="il-yellow il-ink il-thin" d="M70 81l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-yellow il-ink il-thin" d="M140 82.6l1.02 2.38 2.38 1.02-2.38 1.02-1.02 2.38-1.02-2.38-2.38-1.02 2.38-1.02z"/>
    <path class="il-line il-thin" d="M60 50l-6-2M62 60l-7 1M148 50l6-2M146 60l7 1" opacity="0.8"/>
    <path class="il-grass" d="M0 108h160v12H0z"/>
    <path class="il-green il-ink il-thin" d="M20 108c2-6 8-8 10-4-2 1-1 3-3 3-1-2-3 0-3 1zM140 108c2-6 8-6 9-2-2 0-2 2-4 2z"/>`,

  // Summer party on the compost heap at night: paper lanterns glow on a string, a worm in a party hat beams
  // beside a layered humus cake with a little sprout on top, and a beetle dances with an autumn leaf held high.
  'bg.compost-party': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M146 28l0.6 1.4 1.4 0.6-1.4 0.6-0.6 1.4-0.6-1.4-1.4-0.6 1.4-0.6z"/>
    <path class="il-white" d="M40 32.2l0.54 1.26 1.26 0.54-1.26 0.54-0.54 1.26-0.54-1.26-1.26-0.54 1.26-0.54z"/>
    <path class="il-line il-thin" d="M-2 6q42 18 82 6t82 4"/>
    <circle class="il-glow" cx="18" cy="17" r="9" opacity="0.18"/>
    <path class="il-line il-thin" d="M18 9v3"/>
    <ellipse class="il-red il-ink il-thin" cx="18" cy="17" rx="5" ry="6"/>
    <path class="il-line il-thin" d="M18 11v12M14.4 12.6q-2 4.4 0 8.8M21.6 12.6q2 4.4 0 8.8" opacity="0.5"/>
    <circle class="il-glow" cx="48" cy="21" r="9" opacity="0.18"/>
    <path class="il-line il-thin" d="M48 13v3"/>
    <ellipse class="il-yellow il-ink il-thin" cx="48" cy="21" rx="5" ry="6"/>
    <path class="il-line il-thin" d="M48 15v12M44.4 16.6q-2 4.4 0 8.8M51.6 16.6q2 4.4 0 8.8" opacity="0.5"/>
    <circle class="il-glow" cx="80" cy="17" r="9" opacity="0.18"/>
    <path class="il-line il-thin" d="M80 9v3"/>
    <ellipse class="il-orange il-ink il-thin" cx="80" cy="17" rx="5" ry="6"/>
    <path class="il-line il-thin" d="M80 11v12M76.4 12.6q-2 4.4 0 8.8M83.6 12.6q2 4.4 0 8.8" opacity="0.5"/>
    <circle class="il-glow" cx="112" cy="15" r="9" opacity="0.18"/>
    <path class="il-line il-thin" d="M112 7v3"/>
    <ellipse class="il-teal il-ink il-thin" cx="112" cy="15" rx="5" ry="6"/>
    <path class="il-line il-thin" d="M112 9v12M108.4 10.6q-2 4.4 0 8.8M115.6 10.6q2 4.4 0 8.8" opacity="0.5"/>
    <circle class="il-glow" cx="142" cy="19" r="9" opacity="0.18"/>
    <path class="il-line il-thin" d="M142 11v3"/>
    <ellipse class="il-pink il-ink il-thin" cx="142" cy="19" rx="5" ry="6"/>
    <path class="il-line il-thin" d="M142 13v12M138.4 14.6q-2 4.4 0 8.8M145.6 14.6q2 4.4 0 8.8" opacity="0.5"/>
    <path class="il-earth-dark il-ink" d="M20 104c6-36 30-58 64-58s52 22 58 58z"/>
    <path class="il-orange il-ink il-thin" d="M50 72c4-4 10-4 12 0-4 3-8 3-12 0zM100 64c4-4 10-4 12 0-4 3-8 3-12 0z"/>
    <path class="il-gold il-ink il-thin" d="M74 56c4-4 10-4 12 0-4 3-8 3-12 0zM116 84c4-4 10-4 12 0-4 3-8 3-12 0z"/>
    <path class="il-white il-ink il-thin" d="M40 88l4-5 3 3 3-4 1 6zM88 62l4-4 2 3 3-2v4z"/>
    <path class="il-white il-ink il-thin" d="M52 90c0 6 4 9 8 9s8-3 8-9l-2 2-2-3-2 3-2-3-2 3-2-3-2 3z"/>
    <path class="il-earth il-ink" d="M-2 104h164v18H-2z"/>
    <ellipse class="il-white il-ink il-thin" cx="82" cy="104" rx="20" ry="3.6"/>
    <rect class="il-earth-dark il-ink" x="66" y="84" width="32" height="18" rx="2"/>
    <rect class="il-earth" x="66" y="90" width="32" height="4"/>
    <path class="il-wood-dark il-ink" d="M64 86c0-6 36-6 36 0 0 3-3 1-4 4-2-3-4-3-6 0-2-3-4-3-6 0-2-3-4-3-6 0-2-3-4-3-6 0-2-3-4-3-6 0-1-2-2 0-2-4z"/>
    <circle class="il-earth" cx="74" cy="97" r="1"/>
    <circle class="il-earth" cx="90" cy="98" r="1.2"/>
    <path class="il-line il-thin" d="M82 82v-6"/>
    <path class="il-green il-ink il-thin" d="M82 77c-4-4-8-2-8 0 4 2 6 2 8 0zM82 76c3-5 8-4 8-2-3 3-6 3-8 2z"/>
    <circle class="il-pink il-ink" cx="10" cy="102" r="5"/>
    <circle class="il-pink il-ink" cx="12.19" cy="105.85" r="5.13"/>
    <circle class="il-pink il-ink" cx="15.5" cy="108.41" r="5.25"/>
    <circle class="il-pink il-ink" cx="19.56" cy="109.7" r="5.38"/>
    <circle class="il-pink il-ink" cx="24" cy="109.75" r="5.5"/>
    <circle class="il-pink il-ink" cx="28.44" cy="108.58" r="5.63"/>
    <circle class="il-pink il-ink" cx="32.5" cy="106.22" r="5.75"/>
    <circle class="il-pink il-ink" cx="35.81" cy="102.68" r="5.88"/>
    <circle class="il-pink il-ink" cx="38" cy="98" r="6"/>
    <circle class="il-pink il-ink" cx="40" cy="91" r="8"/>
    <path class="il-line" d="M35.6 89q2-2.6 4 0M41.6 89q2-2.6 4 0"/>
    <path class="il-white il-ink il-thin" d="M36.6 93.6q4 5 8 0z"/>
    <ellipse class="il-red" cx="34.6" cy="93" rx="1.6" ry="1" opacity="0.6"/>
    <path class="il-yellow il-ink il-thin" d="M33 85l8-14 6 12z"/>
    <path class="il-line il-thin" d="M36.6 80l5 1.6M35 83.4l8 1" opacity="0.5"/>
    <circle class="il-red il-ink il-thin" cx="41" cy="71" r="2"/>
    <g transform="translate(124 88) scale(1.1) rotate(8)">
    <path class="il-line il-thin" d="M-9 -2l-6-6-1-6M9 -2l6-6 1-6M-10 4l-6 4M10 4l6 4M-6 14l-3 7M6 14l3 7"/>
    <ellipse class="il-red il-ink" cx="0" cy="4" rx="11" ry="13"/>
    <path class="il-line il-thin" d="M0 -8v24"/>
    <path class="il-light il-thin" d="M-7 -2q0-5 4-7" opacity="0.7"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="7"/>
    <path class="il-line il-thin" d="M-3 -18q-2-6-6-6M3 -18q2-6 6-6"/>
    <circle class="il-white il-ink il-thin" cx="-2.6" cy="-13" r="2"/>
    <circle class="il-dark" cx="-2.2" cy="-13" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.6" cy="-13" r="2"/>
    <circle class="il-dark" cx="3" cy="-13" r="0.9"/>
    <path class="il-white il-ink il-thin" d="M-3 -9q3 3 6 0z"/>
    </g>
    <path class="il-orange il-ink" d="M108 66c4-12 26-14 32-2-6 0-8 4-14 2-4 4-12 2-18 0z"/>
    <path class="il-line il-thin" d="M110 66q12-4 28-2" opacity="0.6"/>
    <g transform="translate(146 86) scale(0.9)">
    <ellipse class="il-white il-ink il-thin" cx="0" cy="0" rx="3.4" ry="2.6" transform="rotate(-20 0 0)"/>
    <path class="il-line" d="M3 -1v-11q3 2 6 5"/>
    </g>
    <g transform="translate(98 52) scale(0.8)">
    <ellipse class="il-white il-ink il-thin" cx="0" cy="0" rx="3.4" ry="2.6" transform="rotate(-20 0 0)"/>
    <path class="il-line" d="M3 -1v-11q3 2 6 5"/>
    </g>
    <path class="il-line il-thin" d="M106 96l-4 2M144 96l4 2" opacity="0.8"/>`,

  // Family portrait across two worlds: on the earth side a worm in glasses, on the grass side an ant, and in
  // the middle the caterpillar with its six little legs, hugged by both, hearts floating above.
  'bg.six-legged-worm': `
    <rect class="il-earth" x="0" y="0" width="80" height="120"/>
    <path class="il-earth-dark" d="M0 40h80v8H0zM0 72h80v6H0z" opacity="0.6"/>
    <ellipse class="il-stone il-ink il-thin" cx="14" cy="22" rx="4" ry="3"/>
    <ellipse class="il-stone il-ink il-thin" cx="40" cy="40" rx="3" ry="2.2"/>
    <path class="il-line il-thin" d="M20 0q-2 10 2 18M54 0q2 8-2 14" opacity="0.5"/>
    <rect class="il-sky" x="80" y="0" width="80" height="120"/>
    <path class="il-grass" d="M80 100h80v20H80z"/>
    <path class="il-grass il-ink il-thin" d="M140 100l2-6 2 6 2-8 2 8M150 100l2-6 2 6 2-8 2 8"/>
    <path class="il-earth-dark" d="M0 100h80v20H0z" opacity="0.6"/>
    <path class="il-light il-thin il-dash" d="M80 0v120" opacity="0.5"/>
    <circle class="il-pink il-ink" cx="4" cy="102" r="5"/>
    <circle class="il-pink il-ink" cx="6.85" cy="106.5" r="5.13"/>
    <circle class="il-pink il-ink" cx="10.69" cy="109.53" r="5.25"/>
    <circle class="il-pink il-ink" cx="15.18" cy="111.11" r="5.38"/>
    <circle class="il-pink il-ink" cx="20" cy="111.25" r="5.5"/>
    <circle class="il-pink il-ink" cx="24.82" cy="109.99" r="5.63"/>
    <circle class="il-pink il-ink" cx="29.31" cy="107.34" r="5.75"/>
    <circle class="il-pink il-ink" cx="33.15" cy="103.34" r="5.88"/>
    <circle class="il-pink il-ink" cx="36" cy="98" r="6"/>
    <path class="il-line il-thin" d="M10 110l3 3M20 112v4" opacity="0.4"/>
    <circle class="il-pink il-ink" cx="40" cy="86" r="8.5"/>
    <circle class="il-white il-ink il-thin" cx="37" cy="85" r="3.4"/>
    <circle class="il-white il-ink il-thin" cx="44.6" cy="85" r="3.4"/>
    <path class="il-line il-thin" d="M40.4 85h0.8M33.6 84l-2-1"/>
    <circle class="il-dark" cx="37.6" cy="85.4" r="1.3"/>
    <circle class="il-dark" cx="45.2" cy="85.4" r="1.3"/>
    <path class="il-white il-ink il-thin" d="M36.6 90q4 4.4 8 0z"/>
    <ellipse class="il-red" cx="34" cy="90" rx="1.6" ry="1" opacity="0.6"/>
    <circle class="il-green il-ink" cx="60" cy="96" r="6"/>
    <circle class="il-green il-ink" cx="64.06" cy="93.48" r="6.07"/>
    <circle class="il-green il-ink" cx="69.78" cy="91.85" r="6.13"/>
    <circle class="il-green il-ink" cx="76.5" cy="91" r="6.2"/>
    <circle class="il-green il-ink" cx="83.56" cy="90.81" r="6.27"/>
    <circle class="il-green il-ink" cx="90.28" cy="91.19" r="6.33"/>
    <path class="il-line il-thin" d="M66 100l-1 4M73 99v4M80 98l1 4M87 98v4M93 99l1 4M99 100l1 4"/>
    <circle class="il-green il-ink" cx="104" cy="86" r="8.5"/>
    <circle class="il-yellow il-ink il-thin" cx="65" cy="87" r="1.6"/>
    <circle class="il-yellow il-ink il-thin" cx="79" cy="85" r="1.6"/>
    <circle class="il-yellow il-ink il-thin" cx="92" cy="86" r="1.6"/>
    <path class="il-line il-thin" d="M101 78q-2-6-5-7M107 78q2-6 5-7"/>
    <circle class="il-dark" cx="96" cy="71" r="1.4"/>
    <circle class="il-dark" cx="112" cy="71" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="101" cy="85" r="2.6"/>
    <circle class="il-dark" cx="101" cy="85.4" r="1.17"/>
    <circle class="il-white il-ink il-thin" cx="107.4" cy="85" r="2.6"/>
    <circle class="il-dark" cx="107.4" cy="85.4" r="1.17"/>
    <path class="il-white il-ink il-thin" d="M100.6 89.6q3.6 4.4 7.2 0z"/>
    <ellipse class="il-pink" cx="98.4" cy="90" rx="1.6" ry="1" opacity="0.8"/>
    <ellipse class="il-pink" cx="110" cy="90" rx="1.6" ry="1" opacity="0.8"/>
    <g transform="translate(138 92) scale(-1.15 1.15)">
    <path class="il-line il-thin" d="M-2 2l-7 9M0 3l-1 10M2 2l7 9"/>
    <ellipse class="il-red il-ink" cx="-10" cy="-1" rx="8" ry="6"/>
    <path class="il-light il-thin" d="M-14 -4q3-2 6-2" opacity="0.6"/>
    <ellipse class="il-red il-ink" cx="0" cy="0" rx="4.5" ry="3.5"/>
    <circle class="il-red il-ink" cx="9" cy="-3" r="5.5"/>
    <path class="il-line il-thin" d="M11 -8q2-6 7-6M8 -8q0-6 4-8"/>
    <circle class="il-white il-ink il-thin" cx="11" cy="-4" r="2.3"/>
    <circle class="il-dark" cx="11.2" cy="-3.6" r="1.03"/>
    <path class="il-white il-ink il-thin" d="M9.6 0q2.4 2.4 4.8 0z"/>
    </g>
    <path class="il-line" d="M135 92l-22-5"/>
    <path class="il-red il-ink il-thin" d="M64 58.6c-8.8-5.5-9.9-13.2-4.95-13.2 2.75 0 4.4 2.2 4.95 4.4c0.55-2.2 2.2-4.4 4.95-4.4 4.95 0 3.85 7.7-4.95 13.2z"/>
    <path class="il-red il-ink il-thin" d="M96 48.4c-11.2-7-12.6-16.8-6.3-16.8 3.5 0 5.6 2.8 6.3 5.6c0.7-2.8 2.8-5.6 6.3-5.6 6.3 0 4.9 9.8-6.3 16.8z"/>
    <path class="il-red il-ink il-thin" d="M124 62c-8-5-9-12-4.5-12 2.5 0 4 2 4.5 4c0.5-2 2-4 4.5-4 4.5 0 3.5 7-4.5 12z"/>
    <path class="il-yellow il-ink il-thin" d="M84 59l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-white" d="M28 51.4l0.78 1.82 1.82 0.78-1.82 0.78-0.78 1.82-0.78-1.82-1.82-0.78 1.82-0.78z"/>`,

  // Split day and night: a sweaty bee in a headband uses all six legs at once - selling a honey jar and
  // pocketing a coin on the sunny side, threading a needle and holding a silk spool on the moonlit side.
  'bg.busy-bee': `
    <rect class="il-sky" x="0" y="0" width="80" height="120"/>
    <rect class="il-night" x="80" y="0" width="80" height="120"/>
    <circle class="il-yellow il-ink" cx="16" cy="16" r="9"/>
    <path class="il-line il-thin" d="M16 2v-2M2 16H0M30 16h2M6 6l-2-2M26 6l2-2" opacity="0.8"/>
    <circle class="il-paper il-ink il-thin" cx="144" cy="16" r="8"/>
    <circle class="il-night" cx="148" cy="13" r="7"/>
    <path class="il-white" d="M120 7.8l0.66 1.54 1.54 0.66-1.54 0.66-0.66 1.54-0.66-1.54-1.54-0.66 1.54-0.66z"/>
    <path class="il-white" d="M150 38l0.6 1.4 1.4 0.6-1.4 0.6-0.6 1.4-0.6-1.4-1.4-0.6 1.4-0.6z"/>
    <rect class="il-wood il-ink" x="0" y="96" width="50" height="6"/>
    <path class="il-wood-dark il-ink" d="M4 102h4v18H4zM40 102h4v18h-4z"/>
    <rect class="il-water il-ink il-thin" x="6" y="84" width="10" height="12" rx="3" opacity="0.85"/>
    <rect class="il-gold" x="8" y="88.8" width="6" height="5.2" rx="2"/>
    <rect class="il-red il-ink il-thin" x="5" y="80" width="12" height="5" rx="1.5"/>
    <path class="il-light il-thin" d="M9 87v3.5999999999999996" opacity="0.7"/>
    <rect class="il-water il-ink il-thin" x="20" y="86" width="9" height="10" rx="3" opacity="0.85"/>
    <rect class="il-gold" x="22" y="90" width="5" height="4" rx="2"/>
    <rect class="il-red il-ink il-thin" x="19" y="82" width="11" height="5" rx="1.5"/>
    <path class="il-light il-thin" d="M23 89v3" opacity="0.7"/>
    <path class="il-wood il-ink" d="M112 102h40l-4 16h-32z"/>
    <path class="il-line il-thin" d="M116 106h32M118 112h28" opacity="0.5"/>
    <path class="il-white il-ink il-thin" d="M118 102c4-8 12-6 14-2 4-4 10-4 12 2z"/>
    <g transform="translate(80 64) scale(2.3)">
    <ellipse class="il-white il-ink il-thin" cx="-8" cy="-6" rx="5" ry="8" transform="rotate(-35 -8 -6)" opacity="0.85"/>
    <ellipse class="il-white il-ink il-thin" cx="8" cy="-6" rx="5" ry="8" transform="rotate(35 8 -6)" opacity="0.85"/>
    <path class="il-line il-thin" d="M-6 -1l-8-4M6 -1l8-4M-7 5l-9 2M7 5l9 2M-4 12l-3 6M4 12l3 6"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="5" rx="7.5" ry="9"/>
    <path class="il-line il-thick" d="M-5 3h10M-4.4 8.6h8.8"/>
    <path class="il-dark il-ink il-thin" d="M-1.4 13.6l1.4 2.6 1.4-2.6z"/>
    <circle class="il-gold il-ink" cx="0" cy="-7" r="6"/>
    <rect class="il-red il-ink il-thin" x="-6.2" y="-11" width="12.4" height="2.4" rx="1"/>
    <path class="il-line il-thin" d="M-2 -12.6q-2-4-5-5M2 -12.6q2-4 5-5"/>
    <circle class="il-dark" cx="-7" cy="-17.6" r="1.1"/>
    <circle class="il-dark" cx="7" cy="-17.6" r="1.1"/>
    <circle class="il-white il-ink il-thin" cx="-2.4" cy="-7.4" r="2"/>
    <circle class="il-dark" cx="-3" cy="-7.4" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="2.4" cy="-7.4" r="2"/>
    <circle class="il-dark" cx="3" cy="-7.4" r="0.9"/>
    <path class="il-white il-ink il-thin" d="M-2.4 -3.6q2.4 2.6 4.8 0z"/>
    <path class="il-pink il-thin" d="M0.4 -2.6q1.2 1.6 2 0.4"/>
    </g>
    <rect class="il-water il-ink il-thin" x="34" y="44" width="12" height="14" rx="3" opacity="0.85"/>
    <rect class="il-gold" x="36" y="49" width="8" height="8" rx="2"/>
    <rect class="il-red il-ink il-thin" x="33" y="41" width="14" height="4" rx="1.5"/>
    <path class="il-gold il-ink il-thin" d="M36 45q-1 4 1 5 1-2 0-5z"/>
    <circle class="il-yellow il-ink" cx="38" cy="82" r="5"/>
    <circle class="il-gold" cx="38" cy="82" r="2.6"/>
    <path class="il-metal il-ink il-thin" d="M112 53l8-11 1 1-8 11z"/>
    <path class="il-light il-thin" d="M120.6 42.6c6 4 4 14-2 18s-4 12 0 16" opacity="0.9"/>
    <rect class="il-white il-ink il-thin" x="116" y="78" width="10" height="10" rx="1"/>
    <rect class="il-wood il-ink il-thin" x="114" y="76" width="14" height="3" rx="1"/>
    <rect class="il-wood il-ink il-thin" x="114" y="87" width="14" height="3" rx="1"/>
    <path class="il-line il-thin" d="M118 81h6M118 84h6" opacity="0.5"/>
    <path class="il-water il-ink il-thin" d="M106 26q-3 4 0 6 3-2 0-6zM56 24q-3 4 0 6 3-2 0-6z"/>
    <path class="il-line il-thin" d="M60 30l-4-2M102 32l4-2" opacity="0.6"/>`,
};
