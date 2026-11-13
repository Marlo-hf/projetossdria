// Renderiza os estáticos em PNG (4:5 = 1080x1350 e 9:16 = 1080x1920).
// Uso: node render.js            -> todos
//      node render.js pm05       -> só os que começam com "pm05"
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const out = path.join(dir, 'png');
fs.mkdirSync(out, { recursive: true });

const filtro = process.argv[2] || '';
const pecas = fs.readdirSync(dir).filter(f => /^ga\d+.*\.html$/.test(f) && f.startsWith(filtro));
const formatos = [
  { nome: '4x5', w: 1080, h: 1350, q: '' },
  { nome: '9x16', w: 1080, h: 1920, q: '?f=916' },
];

(async () => {
  const browser = await chromium.launch();
  for (const html of pecas) {
    for (const f of formatos) {
      const page = await browser.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
      await page.goto('file://' + path.join(dir, html) + f.q);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      const nome = `${html.replace('.html', '')}-${f.nome}.png`;
      await page.screenshot({ path: path.join(out, nome) });
      console.log('ok', nome);
      await page.close();
    }
  }
  await browser.close();
})();
