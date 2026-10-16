/* Kampfzwerge illustrations: encounter. */
export const ENCOUNTER: Readonly<Record<string, string>> = {
  // A huge monster fills the whole picture, wearing a first-prize rosette; a tiny gnome judge at its feet has to lean back to look up.
  'kz.prize-size': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <g transform="translate(86 116) scale(2.05 2.05)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-purple il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-purple-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-purple-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-purple-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-purple il-ink" cx="-26" cy="-18" rx="5" ry="7"/>
    <ellipse class="il-purple il-ink" cx="26" cy="-18" rx="5" ry="7"/>
    <path class="il-white il-ink il-thin" d="M-13 -31a5 5 0 0 0 10 0zM3 -31a5 5 0 0 0 10 0z"/>
    <circle class="il-dark" cx="-8" cy="-29" r="2"/>
    <circle class="il-dark" cx="8" cy="-29" r="2"/>
    <path class="il-line il-thin" d="M-13 -33h10M3 -33h10"/>
    <path class="il-line" d="M-8 -20q8 5 16-2"/>
    <path class="il-white il-ink il-thin" d="M4 -20l2 4 2-5z"/>
    <g transform="translate(-14 -10) scale(0.5)">
    <path class="il-blue il-ink" d="M-6 0l-6 20 7-4 4 6 3-22zM6 0l6 20-7-4-4 6-3-22z"/>
    <circle class="il-gold il-ink" cx="0" cy="0" r="10"/>
    <circle class="il-yellow il-ink il-thin" cx="0" cy="0" r="6"/>
    <path class="il-gold il-ink il-thin" d="M0 -4l1.2 2.6 2.8.3-2.1 1.9.6 2.8L0 2.2-2.5 3.6l.6-2.8-2.1-1.9 2.8-.3z"/>
    </g>
    </g>
    <g transform="translate(22 112) scale(0.32 0.32)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <rect class="il-wood il-ink il-thin" x="10" y="-36" width="16" height="20" rx="2"/>
    <rect class="il-white il-ink il-thin" x="12" y="-33" width="12" height="15"/>
    <circle class="il-skin il-ink" cx="14" cy="-24" r="5"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="-52" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="5" cy="-52" r="3.2"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.3"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.3"/>
    <path class="il-line il-thin" d="M-8 -58q3-2 6 0M2 -58q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-40" rx="2.6" ry="3.2"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    </g>
    <path class="il-line il-thin" d="M30 82l6-6M27 78l3-8"/>`,

  // An ancient grey monster with bushy white eyebrows, glasses, a cane and a cobweb on its horn proudly shows its pensioner pass in front of a tiny timbered mine entrance.
  'kz.older-than-the-mine': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-dark il-ink" d="M118 104V58h34v46z"/>
    <path class="il-wood il-ink" d="M114 104V54h6v50zM150 104V54h6v50zM110 48h50v8h-50z"/>
    <path class="il-line il-thin" d="M134 104l-10-8M142 104l10-8"/>
    <path class="il-metal il-ink il-thin" d="M126 104l4-10h10l4 10z"/>
    <g transform="translate(62 112) scale(1.75 1.75)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-grey il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-grey il-ink" cx="-27" cy="-20" rx="5" ry="6"/>
    <path class="il-line il-thick" d="M32 0V-24q0-6-5-6t-5 5"/>
    <ellipse class="il-grey il-ink" cx="31" cy="-22" rx="5" ry="5"/>
    <path class="il-white il-ink il-thin" d="M-13 -31a5 5 0 0 0 10 0zM3 -31a5 5 0 0 0 10 0z"/>
    <circle class="il-dark" cx="-8" cy="-29" r="2"/>
    <circle class="il-dark" cx="8" cy="-29" r="2"/>
    <path class="il-line il-thin" d="M-13 -33h10M3 -33h10"/>
    <path class="il-line" d="M-8 -20q8 5 16-2"/>
    <path class="il-white il-ink il-thin" d="M4 -20l2 4 2-5z"/>
    <path class="il-beard il-ink il-thin" d="M-17 -38q2-8 12-4-6 0-12 4zM17 -38q-2-8-12-4 6 0 12 4z"/>
    <path class="il-beard il-ink il-thin" d="M-6 -16q6 6 12 0-6 2-12 0z"/>
    <circle class="il-line il-thin" cx="-8" cy="-31" r="6"/>
    <circle class="il-line il-thin" cx="8" cy="-31" r="6"/>
    <path class="il-line il-thin" d="M-2 -31h4"/>
    <path class="il-line il-thin" opacity="0.6" d="M-20 -14q4 2 8 0M14 -10q4 2 8 0M-4 -44q4-2 8 0"/>
    <path class="il-light il-thin" opacity="0.8" d="M-22 -52l8 5M-22 -52l2 8M-22 -52l-4 6M-18 -49q-4 4-4 7M-17 -44q2-4 6-5"/>
    </g>
    <g transform="translate(14 66) rotate(-10)">
    <rect class="il-paper il-ink" x="0" y="0" width="26" height="18" rx="2"/>
    <circle class="il-grey il-ink il-thin" cx="7" cy="8" r="4"/>
    <path class="il-line il-thin" d="M14 6h8M14 10h8M14 14h5"/>
    </g>
    <ellipse class="il-grey il-ink" cx="26" cy="80" rx="6" ry="6"/>`,

  // A red-faced monster fumes steam behind a picket fence, jabbing a yellow folding ruler at a hedge branch that pokes just over the line.
  'kz.furious-fence': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 108l2-4 2 4M40 114l2-4 2 4M122 110l2-4 2 4M148 115l2-4 2 4"/>
    <path class="il-green il-ink" d="M118 100c-6-20 0-40 16-44 14-2 26 6 26 6v38z"/>
    <path class="il-green il-ink" d="M118 70c-8-2-16 0-22 6 6 2 14 0 22-2z"/>
    <path class="il-line il-thin" opacity="0.4" d="M126 70l4 4M140 64l3 5M136 84l4 3M150 76l3 4"/>
    <g transform="translate(60 104) scale(1.7 1.7)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-earth-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-earth-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-red il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-earth-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-earth-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-earth-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-red il-ink" cx="-27" cy="-22" rx="5" ry="7"/>
    <ellipse class="il-red il-ink" cx="27" cy="-26" rx="6" ry="5"/>
    <circle class="il-white il-ink il-thin" cx="-8" cy="-31" r="5"/>
    <circle class="il-white il-ink il-thin" cx="8" cy="-31" r="5"/>
    <circle class="il-dark" cx="-7" cy="-30" r="2.2"/>
    <circle class="il-dark" cx="7" cy="-30" r="2.2"/>
    <path class="il-line il-thick" d="M-15 -40l10 5M15 -40l-10 5"/>
    <path class="il-dark il-ink il-thin" d="M-11 -20q11-6 22 0q-11 9-22 0z"/>
    <path class="il-white il-ink il-thin" d="M-8 -21l2 4 2-4zM4 -21l2 4 2-4z"/>
    <path class="il-line il-thin" d="M14 -46l3 3-3 1 3 3"/>
    </g>
    <g transform="translate(104 60) rotate(-18)">
    <rect class="il-yellow il-ink" x="-24" y="-3" width="26" height="6"/>
    <path class="il-line il-thin" d="M-20 -3v3M-16 -3v2M-12 -3v3M-8 -3v2M-4 -3v3M0 -3v2"/>
    </g>
    <g class="il-white il-ink">
    <path d="M4 112V78l5-6 5 6v34zM24 112V78l5-6 5 6v34zM44 112V78l5-6 5 6v34zM64 112V78l5-6 5 6v34zM84 112V78l5-6 5 6v34zM104 112V78l5-6 5 6v34z"/>
    </g>
    <path class="il-white il-ink" d="M0 86h120v5H0zM0 102h120v5H0z"/>
    <path class="il-smoke il-ink il-thin" d="M36 30c-6-2-6-10 0-10 0-6 8-8 10-2 6-2 10 4 6 8 2 6-8 8-10 4-2 2-6 2-6 0z"/>
    <path class="il-smoke il-ink il-thin" d="M76 26c-4-2-4-8 0-8 0-5 7-6 9-2 5-1 8 4 5 7 1 5-7 6-9 3-2 2-5 1-5 0z"/>
    <path class="il-line il-thick" d="M112 46l2-10M118 48l6-8"/>`,

  // One monster up front, the whole extended family crowding behind it: one carries a pink layer cake, another a nail-studded plank.
  'kz.brought-cousins': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <g transform="translate(30 92) scale(0.9 0.9)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-teal il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-teal il-ink" cx="-26" cy="-18" rx="5" ry="7"/>
    <ellipse class="il-teal il-ink" cx="26" cy="-18" rx="5" ry="7"/>
    <circle class="il-dark" cx="-8" cy="-30" r="2.4"/>
    <circle class="il-dark" cx="8" cy="-30" r="2.4"/>
    <path class="il-dark il-ink il-thin" d="M-9 -22q9 9 18 0z"/>
    </g>
    <g transform="translate(136 90) scale(0.9 0.9)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-earth-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-earth-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-orange il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-earth-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-earth-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-earth-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-orange il-ink" cx="-26" cy="-18" rx="5" ry="7"/>
    <g transform="rotate(-20 26 -24)">
    <rect class="il-wood il-ink" x="20" y="-74" width="14" height="52" rx="2"/>
    <path class="il-line il-thin" opacity="0.4" d="M24 -68v20M30 -60v14"/>
    <path class="il-metal il-ink il-thin" d="M18 -66h-4M36 -60h4M18 -52h-4M36 -46h4M18 -38h-4"/>
    </g>
    <ellipse class="il-orange il-ink" cx="26" cy="-22" rx="6" ry="6"/>
    <circle class="il-white il-ink il-thin" cx="-8" cy="-31" r="5"/>
    <circle class="il-white il-ink il-thin" cx="8" cy="-31" r="5"/>
    <circle class="il-dark" cx="-7" cy="-30" r="2.2"/>
    <circle class="il-dark" cx="7" cy="-30" r="2.2"/>
    <path class="il-line" d="M-13 -39l8 3M13 -39l-8 3"/>
    <path class="il-dark il-ink il-thin" d="M-11 -20q11-6 22 0q-11 9-22 0z"/>
    <path class="il-white il-ink il-thin" d="M-8 -21l2 4 2-4zM4 -21l2 4 2-4z"/>
    </g>
    <g transform="translate(56 100) scale(1.05 1.05)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-green il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-dark" cx="16" cy="-24" r="1.3"/>
    <path class="il-pink il-ink" d="M-38 -34h28v10h-28zM-36 -44h24v10h-24z"/>
    <path class="il-white il-ink il-thin" d="M-36 -44q6 4 12 0t12 0"/>
    <circle class="il-red il-ink il-thin" cx="-24" cy="-48" r="3"/>
    <ellipse class="il-white il-ink il-thin" cx="-24" cy="-23" rx="17" ry="3"/>
    <ellipse class="il-green il-ink" cx="-28" cy="-22" rx="5" ry="5"/>
    <ellipse class="il-green il-ink" cx="26" cy="-18" rx="5" ry="7"/>
    <circle class="il-dark" cx="-8" cy="-30" r="2.4"/>
    <circle class="il-dark" cx="8" cy="-30" r="2.4"/>
    <path class="il-dark il-ink il-thin" d="M-9 -22q9 9 18 0z"/>
    </g>
    <g transform="translate(100 116) scale(1.35 1.35)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-purple il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-purple-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-purple-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-purple-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-purple il-ink" cx="-26" cy="-18" rx="5" ry="7"/>
    <ellipse class="il-purple il-ink" cx="26" cy="-18" rx="5" ry="7"/>
    <circle class="il-white il-ink il-thin" cx="-8" cy="-31" r="5"/>
    <circle class="il-white il-ink il-thin" cx="8" cy="-31" r="5"/>
    <circle class="il-dark" cx="-7" cy="-30" r="2.2"/>
    <circle class="il-dark" cx="7" cy="-30" r="2.2"/>
    <path class="il-line" d="M-13 -39l8 3M13 -39l-8 3"/>
    <path class="il-dark il-ink il-thin" d="M-11 -20q11-6 22 0q-11 9-22 0z"/>
    <path class="il-white il-ink il-thin" d="M-8 -21l2 4 2-4zM4 -21l2 4 2-4z"/>
    </g>`,

  // A shiny new monster sits in a black plastic plant pot on a garden-centre shelf, a price tag still dangling from its horn – old price crossed out, a red sale star beside it.
  'kz.fresh-from-garden-centre': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood-dark il-ink" x="0" y="96" width="160" height="8"/>
    <rect class="il-wood-dark" x="10" y="104" width="6" height="16"/>
    <rect class="il-wood-dark" x="144" y="104" width="6" height="16"/>
    <path class="il-green il-ink il-thin" d="M14 96c-2-10 4-16 8-16s8 6 6 16zM134 96c-4-12 2-20 8-18 6 2 6 10 4 18z"/>
    <path class="il-dark il-ink il-thin" d="M12 96l2-8h12l2 8zM132 96l2-8h12l2 8z"/>
    <g transform="translate(74 82) scale(1.35 1.35)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-purple il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-purple-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-purple-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-purple-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-purple il-ink" cx="-26" cy="-18" rx="5" ry="7"/>
    <ellipse class="il-purple il-ink" cx="26" cy="-18" rx="5" ry="7"/>
    <circle class="il-dark" cx="-8" cy="-30" r="2.4"/>
    <circle class="il-dark" cx="8" cy="-30" r="2.4"/>
    <path class="il-dark il-ink il-thin" d="M-9 -22q9 9 18 0z"/>
    <path class="il-light" d="M-20 -26l3-3M20 -38l3 3M-4 -44l2-4"/>
    </g>
    <path class="il-dark il-ink" d="M42 72h64l-6 24H48z"/>
    <path class="il-light il-thin" opacity="0.4" d="M48 78h52"/>
    <path class="il-line il-thin" d="M98 46l14 2"/>
    <g transform="translate(110 40) rotate(14)">
    <path class="il-paper il-ink" d="M0 4l6-6h26v20H6z"/>
    <circle class="il-wood il-ink il-thin" cx="5" cy="4" r="1.5"/>
    <path class="il-line il-thin" d="M12 2h14"/>
    <path class="il-line" d="M10 4l18-5"/>
    <path class="il-red il-ink il-thin" d="M12 9h14v3H12z"/>
    </g>
    <path class="il-red il-ink" d="M134 18l3 6 7-1-4 6 4 6-7-1-3 6-3-6-7 1 4-6-4-6 7 1z"/>
    <path class="il-white" d="M131 27h6v3h-6z"/>`,

  // A monster snoozes in a striped deckchair with a half-eaten sandwich on its belly and a steaming mug beside it; sleep zigzags float up.
  'kz.lunch-break': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 108l2-4 2 4M40 114l2-4 2 4M122 110l2-4 2 4M148 115l2-4 2 4"/>
    <circle class="il-yellow" cx="138" cy="18" r="10"/>
    <path class="il-wood-dark il-ink" d="M30 110l30-46M112 110l-20-44M44 108l70-6"/>
    <path class="il-red il-ink" d="M50 60l50 0 16 40-56 0z"/>
    <path class="il-white" d="M60 60h10l14 40h-10zM80 60h10l14 40h-10z"/>
    <path class="il-line" d="M50 60h50l16 40H60z"/>
    <g transform="translate(84 98) scale(1.3 1.3)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-purple il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-purple-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-purple-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-purple-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-purple il-ink" cx="-26" cy="-14" rx="7" ry="5"/>
    <ellipse class="il-purple il-ink" cx="26" cy="-14" rx="7" ry="5"/>
    <path class="il-line" d="M-12 -30q4 3 8 0M4 -30q4 3 8 0"/>
    <ellipse class="il-dark" cx="0" cy="-19" rx="3" ry="2.4"/>
    <path class="il-yellow il-ink il-thin" d="M-12 -8l16-2-4 8z"/>
    <path class="il-green il-thin il-ink" d="M-11 -9l14-2"/>
    <path class="il-wood il-ink il-thin" d="M-12 -6l14-1-2 5z"/>
    </g>
    <path class="il-light" transform="translate(104 30) scale(1.2)" d="M0 0h7l-7 7h7M10 -10h5l-5 5h5M18 -18h4l-4 4h4"/>
    <path class="il-blue il-ink" d="M18 92h14v14H18z"/>
    <path class="il-line" d="M32 96q6 0 6 4t-6 4"/>
    <path class="il-light il-thin" d="M22 88q-2-4 0-7M27 88q2-4 0-7"/>`,

  // A dark rain cloud drops a second, surprised monster straight onto the little umbrella of a first one that was just sheltering from the rain.
  'kz.come-in-pairs': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <path class="il-smoke il-ink" d="M66 22c-10 0-12-12 0-12 2-8 18-10 22-3 6-7 22-5 22 3 8-2 16 4 12 10 4 4 0 8-6 8H70c-6 0-8-4-4-6z"/>
    <path class="il-grey" opacity="0.5" d="M70 24h48c-4 3-44 3-48 0z"/>
    <path class="il-water-line" d="M20 30l-4 10M40 50l-4 10M14 70l-4 10M140 40l-4 10M150 66l-4 10M30 88l-3 6M136 90l-3 6"/>
    <g transform="translate(96 54) scale(0.6 0.6)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-teal il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-teal il-ink" cx="-28" cy="-34" rx="5" ry="8" transform="rotate(30 -28 -34)"/>
    <ellipse class="il-teal il-ink" cx="28" cy="-34" rx="5" ry="8" transform="rotate(-30 28 -34)"/>
    <circle class="il-white il-ink il-thin" cx="-8" cy="-31" r="5.5"/>
    <circle class="il-white il-ink il-thin" cx="8" cy="-31" r="5.5"/>
    <circle class="il-dark" cx="-8" cy="-31" r="1.6"/>
    <circle class="il-dark" cx="8" cy="-31" r="1.6"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-18" rx="4" ry="5"/>
    </g>
    <path class="il-line il-thin" d="M80 30l-3-4M112 30l3-4M96 24v-3"/>
    <g transform="translate(92 114) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-purple-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-purple-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-purple il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-purple-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-purple-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-purple-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-purple il-ink" cx="-26" cy="-18" rx="5" ry="7"/>
    <circle class="il-white il-ink il-thin" cx="-8" cy="-31" r="5.5"/>
    <circle class="il-white il-ink il-thin" cx="8" cy="-31" r="5.5"/>
    <circle class="il-dark" cx="-8" cy="-31" r="1.6"/>
    <circle class="il-dark" cx="8" cy="-31" r="1.6"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-18" rx="4" ry="5"/>
    <path class="il-line" d="M24 -22V-50"/>
    <path class="il-red il-ink" d="M-4 -50q28-28 56 0q-7-5-14 0-7-5-14 0-7-5-14 0-7-5-14 0z"/>
    <path class="il-line il-thin" d="M24 -64v-4"/>
    <ellipse class="il-purple il-ink" cx="24" cy="-24" rx="5" ry="6"/>
    </g>`,

  // In the mine, a dwarf clobbers the rock (bang star, sound waves); from a neighbouring hole a monster with a huge cupped ear leans in to listen, more eyes glowing behind it.
  'kz.lured-by-noise': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-stone il-ink" d="M0 40h18l4 64H0z"/>
    <g transform="translate(40 108) scale(0.82 0.82)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-20 0v-8h12v8zM8 0v-8h12v8z"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <circle class="il-skin il-ink" cx="-24" cy="-24" r="5.5"/>
    <path class="il-wood il-ink" d="M18 -28l-36 -22 3-4 36 22z"/>
    <path class="il-metal il-ink" d="M-22 -70q8 8 10 22l-3 1q-3-10-12-18z" transform="rotate(-10 -18 -52)"/>
    <circle class="il-skin il-ink" cx="20" cy="-28" r="5.5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-orange il-ink" d="M-16 -54C-19 -30-7-16 0-13 7-16 19-30 16-54 11-46-11-46-16-54Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-8 -38l3 9M8 -38l-3 9M0 -36v12M-12 -44l3 6M12 -44l-3 6"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.9"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.9"/>
    <path class="il-line il-thin" d="M-9 -60q3-2 6 0M3 -60q3-2 6 0"/>
    <path class="il-dark" d="M-5 -44q5 6 10 0z"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -80 17-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5"/>
    <path class="il-line il-thin" d="M0 -78v14"/>
    <circle class="il-glow il-ink il-thin" cx="0" cy="-70" r="4"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M14 52l4 6 6-4-2 7 7 2-7 3 3 6-7-3-2 7-3-7-7 2 3-6-6-3 7-2-2-6z"/>
    <path class="il-light" d="M64 50q6 8 0 16M72 44q10 14 0 28M80 38q14 20 0 40"/>
    <path class="il-dark il-ink" d="M96 104c-2-30 6-60 30-64s34 20 34 34v30z"/>
    <circle class="il-glow" cx="140" cy="54" r="2"/>
    <circle class="il-glow" cx="146" cy="54" r="2"/>
    <circle class="il-glow" cx="134" cy="72" r="1.8"/>
    <circle class="il-glow" cx="140" cy="71" r="1.8"/>
    <g transform="translate(122 106) scale(1.15 1.15)">
    <ellipse class="il-dark" cx="0" cy="0" rx="26" ry="3" opacity="0.3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="8" ry="4"/>
    <ellipse class="il-dark il-ink" cx="12" cy="-2" rx="8" ry="4"/>
    <path class="il-white il-ink il-thin" d="M-16 -40l-6-12 12 5zM16 -40l6-12-12 5z"/>
    <path class="il-green il-ink" d="M-24 -3C-29 -30-17-48 0-48S29-30 24-3Q0 1-24 -3Z"/>
    <path class="il-light il-thin" opacity="0.4" d="M-16 -30q2-10 10-13"/>
    <circle class="il-dark" cx="12" cy="-14" r="2"/>
    <circle class="il-dark" cx="-14" cy="-10" r="1.6"/>
    <circle class="il-dark" cx="16" cy="-24" r="1.3"/>
    <ellipse class="il-green il-ink" cx="26" cy="-18" rx="5" ry="7"/>
    <circle class="il-white il-ink il-thin" cx="-8" cy="-31" r="5.5"/>
    <circle class="il-white il-ink il-thin" cx="8" cy="-31" r="5.5"/>
    <circle class="il-dark" cx="-8" cy="-31" r="1.6"/>
    <circle class="il-dark" cx="8" cy="-31" r="1.6"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="-18" rx="4" ry="5"/>
    <path class="il-green il-ink" d="M-24 -38c-14-8-20 4-18 12s10 10 16 4z"/>
    <path class="il-line il-thin" d="M-30 -32q4 2 2 6"/>
    <ellipse class="il-green il-ink" cx="-30" cy="-22" rx="6" ry="5"/>
    </g>`,

  // A creaky shed door swings open on cobwebs, rusty tools and a treasure chest overflowing with glittering gold – and one pair of eyes in the darkest corner.
  'kz.tool-shed': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 106h160v14H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 114l2-4 2 4M40 120l2-4 2 4M122 116l2-4 2 4M148 121l2-4 2 4"/>
    <path class="il-wood-dark il-ink" d="M14 106V36l66-24 66 24v70z"/>
    <path class="il-dark il-ink" d="M30 106V44h100v62z"/>
    <path class="il-wood il-ink" d="M30 106V44l-20-8v78z"/>
    <path class="il-line il-thin" d="M16 50v54M23 46v60"/>
    <circle class="il-metal il-ink il-thin" cx="26" cy="76" r="2"/>
    <path class="il-line il-light il-thin" opacity="0.6" d="M30 44l14 14M30 52l8-8M30 58l10-10M36 44v10"/>
    <circle class="il-glow" cx="118" cy="56" r="2"/>
    <circle class="il-glow" cx="124" cy="56" r="2"/>
    <path class="il-wood il-ink il-thin" d="M44 50h4v32h-4z"/>
    <path class="il-earth-dark il-ink il-thin" d="M38 82h16l-2 12q-6 4-12 0z"/>
    <path class="il-wood il-ink il-thin" d="M58 48h3v26h-3z"/>
    <path class="il-earth-dark il-ink il-thin" d="M50 48h19v4H50z"/>
    <path class="il-line il-thin" d="M52 52v5M56 52v5M64 52v5M68 52v5"/>
    <path class="il-glow" opacity="0.35" d="M60 104l14-30h42l14 30z"/>
    <path class="il-wood il-ink" d="M66 84h52v20H66z"/>
    <path class="il-wood il-ink" d="M66 84q26-18 52 0l2-8q-28-20-56 0z"/>
    <path class="il-gold il-ink il-thin" d="M66 90h52v4H66zM88 88h8v8h-8z"/>
    <path class="il-gold il-ink il-thin" d="M70 84c4-6 12-8 16-4 4-6 12-6 16 0 4-4 12-2 14 4z"/>
    <circle class="il-gold il-ink il-thin" cx="122" cy="102" r="3"/>
    <circle class="il-gold il-ink il-thin" cx="60" cy="102" r="3"/>
    <path class="il-yellow il-ink il-thin" d="M82 67l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M108 71l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M96 61l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // A dwarf grins and swings his pickaxe into a glowing zigzag gold vein, right under a sign showing a crossed-out shovel; nuggets fly.
  'kz.gold-vein': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-wood il-ink" d="M22 104V42h4v62z"/>
    <rect class="il-paper il-ink" x="6" y="22" width="36" height="24" rx="2"/>
    <circle class="il-red il-ink" cx="24" cy="34" r="9"/>
    <circle class="il-paper" cx="24" cy="34" r="6.5"/>
    <path class="il-dark" d="M21 40l4-8 2 1-4 8z"/>
    <path class="il-dark" d="M25 28h4v4h-4z" transform="rotate(25 27 30)"/>
    <path class="il-line il-thick" d="M18 28l12 12"/>
    <path class="il-gold il-ink" d="M90 0l10 26-8 12 22 16-8 16 26 18-4 6-28-20 8-16-22-16 8-12-10-30z"/>
    <g class="il-yellow il-ink il-thin">
    <circle cx="96" cy="18" r="3"/>
    <circle cx="102" cy="48" r="3.4"/>
    <circle cx="112" cy="70" r="3"/>
    <circle cx="128" cy="88" r="3.2"/>
    </g>
    <path class="il-light il-thin" d="M92 12l3 6M106 50l5 4M122 84l5 3"/>
    <g transform="translate(66 110) scale(0.95 0.95)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-20 0v-8h12v8zM8 0v-8h12v8z"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <circle class="il-skin il-ink" cx="-24" cy="-24" r="5.5"/>
    <path class="il-wood il-ink" d="M22 -26l26 -28 3 3-26 28z"/>
    <path class="il-metal il-ink" d="M38 -68q16 2 22 16l-3 1q-8-10-20-12z" transform="rotate(10 46 -58)"/>
    <circle class="il-skin il-ink" cx="24" cy="-28" r="5.5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-orange il-ink" d="M-16 -54C-19 -30-7-16 0-13 7-16 19-30 16-54 11-46-11-46-16-54Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-8 -38l3 9M8 -38l-3 9M0 -36v12M-12 -44l3 6M12 -44l-3 6"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.9"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.9"/>
    <path class="il-line il-thin" d="M-9 -60q3-2 6 0M3 -60q3-2 6 0"/>
    <path class="il-dark" d="M-5 -44q5 6 10 0z"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -80 17-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5"/>
    <path class="il-line il-thin" d="M0 -78v14"/>
    <circle class="il-glow il-ink il-thin" cx="0" cy="-70" r="4"/>
    </g>
    <path class="il-gold il-ink il-thin" d="M120 30l4-3 3 3-2 4-4 0zM136 46l4-2 2 4-3 3-3-2zM128 18l3-2 3 2-1 3h-4z"/>
    <path class="il-yellow il-ink il-thin" d="M140 25l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M112 93l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // A whole white beard hangs snagged in a trimmed privet hedge while the now bare-chinned gnome hurries off, clutching his naked chin and blushing.
  'kz.beard-in-hedge': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <path class="il-green il-ink" d="M4 104V40q0-8 8-8h54q8 0 8 8v64z"/>
    <path class="il-line il-thin" opacity="0.4" d="M12 44l4 3M26 40l4 3M44 46l4 3M58 40l4 3M14 62l4 3M34 58l4 3M52 64l4 3M20 82l4 3M42 80l4 3M60 86l4 3M10 96l4 3"/>
    <path class="il-beard il-ink" d="M50 52C48 72 58 84 64 86 70 84 82 72 80 52 74 58 56 58 50 52Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M58 64l2 8M70 64l-2 8M64 66v10"/>
    <path class="il-green il-ink il-thin" d="M50 52q6-8 12 0q-6 4-12 0zM70 50q6-8 12 0q-6 4-12 0z"/>
    <path class="il-line il-thin" d="M84 70h10M86 78h12M84 86h8"/>
    <g transform="translate(122 112) scale(0.92 0.92)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-line il-thin" opacity="0.5" d="M-4 -40q4 2 8 0"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="-52" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="5" cy="-52" r="3.2"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.3"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.3"/>
    <path class="il-line il-thin" d="M-8 -58q3-2 6 0M2 -58q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-40" rx="2.6" ry="3.2"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    <ellipse class="il-pink" opacity="0.7" cx="-8" cy="-44" rx="3" ry="2"/>
    <ellipse class="il-pink" opacity="0.7" cx="8" cy="-44" rx="3" ry="2"/>
    <circle class="il-skin il-ink" cx="-6" cy="-36" r="5"/>
    <circle class="il-skin il-ink" cx="5" cy="-35" r="5"/>
    <path class="il-water il-ink il-thin" d="M18 -64q-3 5 0 6q3-1 0-6z"/>
    </g>`,

  // A mine tunnel prop has snapped; out of a big pile of rubble pokes a dwarf with a badly dented hard hat, dazed stars circling, giving a feeble thumbs-up.
  'kz.mine-collapse': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 106h160v14H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-wood il-ink" d="M14 106V24h8v82zM16 20h60l-2 8H16z"/>
    <path class="il-wood il-ink" d="M140 106V60h8v46z"/>
    <path class="il-wood il-ink" d="M86 22l58 30-4 6-58-28z"/>
    <path class="il-smoke" opacity="0.6" d="M20 70c-10-6-4-18 8-14 4-10 20-10 24-2 10-6 26 0 22 12 14 0 20 14 8 18H24c-10 0-12-10-4-14z"/>
    <g transform="translate(80 102) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-20 0v-8h12v8zM8 0v-8h12v8z"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-orange il-ink" d="M-16 -54C-19 -30-7-16 0-13 7-16 19-30 16-54 11-46-11-46-16-54Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-8 -38l3 9M8 -38l-3 9M0 -36v12M-12 -44l3 6M12 -44l-3 6"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.9"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.9"/>
    <path class="il-line il-thin" d="M-9 -60h6M3 -60h6"/>
    <path class="il-line il-thin" d="M-4 -43h8"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -70-10-80-2-72 2-66 8-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5" transform="rotate(-8 0 -62)"/>
    <path class="il-line il-thin" d="M-6 -70l4 2M4 -72l-2 3"/>
    </g>
    <g class="il-stone il-ink">
    <ellipse cx="80" cy="106" rx="56" ry="18"/>
    <ellipse cx="48" cy="98" rx="14" ry="10"/>
    <ellipse cx="72" cy="94" rx="12" ry="8"/>
    <ellipse cx="96" cy="96" rx="14" ry="9"/>
    <ellipse cx="118" cy="102" rx="12" ry="9"/>
    <ellipse cx="62" cy="108" rx="10" ry="7"/>
    <ellipse cx="100" cy="110" rx="11" ry="7"/>
    <ellipse cx="64" cy="86" rx="10" ry="7"/>
    <ellipse cx="96" cy="84" rx="9" ry="7"/>
    <ellipse cx="82" cy="82" rx="8" ry="5"/>
    </g>
    <path class="il-line il-thin" opacity="0.4" d="M44 96l4 3M90 92l4 4M114 100l4 2"/>
    <path class="il-skin il-ink" d="M118 88v-8a4 4 0 0 1 8 0v8z"/>
    <rect class="il-skin il-ink" x="114" y="86" width="14" height="10" rx="4"/>
    <path class="il-yellow il-ink il-thin" d="M56 17l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M80 9l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-yellow il-ink il-thin" d="M104 17l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>
    <path class="il-line il-thin il-dash" d="M56 22q24-16 48 0"/>`,

  // A garden gnome glumly wears a round, striped knitted tea cosy with a bobble on top; a cheeky crow flies off with his red pointy hat.
  'kz.wrong-hat': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <g transform="translate(66 114) scale(0.98 0.98)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.9"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.9"/>
    <path class="il-line il-thin" d="M-8 -57q3-2 6 0M2 -55h6"/>
    <path class="il-line il-thin" d="M-4 -40q2-2 4 0t4 0"/>
    <path class="il-orange il-ink" d="M-22 -54C-24 -90 24-90 22-54Z"/>
    <path class="il-teal il-ink il-thin" d="M-23 -64h46l-1 6h-44zM-20 -76h40l-3 6h-34z"/>
    <path class="il-line il-thin" opacity="0.4" d="M-14 -82v24M-6 -84v26M2 -84v26M10 -83v25M17 -78v20"/>
    <path class="il-dark il-ink il-thin" d="M13 -58a4.5 6 0 1 1 9 0zM-22 -58a4.5 6 0 1 1 9 0z"/>
    <path class="il-orange il-ink" d="M-23 -56q3 4 6 0t6 0 6 0 6 0 6 0 6 0 6 0 6 0"/>
    <circle class="il-pink il-ink" cx="0" cy="-88" r="6"/>
    <path class="il-line il-thin" d="M-3 -90l6 4M-3 -86l6-4"/>
    </g>
    <g transform="translate(104 40) scale(1.3)">
    <path class="il-line il-thick" d="M-4 -6q0-6 5-6t5 5q0 4-5 5v4"/>
    <circle class="il-dark" cx="1" cy="8" r="2"/>
    </g>
    <g transform="translate(130 30)">
    <path class="il-red il-ink" d="M-8 10L4 -22 14 12q-11 -4-22 -2z" transform="rotate(20 4 0)"/>
    <path class="il-light il-thin" opacity="0.6" d="M2 -4l4-10" transform="rotate(20 4 0)"/>
    <path class="il-dark il-ink" d="M-14 16c0-8 10-12 16-8 6-4 12-2 12 4-4 8-22 10-28 4z"/>
    <path class="il-dark il-ink il-thin" d="M-4 10q-10-12-20-6 6 2 10 8zM6 10q10-10 18-4-6 4-10 8z"/>
    <circle class="il-white" cx="-8" cy="12" r="1.6"/>
    <path class="il-orange il-ink il-thin" d="M-14 14l-6 2 6 1z"/>
    </g>
    <path class="il-line il-thin" opacity="0.6" d="M100 66h-10M104 74h-14"/>`,

  // A deadpan garden gnome drips with fresh pink paint from hat to boots, standing in a pink puddle; a paint roller pokes in over the neighbour's fence.
  'kz.pink-paint': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g class="il-wood il-ink">
    <path d="M100 100V58l5-6 5 6v42zM116 100V58l5-6 5 6v42zM132 100V58l5-6 5 6v42zM148 100V58l5-6 5 6v42z"/>
    </g>
    <path class="il-wood il-ink" d="M96 66h64v5H96zM96 86h64v5H96z"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 108l2-4 2 4M40 114l2-4 2 4M122 110l2-4 2 4M148 115l2-4 2 4"/>
    <ellipse class="il-pink il-ink" cx="62" cy="110" rx="34" ry="6"/>
    <g transform="translate(62 110) scale(0.96 0.96)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-pink il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-pink il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-pink il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.9"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.9"/>
    <path class="il-line il-thin" d="M-8 -56h6M2 -56h6"/>
    <path class="il-line il-thin" d="M-4 -41h8"/>
    <path class="il-pink il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    <path class="il-pink il-ink il-thin" d="M-13 -50C-14 -40-6-32 0-30 6-32 14-40 13-50 8-44-8-44-13-50Z"/>
    <path class="il-pink il-ink il-thin" d="M-16 -58q4 10 0 14q-3-6 0-14zM14 -58q4 8 1 14q-4-4-1-14zM-18 -10q3 6 0 10q-3-4 0-10zM10 -14q3 6 0 10q-3-4 0-10z"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.9"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.9"/>
    <path class="il-line il-thin" d="M-8 -56h6M2 -56h6"/>
    <path class="il-line il-thin" d="M-4 -41h8"/>
    <path class="il-white" opacity="0.6" d="M-8 -80q2-6 4-8M-10 -30q2-4 4-5"/>
    </g>
    <g transform="translate(110 30) rotate(-30)">
    <rect class="il-pink il-ink" x="-16" y="-8" width="32" height="14" rx="5"/>
    <path class="il-metal il-ink il-thin" d="M16 -1h8v18"/>
    <rect class="il-wood il-ink" x="20" y="16" width="8" height="18" rx="3"/>
    </g>
    <path class="il-pink il-ink il-thin" d="M98 46q-2 8 0 10q2-2 0-10zM92 52q-2 6 0 8q2-2 0-8z"/>
    <path class="il-pink" d="M22 84a3 3 0 1 0 0.1 0zM102 98a2 2 0 1 0 0.1 0zM30 60a2 2 0 1 0 0.1 0z"/>`,

  // Two smug koi hold a gnome's boot up out of the pond between them; on the bank the gnome stands in one stripy sock, pleading.
  'kz.shoe-in-pond': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 70h160v50H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 78l2-4 2 4M40 84l2-4 2 4M122 80l2-4 2 4M148 85l2-4 2 4"/>
    <ellipse class="il-water il-ink" cx="96" cy="96" rx="62" ry="22"/>
    <path class="il-light il-thin" opacity="0.6" d="M56 92q6-3 12 0M120 108q6-3 12 0M110 84q5-2 10 0"/>
    <ellipse class="il-green il-ink il-thin" cx="140" cy="104" rx="9" ry="5"/>
    <path class="il-line il-thin" d="M140 104l6-3"/>
    <g transform="translate(78 92) rotate(-30)">
    <path class="il-orange il-ink" d="M-14 0c0-8 10-12 18-8l8-6v20l-8-4c-8 4-18 2-18-2z"/>
    <circle class="il-white" cx="-4" cy="-4" r="3"/>
    <circle class="il-white" cx="2" cy="2" r="2"/>
    <path class="il-white il-ink il-thin" d="M-11 -3a2 2 0 1 0 0.1 0z"/>
    <path class="il-line il-thin" d="M-13 -5h4"/>
    <circle class="il-dark" cx="-10" cy="-2.6" r="0.9"/>
    </g>
    <g transform="translate(120 92) rotate(30) scale(-1 1)">
    <path class="il-orange il-ink" d="M-14 0c0-8 10-12 18-8l8-6v20l-8-4c-8 4-18 2-18-2z"/>
    <circle class="il-white" cx="-4" cy="-4" r="3"/>
    <circle class="il-red" cx="2" cy="2" r="2"/>
    <path class="il-white il-ink il-thin" d="M-11 -3a2 2 0 1 0 0.1 0z"/>
    <path class="il-line il-thin" d="M-13 -5h4"/>
    <circle class="il-dark" cx="-10" cy="-2.6" r="0.9"/>
    </g>
    <path class="il-wood-dark il-ink" d="M86 68h12v14h12q6 0 6 6v4H86z"/>
    <path class="il-wood il-ink il-thin" d="M84 64h16v5H84z"/>
    <path class="il-dark il-ink il-thin" d="M86 92h30v3H86z"/>
    <path class="il-water il-ink il-thin" d="M78 80q-2 4 0 5q2-1 0-5zM118 78q-2 4 0 5q2-1 0-5z"/>
    <g transform="translate(26 92) scale(0.72 0.72)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="16" cy="-30" r="5"/>
    <circle class="il-skin il-ink" cx="22" cy="-28" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.9"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.9"/>
    <path class="il-line il-thin" d="M-8 -55l5-2M8 -55l-5-2"/>
    <path class="il-line il-thin" d="M-4 -39q4-4 8 0"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    <path class="il-white il-ink" d="M2 -6h14v6H2z"/>
    <path class="il-red" d="M5 -6h2v6H5zM10 -6h2v6h-2z"/>
    <path class="il-wood-dark il-ink" d="M-17 -3h16v-6h-16z"/>
    </g>`,

  // A shocked dwarf stares at the snapped stub of his pickaxe handle while the iron head clangs onto the ground next to a rock with barely a scratch.
  'kz.broken-pickaxe': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-stone il-ink" d="M110 104c-4-20 6-34 22-34s26 14 22 34z"/>
    <path class="il-line il-thin" d="M124 82l4 3"/>
    <g transform="translate(66 110) scale(1 1)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-20 0v-8h12v8zM8 0v-8h12v8z"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <circle class="il-skin il-ink" cx="-24" cy="-24" r="5.5"/>
    <path class="il-wood il-ink" d="M20 -22l10-34 3 4 2-5 2 5 2-2-10 34z"/>
    <path class="il-line il-thin" d="M38 -62l4-4M40 -54l6-1"/>
    <circle class="il-skin il-ink" cx="24" cy="-24" r="5.5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-orange il-ink" d="M-16 -54C-19 -30-7-16 0-13 7-16 19-30 16-54 11-46-11-46-16-54Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-8 -38l3 9M8 -38l-3 9M0 -36v12M-12 -44l3 6M12 -44l-3 6"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-white il-ink il-thin" cx="-6" cy="-56" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="6" cy="-56" r="3.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.3"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.3"/>
    <path class="il-line il-thin" d="M-9 -62q3-2 6 0M3 -62q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-42" rx="2.6" ry="3.2"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -80 17-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5"/>
    <path class="il-line il-thin" d="M0 -78v14"/>
    <circle class="il-glow il-ink il-thin" cx="0" cy="-70" r="4"/>
    </g>
    <g transform="translate(118 104) rotate(14)">
    <path class="il-metal il-ink" d="M-20 -8q20-12 40 0l-2 3q-18-8-36 0z"/>
    <rect class="il-wood il-ink il-thin" x="-4" y="-12" width="8" height="8" rx="1"/>
    <path class="il-wood il-ink il-thin" d="M-3 -12l1-4 2 2 2-3 1 5z"/>
    </g>
    <path class="il-line il-thin" d="M118 82l-4-6M126 80l2-7M132 84l6-5"/>
    <path class="il-yellow il-ink il-thin" d="M36 21l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // Under a clear sky with a smug little bird, a gnome holds up his ice-cream cone just as a big white splat lands right on the scoop.
  'kz.bird-droppings': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow" cx="22" cy="18" r="10"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <g transform="translate(118 22)">
    <path class="il-dark il-ink il-thin" d="M-10 0q-6-10-16-8 6 4 8 10zM10 0q6-10 16-8-6 4-8 10z"/>
    <ellipse class="il-dark il-ink il-thin" cx="0" cy="2" rx="11" ry="6"/>
    <circle class="il-white" cx="-5" cy="0" r="1.6"/>
    <path class="il-orange il-ink il-thin" d="M-11 2l-5 2 5 1z"/>
    </g>
    <path class="il-line il-thin il-dash" d="M114 30q-6 12-20 22"/>
    <g transform="translate(66 114) scale(0.95 0.95)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <path class="il-wood il-ink" d="M20 -34l6 -2 -3 20z"/>
    <path class="il-wood-dark il-thin" opacity="0.5" d="M21 -32l4 4M22 -26l2 2"/>
    <circle class="il-pink il-ink" cx="23" cy="-40" r="6"/>
    <circle class="il-skin il-ink" cx="23" cy="-22" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="-52" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="5" cy="-52" r="3.2"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.3"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.3"/>
    <path class="il-line il-thin" d="M-8 -58q3-2 6 0M2 -58q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-40" rx="2.6" ry="3.2"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    <path class="il-white il-ink il-thin" d="M17 -44c2-6 10-6 12 0 0 4-2 4-2 8-1 2-2 0-2-2-1 4-2 4-3 0-2 2-4 2-3-2-2 0-2-2-2-4z"/>
    <circle class="il-dark" cx="22" cy="-45" r="1"/>
    </g>
    <path class="il-line il-thin" d="M98 64l4-4M100 72l6-2"/>`,

  // Across the garden fence, a neighbour gnome in a dark suit with glasses and a briefcase holds up a sealed document; our gnome weeps as his golden lantern sails over to the other side.
  'kz.fence-dispute': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 108l2-4 2 4M40 114l2-4 2 4M122 110l2-4 2 4M148 115l2-4 2 4"/>
    <g transform="translate(38 114) scale(0.82 0.82)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-dark il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <rect class="il-paper il-ink il-thin" x="14" y="-50" width="16" height="22"/>
    <path class="il-line il-thin" d="M17 -45h10M17 -41h10M17 -37h6"/>
    <circle class="il-red il-ink il-thin" cx="25" cy="-32" r="3"/>
    <circle class="il-skin il-ink" cx="18" cy="-30" r="5"/>
    <rect class="il-wood-dark il-ink" x="-34" y="-28" width="18" height="14" rx="2"/>
    <path class="il-line il-thin" d="M-29 -28v-3h8v3"/>
    <circle class="il-skin il-ink" cx="-20" cy="-27" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.9"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.9"/>
    <path class="il-line il-thin" d="M-8 -56h6M2 -56h6"/>
    <path class="il-line il-thin" d="M-4 -41h8"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    <circle class="il-line il-thin" cx="-5" cy="-52" r="4"/>
    <circle class="il-line il-thin" cx="5" cy="-52" r="4"/>
    <path class="il-line il-thin" d="M-1 -52h2"/>
    <path class="il-white il-ink il-thin" d="M-4 -43l4 4 4-4v20h-8z"/>
    <path class="il-red il-ink il-thin" d="M-2 -39l2 1 2-1v10l-2 2-2-2z"/>
    </g>
    <g class="il-white il-ink">
    <path d="M74 106V66l5-6 5 6v40zM90 106V66l5-6 5 6v40z"/>
    </g>
    <path class="il-white il-ink" d="M68 74h38v5H68zM68 92h38v5H68z"/>
    <g transform="translate(128 114) scale(-0.82 0.82)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <path class="il-line il-thin" d="M-7.5 -52q2.5 2 5 0M2.5 -52q2.5 2 5 0M-8 -56l5-2M8 -56l-5-2"/>
    <path class="il-water il-ink il-thin" d="M-8 -50q-2 4 0 5q2-1 0-5z"/>
    <path class="il-water il-ink il-thin" d="M8 -50q-2 4 0 5q2-1 0-5z"/>
    <path class="il-dark" d="M-4 -39q4-5 8 0z"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    </g>
    <g transform="translate(80 36) rotate(-15)">
    <path class="il-gold il-ink" d="M-8 -12h16v4H-8zM-6 -8h12v14H-6zM-8 6h16v4H-8z"/>
    <rect class="il-glow il-thin il-ink" x="-3" y="-6" width="6" height="10"/>
    <path class="il-line il-thin" d="M-4 -12q4-6 8 0"/>
    </g>
    <path class="il-line il-thin il-dash" d="M120 44q-14-14-28-8"/>
    <path class="il-yellow il-ink il-thin" d="M70 15l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`,

  // A wide-eyed gnome holds the top of a complaint letter that unfolds in a long zigzag of written pages piling up on the lawn, while two of his cards flutter away.
  'kz.neighbour-complaint': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 112l2-4 2 4M40 118l2-4 2 4M122 114l2-4 2 4M148 119l2-4 2 4"/>
    <g transform="translate(46 112) scale(0.9 0.9)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <circle class="il-skin il-ink" cx="22" cy="-40" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="-52" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="5" cy="-52" r="3.2"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.3"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.3"/>
    <path class="il-line il-thin" d="M-8 -58q3-2 6 0M2 -58q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-40" rx="2.6" ry="3.2"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    </g>
    <g class="il-paper il-ink il-thin">
    <path d="M64 70l22-8 4 16-22 8z"/>
    <path d="M68 86l22-8 8 14-22 8z"/>
    <path d="M76 100l22-8 14 10-20 8z"/>
    <path d="M92 110l20-8 22 4-16 10z"/>
    <path d="M110 112l20-4 24 4-20 6z"/>
    </g>
    <path class="il-line il-thin" opacity="0.6" d="M69 70l14-5M70 75l14-5M72 80l10-4M72 88l14-5M74 92l14-5M80 101l14-5M83 105l12-4M98 110l12-4M116 113l12-2"/>
    <path class="il-red il-ink il-thin" d="M80 64a3 3 0 1 0 0.1 0z"/>
    <g transform="translate(110 30) rotate(20)">
    <rect class="il-white il-ink" x="-8" y="-11" width="16" height="22" rx="2"/>
    <path class="il-red" d="M0 -5l3 5-3 5-3-5z"/>
    </g>
    <g transform="translate(136 50) rotate(-25)">
    <rect class="il-white il-ink" x="-8" y="-11" width="16" height="22" rx="2"/>
    <path class="il-blue" d="M-3 -4h6v8h-6z"/>
    </g>
    <path class="il-line il-thin" d="M96 42l8-4M98 50l6 0M122 66l6-6"/>`,

  // A line of ants carries a sandwich and a cherry away from an open picnic basket on a checked blanket; the last ants are driving up with a tiny lorry for the rest. A gnome watches, aghast.
  'kz.picnic-ants': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 70h160v50H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 78l2-4 2 4M40 84l2-4 2 4M122 80l2-4 2 4M148 85l2-4 2 4"/>
    <path class="il-red il-ink" d="M10 112l20-38h110l14 38z"/>
    <path class="il-white" opacity="0.8" d="M36 74h14l-6 38H28zM70 74h14v38H68zM104 74h14l6 38h-14zM24 86h120l4 10H18z"/>
    <path class="il-line" d="M10 112l20-38h110l14 38z"/>
    <path class="il-wood il-ink" d="M54 78h52l-6 26H60z"/>
    <path class="il-wood-dark il-thin il-ink" d="M58 86h44M60 94h40"/>
    <path class="il-wood il-ink" d="M54 78l6-16h44l2 16" opacity="0.9"/>
    <path class="il-line" d="M68 78q12-20 24 0"/>
    <g transform="translate(24 72) scale(0.5 0.5)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="-52" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="5" cy="-52" r="3.2"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.3"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.3"/>
    <path class="il-line il-thin" d="M-8 -58q3-2 6 0M2 -58q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-40" rx="2.6" ry="3.2"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    </g>
    <g transform="translate(120 70)">
    <path class="il-yellow il-ink il-thin" d="M-8 -10l20 0-10 8z"/>
    <path class="il-green il-ink il-thin" d="M-8 -10h20"/>
    </g>
    <circle class="il-red il-ink il-thin" cx="138" cy="58" r="3.5"/>
    <path class="il-line il-thin" d="M138 55q2-4 5-4"/>
    <g transform="translate(118 72) scale(1.5)">
    <ellipse class="il-dark" cx="-3" cy="0" rx="2" ry="1.6"/>
    <ellipse class="il-dark" cx="0" cy="0" rx="1.4" ry="1.2"/>
    <ellipse class="il-dark" cx="3" cy="0" rx="2.2" ry="1.8"/>
    <path class="il-line il-thin" d="M-2 1l-1 3M0 1v3M2 1l1 3"/>
    </g>
    <g transform="translate(124 72) scale(1.5)">
    <ellipse class="il-dark" cx="-3" cy="0" rx="2" ry="1.6"/>
    <ellipse class="il-dark" cx="0" cy="0" rx="1.4" ry="1.2"/>
    <ellipse class="il-dark" cx="3" cy="0" rx="2.2" ry="1.8"/>
    <path class="il-line il-thin" d="M-2 1l-1 3M0 1v3M2 1l1 3"/>
    </g>
    <g transform="translate(136 62) scale(1.5)">
    <ellipse class="il-dark" cx="-3" cy="0" rx="2" ry="1.6"/>
    <ellipse class="il-dark" cx="0" cy="0" rx="1.4" ry="1.2"/>
    <ellipse class="il-dark" cx="3" cy="0" rx="2.2" ry="1.8"/>
    <path class="il-line il-thin" d="M-2 1l-1 3M0 1v3M2 1l1 3"/>
    </g>
    <g transform="translate(142 64) scale(1.5)">
    <ellipse class="il-dark" cx="-3" cy="0" rx="2" ry="1.6"/>
    <ellipse class="il-dark" cx="0" cy="0" rx="1.4" ry="1.2"/>
    <ellipse class="il-dark" cx="3" cy="0" rx="2.2" ry="1.8"/>
    <path class="il-line il-thin" d="M-2 1l-1 3M0 1v3M2 1l1 3"/>
    </g>
    <g transform="translate(100 86) scale(1.5)">
    <ellipse class="il-dark" cx="-3" cy="0" rx="2" ry="1.6"/>
    <ellipse class="il-dark" cx="0" cy="0" rx="1.4" ry="1.2"/>
    <ellipse class="il-dark" cx="3" cy="0" rx="2.2" ry="1.8"/>
    <path class="il-line il-thin" d="M-2 1l-1 3M0 1v3M2 1l1 3"/>
    </g>
    <g transform="translate(110 82) scale(1.5)">
    <ellipse class="il-dark" cx="-3" cy="0" rx="2" ry="1.6"/>
    <ellipse class="il-dark" cx="0" cy="0" rx="1.4" ry="1.2"/>
    <ellipse class="il-dark" cx="3" cy="0" rx="2.2" ry="1.8"/>
    <path class="il-line il-thin" d="M-2 1l-1 3M0 1v3M2 1l1 3"/>
    </g>
    <g transform="translate(120 20)">
    <rect class="il-blue il-ink" x="-20" y="-8" width="24" height="14" rx="1"/>
    <path class="il-blue il-ink" d="M4 -4h8l4 6v4H4z"/>
    <rect class="il-water il-thin il-ink" x="7" y="-2" width="5" height="4"/>
    <circle class="il-dark il-ink il-thin" cx="-14" cy="7" r="3"/>
    <circle class="il-dark il-ink il-thin" cx="10" cy="7" r="3"/>
    <circle class="il-dark" cx="9" cy="0" r="1.2"/>
    </g>
    <path class="il-line il-thin" d="M150 16h6M150 22h4"/>`,

  // A dark cloud rains on a garden party: the barbecue fizzles out in steam, bunting sags, and a soaked gnome holds a spatula with a sad burger patty.
  'kz.rain-on-party': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thin" opacity="0.35" d="M10 108l2-4 2 4M40 114l2-4 2 4M122 110l2-4 2 4M148 115l2-4 2 4"/>
    <path class="il-grey il-ink" d="M30 28c-12 0-12-16 2-14 2-10 20-12 24-2 8-8 26-6 26 6 10-2 18 4 14 12 6 6-2 12-10 10H34c-8 0-10-8-4-12z"/>
    <path class="il-water-line" d="M30 40l-4 14M46 40l-4 14M62 40l-4 14M78 40l-4 14M90 40l-4 14M40 62l-4 14M70 64l-4 14"/>
    <path class="il-line il-thin" d="M100 20q20 14 58 4"/>
    <path class="il-yellow il-ink il-thin" d="M108 24l4 10 4-8zM124 28l3 10 5-9zM140 28l2 10 6-10z"/>
    <path class="il-metal il-ink" d="M36 104l6-24M64 104l-6-24"/>
    <path class="il-dark il-ink" d="M26 80h48q-2 12-24 12T26 80z"/>
    <path class="il-metal il-line" d="M28 78h44"/>
    <path class="il-grey il-ink il-thin" d="M44 74q4-3 8 0"/>
    <path class="il-smoke il-ink il-thin" d="M40 66c-4-4 0-10 4-8 2-6 10-4 10 0 4 0 4 6 0 8z"/>
    <g transform="translate(112 112) scale(0.86 0.86)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <path class="il-metal il-ink il-thin" d="M-20 -26l-14-12 2-2 14 12z"/>
    <rect class="il-metal il-ink il-thin" x="-44" y="-50" width="14" height="10" rx="1" transform="rotate(-40 -37 -45)"/>
    <ellipse class="il-wood-dark il-ink il-thin" cx="-38" cy="-50" rx="6" ry="2.6" transform="rotate(-40 -38 -50)"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.9"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.9"/>
    <path class="il-line il-thin" d="M-8 -55l5-2M8 -55l-5-2"/>
    <path class="il-line il-thin" d="M-4 -39q4-4 8 0"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    <path class="il-water il-ink il-thin" d="M-14 -60q-3 5 0 6q3-1 0-6z"/>
    <path class="il-water il-ink il-thin" d="M16 -58q-3 5 0 6q3-1 0-6z"/>
    <path class="il-water il-ink il-thin" d="M-20 -12q-3 5 0 6q3-1 0-6z"/>
    <path class="il-water il-ink il-thin" d="M-24 0h48" opacity="0.6"/>
    </g>`,

  // A grim dwarf trudges along with each boot stuck in a huge lump of mud, splats flying, a trail of muddy footprints behind him.
  'kz.muddy-boots': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 90h160v30H0z"/>
    <g class="il-earth-dark">
    <ellipse cx="14" cy="104" rx="7" ry="3"/>
    <ellipse cx="34" cy="110" rx="7" ry="3"/>
    <ellipse cx="54" cy="102" rx="7" ry="3"/>
    </g>
    <g transform="translate(96 104) scale(1.05 1.05)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <circle class="il-skin il-ink" cx="-24" cy="-24" r="5.5"/>
    <circle class="il-skin il-ink" cx="24" cy="-24" r="5.5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-orange il-ink" d="M-16 -54C-19 -30-7-16 0-13 7-16 19-30 16-54 11-46-11-46-16-54Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-8 -38l3 9M8 -38l-3 9M0 -36v12M-12 -44l3 6M12 -44l-3 6"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.9"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.9"/>
    <path class="il-line il-thin" d="M-9 -60h6M3 -60h6"/>
    <path class="il-line il-thin" d="M-4 -43h8"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -80 17-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5"/>
    <path class="il-line il-thin" d="M0 -78v14"/>
    <circle class="il-glow il-ink il-thin" cx="0" cy="-70" r="4"/>
    <path class="il-earth-dark il-ink" d="M-28 4c-6-4-4-14 4-14 2-6 14-4 14 2 6 2 6 10 0 12z"/>
    <path class="il-earth-dark il-ink" d="M6 2c-4-6 0-14 8-12 4-6 14-2 12 4 6 4 2 10-4 10z"/>
    <path class="il-line il-thin" opacity="0.5" d="M-22 -4q4-2 6 0M12 -4q4-2 6 0"/>
    </g>
    <path class="il-earth-dark il-ink il-thin" d="M58 92a3 3 0 1 0 0.1 0zM136 90a3 3 0 1 0 0.1 0zM130 80a2 2 0 1 0 0.1 0zM62 80a2 2 0 1 0 0.1 0z"/>
    <path class="il-line il-thin" d="M64 98l-6-4M126 98l8-4M60 104h-6M132 104h6"/>`,

  // A dwarf scratches his head in front of a heavy mine door with a keypad flashing a red cross; next to him waits a cardboard box with his mug and lantern already packed.
  'kz.forgot-password': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-stone il-ink" d="M70 104V34q0-18 34-18t34 18v70z"/>
    <path class="il-wood-dark il-ink" d="M80 104V40q0-14 24-14t24 14v64z"/>
    <path class="il-line il-thin" d="M92 30v74M104 26v78M116 30v74"/>
    <path class="il-metal il-ink" d="M78 50h52v6H78zM78 80h52v6H78z"/>
    <rect class="il-metal il-ink" x="134" y="54" width="18" height="26" rx="2"/>
    <circle class="il-red il-ink il-thin" cx="143" cy="60" r="3"/>
    <path class="il-white" d="M141 58.5l3 3M144 58.5l-3 3"/>
    <path class="il-dark" d="M137 66h3v3h-3zM142 66h3v3h-3zM147 66h3v3h-3zM137 71h3v3h-3zM142 71h3v3h-3zM147 71h3v3h-3z"/>
    <g transform="translate(44 110) scale(0.95 0.95)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-20 0v-8h12v8zM8 0v-8h12v8z"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <circle class="il-skin il-ink" cx="-24" cy="-24" r="5.5"/>
    <circle class="il-skin il-ink" cx="18" cy="-66" r="5.5"/>
    <path class="il-green il-ink" d="M14 -36l6-26 6 2-4 26z"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-orange il-ink" d="M-16 -54C-19 -30-7-16 0-13 7-16 19-30 16-54 11-46-11-46-16-54Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-8 -38l3 9M8 -38l-3 9M0 -36v12M-12 -44l3 6M12 -44l-3 6"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.9"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.9"/>
    <path class="il-line il-thin" d="M-9 -61q3-2 6 0M3 -59h6"/>
    <path class="il-line il-thin" d="M-4 -42q2-2 4 0t4 0"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -80 17-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5"/>
    <path class="il-line il-thin" d="M0 -78v14"/>
    <circle class="il-glow il-ink il-thin" cx="0" cy="-70" r="4"/>
    </g>
    <g transform="translate(18 30) scale(1)">
    <path class="il-line il-thick" d="M-4 -6q0-6 5-6t5 5q0 4-5 5v4"/>
    <circle class="il-dark" cx="1" cy="8" r="2"/>
    </g>
    <g transform="translate(64 22) scale(0.8)">
    <path class="il-line il-thick" d="M-4 -6q0-6 5-6t5 5q0 4-5 5v4"/>
    <circle class="il-dark" cx="1" cy="8" r="2"/>
    </g>
    <path class="il-wood il-ink" d="M2 112v-18h24v18z"/>
    <path class="il-wood il-ink il-thin" d="M2 94l-2-5h12zM26 94l2-5H16z"/>
    <rect class="il-white il-ink il-thin" x="6" y="86" width="7" height="8" rx="1"/>
    <circle class="il-glow il-ink il-thin" cx="19" cy="89" r="4"/>`,

  // A beardless dwarf stares into a standing mirror – and a shiny ceramic garden gnome with a red pointy hat stares back; question marks hover.
  'kz.identity-crisis': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone" opacity="0.25" d="M0 0h160v14c-20 6-40-4-60 4s-50-2-70 6S10 18 0 22z"/>
    <path class="il-earth-dark" d="M0 106h160v14H0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M12 30l8 4M140 40l-8 6M20 70l6-3M150 80l-6-2"/>
    <path class="il-wood il-ink" d="M98 108l8-14M138 108l-8-14"/>
    <ellipse class="il-wood il-ink" cx="118" cy="56" rx="30" ry="42"/>
    <ellipse class="il-water il-ink" cx="118" cy="56" rx="24" ry="36"/>
    <g transform="translate(118 96) scale(-0.62 0.62)">
    <ellipse class="il-dark" cx="0" cy="0" rx="22" ry="3" opacity="0.3"/>
    <ellipse class="il-wood-dark il-ink" cx="-9" cy="-3" rx="8" ry="4"/>
    <ellipse class="il-wood-dark il-ink" cx="9" cy="-3" rx="8" ry="4"/>
    <path class="il-blue il-ink" d="M-18 -5C-20 -30-14-43 0-43S20-30 18-5Z"/>
    <path class="il-dark" d="M-19 -22h38v5h-38z"/>
    <rect class="il-gold il-ink il-thin" x="-4" y="-23" width="8" height="7" rx="1"/>
    <circle class="il-skin il-ink" cx="-20" cy="-25" r="5"/>
    <circle class="il-skin il-ink" cx="20" cy="-25" r="5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="13" ry="12"/>
    <path class="il-beard il-ink" d="M-13 -50C-14 -32-6-24 0-22 6-24 14-32 13-50 8-44-8-44-13-50Z"/>
    <path class="il-line il-thin" opacity="0.35" d="M-6 -36l2 6M5 -36l-2 6M0 -34v6"/>
    <circle class="il-pink il-ink il-thin" cx="0" cy="-47" r="3.6"/>
    <circle class="il-white" cx="-1" cy="-48.5" r="1"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="-52" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="5" cy="-52" r="3.2"/>
    <circle class="il-dark" cx="-5" cy="-52" r="1.3"/>
    <circle class="il-dark" cx="5" cy="-52" r="1.3"/>
    <path class="il-line il-thin" d="M-8 -58q3-2 6 0M2 -58q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-40" rx="2.6" ry="3.2"/>
    <path class="il-red il-ink" d="M-16 -57Q-8 -86 4 -104 8 -80 16 -57Q0 -61-16 -57Z"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 -66q4-14 9-28"/>
    </g>
    <path class="il-light" opacity="0.7" d="M100 34q2-8 8-12M134 74l4-6"/>
    <g transform="translate(50 112) scale(1.05 1.05)">
    <ellipse class="il-dark" cx="0" cy="0" rx="25" ry="3" opacity="0.3"/>
    <path class="il-dark il-ink" d="M-20 0v-8h12v8zM8 0v-8h12v8z"/>
    <path class="il-green il-ink" d="M-22 -6C-25 -30-18-46 0-46S25-30 22-6Z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-23 -16h46v6h-46z"/>
    <rect class="il-metal il-ink il-thin" x="-4" y="-17" width="8" height="8" rx="1"/>
    <circle class="il-skin il-ink" cx="-24" cy="-24" r="5.5"/>
    <circle class="il-skin il-ink" cx="6" cy="-38" r="5.5"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-54" rx="15" ry="13"/>
    <path class="il-skin il-ink il-thin" d="M-10 -46q10 8 20 0"/>
    <ellipse class="il-skin il-ink" cx="0" cy="-50" rx="5" ry="4.2"/>
    <circle class="il-white il-ink il-thin" cx="-6" cy="-56" r="3.2"/>
    <circle class="il-white il-ink il-thin" cx="6" cy="-56" r="3.2"/>
    <circle class="il-dark" cx="-6" cy="-56" r="1.3"/>
    <circle class="il-dark" cx="6" cy="-56" r="1.3"/>
    <path class="il-line il-thin" d="M-9 -62q3-2 6 0M3 -62q3-2 6 0"/>
    <ellipse class="il-dark" cx="0" cy="-42" rx="2.6" ry="3.2"/>
    <path class="il-yellow il-ink" d="M-17 -61C-17 -80 17-80 17-61Z"/>
    <rect class="il-yellow il-ink" x="-21" y="-64" width="42" height="5" rx="2.5"/>
    <path class="il-line il-thin" d="M0 -78v14"/>
    <circle class="il-glow il-ink il-thin" cx="0" cy="-70" r="4"/>
    </g>
    <g transform="translate(20 26) scale(1)">
    <path class="il-line il-thick" d="M-4 -6q0-6 5-6t5 5q0 4-5 5v4"/>
    <circle class="il-dark" cx="1" cy="8" r="2"/>
    </g>
    <g transform="translate(80 16) scale(0.8)">
    <path class="il-line il-thick" d="M-4 -6q0-6 5-6t5 5q0 4-5 5v4"/>
    <circle class="il-dark" cx="1" cy="8" r="2"/>
    </g>`
};
