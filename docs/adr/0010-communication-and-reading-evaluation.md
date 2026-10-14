# 0010 — Deterministic evaluation for reading and communication exercises

Status: Accepted (2026-10-09, with the first M5/M6 text exercises: Deep Read, Ambiguity Detector, Audience Switch)

## Context
The spec asks for communication exercises "with deterministic evaluation" (M6) and for Deep Read (M5), whose natural answers are free text. Grading free text needs a language model; the optional local AI (M9) must never be required, and claims must stay honest.

## Decision
- **Scored parts are structured.** Every scored step is a choice the rules can check exactly: pick or tick options, sort items into slots, order items. Each content item ships its gold answer and a short explanation for every option, shown after answering.
- **Free text is never graded.** Where writing is the point (a one-sentence summary, an own explanation, a mnemonic), the person writes it and then compares it with a model answer and a short checklist they tick themselves. Self-assessment is recorded as such and not counted as a score.
- **Content is original and in all 16 UI locales**, written for this project (no third-party texts), shipped with the game package (one chunk per locale, ADR 0011). The text is in the UI language; learning languages (ADR 0003) do not apply. Gold answers are language-independent ids, so a save stays valid when the UI language changes.
- **Bounded size.** Content counts are chosen so a game chunk stays well below the 2 MiB precache limit; if content grows, it moves to per-locale chunks loaded on demand. (Done in ADR 0011: content is now loaded per locale; the game chunk keeps only rules, view and UI messages.)
- **Later AI feedback (M9)** may add optional comments on free text, never a score and never a requirement.

## Consequences
+ Results are reproducible, testable and identical offline.
+ Content ids keep saves independent of the UI language.
− Structured choices are narrower than open writing; the self-check and model answers carry the open part.
− Translations of longer texts are AI-assisted until reviewed by native speakers.
