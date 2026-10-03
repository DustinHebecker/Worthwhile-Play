# 0003 — 16 UI locales, separate content languages

Status: Accepted (2026-10-03)

## Context
Spec: same 16 locales as Home Workout, BCP-47, RTL; UI language and learning-content language strictly separated.

## Decision
- Locale registry and resolution in `@wp/localization` (stored → browser → English; simplified-Chinese variants → `zh-Hans`, traditional Chinese not mapped).
- Three catalogue namespaces: shell UI (typed per-locale files), shared game vocabulary `common.*`, per-game `metadata.messages`. Complete key sets and identical placeholders are enforced by tests; runtime English fallback is a reported safety net only.
- Content languages are separate localStorage preferences accepting any BCP-47 tag; decks carry `lang` per card side.
- Core game rules never depend on translated strings.

## Consequences
+ Changing the UI language never touches decks or saves.
− Each game must ship 16 translations; non-en/de translations are AI-assisted until reviewed by native speakers.
