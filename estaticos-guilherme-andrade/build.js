// Gera os estáticos do Dr. Guilherme Andrade no modelo JMA (José Moura).
// Uso: node build.js            -> gera todas as peças em 4:5 e 9:16 em ./saida
//      node build.js 03         -> gera só as peças cujo id começa com "03"
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { marca, micro, pecas } = require('./pecas');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'saida');
const TMP = path.join(ROOT, '.build');
const SCALE = 1.5; // 1080 -> 1620 px de largura final

const FORMATOS = {
  '4x5': { w: 1080, h: 1350 },
  '9x16': { w: 1080, h: 1920 },
};

function icone(nome) {
  const svg = fs.readFileSync(path.join(ROOT, 'icones', `${nome}.svg`), 'utf8');
  return svg.replace(/<!--.*?-->/s, '').replace(/class="[^"]*"/, 'class="ic"');
}

function manchete(txt) {
  return txt.replace(/\[(.+?)\]/g, '<mark>$1</mark>');
}

function html(p, fmt) {
  const { w, h } = FORMATOS[fmt];
  const itens = p.icones
    .map(([ic, label]) => {
      const simbolo = p.numeros ? `<span class="num">${ic}</span>` : icone(ic);
      return `<div class="item">${simbolo}<span class="lbl">${label}</span></div>`;
    })
    .join('');
  const seta = icone('arrow-right');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="../fonts/fonts.css">
<style>
  :root{
    --red:#d3121c; --red-btn:#c8101b; --cream:#f6f3ee; --ink:#141414; --grey:#6d6a66;
    --w:${w}px; --h:${h}px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:var(--w);height:var(--h);background:#0b0b0c;overflow:hidden}
  .ad{position:relative;width:var(--w);height:var(--h);overflow:hidden;font-family:'Red Hat Display',sans-serif;color:#fff}
  .bg{position:absolute;inset:0;background:url('../fotos/${p.foto}') ${p.fotoPos}/cover no-repeat;
      filter:grayscale(1) brightness(.55) contrast(1.15)}
  .shade{position:absolute;inset:0;background:
      linear-gradient(180deg,rgba(8,8,9,.96) 0%,rgba(8,8,9,.8) 12%,rgba(8,8,9,.35) 32%,rgba(8,8,9,.72) 52%,rgba(8,8,9,.8) 74%,rgba(8,8,9,.42) 100%)}
  .wrap{position:relative;height:100%;display:flex;flex-direction:column}

  /* logo */
  .logo{display:flex;align-items:center;justify-content:center;gap:26px;padding-top:var(--logo-top)}
  .logo .mono{font-family:'Source Serif 4',serif;font-weight:700;font-size:var(--mono);letter-spacing:-.02em;line-height:1}
  .logo .bar{width:2px;height:calc(var(--mono) * 1.2);background:rgba(255,255,255,.85)}
  .logo .nome{font-weight:500;font-size:var(--nome);letter-spacing:.14em;line-height:1.28}

  /* cartão creme */
  .card{margin:var(--card-top) 57px 0;background:var(--cream);color:var(--ink);padding:var(--card-pad);
        box-shadow:0 18px 40px rgba(0,0,0,.45)}
  .kicker{color:var(--red);font-weight:700;font-size:var(--kicker);letter-spacing:.11em;text-transform:uppercase;margin-bottom:var(--kicker-gap)}
  h1{font-family:'Source Serif 4',serif;font-weight:700;font-size:var(--h1);line-height:1.06;letter-spacing:-.022em;text-wrap:balance}
  h1 mark{white-space:nowrap;color:#fff;padding:0 .1em;margin:0 -.02em;box-decoration-break:clone;-webkit-box-decoration-break:clone;
          background:linear-gradient(180deg,transparent 0 .2em,var(--red) .2em calc(100% - .14em),transparent calc(100% - .14em))}
  .sub{text-wrap:pretty;margin-top:var(--sub-gap);font-weight:400;font-size:var(--sub);line-height:1.3;color:var(--grey)}

  /* bloco escuro */
  .dark{margin:var(--dark-top) 57px 0 62px;border-left:9px solid var(--red);padding:6px 0 0 34px}
  h2{font-weight:700;font-size:var(--h2);line-height:1.12;letter-spacing:-.005em;text-wrap:balance}
  .texto{text-wrap:pretty;margin-top:var(--texto-gap);font-weight:300;font-size:var(--texto);line-height:1.3;color:#ececec}
  .icons{display:grid;grid-template-columns:repeat(4,1fr);margin-top:var(--icons-gap)}
  .item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:0 6px;border-left:1px solid rgba(255,255,255,.32)}
  .item:first-child{border-left:0}
  .ic{width:var(--ic);height:var(--ic);color:var(--red);stroke-width:2.1;filter:drop-shadow(0 0 1px rgba(0,0,0,.3))}
  .num{width:var(--ic);height:var(--ic);border:3px solid var(--red);border-radius:50%;display:flex;align-items:center;justify-content:center;
       color:var(--red);font-family:'Source Serif 4',serif;font-weight:700;font-size:calc(var(--ic) * .6);line-height:1}
  .lbl{font-weight:400;font-size:var(--lbl);line-height:1.25;color:#fff}
  .rule{height:1px;background:rgba(255,255,255,.55);margin:var(--rule-gap) 0 0}
  .rodape{margin-top:18px;font-weight:400;font-size:var(--rodape);color:rgba(255,255,255,.88)}
  .cta{margin:var(--cta-gap) 0 0 -43px;width:calc(100% + 43px - var(--cta-cut));height:var(--cta-h);background:var(--red-btn);
       display:flex;align-items:center;justify-content:space-between;padding:0 40px 0 52px;
       font-weight:700;font-size:var(--cta);letter-spacing:.005em;box-shadow:0 10px 28px rgba(200,16,27,.35)}
  .cta .ic{color:#fff;width:calc(var(--cta) * 1.25);height:calc(var(--cta) * 1.25);stroke-width:2.2}
  .micro{margin:var(--micro-gap) 57px 0 62px;font-weight:500;font-size:var(--micro);color:rgba(255,255,255,.82);letter-spacing:.01em}

  /* 4:5 — feed */
  .f4x5 .card{margin-top:auto}
  .f4x5 .wrap{padding-bottom:var(--bottom-pad)}
  .f4x5 .micro{margin-bottom:auto}
  .f4x5{--bottom-pad:6px;--logo-top:36px;--mono:74px;--nome:22px;--card-top:30px;--card-pad:40px 44px 38px;--kicker:21px;--kicker-gap:14px;
        --h1:78px;--sub-gap:16px;--sub:30px;--dark-top:34px;--h2:46px;--texto-gap:14px;--texto:31px;--icons-gap:28px;
        --ic:54px;--lbl:22px;--rule-gap:26px;--rodape:18px;--cta-gap:22px;--cta-h:90px;--cta:34px;--cta-cut:110px;--micro-gap:16px;--micro:20px}
  /* 9:16 — stories/reels (topo ~250px e base ~340px livres de informação essencial) */
  .f9x16{--logo-top:150px;--mono:86px;--nome:26px;--card-top:44px;--card-pad:48px 48px 46px;--kicker:23px;--kicker-gap:16px;
         --h1:84px;--sub-gap:20px;--sub:33px;--dark-top:46px;--h2:52px;--texto-gap:18px;--texto:35px;--icons-gap:38px;
         --ic:60px;--lbl:24px;--rule-gap:34px;--rodape:20px;--cta-gap:28px;--cta-h:100px;--cta:37px;--cta-cut:90px;--micro-gap:20px;--micro:22px}
</style></head><body>
<div class="ad f${fmt}">
  <div class="bg"></div><div class="shade"></div>
  <div class="wrap">
    <header class="logo"><span class="mono">${marca.monograma}</span><span class="bar"></span>
      <span class="nome">${marca.linha1}<br>${marca.linha2}</span></header>
    <section class="card">
      <div class="kicker">${p.kicker}</div>
      <h1>${manchete(p.manchete)}</h1>
      <p class="sub">${p.sub}</p>
    </section>
    <section class="dark">
      <h2>${p.titulo}</h2>
      <p class="texto">${p.texto}</p>
      <div class="icons">${itens}</div>
      <div class="rule"></div>
      <p class="rodape">${p.rodape}</p>
      <div class="cta"><span>${p.cta}</span>${seta}</div>
    </section>
    <p class="micro">${micro}</p>
  </div>
</div></body></html>`;
}

(async () => {
  const filtro = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch();
  let problemas = 0;
  for (const p of pecas.filter((x) => !filtro || x.id.startsWith(filtro))) {
    for (const [fmt, { w, h }] of Object.entries(FORMATOS)) {
      const file = path.join(TMP, `${p.id}-${fmt}.html`);
      fs.writeFileSync(file, html(p, fmt));
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: SCALE });
      await page.goto('file://' + file);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      // checagem: tudo dentro da área útil do formato
      const fim = await page.evaluate(() => document.querySelector('.micro').getBoundingClientRect().bottom);
      const limite = fmt === '9x16' ? h - 300 : h - 18;
      const linhasH1 = await page.evaluate(() => {
        const el = document.querySelector('h1');
        return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
      });
      const ok = fim <= limite;
      if (!ok) problemas++;
      const nome = `GA-${p.id}-${fmt}.jpg`;
      await page.screenshot({ path: path.join(OUT, nome), type: 'jpeg', quality: 93 });
      console.log(`${ok ? 'ok ' : 'EXCEDE'} ${nome}  fim=${Math.round(fim)}/${limite}  h1=${linhasH1} linhas`);
      await page.close();
    }
  }
  await browser.close();
  if (problemas) process.exitCode = 1;
})();
