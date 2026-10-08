// Gera um PDF vetorial (texto editável) de cada estático em pdf/, para importar no Canva.
// Uso: node render-pdf.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const src = path.join(__dirname, 'src');
  const out = path.join(__dirname, 'pdf');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.html')).sort()) {
    await page.goto('file://' + path.join(src, f), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const pdf = path.join(out, f.replace(/\.html$/, '.pdf'));
    await page.pdf({ path: pdf, width: '1080px', height: '1350px', printBackground: true, pageRanges: '1' });
    console.log('ok', pdf);
  }
  await browser.close();
})();
