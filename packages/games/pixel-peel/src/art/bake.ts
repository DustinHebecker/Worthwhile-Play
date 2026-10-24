/**
 * Baked pictures (design v2 § 1.7): the rasteriser's output stored as run-length rows, so a phone never rasterises
 * at start (supersampled rasterising is far too slow for the start budget). A row is runs of `<key><count>`, the
 * count left out when it is 1; rows are joined by `/`. The motif tests check every baked picture against the
 * rasteriser, so the vector motif stays the source.
 */

export function encodeRows(rows: readonly string[]): string {
  return rows
    .map((row) => {
      let out = '';
      for (let i = 0; i < row.length; ) {
        let j = i + 1;
        while (j < row.length && row[j] === row[i]) j++;
        out += (row[i] as string) + (j - i > 1 ? String(j - i) : '');
        i = j;
      }
      return out;
    })
    .join('/');
}

/** The rows, or undefined for a malformed string. */
export function decodeRows(data: string): string[] | undefined {
  const rows: string[] = [];
  for (const part of data.split('/')) {
    let row = '';
    for (let i = 0; i < part.length; ) {
      const key = part[i] as string;
      if (!/[a-z.]/.test(key)) return undefined;
      let j = i + 1;
      while (j < part.length && (part[j] as string) >= '0' && (part[j] as string) <= '9') j++;
      const n = j > i + 1 ? Number(part.slice(i + 1, j)) : 1;
      if (!(n >= 1 && n <= 256)) return undefined;
      row += key.repeat(n);
      i = j;
    }
    rows.push(row);
  }
  return rows;
}
