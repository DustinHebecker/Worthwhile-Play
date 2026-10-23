/* Railway illustrations: items1. */
export const RW_ITEMS1: Readonly<Record<string, string>> = {
  // A moustached conductor in a proper peaked cap bellows "ticket!" at a pigeon on the bench, who dutifully holds up a tiny ticket in its beak.
  'rw.conductor-cap': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="98" width="160" height="22"/>
    <path class="il-yellow" d="M0 102h160v3H0z"/>
    <path class="il-line" d="M0 98h160"/>
    <path class="il-line il-thick" d="M18 0v12"/>
    <circle class="il-white il-ink" cx="18" cy="22" r="10"/>
    <path class="il-line il-thin" d="M18 22v-7M18 22l5 2M18 13.5v1.5M26.5 22H25M18 30.5V29M9.5 22H11"/>
    <path class="il-line il-thick" d="M114 92v8M152 92v8"/>
    <rect class="il-wood il-ink" x="106" y="86" width="52" height="6" rx="1"/>
    <path class="il-dark il-ink il-thin" d="M141 75l13-5-3 10z"/>
    <ellipse class="il-grey il-ink" cx="133" cy="77" rx="12" ry="8"/>
    <path class="il-line il-thin" d="M128 75q6 6 14 1M129 85v1.5M135 85v1.5"/>
    <circle class="il-grey il-ink" cx="123" cy="66" r="6.5"/>
    <path class="il-teal" d="M118.5 70.5q4.5 3.5 9.5 1l-0.5 3.5q-5 1.5-8.5-1.5z"/>
    <circle class="il-white il-ink il-thin" cx="121" cy="64.5" r="2.4"/><circle class="il-dark" cx="120.3" cy="64.8" r="1.1"/>
    <path class="il-line il-thin" d="M118 61.5l4.5 1"/>
    <path class="il-orange il-ink il-thin" d="M117 66.5l-5 1.5 5 1.5z"/>
    <g transform="rotate(-14 106 68)"><rect class="il-paper il-ink il-thin" x="99" y="64.5" width="13" height="8" rx="1"/><path class="il-line il-thin" d="M103 64.5v8M105.5 67h4M105.5 70h3"/></g>
    <path class="il-blue il-ink" d="M34 120c0-22 12-32 32-32s32 10 32 32z"/>
    <rect class="il-skin il-ink" x="60" y="78" width="12" height="12"/>
    <path class="il-white il-ink il-thin" d="M58 88l8 8 8-8z"/>
    <path class="il-red il-ink il-thin" d="M64 96h4l1.5 12-3.5 4-3.5-4z"/>
    <path class="il-gold il-ink il-thin" d="M36 100l10-6 2 4-10 6zM96 100l-10-6-2 4 10 6z"/>
    <circle class="il-gold il-ink il-thin" cx="56" cy="106" r="1.8"/><circle class="il-gold il-ink il-thin" cx="56" cy="114" r="1.8"/>
    <circle class="il-gold il-ink il-thin" cx="76" cy="106" r="1.8"/><circle class="il-gold il-ink il-thin" cx="76" cy="114" r="1.8"/>
    <path class="il-blue il-ink" d="M88 98q8-6 12-16l7 3q-3 12-12 20z"/>
    <path class="il-metal il-ink il-thin" d="M102 80l7-9 3 2-7 9zM106 83l9-6 2 3-9 6z"/>
    <circle class="il-metal il-ink il-thin" cx="112" cy="73" r="3"/>
    <circle class="il-skin il-ink" cx="104" cy="82" r="5"/>
    <circle class="il-skin il-ink" cx="49" cy="67" r="4"/><circle class="il-skin il-ink" cx="83" cy="67" r="4"/>
    <ellipse class="il-skin il-ink" cx="66" cy="67" rx="17" ry="17"/>
    <path class="il-line" d="M54 59l8 2M78 59l-8 2"/>
    <circle class="il-white il-ink il-thin" cx="59.5" cy="64.5" r="3.6"/><circle class="il-dark" cx="61" cy="64.5" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="72.5" cy="64.5" r="3.6"/><circle class="il-dark" cx="74" cy="64.5" r="1.7"/>
    <path class="il-line il-thin" d="M66 66l-2 5h3"/>
    <path class="il-wood-dark il-ink il-thin" d="M55 74q5-4 11-1 6-3 11 1-5 3-11 1-6 2-11-1z"/>
    <ellipse class="il-dark il-ink il-thin" cx="66" cy="78.5" rx="4" ry="3"/>
    <path class="il-blue il-ink" d="M48 47 41 34q25-11 50 0l-7 13z"/>
    <path class="il-light il-thin" d="M48 36q10-4 18-4"/>
    <rect class="il-dark il-ink" x="48" y="45" width="36" height="8" rx="1"/>
    <path class="il-gold" d="M48 46.5h36V48H48zM48 50h36v1.5H48z"/>
    <circle class="il-gold il-ink il-thin" cx="66" cy="39" r="4.2"/>
    <path class="il-line il-thin" d="M66 35v8M62 39h8"/>
    <path class="il-dark il-ink" d="M48 53h36q2 6-8 7.5-10 1.5-20 0-10-1.5-8-7.5z"/>
    <path class="il-light il-thin" d="M55 56q9 2.5 18 0"/>
    <path class="il-white il-ink" d="M96 6h48a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6h-34l-14 10 4-10h-4a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z"/>
    <rect class="il-paper il-ink il-thin" x="97" y="11" width="25" height="16" rx="2"/>
    <path class="il-line il-thin il-dash" d="M104 11v16"/>
    <path class="il-line il-thin" d="M108 16h10M108 20h8M108 24h6"/>
    <rect class="il-red il-ink il-thin" x="129" y="10" width="4.5" height="12" rx="2"/><circle class="il-red il-ink il-thin" cx="131.2" cy="26" r="2.3"/>
    <rect class="il-red il-ink il-thin" x="139" y="10" width="4.5" height="12" rx="2"/><circle class="il-red il-ink il-thin" cx="141.2" cy="26" r="2.3"/>`,

  // A blissed-out commuter in giant headphones bops to the music while the loudspeaker's urgent "!" bounces off his bubble and his train leaves behind him.
  'rw.commuter-headphones': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-smoke il-ink il-thin" cx="148" cy="22" r="8"/><circle class="il-smoke il-ink il-thin" cx="134" cy="14" r="6"/><circle class="il-smoke il-ink il-thin" cx="154" cy="8" r="5"/>
    <rect class="il-red il-ink" x="110" y="34" width="58" height="62" rx="6"/>
    <rect class="il-sky il-ink il-thin" x="118" y="42" width="14" height="16" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="138" y="42" width="14" height="16" rx="2"/>
    <path class="il-white il-ink il-thin" d="M110 66h50v5h-50z"/>
    <circle class="il-metal il-ink" cx="108" cy="84" r="4"/>
    <path class="il-light" d="M96 46h10M98 56h8M98 80h8"/>
    <rect class="il-stone" x="0" y="92" width="160" height="28"/>
    <path class="il-yellow" d="M0 96h160v3H0z"/>
    <path class="il-line" d="M0 92h160"/>
    <path class="il-line il-thick" d="M0 14h12"/>
    <rect class="il-grey il-ink" x="10" y="8" width="8" height="12" rx="1"/>
    <path class="il-metal il-ink" d="M18 10l14-6v20l-14-6z"/>
    <path class="il-line" d="M36 8q4 6 0 12M41 4q7 10 0 20"/>
    <path class="il-white il-ink" d="M18 30h18a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z"/>
    <path class="il-white il-ink il-thin" d="M30 30l2-5 4 5"/>
    <rect class="il-red il-ink il-thin" x="20" y="33" width="3.5" height="8" rx="1.5"/><circle class="il-red" cx="21.8" cy="44.5" r="1.8"/>
    <rect class="il-red il-ink il-thin" x="27" y="33" width="3.5" height="8" rx="1.5"/><circle class="il-red" cx="28.8" cy="44.5" r="1.8"/>
    <rect class="il-red il-ink il-thin" x="34" y="33" width="3.5" height="8" rx="1.5"/><circle class="il-red" cx="35.8" cy="44.5" r="1.8"/>
    <circle class="il-light il-dash il-thin" cx="66" cy="62" r="31"/>
    <path class="il-yellow il-ink il-thin" d="M38 50l3-1 1-3 1 3 3 1-3 1-1 3-1-3z"/>
    <path class="il-line il-thin" d="M30 54l5-1M31 60l5 0M33 48l4 2"/>
    <path class="il-teal il-ink" d="M36 120c0-20 12-30 30-30s30 10 30 30z"/>
    <rect class="il-skin il-ink" x="60" y="78" width="12" height="12"/>
    <path class="il-orange il-ink" d="M55 88q11 6 22 0l2 6q-13 7-26 0z"/>
    <path class="il-light il-thin" d="M58 92l2 2M64 94l1 2M70 94l1 2"/>
    <ellipse class="il-skin il-ink" cx="66" cy="62" rx="17" ry="18"/>
    <path class="il-wood-dark il-ink" d="M49 58c0-14 8-20 17-20s17 6 17 20c-5-6-11-8-17-8s-12 2-17 8z"/>
    <path class="il-line" d="M56 61q3-3 6 0M70 61q3-3 6 0"/>
    <path class="il-line il-thin" d="M55 55l6-1M71 54l6 1"/>
    <circle class="il-pink" cx="55" cy="68" r="2.6"/><circle class="il-pink" cx="77" cy="68" r="2.6"/>
    <path class="il-white il-ink il-thin" d="M58 70q8 9 16 0z"/>
    <path class="il-dark il-ink" d="M44 62c0-32 44-32 44 0h-5c0-25-34-25-34 0z"/>
    <rect class="il-orange il-ink" x="40" y="52" width="11" height="20" rx="4"/>
    <rect class="il-orange il-ink" x="81" y="52" width="11" height="20" rx="4"/>
    <path class="il-light il-thin" d="M43 56v8M84 56v8"/>
    <path class="il-line" d="M96 40V28l8-2v12"/><circle class="il-dark" cx="94" cy="40" r="2.6"/><circle class="il-dark" cx="102" cy="38" r="2.6"/>
    <path class="il-line" d="M44 34V24"/><path class="il-line il-thin" d="M44 24q5 1 5 6"/><circle class="il-dark" cx="42" cy="34" r="2.6"/>`,

  // A commuter proudly wears a folded newspaper hat; a drip from the leaky station roof bounces off the tip, while one soggy corner droops.
  'rw.newspaper-hat': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="-2" y="-2" width="164" height="12"/>
    <path class="il-line il-thin" d="M20 0v10M60 0v10M100 0v10M140 0v10"/>
    <path class="il-metal il-ink" d="M0 10h160v6H0z"/>
    <path class="il-dark" d="M78 13h5v3h-5z"/>
    <ellipse class="il-water il-ink il-thin" cx="80" cy="22" rx="2" ry="3"/>
    <ellipse class="il-water il-ink il-thin" cx="80" cy="30" rx="2" ry="3"/>
    <path class="il-water-line" d="M70 34q-6-4-10-1M90 34q6-4 10-1"/>
    <circle class="il-water il-ink il-thin" cx="62" cy="30" r="1.6"/><circle class="il-water il-ink il-thin" cx="98" cy="30" r="1.6"/>
    <rect class="il-stone" x="0" y="100" width="160" height="20"/>
    <path class="il-yellow" d="M0 104h160v3H0z"/>
    <path class="il-line" d="M0 100h160"/>
    <ellipse class="il-water il-ink il-thin" cx="126" cy="112" rx="16" ry="4"/>
    <path class="il-grey il-ink" d="M48 120c0-20 12-28 32-28s32 8 32 28z"/>
    <path class="il-line il-thin" d="M80 94v26M70 98l10 8 10-8"/>
    <circle class="il-metal il-ink il-thin" cx="84" cy="108" r="1.6"/><circle class="il-metal il-ink il-thin" cx="84" cy="115" r="1.6"/>
    <rect class="il-skin il-ink" x="74" y="84" width="12" height="10"/>
    <circle class="il-skin il-ink" cx="63" cy="74" r="4"/><circle class="il-skin il-ink" cx="97" cy="74" r="4"/>
    <ellipse class="il-skin il-ink" cx="80" cy="74" rx="16" ry="16"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="72" r="3.6"/><circle class="il-dark" cx="74.5" cy="70.2" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="86" cy="72" r="3.6"/><circle class="il-dark" cx="85.5" cy="70.2" r="1.7"/>
    <path class="il-line il-thin" d="M80 74l-2 4h3"/>
    <path class="il-line" d="M73 82q7 5 14 0"/>
    <path class="il-paper il-ink" d="M52 62 80 34l28 28z"/>
    <path class="il-line" d="M71 46h18"/>
    <rect class="il-smoke il-ink il-thin" x="64" y="50" width="10" height="8"/>
    <path class="il-line il-thin" d="M64 58l3-4 3 3 4-5M77 51h15M77 54h16M77 57h17"/>
    <path class="il-paper il-ink" d="M48 59h56v9H48z"/>
    <path class="il-line il-thin" d="M52 62h14M52 65h12M70 62h14M70 65h14M88 62h12M88 65h10"/>
    <path class="il-smoke il-ink" d="M104 59h8l2 14-3 3-4-4-3-4z"/>
    <path class="il-line il-thin" d="M106 63l5 1M106 67l4 1"/>
    <ellipse class="il-water il-ink il-thin" cx="111" cy="81" rx="1.6" ry="2.4"/>
    <ellipse class="il-water il-ink il-thin" cx="112" cy="89" rx="1.4" ry="2.2"/>
    <path class="il-white il-ink il-thin" d="M122 60l3-6M128 64l6-4M120 54l-2-6"/>`,

  // A beaming stationmaster under a ridiculously golden, braided, starred cap; the tiny train behind him has only one carriage and stares at the bling.
  'rw.stationmaster-cap': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-yellow" d="M62 44 20 0h16zM62 44 60 0h10zM62 44 100 0h16zM62 44 0 30v-12zM62 44l70 4v12z" opacity="0.35"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-line il-thin" d="M100 102h60"/>
    <path class="il-dark il-ink il-thin" d="M118 76h7v-6h-9l2 6z"/>
    <rect class="il-green il-ink" x="106" y="76" width="26" height="20" rx="4"/>
    <rect class="il-sky il-ink il-thin" x="124" y="80" width="6" height="7" rx="1"/>
    <circle class="il-white il-ink il-thin" cx="111" cy="84" r="3"/><circle class="il-dark" cx="111.5" cy="82.5" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="118" cy="84" r="3"/><circle class="il-dark" cx="118.5" cy="82.5" r="1.4"/>
    <ellipse class="il-dark" cx="114.5" cy="91" rx="2" ry="2.4"/>
    <rect class="il-red il-ink" x="134" y="78" width="22" height="18" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="138" y="81" width="6" height="6" rx="1"/><rect class="il-sky il-ink il-thin" x="146" y="81" width="6" height="6" rx="1"/>
    <path class="il-line il-thin" d="M132 90h2"/>
    <circle class="il-dark il-ink il-thin" cx="112" cy="98" r="3.5"/><circle class="il-dark il-ink il-thin" cx="126" cy="98" r="3.5"/>
    <circle class="il-dark il-ink il-thin" cx="139" cy="98" r="3.5"/><circle class="il-dark il-ink il-thin" cx="151" cy="98" r="3.5"/>
    <path class="il-white il-ink il-thin" d="M124 66l1-4 1 4 4 1-4 1-1 4-1-4-4-1z"/>
    <path class="il-blue il-ink" d="M26 120c0-20 14-30 36-30s36 10 36 30z"/>
    <path class="il-gold il-ink il-thin" d="M28 102l14-8 2 5-14 8zM96 102l-14-8-2 5 14 8z"/>
    <path class="il-line il-thin" d="M30 107l-2 4M34 105l-2 4M92 107l2 4M88 105l2 4"/>
    <circle class="il-gold il-ink il-thin" cx="62" cy="104" r="2"/><circle class="il-gold il-ink il-thin" cx="62" cy="113" r="2"/>
    <path class="il-gold il-ink il-thin" d="M46 106l3 2 3-2v8h-6z"/><circle class="il-yellow il-ink il-thin" cx="49" cy="116" r="2.6"/>
    <g transform="translate(0 8)">
    <rect class="il-skin il-ink" x="56" y="82" width="12" height="10"/>
    <circle class="il-skin il-ink" cx="46" cy="72" r="4"/><circle class="il-skin il-ink" cx="78" cy="72" r="4"/>
    <ellipse class="il-skin il-ink" cx="62" cy="72" rx="16" ry="15"/>
    <path class="il-line il-thick" d="M52 70q3 2.5 6 0M66 70q3 2.5 6 0"/>
    <path class="il-line il-thin" d="M51 65l7 1M66 66l7-1"/>
    <path class="il-line il-thin" d="M62 71l-2 4h3"/>
    <path class="il-wood-dark il-ink il-thin" d="M48 76q-4 0-4-4 3 3 7 0 6-3 11 1 5-4 11-1 4 3 7 0 0 4-4 4-6 3-14-1-8 4-14 1z"/>
    <path class="il-line" d="M58 82q4 2 8 0"/>
    </g>
    <g transform="translate(0 -6)">
    <path class="il-gold il-ink" d="M34 52 26 33q36-17 72 0l-8 19z"/>
    <path class="il-light il-thin" d="M36 36q12-6 24-6"/>
    <path class="il-yellow il-ink" d="M62 26l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z"/>
    <rect class="il-gold il-ink" x="34" y="50" width="56" height="10" rx="1"/>
    <path class="il-line il-thin" d="M36 55l4-3 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-3"/>
    <path class="il-gold il-ink" d="M33 60h58q3 8-10 10-19 3-38 0-13-2-10-10z"/>
    <g class="il-yellow il-ink il-thin">
      <ellipse cx="42" cy="64" rx="3.4" ry="1.8" transform="rotate(-20 42 64)"/><ellipse cx="50" cy="66" rx="3.4" ry="1.8" transform="rotate(-10 50 66)"/>
      <ellipse cx="74" cy="66" rx="3.4" ry="1.8" transform="rotate(10 74 66)"/><ellipse cx="82" cy="64" rx="3.4" ry="1.8" transform="rotate(20 82 64)"/>
    </g>
    <circle class="il-yellow il-ink il-thin" cx="62" cy="66" r="2.6"/>
    <circle class="il-gold il-ink il-thin" cx="32" cy="55" r="3"/><circle class="il-gold il-ink il-thin" cx="92" cy="55" r="3"/>
    </g>
    <path class="il-white il-ink il-thin" d="M18 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white il-ink il-thin" d="M104 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white il-ink il-thin" d="M88 10l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-white il-ink il-thin" d="M30 4l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // A granny on the platform bench wears a see-through plastic rain bonnet that crinkles so loudly her neighbour plugs his ears.
  'rw.rain-bonnet': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin il-dash" d="M8 0l-6 18M30 4l-6 18M110 0l-6 18M150 6l-6 18M96 30l-6 18M14 40l-6 18M150 44l-6 18M120 20l-6 18"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line" d="M0 104h160"/>
    <rect class="il-wood il-ink" x="16" y="94" width="136" height="7" rx="1"/>
    <path class="il-line il-thick" d="M24 101v10M144 101v10"/>
    <path class="il-purple il-ink" d="M32 120c0-20 10-30 28-30s28 10 28 30z"/>
    <path class="il-line il-thin" d="M60 92v28M50 96l10 6 10-6"/>
    <circle class="il-gold il-ink il-thin" cx="64" cy="108" r="1.6"/><circle class="il-gold il-ink il-thin" cx="64" cy="115" r="1.6"/>
    <rect class="il-skin il-ink" x="54" y="80" width="12" height="10"/>
    <g class="il-beard il-ink il-thin">
      <circle cx="44" cy="62" r="6"/><circle cx="46" cy="52" r="6"/><circle cx="54" cy="46" r="6"/><circle cx="64" cy="45" r="6"/>
      <circle cx="73" cy="50" r="6"/><circle cx="77" cy="60" r="6"/><circle cx="44" cy="71" r="5"/><circle cx="77" cy="70" r="5"/>
    </g>
    <ellipse class="il-skin il-ink" cx="60" cy="68" rx="15" ry="16"/>
    <circle class="il-white il-ink il-thin" cx="54" cy="66" r="4.5"/><circle class="il-white il-ink il-thin" cx="66" cy="66" r="4.5"/>
    <path class="il-line il-thin" d="M58.5 66h3"/>
    <path class="il-line il-thin" d="M51.5 66.5q2.5-2.5 5 0M63.5 66.5q2.5-2.5 5 0"/>
    <circle class="il-pink" cx="50" cy="73" r="2.4"/><circle class="il-pink" cx="70" cy="73" r="2.4"/>
    <path class="il-line il-thin" d="M60 68l-1.5 4h2.5"/>
    <path class="il-line" d="M55 77q5 4 10 0"/>
    <path class="il-water il-ink il-thick" d="M35 77C24 28 96 28 85 77c-3-14-10-24-25-24s-22 10-25 24z" opacity="0.5"/>
    <path class="il-ink il-line" d="M35 77C24 28 96 28 85 77c-3-14-10-24-25-24s-22 10-25 24z"/>
    <path class="il-light" d="M41 52l3 4 3-4 3 4M55 39l3 4 3-4 3 4M70 42l3 4 3-3M40 66l3-3 2 4M78 64l3 3 2-4"/>
    <path class="il-line il-thin" d="M48 46l3-3 3 3M64 48l3-3 3 3M76 52l2 4"/>
    <path class="il-light" d="M44 40q7-7 16-8"/>
    <path class="il-line" d="M36 77l20 11M84 77l-20 11"/><path class="il-light il-thin" d="M36 77l20 11M84 77l-20 11"/>
    <path class="il-white il-ink il-thin" d="M60 88l-7-4v8zM60 88l7-4v8z"/>
    <path class="il-yellow il-ink il-thin" d="M24 36l4-2-2-4 5 1 1-5 3 4 4-2-1 5"/>
    <path class="il-yellow il-ink il-thin" d="M90 28l3 3 2-4 3 4 3-3 1 5"/>
    <path class="il-line" d="M18 52l5 2-4 3 5 2M96 48l4-3 1 5 4-3"/>
    <path class="il-green il-ink" d="M108 120c0-18 8-26 22-26s22 8 22 26z"/>
    <rect class="il-skin il-ink" x="125" y="84" width="10" height="10"/>
    <ellipse class="il-skin il-ink" cx="130" cy="72" rx="13" ry="14"/>
    <path class="il-dark il-ink" d="M117 68c0-12 6-16 13-16s13 4 13 16c-4-5-8-6-13-6s-9 1-13 6z"/>
    <path class="il-line" d="M121 70l5 2-5 2M139 70l-5 2 5 2"/>
    <rect class="il-white il-ink il-thin" x="123" y="78" width="14" height="6" rx="2"/>
    <path class="il-line il-thin" d="M127 78v6M130 78v6M133 78v6"/>
    <path class="il-green il-ink" d="M112 100q-6-14 2-28l6 2q-6 12-1 24zM148 100q6-14-2-28l-6 2q6 12 1 24z"/>
    <circle class="il-skin il-ink" cx="117" cy="71" r="4"/><circle class="il-skin il-ink" cx="143" cy="71" r="4"/>`,

  // A grinning track worker gives a thumbs-up while gravel, a drip and a frowning bad-news envelope all bounce "ping!" off his helmet.
  'rw.track-helmet': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-grey il-ink" x="-2" y="-2" width="164" height="14"/>
    <path class="il-line il-thin" d="M0 0l12 12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12"/>
    <circle class="il-metal il-ink il-thin" cx="12" cy="6" r="1.4"/><circle class="il-metal il-ink il-thin" cx="60" cy="6" r="1.4"/><circle class="il-metal il-ink il-thin" cx="108" cy="6" r="1.4"/><circle class="il-metal il-ink il-thin" cx="148" cy="6" r="1.4"/>
    <rect class="il-stone" x="0" y="100" width="160" height="20"/>
    <path class="il-line" d="M0 100h160"/>
    <g class="il-wood-dark il-ink il-thin"><rect x="4" y="106" width="12" height="5"/><rect x="26" y="106" width="12" height="5"/><rect x="122" y="106" width="12" height="5"/><rect x="144" y="106" width="12" height="5"/></g>
    <path class="il-metal il-ink il-thin" d="M0 104h50v2H0zM110 104h50v2h-50zM0 113h50v2H0zM110 113h50v2h-50z"/>
    <path class="il-blue il-ink" d="M50 120c0-20 12-30 30-30s30 10 30 30z"/>
    <path class="il-orange il-ink" d="M56 120c0-16 6-26 14-28l10 10 10-10c8 2 14 12 14 28z"/>
    <path class="il-white il-ink il-thin" d="M57 108h46v4H57zM64 96l4 12M96 96l-4 12"/>
    <rect class="il-skin il-ink" x="74" y="82" width="12" height="10"/>
    <circle class="il-skin il-ink" cx="64" cy="72" r="4"/><circle class="il-skin il-ink" cx="96" cy="72" r="4"/>
    <ellipse class="il-skin il-ink" cx="80" cy="72" rx="15" ry="15"/>
    <path class="il-line" d="M71 70q3-3 6 0M83 70q3-3 6 0"/>
    <path class="il-line il-thin" d="M80 72l-2 4h3"/>
    <path class="il-white il-ink il-thin" d="M72 79q8 8 16 0z"/>
    <circle class="il-pink" cx="69" cy="77" r="2.4"/><circle class="il-pink" cx="91" cy="77" r="2.4"/>
    <path class="il-yellow il-ink" d="M58 63c0-26 44-26 44 0z"/>
    <path class="il-yellow il-ink" d="M54 61h52q2 6-4 6H58q-6 0-4-6z"/>
    <path class="il-line il-thin" d="M80 40v21M72 42q-4 8-4 19M88 42q4 8 4 19"/>
    <path class="il-light il-thin" d="M64 54q2-8 8-11"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="56" r="3"/>
    <path class="il-blue il-ink" d="M106 104q12-6 14-20l-7-2q-2 10-10 14z"/>
    <circle class="il-skin il-ink" cx="118" cy="80" r="5.5"/>
    <rect class="il-skin il-ink il-thin" x="115.5" y="68" width="4.5" height="10" rx="2.2"/>
    <ellipse class="il-stone il-ink il-thin" cx="64" cy="30" rx="4" ry="3"/>
    <path class="il-line il-thin" d="M66 38l-1 4M62 36l-3 3"/>
    <ellipse class="il-stone il-ink il-thin" cx="96" cy="24" rx="3" ry="2.4"/>
    <ellipse class="il-stone il-ink il-thin" cx="50" cy="20" rx="2.6" ry="2"/>
    <path class="il-line il-thin" d="M93 30l-2 6M54 26l4 6"/>
    <ellipse class="il-water il-ink il-thin" cx="80" cy="20" rx="2" ry="3"/>
    <path class="il-yellow il-ink il-thin" d="M80 36l1.5 3 3 1-3 1-1.5 3-1.5-3-3-1 3-1z"/>
    <path class="il-yellow il-ink il-thin" d="M66 46l1.2 2.4 2.4 1-2.4 1-1.2 2.4-1.2-2.4-2.4-1 2.4-1z"/>
    <g transform="rotate(18 120 36)">
      <rect class="il-white il-ink" x="108" y="28" width="24" height="16" rx="1"/>
      <path class="il-line il-thin" d="M108 28l12 9 12-9"/>
      <circle class="il-dark" cx="115" cy="38" r="1.2"/><circle class="il-dark" cx="125" cy="38" r="1.2"/>
      <path class="il-line il-thin" d="M116 43q4-3 8 0"/>
    </g>
    <path class="il-line il-thin" d="M102 46l4-2M104 52l5 0M100 40l3-4"/>`,

  // A flustered commuter frantically pats his twelve-pocket jacket while the conductor's hand waits; the ticket peeks out of the one pocket he isn't checking.
  'rw.commuter-jacket': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-yellow" d="M0 108h160v3H0z"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-wood il-ink" d="M44 120V100c0-10 12-16 28-16s28 6 28 16v20z"/>
    <path class="il-line il-thin" d="M72 86v34"/>
    <path class="il-wood il-ink" d="M46 94 26 72l8-7 20 20z"/>
    <path class="il-wood il-ink" d="M98 94l20-22-8-7-20 20z"/>
    <circle class="il-skin il-ink" cx="28" cy="66" r="5.5"/><circle class="il-skin il-ink" cx="116" cy="66" r="5.5"/>
    <g class="il-wood-dark il-ink il-thin">
      <rect x="48" y="92" width="9" height="8" rx="1"/><rect x="59" y="92" width="9" height="8" rx="1"/>
      <rect x="76" y="92" width="9" height="8" rx="1"/><rect x="87" y="92" width="9" height="8" rx="1"/>
      <rect x="48" y="106" width="9" height="9" rx="1"/><rect x="59" y="106" width="9" height="9" rx="1"/>
      <rect x="76" y="106" width="9" height="9" rx="1"/>
      <rect x="35" y="76" width="7" height="6" rx="1" transform="rotate(45 38.5 79)"/><rect x="42" y="83" width="7" height="6" rx="1" transform="rotate(45 45.5 86)"/>
      <rect x="102" y="76" width="7" height="6" rx="1" transform="rotate(-45 105.5 79)"/><rect x="95" y="83" width="7" height="6" rx="1" transform="rotate(-45 98.5 86)"/>
    </g>
    <g transform="rotate(-20 92 104)"><rect class="il-paper il-ink il-thin" x="88" y="98" width="9" height="10" rx="1"/><path class="il-line il-thin il-dash" d="M88 102h9"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="87" y="106" width="9" height="9" rx="1"/>
    <path class="il-line il-thin" d="M48 95h9M59 95h9M76 95h9M87 95h9M48 109h9M59 109h9M76 109h9M87 109h9"/>
    <rect class="il-skin il-ink" x="66" y="76" width="12" height="10"/>
    <circle class="il-skin il-ink" cx="56" cy="64" r="4"/><circle class="il-skin il-ink" cx="88" cy="64" r="4"/>
    <ellipse class="il-skin il-ink" cx="72" cy="64" rx="16" ry="16"/>
    <path class="il-wood-dark il-ink" d="M56 60c0-14 8-18 16-18s16 4 16 18c-4-6-10-8-16-8s-12 2-16 8z"/>
    <path class="il-line" d="M58 54l7-3M86 54l-7-3"/>
    <circle class="il-white il-ink il-thin" cx="65" cy="62" r="4"/><circle class="il-dark" cx="63" cy="62.5" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="79" cy="62" r="4"/><circle class="il-dark" cx="77" cy="62.5" r="1.8"/>
    <path class="il-line il-thin" d="M72 64l-2 4h3"/>
    <path class="il-white il-ink il-thin" d="M64 74l3-2 3 2 3-2 3 2 3-2v3l-3 2-3-2-3 2-3-2-3 2z"/>
    <ellipse class="il-water il-ink il-thin" cx="90" cy="54" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="54" cy="52" rx="1.8" ry="2.8"/>
    <path class="il-line il-thin" d="M20 60l-4-3M18 68h-5M24 56l-2-5M124 60l4-3M126 68h5M120 56l2-5"/>
    <path class="il-light il-thick" d="M60 30q0-8 7-8t7 7q0 5-7 6v4"/><circle class="il-white" cx="67" cy="44" r="2"/>
    <path class="il-light" d="M82 26q0-6 5-6t5 5q0 4-5 5v3"/><circle class="il-white" cx="87" cy="37" r="1.6"/>
    <rect class="il-blue il-ink" x="140" y="34" width="24" height="14" rx="3"/>
    <path class="il-gold il-ink il-thin" d="M142 34h3v14h-3z"/>
    <path class="il-skin il-ink" d="M140 38q-18-2-20 6 2 4 10 4h10z"/>
    <path class="il-skin il-ink il-thin" d="M134 39q-2-6 2-7 3 0 2 7z"/>
    <path class="il-line il-thin" d="M124 44h10"/>
    <path class="il-line il-thin" d="M146 26l2-4M152 26l0-5M140 28l-2-4"/>`,

  // A knight in riveted green boiler-plate armour with brass bands, a smokebox-door chest plate and a puffing mini chimney gleams proudly while the floorboards crack beneath him.
  'rw.boiler-armour': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-sky il-ink" d="M118 50V24a16 16 0 0 1 32 0v26z"/>
    <path class="il-line il-thin" d="M134 8v42M118 30h32"/>
    <path class="il-sky il-ink" d="M10 50V24a16 16 0 0 1 32 0v26z"/>
    <path class="il-line il-thin" d="M26 8v42M10 30h32"/>
    <path class="il-wood" d="M0 100h50q30 8 60 0h50v20H0z"/>
    <path class="il-line" d="M0 100h50q30 8 60 0h50"/>
    <path class="il-line il-thin" d="M0 110h44M116 110h44M22 100v20M138 100v20"/>
    <path class="il-line" d="M56 112l-6 8M64 110l2 10M98 110l6 10M104 110l-4 6 6 4"/>
    <circle class="il-smoke il-ink il-thin" cx="48" cy="108" r="4"/><circle class="il-smoke il-ink il-thin" cx="112" cy="108" r="4"/><circle class="il-smoke il-ink il-thin" cx="42" cy="104" r="2.6"/>
    <rect class="il-green il-ink" x="64" y="88" width="13" height="18" rx="2"/>
    <rect class="il-green il-ink" x="83" y="88" width="13" height="18" rx="2"/>
    <path class="il-gold il-ink il-thin" d="M64 96h13v3H64zM83 96h13v3H83z"/>
    <rect class="il-dark il-ink" x="58" y="102" width="20" height="9" rx="3"/>
    <rect class="il-dark il-ink" x="82" y="102" width="20" height="9" rx="3"/>
    <rect class="il-green il-ink" x="40" y="58" width="12" height="28" rx="5"/>
    <rect class="il-green il-ink" x="108" y="58" width="12" height="28" rx="5"/>
    <circle class="il-metal il-ink" cx="46" cy="88" r="6"/><circle class="il-metal il-ink" cx="114" cy="88" r="6"/>
    <rect class="il-green il-ink" x="52" y="54" width="56" height="40" rx="10"/>
    <path class="il-gold il-ink il-thin" d="M52 59h56v4H52zM52 86h56v4H52z"/>
    <circle class="il-dark il-ink" cx="80" cy="74" r="11"/>
    <g class="il-metal"><circle cx="80" cy="65" r="1.3"/><circle cx="89" cy="74" r="1.3"/><circle cx="80" cy="83" r="1.3"/><circle cx="71" cy="74" r="1.3"/><circle cx="86.4" cy="67.6" r="1.3"/><circle cx="73.6" cy="67.6" r="1.3"/><circle cx="86.4" cy="80.4" r="1.3"/><circle cx="73.6" cy="80.4" r="1.3"/></g>
    <path class="il-gold il-ink il-thin" d="M74 73h12v2H74zM79 68h2v12h-2z"/>
    <g class="il-dark"><circle cx="57" cy="70" r="1.2"/><circle cx="57" cy="80" r="1.2"/><circle cx="103" cy="70" r="1.2"/><circle cx="103" cy="80" r="1.2"/></g>
    <path class="il-green il-ink" d="M40 62a12 10 0 0 1 22-6v8H40zM120 62a12 10 0 0 0-22-6v8h22z"/>
    <path class="il-light il-thin" d="M44 58q4-4 10-4M56 66v12"/>
    <rect class="il-gold il-ink il-thin" x="68" y="49" width="24" height="6" rx="2"/>
    <ellipse class="il-green il-ink" cx="80" cy="36" rx="18" ry="16"/>
    <rect class="il-dark il-ink" x="66" y="33" width="28" height="7" rx="3"/>
    <circle class="il-white" cx="74" cy="36.5" r="2"/><circle class="il-white" cx="86" cy="36.5" r="2"/>
    <g class="il-dark"><circle cx="66" cy="27" r="1.1"/><circle cx="73" cy="23" r="1.1"/><circle cx="80" cy="22" r="1.1"/><circle cx="87" cy="23" r="1.1"/><circle cx="94" cy="27" r="1.1"/></g>
    <path class="il-gold il-ink il-thin" d="M63 43h34v3H63z"/>
    <path class="il-light il-thin" d="M68 26q4-5 10-6"/>
    <path class="il-dark il-ink" d="M75 21v-5h-3v-4h16v4h-3v5z"/>
    <circle class="il-smoke il-ink il-thin" cx="90" cy="6" r="4"/><circle class="il-smoke il-ink il-thin" cx="99" cy="9" r="3"/><circle class="il-smoke il-ink il-thin" cx="82" cy="4" r="3"/>
    <path class="il-white il-ink il-thin" d="M104 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white il-ink il-thin" d="M58 44l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-white il-ink il-thin" d="M98 72l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // A passenger snuggles into a chunky knitted jumper (with a little house-on-wheels pattern), sipping tea in a train seat he has decorated with a plant and a framed picture.
  'rw.travel-jumper': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="6" y="10" width="62" height="40" rx="6"/>
    <path class="il-grass il-ink il-thin" d="M7 40q14-12 28-4t32-6v14a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6z"/>
    <path class="il-light il-thin" d="M14 20h14M36 16h18M24 28h10"/>
    <circle class="il-yellow il-ink il-thin" cx="56" cy="22" r="5"/>
    <rect class="il-wood il-ink" x="4" y="52" width="58" height="6" rx="1"/>
    <path class="il-line il-thick" d="M30 58v24"/>
    <path class="il-earth il-ink" d="M10 52l2-10h14l2 10z"/>
    <g class="il-green il-ink il-thin"><circle cx="14" cy="36" r="5"/><circle cx="24" cy="35" r="5"/><circle cx="19" cy="30" r="5"/></g>
    <path class="il-white il-ink il-thin" d="M40 52v-8h10v8z"/><path class="il-white il-ink il-thin" d="M50 46q4 0 4 3t-4 3"/>
    <rect class="il-wood il-ink" x="128" y="8" width="26" height="20" rx="1"/>
    <rect class="il-sky il-ink il-thin" x="131" y="11" width="20" height="14"/>
    <path class="il-grass il-ink il-thin" d="M131 25v-4q6-5 10-1 5-4 10 0v5z"/>
    <circle class="il-yellow" cx="146" cy="15" r="2"/>
    <path class="il-line il-thin" d="M141 8l-5-6M141 8l5-6"/>
    <rect class="il-red il-ink" x="70" y="30" width="72" height="90" rx="12"/>
    <rect class="il-white il-ink il-thin" x="84" y="30" width="44" height="12" rx="3"/>
    <path class="il-line il-thin" d="M76 60v50M136 60v50"/>
    <path class="il-orange il-ink" d="M66 120c0-26 16-38 40-38s40 12 40 38z"/>
    <path class="il-line il-thin" d="M80 92l2 4-2 4 2 4-2 4 2 4M132 92l-2 4 2 4-2 4 2 4-2 4M88 116v4M124 116v4" opacity="0.5"/>
    <rect class="il-white il-ink il-thin" x="96" y="98" width="20" height="10"/>
    <path class="il-red il-ink il-thin" d="M94 98l12-8 12 8z"/>
    <rect class="il-sky il-ink il-thin" x="102" y="100" width="6" height="5"/>
    <circle class="il-dark il-ink il-thin" cx="100" cy="110" r="2.4"/><circle class="il-dark il-ink il-thin" cx="112" cy="110" r="2.4"/>
    <path class="il-line il-thin" d="M92 113h28"/>
    <rect class="il-orange il-ink" x="94" y="74" width="24" height="12" rx="4"/>
    <path class="il-line il-thin" d="M99 75v10M104 75v10M109 75v10M114 75v10"/>
    <circle class="il-skin il-ink" cx="91" cy="60" r="4"/><circle class="il-skin il-ink" cx="121" cy="60" r="4"/>
    <ellipse class="il-skin il-ink" cx="106" cy="60" rx="15" ry="16"/>
    <path class="il-wood-dark il-ink" d="M91 56c0-14 7-18 15-18s15 4 15 18c-4-6-9-7-15-7s-11 1-15 7z"/>
    <path class="il-line" d="M97 61q3 2.5 6 0M109 61q3 2.5 6 0"/>
    <circle class="il-pink" cx="96" cy="67" r="2.6"/><circle class="il-pink" cx="116" cy="67" r="2.6"/>
    <path class="il-line" d="M102 69q4 3 8 0"/>
    <path class="il-orange il-ink" d="M72 108q4-12 14-14l4 8q-8 2-10 10z"/>
    <rect class="il-blue il-ink" x="80" y="88" width="13" height="14" rx="2"/>
    <path class="il-blue il-ink il-thin" d="M93 91q5 0 5 4t-5 4"/>
    <circle class="il-skin il-ink" cx="84" cy="100" r="4"/>
    <path class="il-light il-thin" d="M83 92h7"/>
    <path class="il-red il-ink il-thin" d="M86 82l-3-3a2 2 0 0 1 3-2.5 2 2 0 0 1 3 2.5z"/>
    <path class="il-line il-thin" d="M83 86q-2-2 0-4M90 86q2-2 0-4"/>`,

  // A grinning stoker in soot-black overalls has a soot-black face except two clean rings where his goggles were; his "smell" lines carry little coal lumps and a star of adventure.
  'rw.sooty-overalls': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <ellipse class="il-torch" cx="23" cy="60" rx="34" ry="30"/>
    <rect class="il-dark il-ink" x="4" y="38" width="38" height="44" rx="4"/>
    <rect class="il-orange il-ink" x="10" y="48" width="26" height="24" rx="9"/>
    <path class="il-yellow" d="M14 72q2-12 6-8 2-10 6-4 3-8 6 2 2-2 2 10z"/>
    <path class="il-red" d="M18 72q2-6 4-3 2-5 4 0 2-3 4 3z"/>
    <rect class="il-wood-dark il-ink" x="-2" y="82" width="164" height="40"/>
    <path class="il-metal il-ink il-thin" d="M44 4h116v6H44z"/>
    <circle class="il-white il-ink" cx="58" cy="24" r="7"/><path class="il-red il-ink il-thin" d="M58 24l4-4"/>
    <circle class="il-white il-ink" cx="140" cy="24" r="7"/><path class="il-line il-thin" d="M140 24l-3-5"/>
    <path class="il-metal il-ink il-thin" d="M58 10v7M140 10v7"/>
    <g class="il-dark il-ink il-thin"><path d="M128 120l6-12 8 2 6-8 8 6 4 12z"/></g>
    <path class="il-light il-thin" d="M138 112l2-2M148 108l2 2"/>
    <path class="il-white il-ink" d="M66 120c0-24 12-34 30-34s30 10 30 34z"/>
    <path class="il-blue il-ink" d="M70 120V96h52v24z"/>
    <rect class="il-blue il-ink" x="82" y="88" width="28" height="22" rx="2"/>
    <path class="il-blue il-ink il-thin" d="M84 88l-8-6 3-2 8 6zM108 88l8-6-3-2-8 6z"/>
    <circle class="il-metal il-ink il-thin" cx="86" cy="92" r="2"/><circle class="il-metal il-ink il-thin" cx="106" cy="92" r="2"/>
    <rect class="il-blue il-ink il-thin" x="90" y="96" width="12" height="9" rx="1"/>
    <rect class="il-red il-ink il-thin" x="74" y="108" width="10" height="9"/>
    <path class="il-light il-thin il-dash" d="M74 108h10M74 117h10"/>
    <g class="il-dark" opacity="0.6"><ellipse cx="100" cy="112" rx="5" ry="3"/><ellipse cx="114" cy="100" rx="3" ry="4"/><ellipse cx="88" cy="102" rx="3" ry="2"/><ellipse cx="78" cy="98" rx="2.4" ry="3"/></g>
    <path class="il-skin il-ink" d="M70 98q-10 6-6 16l8-2q-2-6 2-8z"/>
    <path class="il-skin il-ink" d="M122 98q10 6 6 16l-8-2q2-6-2-8z"/>
    <path class="il-dark" d="M66 106l6 2 1 4-6-1zM126 106l-6 2-1 4 6-1z" opacity="0.6"/>
    <rect class="il-skin il-ink" x="90" y="76" width="12" height="10"/>
    <circle class="il-skin il-ink" cx="80" cy="64" r="4"/><circle class="il-skin il-ink" cx="112" cy="64" r="4"/>
    <ellipse class="il-skin il-ink" cx="96" cy="64" rx="16" ry="16"/>
    <ellipse class="il-dark" cx="96" cy="64" rx="15" ry="15" opacity="0.65"/>
    <circle class="il-skin il-ink il-thin" cx="89" cy="62" r="6"/><circle class="il-skin il-ink il-thin" cx="103" cy="62" r="6"/>
    <circle class="il-white il-ink il-thin" cx="89" cy="62" r="3.6"/><circle class="il-dark" cx="89.5" cy="62" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="103" cy="62" r="3.6"/><circle class="il-dark" cx="103.5" cy="62" r="1.7"/>
    <path class="il-white il-ink il-thin" d="M86 71q10 9 20 0z"/>
    <path class="il-line il-thin" d="M91 71v3M96 71v4M101 71v3"/>
    <path class="il-dark il-ink" d="M80 54c0-12 8-16 16-16s16 4 16 16z"/>
    <path class="il-dark il-ink" d="M96 54h20q2 4-4 4H96z"/>
    <path class="il-metal il-ink il-thin" d="M80 50h32v3H80z"/>
    <circle class="il-metal il-ink il-thin" cx="89" cy="48" r="4.5"/><circle class="il-metal il-ink il-thin" cx="103" cy="48" r="4.5"/>
    <circle class="il-water" cx="89" cy="48" r="2.4" opacity="0.7"/><circle class="il-water" cx="103" cy="48" r="2.4" opacity="0.7"/>
    <path class="il-light il-thin" d="M68 46q-6-6 0-12t0-12M124 46q6-6 0-12t0-12M132 52q5-5 0-10t0-10"/>
    <path class="il-dark il-ink il-thin" d="M62 30l4-2 3 3-3 3-4-1z"/><path class="il-dark il-ink il-thin" d="M128 16l4-2 3 3-3 3-4-1z"/>
    <path class="il-yellow il-ink il-thin" d="M136 34l1.5 3.5 3.5 0.5-2.6 2.4 0.8 3.6-3.2-2-3.2 2 0.8-3.6-2.6-2.4 3.5-0.5z"/>`,

  // A track worker sprints away in a hi-vis vest that glows like a lamp, so the googly-eyed thing in the tunnel spots him at once ("!").
  'rw.track-vest': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone il-ink" x="-2" y="16" width="60" height="88"/>
    <path class="il-line il-thin" d="M0 28h56M0 40h56M0 52h56M0 64h56M0 76h56M0 88h56M14 16v12M38 16v12M26 28v12M50 28v12M14 40v12M38 40v12"/>
    <path class="il-cave il-ink" d="M8 104V66a20 20 0 0 1 40 0v38z"/>
    <ellipse class="il-yellow il-ink" cx="22" cy="74" rx="6" ry="7"/><circle class="il-dark" cx="25" cy="75" r="2.6"/>
    <ellipse class="il-yellow il-ink" cx="36" cy="74" rx="6" ry="7"/><circle class="il-dark" cx="39" cy="75" r="2.6"/>
    <path class="il-light" d="M16 64l7 3M42 64l-7 3"/>
    <rect class="il-white il-ink il-thin" x="27" y="50" width="4" height="9" rx="2"/><circle class="il-white il-ink il-thin" cx="29" cy="62.5" r="2"/>
    <rect class="il-earth-dark" x="0" y="104" width="160" height="16"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-metal il-ink il-thin" d="M0 108h160v2.5H0zM0 115h160v2.5H0z"/>
    <circle class="il-glow" cx="108" cy="64" r="34" opacity="0.35"/>
    <path class="il-glow il-ink il-thin" d="M108 22l2-10h-4zM146 64l10 2v-4zM70 64l-10 2v-4zM136 34l8-7-3-3zM80 34l-8-7 3-3zM138 94l7 7 3-3z"/>
    <path class="il-light" d="M60 52h-14M64 62h-18M62 72h-12"/>
    <circle class="il-smoke il-ink il-thin" cx="76" cy="100" r="4"/><circle class="il-smoke il-ink il-thin" cx="68" cy="98" r="3"/>
    <path class="il-blue il-ink" d="M98 82 80 92l3 6 20-8z"/>
    <path class="il-blue il-ink" d="M110 84l14 10-4 8 6 0 4-10-14-12z"/>
    <path class="il-dark il-ink" d="M72 90l10-2 2 9-12 1z"/>
    <path class="il-dark il-ink" d="M118 100h14l2 4h-16z"/>
    <g transform="rotate(14 108 72)">
      <rect class="il-blue il-ink" x="96" y="58" width="24" height="28" rx="5"/>
      <path class="il-orange il-ink" d="M96 62q0-4 6-4h3l3 10 3-10h3q6 0 6 4v24H96z"/>
      <path class="il-white il-ink il-thin" d="M96 72h24v3.5H96zM96 79h24v3.5H96z"/>
    </g>
    <path class="il-blue il-ink" d="M116 64l14-8 3 5-14 8z"/>
    <circle class="il-skin il-ink" cx="134" cy="57" r="4.5"/>
    <path class="il-blue il-ink" d="M100 66 86 74l3 5 14-7z"/>
    <circle class="il-skin il-ink" cx="85" cy="77" r="4.5"/>
    <circle class="il-skin il-ink" cx="125" cy="46" r="3.6"/>
    <ellipse class="il-skin il-ink" cx="112" cy="46" rx="13" ry="13"/>
    <path class="il-yellow il-ink" d="M98 42c0-20 28-20 28 0z"/>
    <path class="il-yellow il-ink" d="M96 40h32q1 4-3 4H99q-4 0-3-4z"/>
    <path class="il-light il-thin" d="M102 34q2-6 7-8"/>
    <circle class="il-white il-ink il-thin" cx="104" cy="50" r="3.8"/><circle class="il-dark" cx="102" cy="50" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="115" cy="50" r="3.8"/><circle class="il-dark" cx="113" cy="50" r="1.8"/>
    <ellipse class="il-dark il-ink il-thin" cx="109" cy="57" rx="2.6" ry="2.4"/>
    <ellipse class="il-water il-ink il-thin" cx="128" cy="36" rx="1.8" ry="2.8"/><ellipse class="il-water il-ink il-thin" cx="96" cy="50" rx="1.6" ry="2.4"/>`,

  // A wooden railway sleeper has dropped onto a steel-capped work boot and snapped in two; the boot just gleams while its owner keeps whistling.
  'rw.track-boots': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="70" width="160" height="50"/>
    <path class="il-line" d="M0 70h160"/>
    <path class="il-metal il-ink" d="M0 76h160v4H0z"/>
    <g class="il-grey"><circle cx="10" cy="90" r="2"/><circle cx="26" cy="112" r="2.4"/><circle cx="62" cy="114" r="2"/><circle cx="150" cy="88" r="2.2"/><circle cx="140" cy="114" r="2"/><circle cx="96" cy="116" r="1.8"/><circle cx="6" cy="110" r="1.6"/></g>
    <rect class="il-orange il-ink" x="22" y="-4" width="24" height="66"/>
    <rect class="il-orange il-ink" x="90" y="-4" width="24" height="66"/>
    <path class="il-white il-ink il-thin" d="M22 40h24v5H22zM90 40h24v5H90z"/>
    <g transform="translate(0 0)">
      <path class="il-wood-dark il-ink" d="M18 58h30v20h12q18 0 20 16v8H16V66q0-4 2-8z"/>
      <rect class="il-dark il-ink" x="17" y="54" width="32" height="7" rx="3"/>
      <path class="il-line il-thin" d="M38 64l8 4M38 70l8 4M38 76l10 4M46 64l-8 4M46 70l-8 4"/>
      <path class="il-light il-thin il-dash" d="M20 98h56"/>
      <path class="il-dark il-ink" d="M14 102h68v7H14z"/>
      <path class="il-grey" d="M20 106h5v3h-5zM32 106h5v3h-5zM44 106h5v3h-5zM56 106h5v3h-5zM68 106h5v3h-5z"/>
      <path class="il-metal il-ink" d="M58 78h4q16 0 18 16v8H58z"/>
      <path class="il-light il-thin" d="M64 83q8 1 11 9"/>
    </g>
    <g transform="translate(68 0)">
      <path class="il-wood-dark il-ink" d="M18 58h30v20h12q18 0 20 16v8H16V66q0-4 2-8z"/>
      <rect class="il-dark il-ink" x="17" y="54" width="32" height="7" rx="3"/>
      <path class="il-line il-thin" d="M38 64l8 4M38 70l8 4M38 76l10 4M46 64l-8 4M46 70l-8 4"/>
      <path class="il-light il-thin il-dash" d="M20 98h56"/>
      <path class="il-dark il-ink" d="M14 102h68v7H14z"/>
      <path class="il-grey" d="M20 106h5v3h-5zM32 106h5v3h-5zM44 106h5v3h-5zM56 106h5v3h-5zM68 106h5v3h-5z"/>
      <path class="il-metal il-ink" d="M58 78h4q16 0 18 16v8H58z"/>
      <path class="il-light il-thin" d="M64 83q8 1 11 9"/>
    </g>
    <g transform="rotate(-28 112 70)">
      <path class="il-wood-dark il-ink" d="M74 60h38l-3 4 4 3-4 3 3 4H74z"/>
      <path class="il-line il-thin" d="M78 64h22M80 69h20M112 64l5-2M113 70l5 1"/>
    </g>
    <g transform="rotate(30 140 70)">
      <path class="il-wood-dark il-ink" d="M122 60h40v14h-38l3-4-4-3 4-3z"/>
      <path class="il-line il-thin" d="M130 64h24M128 69h26M120 63l-4-2M119 70l-5 1"/>
    </g>
    <circle class="il-smoke il-ink il-thin" cx="120" cy="80" r="4"/><circle class="il-smoke il-ink il-thin" cx="150" cy="78" r="3.4"/>
    <path class="il-yellow il-ink il-thin" d="M124 56l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z"/>
    <path class="il-yellow il-ink il-thin" d="M146 52l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z"/>
    <path class="il-white il-ink il-thin" d="M140 88l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z"/>
    <path class="il-line" d="M60 30V18l8-2v12"/><circle class="il-dark" cx="58" cy="30" r="2.6"/><circle class="il-dark" cx="66" cy="28" r="2.6"/>
    <path class="il-line" d="M76 16V6"/><path class="il-line il-thin" d="M76 6q5 1 5 6"/><circle class="il-dark" cx="74" cy="16" r="2.6"/>`,

  // A pair of mirror-polished uniform shoes skids across the shiny station floor; the front toe reflects the wearer's shocked little face and a wet-floor sign has toppled.
  'rw.polished-shoes': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 20h160M40 0v20M100 0v20"/>
    <rect class="il-stone" x="0" y="84" width="160" height="36"/>
    <path class="il-line" d="M0 84h160"/>
    <path class="il-light il-thin" d="M8 94h30M100 100h40M20 112h50" opacity="0.7"/>
    <path class="il-line il-thin" d="M8 104h24M14 110h18"/>
    <path class="il-blue il-ink" d="M50 -4h24l18 76H70z"/>
    <path class="il-red" d="M60 -4h3l17 76h-3z"/>
    <path class="il-blue il-ink" d="M22 -4h22L30 50 12 40z"/>
    <path class="il-red" d="M30 -4h3L20 46l-3-2z"/>
    <g transform="rotate(-40 18 52)">
      <path class="il-dark il-ink" d="M4 46h18q12 0 16 8v6H4z"/>
      <path class="il-wood-dark il-ink" d="M2 60h38v5H2z"/>
      <path class="il-light il-thin" d="M10 50h10"/>
    </g>
    <path class="il-dark il-ink" d="M64 68h26q20 0 26 10v8H64z"/>
    <path class="il-wood-dark il-ink" d="M62 86h56v5H62z"/>
    <path class="il-light" d="M72 72h12M94 72q8 1 12 5"/>
    <circle class="il-skin il-ink il-thin" cx="104" cy="80" r="3.8"/>
    <circle class="il-dark" cx="102.6" cy="79.3" r="0.8"/><circle class="il-dark" cx="105.4" cy="79.3" r="0.8"/>
    <ellipse class="il-dark" cx="104" cy="82" rx="1" ry="1.2"/>
    <path class="il-line il-thin" d="M70 74l6 2M70 78l6-2"/>
    <path class="il-white il-ink il-thin" d="M86 60l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white il-ink il-thin" d="M30 30l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z"/>
    <path class="il-white il-ink il-thin" d="M120 66l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z"/>
    <path class="il-line" d="M30 94h26M40 98h20M50 102h12"/>
    <g transform="rotate(-28 136 106)">
      <path class="il-yellow il-ink" d="M126 76h20l6 30h-32z"/>
      <rect class="il-dark" x="134" y="84" width="4" height="11" rx="2"/><circle class="il-dark" cx="136" cy="99" r="2.2"/>
    </g>`,

  // A commuter in a suit dashes for his connection on bright sprinter shoes, so fast that his bowler hat is left hanging in mid-air; the station clock ticks to departure.
  'rw.connection-sprinters': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-teal il-ink" x="118" y="30" width="50" height="66" rx="6"/>
    <rect class="il-dark il-ink" x="126" y="44" width="16" height="52"/>
    <rect class="il-sky il-ink il-thin" x="146" y="40" width="12" height="16" rx="2"/>
    <path class="il-white il-ink il-thin" d="M142 66h18v4h-18z"/>
    <rect class="il-stone" x="0" y="96" width="160" height="24"/>
    <path class="il-yellow" d="M0 100h160v3H0z"/>
    <path class="il-line" d="M0 96h160"/>
    <path class="il-line il-thick" d="M24 0v8"/>
    <circle class="il-white il-ink" cx="24" cy="22" r="14"/>
    <path class="il-line il-thin" d="M24 9.5v2M36.5 22h-2M24 34.5v-2M11.5 22h2"/>
    <path class="il-line" d="M24 22v-11M24 22l-2-8"/>
    <circle class="il-red" cx="24" cy="22" r="1.6"/>
    <path class="il-dark il-ink" d="M34 52c0-10 16-10 16 0z"/>
    <path class="il-dark il-ink" d="M30 52h24q1 3-3 3H33q-4 0-3-3z"/>
    <path class="il-line il-thin" d="M28 44l-6-2M28 50h-7M58 44l4-3"/>
    <circle class="il-smoke il-ink il-thin" cx="30" cy="92" r="6"/><circle class="il-smoke il-ink il-thin" cx="20" cy="88" r="4"/><circle class="il-smoke il-ink il-thin" cx="40" cy="94" r="4"/>
    <path class="il-light" d="M46 58h-16M48 68h-20M44 78h-14"/>
    <path class="il-grey il-ink" d="M84 82 64 86l-2 8 24-4z"/>
    <path class="il-grey il-ink" d="M96 80l12 10-6 6 6 2 6-8-14-14z"/>
    <path class="il-red il-ink" d="M46 88l16-2 4 8-20 2q-4-4 0-8z"/>
    <path class="il-white il-ink il-thin" d="M52 87l2 8M57 87l2 8"/>
    <path class="il-yellow il-ink il-thin" d="M44 96h22v3H44z"/>
    <path class="il-red il-ink" d="M102 98l16-6 4 6-18 6q-5-2-2-6z"/>
    <path class="il-white il-ink il-thin" d="M108 96l3 6M113 94l3 6"/>
    <path class="il-yellow il-ink il-thin" d="M102 104l20-6 1 3-20 6z"/>
    <g transform="rotate(16 90 66)">
      <rect class="il-grey il-ink" x="78" y="52" width="26" height="30" rx="5"/>
      <path class="il-white il-ink il-thin" d="M86 52l5 8 5-8z"/>
    </g>
    <path class="il-red il-ink il-thin" d="M88 56l-22-4 1 5 21 3z"/>
    <path class="il-grey il-ink" d="M100 62l16 6-2 5-16-5z"/>
    <path class="il-line il-thin" d="M118 72v4"/>
    <rect class="il-wood-dark il-ink" x="108" y="76" width="22" height="15" rx="2" transform="rotate(-10 119 83)"/>
    <path class="il-gold il-ink il-thin" d="M117 77h4v3h-4z" transform="rotate(-10 119 83)"/>
    <circle class="il-skin il-ink" cx="118" cy="71" r="4.5"/>
    <path class="il-grey il-ink" d="M84 64 68 70l2 5 16-5z"/>
    <circle class="il-skin il-ink" cx="66" cy="73" r="4"/>
    <circle class="il-skin il-ink" cx="103" cy="46" r="3.6"/>
    <ellipse class="il-skin il-ink" cx="94" cy="44" rx="13" ry="13"/>
    <path class="il-dark il-ink" d="M81 40c0-12 6-15 13-15s13 3 13 15c-3-4-8-5-13-5s-10 1-13 5z"/>
    <path class="il-line" d="M88 37l6 3M104 38l-5 2"/>
    <circle class="il-white il-ink il-thin" cx="92" cy="44" r="3.4"/><circle class="il-dark" cx="94" cy="44" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="101" cy="44" r="3"/><circle class="il-dark" cx="102.6" cy="44" r="1.5"/>
    <rect class="il-white il-ink il-thin" x="91" y="50" width="12" height="5" rx="2"/>
    <path class="il-line il-thin" d="M94 50v5M97 50v5M100 50v5"/>
    <ellipse class="il-water il-ink il-thin" cx="82" cy="34" rx="1.8" ry="2.8"/>`,

  // Shiny green galoshes stomp happily into a puddle under a dripping station roof; a pigeon beside them splashes along in its own tiny galoshes.
  'rw.galoshes': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="-2" y="-2" width="164" height="10"/>
    <path class="il-metal il-ink" d="M0 8h160v6H0z"/>
    <ellipse class="il-water il-ink il-thin" cx="30" cy="24" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="30" cy="38" rx="2" ry="3"/>
    <ellipse class="il-water il-ink il-thin" cx="130" cy="22" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="112" cy="34" rx="2" ry="3"/>
    <rect class="il-stone" x="0" y="80" width="160" height="40"/>
    <path class="il-line" d="M0 80h160"/>
    <ellipse class="il-water il-ink" cx="74" cy="104" rx="66" ry="10"/>
    <path class="il-light il-thin" d="M30 104h16M96 108h20"/>
    <rect class="il-grey il-ink" x="40" y="14" width="22" height="58"/>
    <path class="il-line il-thin" d="M51 20v50"/>
    <rect class="il-grey il-ink" x="78" y="14" width="22" height="80"/>
    <path class="il-line il-thin" d="M89 20v70"/>
    <path class="il-green il-ink" d="M36 64h28v10h12q10 0 10 9v3H34z"/>
    <path class="il-dark il-ink" d="M34 86h52v4H34z"/>
    <path class="il-light il-thin" d="M40 68h8M70 78q6 0 8 4"/>
    <path class="il-green il-ink" d="M74 86h28v10h12q10 0 10 9v3H72z"/>
    <path class="il-dark il-ink" d="M72 108h52v4H72z"/>
    <path class="il-light il-thin" d="M78 90h8M108 100q6 0 8 4"/>
    <path class="il-water-line" d="M66 100q-10-12-18-14M124 100q8-12 18-12M70 98l-4-14M118 98l6-16"/>
    <circle class="il-water il-ink il-thin" cx="46" cy="84" r="2"/><circle class="il-water il-ink il-thin" cx="144" cy="86" r="2"/>
    <circle class="il-water il-ink il-thin" cx="64" cy="80" r="1.6"/><circle class="il-water il-ink il-thin" cx="126" cy="78" r="1.6"/>
    <path class="il-line il-thin" d="M30 54l-4-4M28 62h-6M110 70l4-4"/>
    <path class="il-dark il-ink il-thin" d="M152 92l6-6 0 8z"/>
    <ellipse class="il-grey il-ink" cx="144" cy="94" rx="10" ry="7"/>
    <path class="il-line il-thin" d="M140 92q5 5 11 1"/>
    <circle class="il-grey il-ink" cx="134" cy="84" r="5.5"/>
    <path class="il-teal" d="M130.5 87.5q3.5 3 7.5 1l-0.5 3q-4 1-7-1.5z"/>
    <circle class="il-white il-ink il-thin" cx="132.5" cy="83" r="2"/><circle class="il-dark" cx="132" cy="83.2" r="0.9"/>
    <path class="il-orange il-ink il-thin" d="M129 85l-4 1.2 4 1.2z"/>
    <path class="il-line il-thin" d="M141 101v3M147 101v3"/>
    <path class="il-green il-ink il-thin" d="M138 104h6v3h-6zM145 104h6v3h-6z"/>`,

  // A smug commuter tilts his umbrella like a shield: rain bounces off the top, a pigeon perches on it in vain, and a chatty neighbour's word-bubble bonks off the side.
  'rw.commuter-umbrella': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin il-dash" d="M10 0l-4 14M40 4l-4 14M70 0l-4 14M104 0l-4 14M130 6l-4 14M154 0l-4 14M118 26l-4 14M150 30l-4 14M8 30l-4 14"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-yellow" d="M0 108h160v3H0z"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-wood il-ink" d="M4 120c0-20 10-28 28-28s28 8 28 28z"/>
    <path class="il-line il-thin" d="M32 94v26M22 96l10 8 10-8"/>
    <circle class="il-wood-dark il-ink il-thin" cx="26" cy="110" r="1.6"/><circle class="il-wood-dark il-ink il-thin" cx="38" cy="110" r="1.6"/>
    <rect class="il-skin il-ink" x="26" y="82" width="12" height="10"/>
    <circle class="il-skin il-ink" cx="17" cy="70" r="4"/><circle class="il-skin il-ink" cx="47" cy="70" r="4"/>
    <ellipse class="il-skin il-ink" cx="32" cy="70" rx="15" ry="15"/>
    <path class="il-dark il-ink" d="M17 66c0-12 7-16 15-16s15 4 15 16c-4-5-9-6-15-6s-11 1-15 6z"/>
    <path class="il-line" d="M24 70q3 2.5 6 0M35 70q3 2.5 6 0"/>
    <path class="il-line il-thin" d="M23 65l7 1M35 66l7-1M32 71l-1.5 4h2.5"/>
    <path class="il-line" d="M28 79q6 3 9-2"/>
    <path class="il-wood il-ink" d="M44 104q4-12 6-20l7 1q-1 10-6 21z"/>
    <g transform="rotate(25 64 52)">
      <path class="il-line il-thick" d="M64 52v34q0 7-5 7t-5-5"/>
      <path class="il-blue il-ink" d="M34 52q0-30 30-30t30 30q-5-5-10 0-5-5-10 0-5-5-10 0-5-5-10 0-5-5-10 0-5-5-10 0z"/>
      <path class="il-line il-thin" d="M64 22q-12 12-10 30M64 22q12 12 10 30M64 22q-24 10-20 30M64 22q24 10 20 30"/>
      <path class="il-light il-thin" d="M44 38q6-10 16-13"/>
      <path class="il-dark il-ink il-thin" d="M62 22l2-6 2 6z"/>
    </g>
    <circle class="il-skin il-ink" cx="50" cy="84" r="4.6"/>
    <path class="il-water-line" d="M44 32l-6-6M86 44l6-6M66 24l-2-8"/>
    <path class="il-dark il-ink il-thin" d="M84 20l10-2-4 7z"/>
    <ellipse class="il-grey il-ink" cx="78" cy="21" rx="9" ry="6" transform="rotate(25 78 21)"/>
    <circle class="il-grey il-ink" cx="70" cy="12" r="5"/>
    <circle class="il-white il-ink il-thin" cx="68.6" cy="11" r="1.9"/><circle class="il-dark" cx="68" cy="11.5" r="0.9"/>
    <path class="il-line il-thin" d="M66 8l4 1.6"/>
    <path class="il-orange il-ink il-thin" d="M65.5 13l-4 1.4 4 1z"/>
    <path class="il-white il-ink" d="M98 62h28a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-6l6 8-14-8h-14a6 6 0 0 1-6-6V68a6 6 0 0 1 6-6z"/>
    <path class="il-line il-thin" d="M98 68q4-3 8 0t8 0 8 0M98 74q4-3 8 0t8 0 8 0M98 80q4-3 8 0t8 0"/>
    <path class="il-line" d="M90 64l-6-2M90 72h-7M92 80l-6 3"/>
    <path class="il-purple il-ink" d="M110 120c0-16 8-22 24-22s24 6 24 22z"/>
    <rect class="il-skin il-ink" x="129" y="90" width="10" height="9"/>
    <ellipse class="il-skin il-ink" cx="134" cy="80" rx="12" ry="13"/>
    <path class="il-orange il-ink" d="M121 78c-4-16 6-22 13-22s17 6 13 22c-2-8-7-12-13-12s-11 4-13 12z"/>
    <circle class="il-white il-ink il-thin" cx="129" cy="79" r="3"/><circle class="il-dark" cx="128" cy="79.5" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="139" cy="79" r="3"/><circle class="il-dark" cx="138" cy="79.5" r="1.4"/>
    <path class="il-line il-thin" d="M126 74l5-1M137 73l5 1"/>
    <ellipse class="il-dark il-ink il-thin" cx="133" cy="87" rx="3.4" ry="2.4"/>`,

  // A stoker holds out a coal shovel with glowing coals and a little shivering ice monster warms its paws over it, smiling as its icicles drip.
  'rw.coal-shovel': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <ellipse class="il-torch" cx="18" cy="44" rx="32" ry="30"/>
    <rect class="il-dark il-ink" x="-2" y="20" width="40" height="56" rx="4"/>
    <rect class="il-orange il-ink" x="4" y="30" width="28" height="28" rx="10"/>
    <path class="il-yellow" d="M8 58q2-12 6-8 2-10 6-4 3-8 6 2 2-2 4 10z"/>
    <path class="il-red" d="M12 58q2-6 4-3 2-5 4 0 2-3 4 3z"/>
    <rect class="il-dark" x="0" y="104" width="160" height="16"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-metal il-ink il-thin" d="M40 4h120v6H40z"/>
    <circle class="il-white il-ink" cx="140" cy="22" r="7"/><path class="il-red il-ink il-thin" d="M140 22l4-4"/>
    <path class="il-metal il-ink il-thin" d="M140 10v5"/>
    <path class="il-wood il-ink" d="M82 82l44-28 5 6-44 28z"/>
    <path class="il-wood il-ink" d="M126 50q4-10 14-8l4 6q-4 10-14 10z"/>
    <path class="il-cave il-ink il-thin" d="M130 50q3-4 8-3l2 3q-2 5-7 4z"/>
    <path class="il-blue il-ink" d="M164 48l-40 6 2 12 38-2z"/>
    <path class="il-blue il-ink" d="M164 82l-58-16-4 12 62 22z"/>
    <path class="il-light il-thin" d="M150 52v12M146 86l-3 9"/>
    <circle class="il-wood-dark il-ink" cx="123" cy="59" r="7"/>
    <circle class="il-wood-dark il-ink" cx="103" cy="72" r="7.5"/>
    <path class="il-line il-thin" d="M119 56l6 6M99 69l7 6"/>
    <path class="il-metal il-ink" d="M44 82l40-8 12 22q-26 12-50 6z"/>
    <path class="il-metal il-ink il-thin" d="M84 74l3 6-4 2z"/>
    <ellipse class="il-torch" cx="68" cy="86" rx="22" ry="12"/>
    <g class="il-dark il-ink il-thin"><path d="M52 92l6-6 7 2 1 6-7 3z"/><path d="M64 86l7-4 6 3-1 7-7 1z"/><path d="M76 90l7-4 6 4-2 6-7 1z"/><path d="M58 98l6-3 6 2-2 4-8 0z"/></g>
    <path class="il-orange" d="M57 90l3-2 2 2-2 3zM69 87l3-2 2 2-2 3zM81 91l3-2 2 2-2 3zM63 98l2-1 2 1-2 1.5z"/>
    <path class="il-red" d="M60 92l1-1 1 1-1 1zM72 88l1-1 1 1-1 1z"/>
    <path class="il-light il-thin" d="M58 78q-3-4 0-8t0-8M70 76q-3-4 0-8t0-8M82 78q-3-4 0-8t0-8"/>
    <path class="il-water il-ink" d="M14 104c-4-22 6-34 18-34s22 12 18 34z"/>
    <path class="il-white il-ink il-thin" d="M18 104l2 4 2-4 2 5 2-5 2 4 2-4 2 5 2-5 2 4 2-4 2 5 2-5 2 4 2-4"/>
    <path class="il-white" d="M20 76q6-6 12-5l-2 4q-5 0-8 3z" opacity="0.8"/>
    <ellipse class="il-water il-ink" cx="50" cy="86" rx="8" ry="4.5" transform="rotate(-15 50 86)"/>
    <ellipse class="il-water il-ink" cx="50" cy="97" rx="8" ry="4.5" transform="rotate(10 50 97)"/>
    <path class="il-line" d="M24 84q3-3 6 0M34 84q3-3 6 0"/>
    <circle class="il-pink" cx="22" cy="90" r="2.4"/><circle class="il-pink" cx="42" cy="90" r="2.4"/>
    <path class="il-line" d="M27 92q5 4 10 0"/>
    <path class="il-light il-thin" d="M26 66q-3-4 0-8M36 66q3-4 0-8"/>
    <ellipse class="il-water il-ink il-thin" cx="20" cy="114" rx="1.4" ry="2.2"/><ellipse class="il-water il-ink il-thin" cx="40" cy="115" rx="1.4" ry="2.2"/>
    <path class="il-white il-ink il-thin" d="M10 82l-4-2M10 88h-5M12 76l-3-4"/>`,
};
