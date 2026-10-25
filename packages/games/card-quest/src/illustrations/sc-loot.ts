/* Break Time illustrations: loot. */
export const SC_LOOT: Readonly<Record<string, string>> = {
  // A giant, proud pencil with a face, sharpened to a gleaming needle point, aims at a purple monster that leaps up
  // in alarm; curly shavings and the little sharpener lie on the desk.
  'sc.freshly-sharpened': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="6" y="8" width="62" height="38" rx="2"/>
    <rect class="il-dark" x="10" y="12" width="54" height="30"/>
    <circle class="il-light il-thin" cx="22" cy="24" r="5"/>
    <path class="il-light il-thin" d="M22 15v-2M30 24h2M28.5 17.5l1.5-1.5M15.5 17.5 14 16M36 34q5-8 10 0t10 0"/>
    <path class="il-wood il-ink" d="M0 88h160v32H0z"/>
    <path class="il-wood-dark" d="M0 88h160v5H0z"/>
    <path class="il-line il-thin" d="M10 104h26M54 112h36M120 106h30" opacity="0.4"/>
    <path class="il-yellow il-ink il-thin" d="M18 104a9 9 0 0 1 18 0z"/><path class="il-wood il-ink il-thin" d="M21 104a6 6 0 0 1 12 0z"/>
    <path class="il-line il-thin" d="M27 104v-5M24 104l-2-3M30 104l2-3"/>
    <g transform="rotate(30 50 108)"><path class="il-yellow il-ink il-thin" d="M42 108a8 8 0 0 1 16 0z"/><path class="il-wood il-ink il-thin" d="M45 108a5 5 0 0 1 10 0z"/></g>
    <g transform="rotate(-20 70 100)"><path class="il-yellow il-ink il-thin" d="M63 100a7 7 0 0 1 14 0z"/><path class="il-wood il-ink il-thin" d="M66 100a4 4 0 0 1 8 0z"/></g>
    <rect class="il-blue il-ink" x="100" y="94" width="20" height="13" rx="2"/>
    <circle class="il-dark il-ink il-thin" cx="106" cy="100.5" r="3.4"/>
    <path class="il-metal il-ink il-thin" d="M112 94h8v6h-8z"/>
    <path class="il-white" d="M102 96h4" opacity="0.6"/>
    <g transform="rotate(-12 80 60)">
      <rect class="il-pink il-ink" x="16" y="52" width="16" height="16" rx="4"/>
      <rect class="il-metal il-ink" x="30" y="51" width="12" height="18"/>
      <path class="il-line il-thin" d="M34 51v18M38 51v18"/>
      <path class="il-wood il-ink" d="M110 52 141 60 110 68z"/>
      <path class="il-dark" d="M131 57.4 141 60 131 62.6z"/>
      <rect class="il-yellow il-ink" x="42" y="52" width="68" height="16"/>
      <path class="il-yellow il-ink" d="M108 52h2q3.5 2.7 0 5.3q3.5 2.7 0 5.3q3.5 2.7 0 5.4h-2z"/>
      <path class="il-gold" d="M43 63h66v4H43z"/>
      <path class="il-line il-thin" d="M42 63h68"/>
      <path class="il-white" d="M46 54.5h34v1.6H46z" opacity="0.7"/>
      <circle class="il-white il-ink il-thin" cx="70" cy="58.5" r="3.2"/><circle class="il-dark" cx="71.6" cy="58.5" r="1.5"/>
      <circle class="il-white il-ink il-thin" cx="80" cy="58.5" r="3.2"/><circle class="il-dark" cx="81.6" cy="58.5" r="1.5"/>
      <path class="il-line il-thin" d="M66 54.6l6 1.6M84 54.6l-6 1.6"/>
      <path class="il-dark" d="M88 59h8q-4 5-8 0z"/>
    </g>
    <path class="il-white" d="M150 44l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z"/>
    <path class="il-light il-thin" d="M144 40l-3-3M152 38l1-4"/>
    <path class="il-purple il-ink" d="M126 34c-2-14 4-26 14-26s16 12 14 26c-3-3-5 2-7 0s-4-3-7 0-4 3-7 0-5-3-7 0z"/>
    <path class="il-line" d="M128 20l-8-8M152 20l6-9"/>
    <circle class="il-white il-ink il-thin" cx="135" cy="19" r="4.2"/><circle class="il-dark" cx="135" cy="21.4" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="145" cy="19" r="4.2"/><circle class="il-dark" cx="145" cy="21.4" r="1.8"/>
    <path class="il-line il-thin" d="M131 12.6l6 2M149 12.6l-6 2"/>
    <ellipse class="il-dark" cx="140" cy="28.5" rx="2.2" ry="2.8"/>
    <ellipse class="il-water il-ink il-thin" cx="157" cy="24" rx="1.8" ry="2.8"/>
    <path class="il-dark il-ink il-thin" d="M113 4h4l-1 9h-2z"/><circle class="il-dark" cx="115" cy="17" r="1.6"/>`,

  // A beaming pupil holds up a satchel covered in glitter; glitter is on the hands, the cheeks and the hair too, and a
  // tipped-over glitter pot keeps sprinkling sparkles everywhere.
  'sc.glitter-glued': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="104" y="6" width="54" height="34" rx="2"/>
    <rect class="il-dark" x="108" y="10" width="46" height="26"/>
    <path class="il-light il-thin" d="M114 28q5-10 10 0t10 0t10 0M140 16l6 6M146 16l-6 6"/>
    <path class="il-teal il-ink" d="M40 120c0-20 16-34 40-34s40 14 40 34z"/>
    <path class="il-line il-thin" d="M66 90l14 10 14-10"/>
    <circle class="il-skin il-ink" cx="80" cy="52" r="18"/>
    <path class="il-wood-dark il-ink" d="M61 52c-4-18 8-28 19-28s24 8 19 28c-2-7-6-12-10-12-4 4-12 4-16 0-5 1-9 5-12 12z"/>
    <circle class="il-skin il-ink il-thin" cx="62" cy="54" r="4"/><circle class="il-skin il-ink il-thin" cx="98" cy="54" r="4"/>
    <circle class="il-white il-ink il-thin" cx="73" cy="53" r="4.4"/><circle class="il-dark" cx="74" cy="54" r="2.2"/><circle class="il-white" cx="75" cy="52.6" r="0.9"/>
    <path class="il-line" d="M84 54q4-4 8 0M68 45l7-1M85 44l7 2"/>
    <path class="il-dark il-ink il-thin" d="M71 61h18q-9 11-18 0z"/>
    <path class="il-pink" d="M75 64.5q5 3 10 0q-5 3.5-10 0z"/>
    <g class="il-gold"><circle cx="68" cy="60" r="1.2"/><circle cx="92" cy="59" r="1.2"/><circle cx="90" cy="63" r="1"/><circle cx="66" cy="64" r="0.9"/><circle cx="72" cy="30" r="1.2"/><circle cx="88" cy="33" r="1.2"/><circle cx="64" cy="40" r="1"/></g>
    <g class="il-pink"><circle cx="71" cy="64" r="1"/><circle cx="94" cy="61" r="1"/><circle cx="80" cy="28" r="1"/><circle cx="94" cy="38" r="1"/></g>
    <rect class="il-blue il-ink" x="50" y="78" width="60" height="38" rx="7"/>
    <path class="il-blue il-ink" d="M50 86q0-8 8-8h44q8 0 8 8v14H50z"/>
    <path class="il-line il-thick" d="M70 78q10-12 20 0"/>
    <rect class="il-gold il-ink il-thin" x="74" y="96" width="12" height="9" rx="2"/><rect class="il-dark" x="78.5" y="98.5" width="3" height="4"/>
    <g class="il-yellow"><circle cx="58" cy="84" r="1.6"/><circle cx="66" cy="92" r="1.3"/><circle cx="96" cy="84" r="1.6"/><circle cx="104" cy="92" r="1.3"/><circle cx="60" cy="108" r="1.5"/><circle cx="100" cy="110" r="1.5"/><circle cx="88" cy="88" r="1.2"/></g>
    <g class="il-white"><circle cx="62" cy="88" r="1.2"/><circle cx="84" cy="84" r="1.3"/><circle cx="100" cy="88" r="1.2"/><circle cx="70" cy="110" r="1.2"/><circle cx="92" cy="112" r="1.2"/></g>
    <g class="il-pink"><circle cx="76" cy="88" r="1.3"/><circle cx="106" cy="102" r="1.3"/><circle cx="56" cy="98" r="1.3"/><circle cx="84" cy="110" r="1.2"/></g>
    <path class="il-white" d="M66 98l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>
    <path class="il-white" d="M96 94l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/>
    <circle class="il-skin il-ink" cx="49" cy="96" r="7"/><circle class="il-skin il-ink" cx="111" cy="96" r="7"/>
    <g class="il-gold"><circle cx="47" cy="94" r="1.1"/><circle cx="51" cy="99" r="1.1"/><circle cx="113" cy="93" r="1.1"/><circle cx="109" cy="99" r="1.1"/></g>
    <g class="il-pink"><circle cx="46" cy="99" r="1"/><circle cx="114" cy="98" r="1"/></g>
    <g transform="rotate(-70 22 104)">
      <rect class="il-white il-ink" x="12" y="96" width="20" height="18" rx="3" opacity="0.9"/>
      <rect class="il-pink il-ink" x="10" y="92" width="24" height="6" rx="2"/>
      <g class="il-gold"><circle cx="17" cy="106" r="1.4"/><circle cx="22" cy="108" r="1.4"/><circle cx="27" cy="105" r="1.4"/><circle cx="20" cy="111" r="1.4"/></g>
    </g>
    <g class="il-gold"><circle cx="34" cy="96" r="1.4"/><circle cx="38" cy="90" r="1.2"/><circle cx="32" cy="86" r="1"/><circle cx="42" cy="84" r="1.2"/></g>
    <path class="il-white" d="M20 66l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-yellow" d="M134 60l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
    <path class="il-white" d="M30 30l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>
    <path class="il-pink" d="M142 86l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>`,

  // A swinging ruler with a brass school bell bolted to its end bongs a monster on the head: "ding-dong", and the
  // monster happily sits down for a break with its juice box and sandwich.
  'sc.built-in-bell': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-white il-ink il-thin" x="112" y="8" width="38" height="28" rx="2"/>
    <path class="il-line il-thin" d="M131 8v28M112 22h38"/>
    <path class="il-wood il-ink" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M0 108h160" opacity="0.4"/>
    <path class="il-line il-thin" d="M24 30q10-16 30-16M30 40q14-14 32-12" opacity="0.6"/>
    <path class="il-blue il-ink" d="M0 0h14l2 10-10 8L0 14z"/>
    <g transform="translate(8 12) rotate(20.6)">
      <rect class="il-wood il-ink" x="-4" y="-5.5" width="92" height="11" rx="1.5"/>
      <path class="il-line il-thin" d="M6-5.5v4M12-5.5v2.5M18-5.5v4M24-5.5v2.5M30-5.5v4M36-5.5v2.5M42-5.5v4M48-5.5v2.5M54-5.5v4M60-5.5v2.5M66-5.5v4M72-5.5v2.5M78-5.5v4"/>
    </g>
    <circle class="il-skin il-ink" cx="12" cy="13" r="7"/>
    <path class="il-line il-thin" d="M8 10q4 2 6 0M8 15q4 2 7 0"/>
    <rect class="il-metal il-ink il-thin" x="90" y="34" width="8" height="10" rx="1"/>
    <path class="il-gold il-ink" d="M80 58c0-14 6-20 14-20s14 6 14 20z"/>
    <rect class="il-gold il-ink" x="76" y="57" width="36" height="5" rx="2"/>
    <path class="il-light il-thin" d="M86 54q0-8 5-11"/>
    <circle class="il-metal il-ink il-thin" cx="94" cy="66" r="3.4"/>
    <path class="il-line il-thin" d="M72 44q-6 8 0 16M66 40q-9 12 0 24M116 40q6 6 4 14M122 36q8 10 4 22"/>
    <path class="il-orange il-ink" d="M86 106c-6-28 6-40 26-40s34 12 28 40z"/>
    <path class="il-line il-thin" d="M98 74l2-5 2 5M112 70l2-5 2 5M126 74l2-5 2 5"/>
    <path class="il-yellow il-ink il-thin" d="M96 62l3 5 5-3-2 6 6 1-6 3" />
    <path class="il-line" d="M100 82q4 4 8 0M116 82q4 4 8 0"/>
    <circle class="il-pink" cx="98" cy="90" r="3" opacity="0.8"/><circle class="il-pink" cx="126" cy="90" r="3" opacity="0.8"/>
    <path class="il-line" d="M106 92q6 5 12 0"/>
    <ellipse class="il-orange il-ink" cx="96" cy="106" rx="9" ry="5"/><ellipse class="il-orange il-ink" cx="130" cy="106" rx="9" ry="5"/>
    <path class="il-paper il-ink" d="M84 98l14-12 4 14z"/>
    <path class="il-green il-ink il-thin" d="M86 97q6-3 13-8"/>
    <circle class="il-orange il-ink" cx="96" cy="99" r="4"/>
    <rect class="il-teal il-ink" x="132" y="80" width="12" height="16" rx="1.5"/>
    <path class="il-white" d="M135 85h6v6h-6z" opacity="0.8"/>
    <path class="il-line il-thin" d="M140 80l3-9h4"/>
    <circle class="il-orange il-ink" cx="134" cy="94" r="4"/>`,

  // A smug old dog with round spectacles and a grey muzzle points at a dusty antique slate with a stick: it knows all
  // the tricks already. A cobweb and a dangling spider show how old the teaching collection is.
  'sc.old-teaching-collection': `
    <rect class="il-wood-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M40 0v100M80 0v100M120 0v100" opacity="0.35"/>
    <path class="il-light il-thin" d="M0 0l30 8M0 0l22 22M0 0l8 30M12 3q3 7-3 9t-6-2M22 6q4 12-7 13t-12 0" opacity="0.8"/>
    <path class="il-line il-thin" d="M150 0v18"/>
    <ellipse class="il-dark il-ink il-thin" cx="150" cy="21" rx="3" ry="3.4"/>
    <path class="il-line il-thin" d="M147 19l-4-2M147 22l-4 1M153 19l4-2M153 22l4 1"/>
    <path class="il-wood il-ink" d="M0 100h160v8H0z"/>
    <rect class="il-earth-dark" x="0" y="108" width="160" height="12"/>
    <g transform="rotate(-4 50 66)">
      <rect class="il-wood il-ink" x="14" y="30" width="72" height="70" rx="3"/>
      <rect class="il-dark il-ink il-thin" x="21" y="37" width="58" height="56"/>
      <path class="il-line il-thin" d="M17 34h4M79 34h4M17 96h4M79 96h4" opacity="0.6"/>
      <circle class="il-light il-thin" cx="34" cy="50" r="5"/>
      <path class="il-light il-thin" d="M34 41v-2M43 50h2M25 50h-2M40.5 43.5l1.5-1.5M27.5 43.5 26 42"/>
      <path class="il-light il-thin" d="M28 70q5-6 10 0t10 0t10 0t10 0M56 46l4 4 9-10M30 84h40"/>
      <path class="il-smoke il-ink il-thin" d="M16 31q6-6 12-1 6-5 12 0 7-5 14 0 6-4 12 0 6-4 12 1v2H16z"/>
      <path class="il-line il-thin" d="M24 100l-2 10"/>
      <rect class="il-yellow il-ink il-thin" x="15" y="108" width="14" height="9" rx="2"/>
      <g class="il-wood-dark"><circle cx="19" cy="111" r="1"/><circle cx="24" cy="114" r="1"/><circle cx="25" cy="110.5" r="0.8"/></g>
    </g>
    <g class="il-smoke"><circle cx="96" cy="24" r="1.2"/><circle cx="104" cy="14" r="1"/><circle cx="92" cy="40" r="0.9"/><circle cx="62" cy="18" r="1"/></g>
    <path class="il-stone il-ink" d="M140 90c10 2 16-6 12-14" />
    <ellipse class="il-stone il-ink" cx="124" cy="82" rx="20" ry="19"/>
    <ellipse class="il-beard il-ink il-thin" cx="122" cy="84" rx="9" ry="12"/>
    <ellipse class="il-stone il-ink" cx="114" cy="99" rx="7" ry="4"/><ellipse class="il-stone il-ink" cx="134" cy="99" rx="7" ry="4"/>
    <path class="il-line il-thick" d="M104 74 62 48"/>
    <circle class="il-white il-ink il-thin" cx="61" cy="47.5" r="1.6"/>
    <ellipse class="il-stone il-ink" cx="106" cy="74" rx="6" ry="5"/>
    <ellipse class="il-wood-dark il-ink" cx="109" cy="54" rx="6" ry="13" transform="rotate(14 109 54)"/>
    <ellipse class="il-wood-dark il-ink" cx="141" cy="54" rx="6" ry="13" transform="rotate(-14 141 54)"/>
    <circle class="il-stone il-ink" cx="125" cy="50" r="16"/>
    <ellipse class="il-beard il-ink il-thin" cx="125" cy="60" rx="10" ry="7"/>
    <ellipse class="il-dark" cx="125" cy="55" rx="3.6" ry="2.6"/>
    <path class="il-line il-thin" d="M125 58v3M120 63q5 4 10 0"/>
    <path class="il-line il-thin" d="M114 44.5q3-2 6 0M130 44.5q3-2 6 0"/>
    <circle class="il-white il-ink il-thin" cx="119" cy="45" r="5" opacity="0.35"/><circle class="il-white il-ink il-thin" cx="131" cy="45" r="5" opacity="0.35"/>
    <circle class="il-line il-thin" cx="119" cy="45" r="5"/><circle class="il-line il-thin" cx="131" cy="45" r="5"/>
    <path class="il-line il-thin" d="M124 45h2M114 44l-4-2M136 44l4-2"/>
    <path class="il-dark" d="M116 46q3 2 6 0zM128 46q3 2 6 0z"/>
    <path class="il-beard il-ink il-thin" d="M112 39q4-5 10-2-5 0-10 2zM138 39q-4-5-10-2 5 0 10 2z"/>`,

  // Sports day: a pupil gives the last metres everything — tongue out, sweat flying, dust clouds behind — and bursts
  // through the finish tape, while a puffing monster trails far behind.
  'sc.final-sprint': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white il-ink il-thin" d="M18 22q0-8 8-8 2-6 9-5 6-4 11 2 7 0 7 7 0 4-4 4H22q-4 0-4 0z" opacity="0.9"/>
    <path class="il-grass" d="M0 64h160v56H0z"/>
    <path class="il-earth" d="M0 78h160v42H0z"/>
    <path class="il-light il-thin" d="M0 92h160M0 106h160" opacity="0.8"/>
    <rect class="il-white il-ink il-thin" x="132" y="36" width="4" height="50"/>
    <rect class="il-white il-ink il-thin" x="150" y="44" width="4" height="72"/>
    <path class="il-white il-ink il-thin" d="M134 46q-5 6-9 4t-9 7l2 3q5-5 8-4t9-6z"/>
    <path class="il-white il-ink il-thin" d="M152 56q-6 8-11 6t-10 8l2 3q5-6 10-5t9-8z"/>
    <path class="il-line il-thin" d="M4 52h22M10 60h20M2 70h18" opacity="0.6"/>
    <path class="il-green il-ink" d="M6 104c-2-16 4-26 12-26s14 10 12 26z"/>
    <circle class="il-white il-ink il-thin" cx="15" cy="88" r="2.6"/><circle class="il-dark" cx="16" cy="88.5" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="22" cy="88" r="2.6"/><circle class="il-dark" cx="23" cy="88.5" r="1.2"/>
    <path class="il-dark" d="M15 94h8q-4 6-8 0z"/><path class="il-pink il-ink il-thin" d="M18 96h4v4q-2 2-4 0z"/>
    <ellipse class="il-water il-ink il-thin" cx="30" cy="80" rx="1.6" ry="2.4"/>
    <circle class="il-smoke il-ink il-thin" cx="52" cy="96" r="7"/><circle class="il-smoke il-ink il-thin" cx="42" cy="92" r="5"/><circle class="il-smoke il-ink il-thin" cx="40" cy="101" r="4"/>
    <circle class="il-smoke" cx="51" cy="95" r="6"/>
    <g transform="translate(92 74) rotate(130.6)"><rect class="il-wood il-ink" x="0" y="-4.5" width="19" height="9" rx="4.5"/></g>
    <g transform="translate(80 88) rotate(-167.5)"><rect class="il-wood il-ink" x="0" y="-4" width="18" height="8" rx="4"/></g>
    <ellipse class="il-red il-ink" cx="62" cy="84" rx="7" ry="4" transform="rotate(-20 62 84)"/>
    <g transform="translate(96 48) rotate(140)"><rect class="il-wood il-ink" x="0" y="-3.5" width="15" height="7" rx="3.5"/></g>
    <g transform="translate(85 57) rotate(-140)"><rect class="il-wood il-ink" x="0" y="-3.5" width="13" height="7" rx="3.5"/></g>
    <g transform="rotate(22 96 58)">
      <rect class="il-yellow il-ink" x="86" y="42" width="22" height="28" rx="6"/>
      <rect class="il-white il-ink il-thin" x="91" y="50" width="12" height="10" rx="1"/>
      <path class="il-line il-thin" d="M93 53h8M93 57h6"/>
      <rect class="il-blue il-ink" x="86" y="66" width="22" height="10" rx="3"/>
    </g>
    
    <g transform="translate(98 76) rotate(6.3)"><rect class="il-wood il-ink" x="0" y="-4.5" width="19" height="9" rx="4.5"/></g>
    <g transform="translate(116 78) rotate(84.3)"><rect class="il-wood il-ink" x="0" y="-4" width="19" height="8" rx="4"/></g>
    <ellipse class="il-red il-ink" cx="121" cy="98" rx="8" ry="4"/>
    <path class="il-white il-thin" d="M116 98h6"/>
    <g transform="translate(106 46) rotate(48)"><rect class="il-wood il-ink" x="0" y="-3.5" width="15" height="7" rx="3.5"/></g>
    <g transform="translate(116 57) rotate(-50)"><rect class="il-wood il-ink" x="0" y="-3.5" width="13" height="7" rx="3.5"/></g>
    <circle class="il-wood il-ink" cx="125" cy="47" r="4"/>
    <circle class="il-wood il-ink" cx="110" cy="30" r="12"/>
    <path class="il-dark il-ink" d="M98 28c0-10 6-14 13-14s12 4 11 12c-4-4-10-6-16-4-3 1-5 3-8 6z"/>
    <path class="il-red il-ink il-thin" d="M98.5 25q11-6 23-1l-.5 4q-11-4-22 1z"/>
    <path class="il-line" d="M107 31l5-1M116 31l4 0"/>
    <circle class="il-dark" cx="110" cy="33.5" r="1.6"/><circle class="il-dark" cx="118" cy="33.5" r="1.6"/>
    <ellipse class="il-dark" cx="116" cy="40" rx="3.6" ry="3.2"/>
    <path class="il-pink il-ink il-thin" d="M113.6 41.4h5q0 5.6-2.5 5.6t-2.5-5.6z"/>
    <ellipse class="il-water il-ink il-thin" cx="92" cy="22" rx="1.8" ry="2.6"/><ellipse class="il-water il-ink il-thin" cx="88" cy="32" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" d="M60 40h16M56 50h14M64 30h12"/>`,

  // Two board sponges clapped together above a pupil's head: a huge chalk cloud swallows the classroom, and the
  // teacher, the pupil and the monster all come out with white, powdered hair, coughing.
  'sc.chalk-dust-cloud': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="4" y="4" width="152" height="66" rx="2"/>
    <rect class="il-dark" x="9" y="9" width="142" height="56"/>
    <path class="il-light il-thin" d="M16 52q6-8 12 0t12 0M132 20l8 8M140 20l-8 8" opacity="0.7"/>
    <g class="il-smoke il-ink il-thin">
      <circle cx="48" cy="40" r="22"/><circle cx="80" cy="30" r="24"/><circle cx="112" cy="40" r="22"/>
      <circle cx="30" cy="58" r="15"/><circle cx="130" cy="58" r="15"/><circle cx="64" cy="58" r="18"/><circle cx="96" cy="58" r="18"/>
    </g>
    <g class="il-smoke">
      <circle cx="48" cy="40" r="21"/><circle cx="80" cy="30" r="23"/><circle cx="112" cy="40" r="21"/>
      <circle cx="30" cy="58" r="14"/><circle cx="130" cy="58" r="14"/><circle cx="64" cy="58" r="17"/><circle cx="96" cy="58" r="17"/>
    </g>
    <path class="il-white" d="M40 30q6-6 14-4M74 18q6-4 12-2M104 30q6-4 12-1" opacity="0.8"/>
    <path class="il-wood il-ink" d="M0 100h160v20H0z"/>
    <path class="il-purple il-ink" d="M14 120c0-14 8-20 20-20s20 6 20 20z"/>
    <circle class="il-skin il-ink" cx="34" cy="88" r="13"/>
    <path class="il-beard il-ink" d="M20 88c-6-6-2-16 4-16 2-6 10-8 14-4 6-2 12 2 12 8 6 2 6 10 2 12-2-6-8-8-16-8s-14 2-16 8z"/>
    <rect class="il-white il-ink il-thin" x="25" y="85" width="8" height="6" rx="2"/><rect class="il-white il-ink il-thin" x="36" y="85" width="8" height="6" rx="2"/>
    <path class="il-line il-thin" d="M33 88h3"/>
    <ellipse class="il-dark" cx="35" cy="96.5" rx="2.6" ry="2"/>
    <circle class="il-smoke il-ink il-thin" cx="46" cy="99" r="2.4"/><circle class="il-smoke il-ink il-thin" cx="50" cy="95" r="1.6"/>
    <path class="il-orange il-ink" d="M62 120c0-12 8-18 18-18s18 6 18 18z"/>
    <g transform="translate(70 98) rotate(-110)"><rect class="il-orange il-ink" x="0" y="-4" width="34" height="8" rx="4"/></g>
    <g transform="translate(90 98) rotate(-70)"><rect class="il-orange il-ink" x="0" y="-4" width="34" height="8" rx="4"/></g>
    <circle class="il-wood-dark il-ink" cx="80" cy="88" r="12"/>
    <path class="il-beard il-ink" d="M68 86c-4-6 0-14 6-13 2-4 10-5 12 0 6-1 9 6 6 12-3-5-8-6-12-6s-9 1-12 7z"/>
    <path class="il-line" d="M73 90q2.5-2 5 0M83 90q2.5-2 5 0"/>
    <path class="il-dark" d="M75 94h10q-5 6-10 0z"/>
    <circle class="il-white" cx="74" cy="96" r="0.9"/><circle class="il-white" cx="88" cy="86" r="0.9"/>
    <circle class="il-wood-dark il-ink" cx="62" cy="65" r="5"/><circle class="il-wood-dark il-ink" cx="98" cy="65" r="5"/>
    <g transform="rotate(-16 72 54)"><rect class="il-yellow il-ink" x="62" y="46" width="16" height="12" rx="2"/><rect class="il-wood-dark il-ink il-thin" x="62" y="56" width="16" height="5" rx="1"/></g>
    <g transform="rotate(16 88 54)"><rect class="il-yellow il-ink" x="82" y="46" width="16" height="12" rx="2"/><rect class="il-wood-dark il-ink il-thin" x="82" y="56" width="16" height="5" rx="1"/></g>
    <path class="il-line il-thin" d="M80 40v-5M74 41l-3-4M86 41l3-4"/>
    <path class="il-green il-ink" d="M110 120c-4-24 2-40 18-40s22 16 18 40z"/>
    <path class="il-green il-ink il-thin" d="M114 86l-6-10 10 5zM142 86l6-10-10 5z"/>
    <path class="il-beard il-ink" d="M114 86c-2-8 4-10 8-8 2-6 10-6 12 0 4-2 10 0 8 8-4-3-8-3-14-3s-10 0-14 3z"/>
    <circle class="il-white il-ink il-thin" cx="122" cy="94" r="4.2"/><circle class="il-dark" cx="122" cy="94" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="134" cy="94" r="4.2"/><circle class="il-dark" cx="134" cy="94" r="1.8"/>
    <ellipse class="il-dark" cx="128" cy="105" rx="3.4" ry="2.6"/>
    <circle class="il-smoke il-ink il-thin" cx="116" cy="108" r="2.4"/><circle class="il-smoke il-ink il-thin" cx="111" cy="104" r="1.6"/>
    <g class="il-smoke" opacity="0.7"><circle cx="20" cy="76" r="4"/><circle cx="148" cy="78" r="5"/><circle cx="56" cy="80" r="3"/><circle cx="104" cy="78" r="3"/></g>`,

  // Fire drill in the school yard: pupils walk out in neat pairs holding hands, and a baffled monster has ended up in
  // the line too; the teacher in a hi-vis vest counts it with a raised eyebrow while the alarm bell rings.
  'sc.fire-drill': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-earth il-ink" x="-2" y="2" width="164" height="54"/>
    <path class="il-line il-thin" d="M0 16h160M0 30h160M0 44h160" opacity="0.25"/>
    <rect class="il-sky il-ink" x="10" y="10" width="22" height="18"/><path class="il-line il-thin" d="M21 10v18M10 19h22"/>
    <rect class="il-sky il-ink" x="46" y="10" width="22" height="18"/><path class="il-line il-thin" d="M57 10v18M46 19h22"/>
    <rect class="il-sky il-ink" x="82" y="10" width="22" height="18"/><path class="il-line il-thin" d="M93 10v18M82 19h22"/>
    <circle class="il-red il-ink" cx="138" cy="18" r="9"/><circle class="il-metal il-ink il-thin" cx="138" cy="18" r="3"/>
    <path class="il-line il-thin" d="M126 12q-3 6 0 12M122 9q-5 9 0 18M150 12q3 6 0 12M154 9q5 9 0 18"/>
    <path class="il-stone" d="M0 56h160v64H0z"/>
    <path class="il-line il-thin" d="M0 80h160M30 56l-10 64M80 56v64M130 56l10 64" opacity="0.25"/>
    <rect class="il-dark il-ink il-thin" x="14" y="88" width="5" height="16" rx="2"/><rect class="il-dark il-ink il-thin" x="21" y="88" width="5" height="16" rx="2"/>
    <rect class="il-green il-ink" x="12" y="68" width="16" height="22" rx="5"/>
    <circle class="il-skin il-ink" cx="20" cy="60" r="9"/>
    <path class="il-yellow il-ink il-thin" d="M11 59c0-8 4-11 9-11s9 3 9 9c-4-3-10-4-18 2z"/>
    <circle class="il-dark" cx="17" cy="61" r="1.4"/><circle class="il-dark" cx="23" cy="61" r="1.4"/><path class="il-line il-thin" d="M18 65q2 1.5 4 0"/>
    <rect class="il-dark il-ink il-thin" x="34" y="88" width="5" height="16" rx="2"/><rect class="il-dark il-ink il-thin" x="41" y="88" width="5" height="16" rx="2"/>
    <rect class="il-red il-ink" x="32" y="68" width="16" height="22" rx="5"/>
    <path class="il-skin il-ink il-thin" d="M27 78h7v4h-7z"/>
    <circle class="il-wood-dark il-ink" cx="40" cy="60" r="9"/>
    <path class="il-dark il-ink il-thin" d="M31 58c-1-8 5-11 9-11s10 3 9 11c-2-3-4-5-9-5s-7 2-9 5z"/>
    <circle class="il-white" cx="37" cy="61" r="1.4"/><circle class="il-white" cx="43" cy="61" r="1.4"/><path class="il-light il-thin" d="M38 65q2 1.5 4 0"/>
    <rect class="il-dark il-ink il-thin" x="60" y="88" width="5" height="16" rx="2"/><rect class="il-dark il-ink il-thin" x="67" y="88" width="5" height="16" rx="2"/>
    <rect class="il-blue il-ink" x="58" y="68" width="16" height="22" rx="5"/>
    <circle class="il-orange il-ink" cx="66" cy="60" r="9"/>
    <path class="il-wood-dark il-ink il-thin" d="M57 60c-2-9 4-13 9-13s11 4 9 13l-2-4-3 2-4-3-4 3-3-2z"/>
    <circle class="il-dark" cx="63" cy="62" r="1.4"/><circle class="il-dark" cx="69" cy="62" r="1.4"/><path class="il-line il-thin" d="M64 66q2 1.5 4 0"/>
    <path class="il-orange il-ink il-thin" d="M73 76h9v4h-9z"/>
    <ellipse class="il-purple il-ink" cx="88" cy="103" rx="5" ry="3"/><ellipse class="il-purple il-ink" cx="101" cy="103" rx="5" ry="3"/>
    <path class="il-purple il-ink" d="M80 102c-4-20-2-44 14-44s18 24 14 44z"/>
    <circle class="il-white il-ink il-thin" cx="89" cy="70" r="4"/><circle class="il-dark" cx="90.4" cy="71" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="99" cy="69" r="4.6"/><circle class="il-dark" cx="98" cy="71" r="1.9"/>
    <path class="il-line il-thin" d="M85 63l6 2M96 62l6-1M90 82q2-2 4 0 2 2 4 0"/>
    <path class="il-line" d="M89 46q0-6 5-6t5 5-5 6v2"/><circle class="il-dark" cx="94" cy="58" r="1.4"/>
    <rect class="il-dark il-ink il-thin" x="124" y="96" width="5" height="16" rx="2"/><rect class="il-dark il-ink il-thin" x="133" y="96" width="5" height="16" rx="2"/>
    <path class="il-teal il-ink" d="M120 98l2-34h18l2 34z"/>
    <path class="il-yellow il-ink il-thin" d="M123 64h16l1 24h-18z"/>
    <path class="il-white il-thin" d="M123 76h17" opacity="0.9"/>
    <g transform="translate(124 70) rotate(170)"><rect class="il-teal il-ink" x="0" y="-3.5" width="14" height="7" rx="3.5"/></g>
    <circle class="il-wood il-ink" cx="109" cy="72" r="3.4"/>
    <path class="il-wood il-ink il-thin" d="M106 71l-5-1"/>
    <rect class="il-wood-dark il-ink" x="140" y="70" width="14" height="18" rx="1.5"/>
    <rect class="il-paper il-ink il-thin" x="142" y="73" width="10" height="13"/>
    <path class="il-line il-thin" d="M144 76v4M146 76v4M148 76v4M143 75l7 4M144 82h6"/>
    <circle class="il-wood il-ink" cx="141" cy="80" r="3.4"/>
    <circle class="il-wood il-ink" cx="131" cy="52" r="10"/>
    <circle class="il-dark il-ink il-thin" cx="131" cy="38" r="5"/>
    <path class="il-dark il-ink il-thin" d="M121 52c-1-8 4-11 10-11s11 3 10 11c-3-4-6-6-10-6s-7 2-10 6z"/>
    <path class="il-line il-thin" d="M124 47q3-4 6-1M134 49h5"/>
    <circle class="il-dark" cx="127" cy="53" r="1.5"/><circle class="il-dark" cx="136" cy="53" r="1.5"/>
    <path class="il-line il-thin" d="M128 59h6"/>`,

  // Extreme close-up of a teacher whose glasses have slid down the nose: one eyebrow shoots up, the eyes look over
  // the rims — and down in the corner a tiny monster sits bolt upright at its desk, sweating.
  'sc.look-over-the-glasses': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="-2" y="-2" width="164" height="60"/>
    <rect class="il-dark" x="2" y="2" width="156" height="52"/>
    <path class="il-light il-thin" d="M120 16q6-8 12 0t12 0M8 40l8 8M16 40l-8 8" opacity="0.6"/>
    <path class="il-purple il-ink" d="M36 120c2-12 16-18 38-18s36 6 38 18z"/>
    <path class="il-white il-ink il-thin" d="M62 104l12 10 12-10z"/>
    <ellipse class="il-wood il-ink" cx="39" cy="68" rx="5" ry="8"/><ellipse class="il-wood il-ink" cx="109" cy="68" rx="5" ry="8"/>
    <ellipse class="il-wood il-ink" cx="74" cy="66" rx="35" ry="42"/>
    <circle class="il-grey il-ink" cx="74" cy="16" r="11"/>
    <path class="il-line il-thin" d="M67 12q7-4 14 0M66 18q8 4 16 0"/>
    <path class="il-grey il-ink" d="M39 62c-2-28 14-40 35-40s37 12 35 40c-4-14-14-24-35-24S43 48 39 62z"/>
    <path class="il-line il-thin" d="M56 30q-8 8-10 20M92 30q8 8 10 20" opacity="0.5"/>
    <ellipse class="il-white il-ink il-thin" cx="60" cy="58" rx="7.5" ry="5.6"/><ellipse class="il-white il-ink il-thin" cx="88" cy="58" rx="7.5" ry="5.6"/>
    <circle class="il-dark" cx="63.5" cy="60.4" r="3.2"/><circle class="il-dark" cx="91.5" cy="60.4" r="3.2"/>
    <circle class="il-white" cx="64.6" cy="59.2" r="0.9"/><circle class="il-white" cx="92.6" cy="59.2" r="0.9"/>
    <path class="il-wood il-ink il-thin" d="M52 56.5q8-5.5 16 0q-8-2-16 0zM80 56.5q8-5.5 16 0q-8-2-16 0z"/>
    <path class="il-line il-thick" d="M49 46q10-12 22-4M80 50q8-3 17 0"/>
    <path class="il-line" d="M72 60q-5 14-1 18q4 2 8-1"/>
    <path class="il-water" d="M52 74h18v11H52zM80 74h18v11H80z" opacity="0.35"/>
    <rect class="il-line" x="52" y="74" width="18" height="11" rx="3"/><rect class="il-line" x="80" y="74" width="18" height="11" rx="3"/>
    <path class="il-line" d="M70 78q5-3 10 0M52 77 40 66M98 77l11-11"/>
    <path class="il-white" d="M55 76l4 0-4 4z" opacity="0.6"/><path class="il-white" d="M83 76l4 0-4 4z" opacity="0.6"/>
    <path class="il-line" d="M64 96q10-2 20 0"/>
    <path class="il-line il-thin" d="M62 94l2 2M86 94l-2 2M48 86q2 4 6 5M100 86q-2 4-6 5"/>
    <path class="il-teal il-ink" d="M126 104V84q0-10 12-10t12 10v20z"/>
    <path class="il-line il-thin" d="M122 82v20M154 82v20"/>
    <circle class="il-white il-ink il-thin" cx="133" cy="85" r="3.4"/><circle class="il-dark" cx="133" cy="85" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="143" cy="85" r="3.4"/><circle class="il-dark" cx="143" cy="85" r="1.4"/>
    <path class="il-line il-thin" d="M134 93h8"/>
    <ellipse class="il-water il-ink il-thin" cx="151" cy="76" rx="1.8" ry="2.6"/>
    <rect class="il-wood il-ink" x="118" y="100" width="40" height="6" rx="1"/>
    <path class="il-line" d="M122 106v12M154 106v12"/>
    <rect class="il-paper il-ink il-thin" x="130" y="97" width="16" height="4"/>`,

  // A two-tone eraser with a fierce grin flies in from the back row and rubs out half of a green monster: one eye and
  // a horn are only dashed outlines now, and eraser crumbs rain down.
  'sc.flying-eraser': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="40" y="4" width="80" height="22" rx="2"/>
    <rect class="il-dark" x="44" y="8" width="72" height="14"/>
    <path class="il-light il-thin" d="M50 18q5-6 10 0t10 0M96 12l4 4 8-6" opacity="0.7"/>
    <path class="il-wood" d="M0 96h160v24H0z"/>
    <path class="il-line il-thin" d="M0 96h160M0 108h160" opacity="0.5"/>
    <rect class="il-red il-ink" x="12" y="66" width="20" height="18" rx="5"/>
    <g transform="translate(28 70) rotate(-40)"><rect class="il-red il-ink" x="0" y="-3.5" width="14" height="7" rx="3.5"/></g>
    <circle class="il-skin il-ink" cx="40" cy="60" r="3.6"/>
    <circle class="il-orange il-ink" cx="22" cy="56" r="10"/>
    <path class="il-dark il-ink il-thin" d="M12 54c0-8 4-11 10-11s11 4 10 10c-3-3-6-4-10-4s-7 2-10 5z"/>
    <path class="il-line il-thin" d="M17 55l4 1M25 56l4-1"/>
    <circle class="il-dark" cx="19" cy="58" r="1.3"/><circle class="il-dark" cx="27" cy="58" r="1.3"/>
    <path class="il-line il-thin" d="M19 62q4 3 8-1"/>
    <rect class="il-wood il-ink" x="2" y="80" width="44" height="6" rx="1"/>
    <path class="il-line" d="M6 86v10M42 86v10"/>
    <path class="il-line il-dash il-thin" d="M42 56q14-22 34-20"/>
    <path class="il-line il-thin" d="M52 42h12M50 48h12M56 54h10"/>
    <path class="il-green il-ink" d="M100 110c-6-28 0-54 26-54s32 26 26 54z"/>
    <path class="il-green il-ink il-thin" d="M140 60l8-14-1 16z"/>
    <path class="il-sky" d="M88 38H125L101 96H88z"/>
    <path class="il-light il-dash il-thin" d="M100 104q-6-40 22-48M108 62l-6-14 12 8"/>
    <circle class="il-light il-dash il-thin" cx="106" cy="74" r="5"/>
    <path class="il-light il-thin" d="M119 54l-7 3 8 2-9 4 8 2-9 4 8 2-9 4 8 2-9 4" opacity="0.5"/>
    <circle class="il-white il-ink il-thin" cx="134" cy="74" r="6"/><circle class="il-dark" cx="132" cy="74" r="2.6"/>
    <path class="il-line" d="M126 64l10 4"/>
    <ellipse class="il-dark" cx="128" cy="94" rx="4" ry="5"/>
    <g transform="rotate(-14 90 46)">
      <rect class="il-pink il-ink" x="76" y="38" width="20" height="16" rx="3"/>
      <rect class="il-blue il-ink" x="94" y="38" width="10" height="16" rx="3"/>
      <path class="il-line il-thin" d="M80 41l5 2M92 41l-5 2"/>
      <circle class="il-dark" cx="82.6" cy="45" r="1.4"/><circle class="il-dark" cx="89" cy="45" r="1.4"/>
      <path class="il-dark" d="M81 49h10q-5 4-10 0z"/>
    </g>
    <g class="il-pink il-ink il-thin">
      <ellipse cx="106" cy="66" rx="2.4" ry="1.2" transform="rotate(30 106 66)"/><ellipse cx="102" cy="78" rx="2" ry="1"/>
      <ellipse cx="110" cy="86" rx="2.4" ry="1.2" transform="rotate(-20 110 86)"/><ellipse cx="98" cy="96" rx="2" ry="1"/>
      <ellipse cx="114" cy="100" rx="2" ry="1" transform="rotate(40 114 100)"/>
    </g>
    <g class="il-grey"><circle cx="104" cy="72" r="1"/><circle cx="108" cy="92" r="1"/><circle cx="96" cy="104" r="1"/></g>`,

  // Marbles roll out of a tipped pouch across the classroom floor: a blue monster slips and flies flat on its back,
  // dizzy, while a ring of its own lost marbles circles its head.
  'sc.handful-of-marbles': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-white il-ink il-thin" x="12" y="8" width="36" height="26" rx="2"/>
    <path class="il-line il-thin" d="M30 8v26M12 21h36"/>
    <path class="il-wood" d="M0 82h160v38H0z"/>
    <path class="il-line il-thin" d="M0 82h160M0 96h160M0 110h160M40 82v14M100 96v14M70 110v10M130 82v14" opacity="0.4"/>
    <path class="il-purple il-ink" d="M6 104c-4-14 4-26 16-26 6 0 12 6 14 12l2 14q-14 8-32 0z"/>
    <path class="il-purple-dark il-ink il-thin" d="M30 82q6 4 6 12-2-2-6-2z"/>
    <path class="il-line il-thin" d="M20 78q-2-6 4-8M14 92l6 2"/>
    <g class="il-line il-thin" opacity="0.6"><path d="M46 104h8M60 98h6M70 108h8M84 102h6"/></g>
    <circle class="il-red il-ink il-thin" cx="42" cy="104" r="4.5"/><circle class="il-white" cx="40.6" cy="102.6" r="1.2"/>
    <circle class="il-teal il-ink il-thin" cx="58" cy="106" r="4.5"/><circle class="il-white" cx="56.6" cy="104.6" r="1.2"/>
    <circle class="il-yellow il-ink il-thin" cx="68" cy="98" r="4"/><circle class="il-white" cx="66.8" cy="96.8" r="1.1"/>
    <circle class="il-green il-ink il-thin" cx="82" cy="110" r="4.5"/><circle class="il-white" cx="80.6" cy="108.6" r="1.2"/>
    <circle class="il-blue il-ink il-thin" cx="94" cy="102" r="4"/><circle class="il-white" cx="92.8" cy="100.8" r="1.1"/>
    <circle class="il-orange il-ink il-thin" cx="116" cy="108" r="4.5"/><circle class="il-white" cx="114.6" cy="106.6" r="1.2"/>
    <circle class="il-pink il-ink il-thin" cx="140" cy="104" r="4"/><circle class="il-white" cx="138.8" cy="102.8" r="1.1"/>
    <path class="il-line il-thin" d="M70 56l-6-4M72 66l-8 0M144 52l8-4M146 62l8 2"/>
    <g transform="translate(97 80) rotate(-140)"><rect class="il-blue il-ink" x="0" y="-4" width="20" height="8" rx="4"/></g>
    <ellipse class="il-blue il-ink" cx="80" cy="66" rx="8" ry="5" transform="rotate(-40 80 66)"/>
    <ellipse class="il-dark" cx="78" cy="64" rx="5" ry="2.4" transform="rotate(-40 78 64)"/>
    <g transform="translate(101 82) rotate(115)"><rect class="il-blue il-ink" x="0" y="-4" width="16" height="8" rx="4"/></g>
    <circle class="il-teal il-ink il-thin" cx="92" cy="103" r="4.5"/><circle class="il-white" cx="90.6" cy="101.6" r="1.2"/>
    <ellipse class="il-blue il-ink" cx="94" cy="96" rx="8" ry="4.4" transform="rotate(-20 94 96)"/>
    <g transform="translate(100 46) rotate(-130)"><rect class="il-blue il-ink" x="0" y="-3.5" width="18" height="7" rx="3.5"/></g>
    <g transform="translate(124 58) rotate(-30)"><rect class="il-blue il-ink" x="0" y="-3.5" width="20" height="7" rx="3.5"/></g>
    <circle class="il-blue il-ink" cx="89" cy="33" r="4.4"/><circle class="il-blue il-ink" cx="141" cy="48" r="4.4"/>
    <g transform="rotate(35 110 61)">
      <rect class="il-blue il-ink" x="92" y="36" width="36" height="50" rx="18"/>
      <path class="il-blue il-ink il-thin" d="M100 40l2-8 4 6 4-8 4 8 4-6 2 8"/>
      <path class="il-line il-thin" d="M98 74l3 3M106 78l2-3M116 76l3 3" opacity="0.6"/>
      <circle class="il-white il-ink il-thin" cx="103" cy="50" r="5.4"/><circle class="il-white il-ink il-thin" cx="117" cy="50" r="5.4"/>
      <path class="il-line il-thin" d="M103 50m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3M117 50m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3"/>
      <ellipse class="il-dark" cx="110" cy="64" rx="4" ry="5"/>
    </g>
    <ellipse class="il-line il-dash il-thin" cx="124" cy="20" rx="24" ry="7"/>
    <circle class="il-red il-ink il-thin" cx="100" cy="20" r="3.4"/><circle class="il-yellow il-ink il-thin" cx="116" cy="27" r="3.4"/>
    <circle class="il-green il-ink il-thin" cx="138" cy="25.5" r="3.4"/><circle class="il-pink il-ink il-thin" cx="144" cy="15.5" r="3.4"/>
    <circle class="il-teal il-ink il-thin" cx="118" cy="13.2" r="3.4"/>`,

  // The school choir sings at full blast — mouths wide open, eyes squeezed shut, notes everywhere — and the sound
  // waves blow a green monster backwards, hands over its ears and fur streaming.
  'sc.choir-fortissimo': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood il-ink" d="M-2 96h100v26H-2z"/>
    <path class="il-wood-dark il-ink" d="M-2 108h100v14H-2z"/>
    <path class="il-wood" d="M98 104h62v16H98z"/>
    <path class="il-blue il-ink" d="M4 108c0-16 6-24 16-24s16 8 16 24z"/>
    <path class="il-green il-ink" d="M32 108c0-16 6-24 16-24s16 8 16 24z"/>
    <path class="il-red il-ink" d="M60 108c0-16 6-24 16-24s16 8 16 24z"/>
    <rect class="il-dark il-ink il-thin" x="12" y="92" width="16" height="11" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="40" y="92" width="16" height="11" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="68" y="92" width="16" height="11" rx="1"/>
    <circle class="il-skin il-ink" cx="20" cy="70" r="13"/>
    <path class="il-yellow il-ink il-thin" d="M7 70c-2-12 4-18 13-18s16 6 13 18c-2-6-6-9-13-9s-11 3-13 9z"/>
    <path class="il-line" d="M13 67l3 2 3-2M21 67l3 2 3-2"/>
    <ellipse class="il-dark il-ink il-thin" cx="20" cy="77" rx="5" ry="6"/><ellipse class="il-pink" cx="20" cy="80.5" rx="3" ry="1.6"/>
    <circle class="il-wood-dark il-ink" cx="48" cy="64" r="13"/>
    <path class="il-dark il-ink il-thin" d="M34 62c-2-10 6-16 14-16s16 6 14 16c0 6 4 8 2 12-6-12-8-16-16-16s-12 6-16 14c-2-4 2-6 2-10z"/>
    <path class="il-light" d="M41 61l3 2 3-2M49 61l3 2 3-2"/>
    <ellipse class="il-dark il-ink il-thin" cx="48" cy="71" rx="5.4" ry="6.4"/><ellipse class="il-pink" cx="48" cy="74.6" rx="3" ry="1.6"/>
    <circle class="il-orange il-ink" cx="76" cy="70" r="13"/>
    <path class="il-wood-dark il-ink il-thin" d="M63 68c-1-10 6-15 13-15s14 5 13 15l-3-6-4 3-6-4-6 4-4-3z"/>
    <path class="il-line" d="M69 67l3 2 3-2M77 67l3 2 3-2"/>
    <ellipse class="il-dark il-ink il-thin" cx="76" cy="77" rx="5" ry="6"/><ellipse class="il-pink" cx="76" cy="80.5" rx="3" ry="1.6"/>
    <path class="il-line il-thick" d="M94 52q8 18 0 36M102 46q11 24 0 48M110 40q14 30 0 60"/>
    <g class="il-dark il-ink il-thin">
      <ellipse cx="30" cy="34" rx="3.4" ry="2.6" transform="rotate(-20 30 34)"/><ellipse cx="62" cy="28" rx="3.4" ry="2.6" transform="rotate(-20 62 28)"/>
      <ellipse cx="92" cy="22" rx="3.4" ry="2.6" transform="rotate(-20 92 22)"/><ellipse cx="120" cy="16" rx="3.4" ry="2.6" transform="rotate(-20 120 16)"/>
    </g>
    <path class="il-line il-thin" d="M33 33V21q3 2 5 6M65 27V15q3 2 5 6M95 21V9q3 2 5 6M123 15V3q3 2 5 6"/>
    <g transform="rotate(18 136 80)">
      <path class="il-slime il-ink" d="M118 104c-4-24 2-46 18-46s22 22 18 46z"/>
      <path class="il-slime il-ink il-thin" d="M140 60q10-6 18-4-8 2-12 6 8-2 14 2-8 0-14 4z"/>
      <path class="il-line" d="M126 74l5 3-5 3M146 74l-5 3 5 3"/>
      <path class="il-line" d="M128 92q4-4 8 0t8 0"/>
      <ellipse class="il-slime il-ink" cx="120" cy="76" rx="5" ry="7"/><ellipse class="il-slime il-ink" cx="152" cy="76" rx="5" ry="7"/>
    </g>
    <path class="il-line il-thin" d="M118 108h-10M124 112h-12"/>
    <ellipse class="il-water il-ink il-thin" cx="128" cy="50" rx="1.8" ry="2.6"/>`,

  // A pupil stands on tiptoe with legs crossed, one finger stretched sky-high, giving the most pleading puppy-eyed
  // look ever, while the open classroom door glows invitingly.
  'sc.may-i-go-to-the-loo': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="-2" y="6" width="52" height="40" rx="2"/>
    <rect class="il-dark" x="2" y="10" width="44" height="32"/>
    <path class="il-light il-thin" d="M8 30q5-8 10 0t10 0M34 18l6 6M40 18l-6 6" opacity="0.7"/>
    <rect class="il-wood-dark il-ink" x="116" y="18" width="40" height="86"/>
    <rect class="il-paper" x="120" y="22" width="32" height="82"/>
    <path class="il-glow" d="M120 104l-20 16h56l-4-16z" opacity="0.4"/>
    <path class="il-wood il-ink" d="M120 22l-14 8v78l14-4z"/>
    <circle class="il-metal il-ink il-thin" cx="110" cy="68" r="2"/>
    <path class="il-wood" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" d="M0 104h160"/>
    <rect class="il-wood il-ink" x="6" y="72" width="40" height="6" rx="1"/>
    <path class="il-line" d="M10 78v26M42 78v26"/>
    <rect class="il-paper il-ink il-thin" x="14" y="68" width="18" height="5"/>
    <g transform="translate(66 96) rotate(-74)"><rect class="il-blue il-ink" x="0" y="-4" width="20" height="8" rx="4"/></g>
    <g transform="translate(78 96) rotate(-106)"><rect class="il-blue il-ink" x="0" y="-4" width="20" height="8" rx="4"/></g>
    <ellipse class="il-red il-ink" cx="74" cy="100" rx="6" ry="3.4" transform="rotate(-20 74 100)"/>
    <ellipse class="il-red il-ink" cx="68" cy="100" rx="6" ry="3.4" transform="rotate(20 68 100)"/>
    <path class="il-green il-ink" d="M58 82c0-16 4-26 14-26s14 10 14 26z"/>
    <g transform="translate(80 62) rotate(-76)"><rect class="il-green il-ink" x="0" y="-4" width="46" height="8" rx="4"/></g>
    <circle class="il-orange il-ink" cx="91.5" cy="16" r="5"/>
    <rect class="il-orange il-ink il-thin" x="90" y="2" width="3.6" height="10" rx="1.8"/>
    <g transform="translate(62 64) rotate(50)"><rect class="il-green il-ink" x="0" y="-3.5" width="14" height="7" rx="3.5"/></g>
    <circle class="il-orange il-ink" cx="70" cy="74" r="3.6"/>
    <path class="il-line il-thin" d="M98 8q4 4 2 8M100 2q8 6 4 16M84 6q-4 4-2 8"/>
    <circle class="il-orange il-ink" cx="70" cy="42" r="14"/>
    <path class="il-dark il-ink il-thin" d="M56 42c-2-12 6-18 14-18s16 6 14 18c-4-8-8-10-14-10s-10 2-14 10z"/>
    <path class="il-dark il-ink il-thin" d="M56 36q-8 4-6 14 4-6 8-8zM84 36q8 4 6 14-4-6-8-8z"/>
    <circle class="il-white il-ink il-thin" cx="64" cy="44" r="5"/><circle class="il-white il-ink il-thin" cx="76" cy="44" r="5"/>
    <circle class="il-dark" cx="64.6" cy="45" r="3.4"/><circle class="il-dark" cx="76.6" cy="45" r="3.4"/>
    <circle class="il-white" cx="66" cy="43.4" r="1.3"/><circle class="il-white" cx="78" cy="43.4" r="1.3"/><circle class="il-white" cx="63.4" cy="46.6" r="0.6"/><circle class="il-white" cx="75.4" cy="46.6" r="0.6"/>
    <path class="il-line il-thin" d="M59 37l6-2M81 37l-6-2"/>
    <path class="il-line il-thin" d="M66 52q2-2 4 0t4 0"/>
    <ellipse class="il-water il-ink il-thin" cx="86" cy="34" rx="1.8" ry="2.6"/>
    <path class="il-line il-thin" d="M52 92l-4 2 4 2-4 2M90 92l4 2-4 2 4 2"/>`,

  // The big electric school bell rings: a pupil with a satchel dashes out of the open door, while the monster stays
  // stuck in its seat at the desk, open-mouthed, with its exercise book.
  'sc.saved-by-the-bell': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood" d="M0 98h160v22H0z"/>
    <path class="il-line il-thin" d="M0 98h160"/>
    <rect class="il-metal il-ink il-thin" x="68" y="34" width="16" height="6" rx="1"/>
    <circle class="il-red il-ink" cx="76" cy="22" r="14"/>
    <path class="il-white" d="M68 14q4-4 10-4" opacity="0.7"/>
    <circle class="il-metal il-ink il-thin" cx="76" cy="22" r="3"/>
    <circle class="il-metal il-ink il-thin" cx="88" cy="38" r="3"/>
    <path class="il-line il-thin" d="M84 37l4 1"/>
    <path class="il-line il-thin" d="M56 14q-4 8 0 16M50 10q-6 12 0 24M96 14q4 8 0 16M102 10q6 12 0 24M60 6l-4-4M92 6l4-4"/>
    <rect class="il-wood-dark il-ink" x="114" y="22" width="44" height="78"/>
    <rect class="il-paper" x="118" y="26" width="36" height="74"/>
    <path class="il-glow" d="M118 100l-10 20h50v-20z" opacity="0.4"/>
    <path class="il-wood il-ink" d="M118 26l-12 7v74l12-7z"/>
    <path class="il-purple il-ink" d="M12 82c-4-22 4-36 18-36s22 14 18 36z"/>
    <path class="il-purple il-ink il-thin" d="M18 52l-4-10 9 6zM42 52l4-10-9 6z"/>
    <circle class="il-white il-ink il-thin" cx="24" cy="60" r="4.4"/><circle class="il-dark" cx="25" cy="60" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="36" cy="60" r="4.4"/><circle class="il-dark" cx="37" cy="60" r="1.8"/>
    <path class="il-line il-thin" d="M19 53l8 2M33 54l8-1"/>
    <ellipse class="il-dark" cx="30" cy="71" rx="3" ry="3.6"/>
    <rect class="il-wood il-ink" x="2" y="78" width="56" height="7" rx="1"/>
    <path class="il-line" d="M6 85v13M54 85v13"/>
    <rect class="il-wood-dark il-ink" x="16" y="88" width="28" height="4"/>
    <path class="il-line" d="M20 92v6M40 92v6"/>
    <path class="il-paper il-ink il-thin" d="M14 78l10-4 10 4 10-4 6 4z"/>
    <path class="il-line il-thin" d="M18 77l5-2M38 77l5-2"/>
    <circle class="il-purple il-ink il-thin" cx="14" cy="76" r="3.4"/><circle class="il-purple il-ink il-thin" cx="46" cy="76" r="3.4"/>
    <path class="il-line il-thin" d="M84 58h14M80 66h16M86 74h10"/>
    <g transform="translate(124 84) rotate(130)"><rect class="il-blue il-ink" x="0" y="-4" width="18" height="8" rx="4"/></g>
    <g transform="translate(128 84) rotate(30)"><rect class="il-blue il-ink" x="0" y="-4" width="18" height="8" rx="4"/></g>
    <ellipse class="il-dark il-ink il-thin" cx="111" cy="98" rx="6" ry="3.4" transform="rotate(-30 111 98)"/>
    <ellipse class="il-dark il-ink il-thin" cx="146" cy="94" rx="6" ry="3.4"/>
    <rect class="il-red il-ink" x="108" y="56" width="14" height="22" rx="3"/>
    <path class="il-gold il-ink il-thin" d="M108 64h14"/>
    <rect class="il-yellow il-ink" x="116" y="56" width="20" height="30" rx="6"/>
    <g transform="translate(132 62) rotate(-60)"><rect class="il-yellow il-ink" x="0" y="-3.5" width="16" height="7" rx="3.5"/></g>
    <circle class="il-wood il-ink" cx="141" cy="46" r="3.6"/>
    <circle class="il-wood il-ink" cx="128" cy="44" r="11"/>
    <path class="il-dark il-ink il-thin" d="M117 42c-1-8 5-11 11-11s12 3 11 11l-3-4-4 3-4-3-4 3-4-3z"/>
    <path class="il-line" d="M123 44q2-2 4 0M131 44q2-2 4 0"/>
    <path class="il-dark" d="M124 49h10q-5 7-10 0z"/>`,

  // Sack race in the school yard: a pupil leaps sky-high in a burlap sack, another hops behind, and the monster has
  // been well and truly bagged — only its horns and puzzled eyes peep out of a sack of its own.
  'sc.sack-race-stampede': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white il-ink il-thin" d="M110 20q0-8 8-8 2-6 9-5 6-4 11 2 7 0 7 7 0 4-4 4h-27q-4 0-4 0z" opacity="0.9"/>
    <path class="il-grass" d="M0 74h160v46H0z"/>
    <path class="il-light il-dash" d="M0 82h160" opacity="0.6"/>
    <path class="il-line il-thin" d="M10 112l-2-5M12 112v-6M14 112l2-5M96 116l-2-5M98 116v-6M100 116l2-5M150 110l-2-5M152 110v-6M154 110l2-5"/>
    <ellipse class="il-green" cx="54" cy="104" rx="18" ry="4" opacity="0.8"/>
    <path class="il-line il-thin" d="M46 96q8 4 16 0M44 90q10 4 20 0" opacity="0.6"/>
    <path class="il-wood il-ink" d="M10 92q-2-16 4-24h16q6 8 4 24z"/>
    <path class="il-line il-thin" d="M14 74l14 14M14 84l8 6" opacity="0.4"/>
    <path class="il-wood il-ink il-thin" d="M12 68l2-4 4 3 4-3 4 3 4-3 4 4z"/>
    <circle class="il-wood-dark il-ink" cx="22" cy="54" r="8"/>
    <path class="il-dark il-ink il-thin" d="M14 52c0-7 4-9 8-9s8 2 8 9c-2-3-5-4-8-4s-6 1-8 4z"/>
    <circle class="il-white" cx="20" cy="55" r="1.2"/><circle class="il-white" cx="25" cy="55" r="1.2"/><path class="il-light il-thin" d="M20 59q2 2 5 0"/>
    <circle class="il-wood-dark il-ink il-thin" cx="12" cy="66" r="3"/><circle class="il-wood-dark il-ink il-thin" cx="32" cy="66" r="3"/>
    <path class="il-wood il-ink" d="M38 84q-4-24 4-36h26q8 12 4 36q-17 6-34 0z"/>
    <path class="il-line il-thin" d="M44 56l22 22M42 66l14 14M54 52l14 14" opacity="0.35"/>
    <rect class="il-wood-dark il-ink il-thin" x="56" y="66" width="9" height="8" rx="1"/>
    <path class="il-line il-thin il-dash" d="M56 66h9v8h-9z"/>
    <path class="il-wood il-ink il-thin" d="M38 48l3-5 5 4 5-4 5 4 5-4 5 4 5-4 3 5z"/>
    <path class="il-orange il-ink" d="M44 46c0-8 4-14 11-14s11 6 11 14z"/>
    <circle class="il-skin il-ink il-thin" cx="40" cy="44" r="4"/><circle class="il-skin il-ink il-thin" cx="70" cy="44" r="4"/>
    <path class="il-orange il-ink il-thin" d="M44 40l-4 4M66 40l4 4"/>
    <circle class="il-skin il-ink" cx="55" cy="22" r="11"/>
    <path class="il-red il-ink il-thin" d="M44 20c-1-8 5-11 11-11s12 3 11 11c-1 4-2 6-2 10l-2-8q-7-4-14 0l-2 8c0-4-1-6-2-10z"/>
    <path class="il-line" d="M50 23q2-2 4 0M57 23q2-2 4 0"/>
    <path class="il-dark" d="M50 27h10q-5 7-10 0z"/>
    <path class="il-line il-thin" d="M30 30q4 8 2 16M80 30q-4 8-2 16"/>
    <path class="il-wood il-ink" d="M106 112q-6-20 6-32h30q12 12 6 32q-21 6-42 0z"/>
    <path class="il-line il-thin" d="M112 88l26 22M114 100l12 10M128 84l16 14" opacity="0.35"/>
    <path class="il-purple il-ink" d="M114 82q0-12 13-12t13 12z"/>
    <path class="il-purple il-ink il-thin" d="M118 74l-4-10 8 6zM136 74l4-10-8 6z"/>
    <circle class="il-white il-ink il-thin" cx="122" cy="78" r="3.6"/><circle class="il-dark" cx="123" cy="79" r="1.5"/>
    <circle class="il-white il-ink il-thin" cx="132" cy="78" r="3.6"/><circle class="il-dark" cx="131" cy="79" r="1.5"/>
    <path class="il-wood il-ink il-thin" d="M108 82l3-3 5 3 5-3 5 3 5-3 5 3 5-3 5 3 3 2-46 0z"/>
    <path class="il-line" d="M118 84q-4 6-8 4M136 84q4 6 8 4"/>
    <path class="il-line" d="M147 52q0-6 5-6t5 5-5 6v2"/><circle class="il-dark" cx="152" cy="65" r="1.4"/>`,

  // Dodgeball in the sports hall: a pupil leaps across the centre line, mid-catch, with a bib that is half red, half
  // blue, a little pennant fluttering in the wind — swapping sides between the red and the blue team.
  'sc.dodgeball-team-switch': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" d="M0 10h160" opacity="0.3"/>
    <rect class="il-wood il-ink il-thin" x="4" y="14" width="22" height="58"/>
    <path class="il-line il-thin" d="M4 24h22M4 34h22M4 44h22M4 54h22M4 64h22"/>
    <rect class="il-wood il-ink il-thin" x="134" y="14" width="22" height="58"/>
    <path class="il-line il-thin" d="M134 24h22M134 34h22M134 44h22M134 54h22M134 64h22"/>
    <path class="il-wood" d="M0 74h160v46H0z"/>
    <path class="il-line il-thin" d="M0 74h160"/>
    <path class="il-light il-thick" d="M80 74v46"/>
    <path class="il-red il-ink" d="M10 106c0-14 4-20 10-20s10 6 10 20z"/><circle class="il-skin il-ink il-thin" cx="20" cy="80" r="7"/>
    <path class="il-dark il-ink il-thin" d="M13 78q0-6 7-6t7 6q-4-3-7-3t-7 3z"/>
    <path class="il-red il-ink" d="M36 110c0-14 4-20 10-20s10 6 10 20z"/><circle class="il-wood il-ink il-thin" cx="46" cy="84" r="7"/>
    <path class="il-yellow il-ink il-thin" d="M39 82q0-6 7-6t7 6q-4-3-7-3t-7 3z"/>
    <path class="il-blue il-ink" d="M104 110c0-14 4-20 10-20s10 6 10 20z"/><circle class="il-orange il-ink il-thin" cx="114" cy="84" r="7"/>
    <path class="il-wood-dark il-ink il-thin" d="M107 82q0-6 7-6t7 6q-4-3-7-3t-7 3z"/>
    <path class="il-blue il-ink" d="M130 106c0-14 4-20 10-20s10 6 10 20z"/><circle class="il-wood-dark il-ink il-thin" cx="140" cy="80" r="7"/>
    <path class="il-dark il-ink il-thin" d="M133 78q0-6 7-6t7 6q-4-3-7-3t-7 3z"/>
    <path class="il-line il-thin" d="M30 26q10-4 18 0t18 0M26 36q12-4 20 0" opacity="0.7"/>
    <g transform="translate(70 70) rotate(150)"><rect class="il-dark il-ink" x="0" y="-4.5" width="20" height="9" rx="4.5"/></g>
    <g transform="translate(86 72) rotate(40)"><rect class="il-dark il-ink" x="0" y="-4.5" width="20" height="9" rx="4.5"/></g>
    <ellipse class="il-white il-ink il-thin" cx="52" cy="80" rx="6" ry="3.4" transform="rotate(-30 52 80)"/>
    <ellipse class="il-white il-ink il-thin" cx="104" cy="85" rx="6" ry="3.4" transform="rotate(20 104 85)"/>
    <g transform="rotate(-10 80 56)">
      <rect class="il-white il-ink" x="66" y="40" width="28" height="34" rx="7"/>
      <path class="il-red il-ink" d="M68 44h12v28H68z"/>
      <path class="il-blue il-ink" d="M80 44h12v28H80z"/>
    </g>
    <g transform="translate(68 46) rotate(-140)"><rect class="il-white il-ink" x="0" y="-3.5" width="18" height="7" rx="3.5"/></g>
    <circle class="il-skin il-ink il-thin" cx="55" cy="35" r="3.6"/>
    <path class="il-line" d="M55 33 52 14"/>
    <path class="il-yellow il-ink" d="M52 14l-20 2 4 4-4 6 21-3z"/>
    <g transform="translate(92 44) rotate(-40)"><rect class="il-white il-ink" x="0" y="-3.5" width="18" height="7" rx="3.5"/></g>
    <circle class="il-red il-ink" cx="114" cy="26" r="10"/>
    <path class="il-line il-thin" d="M106 20q8 6 16 0M106 32q8-6 16 0"/>
    <circle class="il-skin il-ink" cx="106" cy="32" r="3.6"/>
    <path class="il-line il-thin" d="M130 18l8-2M132 26h8M128 34l8 3"/>
    <circle class="il-skin il-ink" cx="80" cy="28" r="12"/>
    <path class="il-orange il-ink il-thin" d="M68 26c-1-9 6-12 12-12s13 3 12 12l2-2q-1-5-4-8l4 0q-3-3-8-4-4-2-10 0-6 1-9 6z"/>
    <path class="il-orange il-ink il-thin" d="M68 22l-8 2 7 2M70 16l-8-2 6 5"/>
    <path class="il-line" d="M73 28q2-2 4 0M83 27l5 1"/>
    <circle class="il-dark" cx="85.5" cy="30" r="1.5"/>
    <path class="il-dark" d="M76 34h10q-4 6-10 0z"/>`,

  // A proud pupil stands on a chair, chin up, waving, with an enormous rosette badge on the chest; confetti flies
  // and the last voting slips with little ticks drop into the ballot box.
  'sc.class-rep': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="112" y="8" width="44" height="34" rx="2"/>
    <rect class="il-dark" x="116" y="12" width="36" height="26"/>
    <rect class="il-light il-thin" x="120" y="18" width="7" height="7"/><path class="il-light il-thin" d="M121 21l2 2 5-6M132 22h16M120 30h7M132 34h12"/>
    <path class="il-wood" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" d="M0 104h160"/>
    <rect class="il-wood il-ink" x="10" y="76" width="38" height="28" rx="1"/>
    <path class="il-wood-dark il-ink" d="M8 72h42v6H8z"/>
    <rect class="il-dark" x="22" y="73.6" width="14" height="2.6" rx="1"/>
    <path class="il-line il-thin" d="M18 84h22M18 92h22" opacity="0.4"/>
    <g transform="rotate(-12 30 60)"><rect class="il-paper il-ink il-thin" x="22" y="54" width="14" height="10"/><path class="il-line il-thin" d="M25 59l2 2 4-5"/></g>
    <g transform="rotate(16 34 38)"><rect class="il-paper il-ink il-thin" x="27" y="33" width="14" height="10"/><path class="il-line il-thin" d="M30 38l2 2 4-5"/></g>
    <path class="il-line il-thin" d="M30 66v4M26 46v4" opacity="0.6"/>
    <rect class="il-wood-dark il-ink" x="66" y="88" width="44" height="6" rx="1"/>
    <path class="il-line" d="M70 94v10M106 94v10"/>
    <rect class="il-wood-dark il-ink" x="104" y="60" width="5" height="28" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="78" y="68" width="8" height="20" rx="3"/><rect class="il-dark il-ink il-thin" x="90" y="68" width="8" height="20" rx="3"/>
    <ellipse class="il-red il-ink il-thin" cx="81" cy="88" rx="6" ry="3"/><ellipse class="il-red il-ink il-thin" cx="95" cy="88" rx="6" ry="3"/>
    <rect class="il-blue il-ink" x="74" y="40" width="28" height="32" rx="7"/>
    <g transform="translate(100 46) rotate(60)"><rect class="il-blue il-ink" x="0" y="-3.5" width="18" height="7" rx="3.5"/></g>
    <circle class="il-wood il-ink" cx="108" cy="62" r="3.6"/>
    <g transform="translate(76 46) rotate(-130)"><rect class="il-blue il-ink" x="0" y="-3.5" width="22" height="7" rx="3.5"/></g>
    <path class="il-wood il-ink" d="M58 22l1-7 2 6 1-7 2 7 1-5 1 7 2 4-4 4h-6z"/>
    <path class="il-line il-thin" d="M52 14q-2 4 0 8M50 8q-4 8 0 16"/>
    <path class="il-red il-ink il-thin" d="M80 56l-4 16 5-3 3 4 2-16zM92 56l4 16-5-3-3 4-2-16z"/>
    <path class="il-gold il-ink" d="M86 44l3 3 4-1 1 4 4 1-1 4 3 3-3 3 1 4-4 1-1 4-4-1-3 3-3-3-4 1-1-4-4-1 1-4-3-3 3-3-1-4 4-1 1-4 4 1z"/>
    <circle class="il-yellow il-ink il-thin" cx="86" cy="58" r="6"/>
    <path class="il-white" d="M86 54l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"/>
    <circle class="il-wood il-ink" cx="88" cy="26" r="13"/>
    <path class="il-dark il-ink il-thin" d="M75 24c-2-10 5-14 13-14s15 4 13 14c-2-2-3-6-5-6-2 2-4 2-6 0-2 2-4 2-6 0-2 0-4 2-5 6z"/>
    <path class="il-line" d="M80 25q3-3 6 0M90 25q3-3 6 0"/>
    <path class="il-dark" d="M82 31h12q-6 8-12 0z"/>
    <circle class="il-pink" cx="79" cy="31" r="2.4" opacity="0.7"/><circle class="il-pink" cx="97" cy="31" r="2.4" opacity="0.7"/>
    <g class="il-ink il-thin">
      <rect class="il-red" x="60" y="40" width="5" height="3" transform="rotate(30 62 41)"/><rect class="il-yellow" x="104" y="20" width="5" height="3" transform="rotate(-20 106 21)"/>
      <rect class="il-teal" x="122" y="54" width="5" height="3" transform="rotate(40 124 55)"/><rect class="il-pink" x="56" y="66" width="5" height="3" transform="rotate(-30 58 67)"/>
      <rect class="il-green" x="132" y="72" width="5" height="3" transform="rotate(10 134 73)"/><rect class="il-yellow" x="70" y="6" width="5" height="3" transform="rotate(50 72 7)"/>
      <rect class="il-blue" x="146" y="88" width="5" height="3" transform="rotate(-40 148 89)"/><rect class="il-orange" x="118" y="92" width="5" height="3" transform="rotate(20 120 93)"/>
    </g>`,

  // A beaming pupil holds an exercise book high overhead: lines, ticks and one big smiling gold star sticker. The
  // pupil shines like a star too, with glowing rays and starry eyes.
  'sc.gold-star': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g class="il-glow" opacity="0.35">
      <path d="M80 84 20 0h24z"/><path d="M80 84 66 0h28z"/><path d="M80 84 116 0h24z"/><path d="M80 84 160 20v24z"/>
      <path d="M80 84 0 20v24z"/><path d="M80 84 0 70v24z"/><path d="M80 84 160 70v24z"/>
    </g>
    <path class="il-red il-ink" d="M50 120c0-18 12-28 30-28s30 10 30 28z"/>
    <g transform="translate(64 100) rotate(-118)"><rect class="il-red il-ink" x="0" y="-4.5" width="54" height="9" rx="4.5"/></g>
    <g transform="translate(96 100) rotate(-62)"><rect class="il-red il-ink" x="0" y="-4.5" width="54" height="9" rx="4.5"/></g>
    <path class="il-orange il-ink" d="M92 70q16-2 16 14-6-6-14-6z"/>
    <circle class="il-skin il-ink" cx="80" cy="80" r="15"/>
    <path class="il-orange il-ink" d="M65 78c-2-12 6-18 15-18s17 6 15 18c-3-6-8-9-15-9s-12 3-15 9z"/>
    <path class="il-gold il-ink il-thin" d="M73 76l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z"/>
    <path class="il-gold il-ink il-thin" d="M87 76l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z"/>
    <path class="il-dark" d="M73 88h14q-7 9-14 0z"/>
    <circle class="il-pink" cx="69" cy="88" r="2.4" opacity="0.7"/><circle class="il-pink" cx="91" cy="88" r="2.4" opacity="0.7"/>
    <path class="il-paper il-ink" d="M80 20q-16-6-34-2v32q18-4 34 2z"/>
    <path class="il-paper il-ink" d="M80 20q16-6 34-2v32q-18-4-34 2z"/>
    <path class="il-line il-thin" d="M80 20v32"/>
    <path class="il-line il-thin" d="M50 26q14-3 26 1M50 32q14-3 26 1M50 38q14-3 26 1M50 44q14-3 26 1" opacity="0.4"/>
    <path class="il-line il-thin" d="M66 24l2 2 4-4M66 36l2 2 4-4"/>
    <path class="il-line il-thin" d="M84 26q14-3 26-1M84 32q8-2 14-1M84 44q14-3 26-1" opacity="0.4"/>
    <path class="il-gold il-ink" d="M104 22l3 7 7.6.6-5.8 5 1.8 7.4-6.6-4-6.6 4 1.8-7.4-5.8-5 7.6-.6z"/>
    <circle class="il-dark" cx="101.8" cy="31.6" r="0.9"/><circle class="il-dark" cx="106.2" cy="31.6" r="0.9"/>
    <path class="il-line il-thin" d="M102 34.6q2 1.6 4 0"/>
    <circle class="il-skin il-ink" cx="46" cy="50" r="5"/><circle class="il-skin il-ink" cx="114" cy="50" r="5"/>
    <path class="il-white" d="M124 14l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z"/>
    <path class="il-white" d="M30 30l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>
    <path class="il-yellow" d="M134 54l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>
    <path class="il-yellow" d="M24 62l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>`,

  // Last day of school: under bunting and a big sun, a pupil jumps for joy and flings the satchel into the air,
  // papers fluttering out, while a water balloon bursts in a big splash from a classmate's water fight.
  'sc.last-day-of-school': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow il-ink" cx="140" cy="22" r="11"/>
    <path class="il-line il-thin" d="M140 6v-4M154 12l4-3M156 26h4M126 12l-4-3"/>
    <path class="il-line il-thin" d="M0 8q40 14 80 4t80 6"/>
    <path class="il-red il-ink il-thin" d="M8 10l6 0-2 8z"/><path class="il-yellow il-ink il-thin" d="M24 14h7l-3 8z"/>
    <path class="il-blue il-ink il-thin" d="M42 16h7l-4 8z"/><path class="il-green il-ink il-thin" d="M60 16h7l-4 8z"/>
    <path class="il-red il-ink il-thin" d="M78 13h7l-4 8z"/><path class="il-yellow il-ink il-thin" d="M96 10h7l-4 8z"/>
    <path class="il-blue il-ink il-thin" d="M114 9h7l-4 8z"/>
    <rect class="il-earth il-ink" x="-2" y="40" width="54" height="50"/>
    <path class="il-earth-dark il-ink" d="M-2 40l28-14 28 14z"/>
    <rect class="il-sky il-ink il-thin" x="6" y="50" width="12" height="12"/><rect class="il-sky il-ink il-thin" x="30" y="50" width="12" height="12"/>
    <rect class="il-wood-dark il-ink il-thin" x="18" y="70" width="14" height="20"/>
    <path class="il-grass" d="M0 88h160v32H0z"/>
    <path class="il-line il-thin" d="M0 88h160" opacity="0.4"/>
    <ellipse class="il-green" cx="72" cy="110" rx="18" ry="3.4" opacity="0.8"/>
    <g transform="rotate(-20 40 30)">
      <rect class="il-red il-ink" x="28" y="24" width="26" height="20" rx="4"/>
      <path class="il-red il-ink il-thin" d="M28 26l-6-10 26 0 6 8z"/>
      <rect class="il-gold il-ink il-thin" x="38" y="30" width="6" height="5" rx="1"/>
    </g>
    <g transform="rotate(-24 14 22)"><rect class="il-paper il-ink il-thin" x="8" y="16" width="12" height="15"/><path class="il-line il-thin" d="M10 20h8M10 24h8M10 28h6"/></g>
    <g transform="rotate(18 30 6)"><rect class="il-paper il-ink il-thin" x="56" y="22" width="11" height="14"/><path class="il-line il-thin" d="M58 26h7M58 30h7"/></g>
    <g transform="translate(64 66) rotate(150)"><rect class="il-blue il-ink" x="0" y="-4.5" width="18" height="9" rx="4.5"/></g>
    <g transform="translate(80 66) rotate(60)"><rect class="il-blue il-ink" x="0" y="-4.5" width="18" height="9" rx="4.5"/></g>
    <ellipse class="il-white il-ink il-thin" cx="48" cy="74" rx="6" ry="3.4" transform="rotate(-20 48 74)"/>
    <ellipse class="il-white il-ink il-thin" cx="86" cy="84" rx="6" ry="3.4" transform="rotate(60 86 84)"/>
    <rect class="il-yellow il-ink" x="60" y="42" width="24" height="28" rx="7"/>
    <path class="il-white il-thin" d="M66 52l4 4 8-8" opacity="0.8"/>
    <g transform="translate(62 46) rotate(-130)"><rect class="il-yellow il-ink" x="0" y="-3.5" width="20" height="7" rx="3.5"/></g>
    <g transform="translate(82 46) rotate(-50)"><rect class="il-yellow il-ink" x="0" y="-3.5" width="20" height="7" rx="3.5"/></g>
    <circle class="il-wood-dark il-ink" cx="49" cy="30" r="4"/><circle class="il-wood-dark il-ink" cx="95" cy="30" r="4"/>
    <circle class="il-wood-dark il-ink" cx="72" cy="30" r="12"/>
    <circle class="il-dark il-ink il-thin" cx="62" cy="20" r="5"/><circle class="il-dark il-ink il-thin" cx="72" cy="17" r="5"/><circle class="il-dark il-ink il-thin" cx="82" cy="20" r="5"/>
    <path class="il-light" d="M65 29q2.5-3 5 0M74 29q2.5-3 5 0"/>
    <path class="il-dark il-ink il-thin" d="M65 34h14q-7 10-14 0z"/>
    <path class="il-pink" d="M69 38q3 2 6 0q-3 3-6 0z"/>
    <g class="il-water il-ink il-thin">
      <path d="M104 64q8-12 16-4 8-8 14 4 8 2 4 10-10 4-18 0-10 2-16-10z"/>
      <ellipse cx="102" cy="52" rx="2" ry="3"/><ellipse cx="114" cy="48" rx="2" ry="3.4"/><ellipse cx="128" cy="50" rx="2" ry="3"/>
      <ellipse cx="96" cy="66" rx="2" ry="3"/><ellipse cx="140" cy="64" rx="2" ry="3"/>
    </g>
    <path class="il-red il-ink il-thin" d="M118 68l4-6 4 6-4 2z"/>
    <path class="il-green il-ink" d="M136 112c0-14 4-22 12-22s12 8 12 22z"/>
    <circle class="il-orange il-ink" cx="148" cy="82" r="9"/>
    <path class="il-wood-dark il-ink il-thin" d="M139 80c0-7 4-10 9-10s9 3 9 10c-3-3-6-4-9-4s-6 1-9 4z"/>
    <circle class="il-dark" cx="145" cy="84" r="1.4"/><circle class="il-dark" cx="151" cy="84" r="1.4"/><path class="il-line il-thin" d="M145 88q3 2 6 0"/>
    <circle class="il-orange il-ink il-thin" cx="137" cy="96" r="3.4"/>
    <circle class="il-blue il-ink il-thin" cx="132" cy="92" r="5"/><path class="il-white" d="M130 90h2" />`,

  // One pupil, two origins: the left half is sporty (spiky hair, sweatband, red jersey, ball), the right half bookish
  // (neat parting, round glasses, cardigan, book) — under a timetable on the board with one doubled lesson block.
  'sc.double-period': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="4" y="6" width="78" height="62" rx="2"/>
    <rect class="il-dark" x="8" y="10" width="70" height="54"/>
    <path class="il-light il-thin" d="M12 16h62M12 26h62M12 36h62M12 46h62M12 56h62M27 16v40M43 16v40M59 16v40" opacity="0.6"/>
    <rect class="il-yellow il-ink il-thin" x="44" y="27" width="14" height="18" rx="1"/>
    <path class="il-dark" d="M47 36h8" opacity="0.6"/>
    <rect class="il-blue" x="13" y="17" width="13" height="8" opacity="0.7"/><rect class="il-red" x="28" y="37" width="14" height="8" opacity="0.7"/>
    <rect class="il-green" x="60" y="17" width="13" height="8" opacity="0.7"/><rect class="il-teal" x="13" y="47" width="13" height="8" opacity="0.7"/>
    <circle class="il-white il-ink" cx="140" cy="20" r="11"/>
    <path class="il-line" d="M140 20v-7M140 20l5 3"/>
    <path class="il-line il-thin" d="M140 10v1M150 20h-1M130 20h1M140 30v-1"/>
    <path class="il-red il-ink" d="M86 120v-22q0-14 34-16v38z"/>
    <path class="il-white il-ink il-thin" d="M104 96v10M110 100h-12"/>
    <path class="il-green il-ink" d="M120 82q34 2 34 16v22h-34z"/>
    <path class="il-white il-ink il-thin" d="M120 82l-6 6 6 4zM120 82l6 6-6 4z"/>
    <path class="il-line il-thin" d="M120 92v28"/>
    <g class="il-gold il-ink il-thin"><circle cx="124" cy="98" r="1.4"/><circle cx="124" cy="106" r="1.4"/><circle cx="124" cy="114" r="1.4"/></g>
    <path class="il-line il-thin" d="M134 96v4M140 96v4M146 96v4M134 108v4M140 108v4M146 108v4" opacity="0.5"/>
    <path class="il-skin il-ink" d="M120 30a20 22 0 0 0 0 44z"/>
    <path class="il-skin il-ink" d="M120 30a20 22 0 0 1 0 44z"/>
    <path class="il-skin" d="M118 32h4v40h-4z"/>
    <path class="il-orange il-ink" d="M120 34l-6-10-2 8-6-8 0 9-7-5 3 10q2 6 4 4 8-6 14-6z"/>
    <path class="il-wood-dark il-ink" d="M120 34q10-6 18 0t3 12q-6-8-20-8z"/>
    <path class="il-line il-thin" d="M122 30q4 4 8 6"/>
    <path class="il-red il-ink il-thin" d="M100 44q10-4 20-4v5q-10 0-20 4z"/>
    <circle class="il-white il-ink il-thin" cx="111" cy="54" r="4.6"/><circle class="il-dark" cx="111.6" cy="54" r="2.2"/>
    <path class="il-line il-thin" d="M105 47l8 1"/>
    <circle class="il-white il-ink il-thin" cx="129" cy="54" r="5.6" opacity="0.6"/><circle class="il-line il-thin" cx="129" cy="54" r="5.6"/>
    <path class="il-dark" d="M125.6 54.6q3.4 2 6.8 0z"/><path class="il-line il-thin" d="M125.6 54.4h6.8"/>
    <path class="il-line il-thin" d="M123.4 54h-3M134.6 54l5-1M125 46.6h8"/>
    <path class="il-line" d="M110 62q5 5 10 2q4-1 7-1"/>
    <circle class="il-skin il-ink" cx="97" cy="58" r="4"/><circle class="il-skin il-ink" cx="143" cy="58" r="4"/>
    <circle class="il-white il-ink" cx="94" cy="96" r="9"/>
    <path class="il-dark" d="M94 91l3 2-1 3h-4l-1-3z"/>
    <path class="il-line il-thin" d="M94 87v4M86 94l5 0M102 94l-5 0M90 103l2-3M98 103l-2-3"/>
    <circle class="il-skin il-ink il-thin" cx="98" cy="88" r="3.4"/>
    <rect class="il-blue il-ink" x="132" y="86" width="20" height="24" rx="1.5"/>
    <path class="il-line il-thin" d="M136 86v24M140 94h8M140 100h8"/>
    <circle class="il-skin il-ink il-thin" cx="134" cy="98" r="3.4"/>`,

  // Two clubs, two hats: a pupil wears a gardening straw hat with a golden drama crown stacked on top, holding a
  // theatre mask in one hand and a seedling pot in the other — stage curtain on one side, garden bed on the other.
  'sc.two-clubs-at-once': `
    <rect class="il-purple-dark" x="0" y="0" width="80" height="120"/>
    <rect class="il-sky" x="80" y="0" width="80" height="120"/>
    <path class="il-glow" d="M40 0h16l18 120H4z" opacity="0.18"/>
    <path class="il-red il-ink" d="M-2 -2h26q-6 30 0 60t-6 64H-2z"/>
    <path class="il-line il-thin" d="M6 0q-4 40 2 60t-2 60M14 0q-4 40 2 60t-2 60" opacity="0.5"/>
    <path class="il-red il-ink" d="M-2 -2h82v10q-10 6-20 0-10 6-20 0-10 6-20 0-10 6-22 0z"/>
    <path class="il-wood-dark" d="M0 104h80v16H0z"/>
    <path class="il-white" d="M34 16l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z"/>
    <path class="il-grass" d="M80 96h80v24H80z"/>
    <rect class="il-earth il-ink" x="118" y="92" width="44" height="14"/>
    <path class="il-green il-ink il-thin" d="M126 92v-8M126 86q-5-3-6-8 5 1 6 6M140 92v-10M140 84q5-3 6-8-5 1-6 6M152 92v-6"/>
    <circle class="il-red il-ink il-thin" cx="152" cy="84" r="3"/><circle class="il-yellow" cx="152" cy="84" r="1.2"/>
    <circle class="il-yellow il-ink il-thin" cx="146" cy="16" r="7"/>
    <path class="il-blue il-ink" d="M52 120c0-18 10-28 28-28s28 10 28 28z"/>
    <path class="il-red il-ink" d="M56 96q8 4 14-2l-4 26H52z"/>
    <path class="il-green il-ink il-thin" d="M92 96h10v24H92z"/>
    <g transform="translate(60 102) rotate(-150)"><rect class="il-blue il-ink" x="0" y="-4" width="20" height="8" rx="4"/></g>
    <g transform="translate(100 102) rotate(-30)"><rect class="il-blue il-ink" x="0" y="-4" width="20" height="8" rx="4"/></g>
    <circle class="il-orange il-ink" cx="80" cy="70" r="15"/>
    <path class="il-dark il-ink il-thin" d="M65 58q-2 10 3 14 0-6 3-10zM95 58q2 10-3 14 0-6-3-10z"/>
    <path class="il-line" d="M72 66q2.5-2.5 5 0M83 66q2.5-2.5 5 0"/>
    <path class="il-dark" d="M73 76h14q-7 9-14 0z"/>
    <circle class="il-pink" cx="69" cy="75" r="2.4" opacity="0.7"/><circle class="il-pink" cx="91" cy="75" r="2.4" opacity="0.7"/>
    <ellipse class="il-yellow il-ink" cx="80" cy="56" rx="30" ry="6"/>
    <path class="il-yellow il-ink" d="M66 56q0-16 14-16t14 16z"/>
    <path class="il-red il-ink il-thin" d="M66 52q14 4 28 0v4q-14 4-28 0z"/>
    <path class="il-line il-thin" d="M58 56q4 2 8 2M94 58q4 0 8-2M74 44l2 6M86 44l-2 6" opacity="0.5"/>
    <path class="il-gold il-ink" d="M68 40l-2-14 7 7 7-11 7 11 7-7-2 14z"/>
    <circle class="il-red il-ink il-thin" cx="80" cy="34" r="2"/><circle class="il-blue il-ink il-thin" cx="72" cy="36" r="1.5"/><circle class="il-green il-ink il-thin" cx="88" cy="36" r="1.5"/>
    <circle class="il-orange il-ink" cx="42" cy="84" r="4"/>
    <path class="il-white il-ink" d="M28 70q14-4 22 2 2 14-10 20-12-4-12-22z"/>
    <path class="il-dark" d="M32 76q3-3 6 0q-3 1-6 0zM42 78q3-2 6 1q-3 1-6-1z"/>
    <path class="il-dark" d="M34 84q6 5 12 2q-4 5-12-2z"/>
    <path class="il-line il-thin" d="M28 72l-4-4M50 72l4-6"/>
    <circle class="il-orange il-ink" cx="118" cy="84" r="4"/>
    <path class="il-earth il-ink" d="M110 74h22l-3 16h-16z"/>
    <path class="il-earth-dark il-ink il-thin" d="M108 72h26v4h-26z"/>
    <path class="il-green il-ink il-thin" d="M121 72v-10M121 66q-6-2-8-8 6 0 8 6M121 64q6-4 9-10-6 1-9 8"/>`,
};
