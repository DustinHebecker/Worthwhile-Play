/**
 * Renders every Pixel Peel motif to PNG for the owner's review (design v2 § 1.7); the output is never committed.
 *
 *   node packages/games/pixel-peel/scripts/render-motifs.ts [out-dir] [--only <id>] [--watch]
 *
 * Default output: packages/games/pixel-peel/renders/ (git-ignored). Per motif `<id>.png`: the three difficulty
 * renders side by side (32 at ×12, 40 at ×10, 48 at ×8), each with a palette strip (swatch with symbol, name, cell
 * count; a count under the minimum in red); `<id>-layers.png`: the hard render once per layer with that layer's mask
 * highlighted; and `contact-sheet.png` (all motifs at 48 × 4). Warnings: ΔE pairs below the thresholds, the despeckle
 * share, colours merged for size, and the rasterisation time.
 *
 * Node runs this TypeScript file directly (type stripping). A tiny resolve hook maps extensionless relative imports
 * to `.ts`, so the game's own `src/art/raster.ts`, `src/symbols.ts` and `src/motifs/` are used unchanged. The PNG
 * encoder uses only node:zlib.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, watch, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

register(
  `data:text/javascript,${encodeURIComponent(
    "export async function resolve(s, c, n) { try { return await n(s, c); } catch (e) { if (s.startsWith('.') && !/\\.[a-z]+$/.test(s)) return n(s + '.ts', c); throw e; } }"
  )}`
);

type RGB = [number, number, number];
interface Pic {
  w: number;
  h: number;
  rows: string[];
  palette: { key: string; hex: string; name: string }[];
  backdrop: string;
}
interface Report {
  picture: Pic;
  despeckled: number;
  mergedForSize: string[];
  orphans: string[];
  masks: (Uint8Array | null)[];
}
interface MotifLike {
  id: string;
  aspect: 'square' | 'wide';
  backdrop: string;
  palette: Record<string, readonly [string, string, number, string?]>;
  layers: readonly unknown[];
}

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../src');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const watching = args.includes('--watch');
const baking = args.includes('--bake');
const out = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--only') ?? join(here, '../renders'));

const rgb = (hex: string): RGB => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** A raster image with a minimal RGB PNG encoder. */
class Image {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
  constructor(width: number, height: number, fill: RGB = [246, 244, 239]) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) this.data.set(fill, i * 3);
  }
  set(x: number, y: number, c: RGB) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.data.set(c, (y * this.width + x) * 3);
  }
  get(x: number, y: number): RGB {
    const i = (y * this.width + x) * 3;
    return [this.data[i] as number, this.data[i + 1] as number, this.data[i + 2] as number];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  png(): Buffer {
    const raw = Buffer.alloc(this.height * (this.width * 3 + 1));
    for (let y = 0; y < this.height; y++) {
      raw[y * (this.width * 3 + 1)] = 0;
      Buffer.from(this.data.buffer, y * this.width * 3, this.width * 3).copy(raw, y * (this.width * 3 + 1) + 1);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(this.width, 0);
    header.writeUInt32BE(this.height, 4);
    header[8] = 8;
    header[9] = 2;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  }
}

/** A 3 × 5 pixel font (lower case, digits and a few signs). */
const FONT: Record<string, string> = {
  a: '010101111101101', b: '110101110101110', c: '011100100100011', d: '110101101101110', e: '111100110100111',
  f: '111100110100100', g: '011100101101011', h: '101101111101101', i: '111010010010111', j: '001001001101010',
  k: '101101110101101', l: '100100100100111', m: '101111111101101', n: '110101101101101', o: '010101101101010',
  p: '110101110100100', q: '010101101110011', r: '110101110101101', s: '011100010001110', t: '111010010010010',
  u: '101101101101111', v: '101101101101010', w: '101101111111101', x: '101101010101101', y: '101101010010010',
  z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
  '9': '111101111001110', '-': '000000111000000', '.': '000000000000010', ':': '000010000010000', ' ': '000000000000000',
  '!': '010010010000010', '/': '001001010100100', '<': '001010100010001', '=': '000111000111000'
};

function text(img: Image, x: number, y: number, s: string, c: RGB, scale = 2) {
  let cx = x;
  for (const ch of s.toLowerCase()) {
    const g = FONT[ch] ?? FONT['.']!;
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (g[r * 3 + k] === '1') img.rect(cx + k * scale, y + r * scale, scale, scale, c);
    cx += 4 * scale;
  }
  return cx;
}

async function main(): Promise<void> {
  const raster = (await import(pathToFileURL(join(src, 'art/raster.ts')).href)) as { rasteriseReport: (m: MotifLike, w: number, t: 1 | 2 | 3) => Report; minPixels: (w: number) => number };
  const symbols = (await import(pathToFileURL(join(src, 'symbols.ts')).href)) as { insideSymbol: (i: number, x: number, y: number) => boolean; inkFor: (hex: string) => string; deltaE: (a: string, b: string) => number };
  const bust = `?t=${Date.now()}`;
  const index = (await import(pathToFileURL(join(src, 'motifs/index.ts')).href + bust)) as { MOTIFS: readonly MotifLike[] };
  const sizes = (await import(pathToFileURL(join(src, 'art/sizes.ts')).href)) as {
    widthFor: (m: MotifLike, d: 'easy' | 'medium' | 'hard') => number;
    colourStats: (rows: readonly string[]) => { effective: number; atLeast2: number; largest: number; shares: Map<string, number> };
  };
  const bake = (await import(pathToFileURL(join(src, 'art/bake.ts')).href)) as { encodeRows: (rows: readonly string[]) => string };
  const baked: string[] = [];
  const motifs = index.MOTIFS.filter((m) => !only || m.id === only);
  mkdirSync(out, { recursive: true });

  const drawPicture = (img: Image, pic: Pic, ox: number, oy: number, s: number) => {
    const hex = new Map(pic.palette.map((p) => [p.key, rgb(p.hex)] as const));
    const back = rgb(pic.backdrop);
    for (let y = 0; y < pic.h; y++) for (let x = 0; x < pic.w; x++) img.rect(ox + x * s, oy + y * s, s, s, hex.get(pic.rows[y]![x]!) ?? back);
  };
  const drawSymbol = (img: Image, index: number, ox: number, oy: number, size: number, bg: string) => {
    const ink = rgb(symbols.inkFor(bg));
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (symbols.insideSymbol(index, ((x + 0.5) * 24) / size, ((y + 0.5) * 24) / size)) img.set(ox + x, oy + y, ink);
  };

  const sheet: { id: string; pic: Pic }[] = [];
  for (const m of motifs) {
    const levels = (['easy', 'medium', 'hard'] as const).map((d, k) => {
      const w = sizes.widthFor(m, d);
      return { d, w, tier: (k + 1) as 1 | 2 | 3, s: Math.floor(384 / w), de: k === 0 ? 18 : 12 };
    });
    const reports = levels.map((l) => {
      const t0 = performance.now();
      const r = raster.rasteriseReport(m, l.w, l.tier);
      return { ...l, r, ms: performance.now() - t0 };
    });
    const colW = 400;
    const gap = 16;
    const picH = Math.max(...reports.map((x) => x.r.picture.h * x.s));
    const strip = Math.max(...reports.map((x) => x.r.picture.palette.length)) * 16 + 8;
    const img = new Image(3 * colW + 4 * gap, picH + strip + 2 * gap + 20);
    text(img, gap, 6, m.id, [40, 40, 40]);
    const warnings: string[] = [];
    reports.forEach((x, k) => {
      const ox = gap + k * (colW + gap);
      const pic = x.r.picture;
      drawPicture(img, pic, ox, 24, x.s);
      const counts = new Map<string, number>();
      for (const row of pic.rows) for (const ch of row) counts.set(ch, (counts.get(ch) ?? 0) + 1);
      let y = 24 + picH + 8;
      const min = raster.minPixels(x.w);
      pic.palette.forEach((p, i) => {
        img.rect(ox, y, 14, 14, rgb(p.hex));
        drawSymbol(img, i, ox + 1, y + 1, 12, p.hex);
        const n = counts.get(p.key) ?? 0;
        const after = text(img, ox + 20, y + 2, `${p.key} ${p.name}`, [40, 40, 40]);
        text(img, Math.max(after + 8, ox + 230), y + 2, String(n), n < min ? [200, 0, 0] : [40, 40, 40]);
        y += 16;
      });
      const filled = pic.rows.join('').replace(/\./g, '').length;
      const share = x.r.despeckled / (pic.w * pic.h);
      const lowPairs: string[] = [];
      for (let i = 0; i < pic.palette.length; i++) {
        if (symbols.deltaE(pic.palette[i]!.hex, pic.backdrop) < 15) lowPairs.push(`${pic.palette[i]!.key}/backdrop`);
        for (let j = i + 1; j < pic.palette.length; j++) {
          const d = symbols.deltaE(pic.palette[i]!.hex, pic.palette[j]!.hex);
          if (d < x.de) lowPairs.push(`${pic.palette[i]!.key}${pic.palette[j]!.key}=${d.toFixed(1)}`);
        }
      }
      const tierKeys = Object.entries(m.palette).filter(([, spec]) => spec[2] <= x.tier).length;
      const st = sizes.colourStats(pic.rows);
      const line = `${m.id} @${x.w}: ${pic.palette.length} colours (tier keys ${tierKeys}), effective ${st.effective.toFixed(1)}, ≥2 % ${st.atLeast2}, largest ${(st.largest * 100).toFixed(0)} %, filled ${filled}/${pic.w * pic.h}, despeckle ${(share * 100).toFixed(1)} %, ${x.ms.toFixed(1)} ms`;
      warnings.push(line);
      if (pic.palette.length !== tierKeys) warnings.push(`  ! played colours differ from the tier's keys`);
      if (lowPairs.length) warnings.push(`  ! ΔE low: ${lowPairs.join(' ')}`);
      if (x.r.mergedForSize.length) warnings.push(`  ! merged for size: ${x.r.mergedForSize.join(' ')}`);
      if (x.r.orphans.length) warnings.push(`  ! ORPHANS: ${x.r.orphans.join(' ')}`);
      if (share > 0.02) warnings.push(`  ! despeckle over 2 %`);
    });
    writeFileSync(join(out, `${m.id}.png`), img.png());
    for (const r of reports) {
      const scale = Math.floor(512 / r.w);
      const single = new Image(r.r.picture.w * scale, r.r.picture.h * scale);
      drawPicture(single, r.r.picture, 0, 0, scale);
      writeFileSync(join(out, `${m.id}-${r.d}-${r.w}.png`), single.png());
    }
    baked.push(`  '${m.id}': [${reports.map((r) => `'${bake.encodeRows(r.r.picture.rows)}'`).join(', ')}]`);
    // Layers: the hard render once per layer, its mask brightened and outlined.
    const hard = reports[2]!.r;
    const tile = hard.picture.w * 3;
    const tileH = hard.picture.h * 3;
    const cols = 8;
    const count = hard.masks.length;
    const layers = new Image(cols * (tile + 6) + 6, Math.ceil(count / cols) * (tileH + 18) + 6);
    hard.masks.forEach((mask, k) => {
      const ox = 6 + (k % cols) * (tile + 6);
      const oy = 6 + Math.floor(k / cols) * (tileH + 18);
      text(layers, ox, oy, String(k), [40, 40, 40], 2);
      drawPicture(layers, hard.picture, ox, oy + 12, 3);
      for (let c = 0; c < hard.picture.w * hard.picture.h; c++) {
        const x = c % hard.picture.w;
        const y = Math.floor(c / hard.picture.w);
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 3; i++) {
            const px = ox + x * 3 + i;
            const py = oy + 12 + y * 3 + j;
            const [r, g, b] = layers.get(px, py);
            layers.set(px, py, mask?.[c] ? ((i + j) % 2 === 0 ? [255, 0, 255] : [r, g, b]) : [Math.round(r * 0.35 + 160), Math.round(g * 0.35 + 160), Math.round(b * 0.35 + 160)]);
          }
      }
    });
    writeFileSync(join(out, `${m.id}-layers.png`), layers.png());
    sheet.push({ id: m.id, pic: hard.picture });
    process.stdout.write(`${warnings.join('\n')}\n`);
  }

  if (!only) {
    const s = 3;
    const tile = 64 * s;
    const gap = 18;
    const cols = 5;
    const rows = Math.ceil(sheet.length / cols);
    const img = new Image(cols * tile + (cols + 1) * gap, rows * (tile + gap + 14) + gap);
    sheet.forEach(({ id, pic }, k) => {
      const ox = gap + (k % cols) * (tile + gap);
      const oy = gap + Math.floor(k / cols) * (tile + gap + 14);
      drawPicture(img, pic, ox, oy + Math.floor((tile - pic.h * s) / 2), s);
      text(img, ox, oy + tile + 3, id, [40, 40, 40], 2);
    });
    writeFileSync(join(out, 'contact-sheet.png'), img.png());
    if (baking) {
      const file = join(src, 'motifs/baked.ts');
      writeFileSync(
        file,
        `/** Generated by \`scripts/render-motifs.ts --bake\`; see \`src/art/bake.ts\`. Do not edit by hand. */\n// prettier-ignore\nexport const BAKED: Readonly<Record<string, readonly [string, string, string]>> = {\n${baked.join(',\n')}\n};\n`
      );
      process.stdout.write(`baked ${baked.length} motifs into ${file}\n`);
    }
  }
  process.stdout.write(`${motifs.length} motif(s) rendered to ${out}\n`);
}

await main();
if (watching) {
  process.stdout.write('Watching src/motifs and src/art …\n');
  let timer: ReturnType<typeof setTimeout> | undefined;
  for (const dir of ['motifs', 'art']) {
    watch(join(src, dir), () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Node caches modules; a fresh process gives fresh motif data.
        spawnSync(process.execPath, [fileURLToPath(import.meta.url), out, ...(only ? ['--only', only] : [])], { stdio: 'inherit' });
      }, 150);
    });
  }
}
