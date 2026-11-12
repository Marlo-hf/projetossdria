// Renderiza os estáticos HTML em PNG 1080x1350 (feed 4:5).
// Uso: node render.js            -> renderiza todos os estatico-*.html desta pasta
//      node render.js arquivo.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = __dirname;
  const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : fs.readdirSync(dir).filter(f => /^estatico-.*\.html$/.test(f));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const f of files) {
    const src = path.resolve(dir, f);
    await page.goto('file://' + src, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = src.replace(/\.html$/, '.png');
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    console.log('ok', path.basename(out));
  }
  await browser.close();
})();
