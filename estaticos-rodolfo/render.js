// Gera os PNGs dos estáticos (4:5, 1080x1350 em escala 2 = 2160x2700).
// Uso: node render.js
const { chromium } = require('playwright');
const path = require('path');

const arquivos = ['01-black-friday', '02-pouso-planejado'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const nome of arquivos) {
    await page.goto('file://' + path.join(__dirname, nome + '.html'), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(__dirname, 'png', nome + '.png');
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    console.log('ok', out);
  }
  await browser.close();
})();
