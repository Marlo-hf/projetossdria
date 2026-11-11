// Gera os PNGs dos estáticos: feed 4:5 (1080x1350) e stories/reels 9:16 (1080x1920).
// Uso: node render.js            → todos
//      node render.js estatico-1 → só os arquivos que contêm "estatico-1"
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const out = path.join(dir, 'png');
const filtro = process.argv[2] || '';
const formatos = [
  { nome: 'feed-4x5', query: '', w: 1080, h: 1350 },
  { nome: 'stories-9x16', query: '?f=story', w: 1080, h: 1920 },
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const arquivos = fs.readdirSync(dir).filter(f => f.startsWith('estatico-') && f.endsWith('.html') && f.includes(filtro));
  const browser = await chromium.launch();
  for (const arq of arquivos) {
    for (const f of formatos) {
      const page = await browser.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
      await page.goto('file://' + path.join(dir, arq) + f.query, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const destino = path.join(out, arq.replace('.html', `-${f.nome}.png`));
      await page.screenshot({ path: destino, clip: { x: 0, y: 0, width: f.w, height: f.h } });
      console.log('ok', path.relative(dir, destino));
      await page.close();
    }
  }
  await browser.close();
})();
