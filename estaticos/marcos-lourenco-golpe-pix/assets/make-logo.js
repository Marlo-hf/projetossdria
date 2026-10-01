// Gera assets/logo.png: logo recortado e com fundo azul removido (transparente).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b64 = fs.readFileSync(path.join(__dirname, 'logo-original.png')).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    const bg = [p[0], p[1], p[2]];
    let minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
    for (let i = 0; i < p.length; i += 4) {
      const lum = (p[i] + p[i+1]) / 2 - (bg[0] + bg[1]) / 2; // gold is high in R/G, navy is not
      const a = Math.max(0, Math.min(255, (lum - 25) * 3));
      p[i+3] = a;
      if (a > 40) { const k = i / 4, px = k % c.width, py = (k / c.width) | 0;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
    }
    x.putImageData(d, 0, 0);
    const pad = 6, w = maxX - minX + pad * 2, h = maxY - minY + pad * 2;
    const o = document.createElement('canvas'); o.width = w * 2; o.height = h * 2;
    const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
    ox.drawImage(c, minX - pad, minY - pad, w, h, 0, 0, w * 2, h * 2);
    return o.toDataURL('image/png');
  }, 'data:image/png;base64,' + b64);
  fs.writeFileSync(path.join(__dirname, 'logo.png'), Buffer.from(out.split(',')[1], 'base64'));
  await browser.close();
  console.log('ok');
})();
