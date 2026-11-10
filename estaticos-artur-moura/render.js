// Renderiza os estáticos em PNG nos tamanhos do Meta Ads.
// Uso: node render.js            -> gera png/*.png
const { chromium } = require('playwright');
const path = require('path');

const PECAS = [
  { html: 'estatico-pronampe.html', nome: 'artur-moura-pronampe' },
];
const FORMATOS = [
  { cls: 'feed', w: 1080, h: 1350, sufixo: 'feed-1080x1350' },
  { cls: 'story', w: 1080, h: 1920, sufixo: 'stories-1080x1920' },
];

(async () => {
  const browser = await chromium.launch();
  for (const peca of PECAS) {
    for (const f of FORMATOS) {
      const page = await browser.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
      await page.goto('file://' + path.join(__dirname, peca.html), { waitUntil: 'networkidle' });
      await page.evaluate((cls) => { document.body.className = cls; }, f.cls);
      await page.evaluate(() => document.fonts.ready);
      // avisa se o conteúdo passou da altura do formato
      const sobra = await page.evaluate(() => {
        const ad = document.querySelector('.ad').getBoundingClientRect();
        const cta = document.querySelector('.cta').getBoundingClientRect();
        return Math.round(ad.bottom - cta.bottom);
      });
      const out = path.join(__dirname, 'png', `${peca.nome}-${f.sufixo}.png`);
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: f.w, height: f.h } });
      console.log(`${out}  (espaço abaixo do botão: ${sobra}px)`);
      await page.close();
    }
  }
  await browser.close();
})();
