# Card Quest — an original, humorous level-race card game — design

Status: **Draft for owner decisions** (2026-10-15). Nothing implemented yet. "Card Quest" and the id `card-quest` are **working names**; the product title is decision D1 (§ 9). Numbers marked *(calibrate)* are first estimates that play-tests and AI-vs-AI simulations confirm or correct.

Scope:

- `packages/games/card-quest` (`@wp/game-card-quest`): rules, computer players, card content (structure + per-locale text), view.
- `e2e/games/card-quest.spec.ts`.
- No shared package is needed for the MVP (§ 6.4 lists what might later be requested from the orchestrator).

Binding inputs: implementation brief ("Core product principles", "Universal resumability", "Intellectual-property rule", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"); ADR 0002 (contract), 0006 (roles), 0011 (per-locale content), 0015 (`setupInGame`), 0016 (`@wp/cards`, visual language only).

**IP rule.** The genre reference is a well-known commercial humorous card game whose name is a trademark and whose card texts and art are copyrighted. We take **only general, unprotectable mechanics**: characters gain levels, revealing an encounter card, fighting monsters by comparing numbers, items in body slots, curses, other players helping for a share or interfering. The product never uses the reference's name, worlds, card names, card texts, rules wording, visual style or its characteristic terms (§ 8 lists the terms we avoid and our own vocabulary). Every card name, joke and picture is original.

---

## 1. Goals, non-goals and honesty

Goals, in priority order:

1. **Laughing together at a table — with computer players.** Humour comes from situations ("the strongest monster in the game is defeated because it is afraid of garden hoses"), from the cards, and from the computer players' visible personalities and broken deals.
2. **Short, finished games.** 15–25 minutes *(calibrate)* to a natural end; closable at any moment and resumed exactly at the same decision.
3. **Readable interaction.** Helping, interfering and backstabbing are *explicit rules* with visible state (offers, deals, reputation), never hidden AI cheating.
4. **Mixable worlds.** Several themed world decks, each playable alone and combinable like the reference allows.
5. **Fair and deterministic.** Seeded shuffles, a seeded and visible die, computer players that see only what a human in their seat would see.

Non-goals: online multiplayer (no backend), collecting/unlocking cards, worlds or cosmetics (all content available from the start — no meta-progression, no loot boxes; drawing cards *inside* one game is the game's mechanic, nothing carries over), campaigns, ratings.

Honesty: described as "a humorous card game" / "active leisure" with the skills `strategy` (and `communication` for negotiation, see D-list). No cognitive claims.

---

## 2. Names (proposals for D1)

Quick check on 2026-10-15: one web search per name for existing games of that title. **No trademark-register search** (DPMA/EUIPO/USPTO) was done; that is still needed for the final name. "Free" below means *no game of that exact title found*, not *legally clear*.

The game title is a translated message (`title` per locale), so a name can be **transcreated per language** like any joke. Recommendation: one German and one English master title; other locales transcreate or keep the English one.

| # | German | International / English | Character | Quick check |
|---|---|---|---|---|
| 1 | **Kampfzwerge** (owner) | *Battle Dwarves* (weak) | punchy; "Kampfzwerg" is a well-known German nickname for small, feisty people | no game found; ties the brand to one world; does not travel well |
| 2 | **Zwergenaufstand** | — | idiom "mach keinen Zwergenaufstand" (= don't make a fuss) | no game found; German only; dwarf-specific |
| 3 | **Tür & Tücke** | *Doors & Dirty Tricks* | open a door, expect a dirty trick — the whole game in three words; world-neutral | no game found; near "Mit List und Tücke" (1999 trick-taking game) and "Mit Trick & Tücke" (2023) — different enough *(uncertain)* |
| 4 | **Heldenmut & Hinterlist** | *Heroics & Hijinks* | courage and treachery = helping and backstabbing | no game found for either; long for a catalogue tile |
| 5 | **Möchtegernhelden** | *Wannabe Heroes* | the genre's heart: incompetent heroes | no game found; "Heroes Wanted" (Action Phase Games) is close in English *(moderate confusion risk)* |
| 6 | **Plunderbande** | *Loot Bunch* | a band of plunderers; world-neutral | no game found; "Plunderbund" (deck-builder) exists *(moderate risk)* |
| 7 | **Lootlinge** | *Lootlings* | invented word = works in all 16 languages, cute brand, mixes well | no game found; "loot goblin" is a common gaming term (fine) |
| 8 | **Klauen & Kloppen** | *Grab & Grapple* | rhythmic German, rough-and-tumble | not checked in detail; English version weaker |
| 9 | **Hinterhalt-Helden** | *Backstab Buddies* | friends who betray each other | no game "Backstab Buddies" found; "Backstab" (2015 card game) and several jam games use "Backstab" |

**Recommendation ★: "Tür & Tücke" / "Doors & Dirty Tricks"** — world-neutral (fits mixing), says what happens, short enough for the 360 px catalogue. Alternatives ★2 "Lootlinge/Lootlings" (one brand in all languages) and the owner's **"Kampfzwerge"** — which I suggest as the **name of the dwarf world** instead (§ 3.1), where it fits perfectly.

---

## 3. Worlds (themes) and mixing

Each world is a **self-contained deck** with the same composition (§ 5.1). Tone everywhere: **family-friendly** (age ~10+, no gore, no adult jokes), slapstick and absurd bureaucracy rather than wordplay, so most jokes survive transcreation (§ 6.2). No parodies of real brands, films, people or quotes (legal and translation risk).

Card examples below are English working texts (names transcreated per locale later); "Lv" = monster level, "Blunder" = what happens when you lose (our term, § 8).

### 3.1 Dwarves — "Kampfzwerge" (owner's list: fairy-tale *and* garden gnomes)

Tone: proud mine dwarves with enormous beards against plastic garden gnomes from the suburbs — both sides think the other are the fake ones. A built-in rivalry gives jokes and mechanics.

- Monster **Lawnmower of Doom** (Lv 10): +4 against anyone without a beard. Blunder: lose your headgear ("it was mowed").
- Monster **Pebble Golem with Self-Esteem Issues** (Lv 2): runs away if you compliment it — any player may discard a card to end the fight without loot.
- Item **Beard Comb of Authority** (+2, small): dwarves +1 more.
- Item **Garden Hose** (+3, two hands): +3 more against *fiery* monsters.
- Curse **Your Beard Is Braided Into Your Neighbour's**: you and the player on your left must help each other in the next fight, without loot.
- Origin **Mine Dwarf** / **Garden Gnome**; profession **Treasure Accountant** (may sell items for 1 more point).

### 3.2 Space — "Space Junk"

Tone: shabby sci-fi — a spaceship with broken vending machines, bureaucratic aliens, robots with feelings.

- Monster **Form-27b Jellyfish** (Lv 6): you must discard 1 card before the fight ("stamped in triplicate").
- Monster **Lonely Vending Machine** (Lv 4): if you lose, it gives you a can anyway (draw 1 loot).
- Item **Laser Ladle** (+2, one hand). Item **Helmet With a Leak** (+1, head; *airtight* monsters +2 against you).
- Curse **Zero Gravity**: your heaviest item floats into the middle; the next player to win a fight takes it.
- Origin **Android**; profession **Space Janitor** (once per turn: discard an item from the table to draw a loot card).

### 3.3 Worms — "Worm Hole"

Tone: life under the lawn — compost politics, an over-motivated earthworm resistance, a mole with a Monday mood. "Worm hole" is the pun that **links space and worms** in mixed games.

- Monster **Mole With a Monday Mood** (Lv 5): +5 on your first turn after a curse.
- Monster **Early Bird** (Lv 8): every *worm* player −2 in this fight; worms may flee with +2.
- Item **Clod Helmet** (+1, head), **Compost Cape** (+2, body, *smelly*: no one may help you).
- Curse **Rain!**: everyone with worm origin comes to the surface — must fight the next monster revealed by anyone.

### 3.4 Insects — "Bug Brawl"

Tone: an ant state with endless forms, wasps as a protection racket, a mosquito who only wants a little sip.

- Monster **Wasp Collection Agency** (Lv 7): Blunder: give an item to the richest player.
- Monster **Mosquito, Just a Little Sip** (Lv 1): cannot be defeated, only escaped; whoever escapes gets 1 loot.
- Item **Aphid Shield** (+2, one hand), **Six Little Boots** (+1, feet; insects +2).

### 3.5 Action hero — "Explosions in the Background"

Tone: 80s-style action clichés without any real film: walking away from explosions, sunglasses at night, a henchman who always misses.

- Monster **Henchman No. 7** (Lv 3): +1 for every other henchman in play; never hits anything (you may always flee).
- Item **Sunglasses of Coolness** (+1, head; may not be removed during a fight).
- One-shot **One-Liner** (+3; +5 if you play it as the very last card of the reaction window — timing is everything).
- Curse **Your Car Explodes**: discard your large item. Nobody looks back.

### 3.6 Own ideas

- **"Open-Plan Office of Horror"**: meetings as monsters (**Endless Meeting**, Lv 9, cannot be fled), item **Stapler +3**, curse **Reply-All**. Universal, translates very well.
- **"Fridge Expedition"**: food monsters at the back of the fridge (**Yoghurt of Unknown Age**), item **Wooden Spoon** — universal, very child-friendly.

### 3.7 Mixing rules

1. A game uses **1–3 worlds** (setup screen). Their encounter cards form one encounter pile and their loot cards one loot pile; since every world has the same composition (§ 5.1), the ratios stay the same and the target level does not change, so mixing does not make games longer.
2. **Cross-world interaction runs through shared keywords**, never through card names: monsters and items carry tags from one small, closed list — `fiery`, `slimy`, `metallic`, `tiny`, `huge`, `smelly`, `airtight`, `flying`, `bureaucratic`, `bearded`, `undead-ish` … *(calibrate, ~16 tags)* — and origins form families (`dwarf`, `worm`, `insect`, `machine`, `hero` …). "Garden Hose +3 against fiery" therefore works against a space reactor monster too. Every world must use at least 6 tags shared with ≥ 2 other worlds (content test).
3. **Mixed origins.** A "Patchwork Ancestry" loot card (one per world) allows two origins at once — the "Android Garden Gnome" is the mixing joke.
4. **Mixing jokes** that only appear in mixed games are optional extras (e.g. "Worm Hole" pulls a card from the other world's discard pile).
5. Balancing: each world has the same **level budget** (sum of monster levels, sum of item bonuses within a band) — checked by a content test, and AI-vs-AI simulations compare win rates per world combination.

---

## 4. Rules (MVP)

### 4.1 Setup and goal

- **2–4 players** *(D5)*: one person plus 1–3 computer players. Setup screen inside the game (`setupInGame`, ADR 0015): worlds, number and personalities of opponents, game length.
- Everyone starts at **level 1** with 4 encounter and 4 loot cards.
- **Win: reach the target level** — default **8**, selectable 6 (short) / 8 / 10 (long) *(D6)*. The **winning level must come from defeating a monster** (not from selling or one-shots).
- **Natural end guaranteed**: after **round 30** *(calibrate)* the highest level wins (ties shared). Reshuffles of the discard piles are deterministic (seeded).

### 4.2 Turn structure

1. **Prepare** (own turn, outside fights): equip, swap, sell items, play origin/profession cards.
2. **Open** the top encounter card face up.
   - Monster → fight (§ 4.3).
   - Curse → applies to you immediately.
   - Anything else → into your hand.
3. If there was no fight: **Challenge** a monster from your hand *or* **Rummage** (take the top encounter card unseen into your hand).
4. **Pack up**: hand limit 5. Surplus goes to the player with the lowest level (if that is you: discard).

### 4.3 Fight

- **Your strength** = level + equipped bonuses + one-shots played. **Monster strength** = level + modifiers. You win if you are **strictly stronger** *(ties go to the monster)*.
- **Reaction window** (the digital answer to "anyone may play at any time"): after the fight starts, every other player in seat order gets one chance to play a card (monster modifier, reinforcement monster, curse, one-shot) or to pass; whenever someone plays, the round starts again; it ends when all pass in a row. The active player may respond in each round. No real-time pressure, no timers.
- **Help** (§ 4.5): at most one helper adds their strength.
- **Win**: +1 level (some monsters +2) and the monster's loot count from the loot pile (face down, hidden from others).
- **Lose**: **flee** with a **seeded six-sided die** shown on screen, success on 5–6 (modifiers by items/origins) *(D8)*. Failure: the monster's **Blunder** (lose a level, an item, cards …).
- **No death** in the MVP *(D7)*: Blunders never remove everything; frustration stays low and games stay short.

### 4.4 Items and slots

Slots: head, body, feet, two hands (one-hand / two-hand items), **one large item**, any number of small items; one origin, one profession. Items have a **value** in points; selling items worth 10 points *(calibrate)* = +1 level (never to the winning level). One-shots are discarded after use.

### 4.5 Helping, deals and backstabbing — an explicit rule system

All interaction is **offers with fixed shapes** (no free text, translatable, AI-computable):

| Offer | Meaning |
|---|---|
| *Help for N loot* | Helper gets N of the loot cards (N = 1, 2 or "all but one"); who picks first is part of the offer. |
| *Help for an item* | Helper gets a named equipped item of the active player after the fight. |
| *Help for a favour* | Helper may demand one help later without payment (recorded as an open favour). |
| *Pay to stay out* | A player offers a card so that another player does not interfere in this fight. |

- An offer is shown with buttons **Accept / Decline** (and for the active player: ask a specific player). Computer players make, accept and decline offers; deals between computer players appear in the log.
- **Backstabbing is a card, not a cheat:** **"Change Sides"** (a few copies per world) lets a helper switch to the monster's side during the reaction window; the deal is void.
- **Reputation** (visible per player, 0–5 stars, start 3): breaking a deal −2, honouring a deal +1 (max 5). Computer players accept offers from players with low reputation less often and ask a higher price. So betrayal is possible, visible and has a cost — the funny moment is planned, not random.
- **Leader rule** for computer players: the closer someone is to the target level, the more likely they interfere with that player (publicly known behaviour, explained in the rules).

### 4.6 Computer players

- **Information**: each computer player decides from `observe(state, seat)` only — own hand, public table, card counts, played cards; never other hands or pile orders. Tested (§ 7).
- **Personalities** (visible on the setup screen and at the table, with a portrait drawn in code and a short description): *Cautious* (helps cheaply, rarely interferes), *Opportunist* (sells help dearly, betrays when it wins the game), *Grudge-Holder* (remembers who interfered with it), *Show-Off* (challenges big monsters, plays one-shots early). Personalities are **weight vectors** for one heuristic, not separate AIs.
- **Difficulty** (`metadata.difficulties`): *easy* (no backstabbing, mistakes in timing), *normal*, *sharp* (counts played cards, times interference to the last reaction round).
- Decision = rule-based scoring of the legal actions with a seeded tie-break; strength estimation of the "expected interference" from what was played. Budget: < 5 ms per decision *(calibrate)*, so AI-vs-AI simulations of thousands of games run in tests.
- Pace: computer actions appear one by one in the log/table with a short highlight (skippable; instant with reduced motion). Logic never waits on time.

### 4.7 State, saves and determinism

- **State = plain JSON**: `stateVersion`, settings (worlds, target, seats, personalities, difficulty), piles as arrays of **card ids** (`dw.m.lawnmower`), hands, equipment, levels, reputation, open favours, the **phase machine** including a pending reaction window or offer, rng state (`createRng`, persisted), round counter, the last ~50 log events (ids + parameters, no text).
- **Every decision is one action** `step(state, seat, action) → state` (pure, in `rules.ts`); after each human action and each computer action → `requestSave()`. Closing during an offer or a reaction window resumes exactly there. Computer turns are computed synchronously; only their presentation is animated.
- **Determinism**: same seed + same actions ⇒ identical state (property test). No `Math.random`, no clock.
- **Hidden information in the view**: other hands render only as counts; ARIA live texts, log lines and `document.title` never name hidden cards. The save contains all hands (unavoidable locally, acceptable for a single-person game) — the view never shows them.
- `isValidState` checks every id against the selected worlds' card structure, card conservation (every card exactly once), slot rules and the phase machine; never throws (fuzzed). Crafted saves with an impossible win are rejected.

---

## 5. Content

### 5.1 Composition per world (MVP: ~80 cards) *(calibrate)*

| Pile | Kind | Count |
|---|---|---|
| Encounter (44) | monsters Lv 1–14 | 22 |
| | curses | 8 |
| | origins / professions | 2 + 4 |
| | monster modifiers (+5 "Furious", −5 "Sleepy" …) and reinforcements | 8 |
| Loot (36) | items (all slots) | 20 |
| | one-shots (+n, flee bonus, "Change Sides" ×2) | 10 |
| | level-up cards | 4 |
| | special ("Patchwork Ancestry", …) | 2 |

### 5.2 Structure and text are separate (ADR 0011)

- `src/content/structure/<world>.ts` — language-free: id, kind, level, bonus, slot, value, tags, effect in a **small closed effect language** (`{ when: 'vs-tag', tag: 'fiery', bonus: 3 }`, `{ blunder: 'lose-slot', slot: 'head' }`, …). Rules read only this.
- `src/content/<locale>.ts` — per locale, loaded via `preload`: per card `name` (≤ 28 characters) and `flavour` (≤ 90 characters), plus the monster's Blunder flavour. **Rule text is generated from the effect data** with translated templates ("+{n} against {tag}"), so rule wording is consistent, short and never mistranslated; humour lives in names and flavour.
- UI messages (setup, phases, offers, log templates) in `metadata.messages`, all 16 locales.

### 5.3 Volume

Per world per locale: ~80 names + ~80 flavour lines + ~22 Blunder lines ≈ 2 000 words. MVP (1 world, 16 locales) ≈ 32 000 words of card text plus ~250 UI keys. Each further world adds the same.

---

## 6. Localisation, art and UI

### 6.1 Locales (decision D10)

The contract test requires every UI message in all 16 locales, so every merged state must be complete. Proposal ★: **English master + German written directly**, the other 14 **transcreated in the same PR** (AI-assisted, like all other content), native review as a backlog item (exists already for other games). Release only complete; no partial-language release.

### 6.2 How humour is localised

- **Transcreation, not translation.** The English master holds per card a short **joke brief** (in a comment/side file, not shipped): *what is funny* ("a huge monster with a petty weakness"). Each locale invents its own name/pun; names need not match across languages (ids are neutral, saves contain ids only).
- **Situational humour first**: at least ~2/3 of jokes must work without wordplay (situation, mechanic, absurd bureaucracy). Wordplay is a per-locale bonus.
- **No cultural traps**: no regional idioms in the master, no alcohol/religion/politics jokes, careful with "dwarf" wording (fairy-tale creatures only; no jokes about body height of people).
- Length limits per field are checked by a test in every locale (360 px).

### 6.3 Art

- **Drawn in code, original** (SVG), in the visual language of `@wp/cards` (colour tokens, line style, light/dark/forced colours). `@wp/cards` itself models standard 52/32-card decks, so this game renders its own cards.
- **Pictogram construction kit**: a monster picture is composed from parts — body shape × eyes × mouth × accessory × world palette (beard, helmet, antennae, sunglasses, briefcase …). ~40 parts give 80+ distinct, consistent pictures without drawing each card. Items: one icon per slot type + a world accessory.
- Card **type** is shown by **frame shape + icon + word** (never colour only): monster = jagged frame, curse = cracked frame, item = rounded frame, one-shot = ticket shape.
- Later option (decision like the adventures' Q1): agent-generated raster art, behind a swappable art layer.

### 6.4 UI at 360 px

- **Table**: one compact row per player — portrait/personality, level (large number), strength, hand count, reputation stars, equipment icons. Own equipment as a slot grid.
- **Hand**: compact cards (name, type icon, key number), tap → **detail sheet** with the full card and its actions (Equip / Play / Sell / Give). Wraps into rows; 44 px targets; roving tabindex; full keyboard play.
- **Fight panel**: "You 11 vs Monster 9" with the breakdown, the current reaction-window prompt, offers as cards with Accept/Decline.
- **Log** (collapsible): what happened, in plain sentences; AI moves announced via the polite live region without hidden information.
- RTL via logical properties; reduced motion = no card flights.
- Possible later shared requests to the orchestrator (not needed for the MVP): a generalised `renderHand` for non-standard cards in `@wp/cards`.

---

## 7. Tests (Definition of Done)

- **Unit (TDD)**: each rule, effect and Blunder; slot rules; reaction-window ordering; offers and reputation.
- **Property (fast-check)**: card conservation; determinism (seed + action log); `isValidState` never throws and accepts every reachable state; every game terminates by round 30; no win without a fight; the observation of a seat never contains other hands or pile orders; seat symmetry (same AI in every seat → win rates per seat within a band over many seeds).
- **Content tests**: per world composition, level budget and shared tags (§ 3.7); every structure id has text in every locale; length limits per locale; effect data only from the closed language.
- **Simulation tests** (AI vs AI, small samples in CI, larger offline): average game length in rounds, share of games decided by the round limit (< 10 % *(calibrate)*), world-combination balance.
- **Contract** (`runGameContract` with `preload`) and **e2e** (`expectResumeAfterReload` mid-fight and mid-offer; 360 px in en and ar).
- AI/property suites under ~50 % of their timeout **under `pnpm coverage`**.

---

## 8. Our vocabulary (terms we avoid)

We avoid the reference's characteristic rule terms and phrases (e.g. its words for revealing the encounter, searching for trouble, looting the room, giving away surplus cards, the "bad stuff" line, wandering monsters, mixed-race and super-class cards, divine intervention) and its name.

Ours: **encounter pile / loot pile**, **Open** (reveal), **Challenge** (fight a monster from hand), **Rummage** (draw unseen), **Pack up** (hand limit), **Blunder** (what happens on a loss), **reinforcement**, **origin / profession**, **Patchwork Ancestry**, **Change Sides**, **reputation**. German working terms: *Begegnungsstapel, Beutestapel, Aufmachen, Herausfordern, Stöbern, Einpacken, Blamage, Verstärkung, Herkunft/Beruf, Flickwerk-Abstammung, Seitenwechsel, Ruf*.

---

## 9. Scope, milestones, risks, decisions

### 9.1 MVP vs later

**MVP**: 1 world (~80 cards), 2–4 players, target 6/8/10, fight + reaction window, help offers, Change Sides + reputation, 4 personalities, 3 difficulties, code-drawn pictograms, 16 locales.

**Later**: worlds 2–6 and mixing UI, mixing jokes, more offer types (trading cards outside fights), optional "knock-out" variant (losing more on a Blunder), a short interactive tutorial game, raster art option.

### 9.2 Milestones (one PR each, against `main`)

| | Content | Note |
|---|---|---|
| K0 | This design document | docs only |
| K1 | Rules core (`step`, phases, fights, reaction window without offers), structure of world 1, simple AI, setup screen, view, 16 locales | first playable version |
| K2 | Offers, deals, Change Sides, reputation, personalities, difficulties | the funny part |
| K3 | World 2 + mixing (setup, tags, balance tests) | |
| K4 | Pictogram kit polish, animations, tutorial hints | |
| K5+ | further worlds, one per PR | |

### 9.3 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Humour does not survive translation | situational humour first, joke briefs, generated rule text, native review backlog |
| Content volume (32 k words per world × locales) | small MVP (1 world), strict length limits, generated rules text |
| Too close to the reference | own vocabulary (§ 8), own worlds, no names/texts/look; check before every content PR |
| Ganging-up / kingmaker frustration | leader rule public, reputation, round limit, no death |
| Complex timing at 360 px | structured reaction window, one prompt at a time, detail sheet |
| AI feels unfair or cheating | observation-only AI (tested), visible personalities, deals in the log |
| Games too long | target 8, round limit, AI-vs-AI length statistics in CI |
| Randomness felt as unfair | visible die and pile counts, seeded and reproducible; no meta rewards |
| Name conflicts | register search (DPMA/EUIPO/USPTO) before release; neutral id |

### 9.4 Decisions for the owner (★ = recommendation)

| # | Question | Options |
|---|---|---|
| D1 | Product name | ★ **Tür & Tücke / Doors & Dirty Tricks**; Lootlinge/Lootlings; Kampfzwerge; others from § 2 |
| D2 | Package id | ★ neutral `card-quest` (stays even if the title changes) |
| D3 | First world (MVP) | ★ **Dwarves "Kampfzwerge"** (mine dwarves vs garden gnomes); alternatives Space, Office |
| D4 | Second world (mixing in K3) | ★ **Space** (most international; with Worms later the "Worm Hole" link) |
| D5 | Players | ★ 2–4, one person + computer players; no hot-seat |
| D6 | Game length | ★ target 8 (6/8/10 selectable), round limit 30 |
| D7 | Death | ★ none in the MVP (Blunders only) |
| D8 | Fleeing | ★ seeded, visible die; alternative: deterministic (flee value vs monster) |
| D9 | Backstabbing | ★ Change Sides cards + visible reputation; alternative: no backstabbing at all |
| D10 | 16 locales | ★ en + de written, 14 transcreated in the same PR, release only complete |
| D11 | Art | ★ code-drawn, pictogram construction kit; raster art later as an option |
| D12 | Tone | ★ family-friendly (~10+), no parodies of real brands/films/people |
| D13 | Skills shown in the catalogue | ★ `strategy` + `communication` |
