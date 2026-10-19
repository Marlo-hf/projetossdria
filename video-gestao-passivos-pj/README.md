# Vídeo — Gestão de Passivos PJ (Reels/TikTok 9:16)

`gestao-passivos-pj.mp4`: 1080×1920, 30 fps, 62 s, narração neural pt-BR + trilha e efeitos sintetizados (sem direitos autorais de terceiros).

Para regenerar (requer ffmpeg, `pip install edge-tts`, Playwright):

1. `python3 tts.py "<texto>" pt-BR-AntonioNeural audio/<id>.mp3 +8%` para cada cena de `script.json`
2. `python3 build_audio.py` → `timeline.json` + `mix.wav`
3. `node render.js video saida.mp4` (ou `node render.js preview 5 12.5` para quadros soltos)
