# Estáticos — Gestão de Passivo Empresarial

4 criativos estáticos (1080×1350, feed 4:5) para Meta Ads de escritórios que captam **empresário (PJ) com dívida bancária**: capital de giro, cheque especial e cartão empresarial.

| # | Arquivo | Ângulo | CTA da arte |
|---|---------|--------|-------------|
| 01 | `png/01-trabalha-para-o-banco.png` | Dor: o faturamento indo para juros (gráfico) | Solicite uma análise do seu caso |
| 02 | `png/02-quatro-sinais.png` | Identificação: checklist de 4 sinais (fundo claro, contraste no feed) | Fale com um especialista |
| 03 | `png/03-cobrancas-no-contrato.png` | Revisão de contratos: extrato com cobranças questionáveis | Peça a revisão dos seus contratos |
| 04 | `png/04-proposta-do-gerente.png` | Comparação: renegociar sozinho × gestão de passivo | Solicite uma análise do seu caso |

## Copy sugerida (texto principal / título)

**01** — *Título:* Seu faturamento está pagando juros?
Texto: Se o cheque especial e o capital de giro viraram parte fixa do mês, a dívida da sua empresa precisa de estratégia, não de mais um empréstimo. Preencha o formulário e solicite uma análise do seu caso.

**02** — *Título:* Sua empresa tem algum desses sinais?
Texto: Parcelas que não diminuem, renegociações em sequência e limite usado como capital de giro são sinais de que o passivo bancário precisa de análise jurídica. Fale com um especialista.

**03** — *Título:* Revise os contratos antes de negociar
Texto: Juros acima do contratado, seguros embutidos e tarifas sem previsão podem aparecer em contratos bancários empresariais. Uma revisão técnica muda a base da negociação.

**04** — *Título:* Antes de assinar a renegociação
Texto: Aceitar a primeira proposta do banco costuma trazer encargos antigos para a nova dívida e exigir novas garantias. Entenda as alternativas da sua empresa antes de decidir.

## Antes de publicar

- Trocar `[NOME DO ESCRITÓRIO]`, `OAB/UF 00.000` e a letra do selo (`.mark`) pelos dados reais do cliente.
- As artes seguem o Provimento 205/2021 da OAB: tom informativo, sem promessa de resultado, sem percentuais de redução e com aviso de análise individual. Mantenha esse padrão na copy.

## Editar e renderizar

As artes são HTML + `style.css` (cores em `:root`). Depois de editar:

```bash
NODE_PATH=/opt/node-tools/node_modules node render.js
```

Requer Playwright com Chromium e acesso ao Google Fonts (Fraunces + Inter).
