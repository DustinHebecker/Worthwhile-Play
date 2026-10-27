/** What the per-kind screens need from the game view (`view.ts`). */
import type { Translator } from '@wp/game-core';
import type { Window } from './axis';
import type { AxisScene, AxisViewApi } from './axis-view';
import type { Item, TimelineState } from './rules';
import type { Ui } from './ui';

export interface Host {
  readonly ui: Ui;
  readonly t: Translator;
  readonly axis: AxisViewApi;
  /** The current calendar year (typed "years ago" after 10,000 BCE count back from it). */
  readonly nowYear: number;
  state(): TimelineState;
  paused(): boolean;
  /** Applies a new state (no-op when unchanged), saves, re-renders, focuses `focus` and announces `message`. */
  commit(next: TimelineState, focus?: string | null, message?: string): void;
  /** Applies and saves a new state without re-rendering (typing in the year field). */
  update(next: TimelineState): void;
  /** Re-renders without a state change. */
  refresh(focus?: string | null): void;
  announce(message: string): void;
  /** View-only scratch values of the current item (cleared when the item or its phase changes). */
  readonly scratch: Record<string, unknown>;
  /** "Next" or, on the last item, "See summary". */
  nextButton(): HTMLElement;
  /** "Skip — just show me". */
  skipButton(): HTMLElement;
  /** Progress line and the item heading. */
  header(item: Item, title: string): HTMLElement;
}

/** One screen: the card content, the axis scene, and the window to show when the screen first appears. */
export interface Screen {
  readonly card: HTMLElement[];
  readonly scene: AxisScene;
  /** Fit the axis here when the screen first appears; null = the whole timeline; undefined = keep. */
  readonly fit?: Window | null;
  onPlace?(y: number, via: 'pointer' | 'keyboard'): void;
}
