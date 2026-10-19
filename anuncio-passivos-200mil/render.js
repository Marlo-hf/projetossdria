// node render.js preview t1 t2 ...  |  node render.js frames <worker> <workers>  (writes frames/%05d.jpg)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  const tl = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8'));
  // ES modules need http://, so serve this folder locally
  const http = require('http'), types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
  const server = http.createServer((q, s) => fs.readFile(path.join(__dirname, decodeURIComponent(q.url.split('?')[0])), (e, d) => {
    if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(q.url)] || 'application/octet-stream' }); s.end(d); }));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e); process.exit(1); });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__3dReady);
  await page.evaluate(tl => { window.setTimeline(tl); return document.fonts.ready; }, tl);
  const dir = path.join(__dirname, mode === 'preview' ? 'prev' : 'frames'); fs.mkdirSync(dir, { recursive: true });
  if (mode === 'preview') {
    for (const t of rest) { await page.evaluate(t => renderFrame(t), +t); await page.screenshot({ path: path.join(dir, `t${t}.png`) }); }
  } else {
    const [w, n] = rest.map(Number), sub = tl.fps, total = Math.ceil(tl.total * sub);
    for (let f = w; f < total; f += n) {
      await page.evaluate(([t, f]) => renderFrame(t, f), [f / sub, f]);
      await page.screenshot({ path: path.join(dir, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 94 });
      if (f % 300 < n) console.log(`w${w} frame ${f}/${total}`);
    }
  }
  await browser.close(); server.close();
})();
