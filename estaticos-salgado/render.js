// Renderiza cada HTML de src/ em png/ (1080x1350). Uso: node render.js [arquivo...]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const src = path.join(__dirname, 'src'), out = path.join(__dirname, 'png');
  const files = process.argv.slice(2).length ? process.argv.slice(2)
    : fs.readdirSync(src).filter(f => f.endsWith('.html'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const f of files) {
    await page.goto('file://' + path.join(src, path.basename(f)));
    await page.evaluate(() => document.fonts.ready);
    const png = path.join(out, path.basename(f, '.html') + '.png');
    await page.screenshot({ path: png });
    console.log('ok', png);
  }
  await browser.close();
})();
