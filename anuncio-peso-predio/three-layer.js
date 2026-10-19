// "O Peso": a 3D corporate tower (the client's company) in a night business district.
// Debt blocks land on its roof and the lights go out; a gold structure then takes the weight off.
import * as THREE from 'three';
import { RoomEnvironment } from './lib/RoomEnvironment.js';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, d) => clamp((t - a) / d);
const lerp = THREE.MathUtils.lerp;
const eOut = k => 1 - Math.pow(1 - k, 3);
const eIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const bounce = k => { if (k >= 1) return 1; const n = 7.5625, d = 2.75; k = clamp(k);
  return k < 1 / d ? n * k * k : k < 2 / d ? n * (k -= 1.5 / d) * k + .75 : k < 2.5 / d ? n * (k -= 2.25 / d) * k + .9375 : n * (k -= 2.625 / d) * k + .984375; };
function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const scene = new THREE.Scene();
scene.environment = envTex;
scene.fog = new THREE.FogExp2(0x070b16, 0.028);
const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 300);

// ---------- window textures ----------
function windowCanvas(cols, rows, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function paintWindows(c, cols, rows, lit, seed, warm = true) {
  const g = c.getContext('2d'), r = rand(seed), cw = c.width / cols, rh = c.height / rows;
  g.fillStyle = '#05070c'; g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = r(), on = v < lit, hue = r();
    g.fillStyle = on ? (warm ? (hue < .7 ? '#ffd58a' : '#fff1cf') : '#bcd6ff') : '#0c1220';
    g.globalAlpha = on ? .75 + .25 * r() : 1;
    g.fillRect(x * cw + cw * .18, y * rh + rh * .22, cw * .64, rh * .56);
  }
  g.globalAlpha = 1;
}
// background district
const cityCanvas = windowCanvas(8, 32, 128, 512); paintWindows(cityCanvas, 8, 32, .35, 99, true);
const cityTex = new THREE.CanvasTexture(cityCanvas); cityTex.colorSpace = THREE.SRGBColorSpace;
cityTex.wrapS = cityTex.wrapT = THREE.RepeatWrapping;
const cityMat = new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: .4, metalness: .7, emissive: 0xffffff, emissiveMap: cityTex, emissiveIntensity: .55 });
{
  const r = rand(4), geo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 7 + r() * 26, h = 2 + r() * 11 * (d > 14 ? 1.3 : .8), w = 1.2 + r() * 2;
    const x = Math.cos(a) * d, z = Math.sin(a) * d - 4;
    if (Math.abs(x) < 4 && z > -6) continue;                      // keep the hero tower clear
    const m = new THREE.Mesh(geo, cityMat); m.scale.set(w, h, w); m.position.set(x, h / 2, z); scene.add(m);
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x060a14, roughness: .25, metalness: .8 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
}

// ---------- hero tower ----------
const TW = 2.4, TH = 8.2;
const towerCanvas = windowCanvas(9, 44, 288, 1408);
const towerTex = new THREE.CanvasTexture(towerCanvas); towerTex.colorSpace = THREE.SRGBColorSpace;
let litNow = -1;
function setLit(v) { v = Math.round(v * 40) / 40; if (v === litNow) return; litNow = v; paintWindows(towerCanvas, 9, 44, v, 7, true); towerTex.needsUpdate = true; }
const towerMat = new THREE.MeshPhysicalMaterial({ color: 0x0e1626, roughness: .12, metalness: .9, emissive: 0xffffff, emissiveMap: towerTex, emissiveIntensity: .9, clearcoat: 1, clearcoatRoughness: .1 });
const capMat = new THREE.MeshStandardMaterial({ color: 0x1a2236, roughness: .3, metalness: .9 });
const tower = new THREE.Group(); scene.add(tower);
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TW), [towerMat, towerMat, capMat, capMat, towerMat, towerMat]);
  body.position.y = TH / 2; tower.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(TW + .2, .18, TW + .2), capMat); roof.position.y = TH + .09; tower.add(roof);
  const base = new THREE.Mesh(new THREE.BoxGeometry(TW + .5, .5, TW + .5), capMat); base.position.y = .25; tower.add(base);
}
const roofY = TH + .18;

// ---------- gold structure (the solution) ----------
const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc35a, metalness: 1, roughness: .2, envMapIntensity: 1.3, clearcoat: .5, clearcoatRoughness: .15 });
const frame = new THREE.Group(); tower.add(frame);
const beams = [];
{
  const e = TW / 2 + .12, cs = [[e, e], [-e, e], [e, -e], [-e, -e]];
  cs.forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.14, TH, .14), gold); b.position.set(x, TH / 2, z); b.userData.h = 0; frame.add(b); beams.push(b); });
  for (let k = 0; k < 6; k++) {                      // horizontal gold rings every few floors
    const y = (k + 1) * TH / 7;
    [[0, e, TW + .38, .1], [0, -e, TW + .38, .1], [e, 0, .1, TW + .38], [-e, 0, .1, TW + .38]].forEach(([x, z, w, d]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, .1, d), gold); b.position.set(x, y, z); b.userData.h = y / TH; frame.add(b); beams.push(b);
    });
  }
}

// ---------- debt blocks ----------
function labelTex(text, sub) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 320; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#9c2228'); gr.addColorStop(1, '#5a0f14'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 320);
  g.strokeStyle = 'rgba(255,200,200,.35)'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 292);
  g.fillStyle = '#fff'; g.font = '800 104px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 512, sub ? 135 : 165);
  if (sub) { g.fillStyle = 'rgba(255,220,220,.8)'; g.font = '700 54px Inter'; g.fillText(sub, 512, 242); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const BLOCKS = [['CAPITAL DE GIRO', 'parcela mensal'], ['CHEQUE ESPECIAL', 'juros rotativos'], ['CARTÃO PJ', 'fatura rotativa'], ['RENEGOCIAÇÃO', 'em cima de outra'], ['+ JUROS', 'todo mês']];
const blockGeo = new RoundedBoxGeometry(2.2, .62, 2.2, 4, .08);
const blocks = BLOCKS.map(([a, b], i) => {
  const side = new THREE.MeshPhysicalMaterial({ map: labelTex(a, b), roughness: .35, metalness: .3, clearcoat: .6, clearcoatRoughness: .2 });
  const top = new THREE.MeshPhysicalMaterial({ color: 0x7a161c, roughness: .35, metalness: .4, clearcoat: .6 });
  const m = new THREE.Mesh(blockGeo, [side, side, top, top, side, side]);
  m.userData = { side, top, phase: i * 1.7 }; scene.add(m); return m;
});
const red = new THREE.Color(0x7a161c), goldC = new THREE.Color(0xd9a441);

// ---------- lights ----------
const key = new THREE.DirectionalLight(0xbfd2ff, 1.4); key.position.set(-6, 14, 10); scene.add(key);
const warm = new THREE.DirectionalLight(0xffd29a, 0); warm.position.set(8, 3, 8); scene.add(warm);
const alarm = new THREE.PointLight(0xff2a2a, 0, 14, 1.6); scene.add(alarm);
scene.add(new THREE.HemisphereLight(0x2a3a66, 0x05070c, .6));

const tmpV = new THREE.Vector3();
function toScreen(v) { tmpV.copy(v).project(camera); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H]; }

window.render3D = (t, sc, ev) => {
  const S = window.__TL.scenes, sid = sc.id;
  if (sid === 's5') { renderer.clear(); window.__labels = {}; return; }
  const turn = S.find(s => s.id === 's4').start;
  const fix = P(t, turn, 1);                                  // 0 = problem, 1 = solution
  // blocks: land on the roof at their words, later lift off and settle on the ground as gold
  const landAt = [ev.s2_capital, ev.s2_cheque, ev.s2_cartao, ev.s2_reneg, ev.s2_bloco];
  const liftAt = [ev.s4_tira, ev.s4_analise, ev.s4_negociacao, ev.s4_plano, ev.s4_reorganizar];
  let landed = 0, shake = 0;
  blocks.forEach((m, i) => {
    // blocks above a lifted one settle down onto what is left of the stack
    let below = 0; for (let j = 0; j < i; j++) below += 1 - bounce(P(t, liftAt[j] + .35, .6));
    const k = P(t, landAt[i] - .55, .75), y0 = roofY + .31 + below * .64;
    if (k > 0 && k < 1.2) shake = Math.max(shake, Math.exp(-(t - landAt[i] - .2) * 6) * (t > landAt[i] + .2 ? 1 : 0));
    if (t > landAt[i] + .2) landed++;
    const l = eIO(P(t, liftAt[i], 1.1));
    const fallY = lerp(y0 + 14, y0, bounce(k));
    // the plan lifts each block off the roof and out of frame, turning gold on the way
    m.position.set(Math.sin(i) * .05 + (i % 2 ? 1 : -1) * 1.5 * l * l, fallY + 26 * l * l, 0);
    m.rotation.y = lerp((i % 2 ? .06 : -.05) + (1 - k) * 1.2, .35, l);
    m.visible = k > 0;
    m.userData.side.color.copy(new THREE.Color(1, 1, 1).lerp(goldC, l * .85));
    m.userData.top.color.copy(red.clone().lerp(goldC, l));
    m.userData.top.metalness = m.userData.side.metalness = lerp(.35, 1, l);
  });
  // lights go out as the weight grows, come back with the plan
  setLit(lerp(lerp(.9, .18, landed / 5), .95, eIO(P(t, ev.s4_reorganizar - .5, 1.5))));
  const sway = shake * .03 * Math.sin(t * 40);
  tower.rotation.z = sway + (1 - fix) * .012 * (landed / 5) * Math.sin(t * 1.3);
  beams.forEach(b => { const g = eOut(P(t, ev.s4_gestao + b.userData.h * 1.4, .6)); b.scale.set(1, b.geometry.parameters.height > 1 ? Math.max(1e-3, g) : 1, 1);
    if (b.geometry.parameters.height > 1) b.position.y = TH / 2 * g; else b.visible = g > .5; });
  frame.visible = t > ev.s4_gestao;
  alarm.position.set(0, roofY + 2, 2.5);
  alarm.intensity = sid === 's3' || sid === 's2' ? (2 + 18 * (landed / 5)) * (.6 + .4 * Math.sin(t * 6)) * (1 - fix) : 0;
  warm.intensity = 2.6 * fix; key.intensity = 1.4 + .6 * fix;
  cityMat.emissiveIntensity = lerp(.55, .8, fix);

  // camera: roof close-up -> stack shot -> wide reveal -> heroic low orbit
  const lt = t - sc.start; let cp, look;
  if (sid === 's1') { cp = [lerp(3.5, 5, P(t, 0, 4)), roofY + lerp(5.5, 4.2, P(t, 0, 4)), lerp(9, 10.5, P(t, 0, 4))]; look = [0, roofY - 1.2, 0]; }
  else if (sid === 's2') { const k = eIO(P(t, sc.start, 1.4)); cp = [lerp(5, 6.5, k) + Math.sin(lt * .3) * .6, lerp(roofY + 4.2, roofY + 1.6, k), lerp(10.5, 13, k)]; look = [0, roofY + 1.0, 0]; }
  else if (sid === 's3') { const k = eIO(P(t, sc.start, 3)); cp = [lerp(6.5, 9, k), lerp(roofY + 1.6, 11.5, k), lerp(13, 25, k)]; look = [0, lerp(roofY + 1, 11.2, k), 0]; }
  else { const k = eIO(P(t, sc.start, 3.5)), a = lerp(.6, -.25, eIO(P(t, sc.start, sc.end - sc.start))); cp = [Math.sin(a) * lerp(25, 20, k), lerp(11.5, 2.6, k), Math.cos(a) * lerp(25, 20, k)]; look = [0, lerp(11.2, 9.6, k), 0]; }
  camera.position.set(cp[0] + shake * .08 * Math.sin(t * 55), cp[1] + shake * .1 * Math.cos(t * 47), cp[2]);
  camera.lookAt(...look);
  renderer.render(scene, camera);
  window.__labels = { top: toScreen(new THREE.Vector3(0, roofY + .3 + Math.max(landed, 1) * .64, 0)), tower: toScreen(new THREE.Vector3(0, TH * .55, TW / 2)), base: toScreen(new THREE.Vector3(0, 0, 0)) };
};
window.__3dReady = true;
