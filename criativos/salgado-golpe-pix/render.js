// Renderiza cada src/NN-*.html em PNG 4:5.
//   png/      -> 1080x1350 (tamanho padrão do feed)
//   png@2x/   -> 2160x2700 (alta definição, recomendado para subir no Meta)
// Uso: node render.js            (todos)
//      node render.js 01 03      (só os números indicados)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = __dirname;
  const only = process.argv.slice(2);
  const files = fs.readdirSync(path.join(root, 'src'))
    .filter(f => /^\d\d-.*\.html$/.test(f))
    .filter(f => !only.length || only.some(n => f.startsWith(n)));

  const browser = await chromium.launch();
  for (const scale of [1, 2]) {
    const outDir = path.join(root, scale === 1 ? 'png' : 'png@2x');
    fs.mkdirSync(outDir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: scale });
    for (const f of files) {
      await page.goto('file://' + path.join(root, 'src', f));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      const out = path.join(outDir, f.replace('.html', '.png'));
      await page.locator('.ad').screenshot({ path: out });
      console.log('ok', path.relative(root, out));
    }
    await page.close();
  }
  await browser.close();
})();
