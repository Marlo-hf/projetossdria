# Estáticos — Dívida Bancária Empresarial

4 criativos estáticos (1080×1350, feed 4:5) para Meta Ads, voltados ao **empresário endividado com banco** (capital de giro, cheque especial, cartão PJ) que quer resolver agora. A linguagem é direta, com elementos que param o scroll.

| # | Arquivo | Gancho | CTA |
|---|---------|--------|-----|
| 01 | `png/01-celular-notificacoes.png` | "Empresário, seu celular tá assim?": tela bloqueada com notificações de bloqueio judicial, parcela em atraso e protesto | Preencha o formulário |
| 02 | `png/02-madrugada-fazendo-conta.png` | Relógio "03:47" e post-it com as contas da semana: "Mais uma noite fazendo conta pra pagar o banco?" | Preencha o formulário |
| 03 | `png/03-carimbo-em-atraso.png` | Papéis com carimbos EM ATRASO / PROTESTO / EXECUÇÃO: "A dívida da sua empresa virou uma bola de neve?" (fundo claro, contrasta no feed) | Preencha o formulário |
| 04 | `png/04-conversa-gerente.png` | Conversa com o gerente pedindo o imóvel como garantia: "Seu gerente mandou isso? Não assine ainda." (fundo amarelo) | Preencha o formulário |

## Copy sugerida

**01** — *Título:* Sua dívida com o banco tem saída
Texto: Bloqueio de conta, parcela atrasada, aviso de protesto… Se a sua empresa está nessa situação, pegar outro empréstimo só empurra o problema. Preencha o formulário e fale com um especialista em dívida bancária empresarial.

**02** — *Título:* Chega de noites fazendo conta
Texto: Capital de giro, cheque especial, cartão da empresa: quando a dívida com o banco cresce mais rápido que o faturamento, é hora de ter estratégia jurídica. Clique e conte o seu caso.

**03** — *Título:* Antes do bloqueio, da execução ou do protesto
Texto: A dívida bancária da empresa vira bola de neve rápido. Quanto antes você agir, mais opções existem. Fale agora com um especialista.

**04** — *Título:* Não assine a renegociação sem orientação
Texto: Muitas renegociações exigem imóvel ou aval dos sócios como garantia. Antes de colocar seu patrimônio em risco, entenda as alternativas com um advogado especialista.

## Antes de publicar

- As artes não levam nome do escritório nem número da OAB (prontas para qualquer cliente). O CTA de todas é "Preencha o formulário", pensado para campanhas de formulário instantâneo.
- Provimento 205/2021 da OAB: as artes não prometem resultado, não citam percentuais de redução e trazem "Situação ilustrativa. Cada caso exige análise individual." Mantenha esse padrão na copy.

## Editar e renderizar

HTML + `style.css` (cores em `:root`; fontes Anton, Inter e Caveat via Google Fonts). Depois de editar:

```bash
NODE_PATH=/opt/node-tools/node_modules node render.js
```
