// Gera os PNGs do criativo: node render.js
const { chromium } = require('playwright');
const path = require('path');
const VARIANTES = [
  { out: 'andrade-passivos-1080x1920.png', q: '', h: 1920 },
  { out: 'andrade-passivos-1080x1350.png', q: '?f=45', h: 1350 },
  { out: 'andrade-passivos-dourado-1080x1920.png', q: '?tema=dourado', h: 1920 },
  { out: 'andrade-passivos-dourado-1080x1350.png', q: '?f=45&tema=dourado', h: 1350 },
];
(async () => {
  const b = await chromium.launch();
  for (const v of VARIANTES) {
    const p = await b.newPage({ viewport: { width: 1080, height: v.h } });
    await p.goto('file://' + path.join(__dirname, 'criativo.html') + v.q, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const h1 = await p.evaluate(() => window.fit());
    console.log(v.out, 'h1 =', h1);
    const overflow = await p.evaluate(() => {
      const c = document.querySelector('.cta').getBoundingClientRect();
      return c.bottom > window.innerHeight ? c.bottom - window.innerHeight : 0;
    });
    if (overflow) console.warn(v.out, 'CTA estoura em', overflow, 'px');
    await p.screenshot({ path: path.join(__dirname, v.out) });
    await p.close();
  }
  await b.close();
})();
