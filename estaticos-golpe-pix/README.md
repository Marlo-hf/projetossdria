# Estáticos — "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)

Criativos estáticos para anúncios (Meta Ads) de escritório de direito bancário, com os logos do Santander e do Itaú ao fundo.

## Arquivos prontos (`png/`)

Linha "feito à mão", para não parecer peça de IA: papel com textura, marca-texto, caneta, caderno pautado e texto nativo de Stories sobre foto real de objetos (sem pessoas).
CTA em todos: "Preencha o formulário abaixo".

| Conceito | Feed 4:5 (1080×1350) | Stories 9:16 (1080×1920) |
|---|---|---|
| 01 · Marca-texto: logos recortados e circulados à caneta, "foi em um desses?", prazo de 80 dias do MED | `01-marca-texto-feed.png` | `01-marca-texto-stories.png` |
| 02 · Stories nativo: foto da mesa à noite (extrato, comprovantes), texto e adesivos no estilo do Instagram | `02-stories-nativo-feed.png` | `02-stories-nativo-stories.png` |
| 03 · Caderno: checklist manuscrito, só falta "falar com um advogado" (circulado) | `03-caderno-feed.png` | `03-caderno-stories.png` |

Foto de fundo (`assets/foto/mesa.jpg`): gerada por IA, só objetos. Prazo de 80 dias do MED verificado em bcb.gov.br.
`node build.js` avisa se algum texto estourar a área segura.

## Como editar e gerar de novo

1. Edite o bloco `CONFIG` no topo de `build.js` (nome do escritório, OAB, textos, CTA).
2. Rode `node build.js` (precisa do Playwright com Chromium).

## Cuidados antes de subir

- **OAB (Provimento 205/2021):** a urgência vem de dados reais (prazo do MED, Súmula 479), sem promessa de resultado nem "recupere seu dinheiro". Mantenha assim.
- **Marcas de terceiros:** o rodapé avisa que o escritório não tem vínculo com os bancos. Não remova; a Meta pode reprovar anúncios que pareçam vir do próprio banco.
- Logos: arquivos do Wikimedia Commons (`assets/logos/`). As marcas pertencem aos seus titulares.
