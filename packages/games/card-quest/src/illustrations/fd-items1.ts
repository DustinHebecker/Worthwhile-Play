/* Fridge illustrations: items1. */
export const FD_ITEMS1: Readonly<Record<string, string>> = {
  // A proud tomato chef wears a chef’s hat so tall that it squashes against the shelf above; a small radish in a stubby hat stares up in envy.
  'fd.chef-hat': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="4" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 6h10M60 6h6M120 6h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="9" width="164" height="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <rect class="il-white il-ink" x="13" y="66" width="22" height="42"/>
    <path class="il-white il-ink" d="M13 66l5-12h12l5 12z"/>
    <rect class="il-white il-ink il-thin" x="18" y="50" width="12" height="4"/>
    <rect class="il-blue" x="14" y="80" width="20" height="10"/>
    <ellipse class="il-dark il-ink il-thin" cx="61" cy="107" rx="7" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="81" cy="107" rx="7" ry="3"/>
    <path class="il-line il-thick" d="M51 90q-10 0-12-10M92 92q8 2 10-6"/>
    <circle class="il-green il-ink il-thin" cx="38" cy="78" r="4"/>
    <circle class="il-green il-ink il-thin" cx="102" cy="85" r="4"/>
    <circle class="il-red il-ink" cx="71" cy="86" r="22"/>
    <path class="il-light" d="M55 82q1-8 8-11"/>
    <path class="il-light il-thin" d="M88 96q2-2 3-5"/>
    <circle class="il-white il-ink il-thin" cx="63" cy="84" r="5"/>
    <circle class="il-dark" cx="64" cy="83" r="2.3"/>
    <circle class="il-white il-ink il-thin" cx="79" cy="84" r="5"/>
    <circle class="il-dark" cx="80" cy="83" r="2.3"/>
    <path class="il-red il-ink il-thin" d="M58 84a5 5 0 0 1 10 0zM74 84a5 5 0 0 1 10 0z"/>
    <path class="il-line" d="M57 76q6-4 11-1M74 75q6-3 11 1"/>
    <path class="il-dark il-ink il-thin" d="M63 93q8 8 16 0z"/>
    <circle class="il-pink" cx="57" cy="92" r="3"/>
    <circle class="il-pink" cx="86" cy="92" r="3"/>
    <path class="il-white il-ink" d="M56 58 50 27h42l-6 31z"/>
    <path class="il-line il-thin" d="M63 56l-3-27M71 56V29M79 56l3-27"/>
    <path class="il-white il-ink" d="M46 31c-8-1-10-15-3-19h56c7 4 5 18-3 19-4 3-10 3-13 0-4 3-10 3-13 0-4 3-10 3-13 0-4 3-8 3-11 0z"/>
    <path class="il-line il-thin" d="M58 30q2-8 8-12M84 30q-2-8-8-12"/>
    <rect class="il-white il-ink" x="53" y="56" width="36" height="11" rx="2"/>
    <path class="il-line il-thin" d="M59 57v9M65 57v9M71 57v9M77 57v9M83 57v9"/>
    <path class="il-line il-thin" d="M36 15l-6-3M35 22h-7M106 15l6-3M107 22h7"/>
    <path class="il-white il-ink il-thin" d="M108 39L109.4 42.6L113 44L109.4 45.4L108 49L106.6 45.4L103 44L106.6 42.6z"/>
    <path class="il-white il-ink il-thin" d="M36 40L37.12 42.88L40 44L37.12 45.12L36 48L34.88 45.12L32 44L34.88 42.88z"/>
    <path class="il-white il-ink il-thin" d="M102 61L102.84 63.16L105 64L102.84 64.84L102 67L101.16 64.84L99 64L101.16 63.16z"/>
    <ellipse class="il-dark il-ink il-thin" cx="123" cy="107" rx="4" ry="2"/>
    <ellipse class="il-dark il-ink il-thin" cx="134" cy="107" rx="4" ry="2"/>
    <circle class="il-red il-ink" cx="128" cy="95" r="12"/>
    <path class="il-white il-ink il-thin" d="M119 101q9 6 18 0q-3 6-9 6t-9-6z"/>
    <circle class="il-white il-ink il-thin" cx="124" cy="94" r="3"/>
    <circle class="il-dark" cx="123.2" cy="92.6" r="1.38"/>
    <circle class="il-white il-ink il-thin" cx="132" cy="94" r="3"/>
    <circle class="il-dark" cx="131.2" cy="92.6" r="1.38"/>
    <ellipse class="il-dark" cx="128" cy="101" rx="1.6" ry="2"/>
    <rect class="il-white il-ink il-thin" x="121" y="82" width="14" height="4" rx="1"/>
    <path class="il-white il-ink il-thin" d="M122 82c-3-1-3-6 1-6 0-3 5-4 6-1 2-3 7-1 6 2 3 1 2 5-1 5z"/>
    <path class="il-water il-ink il-thin" d="M142 84.8c1.6 2.4 2.72 3.68 2.72 4.8a2.72 2.72 0 0 1-5.44 0c0-1.12 1.12-2.4 2.72-4.8z"/>`,

  // At night in the dark fridge an egg with a headlamp and a cheese snack shines into the very back, where a fuzzy mould blob squints and shields its eyes.
  'fd.headlamp': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v104M151 0v104"/>
    <rect class="il-grey il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="99" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 101h10M60 101h6M120 101h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="104" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="112" width="160" height="8"/>
    <rect class="il-water il-ink" opacity="0.6" x="138" y="58" width="18" height="46" rx="3"/>
    <rect class="il-red il-ink" x="137" y="51" width="20" height="6" rx="2" transform="rotate(-14 147 54)"/>
    <polygon class="il-glow" opacity="0.32" points="74,58 160,26 160,104 74,72"/>
    <path class="il-light il-thin" opacity="0.6" d="M80 60l14-6M82 66h16M80 72l14 6"/>
    <path class="il-slime il-ink" d="M104 102c-7-10-5-24 6-30 2-10 14-14 22-8 10-4 21 4 18 14 8 6 8 18 2 24z"/>
    <circle class="il-green" cx="112" cy="90" r="3"/>
    <circle class="il-green" cx="140" cy="74" r="2.5"/>
    <circle class="il-green" cx="136" cy="96" r="3.5"/>
    <circle class="il-green" cx="121" cy="98" r="2"/>
    <circle class="il-green" cx="146" cy="88" r="2"/>
    <path class="il-line il-thin" d="M108 72l-2-3M117 66l-1-3M127 63v-3M138 64l2-3M148 72l3-2M154 86l3 0"/>
    <path class="il-line" d="M114 79l6 3-6 3M137 79l-6 3 6 3"/>
    <path class="il-line il-thin" d="M112 72l8 3M139 72l-8 3"/>
    <path class="il-line" d="M117 94q3-3 6 0t6 0t6 0"/>
    <path class="il-slime il-ink" d="M104 86c-8-4-10-12-6-16 4-2 8 2 10 8z"/>
    <path class="il-slime il-ink" d="M150 84c8-4 8-12 3-15-4-1-7 3-8 9z"/>
    <path class="il-line il-thin" d="M116 60q4-4 0-8t0-8"/>
    <path class="il-line il-thin" d="M130 56q4-4 0-8t0-8"/>
    <path class="il-line il-thin" d="M144 60q4-4 0-8t0-8"/>
    <ellipse class="il-dark il-ink il-thin" cx="36" cy="103" rx="7" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="55" cy="103" rx="7" ry="3"/>
    <path class="il-line il-thick" d="M26 86q-8-2-10-10"/>
    <path class="il-yellow il-ink il-thin" d="M4 76l15.4-9.9l2.2 9.9z"/>
    <circle class="il-gold" cx="13.9" cy="73.14" r="1.76"/>
    <circle class="il-gold" cx="18.85" cy="70.5" r="1.21"/>
    <circle class="il-white il-ink il-thin" cx="15" cy="76" r="3.5"/>
    <ellipse class="il-white il-ink" cx="45" cy="74" rx="21" ry="28"/>
    <path class="il-light" d="M30 58q4-8 10-10"/>
    <path class="il-dark il-ink il-thin" d="M24 64q21-9 42 0v6q-21-9-42 0z"/>
    <rect class="il-metal il-ink" x="58" y="58" width="14" height="12" rx="3"/>
    <circle class="il-glow il-ink il-thin" cx="72" cy="64" r="4.6"/>
    <circle class="il-white il-ink il-thin" cx="40" cy="80" r="4.5"/>
    <circle class="il-dark" cx="41.8" cy="80" r="2.07"/>
    <circle class="il-white il-ink il-thin" cx="53" cy="80" r="4.5"/>
    <circle class="il-dark" cx="54.8" cy="80" r="2.07"/>
    <path class="il-line il-thin" d="M35 73l8 1M49 74l8-2"/>
    <path class="il-line" d="M39 90q7 6 14-1"/>
    <path class="il-line il-thick" d="M64 88q6 2 8 8"/>
    <circle class="il-white il-ink il-thin" cx="72" cy="97" r="3.5"/>`,

  // A pickle jar has tipped over on the shelf above; gherkin slices rain down and bounce off the upside-down salad bowl on a grinning lemon’s head.
  'fd.salad-bowl-helmet': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v112M151 0v112"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,112 10,112"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="21" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 23h10M60 23h6M120 23h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="26" width="164" height="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="107" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 109h10M60 109h6M120 109h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="112" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="120" width="160" height="0"/>
    <rect class="il-water il-ink" opacity="0.85" x="4" y="7" width="34" height="16" rx="3"/>
    <circle class="il-green il-ink" cx="14" cy="15" r="4.5"/>
    <circle class="il-slime" cx="14" cy="15" r="2.7"/>
    <circle class="il-dark" cx="12.88" cy="14.1" r="0.8"/>
    <circle class="il-dark" cx="15.26" cy="14.55" r="0.8"/>
    <circle class="il-dark" cx="14" cy="16.35" r="0.8"/>
    <circle class="il-green il-ink" cx="26" cy="16" r="4.5"/>
    <circle class="il-slime" cx="26" cy="16" r="2.7"/>
    <circle class="il-dark" cx="24.88" cy="15.1" r="0.8"/>
    <circle class="il-dark" cx="27.26" cy="15.55" r="0.8"/>
    <circle class="il-dark" cx="26" cy="17.35" r="0.8"/>
    <rect class="il-metal il-ink il-thin" x="38" y="9" width="4" height="12"/>
    <circle class="il-red il-ink" cx="56" cy="15" r="6"/>
    <circle class="il-red il-ink il-thin" cx="56" cy="15" r="3"/>
    <path class="il-line il-thin" d="M64 12h6M64 17h5"/>
    <path class="il-water il-ink il-thin" d="M46 31.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <circle class="il-green il-ink" cx="70" cy="38" r="6"/>
    <circle class="il-slime" cx="70" cy="38" r="3.6"/>
    <circle class="il-dark" cx="68.5" cy="36.8" r="0.8"/>
    <circle class="il-dark" cx="71.68" cy="37.4" r="0.8"/>
    <circle class="il-dark" cx="70" cy="39.8" r="0.8"/>
    <path class="il-line il-thin" d="M66 28v-4M72 28v-5"/>
    <circle class="il-green il-ink" cx="118" cy="40" r="6"/>
    <circle class="il-slime" cx="118" cy="40" r="3.6"/>
    <circle class="il-dark" cx="116.5" cy="38.8" r="0.8"/>
    <circle class="il-dark" cx="119.68" cy="39.4" r="0.8"/>
    <circle class="il-dark" cx="118" cy="41.8" r="0.8"/>
    <path class="il-line il-thin" d="M102 46q6-10 12-8M108 50q4-6 8-6"/>
    <circle class="il-green il-ink" cx="94" cy="18" r="5"/>
    <circle class="il-slime" cx="94" cy="18" r="3"/>
    <circle class="il-dark" cx="92.75" cy="17" r="0.8"/>
    <circle class="il-dark" cx="95.4" cy="17.5" r="0.8"/>
    <circle class="il-dark" cx="94" cy="19.5" r="0.8"/>
    <path class="il-line il-thin" d="M90 10v-4M96 10v-5"/>
    <ellipse class="il-dark il-ink il-thin" cx="68" cy="112" rx="7" ry="2.5"/>
    <ellipse class="il-dark il-ink il-thin" cx="92" cy="112" rx="7" ry="2.5"/>
    <path class="il-yellow il-ink" d="M48 92l-7-4v8zM112 92l7-4v8z"/>
    <ellipse class="il-yellow il-ink" cx="80" cy="92" rx="32" ry="21"/>
    <circle class="il-gold" cx="58" cy="100" r="1"/>
    <circle class="il-gold" cx="62" cy="106" r="1"/>
    <circle class="il-gold" cx="102" cy="102" r="1"/>
    <circle class="il-gold" cx="98" cy="108" r="1"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="91" r="5"/>
    <circle class="il-dark" cx="70.6" cy="89" r="2.3"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="91" r="5"/>
    <circle class="il-dark" cx="90.6" cy="89" r="2.3"/>
    <path class="il-line" d="M63 83q6-3 12 0M85 83q6-3 12 0"/>
    <path class="il-dark il-ink il-thin" d="M70 100q10 9 20 0z"/>
    <path class="il-white" d="M73 101h14l-1 2H74z"/>
    <path class="il-line il-thick" d="M110 98q10 0 13-10"/>
    <circle class="il-yellow il-ink il-thin" cx="124" cy="86" r="4.5"/>
    <path class="il-yellow il-ink il-thin" d="M122 82v-6q3-1 3 1v5z"/>
    <path class="il-green il-ink il-thin" d="M41 79c-5 4-4 11 1 11 2 4 7 2 7-2 4-1 4-7 0-9z"/>
    <path class="il-line il-thin" d="M44 81l1 6"/>
    <path class="il-green il-ink il-thin" d="M112 78c6 2 8 10 3 12-2 3-6 1-6-2-4-2-2-8 3-10z"/>
    <path class="il-teal il-ink" d="M44 78c0-20 16-32 36-32s36 12 36 32z"/>
    <path class="il-white il-ink il-thin" d="M66 47l2-6h24l2 6c-9-2-19-2-28 0z"/>
    <path class="il-white il-ink il-thin" opacity="0.9" d="M48 70q32-8 64 0l1 4q-33-8-66 0z"/>
    <circle class="il-white" cx="60" cy="60" r="2"/>
    <circle class="il-white" cx="72" cy="55" r="2"/>
    <circle class="il-white" cx="88" cy="55" r="2"/>
    <circle class="il-white" cx="100" cy="60" r="2"/>
    <circle class="il-white" cx="80" cy="62" r="2"/>
    <path class="il-light" d="M54 64q4-10 12-14"/>
    <rect class="il-teal il-ink" x="39" y="75" width="82" height="6" rx="3"/>
    <circle class="il-green il-ink" cx="132" cy="108" r="4"/>
    <circle class="il-slime" cx="132" cy="108" r="2.4"/>
    <circle class="il-dark" cx="131" cy="107.2" r="0.8"/>
    <circle class="il-dark" cx="133.12" cy="107.6" r="0.8"/>
    <circle class="il-dark" cx="132" cy="109.2" r="0.8"/>
    <circle class="il-green il-ink" cx="22" cy="108" r="4"/>
    <circle class="il-slime" cx="22" cy="108" r="2.4"/>
    <circle class="il-dark" cx="21" cy="107.2" r="0.8"/>
    <circle class="il-dark" cx="23.12" cy="107.6" r="0.8"/>
    <circle class="il-dark" cx="22" cy="109.2" r="0.8"/>
    <circle class="il-green il-ink" cx="82" cy="30" r="5"/>
    <circle class="il-slime" cx="82" cy="30" r="3"/>
    <circle class="il-dark" cx="80.75" cy="29" r="0.8"/>
    <circle class="il-dark" cx="83.4" cy="29.5" r="0.8"/>
    <circle class="il-dark" cx="82" cy="31.5" r="0.8"/>
    <path class="il-line il-thin" d="M74 42l-3-3M90 42l3-3"/>`,

  // A smug breakfast egg sits enthroned in a golden egg cup shaped like a crown with jewels, while a slice of toast bows deeply before it.
  'fd.egg-cup-crown': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <rect class="il-white il-ink" x="16" y="80" width="18" height="28" rx="4"/>
    <path class="il-metal il-ink" d="M16 82c0-8 18-8 18 0z"/>
    <circle class="il-dark" cx="22" cy="76" r="0.9"/>
    <circle class="il-dark" cx="25" cy="74.5" r="0.9"/>
    <circle class="il-dark" cx="28" cy="76" r="0.9"/>
    <circle class="il-white il-ink il-thin" cx="22" cy="92" r="2.6"/>
    <circle class="il-dark" cx="22.8" cy="91.4" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="29" cy="92" r="2.6"/>
    <circle class="il-dark" cx="29.8" cy="91.4" r="1.2"/>
    <path class="il-line il-thin" d="M22 100q3 2 6 0"/>
    <path class="il-red il-ink il-thin" d="M38 70l-4-4a2.6 2.6 0 0 1 4-3 2.6 2.6 0 0 1 4 3z"/>
    <ellipse class="il-white il-ink" cx="80" cy="40" rx="21" ry="28"/>
    <path class="il-light" d="M66 26q3-8 10-11"/>
    <path class="il-line" d="M68 36q4 3 8 0M84 36q4 3 8 0"/>
    <path class="il-line il-thin" d="M67 29q5-4 10-2M83 27q5-2 10 2"/>
    <path class="il-line" d="M75 48q6 4 12-2"/>
    <circle class="il-pink" cx="66" cy="43" r="3"/>
    <circle class="il-pink" cx="94" cy="43" r="3"/>
    <ellipse class="il-gold il-ink" cx="80" cy="103" rx="22" ry="5"/>
    <path class="il-gold il-ink" d="M72 101c2-5 2-9 0-13h16c-2 4-2 8 0 13z"/>
    <path class="il-gold il-ink" d="M52 64 55 52 63 60 69 50 76 58 80 46 84 58 91 50 97 60 105 52 108 64C106 80 96 90 80 90S54 80 52 64z"/>
    <circle class="il-gold il-ink il-thin" cx="55" cy="51" r="2"/>
    <circle class="il-gold il-ink il-thin" cx="69" cy="49" r="2"/>
    <circle class="il-gold il-ink il-thin" cx="80" cy="45" r="2"/>
    <circle class="il-gold il-ink il-thin" cx="91" cy="49" r="2"/>
    <circle class="il-gold il-ink il-thin" cx="105" cy="51" r="2"/>
    <path class="il-line il-thin" d="M54 67q26 6 52 0"/>
    <circle class="il-red il-ink il-thin" cx="66" cy="75" r="3"/>
    <circle class="il-blue il-ink il-thin" cx="80" cy="77" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="94" cy="75" r="3"/>
    <path class="il-light" d="M60 72q2 8 8 12"/>
    <path class="il-white il-ink il-thin" d="M40 19L41.4 22.6L45 24L41.4 25.4L40 29L38.6 25.4L35 24L38.6 22.6z"/>
    <path class="il-white il-ink il-thin" d="M120 15L121.4 18.6L125 20L121.4 21.4L120 25L118.6 21.4L115 20L118.6 18.6z"/>
    <path class="il-white il-ink il-thin" d="M114 39L114.84 41.16L117 42L114.84 42.84L114 45L113.16 42.84L111 42L113.16 41.16z"/>
    <path class="il-white il-ink il-thin" d="M46 51L46.84 53.16L49 54L46.84 54.84L46 57L45.16 54.84L43 54L45.16 53.16z"/>
    <g transform="rotate(-28 134 106)">
    <ellipse class="il-dark il-ink il-thin" cx="128" cy="106" rx="4" ry="2"/>
    <ellipse class="il-dark il-ink il-thin" cx="140" cy="106" rx="4" ry="2"/>
    <path class="il-wood il-ink" d="M120 104V80c-5-2-5-13 4-13h20c9 0 9 11 4 13v24z"/>
    <path class="il-paper" d="M124 101V79c-4-1-3-8 2-8h16c5 0 6 7 2 8v22z"/>
    <path class="il-line il-thin" d="M127 82q3 2 5 0M136 82q3 2 5 0M130 90q4 3 8 0"/>
    <path class="il-line il-thick" d="M120 90q-8 4-10 12"/>
    </g>`,

  // A radish wears a frosty bag of frozen peas as a hat; it is thawing, dripping on its face into a puddle, and one pea escapes down its cheek.
  'fd.frozen-peas-hat': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <ellipse class="il-water" opacity="0.85" cx="80" cy="107" rx="40" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="70" cy="106" rx="7" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="90" cy="106" rx="7" ry="3"/>
    <path class="il-line il-thick" d="M57 88q-10 2-12 8M103 88q10 0 12-8"/>
    <circle class="il-red il-ink il-thin" cx="45" cy="97" r="3.6"/>
    <circle class="il-red il-ink il-thin" cx="115" cy="79" r="3.6"/>
    <path class="il-green il-ink" d="M58 66c-12-4-18 4-12 8 4 1 9-2 12-8zM102 64c12-6 18 2 13 7-4 1-9-1-13-7z"/>
    <circle class="il-red il-ink" cx="80" cy="82" r="24"/>
    <path class="il-white il-ink il-thin" d="M64 98q16 10 32 0q-5 8-16 8t-16-8z"/>
    <path class="il-light" d="M60 80q1-6 4-9"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="82" r="5"/>
    <circle class="il-dark" cx="71.4" cy="79.8" r="2.3"/>
    <circle class="il-white il-ink il-thin" cx="89" cy="82" r="5"/>
    <circle class="il-dark" cx="89.4" cy="79.8" r="2.3"/>
    <path class="il-line il-thin" d="M65 74l9 1M86 75l9-1"/>
    <path class="il-line" d="M71 95q4-3 6 0t6 0t6 0"/>
    <path class="il-blue il-ink" d="M52 68c-3-15 8-28 28-28s31 13 28 28c-1 6-5 8-7 3-3 6-8 6-10 0-3 6-9 6-11 0-3 6-8 6-11 0-3 6-8 5-10 0-2 5-6 3-7-3z"/>
    <path class="il-metal il-ink il-thin" d="M64 44l3-5 3 4 3-5 3 4 3-5 3 4 3-5 3 4 3-5 3 4 3-5 2 5c-12-4-26-4-38 1z"/>
    <circle class="il-green il-ink il-thin" cx="66" cy="54" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="78" cy="50" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="90" cy="54" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="72" cy="61" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="85" cy="62" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="99" cy="60" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="60" cy="63" r="3"/>
    <path class="il-light il-thin" d="M58 52l2 1M96 46l2 1M104 54l1 2M84 45l2 0"/>
    <path class="il-light" d="M62 50l2-3"/>
    <path class="il-light" d="M104 44v12M98 47l12 6M98 53l12-6"/>
    <path class="il-water il-ink il-thin" d="M63 73.4c1.8 2.7 3.06 4.14 3.06 5.4a3.06 3.06 0 0 1-6.12 0c0-1.26 1.26-2.7 3.06-5.4z"/>
    <path class="il-water il-ink il-thin" d="M98 72.4c1.8 2.7 3.06 4.14 3.06 5.4a3.06 3.06 0 0 1-6.12 0c0-1.26 1.26-2.7 3.06-5.4z"/>
    <path class="il-water il-ink il-thin" d="M76 69.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <path class="il-water il-ink il-thin" d="M108 88.8c1.6 2.4 2.72 3.68 2.72 4.8a2.72 2.72 0 0 1-5.44 0c0-1.12 1.12-2.4 2.72-4.8z"/>
    <circle class="il-green il-ink il-thin" cx="102" cy="90" r="3.2"/>
    <path class="il-line il-thin" d="M99 80q4 4 2 6"/>
    <path class="il-line il-thin" d="M44 74l-4 2 4 2-4 2M116 92l4 2-4 2 4 2"/>`,

  // A tin can bonks off the saucepan on a potato’s head: CLONG — the potato is a bit cross-eyed but beams while music notes ring out.
  'fd.pot-helmet': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <ellipse class="il-dark il-ink il-thin" cx="66" cy="107" rx="7" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="88" cy="107" rx="7" ry="3"/>
    <path class="il-line il-thick" d="M50 90q-10-2-12-10M104 92q8 0 10-8"/>
    <circle class="il-wood il-ink il-thin" cx="38" cy="78" r="4"/>
    <circle class="il-wood il-ink il-thin" cx="114" cy="82" r="4"/>
    <path class="il-wood il-ink" d="M50 84c0-14 10-20 26-20s28 6 28 20c0 14-10 22-27 22S50 98 50 84z"/>
    <ellipse class="il-wood-dark" cx="58" cy="94" rx="2.4" ry="1.6"/>
    <ellipse class="il-wood-dark" cx="96" cy="98" rx="2" ry="1.4"/>
    <ellipse class="il-wood-dark" cx="100" cy="82" rx="2" ry="1.4"/>
    <ellipse class="il-wood-dark" cx="64" cy="102" rx="1.6" ry="1.2"/>
    <circle class="il-white il-ink il-thin" cx="68" cy="81" r="5"/>
    <circle class="il-dark" cx="69.6" cy="79.4" r="2.3"/>
    <circle class="il-white il-ink il-thin" cx="86" cy="81" r="5"/>
    <circle class="il-dark" cx="84.4" cy="82.6" r="2.3"/>
    <path class="il-dark il-ink il-thin" d="M67 92q10 9 20 0z"/>
    <circle class="il-pink" cx="60" cy="90" r="3"/>
    <circle class="il-pink" cx="95" cy="90" r="3"/>
    <rect class="il-dark il-ink" x="104" y="52" width="30" height="7" rx="3.5" transform="rotate(-8 104 55)"/>
    <circle class="il-metal il-ink il-thin" cx="128" cy="52" r="1.8"/>
    <path class="il-metal il-ink" d="M52 72V52c0-6 4-9 9-9h32c5 0 9 3 9 9v20z"/>
    <rect class="il-metal il-ink" x="47" y="68" width="60" height="6" rx="3"/>
    <path class="il-light" d="M60 50v14"/>
    <path class="il-light il-thin" d="M66 48v6"/>
    <path class="il-line il-thin" d="M58 60h38"/>
    <polygon class="il-yellow il-ink il-thin" points="86,30 89,36 96,35 91,40 94,46 87,43 82,47 82,40 76,37 83,35"/>
    <g transform="rotate(30 104 18)">
    <rect class="il-red il-ink" x="96" y="8" width="16" height="20" rx="2"/>
    <ellipse class="il-metal il-ink il-thin" cx="104" cy="8" rx="8" ry="2.4"/>
    <rect class="il-white il-ink il-thin" x="96" y="14" width="16" height="7"/>
    </g>
    <path class="il-line il-thin" d="M112 30q8-2 10 6M118 18l6-2"/>
    <path class="il-line il-thin" d="M44 54q-4-6 0-12M38 58q-6-10 0-20M110 40q6 4 6 10"/>
    <ellipse class="il-dark" cx="30" cy="34" rx="3.2" ry="2.4" transform="rotate(-20 30 34)"/>
    <path class="il-line il-thin" d="M32.8 34v-11q5 2 5 7"/>
    <ellipse class="il-dark" cx="132" cy="76" rx="3.2" ry="2.4" transform="rotate(-20 132 76)"/>
    <path class="il-line il-thin" d="M134.8 76v-11q5 2 5 7"/>
    <ellipse class="il-dark" cx="20" cy="56" rx="3.2" ry="2.4" transform="rotate(-20 20 56)"/>
    <path class="il-line il-thin" d="M22.8 56v-11q5 2 5 7"/>`,

  // An apple in striped pyjamas and a nightcap munches cheese at midnight; every pocket bulges with more cheese, and the cheese block behind is missing a big wedge.
  'fd.snack-pyjamas': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <path class="il-yellow il-ink" d="M118 108V86h34v22z"/>
    <path class="il-gold il-ink il-thin" d="M118 86l6-6h34l-6 6z"/>
    <path class="il-sky il-ink il-thin" d="M130 86l12 0-6 12z"/>
    <circle class="il-gold" cx="124" cy="98" r="2"/>
    <circle class="il-gold" cx="146" cy="100" r="2.6"/>
    <ellipse class="il-pink il-ink" cx="68" cy="106" rx="9" ry="4"/>
    <ellipse class="il-pink il-ink" cx="92" cy="106" rx="9" ry="4"/>
    <path class="il-blue il-ink" d="M58 104V76c0-8 8-12 22-12s22 4 22 12v28z"/>
    <path class="il-light il-thin" opacity="0.7" d="M64 68v36M72 65v39M88 65v39M96 68v36"/>
    <path class="il-line il-thin" d="M80 92v12"/>
    <path class="il-white il-ink il-thin" d="M70 64l10 8 10-8z"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="78" r="1.6"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="85" r="1.6"/>
    <path class="il-yellow il-ink il-thin" d="M84 72l16.1-10.35l2.3 10.35z"/>
    <circle class="il-gold" cx="94.35" cy="69.01" r="1.84"/>
    <circle class="il-gold" cx="99.53" cy="66.25" r="1.26"/>
    <rect class="il-blue il-ink il-thin" x="85" y="70" width="13" height="10" rx="1"/>
    <path class="il-yellow il-ink il-thin" d="M57 92l16.1-10.35l2.3 10.35z"/>
    <circle class="il-gold" cx="67.35" cy="89.01" r="1.84"/>
    <circle class="il-gold" cx="72.53" cy="86.25" r="1.26"/>
    <rect class="il-blue il-ink il-thin" x="59" y="90" width="13" height="10" rx="1"/>
    <path class="il-yellow il-ink il-thin" d="M84 92l16.1-10.35l2.3 10.35z"/>
    <circle class="il-gold" cx="94.35" cy="89.01" r="1.84"/>
    <circle class="il-gold" cx="99.53" cy="86.25" r="1.26"/>
    <rect class="il-blue il-ink il-thin" x="86" y="90" width="13" height="10" rx="1"/>
    <path class="il-blue il-ink" d="M60 72q-12 0-16-8l6-3q4 6 10 5z"/>
    <path class="il-blue il-ink" d="M100 72q10 4 12 14l-6 1q-2-7-7-9z"/>
    <circle class="il-green il-ink il-thin" cx="109" cy="89" r="4"/>
    <path class="il-yellow il-ink" d="M36 64l18-12 3 12z"/>
    <path class="il-sky il-ink il-thin" d="M52 54a3 3 0 0 0 2 5"/>
    <circle class="il-gold" cx="48" cy="61" r="2"/>
    <circle class="il-green il-ink il-thin" cx="47" cy="64" r="4"/>
    <path class="il-green il-ink" d="M80 26c6-4 20-2 20 14 0 14-10 22-20 22s-20-8-20-22c0-16 14-18 20-14z"/>
    <path class="il-light" d="M66 36q1-5 4-7"/>
    <path class="il-line" d="M69 42q4 3 7 0M84 42q4 3 7 0"/>
    <path class="il-dark il-ink il-thin" d="M74 50q6 6 12 0z"/>
    <circle class="il-pink" cx="68" cy="48" r="2.6"/>
    <circle class="il-pink" cx="92" cy="48" r="2.6"/>
    <circle class="il-yellow" cx="70" cy="56" r="1"/>
    <circle class="il-yellow" cx="88" cy="57" r="1"/>
    <path class="il-red il-ink" d="M62 34c0-12 8-20 20-20 14 0 22 10 28 26l2 6-6 0c-2-8-6-12-10-12 2-2-20-4-34 0z"/>
    <path class="il-light il-thin" opacity="0.7" d="M72 18l4 12M86 15l2 16M100 24l-1 9"/>
    <circle class="il-white il-ink" cx="110" cy="48" r="5"/>
    <path class="il-white il-ink" d="M60 36q20-8 40 0v5q-20-8-40 0z"/>
    <path class="il-green il-ink il-thin" d="M58 30c-6-2-8 2-6 4 3 1 5-1 6-4z"/>`,

  // A proud little knight in crinkled tinfoil armour with a foil-ball helmet and a foil pie-dish shield; it sparkles and crinkles, a fruit fly bounces off, and a snowflake bubble says “fresh”.
  'fd.foil-armour': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <path class="il-white il-ink il-thin" d="M120 6h22a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-12l-6 6v-6h-4a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8z"/>
    <path class="il-blue il-ink il-thin" d="M131 10v16M124 14l14 8M124 22l14-8"/>
    <path class="il-metal il-ink" d="M66 88h12v16H66zM84 88h12v16H84z"/>
    <path class="il-metal il-ink" d="M62 104h17v4H62zM83 104h17v4H83z"/>
    <path class="il-line il-thin" d="M68 92l4 3 3-2M86 98l4-3 3 3"/>
    <path class="il-metal il-ink" d="M60 60l6-4h30l6 4 2 32H58z"/>
    <path class="il-line il-thin" d="M64 64l6 6 4-4 6 6 6-6 4 4 6-6M62 80l8-4 6 6 8-6 6 4 8-2M74 88l4-4 6 4"/>
    <path class="il-light" d="M66 62l-2 18"/>
    <ellipse class="il-metal il-ink" cx="58" cy="62" rx="8" ry="6"/>
    <ellipse class="il-metal il-ink" cx="104" cy="62" rx="8" ry="6"/>
    <path class="il-line il-thin" d="M54 60l4 3 4-2M100 64l4-3 4 2"/>
    <path class="il-metal il-ink" d="M106 60l10-16 6 4-10 16z"/>
    <circle class="il-metal il-ink" cx="120" cy="42" r="5"/>
    <path class="il-metal il-ink" d="M62 42l2-12 10-9h14l10 7 4 12-2 12-8 7H72l-9-7z"/>
    <path class="il-line il-thin" d="M66 30l6 4 4-5 6 3 4-4M90 24l2 6-3 4M68 52l6-2 4 3M96 46l-4 4"/>
    <path class="il-light" d="M68 30q4-6 8-7"/>
    <rect class="il-dark il-ink" x="66" y="37" width="30" height="9" rx="4"/>
    <circle class="il-white" cx="75" cy="41.5" r="2.6"/>
    <circle class="il-dark" cx="75.8" cy="41.5" r="1.2"/>
    <circle class="il-white" cx="87" cy="41.5" r="2.6"/>
    <circle class="il-dark" cx="87.8" cy="41.5" r="1.2"/>
    <path class="il-metal il-ink" d="M58 74q-6 2-10 4"/>
    <circle class="il-metal il-ink" cx="38" cy="78" r="19"/>
    <circle class="il-metal il-ink il-thin" cx="38" cy="78" r="12"/>
    <path class="il-line il-thin" d="M28 70l5 4 4-3 5 4M30 86l6-3 4 4 6-3"/>
    <path class="il-light" d="M26 70q4-6 10-7"/>
    <ellipse class="il-white il-ink il-thin" cx="16" cy="41" rx="2.4" ry="1.6"/>
    <ellipse class="il-white il-ink il-thin" cx="20" cy="41" rx="2.4" ry="1.6"/>
    <ellipse class="il-dark" cx="18" cy="44" rx="2.6" ry="2"/>
    <path class="il-line il-thin" d="M22 50q6 6 8 12M14 38l-3-3M10 44H6"/>
    <path class="il-white il-ink il-thin" d="M50 26L51.12 28.88L54 30L51.12 31.12L50 34L48.88 31.12L46 30L48.88 28.88z"/>
    <path class="il-white il-ink il-thin" d="M112 76L113.12 78.88L116 80L113.12 81.12L112 84L110.88 81.12L108 80L110.88 78.88z"/>
    <path class="il-white il-ink il-thin" d="M56 93L56.84 95.16L59 96L56.84 96.84L56 99L55.16 96.84L53 96L55.16 95.16z"/>
    <path class="il-white il-ink il-thin" d="M134 49L134.84 51.16L137 52L134.84 52.84L134 55L133.16 52.84L131 52L133.16 51.16z"/>
    <path class="il-line il-thin" d="M114 92l4-3 2 4 4-3 2 4M126 100l3-3 2 3 3-3"/>`,

  // A pizza-slice cook in an apron covered in tomato, mustard, gravy and pesto stains; a happy little leftover meatball lounges in the apron pocket.
  'fd.stained-apron': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <ellipse class="il-dark il-ink il-thin" cx="68" cy="107" rx="7" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="92" cy="107" rx="7" ry="3"/>
    <path class="il-teal il-ink" d="M56 106V76c0-8 10-12 24-12s24 4 24 12v30z"/>
    <path class="il-teal il-ink" d="M57 74q-12 6-14 18l6 2q2-9 9-12zM103 74q12 6 14 18l-6 2q-2-9-9-12z"/>
    <circle class="il-yellow il-ink il-thin" cx="46" cy="95" r="4"/>
    <circle class="il-yellow il-ink il-thin" cx="114" cy="95" r="4"/>
    <path class="il-line il-thin" d="M68 66q12-10 24 0"/>
    <path class="il-white il-ink" d="M66 106V82l2-16h24l2 16v24z"/>
    <path class="il-line il-thin" d="M66 82h-10M94 82h10"/>
    <path class="il-white il-ink il-thin" d="M104 82l5-3v6z"/>
    <path class="il-red il-ink il-thin" d="M68 70c3-3 7-2 7 1 3 0 4 4 1 6 1 3-3 5-6 3-3 1-6-2-4-4-3-2-1-6 2-6z"/>
    <path class="il-gold il-ink il-thin" d="M82 70c4-2 8 1 7 4 3 2 0 6-3 5-2 3-7 1-6-2-2-2-1-6 2-7z"/>
    <path class="il-gold" d="M86 79v5"/>
    <path class="il-line il-thin" d="M86 80v4"/>
    <path class="il-wood-dark il-ink il-thin" d="M66 98c3-4 8-3 8 0 4 0 4 5 0 5 0 4-7 4-7 0-4 0-4-4-1-5z"/>
    <path class="il-green il-ink il-thin" d="M88 101c3-3 7-1 6 2s-3 5-6 4-3-4 0-6z"/>
    <circle class="il-red" cx="90" cy="80" r="1.6"/>
    <circle class="il-gold" cx="70" cy="84" r="1.2"/>
    <circle class="il-wood-dark" cx="78" cy="76" r="1"/>
    <path class="il-red" d="M72 78v4"/>
    <path class="il-line il-thin" d="M73 79v3"/>
    <circle class="il-wood-dark il-ink" cx="80" cy="88" r="6"/>
    <circle class="il-white" cx="78" cy="87" r="1.4"/>
    <circle class="il-white" cx="82" cy="87" r="1.4"/>
    <circle class="il-dark" cx="78" cy="87.3" r="0.7"/>
    <circle class="il-dark" cx="82" cy="87.3" r="0.7"/>
    <path class="il-light il-thin" d="M78 90q2 1.5 4 0"/>
    <path class="il-wood-dark il-ink il-thin" d="M73 90l-4-4 2-1 4 3z"/>
    <rect class="il-white il-ink il-thin" x="71" y="90" width="18" height="11" rx="1"/>
    <path class="il-red il-ink il-thin" d="M98 72l-3-3a2 2 0 0 1 3-2.4 2 2 0 0 1 3 2.4z"/>
    <path class="il-yellow il-ink" d="M56 22h48L80 63z"/>
    <path class="il-yellow il-ink il-thin" d="M64 36q-3 6 0 10 2-4 1-10z"/>
    <circle class="il-red il-ink il-thin" cx="64" cy="29" r="4"/>
    <circle class="il-red il-ink il-thin" cx="97" cy="28" r="3.4"/>
    <circle class="il-red il-ink il-thin" cx="82" cy="52" r="2.6"/>
    <circle class="il-green" cx="90" cy="44" r="1.3"/>
    <circle class="il-green" cx="72" cy="46" r="1"/>
    <path class="il-wood il-ink" d="M52 24c0-10 56-10 56 0 0 5-56 5-56 0z"/>
    <path class="il-wood-dark" d="M62 21h3M76 19h3M92 20h3"/>
    <path class="il-line il-thin" d="M62 21h3M76 19h3M92 20h3"/>
    <circle class="il-white il-ink il-thin" cx="73" cy="35" r="3.8"/>
    <circle class="il-dark" cx="73.4" cy="36.6" r="1.75"/>
    <circle class="il-white il-ink il-thin" cx="87" cy="35" r="3.8"/>
    <circle class="il-dark" cx="87.4" cy="36.6" r="1.75"/>
    <path class="il-line" d="M75 43q5 4 10 0"/>`,

  // A blissful milk carton wears a purple cape with a garland of garlic bulbs; stink waves roll out, a beetle flees on one side and a radish runs off holding its nose on the other.
  'fd.garlic-cape': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <path class="il-purple il-ink" d="M62 46c-14 10-22 40-26 60h88c-4-20-12-50-26-60z"/>
    <path class="il-purple-dark" opacity="0.6" d="M50 104c2-20 6-38 12-50l-2 50zM110 104c-2-20-6-38-12-50l2 50z"/>
    <path class="il-beard il-ink il-thin" d="M42 95c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M39.5 101q0 5 1 7M44.5 101q0 5-1 7"/>
    <path class="il-beard il-ink il-thin" d="M118 95c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M115.5 101q0 5 1 7M120.5 101q0 5-1 7"/>
    <path class="il-line il-thick" d="M70 96v10M90 96v10"/>
    <ellipse class="il-dark il-ink il-thin" cx="68" cy="107" rx="5" ry="2.5"/>
    <ellipse class="il-dark il-ink il-thin" cx="92" cy="107" rx="5" ry="2.5"/>
    <rect class="il-white il-ink" x="62" y="40" width="36" height="56"/>
    <path class="il-white il-ink" d="M62 40l6-14h24l6 14z"/>
    <rect class="il-white il-ink il-thin" x="68" y="21" width="24" height="5"/>
    <path class="il-line il-thin" d="M80 26v14"/>
    <rect class="il-blue" x="63" y="82" width="34" height="10"/>
    <path class="il-white" d="M80 84c2 3 3 4 3 5a3 3 0 0 1-6 0c0-1 1-2 3-5z"/>
    <path class="il-line" d="M69 64q4 3 8 0M83 64q4 3 8 0"/>
    <path class="il-dark il-ink il-thin" d="M73 71q7 7 14 0z"/>
    <circle class="il-pink" cx="67" cy="70" r="2.6"/>
    <circle class="il-pink" cx="93" cy="70" r="2.6"/>
    <path class="il-line il-thin" d="M58 46q22 14 44 0"/>
    <path class="il-beard il-ink il-thin" d="M58 41c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M55.5 47q0 5 1 7M60.5 47q0 5-1 7"/>
    <path class="il-beard il-ink il-thin" d="M68 47c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M65.5 53q0 5 1 7M70.5 53q0 5-1 7"/>
    <path class="il-beard il-ink il-thin" d="M80 50c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M77.5 56q0 5 1 7M82.5 56q0 5-1 7"/>
    <path class="il-beard il-ink il-thin" d="M92 47c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M89.5 53q0 5 1 7M94.5 53q0 5-1 7"/>
    <path class="il-beard il-ink il-thin" d="M102 41c-1 3-7 4-7 9 0 4 3 6 7 6s7-2 7-6c0-5-6-6-7-9z"/>
    <path class="il-line il-thin" d="M99.5 47q0 5 1 7M104.5 47q0 5-1 7"/>
    <path class="il-line il-thin" d="M42 40q4-4 0-8t0-8M52 28q4-4 0-8t0-8M118 40q-4-4 0-8t0-8M108 26q-4-4 0-8t0-8M30 72q4-4 0-8t0-8M130 72q-4-4 0-8t0-8"/>
    <path class="il-line il-thin" d="M12 92l-4 3M18 92v5M24 92l3 4"/>
    <ellipse class="il-dark il-ink il-thin" cx="18" cy="88" rx="9" ry="6"/>
    <circle class="il-dark il-ink il-thin" cx="9" cy="86" r="3.6"/>
    <circle class="il-white" cx="8" cy="85" r="1.6"/>
    <circle class="il-dark" cx="7.4" cy="85" r="0.7"/>
    <path class="il-line il-thin" d="M30 82h6M30 88h8"/>
    <path class="il-water il-ink il-thin" d="M24 75.6c1.2 1.8 2.04 2.76 2.04 3.6a2.04 2.04 0 0 1-4.08 0c0-0.84 0.84-1.8 2.04-3.6z"/>
    <path class="il-line il-thin" d="M126 92h-8M128 98h-8"/>
    <circle class="il-red il-ink" cx="142" cy="92" r="10"/>
    <path class="il-white il-ink il-thin" d="M134 97q8 5 16 0q-3 5-8 5t-8-5z"/>
    <path class="il-green il-ink il-thin" d="M141 82c-3-6 0-9 2-7 2-3 6-1 3 6z"/>
    <path class="il-line" d="M137 90l3-1M144 90l3-1"/>
    <path class="il-line il-thick" d="M134 96q-4-2-4 3"/>
    <circle class="il-red il-ink il-thin" cx="138" cy="94" r="2.6"/>
    <path class="il-line il-thin" d="M139 105l-3 4M146 105l3 4"/>`,

  // A pea in a shiny pink plastic apron slides across the glass shelf with its feet in the air; a grabbing mould blob’s hands just slip off, leaving droplets and a puzzled question mark.
  'fd.slippery-apron': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v102M151 0v102"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,102 10,102"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="97" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 99h10M60 99h6M120 99h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="102" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="110" width="160" height="10"/>
    <path class="il-light il-thin" d="M30 98h20M58 96h14"/>
    <path class="il-slime il-ink" d="M8 102c-6-14-2-34 12-38 10-4 24 2 26 16 2 10 0 18-4 22z"/>
    <circle class="il-green" cx="16" cy="90" r="2.6"/>
    <circle class="il-green" cx="34" cy="96" r="3"/>
    <circle class="il-green" cx="38" cy="74" r="2"/>
    <circle class="il-white il-ink il-thin" cx="20" cy="78" r="4.4"/>
    <circle class="il-dark" cx="21.2" cy="78" r="2.02"/>
    <circle class="il-white il-ink il-thin" cx="32" cy="78" r="4.4"/>
    <circle class="il-dark" cx="33.2" cy="78" r="2.02"/>
    <ellipse class="il-dark" cx="26" cy="90" rx="3" ry="3.6"/>
    <path class="il-line il-thin" d="M15 70l7 2M30 71l7-2"/>
    <path class="il-slime il-ink" d="M42 78q10-6 16-10l3 5q-8 6-17 9z"/>
    <path class="il-slime il-ink" d="M42 90q10 0 18 4l-2 5q-8-3-16-3z"/>
    <path class="il-line il-thin" d="M62 62l6-4M64 68l6-1M62 100l6 3M64 94l6 0"/>
    <path class="il-line" d="M18 44q0-8 7-8t7 7q0 5-7 7v4"/>
    <circle class="il-dark" cx="25" cy="60" r="1.8"/>
    <g transform="rotate(-24 96 74)">
    <ellipse class="il-dark il-ink il-thin" cx="88" cy="99" rx="7" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="106" cy="99" rx="7" ry="3"/>
    <path class="il-line il-thick" d="M90 96v-6M104 96v-6"/>
    <circle class="il-green il-ink" cx="97" cy="70" r="23"/>
    <path class="il-light" d="M80 60q4-10 12-12"/>
    <path class="il-line il-thin" d="M84 70q13-14 26 0"/>
    <path class="il-pink il-ink" d="M83 70h28l3 18c-8 6-26 6-34 0z"/>
    <path class="il-light" d="M88 73l3 10M104 72l1 5"/>
    <path class="il-light il-thin" d="M96 74l2 6"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="58" r="5"/>
    <circle class="il-dark" cx="90.6" cy="57.4" r="2.3"/>
    <circle class="il-white il-ink il-thin" cx="104" cy="58" r="5"/>
    <circle class="il-dark" cx="104.6" cy="57.4" r="2.3"/>
    <ellipse class="il-dark il-ink il-thin" cx="97" cy="66" rx="3.4" ry="2.6"/>
    <path class="il-line il-thick" d="M118 62q8-6 8-14M78 64q-6-6-4-14"/>
    <circle class="il-green il-ink il-thin" cx="126" cy="46" r="3.6"/>
    <circle class="il-green il-ink il-thin" cx="74" cy="48" r="3.6"/>
    </g>
    <path class="il-water il-ink il-thin" d="M70 52.8c1.6 2.4 2.72 3.68 2.72 4.8a2.72 2.72 0 0 1-5.44 0c0-1.12 1.12-2.4 2.72-4.8z"/>
    <path class="il-water il-ink il-thin" d="M122 95.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <path class="il-water il-ink il-thin" d="M136 79.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <path class="il-water il-ink il-thin" d="M56 83.6c1.2 1.8 2.04 2.76 2.04 3.6a2.04 2.04 0 0 1-4.08 0c0-0.84 0.84-1.8 2.04-3.6z"/>
    <path class="il-line il-thin" d="M138 96h14M132 104h20M142 88h10"/>`,

  // In the frosty freezer drawer a tomato with earmuffs stomps along in huge fur-lined snow boots with armoured metal toecaps; a pea frozen in an ice cube shivers nearby.
  'fd.snow-boots': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" opacity="0.9" d="M0 0h160v9c-6 4-10-2-16 2s-10-4-16 0-10-2-16 2-10-4-16 0-10-2-16 2-10-4-16 0-10-2-16 2-10-4-16 0-10 2-16 2z"/>
    <path class="il-light il-thin" d="M18 30v10M13 35h10M14 31l8 8M22 31l-8 8M138 26v10M133 31h10M134 27l8 8M142 27l-8 8M110 18v6M107 21h6"/>
    <path class="il-metal il-ink" d="M0 100q20-5 40 0t40 0 40 0 40 0v20H0z"/>
    <path class="il-white" d="M0 103q20-5 40 0t40 0 40 0 40 0v17H0z"/>
    <path class="il-light il-thin" d="M12 110h10M60 114h12M130 112h14"/>
    <rect class="il-water il-ink" opacity="0.85" x="124" y="76" width="24" height="24" rx="3"/>
    <rect class="il-water il-ink" opacity="0.85" x="128" y="54" width="20" height="22" rx="3"/>
    <circle class="il-green il-ink il-thin" cx="136" cy="88" r="6"/>
    <path class="il-line il-thin" d="M133 87l1.6 0M138 87h1.6M133 91l1-1 1 1 1-1 1 1 1-1 1 1"/>
    <path class="il-light il-thin" d="M127 80l4-3M131 58l4-3"/>
    <path class="il-line il-thin" d="M122 84l-3 0M122 90l-3 0M150 86l3 0"/>
    <ellipse class="il-metal" cx="12" cy="112" rx="7" ry="2.4"/>
    <ellipse class="il-metal" cx="30" cy="108" rx="7" ry="2.4"/>
    <circle class="il-red il-ink" cx="78" cy="48" r="21"/>
    <path class="il-green il-ink il-thin" d="M78 26l3 4 5-2-2 5 5 2-6 1-1 4-4-3-4 3-1-4-6-1 5-2-2-5 5 2z"/>
    <path class="il-light" d="M62 46q1-8 6-11"/>
    <path class="il-line il-thick" d="M58 46q0-24 20-24t20 24"/>
    <circle class="il-pink il-ink" cx="57" cy="48" r="6"/>
    <circle class="il-pink il-ink" cx="99" cy="48" r="6"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="47" r="4.4"/>
    <circle class="il-dark" cx="72.2" cy="47" r="2.02"/>
    <circle class="il-white il-ink il-thin" cx="85" cy="47" r="4.4"/>
    <circle class="il-dark" cx="86.2" cy="47" r="2.02"/>
    <path class="il-line" d="M65 40l9 3M91 40l-9 3"/>
    <path class="il-dark il-ink il-thin" d="M71 56q7 6 14 0z"/>
    <circle class="il-smoke il-ink il-thin" cx="102" cy="62" r="3.4"/>
    <circle class="il-smoke il-ink il-thin" cx="109" cy="58" r="4.4"/>
    <g transform="rotate(-12 50 100)">
    <path class="il-orange il-ink" d="M36 68h24v18h10c6 0 10 4 10 10v4H34z"/>
    <path class="il-metal il-ink" d="M62 86h8c6 0 10 4 10 10v4H62z"/>
    <circle class="il-dark" cx="66" cy="92" r="1.2"/>
    <circle class="il-dark" cx="72" cy="91" r="1.2"/>
    <circle class="il-dark" cx="76" cy="96" r="1.2"/>
    <rect class="il-dark il-ink" x="32" y="100" width="50" height="6" rx="2"/>
    <path class="il-light il-thin" d="M38 103h4M48 103h4M58 103h4M68 103h4"/>
    <path class="il-beard il-ink" d="M32 68c0-6 4-6 6-4 2-4 6-4 8-1 2-3 6-3 8 0 2-3 7-2 8 2 3 1 3 6 0 8H34c-3 0-3-3-2-5z"/>
    <path class="il-line il-thin" d="M42 78l8 0M42 84h8"/>
    </g>
    <path class="il-orange il-ink" d="M84 70h24v18h10c6 0 10 4 10 10v4H82z"/>
    <path class="il-metal il-ink" d="M110 88h8c6 0 10 4 10 10v4h-18z"/>
    <circle class="il-dark" cx="114" cy="94" r="1.2"/>
    <circle class="il-dark" cx="120" cy="93" r="1.2"/>
    <circle class="il-dark" cx="124" cy="98" r="1.2"/>
    <path class="il-light il-thin" d="M113 91q4-1 6 1"/>
    <rect class="il-dark il-ink" x="80" y="102" width="50" height="6" rx="2"/>
    <path class="il-light il-thin" d="M86 105h4M96 105h4M106 105h4M116 105h4"/>
    <path class="il-beard il-ink" d="M80 70c0-6 4-6 6-4 2-4 6-4 8-1 2-3 6-3 8 0 2-3 7-2 8 2 3 1 3 6 0 8H82c-3 0-3-3-2-5z"/>
    <path class="il-line il-thin" d="M90 80h8M90 86h8"/>
    <circle class="il-white il-ink il-thin" cx="78" cy="108" r="3"/>
    <circle class="il-white il-ink il-thin" cx="133" cy="107" r="2.6"/>
    <circle class="il-white il-ink il-thin" cx="138" cy="103" r="1.8"/>`,

  // A cheese wedge in big bright kitchen clogs dashes clack-clack-clack out of the kitchen, glancing back in panic at a towering pile of dirty dishes.
  'fd.kitchen-clogs': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.25" d="M0 20h160M0 40h160M0 60h160M20 0v84M40 0v84M60 0v84M80 0v84M100 0v84M120 0v84M140 0v84"/>
    <rect class="il-stone" x="0" y="84" width="160" height="36"/>
    <path class="il-white" opacity="0.5" d="M0 84h20v12H0zM40 84h20v12H40zM80 84h20v12H80zM120 84h20v12h-20zM20 96h20v12H20zM60 96h20v12H60zM100 96h20v12h-20zM140 96h20v12h-20zM0 108h20v12H0zM40 108h20v12H40zM80 108h20v12H80zM120 108h20v12h-20z"/>
    <path class="il-line" d="M0 84h160"/>
    <rect class="il-wood il-ink" x="-2" y="14" width="26" height="70"/>
    <rect class="il-night" x="2" y="18" width="18" height="66"/>
    <rect class="il-wood-dark il-ink" x="122" y="62" width="40" height="22"/>
    <rect class="il-metal il-ink" x="118" y="58" width="44" height="5"/>
    <ellipse class="il-white il-ink" cx="140" cy="54" rx="16" ry="4"/>
    <ellipse class="il-white il-ink" cx="139" cy="47" rx="15" ry="4"/>
    <ellipse class="il-white il-ink" cx="141" cy="40" rx="14" ry="4"/>
    <ellipse class="il-white il-ink" cx="139" cy="33" rx="13" ry="4"/>
    <circle class="il-wood-dark" cx="134" cy="47" r="1.6"/>
    <circle class="il-red" cx="146" cy="40" r="1.6"/>
    <circle class="il-gold" cx="136" cy="33" r="1.4"/>
    <path class="il-metal il-ink" d="M128 28v-10h22v10z"/>
    <rect class="il-dark il-ink il-thin" x="150" y="20" width="10" height="4" rx="2"/>
    <rect class="il-yellow il-ink il-thin" x="120" y="50" width="10" height="7" rx="2" transform="rotate(-10 125 54)"/>
    <circle class="il-white il-ink il-thin" cx="132" cy="14" r="2.4"/>
    <circle class="il-white il-ink il-thin" cx="140" cy="10" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="146" cy="14" r="2.6"/>
    <path class="il-line il-thin" d="M126 24l-4-3M152 30l4-2"/>
    <path class="il-line il-thin" d="M104 60h12M106 68h10M102 76h14"/>
    <circle class="il-smoke il-ink il-thin" cx="108" cy="100" r="4"/>
    <circle class="il-smoke il-ink il-thin" cx="116" cy="96" r="3"/>
    <circle class="il-smoke il-ink il-thin" cx="114" cy="104" r="2.4"/>
    <path class="il-line il-thick" d="M58 80l-10 10M86 82l6 12"/>
    <path class="il-gold il-ink" d="M96 46l6-4v38l-6 4z"/>
    <path class="il-yellow il-ink" d="M38 84L96 84 96 46z"/>
    <ellipse class="il-gold" cx="62" cy="78" rx="3" ry="2.4"/>
    <ellipse class="il-gold" cx="88" cy="58" rx="2.4" ry="2"/>
    <ellipse class="il-gold" cx="70" cy="70" rx="1.6" ry="1.4"/>
    <circle class="il-white il-ink il-thin" cx="79" cy="70" r="4.4"/>
    <circle class="il-dark" cx="81" cy="69.4" r="2.02"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="70" r="4.4"/>
    <circle class="il-dark" cx="92" cy="69.4" r="2.02"/>
    <path class="il-line il-thin" d="M74 62l8 2M86 63l8-2"/>
    <ellipse class="il-dark il-ink il-thin" cx="86" cy="79" rx="3.4" ry="2.4"/>
    <path class="il-water il-ink il-thin" d="M100 53.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <path class="il-line il-thick" d="M70 68q-10-8-6-18M92 80q8 4 10 0"/>
    <circle class="il-yellow il-ink il-thin" cx="64" cy="49" r="3.4"/>
    <g transform="translate(24 84) rotate(-18) scale(1.25)">
    <path class="il-white il-ink il-thin" d="M-1 12h32v4H2c-2 0-3-2-3-4z"/>
    <path class="il-red il-ink" d="M0 11c0-7 6-11 14-11h6c6 0 10 2 10 6v6H0z"/>
    <circle class="il-dark" cx="8" cy="5" r="1.1"/>
    <circle class="il-dark" cx="13" cy="3.4" r="1.1"/>
    <circle class="il-dark" cx="12" cy="7.4" r="1.1"/>
    <circle class="il-dark" cx="17" cy="5" r="1.1"/>
    <path class="il-line il-thin" d="M24 4q6-2 6 4"/>
    </g>
    <g transform="translate(78 92) rotate(0) scale(1.25)">
    <path class="il-white il-ink il-thin" d="M-1 12h32v4H2c-2 0-3-2-3-4z"/>
    <path class="il-teal il-ink" d="M0 11c0-7 6-11 14-11h6c6 0 10 2 10 6v6H0z"/>
    <circle class="il-dark" cx="8" cy="5" r="1.1"/>
    <circle class="il-dark" cx="13" cy="3.4" r="1.1"/>
    <circle class="il-dark" cx="12" cy="7.4" r="1.1"/>
    <circle class="il-dark" cx="17" cy="5" r="1.1"/>
    <path class="il-line il-thin" d="M24 4q6-2 6 4"/>
    </g>
    <path class="il-line il-thin" d="M30 108l-4 4M36 109v5M42 108l4 4M84 116l-3 3M114 116l3 3"/>`,

  // An orange on roller skates zooms away from the open fridge, arms full of milk, cheese and an apple, the fridge door still swinging behind it.
  'fd.roller-skates': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.25" d="M60 0v88M80 0v88M100 0v88M120 0v88M140 0v88M60 22h100M60 44h100M60 66h100"/>
    <rect class="il-stone" x="0" y="88" width="160" height="32"/>
    <path class="il-white" opacity="0.5" d="M0 88h20v10H0zM40 88h20v10H40zM80 88h20v10H80zM120 88h20v10h-20zM20 98h20v11H20zM60 98h20v11H60zM100 98h20v11h-20zM140 98h20v11h-20zM0 109h20v11H0zM40 109h20v11H40zM80 109h20v11H80zM120 109h20v11h-20z"/>
    <path class="il-line" d="M0 88h160"/>
    <rect class="il-white il-ink" x="-4" y="6" width="40" height="84" rx="3"/>
    <rect class="il-glow" opacity="0.5" x="1" y="12" width="30" height="72"/>
    <path class="il-line il-thin" d="M1 36h30M1 60h30"/>
    <rect class="il-red il-ink il-thin" x="4" y="26" width="8" height="10"/>
    <circle class="il-green il-ink il-thin" cx="22" cy="54" r="5"/>
    <rect class="il-white il-ink il-thin" x="14" y="68" width="9" height="16"/>
    <polygon class="il-white il-ink" points="36,8 54,2 54,94 36,90"/>
    <path class="il-line il-thin" d="M50 38v14"/>
    <path class="il-line il-thin" d="M58 10q4 20 0 40M62 18q3 14 0 28"/>
    <circle class="il-smoke il-ink il-thin" cx="58" cy="94" r="4"/>
    <circle class="il-smoke il-ink il-thin" cx="66" cy="90" r="3"/>
    <path class="il-line il-thin" d="M66 46h14M62 56h18M68 66h12M64 100h14M70 108h10"/>
    <path class="il-line il-thick" d="M96 76l-8 8M108 76l4 10"/>
    <g transform="translate(78 98) rotate(-14)">
    <path class="il-red il-ink" d="M0 0v-18h12v9c9 0 15 3 15 9z"/>
    <path class="il-light il-thin" d="M12-14h-5M12-10h-6M14-6h-5"/>
    <rect class="il-white il-ink il-thin" x="-2" y="-21" width="16" height="4" rx="1.6"/>
    <rect class="il-metal il-ink il-thin" x="-1" y="0" width="29" height="3" rx="1.4"/>
    <circle class="il-yellow il-ink il-thin" cx="4" cy="6" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="11" cy="6" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="18" cy="6" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="25" cy="6" r="3.6"/>
    <rect class="il-red il-ink il-thin" x="-5" y="1" width="5" height="4" rx="2"/>
    </g>
    <g transform="translate(104 102) rotate(0)">
    <path class="il-red il-ink" d="M0 0v-18h12v9c9 0 15 3 15 9z"/>
    <path class="il-light il-thin" d="M12-14h-5M12-10h-6M14-6h-5"/>
    <rect class="il-white il-ink il-thin" x="-2" y="-21" width="16" height="4" rx="1.6"/>
    <rect class="il-metal il-ink il-thin" x="-1" y="0" width="29" height="3" rx="1.4"/>
    <circle class="il-yellow il-ink il-thin" cx="4" cy="6" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="11" cy="6" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="18" cy="6" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="25" cy="6" r="3.6"/>
    <rect class="il-red il-ink il-thin" x="-5" y="1" width="5" height="4" rx="2"/>
    </g>
    <circle class="il-orange il-ink" cx="102" cy="56" r="22"/>
    <circle class="il-gold" cx="90" cy="68" r="1"/>
    <circle class="il-gold" cx="112" cy="70" r="1"/>
    <circle class="il-gold" cx="86" cy="50" r="1"/>
    <circle class="il-gold" cx="118" cy="44" r="1"/>
    <path class="il-light" d="M86 44q4-8 10-10"/>
    <path class="il-green il-ink il-thin" d="M102 34c2-6 8-8 12-6-2 5-7 7-12 6z"/>
    <path class="il-line il-thin" d="M101 35v-4"/>
    <circle class="il-white il-ink il-thin" cx="98" cy="50" r="4.6"/>
    <circle class="il-dark" cx="99.8" cy="50" r="2.12"/>
    <circle class="il-white il-ink il-thin" cx="110" cy="50" r="4.6"/>
    <circle class="il-dark" cx="111.8" cy="50" r="2.12"/>
    <path class="il-line" d="M92 42l9 3M115 43l-8 2"/>
    <path class="il-dark il-ink il-thin" d="M98 60q8 8 16-2z"/>
    <rect class="il-white il-ink" x="122" y="38" width="14" height="26"/>
    <path class="il-white il-ink il-thin" d="M122 38l3-7h8l3 7z"/>
    <rect class="il-blue" x="123" y="46" width="12" height="6"/>
    <path class="il-yellow il-ink" d="M136 66l14-12 4 12z"/>
    <circle class="il-gold" cx="146" cy="62" r="1.6"/>
    <circle class="il-red il-ink" cx="146" cy="44" r="7"/>
    <path class="il-line il-thin" d="M146 37v-4"/>
    <path class="il-light il-thin" d="M142 41q1-2 3-2"/>
    <path class="il-line il-thick" d="M118 66q10 6 16 0M88 62q14 18 32 6"/>
    <circle class="il-orange il-ink il-thin" cx="134" cy="66" r="3.4"/>
    <path class="il-white il-ink il-thin" d="M132 107L132.84 109.16L135 110L132.84 110.84L132 113L131.16 110.84L129 110L131.16 109.16z"/>
    <path class="il-white il-ink il-thin" d="M76 109.4L76.73 111.27L78.6 112L76.73 112.73L76 114.6L75.27 112.73L73.4 112L75.27 111.27z"/>`,

  // A purple onion stands firm on the icy floor in fluffy pink slippers with metal spikes on the soles and studs on top; an ice cube skids past and a sneaking mould blob pricks its finger.
  'fd.spiked-slippers': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" opacity="0.85" d="M0 0h160v8c-6 4-10-2-16 2s-10-4-16 0-10-2-16 2-10-4-16 0-10-2-16 2-10-4-16 0-10-2-16 2-10-4-16 0-10 2-16 2z"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v86H0zM151 0h9v86h-9z"/>
    <rect class="il-water il-ink" x="-2" y="86" width="164" height="36"/>
    <path class="il-light" d="M10 96l14-4M120 112l18-5M60 116l10-3"/>
    <path class="il-light il-thin" d="M30 106l8-2M136 94l10-3"/>
    <g transform="translate(-8 -14) rotate(-18 24 90)">
    <rect class="il-white il-ink" opacity="0.9" x="12" y="76" width="22" height="20" rx="3"/>
    <circle class="il-white il-ink il-thin" cx="19" cy="84" r="2.8"/>
    <circle class="il-dark" cx="19" cy="83" r="1.29"/>
    <circle class="il-white il-ink il-thin" cx="27" cy="84" r="2.8"/>
    <circle class="il-dark" cx="27" cy="83" r="1.29"/>
    <ellipse class="il-dark" cx="23" cy="91" rx="1.6" ry="2"/>
    </g>
    <path class="il-line il-thin" d="M24 70h8M26 76h8"/>
    <path class="il-line il-thick" d="M6 84l-4 6M20 82l2 7"/>
    <path class="il-line il-thick" d="M72 76l-6 16M88 76l8 16"/>
    <g transform="translate(16 9.6) scale(0.8)">
    <path class="il-green il-ink il-thin" d="M80 22c-4-6-2-12 0-14 2 2 4 8 0 14zM80 22c2-6 8-8 10-6-2 4-6 6-10 6z"/>
    <path class="il-purple il-ink" d="M80 20c2 8 28 14 28 38 0 16-12 26-28 26S52 74 52 58c0-24 26-30 28-38z"/>
    <path class="il-light il-thin" opacity="0.5" d="M70 34q-12 14-8 36M90 34q12 14 8 36M80 26v8"/>
    <path class="il-line" d="M66 54l9 3M94 54l-9 3"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="60" r="4.4"/>
    <circle class="il-dark" cx="71.8" cy="60.6" r="2.02"/>
    <circle class="il-white il-ink il-thin" cx="89" cy="60" r="4.4"/>
    <circle class="il-dark" cx="89.8" cy="60.6" r="2.02"/>
    <path class="il-line" d="M73 72q8 4 14-2"/>
    <path class="il-purple il-ink" d="M58 74q22 8 44 0l-2 6q-20 6-40 0z"/>
    </g>
    <g transform="translate(76 106) scale(-1.1 1.1)">
    <path class="il-metal il-ink il-thin" d="M2 0l2 5 2-5M11 0l2 5 2-5M20 0l2 5 2-5M29 0l2 5 2-5M38 0l2 5 2-5"/>
    <rect class="il-dark il-ink il-thin" x="0" y="-5" width="48" height="5" rx="2"/>
    <path class="il-pink il-ink" d="M1-5v-8h16c4-7 18-9 26-3 5 4 5 8 5 11z"/>
    <path class="il-light il-thin" d="M26-17q8-3 14 1"/>
    <path class="il-line il-thin" d="M18-8q12 2 26 0"/>
    <ellipse class="il-beard il-ink" cx="9" cy="-13" rx="10" ry="3.8"/>
    <ellipse class="il-dark" cx="9" cy="-13" rx="6" ry="1.8"/>
    <path class="il-metal il-ink il-thin" d="M25-19l2-7 3 6zM33-20l4-6 2 7zM41-16l6-4-1 7z"/>
    </g>
    <g transform="translate(86 106) scale(1.1 1.1)">
    <path class="il-metal il-ink il-thin" d="M2 0l2 5 2-5M11 0l2 5 2-5M20 0l2 5 2-5M29 0l2 5 2-5M38 0l2 5 2-5"/>
    <rect class="il-dark il-ink il-thin" x="0" y="-5" width="48" height="5" rx="2"/>
    <path class="il-pink il-ink" d="M1-5v-8h16c4-7 18-9 26-3 5 4 5 8 5 11z"/>
    <path class="il-light il-thin" d="M26-17q8-3 14 1"/>
    <path class="il-line il-thin" d="M18-8q12 2 26 0"/>
    <ellipse class="il-beard il-ink" cx="9" cy="-13" rx="10" ry="3.8"/>
    <ellipse class="il-dark" cx="9" cy="-13" rx="6" ry="1.8"/>
    <path class="il-metal il-ink il-thin" d="M25-19l2-7 3 6zM33-20l4-6 2 7zM41-16l6-4-1 7z"/>
    </g>
    <path class="il-slime il-ink" d="M136 108c-6-10-4-26 6-30 8-2 16 2 18 10v20z"/>
    <circle class="il-green" cx="146" cy="98" r="2.6"/>
    <circle class="il-green" cx="154" cy="90" r="2"/>
    <path class="il-line" d="M139 86l4 2-4 2M150 86l-4 2 4 2"/>
    <path class="il-line il-thin" d="M140 98q3-2 6 0"/>
    <path class="il-slime il-ink" d="M137 88q-6-3-10-4l-1 4q5 1 10 4z"/>
    <path class="il-line il-thin" d="M124 78l-2-4M120 82l-4-1M127 76l1-4"/>
    <path class="il-water il-ink il-thin" d="M150 77.6c1.2 1.8 2.04 2.76 2.04 3.6a2.04 2.04 0 0 1-4.08 0c0-0.84 0.84-1.8 2.04-3.6z"/>`,

  // A disgusted strawberry pinches its nose and holds a slice of very mouldy bread as far away as possible with long kitchen tongs; the fuzzy bread waves back sheepishly, flies buzzing around it.
  'fd.tongs': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <ellipse class="il-dark il-ink il-thin" cx="30" cy="107" rx="6" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="46" cy="107" rx="6" ry="3"/>
    <path class="il-red il-ink" d="M38 52c14 0 22 8 22 22 0 16-12 28-22 32-10-4-22-16-22-32 0-14 8-22 22-22z"/>
    <path class="il-green il-ink" d="M38 56l-6-8-8 2 4-6-6-4 8-1 3-6 5 5 5-5 3 6 8 1-6 4 4 6-8-2z"/>
    <path class="il-yellow" d="M24 72l1 2M30 90l1 2M46 94l1 2M54 76l1 2M36 98l1 2M22 82l1 2"/>
    <path class="il-line il-thin" d="M24 72l1 2M30 90l1 2M46 94l1 2M54 76l1 2M36 98l1 2M22 82l1 2"/>
    <path class="il-line" d="M27 68l5 3-5 3M48 68l-5 3 5 3"/>
    <path class="il-line" d="M30 86q3-3 5 0t5 0t5 0"/>
    <path class="il-line il-thick" d="M20 82q-8-6-2-12"/>
    <circle class="il-red il-ink il-thin" cx="36" cy="78" r="3.4"/>
    <path class="il-line il-thin" d="M19 70q8-2 15 6"/>
    <path class="il-line il-thick" d="M58 82q6 0 8-2"/>
    <circle class="il-red il-ink il-thin" cx="66" cy="80" r="4"/>
    <path class="il-metal il-ink" d="M66 76l50-24 2 4-50 22z"/>
    <path class="il-metal il-ink" d="M66 82l50-8 1 4-50 8z"/>
    <path class="il-metal il-ink il-thin" d="M116 51q4-2 6 1 2 3-2 5l-2-6zM116 73q4-1 5 2 1 3-3 4l-2-6z"/>
    <rect class="il-dark il-ink il-thin" x="64" y="72" width="16" height="6" rx="2" transform="rotate(-25 72 75)"/>
    <rect class="il-dark il-ink il-thin" x="65" y="79" width="16" height="6" rx="2" transform="rotate(-9 73 82)"/>
    <circle class="il-metal il-ink" cx="62" cy="80" r="4.6"/>
    <circle class="il-sky il-ink il-thin" cx="62" cy="80" r="2"/>
    <path class="il-wood il-ink" d="M120 84V60c-6-2-6-16 4-16h20c10 0 10 14 4 16v24z"/>
    <path class="il-paper" d="M124 80V58c-4-1-4-10 2-10h16c6 0 6 9 2 10v22z"/>
    <path class="il-slime il-ink il-thin" d="M126 52c2-3 6-2 6 0 3-1 5 3 2 5-1 3-6 3-7 0-3 0-3-4-1-5zM138 66c2-2 6-1 6 2 2 1 1 5-2 5-2 2-6 0-5-2-2-2-1-5 1-5zM126 74c1-2 4-2 5 0 2 0 2 3 0 4-1 2-4 1-4 0-2-1-2-3-1-4z"/>
    <path class="il-line il-thin" d="M124 50l-2-3M146 48l2-3M150 62l3 0M118 70l-3 0"/>
    <circle class="il-white il-ink il-thin" cx="130" cy="63" r="3"/>
    <circle class="il-dark" cx="129" cy="63" r="1.38"/>
    <circle class="il-white il-ink il-thin" cx="138" cy="60" r="3"/>
    <circle class="il-dark" cx="137" cy="60" r="1.38"/>
    <path class="il-line il-thin" d="M130 70q4 3 8-1"/>
    <path class="il-line il-thick" d="M148 72q6-2 6-10"/>
    <circle class="il-wood il-ink il-thin" cx="154" cy="60" r="3"/>
    <path class="il-line il-thin" d="M124 38q4-4 0-8t0-8"/>
    <path class="il-line il-thin" d="M136 34q4-4 0-8t0-8"/>
    <path class="il-line il-thin" d="M148 38q4-4 0-8t0-8"/>
    <ellipse class="il-white il-ink il-thin" cx="108" cy="27" rx="2.4" ry="1.6"/>
    <ellipse class="il-white il-ink il-thin" cx="112" cy="27" rx="2.4" ry="1.6"/>
    <ellipse class="il-dark" cx="110" cy="30" rx="2.6" ry="2"/>
    <ellipse class="il-white il-ink il-thin" cx="148" cy="89" rx="2.4" ry="1.6"/>
    <ellipse class="il-white il-ink il-thin" cx="152" cy="89" rx="2.4" ry="1.6"/>
    <ellipse class="il-dark" cx="150" cy="92" rx="2.6" ry="2"/>
    <path class="il-line il-thin il-dash" d="M114 26q6-8 12-2M146 98q-6 4-10-2"/>`,

  // A grinning lemon squirts a fully fizzed soda siphon: the jet flattens a broccoli’s proud floret hairdo into a dripping mess, and a little tea light below is already out.
  'fd.soda-siphon': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-dark" opacity="0.3" d="M0 0h9v120H0zM151 0h9v120h-9z"/>
    <path class="il-light il-thin" opacity="0.2" d="M9 0v108M151 0v108"/>
    <polygon class="il-glow" opacity="0.13" points="66,4 94,4 150,108 10,108"/>
    <rect class="il-glow il-ink il-thin" x="66" y="-3" width="28" height="7" rx="3"/>
    <rect class="il-water" opacity="0.45" x="0" y="103" width="160" height="5"/>
    <path class="il-light il-thin" opacity="0.7" d="M14 105h10M60 105h6M120 105h12"/>
    <rect class="il-metal il-ink il-thin" x="-2" y="108" width="164" height="3"/>
    <rect class="il-dark" opacity="0.35" x="0" y="116" width="160" height="4"/>
    <ellipse class="il-dark il-ink il-thin" cx="22" cy="107" rx="6" ry="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="40" cy="107" rx="6" ry="3"/>
    <path class="il-yellow il-ink" d="M10 80l-6-3v7zM56 80l6-3v7z"/>
    <ellipse class="il-yellow il-ink" cx="32" cy="82" rx="24" ry="22"/>
    <circle class="il-gold" cx="16" cy="92" r="1"/>
    <circle class="il-gold" cx="20" cy="98" r="1"/>
    <circle class="il-gold" cx="44" cy="98" r="1"/>
    <circle class="il-white il-ink il-thin" cx="22" cy="74" r="4.4"/>
    <circle class="il-dark" cx="23.6" cy="74" r="2.02"/>
    <circle class="il-white il-ink il-thin" cx="34" cy="74" r="4.4"/>
    <circle class="il-dark" cx="35.6" cy="74" r="2.02"/>
    <path class="il-line" d="M16 66l9 3M40 67l-8 2"/>
    <path class="il-dark il-ink il-thin" d="M20 84q8 8 16 0z"/>
    <g transform="rotate(14 54 70)">
    <rect class="il-blue il-ink" x="36" y="50" width="36" height="40" rx="10"/>
    <path class="il-line il-thin" opacity="0.6" d="M38 62l22 22M38 76l12 12M46 52l24 24M58 52l12 12M70 62L48 84M70 76L58 88M58 52L38 72M46 52l-8 8"/>
    <path class="il-light" d="M42 58v18"/>
    <rect class="il-metal il-ink" x="34" y="84" width="40" height="7" rx="3"/>
    <path class="il-metal il-ink" d="M36 52v-8c0-7 8-11 18-11s18 4 18 11v8z"/>
    <path class="il-metal il-ink" d="M68 38h12l3 5h-5l-1-2h-9z"/>
    <path class="il-metal il-ink" d="M48 33l20-8 2 4-18 7z"/>
    </g>
    <path class="il-line il-thick" d="M46 86q6 2 10-4M50 70q4-6 6-12"/>
    <circle class="il-yellow il-ink il-thin" cx="57" cy="82" r="3.6"/>
    <circle class="il-yellow il-ink il-thin" cx="56" cy="58" r="3.6"/>
    <path class="il-water-line" d="M82 46q20-8 34 2"/>
    <path class="il-water-line" d="M82 50q20-4 32 6"/>
    <circle class="il-white il-ink il-thin" cx="96" cy="40" r="2"/>
    <circle class="il-white il-ink il-thin" cx="104" cy="54" r="1.6"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="54" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="110" cy="38" r="1.6"/>
    <path class="il-slime il-ink" d="M116 60h30l-4 46h-22z"/>
    <path class="il-line il-thin" d="M124 92l2 8M138 92l-2 8"/>
    <path class="il-green il-ink" d="M108 66c0-8 10-12 24-12 10 0 20 4 22 10 2 6 0 14-3 14-2 0-2-6-4-6-1 4-4 6-6 2-2 4-5 4-7 0-2 4-5 4-7 0-2 4-5 4-7 0-2 3-5 3-6-1-3 2-6-2-6-7z"/>
    <path class="il-line il-thin" d="M114 62q14-6 34 0"/>
    <circle class="il-green il-ink il-thin" cx="118" cy="58" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="128" cy="55" r="3.6"/>
    <circle class="il-green il-ink il-thin" cx="139" cy="55" r="3.6"/>
    <circle class="il-green il-ink il-thin" cx="148" cy="59" r="3"/>
    <circle class="il-green il-ink il-thin" cx="104" cy="44" r="3"/>
    <circle class="il-green il-ink il-thin" cx="150" cy="42" r="2.6"/>
    <path class="il-line il-thin" d="M108 48l3 3M146 46l-3 3"/>
    <circle class="il-white il-ink il-thin" cx="124" cy="81" r="3.6"/>
    <circle class="il-dark" cx="124" cy="81.6" r="1.66"/>
    <circle class="il-white il-ink il-thin" cx="137" cy="81" r="3.6"/>
    <circle class="il-dark" cx="137" cy="81.6" r="1.66"/>
    <path class="il-green il-ink il-thin" d="M119 77h10l-1 2h-8zM132 77h10l-1 2h-8z"/>
    <path class="il-line" d="M124 94q6-5 12 0"/>
    <path class="il-water il-ink il-thin" d="M114 73.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <path class="il-water il-ink il-thin" d="M150 79.2c1.4 2.1 2.38 3.22 2.38 4.2a2.38 2.38 0 0 1-4.76 0c0-0.98 0.98-2.1 2.38-4.2z"/>
    <path class="il-water il-ink il-thin" d="M130 67.6c1.2 1.8 2.04 2.76 2.04 3.6a2.04 2.04 0 0 1-4.08 0c0-0.84 0.84-1.8 2.04-3.6z"/>
    <path class="il-water il-ink il-thin" d="M146 93.6c1.2 1.8 2.04 2.76 2.04 3.6a2.04 2.04 0 0 1-4.08 0c0-0.84 0.84-1.8 2.04-3.6z"/>
    <ellipse class="il-water" opacity="0.85" cx="132" cy="107" rx="20" ry="2.6"/>
    <rect class="il-metal il-ink" x="82" y="100" width="18" height="7" rx="2"/>
    <ellipse class="il-white il-ink il-thin" cx="91" cy="100" rx="9" ry="2.4"/>
    <path class="il-line il-thin" d="M91 99v-3"/>
    <path class="il-smoke il-ink il-thin" d="M91 95q-4-4 0-8t0-8q2 4-1 8t1 8z"/>`
};
