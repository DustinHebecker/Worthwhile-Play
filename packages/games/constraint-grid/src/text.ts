import type { Translator } from '@wp/game-core';
import { FLOOR, PERSON, type Clue, type Puzzle, type Ref } from './rules';
import { VOCABULARY } from './vocabulary';

/**
 * Turns structured puzzle data into translated text. DOM-free so it can be unit-tested in
 * every locale. Clue sentences come whole from `clue.<type>` templates; only complete noun
 * phrases (`subject.*`) are inserted, never fragments (see messages.ts).
 */

type Labelled = Pick<Puzzle, 'kinds' | 'vocab'>;

export const categoryLabel = (t: Translator, puzzle: Labelled, cat: number): string => t(`category.${puzzle.kinds[cat] ?? 'person'}`);

/** Short label of item `slot` of category `cat`, as shown in the grid headers. */
export function itemLabel(t: Translator, puzzle: Labelled, cat: number, slot: number): string {
  const kind = puzzle.kinds[cat];
  const id = puzzle.vocab[cat]?.[slot] ?? 0;
  if (kind === 'person') return t(`name.${id}`);
  if (kind === 'floor' || kind === undefined) return t('floor.item', { n: slot + 1 });
  return t(`item.${kind}.${VOCABULARY[kind][id] ?? ''}`);
}

/** The noun phrase for "the person who has `ref`", used inside clue sentences. */
export function subjectPhrase(t: Translator, puzzle: Labelled, ref: Ref): string {
  const kind = puzzle.kinds[ref.cat];
  if (ref.cat === PERSON) return t('subject.person', { name: itemLabel(t, puzzle, PERSON, ref.item) });
  if (ref.cat === FLOOR || kind === undefined || kind === 'person' || kind === 'floor') return t('subject.floor', { n: ref.item + 1 });
  return t(`subject.${kind}.${VOCABULARY[kind][puzzle.vocab[ref.cat]?.[ref.item] ?? 0] ?? ''}`);
}

/** Upper-cases the first letter (locale-aware; a no-op for scripts without case). */
export function capitalizeFirst(text: string, locale: string): string {
  const first = text.codePointAt(0);
  if (first === undefined) return text;
  const head = String.fromCodePoint(first);
  return head.toLocaleUpperCase(locale) + text.slice(head.length);
}

export function clueText(t: Translator, puzzle: Labelled, clue: Clue): string {
  const params: Record<string, string> = { a: subjectPhrase(t, puzzle, clue.a), b: subjectPhrase(t, puzzle, clue.b) };
  if (clue.type === 'eitherOr') params.c = subjectPhrase(t, puzzle, clue.c);
  return capitalizeFirst(t(`clue.${clue.type}`, params), t.locale);
}
