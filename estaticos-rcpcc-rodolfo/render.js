const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of ['rcpcc-01-filtro', 'rcpcc-02-parcelamento', 'rcpcc-03-caminho']) {
    await p.goto('file://' + path.join(__dirname, f + '.html'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(__dirname, f + '.png') });
  }
  await b.close();
})();
