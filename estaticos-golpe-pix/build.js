// Gera os estáticos "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)
// Tom sério/urgente: prazo do MED (Banco Central), Súmula 479 do STJ e perda do dinheiro.
// Uso:  node build.js   → gera png/*.png (e html/*.html para conferência)
// Edite o bloco CONFIG (nome do escritório, OAB, textos) e rode de novo.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIG = {
  escritorio: 'Nome do Escritório Advocacia',
  oab: 'OAB/UF 00.000',
  cta: 'Preencha o formulário',
  ctaSub: 'Fale com um advogado ainda hoje',
  disclaimer: 'Conteúdo informativo. Sem vínculo com as instituições citadas; marcas pertencentes aos seus titulares.',
  valor: 'R$ 23.480,00',
  // Textos verificados: bcb.gov.br (MED: até 80 dias após o Pix) e STJ (Súmula 479).
  sumula479:
    'As instituições financeiras respondem objetivamente pelos danos gerados por fortuito interno relativo a fraudes e delitos praticados por terceiros no âmbito de operações bancárias.',
};

const FORMATOS = [
  { id: 'feed', w: 1080, h: 1350, top: 64, bottom: 60 },
  { id: 'stories', w: 1080, h: 1920, top: 250, bottom: 290 }, // zonas seguras de Stories/Reels
];

const ROOT = __dirname;
const A = (p) => 'file://' + path.join(ROOT, 'assets', p);
const LOGO = {
  santander: A('logos/santander.svg'),
  santanderBranco: A('logos/santander-branco.svg'),
  itau: A('logos/itau.svg'),
  itauSolido: A('logos/itau-solido.svg'),
};

const fonte = (fam, arq, w, st = 'normal') => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url('${A('fonts/' + arq)}') format('woff2')}`;
const BASE_CSS = `
${[700, 800, 900].map((w) => fonte('Playfair', `playfair-display-latin-${w}-normal.woff2`, w)).join('\n')}
${fonte('Playfair', 'playfair-display-latin-700-italic.woff2', 700, 'italic')}
${[600, 700, 800, 900].map((w) => fonte('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)).join('\n')}
${[400, 500, 600, 700].map((w) => fonte('Inter', `inter-latin-${w}-normal.woff2`, w)).join('\n')}
:root{--bg:#09090b;--red:#E3161E;--red2:#ff3b3f;--txt:#f4f4f5;--mut:#a1a1aa;--line:rgba(255,255,255,.14)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;background:var(--bg);color:var(--txt)}
.cv{position:relative;overflow:hidden;background:var(--bg)}
.abs{position:absolute}
.col{position:absolute;left:72px;right:72px;display:flex;flex-direction:column}
.serif{font-family:'Playfair',serif;font-weight:900;letter-spacing:-.015em;line-height:1.02}
.serif em{font-style:normal;color:var(--red2)}
.tag{align-self:flex-start;display:inline-flex;align-items:center;gap:14px;border:2px solid var(--red);color:#fff;border-radius:999px;
  padding:12px 24px 12px 18px;font-weight:700;font-size:21px;letter-spacing:.18em;text-transform:uppercase;background:rgba(227,22,30,.12)}
.tag i{width:14px;height:14px;border-radius:50%;background:var(--red2);box-shadow:0 0 0 6px rgba(227,22,30,.25)}
.bancos{display:flex;align-items:center;gap:16px}
.bancos .s{height:78px;padding:0 30px;border-radius:16px;background:var(--red);display:flex;align-items:center}
.bancos .s img{height:33px}
.bancos .i{height:78px;width:78px;display:block}
.bancos span{font-size:22px;color:var(--mut);font-weight:600;margin-right:6px}
.rule{height:2px;background:var(--line)}
.cta{display:flex;align-items:center;gap:22px;background:var(--red);border-radius:18px;padding:24px 30px;color:#fff;
  box-shadow:0 20px 60px rgba(227,22,30,.35),inset 0 2px 0 rgba(255,255,255,.18)}
.cta .ico{flex:none;width:72px;height:72px;border-radius:14px;background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center}
.cta b{display:block;font-family:'Montserrat';font-weight:900;font-size:37px;text-transform:uppercase;letter-spacing:.005em;line-height:1}
.cta span{display:block;font-weight:600;font-size:22px;opacity:.9;margin-top:8px}
.cta .seta{margin-left:auto;flex:none}
.foot{font-size:18px;line-height:1.35;color:var(--mut)}
.foot b{font-family:'Montserrat';font-weight:800;font-size:22px;color:#fff;display:block}
.foot small{display:block;font-size:15px;margin-top:4px}
.bg-logo{position:absolute;pointer-events:none}
.veu{position:absolute;inset:0}

/* celular (desenhado em 400x820, escalado) */
.esc{position:absolute;left:0;top:0;transform-origin:0 0}
.phone{width:400px;height:820px;border-radius:62px;background:linear-gradient(145deg,#3a3f4a,#0d0f14 40%,#24272e);padding:13px;
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 60px 120px rgba(0,0,0,.7),0 0 120px rgba(227,22,30,.25)}
.phone .scr{position:relative;width:100%;height:100%;border-radius:50px;background:#f4f6fa;overflow:hidden;color:#0b0f19}
.phone .island{position:absolute;left:50%;top:12px;width:112px;height:32px;border-radius:20px;background:#000;transform:translateX(-50%)}
.phone .sb{display:flex;justify-content:space-between;padding:18px 30px 0 34px;font-weight:700;font-size:17px}
.phone .top{text-align:center;margin-top:26px;font-weight:700;font-size:19px}
.phone .ok{margin:30px auto 0;width:96px;height:96px;border-radius:50%;background:#e3f6ea;display:flex;align-items:center;justify-content:center}
.phone .lbl{text-align:center;color:#3f8f5a;font-weight:700;font-size:20px;margin-top:16px}
.phone .val{text-align:center;font-family:'Montserrat';font-weight:900;font-size:46px;letter-spacing:-.02em;margin-top:4px}
.phone .card{margin:22px 20px 0;background:#fff;border-radius:22px;padding:6px 20px}
.phone .row{display:flex;justify-content:space-between;padding:13px 0;font-size:16.5px;border-bottom:1px solid #eef0f4}
.phone .row:last-child{border:0}
.phone .row span{color:#6b7385}
.phone .row b{font-weight:700}
.phone .warn{margin:18px 20px 0;background:#ffe5e5;color:#b80c12;border-radius:20px;padding:18px;display:flex;gap:12px;align-items:center;font-weight:800;font-size:18px;line-height:1.25}
.phone .glare{position:absolute;inset:0;border-radius:50px;background:linear-gradient(115deg,rgba(255,255,255,.3) 0%,rgba(255,255,255,0) 28%,rgba(255,255,255,0) 70%,rgba(255,255,255,.1) 100%)}
.carimbo{font-family:'Montserrat';font-weight:900;color:var(--red2);border:8px solid var(--red2);border-radius:18px;padding:6px 26px;font-size:76px;letter-spacing:.06em;
  text-transform:uppercase;background:rgba(9,9,11,.35);box-shadow:0 0 40px rgba(227,22,30,.35)}
`;

// ---------------------------------------------------------------------------
// componentes
// ---------------------------------------------------------------------------
const svgForm = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>`;
const svgDown = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
const svgAlerta = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`;
const svgCheck = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

const tag = (t) => `<div class="tag"><i></i>${t}</div>`;
const bancos = (rotulo = '') => `<div class="bancos">${rotulo ? `<span>${rotulo}</span>` : ''}<div class="s"><img src="${LOGO.santanderBranco}"></div><img class="i" src="${LOGO.itauSolido}"></div>`;
const cta = () => `<div class="cta"><div class="ico">${svgForm(42, '#fff')}</div><div><b>${CONFIG.cta}</b><span>${CONFIG.ctaSub}</span></div><div class="seta">${svgDown(46, '#fff')}</div></div>`;
const rodape = (fonte = '') => `<div class="foot"><b>${CONFIG.escritorio} · ${CONFIG.oab}</b><small>${fonte ? fonte + ' ' : ''}${CONFIG.disclaimer}</small></div>`;

// Logos grandes ao fundo, escurecidos (bem reconhecíveis, sem brigar com o texto).
const fundoLogos = (f, { s, i }) => `
  <img class="bg-logo" src="${LOGO.santander}" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;opacity:${s.o};transform:rotate(${s.r}deg)">
  <img class="bg-logo" src="${LOGO.itauSolido}" style="left:${i.x}px;top:${i.y}px;width:${i.w}px;opacity:${i.o};transform:rotate(${i.r}deg)">
  <div class="veu" style="background:linear-gradient(180deg,rgba(9,9,11,.55),rgba(9,9,11,.25) 45%,rgba(9,9,11,.7))"></div>`;

const celular = () => `
  <div class="phone"><div class="scr">
    <div class="island"></div>
    <div class="sb"><span>03:12</span><span>●●●</span></div>
    <div class="top">Comprovante</div>
    <div class="ok">${svgCheck(54, '#2f8a4f')}</div>
    <div class="lbl">Pix enviado com sucesso</div>
    <div class="val">${CONFIG.valor}</div>
    <div class="card">
      <div class="row"><span>Para</span><b>Destinatário desconhecido</b></div>
      <div class="row"><span>Data</span><b>Hoje, 03:12</b></div>
      <div class="row"><span>Situação</span><b>Concluída</b></div>
    </div>
    <div class="warn">${svgAlerta(30, '#b80c12')}<span>Você não autorizou<br>esta transferência.</span></div>
    <div class="glare"></div>
  </div></div>`;

// ---------------------------------------------------------------------------
// 01 · PRAZO — 80 dias do MED: urgência
// ---------------------------------------------------------------------------
function prazo(f) {
  const st = f.id === 'stories';
  return `
  <div class="cv" style="width:${f.w}px;height:${f.h}px">
    ${fundoLogos(f, {
      s: { x: 330, y: st ? 360 : 70, w: 1250, o: 0.5, r: -10 },
      i: { x: 640, y: st ? 1120 : 800, w: 500, o: 0.42, r: -10 },
    })}
    <div class="col" style="top:${f.top}px;bottom:${f.bottom}px;justify-content:space-between">
      <div style="display:flex;flex-direction:column;gap:${st ? 34 : 26}px">
        ${tag('Alerta · Golpe do PIX')}
        <div class="serif" style="font-size:${st ? 104 : 90}px">Sofreu um golpe do<br><em>PIX</em> nesses bancos?</div>
        ${bancos()}
      </div>
      <div style="display:flex;align-items:center;gap:36px;padding:${st ? 40 : 26}px 0;border-top:2px solid var(--line);border-bottom:2px solid var(--line)">
        <div class="serif" style="font-size:${st ? 290 : 250}px;color:var(--red2);line-height:.8;letter-spacing:-.04em">80</div>
        <div>
          <div style="font-family:'Montserrat';font-weight:900;font-size:${st ? 46 : 40}px;letter-spacing:.12em">DIAS</div>
          <div style="font-size:${st ? 30 : 27}px;line-height:1.35;color:#d4d4d8;margin-top:8px">é o prazo do Banco Central para pedir a devolução do PIX pelo MED.</div>
          <div style="font-size:${st ? 30 : 27}px;line-height:1.35;font-weight:700;color:#fff;margin-top:10px">Depois disso, esse pedido não é mais aceito.</div>
        </div>
      </div>
      <div style="font-family:'Playfair';font-style:italic;font-weight:700;font-size:${st ? 44 : 38}px;line-height:1.2">Cada dia parado é um dia a menos para agir.</div>
      <div style="display:flex;flex-direction:column;gap:${st ? 26 : 20}px">
        ${cta()}
        ${rodape('Fonte: Banco Central do Brasil (MED).')}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 02 · NEGOU — o banco negou a devolução? Súmula 479 do STJ: autoridade
// ---------------------------------------------------------------------------
function negou(f) {
  const st = f.id === 'stories';
  return `
  <div class="cv" style="width:${f.w}px;height:${f.h}px">
    ${fundoLogos(f, {
      s: { x: -260, y: st ? 560 : 300, w: 1300, o: 0.45, r: 8 },
      i: { x: 640, y: st ? 1240 : 900, w: 560, o: 0.45, r: -10 },
    })}
    <div class="col" style="top:${f.top}px;bottom:${f.bottom}px;justify-content:space-between">
      <div style="display:flex;flex-direction:column;gap:${st ? 34 : 24}px">
        ${tag('Vítima de golpe do PIX')}
        <div class="serif" style="font-size:${st ? 112 : 96}px">O banco <em>negou</em><br>a devolução<br>do seu PIX?</div>
        ${bancos('Clientes')}
      </div>
      <div style="border-left:8px solid var(--red);background:rgba(255,255,255,.06);border-radius:0 18px 18px 0;padding:${st ? 38 : 28}px ${st ? 40 : 34}px">
        <div style="font-family:'Playfair';font-style:italic;font-weight:700;font-size:${st ? 34 : 29}px;line-height:1.38;color:#fff">“${CONFIG.sumula479}”</div>
        <div style="margin-top:16px;font-weight:700;font-size:${st ? 22 : 20}px;letter-spacing:.14em;text-transform:uppercase;color:var(--red2)">Súmula 479 · Superior Tribunal de Justiça</div>
      </div>
      <div style="font-size:${st ? 36 : 32}px;line-height:1.3;font-weight:700">Não aceite a resposta do banco<br>antes de falar com um advogado.</div>
      <div style="display:flex;flex-direction:column;gap:${st ? 26 : 20}px">
        ${cta()}
        ${rodape()}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 03 · SUMIU — o dinheiro saiu em segundos: perda e rastreio
// ---------------------------------------------------------------------------
function sumiu(f) {
  const st = f.id === 'stories';
  const k = st ? 0.7 : 0.6;
  const px = st ? 652 : 650, py = st ? 600 : 290;
  return `
  <div class="cv" style="width:${f.w}px;height:${f.h}px">
    ${fundoLogos(f, {
      s: { x: -320, y: st ? 1050 : 760, w: 1250, o: 0.42, r: -8 },
      i: { x: 640, y: st ? 230 : 0, w: 520, o: 0.42, r: 10 },
    })}
    <div style="position:absolute;left:${px - 120}px;top:${py - 80}px;width:${400 * k + 240}px;height:${820 * k + 160}px;background:radial-gradient(closest-side,rgba(227,22,30,.35),transparent)"></div>
    <div class="esc" style="transform:translate(${px}px,${py}px) rotate(5deg) scale(${k})">${celular()}</div>
    <div class="abs" style="left:${px - 40}px;top:${py + 820 * k * 0.6}px;transform:rotate(-14deg)"><div class="carimbo" style="font-size:${st ? 70 : 60}px">Golpe</div></div>
    <div class="col" style="top:${f.top}px;bottom:${f.bottom}px;justify-content:space-between">
      <div style="display:flex;flex-direction:column;gap:${st ? 34 : 24}px;max-width:${st ? 540 : 520}px">
        ${tag('Atenção')}
        <div class="serif" style="font-size:${st ? 100 : 90}px">Seu dinheiro sumiu em <em>segundos.</em></div>
        <div style="font-size:${st ? 34 : 30}px;line-height:1.32;color:#d4d4d8">Quanto mais tempo passa, <b style="color:#fff">mais difícil fica rastrear o valor.</b></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:${st ? 26 : 20}px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:${st ? 30 : 22}px;border-top:2px solid var(--line)">
          <div class="serif" style="font-size:${st ? 50 : 44}px;line-height:1.08">Sofreu um golpe do <em>PIX</em><br>nesses bancos?</div>
          ${bancos()}
        </div>
        ${cta()}
        ${rodape()}
      </div>
    </div>
  </div>`;
}

const CONCEITOS = [
  ['01-prazo-80-dias', prazo],
  ['02-banco-negou', negou],
  ['03-dinheiro-sumiu', sumiu],
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
      // aviso se algum bloco estourar a área do canvas
      const estouro = await page.evaluate(() => [...document.querySelectorAll('.col')].some((c) => c.scrollHeight > c.clientHeight + 1));
      if (estouro) console.warn('  ! conteúdo excede a área segura em', arquivo);
      await page.screenshot({ path: path.join(pngDir, `${arquivo}.png`), clip: { x: 0, y: 0, width: f.w, height: f.h } });
      await page.close();
      console.log('ok', arquivo);
    }
  }
  await browser.close();
})();
