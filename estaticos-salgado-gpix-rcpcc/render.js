const { chromium } = require('playwright');
const only = process.argv.slice(2);
const all = ['gpix','rcpcc','gpix-02','gpix-03','rcpcc-02','rcpcc-03'];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const n of (only.length?only:all)){await p.goto('file://'+__dirname+`/${n}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:__dirname+`/salgado-${n}-1080x1350.png`});}
await b.close();})();
