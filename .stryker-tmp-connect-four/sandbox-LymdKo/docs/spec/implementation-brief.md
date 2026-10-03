<!--
Source: product conversation (ChatGPT, 2026), final implementation brief.
The project was renamed from the working title "Reasoned Play" to "Worthwhile Play"
(one of the name proposals in the same conversation). Content otherwise unchanged.
This document is the binding product specification. Changes require an ADR.
-->

# Worthwhile Play

**Tagline:** Games worth your attention.

Worthwhile Play is a public, multilingual, installable web application containing games and exercises intended as productive leisure.

The project is not intended to maximize engagement, session length, monetization or retention. It should provide entertaining alternatives to doom scrolling and passive consumption while exercising skills such as logical reasoning, planning, memory, attention, communication, spatial reasoning, hypothesis testing and problem solving.

The repository will be public and the deployed application will be publicly accessible. The product therefore must be understandable and usable by people with no knowledge of its original motivation or development history.

---

# Core product principles

Do not implement:

- advertising;
- rewarded ads;
- loot boxes;
- artificial waiting periods;
- lives/energy systems;
- streak pressure;
- daily-login rewards;
- autoplay into another game;
- infinite feeds;
- variable-ratio reward mechanics designed for retention;
- unnecessary push notifications;
- deliberately addictive engagement loops.

Scores, statistics and achievements may exist where they genuinely describe performance, but they must not be used to pressure users into returning.

Games should end naturally.

## Universal resumability

**Every game must be closable at any time and resumable later.**

This applies to:

- puzzles;
- memory games;
- chess and board games;
- communication exercises;
- strategy games;
- Tower Defense;
- hybrid strategy/TD;
- point-and-click adventures.

Autosave should happen continuously at meaningful state transitions.

Use `visibilitychange`, `pagehide` and equivalent safe browser mechanisms where useful, but do not rely exclusively on unload events.

Persist logical state rather than animation frames.

If the application is closed during an animation, it is acceptable to restore the last logically complete state.

For deterministic simulations such as strategy games, save sufficient information to reconstruct the exact state, including where relevant:

- seed;
- PRNG state;
- game tick/turn;
- locked commands;
- simulation state.

Closing the application must never intentionally punish the user.

---

# Public-first design

The website and repository must make sense to arbitrary visitors.

The home page should clearly explain:

- what Worthwhile Play is;
- what it is not;
- that games are free to play;
- that core games work locally/offline;
- that no account is required unless this ever becomes technically necessary for an optional feature;
- what skills each game primarily exercises;
- typical session duration;
- whether AI, audio or network access is optional or required.

Each game should have a stable direct URL.

Examples:

`/games/chess`

`/games/memory`

`/games/nonogram`

`/games/temporal-adventure`

A user must not need to navigate through the main catalogue to launch a game.

---

# Intellectual-property rule

Command & Conquer, King's Quest VIII: Mask of Eternity and TimeShift are design references only.

Do not copy:

- names;
- characters;
- factions;
- storylines;
- maps;
- art;
- sounds;
- music;
- dialogue;
- units;
- logos;
- level layouts;
- distinctive visual assets.

The resulting games must have original names, settings, assets and mechanics.

The references describe desired high-level experiences only.

Third-party libraries, engines, fonts, models, audio and assets must receive an explicit license review before inclusion.

---

# Architecture

Use a TypeScript monorepo with a shared application shell and independently functional game modules.

Suggested structure:

```text
repo/
├── apps/
│   └── web/
│
├── packages/
│   ├── game-core/
│   ├── ui/
│   ├── persistence/
│   ├── localization/
│   ├── audio/
│   ├── ai/
│   ├── learning-content/
│   ├── puzzle-core/
│   ├── strategy-engine/
│   ├── adventure-engine/
│   │
│   └── games/
│       ├── chess/
│       ├── tic-tac-toe/
│       ├── connect-four/
│       ├── memory/
│       ├── nonogram/
│       └── ...
│
└── e2e/
```

Every game implements a common `GameModule` contract.

At minimum:

```text
metadata()
initialize()
newGame(seed)
pause()
resume()
serialize()
restore()
reset()
dispose()
```

Capability metadata should include fields such as:

```text
offline
audio
aiOptional
webgpu
pauseable
typicalDuration
skills[]
inputMethods[]
```

Games must not reach into another game's internal implementation.

Shared behavior belongs in shared packages.

---

# Determinism

Where randomness is used, use seeded pseudo-randomness.

Do not scatter `Math.random()` through game logic.

Prefer:

```text
seed → PRNG → deterministic game state
```

A bug report should ideally be reproducible with:

```text
game
seed
difficulty
actions
```

Determinism is particularly important for:

- generated puzzles;
- AI tests;
- strategy simulation;
- procedural maps;
- combat;
- fuzz testing.

---

# Complete initial game backlog

Do not silently remove games from this backlog.

Implementation may be incremental.

## Logic and deduction

- Sokoban
- Bridges / Hashi
- Slitherlink
- Nonogram / Picross
- Einstein / Constraint Grid puzzles
- Mastermind
- Lights Out
- River Crossing puzzles
- Rush-Hour-style sliding puzzles
- Skyscrapers / Towers
- deterministic Minesweeper
- Minimal Proof
- Rule Discovery
- Black Box

## Spatial and systems thinking

- Circuit Puzzle
- Laser Circuit
- Systems Puzzle
- Debug the System
- Graph Detective
- Logic Path / algorithmic movement puzzles

## Memory and learning

- classic Memory
- image ↔ image
- image ↔ word
- word ↔ image
- word ↔ definition
- audio ↔ word
- audio ↔ translation
- Faces & Names
- Spatial Memory
- Sequence Memory
- Prospective Memory
- Association/Mnemonic exercises
- optional N-back

## Attention

- Signal Watch
- Deep Read
- Distractor Control
- visual/peripheral search exercises

## Communication

- Audience Switch
- Compression Challenge
- Briefing Game
- Ambiguity Detector

## Classic strategy/board games

- Chess
- Tic-Tac-Toe / X-O
- Connect Four

## Larger games

- original turn-based strategy game
- Tower Defense
- strategy/Tower-Defense hybrid
- at least two substantial point-and-click adventures

---

# Chess

Implement complete standard chess rules.

This includes:

- legal move validation;
- check;
- checkmate;
- stalemate;
- castling;
- en passant;
- promotion;
- threefold repetition;
- fifty-move rule;
- insufficient material where appropriate.

Support at minimum:

- local human vs. human;
- save/resume;
- move history;
- undo where the selected mode permits it.

A local computer opponent is desirable.

If a third-party chess engine such as a WASM engine is considered, perform a license compatibility review before inclusion.

The core chess game must remain usable offline.

---

# Tic-Tac-Toe and Connect Four

Support:

- local human vs. human;
- local computer opponent;
- multiple AI difficulty levels where useful.

These games are small enough that deterministic minimax/alpha-beta approaches are preferred over external AI.

They are useful reference implementations for the common game architecture.

---

# Learning and Memory platform

Do not implement every learning mode as a separate hard-coded game.

Create a generic learning/deck system.

A learning item should support combinations of:

```text
front:
  text
  image
  audio

back:
  text
  image
  audio

metadata:
  category
  language
  difficulty
  tags
```

Use this for:

- language learning;
- pronunciation;
- geography;
- flags;
- countries;
- capitals;
- maps;
- faces and names;
- AI terminology;
- business/corporate vocabulary;
- scientific vocabulary;
- mathematical terminology;
- arbitrary technical vocabulary.

Support user-created/imported decks.

Prefer simple documented formats such as JSON and CSV where practical.

---

# Language learning

Learning content should allow combinations such as:

```text
German word → English word
English word → German word
spoken word → written word
spoken word → translation
image → foreign-language word
foreign-language word → image
```

The architecture must allow arbitrary language pairs rather than assuming German↔English.

Audio should be optional.

Audio sources may include:

1. bundled recordings;
2. browser/device speech synthesis;
3. optional downloadable audio packs;
4. later optional AI/TTS providers.

Bundled audio is the only mode that should be described as guaranteed offline.

Browser speech synthesis availability and quality vary by browser/device and must therefore be treated as best effort.

---

# Geography

Use the generic learning infrastructure for geography.

Possible exercises include:

```text
flag → country
country → capital
capital → country
country → map position
map position → country
country → neighbouring countries
country → continent/region
```

Geographic content should be data-driven and reusable by multiple games.

---

# Faces & Names

Use synthetic or appropriately licensed faces rather than unauthorized real-person datasets.

Exercises may include:

```text
face → name
name → face
face → profession/context
face → name + contextual association
```

Encourage optional mnemonic association rather than relying purely on repeated exposure.

---

# Spaced repetition

The generic learning system may implement spaced repetition.

It must not become an engagement mechanism.

No:

- streaks;
- guilt messages;
- mandatory daily sessions;
- push notifications by default.

A user may simply open:

`Items worth reviewing`

when desired.

---

# Laser Circuit

Build an independent puzzle game around light routing.

Potential elements:

- lasers;
- mirrors;
- splitters;
- prisms;
- colour filters;
- blockers;
- sensors;
- switches;
- lenses;
- one-way optical components.

Example goals:

```text
hit one target
hit several targets
combine colours
avoid forbidden sensors
use a limited number of components
activate targets simultaneously
```

Share suitable rendering/beam logic with other game systems when this reduces duplication.

---

# Local AI

AI is optional.

No core game may require an external paid API.

Provide a generic AI abstraction allowing implementations such as:

```text
Deterministic evaluator
Local WebLLM
Optional future remote provider
```

Prototype WebLLM for tasks such as:

- communication feedback;
- audience adaptation;
- summary evaluation;
- semantic comparison;
- generation of communication scenarios;
- generation of learning material;
- optional hints.

Do not automatically download large models.

Before downloading a local model, show:

- model name;
- approximate download size;
- local storage requirement;
- WebGPU requirement;
- expected limitations.

Users must explicitly initiate model installation.

The app must remain useful without AI.

For communication tasks, deterministic checks should handle anything that can be reliably measured, including:

- length;
- missing required information;
- readability;
- obvious jargon;
- key concepts;
- call to action;
- explicit risk/decision requirements.

An LLM should supplement rather than replace these checks.

---

# Strategy engine

Do not build a Command & Conquer clone.

Create an original turn-based strategy game with a shared simulation layer.

Core differentiators should include:

## Simultaneous planning

Both sides plan actions.

```text
PLAN
↓
LOCK
↓
RESOLVE
```

Actions are then resolved simultaneously.

## Command and communication network

Units are not assumed to receive perfect instantaneous commands.

Command infrastructure may include:

- HQ;
- command vehicles;
- relay vehicles;
- relay towers;
- drones;
- scouts;
- engineers;
- electronic-warfare units;
- jammers.

Units inside command coverage can receive new commands.

Units outside coverage follow previously configured standing orders.

Example doctrines:

```text
advance
hold
retreat below X health
prioritize armor
escort unit
seek cover
protect relay
```

Enemy electronic warfare may disrupt communication.

This makes information, communication coverage and command resilience strategic resources.

## Other strategic dimensions

Include trade-offs between:

- economy;
- territory;
- production;
- mobility;
- research;
- intelligence/reconnaissance;
- communication;
- static defense;
- mobile military power.

---

# Shared Strategy / Tower Defense engine

Do not build separate implementations for TD and strategy.

Create a shared engine containing:

```text
map
terrain
pathfinding
units
towers
production
projectiles
combat
economy
research
command network
status effects
AI
simulation
serialization
```

Modes compose these systems differently.

---

# Tower Defense

Do not limit the game to several nearly identical towers.

Start with a compact but strategically distinct tower set.

## Gun

General-purpose tower.

Possible upgrade branches:

```text
Gatling → rate of fire
Cannon → armor penetration
```

## Artillery

Slow projectile / area damage.

Branches:

```text
Howitzer → range
Mortar → splash
```

## Laser

Continuous or beam damage.

Branches:

```text
Focus → single-target damage
Prism → chain/reflection
```

## Support

Examples:

- slow;
- repair;
- targeting bonus;
- shield;
- command relay;
- power support.

## Specialist

Examples:

- EMP;
- anti-drone;
- jammer;
- anti-shield;
- debuff.

Tower upgrades should create meaningful trade-offs rather than simple numerical progression.

---

# Strategy / Tower Defense hybrid

Implement four conceptual modes.

## External Small

An external attack enters the map and splits toward both bases.

```text
         EXTERNAL FORCE
               |
            SPLIT
           /     \
        YOU     ENEMY
```

Defense is primarily performed through towers.

The two players indirectly affect each other because their ability to absorb their branch of the external force influences the overall situation.

## External Large

A larger external force attacks both sides.

Both sides additionally deploy their own mobile defending force.

The available mobile force depends on production capacity.

Friendly and opposing mobile defenders therefore temporarily fight a common external threat indirectly.

Surviving forces then continue according to the final scenario rules and may interact with opposing towers or later phases.

This creates temporary aligned incentives without turning the sides into allies.

## VS Small

Both players manufacture attack waves.

Their waves do not fight one another.

Each wave attacks the opposing tower defenses, potentially sequentially.

The strategic contest becomes:

```text
economy
vs
wave production
vs
tower defense
```

## VS Large

Both mobile forces move toward one another.

```text
YOUR FORCE ───► ◄─── ENEMY FORCE
                   |
                 battle
                   |
              surviving side
                   |
                   ▼
             enemy defenses
```

The forces fight first.

Only one side's surviving units continue.

Those survivors must then defeat the opposing static defenses.

This creates interconnected investment choices between:

```text
production capacity
unit quality
army composition
tower defense
economy
research
command infrastructure
```

---

# Point-and-click adventure framework

Implement at least two substantial original adventures.

Do not make them primarily reflex or combat games.

Core interaction should revolve around:

- observation;
- exploration;
- inventory;
- combining objects;
- environmental puzzles;
- deduction;
- dialogue clues;
- spatial reasoning;
- causal reasoning.

Create reusable adventure infrastructure for:

```text
scenes
hotspots
inventory
items
dialogue
flags/state
puzzle state
scene transitions
save/load
audio
localization
```

---

# Adventure A — dark fantasy exploration

Create an original dark-fantasy point-and-click adventure inspired only by the broad exploratory atmosphere of late-1990s fantasy adventure games such as King's Quest VIII.

Do not reproduce its story, masks, characters, locations or lore.

Desired qualities:

- mysterious interconnected world;
- environmental storytelling;
- ruins and unusual mechanisms;
- NPC clue chains;
- inventory puzzles;
- object combinations;
- logic puzzles;
- multiple regions with different puzzle styles;
- some puzzles spanning several locations;
- optional paths and discoveries.

Combat, if present at all, should be lightweight and secondary.

Progress should mainly come from understanding the world and solving problems.

---

# Adventure B — temporal science-fiction adventure

Create an original science-fiction point-and-click adventure centered around manipulation of time.

Time is not merely narrative decoration; it is the central puzzle system.

Implement concepts such as:

## Pause

Freeze environmental systems while allowing selected player interactions.

Example:

Pause machinery at a safe point and cross it.

## Slow time

Reduce the speed of environmental processes.

Example:

Slow a rapidly closing security system long enough to perform several actions.

## Fast forward

Accelerate a process.

Examples:

- plant growth;
- machine cycles;
- chemical changes;
- weathering;
- charging systems.

## Rewind

Reverse selected objects, machines or local scene states.

Examples:

- reconstruct a broken mechanism;
- return an object to its earlier position;
- reverse destruction;
- undo a machine cycle.

Rewind should not simply function as an unlimited generic game undo.

It is a puzzle mechanic operating under defined world rules.

## Time travel

Allow movement between substantially different temporal states or eras.

Actions in one period may change another.

Potential puzzles:

```text
plant something in the past
→ use the mature object in the future

damage/remove an obstruction in one era
→ open a route in another

observe a historical event
→ obtain information needed in the present
```

## Combined temporal puzzles

Later puzzles should require combining temporal powers.

Example:

```text
rewind mechanism
→ pause it
→ move component
→ fast-forward secondary process
→ release pause
```

The system needs explicit causal rules so puzzles are understandable rather than arbitrary.

---

# Attention games

Attention exercises should not be falsely marketed as proven general attention-span enhancement.

They are exercises using sustained/selective attention.

## Signal Watch

Quietly observe a stream of stimuli and react only to defined targets.

Sessions should have explicit lengths.

## Deep Read

Read a meaningful text and answer questions about:

- main argument;
- details;
- structure;
- contradictions;
- evidence.

Optionally require a concise summary.

## Distractor Control

Present irrelevant tempting UI elements while the actual task remains unchanged.

Ignoring irrelevant stimuli is the correct action.

The design itself must not become irritating or manipulative.

---

# Communication games

## Audience Switch

Present the same information for different audiences.

Examples:

```text
developer
project manager
customer
executive
child
domain expert
layperson
```

Evaluate whether the response contains what the selected audience actually needs.

## Compression Challenge

Transform information between levels:

```text
500 words
→ 100 words
→ 3 bullets
→ 1 sentence
```

Also support expansion where insufficient detail must be added.

## Briefing Game

Given a situation, create an actionable briefing with:

- context;
- relevant facts;
- uncertainty;
- risks;
- decision required;
- next action.

## Ambiguity Detector

Identify missing information in statements such as:

`Please finish this tomorrow.`

Possible missing dimensions include:

- exact deliverable;
- deadline;
- intended audience;
- expected format;
- priority;
- acceptance criterion.

---

# Localization

Follow the general multilingual architecture successfully used by Home Workout.

Initial UI locales should match it:

```text
German
English
Dutch
Spanish
French
Russian
Simplified Chinese
Korean
Japanese
Arabic
Portuguese
Italian
Polish
Turkish
Ukrainian
Hindi
```

Use BCP-47-compatible locale identifiers.

Support right-to-left layout where required, especially Arabic.

## Separate UI and content languages

This separation is essential.

Example:

```text
UI language: German
learning language: Japanese
translation language: English
```

Changing the UI language must not change a user's learning deck.

Game content and UI chrome should have separate translation namespaces.

Do not assume German or English is always the content source language.

Fallback behavior must be explicit and tested.

Core game rules should not depend on translated strings.

---

# Public documentation

Maintain a high-quality README explaining:

- purpose;
- installation;
- PWA installation;
- local development;
- architecture;
- supported browsers;
- supported languages;
- offline behavior;
- AI behavior;
- privacy;
- licenses;
- contribution policy.

Also document major architectural decisions in ADRs or equivalent durable documentation.

Public documentation should primarily be understandable in English.

German documentation may additionally be provided.

---

# Accessibility

All reasonable games must support:

- keyboard;
- mouse;
- touch.

Use semantic HTML where appropriate.

Include:

- visible focus states;
- sufficient touch targets;
- reduced-motion support;
- accessible labels;
- screen-reader consideration;
- high-contrast-safe design.

Do not rely solely on colour for game-state information.

Games whose mechanics fundamentally depend on vision or audio should state that limitation clearly rather than pretending full accessibility.

---

# Impressum

The deployed site must use the same owner/imprint information as the existing Home Workout deployment.

Source of truth:

`https://home-workout-65g.pages.dev/`

Reference repository:

`https://github.com/hebecked/Home-Workout`

**Do not commit the personal Impressum data into the public repository.**

Do not merely create a committed legal file and assume obscurity protects it.

Preferred approach:

1. Commit only an Impressum page/template without personal data.
2. Store the actual legal values outside Git, for example as deployment environment variables/secrets.
3. Inject the values during the deployment build or render them through the Cloudflare deployment.
4. Ensure generated deployment output containing the values is not committed.
5. Ensure the publicly deployed Impressum remains directly reachable from every page.

A deploy-time script may read structured environment variables and produce the final page inside `dist/`.

`dist/` remains ignored.

Do not log personal legal fields during CI.

The Impressum must be reachable even if the application's primary language is not German. The legal German text may remain authoritative; the navigation label should be localized.

---

# Privacy

Prefer local-first functionality.

Core games should require:

- no account;
- no tracking;
- no advertising;
- no analytics dependency.

If optional network functionality is introduced, clearly disclose when data leaves the device.

AI functionality must explicitly distinguish:

```text
local model
vs
remote service
```

---

# PWA

Worthwhile Play must be installable.

The application shell and installed core games must operate offline after required assets have been cached.

Optional large content should use downloadable packs.

Examples:

```text
Geography Pack
Language Audio Pack
AI Vocabulary Pack
Business Vocabulary Pack
Additional Adventure
Local AI Model
```

Large downloads must always disclose approximate size before beginning.

---

# Persistence architecture

Create a common persistence layer.

Games should not each invent unrelated local-storage formats.

Prefer versioned save schemas.

Conceptually:

```text
GameSave {
  schemaVersion
  gameId
  gameVersion
  timestamp
  seed
  state
}
```

Support schema migration where reasonable.

Corrupt save data must not render the entire application unusable.

---

# Testing philosophy

Testing is part of development rather than cleanup.

Use:

- TDD;
- unit tests;
- integration tests;
- property-based testing;
- fuzzing;
- deterministic seed replay;
- mutation testing;
- solver verification;
- Playwright E2E;
- persistence/reload testing;
- PWA/offline testing;
- mobile testing;
- desktop testing.

## Property testing

Use properties rather than only example cases.

Examples:

Sokoban:

`A legal move never creates or destroys the player.`

Chess:

`Every generated legal move must leave the moving side in a legal board state.`

Connect Four:

`A completed move changes exactly one board cell.`

Strategy:

`Identical seed + identical state + identical commands produce identical simulation results.`

## Puzzle generation

Use:

```text
generator
↓
independent solver/validator
↓
valid?
↓
unique solution?
↓
difficulty analysis
```

Do not rely on a generator validating itself.

## Mutation testing

Apply selectively to important logic:

- game rules;
- solvers;
- validators;
- persistence;
- combat;
- simulation;
- command-network logic;
- puzzle generators.

Do not optimize mutation scores on presentation code merely for a metric.

## E2E

Playwright scenarios should verify:

```text
open game
start
perform actions
close/reload
resume
complete
```

Test:

- phone;
- tablet;
- desktop;
- keyboard;
- touch-compatible flows;
- offline mode.

The universal resume requirement deserves its own shared E2E contract test that every game must satisfy.

---

# AI testing

Never expect free-form LLM output to exactly equal a fixed string.

Prefer:

- JSON schemas;
- structural requirements;
- required concepts;
- forbidden concepts;
- deterministic metrics;
- semantic similarity;
- golden evaluation sets.

AI failure must degrade gracefully.

Core game progression must not become impossible because a local model fails.

---

# Multi-agent implementation model

Use a primary orchestrator.

The orchestrator owns:

- architecture;
- interfaces;
- backlog;
- sequencing;
- integration;
- regression management;
- design decisions;
- merge decisions.

Use independent feature agents for small games where practical.

Use dedicated fresh contexts for large systems such as:

- strategy/TD engine;
- point-and-click engine;
- temporal adventure;
- WebLLM integration.

Use a testing/QA context independently from implementation contexts where practical.

Feature agents must not independently modify shared core APIs.

Proposed shared-core changes must go through the orchestrator.

---

# Git workflow

Use one shared repository.

Concurrent agents should work on isolated branches/worktrees.

Example:

```text
feature/memory
feature/nonogram
feature/chess
feature/laser
feature/strategy-engine
feature/adventure-engine
feature/temporal-adventure
```

Merge only when required CI checks pass.

Shared code deserves stricter review than leaf game modules.

---

# CI quality gates

Before integration:

```text
license check
lint
typecheck
unit tests
property tests
coverage
targeted mutation tests
E2E
build
```

Use meaningful quality thresholds rather than gaming metrics.

---

# Cloudflare deployment

Target Cloudflare.

Use Vite + TypeScript.

The architecture may use Cloudflare Workers Static Assets or an equivalent current Cloudflare architecture.

The core application remains client-side.

A backend must not be necessary for ordinary play.

Any Worker functionality should remain optional infrastructure for things such as deployment/legal handling or future opt-in online services.

---

# Development sequence

Do not attempt every game simultaneously.

First establish:

```text
repository
CI
app shell
localization
GameModule contract
persistence
seeded RNG
PWA/offline behavior
shared tests
```

Then implement several small reference games:

```text
Tic-Tac-Toe
Mastermind
Memory
```

These should prove:

- module loading;
- persistence;
- localization;
- pause/resume;
- deterministic tests.

Then create the generic learning/deck infrastructure.

Then add puzzle games in parallel.

Chess can be developed independently once the board-game infrastructure is stable.

Build the strategy/Tower-Defense engine only after the general game architecture has stabilized.

Build the reusable point-and-click adventure engine before producing both large adventures.

Build the simpler fantasy adventure before the temporal adventure so the second adventure can reuse a proven scene/inventory/persistence architecture.

Integrate WebLLM after deterministic communication games already function without it.

---

# Definition of Done

A game is not finished merely because it renders and can be played once.

Each game must have:

- defined rules;
- automated tests appropriate to its complexity;
- localization support;
- deterministic reproduction where applicable;
- error handling;
- persistence;
- resume-after-close behavior;
- mobile usability;
- desktop usability;
- keyboard support where appropriate;
- touch support where appropriate;
- direct standalone URL;
- integration into the catalogue;
- documented offline/network requirements;
- documented important design decisions.

Most importantly:

**A user must always be able to stop playing without losing meaningful progress.**

Optimize for correctness, maintainability, useful play and user agency rather than engagement, monetization or maximum feature count.
