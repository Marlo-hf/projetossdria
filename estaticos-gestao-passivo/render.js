// Renderiza os estáticos HTML (1080x1350) em PNG dentro de ./png
// Uso: node render.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const files = fs.readdirSync(__dirname).filter(f => /^\d{2}-.*\.html$/.test(f)).sort();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of files) {
    await p.goto('file://' + path.join(__dirname, f), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const out = path.join(__dirname, 'png', f.replace('.html', '.png'));
    await p.screenshot({ path: out });
    console.log('ok', out);
  }
  await b.close();
})();
