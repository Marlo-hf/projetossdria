// Renderiza guia.html em PDF A4 e gera prévias PNG.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
  await p.goto('file://' + path.join(__dirname, 'guia.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: process.argv[2] || 'guia.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
