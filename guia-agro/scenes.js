// Ilustrações vetoriais do agro (SVG) usadas como fundo nas páginas do guia.
let uid = 0;
const id = (p) => `${p}${++uid}`;

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function hills(w, base, amp, seed, fill, opacity = 1) {
  const r = rng(seed);
  let d = `M0 ${base}`;
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const x = (w / n) * i;
    const y = base - amp * (0.4 + r() * 0.6);
    const cx = x - w / n / 2;
    d += ` Q${cx} ${y - amp * 0.3} ${x} ${y}`;
  }
  d += ` L${w} ${base + 400} L0 ${base + 400} Z`;
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

function treeline(w, y, seed, fill) {
  const r = rng(seed);
  let out = '';
  let x = 0;
  while (x < w) {
    const rad = 3 + r() * 7;
    if (r() > 0.25) out += `<circle cx="${x}" cy="${y - rad * 0.6}" r="${rad}" fill="${fill}"/>`;
    x += rad * 1.4 + r() * 6;
  }
  return out + `<rect x="0" y="${y - 2}" width="${w}" height="6" fill="${fill}"/>`;
}

function rows(w, h, horizon, vx, color, opacity, n = 40) {
  let out = '';
  for (let i = -n; i <= n * 2; i++) {
    const bx = (w / n) * i * 1.6 - w * 0.3;
    out += `<line x1="${vx}" y1="${horizon}" x2="${bx}" y2="${h}" stroke="${color}" stroke-width="1.2" opacity="${opacity}"/>`;
  }
  return out;
}

function sun(cx, cy, r, gid) {
  return `
  <defs><radialGradient id="${gid}"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".95"/>
  <stop offset=".35" stop-color="#f0b44c" stop-opacity=".55"/><stop offset="1" stop-color="#e09a35" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${cx}" cy="${cy}" r="${r * 4}" fill="url(#${gid})"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd98a"/>`;
}

function birds(x, y, s, fill) {
  const b = (dx, dy, k) =>
    `<path d="M${x + dx} ${y + dy} q${4 * k} ${-4 * k} ${8 * k} 0 q${4 * k} ${-4 * k} ${8 * k} 0" fill="none" stroke="${fill}" stroke-width="${1.4 * k}" stroke-linecap="round"/>`;
  return b(0, 0, s) + b(22 * s, -10 * s, s * 0.8) + b(40 * s, 6 * s, s * 0.7) + b(14 * s, 18 * s, s * 0.6);
}

// Colheitadeira — origem: ponto no chão, à frente (esquerda)
function combine(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <rect x="0" y="-16" width="62" height="12" rx="2"/>
    <rect x="4" y="-30" width="54" height="14" rx="6" opacity=".9"/>
    <rect x="40" y="-46" width="70" height="38" rx="3"/>
    <rect x="58" y="-74" width="40" height="28" rx="3"/>
    <path d="M44 -46 L44 -70 L62 -70 L62 -46 Z"/>
    <rect x="47" y="-66" width="12" height="14" fill="#f2c46b" opacity=".55"/>
    <path d="M96 -70 L150 -88 L152 -84 L100 -64 Z"/>
    <rect x="108" y="-36" width="22" height="22" rx="2"/>
    <circle cx="66" cy="-10" r="17"/><circle cx="66" cy="-10" r="7" fill="#f2c46b" opacity=".25"/>
    <circle cx="118" cy="-8" r="10"/>
  </g>`;
}

function tractor(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <rect x="0" y="-30" width="54" height="16" rx="4"/>
    <rect x="34" y="-62" width="30" height="34" rx="3"/>
    <rect x="38" y="-58" width="22" height="18" fill="#f2c46b" opacity=".45"/>
    <rect x="12" y="-46" width="4" height="18"/>
    <circle cx="52" cy="-20" r="20"/><circle cx="52" cy="-20" r="8" fill="#f2c46b" opacity=".25"/>
    <circle cx="10" cy="-11" r="11"/>
  </g>`;
}

function silos(x, y, s, fill) {
  const one = (dx, w, h) =>
    `<rect x="${dx}" y="${-h}" width="${w}" height="${h}"/><path d="M${dx} ${-h} Q${dx + w / 2} ${-h - w * 0.45} ${dx + w} ${-h} Z"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    ${one(0, 26, 70)}${one(30, 26, 70)}${one(60, 20, 52)}
    <rect x="20" y="-104" width="6" height="34"/><path d="M23 -104 L90 -60 L92 -63 L25 -107 Z"/>
    <rect x="86" y="-34" width="44" height="34"/><path d="M84 -34 L108 -50 L132 -34 Z"/>
  </g>`;
}

function barn(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <path d="M0 0 L0 -34 L10 -50 L40 -58 L70 -50 L80 -34 L80 0 Z"/>
    <path d="M30 0 L30 -24 L50 -24 L50 0 Z" fill="#f2c46b" opacity=".2"/>
  </g>`;
}

// Gado nelore (com cupim)
function cow(x, y, s, fill, flip = false) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})" fill="${fill}">
    <path d="M0 -26 Q-2 -40 12 -42 L22 -44 Q26 -54 34 -50 L38 -44 L58 -44 Q66 -44 68 -36 L70 -24 Q70 -18 64 -18 L10 -18 Q2 -18 0 -26 Z"/>
    <path d="M30 -46 Q36 -52 40 -44 L64 -46 Q72 -45 72 -38 L82 -28 Q86 -22 80 -20 L74 -24 L66 -30 Z"/>
    <rect x="6" y="-20" width="4" height="20"/><rect x="16" y="-20" width="4" height="20"/>
    <rect x="52" y="-20" width="4" height="20"/><rect x="60" y="-20" width="4" height="20"/>
    <path d="M0 -34 Q-6 -24 -4 -10" stroke="${fill}" stroke-width="2" fill="none"/>
    <path d="M72 -40 L70 -48 L74 -42 Z"/>
  </g>`;
}

function pivot(x, y, s, fill) {
  let out = `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${fill}" stroke-width="2">`;
  out += `<path d="M0 -26 L300 -22"/>`;
  for (let i = 0; i < 6; i++) {
    const px = i * 60;
    out += `<path d="M${px - 10} 0 L${px} -26 L${px + 10} 0"/><path d="M${px} -26 Q${px + 30} -40 ${px + 60} -25"/>`;
  }
  return out + `</g>`;
}

function fence(w, y, fill, step = 36) {
  let out = `<g stroke="${fill}" stroke-width="2.4">`;
  for (let x = 0; x < w; x += step) out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 22}"/>`;
  return out + `<line x1="0" y1="${y - 16}" x2="${w}" y2="${y - 16}" stroke-width="1.2"/><line x1="0" y1="${y - 8}" x2="${w}" y2="${y - 8}" stroke-width="1.2"/></g>`;
}

// Espigas de trigo/capim em primeiro plano
function wheatStalk(x, y, h, lean, s, fill) {
  const tx = x + lean, ty = y - h;
  let out = `<path d="M${x} ${y} Q${x + lean * 0.2} ${y - h * 0.6} ${tx} ${ty}" stroke="${fill}" stroke-width="${1.6 * s}" fill="none"/>`;
  const ang = (Math.atan2(lean, h) * 180) / Math.PI;
  out += `<g transform="translate(${tx} ${ty}) rotate(${ang})">`;
  for (let i = 0; i < 9; i++) {
    const gy = i * 5.2 * s;
    out += `<ellipse cx="${-3 * s}" cy="${gy}" rx="${2.4 * s}" ry="${5 * s}" transform="rotate(-25 ${-3 * s} ${gy})" fill="${fill}"/>`;
    out += `<ellipse cx="${3 * s}" cy="${gy + 2.6 * s}" rx="${2.4 * s}" ry="${5 * s}" transform="rotate(25 ${3 * s} ${gy + 2.6 * s})" fill="${fill}"/>`;
  }
  out += `<line x1="0" y1="${-2 * s}" x2="${-2 * s}" y2="${-18 * s}" stroke="${fill}" stroke-width="${0.6 * s}"/>`;
  return out + `</g>`;
}

function wheatField(w, y, seed, fill, density = 26, hMin = 60, hMax = 140, s = 1.2) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < density; i++) {
    const x = r() * w;
    out += wheatStalk(x, y + 10, hMin + r() * (hMax - hMin), (r() - 0.5) * 40, s * (0.8 + r() * 0.5), fill);
  }
  return out;
}

// Folha de soja (trifólio) para padrões
function soyLeaf(x, y, s, rot, fill, op = 1) {
  const leaf = (r) =>
    `<path d="M0 0 C 10 -8 12 -30 0 -42 C -12 -30 -10 -8 0 0 Z" transform="rotate(${r})"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" opacity="${op}">
    ${leaf(0)}${leaf(-70)}${leaf(70)}<rect x="-1" y="0" width="2" height="22"/></g>`;
}

/* Cena completa de paisagem. opts: w,h,horizon,sunX,sunY,sunR,palette,props(fn list) */
function landscape(o) {
  const { w, h, horizon } = o;
  const sky = id('sky'), fld = id('fld'), sg = id('sun'), fade = id('fade');
  const p = Object.assign(
    { sky1: '#0c1d14', sky2: '#2b3a1f', sky3: '#c98a34', far: '#2a4429', mid: '#1b3322', near: '#11241a', field1: '#1f3a22', field2: '#0b1a12', rows: '#d9a64a' },
    o.palette || {}
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${o.par || 'xMidYMax slice'}" class="${o.cls || ''}">
  <defs>
    <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.sky1}"/><stop offset="${o.skyMid ?? 0.55}" stop-color="${p.sky2}"/><stop offset="1" stop-color="${p.sky3}"/></linearGradient>
    <linearGradient id="${fld}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.field1}"/><stop offset="1" stop-color="${p.field2}"/></linearGradient>
    <linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.sky1}" stop-opacity="${o.topFade ?? 0.85}"/><stop offset=".45" stop-color="${p.sky1}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${w}" height="${horizon + 2}" fill="url(#${sky})"/>
  ${o.sunX != null ? sun(o.sunX, o.sunY ?? horizon - 10, o.sunR || 26, sg) : ''}
  ${o.birds ? birds(o.birds[0], o.birds[1], o.birds[2] || 1, '#0c1d14') : ''}
  ${hills(w, horizon - 4, 26, o.seed || 3, p.far, 0.9)}
  ${treeline(w, horizon + 2, (o.seed || 3) + 7, p.mid)}
  ${(o.back || []).join('')}
  <rect x="0" y="${horizon + 2}" width="${w}" height="${h - horizon}" fill="url(#${fld})"/>
  ${rows(w, h, horizon + 2, o.vx ?? w * 0.62, p.rows, o.rowOp ?? 0.22)}
  ${(o.props || []).join('')}
  ${o.wheat ? wheatField(w, h, (o.seed || 3) + 11, p.near, o.wheat.n, o.wheat.min, o.wheat.max, o.wheat.s) : ''}
  ${o.topFade !== 0 ? `<rect width="${w}" height="${h}" fill="url(#${fade})"/>` : ''}
</svg>`;
}

module.exports = { landscape, combine, tractor, silos, barn, cow, pivot, fence, wheatField, wheatStalk, soyLeaf, birds };
