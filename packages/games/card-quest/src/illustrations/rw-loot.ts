/* Railway illustrations: loot. */
export const RW_LOOT: Readonly<Record<string, string>> = {
  // A blissful loco gets its front axle oiled from a big oil can (golden drops, sparkles); the "no squeaking" sign
  // shows a crossed-out zigzag and the pigeon on the cab roof can finally nap.
  'rw.freshly-oiled': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 80q40-14 80-4t80-4v28H0z" opacity="0.6"/>
    <rect class="il-stone" x="0" y="99" width="160" height="21"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 111h3M22 115h2M44 110h3M70 114h3M96 111h2M118 115h3M142 110h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="102" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="99" width="160" height="3"/>
    <g transform="translate(0 14) scale(0.85)">
    <rect class="il-red il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-green il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><path class="il-line" d="M88 64q4-4 8 0M100 64q4-4 8 0"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/><path class="il-white il-ink il-thin" d="M91 72q7 8 14 0z"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <g transform="translate(16 34) scale(0.8 0.8)">
    <path class="il-orange il-ink il-thin" d="M-3 8v4h-3M3 8v4h3"/>
    <path class="il-grey il-ink" d="M-12 2c0-6 6-9 12-8 6 1 9 5 9 9 0 5-6 7-12 7-5 0-9-3-9-8z"/>
    <path class="il-dark il-ink il-thin" d="M-12 2l-6-3 2 6z"/>
    <path class="il-stone il-ink il-thin" d="M-6 0q6-2 10 4-6 3-10-4z"/>
    <circle class="il-grey il-ink" cx="8" cy="-6" r="5"/>
    <path class="il-teal" d="M5 -1.5a5 3 0 0 0 7 0" opacity="0.8"/>
    <path class="il-orange il-ink il-thin" d="M12.5 -7l4 1.5-4 1z"/>
    <path class="il-line il-thin" d="M7.5 -7q1.5 1.5 3 0"/>
    </g>
    <path class="il-line il-thin" d="M24 18h5l-5 5h5M31 10h4l-4 4h4"/>
    <path class="il-metal il-ink il-thin" d="M124 62 103 79l2 2.4 22-15z"/>
    <path class="il-red il-ink" d="M116 66h28l4 22h-36z"/>
    <path class="il-gold il-ink il-thin" d="M114.5 74h31l1 5h-33z"/>
    <path class="il-metal il-ink" d="M120 66l10-9 10 9z"/>
    <rect class="il-metal il-ink il-thin" x="127" y="53" width="6" height="5" rx="1"/>
    <path class="il-line il-thick" d="M145 69q11 3 3 15"/>
    <path class="il-light il-thin" d="M120 82v-12"/>
    <path class="il-gold il-ink il-thin" d="M103 84q-2 3 0 4.6 2-1.6 0-4.6zM102 91q-2 3 0 4.6 2-1.6 0-4.6z"/>
    <path class="il-white il-ink il-thin" d="M88 39l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/><path class="il-white il-ink il-thin" d="M36 76l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="il-white il-ink il-thin" d="M84 94.5l1.05 2.45 2.45 1.05-2.45 1.05-1.05 2.45-1.05-2.45-2.45-1.05 2.45-1.05z"/>
    <circle class="il-red il-ink" cx="134" cy="24" r="14"/><circle class="il-white" cx="134" cy="24" r="10.5"/>
    <path class="il-line" d="M126 26l2.6-5 2.6 9 2.6-9 2.6 9 2.6-9 2.6 5"/>
    <rect class="il-red" x="120" y="22.2" width="28" height="3.6" transform="rotate(-45 134 24)"/>`,

  // A loco polished to pure brass beams smugly and shines so hard (rays, sparkles) that the conductor on the
  // platform shields his eyes; the polishing rag still hangs from the buffer.
  'rw.brass-polished': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="0" y="8" width="160" height="6"/>
    <path class="il-line il-thin" d="M30 14v86M130 14v86" opacity="0.4"/>
    <rect class="il-stone" x="0" y="99" width="160" height="21"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 111h3M22 115h2M44 110h3M70 114h3M96 111h2M118 115h3M142 110h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="102" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="99" width="160" height="3"/>
    <g opacity="0.7"><path class="il-light il-thick" d="M50 30l-6-14M70 26V10M90 30l6-14M110 40l12-8M30 40l-12-8"/></g>
    <g transform="translate(-4 14) scale(0.85)">
    <rect class="il-yellow il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-gold il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-yellow il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><circle class="il-white il-ink il-thin" cx="92" cy="63" r="4.6"/><circle class="il-white il-ink il-thin" cx="104" cy="63" r="4.6"/><circle class="il-dark" cx="93" cy="64.5" r="2.1"/><circle class="il-dark" cx="105" cy="64.5" r="2.1"/><path class="il-grey il-ink il-thin" d="M87.4 63a4.6 4.6 0 0 1 9.2 0zM99.4 63a4.6 4.6 0 0 1 9.2 0z"/><path class="il-line" d="M90 73q8 4 15-3"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-gold il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-gold il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-gold il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    <path class="il-white il-ink il-thin" d="M109 85l-3 10 3 2 2-3 2 3 2-2-2-10z"/>
    </g>
    <path class="il-light" d="M10 82l6-6M20 84l5-5" />
    <path class="il-white il-ink il-thin" d="M30 49l2.1 4.9 4.9 2.1-4.9 2.1-2.1 4.9-2.1-4.9-4.9-2.1 4.9-2.1z"/><path class="il-white il-ink il-thin" d="M88 34l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/><path class="il-white il-ink il-thin" d="M60 84l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="il-white il-ink il-thin" d="M14 70l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <g transform="translate(138 51) scale(0.95 0.95)">
    <rect class="il-dark il-ink il-thin" x="-8" y="34" width="7" height="14"/><rect class="il-dark il-ink il-thin" x="1" y="34" width="7" height="14"/>
    <path class="il-dark il-ink il-thin" d="M-10 50v-3h9v3zM10 50v-3h-9v3z"/>
    <path class="il-blue il-ink" d="M-11 10c-4 0-5 3-5 7l-1 19h34l-1-19c0-4-1-7-5-7z"/>
    <path class="il-line il-thin" d="M0 11v24"/><circle class="il-gold" cx="2.5" cy="18" r="1"/><circle class="il-gold" cx="2.5" cy="25" r="1"/>
    <rect class="il-skin il-ink il-thin" x="-3" y="7" width="6" height="5"/>
    <path class="il-blue il-ink il-thin" d="M-12 13l-8 12 4 3 9-11z"/><circle class="il-skin il-ink il-thin" cx="-18" cy="27" r="3"/><path class="il-blue il-ink il-thin" d="M10 13l2-12-4-1-4 12z"/><path class="il-skin il-ink il-thin" d="M-5 -6h10l2 3h-12z"/>
    <circle class="il-skin il-ink" cx="0" cy="0" r="9"/>
    <path class="il-blue il-ink il-thin" d="M-10 -6c-1-4 0-8 2-9h16c2 1 3 5 2 9z"/><rect class="il-gold il-ink il-thin" x="-9" y="-8" width="18" height="3"/><path class="il-dark il-ink il-thin" d="M-9 -5h16q-2 3-13 2z"/>
    <path class="il-line il-thin" d="M-6 -1.5l4 1M6 -1.5l-4 1"/><path class="il-line il-thin" d="M-3 5q3-2 6 0"/>
    <ellipse class="il-water il-ink il-thin" cx="9" cy="3" rx="1.4" ry="2"/>
    </g>
    <g opacity="0.7"><path class="il-line il-thin" d="M116 40l-4-3M116 46h-5M116 52l-4 2"/></g>`,

  // A loco with a brand-new brass whistle on its cab roof toots with a puckered mouth: a huge steam cloud and sound
  // waves blast out and two pigeons flee in a shower of feathers.
  'rw.steam-whistle': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="99" width="160" height="21"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 111h3M22 115h2M44 110h3M70 114h3M96 111h2M118 115h3M142 110h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="102" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="99" width="160" height="3"/>
    <g transform="translate(18 14) scale(0.85)">
    <rect class="il-red il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-blue il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><path class="il-line" d="M88 63q4-4 8 0M100 63q4-4 8 0"/><path class="il-line il-thin" d="M87 57l7-1M102 56l7 1"/><ellipse class="il-dark il-ink il-thin" cx="98" cy="74" rx="4" ry="4.5"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <rect class="il-metal il-ink il-thin" x="36" y="36" width="4" height="7"/>
    <rect class="il-gold il-ink" x="28" y="22" width="20" height="15" rx="2"/>
    <rect class="il-dark" x="30" y="31" width="16" height="3" rx="1"/>
    <path class="il-line il-thin" d="M28 27h20"/>
    <path class="il-gold il-ink il-thin" d="M27 23a11 5 0 0 1 22 0z"/>
    <path class="il-light il-thin" d="M31 25v4"/>
    <circle class="il-smoke il-ink il-thin" cx="30" cy="10" r="7"/><circle class="il-smoke il-ink il-thin" cx="42" cy="8" r="8"/><circle class="il-smoke il-ink il-thin" cx="54" cy="11" r="6"/><circle class="il-smoke il-ink il-thin" cx="20" cy="14" r="5"/><circle class="il-smoke il-ink il-thin" cx="64" cy="8" r="5"/>
    <g opacity="0.85"><path class="il-line" d="M74 20q6 6 0 14M84 14q10 10 0 24M96 8q14 14 0 34"/></g>
    <g transform="translate(124 26) scale(-0.85 0.85)">
    <path class="il-orange il-ink il-thin" d="M-3 8v4h-3M3 8v4h3"/>
    <path class="il-grey il-ink" d="M-12 2c0-6 6-9 12-8 6 1 9 5 9 9 0 5-6 7-12 7-5 0-9-3-9-8z"/>
    <path class="il-dark il-ink il-thin" d="M-12 2l-6-3 2 6z"/>
    <path class="il-stone il-ink il-thin" d="M-6 0q6-2 10 4-6 3-10-4z"/>
    <circle class="il-grey il-ink" cx="8" cy="-6" r="5"/>
    <path class="il-teal" d="M5 -1.5a5 3 0 0 0 7 0" opacity="0.8"/>
    <path class="il-orange il-ink il-thin" d="M12.5 -7l4 1.5-4 1z"/>
    <circle class="il-white il-ink il-thin" cx="9" cy="-7" r="2.6"/><circle class="il-dark" cx="9" cy="-7" r="1"/>
    <path class="il-grey il-ink il-thin" d="M-4 -2l-6-14 10 8zM2 -3l2-15 4 13z"/>
    </g>
    <g transform="translate(146 54) scale(-0.7 0.7)">
    <path class="il-orange il-ink il-thin" d="M-3 8v4h-3M3 8v4h3"/>
    <path class="il-grey il-ink" d="M-12 2c0-6 6-9 12-8 6 1 9 5 9 9 0 5-6 7-12 7-5 0-9-3-9-8z"/>
    <path class="il-dark il-ink il-thin" d="M-12 2l-6-3 2 6z"/>
    <path class="il-stone il-ink il-thin" d="M-6 0q6-2 10 4-6 3-10-4z"/>
    <circle class="il-grey il-ink" cx="8" cy="-6" r="5"/>
    <path class="il-teal" d="M5 -1.5a5 3 0 0 0 7 0" opacity="0.8"/>
    <path class="il-orange il-ink il-thin" d="M12.5 -7l4 1.5-4 1z"/>
    <circle class="il-white il-ink il-thin" cx="9" cy="-7" r="2.6"/><circle class="il-dark" cx="9" cy="-7" r="1"/>
    <path class="il-grey il-ink il-thin" d="M-4 -2l-6-14 10 8z"/>
    </g>
    <path class="il-white il-ink il-thin" d="M108 40q4-3 7 1-4 2-7-1zM136 70q3-4 7-1-3 3-7 1zM118 58q2-4 6-2-2 4-6 2z"/>
    <path class="il-line il-thin" d="M138 14l4-4M150 34l5-1M156 48l3-3"/>`,

  // In a museum hall an antique brass-banded loco on its plinth, behind velvet ropes and with a cobweb on the cab,
  // winks and puffs perfect steam rings: still in full working order.
  'rw.from-the-museum': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <g opacity="0.25"><path class="il-line il-thin" d="M0 20h160M0 40h160M0 60h160"/></g>
    <path class="il-torch" d="M64 0h32l40 100H24z" opacity="0.45"/>
    <rect class="il-wood il-ink il-thin" x="126" y="10" width="26" height="20" rx="1"/>
    <rect class="il-white" x="129" y="13" width="20" height="14"/>
    <path class="il-line il-thin" d="M131 24q4-7 8-3t8-6"/>
    <path class="il-wood-dark il-ink" d="M0 100h160v20H0z"/>
    <path class="il-wood" d="M0 101h160v3H0z"/>
    <rect class="il-stone il-ink" x="8" y="86" width="144" height="14" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="10" y="84" width="140" height="3"/>
    <rect class="il-gold il-ink il-thin" x="68" y="90" width="24" height="7" rx="1"/>
    <path class="il-line il-thin" d="M72 92.5h16M72 95h10"/>
    <g transform="translate(14 4) scale(0.8)">
    <rect class="il-wood il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-line il-thin" d="M8 40l12 12M8 46l6 6M14 40l6 6" opacity="0.7"/><path class="il-line il-thin" d="M8 52l4-4 4 4M14 46l4-4" opacity="0.7"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-earth-dark il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-dark il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><circle class="il-white il-ink il-thin" cx="104" cy="63" r="4.6"/><circle class="il-dark" cx="105" cy="64" r="2.1"/><path class="il-line" d="M88 64q4-3 8 0M87 58l8 1M102 57l7-1"/><path class="il-white il-ink il-thin" d="M90 71q9 8 16-1z"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-wood-dark il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-wood-dark il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-wood-dark il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <path class="il-line il-thin" d="M21 44l2 6"/><circle class="il-dark" cx="23" cy="51" r="1.6"/>
    <circle class="il-line il-thick" cx="76" cy="22" r="5"/><circle class="il-line il-thick" cx="84" cy="12" r="6"/><circle class="il-line il-thick" cx="96" cy="6" r="4"/>
    <path class="il-gold il-ink il-thin" d="M12 112v-14h4v14zM78 112v-14h4v14zM144 112v-14h4v14z"/>
    <circle class="il-gold il-ink il-thin" cx="14" cy="97" r="3"/><circle class="il-gold il-ink il-thin" cx="80" cy="97" r="3"/><circle class="il-gold il-ink il-thin" cx="146" cy="97" r="3"/>
    <path class="il-red il-ink il-thin" d="M16 99q32 12 62 0v3q-30 12-62 0zM82 99q32 12 62 0v3q-30 12-62 0z"/>
    <path class="il-dark il-ink il-thin" d="M8 114h12M74 114h12M140 114h12"/>
    <path class="il-yellow il-ink il-thin" d="M118 41l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // Full steam ahead: a determined loco tears along, tilted forward, smoke streaming behind, sparks under the
  // wheels; the driver in the cab clamps his cap to his head while his scarf flutters.
  'rw.full-steam': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g opacity="0.6"><path class="il-light" d="M0 40h22M4 52h16M0 66h14M140 30h16M146 20h12"/></g>
    <rect class="il-stone" x="0" y="101" width="160" height="19"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 113h3M22 117h2M44 112h3M70 116h3M96 113h2M118 117h3M142 112h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="104" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="104" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="101" width="160" height="3"/>
    <g opacity="0.6"><path class="il-line il-thin" d="M0 108h20M30 112h24M70 108h18M110 112h30"/></g>
    <circle class="il-smoke il-ink il-thin" cx="30" cy="22" r="9"/><circle class="il-smoke il-ink il-thin" cx="14" cy="18" r="8"/><circle class="il-smoke il-ink il-thin" cx="4" cy="28" r="7"/><circle class="il-smoke il-ink il-thin" cx="44" cy="16" r="7"/><circle class="il-smoke il-ink il-thin" cx="22" cy="34" r="5"/>
    <g transform="translate(24 16) scale(0.84) rotate(-5 60 90)">
    <rect class="il-blue il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <circle class="il-skin il-ink il-thin" cx="24" cy="57" r="6"/><path class="il-blue il-ink il-thin" d="M17 54c0-4 3-6 7-6s7 2 7 6zM17 54h15"/><circle class="il-skin il-ink il-thin" cx="30" cy="49" r="3"/><circle class="il-dark" cx="26" cy="57" r="1"/><path class="il-line il-thin" d="M23 60h4"/><path class="il-white il-ink il-thin" d="M15 62l-11 3 3-4-3-2 11-1z"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-red il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><circle class="il-white il-ink il-thin" cx="92" cy="63" r="4.6"/><circle class="il-white il-ink il-thin" cx="104" cy="63" r="4.6"/><circle class="il-dark" cx="93.5" cy="63.5" r="2.1"/><circle class="il-dark" cx="105.5" cy="63.5" r="2.1"/><path class="il-line" d="M86 56l9 4M110 56l-9 4"/><rect class="il-white il-ink il-thin" x="90" y="70" width="16" height="7" rx="2"/><path class="il-line il-thin" d="M94 70v7M98 70v7M102 70v7"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <g opacity="0.8"><path class="il-line il-thin" d="M8 64h12M4 76h14M10 88h10"/></g>
    <path class="il-yellow il-ink il-thin" d="M46 96.5l1.05 2.45 2.45 1.05-2.45 1.05-1.05 2.45-1.05-2.45-2.45-1.05 2.45-1.05z"/><path class="il-yellow il-ink il-thin" d="M68 95l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/><path class="il-yellow il-ink il-thin" d="M90 96.5l1.05 2.45 2.45 1.05-2.45 1.05-1.05 2.45-1.05-2.45-2.45-1.05 2.45-1.05z"/>
    <path class="il-line il-thin" d="M142 62l8-3M142 70h9M142 78l8 3"/>`,

  // A loco chimney has just puffed a huge black soot cloud over the platform: only blinking white eyes show inside
  // it, the monster's horns poke out, a sooty pigeon coughs and everyone's feet stick out below.
  'rw.soot-cloud': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone il-ink" x="0" y="96" width="160" height="24"/><rect class="il-yellow" x="0" y="100" width="160" height="2.5"/><g opacity="0.35"><path class="il-line il-thin" d="M20 102v18M60 102v18M100 102v18M140 102v18"/></g>
    <path class="il-dark il-ink" d="M8 120V96h-4l-2-10h20l-2 10h-4v24z"/>
    <path class="il-white il-ink il-thin" d="M-10 -17l-5-11 10 6z" transform="translate(110 30)"/>
    <path class="il-white il-ink il-thin" d="M10 -17l5-11-10 6z" transform="translate(110 30)"/>
    <ellipse class="il-dark il-ink" cx="48" cy="102" rx="6" ry="3"/><ellipse class="il-dark il-ink" cx="62" cy="102" rx="6" ry="3"/>
    <ellipse class="il-purple-dark il-ink" cx="102" cy="104" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="120" cy="104" rx="7" ry="4"/>
    <path class="il-dark il-ink il-thin" d="M140 100v4h-3M146 100v4h3"/>
    <circle class="il-dark il-ink" cx="14" cy="78" r="9"/><circle class="il-dark il-ink" cx="26" cy="62" r="12"/><circle class="il-dark il-ink" cx="50" cy="50" r="20"/><circle class="il-dark il-ink" cx="84" cy="40" r="22"/><circle class="il-dark il-ink" cx="118" cy="46" r="22"/><circle class="il-dark il-ink" cx="140" cy="64" r="16"/><circle class="il-dark il-ink" cx="110" cy="78" r="20"/><circle class="il-dark il-ink" cx="70" cy="78" r="22"/><circle class="il-dark il-ink" cx="40" cy="82" r="16"/><circle class="il-dark il-ink" cx="140" cy="86" r="12"/>
    <g opacity="0.35"><circle class="il-grey" cx="44" cy="42" r="6"/><circle class="il-grey" cx="80" cy="30" r="7"/><circle class="il-grey" cx="118" cy="36" r="6"/><circle class="il-grey" cx="62" cy="70" r="5"/><circle class="il-grey" cx="136" cy="58" r="5"/></g>
    <path class="il-dark il-ink" d="M40 50h20l-2-6h-16z"/>
    <circle class="il-white" cx="45" cy="58" r="4"/><circle class="il-white" cx="56" cy="58" r="4"/><circle class="il-dark" cx="46" cy="58" r="1.8"/><circle class="il-dark" cx="57" cy="58" r="1.8"/>
    <path class="il-white" d="M46 69q4-3 8 0"/>
    <path class="il-light il-thin" d="M44 70q5-4 10 0"/>
    <circle class="il-white" cx="102" cy="52" r="5.5"/><circle class="il-white" cx="118" cy="52" r="5.5"/><circle class="il-dark" cx="101" cy="53" r="2.4"/><circle class="il-dark" cx="117" cy="53" r="2.4"/>
    <path class="il-light il-thin" d="M96 45l8 2M124 45l-8 2"/>
    <path class="il-white" d="M104 64l2.5 3 2.5-3 2.5 3 2.5-3 2.5 3z"/>
    <path class="il-light il-thin" d="M138 80q2 2 4 0"/>
    <path class="il-orange il-ink il-thin" d="M146 80l5 1.5-5 1z"/>
    <circle class="il-smoke il-ink il-thin" cx="30" cy="30" r="3"/><circle class="il-smoke il-ink il-thin" cx="24" cy="24" r="2"/><circle class="il-smoke il-ink il-thin" cx="146" cy="30" r="3"/><circle class="il-smoke il-ink il-thin" cx="152" cy="24" r="2"/>
    <path class="il-line il-thin" d="M80 70q2 3 0 6M86 70q2 3 0 6"/>
    <path class="il-light il-thin" d="M76 72l-3-3M84 64l3-3"/>`,

  // Inside a carriage a hand yanks the big red emergency brake handle down hard (warning triangle on the panel);
  // everything lurches, a coffee cup flies off the table, and outside the window the left-behind monster gapes in
  // shock.
  'rw.emergency-brake': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="0" y="74" width="160" height="46"/>
    <path class="il-wood-dark" d="M0 78h160v3H0z"/>
    <rect class="il-metal il-ink" x="86" y="10" width="68" height="56" rx="8"/>
    <rect class="il-sky il-ink il-thin" x="91" y="15" width="58" height="46" rx="5"/>
    <path class="il-grass" d="M92 50q20-6 56-2v11a4 4 0 0 1-4 2H96a4 4 0 0 1-4-4z"/>
    <g transform="translate(120 42) scale(0.95 0.95)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-7" r="6.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-7" r="6.5"/><circle class="il-dark" cx="-7" cy="-7" r="1.6"/><circle class="il-dark" cx="7" cy="-7" r="1.6"/><path class="il-line il-thin" d="M-13 -16l6-2M13 -16l-6-2"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="8" rx="4" ry="5"/><ellipse class="il-purple il-ink il-thin" cx="-19" cy="-2" rx="4" ry="5"/><ellipse class="il-purple il-ink il-thin" cx="19" cy="-2" rx="4" ry="5"/><ellipse class="il-purple il-ink il-thin" cx="0" cy="1" rx="5" ry="3"/>
    </g>
    <path class="il-light" d="M95 22l10-6M140 58l8-6"/>
    <path class="il-blue il-ink" d="M86 120v-34c0-4 3-6 6-6h56c3 0 6 2 6 6v34z"/>
    <rect class="il-white il-ink il-thin" x="56" y="76" width="34" height="4"/>
    <path class="il-line il-thin" d="M50 70q4-6 0-10M58 64l-3-4"/>
    <g transform="rotate(-30 48 66)"><rect class="il-white il-ink il-thin" x="43" y="60" width="10" height="11" rx="1.5"/><path class="il-line il-thin" d="M53 63q4 0 4 3t-4 3"/><rect class="il-earth-dark" x="44" y="61" width="8" height="2"/></g>
    <path class="il-earth-dark il-ink il-thin" d="M40 52q2-4 5-2-2 3-5 2zM46 48q1-3 4-2-1 3-4 2z"/>
    <path class="il-water il-ink il-thin" d="M38 56q4-6 8-2-4 4-8 2z"/>
    <rect class="il-red il-ink" x="8" y="8" width="30" height="34" rx="3"/>
    <path class="il-yellow il-ink il-thin" d="M23 13l8 14h-16z"/>
    <path class="il-line il-thin" d="M23 17.5v5M23 24.5v0.5"/>
    <rect class="il-dark il-ink il-thin" x="18" y="32" width="10" height="8" rx="1"/>
    <path class="il-metal il-ink il-thin" d="M22 40h2v14h-2z"/>
    <rect class="il-red il-ink" x="10" y="52" width="26" height="8" rx="4"/>
    <path class="il-skin il-ink" d="M16 54c0-4 14-4 14 0v8c0 3-14 3-14 0z"/>
    <path class="il-line il-thin" d="M19 56v4M23 56v5M27 56v4"/>
    <path class="il-blue il-ink" d="M16 62l14 1-12 57H-2v-12z"/><path class="il-white il-ink il-thin" d="M16 62l14 1-1 5-14-1z"/>
    <path class="il-line il-thick" d="M6 46v14M40 46v14"/>
    <path class="il-line il-thin" d="M4 66l-3 4M44 66l3 4"/>`,

  // A brass steam whistle on its pipe screams out a cloud and a fan of sound waves; the monster on the right clamps
  // its paws over its ears, eyes spinning, fur on end, with little ringing zigzags still buzzing around its head.
  'rw.whistle-blast': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="0" y="100" width="160" height="20"/>
    <rect class="il-metal il-ink" x="0" y="80" width="38" height="8"/>
    <rect class="il-metal il-ink" x="20" y="64" width="10" height="18"/>
    <path class="il-dark il-ink il-thin" d="M30 70h12l2 3H30z"/>
    <path class="il-line il-thin" d="M43 73v12"/><circle class="il-red il-ink il-thin" cx="43" cy="88" r="2.6"/>
    <rect class="il-gold il-ink" x="12" y="34" width="26" height="31" rx="3"/>
    <rect class="il-dark" x="15" y="56" width="20" height="4" rx="1"/>
    <path class="il-line il-thin" d="M12 42h26M12 48h26"/>
    <rect class="il-gold il-ink il-thin" x="9" y="30" width="32" height="6" rx="2"/>
    <circle class="il-gold il-ink il-thin" cx="25" cy="27" r="3"/>
    <path class="il-light il-thin" d="M17 38v16"/>
    <circle class="il-smoke il-ink il-thin" cx="44" cy="56" r="6"/><circle class="il-smoke il-ink il-thin" cx="52" cy="48" r="5"/><circle class="il-smoke il-ink il-thin" cx="6" cy="56" r="5"/><circle class="il-smoke il-ink il-thin" cx="25" cy="20" r="6"/><circle class="il-smoke il-ink il-thin" cx="33" cy="14" r="4"/>
    <g opacity="0.9"><path class="il-line il-thick" d="M48 40q8 10 0 20M60 32q14 18 0 36M74 24q20 26 0 52"/></g>
    <g transform="translate(122 66) scale(1.15 1.15)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/><path class="il-line il-thin" d="M-7 -6m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3M7 -6m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3"/><path class="il-line" d="M-8 9l3-2 3 2 3-2 3 2 3-2"/><ellipse class="il-purple il-ink" cx="-21" cy="-4" rx="6" ry="8"/><ellipse class="il-purple il-ink" cx="21" cy="-4" rx="6" ry="8"/><path class="il-purple il-ink il-thin" d="M-6 -21l2-8 3 7 3-8 2 8 3-6"/>
    </g>
    <path class="il-line il-thin" d="M92 50l-4-2 4-2-4-2M152 50l4-2-4-2 4-2M96 34l-3-3 4-1-3-3M148 34l3-3-4-1 3-3"/>
    <path class="il-yellow il-ink il-thin" d="M104 22l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="il-yellow il-ink il-thin" d="M142 20.5l1.05 2.45 2.45 1.05-2.45 1.05-1.05 2.45-1.05-2.45-2.45-1.05 2.45-1.05z"/>`,

  // A rock-hard salted pretzel from the striped station bakery stall whizzes across with speed lines and bonks the
  // monster with a "tock" star; the monster already has a bump and crossed eyes, and the baker cheers.
  'rw.flying-pretzel': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone il-ink" x="0" y="98" width="160" height="22"/><rect class="il-yellow" x="0" y="102" width="160" height="2.5"/><g opacity="0.35"><path class="il-line il-thin" d="M20 104v16M60 104v16M100 104v16M140 104v16"/></g>
    <rect class="il-wood il-ink" x="4" y="58" width="44" height="40"/>
    <rect class="il-wood-dark il-ink il-thin" x="4" y="58" width="44" height="6"/>
    <path class="il-red il-ink" d="M0 44h52l4 10H-4z"/>
    <path class="il-white il-ink il-thin" d="M8 44h8l2 10H8zM24 44h8l2 10h-8zM40 44h8l2 10h-8z"/>
    <path class="il-red il-ink il-thin" d="M-4 54h60q-4 6-8 0-4 6-8 0-4 6-8 0-4 6-8 0-4 6-8 0-4 6-8 0-4 6-8 0-4 6-8 0"/>
    <g transform="translate(26 64) scale(0.6 0.6)">
    <rect class="il-dark il-ink il-thin" x="-8" y="34" width="7" height="14"/><rect class="il-dark il-ink il-thin" x="1" y="34" width="7" height="14"/>
    <path class="il-dark il-ink il-thin" d="M-10 50v-3h9v3zM10 50v-3h-9v3z"/>
    <path class="il-white il-ink" d="M-11 10c-4 0-5 3-5 7l-1 19h34l-1-19c0-4-1-7-5-7z"/>
    <path class="il-line il-thin" d="M0 11v24"/><circle class="il-gold" cx="2.5" cy="18" r="1"/><circle class="il-gold" cx="2.5" cy="25" r="1"/>
    <rect class="il-skin il-ink il-thin" x="-3" y="7" width="6" height="5"/>
    <path class="il-white il-ink il-thin" d="M10 14l8-12 4 2-8 13z"/><circle class="il-skin il-ink il-thin" cx="20" cy="1" r="3"/>
    <circle class="il-skin il-ink" cx="0" cy="0" r="9"/>
    <path class="il-earth-dark il-ink il-thin" d="M-9 -2c-1-7 3-10 9-10s10 3 9 10c-3-4-7-5-9-5s-6 1-9 5z"/>
    <circle class="il-dark" cx="-3.4" cy="-1" r="1.5"/><circle class="il-dark" cx="3.4" cy="-1" r="1.5"/><path class="il-white il-ink il-thin" d="M-4.5 3.5q4.5 5 9 0z"/>
    <path class="il-white il-ink il-thin" d="M-7 -8c-4-4 0-10 4-8 2-4 8-4 10 0 4-2 7 4 3 8z"/>
    </g>
    <rect class="il-wood il-ink" x="2" y="80" width="48" height="6"/>
    <g opacity="0.85"><path class="il-line il-thin" d="M56 46h10M58 54h12M56 62h10"/></g>
    <g transform="translate(88 50) rotate(-12)">
    <circle class="il-earth il-ink" cx="-12" cy="-4" r="13"/><circle class="il-earth il-ink" cx="12" cy="-4" r="13"/><ellipse class="il-earth il-ink" cx="0" cy="6" rx="19" ry="12"/>
    <circle class="il-earth" cx="-12" cy="-4" r="12"/><circle class="il-earth" cx="12" cy="-4" r="12"/><ellipse class="il-earth" cx="0" cy="6" rx="18" ry="11"/>
    <circle class="il-sky il-ink il-thin" cx="-13" cy="-4" r="5.5"/><circle class="il-sky il-ink il-thin" cx="13" cy="-4" r="5.5"/>
    <path class="il-sky il-ink il-thin" d="M0 1l-6 11h12z"/>
    <rect class="il-earth il-ink" x="-3.5" y="-12" width="7" height="25" rx="3.5" transform="rotate(31 0 -12)"/>
    <rect class="il-earth il-ink" x="-3.5" y="-12" width="7" height="25" rx="3.5" transform="rotate(-31 0 -12)"/>
    <path class="il-white" d="M-20 -12h2v2h-2zM-14 -16h2v2h-2zM16 -15h2v2h-2zM21 -6h2v2h-2zM-22 2h2v2h-2zM16 8h2v2h-2zM-1 -10h2v2h-2zM5 13h2v2h-2zM-9 14h2v2h-2zM-4 -14h2v2h-2zM-17 10h2v2h-2z"/>
    <path class="il-light il-thin" d="M-20 -10q4-6 10-5M8 -15q5-3 10 0" opacity="0.6"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M114 38l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z"/>
    <g transform="translate(134 72) scale(0.95 0.95)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-6" r="5.5"/><path class="il-line il-thin" d="M-7 -6m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3M7 -6m-3 0a3 3 0 1 1 3 3a1.6 1.6 0 1 1 0-3"/><path class="il-line" d="M-8 9l3-2 3 2 3-2 3 2 3-2"/><ellipse class="il-pink il-ink il-thin" cx="-12" cy="-20" rx="5" ry="4"/>
    </g>
    <path class="il-line il-thin" d="M108 36l-3-4M120 34l2-5M124 42l5-1"/>`,

  // A hand reaches in from the track and flings a handful of grey ballast stones at the monster, which hops on one
  // foot clutching its head with bumps and "ouch" stars; stones lie everywhere along the rails.
  'rw.handful-of-ballast': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="92" width="160" height="28"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 104h3M22 108h2M44 103h3M70 107h3M96 104h2M118 108h3M142 103h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="95" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="95" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="92" width="160" height="3"/>
    <path class="il-grey il-ink il-thin" d="M6 112.8l2-3.6 3.6-0.8 2.4 2.8-1.2 3.6-4.4 1.2z"/><path class="il-grey il-ink il-thin" d="M21 116.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/><path class="il-grey il-ink il-thin" d="M36.5 109.7l1.75-3.15 3.15-0.7 2.1 2.45-1.05 3.15-3.85 1.05z"/><path class="il-grey il-ink il-thin" d="M57 115.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/><path class="il-grey il-ink il-thin" d="M92 114.8l2-3.6 3.6-0.8 2.4 2.8-1.2 3.6-4.4 1.2z"/><path class="il-grey il-ink il-thin" d="M111 109.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/><path class="il-grey il-ink il-thin" d="M127 113.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/><path class="il-grey il-ink il-thin" d="M146 116.8l2-3.6 3.6-0.8 2.4 2.8-1.2 3.6-4.4 1.2z"/>
    <path class="il-blue il-ink" d="M-2 120l18-32 16 8-16 26z"/>
    <path class="il-white il-ink il-thin" d="M16 88l16 8 3-5-16-8z"/>
    <path class="il-skin il-ink" d="M20 84c2-8 8-12 16-12l14-2c3 0 3 4 0 5l-9 2 12 1c3 0 3 4 0 4l-11 0 9 3c3 1 2 5-1 4l-10-2c-4 4-10 6-15 4z"/>
    <path class="il-skin il-ink il-thin" d="M28 76l-3-8c-1-3 3-4 4-2l4 8"/>
    <path class="il-line il-thin" d="M40 78l6 1M40 82l6 2" opacity="0.6"/>
    <g opacity="0.85"><path class="il-line il-thin" d="M54 60l8-4M54 70l8-1M56 80l8 0"/></g>
    <path class="il-stone il-ink il-thin" d="M66 52.8l2-3.6 3.6-0.8 2.4 2.8-1.2 3.6-4.4 1.2z"/><path class="il-stone il-ink il-thin" d="M76.5 62.7l1.75-3.15 3.15-0.7 2.1 2.45-1.05 3.15-3.85 1.05z"/><path class="il-stone il-ink il-thin" d="M71 42.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/><path class="il-stone il-ink il-thin" d="M85.5 48.9l2.25-4.05 4.05-0.9 2.7 3.15-1.35 4.05-4.95 1.35z"/><path class="il-stone il-ink il-thin" d="M85 72.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/><path class="il-stone il-ink il-thin" d="M94.5 58.7l1.75-3.15 3.15-0.7 2.1 2.45-1.05 3.15-3.85 1.05z"/><path class="il-stone il-ink il-thin" d="M59 64.6l1.5-2.7 2.7-0.6 1.8 2.1-0.9 2.7-3.3 0.9z"/>
    <g transform="translate(126 62) rotate(8) scale(1.05 1.05)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <path class="il-line" d="M-12 -7l5 2-5 2M12 -7l-5 2 5 2"/><path class="il-dark il-ink il-thin" d="M-9 6q9 9 18 0z"/><path class="il-white" d="M-6 6.5l1.5 3 1.5-3zM4 6.5l1.5 3 1.5-3z"/><ellipse class="il-purple il-ink il-thin" cx="-12" cy="-22" rx="5" ry="4"/><ellipse class="il-purple il-ink il-thin" cx="14" cy="-20" rx="5" ry="4"/><ellipse class="il-pink il-ink il-thin" cx="-2" cy="-23" rx="5" ry="3.5"/><ellipse class="il-pink il-ink il-thin" cx="10" cy="-12" rx="3.5" ry="3"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M106 25.5l1.35 3.15 3.15 1.35-3.15 1.35-1.35 3.15-1.35-3.15-3.15-1.35 3.15-1.35z"/><path class="il-yellow il-ink il-thin" d="M146 28l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="il-white il-ink il-thin" d="M128 18.5l1.05 2.45 2.45 1.05-2.45 1.05-1.05 2.45-1.05-2.45-2.45-1.05 2.45-1.05z"/>
    <path class="il-line il-thin" d="M150 74l5 3M150 82l6 0"/>`,

  // A platform loudspeaker blasts an announcement with a giant exclamation mark; the monster obediently stands stiff
  // as a board behind the yellow safety line, its fur and a pigeon blown back.
  'rw.full-volume-announcement': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone il-ink" x="0" y="92" width="160" height="28"/>
    <rect class="il-dark" x="0" y="112" width="160" height="8"/>
    <path class="il-yellow il-ink il-thin" d="M0 100h14v4H0zM22 100h14v4H22zM44 100h14v4H44zM66 100h14v4H66zM88 100h14v4H88zM110 100h14v4h-14zM132 100h14v4h-14zM154 100h6v4h-6z"/>
    <rect class="il-metal il-ink" x="14" y="10" width="6" height="82"/>
    <rect class="il-dark il-ink il-thin" x="10" y="88" width="14" height="5"/>
    <path class="il-metal il-ink" d="M20 22h6l20-12v32L26 30h-6z"/>
    <ellipse class="il-grey il-ink" cx="46" cy="26" rx="5" ry="16"/>
    <rect class="il-dark il-ink il-thin" x="17" y="20" width="6" height="12" rx="2"/>
    <g opacity="0.9"><path class="il-line il-thick" d="M56 14q8 12 0 24M66 8q14 18 0 36M78 2q20 24 0 48"/></g>
    <path class="il-red il-ink" d="M86 10h12l-3 28h-6z"/><circle class="il-red il-ink" cx="92" cy="46" r="4.5"/>
    <g transform="translate(126 58) scale(1.1 1.1)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-7" r="6.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-7" r="6.5"/><circle class="il-dark" cx="-7" cy="-7" r="1.6"/><circle class="il-dark" cx="7" cy="-7" r="1.6"/><path class="il-line il-thin" d="M-13 -16l6-2M13 -16l-6-2"/><path class="il-line" d="M-6 8h12"/><path class="il-purple il-ink il-thin" d="M-20 2l-3 18 5 1 3-16zM20 2l3 18-5 1-3-16z"/><path class="il-purple il-ink il-thin" d="M18 -6l9-2-7 5 8 1-8 3"/>
    </g>
    <g opacity="0.7"><path class="il-line il-thin" d="M98 64h8M96 74h8M100 54h6"/></g>
    <g transform="translate(150 86) scale(0.6 0.6)">
    <path class="il-orange il-ink il-thin" d="M-3 8v4h-3M3 8v4h3"/>
    <path class="il-grey il-ink" d="M-12 2c0-6 6-9 12-8 6 1 9 5 9 9 0 5-6 7-12 7-5 0-9-3-9-8z"/>
    <path class="il-dark il-ink il-thin" d="M-12 2l-6-3 2 6z"/>
    <path class="il-stone il-ink il-thin" d="M-6 0q6-2 10 4-6 3-10-4z"/>
    <circle class="il-grey il-ink" cx="8" cy="-6" r="5"/>
    <path class="il-teal" d="M5 -1.5a5 3 0 0 0 7 0" opacity="0.8"/>
    <path class="il-orange il-ink il-thin" d="M12.5 -7l4 1.5-4 1z"/>
    <path class="il-line il-thin" d="M7.5 -7q1.5 1.5 3 0"/>
    <path class="il-white il-ink il-thin" d="M-14 -2l-6-4 2 6z"/>
    </g>`,

  // A carriage races off the right edge with the hero waving cheerfully from its window; the monster is left on the
  // platform holding a ticket, with a "?" over its head, and the departure board only shows a question mark too.
  'rw.wrong-train': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="98" width="160" height="22"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 110h3M22 114h2M44 109h3M70 113h3M96 110h2M118 114h3M142 109h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="101" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="98" width="160" height="3"/>
    <rect class="il-red il-ink" x="64" y="40" width="104" height="48" rx="6"/>
    <rect class="il-dark il-ink" x="60" y="36" width="110" height="7" rx="3"/>
    <rect class="il-white" x="64" y="72" width="104" height="4"/>
    <rect class="il-sky il-ink il-thin" x="74" y="48" width="22" height="18" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="104" y="48" width="22" height="18" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="134" y="48" width="22" height="18" rx="3"/>
    <path class="il-green il-ink il-thin" d="M76 66q9-9 18 0z"/>
    <path class="il-green il-ink il-thin" d="M80 62l-8-14 4-2 8 14z"/><circle class="il-skin il-ink il-thin" cx="73" cy="45" r="3.2"/>
    <circle class="il-skin il-ink il-thin" cx="86" cy="56" r="6.5"/><path class="il-orange il-ink il-thin" d="M79 54c0-6 3-8 7-8s7 2 7 8z"/><rect class="il-orange il-ink il-thin" x="78.5" y="52" width="15" height="3" rx="1.5"/>
    <circle class="il-dark" cx="84" cy="57.5" r="1"/><circle class="il-dark" cx="88.5" cy="57.5" r="1"/><path class="il-white il-ink il-thin" d="M83 60q3 3.5 6 0z"/>
    <rect class="il-red il-ink il-thin" x="72" y="65" width="26" height="3"/>
    <path class="il-light il-thin" d="M108 52l6-3M138 52l6-3"/>
    <rect class="il-dark il-ink" x="64" y="88" width="104" height="4"/>
    <circle class="il-dark il-ink" cx="84" cy="94" r="6"/><circle class="il-dark il-ink" cx="102" cy="94" r="6"/><circle class="il-dark il-ink" cx="136" cy="94" r="6"/><circle class="il-dark il-ink" cx="154" cy="94" r="6"/>
    <circle class="il-metal" cx="84" cy="94" r="2"/><circle class="il-metal" cx="102" cy="94" r="2"/><circle class="il-metal" cx="136" cy="94" r="2"/><circle class="il-metal" cx="154" cy="94" r="2"/>
    <g opacity="0.85"><path class="il-line il-thin" d="M50 50h10M46 62h12M50 74h10"/></g>
    <circle class="il-smoke il-ink il-thin" cx="58" cy="84" r="4"/><circle class="il-smoke il-ink il-thin" cx="50" cy="88" r="3"/>
    <rect class="il-metal il-ink il-thin" x="22" y="20" width="4" height="10"/>
    <rect class="il-dark il-ink" x="6" y="2" width="36" height="19" rx="2"/><path class="il-light il-thin" d="M10 6h6M10 10h4M32 6h6M34 10h4" opacity="0.5"/>
    <path class="il-light" d="M20 7.5q4-4 8 0t-4 4.5v1.5"/><circle class="il-white" cx="24" cy="17" r="1.3"/>
    <rect class="il-stone il-ink" x="0" y="92" width="58" height="28"/>
    <rect class="il-yellow" x="0" y="95" width="58" height="2"/>
    <g transform="translate(28 64) scale(0.95 0.95)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-6" r="5.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-6" r="4.5"/><circle class="il-dark" cx="-6" cy="-6" r="2.2"/><circle class="il-dark" cx="8" cy="-6" r="2"/><path class="il-line il-thin" d="M-13 -14l7 1M2 -13l9-3"/><path class="il-line" d="M-7 10q7-5 14 0"/><rect class="il-white il-ink il-thin" x="16" y="2" width="12" height="8" transform="rotate(-10 22 6)"/><path class="il-line il-thin" d="M18 5l8-1M19 8l5-1"/><ellipse class="il-purple il-ink il-thin" cx="18" cy="8" rx="4" ry="3.5"/>
    </g>
    <path class="il-line" d="M44 22q4-5 8-1t-3 6v3"/><circle class="il-dark" cx="49" cy="34" r="1.6"/>`,

  // Beep beep swish: the sliding doors of a carriage have just snapped shut (orange door lamp flashing, swish
  // lines); the grinning hero waves from inside the door window while the monster left outside on the platform gapes
  // and rubs its bumped red nose.
  'rw.doors-closing': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-teal il-ink" x="0" y="10" width="160" height="88"/>
    <rect class="il-dark il-ink" x="0" y="6" width="160" height="6"/>
    <rect class="il-white" x="0" y="80" width="160" height="4"/>
    <rect class="il-sky il-ink il-thin" x="6" y="22" width="22" height="26" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="132" y="22" width="22" height="26" rx="3"/>
    <rect class="il-metal il-ink" x="50" y="20" width="60" height="78"/>
    <rect class="il-metal il-ink" x="51" y="21" width="29" height="76"/>
    <rect class="il-metal il-ink" x="80" y="21" width="29" height="76"/>
    <rect class="il-sky il-ink il-thin" x="56" y="28" width="19" height="34" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="85" y="28" width="19" height="34" rx="3"/>
    <path class="il-green il-ink il-thin" d="M86 62q9-13 18 0z"/>
    <path class="il-green il-ink il-thin" d="M100 56l1-16 4 0-1 16z"/><circle class="il-skin il-ink il-thin" cx="102.5" cy="37" r="3"/>
    <circle class="il-skin il-ink il-thin" cx="94" cy="44" r="7"/><path class="il-orange il-ink il-thin" d="M86.5 42c0-6 3-9 7.5-9s7.5 3 7.5 9z"/><rect class="il-orange il-ink il-thin" x="86" y="40" width="16" height="3" rx="1.5"/>
    <circle class="il-dark" cx="91.5" cy="45.5" r="1.1"/><circle class="il-dark" cx="96.5" cy="45.5" r="1.1"/><path class="il-white il-ink il-thin" d="M90.5 48.5q3.5 4 7 0z"/>
    <path class="il-dark il-ink il-thin" d="M75 50h3v12h-3zM82 50h3v12h-3z"/>
    <path class="il-line il-thick" d="M80 22v74"/>
    <circle class="il-orange il-ink" cx="80" cy="14" r="5"/>
    <path class="il-line il-thin" d="M70 10l-4-3M70 16h-5M90 10l4-3M90 16h5"/>
    <path class="il-light il-thin" d="M114 28q4 6 0 12M118 24q7 10 0 20"/>
    <rect class="il-stone il-ink" x="0" y="98" width="160" height="22"/>
    <rect class="il-yellow" x="0" y="101" width="160" height="2"/>
    <g transform="translate(34 72) scale(1.05 1.05)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-7" r="6.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-7" r="6.5"/><circle class="il-dark" cx="-7" cy="-7" r="1.6"/><circle class="il-dark" cx="7" cy="-7" r="1.6"/><path class="il-line il-thin" d="M-13 -16l6-2M13 -16l-6-2"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="8" rx="4" ry="5"/><ellipse class="il-purple il-ink il-thin" cx="21" cy="0" rx="5" ry="4"/><ellipse class="il-purple il-ink il-thin" cx="-20" cy="6" rx="4" ry="5"/><ellipse class="il-red il-ink il-thin" cx="17" cy="2" rx="3" ry="2.6"/>
    </g>
    <ellipse class="il-water il-ink il-thin" cx="12" cy="52" rx="1.6" ry="2.4"/>`,

  // A carriage takes a sharp bend tilted on its rails: all the passengers inside lean left in unison, while the
  // monster tumbles out of the right-hand side, flailing, toward a soft hay bale.
  'rw.swinging-curve': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 78h160v42H0z"/>
    <path class="il-stone" d="M-4 120q30-36 92-40t80 0v14q-26-2-80 2T14 120z"/>
    <path class="il-line il-thick" d="M2 120q30-38 90-40t70 0M20 120q28-28 72-30t70 2"/>
    <g transform="rotate(-12 64 70)">
    <rect class="il-blue il-ink" x="12" y="32" width="96" height="44" rx="6"/>
    <rect class="il-dark il-ink" x="8" y="28" width="104" height="7" rx="3"/>
    <rect class="il-white" x="12" y="62" width="96" height="3"/>
    <rect class="il-sky il-ink il-thin" x="20" y="40" width="20" height="18" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="48" y="40" width="20" height="18" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="76" y="40" width="20" height="18" rx="3"/>
    <g transform="rotate(-24 30 54)"><circle class="il-skin il-ink il-thin" cx="30" cy="50" r="6"/><circle class="il-dark" cx="28" cy="49" r="1"/><circle class="il-dark" cx="32" cy="49" r="1"/><path class="il-line il-thin" d="M28 53h4"/><path class="il-earth-dark il-ink il-thin" d="M24 48c0-5 3-7 6-7s6 2 6 7c-2-2-4-3-6-3s-4 1-6 3z"/></g><g transform="rotate(-24 58 54)"><circle class="il-skin il-ink il-thin" cx="58" cy="50" r="6"/><circle class="il-dark" cx="56" cy="49" r="1"/><circle class="il-dark" cx="60" cy="49" r="1"/><path class="il-line il-thin" d="M56 53h4"/><path class="il-earth-dark il-ink il-thin" d="M52 48c0-5 3-7 6-7s6 2 6 7c-2-2-4-3-6-3s-4 1-6 3z"/></g><g transform="rotate(-24 86 54)"><circle class="il-skin il-ink il-thin" cx="86" cy="50" r="6"/><circle class="il-dark" cx="84" cy="49" r="1"/><circle class="il-dark" cx="88" cy="49" r="1"/><path class="il-line il-thin" d="M84 53h4"/><path class="il-earth-dark il-ink il-thin" d="M80 48c0-5 3-7 6-7s6 2 6 7c-2-2-4-3-6-3s-4 1-6 3z"/></g>
    <rect class="il-dark il-ink" x="14" y="76" width="92" height="4"/>
    <circle class="il-dark il-ink" cx="30" cy="82" r="6"/><circle class="il-dark il-ink" cx="90" cy="82" r="6"/>
    <circle class="il-metal" cx="30" cy="82" r="2"/><circle class="il-metal" cx="90" cy="82" r="2"/>
    </g>
    <path class="il-line il-thin" d="M4 36q-4 10 0 22M14 28q-6 14 0 30"/>
    <path class="il-gold il-ink" d="M118 102c0-6 4-8 10-8h22c6 0 10 2 10 8v12h-42z"/>
    <path class="il-line il-thin" d="M124 100h30M124 106h30M130 94v20M146 94v20"/>
    <path class="il-gold il-ink il-thin" d="M120 94l-2-4M126 94l1-4M156 94l2-5"/>
    <g transform="translate(132 54) rotate(50) scale(0.9 0.9)">
    <path class="il-white il-ink il-thin" d="M-13 -17l-5-11 10 6zM13 -17l5-11-10 6z"/>
    <ellipse class="il-purple-dark il-ink" cx="-9" cy="24" rx="7" ry="4"/><ellipse class="il-purple-dark il-ink" cx="9" cy="24" rx="7" ry="4"/>
    <path class="il-purple il-ink" d="M-20 4c0-16 8-26 20-26s20 10 20 26c0 12-8 20-20 20s-20-8-20-20z"/>
    <ellipse class="il-pink" cx="0" cy="12" rx="10" ry="7" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -6q2-8 8-11" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="-7" cy="-7" r="6.5"/><circle class="il-white il-ink il-thin" cx="7" cy="-7" r="6.5"/><circle class="il-dark" cx="-7" cy="-7" r="1.6"/><circle class="il-dark" cx="7" cy="-7" r="1.6"/><path class="il-line il-thin" d="M-13 -16l6-2M13 -16l-6-2"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="8" rx="4" ry="5"/><ellipse class="il-purple il-ink il-thin" cx="-22" cy="-8" rx="4" ry="6" transform="rotate(30 -22 -8)"/><ellipse class="il-purple il-ink il-thin" cx="22" cy="-8" rx="4" ry="6" transform="rotate(-30 22 -8)"/>
    </g>
    <path class="il-line il-thin" d="M108 30q8-8 18-6M114 40q6-4 12-3"/>
    <path class="il-line il-thin" d="M138 86v4M134 87l1 3M142 87l-1 3"/>`,

  // Two carriages stand side by side heading in opposite directions (arrows); a whistling passenger with a suitcase
  // leaps along a dashed arc from the blue door to the red one, tossing away his blue cap for a red one, while
  // shocked faces stare from the blue window.
  'rw.switch-trains': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="98" width="160" height="22"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 110h3M22 114h2M44 109h3M70 113h3M96 110h2M118 114h3M142 109h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="101" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="101" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="98" width="160" height="3"/>
    <rect class="il-blue il-ink" x="-6" y="40" width="70" height="52" rx="5"/>
    <rect class="il-dark il-ink" x="-8" y="36" width="74" height="6" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="6" y="48" width="22" height="18" rx="3"/>
    <circle class="il-skin il-ink il-thin" cx="12" cy="60" r="4.5"/><circle class="il-white" cx="10.4" cy="59" r="1.4"/><circle class="il-white" cx="13.6" cy="59" r="1.4"/><circle class="il-dark" cx="10.4" cy="59" r="0.6"/><circle class="il-dark" cx="13.6" cy="59" r="0.6"/><ellipse class="il-dark" cx="12" cy="62.4" rx="1" ry="1.3"/><circle class="il-skin il-ink il-thin" cx="22" cy="60" r="4.5"/><circle class="il-white" cx="20.4" cy="59" r="1.4"/><circle class="il-white" cx="23.6" cy="59" r="1.4"/><circle class="il-dark" cx="20.4" cy="59" r="0.6"/><circle class="il-dark" cx="23.6" cy="59" r="0.6"/><ellipse class="il-dark" cx="22" cy="62.4" rx="1" ry="1.3"/>
    <rect class="il-dark il-ink il-thin" x="40" y="46" width="20" height="44" rx="2"/>
    <path class="il-white il-ink il-thin" d="M8 74h20l-2-4 8 6-8 6 2-4H8z" transform="rotate(180 20 76)"/>
    <rect class="il-red il-ink" x="96" y="40" width="70" height="52" rx="5"/>
    <rect class="il-dark il-ink" x="94" y="36" width="74" height="6" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="130" y="48" width="22" height="18" rx="3"/>
    <rect class="il-dark il-ink il-thin" x="100" y="46" width="20" height="44" rx="2"/>
    <path class="il-white il-ink il-thin" d="M130 74h20l-2-4 8 6-8 6 2-4h-20z"/>
    <circle class="il-dark il-ink" cx="4" cy="94" r="5"/><circle class="il-dark il-ink" cx="26" cy="94" r="5"/><circle class="il-dark il-ink" cx="108" cy="94" r="5"/><circle class="il-dark il-ink" cx="146" cy="94" r="5"/>
    <path class="il-line il-dash" d="M50 50q30-44 60 0"/>
    <g transform="translate(80 40) rotate(12)">
    <path class="il-dark il-ink il-thin" d="M-4 22l-13 9 3 3 13-8zM4 22l9 13 4-3-8-12z"/>
    <path class="il-dark il-ink il-thin" d="M-18 30l-5 3 3 3 5-2zM13 35l4 4 3-3-3-4z"/>
    <path class="il-wood il-ink il-thin" d="M-9 7l-12 7 2 3 12-7z"/>
    <rect class="il-wood il-ink il-thin" x="-33" y="12" width="15" height="11" rx="2"/><path class="il-line il-thin" d="M-28 12v-2h5v2"/>
    <path class="il-orange il-ink" d="M-9 4c0-3 2-5 5-5h8c3 0 5 2 5 5l1 20h-20z"/>
    <path class="il-line il-thin" d="M0 0v24"/>
    <path class="il-orange il-ink il-thin" d="M8 4l14-6 1.6 3.8-13.6 6z"/><circle class="il-skin il-ink il-thin" cx="24" cy="-1" r="3"/>
    <circle class="il-skin il-ink" cx="0" cy="-10" r="8"/>
    <path class="il-red il-ink il-thin" d="M-8 -12c0-6 4-9 8-9s8 3 8 9z"/><rect class="il-red il-ink il-thin" x="-9" y="-14" width="18" height="3.5" rx="1.6"/>
    <circle class="il-dark" cx="0" cy="-9" r="1.3"/><circle class="il-dark" cx="5" cy="-9" r="1.3"/>
    <ellipse class="il-dark" cx="3" cy="-4" rx="1.3" ry="1.5"/>
    </g>
    <g transform="translate(44 22) rotate(-35)"><path class="il-blue il-ink il-thin" d="M-8 0c0-5 3-8 8-8s8 3 8 8z"/><rect class="il-blue il-ink il-thin" x="-9" y="-2" width="18" height="3.5" rx="1.6"/></g>
    <path class="il-line il-thin" d="M34 14l-4-3M36 26l-5 1"/>
    <path class="il-line il-thin" d="M70 84l-4 2M74 88l-2 3M90 88l2 3M94 84l4 2"/>
    <g transform="translate(108 14) scale(0.9)"><ellipse class="il-dark" cx="0" cy="8" rx="3" ry="2.2"/><path class="il-line il-thin" d="M2.6 8V-2l5 2"/></g><g transform="translate(118 6) scale(0.7)"><ellipse class="il-dark" cx="0" cy="8" rx="3" ry="2.2"/><path class="il-line il-thin" d="M2.6 8V-2l5 2"/></g>`,

  // Freshly promoted: a beaming train manager with a tall new peaked cap (gold braid, star badge), a shiny whistle
  // on a lanyard and a microphone bursting with an announcement bubble; the small old cap lies discarded on the
  // platform.
  'rw.chief-guard': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="0" y="6" width="160" height="6"/>
    <circle class="il-white il-ink" cx="24" cy="34" r="12"/><path class="il-line il-thin" d="M24 34v-8M24 34l6 3"/><path class="il-line il-thin" d="M24 12v10"/>
    <rect class="il-stone il-ink" x="0" y="100" width="160" height="20"/><rect class="il-yellow" x="0" y="104" width="160" height="2.5"/><g opacity="0.35"><path class="il-line il-thin" d="M20 106v14M60 106v14M100 106v14M140 106v14"/></g>
    <path class="il-blue il-ink" d="M50 120c0-30 10-42 30-42s30 12 30 42z"/>
    <path class="il-gold il-ink il-thin" d="M58 88l-6 6 4 2 6-6zM102 88l6 6-4 2-6-6z"/>
    <path class="il-line il-thin" d="M80 82v38"/>
    <circle class="il-gold il-ink il-thin" cx="84" cy="94" r="1.6"/><circle class="il-gold il-ink il-thin" cx="84" cy="104" r="1.6"/><circle class="il-gold il-ink il-thin" cx="84" cy="114" r="1.6"/>
    <path class="il-white il-ink il-thin" d="M70 78l10 8 10-8-4-2-6 5-6-5z"/>
    <path class="il-line il-thin" d="M72 80q8 14 18 10"/>
    <path class="il-metal il-ink il-thin" d="M88 88h10l2 4-2 3h-10z"/><circle class="il-dark" cx="94" cy="91.5" r="1.4"/>
    <path class="il-gold il-ink il-thin" d="M66 94l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/>
    <rect class="il-skin il-ink" x="74" y="66" width="12" height="12"/>
    <circle class="il-skin il-ink" cx="80" cy="56" r="16"/>
    <ellipse class="il-skin il-ink il-thin" cx="64" cy="57" rx="3" ry="4"/><ellipse class="il-skin il-ink il-thin" cx="96" cy="57" rx="3" ry="4"/>
    <path class="il-line" d="M71 56q3-3 6 0M83 56q3-3 6 0"/>
    <path class="il-white il-ink il-thin" d="M72 63q8 9 16 0z"/>
    <ellipse class="il-pink" cx="69" cy="62" rx="3" ry="2"/><ellipse class="il-pink" cx="91" cy="62" rx="3" ry="2"/>
    <path class="il-blue il-ink" d="M62 44c-2-14 0-26 4-30h28c4 4 6 16 4 30z"/>
    <rect class="il-gold il-ink il-thin" x="62" y="36" width="36" height="6"/>
    <path class="il-line il-thin" d="M62 39h36" opacity="0.5"/>
    <path class="il-gold il-ink il-thin" d="M80 20l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/>
    <path class="il-dark il-ink" d="M61 44h38q-4 7-19 6t-19-6z"/>
    <path class="il-light il-thin" d="M68 18v16" opacity="0.6"/>
    <path class="il-skin il-ink" d="M106 92c4-6 10-4 12-8l4 4c-2 4-6 6-10 10z"/>
    <path class="il-blue il-ink" d="M98 96l10-8 6 6-8 10z"/>
    <rect class="il-dark il-ink" x="114" y="70" width="6" height="16" rx="2" transform="rotate(20 117 78)"/>
    <ellipse class="il-metal il-ink" cx="120" cy="66" rx="6" ry="6"/>
    <path class="il-line il-thin" d="M116 63h8M115 66h10M116 69h8"/>
    <path class="il-white il-ink" d="M118 10h38v34h-20l-8 8 1-8h-11z"/>
    <path class="il-line il-thin" d="M124 18h26M124 24h20M124 30h24M124 36h14"/>
    <path class="il-red il-ink il-thin" d="M151 31l-1-12h4l-1 12zM152 36v.4"/>
    <g transform="translate(140 104) rotate(-20)"><path class="il-blue il-ink il-thin" d="M-8 0c0-4 2-6 8-6s8 2 8 6z"/><path class="il-dark il-ink il-thin" d="M-8 0h12q-2 3-12 1z"/></g>
    <path class="il-line il-thin" d="M128 110q4 2 8 0" opacity="0.5"/>`,

  // The big station clock shows exactly twelve as the loco pulls in to the minute: a passenger snaps a photo with a
  // flash, another's jaw drops, and a pigeon has fainted flat on its back.
  'rw.on-time': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="0" y="4" width="160" height="5"/>
    <rect class="il-metal il-ink il-thin" x="78" y="8" width="4" height="8"/>
    <circle class="il-dark il-ink" cx="80" cy="34" r="20"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="34" r="16.5"/>
    <path class="il-line il-thin" d="M80 19.5v3M80 45.5v3M65.5 34h3M91.5 34h3M72.75 21.4l1 1.7M87.25 21.4l-1 1.7M72.75 46.6l1-1.7M87.25 46.6l-1-1.7M67.4 26.75l1.7 1M92.6 26.75l-1.7 1M67.4 41.25l1.7-1M92.6 41.25l-1.7-1"/>
    <path class="il-line il-thick" d="M80 34V23"/>
    <path class="il-line" d="M80 34V20"/>
    <circle class="il-red" cx="80" cy="34" r="2"/>
    <path class="il-white il-ink il-thin" d="M54 18l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="il-white il-ink il-thin" d="M106 18l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 116h3M22 120h2M44 115h3M70 119h3M96 116h2M118 120h3M142 115h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="107" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="107" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="104" width="160" height="3"/>
    <g transform="translate(-8 46) scale(0.58)">
    <rect class="il-red il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-green il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><circle class="il-white il-ink il-thin" cx="92" cy="63" r="4.6"/><circle class="il-white il-ink il-thin" cx="104" cy="63" r="4.6"/><circle class="il-dark" cx="93" cy="64.5" r="2.1"/><circle class="il-dark" cx="105" cy="64.5" r="2.1"/><path class="il-grey il-ink il-thin" d="M87.4 63a4.6 4.6 0 0 1 9.2 0zM99.4 63a4.6 4.6 0 0 1 9.2 0z"/><path class="il-line" d="M90 73q8 4 15-3"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <circle class="il-smoke il-ink il-thin" cx="30" cy="62" r="5"/><circle class="il-smoke il-ink il-thin" cx="22" cy="56" r="4"/>
    <rect class="il-stone il-ink" x="74" y="96" width="86" height="24"/>
    <rect class="il-yellow" x="74" y="99" width="86" height="2"/>
    <g transform="translate(104 52) scale(0.82 0.82)">
    <rect class="il-dark il-ink il-thin" x="-8" y="34" width="7" height="14"/><rect class="il-dark il-ink il-thin" x="1" y="34" width="7" height="14"/>
    <path class="il-dark il-ink il-thin" d="M-10 50v-3h9v3zM10 50v-3h-9v3z"/>
    <path class="il-orange il-ink" d="M-11 10c-4 0-5 3-5 7l-1 19h34l-1-19c0-4-1-7-5-7z"/>
    <path class="il-line il-thin" d="M0 11v24"/><circle class="il-gold" cx="2.5" cy="18" r="1"/><circle class="il-gold" cx="2.5" cy="25" r="1"/>
    <rect class="il-skin il-ink il-thin" x="-3" y="7" width="6" height="5"/>
    <circle class="il-skin il-ink" cx="0" cy="0" r="9"/>
    <path class="il-earth-dark il-ink il-thin" d="M-9 -2c-1-7 3-10 9-10s10 3 9 10c-3-4-7-5-9-5s-6 1-9 5z"/>
    <circle class="il-white il-ink il-thin" cx="-3.6" cy="-1.5" r="2.6"/><circle class="il-white il-ink il-thin" cx="3.6" cy="-1.5" r="2.6"/><circle class="il-dark" cx="-3.6" cy="-1.5" r="1"/><circle class="il-dark" cx="3.6" cy="-1.5" r="1"/><ellipse class="il-dark" cx="0" cy="5" rx="2" ry="2.6"/>
    </g>
    <g transform="translate(140 52) scale(0.82 0.82)">
    <rect class="il-dark il-ink il-thin" x="-8" y="34" width="7" height="14"/><rect class="il-dark il-ink il-thin" x="1" y="34" width="7" height="14"/>
    <path class="il-dark il-ink il-thin" d="M-10 50v-3h9v3zM10 50v-3h-9v3z"/>
    <path class="il-purple il-ink" d="M-11 10c-4 0-5 3-5 7l-1 19h34l-1-19c0-4-1-7-5-7z"/>
    <path class="il-line il-thin" d="M0 11v24"/><circle class="il-gold" cx="2.5" cy="18" r="1"/><circle class="il-gold" cx="2.5" cy="25" r="1"/>
    <rect class="il-skin il-ink il-thin" x="-3" y="7" width="6" height="5"/>
    <path class="il-purple il-ink il-thin" d="M-12 12l-6 4 2 3 6-4z"/>
    <circle class="il-skin il-ink" cx="0" cy="0" r="9"/>
    <path class="il-orange il-ink il-thin" d="M-9 -4c0-7 4-10 9-10s9 3 9 10z"/><rect class="il-orange il-ink il-thin" x="-10" y="-6" width="20" height="4" rx="2"/>
    <circle class="il-dark" cx="3.4" cy="-1" r="1.5"/><path class="il-line il-thin" d="M-3 4q3 2 6 0"/>
    <rect class="il-dark il-ink il-thin" x="-16" y="-6" width="12" height="9" rx="2"/><circle class="il-metal il-ink il-thin" cx="-10" cy="-1.5" r="2.6"/><rect class="il-white" x="-14" y="-8" width="3" height="2"/>
    </g>
    <path class="il-white il-ink il-thin" d="M120 36l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"/>
    <path class="il-light il-thin" d="M112 36l-3-4M126 34l3-5M128 44h5"/>
    <path class="il-orange il-ink il-thin" d="M92 104l-2-6M90 98l-2-1M90 98l1-2M98 104l1-6M99 98l-1-2M99 98l2-1"/>
    <ellipse class="il-grey il-ink" cx="95" cy="108" rx="10" ry="5"/>
    <path class="il-stone il-ink il-thin" d="M88 106q6-3 12 0-6 3-12 0z"/>
    <circle class="il-grey il-ink" cx="108" cy="110" r="4.4"/>
    <path class="il-orange il-ink il-thin" d="M112 111l4 1.5-4 1z"/>
    <path class="il-line il-thin" d="M106.5 107.5l2.6 2.6M109.1 107.5l-2.6 2.6"/>
    <path class="il-line il-thin" d="M100 96l-2-3M106 98l3-3"/>`,

  // For the line's hundredth birthday a beaming loco wears a flower wreath on its smokebox door and bunting from cab
  // to chimney; a tuba player oompahs beside it, notes and confetti fly, and the cab sports a party hat.
  'rw.anniversary-trip': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="99" width="160" height="21"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 111h3M22 115h2M44 110h3M70 114h3M96 111h2M118 115h3M142 110h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="102" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="99" width="160" height="3"/>
    <g transform="translate(-4 14) scale(0.85)">
    <rect class="il-blue il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-red il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <path class="il-line il-thin" d="M-1 34q36 14 72-2"/><path class="il-yellow il-ink il-thin" d="M8 37l4 9 4-7zM24 41l3 9 5-8zM42 42l3 9 5-9zM58 39l2 9 6-9z"/><path class="il-red il-ink il-thin" d="M16 39l3 9 5-8zM33 42l3 9 4-9zM50 41l3 9 5-9z"/><path class="il-orange il-ink" d="M14 34l11-24 11 24z"/><path class="il-yellow il-ink il-thin" d="M18 26h14l-3 6h-8zM22 18h6l-1.6 4h-2.8z" opacity="0.9"/><circle class="il-yellow il-ink il-thin" cx="25" cy="9" r="3"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><circle class="il-white il-ink il-thin" cx="92" cy="63" r="4.6"/><circle class="il-white il-ink il-thin" cx="104" cy="63" r="4.6"/><circle class="il-dark" cx="93" cy="64" r="2.1"/><circle class="il-dark" cx="105" cy="64" r="2.1"/><path class="il-line il-thin" d="M88 57l6-1M102 56l6 1"/><path class="il-white il-ink il-thin" d="M90 72q8 9 16 0z"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    <circle class="il-red il-ink il-thin" cx="115" cy="68.5" r="2.8"/><circle class="il-white il-ink il-thin" cx="113.36" cy="79.43" r="2.8"/><circle class="il-red il-ink il-thin" cx="109.22" cy="85.24" r="2.8"/><circle class="il-white il-ink il-thin" cx="104.5" cy="83.22" r="2.8"/><circle class="il-red il-ink il-thin" cx="101.42" cy="74.31" r="2.8"/><circle class="il-white il-ink il-thin" cx="101.42" cy="62.69" r="2.8"/><circle class="il-red il-ink il-thin" cx="104.5" cy="53.78" r="2.8"/><circle class="il-white il-ink il-thin" cx="109.22" cy="51.76" r="2.8"/><circle class="il-red il-ink il-thin" cx="113.36" cy="57.57" r="2.8"/><ellipse class="il-green il-ink il-thin" cx="114.58" cy="74.31" rx="3" ry="1.8" transform="rotate(98.52 114.58 74.31)"/><ellipse class="il-green il-ink il-thin" cx="111.5" cy="83.22" rx="3" ry="1.8" transform="rotate(125.5 111.5 83.22)"/><ellipse class="il-green il-ink il-thin" cx="106.78" cy="85.24" rx="3" ry="1.8" transform="rotate(-156.82 106.78 85.24)"/><ellipse class="il-green il-ink il-thin" cx="102.64" cy="79.43" rx="3" ry="1.8" transform="rotate(-109.06 102.64 79.43)"/><ellipse class="il-green il-ink il-thin" cx="101" cy="68.5" rx="3" ry="1.8" transform="rotate(-90 101 68.5)"/><ellipse class="il-green il-ink il-thin" cx="102.64" cy="57.57" rx="3" ry="1.8" transform="rotate(-70.94 102.64 57.57)"/><ellipse class="il-green il-ink il-thin" cx="106.78" cy="51.76" rx="3" ry="1.8" transform="rotate(-23.18 106.78 51.76)"/><ellipse class="il-green il-ink il-thin" cx="111.5" cy="53.78" rx="3" ry="1.8" transform="rotate(54.5 111.5 53.78)"/><ellipse class="il-green il-ink il-thin" cx="114.58" cy="62.69" rx="3" ry="1.8" transform="rotate(81.48 114.58 62.69)"/>
    </g>
    <g transform="translate(136 46) scale(0.85 0.85)">
    <rect class="il-dark il-ink il-thin" x="-8" y="34" width="7" height="14"/><rect class="il-dark il-ink il-thin" x="1" y="34" width="7" height="14"/>
    <path class="il-dark il-ink il-thin" d="M-10 50v-3h9v3zM10 50v-3h-9v3z"/>
    <path class="il-red il-ink" d="M-11 10c-4 0-5 3-5 7l-1 19h34l-1-19c0-4-1-7-5-7z"/>
    <path class="il-line il-thin" d="M0 11v24"/><circle class="il-gold" cx="2.5" cy="18" r="1"/><circle class="il-gold" cx="2.5" cy="25" r="1"/>
    <rect class="il-skin il-ink il-thin" x="-3" y="7" width="6" height="5"/>
    <circle class="il-skin il-ink" cx="0" cy="0" r="9"/>
    <path class="il-blue il-ink il-thin" d="M-10 -6c-1-4 0-8 2-9h16c2 1 3 5 2 9z"/><rect class="il-gold il-ink il-thin" x="-9" y="-8" width="18" height="3"/><path class="il-dark il-ink il-thin" d="M-9 -5h16q-2 3-13 2z"/>
    <path class="il-line il-thin" d="M-5.5 -1q2-2 4 0M1.5 -1q2-2 4 0"/><circle class="il-pink il-ink il-thin" cx="-6" cy="4" r="3"/><circle class="il-pink il-ink il-thin" cx="6" cy="4" r="3"/><circle class="il-dark" cx="0" cy="5" r="1.3"/>
    <circle class="il-gold il-ink" cx="0" cy="24" r="10"/><circle class="il-gold il-ink il-thin" cx="0" cy="24" r="5"/><path class="il-gold il-ink il-thin" d="M-4 15l-6-12 4-2 6 12z"/><path class="il-gold il-ink" d="M-4 -2c0-10 8-16 18-16l2 14c-8 0-12 2-14 6z"/><ellipse class="il-dark il-ink il-thin" cx="15" cy="-11" rx="2" ry="7"/><rect class="il-metal il-ink il-thin" x="-12" y="20" width="4" height="6"/><circle class="il-skin il-ink il-thin" cx="-10" cy="30" r="3"/><circle class="il-skin il-ink il-thin" cx="9" cy="16" r="3"/>
    </g>
    <g transform="translate(110 18) scale(1)"><ellipse class="il-dark" cx="0" cy="8" rx="3" ry="2.2"/><path class="il-line il-thin" d="M2.6 8V-2l5 2"/></g><g transform="translate(124 8) scale(0.8)"><ellipse class="il-dark" cx="0" cy="8" rx="3" ry="2.2"/><path class="il-line il-thin" d="M2.6 8V-2l5 2"/></g><g transform="translate(100 32) scale(0.7)"><ellipse class="il-dark" cx="0" cy="8" rx="3" ry="2.2"/><path class="il-line il-thin" d="M2.6 8V-2l5 2"/></g>
    <path class="il-yellow" d="M60 10h3v3h-3zM90 6h3v3h-3zM44 18h2.4v2.4H44zM150 20h3v3h-3zM8 12h3v3H8z"/>
    <path class="il-pink" d="M74 16h3v3h-3zM104 48h3v3h-3zM36 6h3v3h-3zM140 4h2.4v2.4H140z"/>
    <path class="il-teal" d="M52 4h3v3h-3zM118 36h3v3h-3zM20 22h2.4v2.4H20z"/>`,

  // Two little locos, one red and one blue, are coupled nose to tail in front of a single carriage; the rear one
  // gazes at the front one with heart eyes and their steam puffs merge into a heart.
  'rw.double-header': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-stone" x="0" y="99" width="160" height="21"/>
    <g opacity="0.5"><path class="il-line il-thin" d="M6 111h3M22 115h2M44 110h3M70 114h3M96 111h2M118 115h3M142 110h3"/></g>
    <rect class="il-wood-dark il-ink il-thin" x="2" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="20" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="38" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="56" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="74" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="92" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="110" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="128" y="102" width="10" height="4" rx="1"/><rect class="il-wood-dark il-ink il-thin" x="146" y="102" width="10" height="4" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="0" y="99" width="160" height="3"/>
    <rect class="il-green il-ink" x="-6" y="62" width="22" height="30" rx="4"/>
    <rect class="il-dark il-ink" x="-8" y="58" width="26" height="6" rx="3"/>
    <rect class="il-sky il-ink il-thin" x="0" y="68" width="12" height="12" rx="2"/>
    <circle class="il-dark il-ink" cx="6" cy="95" r="5"/>
    <rect class="il-dark il-ink il-thin" x="15" y="86" width="5" height="3"/>
    <g transform="translate(16 41) scale(0.59)">
    <rect class="il-blue il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-blue il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><path class="il-red il-ink il-thin" d="M92 66l-4-4a2.2 2.2 0 0 1 4-2.6a2.2 2.2 0 0 1 4 2.6zM104 66l-4-4a2.2 2.2 0 0 1 4-2.6a2.2 2.2 0 0 1 4 2.6z"/><path class="il-white il-ink il-thin" d="M91 72q7 7 14 0z"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <g transform="translate(87 41) scale(0.59)">
    <rect class="il-red il-ink" x="8" y="40" width="34" height="44" rx="2"/>
    <rect class="il-sky il-ink il-thin" x="15" y="47" width="18" height="15" rx="2"/>
    <path class="il-light il-thin" d="M18 50l4-1"/>
    <rect class="il-dark il-ink" x="3" y="34" width="44" height="7" rx="2"/>
    <path class="il-line il-thin" d="M12 68h24"/>
    <rect class="il-red il-ink" x="42" y="54" width="52" height="30" rx="3"/>
    <path class="il-light il-thin" d="M46 59h12" opacity="0.6"/>
    <path class="il-gold il-ink il-thin" d="M56 54h4v30h-4z"/>
    <path class="il-gold il-ink" d="M47 54a6.5 6.5 0 0 1 13 0z"/>
    <path class="il-dark il-ink" d="M70 54v-10h-3l-1-8h18l-1 8h-3v10z"/>
    <rect class="il-dark il-ink" x="92" y="52" width="16" height="33" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M91 52h4v33h-4z"/>
    <circle class="il-metal" cx="99" cy="56" r="0.9"/><circle class="il-metal" cx="99" cy="68" r="0.9"/><circle class="il-metal" cx="99" cy="80" r="0.9"/>
    <ellipse class="il-dark il-ink" cx="108" cy="68.5" rx="4.5" ry="15"/>
    <circle class="il-metal" cx="108" cy="57" r="0.9"/><circle class="il-metal" cx="108" cy="80" r="0.9"/>
    <path class="il-light il-thin" d="M105.5 68.5h6"/><circle class="il-metal il-ink il-thin" cx="108" cy="68.5" r="1.6"/>
    <rect class="il-dark il-ink il-thin" x="97" y="45" width="7" height="7" rx="1.5"/><path class="il-yellow il-ink il-thin" d="M104 46.5h2v4h-2z"/>
    <g transform="translate(-21 0)"><circle class="il-white il-ink il-thin" cx="92" cy="63" r="4.6"/><circle class="il-white il-ink il-thin" cx="104" cy="63" r="4.6"/><circle class="il-dark" cx="93" cy="64" r="2.1"/><circle class="il-dark" cx="105" cy="64" r="2.1"/><path class="il-line il-thin" d="M88 57l6-1M102 56l6 1"/><path class="il-white il-ink il-thin" d="M90 72q8 9 16 0z"/><ellipse class="il-pink" cx="87" cy="72" rx="3.2" ry="2"/><ellipse class="il-pink" cx="109" cy="72" rx="3.2" ry="2"/></g>
    <rect class="il-dark il-ink" x="2" y="83" width="108" height="5" rx="1"/>
    <rect class="il-dark il-ink il-thin" x="108" y="78" width="7" height="7" rx="1.5"/>
    <circle class="il-red il-ink" cx="24" cy="91" r="9"/><path class="il-line il-thin" d="M18 91h12M24 85v12"/><circle class="il-metal il-ink il-thin" cx="24" cy="91" r="2.6"/><circle class="il-red il-ink" cx="50" cy="91" r="9"/><path class="il-line il-thin" d="M44 91h12M50 85v12"/><circle class="il-metal il-ink il-thin" cx="50" cy="91" r="2.6"/><circle class="il-red il-ink" cx="74" cy="91" r="9"/><path class="il-line il-thin" d="M68 91h12M74 85v12"/><circle class="il-metal il-ink il-thin" cx="74" cy="91" r="2.6"/>
    <rect class="il-metal il-ink il-thin" x="22" y="92" width="54" height="3" rx="1.5"/>
    </g>
    <circle class="il-smoke il-ink il-thin" cx="61" cy="50" r="4"/><circle class="il-smoke il-ink il-thin" cx="66" cy="42" r="5"/><circle class="il-smoke il-ink il-thin" cx="132" cy="50" r="4"/><circle class="il-smoke il-ink il-thin" cx="126" cy="42" r="5"/>
    <path class="il-red il-ink" d="M96 40l-10-8a6 6 0 0 1 10-7 6 6 0 0 1 10 7z"/>
    <path class="il-light il-thin" d="M90 30q2-3 4-2"/>
    <path class="il-line il-thin" d="M80 22l2-6M96 16v-6M112 22l-2-6"/>
    <path class="il-line il-thin" d="M150 70l6-2M150 78h7"/>`,

  // One worker split down the middle: the morning half wears a signal-box cap and pulls a red-handled signal lever
  // under the sun, the night half wears a white waiter's jacket and bow tie and carries a dining-car tray under the
  // moon, and both halves are fast asleep standing up.
  'rw.split-shift': `
    <rect class="il-sky" x="0" y="0" width="80" height="120"/>
    <rect class="il-night" x="80" y="0" width="80" height="120"/>
    <circle class="il-yellow il-ink" cx="16" cy="16" r="8"/>
    <path class="il-line il-thin" d="M16 2v3M16 27v3M2 16h3M27 16h3M6 6l2 2M26 26l-2-2M6 26l2-2"/>
    <path class="il-yellow il-ink" d="M148 8a9 9 0 1 0 6 14 7 7 0 0 1-6-14z"/>
    <path class="il-white il-ink il-thin" d="M126 9l0.9 2.1 2.1 0.9-2.1 0.9-0.9 2.1-0.9-2.1-2.1-0.9 2.1-0.9z"/><path class="il-white il-ink il-thin" d="M140 31.5l0.75 1.75 1.75 0.75-1.75 0.75-0.75 1.75-0.75-1.75-1.75-0.75 1.75-0.75z"/><path class="il-yellow il-ink il-thin" d="M104 17.5l0.75 1.75 1.75 0.75-1.75 0.75-0.75 1.75-0.75-1.75-1.75-0.75 1.75-0.75z"/>
    <rect class="il-wood il-ink" x="2" y="34" width="30" height="22"/>
    <rect class="il-sky il-ink il-thin" x="6" y="38" width="10" height="10"/><rect class="il-sky il-ink il-thin" x="19" y="38" width="10" height="10"/>
    <path class="il-red il-ink" d="M0 34l17-10 17 10z"/>
    <rect class="il-red il-ink il-thin" x="130" y="46" width="28" height="22" rx="3"/>
    <rect class="il-white il-ink il-thin" x="132" y="70" width="24" height="3"/>
    <path class="il-glow il-ink il-thin" d="M140 50h8l3 8h-14z"/><rect class="il-gold il-ink il-thin" x="143" y="58" width="2" height="10"/>
    <rect class="il-earth-dark il-ink" x="0" y="100" width="80" height="20"/>
    <rect class="il-wood-dark il-ink" x="80" y="100" width="80" height="20"/>
    <path class="il-red il-ink il-thin" d="M80 104h80v4H80z" opacity="0.6"/>
    <rect class="il-dark il-ink" x="16" y="92" width="26" height="8"/>
    <path class="il-metal il-ink" d="M27 92l13-42 4 1-12 41z"/>
    <rect class="il-red il-ink" x="36" y="42" width="12" height="9" rx="3" transform="rotate(16 42 46)"/>
    <path class="il-blue il-ink" d="M58 62c-8 0-10 4-10 10l-2 20h34V62z"/>
    <path class="il-white il-ink" d="M102 62c8 0 10 4 10 10l2 20H80V62z"/>
    <path class="il-dark il-ink il-thin" d="M80 64l-6-3v7zM80 64l6-3v7z"/>
    <circle class="il-dark" cx="80" cy="64" r="1.4"/>
    <circle class="il-gold" cx="92" cy="76" r="1.3"/><circle class="il-gold" cx="92" cy="84" r="1.3"/>
    <path class="il-blue il-ink il-thin" d="M50 66l-6 2-2-12 6-2z"/>
    <circle class="il-skin il-ink il-thin" cx="44" cy="52" r="3.6"/>
    <path class="il-white il-ink il-thin" d="M110 66l14-4 1 5-14 4z"/>
    <circle class="il-skin il-ink il-thin" cx="124" cy="64" r="3.4"/>
    <ellipse class="il-metal il-ink" cx="128" cy="58" rx="16" ry="3"/>
    <path class="il-metal il-ink" d="M118 58a10 10 0 0 1 20 0z"/><circle class="il-metal il-ink il-thin" cx="128" cy="46.5" r="2"/>
    <path class="il-light il-thin" d="M122 54q2-4 6-5"/>
    <rect class="il-blue il-ink il-thin" x="64" y="92" width="14" height="22"/>
    <rect class="il-dark il-ink il-thin" x="82" y="92" width="14" height="22"/>
    <path class="il-dark il-ink il-thin" d="M62 116h16v-3H62zM82 116h16v-3H82z"/>
    <rect class="il-skin il-ink" x="74" y="54" width="12" height="9"/>
    <circle class="il-skin il-ink" cx="80" cy="44" r="13"/>
    <path class="il-line il-thin" d="M80 31v26" opacity="0.4"/>
    <path class="il-line" d="M70 45q3 2 6 0M84 45q3 2 6 0"/>
    <ellipse class="il-dark" cx="80" cy="52" rx="2" ry="1.6"/>
    <path class="il-blue il-ink" d="M80 34H66c0-8 6-12 14-12z"/><rect class="il-gold il-ink il-thin" x="66" y="30" width="14" height="3"/>
    <path class="il-dark il-ink il-thin" d="M66 34h14v2q-10 2-16 1z"/>
    <path class="il-earth-dark il-ink il-thin" d="M80 34h13c0-8-5-12-13-12z"/>
    <path class="il-line il-thin" d="M84 24q4 2 7 7" opacity="0.6"/>
    <path class="il-light il-thin" d="M96 26h6l-6 6h6M106 14h5l-5 5h5M116 4h4l-4 4h4"/>`,
};
