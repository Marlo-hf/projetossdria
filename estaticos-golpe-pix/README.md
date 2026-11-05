# Estáticos — "Sofreu um golpe do PIX nesses bancos?" (Santander + Itaú)

Criativos estáticos para anúncios (Meta Ads) de escritório de direito bancário, com os logos do Santander e do Itaú ao fundo.

## Arquivos prontos (`png/`)

Tom sério e urgente: preto, vermelho e tipografia serifada. Logos do Santander e do Itaú ao fundo e em selos nítidos.
CTA em todos: "Preencha o formulário · Fale com um advogado ainda hoje".

| Conceito | Gatilho | Feed 4:5 (1080×1350) | Stories 9:16 (1080×1920) |
|---|---|---|---|
| 01 · Prazo 80 dias | Urgência: o MED tem prazo de 80 dias (Banco Central) | `01-prazo-80-dias-feed.png` | `01-prazo-80-dias-stories.png` |
| 02 · O banco negou? | Autoridade: Súmula 479 do STJ (texto literal) | `02-banco-negou-feed.png` | `02-banco-negou-stories.png` |
| 03 · Dinheiro sumiu | Perda: comprovante de PIX "concluído" + carimbo GOLPE | `03-dinheiro-sumiu-feed.png` | `03-dinheiro-sumiu-stories.png` |

Fontes dos dados: bcb.gov.br (MED: pedido em até 80 dias após o Pix) e STJ (Súmula 479).
`node build.js` avisa se algum texto estourar a área segura.

## Como editar e gerar de novo

1. Edite o bloco `CONFIG` no topo de `build.js` (nome do escritório, OAB, textos, CTA).
2. Rode `node build.js` (precisa do Playwright com Chromium).

## Cuidados antes de subir

- **OAB (Provimento 205/2021):** a urgência vem de dados reais (prazo do MED, Súmula 479), sem promessa de resultado nem "recupere seu dinheiro". Mantenha assim.
- **Marcas de terceiros:** o rodapé avisa que o escritório não tem vínculo com os bancos. Não remova; a Meta pode reprovar anúncios que pareçam vir do próprio banco.
- Logos: arquivos do Wikimedia Commons (`assets/logos/`). As marcas pertencem aos seus titulares.
