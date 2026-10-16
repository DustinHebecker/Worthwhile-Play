/* Kampfzwerge illustrations: monsters1. */
export const MONSTERS1: Readonly<Record<string, string>> = {
  // A furious snail under its own little storm cloud, a long slime trail behind it, wearing a stolen boot on its shell as a trophy.
  'kz.grumpy-snail': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-slime" opacity="0.8" d="M118 95h42v5h-42c-3 0-3-5 0-5z"/>
    <path class="il-light il-thin" d="M128 97h8M144 97h10"/>
    <path class="il-stone il-ink" d="M18 98c0-6 6-8 12-10l4-18c2-10 18-10 20 0l4 18h66c8 0 10 10 2 10z"/>
    <path class="il-line il-thin" d="M60 92h50"/>
    <circle class="il-earth il-ink" cx="94" cy="64" r="28"/>
    <path class="il-earth-dark il-ink il-thin" d="M94 66c3 0 5-3 3-6-3-4-10-2-11 3-1 7 6 12 13 10 9-3 12-13 8-21-5-9-17-11-26-5"/>
    <path class="il-light il-thin" d="M76 50c3-5 8-8 13-9"/>
    <ellipse class="il-stone il-ink" cx="44" cy="62" rx="14" ry="12"/>
    <path class="il-line" d="M38 52 32 36M50 52l6-16"/>
    <circle class="il-white il-ink" cx="31" cy="34" r="6"/><circle class="il-dark" cx="33" cy="36" r="2.6"/>
    <circle class="il-white il-ink" cx="57" cy="34" r="6"/><circle class="il-dark" cx="55" cy="36" r="2.6"/>
    <path class="il-line il-thick" d="M24 28l12 4M64 28l-12 4"/>
    <path class="il-line" d="M36 68q8-6 16 0"/>
    <path class="il-line il-thin" d="M38 60l3 1M50 60l-3 1"/>
    <path class="il-red il-ink" d="M82 38v-10h10l2 5h10c5 0 7 3 7 6z"/>
    <path class="il-dark il-ink il-thin" d="M82 38h29v3H82z"/>
    <path class="il-line il-thin" d="M93 30l3 3M97 30l2 3"/>
    <path class="il-smoke il-ink" d="M30 20c-6 0-7-8 0-9 1-6 10-7 13-2 4-4 12-1 11 4 6 1 5 8-1 8z"/>
    <path class="il-yellow il-ink il-thin" d="M42 20l-4 7h4l-3 7 8-9h-4l3-5z"/>
    <path class="il-grass il-ink il-thin" d="M8 96l2-8 3 8M140 92l3-8 2 8M150 94l2-7 2 7"/>`,

  // A huge fluffy grey dust bunny in a mine tunnel (four tally marks on the beam) sneezing so hard a playing card flies away.
  'kz.dust-bunny': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-wood il-ink" d="M6 16h148v10H6zM10 26h10v78H10zM140 26h10v78h-10z"/>
    <path class="il-line" d="M112 18v6M116 18v6M120 18v6M124 18v6"/>
    <path class="il-white il-ink il-thin" d="M20 26c6 6 12 6 18 0M20 26l8 10"/>
    <ellipse class="il-grey il-ink" cx="56" cy="40" rx="6" ry="16" transform="rotate(-20 56 40)"/>
    <ellipse class="il-grey il-ink" cx="84" cy="38" rx="6" ry="16" transform="rotate(25 84 38)"/>
    <ellipse class="il-pink" cx="56" cy="42" rx="2.4" ry="10" transform="rotate(-20 56 40)"/>
    <ellipse class="il-pink" cx="84" cy="40" rx="2.4" ry="10" transform="rotate(25 84 38)"/>
    <polygon class="il-grey il-ink" points="107 74 100 79 104 87 94 89 94 98 84 96 80 104 72 99 64 104 60 96 50 98 50 89 40 87 44 79 37 74 44 69 40 61 50 59 50 50 60 52 64 44 72 49 80 44 84 52 94 50 94 59 104 61 100 69"/>
    <path class="il-smoke" opacity="0.6" d="M52 64c4-8 12-10 18-8-8 2-12 6-14 10z"/>
    <path class="il-line" d="M56 66l8 4-8 4M88 66l-8 4 8 4"/>
    <path class="il-line il-thin" d="M54 60l9 3M90 60l-9 3"/>
    <circle class="il-pink il-ink" cx="72" cy="76" r="4"/>
    <ellipse class="il-dark il-ink" cx="72" cy="88" rx="8" ry="6"/>
    <path class="il-pink" d="M67 91q5-3 10 0q-5 3-10 0z"/>
    <path class="il-line il-thin" d="M84 84l14-4M86 90l16 2M82 96l12 6"/>
    <g transform="rotate(30 122 70)">
      <rect class="il-white il-ink" x="112" y="56" width="20" height="28" rx="3"/>
      <path class="il-red" d="M122 76c-6-4-7-9-4-11 2-1 3 0 4 2 1-2 2-3 4-2 3 2 2 7-4 11z"/>
    </g>
    <path class="il-line il-thin" d="M104 52l6 2M104 60l6 0"/>
    <circle class="il-smoke" cx="100" cy="98" r="2"/><circle class="il-smoke" cx="110" cy="92" r="1.5"/>
    <circle class="il-smoke" cx="32" cy="94" r="2"/><circle class="il-smoke" cx="30" cy="70" r="1.4"/>
    <circle class="il-smoke" cx="118" cy="104" r="1.6"/>`,

  // A pink plastic lawn flamingo on one leg, wearing a police cap with a star badge, holding a gnome's red hat in an evidence bag.
  'kz.lawn-flamingo': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-line il-thick" d="M78 78v24"/>
    <path class="il-line" d="M78 86l-10-4 4 10"/>
    <ellipse class="il-pink il-ink" cx="80" cy="70" rx="28" ry="15"/>
    <path class="il-pink il-ink" d="M106 66c4-4 10-4 12 0l-8 10z"/>
    <path class="il-line il-thin" d="M66 66q10 8 22 2M70 74q8 4 16 0"/>
    <path class="il-pink il-ink" d="M58 64c-8-6-10-16-4-24 4-6 2-12-2-14l8-4c6 4 8 12 2 20-4 6-2 12 6 16z"/>
    <circle class="il-pink il-ink" cx="52" cy="20" r="10"/>
    <path class="il-white il-ink" d="M44 22l-10 4 4 6 8-4z"/>
    <path class="il-dark il-ink il-thin" d="M34 26l-2 6 6 0z"/>
    <circle class="il-white il-ink il-thin" cx="50" cy="19" r="3.4"/><circle class="il-dark" cx="49" cy="20" r="1.6"/>
    <path class="il-line" d="M45 14l8 3"/>
    <path class="il-blue il-ink" d="M42 12c2-8 18-10 22-2l-2 4H44z"/>
    <path class="il-dark il-ink il-thin" d="M40 14h14l-2 3H38z"/>
    <path class="il-gold il-ink il-thin" d="M54 6l1.4 3 3 .2-2.4 2 .8 3-2.8-1.6-2.8 1.6.8-3-2.4-2 3-.2z"/>
    <path class="il-gold il-ink il-thin" d="M86 62l2 4 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z"/>
    <path class="il-line il-thin" d="M38 32l-2 14"/>
    <rect class="il-white il-ink il-thin" opacity="0.55" x="22" y="46" width="28" height="30" rx="2"/>
    <path class="il-red il-ink" d="M28 72 36 50l8 22z"/>
    <path class="il-line il-thin" d="M24 50h24"/>
    <path class="il-paper il-ink il-thin" d="M42 68h8v6h-8z"/>
    <path class="il-grass il-ink il-thin" d="M120 100l3-9 2 9M134 100l2-8 3 8M14 100l2-7 3 7"/>
    <path class="il-red il-ink il-thin" d="M126 24a6 6 0 0 1 12 0z"/><path class="il-blue il-ink il-thin" d="M138 24a6 6 0 0 1 12 0z"/>
    <path class="il-line il-thin" d="M124 24h28M132 14l2 4M144 14l-2 4"/>`,

  // A big happy green cave slime blissfully hugging a pair of empty boots; bare footprints run away; hearts float up.
  'kz.cave-slime': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-stone il-ink" d="M0 0h160v8l-10 14-6-12-10 18-8-18-14 10-8-12-12 8-10-8-12 14-8-14-16 10-10-12L14 26 8 10 0 18z"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-slime il-ink" d="M20 104c-4-20 4-48 26-58 18-8 40-4 52 10 12 14 14 34 10 48z"/>
    <path class="il-slime il-ink il-thin" d="M30 104c0 4 4 6 6 2M96 104c2 6 6 6 8 0"/>
    <path class="il-light" d="M36 62c4-6 10-10 16-10"/>
    <circle class="il-white" cx="40" cy="74" r="2"/><circle class="il-white" cx="88" cy="58" r="1.6"/>
    <path class="il-line" d="M46 64q5-5 10 0M70 64q5-5 10 0"/>
    <path class="il-dark il-ink il-thin" d="M54 74q9 10 18 0z"/>
    <ellipse class="il-pink" opacity="0.7" cx="44" cy="74" rx="5" ry="3"/><ellipse class="il-pink" opacity="0.7" cx="82" cy="74" rx="5" ry="3"/>
    <path class="il-wood-dark il-ink" d="M42 84h14v14h8c4 0 6 2 6 6H42z"/>
    <path class="il-wood-dark il-ink" d="M66 84h14v14h8c4 0 6 2 6 6H66z"/>
    <path class="il-line il-thin" d="M42 88h14M66 88h14"/>
    <path class="il-slime il-ink" d="M28 82c6-2 14 2 20 6l-4 6c-6-2-12-4-16-6z"/>
    <path class="il-slime il-ink" d="M106 82c-6-2-14 2-20 6l4 6c6-2 12-4 16-6z"/>
    <path class="il-slime il-ink il-thin" d="M58 22c2 6 2 10 0 12-2-2-2-6 0-12z"/>
    <path class="il-red il-ink il-thin" d="M66 38c-5-3-6-7-3-9 2-1 3 0 3 2 1-2 2-3 4-2 2 2 1 6-4 9z"/>
    <path class="il-red il-ink il-thin" d="M84 32c-4-3-5-6-2-8 1-1 2 0 2 2 1-2 2-2 3-1 2 2 1 5-3 7z"/>
    <g class="il-skin il-ink il-thin">
      <ellipse cx="124" cy="110" rx="4" ry="2.6"/><ellipse cx="136" cy="106" rx="4" ry="2.6"/>
      <ellipse cx="148" cy="111" rx="4" ry="2.6"/>
    </g>
    <path class="il-line il-thin" d="M112 96l8-2M114 102l8 0"/>`,

  // A small yellow canary in the witness box, wing raised to swear, singing notes; its bubble shows a gnome hat and a gold nugget.
  'kz.mine-canary': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 108h160v12H0z"/>
    <path class="il-wood il-ink" d="M30 74h76v34H30z"/>
    <path class="il-wood-dark il-ink" d="M26 70h84v8H26z"/>
    <path class="il-line il-thin" d="M44 80v26M62 80v26M80 80v26M96 80v26"/>
    <ellipse class="il-yellow il-ink" cx="68" cy="56" rx="20" ry="16"/>
    <circle class="il-yellow il-ink" cx="62" cy="34" r="14"/>
    <path class="il-yellow il-ink" d="M58 20c0-6 4-8 6-6 0-4 6-4 6 0"/>
    <path class="il-orange il-ink" d="M48 34l-12-4 4 6-4 4z"/>
    <path class="il-line il-thin" d="M38 35h8"/>
    <circle class="il-white il-ink il-thin" cx="58" cy="30" r="4"/><circle class="il-dark" cx="57" cy="31" r="2"/>
    <circle class="il-white il-ink il-thin" cx="68" cy="30" r="4"/><circle class="il-dark" cx="67" cy="31" r="2"/>
    <path class="il-line il-thin" d="M54 24l6 2M72 24l-5 2"/>
    <path class="il-yellow il-ink" d="M82 50c6-10 8-22 6-30 6 2 8 12 4 26z"/>
    <path class="il-line il-thin" d="M86 28l4 1M86 34l4 1"/>
    <path class="il-gold il-ink il-thin" d="M56 54q10 10 20 0"/>
    <path class="il-orange il-ink il-thin" d="M60 70l-2 4M64 70l0 4M74 70l0 4M78 70l2 4"/>
    <path class="il-white il-ink" d="M100 8h48c4 0 6 2 6 6v20c0 4-2 6-6 6h-30l-8 8 1-8h-11c-4 0-6-2-6-6V14c0-4 2-6 6-6z"/>
    <path class="il-red il-ink il-thin" d="M108 34l7-20 7 20z"/>
    <path class="il-gold il-ink il-thin" d="M128 34l3-8 8-2 6 4 2 6z"/>
    <path class="il-line il-thin" d="M140 16l2-4M144 20l4-2"/>
    <path class="il-line" d="M28 40v-12l8-2v10"/><circle class="il-dark" cx="26" cy="40" r="2.6"/><circle class="il-dark" cx="34" cy="38" r="2.6"/>
    <path class="il-line" d="M20 60v-10"/><circle class="il-dark" cx="18" cy="60" r="2.6"/>
    <path class="il-metal il-ink il-thin" d="M120 70h14l-2 18h-10z"/><path class="il-glow" d="M123 74h8l-1 10h-6z"/>
    <path class="il-line il-thin" d="M122 70q5-8 10 0"/><path class="il-torch" d="M112 90l-6 18h48l-6-18z"/>`,

  // A smug moss blob with crossed arms and a planted flag halts a terrified rolling stone on a slope.
  'kz.ambitious-moss': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96 160 60v60H0z"/>
    <polygon class="il-green il-ink" points="94 72 89 78 91 85 83 88 81 94 73 94 68 99 61 95 53 97 49 91 42 90 41 83 35 78 38 72 35 66 41 61 42 54 49 53 53 47 61 49 68 45 73 50 81 50 83 56 91 59 89 66"/>
    <path class="il-grass il-ink il-thin" d="M46 60l2 5M58 54l1 5M80 58l-2 4M44 82l3 3M86 80l-3 3"/>
    <path class="il-line" d="M52 66l8 2M76 66l-8 2"/>
    <circle class="il-white il-ink il-thin" cx="56" cy="72" r="4"/><circle class="il-dark" cx="57" cy="73" r="2"/>
    <circle class="il-white il-ink il-thin" cx="72" cy="72" r="4"/><circle class="il-dark" cx="73" cy="73" r="2"/>
    <path class="il-line" d="M58 84q8 4 14-2"/>
    <path class="il-green il-ink" d="M42 88c8-4 18-2 22 2-8 2-16 2-22-2zM86 88c-8-4-18-2-22 2 8 2 16 2 22-2z"/>
    <path class="il-line" d="M64 46V18"/>
    <path class="il-red il-ink" d="M64 18l20 6-20 6z"/>
    <circle class="il-stone il-ink" cx="116" cy="54" r="20"/>
    <path class="il-grey il-ink il-thin" d="M104 46c2-2 4-2 6 0M120 66c2 1 4 1 6-1M126 42l4 2"/>
    <circle class="il-white il-ink il-thin" cx="108" cy="54" r="5"/><circle class="il-dark" cx="106" cy="54" r="2.2"/>
    <circle class="il-white il-ink il-thin" cx="120" cy="52" r="5"/><circle class="il-dark" cx="118" cy="52" r="2.2"/>
    <ellipse class="il-dark il-ink il-thin" cx="112" cy="64" rx="3.6" ry="4.4"/>
    <path class="il-line il-thin" d="M102 46l6-3M124 44l-4-3"/>
    <ellipse class="il-water il-ink il-thin" cx="128" cy="44" rx="2" ry="3"/>
    <path class="il-line il-thin" d="M140 40l10-2M142 50l12 0M140 60l10 2"/>
    <path class="il-line il-dash il-thin" d="M150 30a12 12 0 0 1 4 8"/>`,

  // A fat curled grub asleep for a century in its earth burrow, nightcap on, while a huge alarm clock rings beside it; one eye pops open.
  'kz.deep-grub': `
    <rect class="il-earth-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 0h160v10H0z"/>
    <path class="il-earth" d="M0 10h160v8H0z"/>
    <path class="il-cave il-ink" d="M14 104c-6-30 10-60 46-64 40-4 70 16 76 46 3 12-2 20-10 22H22c-4 0-7-2-8-4z"/>
    <path class="il-stone il-ink il-thin" d="M8 30h8v6H8zM146 34h8v5h-8zM120 20h6v4h-6z"/>
    <path class="il-white il-ink" d="M34 102c-10-14-8-34 8-44 16-10 36-6 46 6 6 8 6 18 0 24-6 6-16 4-18-4 2-6-4-10-10-8-8 2-10 12-6 20 2 4 6 6 10 6z"/>
    <path class="il-line il-thin" d="M40 64l4 6M50 58l2 7M62 56v7M74 58l-2 7M84 64l-4 5M36 76l6 2M36 90l6-2"/>
    <path class="il-orange il-ink il-thin" d="M60 84l-4 4M64 88l-4 4M68 90l-2 5"/>
    <circle class="il-orange il-ink" cx="80" cy="82" r="10"/>
    <path class="il-line il-thin" d="M74 80q2 2 4 0"/>
    <circle class="il-white il-ink il-thin" cx="85" cy="79" r="4"/><circle class="il-dark" cx="86" cy="79" r="2"/>
    <path class="il-line il-thin" d="M82 73l6 1"/>
    <path class="il-line il-thin" d="M76 88q4 2 8-1"/>
    <path class="il-blue il-ink" d="M72 74c-2-10 4-18 14-16 6 2 10 6 10 10-4-2-8-2-10 0z"/>
    <circle class="il-white il-ink il-thin" cx="98" cy="70" r="4"/>
    <path class="il-line il-thin" d="M40 40l6 0-6 6h6M52 30h5l-5 5h5"/>
    <circle class="il-red il-ink" cx="116" cy="84" r="14"/>
    <circle class="il-white il-ink il-thin" cx="116" cy="84" r="10"/>
    <path class="il-line" d="M116 84v-7M116 84l5 3"/>
    <path class="il-metal il-ink il-thin" d="M104 70a6 6 0 0 1 8-6zM128 70a6 6 0 0 0-8-6z"/>
    <path class="il-line il-thin" d="M108 96l-3 6M124 96l3 6M100 64l-4-4M132 64l4-4M98 78l-6-1M134 78l6-1"/>`,

  // A battalion of tiny green aphids in helmets marches in formation behind a general pointing a twig at a red rose.
  'kz.aphid-army': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-green il-ink" d="M136 100V48"/>
    <path class="il-green il-ink il-thin" d="M136 76c-8-4-12 0-14 4 6 2 10 0 14-4zM136 64c8-4 12 0 14 4-6 2-10 0-14-4z"/>
    <path class="il-line il-thin" d="M136 86l-3-2M136 58l3-2"/>
    <circle class="il-red il-ink" cx="136" cy="38" r="14"/>
    <path class="il-line il-thin" d="M136 38c-6-4 0-10 4-6 4 4-2 10-8 6-6-4-2-14 8-12M126 42c4 6 14 6 18-2"/>
    <g transform="translate(78 64)">
      <ellipse class="il-slime il-ink" cx="0" cy="12" rx="14" ry="11"/>
      <path class="il-dark il-ink il-thin" d="M-12 4c0-10 24-10 24 0z"/>
      <circle class="il-white il-ink il-thin" cx="-4" cy="10" r="3"/><circle class="il-white il-ink il-thin" cx="5" cy="10" r="3"/>
      <circle class="il-dark" cx="-3" cy="10" r="1.4"/><circle class="il-dark" cx="6" cy="10" r="1.4"/>
      <path class="il-line il-thin" d="M-8 6l6 2M9 6l-5 2M-2 17q3 2 6 0"/>
      <path class="il-gold il-ink il-thin" d="M-6 20h4v3h-4z"/>
      <path class="il-wood-dark il-ink" d="M12 10l30-20"/>
      <path class="il-line il-thin" d="M-10 22l-3 6M-2 23v6M6 23l2 6"/>
    </g>
    <g class="il-slime il-ink il-thin">
      <ellipse cx="54" cy="84" rx="7" ry="5.4"/><ellipse cx="38" cy="84" rx="7" ry="5.4"/><ellipse cx="22" cy="84" rx="7" ry="5.4"/><ellipse cx="6" cy="84" rx="7" ry="5.4"/>
      <ellipse cx="62" cy="98" rx="7" ry="5.4"/><ellipse cx="46" cy="98" rx="7" ry="5.4"/><ellipse cx="30" cy="98" rx="7" ry="5.4"/><ellipse cx="14" cy="98" rx="7" ry="5.4"/>
      <ellipse cx="70" cy="112" rx="7" ry="5.4"/><ellipse cx="54" cy="112" rx="7" ry="5.4"/><ellipse cx="38" cy="112" rx="7" ry="5.4"/><ellipse cx="22" cy="112" rx="7" ry="5.4"/><ellipse cx="6" cy="112" rx="7" ry="5.4"/>
    </g>
    <g class="il-dark il-ink il-thin">
      <path d="M48 80c0-6 12-6 12 0zM32 80c0-6 12-6 12 0zM16 80c0-6 12-6 12 0zM0 80c0-6 12-6 12 0z"/>
      <path d="M56 94c0-6 12-6 12 0zM40 94c0-6 12-6 12 0zM24 94c0-6 12-6 12 0zM8 94c0-6 12-6 12 0z"/>
      <path d="M64 108c0-6 12-6 12 0zM48 108c0-6 12-6 12 0zM32 108c0-6 12-6 12 0zM16 108c0-6 12-6 12 0zM0 108c0-6 12-6 12 0z"/>
    </g>
    <g class="il-dark">
      <circle cx="57" cy="83" r="1.2"/><circle cx="41" cy="83" r="1.2"/><circle cx="25" cy="83" r="1.2"/><circle cx="9" cy="83" r="1.2"/>
      <circle cx="65" cy="97" r="1.2"/><circle cx="49" cy="97" r="1.2"/><circle cx="33" cy="97" r="1.2"/><circle cx="17" cy="97" r="1.2"/>
      <circle cx="73" cy="111" r="1.2"/><circle cx="57" cy="111" r="1.2"/><circle cx="41" cy="111" r="1.2"/><circle cx="25" cy="111" r="1.2"/><circle cx="9" cy="111" r="1.2"/>
    </g>
    <path class="il-line il-thin" d="M116 22l6 4M112 32l6 1"/>`,

  // A grinning dandelion weed springs back out of its hole wearing a mayor's gold chain and waving; a rake lies defeated beside it.
  'kz.returning-weed': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 86h160v34H0z"/>
    <path class="il-earth il-ink" d="M50 90c0-6 60-6 60 0s-60 6-60 0z"/>
    <path class="il-earth-dark il-ink il-thin" d="M44 90l-6-4 4-2M116 90l6-4-4-2M40 94l-4 2M120 94l4 2"/>
    <path class="il-wood-dark il-line" d="M74 92l-6 14M80 92v18M86 92l6 12M80 102l-6 6M80 104l6 6"/>
    <path class="il-green il-ink" d="M72 90c-2-20 0-34 8-40 8 6 10 20 8 40z"/>
    <path class="il-green il-ink" d="M72 80c-8 0-10-6-18-4 2-4 0-8 6-10-2-4 2-8 6-6 2-4 6-2 8 2zM88 80c8 0 10-6 18-4-2-4 0-8-6-10 2-4-2-8-6-6-2-4-6-2-8 2z"/>
    <path class="il-line il-thin" d="M58 72l12 4M102 72l-12 4"/>
    <g class="il-yellow il-ink">
      <circle cx="80" cy="34" r="20"/>
    </g>
    <path class="il-line il-thin" d="M80 14v6M64 22l4 4M96 22l-4 4M60 34h6M94 34h6M66 46l4-3M94 46l-4-3"/>
    <circle class="il-orange il-ink" cx="80" cy="36" r="13"/>
    <circle class="il-white il-ink il-thin" cx="75" cy="33" r="3.4"/><circle class="il-dark" cx="76" cy="33" r="1.7"/>
    <circle class="il-white il-ink il-thin" cx="86" cy="33" r="3.4"/><circle class="il-dark" cx="87" cy="33" r="1.7"/>
    <path class="il-line il-thin" d="M71 28l5 1M90 28l-5 1"/>
    <path class="il-dark il-ink il-thin" d="M73 40q7 7 14 0z"/>
    <path class="il-gold il-ink il-thin" d="M72 56q8 10 16 0" opacity="1"/>
    <circle class="il-gold il-ink" cx="80" cy="66" r="5"/>
    <path class="il-green il-ink il-thin" d="M106 64l10-14c2-2 4 0 3 2l-8 14"/>
    <path class="il-wood il-ink" d="M18 106 60 96l1 4-42 10z"/>
    <path class="il-metal il-ink" d="M14 98l4 16 6-2-4-16z"/>
    <path class="il-line il-thin" d="M10 100l4-1M11 104l4-1M12 108l4-1"/>
    <path class="il-green il-ink il-thin" d="M132 104c-2-8 2-14 6-14 2 4 2 10-2 14zM140 108c2-6 8-8 10-6-2 4-6 6-10 6z"/>
    <path class="il-line il-thin" d="M124 22c4-4 10-4 12 0M126 30c4-2 8-2 10 0"/>`,

  // A dome-shaped lawn sprinkler with a scowl and a gun-sight aims a water jet at a soaked little gnome hat; tick marks show it winding up.
  'kz.grudge-sprinkler': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 90h160v30H0z"/>
    <ellipse class="il-dark il-ink" cx="48" cy="96" rx="30" ry="8"/>
    <path class="il-metal il-ink" d="M22 94c0-24 12-38 26-38s26 14 26 38z"/>
    <path class="il-light il-thin" d="M30 82c0-10 6-18 12-20"/>
    <path class="il-line il-thin" d="M24 86h48"/>
    <circle class="il-white il-ink" cx="40" cy="72" r="6"/><circle class="il-dark" cx="42" cy="72" r="3"/>
    <circle class="il-white il-ink" cx="58" cy="72" r="6"/><circle class="il-dark" cx="60" cy="72" r="3"/>
    <path class="il-line il-thick" d="M32 62l12 6M66 62l-12 6"/>
    <path class="il-line" d="M42 82q7-4 14 0"/>
    <path class="il-blue il-ink" d="M62 56l14-10 6 8-14 10z"/>
    <path class="il-metal il-ink il-thin" d="M76 44l8-2 2 10-6 2z"/>
    <circle class="il-red il-ink il-thin" cx="58" cy="50" r="4"/>
    <path class="il-line il-thin" d="M58 44v12M52 50h12"/>
    <path class="il-water-line" d="M86 46c20-14 40-8 50 28M86 48c18-8 34-2 42 26M86 44c22-18 46-12 56 26"/>
    <ellipse class="il-water il-ink il-thin" cx="132" cy="100" rx="22" ry="5"/>
    <path class="il-red il-ink" d="M124 98l9-24 9 24z"/>
    <path class="il-line il-thin" d="M126 92q7 3 14 0"/>
    <ellipse class="il-water" cx="122" cy="88" rx="1.6" ry="2.6"/><ellipse class="il-water" cx="146" cy="90" rx="1.6" ry="2.6"/>
    <ellipse class="il-water" cx="140" cy="80" rx="1.4" ry="2.2"/>
    <path class="il-line il-thin" d="M14 52l-4-4M12 62H6M22 44l-2-6"/>
    <path class="il-grass il-ink il-thin" d="M90 90l3-8 2 8M100 90l2-7 3 7M6 104l3-8 2 8"/>`,

  // The fussy neighbour leans over his picket fence, squinting through glasses while measuring one blade of grass with a ruler; a confiscated gnome hat sits on his side.
  'kz.hobby-gardener': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 96h160v24H0z"/>
    <path class="il-skin il-ink" d="M50 64c-4-20 6-36 24-36s28 16 24 36z"/>
    <path class="il-green il-ink" d="M48 40c0-14 12-22 26-22s26 8 26 22z"/>
    <path class="il-green il-ink" d="M44 40h60v6H44z"/>
    <circle class="il-white il-ink" cx="64" cy="54" r="7"/><circle class="il-white il-ink" cx="84" cy="54" r="7"/>
    <path class="il-line" d="M71 54h6M57 54l-6-2M91 54l6-2"/>
    <circle class="il-dark" cx="66" cy="56" r="2"/>
    <path class="il-line" d="M80 56h8"/>
    <path class="il-line il-thin" d="M58 46l10 3M90 46l-10 3"/>
    <path class="il-grey il-ink" d="M64 64c4-4 8-2 10 0 2-2 6-4 10 0-4 4-16 4-20 0z"/>
    <path class="il-line il-thin" d="M70 70h8"/>
    <path class="il-blue il-ink" d="M44 76c0-6 12-10 30-10s30 4 30 10v6H44z"/>
    <g class="il-white il-ink">
      <path d="M2 74l6-8 6 8v30H2zM24 74l6-8 6 8v30H24zM46 74l6-8 6 8v30H46zM68 74l6-8 6 8v30H68zM90 74l6-8 6 8v30H90zM112 74l6-8 6 8v30h-12z"/>
    </g>
    <path class="il-white il-ink" d="M0 82h134v6H0z"/>
    <path class="il-skin il-ink" d="M98 76c6-2 12 2 16 6l-4 6c-4-2-8-4-12-4z"/>
    <path class="il-yellow il-ink" d="M110 60h8v44h-8z"/>
    <path class="il-line il-thin" d="M110 64h4M110 68h3M110 72h4M110 76h3M110 80h4M110 84h3M110 88h4M110 92h3M110 96h4M110 100h3"/>
    <path class="il-green il-ink il-thin" d="M124 104l2-14 3 14z"/>
    <path class="il-line il-thin" d="M118 90h6"/>
    <path class="il-red il-ink" d="M136 70l7-20 7 20z"/>
    <path class="il-white il-ink il-thin" d="M132 72h22v4h-22z"/>
    <path class="il-line il-thin" d="M138 76l-2 20M148 76l2 20M134 96h20"/>`,

  // A bored tunnel worm in a hard hat and glasses behind a desk piled with forms, rubber stamp raised; its segmented body peeks out from under the desk.
  'kz.tunnel-worm': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-wood il-ink" d="M10 12h10v92H10zM140 12h10v92h-10zM6 8h148v8H6z"/>
    <path class="il-pink il-ink" d="M98 104c0-10 8-16 16-12s10 12 18 12z"/>
    <path class="il-line il-thin" d="M106 96v8M114 94v10M122 98v6"/>
    <path class="il-pink il-ink" d="M62 70c-4-6-4-14 0-18h24c4 4 4 12 0 18z"/>
    <path class="il-line il-thin" d="M62 60h24M62 66h24"/>
    <circle class="il-pink il-ink" cx="74" cy="40" r="17"/>
    <path class="il-yellow il-ink" d="M56 34c0-14 36-14 36 0z"/>
    <path class="il-yellow il-ink" d="M52 34h44v5H52z"/>
    <path class="il-line il-thin" d="M74 20v12"/>
    <circle class="il-white il-ink il-thin" cx="67" cy="45" r="5"/><circle class="il-white il-ink il-thin" cx="81" cy="45" r="5"/>
    <path class="il-line il-thin" d="M72 45h4"/>
    <path class="il-dark" d="M63 45a4 4 0 0 0 8 0zM77 45a4 4 0 0 0 8 0z"/>
    <path class="il-line il-thin" d="M62 43h10M76 43h10"/>
    <path class="il-line il-thin" d="M69 53q5-2 10 0"/>
    <path class="il-wood-dark il-ink" d="M34 72h84v32H34z"/>
    <path class="il-wood il-ink" d="M30 68h92v6H30z"/>
    <path class="il-line il-thin" d="M44 80h20v14H44zM88 80h20v14H88zM50 87h8M94 87h8"/>
    <g class="il-paper il-ink il-thin">
      <rect x="36" y="60" width="20" height="8"/><rect x="38" y="52" width="20" height="8"/><rect x="35" y="44" width="20" height="8"/><rect x="37" y="36" width="20" height="8"/>
    </g>
    <path class="il-red il-ink" d="M98 50h14v6H98z"/>
    <path class="il-wood-dark il-ink" d="M102 40h6v10h-6z"/>
    <circle class="il-wood-dark il-ink" cx="105" cy="38" r="5"/>
    <path class="il-pink il-ink" d="M88 58c4 0 8-2 12-6l4 4c-4 4-10 6-16 6z"/>
    <path class="il-line il-thin" d="M98 62l4 2M108 62l-2 2"/>
    <path class="il-paper il-ink il-thin" d="M98 62h16v6H98z"/>
    <path class="il-red" d="M102 64h8v2h-8z"/>`,

  // A grinning pit rat with a flashing gold tooth and cheeks stuffed full, sitting on coins and hugging a glittering sandwich.
  'kz.gold-rat': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 102h160v18H0z"/>
    <path class="il-line" d="M108 92c16 0 26-6 28-16s-8-14-12-8"/>
    <g class="il-gold il-ink il-thin">
      <ellipse cx="54" cy="104" rx="10" ry="4"/><ellipse cx="74" cy="106" rx="10" ry="4"/><ellipse cx="94" cy="104" rx="10" ry="4"/>
      <ellipse cx="64" cy="100" rx="10" ry="4"/><ellipse cx="84" cy="100" rx="10" ry="4"/><ellipse cx="74" cy="95" rx="10" ry="4"/>
    </g>
    <ellipse class="il-grey il-ink" cx="80" cy="74" rx="28" ry="22"/>
    <ellipse class="il-stone" cx="80" cy="80" rx="16" ry="14"/>
    <circle class="il-grey il-ink" cx="56" cy="22" r="10"/><circle class="il-pink" cx="56" cy="22" r="5"/>
    <circle class="il-grey il-ink" cx="104" cy="22" r="10"/><circle class="il-pink" cx="104" cy="22" r="5"/>
    <path class="il-grey il-ink" d="M58 46c0-16 10-24 22-24s22 8 22 24c0 6-6 12-10 12H68c-4 0-10-6-10-12z"/>
    <ellipse class="il-grey il-ink" cx="62" cy="50" rx="10" ry="9"/><ellipse class="il-grey il-ink" cx="98" cy="50" rx="10" ry="9"/>
    <path class="il-grey" d="M64 44h32v12H64z"/>
    <path class="il-line il-thin" d="M58 52l-10-2M58 56l-10 2M102 52l10-2M102 56l10 2"/>
    <circle class="il-white il-ink il-thin" cx="72" cy="36" r="4"/><circle class="il-dark" cx="73" cy="37" r="2"/>
    <circle class="il-white il-ink il-thin" cx="88" cy="36" r="4"/><circle class="il-dark" cx="87" cy="37" r="2"/>
    <path class="il-line il-thin" d="M67 30l6 2M93 30l-6 2"/>
    <circle class="il-pink il-ink il-thin" cx="80" cy="44" r="3"/>
    <path class="il-dark il-ink il-thin" d="M70 50q10 8 20 0z"/>
    <path class="il-gold il-ink il-thin" d="M80 50h4v4h-4z"/>
    <path class="il-white il-ink il-thin" d="M76 50h4v3h-4z"/>
    <path class="il-glow" d="M88 46l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>
    <g transform="rotate(-8 80 76)">
      <path class="il-wood il-ink" d="M62 70h36c4 0 4 6 0 6H62c-4 0-4-6 0-6z"/>
      <path class="il-green il-ink il-thin" d="M60 77c4 3 8-1 12 1s8-2 12 0 8-2 12 0l2 1H60z"/>
      <path class="il-yellow il-ink il-thin" d="M62 79h36v3H62z"/>
      <path class="il-wood il-ink" d="M62 82h36c4 0 4 6 0 6H62c-4 0-4-6 0-6z"/>
    </g>
    <path class="il-grey il-ink" d="M56 74c4-4 10-2 10 2l-4 6c-4 0-8-4-6-8zM104 74c-4-4-10-2-10 2l4 6c4 0 8-4 6-8z"/>
    <path class="il-glow" d="M108 64l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM46 70l1.5 3.5 3.5 1.5-3.5 1.5L46 80l-1.5-3.5L41 75l3.5-1.5z"/>
    <path class="il-glow" d="M120 86l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`,

  // A bark beetle bureaucrat in glasses and tie behind a tree-stump desk stamps a sheet of bark; a stack of three bark forms waits.
  'kz.bark-beetle-office': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-wood-dark il-ink" d="M118 0h34v100h-34z"/>
    <path class="il-line il-thin" d="M124 10v20M132 40v24M144 8v30M126 70v20M146 60v22"/>
    <ellipse class="il-dark il-ink" cx="135" cy="50" rx="8" ry="10"/>
    <path class="il-glow" opacity="0.5" d="M131 46h8v8h-8z"/>
    <path class="il-line il-thin" d="M126 34l8-6 8 6"/>
    <path class="il-wood il-ink" d="M66 22l-6-12M84 22l6-12"/>
    <circle class="il-dark" cx="60" cy="10" r="2"/><circle class="il-dark" cx="90" cy="10" r="2"/>
    <ellipse class="il-wood-dark il-ink" cx="75" cy="62" rx="26" ry="24"/>
    <path class="il-line il-thin" d="M75 42v34"/>
    <path class="il-light il-thin" d="M58 52c2-6 6-8 10-8"/>
    <circle class="il-dark il-ink" cx="75" cy="32" r="14"/>
    <circle class="il-white il-ink il-thin" cx="69" cy="30" r="5"/><circle class="il-white il-ink il-thin" cx="81" cy="30" r="5"/>
    <path class="il-light il-thin" d="M74 30h2"/>
    <circle class="il-dark" cx="69" cy="31" r="2"/><circle class="il-dark" cx="81" cy="31" r="2"/>
    <path class="il-light il-thin" d="M64 24l8 2M86 24l-8 2M70 40h10"/>
    <path class="il-red il-ink il-thin" d="M73 46h4l2 12-4 4-4-4z"/>
    <path class="il-wood il-ink" d="M26 80h92v20H26z"/>
    <ellipse class="il-wood il-ink" cx="72" cy="80" rx="46" ry="6"/>
    <path class="il-wood-dark il-line il-thin" d="M52 80c0-3 40-3 40 0M60 80c0-1.5 24-1.5 24 0"/>
    <path class="il-line il-thin" d="M36 86v12M52 88v10M92 88v10M108 86v12"/>
    <g class="il-wood il-ink il-thin">
      <path d="M30 76l20-2 2 4-20 2z"/><path d="M30 72l20-2 2 4-20 2z"/><path d="M30 68l20-2 2 4-20 2z"/>
    </g>
    <path class="il-wood il-ink il-thin" d="M80 76l20-2 2 4-20 2z"/>
    <path class="il-dark il-ink" d="M92 62h10v6H92z"/>
    <path class="il-wood-dark il-ink" d="M94 52h6v10h-6z"/><circle class="il-wood-dark il-ink" cx="97" cy="50" r="4"/>
    <path class="il-wood-dark il-ink" d="M98 60c-4 0-8 2-10 4l2 4c2-2 6-4 8-4z"/>
    <circle class="il-red" cx="91" cy="77" r="2.4"/>
    <path class="il-line il-thin" d="M104 66l4-2M104 70l4 1"/>`,

  // At dawn an orange leaf-blower engine with an angry face blasts from a wide flared horn over a spotless lawn; no leaves, just a gnome hat blown away.
  'kz.leaf-blower': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-yellow il-ink" d="M10 64a20 20 0 0 1 40 0z"/>
    <path class="il-line il-thin" d="M30 38v-6M14 46l-4-4M46 46l4-4"/>
    <path class="il-grass" d="M0 64h160v56H0z"/>
    <path class="il-line il-thin" d="M8 80h20M40 90h22M6 104h24M44 110h20"/>
    <rect class="il-orange il-ink" x="20" y="60" width="48" height="40" rx="8"/>
    <path class="il-dark il-ink" d="M24 96h40v8H24z"/>
    <circle class="il-dark il-ink" cx="30" cy="106" r="5"/><circle class="il-dark il-ink" cx="58" cy="106" r="5"/>
    <path class="il-metal il-ink" d="M30 60c0-10 8-14 14-14s14 4 14 14"/>
    <path class="il-line il-thin" d="M24 70h8M24 74h8M24 78h8"/>
    <circle class="il-white il-ink" cx="44" cy="74" r="5"/><circle class="il-dark" cx="46" cy="75" r="2.4"/>
    <circle class="il-white il-ink" cx="58" cy="74" r="5"/><circle class="il-dark" cx="60" cy="75" r="2.4"/>
    <path class="il-line il-thick" d="M38 66l10 4M64 66l-8 4"/>
    <path class="il-white il-ink il-thin" d="M44 84h18v6H44z"/>
    <path class="il-line il-thin" d="M48 84v6M53 84v6M58 84v6"/>
    <path class="il-metal il-ink" d="M66 72l18-4 22-16v52l-22-16-18-4z"/>
    <path class="il-line il-thin" d="M84 68v20"/>
    <path class="il-line" d="M112 66h22M114 78h34M112 90h26"/>
    <path class="il-line il-thin" d="M118 72h16M120 84h20"/>
    <g transform="rotate(50 140 30)">
      <path class="il-red il-ink" d="M132 40l8-24 8 24z"/>
      <path class="il-white il-ink il-thin" d="M130 40h20v4h-20z"/>
    </g>
    <path class="il-line il-thin" d="M126 46l-6 4M120 40h-6"/>
    <path class="il-smoke il-ink il-thin" d="M14 56c-6 0-6-8 0-8 0-6 8-6 10-2 4-2 8 2 6 6z"/>
    <path class="il-line il-thin" d="M72 50l4-6M80 52l6-4M72 104l4 6"/>`
};
