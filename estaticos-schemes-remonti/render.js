// Gera os PNGs: node render.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const file = 'file://' + path.resolve(__dirname, 'estatico.html');
  for (const p of ['gregory', 'andiara']) {
    for (const [f, h, name] of [['feed', 1350, 'feed-4x5'], ['story', 1920, 'stories-9x16']]) {
      await page.setViewportSize({ width: 1080, height: h });
      await page.goto(`${file}?p=${p}&f=${f}`);
      await page.waitForSelector('body[data-ready]');
      const out = path.join(__dirname, `${p}-${name}.png`);
      await page.locator('#canvas').screenshot({ path: out });
      console.log('ok', out);
    }
  }
  await browser.close();
})();
