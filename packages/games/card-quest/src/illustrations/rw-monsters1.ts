/* Railway illustrations: monsters1. */
export const RW_MONSTERS1: Readonly<Record<string, string>> = {
  // A chubby plush steam engine on the souvenir counter gets squeezed flat by a big hand: eyes pinched shut, mouth wide
  // open, it toots a huge puff of steam with a music note. The price tag still dangles from its cab.
  'rw.plush-loco': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-red" d="M0 0h160v10H0z"/>
    <path class="il-white" d="M16 0h16v10H16zM48 0h16v10H48zM80 0h16v10H80zM112 0h16v10h-16zM144 0h16v10h-16z"/>
    <path class="il-red il-ink il-thin" d="M0 10a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0z"/>
    <rect class="il-wood il-ink" x="-2" y="98" width="164" height="24"/>
    <rect class="il-wood-dark" x="-2" y="98" width="164" height="4"/>
    <path class="il-line il-thin" opacity="0.4" d="M10 110h30M60 114h40M120 108h30"/>
    <ellipse class="il-dark" opacity="0.25" cx="74" cy="100" rx="52" ry="3"/>
    <rect class="il-blue il-ink" x="92" y="42" width="34" height="48" rx="8"/>
    <rect class="il-white il-ink il-thin" x="100" y="50" width="18" height="14" rx="4"/>
    <path class="il-light il-thin il-dash" d="M96 70h26"/>
    <rect class="il-red il-ink" x="88" y="35" width="42" height="9" rx="4.5"/>
    <path class="il-red il-ink" d="M31 62l-5-16h22l-5 16z"/>
    <rect class="il-red il-ink" x="22" y="41" width="30" height="7" rx="3.5"/>
    <path class="il-blue il-ink" d="M34 60H55q11 8 23 0H97v30H34a15 15 0 0 1 0-30z"/>
    <path class="il-light il-thin il-dash" d="M40 64v22M90 64v22"/>
    <circle class="il-yellow il-ink" cx="22" cy="68" r="4"/>
    <path class="il-line il-thin" d="M47 71l6 3-6 3M70 71l-6 3 6 3"/>
    <ellipse class="il-dark il-ink" cx="59" cy="82" rx="6" ry="5"/>
    <ellipse class="il-pink" cx="59" cy="85" rx="3.5" ry="2"/>
    <circle class="il-pink" opacity="0.8" cx="43" cy="81" r="3.5"/><circle class="il-pink" opacity="0.8" cx="75" cy="81" r="3.5"/>
    <circle class="il-red il-ink" cx="44" cy="92" r="9"/><circle class="il-yellow il-ink il-thin" cx="44" cy="92" r="3"/>
    <circle class="il-red il-ink" cx="69" cy="92" r="9"/><circle class="il-yellow il-ink il-thin" cx="69" cy="92" r="3"/>
    <circle class="il-red il-ink" cx="108" cy="89" r="11"/><circle class="il-yellow il-ink il-thin" cx="108" cy="89" r="3.5"/>
    <circle class="il-light il-thin il-dash" cx="108" cy="89" r="7.5"/>
    <rect class="il-green il-ink" x="54" y="-2" width="28" height="28" rx="3"/>
    <path class="il-line il-thin" d="M60 4v18M74 4v18"/>
    <rect class="il-skin il-ink" x="54" y="44" width="7" height="22" rx="3.5"/>
    <rect class="il-skin il-ink" x="61" y="45" width="7" height="22" rx="3.5"/>
    <rect class="il-skin il-ink" x="68" y="45" width="7" height="22" rx="3.5"/>
    <rect class="il-skin il-ink" x="75" y="44" width="7" height="21" rx="3.5"/>
    <rect class="il-skin il-ink" x="53" y="28" width="30" height="22" rx="9"/>
    <rect class="il-skin il-ink" x="46" y="32" width="7" height="17" rx="3.5" transform="rotate(-24 50 34)"/>
    <rect class="il-white il-ink" x="52" y="23" width="32" height="7" rx="3"/>
    <path class="il-line il-thin" d="M14 62q-5 12 0 24M8 58q-7 16 0 32M136 58q5 12 0 24"/>
    <circle class="il-white il-ink il-thin" cx="37" cy="32" r="7"/><circle class="il-white il-ink il-thin" cx="25" cy="26" r="7.5"/>
    <circle class="il-white il-ink il-thin" cx="12" cy="32" r="6"/><circle class="il-white il-ink il-thin" cx="44" cy="24" r="4.5"/>
    <ellipse class="il-dark" cx="10" cy="58" rx="3.2" ry="2.4" transform="rotate(-20 10 58)"/>
    <path class="il-line il-thin" d="M13 57V47l5 2"/>
    <path class="il-line il-thin" d="M90 22l7-4M92 30h8M86 15l3-6"/>
    <path class="il-line il-thin" d="M126 38l12 13"/>
    <path class="il-yellow il-ink il-thin" d="M134 50l13-5 6 13-13 5z"/>
    <circle class="il-paper il-ink il-thin" cx="138.5" cy="51" r="1.6"/>
    <circle class="il-gold il-ink il-thin" cx="145" cy="56" r="3"/>`,

  // A huge brown dog sleeps curled up on the platform under the station clock; a cobweb links its ear to the pillar, a
  // pigeon naps on its back, a snail crosses it and a little flower has grown next to its paw. Snot bubble, zzz.
  'rw.station-dog': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-metal il-ink" x="-2" y="-2" width="164" height="10"/>
    <path class="il-line il-thin" d="M0 8l8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9"/>
    <path class="il-light il-thin" opacity="0.4" d="M40 20h40M90 30h50M30 40h30"/>
    <rect class="il-metal il-ink" x="8" y="6" width="12" height="80"/>
    <rect class="il-metal il-ink" x="4" y="6" width="20" height="6"/>
    <path class="il-line" d="M130 8v6"/>
    <circle class="il-white il-ink" cx="130" cy="26" r="12"/>
    <path class="il-line il-thin" d="M130 16v3M130 33v3M120 26h3M137 26h3"/>
    <path class="il-line" d="M130 26v-7M130 26l5 3"/><circle class="il-dark" cx="130" cy="26" r="1.6"/>
    <rect class="il-stone il-ink" x="-2" y="82" width="164" height="40"/>
    <path class="il-line il-thin" opacity="0.35" d="M30 82l-6 38M70 82l-2 38M110 82l2 38M150 82l6 38"/>
    <path class="il-light il-dash" d="M0 113h160"/>
    <path class="il-line il-thin" d="M72 108v-8"/>
    <path class="il-green il-ink il-thin" d="M72 104c-5-3-8 0-8 2 4 2 6 1 8-2z"/>
    <circle class="il-yellow il-ink il-thin" cx="72" cy="98" r="3"/>
    <ellipse class="il-dark" opacity="0.2" cx="84" cy="106" rx="56" ry="4"/>
    <path class="il-wood il-ink" d="M124 84c14 2 16 16 3 20-10 3-28 3-36 1 8-2 24-2 30-6 5-3 3-8-3-9z"/>
    <ellipse class="il-wood il-ink" cx="92" cy="86" rx="38" ry="18"/>
    <ellipse class="il-wood-dark" cx="104" cy="78" rx="9" ry="6"/>
    <ellipse class="il-wood-dark" cx="82" cy="94" rx="6" ry="4"/>
    <path class="il-line il-thin" d="M70 74q4-2 8 0M112 92q4 2 8 0M96 98q3 1 6 0"/>
    <ellipse class="il-wood il-ink" cx="116" cy="96" rx="12" ry="8"/>
    <ellipse class="il-wood il-ink" cx="36" cy="101" rx="10" ry="4.5"/>
    <ellipse class="il-wood il-ink" cx="52" cy="103" rx="10" ry="4.5"/>
    <ellipse class="il-wood il-ink" cx="52" cy="86" rx="18" ry="14"/>
    <ellipse class="il-paper il-ink" cx="38" cy="92" rx="10" ry="7"/>
    <ellipse class="il-dark" cx="30" cy="89" rx="3.5" ry="2.6"/>
    <path class="il-line il-thin" d="M33 96q4 2 8-1"/>
    <circle class="il-water il-ink il-thin" opacity="0.7" cx="24" cy="83" r="5"/>
    <path class="il-light il-thin" d="M22 81a2.5 2.5 0 0 1 3-1.5"/>
    <path class="il-wood-dark il-ink" d="M56 74c8-5 15 1 13 12-2 8-8 10-12 6z"/>
    <path class="il-line" d="M42 82q4 3 8 0"/>
    <path class="il-line il-thin" d="M41 78l9-1"/>
    <path class="il-light il-thin" d="M20 64L50 74M20 64l22-12M20 64l12-18M20 64h-0M20 64l18 18M24 60l4 7-4 5M30 56l6 10-4 9M34 50l12 10-2 15"/>
    <path class="il-line" d="M50 60h7l-7 7h7M62 48h9l-9 9h9M76 36h11l-11 11h11"/>
    <ellipse class="il-grey il-ink" cx="100" cy="65" rx="10" ry="6.5"/>
    <path class="il-dark il-thin" d="M94 68q8 3 14-1" opacity="0.5"/>
    <circle class="il-grey il-ink" cx="91" cy="61" r="5"/>
    <path class="il-teal" d="M87 64q4 3 8 1l1 2q-5 2-10-1z"/>
    <path class="il-line il-thin" d="M88 60q2 1.5 4 0"/>
    <path class="il-gold il-ink il-thin" d="M86 61l-4 1 4 1z"/>
    <path class="il-line il-thin" d="M106 54h4l-4 4h4"/>
    <path class="il-beard il-ink il-thin" d="M118 74c4 0 8-1 12-1 2 0 2 2 0 2h-12z"/>
    <circle class="il-gold il-ink il-thin" cx="125" cy="70" r="4.5"/>
    <path class="il-line il-thin" d="M125 70a1.6 1.6 0 1 1 1.6 1.6M130 73l2-3"/>`,

  // A cheeky little ghost squeezes out of the gap in the compartment door and blows an icy gust down a passenger's neck:
  // his hair stands on end, he shivers, eyes wide. Snowflakes drift in the draught, his ticket flutters away.
  'rw.draught-ghost': `
    <rect class="il-wood" x="0" y="0" width="160" height="120"/>
    <path class="il-wood-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M60 10v94M100 46v58"/>
    <rect class="il-sky il-ink" x="98" y="8" width="56" height="30" rx="4"/>
    <path class="il-grass" d="M99 30q14-10 26-2t28-4v12H99z"/>
    <path class="il-light il-thin" d="M104 16h14M126 20h20M110 24h10"/>
    <rect class="il-wood-dark il-ink" x="-4" y="2" width="40" height="106"/>
    <rect class="il-water il-ink il-thin" opacity="0.6" x="4" y="12" width="24" height="40" rx="2"/>
    <path class="il-light il-thin" d="M8 20l8-6M8 30l14-12"/>
    <rect class="il-metal il-ink il-thin" x="28" y="58" width="4" height="14" rx="2"/>
    <rect class="il-dark" x="36" y="2" width="10" height="106"/>
    <rect class="il-metal il-ink" x="46" y="2" width="7" height="106"/>
    <path class="il-white il-ink" opacity="0.95" d="M40 34C48 28 58 26 70 26c15 0 24 10 24 21 0 12-10 20-22 21-10 1-16 7-20 15-3 6-6 10-12 13z"/>
    <path class="il-line" d="M62 36l8 3M84 35l-7 3"/>
    <circle class="il-dark" cx="68" cy="43" r="2.8"/><circle class="il-dark" cx="80" cy="42" r="2.8"/>
    <circle class="il-white" cx="69" cy="42" r="0.9"/><circle class="il-white" cx="81" cy="41" r="0.9"/>
    <circle class="il-pink" opacity="0.7" cx="63" cy="50" r="4"/><circle class="il-pink" opacity="0.7" cx="85" cy="49" r="4"/>
    <circle class="il-pink il-ink il-thin" cx="89" cy="53" r="3.4"/><circle class="il-dark" cx="90" cy="53" r="1.5"/>
    <path class="il-line il-thin il-dash" d="M96 48q10-3 18 7M96 53q10 1 16 12M95 58q8 5 10 14"/>
    <path class="il-light il-thin" d="M104 40l4 4m0-4l-4 4M102 42h8M120 86l3 3m0-3l-3 3M119 87.5h5M96 76l3 3m0-3l-3 3"/>
    <path class="il-red il-ink" d="M106 48q0-6 6-6h40q6 0 6 6v56h-52z"/>
    <path class="il-line il-thin" opacity="0.4" d="M114 50v50M150 50v50"/>
    <path class="il-blue il-ink" d="M114 80q2-8 10-8h18q8 0 9 8l2 24h-40z"/>
    <path class="il-yellow il-ink il-thin" d="M118 74h26v6h-26zM120 80l-8 10 5 2 7-12z"/>
    <rect class="il-skin il-ink" x="124" y="66" width="12" height="10" rx="3"/>
    <path class="il-line il-thin" d="M125 70h1M128 72h1M126 74h1"/>
    <ellipse class="il-skin il-ink" cx="132" cy="56" rx="12" ry="13"/>
    <path class="il-earth-dark il-ink" d="M120 58c-2-10 2-16 10-16 6 0 10 2 12 6-6-1-10 2-12 6l-2 8z"/>
    <path class="il-line" d="M123 44l-3-9M129 42v-10M135 43l3-9M140 46l5-6"/>
    <circle class="il-white il-ink il-thin" cx="138" cy="55" r="4"/><circle class="il-dark" cx="139" cy="55" r="1.8"/>
    <path class="il-line il-thin" d="M134 48l7-1"/>
    <path class="il-skin il-ink il-thin" d="M143 56q4 3 1 6"/>
    <path class="il-white il-ink il-thin" d="M133 64h8v4h-8z"/>
    <path class="il-line il-thin" d="M135 64v4M137 64v4M139 64v4"/>
    <path class="il-line il-thin" d="M116 52q-3 4 0 8M112 50q-4 6 0 12M150 52q3 4 0 8"/>
    <g transform="rotate(-30 80 98)">
      <rect class="il-paper il-ink il-thin" x="72" y="94" width="16" height="9" rx="1"/>
      <path class="il-line il-thin il-dash" d="M83 95v7"/>
    </g>`,

  // A porcelain conductor figurine on Grandma's mantelpiece, glued-together crack on his arm, holds out his hand and
  // raises his signal disc: a speech bubble demands the ticket. Mantel clock and a framed train picture beside him.
  'rw.china-conductor': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-pink" opacity="0.5" d="M12 10l3 3-3 3-3-3zM40 10l3 3-3 3-3-3zM68 10l3 3-3 3-3-3zM12 40l3 3-3 3-3-3zM40 40l3 3-3 3-3-3zM26 25l3 3-3 3-3-3zM54 25l3 3-3 3-3-3zM26 55l3 3-3 3-3-3zM110 50l3 3-3 3-3-3zM138 50l3 3-3 3-3-3zM124 65l3 3-3 3-3-3zM152 65l3 3-3 3-3-3zM54 55l3 3-3 3-3-3z"/>
    <rect class="il-stone il-ink" x="10" y="98" width="140" height="24"/>
    <rect class="il-dark il-ink" x="40" y="104" width="80" height="18" rx="2"/>
    <path class="il-orange il-ink il-thin" d="M60 122c0-8 6-10 6-16 4 4 6 8 6 16zM84 122c0-6 4-8 4-12 3 3 5 6 5 12z"/>
    <rect class="il-wood-dark il-ink" x="-2" y="90" width="164" height="8"/>
    <path class="il-white il-ink il-thin" d="M56 90h48l-6 8h-36z"/>
    <path class="il-line il-thin" d="M64 94h2M72 94h2M80 94h2M88 94h2M96 94h2"/>
    <path class="il-wood il-ink" d="M14 90V70q0-10 14-10t14 10v20z"/>
    <circle class="il-white il-ink il-thin" cx="28" cy="72" r="8"/>
    <path class="il-line il-thin" d="M28 72v-5M28 72l3 2"/>
    <rect class="il-wood-dark il-ink il-thin" x="12" y="88" width="32" height="3"/>
    <g transform="rotate(-4 133 74)">
      <rect class="il-gold il-ink" x="116" y="60" width="34" height="28" rx="2"/>
      <rect class="il-sky il-ink il-thin" x="121" y="65" width="24" height="18"/>
      <path class="il-grass" d="M122 78h22v4h-22z"/>
      <path class="il-dark" d="M126 77h12v-6h-4v-3h-3v3h-5z"/>
      <circle class="il-smoke" cx="133" cy="67" r="2"/><circle class="il-smoke" cx="137" cy="66" r="1.6"/>
    </g>
    <path class="il-white il-ink" d="M58 90v-5h44v5z"/>
    <ellipse class="il-white il-ink" cx="80" cy="85" rx="22" ry="4"/>
    <rect class="il-gold" x="59" y="87" width="42" height="1.6"/>
    <rect class="il-white il-ink" x="70" y="68" width="8" height="16"/>
    <rect class="il-white il-ink" x="82" y="68" width="8" height="16"/>
    <path class="il-blue il-thin" d="M70 76h8M82 76h8"/>
    <ellipse class="il-dark il-ink il-thin" cx="73" cy="84" rx="5" ry="2.4"/><ellipse class="il-dark il-ink il-thin" cx="87" cy="84" rx="5" ry="2.4"/>
    <path class="il-blue il-ink" d="M66 72l2-30h24l2 30z"/>
    <path class="il-white il-ink il-thin" d="M72 42l8 8 8-8z"/>
    <circle class="il-gold il-ink il-thin" cx="80" cy="55" r="1.8"/><circle class="il-gold il-ink il-thin" cx="80" cy="62" r="1.8"/>
    <rect class="il-gold" x="67" y="66" width="26" height="2.4"/>
    <path class="il-light il-thin" d="M70 64q0-10 2-16"/>
    <path class="il-blue il-ink" d="M90 44l14 4-1 6-14-3z"/>
    <path class="il-line il-thin" d="M95 45l2 3-2 2 2 3"/>
    <ellipse class="il-white il-ink" cx="108" cy="51" rx="6" ry="3"/>
    <path class="il-blue il-ink" d="M70 44L58 32l4-4 12 12z"/>
    <path class="il-line" d="M58 30l-4-8"/>
    <circle class="il-white il-ink" cx="58" cy="29" r="3.4"/>
    <circle class="il-green il-ink" cx="52" cy="16" r="9"/>
    <circle class="il-white il-ink il-thin" cx="52" cy="16" r="4.5"/>
    <path class="il-light il-thin" d="M46 12a7 7 0 0 1 4-3"/>
    <circle class="il-white il-ink" cx="80" cy="32" r="11"/>
    <circle class="il-pink" cx="73" cy="36" r="2.6"/><circle class="il-pink" cx="87" cy="36" r="2.6"/>
    <path class="il-line il-thin" d="M72 27l6 2M88 27l-6 2"/>
    <circle class="il-dark" cx="76" cy="31" r="1.6"/><circle class="il-dark" cx="84" cy="31" r="1.6"/>
    <path class="il-wood-dark" d="M74 37q3-3 6 0 3-3 6 0-3 3-6 1-3 2-6-1z"/>
    <path class="il-line il-thin" d="M77 41h6"/>
    <rect class="il-blue il-ink" x="68" y="14" width="24" height="10" rx="2"/>
    <ellipse class="il-blue il-ink" cx="80" cy="14" rx="13" ry="3"/>
    <rect class="il-gold" x="68" y="20" width="24" height="2.4"/>
    <circle class="il-gold il-ink il-thin" cx="80" cy="17" r="2"/>
    <path class="il-dark il-ink" d="M67 24h26q-2 4-13 4t-13-4z"/>
    <path class="il-light il-thin" d="M71 16q4-2 8-2"/>
    <path class="il-yellow il-ink il-thin" d="M98 30l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5zM40 50l1 2 2 .3-1.5 1.5.3 2-1.8-1-1.8 1 .3-2-1.5-1.5 2-.3z"/>
    <path class="il-white il-ink" d="M114 6h38q6 0 6 6v20q0 6-6 6h-26l-12 8 3-8q-7 0-7-6V12q0-6 4-6z"/>
    <g transform="rotate(-8 128 22)">
      <rect class="il-paper il-ink il-thin" x="117" y="15" width="22" height="13" rx="1"/>
      <rect class="il-red" x="118" y="16" width="5" height="11"/>
      <path class="il-line il-thin il-dash" d="M133 16v11"/>
    </g>
    <path class="il-line il-thick" d="M145 14q0-4 4-4t4 4q0 3-4 5v3"/>
    <circle class="il-dark" cx="149" cy="27" r="1.8"/>`,

  // A smug pink blob of chewing gum sits on the platform; its roots reach deep down through the joints of the paving and
  // a sprout grows on its head. A sneaker is stuck fast in it, while its owner walks off in socks.
  'rw.platform-gum': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-metal il-ink" x="10" y="8" width="4" height="30"/>
    <rect class="il-dark il-ink" x="2" y="12" width="44" height="26" rx="2"/>
    <path class="il-yellow" d="M6 17h16v2H6zM26 17h16v2H26zM6 23h12v2H6zM26 23h14v2H26zM6 29h16v2H6zM26 29h10v2H26z"/>
    <path class="il-light il-thin" opacity="0.3" d="M60 20h40M110 34h40M70 40h20"/>
    <rect class="il-stone il-ink" x="-2" y="74" width="164" height="48"/>
    <rect class="il-white" x="-2" y="74" width="164" height="3"/>
    <path class="il-line il-thin" d="M-2 77h164"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 98h160M30 77v21M104 77v21M138 77v21M14 98v22M66 98v22M120 98v22"/>
    <path class="il-line il-thin" d="M60 76q-3 10-12 14t-10 16l-6 14M70 76q3 10-2 22t0 22M82 76q4 8 12 10t14 14l8 20M64 90l-8 2M92 86l4-6M70 108l-6 4M110 104l8-2M42 104l-8-2"/>
    <ellipse class="il-dark" opacity="0.2" cx="76" cy="76" rx="36" ry="3"/>
    <path class="il-pink il-ink" d="M42 76c-6-4-6-14 2-18-2-10 8-18 18-14 6-8 20-8 26 0 10-2 18 6 16 16 6 4 6 12 0 16z"/>
    <path class="il-light il-thin" d="M48 54q2-6 8-8M84 44q6 0 8 4"/>
    <circle class="il-grey" opacity="0.6" cx="96" cy="68" r="2"/><circle class="il-grey" opacity="0.6" cx="54" cy="70" r="1.6"/>
    <circle class="il-gold il-ink il-thin" cx="48" cy="64" r="4.5"/>
    <path class="il-line il-thin" d="M46 64h4"/>
    <circle class="il-white il-ink" cx="64" cy="56" r="5.5"/><circle class="il-white il-ink" cx="82" cy="55" r="5.5"/>
    <circle class="il-dark" cx="67" cy="57" r="2.4"/><circle class="il-dark" cx="85" cy="56" r="2.4"/>
    <path class="il-pink il-ink il-thin" d="M58 55a6 6 0 0 1 12-1zM76 54a6 6 0 0 1 12-1z"/>
    <path class="il-line" d="M62 66q11 7 22-2"/>
    <path class="il-line il-thin" d="M74 40v-8"/>
    <path class="il-green il-ink il-thin" d="M74 35c-7-5-12 0-12 2 5 3 9 2 12-2zM74 33c6-6 11-2 12 0-4 4-9 4-12 0z"/>
    <path class="il-white il-ink" d="M98 70h38q6 0 6 6H98z"/>
    <path class="il-red il-ink" d="M100 70v-10q0-6 6-6h8l4 6 10 2q8 2 8 8z"/>
    <path class="il-white il-ink il-thin" d="M106 54h8l4 6h-4z"/>
    <path class="il-line il-thin" d="M114 58l4 4M118 58l-2 5M120 60l3 3"/>
    <path class="il-pink il-ink il-thin" d="M98 62l8 2-8 3zM100 72l10-1-2 3z"/>
    <path class="il-pink il-ink" d="M96 66q4-2 6 4l-4 6h-4z"/>
    <path class="il-blue il-ink" d="M136 36q0-4 4-4h10q4 0 4 4l2 24h-22z"/>
    <path class="il-blue il-ink" d="M137 38l-6 16 4 1 6-14zM152 38l6 14-4 2-5-12z"/>
    <circle class="il-skin il-ink il-thin" cx="133" cy="56" r="2.6"/><circle class="il-skin il-ink il-thin" cx="157" cy="54" r="2.6"/>
    <path class="il-dark il-ink" d="M136 60h8l-1 10h-6zM146 60h8l4 9-6 3-5-8z"/>
    <path class="il-white il-ink" d="M137 69h6v3q4 0 4 3h-12q0-3 2-3z"/>
    <path class="il-white il-ink" d="M152 70l6-3 1 3q4-1 4 2l-8 3z" transform="rotate(-10 156 71)"/>
    <circle class="il-skin il-ink il-thin" cx="145.5" cy="74" r="1.4"/>
    <path class="il-red" d="M137 69h6v1.6h-6z"/>
    <circle class="il-skin il-ink" cx="145" cy="26" r="7"/>
    <path class="il-earth-dark il-ink il-thin" d="M138 25q0-8 7-8t7 7q-4-3-7-2t-7 3z"/>
    <path class="il-line il-thin" d="M142 28q2-1.5 4 0M148 27q1.5-1 3 0M144 31q3 2 6 0"/>
    <ellipse class="il-dark" cx="124" cy="22" rx="2.4" ry="1.8" transform="rotate(-20 124 22)"/>
    <path class="il-line il-thin" d="M126 21v-8l4 2"/>
    <path class="il-line il-thin" d="M30 54q-3-4 0-8t0-8M116 40q-3-4 0-8t0-8M24 60q-3-4 0-8"/>`,

  // A gang of angry sparrows lines the station-roof girder; three of them dive with open beaks at the croissant in a
  // traveller's hand. One is already flying off with a piece. Crumbs everywhere.
  'rw.sparrow-gang': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" opacity="0.2" x="0" y="0" width="160" height="30"/>
    <path class="il-line il-thin" d="M0 30L16 0l16 30L48 0l16 30L80 0l16 30L112 0l16 30L144 0l16 30"/>
    <rect class="il-metal il-ink" x="-2" y="30" width="164" height="6"/>
    <path class="il-line il-thin" opacity="0.6" d="M8 33h1M24 33h1M40 33h1M56 33h1M72 33h1M88 33h1M104 33h1M120 33h1M136 33h1M152 33h1"/>
    <path class="il-line il-thin" d="M58 12l-3-4M66 10V5M74 12l3-4M94 12l-3-4M102 10V5M110 12l3-4"/>
      <g transform="translate(14 24) scale(1 1)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M11-6.5l5 1.5-5 1.5z"/>
      </g>
      <g transform="translate(38 24) scale(-1 1)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M11-6.5l5 1.5-5 1.5z"/>
      </g>
      <g transform="translate(64 24) scale(1 1)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M10.5-8l6-1.5-4.5 3.5 4.5 3-6-.5z"/><path class="il-dark" d="M11-6.5l2.5-.3-2.5 1.5z"/>
      </g>
      <g transform="translate(100 24) scale(-1 1)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M10.5-8l6-1.5-4.5 3.5 4.5 3-6-.5z"/><path class="il-dark" d="M11-6.5l2.5-.3-2.5 1.5z"/>
      </g>
      <g transform="translate(124 24) scale(1 1)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M11-6.5l5 1.5-5 1.5z"/>
      </g>
      <g transform="translate(148 24) scale(-1 1)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M11-6.5l5 1.5-5 1.5z"/>
      </g>
      <g transform="translate(34 62) rotate(35) scale(1.25 1.25)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M10.5-8l6-1.5-4.5 3.5 4.5 3-6-.5z"/><path class="il-dark" d="M11-6.5l2.5-.3-2.5 1.5z"/>
      </g>
      <g transform="translate(80 52) rotate(80) scale(1.3 1.3)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M10.5-8l6-1.5-4.5 3.5 4.5 3-6-.5z"/><path class="il-dark" d="M11-6.5l2.5-.3-2.5 1.5z"/>
      </g>
      <g transform="translate(128 62) rotate(-35) scale(-1.25 1.25)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M10.5-8l6-1.5-4.5 3.5 4.5 3-6-.5z"/><path class="il-dark" d="M11-6.5l2.5-.3-2.5 1.5z"/>
      </g>
      <g transform="translate(20 94) rotate(-20) scale(-0.9 0.9)">
        <path class="il-wood-dark il-ink il-thin" d="M-7 0l-8 5 1-8z"/><ellipse class="il-wood il-ink" cx="0" cy="0" rx="9" ry="7"/><ellipse class="il-paper" cx="2" cy="3.5" rx="5" ry="2.6"/>
        <path class="il-wood-dark il-ink il-thin" d="M-7-2q7-3 11 1-4 6-11 3z"/><circle class="il-wood il-ink" cx="6" cy="-6" r="5.5"/>
        <path class="il-grey" d="M1-7.5a5.5 5.5 0 0 1 10.5-.5l-4 .5z"/><circle class="il-white" cx="8" cy="-5" r="2.2"/><circle class="il-dark" cx="8.6" cy="-4.6" r="1.1"/>
        <path class="il-line il-thin" d="M5.5-9l5 2.2"/><path class="il-gold il-ink il-thin" d="M11-6.5l5 1.5-5 1.5z"/>
      </g>
    <path class="il-gold il-ink il-thin" d="M8 84l5-2 2 4-5 2z"/>
    <path class="il-line il-thin" d="M30 96l8 2M28 102l8 0"/>
    <path class="il-blue il-ink" d="M136 120l-10-18 14-8 24 20v6z"/>
    <path class="il-white il-ink" d="M124 104l14-9 4 6-14 9z"/>
    <path class="il-gold il-ink" d="M45.2 115.4Q36.2 103.9 40.1 95.1Q38.4 83.2 48.4 79.2Q51.7 68.3 62.4 69.2Q69.0 60.9 78.0 66.0Q87.0 60.9 93.6 69.2Q104.3 68.3 107.6 79.2Q117.6 83.2 115.9 95.1Q119.8 103.9 110.8 115.4L110.0 110.9L107.2 106.9L104.0 103.6L100.6 101.0L97.2 99.1L93.8 97.8L90.5 97.0L87.5 96.8L84.7 96.9L82.2 97.2L80.0 97.6L78.0 98.0L76.0 97.6L73.8 97.2L71.3 96.9L68.5 96.8L65.5 97.0L62.2 97.8L58.8 99.1L55.4 101.0L52.0 103.6L48.8 106.9L46.0 110.9z"/>
    <path class="il-line il-thin" d="M53.6 101.1Q46.4 100.5 40.1 95.1M64.0 96.4Q54.9 89.7 48.4 79.2M72.2 96.1Q65.5 83.9 62.4 69.2M78.0 97.0Q78.0 82.0 78.0 66.0M83.8 96.1Q90.5 83.9 93.6 69.2M92.0 96.4Q101.1 89.7 107.6 79.2M102.4 101.1Q109.6 100.5 115.9 95.1"/>
    <path class="il-light il-thin" d="M41.6 91.0Q41.6 85.6 46.8 83.9M51.5 76.9Q53.8 71.7 59.4 72.1M65.6 68.8Q69.7 64.8 74.9 67.2M81.1 67.2Q86.3 64.8 90.4 68.8"/>
    <path class="il-skin il-ink" d="M106 104c-2-6 2-10 8-10h8c6 0 8 6 6 10l-4 6h-14z"/>
    <rect class="il-skin il-ink" x="102" y="92" width="14" height="6" rx="3" transform="rotate(-30 109 95)"/>
    <path class="il-line il-thin" d="M112 104h10M114 100h9"/>
    <circle class="il-gold il-ink il-thin" cx="62" cy="70" r="1.8"/><circle class="il-gold il-ink il-thin" cx="98" cy="72" r="1.6"/>
    <circle class="il-gold il-ink il-thin" cx="50" cy="108" r="1.6"/><circle class="il-gold il-ink il-thin" cx="88" cy="112" r="1.8"/>
    <circle class="il-gold il-ink il-thin" cx="70" cy="110" r="1.4"/>
    <path class="il-line il-thin" d="M18 44l6 4M144 44l-6 4M80 32v0"/>`,
  // A grinning dandelion weed has shot up between the sleepers, taller than the tiny train crawling up on the horizon
  // (a snail overtakes it). Its leaves have tangled a pair of shoes into the track bed.
  'rw.sleeper-weed': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-smoke" opacity="0.5" cx="30" cy="18" r="8"/><circle class="il-smoke" opacity="0.5" cx="40" cy="16" r="10"/><circle class="il-smoke" opacity="0.5" cx="50" cy="20" r="6"/>
    <rect class="il-grass il-ink" x="-2" y="44" width="164" height="78"/>
    <path class="il-green il-ink il-thin" d="M10 60l2-6 2 6M24 74l2-7 2 7M140 64l2-6 2 6M150 90l2-7 2 7M6 100l2-7 2 7M132 106l2-6 2 6"/>
    <path class="il-stone il-ink" d="M66 44h28l56 76H10z"/>
    <path class="il-line il-thin" opacity="0.3" d="M60 70l2 1M100 66l2 1M40 100l2 1M120 104l2 1M90 112l2 1M64 112l2 1"/>
    <rect class="il-wood-dark il-ink il-thin" x="64.3" y="50" width="31.4" height="2"/>
    <rect class="il-wood-dark il-ink il-thin" x="60.6" y="56" width="38.8" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="55.6" y="64" width="48.8" height="4"/>
    <rect class="il-wood-dark il-ink il-thin" x="48.7" y="75" width="62.6" height="6"/>
    <rect class="il-wood-dark il-ink il-thin" x="39.3" y="90" width="81.4" height="8"/>
    <rect class="il-wood-dark il-ink il-thin" x="26.8" y="108" width="106.4" height="10"/>
    <path class="il-metal il-ink il-thin" d="M73 44h2l-31 76h-6zM85 44h2l35 76h-6z"/>
    <rect class="il-red il-ink il-thin" x="74" y="34" width="12" height="9" rx="1"/>
    <rect class="il-dark" x="76" y="30" width="3" height="4"/>
    <circle class="il-white" cx="78" cy="37" r="1.4"/><circle class="il-white" cx="82" cy="37" r="1.4"/>
    <circle class="il-smoke" cx="76" cy="26" r="2.4"/><circle class="il-smoke" cx="73" cy="22" r="1.8"/>
    <path class="il-beard il-ink il-thin" d="M98 92h8q2 0 2 2h-10z"/>
    <circle class="il-gold il-ink il-thin" cx="102" cy="89" r="3.4"/>
    <path class="il-line il-thin" d="M107 92l2-3M96 90h-3M95 87h-2"/>
    <path class="il-white il-ink" d="M12 108h32q2-6-4-8l-10-2-4-6h-8q-6 0-6 6z"/>
    <path class="il-red il-ink" d="M14 104v-8q0-4 4-4h6l4 6 10 2q4 1 5 4z"/>
    <path class="il-white il-ink" d="M30 118h32q2-6-4-8l-10-2-4-6h-8q-6 0-6 6z"/>
    <path class="il-red il-ink" d="M32 114v-8q0-4 4-4h6l4 6 10 2q4 1 5 4z"/>
    <path class="il-line il-thin" d="M24 96l3 3M27 95l3 3M42 106l3 3M45 105l3 3"/>
    <g transform="scale(0.5)">
      <path class="il-hose" d="M140 176c-30-6-60-10-80 0-14 8-22 20-14 26 10 6 18-14 30-16M130 188c-20 6-36 16-42 30-4 8 6 14 14 6s16-14 22-8"/>
    </g>
    <path class="il-green il-ink" d="M78 92q-4-22-22-36l6-3q18 14 20 39z"/>
    <path class="il-green il-ink" d="M80 92C66 92 52 86 42 74l8 1-3-7 8 3-2-8 8 5 1-7 6 8 2-6 4 10z"/>
    <path class="il-green il-ink" d="M80 92c14 0 28-6 38-18l-8 1 3-7-8 3 2-8-8 5-1-7-6 8-2-6-4 10z"/>
    <path class="il-grass il-ink" d="M80 92c-6-8-12-14-22-16l6-2-4-4 6 1-1-5 6 4 2-5 4 7z"/>
    <path class="il-grass il-ink" d="M80 92c6-8 12-14 22-16l-6-2 4-4-6 1 1-5-6 4-2-5-4 7z"/>
    <path class="il-line il-thin" d="M52 78l20 10M108 78l-20 10"/>
    <g transform="translate(-26 -4)">
    <circle class="il-yellow il-ink" cx="80" cy="44" r="20"/>
    <path class="il-gold il-ink il-thin" d="M80 24l3 6-6 0zM100 44l-6 3 0-6zM60 44l6-3 0 6zM94 30l-3 7-4-4zM66 30l3 7 4-4zM94 58l-7-3 4-4zM66 58l7-3-4-4z"/>
    <circle class="il-gold il-ink il-thin" cx="80" cy="44" r="14"/>
    <path class="il-line" d="M70 36l7 3M90 36l-7 3"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="42" r="3.6"/><circle class="il-dark" cx="75" cy="42.5" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="86" cy="42" r="3.6"/><circle class="il-dark" cx="87" cy="42.5" r="1.7"/>
    <path class="il-dark il-ink il-thin" d="M72 49q8 7 16 0z"/>
    <path class="il-white" d="M75 49.5h2v2h-2zM83 49.5h2v2h-2z"/>
    <path class="il-light il-thin" d="M66 34a16 16 0 0 1 8-6"/>
    </g>`,

  // Cross-section of a railway embankment: deep inside, a mole in a nightcap yawns hugely in its chamber, digging with
  // a teaspoon. Tunnels riddle the bank and the track on top has sagged; a little engine above looks down, worried.
  'rw.embankment-mole': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-smoke" opacity="0.5" cx="128" cy="14" r="7"/><circle class="il-smoke" opacity="0.5" cx="138" cy="12" r="9"/>
    <path class="il-grass il-ink" d="M-6 120L32 40h96l38 80z"/>
    <path class="il-earth il-ink" d="M4 120L36 48h88l32 72z"/>
    <path class="il-stone il-ink" d="M30 42l6-10h26q18 9 36 0h26l6 10z"/>
    <path class="il-earth-dark" d="M10 104q14-8 30-4l12-4 2 6-12 4q-16-4-30 4z"/>
    <path class="il-earth-dark" d="M146 100q-12-6-24-2l-6-4-2 6 8 4q12-4 22 2z"/>
    <path class="il-earth-dark" d="M58 54q-6 6-4 16l4 4 4-2-2-4q-2-8 2-12z"/>
    <path class="il-earth-dark" d="M110 54q8 8 2 18l-4 2-2-4 2-2q4-8-2-12z"/>
    <path class="il-line il-thin" opacity="0.35" d="M20 112l3 1M140 112l3 1M46 66l3 1M120 80l3 1M30 92l2 1M132 66l2 1"/>
    <circle class="il-stone il-ink il-thin" cx="26" cy="110" r="2.6"/><circle class="il-stone il-ink il-thin" cx="134" cy="76" r="2.2"/>
    <rect class="il-wood-dark il-ink il-thin" x="38" y="29" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="49" y="29" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="60" y="30" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="71" y="33" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="83" y="33" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="94" y="30" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="105" y="29" width="6" height="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="116" y="29" width="6" height="3"/>
    <path class="il-line il-thick" d="M34 28H62q18 9 36 0H126"/>
    <rect class="il-green il-ink" x="70" y="16" width="22" height="12" rx="2" transform="rotate(8 81 22)"/>
    <rect class="il-dark il-ink il-thin" x="86" y="8" width="4" height="7" transform="rotate(8 81 22)"/>
    <circle class="il-dark il-ink il-thin" cx="73" cy="29" r="3"/><circle class="il-dark il-ink il-thin" cx="88" cy="31" r="3"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="20" r="2.6"/><circle class="il-dark" cx="74.5" cy="21.5" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="21" r="2.6"/><circle class="il-dark" cx="80.5" cy="22.5" r="1.2"/>
    <path class="il-line il-thin" d="M71 16l4 2M83 17l-4 2"/>
    <ellipse class="il-water il-ink il-thin" cx="94" cy="20" rx="1.6" ry="2.4"/>
    <ellipse class="il-cave il-ink" cx="82" cy="86" rx="42" ry="24"/>
    <path class="il-earth il-ink il-thin" d="M48 104q4-6 10-4 4-4 8 0z"/>
    <ellipse class="il-grey il-ink" cx="82" cy="96" rx="24" ry="13"/>
    <ellipse class="il-grey il-ink" cx="82" cy="80" rx="17" ry="14"/>
    <path class="il-blue il-ink" d="M66 76q4-14 16-14 10 0 14 8-14-2-30 6z"/>
    <path class="il-blue il-ink" d="M93 68q10-2 14 6l-4 2q-2-4-8-4z"/>
    <circle class="il-white il-ink" cx="106" cy="77" r="4"/>
    <path class="il-light il-thin" d="M72 70l4-3M86 66l4 1"/>
    <path class="il-line" d="M71 79q3-2 6 0M87 79q3-2 6 0"/>
    <ellipse class="il-water il-ink il-thin" cx="68" cy="83" rx="1.6" ry="2.4"/>
    <ellipse class="il-pink il-ink" cx="82" cy="84" rx="5" ry="3.4"/>
    <ellipse class="il-dark il-ink" cx="82" cy="93" rx="8" ry="6"/>
    <ellipse class="il-pink" cx="82" cy="96" rx="4.5" ry="2.2"/>
    <path class="il-white" d="M79 87h2v2h-2zM83 87h2v2h-2z"/>
    <path class="il-pink il-ink" d="M62 82q-10-6-12-16l4 0 1-4 3 3 3-3 0 5q2 8 6 10z"/>
    <path class="il-pink il-ink" d="M100 92q8-2 12 2l-2 6q-4-2-8 0z"/>
    <path class="il-metal il-ink il-thin" d="M110 96l10-12 2 2-10 12z"/>
    <ellipse class="il-metal il-ink il-thin" cx="122" cy="82" rx="3.4" ry="4.4" transform="rotate(40 122 82)"/>
    <path class="il-earth-dark" d="M120 82a2.4 2.4 0 0 1 3-2l1 2z"/>
    <path class="il-line il-thin" d="M114 64h5l-5 5h5M120 56h6l-6 6h6"/>`,

  // A fat little silverfish in a napkin bib sits on the paper jam spilling out of the ticket machine and munches a
  // ticket like a biscuit, bite marks and all. The machine's screen shows only an alarm triangle.
  'rw.ticket-silverfish': `
    <rect class="il-blue" x="0" y="0" width="160" height="120"/>
    <rect class="il-metal il-ink" x="6" y="6" width="148" height="44" rx="4"/>
    <rect class="il-teal il-ink" x="12" y="11" width="56" height="34" rx="3"/>
    <path class="il-yellow il-ink il-thin" d="M40 16l10 18H30z"/>
    <path class="il-line il-thick" d="M40 22v6"/><circle class="il-dark" cx="40" cy="31" r="1.2"/>
    <path class="il-light il-thin" d="M16 40h14M52 40h12"/>
    <rect class="il-white il-ink il-thin" x="78" y="12" width="9" height="7" rx="1.5"/><rect class="il-white il-ink il-thin" x="90" y="12" width="9" height="7" rx="1.5"/><rect class="il-white il-ink il-thin" x="102" y="12" width="9" height="7" rx="1.5"/>
    <rect class="il-white il-ink il-thin" x="78" y="22" width="9" height="7" rx="1.5"/><rect class="il-white il-ink il-thin" x="90" y="22" width="9" height="7" rx="1.5"/><rect class="il-white il-ink il-thin" x="102" y="22" width="9" height="7" rx="1.5"/>
    <rect class="il-green il-ink il-thin" x="78" y="32" width="9" height="7" rx="1.5"/><rect class="il-white il-ink il-thin" x="90" y="32" width="9" height="7" rx="1.5"/><rect class="il-red il-ink il-thin" x="102" y="32" width="9" height="7" rx="1.5"/>
    <rect class="il-grey il-ink" x="122" y="12" width="24" height="30" rx="3"/>
    <rect class="il-dark" x="132" y="16" width="4" height="16" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="134" cy="37" r="2.4"/>
    <path class="il-line il-thin" d="M140 34l4-4M141 38l5 0"/>
    <rect class="il-dark il-ink" x="26" y="56" width="108" height="9" rx="3"/>
    <path class="il-paper il-ink il-thin" d="M40 60l14 2-2 14-14-3zM60 60h16l-2 16-14-2zM92 60l16-1 2 14-16 2zM112 60l12 4-4 12-12-4z"/>
    <path class="il-paper il-ink il-thin" d="M10 110l14-14 10 10-14 14zM28 96l20-4 4 16-20 4zM56 92l24 2-2 18-24-2zM84 94l22-2 4 18-24 2zM110 96l18 6-6 16-18-6zM130 104l20-4 4 18-24 2zM2 120l10-10 20 10z"/>
    <path class="il-red" d="M30 97l4-1 3 15-4 1zM88 95l4-.4 1.6 17.6-4 .4zM132 104l4-1 3 17-4 .8z"/>
    <path class="il-line il-thin il-dash" d="M70 95l-2 15M120 100l-5 14"/>
    <ellipse class="il-dark" opacity="0.25" cx="86" cy="96" rx="40" ry="5"/>
    <path class="il-line il-thin" d="M126 80l20-10M126 82l22 2M125 85l16 12"/>
    <path class="il-line il-thin" d="M56 92l-4 6M66 94l-2 6M78 95v6M90 95l2 6M102 93l3 5M112 90l4 5"/>
    <path class="il-metal il-ink" d="M44 80c0-12 10-18 22-18h22c18 0 30 8 38 18-8 8-20 14-38 14H66c-12 0-22-2-22-14z"/>
    <path class="il-line il-thin" d="M66 63q-4 15 0 30M80 62q-4 16 0 32M94 63q-4 15 0 29M107 66q-3 12 0 24M118 72q-2 8 0 14"/>
    <path class="il-light il-thin" d="M58 70q20-6 50-2"/>
    <path class="il-line il-thin" d="M50 66q-8-18-26-22M58 64q2-18 18-26"/>
    <circle class="il-white il-ink" cx="52" cy="72" r="5.5"/><circle class="il-dark" cx="51" cy="73" r="2.6"/>
    <circle class="il-white il-ink" cx="63" cy="70" r="5.5"/><circle class="il-dark" cx="62" cy="71" r="2.6"/>
    <path class="il-white il-ink il-thin" d="M48 84l18-2-8 12z"/>
    <circle class="il-red" cx="54" cy="86" r="1"/><circle class="il-red" cx="59" cy="85" r="1"/><circle class="il-red" cx="57" cy="89" r="1"/>
    <path class="il-dark il-ink il-thin" d="M46 80q4 4 8 1z"/>
    <path class="il-paper il-ink il-thin" d="M18 72h24a2.6 2.6 0 0 0 0 5a2.6 2.6 0 0 0 0 5a2.6 2.6 0 0 0 0 5H18z"/>
    <rect class="il-red" x="20" y="73" width="4" height="13"/>
    <path class="il-line il-thin" d="M27 76h8M27 80h10M27 84h6"/>
    <path class="il-line il-thin" d="M48 84l-6-2M48 86l-6 1"/>
    <path class="il-paper il-ink il-thin" d="M36 92l3-1 1 3-3 1zM44 98l2-2 2 2-2 2z"/>`,

  // A smug concrete planter with a bushy plant stands exactly in front of the open train door; a passenger stepping out
  // trips over it and flies headfirst along the platform, hat and briefcase flying ahead of him.
  'rw.platform-planter': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-metal il-ink" x="-2" y="-2" width="164" height="9"/>
    <path class="il-light il-thin" opacity="0.4" d="M70 24h30M110 16h40M120 36h20"/>
    <rect class="il-red il-ink" x="-6" y="12" width="56" height="90" rx="4"/>
    <rect class="il-white" x="-6" y="62" width="56" height="4"/>
    <rect class="il-water il-ink il-thin" opacity="0.7" x="0" y="22" width="18" height="22" rx="3"/>
    <rect class="il-dark il-ink" x="24" y="24" width="24" height="76"/>
    <rect class="il-red il-ink il-thin" x="20" y="24" width="4" height="76"/>
    <rect class="il-metal il-ink il-thin" x="22" y="98" width="30" height="4"/>
    <circle class="il-yellow il-ink il-thin" cx="36" cy="18" r="2.6"/>
    <rect class="il-stone il-ink" x="-2" y="102" width="164" height="20"/>
    <rect class="il-yellow" x="-2" y="106" width="164" height="3"/>
    <path class="il-line il-thin" opacity="0.4" d="M40 109l-4 11M90 109l-2 11M140 109l2 11"/>
    <ellipse class="il-dark" opacity="0.25" cx="68" cy="102" rx="20" ry="2.5"/>
    <path class="il-green il-ink" d="M52 76c-8-4-6-16 2-16 0-8 10-12 16-8 6-6 18-2 16 8 8 2 8 14 0 16z"/>
    <path class="il-grass il-thin il-ink" d="M58 66l4 2M70 58l2 4M78 64l4-2"/>
    <circle class="il-pink il-ink il-thin" cx="62" cy="60" r="2"/><circle class="il-pink il-ink il-thin" cx="80" cy="56" r="2"/><circle class="il-pink il-ink il-thin" cx="74" cy="68" r="2"/>
    <rect class="il-stone il-ink" x="48" y="74" width="40" height="6" rx="1"/>
    <path class="il-grey il-ink" d="M51 80h34l-2 22H53z"/>
    <path class="il-line il-thin" opacity="0.4" d="M55 84l2 2M80 96l2 2M60 98l1 1"/>
    <path class="il-line il-thin" d="M56 84l6 1M80 84l-6 1"/>
    <circle class="il-white il-ink il-thin" cx="61" cy="89" r="3.4"/><circle class="il-white il-ink il-thin" cx="75" cy="89" r="3.4"/>
    <circle class="il-dark" cx="62" cy="90" r="1.6"/><circle class="il-dark" cx="76" cy="90" r="1.6"/>
    <path class="il-grey il-thin il-ink" d="M57.6 89a3.4 3.4 0 0 1 6.8 0zM71.6 89a3.4 3.4 0 0 1 6.8 0z"/>
    <path class="il-line" d="M62 96q6 3 13-1"/>
    <path class="il-dark il-ink" d="M84 72l18-12 4 5-18 12z"/>
    <path class="il-dark il-ink" d="M88 78l16-10 3 5-16 10z"/>
    <ellipse class="il-wood-dark il-ink" cx="85" cy="74" rx="5" ry="3.4" transform="rotate(-30 85 74)"/>
    <ellipse class="il-wood-dark il-ink" cx="89" cy="80" rx="5" ry="3.4" transform="rotate(-30 89 80)"/>
    <path class="il-blue il-ink" d="M100 56h26q6 0 6 6v6q0 6-6 6h-26q-4-8 0-18z"/>
    <path class="il-white il-ink il-thin" d="M124 58l6 3-6 3z"/>
    <path class="il-blue il-ink" d="M124 58l18-14 4 5-17 14z"/>
    <path class="il-blue il-ink" d="M126 70l20-6 2 6-20 5z"/>
    <circle class="il-skin il-ink" cx="145" cy="45" r="4"/><circle class="il-skin il-ink" cx="149" cy="67" r="4"/>
    <circle class="il-skin il-ink" cx="139" cy="62" r="8"/>
    <path class="il-earth-dark il-ink il-thin" d="M132 58q2-8 10-7-6 3-6 9z"/>
    <circle class="il-white il-ink il-thin" cx="141" cy="59" r="2.6"/><circle class="il-dark" cx="141.8" cy="59.4" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="146" cy="61" r="2.2"/><circle class="il-dark" cx="146.6" cy="61.4" r="1"/>
    <ellipse class="il-dark" cx="143" cy="67" rx="2" ry="2.6"/>
    <path class="il-dark il-ink" d="M114 36q0-8 8-8t8 8z"/><path class="il-dark il-ink" d="M110 36h24" />
    <g transform="rotate(20 146 22)">
      <rect class="il-wood-dark il-ink" x="136" y="16" width="20" height="13" rx="2"/>
      <path class="il-line il-thin" d="M142 16v-3h8v3"/>
    </g>
    <path class="il-line il-thin" d="M96 52l-8-4M94 62h-10M106 48l-4-6"/>
    <path class="il-yellow il-ink il-thin" d="M92 64l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5zM100 82l1 2 2 .3-1.5 1.5.3 2-1.8-1-1.8 1 .3-2-1.5-1.5 2-.3z"/>`,

  // Two giant spinning brushes with googly eyes and big grins scrub a startled traveller as if he were a carriage:
  // foam on his head, dizzy spiral eyes, bubbles everywhere, water raining down from the spray bar.
  'rw.train-wash': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M0 60h160M40 0v100M120 0v100"/>
    <rect class="il-stone il-ink" x="-2" y="100" width="164" height="22"/>
    <ellipse class="il-water il-ink il-thin" opacity="0.7" cx="80" cy="108" rx="40" ry="5"/>
    <rect class="il-metal il-ink" x="-2" y="2" width="164" height="7"/>
    <path class="il-water-line" d="M64 12v34M72 12v26M80 12v20M88 12v26M96 12v34"/>
    <rect class="il-metal il-ink" x="27" y="8" width="6" height="6"/><rect class="il-metal il-ink" x="127" y="8" width="6" height="6"/>
    <path class="il-blue il-ink" d="M8 16H52l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6H8l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6z"/>
    <path class="il-blue il-ink" d="M108 16H152l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6l4 6 -4 6H108l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6l-4 -6 4 -6z"/>
    <rect class="il-metal il-ink" x="6" y="12" width="48" height="6" rx="2"/>
    <rect class="il-metal il-ink" x="106" y="12" width="48" height="6" rx="2"/>
    <path class="il-light il-thin" d="M12 28q18 5 36 0M12 70q18 5 36 0M12 84q18 5 36 0M112 28q18 5 36 0M112 70q18 5 36 0M112 84q18 5 36 0"/>
    <path class="il-line il-thin" d="M14 94q16 6 32 0l-4-3M146 94q-16 6-32 0l4-3"/>
    <circle class="il-white il-ink" cx="22" cy="40" r="7"/><circle class="il-dark" cx="25" cy="38" r="3"/>
    <circle class="il-white il-ink" cx="38" cy="40" r="6"/><circle class="il-dark" cx="36" cy="43" r="2.6"/>
    <path class="il-dark il-ink" d="M18 52q12 12 24 0z"/><path class="il-white" d="M24 53h3v3h-3zM33 53h3v3h-3z"/>
    <circle class="il-white il-ink" cx="122" cy="40" r="6"/><circle class="il-dark" cx="124" cy="42" r="2.6"/>
    <circle class="il-white il-ink" cx="138" cy="40" r="7"/><circle class="il-dark" cx="135" cy="38" r="3"/>
    <path class="il-dark il-ink" d="M118 52q12 12 24 0z"/><path class="il-white" d="M124 53h3v3h-3zM133 53h3v3h-3z"/>
    <path class="il-skin il-ink" d="M66 66l-8-16 4-2 9 15zM94 66l8-16-4-2-9 15z"/>
    <circle class="il-skin il-ink" cx="59" cy="47" r="3.4"/><circle class="il-skin il-ink" cx="101" cy="47" r="3.4"/>
    <path class="il-blue il-ink" d="M70 84h20l2 18h-8l-4-10-4 10h-8z"/>
    <ellipse class="il-dark il-ink" cx="72" cy="102" rx="6" ry="2.6"/><ellipse class="il-dark il-ink" cx="88" cy="102" rx="6" ry="2.6"/>
    <path class="il-yellow il-ink" d="M68 64h24l-2 22H70z"/>
    <path class="il-line il-thin" d="M72 72l3 2M84 70l3-2M78 80l2 2"/>
    <circle class="il-skin il-ink" cx="80" cy="54" r="10"/>
    <path class="il-earth-dark il-ink il-thin" d="M70 52q0-8 10-9 10 1 10 9l-3-4-2 4-3-5-2 5-3-5-2 5z"/>
    <path class="il-line il-thin" d="M73 55a2.4 2.4 0 1 1 2.4 2.4M83 55a2.4 2.4 0 1 1 2.4 2.4"/>
    <path class="il-line il-thin" d="M75 61q2.5-2 5 0t5 0"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="42" r="5"/><circle class="il-white il-ink il-thin" cx="82" cy="40" r="6"/><circle class="il-white il-ink il-thin" cx="88" cy="44" r="4"/>
    <circle class="il-white il-ink il-thin" opacity="0.85" cx="62" cy="76" r="4"/><circle class="il-white il-ink il-thin" opacity="0.85" cx="98" cy="70" r="5"/>
    <circle class="il-white il-ink il-thin" opacity="0.85" cx="58" cy="92" r="3"/><circle class="il-white il-ink il-thin" opacity="0.85" cx="102" cy="88" r="3.4"/>
    <circle class="il-white il-ink il-thin" opacity="0.85" cx="66" cy="28" r="3"/><circle class="il-white il-ink il-thin" opacity="0.85" cx="96" cy="26" r="2.4"/>
    <circle class="il-white il-ink il-thin" opacity="0.85" cx="104" cy="104" r="2.6"/><circle class="il-white il-ink il-thin" opacity="0.85" cx="54" cy="106" r="2.4"/>`,

  // A loud man sprawls over three seats: his bag on one, his coat on the other, arms spread wide, phone at his ear,
  // laughing loudly. A tired passenger stands next to the empty-but-taken seats, hanging on the strap.
  'rw.seat-hog': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="6" y="8" width="38" height="24" rx="5"/><rect class="il-sky il-ink" x="58" y="8" width="38" height="24" rx="5"/><rect class="il-sky il-ink" x="110" y="8" width="38" height="24" rx="5"/>
    <path class="il-grass" d="M7 26q10-6 18-2t18-2v9H7zM59 26q10-6 18-2t18-2v9H59zM111 26q10-6 18-2t18-2v9h-36z"/>
    <path class="il-line il-thin" d="M0 38h160"/>
    <rect class="il-grey il-ink" x="-2" y="104" width="164" height="18"/>
    <rect class="il-red il-ink" x="4" y="44" width="38" height="46" rx="6"/>
    <rect class="il-red il-ink" x="44" y="44" width="38" height="46" rx="6"/>
    <rect class="il-red il-ink" x="84" y="44" width="38" height="46" rx="6"/>
    <rect class="il-white il-ink il-thin" x="10" y="44" width="26" height="7" rx="2"/><rect class="il-white il-ink il-thin" x="50" y="44" width="26" height="7" rx="2"/><rect class="il-white il-ink il-thin" x="90" y="44" width="26" height="7" rx="2"/>
    <rect class="il-red il-ink" x="2" y="84" width="122" height="12" rx="4"/>
    <path class="il-line il-thin" d="M43 84v12M83 84v12"/>
    <rect class="il-dark il-ink" x="8" y="96" width="6" height="8"/><rect class="il-dark il-ink" x="112" y="96" width="6" height="8"/>
    <path class="il-green il-ink" d="M8 84q-2-20 14-20h4q14 0 14 20z"/>
    <path class="il-line il-thin" d="M14 62q8-10 16 0M10 74h28"/>
    <path class="il-yellow il-ink il-thin" d="M20 72h8v5h-8z"/>
    <path class="il-orange il-ink" d="M88 50q12-6 30 0l2 34h-8l-2-14-4 14H98l-4-14-2 14h-6z"/>
    <path class="il-orange il-ink il-thin" d="M98 54l5 8 5-8"/>
    <circle class="il-dark" cx="103" cy="66" r="1.4"/><circle class="il-dark" cx="103" cy="72" r="1.4"/>
    <path class="il-blue il-ink" d="M52 84l-12 16 8 4 14-14zM74 84l14 16-8 4-14-14z"/>
    <ellipse class="il-dark il-ink" cx="42" cy="104" rx="7" ry="3.4"/><ellipse class="il-dark il-ink" cx="86" cy="104" rx="7" ry="3.4"/>
    <path class="il-yellow il-ink" d="M84 50q10-2 22 4l-2 6q-12-4-20-2zM48 62q-8-6-14-14l-6 4q6 10 16 16z"/>
    <circle class="il-skin il-ink" cx="108" cy="58" r="4"/>
    <ellipse class="il-yellow il-ink" cx="64" cy="76" rx="21" ry="16"/>
    <path class="il-light il-thin" d="M50 70q2-6 8-8"/>
    <circle class="il-skin il-ink" cx="64" cy="48" r="13"/>
    <path class="il-earth-dark il-ink il-thin" d="M52 44q2-10 12-10t12 8q-6-4-12-3t-12 5z"/>
    <path class="il-line" d="M55 45q3-3 6 0M67 45q3-3 6 0"/>
    <path class="il-line il-thin" d="M54 40l7 1M74 40l-7 1"/>
    <path class="il-dark il-ink" d="M56 51q8 12 16 0z"/>
    <path class="il-pink" d="M60 57q4-3 8 0q-4 3-8 0z"/>
    <path class="il-white" d="M58 51.5h12v2H58z"/>
    <rect class="il-dark il-ink" x="44" y="40" width="7" height="14" rx="2"/>
    <circle class="il-skin il-ink" cx="50" cy="52" r="4"/>
    <path class="il-line il-thin" d="M38 32l-4-4M40 44h-6M80 30l4-6M84 38l6-2"/>
    <path class="il-line" d="M78 50q4 2 0 6M82 48q6 4 0 10"/>
    <path class="il-line il-thin" d="M142 38v8"/><circle class="il-line il-thin" cx="142" cy="49" r="3"/>
    <path class="il-purple il-ink" d="M132 66q0-6 6-6h8q6 0 6 6v32h-20z"/>
    <path class="il-purple il-ink" d="M146 64l-2-14 4-1 3 15z"/>
    <circle class="il-skin il-ink" cx="145" cy="49" r="3"/>
    <rect class="il-dark il-ink" x="134" y="96" width="7" height="8"/><rect class="il-dark il-ink" x="143" y="96" width="7" height="8"/>
    <circle class="il-skin il-ink" cx="138" cy="54" r="7"/>
    <path class="il-grey il-ink il-thin" d="M131 52q0-7 7-7t7 6q-4-3-7-2t-7 3z"/>
    <path class="il-line il-thin" d="M134 54h3M139 54h3M135 59h5"/>
    <ellipse class="il-water il-ink il-thin" cx="130" cy="50" rx="1.6" ry="2.4"/>`,
  // Frontal view of a tunnel-boring machine stuck deep in the rock: the cutter head has a tired face with bags under its
  // eyes and a sheepish smile, cobwebs hang from it, torn-off calendar pages pile up, and its robot arm hands you a very
  // long invoice.
  'rw.tunnel-borer': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.3" d="M0 0h40L28 20 0 26zM160 0h-44l14 18 30 8zM0 104V80l20 10 6 14zM160 104V84l-16 8-4 12z"/>
    <path class="il-light il-thin" opacity="0.3" d="M10 40l8 6M150 50l-8 4M16 70l-6 4M146 72l6 4"/>
    <path class="il-light il-thin" d="M0 0l28 0M0 0l26 12M0 0l16 22M0 0l0 28M8 0q2 6-3 8M16 0q4 10-7 14M22 0q4 16-12 22"/>
    <rect class="il-earth il-ink" x="-2" y="104" width="164" height="18"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(0.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(22.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(45.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(67.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(90.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(112.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(135.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(157.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(180.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(202.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(225.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(247.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(270.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(292.5 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(315.0 80 56)"/>
    <rect class="il-grey il-ink il-thin" x="76.5" y="5" width="7" height="8" rx="1" transform="rotate(337.5 80 56)"/>
    <circle class="il-yellow il-ink" cx="80" cy="56" r="47"/>
    <path class="il-dark" opacity="0.5" d="M40 82l-6 4M120 82l6 4M44 30l-6-4M116 30l6-4"/>
    <circle class="il-metal il-ink il-thick" cx="80" cy="56" r="40"/>
    <rect class="il-grey il-ink" x="76" y="17" width="8" height="22" rx="2" transform="rotate(30 80 56)"/>
    <rect class="il-grey il-ink" x="76" y="17" width="8" height="22" rx="2" transform="rotate(90 80 56)"/>
    <rect class="il-grey il-ink" x="76" y="17" width="8" height="22" rx="2" transform="rotate(150 80 56)"/>
    <rect class="il-grey il-ink" x="76" y="17" width="8" height="22" rx="2" transform="rotate(210 80 56)"/>
    <rect class="il-grey il-ink" x="76" y="17" width="8" height="22" rx="2" transform="rotate(270 80 56)"/>
    <rect class="il-grey il-ink" x="76" y="17" width="8" height="22" rx="2" transform="rotate(330 80 56)"/>
    <circle class="il-dark il-ink il-thin" cx="93.0" cy="33.5" r="2.6"/><circle class="il-dark il-ink il-thin" cx="97.0" cy="26.6" r="2.6"/><circle class="il-dark il-ink il-thin" cx="106.0" cy="56.0" r="2.6"/><circle class="il-dark il-ink il-thin" cx="114.0" cy="56.0" r="2.6"/><circle class="il-dark il-ink il-thin" cx="93.0" cy="78.5" r="2.6"/><circle class="il-dark il-ink il-thin" cx="97.0" cy="85.4" r="2.6"/><circle class="il-dark il-ink il-thin" cx="67.0" cy="78.5" r="2.6"/><circle class="il-dark il-ink il-thin" cx="63.0" cy="85.4" r="2.6"/><circle class="il-dark il-ink il-thin" cx="54.0" cy="56.0" r="2.6"/><circle class="il-dark il-ink il-thin" cx="46.0" cy="56.0" r="2.6"/><circle class="il-dark il-ink il-thin" cx="67.0" cy="33.5" r="2.6"/><circle class="il-dark il-ink il-thin" cx="63.0" cy="26.6" r="2.6"/>
    <path class="il-line il-thin" d="M52 36l6 12M48 46l12 4M54 34q-3 8-6 10M58 40q-6 4-9 3"/>
    <circle class="il-yellow il-ink" cx="80" cy="56" r="18"/>
    <circle class="il-white il-ink il-thin" cx="73" cy="53" r="4.6"/><circle class="il-dark" cx="73" cy="55" r="2"/>
    <circle class="il-white il-ink il-thin" cx="87" cy="53" r="4.6"/><circle class="il-dark" cx="87" cy="55" r="2"/>
    <path class="il-yellow il-ink il-thin" d="M68.4 53a4.6 4.6 0 0 1 9.2 0zM82.4 53a4.6 4.6 0 0 1 9.2 0z"/>
    <path class="il-line il-thin" d="M69 60q4 2 8 0M83 60q4 2 8 0M68 46l7 1M92 46l-7 1"/>
    <path class="il-line" d="M72 66q4-3 8 0t8 0"/>
    <ellipse class="il-water il-ink il-thin" cx="97" cy="44" rx="2" ry="3"/>
    <path class="il-light il-thin" d="M52 30a36 36 0 0 1 14-9"/>
    <g transform="rotate(-12 18 104)"><rect class="il-paper il-ink il-thin" x="6" y="96" width="22" height="18"/><rect class="il-red" x="6" y="96" width="22" height="4"/></g>
    <g transform="rotate(10 30 106)"><rect class="il-paper il-ink il-thin" x="20" y="98" width="22" height="18"/><rect class="il-red" x="20" y="98" width="22" height="4"/></g>
    <g transform="rotate(-4 22 100)"><rect class="il-paper il-ink il-thin" x="10" y="90" width="22" height="18"/><rect class="il-red" x="10" y="90" width="22" height="4"/>
      <path class="il-line il-thin" opacity="0.5" d="M12 98h18M12 102h18M12 106h18M16 94v14M21 94v14M26 94v14"/></g>
    <g transform="rotate(25 26 66)"><rect class="il-paper il-ink il-thin" x="16" y="58" width="20" height="16"/><rect class="il-red" x="16" y="58" width="20" height="4"/></g>
    <path class="il-line il-thin" d="M10 60l-4-3M12 70l-6 2"/>
    <path class="il-yellow il-ink" d="M164 112l-24-26 6-6 22 24z"/>
    <path class="il-yellow il-ink" d="M142 84l-14-16 6-4 13 16z"/>
    <circle class="il-grey il-ink" cx="143" cy="83" r="5"/>
    <path class="il-paper il-ink il-thin" d="M114 66h20v38q0 6 6 6h6v6h-26q-6 0-6-6z"/>
    <circle class="il-paper il-ink il-thin" cx="146" cy="113" r="4"/><path class="il-line il-thin" d="M146 113a1.5 1.5 0 1 1 1.5 1.5"/>
    <path class="il-line il-thin" d="M118 72h8M118 77h12M118 82h6M118 87h12M118 92h8M118 97h12M118 102h12"/>
    <path class="il-line" d="M118 107h12"/>
    <path class="il-grey il-ink" d="M118 62h12l2 6h-4l-2-3h-4l-2 3h-4z"/>`,

  // A sly magpie has taken over the ticket counter: it struts on the ledge with a shiny ticket in its beak, winking.
  // Behind the glass, its nest is full of loot: coins, a key, a pocket watch, a spoon, a ring — all sparkling.
  'rw.ticket-magpie': `
    <rect class="il-wood" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="18" y="4" width="124" height="80" rx="3"/>
    <rect class="il-grey il-ink" x="24" y="10" width="112" height="70" rx="2"/>
    <rect class="il-wood-dark il-ink il-thin" x="90" y="70" width="46" height="4"/>
    <path class="il-line il-thin" opacity="0.3" d="M24 30h112M24 50h112"/>
    <g transform="translate(114 70) scale(1.25) translate(-114 -70)">
    <path class="il-wood-dark il-ink il-thin" d="M94 70q2-10 20-10t20 10z"/>
    <path class="il-line il-thin" d="M98 66l8 2M112 62l2 6M124 64l-6 4M100 70l-4-4M130 68l4-4"/>
    <circle class="il-gold il-ink il-thin" cx="104" cy="62" r="4"/><circle class="il-gold il-ink il-thin" cx="110" cy="58" r="3.4"/>
    <circle class="il-metal il-ink il-thin" cx="122" cy="58" r="5"/><path class="il-line il-thin" d="M122 58v-3M122 58l2 1"/><path class="il-line il-thin" d="M122 53v-3"/>
    <circle class="il-yellow il-ink il-thin" cx="114" cy="48" r="3"/><path class="il-yellow il-ink il-thin" d="M116 50l10 8 2-2-10-8z"/><path class="il-line il-thin" d="M124 55l2-3M121 53l2-3"/>
    <ellipse class="il-metal il-ink il-thin" cx="132" cy="56" rx="2.4" ry="3.4" transform="rotate(30 132 56)"/><path class="il-metal il-ink il-thin" d="M130 59l-6 8 1 1 6-8z"/>
    <circle class="il-line il-thin" cx="128" cy="64" r="2.4"/>
    <path class="il-yellow il-ink il-thin" d="M100 44l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5zM136 42l1 2 2 .3-1.5 1.5.3 2-1.8-1-1.8 1 .3-2-1.5-1.5 2-.3z"/>
    </g>
    <rect class="il-water" opacity="0.15" x="24" y="10" width="112" height="70"/>
    <path class="il-light il-thin" opacity="0.8" d="M30 34l20-20M34 44l30-30M114 30l18-18"/>
    <circle class="il-metal il-ink il-thin" cx="80" cy="40" r="8"/>
    <path class="il-line il-thin" d="M76 36v8M80 34v12M84 36v8"/>
    <rect class="il-wood-dark il-ink" x="-2" y="80" width="164" height="9"/>
    <path class="il-metal il-ink" d="M58 80h44l-4 6H62z"/>
    <path class="il-line il-thin" opacity="0.4" d="M10 96h50v18H10zM100 96h50v18h-50z"/>
    <g transform="translate(52 80) scale(1.2) translate(-52 -80)">
    <path class="il-dark il-ink" d="M36 70L6 84l2 5 32-12z"/>
    <path class="il-teal il-thin" d="M10 84l26-11 1 2-26 11z"/>
    <ellipse class="il-dark il-ink" cx="50" cy="64" rx="17" ry="12" transform="rotate(-20 50 64)"/>
    <path class="il-white il-ink" d="M44 70q8 6 20-4 2 8-6 12-10 2-14-8z"/>
    <path class="il-blue il-ink" d="M36 62q10-10 26-4-4 12-24 10z"/>
    <ellipse class="il-white" cx="48" cy="62" rx="6" ry="3" transform="rotate(-10 48 62)"/>
    <path class="il-line il-thin" d="M50 74l-2 7M56 74l2 7M44 81h8M54 81h8"/>
    <circle class="il-dark il-ink" cx="64" cy="46" r="10"/>
    <circle class="il-white il-ink il-thin" cx="67" cy="44" r="3.4"/><circle class="il-dark" cx="68" cy="44.6" r="1.6"/>
    <path class="il-dark il-ink il-thin" d="M63.6 44a3.4 3.4 0 0 1 6.8 0z"/>
    <path class="il-light il-thin" d="M62 40l8-1"/>
    <path class="il-grey il-ink" d="M72 43l12 3-12 4z"/>
    <g transform="rotate(-14 90 46)">
      <rect class="il-paper il-ink il-thin" x="80" y="40" width="22" height="12" rx="1"/>
      <rect class="il-red" x="81" y="41" width="4" height="10"/>
      <path class="il-line il-thin il-dash" d="M96 41v10"/><path class="il-line il-thin" d="M87 44h6M87 48h6"/>
    </g>
    </g>
    <path class="il-yellow il-ink il-thin" d="M112 16l2 4 4 .6-3 2.6.8 4-3.8-2-3.8 2 .8-4-3-2.6 4-.6z"/>
    <path class="il-light il-thin" d="M98 36l4-4M102 44h5"/>`,

  // A beetle clerk with spectacles and four busy arms beams behind the counter between two towering, wobbling stacks
  // of forms: one hand raises the rubber stamp, one holds up form 14, one points at the next form, one holds the pen.
  'rw.refund-bug': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-dark il-ink" x="62" y="4" width="36" height="11" rx="2"/>
    <path class="il-red" d="M66 8h6v3h-6zM76 8h6v3h-6zM86 8h6v3h-6z"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M0 60h160"/>
    <rect class="il-white il-ink il-thin" x="5" y="79" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="3" y="74" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="3" y="69" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="5" y="64" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="6" y="59" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="3" y="54" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="7" y="49" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="3" y="44" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="4" y="39" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="3" y="34" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="4" y="29" width="32" height="5"/>
    <g transform="rotate(4 138 84)">
    <rect class="il-white il-ink il-thin" x="125.0" y="79" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="124.0" y="74" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="121.0" y="69" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="123.0" y="64" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="123.0" y="59" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="125.0" y="54" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="121.0" y="49" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="121.0" y="44" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="125.0" y="39" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="126.4" y="34" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="125.8" y="29" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="127.2" y="24" width="32" height="5"/>
    <rect class="il-white il-ink il-thin" x="128.6" y="19" width="32" height="5"/>
    </g>
    <path class="il-line il-thin" d="M4 26l-2-4M40 30l4-3M120 8l-3-3M156 14l3-4"/>
    <path class="il-green il-ink" d="M60 58l-14-16 4-3 14 16z"/>
    <circle class="il-green il-ink" cx="47" cy="40" r="3.4"/>
    <rect class="il-wood-dark il-ink" x="42" y="22" width="5" height="12"/>
    <circle class="il-wood-dark il-ink" cx="44.5" cy="20" r="4.5"/>
    <rect class="il-red il-ink" x="37" y="33" width="15" height="6" rx="1"/>
    <path class="il-green il-ink" d="M100 58l10-18 4 2-10 18z"/>
    <g transform="rotate(8 116 30)">
      <rect class="il-white il-ink" x="104" y="14" width="24" height="30" rx="1"/>
      <path class="il-line il-thin" d="M108 19h16M108 23h12M108 37h16"/>
      <path class="il-white il-ink il-thin" d="M108 27h4v4h-4zM115 27h4v4h-4zM122 27h3v4h-3z"/>
    </g>
    <circle class="il-green il-ink" cx="111" cy="40" r="3.4"/>
    <ellipse class="il-green il-ink" cx="80" cy="68" rx="26" ry="22"/>
    <path class="il-line" d="M80 48v40"/>
    <path class="il-light il-thin" d="M62 60q2-8 10-10M86 52q6 0 10 6"/>
    <circle class="il-teal" cx="68" cy="72" r="3"/><circle class="il-teal" cx="92" cy="72" r="3"/><circle class="il-teal" cx="72" cy="82" r="2"/><circle class="il-teal" cx="88" cy="82" r="2"/>
    <path class="il-green il-ink" d="M58 76l-10 10 3 3 10-10z"/>
    <path class="il-green il-ink" d="M102 76l10 10-3 3-10-10z"/>
    <path class="il-line" d="M74 32q-4-12-12-14M86 32q4-12 12-14"/>
    <circle class="il-green il-ink il-thin" cx="62" cy="18" r="2.6"/><circle class="il-green il-ink il-thin" cx="98" cy="18" r="2.6"/>
    <ellipse class="il-green il-ink" cx="80" cy="42" rx="15" ry="12"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="40" r="5"/><circle class="il-white il-ink il-thin" cx="86" cy="40" r="5"/>
    <path class="il-line il-thin" d="M79 40h2M69 40l-4-2M91 40l4-2"/>
    <circle class="il-dark" cx="73" cy="41.5" r="1.8"/><circle class="il-dark" cx="85" cy="41.5" r="1.8"/>
    <path class="il-line il-thin" d="M69 33l6-1M91 33l-6-1"/>
    <path class="il-dark il-ink il-thin" d="M73 47q7 7 14 0z"/>
    <rect class="il-wood il-ink" x="-2" y="86" width="164" height="36"/>
    <rect class="il-wood-dark il-ink" x="-2" y="86" width="164" height="6"/>
    <circle class="il-green il-ink" cx="48" cy="88" r="3.4"/>
    <path class="il-green il-ink il-thin" d="M46 88l-6 4 1 1 7-3z"/>
    <circle class="il-green il-ink" cx="112" cy="88" r="3.4"/>
    <path class="il-blue il-ink il-thin" d="M114 86l8-12 2 1-8 12z"/>
    <g transform="rotate(-3 80 106)">
      <rect class="il-white il-ink" x="54" y="94" width="52" height="24" rx="1"/>
      <path class="il-line il-thin" d="M58 98h30M58 102h40M58 114h20"/>
      <path class="il-white il-ink il-thin" d="M58 106h4v4h-4zM66 106h4v4h-4zM74 106h4v4h-4zM82 106h4v4h-4zM90 106h4v4h-4z"/>
      <circle class="il-red" opacity="0.6" cx="96" cy="112" r="6"/><circle class="il-white" cx="96" cy="112" r="3.6"/>
    </g>`,

  // A grim freight train thunders past platform 1 without stopping, speed lines streaming; its slipstream whips a waiting
  // traveller off his feet so he flaps like a flag from a lamppost, while his hat sails off into the distance.
  'rw.passing-freight': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-smoke" opacity="0.5" cx="24" cy="14" r="7"/><circle class="il-smoke" opacity="0.5" cx="34" cy="12" r="9"/><circle class="il-smoke" opacity="0.5" cx="44" cy="15" r="6"/>
    <rect class="il-metal il-ink" x="-2" y="86" width="164" height="4"/>
    <rect class="il-teal il-ink" x="-10" y="36" width="52" height="46" rx="2"/>
    <path class="il-line il-thin" opacity="0.4" d="M2 38v42M14 38v42M26 38v42M38 38v42"/>
    <rect class="il-wood-dark il-ink" x="46" y="40" width="50" height="42" rx="2"/>
    <path class="il-line il-thin" opacity="0.5" d="M46 50h50M46 60h50M46 70h50"/>
    <rect class="il-dark" x="42" y="74" width="4" height="3"/><rect class="il-dark" x="96" y="74" width="5" height="3"/>
    <path class="il-orange il-ink" d="M100 30h42q14 0 18 14v38h-60z"/>
    <rect class="il-water il-ink il-thin" x="140" y="36" width="14" height="12" rx="2"/>
    <rect class="il-yellow il-ink il-thin" x="100" y="72" width="62" height="4"/>
    <rect class="il-metal il-ink il-thin" x="112" y="24" width="10" height="6" rx="1"/>
    <circle class="il-white il-ink" cx="116" cy="50" r="6.5"/><circle class="il-white il-ink" cx="132" cy="50" r="6.5"/>
    <circle class="il-dark" cx="119" cy="51" r="3"/><circle class="il-dark" cx="135" cy="51" r="3"/>
    <path class="il-orange il-ink" d="M108 40l14 6v-4zM140 40l-14 6v-4z"/>
    <rect class="il-dark il-ink" x="112" y="60" width="26" height="9" rx="2"/>
    <path class="il-light il-thin" d="M116 60v9M121 60v9M126 60v9M131 60v9"/>
    <circle class="il-dark il-ink" cx="4" cy="84" r="5"/><circle class="il-dark il-ink" cx="28" cy="84" r="5"/><circle class="il-dark il-ink" cx="56" cy="84" r="5"/>
    <circle class="il-dark il-ink" cx="84" cy="84" r="5"/><circle class="il-dark il-ink" cx="112" cy="84" r="5"/><circle class="il-dark il-ink" cx="130" cy="84" r="5"/><circle class="il-dark il-ink" cx="148" cy="84" r="5"/>
    <path class="il-light" d="M0 44h20M4 56h30M50 46h24M56 64h34M0 70h14M60 76h24"/>
    <circle class="il-smoke il-ink il-thin" cx="-2" cy="88" r="6"/>
    <rect class="il-stone il-ink" x="-2" y="92" width="164" height="30"/>
    <rect class="il-yellow" x="-2" y="96" width="164" height="3"/>
    <path class="il-line il-thin" opacity="0.4" d="M40 99l-4 21M100 99l-2 21M150 99l2 21"/>
    <rect class="il-dark il-ink" x="22" y="22" width="5" height="76"/>
    <path class="il-dark il-ink" d="M18 22h13l-2-6h-9z"/><rect class="il-yellow il-ink il-thin" x="20" y="22" width="9" height="5"/>
    <ellipse class="il-dark il-ink" cx="24.5" cy="98" rx="7" ry="2.4"/>
    <path class="il-blue il-ink" d="M66 52q10-4 26-10l4 6q-14 4-28 12zM66 58q12 2 26 0l2 7q-14 3-28-1z"/>
    <path class="il-dark il-ink" d="M92 40l8-2 2 6-6 2zM94 58l8 1-1 7-7-1z"/>
    <path class="il-green il-ink" d="M40 48h26q6 0 6 6t-6 6H40z"/>
    <path class="il-red il-ink il-thin" d="M46 54l14 -2 8 4-8 0-14 2z"/>
    <path class="il-green il-ink" d="M28 44l18 6v5l-18-6zM28 58l18-3v5l-18 3z"/>
    <circle class="il-skin il-ink" cx="27" cy="46" r="3"/><circle class="il-skin il-ink" cx="27" cy="60" r="3"/>
    <circle class="il-skin il-ink" cx="44" cy="44" r="7"/>
    <path class="il-earth-dark il-ink il-thin" d="M38 41q4-6 10-4l8-2-6 4 6 1-8 1q-4 0-10 0z"/>
    <circle class="il-white il-ink il-thin" cx="41" cy="43" r="2.2"/><circle class="il-white il-ink il-thin" cx="46" cy="43" r="2.2"/>
    <circle class="il-dark" cx="41" cy="43.4" r="1"/><circle class="il-dark" cx="46" cy="43.4" r="1"/>
    <ellipse class="il-dark" cx="43.5" cy="48" rx="1.8" ry="2.2"/>
    <g transform="rotate(25 140 12)"><path class="il-dark il-ink" d="M132 14q0-8 8-8t8 8z"/><path class="il-line" d="M128 14h24"/></g>
    <path class="il-light il-thin" d="M106 10h18M110 18h14M120 4h12"/>`,

  // A pot of dining-car goulash with a gleeful face boils over on the bend: a big wave sloshes over the rim, bubbles
  // pop, the bent ladle sticks out, crusty drips run down the pot and the flames below have been going for days.
  'rw.dining-car-goulash': `
    <rect class="il-wood" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="6" y="6" width="62" height="36" rx="6"/>
    <path class="il-grass" d="M7 34q14-12 28-4t32-6v12H7z"/>
    <path class="il-light il-thin" d="M12 14h16M36 20h24M16 24h10"/>
    <path class="il-red il-ink" d="M2 4h10q-4 16 2 40H2zM72 4H62q4 16-2 40h12z"/>
    <rect class="il-white il-ink" x="112" y="70" width="50" height="6"/>
    <path class="il-white il-ink" d="M114 76h48v14q-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0z"/>
    <g transform="rotate(14 140 66)">
      <path class="il-water il-ink il-thin" opacity="0.7" d="M134 52h12l-2 18h-8z"/>
      <path class="il-water il-ink il-thin" d="M135 58q5-4 10 2l-1 10h-8z"/>
    </g>
    <path class="il-line il-thin" d="M150 54l4-4M152 62h5"/>
    <rect class="il-metal il-ink" x="20" y="98" width="104" height="24"/>
    <circle class="il-dark il-ink il-thin" cx="34" cy="110" r="3.4"/><circle class="il-dark il-ink il-thin" cx="110" cy="110" r="3.4"/>
    <path class="il-dark il-ink il-thin" d="M30 60h8v10h-8zM114 60h8v10h-8z"/>
    <path class="il-grey il-ink" d="M36 50h80v34q0 10-10 10H46q-10 0-10-10z"/>
    <rect class="il-earth-dark" opacity="0.8" x="36" y="53" width="80" height="3"/>
    <path class="il-red il-ink il-thin" d="M44 53v10a2 2 0 0 0 4 0V53zM70 53v6a2 2 0 0 0 4 0v-6zM100 53v12a2 2 0 0 0 4 0V53z"/>
    <path class="il-light il-thin" d="M42 64v18"/>
    <path class="il-orange il-ink il-thin" d="M44 98q2-10 6-12 0 6 4 4 0-6 4-9 2 8 6 6 0-5 4-7 2 7 6 6 0-5 4-7 2 8 6 8 0-5 4-7 2 7 4 18z"/>
    <path class="il-yellow" d="M54 98q2-6 4-6 0 4 3 3 1-4 3-5 2 5 4 4 1-3 3-4 1 5 4 5 0-3 2-4 1 4 2 7z"/>
    <path class="il-red il-ink" d="M36 48c0-14 10-24 20-22 6-10 18-12 26-6 10-8 24-4 28 8 6 2 8 8 6 12z"/>
    <path class="il-red il-ink" d="M40 48c-8-12-22-12-26-4-3 6 1 11 6 11 2-4 6-6 10-4l2 6 6-3z"/>
    <ellipse class="il-red il-ink il-thin" cx="12" cy="64" rx="2.6" ry="3.4"/><ellipse class="il-red il-ink il-thin" cx="20" cy="74" rx="2" ry="2.8"/>
    <rect class="il-metal il-ink" x="32" y="46" width="88" height="7" rx="3"/>
    <rect class="il-earth-dark il-ink il-thin" x="44" y="38" width="7" height="6" rx="1.5" transform="rotate(-15 47 41)"/>
    <rect class="il-earth-dark il-ink il-thin" x="96" y="40" width="7" height="6" rx="1.5" transform="rotate(20 99 43)"/>
    <circle class="il-orange il-ink il-thin" cx="56" cy="36" r="2.4"/><circle class="il-yellow il-ink il-thin" cx="104" cy="40" r="2.4"/>
    <path class="il-line" d="M62 22l9 3M96 20l-9 4"/>
    <circle class="il-white il-ink" cx="70" cy="31" r="5.5"/><circle class="il-dark" cx="68" cy="32" r="2.6"/>
    <circle class="il-white il-ink" cx="88" cy="30" r="5.5"/><circle class="il-dark" cx="86" cy="31" r="2.6"/>
    <path class="il-dark il-ink" d="M65 38q14 10 30-2z"/>
    <path class="il-white" d="M70 39.4h3v2.4h-3zM87 38.8h3v2.4h-3z"/>
    <circle class="il-red il-ink il-thin" cx="46" cy="26" r="3"/><circle class="il-red il-ink il-thin" cx="110" cy="30" r="2.4"/>
    <path class="il-line il-thin" d="M104 22l-2-3M108 21v-4M112 22l2-3"/>
    <path class="il-line il-thick" d="M100 34l10-14h12"/>
    <circle class="il-line il-thin" cx="125" cy="20" r="3"/>
    <path class="il-light" d="M54 22q-4-5 0-10t0-10M78 18q-4-5 0-10"/>
    <path class="il-line il-thin" d="M90 20q-3-4 0-8t0-8M36 30q-3-4 0-8"/>`,

  // A grinning old lost-property clerk behind his counter wears three lost hats stacked on his head and two lost scarves,
  // and hugs a teddy and a suitcase that he clearly won't give back. Shelves of lost things fill the wall behind him.
  'rw.lost-property-clerk': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="-2" y="34" width="164" height="4"/>
    <rect class="il-wood-dark il-ink" x="-2" y="66" width="164" height="4"/>
    <path class="il-purple il-ink" d="M4 34q0-18 18-18t18 18q-3-3-6 0-3-3-6 0-3-3-6 0-3-3-6 0-3-3-6 0-3-3-6 0z"/>
    <path class="il-line il-thin" d="M22 16v-6q0-4 4-4t4 4M22 16l-6 18M22 16l6 18"/>
    <path class="il-line il-thin" d="M36 38v6"/><rect class="il-white il-ink il-thin" x="32" y="44" width="8" height="6"/>
    <ellipse class="il-yellow il-ink" cx="128" cy="29" rx="9" ry="5"/><circle class="il-yellow il-ink" cx="122" cy="20" r="5"/>
    <path class="il-orange il-ink il-thin" d="M117 20l-5 1 5 2z"/><circle class="il-dark" cx="121" cy="19" r="1"/>
    <path class="il-green il-ink" d="M142 34v-10l-2-6 3-1 2 5v-8h3v8l1-9h3v9l1-7h3v10q0 4-4 9z"/>
    <path class="il-line il-thin" d="M130 38v6"/><rect class="il-white il-ink il-thin" x="126" y="44" width="8" height="6"/>
    <rect class="il-red il-ink" x="4" y="48" width="26" height="18" rx="2"/><path class="il-line il-thin" d="M12 48v-4h10v4M4 56h26"/>
    <path class="il-wood-dark il-ink" d="M126 66v-8q0-4 4-4h6l4 5h10q4 0 4 7z"/>
    <path class="il-white il-ink" d="M140 40h6v14l6 4-2 4-10-4z"/>
    <path class="il-red il-thin" d="M140 44h6v2h-6zM140 49h6v2h-6z"/>
    <path class="il-grey il-ink" d="M44 96q0-30 36-30t36 30z"/>
    <path class="il-white il-ink il-thin" d="M72 68l8 10 8-10z"/>
    <circle class="il-dark" cx="80" cy="84" r="1.4"/><circle class="il-dark" cx="80" cy="90" r="1.4"/>
    <path class="il-green il-ink" d="M90 68l8 0 2 24-6 0z"/>
    <path class="il-white il-thin" d="M91 74h7v2h-7zM92 82h7v2h-7z"/>
    <path class="il-red il-ink" d="M64 64q16 8 32 0v7q-16 8-32 0z"/>
    <path class="il-red il-ink" d="M66 70l-6 18 6 2 6-18z"/>
    <path class="il-white il-thin" d="M64 76l6 2-1 2-6-2zM62 82l6 2-1 2-6-2z"/>
    <circle class="il-skin il-ink" cx="65" cy="50" r="4"/><circle class="il-skin il-ink" cx="95" cy="50" r="4"/>
    <ellipse class="il-skin il-ink" cx="80" cy="48" rx="15" ry="16"/>
    <path class="il-beard il-ink il-thin" d="M66 46q-6-4-2-10 2 4 5 4zM94 46q6-4 2-10-2 4-5 4z"/>
    <path class="il-beard il-ink il-thin" d="M66 41q0-6 6-6 4-3 8 1 0 4-6 4-4 3-8 1zM94 41q0-6-6-6-4-3-8 1 0 4 6 4 4 3 8 1z"/>
    <circle class="il-dark" cx="73" cy="44.4" r="1.6"/><circle class="il-dark" cx="87" cy="44.4" r="1.6"/>
    <path class="il-white il-ink il-thin" d="M68 46.5h10a5 5 0 0 1-10 0zM82 46.5h10a5 5 0 0 1-10 0z"/>
    <path class="il-line il-thin" d="M78 46.5h4"/>
    <ellipse class="il-skin il-ink" cx="80" cy="53" rx="3.4" ry="4.4"/>
    <path class="il-dark il-ink" d="M67 56q13 16 26 0z"/>
    <path class="il-white" d="M70 57h20l-1 2.6H71z"/>
    <path class="il-pink" d="M75 64q5-3 10 0q-5 2-10 0z"/>
    <ellipse class="il-dark il-ink" cx="80" cy="33" rx="15" ry="3"/>
    <path class="il-dark il-ink" d="M70 33q0-11 10-11t10 11z"/>
    <path class="il-red il-ink" d="M72 23q0-11 9-11t9 11z" transform="rotate(-6 81 18)"/>
    <path class="il-white il-thin" d="M73 21h16v2H73z" transform="rotate(-6 81 18)"/>
    <g transform="rotate(10 84 8)">
      <ellipse class="il-gold il-ink" cx="84" cy="11" rx="12" ry="2.6"/>
      <rect class="il-gold il-ink" x="78" y="3" width="12" height="8" rx="2"/>
      <rect class="il-red" x="78" y="7" width="12" height="2"/>
    </g>
    <rect class="il-wood il-ink" x="-2" y="92" width="164" height="30"/>
    <rect class="il-wood-dark il-ink" x="-2" y="92" width="164" height="5"/>
    <path class="il-line il-thin" opacity="0.4" d="M8 102h40v14H8zM112 102h40v14h-40z"/>
    <circle class="il-wood il-ink" cx="56" cy="78" r="4"/><circle class="il-wood il-ink" cx="68" cy="78" r="4"/>
    <ellipse class="il-wood il-ink" cx="62" cy="88" rx="10" ry="8"/>
    <circle class="il-wood il-ink" cx="62" cy="80" r="7"/>
    <circle class="il-dark" cx="59.5" cy="79" r="1.2"/><circle class="il-dark" cx="64.5" cy="79" r="1.2"/><ellipse class="il-dark" cx="62" cy="82.5" rx="1.6" ry="1.2"/>
    <path class="il-line il-thin" d="M53 75l-6-6"/><rect class="il-white il-ink il-thin" x="42" y="64" width="7" height="6" transform="rotate(-20 45 67)"/>
    <rect class="il-blue il-ink" x="88" y="78" width="26" height="16" rx="2"/>
    <path class="il-line il-thin" d="M96 78v-4h10v4M88 86h26"/>
    <path class="il-grey il-ink" d="M50 74q-4 10 4 18l6-2q-4-8-2-14z"/>
    <path class="il-grey il-ink" d="M110 74q4 10-4 18l-6-2q4-8 2-14z"/>
    <ellipse class="il-skin il-ink" cx="58" cy="92" rx="6" ry="3.6"/><ellipse class="il-skin il-ink" cx="102" cy="92" rx="6" ry="3.6"/>
    <path class="il-gold il-ink" d="M132 92q0-10 8-10t8 10z"/><rect class="il-gold il-ink il-thin" x="138" y="78" width="4" height="4"/>`,
};
