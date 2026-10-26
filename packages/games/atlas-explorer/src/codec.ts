/**
 * Compact text encoding of integer sequences for the generated atlas (design § 11.3): zigzag (signed → unsigned),
 * then 5-bit groups with a continuation bit, each written as one character of the URL-safe base-64 alphabet (no
 * quote or backslash, so the string needs no escaping in the generated module). The idea is the well-known
 * "encoded polyline"; this is the project's own code. `encodeInts` is used by the data script only, `decodeInts` at
 * runtime.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VALUE = new Int8Array(128).fill(-1);
for (let i = 0; i < ALPHABET.length; i++) VALUE[ALPHABET.charCodeAt(i)] = i;

const LIMIT = 2 ** 51;

/** Encodes integers with |v| < 2^51 (any sign) into one string (zigzag doubles the magnitude). */
export function encodeInts(values: readonly number[]): string {
  let out = '';
  for (const v of values) {
    if (!Number.isInteger(v) || Math.abs(v) >= LIMIT) throw new RangeError(`not an integer below 2^51: ${v}`);
    // Zigzag without bit operators (they are 32-bit): 0, -1, 1, -2, 2 … → 0, 1, 2, 3, 4 …
    let z = v < 0 ? -2 * v - 1 : 2 * v;
    do {
      const chunk = z % 32;
      z = Math.floor(z / 32);
      out += ALPHABET[z > 0 ? chunk + 32 : chunk];
    } while (z > 0);
  }
  return out;
}

/** Decodes a string written by `encodeInts`. Throws on a character outside the alphabet or a truncated value. */
export function decodeInts(text: string): number[] {
  const out: number[] = [];
  let z = 0;
  let scale = 1;
  let open = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const c = code < 128 ? VALUE[code]! : -1;
    if (c < 0) throw new RangeError(`bad character at ${i}`);
    z += (c % 32) * scale;
    if (c >= 32) {
      scale *= 32;
      open = true;
    } else {
      out.push(z % 2 === 1 ? -(z + 1) / 2 : z / 2);
      z = 0;
      scale = 1;
      open = false;
    }
  }
  if (open) throw new RangeError('truncated value');
  return out;
}
