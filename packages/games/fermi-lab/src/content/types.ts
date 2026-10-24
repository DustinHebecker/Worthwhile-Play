/**
 * Wording of the tasks in one UI locale (ADR 0010/0011), keyed by the ids in `tasks.ts`.
 * - `factors[id]`: the name of a reference factor (ids are shared between tasks when the meaning is the same).
 * - `tasks[id]`: a short `title` (for the summary), the `question` and the `explain`ation shown after answering.
 */
export interface TaskText {
  readonly title: string;
  readonly question: string;
  readonly explain: string;
}

export interface ContentText {
  readonly factors: Readonly<Record<string, string>>;
  readonly tasks: Readonly<Record<string, TaskText>>;
}
