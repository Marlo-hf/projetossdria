const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const n of ['gpix','rcpcc']){await p.goto('file://'+__dirname+`/${n}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:__dirname+`/salgado-${n}-1080x1350.png`});}
await b.close();})();
