// VELEA product visuals: one HTML page per visual, rendered at 1500 × 1500 CSS px × 2 = 3000 × 3000 px JPEG.
// Every claim comes from the product data in Shopify (description and metafields); the only photo is the shop's own banner.
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const DIR = __dirname; const OUT = path.join(DIR, 'out');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const font = (pkg, file) => 'file://' + path.join(DIR, 'node_modules/@fontsource', pkg, 'files', file);
const asset = (name) => 'file://' + path.join(DIR, 'assets', name);

/* Line icons: the theme's set (24 grid, 1.5 stroke) plus a few drawn for these visuals */
const ICONS = {
  heat: '<path d="M13.5 14.6V5a1.5 1.5 0 0 0-3 0v9.6a3.5 3.5 0 1 0 3 0z"/><path d="M12 17.5V11"/><path d="M17 6h2.5M17 9.5h2.5"/>',
  vibration: '<circle cx="12" cy="12" r="1.8"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
  battery: '<rect x="2.5" y="7" width="16" height="10" rx="2"/><path d="M21.5 10.5v3"/><path d="M6.5 10v4M10 10v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  power: '<path d="M12 3.5v8"/><path d="M6.6 7a7.5 7.5 0 1 0 10.8 0"/>',
  box: '<path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5L12 11.5l8.5-4"/><path d="M12 11.5v9"/>',
  feather: '<path d="M20 12.2a6.2 6.2 0 0 0-8.8-8.8L5 9.6V19h9.4z"/><path d="M15.5 8.5L3 21"/><path d="M17 15H9.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.8v.1"/>',
  plug: '<path d="M9 3v4M15 3v4"/><path d="M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z"/><path d="M12 16v5"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5"/>',
  layers: '<path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z"/><path d="M3.5 12L12 16.5l8.5-4.5"/><path d="M3.5 16L12 20.5l8.5-4.5"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  water: '<path d="M4 9c2 0 2-1.5 4-1.5S10 9 12 9s2-1.5 4-1.5S18 9 20 9"/><path d="M4 13.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/><path d="M4 18c2 0 2-1.5 4-1.5S10 18 12 18s2-1.5 4-1.5S18 18 20 18"/>',
  wash: '<path d="M3.5 7.5h17l-1.6 10.6a2 2 0 0 1-2 1.7H7.1a2 2 0 0 1-2-1.7z"/><path d="M6 11c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1"/>',
  nosoftener: '<rect x="7" y="7" width="10" height="13" rx="2"/><path d="M10 4h4v3h-4z"/><path d="M4 4l16 16"/>',
  air: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8"/>',
  cable: '<path d="M8 3h4v5H8z"/><path d="M9 3V1.5M11 3V1.5"/><path d="M10 8v3c0 3 4 3 4 6v1"/><rect x="12" y="18" width="4" height="4" rx="1"/>',
  notice: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 11h7M9 14.5h7M9 18h4"/>',
  snap: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/>',
  belt: '<rect x="6" y="8" width="12" height="8" rx="4"/><path d="M1.5 12H6M18 12h4.5"/><path d="M10 12h.01M12 12h.01M14 12h.01"/>',
  flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-9-1.5 2-2 3.5-2 5-1-1-1.5-2-1.5-3C8 10 6 12.5 6 15a6 6 0 0 0 6 6z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

/* ---------- Drawings (flat illustrations, always presented as such) ---------- */
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#49352f" flood-opacity=".22"/></filter>
  <filter id="softsm" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#49352f" flood-opacity=".25"/></filter>
  <linearGradient id="brShade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".30"/><stop offset=".28" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".30"/></linearGradient>
  <linearGradient id="brTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
  <radialGradient id="padGrey" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="#a7a2a0"/><stop offset=".7" stop-color="#8d8886"/><stop offset="1" stop-color="#7a7573"/></radialGradient>
  <pattern id="padTex" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v7" stroke="#fff" stroke-opacity=".07" stroke-width="2.4"/></pattern>
  <linearGradient id="podFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe3e6"/><stop offset="1" stop-color="#eab5bd"/></linearGradient>
  <marker id="arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1l8 4-8 4" fill="none" stroke="#c9727e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker>
</defs></svg>`;

/* Briefs, front view, in a 400 × 320 box */
const BRIEFS_BODY = 'M38 46 Q200 66 362 46 L354 118 C318 136 262 178 240 276 Q200 288 160 276 C138 178 82 136 46 118 Z';
const briefsG = (fill, { stitch = 'rgba(255,255,255,.32)', shadow = true } = {}) => `
<g ${shadow ? 'filter="url(#soft)"' : ''}>
  <path d="${BRIEFS_BODY}" fill="${fill}"/>
  <path d="${BRIEFS_BODY}" fill="url(#brShade)"/>
  <path d="M38 46 Q200 66 362 46 L359 76 Q200 96 41 76 Z" fill="url(#brTop)"/>
  <path d="M172 214 Q200 222 228 214 L238 272 Q200 284 162 272 Z" fill="#fff" fill-opacity=".09"/>
  <g fill="none" stroke="${stitch}" stroke-width="2" stroke-dasharray="6 6">
    <path d="M44 84 Q200 104 356 84"/>
    <path d="M56 126 C90 142 140 182 166 266"/><path d="M344 126 C310 142 260 182 234 266"/>
  </g>
</g>`;
const briefs = (fill, opts) => `<svg viewBox="0 0 400 320" class="ill">${briefsG(fill, opts)}</svg>`;

/* Washable pad, top view, centred on (150, 166) in a 300 × 340 box */
const PAD_BODY = 'M150 18 C196 18 210 52 210 96 C210 130 200 148 200 166 C200 184 210 202 210 236 C210 280 196 314 150 314 C104 314 90 280 90 236 C90 202 100 184 100 166 C100 148 90 130 90 96 C90 52 104 18 150 18 Z';
const PAD_IN = 'M150 32 C186 32 197 60 197 99 C197 131 188 149 188 166 C188 183 197 201 197 233 C197 272 186 300 150 300 C114 300 103 272 103 233 C103 201 112 183 112 166 C112 149 103 131 103 99 C103 60 114 32 150 32 Z';
const padG = ({ wings = true, shadow = 'soft' } = {}) => `
<g ${shadow ? `filter="url(#${shadow})"` : ''}>
  ${wings ? `<path d="M106 138 C70 136 38 148 30 166 C38 184 70 196 106 194 Z" fill="#2b2523"/>
  <path d="M194 138 C230 136 262 148 270 166 C262 184 230 196 194 194 Z" fill="#2b2523"/>
  <circle cx="54" cy="166" r="10" fill="#5b524e"/><circle cx="54" cy="166" r="5" fill="none" stroke="#2b2523" stroke-width="2"/>
  <circle cx="246" cy="166" r="10" fill="#5b524e"/><circle cx="246" cy="166" r="3.5" fill="#2b2523"/>` : ''}
  <path d="${PAD_BODY}" fill="#2b2523"/>
  <path d="${PAD_IN}" fill="url(#padGrey)"/>
  <path d="${PAD_IN}" fill="url(#padTex)"/>
  <path d="${PAD_IN}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" stroke-dasharray="5 5" transform="translate(150 166) scale(.94) translate(-150 -166)"/>
</g>`;

/* Heating belt: front and side technical views of the control unit (proportions 18,5 × 8 × 2,5 cm) */
function beltDrawing() {
  // 40 px per cm: 18,5 × 8 cm front view, 2,5 cm thick side view
  const W = 740, H = 320, D = 100, X = 180, Y = 30;
  const dim = (x1, y1, x2, y2, label, lx, ly, anchor = 'middle') => `
    <path d="M${x1} ${y1} L${x2} ${y2}" stroke="#c9727e" stroke-width="2.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="DM" font-size="28" font-weight="500" fill="#a24c5d">${label}</text>`;
  return `<svg viewBox="0 0 1200 ${Y + H + 110 + D + 20}" style="display:block;width:100%;max-height:470px">
  <g filter="url(#soft)">
    <rect x="${X - 120}" y="${Y + H / 2 - 34}" width="120" height="68" rx="10" fill="#cfc4c0"/>
    <rect x="${X + W}" y="${Y + H / 2 - 34}" width="120" height="68" rx="10" fill="#cfc4c0"/>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${H / 2}" fill="url(#podFill)"/>
    <path d="M${X + 60} ${Y + 150} C${X + 230} ${Y + 110} ${X + 420} ${Y + 190} ${X + W - 60} ${Y + 140}" fill="none" stroke="#c98f98" stroke-width="2" opacity=".7"/>
    <rect x="${X + W / 2 - 92}" y="${Y + 54}" width="184" height="84" rx="26" fill="#1f1a19"/>
    <text x="${X + W / 2}" y="${Y + 112}" text-anchor="middle" font-family="DM" font-size="44" font-weight="600" fill="#5fe08c" letter-spacing="4">88</text>
    ${[-60, 0, 60].map((o) => `<rect x="${X + W / 2 + o - 22}" y="${Y + 168}" width="44" height="28" rx="14" fill="#f6d3d8" stroke="#c98f98" stroke-width="2"/>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${X + 150 + i * 2} ${Y + 236 + i * 6} H${X + W - 150 - i * 2}" stroke="#d99aa3" stroke-width="3" stroke-dasharray="3 7" opacity="${0.9 - i * 0.05}"/>`).slice(0, 5).join('')}
  </g>
  ${dim(X, Y + H + 34, X + W, Y + H + 34, '18,5 cm', X + W / 2, Y + H + 76)}
  ${dim(X + W + 140, Y, X + W + 140, Y + H, '8 cm', X + W + 162, Y + H / 2 + 10, 'start')}
  <g filter="url(#softsm)"><rect x="${X}" y="${Y + H + 110}" width="${W}" height="${D}" rx="${D / 2}" fill="url(#podFill)"/></g>
  ${dim(X + W + 140, Y + H + 110, X + W + 140, Y + H + 110 + D, '2,5 cm', X + W + 162, Y + H + 110 + D / 2 + 10, 'start')}
  <text x="${X - 20}" y="${Y + H + 110 + D / 2 + 9}" text-anchor="end" font-family="DM" font-size="20" letter-spacing="2" fill="#6e574c">PROFIL</text>
</svg>`;
}

const page = (body, { product, tone = 'cream' } = {}) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face{font-family:DM;src:url(${font('dm-sans', 'dm-sans-latin-400-normal.woff2')});font-weight:400}
@font-face{font-family:DM;src:url(${font('dm-sans', 'dm-sans-latin-500-normal.woff2')});font-weight:500}
@font-face{font-family:DM;src:url(${font('dm-sans', 'dm-sans-latin-600-normal.woff2')});font-weight:600}
@font-face{font-family:PF;src:url(${font('playfair-display', 'playfair-display-latin-400-normal.woff2')});font-weight:400}
@font-face{font-family:PF;src:url(${font('playfair-display', 'playfair-display-latin-400-italic.woff2')});font-weight:400;font-style:italic}
@font-face{font-family:PF;src:url(${font('playfair-display', 'playfair-display-latin-500-normal.woff2')});font-weight:500}
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#3a2a25;--text:#49352f;--muted:#6e574c;--rose:#a24c5d;--rose-2:#c9727e;--rose-pale:#f8e9ea;--rose-mid:#f3dadd;--cream:#fcf9f7;--warm:#896f61;--line:rgba(137,111,97,.22)}
html,body{width:1500px;height:1500px}
body{font-family:DM,sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;overflow:hidden;
  background:${tone === 'rose'
    ? 'radial-gradient(1200px 900px at 85% 0%, #fdf3f4 0%, transparent 60%), linear-gradient(180deg,#f8e9ea 0%,#f3dadd 100%)'
    : 'radial-gradient(1100px 800px at 90% -10%, #f8e6e8 0%, transparent 62%), radial-gradient(900px 700px at -10% 110%, #f6e2e4 0%, transparent 60%), #fcf9f7'}}
.frame{position:absolute;inset:0;padding:96px 110px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;height:64px}
.brand{display:flex;align-items:center;gap:16px}
.brand img{height:62px}
.brand span{font-family:PF;font-size:34px;letter-spacing:.34em;color:var(--ink)}
.tag{font-size:20px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.eyebrow{display:flex;align-items:center;gap:18px;margin-top:60px;font-size:22px;font-weight:500;letter-spacing:.26em;text-transform:uppercase;color:var(--rose)}
.eyebrow::before{content:'';width:56px;height:1.5px;background:currentColor;opacity:.6}
h1{margin-top:22px;font-family:PF;font-weight:400;font-size:86px;line-height:1.06;letter-spacing:-.01em;color:var(--ink)}
h1 em{font-style:italic;color:var(--rose)}
.lead{margin-top:22px;font-size:30px;line-height:1.5;color:var(--muted);max-width:1100px}
.ic{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.ring{display:grid;place-items:center;width:92px;height:92px;flex:none;border-radius:50%;color:var(--rose);
  background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.9),rgba(201,114,126,.12) 72%);box-shadow:inset 0 0 0 1.5px rgba(201,114,126,.4)}
.ring .ic{width:46px;height:46px}
.photo{border-radius:44px;overflow:hidden;box-shadow:0 50px 90px -50px rgba(73,53,47,.55),0 0 0 1px rgba(255,255,255,.6) inset;background:#f4ece9}
.photo img{display:block;width:100%;height:100%;object-fit:cover}
.foot{margin-top:auto;padding-top:28px;font-size:20px;line-height:1.5;color:var(--muted)}
.card{background:rgba(255,255,255,.72);border:1.5px solid rgba(255,255,255,.9);border-radius:36px;box-shadow:0 30px 60px -44px rgba(73,53,47,.5)}
.num{font-family:PF;font-style:italic;color:var(--rose)}
.ill{display:block;width:100%;height:auto;overflow:visible}
.fill{flex:1;min-height:0}
.band{display:flex;align-items:center;gap:24px;padding:30px 40px;border-radius:32px;background:rgba(162,76,93,.08);font-size:26px;line-height:1.5;color:var(--text)}
.band .ring{width:72px;height:72px}.band .ring .ic{width:36px;height:36px}
.pill{flex:1;display:grid;place-items:center;height:100px;border-radius:999px;background:#fff;font-family:PF;font-size:40px;color:var(--ink);box-shadow:inset 0 0 0 1.5px rgba(201,114,126,.35)}
</style></head><body>${DEFS}<div class="frame">
<div class="top"><div class="brand"><img src="${asset('velea-monogramme.png')}" alt=""><span>VELEA</span></div><div class="tag">${product}</div></div>
${body}
</div></body></html>`;

const BELT = 'Ceinture chauffante';
const CULOTTE = 'Culotte menstruelle';
const SERV = 'Serviettes lavables';
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const sizeRow = (mt = 40) => `<div style="display:flex;gap:16px;margin-top:${mt}px">${SIZES.map((s) => `<div class="pill">${s}</div>`).join('')}</div>`;

const visuals = [
  /* ---------- Ceinture ---------- */
  { id: 'ceinture-01-essentiel', product: 'belt', alt: "Ceinture chauffante VELEA rose : trois niveaux de chaleur (50, 55, 60 °C), massage par vibration 4 modes, sans fil avec environ 2 h d'autonomie, arrêt automatique au bout de 30 minutes",
    html: page(`
<p class="eyebrow">La ceinture VELEA</p>
<h1>L'essentiel, <em>en un coup d'œil.</em></h1>
<div class="photo" style="margin-top:52px;height:560px"><img src="${asset('belt-pink.jpg')}" alt=""></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:40px">
  ${[['heat', '50 · 55 · 60 °C', 'Trois niveaux de chaleur'], ['vibration', '4 modes', 'Massage par vibration, avec ou sans chaleur'], ['battery', '≈ 2 h', "Sans fil, d'autonomie*"], ['clock', '30 min', 'Arrêt automatique']]
    .map(([i, v, l]) => `<div class="card" style="padding:30px 26px;display:grid;gap:16px;align-content:start"><div class="ring">${icon(i)}</div><div style="font-family:PF;font-size:${v.length > 10 ? 40 : 52}px;line-height:1.05;color:var(--ink)">${v}</div><div style="font-size:23px;line-height:1.4;color:var(--muted)">${l}</div></div>`).join('')}
</div>
<p class="foot">* Environ 2 h selon les réglages, d'après le fabricant. Accessoire de confort, elle ne remplace pas un avis médical.</p>`, { product: BELT }) },

  { id: 'ceinture-02-chaleur', product: 'belt', alt: 'Ceinture chauffante VELEA : chaleur réglable sur 3 niveaux, 50, 55 et 60 °C, et massage par vibration en 4 modes, M1 à M4, avec ou sans chaleur',
    html: page(`
<p class="eyebrow">Chaleur et massage</p>
<h1>Une chaleur <em>que vous choisissez.</em></h1>
<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:40px;margin-top:60px" class="fill">
  <div class="card" style="padding:56px 56px 48px;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:20px"><div class="ring">${icon('heat')}</div><p style="font-size:30px;font-weight:500;color:var(--ink)">Trois niveaux de chaleur</p></div>
    <div style="flex:1;display:flex;align-items:flex-end;gap:44px;margin-top:30px;padding-inline:20px">
      ${[['50', 300, 'Niveau 1', '#ebbdc4'], ['55', 410, 'Niveau 2', '#d98f9b'], ['60', 520, 'Niveau 3', '#b4596a']].map(([t, h, n, c]) => `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:20px">
        <div style="font-family:PF;font-size:66px;color:var(--ink)">${t}<span style="font-size:34px"> °C</span></div>
        <div style="width:100%;height:${h}px;border-radius:999px 999px 28px 28px;background:linear-gradient(180deg,${c} 0%,#f6dfe2 100%);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7)"></div>
        <div style="font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">${n}</div>
      </div>`).join('')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:40px">
    <div class="card" style="padding:48px;flex:1;display:flex;flex-direction:column;gap:30px;justify-content:center">
      <div style="display:flex;align-items:center;gap:20px"><div class="ring">${icon('vibration')}</div><p style="font-size:30px;font-weight:500;color:var(--ink)">Massage par vibration</p></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">
        ${['M1', 'M2', 'M3', 'M4'].map((m) => `<div style="display:grid;place-items:center;height:110px;border-radius:26px;font-family:PF;font-size:44px;color:var(--rose);background:#fff;box-shadow:inset 0 0 0 1.5px rgba(201,114,126,.35)">${m}</div>`).join('')}
      </div>
      <p style="font-size:26px;line-height:1.5;color:var(--muted)">Quatre modes, d'un appui court. Avec ou sans la chaleur.</p>
    </div>
    <div class="band" style="align-items:flex-start">
      <div class="ring">${icon('info')}</div>
      <p>Commencez toujours par le niveau le plus doux, et surveillez votre peau.</p>
    </div>
  </div>
</div>`, { product: BELT }) },

  { id: 'ceinture-03-utilisation', product: 'belt', alt: "Mode d'emploi de la ceinture chauffante VELEA en 4 étapes : charger, placer sur le bas du ventre par-dessus un vêtement fin, allumer d'un appui long et choisir la chaleur, arrêt automatique après 30 minutes",
    html: page(`
<p class="eyebrow">Mode d'emploi</p>
<h1>Prête en <em>quatre gestes.</em></h1>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:56px" class="fill">
  ${[['plug', 'Chargez-la', "Complètement, avant la première utilisation : le voyant est rouge pendant la charge, puis vert quand elle est prête."],
    ['belt', 'Placez-la', 'Sur le bas du ventre, par-dessus un vêtement fin, puis ajustez la sangle.'],
    ['power', 'Allumez-la', "D'un appui long. Un appui court choisit ensuite la chaleur (50, 55 ou 60 °C) ou le massage (M1 à M4)."],
    ['clock', 'Laissez faire', "Elle s'arrête seule au bout de 30 minutes. Faites une pause avant de la relancer."]]
    .map(([i, t, d], n) => `<div class="card" style="padding:46px 46px;display:flex;flex-direction:column;gap:22px;justify-content:center">
      <div style="display:flex;align-items:center;justify-content:space-between"><div class="ring">${icon(i)}</div><span class="num" style="font-size:96px;line-height:.8;opacity:.9">${n + 1}</span></div>
      <p style="font-family:PF;font-size:46px;color:var(--ink)">${t}</p>
      <p style="font-size:26px;line-height:1.5;color:var(--muted)">${d}</p></div>`).join('')}
</div>
<p class="foot">Ne pas l'utiliser pendant le sommeil. Elle ne fonctionne pas pendant la charge, par sécurité.</p>`, { product: BELT }) },

  { id: 'ceinture-04-coffret', product: 'belt', alt: "Contenu du colis de la ceinture chauffante VELEA : 1 ceinture chauffante, 1 câble de charge USB et 1 notice d'utilisation ; le Duo contient deux ensembles complets",
    html: page(`
<p class="eyebrow">Dans le colis</p>
<h1>Tout ce qu'il faut, <em>rien de superflu.</em></h1>
<div class="photo fill" style="margin-top:52px"><img src="${asset('belt-pink-tall.jpg')}" alt="" style="object-position:50% 55%"></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:36px">
  ${[['belt', '1 ceinture chauffante'], ['cable', '1 câble de charge USB'], ['notice', "1 notice d'utilisation"]]
    .map(([i, t]) => `<div class="card" style="padding:34px;display:flex;align-items:center;gap:24px"><div class="ring">${icon(i)}</div><p style="font-size:28px;line-height:1.35;color:var(--ink)">${t}</p></div>`).join('')}
</div>
<div style="margin-top:24px;display:flex;align-items:center;gap:22px;padding:28px 40px;border-radius:999px;background:linear-gradient(135deg,#b4596a,#a24c5d);color:#fff;font-size:27px">
  <span style="font-family:PF;font-style:italic;font-size:38px">Duo</span><span>Deux ensembles complets : deux ceintures, deux câbles, deux notices.</span>
</div>`, { product: BELT }) },

  { id: 'ceinture-05-fiche-technique', product: 'belt', alt: "Fiche technique de la ceinture chauffante VELEA : boîtier de 18,5 × 8 × 2,5 cm, 142 g, 3 niveaux de chaleur, massage 4 modes, batterie 1 800 mAh, 5 V / 1 A, environ 2 h d'autonomie, arrêt automatique 30 minutes, ABS et tissu effet velours",
    html: page(`
<p class="eyebrow">Caractéristiques</p>
<h1>Fiche <em>technique.</em></h1>
<div class="card" style="margin-top:44px;padding:30px 40px;display:grid;place-items:center">${beltDrawing()}</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px" class="fill">
  ${[['Chaleur', '50 · 55 · 60 °C'], ['Massage', 'Vibration, 4 modes'], ['Batterie', '1 800 mAh, USB'], ['Alimentation', '5 V / 1 A'], ['Autonomie', 'Environ 2 h*'], ['Arrêt auto.', 'Après 30 min'], ['Matières', 'ABS, effet velours'], ['Boîtier', '18,5 × 8 × 2,5 cm'], ['Poids', '142 g']]
    .map(([k, v]) => `<div class="card" style="padding:22px 28px;display:flex;flex-direction:column;justify-content:center;gap:6px;border-radius:26px"><span style="font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">${k}</span><span style="font-size:29px;font-weight:500;color:var(--ink)">${v}</span></div>`).join('')}
</div>
<p class="foot">Illustration du boîtier, à l'échelle. * Selon les réglages. Données du fabricant.</p>`, { product: BELT }) },

  { id: 'ceinture-06-coloris', product: 'belt', alt: 'Les deux coloris de la ceinture chauffante VELEA, rose et blanc ; le Duo se compose de deux roses, deux blanches ou une de chaque',
    html: page(`
<p class="eyebrow">Deux coloris</p>
<h1>Rose ou blanche, <em>la même douceur.</em></h1>
<div class="photo fill" style="margin:52px -110px 0;border-radius:0"><img src="${asset('belts-both.jpg')}" alt="" style="object-position:50% 55%"></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:40px">
  ${[['#e9aab3', 'Rose'], ['#f4f1ee', 'Blanc']].map(([c, n]) => `<div class="card" style="padding:30px 36px;display:flex;align-items:center;gap:22px"><span style="width:64px;height:64px;border-radius:50%;background:${c};box-shadow:inset 0 0 0 2px rgba(73,53,47,.12)"></span><span style="font-family:PF;font-size:44px;color:var(--ink)">${n}</span></div>`).join('')}
</div>
<p class="lead" style="margin-top:30px">En Duo : deux roses, deux blanches, ou une de chaque.</p>`, { product: BELT }) },

  { id: 'ceinture-07-bon-a-savoir', product: 'belt', alt: "Précautions d'utilisation de la ceinture chauffante VELEA : pas pendant le sommeil, ne fonctionne pas pendant la charge, surveiller sa peau, contre-indications (grossesse, maladie cardiaque, tumeur du col de l'utérus, crise de goutte, plaie ou anomalie de la peau), tenir éloignée des flammes ; accessoire de confort qui ne remplace pas un avis médical",
    html: page(`
<p class="eyebrow">Utilisation sereine</p>
<h1>Bon <em>à savoir.</em></h1>
<div class="card fill" style="margin-top:52px;padding:10px 56px;display:flex;flex-direction:column;justify-content:space-evenly">
  ${[['moon', "Ne l'utilisez pas pendant votre sommeil."], ['plug', 'Elle ne fonctionne pas pendant la charge, par sécurité.'], ['eye', 'Ne la laissez pas longtemps au même endroit : surveillez votre peau et retirez-la au moindre signe inhabituel.'], ['heart', "Contre-indiquée en cas de grossesse, de maladie cardiaque, de tumeur du col de l'utérus, de crise de goutte, ou de plaie ou anomalie de la peau."], ['flame', 'Tenez-la éloignée des flammes et des liquides corrosifs.']]
    .map(([i, t], n) => `<div style="display:flex;align-items:center;gap:30px;padding:26px 0;${n ? 'border-top:1.5px solid var(--line);' : ''}"><div class="ring">${icon(i)}</div><p style="font-size:28px;line-height:1.45;color:var(--ink)">${t}</p></div>`).join('')}
</div>
<div class="band" style="margin-top:28px"><div class="ring">${icon('info')}</div><p>Accessoire de confort, la ceinture ne remplace pas un avis médical. En cas de douleurs intenses, inhabituelles ou persistantes, consultez un professionnel de santé.</p></div>`, { product: BELT }) },

  /* ---------- Culotte ---------- */
  { id: 'culotte-01-tailles', product: 'culotte', alt: 'Guide des tailles de la culotte menstruelle VELEA, du S au 4XL : mesurer le tour de taille au plus fin, au-dessus du nombril, et le tour de hanches au plus large ; entre deux tailles, choisir la plus grande',
    html: page(`
<p class="eyebrow">Guide des tailles</p>
<h1>Trouver <em>votre taille.</em></h1>
<div class="card" style="margin-top:48px;padding:40px 60px">
  <svg viewBox="0 0 1160 420" style="width:100%;display:block">
    <g transform="translate(330 30) scale(1.25)">${briefsG('#2b2523')}</g>
    <g fill="none" stroke="#c9727e" stroke-width="3">
      <path d="M300 100 H860" stroke-dasharray="10 9"/><path d="M290 178 H870" stroke-dasharray="10 9"/>
    </g>
    <circle cx="300" cy="100" r="7" fill="#c9727e"/><circle cx="860" cy="100" r="7" fill="#c9727e"/>
    <circle cx="290" cy="178" r="7" fill="#c9727e"/><circle cx="870" cy="178" r="7" fill="#c9727e"/>
    <text x="270" y="94" text-anchor="end" font-family="PF" font-size="34" fill="#3a2a25">Tour de taille</text>
    <text x="270" y="124" text-anchor="end" font-family="DM" font-size="20" fill="#6e574c" letter-spacing="1">AU PLUS FIN</text>
    <text x="890" y="172" font-family="PF" font-size="34" fill="#3a2a25">Tour de hanches</text>
    <text x="890" y="202" font-family="DM" font-size="20" fill="#6e574c" letter-spacing="1">AU PLUS LARGE</text>
  </svg>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:28px" class="fill">
  ${[['ruler', 'Tour de taille', "À l'endroit le plus fin, au-dessus du nombril."], ['ruler', 'Tour de hanches', "À l'endroit le plus large."], ['check', 'Entre deux tailles', 'Choisissez la plus grande, pour plus de confort.']]
    .map(([i, t, d]) => `<div class="card" style="padding:34px;display:flex;flex-direction:column;gap:16px"><div class="ring">${icon(i)}</div><p style="font-family:PF;font-size:36px;color:var(--ink)">${t}</p><p style="font-size:24px;line-height:1.45;color:var(--muted)">${d}</p></div>`).join('')}
</div>
${sizeRow(28)}
<p class="foot">Illustration. Un doute ? Écrivez-nous : nous vous aidons à choisir votre taille.</p>`, { product: CULOTTE }) },

  { id: 'culotte-02-matiere', product: 'culotte', alt: 'Composition de la culotte menstruelle VELEA : 95 % viscose et 5 % élasthanne, entrejambe 100 % coton ; elle se porte comme une culotte classique et se réutilise après lavage',
    html: page(`
<p class="eyebrow">Matières</p>
<h1>Souple, <em>et réutilisable.</em></h1>
<div class="card" style="margin-top:48px;padding:40px 50px">
  <svg viewBox="0 0 1180 400" style="width:100%;display:block;overflow:visible">
    <g transform="translate(560 20) scale(1.15)">${briefsG('#2b2523')}</g>
    <g fill="none" stroke="#c9727e" stroke-width="2.5">
      <path d="M686 140 L600 118 H40"/><path d="M790 300 L880 352 H1140"/>
    </g>
    <circle cx="686" cy="140" r="9" fill="#fff" stroke="#c9727e" stroke-width="4"/><circle cx="790" cy="300" r="9" fill="#fff" stroke="#c9727e" stroke-width="4"/>
    <text x="40" y="58" font-family="DM" font-size="22" letter-spacing="3" fill="#a24c5d">LA CULOTTE</text>
    <text x="40" y="100" font-family="PF" font-size="38" fill="#3a2a25">95 % viscose, 5 % élasthanne</text>
    <text x="1140" y="292" text-anchor="end" font-family="DM" font-size="22" letter-spacing="3" fill="#a24c5d">L'ENTREJAMBE</text>
    <text x="1140" y="334" text-anchor="end" font-family="PF" font-size="38" fill="#3a2a25">100 % coton</text>
  </svg>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:28px" class="fill">
  ${[['feather', 'Souple', 'Viscose et élasthanne, pour une matière souple.'], ['heart', 'Comme une culotte', 'Elle se porte directement sur la peau.'], ['water', 'Réutilisable', 'Rincez, lavez, et elle repart pour un cycle.']]
    .map(([i, t, d]) => `<div class="card" style="padding:36px;display:flex;flex-direction:column;gap:16px;justify-content:center"><div class="ring">${icon(i)}</div><p style="font-family:PF;font-size:38px;color:var(--ink)">${t}</p><p style="font-size:25px;line-height:1.45;color:var(--muted)">${d}</p></div>`).join('')}
</div>
<p class="foot">Illustration. Composition indiquée par le fabricant.</p>`, { product: CULOTTE }) },

  { id: 'culotte-03-coloris', product: 'culotte', alt: 'Les trois coloris de la culotte menstruelle VELEA : noir, beige et rouge, du S au 4XL',
    html: page(`
<p class="eyebrow">Coloris</p>
<h1>Trois coloris, <em>du S au 4XL.</em></h1>
<div class="card fill" style="margin-top:52px;padding:30px;display:grid;place-items:center">
  <svg viewBox="0 0 1180 600" style="width:100%;max-height:100%">
    <g transform="translate(30 190) scale(1.2) rotate(-9 200 160)">${briefsG('#d9c3ad', { stitch: 'rgba(73,53,47,.25)' })}</g>
    <g transform="translate(670 190) scale(1.2) rotate(9 200 160)">${briefsG('#8e2f35', { stitch: 'rgba(255,255,255,.3)' })}</g>
    <g transform="translate(300 40) scale(1.45)">${briefsG('#2b2523')}</g>
  </svg>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:26px">
  ${[['#d9c3ad', 'Beige'], ['#2b2523', 'Noir'], ['#8e2f35', 'Rouge']].map(([c, n]) => `<div class="card" style="padding:26px 30px;display:flex;align-items:center;justify-content:center;gap:18px"><span style="width:48px;height:48px;border-radius:50%;background:${c};box-shadow:inset 0 0 0 2px rgba(73,53,47,.12)"></span><span style="font-family:PF;font-size:44px;color:var(--ink)">${n}</span></div>`).join('')}
</div>
${sizeRow(22)}
<p class="foot">Illustration : les teintes réelles peuvent légèrement varier selon l'écran.</p>`, { product: CULOTTE }) },

  { id: 'culotte-04-entretien', product: 'culotte', alt: "Entretien de la culotte menstruelle VELEA : rincer à l'eau froide jusqu'à ce que l'eau soit claire, laver selon l'étiquette, éviter l'adoucissant, sécher à l'air libre loin d'une source de chaleur directe",
    html: page(`
<p class="eyebrow">Entretien</p>
<h1>Pour qu'elle dure, <em>cycle après cycle.</em></h1>
${careGrid('Pour une première fois, portez-la sur une courte durée, à la maison, pour trouver votre rythme.')}`, { product: CULOTTE }) },

  /* ---------- Serviettes ---------- */
  { id: 'serviettes-01-lot', product: 'serviette', alt: 'Illustration du lot de 5 serviettes menstruelles lavables VELEA d\'environ 25 cm : partie centrale grise, ailettes noires à boutons-pression',
    html: page(`
<p class="eyebrow">Serviettes lavables</p>
<h1>Le lot de <em>cinq.</em></h1>
<div class="fill" style="display:grid;place-items:center;margin-top:10px">
  <svg viewBox="0 30 1000 500" style="width:100%;max-height:100%">
    ${[[-30, 0], [30, 0], [-15, 0], [15, 0], [0, 1]].map(([a, w]) => `<g transform="translate(500 900) rotate(${a}) translate(-150 -820)">${padG({ wings: !!w })}</g>`).join('')}
  </svg>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:10px">
  ${[['box', '5 serviettes'], ['ruler', 'Environ 25 cm'], ['snap', 'Ailettes à boutons-pression']].map(([i, t]) => `<div class="card" style="padding:30px;display:flex;align-items:center;gap:22px"><div class="ring">${icon(i)}</div><p style="font-size:28px;color:var(--ink)">${t}</p></div>`).join('')}
</div>
<p class="foot">Illustration. Longueur indiquée par le fabricant.</p>`, { product: SERV }) },

  { id: 'serviettes-02-pose', product: 'serviette', alt: "Comment poser la serviette lavable VELEA : la placer au fond de la culotte face grise vers soi, rabattre les ailettes sous la culotte et fermer les boutons-pression, puis la rincer à l'eau froide après utilisation",
    html: page(`
<p class="eyebrow">Mode d'emploi</p>
<h1>Elle se pose <em>en un instant.</em></h1>
<div style="display:grid;grid-template-rows:repeat(3,1fr);gap:22px;margin-top:52px" class="fill">
  ${[['Placez-la', 'Au fond de votre culotte, face grise vers vous.', 'place'], ['Fixez-la', 'Rabattez les ailettes sous la culotte et fermez les boutons-pression.', 'snap'], ['Rincez-la', "Après utilisation, à l'eau froide, avant le lavage.", 'rinse']]
    .map(([t, d, k], n) => `<div class="card" style="padding:16px 50px 16px 30px;display:grid;grid-template-columns:400px 90px 1fr;align-items:center;gap:20px">
      <div style="height:250px;display:grid;place-items:center">${stepArt(k)}</div>
      <span class="num" style="font-size:100px;line-height:.8;text-align:center">${n + 1}</span>
      <div><p style="font-family:PF;font-size:46px;color:var(--ink)">${t}</p>
      <p style="margin-top:10px;font-size:27px;line-height:1.5;color:var(--muted)">${d}</p></div></div>`).join('')}
</div>
<p class="foot">Illustrations.</p>`, { product: SERV }) },

  { id: 'serviettes-03-composition', product: 'serviette', alt: 'Composition de la serviette lavable VELEA : surface imperméable, couches en microfibre et couche en bambou charbon ; longueur environ 25 cm, partie centrale grise, ailettes noires à boutons-pression',
    html: page(`
<p class="eyebrow">Composition</p>
<h1>Trois matières, <em>une seule serviette.</em></h1>
<div class="card fill" style="margin-top:48px;padding:20px 30px;display:grid;place-items:center">
  <svg viewBox="0 0 1200 470" style="width:100%;max-height:100%">
    <g transform="translate(600 196) rotate(90) scale(1.5) translate(-150 -166)">${padG()}</g>
    <path d="M378 420 H822" stroke="#c9727e" stroke-width="2.5" marker-start="url(#arr)" marker-end="url(#arr)"/>
    <text x="600" y="462" text-anchor="middle" font-family="DM" font-size="28" font-weight="500" fill="#a24c5d">≈ 25 cm</text>
    <g fill="none" stroke="#c9727e" stroke-width="2.5"><path d="M470 196 L330 120 H40"/><path d="M600 340 L660 362 H1160"/></g>
    <circle cx="470" cy="196" r="9" fill="#fff" stroke="#c9727e" stroke-width="4"/><circle cx="600" cy="340" r="9" fill="#fff" stroke="#c9727e" stroke-width="4"/>
    <text x="40" y="64" font-family="DM" font-size="22" letter-spacing="3" fill="#a24c5d">CONTRE LE CORPS</text>
    <text x="40" y="104" font-family="PF" font-size="36" fill="#3a2a25">Partie centrale grise</text>
    <text x="1160" y="304" text-anchor="end" font-family="DM" font-size="22" letter-spacing="3" fill="#a24c5d">AUTOUR DE LA CULOTTE</text>
    <text x="1160" y="344" text-anchor="end" font-family="PF" font-size="36" fill="#3a2a25">Ailettes à boutons-pression</text>
  </svg>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:26px">
  ${[['drop', 'Surface', 'imperméable'], ['layers', 'Couches', 'en microfibre'], ['sparkle', 'Couche', 'en bambou charbon']]
    .map(([i, t, d]) => `<div class="card" style="padding:34px;display:flex;flex-direction:column;gap:16px"><div class="ring">${icon(i)}</div><p style="font-family:PF;font-size:40px;line-height:1.15;color:var(--ink)">${t}<br><em style="color:var(--rose)">${d}</em></p></div>`).join('')}
</div>
<p class="foot">Illustration. Composition et longueur indiquées par le fabricant.</p>`, { product: SERV }) },

  { id: 'serviettes-04-entretien', product: 'serviette', alt: "Entretien des serviettes lavables VELEA : rincer à l'eau froide jusqu'à ce que l'eau soit claire, laver selon l'étiquette, éviter l'adoucissant, sécher à l'air libre loin d'une source de chaleur directe",
    html: page(`
<p class="eyebrow">Entretien</p>
<h1>Lavables, <em>et réutilisables.</em></h1>
${careGrid('Pour une première fois, portez-en une sur une courte durée, à la maison, pour trouver votre rythme.')}`, { product: SERV }) },

  { id: 'serviettes-05-en-bref', product: 'serviette', alt: "Les serviettes lavables VELEA en bref : lot de 5 serviettes d'environ 25 cm, ailettes à boutons-pression, lavables et réutilisables, pour remplacer à votre rythme une partie de vos protections jetables",
    html: page(`
<p class="eyebrow">En bref</p>
<h1>Cinq serviettes, <em>à votre rythme.</em></h1>
<div style="display:grid;grid-template-columns:0.9fr 1.1fr;gap:36px;margin-top:52px" class="fill">
  <div class="card" style="display:grid;place-items:center;padding:30px">
    <svg viewBox="0 0 300 340" style="width:100%;max-height:100%">${padG()}</svg>
  </div>
  <div style="display:grid;grid-template-rows:repeat(4,1fr);gap:20px">
    ${[['box', '5 serviettes lavables', 'Dans le colis.'], ['ruler', 'Environ 25 cm', 'Longueur indiquée par le fabricant.'], ['snap', 'Boutons-pression', 'Les ailettes se referment autour de la culotte.'], ['water', 'Réutilisables', 'Rincez, lavez, et elles repartent pour un cycle.']]
      .map(([i, t, d]) => `<div class="card" style="padding:26px 32px;display:flex;align-items:center;gap:26px"><div class="ring">${icon(i)}</div><div><p style="font-family:PF;font-size:38px;color:var(--ink)">${t}</p><p style="margin-top:6px;font-size:24px;line-height:1.4;color:var(--muted)">${d}</p></div></div>`).join('')}
  </div>
</div>
<div class="band" style="margin-top:28px"><div class="ring">${icon('heart')}</div><p>Pour remplacer, à votre rythme, une partie de vos protections jetables.</p></div>
<p class="foot" style="padding-top:18px">Illustration.</p>`, { product: SERV }) },
];

function careGrid(tip) {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:56px" class="fill">
  ${[['water', "Rincez à l'eau froide", "Après utilisation, jusqu'à ce que l'eau soit claire."], ['wash', "Lavez selon l'étiquette", "En suivant les indications de l'article."], ['nosoftener', 'Sans adoucissant', "Il peut réduire l'absorption du tissu."], ['air', "Séchez à l'air libre", "Loin d'une source de chaleur directe."]]
    .map(([i, t, d], n) => `<div class="card" style="padding:44px 46px;display:flex;flex-direction:column;gap:20px;justify-content:center">
      <div style="display:flex;align-items:center;justify-content:space-between"><div class="ring">${icon(i)}</div><span class="num" style="font-size:96px;line-height:.8">${n + 1}</span></div>
      <p style="font-family:PF;font-size:44px;color:var(--ink)">${t}</p>
      <p style="font-size:26px;line-height:1.5;color:var(--muted)">${d}</p></div>`).join('')}
</div>
<div class="band" style="margin-top:28px"><div class="ring">${icon('heart')}</div><p>${tip}</p></div>`;
}

function stepArt(kind) {
  if (kind === 'place') return `<svg viewBox="0 0 400 320" style="height:240px">${briefsG('#ecdadd', { stitch: 'rgba(73,53,47,.18)' })}
    <g transform="translate(200 196) scale(.5) translate(-150 -166)">${padG({ shadow: 'softsm' })}</g></svg>`;
  if (kind === 'snap') return `<svg viewBox="0 0 330 340" style="height:240px">${padG()}
    <path d="M28 196 C10 222 30 262 74 262" fill="none" stroke="#c9727e" stroke-width="5" stroke-linecap="round" marker-end="url(#arr)"/>
    <path d="M302 196 C320 222 300 262 256 262" fill="none" stroke="#c9727e" stroke-width="5" stroke-linecap="round" marker-end="url(#arr)"/></svg>`;
  return `<svg viewBox="0 0 330 340" style="height:240px">
    <g fill="none" stroke="#c9727e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M30 50 H200 A34 34 0 0 1 234 84 V108"/><path d="M100 50 V24 M72 24 H128"/>
    </g>
    ${[[234, 142, 1], [226, 178, .8], [240, 210, .6]].map(([x, y, o]) => `<path d="M${x} ${y - 13} C${x + 7} ${y - 3} ${x + 9} ${y + 3} ${x + 9} ${y + 6} A9 9 0 0 1 ${x - 9} ${y + 6} C${x - 9} ${y + 3} ${x - 7} ${y - 3} ${x} ${y - 13} Z" fill="#c9727e" fill-opacity="${o}"/>`).join('')}
    <g transform="translate(200 288) rotate(90) scale(.52) translate(-150 -166)">${padG({ wings: false, shadow: 'softsm' })}</g>
  </svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1500 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const manifest = [];
  for (const v of visuals) {
    if (ONLY && !ONLY.some((o) => v.id.startsWith(o))) continue;
    const file = path.join(OUT, `${v.id}.html`);
    fs.writeFileSync(file, v.html);
    await p.goto('file://' + file, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    // Anything that ends below the bottom margin, or text wider than its box, is reported
    const issues = await p.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('.frame *')) {
        const r = el.getBoundingClientRect();
        if (r.width && r.bottom > 1500 - 60) out.push('bottom:' + el.tagName + '.' + el.className);
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && el.tagName !== 'svg') out.push('x:' + el.className);
      }
      return [...new Set(out)].slice(0, 5);
    });
    await p.screenshot({ path: path.join(OUT, `velea-${v.id}.jpg`), type: 'jpeg', quality: 92 });
    manifest.push({ id: v.id, product: v.product, alt: v.alt, file: `velea-${v.id}.jpg` });
    console.log(v.id, issues.length ? 'ISSUES ' + issues.join(' ') : 'ok');
  }
  if (!ONLY) fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  await b.close();
})();
