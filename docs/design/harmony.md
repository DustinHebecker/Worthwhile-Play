# Tones & Chords (`harmony`) — design

Status: **Plan (2026-10-27)**, written by the planner of the new-games pipeline (game 7 of the owner's list, working title "Harmony", marked *optional* by the owner; done before it: Best Plan, Estimation Lab, Probability Detective, Atlas Explorer, Sense of Time, Pond & Meadow; next: Balance Lab). The implementer follows it, and the reviewer checks the work against it. Numbers marked *(calibrate)* are first estimates. The implementer may tune them within the stated bounds. The **safety bounds of the audio engine (§ 9.4) are not tunable upwards.**

Scope for the implementer (feature agent, ADR 0006): `packages/games/harmony/` and `e2e/games/harmony.spec.ts`. The orchestrator creates `package.json` (dependencies `@wp/game-core`, `@wp/ui`), adds the registry line (appended after the existing games), adds the dependency in `apps/web/package.json`, draws the preview in `apps/web/src/previews.ts` (§ 19), adds the Stryker `mutate` lines (§ 1.3) and pastes Appendix A into `docs/third-party.md`. **There is no new npm dependency, no sample file, no font and no third-party audio.** Every sound is synthesised in the browser. No shared change is needed for the MVP.

Binding inputs: `CLAUDE.md`; the implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility" — including "Games whose mechanics fundamentally depend on vision or audio should state that limitation clearly", "Testing philosophy", "Definition of Done"); ADR 0002 (the contract); ADR 0003 including the 2026-10-24 amendment (§ 18.6); ADR 0006 (roles); ADR 0011 (per-locale content, `preload`); ADR 0017 (start screen, `settings`, `settingsOf`, `begin`); ADR 0021 (mutation budget, `*.slow.test.ts`). The stack-duel physics note of the pipeline brief does not apply, because no physics is reused.

---

## 1. Survey: overlap and reuse

### 1.1 Overlap with the catalogue

None of the 53 registered games makes a sound. Only Memory and Review can read text aloud with speech synthesis (`audio: 'optional'`). No game asks about music.

| Game | Relation | Consequence |
|---|---|---|
| Memory, Review (`learning-content/src/speech.ts`) | The only audio in the app: best effort, only on a button press, hidden when unavailable. | The **same policy** applies here: sound only on a gesture, never required, with a graceful path when sound is unavailable. Speech synthesis is not used. |
| Sequence Memory, n-back | Short-term memory of sequences. | "Which note changed?" (§ 7.4) uses auditory memory. There is no overlap in content. |
| Probability Detective, Sense of Time, Pond & Meadow | Round of N items: answer, review, a calm summary; "Skip — just show me"; `reported` guard; per-locale content (ADR 0011). | The **round shape, review tone and summary** are copied from them. Games never import each other. |
| Pond & Meadow | Explore mode with no natural end; display preferences in the game. | The keyboard mode (§ 7.7) follows the same pattern. |

This game fills two gaps: the **first auditory skill** in the catalogue (listening) and the **first music content**. It also has a complete silent path (§ 8), so deaf and hard-of-hearing players get a music-theory and notation game instead of a locked door.

### 1.2 What is reused

- `@wp/game-core`: `GameModule`, `defineGame`, `createRng`, `normalizeSeed`, guards (`isRecord`, `isInt`, `isArrayOf`, `isOneOf`, `isUint32`), `createLocaleContent`, `SettingSpec`, `bcp47Tag`.
- `@wp/ui`: `h`, `clear`, `announce`.
- `@wp/testing`: `runGameContract`, `startGame`, `chooseSetting`, `submitStart`, `expectResumeAfterReload`, `readSave`.
- **Patterns copied:** the review layout, skip semantics and `reported` guard of Probability Detective; the `content/index.ts` loader table (`preloadContent`/`contentFor`) of Estimation Lab; the display preferences box (`context.preferences`) of Atlas Explorer; the "chart stays LTR in RTL" rule of Sense of Time and Pond & Meadow; the plural-form pattern of Probability Detective (its design § 17.4).

### 1.3 Optional shared changes (report to the orchestrator; not needed for the MVP)

1. **Mutation targets** (orchestrator-owned `stryker.config.json`): add `packages/games/harmony/src/theory.ts`, `src/spelling.ts`, `src/generate.ts`, `src/rhythm.ts` and `src/audio/schedule.ts`. `rules.ts` is already covered by the glob. Never add `src/audio/engine.ts`, which is a thin wrapper and is unit-tested with a fake context (§ 20.2).
2. **A shared `packages/audio`.** `docs/architecture.md` lists a future shared `audio` package. The engine of § 9 is written against a small `AudioContextLike` interface, has no game imports and could move there unchanged when a second game needs sound. Recommendation: keep it in the game until then (ADR 0006: a feature agent adds no shared package).
3. **"Sound optional" on the catalogue card.** The spec ("Public-first design") asks the home page to say whether audio is optional or required. `capabilities.audio` exists, but the shell does not display it yet. A small host change could show "Sound: optional" for Memory, Review and this game. It is not needed for this game.
4. **Skills.** The game uses `attention` (focused listening, comparing) and `learning` (intervals, chords, notation; § 2). A `listening` skill would describe it better, but it would touch the catalogue grouping and its translations in 16 locales. This is not proposed now.

---

## 2. Identity

| | |
|---|---|
| Package id | `harmony` (`@wp/game-harmony`), the owner's working title, used as a neutral id. URL `/games/harmony`. A later title change touches no saves. |
| English title | **Tones & Chords** (recommended, owner question 2) |
| German title | **Töne & Akkorde** |
| Other locales (draft; translators may adjust) | nl Tonen & akkoorden · es Notas y acordes · fr Notes et accords · ru Звуки и аккорды · zh-Hans 音与和弦 · ko 음과 화음 · ja 音と和音 · ar نغمات وأوتار (check: «أوتار» is the common word for chords, «تآلفات» the technical one) · pt Notas e acordes · it Note e accordi · pl Dźwięki i akordy · tr Sesler ve Akorlar · uk Звуки й акорди · hi स्वर और कॉर्ड |
| Tagline (en) | "Practise listening to music: intervals, chords, melody and rhythm — by ear, or by eye with notation and a keyboard." |
| Skills | `attention`, `learning` |
| `typicalMinutes` | `[5, 15]` |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Input | pointer, touch, keyboard |
| Capabilities | `offline: true`, `audio: 'optional'`, `aiOptional: false`, `webgpu: 'none'`, `network: 'none'`, `pauseable: true` |
| `stateVersion` | 1 |

**Why not "Harmony".** *har•mo•ny* is an existing commercial music-puzzle series on iOS (BorderLeap; *har•mo•ny 3* was Apple's free app of the week in 2015), and "Harmony: Relaxing Music Puzzle" is another music app. Using the name would invite confusion. "Tones & Chords" names what the player sees and hears, matches the catalogue's plain naming (Pond & Meadow), and is not, as far as a search showed (2026-10-27), the title of a known app or game. The nearest is "Ear training: notes and chords", a generic descriptive App Store title.

Other titles considered: "Music Workshop" / "Musikwerkstatt" (warm, but vague); "Ear & Eye" / "Ohr & Auge" (says both modes, but does not say "music"); "Listening Room" / "Hörraum" (excludes the silent path).

---

## 3. Pitch and honest value

**Pitch.** Two notes sound. Are they far apart or close together, bright or dark, at rest or pulling somewhere? You listen as often as you like, choose, and then see what you heard: on a staff, on a keyboard, and as a frequency ratio with a picture of the combined wave. Chords get their colour (major, minor, …), melodies get their shape, rhythms become a grid you can read. With "Build it", you make the interval or chord yourself on the keyboard and hear the result. With the free keyboard, you play and the game names what you play. There is no clock, no streak and no score to chase. You can play without sound at all: every question also exists as a picture.

**Claims we may make** (tagline, rules, catalogue):

- "Practise listening to music: intervals, chords, scales, melody and rhythm."
- "Practise reading notes on a staff and on a keyboard."
- "See why some sounds are heard as stable and others as tense: frequency ratios and wave pictures."

**Claims we never make:** "improves your brain/IQ", "gives you perfect pitch", "makes you musical", or that it replaces lessons. The rules text also says, in one line each:

- *"You can play without sound. By eye, you practise music theory and reading notation, not your hearing."* (This is the limitation statement that the spec's Accessibility section asks for.)
- *"This game uses the 12-note equal-tempered system of Western music. Many traditions, such as Arabic maqam, Turkish makam, Indian raga and Indonesian gamelan, use other intervals. 'Stable' and 'tense' describe how Western harmony usually hears them."*

---

## 4. Content and sound principles (binding)

1. **Western tonal theory, stated as such** (§ 3). Terms are the standard ones per language (Appendix B). No invented terminology.
2. **No song references.** Many ear-training courses teach intervals with famous songs ("the first two notes of …"). That is culture-specific, unfair across 16 locales, and borders on quoting copyrighted melodies. Explanations instead use semitone counts, steps on the staff, ratios and neutral descriptions marked as such ("often described as bright").
3. **Fair questions only.** Stability questions never compare intervals whose ranking is disputed (the perfect fourth; adjacent consonance classes; § 7.3). Rhythm options differ in at least the stated number of slots (§ 7.5). Every answer is a checked fact of theory (`theory.ts`), never a matter of taste.
4. **Sound is optional, gentle and on demand.** No sound plays without a gesture. The level is capped (§ 9.4), there are no sudden onsets (attack ≥ 15 ms), and no high or piercing tones (fundamentals 65–1,400 Hz, low-pass filter at 5 kHz). There is no background music and there are no "correct"/"wrong" jingles. Feedback is visual and textual only.
5. **No pressure.** No timers, no tapping in time, no reaction times, no streaks, no totals across rounds. Every question has "Skip — just show me". Playback can be repeated without limit and never counts against the player.
6. **Own work.** All text, notation drawings, the clef shapes and the synthesised timbres are made for the project. No music font, sample or sound library is used (§ 14.4).

---

## 5. Core loop and modes

**Core loop (one question):** read the question → press Play (as often as you like) or look at the picture → choose an answer → "Check" → see what it was: staff, keyboard, names, and "Listen: yours / the answer" to compare → next. After the last question, a calm summary (matched count, which pairs you mixed up, one tip per mix-up).

| Topic (`topic` setting) | Shown name (en) | One round |
|---|---|---|
| `intervals` (default) | **Intervals — how far apart?** | 10 questions (§ 7.1) |
| `chords` | **Chords & scales — what colour?** | 10 questions (§ 7.2) |
| `stability` | **Stable or tense?** | 10 questions (§ 7.3) |
| `melody` | **Melody — which way does it go?** | 10 questions (§ 7.4) |
| `rhythm` | **Rhythm — which pattern?** | 8 questions (§ 7.5) |
| `build` | **Build it** | 6 tasks on the keyboard (§ 7.6) |
| `keyboard` | **Free keyboard** | No natural end; play and see names, ratios and waves (§ 7.7) |

Round length *(calibrate within 6–12)*: a recognition question takes 20–40 s, so 10 questions take 5–8 minutes. A rhythm question is longer (each play lasts about 4 s, plus a count-in), so the round has 8. A build task takes 1–2 minutes, so the round has 6.

### 5.1 How the questions come: `senses` = `ear` | `eye`

| | **By ear** (`ear`, default) | **By eye** (`eye`) |
|---|---|---|
| Question | Sound only. The picture is hidden until "Check". "Show the picture" is available as a hint, recorded as `peeked` and named in the summary ("2 with the picture"), never penalised. | The picture is the question (staff, keyboard, grid, ratio). A Play button is still there and is optional. |
| What it practises | Listening | Theory and reading notation (stated honestly; § 3) |
| No sound available (§ 9.6) | The picture is shown automatically, with one line: "Sound is not available here, so this question is shown as a picture." The item is marked `peeked: 'no-sound'`, and the summary says so neutrally. **Sound off** (muted or volume 0, after review 2026-10-28): the picture stays hidden behind "Show the picture" with the line "Sound is off. Show the picture to answer; it is not counted as a hint."; pressing it records `peeked: 'no-sound'` (not `hint`), and the summary line reads "Shown as a picture because sound was off or not available: n". The state shape is unchanged. | Unchanged |

The start-screen hint for `senses` reads: "No sound, or playing silently? Choose 'By eye'. You can still press Play whenever you like."

### 5.2 Avoiding the "school test" feeling

- The frame is a **listening room**: a calm card, "Question 3 of 10", one short question, and large Play and option buttons.
- **"Skip — just show me"** on every question. A skipped question is not counted.
- Feedback uses symbols and words, not colours: ● "That's it" / ○ "Not this time — it was a minor third". There is no red and no cross. The review always offers "Listen: yours / the answer" (by ear and by eye alike), so a mix-up becomes a comparison.
- **Easy level aids** (intervals, chords & scales, rhythm): each option has a small ▶ "hear this option" button (from the same starting note) before checking. This turns recognition into matching, which is a legitimate first step. On medium and hard, options can be heard only in the review.
- No percentages and no grades. The summary reports "7 of 10 matched", plus the mix-ups.

---

## 6. Settings (start screen) and `settingsOf`

```ts
const QUIZ_TOPICS = ['intervals', 'chords', 'stability', 'melody', 'rhythm', 'build'] as const;
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'topic', labelKey: 'topic.label', valueKey: 'topic',
    values: [...QUIZ_TOPICS, 'keyboard'], default: 'intervals', display: 'radio', hintKey: 'topic.hint' },
  { kind: 'choice', id: 'senses', labelKey: 'senses.label', valueKey: 'senses', values: ['ear', 'eye'],
    default: 'ear', display: 'radio', hintKey: 'senses.hint',
    when: { topic: ['intervals', 'chords', 'stability', 'melody', 'rhythm'] } },
  { kind: 'difficulty', default: 'easy', when: { topic: [...QUIZ_TOPICS] } }
];
```

- `build` hides `senses`. The task is text ("Build a major chord on F"), the keyboard and staff are always visible, and sound follows the mute switch.
- `keyboard` hides `senses` and the difficulty.
- Difficulty labels (en): easy "Easy — few, very different answers; hear the options before choosing", medium "Medium — more answers that are closer together", hard "Hard — all answers, more directions and inversions". What each level means per topic is in § 7.
- `settingsOf(state)` returns `{ topic }` plus `senses` and `difficulty` when they apply. The contract's "Another round with `settingsOf`" holds, because a round is fully determined by seed and settings.
- `newGame` treats `settings` as untrusted (anything missing or invalid falls back to the defaults). `begin` is irrelevant (there is no intro screen).
- **Display preferences** (stay in the game, `context.preferences`; § 12) are not settings: volume, mute, note-name system, "Play each new question automatically", count-in for rhythm, keyboard size.

---

## 7. The topics (pure generation in `src/generate.ts`; theory in `src/theory.ts`)

Pitch model: MIDI numbers for sound (`f = 440 · 2^((m − 69)/12)`, A4 = 440 Hz, **12-tone equal temperament**; § 9.1) and *spelled* pitches for notation and names, `{ l: 0..6 (C..B), a: −1 | 0 | 1, o: 2..6 }` (scientific octave, C4 = middle C = MIDI 60). `spelling.ts` converts and spells (§ 7.8).

**Registers** (comfortable to hear, one staff to read): treble items keep every note in **C4–A5** (MIDI 60–81; 262–880 Hz; at most one ledger line). Build tasks give their note in C4–B4 and accept answers up to B5 (the desktop keyboard's range). Cadences use a grand staff, with the bass in **E2–C4** and the upper voices in C4–A5. Stability dyads keep the lower note in **C4–G4**, because low thirds sound rough (critical bandwidth; Plomp & Levelt 1965), and a register-dependent answer would be unfair.

**Root pool** (all topics): the 12 usual key spellings C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B. Spelling rule: no double accidentals, and (below hard) no E♯, F♭, B♯ or C♭. The generator draws another root when a spelling would break the rule. This is deterministic, because the rng loop is bounded and C always works.

**Fairness rules for every round** (property-tested, § 20.1):

- The answer is among the options, and the options are distinct.
- No answer value occurs more than ⌈N/k⌉ + 1 times in a round (k = number of possible answers).
- The same answer never occurs three times in a row.
- No two identical items occur in a round.
- Roots vary (no root twice in a row).

### 7.1 Intervals — "How far apart?"

| Level | Pool (options = the whole pool) | Directions |
|---|---|---|
| easy | M2, M3, P5, P8 | ascending, one note after the other |
| medium | m2, M2, m3, M3, P4, P5, M6, P8 | ascending; 30 % played together (harmonic) |
| hard | all 12 (m2 … P8, tritone included) | ascending, descending, together (⅓ each) |

- **By ear:** Play = note 1, then note 2 (or both together), 0.9 s each at the default pace. "Slower" doubles the length. "Together, then apart" is one press: the notes are played together, then one after the other.
- **By eye:** both notes on a treble staff (side by side, or stacked when "together"). Easy also marks both keys on the keyboard (● and the labels 1 and 2). Medium and hard show the staff only, with "Show on the keyboard" as a hint (`peeked`). The task is counting steps on the staff, or semitones on the keyboard.
- **Options** show the name and the size in small type: "major third · 4 semitones". Sizes are facts that help structure listening. They do not give the answer away by ear.
- **Review:** staff + keyboard with both notes; the name and semitone count; the ratio view (§ 11.3) with the nearest simple ratio and the equal-tempered deviation (Appendix C); "Listen: yours / the answer" (from the same starting note); and the mix-up tip from the content when the choice was wrong ("minor and major third: 3 vs 4 semitones; the major third is often heard as brighter").

### 7.2 Chords & scales — "What colour?"

| Level | Chords (options) | Scales (options) | Share |
|---|---|---|---|
| easy | major, minor; root position | — | chords only |
| medium | major, minor, diminished, augmented; root position | major, natural minor | 70 % chords, 30 % scales |
| hard | + dominant 7th, major 7th, minor 7th; triads also in 1st/2nd inversion (the quality is still the question) | + harmonic minor, major pentatonic | 70 % / 30 % |

- **By ear:** a chord is played as a block (1.2 s), then as a broken chord (notes one after another), then as a block again. Scales play ascending, tonic to tonic, at 0.35 s per note.
- **By eye:** stacked notes on the staff. Easy and medium also show the keyboard. The task is counting the third sizes (4 + 3 major, 3 + 4 minor, 3 + 3 diminished, 4 + 4 augmented). Scales are shown on the staff, with step sizes shown in the review.
- **Review:** chord on staff and keyboard, chord tones by name with the stacked third sizes ("C – E: 4, E – G: 3"), the chord symbol (C, Cm, C°, C+, C7, Cmaj7, Cm7), and a comparison of yours and the answer (from the same root).

### 7.3 Stable or tense?

| Level | Item type | Pairs (first vs second, order random) |
|---|---|---|
| easy | Two intervals, "Which sounds more stable, more at rest?" | {P8, P5} vs {m2, M7, tritone} |
| medium | as easy, plus … | {M3, m3, M6} vs {m2, M7, tritone}; {P8, P5} vs {M2, m7} |
| hard | 60 % interval pairs (all of the above); 40 % **cadences**: "How does this phrase end?" — *finished* / *open* / *surprise* | — |

- **Excluded on purpose:** the perfect fourth (its classification depends on context in Western theory), pairs from adjacent classes (perfect vs imperfect, imperfect vs mild dissonance), and the minor sixth. Listeners and theorists disagree on these, so they are not asked. The fixed classes follow common-practice theory: perfect consonances P8, P5; imperfect consonances M3, m3, M6 (m6 left out); mild dissonances M2, m7; sharp dissonances m2, M7, tritone.
- **Cadences** (major keys, root pool; four block chords, 1.1 s each; textbook close-position voicings relative to the tonic T, with the bass in octave 2/3):
  - *finished*: I – IV – V – I
  - *open* (half cadence): I – IV – I – V
  - *surprise* (deceptive): I – IV – V – vi
  - Tonic T₄ is drawn from the root pool within C4–A4 (MIDI 60–69), so the upper voices stay ≤ A5.
  - Voicings (upper voices in semitones above T₄; bass relative to T₄):
    - I = bass −12, upper 4·7·12 (E G C);
    - IV = bass −7, upper 5·9·12 (F A C);
    - V = bass −5, upper 2·7·11 (D G B);
    - vi = bass −3, upper 0·4·12 (C E C: the third doubled, as usual in a deceptive cadence).
  - Tested for every progression and key: each upper voice moves by ≤ 3 semitones, and no two voices move in parallel fifths or octaves. (A first draft with vi = 4·9·12 failed this: G → A in the alto parallel to the bass.)
- **By ear:** "First", pause, "Second" (each dyad 1.5 s, together). Cadences: the four chords.
- **By eye:** each dyad on a staff with its reference ratio ("3 : 2") and the wave picture (§ 11.3): a short, regularly repeating pattern versus a long, irregular one. The rules say plainly that by eye this is the theory and the physics of the sound, not hearing. Cadences by eye: the grand staff with chord names in letters ("C F G C — in C major"). The player decides whether the last chord is the home chord.
- **Review:** classes in words ("perfect consonance" vs "sharp dissonance"), both ratios, both wave pictures side by side, and one honest line: "Most listeners who grew up with Western music hear the first as more at rest. This preference is partly learned (McDermott et al. 2016)." Cadences: chord names and Roman numerals, plus a one-sentence explanation per type.
- Note for the content writer: say "stable / at rest" and "tense / pulling", never "pleasant" or "ugly".

### 7.4 Melody — "Which way does it go?"

| Level | Item | Options |
|---|---|---|
| easy | 3 notes from a major scale, steps of 2–5 semitones, no repeated note | the 4 contours ↗↗, ↘↘, ↗↘, ↘↗ (drawn as dot-and-line pictures) |
| medium | 5 notes from a major scale, steps of 1–4 scale degrees, at least one leap of ≥ 3 degrees, no repeated note | 4 drawn contours: the correct one, plus 3 distinct distractors, each differing from it in ≥ 1 direction |
| hard | "Which note changed?" Melody A (5 notes, as medium), then melody B = A with **one** note at position 2–5 moved by 1–3 semitones (it may leave the scale) | positions 2, 3, 4, 5 |

- **By ear:** 0.5 s per note. Hard plays A, a 1 s pause, then B. "Play A" and "Play B" are also offered separately.
- **By eye:** easy/medium: the melody on the staff, choose the contour. Hard: melody A on the staff and melody B as note names in text; which position differs? (This is reading practice: staff to names.)
- **Review:** the staff with the contour drawn over the noteheads, and both versions in hard, with the changed note marked by ◆ and named ("4th note: E → E♭").

### 7.5 Rhythm — "Which pattern?"

One bar of 4/4 on an eighth-note grid (8 slots). A pattern is a list of durations in eighths: positive values are notes and negative values are rests, and the sum is 8. It is composed from **beat cells**:

| Level | One-beat cells | Two-beat cells | Options | Min. distance between options |
|---|---|---|---|---|
| easy | `[2]`, `[1,1]` | `[4]` | 3 | ≥ 2 slots |
| medium | as easy | `[4]`, `[3,1]`, `[1,2,1]` (syncopation) | 4 | ≥ 2 slots |
| hard | + `[-1,1]`, `[-2]` (rests) | + `[-2,2]`, `[2,-2]` | 4 | ≥ 1 slot |

- Slot vector: each slot is *onset*, *held* or *silent*. Distance = the number of differing slots. Patterns start with a note on beat 1 (no rest first) on easy and medium.
- **By ear:** 80 BPM *(calibrate 70–90)*. An optional count-in of 4 soft ticks (preference, default on; the ticks are an octave higher and at half level). Notes are sustained for 85 % of their value on one pitch (G4), so rests are audible as silence. "Slower" plays at 60 BPM. Scheduling uses the audio clock (§ 9.3), so the timing is exact regardless of input latency, and nothing is tapped.
- **Options** are grids: 8 boxes labelled "1 & 2 & 3 & 4 &". An onset is a filled box with ●, a held note is a bar "━" running from the onset, and a rest is an empty box with "·". This is not colour-only information.
- **By eye:** the pattern is shown in standard notation (§ 14.3). Choose the grid that matches it. This is reading rhythm notation. For screen readers the notation is named by its note values in the locale's standard terms, runs of equal values counted ("Rhythm in notation, 4/4 time: quarter note, 2 eighth notes, quarter rest, quarter note"; de "Viertelnote, 2 Achtelnoten, Viertelpause, Viertelnote"), while the options keep the grid text ("1: note, &: held, 2: note, …"). The two never share a phrase, so a screen-reader user also has to place the values on the beats instead of matching strings.
- **Review:** notation and grid aligned, counting syllables under the notes, and "Listen: yours / the answer".

### 7.6 Build it (keyboard tasks; identical with and without sound)

| Level | Task | Correct when |
|---|---|---|
| easy | "Play a [interval from the medium pool] up from [note]": choose one key within the octave above the given note (shown with ●) | the exact MIDI note |
| medium | "Build a [major / minor / diminished / augmented] chord on [root]": the root is fixed. Select the other notes in any octave | pitch-class set equality |
| hard | 50 %: seventh chords (dominant 7th, major 7th, minor 7th) on a root; 50 %: scales (major, natural minor, harmonic minor) from a tonic, choosing 7 keys | pitch-class set equality |

- Selected keys toggle (●, `aria-pressed`) and appear on the staff live, spelled by `spelling.ts` relative to the task.
- "Check" once. The review marks each key ✓ "belongs", ✗ "not in this chord" or ○ "missing", by symbol and word, and shows the correctly spelled answer ("F – A – C"). "Listen: yours / the answer".
- A key sounds when pressed, unless muted. This is a gesture, so it is allowed.

### 7.7 Free keyboard (`topic: 'keyboard'`; no `finished()`)

- Two octaves on desktop, one on phones (octave buttons ◀ ▶; § 15). There are two key modes: **Play** (a key sounds and is shown while pressed) and **Hold** (keys toggle, so chords can be built; "Clear").
- **Name panel** for the held notes (pure `recognise(pcs, bass)` in `theory.ts`):
  - 1 note: its name.
  - 2 notes: the interval name, ratio and cents.
  - 3–4 notes: the chord quality and inversion, if known ("C major, first inversion"); otherwise "no common chord name" plus the intervals above the lowest note.
- **Scale overlay** (choice of tonic and scale): the scale's keys are marked with a small "•" and its degrees 1–7. This is not colour-only.
- **Tuning toggle:** "Equal temperament / Pure ratios (relative to the lowest held note)". This affects playback and the wave picture only in this mode. With two held notes in pure tuning, you can hear the difference, for example the beating of the equal-tempered major third against 5 : 4.
- **Wave picture** of the held notes (§ 11.3).
- The state holds the held notes, the visible octave, the tuning and the overlay (§ 13). There is no score and no end. The host's "New game" leads to the start screen.

### 7.8 Spelling (`src/spelling.ts`, pure)

- **Interval steps by letter:** m2/M2 = 1, m3/M3 = 2, P4 = 3, tritone = 3 (augmented fourth) or 4 (diminished fifth), P5 = 4, m6/M6 = 5, m7/M7 = 6, P8 = 7. The upper letter is the root letter + steps. The accidental is the required semitones minus the natural distance. The tritone is always spelled as an augmented fourth (C–F♯, D♭–G, E♭–A, B♭–E …). Ten of the twelve pool roots give single-accidental spellings below hard; F♯–B♯ and B–E♯ occur only on hard. Descending, it is written down a fourth (C down to G♭).
- **Descending:** the given note is the upper one, and the lower note is spelled by the same rule.
- **Chords:** stacked thirds (letter + 2 each) from the root. Seventh chords add letter + 6. Inversions reorder the octaves only.
- **Scales:** one note per letter (heptatonic). Major pentatonic = degrees 1 2 3 5 6 of major.
- Properties (tested): the pitch class always matches the MIDI note; the letter distance always matches the interval number; there are no double accidentals; every interval and chord quality has ≥ 6 valid roots in the pool.

---

## 8. The silent path: the equivalent for every task

| Task | By ear presents | By eye presents instead | Both show in the review |
|---|---|---|---|
| Interval | 2 notes, melodic/harmonic | staff (easy: + keyboard marks) | staff, keyboard, name, semitones, ratio + cents, wave picture |
| Chord | block, broken, block | stacked notes (easy/medium: + keyboard) | staff, keyboard, chord symbol, third sizes |
| Scale | ascending scale | staff | staff, step pattern (W W H …, localised) |
| Stable/tense pair | two dyads | two staffs, ratios, wave pictures | classes in words, both ratios and waves |
| Cadence | 4 chords | grand staff + letter chord names + key | Roman numerals, explanation |
| Contour | melody | staff | staff with contour line |
| Changed note | A, then B | A on the staff, B as names | both staffs, changed note marked ◆ |
| Rhythm | count-in + pattern | notation | notation + grid + counting syllables |
| Build | — (text task) | identical | ✓ ✗ ○ marks, spelled answer |
| Free keyboard | sound on press | names, staff, ratio, wave | — |

No answer is ever decided by sound alone. Every question is answerable with sound off, muted, blocked or unsupported.

---

## 9. Audio engine (`src/audio/`)

### 9.1 Tuning: equal temperament (decision)

The game plays **12-tone equal temperament, A4 = 440 Hz**, everywhere except the explicit "Pure ratios" toggle of the free keyboard. Reasons:

1. Ear training prepares for the music people actually hear and play. Pianos, guitars, keyboards and most recordings are equal-tempered (or close to it).
2. Questions use random roots. Just intonation is defined relative to one tonic, and transposing it changes interval sizes (e.g. D – F in C just intonation is 32 : 27, not 6 : 5), so interval identities would wobble from question to question.
3. The keyboard and staff show 12 equal steps. Equal temperament keeps sound and picture consistent.

Just ratios are still taught, as the **explanation**: the review shows "close to 5 : 4 (equal temperament is 13.7 cents wider)" (Appendix C), and the free keyboard lets players hear both. This is honest about why the major third of a piano "beats".

### 9.2 Graph

```
per note:   OscillatorNode (PeriodicWave "soft", or "tick" for count-in)
              → GainNode (envelope)
              → bus GainNode (one per playback; fades in/out)
shared:     bus → BiquadFilter (lowpass 5 kHz, Q 0.7) → master GainNode (volume, ≤ 0.5)
              → DynamicsCompressor (safety limiter) → destination
```

- **Timbre** (`voices.ts`): one `PeriodicWave` built once per context, with harmonics 1–8 at amplitudes 1, 0.45, 0.25, 0.14, 0.08, 0.05, 0.03, 0.02 *(calibrate)* (`disableNormalization: false`, so the peak is ≤ 1). Harmonics matter here: the perceived consonance of complex tones comes partly from coinciding partials, which a pure sine lacks. The "tick" uses harmonics 1–3 with a fast decay. Notes are never sine-only, never square or saw.
- **Envelope per note** (seconds, *calibrate ±50 %*): from 0, a linear ramp to `peak` in 0.02; `setTargetAtTime(0.35·peak, t+0.02, 0.4)` (piano-like decay); at the note end, `setTargetAtTime(0, end, 0.05)`; `stop(end + 0.35)`. Every note starts and ends at gain 0, so there are no clicks. `cancelAndHoldAtTime` is not used (missing in Firefox).
- **Stopping** (Stop, a new Play, `pause()`, hidden tab): the current bus ramps to 0 over 0.03 s and is disconnected 0.1 s later. The next playback gets a new bus. No automation needs to be cancelled.
- No `AudioWorklet` (it would need an extra module file and CSP thought), no `MediaElement`, no network.

### 9.3 Scheduling (pure, `src/audio/schedule.ts`)

`playableFor(spec, variant, pace): Playable` turns an item into note events `{ midi | 'tick', start, dur, level }`, in beats with a tempo. `schedule(playable, t0)` turns those into absolute times and envelope parameters. The whole playback is scheduled up front on the audio clock (`ctx.currentTime + 0.06` lead). `setTimeout` is never used for musical timing, so the rhythm is exact even on a busy page.

- `peak = 1 / M`, where `M` is the maximum number of overlapping notes **including release tails** (computed by a sweep over the events). The sum of all voices therefore stays ≤ 1 before the master gain.
- The visual "now playing" highlight (the note or slot lights up) is cosmetic. A `requestAnimationFrame` loop compares `ctx.currentTime − (outputLatency ?? baseLatency ?? 0)` with the events. It is off under `reducedMotion`, where only "Playing…" is shown on the button. It is never state.

### 9.4 Hearing comfort and safety bounds (binding; tested)

| Bound | Value |
|---|---|
| Master gain ceiling | **0.5** (−6 dBFS). `master = 0.5 · (volume/100)²`, clamped to [0, 0.5] |
| Default volume | 50 → master 0.125 (≈ −18 dBFS) |
| Sum of voices before master | ≤ 1 (peak = 1/M, M including tails) |
| Attack | ≥ 15 ms. Bus fade-in 30 ms at every playback start, so there is no sudden onset |
| Fundamentals | 65–1,400 Hz (C2–F6). The generators stay inside this range (C4–A5 for most items), and the scheduler rejects anything outside it |
| Spectrum | low-pass at 5 kHz; harmonics ≤ 8 |
| Limiter | DynamicsCompressor: threshold −10 dB, knee 6, ratio 12, attack 0.003 s, release 0.25 s. This is a safety net only; the arithmetic bound above already holds |
| Volume change | ramp over 50 ms. Releasing the slider plays a soft preview tone (a gesture) at the new level |
| Longest playback | ≤ 8 s (rhythm with count-in, "Slower") |

The volume slider's hint says: "Start quietly, especially with headphones."

### 9.5 Context lifecycle, autoplay and browser quirks

- **Created lazily, inside a gesture.** The first Play press, option ▶ or key press calls `ensureContext()`, which constructs `new (AudioContext ?? webkitAudioContext)({ latencyHint: 'interactive' })` and calls `resume()` **synchronously within the handler** (iOS requires this). Nothing audio-related is constructed on load, on `newGame`, on `restore` or on render (view test). When muted, no context is created at all.
- **States:** if `resume()` leaves the state `suspended` (autoplay policy), the button shows "Tap again to allow sound". Safari's non-standard `interrupted` state (a phone call, another app's audio) and `suspended` during playback stop the playback indicator. The next gesture resumes. `closed` creates a new context on the next gesture.
- **Hidden tab / `pause()`:** stop all, then `ctx.suspend()`. `resume()` of the game does **not** restart the sound. `dispose()`: stop and `ctx.close()`.
- **iOS silent switch:** in Safari, Web Audio follows the ring/silent switch. The game **respects** it (owner question 3) and does not set `navigator.audioSession.type`. The help line says: "No sound? Check the volume and the silent switch, or choose 'By eye'."
- **Latency:** listening only. Key presses sound on `pointerdown`/`keydown` (not `click`) to save ~100 ms. Output latency (Bluetooth: 100–300 ms) does not matter, because nothing is judged in time.
- **Offline:** synthesis needs no files, so the game is fully offline.
- **CSP:** Web Audio needs no CSP change (no media element, no worklet, no `blob:`).

### 9.6 Availability

`audioSupport(win)` returns `'available' | 'unavailable'` (no constructor, or the constructor throws). If unavailable, Play buttons are hidden, by-ear items fall back to the picture (§ 5.1), and the sound bar shows "Sound is not available in this browser". `'blocked'` is a runtime condition (§ 9.5) and is shown on the button.

### 9.7 Interface for testing

`engine.ts` depends only on `AudioContextLike` (the subset used: `createOscillator`, `createGain`, `createPeriodicWave`, `createBiquadFilter`, `createDynamicsCompressor`, `destination`, `currentTime`, `state`, `baseLatency?`, `outputLatency?`, `resume`, `suspend`, `close`, `addEventListener('statechange')`) and receives the constructor by injection (`createEngine({ ctor, onState })`). The view passes the browser constructor, or `undefined`.

---

## 10. Scoring, summary and finish

- Per item: `matched: boolean` (choice index equals the answer, or the pitch-class set equals it, or the exact MIDI note for build-easy), `peeked: false | 'hint' | 'no-sound'`, or `skip`.
- **Round summary** (after the last item, "See summary"):
  - "7 of 10 matched" (skips are not counted; the line says "1 skipped").
  - "2 with the picture" (by ear only).
  - **Mix-ups:** the pairs of (answer, choice) that occurred, most frequent first, at most 3, each with its tip from the content ("major third ↔ minor third, 2×: count semitones, 4 vs 3; the major third is often heard as brighter").
  - One neutral closing line from the content per topic. There are no comparisons with earlier rounds and nothing is stored across rounds.
- `finished({ outcome: 'completed', stats: { matched, asked } })` once (`reported` guard). Reopening a finished save shows the summary.
- The host offers "Another round" or "Change settings". The game never starts the next round itself.

---

## 11. Explanation visuals

### 11.1 Staff (`src/staff.ts` pure layout; `src/staff-view.ts` SVG)

- Pure layout: the staff position of a spelled pitch (diatonic index = letter + 7 · octave; the treble clef's bottom line is E4, the bass clef's bottom line is G2), ledger lines, the stem direction (up below the middle line), accidental columns for chords (stacked seconds displace noteheads to the other side of the stem), and x positions. This is tested (§ 20.1).
- SVG drawn by code: 5 lines, noteheads as rotated ellipses (whole/half hollow, others filled), stems, ledger lines, accidentals ♯ ♭ ♮ as own paths, beams for eighth pairs (§ 14.3), rests (quarter, eighth, half) as own paths, and the treble and bass clefs as **own simplified paths** drawn by the implementer. They must not be traced from any font or image (§ 14.4).
- `dir="ltr"` and `role="img"` with an accessible name (§ 17). It scales with `viewBox`, and the minimum staff gap is 10 px on phones.

### 11.2 Keyboard (`src/keyboard-view.ts`)

- Keys are `button`s in pitch order, always left to right (`dir="ltr"` also in Arabic). White keys are ≥ 44 px wide. Black keys are drawn 62 % as wide but are ≥ 88 px tall. The piano layout is the essential presentation, as in WCAG 2.5.8's exception, and an **equal-size alternative** exists: the display preference "Note buttons" shows 12 equal buttons of ≥ 44 × 44 px in two rows (naturals, accidentals).
- Marks: ● selected/played, the labels 1/2 for interval notes, ✓ ✗ ○ in reviews, and • for scale overlay keys. Each mark has a text label in the button's accessible name.
- Roving `tabindex`, ← → by semitone, ↑ ↓ by octave, Space/Enter to press, Home/End. When the keyboard has focus (build and free keyboard), a physical computer keyboard plays by position (`KeyboardEvent.code`: KeyA = C, KeyW = C♯, KeyS = D, KeyE = D♯, KeyD = E, KeyF = F, KeyT = F♯, KeyG = G, KeyY = G♯, KeyH = A, KeyU = A♯, KeyJ = B, KeyK = C′). Physical codes work the same on QWERTY, QWERTZ and AZERTY. This mapping is never active outside the keyboard's focus, so screen-reader quick keys are not disturbed.

### 11.3 Ratio and wave view (`src/wave.ts` pure; `src/wave-view.ts` SVG)

- **Ratio:** the nearest simple ratio for the interval class (Appendix C), the cents of equal temperament and of the pure ratio, and the difference ("equal temperament: 13.7 cents wider than 5 : 4"). The tritone shows "no simple ratio (about 45 : 32)".
- **Wave picture:** the sum of the **fundamentals only** (stated in the caption), sampled over 16 periods of the lower note at 2 points per pixel, drawn as one polyline. Simple ratios repeat after a few periods (3 : 2 after 2 periods of the lower note), and complex ones do not within the window. The caption names it: "Repeats about every 2 waves of the lower note" / "No short repeat". The picture shows what is played (equal-tempered). The free keyboard's pure tuning shows the exact pure picture.
- Static and decorative-plus-caption (`role="img"`, the caption is the accessible name). No animation.

---

## 12. Display preferences (`context.preferences`, per device; never state)

| Key | Values | Default |
|---|---|---|
| `volume` | integer 0–100, step 5 | 50 |
| `muted` | boolean | `false` |
| `names` | `'auto' \| 'letters' \| 'german' \| 'solfege'` (§ 18.2) | `'auto'` (the locale default) |
| `autoplay` | "Play each new question when I press Next" (inside that gesture only) | `false` |
| `countIn` | rhythm count-in | `true` |
| `keys` | `'piano' \| 'buttons'` | `'piano'` |

All values are validated on read; junk falls back to the default. The sound bar (Play/Stop, "Slower", volume, mute) sits at the top of the question card. Mute is a toggle button with `aria-pressed` and the text "Sound on" / "Sound off".

---

## 13. State (plain JSON, `stateVersion: 1`) and migration

```ts
type Spelled = { l: number /*0..6*/; a: -1 | 0 | 1; o: number /*2..6*/ };
type IntervalId = 'm2'|'M2'|'m3'|'M3'|'P4'|'TT'|'P5'|'m6'|'M6'|'m7'|'M7'|'P8';
type ChordId = 'maj'|'min'|'dim'|'aug'|'dom7'|'maj7'|'min7';
type ScaleId = 'major'|'natural-minor'|'harmonic-minor'|'major-pentatonic';

type Spec =
  | { k: 'interval'; root: Spelled; ivl: IntervalId; dir: 'up'|'down'|'together'; options: IntervalId[] }
  | { k: 'chord'; root: Spelled; q: ChordId; inv: 0|1|2; options: ChordId[] }
  | { k: 'scale'; tonic: Spelled; s: ScaleId; options: ScaleId[] }
  | { k: 'pair'; first: { root: Spelled; ivl: IntervalId }; second: { root: Spelled; ivl: IntervalId } } // answer: the more stable
  | { k: 'cadence'; key: Spelled; c: 'finished'|'open'|'surprise'; options: ('finished'|'open'|'surprise')[] }
  | { k: 'contour'; notes: Spelled[]; options: string[] /* 'ud', 'uudu' */ }
  | { k: 'changed'; a: Spelled[]; b: Spelled[] }                       // options: positions 2..5
  | { k: 'rhythm'; options: number[][]; answer: number }               // durations in eighths, rests negative
  | { k: 'build'; task: 'interval'|'chord'|'scale'; root: Spelled; target: IntervalId|ChordId|ScaleId };

type Answer = { choice: number } | { keys: number[] /* MIDI, sorted, ≤ 12 */ };

interface Item {
  spec: Spec;                         // generated once from the seed and stored (saves survive generator changes)
  draft: Answer | null;               // the current, uncommitted choice (survives reload)
  answer: Answer | 'skip' | null;     // committed
  matched: boolean | null;            // stored at commit
  peeked: false | 'hint' | 'no-sound';
}

type HarmonyState =
  | { v: 1; topic: 'intervals'|'chords'|'stability'|'melody'|'rhythm'|'build';
      senses: 'ear'|'eye'; difficulty: 'easy'|'medium'|'hard'; seed: number;
      items: Item[]; index: number; reported: boolean }
  | { v: 1; topic: 'keyboard'; seed: number; held: number[] /* MIDI ≤ 12 */; base: number /* octave 2..5 */;
      mode: 'play'|'hold'; tuning: 'equal'|'just'; overlay: { tonic: number /* pc */; s: ScaleId } | null };
```

- `index === items.length` means the summary. `matched` is stored at commit, so a later theory fix never flips an old review.
- `isValidState(x)` never throws. It checks:
  - `v`, the topic and the union shape;
  - known ids; `Spelled` ranges; that the spelling is consistent (the letter distance and accidental give the stated interval, chord or scale; one shared checker, `spelling.ts`);
  - every pitch in the register bounds of § 7;
  - options distinct, answer present, pool members only for the level; rhythm patterns sum to 8 with valid cells;
  - `items.length` equal to the topic's round length;
  - `answer`/`matched` consistent (`matched === null` ⇔ not committed or skipped), and `matched` equal to the recomputed check;
  - `index ≤ items.length`, `reported ⇒ index === items.length`;
  - `held` distinct MIDI notes in range; `base` and `overlay` in range.
- **Determinism:** `generateRound(seed, topic, difficulty, senses)` is pure. `reset()` regenerates the same round (answers cleared). The free keyboard has no randomness (seed kept for the contract).
- **Transitions** (`rules.ts`, pure): `setDraft`, `commit`, `skip`, `peek`, `next`, `toSummary`, `markReported`; keyboard: `press` (play mode, no state change), `toggle`, `clear`, `setBase`, `setMode`, `setTuning`, `setOverlay`. `requestSave()` after each.
- **Migration:** `stateVersion` stays 1 while changes are additive. An incompatible change bumps it, with `migrateState`. An unmigratable save is reported as corrupt, which is acceptable: a round takes minutes.
- **No answer in the DOM before Check:** by ear, the item's notes are not rendered (not even hidden) until Check or "Show the picture". The Play button's accessible name never names the notes (view test).
- `pause()` stops the sound and blocks input. Nothing in the game runs on a timer.

---

## 14. Notation details and licences

### 14.1 Clef choice

Treble for items in C4–A5. Grand staff for cadences. Bass clef only in the free keyboard (below C4) and in build items whose root is below C4 (none at MVP: build roots are C4–B4).

### 14.2 Key signatures

Not used. Accidentals are written on each note, which is clearer for intervals and chords out of context. Scales by eye show accidentals per note too. The review names the key ("D major has F♯ and C♯").

### 14.3 Rhythm notation

A single-line percussion staff (no clef; a "4/4" time signature drawn as text digits in a `<text>` with the system font, which is allowed: no font file is shipped). Durations 1/2/3/4/6/8 eighths map to eighth, quarter, dotted quarter, half, dotted half and whole notes. Rests are −1 (eighth) and −2 (quarter). Eighths are beamed in pairs within a beat. A lone eighth gets a flag. The `[1,2,1]` syncopation is written as eighth – quarter – eighth (beat-crossing quarter allowed, matching common practice for this figure).

### 14.4 Fonts and glyphs (licence review)

- **No music font is shipped.** Bravura, Leland and Petaluma are under the SIL Open Font License 1.1, which is compatible with the project. However, (a) the full fonts are hundreds of kilobytes, (b) subsetting counts as a modification under the OFL, and Bravura declares "Bravura" as a Reserved Font Name, so a subset would need renaming and documentation, and (c) the few shapes needed are easy to draw. Decision: own SVG paths.
- **Unicode musical symbols** (𝄞 U+1D11E etc.) are not used for drawing. Many systems lack a font for them. The text symbols ♯ ♭ ♮ (U+266F, U+266D, U+266E) are used in labels and text. They are in common system fonts. A view test checks that the fallback text "#"/"b" is never shown.
- The reviewer checks that clef, rest and accidental paths are original. They should be geometric (circles, Béziers placed by hand), not converted from a font outline.

---

## 15. UI layout

### 15.1 Desktop (≥ 48 rem): question card (inline start, ≈ 3/5) and the picture panel (inline end, ≈ 2/5); keyboard full width below

```
┌───────────────────────────────────────────────┬─────────────────────────────┐
│ Question 3 of 10 · Intervals · By ear          │  (picture panel)             │
│ ┌ sound bar ──────────────────────────────────┐│  hidden by ear until Check:  │
│ │ [▶ Play]  [Slower]   🔈 ───●──── 50  [Sound on]││  "The picture appears after  │
│ └─────────────────────────────────────────────┘│   you check."                │
│ How far apart are the two notes?               │  [Show the picture] (hint)   │
│ ┌──────────────┐ ┌──────────────┐               │                              │
│ │ major second │ │ major third  │  (easy: ▶ on   │  after Check:                │
│ │ 2 semitones ▶│ │ 4 semitones ▶│   each option) │  staff with both notes        │
│ └──────────────┘ └──────────────┘               │  ratio 5 : 4 · +13.7 cents   │
│ ┌──────────────┐ ┌──────────────┐               │  wave picture + caption      │
│ │ perfect fifth│ │ octave       │               │  [Listen: yours] [the answer]│
│ └──────────────┘ └──────────────┘               │  tip                         │
│ [Check]          Skip — just show me            │  [Next]                      │
├───────────────────────────────────────────────┴─────────────────────────────┤
│  keyboard, 2 octaves (C4–B5), marks after Check                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Phone (360 px): one column; sound bar, question, options in a 2-column grid, picture, keyboard of one octave with ◀ ▶; a sticky bottom bar

```
┌──────────────────────────────┐
│ 3 of 10 · Intervals           │
│ [▶ Play] [Slower] [🔈] [Sound on]│  (volume opens a small popover slider)
│ How far apart…?               │
│ [major 2nd] [major 3rd]       │
│ [perfect 5th] [octave]        │
│ (picture after Check)         │
│ ◀ [C D E F G A B] ▶  7×44 px   │
├──────────────────────────────┤
│ [Check]   [Skip]              │  ← sticky
└──────────────────────────────┘
```

- All targets are ≥ 44 × 44 px (black keys: § 11.2). There is no horizontal scroll at 360 px. Seven white keys of 44 px make 308 px, which fits within the 328 px between the 16 px gutters. The sticky bar never covers the focused element (`scroll-padding-block-end`).
- Number keys 1–9 select options, Enter checks, P plays, and N moves to the next question. These shortcuts work only while focus is inside the game. They are listed in a "Keys" `<details>`.

---

## 16. Accessibility

- Native buttons, radios and range inputs. Options are a radio group (arrows; the draft is `aria-checked`). Keys are buttons with `aria-pressed` in hold and build modes.
- **Screen readers:** note names are spoken in words (§ 18.3: "C sharp 4", "Cis 4", "do dièse 4"). Intervals and chords are spoken as full names. The staff `role="img"` has a generated name ("Two notes: E 4, then G sharp 4"). The rhythm grid has a text form ("note on 1, held to 2; note on 3, on 'and', on 4"). The rhythm notation is named by its note values (§ 7.5), never by the grid text of the options.
- **Speech and sound do not compete:** nothing is announced while sound plays. Verdicts are announced politely after Check ("That's it: major third"). Play does not move focus.
- **By ear works for blind players** (sound plus spoken options). **By eye works for deaf players** (§ 8). The rules text states both honestly.
- No colour-only information: marks are symbols plus words, rhythm boxes use ● ━ ·, and stability classes are words.
- **Reduced motion:** no playback highlight animation, no key-press animation (a static state change only).
- **Forced colours:** strokes in `CanvasText`, keys outlined, marks remain glyphs.
- Focus: after Check, focus moves to the review heading; after Next, to the question heading; in build, it stays on the keyboard.

---

## 17. Performance and bundle budget

| Item | Budget |
|---|---|
| Round generation | ≤ 2 ms (rejection loops bounded at 200 draws per item; fallback to root C) |
| Staff render | ≤ 4 ms per staff; ≤ 2 staffs visible |
| Wave picture | ≤ 2 ms (≤ 800 samples) |
| Audio: nodes per playback | ≤ 40 oscillators (cadence: 16; scale: 8; rhythm: ≤ 12 with count-in). Each note is disconnected after its `ended` event |
| Time from Play press to scheduled start | 60 ms lead + output latency |
| Game chunk (code, theory tables, own SVG paths, en UI messages) | ≤ 100 KB minified, excluding the 16 UI catalogues |
| Content per locale (explanations, tips, glossary) | ≤ 25 KB minified via `preload` |
| Saves | < 6 KB per round |

---

## 18. Localisation

### 18.1 Files

- `src/messages.ts`: UI strings in 16 locales: `title`, `tagline`, `rules`, `difficulty.*`, setting labels and hints, topic and senses names, sound bar, option frames, review headings, mark words, summary lines, preferences, keyboard help. About 150 keys.
- `src/content/<locale>.ts` (ADR 0011, `CONTENT_LOADERS`, `preload`): interval, chord, scale and cadence names (full and short), consonance class names, step words (whole/half step), mix-up tips (≈ 30), per-topic closing lines, explanations, the limitation lines of § 3, and spoken note-name parts (§ 18.3). About 180 strings.
- en and de are written first by the implementer. The other 14 are AI-assisted (existing practice), using the **standard music terms** of Appendix B. A translator note at the top of `content/en.ts` says: standard terms only, no song references, "often heard as" for subjective descriptions.

### 18.2 Note-name systems (`src/notes.ts`, pure, tested)

| System | Naturals | Accidentals (visual) | Used by default in |
|---|---|---|---|
| `letters` | C D E F G A B | suffix ♯ ♭ (C♯, B♭) | en, nl, hi, ja, ko |
| `letters` (prefix) | C D E F G A B | prefix ♯ ♭ (♯C, ♭B) — Chinese convention (升C, 降B) | zh-Hans |
| `german` | C D E F G A **H**; **B = B♭** | names: Cis Dis Eis Fis Gis Ais His; Ces Des Es Fes Ges As **B** | de, pl (Polish uses the same system, written lower-case in theory; capitalised in the UI for consistency) |
| `solfege` (fixed do) | Do Re Mi Fa Sol La Si, in the locale's script | suffix ♯ ♭ | es, fr (Do Ré Mi Fa Sol La Si), it, pt (Dó Ré Mi Fá Sol Lá Si), ru (До Ре Ми Фа Соль Ля Си), uk (До Ре Мі Фа Соль Ля Сі), tr (Do Re Mi Fa Sol La Si), ar (دو ري مي فا صول لا سي) |

- **Defaults per locale:** en, nl, hi, ja, ko = `letters`; zh-Hans = `letters` with prefix accidentals; de, pl = `german`; es, fr, it, pt, ru, uk, tr, ar = `solfege`.
- ja and ko also use do-re-mi widely (ドレミ, 도레미), and their traditional letter systems (ハニホ…, 다라마…) are used mainly for key names. The default is `letters`, and native reviewers may switch it (one line in `notes.ts`).
- Dutch uses suffix names in speech (cis, bes) but B for B natural. The visual stays `letters` with ♯ ♭, and the spoken form uses the Dutch names (§ 18.3).
- Hindi speakers learning Western music commonly use letter names. Hindustani sargam (सा रे ग म प ध नि) is relative to the tonic, not a pitch name, so it is **not** used as note names. The Hindi content adds, in explanations only, the sargam step for intervals above Sa where it is unambiguous (e.g. major third = Sa → shuddha Ga).
- The preference `names` lets anyone choose `letters`, `german` or `solfege` (fixed do, in the locale's script; en uses Latin "Do Re Mi").
- **The German B/H trap is handled in one place:** `noteLabel(spelled, system)`. The `german` system maps B♭ → "B" and B → "H", B𝄫 never occurs, and `Hes` is never produced. This is tested exhaustively for all 21 single-accidental spellings.
- Octave numbers (scientific pitch, C4 = middle C) appear only on keys and in screen-reader names. The help explains "4 = the octave starting at middle C". German Helmholtz notation (c′) is not used, because the numbers are unambiguous across locales.

### 18.3 Spoken names

The content gives per locale the parts `{ sharp, flat, octave }` and, for systems with suffix names, the full names (de "Cis", nl "cis", pl "cis"). `spokenNote(spelled, locale, system)` builds, for example, en "C sharp 4", de "Cis 4", fr "do dièse 4", es "do sostenido 4", it "do diesis 4", pt "dó sustenido 4", ru "до-диез 4", ja "ド シャープ 4" / "C シャープ 4", zh "升C 4", ar "دو دييز ٤" (digits via `Intl.NumberFormat`), hi "C शार्प 4".

### 18.4 Numbers and plurals

Semitone counts, cents and ratios go through `Intl.NumberFormat(bcp47Tag(locale))`. Ratios are written "3 : 2" inside `<bdi dir="ltr">`. Counts with nouns ("4 semitones", "2 with the picture") use plural-category forms per locale (`Intl.PluralRules`). A content test asserts every category the locale reports.

### 18.5 RTL

Panels, text and the sound bar mirror (logical properties). **The staff, the keyboard, contour pictures, rhythm grids and wave pictures are not mirrored** (`dir="ltr"` on their containers): pitch rises left to right and time runs left to right in every locale. Labels inside them use `<bdi>`. In Arabic, the volume slider follows the page direction (a native range input), which is correct for a non-musical control.

### 18.6 Preview locales (ADR 0003 amendment)

Not planned: the game ships all 16 locales.

---

## 19. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, using the shared 96 × 64 viewBox, the classes, and light/dark via the tokens. The upper half shows a five-line staff fragment with two noteheads a third apart (one stem) and a small sound-wave arc to their right. The lower 40 % shows one octave of keyboard (7 white keys, 5 black keys), with two keys marked by dots. There is no text and no clef glyph (the clef is too small to read at this size), and the preview is not mirrored in RTL.

---

## 20. Test plan

### 20.1 Fast tests (TDD + fast-check; mutation-relevant)

Files: `test/theory.test.ts`, `test/spelling.test.ts`, `test/generate.test.ts`, `test/rhythm.test.ts`, `test/schedule.test.ts`, `test/staff.test.ts`, `test/rules.test.ts`.

- **Theory:**
  - interval semitones; chord and scale pitch-class sets (table tests);
  - `recognise` for every quality × inversion × root (exhaustive), and "no common name" for clusters;
  - ratio table and cents (Appendix C, to 0.1 cent);
  - `midi ↔ freq` (A4 = 440; octave doubling as a property).
- **Spelling (properties):**
  - pitch class matches MIDI; letter distance matches the interval number;
  - no double accidentals; no E♯/F♭/B♯/C♭ below hard;
  - ≥ 6 valid roots per interval and quality;
  - descending spelling mirrors ascending.
- **Note names:**
  - all 21 single-accidental spellings in every system;
  - German B/H mapping (B♭ → "B", B → "H", never "Hes"); Dutch spoken "bes";
  - zh prefix accidentals.
- **Generator (properties over seeds × topics × levels × senses):**
  - determinism; answer among the options; distinct options; pool membership per level;
  - the balance and no-three-in-a-row rules; no duplicate items; root variation;
  - register bounds; stability pairs only from the allowed class combinations (never P4, never adjacent classes);
  - cadence voicings: each upper voice moves by ≤ 3 semitones, with no parallel fifths or octaves between any two voices (bass included);
  - contour distractors distinct and ≠ the answer; changed melody differs in exactly one position by 1–3 semitones;
  - rhythm options pairwise ≥ the level's distance, durations sum to 8, cells from the level's set.
- **Schedule (properties):**
  - `peak · M ≤ 1` at every instant including tails, for every generated item and every pace (sweep check);
  - every envelope starts and ends at 0; attack ≥ 0.015 s;
  - fundamentals within 65–1,400 Hz; total length ≤ 8 s;
  - `master(volume)` monotone and ≤ 0.5 for all inputs including junk (NaN → default, < 0 → 0, > 100 → 100);
  - events sorted, no negative times; rhythm onsets exactly on the grid (`start = k · 60/bpm/2`).
- **Staff layout:** positions for both clefs; ledger lines (C4 one below the treble, A5 one above); stem direction; second-interval notehead displacement; accidental columns.
- **Rules:**
  - draft/commit/skip/peek/next/summary; `reported` once; commit in review is a no-op;
  - `matched` per answer kind (choice, exact MIDI, pitch-class set with octave freedom);
  - keyboard toggles and bounds;
  - random action sequences never throw and keep `isValidState`;
  - `settingsOf` round trip over every setting combination.
- **`isValidState`:**
  - `fc.anything()` never throws; generated states are valid;
  - tampered fields are rejected: wrong spelling, out-of-register pitch, option not in pool, duplicate options, rhythm sum ≠ 8, `matched` inconsistent, `reported` early, oversize arrays, too many held keys.

### 20.2 Audio engine with a fake context (`test/engine.test.ts`, `test/fake-audio.ts`)

`FakeAudioContext` records the created nodes, their connections, and every `AudioParam` call (`setValueAtTime`, `linearRampToValueAtTime`, `setTargetAtTime`) with times. It also offers controllable `state`, `resume()`/`suspend()`/`close()` spies and `statechange` dispatch. Tests:

- No context is constructed before `ensureContext()`. When muted, `play()` constructs nothing.
- `resume()` is called synchronously in `ensureContext()`. `suspended` after resume → `onState('blocked')`.
- The graph is source → env → bus → lowpass → master → compressor → destination. Master values are always ≤ 0.5. Volume changes ramp.
- Every note gain automation starts at 0 at its start time and targets 0 at its end. `stop()` is scheduled after the tail.
- `stopAll()` ramps the bus to 0 over 0.03 s and disconnects it. A following `play()` uses a new bus. No call to `cancelAndHoldAtTime` exists.
- `interrupted`/`suspended` during playback → the playing state ends. `closed` → the next `ensureContext` builds a new context.
- `suspendForHidden()` and `dispose()` call `suspend()`/`close()`.
- `audioSupport` with no constructor or a throwing constructor → `unavailable`.

### 20.3 `test/content.test.ts`, `test/view.test.ts`

- **Content:**
  - every name, tip and line exists in all 16 locales (through `CONTENT_LOADERS`), with identical placeholders;
  - no song titles (a small list of forbidden words, e.g. "song", "Lied", "canción", as a heuristic);
  - the glossary terms of Appendix B match for en and de;
  - zh-Hans has no traditional-only characters; Portuguese passes the Brazilian guard; plural categories are complete.
- **View (jsdom; jsdom has no `AudioContext`, which exercises the unavailable path):**
  - each topic × senses × level renders in `en`, `de`, `ar`, `ja`;
  - by ear: no note names or staff in the DOM before Check (and "no-sound" fallback shows the picture with the notice);
  - with an injected fake constructor: render, `newGame` and `restore` construct no context, and the first Play click does;
  - staff/keyboard/grid containers are `dir="ltr"` in Arabic;
  - keys have accessible names with spoken note names; option radio-group keyboard behaviour; the "Note buttons" alternative; the German keyboard shows "H" and "B" correctly;
  - the summary lists mix-ups;
  - preferences are validated (junk → defaults).

### 20.4 Slow tests (`*.slow.test.ts`, ADR 0021: run by `pnpm test` and the CI `long` job, not by Stryker)

`test/generate.slow.test.ts`: 2,000 seeds × every topic/level/senses. Every round is valid (`isValidState`), every fairness rule holds, and every schedule respects the bounds of § 9.4. It reports the distribution of answers and roots. It stays under 50 % of its timeout under parallel load.

### 20.5 Contract (`test/contract.test.ts`)

`runGameContract(game, { interact })` with `preload('en')`. `interact` selects the first option and presses Check (or toggles one key in build/keyboard). Settings are sampled by the contract.

### 20.6 E2E (`e2e/games/harmony.spec.ts`)

1. **By eye, intervals, easy:** `startGame` with `{ topic: 'intervals', senses: 'eye' }`. Read the save, compute the answer index from `spec`, choose it, Check. The review shows "That's it" and the staff. Finish the round with "Skip — just show me" plus answers. The summary and the host's "Another round" appear.
2. **Resume:** `expectResumeAfterReload` after choosing a draft option by ear (the draft survives, nothing is committed, no picture is shown).
3. **Sound only on a gesture:** `page.addInitScript` wraps `window.AudioContext` to count constructions and record `state`. After start, render and reload, the count is 0. After pressing Play, it is 1 and `resume` was called.
4. **Mute persists:** toggle mute, reload. Mute is still on, and pressing Play constructs no context.
5. **No Web Audio:** `addInitScript` deletes `AudioContext` and `webkitAudioContext`. By ear, the question shows the picture with the notice and is answerable; Play buttons are absent.
6. **Build, keyboard-only:** Tab to the keyboard, arrows and Space select the chord notes, Enter on Check. The review marks ✓.
7. **Free keyboard:** hold C, E, G. The name panel says "C major". The wave caption appears. Switch the tuning to pure (no error).
8. **360 × 740:** no horizontal scroll; white keys and option buttons ≥ 44 px; the sticky bar does not cover focus.
9. **`ar` RTL:** the panels are mirrored, but the keyboard is not (C is left of D by bounding box), and neither is the staff.
10. **`de`:** the keyboard labels show "H" for B natural. A build task on B♭ is written "B".
11. **Offline:** after the first load, go offline, open the game in a new page, start a round, and press Play. No network request is made.

---

## 21. Risks

| Risk | Mitigation |
|---|---|
| Sound differs across browsers or is silent (iOS silent switch, autoplay policy, Bluetooth delay) | Sound is never required; by-eye path; "Tap again to allow sound"; help line; listening only, no timing judgement |
| Hearing discomfort (loud onsets, headphones) | Arithmetic level bound (≤ −6 dBFS) proven by property tests, default ≈ −18 dBFS, 15–30 ms ramps, low-pass, limiter, preview on volume release, "start quietly" hint |
| Cultural bias of "stable/tense" | Rules line naming the Western frame and other traditions; disputed comparisons excluded; the McDermott 2016 line in reviews |
| Wrong music terms or note names in translations (B/H, solfège spelling) | Appendix B glossary, one tested `noteLabel`, native-review note in the content file, en/de by the implementer |
| Notation drawing is fiddly (beams, displaced seconds, accidentals) | A pure layout module with tests; limited rhythm vocabulary; no key signatures; one staff per item |
| Black keys below 44 px wide | Tall black keys plus the equal-size "Note buttons" alternative (§ 11.2) |
| Screen-reader speech covering the sound | No announcements during playback; Play keeps focus |
| Engine code hard to test | `AudioContextLike` injection and a fake context; pure scheduler holds all numbers |
| Scope (7 topics) too large for one implementer | Topics are independent. The order in § 23 ships intervals → chords → stability → build → keyboard → melody → rhythm. If time runs short, the orchestrator may release without rhythm and melody (owner question 1) |
| ET vs just intonation criticism | Decision explained in the rules help (§ 9.1); ratios and pure-tuning comparison offered |

---

## 22. Open questions for the owner (max 3, each with a recommendation)

1. **Is the game wanted at all (it is marked optional)?** Recommended: **yes, build it now, in full** (six quiz topics plus the free keyboard, all 16 locales). It is the only auditory and the only music game in a catalogue of 53 silent games. It needs no third-party content, data or dependency. It is fully playable silently. Its size is moderate (no simulation or data pipeline). Alternative: a smaller first release (intervals, chords, stability, build, free keyboard), with melody and rhythm in a follow-up (about 30 % less work), or postpone it until after Balance Lab.
2. **Title.** Recommended: **"Tones & Chords" / "Töne & Akkorde"**. Not "Harmony": *har•mo•ny* is an existing commercial music-puzzle series on iOS. Alternatives: "Music Workshop" / "Musikwerkstatt"; "Ear & Eye" / "Ohr & Auge".
3. **iPhone silent switch.** Recommended: **respect it** (Web Audio is silent when the switch is set to silent; the game says so in its help). Alternative: use Safari's Audio Session API to play through the switch (as music apps do). That is more convenient, but it overrides a device choice the person made.

---

## 23. Implementation steps (one implementer)

1. **Theory core (tests first):** `src/theory.ts` (intervals, chords, scales, ratio table, `recognise`, `midi ↔ freq`) and `src/spelling.ts`, with `theory.test.ts` and `spelling.test.ts`. `src/notes.ts` (systems, defaults, `noteLabel`, `spokenNote`) with its tests (German B/H first).
2. **Rhythm model:** `src/rhythm.ts` (cells, patterns, slot vectors, distance, notation layout data), with tests.
3. **Generator:** `src/generate.ts` for all topics and levels, with the fairness properties and `generate.slow.test.ts`.
4. **State and transitions:** `src/rules.ts` (`HarmonyState`, `newRound`, transitions, matching, `isValidState`, `settingsOf`, summary and mix-ups), plus fuzz tests.
5. **Audio:**
   - `src/audio/schedule.ts` (pure: `playableFor`, `schedule`, `master`, overlap sweep) with property tests;
   - `src/audio/voices.ts`;
   - `src/audio/engine.ts` against `AudioContextLike`, with `test/fake-audio.ts` and `engine.test.ts`.
6. **Pictures:** `src/staff.ts` + `staff-view.ts` (own clef/rest/accidental paths), `keyboard-view.ts` (piano and note buttons, computer-key mapping), `wave.ts` + `wave-view.ts`, contour and grid views.
7. **Text:** `messages.ts`, then `content/en.ts`, then `de`, then the other 14 (Appendix B terms); `format.ts` (numbers, plurals); content tests.
8. **View:** `view.ts` (sound bar, question card, picture panel, review, summary, free keyboard, preferences box), `styles.css` (logical properties, forced colours, 360 px), `index.ts` with `settings`, `settingsOf`, `preload`; `test/view.test.ts`.
9. **Contract and e2e:** `test/contract.test.ts`, `e2e/games/harmony.spec.ts`. Run the full gate (`pnpm check`, `pnpm build`, the e2e command of the pipeline brief).
10. **Listen yourself:** check every topic in Chromium and Firefox (and Safari or iOS if available) at volume 50 and 100 with headphones. Record the measured peak (an `AnalyserNode` in a dev-only check, never shipped) in the implementation notes.
11. **Report to the orchestrator:**
    - registry line (append), dependency, preview (§ 19);
    - ROADMAP row (new game; skills attention/learning; "sound optional");
    - Stryker `mutate` lines (§ 1.3);
    - Appendix A for `docs/third-party.md`;
    - chunk sizes, and any calibration changes.

---

## Appendix A — row for `docs/third-party.md` (ready to paste)

```markdown
| *Tones & Chords* theory tables, generators, synthesised sounds, notation drawings and texts (`packages/games/harmony/src/`) | Project license (written for Worthwhile Play; music theory (interval, chord and scale definitions, just-intonation ratios, cadence formulas) is common knowledge stated in our own words; all sounds are synthesised at runtime with the Web Audio API — no samples, sound fonts or recordings; clefs, rests and accidentals are own SVG paths, no music font; no song or melody quoted; non-en/de AI-assisted) | Questions, sounds, staff and keyboard pictures and explanations of *Tones & Chords* |
```

---

## Appendix B — music terms (glossary for translators; en and de binding, the others a draft to verify)

| | en | de | fr | es | it | pt (BR) | nl | pl |
|---|---|---|---|---|---|---|---|---|
| m2 | minor second | kleine Sekunde | seconde mineure | segunda menor | seconda minore | segunda menor | kleine secunde | sekunda mała |
| M2 | major second | große Sekunde | seconde majeure | segunda mayor | seconda maggiore | segunda maior | grote secunde | sekunda wielka |
| m3 | minor third | kleine Terz | tierce mineure | tercera menor | terza minore | terça menor | kleine terts | tercja mała |
| M3 | major third | große Terz | tierce majeure | tercera mayor | terza maggiore | terça maior | grote terts | tercja wielka |
| P4 | perfect fourth | reine Quarte | quarte juste | cuarta justa | quarta giusta | quarta justa | reine kwart | kwarta czysta |
| TT | tritone | Tritonus | triton | tritono | tritono | trítono | tritonus | tryton |
| P5 | perfect fifth | reine Quinte | quinte juste | quinta justa | quinta giusta | quinta justa | reine kwint | kwinta czysta |
| m6 | minor sixth | kleine Sexte | sixte mineure | sexta menor | sesta minore | sexta menor | kleine sext | seksta mała |
| M6 | major sixth | große Sexte | sixte majeure | sexta mayor | sesta maggiore | sexta maior | grote sext | seksta wielka |
| m7 | minor seventh | kleine Septime | septième mineure | séptima menor | settima minore | sétima menor | kleine septiem | septyma mała |
| M7 | major seventh | große Septime | septième majeure | séptima mayor | settima maggiore | sétima maior | grote septiem | septyma wielka |
| P8 | octave | Oktave | octave | octava | ottava | oitava | octaaf | oktawa |

| | ru | uk | tr | ja | zh-Hans | ko | ar | hi |
|---|---|---|---|---|---|---|---|---|
| m2 | малая секунда | мала секунда | küçük ikili | 短2度 | 小二度 | 단2도 | ثانية صغيرة | माइनर सेकंड |
| M2 | большая секунда | велика секунда | büyük ikili | 長2度 | 大二度 | 장2도 | ثانية كبيرة | मेजर सेकंड |
| m3 | малая терция | мала терція | küçük üçlü | 短3度 | 小三度 | 단3도 | ثالثة صغيرة | माइनर थर्ड |
| M3 | большая терция | велика терція | büyük üçlü | 長3度 | 大三度 | 장3도 | ثالثة كبيرة | मेजर थर्ड |
| P4 | чистая кварта | чиста кварта | tam dörtlü | 完全4度 | 纯四度 | 완전4도 | رابعة تامة | परफ़ेक्ट फ़ोर्थ |
| TT | тритон | тритон | artık dörtlü (triton) | 増4度（三全音） | 增四度（三全音） | 증4도(트라이톤) | تريتون (رابعة زائدة) | ट्राइटोन |
| P5 | чистая квинта | чиста квінта | tam beşli | 完全5度 | 纯五度 | 완전5도 | خامسة تامة | परफ़ेक्ट फ़िफ़्थ |
| m6 | малая секста | мала секста | küçük altılı | 短6度 | 小六度 | 단6도 | سادسة صغيرة | माइनर सिक्स्थ |
| M6 | большая секста | велика секста | büyük altılı | 長6度 | 大六度 | 장6도 | سادسة كبيرة | मेजर सिक्स्थ |
| m7 | малая септима | мала септима | küçük yedili | 短7度 | 小七度 | 단7도 | سابعة صغيرة | माइनर सेवन्थ |
| M7 | большая септима | велика септима | büyük yedili | 長7度 | 大七度 | 장7도 | سابعة كبيرة | मेजर सेवन्थ |
| P8 | октава | октава | oktav | 完全8度（オクターブ） | 纯八度 | 완전8도(옥타브) | أوكتاف (ديوان) | ऑक्टेव |

Chords and scales (en / de): major / Dur · minor / Moll · diminished / vermindert · augmented / übermäßig · dominant seventh chord / Dominantseptakkord · major seventh chord / großer Durseptakkord (Maj7) · minor seventh chord / Mollseptakkord (m7) · major scale / Dur-Tonleiter · natural minor / natürliches Moll · harmonic minor / harmonisches Moll · major pentatonic / Dur-Pentatonik · finished (authentic cadence) / abgeschlossen (authentischer Ganzschluss) · open (half cadence) / offen (Halbschluss) · surprise (deceptive cadence) / Überraschung (Trugschluss) · semitone / Halbton · whole tone / Ganzton.

Hindi uses transliterated English terms plus the semitone count (no standard Hindi terminology for Western intervals exists). The sargam equivalents may appear in explanations (§ 18.2).

---

## Appendix C — interval reference table (ratios used for explanations; cents = 1200 · log₂ ratio)

| Interval | Semitones | Reference ratio | Pure (cents) | ET (cents) | ET − pure | Class (§ 7.3) |
|---|---|---|---|---|---|---|
| m2 | 1 | 16 : 15 | 111.7 | 100 | −11.7 | sharp dissonance |
| M2 | 2 | 9 : 8 | 203.9 | 200 | −3.9 | mild dissonance |
| m3 | 3 | 6 : 5 | 315.6 | 300 | −15.6 | imperfect consonance |
| M3 | 4 | 5 : 4 | 386.3 | 400 | +13.7 | imperfect consonance |
| P4 | 5 | 4 : 3 | 498.0 | 500 | +2.0 | (not asked) |
| TT | 6 | ≈ 45 : 32 (no simple ratio) | 590.2 | 600 | +9.8 | sharp dissonance |
| P5 | 7 | 3 : 2 | 702.0 | 700 | −2.0 | perfect consonance |
| m6 | 8 | 8 : 5 | 813.7 | 800 | −13.7 | (not asked) |
| M6 | 9 | 5 : 3 | 884.4 | 900 | +15.6 | imperfect consonance |
| m7 | 10 | 16 : 9 | 996.1 | 1000 | +3.9 | mild dissonance |
| M7 | 11 | 15 : 8 | 1088.3 | 1100 | +11.7 | sharp dissonance |
| P8 | 12 | 2 : 1 | 1200.0 | 1200 | 0 | perfect consonance |

The minor seventh's reference is 16 : 9 (the "small" pure minor seventh). 9 : 5 (1017.6 cents) is also used in theory. The help mentions both.

---

## Appendix D — references (for statements in explanations; mechanisms and facts, not copied text)

- H. von Helmholtz, *Die Lehre von den Tonempfindungen* (1863); English: *On the Sensations of Tone* (1875/1885). Partials and beating as a basis of consonance.
- R. Plomp & W. J. M. Levelt, "Tonal consonance and critical bandwidth", *J. Acoust. Soc. Am.* 38 (1965) 548–560. Roughness depends on the frequency distance relative to the critical band, hence the register rule of § 7.
- J. H. McDermott, A. J. Lehr & A. J. Oxenham, "Individual differences reveal the basis of consonance", *Current Biology* 20 (2010) 1035–1041. Harmonicity and the role of musical experience.
- J. H. McDermott, A. F. Schultz, E. A. Undurraga & R. A. Godoy, "Indifference to dissonance in native Amazonians reveals cultural variation in music perception", *Nature* 535 (2016) 547–550. The preference is partly learned (the review line of § 7.3).
- W3C *Web Audio API* (Recommendation, 2021) and MDN for `AudioContext` states, `PeriodicWave` normalisation, `setTargetAtTime`, autoplay policy.

---

## Implementation notes (implementer, 2026-10-27)

Everything of §§ 5–20 is implemented in the order of § 23. Where the code differs from this plan:

- **Limiter threshold 0 dB instead of −10 dB (§ 9.4; safety, not tuning upwards).** The Web Audio `DynamicsCompressorNode` applies an automatic makeup gain (spec: `(1 / full-range gain)^0.6`). With the planned threshold −10 dB, knee 6, ratio 12 it *raised* a single note at volume 100 from −6 dBFS to −3.3 dBFS (measured in Chromium). With threshold 0 dB the full-range gain is 0 dB, so there is no makeup gain; the node stays a pure safety net above full scale while the arithmetic bound (master ≤ 0.5, voices ≤ 1) does the work. Measured sample peaks through the real graph in Chromium's `OfflineAudioContext` (dev-only script, not shipped), volume 100 / 50: single key A5 −6.2 / −18.2 dBFS; single key C4 −7.6 / −19.6; melodic interval −10.9 / −22.9; chord (block, broken, block) −9.0 / −21.1; cadence −12.5 / −24.5; rhythm with count-in −11.8 / −23.9; 12 held keys −14.3 / −26.3.
- **Cadence tonics C4–G4** (§ 7.3 said C4–A4): with A♭4/A4 the IV chord's bass (T − 7) would lie above C4, outside the bass register of § 7. The upper voices then stay ≤ G5.
- **While muted** the Play, "hear this option" and "Listen" buttons are hidden (they could not sound anyway); the mute toggle stays.
- **"Show on the keyboard"** (by eye, intervals medium/hard) is recorded as `peeked: 'hint'` like "Show the picture" by ear; the summary says "With the keyboard: n" by eye. `no-sound` exists by ear only.
- **Options heard from a high root** ("hear this option", "Listen: yours") are moved by whole octaves into C3–C6 when the chosen option would leave the range; the answer itself always sounds as notated.
- **"Listen: yours"** for melody contours plays the same step sizes with the chosen directions; for "which note changed?" it plays A and then A with the chosen note moved by the same amount.
- **Playback highlight** (the cosmetic "now playing" marker of § 9.3) is not implemented; the Play button shows "Stop" while it plays. Nothing depends on it.
- **Spoken note names** (§ 18.3) live in `notes.ts` (one table per locale, tested) rather than in the per-locale content.
- **Physical letter keys** for the piano are named per keyboard layout in the help text (QWERTZ: A W S E D F T G Z H U J K; AZERTY: Q Z S E D F T G Y H U J K).
- **Generation budget:** 0.04–1.8 ms per round (Node, after warm-up); `generate.slow.test.ts` (2,000 seeds × 18 topic/level pairs) never needed a relaxed or fixed draw.
- **Chunks** (`pnpm build`, raw / gzip): game chunk 212 / 69 kB including the 16 UI catalogues; content per locale 2.8–6.3 / 1.4–2.0 kB; styles 9.9 / 2.4 kB.

## Review notes (independent reviewer, 2026-10-27)

Music theory verified independently (every interval, chord and scale of 299 seeds × 3 levels against a separate letter/semitone model; 25+ items by hand; cadence voice leading; German/Polish H/B, solfège per locale, the zh prefix rule). Changes made in review:

- **Free keyboard spelling** (`spellHeld` in `spelling.ts`): held notes are spelled by what they form — an interval by letter steps from the lower note (E + G♯, not E + A♭), a chord in stacked thirds from the enharmonic root with fewer rare spellings (C♯ minor, not D♭ minor with F♭; an augmented triad from a tone needing no double sharp), other sets with the usual spellings while avoiding two notes on one letter. The name panel uses the same root.
- **Natural signs** (`naturalSigns` in `staff.ts`): no key signature and accidentals hold to the end of the bar, so a natural note after (or beside) the same letter and octave with an accidental gets an own-path ♮ (e.g. melody B of "which note changed?" in the review). Two notes on one position sit side by side like a second.
- **Half rest** for two quarter rests filling beats 1–2 or 3–4 (hard rhythms).
- **Step words**: German GT/HT and Polish 1/½ (G, H and C are note names there).
- **Wave caption** is a plural content form per locale ("with every wave", "every 2 waves", ru 2 волны / 5 волн).
- **Level cap**: the overlap count uses the lengthened duration of notes shorter than the attack.

## Follow-up (2026-10-29)

- **Rhythm by eye, screen readers:** the notation's accessible name was the same slot text as the option grids, so the question was string matching. It is now read as note values (`notationText` in `pictures.ts`, terms in `content/<locale>.ts` `noteValues` with plural forms; the label names the 4/4 time). Tests: every pattern of every level in every locale parses back to its slot vector; no notation phrase occurs in any grid text; plural forms for runs of 2–8 per locale.
- **Spelling of the changed note** ("which note changed?"): the moved note was spelled on its old letter (D♯5 → D♭5 in E major). It is now spelled in the melody's major key (`spellInKey` and `keySignature` in `spelling.ts`): the key's own spelling when the pitch belongs to the key (C♯5); otherwise the single-accidental spelling one step from the key signature, preferring no E♯/F♭/B♯/C♭ (a natural sign reads better: B♮4 after B♭4, not C♭5), then one not on the staff position of a neighbouring note (C4 D♭4 rather than C4 C♯4 in C major), then raised when the note moved up and lowered when it moved down. Only notation and names change: pitches, positions and answers of every generated round are identical, and saved items stay valid (the spelling of melody B is not constrained by `specProblem`). Natural signs follow from `naturalSigns` as before. Tests: properties over keys, pitches and neighbours and over generated rounds (diatonic when in the key, else one step from the signature, never a double accidental), plus the E-major example.
