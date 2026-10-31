/* Spaceloot illustrations: encounter. */
export const SL_ENCOUNTER: Readonly<Record<string, string>> = {
  // A planet-sized purple blob with its own little moon circling on an orbit and its own personal rain cloud (with lightning) over its head; it looks unimpressed.
  'sl.supermassive': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="12" r="1"/><circle cx="30" cy="30" r="0.8"/><circle cx="140" cy="14" r="1"/><circle cx="152" cy="44" r="0.8"/><circle cx="14" cy="100" r="0.8"/><circle cx="148" cy="110" r="1"/><circle cx="120" cy="6" r="0.8"/></g>
    <g class="il-yellow"><circle cx="22" cy="56" r="1.2"/><circle cx="134" cy="36" r="1.2"/><circle cx="40" cy="114" r="1"/></g>
    <ellipse class="il-light il-thin il-dash" cx="80" cy="74" rx="74" ry="16" opacity="0.5"/>
    <path class="il-purple il-ink" d="M28 108C20 70 40 36 80 36s60 34 52 72q-52 9-104 0z"/>
    <path class="il-light il-thin" opacity="0.4" d="M40 82q2-24 22-36"/>
    <g class="il-purple-dark"><circle cx="110" cy="56" r="4"/><circle cx="118" cy="72" r="2.4"/><circle cx="42" cy="96" r="3"/><circle cx="112" cy="98" r="2"/><circle cx="50" cy="58" r="2"/></g>
    <path class="il-purple il-ink" d="M30 84q-12 2-14 12l6 2q2-6 9-7z"/><circle class="il-purple il-ink" cx="18" cy="98" r="4"/>
    <path class="il-purple il-ink" d="M130 84q12 2 14 12l-6 2q-2-6-9-7z"/><circle class="il-purple il-ink" cx="142" cy="98" r="4"/>
    <circle class="il-white il-ink" cx="68" cy="64" r="9"/><circle class="il-white il-ink" cx="92" cy="64" r="9"/>
    <circle class="il-dark" cx="69" cy="66" r="3.6"/><circle class="il-dark" cx="93" cy="66" r="3.6"/>
    <path class="il-purple il-ink il-thin" d="M59 63a9 9 0 0 1 18 0zM83 63a9 9 0 0 1 18 0z"/>
    <path class="il-line" d="M72 82q8-3 16 0"/>
    <path class="il-grey il-ink" d="M62 26a8 8 0 0 1 6-12a10 10 0 0 1 18-4a9 9 0 0 1 14 8a6 6 0 0 1-2 10H64z"/>
    <path class="il-yellow il-ink il-thin" d="M84 28l-4 6h4l-3 5 8-8h-4l2-3z"/>
    <g class="il-water il-ink il-thin"><ellipse cx="68" cy="32" rx="1.4" ry="2.2"/><ellipse cx="96" cy="31" rx="1.4" ry="2.2"/><ellipse cx="74" cy="34" rx="1.2" ry="2"/></g>
    <path class="il-light il-thin" d="M64 40l-2-2M72 38l2-2M98 39l2-2"/>
    <path class="il-light il-thin il-dash" d="M6 74a74 16 0 0 0 148 0"/>
    <path class="il-light il-thin" d="M118 88h-8M120 92h-6"/>
    <circle class="il-stone il-ink" cx="140" cy="83" r="7"/>
    <circle class="il-grey" cx="143" cy="86" r="1.6"/><circle class="il-grey" cx="137" cy="79" r="1.2"/>
    <circle class="il-dark" cx="138" cy="82" r="0.9"/><circle class="il-dark" cx="142" cy="82" r="0.9"/>
    <path class="il-line il-thin" d="M138 85q2 1.5 4 0"/>`,

  // An ancient alien elder (white beard, bushy brows, glasses, cobweb on an antenna, walking stick) proudly shows how small the whole universe once was: a tiny glowing marble between two fingers.
  'sl.since-big-bang': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="12" cy="14" r="1"/><circle cx="26" cy="44" r="0.8"/><circle cx="146" cy="12" r="1"/><circle cx="150" cy="72" r="0.8"/><circle cx="130" cy="104" r="1"/><circle cx="16" cy="78" r="0.8"/></g>
    <g class="il-yellow"><circle cx="140" cy="40" r="1.2"/><circle cx="110" cy="96" r="1"/><circle cx="34" cy="20" r="1"/></g>
    <path class="il-purple il-ink" d="M38 120C38 88 50 74 70 74s32 14 32 46z"/>
    <path class="il-light il-thin" opacity="0.3" d="M56 120v-28M86 120v-28"/>
    <path class="il-line il-thick" d="M28 120V86q0-8 8-8h6"/>
    <circle class="il-green il-ink" cx="44" cy="80" r="5"/>
    <path class="il-line" d="M62 32 52 14M80 32l10-18"/>
    <circle class="il-green il-ink il-thin" cx="52" cy="13" r="3"/><circle class="il-green il-ink il-thin" cx="90" cy="13" r="3"/>
    <path class="il-light il-thin" opacity="0.7" d="M90 13l12-6M90 13l13 3M90 13l9 9M96 10l1 7 4-4"/>
    <ellipse class="il-green il-ink" cx="70" cy="50" rx="24" ry="22"/>
    <path class="il-line il-thin" opacity="0.5" d="M58 35q12-4 24 0M61 40q9-3 18 0"/>
    <path class="il-beard il-ink" d="M52 58c2 24 10 40 18 50 8-10 16-26 18-50-8 7-28 7-36 0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M62 72l3 10M78 72l-3 10M70 78v12"/>
    <ellipse class="il-white il-ink il-thin" cx="61" cy="52" rx="6" ry="5"/><ellipse class="il-white il-ink il-thin" cx="79" cy="52" rx="6" ry="5"/>
    <circle class="il-dark" cx="64" cy="50" r="2.4"/><circle class="il-dark" cx="82" cy="50" r="2.4"/>
    <circle class="il-line il-thin" cx="61" cy="52" r="8"/><circle class="il-line il-thin" cx="79" cy="52" r="8"/>
    <path class="il-line il-thin" d="M69 51h2"/>
    <path class="il-beard il-ink il-thin" d="M51 43q5-7 13-3-6 0-13 3zM89 43q-5-7-13-3 6 0 13 3z"/>
    <path class="il-line il-thin" d="M65 62q5 3 10 0"/>
    <path class="il-purple il-ink" d="M92 84q14-10 22-30l7 3q-6 22-24 34z"/>
    <circle class="il-torch" cx="120" cy="38" r="13"/>
    <circle class="il-glow il-ink il-thin" cx="120" cy="38" r="4.5"/>
    <path class="il-line il-thin" d="M118 38a2 2 0 1 1 2 2"/>
    <g class="il-yellow"><circle cx="110" cy="30" r="1"/><circle cx="131" cy="32" r="1"/><circle cx="126" cy="26" r="0.8"/></g>
    <path class="il-light il-thin" d="M112 26l2 3M128 24l-2 3M120 21v3"/>
    <ellipse class="il-green il-ink il-thin" cx="114.5" cy="41" rx="2.2" ry="4.5"/><ellipse class="il-green il-ink il-thin" cx="125.5" cy="41" rx="2.2" ry="4.5"/>
    <circle class="il-green il-ink" cx="120" cy="50" r="5.5"/>`,

  // On a shabby ship deck an android holds its phone up as high as it can, hunting for Wi-Fi (crossed-out signal); its screen face is furious and steaming. Through the porthole: a tiny planet with a router on it.
  'sl.wifi-rage': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 40h160M0 80h160M46 0v40M30 40v40M104 40v40"/>
    <g class="il-dark" opacity="0.5"><circle cx="4" cy="44" r="1"/><circle cx="26" cy="44" r="1"/><circle cx="50" cy="4" r="1"/><circle cx="100" cy="76" r="1"/><circle cx="34" cy="76" r="1"/></g>
    <path class="il-metal il-ink" d="M0 10h40q6 0 6 6v4h-6v-2q0-2-2-2H0z"/>
    <path class="il-dark" d="M0 102h160v18H0z"/>
    <path class="il-light il-thin" opacity="0.2" d="M0 108h160"/>
    <circle class="il-metal il-ink" cx="132" cy="26" r="18"/>
    <circle class="il-night il-ink il-thin" cx="132" cy="26" r="13"/>
    <g class="il-dark"><circle cx="132" cy="10" r="1"/><circle cx="148" cy="26" r="1"/><circle cx="132" cy="42" r="1"/><circle cx="116" cy="26" r="1"/></g>
    <g class="il-white"><circle cx="126" cy="20" r="0.7"/><circle cx="140" cy="18" r="0.7"/><circle cx="124" cy="32" r="0.7"/></g>
    <circle class="il-teal il-ink il-thin" cx="136" cy="32" r="5"/>
    <rect class="il-dark" x="133" y="25" width="6" height="2.4"/><path class="il-light il-thin" d="M134 25v-3M138 25v-3"/>
    <g transform="translate(62 108)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-14 12 4 5 14-11z"/>
    <circle class="il-metal il-ink" cx="-32" cy="-28" r="5.5"/>
    <path class="il-line il-thin" d="M-40 -34l-3-2M-41 -26h-4M-38 -20l-3 2"/>
    <path class="il-metal il-ink" d="M16 -44l14-28 6 3-14 29z"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <g class="il-dark"><circle cx="-16" cy="-46" r="1"/><circle cx="16" cy="-46" r="1"/><circle cx="-16" cy="-19" r="1"/><circle cx="16" cy="-19" r="1"/></g>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <path class="il-light il-thin" d="M-8 -38h4l2-3 3 6 2-3h5"/>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-24" r="2"/><circle class="il-yellow il-ink il-thin" cx="0" cy="-24" r="2"/><circle class="il-red il-ink il-thin" cx="6" cy="-24" r="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M-6 -84l-4-8"/><circle class="il-red il-ink il-thin" cx="-11" cy="-94" r="3"/>
    <path class="il-red" d="M-11 -75l8 4-8 2zM11 -75l-8 4 8 2z"/>
    <path class="il-light il-thin" d="M-9 -63l3-3 3 3 3-3 3 3 3-3 3 3"/>
    <circle class="il-smoke il-ink il-thin" cx="-26" cy="-86" r="4"/><circle class="il-smoke il-ink il-thin" cx="-32" cy="-94" r="5"/><circle class="il-smoke il-ink il-thin" cx="-27" cy="-103" r="3"/>
    <rect class="il-dark il-ink" x="26" y="-104" width="18" height="28" rx="3"/>
    <rect class="il-teal" x="28.5" y="-100" width="13" height="20" rx="1"/>
    <g opacity="0.45"><circle class="il-white" cx="35" cy="-84" r="1.5"/><path class="il-light il-thin" d="M31 -87a5 5 0 0 1 8 0M28.5 -90a9 9 0 0 1 13 0"/></g>
    <rect class="il-red il-ink il-thin" x="27" y="-91" width="16" height="3" transform="rotate(-38 35 -89.5)"/>
    <circle class="il-metal il-ink" cx="34" cy="-74" r="5.5"/>
    <path class="il-light il-thin" d="M48 -100l5-3M49 -92h6M22 -104l-4-4"/>
    </g>`,

  // A small saucer arrives a bit sheepishly; behind it looms its huge mothership (with eyelashes and a pink bow, beaming it along) and behind her a whole row of sibling saucers.
  'sl.brought-mothership': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="8" cy="40" r="1"/><circle cx="152" cy="42" r="1"/><circle cx="20" cy="108" r="0.8"/><circle cx="140" cy="112" r="0.8"/><circle cx="84" cy="4" r="0.8"/></g>
    <g class="il-yellow"><circle cx="40" cy="90" r="1.2"/><circle cx="124" cy="84" r="1"/><circle cx="12" cy="74" r="1"/></g>
    <g opacity="0.85">
    <path class="il-water il-ink il-thin" d="M56 12a4 3 0 0 1 8 0z"/><ellipse class="il-metal il-ink il-thin" cx="60" cy="12" rx="9" ry="2.5"/>
    <path class="il-water il-ink il-thin" d="M100 10a4 3 0 0 1 8 0z"/><ellipse class="il-metal il-ink il-thin" cx="104" cy="10" rx="9" ry="2.5"/>
    <path class="il-water il-ink il-thin" d="M18 22a8 6 0 0 1 16 0z"/><ellipse class="il-metal il-ink" cx="26" cy="23" rx="17" ry="5"/>
    <circle class="il-dark" cx="23" cy="19" r="1"/><circle class="il-dark" cx="29" cy="19" r="1"/>
    <path class="il-water il-ink il-thin" d="M126 22a8 6 0 0 1 16 0z"/><ellipse class="il-metal il-ink" cx="134" cy="23" rx="17" ry="5"/>
    <circle class="il-dark" cx="131" cy="19" r="1"/><circle class="il-dark" cx="137" cy="19" r="1"/>
    </g>
    <path class="il-torch" d="M64 58h32l14 38H50z" opacity="0.6"/>
    <ellipse class="il-grey il-ink" cx="80" cy="55" rx="38" ry="8"/>
    <path class="il-water il-ink" d="M50 46a30 22 0 0 1 60 0z"/>
    <path class="il-light il-thin" opacity="0.6" d="M58 40q4-12 14-14"/>
    <ellipse class="il-metal il-ink" cx="80" cy="48" rx="64" ry="12"/>
    <rect class="il-stone il-ink il-thin" x="32" y="45" width="9" height="6"/>
    <path class="il-line il-thin" d="M33 46l7 4M40 46l-7 4"/>
    <g class="il-yellow il-ink il-thin"><circle cx="24" cy="49" r="2"/><circle cx="50" cy="53" r="2"/><circle cx="66" cy="55" r="2"/><circle cx="94" cy="55" r="2"/><circle cx="110" cy="53" r="2"/><circle cx="136" cy="49" r="2"/></g>
    <circle class="il-red il-ink il-thin" cx="122" cy="51" r="2"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="36" r="4.5"/><circle class="il-white il-ink il-thin" cx="89" cy="36" r="4.5"/>
    <circle class="il-dark" cx="71" cy="38" r="2"/><circle class="il-dark" cx="89" cy="38" r="2"/>
    <path class="il-line il-thin" d="M66 32l-2-2M69 31l-1-3M94 32l2-2M91 31l1-3"/>
    <path class="il-line il-thin" d="M74 42q6 4 12 0"/>
    <path class="il-pink il-ink il-thin" d="M80 25l-8-5v10zM80 25l8-5v10z"/><circle class="il-pink il-ink il-thin" cx="80" cy="25" r="2"/>
    <ellipse class="il-grey il-ink il-thin" cx="80" cy="101" rx="12" ry="3"/>
    <path class="il-water il-ink" d="M68 97a12 10 0 0 1 24 0z"/>
    <circle class="il-green il-ink il-thin" cx="80" cy="92" r="5"/>
    <circle class="il-dark" cx="78" cy="91" r="1"/><circle class="il-dark" cx="82" cy="91" r="1"/>
    <path class="il-line il-thin" d="M78 94.5q2 1 4 0M78 87l-2-3M82 87l2-3"/>
    <ellipse class="il-metal il-ink" cx="80" cy="98" rx="26" ry="6"/>
    <g class="il-yellow il-ink il-thin"><circle cx="64" cy="98" r="1.4"/><circle cx="80" cy="101" r="1.4"/><circle cx="96" cy="98" r="1.4"/></g>
    <path class="il-water il-ink il-thin" d="M94 88q2-3 0-5-2 3 0 5z"/>`,

  // An android with an embarrassed "oops" face has zapped a monster with its shrink ray: the monster now sits in a matchbox drawer, tiny, shaking a tiny fist.
  'sl.shrink-ray': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 36h160M0 84h160M60 0v36M120 36v48"/>
    <rect class="il-dark il-ink il-thin" x="96" y="10" width="40" height="18" rx="3"/>
    <circle class="il-red il-ink il-thin" cx="106" cy="19" r="4"/><circle class="il-green il-ink il-thin" cx="118" cy="19" r="4"/>
    <rect class="il-light il-thin" x="125" y="13" width="10" height="10"/><rect class="il-white" x="128.5" y="16.5" width="3" height="3"/>
    <path class="il-dark" d="M0 104h160v16H0z"/>
    <g transform="translate(28 106) scale(0.85)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-10 18 5 3 10-17z"/><circle class="il-metal il-ink" cx="-26" cy="-23" r="5"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <g class="il-dark"><circle cx="-16" cy="-46" r="1"/><circle cx="16" cy="-46" r="1"/><circle cx="-16" cy="-19" r="1"/><circle cx="16" cy="-19" r="1"/></g>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-24" r="2"/><circle class="il-yellow il-ink il-thin" cx="0" cy="-24" r="2"/><circle class="il-green il-ink il-thin" cx="6" cy="-24" r="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <circle class="il-glow" cx="-6" cy="-71" r="3.4"/><circle class="il-glow" cx="6" cy="-71" r="3.4"/>
    <circle class="il-dark" cx="-5" cy="-71" r="1.2"/><circle class="il-dark" cx="7" cy="-71" r="1.2"/>
    <circle class="il-light il-thin" cx="1" cy="-63" r="2"/>
    <path class="il-water il-ink il-thin" d="M22 -86q3 4 0 6-3-2 0-6z"/>
    <rect class="il-red il-ink" x="16" y="-52" width="22" height="11" rx="3"/>
    <rect class="il-wood-dark il-ink il-thin" x="20" y="-43" width="6" height="11" rx="1"/>
    <ellipse class="il-metal il-ink il-thin" cx="40" cy="-46.5" rx="2" ry="6"/>
    <ellipse class="il-metal il-ink il-thin" cx="44" cy="-46.5" rx="2" ry="8"/>
    <ellipse class="il-metal il-ink il-thin" cx="48" cy="-46.5" rx="2" ry="10"/>
    <path class="il-metal il-ink" d="M18 -44l6 6 4-4-6-6z"/><circle class="il-metal il-ink" cx="24" cy="-38" r="4.5"/>
    </g>
    <path class="il-glow" opacity="0.75" d="M70 66L88 60L90 80L70 70z"/>
    <path class="il-light il-thin" d="M72 67l5-2 3 3 4-3 3 2"/>
    <g class="il-yellow"><circle cx="90" cy="58" r="1.2"/><circle cx="92" cy="82" r="1.2"/><circle cx="86" cy="54" r="0.9"/></g>
    <path class="il-purple-dark il-ink il-thin" d="M94 66l-2-6 5 3zM110 66l2-6-5 3z"/>
    <ellipse class="il-purple il-ink" cx="102" cy="74" rx="10" ry="9"/>
    <circle class="il-white il-ink il-thin" cx="98" cy="72" r="2.6"/><circle class="il-white il-ink il-thin" cx="106" cy="72" r="2.6"/>
    <circle class="il-dark" cx="98.5" cy="72.5" r="1.1"/><circle class="il-dark" cx="105.5" cy="72.5" r="1.1"/>
    <path class="il-line il-thin" d="M95 68l5 2M109 68l-5 2M99 78q3-2 6 0"/>
    <path class="il-purple il-ink il-thin" d="M111 72l5-8 3 1-5 8z"/><circle class="il-purple il-ink il-thin" cx="118" cy="63" r="2.6"/>
    <path class="il-line il-thin" d="M122 60l2-2M123 64h3"/>
    <path class="il-dark il-ink il-thin" d="M78 80h40v4H78z"/>
    <path class="il-paper il-ink" d="M76 80h44v16H76z"/>
    <path class="il-line il-thin" opacity="0.3" d="M80 88h36"/>
    <path class="il-red il-ink" d="M104 78h48v26h-48z"/>
    <path class="il-yellow il-ink il-thin" d="M110 84h36v14h-36z"/>
    <path class="il-orange il-ink il-thin" d="M128 97c-5 0-6-5-3-8 1 2 2 2 2 0 0-3 2-5 4-6-1 3 3 5 3 9 0 3-2 5-6 5z"/>
    <path class="il-earth-dark" d="M104 100h48v4h-48z"/>
    <path class="il-light il-thin" opacity="0.5" d="M108 81h16"/>`,

  // A big orange monster yawns hugely, with baggy eyes and a sleep mask pushed up on its forehead, surrounded by seven floating clocks that all show different times.
  'sl.space-lag': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="50" cy="8" r="0.8"/><circle cx="112" cy="10" r="1"/><circle cx="6" cy="40" r="0.8"/><circle cx="154" cy="88" r="0.8"/><circle cx="60" cy="114" r="0.8"/></g>
    <g class="il-yellow"><circle cx="40" cy="30" r="1"/><circle cx="124" cy="40" r="1"/><circle cx="104" cy="114" r="1"/></g>
    <path class="il-orange il-ink" d="M38 120C34 80 50 40 80 40s46 40 42 80z"/>
    <path class="il-light il-thin" opacity="0.4" d="M48 90q0-26 14-40"/>
    <g class="il-earth"><circle cx="110" cy="96" r="3"/><circle cx="52" cy="104" r="2.4"/><circle cx="106" cy="66" r="2"/></g>
    <path class="il-blue il-ink" d="M50 50q30-10 60 0l-1 8q-29-9-58 0z"/>
    <ellipse class="il-blue il-ink il-thin" cx="68" cy="49" rx="8" ry="5"/><ellipse class="il-blue il-ink il-thin" cx="92" cy="49" rx="8" ry="5"/>
    <path class="il-white il-ink il-thin" d="M58 66a8 6 0 0 0 16 0zM86 66a8 6 0 0 0 16 0z"/>
    <circle class="il-dark" cx="66" cy="68" r="2"/><circle class="il-dark" cx="94" cy="68" r="2"/>
    <path class="il-line il-thick" d="M57 66h18M85 66h18"/>
    <path class="il-purple-dark" opacity="0.6" d="M58 74q8 5 16 0-8 2-16 0zM86 74q8 5 16 0-8 2-16 0z"/>
    <ellipse class="il-water il-ink il-thin" cx="56" cy="72" rx="1.6" ry="2.4"/>
    <ellipse class="il-dark il-ink" cx="80" cy="92" rx="13" ry="14"/>
    <path class="il-white" d="M72 81h16l-2 3h-12z"/>
    <path class="il-pink il-ink il-thin" d="M72 100q8-7 16 0q-8 5-16 0z"/>
    <path class="il-orange il-ink" d="M40 96q-8 8 0 16l8-4z"/><path class="il-orange il-ink" d="M120 96q8 8 0 16l-8-4z"/>
    <g class="il-white il-ink il-thin">
      <circle cx="18" cy="18" r="8"/><circle cx="142" cy="20" r="8"/><circle cx="16" cy="64" r="8"/><circle cx="144" cy="64" r="8"/>
      <circle cx="22" cy="104" r="8"/><circle cx="138" cy="104" r="8"/><circle cx="80" cy="14" r="8"/>
    </g>
    <path class="il-line il-thin" d="M18 18v-5M18 18h4M142 20l3 4M142 20l-4-2M16 64v5M16 64h-4M144 64l-3-4M144 64l4 1M22 104l-4 3M22 104v-6M138 104h5M138 104l2-5M80 14l-3-4M80 14l4 3"/>
    <path class="il-light il-thin" opacity="0.6" d="M30 20q4 2 6 6M128 22q-4 2-6 6M28 96q4-2 8-2"/>`,

  // A dented escape pod beams out a "!" distress call; the "help" that arrives is a grinning one-eyed green monster with a bouquet and a suitcase (planning to stay), another visitor peeking behind it.
  'sl.distress-signal': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="8" cy="10" r="1"/><circle cx="80" cy="12" r="0.8"/><circle cx="96" cy="30" r="1"/><circle cx="10" cy="112" r="0.8"/><circle cx="64" cy="108" r="1"/></g>
    <g class="il-yellow"><circle cx="70" cy="40" r="1.2"/><circle cx="150" cy="10" r="1"/></g>
    <path class="il-line" d="M30 52V38"/><circle class="il-red il-ink il-thin" cx="30" cy="36" r="3"/>
    <path class="il-light il-thin" d="M22 32a10 10 0 0 1 0-8M38 32a10 10 0 0 0 0-8M17 35a16 16 0 0 1 0-14M43 35a16 16 0 0 0 0-14"/>
    <path class="il-white il-ink" d="M44 8h26a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H54l-8 6 2-6h-4a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6z"/>
    <rect class="il-red il-ink il-thin" x="55" y="11" width="5" height="10" rx="1.5"/><circle class="il-red il-ink il-thin" cx="57.5" cy="24" r="2"/>
    <circle class="il-metal il-ink" cx="30" cy="74" r="24"/>
    <path class="il-stone il-ink il-thin" d="M12 80l8-2 2 8-8 2z"/>
    <path class="il-line il-thin" d="M14 81l6 4M19 79l-4 7"/>
    <path class="il-line il-thin" opacity="0.5" d="M40 92q4-3 8 0M44 58q4 2 6 6"/>
    <g class="il-dark"><circle cx="30" cy="53" r="1"/><circle cx="51" cy="74" r="1"/><circle cx="30" cy="95" r="1"/><circle cx="9" cy="74" r="1"/></g>
    <circle class="il-grey il-ink" cx="30" cy="72" r="12"/>
    <circle class="il-water il-ink il-thin" cx="30" cy="72" r="9"/>
    <rect class="il-dark il-ink il-thin" x="23" y="67" width="14" height="10" rx="2"/>
    <circle class="il-glow" cx="27" cy="72" r="1.6"/><circle class="il-glow" cx="33" cy="72" r="1.6"/>
    <path class="il-light il-thin" d="M25 69l3 1M35 69l-3 1"/>
    <path class="il-purple il-ink" d="M136 60c0-10 8-16 16-16v30c-8 0-16-6-16-14z"/>
    <path class="il-line il-thin" d="M142 46l-4-8M150 44l2-8"/>
    <circle class="il-white il-ink il-thin" cx="146" cy="56" r="3"/><circle class="il-dark" cx="145" cy="56" r="1.3"/>
    <path class="il-green il-ink" d="M78 120C76 82 90 56 114 56s36 26 32 64z"/>
    <path class="il-light il-thin" opacity="0.4" d="M86 100q0-26 16-38"/>
    <g class="il-teal"><circle cx="132" cy="100" r="3"/><circle cx="96" cy="108" r="2.4"/><circle cx="136" cy="76" r="2"/></g>
    <circle class="il-white il-ink" cx="112" cy="76" r="10"/><circle class="il-dark" cx="110" cy="78" r="4"/><circle class="il-white" cx="108.5" cy="76.5" r="1.3"/>
    <path class="il-line il-thin" d="M102 68l-3-3M106 65l-1-4M112 64v-4M118 65l1-4"/>
    <path class="il-dark il-ink" d="M98 92q14 12 30 0q-14 5-30 0z"/>
    <path class="il-white il-ink il-thin" d="M103 93l2 4 2-3zM117 94l2 4 2-4z"/>
    <path class="il-green il-ink" d="M84 96l-10-10 5-4 10 9z"/>
    <path class="il-line" d="M72 82l-8-14M74 82l-2-16M76 82l6-14"/>
    <circle class="il-pink il-ink il-thin" cx="63" cy="66" r="4"/><circle class="il-yellow il-ink il-thin" cx="72" cy="63" r="4"/><circle class="il-red il-ink il-thin" cx="82" cy="66" r="4"/>
    <circle class="il-dark" cx="63" cy="66" r="1"/><circle class="il-dark" cx="72" cy="63" r="1"/><circle class="il-dark" cx="82" cy="66" r="1"/>
    <path class="il-white il-ink il-thin" d="M68 78l6 12 6-12z"/>
    <circle class="il-green il-ink" cx="74" cy="82" r="5"/>
    <rect class="il-wood-dark il-ink" x="132" y="96" width="26" height="20" rx="3"/>
    <path class="il-line il-thin" d="M140 96v-4h10v4M132 106h26"/>
    <circle class="il-yellow il-ink il-thin" cx="150" cy="104" r="2.6"/>`,

  // A cockroach grins at you under a blinking red alarm lamp, waving hello; behind it, the dark corridor is full of pairs of glowing eyes and antennae.
  'sl.swarm-alert': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.15" d="M0 20l50 30M160 20l-50 30M0 110l50-30M160 110l-50-30M50 50h60v30H50z"/>
    <path class="il-red" opacity="0.3" d="M70 10L14 0v26zM90 10l56-10v26z"/>
    <rect class="il-metal il-ink il-thin" x="66" y="10" width="28" height="5"/>
    <path class="il-red il-ink" d="M70 10a10 9 0 0 1 20 0z"/>
    <path class="il-light il-thin" opacity="0.7" d="M75 6q2-3 5-3"/>
    <g class="il-glow">
      <ellipse cx="14" cy="40" rx="1.6" ry="2.2"/><ellipse cx="20" cy="40" rx="1.6" ry="2.2"/>
      <ellipse cx="34" cy="58" rx="1.6" ry="2.2"/><ellipse cx="40" cy="58" rx="1.6" ry="2.2"/>
      <ellipse cx="12" cy="76" rx="1.6" ry="2.2"/><ellipse cx="18" cy="76" rx="1.6" ry="2.2"/>
      <ellipse cx="28" cy="94" rx="1.6" ry="2.2"/><ellipse cx="34" cy="94" rx="1.6" ry="2.2"/>
      <ellipse cx="40" cy="30" rx="1.3" ry="1.8"/><ellipse cx="45" cy="30" rx="1.3" ry="1.8"/>
      <ellipse cx="58" cy="46" rx="1.3" ry="1.8"/><ellipse cx="63" cy="46" rx="1.3" ry="1.8"/>
      <ellipse cx="98" cy="46" rx="1.3" ry="1.8"/><ellipse cx="103" cy="46" rx="1.3" ry="1.8"/>
      <ellipse cx="118" cy="30" rx="1.3" ry="1.8"/><ellipse cx="123" cy="30" rx="1.3" ry="1.8"/>
      <ellipse cx="140" cy="42" rx="1.6" ry="2.2"/><ellipse cx="146" cy="42" rx="1.6" ry="2.2"/>
      <ellipse cx="124" cy="60" rx="1.6" ry="2.2"/><ellipse cx="130" cy="60" rx="1.6" ry="2.2"/>
      <ellipse cx="142" cy="80" rx="1.6" ry="2.2"/><ellipse cx="148" cy="80" rx="1.6" ry="2.2"/>
      <ellipse cx="128" cy="98" rx="1.6" ry="2.2"/><ellipse cx="134" cy="98" rx="1.6" ry="2.2"/>
      <ellipse cx="150" cy="108" rx="1.6" ry="2.2"/><ellipse cx="155" cy="108" rx="1.6" ry="2.2"/>
      <ellipse cx="6" cy="102" rx="1.6" ry="2.2"/><ellipse cx="12" cy="102" rx="1.6" ry="2.2"/>
    </g>
    <path class="il-light il-thin" opacity="0.3" d="M14 37q-2-5-6-6M20 37q2-5 6-6M140 39q-2-5-6-6M146 39q2-5 6-6M124 57q-2-4-5-5M130 57q2-4 5-5M34 55q-2-4-5-5M40 55q2-4 5-5"/>
    <path class="il-line" d="M58 86l-14-8-6 4M56 96l-16 2-4 8M62 106l-10 8M102 86l14-8 6 4M104 96l16 2 4 8M98 106l10 8"/>
    <ellipse class="il-wood-dark il-ink" cx="80" cy="94" rx="24" ry="22"/>
    <path class="il-line il-thin" d="M80 76v38"/>
    <path class="il-light il-thin" opacity="0.4" d="M64 88q2-8 10-10M86 80q6 2 8 8"/>
    <path class="il-line" d="M73 54q-8-18-24-22M87 54q8-18 24-22"/>
    <ellipse class="il-wood il-ink" cx="80" cy="64" rx="16" ry="13"/>
    <circle class="il-white il-ink il-thin" cx="73" cy="61" r="5"/><circle class="il-white il-ink il-thin" cx="87" cy="61" r="5"/>
    <circle class="il-dark" cx="74" cy="62" r="2.2"/><circle class="il-dark" cx="86" cy="62" r="2.2"/>
    <path class="il-dark il-ink il-thin" d="M72 70q8 7 16 0q-8 2-16 0z"/>
    <path class="il-white" d="M76 70.5l1.5 2.5 1.5-2.2zM81 70.5l1.5 2.4 1.5-2.6z"/>
    <path class="il-wood-dark il-ink" d="M98 76l10-12 4 3-10 12z"/>
    <path class="il-line il-thin" d="M108 64l-2-6M110 65l3-5M112 67l5-2"/>
    <path class="il-light il-thin" d="M118 58l4-3M120 64h5"/>`,

  // In a dim cargo hold the manifest on the wall is blank, but the big crate's lid is lifting and several pairs of eyes peek out; the other crates rattle and jiggle.
  'sl.cargo-hold': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.12" d="M0 30h160M0 70h160M40 0v30M100 0v30M120 30v40M20 30v40"/>
    <path class="il-torch" opacity="0.4" d="M74 0h12l24 48H50z"/>
    <path class="il-dark" d="M0 100h160v20H0z"/>
    <rect class="il-wood-dark il-ink il-thin" x="124" y="10" width="24" height="30" rx="2"/>
    <rect class="il-paper il-ink il-thin" x="127" y="15" width="18" height="23"/>
    <rect class="il-metal il-ink il-thin" x="131" y="8" width="10" height="5" rx="1"/>
    <rect class="il-white il-ink il-thin" x="130" y="19" width="4" height="4"/>
    <path class="il-line il-thin" opacity="0.3" d="M136 21h6M130 28h12M130 33h12"/>
    <rect class="il-wood il-ink" x="4" y="66" width="36" height="34"/>
    <path class="il-line il-thin" d="M4 66l36 34M40 66 4 100"/>
    <path class="il-metal il-ink il-thin" d="M4 66h6v6H4zM34 66h6v6h-6zM4 94h6v6H4zM34 94h6v6h-6z"/>
    <g transform="rotate(-6 22 50)">
    <rect class="il-wood il-ink" x="10" y="38" width="26" height="26"/>
    <path class="il-line il-thin" d="M10 51h26M23 38v26"/>
    </g>
    <path class="il-light il-thin" d="M6 40l-3-2M6 46H2M40 34l3-3"/>
    <rect class="il-wood il-ink" x="122" y="58" width="34" height="42"/>
    <path class="il-line il-thin" d="M122 72h34M122 86h34"/>
    <path class="il-metal il-ink il-thin" d="M122 58h6v6h-6zM150 58h6v6h-6zM122 94h6v6h-6zM150 94h6v6h-6z"/>
    <path class="il-light il-thin" d="M126 52l3-4 3 4 3-4 3 4M142 50l3-4 3 4 3-4"/>
    <rect class="il-wood il-ink" x="48" y="52" width="66" height="48"/>
    <path class="il-line il-thin" d="M48 68h66M48 84h66M60 52v48M102 52v48"/>
    <path class="il-metal il-ink il-thin" d="M48 92h8v8h-8zM106 92h8v8h-8z"/>
    <path class="il-dark il-ink" d="M48 52h66l3-20-70 8z"/>
    <g class="il-glow"><ellipse cx="60" cy="46" rx="2.6" ry="2"/><ellipse cx="67" cy="46" rx="2.6" ry="2"/><ellipse cx="100" cy="42" rx="2.2" ry="1.7"/><ellipse cx="106" cy="42" rx="2.2" ry="1.7"/></g>
    <circle class="il-white il-ink il-thin" cx="80" cy="45" r="4.4"/><circle class="il-white il-ink il-thin" cx="90" cy="45" r="4.4"/>
    <circle class="il-dark" cx="81" cy="46" r="2"/><circle class="il-dark" cx="91" cy="46" r="2"/>
    <path class="il-line il-thin" d="M75 39l5 2M95 39l-5 2"/>
    <path class="il-wood-dark il-ink" d="M44 38l74-10 1 7-74 10z"/>
    <path class="il-metal il-ink il-thin" d="M44 38l6-1 1 7-6 1zM112 29l6-1 1 7-6 1z"/>
    <path class="il-slime il-ink il-thin" d="M52 52q-2-6 1-9 3 3 1 9M57 52q0-7 4-9 1 5-2 9"/>
    <path class="il-light il-thin" d="M40 46l-4-2M42 40l-3-4M118 30l3-4M122 34l4-2"/>`,

  // At a patched, striped market stall a three-eyed purple alien merchant waves its tentacles over the goods: one single sock, a lamp, a jar with a tiny planet inside; coin price tags dangle.
  'sl.flea-market': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="40" cy="6" r="0.8"/><circle cx="150" cy="4" r="0.8"/><circle cx="6" cy="60" r="0.8"/><circle cx="154" cy="56" r="0.8"/></g>
    <rect class="il-wood-dark il-ink" x="18" y="24" width="5" height="74"/><rect class="il-wood-dark il-ink" x="137" y="24" width="5" height="74"/>
    <path class="il-purple il-ink" d="M58 82c-2-16 8-26 22-26s24 10 22 26z"/>
    <path class="il-purple il-ink" d="M64 70q-14 0-22-12l4-4q8 9 18 10z"/>
    <path class="il-purple il-ink" d="M96 70q14 0 22-12l-4-4q-8 9-18 10z"/>
    <ellipse class="il-purple il-ink" cx="80" cy="48" rx="17" ry="15"/>
    <path class="il-line" d="M72 35l-4-8M88 35l4-8"/><circle class="il-glow il-ink il-thin" cx="68" cy="26" r="2.4"/><circle class="il-glow il-ink il-thin" cx="92" cy="26" r="2.4"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="45" r="4"/><circle class="il-white il-ink il-thin" cx="80" cy="41" r="4"/><circle class="il-white il-ink il-thin" cx="89" cy="45" r="4"/>
    <circle class="il-dark" cx="72" cy="46" r="1.7"/><circle class="il-dark" cx="81" cy="42" r="1.7"/><circle class="il-dark" cx="90" cy="46" r="1.7"/>
    <path class="il-dark il-ink il-thin" d="M70 54q10 8 20 0q-10 3-20 0z"/>
    <path class="il-white" d="M78 54.6l1.5 2.4 1.5-2.4z"/>
    <path class="il-red il-ink" d="M36 50l4 8 8-2 1 6-10 3-6-12z"/>
    <path class="il-white il-ink il-thin" d="M37 53l5-2M39 57l5-2"/>
    <circle class="il-purple il-ink il-thin" cx="44" cy="55" r="3.4"/>
    <path class="il-dark il-ink il-thin" d="M120 58l-6-10h12z"/>
    <path class="il-yellow il-ink" d="M114 48l2-8h8l2 8z"/>
    <circle class="il-purple il-ink il-thin" cx="116" cy="56" r="3.4"/>
    <path class="il-light il-thin" d="M128 38l3-3M130 44h4"/>
    <path class="il-red il-ink" d="M16 14h128v14H16z"/>
    <path class="il-white" d="M32 14h16v14H32zM64 14h16v14H64zM96 14h16v14H96zM128 14h16v14h-16z"/>
    <path class="il-red il-ink" d="M16 28q8 8 16 0 8 8 16 0 8 8 16 0 8 8 16 0 8 8 16 0 8 8 16 0 8 8 16 0 8 8 16 0z"/>
    <path class="il-paper il-ink il-thin" d="M92 16h12v9H92z"/>
    <path class="il-line il-thin" d="M94 15v11M98 15v11M102 15v11"/>
    <rect class="il-wood il-ink" x="8" y="82" width="144" height="8"/>
    <path class="il-wood-dark il-ink" d="M12 90h136v30H12z"/>
    <path class="il-line il-thin" opacity="0.4" d="M12 100h136M12 110h136"/>
    <circle class="il-water il-ink" cx="104" cy="72" r="10" opacity="0.8"/>
    <circle class="il-teal il-ink il-thin" cx="104" cy="74" r="4"/><path class="il-line il-thin" d="M98 75q6-3 12-2"/>
    <rect class="il-metal il-ink il-thin" x="98" y="61" width="12" height="3"/>
    <path class="il-light il-thin" d="M98 68q2-3 5-4"/>
    <path class="il-orange il-ink" d="M28 82l2-14h8l2 14z"/>
    <ellipse class="il-yellow il-ink" cx="34" cy="66" rx="9" ry="4"/>
    <path class="il-red il-ink" d="M126 82v-10h6v6l10 0v4z"/>
    <path class="il-white il-thin" d="M126 74h6"/>
    <path class="il-line il-thin" d="M50 82v6M66 84v4"/>
    <path class="il-paper il-ink il-thin" d="M46 88h8l2 4-2 4h-8z"/><circle class="il-gold il-ink il-thin" cx="50" cy="92" r="2"/>
    <path class="il-paper il-ink il-thin" d="M116 88h8l2 4-2 4h-8z"/><circle class="il-gold il-ink il-thin" cx="119" cy="92" r="1.6"/><circle class="il-gold il-ink il-thin" cx="123" cy="92" r="1.6"/>`,

  // A ship corridor with two doors: the left one (fork-and-spoon sign) is shut; the right one is wide open to space, and an android with its lunch tray floats out, food drifting after it. A sign between them points both ways.
  'sl.wrong-airlock': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 108h160M60 0v108M96 0v108"/>
    <path class="il-dark" d="M0 108h160v12H0z"/>
    <rect class="il-metal il-ink" x="6" y="26" width="48" height="82" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="12" y="32" width="36" height="76"/>
    <path class="il-line il-thin" d="M30 32v76"/>
    <circle class="il-white il-ink" cx="30" cy="14" r="8"/>
    <path class="il-line il-thin" d="M27 9v10M25.5 9v3a1.5 1.5 0 0 0 3 0V9M33 9v10"/>
    <ellipse class="il-line il-thin" cx="33" cy="11" rx="1.4" ry="2.4"/>
    <rect class="il-yellow il-ink il-thin" x="64" y="40" width="28" height="14" rx="2"/>
    <path class="il-line il-thin" d="M68 47h20M71 44l-3 3 3 3M85 44l3 3-3 3"/>
    <path class="il-line il-thin" d="M76 30a3 3 0 1 1 4 3v2"/><circle class="il-dark" cx="80" cy="37.5" r="0.9"/>
    <rect class="il-metal il-ink" x="102" y="20" width="54" height="88" rx="4"/>
    <rect class="il-night il-ink il-thin" x="108" y="26" width="42" height="82"/>
    <path class="il-yellow" d="M102 24h4v6h-4zM102 40h4v6h-4zM102 56h4v6h-4zM102 72h4v6h-4zM102 88h4v6h-4z"/>
    <g class="il-white"><circle cx="114" cy="34" r="0.8"/><circle cx="144" cy="40" r="0.8"/><circle cx="112" cy="100" r="0.8"/><circle cx="146" cy="96" r="1"/></g>
    <circle class="il-teal il-ink il-thin" cx="140" cy="100" r="7"/>
    <path class="il-grey il-ink il-thin" d="M108 26h-6v82h6z"/>
    <g transform="translate(126 90) rotate(25) scale(0.66)">
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3" transform="rotate(20 -10 -17)"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3" transform="rotate(-25 10 -17)"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <circle class="il-glow" cx="-6" cy="-71" r="3.6"/><circle class="il-glow" cx="6" cy="-71" r="3.6"/>
    <circle class="il-dark" cx="-6" cy="-71" r="1.3"/><circle class="il-dark" cx="6" cy="-71" r="1.3"/>
    <ellipse class="il-light" cx="0" cy="-63" rx="2.4" ry="3"/>
    <path class="il-metal il-ink" d="M-18 -44l-24 -6v-6l24 4z"/>
    <path class="il-metal il-ink" d="M18 -44l24 -6v-6l-24 4z"/>
    </g>
    <rect class="il-teal il-ink" x="88" y="40" width="28" height="5" rx="1" transform="rotate(-20 102 42)"/>
    <ellipse class="il-orange il-ink il-thin" cx="96" cy="66" rx="6" ry="4"/>
    <path class="il-line il-thin" d="M93 65q3-2 6 0"/>
    <path class="il-white il-ink il-thin" d="M84 82l2 10h6l2-10z"/>
    <ellipse class="il-pink il-ink il-thin" cx="96" cy="30" rx="5" ry="3.4"/>
    <path class="il-light il-thin" d="M98 74l-4 2M92 60l-4-2M84 96l-4 2"/>`,

  // A tired android trudges inside a hamster wheel that is also a clock face, coffee mug in hand; big loop arrows circle it, and the wall calendar has its first day crossed off again and again.
  'sl.time-loop': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M0 82h160M40 0v30M130 30v52"/>
    <path class="il-dark" d="M0 108h160v12H0z"/>
    <path class="il-metal il-ink" d="M58 110l18-46h8l18 46h-7l-15-36-15 36z"/>
    <circle class="il-paper il-ink il-thick" cx="80" cy="56" r="42"/>
    <circle class="il-line il-thin" cx="80" cy="56" r="37"/>
    <path class="il-line" d="M80 20v6M80 86v6M44 56h6M110 56h6M98 25l-3 5M62 25l3 5M111 38l-5 3M49 38l5 3M111 74l-5-3M49 74l5-3"/>
    <path class="il-line il-thick" d="M80 56V32M80 56h18"/>
    <circle class="il-dark" cx="80" cy="56" r="3"/>
    <path class="il-light il-thick" d="M24 40a58 58 0 0 1 28-28"/><path class="il-white il-ink il-thin" d="M50 6l8 5-8 6z"/>
    <path class="il-light il-thick" d="M136 72a58 58 0 0 1-28 28"/><path class="il-white il-ink il-thin" d="M110 106l-8-5 8-6z"/>
    <g transform="translate(80 96) scale(0.42)">
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3" transform="rotate(20 -10 -17)"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3" transform="rotate(-20 10 -17)"/>
    <path class="il-dark il-ink" d="M-24 0v-5h15v5zM10 -3v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-12 16 5 4 12-15z"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <path class="il-line" d="M0 -84l6-8"/><circle class="il-red il-ink il-thin" cx="7" cy="-94" r="3"/>
    <path class="il-glow" d="M-11 -71h9v3h-9zM2 -71h9v3H2z"/>
    <path class="il-light" d="M-6 -63h12"/>
    <path class="il-metal il-ink" d="M18 -44l12 8-3 5-12-8z"/>
    <rect class="il-white il-ink" x="26" y="-42" width="14" height="16" rx="2"/>
    <path class="il-line" d="M40 -38q6 0 6 5t-6 5"/>
    <path class="il-light il-thin" d="M30 -48q3-4 0-8M36 -48q3-4 0-8"/>
    </g>
    <rect class="il-paper il-ink il-thin" x="128" y="88" width="28" height="18"/>
    <rect class="il-red il-ink il-thin" x="128" y="84" width="28" height="5"/>
    <path class="il-line il-thin" opacity="0.4" d="M128 94h28M128 100h28M135 89v17M142 89v17M149 89v17"/>
    <path class="il-line il-thin" d="M129 90l5 4M134 90l-5 4M129 89.5l5 5M129 95l5 4M134 95l-5 4"/>`,

  // A spacesuited crewmate whose helmet visor is completely fogged up; only one wiped spot lets a watery eye peek out, while green breath clouds swirl inside the visor. Gloved hands grope blindly.
  'sl.fogged-helmet': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="14" r="1"/><circle cx="150" cy="10" r="1"/><circle cx="140" cy="44" r="0.8"/><circle cx="20" cy="50" r="0.8"/><circle cx="146" cy="110" r="0.8"/></g>
    <g class="il-yellow"><circle cx="30" cy="24" r="1.2"/><circle cx="132" cy="22" r="1.2"/></g>
    <path class="il-white il-ink" d="M22 120c2-22 22-32 58-32s56 10 58 32z"/>
    <rect class="il-metal il-ink il-thin" x="68" y="100" width="24" height="14" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="74" cy="107" r="2"/><circle class="il-green il-ink il-thin" cx="80" cy="107" r="2"/><circle class="il-yellow il-ink il-thin" cx="86" cy="107" r="2"/>
    <path class="il-line il-thin" opacity="0.4" d="M40 104q4-6 4-10M120 104q-4-6-4-10"/>
    <circle class="il-white il-ink" cx="80" cy="54" r="40"/>
    <circle class="il-metal il-ink il-thin" cx="40" cy="58" r="5"/><circle class="il-metal il-ink il-thin" cx="120" cy="58" r="5"/>
    <path class="il-line" d="M108 22l8-10"/><circle class="il-red il-ink il-thin" cx="117" cy="11" r="2.4"/>
    <ellipse class="il-smoke il-ink" cx="80" cy="56" rx="30" ry="26"/>
    <path class="il-green" opacity="0.5" d="M58 70q6-10 16-4 8-8 16 0 8-4 12 4-4 8-14 6-8 6-16 0-10 4-14-6z"/>
    <path class="il-green" opacity="0.4" d="M62 46q6-6 12 0-6 4-12 0z"/>
    <path class="il-line il-thin" opacity="0.4" d="M64 72q4-3 8 0t8 0 8 0M66 64q3-2 6 0"/>
    <ellipse class="il-skin il-ink il-thin" cx="92" cy="48" rx="9" ry="7"/>
    <circle class="il-white il-ink il-thin" cx="92" cy="48" r="3.6"/><circle class="il-dark" cx="91" cy="48.5" r="1.6"/>
    <path class="il-line il-thin" d="M86 42q5-3 11 0"/>
    <ellipse class="il-water il-ink il-thin" cx="88" cy="55" rx="1.4" ry="2.2"/>
    <path class="il-light il-thin" d="M58 80v5M66 82v6M98 80v6M104 76v5"/>
    <path class="il-light il-thin" opacity="0.7" d="M60 38q8-8 18-8"/>
    <circle class="il-white il-ink" cx="14" cy="86" r="8"/><path class="il-white il-ink il-thin" d="M8 80l-3-5M12 78l-1-5M16 78l1-5"/>
    <circle class="il-white il-ink" cx="146" cy="82" r="8"/><path class="il-white il-ink il-thin" d="M152 76l3-5M148 74l1-5M144 74l-1-5"/>
    <path class="il-light il-thin" d="M4 92l-2 2M24 94l2 3M156 88l2 2M136 92l-2 3"/>`,

  // The spacesuit came out of the hot wash hamster-sized, and a smug hamster now wears it perfectly (bubble helmet and all) in front of the washing machine; only the owner's huge metal leg fits in the picture.
  'sl.shrunken-suit': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 34h160M0 84h160M70 0v34M100 34v50"/>
    <path class="il-dark" d="M0 106h160v14H0z"/>
    <rect class="il-white il-ink" x="6" y="44" width="52" height="62" rx="4"/>
    <path class="il-line il-thin" d="M6 56h52"/>
    <circle class="il-red il-ink il-thin" cx="14" cy="50" r="3"/>
    <path class="il-yellow il-ink il-thin" d="M14 47q2 2 0 3-2 1 0 3"/>
    <rect class="il-dark" x="24" y="48" width="14" height="4" rx="1"/>
    <circle class="il-metal il-ink" cx="50" cy="50" r="3.4"/><path class="il-line il-thin" d="M50 50l2-2"/>
    <circle class="il-metal il-ink" cx="32" cy="80" r="17"/>
    <circle class="il-water il-ink il-thin" cx="32" cy="80" r="12"/>
    <path class="il-light il-thin" d="M24 80a8 8 0 0 1 12-6M40 82a8 8 0 0 1-10 6"/>
    <g class="il-white il-ink il-thin"><circle cx="28" cy="74" r="1.6"/><circle cx="36" cy="86" r="1.2"/><circle cx="62" cy="40" r="2"/><circle cx="66" cy="32" r="1.4"/></g>
    <ellipse class="il-water il-ink il-thin" cx="48" cy="110" rx="18" ry="3" opacity="0.7"/>
    <rect class="il-metal il-ink" x="138" y="0" width="22" height="98" rx="4"/>
    <path class="il-line il-thin" d="M138 40h22M138 70h22"/>
    <circle class="il-dark" cx="142" cy="44" r="1"/><circle class="il-dark" cx="142" cy="66" r="1"/>
    <path class="il-dark il-ink" d="M130 108v-12h30v12z"/>
    <g transform="translate(96 106)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-14 0v-6h10v6zM4 0v-6h10v6z"/>
    <ellipse class="il-white il-ink" cx="0" cy="-22" rx="20" ry="20"/>
    <path class="il-line il-thin" opacity="0.4" d="M-12 -10q12 4 24 0"/>
    <rect class="il-metal il-ink il-thin" x="-8" y="-30" width="16" height="10" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="-25" r="1.6"/><circle class="il-green il-ink il-thin" cx="3" cy="-25" r="1.6"/>
    <path class="il-white il-ink" d="M-18 -30l-8-14 5-3 9 12z"/>
    <circle class="il-orange il-ink il-thin" cx="-25" cy="-46" r="3.4"/>
    <path class="il-white il-ink" d="M18 -26l8 6-3 4-8-5z"/>
    <circle class="il-orange il-ink il-thin" cx="26" cy="-17" r="3.4"/>
    <circle class="il-pink il-ink il-thin" cx="-10" cy="-68" r="5"/><circle class="il-pink il-ink il-thin" cx="10" cy="-68" r="5"/>
    <ellipse class="il-orange il-ink" cx="0" cy="-56" rx="15" ry="13"/>
    <ellipse class="il-white il-ink il-thin" cx="0" cy="-51" rx="9" ry="7"/>
    <circle class="il-dark" cx="-6" cy="-60" r="2"/><circle class="il-dark" cx="6" cy="-60" r="2"/>
    <circle class="il-white" cx="-5.4" cy="-60.6" r="0.7"/><circle class="il-white" cx="6.6" cy="-60.6" r="0.7"/>
    <ellipse class="il-pink il-ink il-thin" cx="0" cy="-54" rx="2" ry="1.4"/>
    <path class="il-line il-thin" d="M0 -52.6v2q-3 2-5 0M0 -50.6q3 2 5 0M-6 -53l-8-2M-6 -51h-9M6 -53l8-2M6 -51h9"/>
    <rect class="il-white il-ink il-thin" x="-2" y="-49.8" width="4" height="3" rx="0.6"/>
    <circle class="il-water il-ink" cx="0" cy="-57" r="21" opacity="0.35"/>
    <path class="il-light il-thin" d="M-14 -66q4-8 12-10"/>
    <rect class="il-metal il-ink il-thin" x="-14" y="-38" width="28" height="4" rx="2"/>
    </g>
    <path class="il-paper il-ink il-thin" d="M118 92h12v9h-12l-3-4.5z"/>
    <path class="il-line il-thin" d="M120 95l1 4h6l1-4M120 95.6q2 1 4 0t4 0"/>`,

  // Hearts rise from horseshoe magnets in the floor as it hugs an android's boots; the android leans forward with arms flailing but can't lift a foot. A spoon, a screw and a coin zip down to the floor too.
  'sl.magnet-floor': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M0 70h160M50 0v30M110 30v40"/>
    <path class="il-metal il-ink" d="M-2 98h164v24H-2z"/>
    <path class="il-line il-thin" opacity="0.3" d="M40 98v22M120 98v22"/>
    <g transform="translate(18 102)"><path class="il-red il-ink il-thin" d="M0 0v7a6 6 0 0 0 12 0V0H8v7a2 2 0 0 1-4 0V0z"/><path class="il-white" d="M0 0h4v3H0zM8 0h4v3H8z"/></g>
    <g transform="translate(74 104)"><path class="il-red il-ink il-thin" d="M0 0v7a6 6 0 0 0 12 0V0H8v7a2 2 0 0 1-4 0V0z"/><path class="il-white" d="M0 0h4v3H0zM8 0h4v3H8z"/></g>
    <g transform="translate(130 102)"><path class="il-red il-ink il-thin" d="M0 0v7a6 6 0 0 0 12 0V0H8v7a2 2 0 0 1-4 0V0z"/><path class="il-white" d="M0 0h4v3H0zM8 0h4v3H8z"/></g>
    <path class="il-light il-thin il-dash" d="M56 98q-6-10 4-12M104 98q6-10-4-12M50 98q-12-16 6-22M110 98q12-16-6-22"/>
    <path class="il-pink il-ink il-thin" d="M62 86c-4-2-5-6-2-7 1 0 2 1 2 2 0-1 1-2 2-2 3 1 2 5-2 7zM98 84c-4-2-5-6-2-7 1 0 2 1 2 2 0-1 1-2 2-2 3 1 2 5-2 7zM72 76c-3-2-4-5-1.5-5.6 1 0 1.5 1 1.5 1.6 0-.6.6-1.6 1.5-1.6 2.5.6 1.5 3.6-1.5 5.6z"/>
    <g transform="translate(80 98) rotate(18)">
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-metal il-ink" d="M-18 -44l-20 16 4 5 20-14z"/><circle class="il-metal il-ink" cx="-37" cy="-25" r="4.5"/>
    <path class="il-metal il-ink" d="M18 -44l18-14 3 5-17 13z"/><circle class="il-metal il-ink" cx="38" cy="-56" r="4.5"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <g class="il-dark"><circle cx="-16" cy="-46" r="1"/><circle cx="16" cy="-46" r="1"/><circle cx="-16" cy="-19" r="1"/><circle cx="16" cy="-19" r="1"/></g>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-24" r="2"/><circle class="il-yellow il-ink il-thin" cx="0" cy="-24" r="2"/><circle class="il-green il-ink il-thin" cx="6" cy="-24" r="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <path class="il-glow" d="M-11 -75l7 4-7 4zM11 -75l-7 4 7 4z"/>
    <path class="il-light il-thin" d="M-8 -62l3-2 3 2 3-2 3 2 3-2"/>
    <path class="il-water il-ink il-thin" d="M24 -84q3 4 0 6-3-2 0-6z"/>
    </g>
    <path class="il-dark il-ink" d="M58 98v-6h16v6zM79 98v-6h16v6z"/>
    <path class="il-line il-thin" d="M20 60l-2-6M24 60l2-7M134 50l-2-6M138 50l2-7"/>
    <path class="il-metal il-ink il-thin" d="M18 62l4 10 4-10z"/>
    <path class="il-metal il-ink il-thin" d="M134 54v10M131 52h6"/><ellipse class="il-metal il-ink il-thin" cx="134" cy="68" rx="3" ry="4"/>
    <circle class="il-gold il-ink il-thin" cx="122" cy="80" r="4"/><path class="il-line il-thin" d="M122 72v-5M118 72l-1-4"/>`,

  // An android dangling on a safety line stretches a hand out in vain: its coffee mug, let go for one second, now orbits the striped giant planet, coffee drops trailing after it.
  'sl.dropped-in-space': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="60" cy="10" r="1"/><circle cx="90" cy="16" r="0.8"/><circle cx="150" cy="10" r="1"/><circle cx="10" cy="60" r="0.8"/><circle cx="60" cy="112" r="0.8"/><circle cx="154" cy="116" r="1"/></g>
    <g class="il-yellow"><circle cx="44" cy="40" r="1.2"/><circle cx="148" cy="30" r="1"/></g>
    <path class="il-metal il-ink" d="M-2 -2h40l-6 14H-2z"/>
    <path class="il-stone il-ink il-thin" d="M8 2h8v6H8z"/><g class="il-dark"><circle cx="24" cy="4" r="1"/><circle cx="30" cy="4" r="1"/></g>
    <ellipse class="il-light il-thin il-dash" cx="116" cy="70" rx="50" ry="12" transform="rotate(-15 116 70)" opacity="0.5"/>
    <circle class="il-orange il-ink" cx="116" cy="70" r="36"/>
    <path class="il-paper" opacity="0.7" d="M91 44q25 3 50 0l3 4q-28 3-56 0z"/>
    <path class="il-earth" opacity="0.7" d="M83 56q33 4 66 0l2 6q-35 4-70 0z"/>
    <path class="il-paper" opacity="0.6" d="M80 70q36 3 72 0v3q-36 3-72 0z"/>
    <path class="il-earth-dark" opacity="0.6" d="M81 80q35 4 70 0l-2 6q-33 4-66 0z"/>
    <path class="il-earth" opacity="0.7" d="M86 92q30 4 60 0l-4 5q-26 3-52 0z"/>
    <ellipse class="il-red il-ink il-thin" cx="128" cy="83" rx="7" ry="4"/>
    <path class="il-light il-thin" opacity="0.4" d="M90 54q6-12 18-16"/>
    <circle class="il-orange il-ink" cx="116" cy="70" r="36" opacity="0"/>
    <path class="il-light il-thin il-dash" d="M66 70a50 12 0 0 0 100 0" transform="rotate(-15 116 70)"/>
    <g transform="rotate(-25 78 88)">
    <rect class="il-white il-ink" x="72" y="82" width="12" height="13" rx="2"/>
    <path class="il-line" d="M84 85q5 0 5 4t-5 4"/>
    <path class="il-wood-dark" d="M73 84h10v2H73z"/>
    </g>
    <g class="il-wood-dark il-ink il-thin"><circle cx="68" cy="78" r="1.6"/><circle cx="62" cy="74" r="1.2"/><circle cx="56" cy="72" r="0.9"/></g>
    <path class="il-light il-thin" d="M84 100l4 2M80 104l4 1"/>
    <path class="il-line il-thin" d="M30 10q-6 30 4 48"/>
    <g transform="translate(30 92) rotate(20) scale(0.52)">
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3" transform="rotate(25 -10 -17)"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3" transform="rotate(-10 10 -17)"/>
    <path class="il-metal il-ink" d="M-18 -44l-12 18 5 3 11-16z"/>
    <path class="il-metal il-ink" d="M18 -46l30 -6 1 6-30 6z"/>
    <path class="il-metal il-ink" d="M48 -54l8-6 2 3-6 5 8-1v4l-10 2z"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <circle class="il-glow" cx="-6" cy="-70" r="3.4"/><circle class="il-glow" cx="6" cy="-70" r="3.4"/>
    <path class="il-light" d="M-11 -76l8 2M11 -76l-8 2M-6 -62q6-4 12 0"/>
    <path class="il-water il-ink il-thin" d="M-7 -66q2 3 0 5-2-2 0-5z"/>
    </g>`,

  // A favourite red sweater with a white heart hangs on a hanger, riddled with holes; three space moths in tiny bubble helmets munch away, one wearing a napkin, and one bite is taken right out of the heart.
  'sl.space-moths': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 50h160M0 96h160M30 0v50M130 50v46"/>
    <path class="il-line il-thick" d="M6 12h148"/>
    <path class="il-line" d="M80 12q6 0 6 5t-6 5v2M80 24L46 36h68z"/>
    <path class="il-red il-ink" d="M48 34L36 40 18 76l12 5 12-20 2 47h72l2-47 12 20 12-5-18-36-12-6q-32 12-64 0z"/>
    <path class="il-line il-thin" d="M58 36q22 8 44 0M44 104h72M30 77l-2 2M130 77l2 2"/>
    <path class="il-line il-thin" opacity="0.3" d="M50 90h60M50 96h60"/>
    <path class="il-white il-ink il-thin" d="M80 72c-10-6-12-14-6-16 3-1 5 1 6 3 1-2 3-4 6-3 6 2 4 10-6 16z"/>
    <g class="il-grey il-ink il-thin"><circle cx="86" cy="58" r="3.6"/><circle cx="60" cy="92" r="5"/><circle cx="104" cy="86" r="4"/><circle cx="66" cy="50" r="2.6"/><circle cx="110" cy="102" r="3"/><circle cx="28" cy="70" r="2.6"/><circle cx="56" cy="104" r="2"/></g>
    <g class="il-red"><rect x="96" y="106" width="2" height="3"/><rect x="101" y="110" width="2" height="2"/><rect x="62" y="112" width="2" height="2"/></g>
    <g transform="translate(110 82)">
    <ellipse class="il-beard il-ink il-thin" cx="-6" cy="-4" rx="7" ry="4" transform="rotate(-30 -6 -4)"/><ellipse class="il-beard il-ink il-thin" cx="6" cy="-4" rx="7" ry="4" transform="rotate(30 6 -4)"/>
    <circle class="il-stone" cx="-7" cy="-5" r="1.4"/><circle class="il-stone" cx="7" cy="-5" r="1.4"/>
    <ellipse class="il-stone il-ink il-thin" cx="0" cy="2" rx="3.4" ry="6"/>
    <circle class="il-stone il-ink il-thin" cx="0" cy="-6" r="3.4"/>
    <circle class="il-white" cx="-1.4" cy="-6.4" r="1.2"/><circle class="il-white" cx="1.4" cy="-6.4" r="1.2"/><circle class="il-dark" cx="-1.4" cy="-6" r="0.6"/><circle class="il-dark" cx="1.4" cy="-6" r="0.6"/>
    <path class="il-white il-ink il-thin" d="M-3 -2h6l-3 5z"/>
    <path class="il-line il-thin" d="M-1 -9l-3-5M1 -9l3-5"/>
    <circle class="il-water il-ink il-thin" cx="0" cy="-6" r="6" opacity="0.35"/>
    </g>
    <g transform="translate(138 28) rotate(-15)">
    <ellipse class="il-beard il-ink il-thin" cx="-7" cy="-4" rx="8" ry="5" transform="rotate(-30 -7 -4)"/><ellipse class="il-beard il-ink il-thin" cx="7" cy="-4" rx="8" ry="5" transform="rotate(30 7 -4)"/>
    <circle class="il-stone" cx="-8" cy="-5" r="1.6"/><circle class="il-stone" cx="8" cy="-5" r="1.6"/>
    <ellipse class="il-stone il-ink il-thin" cx="0" cy="2" rx="3.4" ry="6"/>
    <circle class="il-stone il-ink il-thin" cx="0" cy="-6" r="3.4"/>
    <circle class="il-white" cx="-1.4" cy="-6.4" r="1.2"/><circle class="il-white" cx="1.4" cy="-6.4" r="1.2"/><circle class="il-dark" cx="-1.4" cy="-6" r="0.6"/><circle class="il-dark" cx="1.4" cy="-6" r="0.6"/>
    <path class="il-line il-thin" d="M-1 -9l-3-5M1 -9l3-5M-2 -3q2 1 4 0"/>
    <circle class="il-water il-ink il-thin" cx="0" cy="-6" r="6" opacity="0.35"/>
    </g>
    <g transform="translate(70 56) rotate(10)">
    <ellipse class="il-beard il-ink il-thin" cx="-6" cy="-4" rx="7" ry="4" transform="rotate(-30 -6 -4)"/><ellipse class="il-beard il-ink il-thin" cx="6" cy="-4" rx="7" ry="4" transform="rotate(30 6 -4)"/>
    <ellipse class="il-stone il-ink il-thin" cx="0" cy="2" rx="3.4" ry="6"/>
    <circle class="il-stone il-ink il-thin" cx="0" cy="-6" r="3.4"/>
    <circle class="il-white" cx="-1.4" cy="-6.4" r="1.2"/><circle class="il-white" cx="1.4" cy="-6.4" r="1.2"/><circle class="il-dark" cx="-1.4" cy="-6" r="0.6"/><circle class="il-dark" cx="1.4" cy="-6" r="0.6"/>
    <path class="il-line il-thin" d="M-1 -9l-3-5M1 -9l3-5"/>
    <circle class="il-water il-ink il-thin" cx="0" cy="-6" r="6" opacity="0.35"/>
    </g>
    <path class="il-line il-thin" d="M126 34l-4 3M128 40l-5 1"/>`,
  // Zero gravity: an android floats upside down and waves a sad bye-bye to its golden crown, which drifts up and out through the open ceiling hatch; a water blob, a sandwich and a screw float around too.
  'sl.zero-gravity': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 40h160M0 84h160M40 40v44M96 0v40M120 40v44"/>
    <path class="il-dark" d="M0 106h160v14H0z"/>
    <rect class="il-metal il-ink" x="104" y="-4" width="48" height="22" rx="3"/>
    <rect class="il-night il-ink il-thin" x="110" y="-2" width="36" height="14"/>
    <g class="il-white"><circle cx="116" cy="4" r="0.8"/><circle cx="130" cy="8" r="0.8"/><circle cx="140" cy="3" r="1"/></g>
    <path class="il-grey il-ink" d="M110 14l-14 14h6l12-12z"/>
    <path class="il-light il-thin il-dash" d="M84 70q20-14 34-30"/>
    <g transform="rotate(14 128 36)">
    <path class="il-gold il-ink" d="M116 42v-14l6 6 6-10 6 10 6-6v14z"/>
    <path class="il-yellow il-ink il-thin" d="M116 38h24v4h-24z"/>
    <circle class="il-red il-ink il-thin" cx="128" cy="34" r="2"/><circle class="il-blue il-ink il-thin" cx="121" cy="36" r="1.4"/><circle class="il-blue il-ink il-thin" cx="135" cy="36" r="1.4"/>
    </g>
    <path class="il-light il-thin" d="M146 30l4-2M144 40l5 1M112 26l-3-3"/>
    <g transform="translate(52 30) rotate(165) scale(0.58)">
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-16 30 5 3 16-29z"/>
    <path class="il-metal il-ink" d="M18 -44l12 16-4 3-12-15z"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-24" r="2"/><circle class="il-yellow il-ink il-thin" cx="0" cy="-24" r="2"/><circle class="il-green il-ink il-thin" cx="6" cy="-24" r="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <circle class="il-glow" cx="-6" cy="-72" r="3"/><circle class="il-glow" cx="6" cy="-72" r="3"/>
    <path class="il-light" d="M-6 -64q6 4 12 0"/>
    <path class="il-water il-ink il-thin" d="M-10 -66q2 3 0 5-2-2 0-5z"/>
    </g>
    <circle class="il-metal il-ink" cx="73" cy="28" r="5"/>
    <path class="il-metal il-ink il-thin" d="M70 24l-2-5M73 23v-5M76 24l2-5"/>
    <path class="il-light il-thin" d="M64 22a10 10 0 0 1 4-8M82 22a10 10 0 0 0-4-8"/>
    <path class="il-water il-ink" d="M18 52q8-10 16-2 6 6-2 10-8 4-14-8z"/>
    <circle class="il-water il-ink il-thin" cx="38" cy="44" r="2"/><circle class="il-water il-ink il-thin" cx="14" cy="42" r="1.4"/>
    <g transform="rotate(-20 118 80)">
    <path class="il-paper il-ink il-thin" d="M106 84l12-12 12 12z"/>
    <path class="il-green il-ink il-thin" d="M107 86h22l-2-2h-18z"/>
    <path class="il-paper il-ink il-thin" d="M106 88h24l-12 4z"/>
    </g>
    <path class="il-metal il-ink il-thin" d="M140 68l6 4-2 3-6-4zM146 72l4 6"/>
    <ellipse class="il-pink il-ink il-thin" cx="30" cy="110" rx="7" ry="3"/><ellipse class="il-pink il-ink il-thin" cx="46" cy="111" rx="7" ry="3"/>`,

  // A mothership hovering overhead spews out a blizzard of envelopes (one golden with a galaxy seal); an annoyed android is already buried up to its waist and holds one up between two fingers.
  'sl.mothership-spam': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="8" cy="10" r="1"/><circle cx="152" cy="8" r="1"/><circle cx="10" cy="54" r="0.8"/><circle cx="150" cy="50" r="0.8"/></g>
    <g class="il-yellow"><circle cx="20" cy="36" r="1.2"/><circle cx="140" cy="36" r="1.2"/></g>
    <path class="il-water il-ink" d="M62 14a18 13 0 0 1 36 0z"/>
    <circle class="il-white il-ink il-thin" cx="74" cy="9" r="2.4"/><circle class="il-white il-ink il-thin" cx="86" cy="9" r="2.4"/><circle class="il-dark" cx="74" cy="9.6" r="1"/><circle class="il-dark" cx="86" cy="9.6" r="1"/>
    <ellipse class="il-metal il-ink" cx="80" cy="17" rx="54" ry="9"/>
    <rect class="il-dark il-ink il-thin" x="64" y="22" width="32" height="4" rx="2"/>
    <g class="il-yellow il-ink il-thin"><circle cx="38" cy="18" r="1.8"/><circle cx="58" cy="21" r="1.8"/><circle cx="102" cy="21" r="1.8"/><circle cx="122" cy="18" r="1.8"/></g>
    <g transform="translate(46 44) rotate(-22)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(116 40) rotate(18)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(24 70) rotate(12)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(138 66) rotate(-14)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(60 34) rotate(30)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(100 30) rotate(-30)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(34 92) rotate(-8)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <path class="il-light il-thin" d="M40 36v-4M120 32v-4M20 62v-4M140 58v-4"/>
    <g transform="translate(80 126) scale(0.8)">
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <path class="il-metal il-ink" d="M-18 -44l-10 18 5 3 10-17z"/>
    <path class="il-metal il-ink" d="M18 -44l12-26 5 2-11 27z"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <path class="il-glow" d="M-11 -71h8v3h-8zM3 -71h8v3H3z"/>
    <path class="il-light il-thin" d="M-11 -75l8 2M11 -75l-8 2"/>
    <path class="il-light" d="M-7 -63q2-2 4 0t4 0 4 0"/>
    <g transform="translate(34 -82) rotate(-10)"><rect class="il-gold il-ink" x="-12" y="-8" width="24" height="16" rx="1.5"/><path class="il-line il-thin" d="M-12 -8l12 9 12-9"/><circle class="il-red il-ink il-thin" cx="0" cy="2" r="4"/><path class="il-light il-thin" d="M0 2m-2 0a2 2 0 1 1 2 2"/></g>
    <circle class="il-metal il-ink" cx="32" cy="-72" r="5"/>
    </g>
    <path class="il-paper il-ink" d="M0 120v-18q20-10 40-6 20-8 40-2 20-8 40 0 20-6 40 2v24z"/>
    <g transform="translate(18 108) rotate(-12)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(52 104) rotate(10)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(78 112) rotate(-4)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(106 104) rotate(-16)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>
    <g transform="translate(140 108) rotate(14)"><rect class="il-paper il-ink il-thin" x="-8" y="-5.5" width="16" height="11" rx="1"/><path class="il-line il-thin" d="M-8 -5.5l8 6 8-6"/></g>`,

  // A slime blob makes its wish come true: a patched umbrella. A meteor just bounced off it (impact star) while more flaming meteors rain down and one smokes in a fresh crater.
  'sl.meteor-shower': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="60" cy="8" r="0.8"/><circle cx="150" cy="40" r="1"/><circle cx="8" cy="40" r="0.8"/><circle cx="40" cy="60" r="0.8"/></g>
    <path class="il-white" d="M18 12l1.2 3 3 .4-2.3 2 .7 3-2.6-1.6-2.6 1.6.7-3-2.3-2 3-.4z"/>
    <path class="il-stone" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M0 100h160"/>
    <ellipse class="il-grey" cx="20" cy="110" rx="10" ry="3"/><ellipse class="il-grey" cx="138" cy="106" rx="14" ry="4"/>
    <g transform="translate(46 26)"><path class="il-orange il-ink il-thin" d="M0 -5L-18 -18L-12 -8L-22 -6L-6 4z"/><path class="il-yellow" d="M-2 -3L-12 -10L-9 -5L-14 -4L-4 2z"/><circle class="il-earth-dark il-ink" cx="0" cy="0" r="5"/></g>
    <g transform="translate(140 22)"><path class="il-orange il-ink il-thin" d="M0 -5L-18 -18L-12 -8L-22 -6L-6 4z"/><path class="il-yellow" d="M-2 -3L-12 -10L-9 -5L-14 -4L-4 2z"/><circle class="il-earth-dark il-ink" cx="0" cy="0" r="5"/></g>
    <g transform="translate(26 74) scale(0.8)"><path class="il-orange il-ink il-thin" d="M0 -5L-18 -18L-12 -8L-22 -6L-6 4z"/><path class="il-yellow" d="M-2 -3L-12 -10L-9 -5L-14 -4L-4 2z"/><circle class="il-earth-dark il-ink" cx="0" cy="0" r="5"/></g>
    <g transform="translate(142 64) scale(0.8)"><path class="il-orange il-ink il-thin" d="M0 -5L-18 -18L-12 -8L-22 -6L-6 4z"/><path class="il-yellow" d="M-2 -3L-12 -10L-9 -5L-14 -4L-4 2z"/><circle class="il-earth-dark il-ink" cx="0" cy="0" r="5"/></g>
    <g transform="translate(118 12) rotate(-90)"><path class="il-orange il-ink il-thin" d="M0 -5L-18 -18L-12 -8L-22 -6L-6 4z"/><path class="il-yellow" d="M-2 -3L-12 -10L-9 -5L-14 -4L-4 2z"/><circle class="il-earth-dark il-ink" cx="0" cy="0" r="5"/></g>
    <path class="il-earth-dark il-ink" d="M126 104a12 4 0 0 1 24 0z"/>
    <circle class="il-earth-dark il-ink" cx="138" cy="100" r="5"/>
    <circle class="il-smoke il-ink il-thin" cx="140" cy="90" r="4"/><circle class="il-smoke il-ink il-thin" cx="146" cy="82" r="3"/>
    <path class="il-slime il-ink" d="M54 106c-2-18 10-30 26-30s28 12 26 30z"/>
    <path class="il-light il-thin" opacity="0.6" d="M60 96q0-10 8-14"/>
    <circle class="il-white il-ink il-thin" cx="72" cy="88" r="4.6"/><circle class="il-white il-ink il-thin" cx="88" cy="88" r="4.6"/>
    <circle class="il-dark" cx="73" cy="86" r="2"/><circle class="il-dark" cx="89" cy="86" r="2"/>
    <path class="il-line il-thin" d="M66 82l6-2M94 82l-6-2"/>
    <path class="il-dark il-ink il-thin" d="M72 98h16v4H72z"/><path class="il-white" d="M73 99h14v2H73z"/><path class="il-line il-thin" d="M76 98v4M80 98v4M84 98v4"/>
    <path class="il-line il-thick" d="M80 34v42"/>
    <circle class="il-slime il-ink" cx="80" cy="76" r="4.5"/>
    <path class="il-blue il-ink" d="M44 58a36 26 0 0 1 72 0q-6-5-12 0-6-5-12 0-6-5-12 0-6-5-12 0-6-5-12 0-6-5-12 0z"/>
    <path class="il-line il-thin" d="M80 32v26M62 37q-6 10-6 20M98 37q6 10 6 20"/>
    <path class="il-paper il-ink il-thin" d="M58 42l9-2 1 7-9 2z"/><path class="il-line il-thin" d="M59 43l8 4M66 41l-6 6"/>
    <path class="il-yellow il-ink il-thin" d="M98 26l2 5 5-2-3 5 5 2-5 1 1 5-4-3-3 4v-5l-5-1 4-3-3-4 5 1z"/>
    <path class="il-light il-thin" d="M106 22l3-3M112 26l4-1"/>`,

  // A round green alien with hiccups: cheeks bulging, eyes popping, a "hic" puff bursting from its mouth; a dashed zigzag trail with puffs at every corner shows how each hiccup has jolted it across space.
  'sl.space-hiccups': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="12" r="1"/><circle cx="60" cy="10" r="0.8"/><circle cx="150" cy="96" r="1"/><circle cx="20" cy="108" r="0.8"/><circle cx="100" cy="110" r="0.8"/></g>
    <g class="il-yellow"><circle cx="40" cy="22" r="1.2"/><circle cx="120" cy="80" r="1.2"/></g>
    <circle class="il-purple il-ink il-thin" cx="132" cy="104" r="10"/><path class="il-line il-thin" opacity="0.5" d="M124 100q8 3 16 0"/>
    <path class="il-light il-thin il-dash" d="M152 14l-12 22-14-14-10 24-16-10-8 14"/>
    <g class="il-smoke il-ink il-thin"><circle cx="140" cy="36" r="5"/><circle cx="144" cy="40" r="3.4"/><circle cx="126" cy="22" r="4.6"/><circle cx="130" cy="18" r="3"/><circle cx="116" cy="46" r="5"/><circle cx="111" cy="50" r="3.4"/><circle cx="100" cy="36" r="4.4"/></g>
    <g opacity="0.25"><circle class="il-green" cx="128" cy="30" r="10"/><circle class="il-green" cx="108" cy="42" r="12"/></g>
    <path class="il-light il-thin" d="M18 52l-6-2M16 64H8M18 76l-6 2"/>
    <path class="il-line il-thin" d="M30 44l-4-4M28 88l-4 4M56 34v-6"/>
    <path class="il-green il-ink" d="M46 92l-4 8h10zM62 92l4 8H56z"/>
    <path class="il-line" d="M50 42l-8-14M62 42l8-14"/><circle class="il-glow il-ink il-thin" cx="42" cy="27" r="3"/><circle class="il-glow il-ink il-thin" cx="70" cy="27" r="3"/>
    <circle class="il-green il-ink" cx="56" cy="66" r="27"/>
    <ellipse class="il-slime" cx="54" cy="78" rx="14" ry="9" opacity="0.6"/>
    <path class="il-light il-thin" opacity="0.5" d="M36 58q2-12 14-16"/>
    <circle class="il-white il-ink" cx="50" cy="58" r="8"/><circle class="il-white il-ink" cx="66" cy="58" r="8"/>
    <circle class="il-dark" cx="51" cy="58" r="2"/><circle class="il-dark" cx="67" cy="58" r="2"/>
    <path class="il-line il-thin" d="M42 47l6 2M74 47l-6 2"/>
    <circle class="il-pink il-ink il-thin" cx="44" cy="72" r="6"/><circle class="il-pink il-ink il-thin" cx="72" cy="72" r="6"/>
    <ellipse class="il-dark il-ink il-thin" cx="60" cy="76" rx="3" ry="3.6"/>
    <path class="il-green il-ink" d="M36 80q-8 2-8 8l5 1q1-4 6-5z"/>
    <circle class="il-smoke il-ink" cx="80" cy="72" r="5"/><circle class="il-smoke il-ink" cx="88" cy="66" r="6"/><circle class="il-smoke il-ink" cx="90" cy="76" r="4"/>
    <g class="il-water il-ink il-thin"><circle cx="98" cy="60" r="2.4"/><circle cx="102" cy="68" r="1.6"/><circle cx="96" cy="84" r="1.8"/></g>
    <path class="il-light il-thin" d="M24 34l-4-4M88 42l4-4M90 96l4 4M22 98l-4 4"/>`,

  // Canteen dish of the day: grey paste under grey gravy, so thick the spoon stands upright in it and the paste itself looks miserable; the tray sags under the weight, a grey drink beside it, a fly circling.
  'sl.canteen-food': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <rect class="il-dark il-ink il-thin" x="96" y="8" width="56" height="34" rx="2"/>
    <g opacity="0.6"><circle class="il-smoke" cx="104" cy="16" r="3"/><circle class="il-smoke" cx="104" cy="25" r="3"/><circle class="il-smoke" cx="104" cy="34" r="3"/></g>
    <path class="il-light il-thin" opacity="0.5" d="M110 16q4-2 8 0t8 0 8 0 8 0M110 25q4-2 8 0t8 0 8 0 8 0M110 34q4-2 8 0t8 0 8 0 8 0"/>
    <path class="il-metal il-ink" d="M-2 96h164v26H-2z"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 104h160"/>
    <path class="il-teal il-ink" d="M14 84q64 14 128 0l-6 22q-58 10-116 0z"/>
    <path class="il-line il-thin" d="M70 110l-2 5M80 111v5M90 110l2 5"/>
    <ellipse class="il-white il-ink" cx="70" cy="88" rx="36" ry="11"/>
    <path class="il-stone il-ink" d="M42 88c0-18 14-26 28-26s28 8 28 26q-28 6-56 0z"/>
    <path class="il-grey il-ink" d="M48 74q22-14 44 0q-2 7-6 4-2 8-6 2-4 6-8 0-4 6-8-1-4 6-8-2-4 4-8-7z"/>
    <path class="il-line il-thin" opacity="0.4" d="M52 84q4 2 8 0M80 86q4 2 8 0"/>
    <circle class="il-dark" cx="64" cy="84" r="1.4"/><circle class="il-dark" cx="76" cy="84" r="1.4"/>
    <path class="il-line il-thin" d="M61 80l4 1M79 80l-4 1M66 90q4-3 8 0"/>
    <g transform="rotate(14 80 62)">
    <path class="il-metal il-ink" d="M79 66l-1-20q-3-4-3-8 0-6 5.5-6t5.5 6q0 4-3 8l-1 20z"/>
    <circle class="il-dark" cx="80.5" cy="38" r="1.4"/>
    <path class="il-light il-thin" d="M80 46v14"/>
    </g>
    <path class="il-light il-thin" opacity="0.6" d="M54 60q-3-5 0-10t0-10M100 60q-3-5 0-10t0-10"/>
    <path class="il-white il-ink" d="M116 66h16l-2 22h-12z"/>
    <path class="il-grey" d="M118 74h12l-1 12h-10z"/>
    <path class="il-light il-thin" opacity="0.6" d="M119 70v14"/>
    <path class="il-light il-thin il-dash" d="M20 40q14-16 28 0t-8 12"/>
    <ellipse class="il-white il-ink il-thin" cx="38" cy="54" rx="3" ry="2" transform="rotate(-30 38 54)"/><ellipse class="il-white il-ink il-thin" cx="44" cy="54" rx="3" ry="2" transform="rotate(30 44 54)"/>
    <ellipse class="il-dark" cx="41" cy="57" rx="2.4" ry="1.8"/>`,

  // At a security door with a red-lit scanner, an android shrugs with a "?" on its face screen and an empty lanyard clip; a sly cockroach scuttles away carrying its ID badge over its head.
  'sl.lost-badge': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 34h160M0 84h160M70 0v34M120 34v50"/>
    <path class="il-dark" d="M0 106h160v14H0z"/>
    <rect class="il-metal il-ink" x="4" y="20" width="42" height="86" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="10" y="26" width="30" height="80"/>
    <path class="il-yellow" d="M10 26l6 0-6 6zM10 40l20-14h6L10 46zM10 60l30-22v6L10 66zM10 80l30-22v6L10 86z" opacity="0.7"/>
    <rect class="il-dark il-ink il-thin" x="50" y="48" width="14" height="24" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="57" cy="55" r="3.4"/>
    <path class="il-light il-thin" d="M54 62l6 6M60 62l-6 6"/>
    <path class="il-red" opacity="0.25" d="M57 55l-14 10h8z"/>
    <g transform="translate(90 106) scale(0.9)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-14-10 3-4 14 9z"/><circle class="il-metal il-ink" cx="-33" cy="-58" r="5"/>
    <path class="il-metal il-ink" d="M18 -44l14-10-3-4-14 9z"/><circle class="il-metal il-ink" cx="33" cy="-58" r="5"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <g class="il-dark"><circle cx="-16" cy="-46" r="1"/><circle cx="16" cy="-46" r="1"/><circle cx="-16" cy="-19" r="1"/><circle cx="16" cy="-19" r="1"/></g>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-22" r="2"/><circle class="il-yellow il-ink il-thin" cx="0" cy="-22" r="2"/><circle class="il-green il-ink il-thin" cx="6" cy="-22" r="2"/>
    <path class="il-blue il-ink il-thin" d="M-9 -50h4l5 14 5-14h4l-7 20h-4z"/>
    <path class="il-metal il-ink il-thin" d="M-2 -30h4v5h-4z"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <path class="il-light il-thick" d="M-4 -74a4.5 4.5 0 1 1 5 4.5v3"/><circle class="il-white" cx="1" cy="-62.5" r="1.8"/>
    </g>
    <path class="il-light il-thin" d="M108 98l-6 0M110 92h-6M110 104h-5"/>
    <path class="il-line" d="M124 100l-4 6M130 101l-2 6M138 101l2 6M146 100l4 6"/>
    <path class="il-line" d="M128 90l-2-16M142 90l4-16"/>
    <rect class="il-white il-ink" x="118" y="56" width="34" height="22" rx="2"/>
    <rect class="il-dark il-ink il-thin" x="122" y="60" width="10" height="12" rx="1"/>
    <circle class="il-glow" cx="125" cy="65" r="1"/><circle class="il-glow" cx="129" cy="65" r="1"/>
    <path class="il-line il-thin" opacity="0.5" d="M136 62h12M136 66h12M136 70h8"/>
    <rect class="il-blue il-ink il-thin" x="118" y="74" width="34" height="4"/>
    <ellipse class="il-wood-dark il-ink" cx="134" cy="96" rx="14" ry="8"/>
    <path class="il-line il-thin" d="M122 96h24"/>
    <ellipse class="il-wood il-ink" cx="148" cy="90" rx="6" ry="6"/>
    <circle class="il-white il-ink il-thin" cx="147" cy="88" r="2.4"/><circle class="il-white il-ink il-thin" cx="152" cy="88" r="2.4"/>
    <circle class="il-dark" cx="147.6" cy="88" r="1"/><circle class="il-dark" cx="152.6" cy="88" r="1"/>
    <path class="il-line il-thin" d="M146 93q4 3 7 0M146 84q-4-8-10-10M150 84q4-8 8-8"/>`,

  // Teleporter: on the left pad an android dissolves into sparkles; on the right pad it re-materialises as a cockroach with the android's screen head, one big and one small eye and a "?" above it.
  'sl.teleporter-mixup': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M80 0v104"/>
    <path class="il-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thick" d="M58 108q22 8 44 0"/>
    <path class="il-yellow il-ink il-thin" d="M76 108h8v-3l6 5-6 5v-3h-8z"/>
    <ellipse class="il-metal il-ink" cx="40" cy="10" rx="26" ry="5"/><ellipse class="il-metal il-ink" cx="120" cy="10" rx="26" ry="5"/>
    <rect class="il-glow" x="16" y="12" width="48" height="88" opacity="0.3"/>
    <rect class="il-glow" x="96" y="12" width="48" height="88" opacity="0.3"/>
    <ellipse class="il-metal il-ink" cx="40" cy="102" rx="28" ry="6"/><ellipse class="il-metal il-ink" cx="120" cy="102" rx="28" ry="6"/>
    <ellipse class="il-glow il-ink il-thin" cx="40" cy="101" rx="20" ry="3.4"/><ellipse class="il-glow il-ink il-thin" cx="120" cy="101" rx="20" ry="3.4"/>
    <g transform="translate(40 100) scale(0.62)" opacity="0.45">
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <path class="il-line" d="M0 -84v-8"/>
    <circle class="il-glow" cx="-6" cy="-70" r="3"/><circle class="il-glow" cx="6" cy="-70" r="3"/>
    </g>
    <g class="il-white"><circle cx="30" cy="40" r="1.4"/><circle cx="52" cy="50" r="1.2"/><circle cx="26" cy="70" r="1.2"/><circle cx="54" cy="80" r="1.4"/><circle cx="40" cy="30" r="1"/></g>
    <path class="il-light il-thin" d="M28 56l2-2M50 66l2 2M34 88l-2 2"/>
    <path class="il-line" d="M108 94l-6 6M116 96l-2 6M126 96l2 6M134 94l4 6M140 90l6 4M104 90l-6 2"/>
    <ellipse class="il-wood-dark il-ink" cx="124" cy="86" rx="20" ry="10"/>
    <path class="il-line il-thin" d="M114 82q12 4 28 0"/>
    <path class="il-light il-thin" opacity="0.4" d="M120 80q8-2 14 0"/>
    <path class="il-line" d="M104 56q-6-14-16-16M116 56q4-16 14-18"/>
    <rect class="il-metal il-ink" x="98" y="56" width="28" height="24" rx="6"/>
    <rect class="il-dark il-ink il-thin" x="102" y="60" width="20" height="16" rx="3"/>
    <circle class="il-glow" cx="107" cy="68" r="3.4"/><circle class="il-glow" cx="117" cy="68" r="1.6"/>
    <path class="il-light il-thin" d="M108 73q4-2 8 1"/>
    <path class="il-white il-ink il-thin" d="M128 38a4 4 0 1 1 5 4v3"/>
    <path class="il-line il-thin" d="M128 38a4 4 0 1 1 5 4v3"/><circle class="il-dark" cx="133" cy="49" r="1.2"/>`,

  // A proud, smiling android with blushing cheeks, waving; its feelings are on display on its chest screen: a tidy spreadsheet with a single heart in one cell.
  'sl.android': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M0 86h160M40 0v30M120 30v56M24 30v56"/>
    <circle class="il-metal il-ink" cx="136" cy="20" r="13"/><circle class="il-night il-ink il-thin" cx="136" cy="20" r="9"/>
    <circle class="il-white" cx="133" cy="17" r="0.8"/><circle class="il-yellow" cx="139" cy="23" r="1"/>
    <path class="il-dark" d="M0 106h160v14H0z"/>
    <g transform="translate(78 114) scale(1.15)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-10 18 5 3 10-17z"/><circle class="il-metal il-ink" cx="-27" cy="-23" r="4.6"/>
    <path class="il-metal il-ink" d="M18 -44l14-20 5 3-14 21z"/><circle class="il-metal il-ink" cx="35" cy="-66" r="4.6"/>
    <path class="il-light il-thin" d="M40 -74a8 8 0 0 1 4 6M42 -78a12 12 0 0 1 6 10"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <g class="il-dark"><circle cx="-16" cy="-46" r="1"/><circle cx="16" cy="-46" r="1"/><circle cx="-16" cy="-19" r="1"/><circle cx="16" cy="-19" r="1"/></g>
    <rect class="il-white il-ink il-thin" x="-14" y="-46" width="28" height="22" rx="1"/>
    <rect class="il-teal" x="-14" y="-46" width="28" height="5.5"/>
    <rect class="il-pink" x="-4.7" y="-35" width="9.4" height="5.5"/>
    <path class="il-line il-thin" d="M-14 -40.5h28M-14 -35h28M-14 -29.5h28M-4.7 -46v22M4.7 -46v22"/>
    <path class="il-red" d="M0 -30.6c-2.6-1.5-3.1-3.3-1.6-3.9.8-.3 1.4.2 1.6.6.2-.4.8-.9 1.6-.6 1.5.6 1 2.4-1.6 3.9z"/>
    <path class="il-line il-thin" opacity="0.4" d="M-12 -32.3h5M-12 -26.8h5M7 -32.3h5M7 -26.8h5M-2 -26.8h4"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-red il-ink il-thin" cx="0" cy="-94" r="3"/>
    <path class="il-glow" d="M-10 -69a4 4 0 0 1 8 0zM2 -69a4 4 0 0 1 8 0z"/>
    <ellipse class="il-pink" cx="-10" cy="-64" rx="2.6" ry="1.6" opacity="0.8"/><ellipse class="il-pink" cx="10" cy="-64" rx="2.6" ry="1.6" opacity="0.8"/>
    <path class="il-light" d="M-5 -65q5 4 10 0"/>
    </g>`,

  // A grinning stowaway cockroach sits in an open cargo crate with its bundle on a stick over its shoulder and a stolen biscuit; scratched tally marks on the crate count its missions.
  'sl.space-cockroach': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.12" d="M0 40h160M60 0v40M110 0v40"/>
    <path class="il-dark" d="M0 108h160v12H0z"/>
    <rect class="il-wood-dark il-ink il-thin" x="4" y="50" width="30" height="58" opacity="0.8"/>
    <path class="il-line il-thin" d="M4 70h30M4 90h30"/>
    <rect class="il-wood-dark il-ink il-thin" x="130" y="58" width="28" height="50" opacity="0.8"/>
    <path class="il-line il-thin" d="M130 74h28M130 92h28"/>
    <rect class="il-wood il-ink" x="10" y="34" width="34" height="8" transform="rotate(-24 27 38)"/>
    <ellipse class="il-wood-dark il-ink" cx="74" cy="70" rx="22" ry="18"/>
    <path class="il-line il-thin" d="M74 54v20"/>
    <path class="il-line" d="M68 38q-6-18-22-20M80 38q4-20 22-26"/>
    <ellipse class="il-wood il-ink" cx="74" cy="46" rx="15" ry="12"/>
    <circle class="il-white il-ink il-thin" cx="67" cy="43" r="4.6"/><circle class="il-white il-ink il-thin" cx="81" cy="43" r="4.6"/>
    <circle class="il-dark" cx="68" cy="44" r="2"/><circle class="il-dark" cx="82" cy="44" r="2"/>
    <path class="il-line il-thin" d="M62 37l5 1M86 37l-5 1"/>
    <path class="il-dark il-ink il-thin" d="M66 52q8 7 16 0q-8 2-16 0z"/>
    <path class="il-white" d="M70 52.6l1.5 2.4 1.5-2.2zM75 52.6l1.5 2.2 1.5-2.4z"/>
    <path class="il-line il-thick" d="M92 72L118 30"/>
    <path class="il-blue il-ink" d="M118 18l-6-7 9 4zM128 18l6-7-9 4z"/>
    <path class="il-blue il-ink" d="M110 30q0-13 13-13t13 13q0 9-13 9t-13-9z"/>
    <path class="il-line il-thin" d="M119 18q4 2 8 0"/>
    <g class="il-white"><circle cx="117" cy="27" r="1.4"/><circle cx="125" cy="23" r="1.4"/><circle cx="128" cy="32" r="1.4"/><circle cx="120" cy="34" r="1.2"/><circle cx="131" cy="26" r="1.2"/></g>
    <path class="il-line" d="M86 66l8 6"/><circle class="il-wood il-ink" cx="94" cy="72" r="4"/>
    <path class="il-line" d="M62 66l-10 6"/>
    <circle class="il-earth il-ink il-thin" cx="50" cy="72" r="6"/>
    <g class="il-earth-dark"><circle cx="48" cy="70" r="1"/><circle cx="52" cy="74" r="1"/></g>
    <circle class="il-wood il-ink" cx="54" cy="74" r="3.6"/>
    <rect class="il-wood il-ink" x="36" y="76" width="88" height="34"/>
    <path class="il-line il-thin" d="M36 88h88M36 99h88"/>
    <path class="il-metal il-ink il-thin" d="M36 76h7v7h-7zM117 76h7v7h-7zM36 103h7v7h-7zM117 103h7v7h-7z"/>
    <path class="il-line il-thin" d="M50 79v7M53 79v7M56 79v7M59 79v7M48 85l13-5M68 79v7M71 79v7M74 79v7M77 79v7M66 85l13-5M86 79v7M89 79v7"/>`,

  // A happy green slime blob waves hello with a wobbly pseudopod; behind it a glistening slime trail runs across the alien ground, and a swallowed bolt and coin float inside it.
  'sl.space-slime': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="10" r="1"/><circle cx="56" cy="16" r="0.8"/><circle cx="100" cy="8" r="1"/><circle cx="150" cy="60" r="0.8"/><circle cx="18" cy="60" r="0.8"/></g>
    <g class="il-yellow"><circle cx="30" cy="34" r="1.2"/><circle cx="90" cy="30" r="1"/></g>
    <circle class="il-teal il-ink il-thin" cx="134" cy="24" r="11"/>
    <ellipse class="il-line il-thin" cx="134" cy="24" rx="19" ry="4" transform="rotate(-15 134 24)"/>
    <path class="il-purple-dark" d="M0 94q80-8 160 0v26H0z"/>
    <ellipse class="il-dark" cx="24" cy="110" rx="10" ry="2.4" opacity="0.5"/><ellipse class="il-dark" cx="138" cy="112" rx="12" ry="2.6" opacity="0.5"/>
    <path class="il-slime il-ink il-thin" opacity="0.6" d="M-2 100q30-6 62 0v10q-30-4-62 0z"/>
    <path class="il-light il-thin" opacity="0.7" d="M6 102h6M22 101h8M40 102h6"/>
    <path class="il-slime il-ink" d="M52 108c-4-22 2-52 26-56 22-4 34 22 32 56q-29 6-58 0z"/>
    <path class="il-slime il-ink" d="M108 80q12-6 14-20 2-6 6-4 2 2 0 6-2 16-18 26z"/>
    <path class="il-line il-thin" d="M126 50l3-3M130 56l4-1M120 52l-1-4"/>
    <path class="il-slime il-ink il-thin" d="M58 108q0 6 3 6t2-6M98 108q0 5 3 5t2-5"/>
    <g opacity="0.55">
    <circle class="il-gold il-ink il-thin" cx="64" cy="94" r="4"/>
    <path class="il-metal il-ink il-thin" d="M94 88l6 2-1 3-6-2zM99 91l6 2"/>
    </g>
    <path class="il-light il-thin" opacity="0.7" d="M62 70q2-12 12-16"/>
    <circle class="il-white" cx="66" cy="62" r="2"/>
    <circle class="il-white il-ink" cx="74" cy="74" r="7"/><circle class="il-white il-ink" cx="92" cy="74" r="7"/>
    <circle class="il-dark" cx="75" cy="75" r="3"/><circle class="il-dark" cx="93" cy="75" r="3"/>
    <circle class="il-white" cx="74" cy="73.6" r="1"/><circle class="il-white" cx="92" cy="73.6" r="1"/>
    <path class="il-dark il-ink il-thin" d="M74 86q9 8 18 0q-9 3-18 0z"/>
    <path class="il-pink" d="M80 89q3 2 6 0z"/>
    <path class="il-green il-ink il-thin" d="M80 52l-2-8"/>
    <g class="il-pink il-ink il-thin"><circle cx="78" cy="40" r="2.6"/><circle cx="74" cy="44" r="2.6"/><circle cx="82" cy="44" r="2.6"/><circle cx="76" cy="48" r="2.4"/><circle cx="81" cy="48" r="2.4"/></g>
    <circle class="il-yellow il-ink il-thin" cx="78" cy="45" r="2"/>`,

  // A green alien in a purple suit and tie (white peace flag in the breast pocket) greets you with a tentacle and a briefcase, next to its contract: a paper stack taller than itself, one sheet unrolling across the floor.
  'sl.briefcase-alien': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="10" r="1"/><circle cx="40" cy="20" r="0.8"/><circle cx="96" cy="12" r="1"/><circle cx="154" cy="6" r="0.8"/></g>
    <g class="il-yellow"><circle cx="20" cy="50" r="1.2"/><circle cx="96" cy="40" r="1"/></g>
    <path class="il-stone" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" d="M0 104h160"/>
    <rect class="il-paper il-ink" x="110" y="12" width="38" height="92" rx="1"/>
    <path class="il-line il-thin" opacity="0.35" d="M110 18h38M110 22h38M110 26h38M110 30h38M110 34h38M110 38h38M110 42h38M110 46h38M110 50h38M110 54h38M110 58h38M110 62h38M110 66h38M110 70h38M110 74h38M110 78h38M110 82h38M110 86h38M110 90h38M110 94h38M110 98h38"/>
    <path class="il-paper il-ink il-thin" d="M108 12h40l2-4h-40z"/>
    <path class="il-metal il-ink il-thin" d="M124 4h5v9h-5z"/>
    <path class="il-paper il-ink" d="M110 96q-20 4-40 8v6q22-4 40-10z"/>
    <path class="il-line il-thin" opacity="0.4" d="M100 102l-16 4M104 98l-16 4"/>
    <path class="il-green il-ink" d="M48 102q-8-2-6-10l5 1q-1 4 3 5zM66 102q8-2 6-10l-5 1q1 4-3 5z"/>
    <path class="il-purple-dark il-ink" d="M40 102l4-36h28l4 36z"/>
    <path class="il-white il-ink il-thin" d="M52 66l6 10 6-10z"/>
    <path class="il-red il-ink il-thin" d="M56.5 70h3l1.5 3-3 12-3-12z"/>
    <path class="il-line il-thin" d="M66 78h6"/>
    <path class="il-line il-thin" d="M68 78v-8"/><path class="il-white il-ink il-thin" d="M68 70h7l-2 2 2 2h-7z"/>
    <path class="il-green il-ink" d="M42 72q-12 6-14 18l5 1q2-10 12-14z"/>
    <rect class="il-wood-dark il-ink" x="16" y="88" width="28" height="18" rx="2"/>
    <path class="il-line il-thin" d="M24 88v-4h12v4M16 96h28"/>
    <rect class="il-gold il-ink il-thin" x="21" y="94" width="4" height="4"/><rect class="il-gold il-ink il-thin" x="35" y="94" width="4" height="4"/>
    <path class="il-green il-ink" d="M72 72q14-2 22-16 2-4 6-2t0 6q-10 16-26 18z"/>
    <path class="il-line il-thin" d="M104 50l4-2M104 56h5"/>
    <path class="il-line" d="M58 26v-10"/><circle class="il-glow il-ink il-thin" cx="58" cy="14" r="3"/>
    <ellipse class="il-green il-ink" cx="58" cy="44" rx="18" ry="20"/>
    <path class="il-light il-thin" opacity="0.5" d="M46 36q2-8 8-10"/>
    <ellipse class="il-dark" cx="50" cy="44" rx="5" ry="7" transform="rotate(-25 50 44)"/>
    <ellipse class="il-dark" cx="66" cy="44" rx="5" ry="7" transform="rotate(25 66 44)"/>
    <circle class="il-white" cx="49" cy="41" r="1.4"/><circle class="il-white" cx="65" cy="41" r="1.4"/>
    <path class="il-line il-thin" d="M53 56q5 4 10 0"/>`,

  // A wheeler-dealer android in a cap and trader's vest pushes a hovering cart of crates topped with a money bag; above it a route arrow runs from a planet with one coin to a planet with a big stack of coins. It winks.
  'sl.cargo-trader': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="70" cy="40" r="0.8"/><circle cx="100" cy="44" r="1"/><circle cx="6" cy="70" r="0.8"/><circle cx="154" cy="70" r="0.8"/></g>
    <circle class="il-teal il-ink" cx="20" cy="22" r="11"/>
    <path class="il-line il-thin" opacity="0.4" d="M12 18q8 3 16 0M11 26q9 3 18 0"/>
    <circle class="il-gold il-ink il-thin" cx="20" cy="40" r="3.6"/>
    <circle class="il-orange il-ink" cx="142" cy="22" r="12"/>
    <ellipse class="il-line il-thin" cx="142" cy="22" rx="20" ry="4" transform="rotate(-12 142 22)"/>
    <g class="il-gold il-ink il-thin"><ellipse cx="142" cy="50" rx="5" ry="2"/><ellipse cx="142" cy="47" rx="5" ry="2"/><ellipse cx="142" cy="44" rx="5" ry="2"/><ellipse cx="142" cy="41" rx="5" ry="2"/></g>
    <path class="il-light il-thin il-dash" d="M34 18q46-22 90-4"/>
    <path class="il-white il-ink il-thin" d="M124 9l6 6-8 2z"/>
    <ellipse class="il-torch" cx="118" cy="102" rx="32" ry="5"/>
    <path class="il-glow il-ink il-thin" d="M92 92l3 8 3-8zM138 92l3 8 3-8z"/>
    <rect class="il-wood il-ink" x="88" y="62" width="26" height="22"/>
    <path class="il-line il-thin" d="M88 62l26 22M114 62L88 84"/>
    <rect class="il-wood il-ink" x="114" y="52" width="34" height="32"/>
    <path class="il-line il-thin" d="M114 68h34M131 52v32"/>
    <path class="il-metal il-ink il-thin" d="M114 52h5v5h-5zM143 52h5v5h-5z"/>
    <path class="il-gold il-ink" d="M130 52c-10 0-12-10-6-15l-2-4h14l-2 4c6 5 4 15-6 15z"/>
    <circle class="il-yellow il-ink il-thin" cx="130" cy="44" r="3"/>
    <rect class="il-metal il-ink" x="84" y="84" width="68" height="8" rx="2"/>
    <path class="il-line il-thick" d="M86 86l-6-6"/>
    <g transform="translate(46 108) scale(0.8)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <path class="il-orange il-ink" d="M-20 -46q0-4 4-4h8l4 16 4-16h8q4 0 4 4v26q0 5-5 5h-22q-5 0-5-5z"/>
    <path class="il-line il-thin" d="M-16 -30h8v6h-8zM8 -30h8v6H8z"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <path class="il-blue il-ink" d="M-19 -82q0-14 19-14t19 14z"/>
    <path class="il-blue il-ink" d="M14 -84h18v4H14z"/>
    <circle class="il-glow" cx="-6" cy="-70" r="3.2"/>
    <path class="il-light" d="M3 -70h7M-7 -64q7 5 14 0"/>
    <path class="il-metal il-ink" d="M18 -44l24 6-1 5-24-5z"/><circle class="il-metal il-ink" cx="43" cy="-35" r="4.6"/>
    </g>`,

  // A beaming janitor android in overalls and cap, with a tool belt full of pockets, a gigantic ring of keys and a mop; a bucket and a puddle wait beside it.
  'sl.space-janitor': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 34h160M0 84h160M40 0v34M130 34v50"/>
    <path class="il-dark" d="M0 106h160v14H0z"/>
    <ellipse class="il-water il-ink il-thin" cx="132" cy="110" rx="22" ry="3" opacity="0.7"/>
    <path class="il-metal il-ink" d="M116 82h28l-3 26h-22z"/>
    <path class="il-line il-thin" d="M118 88h24M116 82q14-12 28 0"/>
    <ellipse class="il-water il-ink il-thin" cx="130" cy="83" rx="13" ry="2.4"/>
    <path class="il-line il-thick" d="M38 22l-8 82"/>
    <path class="il-paper il-ink il-thin" d="M30 102l-10 8M30 102l-6 10M30 102l-1 10M30 102l4 10M30 102l8 8"/>
    <path class="il-paper il-ink" d="M22 104h16l2 4H20z"/>
    <g transform="translate(74 108) scale(0.95)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-blue il-ink" x="-15" y="-17" width="11" height="15" rx="2"/>
    <rect class="il-blue il-ink" x="4" y="-17" width="11" height="15" rx="2"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-14 10 3 4 13-9z"/><circle class="il-metal il-ink" cx="-38" cy="-62" r="0"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <path class="il-blue il-ink" d="M-20 -40h40v20q0 5-5 5h-30q-5 0-5-5z"/>
    <path class="il-blue il-ink il-thin" d="M-14 -40l-2-10h5l1 10M14 -40l2-10h-5l-1 10"/>
    <rect class="il-paper il-ink il-thin" x="-6" y="-38" width="12" height="7"/>
    <rect class="il-wood-dark il-ink" x="-23" y="-24" width="46" height="6"/>
    <g class="il-wood il-ink il-thin"><rect x="-22" y="-20" width="7" height="9"/><rect x="-13" y="-20" width="6" height="8"/><rect x="-5" y="-20" width="6" height="9"/><rect x="3" y="-20" width="6" height="8"/></g>
    <path class="il-metal il-ink il-thin" d="M-19 -20v-5M-10 -20v-5h2M-2 -20l-1-5h3M6 -20v-5"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-blue il-ink" d="M-19 -82q0-14 19-14t19 14z"/><path class="il-blue il-ink" d="M-28 -84h14v4h-14z"/>
    <path class="il-glow" d="M-10 -69a4 4 0 0 1 8 0zM2 -69a4 4 0 0 1 8 0z"/>
    <path class="il-light" d="M-6 -64q6 5 12 0"/>
    <path class="il-metal il-ink" d="M18 -44l10 14-4 3-10-13z"/><circle class="il-metal il-ink" cx="27" cy="-28" r="4.6"/>
    </g>
    <path class="il-metal il-ink" d="M58 66l-18-8 2-5 18 8z"/>
    <circle class="il-metal il-ink" cx="39" cy="56" r="4.6"/>
    <circle class="il-line il-thick" cx="102" cy="92" r="9"/>
    <path class="il-line il-thin" d="M98 82l-2-8"/>
    <g transform="rotate(-60 102 92)"><circle class="il-gold il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-gold il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>
    <g transform="rotate(-30 102 92)"><circle class="il-metal il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-metal il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>
    <g transform="rotate(0 102 92)"><circle class="il-gold il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-gold il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>
    <g transform="rotate(30 102 92)"><circle class="il-red il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-metal il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>
    <g transform="rotate(60 102 92)"><circle class="il-gold il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-gold il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>
    <g transform="rotate(90 102 92)"><circle class="il-blue il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-metal il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>
    <g transform="rotate(-90 102 92)"><circle class="il-metal il-ink il-thin" cx="102" cy="104" r="2.6"/><path class="il-metal il-ink il-thin" d="M101 106h2v8h-2zM103 110h2v2h-2z"/></g>`,

  // A gadget officer: propeller cap whirring, goggles, headset; one hand holds a box of blinking lights with a spring, the other a beeping scanner; little beep arcs everywhere.
  'sl.gadget-officer': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M50 0v30M110 0v30"/>
    <rect class="il-dark il-ink il-thin" x="8" y="8" width="34" height="20" rx="2"/><path class="il-light il-thin" d="M12 22l6-8 6 6 6-10 8 8"/>
    <rect class="il-dark il-ink il-thin" x="120" y="8" width="32" height="20" rx="2"/><circle class="il-line il-thin" cx="136" cy="18" r="6"/><path class="il-light il-thin" d="M136 18l4-4"/>
    <path class="il-teal il-ink" d="M50 120c0-24 12-36 30-36s30 12 30 36z"/>
    <path class="il-gold il-ink il-thin" d="M56 92l10-4v4l-10 4zM104 92l-10-4v4l10 4z"/>
    <rect class="il-dark il-ink il-thin" x="60" y="106" width="40" height="8" rx="2"/>
    <g class="il-ink il-thin"><circle class="il-red" cx="66" cy="110" r="2"/><circle class="il-green" cx="74" cy="110" r="2"/><circle class="il-yellow" cx="82" cy="110" r="2"/><circle class="il-glow" cx="90" cy="110" r="2"/></g>
    <path class="il-teal il-ink" d="M58 92q-14 0-20-16l6-2q6 10 16 12z"/>
    <path class="il-teal il-ink" d="M102 92q14 0 18-14l-6-2q-4 8-14 10z"/>
    <rect class="il-dark il-ink" x="16" y="58" width="28" height="18" rx="2"/>
    <g class="il-ink il-thin"><circle class="il-red" cx="23" cy="64" r="2.4"/><circle class="il-yellow" cx="30" cy="64" r="2.4"/><circle class="il-green" cx="37" cy="64" r="2.4"/></g>
    <path class="il-light il-thin" d="M20 71h20"/>
    <path class="il-line il-thin" d="M30 58q-4-3 0-5t0-5 0-5"/><circle class="il-red il-ink il-thin" cx="30" cy="42" r="2"/>
    <path class="il-light il-thin" d="M12 54l-4-4M48 54l4-4M22 40l-4-2"/>
    <circle class="il-skin il-ink" cx="40" cy="74" r="5"/>
    <rect class="il-metal il-ink" x="112" y="50" width="24" height="30" rx="3"/>
    <rect class="il-teal il-ink il-thin" x="116" y="54" width="16" height="12" rx="1"/>
    <path class="il-light il-thin" d="M117 60h3l2-4 3 8 2-4h4"/>
    <circle class="il-red il-ink il-thin" cx="120" cy="73" r="2.4"/><circle class="il-glow il-ink il-thin" cx="128" cy="73" r="2.4"/>
    <path class="il-light il-thin" d="M140 54a6 6 0 0 1 0 10M144 50a12 12 0 0 1 0 18"/>
    <circle class="il-skin il-ink" cx="118" cy="78" r="5"/>
    <path class="il-skin il-ink" d="M64 62c0-12 7-20 16-20s16 8 16 20v4c0 10-7 18-16 18s-16-8-16-18z"/>
    <path class="il-white il-ink" d="M62 56a18 16 0 0 1 36 0z"/>
    <path class="il-line" d="M80 40v-8"/>
    <ellipse class="il-red il-ink il-thin" cx="72" cy="31" rx="8" ry="2.6"/><ellipse class="il-red il-ink il-thin" cx="88" cy="31" rx="8" ry="2.6"/>
    <circle class="il-yellow il-ink il-thin" cx="80" cy="31" r="2"/>
    <path class="il-light il-thin" d="M62 26q-4 4 0 8M98 26q4 4 0 8"/>
    <path class="il-line il-thin" d="M96 48l6-6"/><path class="il-metal il-ink il-thin" d="M100 40a5 5 0 0 1 6 6z"/>
    <circle class="il-metal il-ink" cx="73" cy="64" r="6"/><circle class="il-metal il-ink" cx="87" cy="64" r="6"/>
    <circle class="il-water il-ink il-thin" cx="73" cy="64" r="4"/><circle class="il-water il-ink il-thin" cx="87" cy="64" r="4"/>
    <circle class="il-dark" cx="74" cy="64" r="1.6"/><circle class="il-dark" cx="88" cy="64" r="1.6"/>
    <path class="il-line il-thin" d="M79 64h2M64 62h3M93 62h3"/>
    <path class="il-dark il-ink il-thin" d="M72 74q8 7 16 0z"/>
    <path class="il-white" d="M74 74.4h12l-1 1.6H75z"/>
    <path class="il-line il-thin" d="M64 66q2 12 8 12"/><circle class="il-dark" cx="72" cy="78" r="1.6"/>`,

  // A robot whisperer kneels beside an android, cupping a hand to whisper a kind word into its ear while giving its elbow joint one drop from a little oil can; the android blushes, little hearts rising.
  'sl.robot-whisperer': `
    <rect class="il-grey" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 30h160M0 84h160M30 0v30M120 30v54"/>
    <path class="il-dark" d="M0 108h160v12H0z"/>
    <path class="il-pink il-ink il-thin" d="M36 26c-5-3-6-8-3-9 2-1 3 1 3 2 0-1 1-3 3-2 3 1 2 6-3 9zM22 40c-4-2-5-6-2-7 1 0 2 1 2 2 0-1 1-2 2-2 3 1 2 5-2 7zM48 14c-3-2-4-5-1.5-5.6 1 0 1.5 1 1.5 1.6 0-.6.6-1.6 1.5-1.6 2.5.6 1.5 3.6-1.5 5.6z"/>
    <g transform="translate(52 110) scale(0.9)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <rect class="il-metal il-ink" x="-15" y="-17" width="11" height="15" rx="3"/>
    <rect class="il-metal il-ink" x="4" y="-17" width="11" height="15" rx="3"/>
    <path class="il-dark il-ink" d="M-18 0v-5h15v5zM3 0v-5h15v5z"/>
    <path class="il-metal il-ink" d="M-18 -44l-8 18 5 2 8-17z"/><circle class="il-metal il-ink" cx="-24" cy="-23" r="4.6"/>
    <rect class="il-metal il-ink" x="-20" y="-50" width="40" height="35" rx="7"/>
    <g class="il-dark"><circle cx="-16" cy="-46" r="1"/><circle cx="16" cy="-46" r="1"/><circle cx="-16" cy="-19" r="1"/><circle cx="16" cy="-19" r="1"/></g>
    <rect class="il-teal il-ink il-thin" x="-11" y="-44" width="22" height="12" rx="2"/>
    <path class="il-pink il-ink il-thin" d="M0 -34c-4-2.4-5-5.6-2.4-6.4 1.2-.4 2 .4 2.4 1 .4-.6 1.2-1.4 2.4-1 2.6.8 1.6 4-2.4 6.4z"/>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-24" r="2"/><circle class="il-yellow il-ink il-thin" cx="0" cy="-24" r="2"/><circle class="il-green il-ink il-thin" cx="6" cy="-24" r="2"/>
    <path class="il-metal il-ink" d="M18 -44l10 16-4 3-10-15z"/>
    <path class="il-metal il-ink" d="M28 -28l-4 14-5-1 4-14z"/>
    <circle class="il-grey il-ink il-thin" cx="27" cy="-27" r="3.4"/>
    <circle class="il-metal il-ink" cx="21" cy="-12" r="4.6"/>
    <rect class="il-metal il-ink" x="-6" y="-56" width="12" height="7"/>
    <rect class="il-metal il-ink" x="-19" y="-84" width="38" height="30" rx="8"/>
    <rect class="il-dark il-ink il-thin" x="-14" y="-79" width="28" height="20" rx="4"/>
    <rect class="il-grey il-ink il-thin" x="-23" y="-75" width="4" height="12" rx="2"/>
    <rect class="il-grey il-ink il-thin" x="19" y="-75" width="4" height="12" rx="2"/>
    <path class="il-line" d="M0 -84v-8"/><circle class="il-pink il-ink il-thin" cx="0" cy="-94" r="3"/>
    <path class="il-glow" d="M-10 -69a4 4 0 0 1 8 0zM2 -69a4 4 0 0 1 8 0z"/>
    <ellipse class="il-pink" cx="-10" cy="-64" rx="3" ry="1.8"/><ellipse class="il-pink" cx="10" cy="-64" rx="3" ry="1.8"/>
    <path class="il-light il-thin" d="M-4 -64q4 3 8 0"/>
    </g>
    <path class="il-line il-thin" d="M84 44q-4-2-7 0M85 49h-7M84 54q-4 2-7 0"/>
    <path class="il-blue il-ink" d="M104 96h26l6 12h-36z"/>
    <path class="il-dark il-ink" d="M130 108l12-4 4 4z"/>
    <path class="il-green il-ink" d="M94 64q8-6 18-2l10 36H100z"/>
    <path class="il-line il-thin" d="M104 76h12"/>
    <path class="il-green il-ink" d="M98 68l-10-12 4-3 10 11z"/>
    <path class="il-skin il-ink" d="M86 58q-4-2-3-6t5-2l2 6z"/>
    <path class="il-green il-ink" d="M104 76l-6 4-4-4 6-5z"/>
    <path class="il-red il-ink" d="M88 88v-8q0-4 6-4t6 4v8z"/>
    <path class="il-line" d="M100 80q6 0 6 4t-6 3"/>
    <path class="il-metal il-ink il-thin" d="M89 80l-7-3 1-2 7 2z"/>
    <ellipse class="il-dark" cx="81" cy="81" rx="1.2" ry="1.8"/>
    <circle class="il-skin il-ink" cx="98" cy="78" r="4"/>
    <circle class="il-skin il-ink" cx="102" cy="50" r="11"/>
    <path class="il-wood-dark il-ink" d="M92 46q0-10 10-10t11 9q-6-4-12-2-5 1-9 3z"/>
    <path class="il-line il-thin" d="M96 50q2 2 4 0M93 54l-2 1"/>
    <ellipse class="il-dark" cx="94" cy="57" rx="1.4" ry="1.8"/>
    <ellipse class="il-pink" cx="99" cy="55" rx="2.4" ry="1.4" opacity="0.7"/>
    <ellipse class="il-skin il-ink il-thin" cx="111" cy="51" rx="2" ry="3"/>`,

  // A xeno-gardener in a straw hat waters a calm, smiling alien flower while sprinting away from a big toothy purple bush that snaps at him from its pot.
  'sl.xeno-gardener': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="10" r="1"/><circle cx="60" cy="8" r="0.8"/><circle cx="104" cy="20" r="1"/><circle cx="150" cy="8" r="0.8"/></g>
    <circle class="il-purple il-ink il-thin" cx="36" cy="26" r="12"/><path class="il-line il-thin" opacity="0.4" d="M26 22q10 4 20 0M25 30q11 3 22 0"/>
    <path class="il-earth-dark" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" d="M0 100h160"/>
    <path class="il-earth il-ink" d="M116 120l4-18h32l4 18z"/>
    <path class="il-green il-ink il-thin" d="M120 66l-8-6 10 2zM150 62l8-8-4 10zM154 84l6 2-6 2zM132 56l2-8 4 8z"/>
    <path class="il-purple il-ink" d="M118 102c-12-12-8-36 10-44 16-6 32 6 30 26-1 10-6 16-12 18z"/>
    <path class="il-dark il-ink" d="M104 70L140 78L108 96z"/>
    <path class="il-white il-ink il-thin" d="M108 71l3 5 3-4 4 5 3-4 4 5 3-4 4 5 3-4M110 94l3-5 3 4 4-6 3 5 4-5 2 4"/>
    <path class="il-pink il-ink il-thin" d="M118 86q8-4 14-2-6 6-14 2z"/>
    <circle class="il-glow il-ink il-thin" cx="138" cy="66" r="4"/><circle class="il-dark" cx="137" cy="67" r="1.6"/>
    <path class="il-line" d="M131 60l12 3"/>
    <path class="il-light il-thin" d="M100 64l-4-2M98 76h-5M100 88l-4 2"/>
    <path class="il-earth il-ink" d="M10 120l3-16h26l3 16z"/>
    <path class="il-line il-thick" d="M26 104v-12"/>
    <path class="il-green il-ink il-thin" d="M26 100q-8-2-10-8 8 0 10 6zM26 98q8-2 10-8-8 0-10 6z"/>
    <g class="il-pink il-ink il-thin"><circle cx="26" cy="74" r="5"/><circle cx="34" cy="80" r="5"/><circle cx="31" cy="89" r="5"/><circle cx="21" cy="89" r="5"/><circle cx="18" cy="80" r="5"/></g>
    <circle class="il-yellow il-ink" cx="26" cy="83" r="7"/>
    <path class="il-line il-thin" d="M22 82q2-2 3 0M27 82q2-2 3 0M23 86q3 2 6 0"/>
    <g class="il-water il-ink il-thin"><ellipse cx="24" cy="66" rx="1.2" ry="2"/><ellipse cx="30" cy="64" rx="1.2" ry="2"/><ellipse cx="20" cy="70" rx="1.2" ry="2"/></g>
    <path class="il-blue il-ink" d="M62 82l-12 10 3 4 13-10z"/>
    <path class="il-blue il-ink" d="M76 82l10 14-4 3-10-14z"/>
    <ellipse class="il-dark il-ink il-thin" cx="50" cy="95" rx="5" ry="3"/><ellipse class="il-dark il-ink il-thin" cx="86" cy="99" rx="5" ry="3"/>
    <path class="il-blue il-ink" d="M60 58h20l-2 28H58z"/>
    <path class="il-line il-thin" d="M62 58l2-4M78 58l-2-4M62 70h14"/>
    <path class="il-skin il-ink" d="M78 62l10-8 3 3-10 9z"/><circle class="il-skin il-ink" cx="90" cy="54" r="4"/>
    <path class="il-skin il-ink" d="M62 62l-12 6 2 4 12-6z"/><circle class="il-skin il-ink" cx="49" cy="70" r="4"/>
    <rect class="il-green il-ink" x="36" y="62" width="14" height="12" rx="2"/>
    <path class="il-line" d="M40 62q4-6 8 0"/>
    <path class="il-green il-ink il-thin" d="M37 66l-8-5 1-2 8 4z"/>
    <ellipse class="il-green il-ink il-thin" cx="29" cy="59" rx="2" ry="3" transform="rotate(-30 29 59)"/>
    <circle class="il-skin il-ink" cx="72" cy="46" r="10"/>
    <circle class="il-white il-ink il-thin" cx="75" cy="45" r="3"/><circle class="il-white il-ink il-thin" cx="80" cy="45" r="2.6"/>
    <circle class="il-dark" cx="76.4" cy="45" r="1.2"/><circle class="il-dark" cx="81" cy="45" r="1.1"/>
    <ellipse class="il-dark" cx="77" cy="52" rx="2" ry="2.6"/>
    <ellipse class="il-yellow il-ink" cx="72" cy="37" rx="15" ry="3.4"/>
    <path class="il-yellow il-ink" d="M63 37q0-10 9-10t9 10z"/>
    <path class="il-red il-thin" d="M63 35h18v2H63z"/>
    <path class="il-water il-ink il-thin" d="M62 44q-2 3 0 4 2-1 0-4zM66 52q-2 3 0 4 2-1 0-4z"/>`,

  // A test pilot (goggles up, scarf fluttering, plaster on the cheek) gives a proud thumbs-up next to the saucer he just "landed": upside down, dome buried in the dirt, landing legs in the air, a wheel rolling away.
  'sl.test-pilot': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="10" cy="10" r="1"/><circle cx="60" cy="8" r="0.8"/><circle cx="104" cy="16" r="1"/><circle cx="150" cy="40" r="0.8"/></g>
    <g class="il-yellow"><circle cx="30" cy="30" r="1.2"/><circle cx="128" cy="8" r="1"/></g>
    <circle class="il-smoke il-ink il-thin" cx="56" cy="40" r="6"/><circle class="il-smoke il-ink il-thin" cx="66" cy="30" r="7"/><circle class="il-smoke il-ink il-thin" cx="78" cy="22" r="5"/>
    <path class="il-water il-ink" d="M38 86a24 18 0 0 0 48 0z"/>
    <path class="il-stone" d="M0 96h160v24H0z"/>
    <path class="il-line il-thin" d="M0 96h30M92 96h68"/>
    <path class="il-earth-dark il-ink il-thin" d="M30 96q-4-6 2-8 4 4 6 8zM86 96q4-6 10-4-2 4-4 4z"/>
    <g class="il-earth-dark il-ink il-thin"><circle cx="24" cy="86" r="2"/><circle cx="98" cy="84" r="1.6"/><circle cx="20" cy="76" r="1.4"/></g>
    <ellipse class="il-grey" cx="140" cy="110" rx="12" ry="3"/>
    <path class="il-line il-thick" d="M40 78l-10-24M62 74v-26M84 76l10-22"/>
    <ellipse class="il-dark il-ink" cx="29" cy="52" rx="6" ry="2.4"/><ellipse class="il-dark il-ink" cx="62" cy="46" rx="6" ry="2.4"/>
    <path class="il-line il-thin" d="M94 54l4-2"/>
    <ellipse class="il-metal il-ink" cx="62" cy="82" rx="44" ry="10" transform="rotate(-4 62 82)"/>
    <ellipse class="il-grey il-ink il-thin" cx="62" cy="78" rx="24" ry="4" transform="rotate(-4 62 78)"/>
    <g class="il-yellow il-ink il-thin"><circle cx="26" cy="86" r="2"/><circle cx="44" cy="90" r="2"/><circle cx="80" cy="89" r="2"/></g>
    <circle class="il-red il-ink il-thin" cx="98" cy="84" r="2"/>
    <path class="il-stone il-ink il-thin" d="M54 84h10v5H54z"/>
    <circle class="il-dark il-ink" cx="14" cy="106" r="7"/><circle class="il-metal" cx="14" cy="106" r="2.4"/>
    <path class="il-light il-thin" d="M26 104h6M26 110h8"/>
    <path class="il-dark il-ink" d="M118 108v-6h10v6zM132 108v-6h10v6z"/>
    <path class="il-orange il-ink" d="M118 102l2-28h22l2 28z"/>
    <path class="il-line il-thin" d="M131 76v26M122 88h6"/>
    <path class="il-red il-ink" d="M122 72h18l14-8-2 6 6 2-18 6h-18z"/>
    <path class="il-orange il-ink" d="M140 78l8 10-4 3-8-10z"/><circle class="il-skin il-ink" cx="148" cy="91" r="4"/>
    <path class="il-orange il-ink" d="M122 80l-10-8 3-4 10 7z"/>
    <circle class="il-skin il-ink" cx="110" cy="68" r="5"/>
    <rect class="il-skin il-ink il-thin" x="108" y="58" width="4" height="9" rx="2"/>
    <circle class="il-skin il-ink" cx="131" cy="60" r="11"/>
    <path class="il-white il-ink" d="M119 58a12 12 0 0 1 24 0v2h-2a10 8 0 0 0-20 0h-2z"/>
    <circle class="il-metal il-ink il-thin" cx="126" cy="50" r="3.6"/><circle class="il-metal il-ink il-thin" cx="136" cy="50" r="3.6"/>
    <circle class="il-water" cx="126" cy="50" r="2.2"/><circle class="il-water" cx="136" cy="50" r="2.2"/>
    <circle class="il-dark" cx="127" cy="59" r="1.4"/><circle class="il-dark" cx="135" cy="59" r="1.4"/>
    <path class="il-dark il-ink il-thin" d="M125 64q6 6 12 0z"/>
    <path class="il-paper il-ink il-thin" d="M137 61l4-1 .6 3-4 1z"/>
    <ellipse class="il-dark" cx="123" cy="62" rx="2" ry="1.2" opacity="0.4"/>`,
};
