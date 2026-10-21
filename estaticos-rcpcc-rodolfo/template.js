// DNA do anúncio campeão da conta (AD01 "Dr Rodolfo 1"): foto do Dr. Rodolfo + caixa de gancho + legendas pretas com bolinhas.
const dot = c => `<i class="dot ${c}"></i>`;
module.exports = ({ formato, pre, palavra, pos, bullets, cta }) => {
  const story = formato === 'story';
  const H = story ? 1920 : 1350;
  // feed: sobe a foto 120px para caber o texto abaixo do rosto
  const imgY = story ? -40 : -190;
  const fadeA = story ? 800 : 600, fadeB = story ? 990 : 800;
  const topo = story ? 1010 : 750;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Nunito:wght@700;800;900&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:${H}px}
body{position:relative;overflow:hidden;background:#0b0b0d;font-family:Nunito,sans-serif;-webkit-font-smoothing:antialiased}
.foto{position:absolute;left:0;top:${imgY}px;width:1080px;height:1920px;background:url(rodolfo.jpg) center top/1080px 1920px no-repeat}
.fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) ${fadeA}px,#08080a ${fadeB}px,#08080a 100%)}
.vig{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 25%,transparent 55%,rgba(0,0,0,.45))}
.tag{position:absolute;left:50%;top:${story ? 120 : 56}px;transform:translateX(-50%);background:#ffd400;color:#111;font-weight:900;font-size:${story ? 34 : 30}px;letter-spacing:.02em;padding:12px 28px;border-radius:10px;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.bloco{position:absolute;left:0;right:0;top:${topo}px;display:flex;flex-direction:column;align-items:center}
.hook{width:${story ? 820 : 800}px;text-align:center;padding:${story ? '24px 26px 26px' : '16px 24px 18px'};border-radius:6px;color:#fff;
 background:repeating-linear-gradient(90deg,#0d0d0f 0 22px,#16161a 22px 26px);border:2px solid #222;box-shadow:0 20px 50px rgba(0,0,0,.6)}
.hook .a,.hook .c{font-size:${story ? 38 : 31}px;font-weight:700;line-height:1.2;white-space:nowrap}
.hook b{font-weight:900}
.hook .w{display:block;font-family:Anton,sans-serif;color:#ffd400;font-size:${story ? 124 : 96}px;line-height:1.02;letter-spacing:.01em;margin:4px 0 6px;white-space:nowrap;text-shadow:0 4px 0 rgba(0,0,0,.4)}
.lst{margin-top:${story ? 34 : 18}px;display:flex;flex-direction:column;gap:${story ? 18 : 12}px;width:${story ? 860 : 860}px}
.li{display:flex;align-items:center;gap:20px}
.dot{flex:none;width:${story ? 62 : 50}px;height:${story ? 62 : 50}px;border-radius:50%;box-shadow:inset -6px -8px 14px rgba(0,0,0,.35),inset 6px 6px 12px rgba(255,255,255,.35),0 6px 16px rgba(0,0,0,.5)}
.r{background:radial-gradient(circle at 35% 30%,#ff6a5a,#e00000 55%,#8a0000)}
.y{background:radial-gradient(circle at 35% 30%,#fff38a,#ffd000 55%,#c79200)}
.g{background:radial-gradient(circle at 35% 30%,#3ad07a,#0f8a3c 55%,#0a4f6e)}
.li span{flex:1;text-align:center;background:#000;color:#fff;font-weight:800;font-size:${story ? 40 : 32}px;line-height:1.16;padding:${story ? '12px 18px 14px' : '8px 16px 10px'};border-radius:14px;box-decoration-break:clone}
.cta{margin-top:${story ? 44 : 26}px;color:#fff;font-weight:900;font-size:${story ? 36 : 28}px;letter-spacing:.02em;display:flex;align-items:center;gap:14px;opacity:.95}
.cta em{font-style:normal;background:#ffd400;color:#111;padding:6px 16px;border-radius:8px}
.leg{position:absolute;left:0;right:0;bottom:${story ? 56 : 16}px;text-align:center;color:rgba(255,255,255,.5);font-size:${story ? 20 : 15}px;font-weight:700}
</style></head><body>
<div class="foto"></div><div class="vig"></div><div class="fade"></div>
<div class="tag">DÍVIDA NO BANCO ACIMA DE R$ 40 MIL</div>
<div class="bloco">
 <div class="hook"><div class="a">${pre}</div><span class="w">${palavra}</span><div class="c">${pos}</div></div>
 <div class="lst">${bullets.map((t, i) => `<div class="li">${dot(['r', 'y', 'g'][i])}<span>${t}</span></div>`).join('')}</div>
 <div class="cta">${cta}</div>
</div>
<div class="leg">Dr. Rodolfo Pino Clivatti · Advogado · Conteúdo informativo, cada caso é analisado individualmente</div>
</body></html>`;
};
