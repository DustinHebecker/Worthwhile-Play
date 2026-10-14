# 0015 — Games whose first screen is their own setup

Status: Accepted (2026-10-14; amends 0002).

## Context
The game page shows a host start panel (difficulty select, "New game", and "Continue" when there is a save) before a game is created. Relay Command has its own setup screen (map, length, opponents, seats) that appears only after the host started a game. Without a save the player therefore had to press the host's "New game" just to reach the screen where the actual choices are made — an extra step that reads as illogical.

## Decision
- **Optional metadata flag** `GameMetadata.setupInGame?: boolean`: the game's first screen is its own setup. `validateMetadata` reports a non-boolean value.
- **Host behaviour** (apps/web game page), only on opening `/games/<id>` without `?seed` / `?new=1`:
  - flag set and **no usable save** (none, or a corrupt one that was removed): the host starts a fresh game directly — the same code path as pressing "New game" (random seed; difficulty from a valid `?difficulty=`, otherwise the host default, the first of `metadata.difficulties`) — and focuses the game as after "New game" (unless the person is using a control outside the page while the module loads). The start panel is not shown; the host toolbar with the difficulty select and "New game" is, so a fresh game stays one press away.
  - flag set and a save exists: unchanged — "Continue" and "New game".
  - flag unset: unchanged.
- **Not autoplay**: this is the first screen of a game the person explicitly opened, and it is a setup screen, not running play. It never applies after a game finishes (the calm finished screen still waits for "Another round" or "Back"), and a reload after playing finds the save and offers "Continue".
- The flag is part of the build-time catalogue (`virtual:wp-catalogue` copies every metadata field except `messages`), so the host knows it from the catalogue entry; the decision is taken after the game chunk and the save have loaded anyway.

## Consequences
+ Games with a real setup screen open on it; no empty host step in front of it.
+ Opt-in and per game; all other games keep the start panel.
− A game that sets the flag must make its `newGame` state a setup screen (not play already in progress), since the host creates it without a choice by the person.
