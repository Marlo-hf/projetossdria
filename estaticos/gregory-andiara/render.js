// Renderiza os estáticos em PNG (3:4 = 1080x1440, igual aos que já rodam, e 9:16 = 1080x1920).
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
  { nome: '3x4', w: 1080, h: 1440, q: '' },
  { nome: '9x16', w: 1080, h: 1920, q: '?f=916' },
];

(async () => {
  const browser = await chromium.launch();
  for (const html of pecas) {
    for (const f of formatos) {
      const page = await browser.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
      await page.goto('file://' + path.join(dir, html) + f.q);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => document.body.dataset.ready === '1' || !document.querySelector('.fit'));
      await page.waitForTimeout(150);
      const nome = `${html.replace('.html', '')}-${f.nome}.png`;
      await page.screenshot({ path: path.join(out, nome) });
      console.log('ok', nome);
      await page.close();
    }
  }
  await browser.close();
})();
