// Real-time 3D hero objects (PBR gold coins, snowball, scales of justice), rendered deterministically per frame.
import * as THREE from 'three';
import { RoomEnvironment } from './lib/RoomEnvironment.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
camera.position.set(0, 0, 20);
const PX = 2 * 20 * Math.tan(THREE.MathUtils.degToRad(15)) / H;   // world units per pixel on the z=0 plane
const sy = py => (H / 2 - py) * PX, sx = px => (px - W / 2) * PX;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, d) => clamp((t - a) / d);
const eOut = k => 1 - Math.pow(1 - k, 3);
const eIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const spring = k => k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.exp(-6.5 * k) * Math.cos(10.5 * k);
function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc35a, metalness: 1, roughness: .22, envMap: envTex, envMapIntensity: 1.25, clearcoat: .4, clearcoatRoughness: .2 });

// ---------- coin ----------
function coinFaceTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#d0d0d0'; g.lineWidth = 22; g.beginPath(); g.arc(256, 256, 226, 0, 7); g.stroke();
  g.strokeStyle = '#5a5a5a'; g.lineWidth = 8; g.beginPath(); g.arc(256, 256, 196, 0, 7); g.stroke();
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; g.fillStyle = '#b0b0b0'; g.beginPath(); g.arc(256 + Math.cos(a) * 176, 256 + Math.sin(a) * 176, 5, 0, 7); g.fill(); }
  g.fillStyle = '#e8e8e8'; g.font = '900 190px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('R$', 256, 268);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
const faceTex = coinFaceTexture();
const coinFace = gold.clone(); coinFace.bumpMap = faceTex; coinFace.bumpScale = 6; coinFace.roughnessMap = faceTex;
const coinSide = gold.clone(); coinSide.roughness = .35;
const coinGeo = new THREE.CylinderGeometry(1, 1, .16, 72, 1);
const coinScene = new THREE.Scene();
coinScene.environment = envTex;
const coins = [];
{
  const r = rand(7);
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(coinGeo, [coinSide, coinFace, coinFace]);
    const d = { x: (r() - .5) * 8, z: -4 - r() * 10, delay: r() * 4.2, speed: 4.5 + r() * 3, rx: (r() - .5) * 6, rz: (r() - .5) * 5, s: .5 + r() * .35, ry: r() * 6 };
    m.userData = d; coins.push(m); coinScene.add(m);
  }
  const key = new THREE.DirectionalLight(0xfff0d0, 2.2); key.position.set(4, 6, 8); coinScene.add(key);
  const rim = new THREE.DirectionalLight(0xff5040, 3); rim.position.set(-6, -2, -4); coinScene.add(rim);
}
function drawCoins(t, sc, ev) {
  // coins rain down behind the bank card, faster once the money starts leaving
  const surge = P(t, ev.s1_fatura, 1.5);
  coins.forEach((m, i) => {
    const d = m.userData, tt = Math.max(0, t - d.delay * (1 - .6 * surge) + 1.2);
    const fall = tt * d.speed * (1 + surge * .6);
    const y = 7.5 - (fall % 17);
    m.position.set(d.x + Math.sin(tt * .8 + i) * .4, y, d.z);
    m.rotation.set(Math.PI / 2 + tt * d.rx * .4, d.ry + tt * .3, tt * d.rz * .4);
    m.scale.setScalar(d.s);
  });
  camera.position.set(Math.sin(t * .4) * .3, 0, 20); camera.lookAt(0, 0, 0);
  renderer.render(coinScene, camera);
}

// ---------- snowball ----------
function snowTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  const r = rand(3);
  g.fillStyle = '#eef3fb'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 9000; i++) { const v = 200 + r() * 55 | 0; g.fillStyle = `rgba(${v},${v + 5},255,.35)`; g.beginPath(); g.arc(r() * 1024, r() * 512, .8 + r() * 3.2, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(200,30,45,.92)'; g.font = '900 210px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('R$', 256, 270); g.fillText('R$', 768, 270);
  return new THREE.CanvasTexture(c);
}
function bumpTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); const r = rand(5);
  g.fillStyle = '#808080'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 14000; i++) { const v = 90 + r() * 120 | 0; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.beginPath(); g.arc(r() * 1024, r() * 512, 1 + r() * 4, 0, 7); g.fill(); }
  return new THREE.CanvasTexture(c);
}
const snowScene = new THREE.Scene(); snowScene.environment = envTex;
const ballMat = new THREE.MeshPhysicalMaterial({ map: snowTexture(), bumpMap: bumpTexture(), bumpScale: 3, roughness: .85, sheen: 1, sheenColor: new THREE.Color(0xdde8ff), sheenRoughness: .6, envMapIntensity: .8 });
ballMat.map.colorSpace = THREE.SRGBColorSpace;
const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), ballMat); snowScene.add(ball);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .55, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; snowScene.add(shadow);
const flakes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6, envMapIntensity: .6 }), 60);
snowScene.add(flakes);
{
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-5, 6, 7); snowScene.add(key);
  const rim = new THREE.DirectionalLight(0xff6050, 2.2); rim.position.set(6, 1, -5); snowScene.add(rim);
  snowScene.add(new THREE.AmbientLight(0x8090b0, .5));
}
const tmp = new THREE.Object3D();
function drawSnow(t, sc, ev) {
  const b0 = ev.s5_bola - .35, roll = P(t, b0, 2.2), k = eOut(roll);
  const R = (55 + 120 * eOut(P(t, b0, 4.5))) * PX, groundY = sy(830) - 175 * PX;
  const x = THREE.MathUtils.lerp(sx(-180), 0, k);
  ball.scale.setScalar(R); ball.position.set(x, groundY + R, 0);
  ball.rotation.set(0, -.5, -(x - sx(-180)) / R - Math.max(0, t - b0 - 2.2) * 1.1);
  ball.visible = t > b0;
  shadow.position.set(x, groundY + .01, 0); shadow.scale.setScalar(R * 1.15); shadow.visible = ball.visible;
  const r = rand(11);
  for (let i = 0; i < 60; i++) {
    const age = ((t * 1.6 + r()) % 1), side = -1 - r() * .6;
    tmp.position.set(x + side * R * (.6 + age * 1.4), groundY + R * (.15 + .9 * Math.sin(age * Math.PI) * r()), (r() - .5) * R * 1.6);
    tmp.scale.setScalar((.025 + r() * .05) * (1 - age) * clamp(roll * 4) * (1 - P(t, b0 + 2.2, .6)) + 1e-4);
    tmp.updateMatrix(); flakes.setMatrixAt(i, tmp.matrix);
  }
  flakes.instanceMatrix.needsUpdate = true;
  camera.position.set(0, 0, 20); camera.lookAt(0, 0, 0);
  renderer.render(snowScene, camera);
}

// ---------- scales of justice ----------
const scaleScene = new THREE.Scene(); scaleScene.environment = envTex;
const scales = new THREE.Group(), beam = new THREE.Group();
{
  const add = (geo, parent = scales, mat = gold) => { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; };
  const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 96);
  add(lathe([[0, -2.6], [1.5, -2.6], [1.55, -2.5], [1.5, -2.35], [1.05, -2.25], [.9, -2.05], [.35, -1.95], [.22, -1.6], [0, -1.6]]));
  add(new THREE.CylinderGeometry(.12, .16, 4.2, 48)).position.y = .4;
  add(new THREE.SphereGeometry(.26, 48, 32)).position.y = 2.75;
  add(lathe([[0, 2.25], [.32, 2.3], [.22, 2.45], [0, 2.5]]));
  beam.position.y = 2.25; scales.add(beam);
  add(new THREE.CylinderGeometry(.07, .07, 4.4, 32), beam).rotation.z = Math.PI / 2;
  [-2.2, 2.2].forEach(x => {
    add(new THREE.SphereGeometry(.13, 32, 16), beam).position.x = x;
    const hang = new THREE.Group(); hang.position.x = x; hang.name = 'hang'; beam.add(hang);
    [[-.55, 0], [.55, 0], [0, .45], [0, -.45]].forEach(([dx, dz]) => {
      const dir = new THREE.Vector3(dx, -1.6, dz), m = add(new THREE.CylinderGeometry(.02, .02, dir.length(), 8), hang);
      m.position.copy(dir).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    });
    add(lathe([[0, -1.95], [.45, -1.93], [.75, -1.8], [.85, -1.6], [.82, -1.6], [.72, -1.78], [.44, -1.89], [0, -1.91]]), hang);
  });
}
scaleScene.add(scales);
const sweep = new THREE.PointLight(0xfff2cc, 60, 30);
{
  const key = new THREE.DirectionalLight(0xfff0d8, 2.5); key.position.set(3, 5, 8); scaleScene.add(key);
  const rim = new THREE.DirectionalLight(0x40e0a0, 2.2); rim.position.set(-6, 2, -6); scaleScene.add(rim);
  scaleScene.add(sweep);
}
function drawScales(t, sc, ev, cy, size, at) {
  const lt = t - at, k = spring(P(t, at, 1.1));
  scales.scale.setScalar(Math.max(1e-3, k) * size);
  scales.position.set(0, sy(cy) - .2 * size, 0);
  scales.rotation.y = -.5 + lt * .35;
  const tilt = .16 * Math.exp(-lt * .9) * Math.cos(lt * 3.2);
  beam.rotation.z = tilt;
  beam.children.filter(c => c.name === 'hang').forEach(h => h.rotation.z = -tilt);
  sweep.position.set(Math.sin(lt * 1.3) * 6, sy(cy) + 2, 6);
  camera.position.set(0, 0, 20); camera.lookAt(0, 0, 0);
  renderer.render(scaleScene, camera);
}

window.render3D = (t, sc, ev, S) => {
  renderer.clear();
  canvas.style.opacity = 1;
  if (sc.id === 's1') return drawCoins(t, sc, ev);
  if (sc.id === 's5') return drawSnow(t, sc, ev);
  if (sc.id === 's6') return drawScales(t, sc, ev, 500, .45, sc.start);
  if (sc.id === 's11') return drawScales(t, sc, ev, 430, .42, sc.start);
};
window.__3dReady = true;
