/** What the per-mode screens need from the game view (`view.ts`). */
import type { CaseState, PdState } from './rules';
import type { Difficulty } from './templates';
import type { Ui } from './ui';

export interface Host {
  readonly ui: Ui;
  state(): PdState;
  paused(): boolean;
  difficulty(): Difficulty;
  /** Applies a new state (no-op when unchanged), saves, re-renders, focuses `focus` and announces `message`. */
  commit(next: PdState, focus?: string | null, message?: string): void;
  /** Announces a message in the polite live region. */
  announce(message: string): void;
  /** Adds a reviewed case's forecast to the calibration notebook (device preferences). */
  note(c: CaseState): void;
  /** "Next case" or, on the last case, "See summary". */
  nextButton(): HTMLElement;
  /** Progress line and case title. */
  header(title: string, kindKey: string): HTMLElement;
}
