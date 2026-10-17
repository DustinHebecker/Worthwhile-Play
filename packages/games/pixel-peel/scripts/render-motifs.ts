/**
 * Renders every Pixel Peel motif to PNG for the owner's review (design § 6.3); the output is never committed.
 *
 *   node packages/games/pixel-peel/scripts/render-motifs.ts [output-dir]
 *
 * Default output: packages/games/pixel-peel/renders/ (git-ignored). Writes `<id>.png` (×16, on the backdrop) and
 * `contact-sheet.png` (all motifs ×8 in `MOTIFS` order). Node runs this TypeScript file directly (type stripping,
 * Node ≥ 22.18); the PNG encoder uses only node:zlib. Motif files are imported one by one (they only import types),
 * and `src/motifs/index.ts` is read as text for the order, because Node does not resolve extensionless imports.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

interface MotifData {
  id: string;
  backdrop: string;
  palette: Record<string, readonly [string, string]>;
  rows: readonly string[];
}

const here = dirname(fileURLToPath(import.meta.url));
const motifDir = resolve(here, '../src/motifs');
const out = resolve(process.argv[2] ?? join(here, '../renders'));

const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** A minimal RGB PNG encoder (8 bit, no interlace, filter 0 per row). */
function png(width: number, height: number, pixel: (x: number, y: number) => [number, number, number]): Buffer {
  const raw = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      raw[row + 1 + x * 3] = r;
      raw[row + 2 + x * 3] = g;
      raw[row + 3 + x * 3] = b;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const colourAt = (m: MotifData, x: number, y: number): [number, number, number] => {
  const ch = m.rows[y]?.[x] ?? '.';
  const entry = m.palette[ch];
  return rgb(entry ? entry[0] : m.backdrop);
};

async function main(): Promise<void> {
  const order = [...readFileSync(join(motifDir, 'index.ts'), 'utf8').matchAll(/from '\.\/([a-z0-9-]+)'/g)].map((m) => m[1] as string).filter((f) => f !== 'types');
  const files = readdirSync(motifDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts');
  const byFile = new Map<string, MotifData>();
  for (const file of files) {
    const mod = (await import(pathToFileURL(join(motifDir, file)).href)) as Record<string, MotifData>;
    const motif = Object.values(mod).find((v) => typeof v === 'object' && v !== null && Array.isArray(v.rows));
    if (motif) byFile.set(file.replace(/\.ts$/, ''), motif);
  }
  const motifs = [...order.filter((f) => byFile.has(f)), ...[...byFile.keys()].filter((f) => !order.includes(f)).sort()].map((f) => byFile.get(f) as MotifData);
  mkdirSync(out, { recursive: true });

  const scale = 16;
  for (const m of motifs) {
    const w = (m.rows[0] ?? '').length;
    const h = m.rows.length;
    writeFileSync(join(out, `${m.id}.png`), png(w * scale, h * scale, (x, y) => colourAt(m, Math.floor(x / scale), Math.floor(y / scale))));
  }

  // Contact sheet: 4 columns of 24 × 24-cell tiles (×8), centred on their backdrop, on a neutral page.
  const s = 8;
  const tile = 24 * s;
  const gap = 16;
  const cols = 4;
  const rows = Math.ceil(motifs.length / cols);
  const W = cols * tile + (cols + 1) * gap;
  const H = rows * tile + (rows + 1) * gap;
  const page: [number, number, number] = [246, 244, 239];
  writeFileSync(
    join(out, 'contact-sheet.png'),
    png(W, H, (x, y) => {
      const col = Math.floor((x - gap) / (tile + gap));
      const row = Math.floor((y - gap) / (tile + gap));
      const m = motifs[row * cols + col];
      const tx = x - gap - col * (tile + gap);
      const ty = y - gap - row * (tile + gap);
      if (!m || col < 0 || row < 0 || tx < 0 || ty < 0 || tx >= tile || ty >= tile) return page;
      const w = (m.rows[0] ?? '').length;
      const h = m.rows.length;
      const ox = Math.floor((tile - w * s) / 2);
      const oy = Math.floor((tile - h * s) / 2);
      const cx = Math.floor((tx - ox) / s);
      const cy = Math.floor((ty - oy) / s);
      if (tx < ox || ty < oy || cx >= w || cy >= h) return page;
      return colourAt(m, cx, cy);
    })
  );
  process.stdout.write(`${motifs.length} motifs rendered to ${out}\n`);
}

await main();
