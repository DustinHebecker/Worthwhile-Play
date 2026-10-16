/* Kampfzwerge illustrations: monsters2. */
export const MONSTERS2: Readonly<Record<string, string>> = {
  // A blissful compost heap with a lettuce-leaf hairdo, apple core and banana peel; a T-shirt runs away from the stink.
  'kz.compost-blob': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <ellipse class="il-earth-dark" cx="76" cy="104" rx="56" ry="5"/>
    <path class="il-earth-dark il-ink" d="M24 104C18 86 28 70 42 68C42 50 58 38 76 40C94 34 110 46 112 62C128 66 136 86 130 104Z"/>
    <g class="il-earth">
      <circle cx="40" cy="88" r="2.4"/><circle cx="56" cy="96" r="2"/><circle cx="104" cy="92" r="2.6"/>
      <circle cx="118" cy="82" r="2"/><circle cx="92" cy="98" r="1.8"/><circle cx="48" cy="76" r="1.6"/>
    </g>
    <path class="il-green il-ink" d="M60 46C52 32 66 24 74 34C78 20 96 22 94 36C102 30 110 40 102 48C90 54 70 54 60 46Z"/>
    <path class="il-line il-thin" d="M66 44l10-6M84 44l2-10M94 46l4-6"/>
    <path class="il-yellow il-ink" d="M26 78c-2-10 4-16 10-14 2 6-2 8-4 10l-2 10c-2 2-4-2-4-6z"/>
    <path class="il-yellow il-ink" d="M36 66c6 0 12 4 12 10-4 0-8-4-10-6z"/>
    <path class="il-paper il-ink" d="M112 68h12c-4 4-4 10 0 14h-12c4-4 4-10 0-14z"/>
    <path class="il-red il-ink il-thin" d="M111 66h14v4h-14zM111 80h14v4h-14z"/>
    <path class="il-wood-dark il-ink il-thin" d="M118 66l1-5"/>
    <path class="il-white il-ink il-thin" d="M92 94l6-6 6 4-4 6z"/>
    <path class="il-line" d="M58 66q5-4 10 0M84 66q5-4 10 0"/>
    <path class="il-line" d="M64 80q12 10 24 0"/>
    <ellipse class="il-pink" cx="56" cy="74" rx="4" ry="2" opacity="0.8"/><ellipse class="il-pink" cx="96" cy="74" rx="4" ry="2" opacity="0.8"/>
    <path class="il-line il-thin" d="M22 50c-4-4 4-8 0-12s4-8 0-12M132 50c-4-4 4-8 0-12s4-8 0-12M48 30c-3-3 3-6 0-9"/>
    <circle class="il-dark" cx="118" cy="30" r="2.4"/>
    <ellipse class="il-white il-ink il-thin" cx="115" cy="26" rx="3" ry="2"/><ellipse class="il-white il-ink il-thin" cx="121" cy="26" rx="3" ry="2"/>
    <path class="il-line il-thin il-dash" d="M104 36c4-6 8 4 12-4"/>
    <path class="il-blue il-ink" d="M141 80h10l5 4-3 4-3-2v10h-10v-10l-3 2-3-4z"/>
    <path class="il-line il-thin" d="M143 96l-3 7M148 96l4 7M138 104h4M150 104h5"/>
    <path class="il-line il-thin" d="M130 84h-4M131 90h-6"/>`,

  // A grinning big-mouthed treasure hunter in headphones points his detector at a dwarf's belt buckle; the dwarf clutches his trousers.
  'kz.metal-detectorist': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <ellipse class="il-earth-dark il-ink il-thin" cx="20" cy="108" rx="10" ry="3"/>
    <path class="il-earth il-ink il-thin" d="M30 108c2-6 10-6 12 0z"/>
    <ellipse class="il-earth-dark il-ink il-thin" cx="86" cy="112" rx="9" ry="3"/>
    <path class="il-earth il-ink il-thin" d="M94 112c2-5 8-5 10 0z"/>
    <path class="il-metal il-ink il-thin" d="M76 114l8-3 1 2-8 3z"/>
    <path class="il-teal il-ink" d="M14 76c0-22 14-36 32-36s32 14 32 36-14 26-32 26-32-4-32-26z"/>
    <path class="il-dark il-ink" d="M24 70c8 4 36 4 44 0-2 18-10 24-22 24s-20-6-22-24z"/>
    <path class="il-white il-ink il-thin" d="M26 71l4 6 4-5 4 6 4-6 4 6 4-6 4 6 4-6 4 5 4-6z"/>
    <path class="il-pink" d="M36 88c4-4 16-4 20 0-4 3-16 3-20 0z"/>
    <circle class="il-white il-ink" cx="36" cy="54" r="6"/><circle class="il-dark" cx="38" cy="55" r="2.6"/>
    <circle class="il-white il-ink" cx="56" cy="54" r="6"/><circle class="il-dark" cx="58" cy="55" r="2.6"/>
    <path class="il-line" d="M28 44l8 3M64 44l-8 3"/>
    <path class="il-line il-thick" d="M16 56c0-26 60-26 60 0"/>
    <rect class="il-dark il-ink" x="9" y="50" width="10" height="16" rx="4"/>
    <rect class="il-dark il-ink" x="73" y="50" width="10" height="16" rx="4"/>
    <path class="il-dark il-ink" d="M30 100h8v6h-10zM54 100h8v6h-10z"/>
    <path class="il-line il-thick" d="M74 80 110 102"/>
    <path class="il-teal il-ink" d="M66 82c4-6 10-6 12-2-2 4-8 6-12 2z"/>
    <rect class="il-dark il-ink il-thin" x="84" y="83" width="10" height="6" rx="1" transform="rotate(31 89 86)"/>
    <ellipse class="il-metal il-ink" cx="112" cy="104" rx="11" ry="3.4"/>
    <path class="il-line il-thin" d="M146 70l4-3 1 4 4-3M146 82l4 2-1 3 4 2M118 66l-4-3-1 4-4-3"/>
    <path class="il-white il-ink il-thin" d="M142 66l1.5-4 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5z"/>
    <path class="il-wood-dark il-ink" d="M124 66h24v34h-24z"/>
    <path class="il-dark il-ink" d="M124 73h24v6h-24z"/>
    <rect class="il-gold il-ink" x="131" y="71" width="10" height="10" rx="1"/>
    <rect class="il-dark" x="134" y="74" width="4" height="4"/>
    <path class="il-dark il-ink" d="M126 100h8v6h-10zM140 100h8v6h-10z"/>
    <circle class="il-skin il-ink" cx="136" cy="52" r="11"/>
    <path class="il-beard il-ink" d="M126 54c2 14 18 14 20 0-4 4-16 4-20 0z"/>
    <path class="il-yellow il-ink" d="M124 50a12 12 0 0 1 24 0z"/>
    <circle class="il-white il-ink il-thin" cx="132" cy="52" r="2.6"/><circle class="il-white il-ink il-thin" cx="140" cy="52" r="2.6"/>
    <circle class="il-dark" cx="132" cy="52" r="1"/><circle class="il-dark" cx="140" cy="52" r="1"/>
    <ellipse class="il-dark" cx="136" cy="61" rx="2" ry="2.6"/>
    <path class="il-skin il-ink" d="M124 74c-4-2-4 6 0 6zM148 74c4-2 4 6 0 6z"/>
    <path class="il-dark" d="M134 20h4l-1 14h-2zM134 37h4v4h-4z"/>`,

  // A runaway mine cart with a manic grin leaps off the rails, nuggets flying; a pair of boots is left standing on the track.
  'kz.runaway-cart': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" d="M0 0h160v10c-10 6-20-2-30 4s-20 0-30 4-24-4-34 2-22-2-30 2-16-2-36 0z" opacity="0.5"/>
    <path class="il-wood-dark il-ink il-thin" d="M6 104h14v6H6zM34 104h14v6H34zM62 104h14v6H62zM90 104h14v6H90zM118 104h14v6h-14zM146 104h14v6h-14z"/>
    <path class="il-line il-thick" d="M0 104h160"/>
    <path class="il-wood-dark il-ink" d="M12 100c0-6 2-10 6-10s4 4 4 10z"/>
    <path class="il-wood-dark il-ink" d="M24 100c0-6 2-10 6-10s4 4 4 10z"/>
    <path class="il-dark il-ink il-thin" d="M10 98h14v4H10zM22 98h14v4H22z"/>
    <path class="il-line il-thin" d="M14 86q4-4 8 0M26 86q4-4 8 0"/>
    <g transform="rotate(-14 96 70)">
      <path class="il-grey il-ink" d="M56 50h80l-8 40H64z"/>
      <path class="il-metal il-ink" d="M52 46h88v8H52z"/>
      <g class="il-dark"><circle cx="62" cy="62" r="1.5"/><circle cx="130" cy="62" r="1.5"/><circle cx="66" cy="84" r="1.5"/><circle cx="126" cy="84" r="1.5"/></g>
      <circle class="il-white il-ink" cx="84" cy="64" r="7"/><circle class="il-dark" cx="86" cy="64" r="3"/>
      <circle class="il-white il-ink" cx="106" cy="64" r="7"/><circle class="il-dark" cx="108" cy="64" r="3"/>
      <path class="il-line" d="M76 54l10 4M114 54l-10 4"/>
      <path class="il-dark il-ink" d="M78 76h32c-2 8-8 10-16 10s-14-2-16-10z"/>
      <path class="il-white" d="M80 77h28v3H80z"/>
      <circle class="il-dark il-ink" cx="74" cy="92" r="8"/><circle class="il-metal" cx="74" cy="92" r="3"/>
      <circle class="il-dark il-ink" cx="118" cy="92" r="8"/><circle class="il-metal" cx="118" cy="92" r="3"/>
      <path class="il-gold il-ink" d="M62 46l6-8 8 4 6-8 8 6 10-6 6 8 8-4 6 8z"/>
    </g>
    <path class="il-gold il-ink il-thin" d="M100 18l5-4 5 3-2 5h-6z"/>
    <path class="il-gold il-ink il-thin" d="M126 10l4-2 4 3-3 4-4-1z"/>
    <path class="il-gold il-ink il-thin" d="M74 22l4-3 3 3-3 4z"/>
    <path class="il-light" d="M8 56h22M4 66h28M12 76h18"/>
    <path class="il-yellow il-ink il-thin" d="M140 104l3-6 2 5 5-3-3 6 6 1-6 2z"/>`,

  // A grumpy mole foreman in a hard hat and safety vest shouts and points, clipboard in claw, by a warning sign.
  'kz.mole-foreman': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-earth il-ink" d="M10 120c4-22 16-30 30-30 14 0 26 8 30 30z" transform="translate(70 0)"/>
    <path class="il-earth il-ink" d="M14 120c0-10 10-18 26-18s26 8 26 18z"/>
    <path class="il-wood il-ink" d="M138 100V60h4v40z"/>
    <path class="il-yellow il-ink" d="M140 38l16 26h-32z"/>
    <path class="il-dark" d="M138.5 46h3l-.6 10h-1.8zM138.5 58h3v3h-3z"/>
    <path class="il-grey il-ink" d="M34 112c-6-34 10-62 40-62s46 28 40 62z"/>
    <path class="il-orange il-ink" d="M44 82c10 6 50 6 60 0l6 30H38z"/>
    <path class="il-white" d="M56 85v27h6V86zM86 86v26h6V85z"/>
    <path class="il-line il-thin" d="M50 70l4 4M96 70l-4 4M70 62l2 4"/>
    <circle class="il-dark" cx="62" cy="62" r="2.4"/><circle class="il-dark" cx="86" cy="62" r="2.4"/>
    <path class="il-line" d="M54 54l11 5M94 54l-11 5"/>
    <ellipse class="il-pink il-ink" cx="74" cy="70" rx="7" ry="5"/>
    <path class="il-dark il-ink" d="M64 76c4 10 16 10 20 0z"/>
    <path class="il-white" d="M66 77h16v2H66z"/>
    <path class="il-yellow il-ink" d="M44 52c0-22 60-22 60 0z"/>
    <path class="il-yellow il-ink" d="M38 50h72v6H38z"/>
    <path class="il-line il-thin" d="M74 30v20"/>
    <rect class="il-paper il-ink" x="16" y="72" width="22" height="28" rx="2" transform="rotate(-10 27 86)"/>
    <path class="il-metal il-ink il-thin" d="M22 70h10v4H22z" transform="rotate(-10 27 86)"/>
    <path class="il-line il-thin" d="M22 80l12-2M22 86l12-2M23 92l8-1" transform="rotate(-6 27 86)"/>
    <path class="il-pink il-ink" d="M36 88c-6-2-8 4-4 6 4 2 6 0 6-2z"/>
    <path class="il-grey il-ink" d="M110 80c8-6 12-14 14-22l6 2c-2 10-6 18-14 26z"/>
    <path class="il-pink il-ink" d="M124 56l2-8 2 8 3-6 0 9-6 3z"/>
    <path class="il-line il-thin" d="M118 40l4-6M126 42l6-4M112 36l0-6"/>`,

  // A ceramic garden gnome stands right at your lit window at night, glowing eyes, creepy grin; footprints lead from its empty base.
  'kz.haunted-gnome': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-white" cx="22" cy="18" r="8"/><circle class="il-night" cx="26" cy="15" r="7"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-stone il-ink" d="M96 0h64v100H96z"/>
    <path class="il-line il-thin" d="M96 20h64M96 40h64M96 60h64M96 80h64M120 0v20M140 20v20M112 40v20M150 60v20M128 80v20"/>
    <rect class="il-wood-dark il-ink" x="104" y="28" width="44" height="40"/>
    <rect class="il-yellow" x="108" y="32" width="36" height="32"/>
    <path class="il-red il-ink il-thin" d="M108 32h10c-2 10-2 22 0 32h-10zM144 32h-10c2 10 2 22 0 32h10z"/>
    <path class="il-line" d="M126 32v32M108 48h36"/>
    <rect class="il-wood il-ink" x="100" y="66" width="52" height="5"/>
    <g transform="translate(-2 0)">
      <path class="il-red il-ink" d="M72 52 88 14l16 38z"/>
      <path class="il-skin il-ink" d="M74 52h28v14H74z"/>
      <path class="il-beard il-ink" d="M74 62c2 20 26 20 28 0z"/>
      <path class="il-blue il-ink" d="M72 72h32v28H72z"/>
      <path class="il-dark il-ink il-thin" d="M72 84h32v4H72z"/>
      <circle class="il-glow il-ink il-thin" cx="82" cy="58" r="3.6"/><circle class="il-glow il-ink il-thin" cx="94" cy="58" r="3.6"/><circle class="il-dark" cx="84" cy="58" r="1.2"/><circle class="il-dark" cx="96" cy="58" r="1.2"/>
      <path class="il-line il-thin" d="M78 54l6 2M98 54l-6 2"/>
      <path class="il-dark" d="M80 66q8 6 16 0q-8 3-16 0z"/>
      <path class="il-skin il-ink" d="M104 76c6-2 8 2 6 6l-6 0z"/>
    </g>
    <ellipse class="il-grey il-ink il-thin" cx="18" cy="104" rx="12" ry="3"/>
    <g class="il-dark" opacity="0.8">
      <ellipse cx="30" cy="110" rx="2.4" ry="1.4"/><ellipse cx="38" cy="106" rx="2.4" ry="1.4"/>
      <ellipse cx="46" cy="111" rx="2.4" ry="1.4"/><ellipse cx="54" cy="106" rx="2.4" ry="1.4"/>
      <ellipse cx="62" cy="111" rx="2.4" ry="1.4"/>
    </g>
    <path class="il-light il-thin" d="M8 92q4-6 8 0M16 86q2-4 4 0"/>
    <path class="il-light il-thin" d="M50 40l4 0-4 6h4M58 30h3l-3 4h3"/>`,

  // An indignant cave spider with four eyes waves eight legs, one pointing at you, surrounded by opinion bubbles.
  'kz.cave-spider': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" d="M0 0l30 26M0 14l24 14M14 0l10 24M2 8c8 4 14 4 18-2M4 20c8 2 14 0 20-6" opacity="0.6"/>
    <path class="il-light il-thin" d="M80 0v40"/>
    <path class="il-line il-thick" d="M60 60c-12-14-26-14-34-4M58 66c-14-6-28-2-36 8M60 72c-12 2-22 12-24 24M64 76c-6 8-10 18-6 30"/>
    <path class="il-line il-thick" d="M100 60c12-14 24-16 30-8M102 66c14-6 26-2 32 8M100 72c10 4 18 14 18 26M96 76c4 8 8 18 4 30"/>
    <path class="il-light il-thin" d="M60 60c-12-14-26-14-34-4M102 66c14-6 26-2 32 8" opacity="0.3"/>
    <ellipse class="il-purple il-ink" cx="80" cy="66" rx="26" ry="22"/>
    <ellipse class="il-purple-dark" cx="80" cy="80" rx="16" ry="6"/>
    <circle class="il-white il-ink" cx="70" cy="58" r="6"/><circle class="il-dark" cx="71" cy="59" r="2.6"/>
    <circle class="il-white il-ink" cx="90" cy="58" r="6"/><circle class="il-dark" cx="91" cy="59" r="2.6"/>
    <circle class="il-white il-ink il-thin" cx="62" cy="50" r="3"/><circle class="il-dark" cx="62" cy="50" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="98" cy="50" r="3"/><circle class="il-dark" cx="98" cy="50" r="1.2"/>
    <path class="il-line" d="M64 48l10 5M96 48l-10 5"/>
    <path class="il-dark il-ink il-thin" d="M72 70c4 8 12 8 16 0z"/>
    <path class="il-white" d="M74 70l2 3 2-3zM82 70l2 3 2-3z"/>
    <path class="il-line il-thick" d="M130 52c4-4 10-6 14-4"/>
    <path class="il-white il-ink" d="M6 34h22v14H16l-4 5v-5H6z"/>
    <path class="il-dark" d="M15 37h4l-1 6h-2zM15 44h4v2h-4z"/>
    <path class="il-white il-ink" d="M118 10h26v16h-14l-5 5v-5h-7z"/>
    <path class="il-line" d="M127 15c0-4 8-4 8 0s-4 3-4 6M131 23v1"/>
    <path class="il-white il-ink" d="M126 84h28v14h-6v5l-5-5h-17z"/>
    <path class="il-line il-thin" d="M130 91l3-4 3 8 3-8 3 8 3-8 3 4"/>
    <path class="il-white il-ink" d="M4 82h22v14h-12l-4 5v-5H4z"/>
    <path class="il-line" d="M10 85l10 8M20 85l-10 8"/>`,

  // A proud crow curator with a monocle beside her museum: a red gnome hat under a glass dome, roped off.
  'kz.collector-crow': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-wood" d="M0 98h160v22H0z"/>
    <path class="il-line il-thin" d="M0 98h160M30 98l-6 22M80 98v22M130 98l6 22"/>
    <rect class="il-gold il-ink" x="98" y="8" width="44" height="32"/>
    <rect class="il-sky il-ink il-thin" x="103" y="13" width="34" height="22"/>
    <circle class="il-metal il-ink il-thin" cx="120" cy="24" r="6"/>
    <path class="il-line il-thin" d="M116 22l8 4M118 28l4-8"/>
    <rect class="il-white il-ink" x="104" y="70" width="32" height="30"/>
    <rect class="il-white il-ink" x="100" y="64" width="40" height="8"/>
    <path class="il-water il-ink il-thin" d="M104 64c0-34 32-34 32 0z" opacity="0.45"/>
    <path class="il-red il-ink" d="M108 62l12-28 12 28z"/>
    <path class="il-light" d="M110 46c2-6 4-8 8-10"/>
    <path class="il-red il-ink" d="M90 84q30 14 60 0"/>
    <path class="il-gold il-ink il-thin" d="M88 106V82h4v24zM148 106V82h4v24z"/>
    <circle class="il-gold il-ink il-thin" cx="90" cy="81" r="3"/><circle class="il-gold il-ink il-thin" cx="150" cy="81" r="3"/>
    <path class="il-gold il-ink il-thin" d="M84 106h12M144 106h12"/>
    <path class="il-dark il-ink" d="M18 92c-6-22 2-50 22-54 16-2 26 10 24 26-2 20-12 30-30 32z"/>
    <path class="il-dark il-ink" d="M26 82c-10 8-18 8-24 4 8-2 14-8 18-14z"/>
    <circle class="il-dark il-ink" cx="46" cy="40" r="14"/>
    <path class="il-gold il-ink" d="M58 36l18 6-18 6z"/>
    <path class="il-line il-thin" d="M58 42h12"/>
    <circle class="il-white il-ink il-thin" cx="48" cy="38" r="4"/><circle class="il-dark" cx="49" cy="38" r="1.8"/>
    <circle class="il-metal il-ink" cx="48" cy="38" r="6.5" opacity="0.5"/>
    <path class="il-light il-thin" d="M50 44c2 8-2 14 0 22"/>
    <path class="il-light" d="M40 30l12 2"/>
    <path class="il-gold il-ink il-thin" d="M28 92v8M38 92v8M24 100h8M34 100h8"/>
    <path class="il-light il-thin" d="M28 56c6 6 14 8 22 6M30 66c6 6 14 6 20 4"/>
    <path class="il-dark il-ink" d="M40 22c2-6 6-6 8-2 2-4 6-2 4 2z"/>`,

  // A smirking hedge maze with an entrance mouth; its little exit gate walks off with a bindle; your path goes in circles.
  'kz.hedge-maze': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 88h160v32H0z"/>
    <path class="il-green il-ink" d="M8 92V30c0-6 4-8 8-6 2-6 8-6 10-2 2-6 10-6 12-1 2-5 10-5 12 0 2-5 10-5 12 0 2-5 10-5 12 0 2-5 10-5 12 1 2-4 8-4 10 2 4-2 8 0 8 6v62z"/>
    <path class="il-line il-thin" d="M18 40c3-3 6 0 3 3M44 36c3-3 6 0 3 3M80 38c3-3 6 0 3 3M96 52c3-3 6 0 3 3M24 70c3-3 6 0 3 3M106 78c3-3 6 0 3 3M60 34c3-3 6 0 3 3"/>
    <path class="il-dark il-ink" d="M44 92V74c0-8 8-12 14-12s14 4 14 12v18z"/>
    <path class="il-white" d="M48 74h20v3H48z"/>
    <circle class="il-white il-ink" cx="40" cy="50" r="7"/><circle class="il-dark" cx="43" cy="51" r="3"/>
    <circle class="il-white il-ink" cx="76" cy="50" r="7"/><circle class="il-dark" cx="79" cy="51" r="3"/>
    <path class="il-line" d="M32 40l10 2M84 38l-10 4"/>
    <path class="il-line" d="M36 62q4 2 6-2M80 60q-2 4-6 2"/>
    <path class="il-line il-dash" d="M46 108c-20 0-26-8-10-12 16-4 44-4 56 2 10 6-6 12-28 10"/>
    <path class="il-green il-ink" d="M128 84V58c0-10 18-10 18 0v26h-5V64c0-4-8-4-8 0v20z"/>
    <path class="il-line il-thin" d="M131 62c2-2 4 0 2 2M140 70c2-2 4 0 2 2"/>
    <path class="il-line" d="M131 84l-3 10M143 84l4 10M125 94h4M146 94h5"/>
    <path class="il-line" d="M146 64l8-16"/>
    <path class="il-red il-ink" d="M150 48c-2-8 10-10 10-2 0 4-6 6-10 2z"/>
    <path class="il-white il-thin" d="M152 46h2M156 48h1"/>
    <circle class="il-dark" cx="134" cy="70" r="1.4"/><circle class="il-dark" cx="140" cy="70" r="1.4"/>
    <path class="il-line il-thin" d="M134 75q3 2 6 0"/>
    <path class="il-line il-thin" d="M118 70h-6M120 78h-8"/>`,

  // The rival crew: three long-bearded miners, smug; one measures his beard with a tape measure to the ground.
  'kz.rival-crew': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-stone il-ink il-thin" d="M0 70 30 34l20 18 26-30 30 34 22-20 32 32v52H0z"/>
    <path class="il-white" d="M68 30l8-8 8 9-5-2-3 4-3-3zM120 44l8-8 6 6-4 0-2 3z"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <g transform="translate(30 46)">
      <rect class="il-red il-ink" x="-13" y="8" width="26" height="40" rx="5"/>
      <path class="il-dark il-ink" d="M-11 48h9v6h-11zM2 48h9v6H0z"/>
      <circle class="il-skin il-ink" cx="0" cy="0" r="10"/>
      <path class="il-beard il-ink" d="M-10 2C-12 20-6 40 0 54 6 40 12 20 10 2 6 7-6 7-10 2Z"/>
      <path class="il-line il-thin" d="M-4 14c0 10 2 20 4 30M4 14c0 10-2 20-4 30"/>
      <path class="il-yellow il-ink" d="M-11-2a11 11 0 0 1 22 0z"/><path class="il-yellow il-ink" d="M-14-3h28v4h-28z"/>
      <circle class="il-glow il-ink il-thin" cx="0" cy="-9" r="2.6"/>
      <path class="il-line il-thin" d="M-6 3h4M2 3h4"/>
      <ellipse class="il-skin il-ink il-thin" cx="0" cy="6" rx="2.4" ry="2"/>
    </g>
    <g transform="translate(80 36)">
      <rect class="il-blue il-ink" x="-14" y="10" width="28" height="48" rx="5"/>
      <path class="il-dark il-ink" d="M-12 58h10v6h-12zM2 58h10v6H0z"/>
      <circle class="il-skin il-ink" cx="0" cy="0" r="11"/>
      <path class="il-beard il-ink" d="M-11 2C-13 24-6 50 0 68 6 50 13 24 11 2 6 8-6 8-11 2Z"/>
      <path class="il-line il-thin" d="M-4 16c0 14 2 28 4 42M4 16c0 14-2 28-4 42"/>
      <path class="il-yellow il-ink" d="M-12-2a12 12 0 0 1 24 0z"/><path class="il-yellow il-ink" d="M-15-3h30v4h-30z"/>
      <circle class="il-glow il-ink il-thin" cx="0" cy="-10" r="2.8"/>
      <path class="il-line il-thin" d="M-7 2q3-2 6 0M1 2q3-2 6 0M-8-1l5-1M8-1l-5-1"/>
      <ellipse class="il-skin il-ink il-thin" cx="0" cy="6" rx="2.6" ry="2.2"/>
      <path class="il-skin il-ink il-thin" d="M-16 26c-4 0-4 6 0 6z"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M58 64h6v42h-6z"/>
    <path class="il-line il-thin" d="M58 70h3M58 76h4M58 82h3M58 88h4M58 94h3M58 100h4"/>
    <rect class="il-yellow il-ink" x="52" y="98" width="14" height="10" rx="3"/>
    <circle class="il-dark" cx="59" cy="103" r="2"/>
    <g transform="translate(130 46)">
      <rect class="il-green il-ink" x="-13" y="8" width="26" height="40" rx="5"/>
      <path class="il-dark il-ink" d="M-11 48h9v6h-11zM2 48h9v6H0z"/>
      <circle class="il-skin il-ink" cx="0" cy="0" r="10"/>
      <path class="il-beard il-ink" d="M-10 2C-12 20-6 40 0 54 6 40 12 20 10 2 6 7-6 7-10 2Z"/>
      <path class="il-line il-thin" d="M-4 14c0 10 2 20 4 30M4 14c0 10-2 20-4 30"/>
      <path class="il-yellow il-ink" d="M-11-2a11 11 0 0 1 22 0z"/><path class="il-yellow il-ink" d="M-14-3h28v4h-28z"/>
      <circle class="il-glow il-ink il-thin" cx="0" cy="-9" r="2.6"/>
      <path class="il-line il-thin" d="M-6 3h4M2 3h4"/>
      <ellipse class="il-skin il-ink il-thin" cx="0" cy="6" rx="2.4" ry="2"/>
      <path class="il-line" d="M12 16l6-6M18 10l2 4M18 10l-4 0"/>
    </g>
    <path class="il-gold il-thin il-ink" d="M98 26l2-5 2 5 5 2-5 2-2 5-2-5-5-2z"/>`,

  // A bored miner ghost in a hard hat checks his pocket watch, lunch box ready, next to the time clock in a cobwebbed tunnel.
  'kz.last-shift-ghost': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-wood il-ink" d="M10 104V14h10v90zM140 104V14h10v90zM6 6h148v12H6z"/>
    <path class="il-line il-thin" d="M13 30v20M146 40v24M30 10h30M90 12h40"/>
    <path class="il-light il-thin" d="M140 18l14 14M146 18v14M140 26h12" opacity="0.6"/>
    <rect class="il-metal il-ink" x="116" y="40" width="22" height="30" rx="2"/>
    <circle class="il-white il-ink il-thin" cx="127" cy="50" r="6"/>
    <path class="il-line il-thin" d="M127 50v-4M127 50l3 2"/>
    <rect class="il-paper il-ink il-thin" x="122" y="60" width="10" height="14"/>
    <path class="il-white il-ink" d="M40 104c-4-2-6-8-6-14V54c0-20 14-32 32-32s32 12 32 32v36c0 6-2 12-6 14-4-4-8-4-10 0-4-4-8-4-10 0-4-4-8-4-10 0-4-4-8-4-10 0-4-4-8-4-12 0z" opacity="0.85"/>
    <path class="il-yellow il-ink" d="M40 40c0-22 52-22 52 0z"/>
    <path class="il-yellow il-ink" d="M34 38h64v6H34z"/>
    <circle class="il-glow il-ink il-thin" cx="66" cy="24" r="4"/>
    <path class="il-white il-ink il-thin" d="M48 54c0-4 10-4 10 0zM74 54c0-4 10-4 10 0z"/>
    <circle class="il-dark" cx="53" cy="56" r="2.2"/><circle class="il-dark" cx="79" cy="56" r="2.2"/>
    <path class="il-line il-thin" d="M48 60q5 2 10 0M74 60q5 2 10 0"/>
    <path class="il-line" d="M58 72h16"/>
    <path class="il-white il-ink" d="M36 70c-8 4-10 12-6 16" opacity="0.85"/>
    <circle class="il-gold il-ink" cx="30" cy="90" r="7"/>
    <circle class="il-white il-ink il-thin" cx="30" cy="90" r="4.6"/>
    <path class="il-line il-thin" d="M30 90v-3M30 90l2 1M30 83v-3"/>
    <path class="il-white il-ink" d="M96 70c8 2 10 10 10 16" opacity="0.85"/>
    <path class="il-metal il-ink" d="M98 86h18v14H98z"/>
    <path class="il-line il-thin" d="M101 86c0-6 12-6 12 0M98 92h18"/>
    <path class="il-light il-thin" d="M40 46l-6-4M40 46l-8 0M40 46l-6 4" opacity="0.6"/>
    <path class="il-line il-thin" d="M56 14l2-4 2 4M64 10l2-4 2 4" transform="translate(40 0)"/>`,

  // A woodlouse rolled into an armoured ball as big as the garden shed next to it, peeking out; a flattened helmet lies behind it.
  'kz.giant-woodlouse': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-wood il-ink" d="M110 54l22-16 22 16v48h-44z"/>
    <path class="il-wood-dark il-ink" d="M106 56l26-20 26 20-3 3-23-17-23 17z"/>
    <path class="il-dark il-ink il-thin" d="M124 102V72h16v30z"/>
    <path class="il-line il-thin" d="M116 60v40M148 60v40"/>
    <ellipse class="il-grey" cx="66" cy="102" rx="44" ry="4"/>
    <circle class="il-stone il-ink" cx="66" cy="60" r="42"/>
    <path class="il-line" d="M30 38c22 10 50 10 72 0M25 56c26 10 56 10 82 0M26 74c26 10 54 10 80 0M34 90c20 8 44 8 64 0"/>
    <path class="il-line il-thin" d="M66 18v84"/>
    <path class="il-light" d="M42 28c6-6 14-8 22-8"/>
    <path class="il-grey il-ink" d="M84 50c12-8 26-4 26 10s-14 18-26 10z"/>
    <circle class="il-white il-ink" cx="96" cy="56" r="4.6"/><circle class="il-dark" cx="98" cy="57" r="2"/>
    <circle class="il-white il-ink" cx="104" cy="58" r="4"/><circle class="il-dark" cx="106" cy="59" r="1.8"/>
    <path class="il-line il-thin" d="M92 50l7 2M104 52l4 2"/>
    <path class="il-line il-thin" d="M98 66q4 3 8 0"/>
    <path class="il-line" d="M104 48c4-10 10-14 16-14M108 52c6-8 12-10 18-8"/>
    <path class="il-line il-thin" d="M44 102l-2 4M56 104l0 4M76 104l2 4"/>
    <path class="il-light" d="M2 44h16M0 58h14M4 72h14"/>
    <path class="il-metal il-ink" d="M2 108c4-4 18-4 22 0z"/>
    <path class="il-line il-thin" d="M8 98l2 4M16 96v5M22 99l-2 3"/>`,

  // A big red rose with angry eyes and a toothy, drooling mouth; leaf arms grab, thorny stem, hearts of lovely scent.
  'kz.carnivorous-rose': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-earth il-ink" d="M40 120c4-14 76-14 80 0z"/>
    <path class="il-green il-ink" d="M76 74h8v38h-8z"/>
    <path class="il-green il-ink il-thin" d="M76 84l-5-2 5-2zM84 94l5-2-5-2zM76 102l-5-2 5-2z"/>
    <path class="il-green il-ink" d="M76 90C62 78 46 84 34 74c10-2 26-6 42 8z"/>
    <path class="il-green il-ink" d="M84 82c12-12 30-8 40-18-4 12-20 22-40 26z"/>
    <path class="il-line il-thin" d="M44 76c10 4 20 6 30 10M88 84c10-4 22-10 30-16"/>
    <path class="il-red il-ink" d="M44 44c0-20 16-34 36-34s36 14 36 34-16 34-36 34-36-14-36-34z"/>
    <path class="il-red il-ink" d="M40 50c-6-10 0-22 10-24M120 50c6-10 0-22-10-24"/>
    <path class="il-line il-thin" d="M58 22c8-6 18-6 22 0 6-6 16-6 22 0M66 30c6-4 10-2 14 2 4-4 10-6 14-2"/>
    <circle class="il-white il-ink" cx="68" cy="38" r="5"/><circle class="il-dark" cx="69" cy="39" r="2.4"/>
    <circle class="il-white il-ink" cx="92" cy="38" r="5"/><circle class="il-dark" cx="91" cy="39" r="2.4"/>
    <path class="il-line" d="M60 30l12 4M100 30l-12 4"/>
    <path class="il-dark il-ink" d="M56 50c8 4 40 4 48 0-4 16-14 20-24 20s-20-4-24-20z"/>
    <path class="il-white il-ink il-thin" d="M58 51l4 6 4-5 4 6 4-6 4 6 4-6 4 6 4-6 4 5 4-6z"/>
    <path class="il-white il-ink il-thin" d="M66 68l4-5 4 5 4-5 4 5 4-5 4 5z"/>
    <path class="il-pink" d="M70 62c4-3 16-3 20 0-2 3-18 3-20 0z"/>
    <path class="il-water il-ink il-thin" d="M98 64c2 4 4 6 2 8-2 1-4-1-3-3z"/>
    <path class="il-pink il-ink il-thin" d="M130 30c-2-4 3-6 4-2 1-4 6-2 4 2l-4 4zM20 26c-2-4 3-6 4-2 1-4 6-2 4 2l-4 4zM142 50c-2-3 2-5 3-2 1-3 5-1 3 2l-3 3z"/>
    <path class="il-line il-thin" d="M122 40c4-2 2-6 6-8M28 40c-4-2-2-6-6-8"/>
    <path class="il-metal il-ink" d="M128 104c0-8 18-8 18 0z"/>
    <path class="il-sky" d="M140 97a4 4 0 0 1 6 7z"/>`,

  // An exhausted upright steam drill with baggy eyes and a sweaty frown, steam fuming from its chimney, drilling into rock anyway.
  'kz.steam-drill': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-stone il-ink" d="M130 0h30v120h-36c6-20-6-40 2-60s0-40 4-60z"/>
    <path class="il-line il-thin" d="M128 52l10-4 6 6M126 70l12 2"/>
    <path class="il-smoke il-ink il-thin" d="M30 22c-8 0-10-10-2-12 0-8 12-10 16-4 6-6 18-2 16 6 8 2 6 12-2 12z"/>
    <path class="il-smoke il-ink il-thin" d="M48 4c-4 0-4-6 0-6h8c4 0 4 6 0 6z" transform="translate(16 2)"/>
    <rect class="il-dark il-ink" x="40" y="22" width="12" height="16"/>
    <rect class="il-red il-ink" x="20" y="36" width="56" height="58" rx="12"/>
    <path class="il-metal il-ink il-thin" d="M20 50h56M20 82h56"/>
    <g class="il-dark"><circle cx="26" cy="46" r="1.4"/><circle cx="70" cy="46" r="1.4"/><circle cx="26" cy="86" r="1.4"/><circle cx="70" cy="86" r="1.4"/></g>
    <path class="il-white il-ink il-thin" d="M30 60c0-4 12-4 12 0zM54 60c0-4 12-4 12 0z"/>
    <circle class="il-dark" cx="36" cy="62" r="2"/><circle class="il-dark" cx="60" cy="62" r="2"/>
    <path class="il-line il-thin" d="M30 66q6 3 12 0M54 66q6 3 12 0M30 69q6 3 12 0M54 69q6 3 12 0"/>
    <path class="il-line" d="M40 77q8-5 16 0"/>
    <path class="il-water il-ink il-thin" d="M74 40c2 4 4 6 2 8-2 1-4-1-3-3zM18 50c2 4 4 6 2 8-2 1-4-1-3-3z"/>
    <circle class="il-white il-ink" cx="62" cy="44" r="5"/>
    <path class="il-line il-thin" d="M62 44l3-3"/>
    <path class="il-red" d="M62 44l3-3 1 2z"/>
    <rect class="il-metal il-ink" x="76" y="70" width="22" height="12"/>
    <path class="il-metal il-ink" d="M98 62h8v28h-8z"/>
    <path class="il-metal il-ink" d="M106 64l22 12-22 12z"/>
    <path class="il-line il-thin" d="M110 66l-2 20M116 69l-2 14M122 72l-1 8"/>
    <path class="il-yellow il-ink il-thin" d="M126 68l4-4M128 84l5 3M124 62l0-5"/>
    <circle class="il-dark il-ink" cx="32" cy="98" r="8"/><circle class="il-metal" cx="32" cy="98" r="3"/>
    <circle class="il-dark il-ink" cx="64" cy="98" r="8"/><circle class="il-metal" cx="64" cy="98" r="3"/>
    <path class="il-line il-thin" d="M84 40l4-6M90 44l6-4"/>`,

  // A hunched giant clutches his aching back (plaster on it), grimacing, while his raised boot hovers over a tiny gnome.
  'kz.backache-giant': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-wood-dark il-ink" d="M48 72h16l-2 32h-14z"/>
    <path class="il-dark il-ink" d="M44 104h22v6H40c0-4 2-6 4-6z"/>
    <path class="il-wood-dark il-ink" d="M84 70l24 8-4 12-22-6z"/>
    <path class="il-wood-dark il-ink" d="M104 78l10 2-4 10-10-2z"/>
    <path class="il-dark il-ink" d="M106 88h22v6h-24z"/>
    <path class="il-grey il-ink" d="M28 70c-4-26 14-44 44-44 26 0 40 12 40 30s-12 22-34 22c-20 0-46 4-50-8z"/>
    <path class="il-dark il-ink" d="M30 66h80v6H30z" transform="rotate(-6 70 69)"/>
    <path class="il-white il-ink il-thin" d="M36 38l14 10-3 4-14-10zM34 50l14-10 3 4-14 10z"/>
    <path class="il-skin il-ink" d="M64 36c-12 4-26 10-30 22l6 4c4-8 16-14 28-18z"/>
    <path class="il-skin il-ink" d="M26 58c-4 6 2 12 8 8l4-6c-2-4-8-6-12-2z"/>
    <path class="il-line il-thin" d="M20 30l4-4 2 6 4-6 2 6M14 46l6-2-2 6 6-2"/>
    <circle class="il-skin il-ink" cx="122" cy="40" r="17"/>
    <path class="il-beard il-ink" d="M106 46c4 10 26 12 32 0-6 4-26 4-32 0z"/>
    <path class="il-line" d="M112 34l6 3-6 3M134 34l-6 3 6 3"/>
    <path class="il-line" d="M110 26l8 4M136 26l-8 4"/>
    <rect class="il-white il-ink" x="114" y="44" width="18" height="6" rx="2"/>
    <path class="il-line il-thin" d="M118 44v6M123 44v6M128 44v6"/>
    <ellipse class="il-skin il-ink" cx="123" cy="40" rx="3" ry="2.4"/>
    <path class="il-water il-ink il-thin" d="M140 30c2 4 4 6 2 8-2 1-4-1-3-3z"/>
    <path class="il-skin il-ink" d="M104 56c6 4 8 10 6 16l-6-2c0-4-2-8-4-10z"/>
    <ellipse class="il-dark" cx="117" cy="108" rx="12" ry="2" opacity="0.5"/>
    <path class="il-red il-ink il-thin" d="M112 106l5-12 5 12z"/>
    <path class="il-beard il-ink il-thin" d="M113 104c1 4 7 4 8 0z"/>
    <circle class="il-dark" cx="115.5" cy="103" r="0.9"/><circle class="il-dark" cx="118.5" cy="103" r="0.9"/>
    <path class="il-dark" d="M138 92h3l-.5 7h-2zM138 101h3v3h-3z"/>`,

  // An ancient, wise slime with bushy white brows and spectacles; swallowed helmet, boot and key float inside its goo.
  'kz.primordial-ooze': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone il-ink il-thin" d="M0 0h160v6l-8 14-6-12-10 18-8-16-12 10-10-12-14 16-8-14-10 10-12-12-10 14-8-10-14 12-8-14-10 10-10-14-12 14z"/>
    <path class="il-earth-dark" d="M0 106h160v14H0z"/>
    <path class="il-slime il-ink" d="M16 108C10 80 20 50 44 36c20-12 52-12 72 0 24 14 34 44 28 72z"/>
    <path class="il-slime il-ink" d="M36 106c0 6 4 10 6 6M100 106c0 8 4 10 6 6M126 106c0 4 2 6 4 4"/>
    <path class="il-light" d="M38 50c6-8 14-12 22-12" opacity="0.7"/>
    <g opacity="0.75">
      <path class="il-yellow il-ink il-thin" d="M30 92a10 10 0 0 1 20 0z"/><path class="il-yellow il-ink il-thin" d="M27 92h26v3H27z"/>
      <path class="il-wood-dark il-ink il-thin" d="M108 82h8v12h8v6h-16z"/>
      <circle class="il-gold il-ink il-thin" cx="78" cy="96" r="4"/><path class="il-gold il-ink il-thin" d="M82 95h12v3h-2v3h-2v-3h-8z"/>
    </g>
    <circle class="il-white il-ink il-thin" cx="56" cy="80" r="2"/><circle class="il-white il-ink il-thin" cx="100" cy="68" r="2.6"/><circle class="il-white il-ink il-thin" cx="122" cy="96" r="1.6"/>
    <path class="il-beard il-ink" d="M48 50c4-8 18-10 26-4-8 0-16 2-22 8zM112 50c-4-8-18-10-26-4 8 0 16 2 22 8z"/>
    <circle class="il-white il-ink" cx="64" cy="58" r="6"/><circle class="il-dark" cx="65" cy="60" r="2.6"/>
    <circle class="il-white il-ink" cx="96" cy="58" r="6"/><circle class="il-dark" cx="95" cy="60" r="2.6"/>
    <path class="il-line il-thin" d="M58 62q6 4 12 0M90 62q6 4 12 0"/>
    <circle class="il-metal il-ink il-thin" cx="64" cy="58" r="8" opacity="0.4"/><circle class="il-metal il-ink il-thin" cx="96" cy="58" r="8" opacity="0.4"/>
    <path class="il-line il-thin" d="M72 58h16"/>
    <path class="il-line" d="M66 76q14 6 28 0"/>
    <path class="il-line il-thin" d="M50 40l4 3M106 40l-4 3M76 38q4-2 8 0"/>
    <path class="il-wood il-ink" d="M140 106l4-58h4l-4 58z"/>
    <path class="il-wood il-ink" d="M142 48c0-8 12-8 12 0h-4c0-3-4-3-4 0z"/>
    <path class="il-slime il-ink" d="M132 72c6-4 10-2 12 0-4 4-8 6-12 4z"/>`,

  // The garden show jury: three stern judges behind a table, clipboard and a thumbs-down scorecard over your wilted flower.
  'kz.garden-show-jury': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <g transform="translate(30 0)">
      <rect class="il-purple il-ink" x="-15" y="48" width="30" height="30" rx="6"/>
      <circle class="il-skin il-ink" cx="0" cy="36" r="14"/>
      <path class="il-pink il-ink" d="M-20 26c0-6 40-6 40 0-6 3-34 3-40 0z"/>
      <path class="il-pink il-ink" d="M-11 25c0-14 22-14 22 0z"/>
      <circle class="il-yellow il-ink il-thin" cx="8" cy="16" r="4"/>
      <circle class="il-dark" cx="-5" cy="36" r="2"/><circle class="il-dark" cx="5" cy="36" r="2"/>
      <path class="il-line" d="M-9 31l6 2M9 31l-6 2"/>
      <path class="il-dark il-ink il-thin" d="M-7 46c2-6 12-6 14 0z"/>
    </g>
    <g transform="translate(80 -4)">
      <rect class="il-blue il-ink" x="-16" y="52" width="32" height="30" rx="6"/>
      <circle class="il-skin il-ink" cx="0" cy="38" r="15"/>
      <path class="il-grey il-ink" d="M-15 32c0-14 30-14 30 0-6-6-24-6-30 0z"/>
      <circle class="il-dark" cx="-5" cy="38" r="2"/><circle class="il-dark" cx="6" cy="38" r="2"/>
      <circle class="il-metal il-ink il-thin" cx="6" cy="38" r="5" opacity="0.6"/>
      <path class="il-line il-thin" d="M11 40c2 6 0 12-2 16"/>
      <path class="il-line" d="M-10 32l7 2M11 31l-7 3"/>
      <path class="il-dark il-ink il-thin" d="M-8 50c2-6 14-6 16 0z"/>
      <rect class="il-paper il-ink" x="6" y="60" width="16" height="20" rx="1" transform="rotate(-10 14 70)"/>
      <path class="il-metal il-ink il-thin" d="M10 58h8v3h-8z" transform="rotate(-10 14 70)"/>
      <path class="il-line il-thin" d="M10 66l8-1M10 70l8-1M10 74l7 4M17 72l-6 6" transform="rotate(-10 14 70)"/>
    </g>
    <g transform="translate(130 0)">
      <rect class="il-green il-ink" x="-15" y="48" width="30" height="30" rx="6"/>
      <circle class="il-skin il-ink" cx="0" cy="36" r="14"/>
      <path class="il-line il-thin" d="M-6 24q6-4 12 0"/>
      <circle class="il-dark" cx="-5" cy="36" r="2"/><circle class="il-dark" cx="5" cy="36" r="2"/>
      <path class="il-line" d="M-10 30l8 3M10 30l-8 3"/>
      <path class="il-dark il-ink il-thin" d="M-7 46c2-6 12-6 14 0z"/>
      <path class="il-line" d="M14 52V20"/>
      <rect class="il-white il-ink" x="2" y="2" width="24" height="20" rx="2"/>
      <circle class="il-red il-ink il-thin" cx="14" cy="12" r="7"/><circle class="il-dark" cx="11.5" cy="10" r="1.1"/><circle class="il-dark" cx="16.5" cy="10" r="1.1"/><path class="il-line il-thin" d="M10.5 16q3.5-3 7 0"/>
    </g>
    <path class="il-white il-ink" d="M4 68h152v30H4z"/>
    <path class="il-red il-ink" d="M4 68h152v6H4z"/>
    <path class="il-line il-thin" d="M40 74v24M80 74v24M120 74v24"/>
    <path class="il-earth il-ink" d="M50 120c2-10 58-10 60 0z"/>
    <path class="il-line" d="M80 114c0-10 4-16 12-14"/>
    <path class="il-green il-ink il-thin" d="M80 110c-6-2-8 2-8 4 4 0 6-2 8-4z"/>
    <path class="il-yellow il-ink il-thin" d="M90 100l-4 6 4 4 4-4 4 4 2-6z"/>
    <circle class="il-orange il-ink il-thin" cx="94" cy="102" r="2.4"/>
    <path class="il-yellow il-ink il-thin" d="M66 116l4-2 2 3z"/>`,

  // The ancient mountain king: gold crown, stern brows, and a gigantic beard riddled with tunnels, lanterns, a door and a mouse tenant.
  'kz.mine-king': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-purple il-ink" d="M30 120c0-30 10-50 50-50s50 20 50 50z"/>
    <circle class="il-skin il-ink" cx="80" cy="36" r="20"/>
    <path class="il-gold il-ink" d="M58 26l4-22 8 12 10-14 10 14 8-12 4 22z"/>
    <circle class="il-red il-ink il-thin" cx="80" cy="16" r="3"/><circle class="il-teal il-ink il-thin" cx="66" cy="20" r="2"/><circle class="il-teal il-ink il-thin" cx="94" cy="20" r="2"/>
    <path class="il-beard il-ink" d="M66 34l12-2M94 34l-12-2" />
    <path class="il-beard il-ink" d="M62 30c4-4 12-4 16 0-6 2-12 2-16 0zM98 30c-4-4-12-4-16 0 6 2 12 2 16 0z"/>
    <circle class="il-dark" cx="71" cy="37" r="2.2"/><circle class="il-dark" cx="89" cy="37" r="2.2"/>
    <path class="il-beard il-ink" d="M58 42c-10 22-28 40-36 74h116c-8-34-26-52-36-74-6 6-14 8-22 8s-16-2-22-8z"/>
    <ellipse class="il-skin il-ink" cx="80" cy="44" rx="5" ry="4.6"/>
    <path class="il-beard il-ink" d="M66 50c6 4 22 4 28 0"/>
    <path class="il-dark il-ink" d="M40 112v-10c0-6 10-6 10 0v10z"/>
    <circle class="il-glow" cx="45" cy="104" r="1.8"/>
    <path class="il-wood il-ink" d="M72 116V100c0-6 14-6 14 0v16z"/>
    <circle class="il-yellow il-ink il-thin" cx="79" cy="104" r="2"/>
    <circle class="il-metal" cx="83" cy="110" r="1"/>
    <path class="il-dark il-ink" d="M100 90c0-8 12-8 12 0v6h-12z"/>
    <path class="il-grey il-ink il-thin" d="M102 96c0-4 2-6 4-6s4 2 4 6z"/>
    <circle class="il-grey il-ink il-thin" cx="103" cy="90" r="2"/><circle class="il-grey il-ink il-thin" cx="109" cy="90" r="2"/>
    <circle class="il-dark" cx="105" cy="94" r=".8"/><circle class="il-dark" cx="107" cy="94" r=".8"/>
    <path class="il-dark il-ink" d="M62 78c0-6 8-6 8 0v6h-8z"/>
    <circle class="il-glow" cx="66" cy="80" r="1.4"/>
    <path class="il-line il-thin" d="M50 100l10-16M54 102l10-16M51 97h5M53 93h5M56 89h5"/>
    <path class="il-line il-thin" d="M90 64c0 6 2 12 4 16M70 64c-2 8-6 14-10 18M118 104c-2-6-6-10-8-14"/>
    <path class="il-line il-thin" d="M96 76h14l-2 4h-10z"/>
    <path class="il-white il-thin il-ink" d="M110 76l6-4"/>`
};
