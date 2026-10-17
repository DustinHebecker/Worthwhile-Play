import { apply, candidateMoves, isSolved, type Position } from '../src/rules';

/**
 * An independent oracle for the solver: plain breadth-first search over the pure reference rules (`apply`), with a
 * visited set on the complete position (slots by index, unlike the solver's multiset key) and no failure memo, move
 * ordering or budget. Only for tiny puzzles.
 */
export function oracleSolvable(start: Position, limit = 200_000): boolean {
  const key = (p: Position) => JSON.stringify([p.cells, p.laneFront, p.slots]);
  const seen = new Set<string>([key(start)]);
  let frontier: Position[] = [start];
  while (frontier.length > 0) {
    const next: Position[] = [];
    for (const pos of frontier) {
      if (isSolved(pos)) return true;
      for (const move of candidateMoves(pos)) {
        const child = apply(pos, move);
        if (child === pos) continue;
        const k = key(child);
        if (seen.has(k)) continue;
        if (seen.size > limit) throw new Error('oracle limit exceeded');
        seen.add(k);
        next.push(child);
      }
    }
    frontier = next;
  }
  return false;
}
