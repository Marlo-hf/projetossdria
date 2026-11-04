const {chromium}=require('playwright');const {spawn}=require('child_process');
const [,,dir,mode,out]=process.argv;
(async()=>{
 const b=await chromium.launch({args:['--allow-file-access-from-files']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto('file://'+dir+'/page.html',{waitUntil:'domcontentloaded',timeout:30000});
 await p.evaluate(()=>window.READY); console.log('ready');
 if(mode==='preview'){
   const ts=process.argv[5]?process.argv[5].split(',').map(Number):[1.5,4.8,7.3,8.3,11.6,14.4,16.3,19.0,21.5,23.5];
   for(const t of ts){await p.evaluate(t=>renderAt(t),t);await p.screenshot({path:`${out}/p_${t}.png`});}
 } else {
   const fps=30,N=Math.round(25.5*fps);
   const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',''+fps,'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','medium',out],{stdio:['pipe','inherit','inherit']});
   for(let i=0;i<N;i++){await p.evaluate(t=>renderAt(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:94});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150==0)console.log('frame',i);}
   ff.stdin.end(); await new Promise(r=>ff.on('close',r));
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
