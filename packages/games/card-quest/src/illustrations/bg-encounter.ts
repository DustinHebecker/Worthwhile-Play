/* Creepy Crawlies illustrations: encounter. */
export const BG_ENCOUNTER: Readonly<Record<string, string>> = {
  // A worm so long it coils twice round a whole little house; it grins and winks at us while a tiny hose reel and a gaping snail on the roof show the scale.
  'bg.hose-length': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M13.4 22.5a4.5 4.5 0 0 1 2.7-8.1a6.3 6.3 0 0 1 11.7-2.7a5.4 5.4 0 0 1 9 4.5a3.6 3.6 0 0 1 1.8 6.3z"/><path class="il-white" d="M126.2 17.5a3.5 3.5 0 0 1 2.1-6.3a4.9 4.9 0 0 1 9.1-2.1a4.2 4.2 0 0 1 7 3.5a2.8 2.8 0 0 1 1.4 4.9z"/>
    <path class="il-grass" d="M0 80h160v40H0z"/>
    <path class="il-green" opacity="0.6" d="M0 104q40-4 80 0t80 0v16H0z"/>
    <path class="il-grass il-ink il-thin" d="M0 81l3.3 -4 3.3 4M11 81l3.3 -6 3.3 6M22 81l3.3 -5 3.3 5M33 81l3.3 -4 3.3 4M44 81l3.3 -6 3.3 6M55 81l3.3 -5 3.3 5M66 81l3.3 -4 3.3 4M77 81l3.3 -6 3.3 6M88 81l3.3 -5 3.3 5M99 81l3.3 -4 3.3 4M110 81l3.3 -6 3.3 6M121 81l3.3 -5 3.3 5M132 81l3.3 -4 3.3 4M143 81l3.3 -6 3.3 6M154 81l3.3 -5 3.3 5"/>
    <path class="il-pink il-ink" d="M21.3 85.4L21.4 85L21.5 85L22.2 84.3L23.4 83.6L24.8 82.8L26.3 82.1L27.9 81.5L29.6 80.9L31.4 80.3L33.2 79.8L35 79.3L36.9 78.8L38.7 78.4L40.6 78L42.5 77.6L44.4 77.3L46.3 76.9L48.2 76.6L50.1 76.3L52.1 76L54 75.8L55.9 75.6L57.9 75.3L59.8 75.1L61.8 74.9L63.7 74.8L65.7 74.6L67.6 74.4L69.6 74.3L71.5 74.2L73.5 74.1L75.5 74L77.4 73.9L79.4 73.8L81.3 73.7L83.3 73.7L85.3 73.7L87.2 73.6L89.2 73.6L91.2 73.6L93.1 73.6L95.1 73.7L97.1 73.7L99 73.8L101 73.8L102.9 73.9L104.9 74L106.9 74.1L108.8 74.3L110.8 74.4L112.7 74.6L114.6 74.7L116.6 74.9L118.5 75.1L120.4 75.4L122.3 75.6L124.2 75.9L126.1 76.2L128 76.6L129.8 77L131.6 77.4L133.4 77.8L135.1 78.3L136.7 78.9L138.1 79.5L139 80L139.4 80.5L139.4 80.5C144 86 152.4 79 147.9 73.5L146.9 72.3L144.2 70.3L141.8 69.1L139.6 68.2L137.4 67.5L135.3 67L133.2 66.4L131.1 66L129 65.6L127 65.2L124.9 64.9L122.9 64.6L120.8 64.3L118.8 64.1L116.7 63.9L114.7 63.7L112.6 63.5L110.6 63.4L108.5 63.2L106.5 63.1L104.5 63L102.4 62.9L100.4 62.8L98.3 62.7L96.3 62.7L94.3 62.7L92.2 62.6L90.2 62.6L88.2 62.6L86.1 62.7L84.1 62.7L82.1 62.7L80 62.8L78 62.9L76 62.9L73.9 63L71.9 63.1L69.9 63.3L67.8 63.4L65.8 63.5L63.8 63.7L61.7 63.9L59.7 64.1L57.7 64.3L55.6 64.5L53.6 64.8L51.6 65L49.5 65.3L47.5 65.6L45.5 65.9L43.4 66.2L41.4 66.6L39.4 67L37.3 67.4L35.3 67.9L33.3 68.4L31.2 68.9L29.2 69.5L27.1 70.1L25.1 70.8L23 71.6L20.9 72.5L18.8 73.5L16.7 74.8L14.4 76.5L12.2 79L10.8 82.4L10.8 82.4C8.8 89.3 19.4 92.3 21.3 85.4z"/><path class="il-line il-thin" opacity="0.55" d="M20.9 84.4Q18.7 79.8 13.9 78.2M24.4 82.1Q24.1 77 20.2 73.7M29.4 80.1Q29.8 75 26.4 71.2M34.8 78.5Q35.6 73.4 32.5 69.4M40.4 77.2Q41.4 72.2 38.5 68M46.2 76.1Q47.3 71.2 44.6 66.9M51.9 75.3Q53.3 70.3 50.7 65.9M57.8 74.5Q59.2 69.6 56.7 65.2M63.6 74Q65.2 69.1 62.8 64.6M69.5 73.5Q71.2 68.7 68.9 64.1M75.4 73.2Q77.2 68.4 75 63.8M81.3 72.9Q83.2 68.2 81.1 63.6M87.2 72.8Q89.2 68.1 87.2 63.4M93.1 72.8Q95.2 68.2 93.2 63.5M99.1 73Q101.2 68.3 99.3 63.6M104.9 73.2Q107.2 68.6 105.4 63.8M110.8 73.6Q113.2 69.1 111.5 64.2M116.7 74.1Q119.1 69.7 117.7 64.8M122.4 74.9Q125.1 70.5 123.8 65.5M128.1 75.8Q131 71.6 129.9 66.6M133.6 77.1Q136.8 73.1 136.1 68M138.4 78.8Q142.3 75.5 142.6 70.4"/><path class="il-pink il-ink" d="M21.3 72.8L21.4 72.5L21.5 72.4L22.2 71.8L23.3 71L24.7 70.3L26.3 69.6L27.9 68.9L29.6 68.3L31.4 67.7L33.1 67.2L35 66.7L36.8 66.3L38.7 65.8L40.5 65.4L42.4 65L44.3 64.7L46.2 64.4L48.2 64L50.1 63.8L52 63.5L53.9 63.2L55.9 63L57.8 62.8L59.8 62.6L61.7 62.4L63.7 62.2L65.6 62L67.6 61.9L69.5 61.7L71.5 61.6L73.5 61.5L75.4 61.4L77.4 61.3L79.3 61.2L81.3 61.2L83.3 61.1L85.2 61.1L87.2 61.1L89.2 61.1L91.1 61.1L93.1 61.1L95.1 61.1L97 61.1L99 61.2L100.9 61.3L102.9 61.3L104.9 61.4L106.8 61.6L108.8 61.7L110.7 61.8L112.7 62L114.6 62.2L116.5 62.4L118.5 62.6L120.4 62.8L122.3 63.1L124.2 63.3L126.1 63.7L127.9 64L129.8 64.4L131.6 64.8L133.4 65.3L135.1 65.8L136.6 66.3L138 66.9L139 67.4L139.4 67.9L139.4 67.9C144.1 73.4 152.4 66.2 147.8 60.8L146.8 59.7L144.1 57.7L141.7 56.5L139.5 55.6L137.4 55L135.2 54.4L133.1 53.9L131.1 53.4L129 53L126.9 52.6L124.9 52.3L122.8 52L120.8 51.8L118.7 51.5L116.7 51.3L114.6 51.1L112.6 50.9L110.5 50.8L108.5 50.6L106.5 50.5L104.4 50.4L102.4 50.3L100.3 50.2L98.3 50.2L96.3 50.1L94.2 50.1L92.2 50.1L90.2 50.1L88.1 50.1L86.1 50.1L84 50.1L82 50.2L80 50.2L77.9 50.3L75.9 50.4L73.9 50.5L71.9 50.6L69.8 50.7L67.8 50.8L65.8 51L63.7 51.1L61.7 51.3L59.7 51.5L57.6 51.7L55.6 51.9L53.6 52.2L51.5 52.4L49.5 52.7L47.5 53L45.4 53.3L43.4 53.7L41.4 54L39.3 54.4L37.3 54.9L35.3 55.3L33.2 55.8L31.2 56.3L29.1 56.9L27.1 57.5L25 58.2L23 59L20.9 59.9L18.8 61L16.6 62.3L14.4 64L12.2 66.5L10.7 69.9L10.7 69.9C8.8 76.8 19.4 79.7 21.3 72.8z"/><path class="il-line il-thin" opacity="0.55" d="M20.9 71.9Q18.7 67.3 13.9 65.6M24.4 69.6Q24.1 64.5 20.2 61.1M29.3 67.5Q29.7 62.4 26.3 58.6M34.8 65.9Q35.5 60.9 32.4 56.8M40.4 64.6Q41.4 59.6 38.5 55.4M46.1 63.6Q47.3 58.6 44.5 54.3M51.9 62.7Q53.2 57.8 50.6 53.4M57.7 62Q59.2 57.1 56.7 52.6M63.6 61.4Q65.2 56.5 62.8 52M69.5 60.9Q71.2 56.1 68.9 51.6M75.4 60.6Q77.2 55.8 74.9 51.2M81.3 60.4Q83.2 55.6 81 51M87.2 60.3Q89.2 55.6 87.1 50.9M93.1 60.3Q95.2 55.6 93.2 50.9M99 60.4Q101.1 55.8 99.3 51M104.9 60.6Q107.1 56.1 105.4 51.3M110.8 61Q113.1 56.5 111.5 51.7M116.6 61.6Q119.1 57.1 117.6 52.2M122.4 62.3Q125 57.9 123.7 53M128.1 63.2Q130.9 59 129.9 54M133.6 64.5Q136.8 60.5 136.1 55.4M138.4 66.2Q142.3 62.9 142.5 57.8"/>
    <path class="il-white il-ink" d="M56 52h48v40H56z"/>
    <path class="il-red il-ink" d="M50 54 80 28l30 26z"/>
    <path class="il-line il-thin" opacity="0.5" d="M62 46h36M68 40h24"/>
    <rect class="il-wood il-ink" x="74" y="70" width="12" height="22" rx="1"/><circle class="il-dark" cx="83" cy="82" r="1.2"/>
    <rect class="il-water il-ink il-thin" x="60" y="58" width="10" height="9"/><path class="il-line il-thin" d="M65 58v9M60 62.5h10"/>
    <rect class="il-water il-ink il-thin" x="90" y="58" width="10" height="9"/><path class="il-line il-thin" d="M95 58v9M90 62.5h10"/>
    <rect class="il-earth-dark il-ink il-thin" x="94" y="30" width="6" height="12"/>
    <g transform="translate(64 40)"><path class="il-gold il-ink il-thin" d="M-6 0a6 6 0 0 1 12 0z"/><path class="il-line il-thin" d="M0 -5a3 3 0 0 1 0 5"/><path class="il-stone il-ink il-thin" d="M-9 0h16q2 0 2 2h-18z"/><path class="il-line il-thin" d="M5 -2l2-4M6.4 -2l3-3"/><circle class="il-white il-ink il-thin" cx="7" cy="-6" r="1.6"/><circle class="il-white il-ink il-thin" cx="9.6" cy="-5" r="1.6"/><circle class="il-dark" cx="7.4" cy="-6.4" r="0.7"/><circle class="il-dark" cx="10" cy="-5.4" r="0.7"/></g>
    <path class="il-pink il-ink" d="M35.5 92.3L34.6 91.8L32.8 90.9L31.1 90L29.5 89L27.9 87.9L26.4 86.9L24.9 86.1L23.5 85.3L22.3 84.6L21.5 83.9L21.4 83.8L21.5 83.8L21.5 83.8C21.2 76.7 10.2 77.2 10.5 84.3L10.7 86.1L12.4 90.1L14.6 92.5L16.8 94.2L19 95.4L21.1 96.5L23.3 97L25.5 97.4L27.7 97.7L29.8 97.9L31.9 98L34 98.1L34 98.1C37.8 99.1 39.3 93.2 35.5 92.3z"/><path class="il-line il-thin" opacity="0.55" d="M32.6 91.7Q29.9 93.9 31.1 97.2M27.6 88.7Q24.3 91.9 24.7 96.5M23.1 86Q19 89.1 18.3 94.1M20.7 84.1Q15.6 84.2 12.1 88"/><path class="il-light il-thin" opacity="0.5" d="M27.8 91L26 90.1L24.4 89.2L22.7 88.4L21.2 87.5L19.8 86.5"/><path class="il-pink il-ink" d="M138.4 78.1L138.5 77.7L139.1 76.2L138.6 76.5L137.4 77.1L135.9 77.7L134.2 78.2L132.5 78.7L130.7 79.1L128.9 79.5L127 79.9L125.2 80.2L123.3 80.5L121.4 80.8L119.4 81L117.5 81.3L115.6 81.5L113.7 81.6L111.7 81.8L109.8 82L107.8 82.1L105.9 82.2L103.9 82.3L102 82.4L100 82.5L98 82.5L96.1 82.6L94.1 82.6L92.1 82.6L90.2 82.7L88.2 82.6L86.2 82.6L84.3 82.6L82.3 82.6L80.4 82.5L78.4 82.4L76.4 82.4L74.5 82.3L72.5 82.2L70.5 82L68.6 81.9L66.6 81.8L64.7 81.6L62.7 81.4L60.8 81.3L58.8 81.1L56.9 80.8L54.9 80.6L53 80.4L51.1 80.1L49.2 79.8L47.2 79.5L45.3 79.2L43.4 78.9L41.5 78.5L39.6 78.1L37.8 77.7L35.9 77.2L34.1 76.8L32.3 76.3L30.5 75.7L28.8 75.1L27.1 74.5L25.5 73.8L24 73.1L22.8 72.3L21.8 71.6L21.4 71.2L21.5 71.6L21.5 71.3C21.5 64.2 10.5 64.2 10.5 71.4L10.6 73.1L12.2 77.2L14.4 79.8L16.7 81.5L18.8 82.8L20.9 83.8L23 84.7L25.1 85.5L27.1 86.2L29.2 86.8L31.2 87.4L33.3 87.9L35.3 88.4L37.3 88.9L39.4 89.3L41.4 89.7L43.4 90L45.5 90.4L47.5 90.7L49.5 91L51.6 91.3L53.6 91.5L55.6 91.8L57.7 92L59.7 92.2L61.7 92.4L63.8 92.6L65.8 92.7L67.8 92.9L69.9 93L71.9 93.1L73.9 93.3L76 93.4L78 93.4L80 93.5L82.1 93.6L84.1 93.6L86.1 93.6L88.2 93.6L90.2 93.7L92.2 93.6L94.3 93.6L96.3 93.6L98.3 93.5L100.4 93.5L102.4 93.4L104.5 93.3L106.5 93.2L108.5 93.1L110.6 92.9L112.6 92.8L114.7 92.6L116.7 92.4L118.7 92.2L120.8 91.9L122.8 91.7L124.9 91.4L127 91.1L129 90.7L131.1 90.3L133.2 89.8L135.3 89.3L137.4 88.7L139.6 88.1L141.8 87.2L144.1 86L146.9 84L149.4 79L149.3 76.7C148.4 69.6 137.5 71 138.4 78.1z"/><path class="il-line il-thin" opacity="0.55" d="M139.7 76.7Q141.6 81.5 146.3 83.4M136.2 78.4Q135.8 83.5 139.3 87.3M130.9 79.9Q130 84.9 133 89.1M125.3 81Q124.1 86 126.8 90.3M119.5 81.8Q118.1 86.7 120.7 91.1M113.7 82.4Q112.2 87.3 114.6 91.8M107.9 82.9Q106.2 87.7 108.5 92.3M102 83.2Q100.2 88 102.4 92.6M96.1 83.4Q94.2 88.1 96.3 92.8M90.2 83.5Q88.2 88.2 90.2 92.9M84.3 83.4Q82.2 88.1 84.1 92.8M78.4 83.2Q76.2 87.9 78 92.6M72.5 83Q70.2 87.5 71.9 92.4M66.6 82.6Q64.2 87.1 65.8 91.9M60.7 82.1Q58.2 86.5 59.8 91.4M54.8 81.4Q52.3 85.8 53.7 90.7M49 80.6Q46.3 85 47.6 89.9M43.3 79.6Q40.4 83.9 41.5 88.9M37.6 78.5Q34.6 82.6 35.5 87.6M32.1 77Q28.8 81 29.4 86M26.8 75.2Q23.2 78.9 23.3 84M22.3 73Q18 75.8 17.1 80.8"/><path class="il-light il-thin" opacity="0.5" d="M100.1 85.6L98.1 85.6L96.1 85.7L94.2 85.7L92.2 85.7L90.2 85.7L88.2 85.7L86.2 85.7L84.2 85.7L82.2 85.6L80.3 85.6L78.3 85.5L76.3 85.4L74.3 85.3L72.3 85.2L70.4 85.1L68.4 85L66.4 84.8L64.4 84.7L62.4 84.5L60.5 84.3L58.5 84.1L56.5 83.9L54.6 83.7L52.6 83.4L50.6 83.2L48.7 82.9L46.7 82.6"/><path class="il-pink il-ink" d="M138.4 65.2L138.6 64.9L139.1 63.6L138.5 64L137.3 64.6L135.7 65.2L134.1 65.7L132.3 66.2L130.5 66.6L128.7 67L126.9 67.3L125.9 67.5C118.9 68.8 120.8 79.6 127.8 78.3L128.8 78.2L130.9 77.8L133 77.3L135.1 76.8L137.2 76.2L139.3 75.6L141.6 74.7L143.9 73.6L146.6 71.7L149.3 67.1L149.4 64.9C149.2 57.7 138.2 58 138.4 65.2z"/><path class="il-line il-thin" opacity="0.55" d="M139.7 64.2Q141.4 69 146 71.1M136 65.9Q135.6 71 139.1 74.8M130.7 67.4Q129.8 72.4 132.8 76.5"/><path class="il-light il-thin" opacity="0.5" d="M138.5 67.4L136.7 68.1L134.9 68.6L133.1 69.1L131.2 69.6"/>
    <circle class="il-pink il-ink" cx="130" cy="67.1" r="10"/><path class="il-light il-thin" opacity="0.6" d="M124 62.6a7.5 7.5 0 0 1 5-3.5"/><circle class="il-white il-ink il-thin" cx="126.4" cy="65.9" r="3"/><circle class="il-dark" cx="125.2" cy="65.9" r="1.5"/><path class="il-line il-thin" d="M130.6 65.9q3 -3 6 0"/><ellipse class="il-red" opacity="0.35" cx="124" cy="70.1" rx="1.8" ry="1.2"/><ellipse class="il-red" opacity="0.35" cx="136" cy="70.1" rx="1.8" ry="1.2"/><path class="il-line il-thin" d="M126.2 70.1q3.8 3.8 7.6 0"/>
    <path class="il-light il-thin" d="M146 58l5-4M148 64h6M143 54l2-5"/>
    <g transform="translate(22 100)"><path class="il-wood-dark il-ink il-thin" d="M-10 8l3-16h14l3 16"/><circle class="il-green il-ink" cx="0" cy="-2" r="8"/><circle class="il-line il-thin" cx="0" cy="-2" r="5"/><circle class="il-line il-thin" cx="0" cy="-2" r="2.4"/><circle class="il-metal il-ink il-thin" cx="0" cy="-2" r="1.2"/></g>`,

  // An ancient beetle with a long white beard, bushy brows and a walking stick sits on a huge dinosaur skull deep in the earth layers and cheerfully waves its hanky, as if seeing the dinosaurs off; an ammonite rests nearby.
  'bg.from-dino-times': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 14h160v106H0z"/>
    <path class="il-earth-dark" d="M0 58q20-5 40 0t40 0 40 0 40 0V120H0z"/>
    <path class="il-grass il-ink il-thin" d="M-2 11h164v6H-2z"/>
    <path class="il-grass il-ink il-thin" d="M2 12l2.6999999999999997 -7 2.6999999999999997 7M11 12l2.6999999999999997 -7 2.6999999999999997 7M20 12l2.6999999999999997 -7 2.6999999999999997 7M29 12l2.6999999999999997 -7 2.6999999999999997 7M38 12l2.6999999999999997 -7 2.6999999999999997 7M47 12l2.6999999999999997 -7 2.6999999999999997 7M56 12l2.6999999999999997 -7 2.6999999999999997 7M65 12l2.6999999999999997 -7 2.6999999999999997 7M74 12l2.6999999999999997 -7 2.6999999999999997 7M83 12l2.6999999999999997 -7 2.6999999999999997 7M92 12l2.6999999999999997 -7 2.6999999999999997 7M101 12l2.6999999999999997 -7 2.6999999999999997 7M110 12l2.6999999999999997 -7 2.6999999999999997 7M119 12l2.6999999999999997 -7 2.6999999999999997 7M128 12l2.6999999999999997 -7 2.6999999999999997 7M137 12l2.6999999999999997 -7 2.6999999999999997 7M146 12l2.6999999999999997 -7 2.6999999999999997 7M155 12l2.6999999999999997 -7 2.6999999999999997 7"/>
    <g class="il-earth-dark"><circle cx="20" cy="30" r="1.4"/><circle cx="60" cy="40" r="1.4"/><circle cx="140" cy="26" r="1.4"/><circle cx="110" cy="48" r="1.4"/></g>
    <path class="il-stone" opacity="0.45" d="M0 96q30-4 60 0t50 0 50 0V120H0z"/>
    <g transform="translate(132 34)"><circle class="il-stone il-ink" r="9"/><path class="il-line il-thin" d="M0 0a2 2 0 0 1 3 1a4 4 0 0 1-5 4a6 6 0 0 1-4-8a8 8 0 0 1 11-3"/></g>
    <ellipse class="il-stone il-ink il-thin" cx="26" cy="42" rx="5" ry="3"/><ellipse class="il-stone il-ink il-thin" cx="100" cy="30" rx="3" ry="2"/>
    <path class="il-light il-thick" d="M84 92q0 12 6 16M96 90q0 13 6 17M108 89q0 12 5 16M120 90q0 10 4 14M132 92q1 8 3 11"/>
    <g class="il-beard il-ink il-thin"><circle cx="78" cy="90" r="3.6"/><circle cx="88" cy="88" r="3.6"/><circle cx="98" cy="87" r="3.6"/><circle cx="108" cy="87" r="3.6"/><circle cx="118" cy="88" r="3.4"/><circle cx="128" cy="90" r="3.2"/><circle cx="137" cy="93" r="3"/><circle cx="145" cy="97" r="2.6"/><circle cx="152" cy="101" r="2.2"/><circle cx="157" cy="106" r="2"/></g>
    <path class="il-beard il-ink" d="M18 92c0-12 14-18 30-16 14 2 24 8 24 16 0 8-8 12-16 12H40l-6 6H22c-4-4-6-10-4-18z"/>
    <path class="il-white il-ink il-thin" d="M40 104l2 4 2-4 2 4 2-4 2 4 2-4"/>
    <circle class="il-earth-dark il-ink il-thin" cx="58" cy="86" r="5"/>
    <ellipse class="il-earth-dark il-ink il-thin" cx="32" cy="88" rx="4" ry="2.4"/>
    <path class="il-line il-thin" d="M26 98h20"/>
    <g transform="translate(50 50) scale(1.25 1.25)"><path class="il-line" d="M-13 -4l-9 6l-2 6M13 -4l8-10l2-12M-14 6l-10 5M14 6l10 5M-8 16l-6 6h-3M8 16l6 6h3"/>
    <ellipse class="il-wood-dark il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-6-6-12-4M4 -25q5-6 11-3"/><circle class="il-dark" cx="-16" cy="-29" r="1.8"/><circle class="il-dark" cx="15" cy="-28" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-19" r="3.4"/><circle class="il-white il-ink il-thin" cx="4" cy="-19" r="3.4"/><circle class="il-dark" cx="-3.6" cy="-18.6" r="1.5"/><circle class="il-dark" cx="4.4" cy="-18.6" r="1.5"/><circle class="il-line il-thin" cx="-4" cy="-19" r="4.4"/><circle class="il-line il-thin" cx="4" cy="-19" r="4.4"/><path class="il-beard il-ink il-thin" d="M-10 -24q5-4 9 0q-5 0-9 2zM10 -24q-5-4-9 0q5 0 9 2z"/><path class="il-beard il-ink" d="M-7 -12q7 3 14 0q2 10-3 18l-4-4-4 4q-5-8-3-18z"/><path class="il-line il-thin" opacity="0.5" d="M-2 -6v8M2 -6v8"/><path class="il-wood il-ink il-thin" d="M-24 8l2 22"/><path class="il-wood il-ink il-thin" d="M-24 8q-1-4 3-4"/><path class="il-white il-ink il-thin" d="M25 -26l10-4-2 8 6 4-10 2z"/><path class="il-light il-thin" d="M31 -34l4-3M36 -26l5 0"/></g>`,

  // A furious wasp, red-faced with steam puffing from its head, gritted teeth and shaking fists, has just burst out of a poked paper nest; three more angry little wasps zoom out behind it.
  'bg.wasp-mood': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 104h160v16H0z"/><path class="il-grass il-ink il-thin" d="M0 105l3 -4 3 4M10 105l3 -5 3 5M20 105l3 -6 3 6M30 105l3 -4 3 4M40 105l3 -5 3 5M50 105l3 -6 3 6M60 105l3 -4 3 4M70 105l3 -5 3 5M80 105l3 -6 3 6M90 105l3 -4 3 4M100 105l3 -5 3 5M110 105l3 -6 3 6M120 105l3 -4 3 4M130 105l3 -5 3 5M140 105l3 -6 3 6M150 105l3 -4 3 4"/>
    <path class="il-wood-dark il-ink" d="M-2 10q30 2 60-4l2 5q-30 7-62 5z"/>
    <path class="il-green il-ink il-thin" d="M30 9q4-8 12-6-4 8-12 6zM14 12q2 8-6 10 0-8 6-10z"/>
    <path class="il-stone il-ink" d="M30 12c-10 4-14 18-12 30 2 12 10 18 18 18s14-8 14-20c0-14-6-24-20-28z"/>
    <path class="il-line il-thin" opacity="0.6" d="M20 26q12-4 28 0M19 36q14-4 30 0M21 46q12-4 26 0"/>
    <ellipse class="il-dark" cx="34" cy="56" rx="6" ry="3"/>
    <path class="il-wood il-ink il-thin" d="M50 70l14-30"/><path class="il-line il-thin" d="M48 42l-4-3M52 46l5-3M46 50l-5-1"/>
    <g transform="translate(14 74) rotate(20) scale(-0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.8" cx="2" cy="-12" rx="5" ry="9" transform="rotate(-20 2 -12)"/>
    <path class="il-line il-thin" d="M0 6l-2 6M5 6l2 6"/>
    <ellipse class="il-yellow il-ink" cx="-10" cy="2" rx="11" ry="7"/><path class="il-dark" d="M-14 -4.6v13.2h3V-5.2zM-7 -5.2v14.4h3V-4.6z"/><ellipse class="il-line" cx="-10" cy="2" rx="11" ry="7"/>
    <path class="il-dark il-ink il-thin" d="M-21 2l-4 1 4 1z"/>
    <ellipse class="il-yellow il-ink" cx="3" cy="0" rx="4" ry="4"/>
    <circle class="il-dark il-ink" cx="11" cy="-3" r="6"/><circle class="il-white" cx="13" cy="-4" r="2.4"/><circle class="il-dark" cx="13.6" cy="-3.6" r="1.2"/>
    <path class="il-line" d="M10 -9l6 3"/><path class="il-line il-thin" d="M10 -9q0-5 4-6M12 -9q3-3 7-3"/></g><g transform="translate(46 88) rotate(-10) scale(0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.8" cx="2" cy="-12" rx="5" ry="9" transform="rotate(-20 2 -12)"/>
    <path class="il-line il-thin" d="M0 6l-2 6M5 6l2 6"/>
    <ellipse class="il-yellow il-ink" cx="-10" cy="2" rx="11" ry="7"/><path class="il-dark" d="M-14 -4.6v13.2h3V-5.2zM-7 -5.2v14.4h3V-4.6z"/><ellipse class="il-line" cx="-10" cy="2" rx="11" ry="7"/>
    <path class="il-dark il-ink il-thin" d="M-21 2l-4 1 4 1z"/>
    <ellipse class="il-yellow il-ink" cx="3" cy="0" rx="4" ry="4"/>
    <circle class="il-dark il-ink" cx="11" cy="-3" r="6"/><circle class="il-white" cx="13" cy="-4" r="2.4"/><circle class="il-dark" cx="13.6" cy="-3.6" r="1.2"/>
    <path class="il-line" d="M10 -9l6 3"/><path class="il-line il-thin" d="M10 -9q0-5 4-6M12 -9q3-3 7-3"/></g><g transform="translate(26 100) scale(-0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.8" cx="2" cy="-12" rx="5" ry="9" transform="rotate(-20 2 -12)"/>
    <path class="il-line il-thin" d="M0 6l-2 6M5 6l2 6"/>
    <ellipse class="il-yellow il-ink" cx="-10" cy="2" rx="11" ry="7"/><path class="il-dark" d="M-14 -4.6v13.2h3V-5.2zM-7 -5.2v14.4h3V-4.6z"/><ellipse class="il-line" cx="-10" cy="2" rx="11" ry="7"/>
    <path class="il-dark il-ink il-thin" d="M-21 2l-4 1 4 1z"/>
    <ellipse class="il-yellow il-ink" cx="3" cy="0" rx="4" ry="4"/>
    <circle class="il-dark il-ink" cx="11" cy="-3" r="6"/><circle class="il-white" cx="13" cy="-4" r="2.4"/><circle class="il-dark" cx="13.6" cy="-3.6" r="1.2"/>
    <path class="il-line" d="M10 -9l6 3"/><path class="il-line il-thin" d="M10 -9q0-5 4-6M12 -9q3-3 7-3"/></g>
    <path class="il-light il-thin" d="M24 66l-6 2M58 84l6-2M36 98h-6"/>
    <g transform="translate(104 64)">
    <ellipse class="il-white il-ink il-thin" opacity="0.8" cx="-22" cy="-28" rx="10" ry="18" transform="rotate(-40 -22 -28)"/>
    <ellipse class="il-white il-ink il-thin" opacity="0.8" cx="22" cy="-28" rx="10" ry="18" transform="rotate(40 22 -28)"/>
    <path class="il-light il-thin" d="M-36 -40l-5-4M36 -40l5-4"/>
    <ellipse class="il-yellow" cx="0" cy="30" rx="16" ry="18"/>
    <path class="il-dark" d="M-15.6 22h31.2l-.6 5h-30zM-13 34h26l-2 5h-22z"/>
    <ellipse class="il-line" cx="0" cy="30" rx="16" ry="18"/>
    <path class="il-dark il-ink il-thin" d="M-3 47l3 5 3-5z"/>
    <path class="il-line" d="M-10 8l-16 2-6-10M10 8l16 2 6-10M-8 42l-4 10h-4M8 42l4 10h4"/>
    <circle class="il-dark il-ink" cx="-32" cy="-2" r="4"/><circle class="il-dark il-ink" cx="32" cy="-2" r="4"/>
    <path class="il-light il-thin" d="M-38 -8l-3-3M-36 2l-4 1M38 -8l3-3M36 2l4 1"/>
    <ellipse class="il-yellow il-ink" cx="0" cy="10" rx="9" ry="7"/>
    <circle class="il-yellow il-ink" cx="0" cy="-12" r="17"/>
    <path class="il-dark il-ink il-thin" d="M-16 -16a17 17 0 0 1 32 0q-8-5-16-1-8-4-16 1z"/>
    <path class="il-red" opacity="0.4" d="M-15 -4a14 6 0 0 0 30 0z"/>
    <circle class="il-white il-ink il-thin" cx="-6.5" cy="-10" r="5"/><circle class="il-white il-ink il-thin" cx="6.5" cy="-10" r="5"/>
    <circle class="il-dark" cx="-5.5" cy="-9" r="2.4"/><circle class="il-dark" cx="5.5" cy="-9" r="2.4"/>
    <path class="il-line il-thick" d="M-13 -18l10 5M13 -18l-10 5"/>
    <path class="il-white il-ink il-thin" d="M-7 0h14v5h-14z"/><path class="il-line il-thin" d="M-7 2.5h14M-3.5 0v5M0 0v5M3.5 0v5"/>
    <path class="il-line il-thin" d="M-4 -28q-6-10-14-10M4 -28q6-10 14-10"/><circle class="il-dark" cx="-18" cy="-38" r="2"/><circle class="il-dark" cx="18" cy="-38" r="2"/>
    <path class="il-red il-ink il-thin" d="M18 -26l3 3 3-3M24 -20l-3-3 3-3M18 -20l3-3"/>
    </g>
    <path class="il-smoke il-ink il-thin" d="M84 22a5 5 0 0 1 4-8 6 6 0 0 1 10 2 4 4 0 0 1-2 7z"/>
    <path class="il-smoke il-ink il-thin" d="M114 20a5 5 0 0 1 4-8 6 6 0 0 1 10 2 4 4 0 0 1-2 7z"/>`,

  // Every single bug is coming: three rows of marching ants, a bumblebee squadron and a ladybird charge over the hill in a dust cloud, while a lone worm pops out of its hole with a startled "!".
  'bg.whole-swarm': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M18.8 20a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass il-ink il-thin" d="M-2 58q60-14 164-6v70H-2z"/>
    <path class="il-green" opacity="0.5" d="M0 88q50-6 160 0v32H0z"/>
    <path class="il-smoke" opacity="0.8" d="M112 66a10 10 0 0 1 14-14 12 12 0 0 1 22-4 10 10 0 0 1 14 8v12z"/>
    <path class="il-smoke" opacity="0.6" d="M128 92a8 8 0 0 1 10-12 10 10 0 0 1 22 2v12z"/>
    <g transform="translate(118 26) scale(-0.65 0.65)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-3" cy="-17" rx="6" ry="10" transform="rotate(-25 -3 -17)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="5" cy="-16" rx="5" ry="9" transform="rotate(15 5 -16)"/><path class="il-line il-thin" d="M-6 10l-3 7M0 12v7M6 10l3 6"/>
    <path class="il-dark il-ink il-thin" d="M-14 0l-4 1.4 4 1.4z"/>
    <ellipse class="il-yellow" cx="0" cy="0" rx="14" ry="12"/>
    <path class="il-dark" d="M-9 -9.2L-5 -11.2V11.2L-9 9.2zM-1 -12L3 -11.7V11.7L-1 12z"/>
    <ellipse class="il-line" cx="0" cy="0" rx="14" ry="12"/>
    <path class="il-line il-thin" d="M-8 -12l1-2.5 1.5 2 1-2.5 1.5 2 1-2.5 1.5 2"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -5q1-3 3-4"/>
    <circle class="il-dark il-ink" cx="13" cy="-3" r="7.5"/>
    <path class="il-line il-thin" d="M12 -10q0-6 4-8M15 -10q3-5 7-5"/>
    <circle class="il-white il-ink il-thin" cx="15.5" cy="-5" r="3.2"/><circle class="il-dark" cx="16.5" cy="-5" r="1.6"/>
    <path class="il-light il-thin" d="M14 0q2.5 2 5 0"/></g><g transform="translate(92 18) scale(-0.6 0.6)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-3" cy="-17" rx="6" ry="10" transform="rotate(-25 -3 -17)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="5" cy="-16" rx="5" ry="9" transform="rotate(15 5 -16)"/><path class="il-line il-thin" d="M-6 10l-3 7M0 12v7M6 10l3 6"/>
    <path class="il-dark il-ink il-thin" d="M-14 0l-4 1.4 4 1.4z"/>
    <ellipse class="il-yellow" cx="0" cy="0" rx="14" ry="12"/>
    <path class="il-dark" d="M-9 -9.2L-5 -11.2V11.2L-9 9.2zM-1 -12L3 -11.7V11.7L-1 12z"/>
    <ellipse class="il-line" cx="0" cy="0" rx="14" ry="12"/>
    <path class="il-line il-thin" d="M-8 -12l1-2.5 1.5 2 1-2.5 1.5 2 1-2.5 1.5 2"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -5q1-3 3-4"/>
    <circle class="il-dark il-ink" cx="13" cy="-3" r="7.5"/>
    <path class="il-line il-thin" d="M12 -10q0-6 4-8M15 -10q3-5 7-5"/>
    <circle class="il-white il-ink il-thin" cx="15.5" cy="-5" r="3.2"/><circle class="il-dark" cx="16.5" cy="-5" r="1.6"/>
    <path class="il-light il-thin" d="M14 0q2.5 2 5 0"/></g><g transform="translate(146 34) scale(-0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-3" cy="-17" rx="6" ry="10" transform="rotate(-25 -3 -17)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="5" cy="-16" rx="5" ry="9" transform="rotate(15 5 -16)"/><path class="il-line il-thin" d="M-6 10l-3 7M0 12v7M6 10l3 6"/>
    <path class="il-dark il-ink il-thin" d="M-14 0l-4 1.4 4 1.4z"/>
    <ellipse class="il-yellow" cx="0" cy="0" rx="14" ry="12"/>
    <path class="il-dark" d="M-9 -9.2L-5 -11.2V11.2L-9 9.2zM-1 -12L3 -11.7V11.7L-1 12z"/>
    <ellipse class="il-line" cx="0" cy="0" rx="14" ry="12"/>
    <path class="il-line il-thin" d="M-8 -12l1-2.5 1.5 2 1-2.5 1.5 2 1-2.5 1.5 2"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -5q1-3 3-4"/>
    <circle class="il-dark il-ink" cx="13" cy="-3" r="7.5"/>
    <path class="il-line il-thin" d="M12 -10q0-6 4-8M15 -10q3-5 7-5"/>
    <circle class="il-white il-ink il-thin" cx="15.5" cy="-5" r="3.2"/><circle class="il-dark" cx="16.5" cy="-5" r="1.6"/>
    <path class="il-light il-thin" d="M14 0q2.5 2 5 0"/></g>
    <g transform="translate(122 48) scale(-0.75 0.75)"><path class="il-line il-thin" d="M-5 6l-2 4M0 7v4M5 6l2 4"/>
    <path class="il-red il-ink" d="M-11 4a11 11 0 0 1 22 0z"/>
    <g class="il-dark"><circle cx="-5" cy="-1" r="1.8"/><circle cx="3" cy="-3" r="1.8"/><circle cx="6" cy="1.5" r="1.4"/><circle cx="-1" cy="1.6" r="1.3"/></g>
    <circle class="il-dark il-ink il-thin" cx="12" cy="2" r="4.5"/>
    <circle class="il-white" cx="13.5" cy="1" r="1.6"/><circle class="il-dark" cx="13" cy="1" r="0.8"/></g>
    <g transform="translate(70 61) scale(-0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(95 63) scale(-0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(120 62) scale(-0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(145 61) scale(-0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(59 79) scale(-0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(87 81) scale(-0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(115 80) scale(-0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(143 79) scale(-0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(57 100) scale(-0.82 0.82)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(86 102) scale(-0.82 0.82)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(115 101) scale(-0.82 0.82)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(144 100) scale(-0.82 0.82)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="13.6" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g>
    <g transform="translate(20 100)"><path class="il-stone il-ink" d="M-18 6q0-6 8-6h18q8 0 12 6z"/><circle class="il-orange il-ink" cx="-5" cy="-7" r="11"/><path class="il-line il-thin" d="M-5 -7a3 3 0 1 1 3 3a6 6 0 1 1-6-7"/><path class="il-light il-thin" opacity="0.6" d="M-13 -11q2-5 6-6"/><path class="il-line il-thin" d="M10 0l1-11M14 0l5-10"/><circle class="il-white il-ink il-thin" cx="11" cy="-13" r="3.6"/><circle class="il-white il-ink il-thin" cx="19.6" cy="-12" r="3.6"/><circle class="il-dark" cx="12" cy="-13" r="1.5"/><circle class="il-dark" cx="20.6" cy="-12" r="1.5"/><ellipse class="il-dark" cx="16" cy="2.6" rx="1.4" ry="1.8"/></g>
    <path class="il-light il-thin" d="M12 78l-3-3M22 76l0-4"/>
    <path class="il-yellow il-ink il-thin" d="M38 58l4 0-1 12h-2zM39 73h3v3h-3z"/>`,

  // A tiny mole in a nightcap has moved into a snail shell and sips tea in its doorway, while the evicted snail, now just a sulky slug, waits outside with its bundle.
  'bg.bug-sized': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M114.8 24a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass" d="M0 92h160v28H0z"/><path class="il-grass il-ink il-thin" d="M0 93l2.6999999999999997 -4 2.6999999999999997 4M9 93l2.6999999999999997 -4 2.6999999999999997 4M18 93l2.6999999999999997 -4 2.6999999999999997 4M27 93l2.6999999999999997 -4 2.6999999999999997 4M36 93l2.6999999999999997 -4 2.6999999999999997 4M45 93l2.6999999999999997 -4 2.6999999999999997 4M54 93l2.6999999999999997 -4 2.6999999999999997 4M63 93l2.6999999999999997 -4 2.6999999999999997 4M72 93l2.6999999999999997 -4 2.6999999999999997 4M81 93l2.6999999999999997 -4 2.6999999999999997 4M90 93l2.6999999999999997 -4 2.6999999999999997 4M99 93l2.6999999999999997 -4 2.6999999999999997 4M108 93l2.6999999999999997 -4 2.6999999999999997 4M117 93l2.6999999999999997 -4 2.6999999999999997 4M126 93l2.6999999999999997 -4 2.6999999999999997 4M135 93l2.6999999999999997 -4 2.6999999999999997 4M144 93l2.6999999999999997 -4 2.6999999999999997 4M153 93l2.6999999999999997 -4 2.6999999999999997 4"/>
    <path class="il-green" opacity="0.6" d="M0 106h160v14H0z"/>
    <path class="il-gold il-ink" d="M50 98c-16-4-26-18-24-34 2-18 18-32 38-32s36 14 36 34-14 34-36 34z"/>
    <path class="il-orange il-ink il-thin" d="M66 84c-12 0-22-8-22-20s8-20 22-20 20 8 20 18-6 15-15 15-13-5-13-11 4-9 9-9 7 3 7 7"/>
    <path class="il-light il-thin" opacity="0.6" d="M36 52q8-14 24-16"/>
    <path class="il-earth-dark il-ink" d="M50 104c-14 0-22-8-22-18 0-9 8-14 17-14 12 0 21 8 21 18 0 8-6 14-16 14z"/>
    <circle class="il-torch" cx="38" cy="84" r="8"/><path class="il-line il-thin" d="M38 74v6"/><circle class="il-glow il-ink il-thin" cx="38" cy="82" r="2.2"/>
    <g transform="translate(48 92) scale(1.3)">
    <ellipse class="il-grey il-ink il-thin" cx="0" cy="4" rx="9" ry="6"/>
    <circle class="il-grey il-ink il-thin" cx="2" cy="-4" r="7"/>
    <ellipse class="il-pink il-ink il-thin" cx="9" cy="-2" rx="3" ry="2.2"/>
    <path class="il-line il-thin" d="M-1 -6q1.4-1.4 2.8 0M3.4 -6.6q1.4-1.4 2.8 0M5 2q2 1 4 0"/>
    <path class="il-blue il-ink il-thin" d="M-5 -8q4-8 12-5l-6 2 -8 6z"/><path class="il-blue il-ink il-thin" d="M-5 -8q-6 2-6 8l3-1z"/><circle class="il-white il-ink il-thin" cx="-8" cy="0" r="1.8"/>
    <path class="il-white il-ink il-thin" d="M10 3h6l-1 5h-4z"/><path class="il-line il-thin" d="M16 4a1.6 1.6 0 0 1 0 3"/><circle class="il-pink il-ink il-thin" cx="9.6" cy="5" r="1.6"/>
    <path class="il-light il-thin" d="M12 1q-1-2 0-4M14.6 1q-1-2 0-4"/>
    </g>
    <path class="il-wood il-ink" d="M98 108q-2-18 12-18 10 0 10 8 6 4 16 4t22 6z"/>
    <path class="il-light il-thin" opacity="0.5" d="M102 96q2-4 6-4M124 103q10 0 18 3"/>
    <path class="il-line il-thin" d="M106 92l-4-12M114 92l2-13"/>
    <circle class="il-white il-ink il-thin" cx="102" cy="78" r="3.6"/><circle class="il-white il-ink il-thin" cx="116" cy="77" r="3.6"/>
    <circle class="il-dark" cx="101" cy="79" r="1.6"/><circle class="il-dark" cx="115" cy="78" r="1.6"/>
    <path class="il-line il-thin" d="M97 72l7 3M121 71l-7 3"/>
    <path class="il-line il-thin" d="M104 103q4-3 8 0"/>
    <path class="il-water il-ink il-thin" d="M100 95.8c1.1 1.7 1.8 2.4 1.8 3.2a1.8 1.8 0 0 1-3.5 0c0-0.8 0.7-1.5 1.8-3.2z"/>
    <path class="il-wood-dark il-ink il-thin" d="M130 102l18-20"/><path class="il-red il-ink il-thin" d="M146 82c-4-6 4-12 9-8 5 4 0 10-5 10z"/><path class="il-white" d="M149 77h2v2h-2zM152 80h1.6v1.6H152z"/>
    <path class="il-light il-thin" d="M24 94l-4 4"/>`,

  // A ladybird in a scarf sleeps frozen solid inside an ice block under the snowy garden, snoring zigzags; beside it an alarm clock with a flower on its face waits for spring.
  'bg.winter-torpor': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 24h160v96H0z"/>
    <path class="il-earth-dark" d="M0 90q20-5 40 0t40 0 40 0 40 0V120H0z"/>
    <path class="il-grass il-ink il-thin" d="M-2 21h164v6H-2z"/>
    <g class="il-earth-dark"><circle cx="20" cy="50" r="1.4"/><circle cx="150" cy="60" r="1.4"/><circle cx="140" cy="34" r="1.4"/><circle cx="10" cy="80" r="1.4"/></g>
    <path class="il-light il-thin" d="M10 8h4M12 6v4M10.6 6.6l2.8 2.8M13.4 6.6l-2.8 2.8M38 6h4M40 4v4M38.6 4.6l2.8 2.8M41.4 4.6l-2.8 2.8M68 12h4M70 10v4M68.6 10.6l2.8 2.8M71.4 10.6l-2.8 2.8M102 6h4M104 4v4M102.6 4.6l2.8 2.8M105.4 4.6l-2.8 2.8M128 10h4M130 8v4M128.6 8.6l2.8 2.8M131.4 8.6l-2.8 2.8M148 4h4M150 2v4M148.6 2.6l2.8 2.8M151.4 2.6l-2.8 2.8M22 16h4M24 14v4M22.6 14.6l2.8 2.8M25.4 14.6l-2.8 2.8"/>
    <path class="il-white il-ink il-thin" d="M-2 18q20-6 40-2t40 0 40-2 44 2v8H-2z"/>
    <path class="il-white" opacity="0.35" d="M0 26h160v6H0z"/>
    <rect class="il-water il-ink" opacity="0.85" x="40" y="42" width="66" height="58" rx="5"/>
    <g transform="translate(73 74) scale(0.95 0.95)"><path class="il-line" d="M-13 -4l-7 4l1 7M13 -4l7 4l-1 7M-14 6l-9 4M14 6l9 4M-8 16l-2 8h-3M8 16l2 8h3"/>
    <ellipse class="il-red il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <g class="il-dark"><circle cx="-7" cy="-2" r="3"/><circle cx="7" cy="-2" r="3"/><circle cx="-8" cy="11" r="3.2"/><circle cx="8" cy="11" r="3.2"/><circle cx="-3.5" cy="4" r="2"/><circle cx="3.5" cy="4" r="2"/></g>
    <path class="il-light il-thin" opacity="0.7" d="M-11 -4q1-4 4-6"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white" cx="-7" cy="-22" r="1.6"/><circle class="il-white" cx="7" cy="-22" r="1.6"/>
    <path class="il-light il-thin" d="M-7 -17q3 2.4 6 0M1 -17q3 2.4 6 0"/>
    <ellipse class="il-white" cx="0" cy="-10" rx="2" ry="1.4"/><path class="il-teal il-ink il-thin" d="M-10 -8q10 5 20 0v4q-10 5-20 0z"/><path class="il-teal il-ink il-thin" d="M5 -5l4 10h-5l-2-8z"/><path class="il-light il-thin" d="M-6 -6v4M0 -5v4M6 -6v4"/></g>
    <rect class="il-water" opacity="0.35" x="40" y="42" width="66" height="58" rx="5"/>
    <path class="il-light" d="M46 50l8-6M46 58l14-12M98 92l4-4"/>
    <path class="il-light il-thin" d="M62 98l3-4M86 46l4 3"/>
    <path class="il-light il-thin" d="M108 46h4.4l-4.4 4.4h4.4M114.6 39.4h3.3000000000000003l-3.3000000000000003 3.3000000000000003h3.3000000000000003M120.1 33.9h2.64l-2.64 2.64h2.64"/>
    <g transform="translate(130 86)">
    <path class="il-line" d="M-8 10l-3 5M8 10l3 5"/>
    <circle class="il-metal il-ink" cx="-9" cy="-13" r="5"/><circle class="il-metal il-ink" cx="9" cy="-13" r="5"/>
    <circle class="il-red il-ink" r="14"/><circle class="il-white il-ink il-thin" r="10.5"/>
    <g class="il-pink il-ink il-thin"><circle cx="0" cy="-4" r="2.6"/><circle cx="3.8" cy="-1.2" r="2.6"/><circle cx="2.4" cy="3.2" r="2.6"/><circle cx="-2.4" cy="3.2" r="2.6"/><circle cx="-3.8" cy="-1.2" r="2.6"/></g>
    <circle class="il-yellow il-ink il-thin" r="2.2"/>
    <path class="il-line il-thin" d="M0 -9v2M9 0h-2M0 9v-2M-9 0h2"/>
    </g>
    <ellipse class="il-stone il-ink il-thin" cx="20" cy="104" rx="6" ry="4"/><ellipse class="il-stone il-ink il-thin" cx="150" cy="108" rx="5" ry="3"/>
    <path class="il-light il-thin" d="M18 60l-4-2M150 52l4-3"/>`,

  // A determined little ant heaves a huge mossy stone up on one end; underneath, a whole crowd blinks into the light: a woodlouse, a beetle waving hello, a worm and lots of glinting eyes.
  'bg.under-the-stone': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M118.8 20a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass" d="M0 84h160v36H0z"/><path class="il-grass il-ink il-thin" d="M0 85l3 -4 3 4M10 85l3 -5 3 5M20 85l3 -6 3 6M30 85l3 -4 3 4M40 85l3 -5 3 5M50 85l3 -6 3 6M60 85l3 -4 3 4M70 85l3 -5 3 5M80 85l3 -6 3 6M90 85l3 -4 3 4M100 85l3 -5 3 5M110 85l3 -6 3 6M120 85l3 -4 3 4M130 85l3 -5 3 5M140 85l3 -6 3 6M150 85l3 -4 3 4"/>
    <ellipse class="il-earth-dark il-ink" cx="90" cy="96" rx="56" ry="14"/>
    <ellipse class="il-cave" cx="96" cy="92" rx="40" ry="8"/>
    <g class="il-white"><circle cx="130" cy="96" r="1.2"/><circle cx="134" cy="96" r="1.2"/><circle cx="58" cy="100" r="1.2"/><circle cx="62" cy="100" r="1.2"/><circle cx="104" cy="104" r="1"/><circle cx="108" cy="104" r="1"/></g>
    <g transform="translate(70 94)">
    <path class="il-line il-thin" d="M-8 4v3M-4 5v3M0 5v3M4 5v3M8 4v3"/>
    <path class="il-grey il-ink" d="M-12 4a12 9 0 0 1 24 0z"/>
    <path class="il-line il-thin" d="M-7 -3v7M-2 -5v9M3 -5v9M8 -3v7"/>
    <circle class="il-grey il-ink il-thin" cx="13" cy="1" r="4"/><circle class="il-white" cx="14" cy="0" r="1.6"/><circle class="il-dark" cx="14.4" cy="0" r="0.8"/>
    </g>
    <g transform="translate(98 88) scale(0.62 0.62)"><path class="il-line" d="M-13 -4l-8-8l-1-8M13 -4l10-6l4-8M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/>
    <ellipse class="il-green il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="3.8"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="3.8"/><circle class="il-dark" cx="-4" cy="-18" r="1.8"/><circle class="il-dark" cx="4" cy="-18" r="1.8"/><path class="il-light il-thin" d="M-4 -12q4 4 8 0"/></g>
    <path class="il-pink il-ink" d="M111 101.5L111.9 102.2L113.8 103.4L115.8 104.4L118 105.2L120.4 105.6L122.8 105.6L125.3 105.1L127.6 104.1L129.8 102.7L131.6 100.9L132.9 99.1L133.9 98L135 97.1L136.1 96.5L137.2 96.2L138.1 96.3L138.8 96.7L139.4 97.6L139.4 97.6C141.5 100.9 146.6 97.7 144.5 94.4L143.8 93.3L141.4 91.2L138.4 90.3L135.4 90.4L132.8 91.4L130.6 92.8L128.8 94.6L127.5 96.4L126.5 97.6L125.4 98.5L124.2 99.1L122.8 99.6L121.3 99.8L119.7 100L118 100L116.3 99.7L114.6 99.2L113 98.5L113 98.5C111 97.2 109.1 100.3 111 101.5z"/><path class="il-line il-thin" opacity="0.55" d="M114.1 102.7Q116.5 102.2 115.2 100.2M120.4 104.8Q122.4 102.8 120.5 100.8M127.3 103.4Q128 100.5 125.2 99.5M132.2 98.7Q131.7 95.7 128.7 96M135.9 95.7Q137 93 134.3 91.6M139.3 96.1Q142.3 95.7 142.2 92.7"/><path class="il-light il-thin" opacity="0.5" d="M123.7 103.8L125.8 103.1L127.8 102.1L129.6 100.6L131 98.9L132.1 97.4L133.4 96.2L134.8 95.2"/><circle class="il-pink il-ink" cx="142" cy="96" r="5.4"/><path class="il-light il-thin" opacity="0.6" d="M138.7 93.5a4.1 4.1 0 0 1 2.7-1.9"/><circle class="il-white il-ink il-thin" cx="140" cy="95.3" r="1.6"/><circle class="il-dark" cx="139.3" cy="94.6" r="0.8"/><circle class="il-white il-ink il-thin" cx="143.9" cy="95.3" r="1.6"/><circle class="il-dark" cx="143.2" cy="94.6" r="0.8"/><ellipse class="il-red" opacity="0.35" cx="138.7" cy="97.6" rx="1" ry="0.6"/><ellipse class="il-red" opacity="0.35" cx="145.2" cy="97.6" rx="1" ry="0.6"/><ellipse class="il-dark" cx="142" cy="98.2" rx="1" ry="1.3"/>
    <path class="il-light il-thin" d="M88 70l-2-5M100 70l2-6M112 72l4-4"/>
    <g transform="rotate(16 90 50)">
    <ellipse class="il-stone il-ink" cx="90" cy="50" rx="56" ry="17"/>
    <path class="il-grey" opacity="0.7" d="M38 54q52 16 104 0q-4 10-52 13t-52-13z"/>
    <path class="il-green il-ink il-thin" d="M58 36q10-6 22-3q-8 4-22 3zM100 34q14-2 22 4q-12 0-22-4z"/>
    <path class="il-light il-thin" opacity="0.6" d="M60 42q20-6 40-4"/>
    <circle class="il-grey" cx="118" cy="46" r="2"/><circle class="il-grey" cx="74" cy="48" r="1.6"/>
    </g>
    <g transform="translate(30 64) scale(0.9 0.9)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-red il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-red il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-6-10l2-14M5 -2l6-10l2-14"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-red il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-3.4" cy="-14.9" r="1.7"/><circle class="il-dark" cx="4.6" cy="-14.9" r="1.7"/>
    <path class="il-dark il-ink il-thin" d="M-4 -7h8v2.4h-8z"/><path class="il-line il-thin" d="M-2 -7v2.4M0.6 -7v2.4"/></g>
    <path class="il-light il-thin" d="M14 44l-4-3M14 52h-5"/>
    <path class="il-water il-ink il-thin" d="M18 32c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/>`,

  // A neat line of ants follows a wavy dotted scent trail to a slice of strawberry cake; one carries a crumb, one walks with its eyes blissfully closed, and a latecomer dashes out of the nest hole behind them.
  'bg.follow-the-scent': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M28.8 22a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass" d="M0 74h160v10H0z"/><path class="il-grass il-ink il-thin" d="M0 75l2.6999999999999997 -5 2.6999999999999997 5M9 75l2.6999999999999997 -5 2.6999999999999997 5M18 75l2.6999999999999997 -5 2.6999999999999997 5M27 75l2.6999999999999997 -5 2.6999999999999997 5M36 75l2.6999999999999997 -5 2.6999999999999997 5M45 75l2.6999999999999997 -5 2.6999999999999997 5M54 75l2.6999999999999997 -5 2.6999999999999997 5M63 75l2.6999999999999997 -5 2.6999999999999997 5M72 75l2.6999999999999997 -5 2.6999999999999997 5M81 75l2.6999999999999997 -5 2.6999999999999997 5M90 75l2.6999999999999997 -5 2.6999999999999997 5M99 75l2.6999999999999997 -5 2.6999999999999997 5M108 75l2.6999999999999997 -5 2.6999999999999997 5M117 75l2.6999999999999997 -5 2.6999999999999997 5M126 75l2.6999999999999997 -5 2.6999999999999997 5M135 75l2.6999999999999997 -5 2.6999999999999997 5M144 75l2.6999999999999997 -5 2.6999999999999997 5M153 75l2.6999999999999997 -5 2.6999999999999997 5"/>
    <path class="il-earth il-ink il-thin" d="M-2 82h164v40H-2z"/>
    <path class="il-earth-dark" opacity="0.5" d="M0 108q40-4 80 0t80 0v12H0z"/>
    <path class="il-light il-dash" d="M10 76q20-8 40 0t40 0 30-6"/>
    <path class="il-light il-thin" d="M120 48q-4-6 0-10t0-10M132 46q-4-6 0-10t0-10"/>
    <g transform="translate(130 92)">
    <path class="il-paper il-ink" d="M-26 6v-20l46-16v28z"/>
    <path class="il-pink il-ink il-thin" d="M-26 -6l46-12v6l-46 12z"/>
    <path class="il-white il-ink" d="M-28 -14l48-16q4 2 0 6l-48 14z"/>
    <path class="il-gold il-ink il-thin" d="M20 -30l8 4v28l-8 4z"/>
    <circle class="il-red il-ink" cx="-2" cy="-26" r="6"/><path class="il-green il-ink il-thin" d="M-2 -32q0-4 4-5"/>
    <path class="il-light il-thin" d="M-5 -28l2-2"/>
    <g class="il-paper il-ink il-thin"><circle cx="-34" cy="4" r="1.6"/><circle cx="-40" cy="6" r="1.2"/></g>
    </g>
    <ellipse class="il-dark il-ink" cx="9" cy="106" rx="8" ry="3.6"/>
    <g transform="translate(36 95) scale(0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/><path class="il-paper il-ink il-thin" d="M6 -14l8-2 2 5-8 2z"/><path class="il-line il-thin" d="M9 -10l0 3M12 -11l1 4"/></g><g transform="translate(64 94) scale(0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <path class="il-light il-thin" d="M12.5 -6q2 1.5 4 0"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g><g transform="translate(92 95) scale(0.7 0.7)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g>
    <g transform="translate(10 100) rotate(-20) scale(0.5 0.5)"><path class="il-line il-thin" d="M-3 2l-8 6h-3M0 3l3 9h-2M3 2l8 6h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/></g>
    <path class="il-line il-thin" d="M4 90l-3-2M3 96h-3"/>`,

  // Everyone fled the rain and left the picnic: on the checked blanket a beetle hugs a bitten cake, an ant marches off with a biscuit held overhead and a ladybird nibbles crumbs under a leaf umbrella.
  'bg.abandoned-picnic': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grey il-ink il-thin" d="M20.4 21a7 7 0 0 1 4.2-12.6a9.8 9.8 0 0 1 18.2-4.2a8.4 8.4 0 0 1 14 7a5.6 5.6 0 0 1 2.8 9.8z"/><path class="il-grey il-ink il-thin" d="M101.2 18a6 6 0 0 1 3.6-10.8a8.4 8.4 0 0 1 15.6-3.6a7.2 7.2 0 0 1 12 6a4.8 4.8 0 0 1 2.4 8.4z"/>
    <path class="il-grass" d="M0 64h160v56H0z"/><path class="il-grass il-ink il-thin" d="M0 65l3 -4 3 4M10 65l3 -5 3 5M20 65l3 -6 3 6M30 65l3 -4 3 4M40 65l3 -5 3 5M50 65l3 -6 3 6M60 65l3 -4 3 4M70 65l3 -5 3 5M80 65l3 -6 3 6M90 65l3 -4 3 4M100 65l3 -5 3 5M110 65l3 -6 3 6M120 65l3 -4 3 4M130 65l3 -5 3 5M140 65l3 -6 3 6M150 65l3 -4 3 4"/>
    <path class="il-white il-ink" d="M20 76h120l20 44H-2z"/>
    <path class="il-red" d="M20 76L35 76L30.9 87L14.5 87zM50 76L65 76L63.6 87L47.3 87zM80 76L95 76L96.4 87L80 87zM110 76L125 76L129.1 87L112.8 87zM30.9 87L47.3 87L44.5 98L26.8 98zM63.6 87L80 87L80 98L62.3 98zM96.4 87L112.8 87L115.5 98L97.8 98zM129.1 87L145.5 87L151 98L133.3 98zM9 98L26.8 98L22.6 109L3.5 109zM44.5 98L62.3 98L60.9 109L41.8 109zM80 98L97.8 98L99.1 109L80 109zM115.5 98L133.3 98L137.4 109L118.3 109zM22.6 109L41.8 109L39 120L18.5 120zM60.9 109L80 109L80 120L59.5 120zM99.1 109L118.3 109L121 120L100.5 120zM137.4 109L156.5 109L162 120L141.5 120z"/>
    <path class="il-line il-thin" d="M20 76h120l20 44H-2z"/>
    <g transform="translate(22 70)"><path class="il-wood il-ink" d="M-14 -8h28l-3 18h-22z"/><path class="il-line il-thin" opacity="0.6" d="M-13 -3h26M-12 2h24M-6 -8l1 18M2 -8l-1 18M8 -8l-1 18"/><path class="il-wood-dark il-ink il-thin" d="M-14 -8q-2-10 6-12h16q8 2 6 12"/><path class="il-wood il-ink il-thin" d="M-16 -8l2-6h28l2 6z" transform="rotate(-20 -14 -8)"/></g>
    <g transform="translate(78 82)">
    <path class="il-paper il-ink" d="M-20 0v12a20 6 0 0 0 40 0V0z"/>
    <ellipse class="il-pink il-ink" cx="0" cy="0" rx="20" ry="6"/>
    <path class="il-pink il-ink il-thin" d="M-20 2q2 6 6 2 3 6 6 2 4 6 8 2 4 6 8 0"/>
    <path class="il-paper il-ink il-thin" d="M12 -4a5 5 0 0 0 8 6l0 6a5 5 0 0 1-8-4z"/>
    <circle class="il-red il-ink il-thin" cx="-6" cy="-3" r="3"/><circle class="il-red il-ink il-thin" cx="4" cy="-4" r="3"/>
    </g>
    <g transform="translate(92 84) scale(0.72 0.72)"><path class="il-line" d="M-13 -4l-12 6l-6 0M13 -4l-14 8M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/>
    <ellipse class="il-green il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <path class="il-light il-thin" d="M-7 -18q3-3 6 0M1 -18q3-3 6 0"/><path class="il-light il-thin" d="M-3 -12q3 3 6 0"/></g>
    <path class="il-pink il-ink il-thin" d="M104 64.4c-4-2.4-4-6.4 0-4.8c4-1.6 4 2.4 0 4.8z"/>
    <g transform="translate(126 100) scale(0.8 0.8)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-dark il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-dark il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-6-8l0-8M5 -2l6-8l0-8"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-4" cy="-14" r="1.7"/><circle class="il-dark" cx="4" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-3 -7q3 2 6 0"/><circle class="il-gold il-ink" cx="0" cy="-32" r="9"/><g class="il-wood-dark"><circle cx="-3" cy="-34" r="1.2"/><circle cx="3" cy="-31" r="1.2"/><circle cx="-1" cy="-28" r="1"/><circle cx="2" cy="-37" r="1"/></g></g>
    <g transform="translate(44 96)">
    <path class="il-line il-thin" d="M0 -18v18"/>
    <path class="il-green il-ink" d="M-14 -16q14-14 28 0q-7-3-14 0q-7-3-14 0z"/><path class="il-line il-thin" d="M0 -26v10M-7 -21l4 4M7 -21l-4 4"/>
    <g transform="translate(0 6) scale(0.6 0.6)"><path class="il-line il-thin" d="M-5 6l-2 4M0 7v4M5 6l2 4"/>
    <path class="il-red il-ink" d="M-11 4a11 11 0 0 1 22 0z"/>
    <g class="il-dark"><circle cx="-5" cy="-1" r="1.8"/><circle cx="3" cy="-3" r="1.8"/><circle cx="6" cy="1.5" r="1.4"/><circle cx="-1" cy="1.6" r="1.3"/></g>
    <circle class="il-dark il-ink il-thin" cx="12" cy="2" r="4.5"/>
    <circle class="il-white" cx="13.5" cy="1" r="1.6"/><circle class="il-dark" cx="14" cy="1" r="0.8"/></g>
    </g>
    <g class="il-gold il-ink il-thin"><circle cx="58" cy="108" r="1.6"/><circle cx="66" cy="112" r="1.2"/><circle cx="104" cy="110" r="1.4"/><circle cx="140" cy="114" r="1.2"/></g>
    <circle class="il-gold il-ink il-thin" cx="110" cy="112" r="5"/><circle class="il-wood-dark" cx="109" cy="111" r="0.9"/><circle class="il-wood-dark" cx="112" cy="113" r="0.9"/>
    <path class="il-water il-ink il-thin" d="M10 27.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M30 41.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M56 25.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M92 33.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M118 23.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M146 37.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M134 57.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M20 57.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M70 47.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M104 55.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M150 67.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M6 77.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/>`,

  // In the cellar, a beetle with a torch peeks into a dusty, cobwebbed cardboard box with a "!" label: a cloud of dust puffs out along with a striped sock, a yo-yo, a rubber duck, an old key and a marble.
  'bg.cellar-junk-box': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.15" d="M0 20h160M0 40h160M0 60h160M20 0v20M60 0v20M100 0v20M140 0v20M40 20v20M80 20v20M120 20v20M20 40v20M60 40v20M100 40v20M140 40v20"/>
    <rect class="il-wood il-ink" x="2" y="32" width="70" height="5"/>
    <g transform="translate(10 32)"><rect class="il-water il-ink il-thin" opacity="0.8" x="0" y="-16" width="11" height="16" rx="2"/><rect class="il-red il-ink il-thin" x="-1" y="-19" width="13" height="4" rx="1"/><rect class="il-orange" x="2" y="-10" width="7" height="8"/></g>
    <g transform="translate(28 32)"><rect class="il-water il-ink il-thin" opacity="0.8" x="0" y="-20" width="13" height="20" rx="2"/><rect class="il-metal il-ink il-thin" x="-1" y="-23" width="15" height="4" rx="1"/><rect class="il-green" x="2" y="-14" width="9" height="12"/></g>
    <g transform="translate(48 32)"><rect class="il-water il-ink il-thin" opacity="0.8" x="0" y="-14" width="10" height="14" rx="2"/><rect class="il-gold il-ink il-thin" x="-1" y="-17" width="12" height="4" rx="1"/><rect class="il-purple" x="2" y="-9" width="6" height="7"/></g>
    <path class="il-light il-thin" opacity="0.6" d="M60 32l6-4M62 32l2-6"/>
    <path class="il-light il-thin" opacity="0.5" d="M160 0l-24 24M160 12l-24 12M148 0l-12 24M140 24q8-8 20-10M146 24q6-12 14-16"/>
    <path class="il-earth-dark" d="M0 104h160v16H0z"/>
    <path class="il-smoke" opacity="0.85" d="M70 52a12 12 0 0 1 16-14 14 14 0 0 1 26-2 12 12 0 0 1 14 12q8 4 2 12H70q-8-2 0-8z"/>
    <path class="il-wood il-ink" d="M58 70h70v38H58z"/>
    <path class="il-wood-dark il-ink" d="M58 70l-12-14 66 0 16 14z" opacity="0.9"/>
    <path class="il-wood il-ink" d="M58 70l-6 12-12-8 6-18z"/>
    <path class="il-wood il-ink" d="M128 70l10 10 6-14-6-10z"/>
    <path class="il-line il-thin" opacity="0.4" d="M58 88h70M93 70v38"/>
    <rect class="il-paper il-ink il-thin" x="66" y="84" width="20" height="14" rx="1"/>
    <path class="il-red il-ink il-thin" d="M75 86h2l-.4 6h-1.2zM75 94h2v2h-2z"/>
    <path class="il-light il-thin" opacity="0.6" d="M120 108l8-8M124 108l4-4"/>
    <g transform="translate(100 50)"><path class="il-white il-ink il-thin" d="M-6 -8h8v12q0 4 5 6l-1 6q-12-2-12-12z"/><path class="il-red" d="M-6 -4h8v3h-8zM-6 2h8v3h-8z"/></g>
    <g transform="translate(78 44)"><circle class="il-red il-ink" r="6"/><circle class="il-line il-thin" r="3"/><path class="il-line il-thin" d="M0 0q8 10 4 18"/></g>
    <g transform="translate(122 46)"><path class="il-yellow il-ink" d="M-8 2q0-8 8-8 4 0 5 4h5q-2 4-5 4 3 6-4 8h-6q-3-2-3-8z"/><circle class="il-dark" cx="2" cy="-2" r="1"/></g>
    <g transform="translate(90 32) rotate(-30)"><circle class="il-gold il-ink il-thin" r="4"/><circle class="il-cave" r="1.6"/><path class="il-gold il-ink il-thin" d="M4 -1h10v2h-2v3h-2v-3h-2v2h-2v-2h-2z"/></g>
    <circle class="il-teal il-ink il-thin" cx="112" cy="30" r="3.4"/><path class="il-light il-thin" d="M111 28.6l1.6-0.6"/>
    <path class="il-light il-thin" d="M86 22l-2-4M108 20l2-5M96 18v-5"/>
    <path class="il-torch" d="M38 76L76 58 78 76z"/>
    <g transform="translate(26 84) scale(0.85 0.85)"><path class="il-line" d="M-13 -4l12-6M13 -4l9 6l2 6M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/><rect class="il-metal il-ink il-thin" x="0" y="-14" width="12" height="6" rx="1.5" transform="rotate(-20 0 -11)"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="3.8"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="3.8"/><circle class="il-dark" cx="-2.4" cy="-18.6" r="1.8"/><circle class="il-dark" cx="5.6" cy="-18.6" r="1.8"/><ellipse class="il-dark il-ink il-thin" cx="1" cy="-10" rx="2" ry="2.4"/></g>`,

  // A downpour: our blue beetle has slipped and landed bottom-first in a muddy puddle with a big splash, dizzy and soaked, its leaf umbrella sailing away, while two ants dash past under leaves.
  'bg.rain': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grey il-ink il-thin" d="M17.6 18a8 8 0 0 1 4.8-14.4a11.2 11.2 0 0 1 20.8-4.8a9.6 9.6 0 0 1 16 8a6.4 6.4 0 0 1 3.2 11.2z"/><path class="il-grey il-ink il-thin" d="M105 19.5a7.5 7.5 0 0 1 4.5-13.5a10.5 10.5 0 0 1 19.5-4.5a9 9 0 0 1 15 7.5a6 6 0 0 1 3 10.5z"/>
    <path class="il-water-line" d="M14 22l-4 10M40 32l-4 10M70 20l-4 10M100 28l-4 10M128 18l-4 10M150 34l-4 10M24 50l-4 10M138 52l-4 10M58 44l-4 10"/>
    <path class="il-grass" d="M0 80h160v40H0z"/><path class="il-grass il-ink il-thin" d="M0 81l3 -4 3 4M10 81l3 -5 3 5M20 81l3 -6 3 6M30 81l3 -4 3 4M40 81l3 -5 3 5M50 81l3 -6 3 6M60 81l3 -4 3 4M70 81l3 -5 3 5M80 81l3 -6 3 6M90 81l3 -4 3 4M100 81l3 -5 3 5M110 81l3 -6 3 6M120 81l3 -4 3 4M130 81l3 -5 3 5M140 81l3 -6 3 6M150 81l3 -4 3 4"/>
    <path class="il-earth il-ink il-thin" d="M18 100q0-10 62-10t62 10q0 12-62 12t-62-12z"/>
    <ellipse class="il-water il-ink il-thin" cx="80" cy="102" rx="50" ry="8"/>
    <path class="il-light il-thin" d="M48 102q10-3 22-2M100 104q8 1 14-1"/>
    <path class="il-water il-ink il-thin" d="M34 96q-10-10-6-20 6 8 12 14zM126 96q10-10 6-20-6 8-12 14z"/>
    <path class="il-water il-ink il-thin" d="M30 67.2c1.4 2.1 2.2 3.1 2.2 4.1a2.2 2.2 0 0 1-4.5 0c0-1 0.8-2 2.2-4.1z"/><path class="il-water il-ink il-thin" d="M130 65.2c1.4 2.1 2.2 3.1 2.2 4.1a2.2 2.2 0 0 1-4.5 0c0-1 0.8-2 2.2-4.1z"/><path class="il-water il-ink il-thin" d="M42 62c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M118 60c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/>
    <g transform="translate(80 78) scale(1.05 1.05)"><path class="il-line" d="M-13 -4l-12 -4l-4-6M13 -4l12-4l4-6M-14 6l-12 8M14 6l12 8M-8 16l-14 6h-3M8 16l14 6h3"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <path class="il-light il-thin" d="M-4 -18m-3 0a3 3 0 1 0 3-3a1.6 1.6 0 1 0 1.4 1.4M4 -18m-3 0a3 3 0 1 0 3-3a1.6 1.6 0 1 0 1.4 1.4"/><path class="il-light il-thin" d="M-4 -10q2-2 4 0t4 0"/><path class="il-water il-ink il-thin" d="M-14 -26c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M16 -28c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/></g>
    <polygon class="il-yellow il-ink il-thin" points="62,42 63.1,44.5 65.8,44.8 63.7,46.6 64.4,49.2 62,47.8 59.6,49.2 60.3,46.6 58.2,44.8 60.9,44.5"/><polygon class="il-yellow il-ink il-thin" points="98,38.6 98.9,40.8 101.2,40.9 99.5,42.5 100,44.8 98,43.5 96,44.8 96.5,42.5 94.8,40.9 97.1,40.8"/>
    <g transform="translate(136 30) rotate(30)"><path class="il-green il-ink" d="M-14 0q14-14 28 0q-7-3-14 0q-7-3-14 0z"/><path class="il-line il-thin" d="M0 -9v18"/></g>
    <path class="il-light il-thin" d="M120 40l-4 4M118 30l-6 0"/>
    <g transform="translate(14 88) scale(0.55 0.55)"><path class="il-line il-thin" d="M-3 2l-6 8h-3M0 3l-1 10h-2M3 2l6 8h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/><path class="il-green il-ink il-thin" d="M0 -20q12-10 24 0q-12-4-24 0z"/><path class="il-line il-thin" d="M12 -18v10"/></g>
    <g transform="translate(146 92) scale(-0.55 0.55)"><path class="il-line il-thin" d="M-3 2l-6 8h-3M0 3l-1 10h-2M3 2l6 8h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13.5 -1q2.5 1.8 5 0"/><path class="il-green il-ink il-thin" d="M0 -20q12-10 24 0q-12-4-24 0z"/><path class="il-line il-thin" d="M12 -18v10"/></g>`,

  // Cross-section of a flowerpot: a worm has tunnelled up through the soil and popped out right underneath a round cactus, which now sits on its head like a spiky hat; eyes squeezed shut, "ouch" stars all around.
  'bg.wrong-flowerpot': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="0" y="108" width="160" height="12"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 112h160"/>
    <path class="il-orange il-ink" d="M18 48h124l-12 62H30z"/>
    <path class="il-earth-dark il-ink il-thin" d="M26 56h108l-9 48H35z"/>
    <path class="il-earth il-ink" d="M39.7 93.7L40 95L41 98.2L42.8 101.4L45.1 104.2L48 106.5L51.2 108.2L54.4 109.2L57.6 109.7L60.7 109.7L63.7 109.4L66.6 108.7L69.3 107.8L71.9 106.5L74.4 105.1L76.7 103.4L78.8 101.4L82.2 92L80.3 97.3L79.1 99L79.8 98.6L80.9 98.2L82.3 97.8L83.8 97.5L85.5 97.2L87.2 96.9L89.1 96.7L91 96.5L92.9 96.3L94.9 96.1L97 95.8L99.2 95.6L101.4 95.2L103.7 94.8L106.1 94.2L108.7 93.4L111.6 92.2L114.6 90.2L117.6 87.1L119.7 83L120.5 78.8L120.3 75L119.1 71.2L117.1 67.7L114.6 64.9L111.8 62.9L109.1 61.5L106.6 60.4L104.1 59.6L101.7 59.1L99.3 58.6L97 58.3L94.8 58L92.6 57.8L90.4 57.7L88.3 57.6L86.1 57.5L84 57.5L82 57.5L81 57.5C69.9 57.5 69.9 74.5 81 74.5L81.9 74.5L83.9 74.5L85.8 74.5L87.7 74.6L89.5 74.7L91.3 74.8L93.1 74.9L94.8 75.1L96.5 75.4L98.1 75.7L99.6 76L100.9 76.4L102 76.9L102.9 77.3L103.3 77.7L103.5 77.8L103.5 77.8L103.5 77.8L103.5 78L103.6 77.7L103.8 77.2L104.1 76.9L103.7 77.1L102.9 77.4L101.7 77.8L100.2 78.1L98.6 78.5L96.9 78.7L95 78.9L93.1 79.2L91.2 79.4L89.1 79.6L87.1 79.8L84.9 80.1L82.7 80.4L80.5 80.8L78.1 81.3L75.6 82.1L73 83.1L70.2 84.5L65.7 88.6L65.7 96L66.6 89.5L65.8 90.3L64.9 91L63.9 91.6L62.9 92L61.9 92.4L60.8 92.6L59.9 92.8L59 92.7L58.2 92.6L57.6 92.5L57.2 92.3L57 92.1L56.8 91.8L56.6 91.5L56.5 90.9L56.3 90.3C54.1 79.5 37.4 82.9 39.7 93.7z"/>
    <g class="il-stone il-ink il-thin"><circle cx="44" cy="70" r="3"/><circle cx="118" cy="76" r="2.4"/><circle cx="120" cy="98" r="2"/></g>
    <path class="il-pink il-ink" d="M45.1 92.6L45.2 93.7L45.9 96.1L47.1 98.5L48.7 100.6L50.7 102.4L53 103.7L55.5 104.6L58 105.1L60.5 105.2L63 105L65.4 104.6L67.8 103.9L70 103L72.2 101.8L74.2 100.4L76.1 98.8L78.7 92.8L77.3 95.5L77.2 96L78.4 95.4L79.8 94.9L81.4 94.4L83.1 94L84.9 93.7L86.8 93.5L88.7 93.2L90.6 93L92.6 92.8L94.6 92.6L96.6 92.3L98.7 92.1L100.8 91.8L103 91.4L105.2 90.8L107.5 90.1L109.9 89.1L112.4 87.5L114.8 85.1L116.4 81.9L117 78.7L116.8 75.6L115.9 72.5L114.3 69.8L112.3 67.5L110 65.9L107.7 64.6L105.4 63.7L103.1 63L100.9 62.5L98.7 62.1L96.6 61.7L94.4 61.5L92.3 61.3L90.2 61.2L88.1 61.1L86.1 61L84 61L82 61L81 61C74.5 61 74.5 71 81 71L82 71L83.9 71L85.9 71L87.8 71.1L89.7 71.2L91.6 71.3L93.5 71.5L95.3 71.7L97.1 71.9L98.8 72.3L100.5 72.7L102.1 73.1L103.5 73.7L104.7 74.4L105.7 75.1L106.3 75.7L106.7 76.5L106.9 77.2L107 78.1L106.9 78.8L106.7 79.2L106.2 79.6L105.3 80.2L104.1 80.7L102.6 81.2L100.9 81.6L99.2 81.9L97.3 82.2L95.4 82.4L93.5 82.6L91.5 82.8L89.5 83.1L87.5 83.3L85.4 83.5L83.3 83.9L81.2 84.2L79 84.7L76.7 85.4L74.4 86.3L72 87.5L68.7 90.4L69.2 95.1L69.3 92.1L68.2 93.2L67.1 94.2L65.8 95.1L64.5 95.9L63.1 96.5L61.6 97L60.1 97.3L58.6 97.4L57.2 97.3L55.8 97L54.5 96.4L53.5 95.7L52.5 94.8L51.8 93.6L51.2 92.2L50.9 91.4C50.1 87.6 44.3 88.8 45.1 92.6z"/><path class="il-line il-thin" opacity="0.55" d="M46.7 95.8Q49.6 96.7 51 93.9M51.2 101.7Q54.3 100.5 54.1 97.1M58.1 104.3Q60.3 101.4 58.5 98.2M65.2 103.8Q66.1 100 63.3 97.3M71.7 101.1Q71.3 96.9 67.5 94.9M77.9 93Q73.5 92 70 95M78.1 94.7Q78.2 90 74.7 87M83 93.3Q84.1 88.8 81.3 85M88.6 92.4Q90.1 88 87.6 84.1M94.5 91.8Q96 87.4 93.6 83.4M100.7 91Q102 86.5 99.3 82.7M107.3 89.4Q107.7 84.7 104.4 81.5M114.1 84.6Q111.9 80.5 107.3 79.7M116 75.7Q111.5 74.4 107.7 77.1M111.7 68.1Q107.5 70 106.2 74.5M105.1 64.5Q101.8 67.8 102.3 72.4M98.6 62.9Q95.9 66.7 97.2 71.1M92.3 62.1Q90 66.2 91.7 70.5M86.1 61.8Q84 66 85.9 70.2"/><path class="il-light il-thin" opacity="0.5" d="M78.1 92.5L79.8 92L81.6 91.5L83.5 91.1L85.4 90.8L87.4 90.6L89.3 90.3L91.3 90.1L93.3 89.9L95.3 89.7L97.3 89.4L99.3 89.2L101.4 88.8L103.4 88.4L105.5 87.8L107.6 87.1L109.7 86L111.7 84.4L113.2 82.3L114 79.8L114.2 77.3L113.8 74.8L112.8 72.5L111.3 70.5"/>
    <path class="il-orange il-ink" d="M14 42h132v10H14z"/>
    <path class="il-light il-thin" opacity="0.5" d="M20 45h40"/>
    <circle class="il-pink il-ink" cx="82" cy="50" r="11"/>
    <path class="il-line il-thin" d="M73 47l6 3-6 3M91 47l-6 3 6 3"/>
    <ellipse class="il-dark" cx="82" cy="56" rx="3" ry="3.4"/>
    <ellipse class="il-red" opacity="0.35" cx="74" cy="55" rx="2" ry="1.3"/><ellipse class="il-red" opacity="0.35" cx="90" cy="55" rx="2" ry="1.3"/>
    <circle class="il-green il-ink" cx="82" cy="25" r="16"/>
    <path class="il-line il-thin" opacity="0.5" d="M82 9v32M74 11q-4 14 0 28M90 11q4 14 0 28"/>
    <path class="il-line il-thin" d="M66 23l-4-1M67 31l-4 2M70 15l-3-3M98 23l4-1M97 31l4 2M94 15l3-3M76 10l-1-4M88 10l1-4M72 38l-3 3M92 38l3 3"/>
    <g class="il-pink il-ink il-thin"><ellipse cx="82" cy="5" rx="2.6" ry="4"/><ellipse cx="78" cy="7" rx="2.6" ry="3.4" transform="rotate(-50 78 7)"/><ellipse cx="86" cy="7" rx="2.6" ry="3.4" transform="rotate(50 86 7)"/></g>
    <polygon class="il-yellow il-ink il-thin" points="56,25 57.3,28.2 60.8,28.5 58.1,30.7 58.9,34 56,32.3 53.1,34 53.9,30.7 51.2,28.5 54.7,28.2"/><polygon class="il-yellow il-ink il-thin" points="108,25 109.3,28.2 112.8,28.5 110.1,30.7 110.9,34 108,32.3 105.1,34 105.9,30.7 103.2,28.5 106.7,28.2"/><polygon class="il-yellow il-ink il-thin" points="62,44.6 62.9,46.8 65.2,46.9 63.5,48.5 64,50.8 62,49.5 60,50.8 60.5,48.5 58.8,46.9 61.1,46.8"/><polygon class="il-yellow il-ink il-thin" points="104,46.6 104.9,48.8 107.2,48.9 105.5,50.5 106,52.8 104,51.5 102,52.8 102.5,50.5 100.8,48.9 103.1,48.8"/>
    <path class="il-water il-ink il-thin" d="M68 38c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M96 38c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/>
    <path class="il-green il-ink il-thin" d="M120 42q4-10 12-8-2 8-12 8z"/>`,

  // A gust whips across the gardens: the beetle clutches its bare head in shock while its flowered straw hat sails high over three garden fences on a dotted arc, straight towards a pond where a frog watches it splash down.
  'bg.hat-blown-away': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M18.8 18a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/><path class="il-white" d="M141.6 25a3 3 0 0 1 1.8-5.4a4.2 4.2 0 0 1 7.8-1.8a3.6 3.6 0 0 1 6 3a2.4 2.4 0 0 1 1.2 4.2z"/>
    <path class="il-grass" d="M0 76h160v44H0z"/>
    <path class="il-green" opacity="0.6" d="M0 76h160v8H0z"/>
    <g transform="translate(50 72) scale(0.6 0.6)"><path class="il-white il-ink il-thin" d="M0 0h30v3H0zM0 8h30v3H0z"/><path class="il-white il-ink il-thin" d="M2 14V-4l2-3 2 3v18zM12 14V-4l2-3 2 3v18zM22 14V-4l2-3 2 3v18z"/></g><g transform="translate(82 70) scale(0.55 0.55)"><path class="il-white il-ink il-thin" d="M0 0h30v3H0zM0 8h30v3H0z"/><path class="il-white il-ink il-thin" d="M2 14V-4l2-3 2 3v18zM12 14V-4l2-3 2 3v18zM22 14V-4l2-3 2 3v18z"/></g><g transform="translate(110 68) scale(0.5 0.5)"><path class="il-white il-ink il-thin" d="M0 0h30v3H0zM0 8h30v3H0z"/><path class="il-white il-ink il-thin" d="M2 14V-4l2-3 2 3v18zM12 14V-4l2-3 2 3v18zM22 14V-4l2-3 2 3v18z"/></g>
    <ellipse class="il-water il-ink" cx="140" cy="94" rx="22" ry="8"/>
    <path class="il-light il-thin" d="M126 94q6-2 12 0M144 98q5 1 10-1"/>
    <path class="il-water il-ink il-thin" d="M128 84q2-6 6-2 2-6 6 0 4-4 6 2"/>
    <ellipse class="il-green il-ink il-thin" cx="150" cy="92" rx="5" ry="2"/>
    <g transform="translate(124 98)"><ellipse class="il-green il-ink il-thin" cx="0" cy="2" rx="8" ry="4"/><path class="il-green il-ink il-thin" d="M-7 0q0-8 7-8t7 8z"/><circle class="il-white il-ink il-thin" cx="-3" cy="-7" r="2.6"/><circle class="il-white il-ink il-thin" cx="3" cy="-7" r="2.6"/><circle class="il-dark" cx="-2.4" cy="-8" r="1.2"/><circle class="il-dark" cx="3.6" cy="-8" r="1.2"/><path class="il-line il-thin" d="M-3 -2q3 2 6 0"/></g>
    <path class="il-light il-dash" d="M30 44q50-50 104 0q6 10 8 36"/>
    <path class="il-light" d="M4 28q20-6 40 2M10 54q24-8 50 0M2 70q16-4 30 0"/>
    <path class="il-light il-thin" d="M60 18q14-4 28 2"/>
    <g transform="translate(98 22) rotate(24) scale(1.05 1.05)"><ellipse class="il-gold il-ink" cx="0" cy="4" rx="18" ry="5"/><path class="il-gold il-ink" d="M-10 4q0-12 10-12t10 12z"/><path class="il-red il-ink il-thin" d="M-10 1h20v3h-20z"/><path class="il-line il-thin" opacity="0.5" d="M-6 -4h12M-13 6q13 3 26 0"/><circle class="il-white il-ink il-thin" cx="7" cy="0" r="2.4"/><circle class="il-yellow" cx="7" cy="0" r="0.9"/></g>
    <path class="il-light il-thin" d="M76 12l-6-3M76 22l-7 1M80 32l-5 4"/>
    <g transform="translate(30 74) scale(1.1 1.1)"><path class="il-line" d="M-13 -4l-2-10l7-9M13 -4l2-10l-7-9M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q6-8 14-8M4 -25q8-4 14-2"/><circle class="il-dark" cx="10" cy="-33" r="1.8"/><circle class="il-dark" cx="18" cy="-27" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="4"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="4"/><circle class="il-dark" cx="-2.6" cy="-19.4" r="1.6"/><circle class="il-dark" cx="5.4" cy="-19.4" r="1.6"/><ellipse class="il-white il-ink il-thin" cx="0" cy="-10" rx="2.4" ry="2.8"/></g>`,

  // A huge green watering can tips its sprinkler rose over our soaked beetle; its jumper drips into a puddle, a lily pad sits on its head with a little frog on top, and duckweed has started growing on its back: a personal wetland.
  'bg.watering-can-shower': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M130.2 17.5a3.5 3.5 0 0 1 2.1-6.3a4.9 4.9 0 0 1 9.1-2.1a4.2 4.2 0 0 1 7 3.5a2.8 2.8 0 0 1 1.4 4.9z"/>
    <path class="il-grass" d="M0 96h160v24H0z"/><path class="il-grass il-ink il-thin" d="M0 97l3 -4 3 4M10 97l3 -5 3 5M20 97l3 -6 3 6M30 97l3 -4 3 4M40 97l3 -5 3 5M50 97l3 -6 3 6M60 97l3 -4 3 4M70 97l3 -5 3 5M80 97l3 -6 3 6M90 97l3 -4 3 4M100 97l3 -5 3 5M110 97l3 -6 3 6M120 97l3 -4 3 4M130 97l3 -5 3 5M140 97l3 -6 3 6M150 97l3 -4 3 4"/>
    <ellipse class="il-water il-ink il-thin" cx="96" cy="108" rx="40" ry="7"/>
    <path class="il-light il-thin" d="M70 108q8-2 14 0M108 110q8 1 14-1"/>
    <g transform="translate(14 12) scale(0.88) rotate(22 40 26)">
    <path class="il-green il-ink" d="M8 6q-14 6-6 22l6-2q-6-10 2-16z"/>
    <path class="il-green il-ink" d="M10 4h48l-4 40H14z"/>
    <path class="il-light il-thin" opacity="0.6" d="M16 10v30"/>
    <path class="il-line il-thin" opacity="0.5" d="M12 16h44M12 34h43"/>
    <path class="il-green il-ink" d="M18 0q18-10 34 0l-4 4q-14-6-26 0z"/>
    <path class="il-green il-ink" d="M56 30l20-6 2 7-21 7z"/>
    <path class="il-teal il-ink" d="M75 18l6 18-5 2-6-18z"/>
    <g class="il-dark"><circle cx="76" cy="23" r="0.8"/><circle cx="78" cy="28" r="0.8"/><circle cx="79.6" cy="33" r="0.8"/></g>
    </g>
    <path class="il-water-line" d="M78 50l-4 12M86 50l0 12M94 50l4 12"/>
    <path class="il-water il-ink il-thin" d="M82 49.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M92 53.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M100 47.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M76 59.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M88 63.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M104 59.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M96 69.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M110 67.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/><path class="il-water il-ink il-thin" d="M80 71.6c1.2 1.8 1.9 2.6 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-0.8 0.7-1.7 1.9-3.5z"/>
    <g transform="translate(96 90) scale(1.05 1.05)"><path class="il-line" d="M-13 -4l-9 8l-1 6M13 -4l9 8l1 6M-14 6l-10 5M14 6l10 5M-8 16l-3 8h-3M8 16l3 8h3"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-6-2-10 4M4 -25q6-2 10 4"/><circle class="il-dark" cx="-14" cy="-21" r="1.8"/><circle class="il-dark" cx="14" cy="-21" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <path class="il-white il-ink il-thin" d="M-8 -18a4 4 0 0 1 8 0zM0 -18a4 4 0 0 1 8 0z"/><circle class="il-dark" cx="-4" cy="-19.4" r="1.4"/><circle class="il-dark" cx="4" cy="-19.4" r="1.4"/><path class="il-line il-thin" d="M-8.4 -18h8M-0.4 -18h8.8"/><path class="il-light il-thin" d="M-3 -11h6"/><path class="il-red il-ink" d="M-15 4a15 15 0 0 1 30 0v8q-15 6-30 0z"/><path class="il-white il-thin il-ink" d="M-14 8h28"/><g class="il-slime"><circle cx="-8" cy="14" r="1.6"/><circle cx="-4" cy="18" r="1.2"/><circle cx="6" cy="16" r="1.6"/><circle cx="9" cy="12" r="1.2"/><circle cx="2" cy="20" r="1.2"/></g><path class="il-water il-ink il-thin" d="M-10 20c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M12 21c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><ellipse class="il-green il-ink il-thin" cx="0" cy="-27" rx="13" ry="3.6"/><path class="il-grass" d="M0 -27l9-3v4z"/><g transform="translate(-2 -31)"><ellipse class="il-slime il-ink il-thin" cx="0" cy="0" rx="5" ry="3.4"/><circle class="il-slime il-ink il-thin" cx="-2.4" cy="-3" r="2"/><circle class="il-slime il-ink il-thin" cx="2.4" cy="-3" r="2"/><circle class="il-dark" cx="-2.4" cy="-3.2" r="0.9"/><circle class="il-dark" cx="2.4" cy="-3.2" r="0.9"/><path class="il-line il-thin" d="M-2 0.6q2 1.2 4 0"/></g></g>`,

  // The beetle wobbles in six red sneakers whose laces have all been tied together into one big bow in the middle; it stares down puzzled ("?") while a giggling ant peeks out from behind a pebble.
  'bg.six-shoes-one-knot': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M18.8 20a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-earth" d="M0 96h160v24H0z"/>
    <path class="il-grass il-ink il-thin" d="M-2 92h164v6H-2z"/><path class="il-grass il-ink il-thin" d="M0 93l3 -4 3 4M10 93l3 -5 3 5M20 93l3 -6 3 6M30 93l3 -4 3 4M40 93l3 -5 3 5M50 93l3 -6 3 6M60 93l3 -4 3 4M70 93l3 -5 3 5M80 93l3 -6 3 6M90 93l3 -4 3 4M100 93l3 -5 3 5M110 93l3 -6 3 6M120 93l3 -4 3 4M130 93l3 -5 3 5M140 93l3 -6 3 6M150 93l3 -4 3 4"/>
    <g class="il-earth-dark"><circle cx="20" cy="108" r="1.4"/><circle cx="140" cy="112" r="1.4"/><circle cx="110" cy="116" r="1.2"/></g>
    <g transform="translate(78 62) scale(1.2 1.2)"><path class="il-line" d="M-13 -4l-14 8l-9 16M13 -4l14 8l9 16M-14 6l-6 8l-2 11M14 6l6 8l2 11M-8 16v14M8 16v14"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-17" r="3.8"/><circle class="il-white il-ink il-thin" cx="4" cy="-17" r="3.8"/><circle class="il-dark" cx="-3.4" cy="-15.4" r="1.8"/><circle class="il-dark" cx="4.6" cy="-15.4" r="1.8"/><path class="il-light il-thin" d="M-3 -10q1.5-1.5 3 0t3 0"/></g>
    <g transform="translate(31.8 90) rotate(4) scale(-1.2 1.2)"><g transform="translate(0 0)"><path class="il-red il-ink il-thin" d="M-6 2v-6q0-3 3-3h3l2 4h4q4 0 4 5z"/><path class="il-white il-ink il-thin" d="M-6 2h16v2.4h-16z"/></g></g><g transform="translate(48.6 96) rotate(4) scale(-1.2 1.2)"><g transform="translate(0 0)"><path class="il-red il-ink il-thin" d="M-6 2v-6q0-3 3-3h3l2 4h4q4 0 4 5z"/><path class="il-white il-ink il-thin" d="M-6 2h16v2.4h-16z"/></g></g><g transform="translate(65.4 102) rotate(4) scale(-1.2 1.2)"><g transform="translate(0 0)"><path class="il-red il-ink il-thin" d="M-6 2v-6q0-3 3-3h3l2 4h4q4 0 4 5z"/><path class="il-white il-ink il-thin" d="M-6 2h16v2.4h-16z"/></g></g><g transform="translate(90.6 102) rotate(-4) scale(1.2 1.2)"><g transform="translate(0 0)"><path class="il-red il-ink il-thin" d="M-6 2v-6q0-3 3-3h3l2 4h4q4 0 4 5z"/><path class="il-white il-ink il-thin" d="M-6 2h16v2.4h-16z"/></g></g><g transform="translate(107.4 96) rotate(-4) scale(1.2 1.2)"><g transform="translate(0 0)"><path class="il-red il-ink il-thin" d="M-6 2v-6q0-3 3-3h3l2 4h4q4 0 4 5z"/><path class="il-white il-ink il-thin" d="M-6 2h16v2.4h-16z"/></g></g><g transform="translate(124.2 90) rotate(-4) scale(1.2 1.2)"><g transform="translate(0 0)"><path class="il-red il-ink il-thin" d="M-6 2v-6q0-3 3-3h3l2 4h4q4 0 4 5z"/><path class="il-white il-ink il-thin" d="M-6 2h16v2.4h-16z"/></g></g>
    <path class="il-line" d="M34.8 88Q56.4 104 78 110M51.6 94Q64.8 110 78 110M68.4 100Q73.2 116 78 110M87.6 100Q82.8 116 78 110M104.4 94Q91.2 110 78 110M121.2 88Q99.6 104 78 110"/><path class="il-light il-thin" d="M34.8 88Q56.4 104 78 110M51.6 94Q64.8 110 78 110M68.4 100Q73.2 116 78 110M87.6 100Q82.8 116 78 110M104.4 94Q91.2 110 78 110M121.2 88Q99.6 104 78 110"/>
    <path class="il-light il-thin" d="M44 40l-4-2M42 48h-5M112 40l4-2M114 48h5"/>
    <g transform="translate(78 110)"><path class="il-white il-ink il-thin" d="M0 0q-12-8-12 0t12 0q12-8 12 0t-12 0z"/><path class="il-white il-ink il-thin" d="M0 0l-6 8M0 0l6 8"/><circle class="il-white il-ink il-thin" r="2.4"/></g>
    <path class="il-yellow il-ink il-thin" d="M108 14q0-6 6-6t6 5-5 5v4h-3v-6q5-1 5-4t-3-3-3 3z"/><circle class="il-yellow il-ink il-thin" cx="114.5" cy="27" r="1.6"/>
    <ellipse class="il-stone il-ink" cx="140" cy="88" rx="16" ry="10"/>
    <path class="il-light il-thin" opacity="0.6" d="M130 84q6-4 12-4"/>
    <g transform="translate(134 78)"><circle class="il-red il-ink" r="7"/><circle class="il-white il-ink il-thin" cx="-2.6" cy="-1" r="2.4"/><circle class="il-white il-ink il-thin" cx="2.6" cy="-1" r="2.4"/><circle class="il-dark" cx="-3.2" cy="-0.6" r="1.1"/><circle class="il-dark" cx="2" cy="-0.6" r="1.1"/><path class="il-line il-thin" d="M-2 -6q-3-6-7-6M2 -6q3-6 7-6"/><path class="il-red il-ink il-thin" d="M-6 4q6 4 12 0" /><path class="il-line il-thin" d="M-3 3.4q3 2 6 0"/></g>
    <path class="il-light il-thin" d="M146 70l3-3M148 76l4-1"/>`,

  // The beetle reaches out in dismay ("!") as a cheerful line of ants marches its garden trowel away on their backs, straight towards the anthill.
  'bg.carried-off-by-ants': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M58.8 20a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass" d="M0 96h160v24H0z"/><path class="il-grass il-ink il-thin" d="M0 97l3 -4 3 4M10 97l3 -5 3 5M20 97l3 -6 3 6M30 97l3 -4 3 4M40 97l3 -5 3 5M50 97l3 -6 3 6M60 97l3 -4 3 4M70 97l3 -5 3 5M80 97l3 -6 3 6M90 97l3 -4 3 4M100 97l3 -5 3 5M110 97l3 -6 3 6M120 97l3 -4 3 4M130 97l3 -5 3 5M140 97l3 -6 3 6M150 97l3 -4 3 4"/>
    <path class="il-earth il-ink" d="M118 108q12-40 24-40t20 40z"/>
    <path class="il-earth-dark" opacity="0.6" d="M130 96q6-22 12-22t10 22z"/>
    <ellipse class="il-dark il-ink il-thin" cx="141" cy="84" rx="5" ry="4"/>
    <g class="il-earth-dark"><circle cx="126" cy="100" r="1.4"/><circle cx="150" cy="96" r="1.4"/><circle cx="138" cy="104" r="1.2"/></g>
    <g transform="translate(40 96) scale(0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(56 97) scale(0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(72 96) scale(0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(88 97) scale(0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(104 96) scale(0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-5 9h-3M0 3l-2 10h-2M3 2l7 7h3"/>
    <ellipse class="il-red il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-red il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-red il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-red il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g><g transform="translate(120 97) scale(0.6 0.6)"><path class="il-line il-thin" d="M-3 2l-7 7h-3M0 3l1 10h-2M3 2l5 9h3"/>
    <ellipse class="il-dark il-ink" cx="-12" cy="-2" rx="9" ry="7"/>
    <path class="il-light il-thin" opacity="0.6" d="M-17 -5q3-3 8-3"/>
    <circle class="il-dark il-ink il-thin" cx="-3" cy="0" r="2"/>
    <ellipse class="il-dark il-ink" cx="2" cy="-1" rx="5" ry="3.8"/>
    <path class="il-line il-thin" d="M11 -10q1-8 7-9M14 -10q4-6 9-5"/>
    <circle class="il-dark il-ink" cx="12" cy="-5" r="6"/>
    <circle class="il-white il-ink il-thin" cx="14" cy="-6" r="2.8"/><circle class="il-dark" cx="15" cy="-6" r="1.4"/>
    <path class="il-light il-thin" d="M13 -2q3 2.5 6 0"/></g>
    <g transform="translate(82 80) rotate(-3)">
    <path class="il-wood il-ink" d="M-48 -9h8l6 6v6l-6 6h-8z"/><path class="il-sky il-ink il-thin" d="M-45 -5h4l3 3v4l-3 3h-4z"/>
    <rect class="il-wood il-ink" x="-35" y="-2.4" width="34" height="4.8" rx="1"/>
    <path class="il-metal il-ink il-thin" d="M-3 -4h7v8h-7z"/>
    <path class="il-metal il-ink" d="M4 -11h16q10 0 12 11-2 11-12 11H4z"/>
    <path class="il-line il-thin" d="M8 -10v20"/>
    <path class="il-light il-thin" d="M12 -6q10 0 14 5"/>
    </g>
    <path class="il-line il-thin" d="M138 86l6-3M136 92l8 0"/>
    <g transform="translate(16 80) scale(0.9 0.9)"><path class="il-line" d="M-13 -4l14-6l8-2M13 -4l9 6l2 6M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="3.8"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="3.8"/><circle class="il-dark" cx="-2.4" cy="-18" r="1.8"/><circle class="il-dark" cx="5.6" cy="-18" r="1.8"/><ellipse class="il-white il-ink il-thin" cx="0" cy="-10" rx="2" ry="2.6"/></g>
    <path class="il-yellow il-ink il-thin" d="M26 34l5 0-1.4 14h-2.2zM27 51h3v3h-3z"/>`,

  // Cross-section through the floorboards: the beetle peers down a crack in despair as its marble drops through ("click, clack"); in the dusty dark below already lie three marbles, a baby tooth and a button, watched by a little spider.
  'bg.between-the-floorboards': `
    <rect class="il-purple-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.15" d="M20 0v40M60 0v40M100 0v40M140 0v40"/>
    <path class="il-cave" d="M0 52h160v68H0z"/>
    <path class="il-torch" d="M80 52l-26 60h50z"/>
    <path class="il-earth-dark" d="M0 108q40-4 80 0t80 0v12H0z"/>
    <path class="il-wood il-ink" d="M-2 40h79v12H-2zM84 40h78v12H84z"/>
    <path class="il-wood-dark il-ink il-thin" d="M-2 52h79v6H-2zM84 52h78v6H84z"/>
    <path class="il-line il-thin" opacity="0.45" d="M30 40v12M120 40v12M6 45q10-2 18 0M44 47q12 2 22 0M96 45q10 2 20 0M130 47q12-2 24 0"/>
    <g class="il-dark"><circle cx="34" cy="46" r="0.9"/><circle cx="116" cy="46" r="0.9"/></g>
    <g transform="translate(62 24)"><path class="il-line" d="M-26 12l-6 4M-18 12l-4 4M18 10l6 4M22 6l8 2"/>
    <ellipse class="il-blue il-ink" cx="0" cy="8" rx="26" ry="9"/>
    <path class="il-line il-thin" d="M-24 8h48"/>
    <path class="il-light il-thin" opacity="0.7" d="M-16 2q8-3 16-3"/>
    <circle class="il-dark il-ink" cx="16" cy="6" r="9"/>
    <path class="il-line il-thin" d="M18 -2q2-8 8-10M22 0q6-4 12-4"/>
    <circle class="il-white il-ink il-thin" cx="15" cy="9" r="3.4"/><circle class="il-white il-ink il-thin" cx="21.6" cy="8" r="3.4"/>
    <circle class="il-dark" cx="16" cy="11" r="1.6"/><circle class="il-dark" cx="22" cy="10" r="1.6"/>
    <path class="il-line il-thin" d="M12 5l5-2M24 3l-4 1"/></g>
    <path class="il-water il-ink il-thin" d="M78 40c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/>
    <circle class="il-teal il-ink" cx="80" cy="70" r="4"/><path class="il-light il-thin" d="M78.4 68.6l1.6-1"/>
    <path class="il-light il-thin" d="M80 58v6M76 60l1 3M84 60l-1 3"/>
    <path class="il-white il-thin" d="M88 62l3-2 1 3 3-2M64 62l3 2 1-3 3 2"/>
    <circle class="il-red il-ink" cx="62" cy="104" r="4.6"/><path class="il-light il-thin" d="M60 102l2-1"/>
    <circle class="il-blue il-ink" cx="74" cy="106" r="4.6"/><path class="il-light il-thin" d="M72 104l2-1"/>
    <circle class="il-green il-ink" cx="96" cy="105" r="4.6"/><path class="il-light il-thin" d="M94 103l2-1"/>
    <path class="il-white il-ink il-thin" d="M82 100q2-3 4 0q2-3 4 0q1 4-1 6l-1 4-1-3h-2l-1 3-1-4q-2-2-1-6z"/>
    <circle class="il-gold il-ink il-thin" cx="110" cy="107" r="4"/><g class="il-dark"><circle cx="109" cy="106" r="0.7"/><circle cx="111" cy="106" r="0.7"/><circle cx="109" cy="108" r="0.7"/><circle cx="111" cy="108" r="0.7"/></g>
    <path class="il-light il-thin" opacity="0.4" d="M0 58l20 20M0 70l14-12M140 58l20 22M150 58l-12 16"/>
    <path class="il-light il-thin" d="M134 58v26"/>
    <g transform="translate(134 88)"><path class="il-line il-thin" d="M-3 -1l-5-3M-3 1l-6 1M-3 3l-5 4M3 -1l5-3M3 1l6 1M3 3l5 4"/><circle class="il-dark il-ink il-thin" r="4"/><circle class="il-white" cx="-1.4" cy="-1" r="1.2"/><circle class="il-white" cx="1.4" cy="-1" r="1.2"/><circle class="il-dark" cx="-1.6" cy="-0.6" r="0.6"/><circle class="il-dark" cx="1.2" cy="-0.6" r="0.6"/></g>
    <g class="il-smoke" opacity="0.5"><circle cx="30" cy="110" r="3"/><circle cx="36" cy="112" r="2"/><circle cx="128" cy="110" r="3"/></g>`,

  // A cloudburst pours into the burrow; a worm in a red-and-white swim ring bobs in the flood and watches in horror as its shiny golden goblet floats off towards the drain grate.
  'bg.washed-away': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 18h160v102H0z"/>
    <path class="il-earth-dark" d="M0 100q20-5 40 0t40 0 40 0 40 0V120H0z"/>
    <path class="il-grass il-ink il-thin" d="M-2 15h164v6H-2z"/>
    <path class="il-grass il-ink il-thin" d="M2 16l2.6999999999999997 -7 2.6999999999999997 7M11 16l2.6999999999999997 -7 2.6999999999999997 7M20 16l2.6999999999999997 -7 2.6999999999999997 7M29 16l2.6999999999999997 -7 2.6999999999999997 7M38 16l2.6999999999999997 -7 2.6999999999999997 7M47 16l2.6999999999999997 -7 2.6999999999999997 7M56 16l2.6999999999999997 -7 2.6999999999999997 7M65 16l2.6999999999999997 -7 2.6999999999999997 7M74 16l2.6999999999999997 -7 2.6999999999999997 7M83 16l2.6999999999999997 -7 2.6999999999999997 7M92 16l2.6999999999999997 -7 2.6999999999999997 7M101 16l2.6999999999999997 -7 2.6999999999999997 7M110 16l2.6999999999999997 -7 2.6999999999999997 7M119 16l2.6999999999999997 -7 2.6999999999999997 7M128 16l2.6999999999999997 -7 2.6999999999999997 7M137 16l2.6999999999999997 -7 2.6999999999999997 7M146 16l2.6999999999999997 -7 2.6999999999999997 7M155 16l2.6999999999999997 -7 2.6999999999999997 7"/>
    <g class="il-earth-dark"><circle cx="14" cy="40" r="1.4"/><circle cx="140" cy="30" r="1.4"/><circle cx="100" cy="34" r="1.4"/><circle cx="24" cy="104" r="1.4"/><circle cx="150" cy="108" r="1.4"/></g>
    <path class="il-grey il-ink il-thin" d="M42.8 10a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-earth-dark il-ink" d="M8 60q0-14 20-16h104q22 2 22 18v34q0 6-8 6H16q-8 0-8-8z"/>
    <path class="il-earth-dark" d="M46 16h18v30H46z"/>
    <path class="il-line il-thin" d="M46 16v30M64 16v30"/>
    <path class="il-water-line" d="M52 18v30M58 18v30"/>
    <path class="il-water il-ink il-thin" d="M54 32c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M62 40c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M48 44c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M58 52c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/>
    <path class="il-water il-ink il-thin" d="M8 74q12-4 24 0t24 0 24 0 24 0 24 0 22 0v22q0 6-8 6H16q-8 0-8-8z"/>
    <path class="il-light il-thin" d="M20 82q6-2 12 0M70 86q6-2 12 0M110 82q6-2 12 0"/>
    <g transform="translate(146 74)"><rect class="il-metal il-ink" x="-6" y="-14" width="12" height="28" rx="2"/><path class="il-dark" d="M-3 -10h2v20h-2zM1 -10h2v20h-2z"/></g>
    <path class="il-light il-thin" d="M128 70l8 0M126 78l10 0"/>
    <g transform="translate(112 70) rotate(14)">
    <path class="il-gold il-ink" d="M-9 -12h18q0 12-9 14q-9-2-9-14z"/>
    <path class="il-gold il-ink il-thin" d="M-2 2h4v5h-4zM-6 7h12v3h-12z"/>
    <circle class="il-red il-ink il-thin" cx="0" cy="-6" r="2.4"/>
    <path class="il-light il-thin" d="M-6 -10q0 6 2 8"/>
    </g>
    <path class="il-white" d="M124 55q0.6 2.4 3 3q-2.4 0.6 -3 3q-0.6 -2.4 -3 -3q2.4 -0.6 3 -3z"/><path class="il-white" d="M100 53.6q0.5 1.9 2.4 2.4q-1.9 0.5 -2.4 2.4q-0.5 -1.9 -2.4 -2.4q1.9 -0.5 2.4 -2.4z"/>
    <path class="il-pink il-ink" d="M63.9 80.3L63.1 80.9L61.7 81.7L60.2 82.3L58.8 82.6L57.6 83L56.5 83.2L55.4 83.2L54.4 83L53.5 82.6L52.6 82L51.7 81.1L51 79.9L50.3 78.5L50.3 78.5C47.8 73.2 39.6 77 42.1 82.3L42.6 83.3L43.9 85.6L45.6 87.7L47.7 89.6L50.2 91L53 92L56 92.3L58.9 92L61.5 91.1L63.8 89.6L65.6 87.7L67 85.7L68.1 83.7L68.1 83.7C70.3 80.9 66.1 77.6 63.9 80.3z"/><path class="il-line il-thin" opacity="0.55" d="M63 81.9Q63.3 85 66.4 85.2M59.1 83.4Q59 87.5 62.4 89.7M55.9 84.1Q54 87.8 56 91.5M53.1 83.3Q49.5 85.5 49.3 89.7M50.7 81Q46.5 81.4 44.5 85.1"/><path class="il-light il-thin" opacity="0.5" d="M58.3 85.4L56.7 85.7L55.2 85.8L53.6 85.4L52.2 84.8L50.9 83.8"/>
    <ellipse class="il-white il-ink" cx="40" cy="76" rx="15" ry="6"/>
    <path class="il-red il-ink il-thin" d="M26 74q2 6 6 7v-11q-4 1-6 4zM44 70v12q6 0 9-3q-2-7-9-9z"/>
    <circle class="il-pink il-ink" cx="40" cy="64" r="9.5"/><path class="il-light il-thin" opacity="0.6" d="M34.3 59.7a7.1 7.1 0 0 1 4.8-3.3"/><circle class="il-white il-ink il-thin" cx="36.6" cy="62.9" r="2.9"/><circle class="il-dark" cx="37.9" cy="62.9" r="1.4"/><circle class="il-white il-ink il-thin" cx="43.4" cy="62.9" r="2.9"/><circle class="il-dark" cx="44.7" cy="62.9" r="1.4"/><path class="il-line il-thin" d="M33 56l5 2M42 58l5-2"/><ellipse class="il-red" opacity="0.35" cx="34.3" cy="66.9" rx="1.7" ry="1.1"/><ellipse class="il-red" opacity="0.35" cx="45.7" cy="66.9" rx="1.7" ry="1.1"/><ellipse class="il-dark" cx="40" cy="68" rx="1.7" ry="2.3"/>
    <path class="il-yellow il-ink il-thin" d="M58 50l5-1-1 10h-2zM60 61l3-.6.4 2.4-3 .6z"/>`,

  // At a bureau counter a hopeful ladybird holds up six application forms, one in each leg, while a stern beetle clerk in spectacles raises a rubber stamp beside a towering pile of paperwork; two of the ladybird's cards lie on the counter as the fee.
  'bg.flight-permit': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.15" d="M0 30h160"/>
    <g transform="translate(130 22)"><circle class="il-white il-ink" r="11"/><circle class="il-line" r="8"/><path class="il-white il-ink il-thin" d="M-4 1q0-7 6-8 2 6-2 9zM0 2q4-6 8-3-4 5-8 4z"/><path class="il-red il-thick" d="M-6 6L6 -6" /></g>
    <rect class="il-wood-dark il-ink" x="88" y="62" width="74" height="60"/>
    <rect class="il-wood il-ink" x="84" y="58" width="78" height="8"/>
    <path class="il-line il-thin" opacity="0.4" d="M100 72v46M130 72v46"/>
    <g transform="translate(124 42) scale(0.85 0.85)"><path class="il-line" d="M-13 -4l-10 8l-4 8M13 -4l6-12l2-6M-14 6l-10 5M14 6l10 5"/>
    <ellipse class="il-grey il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="3.4"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="3.4"/><circle class="il-dark" cx="-5" cy="-17.6" r="1.5"/><circle class="il-dark" cx="3" cy="-17.6" r="1.5"/><path class="il-line il-thin" d="M-9 -18h18"/><path class="il-line" d="M-8 -24l6 2M8 -24l-6 2"/><path class="il-light il-thin" d="M-3 -10h6"/><g transform="translate(22 -24)"><rect class="il-wood il-ink il-thin" x="-2" y="-8" width="4" height="8" rx="1"/><rect class="il-red il-ink il-thin" x="-6" y="0" width="12" height="4" rx="1"/></g></g>
    <rect class="il-paper il-ink il-thin" x="92" y="22" width="16" height="36"/>
    <path class="il-line il-thin" opacity="0.5" d="M92 26h16M92 30h16M92 34h16M92 38h16M92 42h16M92 46h16M92 50h16M92 54h16"/>
    <rect class="il-paper il-ink il-thin" x="90" y="18" width="18" height="4" transform="rotate(-4 99 20)"/>
    <g transform="translate(140 60) rotate(-80)"><rect class="il-white il-ink il-thin" x="-6" y="-8.5" width="12" height="17" rx="2"/><rect class="il-blue" x="-4" y="-6.5" width="8" height="13" rx="1"/><path class="il-light il-thin" d="M-2 -3l4 6M2 -3l-4 6"/></g><g transform="translate(152 60) rotate(-96)"><rect class="il-white il-ink il-thin" x="-6" y="-8.5" width="12" height="17" rx="2"/><rect class="il-blue" x="-4" y="-6.5" width="8" height="13" rx="1"/><path class="il-light il-thin" d="M-2 -3l4 6M2 -3l-4 6"/></g>
    <path class="il-grass" d="M0 108h88v12H0z"/>
    <g transform="translate(48 70) scale(1.15 1.15)"><path class="il-line" d="M-13 -4l-12-8l-5-6M13 -4l12-8l5-6M-14 6l-14 0l-5 4M14 6l14 0l5 4M-8 16l-12 4l-3 6M8 16l12 4l3 6"/>
    <ellipse class="il-red il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <g class="il-dark"><circle cx="-7" cy="-2" r="3"/><circle cx="7" cy="-2" r="3"/><circle cx="-8" cy="11" r="3.2"/><circle cx="8" cy="11" r="3.2"/><circle cx="-3.5" cy="4" r="2"/><circle cx="3.5" cy="4" r="2"/></g>
    <path class="il-light il-thin" opacity="0.7" d="M-11 -4q1-4 4-6"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white" cx="-7" cy="-22" r="1.6"/><circle class="il-white" cx="7" cy="-22" r="1.6"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-17" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-17" r="3.6"/><circle class="il-dark" cx="-4" cy="-16.4" r="1.7"/><circle class="il-dark" cx="4" cy="-16.4" r="1.7"/>
    <path class="il-light il-thin" d="M-4 -11q4 4 8 0"/><g transform="translate(-30 -8) rotate(-20)"><rect class="il-paper il-ink il-thin" x="-5" y="-6.5" width="10" height="13" rx="0.8"/><path class="il-line il-thin" opacity="0.6" d="M-3 -3.5h6M-3 0.5h6M-3 4.5h3"/></g><g transform="translate(-30 10) rotate(-10)"><rect class="il-paper il-ink il-thin" x="-5" y="-6.5" width="10" height="13" rx="0.8"/><path class="il-line il-thin" opacity="0.6" d="M-3 -3.5h6M-3 0.5h6M-3 4.5h3"/></g><g transform="translate(-28 26)"><rect class="il-paper il-ink il-thin" x="-5" y="-6.5" width="10" height="13" rx="0.8"/><path class="il-line il-thin" opacity="0.6" d="M-3 -3.5h6M-3 0.5h6M-3 4.5h3"/></g><g transform="translate(30 -8) rotate(20)"><rect class="il-paper il-ink il-thin" x="-5" y="-6.5" width="10" height="13" rx="0.8"/><path class="il-line il-thin" opacity="0.6" d="M-3 -3.5h6M-3 0.5h6M-3 4.5h3"/></g><g transform="translate(30 10) rotate(10)"><rect class="il-paper il-ink il-thin" x="-5" y="-6.5" width="10" height="13" rx="0.8"/><path class="il-line il-thin" opacity="0.6" d="M-3 -3.5h6M-3 0.5h6M-3 4.5h3"/></g><g transform="translate(28 26)"><rect class="il-paper il-ink il-thin" x="-5" y="-6.5" width="10" height="13" rx="0.8"/><path class="il-line il-thin" opacity="0.6" d="M-3 -3.5h6M-3 0.5h6M-3 4.5h3"/></g></g>
    <path class="il-light il-thin" d="M14 30l-4-4M82 30l4-4"/>`,

  // Snow falls; a stern ant in a scarf stands at its snug anthill door with a laden wheelbarrow of supplies and holds out its leg, while a shivering green cricket with a fiddle under its arm sheepishly hands over two cards.
  'bg.winter-supplies': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" d="M8 10h4M10 8v4M34 24h4M36 22v4M60 8h4M62 6v4M90 18h4M92 16v4M118 6h4M120 4v4M148 20h4M150 18v4M18 46h4M20 44v4M74 40h4M76 38v4M138 46h4M140 44v4M48 60h4M50 58v4"/>
    <path class="il-white il-ink il-thin" d="M-2 96q40-6 80-2t84 0v28H-2z"/>
    <path class="il-earth il-ink" d="M104 98q10-56 34-56t28 56z"/>
    <path class="il-white il-ink il-thin" d="M120 56q18-20 34 0q-6 4-10 0-6 6-12 0-6 4-12 0z"/>
    <path class="il-wood-dark il-ink" d="M130 98V80a8 8 0 0 1 16 0v18z"/>
    <circle class="il-gold" cx="142" cy="90" r="1.4"/>
    <path class="il-glow" opacity="0.6" d="M114 70h8v8h-8z"/><path class="il-line il-thin" d="M114 70h8v8h-8zM118 70v8M114 74h8"/>
    <g transform="translate(84 92)"><path class="il-wood il-ink" d="M-12 -10h26l-4 10h-18z"/><circle class="il-dark il-ink" cx="-4" cy="3" r="3.4"/><path class="il-line il-thin" d="M14 -10l6-4"/><circle class="il-red il-ink il-thin" cx="-6" cy="-13" r="3.4"/><circle class="il-gold il-ink il-thin" cx="0" cy="-14" r="3.6"/><circle class="il-slime il-ink il-thin" cx="6" cy="-13" r="3"/><circle class="il-wood-dark il-ink il-thin" cx="2" cy="-18" r="2.6"/></g>
    <g transform="translate(114 72) scale(0.95 0.95)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-red il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-red il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-10 2l-6-2M5 -2l8 4l2 6"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-red il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-5.5" cy="-14" r="1.7"/><circle class="il-dark" cx="2.5" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-3 -6h6"/><path class="il-line" d="M-8 -20l6 2M8 -20l-6 2"/><path class="il-teal il-ink il-thin" d="M-7 -4q7 4 14 0v4q-7 4-14 0z"/><path class="il-teal il-ink il-thin" d="M4 -2l3 10h-4l-2-8z"/></g>
    <g transform="translate(40 66)">
    <path class="il-line" d="M4 20l-10 10l-6 0M10 18l12 14h4M2 8l-6 10"/>
    <ellipse class="il-green il-ink" cx="6" cy="12" rx="10" ry="16" transform="rotate(10 6 12)"/>
    <path class="il-line il-thin" opacity="0.5" d="M0 4q6 2 12 2M-1 12q6 2 13 2M0 20q6 1 10 1"/>
    <path class="il-green il-ink il-thin" d="M14 4q10 4 8 20l-4-2q0-10-6-14z"/>
    <path class="il-line il-thin" d="M-2 -16q-6-12-14-14M2 -18q2-10 10-14"/>
    <circle class="il-green il-ink" cx="0" cy="-8" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-1" cy="-10" r="3.6"/><circle class="il-white il-ink il-thin" cx="7" cy="-10" r="3.6"/>
    <circle class="il-dark" cx="0" cy="-9" r="1.6"/><circle class="il-dark" cx="8" cy="-9" r="1.6"/>
    <path class="il-line il-thin" d="M-4 -15l5 2M10 -15l-5 2"/>
    <path class="il-line il-thin" d="M0 -2q3-2 6 0"/>
    <circle class="il-water" opacity="0.8" cx="3" cy="-4" r="1.6"/>
    <path class="il-light il-thin" d="M-14 -6l-4 0M-14 0l-4 2M18 -14l3-3"/>
    <g transform="translate(-10 14) rotate(-30)"><path class="il-wood il-ink il-thin" d="M-5 -8a4 4 0 0 1 4 4a4 4 0 0 1 2 0a4 4 0 0 1 4-4a5 5 0 0 1 0 16a4 4 0 0 1-4-4h-2a4 4 0 0 1-4 4a5 5 0 0 1 0-16z"/><path class="il-wood-dark il-ink il-thin" d="M-1.6 -18h3.2v12h-3.2z"/><path class="il-line il-thin" d="M0 -6v12"/></g>
    <path class="il-line il-thin" d="M14 6l20 0"/>
    </g>
    <g transform="translate(76 62) rotate(-10)"><rect class="il-white il-ink il-thin" x="-6" y="-8.5" width="12" height="17" rx="2"/><rect class="il-blue" x="-4" y="-6.5" width="8" height="13" rx="1"/><path class="il-light il-thin" d="M-2 -3l4 6M2 -3l-4 6"/></g><g transform="translate(84 64) rotate(8)"><rect class="il-white il-ink il-thin" x="-6" y="-8.5" width="12" height="17" rx="2"/><rect class="il-blue" x="-4" y="-6.5" width="8" height="13" rx="1"/><path class="il-light il-thin" d="M-2 -3l4 6M2 -3l-4 6"/></g>
    <path class="il-light il-thin" d="M32 40l-3-4M54 40l3-4"/>`,

  // A smug sun in sunglasses blazes over cracked, parched earth; a wilted daisy droops and our beetle crawls along with its tongue hanging out, trying to squeeze into the thin shadow of a single grass blade.
  'bg.midday-sun': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-orange" opacity="0.35" x="0" y="0" width="160" height="120"/>
    <path class="il-yellow il-thick" d="M148 26L156 26M145.1 37L152 41M137 45.1L141 52M126 48L126 56M115 45.1L111 52M106.9 37L100 41M104 26L96 26M106.9 15L100 11M115 6.9L111 0M126 4L126 -4M137 6.9L141 0M145.1 15L152 11"/>
    <circle class="il-yellow il-ink" cx="126" cy="26" r="17"/>
    <path class="il-dark il-ink il-thin" d="M114 22h10q0 6-5 6t-5-6zM128 22h10q0 6-5 6t-5-6zM124 23h4"/>
    <path class="il-light il-thin" d="M116 24l3-2M130 24l3-2"/>
    <path class="il-line" d="M118 34q8 5 16 0"/>
    <path class="il-light" opacity="0.6" d="M14 54q4-4 8 0t8 0M60 46q4-4 8 0t8 0M88 60q4-4 8 0t8 0"/>
    <path class="il-earth il-ink il-thin" d="M-2 76h164v46H-2z"/>
    <path class="il-line il-thin" opacity="0.55" d="M10 90l10 6 4 10M24 96l12-2M60 104l8-8 12 2M68 96l2-8M110 92l10 8 14-2M120 100l-2 12M140 108l14-6M20 112l10 4"/>
    <g transform="translate(26 76)"><path class="il-green il-ink il-thin" d="M0 0q2-18 10-24"/><path class="il-green il-ink il-thin" d="M2 -10q-8-4-10 2 6 2 10-2z"/><g transform="translate(12 -22) rotate(110)"><g class="il-white il-ink il-thin"><ellipse cx="0" cy="-6" rx="2" ry="4"/><ellipse cx="0" cy="-6" rx="2" ry="4" transform="rotate(72)"/><ellipse cx="0" cy="-6" rx="2" ry="4" transform="rotate(144)"/><ellipse cx="0" cy="-6" rx="2" ry="4" transform="rotate(216)"/><ellipse cx="0" cy="-6" rx="2" ry="4" transform="rotate(288)"/></g><circle class="il-yellow il-ink il-thin" r="3"/></g></g>
    <path class="il-grass il-ink il-thin" d="M106 80q0-26 14-46q-6 22-6 46z"/>
    <g transform="translate(78 86)"><path class="il-line" d="M-14 6l-8 6h-4M-6 8l-4 8h-3M4 8l2 8h-3M12 6l8 6h4M-22 -2l-8-2M20 -6l8-4"/>
    <ellipse class="il-blue il-ink" cx="-2" cy="2" rx="22" ry="10"/>
    <path class="il-line il-thin" d="M-22 2h40"/>
    <path class="il-light il-thin" opacity="0.7" d="M-14 -4q8-3 16-3"/>
    <circle class="il-dark il-ink" cx="20" cy="-2" r="9"/>
    <path class="il-line il-thin" d="M22 -10q2-8 8-10M26 -8q6-4 12-4"/>
    <path class="il-white il-ink il-thin" d="M15 -5a3.4 3.4 0 0 1 6.8 0zM22 -5a3.4 3.4 0 0 1 6.8 0z"/>
    <circle class="il-dark" cx="18.6" cy="-6" r="1.2"/><circle class="il-dark" cx="25.6" cy="-6" r="1.2"/>
    <path class="il-dark il-ink il-thin" d="M18 2q4 2 8 0"/><path class="il-pink il-ink il-thin" d="M21 2.6v5q2 2 4 0v-5.4z"/>
    <path class="il-water il-ink il-thin" d="M10 -16c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/><path class="il-water il-ink il-thin" d="M30 -18c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/></g>
    <path class="il-dark" opacity="0.4" d="M108 80L50 83v3l58-4z"/>
    <path class="il-light il-thin" opacity="0.6" d="M40 92h-8M44 98h-10"/>`,

  // In a dark cellar corner the beetle gropes blindly with outstretched legs, its head and antennae wrapped in a tangle of cobweb, about to bump into a jar, while an apologetic little spider dangles from its thread above.
  'bg.cobweb-in-antennae': `
    <rect class="il-cave" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.12" d="M0 24h160M0 48h160M0 72h160M30 0v24M80 0v24M130 0v24M55 24v24M105 24v24M30 48v24M80 48v24M130 48v24"/>
    <path class="il-light il-thin" opacity="0.5" d="M0 0L46 0M0 0L44.8 10.2M0 0L41.4 20M0 0L36 28.7M0 0L28.7 36M0 0L20 41.4M0 0L10.2 44.8M12 0Q8.9 1 11.7 2.7Q8.5 3 10.8 5.2Q7.6 4.8 9.4 7.5Q6.3 6.4 7.5 9.4Q4.8 7.6 5.2 10.8Q3 8.5 2.7 11.7M22 0Q18.9 2.2 21.4 4.9Q17.9 6.3 19.8 9.5Q16.1 10.1 17.2 13.7Q13.4 13.5 13.7 17.2Q10.1 16.1 9.5 19.8Q6.2 17.9 4.9 21.4M32 0Q28.8 3.3 31.2 7.1Q27.4 9.6 28.8 13.9Q24.5 15.5 25 20Q20.5 20.6 20 25Q15.4 24.6 13.9 28.8Q9.5 27.4 7.1 31.2M42 0Q38.7 4.5 40.9 9.3Q36.8 13 37.8 18.2Q33 20.8 32.8 26.2Q27.5 27.6 26.2 32.8Q20.7 33.1 18.2 37.8Q12.8 36.8 9.3 40.9"/>
    <path class="il-earth-dark" d="M0 96h160v24H0z"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 96h160"/>
    <g transform="translate(138 96)"><rect class="il-water il-ink il-thin" opacity="0.8" x="-10" y="-24" width="20" height="24" rx="3"/><rect class="il-red il-ink il-thin" x="-11" y="-28" width="22" height="5" rx="1"/><rect class="il-orange" x="-7" y="-16" width="14" height="13"/><path class="il-light il-thin" d="M-7 -20v4"/></g>
    <path class="il-light il-thin" d="M108 0v34"/>
    <g transform="translate(108 40)"><path class="il-line il-thin" d="M-3 -1l-5-3l-1-3M-3 1l-6 1M-3 3l-5 4M3 -1l5-3l1-3M3 1l6 1M3 3l5 4"/><circle class="il-dark il-ink il-thin" r="5"/><circle class="il-white il-ink il-thin" cx="-1.8" cy="-1" r="1.6"/><circle class="il-white il-ink il-thin" cx="1.8" cy="-1" r="1.6"/><circle class="il-dark" cx="-1.6" cy="-0.4" r="0.7"/><circle class="il-dark" cx="2" cy="-0.4" r="0.7"/><path class="il-light il-thin" d="M-1.6 2.4q1.6-1 3.2 0"/></g>
    <path class="il-water il-ink il-thin" d="M117 32.2c0.9 1.4 1.4 2 1.4 2.6a1.4 1.4 0 0 1-2.9 0c0-0.6 0.5-1.3 1.4-2.6z"/>
    <g transform="translate(70 66) scale(1.2 1.2)"><path class="il-line" d="M-13 -4l-12-2l-8 2M13 -4l14-2l8 2M-14 6l-10 5M14 6l10 5M-8 16l-5 9h-3M8 16l3 10h3"/>
    <ellipse class="il-blue il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8 0-12q4 4-4 10M4 -25q2-6 8-6q-2 4-6 2"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="3.6"/><path class="il-line il-thin" d="M-6 -20l4 4M-2 -20l-4 4M2 -20l4 4M6 -20l-4 4"/><path class="il-light il-thin" d="M-3 -10q1.5-1.5 3 0t3 0"/><path class="il-light il-thin" opacity="0.9" d="M0 -19L14.3 -14.6M0 -19L7 -5.7M0 -19L-4.4 -4.7M0 -19L-13.3 -12M0 -19L-14.3 -23.4M0 -19L-7 -32.3M0 -19L4.4 -33.3M0 -19L13.3 -26M4.8 -17.5L2 -15.2L-1.5 -14.2L-3.8 -17L-4.8 -20.5L-2 -22.8L1.5 -23.8L3.8 -21L4.8 -17.5M9.1 -16.2L3.8 -11.9L-2.8 -9.9L-7.1 -15.2L-9.1 -21.8L-3.8 -26.1L2.8 -28.1L7.1 -22.8L9.1 -16.2M13.4 -14.9L5.6 -8.5L-4.1 -5.6L-10.5 -13.4L-13.4 -23.1L-5.6 -29.5L4.1 -32.4L10.5 -24.6L13.4 -14.9M-12 -28q-6-6-2-12M10 -28q6-4 4-10M-14 -10l-12 4M14 -10l12 4"/></g>
    <path class="il-light il-thin" d="M26 50l-4-2M24 58h-5M116 54l4-2M118 62h5"/>
    <path class="il-yellow il-ink il-thin" d="M100 16q0-6 6-6"/>`,

  // Inside the honeycomb, a sulky bee in a headscarf now holds a mop and a soapy bucket; its old guard cap lies on the floor, and three bees in the background raise their legs to show the hive has voted.
  'bg.new-job-in-hive': `
    <rect class="il-gold" x="0" y="0" width="160" height="120"/>
    <path class="il-yellow il-ink il-thin" d="M-11 0l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM-11 20.8l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM-11 41.6l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM-11 62.400000000000006l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM-11 83.2l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM-11 104l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM-11 124.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 10.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 31.200000000000003l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 52l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 72.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 93.60000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 114.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM7 135.20000000000002l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 0l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 20.8l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 41.6l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 62.400000000000006l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 83.2l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 104l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM25 124.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 10.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 31.200000000000003l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 52l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 72.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 93.60000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 114.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM43 135.20000000000002l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 0l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 20.8l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 41.6l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 62.400000000000006l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 83.2l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 104l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM61 124.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 10.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 31.200000000000003l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 52l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 72.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 93.60000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 114.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM79 135.20000000000002l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 0l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 20.8l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 41.6l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 62.400000000000006l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 83.2l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 104l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM97 124.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 10.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 31.200000000000003l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 52l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 72.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 93.60000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 114.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM115 135.20000000000002l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 0l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 20.8l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 41.6l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 62.400000000000006l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 83.2l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 104l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM133 124.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 10.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 31.200000000000003l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 52l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 72.80000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 93.60000000000001l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 114.4l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11zM151 135.20000000000002l5.5 -9.5h11l5.5 9.5l-5.5 9.5h-11z"/>
    <g class="il-orange" opacity="0.7"><path d="M11 10.4l3.5 -6.1h7l3.5 6.1l-3.5 6.1h-7z"/><path d="M137 52l3.5 -6.1h7l3.5 6.1l-3.5 6.1h-7z"/><path d="M119 20.8l3.5 -6.1h7l3.5 6.1l-3.5 6.1h-7z"/></g>
    <g transform="translate(22 54) scale(0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-14" cy="-14" rx="7" ry="11" transform="rotate(-35 -14 -14)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="14" cy="-14" rx="7" ry="11" transform="rotate(35 14 -14)"/>
    <path class="il-line" d="M-6 14l-2 10h-3M6 14l2 10h3M-11 6l-8 3M11 6l8 3"/>
    <ellipse class="il-yellow" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-dark" d="M-12.4 -1L12.4 -1L11.6 4L-11.6 4zM-11 9L11 9L9 13.6L-9 13.6z"/>
    <ellipse class="il-line" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-line" d="M-11 -2l-6-10l0-10M11 -2l8 6l2 6"/>
    <path class="il-line il-thin" d="M-4 -19q-3-8-8-9M4 -19q3-8 8-9"/>
    <circle class="il-dark" cx="-12" cy="-28" r="1.6"/><circle class="il-dark" cx="12" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="9.5"/>
    <circle class="il-white il-ink il-thin" cx="-3.8" cy="-13.5" r="3.4"/><circle class="il-white il-ink il-thin" cx="3.8" cy="-13.5" r="3.4"/>
    <circle class="il-dark" cx="-3.4" cy="-13" r="1.6"/><circle class="il-dark" cx="4.199999999999999" cy="-13" r="1.6"/>
    <path class="il-light il-thin" d="M-3 -7q3 2 6 0"/></g>
    <g transform="translate(42 44) scale(0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-14" cy="-14" rx="7" ry="11" transform="rotate(-35 -14 -14)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="14" cy="-14" rx="7" ry="11" transform="rotate(35 14 -14)"/>
    <path class="il-line" d="M-6 14l-2 10h-3M6 14l2 10h3M-11 6l-8 3M11 6l8 3"/>
    <ellipse class="il-yellow" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-dark" d="M-12.4 -1L12.4 -1L11.6 4L-11.6 4zM-11 9L11 9L9 13.6L-9 13.6z"/>
    <ellipse class="il-line" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-line" d="M-11 -2l-8 6l-2 6M11 -2l6-10l0-10"/>
    <path class="il-line il-thin" d="M-4 -19q-3-8-8-9M4 -19q3-8 8-9"/>
    <circle class="il-dark" cx="-12" cy="-28" r="1.6"/><circle class="il-dark" cx="12" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="9.5"/>
    <circle class="il-white il-ink il-thin" cx="-3.8" cy="-13.5" r="3.4"/><circle class="il-white il-ink il-thin" cx="3.8" cy="-13.5" r="3.4"/>
    <circle class="il-dark" cx="-3.4" cy="-13" r="1.6"/><circle class="il-dark" cx="4.199999999999999" cy="-13" r="1.6"/>
    <path class="il-light il-thin" d="M-3 -7q3 2 6 0"/></g>
    <g transform="translate(140 44) scale(0.55 0.55)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-14" cy="-14" rx="7" ry="11" transform="rotate(-35 -14 -14)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="14" cy="-14" rx="7" ry="11" transform="rotate(35 14 -14)"/>
    <path class="il-line" d="M-6 14l-2 10h-3M6 14l2 10h3M-11 6l-8 3M11 6l8 3"/>
    <ellipse class="il-yellow" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-dark" d="M-12.4 -1L12.4 -1L11.6 4L-11.6 4zM-11 9L11 9L9 13.6L-9 13.6z"/>
    <ellipse class="il-line" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-line" d="M-11 -2l-6-10l0-10M11 -2l6-10l0-10"/>
    <path class="il-line il-thin" d="M-4 -19q-3-8-8-9M4 -19q3-8 8-9"/>
    <circle class="il-dark" cx="-12" cy="-28" r="1.6"/><circle class="il-dark" cx="12" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="9.5"/>
    <circle class="il-white il-ink il-thin" cx="-3.8" cy="-13.5" r="3.4"/><circle class="il-white il-ink il-thin" cx="3.8" cy="-13.5" r="3.4"/>
    <circle class="il-dark" cx="-3.4" cy="-13" r="1.6"/><circle class="il-dark" cx="4.199999999999999" cy="-13" r="1.6"/>
    <path class="il-light il-thin" d="M-3 -7q3 2 6 0"/></g>
    <path class="il-wood-dark" d="M0 104h160v16H0z"/>
    <path class="il-line il-thin" opacity="0.4" d="M0 104h160"/>
    <path class="il-wood il-ink il-thin" d="M100 30l-28 76"/>
    <path class="il-white il-ink il-thin" d="M66 102q2-10 10-8 8 2 6 12l-4-2-2 4-3-4-3 4z"/>
    <g transform="translate(88 72) scale(1.25 1.25)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-14" cy="-14" rx="7" ry="11" transform="rotate(-35 -14 -14)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="14" cy="-14" rx="7" ry="11" transform="rotate(35 14 -14)"/>
    <path class="il-line" d="M-6 14l-2 10h-3M6 14l2 10h3M-11 6l-8 3M11 6l8 3"/>
    <ellipse class="il-yellow" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-dark" d="M-12.4 -1L12.4 -1L11.6 4L-11.6 4zM-11 9L11 9L9 13.6L-9 13.6z"/>
    <ellipse class="il-line" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-line" d="M-11 -2l-6 6l2 6M11 -2l2 6l-4 8"/>
    <path class="il-line il-thin" d="M-4 -19q-3-8-8-9M4 -19q3-8 8-9"/>
    <circle class="il-dark" cx="-12" cy="-28" r="1.6"/><circle class="il-dark" cx="12" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="9.5"/>
    <circle class="il-white il-ink il-thin" cx="-3.8" cy="-13.5" r="3.4"/><circle class="il-white il-ink il-thin" cx="3.8" cy="-13.5" r="3.4"/>
    <circle class="il-dark" cx="-3.8" cy="-12" r="1.6"/><circle class="il-dark" cx="3.8" cy="-12" r="1.6"/>
    <path class="il-line il-thin" d="M-7 -18l5 2M7 -18l-5 2"/><path class="il-light il-thin" d="M-3 -6q3-2 6 0"/><path class="il-red il-ink il-thin" d="M-10 -14q0-10 10-10t10 10q-10-4-20 0z"/><g class="il-white"><circle cx="-4" cy="-19" r="1"/><circle cx="3" cy="-20" r="1"/><circle cx="6" cy="-16" r="0.8"/></g><path class="il-red il-ink il-thin" d="M9 -16l6 2-4 3z"/></g>
    <g transform="translate(124 96)"><path class="il-metal il-ink" d="M-11 -14h22l-3 18h-16z"/><path class="il-line il-thin" d="M-11 -14q11-14 22 0"/><path class="il-white il-ink il-thin" d="M-9 -14a3 3 0 0 1 5-3a3 3 0 0 1 6 0a3 3 0 0 1 6 3z"/><circle class="il-white il-ink il-thin" cx="-4" cy="-24" r="2.4"/><circle class="il-white il-ink il-thin" cx="4" cy="-28" r="1.8"/></g>
    <g transform="translate(40 104) rotate(-12)"><path class="il-blue il-ink" d="M-10 0a10 9 0 0 1 20 0z"/><path class="il-blue il-ink il-thin" d="M-13 0h26v3h-26z"/><path class="il-gold il-ink il-thin" d="M0 -6l2 3h-4z"/></g>
    <path class="il-line il-thin" d="M30 96l-3-3M52 96l3-3"/>`,

  // Two cocoons hang from a branch: from one a pretty butterfly emerges as expected, but out of the other drops a baffled round hedgehog with butterfly wings, surrounded by question marks.
  'bg.wrong-cocoon': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-wood-dark il-ink" d="M-2 12q60-6 164 2v6q-100-6-164 0z"/>
    <path class="il-green il-ink il-thin" d="M18 14q6-10 14-6-6 8-14 6zM140 16q4 10-4 12-2-8 4-12z"/>
    <path class="il-line il-thin" d="M36 16v6M110 18v6"/>
    <g transform="translate(36 38)"><path class="il-paper il-ink" d="M0 -16q12 0 12 16t-12 18q-12-2-12-18t12-16z"/><path class="il-line il-thin" opacity="0.5" d="M-10 -6l20 6M-11 4l22 4M-8 -12l16 4"/></g>
    <g transform="translate(36 70)"><path class="il-line il-thin" d="M0 -12q-2-4-6-6M0 -12q2-4 6-6"/><ellipse class="il-purple il-ink il-thin" cx="-9" cy="-4" rx="9" ry="7"/><ellipse class="il-purple il-ink il-thin" cx="9" cy="-4" rx="9" ry="7"/><ellipse class="il-pink il-ink il-thin" cx="-7" cy="7" rx="6" ry="5"/><ellipse class="il-pink il-ink il-thin" cx="7" cy="7" rx="6" ry="5"/><g class="il-yellow"><circle cx="-10" cy="-4" r="2"/><circle cx="10" cy="-4" r="2"/></g><ellipse class="il-dark il-ink il-thin" cx="0" cy="0" rx="2.4" ry="10"/><circle class="il-white" cx="-1" cy="-7" r="0.8"/><circle class="il-white" cx="1" cy="-7" r="0.8"/></g>
    <g transform="translate(110 40)"><path class="il-paper il-ink" d="M0 -16q14 0 14 14l-4 6-4-4-6 6-6-6-4 4-4-6q0-14 14-14z"/><path class="il-line il-thin" opacity="0.5" d="M-12 -4l24 4M-10 -10l20 4"/></g>
    <path class="il-light il-thin" d="M110 50v4M102 52l-2 3M118 52l2 3"/>
    <g transform="translate(106 84)">
    <ellipse class="il-purple il-ink" cx="-22" cy="-12" rx="16" ry="11" transform="rotate(-25 -22 -12)"/>
    <ellipse class="il-blue il-ink" cx="22" cy="-12" rx="16" ry="11" transform="rotate(25 22 -12)"/>
    <ellipse class="il-pink il-ink il-thin" cx="-18" cy="6" rx="9" ry="7"/><ellipse class="il-teal il-ink il-thin" cx="18" cy="6" rx="9" ry="7"/>
    <g class="il-yellow il-ink il-thin"><circle cx="-24" cy="-14" r="3.4"/><circle cx="24" cy="-14" r="3.4"/><circle cx="-18" cy="6" r="2"/><circle cx="18" cy="6" r="2"/></g>
    <path class="il-wood-dark il-ink" d="M-20 4l-4-6 5-3-3-7 6-2 0-7 7 1 3-6 6 4 6-4 3 6 7-1 0 7 6 2-3 7 5 3-4 6 3 6-6 2 1 6-7-1q-12 6-26 0l-7 1 1-6-6-2z"/>
    <path class="il-wood il-ink" d="M-14 6q0-14 14-14t14 14q0 12-14 12t-14-12z"/>
    <circle class="il-white il-ink il-thin" cx="-5" cy="2" r="3.6"/><circle class="il-white il-ink il-thin" cx="5" cy="2" r="3.6"/>
    <circle class="il-dark" cx="-5.6" cy="1" r="1.6"/><circle class="il-dark" cx="4.4" cy="1" r="1.6"/>
    <path class="il-line il-thin" d="M-9 -4l6 2M9 -2l-6-1"/>
    <ellipse class="il-dark" cx="0" cy="9" rx="2.6" ry="2"/>
    <path class="il-line il-thin" d="M-3 13q3-1.4 6 0"/>
    <path class="il-wood il-ink il-thin" d="M-8 17l-2 4M8 17l2 4"/>
    </g>
    <path class="il-yellow il-ink il-thin" d="M140 52q0-6 6-6t6 5-5 5v4h-3v-6q5-1 5-4t-3-3-3 3z"/><circle class="il-yellow il-ink il-thin" cx="146.5" cy="65" r="1.6"/>
    <path class="il-yellow il-ink il-thin" d="M66 62q0-5 5-5t5 4-4 4v3h-2.4v-5q4-1 4-3t-2.6-2.4-2.6 2.4z"/><circle class="il-yellow il-ink il-thin" cx="71.2" cy="73" r="1.3"/>
    <path class="il-grass" d="M0 112h160v8H0z"/><path class="il-grass il-ink il-thin" d="M0 113l3 -4 3 4M10 113l3 -5 3 5M20 113l3 -6 3 6M30 113l3 -4 3 4M40 113l3 -5 3 5M50 113l3 -6 3 6M60 113l3 -4 3 4M70 113l3 -5 3 5M80 113l3 -6 3 6M90 113l3 -4 3 4M100 113l3 -5 3 5M110 113l3 -6 3 6M120 113l3 -4 3 4M130 113l3 -5 3 5M140 113l3 -6 3 6M150 113l3 -4 3 4"/>`,

  // Underground, a stern red worker ant in a yellow hard hat holds a spirit level against a wobbly worm tunnel and frowns; next to it runs its own dead-straight tunnel with neat wooden props, and a worm peeks sheepishly out of its crooked one.
  'bg.worker-ant': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 16h160v104H0z"/>
    <path class="il-earth-dark" d="M0 98q20-5 40 0t40 0 40 0 40 0V120H0z"/>
    <path class="il-grass il-ink il-thin" d="M-2 13h164v6H-2z"/>
    <path class="il-grass il-ink il-thin" d="M2 14l2.6999999999999997 -7 2.6999999999999997 7M11 14l2.6999999999999997 -7 2.6999999999999997 7M20 14l2.6999999999999997 -7 2.6999999999999997 7M29 14l2.6999999999999997 -7 2.6999999999999997 7M38 14l2.6999999999999997 -7 2.6999999999999997 7M47 14l2.6999999999999997 -7 2.6999999999999997 7M56 14l2.6999999999999997 -7 2.6999999999999997 7M65 14l2.6999999999999997 -7 2.6999999999999997 7M74 14l2.6999999999999997 -7 2.6999999999999997 7M83 14l2.6999999999999997 -7 2.6999999999999997 7M92 14l2.6999999999999997 -7 2.6999999999999997 7M101 14l2.6999999999999997 -7 2.6999999999999997 7M110 14l2.6999999999999997 -7 2.6999999999999997 7M119 14l2.6999999999999997 -7 2.6999999999999997 7M128 14l2.6999999999999997 -7 2.6999999999999997 7M137 14l2.6999999999999997 -7 2.6999999999999997 7M146 14l2.6999999999999997 -7 2.6999999999999997 7M155 14l2.6999999999999997 -7 2.6999999999999997 7"/>
    <g class="il-earth-dark"><circle cx="20" cy="34" r="1.4"/><circle cx="150" cy="40" r="1.4"/><circle cx="60" cy="30" r="1.4"/><circle cx="140" cy="100" r="1.4"/></g>
    <path class="il-earth-dark il-ink il-thin" d="M4 44h76v18H4z"/>
    <path class="il-wood il-ink il-thin" d="M10 44v18M30 44v18M50 44v18M70 44v18M6 44h72"/>
    <path class="il-earth-dark il-ink il-thin" d="M84 70q8-12 18-4t16-6 16 8 30-4v20q-16 6-30 2t-16 6-18-2-16 4z"/>
    <path class="il-pink il-ink" d="M149.6 77.6L148.7 77.6L147.1 77.3L145.4 76.8L143.9 76.1L142.2 75.4L140.5 74.9L138.7 74.3L136.8 73.6L134.9 72.9L132.8 72.2L130.6 71.6L128.2 71.2L125.6 71.1L122.8 71.5L121.6 71.8C116.7 73.4 119.1 81 124.1 79.5L124.8 79.2L125.9 79.1L127.3 79.1L128.8 79.4L130.5 79.8L132.2 80.4L134.1 81.1L136 81.8L137.9 82.5L140 83.1L142.3 83.4L144.6 83.4L147 83.2L149.3 82.7L150.4 82.4C153.5 81.9 152.7 77.1 149.6 77.6z"/><path class="il-line il-thin" opacity="0.55" d="M147 78.1Q145 80.2 147 82.4M142 76.2Q139.2 78.7 140.2 82.4M136.6 74.3Q133.6 76.6 134.3 80.3M130.5 72.4Q127.8 75 129 78.6"/><path class="il-light il-thin" opacity="0.5" d="M140.7 77.3L138.8 76.7L137 76L135.1 75.3L133.2 74.6L131.2 74"/><circle class="il-pink il-ink" cx="114" cy="74" r="7.5"/><path class="il-light il-thin" opacity="0.6" d="M109.5 70.6a5.6 5.6 0 0 1 3.8-2.6"/><circle class="il-white il-ink il-thin" cx="111.3" cy="73.1" r="2.3"/><circle class="il-dark" cx="110.3" cy="73.1" r="1.1"/><circle class="il-white il-ink il-thin" cx="116.7" cy="73.1" r="2.3"/><circle class="il-dark" cx="115.7" cy="73.1" r="1.1"/><path class="il-line il-thin" d="M108 68l4 1M116 69l4-1"/><ellipse class="il-red" opacity="0.35" cx="109.5" cy="76.3" rx="1.3" ry="0.9"/><ellipse class="il-red" opacity="0.35" cx="118.5" cy="76.3" rx="1.3" ry="0.9"/><path class="il-line il-thin" d="M111.8 77.8q2.3 -1.9 4.5 0"/>
    <path class="il-earth-dark" d="M0 98q40-4 80 0t80 0v22H0z"/>
    <path class="il-earth-dark il-ink il-thin" d="M4 98h96v6H4z"/>
    <g transform="translate(54 70) scale(1.1 1.1)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-red il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-red il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-10 6l-6-4M5 -2l12 2l8-6"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-red il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-2.5" cy="-14" r="1.7"/><circle class="il-dark" cx="5.5" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-2 -7q3-1.4 6 0"/><path class="il-line" d="M-8 -20l7 3M2 -18l7-1"/><path class="il-yellow il-ink" d="M-9.450000000000001 -19a9.450000000000001 8.4 0 0 1 18.900000000000002 0z"/><rect class="il-yellow il-ink" x="-12.600000000000001" y="-20.575" width="25.200000000000003" height="3.1500000000000004" rx="1"/><path class="il-line il-thin" d="M0 -27.4v7.3500000000000005"/></g>
    <g transform="translate(90 58) rotate(-24)"><rect class="il-green il-ink" x="-16" y="-3.4" width="32" height="6.8" rx="1.4"/><rect class="il-slime il-ink il-thin" x="-4" y="-2" width="8" height="4" rx="2"/><circle class="il-white" cx="2" cy="0" r="1.2"/></g>
    <path class="il-yellow il-ink il-thin" d="M102 30l3 0-.8 9h-1.4zM102.2 41h2.6v2.6h-2.6z"/>
    <path class="il-yellow il-ink il-thin" d="M108 30l3 0-.8 9h-1.4zM108.2 41h2.6v2.6h-2.6z"/>
    <ellipse class="il-stone il-ink il-thin" cx="130" cy="104" rx="6" ry="4"/><ellipse class="il-stone il-ink il-thin" cx="150" cy="30" rx="4" ry="3"/>`,

  // A big, fluffy, perfectly round bumblebee flies happily on tiny buzzing wings above the flowers; two little ants ride in its yellow pollen baskets and wave, while a snail below stares up in disbelief.
  'bg.bumblebee': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M17.4 24.5a4.5 4.5 0 0 1 2.7-8.1a6.3 6.3 0 0 1 11.7-2.7a5.4 5.4 0 0 1 9 4.5a3.6 3.6 0 0 1 1.8 6.3z"/><path class="il-white" d="M130.2 17.5a3.5 3.5 0 0 1 2.1-6.3a4.9 4.9 0 0 1 9.1-2.1a4.2 4.2 0 0 1 7 3.5a2.8 2.8 0 0 1 1.4 4.9z"/>
    <path class="il-grass" d="M0 94h160v26H0z"/><path class="il-grass il-ink il-thin" d="M0 95l2.6999999999999997 -5 2.6999999999999997 5M9 95l2.6999999999999997 -5 2.6999999999999997 5M18 95l2.6999999999999997 -5 2.6999999999999997 5M27 95l2.6999999999999997 -5 2.6999999999999997 5M36 95l2.6999999999999997 -5 2.6999999999999997 5M45 95l2.6999999999999997 -5 2.6999999999999997 5M54 95l2.6999999999999997 -5 2.6999999999999997 5M63 95l2.6999999999999997 -5 2.6999999999999997 5M72 95l2.6999999999999997 -5 2.6999999999999997 5M81 95l2.6999999999999997 -5 2.6999999999999997 5M90 95l2.6999999999999997 -5 2.6999999999999997 5M99 95l2.6999999999999997 -5 2.6999999999999997 5M108 95l2.6999999999999997 -5 2.6999999999999997 5M117 95l2.6999999999999997 -5 2.6999999999999997 5M126 95l2.6999999999999997 -5 2.6999999999999997 5M135 95l2.6999999999999997 -5 2.6999999999999997 5M144 95l2.6999999999999997 -5 2.6999999999999997 5M153 95l2.6999999999999997 -5 2.6999999999999997 5"/>
    <g transform="translate(22 96)"><path class="il-green il-ink il-thin" d="M0 0q-2-10 0-18"/><path class="il-red il-ink il-thin" d="M-6 -24q0 8 6 8t6-8l-3 3-3-5-3 5z"/></g>
    <g transform="translate(138 98)"><path class="il-green il-ink il-thin" d="M0 0q2-8 0-14"/><g class="il-white il-ink il-thin"><ellipse cx="0" cy="-20" rx="2" ry="4"/><ellipse cx="0" cy="-20" rx="2" ry="4" transform="rotate(72 0 -16)"/><ellipse cx="0" cy="-20" rx="2" ry="4" transform="rotate(144 0 -16)"/><ellipse cx="0" cy="-20" rx="2" ry="4" transform="rotate(216 0 -16)"/><ellipse cx="0" cy="-20" rx="2" ry="4" transform="rotate(288 0 -16)"/></g><circle class="il-yellow il-ink il-thin" cx="0" cy="-16" r="3"/></g>
    <g transform="translate(108 104)"><path class="il-stone il-ink il-thin" d="M-12 4q0-4 6-4h14q6 0 8 4z"/><circle class="il-orange il-ink il-thin" cx="-2" cy="-4" r="7"/><path class="il-line il-thin" d="M-2 -4a3 3 0 1 1 3 3"/><path class="il-line il-thin" d="M10 0l2-6M13 0l3-5"/><circle class="il-white il-ink il-thin" cx="12" cy="-7" r="1.6"/><circle class="il-white il-ink il-thin" cx="16" cy="-6" r="1.6"/><circle class="il-dark" cx="11.6" cy="-7.6" r="0.7"/><circle class="il-dark" cx="15.6" cy="-6.6" r="0.7"/><path class="il-yellow il-ink il-thin" d="M18 -16l2.4 0-.6 7h-1.2zM18.2 -7.6h2v2h-2z"/></g>
    <path class="il-light il-thin" d="M62 22q4-4 8 0M90 22q4-4 8 0M58 16q8-8 16 0M86 16q8-8 16 0"/>
    <g transform="translate(78 56) scale(2.1 2.1)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-4" cy="-16" rx="4" ry="6" transform="rotate(-25 -4 -16)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="4" cy="-16" rx="3.6" ry="5.6" transform="rotate(20 4 -16)"/>
    <path class="il-line il-thin" d="M-7 10l-3 6M0 12v6M7 10l3 6"/>
    <circle class="il-gold il-ink il-thin" cx="-11" cy="16" r="3.6"/><circle class="il-gold il-ink il-thin" cx="11" cy="16" r="3.6"/>
    <ellipse class="il-yellow" cx="0" cy="0" rx="15" ry="14"/>
    <path class="il-dark" d="M-10 -10.5L-6 -12.6V12.6L-10 10.5zM-1 -14L3 -13.7V13.7L-1 14z"/>
    <ellipse class="il-line" cx="0" cy="0" rx="15" ry="14"/>
    <path class="il-line il-thin" d="M-12 -8l-1.4-2 2.4-.6-1-2.4 2.6 0M-4 -13.6l1-2.4 1.4 2 1.4-2.4 1.2 2.4M12 -8l1.4-2-2.4-.6 1-2.4-2.6 0M-14 4l-2.4.6 1.4 2M14 4l2.4.6-1.4 2"/>
    <path class="il-light il-thin" opacity="0.7" d="M-11 -4q1-4 4-6"/>
    <path class="il-dark il-ink il-thin" d="M-15 1l-3 1 3 1z"/>
    <circle class="il-dark il-ink" cx="14" cy="-2" r="7.5"/>
    <path class="il-line il-thin" d="M13 -9q0-6 4-8M16 -9q3-5 7-5"/>
    <circle class="il-white il-ink il-thin" cx="16.5" cy="-4" r="3.2"/><circle class="il-dark" cx="17.4" cy="-4.4" r="1.6"/>
    <path class="il-light il-thin" d="M15 1.4q2.5 2 5 0"/>
    <ellipse class="il-pink" opacity="0.5" cx="11" cy="1" rx="1.6" ry="1"/></g>
    <g transform="translate(55 82) scale(0.42 0.42)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-dark il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-dark il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-6-10l0-8M5 -2l8 6l2 6"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-4" cy="-14" r="1.7"/><circle class="il-dark" cx="4" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-3 -7q3 2 6 0"/></g>
    <g transform="translate(101 82) scale(0.42 0.42)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-red il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-red il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-8 6l-2 6M5 -2l6-10l0-8"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-red il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-4" cy="-14" r="1.7"/><circle class="il-dark" cx="4" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-3 -7q3 2 6 0"/></g>`,

  // A blissful worm in a red-and-white striped knitted scarf lounges in a warm, steaming compost heap among an apple core, eggshells and a tea bag; a ladybird takes a deep, happy sniff of the fine humus.
  'bg.compost-worm': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M118.8 20a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass" d="M0 100h160v20H0z"/>
    <path class="il-earth-dark il-ink" d="M10 104q4-50 70-56t72 56z"/>
    <path class="il-wood il-ink" d="M2 60h10v52H2zM148 60h10v52h-10z"/>
    <path class="il-wood il-ink il-thin" d="M0 70h14v6H0zM0 92h14v6H0zM146 70h14v6h-14zM146 92h14v6h-14z"/>
    <path class="il-smoke" opacity="0.7" d="M60 40q-6-6 0-12t0-12M80 36q-6-6 0-12t0-12M100 40q-6-6 0-12t0-12"/>
    <path class="il-light il-thin" opacity="0.6" d="M60 40q-6-6 0-12t0-12M80 36q-6-6 0-12t0-12M100 40q-6-6 0-12t0-12"/>
    <g transform="translate(36 70) rotate(-20)"><path class="il-paper il-ink il-thin" d="M-4 -8h8q-2 8 0 16h-8q2-8 0-16z"/><path class="il-red il-ink il-thin" d="M-5 -10q5-3 10 0l-1 3h-8zM-5 10q5 3 10 0l-1-3h-8z"/><path class="il-wood-dark" d="M-1 -10h2v-3h-2z"/></g>
    <path class="il-white il-ink il-thin" d="M118 64l4-4 3 3 3-4 3 4 2-2v6q-8 4-15 0z"/>
    <path class="il-white il-ink il-thin" d="M126 82l3-3 2 3 3-3 2 3v4q-5 3-10 0z"/>
    <g transform="translate(108 90) rotate(10)"><rect class="il-paper il-ink il-thin" x="-5" y="-5" width="10" height="10" rx="1"/><path class="il-line il-thin" d="M0 -5q-2-6 3-10"/><rect class="il-red il-ink il-thin" x="1" y="-18" width="5" height="4"/></g>
    <path class="il-green il-ink il-thin" d="M46 92q8-8 16-2-8 8-16 2zM96 58q10-4 14 4-10 2-14-4z"/>
    <g class="il-wood"><circle cx="30" cy="94" r="1.4"/><circle cx="60" cy="62" r="1.4"/><circle cx="130" cy="96" r="1.4"/><circle cx="92" cy="98" r="1.2"/></g>
    <path class="il-pink il-ink" d="M36.9 83L37.1 84.1L37.9 86.4L38.9 88.6L40.3 90.7L41.9 92.7L43.7 94.4L45.7 95.9L47.9 97.2L50.2 98.2L52.6 99L55 99.5L57.6 99.7L60.2 99.6L62.7 99.1L65.3 98.4L67.8 97.3L70.2 95.8L72.4 93.8L74.3 91.5L75.4 89.6L76.2 88.5L77.1 87.4L78.1 86.4L79.3 85.6L80.5 84.8L81.8 84.2L83.2 83.7L84.6 83.4L86.1 83.2L87.5 83.1L88.9 83.2L90.2 83.4L91.5 83.8L92.6 84.3L93.6 84.9L94.4 85.7L95.2 86.7L95.2 86.7C99.4 92.5 108.3 86 104.1 80.2L103.3 79.2L101.3 77.1L99.1 75.4L96.6 74L94 73.1L91.5 72.4L88.8 72.1L86.3 72.1L83.7 72.4L81.2 72.9L78.8 73.6L76.5 74.6L74.2 75.8L72.1 77.2L70.1 78.9L68.3 80.7L66.7 82.8L65.5 84.8L64.8 85.8L64.1 86.6L63.2 87.2L62.1 87.8L60.9 88.3L59.6 88.6L58.2 88.7L56.8 88.7L55.3 88.8L53.8 88.7L52.3 88.5L50.9 88.1L49.5 87.5L48.1 86.8L46.9 86L45.8 85L44.8 83.8L43.9 82.5L43.1 81L43.1 81C41.8 76.9 35.5 78.9 36.9 83z"/><path class="il-line il-thin" opacity="0.55" d="M38.6 86Q42 86.6 43.6 83.5M42.4 92.1Q46.2 90.9 47 87M48.2 96.4Q51.6 93.5 51.3 89M55.1 98.7Q57.5 94.3 56 89.6M62.6 98.4Q63.5 93.3 60.5 89.2M69.7 95.1Q68.6 90.1 64.1 87.6M74.7 89.2Q71.7 85 66.7 84.3M77.6 85.8Q76.1 80.9 71.6 78.6M81.5 83.5Q81.6 78.4 77.9 74.8M86 82.4Q87.5 77.5 85.1 73M90.4 82.6Q93.4 78.5 92.6 73.5M94.1 84.3Q98.5 81.8 99.7 76.8"/><path class="il-light il-thin" opacity="0.5" d="M59.8 96.5L62.1 96.1L64.3 95.5L66.4 94.5L68.4 93.3L70.2 91.7L71.7 89.8L72.8 88L73.8 86.6L74.9 85.3L76.2 84.1L77.6 83L79.1 82.1L80.6 81.4L82.3 80.8L84 80.4"/><g transform="translate(100 83) rotate(-30)"><rect class="il-red il-ink" x="-10" y="-4" width="20" height="8" rx="3"/><path class="il-white il-thin" d="M-5 -4v8M0 -4v8M5 -4v8"/></g><path class="il-red il-ink il-thin" d="M92 86l-6 10 5 2 4-9z"/><path class="il-white il-thin" d="M89 90l4 2M87 94l4 2"/><circle class="il-pink il-ink" cx="104" cy="74" r="10"/><path class="il-light il-thin" opacity="0.6" d="M98 69.5a7.5 7.5 0 0 1 5-3.5"/><path class="il-line il-thin" d="M97.4 72.8q3 3 6 0M104.6 72.8q3 3 6 0"/><ellipse class="il-red" opacity="0.35" cx="98" cy="77" rx="1.8" ry="1.2"/><ellipse class="il-red" opacity="0.35" cx="110" cy="77" rx="1.8" ry="1.2"/><path class="il-line il-thin" d="M100.2 77q3.8 3.8 7.6 0"/>
    <path class="il-light il-thin" d="M114 64l4-2M116 70h4"/>
    <g transform="translate(26 78) scale(0.6 0.6)"><path class="il-line" d="M-13 -4l-8 4l-2 6M13 -4l8 4l2 6M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/>
    <ellipse class="il-red il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <g class="il-dark"><circle cx="-7" cy="-2" r="3"/><circle cx="7" cy="-2" r="3"/><circle cx="-8" cy="11" r="3.2"/><circle cx="8" cy="11" r="3.2"/><circle cx="-3.5" cy="4" r="2"/><circle cx="3.5" cy="4" r="2"/></g>
    <path class="il-light il-thin" opacity="0.7" d="M-11 -4q1-4 4-6"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white" cx="-7" cy="-22" r="1.6"/><circle class="il-white" cx="7" cy="-22" r="1.6"/>
    <path class="il-light il-thin" d="M-7 -17q3-3 6 0M1 -17q3-3 6 0"/>
    <ellipse class="il-white il-ink il-thin" cx="0" cy="-10" rx="1.6" ry="1.2"/></g>
    <path class="il-pink il-ink il-thin" d="M40 52.1c-3.5-2.1-3.5-5.6 0-4.2c3.5-1.4 3.5 2.1 0 4.2z"/><path class="il-pink il-ink il-thin" d="M48 43.5c-2.5-1.5-2.5-4 0-3c2.5-1 2.5 1.5 0 3z"/>
    <path class="il-light il-thin" d="M30 60q4-4 8-2M33 64q5-3 9 0"/>`,

  // In a cosy underground den, a well-read earthworm in round glasses lies curled up reading a book propped on a pebble, with a tiny bookshelf and a cup of tea; up in the grass a flashy beetle in sunglasses struts past and the worm gives it a sceptical sideways look.
  'bg.earthworm': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-earth" d="M0 26h160v94H0z"/>
    <path class="il-earth-dark" d="M0 104q20-5 40 0t40 0 40 0 40 0V120H0z"/>
    <path class="il-grass il-ink il-thin" d="M-2 23h164v6H-2z"/>
    <path class="il-grass il-ink il-thin" d="M2 24l2.6999999999999997 -7 2.6999999999999997 7M11 24l2.6999999999999997 -7 2.6999999999999997 7M20 24l2.6999999999999997 -7 2.6999999999999997 7M29 24l2.6999999999999997 -7 2.6999999999999997 7M38 24l2.6999999999999997 -7 2.6999999999999997 7M47 24l2.6999999999999997 -7 2.6999999999999997 7M56 24l2.6999999999999997 -7 2.6999999999999997 7M65 24l2.6999999999999997 -7 2.6999999999999997 7M74 24l2.6999999999999997 -7 2.6999999999999997 7M83 24l2.6999999999999997 -7 2.6999999999999997 7M92 24l2.6999999999999997 -7 2.6999999999999997 7M101 24l2.6999999999999997 -7 2.6999999999999997 7M110 24l2.6999999999999997 -7 2.6999999999999997 7M119 24l2.6999999999999997 -7 2.6999999999999997 7M128 24l2.6999999999999997 -7 2.6999999999999997 7M137 24l2.6999999999999997 -7 2.6999999999999997 7M146 24l2.6999999999999997 -7 2.6999999999999997 7M155 24l2.6999999999999997 -7 2.6999999999999997 7"/>
    <g class="il-earth-dark"><circle cx="10" cy="46" r="1.4"/><circle cx="150" cy="50" r="1.4"/><circle cx="140" cy="100" r="1.4"/><circle cx="20" cy="100" r="1.4"/><circle cx="80" cy="40" r="1.4"/></g>
    <g transform="translate(118 18) scale(0.55 0.55)"><path class="il-line" d="M-13 -4l-9 6l-2 6M13 -4l9-6l4-4M-14 6l-10 5M14 6l10 5M-8 16l-3 8h-3M8 16l3 8h3"/>
    <ellipse class="il-purple il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <path class="il-dark il-ink il-thin" d="M-9 -20h18v3q-2 4-6 2l-3-2-3 2q-4 2-6-2z"/><path class="il-light il-thin" d="M-4 -11q4 3 8 0"/><path class="il-gold il-ink il-thin" d="M-8 -6q8 6 16 0"/></g>
    <path class="il-glow" d="M140 5q0.6 2.4 3 3q-2.4 0.6 -3 3q-0.6 -2.4 -3 -3q2.4 -0.6 3 -3z"/><path class="il-glow" d="M98 7.6q0.5 1.9 2.4 2.4q-1.9 0.5 -2.4 2.4q-0.5 -1.9 -2.4 -2.4q1.9 -0.5 2.4 -2.4z"/>
    <path class="il-earth-dark il-ink" d="M10 76q0-30 70-30t72 30q0 24-72 24t-70-24z"/>
    <path class="il-wood il-ink il-thin" d="M18 66h26v3H18z"/>
    <g class="il-ink il-thin"><rect class="il-red" x="20" y="56" width="4" height="10"/><rect class="il-blue" x="24" y="54" width="4" height="12"/><rect class="il-green" x="28" y="57" width="4" height="9"/><rect class="il-gold" x="33" y="58" width="4" height="8" transform="rotate(14 35 62)"/></g>
    <path class="il-line il-thin" d="M120 46q4 6 0 10"/>
    <circle class="il-torch" cx="120" cy="60" r="10"/><circle class="il-glow il-ink il-thin" cx="120" cy="60" r="3.6"/>
    <path class="il-pink il-ink" d="M109 93.2L110 93.5L112.1 94.3L114.3 94.9L116.6 95.3L118.9 95.6L121.4 95.6L123.9 95.3L126.6 94.5L129.3 93.2L131.9 90.8L133.7 86.7L133.1 81.9L130.7 78.4L127.8 76.6L125.2 75.5L122.6 74.9L120.2 74.5L117.8 74.3L115.4 74.3L113.1 74.5L110.9 74.7L108.7 75.1L106.5 75.5L104.5 76L102.4 76.5L100.4 77L98.4 77.6L96.5 78.1L94.6 78.7L92.7 79.2L90.8 79.8L88.9 80.3L87.1 80.7L85.3 81.1L83.5 81.5L81.7 81.7L80.1 81.9L78.4 82L76.8 82L75.3 81.8L73.9 81.5L72.5 81.1L72.5 81.1C65.7 78.7 62.1 89.1 68.8 91.4L69.9 91.8L72.4 92.5L74.9 92.9L77.4 93L79.8 93L82.1 92.8L84.3 92.5L86.5 92.1L88.6 91.7L90.7 91.2L92.7 90.6L94.7 90.1L96.7 89.5L98.6 89L100.5 88.4L102.4 87.9L104.2 87.4L106.1 86.9L107.9 86.5L109.7 86.1L111.5 85.8L113.2 85.5L114.9 85.4L116.6 85.3L118.2 85.4L119.8 85.5L121.2 85.8L122.4 86.2L123.2 86.6L123.5 86.6L123.4 85.9L123.6 85.1L123.7 85.2L123.2 85.8L122.3 86.4L121 86.9L119.5 87.3L117.9 87.5L116.3 87.5L114.6 87.4L112.8 87.2L111 86.8L111 86.8C106.9 85.6 104.9 91.9 109 93.2z"/><path class="il-line il-thin" opacity="0.55" d="M112.3 93.5Q114.8 91.3 113.5 88.1M118.9 94.8Q120.8 91.4 118.8 88.2M126.2 93.8Q126.5 89.5 123.1 86.8M132.9 86.6Q128.8 84.1 124.3 85.5M127.5 77.3Q123.6 80.6 123.3 85.7M120.1 75.3Q117.6 79.7 119.1 84.6M113.2 75.3Q111.6 80.1 114 84.6M106.7 76.3Q105.7 81.3 108.7 85.5M100.6 77.8Q99.9 82.8 103.1 86.9M94.8 79.5Q94.2 84.5 97.4 88.5M89.1 81Q88.4 86.1 91.5 90.1M83.6 82.3Q82.5 87.2 85.3 91.5M78.4 82.8Q76.5 87.5 78.6 92.2M73.7 82.3Q70.6 86.4 71.4 91.4"/><path class="il-light il-thin" opacity="0.5" d="M124.2 78.4L122 77.9L119.9 77.6L117.7 77.4L115.5 77.4L113.4 77.5L111.3 77.8L109.2 78.1L107.2 78.5L105.2 79L103.2 79.5L101.2 80L99.3 80.5L97.3 81.1L95.4 81.6L93.5 82.2L91.6 82.7L89.7 83.2"/><circle class="il-pink il-ink" cx="62" cy="76" r="10.5"/><path class="il-light il-thin" opacity="0.6" d="M55.7 71.3a7.9 7.9 0 0 1 5.3-3.7"/><circle class="il-white il-ink il-thin" cx="58.2" cy="74.7" r="3.2"/><circle class="il-dark" cx="59.1" cy="73.3" r="1.6"/><circle class="il-white il-ink il-thin" cx="65.8" cy="74.7" r="3.2"/><circle class="il-dark" cx="66.6" cy="73.3" r="1.6"/><path class="il-line il-thin" d="M63 67l6-2"/><ellipse class="il-red" opacity="0.35" cx="55.7" cy="79.2" rx="1.9" ry="1.3"/><ellipse class="il-red" opacity="0.35" cx="68.3" cy="79.2" rx="1.9" ry="1.3"/><path class="il-line il-thin" d="M58 79.2q4 4 8 0"/><path class="il-line il-thin" d="M60.3 74.7h3.4M54.3 74.7l-2.6 -1M69.7 74.7l2.6 -1"/><circle class="il-line il-thin" cx="58.2" cy="74.7" r="3.9"/><circle class="il-line il-thin" cx="65.8" cy="74.7" r="3.9"/>
    <ellipse class="il-stone il-ink il-thin" cx="44" cy="92" rx="9" ry="5"/>
    <g transform="translate(42 80) rotate(-12)"><path class="il-white il-ink il-thin" d="M-12 -8l12 2 12-2v14l-12 2-12-2z"/><path class="il-line il-thin" d="M0 -6v14M-9 -4h7M-9 -1h7M-9 2h6M3 -4h7M3 -1h7M3 2h5"/><path class="il-red il-ink il-thin" d="M-13 6l13 2 13-2v2l-13 2-13-2z"/></g>
    <g transform="translate(94 96)"><path class="il-white il-ink il-thin" d="M-5 -6h10l-1 7h-8z"/><path class="il-line il-thin" d="M5 -4a2.4 2.4 0 0 1 0 4"/><path class="il-light il-thin" d="M-1 -9q-2-2 0-4M2 -9q-2-2 0-4"/></g>`,

  // At her striped market stall, a beaming bee merchant offers a dripping spoonful of honey to a smitten beetle customer with hearts floating up, while she already slides a jar towards him; shelves full of honey jars behind.
  'bg.honey-trader': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-grass" d="M0 102h160v18H0z"/>
    <path class="il-wood-dark il-ink" d="M50 26h4v78h-4zM146 26h4v78h-4z"/>
    <path class="il-wood il-ink il-thin" d="M56 50h88v3H56z"/>
    <g transform="translate(64 42) scale(0.8 0.8)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g><g transform="translate(78 42) scale(0.8 0.8)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g><g transform="translate(92 42) scale(0.8 0.8)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g><g transform="translate(122 42) scale(0.8 0.8)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g><g transform="translate(136 42) scale(0.8 0.8)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g>
    <g transform="translate(102 70)"><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="-14" cy="-14" rx="7" ry="11" transform="rotate(-35 -14 -14)"/><ellipse class="il-white il-ink il-thin" opacity="0.85" cx="14" cy="-14" rx="7" ry="11" transform="rotate(35 14 -14)"/>
    <path class="il-line" d="M-6 14l-2 10h-3M6 14l2 10h3M-11 6l-8 3M11 6l8 3"/>
    <ellipse class="il-yellow" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-dark" d="M-12.4 -1L12.4 -1L11.6 4L-11.6 4zM-11 9L11 9L9 13.6L-9 13.6z"/>
    <ellipse class="il-line" cx="0" cy="4" rx="13" ry="15"/>
    <path class="il-line" d="M-11 -2l-10 4l-8-2M11 -2l8 6l2 6"/>
    <path class="il-line il-thin" d="M-4 -19q-3-8-8-9M4 -19q3-8 8-9"/>
    <circle class="il-dark" cx="-12" cy="-28" r="1.6"/><circle class="il-dark" cx="12" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="9.5"/>
    <circle class="il-white il-ink il-thin" cx="-3.8" cy="-13.5" r="3.4"/><circle class="il-white il-ink il-thin" cx="3.8" cy="-13.5" r="3.4"/>
    <circle class="il-dark" cx="-4.6" cy="-13" r="1.6"/><circle class="il-dark" cx="3" cy="-13" r="1.6"/>
    <path class="il-light il-thin" d="M-4 -7q4 4 8 0"/><ellipse class="il-pink" opacity="0.6" cx="-7" cy="-8" rx="1.6" ry="1"/><ellipse class="il-pink" opacity="0.6" cx="7" cy="-8" rx="1.6" ry="1"/><path class="il-white il-ink il-thin" d="M-8 10h16l-2 14h-12z"/></g>
    <path class="il-metal il-ink il-thin" d="M73 70l-14 4"/><ellipse class="il-gold il-ink il-thin" cx="56" cy="75" rx="4.6" ry="2.6"/>
    <path class="il-gold il-ink il-thin" d="M55 77q0 4 1 6q1-2 1-6z"/>
    <rect class="il-wood il-ink" x="48" y="84" width="104" height="20"/>
    <path class="il-line il-thin" opacity="0.4" d="M48 92h104"/>
    <g transform="translate(118 82)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g><g transform="translate(134 82)"><rect class="il-gold il-ink il-thin" x="-6" y="-8" width="12" height="13" rx="3"/><rect class="il-red il-ink il-thin" x="-6.6" y="-11" width="13.2" height="4" rx="1"/><path class="il-white il-ink il-thin" d="M-3 -3l1.6-2.6h3l1.6 2.6-1.6 2.6h-3z"/><path class="il-light il-thin" d="M-4 -5v6"/></g>
    <path class="il-yellow il-ink" d="M44 8h112l-6 18H50z"/>
    <path class="il-white il-ink il-thin" d="M58 8h12l-4 18h-8zM82 8h12l-2 18h-10zM106 8h12l0 18h-10zM130 8h12l2 18h-10z"/>
    <path class="il-yellow il-ink il-thin" d="M50 26q6 6 12 0 6 6 12 0 6 6 12 0 6 6 12 0 6 6 12 0 6 6 12 0 6 6 12 0 6 6 12 0"/>
    <g transform="translate(26 82) scale(0.95 0.95)"><path class="il-line" d="M-13 -4l-6 8l-2 8M13 -4l9 4l4 4M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/>
    <ellipse class="il-green il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <g transform="translate(-4 -18)"><path class="il-red il-ink il-thin" d="M0 3c-4-2-4-6-2-6.6 1-.4 2 .6 2 1.6 0-1 1-2 2-1.6 2 .6 2 4.6-2 6.6z"/></g><g transform="translate(4 -18)"><path class="il-red il-ink il-thin" d="M0 3c-4-2-4-6-2-6.6 1-.4 2 .6 2 1.6 0-1 1-2 2-1.6 2 .6 2 4.6-2 6.6z"/></g><ellipse class="il-dark il-ink il-thin" cx="0" cy="-10" rx="2.4" ry="2.4"/></g>
    <path class="il-pink il-ink il-thin" d="M30 46.7c-4.5-2.7-4.5-7.2 0-5.4c4.5-1.8 4.5 2.7 0 5.4z"/><path class="il-red il-ink il-thin" d="M40 37.8c-3-1.8-3-4.8 0-3.6c3-1.2 3 1.8 0 3.6z"/><path class="il-pink il-ink il-thin" d="M22 35.5c-2.5-1.5-2.5-4 0-3c2.5-1 2.5 1.5 0 3z"/>`,

  // A foreman ant in a hard hat proudly unfolds a yellow folding rule beside a big flowerpot cut open to show its inside: staircases, tunnels and little terraces with railings, a worker ant hauling a pebble, and a sprout on top.
  'bg.flowerpot-foreman': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <rect class="il-wood il-ink" x="0" y="106" width="160" height="14"/>
    <path class="il-orange il-ink" d="M58 26h96l-10 82H68z"/>
    <path class="il-earth-dark il-ink il-thin" d="M66 34h80l-8 66H74z"/>
    <path class="il-orange il-ink" d="M54 20h104v10H54z"/>
    <path class="il-green il-ink il-thin" d="M104 34q0-10 2-14M106 22q-8-6-12 0 6 4 12 0zM106 24q8-8 12-2-6 4-12 2z"/>
    <path class="il-earth il-ink il-thin" d="M70 50h40v8H70zM108 58h30v8h-30zM78 76h50v8H78zM74 92h30v8H74z"/>
    <path class="il-wood il-ink il-thin" d="M96 58h4v-4h4v-4h4v8zM118 84h4v-4h4v-4h4v-4h4v-4h4v16z"/>
    <path class="il-line il-thin" d="M72 50v-6M80 50v-6M88 50v-6M70 44h20M110 76v-6M120 76v-6M128 76v-6M110 70h18"/>
    <path class="il-wood-dark il-ink il-thin" d="M140 34h4v12h-4zM78 100V92h4v8"/>
    <g transform="translate(118 54) scale(0.38 0.38)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-dark il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-dark il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-6-10l0-8M5 -2l6-10l0-8"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-dark il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-4" cy="-14" r="1.7"/><circle class="il-dark" cx="4" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-3 -7q3 2 6 0"/><path class="il-yellow il-ink" d="M-9 -19a9 8 0 0 1 18 0z"/><rect class="il-yellow il-ink" x="-12" y="-20.5" width="24" height="3" rx="1"/><path class="il-line il-thin" d="M0 -27v7"/><circle class="il-stone il-ink" cx="0" cy="-38" r="8"/></g>
    <g transform="translate(26 74)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-red il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-red il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-6 8l-4 6M5 -2l10 0l6-6"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-red il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-2.5" cy="-14.4" r="1.7"/><circle class="il-dark" cx="5.5" cy="-14.4" r="1.7"/>
    <path class="il-line il-thin" d="M-4 -7q4 4 8 0"/><path class="il-yellow il-ink" d="M-9.450000000000001 -19a9.450000000000001 8.4 0 0 1 18.900000000000002 0z"/><rect class="il-yellow il-ink" x="-12.600000000000001" y="-20.575" width="25.200000000000003" height="3.1500000000000004" rx="1"/><path class="il-line il-thin" d="M0 -27.4v7.3500000000000005"/></g>
    <g transform="translate(46 64)"><path class="il-yellow il-ink il-thin" d="M0 0l12-12 3 3-12 12zM12 -12l12 4-1 4-12-4zM24 -8l2-14 4 0-2 14z"/><path class="il-line il-thin" d="M3 -1l1.6 1.6M6 -4l1.6 1.6M9 -7l1.6 1.6M15 -10l-.6 2M19 -9l-.6 2M27 -12h2M27 -16h2"/></g>
    <path class="il-light il-thin" d="M40 34l-4-4M50 32l1-5"/>`,

  // A chubby white silkworm tailor with a tape measure round its neck and pince-nez on its nose lies curled on a big leaf beside a spool of silk and a pincushion; on the washing line above hang its creations: six little socks and a pair of trousers with six legs.
  'bg.silk-tailor': `
    <rect class="il-purple-dark" x="0" y="0" width="160" height="120"/>
    <path class="il-light il-thin" opacity="0.15" d="M0 60h160"/>
    <path class="il-line" d="M-2 16q80 8 164 0"/>
    <g transform="translate(14 18)"><path class="il-red il-ink il-thin" d="M-3 0h7v10q0 2 3 3l2 1q1 4-3 4l-6-2q-3-1-3-5z"/><path class="il-white il-thin" opacity="0.8" d="M-3 3h7"/><path class="il-wood il-ink il-thin" d="M-1 -3h3v4h-3z"/></g><g transform="translate(30 18)"><path class="il-blue il-ink il-thin" d="M-3 0h7v10q0 2 3 3l2 1q1 4-3 4l-6-2q-3-1-3-5z"/><path class="il-white il-thin" opacity="0.8" d="M-3 3h7"/><path class="il-wood il-ink il-thin" d="M-1 -3h3v4h-3z"/></g><g transform="translate(46 18)"><path class="il-yellow il-ink il-thin" d="M-3 0h7v10q0 2 3 3l2 1q1 4-3 4l-6-2q-3-1-3-5z"/><path class="il-white il-thin" opacity="0.8" d="M-3 3h7"/><path class="il-wood il-ink il-thin" d="M-1 -3h3v4h-3z"/></g><g transform="translate(62 18)"><path class="il-green il-ink il-thin" d="M-3 0h7v10q0 2 3 3l2 1q1 4-3 4l-6-2q-3-1-3-5z"/><path class="il-white il-thin" opacity="0.8" d="M-3 3h7"/><path class="il-wood il-ink il-thin" d="M-1 -3h3v4h-3z"/></g><g transform="translate(78 18)"><path class="il-orange il-ink il-thin" d="M-3 0h7v10q0 2 3 3l2 1q1 4-3 4l-6-2q-3-1-3-5z"/><path class="il-white il-thin" opacity="0.8" d="M-3 3h7"/><path class="il-wood il-ink il-thin" d="M-1 -3h3v4h-3z"/></g><g transform="translate(94 18)"><path class="il-teal il-ink il-thin" d="M-3 0h7v10q0 2 3 3l2 1q1 4-3 4l-6-2q-3-1-3-5z"/><path class="il-white il-thin" opacity="0.8" d="M-3 3h7"/><path class="il-wood il-ink il-thin" d="M-1 -3h3v4h-3z"/></g>
    <g transform="translate(130 20)"><path class="il-wood il-ink il-thin" d="M-16 -2h4v4h-4zM12 -2h4v4h-4z"/><rect class="il-blue il-ink il-thin" x="-18" y="4" width="4" height="20" rx="1"/><rect class="il-blue il-ink il-thin" x="-11.6" y="4" width="4" height="18" rx="1"/><rect class="il-blue il-ink il-thin" x="-5.199999999999999" y="4" width="4" height="20" rx="1"/><rect class="il-blue il-ink il-thin" x="1.2000000000000028" y="4" width="4" height="18" rx="1"/><rect class="il-blue il-ink il-thin" x="7.600000000000001" y="4" width="4" height="20" rx="1"/><rect class="il-blue il-ink il-thin" x="14" y="4" width="4" height="18" rx="1"/><rect class="il-blue il-ink il-thin" x="-19" y="0" width="38" height="6" rx="1"/><circle class="il-gold" cx="0" cy="3" r="1.2"/></g>
    <path class="il-wood il-ink" d="M0 104h160v16H0z"/>
    <path class="il-green il-ink" d="M14 104q20-30 70-30t62 30z"/>
    <path class="il-line il-thin" opacity="0.5" d="M24 102q40-20 110-4M50 92l-6-8M76 88l-4-10M100 90l2-10M120 94l6-8"/>
    <path class="il-beard il-ink" d="M43.8 96.8L44.1 96L44.8 94.9L45.6 93.9L46.5 93.1L47.6 92.5L48.8 92L50.1 91.7L51.5 91.5L52.8 91.4L54.2 91.5L55.5 91.7L56.7 91.9L57.9 92.1L59 92.5L59.8 93L60.4 93.5L61.3 94.6L63.5 96.7L65.9 98.5L68.4 99.8L71 100.7L73.5 101.4L76 101.8L78.6 102L81.1 102L83.7 101.8L86.2 101.4L88.8 100.7L91.3 99.7L93.7 98.4L96.1 96.8L98.3 94.7L100.1 92.3L101.6 89.6L102 88.4C105.1 80.5 93 75.8 89.9 83.7L89.7 84.4L89.2 85.2L88.6 86L87.9 86.7L87 87.3L85.9 87.9L84.7 88.3L83.4 88.7L82 88.9L80.6 89.1L79.1 89.1L77.7 88.9L76.3 88.7L74.9 88.3L73.7 87.9L72.7 87.3L71.8 86.8L71.2 86.1L69.5 84.2L67 82.2L64.3 80.7L61.7 79.7L58.9 79L56.2 78.7L53.5 78.9L50.9 79.5L48.4 80.3L45.9 81.4L43.6 82.8L41.5 84.5L39.6 86.5L38 88.9L36.9 91.4L36.3 94L36.2 95.2C35.1 100.2 42.8 101.8 43.8 96.8z"/><path class="il-line il-thin" opacity="0.55" d="M44 94.5Q41.7 91.3 37.7 91.7M47.2 91.8Q46.1 87.3 41.9 85.1M51.2 90.7Q51.8 85.3 48.6 81M55.5 90.9Q57.8 85.3 56.2 79.5M59.3 91.8Q63.5 87.4 64 81.4M61.9 94Q67.6 91.8 70.6 86.6M68.8 99Q72.9 94.6 73.4 88.6M76.1 101Q78.8 95.6 77.6 89.7M83.6 101Q84.8 95.1 82.1 89.7M90.9 99Q90.4 93 86.3 88.6M97.7 94.2Q94.8 88.9 89.2 86.5"/><path class="il-light il-thin" opacity="0.5" d="M58.2 88.4L59.7 88.9L61.2 89.6L62.4 90.4L63.5 91.4L64.9 93.1L66.8 94.7L68.9 95.9L71 96.9L73.2 97.6L75.4 98.1L77.6 98.3L79.8 98.4L82.1 98.3"/><g class="il-dark"><circle cx="46" cy="100" r="1.4"/><circle cx="58" cy="94" r="1.4"/><circle cx="72" cy="100" r="1.4"/><circle cx="84" cy="100" r="1.4"/></g><path class="il-yellow il-ink il-thin" d="M90 82q10 8 20 2l1 3q-10 7-22-1z"/><path class="il-yellow il-ink il-thin" d="M108 85l4 14-3 1-4-13z"/><path class="il-line il-thin" d="M108 90l2-.6M109 94l2-.6"/><circle class="il-beard il-ink" cx="100" cy="76" r="11"/><path class="il-light il-thin" opacity="0.6" d="M93.4 71.1a8.3 8.3 0 0 1 5.5-3.9"/><circle class="il-white il-ink il-thin" cx="96" cy="74.7" r="3.3"/><circle class="il-dark" cx="97.5" cy="75.3" r="1.7"/><circle class="il-white il-ink il-thin" cx="104" cy="74.7" r="3.3"/><circle class="il-dark" cx="105.4" cy="75.3" r="1.7"/><ellipse class="il-red" opacity="0.35" cx="93.4" cy="79.3" rx="2" ry="1.3"/><ellipse class="il-red" opacity="0.35" cx="106.6" cy="79.3" rx="2" ry="1.3"/><path class="il-line il-thin" d="M95.8 79.3q4.2 4.2 8.4 0"/>
    <path class="il-line il-thin" d="M96 74h8"/><circle class="il-line il-thin" cx="96" cy="74" r="3.8"/><circle class="il-line il-thin" cx="104" cy="74" r="3.8"/>
    <path class="il-light il-thin" d="M110 82q10-2 16 6"/>
    <g transform="translate(132 94)"><rect class="il-wood il-ink il-thin" x="-7" y="-12" width="14" height="3" rx="1"/><rect class="il-wood il-ink il-thin" x="-7" y="3" width="14" height="3" rx="1"/><rect class="il-white il-ink il-thin" x="-5" y="-9" width="10" height="12"/><path class="il-line il-thin" opacity="0.4" d="M-5 -6h10M-5 -3h10M-5 0h10"/></g>
    <g transform="translate(24 96)"><circle class="il-red il-ink" r="7"/><path class="il-line il-thin" d="M0 -7v14M-6 -3q6 2 12 0"/><path class="il-green il-ink il-thin" d="M-3 -7l3-3 3 3z"/><path class="il-metal il-ink il-thin" d="M2 -3l8-10"/><circle class="il-yellow il-ink il-thin" cx="-4" cy="-4" r="1.6"/></g>`,

  // A proud beetle builder with a hammer presents its handmade scarecrow, small but terrifyingly grim with jagged brows and a stitched scowl; the blackbirds are already flying off with their little suitcases.
  'bg.scarecrow-builder': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M18.8 20a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-grass" d="M0 92h160v28H0z"/>
    <path class="il-earth il-ink il-thin" d="M-2 104q40-4 80 0t84 0v18H-2z"/>
    <path class="il-green il-ink il-thin" d="M14 104l3-6 3 6M36 104l3-6 3 6M58 104l3-6 3 6"/>
    <g transform="translate(124 22) rotate(-10) scale(0.9 0.9)"><path class="il-dark il-ink il-thin" d="M-10 0q4-8 12-6l6-4-2 6q-2 6-10 6z"/><path class="il-dark il-ink il-thin" d="M-2 -4q-4-10-12-10q4 6 8 12z"/><circle class="il-white" cx="2" cy="-4" r="1.4"/><circle class="il-dark" cx="2.4" cy="-4" r="0.7"/><path class="il-orange il-ink il-thin" d="M7 -8l5 1-4 2z"/><path class="il-line il-thin" d="M-2 2v5"/><rect class="il-wood il-ink il-thin" x="-6" y="7" width="9" height="6" rx="1"/><path class="il-line il-thin" d="M-3 7v-2h3v2"/></g><g transform="translate(146 40) rotate(-16) scale(0.75 0.75)"><path class="il-dark il-ink il-thin" d="M-10 0q4-8 12-6l6-4-2 6q-2 6-10 6z"/><path class="il-dark il-ink il-thin" d="M-2 -4q-4-10-12-10q4 6 8 12z"/><circle class="il-white" cx="2" cy="-4" r="1.4"/><circle class="il-dark" cx="2.4" cy="-4" r="0.7"/><path class="il-orange il-ink il-thin" d="M7 -8l5 1-4 2z"/><path class="il-line il-thin" d="M-2 2v5"/><rect class="il-wood il-ink il-thin" x="-6" y="7" width="9" height="6" rx="1"/><path class="il-line il-thin" d="M-3 7v-2h3v2"/></g><g transform="translate(104 12) rotate(-6) scale(0.6 0.6)"><path class="il-dark il-ink il-thin" d="M-10 0q4-8 12-6l6-4-2 6q-2 6-10 6z"/><path class="il-dark il-ink il-thin" d="M-2 -4q-4-10-12-10q4 6 8 12z"/><circle class="il-white" cx="2" cy="-4" r="1.4"/><circle class="il-dark" cx="2.4" cy="-4" r="0.7"/><path class="il-orange il-ink il-thin" d="M7 -8l5 1-4 2z"/><path class="il-line il-thin" d="M-2 2v5"/><rect class="il-wood il-ink il-thin" x="-6" y="7" width="9" height="6" rx="1"/><path class="il-line il-thin" d="M-3 7v-2h3v2"/></g>
    <path class="il-light il-thin" d="M112 30l-6 2M134 48l-6 1M96 18l-5 1"/>
    <g transform="translate(96 64)">
    <path class="il-wood-dark il-ink" d="M-2 -6h4v46h-4z"/>
    <path class="il-wood-dark il-ink" d="M-30 -2h60v4h-60z"/>
    <path class="il-gold il-ink il-thin" d="M-34 -4l-6-3 2 4-5 1 6 2-4 4 7-2zM34 -4l6-3-2 4 5 1-6 2 4 4-7-2z"/>
    <path class="il-red il-ink" d="M-28 -4h56v8h-14v22h-28V4h-14z"/>
    <path class="il-blue il-ink il-thin" d="M-8 8h8v8h-8z"/><path class="il-line il-thin" d="M-8 8l8 8M0 8l-8 8"/>
    <path class="il-gold il-ink il-thin" d="M-14 26l-2 6 4-3 2 5 2-6 4 4 2-6"/>
    <circle class="il-paper il-ink" cx="0" cy="-18" r="13"/>
    <path class="il-line" d="M-10 -26l8 5M10 -26l-8 5"/>
    <path class="il-dark" d="M-7 -21h4v3h-4zM3 -21h4v3h-4z"/>
    <path class="il-line il-thin" d="M-7 -10l3-2 2 2 2-2 2 2 2-2 3 2"/>
    <path class="il-line il-thin" d="M-6 -8v-4M6 -8v-4"/>
    <path class="il-line il-thin" opacity="0.5" d="M-12 -14l3 1M12 -14l-3 1"/>
    <path class="il-wood il-ink" d="M-18 -28h36l-4 4h-28z"/>
    <path class="il-wood il-ink" d="M-10 -28q0-12 10-12t10 12z"/>
    <path class="il-gold il-ink il-thin" d="M-18 -26l-4 4 6-1M18 -26l4 4-6-1"/>
    </g>
    <g transform="translate(40 72) scale(1.05 1.05)"><path class="il-line" d="M-13 -4l-6-10l-2-6M13 -4l14 0l8-4M-14 6l-10 5M14 6l10 5M-8 16l-3 10h-3M8 16l3 10h3"/><g transform="translate(-21 -22) rotate(-30)"><rect class="il-wood il-ink il-thin" x="-1.6" y="0" width="3.2" height="14" rx="1"/><rect class="il-metal il-ink il-thin" x="-6" y="-4" width="12" height="5" rx="1"/></g>
    <ellipse class="il-teal il-ink" cx="0" cy="4" rx="15" ry="17"/>
    <path class="il-line il-thin" d="M0 -11V21"/>
    <path class="il-light il-thin" opacity="0.7" d="M-10 -2q1-6 6-8M5 -4q3 0 5 3"/>
    <path class="il-line il-thin" d="M-4 -25q-4-8-9-9M4 -25q4-8 9-9"/><circle class="il-dark" cx="-13" cy="-34" r="1.8"/><circle class="il-dark" cx="13" cy="-34" r="1.8"/>
    <circle class="il-dark il-ink" cx="0" cy="-17" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-18" r="3.8"/><circle class="il-white il-ink il-thin" cx="4" cy="-18" r="3.8"/><circle class="il-dark" cx="-3" cy="-18" r="1.8"/><circle class="il-dark" cx="5" cy="-18" r="1.8"/><path class="il-light il-thin" d="M-4 -12q4 4 8 0"/><path class="il-yellow il-ink il-thin" d="M-15 8h30v4h-30z"/><rect class="il-wood il-ink il-thin" x="-10" y="7" width="5" height="6" rx="1"/></g>
    <path class="il-yellow il-ink il-thin" d="M58 50l4 0-1.4 6 2.4 0-6 8 1-6h-2z"/>`,

  // On a rose bush, a red ant shepherdess in a straw sun hat leans on her crook and watches over her flock of fluffy green aphids, which look exactly like little woolly sheep grazing along the branch beneath a red rose.
  'bg.aphid-shepherd': `
    <rect class="il-sky" x="0" y="0" width="160" height="120"/>
    <path class="il-white" d="M28.8 18a4 4 0 0 1 2.4-7.2a5.6 5.6 0 0 1 10.4-2.4a4.8 4.8 0 0 1 8 4a3.2 3.2 0 0 1 1.6 5.6z"/>
    <path class="il-wood-dark il-ink" d="M-2 92q60-14 164-6v6q-100-8-164 8z"/>
    <path class="il-wood-dark il-ink il-thin" d="M30 88l-2-5 5 3zM70 82l-1-5 5 4zM112 80l0-5 4 5zM146 82l1-5 3 5z"/>
    <path class="il-wood-dark il-ink" d="M120 84q4-30 18-50l4 2q-12 20-16 48z"/>
    <path class="il-green il-ink" d="M126 60q-14-8-20 2 12 6 20-2zM134 46q12-8 18 2-10 6-18-2zM20 92q-6 12 6 16 6-10-6-16zM60 86q4 12 16 10-4-12-16-10z"/>
    <path class="il-line il-thin" opacity="0.5" d="M108 62l18-2M136 46l14 2"/>
    <g transform="translate(142 30)"><circle class="il-red il-ink" r="12"/><path class="il-line il-thin" d="M-6 -2a6 6 0 0 1 10-4a5 5 0 0 1 0 8a4 4 0 0 1-6-2a2.4 2.4 0 0 1 4-2M-10 2q4 8 12 6M8 -8q6 4 2 12"/></g>
    <g transform="translate(60 78) scale(0.9 0.9)"><path class="il-line il-thin" d="M-4 6v3M0 7v3M4 6v3"/><path class="il-slime il-ink il-thin" d="M-9 2a3 3 0 0 1 1-6a3.4 3.4 0 0 1 5-3a3.4 3.4 0 0 1 6 0a3.4 3.4 0 0 1 5 3a3 3 0 0 1 1 6a3 3 0 0 1-4 4a3.4 3.4 0 0 1-5 1a3.4 3.4 0 0 1-5-1a3 3 0 0 1-4-4z"/><ellipse class="il-dark il-ink il-thin" cx="10" cy="0" rx="3.6" ry="3.2"/><circle class="il-white" cx="11" cy="-1" r="1.2"/><circle class="il-dark" cx="11.4" cy="-1" r="0.6"/><path class="il-line il-thin" d="M9 -3l-1-4M11 -3l2-4"/></g><g transform="translate(84 76) scale(-0.85 0.85)"><path class="il-line il-thin" d="M-4 6v3M0 7v3M4 6v3"/><path class="il-slime il-ink il-thin" d="M-9 2a3 3 0 0 1 1-6a3.4 3.4 0 0 1 5-3a3.4 3.4 0 0 1 6 0a3.4 3.4 0 0 1 5 3a3 3 0 0 1 1 6a3 3 0 0 1-4 4a3.4 3.4 0 0 1-5 1a3.4 3.4 0 0 1-5-1a3 3 0 0 1-4-4z"/><ellipse class="il-dark il-ink il-thin" cx="10" cy="0" rx="3.6" ry="3.2"/><circle class="il-white" cx="11" cy="-1" r="1.2"/><circle class="il-dark" cx="11.4" cy="-1" r="0.6"/><path class="il-line il-thin" d="M9 -3l-1-4M11 -3l2-4"/></g><g transform="translate(104 74) scale(0.8 0.8)"><path class="il-line il-thin" d="M-4 6v3M0 7v3M4 6v3"/><path class="il-slime il-ink il-thin" d="M-9 2a3 3 0 0 1 1-6a3.4 3.4 0 0 1 5-3a3.4 3.4 0 0 1 6 0a3.4 3.4 0 0 1 5 3a3 3 0 0 1 1 6a3 3 0 0 1-4 4a3.4 3.4 0 0 1-5 1a3.4 3.4 0 0 1-5-1a3 3 0 0 1-4-4z"/><ellipse class="il-dark il-ink il-thin" cx="10" cy="0" rx="3.6" ry="3.2"/><circle class="il-white" cx="11" cy="-1" r="1.2"/><circle class="il-dark" cx="11.4" cy="-1" r="0.6"/><path class="il-line il-thin" d="M9 -3l-1-4M11 -3l2-4"/></g><g transform="translate(72 92) scale(0.7 0.7)"><path class="il-line il-thin" d="M-4 6v3M0 7v3M4 6v3"/><path class="il-slime il-ink il-thin" d="M-9 2a3 3 0 0 1 1-6a3.4 3.4 0 0 1 5-3a3.4 3.4 0 0 1 6 0a3.4 3.4 0 0 1 5 3a3 3 0 0 1 1 6a3 3 0 0 1-4 4a3.4 3.4 0 0 1-5 1a3.4 3.4 0 0 1-5-1a3 3 0 0 1-4-4z"/><ellipse class="il-dark il-ink il-thin" cx="10" cy="0" rx="3.6" ry="3.2"/><circle class="il-white" cx="11" cy="-1" r="1.2"/><circle class="il-dark" cx="11.4" cy="-1" r="0.6"/><path class="il-line il-thin" d="M9 -3l-1-4M11 -3l2-4"/></g><g transform="translate(124 74) scale(-0.7 0.7)"><path class="il-line il-thin" d="M-4 6v3M0 7v3M4 6v3"/><path class="il-slime il-ink il-thin" d="M-9 2a3 3 0 0 1 1-6a3.4 3.4 0 0 1 5-3a3.4 3.4 0 0 1 6 0a3.4 3.4 0 0 1 5 3a3 3 0 0 1 1 6a3 3 0 0 1-4 4a3.4 3.4 0 0 1-5 1a3.4 3.4 0 0 1-5-1a3 3 0 0 1-4-4z"/><ellipse class="il-dark il-ink il-thin" cx="10" cy="0" rx="3.6" ry="3.2"/><circle class="il-white" cx="11" cy="-1" r="1.2"/><circle class="il-dark" cx="11.4" cy="-1" r="0.6"/><path class="il-line il-thin" d="M9 -3l-1-4M11 -3l2-4"/></g>
    <path class="il-light il-thin" d="M98 64q4-2 6 0"/>
    <path class="il-line il-thick" d="M44 104V40q0-8 7-8t7 7"/>
    <g transform="translate(30 80)"><path class="il-line" d="M-5 14l-8 8l-2 10M5 14l8 8l2 10M-5 8l-12 2M5 8l12 2"/>
    <path class="il-dark" d="M-17 32h5l1 2h-7zM12 32h5l1 2h-7z"/>
    <ellipse class="il-red il-ink" cx="0" cy="18" rx="10" ry="11"/>
    <path class="il-light il-thin" opacity="0.6" d="M-6 12q2-3 6-3"/>
    <ellipse class="il-red il-ink" cx="0" cy="2" rx="6" ry="7"/>
    <path class="il-line" d="M-5 -2l-8 8l-2 6M5 -2l10 0l3-6"/>
    <path class="il-line il-thin" d="M-4 -20q-4-8-10-8M4 -20q4-8 10-8"/>
    <circle class="il-dark" cx="-14" cy="-28" r="1.6"/><circle class="il-dark" cx="14" cy="-28" r="1.6"/>
    <circle class="il-red il-ink" cx="0" cy="-12" r="10"/>
    <circle class="il-white il-ink il-thin" cx="-4" cy="-14" r="3.6"/><circle class="il-white il-ink il-thin" cx="4" cy="-14" r="3.6"/>
    <circle class="il-dark" cx="-2.5" cy="-14" r="1.7"/><circle class="il-dark" cx="5.5" cy="-14" r="1.7"/>
    <path class="il-line il-thin" d="M-3 -7q3 2.4 6 0"/><ellipse class="il-pink" opacity="0.6" cx="-7" cy="-8" rx="1.6" ry="1"/><ellipse class="il-gold il-ink" cx="0" cy="-20" rx="15" ry="4"/><path class="il-gold il-ink" d="M-8 -20q0-10 8-10t8 10z"/><path class="il-blue il-ink il-thin" d="M-8 -23h16v3h-16z"/><circle class="il-white il-ink il-thin" cx="7" cy="-24" r="2.4"/><circle class="il-yellow" cx="7" cy="-24" r="0.9"/></g>
    <path class="il-pink il-ink il-thin" d="M70 61.5c-2.5-1.5-2.5-4 0-3c2.5-1 2.5 1.5 0 3z"/>`,

  // On night patrol, a firefly in a watchman's cap shines the bright lamp on its bottom straight at a little sheet ghost, which shields its eyes and backs off in a sweat.
  'bg.firefly-night-watch': `
    <rect class="il-night" x="0" y="0" width="160" height="120"/>
    <g class="il-white"><circle cx="12" cy="10" r="1"/><circle cx="40" cy="24" r="0.8"/><circle cx="70" cy="8" r="1"/><circle cx="104" cy="16" r="0.8"/><circle cx="150" cy="10" r="1"/><circle cx="20" cy="50" r="0.8"/><circle cx="146" cy="60" r="0.8"/></g>
    <circle class="il-paper il-ink il-thin" cx="132" cy="20" r="9"/><circle class="il-night" cx="136" cy="17" r="8"/>
    <path class="il-grass" d="M0 100h160v20H0z"/><path class="il-green il-ink il-thin" d="M0 101l2.4 -6 2.4 6M8 101l2.4 -8 2.4 8M16 101l2.4 -7 2.4 7M24 101l2.4 -6 2.4 6M32 101l2.4 -8 2.4 8M40 101l2.4 -7 2.4 7M48 101l2.4 -6 2.4 6M56 101l2.4 -8 2.4 8M64 101l2.4 -7 2.4 7M72 101l2.4 -6 2.4 6M80 101l2.4 -8 2.4 8M88 101l2.4 -7 2.4 7M96 101l2.4 -6 2.4 6M104 101l2.4 -8 2.4 8M112 101l2.4 -7 2.4 7M120 101l2.4 -6 2.4 6M128 101l2.4 -8 2.4 8M136 101l2.4 -7 2.4 7M144 101l2.4 -6 2.4 6M152 101l2.4 -8 2.4 8"/>
    <path class="il-torch" d="M64 54L148 30v66z"/>
    <g transform="translate(118 70)">
    <path class="il-white il-ink" d="M-14 22v-24q0-16 14-16t14 16v24l-4-4-3 4-3-4-4 4-3-4-3 4z"/>
    <path class="il-white il-ink il-thin" d="M-12 -2l-10-6-2 4M12 0l8-8"/>
    <path class="il-line il-thin" d="M-7 -4l4 2-4 2M7 -4l-4 2 4 2"/>
    <ellipse class="il-dark" cx="0" cy="8" rx="2.6" ry="3.4"/>
    <path class="il-water il-ink il-thin" d="M14 -16c1 1.5 1.6 2.2 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-0.7 0.6-1.4 1.6-2.9z"/>
    </g>
    <path class="il-light il-thin" d="M138 52l4-3M140 60h5"/>
    <g transform="translate(42 54) scale(1.2 1.2)"><ellipse class="il-white il-ink il-thin" opacity="0.7" cx="-8" cy="-14" rx="6" ry="12" transform="rotate(-30 -8 -14)"/><ellipse class="il-white il-ink il-thin" opacity="0.7" cx="2" cy="-14" rx="5" ry="11" transform="rotate(10 2 -14)"/>
    <path class="il-line il-thin" d="M-4 6l-2 6M2 6l0 6M8 5l2 6"/>
    <circle class="il-torch" cx="18" cy="2" r="12"/>
    <ellipse class="il-wood-dark il-ink" cx="0" cy="0" rx="12" ry="7"/>
    <ellipse class="il-glow il-ink" cx="14" cy="2" rx="7" ry="6"/>
    <path class="il-white il-thin" d="M12 -1q2-1 4 0"/>
    <circle class="il-wood-dark il-ink" cx="-14" cy="-2" r="7"/>
    <path class="il-line il-thin" d="M-16 -8q-2-6-8-8M-14 -9q0-6 4-9"/>
    <circle class="il-white il-ink il-thin" cx="-17" cy="-3" r="2.6"/><circle class="il-dark" cx="-17.4" cy="-3" r="1.3"/>
    <path class="il-light il-thin" d="M-19 2q2 1.4 4 0"/>
    <path class="il-blue il-ink il-thin" d="M-21 -7q1-7 8-7t7 6z"/><path class="il-dark il-ink il-thin" d="M-23 -7h12v2h-12z"/><circle class="il-gold" cx="-14" cy="-11" r="1.2"/></g>
    <path class="il-light il-thin" d="M70 46l4-2M72 56h5M70 64l4 2"/>`,
};
