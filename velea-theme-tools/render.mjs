import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [,, html, out] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1600, height: 1600 } });
await p.goto('file://' + html, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
for (const id of ['v1','v2','v3','v4']) await p.locator('#'+id).screenshot({ path: `${out}/${id}.png` });
await p.locator('#fav').screenshot({ path: `${out}/favicon.png`, omitBackground: true });
await b.close();
