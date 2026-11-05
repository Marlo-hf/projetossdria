// Gera os estáticos "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)
// Uso:  node build.js          → gera html/*.html e png/*.png
// Edite o bloco CONFIG abaixo (nome do escritório, OAB, textos) e rode de novo.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIG = {
  escritorio: 'Nome do Escritório Advocacia',
  oab: 'OAB/UF 00.000',
  headline: 'Sofreu um golpe do <em>PIX</em> nesses bancos?',
  sub: 'Em muitos casos, o banco responde pelas falhas de segurança que permitiram o golpe. Conheça seus direitos.',
  bullets: [
    'Falsa central ou falso atendente',
    'Celular roubado ou conta invadida',
    'PIX fora do seu padrão de uso',
  ],
  cta: 'Fale com um advogado especialista',
  disclaimer:
    'Conteúdo informativo. Este escritório não tem vínculo com as instituições citadas; as marcas pertencem aos seus titulares.',
};

const FORMATOS = [
  { id: 'feed', w: 1080, h: 1350, top: 64, bottom: 56 },
  { id: 'stories', w: 1080, h: 1920, top: 250, bottom: 300 }, // zonas seguras de Stories/Reels
];

const ROOT = __dirname;
const A = (p) => 'file://' + path.join(ROOT, 'assets', p);

const fontes = [
  ['Montserrat', 600], ['Montserrat', 700], ['Montserrat', 800], ['Montserrat', 900],
  ['Inter', 400], ['Inter', 500], ['Inter', 600], ['Inter', 700],
]
  .map(([f, w]) => `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;src:url('${A(`fonts/${f.toLowerCase()}-latin-${w}-normal.woff2`)}') format('woff2');}`)
  .join('\n');

const BASE_CSS = `
${fontes}
:root{
  --santander:#EC0000; --santander-esc:#9e0000;
  --itau:#FF6200; --itau-esc:#b84500;
  --navy:#0a1222; --navy2:#121e36;
  --pix:#32BCAD; --branco:#ffffff; --tinta:#0d1526;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--navy)}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.canvas{position:relative;overflow:hidden}
h1{font-family:'Montserrat',sans-serif;font-weight:900;letter-spacing:-0.02em;line-height:1.02}
h1 em{font-style:normal;color:var(--pix)}
.cta{display:inline-flex;align-items:center;gap:18px;font-family:'Montserrat',sans-serif;font-weight:800;
  background:var(--pix);color:#062a26;border-radius:999px;padding:26px 44px;font-size:34px;letter-spacing:-0.01em;
  box-shadow:0 14px 40px rgba(50,188,173,.35)}
.cta svg{width:34px;height:34px}
.rodape{font-size:19px;line-height:1.35}
.rodape b{font-family:'Montserrat',sans-serif;font-weight:800;font-size:24px;display:block;letter-spacing:.01em}
.rodape small{display:block;margin-top:8px;font-size:16px;opacity:.7}
`;

const seta = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const alerta = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`;

const rodape = (cor = '#fff') => `
  <div class="rodape" style="color:${cor}">
    <b>${CONFIG.escritorio} · ${CONFIG.oab}</b>
    <small>${CONFIG.disclaimer}</small>
  </div>`;

// ---------------------------------------------------------------------------
// Conceito 1 — "Split": metade vermelha Santander, metade laranja Itaú no topo,
// painel escuro com a chamada embaixo.
// ---------------------------------------------------------------------------
function split(f) {
  const st = f.id === 'stories';
  const topoH = st ? 600 : 500;
  return `
  <style>
    .c1{width:${f.w}px;height:${f.h}px;background:var(--navy)}
    .c1 .metade{position:absolute;top:0;height:${topoH + 120}px;width:50%;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .c1 .esq{left:0;background:radial-gradient(120% 90% at 30% 35%,#ff2a2a 0%,var(--santander) 45%,var(--santander-esc) 100%)}
    .c1 .dir{right:0;background:radial-gradient(120% 90% at 70% 35%,#ff8a3d 0%,var(--itau) 45%,var(--itau-esc) 100%)}
    .c1 .marca{position:absolute;opacity:.13}
    .c1 .esq .marca{width:1100px;left:-180px;top:${st ? 150 : 40}px;transform:rotate(-14deg)}
    .c1 .dir .marca{width:760px;right:-260px;top:${st ? 40 : -60}px;transform:rotate(12deg)}
    .c1 .logo-s{position:relative;width:360px;margin-top:${st ? 150 : 20}px;filter:drop-shadow(0 8px 24px rgba(0,0,0,.25))}
    .c1 .logo-i{position:relative;width:${st ? 260 : 230}px;margin-top:${st ? 150 : 20}px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.3))}
    .c1 .vs{position:absolute;left:50%;top:${st ? 445 : 320}px;transform:translate(-50%,-50%);width:118px;height:118px;border-radius:50%;
      background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;border:6px solid #fff;
      box-shadow:0 12px 40px rgba(0,0,0,.35)}
    .c1 .vs svg{width:58px;height:58px;color:#ffd84d}
    .c1 .painel{position:absolute;left:0;right:0;bottom:0;top:${topoH}px;background:linear-gradient(180deg,var(--navy2),var(--navy));
      clip-path:polygon(0 70px,50% 0,100% 70px,100% 100%,0 100%);padding:${st ? 120 : 108}px 72px ${f.bottom}px;color:#fff;display:flex;flex-direction:column}
    .c1 h1{font-size:${st ? 90 : 82}px}
    .c1 p.sub{margin-top:${st ? 30 : 22}px;font-size:${st ? 33 : 30}px;line-height:1.38;color:#c9d3e6;max-width:900px}
    .c1 ul{list-style:none;margin-top:${st ? 34 : 24}px;display:flex;flex-direction:column;gap:${st ? 16 : 12}px}
    .c1 li{display:flex;align-items:center;gap:18px;font-size:${st ? 31 : 28}px;font-weight:600}
    .c1 li i{flex:none;width:44px;height:44px;border-radius:50%;background:rgba(50,188,173,.16);color:var(--pix);display:flex;align-items:center;justify-content:center}
    .c1 li i svg{width:26px;height:26px}
    .c1 .acao{margin-top:auto;padding-top:30px;display:flex;flex-direction:column;gap:${st ? 30 : 22}px}
  </style>
  <div class="canvas c1">
    <div class="metade esq">
      <img class="marca" src="${A('logos/santander-branco.svg')}">
      <img class="logo-s" src="${A('logos/santander-branco.svg')}">
    </div>
    <div class="metade dir">
      <img class="marca" src="${A('logos/itau-solido.svg')}" style="filter:brightness(0) invert(1)">
      <img class="logo-i" src="${A('logos/itau-solido.svg')}">
    </div>
    <div class="vs">${alerta}</div>
    <div class="painel">
      <h1>${CONFIG.headline}</h1>
      <p class="sub">${CONFIG.sub}</p>
      <ul>${CONFIG.bullets.map((b) => `<li><i>${check}</i>${b}</li>`).join('')}</ul>
      <div class="acao">
        <div><span class="cta">${CONFIG.cta} ${seta}</span></div>
        ${rodape('#ffffff')}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Conceito 2 — "Marca d'água": fundo escuro com os logos gigantes ao fundo,
// chamada central grande e selos dos bancos logo abaixo.
// ---------------------------------------------------------------------------
function marcaDagua(f) {
  const st = f.id === 'stories';
  return `
  <style>
    .c2{width:${f.w}px;height:${f.h}px;background:radial-gradient(90% 60% at 50% 45%,#16264a 0%,var(--navy) 70%);color:#fff}
    .c2 .bg{position:absolute;filter:blur(1.5px)}
    .c2 .bg-s{width:1500px;left:-170px;top:${st ? 120 : 10}px;transform:rotate(-10deg);opacity:.30}
    .c2 .bg-i{width:820px;right:-250px;bottom:${st ? 160 : -120}px;transform:rotate(11deg);opacity:.32}
    .c2 .veu{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,18,34,.15) 0%,rgba(10,18,34,.72) 38%,rgba(10,18,34,.78) 62%,rgba(10,18,34,.25) 100%)}
    .c2 .conteudo{position:absolute;inset:0;padding:${f.top + 30}px 76px ${f.bottom}px;display:flex;flex-direction:column}
    .c2 .tag{align-self:flex-start;display:inline-flex;align-items:center;gap:12px;background:#ffd84d;color:#3a2a00;font-family:'Montserrat';font-weight:800;
      font-size:26px;letter-spacing:.14em;text-transform:uppercase;padding:14px 26px;border-radius:12px}
    .c2 .tag svg{width:30px;height:30px}
    .c2 .meio{margin-top:auto;margin-bottom:auto}
    .c2 h1{font-size:${st ? 118 : 104}px;text-shadow:0 6px 30px rgba(0,0,0,.45)}
    .c2 .selos{display:flex;gap:22px;margin-top:${st ? 54 : 40}px}
    .c2 .selo{height:${st ? 128 : 112}px;border-radius:26px;display:flex;align-items:center;justify-content:center;padding:0 38px;box-shadow:0 14px 40px rgba(0,0,0,.35)}
    .c2 .selo.s{background:var(--santander)}
    .c2 .selo.s img{height:${st ? 50 : 44}px}
    .c2 .selo.i{background:#fff;padding:0 18px}
    .c2 .selo.i img{height:${st ? 104 : 90}px}
    .c2 p.sub{margin-top:${st ? 54 : 40}px;font-size:${st ? 36 : 33}px;line-height:1.4;color:#d5ddec;max-width:880px}
    .c2 .acao{display:flex;flex-direction:column;gap:30px}
  </style>
  <div class="canvas c2">
    <img class="bg bg-s" src="${A('logos/santander.svg')}">
    <img class="bg bg-i" src="${A('logos/itau.svg')}">
    <div class="veu"></div>
    <div class="conteudo">
      <span class="tag">${alerta} Golpe do PIX</span>
      <div class="meio">
        <h1>${CONFIG.headline}</h1>
        <div class="selos">
          <div class="selo s"><img src="${A('logos/santander-branco.svg')}"></div>
          <div class="selo i"><img src="${A('logos/itau.svg')}"></div>
        </div>
        <p class="sub">${CONFIG.sub}</p>
      </div>
      <div class="acao">
        <div><span class="cta">${CONFIG.cta} ${seta}</span></div>
        ${rodape('#ffffff')}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Conceito 3 — "Notificação": fundo claro com padrão dos dois logos,
// card de notificação genérica de PIX não reconhecido.
// ---------------------------------------------------------------------------
function notificacao(f) {
  const st = f.id === 'stories';
  const tiles = [];
  const cols = 5, rows = Math.ceil((f.h + 600) / 260);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = (r + c) % 2 === 0;
      const x = c * 300 - 220 + (r % 2) * 150;
      const y = r * 260 - 200;
      tiles.push(s
        ? `<img src="${A('logos/santander.svg')}" style="left:${x}px;top:${y + 70}px;width:250px">`
        : `<img src="${A('logos/itau.svg')}" style="left:${x + 70}px;top:${y + 20}px;width:130px">`);
    }
  }
  return `
  <style>
    .c3{width:${f.w}px;height:${f.h}px;background:#f3f5f9;color:var(--tinta)}
    .c3 .padrao{position:absolute;inset:-200px;transform:rotate(-12deg);opacity:.12}
    .c3 .veu{position:absolute;inset:0;background:linear-gradient(180deg,rgba(243,245,249,.2) 0%,rgba(243,245,249,.0) 30%,rgba(243,245,249,.75) 55%,rgba(243,245,249,.85) 85%,rgba(243,245,249,.3) 100%)}
    .c3 .padrao img{position:absolute}
    .c3 .faixa{position:absolute;left:0;right:0;height:22px;display:flex}
    .c3 .faixa span{flex:1}
    .c3 .conteudo{position:absolute;inset:0;padding:${f.top + 36}px 72px ${f.bottom}px;display:flex;flex-direction:column}
    .c3 h1{font-size:${st ? 104 : 92}px;color:var(--tinta)}
    .c3 h1 em{color:#0f8f82}
    .c3 .logos{display:flex;align-items:center;gap:30px;margin-top:${st ? 40 : 30}px}
    .c3 .logos .s{height:${st ? 58 : 50}px}
    .c3 .logos .i{height:${st ? 96 : 84}px}
    .c3 .logos .mais{font-family:'Montserrat';font-weight:900;font-size:40px;color:#9aa6bb}
    .c3 .notif{margin-top:${st ? 90 : 52}px;background:#fff;border-radius:34px;padding:34px 36px;box-shadow:0 30px 70px rgba(13,21,38,.18),0 2px 0 rgba(13,21,38,.04);
      display:grid;grid-template-columns:96px 1fr;gap:26px;align-items:center;transform:rotate(-1.5deg)}
    .c3 .ico{width:96px;height:96px;border-radius:24px;background:#0d1526;display:flex;align-items:center;justify-content:center}
    .c3 .ico svg{width:56px;height:56px}
    .c3 .n-top{display:flex;justify-content:space-between;font-size:24px;color:#6b778c;font-weight:500}
    .c3 .n-tit{font-family:'Montserrat';font-weight:800;font-size:34px;margin-top:6px}
    .c3 .n-val{font-family:'Montserrat';font-weight:900;font-size:48px;color:#d4141b;margin-top:4px;letter-spacing:-0.01em}
    .c3 .n-aviso{grid-column:1/-1;display:flex;align-items:center;gap:14px;background:#fff3f0;color:#b3120f;border-radius:18px;padding:18px 22px;font-weight:700;font-size:27px}
    .c3 .n-aviso svg{width:32px;height:32px;flex:none}
    .c3 p.sub{margin-top:${st ? 80 : 46}px;font-size:${st ? 35 : 31}px;line-height:1.4;color:#334059}
    .c3 .acao{margin-top:auto;display:flex;flex-direction:column;gap:26px}
    .c3 .cta{background:var(--tinta);color:#fff;box-shadow:0 14px 40px rgba(13,21,38,.3)}
    .c3 .cta svg{color:var(--pix)}
  </style>
  <div class="canvas c3">
    <div class="padrao">${tiles.join('')}</div>
    <div class="veu"></div>
    <div class="faixa" style="top:0"><span style="background:var(--santander)"></span><span style="background:var(--itau)"></span></div>
    <div class="conteudo">
      <h1>${CONFIG.headline}</h1>
      <div class="logos">
        <img class="s" src="${A('logos/santander.svg')}"><span class="mais">+</span><img class="i" src="${A('logos/itau.svg')}">
      </div>
      <div class="notif">
        <div class="ico">
          <svg viewBox="0 0 48 48"><rect x="10" y="10" width="28" height="28" rx="6" transform="rotate(45 24 24)" fill="none" stroke="#32BCAD" stroke-width="5"/><circle cx="24" cy="24" r="4" fill="#32BCAD"/></svg>
        </div>
        <div>
          <div class="n-top"><span>Transferência PIX enviada</span><span>agora</span></div>
          <div class="n-tit">Destinatário desconhecido</div>
          <div class="n-val">− R$ 23.480,00</div>
        </div>
        <div class="n-aviso">${alerta} Você não fez essa transferência?</div>
      </div>
      <p class="sub">${CONFIG.sub}</p>
      <div class="acao">
        <div><span class="cta">${CONFIG.cta} ${seta}</span></div>
        ${rodape('#0d1526')}
      </div>
    </div>
  </div>`;
}

const CONCEITOS = [
  ['01-split', split],
  ['02-marca-dagua', marcaDagua],
  ['03-notificacao', notificacao],
];

(async () => {
  const htmlDir = path.join(ROOT, 'html');
  const pngDir = path.join(ROOT, 'png');
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.mkdirSync(pngDir, { recursive: true });

  const browser = await chromium.launch();
  for (const [nome, fn] of CONCEITOS) {
    for (const f of FORMATOS) {
      const arquivo = `${nome}-${f.id}`;
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${arquivo}</title><style>${BASE_CSS}</style></head><body>${fn(f)}</body></html>`;
      const htmlPath = path.join(htmlDir, `${arquivo}.html`);
      fs.writeFileSync(htmlPath, html);
      const page = await browser.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
      await page.goto('file://' + htmlPath);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(pngDir, `${arquivo}.png`), clip: { x: 0, y: 0, width: f.w, height: f.h } });
      await page.close();
      console.log('ok', arquivo);
    }
  }
  await browser.close();
})();
