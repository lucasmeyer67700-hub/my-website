// VELEA – visionneuse 3D du masque LED (vrai 360°, LED de couleur).
// Modèle entièrement procédural (aucune image) : rendu net à toutes les tailles, sans bord détouré.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { initStylo } from './stylo.js';
import { initLunettes } from './lunettes.js';

const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Forme de la tête (coque du masque), paramétrée par l'angle θ et la hauteur y ---------- */
const Y_TOP = 0.98, Y_CHIN = -1.08;
function radii(y) {
  if (y >= 0) {
    const k = Math.pow(Math.max(0, 1 - (y / Y_TOP) ** 2), 0.5 * 0.9);
    return [0.84 * k, 0.90 * k];
  }
  let rx = 0.84 - 0.27 * smooth(-0.10, -1.0, y);
  let rz = 0.90 - 0.10 * smooth(-0.30, -1.0, y);
  if (y < -0.90) { const f = Math.sqrt(Math.max(0, 1 - ((y + 0.90) / 0.22) ** 2)); rx *= lerp(0.72, 1, f); rz *= lerp(0.82, 1, f); }
  return [rx, rz];
}
function se(v, e) { return Math.sign(v) * Math.pow(Math.abs(v), e); }
function headBase(th, y) {
  const [rx, rz] = radii(y);
  return [rx * se(Math.sin(th), 0.86), y, rz * se(Math.cos(th), 0.86)];
}
// reliefs du visage (nez, arcades, bouche, menton) ajoutés vers l'avant
function relief(x, y, ct) {
  const front = Math.pow(Math.max(0, ct), 3);
  if (front <= 0) return 0;
  let p;
  if (y > -0.20) p = 0.03 + 0.08 * smooth(0.26, -0.20, y); else p = 0.11 * (1 - smooth(-0.20, -0.34, y));
  if (y > 0.28) p *= 1 - smooth(0.28, 0.38, y);
  const w = 0.10 + 0.05 * smooth(0.1, -0.25, y);
  let d = p * Math.exp(-((x / w) ** 2));
  d += 0.03 * Math.exp(-(((y - 0.40) / 0.10) ** 2)) * Math.exp(-((x / 0.6) ** 2));
  d -= 0.022 * Math.exp(-(((Math.abs(x) - 0.33) / 0.2) ** 2) - ((y - 0.20) / 0.12) ** 2);
  d += 0.04 * Math.exp(-(((y + 0.56) / 0.2) ** 2) - (x / 0.34) ** 2);
  d += 0.045 * Math.exp(-(((y + 0.92) / 0.13) ** 2) - (x / 0.28) ** 2);
  return d * front;
}
function head(th, y) {
  const p = headBase(th, y);
  p[2] += relief(p[0], y, Math.cos(th));
  return p;
}
function normalOf(f, a, b, ea = 1e-3, eb = 1e-3) {
  const p1 = f(a + ea, b), p0 = f(a - ea, b), q1 = f(a, b + eb), q0 = f(a, b - eb);
  const u = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const v = new THREE.Vector3(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]);
  return u.cross(v).normalize();
}
const headNormal = (th, y) => normalOf(head, th, y);

/* ---------- Formes 2D (vue de face) : yeux, contour rose doré, nez, narine ---------- */
function sdRoundRect(px, py, hx, hy, r) {
  const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
function smin(a, b, k) { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); }
const sdEye = (x, y) => sdRoundRect(Math.abs(x) - 0.335, y - 0.20, 0.185, 0.072, 0.068);
const sdFrame = (x, y) => {
  const eyes = sdRoundRect(Math.abs(x) - 0.335, y - 0.205, 0.25, 0.126, 0.115);
  const bridge = sdRoundRect(x, y - 0.21, 0.14, 0.075, 0.03);
  const nose = sdRoundRect(x, y + 0.065, 0.102, 0.265, 0.09);
  return smin(smin(eyes, bridge, 0.04), nose, 0.05);
};
const sdNoseCover = (x, y) => sdRoundRect(x, y - 0.035, 0.058, 0.205, 0.052);
const sdNostril = (x, y) => (Math.hypot(x / 0.042, (y + 0.255) / 0.026) - 1) * 0.03;

/* ---------- Géométrie de grille générique ---------- */
function gridGeometry(nu, nv, fn) {
  // fn(u,v) -> {p:[x,y,z], a:alpha, n?:Vector3}
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const col = new Float32Array((nu + 1) * (nv + 1) * 4);
  let i = 0, j = 0;
  for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) {
    const r = fn(a / nu, b / nv);
    pos[i++] = r.p[0]; pos[i++] = r.p[1]; pos[i++] = r.p[2];
    col[j++] = 1; col[j++] = 1; col[j++] = 1; col[j++] = r.a;
  }
  const idx = [];
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) {
    const k = b * (nu + 1) + a, k2 = k + nu + 1;
    idx.push(k, k + 1, k2, k + 1, k2 + 1, k2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------- Construction du masque ---------- */
function buildMask(M) {
  const group = new THREE.Group();

  // 1) Coque visage (dense à l'avant)
  const thMax = (y) => (100 + 12 * smooth(-1.2, 0.2, y) + 38 * smooth(0.3, 1.05, y)) * DEG;
  const yOf = (v) => {
    const v0 = 0.44;
    if (v < v0) return lerp(Y_CHIN, 0, v / v0);
    const al = ((v - v0) / (1 - v0)) * 88.5 * DEG;
    return Y_TOP * Math.sin(al);
  };
  const shellFn = (u, v) => {
    const y = yOf(v), s = u * 2 - 1;
    const th = thMax(y) * Math.sign(s) * Math.pow(Math.abs(s), 1.45);
    const p = head(th, y);
    let a = 1;
    if (Math.cos(th) > 0.3) {
      const x = headBase(th, y)[0];
      a = Math.min(smooth(-0.004, 0.004, sdEye(x, y) - 0.006), smooth(-0.003, 0.003, sdNostril(x, y)));
    }
    return { p, a };
  };
  const shellGeo = gridGeometry(300, 300, shellFn);
  const outer = new THREE.Mesh(shellGeo, M.white);
  const inner = new THREE.Mesh(shellGeo, M.inner);
  group.add(outer, inner);

  // 2) Contour rose doré en relief (yeux + nez) et cache-nez blanc
  const TH0 = 46 * DEG, YA = -0.40, YB = 0.39;
  const reliefMesh = (height, alpha, mat, nu, nv) => {
    const fn = (u, v) => {
      const th = lerp(-TH0, TH0, u), y = lerp(YA, YB, v);
      const x = headBase(th, y)[0];
      const h = height(x, y), n = headNormal(th, y), p = head(th, y);
      return { p: [p[0] + n.x * h, p[1] + n.y * h, p[2] + n.z * h], a: alpha(x, y) };
    };
    return new THREE.Mesh(gridGeometry(nu, nv, fn), mat);
  };
  const bevel = (d, w) => Math.sin(clamp(d / w, 0, 1) * Math.PI / 2);
  const frameD = (x, y) => Math.min(-sdFrame(x, y), sdEye(x, y), sdNostril(x, y));
  group.add(reliefMesh(
    (x, y) => 0.006 + 0.045 * bevel(frameD(x, y), 0.03),
    (x, y) => smooth(-0.0015, 0.0015, frameD(x, y)), M.rose, 340, 260));
  group.add(reliefMesh(
    (x, y) => 0.040 + 0.03 * bevel(-sdNoseCover(x, y), 0.035),
    (x, y) => smooth(-0.0015, 0.0015, -sdNoseCover(x, y)), M.white, 140, 220));

  // 3) Grille de la bouche (petits trous)
  const thForX = (x, y) => { let lo = -1.2, hi = 1.2; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (headBase(m, y)[0] < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  const dotGeo = new THREE.CircleGeometry(0.0105, 20);
  const rows = [[-0.515, 7], [-0.558, 8], [-0.601, 7]];
  rows.forEach(([y, n]) => {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.043;
      const th = thForX(x, y), p = head(th, y), nn = headNormal(th, y);
      const d = new THREE.Mesh(dotGeo, M.hole);
      d.position.set(p[0] + nn.x * 0.0015, p[1] + nn.y * 0.0015, p[2] + nn.z * 0.0015);
      d.lookAt(d.position.clone().add(nn));
      group.add(d);
    }
  });

  // 4) Bouton marche/arrêt sur le front
  {
    const y = 0.72, th = 0, p = head(th, y), nn = headNormal(th, y);
    const btn = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.062, 0.012, 48), M.plain);
    base.rotation.x = Math.PI / 2; btn.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.030, 0.0042, 12, 48, Math.PI * 1.62), M.icon);
    ring.rotation.z = Math.PI / 2 + Math.PI * 0.19; ring.position.z = 0.0065; btn.add(ring);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.030, 0.004), M.icon);
    bar.position.set(0, 0.018, 0.0068); btn.add(bar);
    btn.position.set(p[0] + nn.x * 0.004, p[1] + nn.y * 0.004, p[2] + nn.z * 0.004);
    btn.lookAt(btn.position.clone().add(nn));
    group.add(btn);
  }

  // 5) Pièce du cou (col évasé)
  const neckFn = (u, v) => {
    const th = lerp(116, -116, u) * DEG, ct = Math.cos(th);
    const ytop = -0.86 + 0.05 * (1 - ct);
    const ybot = -1.95 + 0.16 * (1 - ct);
    const y = lerp(ytop, ybot, v);
    const t = v;
    const rx = 0.47 + 0.16 * t * t, rz = 0.47 + 0.26 * Math.pow(t, 2.2);
    const zoff = -0.06 + 0.04 * t;
    return { p: [rx * se(Math.sin(th), 0.9), y, rz * se(ct, 0.9) + zoff], a: 1 };
  };
  const neckGeo = gridGeometry(160, 90, neckFn);
  group.add(new THREE.Mesh(neckGeo, M.white), new THREE.Mesh(neckGeo, M.inner));

  // 6) Sangle noire réglable (velours) + fermeture velcro à l'arrière + attaches
  {
    const yS = 0.22, H = 0.14, T = 0.012;
    const [rx, rz] = radii(yS);
    // bande avec une vraie épaisseur (4 faces + bouts), coordonnées de texture le long de la sangle
    const band = (a0, a1, f, h, n, uScale) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const th = lerp(a0, a1, i / n);
        const x = rx * f * se(Math.sin(th), 0.86), z = rz * f * se(Math.cos(th), 0.86);
        const nr = new THREE.Vector3(x / (rx * rx), 0, z / (rz * rz)).normalize();
        pts.push({ c: new THREE.Vector3(x, yS, z), nr });
      }
      let len = 0; const arc = [0];
      for (let i = 1; i < pts.length; i++) { len += pts[i].c.distanceTo(pts[i - 1].c); arc.push(len); }
      const pos = [], uv = [], idx = [];
      const P = (i, sn, su) => pts[i].c.clone().addScaledVector(pts[i].nr, sn * T / 2).add(new THREE.Vector3(0, su * h / 2, 0));
      const faces = [[[1, 1], [1, -1]], [[1, -1], [-1, -1]], [[-1, -1], [-1, 1]], [[-1, 1], [1, 1]]];
      faces.forEach(([A, B]) => {
        const base = pos.length / 3;
        for (let i = 0; i <= n; i++) {
          const a = P(i, A[0], A[1]), b = P(i, B[0], B[1]);
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z); uv.push(arc[i] * uScale, 0, arc[i] * uScale, 1);
          if (i < n) { const k = base + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
        }
      });
      [0, n].forEach((i, e) => {
        const base = pos.length / 3, q = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => P(i, a, b));
        q.forEach((v) => { pos.push(v.x, v.y, v.z); uv.push(0, 0); });
        if (e === 0) idx.push(base, base + 2, base + 1, base, base + 3, base + 2); else idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    group.add(new THREE.Mesh(band(100 * DEG, 260 * DEG, 1.035, H, 220, 3.2), M.strap));
    // rabat velcro qui se referme par-dessus, à l'arrière
    const tab = new THREE.Mesh(band(156 * DEG, 212 * DEG, 1.035 + T * 1.2 / rx, H * 1.0, 90, 3.2), M.hook);
    group.add(tab);
    [-1, 1].forEach((s) => {
      const th = s * 101 * DEG, p = head(th, yS), nn = headNormal(th, yS);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.19, 0.11, 2, 2, 2), M.plain);
      b.position.set(p[0] + nn.x * 0.03, p[1], p[2] + nn.z * 0.03);
      b.lookAt(b.position.clone().add(nn)); group.add(b);
    });
  }

  // 7) LED à l'intérieur (visage + cou)
  const leds = [];
  for (let y = -0.98; y <= 0.84; y += 0.07) {
    for (let thd = -96; thd <= 96; thd += 6.8) {
      const th = thd * DEG, x = headBase(th, y)[0];
      if (Math.cos(th) > 0.3 && (sdEye(x, y) < 0.035 || sdNostril(x, y) < 0.02)) continue;
      if (y > 0.66 && Math.abs(thd) > 70) continue;
      const p = head(th, y), nn = headNormal(th, y);
      leds.push([p[0] - nn.x * 0.04, p[1] - nn.y * 0.04, p[2] - nn.z * 0.04]);
    }
  }
  for (let v = 0.12; v <= 0.9; v += 0.14) for (let ud = -100; ud <= 100; ud += 11) {
    const r = neckFn((116 - ud) / 232, v).p, th = ud * DEG;
    leds.push([r[0] * 0.91, r[1], r[2] * 0.91 - 0.01 * Math.cos(th)]);
  }
  const ledMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0125, 10, 8), M.led, leds.length);
  const m4 = new THREE.Matrix4();
  leds.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); ledMesh.setMatrixAt(i, m4); });
  group.add(ledMesh);
  // halo lumineux de chaque LED (visible seulement quand elles sont allumées)
  const gp = new Float32Array(leds.length * 3); leds.forEach((p, i) => gp.set(p, i * 3));
  const gGeo = new THREE.BufferGeometry(); gGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  group.add(new THREE.Points(gGeo, M.ledGlow));

  return { group, ledCount: leds.length };
}

/* ---------- Scène ---------- */
function backgroundTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(256, 210, 10, 256, 256, 380);
  r.addColorStop(0, '#B8737F'); r.addColorStop(0.5, '#93505D'); r.addColorStop(1, '#5E2A35');
  g.fillStyle = r; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
// textures de la sangle : velours noir (fibres) et face « crochets » du velcro
function fabricTexture(bump) {
  const W = 512, Hh = 128, c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d'); g.fillStyle = bump ? '#808080' : '#ffffff'; g.fillRect(0, 0, W, Hh);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * W, y = rnd() * Hh, l = 2 + rnd() * 6, v = bump ? 90 + rnd() * 90 : 200 + rnd() * 55;
    g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x, y, l, 1);
  }
  g.fillStyle = bump ? 'rgba(40,40,40,.9)' : 'rgba(150,150,150,.8)';
  g.fillRect(0, 3, W, 2); g.fillRect(0, Hh - 5, W, 2);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; return t;
}
function hookTexture() {
  const W = 512, Hh = 128, c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d'); g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, W, Hh);
  for (let y = 10; y < Hh - 8; y += 7) for (let x = (y % 14 ? 3 : 0); x < W; x += 6) {
    g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#3a3a3a'; g.fillRect(0, 2, W, 4); g.fillRect(0, Hh - 6, W, 4);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(30,6,12,0.55)'); r.addColorStop(0.55, 'rgba(30,6,12,0.18)'); r.addColorStop(1, 'rgba(30,6,12,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function init(root, opts) {
  opts = opts || {};
  const host = root.querySelector('.vh-360__gl');
  const stage = root.querySelector('.vh-360__stage');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { root.classList.add('no-gl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = backgroundTexture();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const M = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xf6f4f3, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, vertexColors: true, alphaTest: 0.5, side: THREE.FrontSide }),
    inner: new THREE.MeshStandardMaterial({ color: 0xe6e1df, roughness: 0.75, vertexColors: true, alphaTest: 0.5, side: THREE.BackSide, emissive: 0x000000 }),
    rose: new THREE.MeshPhysicalMaterial({ color: 0xd8a09c, metalness: 1, roughness: 0.16, vertexColors: true, alphaTest: 0.5, clearcoat: 0.4 }),
    plain: new THREE.MeshPhysicalMaterial({ color: 0xf6f4f3, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    hole: new THREE.MeshStandardMaterial({ color: 0xc9c3c1, roughness: 0.6 }),
    icon: new THREE.MeshStandardMaterial({ color: 0xb9b3b1, roughness: 0.5 }),
    strap: new THREE.MeshPhysicalMaterial({ color: 0x2a2729, map: fabricTexture(false), bumpMap: fabricTexture(true), bumpScale: 1.2, roughness: 0.95, sheen: 1, sheenColor: 0x6d6568, sheenRoughness: 0.55 }),
    hook: new THREE.MeshPhysicalMaterial({ color: 0x5a5556, map: hookTexture(), bumpMap: hookTexture(), bumpScale: 2.2, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    led: new THREE.MeshBasicMaterial({ color: 0xd9d4d2 }),
    ledGlow: new THREE.PointsMaterial({ size: 0.09, map: glowTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true }),
  };
  const { group } = buildMask(M);
  group.position.y = 0.48;
  scene.add(group);

  const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(0, -1.48, -0.02); scene.add(sh);

  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9de, 0.8); rim.position.set(-3, 1.5, -3); scene.add(rim);
  const glowFace = new THREE.PointLight(0xffffff, 0, 2.4, 1.6); glowFace.position.set(0, 0.5, 0.25); scene.add(glowFace);
  const glowNeck = new THREE.PointLight(0xffffff, 0, 1.6, 1.6); glowNeck.position.set(0, -0.95, 0.05); scene.add(glowNeck);

  // halo coloré derrière le masque + lumière de contre-jour (quand les LED sont allumées)
  const hc = document.createElement('canvas'); hc.width = hc.height = 256;
  { const g = hc.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256); }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  halo.scale.set(4.4, 5.0, 1); halo.position.set(0, 0.05, -1.1); scene.add(halo);
  const backL = new THREE.DirectionalLight(0xffffff, 0); backL.position.set(0, 0.6, -4); scene.add(backL);

  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
  camera.position.set(0, 0.25, 7.6);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.05, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = 62 * DEG; controls.maxPolarAngle = 104 * DEG;
  // Téléphone : rotation seulement à gauche / à droite (le glissé vertical fait défiler la page), un peu plus rapide
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) { const pa = Math.acos(clamp((camera.position.y - controls.target.y) / camera.position.distanceTo(controls.target), -1, 1)); controls.minPolarAngle = controls.maxPolarAngle = pa; controls.rotateSpeed = 1.05; }
  controls.autoRotate = !opts.still; controls.autoRotateSpeed = 1.6;
  renderer.domElement.style.touchAction = 'pan-y';
  let idleT = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; root.classList.add('is-touched'); clearTimeout(idleT); });
  controls.addEventListener('end', () => { clearTimeout(idleT); idleT = setTimeout(() => { controls.autoRotate = true; }, 7000); });


  function resize() {
    const w = host.clientWidth || 400, h = host.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength((opts.dist || 7.6) * Math.max(1, (opts.fit || 1) / camera.aspect));
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  // LED : allumer / éteindre
  const off = new THREE.Color(0xd9d4d2);
  let target = { k: 0, col: new THREE.Color(0xffffff) }, cur = 0;
  function setLed(hex) {
    if (!hex) { target.k = 0; return; }
    target.col.set(hex); target.k = 1;
  }
  // animation de caméra vers un angle donné (autour de l'axe vertical)
  let camAnim = null;
  function turnTo(deg, ms = 1100) {
    const off = camera.position.clone().sub(controls.target);
    const r = Math.hypot(off.x, off.z), a0 = Math.atan2(off.x, off.z);
    let a1 = deg * DEG; while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
    camAnim = { a0, a1, r, y: off.y, t0: performance.now(), ms };
    controls.autoRotate = false; clearTimeout(idleT); idleT = setTimeout(() => { controls.autoRotate = true; }, 9000);
  }

  function turnBy(deg, ms = 700) {
    const off = camera.position.clone().sub(controls.target);
    const a0 = Math.atan2(off.x, off.z) / DEG;
    turnTo(a0 + deg, ms); root.classList.add('is-touched');
  }

  let visible = true, raf = 0;
  const tmp = new THREE.Color(), white = new THREE.Color(1, 1, 1), innerOff = new THREE.Color(0xe6e1df);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    if (camAnim) {
      const p = clamp((now - camAnim.t0) / camAnim.ms, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const a = lerp(camAnim.a0, camAnim.a1, e);
      camera.position.set(controls.target.x + camAnim.r * Math.sin(a), controls.target.y + camAnim.y, controls.target.z + camAnim.r * Math.cos(a));
      if (p >= 1) camAnim = null;
    }
    cur += (target.k - cur) * 0.12;
    tmp.copy(off).lerp(target.col.clone().lerp(white, 0.45).multiplyScalar(1.8), cur);
    M.led.color.copy(tmp);
    M.inner.color.copy(innerOff).lerp(target.col.clone().multiplyScalar(0.25), cur);
    M.inner.emissive.copy(target.col).multiplyScalar(0.85 * cur);
    M.inner.envMapIntensity = 1 - 0.85 * cur;
    M.hole.emissive.copy(target.col).multiplyScalar(0.9 * cur);
    halo.material.color.copy(target.col); halo.material.opacity = 0.6 * cur;
    backL.color.copy(target.col); backL.intensity = 2.4 * cur;
    glowFace.color.copy(target.col); glowFace.intensity = 1.6 * cur;
    glowNeck.color.copy(target.col); glowNeck.intensity = 0.8 * cur;
    M.ledGlow.color.copy(target.col); M.ledGlow.opacity = 1.0 * cur;
    controls.update();
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);

  root.classList.add('is-3d');
  return { setLed, turnTo, turnBy };
}

window.VeleaMask3D = init;
window.VeleaStylo3D = initStylo;
window.VeleaLunettes3D = initLunettes;
