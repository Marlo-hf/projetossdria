// Renderiza cada HTML de src/ em PNG 1080x1350 (feed 4:5) dentro de png/.
// Uso: node render.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const src = path.join(__dirname, 'src');
  const out = path.join(__dirname, 'png');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.html')).sort()) {
    await page.goto('file://' + path.join(src, f), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const png = path.join(out, f.replace(/\.html$/, '.png'));
    await page.screenshot({ path: png });
    console.log('ok', png);
  }
  await browser.close();
})();
