/* Office illustrations: monsters1. */
export const OF_MONSTERS1: Readonly<Record<string, string>> = {
  // A furious orange stress ball grabs the hand that squeezes it with two stubby arms and pinches it; the hand panics.
  // A sticky note full of tally marks on the wall counts the squeezes so far.
  'of.stress-ball': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M0 100h160v20H0z"/>
    <path class="il-wood-dark" d="M0 100h160v4H0z"/>
    <g transform="rotate(-6 26 26)">
      <rect class="il-yellow il-ink" x="10" y="12" width="32" height="28" rx="1"/>
      <path class="il-line il-thin" d="M14 18v9M17 18v9M20 18v9M23 18v9M12 25l13-5M28 18v9M31 18v9M34 18v9M37 18v9M26 25l13-5M14 31v6M17 31v6M20 31v6"/>
    </g>
    <ellipse class="il-dark" opacity="0.25" cx="74" cy="102" rx="34" ry="4"/>
    <ellipse class="il-orange il-ink" cx="74" cy="76" rx="36" ry="26"/>
    <path class="il-light il-thin" d="M46 66c4-8 10-12 18-14"/>
    <path class="il-line il-thin" d="M48 88l2 1M98 84l-2 2M58 96l1-2M94 94l-2-2M44 78l2 0"/>
    <path class="il-line il-thick" d="M52 62l13 6M96 62l-13 6"/>
    <circle class="il-white il-ink" cx="62" cy="72" r="5.5"/><circle class="il-dark" cx="64" cy="73" r="2.6"/>
    <circle class="il-white il-ink" cx="86" cy="72" r="5.5"/><circle class="il-dark" cx="84" cy="73" r="2.6"/>
    <rect class="il-white il-ink" x="63" y="82" width="22" height="9" rx="2"/>
    <path class="il-line il-thin" d="M63 86.5h22M68.5 82v9M74 82v9M79.5 82v9"/>
    <g transform="translate(104 22) rotate(25)">
      <rect class="il-blue il-ink" x="-14" y="-24" width="28" height="18"/>
      <rect class="il-white il-ink" x="-15" y="-8" width="30" height="5"/>
      <rect class="il-skin il-ink" x="-13" y="8" width="5.6" height="15" rx="2.8" transform="rotate(14 -10 8)"/>
      <rect class="il-skin il-ink" x="-6.6" y="10" width="5.6" height="17" rx="2.8"/>
      <rect class="il-skin il-ink" x="-0.6" y="10" width="5.6" height="17" rx="2.8"/>
      <rect class="il-skin il-ink" x="5.6" y="8" width="5.6" height="15" rx="2.8" transform="rotate(-14 8 8)"/>
      <rect class="il-skin il-ink" x="10" y="0" width="5.6" height="14" rx="2.8" transform="rotate(-50 12 2)"/>
      <rect class="il-skin il-ink" x="-12" y="-3" width="24" height="17" rx="6"/>
    </g>
    <path class="il-orange il-ink" d="M56 56c2-14 14-28 28-36l4 5c-12 8-22 20-25 33z"/>
    <circle class="il-orange il-ink" cx="89" cy="22" r="5.5"/>
    <path class="il-orange il-ink" d="M100 60c6-8 10-18 11-27l6 1c-1 10-5 20-11 29z"/>
    <circle class="il-orange il-ink" cx="113" cy="32" r="5.5"/>
    <path class="il-line il-thin" d="M66 54l3-4M80 52l1-4M90 54l2-3M84 14l-3-3M119 24l3-4"/>
    <path class="il-yellow il-ink il-thin" d="M132 4l2 5 5 .5-4 3 1 5-4-2.5-4 2.5 1-5-4-3 5-.5z"/>
    <path class="il-line il-thin" d="M140 26l8 2M128 50l6 4M74 30l-7 0M76 38l-6 2"/>
    <ellipse class="il-water il-ink il-thin" cx="80" cy="8" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="130" cy="40" rx="2" ry="3"/>`,

  // A grumpy goldfish in its bowl squints and points a fin at a sticky note on the wall: three faces, two crossed out —
  // the colleagues who never fed it. The fish-food tin lies empty on its side.
  'of.goldfish': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 20h24M0 50h20M132 60h28M138 86h22"/>
    <path class="il-wood il-ink" d="M0 104h160v16H0z"/>
    <path class="il-wood-dark" d="M0 104h160v3H0z"/>
    <g transform="rotate(5 140 26)">
      <rect class="il-yellow il-ink" x="124" y="10" width="30" height="32" rx="1"/>
      <circle class="il-red il-ink il-thin" cx="139" cy="12" r="2.4"/>
      <circle class="il-line il-thin" cx="131" cy="21" r="3"/><path class="il-line il-thin" d="M126 29q5-5 10 0"/>
      <circle class="il-line il-thin" cx="147" cy="21" r="3"/><path class="il-line il-thin" d="M142 29q5-5 10 0"/>
      <circle class="il-line il-thin" cx="139" cy="33" r="3"/><path class="il-line il-thin" d="M134 41q5-5 10 0"/>
      <path class="il-line" d="M127 17l9 10M136 17l-9 10M143 17l9 10M152 17l-9 10"/>
    </g>
    <ellipse class="il-dark" opacity="0.2" cx="78" cy="104" rx="36" ry="3"/>
    <path class="il-water" opacity="0.6" d="M38 46h80c4 6 6 14 6 22 0 20-18 34-46 34S32 88 32 68c0-8 2-16 6-22z"/>
    <path class="il-light il-thin" d="M38 46q5-3 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0"/>
    <circle class="il-stone il-ink il-thin" cx="62" cy="98" r="3"/><circle class="il-pink il-ink il-thin" cx="70" cy="99" r="2.6"/>
    <circle class="il-stone il-ink il-thin" cx="78" cy="99" r="3"/><circle class="il-teal il-ink il-thin" cx="86" cy="98" r="2.6"/>
    <circle class="il-stone il-ink il-thin" cx="94" cy="98" r="2.6"/>
    <path class="il-green il-ink il-thin" d="M50 96c-2-8 2-14 0-22 4 6 4 14 2 22zM56 96c2-6 0-12 4-16 0 6 0 12-2 16z"/>
    <path class="il-orange il-ink" d="M56 68 42 56l4 12-4 12z"/>
    <path class="il-line il-thin" d="M46 62l6 5M46 74l6-5"/>
    <path class="il-orange il-ink" d="M62 58c4-8 14-8 16-1z"/>
    <ellipse class="il-orange il-ink" cx="74" cy="68" rx="20" ry="13"/>
    <path class="il-line il-thin" d="M62 64q3 4 0 8M68 62q3 6 0 12"/>
    <path class="il-orange il-ink" d="M76 74l16 2-12 7z"/>
    <circle class="il-white il-ink" cx="84" cy="65" r="5.5"/><circle class="il-dark" cx="86" cy="66" r="2.6"/>
    <path class="il-orange il-ink il-thin" d="M78.5 65a5.5 5.5 0 0 1 11 0z"/>
    <path class="il-line il-thick" d="M77 58l13 3"/>
    <path class="il-line" d="M93 73q-3-2-6 0"/>
    <path class="il-light il-thin" d="M66 63q4-3 8-1"/>
    <circle class="il-white il-ink il-thin" cx="96" cy="58" r="2"/><circle class="il-white il-ink il-thin" cx="100" cy="51" r="1.5"/>
    <path class="il-line" d="M54 32h48c14 10 22 22 22 36 0 20-18 34-46 34S32 88 32 68c0-14 8-26 22-36z"/>
    <ellipse class="il-line" cx="78" cy="32" rx="24" ry="3"/>
    <path class="il-light" d="M40 60c0-8 4-14 8-18M42 74v6"/>
    <g transform="rotate(-80 18 98)">
      <rect class="il-red il-ink" x="8" y="90" width="20" height="16" rx="2"/>
      <path class="il-white il-ink il-thin" d="M8 95h20v6H8z"/>
      <rect class="il-metal il-ink il-thin" x="6" y="88" width="24" height="3" rx="1"/>
    </g>
    <path class="il-gold il-ink il-thin" d="M30 102l3-1 1 2z"/>
    <ellipse class="il-water il-ink il-thin" cx="128" cy="100" rx="4" ry="1.5"/><ellipse class="il-water il-ink il-thin" cx="138" cy="102" rx="2.6" ry="1"/>`,

  // A grinning sheet ghost swirls out of a glowing monitor, waving a golden trophy and pointing at a big flashing red
  // button with an exclamation mark — the mouse cursor already hovers over it. Envelopes on the screen, sparks around.
  'of.spam-ghost': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <rect class="il-dark il-ink" opacity="0.6" x="118" y="70" width="34" height="34"/>
    <path class="il-wood il-ink" d="M0 106h160v14H0z"/>
    <path class="il-metal il-ink" d="M72 98h16l2 8H70z"/><path class="il-metal il-ink" d="M62 106h36v3H62z"/>
    <rect class="il-dark il-ink" x="26" y="50" width="108" height="50" rx="4"/>
    <rect class="il-teal" x="31" y="55" width="98" height="40"/>
    <g class="il-white il-ink il-thin">
      <rect x="36" y="60" width="14" height="10"/><rect x="36" y="80" width="14" height="10"/><rect x="110" y="80" width="14" height="10"/>
    </g>
    <path class="il-line il-thin" d="M36 60l7 5 7-5M36 80l7 5 7-5M110 80l7 5 7-5"/>
    <path class="il-white il-ink" opacity="0.9" d="M62 94c-6-12-10-26-10-42 0-22 12-38 28-38s28 16 28 38c0 16-4 30-10 42-3-4-5-6-7-6s-4 6-6 6-4-6-6-6-4 6-6 6-4-6-6-6c-2 0-4 2-5 6z"/>
    <path class="il-light il-thin" d="M58 40c2-10 8-18 16-20"/>
    <path class="il-line" d="M66 30l7 3M94 30l-7 3"/>
    <ellipse class="il-dark" cx="71" cy="40" rx="4" ry="6"/><ellipse class="il-dark" cx="89" cy="40" rx="4" ry="6"/>
    <circle class="il-white" cx="72" cy="38" r="1.4"/><circle class="il-white" cx="90" cy="38" r="1.4"/>
    <path class="il-dark il-ink" d="M66 52q14 18 28 0z"/>
    <path class="il-pink" d="M74 60q6-4 12 0q-6 5-12 0z"/>
    <path class="il-white il-ink" d="M55 60c-10-2-16-8-18-18l7-2c2 8 6 12 13 13z"/>
    <path class="il-gold il-ink" d="M27 16h22c0 11-5 18-11 18s-11-7-11-18z"/>
    <path class="il-line il-thin" d="M27 19c-6 0-6 8 1 9M49 19c6 0 6 8-1 9"/>
    <path class="il-gold il-ink il-thin" d="M36 34h4v4h-4zM32 38h12v4H32z"/>
    <path class="il-light il-thin" d="M31 20c0 4 2 8 4 9"/>
    <path class="il-white il-ink" d="M105 60c10-2 17-8 21-15l6 3c-5 9-13 16-25 18z"/>
    <circle class="il-light il-thin il-dash" cx="140" cy="28" r="15"/>
    <circle class="il-red il-ink" cx="140" cy="28" r="10"/>
    <rect class="il-white" x="138.5" y="21" width="3" height="9" rx="1"/><circle class="il-white" cx="140" cy="33.5" r="1.7"/>
    <polygon class="il-white il-ink il-thin" points="146 36 146 52 150 48 153 55 156 54 153 47 158 47"/>
    <path class="il-yellow il-ink il-thin" d="M16 6l1.5 4 4 .4-3 2.6 1 4-3.5-2.2-3.5 2.2 1-4-3-2.6 4-.4zM56 4l1 3 3 .3-2.3 2 .8 3-2.5-1.6-2.5 1.6.8-3-2.3-2 3-.3z"/>
    <path class="il-yellow il-ink il-thin" d="M18 58l-6 8h5l-4 8 9-10h-5l4-6zM146 60l-5 7h4l-3 7 8-9h-4l3-5z"/>`,

  // A gold-based bobblehead boss in a suit vigorously shakes his oversized head "no" (motion arcs and ghost heads)
  // at the laptop beside him, whose screen shows a little house — working from home.
  'of.bobblehead-boss': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="112" y="8" width="40" height="30"/>
    <path class="il-line il-thin" d="M132 8v30M112 23h40"/>
    <path class="il-white" d="M116 18c0-3 4-4 6-2 1-3 6-3 7 0 3 0 3 3 0 3h-12z"/>
    <path class="il-wood il-ink" d="M0 102h160v18H0z"/>
    <path class="il-wood-dark" d="M0 102h160v3H0z"/>
    <ellipse class="il-skin" opacity="0.3" cx="56" cy="40" rx="30" ry="25"/>
    <ellipse class="il-skin" opacity="0.3" cx="84" cy="40" rx="30" ry="25"/>
    <path class="il-line" d="M30 28q-7 12 0 24M22 32q-5 8 0 16M110 28q7 12 0 24M118 32q5 8 0 16"/>
    <path class="il-gold il-ink" d="M44 94h52l2 8H42z"/>
    <path class="il-light il-thin" d="M48 97h10"/>
    <path class="il-blue il-ink" d="M54 95c0-14 6-22 16-22s16 8 16 22z"/>
    <path class="il-white il-ink il-thin" d="M64 74l6 9 6-9z"/>
    <path class="il-red il-ink il-thin" d="M68.5 77h3l1.5 12-3 3-3-3z"/>
    <path class="il-line il-thin" d="M58 84l4 10M82 84l-4 10"/>
    <path class="il-line" d="M70 73l-4-2 8-2-8-2 8-2-4-2"/>
    <circle class="il-skin il-ink" cx="41" cy="42" r="5"/><circle class="il-skin il-ink" cx="99" cy="42" r="5"/>
    <ellipse class="il-skin il-ink" cx="70" cy="40" rx="29" ry="25"/>
    <path class="il-grey il-ink" d="M44 30c8-12 34-16 50-6-14-3-34-1-50 6z"/>
    <path class="il-light" d="M50 26c4-4 10-7 16-8"/>
    <path class="il-line il-thick" d="M52 32l12 5M88 32l-12 5"/>
    <circle class="il-white il-ink" cx="60" cy="41" r="5"/><circle class="il-dark" cx="61" cy="42" r="2.4"/>
    <circle class="il-white il-ink" cx="80" cy="41" r="5"/><circle class="il-dark" cx="79" cy="42" r="2.4"/>
    <path class="il-grey il-ink il-thin" d="M62 52c4-3 12-3 16 0-4 2-12 2-16 0z"/>
    <path class="il-line" d="M63 59q7-5 14 0"/>
    <path class="il-white" d="M40 76l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5zM104 20l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/>
    <path class="il-metal il-ink" d="M106 102l4-5h38l4 5z"/>
    <rect class="il-dark il-ink" x="110" y="68" width="38" height="29" rx="2"/>
    <rect class="il-sky" x="113" y="71" width="32" height="23"/>
    <path class="il-white il-ink il-thin" d="M120 90v-8l9-7 9 7v8z"/>
    <rect class="il-red il-ink il-thin" x="127" y="84" width="4" height="6"/>`,

  // A smug living coffee stain spreads over the office carpet, a speckle of carpet pattern already inside it; it hugs
  // a pair of sneakers that are sinking into it. The tipped-over mug that started it all lies by the wall.
  'of.coffee-stain': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-grey" x="0" y="46" width="160" height="74"/>
    <path class="il-wood-dark il-ink" d="M0 44h160v5H0z"/>
    <path class="il-light il-thin" opacity="0.3" d="M6 56l4 2M24 54l4 2M44 58l4 2M140 56l4 2M120 54l4 2M8 110l4 2M150 108l4 2M140 116l4 2M20 118l4 2M150 70l4 2M4 74l4 2"/>
    <rect class="il-line il-thin" opacity="0.4" x="104" y="10" width="40" height="28"/>
    <path class="il-line il-thin" opacity="0.4" d="M108 30l10-10 8 8 6-6 8 8"/>
    <path class="il-wood-dark il-ink" d="M14 90c-6-10 6-22 22-20 6-8 22-10 32-4 10-6 30-6 40 0 12-4 30 0 32 10 12 4 12 16 2 20 4 10-10 16-24 12-10 6-30 6-40 2-12 6-34 4-40-4-14 2-28-6-24-16z"/>
    <path class="il-wood" opacity="0.45" d="M28 88c0-8 12-12 22-10 10-6 26-6 34 0 10-2 22 2 22 8"/>
    <path class="il-light il-thin" d="M30 82c4-4 10-5 16-4M120 102c4 0 8-2 10-4"/>
    <path class="il-light il-thin" opacity="0.4" d="M86 104l4 2M100 98l4 2"/>
    <circle class="il-white il-ink" cx="54" cy="84" r="6"/><circle class="il-dark" cx="57" cy="85" r="2.8"/>
    <circle class="il-white il-ink" cx="74" cy="84" r="6"/><circle class="il-dark" cx="77" cy="85" r="2.8"/>
    <path class="il-line" d="M46 76l9 3M82 76l-8 3"/>
    <path class="il-dark il-ink" d="M50 94q16 12 32 0z"/>
    <path class="il-white" d="M56 95h20l-2 3h-16z"/>
    <g transform="translate(22 -6)">
    <path class="il-red il-ink" d="M100 92c0-9 2-14 8-14 3 0 5 1 7 3 4 2 10 3 15 5 4 2 6 4 6 6z"/>
    <ellipse class="il-dark il-ink il-thin" cx="108" cy="79.5" rx="5" ry="1.8"/>
    <path class="il-white il-ink il-thin" d="M112 86l4-4M117 87l4-4M122 88l4-3"/>
    <path class="il-white il-ink il-thin" d="M100 88c0 2 1 4 2 4"/>
    </g>
    <g>
    <path class="il-red il-ink" d="M100 92c0-9 2-14 8-14 3 0 5 1 7 3 4 2 10 3 15 5 4 2 6 4 6 6z"/>
    <ellipse class="il-dark il-ink il-thin" cx="108" cy="79.5" rx="5" ry="1.8"/>
    <path class="il-white il-ink il-thin" d="M112 86l4-4M117 87l4-4M122 88l4-3"/>
    <path class="il-white il-ink il-thin" d="M100 88c0 2 1 4 2 4"/>
    </g>
    <path class="il-light il-thin" d="M98 94c6 3 30 3 40 0M120 88c6 2 14 2 20 0"/>
    <circle class="il-wood il-ink il-thin" cx="98" cy="88" r="1.6"/><circle class="il-wood il-ink il-thin" cx="104" cy="82" r="1.2"/>
    <circle class="il-wood il-ink il-thin" cx="142" cy="78" r="2"/><circle class="il-wood il-ink il-thin" cx="148" cy="72" r="1.4"/><circle class="il-wood il-ink il-thin" cx="108" cy="76" r="1.6"/>
    <rect class="il-white il-ink" x="10" y="52" width="24" height="16" rx="2"/>
    <path class="il-line" d="M16 52c0-6 12-6 12 0"/>
    <ellipse class="il-wood-dark il-ink il-thin" cx="34" cy="60" rx="2" ry="7"/>
    <path class="il-wood-dark il-ink il-thin" d="M34 64c4 2 4 6 2 8l-4 0c0-3 2-4 2-8z"/>
    <path class="il-line il-thin" d="M14 58h6M14 62h4"/>`,

  // A red-green parrot on top of the cubicle wall squawks loudly; its speech bubble shows a doodle of the boss with
  // little devil horns. Behind the next partition, the colleague who said it clutches their face in horror.
  'of.open-plan-parrot': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-grey il-ink" x="104" y="88" width="56" height="32"/>
    <path class="il-skin il-ink" d="M118 88c0-12 6-18 14-18s14 6 14 18z"/>
    <path class="il-wood-dark il-ink il-thin" d="M118 82c0-10 6-14 14-14s14 4 14 14c-4-6-8-8-14-8s-10 2-14 8z"/>
    <ellipse class="il-white il-ink il-thin" cx="127" cy="80" rx="3" ry="3.6"/><circle class="il-dark" cx="127" cy="80" r="1.5"/>
    <ellipse class="il-white il-ink il-thin" cx="137" cy="80" rx="3" ry="3.6"/><circle class="il-dark" cx="137" cy="80" r="1.5"/>
    <ellipse class="il-dark" cx="132" cy="86" rx="2" ry="1.6"/>
    <ellipse class="il-skin il-ink" cx="119" cy="86" rx="4" ry="6"/><ellipse class="il-skin il-ink" cx="145" cy="86" rx="4" ry="6"/>
    <ellipse class="il-water il-ink il-thin" cx="149" cy="72" rx="2" ry="3"/>
    <path class="il-metal il-ink" d="M102 86h58v4h-58z"/>
    <path class="il-blue il-ink" d="M44 70l-6 30 8-2 6-26z"/>
    <path class="il-yellow il-ink il-thin" d="M50 72l2 26 6-2-2-24z"/>
    <rect class="il-grey il-ink" x="0" y="76" width="100" height="44"/>
    <path class="il-line il-thin" opacity="0.4" d="M10 84v30M30 84v30M50 84v30M70 84v30M90 84v30"/>
    <path class="il-metal il-ink" d="M0 72h100v6H0z"/>
    <ellipse class="il-red il-ink" cx="50" cy="54" rx="14" ry="20" transform="rotate(12 50 54)"/>
    <path class="il-green il-ink" d="M42 44c-8 6-10 18-6 28l14-4c-2-8-4-16-8-24z"/>
    <path class="il-blue il-ink il-thin" d="M37 66l12-3M38 70l12-3"/>
    <path class="il-grey il-ink il-thin" d="M46 72l-2 4M48 72v4M54 72l-2 4M56 72v4"/>
    <circle class="il-red il-ink" cx="58" cy="30" r="13"/>
    <path class="il-yellow il-ink il-thin" d="M50 18c2-6 8-8 12-6-4 1-6 3-6 6z"/>
    <ellipse class="il-white il-ink il-thin" cx="62" cy="27" rx="5" ry="6"/>
    <circle class="il-dark" cx="63" cy="27" r="2.4"/><circle class="il-white" cx="64" cy="26" r="0.8"/>
    <path class="il-line" d="M57 20l9 2"/>
    <path class="il-dark il-ink" d="M68 30c8-2 12 4 10 10-2-4-6-5-10-4z"/>
    <path class="il-white il-ink il-thin" d="M68 36c4 0 6 2 7 5-3 1-6 1-8-1z"/>
    <path class="il-line il-thin" d="M82 24l6-4M84 32h7M82 40l6 3"/>
    <path class="il-white il-ink" d="M100 4h52c4 0 6 2 6 6v34c0 4-2 6-6 6h-38l-18 8 6-8h-2c-4 0-6-2-6-6V10c0-4 2-6 6-6z"/>
    <path class="il-red il-ink il-thin" d="M114 16l-3-8 7 5zM134 16l3-8-7 5z"/>
    <ellipse class="il-skin il-ink" cx="124" cy="24" rx="11" ry="10"/>
    <path class="il-line il-thin" d="M118 20l4 2M130 20l-4 2M120 30q4-3 8 0"/>
    <circle class="il-dark" cx="120" cy="24" r="1.4"/><circle class="il-dark" cx="128" cy="24" r="1.4"/>
    <path class="il-blue il-ink il-thin" d="M114 44c0-6 4-10 10-10s10 4 10 10z"/>
    <path class="il-red il-ink il-thin" d="M122.5 34h3l1 7-2.5 3-2.5-3z"/>
    <path class="il-line il-thin" d="M140 22l3 3 3-3 3 3 3-3M140 32l3 3 3-3 3 3 3-3"/>`,

  // The predecessor's prickly-pear cactus still sits on her desk wearing her reading glasses and pearl necklace,
  // smirking, every spine bristling; a faded farewell card with a heart lies beside the pot under a cobweb.
  'of.predecessor-cactus': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 0l20 20M0 10l14 4M10 0l4 14M3 12q4-2 5-8M6 18q8-4 10-12"/>
    <rect class="il-white il-ink" x="122" y="10" width="28" height="26"/>
    <path class="il-red" d="M122 10h28v6h-28z"/>
    <path class="il-line il-thin" d="M126 20h4M133 20h4M140 20h4M126 25h4M133 25h4M140 25h4M126 30h4M133 30h4"/>
    <path class="il-wood il-ink" d="M0 100h160v20H0z"/>
    <path class="il-wood-dark" d="M0 100h160v3H0z"/>
    <path class="il-earth il-ink" d="M54 82h52l-5 20H59z"/>
    <path class="il-earth-dark il-ink" d="M50 78h60v7H50z"/>
    <ellipse class="il-green il-ink" cx="46" cy="44" rx="11" ry="15" transform="rotate(-30 46 44)"/>
    <ellipse class="il-green il-ink" cx="114" cy="42" rx="11" ry="15" transform="rotate(30 114 42)"/>
    <ellipse class="il-green il-ink" cx="80" cy="54" rx="27" ry="28"/>
    <path class="il-line il-thin" d="M66 32q-4 22 0 44M94 32q4 22 0 44"/>
    <path class="il-line il-thin" d="M56 40l-5-3M54 54l-6 0M57 68l-5 3M104 40l5-3M106 54l6 0M103 68l5 3M70 28l-2-5M90 28l2-5M80 26v-6M40 34l-4-4M36 46l-6 0M44 30l-2-5M120 32l4-4M124 44l6 0M116 28l2-5"/>
    <path class="il-pink il-ink il-thin" d="M80 26c-6-6-2-12 0-8 2-4 6 2 0 8zM80 26c-6-2-8 4-2 4M80 26c6-2 8 4 2 4"/>
    <circle class="il-yellow" cx="80" cy="24" r="1.6"/>
    <circle class="il-white il-ink" cx="70" cy="50" r="5"/><circle class="il-white il-ink" cx="90" cy="50" r="5"/>
    <path class="il-green il-ink il-thin" d="M65 50a5 5 0 0 1 10 0zM85 50a5 5 0 0 1 10 0z"/>
    <circle class="il-dark" cx="71" cy="52" r="2"/><circle class="il-dark" cx="91" cy="52" r="2"/>
    <circle class="il-line" cx="70" cy="51" r="7.5"/><circle class="il-line" cx="90" cy="51" r="7.5"/>
    <path class="il-line" d="M77.5 50h5M62.5 49l-6-3M97.5 49l6-3"/>
    <path class="il-line" d="M72 63q8 4 14-3"/>
    <g class="il-white il-ink il-thin">
      <circle cx="62" cy="66" r="2"/><circle cx="66" cy="70" r="2"/><circle cx="71" cy="73" r="2"/><circle cx="76" cy="74.5" r="2"/>
      <circle cx="81" cy="75" r="2"/><circle cx="86" cy="74.5" r="2"/><circle cx="91" cy="73" r="2"/><circle cx="96" cy="70" r="2"/><circle cx="100" cy="66" r="2"/>
    </g>
    <path class="il-paper il-ink" d="M116 100l4-16 22 4-4 12z"/>
    <path class="il-paper il-ink" d="M116 100l-6-14 10-2z"/>
    <path class="il-red" d="M128 92c-3-2-3-5-1-5.5 1-.3 1.4.3 1.6 1 .4-.7 1-1.2 2-.8 1.5 1 .4 4-2.6 5.3z"/>
    <circle class="il-grey" cx="22" cy="104" r="1"/><circle class="il-grey" cx="34" cy="108" r="1"/><circle class="il-grey" cx="146" cy="106" r="1"/>`,

  // An ancient, sleepy mole with half-closed eyes, round glasses, white bushy brows and a miner's headlamp pops out of a
  // mountain of files in the basement archive, a folder in its claws; it holds a claw up: quiet, filing in progress.
  'of.archive-mole': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-wood-dark il-ink" d="M0 34h44v4H0zM116 34h44v4h-44zM0 66h30v4H0zM130 66h30v4h-30z"/>
    <g class="il-ink il-thin">
      <rect class="il-blue" x="4" y="14" width="7" height="20"/><rect class="il-red" x="12" y="16" width="7" height="18"/><rect class="il-grey" x="20" y="14" width="7" height="20"/>
      <rect class="il-yellow" x="28" y="18" width="7" height="16"/><rect class="il-teal" x="120" y="14" width="7" height="20"/><rect class="il-blue" x="128" y="16" width="7" height="18"/>
      <rect class="il-grey" x="136" y="14" width="7" height="20"/><rect class="il-red" x="144" y="18" width="7" height="16"/>
      <rect class="il-paper" x="4" y="50" width="20" height="16"/><rect class="il-paper" x="134" y="50" width="20" height="16"/>
    </g>
    <path class="il-light il-thin" d="M7 28h1M15 28h1M23 28h1M123 28h1M131 28h1M139 28h1"/>
    <path class="il-line il-thin" d="M118 0c4 8 10 10 14 8M124 0v4M136 0c-2 4-4 6-8 6"/>
    <path class="il-torch" d="M88 36l60-24v36z"/>
    <path class="il-paper il-ink" d="M2 120c4-20 20-36 40-40 12-12 28-16 38-14 14-2 28 4 40 14 20 4 34 20 38 40z"/>
    <path class="il-yellow il-ink il-thin" d="M14 108l20-6 4 10-20 6zM118 100l18 4-2 10-18-4zM56 112l24-2 1 8H56z"/>
    <path class="il-line il-thin" d="M20 98h14M24 92l10-2M118 90l14 4M96 108h14M40 118h10M126 118l10-2"/>
    <path class="il-grey il-ink" d="M60 82c-2-20 6-34 20-34s22 14 20 34z"/>
    <path class="il-dark" d="M58 82c6-6 38-6 44 0z"/>
    <path class="il-line il-thin" d="M66 70l3 1M92 66l-3 2M72 78l2-2"/>
    <rect class="il-dark il-ink il-thin" x="72" y="44" width="16" height="6" rx="2"/>
    <circle class="il-gold il-ink" cx="88" cy="40" r="5"/><circle class="il-glow" cx="89" cy="39" r="2.4"/>
    <path class="il-white il-ink il-thin" d="M64 54c4-4 9-4 12-1-4 0-8 1-12 3zM96 54c-4-4-9-4-12-1 4 0 8 1 12 3z"/>
    <circle class="il-white il-ink" cx="72" cy="60" r="5"/><circle class="il-white il-ink" cx="88" cy="60" r="5"/>
    <path class="il-grey il-ink il-thin" d="M67 60a5 5 0 0 1 10 0zM83 60a5 5 0 0 1 10 0z"/>
    <circle class="il-dark" cx="72" cy="61.5" r="1.6"/><circle class="il-dark" cx="88" cy="61.5" r="1.6"/>
    <circle class="il-line il-thin" cx="72" cy="60" r="6.5"/><circle class="il-line il-thin" cx="88" cy="60" r="6.5"/>
    <path class="il-line il-thin" d="M78.5 60h3"/>
    <ellipse class="il-pink il-ink" cx="80" cy="70" rx="5" ry="3.6"/>
    <path class="il-white il-ink il-thin" d="M70 74c4 10 16 10 20 0-6 3-14 3-20 0z"/>
    <path class="il-yellow il-ink" d="M98 70l26-6 4 16-26 6z"/>
    <path class="il-yellow il-ink il-thin" d="M98 70l8-4 8 2"/>
    <path class="il-paper il-ink il-thin" d="M102 74l20-5 1 4-20 5z"/>
    <path class="il-pink il-ink" d="M96 72c4-2 8 0 8 4 0 4-4 6-8 4z"/>
    <path class="il-grey il-ink" d="M64 76c-5-4-8-9-8-14l6-1c0 4 2 8 6 11z"/>
    <path class="il-white il-ink il-thin" d="M51 53l-2-6 4 4zM55 51l0-7 2 7zM59 51l2-6 0 6zM62 54l4-3-2 5z"/>
    <ellipse class="il-pink il-ink" cx="57" cy="58" rx="6.4" ry="7"/>
    <path class="il-white il-ink il-thin" d="M30 52l8-4 4 6-8 4zM128 56l8 2-2 7-8-2z"/>
    <path class="il-line il-thin" d="M104 44l4-4 4 4M112 40l3-3 3 3"/>`,

  // Close-up of a keyboard: two keys are missing and in the gap lives a happy round beetle munching a biscuit bigger
  // than its head; crumbs everywhere, and the cable next to it has bite marks and sparks.
  'of.crumb-beetle': `
    <rect class="il-dark" x="0" y="0" width="160" height="120"/>
    <g class="il-white il-ink">
      <rect x="-12" y="4" width="28" height="24" rx="3"/><rect x="20" y="4" width="28" height="24" rx="3"/><rect x="52" y="4" width="28" height="24" rx="3"/>
      <rect x="84" y="4" width="28" height="24" rx="3"/><rect x="116" y="4" width="28" height="24" rx="3"/><rect x="148" y="4" width="28" height="24" rx="3"/>
      <rect x="4" y="32" width="28" height="24" rx="3"/><rect x="36" y="32" width="28" height="24" rx="3"/>
      <rect x="132" y="32" width="28" height="24" rx="3"/>
      <rect x="-4" y="60" width="28" height="24" rx="3"/><rect x="28" y="60" width="28" height="24" rx="3"/>
      <rect x="124" y="60" width="28" height="24" rx="3"/>
    </g>
    <path class="il-light il-thin" d="M24 8h8M56 8h8M88 8h8M120 8h8M8 36h8M40 36h8M136 36h8M0 64h8M32 64h8M128 64h8"/>
    <rect class="il-cave il-ink" x="68" y="32" width="60" height="52" rx="3"/>
    <path class="il-line il-thin" d="M98 32v6"/>
    <path class="il-gold il-ink il-thin" d="M72 78l3-2 2 3zM118 80l3-3 2 3zM110 78l2-1 1 2zM78 82l2-2 1 2zM124 74l2-2 1 2z"/>
    <path class="il-gold il-ink il-thin" d="M30 92l4-2 1 4zM140 96l3-3 2 3zM60 104l3-1 0 3z"/>
    <path class="il-line" d="M88 68l-8-3M88 74l-9 2M88 80l-7 5M112 68l8-3M112 74l9 2M112 80l7 5"/>
    <ellipse class="il-teal il-ink" cx="100" cy="72" rx="15" ry="12"/>
    <path class="il-line" d="M100 62v22"/>
    <path class="il-light il-thin" d="M90 68c1-3 4-5 7-5M104 64c3 0 5 2 6 4"/>
    <path class="il-line il-thin" d="M95 44c-2-5-6-7-9-5M105 44c2-5 6-7 9-5"/>
    <circle class="il-teal il-ink il-thin" cx="85.5" cy="39.5" r="1.8"/><circle class="il-teal il-ink il-thin" cx="114.5" cy="39.5" r="1.8"/>
    <ellipse class="il-teal il-ink" cx="100" cy="53" rx="12" ry="10"/>
    <circle class="il-white il-ink" cx="95" cy="51" r="4.5"/><circle class="il-dark" cx="94" cy="52" r="2"/><circle class="il-white" cx="95" cy="50.6" r="0.8"/>
    <circle class="il-white il-ink" cx="105" cy="51" r="4.5"/><circle class="il-dark" cx="104" cy="52" r="2"/><circle class="il-white" cx="105" cy="50.6" r="0.8"/>
    <ellipse class="il-teal il-ink il-thin" cx="92" cy="58" rx="3" ry="2.4"/><ellipse class="il-teal il-ink il-thin" cx="108" cy="58" rx="3" ry="2.4"/>
    <path class="il-line il-thin" d="M96 58q4 3 8 0"/>
    <path class="il-gold" d="M98 61l2-1 1 2zM103 60l1 2-2 0z"/>
    <circle class="il-gold il-ink" cx="77" cy="63" r="10"/>
    <circle class="il-cave" cx="85" cy="56" r="3.6"/><circle class="il-cave" cx="87.4" cy="61" r="3"/>
    <circle class="il-wood-dark" cx="73" cy="60" r="1.4"/><circle class="il-wood-dark" cx="78" cy="67" r="1.4"/><circle class="il-wood-dark" cx="72" cy="67" r="1.2"/><circle class="il-wood-dark" cx="79" cy="58" r="1.1"/>
    <path class="il-teal il-ink" d="M89 66c-2 0-4 0-5 1l1 4c2-1 4-1 5-1z"/>
    <ellipse class="il-teal il-ink il-thin" cx="85" cy="69" rx="3.4" ry="2.8"/>
    <path class="il-grey il-ink" d="M0 100c30-6 50 6 70 2s30-10 44-8l6 8c-14-2-24 6-44 10S30 104 0 110z"/>
    <path class="il-metal il-ink il-thin" d="M114 94l3 3-3 2 3 2-2 2"/>
    <path class="il-yellow il-ink il-thin" d="M126 92l-4 6h4l-3 6 8-8h-4l3-4zM132 106l-3 3 4 1-2 4"/>
    <path class="il-line il-thin" d="M50 66l4 2M48 72h5"/>`,

  // The team bonsai sits in an overflowing, flooded tray wearing a red-white life ring, absolutely furious, while a
  // watering can, a mug and a glass all pour water onto it at once from three sides.
  'of.team-bonsai': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M0 98h160v22H0z"/>
    <path class="il-wood-dark" d="M0 98h160v3H0z"/>
    <path class="il-water il-ink il-thin" d="M30 100c4-2 14-2 20 0h60c6-2 16-2 20 0 6 2 6 6-2 6H34c-8 0-10-4-4-6z"/>
    <path class="il-earth-dark il-ink" d="M42 84h76l-4 14H46z"/>
    <path class="il-water il-ink il-thin" d="M44 84h72c0-4-8-6-36-6s-36 2-36 6z"/>
    <path class="il-water il-ink il-thin" d="M44 86c-2 4-2 8-4 12 3 0 4-6 4-12zM116 86c2 4 2 8 4 12-3 0-4-6-4-12z"/>
    <path class="il-wood-dark il-ink" d="M66 84c5-2 8-6 8-10 0-6-6-10-4-18l2-10h10l-2 10c-2 8 4 12 4 18 0 4 3 8 8 10z"/>
    <path class="il-line il-thin" d="M76 80c-1-4 0-6 1-8M80 66c1-3 0-6-1-8"/>
    <ellipse class="il-red il-ink" cx="78" cy="74" rx="14" ry="5"/>
    <ellipse class="il-dark" cx="78" cy="74" rx="6" ry="2"/>
    <path class="il-white il-ink il-thin" d="M66 71l4 0 0 5-4 0zM86 71l4 0 0 5-4 0z"/>
    <path class="il-green il-ink" d="M38 54c-6 0-8-8-2-10 0-6 8-8 12-4 4-4 12-2 12 4 6 0 6 10 0 10z"/>
    <path class="il-green il-ink" d="M98 50c-6 0-8-8-2-10 0-6 8-8 12-4 4-4 12-2 12 4 6 0 6 10 0 10z"/>
    <path class="il-wood-dark il-ink il-thin" d="M60 50l14 8M98 48l-14 10"/>
    <path class="il-green il-ink" d="M56 52c-8 0-10-12-2-14 0-10 12-14 20-8 6-6 18-4 20 4 8 0 10 12 0 16 0 4-4 6-10 4-6 4-16 4-20 0-4 2-8 2-8-2z"/>
    <path class="il-line il-thick" d="M62 36l10 5M94 36l-10 5"/>
    <circle class="il-white il-ink" cx="70" cy="44" r="4.5"/><circle class="il-dark" cx="71" cy="45" r="2.2"/>
    <circle class="il-white il-ink" cx="86" cy="44" r="4.5"/><circle class="il-dark" cx="85" cy="45" r="2.2"/>
    <path class="il-line" d="M70 54q8-6 16 0"/>
    <ellipse class="il-water il-ink il-thin" cx="62" cy="50" rx="1.6" ry="2.4"/><ellipse class="il-water il-ink il-thin" cx="96" cy="54" rx="1.6" ry="2.4"/>
    <path class="il-green il-ink" d="M2 18h20v16H2z"/>
    <path class="il-green il-ink" d="M22 22l12-6 2 3-12 7z"/>
    <path class="il-line" d="M4 18c0-8 16-8 16 0"/>
    <path class="il-water-line" d="M37 20c6 4 10 10 14 18"/>
    <g transform="rotate(30 80 8)">
      <rect class="il-white il-ink" x="72" y="0" width="16" height="14" rx="2"/>
      <path class="il-line" d="M88 3c6 0 6 8 0 8"/>
    </g>
    <path class="il-water-line" d="M74 14c0 6 2 10 4 14"/>
    <path class="il-water" opacity="0.6" d="M136 4h18l-2 22h-14z"/>
    <path class="il-line" d="M134 4h20l-2 24h-16z"/>
    <path class="il-water-line" d="M136 20c-8 4-14 10-18 16"/>
    <ellipse class="il-water il-ink il-thin" cx="30" cy="70" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="132" cy="70" rx="2" ry="3"/>`,

  // A burnt-out coffee machine with an ice pack on its head: its display shows droopy eyes and a wavy mouth, it cries
  // a coffee tear, heaves a steamy sigh and grumbles a scribbled thunder-cloud speech bubble; one drop for the cup.
  'of.burnout-coffee-machine': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 30h160M0 60h160M20 0v100M60 0v100M100 0v100M140 0v100"/>
    <path class="il-grey il-ink" d="M0 100h160v20H0z"/>
    <path class="il-dark il-ink" d="M50 24h44l-4 10H54z"/>
    <path class="il-teal il-ink" d="M50 22c-2-6 4-10 12-10h22c8 0 12 4 10 10-4 2-40 2-44 0z"/>
    <path class="il-light il-thin" d="M58 15h8M70 15h8"/>
    <rect class="il-metal il-ink" x="40" y="32" width="64" height="68" rx="6"/>
    <rect class="il-dark il-ink" x="50" y="38" width="44" height="24" rx="3"/>
    <path class="il-light" d="M56 48q5 3 10 0M78 48q5 3 10 0"/>
    <path class="il-light il-thin" d="M56 44l9 1M88 44l-9 1"/>
    <path class="il-light" d="M62 57q3-3 5 0t5 0 5 0 5 0"/>
    <path class="il-water il-ink il-thin" d="M60 51c-2 3-2 5 0 6 2-1 2-3 0-6z"/>
    <circle class="il-red il-ink il-thin" cx="56" cy="70" r="2.6"/><circle class="il-green il-ink il-thin" cx="88" cy="70" r="2.6"/>
    <rect class="il-dark il-ink" x="66" y="66" width="12" height="6" rx="1"/>
    <path class="il-dark il-ink" d="M46 92h52v6H46z"/>
    <path class="il-wood-dark" d="M70 72h4v2h-4z"/>
    <path class="il-white il-ink" d="M64 82h16l-2 10H66z"/>
    <path class="il-line" d="M80 84c4 0 4 6-1 6"/>
    <path class="il-smoke il-ink il-thin" d="M30 44c-6 0-8-6-2-8 0-6 8-6 10-2 4-2 8 2 6 6 2 4-4 6-6 4-2 2-6 2-8 0z"/>
    <path class="il-line il-thin" d="M38 48l2 2M34 52l3 1"/>
    <path class="il-white il-ink" d="M110 6h44c4 0 6 2 6 6v20c0 4-2 6-6 6h-30l-12 8 4-8h-6c-4 0-6-2-6-6V12c0-4 2-6 6-6z"/>
    <path class="il-smoke il-ink il-thin" d="M118 22c-4 0-4-6 0-6 0-4 6-4 8-2 2-3 8-2 8 2 4 0 4 6 0 6z"/>
    <path class="il-yellow il-ink il-thin" d="M126 22l-3 5h3l-2 5 6-7h-3l2-3z"/>
    <path class="il-line il-thin" d="M138 14l3 4 3-4 3 4 3-4M138 26l3 4 3-4 3 4 3-4"/>
    <path class="il-line il-thin" d="M108 54l8-2M108 62h9M108 70l8 2"/>`,

  // The neighbour behind the wall, wearing ear defenders and goggles, grins hugely while pressing a power drill into
  // the wall; plaster dust flies and on our side the laptop shows an un-muted microphone and a picture hangs askew.
  'of.drilling-neighbour': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky" x="116" y="0" width="44" height="120"/>
    <path class="il-wood il-ink" d="M116 100h44v20h-44z"/>
    <path class="il-stone il-ink" d="M106 0h12v120h-12z"/>
    <path class="il-line il-thin" d="M108 50l4 6-3 4 5 6M110 70l4 4M112 44l3-6"/>
    <g transform="rotate(14 140 26)">
      <rect class="il-wood il-ink" x="128" y="14" width="24" height="20"/>
      <rect class="il-white il-ink il-thin" x="131" y="17" width="18" height="14"/>
      <path class="il-green il-ink il-thin" d="M132 30l5-7 4 4 3-3 4 6z"/>
    </g>
    <path class="il-line il-thin" d="M126 12l-3-3M154 18l3-2"/>
    <path class="il-metal il-ink" d="M120 100l3-4h34l3 4z"/>
    <rect class="il-dark il-ink" x="124" y="74" width="32" height="22" rx="2"/>
    <rect class="il-teal" x="127" y="77" width="26" height="16"/>
    <rect class="il-white il-ink il-thin" x="137" y="79" width="6" height="8" rx="3"/>
    <path class="il-line il-thin" d="M135 84c0 6 10 6 10 0M140 89v2"/>
    <path class="il-light il-thin" d="M131 81c-2 2-2 4 0 6M149 81c2 2 2 4 0 6"/>
    <path class="il-blue il-ink" d="M14 120c0-26 14-40 36-40s36 14 36 40z"/>
    <path class="il-line il-thin" d="M30 96v24M70 96v24M14 108h72"/>
    <circle class="il-skin il-ink" cx="50" cy="46" r="22"/>
    <path class="il-dark il-ink" d="M26 40c0-20 48-20 48 0h-5c0-14-38-14-38 0z"/>
    <rect class="il-red il-ink" x="22" y="36" width="10" height="18" rx="4"/>
    <rect class="il-red il-ink" x="68" y="36" width="10" height="18" rx="4"/>
    <path class="il-dark" d="M32 40h36v4H32z"/>
    <circle class="il-water il-ink" cx="42" cy="42" r="6"/><circle class="il-water il-ink" cx="58" cy="42" r="6"/>
    <circle class="il-dark" cx="44" cy="43" r="2.2"/><circle class="il-dark" cx="60" cy="43" r="2.2"/>
    <path class="il-light il-thin" d="M39 39l2-2M55 39l2-2"/>
    <path class="il-wood-dark il-ink il-thin" d="M40 52c4-3 16-3 20 0-3 3-17 3-20 0z"/>
    <path class="il-dark il-ink" d="M38 56c4 12 20 12 24 0z"/>
    <path class="il-white" d="M40 57h20l-1 3H41z"/>
    <path class="il-skin il-ink" d="M66 86c4-8 8-14 14-18l5 5c-6 4-10 10-12 16z"/>
    <path class="il-yellow il-ink" d="M72 56h22c4 0 6 3 6 7s-2 7-6 7H86l-2 12h-8l2-12h-6z"/>
    <path class="il-dark il-ink il-thin" d="M76 76h8v6h-8z"/>
    <rect class="il-dark il-ink" x="100" y="59" width="5" height="8"/>
    <path class="il-metal il-ink il-thin" d="M105 61.5h4v3h-4z"/>
    <circle class="il-skin il-ink" cx="80" cy="72" r="5"/>
    <circle class="il-smoke il-ink il-thin" cx="104" cy="50" r="3"/><circle class="il-smoke il-ink il-thin" cx="98" cy="46" r="2"/><circle class="il-smoke il-ink il-thin" cx="104" cy="74" r="2.4"/>
    <path class="il-line" d="M86 40l4-4 4 4 4-4M88 88l4 4 4-4 4 4"/>`,

  // Through the home-office window: a grinning yellow digger (cab windows as angry eyes, grille as teeth) rattles
  // the window with dust clouds and a striped barrier; inside, the coffee mug on the sill jumps from the vibration.
  'of.building-site': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="12" y="6" width="136" height="80"/>
    <path class="il-earth" d="M13 66h134v19H13z"/>
    <path class="il-metal il-ink il-thin" d="M24 8v58M24 12h50M24 20l8-8M32 20l8-8M40 20l8-8"/>
    <path class="il-line il-thin" d="M66 12v14"/>
    <path class="il-metal il-ink il-thin" d="M62 26h8v4h-8z"/>
    <path class="il-smoke il-ink il-thin" d="M118 40c-6 0-6-8 0-8 0-6 8-8 12-4 4-4 12 0 10 6 6 0 6 8 0 8z"/>
    <path class="il-yellow il-ink" d="M94 56l14-24 22 10-6 6-14-6-10 16z"/>
    <path class="il-dark il-ink" d="M124 46l10 0 2 10c-4 4-12 4-14-2z"/>
    <path class="il-line il-thin" d="M124 56l2 3M128 57l1 3M132 56l1 3"/>
    <path class="il-yellow il-ink" d="M44 70V46c0-4 2-6 6-6h22c4 0 6 2 8 6l8 10h10c4 0 6 2 6 6v8z"/>
    <path class="il-white il-ink il-thin" d="M50 46h10v12H50zM64 46h10v12H64z"/>
    <circle class="il-dark" cx="57" cy="53" r="2.4"/><circle class="il-dark" cx="67" cy="53" r="2.4"/>
    <path class="il-line il-thick" d="M48 44l12 4M76 44l-12 4"/>
    <path class="il-dark il-ink" d="M84 60h16v8H84z"/>
    <path class="il-white" d="M86 61h3v6h-3zM91 61h3v6h-3zM96 61h3v6h-3z"/>
    <rect class="il-dark il-ink" x="40" y="70" width="64" height="12" rx="6"/>
    <circle class="il-grey il-ink il-thin" cx="48" cy="76" r="3"/><circle class="il-grey il-ink il-thin" cx="60" cy="76" r="3"/>
    <circle class="il-grey il-ink il-thin" cx="72" cy="76" r="3"/><circle class="il-grey il-ink il-thin" cx="84" cy="76" r="3"/><circle class="il-grey il-ink il-thin" cx="96" cy="76" r="3"/>
    <path class="il-red il-ink il-thin" d="M112 68h32v6h-32z"/>
    <path class="il-white" d="M116 68h5l-3 6h-5zM126 68h5l-3 6h-5zM136 68h5l-3 6h-5z"/>
    <path class="il-dark il-ink il-thin" d="M116 74v10M140 74v10"/>
    <path class="il-line" d="M12 46v40M148 46v40M80 6v80"/>
    <path class="il-white il-ink" d="M4 86h152v6H4z"/>
    <path class="il-line il-thin" d="M84 30l6-4M92 22l4-3"/>
    <g transform="rotate(-12 34 78)">
      <path class="il-line" d="M42 74c6 0 6 8 0 8"/>
      <rect class="il-white il-ink" x="26" y="70" width="16" height="15" rx="2"/>
      <path class="il-red" d="M28 75h12v3H28z"/>
    </g>
    <path class="il-line il-thin" d="M22 88l-3 3M48 88l3 3M24 66l-3-2M46 64l3-3"/>
    <path class="il-wood il-ink" d="M0 104h160v16H0z"/>
    <path class="il-dark il-ink" d="M40 104c0-10 8-14 14-14s14 4 14 14h-4c0-8-4-10-10-10s-10 2-10 10z"/>
    <rect class="il-dark il-ink" x="36" y="100" width="8" height="10" rx="3"/><rect class="il-dark il-ink" x="64" y="100" width="8" height="10" rx="3"/>
    <path class="il-line" d="M30 96l-6-3M78 96l6-3M28 104h-6"/>`,

  // A fat smug pigeon on the windowsill holds a stolen key ring in its beak and coos (curly lines); next to it, its nest
  // of loot: a pen, a paper clip, a sock. On the laptop's video call one of the four tiles shows the pigeon itself.
  'of.window-pigeon': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="8" y="4" width="144" height="84"/>
    <path class="il-grey" d="M9 60h20v-12h14v12h22v-20h18v20h70v27H9z"/>
    <path class="il-line il-thin" opacity="0.5" d="M14 66h6M50 70h6M70 46h6M120 66h6M140 72h6"/>
    <path class="il-white" d="M110 18c0-4 6-5 8-2 2-4 8-4 9 0 4 0 4 5 0 5h-15z"/>
    <path class="il-stone il-ink" d="M2 86h156v8H2z"/>
    <path class="il-wood-dark il-ink il-thin" d="M4 86c0-8 30-8 30 0z"/>
    <path class="il-blue il-ink il-thin" d="M8 78l16-6 1 2-16 6z"/>
    <path class="il-red il-ink il-thin" d="M24 82c0-6 2-10 6-10s4 4 2 6l4 4z"/>
    <path class="il-line il-thin" d="M12 84h6c2 0 2-3 0-3h-5c-2 0-2-2 0-2h4"/>
    <path class="il-pink il-ink il-thin" d="M76 86l-2-6M84 86l2-6M74 86h4M84 86h4"/>
    <path class="il-dark il-ink" d="M98 66l18 6-4 8-16-4z"/>
    <ellipse class="il-grey il-ink" cx="78" cy="66" rx="26" ry="18"/>
    <path class="il-stone il-ink il-thin" d="M76 60c8-4 20-2 26 6-4 4-10 6-18 6-6 0-10-4-8-12z"/>
    <path class="il-dark" d="M88 64h8v2h-8zM90 68h8v2h-8z"/>
    <path class="il-teal il-ink il-thin" d="M50 52c4 6 14 8 20 4-2-6-8-10-16-10z"/>
    <path class="il-purple" d="M54 52c4 3 10 4 14 2-2-3-6-5-12-5z"/>
    <circle class="il-grey il-ink" cx="56" cy="40" r="12"/>
    <path class="il-dark il-ink il-thin" d="M45 42l-8 2 8 2z"/>
    <ellipse class="il-white" cx="45" cy="40.5" rx="2" ry="1.2"/>
    <circle class="il-orange il-ink il-thin" cx="52" cy="38" r="3.6"/><circle class="il-dark" cx="51" cy="38.5" r="1.6"/>
    <path class="il-grey il-ink il-thin" d="M48.4 38a3.6 3.6 0 0 1 7.2 0z"/>
    <path class="il-line il-thin" d="M48 32l8 2"/>
    <circle class="il-line" cx="36" cy="50" r="4"/>
    <path class="il-gold il-ink il-thin" d="M32 54l-4 10 3 1 1-3 2 1 1-2-2-1 1-5zM39 54l2 9 3-1-1-2 2-1-1-2-2 1-1-4z"/>
    <path class="il-line il-thin" d="M32 28c-4-2-2-6 1-5 3 1 1 5-2 4M24 34c-4-2-2-6 1-5 3 1 1 5-2 4M30 20c-3-2-1-5 1-4 3 1 1 4-1 3"/>
    <path class="il-wood il-ink" d="M0 104h160v16H0z"/>
    <rect class="il-dark il-ink" x="110" y="68" width="46" height="34" rx="2"/>
    <rect class="il-teal" x="113" y="71" width="19" height="13"/><rect class="il-sky" x="134" y="71" width="19" height="13"/>
    <rect class="il-sky" x="113" y="86" width="19" height="13"/><rect class="il-teal" x="134" y="86" width="19" height="13"/>
    <circle class="il-skin il-ink il-thin" cx="122.5" cy="76" r="2.6"/><path class="il-blue il-ink il-thin" d="M118 84c0-3 2-5 4.5-5s4.5 2 4.5 5z"/>
    <circle class="il-skin il-ink il-thin" cx="143.5" cy="76" r="2.6"/><path class="il-red il-ink il-thin" d="M139 84c0-3 2-5 4.5-5s4.5 2 4.5 5z"/>
    <circle class="il-skin il-ink il-thin" cx="122.5" cy="91" r="2.6"/><path class="il-green il-ink il-thin" d="M118 99c0-3 2-5 4.5-5s4.5 2 4.5 5z"/>
    <path class="il-grey il-ink il-thin" d="M138 99c0-4 3-6 6-6s6 2 6 6z"/>
    <circle class="il-grey il-ink il-thin" cx="142" cy="91" r="3.6"/>
    <path class="il-dark" d="M138.6 91l-2.6 1 2.6 1z"/><circle class="il-orange" cx="141" cy="90.2" r="1"/>
    <path class="il-metal il-ink" d="M104 106l4-4h50l2 4z"/>`,

  // A huge open binder swarms with tiny pink file mites marching in a line, each with its own little tag; a magnifying
  // glass shows one mite up close: stern, with a pencil behind its ear and a stack of three carbon copies.
  'of.file-mites': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M0 96h160v24H0z"/>
    <path class="il-wood-dark" d="M0 96h160v3H0z"/>
    <path class="il-blue il-ink" d="M4 96l6-56h38l2 56z"/>
    <path class="il-blue il-ink" d="M50 96l2-56h38l6 56z"/>
    <path class="il-white il-ink il-thin" d="M12 92l5-48h31v48zM52 92V44h31l5 48z"/>
    <path class="il-line il-thin" d="M18 52h24M18 58h24M18 64h20M58 52h22M58 58h22M58 64h18M18 76h24M58 76h24"/>
    <circle class="il-metal il-ink il-thin" cx="50" cy="56" r="2.4"/><circle class="il-metal il-ink il-thin" cx="50" cy="78" r="2.4"/>
    <g class="il-pink il-ink il-thin">
      <ellipse cx="24" cy="70" rx="3" ry="2.4"/><ellipse cx="32" cy="72" rx="3" ry="2.4"/><ellipse cx="40" cy="70" rx="3" ry="2.4"/>
      <ellipse cx="62" cy="70" rx="3" ry="2.4"/><ellipse cx="70" cy="86" rx="3" ry="2.4"/><ellipse cx="30" cy="86" rx="3" ry="2.4"/>
      <ellipse cx="96" cy="100" rx="3" ry="2.4"/><ellipse cx="104" cy="104" rx="3" ry="2.4"/><ellipse cx="112" cy="102" rx="3" ry="2.4"/>
      <ellipse cx="120" cy="106" rx="3" ry="2.4"/><ellipse cx="128" cy="104" rx="3" ry="2.4"/><ellipse cx="136" cy="108" rx="3" ry="2.4"/>
      <ellipse cx="144" cy="106" rx="3" ry="2.4"/><ellipse cx="152" cy="110" rx="3" ry="2.4"/><ellipse cx="88" cy="104" rx="3" ry="2.4"/>
      <ellipse cx="80" cy="108" rx="3" ry="2.4"/>
    </g>
    <g class="il-white il-ink il-thin">
      <rect x="22" y="64" width="4" height="3"/><rect x="38" y="64" width="4" height="3"/><rect x="94" y="94" width="4" height="3"/>
      <rect x="110" y="96" width="4" height="3"/><rect x="126" y="98" width="4" height="3"/><rect x="142" y="100" width="4" height="3"/>
    </g>
    <path class="il-line il-thin" d="M93 102l-2 2M99 102l2 2M117 108l-2 2M123 108l2 2M133 110l-2 2M139 110l2 2M149 112l-2 2M155 112l2 2"/>
    <path class="il-wood-dark il-ink" d="M132 72l20 24-6 5-20-24z"/>
    <circle class="il-paper" cx="112" cy="46" r="30"/>
    <path class="il-line il-thin" d="M94 62l-6-6M92 50l-8-2M96 38l-6-6M130 62l6-6M132 50l8-2M128 38l6-6"/>
    <path class="il-line" d="M100 46l-10-6M99 52l-11 0M100 58l-9 6M104 62l-5 8M124 46l10-6M125 52l11 0M124 58l9 6M120 62l5 8"/>
    <ellipse class="il-pink il-ink" cx="112" cy="51" rx="14" ry="12"/>
    <path class="il-white il-ink il-thin" d="M86 50l10-4 2 18-10 4zM84 54l10-4 2 18-10 4zM82 58l10-4 2 18-10 4z"/>
    <path class="il-line il-thin" d="M85 64l7-3M86 68l7-3"/>
    <circle class="il-white il-ink il-thin" cx="107" cy="47" r="4"/><circle class="il-dark" cx="107" cy="48" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="117" cy="47" r="4"/><circle class="il-dark" cx="117" cy="48" r="1.8"/>
    <path class="il-line" d="M102 41l8 3M122 41l-8 3"/>
    <path class="il-line il-thin" d="M108 56h8"/>
    <path class="il-line il-thin" d="M105 58l7 7 7-7"/>
    <rect class="il-white il-ink il-thin" x="108" y="64" width="8" height="7"/>
    <path class="il-line il-thin" d="M110 66.5h4M110 68.5h3"/>
    <path class="il-yellow il-ink il-thin" d="M124 36l6-10 2 1-6 10z"/>
    <path class="il-line il-thin" d="M98 52l-6 0"/>
    <circle class="il-line il-thick" cx="112" cy="46" r="30"/>
    <path class="il-light" d="M92 34c4-8 10-12 18-13"/>`,

  // A furious grey printer with angry LED eyes chokes on a crumpled paper jam hanging out of its slot like a tongue and
  // fires paper wads at a cowering pot plant, which already wears a sheet on its head. Smoke puffs, a blinking red light.
  'of.jammed-printer': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-grey il-ink" d="M0 96h160v24H0z"/>
    <path class="il-white il-ink il-thin" d="M30 30l6-14h36l6 14z"/>
    <path class="il-line il-thin" d="M40 22h28"/>
    <rect class="il-metal il-ink" x="12" y="30" width="84" height="58" rx="6"/>
    <rect class="il-dark il-ink" x="12" y="88" width="84" height="8" rx="2"/>
    <path class="il-light il-thin" d="M18 36h30"/>
    <rect class="il-dark il-ink il-thin" x="22" y="40" width="44" height="14" rx="2"/>
    <path class="il-glow" d="M28 44l12 5-12 1zM60 44l-12 5 12 1z"/>
    <circle class="il-red il-ink il-thin" cx="80" cy="44" r="3.4"/><circle class="il-green il-ink il-thin" cx="88" cy="44" r="2.6"/>
    <path class="il-line il-thin" d="M76 38l-3-3M84 38l-1-4M86 50l3 2"/>
    <rect class="il-dark il-ink" x="20" y="62" width="68" height="6" rx="2"/>
    <path class="il-white il-ink" d="M34 66l20 0 6 8-4 6 6 6-8 4-12-2-4-8 2-6z"/>
    <path class="il-line il-thin" d="M40 72l6 2-2 6M50 80l4 4"/>
    <path class="il-smoke il-ink il-thin" d="M8 24c-4 0-4-6 0-6 0-4 6-4 8-2 2-2 6 0 4 4 2 2 0 4-2 4z"/>
    <path class="il-smoke il-ink il-thin" d="M100 22c-4 0-4-6 0-6 0-4 6-4 8-2 2-2 6 0 4 4 2 2 0 4-2 4z"/>
    <polygon class="il-white il-ink" points="98 56 102 52 106 53 110 57 108 62 104 64 99 62"/><path class="il-line il-thin" d="M101 56l4 2-1 3"/>
    <polygon class="il-white il-ink" points="111 43 115 39 120 41 121 46 117 49 112 48"/><path class="il-line il-thin" d="M114 42l3 3"/>
    <polygon class="il-white il-ink" points="106 71 109 68 114 69 115 74 111 77 107 75"/><path class="il-line il-thin" d="M109 71l3 3"/>
    <path class="il-line il-thin" d="M96 60h-4M108 48l-4-2M100 72h-4"/>
    <path class="il-earth il-ink" d="M126 82h28l-3 16h-22z"/>
    <path class="il-earth-dark il-ink" d="M124 78h32v6h-32z"/>
    <path class="il-green il-ink" d="M140 78c-12-2-18-12-16-22 8 2 14 10 16 22zM140 78c12-2 18-12 16-22-8 2-14 10-16 22z"/>
    <ellipse class="il-green il-ink" cx="140" cy="60" rx="10" ry="16"/>
    <g transform="rotate(-12 140 46)">
      <rect class="il-white il-ink il-thin" x="130" y="38" width="20" height="14"/>
      <path class="il-line il-thin" d="M133 42h14M133 46h10"/>
    </g>
    <circle class="il-white il-ink il-thin" cx="136" cy="62" r="3.4"/><circle class="il-dark" cx="135" cy="63" r="1.5"/>
    <circle class="il-white il-ink il-thin" cx="145" cy="62" r="3.4"/><circle class="il-dark" cx="144" cy="63" r="1.5"/>
    <ellipse class="il-dark" cx="140" cy="70" rx="2" ry="2.4"/>
    <ellipse class="il-water il-ink il-thin" cx="151" cy="58" rx="1.6" ry="2.4"/>`,

  // A grinning green stink cloud with evil eyes and grabby wisps rises out of the open microwave from a bowl of fish
  // soup (a fish tail sticks out). The pot plant on the counter wilts and a fly lies on its back with crossed-out eyes.
  'of.microwave-fish-soup': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 24h160M0 48h160M0 72h160M26 0v92M66 0v92M106 0v92M146 0v92"/>
    <path class="il-grey il-ink" d="M0 92h160v28H0z"/>
    <rect class="il-white il-ink" x="22" y="50" width="78" height="42" rx="3"/>
    <rect class="il-dark il-ink" x="26" y="54" width="54" height="34" rx="2"/>
    <rect class="il-metal il-ink il-thin" x="84" y="56" width="12" height="10"/>
    <circle class="il-grey il-ink il-thin" cx="90" cy="74" r="3.4"/><circle class="il-grey il-ink il-thin" cx="90" cy="83" r="2.4"/>
    <path class="il-white il-ink" d="M22 50 6 44v54l16-6z"/>
    <path class="il-metal il-ink il-thin" d="M10 52l8 2v34l-8 2z"/>
    <path class="il-orange il-ink il-thin" d="M54 74l6-8 2 4 4-4-2 8z"/>
    <path class="il-white il-ink" d="M36 76h34c0 8-8 12-17 12s-17-4-17-12z"/>
    <path class="il-orange" d="M38 77h30v-1H38z"/>
    <path class="il-slime" opacity="0.85" d="M44 72c-6-6-4-14 2-16-6-8 0-18 10-16 0-12 14-18 24-12 6-10 22-12 32-4 10-6 26 0 26 12 10 2 14 12 8 20 6 6 2 16-8 16-4 6-14 6-18 0-6 4-14 2-16-4-6 4-14 2-14-4-6 4-14 4-16-2-4 4-10 6-14 2z"/>
    <path class="il-line il-thin" d="M48 64c-4-4-2-10 2-12M60 40c2-8 10-12 18-10M110 22c8-4 18 0 20 8"/>
    <path class="il-line il-thick" d="M78 32l12 5M116 32l-12 5"/>
    <ellipse class="il-glow il-ink il-thin" cx="88" cy="42" rx="5" ry="4"/><circle class="il-dark" cx="89" cy="43" r="2"/>
    <ellipse class="il-glow il-ink il-thin" cx="106" cy="42" rx="5" ry="4"/><circle class="il-dark" cx="105" cy="43" r="2"/>
    <path class="il-dark il-ink" d="M84 52q14 12 28 0q-14 4-28 0z"/>
    <path class="il-white" d="M88 54l2 3 2-2.6 2 3 2-3 2 3 2-3 2 2.6 2-3z"/>
    <path class="il-slime il-ink il-thin" d="M140 64c6 2 10 6 12 12-4-2-8-4-10-2"/>
    <path class="il-line il-thin" d="M150 76l3 2M154 72l2 3"/>
    <path class="il-earth il-ink" d="M118 84h20l-2 10h-16z"/>
    <path class="il-wood-dark il-ink il-thin" d="M128 84c0-8-2-12-6-14M128 84c0-6 4-10 8-10"/>
    <path class="il-green il-ink il-thin" d="M122 70c-4 2-6 8-4 12 2-4 4-8 4-12zM136 74c4 2 6 8 4 12-2-4-4-8-4-12z"/>
    <ellipse class="il-dark il-ink il-thin" cx="148" cy="104" rx="5" ry="3"/>
    <path class="il-line il-thin" d="M145 102l-2-4M148 101v-4M151 102l2-4"/>
    <path class="il-white il-ink il-thin" d="M146 107c-2 2-6 2-6 0 2-2 4-2 6 0zM150 107c2 2 6 2 6 0-2-2-4-2-6 0z"/>`,

  // IT support has finally arrived: hoodie, lanyard, half-closed bored eyes and a long sigh cloud. One finger presses the
  // power button while a huge unopened toolbox sits beside him; the wall calendar shows three days crossed off.
  'of.it-support': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-white il-ink" x="8" y="8" width="34" height="30"/>
    <path class="il-red" d="M8 8h34v7H8z"/>
    <path class="il-line il-thin" d="M12 20h6M20 20h6M28 20h6M12 26h6M20 26h6M28 26h6M12 32h6"/>
    <path class="il-line" d="M12 18l6 4M18 18l-6 4M20 18l6 4M26 18l-6 4M28 18l6 4M34 18l-6 4"/>
    <path class="il-wood il-ink" d="M0 100h160v20H0z"/>
    <path class="il-wood-dark" d="M0 100h160v3H0z"/>
    <rect class="il-dark il-ink" x="104" y="40" width="50" height="36" rx="3"/>
    <rect class="il-blue" x="108" y="44" width="42" height="28"/>
    <path class="il-yellow il-ink il-thin" d="M129 48l10 18h-20z"/>
    <path class="il-dark" d="M128 53h2v7h-2zM128 62h2v2h-2z"/>
    <path class="il-metal il-ink" d="M124 76h10l2 8h-14z"/><path class="il-metal il-ink" d="M116 84h26v3h-26z"/>
    <rect class="il-grey il-ink" x="136" y="86" width="18" height="14" rx="1"/>
    <circle class="il-green il-ink il-thin" cx="145" cy="93" r="3"/>
    <path class="il-yellow il-ink il-thin" d="M150 86l3-4M152 90l4-1"/>
    <path class="il-red il-ink" d="M8 84h44v16H8z"/>
    <path class="il-red il-ink" d="M14 84c0-8 4-10 16-10s16 2 16 10h-4c0-5-2-6-12-6s-12 1-12 6z"/>
    <path class="il-metal il-ink il-thin" d="M24 88h12v4H24z"/>
    <path class="il-line il-thin" d="M8 92h16M36 92h16"/>
    <path class="il-grey il-ink" d="M58 120c0-26 10-40 30-40s30 14 30 40z"/>
    <path class="il-line il-thin" d="M76 82v18M100 82v18M70 108h36"/>
    <path class="il-blue il-ink il-thin" d="M80 82l8 20 8-20"/>
    <rect class="il-white il-ink il-thin" x="84" y="100" width="8" height="10"/>
    <path class="il-grey il-ink" d="M108 92c8-4 14-6 22-6l2 6c-8 1-14 3-20 6z"/>
    <circle class="il-skin il-ink" cx="134" cy="89" r="4"/>
    <path class="il-skin il-ink" d="M136 87l8 3-1 3-8-2z"/>
    <circle class="il-skin il-ink" cx="88" cy="56" r="20"/>
    <path class="il-wood-dark il-ink" d="M68 52c-2-14 8-22 20-22s22 8 20 22c-2-6-4-8-6-8 0 4-2 4-4 2-2 2-4 2-6 0-2 2-6 2-8 0-2 2-4 2-6 0-4 0-6 2-10 6z"/>
    <circle class="il-white il-ink" cx="80" cy="56" r="4.6"/><circle class="il-white il-ink" cx="96" cy="56" r="4.6"/>
    <path class="il-skin il-ink il-thin" d="M75.4 56a4.6 4.6 0 0 1 9.2 0zM91.4 56a4.6 4.6 0 0 1 9.2 0z"/>
    <circle class="il-dark" cx="81" cy="58" r="1.6"/><circle class="il-dark" cx="97" cy="58" r="1.6"/>
    <path class="il-line il-thin" d="M76 50h8M92 50h8"/>
    <path class="il-line il-thin" opacity="0.6" d="M74 66l1 1M78 69l1 1M98 69l1 1M102 66l1 1M86 71l1 1M92 71l1 1"/>
    <ellipse class="il-dark" cx="90" cy="66" rx="3" ry="2"/>
    <path class="il-smoke il-ink il-thin" d="M62 80c-8 0-10-8-4-10-2-8 8-10 12-6 4-4 10-2 8 4 4 2 2 8-2 8-2 4-10 6-14 4z"/>
    <path class="il-smoke il-ink il-thin" d="M46 70c-4 0-5-5-1-6 0-4 6-4 7-1 3-1 5 3 2 5 0 3-5 4-8 2z"/>
    <path class="il-line il-thin" d="M84 68l-4 2M82 72l-3 2"/>`,
};
