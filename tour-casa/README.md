# Tour da casa — vídeo para anúncio

Vídeo de tour gerado a partir das 14 fotos do imóvel (WhatsApp, 04/11/2026).

| Arquivo | Uso |
|---|---|
| `tour-casa_reels_9x16.mp4` | Reels, Stories, TikTok, anúncio Meta vertical (1080x1920, 65s) |
| `tour-casa_feed_16x9.mp4` | YouTube, portais de imóveis, feed horizontal (1920x1080, 65s) |
| `legendas.srt` | Legenda da narração (para subir como legenda fechada) |

## O que foi usado de IA
- **Movimento de câmera 3D**: profundidade estimada em cada foto com Depth Anything V2 (ONNX); a câmera se move com parallax (o que está perto se move mais que o fundo).
- **Narração**: ElevenLabs, voz `ycxdm1PRMs962FxyyuJ0` (Otto de La Luna), modelo eleven_v4; cortada frase a frase com tempos de palavra do Whisper.
- **Câmera em primeira pessoa (v2)**: `scripts/render2.py` simula alguém andando pela casa: avança pelo cômodo, balanço leve dos passos, vira o olhar para os lados e "atravessa" para o próximo ambiente. Mínimo de ~4s por cômodo.
- Trilha e efeitos sonoros sintetizados (livres de direitos), com a música abaixando sob a voz. Áudio final em -14 LUFS.

## Recriar
1. `scripts/depth.py <modelo.onnx> <pasta_fotos>` — mapas de profundidade (`imgNN.jpg` → `imgNN_depth.npy`)
2. `scripts/tts.py` — uma narração por linha de `scripts/lines.txt` (`vo/lN.wav`)
3. `scripts/render2.py` (v2, caminhada) ou `scripts/render.py <fotos> <vo> <saida.mp4> vertical|horizontal`
4. `scripts/audio.py <saida.mp4.json> <vo> mix.wav` e juntar com ffmpeg (`loudnorm=I=-14`).
