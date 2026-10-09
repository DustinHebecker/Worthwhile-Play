// Renders the brand assets (app icons, favicons, header logo, link preview) from
// assets/brand/brain-controller.webp into apps/web/public. Uses Playwright's Chromium (no image libraries).
// Usage: node scripts/generate-icons.mjs  (set PLAYWRIGHT_CHROMIUM_EXECUTABLE if Chromium is preinstalled elsewhere)
// The link-preview text uses the "DejaVu Sans" font when installed (falls back to the system sans-serif).
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const pub = new URL('../apps/web/public/', import.meta.url);
const page_ = new URL('./brand/render.html', import.meta.url);
const ICON_BG = "['#b3cfc1','#80a895']"; // mid sage gradient behind the green logo
const GREEN = 'greenLogo(163, 0.45, 0.72)'; // logo recoloured to the site green (#2f5d50 family)
const targets = [
  ['icon-512.png', `withLogo(${GREEN}, () => icon(512, ${ICON_BG}, 'rounded', 0.80))`],
  ['icon-192.png', `shrink(withLogo(${GREEN}, () => icon(768, ${ICON_BG}, 'rounded', 0.80)), 192)`],
  ['maskable-512.png', `withLogo(${GREEN}, () => icon(512, ${ICON_BG}, 'full', 0.62))`],
  // iOS fills transparency with black and rounds the corners itself: opaque full-bleed square.
  ['apple-touch-icon.png', `shrink(withLogo(${GREEN}, () => icon(720, ${ICON_BG}, 'full', 0.74)), 180)`],
  ['favicon-16.png', `shrink(withLogo(${GREEN}, () => icon(512, null, 'bare', 0.98)), 16)`],
  ['favicon-32.png', `shrink(withLogo(${GREEN}, () => icon(512, null, 'bare', 0.98)), 32)`],
  ['favicon-48.png', `shrink(withLogo(${GREEN}, () => icon(512, null, 'bare', 0.98)), 48)`],
  ['logo.png', `shrink(withLogo(${GREEN}, () => icon(512, null, 'bare', 0.98)), 128)`],
  ['og-image.png', `withLogo(${GREEN}, () => og('#f6f4ef', '#2f5d50', 'Thinking games · no ads · no tracking · offline'))`]
];

const browser = await chromium.launch({
  args: ['--allow-file-access-from-files'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {})
});
const page = await browser.newPage();
await page.goto(page_.href);
await page.evaluate(() => window.cut());
const png = {};
for (const [target, js] of targets) {
  png[target] = Buffer.from((await page.evaluate(js)).split(',')[1], 'base64');
  writeFileSync(new URL(target, pub), png[target]);
  console.log(`wrote ${target}`);
}
await browser.close();

// favicon.ico embedding the 16/32/48 px PNGs (for browsers that request /favicon.ico directly).
const sizes = [16, 32, 48];
const images = sizes.map((s) => png[`favicon-${s}.png`]);
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(sizes[i], at); header.writeUInt8(sizes[i], at + 1);
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(img.length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += img.length;
});
writeFileSync(new URL('favicon.ico', pub), Buffer.concat([header, ...images]));
console.log('wrote favicon.ico');
