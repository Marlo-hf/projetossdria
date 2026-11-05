// Gera os estáticos "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)
// Uso:  node build.js   → gera png/*.png (e html/*.html para conferência)
// Edite o bloco CONFIG (nome do escritório, OAB, textos) e rode de novo.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIG = {
  escritorio: 'Nome do Escritório Advocacia',
  oab: 'OAB/UF 00.000',
  apoio: 'O banco pode ser responsabilizado pela falha de segurança.',
  cta: 'Preencha o formulário',
  ctaSub: 'Leva menos de 1 minuto',
  disclaimer: 'Conteúdo informativo. Sem vínculo com as instituições citadas; marcas pertencentes aos seus titulares.',
  valor: 'R$ 23.480,00',
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

const fonte = (fam, arq, w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${A('fonts/' + arq)}') format('woff2')}`;
const BASE_CSS = `
${fonte('Anton', 'anton-latin-400-normal.woff2', 400)}
${[600, 700, 800, 900].map((w) => fonte('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)).join('\n')}
${[400, 500, 600, 700].map((w) => fonte('Inter', `inter-latin-${w}-normal.woff2`, w)).join('\n')}
:root{--red:#EC0000;--orange:#FF6200;--yellow:#FFD000;--ink:#0b0f19;--pix:#32BCAD;--alert:#E5141B}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;background:#000}
.cv{position:relative;overflow:hidden}
.abs{position:absolute}
.hl{font-family:'Anton',sans-serif;text-transform:uppercase;line-height:.94;letter-spacing:.005em;white-space:nowrap}
.mark{display:inline-block;background:var(--yellow);color:var(--ink);padding:.04em .16em 0;transform:rotate(-2deg);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.inv{display:inline-block;color:#fff;background:var(--ink);padding:.04em .16em 0;transform:rotate(-1.5deg)}
.foot{font-size:18px;line-height:1.35}
.foot b{font-family:'Montserrat';font-weight:800;font-size:22px;display:block}
.foot small{display:block;font-size:15px;opacity:.72;margin-top:4px}
.esc{position:absolute;left:0;top:0;transform-origin:0 0}

/* ---------- botão de formulário ---------- */
.cta{display:flex;align-items:center;gap:22px;border-radius:22px;padding:22px 30px 22px 22px;font-family:'Montserrat';position:relative}
.cta .ico{flex:none;width:74px;height:74px;border-radius:16px;display:flex;align-items:center;justify-content:center}
.cta .tx b{display:block;font-weight:900;text-transform:uppercase;font-size:36px;letter-spacing:.005em;line-height:1}
.cta .tx span{display:block;font-family:'Inter';font-weight:600;font-size:21px;opacity:.75;margin-top:8px}
.cta .seta{margin-left:auto;flex:none}

/* ---------- celular (desenhado em 400x820, escalado) ---------- */
.phone{width:400px;height:820px;border-radius:62px;background:linear-gradient(145deg,#3a3f4a,#0d0f14 40%,#24272e);padding:13px;
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 60px 120px rgba(0,0,0,.6),0 20px 40px rgba(0,0,0,.4)}
.phone .scr{position:relative;width:100%;height:100%;border-radius:50px;background:#f4f6fa;overflow:hidden;color:var(--ink)}
.phone .island{position:absolute;left:50%;top:12px;width:112px;height:32px;border-radius:20px;background:#000;transform:translateX(-50%)}
.phone .sb{display:flex;justify-content:space-between;padding:18px 30px 0 34px;font-weight:700;font-size:17px}
.phone .sb i{display:inline-block;width:26px;height:12px;border:2px solid var(--ink);border-radius:4px;position:relative;vertical-align:middle}
.phone .sb i:after{content:'';position:absolute;left:1px;top:1px;bottom:1px;width:60%;background:var(--ink);border-radius:1px}
.phone .top{display:flex;align-items:center;justify-content:center;position:relative;margin-top:26px;font-weight:700;font-size:19px}
.phone .top:before{content:'‹';position:absolute;left:24px;font-size:34px;line-height:0;top:10px;font-weight:500}
.phone .pixico{margin:28px auto 0;width:92px;height:92px;border-radius:50%;background:#e2f6f3;display:flex;align-items:center;justify-content:center}
.phone .lbl{text-align:center;color:#5d6678;font-weight:600;font-size:19px;margin-top:16px}
.phone .val{text-align:center;font-family:'Montserrat';font-weight:900;font-size:46px;letter-spacing:-.02em;margin-top:4px}
.phone .card{margin:22px 20px 0;background:#fff;border-radius:22px;padding:6px 20px;box-shadow:0 2px 0 rgba(0,0,0,.03)}
.phone .row{display:flex;justify-content:space-between;padding:13px 0;font-size:16.5px;border-bottom:1px solid #eef0f4}
.phone .row:last-child{border:0}
.phone .row span{color:#6b7385}
.phone .row b{font-weight:700}
.phone .warn{margin:18px 20px 0;background:#ffe9e9;color:#c10e14;border-radius:20px;padding:18px 18px;display:flex;gap:12px;align-items:center;font-weight:800;font-size:18px;line-height:1.25}
.phone .glare{position:absolute;inset:0;border-radius:50px;background:linear-gradient(115deg,rgba(255,255,255,.35) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 70%,rgba(255,255,255,.12) 100%);pointer-events:none}

/* ---------- toast de alerta ---------- */
.toast{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.97);border-radius:24px;padding:16px 24px 16px 16px;
  box-shadow:0 26px 60px rgba(0,0,0,.45);color:var(--ink);white-space:nowrap}
.toast .ti{width:58px;height:58px;border-radius:14px;background:var(--alert);display:flex;align-items:center;justify-content:center;color:#fff}
.toast b{display:block;font-family:'Montserrat';font-weight:900;font-size:24px}
.toast span{display:block;font-size:18px;color:#5d6678;font-weight:600;margin-top:2px}

/* ---------- blocos 3D dos bancos ---------- */
.tile-s{border-radius:34px;background:linear-gradient(150deg,#ff3a3a 0%,#e80000 45%,#b30000 100%);display:flex;align-items:center;justify-content:center;
  box-shadow:inset 0 3px 0 rgba(255,255,255,.35),inset 0 -6px 0 rgba(0,0,0,.18),0 14px 0 #7d0000,0 50px 90px rgba(0,0,0,.55)}
.tile-s img{width:78%}
.tile-i{filter:drop-shadow(0 14px 0 #a54000) drop-shadow(0 50px 50px rgba(0,0,0,.5))}

/* ---------- formulário (desenhado em 600 de largura) ---------- */
.form{width:600px;background:#fff;border-radius:36px;padding:38px 38px 34px;color:var(--ink);box-shadow:0 60px 120px rgba(0,0,0,.45),0 16px 30px rgba(0,0,0,.2)}
.form h4{font-family:'Montserrat';font-weight:900;font-size:32px;letter-spacing:-.01em}
.form .q{font-weight:700;font-size:20px;margin-top:26px;color:#3a4357}
.form .ops{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}
.form .op{height:96px;border-radius:18px;border:3px solid #e3e7ef;display:flex;align-items:center;justify-content:center;position:relative;background:#fff}
.form .op.on{border-color:var(--pix);background:#effbf9}
.form .op.on:after{content:'✓';position:absolute;right:-12px;top:-12px;width:36px;height:36px;border-radius:50%;background:var(--pix);color:#fff;font-weight:900;font-size:21px;display:flex;align-items:center;justify-content:center}
.form .in{margin-top:12px;height:70px;border-radius:16px;background:#f3f5f9;border:2px solid #e3e7ef;display:flex;align-items:center;padding:0 22px;font-size:24px;font-weight:700}
.form .in.c{border-color:var(--ink)}
.form .in.c:after{content:'';width:3px;height:30px;background:var(--ink);margin-left:4px}
.form .go{margin-top:28px;height:84px;border-radius:18px;background:var(--pix);color:#05302b;display:flex;align-items:center;justify-content:center;gap:14px;
  font-family:'Montserrat';font-weight:900;font-size:28px;text-transform:uppercase}
`;

// ---------------------------------------------------------------------------
// componentes
// ---------------------------------------------------------------------------
const svgAlerta = (s, cor = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`;
const svgForm = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>`;
const svgDown = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
const svgPix = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48"><rect x="11" y="11" width="26" height="26" rx="6" transform="rotate(45 24 24)" fill="none" stroke="#1e9e91" stroke-width="5"/><circle cx="24" cy="24" r="4" fill="#1e9e91"/></svg>`;
const svgCursor = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10.5 19z" fill="#0b0f19" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

const esc = ({ x, y, k, rot = 0, extra = '' }, html) =>
  `<div class="esc" style="transform:translate(${x}px,${y}px) rotate(${rot}deg) scale(${k}) ${extra}">${html}</div>`;

const celular = () => `
  <div class="phone"><div class="scr">
    <div class="island"></div>
    <div class="sb"><span>03:12</span><span><i></i></span></div>
    <div class="top">Comprovante</div>
    <div class="pixico">${svgPix(54)}</div>
    <div class="lbl">Pix enviado</div>
    <div class="val">${CONFIG.valor}</div>
    <div class="card">
      <div class="row"><span>Para</span><b>Destinatário desconhecido</b></div>
      <div class="row"><span>Data</span><b>Hoje, 03:12</b></div>
      <div class="row"><span>Tipo</span><b>Pix · imediato</b></div>
      <div class="row"><span>Autenticação</span><b>E2E9F4…7C1A</b></div>
    </div>
    <div class="warn">${svgAlerta(30, '#c10e14')}<span>Você não reconhece<br>esta transferência?</span></div>
    <div class="glare"></div>
  </div></div>`;

const toast = (titulo, sub) => `
  <div class="toast"><div class="ti">${svgAlerta(34, '#fff')}</div><div><b>${titulo}</b><span>${sub}</span></div></div>`;

const tileSantander = (w) => `<div class="tile-s" style="width:${w}px;height:${Math.round(w * 0.44)}px;border-radius:${w * 0.08}px"><img src="${LOGO.santanderBranco}"></div>`;
const tileItau = (w) => `<img class="tile-i" src="${LOGO.itauSolido}" style="width:${w}px;display:block">`;

const formulario = () => `
  <div class="form">
    <h4>Conte o que aconteceu</h4>
    <div class="q">Em qual banco foi o golpe?</div>
    <div class="ops">
      <div class="op on"><img src="${LOGO.santander}" style="width:200px"></div>
      <div class="op"><img src="${LOGO.itau}" style="width:66px"></div>
    </div>
    <div class="q">Valor transferido</div>
    <div class="in c">${CONFIG.valor}</div>
    <div class="q">Quando aconteceu?</div>
    <div class="in" style="color:#8a93a6">Nos últimos 30 dias</div>
    <div class="go">Enviar ${svgDown(30, '#05302b').replace('M12 5v14M6 13l6 6 6-6', 'M5 12h14M13 6l6 6-6 6')}</div>
  </div>`;

const titulo = (st, { cor = '#fff', alinhar = 'left', inverso = false } = {}) => {
  const linhas = st
    ? [['Sofreu um golpe', 134], ['do PIX', 134], ['nesses bancos?', 128, true]]
    : [['Sofreu um golpe do PIX', 96], ['nesses bancos?', 124, true]];
  return `<div class="hl" style="color:${cor};text-align:${alinhar}">${linhas
    .map(([t, fs, m]) => (m
      ? `<div style="margin-top:${st ? 18 : 12}px"><span class="${inverso ? 'inv' : 'mark'}" style="font-size:${fs}px">${t}</span></div>`
      : `<div style="font-size:${fs}px">${t}</div>`))
    .join('')}</div>`;
};

const cta = ({ bg, cor, icoBg, icoCor, sombra }) => `
  <div class="cta" style="background:${bg};color:${cor};box-shadow:${sombra}">
    <div class="ico" style="background:${icoBg}">${svgForm(44, icoCor)}</div>
    <div class="tx"><b>${CONFIG.cta}</b><span>${CONFIG.ctaSub}</span></div>
    <div class="seta">${svgDown(46, cor)}</div>
  </div>`;

const rodape = (cor) => `<div class="foot" style="color:${cor}"><b>${CONFIG.escritorio} · ${CONFIG.oab}</b><small>${CONFIG.disclaimer}</small></div>`;

const base = (st, ctaOpts, corTexto = '#fff') => `
  <p style="font-size:30px;line-height:1.28;font-weight:600;color:${corTexto}">${CONFIG.apoio}</p>
  <div style="margin-top:${st ? 24 : 18}px">${cta(ctaOpts)}</div>
  <div style="margin-top:${st ? 22 : 16}px">${rodape(corTexto)}</div>`;

// Stories reaproveita a composição do feed, deslocada para baixo (título mais alto).
const DY = (st) => (st ? 392 : 0);

// ---------------------------------------------------------------------------
// 01 · NOTURNO — fundo escuro, blocos 3D dos bancos + celular com o comprovante
// ---------------------------------------------------------------------------
function noturno(f) {
  const st = f.id === 'stories';
  const d = DY(st);
  const L = { top: st ? 262 : 58, s: { x: 40, y: 400 + d, w: 470, r: -7 }, i: { x: 140, y: 625 + d, w: 260, r: 8 },
    p: { x: 640, y: 338 + d, k: 0.72, r: 6 }, t: { x: 548, y: 404 + d, k: 0.9 }, base: 1014 + d };
  return `
  <style>
    .n1{width:${f.w}px;height:${f.h}px;background:
      radial-gradient(45% 26% at 25% ${((L.s.y + 110) / f.h) * 100}%,rgba(236,0,0,.55),transparent 70%),
      radial-gradient(40% 24% at 25% ${((L.i.y + 150) / f.h) * 100}%,rgba(255,98,0,.45),transparent 70%),
      radial-gradient(40% 30% at 74% ${((L.p.y + 300) / f.h) * 100}%,rgba(50,188,173,.22),transparent 70%),
      linear-gradient(180deg,#0e1424,#05070d)}
    .n1 .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);
      background-size:54px 54px;-webkit-mask-image:radial-gradient(70% 45% at 50% ${((L.p.y + 300) / f.h) * 100}%,#000,transparent)}
    .n1 .hl{text-shadow:0 8px 30px rgba(0,0,0,.5)}
    .n1 .fade{position:absolute;left:0;right:0;top:${L.base - 70}px;bottom:0;background:linear-gradient(180deg,rgba(5,7,13,0),#05070d 40%)}
  </style>
  <div class="cv n1">
    <div class="grid"></div>
    ${esc({ x: L.s.x, y: L.s.y, k: 1, rot: L.s.r }, tileSantander(L.s.w))}
    ${esc({ x: L.i.x, y: L.i.y, k: 1, rot: L.i.r }, tileItau(L.i.w))}
    ${esc({ x: L.p.x, y: L.p.y, k: L.p.k, rot: L.p.r }, celular())}
    ${esc({ x: L.t.x, y: L.t.y, k: L.t.k, rot: 4 }, toast('Pix de ' + CONFIG.valor, 'Transação não reconhecida'))}
    <div class="abs" style="left:62px;right:40px;top:${L.top}px">${titulo(st)}</div>
    <div class="fade"></div>
    <div class="abs" style="left:62px;right:62px;top:${L.base}px">${base(st, {
      bg: 'var(--yellow)', cor: 'var(--ink)', icoBg: 'var(--ink)', icoCor: 'var(--yellow)', sombra: '0 20px 50px rgba(255,208,0,.25)',
    })}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 02 · ALERTA — fundo amarelo, celular central com os logos colados como adesivos
// ---------------------------------------------------------------------------
function alertaAmarelo(f) {
  const st = f.id === 'stories';
  const d = DY(st);
  const L = { top: st ? 262 : 66, p: { x: 372, y: 372 + d, k: 0.72, r: -5 }, s: { x: 28, y: 470 + d, w: 360, r: -9 },
    i: { x: 742, y: 600 + d, w: 230, r: 9 }, band: 1012 + d };
  const sticker = (html, pad, raio) => `<div style="background:#fff;padding:${pad}px;border-radius:${raio}px;box-shadow:0 30px 60px rgba(0,0,0,.35)">${html}</div>`;
  return `
  <style>
    .a2{width:${f.w}px;height:${f.h}px;background:radial-gradient(80% 60% at 55% 55%,#ffe352,var(--yellow) 60%,#f0b400)}
    .a2 .dots{position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.1) 2px,transparent 2.6px);background-size:22px 22px;
      -webkit-mask-image:linear-gradient(180deg,transparent 22%,#000 70%)}
    .a2 .stripe{position:absolute;left:0;right:0;top:0;height:26px;background:repeating-linear-gradient(-45deg,var(--ink) 0 26px,var(--yellow) 26px 52px)}
    .a2 .band{position:absolute;left:0;right:0;top:${L.band}px;bottom:0;background:var(--ink);padding:${st ? 40 : 32}px 62px 0}
    .a2 .band:before{content:'';position:absolute;left:0;right:0;top:-26px;height:26px;background:repeating-linear-gradient(-45deg,var(--ink) 0 26px,var(--yellow) 26px 52px)}
  </style>
  <div class="cv a2">
    <div class="dots"></div>
    <div class="stripe"></div>
    <div class="abs" style="left:62px;right:40px;top:${L.top}px">
      <div style="display:inline-flex;align-items:center;gap:12px;font-family:'Montserrat';font-weight:900;font-size:${st ? 30 : 26}px;letter-spacing:.16em;color:var(--ink);margin-bottom:${st ? 18 : 12}px">${svgAlerta(st ? 36 : 30)} ALERTA · GOLPE DO PIX</div>
      ${titulo(st, { cor: 'var(--ink)', inverso: true })}
    </div>
    ${esc({ x: L.p.x, y: L.p.y, k: L.p.k, rot: L.p.r }, celular())}
    ${esc({ x: L.s.x, y: L.s.y, k: 1, rot: L.s.r }, sticker(tileSantander(L.s.w).replace('0 14px 0 #7d0000,0 50px 90px rgba(0,0,0,.55)', 'none'), 10, L.s.w * 0.1))}
    ${esc({ x: L.i.x, y: L.i.y, k: 1, rot: L.i.r }, sticker(`<img src="${LOGO.itau}" style="width:${L.i.w}px;display:block">`, 12, L.i.w * 0.32))}
    <div class="band">${base(st, {
      bg: 'var(--yellow)', cor: 'var(--ink)', icoBg: 'var(--ink)', icoCor: 'var(--yellow)', sombra: 'none',
    })}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 03 · FORMULÁRIO — split vermelho/laranja, logos grandes e o formulário em destaque
// ---------------------------------------------------------------------------
function formularioSplit(f) {
  const st = f.id === 'stories';
  const d = DY(st);
  const L = { top: st ? 262 : 58, s: { x: 36, y: 392 + d, w: 410 }, i: { x: 130, y: 590 + d, w: 230 },
    fm: { x: 488, y: 352 + d, k: 0.88, r: 3 }, cur: { x: 800, y: 880 + d }, base: 1014 + d };
  return `
  <style>
    .f3{width:${f.w}px;height:${f.h}px;background:linear-gradient(100deg,#ff2626 0%,var(--red) 30%,#b80000 49.9%,#e05200 50.1%,var(--orange) 70%,#ff8a3a 100%)}
    .f3 .ray{position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% ${((L.fm.y + 280) / f.h) * 100}%,rgba(255,255,255,.07) 0 6deg,transparent 6deg 18deg)}
    .f3 .hl{text-shadow:0 8px 30px rgba(0,0,0,.35)}
    .f3 .fade{position:absolute;left:0;right:0;top:${L.base - 70}px;bottom:0;background:linear-gradient(180deg,rgba(11,15,25,0),var(--ink) 40%)}
  </style>
  <div class="cv f3">
    <div class="ray"></div>
    <img class="abs" src="${LOGO.santanderBranco}" style="left:${L.s.x}px;top:${L.s.y}px;width:${L.s.w}px;transform:rotate(-6deg);filter:drop-shadow(0 12px 30px rgba(0,0,0,.3))">
    <img class="abs" src="${LOGO.itauBranco}" style="left:${L.i.x}px;top:${L.i.y}px;width:${L.i.w}px;transform:rotate(-8deg);filter:drop-shadow(0 18px 40px rgba(0,0,0,.35))">
    <div class="abs" style="left:20px;right:20px;top:${L.top}px">${titulo(st, { alinhar: 'center' })}</div>
    ${esc({ x: L.fm.x, y: L.fm.y, k: L.fm.k, rot: L.fm.r }, formulario())}
    <div class="abs" style="left:${L.cur.x}px;top:${L.cur.y}px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35))">${svgCursor(74)}</div>
    <div class="fade"></div>
    <div class="abs" style="left:62px;right:62px;top:${L.base}px">${base(st, {
      bg: '#fff', cor: 'var(--ink)', icoBg: 'var(--pix)', icoCor: '#fff', sombra: '0 20px 50px rgba(0,0,0,.35)',
    })}</div>
  </div>`;
}

const CONCEITOS = [
  ['01-noturno', noturno],
  ['02-alerta', alertaAmarelo],
  ['03-formulario', formularioSplit],
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
