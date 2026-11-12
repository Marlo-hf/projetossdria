// Renderiza os estáticos HTML em PNG. Uso: node render.js [largura] [altura] [sufixo]
const { chromium } = require('playwright');
const path = require('path');
const W = parseInt(process.argv[2] || '1080', 10);
const H = parseInt(process.argv[3] || '1350', 10);
const suf = process.argv[4] || '4x5';
const pecas = (process.argv[5] ? process.argv[5].split(',') : ['estatico-01-notificacoes', 'estatico-02-refem-do-banco']);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const p of pecas) {
    await page.goto('file://' + path.join(__dirname, p + '.html') + '?h=' + H);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const sh = await page.evaluate(() => Math.max(...[...document.querySelectorAll('body *')].map(e => e.getBoundingClientRect().bottom)));
    console.log(p, 'conteúdo termina em', Math.round(sh), 'de', H);
    const out = path.join(__dirname, '..', `${p}-${suf}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
    console.log('ok', out);
  }
  await browser.close();
})();
