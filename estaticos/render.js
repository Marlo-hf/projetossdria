// Renderiza cada criativo de estaticos.html em PNG 1080x1350 (feed 4:5).
const { chromium } = require('playwright');
const path = require('path');
const nomes = {
  p1: 'passivo-01-pergunta', p2: 'passivo-02-numero', p3: 'passivo-03-checklist',
  x1: 'pix-01-comprovante', x2: 'pix-02-tipos-de-golpe', x3: 'pix-03-cada-dia-conta',
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
  await p.goto('file://' + path.join(__dirname, 'estaticos.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  for (const [id, nome] of Object.entries(nomes)) {
    await p.locator('#' + id).screenshot({ path: path.join(__dirname, 'png', nome + '.png') });
  }
  await b.close();
})();
