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
// coque droite (vue de face) : forme anguleuse comme sur les photos
const POD = roundedPoly([[0.045, 0.47], [1.58, 0.5], [1.7, 0.22], [1.63, -0.2], [1.3, -0.52], [0.75, -0.63], [0.22, -0.47], [0.05, -0.18]],
  [0.05, 0.12, 0.12, 0.2, 0.25, 0.3, 0.2, 0.1], 14);
// fenêtre : trapèze (haut large, pointe basse côté nez)
const WIN = roundedPoly([[0.36, 0.22], [1.38, 0.22], [1.12, -0.2], [0.47, -0.3], [0.35, -0.12]], [0.035, 0.04, 0.05, 0.04, 0.04], 8);
const BEZ = offset(WIN, 0.11);
const DEPTH = 0.42;
// bombé de la façade : les bords reculent, le centre avance (appliqué seulement à l'avant de la coque)
function warpZ(x, y, z) {
  const f = clamp((z + DEPTH + 0.02) / (DEPTH * 0.75), 0, 1);
  const low = clamp((-y - 0.05) / 0.58, 0, 1);
  return z - f * (0.04 * Math.pow((x - 0.9) / 0.82, 2) + 0.13 * low * low);
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
  const P = [['i', 0, 0]], D = DEPTH;
  for (let k = 1; k <= 12; k++) P.push([k / 13, 0]);
  P.push(['o', -0.07, 0], ['o', -0.045, -0.006], ['o', -0.02, -0.022], ['o', -0.005, -0.045], ['o', 0, -0.07]);
  for (let k = 1; k <= 6; k++) P.push(['o', 0, lerp(-0.07, -D + 0.03, k / 6)]);
  P.push(['o', -0.012, -D + 0.006], ['o', -0.035, -D]);
  [0.85, 0.65, 0.45, 0.25, 0.08, 0].forEach((f) => P.push(['r', f, -D]));
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
    const r = pr[0] === 'o' ? ro + pr[1] : pr[0] === 'i' ? ri + pr[1] : pr[0] === 'r' ? ro * pr[1] : lerp(ri + mi, ro - mo, pr[0]);
    const z = typeof pr[0] === 'string' ? pr[2] : pr[1];
    pos[i++] = PC.x + d.x * r; pos[i++] = PC.y + d.y * r; pos[i++] = z;
  }
  const idx = [];
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const k = b * (nu + 1) + a, k2 = k + nu + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
function podShell() { return loft(BEZ, POD, shellProfile(), 240, 0, 0.07); }

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
  const add = (g, m, nu) => { const o = new THREE.Mesh(g, m); o.userData.seamNu = nu; pod.add(o); return o; };
  // coque pleine : façade plate, arête biseautée nette, côté droit, dos fermé (aucun vide)
  add(podShell(), M.white, 240);
  // biseau clair qui descend vers la fenêtre
  add(loft(WIN, BEZ, [['i', 0, -0.075], [0.25, -0.056], [0.5, -0.0375], [0.75, -0.019], ['o', 0, 0]], 240), M.bezel, 240);
  // cerclage argent
  add(loft(offset(WIN, -0.022), WIN, [['i', 0, -0.092], ['i', 0.005, -0.08], [0.5, -0.077], ['o', -0.004, -0.079], ['o', 0, -0.09]], 240, 0.005, 0.004), M.chrome, 240);
  // verre
  const gl = []; for (let k = 0; k <= 10; k++) gl.push([k / 10, -0.086]);
  add(loft([PC, PC, PC], offset(WIN, -0.012), gl, 120), M.glass, 120).renderOrder = 2;
  // chambre intérieure peu profonde : parois + panneau gris clair (c'est lui qui s'éclaire en rouge)
  add(loft(WIN, WIN, [['i', 0, -0.085], ['i', 0, -0.15]], 240), M.inner, 240);
  const pn = []; for (let k = 0; k <= 10; k++) pn.push([k / 10, -0.15]);
  add(loft([PC, PC, PC], offset(WIN, 0.004), pn, 120), M.inner, 120);
  const gp = []; for (let k = 0; k <= 10; k++) gp.push([k / 10, -0.14]);
  add(loft([PC, PC, PC], offset(WIN, 0.002), gp, 120), M.glowPanel, 120);
  // LED sur le panneau (discrètes éteintes, rouges allumées)
  const N = 20, per = [];
  for (let k = 0; k < N; k++) {
    const th = (k / N) * Math.PI * 2, d = new V2(Math.cos(th), Math.sin(th)), r = rayHit(WIN, PC, d) - 0.075;
    per.push(new V3(PC.x + d.x * r, PC.y + d.y * r, -0.146));
  }
  const ledGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.008, 18); ledGeo.rotateX(Math.PI / 2);
  per.forEach((p) => { const m = new THREE.Mesh(ledGeo, M.led); m.position.copy(p); m.userData.shared = true; pod.add(m); });
  const pg = new THREE.BufferGeometry().setFromPoints(per.map((p) => p.clone().setZ(-0.13)));
  pod.add(new THREE.Points(pg, M.ledGlow));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff0000, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  halo.position.set(0.87, -0.02, -0.11); halo.scale.set(1.1, 0.62, 1); pod.add(halo);
  pod.userData.halo = halo;
  warpPod(pod);
  // charnière de branche : petit bloc en haut, à l'arrière du bord extérieur
  const hy = 0.31, hx = podOuterX(hy);
  const hinge = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.24, 0.24, 4, 0.03), M.white);
  hinge.position.set(hx - 0.03, hy, -DEPTH + 0.1); pod.add(hinge);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.24, 0.006), M.seam);
  seam.position.set(hx - 0.03, hy, -DEPTH + 0.16); pod.add(seam);
  [-0.055, 0.055].forEach((dy) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 14), M.seam); c.rotation.z = Math.PI / 2; c.position.set(hx + 0.031, hy + dy, -DEPTH + 0.06); pod.add(c); });
  return pod;
}

// branche : section rectangulaire arrondie balayée le long d'une courbe
function buildArm(M) {
  const path = new THREE.CatmullRomCurve3([
    new V3(1.6, 0.31, -0.46), new V3(1.66, 0.3, -1.05), new V3(1.67, 0.25, -1.65), new V3(1.62, 0.12, -2.1),
    new V3(1.56, -0.06, -2.36), new V3(1.53, -0.2, -2.4),
  ], false, 'centripetal');
  const nu = 40, nv = 260, up = new V3(0, 1, 0);
  const pos = [], idx = [];
  let side = new V3(1, 0, 0);
  for (let b = 0; b <= nv; b++) {
    const v = b / nv, c = path.getPointAt(v), T = path.getTangentAt(v);
    const s = new V3().crossVectors(T, up); if (s.length() > 0.15) side = s.normalize();
    const u2 = new V3().crossVectors(side, T).normalize();
    // hauteur / épaisseur : large près de la charnière, gorge (articulation), puis fine
    let h = v < 0.3 ? 0.21 : lerp(0.19, 0.15, clamp((v - 0.3) / 0.5, 0, 1));
    if (v > 0.27 && v < 0.3) h = lerp(0.21, 0.19, (v - 0.27) / 0.03);
    let w = v < 0.3 ? 0.06 : 0.05;
    const groove = Math.exp(-Math.pow((v - 0.3) / 0.004, 2)) * 0.01; h -= groove * 2; w -= groove;
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
  right.rotation.y = TILT; right.position.x = 0.02;
  const left = buildPod(M, glowTex);
  left.scale.x = -1; left.rotation.y = -TILT; left.position.x = -0.02;
  group.add(right, left);

  // bouton ⏻/Mode + témoin bleu : SOUS la coque droite (invisible de face)
  const bx = 0.98, by = podBottomY(bx);
  const ind = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.036, 0.055, 3, 0.017), M.indicator);
  ind.position.set(bx, by + 0.006, -0.3); right.add(ind);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: textTexture('⏻ / Mode'), transparent: true, depthWrite: false }));
  lab.rotation.x = Math.PI / 2; lab.position.set(bx, by - 0.003, -0.17); right.add(lab);

  // port USB-C : côté extérieur de la coque gauche
  const py = -0.12, px = podOuterX(py) - 0.004;
  const port = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.06, 0.16, 3, 0.012), M.port);
  port.position.set(px, py, -0.26); left.add(port);
  const portIn = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.022, 0.11), M.portIn);
  portIn.position.set(px + 0.002, py, -0.26); left.add(portIn);

  // pont central (petite charnière entre les coques)
  const bridge = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.2, 0.3, 4, 0.03), M.white);
  bridge.position.set(0, 0.38, -0.2); group.add(bridge);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 20), M.seam);
  pin.position.set(0, 0.38, -0.05); group.add(pin);
  

  // branches
  const armR = buildArm(M); group.add(armR);
  const armL = armR.clone(); armL.scale.x = -1; group.add(armL);

  group.userData.halos = [right.userData.halo, left.userData.halo];
  group.position.set(0, 0.0, 1.2); // centre visuel (les branches partent loin vers l'arrière)
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
    bezel: new THREE.MeshPhysicalMaterial({ color: 0xf3f1f0, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.15, side: THREE.DoubleSide }),
    inner: new THREE.MeshPhysicalMaterial({ color: 0xc4c9cd, roughness: 0.16, metalness: 0.4, clearcoat: 0.8, envMapIntensity: 1.4, side: THREE.DoubleSide }),
    glowPanel: new THREE.MeshBasicMaterial({ color: 0xff1a12, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
    seam: new THREE.MeshStandardMaterial({ color: 0xc9c4c2, roughness: 0.6 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xe9ecef, metalness: 1, roughness: 0.14, envMapIntensity: 1.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xeef2f3, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false, emissive: 0xff0a0a, emissiveIntensity: 0, toneMapped: false }),
    led: new THREE.MeshStandardMaterial({ color: 0xff5a5a, roughness: 0.35, emissive: 0xff1e1e, emissiveIntensity: 0, transparent: true, opacity: 0 }),
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
  redL[0].position.set(0.85, -0.05, 0.35); redL[1].position.set(-0.85, -0.05, 0.35);
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

  const DIST = opts.dist || 9.6;
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
    M.led.emissiveIntensity = 3.2 * cur; M.led.opacity = cur;
    M.ledGlow.opacity = 0.95 * cur;
    M.glass.emissiveIntensity = 0.25 * cur; M.glass.opacity = lerp(0.14, 0.2, cur); M.glowPanel.opacity = 0.92 * cur;
    M.inner.emissive.setRGB(0.5 * cur, 0.02 * cur, 0.02 * cur);
    M.indicator.emissiveIntensity = lerp(0.05, 2.6, cur);
    group.userData.halos.forEach((h) => { h.material.opacity = 0.55 * cur; });
    back.material.opacity = 0;
    redL.forEach((l) => { l.intensity = 0.9 * cur; });
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);

  root.classList.add('is-3d');
  return { setOn, turnBy, tiltBy, view, orbitTo, renderer, M, scene };
}
