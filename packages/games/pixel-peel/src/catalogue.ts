import { createRng, normalizeSeed, type NewGameOptions, type Rng } from '@wp/game-core';
import { GROUPS, type BakedArt, type MotifCard, type MotifGroup } from './art/types';
import { orderMotifs } from './motifs/order';

/**
 * The motifs a game knows (docs/design/pixel-peel-motifs.md § 4). The cards (id, group, aspect, title and place in
 * every locale) are in the game chunk; each motif's baked art is a chunk of its own, loaded by `prepare` before a new
 * game starts. A save holds its whole picture, so continuing a game loads no art.
 */
const batches = import.meta.glob<readonly MotifCard[]>('./motifs/cards/*.ts', { eager: true, import: 'CARDS' });

/** Every motif in start-screen order (seasons, landscapes, animals, scenes, landmarks). */
export const CATALOGUE: readonly MotifCard[] = orderMotifs(batches);

const BY_ID = new Map(CATALOGUE.map((card) => [card.id, card] as const));

export const findCard = (id: unknown): MotifCard | undefined => (typeof id === 'string' ? BY_ID.get(id) : undefined);

/** The groups that have motifs, in start-screen order. */
export const GROUPS_SHOWN: readonly MotifGroup[] = GROUPS.filter((g) => CATALOGUE.some((card) => card.group === g));

/** "Any picture" and "Any <group>" choices: drawn from the seed. */
export const ANY = 'any';
export const anyOf = (group: MotifGroup): string => `any-${group}`;

/** Every start-screen choice: any picture, any picture of each group, then each motif. */
export const CHOICES: readonly string[] = [ANY, ...GROUPS_SHOWN.map(anyOf), ...CATALOGUE.map((card) => card.id)];
const CHOICE_SET = new Set(CHOICES);

/** Resolves a start-screen choice: a known choice, anything else counts as "Any picture". */
export const toChoice = (value: unknown): string => (typeof value === 'string' && CHOICE_SET.has(value) ? value : ANY);

/**
 * The motif of a game: an explicit choice, or one drawn with the game's random numbers (the first draw, so the rest
 * of the generation follows from the same stream). `choice` must come from `toChoice`.
 */
export function drawMotif(rng: Rng, choice: string): MotifCard {
  const own = BY_ID.get(choice);
  if (own) return own;
  const group = GROUPS_SHOWN.find((g) => anyOf(g) === choice);
  const pool = group ? CATALOGUE.filter((card) => card.group === group) : CATALOGUE;
  return pool[rng.int(0, pool.length - 1)] as MotifCard;
}

/** The motif a new game with this seed and start-screen choice plays (no generation). */
export const motifFor = (seed: number, choice: unknown): MotifCard => drawMotif(createRng(normalizeSeed(seed)), toChoice(choice));

// --- Art, loaded on demand ---------------------------------------------------------------------------------------

const loaded = new Map<string, BakedArt>();
const pending = new Map<string, Promise<BakedArt>>();

/** The baked art of a motif if it is loaded. */
export const artOf = (id: string): BakedArt | undefined => loaded.get(id);

/** Loads a motif's art (cached; a failed load, e.g. offline before the chunk was cached, is retried next time). */
export function loadArt(id: string): Promise<BakedArt> {
  const done = loaded.get(id);
  if (done) return Promise.resolve(done);
  let promise = pending.get(id);
  if (!promise) {
    const card = BY_ID.get(id);
    if (!card) return Promise.reject(new Error(`pixel-peel: unknown motif "${id}"`));
    promise = card.art().then(({ art }) => {
      loaded.set(id, art);
      pending.delete(id);
      return art;
    });
    promise.catch(() => pending.delete(id));
    pending.set(id, promise);
  }
  return promise;
}

/**
 * `GameModule.prepare`: loads the art of the motif that `newGame(options)` will play (the seed decides "Any
 * picture"), so `newGame` stays synchronous. Idempotent; rejects only when the art cannot be loaded.
 */
export async function prepare(options: NewGameOptions): Promise<void> {
  await loadArt(motifFor(options.seed, options.settings?.motif).id);
}

/** Loads every motif's art (tests and tools). */
export async function loadAllArt(): Promise<void> {
  await Promise.all(CATALOGUE.map((card) => loadArt(card.id)));
}
