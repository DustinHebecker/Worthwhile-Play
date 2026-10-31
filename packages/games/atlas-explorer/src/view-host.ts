/** What the per-kind screens need from the game view (`view.ts`). */
import type { Atlas, Box } from './atlas';
import type { MapView, Scene } from './map-view';
import type { AtlasState, Item } from './state';
import type { Ui } from './ui';

export interface Host {
  readonly ui: Ui;
  readonly atlas: Atlas;
  readonly map: MapView;
  state(): AtlasState;
  paused(): boolean;
  /** Applies a new state (no-op when unchanged), saves, re-renders, focuses `focus` and announces `message`. */
  commit(next: AtlasState, focus?: string | null, message?: string): void;
  /** Re-renders without a state change (e.g. exploring the map in a review). */
  refresh(focus?: string | null): void;
  announce(message: string): void;
  /** "Next" or, on the last item, "See summary". */
  nextButton(): HTMLElement;
  /** "Skip — just show me". */
  skipButton(): HTMLElement;
  /** Progress line and the item heading. */
  header(item: Item, title: string): HTMLElement;
  /** The point picked while exploring a review (view only, not saved). */
  explored(): [number, number] | null;
  setExplored(p: [number, number] | null): void;
}

/** One screen: the card content, the map scene, an optional view to fit and the map's pick handler. */
export interface Screen {
  readonly card: HTMLElement[];
  readonly scene: Scene;
  /** Fit the map here when the screen first appears (item start, review). */
  readonly fit?: Box | null;
  onPick(lon: number, lat: number, via: 'pointer' | 'keyboard', client?: { x: number; y: number }): void;
}
