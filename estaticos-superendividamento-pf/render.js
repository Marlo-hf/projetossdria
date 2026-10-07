// Renderiza cada estatico-*.html em PNG 1080x1350 (formato feed 4:5).
// Uso: NODE_PATH=$(npm root -g) node render.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of fs.readdirSync(__dirname).filter(n => /^estatico-.*\.html$/.test(n))) {
    await page.goto('file://' + path.join(__dirname, f));
    await page.screenshot({ path: path.join(__dirname, f.replace('.html', '.png')) });
    console.log('ok', f);
  }
  await browser.close();
})();
