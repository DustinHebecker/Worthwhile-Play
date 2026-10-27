/** What the screens (`view-quiz.ts`, `view-free.ts`) need from the game view (`view.ts`). */
import type { NoteEvent } from './audio/schedule';
import type { Env, Prefs } from './env';
import type { HarmonyState } from './rules';

export interface Host {
  readonly env: Env;
  prefs(): Prefs;
  state(): HarmonyState;
  paused(): boolean;
  /** Applies a new state (no-op when unchanged), saves, re-renders, focuses `focus` (an id or a key's MIDI) and announces. */
  commit(next: HarmonyState, focus?: string | number | null, message?: string): void;
  announce(message: string): void;
  /** Plays inside the current gesture; nothing when muted or without Web Audio. */
  play(events: readonly NoteEvent[]): void;
  /** Web Audio exists and has not failed. */
  soundAvailable(): boolean;
  /** The sound bar: the given play buttons, volume, mute, status and the help line. */
  soundBar(buttons: readonly HTMLElement[]): HTMLElement;
  /** A play button whose label turns to "Stop" while it plays. */
  playButton(label: string, testid: string, events: () => readonly NoteEvent[], primary?: boolean): HTMLElement;
  /** Phone width: one octave of keys with ◀ ▶. */
  narrow(): boolean;
  /** UI-only keyboard view (visible octave on phones, the key to focus after a render). */
  keysStart(fallback: number): number;
  setKeysStart(start: number, focus?: number): void;
  focusKey(): number | undefined;
  /** Re-render without a state change (UI-only changes). */
  rerender(): void;
}
