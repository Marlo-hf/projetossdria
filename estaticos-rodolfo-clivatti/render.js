// Renderiza os estáticos de estaticos.html em PNG 1080x1350 (feed 4:5).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'estaticos.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const nomes = { ad1: 'estatico-1-notificacoes-banco.png', ad2: 'estatico-2-checklist-empresa.png' };
  for (const [id, arq] of Object.entries(nomes)) {
    await p.locator('#' + id).screenshot({ path: path.join(__dirname, arq) });
    console.log('ok', arq);
  }
  await b.close();
})();
