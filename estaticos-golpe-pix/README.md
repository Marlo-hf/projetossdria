# Estáticos — "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)

Criativos estáticos para anúncios (Meta Ads) de escritório de direito bancário, com os logos do Santander e do Itaú ao fundo.

## Arquivos prontos (`png/`)

| Conceito | Feed 4:5 (1080×1350) | Stories/Reels 9:16 (1080×1920) |
|---|---|---|
| 01 · Noturno: fundo escuro, logos iluminados atrás da pessoa + notificação de PIX | `01-noturno-feed.png` | `01-noturno-stories.png` |
| 02 · Alerta: fundo amarelo de alerta, logos como adesivos, faixa preta com CTA | `02-alerta-feed.png` | `02-alerta-stories.png` |
| 03 · Split: metade vermelha Santander / metade laranja Itaú, pessoa no centro | `03-split-feed.png` | `03-split-stories.png` |

A foto (`assets/foto/pessoa.png`) foi gerada por IA (pessoa fictícia) e recortada do fundo.
Nos Stories, título e CTA ficam dentro das zonas seguras.

## Como editar e gerar de novo

1. Edite o bloco `CONFIG` no topo de `build.js` (nome do escritório, OAB, textos, CTA).
2. Rode `node build.js` (precisa do Playwright com Chromium).

## Cuidados antes de subir

- **OAB (Provimento 205/2021):** o texto é informativo, sem promessa de resultado nem "recupere seu dinheiro". Mantenha assim.
- **Marcas de terceiros:** o rodapé avisa que o escritório não tem vínculo com os bancos. Não remova; a Meta pode reprovar anúncios que pareçam vir do próprio banco.
- Logos: arquivos do Wikimedia Commons (`assets/logos/`). As marcas pertencem aos seus titulares.
