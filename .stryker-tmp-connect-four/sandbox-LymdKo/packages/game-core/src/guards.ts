/** Small structural type guards for `isValidState` implementations. None of them throw. */
// @ts-nocheck

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isInt = (value: unknown, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

export const isUint32 = (value: unknown): value is number => isInt(value, 0, 0xffff_ffff);

export const isArrayOf = <T>(value: unknown, guard: (item: unknown) => item is T, length?: number): value is T[] =>
  Array.isArray(value) && (length === undefined || value.length === length) && value.every(guard);

export const isOneOf = <T extends string | number>(value: unknown, options: readonly T[]): value is T =>
  (options as readonly unknown[]).includes(value);
