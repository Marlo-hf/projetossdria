# Vídeo — Gestão de Passivos PJ (Reels/TikTok 9:16)

`gestao-passivos-pj.mp4`: 1080×1920, 30 fps, 65 s. Narração neural pt-BR (Thalita Multilingual), trilha e efeitos sintetizados (sem direitos de terceiros), legendas karaokê sincronizadas palavra a palavra, objetos 3D (Three.js, PBR) nas cenas de abertura, bola de neve e balança.

Para regenerar (ffmpeg, `pip install edge-tts`, Playwright):

1. `python3 tts.py "<texto da cena>" pt-BR-ThalitaMultilingualNeural audio/<id>.mp3 +3%` para cada cena de `script.json` (texto = campo `cap` sem os `|`)
2. `python3 build_audio.py` → `timeline.json` + `mix.wav`
3. `node render.js frames <i> 4` em 4 processos (60 subquadros/s) ou `node render.js preview 5 12.5`
4. `ffmpeg -framerate 60 -i frames/%05d.jpg -i mix.wav -vf fps=30 ... saida.mp4`
