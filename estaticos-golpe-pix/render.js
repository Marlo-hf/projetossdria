const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const n of [1, 2, 3, 4]) {
    await p.goto('file://' + path.join(__dirname, 'src', n + '.html'));
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(__dirname, `estatico-${n}.png`) });
  }
  await b.close();
})();
