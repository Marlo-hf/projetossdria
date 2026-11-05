// Gera os estáticos "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)
// Uso:  node build.js   → gera png/*.png (e html/*.html para conferência)
// Edite o bloco CONFIG (nome do escritório, OAB, textos) e rode de novo.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIG = {
  escritorio: 'Nome do Escritório Advocacia',
  oab: 'OAB/UF 00.000',
  apoio: 'O banco pode ser responsabilizado pela falha de segurança que permitiu o golpe.',
  cta: 'Fale com um advogado especialista',
  disclaimer: 'Conteúdo informativo. Sem vínculo com as instituições citadas; marcas pertencentes aos seus titulares.',
  pix: { titulo: 'PIX enviado', valor: 'R$ 23.480,00', quem: 'Destinatário desconhecido' },
};

const FORMATOS = [
  { id: 'feed', w: 1080, h: 1350 },
  { id: 'stories', w: 1080, h: 1920 }, // conteúdo dentro das zonas seguras (250 px topo / ~300 px base)
];

const ROOT = __dirname;
const A = (p) => 'file://' + path.join(ROOT, 'assets', p);
const LOGO = {
  santander: A('logos/santander.svg'),
  santanderBranco: A('logos/santander-branco.svg'),
  itau: A('logos/itau.svg'),
  itauSolido: A('logos/itau-solido.svg'),
  itauBranco: A('logos/itau-branco.svg'),
};
const PESSOA = A('foto/pessoa.png');

const fonte = (fam, arq, w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${A('fonts/' + arq)}') format('woff2')}`;
const BASE_CSS = `
${fonte('Anton', 'anton-latin-400-normal.woff2', 400)}
${fonte('Archivo Black', 'archivo-black-latin-400-normal.woff2', 400)}
${[600, 700, 800, 900].map((w) => fonte('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)).join('\n')}
${[400, 500, 600, 700].map((w) => fonte('Inter', `inter-latin-${w}-normal.woff2`, w)).join('\n')}
:root{--red:#EC0000;--orange:#FF6200;--yellow:#FFD000;--ink:#0b0f19;--pix:#32BCAD}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;background:#000}
.cv{position:relative;overflow:hidden}
.abs{position:absolute}
.hl{font-family:'Anton',sans-serif;text-transform:uppercase;line-height:.94;letter-spacing:.005em}
.mark{display:inline-block;background:var(--yellow);color:var(--ink);padding:.04em .16em .0em;transform:rotate(-2deg);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.pessoa{position:absolute;filter:drop-shadow(0 30px 50px rgba(0,0,0,.55))}
.btn{display:inline-flex;align-items:center;gap:18px;font-family:'Montserrat';font-weight:900;text-transform:uppercase;letter-spacing:.01em;border-radius:18px}
.btn svg{flex:none}
.foot{font-size:18px;line-height:1.35}
.foot b{font-family:'Montserrat';font-weight:800;font-size:22px;display:block}
.foot small{display:block;font-size:15px;opacity:.72;margin-top:4px}
.notif{position:absolute;background:#fff;border-radius:26px;display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;
  box-shadow:0 24px 60px rgba(0,0,0,.45);color:var(--ink)}
.notif .ic{border-radius:16px;background:var(--ink);display:flex;align-items:center;justify-content:center}
.notif .t{font-size:.62em;color:#5d6678;font-weight:600}
.notif .v{font-family:'Montserrat';font-weight:900;color:#d40f14;letter-spacing:-.01em;line-height:1.05}
.notif .q{font-size:.62em;font-weight:700;color:var(--ink)}
.sticker{position:absolute;border-radius:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 26px 60px rgba(0,0,0,.45)}
`;

const seta = (s = 34) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const alerta = (s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`;
const icoPix = (s) => `<svg width="${s * 0.6}" height="${s * 0.6}" viewBox="0 0 48 48"><rect x="11" y="11" width="26" height="26" rx="6" transform="rotate(45 24 24)" fill="none" stroke="#32BCAD" stroke-width="5"/><circle cx="24" cy="24" r="4" fill="#32BCAD"/></svg>`;

const notif = ({ x, y, fs, rot = -4, ic = 84 }) => `
  <div class="notif" style="left:${x}px;top:${y}px;font-size:${fs}px;padding:${fs * 0.6}px ${fs * 0.75}px;transform:rotate(${rot}deg)">
    <div class="ic" style="width:${ic}px;height:${ic}px">${icoPix(ic)}</div>
    <div><div class="t">${CONFIG.pix.titulo} · agora</div><div class="v">− ${CONFIG.pix.valor}</div><div class="q">${CONFIG.pix.quem}</div></div>
  </div>`;

const rodape = (cor) => `<div class="foot" style="color:${cor}"><b>${CONFIG.escritorio} · ${CONFIG.oab}</b><small>${CONFIG.disclaimer}</small></div>`;

// Título em linhas explícitas (sem quebra automática), cada uma com seu tamanho.
const titulo = (st, { cor = '#fff', alinhar = 'left', inverso = false } = {}) => {
  const linhas = st
    ? [['Sofreu um golpe', 134], ['do PIX', 134], ['nesses bancos?', 128, true]]
    : [['Sofreu um golpe do PIX', 96], ['nesses bancos?', 124, true]];
  return `<div class="hl" style="color:${cor};text-align:${alinhar};white-space:nowrap">${linhas
    .map(([t, fs, m]) => m
      ? `<div style="margin-top:${st ? 18 : 12}px"><span class="${inverso ? 'inv' : 'mark'}" style="font-size:${fs}px">${t}</span></div>`
      : `<div style="font-size:${fs}px">${t}</div>`)
    .join('')}</div>`;
};

const blocoBase = (st, { botaoBg, botaoCor, alinhar = 'left' }) => `
  <p style="font-size:${st ? 35 : 31}px;line-height:1.28;font-weight:600;max-width:950px;${alinhar === 'center' ? 'margin:0 auto' : ''}">${CONFIG.apoio}</p>
  <div class="btn" style="margin-top:${st ? 28 : 22}px;background:${botaoBg};color:${botaoCor};font-size:${st ? 31 : 28}px;padding:24px 34px">${CONFIG.cta} ${seta()}</div>
  <div style="margin-top:${st ? 24 : 18}px">${rodape('#fff')}</div>`;

// ---------------------------------------------------------------------------
// 01 · NOTURNO — fundo escuro, logos iluminados atrás da pessoa
// ---------------------------------------------------------------------------
function noturno(f) {
  const st = f.id === 'stories';
  const L = st
    ? { top: 262, pw: 900, pTop: 700, sx: 30, sy: 740, sw: 360, ix: 742, iy: 700, iw: 280, nx: 26, ny: 1090, nfs: 31, fade: 1250, base: 1385 }
    : { top: 58, pw: 760, pTop: 330, sx: 30, sy: 372, sw: 380, ix: 730, iy: 335, iw: 270, nx: 24, ny: 650, nfs: 28, fade: 900, base: 1040 };
  return `
  <style>
    .n1{width:${f.w}px;height:${f.h}px;background:radial-gradient(55% 32% at 18% ${((L.sy + 90) / f.h) * 100}%,rgba(236,0,0,.6),transparent 70%),
      radial-gradient(50% 30% at 82% ${((L.iy + 140) / f.h) * 100}%,rgba(255,98,0,.6),transparent 70%),linear-gradient(180deg,#0d1220,#05070d)}
    .n1 .hl{text-shadow:0 8px 30px rgba(0,0,0,.5)}
    .n1 .fade{position:absolute;left:0;right:0;top:${L.fade}px;bottom:0;background:linear-gradient(180deg,rgba(5,7,13,0),rgba(5,7,13,.93) 36%,#05070d 66%)}
  </style>
  <div class="cv n1">
    <div class="sticker" style="left:${L.sx}px;top:${L.sy}px;width:${L.sw}px;height:${L.sw * 0.5}px;background:var(--red);transform:rotate(-8deg);box-shadow:0 0 110px rgba(236,0,0,.6),0 26px 60px rgba(0,0,0,.5)">
      <img src="${LOGO.santanderBranco}" style="width:${L.sw * 0.8}px">
    </div>
    <img class="abs" src="${LOGO.itauSolido}" style="left:${L.ix}px;top:${L.iy}px;width:${L.iw}px;transform:rotate(8deg);filter:drop-shadow(0 0 70px rgba(255,98,0,.7)) drop-shadow(0 26px 40px rgba(0,0,0,.5))">
    <img class="pessoa" src="${PESSOA}" style="width:${L.pw}px;left:${(f.w - L.pw) / 2}px;top:${L.pTop}px">
    ${notif({ x: L.nx, y: L.ny, fs: L.nfs, ic: L.nfs * 2.6 })}
    <div class="abs" style="left:62px;right:40px;top:${L.top}px">${titulo(st)}</div>
    <div class="fade"></div>
    <div class="abs" style="left:62px;right:62px;top:${L.base}px;color:#fff">${blocoBase(st, { botaoBg: 'var(--yellow)', botaoCor: 'var(--ink)' })}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 02 · ALERTA — fundo amarelo de alerta, logos como adesivos, pessoa à direita
// ---------------------------------------------------------------------------
function alertaAmarelo(f) {
  const st = f.id === 'stories';
  const L = st
    ? { top: 262, pw: 860, pL: 250, pTop: 790, sx: 40, sy: 830, sw: 400, ix: 90, iy: 1060, iw: 250, band: 1400 }
    : { top: 66, pw: 780, pL: 300, pTop: 392, sx: 40, sy: 420, sw: 390, ix: 90, iy: 640, iw: 230, band: 1050 };
  return `
  <style>
    .a2{width:${f.w}px;height:${f.h}px;background:radial-gradient(80% 60% at 70% 55%,#ffe14d,var(--yellow) 60%,#f2b800)}
    .a2 .dots{position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.09) 2px,transparent 2.5px);background-size:22px 22px;
      -webkit-mask-image:linear-gradient(180deg,transparent 25%,#000 65%)}
    .a2 .stripe{position:absolute;left:0;right:0;top:0;height:26px;background:repeating-linear-gradient(-45deg,var(--ink) 0 26px,var(--yellow) 26px 52px)}
    .a2 .inv{display:inline-block;color:#fff;background:var(--ink);padding:.04em .16em 0;transform:rotate(-1.5deg)}
    .a2 .band{position:absolute;left:0;right:0;top:${L.band}px;bottom:0;background:var(--ink);color:#fff;padding:${st ? 40 : 34}px 62px 0}
  </style>
  <div class="cv a2">
    <div class="dots"></div>
    <div class="stripe"></div>
    <div class="abs" style="left:62px;right:40px;top:${L.top}px">
      <div style="display:inline-flex;align-items:center;gap:12px;font-family:'Montserrat';font-weight:900;font-size:${st ? 30 : 26}px;letter-spacing:.16em;color:var(--ink);margin-bottom:${st ? 18 : 12}px">${alerta(st ? 36 : 30)} ALERTA · GOLPE DO PIX</div>
      ${titulo(st, { cor: 'var(--ink)', inverso: true })}
    </div>
    <img class="pessoa" src="${PESSOA}" style="width:${L.pw}px;left:${L.pL}px;top:${L.pTop}px">
    <div class="sticker" style="left:${L.sx}px;top:${L.sy}px;width:${L.sw}px;height:${L.sw * 0.42}px;background:var(--red);border:8px solid #fff;transform:rotate(-7deg)">
      <img src="${LOGO.santanderBranco}" style="width:${L.sw * 0.76}px">
    </div>
    <div class="sticker" style="left:${L.ix}px;top:${L.iy}px;width:${L.iw + 16}px;height:${L.iw + 16}px;background:#fff;border-radius:${L.iw * 0.3}px;transform:rotate(6deg)">
      <img src="${LOGO.itau}" style="width:${L.iw}px">
    </div>
    <div class="band">${blocoBase(st, { botaoBg: 'var(--yellow)', botaoCor: 'var(--ink)' })}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 03 · SPLIT — metade vermelha Santander, metade laranja Itaú, pessoa no centro
// ---------------------------------------------------------------------------
function split(f) {
  const st = f.id === 'stories';
  const L = st
    ? { top: 262, pw: 900, pTop: 720, sc: 225, sy: 800, sw: 330, ic: 860, iy: 720, iw: 250, nx: 640, ny: 1100, nfs: 30, fade: 1250, base: 1385 }
    : { top: 58, pw: 760, pTop: 330, sc: 225, sy: 420, sw: 330, ic: 860, iy: 345, iw: 230, nx: 640, ny: 650, nfs: 27, fade: 900, base: 1040 };
  return `
  <style>
    .s3{width:${f.w}px;height:${f.h}px;background:linear-gradient(100deg,#ff2424 0%,var(--red) 30%,#b80000 49.9%,#e05200 50.1%,var(--orange) 70%,#ff8a3a 100%)}
    .s3 .ray{position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% ${((L.pTop + 250) / f.h) * 100}%,rgba(255,255,255,.07) 0 6deg,transparent 6deg 18deg)}
    .s3 .hl{text-shadow:0 8px 30px rgba(0,0,0,.35)}
    .s3 .fade{position:absolute;left:0;right:0;top:${L.fade}px;bottom:0;background:linear-gradient(180deg,rgba(11,15,25,0),rgba(11,15,25,.92) 36%,var(--ink) 66%)}
  </style>
  <div class="cv s3">
    <div class="ray"></div>
    <img class="abs" src="${LOGO.santanderBranco}" style="left:${L.sc - L.sw / 2}px;top:${L.sy}px;width:${L.sw}px;filter:drop-shadow(0 10px 30px rgba(0,0,0,.3))">
    <img class="abs" src="${LOGO.itauBranco}" style="left:${L.ic - L.iw / 2}px;top:${L.iy}px;width:${L.iw}px;transform:rotate(6deg);filter:drop-shadow(0 18px 40px rgba(0,0,0,.35))">
    <img class="pessoa" src="${PESSOA}" style="width:${L.pw}px;left:${(f.w - L.pw) / 2}px;top:${L.pTop}px">
    ${notif({ x: L.nx, y: L.ny, fs: L.nfs, rot: 4, ic: L.nfs * 2.6 })}
    <div class="abs" style="left:20px;right:20px;top:${L.top}px">${titulo(st, { alinhar: 'center' })}</div>
    <div class="fade"></div>
    <div class="abs" style="left:62px;right:62px;top:${L.base}px;color:#fff;text-align:center">${blocoBase(st, { botaoBg: '#fff', botaoCor: 'var(--ink)', alinhar: 'center' })}</div>
  </div>`;
}

const CONCEITOS = [
  ['01-noturno', noturno],
  ['02-alerta', alertaAmarelo],
  ['03-split', split],
];

(async () => {
  const htmlDir = path.join(ROOT, 'html');
  const pngDir = path.join(ROOT, 'png');
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.rmSync(pngDir, { recursive: true, force: true });
  fs.mkdirSync(pngDir, { recursive: true });
  const browser = await chromium.launch();
  for (const [nome, fn] of CONCEITOS) {
    for (const f of FORMATOS) {
      const arquivo = `${nome}-${f.id}`;
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${arquivo}</title><style>${BASE_CSS}</style></head><body>${fn(f)}</body></html>`;
      const htmlPath = path.join(htmlDir, `${arquivo}.html`);
      fs.writeFileSync(htmlPath, html);
      const page = await browser.newPage({ viewport: { width: f.w, height: f.h } });
      await page.goto('file://' + htmlPath);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(pngDir, `${arquivo}.png`), clip: { x: 0, y: 0, width: f.w, height: f.h } });
      await page.close();
      console.log('ok', arquivo);
    }
  }
  await browser.close();
})();
