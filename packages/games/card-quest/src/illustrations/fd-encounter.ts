/* Fridge illustrations: encounter. */
export const FD_ENCOUNTER: Readonly<Record<string, string>> = {
  // A family-size cardboard pack bursts at the seams: four monsters cram out of the top, one is squashed against the window, a "+" sticker brags.
  'fd.family-pack': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="106" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 106h160M0 111h160"/>
    <path class="il-light il-thin" d="M16 108.5h40M92 108.5h18"/><rect class="il-metal" x="0" y="111" width="160" height="9" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 116h40"/>
    <path class="il-dark" opacity="0.2" d="M30 106h112l-6 4H26z"/>
    <path class="il-wood-dark il-ink" d="M122 40l18-8v66l-18 8z"/>
    <path class="il-wood il-ink" d="M122 40l-24-14-12 8 24 14z"/>
    <path class="il-wood il-ink" d="M36 40l-14-16 20-4 12 14z"/>
    <path class="il-white il-ink il-thin" d="M48.5 21.6l-3.5 -8.3 8.3 3.5zM63.5 21.6l3.5 -8.3 -8.3 3.5z"/><path class="il-purple il-ink" d="M41 39.8C39.5 20.3 48.5 19 56 19S72.5 20.3 71 39.8Q56 46.3 41 39.8z"/><path class="il-light il-thin" opacity="0.45" d="M47 28.1q1.5 -5.9 6.8 -7.1"/><circle class="il-white il-ink il-thin" cx="50.1" cy="29.5" r="4"/><circle class="il-white il-ink il-thin" cx="61.9" cy="29.5" r="4"/>
    <circle class="il-dark" cx="50.1" cy="29.9" r="1.9"/><circle class="il-dark" cx="61.9" cy="29.9" r="1.9"/><path class="il-line il-thin" d="M46.5 22.3L53.6 23.7M58.4 23.7L65.5 22.3"/><path class="il-dark il-ink il-thin" d="M50.1 36h11.8q0 7.1 -5.9 7.1t-5.9 -7.1z"/><path class="il-white" d="M50.8 36.6h10.4v1.9h-10.4z"/>
    <path class="il-slime il-ink" d="M71 33.8C69.7 14.3 77.5 13 84 13S98.3 14.3 97 33.8Q84 40.3 71 33.8z"/><path class="il-light il-thin" opacity="0.45" d="M76.2 22.1q1.3 -5.9 5.9 -7.1"/><circle class="il-white il-ink il-thin" cx="78.1" cy="23.5" r="4"/><circle class="il-white il-ink il-thin" cx="89.9" cy="23.5" r="4"/>
    <circle class="il-dark" cx="78.1" cy="23.5" r="1.9"/><circle class="il-dark" cx="89.9" cy="23.5" r="1.9"/><path class="il-line il-thin" d="M74.5 16.4L81.6 14.1M86.4 14.1L93.5 16.4"/><ellipse class="il-dark il-ink il-thin" cx="84" cy="32.4" rx="2.8" ry="3.8"/>
    <path class="il-orange il-ink" d="M95 41.2C93.7 23.2 101.5 22 108 22S122.3 23.2 121 41.2Q108 47.2 95 41.2z"/><path class="il-light il-thin" opacity="0.45" d="M100.2 30.4q1.3 -5.4 5.9 -6.6"/><circle class="il-dark" cx="115.8" cy="35.2" r="1.5" opacity="0.5"/><circle class="il-dark" cx="99.6" cy="38.2" r="1.2" opacity="0.5"/><circle class="il-white il-ink il-thin" cx="102.5" cy="31.7" r="3.7"/><circle class="il-white il-ink il-thin" cx="113.5" cy="31.7" r="3.7"/>
    <circle class="il-dark" cx="102.5" cy="32.4" r="1.7"/><circle class="il-dark" cx="113.5" cy="32.4" r="1.7"/><path class="il-line il-thin" d="M99.3 24.6L105.8 29M110.2 29L116.7 24.6"/><path class="il-white il-ink il-thin" d="M102.5 38.3h10.9v3.7h-10.9z"/><path class="il-line il-thin" d="M102.5 40.1h10.9M106.3 38.3v3.7M109.7 38.3v3.7"/>
    <path class="il-slime il-ink" d="M76 20l-4-8 6 4zM90 18l4-8 1 9z"/>
    <path class="il-purple il-ink il-thin" d="M41 34l-10-10"/><circle class="il-purple il-ink il-thin" cx="30" cy="22" r="4"/>
    <path class="il-orange il-ink il-thin" d="M120 30l10-12"/><circle class="il-orange il-ink il-thin" cx="131" cy="16" r="4"/>
    <rect class="il-wood il-ink" x="36" y="40" width="86" height="66" rx="2"/>
    <path class="il-wood-dark" opacity="0.5" d="M36 40h86v5H36z"/>
    <rect class="il-white il-ink il-thin" x="44" y="56" width="40" height="30" rx="4"/>
    <path class="il-teal il-ink" d="M48 82.4C46.4 61.4 56 60 64 60S81.6 61.4 80 82.4Q64 89.4 48 82.4z"/><path class="il-light il-thin" opacity="0.45" d="M54.4 69.8q1.6 -6.3 7.2 -7.7"/><circle class="il-white il-ink il-thin" cx="57.6" cy="71.3" r="4.3"/><circle class="il-white il-ink il-thin" cx="70.4" cy="71.3" r="4.3"/>
    <circle class="il-dark" cx="57.6" cy="71.3" r="2"/><circle class="il-dark" cx="70.4" cy="71.3" r="2"/><path class="il-line il-thin" d="M53.8 65.5L61.5 61.9M66.5 61.9L74.2 65.5"/><path class="il-line il-thin" d="M57.6 80.2l3.2 -1.9l3.2 1.9l3.2 -1.9l3.2 1.9"/>
    <rect class="il-water" x="44" y="56" width="40" height="30" rx="4" opacity="0.35"/>
    <path class="il-light" d="M48 62l8-4M50 68l14-8"/>
    <path class="il-red il-ink" d="M106 50l3 6 7-2-2 7 6 3-6 3 2 7-7-2-3 6-3-6-7 2 2-7-6-3 6-3-2-7 7 2z"/>
    <path class="il-white il-ink il-thin" d="M106 59v12M100 65h12"/>
    <path class="il-line il-thin" d="M92 92h22M92 97h16"/>
    <path class="il-line il-thin" d="M122 70l6 4-6 3 7 5M134 46l-4 8M136 60l-6 4"/>
    <path class="il-dark il-ink il-thin" d="M123 74l6-2-1 7z"/>
    <circle class="il-slime il-ink il-thin" cx="128" cy="76" r="2.2"/><circle class="il-dark" cx="128.6" cy="76" r="0.9"/>
    <path class="il-line il-thin" d="M30 30l-6-4M148 40l6-3M150 52h6"/>`,

  // An ancient yoghurt cup with a white beard, bushy brows, a sweatband and a walking stick simply keeps jogging on; mould spots, cobweb, lid askew.
  'fd.best-before-1990': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <path class="il-line il-thin" d="M14 2l18 18M14 12q8 0 9 8M14 22q4-6 4-12M22 2q-2 8 6 14"/>
    <path class="il-line il-thin" opacity="0.5" d="M14 6q5 1 6-4M14 16q12-1 13-4"/>
    <ellipse class="il-dark" cx="80" cy="104" rx="36" ry="3" opacity="0.25"/>
    <path class="il-white il-ink" d="M64 100l-4 4h10zM92 100l4 4h-12z"/>
    <path class="il-line" d="M70 92l-4 8M90 92l4 8"/>
    <path class="il-white il-ink" d="M50 34h60l-8 60H58z"/>
    <path class="il-pink il-ink il-thin" d="M51.5 46h57l-1.4 10H52.9z"/>
    <path class="il-pink" opacity="0.6" d="M55 70h50l-1 6H56z"/>
    <circle class="il-slime il-ink il-thin" cx="60" cy="84" r="3"/><circle class="il-slime il-ink il-thin" cx="66" cy="88" r="2"/><circle class="il-slime il-ink il-thin" cx="101" cy="40" r="2.4"/>
    <path class="il-metal il-ink" d="M46 30l64-10 4 6-62 10z"/>
    <path class="il-light il-thin" d="M56 30l20-3"/>
    <path class="il-red il-ink il-thin" d="M51 38h58v5H52z"/>
    <path class="il-line il-thin" d="M58 50h4M66 50h4M74 50h4M82 50h4M90 50h4M98 50h4"/>
    <circle class="il-white il-ink il-thin" cx="74.8" cy="61" r="3.6"/><circle class="il-white il-ink il-thin" cx="85.3" cy="61" r="3.6"/>
    <circle class="il-dark" cx="74.8" cy="61.3" r="1.7"/><circle class="il-dark" cx="85.3" cy="61.3" r="1.7"/><path class="il-line il-thin" d="M71.6 54.5L77.9 55.8M82.1 55.8L88.4 54.5"/><path class="il-dark il-ink il-thin" d="M74.8 66.7h10.5q0 6.3 -5.2 6.3t-5.2 -6.3z"/><path class="il-white" d="M75.4 67.3h9.2v1.7h-9.2z"/>
    <path class="il-beard il-ink" d="M66 66q2 20 14 22 12-2 14-22-6 6-14 6t-14-6z"/>
    <path class="il-line il-thin" d="M74 74q6 4 12 0M76 80q4 3 8 0"/>
    <path class="il-white il-ink" d="M66 54q4-6 10-1-6-1-10 1zM94 54q-4-6-10-1 6-1 10 1z"/>
    <path class="il-line" d="M52 60l-12 8M108 62l10 6"/>
    <circle class="il-white il-ink il-thin" cx="39" cy="69" r="3.4"/>
    <path class="il-wood-dark il-ink" d="M117 66v38h3V66q0-6 5-6v-3q-8 0-8 9z"/>
    <circle class="il-white il-ink il-thin" cx="118.5" cy="68" r="3.4"/>
    <path class="il-line il-thin" d="M30 74h-10M32 82h-14M34 90h-8"/>
    <ellipse class="il-water il-ink il-thin" cx="44" cy="46" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" opacity="0.6" d="M126 96h6M136 100h4"/>`,

  // A garlic bulb in boxing gloves with a fierce scowl; green stink clouds roll off it and a passing fly drops knocked out.
  'fd.extra-garlic': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <ellipse class="il-slime" cx="34" cy="40" rx="16" ry="10" opacity="0.45"/><ellipse class="il-slime" cx="130" cy="34" rx="18" ry="11" opacity="0.45"/>
    <ellipse class="il-slime" cx="132" cy="80" rx="14" ry="8" opacity="0.4"/><ellipse class="il-slime" cx="26" cy="84" rx="13" ry="8" opacity="0.4"/>
    <path class="il-line il-thin" d="M30 60q-6-6 0-12t0-12M20 64q-6-6 0-12M130 62q6-6 0-12t0-12M142 66q6-6 0-12M120 20q-6-5 0-10"/>
    <ellipse class="il-dark" cx="80" cy="104" rx="34" ry="3" opacity="0.25"/>
    <path class="il-line il-thin" d="M70 100l-3 4M76 100v5M84 100v5M90 100l3 4"/>
    <path class="il-beard il-ink" d="M80 26c-6 8-32 18-32 46 0 20 14 30 32 30s32-10 32-30c0-28-26-38-32-46z"/>
    <path class="il-purple" opacity="0.35" d="M58 60q-4 20 10 36-16-8-14-24zM102 60q4 20-10 36 16-8 14-24z"/>
    <path class="il-line il-thin" d="M80 30q-14 20-14 70M80 30q14 20 14 70M80 30v4"/>
    <path class="il-beard il-ink il-thin" d="M80 27q-2-8 4-12-1 6 2 8"/>
    <circle class="il-white il-ink il-thin" cx="73.5" cy="64.7" r="4.4"/><circle class="il-white il-ink il-thin" cx="86.5" cy="64.7" r="4.4"/>
    <circle class="il-dark" cx="73.5" cy="65.5" r="2.1"/><circle class="il-dark" cx="86.5" cy="65.5" r="2.1"/><path class="il-line il-thin" d="M69.6 56.3L77.4 61.5M82.6 61.5L90.4 56.3"/><path class="il-white il-ink il-thin" d="M73.5 72.5h13v4.4h-13z"/><path class="il-line il-thin" d="M73.5 74.7h13M77.9 72.5v4.4M82.1 72.5v4.4"/>
    <path class="il-line" d="M52 74l-10-6M108 74l10-6"/>
    <path class="il-red il-ink" d="M30 58c0-8 14-8 14 0v10c0 4-4 6-7 6s-7-2-7-6z"/>
    <path class="il-red il-ink il-thin" d="M30 62c-5 0-5 6 0 6"/><path class="il-white il-ink il-thin" d="M31 74h12v4H31z"/>
    <path class="il-red il-ink" d="M116 58c0-8 14-8 14 0v10c0 4-4 6-7 6s-7-2-7-6z"/>
    <path class="il-red il-ink il-thin" d="M130 62c5 0 5 6 0 6"/><path class="il-white il-ink il-thin" d="M117 74h12v4h-12z"/>
    <path class="il-line il-thin il-dash" d="M120 14q8 4 10 14"/>
    <g transform="translate(134 32) rotate(160)">
    <ellipse class="il-white il-ink il-thin" cx="-3" cy="-5" rx="3" ry="5" opacity="0.9"/><ellipse class="il-white il-ink il-thin" cx="3" cy="-5" rx="3" ry="5" opacity="0.9"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="0" rx="4" ry="5"/><circle class="il-dark il-ink il-thin" cx="0" cy="6" r="3.4"/>
    <path class="il-light il-thin" d="M-2 5l1.4 1.4M-0.6 5l-1.4 1.4M1 5l1.4 1.4M2.4 5l-1.4 1.4"/></g>
    <path class="il-line il-thin" d="M140 22l3-3M146 30h4M144 38l3 3"/>`,

  // A purple monster sits blissfully in a gravy boat with a napkin bib, knife and fork up, while a jug pours brown gravy over its head.
  'fd.with-gravy': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <g transform="translate(96 4) rotate(30)">
    <path class="il-white il-ink" d="M0 0h26l-2 22H2z"/><path class="il-white il-ink" d="M26 4q8 0 7 8t-8 6"/>
    <path class="il-white il-ink il-thin" d="M0 0l-6 4 4 3"/><path class="il-red" d="M2 8h22v3H2z"/></g>
    <path class="il-wood-dark il-ink il-thin" d="M95 5q-8 8-10 34h7q0-22 7-30z"/>
    <path class="il-white il-ink il-thin" d="M69 42l-5.5 -12.7 12.7 5.5zM91 42l5.5 -12.7 -12.7 5.5z"/><path class="il-purple il-ink" d="M58 70C55.8 40 69 38 80 38S104.2 40 102 70Q80 80 58 70z"/><path class="il-light il-thin" opacity="0.45" d="M66.8 52q2.2 -9 9.9 -11"/><path class="il-line il-thin" d="M65.5 56q5.5 -7.3 10.9 0M83.6 56q5.5 -7.3 10.9 0"/><path class="il-dark il-ink il-thin" d="M70.9 64.2h18.2q0 10.9 -9.1 10.9t-9.1 -10.9z"/><path class="il-pink il-ink il-thin" d="M80 68.7q7.3 -1.8 7.3 5.5q-3.6 3.6 -7.3 0z"/>
    <g transform="translate(0 -5)"><path class="il-wood-dark il-ink il-thin" d="M66 42q6-8 18-6 10 0 12 8-2 4-2 10-3-4-4 0-3 6-5 0-4 4-6-2-4 4-6-2-4-1-7 0z"/>
    <path class="il-light il-thin" d="M76 40q6-2 10 0"/>
    <path class="il-wood-dark il-ink il-thin" d="M96 52q2 6 0 8-3-2 0-8zM62 48q-2 6 0 8 3-2 0-8z"/>
    </g>
    <path class="il-white il-ink il-thin" d="M66 70l14 6 14-6-2 8-12 6-12-6z"/>
    <path class="il-red" d="M70 72l4 2v4l-4-2zM86 74l4-2v4l-4 2z" opacity="0.8"/>
    <path class="il-metal il-ink il-thin" d="M50 46v24M47 46v8q0 3 3 3t3-3v-8"/>
    <path class="il-metal il-ink il-thin" d="M110 46q6 4 0 14v10"/>
    <circle class="il-purple il-ink il-thin" cx="50" cy="68" r="4"/><circle class="il-purple il-ink il-thin" cx="110" cy="68" r="4"/>
    <path class="il-white il-ink" d="M30 78h88l12-8 2 4-10 10q-8 18-36 18H62q-24 0-30-18z"/>
    <path class="il-wood-dark" d="M34 80h84q-4 3-8 3H44q-6 0-10-3z"/>
    <path class="il-white il-ink" d="M34 84q-12-2-12 6t10 6" />
    <path class="il-light il-thin" d="M44 90q10 6 30 6"/>
    <path class="il-white il-ink il-thin" d="M58 102h44l-4 4H62z"/>
    <path class="il-line il-thin" d="M124 60q-3-5 0-10M132 64q-3-5 0-10M28 64q-3-5 0-10"/>`,

  // The light version: a sulky little monster half its former size stands on a kitchen scale, arms crossed and fuming, inside the dashed outline of its old round self.
  'fd.diet-version': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <path class="il-line il-dash" opacity="0.55" d="M36 100C26 50 50 14 80 14s54 36 44 86z"/>
    <path class="il-line il-dash" opacity="0.55" d="M54 14l-8-12 16 8M106 14l8-12-16 8"/>
    <rect class="il-white il-ink" x="56" y="92" width="48" height="12" rx="3"/>
    <rect class="il-metal il-ink il-thin" x="70" y="95" width="20" height="6" rx="2"/><path class="il-line il-thin" d="M80 101l4-5"/>
    <path class="il-teal il-ink" d="M70 92v-6h5v6zM85 92v-6h5v6z"/>
    <path class="il-white il-ink il-thin" d="M70 62l-5-9 9 4zM90 62l5-9-9 4z"/>
    <ellipse class="il-teal il-ink" cx="80" cy="74" rx="17" ry="15"/>
    <path class="il-red il-ink il-thin" d="M64 66q16-6 32 0l0.6 4q-16.6-6-33.2 0z"/>
    <path class="il-light il-thin" opacity="0.5" d="M68 80q-2-6 2-10"/>
    <circle class="il-white il-ink il-thin" cx="76" cy="74.2" r="2.7"/><circle class="il-white il-ink il-thin" cx="84" cy="74.2" r="2.7"/>
    <circle class="il-dark" cx="76" cy="74.7" r="1.3"/><circle class="il-dark" cx="84" cy="74.7" r="1.3"/><path class="il-line il-thin" d="M73.6 69L78.4 72.2M81.6 72.2L86.4 69"/><path class="il-line il-thin" d="M76.8 80.6q3.2 -2.4 6.4 0"/>
    <path class="il-teal il-ink" d="M65 79q15 6 30 0l-2 5q-13 4-26 0z"/>
    <path class="il-line il-thin" d="M72 81l16 2M88 81l-16 2"/>
    <path class="il-line il-thin" d="M66 54q-4-4 0-8t0-8M80 50q-4-4 0-8t0-8M94 54q4-4 0-8t0-8"/>
    <path class="il-line il-thin" d="M136 34l-6 4M140 46h-8M24 34l6 4M20 46h8"/>
    <path class="il-white il-ink il-thin" d="M126 92h18v12h-18z"/><path class="il-green" d="M127 98h16v5h-16z"/><path class="il-line il-thin" d="M130 95h10"/>`,

  // In the freezer drawer a monster snoozes inside a block of ice, nightcap on, head on a bag of frozen peas, zigzag snores rising.
  'fd.cold-sleep': `
    <rect class="il-water" x="0" y="0" width="160" height="120"/>
    <rect class="il-white" x="0" y="0" width="160" height="120" opacity="0.45"/>
    <path class="il-light il-thin" opacity="0.7" d="M0 30h160M0 60h160M0 90h160"/>
    <path class="il-white il-ink il-thin" d="M0 0h160v8q-6 5-10 0-4 7-9 1-4 4-8 0l-3 10-3-9q-6 4-10-1-5 5-10 0l-2 8-3-8q-7 4-12-1-5 3-9-1l-3 12-3-11q-6 4-11 0-5 4-9-1l-2 7-3-7q-6 3-11-1-5 5-9 0l-3 9-2-9q-6 3-10-1-5 4-9 0-4 5-8 0l-2 8-3-9V0z"/>
    <rect class="il-white il-ink il-thin" x="0" y="104" width="160" height="16"/>
    <path class="il-water" opacity="0.4" d="M0 108h160v12H0z"/>
    <path class="il-light" d="M10 107h30M100 107h40"/>
    <path class="il-light il-thin" d="M20 29v10M15.7 31.5l8.7 5M15.7 36.5l8.7 -5"/><path class="il-light il-thin" d="M140 26v8M136.5 28l6.9 4M136.5 32l6.9 -4"/><path class="il-light il-thin" d="M146 67v6M143.4 68.5l5.2 3M143.4 71.5l5.2 -3"/>
    <path class="il-green il-ink" d="M18 86q-2-12 10-14l24 2q8 4 6 14-2 10-14 12l-20-2q-8-2-6-12z"/>
    <path class="il-white il-ink il-thin" d="M26 82h20v8H26z"/><circle class="il-green il-ink il-thin" cx="31" cy="86" r="2"/><circle class="il-green il-ink il-thin" cx="36" cy="86" r="2"/><circle class="il-green il-ink il-thin" cx="41" cy="86" r="2"/>
    <path class="il-white il-ink il-thin" d="M18 76l2-2 2 2M54 76l2-2 2 2"/>
    <path class="il-orange il-ink" d="M58 85.2C55.2 52.2 72 50 86 50S116.8 52.2 114 85.2Q86 96.2 58 85.2z"/><path class="il-light il-thin" opacity="0.45" d="M69.2 65.4q2.8 -9.9 12.6 -12.1"/><path class="il-line il-thin" d="M70 67.8q6 6 12 0M90 67.8q6 6 12 0"/><ellipse class="il-dark" cx="86" cy="82.8" rx="3.2" ry="2.4"/>
    <path class="il-orange il-ink" d="M58 90q-8-6-2-12 6 0 6 8z"/>
    <path class="il-blue il-ink" d="M62 52q14-16 40-8l16-6q-2 10-8 14-20-8-48 0z"/>
    <circle class="il-white il-ink il-thin" cx="120" cy="36" r="4"/>
    <path class="il-white il-ink il-thin" d="M62 52q22-6 48 0v4q-24-6-48 0z"/>
    <rect class="il-water il-ink" x="48" y="38" width="80" height="62" rx="5" opacity="0.5"/>
    <path class="il-light" d="M54 46l10-4M54 56l6-6M120 90l4-8"/>
    <path class="il-water il-ink il-thin" d="M60 100l2 6 2-6M80 100l2 8 2-8M110 100l2 5 2-5"/>
    <path class="il-line il-thin" d="M108 30l6 0-6 6h6M118 18l8 0-8 8h8M130 6l10 0-10 10h10"/>`,

  // A tiny explorer lifts away a jam jar and turns round in shock: right behind it sits a huge fuzzy mould monster with three eyes, and further back in the dark another pair of eyes.
  'fd.something-behind': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="100" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 100h160M0 105h160"/>
    <path class="il-light il-thin" d="M16 102.5h40M92 102.5h18"/><rect class="il-metal" x="0" y="105" width="160" height="15" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 110h40"/>
    <rect class="il-dark" x="58" y="6" width="90" height="94" opacity="0.18" rx="6"/>
    <circle class="il-glow il-ink il-thin" cx="136" cy="20" r="2.6"/><circle class="il-glow il-ink il-thin" cx="144" cy="20" r="2.6"/>
    <path class="il-slime il-ink" d="M72 98c-6-2-8-10-4-14-6-4-4-12 2-14-4-6 0-14 6-14-2-8 6-14 12-10 2-8 12-10 16-4 6-6 16-2 16 6 8-2 14 6 10 12 6 2 8 10 2 14 6 4 4 12-2 14 4 6-2 12-8 10z"/>
    <circle class="il-green" cx="84" cy="88" r="4" opacity="0.6"/><circle class="il-green" cx="130" cy="64" r="3.4" opacity="0.6"/><circle class="il-green" cx="96" cy="46" r="2.6" opacity="0.6"/><circle class="il-green" cx="124" cy="90" r="2.4" opacity="0.6"/>
    <circle class="il-white il-ink il-thin" cx="96" cy="62" r="6"/><circle class="il-white il-ink il-thin" cx="114" cy="58" r="7"/><circle class="il-white il-ink il-thin" cx="106" cy="46" r="4.4"/>
    <circle class="il-dark" cx="94" cy="63" r="2.6"/><circle class="il-dark" cx="112" cy="59" r="3"/><circle class="il-dark" cx="104.6" cy="47" r="2"/>
    <path class="il-dark il-ink il-thin" d="M90 74q16 14 32 0z"/><path class="il-white il-ink il-thin" d="M94 74l3 5 3-5zM110 74l3 5 3-5zM102 74l3 4 3-4z"/>
    <path class="il-line il-thin" d="M88 54l10 2M120 50l-6 3"/>
    <ellipse class="il-line il-thin" cx="62" cy="99" rx="8" ry="1.6" opacity="0.6"/>
    <g transform="translate(34 100) scale(-0.62 0.62)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-orange il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(10 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.9" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.9" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.6L-1.9 -87.6M1.9 -87.6L7.6 -85.6"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="-72.8" rx="2.3" ry="3"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-wood-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(70)"><rect class="il-orange il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><g transform="translate(-28.9 -53.8)"><rect class="il-white il-ink" x="-8" y="-8" width="16" height="20" rx="3.5"/>
    <rect class="il-red" x="-6" y="-4" width="12" height="14" rx="2.4"/>
    <path class="il-light il-thin" d="M-4.5 -3v9"/><rect class="il-paper il-ink il-thin" x="-5.5" y="1" width="11" height="5.6" rx="1"/><path class="il-line il-thin" d="M-3 3.4h6"/><path class="il-red il-ink il-thin" d="M-11 -6q11 -8 22 0l-3 3q-8 3 -16 0z"/>
    <path class="il-light il-thin" d="M-4 -10v4M0 -11v5M4 -10v4M-9 -7h18"/>
    <path class="il-line il-thin" d="M-8 -4h16"/></g><circle class="il-skin il-ink il-thin" cx="-28.9" cy="-53.8" r="4.2"/>
    <g transform="translate(12 -60) rotate(-40)"><rect class="il-orange il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="23.6" cy="-46.2" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M44 32l4-6M50 38l6-3M38 30v-6"/>`,

  // The fridge door has been open too long: the alarm light beeps and blinks while monsters from the far back march out in single file past the startled person holding the door.
  'fd.door-open-too-long': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v100M32 0v100M48 0v100M64 0v100M80 0v100M96 0v100M112 0v100M128 0v100M144 0v100M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 100h160M20 100l-8 20M60 100l-3 20M100 100l3 20M140 100l8 20M0 109h160"/>
    <path class="il-line" d="M0 100h160"/>
    <rect class="il-white il-ink" x="60" y="8" width="74" height="94" rx="4"/>
    <rect class="il-glow" x="65" y="13" width="64" height="85" opacity="0.5"/>
    <rect class="il-dark" x="70" y="16" width="54" height="26" opacity="0.3"/>
    <path class="il-line il-thin" d="M65 44h64M65 70h64"/>
    <path class="il-water" opacity="0.6" d="M65 44h64v2H65zM65 70h64v2H65z"/>
    <circle class="il-glow il-ink il-thin" cx="86" cy="30" r="3"/><circle class="il-glow il-ink il-thin" cx="94" cy="30" r="3"/><circle class="il-dark" cx="86" cy="31" r="1.3"/><circle class="il-dark" cx="94" cy="31" r="1.3"/>
    <circle class="il-glow il-ink il-thin" cx="112" cy="26" r="2"/><circle class="il-glow il-ink il-thin" cx="118" cy="26" r="2"/>
    <path class="il-white il-ink il-thin" d="M94.5 52.8l-2.5 -5.7 5.7 2.5zM105.5 52.8l2.5 -5.7 -5.7 2.5z"/><path class="il-purple il-ink" d="M89 65.4C87.9 51.9 94.5 51 100 51S112.1 51.9 111 65.4Q100 69.9 89 65.4z"/><path class="il-light il-thin" opacity="0.45" d="M93.4 57.3q1.1 -4 5 -4.9"/><circle class="il-white il-ink il-thin" cx="95.9" cy="58.3" r="2.8"/><circle class="il-white il-ink il-thin" cx="104.1" cy="58.3" r="2.8"/>
    <circle class="il-dark" cx="95.9" cy="58.5" r="1.3"/><circle class="il-dark" cx="104.1" cy="58.5" r="1.3"/><path class="il-line il-thin" d="M93.5 53.3L98.4 54.3M101.6 54.3L106.5 53.3"/><path class="il-dark il-ink il-thin" d="M95.9 62.8h8.2q0 4.9 -4.1 4.9t-4.1 -4.9z"/><path class="il-white" d="M96.4 63.2h7.2v1.3h-7.2z"/>
    <path class="il-white il-ink il-thin" d="M72 70v-10h10v10zM118 44v-12h8v12z"/>
    <path class="il-slime il-ink" d="M108 93.4C107 79.9 113 79 118 79S129 79.9 128 93.4Q118 97.9 108 93.4z"/><path class="il-light il-thin" opacity="0.45" d="M112 85.3q1 -4 4.5 -4.9"/><circle class="il-dark" cx="124" cy="88.9" r="1.1" opacity="0.5"/><circle class="il-dark" cx="111.5" cy="91.2" r="0.9" opacity="0.5"/><circle class="il-white il-ink il-thin" cx="113.9" cy="86.3" r="2.8"/><circle class="il-white il-ink il-thin" cx="122.1" cy="86.3" r="2.8"/>
    <circle class="il-dark" cx="113.9" cy="86.5" r="1.3"/><circle class="il-dark" cx="122.1" cy="86.5" r="1.3"/><path class="il-line il-thin" d="M111.5 82.2q2.5 -1.6 4.9 0M119.6 82.2q2.5 -1.6 4.9 0"/><path class="il-line il-thin" d="M114.7 91.2q3.3 3.3 6.5 0"/>
    <path class="il-slime il-ink il-thin" d="M112 96l-2 4M124 96l2 4"/>
    <path class="il-orange il-ink" d="M136 97.4C135 83.9 141 83 146 83S157 83.9 156 97.4Q146 101.9 136 97.4z"/><path class="il-light il-thin" opacity="0.45" d="M140 89.3q1 -4 4.5 -4.9"/><circle class="il-white il-ink il-thin" cx="141.9" cy="90.3" r="2.8"/><circle class="il-white il-ink il-thin" cx="150.1" cy="90.3" r="2.8"/>
    <circle class="il-dark" cx="141.9" cy="90.8" r="1.3"/><circle class="il-dark" cx="150.1" cy="90.8" r="1.3"/><path class="il-line il-thin" d="M139.5 85L144.4 88.2M147.6 88.2L152.5 85"/><path class="il-white il-ink il-thin" d="M141.9 95.2h8.2v2.8h-8.2z"/><path class="il-line il-thin" d="M141.9 96.6h8.2M144.7 95.2v2.8M147.3 95.2v2.8"/>
    <path class="il-orange il-ink il-thin" d="M140 100l-2 3M152 100l2 3"/>
    <path class="il-white il-ink" d="M60 8L36 18v82l24 2z"/>
    <path class="il-line il-thin" d="M40 34l18-4M40 58l18-2M40 82l18-1"/>
    <rect class="il-yellow il-ink il-thin" x="44" y="24" width="6" height="8" rx="1"/><rect class="il-white il-ink il-thin" x="51" y="20" width="6" height="11" rx="1"/>
    <circle class="il-red il-ink il-thin" cx="132" cy="4" r="3.4"/>
    <path class="il-line il-thin" d="M124 2a10 10 0 0 0 0 6M140 2a10 10 0 0 1 0 6M120 0a16 16 0 0 0 0 10M144 0a16 16 0 0 1 0 10"/>
    <path class="il-red il-ink il-thin" d="M150 12l2 8-2 0zM155 10l1 6-1.6 0z"/>
    <g transform="translate(20 112) scale(0.66 0.66)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-green il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.9" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.9" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.6L-1.9 -87.6M1.9 -87.6L7.6 -85.6"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="-72.8" rx="2.3" ry="3"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(20)"><rect class="il-green il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-18.2" cy="-43.1" r="4.2"/>
    <g transform="translate(12 -60) rotate(-78)"><rect class="il-green il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="29.6" cy="-56.3" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M14 34l-4-4M22 30v-6M30 34l4-4"/>`,

  // A red shopping basket on the counter overflows with cheerful fresh food: a lettuce, a milk carton, a tomato and a cheese wedge wave hello, a receipt curls out.
  'fd.full-shopping-basket': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v92M32 0v92M48 0v92M64 0v92M80 0v92M96 0v92M112 0v92M128 0v92M144 0v92M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160"/>
    <rect class="il-stone" x="0" y="92" width="160" height="28"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 92h160M20 92l-8 28M60 92l-3 28M100 92l3 28M140 92l8 28M0 101h160"/>
    <path class="il-line" d="M0 92h160"/>
    <rect class="il-wood il-ink" x="0" y="92" width="160" height="28"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 100h160M40 92v28M120 92v28"/>
    <path class="il-line il-thick" d="M30 62q-16-30 14-38M130 62q16-30-14-38"/>
    <g transform="translate(0 -8)"><circle class="il-green il-ink" cx="48" cy="52" r="18"/>
    <path class="il-grass il-ink il-thin" d="M34 40q6-4 8 2 4-6 8-2 4-5 8 0M32 62q4 2 6 0M58 62q4 2 6-2"/>
    <circle class="il-white il-ink il-thin" cx="43.5" cy="51.1" r="3.1"/><circle class="il-white il-ink il-thin" cx="52.5" cy="51.1" r="3.1"/>
    <circle class="il-dark" cx="43.5" cy="51.4" r="1.4"/><circle class="il-dark" cx="52.5" cy="51.4" r="1.4"/><path class="il-line il-thin" d="M40.8 46.6q2.7 -1.8 5.4 0M49.8 46.6q2.7 -1.8 5.4 0"/><path class="il-line il-thin" d="M44.4 56.5q3.6 3.6 7.2 0"/>
    <path class="il-white il-ink" d="M66 66V30l9-10 9 10v36z"/>
    <path class="il-white il-ink il-thin" d="M66 30h18l-9-10z"/><path class="il-blue il-ink il-thin" d="M66 46h18v10H66z"/>
    <circle class="il-white il-ink il-thin" cx="71.3" cy="37.3" r="2.6"/><circle class="il-white il-ink il-thin" cx="78.8" cy="37.3" r="2.6"/>
    <circle class="il-dark" cx="71.3" cy="37.5" r="1.2"/><circle class="il-dark" cx="78.8" cy="37.5" r="1.2"/><path class="il-line il-thin" d="M69 32.7L73.5 33.6M76.5 33.6L81 32.7"/><path class="il-dark il-ink il-thin" d="M71.3 41.4h7.5q0 4.5 -3.7 4.5t-3.7 -4.5z"/><path class="il-white" d="M71.7 41.8h6.6v1.2h-6.6z"/>
    <path class="il-line il-thin" d="M84 40l8-8"/><circle class="il-white il-ink il-thin" cx="93" cy="31" r="2.6"/>
    <path class="il-yellow il-ink" d="M118 66V48l26 14v4z"/><path class="il-gold il-ink il-thin" d="M118 48l26 14h-6l-20-10z"/>
    <circle class="il-gold" cx="126" cy="60" r="2"/><circle class="il-gold" cx="134" cy="63" r="1.4"/>
    <circle class="il-red il-ink" cx="102" cy="52" r="14"/>
    <path class="il-green il-ink il-thin" d="M102 38l-5-4 5 1 1-5 2 5 5-1-4 4z"/>
    <path class="il-light il-thin" d="M93 46q2-4 6-5"/>
    <circle class="il-white il-ink il-thin" cx="98" cy="53.2" r="2.7"/><circle class="il-white il-ink il-thin" cx="106" cy="53.2" r="2.7"/>
    <circle class="il-dark" cx="98" cy="53.4" r="1.3"/><circle class="il-dark" cx="106" cy="53.4" r="1.3"/><path class="il-line il-thin" d="M95.6 49.2q2.4 -1.6 4.8 0M103.6 49.2q2.4 -1.6 4.8 0"/><path class="il-line il-thin" d="M98.8 58q3.2 3.2 6.4 0"/>
    </g>
    <path class="il-red il-ink" d="M26 64h108l-8 34H34z"/>
    <path class="il-red il-ink" d="M24 60h112v6H24z"/>
    <path class="il-dark" opacity="0.4" d="M38 72h8v6h-8zM52 72h8v6h-8zM66 72h8v6h-8zM80 72h8v6h-8zM94 72h8v6h-8zM108 72h8v6h-8zM122 72h4v6h-4zM40 84h8v6h-8zM54 84h8v6h-8zM68 84h8v6h-8zM82 84h8v6h-8zM96 84h8v6h-8zM110 84h8v6h-8z"/>
    <path class="il-paper il-ink il-thin" d="M134 76q16-2 14 10t10 10l-2 4q-14-2-12-12t-10-8z"/>
    <path class="il-line il-thin" d="M140 82h4M143 90h4M148 98h4"/>
    <path class="il-yellow il-ink il-thin" d="M20 26q0.8 3.2 4 4q-3.2 0.8 -4 4q-0.8 -3.2 -4 -4q3.2 -0.8 4 -4z"/><path class="il-yellow il-ink il-thin" d="M146 19q1 4 5 5q-4 1 -5 5q-1 -4 -5 -5q4 -1 5 -5z"/><path class="il-yellow il-ink il-thin" d="M62 9q0.6 2.4 3 3q-2.4 0.6 -3 3q-0.6 -2.4 -3 -3q2.4 -0.6 3 -3z"/>`,

  // Grandma’s pantry: shelves of preserve jars with checked cloth lids from five decades, cobwebs and dust; one jar glows golden, another has eyes looking out.
  'fd.grandmas-pantry': `
    <rect class="il-wood-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 20h160M0 64h160M0 108h160M30 0v20M90 0v20M60 20v44M120 20v44M40 64v44M100 64v44"/>
    <path class="il-line il-thin" d="M0 0l14 14M0 8q8 0 8 6M6 0q0 8 8 8M0 14q4-4 0-8"/>
    <path class="il-line il-thin" d="M160 0l-16 16M160 8q-9 0-9 8M152 0q0 8-8 8"/>
    <rect class="il-white il-ink" x="9" y="28" width="18" height="26" rx="4"/>
    <rect class="il-red" x="11" y="33.2" width="14" height="18.8" rx="2.7"/>
    <path class="il-light il-thin" d="M12.5 33v11.7"/><rect class="il-paper il-ink il-thin" x="11.5" y="39.7" width="13" height="7.3" rx="1"/><path class="il-line il-thin" d="M14 42.8h8"/><path class="il-red il-ink il-thin" d="M6 30q12 -8 24 0l-3 3q-9 3 -18 0z"/>
    <path class="il-light il-thin" d="M13.5 26v4M18 25v5M22.5 26v4M8 29h20"/>
    <path class="il-line il-thin" d="M9 32h18"/>
    <rect class="il-white il-ink" x="34" y="22" width="16" height="32" rx="3.5"/>
    <rect class="il-orange" x="36" y="28.4" width="12" height="23.6" rx="2.4"/>
    <path class="il-light il-thin" d="M37.5 27v14.4"/><path class="il-red il-ink il-thin" d="M31 24q11 -8 22 0l-3 3q-8 3 -16 0z"/>
    <path class="il-light il-thin" d="M38 20v4M42 19v5M46 20v4M33 23h18"/>
    <path class="il-line il-thin" d="M34 26h16"/>
    <rect class="il-white il-ink" x="56" y="30" width="20" height="24" rx="4.4"/>
    <rect class="il-green" x="58" y="34.8" width="16" height="17.2" rx="3"/>
    <path class="il-light il-thin" d="M59.5 35v10.8"/><rect class="il-paper il-ink il-thin" x="58.5" y="40.8" width="15" height="6.7" rx="1"/><path class="il-line il-thin" d="M61 43.7h10"/><path class="il-red il-ink il-thin" d="M53 32q13 -8 26 0l-3 3q-10 3 -20 0z"/>
    <path class="il-light il-thin" d="M61 28v4M66 27v5M71 28v4M55 31h22"/>
    <path class="il-line il-thin" d="M56 34h20"/>
    <circle class="il-grass il-ink il-thin" cx="62" cy="44" r="3"/><circle class="il-grass il-ink il-thin" cx="70" cy="40" r="3"/><circle class="il-grass il-ink il-thin" cx="66" cy="49" r="3"/>
    <rect class="il-white il-ink" x="83" y="24" width="18" height="30" rx="4"/>
    <rect class="il-purple" x="85" y="30" width="14" height="22" rx="2.7"/>
    <path class="il-light il-thin" d="M86.5 29v13.5"/><path class="il-red il-ink il-thin" d="M80 26q12 -8 24 0l-3 3q-9 3 -18 0z"/>
    <path class="il-light il-thin" d="M87.5 22v4M92 21v5M96.5 22v4M82 25h20"/>
    <path class="il-line il-thin" d="M83 28h18"/>
    <rect class="il-white il-ink" x="108" y="32" width="16" height="22" rx="3.5"/>
    <rect class="il-pink" x="110" y="36.4" width="12" height="15.6" rx="2.4"/>
    <path class="il-light il-thin" d="M111.5 37v9.9"/><rect class="il-paper il-ink il-thin" x="110.5" y="41.9" width="11" height="6.2" rx="1"/><path class="il-line il-thin" d="M113 44.5h6"/><path class="il-red il-ink il-thin" d="M105 34q11 -8 22 0l-3 3q-8 3 -16 0z"/>
    <path class="il-light il-thin" d="M112 30v4M116 29v5M120 30v4M107 33h18"/>
    <path class="il-line il-thin" d="M108 36h16"/>
    <rect class="il-white il-ink" x="131" y="26" width="18" height="28" rx="4"/>
    <rect class="il-red" x="133" y="31.6" width="14" height="20.4" rx="2.7"/>
    <path class="il-light il-thin" d="M134.5 31v12.6"/><path class="il-red il-ink il-thin" d="M128 28q12 -8 24 0l-3 3q-9 3 -18 0z"/>
    <path class="il-light il-thin" d="M135.5 24v4M140 23v5M144.5 24v4M130 27h20"/>
    <path class="il-line il-thin" d="M131 30h18"/>
    <rect class="il-stone" x="133" y="22" width="18" height="32" opacity="0.6" rx="4"/>
    <path class="il-line il-thin" d="M134 26l14 10M134 36q6-2 8-10"/>
    <rect class="il-wood il-ink" x="0" y="54" width="160" height="6"/>
    <path class="il-line il-thin" d="M8 60l4 6M152 60l-4 6"/>
    <rect class="il-white il-ink" x="10" y="76" width="20" height="30" rx="4.4"/>
    <rect class="il-orange" x="12" y="82" width="16" height="22" rx="3"/>
    <path class="il-light il-thin" d="M13.5 81v13.5"/><rect class="il-paper il-ink il-thin" x="12.5" y="89.5" width="15" height="8.4" rx="1"/><path class="il-line il-thin" d="M15 93.1h10"/><path class="il-red il-ink il-thin" d="M7 78q13 -8 26 0l-3 3q-10 3 -20 0z"/>
    <path class="il-light il-thin" d="M15 74v4M20 73v5M25 74v4M9 77h22"/>
    <path class="il-line il-thin" d="M10 80h20"/>
    <rect class="il-white il-ink" x="37" y="82" width="18" height="24" rx="4"/>
    <rect class="il-slime" x="39" y="86.8" width="14" height="17.2" rx="2.7"/>
    <path class="il-light il-thin" d="M40.5 87v10.8"/><path class="il-red il-ink il-thin" d="M34 84q12 -8 24 0l-3 3q-9 3 -18 0z"/>
    <path class="il-light il-thin" d="M41.5 80v4M46 79v5M50.5 80v4M36 83h20"/>
    <path class="il-line il-thin" d="M37 86h18"/>
    <circle class="il-white il-ink il-thin" cx="42" cy="94" r="3"/><circle class="il-white il-ink il-thin" cx="50" cy="94" r="3"/><circle class="il-dark" cx="43" cy="94.6" r="1.4"/><circle class="il-dark" cx="51" cy="94.6" r="1.4"/>
    <ellipse class="il-glow" cx="84" cy="88" rx="24" ry="24" opacity="0.4"/>
    <rect class="il-white il-ink" x="72" y="72" width="24" height="34" rx="5.3"/>
    <rect class="il-gold" x="74" y="78.8" width="20" height="25.2" rx="3.6"/>
    <path class="il-light il-thin" d="M75.5 77v15.3"/><rect class="il-paper il-ink il-thin" x="74.5" y="87.3" width="19" height="9.5" rx="1"/><path class="il-line il-thin" d="M77 91.4h14"/><path class="il-red il-ink il-thin" d="M69 74q15 -8 30 0l-3 3q-12 3 -24 0z"/>
    <path class="il-light il-thin" d="M78 70v4M84 69v5M90 70v4M71 73h26"/>
    <path class="il-line il-thin" d="M72 76h24"/>
    <path class="il-light" d="M78 80v14"/>
    <path class="il-yellow il-ink il-thin" d="M66 66q0.8 3.2 4 4q-3.2 0.8 -4 4q-0.8 -3.2 -4 -4q3.2 -0.8 4 -4z"/><path class="il-yellow il-ink il-thin" d="M102 69q1 4 5 5q-4 1 -5 5q-1 -4 -5 -5q4 -1 5 -5z"/><path class="il-yellow il-ink il-thin" d="M98 93q0.6 2.4 3 3q-2.4 0.6 -3 3q-0.6 -2.4 -3 -3q2.4 -0.6 3 -3z"/>
    <rect class="il-white il-ink" x="110" y="80" width="16" height="26" rx="3.5"/>
    <rect class="il-red" x="112" y="85.2" width="12" height="18.8" rx="2.4"/>
    <path class="il-light il-thin" d="M113.5 85v11.7"/><path class="il-red il-ink il-thin" d="M107 82q11 -8 22 0l-3 3q-8 3 -16 0z"/>
    <path class="il-light il-thin" d="M114 78v4M118 77v5M122 78v4M109 81h18"/>
    <path class="il-line il-thin" d="M110 84h16"/>
    <rect class="il-white il-ink" x="132" y="84" width="20" height="22" rx="4.4"/>
    <rect class="il-teal" x="134" y="88.4" width="16" height="15.6" rx="3"/>
    <path class="il-light il-thin" d="M135.5 89v9.9"/><rect class="il-paper il-ink il-thin" x="134.5" y="93.9" width="15" height="6.2" rx="1"/><path class="il-line il-thin" d="M137 96.5h10"/><path class="il-red il-ink il-thin" d="M129 86q13 -8 26 0l-3 3q-10 3 -20 0z"/>
    <path class="il-light il-thin" d="M137 82v4M142 81v5M147 82v4M131 85h22"/>
    <path class="il-line il-thin" d="M132 88h20"/>
    <rect class="il-wood il-ink" x="0" y="106" width="160" height="6"/>
    <path class="il-dark" opacity="0.4" d="M0 112h160v8H0z"/>`,

  // At night someone in pyjamas and nightcap peeks into the gap of the fridge door, eyes wide: is the light really off? Curved arrows show the door going open-shut-open.
  'fd.is-the-light-off': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.08" d="M16 0v100M32 0v100M48 0v100M64 0v100M80 0v100M96 0v100M112 0v100M128 0v100M144 0v100M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-dark" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" opacity="0.5" d="M0 100h160M20 100l-8 20M60 100l-3 20M100 100l3 20M140 100l8 20M0 109h160"/>
    <path class="il-line" d="M0 100h160"/>
    <rect class="il-sky il-ink il-thin" x="8" y="12" width="30" height="26" rx="1"/><circle class="il-white" cx="28" cy="22" r="5"/><circle class="il-sky" cx="30" cy="20" r="4.4"/>
    <path class="il-line il-thin" d="M23 12v26M8 25h30"/>
    <path class="il-glow" opacity="0.45" d="M88 30L88 100 46 120h40l4-20z"/>
    <rect class="il-metal il-ink" x="88" y="12" width="62" height="90" rx="4"/>
    <path class="il-white il-ink" d="M86 12l60 2v88l-60 -2z" transform="rotate(-3 146 60)"/>
    <path class="il-line il-thin" d="M92 42l52 0" transform="rotate(-3 146 60)"/>
    <rect class="il-metal il-ink il-thin" x="93" y="20" width="4" height="14" rx="2"/><rect class="il-metal il-ink il-thin" x="93" y="50" width="4" height="20" rx="2"/>
    <path class="il-glow il-ink il-thin" d="M84 14l6 0 1 86h-6z"/><path class="il-glow" opacity="0.5" d="M84 24l-16-6v8zM84 50l-20 0v6zM84 76l-16 6v-8z"/>
    <path class="il-light il-thick" d="M100 9q18-10 36 0M136 9l-7-1M136 9l-1-7M100 9l7-1M100 9l1-7"/>
    <path class="il-yellow il-ink il-thin" d="M118 0h6v4h-6z" opacity="0.8"/>
    <g transform="translate(60 112) scale(-0.82 0.82)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-teal il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-teal il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-10 -56h20M-12 -46h24M-12 -26h-0M-10 -30h20M-12 -14h8M4 -14h8"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(-14 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-5.9" cy="-79.7" r="1.5"/><circle class="il-dark" cx="3.6" cy="-79.7" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.2L-1.9 -85.2M1.9 -85.2L7.6 -85.2"/><path class="il-line il-thin" d="M-2.8 -73.3h5.7"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-blue il-ink" d="M-14 -84q0-18 16-18 10 0 22 12l-4 4q-8-6-14-4 6 4 8 8z"/><circle class="il-white il-ink il-thin" cx="22" cy="-86" r="3.4"/><path class="il-white il-ink il-thin" d="M-15 -86q15-5 28 0v4q-14-4-28 0z"/></g>
    <g transform="translate(-12 -60) rotate(70)"><rect class="il-teal il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-28.9" cy="-53.8" r="4.2"/>
    <g transform="translate(12 -60) rotate(30)"><rect class="il-teal il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="3" cy="-44.4" r="4.2"/>
    </g>
    <path class="il-light il-thin" d="M36 30q0-6 5-6t4 5-4 4v3M41 41v1M48 22q0-5 4-5t4 4-4 4v3M52 32v1"/>`,

  // Forgot the shopping: every shelf of the fridge is packed with mustard jars and nothing else; a tiny person holds up an empty plate, one jar grins.
  'fd.forgot-shopping': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="38" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 38h160M0 43h160"/>
    <path class="il-light il-thin" d="M16 40.5h40M92 40.5h18"/><rect class="il-water" x="0" y="70" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 70h160M0 75h160"/>
    <path class="il-light il-thin" d="M16 72.5h40M92 72.5h18"/><rect class="il-water" x="0" y="102" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 102h160M0 107h160"/>
    <path class="il-light il-thin" d="M16 104.5h40M92 104.5h18"/><rect class="il-metal" x="0" y="107" width="160" height="13" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 112h40"/>
    <rect class="il-white il-ink" x="15" y="20" width="14" height="18" rx="3.1"/>
    <rect class="il-yellow" x="17" y="23.6" width="10" height="12.4" rx="2.1"/>
    <path class="il-light il-thin" d="M18.5 25v8.1"/><rect class="il-paper il-ink il-thin" x="17.5" y="28.1" width="9" height="5" rx="1"/><path class="il-line il-thin" d="M20 30.3h4"/><rect class="il-red il-ink il-thin" x="16" y="16" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="33" y="16" width="14" height="22" rx="3.1"/>
    <rect class="il-yellow" x="35" y="20.4" width="10" height="15.6" rx="2.1"/>
    <path class="il-light il-thin" d="M36.5 21v9.9"/><rect class="il-dark il-ink il-thin" x="34" y="12" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="51" y="20" width="14" height="18" rx="3.1"/>
    <rect class="il-yellow" x="53" y="23.6" width="10" height="12.4" rx="2.1"/>
    <path class="il-light il-thin" d="M54.5 25v8.1"/><rect class="il-paper il-ink il-thin" x="53.5" y="28.1" width="9" height="5" rx="1"/><path class="il-line il-thin" d="M56 30.3h4"/><rect class="il-dark il-ink il-thin" x="52" y="16" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="97" y="16" width="14" height="22" rx="3.1"/>
    <rect class="il-yellow" x="99" y="20.4" width="10" height="15.6" rx="2.1"/>
    <path class="il-light il-thin" d="M100.5 21v9.9"/><rect class="il-red il-ink il-thin" x="98" y="12" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="115" y="20" width="14" height="18" rx="3.1"/>
    <rect class="il-yellow" x="117" y="23.6" width="10" height="12.4" rx="2.1"/>
    <path class="il-light il-thin" d="M118.5 25v8.1"/><rect class="il-paper il-ink il-thin" x="117.5" y="28.1" width="9" height="5" rx="1"/><path class="il-line il-thin" d="M120 30.3h4"/><rect class="il-dark il-ink il-thin" x="116" y="16" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="133" y="16" width="14" height="22" rx="3.1"/>
    <rect class="il-yellow" x="135" y="20.4" width="10" height="15.6" rx="2.1"/>
    <path class="il-light il-thin" d="M136.5 21v9.9"/><rect class="il-dark il-ink il-thin" x="134" y="12" width="12" height="5" rx="1.5"/>
    <rect class="il-white il-ink" x="69" y="12" width="22" height="26" rx="4.8"/>
    <rect class="il-yellow" x="71" y="17.2" width="18" height="18.8" rx="3.3"/>
    <path class="il-light il-thin" d="M72.5 17v11.7"/><rect class="il-paper il-ink il-thin" x="71.5" y="23.7" width="17" height="7.3" rx="1"/><path class="il-line il-thin" d="M74 26.8h12"/><rect class="il-dark il-ink il-thin" x="70" y="8" width="20" height="5" rx="1.5"/>
    <circle class="il-white il-ink il-thin" cx="77" cy="23.4" r="2"/><circle class="il-white il-ink il-thin" cx="83" cy="23.4" r="2"/>
    <circle class="il-dark" cx="77.4" cy="23.8" r="1"/><circle class="il-dark" cx="83.4" cy="23.8" r="1"/><path class="il-yellow il-ink il-thin" d="M75 23.4a2 2 0 0 1 4.1 0zM81 23.4a2 2 0 0 1 4.1 0z"/><path class="il-line il-thin" d="M77.6 27.6q3 1.2 4.8 -1.5"/>
    <rect class="il-white il-ink" x="16" y="54" width="12" height="16" rx="2.6"/>
    <rect class="il-yellow" x="18" y="57.2" width="8" height="10.8" rx="1.8"/>
    <path class="il-light il-thin" d="M19.5 59v7.2"/><rect class="il-dark il-ink il-thin" x="17" y="50" width="10" height="5" rx="1.5"/><rect class="il-white il-ink" x="31" y="50" width="14" height="20" rx="3.1"/>
    <rect class="il-yellow" x="33" y="54" width="10" height="14" rx="2.1"/>
    <path class="il-light il-thin" d="M34.5 55v9"/><rect class="il-paper il-ink il-thin" x="33.5" y="59" width="9" height="5.6" rx="1"/><path class="il-line il-thin" d="M36 61.4h4"/><rect class="il-red il-ink il-thin" x="32" y="46" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="48" y="50" width="12" height="20" rx="2.6"/>
    <rect class="il-yellow" x="50" y="54" width="8" height="14" rx="1.8"/>
    <path class="il-light il-thin" d="M51.5 55v9"/><rect class="il-dark il-ink il-thin" x="49" y="46" width="10" height="5" rx="1.5"/><rect class="il-white il-ink" x="63" y="54" width="14" height="16" rx="3.1"/>
    <rect class="il-yellow" x="65" y="57.2" width="10" height="10.8" rx="2.1"/>
    <path class="il-light il-thin" d="M66.5 59v7.2"/><rect class="il-red il-ink il-thin" x="64" y="50" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="80" y="50" width="12" height="20" rx="2.6"/>
    <rect class="il-yellow" x="82" y="54" width="8" height="14" rx="1.8"/>
    <path class="il-light il-thin" d="M83.5 55v9"/><rect class="il-paper il-ink il-thin" x="82.5" y="59" width="7" height="5.6" rx="1"/><path class="il-line il-thin" d="M85 61.4h2"/><rect class="il-dark il-ink il-thin" x="81" y="46" width="10" height="5" rx="1.5"/><rect class="il-white il-ink" x="95" y="50" width="14" height="20" rx="3.1"/>
    <rect class="il-yellow" x="97" y="54" width="10" height="14" rx="2.1"/>
    <path class="il-light il-thin" d="M98.5 55v9"/><rect class="il-red il-ink il-thin" x="96" y="46" width="12" height="5" rx="1.5"/><rect class="il-white il-ink" x="112" y="54" width="12" height="16" rx="2.6"/>
    <rect class="il-yellow" x="114" y="57.2" width="8" height="10.8" rx="1.8"/>
    <path class="il-light il-thin" d="M115.5 59v7.2"/><rect class="il-dark il-ink il-thin" x="113" y="50" width="10" height="5" rx="1.5"/><rect class="il-white il-ink" x="129" y="50" width="14" height="20" rx="3.1"/>
    <rect class="il-yellow" x="131" y="54" width="10" height="14" rx="2.1"/>
    <path class="il-light il-thin" d="M132.5 55v9"/><rect class="il-paper il-ink il-thin" x="131.5" y="59" width="9" height="5.6" rx="1"/><path class="il-line il-thin" d="M134 61.4h4"/><rect class="il-red il-ink il-thin" x="130" y="46" width="12" height="5" rx="1.5"/>
    <rect class="il-white il-ink" x="70" y="76" width="16" height="26" rx="3.5"/>
    <rect class="il-yellow" x="72" y="81.2" width="12" height="18.8" rx="2.4"/>
    <path class="il-light il-thin" d="M73.5 81v11.7"/><rect class="il-paper il-ink il-thin" x="72.5" y="87.7" width="11" height="7.3" rx="1"/><path class="il-line il-thin" d="M75 90.8h6"/><rect class="il-red il-ink il-thin" x="71" y="72" width="14" height="5" rx="1.5"/><rect class="il-white il-ink" x="88" y="80" width="16" height="22" rx="3.5"/>
    <rect class="il-yellow" x="90" y="84.4" width="12" height="15.6" rx="2.4"/>
    <path class="il-light il-thin" d="M91.5 85v9.9"/><rect class="il-dark il-ink il-thin" x="89" y="76" width="14" height="5" rx="1.5"/><rect class="il-white il-ink" x="106" y="76" width="16" height="26" rx="3.5"/>
    <rect class="il-yellow" x="108" y="81.2" width="12" height="18.8" rx="2.4"/>
    <path class="il-light il-thin" d="M109.5 81v11.7"/><rect class="il-paper il-ink il-thin" x="108.5" y="87.7" width="11" height="7.3" rx="1"/><path class="il-line il-thin" d="M111 90.8h6"/><rect class="il-red il-ink il-thin" x="107" y="72" width="14" height="5" rx="1.5"/><rect class="il-white il-ink" x="126" y="80" width="16" height="22" rx="3.5"/>
    <rect class="il-yellow" x="128" y="84.4" width="12" height="15.6" rx="2.4"/>
    <path class="il-light il-thin" d="M129.5 85v9.9"/><rect class="il-dark il-ink il-thin" x="127" y="76" width="14" height="5" rx="1.5"/>
    <g transform="translate(36 102) scale(0.6 0.6)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-blue il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.2" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.2" r="1.5"/><path class="il-line il-thin" d="M-7.6 -83.2L-1.9 -86.2M1.9 -86.2L7.6 -83.2"/><path class="il-line il-thin" d="M-3.8 -71.9q3.8 -3.8 7.6 0"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-wood-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(40)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-metal il-ink il-thin" d="M-23.6 -46.2v-14M-25.6 -60.2v-4M-21.6 -60.2v-4"/><circle class="il-skin il-ink il-thin" cx="-23.6" cy="-46.2" r="4.2"/>
    <g transform="translate(12 -60) rotate(-40)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><ellipse class="il-white il-ink" cx="23.6" cy="-46.2" rx="12" ry="3.6" transform="rotate(-10 23.6 -46.2)"/><circle class="il-skin il-ink il-thin" cx="23.6" cy="-46.2" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M30 32l-3-4M36 30v-5M42 32l3-4"/>`,

  // Someone’s bobble hat is frozen into a solid ice block on their head; they shiver blue-faced with chattering teeth, while an ice cube in the tray giggles behind its hand.
  'fd.ice-cube-in-hat': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <rect class="il-wood il-ink" x="118" y="78" width="42" height="26"/>
    <path class="il-line il-thin" d="M139 78v26M134 90h2M142 90h2"/>
    <rect class="il-water il-ink il-thin" x="120" y="70" width="38" height="8" rx="2"/>
    <rect class="il-white il-ink il-thin" x="123" y="64" width="8" height="8" rx="1.5" opacity="0.9"/><rect class="il-white il-ink il-thin" x="145" y="64" width="8" height="8" rx="1.5" opacity="0.9"/>
    <rect class="il-white il-ink il-thin" x="132" y="56" width="12" height="12" rx="2"/>
    <circle class="il-dark" cx="136" cy="61" r="1"/><circle class="il-dark" cx="140" cy="61" r="1"/>
    <circle class="il-white il-ink il-thin" cx="141" cy="65" r="2.6"/><path class="il-line il-thin" d="M135 64q2 2 4 0"/>
    <path class="il-line il-thin" d="M130 52l-2-3M146 52l2-3"/>
    <g transform="translate(76 116) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-green il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <ellipse class="il-water" cx="0" cy="-79" rx="13" ry="14" opacity="0.35"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.4" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.4" r="1.5"/><path class="il-line il-thin" d="M-7.6 -86.1L-1.9 -82.3M1.9 -82.3L7.6 -86.1"/><path class="il-white il-ink il-thin" d="M-4.7 -74.2h9.5v3.2h-9.5z"/><path class="il-line il-thin" d="M-4.7 -72.6h9.5M-1.5 -74.2v3.2M1.5 -74.2v3.2"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-red il-ink" d="M-14 -84q0-18 14-18t14 18z"/><path class="il-line il-thin" d="M-8 -86q0-10 4-14M0 -86v-15M8 -86q0-10-4-14"/>
    <rect class="il-white il-ink il-thin" x="-15" y="-88" width="30" height="6" rx="2"/><circle class="il-white il-ink" cx="0" cy="-104" r="5"/>
    <rect class="il-water il-ink" x="-22" y="-114" width="44" height="34" rx="4" opacity="0.55"/>
    <path class="il-light" d="M-17 -108l8-2M-17 -100l4-4M15 -94v8"/>
    <path class="il-water il-ink il-thin" d="M-16 -80l2 6 2-6M8 -80l2 8 2-8"/></g>
    <g transform="translate(-12 -60) rotate(-38)"><rect class="il-green il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-0.9" cy="-45.8" r="4.2"/>
    <g transform="translate(12 -60) rotate(38)"><rect class="il-green il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="0.9" cy="-45.8" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M48 70l-4 3 4 3-4 3M44 90l-4 3 4 3M104 70l4 3-4 3 4 3M108 90l4 3-4 3"/>
    <path class="il-line il-thin" d="M40 18v8M36.5 20l6.9 4M36.5 24l6.9 -4"/><path class="il-line il-thin" d="M112 21v10M107.7 23.5l8.7 5M107.7 28.5l8.7 -5"/><path class="il-line il-thin" d="M24 47v6M21.4 48.5l5.2 3M21.4 51.5l5.2 -3"/>`,

  // A big red ketchup splat lands on a white shirt; the owner stares down in shock while a chubby ketchup bottle on the counter smirks after its splort.
  'fd.ketchup-stain': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v100M32 0v100M48 0v100M64 0v100M80 0v100M96 0v100M112 0v100M128 0v100M144 0v100M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 100h160M20 100l-8 20M60 100l-3 20M100 100l3 20M140 100l8 20M0 109h160"/>
    <path class="il-line" d="M0 100h160"/>
    <rect class="il-wood il-ink" x="108" y="74" width="52" height="30"/>
    <path class="il-line il-thin" d="M134 74v30M128 86h2M138 86h2"/>
    <rect class="il-wood-dark il-ink il-thin" x="106" y="70" width="54" height="5"/>
    <path class="il-red il-ink" d="M126 70c-6 0-8-6-8-12s4-12 8-14v-4h12v4c4 2 8 8 8 14s-2 12-8 12z"/>
    <rect class="il-white il-ink il-thin" x="124" y="32" width="16" height="7" rx="2"/>
    <rect class="il-white il-ink il-thin" x="122" y="52" width="20" height="12" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="132" cy="58" r="3.4"/><path class="il-green il-ink il-thin" d="M130 54l2 1 2-1"/>
    <circle class="il-white il-ink il-thin" cx="129" cy="45.4" r="2"/><circle class="il-white il-ink il-thin" cx="135" cy="45.4" r="2"/>
    <circle class="il-dark" cx="129.4" cy="45.8" r="1"/><circle class="il-dark" cx="135.4" cy="45.8" r="1"/><path class="il-red il-ink il-thin" d="M127 45.4a2 2 0 0 1 4.1 0zM133 45.4a2 2 0 0 1 4.1 0z"/><path class="il-line il-thin" d="M129.6 49.6q3 1.2 4.8 -1.5"/>
    <path class="il-line il-thin" d="M120 30l-6-4M118 36l-8 0M124 26l-2-6"/>
    <circle class="il-red" cx="104" cy="34" r="2"/><circle class="il-red" cx="96" cy="40" r="1.6"/><circle class="il-red" cx="110" cy="26" r="1.4"/>
    <g transform="translate(62 114) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-white il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-red il-ink il-thin" d="M-2 -58l3 6 7-4-2 8 8 2-7 4 4 7-8-2-1 8-4-7-6 4 1-7-8-1 6-5-4-7 7 2z"/>
    <path class="il-red il-ink il-thin" d="M-4 -40v6a1.6 1.6 0 0 0 3.2 0v-6zM6 -42v4a1.4 1.4 0 0 0 2.8 0v-4z"/>
    <circle class="il-red" cx="10" cy="-60" r="1.4"/><circle class="il-red" cx="-10" cy="-50" r="1.2"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(8 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.9" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.9" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.6L-1.9 -87.6M1.9 -87.6L7.6 -85.6"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="-72.8" rx="2.3" ry="3"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-gold il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(64)"><rect class="il-white il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-28.2" cy="-52.1" r="4.2"/>
    <g transform="translate(12 -60) rotate(-60)"><rect class="il-white il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="27.6" cy="-51" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M30 50l-6-2M28 60h-6M92 48l6-3"/>`,

  // The freezer drawer has thawed into a big puddle; its owner stands in it in wet socks while both shoes paddle away like little boats, an ice cube floats along happily.
  'fd.defrost-puddle': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v90M32 0v90M48 0v90M64 0v90M80 0v90M96 0v90M112 0v90M128 0v90M144 0v90M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160"/>
    <rect class="il-stone" x="0" y="90" width="160" height="30"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 90h160M20 90l-8 30M60 90l-3 30M100 90l3 30M140 90l8 30M0 99h160"/>
    <path class="il-line" d="M0 90h160"/>
    <rect class="il-white il-ink" x="108" y="4" width="48" height="86" rx="4"/>
    <path class="il-line il-thin" d="M108 30h48"/><rect class="il-metal il-ink il-thin" x="112" y="10" width="4" height="12" rx="2"/><rect class="il-metal il-ink il-thin" x="112" y="36" width="4" height="18" rx="2"/>
    <path class="il-white il-ink" d="M104 64h52v22h-52z"/>
    <path class="il-water il-ink il-thin" d="M106 64q6-6 12 0 6-8 14 0 6-6 12 0 4-4 10 0v-4h-48z"/>
    <path class="il-metal il-ink il-thin" d="M122 74h16"/>
    <path class="il-water il-ink il-thin" d="M110 86l1 5 1-5M126 86l1 7 1-7M146 86l1 5 1-5"/>
    <ellipse class="il-water il-ink il-thin" cx="82" cy="106" rx="76" ry="12"/>
    <path class="il-light il-thin" d="M20 104h14M60 112h18M120 100h12"/>
    <g transform="translate(44 108) scale(0.86 0.86)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-white il-ink" cx="-7" cy="-3" rx="6" ry="3.4"/><ellipse class="il-white il-ink" cx="7" cy="-3" rx="6" ry="3.4"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-purple il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.2" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.2" r="1.5"/><path class="il-line il-thin" d="M-7.6 -83.2L-1.9 -86.2M1.9 -86.2L7.6 -83.2"/><path class="il-line il-thin" d="M-3.8 -71.9q3.8 -3.8 7.6 0"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-wood-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(40)"><rect class="il-purple il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-23.6" cy="-46.2" r="4.2"/>
    <g transform="translate(12 -60) rotate(-40)"><rect class="il-purple il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="23.6" cy="-46.2" r="4.2"/>
    </g>
    <path class="il-water" opacity="0.7" d="M28 104q16 4 32 0v6q-16 4-32 0z"/>
    <path class="il-light il-thin" d="M30 104q6 2 10 0M48 104q6 2 10 0"/>
    <g transform="translate(86 102)"><path class="il-red il-ink" d="M0 0h20q5 0 5-4 0-4-7-5l-6-1-2-4H2q-3 0-3 3z"/><path class="il-white il-ink il-thin" d="M-1 0h26v2H-1z"/><circle class="il-white il-ink il-thin" cx="19" cy="-4" r="2"/><circle class="il-dark" cx="19.6" cy="-4" r="0.9"/><path class="il-line il-thin" d="M6 -12l4 2M8 -14l4 2"/></g>
    <g transform="translate(122 110)"><path class="il-red il-ink" d="M0 0h20q5 0 5-4 0-4-7-5l-6-1-2-4H2q-3 0-3 3z"/><path class="il-white il-ink il-thin" d="M-1 0h26v2H-1z"/><circle class="il-white il-ink il-thin" cx="19" cy="-4" r="2"/><circle class="il-dark" cx="19.6" cy="-4" r="0.9"/><path class="il-line il-thin" d="M6 -12l4 2M8 -14l4 2"/></g>
    <path class="il-light il-thin" d="M80 102q-4 0-6 3M116 110q-4 0-6 3M112 104q-3-2-6 0"/>
    <rect class="il-white il-ink il-thin" x="64" y="106" width="10" height="9" rx="2" opacity="0.9"/><path class="il-line il-thin" d="M66 111q3 2 6 0"/><circle class="il-dark" cx="67" cy="109" r="0.8"/><circle class="il-dark" cx="71" cy="109" r="0.8"/>`,

  // Butter fingers: a mug, a spoon, an apple and two cards fly out of someone’s gleaming buttery hands, while the dented butter block on the counter looks smug.
  'fd.butter-fingers': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v100M32 0v100M48 0v100M64 0v100M80 0v100M96 0v100M112 0v100M128 0v100M144 0v100M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 100h160M20 100l-8 20M60 100l-3 20M100 100l3 20M140 100l8 20M0 109h160"/>
    <path class="il-line" d="M0 100h160"/>
    <rect class="il-wood il-ink" x="0" y="74" width="50" height="30"/>
    <rect class="il-wood-dark il-ink il-thin" x="0" y="70" width="52" height="5"/>
    <ellipse class="il-white il-ink" cx="26" cy="68" rx="22" ry="5"/>
    <path class="il-yellow il-ink" d="M10 66V52l6-4h22v18z"/><path class="il-yellow il-ink il-thin" d="M38 48l4 2v16h-4z"/>
    <path class="il-gold il-ink il-thin" d="M30 50q2 4 0 8M34 50q2 4 0 8M26 50q2 4 0 8"/>
    <circle class="il-white il-ink il-thin" cx="16.3" cy="57.5" r="1.9"/><circle class="il-white il-ink il-thin" cx="21.8" cy="57.5" r="1.9"/>
    <circle class="il-dark" cx="16.6" cy="57.8" r="0.9"/><circle class="il-dark" cx="22.1" cy="57.8" r="0.9"/><path class="il-yellow il-ink il-thin" d="M14.4 57.5a1.9 1.9 0 0 1 3.7 0zM19.9 57.5a1.9 1.9 0 0 1 3.7 0z"/><path class="il-line il-thin" d="M16.8 61.3q2.8 1.1 4.4 -1.4"/>
    <path class="il-yellow" opacity="0.7" d="M62 104q20-4 40 0q-20 4-40 0z"/>
    <g transform="translate(96 116) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-red il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.9" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.9" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.6L-1.9 -87.6M1.9 -87.6L7.6 -85.6"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="-72.8" rx="2.3" ry="3"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(150)"><rect class="il-red il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-21" cy="-75.6" r="4.2"/>
    <g transform="translate(12 -60) rotate(-150)"><rect class="il-red il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="21" cy="-75.6" r="4.2"/>
    </g>
    <ellipse class="il-yellow" cx="75.4" cy="40" rx="4" ry="3" opacity="0.8"/><ellipse class="il-yellow" cx="116.6" cy="40" rx="4" ry="3" opacity="0.8"/>
    <path class="il-light il-thin" d="M70 36l2-2M120 36l2-2"/>
    <g transform="translate(58 18) rotate(-30)"><rect class="il-blue il-ink" x="-7" y="-7" width="14" height="14" rx="2"/><path class="il-line" d="M7 -4q6 0 6 4t-6 4"/></g>
    <g transform="translate(136 14) rotate(40)"><ellipse class="il-metal il-ink il-thin" cx="0" cy="-6" rx="3" ry="4"/><rect class="il-metal il-ink il-thin" x="-1" y="-2" width="2" height="12" rx="1"/></g>
    <g transform="translate(86 14) rotate(-20) scale(1)"><rect class="il-white il-ink il-thin" x="-7" y="-10" width="14" height="20" rx="2"/><rect class="il-red" x="-4.5" y="-7.5" width="9" height="15" rx="1"/><path class="il-light il-thin" d="M-4.5 -7.5l9 15M4.5 -7.5l-9 15"/></g><g transform="translate(112 10) rotate(25) scale(1)"><rect class="il-white il-ink il-thin" x="-7" y="-10" width="14" height="20" rx="2"/><rect class="il-red" x="-4.5" y="-7.5" width="9" height="15" rx="1"/><path class="il-light il-thin" d="M-4.5 -7.5l9 15M4.5 -7.5l-9 15"/></g>
    <circle class="il-red il-ink" cx="146" cy="44" r="6"/><path class="il-green il-ink il-thin" d="M146 38q2-4 5-3"/>
    <path class="il-line il-thin" d="M64 30l-4 4M80 24l-2 4M120 22l2 4M140 30l-4 2M142 56l-4 2"/>`,

  // Fridge jigsaw: tubs, boxes, a carton and a squashed lettuce are packed edge to edge without a gap; your small stuff (keys, a die, a toy duck) has been squeezed out and tumbles onto the drawer.
  'fd.fridge-jigsaw': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="100" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 100h160M0 105h160"/>
    <path class="il-light il-thin" d="M16 102.5h40M92 102.5h18"/><rect class="il-metal" x="0" y="105" width="160" height="15" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 110h40"/>
    <rect class="il-blue il-ink" x="14" y="62" width="44" height="38" rx="2"/><rect class="il-dark" x="15" y="63" width="42" height="3" opacity="0.5"/>
    <path class="il-light il-thin" d="M18 70v24"/>
    <rect class="il-orange il-ink" x="58" y="36" width="18" height="64" rx="2"/><rect class="il-white" x="59" y="37" width="16" height="3" opacity="0.5"/>
    <path class="il-white il-ink il-thin" d="M60 56h14v16H60z"/>
    <rect class="il-yellow il-ink" x="76" y="78" width="42" height="22" rx="2"/><rect class="il-gold" x="77" y="79" width="40" height="3" opacity="0.5"/>
    <circle class="il-gold" cx="86" cy="88" r="2.4"/><circle class="il-gold" cx="104" cy="92" r="3"/>
    <rect class="il-wood il-ink" x="76" y="64" width="42" height="14" rx="2"/><rect class="il-wood-dark" x="77" y="65" width="40" height="3" opacity="0.5"/>
    <rect class="il-stone il-ink" x="118" y="84" width="28" height="16" rx="2"/><rect class="il-grey" x="119" y="85" width="26" height="3" opacity="0.5"/>
    <path class="il-line il-thin" d="M125 84v16M132 84v16M139 84v16"/>
    <rect class="il-green il-ink" x="118" y="52" width="28" height="32" rx="2"/><rect class="il-grass" x="119" y="53" width="26" height="3" opacity="0.5"/>
    <rect class="il-red il-ink" x="14" y="30" width="44" height="32" rx="2"/><rect class="il-dark" x="15" y="31" width="42" height="3" opacity="0.5"/>
    <path class="il-white il-ink il-thin" d="M26 42h20v10H26z"/>
    <path class="il-green il-ink" d="M76 64q-2-12 4-22 4-4 8 0 4-6 10-2 6-4 10 2 6 0 8 8 4 8 0 14z"/>
    <path class="il-grass il-ink il-thin" d="M80 54q6-4 10 2 4-6 10-1 4-5 10 1"/>
    <circle class="il-white il-ink il-thin" cx="93.9" cy="51.4" r="2.1"/><circle class="il-white il-ink il-thin" cx="100.1" cy="51.4" r="2.1"/>
    <circle class="il-dark" cx="93.9" cy="51.4" r="1"/><circle class="il-dark" cx="100.1" cy="51.4" r="1"/><path class="il-line il-thin" d="M92 48.5L95.8 46.8M98.2 46.8L102 48.5"/><path class="il-line il-thin" d="M93.9 55.7l1.6 -0.9l1.6 0.9l1.6 -0.9l1.6 0.9"/>
    <rect class="il-purple il-ink" x="118" y="26" width="28" height="26" rx="2"/><rect class="il-white" x="119" y="27" width="26" height="3" opacity="0.5"/>
    <rect class="il-teal il-ink" x="14" y="8" width="62" height="22" rx="2"/><rect class="il-white" x="15" y="9" width="60" height="3" opacity="0.5"/>
    <rect class="il-pink il-ink" x="76" y="10" width="70" height="16" rx="2"/><rect class="il-white" x="77" y="11" width="68" height="3" opacity="0.5"/>
    <path class="il-white il-ink il-thin" d="M58 30v6h18v-6"/>
    <path class="il-line il-thin" d="M34 30q4-4 8 0M120 52q4-3 8 0"/>
    <path class="il-line il-thin" d="M30 6l-2-4M60 6l2-4M150 30l4-2M150 50l4 2"/>
    <circle class="il-gold il-ink il-thin" cx="40" cy="110" r="4"/><path class="il-gold il-ink il-thin" d="M43 112l10 0v3M49 112v3"/>
    <rect class="il-white il-ink il-thin" x="70" y="104" width="10" height="10" rx="2" transform="rotate(-18 75 109)"/>
    <circle class="il-dark" cx="73" cy="107" r="1"/><circle class="il-dark" cx="77" cy="111" r="1"/><circle class="il-dark" cx="75" cy="109" r="1"/>
    <path class="il-yellow il-ink il-thin" d="M108 116q-6 0-6-5 0-4 4-4 0-4 4-4 4 0 4 4l4-1q-1 4-4 4 4 2 2 4-2 2-8 2z"/>
    <circle class="il-dark" cx="110" cy="105" r="0.9"/>
    <path class="il-line il-thin" d="M36 104l-4-3M84 102l4-4M100 104l-3-4"/>`,

  // A licked-clean pudding cup with its name label sits on the shelf; its owner sobs, while a round monster with pudding all over its face whistles innocently.
  'fd.who-ate-my-pudding': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="100" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 100h160M0 105h160"/>
    <path class="il-light il-thin" d="M16 102.5h40M92 102.5h18"/><rect class="il-metal" x="0" y="105" width="160" height="15" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 110h40"/>
    <g transform="translate(30 100) scale(0.72 0.72)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-pink il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.2" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.2" r="1.5"/><path class="il-line il-thin" d="M-7.6 -83.2L-1.9 -86.2M1.9 -86.2L7.6 -83.2"/><path class="il-dark il-ink il-thin" d="M-4.3 -70.9q4.3 -5.7 8.5 0z"/><path class="il-water il-ink il-thin" d="M-5.7 -77.1q-1.9 3.8 0 4.8q1.9 -0.9 0 -4.7zM5.7 -77.1q1.9 3.8 0 4.8q-1.9 -0.9 0 -4.7z"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-gold il-ink" d="M-14 -66c-4-22 2-32 14-32s18 10 14 32l-4-2c1-8 0-14-2-18-6 2-14 0-18-6-2 6-2 14 0 24z"/></g>
    <g transform="translate(-12 -60) rotate(30)"><rect class="il-pink il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-21" cy="-44.4" r="4.2"/>
    <g transform="translate(12 -60) rotate(-60)"><rect class="il-pink il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="27.6" cy="-51" r="4.2"/>
    </g>
    <ellipse class="il-dark" cx="72" cy="100" rx="14" ry="2" opacity="0.25"/>
    <path class="il-white il-ink" d="M58 70h28l-3 30H61z"/>
    <path class="il-wood-dark" d="M60 72h24l-0.6 6q-6-2-10 1-6-3-13 0z"/>
    <rect class="il-paper il-ink il-thin" x="62" y="82" width="20" height="10" rx="1"/>
    <path class="il-line il-thin" d="M64 88q2-3 4 0t4 0 4 0"/><path class="il-red il-ink il-thin" d="M78 85q1.4-2 2 0 0.6-2 2 0 0 2-2 4-2-2-2-4z"/>
    <path class="il-metal il-ink il-thin" d="M80 72l10-22"/><ellipse class="il-metal il-ink il-thin" cx="91" cy="47" rx="3" ry="4.4" transform="rotate(25 91 47)"/>
    <path class="il-light il-thin" d="M60 74v10"/>
    <circle class="il-wood-dark" cx="94" cy="99" r="1.6"/><circle class="il-wood-dark" cx="100" cy="98" r="1.2"/>
    <path class="il-white il-ink il-thin" d="M110 52.8l-6.5 -15.3 15.3 6.5zM134 52.8l6.5 -15.3 -15.3 6.5z"/><path class="il-orange il-ink" d="M98 86.4C95.6 50.4 110 48 122 48S148.4 50.4 146 86.4Q122 98.4 98 86.4z"/><path class="il-light il-thin" opacity="0.45" d="M107.6 64.8q2.4 -10.8 10.8 -13.2"/><circle class="il-white il-ink il-thin" cx="111.1" cy="67.4" r="7.4"/><circle class="il-white il-ink il-thin" cx="132.9" cy="67.4" r="7.4"/>
    <circle class="il-dark" cx="112.8" cy="65.2" r="3.5"/><circle class="il-dark" cx="134.7" cy="65.2" r="3.5"/><path class="il-line il-thin" d="M104.5 53L117.6 55.6M126.4 55.6L139.5 53"/><circle class="il-dark il-ink il-thin" cx="126.4" cy="82.7" r="3.3"/>
    <path class="il-wood-dark" opacity="0.9" d="M110 74q4 8 10 6 6 4 10-2 4 4 6-4-4 2-6-2-4 4-8 0-6 4-12 2z"/>
    <path class="il-wood-dark il-ink il-thin" d="M104 60q-2 4 2 6M138 82q2 3 0 6"/>
    <path class="il-orange il-ink" d="M110 98v2h8v-2zM126 98v2h8v-2z"/>
    <path class="il-line il-thin" d="M146 46v-10l6 2v8"/><ellipse class="il-dark" cx="144" cy="46" rx="2.4" ry="1.8"/><ellipse class="il-dark" cx="150" cy="46" rx="2.4" ry="1.8"/>
    <path class="il-line il-thin" d="M98 72l-4 2M146 72l4 2"/>`,

  // The egg box landed upside down: egg splats everywhere, two cards lie in the yolk, the owner clutches their face, and the one surviving egg rolls off grinning.
  'fd.dropped-eggs': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v86M32 0v86M48 0v86M64 0v86M80 0v86M96 0v86M112 0v86M128 0v86M144 0v86M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160"/>
    <rect class="il-stone" x="0" y="86" width="160" height="34"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 86h160M20 86l-8 34M60 86l-3 34M100 86l3 34M140 86l8 34M0 95h160"/>
    <path class="il-line" d="M0 86h160"/>
    <path class="il-white il-ink il-thin" d="M8 104q4-6 12-4 6-6 12 0 8 0 6 6 4 6-6 6-6 6-14 2-8 0-6-6 0-6-4-4z"/><circle class="il-yellow il-ink il-thin" cx="22" cy="106" r="4.4"/>
    <path class="il-white il-ink il-thin" d="M58 104q4-6 12-4 8-4 14 2 8 2 4 8 2 8-10 6-6 6-14 0-8-2-4-8 0-6z"/><circle class="il-yellow il-ink il-thin" cx="72" cy="108" r="5"/>
    <path class="il-white il-ink il-thin" d="M96 108q4-4 10-2 6-4 10 2 6 2 2 6-4 4-12 2-8 2-10-4z"/><circle class="il-yellow il-ink il-thin" cx="106" cy="110" r="3.6"/>
    <path class="il-white il-ink il-thin" d="M120 92q3-3 7-1 5-1 6 3-1 4-7 3-6 1-6-5z"/><circle class="il-yellow il-ink il-thin" cx="126" cy="94" r="2.4"/>
    <g transform="translate(44 110) rotate(-70) scale(0.9)"><rect class="il-white il-ink il-thin" x="-7" y="-10" width="14" height="20" rx="2"/><rect class="il-red" x="-4.5" y="-7.5" width="9" height="15" rx="1"/><path class="il-light il-thin" d="M-4.5 -7.5l9 15M4.5 -7.5l-9 15"/></g><g transform="translate(92 113) rotate(80) scale(0.9)"><rect class="il-white il-ink il-thin" x="-7" y="-10" width="14" height="20" rx="2"/><rect class="il-red" x="-4.5" y="-7.5" width="9" height="15" rx="1"/><path class="il-light il-thin" d="M-4.5 -7.5l9 15M4.5 -7.5l-9 15"/></g>
    <g transform="translate(52 100) scale(1.3)"><path class="il-stone il-ink" d="M0 0v-8l4-5h5l3 5 3-5h5l3 5 3-5h5l3 5 3-5h5l3 5 3-5h5l4 5v8z"/>
    <path class="il-grey il-ink il-thin" d="M-2 0l-6 4 8 0zM54 0l8 3h-8z"/><path class="il-line il-thin" d="M12 0v-6M23 0v-6M34 0v-6M45 0v-6"/><path class="il-line il-thin" d="M4 -3h4M48 -3h2"/></g>
    <g transform="translate(28 100) scale(0.78 0.78)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-teal il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.9" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.9" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.6L-1.9 -87.6M1.9 -87.6L7.6 -85.6"/><ellipse class="il-dark il-ink il-thin" cx="0" cy="-72.8" rx="2.3" ry="3"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-earth-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(160)"><rect class="il-teal il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-18.2" cy="-76.9" r="4.2"/>
    <g transform="translate(12 -60) rotate(-160)"><rect class="il-teal il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="18.2" cy="-76.9" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M14 22l-4-4M28 16v-6M42 22l4-4"/>
    <g transform="translate(140 96) rotate(30)"><ellipse class="il-white il-ink" cx="0" cy="0" rx="9" ry="11"/><circle class="il-white il-ink il-thin" cx="-3" cy="-0.6" r="2"/><circle class="il-white il-ink il-thin" cx="3" cy="-0.6" r="2"/>
    <circle class="il-dark" cx="-3" cy="-0.4" r="1"/><circle class="il-dark" cx="3" cy="-0.4" r="1"/><path class="il-line il-thin" d="M-4.8 -4.3L-1.2 -3.5M1.2 -3.5L4.8 -4.3"/><path class="il-dark il-ink il-thin" d="M-3 2.7h6q0 3.6 -3 3.6t-3 -3.6z"/><path class="il-white" d="M-2.6 3h5.3v1h-5.3z"/></g>
    <path class="il-line il-thin" d="M122 100h-8M124 106h-10M126 112h-6"/>`,

  // Expired yesterday: a sad yoghurt cup with a little bundle on a stick waves goodbye as it hops into the open bin, two cards tumble in after it; the wall calendar has yesterday crossed out.
  'fd.expired': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v100M32 0v100M48 0v100M64 0v100M80 0v100M96 0v100M112 0v100M128 0v100M144 0v100M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 100h160M20 100l-8 20M60 100l-3 20M100 100l3 20M140 100l8 20M0 109h160"/>
    <path class="il-line" d="M0 100h160"/>
    <rect class="il-white il-ink" x="8" y="10" width="40" height="34" rx="2"/><rect class="il-red il-ink il-thin" x="8" y="10" width="40" height="8" rx="2"/>
    <path class="il-line il-thin" d="M18 18v26M28 18v26M38 18v26M8 26h40M8 35h40"/>
    <path class="il-red il-ink il-thin" d="M28 26l10 9M38 26l-10 9"/>
    <circle class="il-dark" cx="16" cy="12" r="1"/><circle class="il-dark" cx="40" cy="12" r="1"/>
    <path class="il-metal il-ink" d="M102 62h44l-4 42h-36z"/>
    <path class="il-line il-thin" d="M112 68l2 32M124 68v32M136 68l-2 32"/>
    <path class="il-metal il-ink" d="M100 60l42-22 3 5-42 22z"/><circle class="il-metal il-ink il-thin" cx="102" cy="62" r="2.4"/>
    <path class="il-dark il-ink il-thin" d="M114 104v4h20v-4z"/><path class="il-dark il-ink il-thin" d="M140 104l8 4"/>
    <g transform="translate(118 50) rotate(-30) scale(0.8)"><rect class="il-white il-ink il-thin" x="-7" y="-10" width="14" height="20" rx="2"/><rect class="il-red" x="-4.5" y="-7.5" width="9" height="15" rx="1"/><path class="il-light il-thin" d="M-4.5 -7.5l9 15M4.5 -7.5l-9 15"/></g><g transform="translate(132 56) rotate(20) scale(0.8)"><rect class="il-white il-ink il-thin" x="-7" y="-10" width="14" height="20" rx="2"/><rect class="il-red" x="-4.5" y="-7.5" width="9" height="15" rx="1"/><path class="il-light il-thin" d="M-4.5 -7.5l9 15M4.5 -7.5l-9 15"/></g>
    <path class="il-line il-dash" opacity="0.6" d="M54 92q10-50 50-40"/>
    <g transform="translate(78 54) rotate(12)">
    <path class="il-white il-ink" d="M-14 -14h28l-4 30h-20z"/><path class="il-pink il-ink il-thin" d="M-13.4 -6h26.8l-0.8 6h-25.2z"/>
    <path class="il-metal il-ink il-thin" d="M-16 -16h32v4h-32z"/>
    <circle class="il-white il-ink il-thin" cx="-3" cy="5.4" r="2"/><circle class="il-white il-ink il-thin" cx="3" cy="5.4" r="2"/>
    <circle class="il-dark" cx="-3" cy="5.9" r="1"/><circle class="il-dark" cx="3" cy="5.9" r="1"/><path class="il-line il-thin" d="M-4.8 3.4L-1.2 1.4M1.2 1.4L4.8 3.4"/><path class="il-line il-thin" d="M-2.4 10.5q2.4 -2.4 4.8 0"/>
    <path class="il-line il-thin" d="M-14 0l-8-10M14 0l8-6"/>
    <path class="il-wood-dark il-ink il-thin" d="M-22 -10l-6-16"/><path class="il-red il-ink il-thin" d="M-34 -30q6-8 12 0-2 6-6 6t-6-6z"/><circle class="il-white" cx="-30" cy="-28" r="1"/>
    <path class="il-white il-ink il-thin" d="M22 -6l6-8 2 6z"/>
    <path class="il-white il-ink il-thin" d="M-8 16l-2 6M8 16l2 6"/></g>`,

  // Brain freeze: someone eats ice cream too fast, a frosty ice cap with icicles grows on their head, a little snow cloud snows on it and their whole face squeezes shut.
  'fd.brain-freeze': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-smoke il-ink" d="M58 14q-2-8 6-9 4-6 12-3 6-5 12 1 8 0 7 7 3 5-3 6H62q-6-1-4-2z"/>
    <path class="il-line il-thin" d="M66 21.6v4.8M63.9 22.8l4.2 2.4M63.9 25.2l4.2 -2.4"/><path class="il-line il-thin" d="M78 25.6v4.8M75.9 26.8l4.2 2.4M75.9 29.2l4.2 -2.4"/><path class="il-line il-thin" d="M90 21.6v4.8M87.9 22.8l4.2 2.4M87.9 25.2l4.2 -2.4"/><path class="il-line il-thin" d="M36 26v8M32.5 28l6.9 4M32.5 32l6.9 -4"/><path class="il-line il-thin" d="M124 34v8M120.5 36l6.9 4M120.5 40l6.9 -4"/><path class="il-line il-thin" d="M130 67v6M127.4 68.5l5.2 3M127.4 71.5l5.2 -3"/>
    <g transform="translate(80 116) scale(1.04 1.04)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-orange il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <path class="il-water" opacity="0.4" d="M-13 -79a13 14 0 0 1 26 0z"/>
    <path class="il-line il-thin" d="M-7.6 -81.9l4.8 1.9l-4.7 1.9M7.6 -81.9l-4.7 1.9l4.8 1.9"/><circle class="il-dark il-ink il-thin" cx="0" cy="-73.3" r="1.5"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <g transform="translate(0 -6)"><path class="il-water il-ink" d="M-15 -84q-1-12 15-13t15 13l-3 1-1 4-2-4h-5l-1 5-2-5h-5l-1 4-2-4h-4l-1 3-1-3z"/><path class="il-white il-ink il-thin" d="M-12 -90l3-6 3 5 3-7 3 6 3-6 3 7 3-4 2 5q-12-4-23 0z"/><path class="il-light il-thin" d="M-8 -86h4M4 -86h3"/></g></g>
    <g transform="translate(-12 -60) rotate(148)"><rect class="il-orange il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-21.5" cy="-75.3" r="4.2"/>
    <g transform="translate(12 -60) rotate(-40)"><rect class="il-orange il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-white il-ink" d="M21.6 -50.2h22q0 12-11 12t-11-12z"/><circle class="il-pink il-ink il-thin" cx="27.6" cy="-52.2" r="5"/><circle class="il-wood-dark il-ink il-thin" cx="36.6" cy="-53.2" r="5"/><circle class="il-white il-ink il-thin" cx="32.6" cy="-58.2" r="4.4"/><path class="il-metal il-ink il-thin" d="M39.6 -58.2l6-8"/><circle class="il-skin il-ink il-thin" cx="23.6" cy="-46.2" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M58 64l-6-2M58 74l-7 0M104 60l6-3M104 70h6"/>`,

  // Too much lemon: a close-up face scrunches up completely, eyes squeezed, lips puckered, hair on end, still holding the bitten lemon wedge, while a whole lemon looks on innocently.
  'fd.too-much-lemon': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v120M32 0v120M48 0v120M64 0v120M80 0v120M96 0v120M112 0v120M128 0v120M144 0v120M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160M0 112h160"/>
    <rect class="il-stone" x="0" y="120" width="160" height="0"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 120h160M20 120l-8 0M60 120l-3 0M100 120l3 0M140 120l8 0M0 129h160"/>
    <path class="il-line" d="M0 120h160"/>
    <path class="il-yellow" opacity="0.35" d="M74 64L20 0h30zM74 64L110 0h30zM74 64L160 40v30zM74 64L0 50v30z"/>
    <path class="il-purple il-ink" d="M30 120q4-26 44-26t44 26z"/>
    <rect class="il-skin il-ink" x="64" y="88" width="20" height="10"/>
    <path class="il-dark il-ink" d="M44 44l-4-16 10 8 2-16 8 12 6-16 6 14 8-14 4 16 10-10-2 16 10-4-6 14z"/>
    <ellipse class="il-skin il-ink" cx="42" cy="64" rx="6" ry="8"/><ellipse class="il-skin il-ink" cx="106" cy="64" rx="6" ry="8"/>
    <ellipse class="il-skin il-ink" cx="74" cy="62" rx="30" ry="32"/>
    <path class="il-line" d="M54 52l12 4-12 4M94 52l-12 4 12 4"/>
    <path class="il-line il-thin" d="M52 46l14 4M96 46l-14 4M64 36q10-4 20 0M62 40q12-3 24 0M50 60l-4 2M50 66l-4 0M98 60l4 2M98 66l4 0"/>
    <path class="il-line il-thin" d="M72 64q2 4-1 6"/>
    <ellipse class="il-pink il-ink" cx="74" cy="79" rx="4" ry="2.6"/><ellipse class="il-pink il-ink" cx="74" cy="83" rx="3.4" ry="2.2"/>
    <path class="il-line il-thin" d="M56 70q4 8 2 14M92 70q-4 8-2 14"/>
    <path class="il-line il-thin" d="M30 50l-6-2M28 60h-8M30 72l-6 2M118 50l6-2M120 60h8M118 72l6 2"/>
    <circle class="il-skin il-ink il-thin" cx="114" cy="96" r="7"/>
    <path class="il-yellow il-ink" d="M108 94a12 12 0 0 1 22-8l-4 2a3 3 0 0 0-5 2 3 3 0 0 0-4 1z"/>
    <path class="il-white il-ink il-thin" d="M111 92a9 9 0 0 1 15-6"/><path class="il-line il-thin" d="M118 88l-1 5M122 87l2 4"/>
    <ellipse class="il-yellow il-ink" cx="140" cy="104" rx="14" ry="11"/><path class="il-yellow il-ink il-thin" d="M126 104l-4 0M154 104l4 0"/>
    <path class="il-green il-ink il-thin" d="M140 93q4-6 9-4-3 5-9 4z"/>
    <circle class="il-white il-ink il-thin" cx="137.3" cy="104.5" r="1.9"/><circle class="il-white il-ink il-thin" cx="142.8" cy="104.5" r="1.9"/>
    <circle class="il-dark" cx="137.7" cy="103.9" r="0.9"/><circle class="il-dark" cx="143.2" cy="103.9" r="0.9"/><path class="il-line il-thin" d="M135.6 100.8L138.9 101.5M141.1 101.5L144.4 100.8"/><circle class="il-dark il-ink il-thin" cx="141.1" cy="108.3" r="0.8"/>`,

  // Kitchen duty swapped: a tower of dirty plates rises out of the sink up to the ceiling, the new dishwasher in yellow gloves sighs with a sponge, and the duty chart shows washing-up in every row.
  'fd.kitchen-duty-swap': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <rect class="il-white il-ink" x="6" y="12" width="30" height="40" rx="2"/>
    <path class="il-line il-thin" d="M6 22h30M6 32h30M6 42h30"/>
    <rect class="il-yellow il-ink il-thin" x="24" y="14" width="8" height="5" rx="1"/><rect class="il-yellow il-ink il-thin" x="24" y="24" width="8" height="5" rx="1"/><rect class="il-yellow il-ink il-thin" x="24" y="34" width="8" height="5" rx="1"/><rect class="il-yellow il-ink il-thin" x="24" y="44" width="8" height="5" rx="1"/>
    <path class="il-line il-thin" d="M10 17h10M10 27h10M10 37h10M10 47h10"/>
    <rect class="il-wood il-ink" x="0" y="72" width="160" height="32"/>
    <path class="il-line il-thin" d="M40 76v28M120 76v28M76 86h2M86 86h2"/>
    <rect class="il-metal il-ink" x="0" y="68" width="160" height="6"/>
    <path class="il-metal il-ink" d="M48 68h56l-4 10H52z"/>
    <ellipse class="il-white il-ink il-thin" cx="74" cy="66" rx="19" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="76.6" cy="60" rx="17" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="79.2" cy="54" rx="19" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="75.8" cy="48" rx="17" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="78.4" cy="42" rx="19" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="81" cy="36" rx="17" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="77.6" cy="30" rx="19" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="80.2" cy="24" rx="17" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="82.8" cy="18" rx="19" ry="3.6"/><ellipse class="il-white il-ink il-thin" cx="79.4" cy="12" rx="17" ry="3.6"/>
    <path class="il-earth" opacity="0.6" d="M64 60h6v2h-6zM86 48h5v2h-5zM66 36h4v2h-4zM90 24h4v2h-4z"/>
    <path class="il-white il-ink il-thin" d="M76 10v-8h12v8z"/><path class="il-line il-thin" d="M88 4q4 0 4 3t-4 3"/>
    <circle class="il-white il-ink il-thin" cx="46" cy="62" r="4" opacity="0.8"/><circle class="il-white il-ink il-thin" cx="40" cy="54" r="3" opacity="0.8"/><circle class="il-white il-ink il-thin" cx="104" cy="60" r="3.4" opacity="0.8"/><circle class="il-white il-ink il-thin" cx="110" cy="50" r="2.4" opacity="0.8"/><circle class="il-white il-ink il-thin" cx="58" cy="44" r="2" opacity="0.8"/>
    <g transform="translate(132 112) scale(0.86 0.86)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-blue il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-white il-ink il-thin" d="M-11 -54h22l2 34h-26z"/><path class="il-line il-thin" d="M-11 -52l-2-8M11 -52l2-8"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.2" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.2" r="1.5"/><path class="il-line il-thin" d="M-7.6 -83.2L-1.9 -86.2M1.9 -86.2L7.6 -83.2"/><path class="il-line il-thin" d="M-3.8 -71.9q3.8 -3.8 7.6 0"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-earth-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/></g>
    <g transform="translate(-12 -60) rotate(70)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><rect class="il-green il-ink il-thin" x="-36.9" y="-58.8" width="10" height="7" rx="2"/><rect class="il-yellow" x="-36.9" y="-53.8" width="10" height="2"/><circle class="il-yellow il-ink il-thin" cx="-28.9" cy="-53.8" r="4.2"/>
    <g transform="translate(12 -60) rotate(-10)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-yellow il-ink il-thin" cx="15.1" cy="-42.3" r="4.2"/>
    </g>
    <path class="il-line il-thin" d="M150 30q4 2 4 6M146 26q2-4 6-2"/>`,

  // Decanted: a goo creature is poured out of its old labelled jar into a new square tub with a blank label; it looks up confused, question marks popping, its old label drifting away.
  'fd.decanted': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <g transform="translate(46 30) rotate(125)"><rect class="il-white il-ink" x="-15" y="-18" width="30" height="34" rx="6.6"/>
    <rect class="il-orange" x="-13" y="5.8" width="26" height="8.2" rx="4.5"/>
    <path class="il-light il-thin" d="M-11.5 -13v15.3"/><rect class="il-paper il-ink il-thin" x="-12.5" y="-2.7" width="25" height="9.5" rx="1"/><path class="il-line il-thin" d="M-10 1.4h20"/><rect class="il-metal il-ink il-thin" x="-14" y="-22" width="28" height="5" rx="1.5"/></g>
    <path class="il-orange il-ink" d="M62 40q10 8 12 22 2 10 0 16h10q2-12-2-22-4-10-14-20z"/>
    <path class="il-light il-thin" d="M70 44q6 6 8 14"/>
    <rect class="il-white il-ink" x="56" y="70" width="52" height="34" rx="3"/>
    <rect class="il-orange" x="58" y="74" width="48" height="28" rx="2"/>
    <rect class="il-white" x="56" y="70" width="52" height="34" rx="3" opacity="0.3"/>
    <path class="il-orange il-ink" d="M58 76q6-12 22-12t26 12z"/>
    <circle class="il-white il-ink il-thin" cx="76" cy="75.2" r="2.7"/><circle class="il-white il-ink il-thin" cx="84" cy="75.2" r="2.7"/>
    <circle class="il-dark" cx="76" cy="75.2" r="1.3"/><circle class="il-dark" cx="84" cy="75.2" r="1.3"/><path class="il-line il-thin" d="M73.6 71.5L78.4 69.3M81.6 69.3L86.4 71.5"/><path class="il-line il-thin" d="M76 80.8l2 -1.2l2 1.2l2 -1.2l2 1.2"/>
    <rect class="il-paper il-ink il-thin" x="68" y="88" width="28" height="12" rx="1"/>
    <path class="il-line il-thin" d="M80 92q0-2 2-2t2 2-2 2v1M82 97v0.4"/>
    <rect class="il-blue il-ink" x="112" y="98" width="38" height="6" rx="2"/><rect class="il-blue il-ink il-thin" x="124" y="95" width="14" height="3" rx="1"/>
    <path class="il-line il-thin" d="M90 56q0-6 5-6t4 5-4 4v3M95 66v1M102 44q0-4 4-4t3 4-3 3v2M106 52v1"/>
    <g transform="translate(132 30) rotate(20)"><rect class="il-paper il-ink il-thin" x="-10" y="-6" width="20" height="12" rx="1"/><path class="il-line il-thin" d="M-6 -2h12M-6 2h8"/></g>
    <path class="il-line il-thin il-dash" opacity="0.5" d="M120 40q-8 8-2 16"/>`,

  // A small, round red radish in a blue cape raises a toothpick sword and a bottle-cap shield, glaring bravely up at a huge shadowy leftover looming over it.
  'fd.brave-radish': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <path class="il-dark" opacity="0.28" d="M84 104c-10-30 0-70 30-84 20-8 40 2 40 30v54z"/>
    <path class="il-dark" opacity="0.28" d="M104 26l-6-14 14 8M140 22l8-12 2 16"/>
    <circle class="il-glow il-ink il-thin" cx="116" cy="44" r="4"/><circle class="il-glow il-ink il-thin" cx="136" cy="42" r="4"/>
    <path class="il-line il-thin" d="M110 38l10 3M142 36l-10 3"/>
    <path class="il-blue il-ink" d="M64 58q-26 6-34 40 14-6 22-2 4-16 18-24z"/>
    <path class="il-light il-thin" opacity="0.5" d="M40 88q4-12 14-20"/>
    <ellipse class="il-green il-ink" cx="66" cy="34" rx="6" ry="14" transform="rotate(-30 66 34)"/>
    <ellipse class="il-grass il-ink" cx="74" cy="30" rx="6" ry="16"/>
    <ellipse class="il-green il-ink" cx="84" cy="34" rx="6" ry="14" transform="rotate(30 84 34)"/>
    <path class="il-line il-thin" d="M74 46v-26M70 44l-8-14M78 44l8-14"/>
    <path class="il-white il-ink" d="M60 86q14 14 30 0-4 10-12 12h-6q-8-2-12-12z"/>
    <path class="il-line il-thin" d="M75 98q1 4-2 6"/>
    <circle class="il-red il-ink" cx="75" cy="70" r="22"/>
    <path class="il-white" opacity="0.8" d="M57 80q18 14 36 0-4 10-18 12-14-2-18-12z"/>
    <path class="il-light il-thin" opacity="0.6" d="M60 62q2-8 10-12"/>
    <circle class="il-white il-ink il-thin" cx="70.3" cy="69.1" r="3.2"/><circle class="il-white il-ink il-thin" cx="79.8" cy="69.1" r="3.2"/>
    <circle class="il-dark" cx="70.3" cy="69.6" r="1.5"/><circle class="il-dark" cx="79.8" cy="69.6" r="1.5"/><path class="il-line il-thin" d="M67.4 62.9L73.1 66.7M76.9 66.7L82.6 62.9"/><path class="il-white il-ink il-thin" d="M70.3 74.8h9.5v3.2h-9.5z"/><path class="il-line il-thin" d="M70.3 76.4h9.5M73.5 74.8v3.2M76.5 74.8v3.2"/>
    <path class="il-line" d="M96 70l10-12"/>
    <path class="il-wood il-ink il-thin" d="M106 60l18-30 2 1-17 30z"/><path class="il-wood-dark il-ink il-thin" d="M101 56l12 8"/>
    <path class="il-line" d="M54 72l-8 4"/>
    <circle class="il-gold il-ink" cx="44" cy="78" r="10"/><circle class="il-yellow il-ink il-thin" cx="44" cy="78" r="6"/>
    <path class="il-line il-thin" d="M34 78h-2M54 78h2M44 68v-2M44 88v2M37 71l-1.4-1.4M51 85l1.4 1.4M51 71l1.4-1.4M37 85l-1.4 1.4"/>
    <path class="il-line" d="M68 92l-2 10M82 92l2 10"/><path class="il-dark il-ink il-thin" d="M60 102h7v3h-7zM83 102h7v3h-7z"/>
    <path class="il-red il-ink il-thin" d="M98 86q4-4 2-8 4 2 4 8z"/>`,

  // A milk carton with cow spots and red trainers sprints along the shelf, grinning, leaving a trail of frosty puffs and speed lines — fresh, cold and quick.
  'fd.fresh-milk': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <path class="il-white il-ink il-thin" d="M14 70q-6-6 2-10 2-8 10-4 8-2 8 6 4 6-4 8z" opacity="0.9"/>
    <path class="il-white il-ink il-thin" d="M22 92q-4-4 2-7 2-5 7-3 6-1 6 4 2 5-4 6z" opacity="0.9"/>
    <path class="il-line il-thin" d="M30 50h14M24 60h18M38 80h12M26 100h16"/>
    <g transform="rotate(10 80 70)">
    <path class="il-white il-ink" d="M58 44l22-16 22 16v48H58z"/>
    <path class="il-white il-ink il-thin" d="M76 22h8v9h-8z"/>
    <path class="il-line il-thin" d="M58 44h44"/>
    <path class="il-dark" d="M62 50q6-2 8 4-2 6-8 4zM92 74q6 0 6 6-4 4-8 0-2-4 2-6zM64 80q4 0 4 4-3 3-6 0z"/>
    <path class="il-blue il-ink il-thin" d="M58 84h44v8H58z"/>
    <circle class="il-white il-ink il-thin" cx="74.8" cy="61" r="3.6"/><circle class="il-white il-ink il-thin" cx="85.3" cy="61" r="3.6"/>
    <circle class="il-dark" cx="74.8" cy="61.3" r="1.7"/><circle class="il-dark" cx="85.3" cy="61.3" r="1.7"/><path class="il-line il-thin" d="M71.6 54.5L77.9 55.8M82.1 55.8L88.4 54.5"/><path class="il-dark il-ink il-thin" d="M74.8 66.7h10.5q0 6.3 -5.2 6.3t-5.2 -6.3z"/><path class="il-white" d="M75.4 67.3h9.2v1.7h-9.2z"/>
    <path class="il-red il-ink il-thin" d="M58 46l22-14 22 14v4l-22-14-22 14z"/>
    <path class="il-line" d="M58 64l-12 6M102 62l10-8"/>
    <circle class="il-white il-ink il-thin" cx="45" cy="71" r="3.4"/><circle class="il-white il-ink il-thin" cx="113" cy="53" r="3.4"/>
    <path class="il-line" d="M70 92l-6 8-6-2M90 92l8 6"/>
    <path class="il-red il-ink il-thin" d="M50 96q0-4 6-4l6 4v3H50z"/><path class="il-red il-ink il-thin" d="M96 94q0-4 6-4l6 4v3H96z"/>
    <path class="il-white il-thin il-ink" d="M50 99h12M96 97h12"/></g>
    <path class="il-line il-thin" d="M126 22v8M122.5 24l6.9 4M122.5 28l6.9 -4"/><path class="il-line il-thin" d="M140 47v6M137.4 48.5l5.2 3M137.4 51.5l5.2 -3"/><path class="il-white il-ink il-thin" d="M118 78q0.8 3.2 4 4q-3.2 0.8 -4 4q-0.8 -3.2 -4 -4q3.2 -0.8 4 -4z"/>`,

  // A cold leftover pizza slice in sunglasses lounges on a plate with frost on its crust, giving a thumbs-up and a speech bubble with a snowflake: best eaten cold.
  'fd.yesterdays-pizza': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-metal" opacity="0.7" d="M0 0h10l4 120H0z"/><path class="il-metal" opacity="0.7" d="M160 0h-10l-4 120h14z"/>
    <path class="il-line il-thin" opacity="0.3" d="M10 0l4 120M150 0l-4 120M2 20h9M2 50h10M2 80h11M158 20h-9M158 50h-10M158 80h-11"/>
    <path class="il-glow" opacity="0.22" d="M66 4h28l30 56H36z"/>
    <rect class="il-glow il-ink il-thin" x="68" y="0.6" width="24" height="5" rx="2"/>
    <path class="il-light il-thin" d="M72 3h8"/><rect class="il-water" x="0" y="104" width="160" height="5" opacity="0.7"/>
    <path class="il-line il-thin" d="M0 104h160M0 109h160"/>
    <path class="il-light il-thin" d="M16 106.5h40M92 106.5h18"/><rect class="il-metal" x="0" y="109" width="160" height="11" opacity="0.8"/>
    <path class="il-line il-thin" opacity="0.5" d="M60 114h40"/>
    <ellipse class="il-white il-ink" cx="74" cy="100" rx="44" ry="6"/>
    <path class="il-yellow il-ink" d="M44 40q30-10 60 0l-30 58z"/>
    <path class="il-yellow il-ink il-thin" d="M58 70q-2 8 2 10 3-3 0-10zM90 68q2 8-2 10-3-3 2-10z"/>
    <path class="il-wood il-ink" d="M42 36q32-12 64 0l-2 7q-30-10-60 0z"/>
    <path class="il-white il-ink il-thin" d="M48 34l2 4 2-4 3 3 2-5 3 4 3-5 3 4 3-5 3 4 3-4 3 5 3-4 3 4 2-3 3 4 2-3"/>
    <circle class="il-red il-ink il-thin" cx="60" cy="50" r="4"/><circle class="il-red il-ink il-thin" cx="90" cy="50" r="4"/><circle class="il-red il-ink il-thin" cx="74" cy="80" r="3.4"/>
    <circle class="il-slime il-ink il-thin" cx="82" cy="84" r="1.8"/><circle class="il-slime il-ink il-thin" cx="85" cy="80" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M60 58h11v5q0 4-5 4t-6-4zM77 58h11v5q0 4-5 4t-6-4z"/><path class="il-line il-thin" d="M71 60h6M60 59l-4-2M88 59l4-2"/>
    <path class="il-light il-thin" d="M62 60l3 3M79 60l3 3"/>
    <path class="il-line il-thin" d="M68 72q6 3 12-2"/>
    <path class="il-line" d="M96 62l12 2"/>
    <path class="il-yellow il-ink il-thin" d="M108 60h6v8h-8v-6z"/><rect class="il-yellow il-ink il-thin" x="110" y="54" width="3.6" height="8" rx="1.8"/>
    <rect class="il-white il-ink il-thin" x="124" y="90" width="12" height="12" rx="2" opacity="0.9"/><path class="il-light il-thin" d="M127 94l4-2"/>
    <path class="il-white il-ink il-thin" d="M108 16h40q4 0 4 4v18q0 4-4 4h-26l-8 8 2-8h-8q-4 0-4-4V20q0-4 4-4z"/>
    <path class="il-line il-thin" d="M120 23v12M114.8 26l10.4 6M114.8 32l10.4 -6"/>
    <path class="il-red il-ink il-thin" d="M134 25q2-4 5-1 3-3 5 1 0 4-5 8-5-4-5-8z"/>`,

  // In the egg tray of the fridge door sits a shrivelled, rock-hard old lemon with huge round owl spectacles, bushy white eyebrows and a beard tuft, smiling wisely; the eggs beside it gape in awe.
  'fd.mummified-lemon': `
    <rect class="il-white" x="0" y="0" width="160" height="120"/>
    <rect class="il-water" x="0" y="0" width="160" height="120" opacity="0.3"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 30h160"/>
    <path class="il-line il-thin" d="M140 0l20 18M146 0q2 8 14 8M152 0q0 6 8 4"/>
    <path class="il-line il-thin" d="M60 50l-14-10M60 44q-6-2-8-6M48 50q2-6 0-8" opacity="0.7"/>
    <ellipse class="il-paper il-ink" cx="22" cy="70" rx="11" ry="14"/><circle class="il-white il-ink il-thin" cx="19.3" cy="69.5" r="1.9"/><circle class="il-white il-ink il-thin" cx="24.8" cy="69.5" r="1.9"/>
    <circle class="il-dark" cx="19.3" cy="69.5" r="0.9"/><circle class="il-dark" cx="24.8" cy="69.5" r="0.9"/><path class="il-line il-thin" d="M17.6 66.2L20.9 65.1M23.1 65.1L26.4 66.2"/><ellipse class="il-dark il-ink il-thin" cx="22" cy="73.6" rx="1.3" ry="1.8"/>
    <ellipse class="il-paper il-ink" cx="138" cy="70" rx="11" ry="14"/><circle class="il-white il-ink il-thin" cx="135.3" cy="69.5" r="1.9"/><circle class="il-white il-ink il-thin" cx="140.8" cy="69.5" r="1.9"/>
    <circle class="il-dark" cx="135.3" cy="69.5" r="0.9"/><circle class="il-dark" cx="140.8" cy="69.5" r="0.9"/><path class="il-line il-thin" d="M133.6 66.2L136.9 65.1M139.1 65.1L142.4 66.2"/><ellipse class="il-dark il-ink il-thin" cx="138" cy="73.6" rx="1.3" ry="1.8"/>
    <path class="il-gold il-ink" d="M50 62q-7 0-7 4t7 4c2 12 14 20 30 20s28-8 30-20q7 0 7-4t-7-4c-2-12-14-20-30-20s-28 8-30 20z"/>
    <path class="il-earth" opacity="0.45" d="M54 70c2 8 10 14 20 16-8-6-10-12-8-18-4 2-8 2-12 2zM100 54q6 6 4 14-4-4-10-4 4-4 6-10z"/>
    <circle class="il-earth-dark" cx="62" cy="54" r="1.6" opacity="0.7"/><circle class="il-earth-dark" cx="98" cy="80" r="2" opacity="0.7"/><circle class="il-earth-dark" cx="104" cy="62" r="1.2" opacity="0.7"/>
    <path class="il-line il-thin" d="M56 58q4 4 2 10M104 58q-4 4-2 10M60 78l6-2M100 78l-6-2M70 46q4 3 8 1M84 47q4 2 8-1M66 86q4-2 8 0"/>
    <circle class="il-white il-ink il-thin" cx="71" cy="62" r="7"/><circle class="il-white il-ink il-thin" cx="89" cy="62" r="7"/>
    <circle class="il-dark" cx="72" cy="63" r="2.4"/><circle class="il-dark" cx="88" cy="63" r="2.4"/>
    <circle class="il-line" cx="71" cy="62" r="7"/><circle class="il-line" cx="89" cy="62" r="7"/><path class="il-line" d="M78 62h4M64 61l-8-3M96 61l8-3"/>
    <path class="il-white il-ink il-thin" d="M62 54q8-8 14-1-7-1-14 4zM98 54q-8-8-14-1 7-1 14 4z"/>
    <path class="il-line il-thin" d="M74 72q6 4 12 0"/>
    <path class="il-white il-ink il-thin" d="M75 76q5 12 10 0-5 2-10 0z"/>
    <path class="il-white il-ink" d="M6 85h32q0 11-16 11t-16-11z"/><path class="il-light il-thin" d="M12 88q2 4 8 6"/><path class="il-white il-ink" d="M64 85h32q0 11-16 11t-16-11z"/><path class="il-light il-thin" d="M70 88q2 4 8 6"/><path class="il-white il-ink" d="M122 85h32q0 11-16 11t-16-11z"/><path class="il-light il-thin" d="M128 88q2 4 8 6"/>
    <rect class="il-water il-ink" x="0" y="96" width="160" height="8" opacity="0.8"/>
    <rect class="il-white il-ink il-thin" x="0" y="104" width="160" height="16"/>
    <path class="il-light il-thin" d="M10 100h40M100 100h30"/>
    <path class="il-line il-thin" d="M34 52l4-3M126 52l-4-3M30 48l2-5M130 48l-2-5"/>`,

  // The leftover chef stirs a huge steaming pot while a crust, half a lemon, a fish skeleton and a limp lettuce leaf fly in; the chalkboard proudly advertises it with stars as the house speciality.
  'fd.leftover-chef': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <rect class="il-wood il-ink" x="6" y="8" width="44" height="34" rx="2"/><rect class="il-dark" x="9" y="11" width="38" height="28"/>
    <path class="il-light il-thin" d="M16 28q12 10 24 0zM14 28h28M22 22q-2-4 0-6M30 22q-2-4 0-6"/>
    <path class="il-yellow il-ink il-thin" d="M16 13q0.6 2.4 3 3q-2.4 0.6 -3 3q-0.6 -2.4 -3 -3q2.4 -0.6 3 -3z"/><path class="il-yellow il-ink il-thin" d="M40 13q0.6 2.4 3 3q-2.4 0.6 -3 3q-0.6 -2.4 -3 -3q2.4 -0.6 3 -3z"/>
    <path class="il-light il-thin" opacity="0.7" d="M50 60q-4-8 0-14t0-14M62 58q-4-6 0-12M38 58q-4-6 0-12"/>
    <path class="il-wood il-ink il-thin" d="M58 14q8-6 14 0l-2 4q-5-4-10 0z"/>
    <path class="il-yellow il-ink il-thin" d="M76 30a8 8 0 0 1 16 0z"/><path class="il-line il-thin" d="M84 30v-7M80 30l-3-5M88 30l3-5"/>
    <g transform="translate(40 34) rotate(-20)"><path class="il-line il-thin" d="M0 0h18M4 -4v8M8 -5v10M12 -4v8"/><path class="il-white il-ink il-thin" d="M18 0l6-4v8z"/><circle class="il-white il-ink il-thin" cx="-2" cy="0" r="2.4"/></g>
    <path class="il-green il-ink il-thin" d="M98 40q6-8 12-2-2 6-8 8z"/>
    <path class="il-line il-thin il-dash" opacity="0.5" d="M66 20q4 10 2 20M84 34q-4 10-10 14"/>
    <path class="il-metal il-ink" d="M24 66h68l-4 38H28z"/>
    <path class="il-dark il-ink il-thin" d="M18 70h8v6h-8zM90 70h8v6h-8z"/>
    <ellipse class="il-orange il-ink" cx="58" cy="66" rx="34" ry="6"/>
    <circle class="il-yellow" cx="48" cy="66" r="2"/><circle class="il-green" cx="62" cy="65" r="1.6"/><circle class="il-red" cx="70" cy="67" r="1.6"/>
    <path class="il-light il-thin" d="M30 80v16"/>
    <g transform="translate(118 114) scale(0.94 0.94)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-white il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-red il-ink il-thin" d="M-6 -64l6 4 6-4v5l-6 3-6-3z"/><circle class="il-dark" cx="-4" cy="-46" r="1"/><circle class="il-dark" cx="4" cy="-46" r="1"/><circle class="il-dark" cx="-4" cy="-38" r="1"/><circle class="il-dark" cx="4" cy="-38" r="1"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <path class="il-line il-thin" d="M-7.6 -79.9q2.8 2.8 5.7 0M1.9 -79.9q2.8 2.8 5.7 0"/><path class="il-line il-thin" d="M-7.6 -83.7q2.8 -1.9 5.7 0M1.9 -83.7q2.8 -1.9 5.7 0"/><path class="il-line il-thin" d="M-3.8 -74.2q3.8 3.8 7.6 0"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <rect class="il-white il-ink" x="-12" y="-94" width="24" height="9" rx="1"/><path class="il-white il-ink" d="M-12 -93q-10-6-4-14 2-8 10-6 6-6 12 0 8-2 10 6 6 8-4 14z"/><path class="il-line il-thin" d="M-4 -94v-6M4 -94v-6"/></g>
    <g transform="translate(-12 -60) rotate(64)"><rect class="il-white il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-metal il-ink il-thin" d="M-28.2 -52.1L-50.2 -46.1"/><path class="il-line" d="M-28.2 -52.1L-50.2 -46.1"/><circle class="il-skin il-ink il-thin" cx="-28.2" cy="-52.1" r="4.2"/>
    <g transform="translate(12 -60) rotate(-30)"><rect class="il-white il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="21" cy="-44.4" r="4.2"/>
    </g>`,

  // The kitchen helper wears a colander as a helmet, carries a frying pan and a spatula, and has a ladle, wooden spoon and grater on the apron belt — while a bowl of flour has already toppled over.
  'fd.kitchen-help': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <path class="il-white il-ink il-thin" d="M18 108q4-8 14-6 10-6 18 2 8 0 6 6-14 6-38-2z"/>
    <path class="il-red il-ink" d="M22 96q2 14 16 14t16-14z" transform="rotate(-40 38 100)"/>
    <circle class="il-white" cx="56" cy="98" r="2" opacity="0.8"/><circle class="il-white" cx="60" cy="92" r="1.4" opacity="0.8"/>
    <g transform="translate(84 116) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-teal il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-white il-ink il-thin" d="M-11 -56h22l2 36h-26z"/><path class="il-wood-dark il-ink il-thin" d="M-15 -36h30v5h-30z"/>
    <path class="il-wood il-ink il-thin" d="M-10 -36v-14"/><ellipse class="il-wood il-ink il-thin" cx="-10" cy="-52" rx="3" ry="4"/>
    <path class="il-metal il-ink il-thin" d="M8 -36v-12"/><circle class="il-metal il-ink il-thin" cx="8" cy="-50" r="4"/>
    <rect class="il-metal il-ink il-thin" x="-3" y="-34" width="7" height="12" rx="1"/><path class="il-line il-thin" d="M-1 -31h3M-1 -27h3"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.9" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.9" r="1.5"/><path class="il-line il-thin" d="M-7.6 -84.3L-1.9 -87M1.9 -87L7.6 -84.3"/><path class="il-line il-thin" d="M-4.7 -73.3l2.4 -1.4l2.4 1.4l2.4 -1.4l2.4 1.4"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-metal il-ink" d="M-16 -84q0-20 16-20t16 20z"/><path class="il-metal il-ink il-thin" d="M-20 -84h40v4h-40z"/><circle class="il-dark" cx="-6" cy="-94" r="1.4"/><circle class="il-dark" cx="2" cy="-98" r="1.4"/><circle class="il-dark" cx="8" cy="-90" r="1.4"/><circle class="il-dark" cx="-10" cy="-88" r="1.4"/><circle class="il-dark" cx="0" cy="-89" r="1.4"/><path class="il-metal il-ink il-thin" d="M-20 -84h-6v-3h6zM20 -84h6v-3h-6z"/></g>
    <g transform="translate(-12 -60) rotate(70)"><rect class="il-teal il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-dark il-ink il-thin" d="M-28.9 -53.8l-10 -8"/><circle class="il-dark il-ink" cx="-48.9" cy="-69.8" r="11"/><circle class="il-grey" cx="-48.9" cy="-69.8" r="7"/><circle class="il-skin il-ink il-thin" cx="-28.9" cy="-53.8" r="4.2"/>
    <g transform="translate(12 -60) rotate(-70)"><rect class="il-teal il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-wood-dark il-ink il-thin" d="M28.9 -53.8l6 -12"/><rect class="il-red il-ink il-thin" x="30.9" y="-83.8" width="12" height="16" rx="2" transform="rotate(25 36.9 -75.8)"/><path class="il-light il-thin" d="M34.9 -79.8l3 6M38.9 -81.8l3 6"/><circle class="il-skin il-ink il-thin" cx="28.9" cy="-53.8" r="4.2"/>
    </g>
    <ellipse class="il-water il-ink il-thin" cx="104" cy="28" rx="2" ry="3"/><ellipse class="il-water il-ink il-thin" cx="64" cy="30" rx="1.6" ry="2.4"/>
    <path class="il-line il-thin" d="M48 74l-4 2M120 74l4 2"/>`,

  // A gourmet with bow tie, curled moustache and tucked-in napkin lifts a fork with a single pea, pinky raised and nose in the air, waving away the rest of the plate; three gold stars hover above.
  'fd.gourmet': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <g transform="translate(64 116) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-purple il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-white il-ink il-thin" d="M-9 -62h18l-4 22-5 4-5-4z"/><path class="il-red il-ink il-thin" d="M-7 -66l7 3 7-3v7l-7-3-7 3z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(-10 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <path class="il-line il-thin" d="M-7.6 -79.9q2.8 2.8 5.7 0M1.9 -79.9q2.8 2.8 5.7 0"/><path class="il-line il-thin" d="M-7.6 -83.7q2.8 -1.9 5.7 0M1.9 -83.7q2.8 -1.9 5.7 0"/><path class="il-line il-thin" d="M-3.8 -74.2q3.8 3.8 7.6 0"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/><path class="il-dark il-ink il-thin" d="M-8 -71q4-3 8 0 4-3 8 0 4 2 6-2-2 5-6 5-4 0-8-2-4 2-8 2-4 0-6-5 2 4 6 2z"/></g>
    <g transform="translate(-12 -60) rotate(120)"><rect class="il-purple il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-skin il-ink il-thin" d="M-29.6 -72l-2 -6M-26.6 -73l0 -7M-23.6 -72l2 -6"/><circle class="il-skin il-ink il-thin" cx="-27.6" cy="-69" r="4.2"/>
    <g transform="translate(12 -60) rotate(-150)"><rect class="il-purple il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-metal il-ink il-thin" d="M21 -75.6l4 -14M23 -91.6l1 -4M26 -90.6l1 -4"/><circle class="il-green il-ink il-thin" cx="25" cy="-97.6" r="2.6"/><path class="il-skin il-ink il-thin" d="M24 -74.6q6 0 8-6"/><circle class="il-skin il-ink il-thin" cx="21" cy="-75.6" r="4.2"/>
    </g>
    <rect class="il-white il-ink" x="88" y="84" width="72" height="20"/>
    <path class="il-red" opacity="0.5" d="M88 88h72v3H88zM88 96h72v3H88z"/>
    <ellipse class="il-white il-ink" cx="124" cy="82" rx="26" ry="5"/>
    <path class="il-earth il-ink il-thin" d="M108 80q4-10 16-10t16 10z"/><path class="il-green il-ink il-thin" d="M112 74q4-6 8-1M126 72q4-6 8 0"/>
    <circle class="il-white il-ink il-thin" cx="121.8" cy="76.6" r="1.5"/><circle class="il-white il-ink il-thin" cx="126.3" cy="76.6" r="1.5"/>
    <circle class="il-dark" cx="121.8" cy="76.9" r="0.7"/><circle class="il-dark" cx="126.3" cy="76.9" r="0.7"/><path class="il-line il-thin" d="M120.4 75L123.1 73.6M124.9 73.6L127.6 75"/><path class="il-line il-thin" d="M122.2 80.4q1.8 -1.8 3.6 0"/>
    <path class="il-line il-thin" d="M98 70l-6-2M98 76h-6"/>
    <path class="il-gold il-ink il-thin" d="M108 14l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5zM126 8l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5zM144 14l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"/>`,

  // The fridge technician in blue overalls and cap listens to the humming fridge with a stethoscope, wrench in hand; the fridge sweats nervously, the toolbox waits on the floor.
  'fd.fridge-technician': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.12" d="M16 0v104M32 0v104M48 0v104M64 0v104M80 0v104M96 0v104M112 0v104M128 0v104M144 0v104M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-stone" x="0" y="104" width="160" height="16"/>
    <path class="il-line il-thin" opacity="0.25" d="M0 104h160M20 104l-8 16M60 104l-3 16M100 104l3 16M140 104l8 16M0 113h160"/>
    <path class="il-line" d="M0 104h160"/>
    <rect class="il-white il-ink" x="94" y="8" width="56" height="96" rx="4"/>
    <path class="il-line il-thin" d="M94 38h56"/><rect class="il-metal il-ink il-thin" x="98" y="14" width="4" height="16" rx="2"/><rect class="il-metal il-ink il-thin" x="98" y="44" width="4" height="22" rx="2"/>
    <path class="il-dark il-ink il-thin" d="M100 104v4h8v-4zM136 104v4h8v-4z"/>
    <circle class="il-white il-ink il-thin" cx="117.5" cy="58.7" r="4.4"/><circle class="il-white il-ink il-thin" cx="130.5" cy="58.7" r="4.4"/>
    <circle class="il-dark" cx="117.5" cy="58.7" r="2.1"/><circle class="il-dark" cx="130.5" cy="58.7" r="2.1"/><path class="il-line il-thin" d="M113.6 52.7L121.4 49.1M126.6 49.1L134.4 52.7"/><path class="il-line il-thin" d="M117.5 67.8l3.3 -1.9l3.3 2l3.3 -1.9l3.3 2"/>
    <ellipse class="il-water il-ink il-thin" cx="140" cy="48" rx="2" ry="3"/>
    <path class="il-line il-thin" d="M152 20l4 3-4 3 4 3M152 60l4 3-4 3 4 3M88 20l-4 3 4 3-4 3"/>
    <rect class="il-red il-ink" x="12" y="88" width="30" height="16" rx="2"/><path class="il-line il-thin" d="M20 88v-4h14v4M12 94h30"/>
    <g transform="translate(56 116) scale(-0.96 0.96)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-blue il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-blue il-ink il-thin" d="M-10 -54h20v14h-20z"/><path class="il-line il-thin" d="M-10 -54l-3-10M10 -54l3-10"/><circle class="il-gold" cx="-8" cy="-52" r="1.4"/><circle class="il-gold" cx="8" cy="-52" r="1.4"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-5.9" cy="-79.7" r="1.5"/><circle class="il-dark" cx="3.6" cy="-79.7" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.2L-1.9 -85.2M1.9 -85.2L7.6 -85.2"/><path class="il-line il-thin" d="M-2.8 -73.3h5.7"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-dark il-ink" d="M-13 -80c-2-12 5-18 14-18s14 6 12 16c-8 0-16-2-20-8-2 4-4 7-6 10z"/><path class="il-red il-ink" d="M-13 -86q0-14 13-14t13 14z"/><path class="il-red il-ink il-thin" d="M8 -87h14v3H6z"/></g>
    <g transform="translate(-12 -60) rotate(82)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-metal il-ink il-thin" cx="-32.8" cy="-57.5" r="4"/><circle class="il-skin il-ink il-thin" cx="-29.8" cy="-57.5" r="4.2"/>
    <g transform="translate(12 -60) rotate(-160)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><g transform="translate(18.2 -76.9) rotate(-20)"><rect class="il-metal il-ink il-thin" x="-2.6" y="-18" width="5.2" height="20" rx="2"/><path class="il-metal il-ink il-thin" d="M-7 -20a8 8 0 1 1 14 0l-3 2-1-6h-6l-1 6z"/></g><circle class="il-skin il-ink il-thin" cx="18.2" cy="-76.9" r="4.2"/>
    <path class="il-line il-thin" d="M-13 -76q-4 14 6 22 8 6 14 0M13 -76q4 14-6 22"/><path class="il-line" d="M-7 -54q-12 0-22 -3"/></g>`,

  // The herb gardener in a straw hat chats with a big potted basil on the windowsill; her speech bubble holds a heart, the basil answers with a bigger bubble full of exclamation marks while waving a leaf.
  'fd.herb-gardener': `
    <rect class="il-paper" x="0" y="0" width="160" height="120"/>
    <rect class="il-sky il-ink" x="70" y="6" width="84" height="66" rx="2"/>
    <path class="il-white" opacity="0.7" d="M84 28q0-6 6-6 2-6 10-4 6-2 8 4 6 0 4 6z"/>
    <path class="il-line" d="M112 6v66M70 40h84"/>
    <rect class="il-wood il-ink" x="62" y="72" width="98" height="8"/>
    <path class="il-wood-dark" opacity="0.5" d="M62 80h98v40H62z"/>
    <rect class="il-earth-dark il-ink" x="0" y="104" width="160" height="16"/>
    <path class="il-earth il-ink" d="M102 72l-4-20h36l-4 20z"/><rect class="il-earth il-ink" x="96" y="48" width="40" height="7" rx="2"/>
    <ellipse class="il-green il-ink il-thin" cx="116" cy="26" rx="7" ry="14" transform="rotate(-70 116 48)"/><ellipse class="il-grass il-ink il-thin" cx="116" cy="26" rx="7" ry="14" transform="rotate(-45 116 48)"/><ellipse class="il-green il-ink il-thin" cx="116" cy="26" rx="7" ry="14" transform="rotate(-20 116 48)"/><ellipse class="il-green il-ink il-thin" cx="116" cy="26" rx="7" ry="14" transform="rotate(20 116 48)"/><ellipse class="il-grass il-ink il-thin" cx="116" cy="26" rx="7" ry="14" transform="rotate(45 116 48)"/><ellipse class="il-green il-ink il-thin" cx="116" cy="26" rx="7" ry="14" transform="rotate(70 116 48)"/><path class="il-line il-thin" opacity="0.5" d="M116 48L96 41M116 48l-15-12M116 48l-7-18M116 48l7-18M116 48l15-12M116 48l20-7"/>
    <ellipse class="il-grass il-ink" cx="116" cy="36" rx="13" ry="15"/><path class="il-line il-thin" opacity="0.4" d="M116 22v6"/>
    <path class="il-grass il-ink il-thin" d="M130 40q8-2 10-10-8 0-10 6z"/>
    <circle class="il-white il-ink il-thin" cx="111.5" cy="33.1" r="3.1"/><circle class="il-white il-ink il-thin" cx="120.5" cy="33.1" r="3.1"/>
    <circle class="il-dark" cx="111.5" cy="33.4" r="1.4"/><circle class="il-dark" cx="120.5" cy="33.4" r="1.4"/><path class="il-line il-thin" d="M108.8 27.6L114.2 28.7M117.8 28.7L123.2 27.6"/><path class="il-dark il-ink il-thin" d="M111.5 38.1h9q0 5.4 -4.5 5.4t-4.5 -5.4z"/><path class="il-white" d="M112 38.5h7.9v1.4h-7.9z"/>
    <path class="il-white il-ink il-thin" d="M104 4h48q4 0 4 4v8q0 4-4 4h-26l-6 6 1-6h-17q-4 0-4-4V8q0-4 4-4z" transform="translate(0 0)"/>
    <path class="il-line" d="M118 8v6M128 8v6M138 8v6"/><circle class="il-dark" cx="118" cy="17" r="1"/><circle class="il-dark" cx="128" cy="17" r="1"/><circle class="il-dark" cx="138" cy="17" r="1"/>
    <g transform="translate(40 114) scale(0.9 0.9)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-earth-dark il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-green il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-4.7" cy="-79.7" r="1.5"/><circle class="il-dark" cx="4.8" cy="-79.7" r="1.5"/><path class="il-line il-thin" d="M-7.6 -84.7q2.8 -1.9 5.7 0M1.9 -84.7q2.8 -1.9 5.7 0"/><path class="il-line il-thin" d="M-3.8 -74.2q3.8 3.8 7.6 0"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-earth il-ink" d="M-14 -66c-4-22 2-32 14-32s18 10 14 32l-4-2c1-8 0-14-2-18-6 2-14 0-18-6-2 6-2 14 0 24z"/><ellipse class="il-gold il-ink" cx="0" cy="-90" rx="22" ry="5"/><path class="il-gold il-ink" d="M-11 -90q0-14 11-14t11 14z"/><path class="il-red il-ink il-thin" d="M-11 -93q11 3 22 0v3q-11 3-22 0z"/></g>
    <g transform="translate(-12 -60) rotate(10)"><rect class="il-green il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="-15.1" cy="-42.3" r="4.2"/>
    <g transform="translate(12 -60) rotate(-70)"><rect class="il-green il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><path class="il-metal il-ink il-thin" d="M28.9 -53.8l6 -4"/><path class="il-metal il-ink il-thin" d="M33.9 -59.8q6-6 10-2-2 6-8 6z"/><circle class="il-skin il-ink il-thin" cx="28.9" cy="-53.8" r="4.2"/>
    </g>
    <path class="il-white il-ink il-thin" d="M6 4h28q4 0 4 4v8q0 4-4 4h-4l2 8-8-8H6q-4 0-4-4V8q0-4 4-4z"/>
    <path class="il-red il-ink il-thin" d="M15 10q2-4 5 0 3-4 5 0 0 4-5 7-5-3-5-7z"/>`,

  // The night inspector in striped pyjamas, nightcap and headlamp shines a beam into the open fridge and ticks a clipboard; a startled sheet ghost flees, shielding its eyes from the light.
  'fd.midnight-inspector': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.08" d="M16 0v100M32 0v100M48 0v100M64 0v100M80 0v100M96 0v100M112 0v100M128 0v100M144 0v100M0 16h160M0 32h160M0 48h160M0 64h160M0 80h160M0 96h160"/>
    <rect class="il-dark" x="0" y="100" width="160" height="20"/>
    <path class="il-line il-thin" opacity="0.5" d="M0 100h160M20 100l-8 20M60 100l-3 20M100 100l3 20M140 100l8 20M0 109h160"/>
    <path class="il-line" d="M0 100h160"/>
    <rect class="il-sky il-ink il-thin" x="6" y="10" width="26" height="24" rx="1"/><circle class="il-white" cx="24" cy="19" r="5"/><circle class="il-sky" cx="26" cy="17" r="4.4"/><path class="il-line il-thin" d="M19 10v24M6 22h26"/>
    <rect class="il-white il-ink" x="88" y="12" width="56" height="90" rx="4"/>
    <rect class="il-glow" x="92" y="16" width="48" height="82" opacity="0.6"/>
    <path class="il-line il-thin" d="M92 44h48M92 70h48"/>
    <rect class="il-red il-ink il-thin" x="96" y="58" width="10" height="12" rx="2"/><rect class="il-white il-ink il-thin" x="122" y="54" width="8" height="16" rx="1.5"/><ellipse class="il-yellow il-ink il-thin" cx="114" cy="96" rx="9" ry="2" />
    <path class="il-white il-ink" d="M144 12l14 8v76l-14 6z"/>
    <path class="il-torch" d="M57 38L98 22v44z"/>
    <path class="il-white il-ink" d="M98 52q-2-26 14-26t16 22l2 14-5-3-3 4-4-4-4 4-4-4-4 3z" transform="rotate(-12 112 44)"/>
    <path class="il-line" d="M100 36l-8-6M124 34l6-6" transform="rotate(-12 112 44)"/>
    <ellipse class="il-white il-ink il-thin" cx="102" cy="36" rx="5" ry="3" transform="rotate(-30 102 36)"/><ellipse class="il-white il-ink il-thin" cx="121" cy="32" rx="5" ry="3" transform="rotate(30 121 32)"/>
    <ellipse class="il-dark il-ink il-thin" cx="111" cy="46" rx="3" ry="4" transform="rotate(-12 112 44)"/>
    <path class="il-light il-thin" d="M134 30l6-4M136 38h7M84 20l-4-4"/>
    <g transform="translate(44 112) scale(-0.86 0.86)">
    <ellipse class="il-dark" cx="0" cy="0" rx="20" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-7" cy="-3" rx="7" ry="3.6"/><ellipse class="il-dark il-ink" cx="7" cy="-3" rx="7" ry="3.6"/>
    <path class="il-blue il-ink" d="M-12 -38h24l-1 35h-9l-2-26-2 26h-9z"/>
    <path class="il-blue il-ink" d="M-15 -36c-1-17 2-30 15-30s16 13 15 30z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -64v58M2 -66v62M10 -62v54M-12 -56v50"/>
    <rect class="il-skin il-ink il-thin" x="-4" y="-69" width="8" height="6"/>
    <g transform="rotate(0 0 -70)">
    <circle class="il-skin il-ink il-thin" cx="-13" cy="-78" r="3"/><circle class="il-skin il-ink il-thin" cx="13" cy="-78" r="3"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-79" rx="13" ry="14"/>
    <circle class="il-white il-ink il-thin" cx="-4.7" cy="-79.9" r="3.2"/><circle class="il-white il-ink il-thin" cx="4.8" cy="-79.9" r="3.2"/>
    <circle class="il-dark" cx="-5.9" cy="-79.7" r="1.5"/><circle class="il-dark" cx="3.6" cy="-79.7" r="1.5"/><path class="il-line il-thin" d="M-7.6 -85.2L-1.9 -85.2M1.9 -85.2L7.6 -85.2"/><path class="il-line il-thin" d="M-2.8 -73.3h5.7"/>
    <path class="il-line il-thin" opacity="0.6" d="M0 -78q2 3-1 4"/>
    <path class="il-white il-ink il-thin" d="M-15 -86q15-5 28 0v4q-14-4-28 0z"/><path class="il-blue il-ink" d="M-14 -86q0-16 14-16 10 0 20 10l-4 3q-6-4-12-3 4 4 8 8z"/><circle class="il-white il-ink il-thin" cx="18" cy="-90" r="3.4"/><rect class="il-yellow il-ink il-thin" x="-17" y="-88" width="7" height="7" rx="2"/></g>
    <g transform="translate(-12 -60) rotate(50)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><rect class="il-wood il-ink il-thin" x="-41.8" y="-62.4" width="16" height="20" rx="1.5"/><rect class="il-white il-ink il-thin" x="-39.8" y="-59.4" width="12" height="15"/><path class="il-line il-thin" d="M-37.8 -55.4l1.5 1.5 3-3M-37.8 -49.4l1.5 1.5 3-3"/><circle class="il-skin il-ink il-thin" cx="-25.8" cy="-48.4" r="4.2"/>
    <g transform="translate(12 -60) rotate(30)"><rect class="il-blue il-ink" x="-4" y="-3" width="8" height="21" rx="4"/></g><circle class="il-skin il-ink il-thin" cx="3" cy="-44.4" r="4.2"/>
    </g>`,
};
