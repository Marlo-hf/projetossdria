# Estáticos — Dívida Bancária Empresarial

4 criativos estáticos (1080×1350, feed 4:5) para Meta Ads, voltados ao **empresário endividado com banco** (capital de giro, cheque especial, cartão PJ) que quer resolver agora. A linguagem é direta, com elementos que param o scroll.

| # | Arquivo | Gancho | CTA |
|---|---------|--------|-----|
| 01 | `png/01-celular-notificacoes.png` | "Empresário, seu celular tá assim?": tela bloqueada com notificações de bloqueio judicial, parcela em atraso e protesto | Preencha o formulário |
| 02 | `png/02-madrugada-fazendo-conta.png` | Relógio "03:47" e post-it com as contas da semana: "Mais uma noite fazendo conta pra pagar o banco?" | Preencha o formulário |
| 03 | `png/03-carimbo-em-atraso.png` | Papéis com carimbos EM ATRASO / PROTESTO / EXECUÇÃO: "A dívida da sua empresa virou uma bola de neve?" (fundo claro, contrasta no feed) | Preencha o formulário |
| 04 | `png/04-conversa-gerente.png` | Conversa com o gerente pedindo o imóvel como garantia: "Seu gerente mandou isso? Não assine ainda." (fundo amarelo) | Preencha o formulário |

## Copies para o Meta

Ver [`COPIES-META.md`](COPIES-META.md): textos principais (longo e curto), títulos, descrição e texto do formulário instantâneo para cada estático.

## Antes de publicar

- As artes não levam nome do escritório nem número da OAB (prontas para qualquer cliente). O CTA de todas é "Preencha o formulário", pensado para campanhas de formulário instantâneo.
- Provimento 205/2021 da OAB: as artes não prometem resultado, não citam percentuais de redução e trazem "Situação ilustrativa. Cada caso exige análise individual." Mantenha esse padrão na copy.

## Editar e renderizar

HTML + `style.css` (cores em `:root`; fontes Anton, Inter e Caveat via Google Fonts). Depois de editar:

```bash
NODE_PATH=/opt/node-tools/node_modules node render.js
```
