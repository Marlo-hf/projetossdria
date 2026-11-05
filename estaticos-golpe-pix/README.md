# Estáticos — "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)

Criativos estáticos para anúncios (Meta Ads) de escritório de direito bancário, com os logos do Santander e do Itaú ao fundo.

## Arquivos prontos (`png/`)

| Conceito | Feed 4:5 (1080×1350) | Stories/Reels 9:16 (1080×1920) |
|---|---|---|
| 01 · Noturno: fundo escuro, blocos 3D do Santander e do Itaú + celular com comprovante de PIX suspeito | `01-noturno-feed.png` | `01-noturno-stories.png` |
| 02 · Alerta: fundo amarelo com faixa de perigo, celular com os logos colados como adesivos | `02-alerta-feed.png` | `02-alerta-stories.png` |
| 03 · Formulário: split vermelho/laranja, logos grandes e o formulário sendo preenchido | `03-formulario-feed.png` | `03-formulario-stories.png` |

Sem fotos de pessoas. CTA: "Preencha o formulário" (anúncio de cadastro / formulário instantâneo da Meta).
Nos Stories, título e CTA ficam dentro das zonas seguras.

## Como editar e gerar de novo

1. Edite o bloco `CONFIG` no topo de `build.js` (nome do escritório, OAB, textos, CTA).
2. Rode `node build.js` (precisa do Playwright com Chromium).

## Cuidados antes de subir

- **OAB (Provimento 205/2021):** o texto é informativo, sem promessa de resultado nem "recupere seu dinheiro". Mantenha assim.
- **Marcas de terceiros:** o rodapé avisa que o escritório não tem vínculo com os bancos. Não remova; a Meta pode reprovar anúncios que pareçam vir do próprio banco.
- Logos: arquivos do Wikimedia Commons (`assets/logos/`). As marcas pertencem aos seus titulares.
