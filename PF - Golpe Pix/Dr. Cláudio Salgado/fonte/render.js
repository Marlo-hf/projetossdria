// Renderiza cada HTML de fonte/html em PNG (fonte/../saida) com o Chromium headless do Playwright.
// Uso: node render.js            -> renderiza todos
//      node render.js 3_Prazo    -> renderiza só os arquivos que começam com "3_Prazo"
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HTML_DIR = path.join(__dirname, 'html');
const OUT_DIR = path.join(__dirname, '..', 'saida');
const SIZES = { '9x16': [1080, 1920], '1x1': [1080, 1080] };

(async () => {
  const filtro = process.argv[2] || '';
  const arquivos = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html') && f.startsWith(filtro)).sort();
  if (!arquivos.length) { console.error('Nenhum HTML encontrado.'); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  for (const f of arquivos) {
    const fmt = f.includes('_9x16') ? '9x16' : '1x1';
    const [w, h] = SIZES[fmt];
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto('file://' + path.join(HTML_DIR, f));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    // Aviso de texto vazando: qualquer elemento marcado com data-check que passe da página
    const vazando = await page.evaluate(([W, H]) => {
      const out = [];
      document.querySelectorAll('[data-check]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > W - 40 || r.bottom > H - 20 || r.left < 40 || r.top < 0) out.push(el.dataset.check + ' ' + JSON.stringify([Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]));
        if (el.scrollWidth > el.clientWidth + 2) out.push(el.dataset.check + ' overflow-x');
      });
      return out;
    }, [w, h]);
    const outFile = path.join(OUT_DIR, f.replace('.html', '.png'));
    await page.screenshot({ path: outFile, clip: { x: 0, y: 0, width: w, height: h } });
    console.log((vazando.length ? 'ATENCAO ' : 'ok      ') + path.basename(outFile) + (vazando.length ? '  -> ' + vazando.join(' | ') : ''));
    await page.close();
  }
  await browser.close();
})();
