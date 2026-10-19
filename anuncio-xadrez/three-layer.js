// "Xadrez": the company is a gold king on a marble board; the banks' black pieces close in,
// then gold pieces (the legal strategy) enter, block the checks and capture.
import * as THREE from 'three';
import { RoomEnvironment } from './lib/RoomEnvironment.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
scene.fog = new THREE.Fog(0x05070c, 14, 34);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);

// ---------- marble board ----------
function marble(base, vein, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), r = rand(seed);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = vein; g.globalAlpha = .15 + r() * .35; g.lineWidth = .6 + r() * 2.4; g.beginPath();
    let x = r() * 512, y = 0; g.moveTo(x, y);
    while (y < 512) { x += (r() - .5) * 40; y += 12 + r() * 20; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const darkSq = new THREE.MeshPhysicalMaterial({ map: marble('#14171d', '#5a6272', 3), roughness: .16, metalness: .1, clearcoat: 1, clearcoatRoughness: .08 });
const lightSq = new THREE.MeshPhysicalMaterial({ map: marble('#d9d3c5', '#8d867a', 8), roughness: .18, metalness: .05, clearcoat: 1, clearcoatRoughness: .08 });
const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc35a, metalness: 1, roughness: .2, envMapIntensity: 1.35, clearcoat: .5, clearcoatRoughness: .15 });
const onyx = new THREE.MeshPhysicalMaterial({ color: 0x0b0c10, metalness: .35, roughness: .16, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.2 });
const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x0d0f14, metalness: .5, roughness: .25, clearcoat: 1 });
const X = f => f - 3.5, Z = r => 3.5 - r;
{
  const sq = new THREE.BoxGeometry(1, .16, 1);
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const m = new THREE.Mesh(sq, (f + r) % 2 ? lightSq : darkSq); m.position.set(X(f), -.08, Z(r)); m.receiveShadow = true; scene.add(m);
  }
  const fr = new THREE.Mesh(new THREE.BoxGeometry(9.2, .3, 9.2), frameMat); fr.position.y = -.2; fr.receiveShadow = true; scene.add(fr);
  [[0, 4.3, 8.9, .06], [0, -4.3, 8.9, .06], [4.3, 0, .06, 8.9], [-4.3, 0, .06, 8.9]].forEach(([x, z, w, d]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, .04, d), gold); b.position.set(x, -.03, z); scene.add(b);
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x06080d, roughness: .5, metalness: .6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.36; floor.receiveShadow = true; scene.add(floor);
}

// ---------- pieces ----------
const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 64);
const BASE = [[0, 0], [.4, 0], [.42, .05], [.4, .11], [.33, .15], [.34, .19], [.27, .24]];
function piece(kind, mat) {
  const g = new THREE.Group(), add = (geo, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; g.add(m); return m; };
  if (kind === 'pawn') { add(lathe([...BASE, [.17, .3], [.13, .5], [.2, .54], [.2, .58], [.12, .62], [0, .63]])); add(new THREE.SphereGeometry(.17, 40, 24), .76); }
  if (kind === 'rook') {
    add(lathe([...BASE, [.25, .32], [.22, .82], [.31, .88], [.31, 1.06], [.22, 1.06], [.22, .98], [0, .98]]));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, m = add(new THREE.BoxGeometry(.11, .14, .12), 1.12); m.position.x = Math.cos(a) * .26; m.position.z = Math.sin(a) * .26; m.rotation.y = -a; }
  }
  if (kind === 'bishop') { add(lathe([...BASE, [.2, .34], [.14, .82], [.24, .86], [.24, .9], [.13, .94], [0, .95]])); const h = add(new THREE.SphereGeometry(.2, 40, 24), 1.12); h.scale.set(1, 1.35, 1); add(new THREE.SphereGeometry(.07, 20, 12), 1.43); }
  if (kind === 'queen') {
    add(lathe([...BASE, [.22, .36], [.15, 1.0], [.27, 1.06], [.27, 1.1], [.17, 1.15], [.28, 1.34], [0, 1.28]]));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, m = add(new THREE.SphereGeometry(.055, 16, 10), 1.36); m.position.x = Math.cos(a) * .25; m.position.z = Math.sin(a) * .25; }
    add(new THREE.SphereGeometry(.09, 24, 16), 1.42);
  }
  if (kind === 'king') {
    add(lathe([...BASE, [.24, .36], [.16, 1.06], [.29, 1.12], [.29, 1.16], [.18, 1.2], [.26, 1.4], [0, 1.42]]));
    add(new THREE.BoxGeometry(.09, .36, .09), 1.6); add(new THREE.BoxGeometry(.28, .09, .09), 1.64);
  }
  if (kind === 'knight') {
    add(lathe([...BASE, [.26, .3], [0, .3]]));
    const s = new THREE.Shape();
    s.moveTo(-.24, 0); s.lineTo(.26, 0); s.quadraticCurveTo(.18, .3, .3, .5); s.quadraticCurveTo(.36, .7, .18, .86);
    s.lineTo(.2, .98); s.lineTo(.08, .9); s.quadraticCurveTo(-.12, .9, -.3, .7); s.quadraticCurveTo(-.42, .58, -.34, .5);
    s.quadraticCurveTo(-.2, .52, -.08, .56); s.quadraticCurveTo(-.26, .34, -.24, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: .26, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 4, curveSegments: 24 });
    geo.translate(0, 0, -.13); const m = add(geo, .28); m.rotation.y = Math.PI / 2;
  }
  scene.add(g); return g;
}
const king = piece('king', gold);
const blk = { rook: piece('rook', onyx), bishop: piece('bishop', onyx), queen: piece('queen', onyx), knight: piece('knight', onyx), king: piece('king', onyx) };
const pawns = [0, 2, 5, 7].map(f => { const p = piece('pawn', onyx); p.position.set(X(f), 0, Z(6)); return p; });
const ally = { knight: piece('knight', gold), rook: piece('rook', gold), bishop: piece('bishop', gold) };
blk.knight.position.set(X(6), 0, Z(7)); blk.knight.rotation.y = Math.PI;
blk.king.position.set(X(2), 0, Z(7));

// check ring under the king
const ring = new THREE.Mesh(new THREE.RingGeometry(.48, .6, 64), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; scene.add(ring);
const checkLight = new THREE.PointLight(0xff2020, 0, 5, 1.5); scene.add(checkLight);
const kingLight = new THREE.PointLight(0xffd27a, 0, 6, 1.5); scene.add(kingLight);

// ---------- lights ----------
const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(-5, 11, 6); key.castShadow = true;
key.shadow.mapSize.set(1536, 1536); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); key.shadow.bias = -.0004; key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb0ff, 1.6); rim.position.set(6, 4, -8); scene.add(rim);
scene.add(new THREE.HemisphereLight(0x2a3550, 0x05070c, .5));

const tmpV = new THREE.Vector3();
const scr = (obj, y) => { tmpV.set(obj.position.x, obj.position.y + y, obj.position.z).project(camera); return [(tmpV.x + 1) / 2 * W, (1 - tmpV.y) / 2 * H]; };
// slide (rook/queen/bishop) or hop (knight / drop-in) between squares
const slide = (o, a, b, k) => o.position.set(lerp(X(a[0]), X(b[0]), eIO(k)), 0, lerp(Z(a[1]), Z(b[1]), eIO(k)));

window.render3D = (t, sc, ev) => {
  const sid = sc.id, S = window.__TL.scenes;
  if (sid === 's4') { renderer.clear(); window.__labels = {}; return; }
  king.position.set(X(4), 0, Z(1));
  // the banks advance
  slide(blk.rook, [1, 7], [1, 1], P(t, ev.s2_juros - .5, .9));
  slide(blk.bishop, [3, 6], [6, 3], P(t, ev.s2_garantias - .5, .9));
  slide(blk.queen, [4, 7], [4, 4], P(t, ev.s2_prazos - .5, .9));
  const check = P(t, ev.s2_movimento, .4) * (1 - P(t, ev.s3_estrategia, .6));
  // the strategy enters: knight, rook and bishop drop in, knight captures the bishop
  const drop = (o, sq, at) => { const k = P(t, at - .45, .7); o.visible = k > 0; o.position.set(X(sq[0]), lerp(9, 0, bounce(k)), Z(sq[1])); };
  drop(ally.knight, [5, 1], ev.s3_entra); ally.knight.rotation.y = -Math.PI / 2;
  drop(ally.rook, [4, 3], ev.s3_analisa);
  drop(ally.bishop, [2, 1], ev.s3_conduz);
  const jump = P(t, ev.s3_identifica - .2, .6);
  if (jump > 0) { ally.knight.position.set(lerp(X(5), X(6), eIO(jump)), Math.sin(Math.PI * jump) * 1.4, lerp(Z(1), Z(3), eIO(jump))); }
  const cap = P(t, ev.s3_identifica + .25, .5);
  blk.bishop.rotation.z = -eOut(cap) * 1.45; blk.bishop.position.x += cap * .5; blk.bishop.position.y = -cap * .25;
  blk.bishop.visible = cap < .98;
  ring.position.set(king.position.x, .01, king.position.z);
  ring.material.opacity = check * (.6 + .4 * Math.sin(t * 8));
  checkLight.position.set(king.position.x, 1, king.position.z + .4); checkLight.intensity = check * 6;
  kingLight.position.set(king.position.x, 2.2, king.position.z + 1); kingLight.intensity = P(t, ev.s3_estrategia, .6) * 10;

  // camera
  let cp, look;
  if (sid === 's1') {
    const k = eIO(P(t, ev.s1_jogo - .6, 2.4)), o = t * .05;
    cp = [lerp(2.2, 4.2, k) + Math.sin(o) * .5, lerp(2.1, 10, k), lerp(6.4, 12.5, k)]; look = [lerp(.5, 0, k), lerp(1.55, 1.2, k), lerp(2.5, 0, k)];
  } else if (sid === 's2') {
    const k = eIO(P(t, sc.start, sc.end - sc.start)), a = lerp(.32, .12, k);
    cp = [Math.sin(a) * 14, lerp(10, 9.4, k), Math.cos(a) * 14]; look = [0, 1.2, .4];
  } else {
    const k = eIO(P(t, sc.start, sc.end - sc.start)), a = lerp(.12, -.38, k), d = lerp(14, 11.5, eIO(P(t, ev.s3_estrategia - 1, 2)));
    cp = [Math.sin(a) * d, lerp(9.4, 6.4, k), Math.cos(a) * d + .8]; look = [lerp(0, .5, k), lerp(1.2, 1.5, k), lerp(.4, 1.3, k)];
  }
  camera.position.set(...cp); camera.lookAt(...look);
  renderer.render(scene, camera);
  window.__labels = { king: scr(king, 2.0), rook: scr(blk.rook, 1.5), bishop: scr(blk.bishop, 1.75), queen: scr(blk.queen, 1.75), knight: scr(ally.knight, 1.5), arook: scr(ally.rook, 1.5), abishop: scr(ally.bishop, 1.75) };
};
window.__3dReady = true;
