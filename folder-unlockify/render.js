// Gera o PDF de impressão (com 3 mm de sangria) e as prévias PNG do folder.
// Uso: node render.js            (precisa do Playwright com Chromium)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'saida');
const MM = 96 / 25.4; // px por mm no Chromium

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const url = 'file://' + path.join(__dirname, 'folder.html');

  // 1) PDF de impressão: 2 páginas de 306 x 206 mm (30 x 20 cm + 3 mm de sangria)
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const bruto = path.join(OUT, '_bruto.pdf');
  await p.pdf({ path: bruto, printBackground: true, preferCSSPageSize: true });
  // textos convertidos em curvas (pedido comum das gráficas) — precisa do Ghostscript
  require('child_process').execFileSync('gs', ['-q', '-dBATCH', '-dNOPAUSE', '-dSAFER', '-sDEVICE=pdfwrite', '-dNoOutputFonts',
    '-dPassThroughJPEGImages=true', '-dAutoRotatePages=/None',
    '-sOutputFile=' + path.join(OUT, 'Folder-Unlockify-10x20-IMPRESSAO.pdf'), bruto]);
  fs.unlinkSync(bruto);

  // 2) PNGs de cada lado, já sem a sangria
  const s = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 3 });
  await s.goto(url, { waitUntil: 'networkidle' });
  await s.evaluate(() => { document.body.classList.add('no-guides'); return document.fonts.ready; });
  for (const id of ['fora', 'dentro']) {
    const box = await s.locator('#' + id).boundingBox();
    await s.screenshot({ fullPage: true,
      path: path.join(OUT, `lado-de-${id}.png`),
      clip: { x: box.x + 3 * MM, y: box.y + 3 * MM, width: 300 * MM, height: 200 * MM },
    });
  }

  // 3) prévia "como fica dobrado": capa, 1ª abertura, aberto inteiro e verso
  const W = 300, H = 200; // mm
  const crop = (img, x, w) => `<div class="pn" style="width:${w * 1.6}mm;height:${H * 1.6}mm;background:url(${img}) ${-x * 1.6}mm 0/${W * 1.6}mm ${H * 1.6}mm"></div>`;
  const fora = 'lado-de-fora.png', dentro = 'lado-de-dentro.png';
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#e9e9f4;font:600 26px Inter,Arial,sans-serif;color:#161826;padding:40px;display:flex;gap:46px;align-items:flex-start;width:max-content}
    .v{display:flex;flex-direction:column;gap:14px}.v span{letter-spacing:.02em}.v span b{color:#5d5294}
    .row{display:flex;box-shadow:0 18px 40px rgba(22,24,38,.28)}.pn{background-repeat:no-repeat}
    .row .pn+.pn{box-shadow:inset 6px 0 10px -6px rgba(0,0,0,.35)}</style>
    <div class="v"><span><b>1</b> · Capa (fechado)</span><div class="row">${crop(fora, 199, 101)}</div></div>
    <div class="v"><span><b>2</b> · Abriu a capa</span><div class="row">${crop(dentro, 0, 101)}${crop(fora, 0, 98)}</div></div>
    <div class="v"><span><b>3</b> · Aberto por inteiro</span><div class="row">${crop(dentro, 0, 101)}${crop(dentro, 101, 101)}${crop(dentro, 202, 98)}</div></div>
    <div class="v"><span><b>4</b> · Verso</span><div class="row">${crop(fora, 98, 101)}</div></div>`;
  fs.writeFileSync(path.join(OUT, '_mockup.html'), html);
  const m = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1.5 });
  await m.goto('file://' + path.join(OUT, '_mockup.html'), { waitUntil: 'load' });
  await m.screenshot({ path: path.join(OUT, 'como-fica-dobrado.jpg'), type: 'jpeg', quality: 90, fullPage: true });
  fs.unlinkSync(path.join(OUT, '_mockup.html'));

  await b.close();
  console.log('ok →', OUT);
})();
