// @ts-nocheck
// License gate (CI). Two levels:
//  1. Code that ships to users (production dependencies + bundled runtime such as workbox)
//     must use a permissive license from STRICT.
//  2. Development tooling may additionally use REVIEWED_TOOLING licenses for the listed packages,
//     because it is never distributed with the app.
// Adding anything else requires a documented review (CONTRIBUTING.md → "Third-party code and assets").
import { execFileSync } from 'node:child_process';

const STRICT = new Set(['MIT', 'MIT-0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'Apache-2.0', 'CC0-1.0', 'BlueOak-1.0.0', 'Unlicense']);
const TOOLING = new Set([...STRICT, 'Python-2.0', 'CC-BY-4.0', 'MPL-2.0']);
const REVIEWED_TOOLING = {
  '@img/sharp-libvips-linux-x64': 'LGPL-3.0, image library pulled in by wrangler/miniflare for local dev; not bundled',
  '@img/sharp-libvips-linuxmusl-x64': 'LGPL-3.0, same as above',
  '@img/sharp-libvips-darwin-arm64': 'LGPL-3.0, same as above',
  '@img/sharp-libvips-darwin-x64': 'LGPL-3.0, same as above',
  '@img/sharp-libvips-linux-arm64': 'LGPL-3.0, same as above',
  'spdx-exceptions': 'CC-BY-3.0 data file used by license tooling; not bundled',
  'spdx-ranges': 'MIT AND CC-BY-3.0 data used by license tooling; not bundled'
};
const BUNDLED_FROM_DEV = /^workbox-|^vite-plugin-pwa$/;

const list = (args) => {
  const out = execFileSync('pnpm', ['licenses', 'list', '--json', '-r', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.trim().startsWith('{') ? JSON.parse(out) : {}; // pnpm prints a sentence when the list is empty
};
const flatten = (byLicense) => Object.entries(byLicense).flatMap(([license, pkgs]) => pkgs.map((p) => ({ name: p.name, versions: p.versions, license })));
const accepts = (license, allowed) => license.replace(/[()]/g, '').split(/\s+OR\s+/).some((alt) => alt.split(/\s+AND\s+/).every((l) => allowed.has(l.trim())));

const problems = [];
const prod = flatten(list(['--prod']));
const all = flatten(list([]));
for (const pkg of all) {
  const shipped = prod.some((p) => p.name === pkg.name) || BUNDLED_FROM_DEV.test(pkg.name);
  if (shipped ? !accepts(pkg.license, STRICT) : !accepts(pkg.license, TOOLING) && !(pkg.name in REVIEWED_TOOLING)) {
    problems.push(`${pkg.name}@${pkg.versions.join(',')}: ${pkg.license}${shipped ? ' (shipped to users)' : ''}`);
  }
}
console.log(`Checked ${all.length} packages (${prod.length} production).`);
if (problems.length) {
  console.error('License check failed:\n' + problems.map((p) => `  ✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('License check passed.');
