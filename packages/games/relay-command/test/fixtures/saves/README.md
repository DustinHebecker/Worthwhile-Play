# Genuine Relay Command saves, one set per state version

Made with the game's own code at each version (not rebuilt from today's code), so they carry what
real saves of that time carry, among it the ruleset id their world was made with. `saves.test.ts`
runs every one through today's `migrateState` and `isValidState`.

Each file is a gzipped JSON array of `{ label, state }`: every built-in map and opponent count of
that time, with teams, hot-seat, player-made and random maps where the version has them, saved
after a turn or two. `generate.ts.txt` is the generator: copied as a test into a worktree of the
commit and run with `FIXTURE_OUT=<file> npx vitest run <it>`.

| File | Commit | State |
| --- | --- | --- |
| v1 | 0d5caf5 | v1 (last commit before v2) |
| v2 | 691a7aa | v2 |
| v3 | a033585 | v3 |
| v4 | 6bdee76 | v4 |
| v5 | 8c96ac9 | v5 |
| v6 | 0be64ad | v6 |
| v7 | c43bfa7 | v7 |
| v8 | 5423559 | v8 (map editor) |
| v9 | 3ac6d80 | v9 (several sides) |
| v10 | 82f53ca | v10 (hot-seat) |
| v11 | 5e80170 | v11 |
| v12a | ed217fa | v12, random maps (2026-10-16) |
| v12b | 215e04b | v12, teams and four-base editor (2026-10-26) |
| v12c | f00ec70 | v12, own starting base (2026-10-27) |
| v12d | 139a669 | v12, three-base editor, levels and styles per opponent (2026-11-02) |
