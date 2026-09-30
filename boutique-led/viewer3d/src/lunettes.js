// VELEA – visionneuse 3D des lunettes LED regard (vrai 360°, éteintes / allumées).
// Modèle procédural d'après les photos du fabricant : deux coques blanches brillantes reliées au centre,
// fenêtres transparentes cerclées d'argent, branches articulées. Bouton Mode + témoin bleu SOUS la coque droite,
// port USB-C sur le côté gauche.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const V2 = THREE.Vector2, V3 = THREE.Vector3;

// ---------- outils 2D ----------
function smoothClosed(pts, n) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], p[1], 0)), true, 'centripetal');
  return c.getSpacedPoints(n).slice(0, n).map((p) => new V2(p.x, p.y));
}
// polygone à coins arrondis (coins donnés dans l'ordre, rayon par coin)
function roundedPoly(corners, radii, seg = 10) {
  const out = [], n = corners.length;
  for (let i = 0; i < n; i++) {
    const p = new V2(...corners[i]), a = new V2(...corners[(i + n - 1) % n]), b = new V2(...corners[(i + 1) % n]);
    const da = a.clone().sub(p), db = b.clone().sub(p);
    const r = Math.min(radii[i], da.length() * 0.45, db.length() * 0.45);
    const p0 = p.clone().add(da.normalize().multiplyScalar(r)), p1 = p.clone().add(db.normalize().multiplyScalar(r));
    for (let k = 0; k <= seg; k++) {
      const t = k / seg, u = 1 - t;
      out.push(new V2(u * u * p0.x + 2 * u * t * p.x + t * t * p1.x, u * u * p0.y + 2 * u * t * p.y + t * t * p1.y));
    }
  }
  return out;
}
function area(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; } return s / 2; }
// décalage d'un contour fermé (d > 0 : vers l'extérieur)
function offset(pts, d) {
  const n = pts.length, s = area(pts) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const t = b.clone().sub(a).normalize();
    out.push(new V2(pts[i].x + s * t.y * d, pts[i].y - s * t.x * d));
  }
  return out;
}
function shapeOf(pts, holes = []) {
  const s = new THREE.Shape(pts);
  holes.forEach((h) => s.holes.push(new THREE.Path(h)));
  return s;
}
function extrude(shape, depth, bt, bs, seg = 5, curve = 1) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bt > 0, bevelThickness: bt, bevelSize: bs, bevelSegments: seg, curveSegments: curve, steps: 1 });
  g.translate(0, 0, -(depth + bt)); // face avant à z = 0
  return g;
}

// ---------- formes (coque droite, x > 0 ; la gauche est son miroir) ----------
const POD = smoothClosed([
  [0.07, 0.50], [0.42, 0.56], [0.95, 0.57], [1.38, 0.545], [1.60, 0.445], [1.69, 0.22], [1.68, -0.06],
  [1.58, -0.34], [1.36, -0.55], [1.02, -0.66], [0.64, -0.66], [0.32, -0.58], [0.13, -0.38], [0.065, -0.08], [0.058, 0.24],
], 220);
const WIN = roundedPoly([[0.38, 0.25], [1.36, 0.25], [1.10, -0.26], [0.43, -0.28]], [0.07, 0.08, 0.09, 0.07], 12);
const BEZ = offset(WIN, 0.1);
const DEPTH = 0.6;
// bombé de la façade : les bords reculent, le centre avance (appliqué seulement à l'avant de la coque)
function warpZ(x, y, z) {
  const f = clamp((z + 0.42) / 0.3, 0, 1);
  return z - f * (0.13 * Math.pow((x - 0.9) / 0.82, 2) + 0.08 * Math.pow((y + 0.03) / 0.6, 2));
}
function weldSeam(g, nu) {
  const n = g.attributes.normal, rows = n.count / (nu + 1);
  for (let b = 0; b < rows; b++) {
    const k0 = b * (nu + 1), k1 = k0 + nu;
    const x = n.getX(k0) + n.getX(k1), y = n.getY(k0) + n.getY(k1), z = n.getZ(k0) + n.getZ(k1), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(k0, x / l, y / l, z / l); n.setXYZ(k1, x / l, y / l, z / l);
  }
}
function warpPod(pod) {
  pod.traverse((o) => {
    if (!o.isMesh && !o.isPoints) return;
    if (o.userData.shared) { o.position.z = warpZ(o.position.x, o.position.y, o.position.z); return; }
    const a = o.geometry.attributes.position, pz = o.position.z;
    for (let i = 0; i < a.count; i++) a.setZ(i, warpZ(a.getX(i), a.getY(i), a.getZ(i) + pz) - pz);
    a.needsUpdate = true; o.geometry.computeVertexNormals();
    if (o.userData.seamNu) weldSeam(o.geometry, o.userData.seamNu);
  });
}


// intersection rayon (depuis c, direction d) / contour fermé → distance la plus grande
function rayHit(poly, c, d) {
  let best = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y, den = d.x * ey - d.y * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a.x - c.x) * ey - (a.y - c.y) * ex) / den, u = ((a.x - c.x) * d.y - (a.y - c.y) * d.x) / den;
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.max(best, t);
  }
  return best;
}
const PC = new V2(0.9, -0.03);
// profil de la coque, le long de chaque rayon : [part, z] ; part = position entre trou (0) et bord (1),
// ou [ 'o', décalage absolu depuis le bord, z ] / [ 'h', décalage depuis le trou, z ]
function shellProfile() {
  const P = [], R = 0.11, D = DEPTH, T = 0.085;
  P.push(['h', 0.0, -0.075], ['h', 0.004, -0.035], ['h', 0.02, -0.008], ['h', 0.045, 0.0]);
  for (let k = 1; k <= 10; k++) P.push([k / 11, 0.0]);
  for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI / 2; P.push(['o', -R + Math.sin(a) * R, -R + Math.cos(a) * R]); }
  for (let k = 1; k <= 8; k++) P.push(['o', 0, lerp(-R, -D + 0.07, k / 8)]);
  for (let k = 1; k <= 6; k++) { const a = (k / 6) * Math.PI; P.push(['o', -T / 2 + Math.cos(a) * T / 2, -D + 0.07 - Math.sin(a) * 0.07]); }
  for (let k = 1; k <= 5; k++) P.push(['o', -T, lerp(-D + 0.07, -0.16, k / 5)]);
  return P;
}
// surface lissée entre deux contours (le long de rayons partant du centre), profil = [mode, valeur, z]
// mode 'i' : décalage depuis le contour intérieur ; 'o' : depuis l'extérieur ; nombre : fraction entre les deux (après marges mi / mo)
function loft(inner, outer, prof, nu = 240, mi = 0, mo = 0) {
  const nv = prof.length - 1, pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const RO = [], RI = [];
  for (let a = 0; a <= nu; a++) { const th = (a / nu) * Math.PI * 2, d = new V2(Math.cos(th), Math.sin(th)); RO.push(rayHit(outer, PC, d)); RI.push(rayHit(inner, PC, d)); }
  // rayons ratés (passage exact par un sommet) : on reprend la moyenne des voisins
  [RO, RI].forEach((R) => { for (let a = 0; a <= nu; a++) { const p = R[(a + nu - 1) % nu], n = R[(a + 1) % nu]; if (R[a] < 0.97 * Math.min(p, n) || R[a] > 1.03 * Math.max(p, n)) R[a] = (p + n) / 2; } });
  let i = 0;
  for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) {
    const th = (a / nu) * Math.PI * 2, d = new V2(Math.cos(th), Math.sin(th));
    const ro = RO[a], ri = RI[a], pr = prof[b];
    const r = pr[0] === 'o' ? ro + pr[1] : pr[0] === 'i' ? ri + pr[1] : lerp(ri + mi, ro - mo, pr[0]);
    const z = pr[0] === 'o' || pr[0] === 'i' ? pr[2] : pr[1];
    pos[i++] = PC.x + d.x * r; pos[i++] = PC.y + d.y * r; pos[i++] = z;
  }
  const idx = [];
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const k = b * (nu + 1) + a, k2 = k + nu + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
function podShell(hole) {
  const P = shellProfile().map((p) => (p[0] === 'h' ? ['i', p[1], p[2]] : p));
  return loft(hole, POD, P, 240, 0.045, 0.11);
}

function podBottomY(x) { // y le plus bas du contour à l'abscisse x
  let m = 0;
  for (let i = 0; i < POD.length; i++) { const a = POD[i], b = POD[(i + 1) % POD.length]; if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) { const y = lerp(a.y, b.y, (x - a.x) / (b.x - a.x)); m = Math.min(m, y); } }
  return m;
}
function podOuterX(y) {
  let m = 0;
  for (let i = 0; i < POD.length; i++) { const a = POD[i], b = POD[(i + 1) % POD.length]; if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) { const x = lerp(a.x, b.x, (y - a.y) / (b.y - a.y)); m = Math.max(m, x); } }
  return m;
}

function textTexture(txt) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#6f6b6a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '500 64px "Helvetica Neue", Arial, sans-serif';
  g.fillText(txt, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// coque (sans les détails propres à un côté)
function buildPod(M, glowTex) {
  const pod = new THREE.Group();
  // coque lisse d'un seul tenant : façade bombée, bord arrondi, paroi, rebord arrière (ouvert côté visage)
  const shell = new THREE.Mesh(podShell(offset(BEZ, 0.012)), M.whiteDS); shell.userData.seamNu = 240; pod.add(shell);
  // cadre gris clair en retrait autour de la fenêtre
  const fr = []; for (let k = 1; k <= 9; k++) fr.push([k / 10, -0.035]);
  const bez = new THREE.Mesh(loft(WIN, BEZ, [['i', 0, -0.07], ['i', 0.008, -0.05], ['i', 0.02, -0.037]].concat(fr, [['o', -0.018, -0.037], ['o', -0.004, -0.045], ['o', 0.004, -0.07], ['o', 0.02, -0.11]]), 240, 0.02, 0.018), M.bezel);
  bez.userData.seamNu = 240; pod.add(bez);
  // cerclage argent + verre transparent
  const rim = new THREE.Mesh(loft(offset(WIN, -0.024), offset(WIN, 0.004), [['i', 0, -0.082], ['i', 0.006, -0.066], [0.5, -0.06], ['o', -0.006, -0.064], ['o', 0, -0.075]], 240, 0.006, 0.006), M.chrome);
  rim.userData.seamNu = 240; pod.add(rim);
  const gl = []; for (let k = 0; k <= 10; k++) gl.push([k / 10, -0.072]);
  const glass = new THREE.Mesh(loft([PC, PC, PC], offset(WIN, -0.01), gl, 120), M.glass);
  glass.userData.seamNu = 120; glass.renderOrder = 2; pod.add(glass);
  // anneau de LED (face intérieure, tournées vers l'œil)
  const N = 26, per = [];
  for (let k = 0; k < N; k++) {
    const th = (k / N) * Math.PI * 2, d = new V2(Math.cos(th), Math.sin(th)), r = rayHit(WIN, PC, d) + 0.075;
    per.push(new V3(PC.x + d.x * r, PC.y + d.y * r, -0.14));
  }
  const ledGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 20); ledGeo.rotateX(Math.PI / 2);
  per.forEach((p) => { const m = new THREE.Mesh(ledGeo, M.led); m.position.copy(p); m.userData.shared = true; pod.add(m); });
  const pg = new THREE.BufferGeometry().setFromPoints(per.map((p) => p.clone().setZ(-0.15)));
  pod.add(new THREE.Points(pg, M.ledGlow));
  // petit plateau intérieur (support des LED) entre cadre et paroi
  const inner = new THREE.Mesh(extrude(shapeOf(offset(POD, -0.07), [offset(WIN, 0.012)]), 0.02, 0, 0), M.inner);
  inner.position.z = -0.1; pod.add(inner);
  // lueur intérieure (visible à travers la fenêtre quand c'est allumé)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff0000, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  halo.position.set(0.86, -0.02, -0.28); halo.scale.set(1.25, 0.8, 1); pod.add(halo);
  pod.userData.halo = halo;
  warpPod(pod);
  // charnière de branche (bloc à l'arrière du bord extérieur)
  const hy = 0.2, hx = podOuterX(hy);
  const hinge = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.5, 0.42, 4, 0.06), M.white);
  hinge.position.set(hx - 0.05, hy, -DEPTH + 0.16); pod.add(hinge);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.5, 0.008), M.seam);
  seam.position.set(hx - 0.05, hy, -DEPTH + 0.26); pod.add(seam);
  [-0.12, 0.12].forEach((dy) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16), M.chrome); s.rotation.z = Math.PI / 2; s.position.set(hx + 0.056, hy + dy, -DEPTH + 0.1); pod.add(s); });
  return pod;
}

// branche : section rectangulaire arrondie balayée le long d'une courbe
function buildArm(M) {
  const path = new THREE.CatmullRomCurve3([
    new V3(1.58, 0.20, -0.62), new V3(1.66, 0.21, -1.3), new V3(1.70, 0.20, -2.0), new V3(1.66, 0.15, -2.6),
    new V3(1.58, 0.04, -3.0), new V3(1.51, -0.12, -3.2), new V3(1.47, -0.28, -3.19),
  ], false, 'centripetal');
  const nu = 40, nv = 260, up = new V3(0, 1, 0);
  const pos = [], idx = [];
  let side = new V3(1, 0, 0);
  for (let b = 0; b <= nv; b++) {
    const v = b / nv, c = path.getPointAt(v), T = path.getTangentAt(v);
    const s = new V3().crossVectors(T, up); if (s.length() > 0.15) side = s.normalize();
    const u2 = new V3().crossVectors(side, T).normalize();
    // hauteur / épaisseur : large près de la charnière, gorge (articulation), puis fine
    let h = v < 0.24 ? 0.44 : lerp(0.3, 0.2, clamp((v - 0.24) / 0.5, 0, 1));
    if (v > 0.2 && v < 0.24) h = lerp(0.44, 0.3, (v - 0.2) / 0.04);
    let w = v < 0.24 ? 0.13 : 0.1;
    const groove = Math.exp(-Math.pow((v - 0.245) / 0.004, 2)) * 0.012; h -= groove * 2; w -= groove;
    const tip = v > 0.97 ? Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.97) / 0.03, 2))) : 1;
    const st = v < 0.02 ? 1 : 1;
    for (let a = 0; a <= nu; a++) {
      const th = (a / nu) * Math.PI * 2, ct = Math.cos(th), sn = Math.sin(th);
      const x = Math.sign(ct) * Math.pow(Math.abs(ct), 0.45) * w / 2 * tip * st;
      const y = Math.sign(sn) * Math.pow(Math.abs(sn), 0.45) * h / 2 * Math.max(tip, 0.001);
      pos.push(c.x + side.x * x + u2.x * y, c.y + side.y * x + u2.y * y, c.z + side.z * x + u2.z * y);
    }
  }
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const k = b * (nu + 1) + a, k2 = k + nu + 1; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, M.whiteDS);
}

function buildLunettes(M) {
  const group = new THREE.Group(), glowTex = glowTexture();
  const TILT = 9 * DEG;
  const right = buildPod(M, glowTex);
  right.rotation.y = TILT; right.position.x = 0.05;
  const left = buildPod(M, glowTex);
  left.scale.x = -1; left.rotation.y = -TILT; left.position.x = -0.05;
  group.add(right, left);

  // bouton ⏻/Mode + témoin bleu : SOUS la coque droite (invisible de face)
  const bx = 0.98, by = podBottomY(bx) - 0.045;
  const ind = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.036, 0.055, 3, 0.017), M.indicator);
  ind.position.set(bx, by + 0.002, -0.42); right.add(ind);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: textTexture('⏻ / Mode'), transparent: true, depthWrite: false }));
  lab.rotation.x = Math.PI / 2; lab.position.set(bx, by - 0.0025, -0.28); right.add(lab);

  // port USB-C : côté extérieur de la coque gauche
  const py = -0.2, px = podOuterX(py) + 0.03;
  const port = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.08, 0.25, 3, 0.014), M.port);
  port.position.set(px, py, -0.42); left.add(port);
  const portIn = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.03, 0.17), M.portIn);
  portIn.position.set(px + 0.002, py, -0.42); left.add(portIn);

  // pont central (petite charnière entre les coques)
  const bridge = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.24, 0.4, 4, 0.05), M.white);
  bridge.position.set(0, 0.4, -0.34); group.add(bridge);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.16, 24), M.bezel);
  pin.position.set(0, 0.42, -0.15); group.add(pin);
  

  // branches
  const armR = buildArm(M); group.add(armR);
  const armL = armR.clone(); armL.scale.x = -1; group.add(armL);

  group.userData.halos = [right.userData.halo, left.userData.halo];
  group.position.set(0, 0.02, 1.6); // centre visuel (les branches partent loin vers l'arrière)
  return group;
}

function backgroundTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), r = g.createRadialGradient(256, 210, 10, 256, 256, 380);
  r.addColorStop(0, '#B8737F'); r.addColorStop(0.5, '#93505D'); r.addColorStop(1, '#5E2A35');
  g.fillStyle = r; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function initLunettes(root, opts) {
  opts = opts || {};
  const host = root.querySelector('.vh-360__gl');
  const stage = root.querySelector('.vh-360__stage');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.still }); }
  catch (e) { root.classList.add('no-gl'); return; }
  renderer.setPixelRatio(opts.pr || Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = backgroundTexture();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const M = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xf7f5f4, roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
    whiteDS: new THREE.MeshPhysicalMaterial({ color: 0xf7f5f4, roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.1, side: THREE.DoubleSide }),
    bezel: new THREE.MeshPhysicalMaterial({ color: 0xebe8e7, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.15, side: THREE.DoubleSide }),
    inner: new THREE.MeshPhysicalMaterial({ color: 0xe9e6e5, roughness: 0.5, side: THREE.DoubleSide }),
    seam: new THREE.MeshStandardMaterial({ color: 0xc9c4c2, roughness: 0.6 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xe9ecef, metalness: 1, roughness: 0.14, envMapIntensity: 1.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xeef2f3, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false, emissive: 0xff0a0a, emissiveIntensity: 0, toneMapped: false }),
    led: new THREE.MeshStandardMaterial({ color: 0x9b9392, roughness: 0.35, emissive: 0xff1e1e, emissiveIntensity: 0 }),
    ledGlow: new THREE.PointsMaterial({ size: 0.16, map: glowTexture(), color: 0xff3a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    button: new THREE.MeshPhysicalMaterial({ color: 0xf1efee, roughness: 0.3, clearcoat: 0.6 }),
    indicator: new THREE.MeshStandardMaterial({ color: 0x5a6a8a, roughness: 0.3, emissive: 0x2f6bff, emissiveIntensity: 0.05 }),
    port: new THREE.MeshStandardMaterial({ color: 0x4a4747, roughness: 0.5 }),
    portIn: new THREE.MeshStandardMaterial({ color: 0x151414, roughness: 0.7 }),
  };
  const group = buildLunettes(M);
  scene.add(group);

  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffdde2, 0.8); rim.position.set(-4, 2, -4); scene.add(rim);
  const under = new THREE.DirectionalLight(0xffffff, 0.35); under.position.set(0, -4, 2); scene.add(under);
  const redL = [new THREE.PointLight(0xff2a2a, 0, 3, 1.6), new THREE.PointLight(0xff2a2a, 0, 3, 1.6)];
  redL[0].position.set(0.85, 0.0, -0.35); redL[1].position.set(-0.85, 0.0, -0.35);
  redL.forEach((l) => group.add(l));
  const back = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff3a3a, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  back.position.set(0, 0.0, -0.9); back.scale.set(5.2, 2.6, 1); group.add(back);

  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.0, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false; controls.rotateSpeed = 0.75;
  controls.minPolarAngle = 10 * DEG; controls.maxPolarAngle = 170 * DEG;
  controls.autoRotate = !opts.still; controls.autoRotateSpeed = 1.5;
  renderer.domElement.style.touchAction = 'pan-y';
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) controls.rotateSpeed = 1.05;
  let idleT = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; root.classList.add('is-touched'); clearTimeout(idleT); camAnim = null; });
  controls.addEventListener('end', () => { clearTimeout(idleT); if (!opts.still) idleT = setTimeout(() => { controls.autoRotate = true; }, 7000); });

  const DIST = opts.dist || 10.4;
  function place(az, pol) {
    const r = DIST * Math.max(1, (opts.fit || 1) / camera.aspect);
    camera.position.set(r * Math.sin(pol) * Math.sin(az), r * Math.cos(pol), r * Math.sin(pol) * Math.cos(az)).add(controls.target);
  }
  function resize() {
    const w = host.clientWidth || 400, h = host.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const off = camera.position.clone().sub(controls.target);
    if (off.lengthSq() < 1e-6) place((opts.az ?? 32) * DEG, (opts.pol ?? 74) * DEG);
    else { const s = new THREE.Spherical().setFromVector3(off); place(s.theta, s.phi); }
  }
  resize();
  new ResizeObserver(resize).observe(host);

  // animations de caméra (azimut / hauteur)
  let camAnim = null;
  function orbitTo(azDeg, polDeg, ms = 900) {
    const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    let a1 = azDeg * DEG; while (a1 - s.theta > Math.PI) a1 -= 2 * Math.PI; while (a1 - s.theta < -Math.PI) a1 += 2 * Math.PI;
    camAnim = { a0: s.theta, a1, p0: s.phi, p1: clamp(polDeg * DEG, controls.minPolarAngle, controls.maxPolarAngle), t0: performance.now(), ms };
    controls.autoRotate = false; clearTimeout(idleT); root.classList.add('is-touched');
    if (!opts.still) idleT = setTimeout(() => { controls.autoRotate = true; }, 9000);
  }
  function current() { const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)); return [s.theta / DEG, s.phi / DEG]; }
  function turnBy(d) { const c = current(); orbitTo(c[0] + d, c[1], 650); }
  function tiltBy(d) { const c = current(); orbitTo(c[0], c[1] + d, 650); }
  const VIEWS = { face: [0, 80], troisquart: [34, 72], cote: [-90, 84], dessus: [0, 16], dessous: [18, 158], arriere: [180, 66] };
  function view(name) { const v = VIEWS[name]; if (v) orbitTo(v[0], v[1], 1000); }

  // allumé / éteint
  let target = 0, cur = 0;
  function setOn(on) { target = on ? 1 : 0; }

  let visible = true;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (camAnim) {
      const p = clamp((now - camAnim.t0) / camAnim.ms, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      place(lerp(camAnim.a0, camAnim.a1, e), lerp(camAnim.p0, camAnim.p1, e));
      if (p >= 1) camAnim = null;
    }
    cur += (target - cur) * 0.1;
    M.led.emissiveIntensity = 3.2 * cur; M.led.color.setRGB(lerp(0.6, 1, cur), lerp(0.57, 0.3, cur), lerp(0.57, 0.3, cur));
    M.ledGlow.opacity = 0.95 * cur;
    M.glass.emissiveIntensity = 1.05 * cur; M.glass.opacity = lerp(0.2, 0.78, cur); M.glass.color.setRGB(lerp(0.93, 1, cur), lerp(0.95, 0.22, cur), lerp(0.95, 0.2, cur));
    M.inner.emissive.setRGB(0.9 * cur, 0.08 * cur, 0.08 * cur);
    M.indicator.emissiveIntensity = lerp(0.05, 2.6, cur);
    group.userData.halos.forEach((h) => { h.material.opacity = 0.55 * cur; });
    back.material.opacity = 0.08 * cur;
    redL.forEach((l) => { l.intensity = 3.2 * cur; });
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);

  root.classList.add('is-3d');
  return { setOn, turnBy, tiltBy, view, orbitTo, renderer, M, scene };
}
