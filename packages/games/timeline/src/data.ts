/** The events in astronomical years, normalised once at module load (design § 5.1), with lookups. */
import { CONTENT_ID, CURATED, EVENTS } from './events';
import { eraOf, normalise, type Era, type When } from './time';
import type { CuratedPair, EventData } from './types';

export interface Ev extends When {
  readonly id: string;
  readonly data: EventData;
  readonly era: Era;
  readonly tier: 1 | 2 | 3;
  readonly retired: boolean;
}

export const ALL: readonly Ev[] = EVENTS.map((data) => {
  const w = normalise(data);
  return { ...w, id: data.id, data, era: eraOf(w.y), tier: data.tier, retired: data.retired === true };
});

const BY_ID = new Map(ALL.map((e) => [e.id, e]));

/** The normalised event of an id (undefined for unknown ids). */
export const ev = (id: string): Ev | undefined => BY_ID.get(id);
/** The normalised event of a known id (throws for unknown ids; only for ids from valid states). */
export const evOf = (id: string): Ev => {
  const e = BY_ID.get(id);
  if (!e) throw new Error(`Unknown event ${id}`);
  return e;
};
export const isEventId = (id: unknown): id is string => typeof id === 'string' && BY_ID.has(id);

/** Content versions whose ids this build understands (§ 14). */
export const CONTENT_IDS: readonly string[] = [CONTENT_ID];
export { CONTENT_ID, CURATED };

const PAIRS = new Map(CURATED.map((p) => [p.id, p]));
export const curatedPair = (id: string): CuratedPair | undefined => PAIRS.get(id);
