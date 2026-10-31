/** Minimal binary min-heap over integer tuples compared lexicographically (fully ordered keys ⇒ deterministic pops). */
export class TupleHeap {
  private readonly items: number[][] = [];

  get size(): number {
    return this.items.length;
  }

  push(item: number[]): void {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (less(a[i] as number[], a[p] as number[])) {
        [a[i], a[p]] = [a[p] as number[], a[i] as number[]];
        i = p;
      } else break;
    }
  }

  pop(): number[] | undefined {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0 && last) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && less(a[l] as number[], a[m] as number[])) m = l;
        if (r < a.length && less(a[r] as number[], a[m] as number[])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m] as number[], a[i] as number[]];
        i = m;
      }
    }
    return top;
  }
}

function less(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] as number) - (b[i] as number);
    if (d !== 0) return d < 0;
  }
  return false;
}
