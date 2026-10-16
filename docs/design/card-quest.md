# Lootlings — an original, humorous level-race card game — design

Status: **Owner decisions recorded (2026-10-15)**, see § 0. Nothing implemented yet. Product title **Lootlinge** (de) / **Lootlings** (en); the package id stays neutral: **`card-quest`** (`@wp/game-card-quest`), so a later rename (backup title *Backstab Buddies*) touches no saves. Numbers marked *(calibrate)* are first estimates that play-tests and AI-vs-AI simulations confirm or correct.

Scope:

- `packages/games/card-quest`: rules, computer players, card content (structure + per-locale text), view.
- `e2e/games/card-quest.spec.ts`.
- No shared package is needed for the MVP (§ 7.4 lists what might later be requested from the orchestrator).

Binding inputs: implementation brief ("Core product principles", "Universal resumability", "Intellectual-property rule", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"); ADR 0002 (contract), 0006 (roles), 0011 (per-locale content), 0015 (`setupInGame`), 0016 (`@wp/cards`, visual language only).

**IP rule.** The genre reference is a well-known commercial humorous card game whose name is a trademark and whose card texts and art are copyrighted. We take **only general, unprotectable mechanics**: characters gain levels, revealing an encounter card, fighting monsters by comparing numbers, items in body slots, cards that modify monsters and items, curses, creature kinds that cards can target, other players helping for a share or interfering. The product never uses the reference's name, worlds, card names, card texts, rules wording, visual style or its characteristic terms (§ 9 lists the terms we avoid and our own vocabulary). Every card name, joke and picture is original.

---

## 0. Owner decisions (2026-10-15)

| # | Topic | Decision | Consequence in this design |
|---|---|---|---|
| D1 | Name | **Lootlinge / Lootlings**; backup *Backstab Buddies* | § 2; register search (DPMA/EUIPO/USPTO) before release |
| D2 | Id | neutral `card-quest` | package dir and saves |
| D3 | First world | **Kampfzwerge**: garden gnomes vs fairy-tale dwarves (incl. the mine) | § 4.1 |
| D4 | Second world | **Spaceloot** | § 4.2; mixing from K3 |
| — | More worlds | build **Office (incl. home office)** and **Fridge**, add **Railway / trains**; worms, insects, action hero stay on the list. **After the first play-tests.** | § 4.3–4.8 |
| D5 | Players | **2–6**: one person + **up to 5** computer players | § 5.1, § 7.3 (six rows at 360 px) |
| D6 | Length | **open** (saves at any time); round limit **optional**, off by default | § 5.1 |
| — | Card count | **~140 cards per world** | § 6.1 |
| — | Creature kinds | a **base-kind system** across all worlds ("what works against dwarves also works against worms"), built into the Kampfzwerge pack from the start | § 3 |
| — | Combining | cards **combinable** like in the reference (monster boosters, reinforcements, item upgrades, sets, double origin/profession) | § 5.4 |
| — | Onboarding | **play without reading the rules first**: intuitive, guided by the screen | § 7.1 |
| D7–D13 | Rest | as recommended: no death; seeded visible die for fleeing; Change Sides cards + visible reputation; en + de written, 14 locales transcreated in the same PR, release only complete; code-drawn art with a pictogram kit; family-friendly tone, no parodies of real brands/films/people; skills `strategy` + `communication` | § 5, § 7, § 8 |

---

## 1. Goals, non-goals and honesty

Goals, in priority order:

1. **Start playing at once.** No rules screen in front of the game; the screen always shows the next sensible action and why a card can or cannot be played (§ 7.1).
2. **Laughing together at a table — with computer players.** Humour comes from situations, from card combinations ("a huge, furious, ancient yoghurt") and from the computer players' visible personalities and broken deals.
3. **Combinable cards.** Monster boosters, reinforcements, item upgrades and the cross-world base kinds make every game produce new combinations.
4. **Readable interaction.** Helping, interfering and backstabbing are *explicit rules* with visible state (offers, deals, reputation), never hidden AI cheating.
5. **Mixable worlds.** Themed world decks, each playable alone and combinable.
6. **Fair and deterministic.** Seeded shuffles, a seeded and visible die, computer players that see only what a human in their seat would see. Closable at any moment, resumed exactly at the same decision.

Non-goals: online multiplayer (no backend), collecting/unlocking cards, worlds or cosmetics (all content available from the start — no meta-progression, no loot boxes; drawing cards *inside* one game is the game's mechanic, nothing carries over), campaigns, ratings.

Honesty: described as "a humorous card game" / "active leisure" with the skills `strategy` and `communication` (negotiation). No cognitive claims.

---

## 2. Name

**Lootlinge** (de) / **Lootlings** (en, and the default for the other locales; a locale may transcreate when a natural form exists, e.g. a plural that reads better). An invented word works in all 16 languages, is world-neutral (fits mixing) and says "loot".

Quick check on 2026-10-15 (one web search per name, **no trademark-register search yet**): no game named "Lootlings" found; "loot goblin" is a common gaming term (no conflict expected). Backup **Backstab Buddies**: no game of that exact title found; "Backstab" (2015 card game) and several jam games use "Backstab". World name **Spaceloot**: no game of that exact title; "Spacelooter" (itch.io) and "Spaceship Looter" (Steam) exist *(low risk for a world name inside the game, uncertain)*.

Other proposals from the design round (Tür & Tücke, Heldenmut & Hinterlist, Möchtegernhelden, Plunderbande, Klauen & Kloppen, Zwergenaufstand) are dropped; "Kampfzwerge" is the dwarf world's name.

---

## 3. Base kinds, traits and item classes — the cross-world vocabulary

All worlds share **one closed vocabulary**, defined in K1 together with the Kampfzwerge pack. Cards never refer to card names of another world; they refer to this vocabulary, so every card works against everything from every world — also worlds that do not exist yet.

### 3.1 Base kinds (every creature has exactly one)

Every **monster** and every **origin** (the player's character kind) has one base kind. "+3 against Diggers" therefore hits a mine dwarf player, a worm monster and a mole alike.

| Id | German working name | English | Examples across worlds |
|---|---|---|---|
| `digger` | Buddler | Diggers | mine dwarves, forest dwarves, worms, moles, ants of the deep |
| `figurine` | Nippes | Knick-knacks | garden gnomes, office desk figures, fridge magnets, lawn flamingos |
| `machine` | Blechkram | Tin Things | robots, androids, the printer, coffee machine, locomotives |
| `goo` | Glibber | Goo | slime, space jellyfish, old yoghurt, mould |
| `crawler` | Krabbler | Crawlers | insects, spiders, space bugs, the thing behind the radiator |
| `critter` | Viecher | Critters | early bird, office cat, mole with a Monday mood |
| `bigmouth` | Großmaul | Bigmouths | humanoids: action heroes, colleagues, the conductor, aliens with a briefcase |
| `greens` | Grünzeug | Greens | carnivorous plant, office ficus, forgotten salad |
| `spook` | Spuk | Spooks | ghost train, the meeting nobody ended, a haunted garden gnome |

*(calibrate: 9 kinds; adding a kind later is possible but costly — every world's balance test runs again.)*

### 3.2 Traits (0–3 per monster or item)

`fiery`, `cold`, `wet`, `sticky`, `smelly`, `loud`, `tiny`, `huge`, `flying`, `armoured`, `shiny`, `sleepy`, `bureaucratic`, `bearded`, `ancient`, `electric` *(calibrate, ~16)*. Example: "Garden Hose: +3, another +3 against `fiery`".

### 3.3 Item classes (one per item)

`tool`, `weapon`, `clothing`, `gadget`, `food`, `junk`. Used by professions ("+1 for every tool you wear") and by set bonuses (§ 5.4).

### 3.4 Content rules (tested)

- Each world uses **at least 5 base kinds** among its monsters and **at least 8 traits**; at least **70 %** of a world's kind/trait references hit kinds/traits present in the same world, so a single-world game stays meaningful, while the rest point at other worlds (pays off when mixing).
- The Kampfzwerge pack already contains cards against **all 9 base kinds** (at least one each), so it is "prepared" for every later world.

---

## 4. Worlds

Tone everywhere: **family-friendly** (age ~10+, no gore, no adult jokes), slapstick and absurd bureaucracy rather than wordplay, so most jokes survive transcreation (§ 7.2). No parodies of real brands, films, people, companies (e.g. no real railway operator) or quotes.

Card examples are English working texts (transcreated per locale later); "Lv" = monster level, "Blunder" = what happens when you lose (our term, § 9).

### 4.1 World 1 — Kampfzwerge (MVP)

Tone: a feud between **fairy-tale dwarves** (mine, forest, enormous beards, gold, songs) and **garden gnomes** (ceramic and plastic, front lawns, suburban pride). Both sides think the others are the fake ones.

- **Origins** (4): *Mine Dwarf* (`digger`, +1 in the dark), *Forest Dwarf* (`digger`), *Ceramic Gnome* (`figurine`, +2 against `machine`, cracks: Blunders that cost an item cost one more card), *Plastic Gnome* (`figurine`, flees +1 — "light as a feather").
- **Professions** (6), e.g. *Treasure Accountant* (sells items for +1 point), *Lawn Sentinel* (+1 per `tool`), *Beard Barber*, *Mine Foreman*.
- **Faction mechanic**: some cards care about the two families (fairy-tale vs garden). Curse **Uprising of the Dwarves**: until your next turn, every fairy-tale dwarf gets +2 against garden gnomes and vice versa — and nobody of the other family may help.
- Monsters (examples): **Lawnmower of Doom** (Lv 10, `machine`, `loud`): +4 against anyone without `bearded` gear. Blunder: lose your headgear ("it was mowed"). **Pebble Golem with Self-Esteem Issues** (Lv 2, `figurine`): any player may discard a card to compliment it — the fight ends without loot. **The Mine Canary That Saw Too Much** (Lv 4, `critter`, `flying`). **Moss With Ambitions** (Lv 6, `greens`, `sticky`). **Haunted Gnome From No. 12** (Lv 8, `spook`).
- Items: **Beard Comb of Authority** (+2, small, `tool`; dwarves +1 more), **Garden Hose** (+3, two hands, `tool`; +3 more against `fiery`), **Pointy Red Hat** (+1, head, `clothing`; gnomes +2), **Mine Lamp** (+2, head, `gadget`; +2 against `spook`).
- Set (§ 5.4): *Proper Mining Gear* — Pickaxe, Mine Lamp, Leather Apron: +3 when all three are worn.

### 4.2 World 2 — Spaceloot

Tone: shabby sci-fi — a spaceship with broken vending machines, bureaucratic aliens, robots with feelings.

- Origins: *Android* (`machine`), *Space Slime* (`goo`), *Alien With Briefcase* (`bigmouth`), *Space Cockroach* (`crawler`, cannot lose more than one level per Blunder).
- Monsters: **Form-27b Jellyfish** (Lv 6, `goo`, `bureaucratic`): discard 1 card before the fight ("stamped in triplicate"). **Lonely Vending Machine** (Lv 4, `machine`): if you lose, it gives you a can anyway (draw 1 loot).
- Items: **Laser Ladle** (+2, one hand, `weapon`), **Helmet With a Leak** (+1, head; `wet` monsters +2 against you).
- Curse **Zero Gravity**: your heaviest item floats into the middle; the next player to win a fight takes it.
- Profession: *Space Janitor* (once per turn: discard an item from the table to draw a loot card).

### 4.3 Office and home office (after the first tests)

Meetings as monsters, the printer as nemesis, the home office as a battlefield.

- Monsters: **Endless Meeting** (Lv 9, `spook`, `bureaucratic`): cannot be fled. **Printer With Paper Jam** (Lv 5, `machine`, `loud`). **Colleague With Camera Off** (Lv 3, `bigmouth`): you do not know its level until you commit — it is revealed after the reaction window. **Home-Office Cat on the Keyboard** (Lv 7, `critter`): randomly discards one of your one-shots (seeded).
- Items: **Stapler** (+3, one hand, `tool`), **Jogging Bottoms** (+1, body, `clothing`; +3 if no one is helping you — "nobody can see you"), **Headset With Mute Button** (+2, head, `gadget`).
- Curses: **Reply-All** (every other player draws a card, you discard one), **You're Still on Mute** (you may not make or accept offers in your next fight).

### 4.4 Fridge expedition

Food monsters at the back of the fridge, very child-friendly.

- Monsters: **Yoghurt of Unknown Age** (Lv 7, `goo`, `ancient`), **Forgotten Lasagne** (Lv 12, `smelly`, `huge`), **Lonely Pickle** (Lv 2, `greens`, `wet`), **Ice Age in the Freezer Drawer** (Lv 9, `cold`).
- Items: **Wooden Spoon** (+2, one hand, `tool`), **Oven Mitt** (+1, one hand; +3 against `fiery`), **Tupperware Shield** (+2, one hand, `junk`).
- Curse **Is the Light Really Off?**: show your hand to the player on your left.

### 4.5 Railway / trains

Steam, schedules and the eternal delay — no real operator, line or brand.

- Origins: *Steam Engine* (`machine`, +2 when you go first in a fight), *Platform Pigeon* (`critter`, `flying`).
- Monsters: **The Five-Minute Delay That Never Ends** (Lv 4, `bureaucratic`): +1 for every round it has been in play (can be challenged later from hand — the longer you wait, the worse). **Ghost Train** (Lv 10, `spook`), **Ticket Machine That Only Takes Exact Change** (Lv 6, `machine`).
- Items: **Coal Shovel** (+3, two hands, `tool`; +1 against `cold`), **Conductor's Cap** (+2, head, `clothing`; others must give you 1 card to help you).
- Curse **Replacement Bus Service**: skip *Open* in your next turn and *Rummage* instead.

### 4.6 Worms, insects, action hero (later; from the design round)

- **Worms** ("Worm Hole" links worms and space when mixed): Mole With a Monday Mood, Early Bird (every `digger` player −2), Clod Helmet, Compost Cape, curse *Rain!*.
- **Insects** ("Bug Brawl"): Wasp Collection Agency, Mosquito "Just a Little Sip" (cannot be defeated, only escaped), Aphid Shield, Six Little Boots.
- **Action hero** ("Explosions in the Background"): Henchman No. 7, Sunglasses of Coolness, One-Liner (+3; +5 as the last card of a reaction window), curse *Your Car Explodes*.

### 4.7 Mixing rules

1. A game uses **any number of worlds** (setup screen; one by default). Their encounter cards form one encounter pile and their loot cards one loot pile. Every world has the same composition (§ 6.1), so the ratios and the game length stay the same.
2. Cross-world effects run only through the shared vocabulary (§ 3).
3. **Patchwork Ancestry** (loot, one per world) allows two origins at once — the "Android Garden Gnome" is the mixing joke; **Second Job** allows two professions.
4. **Mixing jokes** that only matter in mixed games are optional extras (e.g. "Worm Hole" pulls a card from another world's discard pile).
5. Balancing: each world has the same **level budget** (sum of monster levels, sum of item bonuses within a band) — checked by a content test; AI-vs-AI simulations compare win rates per world combination.

### 4.8 Order of worlds

K1 Kampfzwerge → first play-tests → K3 Spaceloot (mixing) → then, one per PR, in an order the owner picks after the tests (proposal: Office, Fridge, Railway, Worms, Insects, Action hero).

---

## 5. Rules

### 5.1 Setup and goal

- **2–6 players**: one person plus **1–5 computer players**. Setup screen inside the game (`setupInGame`, ADR 0015): worlds, number and personalities of opponents (random or chosen), target level, optional round limit. Every choice has a sensible default, so "Play" is one tap.
- Everyone starts at **level 1** with 4 encounter and 4 loot cards.
- **Win: reach the target level** — default **10**, selectable 6 / 8 / 10 / 12. The **winning level must come from defeating a monster** (not from selling or one-shots).
- **Round limit: optional**, off by default (choices: off / 20 / 30 / 40). When on, after the last round the highest level wins (ties shared).
- Without a limit the game ends when someone wins. Simulations check that this always happens in practice (§ 8); if a stalemate pattern shows up, a catch-up rule is added instead of a hard limit.

### 5.2 Turn structure

1. **Prepare** (own turn, outside fights): equip, swap, sell items, play origin/profession cards and item upgrades. Freely undoable until *Open* (no hidden information is revealed).
2. **Open** the top encounter card face up.
   - Monster → fight (§ 5.3).
   - Curse → applies to you immediately.
   - Anything else → into your hand.
3. If there was no fight: **Challenge** a monster from your hand *or* **Rummage** (take the top encounter card unseen into your hand).
4. **Pack up**: hand limit 5. Surplus goes to the player with the lowest level (if that is you: discard).

### 5.3 Fight

- **Your strength** = level + equipped bonuses (incl. kind/trait bonuses against this monster) + one-shots played. **Monster strength** = level + boosters + reinforcements. You win if you are **strictly stronger** *(ties go to the monster)*.
- **Reaction window** (the digital answer to "anyone may play at any time"): after the fight starts, every other player in seat order gets one chance to play a card (monster booster, reinforcement, curse, one-shot) or to pass; whenever someone plays, the round starts again; it ends when all pass in a row. The active player may respond in each round. No timers.
- **Help** (§ 5.5): at most one helper adds their strength.
- **Win**: +1 level per defeated monster (some +2) and the loot count of all defeated monsters (face down, hidden from others).
- **Lose**: **flee** with a **seeded six-sided die** shown on screen, success on 5–6 (modifiers by items/origins), separately per monster. Failure: that monster's **Blunder** (lose a level, an item, cards …).
- **No death**: Blunders never remove everything.

### 5.4 Combining cards

| Kind of card | Combines how | Examples |
|---|---|---|
| **Monster booster** (encounter) | attach to any monster in a fight, by anyone, **stack without limit**; change level and loot | *Huge* +10 / +2 loot, *Furious* +5 / +1 loot, *Ancient* +10 / +2 loot, *Baby* −5 / −1 loot, *Sleepy* −3 |
| **Reinforcement** (encounter) | adds a monster from hand to a fight; strengths and loot add up | "A second Lawnmower — they hunt in pairs" |
| **Item upgrade** (loot) | attaches to one equipped item permanently; stacks | *Reinforced With Tape* +2, *Turbo* +3 (item becomes large), *Polished* (+1, `shiny`) |
| **Sets** | 2–3 items with the same set mark give a bonus; world sets and cross-world class sets ("three `tool`s: +2") | *Proper Mining Gear* |
| **Origin + profession** | kind and class synergies; **Patchwork Ancestry** / **Second Job** for two of each | *Ceramic Gnome* + *Lawn Sentinel* |
| **Kind/trait bonuses** | items and professions vs kinds/traits (§ 3) | Garden Hose vs `fiery`, Mine Lamp vs `spook` |
| **One-shots** | any number per fight, also for helpers and against you | *Pocket Thunderstorm* +3, *Distraction* (flee +2) |
| **Curse combos** | some curses stay until removed and amplify others | *Bad Luck Streak*: your next curse hits twice |

The fight panel always shows the **sum with every part listed**, so combinations are visible and understandable (§ 7.1).

### 5.5 Items and slots

Slots: head, body, feet, two hands (one-hand / two-hand items), **one large item**, any number of small items; one origin, one profession (two with the special cards). Items have a **value** in points; selling items worth 10 points *(calibrate)* = +1 level (never to the winning level). One-shots are discarded after use.

### 5.6 Helping, deals and backstabbing — an explicit rule system

All interaction is **offers with fixed shapes** (no free text, translatable, AI-computable):

| Offer | Meaning |
|---|---|
| *Help for N loot* | Helper gets N of the loot cards (N = 1, 2 or "all but one"); who picks first is part of the offer. |
| *Help for an item* | Helper gets a named equipped item of the active player after the fight. |
| *Help for a favour* | Helper may demand one help later without payment (recorded as an open favour). |
| *Pay to stay out* | A player offers a card so that another player does not interfere in this fight. |

- An offer is shown with **Accept / Decline** (the active player can also ask a specific player). Computer players make, accept and decline offers; deals between computer players appear in the log.
- **Backstabbing is a card, not a cheat:** **Change Sides** (a few copies per world) lets a helper switch to the monster's side during the reaction window; the deal is void.
- **Reputation** (visible per player, 0–5 stars, start 3): breaking a deal −2, honouring a deal +1 (max 5). Computer players accept offers from players with low reputation less often and ask a higher price.
- **Leader rule** for computer players: the closer someone is to the target level, the more likely they interfere with that player (publicly known, explained in the help).

### 5.7 Computer players

- **Information**: each computer player decides from `observe(state, seat)` only — own hand, public table, card counts, played cards; never other hands or pile orders. Tested (§ 8).
- **Personalities** (visible at setup and at the table, code-drawn portrait, one-line description): *Cautious*, *Opportunist*, *Grudge-Holder*, *Show-Off* *(more later)*. Personalities are **weight vectors** for one heuristic, not separate AIs. With up to 5 opponents, the same personality may appear twice (distinguished by name and portrait).
- **Difficulty** (`metadata.difficulties`): *easy* (no backstabbing, mistakes in timing), *normal*, *sharp* (counts played cards, times interference to the last reaction round).
- Decision = rule-based scoring of the legal actions with a seeded tie-break. Budget < 5 ms per decision *(calibrate)*, so a whole AI turn with 5 opponents in the reaction window stays well under 100 ms, and AI-vs-AI simulations of thousands of games run in tests.
- Pace: computer actions appear one by one with a short highlight (skippable; instant with reduced motion). Logic never waits on time. With 5 opponents the person can choose "fast table" (only summaries of computer turns that do not involve them).

### 5.8 State, saves and determinism

- **State = plain JSON**: `stateVersion`, settings (worlds, target, round limit, seats, personalities, difficulty, coach hints on/off), piles as arrays of **card ids** (`kz.m.lawnmower`), hands, equipment with attached upgrades, levels, reputation, open favours, the **phase machine** including a pending reaction window or offer, rng state (`createRng`, persisted), round counter, the last ~50 log events (ids + parameters, no text), which coach hints were shown.
- **Every decision is one action** `step(state, seat, action) → state` (pure, in `rules.ts`); after each human and each computer action → `requestSave()`. Closing during an offer or a reaction window resumes exactly there. Computer turns are computed synchronously; only their presentation is animated.
- **Determinism**: same seed + same actions ⇒ identical state (property test). No `Math.random`, no clock.
- **Hidden information in the view**: other hands render only as counts; ARIA live texts, log lines and `document.title` never name hidden cards. The save contains all hands (unavoidable locally, acceptable for a single-person game) — the view never shows them.
- `isValidState` checks every id against the selected worlds' card structure, card conservation (every card exactly once), slot rules and the phase machine; never throws (fuzzed). Crafted saves with an impossible win are rejected.

---

## 6. Content

### 6.1 Composition per world (~140 cards) *(calibrate)*

| Pile | Kind | Count |
|---|---|---|
| Encounter (76) | monsters Lv 1–18 | 36 |
| | monster boosters | 10 |
| | reinforcements and special encounters | 6 |
| | curses | 14 |
| | origins / professions | 4 + 6 |
| Loot (64) | items (all slots, all classes) | 34 |
| | item upgrades | 6 |
| | one-shots (incl. Change Sides ×2) | 14 |
| | level-up cards | 6 |
| | special (Patchwork Ancestry, Second Job, …) | 4 |

Monster boosters, item upgrades and a few one-shots are **world-neutral in effect** but world-flavoured in name and picture (Kampfzwerge's *Huge* is "Monumental Garden Ornament Size", Spaceloot's is "Supermassive").

### 6.2 Structure and text are separate (ADR 0011)

- `src/content/structure/<world>.ts` — language-free: id, kind, level, bonus, slot, value, base kind, traits, item class, set mark, effect in a **small closed effect language** (`{ when: 'vs-kind', kind: 'digger', bonus: 3 }`, `{ when: 'vs-trait', trait: 'fiery', bonus: 3 }`, `{ blunder: 'lose-slot', slot: 'head' }`, …). Rules read only this.
- `src/content/<locale>.ts` — per locale, loaded via `preload`: per card `name` (≤ 32 characters) and `flavour` (≤ 90 characters; checked per locale by a test), plus the monster's Blunder flavour. **Rule text is generated from the effect data** with translated templates ("+{n} against {kind}"), so rule wording is consistent, short and never mistranslated; humour lives in names and flavour.
- UI messages (setup, phases, offers, coach hints, log templates, base kinds, traits, item classes) in `metadata.messages`, all 16 locales.

### 6.3 Volume

Per world per locale: ~140 names + ~140 flavour lines + ~36 Blunder lines ≈ 3 500 words. One world in 16 locales ≈ 56 000 words; the MVP + Spaceloot ≈ 112 000 words, plus ~350 UI keys. Per-locale chunks keep the download small (only the chosen language is loaded).

---

## 7. Onboarding, localisation, art and UI

### 7.1 Play without reading the rules (owner requirement)

- **No rules screen before the first game.** Setup has defaults; one tap on "Play" starts.
- **One primary action at a time**: a large button names the next sensible step ("Peek around the corner", "Fight", "Ask for help", "Flee", "End turn"); secondary actions are smaller.
- **Cards explain themselves where they are**: playable cards are marked (with an icon and text, not colour only) with the reason ("+3 here: monster is `fiery`"); unplayable cards say why ("only in a fight"). Tapping a card opens a sheet that offers only legal actions.
- **Live forecast** in a fight: "You 11 : 9 Monster — you would win if nobody interferes", with every part of both sums listed.
- **Coach hints** (on in the first game, switchable): one short line the first time a concept appears (first curse, first offer, first booster, first Change Sides), never a blocking modal; shown hints are stored in the state.
- **Computer players narrate** in the log in plain sentences ("Brummbold plays *Furious* on your monster: +5").
- "How to play" stays available as a short illustrated reference, never required.
- Shuffles stay honest also in the first game: the coach only explains, it never arranges easy cards.

### 7.2 Locales and humour

- **English master + German written directly**, the other 14 **transcreated in the same PR** (AI-assisted, like all other content); release only complete; native review as a backlog item.
- **Transcreation, not translation.** The English master holds per card a short **joke brief** (side file, not shipped): *what is funny*. Each locale invents its own name/pun; names need not match across languages (ids are neutral, saves contain ids only).
- **Situational humour first**: at least ~2/3 of jokes must work without wordplay. Wordplay is a per-locale bonus.
- **No cultural traps**: no regional idioms in the master, no alcohol/religion/politics jokes, "dwarf" means fairy-tale creatures only (no jokes about people's height).
- Length limits per field are checked by a test in every locale (360 px).

### 7.3 Art

- **Drawn in code, original** (SVG), in the visual language of `@wp/cards` (colour tokens, line style, light/dark/forced colours). `@wp/cards` itself models standard 52/32-card decks, so this game renders its own cards.
- **Pictogram construction kit**: a monster picture is composed from parts — body shape (per base kind) × eyes × mouth × accessory × world palette. ~50 parts give hundreds of distinct, consistent pictures. Items: one icon per slot and class + a world accessory.
- **Base kind = a silhouette icon** in a fixed corner of every creature card; traits as small icons with their word. Card **type** is shown by **frame shape + icon + word** (never colour only): monster = jagged frame, curse = cracked frame, item = rounded frame, one-shot = ticket shape, booster = plus badge.
- Later option: agent-generated raster art behind a swappable art layer.

### 7.4 UI at 360 px

- **Table**: one compact row per player (up to 6) — portrait/personality, level (large), strength, hand count, reputation stars, equipment icons. Own equipment as a slot grid with attached upgrades.
- **Hand**: compact cards (name, type icon, key number), tap → detail sheet. Wraps into rows; 44 px targets; roving tabindex; full keyboard play.
- **Fight panel**: both sums itemised, the current reaction-window prompt, offers as cards with Accept/Decline.
- **Log** (collapsible), polite live region without hidden information. RTL via logical properties; reduced motion = no card flights.
- Possible later shared request to the orchestrator (not needed for the MVP): a generalised `renderHand` for non-standard cards in `@wp/cards`.

---

## 8. Tests (Definition of Done)

- **Unit (TDD)**: each rule, effect, booster, upgrade, set and Blunder; slot rules; reaction-window ordering; offers and reputation.
- **Property (fast-check)**: card conservation; determinism (seed + action log); `isValidState` never throws and accepts every reachable state; no win without a fight; the observation of a seat never contains other hands or pile orders; seat symmetry (same AI in every seat → win rates per seat within a band); with the round limit on, every game ends by the limit.
- **Content tests**: composition, level budget, vocabulary rules (§ 3.4), every structure id has text in every locale, length limits per locale, effects only from the closed language.
- **Simulation tests** (AI vs AI, small samples in CI, larger offline): game length in rounds per target level and player count, share of very long games (> 60 rounds), world-combination balance.
- **Contract** (`runGameContract` with `preload`) and **e2e** (`expectResumeAfterReload` mid-fight and mid-offer; 360 px in en and ar; 6 players).
- AI/property suites under ~50 % of their timeout **under `pnpm coverage`**.

---

## 9. Our vocabulary (terms we avoid)

We avoid the reference's characteristic rule terms and phrases (e.g. its words for revealing the encounter, searching for trouble, looting the room, giving away surplus cards, the "bad stuff" line, wandering monsters, mixed-race and super-class cards, divine intervention) and its name.

Ours: **encounter pile / loot pile**, **Peek around the corner** (reveal the top encounter card; never “door”), **Challenge** (fight a monster from hand), **Rummage** (draw unseen), **Pack up** (hand limit), **Blunder** (what happens on a loss), **booster**, **reinforcement**, **upgrade**, **set**, **base kind**, **origin / profession**, **Patchwork Ancestry**, **Second Job**, **Change Sides**, **reputation**. German working terms: *Begegnungsstapel, Beutestapel, Um die Ecke schauen, Herausfordern, Stöbern, Einpacken, Blamage, Aufwerter, Verstärkung, Aufrüstung, Set, Grundart, Herkunft/Beruf, Flickwerk-Abstammung, Zweitjob, Seitenwechsel, Ruf*.

---

## 10. Scope, milestones, risks, open points

### 10.1 MVP vs later

**MVP (K1–K2)**: Kampfzwerge (~140 cards), the full vocabulary (§ 3), 2–6 players, target 6–12, optional round limit, fight + reaction window + all combination types, offers, Change Sides + reputation, 4 personalities, 3 difficulties, onboarding (§ 7.1), code-drawn pictograms, 16 locales.

**Later**: Spaceloot + mixing (K3), then one world per PR (§ 4.8); more offer types (trading outside fights), optional "knock-out" variant, raster art option.

### 10.2 Milestones (one PR each, against `main`)

| | Content | Note |
|---|---|---|
| K0 | Design document (#39) + owner decisions (this update) | docs only |
| K1 | Rules core (`step`, phases, fights, reaction window, boosters/reinforcements/upgrades/sets), vocabulary, Kampfzwerge structure + texts, simple AI, setup screen, view with onboarding, 16 locales | first playable version → **owner play-test** |
| K2 | Offers, deals, Change Sides, reputation, personalities, difficulties, coach hints polish | the funny part |
| K3 | Spaceloot + mixing (setup, balance tests) | |
| K4 | Pictogram kit polish, animations, "fast table" | |
| K5+ | Office, Fridge, Railway, Worms, Insects, Action hero — one per PR | order after the tests |

K1 is large (140 cards × 16 locales). If it becomes too big for one review, it is split into K1a (rules + vocabulary + 40-card test subset, 16 locales) and K1b (full Kampfzwerge content).

### 10.3 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Humour does not survive translation | situational humour first, joke briefs, generated rule text, native review backlog |
| Content volume (~56 k words per world across 16 locales) | strict length limits, generated rule text, world-neutral boosters/upgrades, one world per PR |
| Too close to the reference | own vocabulary (§ 9), own worlds, own base kinds, no names/texts/look; check before every content PR |
| Ganging-up / kingmaker frustration | leader rule public, reputation, no death |
| Very long games without a limit | simulation statistics; catch-up rule if needed; optional round limit |
| Complex timing and 6 rows at 360 px | structured reaction window, one prompt at a time, compact rows, "fast table" |
| Onboarding without rules fails | coach hints, itemised forecast, play-test with the owner after K1 |
| AI feels unfair or cheating | observation-only AI (tested), visible personalities, deals in the log |
| Name conflicts | register search (DPMA/EUIPO/USPTO) for "Lootlinge/Lootlings" before release; neutral id |

### 10.4 K1 as built (2026-10-15)

- Kampfzwerge: 140 cards, 123 distinct texts, 16 locales (card texts as per-locale chunks, UI in `metadata.messages`).
- Rules in `rules.ts` (`step` per action, `observe` per seat, `isValidState` with card conservation and log validation); computer players in `ai.ts` decide from `observe` only; `driver.ts` runs them until the person must decide. The person's turn in another player's fight window is passed automatically when no card of theirs could be played there, so only real decisions are asked.
- No timers: computer turns are applied at once and shown as "Since your last move" plus the log.
- Self-play (all seats AI, 40 games each): median 10–14 rounds at target 8–10 with 2–6 players, max ≤ 32; ≈ 10–90 ms per whole game.
- Not yet in K1 (K2): help offers, deals, Change Sides, reputation, grudges.

### 10.5 Owner feedback after the first play-test (2026-10-15) — backlog

- **B1 Card text while choosing cards to give away or sell.** In the give-away and sell modes a tap selects the card, so its description cannot be read before choosing. Fix: an info button on every tile (or a long press) that opens the card detail in every mode; selection stays on the tile itself.
- **B2 Visual upgrade.** The owner expects clearly better pictures, not only icons: a real picture per card (monsters, items, curses …), larger on the detail view. Options to decide with the owner: richer code-drawn illustrations per card (original, no third-party art) or agent-generated raster art behind the swappable art layer (§ 7.3; needs precache rules for webp/avif from the orchestrator and a licence note in docs/third-party.md).
- **B3 Better wordplay.** Names and flavour lines should be funnier, with more real puns per language (German first, then transcreated). Plan: a joke pass over all 123 texts in de and en with a brief per card (what is the joke), then the other 14 locales re-transcreated from it; keep situational humour so it survives translation.
- **B4 Funny Blunder text per monster.** Today the Blunder is only the generated rule line ("level −1"). Each monster gets its own short, funny Blunder sentence (≤ 90 characters, per locale, original — no texts from the reference), shown on the card and in the log when it hits, next to the generated rule line that stays the binding effect (content field `blunder`, see § 6.2/6.3; content test for presence and length).
- Confirmed: playing without reading the rules works (owner knows the genre; a test with someone new to it is still open).

### 10.6 Open points (none blocks K1)

- **O1** Default target level: **10** assumed (owner: length open). Selectable 6/8/10/12.
- **O2** Title in the other 14 locales: "Lootlings" unless a locale has a natural form.
- **O3** Order of worlds after Spaceloot: owner decides after the play-tests.
