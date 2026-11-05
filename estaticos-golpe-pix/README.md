# Estáticos — "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)

Criativos estáticos para anúncios (Meta Ads) de escritório de direito bancário, com os logos do Santander e do Itaú ao fundo.

## Arquivos prontos (`png/`)

| Conceito | Feed 4:5 (1080×1350) | Stories/Reels 9:16 (1080×1920) |
|---|---|---|
| 01 · Split: metade Santander, metade Itaú + painel escuro com bullets | `01-split-feed.png` | `01-split-stories.png` |
| 02 · Marca d'água: logos gigantes ao fundo, chamada grande e selos | `02-marca-dagua-feed.png` | `02-marca-dagua-stories.png` |
| 03 · Notificação: padrão de logos claro + card de PIX não reconhecido | `03-notificacao-feed.png` | `03-notificacao-stories.png` |

Nos Stories o conteúdo fica dentro das zonas seguras (250 px em cima, 300 px embaixo livres).

## Como editar e gerar de novo

1. Edite o bloco `CONFIG` no topo de `build.js` (nome do escritório, OAB, textos, CTA).
2. Rode `node build.js` (precisa do Playwright com Chromium).

## Cuidados antes de subir

- **OAB (Provimento 205/2021):** o texto é informativo, sem promessa de resultado nem "recupere seu dinheiro". Mantenha assim.
- **Marcas de terceiros:** o rodapé avisa que o escritório não tem vínculo com os bancos. Não remova; a Meta pode reprovar anúncios que pareçam vir do próprio banco.
- Logos: arquivos do Wikimedia Commons (`assets/logos/`). As marcas pertencem aos seus titulares.
