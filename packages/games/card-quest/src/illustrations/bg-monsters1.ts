/* Creepy Crawlies illustrations: monsters1. */
export const BG_MONSTERS1: Readonly<Record<string, string>> = {
  // A purple rubber spider with wonky googly eyes, a price tag still on one leg, bobs on a springy rubber thread in front
  // of the cellar wall; a ladybird leaps into the air with fright and a snail peeks out of its shell, sweating.
  'bg.rubber-spider': `
    <rect class="il-stone" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 14h160M0 30h160M0 46h160M0 62h160M0 78h160M0 94h160M20 0v14M60 0v14M100 0v14M140 0v14M40 14v16M80 14v16M120 14v16M20 30v16M60 30v16M140 30v16M40 46v16M120 46v16M20 62v16M140 62v16M40 78v16M120 78v16"/>
    <rect class="il-earth-dark il-ink" x="-2" y="100" width="164" height="22"/>
    <path class="il-line il-thin" opacity="0.4" d="M20 100l-4 20M60 100v20M100 100l2 20M140 100l6 20"/>
    <rect class="il-wood il-ink" x="-2" y="50" width="40" height="5"/>
    <rect class="il-water il-ink il-thin" x="4" y="35" width="12" height="15" rx="3"/>
    <rect class="il-red il-ink il-thin" x="3" y="32" width="14" height="4" rx="1"/>
    <rect class="il-orange il-ink il-thin" x="20" y="38" width="12" height="12" rx="3"/>
    <rect class="il-metal il-ink il-thin" x="19" y="35" width="14" height="4" rx="1"/>
    <path class="il-line il-thin" d="M88 0q5 2 0 4q-5 2 0 4q5 2 0 4q-5 2 0 4q5 2 0 4q-5 2 0 4q5 2 0 4"/>
    <path class="il-line il-thin" d="M76 8q-4 6 0 12M100 8q4 6 0 12M70 4q-6 10 0 20M106 4q6 10 0 20"/>
    <g class="il-line il-thick">
      <path d="M77 38c-10-8-20-8-26 0l-4 8"/><path d="M76 46c-12-4-22 0-26 8l-2 8"/>
      <path d="M78 52c-10 2-18 8-20 16v8"/><path d="M82 56c-6 6-10 12-10 22"/>
      <path d="M99 38c10-8 20-8 26 0l4 8"/><path d="M100 46c12-4 22 0 26 8l2 8"/>
      <path d="M98 52c10 2 18 8 20 16v8"/><path d="M94 56c6 6 10 12 10 22"/>
    </g>
    <g class="il-purple il-ink il-thin">
      <circle cx="47" cy="46" r="2.6"/><circle cx="48" cy="62" r="2.6"/><circle cx="58" cy="76" r="2.6"/><circle cx="72" cy="78" r="2.6"/>
      <circle cx="129" cy="46" r="2.6"/><circle cx="128" cy="62" r="2.6"/><circle cx="118" cy="76" r="2.6"/><circle cx="104" cy="78" r="2.6"/>
    </g>
    <ellipse class="il-purple il-ink" cx="88" cy="40" rx="15" ry="13"/>
    <path class="il-purple-dark" d="M82 32q6-3 12 0l-2 6q-4-2-8 0zM81 42q7-3 14 0l-2 5q-5-2-10 0z"/>
    <path class="il-light il-thin" d="M77 36q2-6 8-8"/>
    <circle class="il-purple il-ink" cx="88" cy="60" r="10"/>
    <circle class="il-white il-ink il-thin" cx="83" cy="58" r="5.5"/><circle class="il-dark" cx="84" cy="61" r="2.6"/>
    <circle class="il-white il-ink il-thin" cx="94" cy="57" r="5.5"/><circle class="il-dark" cx="97" cy="55" r="2.6"/>
    <path class="il-line il-thin" d="M82 66q6 4 12 0"/>
    <path class="il-white il-ink il-thin" d="M84 67l1 3 2-2zM92 67l-1 3-2-2z"/>
    <path class="il-line il-thin" d="M129 46l4 8"/>
    <path class="il-paper il-ink il-thin" d="M130 54l9-2 3 9-9 2z"/>
    <circle class="il-earth-dark" cx="133" cy="56" r="1"/>
    <path class="il-line il-thin" d="M135 59l4-1"/>
    <ellipse class="il-dark" opacity="0.25" cx="136" cy="106" rx="12" ry="2.6"/>
    <path class="il-line il-thin" d="M128 92l-6 4M131 94l-3 7M142 94l3 7M146 92l6 3M134 94l-1 6M139 94l2 6"/>
    <path class="il-red il-ink" d="M126 90a12 10 0 0 1 24 0z"/>
    <path class="il-line il-thin" d="M138 80v10"/>
    <circle class="il-dark" cx="132" cy="85" r="2"/><circle class="il-dark" cx="144" cy="85" r="2"/><circle class="il-dark" cx="141" cy="80" r="1.6"/>
    <circle class="il-dark il-ink" cx="124" cy="86" r="6"/>
    <circle class="il-white il-ink il-thin" cx="121" cy="83" r="2.8"/><circle class="il-dark" cx="120.6" cy="82.6" r="1"/>
    <circle class="il-white il-ink il-thin" cx="126" cy="82" r="2.8"/><circle class="il-dark" cx="125.6" cy="81.6" r="1"/>
    <ellipse class="il-red" cx="122" cy="89" rx="2" ry="1.6"/>
    <path class="il-dark il-ink il-thin" d="M147 62h3l-1 10h-1zM148.5 76a1.6 1.6 0 1 0 0.1 0z"/>
    <path class="il-dark il-ink il-thin" d="M154 66h3l-1 8h-1zM155.5 78a1.4 1.4 0 1 0 0.1 0z"/>
    <path class="il-skin il-ink il-thin" d="M8 100c0-4 4-5 10-5h18v5z"/>
    <circle class="il-orange il-ink" cx="28" cy="88" r="11"/>
    <path class="il-line il-thin" d="M28 88c2 0 3-3 0-4-4-1-6 3-5 6 2 5 9 5 11 0 2-6-2-11-8-11"/>
    <ellipse class="il-dark" cx="16" cy="93" rx="4" ry="3"/>
    <circle class="il-white" cx="15" cy="93" r="1.3"/><circle class="il-white" cx="18" cy="93" r="1.3"/>
    <ellipse class="il-water il-ink il-thin" cx="40" cy="80" rx="1.8" ry="2.8"/>`,

  // A grey dormouse sleeps curled up in a terracotta flowerpot, tucked under its own bushy tail like a blanket and
  // wearing a nightcap; the alarm clock beside the pot rings its head off and has toppled over. Nobody cares.
  'bg.dormouse': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-grass il-ink il-thin" d="M8 100l2-7 2 7M24 100l2-6 2 6M140 100l2-7 2 7M150 100l2-5 2 5"/>
    <path class="il-orange il-ink il-thin" d="M18 22c6-6 14-4 16 2-6 4-12 4-16-2z"/>
    <path class="il-line il-thin" d="M18 22l16 2"/>
    <path class="il-yellow il-ink il-thin" d="M140 34c4-7 12-6 14-1-5 4-10 5-14 1z"/>
    <path class="il-line il-thin" d="M30 30q4 4 2 8M148 42q-3 4 0 8"/>
    <path class="il-earth il-ink" d="M44 66h72l-8 40H52z"/>
    <path class="il-line il-thin" opacity="0.35" d="M50 80h60M52 92h56"/>
    <ellipse class="il-earth-dark il-ink" cx="80" cy="60" rx="38" ry="6"/>
    <path class="il-grey il-ink" d="M50 60c0-16 14-24 32-24s30 8 30 24z"/>
    <path class="il-beard il-ink il-thin" d="M58 60c2-6 8-8 14-8s10 4 10 8z"/>
    <path class="il-stone il-ink" d="M110 60c10-4 12-20 2-28-10-8-30-8-40 0 10-2 26-2 32 4 6 8 2 18-6 24z"/>
    <path class="il-line il-thin" d="M84 32q8 0 14 4M102 40q4 4 4 10"/>
    <ellipse class="il-grey il-ink" cx="62" cy="50" rx="13" ry="11"/>
    <circle class="il-grey il-ink" cx="56" cy="38" r="5"/><circle class="il-pink" cx="56" cy="38" r="2.4"/>
    <ellipse class="il-dark" opacity="0.35" cx="56" cy="49" rx="4" ry="3"/>
    <ellipse class="il-dark" opacity="0.35" cx="67" cy="48" rx="4" ry="3"/>
    <path class="il-line il-thin" d="M53 49q3 2 6 0M64 48q3 2 6 0"/>
    <circle class="il-pink il-ink il-thin" cx="51" cy="55" r="2"/>
    <path class="il-line il-thin" d="M50 57l-8 2M50 56l-8-2M53 58q3 2 5 0"/>
    <circle class="il-pink il-ink il-thin" cx="58" cy="60" r="2.6"/><circle class="il-pink il-ink il-thin" cx="64" cy="60" r="2.6"/>
    <path class="il-blue il-ink" d="M58 42c2-8 10-12 18-10 6 2 10 6 12 14-4-4-8-6-12-6-8 0-14 2-18 2z"/>
    <path class="il-blue il-ink" d="M86 44c4 6 6 12 4 18"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="64" r="3.4"/>
    <path class="il-light il-dash" d="M60 42c6-2 14-2 22 0"/>
    <path class="il-line" d="M96 26h8l-8 8h8M108 14h6l-6 6h6M118 4h5l-5 5h5"/>
    <g transform="rotate(28 134 88)">
      <path class="il-line" d="M128 98l-3 5M140 98l3 5"/>
      <circle class="il-red il-ink" cx="134" cy="88" r="11"/>
      <circle class="il-white il-ink il-thin" cx="134" cy="88" r="7.5"/>
      <path class="il-line il-thin" d="M134 88v-5M134 88l4 2"/>
      <circle class="il-gold il-ink il-thin" cx="126" cy="77" r="4"/><circle class="il-gold il-ink il-thin" cx="142" cy="77" r="4"/>
      <path class="il-line il-thin" d="M134 77v-3"/>
    </g>
    <path class="il-line il-thin" d="M118 74q-4 6 0 12M114 70q-6 10 0 20M152 76q4 6 0 12M156 72q4 10 0 20M126 64l-3-6M140 62l3-6"/>`,

  // A grumpy ghost woven entirely out of old cobweb hangs in the cellar corner, a tiny spider sitting on its head; it
  // breathes an icy draught across the shelf so the jam jars frost over, and a mouse in a scarf shivers past.
  'bg.cobweb-ghost': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.5" d="M0 104h160"/>
    <rect class="il-wood-dark il-ink" x="-2" y="-2" width="164" height="10"/>
    <path class="il-white il-ink il-thin" d="M90 8l3 10 3-10zM112 8l2 7 2-7zM132 8l3 12 3-12zM150 8l2 6 2-6z"/>
    <path class="il-light il-thin" opacity="0.5" d="M0 8l20 30M0 8l36 10M0 8l6 40M2 22q8-2 12-8M3 34q14-2 22-16"/>
    <rect class="il-wood il-ink" x="104" y="70" width="58" height="5"/>
    <rect class="il-red il-ink il-thin" x="110" y="54" width="14" height="16" rx="3"/>
    <rect class="il-white il-ink il-thin" x="109" y="50" width="16" height="5" rx="1"/>
    <rect class="il-purple il-ink il-thin" x="130" y="56" width="13" height="14" rx="3"/>
    <rect class="il-white il-ink il-thin" x="129" y="52" width="15" height="5" rx="1"/>
    <path class="il-white il-thin" opacity="0.7" d="M111 58h5M131 60h5M112 64h3"/>
    <rect class="il-orange il-ink il-thin" x="148" y="58" width="12" height="12" rx="3"/>
    <path class="il-white il-ink" opacity="0.88" d="M14 10c26-6 52 4 60 26 6 18 2 40-2 62l-7-6-7 8-7-8-8 8-7-8-8 7c-8-24-14-58-14-89z"/>
    <path class="il-line il-thin" opacity="0.35" d="M30 12l16 82M30 12l40 34M30 12l38 4M30 12l2 84M30 12l-12 70M22 30q12 4 24-6M18 50q22 6 40-6 10-6 14-14M20 70q20 8 38-2 10-6 16-14M24 88q14 4 30-2"/>
    <path class="il-line il-thin" d="M14 10L0 0M74 34L84 8M24 10L18 0"/>
    <path class="il-line" d="M36 40l8 4M60 40l-8 4"/>
    <ellipse class="il-dark" cx="42" cy="50" rx="4" ry="5"/><ellipse class="il-dark" cx="56" cy="50" rx="4" ry="5"/>
    <circle class="il-white" cx="43" cy="48" r="1.2"/><circle class="il-white" cx="57" cy="48" r="1.2"/>
    <ellipse class="il-dark il-ink il-thin" cx="62" cy="64" rx="4" ry="5"/>
    <path class="il-water" opacity="0.5" d="M66 60c14-4 30-2 44 4l-2 6c-14-4-28-6-42-4z"/>
    <path class="il-light il-dash" d="M68 60q20-6 40 2M68 66q18-2 36 4M68 70q16 2 30 8"/>
    <path class="il-light il-thin" d="M92 50v8M88 54h8M89 51l6 6M95 51l-6 6M102 80v6M99 83h6"/>
    <circle class="il-dark il-ink il-thin" cx="44" cy="22" r="3"/>
    <ellipse class="il-dark il-ink il-thin" cx="44" cy="17" rx="4.6" ry="3.6"/>
    <path class="il-line il-thin" d="M40 18l-4-2M40 20l-4 1M48 18l4-2M48 20l4 1M44 14V8"/>
    <circle class="il-white" cx="42.6" cy="22" r="1"/><circle class="il-white" cx="45.4" cy="22" r="1"/>
    <path class="il-line il-thin" d="M114 92q4-4 2-8"/>
    <ellipse class="il-grey il-ink" cx="128" cy="96" rx="12" ry="8"/>
    <circle class="il-grey il-ink" cx="116" cy="92" r="6"/>
    <circle class="il-grey il-ink il-thin" cx="116" cy="85" r="3.4"/><circle class="il-pink" cx="116" cy="85" r="1.6"/>
    <circle class="il-dark" cx="113" cy="91" r="1.4"/>
    <circle class="il-pink" cx="110.6" cy="93.4" r="1.4"/>
    <path class="il-red il-ink il-thin" d="M120 88c2 6 4 8 8 8v4c-5 0-9-2-10-10z"/>
    <path class="il-red il-ink il-thin" d="M124 96l-4 8 4 1 3-8z"/>
    <path class="il-line il-thin" d="M140 98q8 0 12-6M118 102l-1 2M126 104v2M134 104v2"/>
    <path class="il-line il-thin" d="M104 88l-3-2M104 94l-4 0M106 82l-3-3M146 86l3-3"/>`,

  // A wind-up tin blackbird with rivets and a big gold key in its back pecks furiously at the lawn; down in its tunnel a
  // chubby worm in a hard hat looks up, sweating. The key is still whirring.
  'bg.tin-blackbird': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow" opacity="0.8" cx="24" cy="18" r="9"/>
    <path class="il-earth" d="M0 78h160v42H0z"/>
    <path class="il-earth-dark" opacity="0.6" d="M0 100c30-4 50 4 80 0s50-6 80 0v20H0z"/>
    <path class="il-grass il-ink" d="M-2 72h164v8H-2z"/>
    <path class="il-grass il-ink il-thin" d="M6 72l2-6 2 6M136 72l2-7 2 7M148 72l2-5 2 5"/>
    <g class="il-stone il-ink il-thin">
      <ellipse cx="16" cy="92" rx="5" ry="3.4"/><ellipse cx="60" cy="110" rx="4" ry="3"/><ellipse cx="146" cy="112" rx="5" ry="3.4"/>
    </g>
    <path class="il-line il-thin" opacity="0.5" d="M30 80q2 8-2 14M40 80q-2 6 2 10M150 80q-2 8 2 12"/>
    <path class="il-cave" d="M84 80h28v12c0 10-4 18-14 22H84c-8-4-10-14-6-22z" opacity="0.5"/>
    <g class="il-pink il-ink">
      <circle cx="82" cy="102" r="4"/><circle cx="86" cy="106" r="4.6"/><circle cx="92" cy="109" r="5"/><circle cx="99" cy="109" r="5.2"/>
      <circle cx="105" cy="106" r="5.4"/><circle cx="108" cy="100" r="5.6"/><circle cx="109" cy="93" r="5.8"/>
    </g>
    <circle class="il-pink il-ink" cx="108" cy="86" r="7.5"/>
    <path class="il-yellow il-ink" d="M99 84a9 8 0 0 1 18 0z"/>
    <rect class="il-yellow il-ink il-thin" x="97" y="83" width="22" height="3" rx="1.5"/>
    <circle class="il-white il-ink il-thin" cx="105" cy="88" r="2.6"/><circle class="il-dark" cx="105" cy="87" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="111" cy="88" r="2.6"/><circle class="il-dark" cx="111" cy="87" r="1.2"/>
    <ellipse class="il-dark" cx="108" cy="92" rx="1.6" ry="1.2"/>
    <ellipse class="il-water il-ink il-thin" cx="118" cy="90" rx="1.6" ry="2.4"/><ellipse class="il-water il-ink il-thin" cx="98" cy="92" rx="1.4" ry="2.2"/>
    <g transform="rotate(14 66 52)">
      <path class="il-line il-thick" d="M60 64l-2 12M72 64l2 12"/>
      <path class="il-line il-thin" d="M52 76h8M70 76h8"/>
      <path class="il-dark il-ink" d="M44 48l-30-12 6 18z"/>
      <ellipse class="il-dark il-ink" cx="64" cy="52" rx="26" ry="16"/>
      <path class="il-light il-thin" opacity="0.6" d="M64 36v32M44 46h40"/>
      <path class="il-grey il-ink il-thin" d="M50 50c8-6 20-6 26 2-8 6-20 6-26-2z"/>
      <g class="il-metal"><circle cx="48" cy="44" r="1.3"/><circle cx="48" cy="60" r="1.3"/><circle cx="80" cy="44" r="1.3"/><circle cx="80" cy="60" r="1.3"/><circle cx="64" cy="64" r="1.3"/></g>
      <path class="il-light il-thin" d="M46 42q8-6 18-6"/>
      <circle class="il-dark il-ink" cx="92" cy="40" r="12"/>
      <path class="il-yellow il-ink" d="M102 36l16 6-15 5z"/>
      <circle class="il-yellow il-ink il-thin" cx="94" cy="37" r="5"/>
      <circle class="il-white" cx="94" cy="37" r="3.2"/><circle class="il-dark" cx="95.6" cy="38" r="1.8"/>
      <path class="il-line" d="M88 31l10 3"/>
      <path class="il-light il-thin" d="M84 34q2-4 6-5"/>
      <rect class="il-gold il-ink" x="58" y="26" width="5" height="12"/>
      <ellipse class="il-gold il-ink" cx="53" cy="22" rx="7" ry="5"/>
      <ellipse class="il-gold il-ink" cx="68" cy="22" rx="7" ry="5"/>
      <circle class="il-dark" cx="60.5" cy="23" r="2"/>
    </g>
    <path class="il-line il-thin" d="M40 14q8-8 18-6M74 12q8 2 12 8"/>
    <path class="il-line il-thin" d="M122 50l8 2M120 58l8 6M124 44l6-4"/>
    <path class="il-grass il-ink il-thin" d="M118 66l4-5 1 6zM126 64l5-2-2 5z"/>`,

  // Yesterday's slime trail: a glistening, smugly grinning goo path winds across the lawn, a pair of trainers stuck fast
  // in it; far away by the fence, Gerda the snail cheerfully crawls off with a tiny rucksack.
  'bg.slime-trail': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g class="il-wood il-ink il-thin">
      <path d="M4 66V36l5-6 5 6v30zM22 66V36l5-6 5 6v30zM40 66V36l5-6 5 6v30zM58 66V36l5-6 5 6v30zM76 66V36l5-6 5 6v30z"/>
      <path d="M94 66V36l5-6 5 6v30zM112 66V36l5-6 5 6v30zM130 66V36l5-6 5 6v30zM148 66V36l5-6 5 6v30z"/>
    </g>
    <path class="il-wood-dark" d="M0 44h160v4H0zM0 56h160v4H0z" opacity="0.8"/>
    <path class="il-grass il-ink" d="M-2 64h164v58H-2z"/>
    <path class="il-grass il-ink il-thin" d="M10 118l2-6 2 6M150 100l2-6 2 6M120 116l2-6 2 6M12 76l2-5 2 5"/>
    <path class="il-slime il-ink il-thin" opacity="0.9" d="M-2 90C30 82 50 96 76 88S118 70 146 68l0 5C120 76 104 98 78 106S30 98-2 114z"/>
    <path class="il-light il-thin" d="M6 96q10-4 18-4M60 92q8 0 14-4M100 82q10-6 20-9M128 72q6-1 10-2M30 108q8-2 14 0"/>
    <path class="il-white il-thin" d="M14 104l1-3 1 3 3 1-3 1-1 3-1-3-3-1zM112 80l1-3 1 3 3 1-3 1-1 3-1-3-3-1z"/>
    <circle class="il-white il-ink il-thin" cx="30" cy="97" r="4.6"/><circle class="il-dark" cx="32" cy="97.6" r="2"/>
    <circle class="il-white il-ink il-thin" cx="44" cy="97" r="4.6"/><circle class="il-dark" cx="46" cy="97.6" r="2"/>
    <path class="il-line il-thin" d="M25 91l9 2M40 92l8-2"/>
    <path class="il-line il-thin" d="M30 104q8 5 16 0"/>
    <path class="il-white il-thin" d="M32 104.6h12l-1 1.6h-10z"/>
    <path class="il-red il-ink" d="M70 98c0-6 4-9 8-9l3 4h6c5 0 8 2 8 5z"/>
    <path class="il-white il-ink il-thin" d="M69 98h27v3H69z"/>
    <path class="il-line il-thin" d="M80 92l3-2M83 94l3-2"/>
    <path class="il-blue il-ink" d="M92 88c0-6 4-9 8-9l3 4h6c5 0 8 2 8 5z"/>
    <path class="il-white il-ink il-thin" d="M91 88h27v3H91z"/>
    <path class="il-line il-thin" d="M102 82l3-2M105 84l3-2"/>
    <path class="il-slime il-ink il-thin" d="M72 100q1 4 3 0M86 101q1 5 3 0M96 91q1 4 3 0M110 91q1 5 3 0"/>
    <path class="il-line il-thin" d="M80 84q2-8-2-14M106 74q2-8-2-12"/>
    <path class="il-line il-thin" d="M120 58q-6-6-2-12M126 60q-4-10 2-16"/>
    <path class="il-skin il-ink il-thin" d="M138 68c0-3 2-4 6-4h10c2-4 6-3 6 0v4z"/>
    <path class="il-line il-thin" d="M156 64l-1-5M159 64l1-5"/>
    <circle class="il-orange il-ink il-thin" cx="146" cy="61" r="6"/>
    <path class="il-line il-thin" d="M146 61c1 0 2-2 0-2-2 0-3 2-2 3 1 3 5 2 5-1"/>
    <rect class="il-red il-ink il-thin" x="139" y="52" width="6" height="7" rx="2"/>
    <circle class="il-dark" cx="155.4" cy="58.6" r="0.9"/><circle class="il-dark" cx="160" cy="58.6" r="0.9"/>
    <path class="il-line il-thin" d="M128 66h3M132 66h3"/>`,

  // A cheeky mosquito with a napkin bib, a bendy-straw snout and a round, full tummy holds up one finger: just one more
  // little sip. Its buzz rings round the night garden; a hedgehog in a nightcap clutches its ears, wide awake.
  'bg.mosquito': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <circle class="il-paper" cx="136" cy="20" r="11"/>
    <circle class="il-stone" opacity="0.5" cx="132" cy="18" r="2.4"/><circle class="il-stone" opacity="0.5" cx="139" cy="24" r="1.6"/>
    <path class="il-white" d="M20 14l1-3 1 3 3 1-3 1-1 3-1-3-3-1zM100 10l1-3 1 3 3 1-3 1-1 3-1-3-3-1zM60 8l0.8-2 0.8 2 2 0.8-2 0.8-0.8 2-0.8-2-2-0.8z"/>
    <path class="il-grass il-ink" d="M-2 100h164v22H-2z"/>
    <path class="il-grass il-ink il-thin" d="M6 100l2-7 2 7M40 100l2-6 2 6M150 100l2-6 2 6"/>
    <path class="il-light il-thin" opacity="0.6" d="M24 40q-8 14 0 28M16 34q-12 20 0 40M120 44q8 12 2 26M128 40q12 18 2 36"/>
    <ellipse class="il-water il-ink il-thin" opacity="0.6" cx="74" cy="28" rx="10" ry="18" transform="rotate(-30 74 28)"/>
    <ellipse class="il-water il-ink il-thin" opacity="0.6" cx="88" cy="30" rx="9" ry="17" transform="rotate(20 88 30)"/>
    <path class="il-light il-thin" d="M62 12q-4 4-2 8M100 14q4 4 2 8"/>
    <g class="il-line il-thin">
      <path d="M70 60l-6 14-6 16"/><path d="M76 62l-2 16 2 14"/><path d="M84 62l6 14 2 14"/>
      <path d="M92 64l14 10 8 14"/><path d="M60 52l-12-6"/>
    </g>
    <ellipse class="il-pink il-ink" cx="100" cy="58" rx="20" ry="14"/>
    <path class="il-grey" opacity="0.6" d="M92 45q-4 13 0 26M102 44q-4 14 0 28M112 47q-3 11 0 22"/>
    <path class="il-light il-thin" d="M90 50q6-4 14-4"/>
    <ellipse class="il-grey il-ink" cx="74" cy="54" rx="11" ry="9"/>
    <path class="il-line il-thin" d="M74 54l-2-12M72 42l4-6"/>
    <circle class="il-skin il-ink il-thin" cx="76" cy="35" r="2.4"/>
    <path class="il-line il-thin" d="M76 33v-5"/>
    <circle class="il-grey il-ink" cx="56" cy="46" r="11"/>
    <path class="il-white il-ink il-thin" d="M48 52l16 0-8 12z"/>
    <circle class="il-white il-ink il-thin" cx="51" cy="43" r="5"/><circle class="il-dark" cx="49.6" cy="44" r="2.8"/>
    <circle class="il-white il-ink il-thin" cx="61" cy="42" r="5"/><circle class="il-dark" cx="59.6" cy="43" r="2.8"/>
    <circle class="il-white" cx="48.8" cy="43" r="0.9"/><circle class="il-white" cx="58.8" cy="42" r="0.9"/>
    <path class="il-line il-thin" d="M46 37l6 1M57 36l7-1"/>
    <path class="il-line il-thin" d="M50 50q4 2 8-1"/>
    <path class="il-white il-ink il-thin" d="M46 49l-7 3-3 5 2 1 2-4 7-2z"/>
    <path class="il-line il-thin" d="M50 35l-4-8M58 35l2-8"/>
    <ellipse class="il-dark" opacity="0.25" cx="132" cy="102" rx="22" ry="3"/>
    <path class="il-wood-dark il-ink" d="M110 100c0-16 10-24 24-24s22 8 22 24l-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4 4-4-4z"/>
    <path class="il-line il-thin" d="M118 86l-4-6M126 80l-2-7M136 78l1-7M146 82l4-6M152 90l5-3"/>
    <path class="il-skin il-ink" d="M116 90c-8 0-12 4-12 8 0 3 4 4 8 4h10z"/>
    <circle class="il-dark" cx="104" cy="97" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="116" cy="91" r="3.4"/><circle class="il-dark" cx="116" cy="91" r="1.3"/>
    <path class="il-line il-thin" d="M112 86l6 1M114 98q-3 1-4 0"/>
    <path class="il-blue il-ink" d="M118 80c4-12 22-14 30-6-8-2-16 0-22 8z"/>
    <path class="il-blue il-ink il-thin" d="M148 74c4 2 6 6 4 10"/>
    <circle class="il-white il-ink il-thin" cx="152" cy="86" r="3"/>
    <ellipse class="il-skin il-ink il-thin" cx="124" cy="80" rx="3.6" ry="4.6" transform="rotate(-20 124 80)"/>`,

  // The sticky weed by the garden fence, a happy green tangle of stems and burrs with big adoring eyes, hugs a sock with
  // one long tendril; hearts float up, burrs cover the sock, and a shoe has been abandoned in its creeping stems.
  'bg.cleavers': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <g class="il-wood il-ink il-thin">
      <path d="M8 104V34l6-8 6 8v70zM34 104V34l6-8 6 8v70zM114 104V34l6-8 6 8v70zM140 104V34l6-8 6 8v70z"/>
    </g>
    <path class="il-wood-dark il-ink il-thin" d="M0 44h160v6H0zM0 82h160v6H0z"/>
    <path class="il-grass il-ink" d="M-2 102h164v20H-2z"/>
    <path class="il-line il-thin" d="M60 50c-10-8-20-14-36-12M96 46c10-6 22-8 34-4M62 74c-8 8-16 14-22 28M74 80c-2 10-4 16-2 24M90 78c6 8 10 16 18 24M30 38c-6-2-12 0-16 4M130 42c6 2 10 6 14 10"/>
    <g class="il-green il-ink il-thin">
      <path d="M40 38c-2-5-6-7-10-6 1 5 5 7 10 6zM40 38c3-4 7-5 10-3-2 4-6 5-10 3z"/>
      <path d="M118 42c-2-5-6-7-10-6 1 5 5 7 10 6zM118 42c3-4 7-5 10-3-2 4-6 5-10 3z"/>
      <path d="M48 92c-4-3-8-3-10 0 3 3 7 3 10 0zM48 92c1-5 4-8 8-8 0 5-3 8-8 8z"/>
      <path d="M100 92c4-3 8-3 10 0-3 3-7 3-10 0zM100 92c-1-5-4-8-8-8 0 5 3 8 8 8z"/>
      <path d="M140 48c2-5 6-6 9-4-2 4-5 5-9 4z"/>
    </g>
    <path class="il-dark il-ink" d="M60 108c0-8 4-12 10-12l4 4h8c6 0 8 4 8 8z"/>
    <path class="il-white il-ink il-thin" d="M59 108h32v4H59z"/>
    <path class="il-line il-thin" d="M68 100l4-2M70 103l4-2"/>
    <path class="il-line il-thin" d="M56 104q6-12 16-8M80 96q6-6 12 2"/>
    <path class="il-green il-ink" d="M58 52q-4-12 8-14q4-10 14-4q10-6 14 4q12 2 8 14q8 8 0 16q2 12-10 12q-6 8-14 2q-10 6-14-4q-12-2-8-14q-6-6 2-12z"/>
    <path class="il-line il-thin" opacity="0.45" d="M62 46q6-6 10 0t8-2M90 44q4 6 10 4M60 66q6 4 4 10M96 64q-6 6-2 12M76 74q4 4 8 0"/>
    <g class="il-green il-ink il-thin">
      <path d="M66 38c-2-6 0-10 4-12 2 4 0 9-4 12z"/><path d="M96 38c2-6 6-8 10-8-1 5-5 8-10 8z"/>
      <path d="M54 62c-6 0-9 3-10 6 5 1 8-1 10-6z"/><path d="M106 70c5 1 8 4 8 8-5 0-8-3-8-8z"/>
    </g>
    <g class="il-grass il-ink il-thin">
      <circle cx="64" cy="44" r="1.8"/><circle cx="96" cy="48" r="1.8"/><circle cx="62" cy="70" r="1.8"/><circle cx="98" cy="70" r="1.8"/><circle cx="80" cy="38" r="1.8"/>
    </g>
    <circle class="il-white il-ink il-thin" cx="73" cy="56" r="6"/><circle class="il-dark" cx="74" cy="57" r="3.2"/><circle class="il-white" cx="72.8" cy="55.4" r="1.2"/>
    <circle class="il-white il-ink il-thin" cx="88" cy="56" r="6"/><circle class="il-dark" cx="87" cy="57" r="3.2"/><circle class="il-white" cx="85.8" cy="55.4" r="1.2"/>
    <path class="il-line il-thin" d="M68 47q4-3 8-1M84 46q4-2 8 1"/>
    <path class="il-line il-thin" d="M74 66q6 6 12 0"/>
    <circle class="il-pink" opacity="0.8" cx="67" cy="64" r="2.6"/><circle class="il-pink" opacity="0.8" cx="94" cy="64" r="2.6"/>
    <path class="il-white il-ink" d="M110 66h14v20c0 4 4 6 8 6h4v8h-8c-12 0-18-6-18-14z"/>
    <path class="il-red il-ink il-thin" d="M109 62h16v5h-16z"/>
    <path class="il-line il-thin" d="M116 60v-10M118 60v-10"/>
    <path class="il-line" d="M102 58c8-2 14 4 12 12-2 6-8 8-6 14 2 4 8 4 12 2"/>
    <g class="il-grass il-ink il-thin">
      <circle cx="114" cy="74" r="1.8"/><circle cx="120" cy="80" r="1.8"/><circle cx="116" cy="90" r="1.8"/><circle cx="128" cy="96" r="1.8"/>
      <circle cx="122" cy="70" r="1.8"/><circle cx="134" cy="94" r="1.8"/><circle cx="112" cy="84" r="1.8"/>
    </g>
    <path class="il-red il-ink il-thin" d="M62 20c-2-4 2-6 4-3 2-3 6-1 4 3l-4 4zM96 14c-2-4 2-6 4-3 2-3 6-1 4 3l-4 4zM80 6c-1.6-3 1.6-5 3-2.4 1.6-2.4 4.8-1 3.2 2.4l-3.2 3.2z"/>`,

  // A half-asleep mole cricket in a nightcap digs on through its tunnel with huge shovel paws, eyes drooping, chirping
  // little music notes in its sleep while clods of earth fly behind it.
  'bg.mole-cricket': `
    <rect class="il-earth" x="0" y="0" width="160" height="120"/>
    <path class="il-sky" d="M0 0h160v10H0z"/>
    <path class="il-grass il-ink" d="M-2 10h164v8H-2z"/>
    <path class="il-grass il-ink il-thin" d="M10 10l2-6 2 6M60 10l2-7 2 7M120 10l2-5 2 5"/>
    <path class="il-earth-dark" opacity="0.6" d="M0 30c40-6 80 6 160-2v8c-80 8-120-4-160 2zM0 108c40-4 100 4 160-2v14H0z"/>
    <path class="il-line il-thin" opacity="0.5" d="M30 18q2 10-4 16M30 26l6 4M140 18q-4 8 2 14"/>
    <g class="il-stone il-ink il-thin">
      <ellipse cx="18" cy="96" rx="5" ry="3.4"/><ellipse cx="146" cy="40" rx="4" ry="3"/><ellipse cx="128" cy="112" rx="5" ry="3"/>
    </g>
    <path class="il-cave" d="M-2 40c26 0 34 12 46 24 10 10 26 14 50 14h70v26H94c-30 0-48-8-62-20-10-8-18-16-34-16z"/>
    <path class="il-earth-dark il-ink il-thin" d="M30 70l4 4-4 2zM20 56l3 3-4 1z"/>
    <path class="il-line il-thin" d="M148 92q4-6 0-10"/>
    <path class="il-line il-thick" d="M118 90l12 4 8 8"/>
    <path class="il-line" d="M112 92l4 10M100 94l-2 10"/>
    <ellipse class="il-wood il-ink" cx="112" cy="88" rx="22" ry="11"/>
    <path class="il-line il-thin" d="M100 80v16M108 78v20M116 78v20M124 80v16"/>
    <path class="il-wood-dark il-ink il-thin" d="M86 80c14-6 30-6 40 0-12 4-28 4-40 0z"/>
    <ellipse class="il-wood-dark il-ink" cx="84" cy="86" rx="14" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M76 80q6-4 14-2"/>
    <path class="il-line il-thin" d="M56 82q-10-8-18-4M58 80q-6-10-14-10"/>
    <circle class="il-wood il-ink" cx="64" cy="88" r="12"/>
    <path class="il-wood-dark il-ink" d="M58 94l-12 2-8 8 4 1 2-3 2 3 2-3 2 3 3-3 2 2 6-8z"/>
    <path class="il-wood-dark il-ink" d="M68 98l-4 8 3 2 2-2 2 2 2-2 2 2 1-4z"/>
    <circle class="il-white il-ink il-thin" cx="59" cy="87" r="4.4"/><circle class="il-dark" cx="59" cy="89" r="2"/>
    <circle class="il-white il-ink il-thin" cx="69" cy="87" r="4.4"/><circle class="il-dark" cx="69" cy="89" r="2"/>
    <path class="il-wood-dark il-ink il-thin" d="M54.6 87a4.4 4.4 0 0 1 8.8 0zM64.6 87a4.4 4.4 0 0 1 8.8 0z"/>
    <path class="il-line il-thin" d="M60 95q4 2 8 0"/>
    <path class="il-blue il-ink" d="M52 80c0-10 8-14 14-14 8 0 12 6 22 0 2 4 0 8-6 10-8 4-18 4-30 4z"/>
    <path class="il-light il-dash" d="M53 79q12-3 26-2"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="66" r="3.4"/>
    <g class="il-earth-dark il-ink il-thin">
      <circle cx="34" cy="94" r="3"/><circle cx="26" cy="86" r="2.4"/><circle cx="38" cy="102" r="2"/><circle cx="22" cy="100" r="2.6"/>
    </g>
    <path class="il-line il-thin" d="M44 96l-6-2M44 100l-6 2M42 92l-4-4"/>
    <path class="il-line" d="M66 54h7l-7 7h7M78 42h6l-6 6h6"/>
    <path class="il-line il-thin" d="M102 60V48l7 2v12"/>
    <ellipse class="il-dark" cx="100" cy="61" rx="2.6" ry="2" transform="rotate(-20 100 61)"/>
    <ellipse class="il-dark" cx="107" cy="63" rx="2.6" ry="2" transform="rotate(-20 107 63)"/>
    <path class="il-line il-thin" d="M124 64V54l5 2"/>
    <ellipse class="il-dark" cx="122" cy="65" rx="2.6" ry="2" transform="rotate(-20 122 65)"/>`,

  // An ant traffic cop in a peaked cap blows a whistle and raises a round stop sign at a giant boot that freezes in mid-air
  // above the ant road; behind the cop the queue of ants waits patiently with a leaf and a crumb.
  'bg.ant-traffic-police': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass il-ink" d="M-2 62h164v12H-2z"/>
    <path class="il-earth" d="M0 74h160v46H0z"/>
    <path class="il-earth-dark il-ink il-thin" d="M-2 86h164v20H-2z"/>
    <path class="il-light il-dash" d="M0 96h160"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="20" cy="112" rx="5" ry="3"/><ellipse cx="146" cy="78" rx="4" ry="2.6"/></g>
    <path class="il-wood-dark il-ink" d="M6 -2h30v20l14 6c8 4 10 10 10 16H4c-2-10 2-18 2-24z"/>
    <path class="il-dark il-ink" d="M2 40h60v8H2z"/>
    <path class="il-line il-thin" d="M14 18h20M24 4l8 2M24 9l8 2"/>
    <path class="il-line il-thin" d="M8 54l-2 6M22 54v8M38 54l2 8M52 54l4 6"/>
    <ellipse class="il-water il-ink il-thin" cx="56" cy="28" rx="1.8" ry="2.8"/>
    <path class="il-dark il-ink il-thin" d="M58 6h3l-1 10h-1zM59.5 20a1.6 1.6 0 1 0 0.1 0z"/>
    <path class="il-line" d="M104 90l-4 10M114 90l4 10"/>
    <path class="il-line il-thin" d="M98 100h4M116 100h4"/>
    <ellipse class="il-red il-ink" cx="109" cy="80" rx="12" ry="13"/>
    <path class="il-line il-thin" opacity="0.5" d="M99 78q10 4 20 0M100 86q9 3 18 0"/>
    <ellipse class="il-red il-ink" cx="108" cy="60" rx="7" ry="8"/>
    <path class="il-line" d="M114 58l10 4 4-6"/>
    <path class="il-line" d="M114 64l8 8"/>
    <circle class="il-white il-ink il-thin" cx="122" cy="73" r="3"/>
    <path class="il-line" d="M102 58l-8-4-6 0"/>
    <path class="il-line" d="M102 64l-10 2"/>
    <path class="il-line il-thin" d="M86 70V50"/>
    <circle class="il-red il-ink" cx="86" cy="42" r="11"/>
    <rect class="il-white il-ink il-thin" x="79" y="40" width="14" height="4"/>
    <circle class="il-white il-ink il-thin" cx="90" cy="66" r="3"/>
    <circle class="il-red il-ink" cx="108" cy="40" r="11"/>
    <path class="il-line il-thin" d="M102 30l-6-10M114 30l6-10"/>
    <circle class="il-red il-ink il-thin" cx="96" cy="20" r="2"/><circle class="il-red il-ink il-thin" cx="120" cy="20" r="2"/>
    <path class="il-blue il-ink" d="M96 33c0-8 6-10 12-10s12 2 12 10z"/>
    <path class="il-dark il-ink il-thin" d="M94 33h26l-4 4H96z"/>
    <circle class="il-gold il-ink il-thin" cx="108" cy="28" r="2.4"/>
    <circle class="il-white il-ink il-thin" cx="103" cy="40" r="3.6"/><circle class="il-dark" cx="102" cy="40" r="1.8"/>
    <circle class="il-white il-ink il-thin" cx="112" cy="40" r="3.6"/><circle class="il-dark" cx="111" cy="40" r="1.8"/>
    <path class="il-line il-thin" d="M99 35l6 2M116 35l-6 2"/>
    <rect class="il-metal il-ink il-thin" x="96" y="45" width="9" height="5" rx="2"/>
    <path class="il-line il-thin" d="M92 46l-4-2M92 50l-4 1"/>
    <g class="il-line il-thin">
      <path d="M128 98l-2 4M132 98v4M136 98l2 4M144 98l-2 4M148 98v4M152 98l2 4"/>
    </g>
    <g class="il-red il-ink il-thin">
      <circle cx="128" cy="94" r="3.4"/><ellipse cx="133" cy="95" rx="2.4" ry="2"/><ellipse cx="139" cy="94" rx="4" ry="3.4"/>
      <circle cx="146" cy="94" r="3.4"/><ellipse cx="151" cy="95" rx="2.4" ry="2"/><ellipse cx="157" cy="94" rx="4" ry="3.4"/>
    </g>
    <path class="il-green il-ink il-thin" d="M126 90c2-10 12-14 18-10-2 8-10 12-18 10z"/>
    <path class="il-line il-thin" d="M127 89q6-4 15-8"/>
    <rect class="il-gold il-ink il-thin" x="143" y="83" width="8" height="7" rx="2"/>`,

  // A gigantic smug courgette lies across the vegetable bed, its flower still on one end; a ladybird climbs up a ladder to
  // reach the top, and its vine is already curling over the roof of the small garden shed behind it.
  'bg.zucchini': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow" cx="22" cy="18" r="9"/>
    <path class="il-wood il-ink" d="M112 46h44v50h-44z"/>
    <path class="il-line il-thin" opacity="0.5" d="M120 46v50M128 46v50M136 46v50M144 46v50M152 46v50"/>
    <path class="il-red il-ink" d="M106 48l28-20 28 20z"/>
    <rect class="il-wood-dark il-ink il-thin" x="140" y="70" width="12" height="26"/>
    <path class="il-earth il-ink" d="M-2 94h164v28H-2z"/>
    <path class="il-earth-dark" opacity="0.6" d="M0 104h160v4H0zM0 114h160v3H0z"/>
    <path class="il-line il-thin" d="M118 44c4-10 12-12 18-18 6-6 10-4 14-8M146 18c4-2 4-6 0-6M132 30c-4-2-4-6 0-6"/>
    <path class="il-green il-ink il-thin" d="M124 38c4-6 10-6 12 0-4 4-8 4-12 0zM146 22c2-6 8-6 10-2-2 4-6 6-10 2z"/>
    <path class="il-green il-ink" d="M110 60c4-14 18-18 26-10 6-2 8 4 4 8 4 4 0 10-6 8-6 6-18 6-24-6z"/>
    <path class="il-line il-thin" d="M114 60q10-2 20-6"/>
    <path class="il-green il-ink" d="M14 74c0-18 20-26 56-26h40c14 0 24 8 24 24s-10 26-26 26H44c-20 0-30-8-30-24z"/>
    <path class="il-grass" opacity="0.7" d="M30 58c20-4 50-6 80-4l-2 4c-30-2-56 0-76 4zM24 86c24 4 60 4 90 0l-2 4c-30 4-62 4-86 0z"/>
    <path class="il-line il-thin" opacity="0.3" d="M20 70h110M18 78h114"/>
    <path class="il-light il-thin" d="M40 54q20-4 40-4"/>
    <g class="il-white il-thin" opacity="0.8"><circle cx="34" cy="66" r="0.9"/><circle cx="100" cy="62" r="0.9"/><circle cx="112" cy="84" r="0.9"/><circle cx="30" cy="84" r="0.9"/></g>
    <path class="il-grass il-ink" d="M132 66l8-4 2 8-2 8-8-4z"/>
    <path class="il-line" d="M141 70h6"/>
    <path class="il-yellow il-ink" d="M16 72l-12-6 2-4 10 2-6-12 6-2 4 12 4-12 6 2-4 12z"/>
    <path class="il-orange il-ink il-thin" d="M14 72c-4 2-6 6-4 10 4 0 8-4 4-10z"/>
    <circle class="il-white il-ink" cx="62" cy="68" r="7"/><circle class="il-dark" cx="64" cy="69" r="3.4"/>
    <circle class="il-white il-ink" cx="82" cy="68" r="7"/><circle class="il-dark" cx="84" cy="69" r="3.4"/>
    <path class="il-dark" d="M54 64q8-4 14-1v2q-7-2-14 1zM76 63q6-3 14 1v2q-8-3-14-1z"/>
    <path class="il-dark il-ink il-thin" d="M62 80q10 8 22 0q-10 4-22 0z"/>
    <path class="il-white il-thin" d="M66 81.6h14l-1 1.6h-12z"/>
    <path class="il-wood-dark il-ink il-thin" d="M30 96l14-46M38 98l14-46"/>
    <path class="il-line il-thin" d="M33 86h8M36 76h8M39 66h8M42 56h8"/>
    <path class="il-line il-thin" d="M38 70l-4 2M38 76l-4 0M50 70l4-2M50 76l4 0M40 80l-2 3M48 80l2 3"/>
    <ellipse class="il-red il-ink" cx="44" cy="74" rx="8" ry="9"/>
    <path class="il-line il-thin" d="M44 66v17"/>
    <circle class="il-dark" cx="40" cy="72" r="1.6"/><circle class="il-dark" cx="48" cy="72" r="1.6"/><circle class="il-dark" cx="41" cy="79" r="1.4"/><circle class="il-dark" cx="47" cy="79" r="1.4"/>
    <circle class="il-dark il-ink il-thin" cx="44" cy="64" r="4.4"/>
    <circle class="il-white" cx="42.4" cy="62.6" r="1.3"/><circle class="il-white" cx="45.6" cy="62.6" r="1.3"/>
    <path class="il-line il-thin" d="M42 60l-2-4M46 60l2-4"/>`,

  // The gurgling cellar pump roars with a wide-open mouth full of bubbles; its puddle swirls into the floor drain,
  // taking a jacket that waves goodbye with one sleeve, while a rubber duck rides the whirlpool and a welly stands safe.
  'bg.cellar-pump': `
    <rect class="il-stone" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 14h160M0 30h160M0 46h160M0 62h160M0 78h160M20 0v14M60 0v14M100 0v14M140 0v14M40 14v16M80 14v16M120 14v16M20 30v16M60 30v16M100 30v16M140 30v16M40 46v16M120 46v16M20 62v16M140 62v16"/>
    <rect class="il-grey il-ink" x="-2" y="86" width="164" height="36"/>
    <path class="il-metal il-ink" d="M62 30V8h98v10H74v12z"/>
    <rect class="il-metal il-ink il-thin" x="58" y="26" width="20" height="6" rx="1"/>
    <rect class="il-metal il-ink il-thin" x="96" y="5" width="6" height="16" rx="1"/>
    <path class="il-water il-ink il-thin" opacity="0.85" d="M10 100c0-6 20-10 60-10s80 4 84 10-30 12-74 12-70-6-70-12z"/>
    <path class="il-light il-thin" d="M30 100q20-4 40-2M90 106q20 0 34-4"/>
    <path class="il-red il-ink" d="M40 88V44c0-6 12-12 28-12s28 6 28 12v44c0 4-12 8-28 8s-28-4-28-8z"/>
    <path class="il-line il-thin" d="M40 50c10 4 46 4 56 0M40 80c10 4 46 4 56 0"/>
    <g class="il-metal"><circle cx="46" cy="56" r="1.4"/><circle cx="90" cy="56" r="1.4"/><circle cx="46" cy="76" r="1.4"/><circle cx="90" cy="76" r="1.4"/></g>
    <circle class="il-white il-ink" cx="58" cy="54" r="6"/><circle class="il-dark" cx="59" cy="55" r="3"/>
    <circle class="il-white il-ink" cx="78" cy="54" r="6"/><circle class="il-dark" cx="77" cy="55" r="3"/>
    <path class="il-line il-thick" d="M50 44l12 5M86 44l-12 5"/>
    <ellipse class="il-dark il-ink" cx="68" cy="70" rx="12" ry="8"/>
    <path class="il-white il-thin" d="M58 67h20l-1 2H59z"/>
    <g class="il-water il-ink il-thin"><circle cx="66" cy="72" r="2.6"/><circle cx="72" cy="70" r="1.8"/><circle cx="102" cy="40" r="3.4"/><circle cx="110" cy="30" r="2.4"/><circle cx="104" cy="22" r="1.8"/></g>
    <path class="il-line il-thin" d="M100 56l8-2M100 64h10M100 72l8 2M36 56l-8-2M36 64h-10M36 72l-8 2"/>
    <ellipse class="il-dark il-ink" cx="126" cy="104" rx="16" ry="5"/>
    <path class="il-light il-thin" d="M114 104c4-4 18-4 22 0M118 104c2-2 12-2 14 0"/>
    <path class="il-blue il-ink" d="M118 90l-8 10 3 3 7-8z"/>
    <path class="il-blue il-ink" d="M136 88l10-12 4 3-8 13z"/>
    <path class="il-blue il-ink" d="M116 104l2-14c0-2 2-4 4-4h12c2 0 4 2 4 4l2 14z"/>
    <path class="il-white il-ink il-thin" d="M123 86l5 5 5-5z"/>
    <path class="il-line il-thin" d="M128 91v13M120 98h4M132 98h4"/>
    <path class="il-light il-thin" d="M112 104c4 3 24 3 28 0"/>
    <path class="il-line il-thin" d="M150 70l3-4M154 76h4M146 68l0-4"/>
    <ellipse class="il-yellow il-ink" cx="100" cy="102" rx="8" ry="5"/>
    <circle class="il-yellow il-ink" cx="96" cy="94" r="4.6"/>
    <path class="il-orange il-ink il-thin" d="M91 94l-5 1 5 2z"/>
    <circle class="il-dark" cx="95" cy="93" r="1"/>
    <path class="il-line il-thin" d="M84 108q8 4 18 2"/>
    <path class="il-green il-ink" d="M14 66h14v26h8c4 0 6 2 6 6H14z"/>
    <path class="il-dark" d="M14 96h28v3H14z"/>
    <path class="il-light il-thin" d="M18 70v18"/>`,

  // The early bird at four in the morning: stars still out, the sun barely up, the alarm clock ringing; the robin is wide
  // awake with a napkin and a fork, peering hungrily at the ground, where a worm sleeps in its burrow wearing an eye mask.
  'bg.early-bird': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <path class="il-purple-dark" opacity="0.8" d="M0 40c40-8 120-8 160 0v40H0z"/>
    <path class="il-orange" opacity="0.7" d="M0 60c40-6 120-6 160 0v20H0z"/>
    <path class="il-yellow il-ink il-thin" d="M118 72a14 12 0 0 1 28 0z"/>
    <path class="il-line il-thin" d="M114 60l-4-4M132 54v-6M150 60l4-4"/>
    <path class="il-white" d="M20 14l1-3 1 3 3 1-3 1-1 3-1-3-3-1zM88 10l1-3 1 3 3 1-3 1-1 3-1-3-3-1zM140 18l0.8-2 0.8 2 2 0.8-2 0.8-0.8 2-0.8-2-2-0.8zM56 24l0.8-2 0.8 2 2 0.8-2 0.8-0.8 2-0.8-2-2-0.8z"/>
    <path class="il-paper" d="M122 20a7 7 0 1 0 6 10a6 6 0 1 1-6-10z"/>
    <path class="il-earth" d="M0 78h160v42H0z"/>
    <path class="il-grass il-ink" d="M-2 72h164v8H-2z"/>
    <path class="il-grass il-ink il-thin" d="M150 72l2-6 2 6M8 72l2-5 2 5"/>
    <path class="il-earth-dark" opacity="0.6" d="M0 110c40-4 100 4 160-2v12H0z"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="16" cy="96" rx="5" ry="3.4"/><ellipse cx="66" cy="108" rx="4" ry="3"/></g>
    <ellipse class="il-earth-dark il-ink il-thin" cx="118" cy="98" rx="30" ry="14"/>
    <g class="il-pink il-ink">
      <circle cx="96" cy="98" r="4"/><circle cx="100" cy="103" r="4.6"/><circle cx="107" cy="106" r="5"/><circle cx="115" cy="107" r="5.2"/>
      <circle cx="123" cy="106" r="5.4"/><circle cx="130" cy="102" r="5.6"/>
    </g>
    <ellipse class="il-stone il-ink il-thin" cx="141" cy="100" rx="6" ry="3.4"/>
    <circle class="il-pink il-ink" cx="136" cy="94" r="7.5"/>
    <path class="il-blue il-ink il-thin" d="M129 90h14v5h-14z"/>
    <path class="il-line il-thin" d="M132 92q2 2 4 0M138 92q2 2 4 0M135 98q2 1 4 0"/>
    <path class="il-line il-thin" d="M140 84h5l-5 5h5M148 78h4l-4 4h4"/>
    <path class="il-line" d="M58 60l-2 12M66 60l2 12"/>
    <path class="il-line il-thin" d="M50 72h8M64 72h8"/>
    <path class="il-wood-dark il-ink" d="M40 50l-20-6 6 14z"/>
    <ellipse class="il-wood-dark il-ink" cx="58" cy="50" rx="20" ry="14"/>
    <ellipse class="il-orange il-ink il-thin" cx="68" cy="52" rx="11" ry="11"/>
    <circle class="il-wood-dark il-ink" cx="76" cy="34" r="12"/>
    <path class="il-orange" d="M68 42c4 4 12 4 16-2l-2 6c-4 4-10 4-14 0z"/>
    <path class="il-white il-ink il-thin" d="M68 44h16l-8 12z"/>
    <path class="il-yellow il-ink" d="M86 34l10 6-10 2z"/>
    <circle class="il-white il-ink il-thin" cx="80" cy="30" r="5"/><circle class="il-dark" cx="81" cy="33" r="2.6"/><circle class="il-white" cx="80.2" cy="32" r="0.9"/>
    <path class="il-line il-thin" d="M74 24l9 1"/>
    <path class="il-wood-dark il-ink il-thin" d="M44 46c6-6 14-4 16 2-6 4-12 4-16-2z"/>
    <path class="il-metal il-ink il-thin" d="M72 60l20 13-1.4 2-20-13z"/>
    <path class="il-metal il-ink il-thin" d="M89 72l4-3 5 4-4 3z"/>
    <path class="il-line il-thin" d="M95 75l5 3.4M97 72.6l5 3.4M99 70.2l5 3.4"/>
    <path class="il-wood-dark il-ink il-thin" d="M62 56c6-4 12-2 14 4-6 4-10 2-14-4z"/>
    <path class="il-line" d="M18 66l-2 4M30 66l2 4"/>
    <circle class="il-red il-ink" cx="24" cy="58" r="9"/>
    <circle class="il-white il-ink il-thin" cx="24" cy="58" r="6"/>
    <path class="il-line il-thin" d="M24 58v-5M24 58l3.4 2"/>
    <circle class="il-gold il-ink il-thin" cx="17" cy="49" r="3"/><circle class="il-gold il-ink il-thin" cx="31" cy="49" r="3"/>
    <path class="il-line il-thin" d="M10 52q-4 6 0 12M38 52q4 6 0 12M6 48q-6 10 0 20"/>`,

  // A grumpy Monday mole sits in its tunnel under a private rain cloud, clutching a coffee mug and grumbling scribbles;
  // a cheerful little ant whistles past through its tunnel with a crumb. A calendar on the wall has its first day circled.
  'bg.monday-mole': `
    <rect class="il-earth" x="0" y="0" width="160" height="120"/>
    <path class="il-sky" d="M0 0h160v10H0z"/>
    <path class="il-earth il-ink" d="M50 12c4-10 30-10 34 0z"/>
    <path class="il-grass il-ink" d="M-2 10h52l2 4h30l2-4h78v6H-2z"/>
    <path class="il-earth-dark" opacity="0.6" d="M0 26c40-6 80 6 160-2v6c-80 8-120-4-160 2zM0 110c40-4 100 4 160-2v12H0z"/>
    <path class="il-line il-thin" opacity="0.5" d="M20 16q2 8-4 14M140 16q-4 8 2 14M146 22l6 2"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="12" cy="40" rx="5" ry="3.4"/><ellipse cx="150" cy="112" rx="4" ry="3"/></g>
    <path class="il-cave" d="M8 104c0-44 26-76 66-76s60 30 64 56h22v20H8z"/>
    <path class="il-earth-dark il-thin" d="M8 104h152v4H8z"/>
    <rect class="il-paper il-ink il-thin" x="16" y="62" width="20" height="22" rx="1"/>
    <rect class="il-red il-ink il-thin" x="16" y="62" width="20" height="5"/>
    <path class="il-line il-thin" opacity="0.6" d="M18 72h16M18 77h16M18 82h16M22 68v16M26 68v16M30 68v16"/>
    <path class="il-line il-thin" d="M19 72q-2-4 2-4 4 0 2 4-2 2-4 0"/>
    <ellipse class="il-dark" opacity="0.25" cx="72" cy="104" rx="30" ry="3"/>
    <path class="il-grey il-ink" d="M44 104c-4-24 8-38 28-38s32 14 28 38z"/>
    <ellipse class="il-pink il-ink" cx="52" cy="102" rx="8" ry="4"/><ellipse class="il-pink il-ink" cx="92" cy="102" rx="8" ry="4"/>
    <ellipse class="il-grey il-ink" cx="72" cy="58" rx="20" ry="15"/>
    <path class="il-line il-thin" opacity="0.4" d="M58 50q4-4 8-2M80 47q4 0 6 4M50 84q4-2 6 2M90 86q-4-2-6 2"/>
    <path class="il-line il-thick" d="M60 49l9 4M84 49l-9 4"/>
    <path class="il-line" d="M62 57q3 1.6 6 0M76 57q3 1.6 6 0"/>
    <path class="il-pink il-ink" d="M66 63c0-3 3-4 6-4s6 1 6 4-3 5-6 5-6-2-6-5z"/>
    <path class="il-light il-thin" d="M69 62q2-1 4 0"/>
    <path class="il-line" d="M67 71q5-3 10 0"/>
    <path class="il-line il-thin" d="M60 64l-9-2M60 67l-9 2M84 64l9-2M84 67l9 2"/>
    <rect class="il-white il-ink" x="64" y="80" width="16" height="15" rx="2"/>
    <path class="il-line" d="M80 84c6 0 6 8 0 8"/>
    <path class="il-wood-dark" d="M66 82h12v3H66z"/>
    <path class="il-pink il-ink" d="M56 88c4-4 8-4 10 0l-2 6c-4 0-8-2-8-6zM88 88c-4-4-8-4-10 0l2 6c4 0 8-2 8-6z"/>
    <path class="il-line il-thin" d="M84 78q2-3 0-6M88 78q2-3 0-6"/>
    <g transform="translate(6 -10)">
      <path class="il-smoke il-ink" d="M50 44c-6 0-7-8 0-9 1-6 10-7 13-2 4-4 12-1 11 4 6 1 5 8-1 8z"/>
      <path class="il-water-line" d="M56 48l-2 5M64 48l-2 5M72 48l-2 5"/>
    </g>
    <path class="il-paper il-ink il-thin" d="M96 38c0-8 6-12 16-12s16 4 16 12-6 10-16 10l-8 6 2-6c-6-2-10-4-10-10z"/>
    <path class="il-line il-thin" d="M102 38l4-4 2 6 4-6 2 6 4-6 2 6 4-4M104 42h4"/>
    <g class="il-line il-thin"><path d="M124 100l-2 4M128 100v4M132 100l2 4"/></g>
    <g class="il-red il-ink il-thin"><circle cx="122" cy="96" r="3.6"/><ellipse cx="128" cy="97" rx="2.6" ry="2.2"/><ellipse cx="135" cy="96" rx="4.4" ry="3.6"/></g>
    <circle class="il-white" cx="121" cy="95" r="1"/>
    <path class="il-line il-thin" d="M120 93l-4-6M122 92l-1-6"/>
    <rect class="il-gold il-ink il-thin" x="114" y="86" width="9" height="7" rx="2" transform="rotate(-10 118 90)"/>
    <path class="il-line il-thin" d="M140 88V80l5 2"/>
    <ellipse class="il-dark" cx="138" cy="89" rx="2.4" ry="1.8" transform="rotate(-20 138 89)"/>`,

  // A forgetful squirrel stands among dug-up flowerpots, scratching its head over a "treasure map" covered in crosses;
  // question marks float above it, and right behind its back a little oak seedling sprouts from the one pot it forgot.
  'bg.forgetful-squirrel': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" opacity="0.8" d="M14 20c0-6 8-8 12-4 2-6 12-6 14 0 6-2 10 4 6 8H16c-2 0-2-2-2-4z"/>
    <rect class="il-stone il-ink" x="-2" y="96" width="164" height="26"/>
    <path class="il-line il-thin" opacity="0.4" d="M30 96v24M70 96v24M110 96v24M150 96v24"/>
    <path class="il-earth il-ink" d="M6 80h28l-4 18H10z"/>
    <path class="il-earth-dark il-ink il-thin" d="M4 76h32v5H4z"/>
    <path class="il-earth-dark il-ink il-thin" d="M8 76c2-6 6-6 8-2 2-4 8-4 10 0 2-4 6-2 8 2z"/>
    <path class="il-earth il-ink" d="M128 80h28l-4 18h-20z"/>
    <path class="il-earth-dark il-ink il-thin" d="M126 76h32v5h-32z"/>
    <path class="il-dark il-ink il-thin" d="M132 76a10 3 0 0 1 20 0z"/>
    <g class="il-earth-dark il-ink il-thin"><circle cx="122" cy="94" r="2.4"/><circle cx="118" cy="98" r="1.6"/><circle cx="160" cy="92" r="2"/><circle cx="40" cy="94" r="2"/></g>
    <path class="il-earth il-ink" d="M98 82h24l-3 16h-18z"/>
    <path class="il-earth-dark il-ink il-thin" d="M96 78h28v5H96z"/>
    <path class="il-line il-thin" d="M110 78V58"/>
    <path class="il-green il-ink il-thin" d="M110 66c-6-2-10 0-12-4 4-4 10-2 12 4zM110 60c6-2 10-6 10-10-6 0-10 4-10 10z"/>
    <path class="il-green il-ink il-thin" d="M110 72c4 0 8-2 8-6-4 0-7 2-8 6z"/>
    <ellipse class="il-wood il-ink il-thin" cx="110" cy="79" rx="3" ry="2.4"/>
    <path class="il-orange il-ink" d="M74 92c-14 2-26-6-22-24 2-10-4-18-12-18-10 0-12 14-2 14-12 6-16-12-6-22 14-12 34 0 32 20-1 10 4 18 12 20z"/>
    <path class="il-line il-thin" d="M40 56c6 0 10 6 10 12M48 50c4 2 6 6 6 10"/>
    <ellipse class="il-orange il-ink" cx="80" cy="76" rx="14" ry="18"/>
    <ellipse class="il-paper il-ink il-thin" cx="82" cy="80" rx="8" ry="12"/>
    <path class="il-orange il-ink" d="M72 94h10l-1 3H70zM84 94h10l1 3H84z"/>
    <circle class="il-orange il-ink" cx="80" cy="46" r="13"/>
    <path class="il-orange il-ink" d="M70 38l-2-10 8 6zM88 36l4-9 2 10z"/>
    <path class="il-dark" d="M69 30l-1-4 3 2zM92 30l1-3 1 4z"/>
    <circle class="il-white il-ink il-thin" cx="75" cy="44" r="4"/><circle class="il-dark" cx="74" cy="42.6" r="2"/>
    <circle class="il-white il-ink il-thin" cx="85" cy="44" r="4"/><circle class="il-dark" cx="86" cy="42.6" r="2"/>
    <path class="il-line il-thin" d="M71 37l6 2M89 37l-6 1"/>
    <ellipse class="il-dark" cx="80" cy="50" rx="2" ry="1.4"/>
    <path class="il-line il-thin" d="M76 54q4 -2 8 1"/>
    <path class="il-white il-ink il-thin" d="M78 55h3v3h-3z"/>
    <path class="il-orange il-ink" d="M92 64c6-6 6-16 0-22-2-2-4 0-3 2 3 6 3 12-2 16z"/>
    <circle class="il-orange il-ink il-thin" cx="90" cy="40" r="3"/>
    <path class="il-paper il-ink il-thin" d="M50 66l20-4 4 20-20 4z"/>
    <path class="il-line il-thin" opacity="0.5" d="M54 70q8 4 14-2M56 80q8-2 16 0"/>
    <path class="il-red il-thin" d="M55 72l3 3M58 72l-3 3M64 66l3 3M67 66l-3 3M66 76l3 3M69 76l-3 3M58 80l3 3M61 80l-3 3"/>
    <path class="il-line il-thin" d="M55 72l3 3M58 72l-3 3M64 66l3 3M67 66l-3 3M66 76l3 3M69 76l-3 3M58 80l3 3M61 80l-3 3"/>
    <circle class="il-orange il-ink il-thin" cx="66" cy="78" r="3.4"/>
    <path class="il-line" d="M98 20c0-6 10-6 10 0 0 4-5 4-5 8M103 32v1M116 10c0-4 7-4 7 0 0 3-3.4 3-3.4 6M119.6 24v0.6M64 16c0-5 8-5 8 0 0 3-4 3-4 7M68 27v0.6"/>
    <path class="il-metal il-ink il-thin" d="M100 92l10-6 3 3-8 8z"/>
    <path class="il-wood il-ink il-thin" d="M111 87l4-4 2 2-4 4z"/>`,

  // The wasp collection agency: a wasp in sunglasses and a tie hands over an endlessly long bill that unrolls down to the
  // garden table, pointing sternly at the plum cake; its partner hovers behind with a briefcase.
  'bg.wasp-collection-agency': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thick" d="M162 4c-12 2-22 8-30 18"/>
    <path class="il-green il-ink il-thin" d="M146 9c-2-6 2-10 8-10 0 6-4 10-8 10zM136 16c-6-2-10 0-10 4 4 2 8 0 10-4z"/>
    <ellipse class="il-purple il-ink il-thin" cx="141" cy="18" rx="3.6" ry="4.4"/><ellipse class="il-purple il-ink il-thin" cx="152" cy="13" rx="3.6" ry="4.4"/>
    <rect class="il-wood il-ink" x="-2" y="94" width="164" height="8"/>
    <path class="il-wood-dark il-ink il-thin" d="M8 102h8v20H8zM144 102h8v20h-8z"/>
    <path class="il-white il-ink il-thin" d="M-2 102h164v4H-2z" opacity="0.6"/>
    <ellipse class="il-white il-ink" cx="128" cy="92" rx="22" ry="4"/>
    <path class="il-paper il-ink" d="M110 90l16-16 14 16z"/>
    <path class="il-gold il-ink il-thin" d="M110 90l16-16 14 16-4 0-10-11-12 11z"/>
    <g class="il-purple il-ink il-thin"><ellipse cx="122" cy="80" rx="3" ry="2.4"/><ellipse cx="128" cy="78" rx="3" ry="2.4"/><ellipse cx="132" cy="84" rx="3" ry="2.4"/><ellipse cx="124" cy="86" rx="3" ry="2.4"/></g>
    <ellipse class="il-water il-ink il-thin" opacity="0.55" cx="50" cy="22" rx="9" ry="16" transform="rotate(-30 50 22)"/>
    <ellipse class="il-water il-ink il-thin" opacity="0.55" cx="66" cy="20" rx="8" ry="15" transform="rotate(20 66 20)"/>
    <path class="il-line il-thin" d="M36 10q-4 4-2 8M80 8q4 4 2 8"/>
    <ellipse class="il-yellow il-ink" cx="34" cy="54" rx="16" ry="12" transform="rotate(30 34 54)"/>
    <path class="il-dark" d="M36 42c-6 2-10 6-12 12l4 2c2-6 6-10 12-12zM44 48c-6 2-10 8-12 14l4 2c2-6 6-10 12-12z" opacity="0.9"/>
    <path class="il-line" d="M46 64l-6 14M52 64l-2 16M56 62l4 14"/>
    <ellipse class="il-yellow il-ink" cx="56" cy="44" rx="9" ry="8"/>
    <path class="il-red il-ink il-thin" d="M58 50l-3 3 2 10 4 3 3-4-2-9z"/>
    <path class="il-line" d="M62 42l12 4 8 10"/>
    <path class="il-line" d="M60 48l10 10 10-2"/>
    <circle class="il-yellow il-ink" cx="74" cy="30" r="12"/>
    <path class="il-dark il-ink il-thin" d="M62 26h26l-2 6c-2 4-8 4-10 0l-1-2h-1l-1 2c-2 4-8 4-10 0z"/>
    <path class="il-light il-thin" d="M66 28l2-1M80 28l2-1"/>
    <path class="il-line il-thick" d="M64 22l10 3M86 22l-10 3"/>
    <path class="il-line il-thin" d="M70 39h8"/>
    <path class="il-line il-thin" d="M70 19l-4-10M78 19l4-10"/>
    <circle class="il-dark" cx="66" cy="9" r="1.8"/><circle class="il-dark" cx="82" cy="9" r="1.8"/>
    <path class="il-line il-thin" d="M82 56l26 16"/>
    <circle class="il-yellow il-ink il-thin" cx="108" cy="72" r="3"/>
    <path class="il-paper il-ink" d="M74 44h20v6c-4 4-4 12 0 16v4c-4 6-4 14 0 20v4c-6 4-14 4-18 0-4-6-2-14 0-20-2-8-2-16-2-24z"/>
    <path class="il-line il-thin" opacity="0.6" d="M78 50h12M78 54h10M80 64h10M78 72h12M78 76h8M78 84h12"/>
    <path class="il-gold il-ink il-thin" d="M80 58l4-4 4 4z"/>
    <path class="il-line il-thin" d="M80 88h10M80 91h10"/>
    <circle class="il-yellow il-ink il-thin" cx="74" cy="46" r="3"/>
    <ellipse class="il-water il-ink il-thin" opacity="0.55" cx="138" cy="34" rx="5" ry="10" transform="rotate(30 138 34)"/>
    <ellipse class="il-yellow il-ink" cx="140" cy="54" rx="9" ry="7" transform="rotate(-30 140 54)"/>
    <path class="il-dark" opacity="0.9" d="M136 48l-4 6 3 2 4-6zM142 50l-4 7 3 2 4-6z"/>
    <circle class="il-yellow il-ink" cx="128" cy="40" r="8"/>
    <path class="il-dark il-ink il-thin" d="M120 38h16l-1 3c-1 3-5 3-7 0-2 3-6 3-7 0z"/>
    <path class="il-line il-thin" d="M124 46h6M124 33l-3-6M132 33l2-6"/>
    <path class="il-line" d="M130 50l-6 12"/>
    <rect class="il-wood-dark il-ink" x="114" y="60" width="16" height="12" rx="2"/>
    <path class="il-line il-thin" d="M118 60v-3h8v3M114 66h16"/>
    <path class="il-line il-thin" d="M96 20q4-4 8 0t8 0M100 28q4-4 8 0t8 0"/>`,

  // Saturday: a red lawn scarifier with an angry grille face rakes the lawn backwards, flinging moss and grass about;
  // underground, a worm's hair stands on end in shock.
  'bg.lawn-scarifier': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <circle class="il-yellow" cx="22" cy="18" r="9"/>
    <path class="il-earth" d="M0 74h160v46H0z"/>
    <path class="il-earth-dark" opacity="0.6" d="M0 106c40-4 100 4 160-2v16H0z"/>
    <path class="il-grass il-ink" d="M-2 66h164v10H-2z"/>
    <path class="il-grass il-ink il-thin" d="M108 66l2-7 2 7M118 66l2-8 2 8M128 66l2-6 2 6M140 66l2-8 2 8M152 66l2-7 2 7"/>
    <path class="il-light il-thin" opacity="0.5" d="M4 70l6-3M14 70l6-3M24 70l6-3M34 70l6-3"/>
    <g class="il-stone il-ink il-thin"><ellipse cx="18" cy="92" rx="5" ry="3.4"/><ellipse cx="142" cy="112" rx="5" ry="3"/></g>
    <path class="il-line il-thin" opacity="0.5" d="M40 76q2 8-2 14M150 76q-2 8 2 12"/>
    <path class="il-metal il-ink" d="M96 40l42-30 4 4-42 30z"/>
    <path class="il-dark il-ink" d="M134 10l10-8 6 6-10 8z"/>
    <path class="il-line il-thin" d="M82 36q4-10 12-10"/>
    <path class="il-red il-ink" d="M34 64V44c0-6 6-10 14-10h46c8 0 12 4 12 10v20z"/>
    <path class="il-dark il-ink" d="M44 34c0-8 8-12 18-12s18 4 18 12z"/>
    <path class="il-line il-thin" d="M50 28h24"/>
    <path class="il-metal il-ink il-thin" d="M30 64h80v4H30z"/>
    <g class="il-line il-thin"><path d="M38 68l-2 6M46 68l-2 6M54 68l-2 6M62 68l-2 6M70 68l-2 6M78 68l-2 6M86 68l-2 6M94 68l-2 6M102 68l-2 6"/></g>
    <circle class="il-dark il-ink" cx="36" cy="66" r="7"/><circle class="il-metal" cx="36" cy="66" r="2.4"/>
    <circle class="il-dark il-ink" cx="104" cy="66" r="7"/><circle class="il-metal" cx="104" cy="66" r="2.4"/>
    <circle class="il-white il-ink" cx="56" cy="46" r="6"/><circle class="il-dark" cx="54" cy="47" r="3"/>
    <circle class="il-white il-ink" cx="74" cy="46" r="6"/><circle class="il-dark" cx="72" cy="47" r="3"/>
    <path class="il-line il-thick" d="M48 37l12 5M82 37l-12 5"/>
    <rect class="il-dark il-ink il-thin" x="56" y="54" width="20" height="7" rx="2"/>
    <path class="il-white il-thin" d="M60 54v7M64 54v7M68 54v7M72 54v7"/>
    <path class="il-line il-thin" d="M30 30l-6-4M28 38h-8M88 20l2-6"/>
    <g class="il-green il-ink il-thin">
      <path d="M14 50c-2-4 2-8 6-6 4-2 6 4 2 6-2 4-6 4-8 0z"/><path d="M4 36c-2-3 2-6 4-4 3-1 5 3 2 5-2 2-5 2-6-1z"/><path d="M22 58c-2-2 0-5 3-4 3 0 3 4 0 5z"/>
    </g>
    <path class="il-grass il-ink il-thin" d="M12 60l3-6 1 6zM6 48l4-4 0 5zM24 42l2-5 2 5z"/>
    <path class="il-line il-thin" d="M28 56l-6-2M26 48l-6-6"/>
    <g class="il-pink il-ink">
      <circle cx="56" cy="104" r="4"/><circle cx="62" cy="107" r="4.6"/><circle cx="69" cy="108" r="5"/><circle cx="76" cy="106" r="5.2"/>
      <circle cx="81" cy="101" r="5.4"/><circle cx="83" cy="94" r="5.6"/>
    </g>
    <path class="il-line" d="M78 84l-4-6M81 82l-2-8M84 82v-8M87 82l2-8M90 84l4-6"/>
    <circle class="il-pink il-ink" cx="84" cy="88" r="7.5"/>
    <circle class="il-white il-ink il-thin" cx="81" cy="87" r="3"/><circle class="il-dark" cx="81" cy="86" r="1"/>
    <circle class="il-white il-ink il-thin" cx="88" cy="87" r="3"/><circle class="il-dark" cx="88" cy="86" r="1"/>
    <ellipse class="il-dark" cx="84.5" cy="92.4" rx="1.6" ry="2"/>
    <path class="il-line il-thin" d="M72 86l-4-2M96 86l4-2M74 92h-4M95 92h4"/>`,

  // The compost heap with a fever: a flushed, furious mound in its wooden bin with a thermometer in its mouth and an ice
  // pack on its head, steaming like a kettle; the offending orange peel spirals on top.
  'bg.hot-compost': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-grass il-ink il-thin" d="M6 100l2-7 2 7M150 100l2-6 2 6"/>
    <path class="il-smoke il-ink il-thin" opacity="0.9" d="M40 30c-6 0-6-8 0-8 0-6 10-8 12-2 4-4 10 0 8 4 6 0 6 8 0 8z"/>
    <path class="il-smoke il-ink il-thin" opacity="0.9" d="M104 22c-6 0-6-8 0-8 0-6 10-8 12-2 4-4 10 0 8 4 6 0 6 8 0 8z"/>
    <path class="il-smoke il-ink il-thin" opacity="0.8" d="M72 14c-4 0-4-6 0-6 0-4 8-6 9-1 3-3 8 0 6 3 4 0 4 6 0 6z"/>
    <path class="il-light il-thin" d="M50 36q-4 6 0 10M112 32q4 6 0 10"/>
    <rect class="il-wood-dark il-ink" x="14" y="50" width="8" height="54"/>
    <rect class="il-wood-dark il-ink" x="138" y="50" width="8" height="54"/>
    <path class="il-earth-dark il-ink" d="M20 92c-2-30 22-48 60-48s62 18 60 48z"/>
    <path class="il-wood-dark il-thin" opacity="0.6" d="M34 70q8-4 14 0M110 66q8-2 12 4M44 84q6-2 10 2"/>
    <path class="il-green il-ink il-thin" d="M34 64c4-6 10-4 10 0-4 4-8 4-10 0zM116 76c4-6 10-4 10 0-4 4-8 4-10 0z"/>
    <path class="il-white il-ink il-thin" d="M104 52l6-2 2 4-4 3zM40 78l5-1 1 4-4 1z"/>
    <path class="il-wood il-ink il-thin" d="M120 60l6 2-2 4c-3 0-5-2-4-6z"/>
    <path class="il-orange il-ink" d="M62 48c-4-6 2-10 8-8s8 8 14 6 4-8 10-6c-2 6-8 10-14 8s-8-6-12-4-2 6-6 4z"/>
    <path class="il-blue il-ink" d="M86 40c-2-8 8-14 18-10 6 2 6 10 0 12-6 4-16 4-18-2z"/>
    <path class="il-light il-thin" d="M92 34q4-2 8 0"/>
    <path class="il-white il-ink il-thin" d="M90 42l4 3M100 42l-2 3"/>
    <path class="il-line il-thick" d="M54 58l12 6M106 58l-12 6"/>
    <circle class="il-white il-ink" cx="64" cy="68" r="6"/><circle class="il-dark" cx="66" cy="69" r="3"/>
    <circle class="il-white il-ink" cx="96" cy="68" r="6"/><circle class="il-dark" cx="94" cy="69" r="3"/>
    <circle class="il-red" opacity="0.8" cx="54" cy="78" r="5"/><circle class="il-red" opacity="0.8" cx="106" cy="78" r="5"/>
    <path class="il-dark il-ink" d="M70 84q10-6 20 0q-10 4-20 0z"/>
    <path class="il-white il-ink il-thin" d="M86 84l18-10 3 4-17 9z"/>
    <path class="il-red" d="M90 84l10-6 1 2-10 5z"/>
    <circle class="il-red il-ink il-thin" cx="87" cy="85" r="2.6"/>
    <path class="il-line il-thin" d="M108 70l6-4M110 76h7M108 82l6 3"/>
    <ellipse class="il-water il-ink il-thin" cx="46" cy="62" rx="1.8" ry="2.8"/>
    <rect class="il-wood il-ink" x="10" y="88" width="140" height="8"/>
    <rect class="il-wood il-ink" x="10" y="96" width="140" height="8"/>
    <path class="il-line il-thin" opacity="0.4" d="M24 92h30M80 100h40"/>`,

  // Grandpa clears out the cellar: holding a battered old shoe over a dusty box, he looks back and forth between the
  // skip and the shelf, arrows pointing both ways; a moth flutters out of the box and the old calendar is full of crosses.
  'bg.cellar-clearout': `
    <rect class="il-stone" x="0" y="0" width="160" height="120"/>
    <path class="il-line il-thin" opacity="0.3" d="M0 14h160M0 30h160M0 46h160M0 62h160M0 78h160M20 0v14M60 0v14M100 0v14M140 0v14M40 14v16M80 14v16M120 14v16M20 30v16M60 30v16M100 30v16M140 30v16M40 46v16M120 46v16M20 62v16M140 62v16"/>
    <rect class="il-earth-dark il-ink" x="-2" y="100" width="164" height="22"/>
    <rect class="il-wood il-ink" x="118" y="40" width="44" height="5"/>
    <rect class="il-wood il-ink" x="118" y="70" width="44" height="5"/>
    <rect class="il-red il-ink il-thin" x="124" y="28" width="12" height="12" rx="2"/>
    <path class="il-metal il-ink il-thin" d="M142 40l4-14h8l4 14z"/>
    <rect class="il-water il-ink il-thin" x="126" y="58" width="10" height="12" rx="3"/>
    <rect class="il-paper il-ink il-thin" x="140" y="56" width="16" height="14"/>
    <path class="il-yellow il-ink" d="M2 72h38l-4 30H6z"/>
    <path class="il-line il-thin" d="M10 76v22M20 76v22M30 76v22"/>
    <path class="il-wood il-ink il-thin" d="M8 72l6-14 6 2-4 12z"/>
    <path class="il-green il-ink il-thin" d="M22 72c0-6 6-10 12-8l-2 8z"/>
    <rect class="il-paper il-ink il-thin" x="44" y="8" width="18" height="20" rx="1"/>
    <path class="il-line il-thin" opacity="0.6" d="M46 13h14M46 18h14M46 23h14M50 13v13M54 13v13M58 13v13"/>
    <path class="il-line il-thin" d="M46 14l3 3M49 14l-3 3M51 14l3 3M54 14l-3 3M55 14l3 3M58 14l-3 3M46 19l3 3M49 19l-3 3M51 19l3 3M54 19l-3 3"/>
    <path class="il-light il-thin" d="M48 6l2-4 2 4"/>
    <path class="il-line il-thick" d="M36 50h-16M26 44l-6 6 6 6"/>
    <path class="il-line il-thick" d="M112 18h16M122 12l6 6-6 6"/>
    <path class="il-wood il-ink" d="M84 82h40v20H84z"/>
    <path class="il-wood-dark il-ink il-thin" d="M84 82l-6-8h40l6 8zM124 82l8-10 4 4-12 10z"/>
    <path class="il-white il-thin" opacity="0.6" d="M88 90l6-4 2 6M110 92l6-4 4 6"/>
    <path class="il-line il-thin" d="M96 84v-4M112 84v-4"/>
    <path class="il-white il-ink il-thin" d="M102 70c-4-4-8-2-8 2 4 2 6 2 8-2zM102 70c4-4 8-2 8 2-4 2-6 2-8-2z"/>
    <path class="il-line il-thin" d="M100 66l-2-3M104 66l2-3M102 72v-4"/>
    <path class="il-dark il-ink" d="M50 100h12v-6H50zM70 100h12v-6H70z"/>
    <path class="il-green il-ink" d="M48 96l2-34h32l2 34z"/>
    <path class="il-white il-ink il-thin" d="M60 62l6 10 6-10z"/>
    <path class="il-line il-thin" d="M66 74v20"/>
    <circle class="il-gold il-ink il-thin" cx="66" cy="80" r="1.4"/><circle class="il-gold il-ink il-thin" cx="66" cy="88" r="1.4"/>
    <path class="il-green il-ink" d="M50 66l-12 8 4 6 12-8zM82 66l8 4 6-10-4-4z"/>
    <circle class="il-skin il-ink il-thin" cx="40" cy="78" r="4"/>
    <circle class="il-skin il-ink il-thin" cx="94" cy="58" r="4"/>
    <circle class="il-wood il-ink il-thin" cx="92" cy="31" r="3.2"/><circle class="il-wood il-ink il-thin" cx="104" cy="31" r="3.2"/>
    <ellipse class="il-wood il-ink" cx="98" cy="50" rx="7" ry="8"/>
    <path class="il-wood il-ink il-thin" d="M104 46l6 6-2 2-6-4zM96 56l-2 6 3 1 2-6zM100 56l2 6 3-1-2-6z"/>
    <rect class="il-blue il-ink il-thin" x="96" y="47" width="5" height="5" transform="rotate(12 98 49)"/>
    <circle class="il-wood il-ink" cx="98" cy="38" r="7"/>
    <ellipse class="il-paper il-ink il-thin" cx="98" cy="41" rx="3.4" ry="2.6"/>
    <circle class="il-dark" cx="98" cy="40" r="1"/>
    <circle class="il-dark" cx="95" cy="36" r="1.1"/>
    <path class="il-line il-thin" d="M100 35l2 2M102 35l-2 2"/>
    <path class="il-line il-thin" d="M88 40q-3-3 0-6M108 40q3-3 0-6"/>
    <circle class="il-skin il-ink il-thin" cx="94" cy="57" r="4"/>
    <ellipse class="il-skin il-ink" cx="66" cy="44" rx="15" ry="16"/>
    <path class="il-beard il-ink il-thin" d="M51 44c-4-2-4-12 2-14 0 4 0 8-2 14zM81 44c4-2 4-12-2-14 0 4 0 8 2 14z"/>
    <ellipse class="il-skin il-ink il-thin" cx="51" cy="46" rx="3" ry="4"/><ellipse class="il-skin il-ink il-thin" cx="81" cy="46" rx="3" ry="4"/>
    <circle class="il-white il-ink il-thin" cx="60" cy="42" r="5"/><circle class="il-white il-ink il-thin" cx="72" cy="42" r="5"/>
    <path class="il-line il-thin" d="M65 42h2"/>
    <circle class="il-dark" cx="58" cy="42" r="1.8"/><circle class="il-dark" cx="74" cy="42" r="1.8"/>
    <path class="il-line il-thin" d="M55 34l7 1M77 34l-7 1"/>
    <path class="il-beard il-ink il-thin" d="M58 52c4-2 6-2 8 0 2-2 4-2 8 0-2 4-6 4-8 2-2 2-6 2-8-2z"/>
    <path class="il-line il-thin" d="M62 57q4 2 8 0"/>
    <path class="il-light il-thin" d="M58 30q6-4 12-2"/>
    <path class="il-line il-thin" d="M42 30q-4-4 0-8M90 30q4-4 0-8"/>
    <g class="il-white" opacity="0.7"><circle cx="30" cy="20" r="0.9"/><circle cx="100" cy="14" r="0.9"/><circle cx="110" cy="44" r="0.9"/><circle cx="20" cy="40" r="0.9"/></g>`,
};
