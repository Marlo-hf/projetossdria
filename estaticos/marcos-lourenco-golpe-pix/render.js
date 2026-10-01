// Renderiza os estáticos (src/*.html) em PNG 1080x1350 na pasta png/.
// Uso: node render.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const src = path.join(__dirname, 'src');
  const out = path.join(__dirname, 'png');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const file of fs.readdirSync(src).filter(f => f.endsWith('.html')).sort()) {
    await page.goto('file://' + path.join(src, file), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const dest = path.join(out, file.replace('.html', '.png'));
    await page.screenshot({ path: dest });
    console.log('ok', dest);
  }
  await browser.close();
})();
