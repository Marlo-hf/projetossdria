// Gera os PNGs do criativo: node criativo-andrade/render.js
const { chromium } = require('playwright');
const path = require('path');
const VARIANTES = [
  { out: 'andrade-rj-1080x1350.png', q: '', h: 1350 },
  { out: 'andrade-rj-1080x1920.png', q: '?f=916', h: 1920 },
];
(async () => {
  const b = await chromium.launch();
  for (const v of VARIANTES) {
    const p = await b.newPage({ viewport: { width: 1080, height: v.h } });
    await p.goto('file://' + path.join(__dirname, 'criativo.html') + v.q, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    console.log(v.out, JSON.stringify(await p.evaluate(() => window.check())));
    await p.screenshot({ path: path.join(__dirname, v.out) });
    await p.close();
  }
  await b.close();
})();
