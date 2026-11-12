# Estáticos: Gestão de Passivo PJ (Pimentel Advocacia)

Dois estáticos para a conta **CA - Gestão de Passivo PJ**, focados em empresário com dor alta: dívida já atrasada, cobrança apertando, risco de execução.
Identidade igual à dos estáticos que já rodam (vermelho/preto/creme, Oswald + Poppins, "Dívida acima de R$ 200 mil", aviso de que não há garantia de resultado).

| Peça | Feed 4:5 (1080×1350) | Stories/Reels 9:16 (1080×1920) |
|---|---|---|
| 01: Notificações | `estatico-01-notificacoes-4x5.png` | `estatico-01-notificacoes-9x16.png` |
| 02: Refém do banco | `estatico-02-refem-do-banco-4x5.png` | `estatico-02-refem-do-banco-9x16.png` |

## 01: "Seu celular amanheceu assim?"
**Ângulo:** quebra de padrão. A pessoa vê a própria manhã: atraso do capital de giro, gerente ameaçando, protesto e o pedido de bloqueio das contas em destaque. Quem já está nesse ponto se reconhece na hora.

- **Título:** Seu celular amanheceu assim?
- **Texto principal:**
  EMPRESÁRIO: parcela do capital de giro atrasada, gerente avisando que vai mandar pro jurídico, intimação de protesto chegando. Quando a cobrança chega nesse ponto, o próximo passo do banco costuma ser a execução: bloqueio das contas, penhora de bens e cobrança sobre sócios e avalistas. Quanto antes a estratégia for montada, mais espaço existe pra proteger o caixa da empresa. Existe a possibilidade de negociar a dívida com desconto. Dívida acima de R$ 200 mil. Cada caso é analisado individualmente. Preencha o formulário.

## 02: "Sua empresa virou refém do banco?"
**Ângulo:** autodiagnóstico. Um checklist já marcado (atraso, cheque especial como caixa, empréstimo pra pagar empréstimo, renegociação que só aumentou), seguido de "Marcou 2 ou mais?". Quem marca se qualifica sozinho.

- **Título:** Sua empresa virou refém do banco?
- **Texto principal:**
  EMPRESÁRIO: se a sua empresa pega empréstimo novo pra pagar o antigo, usa o cheque especial como caixa e cada renegociação deixa a dívida maior, ela virou refém do banco. Mais um crédito não resolve, só empurra a conta pra frente com juro em cima de juro. Com estratégia jurídica, existe a possibilidade de negociar a dívida antes que vire execução. Dívida acima de R$ 200 mil. Cada caso é analisado individualmente. Preencha o formulário.

## Cuidados (Provimento 205/2021 da OAB)
Não há promessa de resultado nem percentual de desconto. Toda a linguagem é de possibilidade ("existe a possibilidade de"), e o aviso "Cada caso é analisado individualmente. Não há garantia de resultado." aparece na arte.
As notificações do estático 01 usam remetentes genéricos ("Banco", "Gerente PJ"), sem marca de nenhum banco real.

## Como editar
Os fontes ficam em `src/` (HTML). Para mudar um texto ou o valor mínimo, edite o HTML e renderize de novo:

```bash
cd estaticos/thiago-pimentel/src
node render.js 1080 1350 4x5
node render.js 1080 1920 9x16
```
