// Cenas do agro em SVG: céu, relevo com névoa, eucaliptais, lavoura em perspectiva,
// estrada de terra vermelha, máquinas, gado nelore, ipê, postes e textura de grão.
let uid = 0;
const nid = (p) => `${p}${++uid}`;

function rng(seed) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const f = (n) => Math.round(n * 10) / 10;

const PAL = {
  day:  { sky: ['#5d93c9', '#9cc2e2', '#dfe9e6'], haze: '#c9d9db', ridge: '#57745a', tree: '#2f4a2c', field: '#4c7f36', plantD: '#2c5a22', plantL: '#8cb64e', soil: '#a85a33', soilD: '#7d3d22', light: 'left', sun: null, cloud: ['#ffffff', '#c8d4dc'] },
  gold: { sky: ['#6e8fb0', '#e2bd85', '#f6d79c'], haze: '#ecd2a0', ridge: '#7d7444', tree: '#3d4126', field: '#c4943a', plantD: '#8d6420', plantL: '#f2cf78', soil: '#a2552d', soilD: '#6e3519', light: 'right', sun: '#fff1c4', cloud: ['#fff3d6', '#d8a979'] },
  dusk: { sky: ['#14211d', '#5a4128', '#e29a45'], haze: '#9b6a3a', ridge: '#2b3a26', tree: '#111d14', field: '#1e3820', plantD: '#0f2214', plantL: '#b88a3c', soil: '#5a2a18', soilD: '#2f150b', light: 'center', sun: '#ffd88a', cloud: ['#e8a660', '#3b2e24'] },
  mist: { sky: ['#a9b9b7', '#d7ddd3', '#eeece0'], haze: '#e6e7dc', ridge: '#7f9580', tree: '#4d644b', field: '#557a43', plantD: '#36592c', plantL: '#a6c47e', soil: '#a4664a', soilD: '#7b4632', light: 'left', sun: '#fffbea', cloud: ['#f4f4ee', '#cfd5cf'] },
  dry:  { sky: ['#4a4741', '#9a7552', '#d9a56c'], haze: '#c39668', ridge: '#5b4a35', tree: '#2d281d', field: '#94573a', plantD: '#5d3b22', plantL: '#c6915a', soil: '#b0613a', soilD: '#6b321b', light: 'right', sun: '#ffe3b0', cloud: ['#7d6a58', '#3e3a35'] },
};

function defs(o, ids, p) {
  const [s0, s1, s2] = p.sky;
  return `<defs>
  <linearGradient id="${ids.sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset=".62" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
  <radialGradient id="${ids.glow}"><stop offset="0" stop-color="${p.sun || '#fff'}" stop-opacity=".95"/><stop offset=".25" stop-color="${p.sun || '#fff'}" stop-opacity=".45"/><stop offset="1" stop-color="${s2}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${ids.field}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p.field, p.haze, 0.55)}"/><stop offset=".25" stop-color="${p.field}"/><stop offset="1" stop-color="${mix(p.field, '#000000', 0.35)}"/></linearGradient>
  <linearGradient id="${ids.road}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p.soil, p.haze, 0.5)}"/><stop offset="1" stop-color="${p.soil}"/></linearGradient>
  <linearGradient id="${ids.hazeG}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.haze}" stop-opacity="0"/><stop offset=".7" stop-color="${p.haze}" stop-opacity="${o.mistAmt ?? 0.55}"/><stop offset="1" stop-color="${p.haze}" stop-opacity="0"/></linearGradient>
  <filter id="${ids.blur}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${o.blurAmt || 6}"/></filter>
  <filter id="${ids.soft}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
  <filter id="${ids.grain}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${o.seed || 1}"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 1.1 -.45"/></filter>
</defs>`;
}

function clouds(w, H0, n, seed, p, ids) {
  const r = rng(seed + 101);
  let out = `<g filter="url(#${ids.soft})">`;
  for (let i = 0; i < n; i++) {
    const cx = r() * w, cy = H0 * (0.12 + r() * 0.5), s = 0.6 + r() * 1.2;
    const k = 4 + Math.floor(r() * 5);
    let puffs = '';
    for (let j = 0; j < k; j++) {
      const px = cx + (j - k / 2) * 14 * s + r() * 8, py = cy - r() * 12 * s, pr = (10 + r() * 14) * s;
      puffs += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(pr)}"/>`;
    }
    out += `<g opacity="${f(0.55 + r() * 0.4)}"><g fill="${p.cloud[1]}" transform="translate(0 ${f(5 * s)})">${puffs}</g><g fill="${p.cloud[0]}">${puffs}</g></g>`;
  }
  return out + '</g>';
}

function ridge(w, base, amp, seed, fill) {
  const r = rng(seed);
  let d = `M0 ${base}`;
  const n = 9;
  let prev = base - amp * r();
  d += ` L0 ${f(prev)}`;
  for (let i = 1; i <= n; i++) {
    const x = (w / n) * i, y = base - amp * (0.2 + r() * 0.8);
    d += ` C${f(x - w / n / 1.6)} ${f(prev)} ${f(x - w / n / 2.6)} ${f(y)} ${f(x)} ${f(y)}`;
    prev = y;
  }
  return `<path d="${d} L${w} ${base + 30} L0 ${base + 30} Z" fill="${fill}"/>`;
}

// eucaliptal / mata ciliar na linha do horizonte
function trees(w, y, seed, fill, scale = 1, density = 1) {
  const r = rng(seed + 7);
  let out = `<g fill="${fill}">`;
  let x = -10;
  while (x < w + 10) {
    if (r() < 0.55 * density) {
      // grupo de eucaliptos
      const k = 3 + Math.floor(r() * 9);
      for (let i = 0; i < k; i++) {
        const h = (14 + r() * 18) * scale, tw = (3 + r() * 2.4) * scale;
        out += `<rect x="${f(x)}" y="${f(y - h * 0.45)}" width="${f(0.6 * scale)}" height="${f(h * 0.45)}"/>`;
        out += `<ellipse cx="${f(x)}" cy="${f(y - h * 0.62)}" rx="${f(tw)}" ry="${f(h * 0.42)}"/>`;
        x += tw * 1.3;
      }
    } else if (r() < 0.5) {
      const rr = (5 + r() * 6) * scale; // árvore copada
      out += `<circle cx="${f(x)}" cy="${f(y - rr)}" r="${f(rr)}"/><circle cx="${f(x + rr * 0.8)}" cy="${f(y - rr * 0.7)}" r="${f(rr * 0.8)}"/>`;
      x += rr * 2;
    }
    x += (6 + r() * 30) * scale;
  }
  return out + `<rect x="0" y="${y - 1.5}" width="${w}" height="3"/></g>`;
}

// lavoura em perspectiva: linhas de plantas que crescem em direção ao observador
function crop(o, p, H0) {
  const { w, h } = o;
  const vx = o.vx ?? w * 0.5;
  const type = o.field || 'soy';
  const r = rng((o.seed || 1) + 33);
  const nRows = type === 'pasture' ? 0 : 70;
  let out = '';
  const lit = p.light === 'left' ? -1 : p.light === 'right' ? 1 : 0;
  for (let i = 0; i < nRows; i++) {
    const bx = vx + (i - nRows / 2) * (w / 9);
    // sulco
    out += `<line x1="${vx}" y1="${H0}" x2="${f(bx)}" y2="${h}" stroke="${p.plantD}" stroke-width="1" opacity=".55"/>`;
    for (let t = 0.05; t < 1.08; t *= 1.13) {
      const x = vx + (bx - vx) * t, y = H0 + (h - H0) * t;
      if (x < -20 || x > w + 20) continue;
      const s = 0.4 + t * (type === 'wheat' ? 9 : 11);
      if (type === 'wheat') {
        out += `<path d="M${f(x - s * 0.5)} ${f(y)} q${f(s * 0.2)} ${f(-s * 1.6)} ${f(s * 0.5)} ${f(-s * 2.2)} q${f(s * 0.3)} ${f(s * 0.6)} ${f(s * 0.5)} ${f(s * 2.2)} z" fill="${r() > 0.5 ? p.plantL : mix(p.plantL, p.plantD, 0.45)}"/>`;
      } else if (type === 'dry') {
        if (r() > 0.55) out += `<path d="M${f(x)} ${f(y)} l${f(-s * 0.6)} ${f(-s * 0.9)} M${f(x)} ${f(y)} l${f(s * 0.5)} ${f(-s * 1.1)} M${f(x)} ${f(y)} l0 ${f(-s * 1.3)}" stroke="${p.plantD}" stroke-width="${f(Math.max(0.5, s * 0.12))}"/>`;
      } else {
        const hx = x + lit * s * 0.25;
        out += `<ellipse cx="${f(x)}" cy="${f(y - s * 0.45)}" rx="${f(s * 0.85)}" ry="${f(s * 0.55)}" fill="${p.plantD}"/>`;
        out += `<ellipse cx="${f(hx)}" cy="${f(y - s * 0.62)}" rx="${f(s * 0.5)}" ry="${f(s * 0.32)}" fill="${p.plantL}" opacity="${f(0.55 + r() * 0.35)}"/>`;
      }
    }
  }
  if (type === 'pasture') {
    for (let i = 0; i < 900; i++) {
      const t = Math.pow(r(), 0.7), x = r() * w, y = H0 + (h - H0) * t, s = 0.5 + t * 6;
      out += `<path d="M${f(x)} ${f(y)} l${f(-s * 0.3)} ${f(-s)} M${f(x)} ${f(y)} l${f(s * 0.35)} ${f(-s * 0.9)}" stroke="${r() > 0.4 ? p.plantL : p.plantD}" stroke-width="${f(0.4 + t)}" opacity=".8"/>`;
    }
  }
  if (type === 'dry') {
    // rachaduras do solo seco
    for (let i = 0; i < 40; i++) {
      const t = 0.35 + r() * 0.65, x = r() * w, y = H0 + (h - H0) * t, s = t * 40;
      out += `<path d="M${f(x)} ${f(y)} l${f(s * (r() - 0.5))} ${f(s * 0.12 * r())} l${f(s * (r() - 0.5))} ${f(s * 0.15 * (r() - 0.5))} l${f(s * (r() - 0.5))} ${f(s * 0.1)}" stroke="${p.soilD}" stroke-width="${f(0.6 + t * 1.2)}" fill="none" opacity=".7"/>`;
    }
  }
  return out;
}

// estrada de terra vermelha
function road(o, p, H0, ids) {
  const { w, h } = o;
  const x0 = o.road.x0 ?? w * 0.55, x1 = o.road.x1 ?? w * 0.35, bend = o.road.bend ?? -80;
  const wTop = 3, wBot = o.road.width ?? 150;
  const cx = (x0 + x1) / 2 + bend, cy = (H0 + h) / 2;
  const L = `M${x0 - wTop} ${H0} Q${cx - wBot * 0.35} ${cy} ${x1 - wBot / 2} ${h + 2}`;
  const R = `L${x1 + wBot / 2} ${h + 2} Q${cx + wBot * 0.35} ${cy} ${x0 + wTop} ${H0} Z`;
  const track = (k) => `<path d="M${x0 + k * wTop * 0.4} ${H0} Q${cx + k * wBot * 0.12} ${cy} ${x1 + k * wBot * 0.25} ${h}" stroke="${p.soilD}" stroke-width="${f(wBot / 22)}" fill="none" opacity=".35"/>`;
  return `<path d="${L} ${R}" fill="url(#${ids.road})"/>${track(-1)}${track(1)}
    <path d="M${x0} ${H0} Q${cx} ${cy} ${x1} ${h}" stroke="${p.plantD}" stroke-width="${f(wBot / 30)}" fill="none" opacity=".35" stroke-dasharray="3 5"/>`;
}

function rays(cx, cy, w, h, color) {
  let out = `<g opacity=".14" fill="${color}">`;
  for (let i = 0; i < 9; i++) {
    const a = (-80 + i * 20) * (Math.PI / 180), a2 = a + 0.06;
    const R = Math.max(w, h) * 1.4;
    out += `<path d="M${cx} ${cy} L${f(cx + Math.sin(a) * R)} ${f(cy - Math.cos(a) * R)} L${f(cx + Math.sin(a2) * R)} ${f(cy - Math.cos(a2) * R)} Z"/>`;
  }
  return out + '</g>';
}

function poles(w, H0, h, seed, color, side = 'right') {
  // fileira de postes de madeira recuando para o horizonte
  const r = rng(seed);
  let out = `<g stroke="${color}" fill="none">`;
  const n = 7;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = Math.pow(0.62, i);
    const x = side === 'right' ? w * 0.5 + w * 0.48 * t : w * 0.5 - w * 0.48 * t;
    const y = H0 + (h - H0) * t * 0.92;
    const ph = 6 + t * 150;
    pts.push([x, y - ph]);
    out += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y - ph)}" stroke-width="${f(0.6 + t * 4)}"/><line x1="${f(x - ph * 0.12)}" y1="${f(y - ph * 0.94)}" x2="${f(x + ph * 0.12)}" y2="${f(y - ph * 0.94)}" stroke-width="${f(0.5 + t * 2.4)}"/>`;
  }
  for (let i = 0; i < n - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    out += `<path d="M${f(ax)} ${f(ay + 3)} Q${f((ax + bx) / 2)} ${f((ay + by) / 2 + 10 * Math.pow(0.62, i))} ${f(bx)} ${f(by + 1)}" stroke-width=".7" opacity=".8"/>`;
  }
  void r;
  return out + '</g>';
}

// ---------- máquinas e animais (com cor própria, não só silhueta) ----------
function combine(x, y, s, c = {}) {
  const body = c.body || '#3f7d33', dark = c.dark || '#24501f', acc = c.acc || '#e2b53a', glass = c.glass || '#9cc6d6', tire = c.tire || '#16140f';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-8" y="-17" width="72" height="13" rx="2" fill="${acc}"/><rect x="-8" y="-8" width="72" height="4" fill="${dark}" opacity=".5"/>
    <g stroke="${dark}" stroke-width="1.5">${[0, 12, 24, 36, 48].map((k) => `<line x1="${k}" y1="-17" x2="${k + 4}" y2="-28"/>`).join('')}</g>
    <rect x="-6" y="-30" width="68" height="3" rx="1.5" fill="${acc}"/>
    <path d="M42 -48 L112 -48 L116 -14 L42 -14 Z" fill="${body}"/><rect x="42" y="-26" width="74" height="12" fill="${dark}" opacity=".45"/>
    <path d="M60 -76 L100 -76 L104 -48 L58 -48 Z" fill="${body}"/><rect x="60" y="-76" width="42" height="5" fill="${dark}" opacity=".4"/>
    <path d="M44 -48 L46 -72 L64 -72 L64 -48 Z" fill="${body}"/><path d="M48 -69 L62 -69 L62 -52 L47 -52 Z" fill="${glass}"/><path d="M48 -69 L55 -69 L49 -52 L47 -52 Z" fill="#fff" opacity=".45"/>
    <path d="M98 -72 L150 -90 L153 -85 L101 -66 Z" fill="${body}"/>
    <rect x="112" y="-34" width="18" height="18" rx="2" fill="${dark}"/>
    <circle cx="68" cy="-11" r="17" fill="${tire}"/><circle cx="68" cy="-11" r="8" fill="${acc}"/><circle cx="68" cy="-11" r="3" fill="${tire}"/>
    <circle cx="120" cy="-8" r="10" fill="${tire}"/><circle cx="120" cy="-8" r="4.5" fill="${acc}"/>
  </g>`;
}

function tractor(x, y, s, c = {}) {
  const body = c.body || '#b8352a', dark = c.dark || '#7a2018', glass = c.glass || '#a9cfdc', tire = c.tire || '#16140f', rim = c.rim || '#e9c34d';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -32 L40 -34 L44 -14 L0 -14 Z" fill="${body}"/><rect x="0" y="-22" width="44" height="8" fill="${dark}" opacity=".5"/>
    <rect x="12" y="-48" width="3.5" height="16" fill="#333"/>
    <path d="M34 -64 L64 -64 L66 -30 L34 -30 Z" fill="${dark}"/><path d="M37 -60 L62 -60 L62 -40 L37 -40 Z" fill="${glass}"/><path d="M37 -60 L46 -60 L39 -40 L37 -40 Z" fill="#fff" opacity=".45"/>
    <rect x="32" y="-66" width="36" height="4" rx="1" fill="${body}"/>
    <circle cx="54" cy="-20" r="21" fill="${tire}"/><circle cx="54" cy="-20" r="10" fill="${rim}"/><circle cx="54" cy="-20" r="3.5" fill="${tire}"/>
    <circle cx="10" cy="-11" r="11" fill="${tire}"/><circle cx="10" cy="-11" r="5" fill="${rim}"/>
  </g>`;
}

function truck(x, y, s, c = {}) {
  const cab = c.cab || '#d8d4c8', box = c.box || '#3e5f3a', tire = '#16140f', glass = '#9ec3d0';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="34" y="-40" width="120" height="28" fill="${box}"/><g stroke="#000" opacity=".18">${[0, 1, 2, 3, 4, 5].map((k) => `<line x1="${34 + k * 20}" y1="-40" x2="${34 + k * 20}" y2="-12"/>`).join('')}</g>
    <path d="M0 -12 L0 -36 Q2 -44 12 -46 L30 -46 L32 -12 Z" fill="${cab}"/><path d="M6 -40 L26 -40 L26 -28 L4 -28 Z" fill="${glass}"/>
    <rect x="0" y="-16" width="154" height="5" fill="#2a2a26"/>
    ${[16, 104, 122, 140].map((cx) => `<circle cx="${cx}" cy="-8" r="8" fill="${tire}"/><circle cx="${cx}" cy="-8" r="3" fill="#9a9a90"/>`).join('')}
  </g>`;
}

function silos(x, y, s, c = {}) {
  const m = c.metal || '#c9cdcc', d = c.dark || '#8d9392', l = c.light || '#f2f3ef';
  const one = (dx, w, h) => {
    const gid = nid('sg');
    return `<defs><linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="${d}"/><stop offset=".35" stop-color="${l}"/><stop offset=".7" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
    <rect x="${dx}" y="${-h}" width="${w}" height="${h}" fill="url(#${gid})"/>
    <g stroke="${d}" stroke-width=".6" opacity=".6">${Array.from({ length: Math.floor(h / 7) }, (_, k) => `<line x1="${dx}" y1="${-h + 7 * k}" x2="${dx + w}" y2="${-h + 7 * k}"/>`).join('')}</g>
    <path d="M${dx - 1} ${-h} Q${dx + w / 2} ${-h - w * 0.5} ${dx + w + 1} ${-h} Z" fill="${m}"/>`;
  };
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${one(0, 28, 72)}${one(32, 28, 72)}${one(64, 22, 54)}
    <rect x="22" y="-108" width="5" height="36" fill="${d}"/><path d="M24 -106 L94 -62 L96 -65 L26 -109 Z" fill="${d}"/>
    <rect x="92" y="-36" width="48" height="36" fill="${c.shed || '#b9a77f'}"/><path d="M90 -36 L116 -52 L142 -36 Z" fill="${c.roof || '#8b3b26'}"/>
  </g>`;
}

function farmhouse(x, y, s, c = {}) {
  const wall = c.wall || '#f1ebde', roof = c.roof || '#a8452a', trim = c.trim || '#2e4a6b';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="0" y="-30" width="96" height="30" fill="${wall}"/><rect x="0" y="-8" width="96" height="8" fill="#000" opacity=".08"/>
    <path d="M-8 -28 L48 -52 L104 -28 Z" fill="${roof}"/><path d="M-8 -28 L104 -28 L104 -25 L-8 -25 Z" fill="#000" opacity=".2"/>
    <rect x="-6" y="-26" width="108" height="3" fill="${mix(roof, '#000000', 0.3)}"/>
    ${[10, 34, 62, 80].map((wx) => `<rect x="${wx}" y="-20" width="9" height="11" fill="${trim}"/>`).join('')}
    <rect x="45" y="-22" width="10" height="22" fill="${trim}"/>
    ${[0, 24, 48, 72, 96].map((px) => `<rect x="${px - 1}" y="-26" width="2" height="26" fill="#fff"/>`).join('')}
  </g>`;
}

// ipê-amarelo florido
function ipe(x, y, s, seed, c = {}) {
  const r = rng(seed);
  const trunk = c.trunk || '#4a3826', fl = c.flower || '#f2c230', fl2 = c.flower2 || '#d99a1c';
  let out = `<g transform="translate(${x} ${y}) scale(${s})">`;
  out += `<path d="M-3 0 Q-1 -30 -2 -48 Q-14 -64 -26 -72 M-2 -48 Q8 -66 22 -76 M-2 -48 Q-2 -70 2 -86" stroke="${trunk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  out += `<path d="M-4 0 L3 0 L1 -46 L-3 -46 Z" fill="${trunk}"/>`;
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const cx = Math.cos(a) * 46 * d, cy = -78 + Math.sin(a) * 26 * d;
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(4 + r() * 6)}" fill="${r() > 0.35 ? fl : fl2}" opacity=".95"/>`;
  }
  return out + '</g>';
}

// nelore (branco/cinza, com cupim)
function cow(x, y, s, c = {}, flip = false) {
  const b = c.body || '#ece7dc', sh = c.shade || '#b9b1a1', dk = c.dark || '#3a342c';
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M0 -26 Q-2 -40 12 -42 L22 -44 Q26 -54 34 -50 L38 -44 L58 -44 Q66 -44 68 -36 L70 -24 Q70 -18 64 -18 L10 -18 Q2 -18 0 -26 Z" fill="${b}"/>
    <path d="M4 -26 Q30 -16 66 -24 L64 -18 L10 -18 Q2 -18 4 -26 Z" fill="${sh}"/>
    <path d="M60 -46 Q68 -46 70 -40 L84 -28 Q88 -22 82 -20 L74 -23 L64 -30 Z" fill="${b}"/>
    <path d="M80 -24 Q88 -22 82 -20 L76 -22 Z" fill="${dk}"/>
    <path d="M68 -44 L66 -50 L71 -45 Z M72 -42 L78 -44 L73 -39 Z" fill="${sh}"/>
    <path d="M30 -42 Q34 -30 36 -18 L40 -18 Q40 -32 38 -44 Z" fill="${sh}" opacity=".6"/>
    ${[6, 16, 52, 60].map((lx) => `<rect x="${lx}" y="-20" width="4.2" height="20" fill="${sh}"/><rect x="${lx}" y="-3" width="4.2" height="3" fill="${dk}"/>`).join('')}
    <path d="M0 -34 Q-6 -24 -4 -8" stroke="${sh}" stroke-width="2" fill="none"/><circle cx="-4" cy="-7" r="2" fill="${dk}"/>
  </g>`;
}

function pivot(x, y, s, color) {
  let out = `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="1.6">`;
  out += `<path d="M0 -26 L300 -22"/>`;
  for (let i = 0; i < 6; i++) {
    const px = i * 60;
    out += `<path d="M${px - 8} 0 L${px} -26 L${px + 8} 0"/><path d="M${px} -26 Q${px + 30} -38 ${px + 60} -25"/>`;
  }
  return out + `</g>`;
}

function fence(w, y, color, step = 36, s = 1) {
  let out = `<g stroke="${color}" stroke-width="${2.4 * s}">`;
  for (let x = 0; x < w + step; x += step) out += `<line x1="${x}" y1="${y}" x2="${x + 1}" y2="${y - 24 * s}"/>`;
  return out + `<g stroke-width="${0.8 * s}">${[17, 10, 4].map((k) => `<line x1="0" y1="${y - k * s}" x2="${w}" y2="${y - k * s}"/>`).join('')}</g></g>`;
}

function dust(x, y, s, color, ids) {
  return `<g filter="url(#${ids.blur})" fill="${color}" opacity=".55"><ellipse cx="${x}" cy="${y}" rx="${60 * s}" ry="${16 * s}"/><ellipse cx="${x + 40 * s}" cy="${y - 10 * s}" rx="${40 * s}" ry="${18 * s}"/><ellipse cx="${x + 90 * s}" cy="${y - 4 * s}" rx="${50 * s}" ry="${12 * s}"/></g>`;
}

function birds(x, y, s, color) {
  const b = (dx, dy, k) => `<path d="M${x + dx} ${y + dy} q${4 * k} ${-4 * k} ${8 * k} 0 q${4 * k} ${-4 * k} ${8 * k} 0" fill="none" stroke="${color}" stroke-width="${1.2 * k}" stroke-linecap="round"/>`;
  return b(0, 0, s) + b(22 * s, -10 * s, s * 0.8) + b(40 * s, 6 * s, s * 0.7) + b(14 * s, 18 * s, s * 0.6) + b(58 * s, -4 * s, s * 0.5);
}

function foregroundGrass(w, h, seed, color, n = 60, hMax = 70) {
  const r = rng(seed + 5);
  let out = `<g stroke="${color}" fill="none" stroke-linecap="round">`;
  for (let i = 0; i < n; i++) {
    const x = r() * w, hh = 15 + r() * hMax, lean = (r() - 0.5) * 30;
    out += `<path d="M${f(x)} ${h + 2} q${f(lean * 0.3)} ${f(-hh * 0.6)} ${f(lean)} ${f(-hh)}" stroke-width="${f(1 + r() * 1.6)}"/>`;
    if (r() > 0.6) {
      // espiga de capim
      out += `<ellipse cx="${f(x + lean)}" cy="${f(h - hh - 4)}" rx="1.6" ry="6" fill="${color}" transform="rotate(${f(lean)} ${f(x + lean)} ${f(h - hh)})"/>`;
    }
  }
  return out + '</g>';
}

/**
 * Cena completa.
 * o: { w, h, horizon, time, field, vx, seed, clouds, road:{x0,x1,bend,width}, sun:[x,y,r],
 *      back:[], props:(ctx)=>[], fg:{n,max}, grain, mistAmt, poles:'left'|'right' }
 */
function scene(o) {
  const p = Object.assign({}, PAL[o.time || 'day'], o.palette || {});
  const ids = { sky: nid('sk'), glow: nid('gl'), field: nid('fd'), road: nid('rd'), hazeG: nid('hz'), blur: nid('bl'), soft: nid('sf'), grain: nid('gr') };
  const H0 = o.horizon, { w, h } = o;
  const ctx = { p, ids, H0, w, h, mix, dust: (x, y, s, c) => dust(x, y, s, c || mix(p.soil, p.haze, 0.5), ids) };
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${o.par || 'xMidYMid slice'}">${defs(o, ids, p)}`;
  svg += `<rect width="${w}" height="${H0 + 4}" fill="url(#${ids.sky})"/>`;
  if (o.sun) {
    const [sx, sy, sr] = o.sun;
    svg += `<circle cx="${sx}" cy="${sy}" r="${sr * 6}" fill="url(#${ids.glow})"/>`;
    if (o.rays) svg += rays(sx, sy, w, h, p.sun);
    svg += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${p.sun}"/>`;
  }
  if (o.clouds) svg += clouds(w, H0, o.clouds, o.seed || 1, p, ids);
  if (o.birds) svg += birds(o.birds[0], o.birds[1], o.birds[2] || 1, mix(p.tree, p.sky[1], 0.2));
  // 3 camadas de relevo com névoa atmosférica
  svg += ridge(w, H0 - 2, 34, (o.seed || 1) + 1, mix(p.ridge, p.haze, 0.72));
  svg += ridge(w, H0, 22, (o.seed || 1) + 2, mix(p.ridge, p.haze, 0.45));
  svg += trees(w, H0 - 1, (o.seed || 1) + 3, mix(p.tree, p.haze, 0.35), 0.7, 0.8);
  svg += ridge(w, H0 + 2, 10, (o.seed || 1) + 4, mix(p.ridge, p.haze, 0.15));
  svg += trees(w, H0 + 3, (o.seed || 1) + 5, p.tree, 1, 1);
  svg += (o.back || []).map((b) => (typeof b === 'function' ? b(ctx) : b)).join('');
  svg += `<rect x="0" y="${H0 + 2}" width="${w}" height="${h - H0}" fill="url(#${ids.field})"/>`;
  svg += crop(o, p, H0 + 3);
  if (o.road) svg += road(o, p, H0 + 3, ids);
  svg += `<rect x="0" y="${H0 - 30}" width="${w}" height="60" fill="url(#${ids.hazeG})"/>`;
  if (o.poles) svg += poles(w, H0 + 3, h, o.seed || 1, mix(p.tree, '#000000', 0.2), o.poles);
  svg += (o.props ? o.props(ctx) : []).join('');
  if (o.fg) svg += foregroundGrass(w, h, o.seed || 1, o.fg.color || mix(p.plantD, '#000000', 0.3), o.fg.n, o.fg.max);
  if (o.vignette !== false) {
    const vg = nid('vg');
    svg += `<defs><radialGradient id="${vg}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${o.vignette ?? 0.35}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${vg})"/>`;
  }
  if (o.grain !== false) svg += `<rect width="${w}" height="${h}" filter="url(#${ids.grain})" opacity="${o.grain ?? 0.22}"/>`;
  return svg + '</svg>';
}

module.exports = { scene, combine, tractor, truck, silos, farmhouse, ipe, cow, pivot, fence, birds, mix, rng };
