// @ts-nocheck
// Renders the SVG app icons to the PNG sizes required for PWA installation.
// Usage: node scripts/generate-icons.mjs  (needs Playwright Chromium; set PLAYWRIGHT_CHROMIUM_EXECUTABLE if preinstalled)
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const pub = new URL('../apps/web/public/', import.meta.url);
const targets = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon.svg', 'apple-touch-icon.png', 180],
  ['maskable-icon.svg', 'maskable-512.png', 512]
];
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {});
const page = await browser.newPage();
for (const [source, target, size] of targets) {
  const svg = readFileSync(new URL(source, pub), 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: new URL(target, pub).pathname, omitBackground: true });
  console.log(`wrote ${target}`);
}
await browser.close();
