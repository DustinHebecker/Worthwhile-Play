/** What the mode screens need from the game view (`view.ts`), and what they give back. */
import type { FocusOptions, SeriesRow } from './chart-view';
import type { Habitat } from './habitats';
import type { EcoState } from './rules';
import type { Ui } from './ui';

export interface Prefs {
  /** One shared chart instead of small multiples. */
  shared: boolean;
  /** Value tags in the scene. */
  numbers: boolean;
}

export interface Host {
  readonly ui: Ui;
  readonly reducedMotion: boolean;
  state(): EcoState;
  paused(): boolean;
  /** Applies a new state (no-op when unchanged), saves, re-renders, focuses `focus` and announces `message`. */
  commit(next: EcoState, focus?: string | null, message?: string, reveal?: boolean): void;
  /** Applies and saves a new state without re-rendering (a sketch handle moved). */
  update(next: EcoState): void;
  /** Re-renders without a state change (a tab or toggle of the view). */
  refresh(focus?: string | null): void;
  announce(message: string): void;
  /** View-only values of the current screen (open tab, ghost toggle, explore focus species). */
  readonly scratch: Record<string, unknown>;
  /** Reports a natural end once (the screens call it when their state says so). */
  finish(outcome: 'won' | 'completed', stats: Record<string, number>): void;
}

/** What the main column shows. */
export interface MainSpec {
  readonly habitat: Habitat;
  /** The sample the scene shows (species amounts, nutrients, dead matter, water). */
  readonly scene: readonly number[];
  /** The week shown in the status line. */
  readonly week: number;
  /** Rows for the small multiples / shared chart / table, from week `x0`. */
  readonly rows: readonly SeriesRow[];
  readonly x0: number;
  readonly x1: number;
  /** The focus chart (without `ui`), or null. */
  readonly focus: Omit<FocusOptions, 'ui'> | null;
  /** Elements placed right under the focus chart (run controls, focus picker, comparison line). */
  readonly underChart?: readonly HTMLElement[];
}

export interface Screen {
  readonly main: MainSpec;
  readonly panel: readonly HTMLElement[];
  /** The sticky action bar on phones (predict: Run / Skip). */
  readonly bar?: HTMLElement;
}
