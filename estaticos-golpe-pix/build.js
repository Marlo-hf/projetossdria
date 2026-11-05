// Gera os estáticos "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)
// Linha "feito à mão": papel, marca-texto, caneta, caderno e texto nativo de Stories.
// Uso:  node build.js   → gera png/*.png (e html/*.html para conferência)
// Edite o bloco CONFIG (nome do escritório, OAB, textos) e rode de novo.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIG = {
  escritorio: 'Nome do Escritório Advocacia',
  oab: 'OAB/UF 00.000',
  cta: 'Preencha o formulário abaixo',
  disclaimer: 'Conteúdo informativo. Sem vínculo com as instituições citadas; marcas pertencentes aos seus titulares.',
  // Dado verificado em bcb.gov.br: pedido de devolução pelo MED em até 80 dias após o Pix.
};

const FORMATOS = [
  { id: 'feed', w: 1080, h: 1350, top: 70, bottom: 64 },
  { id: 'stories', w: 1080, h: 1920, top: 250, bottom: 290 }, // zonas seguras de Stories/Reels
];

const ROOT = __dirname;
const A = (p) => 'file://' + path.join(ROOT, 'assets', p);
const LOGO = { santander: A('logos/santander.svg'), itau: A('logos/itau.svg') };
const FOTO_MESA = path.join(ROOT, 'assets', 'foto', 'mesa.jpg');

const fonte = (fam, arq, w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${A('fonts/' + arq)}') format('woff2')}`;
const ruido = (alpha) => `url('data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
).replace(/'/g, '%27')}')`;

const BASE_CSS = `
${[500, 600, 700, 800, 900].map((w) => fonte('Archivo', `archivo-latin-${w}-normal.woff2`, w)).join('\n')}
${[400, 500, 600, 700].map((w) => fonte('Inter', `inter-latin-${w}-normal.woff2`, w)).join('\n')}
${fonte('Caveat', 'caveat-latin-700-normal.woff2', 700)}
${fonte('Marker', 'permanent-marker-latin-400-normal.woff2', 400)}
:root{--ink:#111;--pen:#d4141c;--blue:#1b2f7a;--hl:#ffe24a}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Archivo',sans-serif;-webkit-font-smoothing:antialiased;color:var(--ink)}
.cv{position:relative;overflow:hidden}
.col{position:absolute;left:72px;right:72px;display:flex;flex-direction:column}
.rel{position:relative}
.abs{position:absolute}
.svg{position:absolute;overflow:visible;pointer-events:none}
.mao{font-family:'Caveat',cursive;font-weight:700;line-height:1}
.h{font-weight:900;letter-spacing:-.035em;line-height:.98}
.mt{position:relative;display:inline-block;z-index:0}
.mt:before{content:'';position:absolute;z-index:-1;left:-.08em;right:-.1em;top:.12em;bottom:.02em;background:var(--hl);
  transform:rotate(-1.2deg) skewX(-6deg);border-radius:.08em .18em .1em .2em;opacity:.92}
.colado{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.18),0 10px 24px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center}
.fita{position:absolute;width:150px;height:46px;background:rgba(236,226,196,.82);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.barra{display:flex;align-items:center;justify-content:space-between;background:var(--ink);color:#fff;padding:26px 34px;font-weight:800;letter-spacing:-.01em}
.foot{font-family:'Inter';font-size:17px;line-height:1.35;color:#555}
.foot b{font-family:'Archivo';font-weight:800;font-size:21px;color:var(--ink);display:block}
.foot small{display:block;font-size:14.5px;margin-top:3px}
`;

// ---------------------------------------------------------------------------
// traços "à mão" (determinísticos, com leve tremido)
// ---------------------------------------------------------------------------
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const suave = (pts) => {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};
// círculo de caneta em volta de uma área (w x h), que não fecha perfeitamente
function circulo({ x, y, w, h, cor = 'var(--pen)', esp = 7, seed = 3 }) {
  const r = rng(seed), cx = w / 2, cy = h / 2, pts = [];
  const a0 = -2.3, total = Math.PI * 2 + 0.55;
  for (let t = 0; t <= total; t += 0.22) {
    const k = 1 + (r() - 0.5) * 0.05 + (t / total) * 0.06;
    pts.push([cx + Math.cos(a0 + t) * (w / 2) * k, cy + Math.sin(a0 + t) * (h / 2) * k]);
  }
  return `<svg class="svg" style="left:${x}px;top:${y}px" width="${w}" height="${h}"><path d="${suave(pts)}" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
// sublinhado rabiscado (duas passadas)
function sublinha({ x, y, w, cor = 'var(--pen)', esp = 6, seed = 7 }) {
  const r = rng(seed), ida = [], volta = [];
  for (let i = 0; i <= 6; i++) ida.push([(w * i) / 6, (r() - 0.5) * 6]);
  for (let i = 6; i >= 2; i--) volta.push([(w * i) / 6 - 8, 6 + (r() - 0.5) * 4]);
  return `<svg class="svg" style="left:${x}px;top:${y}px" width="${w}" height="20"><path d="${suave(ida.concat(volta))}" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const check = (s, cor = 'var(--blue)') => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" style="overflow:visible"><path d="M6,21 C10,24 13,28 16,33 C21,22 28,12 37,4" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const caixa = (s, cor = 'var(--blue)') => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" style="overflow:visible"><path d="M4,6 C14,4 26,5 36,4 C37,15 36,26 37,36 C26,37 15,35 5,37 C4,27 5,16 4,6" fill="none" stroke="${cor}" stroke-width="3.4" stroke-linecap="round"/></svg>`;
const setaBaixo = (s, cor) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" style="overflow:visible"><path d="M20,4 C19,15 21,26 20,35 M9,25 C13,29 17,32 20,36 C24,31 27,28 31,24" fill="none" stroke="${cor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const rodape = () => `<div class="foot"><b>${CONFIG.escritorio} · ${CONFIG.oab}</b><small>${CONFIG.disclaimer}</small></div>`;
const barraCTA = (st) => `<div class="barra" style="font-size:${st ? 40 : 36}px"><span>${CONFIG.cta}</span>${setaBaixo(st ? 48 : 44, 'var(--hl)')}</div>`;

// ---------------------------------------------------------------------------
// 01 · MARCA-TEXTO — papel, logos recortados, círculo de caneta e marca-texto
// ---------------------------------------------------------------------------
function marcaTexto(f) {
  const st = f.id === 'stories';
  const sw = st ? 520 : 470, iw = st ? 196 : 176, lh = st ? 196 : 176;
  return `
  <div class="cv" style="width:${f.w}px;height:${f.h}px;background:${ruido(0.07)},radial-gradient(120% 90% at 50% 30%,#f8f4ea,#e4dccb)">
    <div class="col" style="top:${f.top}px;bottom:${f.bottom}px;justify-content:space-between">
      <div class="rel" style="height:${lh + 90}px;margin-top:20px">
        <div class="abs colado" style="left:10px;top:28px;width:${sw}px;height:${lh - 30}px;transform:rotate(-2.5deg)"><img src="${LOGO.santander}" style="width:${sw - 70}px"></div>
        <div class="abs colado" style="left:${sw + 60}px;top:6px;width:${iw + 24}px;height:${iw + 24}px;transform:rotate(3deg)"><img src="${LOGO.itau}" style="width:${iw}px"></div>
        ${circulo({ x: -36, y: -26, w: sw + iw + 150, h: lh + 110, seed: 11 })}
        <div class="mao abs" style="right:-6px;top:${lh + 50}px;color:var(--pen);font-size:${st ? 58 : 52}px;transform:rotate(-5deg)">foi em um desses?</div>
      </div>
      <div class="h" style="font-size:${st ? 128 : 112}px">Sofreu um<br><span class="mt">golpe do Pix</span><br>nesses bancos?</div>
      <div style="font-weight:600;font-size:${st ? 38 : 34}px;line-height:1.3;letter-spacing:-.01em;color:#222">
        Você tem até <span class="rel" style="font-weight:900;white-space:nowrap">80 dias${sublinha({ x: -4, y: st ? 38 : 34, w: st ? 128 : 116, seed: 5, esp: 5 })}</span> para pedir a devolução pelo MED. Depois disso, o pedido não é mais aceito.
      </div>
      <div style="display:flex;flex-direction:column;gap:${st ? 24 : 18}px">
        ${barraCTA(st)}
        ${rodape()}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 02 · STORIES NATIVO — foto real de mesa + texto e adesivos no estilo do Instagram
// ---------------------------------------------------------------------------
function storyNativo(f) {
  const st = f.id === 'stories';
  const fs1 = st ? 64 : 58, fs2 = st ? 42 : 38;
  const linha = (t, tam, bg, cor) => `<span style="display:inline-block;background:${bg};color:${cor};font-family:'Inter';font-weight:700;font-size:${tam}px;line-height:1.15;padding:${tam * 0.16}px ${tam * 0.3}px;border-radius:${tam * 0.22}px;letter-spacing:-.01em;margin-top:-1px">${t}</span>`;
  const bloco = (linhas, tam, bg, cor) => `<div style="display:flex;flex-direction:column;align-items:flex-start">${linhas.map((t) => linha(t, tam, bg, cor)).join('')}</div>`;
  const foto = fs.existsSync(FOTO_MESA) ? `url('file://${FOTO_MESA}') ${st ? '58%' : '55%'} center/cover` : '#2b2622';
  return `
  <div class="cv" style="width:${f.w}px;height:${f.h}px;background:${foto}">
    <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 38%,rgba(0,0,0,.25) 62%,rgba(0,0,0,.6))"></div>
    <div class="col" style="top:${f.top}px;bottom:${f.bottom}px;justify-content:space-between;left:64px;right:64px">
      <div style="display:flex;flex-direction:column;gap:${st ? 36 : 26}px">
        ${bloco(['Sofreu um golpe do Pix', 'nesses bancos?'], fs1, '#fff', '#111')}
        <div class="rel" style="height:${st ? 230 : 200}px">
          <div class="abs" style="left:0;top:20px;background:#fff;border-radius:26px;padding:24px 34px;transform:rotate(-4deg);box-shadow:0 8px 24px rgba(0,0,0,.35)"><img src="${LOGO.santander}" style="width:${st ? 400 : 360}px;display:block"></div>
          <div class="abs" style="left:${st ? 520 : 470}px;top:0;background:#fff;border-radius:44px;padding:16px;transform:rotate(5deg);box-shadow:0 8px 24px rgba(0,0,0,.35)"><img src="${LOGO.itau}" style="width:${st ? 180 : 160}px;display:block"></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:${st ? 30 : 24}px">
        ${bloco(['O banco negou a devolução?', 'Você tem até 80 dias para', 'pedir o MED. Não deixe passar.'], fs2, 'rgba(0,0,0,.82)', '#fff')}
        <div style="align-self:flex-start;display:flex;align-items:center;gap:16px;background:#fff;border-radius:16px;padding:20px 30px;box-shadow:0 8px 24px rgba(0,0,0,.35)">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c7be5" stroke-width="2.6" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>
          <span style="font-family:'Inter';font-weight:700;font-size:${st ? 36 : 33}px;color:#2c7be5;text-transform:uppercase;letter-spacing:.01em">${CONFIG.cta}</span>
        </div>
        <div class="foot" style="color:rgba(255,255,255,.85)"><b style="color:#fff">${CONFIG.escritorio} · ${CONFIG.oab}</b><small>${CONFIG.disclaimer}</small></div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 03 · CADERNO — checklist escrito à mão em folha pautada, logos presos com fita
// ---------------------------------------------------------------------------
function caderno(f) {
  const st = f.id === 'stories';
  const pauta = st ? 66 : 58;
  const itens = [
    ['Registrar o boletim de ocorrência', true],
    ['Pedir o MED no banco (até 80 dias)', true],
    ['Guardar comprovantes e conversas', true],
    ['Falar com um advogado especialista', false],
  ];
  const fsI = st ? 58 : 50;
  return `
  <div class="cv" style="width:${f.w}px;height:${f.h}px;background:${ruido(0.06)},
      linear-gradient(90deg,transparent 104px,rgba(212,20,28,.45) 104px,rgba(212,20,28,.45) 107px,transparent 107px),
      repeating-linear-gradient(180deg,transparent 0 ${pauta - 2}px,rgba(40,90,170,.22) ${pauta - 2}px ${pauta}px),#fdfcf8">
    <div class="col" style="top:${f.top}px;bottom:${f.bottom}px;left:140px;right:64px;justify-content:space-between">
      <div class="rel">
        <div class="h" style="font-size:${st ? 96 : 84}px;max-width:${st ? 600 : 560}px">Sofreu um golpe do Pix nesses bancos?</div>
        <div class="abs" style="right:-8px;top:${st ? 0 : -6}px;width:${st ? 300 : 270}px">
          <div class="rel colado" style="height:${st ? 120 : 106}px;transform:rotate(4deg)"><img src="${LOGO.santander}" style="width:82%"></div>
          <div class="fita" style="left:70px;top:-20px;transform:rotate(-6deg)"></div>
          <div class="rel colado" style="width:${st ? 170 : 150}px;height:${st ? 170 : 150}px;margin:${st ? 36 : 30}px 0 0 ${st ? 80 : 70}px;transform:rotate(-5deg)"><img src="${LOGO.itau}" style="width:84%"></div>
          <div class="fita" style="left:${st ? 120 : 108}px;top:${st ? 160 : 140}px;width:110px;transform:rotate(8deg)"></div>
        </div>
      </div>
      <div>
        <div class="mao" style="color:var(--pen);font-size:${st ? 70 : 60}px;transform:rotate(-2deg);margin-bottom:${st ? 18 : 10}px">Faça isso agora:</div>
        ${itens.map(([t, ok], i) => `
          <div class="rel" style="display:flex;align-items:center;gap:22px;height:${pauta * (st ? 1.5 : 1.45)}px">
            <div class="rel" style="flex:none;width:${fsI * 0.7}px;height:${fsI * 0.7}px">${caixa(fsI * 0.7)}${ok ? `<div class="abs" style="left:2px;top:-10px">${check(fsI * 0.75)}</div>` : ''}</div>
            <div class="mao" style="font-size:${fsI}px;color:var(--blue)">${t}</div>
            ${!ok ? circulo({ x: -24, y: -14, w: (st ? 880 : 790), h: pauta * 1.6, seed: 21 + i, esp: 6 }) : ''}
          </div>`).join('')}
        <div class="mao" style="color:var(--pen);font-size:${st ? 56 : 50}px;margin:${st ? 22 : 14}px 0 0 ${st ? 360 : 330}px;transform:rotate(-3deg)">↑ não deixe pra depois</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:${st ? 24 : 18}px">
        ${barraCTA(st)}
        <div style="background:#fdfcf8;padding:6px 0">${rodape()}</div>
      </div>
    </div>
  </div>`;
}

const CONCEITOS = [
  ['01-marca-texto', marcaTexto],
  ['02-stories-nativo', storyNativo],
  ['03-caderno', caderno],
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
      const estouro = await page.evaluate(() => [...document.querySelectorAll('.col')].some((c) => c.scrollHeight > c.clientHeight + 1));
      if (estouro) console.warn('  ! conteúdo excede a área segura em', arquivo);
      await page.screenshot({ path: path.join(pngDir, `${arquivo}.png`), clip: { x: 0, y: 0, width: f.w, height: f.h } });
      await page.close();
      console.log('ok', arquivo);
    }
  }
  await browser.close();
})();
