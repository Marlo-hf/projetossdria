// Renderiza cada HTML de src/ em PNG 1080x1350 (feed 4:5).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const src = path.join(__dirname, 'src');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of fs.readdirSync(src).filter(f => f.endsWith('.html'))) {
    await page.goto('file://' + path.join(src, f), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(__dirname, f.replace('.html', '.png'));
    await page.screenshot({ path: out });
    console.log(out);
  }
  await browser.close();
})();
