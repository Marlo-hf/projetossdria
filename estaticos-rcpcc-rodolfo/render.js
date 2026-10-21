const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of ['rcpcc-01-bola-de-neve', 'rcpcc-02-venda-casada', 'rcpcc-03-tres-erros']) {
    await p.goto('file://' + path.join(__dirname, f + '.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(__dirname, f + '.png') });
  }
  await b.close();
})();
