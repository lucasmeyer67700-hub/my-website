// VELEA – visionneuse 3D du stylo visage haute fréquence (vrai 360°).
// Modèle procédural d'après les photos du fabricant : manche blanc à alvéoles, bague chromée, électrode en verre rosé.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;

// profil du manche (hauteur y → rayon), interpolé en douceur
const PROFILE = [
  [-1.625, 0.0], [-1.62, 0.07], [-1.61, 0.125], [-1.585, 0.165], [-1.55, 0.188], [-1.50, 0.198], [-1.44, 0.199],
  [-1.405, 0.192], [-1.385, 0.186], [-1.36, 0.194], [-1.32, 0.207], [-1.25, 0.214], [-0.70, 0.219], [-0.16, 0.215],
  [-0.10, 0.212], [-0.085, 0.203], [-0.07, 0.203], [-0.055, 0.212], [0.02, 0.212], [0.16, 0.196], [0.30, 0.166],
  [0.42, 0.132], [0.51, 0.106], [0.555, 0.094], [0.57, 0.07], [0.575, 0.0],
];
function profile(y) {
  const P = PROFILE;
  if (y <= P[0][0]) return 0;
  for (let i = 0; i < P.length - 1; i++) {
    if (y <= P[i + 1][0]) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const t = (y - p1[0]) / (p2[0] - p1[0]);
      // Catmull-Rom sur les rayons (pas uniforme mais doux)
      const t2 = t * t, t3 = t2 * t;
      const r = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      return Math.max(0, r);
    }
  }
  return 0;
}
// alvéoles de la poignée (creux arrondis en quinconce)
const DIMPLES = [];
[-1.12, -0.86, -0.60, -0.34].forEach((yc, row) => {
  for (let k = 0; k < 6; k++) DIMPLES.push([yc, (k * 60 + (row % 2) * 30) * DEG]);
});
function dimple(th, y, R) {
  let d = 0;
  for (const [yc, tc] of DIMPLES) {
    let dt = th - tc; dt = Math.atan2(Math.sin(dt), Math.cos(dt));
    const dx = dt * R, dy = (y - yc) * 0.95;
    const q = (dx * dx + dy * dy) / (0.128 * 0.128);
    if (q < 1) { const s = 1 - q; d = Math.max(d, 0.034 * s * s * (3 - 2 * s)); }
  }
  return d;
}

function surface(nu, nv, fn) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  let i = 0, j = 0;
  for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) {
    const p = fn(a / nu, b / nv); pos[i++] = p[0]; pos[i++] = p[1]; pos[i++] = p[2]; uv[j++] = a / nu; uv[j++] = b / nv;
  }
  const idx = [];
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const k = b * (nu + 1) + a, k2 = k + nu + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // soudure de la couture (θ = 0 / 2π) pour des normales continues
  const n = g.attributes.normal;
  for (let b = 0; b <= nv; b++) {
    const k0 = b * (nu + 1), k1 = k0 + nu;
    const x = (n.getX(k0) + n.getX(k1)) / 2, y = (n.getY(k0) + n.getY(k1)) / 2, z = (n.getZ(k0) + n.getZ(k1)) / 2;
    const l = Math.hypot(x, y, z) || 1; n.setXYZ(k0, x / l, y / l, z / l); n.setXYZ(k1, x / l, y / l, z / l);
  }
  return g;
}

function buildStylo(M) {
  const group = new THREE.Group();
  const Y0 = PROFILE[0][0], Y1 = PROFILE[PROFILE.length - 1][0];

  // 1) Manche blanc (base évasée, poignée à alvéoles, cou conique)
  const body = surface(160, 520, (u, v) => {
    const th = u * Math.PI * 2, y = lerp(Y0, Y1, v);
    let r = profile(y);
    if (y > -1.26 && y < -0.2) r -= dimple(th, y, r);
    return [r * Math.sin(th), y, r * Math.cos(th)];
  });
  group.add(new THREE.Mesh(body, M.white));

  // 2) Bague chromée
  const ring = new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0.548), new THREE.Vector2(0.080, 0.548), new THREE.Vector2(0.086, 0.556), new THREE.Vector2(0.087, 0.64),
    new THREE.Vector2(0.083, 0.652), new THREE.Vector2(0.052, 0.656), new THREE.Vector2(0.0, 0.656),
  ], 96);
  group.add(new THREE.Mesh(ring, M.chrome));

  // 3) Électrode en verre : tube courbé + disque (champignon)
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.60, 0), new THREE.Vector3(0, 0.82, 0), new THREE.Vector3(0, 1.0, 0),
    new THREE.Vector3(0.035, 1.12, 0), new THREE.Vector3(0.115, 1.225, 0), new THREE.Vector3(0.205, 1.285, 0),
  ], false, 'centripetal');
  group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 160, 0.036, 40, false), M.glass));
  const end = path.getPoint(1), tan = path.getTangent(1).normalize();
  const disc = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.034, -0.05), new THREE.Vector2(0.040, -0.02), new THREE.Vector2(0.060, 0.005), new THREE.Vector2(0.110, 0.022),
    new THREE.Vector2(0.155, 0.034), new THREE.Vector2(0.178, 0.046), new THREE.Vector2(0.182, 0.058), new THREE.Vector2(0.172, 0.068),
    new THREE.Vector2(0.130, 0.066), new THREE.Vector2(0.070, 0.060), new THREE.Vector2(0.0, 0.057),
  ], 96), M.glass);
  disc.position.copy(end);
  disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  group.add(disc);

  // 4) Cordon : ressort anti-pliure + câble
  for (let i = 0; i < 8; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.058 - i * 0.002, 0.017, 18, 56), M.cable);
    t.rotation.x = Math.PI / 2; t.position.y = -1.645 - i * 0.04; group.add(t);
  }
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 32), M.cable);
  cable.position.y = -2.35; group.add(cable);

  return group;
}

function backgroundTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), r = g.createRadialGradient(256, 210, 10, 256, 256, 380);
  r.addColorStop(0, '#B8737F'); r.addColorStop(0.5, '#93505D'); r.addColorStop(1, '#5E2A35');
  g.fillStyle = r; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function initStylo(root, opts) {
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
    white: new THREE.MeshPhysicalMaterial({ color: 0xf6f4f3, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xf2eef2, metalness: 1, roughness: 0.06, envMapIntensity: 1.6 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xf7cfe2, transmission: 0.55, thickness: 0.2, ior: 1.46, roughness: 0.07,
      clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, sheen: 0.4, sheenColor: 0xffe6f2, emissive: 0x6a2a4a, emissiveIntensity: 0.25 }),
    cable: new THREE.MeshPhysicalMaterial({ color: 0xf1efee, roughness: 0.35, clearcoat: 0.3 }),
  };
  const group = buildStylo(M);
  group.position.y = 0.2;
  scene.add(group);

  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9de, 0.9); rim.position.set(-3, 1.5, -3); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
  camera.position.set(0, 0.2, 7.4);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.02, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false; controls.rotateSpeed = 0.7;
  controls.minPolarAngle = 55 * DEG; controls.maxPolarAngle = 110 * DEG;
  controls.autoRotate = !opts.still; controls.autoRotateSpeed = 1.8;
  renderer.domElement.style.touchAction = 'pan-y';
  let idleT = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; root.classList.add('is-touched'); clearTimeout(idleT); });
  controls.addEventListener('end', () => { clearTimeout(idleT); idleT = setTimeout(() => { controls.autoRotate = true; }, 7000); });

  function resize() {
    const w = host.clientWidth || 400, h = host.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength((opts.dist || 7.4) * Math.max(1, (opts.fit || 1) / camera.aspect));
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  let camAnim = null;
  function turnTo(deg, ms = 1100) {
    const off = camera.position.clone().sub(controls.target);
    const r = Math.hypot(off.x, off.z), a0 = Math.atan2(off.x, off.z);
    let a1 = deg * DEG; while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
    camAnim = { a0, a1, r, y: off.y, t0: performance.now(), ms };
    controls.autoRotate = false; clearTimeout(idleT);
    if (!opts.still) idleT = setTimeout(() => { controls.autoRotate = true; }, 9000);
  }

  let visible = true;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (camAnim) {
      const p = clamp((now - camAnim.t0) / camAnim.ms, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const a = lerp(camAnim.a0, camAnim.a1, e);
      camera.position.set(controls.target.x + camAnim.r * Math.sin(a), controls.target.y + camAnim.y, controls.target.z + camAnim.r * Math.cos(a));
      if (p >= 1) camAnim = null;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);

  root.classList.add('is-3d');
  return { turnTo };
}
