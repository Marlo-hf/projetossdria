const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const n of [1,2,3]){await p.goto('file://'+__dirname+`/estatico-${n}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:__dirname+`/estatico-${n}.png`});}
await b.close();})();
