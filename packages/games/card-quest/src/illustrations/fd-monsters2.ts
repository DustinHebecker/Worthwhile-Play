/* Fridge illustrations: monsters2. */
export const FD_MONSTERS2: Readonly<Record<string, string>> = {
  // Six colourful egg cups in a row on the door rack, each wearing a little plumed helmet and shouldering a spoon like a halberd; the last one drums on its own helmet. The egg tray above is empty, the toast below is guarded.
  'fd.egg-cup-guard': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 98h160v22H0z"/>
    <path class="il-glow" opacity="0.3" d="M0 0h160v8H0z"/>
    <rect class="il-white il-ink" x="8" y="6" width="144" height="20" rx="4"/><ellipse class="il-smoke il-ink il-thin" cx="22" cy="15" rx="7" ry="5"/><ellipse class="il-smoke il-ink il-thin" cx="45.2" cy="15" rx="7" ry="5"/><ellipse class="il-smoke il-ink il-thin" cx="68.4" cy="15" rx="7" ry="5"/><ellipse class="il-smoke il-ink il-thin" cx="91.6" cy="15" rx="7" ry="5"/><ellipse class="il-smoke il-ink il-thin" cx="114.8" cy="15" rx="7" ry="5"/><ellipse class="il-smoke il-ink il-thin" cx="138" cy="15" rx="7" ry="5"/>
    <rect class="il-water il-ink il-thin" opacity="0.5" x="6" y="20" width="148" height="8" rx="2"/>
    <path class="il-line il-thin" d="M62 13l-4-3M98 13l4-3"/>
    <path class="il-red il-ink" d="M7 56h18c0 18-4 26-9 26s-9-8-9-26z"/>
    <path class="il-light il-thin" d="M10 60c0 8 1 12 3 15"/>
    <rect class="il-red il-ink" x="13" y="81" width="6" height="6"/>
    <ellipse class="il-red il-ink" cx="16" cy="89" rx="8" ry="3"/>
    <path class="il-metal il-ink" d="M8 56c0-14 16-14 16 0z"/>
    <path class="il-line" d="M6 56h20"/>
    <path class="il-red il-ink il-thin" d="M16 45.5c-1-7 6-9 9-6-4 0-6 2-7 6z"/>
    <circle class="il-white il-ink il-thin" cx="12.4" cy="64" r="3"/><circle class="il-dark" cx="12.4" cy="64.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="19.6" cy="64" r="3"/><circle class="il-dark" cx="19.6" cy="64.3" r="1.4"/>
    <path class="il-line il-thin" d="M9 59.6l4.5 1.6M23 59.6l-4.5 1.6"/><ellipse class="il-dark" cx="16" cy="72.6" rx="2.6" ry="2.4"/>
    <path class="il-line" d="M24 70l3.6-2"/>
    <rect class="il-metal il-ink il-thin" x="26.8" y="38" width="2.4" height="33" rx="1"/>
    <ellipse class="il-metal il-ink il-thin" cx="28" cy="35" rx="3.2" ry="4.6"/>
    <circle class="il-red il-ink il-thin" cx="28" cy="68.5" r="2.2"/>
    <path class="il-blue il-ink" d="M31 56h18c0 18-4 26-9 26s-9-8-9-26z"/>
    <path class="il-light il-thin" d="M34 60c0 8 1 12 3 15"/>
    <rect class="il-blue il-ink" x="37" y="81" width="6" height="6"/>
    <ellipse class="il-blue il-ink" cx="40" cy="89" rx="8" ry="3"/>
    <path class="il-metal il-ink" d="M32 56c0-14 16-14 16 0z"/>
    <path class="il-line" d="M30 56h20"/>
    <path class="il-red il-ink il-thin" d="M40 45.5c-1-7 6-9 9-6-4 0-6 2-7 6z"/>
    <circle class="il-white il-ink il-thin" cx="36.4" cy="64" r="3"/><circle class="il-dark" cx="36.4" cy="64.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="43.6" cy="64" r="3"/><circle class="il-dark" cx="43.6" cy="64.3" r="1.4"/>
    <path class="il-line il-thin" d="M33 59.6l4.5 1.6M47 59.6l-4.5 1.6"/><path class="il-line il-thin" d="M37 72.5h6"/>
    <path class="il-line" d="M48 70l3.6-2"/>
    <rect class="il-metal il-ink il-thin" x="50.8" y="38" width="2.4" height="33" rx="1"/>
    <ellipse class="il-metal il-ink il-thin" cx="52" cy="35" rx="3.2" ry="4.6"/>
    <circle class="il-blue il-ink il-thin" cx="52" cy="68.5" r="2.2"/>
    <path class="il-yellow il-ink" d="M55 56h18c0 18-4 26-9 26s-9-8-9-26z"/>
    <path class="il-light il-thin" d="M58 60c0 8 1 12 3 15"/>
    <rect class="il-yellow il-ink" x="61" y="81" width="6" height="6"/>
    <ellipse class="il-yellow il-ink" cx="64" cy="89" rx="8" ry="3"/>
    <path class="il-metal il-ink" d="M56 56c0-14 16-14 16 0z"/>
    <path class="il-line" d="M54 56h20"/>
    <path class="il-red il-ink il-thin" d="M64 45.5c-1-7 6-9 9-6-4 0-6 2-7 6z"/>
    <circle class="il-white il-ink il-thin" cx="60.4" cy="64" r="3"/><circle class="il-dark" cx="60.4" cy="64.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="67.6" cy="64" r="3"/><circle class="il-dark" cx="67.6" cy="64.3" r="1.4"/>
    <path class="il-line il-thin" d="M57 59.6l4.5 1.6M71 59.6l-4.5 1.6"/><ellipse class="il-dark" cx="64" cy="72.6" rx="2.6" ry="2.4"/>
    <path class="il-line" d="M72 70l3.6-2"/>
    <rect class="il-metal il-ink il-thin" x="74.8" y="38" width="2.4" height="33" rx="1"/>
    <ellipse class="il-metal il-ink il-thin" cx="76" cy="35" rx="3.2" ry="4.6"/>
    <circle class="il-yellow il-ink il-thin" cx="76" cy="68.5" r="2.2"/>
    <path class="il-teal il-ink" d="M79 56h18c0 18-4 26-9 26s-9-8-9-26z"/>
    <path class="il-light il-thin" d="M82 60c0 8 1 12 3 15"/>
    <rect class="il-teal il-ink" x="85" y="81" width="6" height="6"/>
    <ellipse class="il-teal il-ink" cx="88" cy="89" rx="8" ry="3"/>
    <path class="il-metal il-ink" d="M80 56c0-14 16-14 16 0z"/>
    <path class="il-line" d="M78 56h20"/>
    <path class="il-red il-ink il-thin" d="M88 45.5c-1-7 6-9 9-6-4 0-6 2-7 6z"/>
    <circle class="il-white il-ink il-thin" cx="84.4" cy="64" r="3"/><circle class="il-dark" cx="84.4" cy="64.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="91.6" cy="64" r="3"/><circle class="il-dark" cx="91.6" cy="64.3" r="1.4"/>
    <path class="il-line il-thin" d="M81 59.6l4.5 1.6M95 59.6l-4.5 1.6"/><path class="il-line il-thin" d="M85 72.5h6"/>
    <path class="il-line" d="M96 70l3.6-2"/>
    <rect class="il-metal il-ink il-thin" x="98.8" y="38" width="2.4" height="33" rx="1"/>
    <ellipse class="il-metal il-ink il-thin" cx="100" cy="35" rx="3.2" ry="4.6"/>
    <circle class="il-teal il-ink il-thin" cx="100" cy="68.5" r="2.2"/>
    <path class="il-orange il-ink" d="M103 56h18c0 18-4 26-9 26s-9-8-9-26z"/>
    <path class="il-light il-thin" d="M106 60c0 8 1 12 3 15"/>
    <rect class="il-orange il-ink" x="109" y="81" width="6" height="6"/>
    <ellipse class="il-orange il-ink" cx="112" cy="89" rx="8" ry="3"/>
    <path class="il-metal il-ink" d="M104 56c0-14 16-14 16 0z"/>
    <path class="il-line" d="M102 56h20"/>
    <path class="il-red il-ink il-thin" d="M112 45.5c-1-7 6-9 9-6-4 0-6 2-7 6z"/>
    <circle class="il-white il-ink il-thin" cx="108.4" cy="64" r="3"/><circle class="il-dark" cx="108.4" cy="64.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="115.6" cy="64" r="3"/><circle class="il-dark" cx="115.6" cy="64.3" r="1.4"/>
    <path class="il-line il-thin" d="M105 59.6l4.5 1.6M119 59.6l-4.5 1.6"/><ellipse class="il-dark" cx="112" cy="72.6" rx="2.6" ry="2.4"/>
    <path class="il-line" d="M120 70l3.6-2"/>
    <rect class="il-metal il-ink il-thin" x="122.8" y="38" width="2.4" height="33" rx="1"/>
    <ellipse class="il-metal il-ink il-thin" cx="124" cy="35" rx="3.2" ry="4.6"/>
    <circle class="il-orange il-ink il-thin" cx="124" cy="68.5" r="2.2"/>
    <path class="il-green il-ink" d="M127 56h18c0 18-4 26-9 26s-9-8-9-26z"/>
    <path class="il-light il-thin" d="M130 60c0 8 1 12 3 15"/>
    <rect class="il-green il-ink" x="133" y="81" width="6" height="6"/>
    <ellipse class="il-green il-ink" cx="136" cy="89" rx="8" ry="3"/>
    <path class="il-metal il-ink" d="M128 56c0-14 16-14 16 0z"/>
    <path class="il-line" d="M126 56h20"/>
    <path class="il-red il-ink il-thin" d="M136 45.5c-1-7 6-9 9-6-4 0-6 2-7 6z"/>
    <circle class="il-white il-ink il-thin" cx="132.4" cy="64" r="3"/><circle class="il-dark" cx="132.4" cy="64.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="139.6" cy="64" r="3"/><circle class="il-dark" cx="139.6" cy="64.3" r="1.4"/>
    <path class="il-line il-thin" d="M129 59.6l4.5 1.6M143 59.6l-4.5 1.6"/><ellipse class="il-dark" cx="136" cy="72.6" rx="2.6" ry="2.4"/>
    <path class="il-line" d="M144 68l4-4"/>
    <g transform="rotate(-62 148 64)"><rect class="il-metal il-ink il-thin" x="146.8" y="40" width="2.4" height="24" rx="1"/><ellipse class="il-metal il-ink il-thin" cx="148" cy="37" rx="3.2" ry="4.6"/></g>
    <circle class="il-green il-ink il-thin" cx="148" cy="64" r="2.2"/>
    <path class="il-line il-thin" d="M130 42l-3-4M138 40v-5M145 42l3-4"/>
    <path class="il-line il-thin" d="M146 30l4 3-4 3 4 3M154 44l3 2-3 2 3 2"/>
    <rect class="il-water il-ink il-thin" opacity="0.55" x="4" y="87" width="152" height="13" rx="3"/>
    <path class="il-light il-thin" d="M10 91h40M100 91h30"/>
    <ellipse class="il-white il-ink il-thin" cx="80" cy="114" rx="26" ry="4"/>
    <path class="il-wood il-ink" d="M66 114v-10c-4 0-5-3-5-5 0-5 5-7 9-5 3-4 17-4 20 0 4-2 9 0 9 5 0 2-1 5-5 5v10z"/>
    <path class="il-skin" d="M69 112v-9c-3-1-3-2-3-3 0-3 3-4 6-2 3-3 13-3 16 0 3-2 6-1 6 2 0 1 0 2-3 3v9z"/>
    <rect class="il-yellow il-ink il-thin" x="74" y="102" width="12" height="7" rx="1.5"/>
    <path class="il-line il-thin" d="M96 102l4-3M64 102l-4-3"/>`,

  // A proud red drinks crate on roller wheels races across the kitchen tiles with puffed-up eyebrows and a rosette; the bottles clink, and a lone sneaker is stuck in the sticky trail behind it.
  'fd.drinks-crate': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 20h160M0 40h160M0 60h160M30 0v80M70 0v80M110 0v80M150 0v80"/>
    <path class="il-white" d="M0 80h160v40H0z"/><rect class="il-grey" opacity="0.45" x="0" y="80" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="40" y="80" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="80" y="80" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="120" y="80" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="20" y="100" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="60" y="100" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="100" y="100" width="20" height="20"/><rect class="il-grey" opacity="0.45" x="140" y="100" width="20" height="20"/>
    <path class="il-line il-thin" d="M0 80h160"/>
    <path class="il-gold" opacity="0.75" d="M2 108c6-7 22-8 34-4 8 3 8 9-2 11-12 2-28 1-32-7z"/>
    <path class="il-gold" opacity="0.6" d="M40 100c4-2 10-2 12 0s-2 4-6 4-8-2-6-4z"/>
    <path class="il-blue il-ink" d="M8 108c0-6 4-8 8-8l4 3h7c4 0 7 2 7 5v2H8z"/>
    <rect class="il-white il-ink il-thin" x="7" y="109" width="28" height="3" rx="1.5"/>
    <path class="il-line il-thin" d="M17 103l3 2M21 102l2 3M12 96l-1-4M20 94v-4M28 96l1-4"/>
    <path class="il-line il-thin" d="M6 48h24M2 60h28M8 72h22M12 36h18"/>
    <circle class="il-smoke il-ink il-thin" cx="32" cy="98" r="5"/><circle class="il-smoke il-ink il-thin" cx="24" cy="92" r="3.5"/>
    <g transform="rotate(-5 82 92)">
    <g transform="rotate(0 56 50)"><path class="il-green il-ink" d="M49 50v-8c0-5 4-7 4-11v-5h6v5c0 4 4 6 4 11v8z"/><path class="il-light il-thin" d="M52 46v-5"/><rect class="il-gold il-ink il-thin" x="52" y="22" width="8" height="4" rx="1"/></g>
    <g transform="rotate(9 74 50)"><path class="il-wood-dark il-ink" d="M67 50v-8c0-5 4-7 4-11v-5h6v5c0 4 4 6 4 11v8z"/><path class="il-light il-thin" d="M70 46v-5"/><rect class="il-gold il-ink il-thin" x="70" y="22" width="8" height="4" rx="1"/></g>
    <g transform="rotate(-7 92 50)"><path class="il-green il-ink" d="M85 50v-8c0-5 4-7 4-11v-5h6v5c0 4 4 6 4 11v8z"/><path class="il-light il-thin" d="M88 46v-5"/><rect class="il-gold il-ink il-thin" x="88" y="22" width="8" height="4" rx="1"/></g>
    <g transform="rotate(6 110 50)"><path class="il-wood-dark il-ink" d="M103 50v-8c0-5 4-7 4-11v-5h6v5c0 4 4 6 4 11v8z"/><path class="il-light il-thin" d="M106 46v-5"/><rect class="il-gold il-ink il-thin" x="106" y="22" width="8" height="4" rx="1"/></g>
    <path class="il-yellow il-ink il-thin" d="M65 16l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/><path class="il-yellow il-ink il-thin" d="M101 15l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-line il-thin" d="M62 12l-2-4M68 12l2-4M100 10v-4M83 14l1-5"/>
    <rect class="il-red il-ink" x="40" y="44" width="84" height="48" rx="4"/>
    <rect class="il-red il-ink" x="37" y="41" width="90" height="7" rx="2"/>
    <path class="il-line il-thin" d="M46 52v34M118 52v34M46 86h72"/>
    <path class="il-light il-thin" opacity="0.6" d="M42 44h20"/>
    <circle class="il-white il-ink il-thin" cx="68" cy="60" r="6.5"/><circle class="il-dark" cx="69.6" cy="60" r="3"/><circle class="il-white il-ink il-thin" cx="96" cy="60" r="6.5"/><circle class="il-dark" cx="97.6" cy="60" r="3"/>
    <path class="il-line" d="M59 50q9-6 17 0M88 50q9-6 17 0"/>
    <path class="il-dark il-ink" d="M62 70h40c0 8-8 13-20 13s-20-5-20-13z"/>
    <path class="il-white" d="M65 71h34v3H65z"/>
    <ellipse class="il-red" cx="82" cy="80" rx="7" ry="2"/>
    <path class="il-blue il-ink il-thin" d="M48 74l-3 12 4-2 2 3 1-13zM52 74l2 12 3-3 3 2-4-12z"/>
    <circle class="il-gold il-ink il-thin" cx="51" cy="72" r="5.5"/><circle class="il-yellow il-ink il-thin" cx="51" cy="72" r="2.6"/>
    <path class="il-line il-thick" d="M44 95h76"/>
    <circle class="il-dark il-ink" cx="52" cy="99" r="7"/><circle class="il-metal" cx="52" cy="99" r="2.6"/>
    <circle class="il-dark il-ink" cx="82" cy="99" r="7"/><circle class="il-metal" cx="82" cy="99" r="2.6"/>
    <circle class="il-dark il-ink" cx="112" cy="99" r="7"/><circle class="il-metal" cx="112" cy="99" r="2.6"/>
    <path class="il-light il-thin" d="M48 96a5 5 0 0 1 4-3M78 96a5 5 0 0 1 4-3M108 96a5 5 0 0 1 4-3"/>
    </g>
    <path class="il-line il-thin" d="M134 30l8-4M136 40l10-1M134 50l9 3"/>`,

  // A shouting food inspector in a hairnet leans into the fridge with a clipboard of crossed-out boxes; a sweating cheese wedge (too warm) and a butter frozen in an ice block (too cold) both get a red cross tag.
  'fd.food-inspection': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104"/>
    <path class="il-glow" opacity="0.3" d="M36 8h24l30 72H6z"/>
    <rect class="il-glow il-ink il-thin" x="36" y="2" width="24" height="6" rx="3"/>
    <rect class="il-water il-ink il-thin" opacity="0.4" x="6" y="96" width="70" height="24" rx="3"/>
    <path class="il-green il-ink il-thin" d="M18 100c4-6 10-6 12 0zM40 102c2-6 10-8 12-2z"/>
    <circle class="il-white il-ink il-thin" cx="82" cy="18" r="8"/>
    <path class="il-blue" d="M76 20a6 6 0 0 1 6-8v6z"/><path class="il-red" d="M82 12a6 6 0 0 1 6 8l-6-2z"/>
    <path class="il-line il-thin" d="M82 18l-3 3"/>
    <path class="il-line il-thin" d="M26 22v14M60 22v14"/>
    <rect class="il-white il-ink il-thin" x="19" y="36" width="14" height="11" rx="1"/><g transform="rotate(45 26 41.5)"><rect class="il-red" x="21.5" y="40.2" width="9" height="2.6"/><rect class="il-red" x="24.7" y="37" width="2.6" height="9"/></g>
    <rect class="il-white il-ink il-thin" x="53" y="36" width="14" height="11" rx="1"/><g transform="rotate(45 60 41.5)"><rect class="il-red" x="55.5" y="40.2" width="9" height="2.6"/><rect class="il-red" x="58.7" y="37" width="2.6" height="9"/></g>
    <path class="il-yellow il-ink" d="M12 80h30V56z"/>
    <path class="il-gold il-ink il-thin" d="M42 56v24l4-2V54z"/>
    <circle class="il-gold" cx="20" cy="76" r="2"/><circle class="il-gold" cx="36" cy="64" r="1.6"/><circle class="il-gold" cx="38" cy="75" r="1.4"/>
    <circle class="il-white il-ink il-thin" cx="28" cy="70" r="2.6"/><circle class="il-dark" cx="28" cy="70.6" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="35" cy="69" r="2.6"/><circle class="il-dark" cx="35" cy="69.6" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M28 75h7c0 3-2 4-3.5 4s-3.5-1-3.5-4z"/><ellipse class="il-red" cx="31.5" cy="78" rx="1.6" ry="1"/>
    <ellipse class="il-water il-ink il-thin" cx="9" cy="62" rx="1.8" ry="2.6"/><ellipse class="il-water il-ink il-thin" cx="47" cy="48" rx="1.8" ry="2.6"/><ellipse class="il-water il-ink il-thin" cx="18" cy="54" rx="1.6" ry="2.2"/>
    <path class="il-line il-thin" d="M14 50q-2-3 0-6M38 50q-2-3 0-6"/>
    <rect class="il-yellow il-ink" x="50" y="64" width="22" height="16" rx="2"/>
    <rect class="il-water il-ink il-thin" opacity="0.55" x="46" y="54" width="30" height="26" rx="3"/>
    <path class="il-light il-thin" d="M50 58l6 0M70 58v6"/>
    <circle class="il-white il-ink il-thin" cx="56" cy="70" r="2.6"/><circle class="il-dark" cx="56.4" cy="70" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="66" cy="70" r="2.6"/><circle class="il-dark" cx="65.6" cy="70" r="1.2"/>
    <path class="il-white il-ink il-thin" d="M55 75l2 2 2-2 2 2 2-2 2 2 2-2"/>
    <path class="il-line il-thin" d="M42 62l-2 2 2 2M80 62l2 2-2 2"/>
    <path class="il-water il-ink il-thin" d="M0 80h92v5H0z" opacity="0.6"/>
    <path class="il-white il-ink il-thin" d="M50 85l2 8 2-8M58 85l2 11 2-11M68 85l2 7 2-7"/>
    <path class="il-white il-ink" d="M94 120c0-28 10-40 30-40s32 12 32 40z"/>
    <path class="il-line il-thin" d="M116 80l8 14 8-14M124 94v26"/>
    <rect class="il-blue il-ink il-thin" x="134" y="98" width="10" height="7" rx="1"/>
    <path class="il-skin il-ink" d="M118 70h12v10h-12z"/>
    <circle class="il-skin il-ink" cx="104" cy="50" r="4"/><circle class="il-skin il-ink" cx="144" cy="50" r="4"/>
    <ellipse class="il-skin il-ink" cx="124" cy="48" rx="20" ry="23"/>
    <path class="il-white il-ink il-thin" d="M103 44c0-20 10-28 21-28s21 8 21 28c-6-4-14-6-21-6s-15 2-21 6z"/>
    <path class="il-line il-thin" opacity="0.5" d="M110 24l20 16M118 19l22 18M136 22l-22 18M128 18l-22 18"/>
    <path class="il-line il-thick" d="M108 39l12 5M140 39l-12 5"/>
    <circle class="il-white il-ink il-thin" cx="116" cy="49" r="3.6"/><circle class="il-dark" cx="116.8" cy="49" r="1.7"/><circle class="il-white il-ink il-thin" cx="132" cy="49" r="3.6"/><circle class="il-dark" cx="131.2" cy="49" r="1.7"/>
    <circle class="il-line il-thin" cx="116" cy="49" r="6"/><circle class="il-line il-thin" cx="132" cy="49" r="6"/><path class="il-line il-thin" d="M122 49h4"/>
    <path class="il-line il-thin" d="M124 51q3 3 0 5"/>
    <path class="il-dark il-ink" d="M113 59h22c0 10-5 14-11 14s-11-4-11-14z"/>
    <path class="il-white" d="M115 60h18v2.6h-18z"/><ellipse class="il-red" cx="124" cy="68.6" rx="6" ry="3.4"/>
    <path class="il-line il-thin" d="M100 28l-5-4M98 38l-7-1M100 62l-6 3"/>
    <path class="il-white il-ink" d="M106 96c-6 0-10-2-12-6l4-5c3 3 6 4 10 4z"/>
    <rect class="il-wood il-ink" x="74" y="72" width="26" height="36" rx="2"/>
    <rect class="il-white il-ink il-thin" x="77" y="77" width="20" height="28"/>
    <rect class="il-metal il-ink il-thin" x="81" y="69" width="12" height="6" rx="1.5"/>
    <g class="il-white il-ink il-thin"><rect x="79" y="80" width="4" height="4"/><rect x="79" y="87" width="4" height="4"/><rect x="79" y="94" width="4" height="4"/></g>
    <path class="il-line il-thin" d="M79 80l4 4M83 80l-4 4M79 87l4 4M83 87l-4 4M79 94l4 4M83 94l-4 4M86 82h8M86 89h8M86 96h6"/>
    <circle class="il-skin il-ink" cx="99" cy="92" r="3.6"/>`,

  // A see-through ghost shaped like a fish finger (faint breadcrumb dots, wavy ghost tail) rises moaning out of its empty fish-finger box in the frosty freezer; a frozen pea watches, terrified.
  'fd.freezer-ghost': `
    <rect class="il-water" x="0" y="0" width="160" height="120"/>
    <rect class="il-white" opacity="0.35" x="10" y="14" width="140" height="86"/>
    <path class="il-white il-ink il-thin" d="M0 0h160v12L153 17L146 12L139 17L132 12L125 17L118 12L111 17L104 12L97 17L90 12L83 17L76 12L69 17L62 12L55 17L48 12L41 17L34 12L27 17L20 12L13 17L6 12L0 17L0 0z"/>
    <path class="il-white il-ink il-thin" d="M20 16l2 8 2-8M52 16l2 10 2-10M118 16l2 7 2-7M140 16l2 9 2-9"/>
    <rect class="il-white il-ink" x="0" y="100" width="160" height="20"/>
    <rect class="il-smoke il-ink il-thin" x="60" y="106" width="40" height="7" rx="3.5"/>
    <path class="il-light il-thin" d="M4 103h20M130 103h26"/>
    <path class="il-dark il-ink il-thin" d="M16 78h50l4-8H20z"/>
    <path class="il-blue il-ink" d="M20 70l4-14h50l-4 14z"/>
    <path class="il-light il-thin" d="M28 60h20"/>
    <path class="il-white il-ink" opacity="0.9" d="M66 54c-2 10-10 18-24 22 6 2 12 1 16-2-1 3 1 5 4 5 0-6 6-14 12-18z"/>
    <path class="il-white il-ink" opacity="0.9" d="M62 48c-7 0-13-4-16-9 5 0 11 2 16 5z"/>
    <path class="il-white il-ink" opacity="0.9" d="M124 48c7 0 13-4 16-9-5 0-11 2-16 5z"/>
    <path class="il-white il-ink" opacity="0.9" d="M60 39c0-5 2-7 7-7h52c5 0 7 2 7 7v18c-3 3-6-1-9 2s-6-1-9 2-6-1-9 2-6-1-9 2-6-1-9 2-6-1-9 2-6-1-9 0z"/>
    <path class="il-gold" opacity="0.3" d="M62 39c0-4 2-5 5-5h52c4 0 5 1 5 5v16H62z"/><circle class="il-orange" opacity="0.45" cx="66" cy="38" r="1.3"/><circle class="il-orange" opacity="0.45" cx="72" cy="56" r="1.3"/><circle class="il-orange" opacity="0.45" cx="110" cy="36" r="1.3"/><circle class="il-orange" opacity="0.45" cx="118" cy="54" r="1.3"/><circle class="il-orange" opacity="0.45" cx="86" cy="36" r="1.3"/><circle class="il-orange" opacity="0.45" cx="104" cy="58" r="1.3"/><circle class="il-orange" opacity="0.45" cx="120" cy="44" r="1.3"/><circle class="il-orange" opacity="0.45" cx="68" cy="47" r="1.3"/><circle class="il-orange" opacity="0.45" cx="96" cy="34" r="1.3"/>
    <path class="il-line il-thin" d="M78 39l7 3M106 39l-7 3"/>
    <ellipse class="il-dark" cx="83" cy="46" rx="3.4" ry="4.6"/><ellipse class="il-dark" cx="101" cy="46" rx="3.4" ry="4.6"/>
    <circle class="il-white" cx="84" cy="44.5" r="1"/><circle class="il-white" cx="102" cy="44.5" r="1"/>
    <ellipse class="il-dark" cx="92" cy="55" rx="3.6" ry="3.4"/>
    <path class="il-line il-thin" d="M132 32q4-3 8 0t8 0M134 42q4-3 8 0t8 0M130 52q4-3 7 0"/>
    <path class="il-blue il-ink" d="M14 100V78h52v22z"/>
    <path class="il-white il-ink il-thin" d="M22 88c4-5 12-5 16 0-4 5-12 5-16 0zM38 88l5-4v8z"/>
    <circle class="il-dark" cx="25" cy="87" r="0.9"/>
    <rect class="il-orange il-ink il-thin" x="48" y="82" width="12" height="3.4" rx="1"/><rect class="il-orange il-ink il-thin" x="48" y="87" width="12" height="3.4" rx="1"/><rect class="il-orange il-ink il-thin" x="48" y="92" width="12" height="3.4" rx="1"/>
    <path class="il-white il-ink il-thin" d="M14 78h52" />
    <path class="il-light il-thin" d="M30 30l4 4M34 30l-4 4M32 29v6M140 72l4 4M144 72l-4 4M142 71v6M20 46l3 3M23 46l-3 3"/>
    <rect class="il-white il-ink il-thin" opacity="0.8" x="124" y="86" width="14" height="14" rx="2"/>
    <path class="il-light il-thin" d="M127 89h5"/>
    <circle class="il-green il-ink" cx="148" cy="94" r="5.5"/>
    <circle class="il-white il-ink il-thin" cx="146" cy="93" r="1.6"/><circle class="il-dark" cx="145.6" cy="93" r="0.8"/>
    <circle class="il-white il-ink il-thin" cx="150" cy="93" r="1.6"/><circle class="il-dark" cx="149.6" cy="93" r="0.8"/>
    <path class="il-line il-thin" d="M146.5 97q1.5-1 3 0"/>`,

  // A whole cloud of red-eyed fruit flies rises from a fruit bowl with a mouldy plum and an apple core; three of them carry off a fork on threads.
  'fd.fruit-flies': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 22h160M0 46h160M0 70h160M40 0v94M80 0v94M120 0v94"/>
    <rect class="il-wood il-ink" x="0" y="94" width="160" height="26"/>
    <path class="il-line il-thin" opacity="0.5" d="M10 104h30M60 110h40M120 102h30"/>
    <path class="il-red il-ink" d="M20 82c-6-10 0-18 7-16 3-3 10-2 12 4 2 8-2 14-6 14z"/>
    <path class="il-skin il-ink il-thin" d="M32 66c3 2 4 6 3 9 3-1 6 2 5 5-2 0-3 1-3 3-3-1-6-1-7-3z"/>
    <circle class="il-earth-dark" cx="34" cy="74" r="1"/><circle class="il-earth-dark" cx="36" cy="79" r="1"/>
    <path class="il-wood-dark il-ink il-thin" d="M28 66l1-6"/><path class="il-green il-ink il-thin" d="M29 62c4-4 8-2 8 0-3 2-6 2-8 0z"/>
    <ellipse class="il-purple il-ink" cx="50" cy="82" rx="10" ry="7"/>
    <circle class="il-slime il-ink il-thin" cx="46" cy="79" r="2"/><circle class="il-slime il-ink il-thin" cx="53" cy="84" r="1.6"/><circle class="il-slime" cx="56" cy="79" r="1.2"/>
    <path class="il-blue il-ink" d="M8 82h58c0 10-10 14-29 14S8 92 8 82z"/>
    <path class="il-light il-thin" d="M14 87c4 4 12 5 18 5"/>
    <path class="il-line il-thin" d="M24 58q-3-4 0-8t0-8M42 60q-3-4 0-8t0-8"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="28.5" cy="46.9" rx="3.1" ry="1.8" transform="rotate(-30 28.5 46.9)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="31.3" cy="46.7" rx="2.9" ry="1.7" transform="rotate(25 31.3 46.7)"/><ellipse class="il-earth-dark il-ink il-thin" cx="30" cy="50" rx="3.7" ry="2.6"/><circle class="il-red il-ink il-thin" cx="33.1" cy="49.3" r="1.7"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="44.2" cy="40.4" rx="3.6" ry="2.1" transform="rotate(-30 44.2 40.4)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="47.6" cy="40.1" rx="3.4" ry="2" transform="rotate(25 47.6 40.1)"/><ellipse class="il-earth-dark il-ink il-thin" cx="46" cy="44" rx="4.4" ry="3.1"/><circle class="il-red il-ink il-thin" cx="49.6" cy="43.2" r="2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="55.8" cy="47.5" rx="4.5" ry="2.6" transform="rotate(-30 55.8 47.5)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="59.9" cy="47.2" rx="4.2" ry="2.4" transform="rotate(25 59.9 47.2)"/><ellipse class="il-earth-dark il-ink il-thin" cx="58" cy="52" rx="5.4" ry="3.8"/><circle class="il-red il-ink il-thin" cx="62.5" cy="51" r="2.4"/><circle class="il-white" cx="63.1" cy="50.2" r="0.7"/><path class="il-light il-thin" d="M59.6 53.6q1.6 1.3 3.2 0"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="68.6" cy="37.2" rx="2.8" ry="1.6" transform="rotate(-30 68.6 37.2)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="71.2" cy="37" rx="2.6" ry="1.5" transform="rotate(25 71.2 37)"/><ellipse class="il-earth-dark il-ink il-thin" cx="70" cy="40" rx="3.4" ry="2.4"/><circle class="il-red il-ink il-thin" cx="72.8" cy="39.4" r="1.5"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="62.3" cy="26.6" rx="3.4" ry="1.9" transform="rotate(-30 62.3 26.6)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="65.4" cy="26.4" rx="3.1" ry="1.8" transform="rotate(25 65.4 26.4)"/><ellipse class="il-earth-dark il-ink il-thin" cx="64" cy="30" rx="4.1" ry="2.9"/><circle class="il-red il-ink il-thin" cx="67.4" cy="29.3" r="1.8"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="77.3" cy="44.7" rx="5.3" ry="3" transform="rotate(-30 77.3 44.7)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="82.3" cy="44.3" rx="4.9" ry="2.8" transform="rotate(25 82.3 44.3)"/><ellipse class="il-earth-dark il-ink il-thin" cx="80" cy="50" rx="6.5" ry="4.6"/><circle class="il-red il-ink il-thin" cx="85.3" cy="48.9" r="2.8"/><circle class="il-white" cx="86.1" cy="47.9" r="0.9"/><path class="il-light il-thin" d="M81.9 51.9q1.9 1.5 3.8 0"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="82.5" cy="30.9" rx="3.1" ry="1.8" transform="rotate(-30 82.5 30.9)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="85.3" cy="30.7" rx="2.9" ry="1.7" transform="rotate(25 85.3 30.7)"/><ellipse class="il-earth-dark il-ink il-thin" cx="84" cy="34" rx="3.7" ry="2.6"/><circle class="il-red il-ink il-thin" cx="87.1" cy="33.3" r="1.7"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="94" cy="40.1" rx="3.9" ry="2.2" transform="rotate(-30 94 40.1)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="97.7" cy="39.8" rx="3.6" ry="2.1" transform="rotate(25 97.7 39.8)"/><ellipse class="il-earth-dark il-ink il-thin" cx="96" cy="44" rx="4.8" ry="3.4"/><circle class="il-red il-ink il-thin" cx="99.9" cy="43.2" r="2.1"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="50.7" cy="33.5" rx="2.5" ry="1.4" transform="rotate(-30 50.7 33.5)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="53.1" cy="33.3" rx="2.3" ry="1.4" transform="rotate(25 53.1 33.3)"/><ellipse class="il-earth-dark il-ink il-thin" cx="52" cy="36" rx="3.1" ry="2.2"/><circle class="il-red il-ink il-thin" cx="54.5" cy="35.5" r="1.4"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="74.7" cy="19.5" rx="2.5" ry="1.4" transform="rotate(-30 74.7 19.5)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="77.1" cy="19.3" rx="2.3" ry="1.4" transform="rotate(25 77.1 19.3)"/><ellipse class="il-earth-dark il-ink il-thin" cx="76" cy="22" rx="3.1" ry="2.2"/><circle class="il-red il-ink il-thin" cx="78.5" cy="21.5" r="1.4"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="90.3" cy="22.6" rx="3.4" ry="1.9" transform="rotate(-30 90.3 22.6)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="93.4" cy="22.4" rx="3.1" ry="1.8" transform="rotate(25 93.4 22.4)"/><ellipse class="il-earth-dark il-ink il-thin" cx="92" cy="26" rx="4.1" ry="2.9"/><circle class="il-red il-ink il-thin" cx="95.4" cy="25.3" r="1.8"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="102.5" cy="52.9" rx="3.1" ry="1.8" transform="rotate(-30 102.5 52.9)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="105.3" cy="52.7" rx="2.9" ry="1.7" transform="rotate(25 105.3 52.7)"/><ellipse class="il-earth-dark il-ink il-thin" cx="104" cy="56" rx="3.7" ry="2.6"/><circle class="il-red il-ink il-thin" cx="107.1" cy="55.3" r="1.7"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="107.6" cy="33.2" rx="4.8" ry="2.7" transform="rotate(-30 107.6 33.2)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="112" cy="32.9" rx="4.4" ry="2.6" transform="rotate(25 112 32.9)"/><ellipse class="il-earth-dark il-ink il-thin" cx="110" cy="38" rx="5.8" ry="4.1"/><circle class="il-red il-ink il-thin" cx="114.8" cy="37" r="2.6"/><circle class="il-white" cx="115.4" cy="36.1" r="0.8"/><path class="il-light il-thin" d="M111.7 39.7q1.7 1.4 3.4 0"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="38.6" cy="57.2" rx="2.8" ry="1.6" transform="rotate(-30 38.6 57.2)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="41.2" cy="57" rx="2.6" ry="1.5" transform="rotate(25 41.2 57)"/><ellipse class="il-earth-dark il-ink il-thin" cx="40" cy="60" rx="3.4" ry="2.4"/><circle class="il-red il-ink il-thin" cx="42.8" cy="59.4" r="1.5"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="64.3" cy="60.6" rx="3.4" ry="1.9" transform="rotate(-30 64.3 60.6)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="67.4" cy="60.4" rx="3.1" ry="1.8" transform="rotate(25 67.4 60.4)"/><ellipse class="il-earth-dark il-ink il-thin" cx="66" cy="64" rx="4.1" ry="2.9"/><circle class="il-red il-ink il-thin" cx="69.4" cy="63.3" r="1.8"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="90.6" cy="63.2" rx="2.8" ry="1.6" transform="rotate(-30 90.6 63.2)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="93.2" cy="63" rx="2.6" ry="1.5" transform="rotate(25 93.2 63)"/><ellipse class="il-earth-dark il-ink il-thin" cx="92" cy="66" rx="3.4" ry="2.4"/><circle class="il-red il-ink il-thin" cx="94.8" cy="65.4" r="1.5"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="116.6" cy="49.2" rx="2.8" ry="1.6" transform="rotate(-30 116.6 49.2)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="119.2" cy="49" rx="2.6" ry="1.5" transform="rotate(25 119.2 49)"/><ellipse class="il-earth-dark il-ink il-thin" cx="118" cy="52" rx="3.4" ry="2.4"/><circle class="il-red il-ink il-thin" cx="120.8" cy="51.4" r="1.5"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="98.9" cy="11.8" rx="2.2" ry="1.3" transform="rotate(-30 98.9 11.8)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="101" cy="11.6" rx="2.1" ry="1.2" transform="rotate(25 101 11.6)"/><ellipse class="il-earth-dark il-ink il-thin" cx="100" cy="14" rx="2.7" ry="1.9"/><circle class="il-red il-ink il-thin" cx="102.2" cy="13.5" r="1.2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="34.9" cy="33.8" rx="2.2" ry="1.3" transform="rotate(-30 34.9 33.8)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="37" cy="33.6" rx="2.1" ry="1.2" transform="rotate(25 37 33.6)"/><ellipse class="il-earth-dark il-ink il-thin" cx="36" cy="36" rx="2.7" ry="1.9"/><circle class="il-red il-ink il-thin" cx="38.2" cy="35.5" r="1.2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="118.9" cy="63.8" rx="2.2" ry="1.3" transform="rotate(-30 118.9 63.8)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="121" cy="63.6" rx="2.1" ry="1.2" transform="rotate(25 121 63.6)"/><ellipse class="il-earth-dark il-ink il-thin" cx="120" cy="66" rx="2.7" ry="1.9"/><circle class="il-red il-ink il-thin" cx="122.2" cy="65.5" r="1.2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="124.5" cy="40.9" rx="3.1" ry="1.8" transform="rotate(-30 124.5 40.9)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="127.3" cy="40.7" rx="2.9" ry="1.7" transform="rotate(25 127.3 40.7)"/><ellipse class="il-earth-dark il-ink il-thin" cx="126" cy="44" rx="3.7" ry="2.6"/><circle class="il-red il-ink il-thin" cx="129.1" cy="43.3" r="1.7"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="72.9" cy="71.8" rx="2.2" ry="1.3" transform="rotate(-30 72.9 71.8)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="75" cy="71.6" rx="2.1" ry="1.2" transform="rotate(25 75 71.6)"/><ellipse class="il-earth-dark il-ink il-thin" cx="74" cy="74" rx="2.7" ry="1.9"/><circle class="il-red il-ink il-thin" cx="76.2" cy="73.5" r="1.2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="54.9" cy="67.8" rx="2.2" ry="1.3" transform="rotate(-30 54.9 67.8)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="57" cy="67.6" rx="2.1" ry="1.2" transform="rotate(25 57 67.6)"/><ellipse class="il-earth-dark il-ink il-thin" cx="56" cy="70" rx="2.7" ry="1.9"/><circle class="il-red il-ink il-thin" cx="58.2" cy="69.5" r="1.2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="138.7" cy="55.5" rx="2.5" ry="1.4" transform="rotate(-30 138.7 55.5)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="141.1" cy="55.3" rx="2.3" ry="1.4" transform="rotate(25 141.1 55.3)"/><ellipse class="il-earth-dark il-ink il-thin" cx="140" cy="58" rx="3.1" ry="2.2"/><circle class="il-red il-ink il-thin" cx="142.5" cy="57.5" r="1.4"/><circle class="il-dark" cx="44" cy="28" r="0.9"/><circle class="il-dark" cx="60" cy="18" r="0.9"/><circle class="il-dark" cx="88" cy="8" r="0.9"/><circle class="il-dark" cx="70" cy="58" r="0.9"/><circle class="il-dark" cx="100" cy="30" r="0.9"/><circle class="il-dark" cx="114" cy="70" r="0.9"/><circle class="il-dark" cx="132" cy="34" r="0.9"/><circle class="il-dark" cx="26" cy="42" r="0.9"/><circle class="il-dark" cx="86" cy="60" r="0.9"/><circle class="il-dark" cx="48" cy="64" r="0.9"/><circle class="il-dark" cx="108" cy="24" r="0.9"/><circle class="il-dark" cx="132" cy="70" r="0.9"/><circle class="il-dark" cx="148" cy="46" r="0.9"/><circle class="il-dark" cx="118" cy="12" r="0.9"/>
    <path class="il-line il-thin" d="M118 12l-2 12M132 10l0 11M146 8l2 12"/>
    <g transform="rotate(-8 130 26)">
      <rect class="il-metal il-ink il-thin" x="100" y="24" width="28" height="3.4" rx="1.7"/>
      <path class="il-metal il-ink il-thin" d="M127 21h7v10h-7z"/>
      <path class="il-metal il-ink il-thin" d="M134 21.2h12v1.8h-12zM134 24.6h12v1.8h-12zM134 28h12v1.8h-12z"/>
    </g>
    <ellipse class="il-white il-ink il-thin" opacity="0.85" cx="116.2" cy="5.4" rx="3.6" ry="2.1" transform="rotate(-30 116.2 5.4)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="119.6" cy="5.1" rx="3.4" ry="2" transform="rotate(25 119.6 5.1)"/><ellipse class="il-earth-dark il-ink il-thin" cx="118" cy="9" rx="4.4" ry="3.1"/><circle class="il-red il-ink il-thin" cx="121.6" cy="8.2" r="2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="130.2" cy="3.4" rx="3.6" ry="2.1" transform="rotate(-30 130.2 3.4)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="133.6" cy="3.1" rx="3.4" ry="2" transform="rotate(25 133.6 3.1)"/><ellipse class="il-earth-dark il-ink il-thin" cx="132" cy="7" rx="4.4" ry="3.1"/><circle class="il-red il-ink il-thin" cx="135.6" cy="6.2" r="2"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="144.2" cy="2.4" rx="3.6" ry="2.1" transform="rotate(-30 144.2 2.4)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="147.6" cy="2.1" rx="3.4" ry="2" transform="rotate(25 147.6 2.1)"/><ellipse class="il-earth-dark il-ink il-thin" cx="146" cy="6" rx="4.4" ry="3.1"/><circle class="il-red il-ink il-thin" cx="149.6" cy="5.2" r="2"/>
    <path class="il-line il-thin" d="M112 4l-3-2M126 2l-2-1"/>`,

  // A ginger cat in a red sweatband, standing on its hind legs, hauls the fridge door open with both paws through gritted teeth; cold light streams out of the crack, and tally marks of three years of practice are scratched into the door.
  'fd.door-opening-cat': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 18h160M0 38h160M0 58h160M0 78h160M20 0v104M60 0v104M100 0v104M140 0v104"/>
    <path class="il-wood" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" d="M0 104h160"/>
    <path class="il-line il-thin" opacity="0.4" d="M40 104v16M100 104v16"/>
    <path class="il-glow" opacity="0.35" d="M100 34l60 26v44l-60-6z"/>
    <rect class="il-white il-ink" x="12" y="4" width="86" height="102" rx="6"/>
    <path class="il-line" d="M12 32h86"/>
    <rect class="il-metal il-ink il-thin" x="88" y="12" width="4" height="14" rx="2"/>
    <path class="il-glow il-ink il-thin" d="M98 34l5-2v70l-5-2z"/>
    <path class="il-light il-thin" d="M18 10v18M18 38v60"/>
    <rect class="il-white il-ink il-thin" x="24" y="40" width="22" height="18" transform="rotate(-6 35 49)"/>
    <circle class="il-yellow il-ink il-thin" cx="31" cy="46" r="3"/><path class="il-green il-ink il-thin" d="M27 56l5-6 4 4 3-3 4 5z"/>
    <circle class="il-red il-ink il-thin" cx="35" cy="38" r="2.4"/>
    <rect class="il-blue il-ink il-thin" x="56" y="14" width="8" height="8" rx="2"/>
    <circle class="il-green il-ink il-thin" cx="72" cy="48" r="3"/>
    <path class="il-line il-thin" d="M24 76v12M28 76v12M32 76v12M36 76v12M22 86l16-8M46 76v12M50 76v12M54 76v12M58 76v12M44 86l16-8M68 76v12M72 76v12"/>
    <path class="il-line il-thin" opacity="0.6" d="M80 70l4 14M84 70l4 14M88 70l4 14"/>
    <rect class="il-metal il-ink" x="87" y="44" width="5" height="36" rx="2.5"/>
    <rect class="il-dark" x="16" y="106" width="8" height="4"/><rect class="il-dark" x="86" y="106" width="8" height="4"/>
    <path class="il-orange il-ink" d="M114 98c-16 4-24-8-20-20 3 7 8 12 18 12z"/>
    <path class="il-orange il-ink" d="M114 92l-8 14h8l4-10zM126 96l2 10h8l-4-12z"/>
    <path class="il-orange il-ink" d="M106 100c4-2 8-2 10 0v6h-12z"/><path class="il-orange il-ink" d="M128 102c4-2 8-2 10 2v2h-12z"/>
    <ellipse class="il-orange il-ink" cx="124" cy="78" rx="14" ry="21" transform="rotate(24 124 78)"/>
    <ellipse class="il-white il-ink il-thin" cx="121" cy="82" rx="7" ry="12" transform="rotate(24 121 82)"/>
    <path class="il-earth-dark" d="M132 66l6 3-6 0zM134 76l6 3-6 0zM132 86l5 3-5 0z"/>
    <path class="il-orange il-ink" d="M128 62L94 53l-1 7 33 9z"/>
    <path class="il-orange il-ink" d="M130 70L94 64l-1 7 35 6z"/>
    <path class="il-earth-dark" d="M110 56l2 6M104 55l2 6M112 67l1 6M104 66l1 6"/>
    <circle class="il-orange il-ink" cx="92" cy="56" r="4"/><circle class="il-orange il-ink" cx="92" cy="67" r="4"/>
    <path class="il-line il-thin" d="M89 55h2M89 66h2"/>
    <path class="il-orange il-ink" d="M126 40l-2-13 10 7zM148 40l2-13-10 7z"/>
    <path class="il-pink" d="M127 36l-1-6 4 3zM147 36l1-6-4 3z"/>
    <circle class="il-orange il-ink" cx="137" cy="48" r="13"/>
    <path class="il-earth-dark" d="M133 36l1 4 2-4zM139 36l0 4 2-4z"/>
    <path class="il-red il-ink il-thin" d="M124.4 42c6-4 19-4 25.2 0v4.4c-6-4-19-4-25.2 0z"/>
    <path class="il-light il-thin" d="M126 44c5-2.6 17-2.6 22 0"/>
    <path class="il-line" d="M127 48l7 2M147 48l-7 2"/>
    <circle class="il-white il-ink il-thin" cx="131" cy="53" r="3.2"/><circle class="il-dark" cx="129.8" cy="53" r="1.5"/><circle class="il-white il-ink il-thin" cx="143" cy="53" r="3.2"/><circle class="il-dark" cx="141.8" cy="53" r="1.5"/>
    <path class="il-pink il-ink il-thin" d="M135 57h4l-2 2z"/>
    <path class="il-white il-ink il-thin" d="M131 61h12v3.4h-12z"/><path class="il-line il-thin" d="M135 61v3.4M139 61v3.4"/>
    <path class="il-line il-thin" d="M128 59l-8-1M128 62l-8 2M146 59l8-1M146 62l8 2"/>
    <ellipse class="il-water il-ink il-thin" cx="152" cy="40" rx="2" ry="3"/>
    <path class="il-line il-thin" d="M106 44l-4-4M110 40l-2-5"/>`,

  // A dense forest of broccoli trees fills the shelf, some grinning slyly; a tiny cherry tomato explorer with a pith helmet and a map stands lost among them, and a new sprout is already growing at the edge.
  'fd.broccoli-forest': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8zM160 0l-10 8v104l10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104M150 8v104"/>
    <path class="il-glow" opacity="0.3" d="M66 8h28l44 96H22z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="2" width="24" height="6" rx="3"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 104h156v5H2z"/>
    <path class="il-light il-thin" d="M8 105.5h30M120 105.5h22"/>
    <rect class="il-water il-ink il-thin" opacity="0.35" x="4" y="109" width="152" height="11" rx="2"/><path class="il-slime il-ink" d="M18.9 104c0.9-5.1 0.9-10.2 0-14.5l-5.1-5.1 2.6-2.6 5.1 4.3v-5.1h4.3v5.1l5.1-4.3 2.6 2.6-5.1 5.1c-0.9 4.3-0.9 9.4 0 14.5z"/><path class="il-light il-thin" opacity="0.6" d="M21.5 102.3v-8.5"/><circle class="il-green il-ink" cx="24" cy="73.4" r="7.7"/><circle class="il-green il-ink" cx="14.7" cy="78.5" r="7.2"/><circle class="il-green il-ink" cx="33.4" cy="78.5" r="7.2"/><circle class="il-green il-ink" cx="18.1" cy="68.3" r="6.8"/><circle class="il-green il-ink" cx="30" cy="67.5" r="6.8"/><circle class="il-green il-ink" cx="11.3" cy="71.7" r="5.5"/><circle class="il-green il-ink" cx="36.8" cy="71.7" r="5.5"/><circle class="il-green il-ink" cx="24" cy="81.9" r="6.8"/><circle class="il-green il-ink" cx="24" cy="64.9" r="5.5"/><circle class="il-grass" cx="16.4" cy="76.8" r="1.1"/><circle class="il-grass" cx="29.1" cy="70" r="1.1"/><circle class="il-grass" cx="34.2" cy="80.2" r="1.1"/><circle class="il-grass" cx="20.6" cy="66.6" r="1.1"/><circle class="il-grass" cx="12.1" cy="71.7" r="1.1"/><circle class="il-grass" cx="26.6" cy="78.5" r="1.1"/><circle class="il-grass" cx="31.7" cy="74.3" r="1.1"/><circle class="il-grass" cx="18.9" cy="81.9" r="1.1"/><path class="il-slime" opacity="0.6" d="M17.2 66.6a4.3 4.3 0 0 1 4.3-2.6"/><path class="il-slime il-ink" d="M54.3 102c1-5.7 1-11.4 0-16.2l-5.7-5.7 2.8-2.8 5.7 4.8v-5.7h4.8v5.7l5.7-4.8 2.8 2.8-5.7 5.7c-1 4.8-1 10.5 0 16.2z"/><path class="il-light il-thin" opacity="0.6" d="M57.2 100.1v-9.5"/><circle class="il-green il-ink" cx="60" cy="67.8" r="8.5"/><circle class="il-green il-ink" cx="49.6" cy="73.5" r="8.1"/><circle class="il-green il-ink" cx="70.5" cy="73.5" r="8.1"/><circle class="il-green il-ink" cx="53.4" cy="62.1" r="7.6"/><circle class="il-green il-ink" cx="66.7" cy="61.2" r="7.6"/><circle class="il-green il-ink" cx="45.8" cy="65.9" r="6.2"/><circle class="il-green il-ink" cx="74.3" cy="65.9" r="6.2"/><circle class="il-green il-ink" cx="60" cy="77.3" r="7.6"/><circle class="il-green il-ink" cx="60" cy="58.3" r="6.2"/><circle class="il-grass" cx="51.5" cy="71.6" r="1.2"/><circle class="il-grass" cx="65.7" cy="64" r="1.2"/><circle class="il-grass" cx="71.4" cy="75.4" r="1.2"/><circle class="il-grass" cx="56.2" cy="60.2" r="1.2"/><circle class="il-grass" cx="46.7" cy="65.9" r="1.2"/><circle class="il-grass" cx="62.9" cy="73.5" r="1.2"/><circle class="il-grass" cx="68.6" cy="68.8" r="1.2"/><circle class="il-grass" cx="54.3" cy="77.3" r="1.2"/><path class="il-slime" opacity="0.6" d="M52.4 60.2a4.8 4.8 0 0 1 4.8-2.8"/><path class="il-slime il-ink" d="M94.6 102c0.9-5.4 0.9-10.8 0-15.3l-5.4-5.4 2.7-2.7 5.4 4.5v-5.4h4.5v5.4l5.4-4.5 2.7 2.7-5.4 5.4c-0.9 4.5-0.9 9.9 0 15.3z"/><path class="il-light il-thin" opacity="0.6" d="M97.3 100.2v-9"/><circle class="il-green il-ink" cx="100" cy="69.6" r="8.1"/><circle class="il-green il-ink" cx="90.1" cy="75" r="7.7"/><circle class="il-green il-ink" cx="109.9" cy="75" r="7.7"/><circle class="il-green il-ink" cx="93.7" cy="64.2" r="7.2"/><circle class="il-green il-ink" cx="106.3" cy="63.3" r="7.2"/><circle class="il-green il-ink" cx="86.5" cy="67.8" r="5.9"/><circle class="il-green il-ink" cx="113.5" cy="67.8" r="5.9"/><circle class="il-green il-ink" cx="100" cy="78.6" r="7.2"/><circle class="il-green il-ink" cx="100" cy="60.6" r="5.9"/><circle class="il-grass" cx="91.9" cy="73.2" r="1.2"/><circle class="il-grass" cx="105.4" cy="66" r="1.2"/><circle class="il-grass" cx="110.8" cy="76.8" r="1.2"/><circle class="il-grass" cx="96.4" cy="62.4" r="1.2"/><circle class="il-grass" cx="87.4" cy="67.8" r="1.2"/><circle class="il-grass" cx="102.7" cy="75" r="1.2"/><circle class="il-grass" cx="108.1" cy="70.5" r="1.2"/><circle class="il-grass" cx="94.6" cy="78.6" r="1.2"/><path class="il-slime" opacity="0.6" d="M92.8 62.4a4.5 4.5 0 0 1 4.5-2.7"/><path class="il-slime il-ink" d="M132.9 104c0.9-5.1 0.9-10.2 0-14.5l-5.1-5.1 2.6-2.6 5.1 4.3v-5.1h4.3v5.1l5.1-4.3 2.6 2.6-5.1 5.1c-0.9 4.3-0.9 9.4 0 14.5z"/><path class="il-light il-thin" opacity="0.6" d="M135.5 102.3v-8.5"/><circle class="il-green il-ink" cx="138" cy="73.4" r="7.7"/><circle class="il-green il-ink" cx="128.7" cy="78.5" r="7.2"/><circle class="il-green il-ink" cx="147.4" cy="78.5" r="7.2"/><circle class="il-green il-ink" cx="132.1" cy="68.3" r="6.8"/><circle class="il-green il-ink" cx="144" cy="67.5" r="6.8"/><circle class="il-green il-ink" cx="125.3" cy="71.7" r="5.5"/><circle class="il-green il-ink" cx="150.8" cy="71.7" r="5.5"/><circle class="il-green il-ink" cx="138" cy="81.9" r="6.8"/><circle class="il-green il-ink" cx="138" cy="64.9" r="5.5"/><circle class="il-grass" cx="130.4" cy="76.8" r="1.1"/><circle class="il-grass" cx="143.1" cy="70" r="1.1"/><circle class="il-grass" cx="148.2" cy="80.2" r="1.1"/><circle class="il-grass" cx="134.6" cy="66.6" r="1.1"/><circle class="il-grass" cx="126.1" cy="71.7" r="1.1"/><circle class="il-grass" cx="140.6" cy="78.5" r="1.1"/><circle class="il-grass" cx="145.7" cy="74.3" r="1.1"/><circle class="il-grass" cx="132.9" cy="81.9" r="1.1"/><path class="il-slime" opacity="0.6" d="M131.2 66.6a4.3 4.3 0 0 1 4.3-2.6"/><path class="il-slime il-ink" d="M28.5 114c1.3-7.5 1.3-15 0-21.3l-7.5-7.5 3.8-3.8 7.5 6.3v-7.5h6.3v7.5l7.5-6.3 3.8 3.8-7.5 7.5c-1.3 6.3-1.3 13.8 0 21.3z"/><path class="il-light il-thin" opacity="0.6" d="M32.3 111.5v-12.5"/><circle class="il-green il-ink" cx="36" cy="69" r="11.3"/><circle class="il-green il-ink" cx="22.3" cy="76.5" r="10.6"/><circle class="il-green il-ink" cx="49.8" cy="76.5" r="10.6"/><circle class="il-green il-ink" cx="27.3" cy="61.5" r="10"/><circle class="il-green il-ink" cx="44.8" cy="60.3" r="10"/><circle class="il-green il-ink" cx="17.3" cy="66.5" r="8.1"/><circle class="il-green il-ink" cx="54.8" cy="66.5" r="8.1"/><circle class="il-green il-ink" cx="36" cy="81.5" r="10"/><circle class="il-green il-ink" cx="36" cy="56.5" r="8.1"/><circle class="il-grass" cx="24.8" cy="74" r="1.6"/><circle class="il-grass" cx="43.5" cy="64" r="1.6"/><circle class="il-grass" cx="51" cy="79" r="1.6"/><circle class="il-grass" cx="31" cy="59" r="1.6"/><circle class="il-grass" cx="18.5" cy="66.5" r="1.6"/><circle class="il-grass" cx="39.8" cy="76.5" r="1.6"/><circle class="il-grass" cx="47.3" cy="70.3" r="1.6"/><circle class="il-grass" cx="28.5" cy="81.5" r="1.6"/><path class="il-slime" opacity="0.6" d="M26 59a6.3 6.3 0 0 1 6.3-3.8"/><circle class="il-white il-ink il-thin" cx="29.8" cy="74" r="3.8"/><circle class="il-dark" cx="30.8" cy="74.3" r="1.7"/><circle class="il-white il-ink il-thin" cx="42.3" cy="74" r="3.8"/><circle class="il-dark" cx="43.3" cy="74.3" r="1.7"/>
    <path class="il-line il-thin" d="M24.8 67.8l5 1.9M47.3 67.8l-5 1.9"/>
    <path class="il-dark il-ink il-thin" d="M29.8 82.8q6.3 6.3 12.5 0z"/><path class="il-slime il-ink" d="M77.3 116c1.5-8.7 1.5-17.4 0-24.7l-8.7-8.7 4.4-4.4 8.7 7.3v-8.7h7.3v8.7l8.7-7.3 4.4 4.4-8.7 8.7c-1.5 7.3-1.5 16 0 24.7z"/><path class="il-light il-thin" opacity="0.6" d="M81.7 113.1v-14.5"/><circle class="il-green il-ink" cx="86" cy="63.8" r="13.1"/><circle class="il-green il-ink" cx="70.1" cy="72.5" r="12.3"/><circle class="il-green il-ink" cx="102" cy="72.5" r="12.3"/><circle class="il-green il-ink" cx="75.9" cy="55.1" r="11.6"/><circle class="il-green il-ink" cx="96.2" cy="53.7" r="11.6"/><circle class="il-green il-ink" cx="64.3" cy="60.9" r="9.4"/><circle class="il-green il-ink" cx="107.8" cy="60.9" r="9.4"/><circle class="il-green il-ink" cx="86" cy="78.3" r="11.6"/><circle class="il-green il-ink" cx="86" cy="49.3" r="9.4"/><circle class="il-grass" cx="73" cy="69.6" r="1.9"/><circle class="il-grass" cx="94.7" cy="58" r="1.9"/><circle class="il-grass" cx="103.4" cy="75.4" r="1.9"/><circle class="il-grass" cx="80.2" cy="52.2" r="1.9"/><circle class="il-grass" cx="65.7" cy="60.9" r="1.9"/><circle class="il-grass" cx="90.4" cy="72.5" r="1.9"/><circle class="il-grass" cx="99.1" cy="65.3" r="1.9"/><circle class="il-grass" cx="77.3" cy="78.3" r="1.9"/><path class="il-slime" opacity="0.6" d="M74.4 52.2a7.3 7.3 0 0 1 7.3-4.4"/><circle class="il-white il-ink il-thin" cx="78.8" cy="69.6" r="4.4"/><circle class="il-dark" cx="77.8" cy="69.9" r="2"/><circle class="il-white il-ink il-thin" cx="93.3" cy="69.6" r="4.4"/><circle class="il-dark" cx="92.3" cy="69.9" r="2"/>
    <path class="il-line il-thin" d="M73 62.4l5.8 2.2M99.1 62.4l-5.8 2.2"/>
    <path class="il-dark il-ink il-thin" d="M78.8 79.8q7.3 7.3 14.5 0z"/><path class="il-slime il-ink" d="M124.8 114c1.2-7.2 1.2-14.4 0-20.4l-7.2-7.2 3.6-3.6 7.2 6v-7.2h6v7.2l7.2-6 3.6 3.6-7.2 7.2c-1.2 6-1.2 13.2 0 20.4z"/><path class="il-light il-thin" opacity="0.6" d="M128.4 111.6v-12"/><circle class="il-green il-ink" cx="132" cy="70.8" r="10.8"/><circle class="il-green il-ink" cx="118.8" cy="78" r="10.2"/><circle class="il-green il-ink" cx="145.2" cy="78" r="10.2"/><circle class="il-green il-ink" cx="123.6" cy="63.6" r="9.6"/><circle class="il-green il-ink" cx="140.4" cy="62.4" r="9.6"/><circle class="il-green il-ink" cx="114" cy="68.4" r="7.8"/><circle class="il-green il-ink" cx="150" cy="68.4" r="7.8"/><circle class="il-green il-ink" cx="132" cy="82.8" r="9.6"/><circle class="il-green il-ink" cx="132" cy="58.8" r="7.8"/><circle class="il-grass" cx="121.2" cy="75.6" r="1.6"/><circle class="il-grass" cx="139.2" cy="66" r="1.6"/><circle class="il-grass" cx="146.4" cy="80.4" r="1.6"/><circle class="il-grass" cx="127.2" cy="61.2" r="1.6"/><circle class="il-grass" cx="115.2" cy="68.4" r="1.6"/><circle class="il-grass" cx="135.6" cy="78" r="1.6"/><circle class="il-grass" cx="142.8" cy="72" r="1.6"/><circle class="il-grass" cx="124.8" cy="82.8" r="1.6"/><path class="il-slime" opacity="0.6" d="M122.4 61.2a6 6 0 0 1 6-3.6"/><circle class="il-white il-ink il-thin" cx="126" cy="75.6" r="3.6"/><circle class="il-dark" cx="125" cy="75.9" r="1.7"/><circle class="il-white il-ink il-thin" cx="138" cy="75.6" r="3.6"/><circle class="il-dark" cx="137" cy="75.9" r="1.7"/>
    <path class="il-line il-thin" d="M121.2 69.6l4.8 1.8M142.8 69.6l-4.8 1.8"/>
    <path class="il-dark il-ink il-thin" d="M126 84q6 6 12 0z"/>
    <path class="il-slime il-ink" d="M150.1 106c0.3-1.9 0.3-3.8 0-5.4l-1.9-1.9 1-1 1.9 1.6v-1.9h1.6v1.9l1.9-1.6 1 1-1.9 1.9c-0.3 1.6-0.3 3.5 0 5.4z"/><path class="il-light il-thin" opacity="0.6" d="M151 105.4v-3.2"/><circle class="il-green il-ink" cx="152" cy="94.5" r="2.9"/><circle class="il-green il-ink" cx="148.5" cy="96.4" r="2.7"/><circle class="il-green il-ink" cx="155.5" cy="96.4" r="2.7"/><circle class="il-green il-ink" cx="149.8" cy="92.6" r="2.6"/><circle class="il-green il-ink" cx="154.2" cy="92.2" r="2.6"/><circle class="il-green il-ink" cx="147.2" cy="93.8" r="2.1"/><circle class="il-green il-ink" cx="156.8" cy="93.8" r="2.1"/><circle class="il-green il-ink" cx="152" cy="97.7" r="2.6"/><circle class="il-green il-ink" cx="152" cy="91.3" r="2.1"/><circle class="il-grass" cx="149.1" cy="95.8" r="0.4"/><circle class="il-grass" cx="153.9" cy="93.2" r="0.4"/><circle class="il-grass" cx="155.8" cy="97" r="0.4"/><circle class="il-grass" cx="150.7" cy="91.9" r="0.4"/><circle class="il-grass" cx="147.5" cy="93.8" r="0.4"/><circle class="il-grass" cx="153" cy="96.4" r="0.4"/><circle class="il-grass" cx="154.9" cy="94.8" r="0.4"/><circle class="il-grass" cx="150.1" cy="97.7" r="0.4"/><path class="il-slime" opacity="0.6" d="M149.4 91.9a1.6 1.6 0 0 1 1.6-1"/>
    <path class="il-line il-thin" d="M148 86l-2-3M152 85v-4M156 86l2-3"/>
    <circle class="il-red il-ink" cx="62" cy="108" r="7"/>
    <path class="il-light il-thin" d="M58 106a4 4 0 0 1 3-3"/>
    <path class="il-paper il-ink il-thin" d="M54 102c0-6 4-8 8-8s8 2 8 8z"/><path class="il-paper il-ink il-thin" d="M51 102h22"/>
    <circle class="il-white il-ink il-thin" cx="59.6" cy="107" r="2"/><circle class="il-dark" cx="59.2" cy="107" r="0.9"/><circle class="il-white il-ink il-thin" cx="64.6" cy="107" r="2"/><circle class="il-dark" cx="65" cy="107" r="0.9"/>
    <path class="il-line il-thin" d="M60 112q2-1 4 0"/>
    <rect class="il-white il-ink il-thin" x="68" y="104" width="12" height="9" transform="rotate(12 74 108)"/>
    <path class="il-line il-thin" d="M70 107l3 2 3-3 2 2M71 111l6 0" opacity="0.7" transform="rotate(12 74 108)"/>
    <path class="il-line" d="M60 88c0-4 6-4 6 0 0 3-3 3-3 6"/><circle class="il-dark" cx="63" cy="98" r="1.2"/>`,

  // BANG! The fridge door slams shut with gritted teeth and furious eyebrows, a cold puff squirting from the seal and a spark at the top; the nosy pyjama kid lands on the floor with spinning eyes while his top hat sails off.
  'fd.slamming-door': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 18h160M0 38h160M0 58h160M0 78h160M20 0v102M60 0v102M100 0v102M140 0v102"/>
    <path class="il-wood" d="M0 102h160v18H0z"/>
    <path class="il-line il-thin" d="M0 102h160"/>
    <rect class="il-white il-ink" x="74" y="4" width="76" height="102" rx="6"/>
    <path class="il-line" d="M74 32h76"/>
    <rect class="il-metal il-ink il-thin" x="80" y="12" width="4" height="14" rx="2"/>
    <rect class="il-metal il-ink" x="79" y="40" width="5" height="30" rx="2.5"/>
    <path class="il-light il-thin" d="M144 10v18M144 38v60"/>
    <rect class="il-dark" x="78" y="106" width="8" height="4"/><rect class="il-dark" x="138" y="106" width="8" height="4"/>
    <path class="il-line il-thick" d="M90 50l14 5M142 50l-14 5"/>
    <circle class="il-white il-ink il-thin" cx="102" cy="60" r="5.5"/><circle class="il-dark" cx="101" cy="60.6" r="2.5"/><circle class="il-white il-ink il-thin" cx="130" cy="60" r="5.5"/><circle class="il-dark" cx="129" cy="60.6" r="2.5"/>
    <rect class="il-white il-ink" x="96" y="72" width="40" height="12" rx="3"/>
    <path class="il-line il-thin" d="M96 78h40M103 72v12M110 72v12M117 72v12M124 72v12M131 72v12"/>
    <path class="il-line" d="M152 20l4-2M152 50h6M152 80l4 2"/>
    <path class="il-yellow il-ink il-thin" d="M118 0l-6 8h5l-5 8 12-10h-5l5-6z"/>
    <polygon class="il-yellow il-ink" points="84.7 53.4 75 53.9 79.5 62.5 71.3 57.3 69.9 66.9 66.4 57.8 59.6 64.8 62.1 55.4 52.5 57.1 60.1 50.9 51.3 46.6 61 46.1 56.5 37.5 64.7 42.7 66.1 33.1 69.6 42.2 76.4 35.2 73.9 44.6 83.5 42.9 75.9 49.1"/>
    <polygon class="il-orange il-ink" points="75 53.8 70.5 53.1 70.3 57.7 67.6 54 64.2 57 64.9 52.5 60.3 52.3 64 49.6 61 46.2 65.5 46.9 65.7 42.3 68.4 46 71.8 43 71.1 47.5 75.7 47.7 72 50.4"/>
    <circle class="il-smoke il-ink il-thin" cx="70" cy="94" r="6"/><circle class="il-smoke il-ink il-thin" cx="62" cy="88" r="4.5"/><circle class="il-smoke il-ink il-thin" cx="64" cy="100" r="4"/>
    <path class="il-light il-thin" d="M60 92l-3-2"/>
    <path class="il-blue il-ink" d="M14 102c0-10 4-18 14-20h10c6 4 8 10 8 20z"/>
    <path class="il-blue il-ink" d="M40 96l18 2v6l-18 2z"/>
    <path class="il-skin il-ink" d="M58 97c3 0 5 1.5 5 4s-2 4-5 4z"/>
    <path class="il-blue il-ink" d="M18 92l-8 8 4 4 8-6z"/>
    <circle class="il-skin il-ink il-thin" cx="11" cy="103" r="3"/>
    <path class="il-white il-ink il-thin" d="M30 82l4 8 4-8"/>
    <circle class="il-skin il-ink" cx="32" cy="70" r="12"/>
    <path class="il-earth-dark il-ink il-thin" d="M20 68c0-9 6-12 12-12s12 3 12 10c-4-3-8-4-12-4s-8 2-12 6z"/>
    <circle class="il-line il-thin" cx="27" cy="70" r="3"/><circle class="il-line il-thin" cx="27" cy="70" r="1.2"/>
    <circle class="il-line il-thin" cx="37" cy="70" r="3"/><circle class="il-line il-thin" cx="37" cy="70" r="1.2"/>
    <ellipse class="il-dark" cx="32" cy="77" rx="2.2" ry="2.6"/>
    <path class="il-yellow il-ink il-thin" d="M14 52l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="il-yellow il-ink il-thin" d="M48 50.5l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1z"/><path class="il-yellow il-ink il-thin" d="M30 47l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/>
    <path class="il-line il-thin" d="M18 60c6-6 22-6 28 0"/>
    <g transform="rotate(-24 38 24)">
      <rect class="il-dark il-ink" x="24" y="30" width="28" height="4" rx="2"/>
      <rect class="il-dark il-ink" x="30" y="12" width="16" height="19" rx="1"/>
      <rect class="il-red" x="31" y="25" width="14" height="3.4"/>
      <path class="il-light il-thin" d="M33 15v8"/>
    </g>
    <path class="il-line il-thin" d="M34 44l-2-5M42 44l0-6M26 42l-4-4"/>`,

  // Seen from inside the fridge: a whole crowd of family faces with wide-open drooling mouths fills the doorway, forks reaching in, while a cheese wedge and a yoghurt huddle together on the last shelf.
  'fd.sunday-breakfast': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 30h160M0 60h160M50 0v90M110 0v90"/>
    <circle class="il-skin il-ink" cx="26" cy="50" r="15"/>
    <path class="il-dark il-ink il-thin" d="M11 48c0-13.5 7.5-18 15 -18s15 4.5 15 18c-7.5-6-18-9-15-9s-22.5 3-15 9z"/>
    <circle class="il-white il-ink il-thin" cx="20.6" cy="49.3" r="3.3"/><circle class="il-dark" cx="20.6" cy="50.5" r="1.5"/><circle class="il-white il-ink il-thin" cx="31.4" cy="49.3" r="3.3"/><circle class="il-dark" cx="31.4" cy="50.5" r="1.5"/>
    <path class="il-dark il-ink il-thin" d="M19 54.2h14c0 7.5-3.5 9.3-7 9.3s-7-1.8-7-9.3z"/>
    <ellipse class="il-red" cx="26" cy="60.8" rx="3.5" ry="1.8"/>
    <ellipse class="il-water il-ink il-thin" cx="30.9" cy="65.3" rx="1.4" ry="2"/>
    <circle class="il-skin il-ink" cx="134" cy="52" r="14"/>
    <path class="il-red il-ink il-thin" d="M120 50c0-12.6 7-16.8 14 -16.8s14 4.2 14 16.8c-7-5.6-16.8-8.4-14-8.4s-21 2.8-14 8.4z"/>
    <circle class="il-white il-ink il-thin" cx="129" cy="51.3" r="3.1"/><circle class="il-dark" cx="129" cy="52.4" r="1.4"/><circle class="il-white il-ink il-thin" cx="139" cy="51.3" r="3.1"/><circle class="il-dark" cx="139" cy="52.4" r="1.4"/>
    <path class="il-dark il-ink il-thin" d="M127.5 55.9h13c0 7-3.3 8.7-6.5 8.7s-6.5-1.7-6.5-8.7z"/>
    <ellipse class="il-red" cx="134" cy="62.1" rx="3.3" ry="1.7"/>
    <ellipse class="il-water il-ink il-thin" cx="138.6" cy="66.3" rx="1.4" ry="2"/>
    <circle class="il-skin il-ink" cx="56" cy="38" r="16"/>
    <path class="il-gold il-ink il-thin" d="M40 36c0-14.4 8-19.2 16 -19.2s16 4.8 16 19.2c-8-6.4-19.2-9.6-16-9.6s-24 3.2-16 9.6z"/>
    <circle class="il-white il-ink il-thin" cx="50.2" cy="37.2" r="3.5"/><circle class="il-dark" cx="50.2" cy="38.5" r="1.6"/><circle class="il-white il-ink il-thin" cx="61.8" cy="37.2" r="3.5"/><circle class="il-dark" cx="61.8" cy="38.5" r="1.6"/>
    <path class="il-dark il-ink il-thin" d="M48 42.5h16c0 8-4 9.9-8 9.9s-8-1.9-8-9.9z"/>
    <ellipse class="il-red" cx="56" cy="49.5" rx="4" ry="1.9"/>
    <ellipse class="il-water il-ink il-thin" cx="61.6" cy="54.3" rx="1.4" ry="2"/>
    <circle class="il-skin il-ink" cx="106" cy="38" r="16"/>
    <path class="il-grey il-ink il-thin" d="M90 36c0-14.4 8-19.2 16 -19.2s16 4.8 16 19.2c-8-6.4-19.2-9.6-16-9.6s-24 3.2-16 9.6z"/>
    <circle class="il-white il-ink il-thin" cx="100.2" cy="37.2" r="3.5"/><circle class="il-dark" cx="100.2" cy="38.5" r="1.6"/><circle class="il-white il-ink il-thin" cx="111.8" cy="37.2" r="3.5"/><circle class="il-dark" cx="111.8" cy="38.5" r="1.6"/>
    <path class="il-dark il-ink il-thin" d="M98 42.5h16c0 8-4 9.9-8 9.9s-8-1.9-8-9.9z"/>
    <ellipse class="il-red" cx="106" cy="49.5" rx="4" ry="1.9"/>
    <ellipse class="il-water il-ink il-thin" cx="111.6" cy="54.3" rx="1.4" ry="2"/><path class="il-beard il-ink il-thin" d="M92 46c2 12 26 12 28 0-4 8-24 8-28 0z"/>
    <circle class="il-skin il-ink" cx="82" cy="30" r="17"/>
    <path class="il-earth-dark il-ink il-thin" d="M65 28c0-15.3 8.5-20.4 17 -20.4s17 5.1 17 20.4c-8.5-6.8-20.4-10.2-17-10.2s-25.5 3.4-17 10.2z"/>
    <circle class="il-white il-ink il-thin" cx="75.9" cy="29.2" r="3.7"/><circle class="il-dark" cx="75.9" cy="30.5" r="1.7"/><circle class="il-white il-ink il-thin" cx="88.1" cy="29.2" r="3.7"/><circle class="il-dark" cx="88.1" cy="30.5" r="1.7"/>
    <path class="il-dark il-ink il-thin" d="M73 34.8h18c0 8.5-4.5 10.5-9 10.5s-9-2-9-10.5z"/>
    <ellipse class="il-red" cx="82" cy="42.2" rx="4.5" ry="2"/>
    <ellipse class="il-water il-ink il-thin" cx="88.3" cy="47.3" rx="1.4" ry="2"/>
    <circle class="il-skin il-ink" cx="80" cy="70" r="11"/>
    <path class="il-yellow il-ink il-thin" d="M69 68c0-9.9 5.5-13.2 11 -13.2s11 3.3 11 13.2c-5.5-4.4-13.2-6.6-11-6.6s-16.5 2.2-11 6.6z"/>
    <circle class="il-white il-ink il-thin" cx="76" cy="69.5" r="2.4"/><circle class="il-dark" cx="76" cy="70.3" r="1.1"/><circle class="il-white il-ink il-thin" cx="84" cy="69.5" r="2.4"/><circle class="il-dark" cx="84" cy="70.3" r="1.1"/>
    <path class="il-dark il-ink il-thin" d="M74 73.1h12c0 5.5-3 6.8-6 6.8s-6-1.3-6-6.8z"/>
    <ellipse class="il-red" cx="80" cy="77.9" rx="3" ry="1.3"/>
    <ellipse class="il-water il-ink il-thin" cx="84.2" cy="81.2" rx="1.4" ry="2"/>
    <circle class="il-skin il-ink" cx="46" cy="74" r="10"/>
    <path class="il-wood-dark il-ink il-thin" d="M36 72c0-9 5-12 10 -12s10 3 10 12c-5-4-12-6-10-6s-15 2-10 6z"/>
    <circle class="il-white il-ink il-thin" cx="42.4" cy="73.5" r="2.2"/><circle class="il-dark" cx="42.4" cy="74.3" r="1"/><circle class="il-white il-ink il-thin" cx="49.6" cy="73.5" r="2.2"/><circle class="il-dark" cx="49.6" cy="74.3" r="1"/>
    <path class="il-dark il-ink il-thin" d="M41 76.8h10c0 5-2.5 6.2-5 6.2s-5-1.2-5-6.2z"/>
    <ellipse class="il-red" cx="46" cy="81.2" rx="2.5" ry="1.2"/>
    <ellipse class="il-water il-ink il-thin" cx="49.5" cy="84.2" rx="1.4" ry="2"/>
    <circle class="il-skin il-ink" cx="116" cy="74" r="10"/>
    <path class="il-dark il-ink il-thin" d="M106 72c0-9 5-12 10 -12s10 3 10 12c-5-4-12-6-10-6s-15 2-10 6z"/>
    <circle class="il-white il-ink il-thin" cx="112.4" cy="73.5" r="2.2"/><circle class="il-dark" cx="112.4" cy="74.3" r="1"/><circle class="il-white il-ink il-thin" cx="119.6" cy="73.5" r="2.2"/><circle class="il-dark" cx="119.6" cy="74.3" r="1"/>
    <path class="il-dark il-ink il-thin" d="M111 76.8h10c0 5-2.5 6.2-5 6.2s-5-1.2-5-6.2z"/>
    <ellipse class="il-red" cx="116" cy="81.2" rx="2.5" ry="1.2"/>
    <ellipse class="il-water il-ink il-thin" cx="119.5" cy="84.2" rx="1.4" ry="2"/>
    <path class="il-blue il-ink" d="M18 86l18 4-2 6-18-4z"/><path class="il-green il-ink" d="M144 84l-18 6 2 6 18-6z"/>
    <circle class="il-skin il-ink" cx="38" cy="93" r="4"/><circle class="il-skin il-ink" cx="124" cy="93" r="4"/>
    <path class="il-metal il-ink il-thin" d="M41 92l14 5-1 2-14-5z"/><path class="il-metal il-ink il-thin" d="M54 95l5 1-1 5-6-2z"/><path class="il-line il-thin" d="M59 97l4 1.4M58 99.5l4 1.4"/>
    <path class="il-metal il-ink il-thin" d="M121 92l-14 5 1 2 14-5z"/><path class="il-metal il-ink il-thin" d="M108 95l-5 1 1 5 6-2z"/><path class="il-line il-thin" d="M103 97l-4 1.4M104 99.5l-4 1.4"/>
    <path class="il-white il-ink" d="M0 0h160v10H0z"/><path class="il-white il-ink" d="M0 0h10v120H0zM150 0h10v120h-10z"/>
    <path class="il-glow" opacity="0.4" d="M10 10h140v6H10z"/>
    <rect class="il-white il-ink" x="0" y="104" width="160" height="16"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M10 100h140v5H10z"/>
    <path class="il-yellow il-ink" d="M66 100h18V86z"/><circle class="il-gold" cx="72" cy="96" r="1.5"/><circle class="il-gold" cx="80" cy="92" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="95" r="2"/><circle class="il-dark" cx="73.4" cy="95" r="0.9"/><circle class="il-white il-ink il-thin" cx="79" cy="95" r="2"/><circle class="il-dark" cx="78.4" cy="95" r="0.9"/>
    <path class="il-white il-ink" d="M86 100l2-12h12l2 12z"/><path class="il-pink il-ink il-thin" d="M86.6 94h14.8l1 4h-16.6z"/>
    <path class="il-metal il-ink il-thin" d="M87 88c2-3 12-3 14 0z"/>
    <circle class="il-white il-ink il-thin" cx="91" cy="92" r="2"/><circle class="il-dark" cx="91.6" cy="92" r="0.9"/><circle class="il-white il-ink il-thin" cx="96" cy="92" r="2"/><circle class="il-dark" cx="96.6" cy="92" r="0.9"/>
    <path class="il-skin il-ink il-thin" d="M83 94l4-1M86 96l-4 1"/>
    <path class="il-line il-thin" d="M64 88l-3-2M64 94h-4M104 90l3-2M104 96h4"/>`,

  // An ancient yoghurt pot with a bulging, mould-spotted lid, a long white beard, round spectacles and a walking stick stares unblinkingly; its date is just a smudge, and a fresh little yoghurt beside it sweats nervously under a cobweb.
  'fd.ageless-yoghurt': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8zM160 0l-10 8v104l10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104M150 8v104"/>
    <path class="il-glow" opacity="0.3" d="M66 8h28l44 96H22z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="2" width="24" height="6" rx="3"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 104h156v5H2z"/>
    <path class="il-light il-thin" d="M8 105.5h30M120 105.5h22"/>
    <rect class="il-smoke" opacity="0.35" x="10" y="8" width="140" height="96"/>
    <path class="il-line il-thin" opacity="0.6" d="M10 8l18 24M10 8l26 12M10 8l8 28M14 14q6-1 8-6M18 20q10-2 12-10M20 26q12-2 16-16"/>
    <path class="il-white il-ink il-thin" d="M18 104l2-18h16l2 18z"/><path class="il-blue il-ink il-thin" d="M19 92h18l0.6 6H18.4z"/>
    <rect class="il-metal il-ink il-thin" x="16" y="83" width="24" height="4" rx="1"/>
    <circle class="il-white il-ink il-thin" cx="24" cy="94" r="2.2"/><circle class="il-dark" cx="25" cy="94" r="1"/><circle class="il-white il-ink il-thin" cx="31" cy="94" r="2.2"/><circle class="il-dark" cx="32" cy="94" r="1"/>
    <ellipse class="il-water il-ink il-thin" cx="15" cy="82" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" d="M12 96l-2 0M12 100l-2 1"/>
    <path class="il-white il-ink" d="M46 42h68l-8 62H54z"/>
    <path class="il-pink il-ink il-thin" d="M47.6 56h64.8l-2.6 20H50.2z"/>
    <path class="il-red il-ink il-thin" d="M102 62c-4 0-5 4-3 8l3 3 3-3c2-4 1-8-3-8z"/><path class="il-green" d="M100 61l2 2 2-2z"/>
    <path class="il-smoke il-ink il-thin" d="M56 86c4-3 10-2 14 0 2 3 0 7-4 8-4 1-10 0-11-3z"/>
    <path class="il-line il-thin" opacity="0.5" d="M58 88l9 1M59 91l6 0"/>
    <path class="il-metal il-ink" d="M42 42c0-18 76-18 76 0z"/>
    <path class="il-metal il-ink il-thin" d="M116 40l10-5 3 6-11 3z"/>
    <path class="il-light il-thin" d="M54 34c6-4 16-6 22-6"/>
    <circle class="il-slime il-ink il-thin" cx="62" cy="36" r="3.6"/><circle class="il-green" cx="62" cy="36" r="1.4"/>
    <circle class="il-slime il-ink il-thin" cx="96" cy="32" r="4.4"/><circle class="il-green" cx="97" cy="33" r="1.8"/>
    <circle class="il-slime il-ink il-thin" cx="104" cy="38" r="2.4"/><circle class="il-slime" cx="80" cy="30" r="1.6"/>
    <path class="il-line il-thin" d="M58 22q-3-4 0-8t0-8M80 18q-3-4 0-8t0-6M102 22q-3-4 0-8t0-8"/>
    <path class="il-beard il-ink il-thin" d="M58 48c4-4 10-4 14 0-4-1-8 0-10 2zM88 48c4-4 10-4 14 0-4-1-8 0-10 2z" />
    <circle class="il-white il-ink" cx="68" cy="56" r="7.5"/><circle class="il-dark" cx="68" cy="56" r="1.8"/>
    <circle class="il-white il-ink" cx="92" cy="56" r="7.5"/><circle class="il-dark" cx="92" cy="56" r="1.8"/>
    <circle class="il-line il-thin" cx="68" cy="56" r="9.5"/><circle class="il-line il-thin" cx="92" cy="56" r="9.5"/><path class="il-line il-thin" d="M77.5 56h5"/>
    <path class="il-line il-thin" opacity="0.6" d="M62 66l2 2M98 66l-2 2"/>
    <path class="il-beard il-ink" d="M66 70c4 0 10-2 14-1 4-1 10 1 14 1-2 18-6 30-14 40-8-10-12-22-14-40z"/>
    <path class="il-beard il-ink il-thin" d="M80 68c-6-2-14 0-16 6 4-2 10-2 16-1 6-1 12-1 16 1-2-6-10-8-16-6z"/>
    <path class="il-line il-thin" opacity="0.5" d="M76 80l2 12M84 80l-2 14M80 76v20"/>
    <path class="il-line" d="M114 72l8 2"/>
    <path class="il-wood-dark il-ink il-thin" d="M122 70v34h3V70c0-6-8-8-10-3l2 1c1-3 5-2 5 2z"/>
    <path class="il-line il-thin" opacity="0.5" d="M16 112h4M140 112h6M108 110h3"/>`,

  // A furious frost-flecked crab inside a deli jar braces its legs and shoves the lid up crooked with both pincers, eye stalks glaring; olives sit in the next jar.
  'fd.deli-crab': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8zM160 0l-10 8v104l10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104M150 8v104"/>
    <path class="il-glow" opacity="0.3" d="M66 8h28l44 96H22z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="2" width="24" height="6" rx="3"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 104h156v5H2z"/>
    <path class="il-light il-thin" d="M8 105.5h30M120 105.5h22"/>
    <rect class="il-water il-ink il-thin" opacity="0.4" x="126" y="72" width="22" height="32" rx="5"/>
    <rect class="il-red il-ink il-thin" x="127" y="66" width="20" height="7" rx="2"/>
    <circle class="il-green il-ink il-thin" cx="132" cy="94" r="3.4"/><circle class="il-green il-ink il-thin" cx="140" cy="98" r="3.4"/><circle class="il-green il-ink il-thin" cx="141" cy="88" r="3.4"/><circle class="il-green il-ink il-thin" cx="133" cy="84" r="3.4"/>
    <circle class="il-red" cx="132" cy="94" r="1"/><circle class="il-red" cx="140" cy="98" r="1"/><circle class="il-red" cx="141" cy="88" r="1"/>
    <path class="il-red il-ink il-thin" d="M58 82l-10 4-4 12 3 1 5-10 8-3zM58 88l-8 6-2 10 3 0 3-8 6-4zM102 82l10 4 4 12-3 1-5-10-8-3zM102 88l8 6 2 10-3 0-3-8-6-4z"/>
    <path class="il-red il-ink" d="M62 68l-6-24 6-2 8 24zM98 68l6-24-6-2-8 24z"/>
    <ellipse class="il-red il-ink" cx="80" cy="80" rx="24" ry="15"/>
    <path class="il-orange" opacity="0.7" d="M62 76c8-6 28-6 36 0-10-2-26-2-36 0z"/>
    <circle class="il-white" cx="66" cy="84" r="1.4"/><circle class="il-white" cx="94" cy="86" r="1.4"/><circle class="il-white" cx="74" cy="90" r="1"/><circle class="il-white" cx="88" cy="74" r="1.2"/>
    <path class="il-line" d="M72 68l-2-8M88 68l2-8"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="57" r="4.4"/><circle class="il-dark" cx="70.6" cy="57.6" r="2"/><circle class="il-white il-ink il-thin" cx="90" cy="57" r="4.4"/><circle class="il-dark" cx="89.4" cy="57.6" r="2"/>
    <path class="il-line il-thick" d="M64 50l9 4M96 50l-9 4"/>
    <path class="il-line" d="M72 86q8-6 16 0"/>
    <path class="il-white il-ink il-thin" d="M72 95l2 5 2-5M84 95l2 5 2-5"/>
    <path class="il-red il-ink il-thin" d="M104 52l3 3M107 52l-3 3M102 53.5h7M105.5 50v7" opacity="0"/>
    <path class="il-line" d="M106 48l3-3M106 54l4 1M112 48l1 4"/>
    <rect class="il-water" opacity="0.35" x="42" y="38" width="76" height="66" rx="12"/>
    <rect class="il-water" opacity="0.35" x="48" y="30" width="64" height="10" rx="2"/>
    <path class="il-line" d="M54 38c-8 0-12 4-12 12v42c0 8 4 12 12 12h52c8 0 12-4 12-12V50c0-8-4-12-12-12M48 30v8h64v-8"/>
    <path class="il-line il-thin" d="M50 34h60"/>
    <path class="il-light" d="M48 52v34M52 50v6"/>
    <path class="il-white" opacity="0.8" d="M44 96c4 2 8 4 14 4-6 2-10 0-14-4zM112 46c2 2 3 6 3 10-2-4-3-6-3-10z"/>
    <path class="il-light il-thin" d="M108 92l4 4M112 92l-4 4M110 90v8M46 64l3 3M49 64l-3 3"/>
    <g transform="rotate(-14 80 24)">
      <rect class="il-gold il-ink" x="44" y="18" width="72" height="11" rx="3"/>
      <path class="il-line il-thin" d="M50 21v5M56 21v5M62 21v5M68 21v5M74 21v5M80 21v5M86 21v5M92 21v5M98 21v5M104 21v5M110 21v5"/>
    </g>
    <path class="il-red il-ink" d="M48 34c-2-8 4-14 10-12-2 3-1 6 2 8 3-3 8-2 9 2 1 6-8 10-14 9z"/>
    <path class="il-red il-ink" d="M112 34c2-8-4-14-10-12 2 3 1 6-2 8-3-3-8-2-9 2-1 6 8 10 14 9z"/>
    <path class="il-line il-thin" d="M30 22l-4-3M32 30h-5M128 8l3 4"/>`,

  // A furious red cabbage with a huge mouth full of pointy teeth leaps out of its side-dish bowl and chomps a fork until it bends; drool drips on the shelf.
  'fd.biting-cabbage': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8zM160 0l-10 8v104l10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104M150 8v104"/>
    <path class="il-glow" opacity="0.3" d="M66 8h28l44 96H22z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="2" width="24" height="6" rx="3"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 104h156v5H2z"/>
    <path class="il-light il-thin" d="M8 105.5h30M120 105.5h22"/>
    <path class="il-line il-thin" d="M18 82c4-10 12-18 26-22M24 90c4-8 10-14 20-18"/>
    <ellipse class="il-smoke" opacity="0.8" cx="96" cy="104" rx="26" ry="3"/>
    <path class="il-purple il-ink" d="M96 25A6.6 6.6 0 0 1 107.3 27A6.6 6.6 0 0 1 117.2 32.7A6.6 6.6 0 0 1 124.6 41.5A6.6 6.6 0 0 1 128.5 52.3A6.6 6.6 0 0 1 128.5 63.7A6.6 6.6 0 0 1 124.6 74.5A6.6 6.6 0 0 1 117.2 83.3A6.6 6.6 0 0 1 107.3 89A6.6 6.6 0 0 1 96 91A6.6 6.6 0 0 1 84.7 89A6.6 6.6 0 0 1 74.8 83.3A6.6 6.6 0 0 1 67.4 74.5A6.6 6.6 0 0 1 63.5 63.7A6.6 6.6 0 0 1 63.5 52.3A6.6 6.6 0 0 1 67.4 41.5A6.6 6.6 0 0 1 74.8 32.7A6.6 6.6 0 0 1 84.7 27A6.6 6.6 0 0 1 96 25z"/>
    <path class="il-white il-ink il-thin" d="M90 92h12l-2 7h-8z"/>
    <path class="il-light il-thin" opacity="0.7" d="M96 25c-4 6-4 12 0 16M84 28c2 4 6 6 10 6M108 28c-2 4-6 6-10 6"/>
    <path class="il-purple il-ink" d="M96 92c-20 0-34-14-34-34 0-10 4-18 10-24-2 10-2 20 4 30 6 10 14 18 20 28z"/>
    <path class="il-purple il-ink" d="M96 92c20 0 34-14 34-34 0-10-4-18-10-24 2 10 2 20-4 30-6 10-14 18-20 28z"/>
    <path class="il-light il-thin" opacity="0.7" d="M66 44c0 14 8 28 22 42M66 56l-2 4M70 68l-4 2M120 44c0 14-8 28-22 42M126 56l2 4M122 68l4 2"/>
    <path class="il-purple il-ink il-thin" d="M84 30c2-10 10-12 14-8 2-6 10-6 12 2-6-2-10 0-12 4-4-2-8-2-14 2z"/>
    <path class="il-line il-thick" d="M76 38l13 6M116 38l-13 6"/>
    <circle class="il-white il-ink il-thin" cx="84" cy="48" r="6"/><circle class="il-dark" cx="84" cy="49" r="2.8"/><circle class="il-white il-ink il-thin" cx="108" cy="48" r="6"/><circle class="il-dark" cx="108" cy="49" r="2.8"/>
    <path class="il-dark il-ink" d="M70 60c10 6 42 6 52 0 0 16-12 26-26 26S70 76 70 60z"/>
    <path class="il-white il-ink il-thin" d="M72 61.5l4 6 3-4.6 4 6 4-5.4 4 6 4-6 4 6 4-5.4 4 6 3-4.6 4 6 4-6.6c-12 4-36 4-52 2.6z"/>
    <path class="il-white il-ink il-thin" d="M80 82l3-5 3 5 3-6 3 6 3-6 3 6 3-6 3 6 3-5 3 5c-8 3-24 3-30 0z"/>
    <g transform="rotate(14 118 70)">
      <rect class="il-metal il-ink il-thin" x="108" y="68" width="34" height="3.6" rx="1.8"/>
      <path class="il-metal il-ink il-thin" d="M141 66.6h6v6.4h-6z"/>
      <path class="il-metal il-ink il-thin" d="M147 67l4-6 1.6 1-4 6zM147 69.4l5-4 1 1.4-5 4zM147 71.8l6-2 .6 1.6-6 2z"/>
    </g>
    <ellipse class="il-water il-ink il-thin" cx="82" cy="92" rx="1.8" ry="2.8"/><ellipse class="il-water il-ink il-thin" cx="104" cy="94" rx="1.6" ry="2.4"/>
    <path class="il-white il-ink" d="M10 90h40c0 10-8 14-20 14S10 100 10 90z"/>
    <path class="il-light il-thin" d="M16 94c4 4 8 5 14 5"/>
    <path class="il-purple il-ink il-thin" d="M18 90c2-4 6-4 8 0zM30 90c2-5 8-5 10 0z"/>
    <path class="il-line il-thin" d="M20 72l-3-3M28 68v-4M36 70l3-3"/>`,

  // The microwave next to the fridge beeps like mad from its glowing display; its window is a toothy grinning mouth in which a rubber duck slowly melts, while the fridge beside it squeezes its eyes shut under red earmuffs.
  'fd.microwave-next-door': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 18h160M0 38h160M0 58h160M0 78h160M20 0v98M60 0v98M100 0v98M140 0v98"/>
    <path class="il-grey" d="M0 98h160v22H0z"/>
    <path class="il-line il-thin" d="M0 98h160"/>
    <rect class="il-wood il-ink" x="40" y="96" width="120" height="8"/>
    <rect class="il-white il-ink" x="0" y="0" width="40" height="120"/>
    <path class="il-line" d="M0 30h40"/>
    <rect class="il-metal il-ink il-thin" x="32" y="40" width="4" height="26" rx="2"/>
    <path class="il-line" d="M2 52c0-24 36-24 36 0" />
    <ellipse class="il-red il-ink" cx="3" cy="54" rx="4" ry="7"/><ellipse class="il-red il-ink" cx="37" cy="54" rx="4" ry="7"/>
    <path class="il-line" d="M10 52l5 2-5 2M30 52l-5 2 5 2"/>
    <path class="il-line" d="M9 46l6 3M31 46l-6 3"/>
    <path class="il-white il-ink il-thin" d="M12 64h16v5H12z"/><path class="il-line il-thin" d="M16 64v5M20 64v5M24 64v5"/>
    <circle class="il-yellow il-ink il-thin" cx="12" cy="90" r="3"/><rect class="il-blue il-ink il-thin" x="22" y="84" width="7" height="7" rx="1.5"/>
    <rect class="il-metal il-ink" x="48" y="22" width="108" height="74" rx="6"/>
    <path class="il-line il-thin" d="M102 26h18M102 29h18"/>
    <circle class="il-smoke il-ink il-thin" cx="64" cy="14" r="5"/><circle class="il-smoke il-ink il-thin" cx="72" cy="10" r="4"/><circle class="il-smoke il-ink il-thin" cx="58" cy="8" r="3"/>
    <circle class="il-white il-ink il-thin" cx="70" cy="37" r="6"/><circle class="il-dark" cx="68" cy="37.5" r="2.8"/><circle class="il-white il-ink il-thin" cx="98" cy="37" r="6"/><circle class="il-dark" cx="96" cy="37.5" r="2.8"/>
    <path class="il-line il-thick" d="M61 28l14 4M107 28l-14 4"/>
    <rect class="il-dark il-ink" x="54" y="48" width="66" height="42" rx="6"/>
    <rect class="il-orange" opacity="0.75" x="58" y="52" width="58" height="34" rx="4"/>
    <path class="il-yellow" opacity="0.6" d="M66 86c4-16 38-16 42 0z"/>
    <path class="il-white il-ink il-thin" d="M56 50l5 7 5-7 5 7 5-7 5 7 5-7 5 7 5-7 5 7 5-7 5 7 5-7z"/>
    <ellipse class="il-white il-ink il-thin" cx="87" cy="82" rx="22" ry="3.6"/>
    <path class="il-yellow il-ink" d="M76 80c-4-6 0-12 6-12 2-4 8-4 10 0 4 0 6 4 4 8 4 2 6 4 4 5-8 1-18 1-24-1z"/>
    <path class="il-orange il-ink il-thin" d="M94 72l9-1-1 4-8 1z"/>
    <path class="il-yellow il-ink il-thin" d="M78 80c0 4-1 6-2 7M84 81c0 3 0 6 1 7"/>
    <circle class="il-white il-ink il-thin" cx="88" cy="70" r="2.2"/><circle class="il-dark" cx="88.4" cy="70.6" r="1"/>
    <path class="il-light il-thin" d="M60 56l8 6M62 64l4 3"/>
    <rect class="il-dark il-ink" x="126" y="30" width="24" height="12" rx="2"/>
    <path class="il-glow" d="M130 34h4v4h-4zM136 34h4v4h-4zM142 34h4v4h-4z"/>
    <circle class="il-grey il-ink il-thin" cx="132" cy="52" r="3.2"/><circle class="il-grey il-ink il-thin" cx="144" cy="52" r="3.2"/>
    <circle class="il-grey il-ink il-thin" cx="132" cy="62" r="3.2"/><circle class="il-grey il-ink il-thin" cx="144" cy="62" r="3.2"/>
    <circle class="il-red il-ink" cx="138" cy="78" r="6"/>
    <path class="il-line il-thin" d="M132 22l-2-6M144 20l2-7M152 24l5-4M154 34l5 0"/>
    <path class="il-line il-thin" d="M138 4l4 3-4 3 4 3M150 6l3 2-3 2 3 2M126 6l3 2-3 2"/>
    <rect class="il-dark il-ink il-thin" x="56" y="94" width="8" height="3"/><rect class="il-dark il-ink il-thin" x="140" y="94" width="8" height="3"/>`,

  // A gigantic lasagne has risen out of its baking dish into a layered tower of pasta, sauce and cheese with mould spots, a sly grin and stink lines, still wearing the party hat from the last birthday.
  'fd.forgotten-lasagne': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8zM160 0l-10 8v104l10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104M150 8v104"/>
    <path class="il-glow" opacity="0.3" d="M66 8h28l44 96H22z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="2" width="24" height="6" rx="3"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 104h156v5H2z"/>
    <path class="il-light il-thin" d="M8 105.5h30M120 105.5h22"/>
    <rect class="il-smoke" opacity="0.3" x="10" y="8" width="140" height="96"/>
    <path class="il-earth il-ink" d="M8 84h14v8H8zM138 84h14v8h-14z"/>
    <rect class="il-red il-ink il-thin" x="30.0" y="74" width="100" height="8" rx="1.5"/>
    <rect class="il-gold il-ink il-thin" x="27.0" y="68" width="106" height="6" rx="1.5"/>
    <ellipse class="il-gold il-ink il-thin" cx="27.0" cy="71.0" rx="2.6" ry="3.6"/><ellipse class="il-gold il-ink il-thin" cx="133.0" cy="71.0" rx="2.6" ry="3.6"/>
    <rect class="il-white il-ink il-thin" x="30.0" y="62" width="100" height="6" rx="1.5"/>
    <rect class="il-red il-ink il-thin" x="29.0" y="54" width="102" height="8" rx="1.5"/>
    <rect class="il-gold il-ink il-thin" x="26.0" y="48" width="108" height="6" rx="1.5"/>
    <ellipse class="il-gold il-ink il-thin" cx="26.0" cy="51.0" rx="2.6" ry="3.6"/><ellipse class="il-gold il-ink il-thin" cx="134.0" cy="51.0" rx="2.6" ry="3.6"/>
    <rect class="il-white il-ink il-thin" x="29.0" y="43" width="102" height="5" rx="1.5"/>
    <rect class="il-red il-ink il-thin" x="29.0" y="36" width="102" height="7" rx="1.5"/>
    <rect class="il-gold il-ink il-thin" x="27.0" y="31" width="106" height="5" rx="1.5"/>
    <ellipse class="il-gold il-ink il-thin" cx="27.0" cy="33.5" rx="2.6" ry="3.1"/><ellipse class="il-gold il-ink il-thin" cx="133.0" cy="33.5" rx="2.6" ry="3.1"/>
    <rect class="il-yellow il-ink" x="30" y="19" width="100" height="13" rx="5"/>
    <path class="il-yellow il-ink il-thin" d="M36 30v6c0 2 3 2 3 0v-6zM58 30v10c0 2 3 2 3 0V30zM102 30v7c0 2 3 2 3 0v-7zM122 30v5c0 2 3 2 3 0v-5z"/>
    <path class="il-yellow" d="M35 28h92v3H35z"/>
    <circle class="il-earth" opacity="0.5" cx="44" cy="24" r="2.4"/><circle class="il-earth" opacity="0.5" cx="78" cy="23" r="2"/><circle class="il-earth" opacity="0.5" cx="116" cy="25" r="2.6"/>
    <circle class="il-gold il-ink il-thin" cx="60" cy="24" r="1.6"/><circle class="il-gold il-ink il-thin" cx="94" cy="25" r="1.4"/>
    <circle class="il-slime il-ink il-thin" cx="40" cy="38" r="3.6"/><circle class="il-green" cx="40" cy="38" r="1.4"/>
    <circle class="il-slime il-ink il-thin" cx="122" cy="52" r="3.4"/><circle class="il-green" cx="122" cy="52" r="1.3"/>
    <circle class="il-slime il-ink il-thin" cx="104" cy="22" r="2.6"/><circle class="il-slime" cx="36" cy="64" r="1.8"/>
    <path class="il-line il-thin" opacity="0.6" d="M37 34l-2-2M43 34l1-2M120 48l-1-2M124 48l1-2"/>
    <circle class="il-white il-ink il-thin" cx="66" cy="45" r="6.5"/><circle class="il-dark" cx="67.2" cy="46" r="3"/><circle class="il-white il-ink il-thin" cx="94" cy="45" r="6.5"/><circle class="il-dark" cx="95.2" cy="46" r="3"/>
    <path class="il-gold il-ink il-thin" d="M59.5 44a6.5 6.5 0 0 1 13 0zM87.5 44a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M58 58h44c0 8-10 12-22 12S58 66 58 58z"/>
    <path class="il-white" d="M66 58.6h5v3h-5z"/><ellipse class="il-red" cx="82" cy="66" rx="8" ry="2.4"/>
    <rect class="il-earth il-ink" x="14" y="78" width="132" height="26" rx="6"/>
    <path class="il-earth-dark" d="M16 86h128v4H16z"/>
    <path class="il-light il-thin" d="M22 82h30"/>
    <path class="il-red il-ink il-thin" d="M44 78c-2 4-2 8 0 10 2-2 2-6 0-10zM112 78c-2 4-2 7 0 9 2-2 2-5 0-9z"/>
    <g transform="rotate(14 100 21)">
      <path class="il-blue il-ink" d="M91 22l9-17 9 17z"/>
      <circle class="il-yellow" cx="98" cy="14" r="1.4"/><circle class="il-yellow" cx="103" cy="18" r="1.4"/><circle class="il-yellow" cx="96" cy="20" r="1.3"/>
      <circle class="il-red il-ink il-thin" cx="100" cy="5" r="3"/>
    </g>
    <path class="il-line il-thin" d="M18 52q-3-4 0-8t0-8M140 50q-3-4 0-8t0-8M8 66q-3-3 0-6"/>
    <path class="il-pink il-ink il-thin" d="M30 18l3 2-1 3-3-2zM128 22l3-1 1 3-3 1z"/><path class="il-yellow il-ink il-thin" d="M58 12l3 1-1 3-3-1z"/>`,

  // A shaggy prehistoric frost beast with ice-crystal spikes, glowing eyes, an icicle beard and a leopard-spotted caveman fur rises in the freezer, breathing frost; next to it a tiny mammoth naps inside an ice cube.
  'fd.freezer-burn': `
    <rect class="il-water" x="0" y="0" width="160" height="120"/>
    <rect class="il-white" opacity="0.3" x="8" y="14" width="144" height="90"/>
    <path class="il-white il-ink il-thin" d="M0 0h160v12L152 18L144 12L136 18L128 12L120 18L112 12L104 18L96 12L88 18L80 12L72 18L64 12L56 18L48 12L40 18L32 12L24 18L16 12L8 18L0 12L0 0z"/>
    <path class="il-white il-ink il-thin" d="M30 16l2 9 2-9M96 16l2 8 2-8M128 16l2 10 2-10"/>
    <rect class="il-white il-ink" x="0" y="104" width="160" height="16"/>
    <path class="il-light il-thin" d="M6 108h30M120 108h30"/><polygon class="il-white il-ink" points="22 66 27.4 63.5 22.4 60.3 28.2 58.5 23.8 54.7 29.7 53.7 26 49.4 32 49.1 29 44.4 35 44.9 32.7 39.8 38.6 41.1 37.2 35.8 42.8 37.8 42.2 32.3 47.4 35.1 47.7 29.6 52.5 33 53.6 27.6 57.8 31.6 59.7 26.4 63.2 30.9 66 26 68.8 30.9 72.3 26.4 74.2 31.6 78.4 27.6 79.5 33 84.3 29.6 84.6 35.1 89.8 32.3 89.2 37.8 94.8 35.8 93.4 41.1 99.3 39.8 97 44.9 103 44.4 100 49.1 106 49.4 102.3 53.7 108.2 54.7 103.8 58.5 109.6 60.3 104.6 63.5 110 66"/>
    <path class="il-white il-ink" d="M22 66h88c-2 18-8 32-18 38H40c-10-6-16-20-18-38z"/>
    <path class="il-white" d="M24 64h84v6H24z"/>
    <path class="il-water il-ink il-thin" d="M30 34l-6-14 12 8zM46 24l-2-16 10 12zM64 20l2-16 6 16zM84 22l8-14 0 16zM100 32l12-10-4 14z"/>
    <path class="il-water" opacity="0.4" d="M30 74c6 10 16 14 26 12-10-2-18-6-26-12zM90 50c8 4 12 10 12 18-4-6-8-10-12-18z"/>
    <path class="il-earth il-ink" d="M28 80c20 4 52 2 78-8l2 20-6 4-4-4-6 6-6-4-6 6-6-4-6 6-6-4-6 6-6-4-6 6-6-4-6 4-4-4z"/>
    <circle class="il-earth-dark" cx="44" cy="90" r="2.4"/><circle class="il-earth-dark" cx="60" cy="92" r="2.6"/><circle class="il-earth-dark" cx="76" cy="90" r="2.4"/><circle class="il-earth-dark" cx="92" cy="86" r="2.4"/><circle class="il-earth-dark" cx="102" cy="82" r="1.8"/>
    <path class="il-line il-thick" d="M46 44l14 4M88 44l-14 4"/>
    <ellipse class="il-purple-dark il-ink il-thin" cx="56" cy="54" rx="7" ry="6"/><ellipse class="il-purple-dark il-ink il-thin" cx="78" cy="54" rx="7" ry="6"/>
    <circle class="il-glow" cx="57" cy="55" r="2.4"/><circle class="il-glow" cx="77" cy="55" r="2.4"/>
    <path class="il-dark il-ink" d="M56 64h22c0 6-4 9-11 9s-11-3-11-9z"/>
    <path class="il-white" d="M59 64.5l2 3 2-3zM71 64.5l2 3 2-3z"/>
    <path class="il-white il-ink il-thin" d="M52 72l3 12 3-10 4 14 3-12 3 16 3-14 4 12 3-12 3 8 3-10c-10 2-22 2-32 0z"/>
    <path class="il-white il-ink" d="M22 64c-10-6-14-16-10-26l8 4c-2 6 0 12 6 16z"/>
    <path class="il-white il-ink" d="M110 62c10-6 14-16 10-26l-8 4c2 6 0 12-6 16z"/>
    <path class="il-white il-ink il-thin" d="M10 38l1-6 3 4 2-6 2 5 3-3 0 6zM122 36l-1-6-3 4-2-6-2 5-3-3 0 6z"/>
    <path class="il-smoke il-ink il-thin" d="M84 66c4-4 10-4 14 0 4-3 10-2 12 2-4 3-9 3-12 0-4 3-10 2-14-2z"/><circle class="il-smoke il-ink il-thin" cx="110" cy="62" r="2.4"/>
    <rect class="il-white il-ink il-thin" x="110" y="96" width="46" height="9" rx="2"/>
    <path class="il-line il-thin" d="M121.5 96v9M133 96v9M144.5 96v9"/>
    <path class="il-earth-dark il-ink il-thin" d="M120 80c0-6 6-10 14-10s12 4 12 10v8h-26z"/>
    <path class="il-earth-dark il-ink il-thin" d="M122 86h4v6h-4zM138 86h4v6h-4z"/>
    <circle class="il-earth-dark il-ink il-thin" cx="122" cy="76" r="6"/>
    <path class="il-earth-dark il-ink il-thin" d="M117 79c-3 2-3 7 0 8 2 1 4-1 3-3-1-1-2 0-2 1"/>
    <path class="il-white il-ink il-thin" d="M120 80c-6 0-8 4-7 8 1-3 4-5 7-5z"/>
    <path class="il-line il-thin" d="M120 74.5l3 1"/>
    <path class="il-line il-thin" d="M126 66l3 0-3 3h3M131 62l2 0-2 2h2"/>
    <rect class="il-water il-ink" opacity="0.3" x="114" y="62" width="38" height="34" rx="4"/>
    <path class="il-light il-thin" d="M118 66h10M118 70v6"/>
    <path class="il-light il-thin" d="M14 92l4 4M18 92l-4 4M16 90v8M140 40l4 4M144 40l-4 4M142 38v8"/>`,

  // Grandma in yellow rubber gloves, apron and bun scolds at full volume as she flings a jar, a carton and a terrified lettuce over her shoulder into the bin, holding a mouldy yoghurt at arm’s length; the fridge behind her is spotless and almost empty.
  'fd.grandma-tidies-up': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 18h160M0 38h160M0 58h160M0 78h160M20 0v104M60 0v104M100 0v104M140 0v104"/>
    <path class="il-wood" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" d="M0 104h160"/>
    <rect class="il-white il-ink" x="120" y="4" width="40" height="104"/>
    <path class="il-glow" opacity="0.3" d="M122 6h36v100h-36z"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M120 40h40v3h-40zM120 72h40v3h-40z"/>
    <rect class="il-white il-ink il-thin" x="140" y="56" width="8" height="16" rx="1"/><rect class="il-white il-ink il-thin" x="150" y="56" width="8" height="16" rx="1"/>
    <rect class="il-yellow il-ink il-thin" x="124" y="16" width="12" height="12" transform="rotate(-6 130 22)"/><path class="il-line il-thin" d="M126 20h7M126 23h6M126 26h4"/>
    <path class="il-grey il-ink" d="M6 76h30l-3 34H9z"/>
    <path class="il-line il-thin" d="M14 82v24M21 82v24M28 82v24"/>
    <path class="il-grey il-ink" d="M4 74l4-22 32 2-2 4z" />
    <path class="il-white il-ink il-thin" d="M14 70l2-10h10l2 10z" transform="rotate(-20 21 65)"/>
    <path class="il-purple il-ink" d="M58 110c0-30 6-46 24-46s24 16 24 46z"/>
    <path class="il-pink il-ink" d="M66 110c0-24 4-34 16-34s16 10 16 34z"/>
    <circle class="il-white" cx="74" cy="88" r="1.6"/><circle class="il-white" cx="86" cy="84" r="1.6"/><circle class="il-white" cx="90" cy="98" r="1.6"/><circle class="il-white" cx="76" cy="102" r="1.6"/><circle class="il-white" cx="82" cy="94" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="68" y="108" width="10" height="4" rx="2"/><rect class="il-dark il-ink il-thin" x="86" y="108" width="10" height="4" rx="2"/>
    <path class="il-purple il-ink" d="M64 74c-8-4-12-14-12-24l7-1c0 8 4 14 9 18z"/>
    <path class="il-yellow il-ink" d="M50 50c-2-4 0-8 4-8s6 3 5 7z"/>
    <path class="il-purple il-ink" d="M100 74l20-6 2 6-20 7z"/>
    <path class="il-yellow il-ink" d="M118 66c4-2 8 0 8 4s-4 5-7 4z"/>
    <path class="il-line il-thin" d="M124 70l4-1"/>
    <path class="il-white il-ink" d="M124 74h8l-1 10h-6z"/><path class="il-metal il-ink il-thin" d="M123 72l10 0 1 2-11 0z" transform="rotate(10 128 73)"/>
    <circle class="il-slime" cx="127" cy="78" r="1.6"/><circle class="il-slime" cx="130" cy="81" r="1"/>
    <path class="il-line il-thin" d="M126 92q-2-3 0-5M132 92q-2-3 0-5"/>
    <circle class="il-skin il-ink" cx="82" cy="46" r="15"/>
    <path class="il-smoke il-ink" d="M66 44c0-12 8-16 16-16s16 4 16 16c-4-6-10-8-16-8s-12 2-16 8z"/>
    <circle class="il-smoke il-ink" cx="82" cy="26" r="7"/>
    <path class="il-line il-thin" d="M78 24q4-3 8 0"/>
    <circle class="il-white il-ink il-thin" cx="76" cy="46" r="3"/><circle class="il-dark" cx="77.2" cy="46.3" r="1.4"/><circle class="il-white il-ink il-thin" cx="88" cy="46" r="3"/><circle class="il-dark" cx="89.2" cy="46.3" r="1.4"/>
    <circle class="il-line il-thin" cx="76" cy="46" r="5"/><circle class="il-line il-thin" cx="88" cy="46" r="5"/><path class="il-line il-thin" d="M81 46h2"/>
    <path class="il-line" d="M70 39l8 2M94 39l-8 2"/>
    <path class="il-dark il-ink" d="M75 53h14c0 6-3 9-7 9s-7-3-7-9z"/><ellipse class="il-red" cx="82" cy="59" rx="3" ry="1.4"/>
    <path class="il-line il-thin" d="M98 32l5-4M100 40h6"/>
    <g transform="rotate(-30 40 30)"><rect class="il-white il-ink il-thin" x="32" y="22" width="14" height="16" rx="3"/><rect class="il-red il-ink il-thin" x="31" y="18" width="16" height="5" rx="1.5"/><circle class="il-slime" cx="38" cy="30" r="2"/></g>
    <path class="il-white il-ink il-thin" d="M14 34l8-4 6 10-8 4z"/><path class="il-blue il-ink il-thin" d="M16 38l8-4 2 3-8 4z"/>
    <path class="il-green il-ink il-thin" d="M28 12c4-4 10-2 10 2s-6 6-10 4c-2-2-2-4 0-6z"/>
    <circle class="il-white il-ink il-thin" cx="31" cy="15" r="1.6"/><circle class="il-dark" cx="30.6" cy="15" r="0.7"/><circle class="il-white il-ink il-thin" cx="35.4" cy="14.6" r="1.6"/><circle class="il-dark" cx="35" cy="14.6" r="0.7"/>
    <path class="il-line il-thin" d="M48 18c4-4 8-4 10-2M42 38c4 4 8 5 12 4M24 22c6-2 10 0 12 2"/>`,

  // A grumpy glacier has burst out of the pulled-out freezer drawer and towers up the fridge door, three frozen pizzas trapped inside its ice; an explorer’s flag already flies on its summit and a frozen tongue spills onto the floor.
  'fd.freezer-glacier': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 18h160M0 38h160M0 58h160M0 78h160M20 0v108M60 0v108M100 0v108M140 0v108"/>
    <path class="il-grey" d="M0 108h160v12H0z"/>
    <path class="il-line il-thin" d="M0 108h160"/>
    <rect class="il-white il-ink" x="10" y="0" width="140" height="66"/>
    <rect class="il-metal il-ink" x="70" y="52" width="20" height="5" rx="2.5"/>
    <path class="il-smoke il-ink il-thin" d="M14 66h132l4 18H10z"/>
    <path class="il-water" d="M18 84c-2-14 4-22 10-30l8-16 10 4 10-22 14 10 10-22 12 18 12-8 10 20 12 2 8 22c6 6 8 14 6 24z"/>
    <circle class="il-gold il-ink il-thin" cx="44" cy="62" r="11"/><circle class="il-gold" cx="44" cy="62" r="8"/>
    <circle class="il-red" cx="40" cy="58" r="2"/><circle class="il-red" cx="48" cy="60" r="2"/><circle class="il-red" cx="42" cy="66" r="2"/><circle class="il-red" cx="49" cy="67" r="1.6"/>
    <circle class="il-gold il-ink il-thin" cx="120" cy="56" r="10"/><circle class="il-gold" cx="120" cy="56" r="7.4"/>
    <circle class="il-red" cx="117" cy="52" r="1.8"/><circle class="il-red" cx="124" cy="55" r="1.8"/><circle class="il-red" cx="118" cy="60" r="1.8"/>
    <circle class="il-gold il-ink il-thin" cx="84" cy="30" r="8"/><circle class="il-gold" cx="84" cy="30" r="5.6"/>
    <circle class="il-red" cx="82" cy="28" r="1.5"/><circle class="il-red" cx="86" cy="32" r="1.5"/>
    <path class="il-white" opacity="0.5" d="M18 84c-2-14 4-22 10-30l8-16 10 4 10-22 14 10 10-22 12 18 12-8 10 20 12 2 8 22c6 6 8 14 6 24z"/>
    <path class="il-white il-ink" d="M46 42l10-22 14 10 10-22 12 18 12-8 6 12c-6-4-10-2-12 2-4-6-8-8-12-4-4-8-8-10-12-4-6-4-10-4-14 2-4 0-8 4-14 16z"/>
    <path class="il-line" d="M18 84c-2-14 4-22 10-30l8-16 10 4 10-22 14 10 10-22 12 18 12-8 10 20 12 2 8 22c6 6 8 14 6 24z"/>
    <path class="il-line il-thin" d="M30 56l8 6M108 70l6-8M56 76l4 8M126 74l-4 6"/>
    <path class="il-line il-thick" d="M60 48l12 4M108 48l-12 4"/>
    <path class="il-white il-ink il-thin" d="M62 56c3-2 8-2 11 0-1 3-3 4-5.5 4S63 59 62 56zM95 56c3-2 8-2 11 0-1 3-3 4-5.5 4S96 59 95 56z"/>
    <path class="il-dark" d="M66 56.5h5c0 2-1 2.8-2.5 2.8S66 58.5 66 56.5zM99 56.5h5c0 2-1 2.8-2.5 2.8S99 58.5 99 56.5z"/>
    <path class="il-dark il-ink" d="M70 70h28c0 8-6 12-14 12s-14-4-14-12z"/>
    <path class="il-white il-ink il-thin" d="M72 70l2 5 2-5 3 6 3-6 2 5 3-5 3 6 3-6 2 5 3-5z"/>
    <path class="il-water il-ink" d="M10 84h140v24H10z"/>
    <path class="il-white" opacity="0.5" d="M10 84h140v24H10z"/>
    <rect class="il-white il-ink" x="56" y="92" width="48" height="8" rx="4"/>
    <path class="il-white il-ink il-thin" d="M14 84l3 10 3-10M34 84l2 7 2-7M124 84l3 11 3-11M142 84l2 7 2-7"/>
    <path class="il-water il-ink il-thin" d="M10 108c-4 4-6 8-2 10 6 2 16 0 20-4l-2-6z"/>
    <path class="il-line il-thin" d="M84 8V-0"/>
    <path class="il-line" d="M84 9V0"/>
    <path class="il-red il-ink il-thin" d="M84 0.6l9 2.6-9 3z"/>
    <path class="il-light il-thin" d="M24 76l6-6M136 74l-4-6"/>`,

  // In the pitch-dark back corner behind three mustard jars lurks a lumpy grey thing with five glowing eyes, mould fuzz and stink lines, one lumpy paw curling over a jar; a nervous milk carton keeps its distance and hazard tape runs along the shelf.
  'fd.thing-at-the-back': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <path class="il-smoke" d="M0 0l10 8v104l-10 8zM160 0l-10 8v104l10 8z"/>
    <path class="il-line il-thin" d="M10 8h140M10 8v104M150 8v104"/>
    <path class="il-glow" opacity="0.3" d="M66 8h28l44 92H22z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="2" width="24" height="6" rx="3"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 100h156v5H2z"/>
    <path class="il-light il-thin" d="M8 101.5h30M120 101.5h22"/>
    <path class="il-dark" opacity="0.8" d="M10 8h96c4 30 2 60-6 92H10z"/>
    <path class="il-grey il-ink" d="M14 98c-6-24 0-50 14-60 6-12 22-18 34-12 12-4 26 4 30 18 10 10 12 30 6 54z"/>
    <circle class="il-slime" opacity="0.7" cx="34" cy="46" r="4"/><circle class="il-slime" opacity="0.7" cx="70" cy="34" r="3"/><circle class="il-slime" opacity="0.7" cx="86" cy="58" r="4.4"/><circle class="il-slime" opacity="0.7" cx="24" cy="70" r="3"/>
    <path class="il-line il-thin" opacity="0.7" d="M32 42l-2-3M36 42l1-3M68 30v-3M84 54l-1-3M88 54l1-3"/>
    <circle class="il-glow il-ink il-thin" cx="44" cy="52" r="6"/><circle class="il-dark" cx="45" cy="53" r="2.4"/>
    <circle class="il-glow il-ink il-thin" cx="62" cy="48" r="7"/><circle class="il-dark" cx="63" cy="49" r="2.8"/>
    <circle class="il-glow il-ink il-thin" cx="78" cy="42" r="4"/><circle class="il-dark" cx="79" cy="43" r="1.6"/>
    <circle class="il-glow il-ink il-thin" cx="30" cy="62" r="3.4"/><circle class="il-dark" cx="31" cy="62.6" r="1.4"/>
    <circle class="il-glow il-ink il-thin" cx="74" cy="64" r="3"/><circle class="il-dark" cx="75" cy="64.6" r="1.2"/>
    <path class="il-white il-ink il-thin" d="M44 70c6 4 16 4 22 0l-3 4-2-3-3 4-2-3-3 4-2-3-3 3z"/>
    <path class="il-light il-thin" opacity="0.8" d="M40 22q-3-4 0-8M60 18q-3-4 0-8M84 24q-3-4 0-8"/>
    <path class="il-water il-ink il-thin" opacity="0.6" d="M2 100h156v5H2z"/>
    <path class="il-yellow il-ink" d="M20 100V74c0-4 2-6 6-6h12c4 0 6 2 6 6v26z"/>
    <rect class="il-dark il-ink il-thin" x="21" y="62" width="22" height="7" rx="2"/>
    <rect class="il-white il-ink il-thin" x="22" y="80" width="20" height="10"/><circle class="il-gold il-ink il-thin" cx="32" cy="85" r="2.6"/>
    <path class="il-yellow il-ink" d="M50 100V70c0-4 2-6 6-6h14c4 0 6 2 6 6v30z"/>
    <rect class="il-red il-ink il-thin" x="51" y="57" width="24" height="8" rx="2"/>
    <rect class="il-white il-ink il-thin" x="52" y="78" width="22" height="11"/><circle class="il-gold il-ink il-thin" cx="63" cy="83.5" r="2.8"/>
    <path class="il-yellow il-ink" d="M82 100V78c0-3 2-5 5-5h10c3 0 5 2 5 5v22z"/>
    <rect class="il-dark il-ink il-thin" x="83" y="67" width="18" height="7" rx="2"/>
    <rect class="il-white il-ink il-thin" x="84" y="84" width="16" height="8"/><circle class="il-gold il-ink il-thin" cx="92" cy="88" r="2.2"/>
    <path class="il-grey il-ink" d="M46 92c-2-6 0-10 4-10 2-4 6-4 8-1 4-2 7 1 6 4 3 1 4 5 1 7-4 2-14 2-19 0z"/>
    <path class="il-line il-thin" d="M54 84l1 6M60 84l0 6"/>
    <circle class="il-slime" opacity="0.7" cx="50" cy="88" r="1.6"/>
    <path class="il-white il-ink" d="M118 100l2-26h20l2 26z"/>
    <path class="il-white il-ink il-thin" d="M120 74l10-10 10 10z"/>
    <path class="il-blue il-ink il-thin" d="M119 86h22l.5 6h-23z"/>
    <circle class="il-white il-ink il-thin" cx="126" cy="80" r="2.4"/><circle class="il-dark" cx="125" cy="80" r="1.1"/><circle class="il-white il-ink il-thin" cx="134" cy="80" r="2.4"/><circle class="il-dark" cx="133" cy="80" r="1.1"/>
    <path class="il-line il-thin" d="M127 84q3-2 6 0"/>
    <ellipse class="il-water il-ink il-thin" cx="116" cy="70" rx="1.8" ry="2.6"/><ellipse class="il-water il-ink il-thin" cx="144" cy="78" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" d="M114 82l-4-1M114 88h-4"/>
    <path class="il-yellow il-ink il-thin" d="M118 18l12-20 12 20z" transform="translate(4 18)"/>
    <path class="il-dark" d="M132.6 22h2.8l-.6 8h-1.6zM134 32.6a1.5 1.5 0 1 0 .01 0z"/>
    <path class="il-yellow il-ink il-thin" d="M0 104l160-6v8L0 112z"/>
    <path class="il-dark" d="M8 104l8-.3-6 7.8-8 .3zM28 103.2l8-.3-6 7.8-8 .3zM48 102.5l8-.3-6 7.8-8 .3zM68 101.7l8-.3-6 7.8-8 .3zM88 101l8-.3-6 7.8-8 .3zM108 100.2l8-.3-6 7.8-8 .3zM128 99.5l8-.3-6 7.8-8 .3zM148 98.7l8-.3-6 7.8-8 .3z"/>`,
};
